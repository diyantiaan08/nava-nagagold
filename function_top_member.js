import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && typeof data === "object") return [data];
  return [];
}

export async function getTopMember({
  tgl_from,
  tgl_to,
  sort_by = "trx_count",
  kode_cabang_daftar = "ALL",
  token: tokenParam,
  baseUrl,
  incomingHeaders,
} = {}) {
  const BASE_URL = baseUrl || process.env.TKM_BASE_URL || "https://qc-cabang.nagatech.id";
  const from = tgl_from || dayjs().format("YYYY-MM-DD");
  const to = tgl_to || from;
  const payload = {
    tgl_from: from,
    tgl_to: to,
    sort_by,
    kode_cabang_daftar,
  };

  const url = `${BASE_URL}${API_PATHS.getTopMemberReport}`;
  const effectiveToken =
    (incomingHeaders && incomingHeaders["x-auth-token"]) || tokenParam || process.env.TKM_TOKEN || "";
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

  const rows = normalizeRows(data);
  const sortMap = {
    trx_count: "total_transaksi",
    trx_rp: "total_rp",
    trx_point: "total_point",
  };
  const sortKey = sortMap[sort_by] || "total_transaksi";
  const rankedRows = [...rows].sort((left, right) => Number(right[sortKey] || 0) - Number(left[sortKey] || 0));
  const top_member = rankedRows[0] || null;

  return {
    sort_by,
    top_member,
    rows: rankedRows,
  };
}

export default getTopMember;
