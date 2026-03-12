import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";
import { parseDatePhrase } from "./parseNaturalDate.js";

const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";

/**
 * Mengambil laporan margin penjualan untuk rentang tanggal.
 * @param {{ tgl_awal?: string, tgl_akhir?: string }} params
 * @returns {Promise<{ total_qty: number, total_berat: number, total_penjualan: number, total_margin: number, rows: any[] }>} 
 */
import fs from "fs";

export async function getMarginPenjualan({ tgl_awal, tgl_akhir, token: tokenParam, incomingHeaders } = {}) {
  let tglAwal = tgl_awal;
  let tglAkhir = tgl_akhir;

  // resolve natural-language date phrases
  if (tgl_awal && !/^\d{4}-\d{2}-\d{2}$/.test(tgl_awal)) {
    const parsed = parseDatePhrase(tgl_awal);
    if (parsed) {
      tglAwal = parsed.tgl_awal;
      // if parsed gives a range and user didn't supply tgl_akhir, use parsed end
      if (parsed.tgl_akhir && !tgl_akhir) tglAkhir = parsed.tgl_akhir;
    }
  }
  if (tgl_akhir && !/^\d{4}-\d{2}-\d{2}$/.test(tgl_akhir)) {
    const parsed = parseDatePhrase(tgl_akhir);
    if (parsed) tglAkhir = parsed.tgl_akhir || parsed.tgl_awal;
  }

  const tglAwalFinal = tglAwal || dayjs().format("YYYY-MM-DD");
  const tglAkhirFinal = tglAkhir || tglAwalFinal;
  const payload = {
    tgl_awal: tglAwalFinal,
    tgl_akhir: tglAkhirFinal,
    kode_group: "ALL",
    jenis_group: "ALL",
    valid_by: "ALL",
    type_laporan: "REKAP"
  };
  const tokenToUse = (incomingHeaders && incomingHeaders['x-auth-token']) || tokenParam || process.env.TKM_TOKEN || "";
  const url = `${BASE_URL}${API_PATHS.getMarginPenjualan}`;
  const headers = {};
  if (tokenToUse) headers["x-auth-token"] = tokenToUse;
  if (incomingHeaders) {
    if (incomingHeaders.cookie) headers.cookie = incomingHeaders.cookie;
    if (incomingHeaders.referer) headers.referer = incomingHeaders.referer;
    if (incomingHeaders.origin) headers.origin = incomingHeaders.origin;
  }
  try { fs.appendFileSync('/tmp/sse_debug.log', `function_margin_request:POST ${url} headers:${JSON.stringify({ x_auth_token: tokenToUse?`${String(tokenToUse).slice(0,6)}...`:null, cookie_names: headers.cookie?headers.cookie.split(';').map(s=>s.split('=')[0].trim()).join(','):null })}\n`); } catch(e){}
  const { data } = await axios.post(url, payload, { headers });
  // data expected to be array of rows
  let total_qty = 0;
  let total_berat = 0;
  let total_penjualan = 0;
  let total_margin = 0;
  if (Array.isArray(data)) {
    for (const row of data) {
      total_qty += Number(row.jumlah_qty || 0);
      total_berat += Number(row.total_berat || 0);
      total_penjualan += Number(row.total_dijual || 0);
      total_margin += Number(row.total_margin || 0);
    }
  }
  return { total_qty, total_berat, total_penjualan, total_margin, rows: data };
}
