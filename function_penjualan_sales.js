import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

/**
 * Ambil laporan penjualan per sales untuk rentang tanggal.
 * Mengembalikan array rows dan agregat per sales (qty, berat, rupiah)
 */
export async function getPenjualanSales({ uid, tgl_awal, tgl_akhir, type = "REKAP", status_baru = false, token: tokenParam, incomingHeaders } = {}) {
  const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const payload = {
    uid: uid || "",
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    type,
    status_baru,
    
  };

  const url = `${BASE_URL}${API_PATHS.getPenjualanSales}`;
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
    const responseData = err && err.response && err.response.data;
    if (status === 404 || status === 405) {
      try {
        const resp2 = await axios.get(urlWithToken, { params: payload, headers });
        data = resp2.data;
      } catch (fallbackErr) {
        const fallbackStatus = fallbackErr && fallbackErr.response && fallbackErr.response.status;
        const fallbackData = fallbackErr && fallbackErr.response && fallbackErr.response.data;
        if (fallbackStatus === 500 && /tidak ditemukan/i.test(String(fallbackData || ""))) {
          data = [];
        } else {
          throw fallbackErr;
        }
      }
    } else if (status === 500 && /tidak ditemukan/i.test(String(responseData || ""))) {
      data = [];
    } else {
      throw err;
    }
  }

  // normalize rows
  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (data && Array.isArray(data.data)) rows = data.data;
  else if (data && typeof data === 'object') rows = [data];

  // aggregate per sales
  const map = new Map();
  for (const r of rows) {
    const key = (r._id && (r._id.kode_sales || r._id)) || r.kode_sales || 'UNKNOWN';
    const qty = Number(r.qty || r.jumlah_qty || r.total_qty || 0);
    const berat = Number(r.berat || r.total_berat || r.berat_murni || 0);
    // prefer harga_total/harga_jual when available, fallback to pembayaran sum
    let rupiah = Number(r.harga_total || r.harga_jual || r.total_harga || 0);
    if (!rupiah && Array.isArray(r.pembayaran)) {
      for (const p of r.pembayaran) {
        rupiah += Number(p.jumlah_rp || p.jumlah || p.jumlah_in || 0);
      }
    }
    if (!map.has(key)) map.set(key, { kode_sales: key, qty: 0, berat: 0, rupiah: 0 });
    const cur = map.get(key);
    cur.qty += qty;
    cur.berat += berat;
    cur.rupiah += rupiah;
  }

  const aggregate = Array.from(map.values());

  return { rows, aggregate };
}
