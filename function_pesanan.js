import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

export async function getPesanan({
  tgl_from,
  tgl_to,
  valid_by = "ALL",
  status_pesanan = "ALL",
  token: tokenParam,
  incomingHeaders,
} = {}) {
  const BASE_URL = process.env.TKM_BASE_URL || "https://qc-cabang.nagatech.id";
  const from = tgl_from || dayjs().format("YYYY-MM-DD");
  const to = tgl_to || from;
  const payload = {
    tgl_from: from,
    tgl_to: to,
    valid_by,
    status_pesanan,
  };

  const url = `${BASE_URL}${API_PATHS.getPesananReport}`;
  const effectiveToken = (incomingHeaders && incomingHeaders["x-auth-token"]) || tokenParam || process.env.TKM_TOKEN || "";
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
    const resp = await axios.get(urlWithToken, { params: payload, headers });
    data = resp.data;
  } catch (error) {
    const status = error && error.response && error.response.status;
    if (status === 404 || status === 405) {
      const resp2 = await axios.post(urlWithToken, payload, { headers });
      data = resp2.data;
    } else {
      throw error;
    }
  }

  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (data && Array.isArray(data.data)) rows = data.data;
  else if (data && typeof data === "object") rows = [data];

  let total_qty = 0;
  let total_berat = 0;
  let total_rupiah = 0;

  for (const row of rows) {
    total_qty += Number(row.total_qty || row.qty || 0);
    total_berat += Number(row.total_berat || row.berat || 0);
    total_rupiah += Number(row.jumlah_bayar || row.total_harga || 0);
  }

  return { total_qty, total_berat, total_rupiah, rows };
}

export default getPesanan;
