import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

/**
 * Ambil laporan transaksi service untuk rentang tanggal.
 * Mengembalikan agregat: total_qty, total_berat, total_rp, dan rows.
 */
export async function getService({ tgl_awal, tgl_akhir, valid_by = "ALL", token: tokenParam, incomingHeaders } = {}) {
  const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const payload = {
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    valid_by,
    
  };

  const url = `${BASE_URL}${API_PATHS.getServiceReport}`;
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

  let total_qty = 0;
  let total_berat = 0;
  let total_rp = 0;

  for (const r of rows) {
    const details = Array.isArray(r.detail) ? r.detail : [];
    for (const d of details) {
      // sum dp_rp per detail (service)
      total_rp += Number(d.dp_rp || d.total || d.total_rp || 0);

      const items = Array.isArray(d.detail_barang) ? d.detail_barang : [];
      for (const it of items) {
        total_qty += Number(it.jumlah || it.qty || 0);
        total_berat += Number(it.berat || 0);
      }
    }
  }

  return { total_qty, total_berat, total_rp, rows };
}

export default getService;
