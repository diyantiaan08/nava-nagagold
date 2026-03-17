import axios from "axios";
import dayjs from "dayjs";
import { API_PATHS } from "./api_endpoints.js";
import { parseDatePhrase } from "./parseNaturalDate.js";

/**
 * Mengambil total stock_akhir dan berat_akhir berdasarkan Gudang.
 * @param {Object} params - { tanggal, gudang }
 * @returns {Promise<{total_stock: number, total_berat: number, gudang: string}>}
 */
import fs from "fs";

export async function getItem({ tanggal, gudang, token, baseUrl, incomingHeaders } = {}) {
	const BASE_URL = baseUrl || process.env.TKM_BASE_URL || "https://tkmputri.goldstore.id";
	const kode_gudang = gudang ? [gudang] : ["TOKO"];
	// resolve natural-language tanggal (e.g. "kemarin", "minggu lalu")
	let resolvedTanggal = tanggal;
	if (tanggal && !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
		const parsed = parseDatePhrase(tanggal);
		if (parsed) {
			// for stock queries, use the end of the parsed range (tgl_akhir)
			resolvedTanggal = parsed.tgl_akhir || parsed.tgl_awal;
		}
	}
	const payload = {
		tanggal: resolvedTanggal || dayjs().format("YYYY-MM-DD"),
		kode_dept: "ALL",
		kode_group: "ALL",
		kode_toko: "ALL",
		kode_gudang,
		kode_supplier_barang: "ALL",
		is_consignment: "ALL",
		is_consignment_barang: "ALL"
	};
	const url = `${BASE_URL}${API_PATHS.getSaldoBarang}`;
	// prefer incoming header token, then token param, then env
	const effectiveToken = (incomingHeaders && incomingHeaders['x-auth-token']) || token || process.env.TKM_TOKEN || "";
	const headers = {};
	if (effectiveToken) headers["x-auth-token"] = effectiveToken;
	if (incomingHeaders) {
		if (incomingHeaders.cookie) headers.cookie = incomingHeaders.cookie;
		if (incomingHeaders.referer) headers.referer = incomingHeaders.referer;
		if (incomingHeaders.origin) headers.origin = incomingHeaders.origin;
	}
	try {
		try { fs.appendFileSync('/tmp/sse_debug.log', `function_getItem_request:POST ${url} headers:${JSON.stringify({ x_auth_token: effectiveToken ? `${String(effectiveToken).slice(0,6)}...` : null, cookie_names: headers.cookie ? headers.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null })}\n`); } catch(e){}
		const { data } = await axios.post(url, payload, { headers });
		let total_stock = 0, total_berat = 0;
		for (const row of data) {
			if (row._id && row._id.kode_gudang === kode_gudang[0]) {
				total_stock += row.stock_akhir || 0;
				total_berat += row.berat_akhir || 0;
			}
		}
		try { fs.appendFileSync('/tmp/sse_debug.log', `function_getItem_result:${JSON.stringify({ tanggal: payload.tanggal, gudang: kode_gudang[0], total_stock, total_berat })}\n`); } catch(e){}
		return { total_stock, total_berat, gudang: kode_gudang[0] };
	} catch (err) {
		try { fs.appendFileSync('/tmp/sse_debug.log', `function_getItem_error:${err && err.message}:${JSON.stringify(err && err.response && err.response.data)}\n`); } catch(e){}
		throw err;
	}
}
