import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";
import fs from "fs";

const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";

/**
 * Ambil laporan transaksi penjualan untuk rentang tanggal.
 * Mengembalikan total qty, total berat, total rupiah dan rows mentah.
 * @param {{ tgl_awal?: string, tgl_akhir?: string, valid_by?: string, type?: string }} params
 */
export async function getPenjualanAnnual({ tgl_awal, tgl_akhir, valid_by = "ALL", type = "SEMUA", is_consignment = false, is_consignment_barang = "ALL", kode_marketplace = "SEMUA", kasir = "ALL", supplier_barang = "ALL", token: tokenParam, incomingHeaders = {}, useSSE = false } = {}) {
  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const tokenToUse = tokenParam || process.env.TKM_TOKEN || "";
  const payload = {
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    valid_by,
    type,
    is_consignment,
    is_consignment_barang,
    kode_marketplace,
    kasir,
    supplier_barang,
  };

  const url = `${BASE_URL}${API_PATHS.getPenjualanReport}`;
  const query = tokenToUse ? `?token=${encodeURIComponent(tokenToUse)}` : "";
  const urlWithToken = `${url}${query}`;
  const headers = {};
  if (tokenToUse) headers["x-auth-token"] = tokenToUse;
  // forward cookie and some common headers from incoming request if present
  if (incomingHeaders) {
    if (incomingHeaders.cookie) headers["cookie"] = incomingHeaders.cookie;
    if (incomingHeaders.cookie_header) headers["cookie"] = incomingHeaders.cookie_header;
    if (incomingHeaders.referer) headers["referer"] = incomingHeaders.referer;
    if (incomingHeaders.origin) headers["origin"] = incomingHeaders.origin;
  }

  if (useSSE) {
    // Lazy import EventSource for ESM compatibility
    const { createRequire } = await import('module');
    let EventSource;
    try {
      const req = createRequire(import.meta.url);
      const _es = req('eventsource');
      EventSource = _es.EventSource || _es.default || _es;
    } catch (err) {
      throw new Error('eventsource package not available. Install with `npm install eventsource`');
    }

    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        tgl_awal: tglAwal,
        tgl_akhir: tglAkhir,
        valid_by,
        type,
        is_consignment: String(is_consignment),
        is_consignment_barang,
        kode_marketplace,
        kasir,
        supplier_barang,
      });
      const sseUrl = `${url}?${params.toString()}`;
      try {
        const logObj = {
          stage: 'SSE_connect',
          sseUrl: sseUrl,
          headers: {
            x_auth_token: headers['x-auth-token'] ? `${String(headers['x-auth-token']).slice(0,6)}...` : null,
            cookie_names: incomingHeaders && incomingHeaders.cookie ? incomingHeaders.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null,
            origin: incomingHeaders && incomingHeaders.origin ? incomingHeaders.origin : null
          }
        };
        try { fs.appendFileSync('/tmp/sse_debug.log', `function_penjualan_sse:${JSON.stringify(logObj)}\n`); } catch(e){}
      } catch(e){}
      // pass headers to EventSource so server can reuse cookies/session
      const esOptions = { headers };
      const es = new EventSource(sseUrl, esOptions);
      let rows = [];
      let total_qty = 0;
      let total_berat = 0;
      let total_rupiah = 0;

      // server emits events named like 'report_penjualan' in sample
      es.addEventListener('report_penjualan', (e) => {
        try {
          const obj = JSON.parse(e.data);
          rows.push(obj);
          total_qty += Number(obj.qty || obj.jumlah_qty || 0);
          total_berat += Number(obj.berat || obj.berat_murni || 0);
          total_rupiah += Number(obj.harga_total || obj.harga_jual || obj.jumlah_rp || 0);
        } catch (err) {
          // ignore
        }
      });

      es.addEventListener('done', (e) => {
        try { es.close(); } catch (e) {}
        resolve({ total_qty, total_berat, total_rupiah, rows, done: e.data });
      });

      es.addEventListener('error', (err) => {
        try { es.close(); } catch (e) {}
        reject(err || new Error('SSE error'));
      });
    });
  }

  let data;
  try {
    // prefer GET with text response as some endpoints stream SSE
      try {
        try { fs.appendFileSync('/tmp/sse_debug.log', `function_penjualan_request:GET ${urlWithToken} headers:${JSON.stringify({ x_auth_token: headers['x-auth-token'] ? `${String(headers['x-auth-token']).slice(0,6)}...` : null, cookie: headers.cookie ? '[has_cookie]' : null })}\n`); } catch(e){}
      } catch(e){}
      const resp = await axios.get(urlWithToken, { params: payload, headers, responseType: 'text' });
    data = resp.data;
  } catch (err) {
    const status = err && err.response && err.response.status;
    if (status === 404 || status === 405) {
      const resp2 = await axios.post(urlWithToken, payload, { headers });
      data = resp2.data;
    } else {
      throw err;
    }
  }

  // normalize rows
  let rows = [];
  if (typeof data === 'string') {
    const lines = data.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonPart = trimmed.slice(5).trim();
        try {
          const obj = JSON.parse(jsonPart);
          rows.push(obj);
        } catch (e) {
          // ignore
        }
      }
    }
    // if still empty, try parse whole text as json
    if (rows.length === 0) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) rows = parsed;
        else if (parsed && Array.isArray(parsed.data)) rows = parsed.data;
        else if (parsed && typeof parsed === 'object') rows = [parsed];
      } catch (e) {}
    }
  } else if (Array.isArray(data)) rows = data;
  else if (data && Array.isArray(data.data)) rows = data.data;
  else if (data && typeof data === 'object') rows = [data];

  let total_qty = 0;
  let total_berat = 0;
  let total_rupiah = 0;
  for (const r of rows) {
    total_qty += Number(r.qty || r.jumlah_qty || 0);
    total_berat += Number(r.berat || r.berat_murni || 0);
    total_rupiah += Number(r.harga_total || r.harga_jual || r.jumlah_rp || 0);
  }

  return { total_qty, total_berat, total_rupiah, rows };
}
