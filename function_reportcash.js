import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

/**
 * Ambil laporan keuangan cash (rekap).
 * Params: kategori, tgl_from, tgl_to, user_id, user_login, is_sort
 * Returns { total_in, total_out, saldo_akhir, rows }
 */
export async function getReportCash({ kategori = "ALL", tgl_from, tgl_to, user_id = "ALL", user_login = "ALL", is_sort = false, token: tokenParam, baseUrl, incomingHeaders } = {}) {
  const BASE_URL = baseUrl || process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const from = tgl_from || dayjs().format("YYYY-MM-DD");
  const to = tgl_to || from;
  const payload = {
    kategori,
    tgl_from: from,
    tgl_to: to,
    user_id,
    user_login,
    is_sort,
    
  };

  const url = `${BASE_URL}${API_PATHS.getReportCash}`;
  const effectiveToken = (incomingHeaders && incomingHeaders['x-auth-token']) || tokenParam || process.env.TKM_TOKEN || "";
  const query = effectiveToken ? `?token=${encodeURIComponent(effectiveToken)}` : "";
  const urlWithToken = `${url}${query}`;
  const headers = {};
  if (effectiveToken) headers["x-auth-token"] = effectiveToken;
  if (incomingHeaders) {
    if (incomingHeaders.cookie) headers.cookie = incomingHeaders.cookie;
    if (incomingHeaders.referer) headers.referer = incomingHeaders.referer;
    if (incomingHeaders.origin) headers.origin = incomingHeaders.origin;
  }

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

  let total_in = 0;
  let total_out = 0;

  for (const r of rows) {
    total_in += Number(r.jumlah_in || r.jumlahMasuk || 0);
    total_out += Number(r.jumlah_out || r.jumlahKeluar || 0);
  }

  const saldo_akhir = total_in - total_out;

  return { total_in, total_out, saldo_akhir, rows };
}

export default getReportCash;
