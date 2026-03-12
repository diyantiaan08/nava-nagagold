import axios from "axios";
import dayjs from "dayjs";
import { createRequire } from 'module';
import { API_PATHS } from "./api_endpoints.js";

const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";

/**
 * Ambil laporan keuangan non-cash (transfer, debit, credit).
 * Params: tgl_from, tgl_to, type, jenis, no_rekening, valid_by, user_id
 * Returns { total_in, total_out, saldo_akhir, rows }
 */
export async function getReportNonCash({ tgl_from, tgl_to, type = "REKAP", jenis = "ALL", no_rekening = "ALL", valid_by = "ALL", user_id = "ALL", token: tokenParam, useSSE = false } = {}) {
  const from = tgl_from || dayjs().format("YYYY-MM-DD");
  const to = tgl_to || from;
  const tokenToUse = tokenParam || process.env.TKM_TOKEN || "";
  const payload = {
    tgl_from: from,
    tgl_to: to,
    type,
    jenis,
    no_rekening,
    valid_by,
    user_id
  };

  const url = `${BASE_URL}${API_PATHS.getReportNonCash}`;
  const query = tokenToUse ? `?token=${encodeURIComponent(tokenToUse)}` : "";
  const urlWithToken = `${url}${query}`;
  const headers = {};
  if (tokenToUse) headers["x-auth-token"] = tokenToUse;

  if (useSSE) {
    // Use Server-Sent Events to stream data; return a Promise resolved after 'done' event
    return new Promise((resolve, reject) => {
      let EventSource;
      try {
        // use createRequire imported at module top for ESM compatibility
        const req = createRequire(import.meta.url);
        const _es = req('eventsource');
        EventSource = _es.EventSource || _es.default || _es;
      } catch (err) {
        reject(new Error('eventsource package not available. Install with `npm install eventsource`'));
        return;
      }

      // build SSE URL with params
      const params = new URLSearchParams({
        tgl_from: from,
        tgl_to: to,
        type,
        jenis,
        no_rekening,
        valid_by,
        user_id,
        token: tokenToUse
      });
      const sseUrl = `${url}?${params.toString()}`;

      const es = new EventSource(sseUrl);
      let rows = [];
      let total_in = 0;
      let total_out = 0;

      es.addEventListener('report-non-cash', (e) => {
        try {
          const obj = JSON.parse(e.data);
          rows.push(obj);
          // exclude SALDO AWAL from incoming totals
          if (!obj.kategori || String(obj.kategori).toUpperCase() !== 'SALDO AWAL') {
            total_in += Number(obj.jumlah_in || obj.jumlah_in_fee || 0);
          }
          total_out += Number(obj.jumlah_out || 0);
        } catch (err) {
          // ignore parse errors
        }
      });

      es.addEventListener('done', (e) => {
        try { es.close(); } catch (e) {}
        const saldo_akhir = total_in - total_out;
        resolve({ total_in, total_out, saldo_akhir, rows, done: e.data });
      });

      es.addEventListener('error', (err) => {
        try { es.close(); } catch (e) {}
        reject(err || new Error('SSE error'));
      });
    });
  }

  let data;
  try {
    // prefer GET with params; some endpoints stream SSE text
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
    // try parse as SSE stream with lines like 'event: ...' and 'data: {...}'
    const lines = data.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonPart = trimmed.slice(5).trim();
        try {
          const obj = JSON.parse(jsonPart);
          rows.push(obj);
        } catch (e) {
          // ignore non-json data
        }
      } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) rows = parsed;
          else if (parsed && Array.isArray(parsed.data)) rows = parsed.data;
          else if (parsed && typeof parsed === 'object') rows = [parsed];
        } catch (e) {
          // ignore
        }
        break;
      }
    }
  } else if (Array.isArray(data)) rows = data;
  else if (data && Array.isArray(data.data)) rows = data.data;
  else if (data && typeof data === 'object') rows = [data];

  let total_in = 0;
  let total_out = 0;

  for (const r of rows) {
    // exclude SALDO AWAL when summing incoming amounts
    if (!r.kategori || String(r.kategori).toUpperCase() !== 'SALDO AWAL') {
      total_in += Number(r.jumlah_in || r.jumlah_in_fee || 0);
    }
    total_out += Number(r.jumlah_out || 0);
  }

  const saldo_akhir = total_in - total_out;

  return { total_in, total_out, saldo_akhir, rows };
}

export default getReportNonCash;
