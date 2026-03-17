import axios from "axios";
import dayjs from "dayjs";
import fs from "fs";
import { API_PATHS } from "./api_endpoints.js";

/**
 * Ambil laporan transaksi hutang untuk rentang tanggal.
 * Mengembalikan agregat: total_jumlah, total_berat, total_hutang, dan rows.
 */
export async function getHutang({ tgl_awal, tgl_akhir, valid_by = "ALL", type_tgl = "tgl_hutang", token, baseUrl, incomingHeaders } = {}) {
  const BASE_URL = baseUrl || process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const effectiveToken = token || process.env.TKM_TOKEN || "";
  const payload = {
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    valid_by,
    type_tgl
  };

  const url = `${BASE_URL}${API_PATHS.getHutangReport}`;
  const urlWithToken = url;
  const headers = {};
  // prefer incoming header token, fallback to env token
  if (incomingHeaders && incomingHeaders['x-auth-token']) headers["x-auth-token"] = incomingHeaders['x-auth-token'];
  else if (effectiveToken) headers["x-auth-token"] = effectiveToken;
  // forward cookie/referer/origin when available
  if (incomingHeaders) {
    if (incomingHeaders.cookie) headers.cookie = incomingHeaders.cookie;
    if (incomingHeaders.referer) headers.referer = incomingHeaders.referer;
    if (incomingHeaders.origin) headers.origin = incomingHeaders.origin;
  }

  try {
    const mask = (v) => {
      if (!v) return null;
      if (v.length <= 10) return v;
      return `${v.slice(0,6)}...${v.slice(-4)}`;
    };
    try { fs.appendFileSync('/tmp/sse_debug.log', `function_hutang_request:POST ${urlWithToken} headers:${JSON.stringify({ x_auth_token: mask(headers['x-auth-token']||headers['x_auth_token']||effectiveToken), cookie_names: headers.cookie ? headers.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null, referer: headers.referer||null, origin: headers.origin||null })}\n`); } catch(e){}
  } catch(e) {}

  let data;
  try {
    const resp = await axios.post(urlWithToken, payload, { headers });
    data = resp.data;
  } catch (err) {
    const status = err && err.response && err.response.status;
    if (status === 404 || status === 405) {
      const resp2 = await axios.get(urlWithToken, { params: payload, headers });
      data = resp2.data;
    } else {
      throw err;
    }
  }

  // normalize rows
  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (data && Array.isArray(data.data)) rows = data.data;
  else if (data && typeof data === 'object') rows = [data];

  let total_jumlah = 0;
  let total_berat = 0;
  let total_hutang = 0;

  for (const r of rows) {
    // jumlah: sum of item.jumlah in detail_barang
    const items = Array.isArray(r.detail_barang) ? r.detail_barang : [];
    for (const it of items) {
      total_jumlah += Number(it.jumlah || it.qty || 0);
    }

    // berat: prefer berat_total field, fallback to sum of item.berat
    const beratTotal = Number(r.berat_total || r.berat_emas || r.berat_total_nota || 0);
    if (beratTotal) total_berat += beratTotal;
    else {
      for (const it of items) {
        total_berat += Number(it.berat || 0);
      }
    }

    total_hutang += Number(r.jumlah_hutang || r.total_hutang || 0);
  }

  try { fs.appendFileSync('/tmp/sse_debug.log', `function_hutang_result:${JSON.stringify({ tgl_awal: tglAwal, tgl_akhir: tglAkhir, total_jumlah, total_berat, total_hutang, rows_len: rows.length })}\n`); } catch(e){}

  return { total_jumlah, total_berat, total_hutang, rows };
}

export default getHutang;

/**
 * Ambil laporan hutang lunas untuk rentang tanggal.
 * Mengembalikan agregat: total_jumlah, total_hutang_lunas, total_bunga_lunas, dan rows.
 */
export async function getHutangLunas({ tgl_awal, tgl_akhir, valid_by = "ALL", type_tgl = "tgl_lunas", berdasarkan = "ALL", token, baseUrl, incomingHeaders } = {}) {
  const BASE_URL = baseUrl || process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const effectiveToken = token || process.env.TKM_TOKEN || "";
  const payload = {
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    valid_by,
    type_tgl,
    berdasarkan
  };

  const url = `${BASE_URL}${API_PATHS.getHutangLunasReport}`;
  const urlWithToken = url;
  const headers = {};
  if (incomingHeaders && incomingHeaders['x-auth-token']) headers["x-auth-token"] = incomingHeaders['x-auth-token'];
  else if (effectiveToken) headers["x-auth-token"] = effectiveToken;
  if (incomingHeaders) {
    if (incomingHeaders.cookie) headers.cookie = incomingHeaders.cookie;
    if (incomingHeaders.referer) headers.referer = incomingHeaders.referer;
    if (incomingHeaders.origin) headers.origin = incomingHeaders.origin;
  }

  try { try { fs.appendFileSync('/tmp/sse_debug.log', `function_hutang_lunas_request:POST ${urlWithToken} headers:${JSON.stringify({ x_auth_token: effectiveToken ? `${String(effectiveToken).slice(0,6)}...` : null, cookie_names: headers.cookie ? headers.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null })}\n`); } catch(e){} } catch(e){}

  let data;
  try {
    const resp = await axios.post(urlWithToken, payload, { headers });
    data = resp.data;
  } catch (err) {
    const status = err && err.response && err.response.status;
    if (status === 404 || status === 405) {
      const resp2 = await axios.get(urlWithToken, { params: payload, headers });
      data = resp2.data;
    } else {
      throw err;
    }
  }

  // normalize rows
  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (data && Array.isArray(data.data)) rows = data.data;
  else if (data && typeof data === 'object') rows = [data];

  let total_jumlah = 0;
  let total_hutang_lunas = 0;
  let total_bunga_lunas = 0;

  for (const r of rows) {
    const details = Array.isArray(r.detail) ? r.detail : [];
    for (const d of details) {
      // sum jumlah from detail_barang
      const items = Array.isArray(d.detail_barang) ? d.detail_barang : [];
      for (const it of items) {
        total_jumlah += Number(it.jumlah || it.qty || 0);
      }

      total_hutang_lunas += Number(d.total_bayar || d.total_hutang_bunga || d.total || 0);
      total_bunga_lunas += Number(d.bunga_lunas || d.bunga || 0);
    }
  }

  return { total_jumlah, total_hutang_lunas, total_bunga_lunas, rows };
}
