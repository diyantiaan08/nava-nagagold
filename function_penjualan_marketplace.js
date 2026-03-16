import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

/**
 * Ambil laporan penjualan marketplace (online) untuk rentang tanggal.
 * Mengembalikan total qty, total berat, total rupiah dan rows mentah.
 */
export async function getPenjualanMarketplace({ tgl_from, tgl_to, marketplace = "SEMUA", kode_group = "ALL", jenis_group = "ALL", valid_by = "ALL", token: tokenParam, incomingHeaders } = {}) {
  const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const from = tgl_from || dayjs().format("YYYY-MM-DD");
  const to = tgl_to || from;
  const payload = {
    tgl_from: from,
    tgl_to: to,
    marketplace,
    kode_group,
    jenis_group,
    valid_by,
  };

  const url = `${BASE_URL}${API_PATHS.getPenjualanMarketplaces}`;
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
  let total_rupiah = 0;
  for (const r of rows) {
    total_qty += Number(r.qty || r.jumlah_qty || 0);
    total_berat += Number(r.berat || r.berat_murni || 0);
    total_rupiah += Number(r.harga_total || r.harga_dijual || r.total_dijual || 0);
  }

  return { total_qty, total_berat, total_rupiah, rows };
}
