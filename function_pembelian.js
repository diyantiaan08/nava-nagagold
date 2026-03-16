import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";

/**
 * Ambil laporan transaksi pembelian untuk rentang tanggal.
 * Mengembalikan total jumlah transaksi, total berat, total rupiah, dan rows.
 */
export async function getPembelian({ tgl_awal, tgl_akhir, group_by = "no_faktur_group", kode_group = "ALL", jenis_group = "ALL", kondisi = "ALL", barcode_option = "ALL", valid_by = "ALL", kode_sales = "ALL", is_consignment = "ALL", kode_harga = "ALL", token: tokenParam, incomingHeaders } = {}) {
  const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const payload = {
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    group_by,
    kode_group,
    jenis_group,
    kondisi,
    barcode_option,
    valid_by,
    kode_sales,
    is_consignment,
    kode_harga
  };
  const url = `${BASE_URL}${API_PATHS.getPembelianReport}`;
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

  // Aggregate: total count (no_faktur_beli), total_berat (detail.berat), total_rupiah (detail.harga)
  let total_count = 0;
  let total_berat = 0;
  let total_rupiah = 0;

  for (const r of rows) {
    // r.detail may be an array of items
    const details = Array.isArray(r.detail) ? r.detail : [];
    for (const d of details) {
      total_count += 1;
      total_berat += Number(d.berat || d.berat_nota || 0);
      total_rupiah += Number(d.harga || d.harga_nota || d.transfer_rp || 0);
    }
  }

  return { total_count, total_berat, total_rupiah, rows };
}

/**
 * Ambil laporan pembelian per sales (summarize by sales kode).
 * Params: tgl_awal, tgl_akhir, kode_sales, kode_group, valid_by, jenis_group
 * sortBy: 'qty'|'berat'|'harga' (default 'qty')
 */
export async function getPembelianSales({ tgl_awal, tgl_akhir, kode_sales = "ALL", kode_group = "ALL", valid_by = "ALL", jenis_group = "ALL", sortBy = "qty", token: tokenParam, incomingHeaders } = {}) {
  const BASE_URL = process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";

  const tglAwal = tgl_awal || dayjs().format("YYYY-MM-DD");
  const tglAkhir = tgl_akhir || tglAwal;
  const payload = {
    tgl_awal: tglAwal,
    tgl_akhir: tglAkhir,
    kode_sales,
    kode_group,
    valid_by,
    jenis_group
  };

  const url = `${BASE_URL}${API_PATHS.getPembelianSales}`;
  const effectiveToken = (incomingHeaders && incomingHeaders['x-auth-token']) || tokenParam || process.env.TKM_TOKEN || "";
  const headers = {};
  if (effectiveToken) headers["x-auth-token"] = effectiveToken;
  if (incomingHeaders) {
    if (incomingHeaders.cookie) headers.cookie = incomingHeaders.cookie;
    if (incomingHeaders.referer) headers.referer = incomingHeaders.referer;
    if (incomingHeaders.origin) headers.origin = incomingHeaders.origin;
  }

  let data;
  try {
    // HANYA kirim token di header, JANGAN di query string
    const resp = await axios.post(url, payload, { headers });
    data = resp.data;
  } catch (err) {
    const status = err && err.response && err.response.status;
    if (status === 404 || status === 405) {
      const resp2 = await axios.get(url, { params: payload, headers });
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

  // aggregate per sales
  const map = new Map();
  for (const r of rows) {
    const key = (r._id && (r._id.kode_sales || r._id)) || r.kode_sales || 'UNKNOWN';
    const nama = r.nama_sales || r.nama || '';
    const qty = Number(r.jumlah || r.qty || r.jumlah_qty || 0);
    const berat = Number(r.berat || r.total_berat || 0);
    const harga = Number(r.harga || r.jumlah_rp || r.total_harga || 0);

    if (!map.has(key)) map.set(key, { kode_sales: key, nama_sales: nama, jumlah: 0, berat: 0, harga: 0 });
    const cur = map.get(key);
    cur.jumlah += qty;
    cur.berat += berat;
    cur.harga += harga;
    if (!cur.nama_sales && nama) cur.nama_sales = nama;
  }

  let aggregate = Array.from(map.values());

  // sorting
  const by = (sortBy || 'qty').toLowerCase();
  if (by === 'berat') {
    aggregate.sort((a, b) => b.berat - a.berat);
  } else if (by === 'harga' || by === 'rp' || by === 'rupiah') {
    aggregate.sort((a, b) => b.harga - a.harga);
  } else {
    // default qty
    aggregate.sort((a, b) => b.jumlah - a.jumlah);
  }

  return { rows, aggregate };
}
