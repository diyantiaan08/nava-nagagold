import axios from "axios";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { parseDatePhrase } from "./parseNaturalDate.js";
import { functionDeclarations } from "./func_declaration.js";
import dayjs from "dayjs";
import fs from "fs";

// Helper: format ISO date to Indonesian human form, e.g. "3 Maret 2026"
function formatDateIndo(isoDate) {
	if (!isoDate) return "";
	const d = dayjs(isoDate);
	const months = [
		"Januari","Februari","Maret","April","Mei","Juni",
		"Juli","Agustus","September","Oktober","November","Desember"
	];
	return `${d.date()} ${months[d.month()]} ${d.year()}`;
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// Log keberadaan token pada saat start (jangan cetak token penuh)
try {
	const hasToken = !!process.env.TKM_TOKEN;
	const tokenPreview = hasToken ? `${String(process.env.TKM_TOKEN).slice(0,4)}...` : 'N/A';
	console.log(`TKM_TOKEN present: ${hasToken} preview:${tokenPreview}`);
	try { fs.appendFileSync('/tmp/sse_debug.log', `server_start:TKM_TOKEN_present=${hasToken}\n`); } catch(e){}
} catch (e) {
	// ignore
}

// Endpoint: /getitem
app.post("/getitem", async (req, res) => {
	try {
		const { tanggal, gudang, natural_date } = req.body;
		let tgl = tanggal;
		if (!tgl && natural_date) {
			const parsed = parseDatePhrase(natural_date);
			tgl = parsed ? parsed.tgl_awal : undefined;
		}
		const getItem = functionDeclarations.find(f => f.name === "getItem");
		if (!getItem) return res.status(500).json({ error: "getItem not found" });
		const result = await getItem.func({ tanggal: tgl, gudang });
		res.json(result);
	} catch (err) {
		const status = err && err.response && err.response.status;
		const body = err && err.response && err.response.data;
		res.status(500).json({ error: err.message, status, body });
	}
});

// Endpoint: /getpenjualan (programmatic access to penjualan totals)
app.post("/getpenjualan", async (req, res) => {
	try {
		const { tanggal_awal, tanggal_akhir } = req.body;
		let tgl_awal = tanggal_awal;
		let tgl_akhir = tanggal_akhir;
		if (!tgl_awal && req.body.natural_date) {
			const parsed = parseDatePhrase(req.body.natural_date);
			if (parsed) {
				tgl_awal = parsed.tgl_awal;
				tgl_akhir = parsed.tgl_akhir || parsed.tgl_awal;
			}
		}
		tgl_awal = tgl_awal || dayjs().format("YYYY-MM-DD");
		tgl_akhir = tgl_akhir || tgl_awal;
		const fn = functionDeclarations.find(f => f.name === "getPenjualanAnnual");
		if (!fn) return res.status(500).json({ error: "getPenjualanAnnual not found" });
		const incomingToken = req.body.token || req.headers['x-auth-token'] || req.query.token;
		const result = await fn.func({ tgl_awal, tgl_akhir, token: incomingToken });
		res.json(result);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Endpoint: /test/all - run all report functions once for verification
app.get("/test/all", async (req, res) => {
	const token = req.query.token || req.headers['x-auth-token'] || process.env.TKM_TOKEN;
	if (!token) return res.status(400).json({ error: 'missing token. provide ?token= or x-auth-token header or set TKM_TOKEN in .env' });
	const date = req.query.date || dayjs().format('YYYY-MM-DD');
	const incomingHeaders = req.headers || {};
	const candidates = [
		{ name: 'getItem', args: { tanggal: date } },
		{ name: 'getHutang', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getHutangLunas', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getMarginPenjualan', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getPembelian', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getPembelianSales', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getPenjualanMarketplace', args: { tgl_from: date, tgl_to: date } },
		{ name: 'getPenjualanSales', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getPenjualanAnnual', args: { tgl_awal: date, tgl_akhir: date } },
		{ name: 'getReportCash', args: { tgl_from: date, tgl_to: date } },
		{ name: 'getReportNonCash', args: { tgl_from: date, tgl_to: date } },
		{ name: 'getService', args: { tgl_awal: date, tgl_akhir: date } },
	];
	const out = {};
	for (const c of candidates) {
		const fn = functionDeclarations.find(f => f.name === c.name);
		if (!fn) { out[c.name] = { error: 'not found' }; continue; }
		try {
			const args = Object.assign({}, c.args, { token, incomingHeaders });
			const r = await safeCallGlobal(fn.func, args);
			out[c.name] = { ok: true, result: r };
		} catch (e) {
			if (e && e.message === 'AUTH_TERMINATED') {
				return res.status(401).json({ error: 'auth terminated by upstream', detail: 'invalid token' });
			}
			out[c.name] = { ok: false, error: e && e.message, stack: e && e.stack };
		}
	}
	res.json(out);
});

// Debug: call a single function and return stack on error
app.get('/debug/call', async (req, res) => {
	const name = req.query.fn;
	if (!name) return res.status(400).json({ error: 'missing fn param' });
	const fn = functionDeclarations.find(f => f.name === name);
	if (!fn) return res.status(404).json({ error: 'function not found' });
	const token = req.query.token || req.headers['x-auth-token'] || process.env.TKM_TOKEN;
	try {
		const r = await fn.func({ token, incomingHeaders: req.headers, ...(req.query.args ? JSON.parse(req.query.args) : {}) });
		res.json({ ok: true, result: r });
	} catch (e) {
		res.json({ ok: false, error: e && e.message, stack: e && e.stack });
	}
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});


// Prompt builder untuk multi-endpoint
function buildPrompt({ type, data, question }) {
	if (type === "stock") {
		// Format angka sesuai lokal Indonesia: ribuan dengan titik, desimal dengan koma
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const stockFormatted = nfInt.format(Number(data.total_stock || 0));
			const beratFormatted = nfDec.format(Number(data.total_berat || 0));
			const gudang = data.gudang || "-";
			return `\nBerikut data stock barang:\n- Total stock: ${stockFormatted} unit\n- Total berat: ${beratFormatted} gram\n- Gudang: ${gudang}\n\nJawab langsung dalam bahasa Indonesia, singkat, jelas, dan tidak dalam format tabel atau JSON. Jangan tampilkan proses berpikir atau bertanya balik. Saat menampilkan angka gunakan format lokal Indonesia (ribuan dengan titik, desimal dengan koma). Contoh jawaban: "Total stock hari ini: ${stockFormatted} unit (berat ${beratFormatted} gram) di gudang ${gudang}." Pertanyaan: \"${question}\"`;
		} catch (e) {
			return `\nBerikut data stock barang hari ini:\n- Total stock: ${data.total_stock}\n- Total berat: ${data.total_berat} gram\n- Gudang: ${data.gudang}\n\nJawab pertanyaan berikut dengan kalimat manusia yang jelas, singkat, dan tidak dalam format tabel atau JSON: \"${question}\"`;
		}
	}
	if (type === "margin_penjualan") {
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
			const qty = nfInt.format(Number(data.total_qty || 0));
			const berat = nfDec.format(Number(data.total_berat || 0));
			const penjualan = nfRupiah.format(Number(data.total_penjualan || 0));
			const margin = nfRupiah.format(Number(data.total_margin || 0));
			return `\nBerikut ringkasan margin penjualan:\n- Total qty: ${qty} unit\n- Total berat: ${berat} gram\n- Total penjualan: ${penjualan}\n- Total margin: ${margin}\n\nJawab langsung dalam bahasa Indonesia, singkat, jelas, dan tidak dalam format tabel atau JSON. Jangan tampilkan proses berpikir atau bertanya balik. Saat menampilkan angka gunakan format lokal Indonesia (ribuan dengan titik, desimal dengan koma, rupiah dengan format "Rp"). Contoh jawaban: "Total penjualan: ${penjualan}, margin: ${margin}, qty: ${qty}, berat: ${berat}." Pertanyaan: \"${question}\"`;
		} catch (e) {
			return question;
		}
	}
	// Tambahkan else if (type === "pembelian") { ... } dst untuk endpoint lain
	return question;
}

// Global safe call for non-SSE diagnostics: throws 'AUTH_TERMINATED' on 400/401
async function safeCallGlobal(fn, args) {
	try {
		return await fn(args);
	} catch (e) {
		const status = e && e.response && e.response.status;
		try { fs.appendFileSync('/tmp/sse_debug.log', `safeCallGlobal_error:${JSON.stringify({ fn: fn && fn.name ? fn.name : 'anonymous', status, message: e.message, data: e && e.response && e.response.data })}\n`); } catch(ex){}
		if (status === 400 || status === 401) throw new Error('AUTH_TERMINATED');
		throw e;
	}
}

// Endpoint: /stream/ask (SSE)
app.get("/stream/ask", async (req, res) => {
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders && res.flushHeaders();

		const question = req.query.question || "";
		const systemPrompt =
			"Kamu adalah AI asisten bagi owner toko emas untuk mendapatkan data pada program toko emas yang dimiliki owner tersebut. Jawab langsung dalam bahasa Indonesia dengan kalimat yang ramah dan jelas. Jangan tampilkan proses berpikir (no chain-of-thought), jangan tanya balik, dan jangan output JSON atau tabel. Format angka sesuai lokal Indonesia (ribuan pakai titik, desimal pakai koma, rupiah pakai format rupiah). Jika pertanyaan membutuhkan data, gunakan data yang diberikan oleh backend dan masukkan ke jawaban. Jika tidak tahu jawab dengan jujur.";

	res.write(`event: thinking\ndata: <think>\n\n`);

	let userPrompt = question;
	let promptType = null;
	let promptData = null;
	let promptMeta = {};
	// Parse dates once for reuse
	const parsedCommon = parseDatePhrase(question);

	// Helper: safeCall wraps function calls and handles auth errors by
	// sending a clear SSE message and terminating the stream if token invalid.
	async function safeCall(fn, args) {
		try {
			return await fn(args);
		} catch (e) {
			const status = e && e.response && e.response.status;
			try { fs.appendFileSync('/tmp/sse_debug.log', `safeCall_error:${JSON.stringify({ fn: fn && fn.name ? fn.name : 'anonymous', status, message: e.message, data: e && e.response && e.response.data })}\n`); } catch(ex){}
			if (status === 400 || status === 401) {
				const msg = 'Maaf, server data menolak akses (token tidak valid atau kedaluwarsa). Silakan login ulang dan pastikan token dikirim lewat `?token=` atau header `x-auth-token`.';
				res.write(`data: ${msg}\n\n`);
				res.write(`event: done\ndata: {"status":"done"}\n\n`);
				res.end();
				// throw sentinel to stop further processing in caller
				throw new Error('AUTH_TERMINATED');
			}
			throw e;
		}
	}

	// Deteksi topik pertanyaan dan ambil data jika perlu
	if (/stock|stok|jumlah|barang/i.test(question)) {
		promptType = "stock";
		console.log('SSE detect -> stock');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:stock\n`); } catch(e){}
		try {
			let tanggal = dayjs().format("YYYY-MM-DD");
			if (parsedCommon && parsedCommon.tgl_awal) tanggal = parsedCommon.tgl_awal;
			const getItem = functionDeclarations.find(f => f.name === "getItem");
			if (getItem) {
				const incomingToken = req.query.token || req.headers['x-auth-token'] || process.env.TKM_TOKEN;
				const incomingHeaders = req.headers || {};
				try { fs.appendFileSync('/tmp/sse_debug.log', `forward_headers_getItem:${JSON.stringify({ token_query: incomingToken ? `${String(incomingToken).slice(0,6)}...` : null, x_auth_token: incomingHeaders['x-auth-token'] ? `${String(incomingHeaders['x-auth-token']).slice(0,6)}...` : null, cookie_names: incomingHeaders.cookie ? incomingHeaders.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null })}\n`); } catch(e){}
				// If no token at all, respond with clear SSE message
				if (!incomingToken) {
					const msg = 'Maaf, token tidak tersedia. Untuk mengakses data, sertakan token lewat query `?token=...` atau header `x-auth-token`, atau set TKM_TOKEN di .env dan restart server.';
					res.write(`data: ${msg}\n\n`);
					res.write(`event: done\ndata: {"status":"done"}\n\n`);
					res.end();
					return;
				}
				try {
					promptData = await safeCall(getItem.func, { tanggal, token: incomingToken, incomingHeaders });
				} catch(e) {
					if (e && e.message === 'AUTH_TERMINATED') return;
					// otherwise ignore and continue to fallback
				}
			}
		} catch (e) {
			// fallback: promptData tetap null
		}
	}

	// Deteksi laporan transaksi penjualan / total penjualan (tambahan: tangkap "total data penjualan", "berapa ... penjualan")
	// PRIORITAS: jika pertanyaan menyebut "sales" prioritaskan laporan per-sales
	if (!promptType && /\bsales\b|penjualan per sales|sales terbanyak|sales terbaik|siapa sales/i.test(question)) {
		promptType = "penjualan_sales";
		console.log('SSE detect -> penjualan_sales (priority)');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:penjualan_sales_priority\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const fn = functionDeclarations.find(f => f.name === "getPenjualanSales");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'] || process.env.TKM_TOKEN;
				const incomingHeaders = req.headers || {};
				if (!incomingToken) {
					const msg = 'Maaf, token tidak tersedia. Sertakan token lewat query `?token=` atau header `x-auth-token`, atau set TKM_TOKEN di .env.';
					res.write(`data: ${msg}\n\n`);
					res.write(`event: done\ndata: {"status":"done"}\n\n`);
					res.end();
					return;
				}
				try {
					promptData = await safeCall(fn.func, { tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				} catch(e) {
					if (e && e.message === 'AUTH_TERMINATED') return;
				}
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch(e) {}
	}
	if (/laporan transaksi penjualan|transaksi penjualan|total transaksi penjualan|total penjualan|laporan penjualan/i.test(question)
		|| (/penjualan/i.test(question) && /\b(total|berapa|jumlah|berapa banyak|data)\b/i.test(question)) ) {
		promptType = "penjualan_report";
		console.log('SSE detect -> penjualan_report');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:penjualan_report\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const getPenj = functionDeclarations.find(f => f.name === "getPenjualanAnnual");
			if (getPenj) {
				const incomingToken = req.query.token || req.headers['x-auth-token'] || process.env.TKM_TOKEN;
				const incomingHeaders = req.headers || {};
				try {
					const mask = (v) => {
						if (!v) return '';
						if (v.length <= 10) return v;
						return `${v.slice(0,6)}...${v.slice(-4)}`;
					};
					let cookieSummary = '';
					if (incomingHeaders.cookie) {
						try { cookieSummary = incomingHeaders.cookie.split(';').map(s => s.split('=')[0].trim()).join(','); } catch(e) { cookieSummary = '[cookie_parse_error]'; }
					}
					const logged = {
						token_query: incomingToken ? `${String(incomingToken).slice(0,6)}...` : null,
						x_auth_token: incomingHeaders['x-auth-token'] ? `${String(incomingHeaders['x-auth-token']).slice(0,6)}...` : null,
						cookie_names: cookieSummary,
						referer: incomingHeaders.referer || null,
						origin: incomingHeaders.origin || null,
					};
					try { fs.appendFileSync('/tmp/sse_debug.log', `forward_headers_penjualan:${JSON.stringify(logged)}\n`); } catch(e){}
				} catch(e) {}
				if (!incomingToken) {
					const msg = 'Maaf, token tidak tersedia. Sertakan token lewat query `?token=` atau header `x-auth-token`, atau set TKM_TOKEN di .env.';
					res.write(`data: ${msg}\n\n`);
					res.write(`event: done\ndata: {"status":"done"}\n\n`);
					res.end();
					return;
				}
				try {
					promptData = await safeCall(getPenj.func, { tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				} catch(e) {
					if (e && e.message === 'AUTH_TERMINATED') return;
				}
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {
			// fallback: log error details for debugging
			try { fs.appendFileSync('/tmp/sse_debug.log', `error:penjualan_report:${e && e.message}:${JSON.stringify(e && e.response && e.response.data)}\n`); } catch(ex){}
			console.error('Error fetching penjualan_report:', e && e.message);
		}
	}
	// Deteksi penjualan marketplace / online
	if (!promptType && /marketplace|online|tokopedia|shopee|lazada|penjualan marketplace/i.test(question)) {
		promptType = "penjualan_marketplace";
		console.log('SSE detect -> penjualan_marketplace');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:penjualan_marketplace\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const getPenjMk = functionDeclarations.find(f => f.name === "getPenjualanMarketplace");
			if (getPenjMk) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await getPenjMk.func({ tgl_from: tgl_awal, tgl_to: tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {
			// fallback
		}
	}
	// Deteksi laporan pembelian
	if (!promptType && /pembelian|laporan pembelian|transaksi pembelian|total pembelian/i.test(question)) {
		promptType = "pembelian";
		console.log('SSE detect -> pembelian');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:pembelian\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const getPemb = functionDeclarations.find(f => f.name === "getPembelian");
			if (getPemb) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await getPemb.func({ tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {
			// fallback
		}
	}

	// Deteksi pembelian per sales (siapa sales yang paling banyak melayani pembelian)
	if (!promptType && /pembelian.*sales|sales.*pembelian|pembelian per sales|siapa sales.*pembelian/i.test(question)) {
		promptType = "pembelian_sales";
		console.log('SSE detect -> pembelian_sales');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:pembelian_sales\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const fn = functionDeclarations.find(f => f.name === "getPembelianSales");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await fn.func({ tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {}
	}
	// Deteksi laporan penjualan per sales
	if (!promptType && /penjualan sales|penjualan per sales|sales terbaik|sales terbanyak|sales mana/i.test(question)) {
		promptType = "penjualan_sales";
		console.log('SSE detect -> penjualan_sales');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:penjualan_sales\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const getPenjSales = functionDeclarations.find(f => f.name === "getPenjualanSales");
			if (getPenjSales) {
					const incomingToken = req.query.token || req.headers['x-auth-token'] || process.env.TKM_TOKEN;
					const incomingHeaders = req.headers || {};
					try { fs.appendFileSync('/tmp/sse_debug.log', `forward_headers_penjualan_sales:${JSON.stringify({ token_query: incomingToken ? `${String(incomingToken).slice(0,6)}...` : null, x_auth_token: incomingHeaders['x-auth-token'] ? `${String(incomingHeaders['x-auth-token']).slice(0,6)}...` : null })}\n`); } catch(e){}
					if (!incomingToken) {
						const msg = 'Maaf, token tidak tersedia. Sertakan token lewat query `?token=` atau header `x-auth-token`, atau set TKM_TOKEN di .env.';
						res.write(`data: ${msg}\n\n`);
						res.write(`event: done\ndata: {"status":"done"}\n\n`);
						res.end();
						return;
					}
					try {
						promptData = await safeCall(getPenjSales.func, { tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
					} catch(e) {
						if (e && e.message === 'AUTH_TERMINATED') return;
					}
					promptMeta.tgl_awal = tgl_awal;
					promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {
			// fallback
		}
	}
	// Deteksi laporan hutang
	if (!promptType && /hutang|utang|kreditur|pembayaran tertunda/i.test(question)) {
		promptType = "hutang";
		console.log('SSE detect -> hutang');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:hutang\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const fn = functionDeclarations.find(f => f.name === "getHutang");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				try { fs.appendFileSync('/tmp/sse_debug.log', `forward_headers_hutang:${JSON.stringify({ token_query: incomingToken ? `${String(incomingToken).slice(0,6)}...` : null, x_auth_token: incomingHeaders['x-auth-token'] ? `${String(incomingHeaders['x-auth-token']).slice(0,6)}...` : null, cookie_names: incomingHeaders.cookie ? incomingHeaders.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null })}\n`); } catch(e){}
				promptData = await fn.func({ tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {}
	}
	// Deteksi laporan hutang lunas
	if (!promptType && /hutang lunas|lunas hutang|pelunasan hutang|hutang yang sudah dilunasi/i.test(question)) {
		promptType = "hutang_lunas";
		console.log('SSE detect -> hutang_lunas');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:hutang_lunas\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const fn = functionDeclarations.find(f => f.name === "getHutangLunas");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				try { fs.appendFileSync('/tmp/sse_debug.log', `forward_headers_hutang_lunas:${JSON.stringify({ token_query: incomingToken ? `${String(incomingToken).slice(0,6)}...` : null, x_auth_token: incomingHeaders['x-auth-token'] ? `${String(incomingHeaders['x-auth-token']).slice(0,6)}...` : null, cookie_names: incomingHeaders.cookie ? incomingHeaders.cookie.split(';').map(s=>s.split('=')[0].trim()).join(',') : null })}\n`); } catch(e){}
				promptData = await fn.func({ tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {}
	}
	// Deteksi laporan cash (kas)
	if (!promptType && /cash|kas|uang kas|saldo kas|total kas|saldo akhir kas/i.test(question)) {
		promptType = "report_cash";
		console.log('SSE detect -> report_cash');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:report_cash\n`); } catch(e){}
		try {
			let tgl_from = dayjs().format("YYYY-MM-DD");
			let tgl_to = tgl_from;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_from = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_to = parsedCommon.tgl_akhir || tgl_from;
			const fn = functionDeclarations.find(f => f.name === "getReportCash");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await fn.func({ tgl_from, tgl_to, user_login: process.env.USER_LOGIN || 'devops.nagatech', token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_from;
				promptMeta.tgl_akhir = tgl_to;
			}
		} catch (e) {}
	}
	// Deteksi laporan non-cash (transfer/debet/credit)
	if (!promptType && /non-?cash|transfer|debet|kredit|rekening|rekening bank|saldo non-cash/i.test(question)) {
		promptType = "report_non_cash";
		console.log('SSE detect -> report_non_cash');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:report_non_cash\n`); } catch(e){}
		try {
			let tgl_from = dayjs().format("YYYY-MM-DD");
			let tgl_to = tgl_from;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_from = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_to = parsedCommon.tgl_akhir || tgl_from;
			const fn = functionDeclarations.find(f => f.name === "getReportNonCash");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await fn.func({ tgl_from, tgl_to, useSSE: true, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_from;
				promptMeta.tgl_akhir = tgl_to;
			}
		} catch (e) {}
	}
	// Deteksi transaksi service
	if (!promptType && /service|jasa service|perbaikan|layanan service/i.test(question)) {
		promptType = "service";
		console.log('SSE detect -> service');
		try { fs.appendFileSync('/tmp/sse_debug.log', `detect:service\n`); } catch(e){}
		try {
			let tgl_awal = dayjs().format("YYYY-MM-DD");
			let tgl_akhir = tgl_awal;
			if (parsedCommon && parsedCommon.tgl_awal) tgl_awal = parsedCommon.tgl_awal;
			if (parsedCommon && parsedCommon.tgl_akhir) tgl_akhir = parsedCommon.tgl_akhir || tgl_awal;
			const fn = functionDeclarations.find(f => f.name === "getService");
			if (fn) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await fn.func({ tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {}
	}
	// (Removed redundant generic 'penjualan + tanggal' -> margin detection to avoid overlap)
	// Deteksi pertanyaan tentang margin/keuntungan penjualan
	if (!promptType && /margin|laba|keuntungan|margin penjualan|marginpenjualan/i.test(question)) {
		promptType = "margin_penjualan";
		try {
			let tanggal = dayjs().format("YYYY-MM-DD");
			const parsed = parseDatePhrase(question);
			let tgl_awal = tanggal;
			let tgl_akhir = tanggal;
			if (parsed && parsed.tgl_awal) tgl_awal = parsed.tgl_awal;
			if (parsed && parsed.tgl_akhir) tgl_akhir = parsed.tgl_akhir || tgl_awal;
			const getMargin = functionDeclarations.find(f => f.name === "getMarginPenjualan");
			if (getMargin) {
				const incomingToken = req.query.token || req.headers['x-auth-token'];
				const incomingHeaders = req.headers || {};
				promptData = await getMargin.func({ tgl_awal, tgl_akhir, token: incomingToken, incomingHeaders });
				promptMeta.tgl_awal = tgl_awal;
				promptMeta.tgl_akhir = tgl_akhir;
			}
		} catch (e) {
			// fallback
		}
	}
	// Tambahkan else if untuk endpoint lain (misal: pembelian, penjualan, margin, dll)


	// Bangun prompt akhir, jika data tidak ada, tetap pakai pertanyaan asli
	console.log(`SSE question="${question}" promptType=${promptType}`);
	// If we detected a penjualan_report request but couldn't fetch data, return a clear server-side message
	if (promptType === "penjualan_report" && !promptData) {
		const whenLabel = (parsedCommon && parsedCommon.tgl_awal && parsedCommon.tgl_akhir && parsedCommon.tgl_awal === parsedCommon.tgl_akhir)
			? `tanggal ${formatDateIndo(parsedCommon.tgl_awal)}`
			: (parsedCommon && parsedCommon.tgl_awal && parsedCommon.tgl_akhir)
				? `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`
				: 'permintaan waktu yang diberikan';
		const msg = `Maaf, saya tidak dapat mengambil data penjualan (${whenLabel}) dari server data. Mohon periksa konfigurasi API (base URL / token) atau jalankan endpoint /getpenjualan untuk melihat detail error.`;
		res.write(`data: ${msg}\n\n`);
		res.write(`event: done\ndata: {"status":"done"}\n\n`);
		res.end();
		return;
	}
	if (promptType && promptData) {
		userPrompt = buildPrompt({ type: promptType, data: promptData, question });
	} else {
		userPrompt = question;
	}

	// Jika kita sudah punya data stok, bangun jawaban final di server (bahasa Indonesia,
	// format angka lokal) dan kirim langsung, tanpa memanggil model.
	if (promptType === "stock" && promptData) {
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const stock = nfInt.format(Number(promptData.total_stock || 0));
			const berat = nfDec.format(Number(promptData.total_berat || 0));
			const gudang = promptData.gudang || "TOKO";
			// Prefer to echo user's natural phrase if present in the question (e.g. "kemarin", "minggu lalu")
			let whenLabel = null;
			const phraseMatch = question.match(/\b(kemarin|hari ini|sekarang|besok|lusa|keesokan hari|minggu ini|minggu lalu|minggu kemarin|bulan ini|bulan lalu|tahun ini|tahun lalu)\b/i);
			if (phraseMatch) {
				whenLabel = phraseMatch[0].toLowerCase();
				if (whenLabel === 'sekarang') whenLabel = 'hari ini';
				if (whenLabel === 'keesokan hari') whenLabel = 'besok';
			} else if (parsedCommon && parsedCommon.tgl_awal) {
				if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) {
					whenLabel = formatDateIndo(parsedCommon.tgl_awal);
				} else {
					whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
				}
			} else {
				whenLabel = 'hari ini';
			}
			const finalAnswer = `Total stock ${whenLabel}: ${stock} unit (berat ${berat} gram) di gudang ${gudang}.`;
			res.write(`data: ${finalAnswer}\n\n`);
			res.write(`event: done\ndata: {"status":"done"}\n\n`);
			res.end();
			return;
		} catch (e) {
			// jika gagal format, lanjut ke model
		}
	}

	// Jika kita sudah punya data margin penjualan, kirim jawaban final di server
	if (promptType === "margin_penjualan" && promptData) {
		try {
			// helper: format tanggal ke Bahasa Indonesia (contoh: 3 Maret 2026)
			function formatDateIndo(isoDate) {
				if (!isoDate) return "";
				const d = dayjs(isoDate);
				const months = [
					"Januari","Februari","Maret","April","Mei","Juni",
					"Juli","Agustus","September","Oktober","November","Desember"
				];
				return `${d.date()} ${months[d.month()]} ${d.year()}`;
			}

			const tglAwal = promptMeta.tgl_awal;
			const tglAkhir = promptMeta.tgl_akhir;
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
			const qty = nfInt.format(Number(promptData.total_qty || 0));
			const berat = nfDec.format(Number(promptData.total_berat || 0));
			const penjualan = nfRupiah.format(Number(promptData.total_penjualan || 0));
			const margin = nfRupiah.format(Number(promptData.total_margin || 0));
			let finalAnswer = `Total penjualan periode: ${penjualan}, total margin: ${margin}, total qty: ${qty} unit, total berat: ${berat} gram.`;
			if (tglAwal && tglAkhir && tglAwal === tglAkhir) {
				const pretty = formatDateIndo(tglAwal);
				finalAnswer = `Data penjualan tanggal ${pretty}: ${penjualan}, margin ${margin}, qty ${qty} unit, berat ${berat} gram.`;
			} else if (tglAwal && tglAkhir) {
				const prettyA = formatDateIndo(tglAwal);
				const prettyB = formatDateIndo(tglAkhir);
				finalAnswer = `Data penjualan periode ${prettyA} sampai ${prettyB}: ${penjualan}, margin ${margin}, qty ${qty} unit, berat ${berat} gram.`;
			}
			res.write(`data: ${finalAnswer}\n\n`);
			res.write(`event: done\ndata: {"status":"done"}\n\n`);
			res.end();
			return;
		} catch (e) {
			// jika gagal format, lanjut ke model
		}
	}

	// Jika kita sudah punya data laporan penjualan, kirim jawaban final di server
	if (promptType === "penjualan_report" && promptData) {
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
			const qty = nfInt.format(Number(promptData.total_qty || 0));
			const berat = nfDec.format(Number(promptData.total_berat || 0));
			const totalRp = nfRupiah.format(Number(promptData.total_rupiah || 0));
			let whenLabel = null;
			const phraseMatch = question.match(/\b(kemarin|hari ini|sekarang|besok|lusa|keesokan hari|minggu ini|minggu lalu|minggu kemarin|bulan ini|bulan lalu|tahun ini|tahun lalu)\b/i);
			if (phraseMatch) {
				whenLabel = phraseMatch[0].toLowerCase();
				if (whenLabel === 'sekarang') whenLabel = 'hari ini';
				if (whenLabel === 'keesokan hari') whenLabel = 'besok';
			} else if (parsedCommon && parsedCommon.tgl_awal) {
				if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) {
					whenLabel = formatDateIndo(parsedCommon.tgl_awal);
				} else {
					whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
				}
			} else {
				whenLabel = 'hari ini';
			}
			let finalAnswer = `Total penjualan ${whenLabel}: ${totalRp}, total qty: ${qty} unit, total berat: ${berat} gram.`;
			if (parsedCommon && parsedCommon.tgl_awal && parsedCommon.tgl_awal === parsedCommon.tgl_akhir) {
				finalAnswer = `Data penjualan tanggal ${formatDateIndo(parsedCommon.tgl_awal)}: ${totalRp}, qty ${qty} unit, berat ${berat} gram.`;
			}
			res.write(`data: ${finalAnswer}\n\n`);
			res.write(`event: done\ndata: {"status":"done"}\n\n`);
			res.end();
			return;
		} catch (e) {
			// lanjut ke model jika ada error
		}
	}

	// Jika kita sudah punya data laporan penjualan marketplace, kirim jawaban final di server
	if (promptType === "penjualan_marketplace" && promptData) {
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
			const qty = nfInt.format(Number(promptData.total_qty || 0));
			const berat = nfDec.format(Number(promptData.total_berat || 0));
			const totalRp = nfRupiah.format(Number(promptData.total_rupiah || 0));
			let whenLabel = null;
			const phraseMatch = question.match(/\b(kemarin|hari ini|sekarang|besok|lusa|keesokan hari|minggu ini|minggu lalu|minggu kemarin|bulan ini|bulan lalu|tahun ini|tahun lalu)\b/i);
			if (phraseMatch) {
				whenLabel = phraseMatch[0].toLowerCase();
				if (whenLabel === 'sekarang') whenLabel = 'hari ini';
				if (whenLabel === 'keesokan hari') whenLabel = 'besok';
			} else if (parsedCommon && parsedCommon.tgl_awal) {
				if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) {
					whenLabel = formatDateIndo(parsedCommon.tgl_awal);
				} else {
					whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
				}
			} else {
				whenLabel = 'hari ini';
			}
			let finalAnswer = `Total penjualan online ${whenLabel}: ${totalRp}, total qty: ${qty} unit, total berat: ${berat} gram.`;
			if (parsedCommon && parsedCommon.tgl_awal && parsedCommon.tgl_awal === parsedCommon.tgl_akhir) {
				finalAnswer = `Data penjualan online tanggal ${formatDateIndo(parsedCommon.tgl_awal)}: ${totalRp}, qty ${qty} unit, berat ${berat} gram.`;
			}
			res.write(`data: ${finalAnswer}\n\n`);
			res.write(`event: done\ndata: {"status":"done"}\n\n`);
			res.end();
			return;
		} catch (e) {
			// lanjut ke model jika error
		}
	}

	// Jika kita sudah punya data laporan penjualan per sales, kirim jawaban final di server
	if (promptType === "penjualan_sales" && promptData) {
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
			const aggregates = promptData.aggregate || [];
			if (!aggregates.length) {
				res.write(`data: Maaf, tidak ada data penjualan per sales untuk periode yang diminta.\n\n`);
				res.write(`event: done\ndata: {"status":"done"}\n\n`);
				res.end();
				return;
			}
			// decide ranking key: qty or berat based on question
			let sortBy = 'qty';
			if (/berat/i.test(question)) sortBy = 'berat';
			if (/qty|jumlah|unit/i.test(question)) sortBy = 'qty';
			aggregates.sort((a,b) => (b[sortBy]||0) - (a[sortBy]||0));
			const top = aggregates[0];
			const qty = nfInt.format(Number(top.qty || 0));
			const berat = nfDec.format(Number(top.berat || 0));
			const rupiah = nfRupiah.format(Number(top.rupiah || 0));
			let finalAnswer = `Sales terbanyak berdasarkan ${sortBy}: ${top.kode_sales} — qty ${qty} unit, berat ${berat} gram, nilai ${rupiah}.`;
			res.write(`data: ${finalAnswer}\n\n`);
			res.write(`event: done\ndata: {"status":"done"}\n\n`);
			res.end();
			return;
		} catch (e) {
			// fallback ke model
		}
	}

	// Jika kita sudah punya data laporan pembelian, kirim jawaban final di server
	if (promptType === "pembelian" && promptData) {
		try {
			const nfInt = new Intl.NumberFormat("id-ID");
			const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
			const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
			const count = nfInt.format(Number(promptData.total_count || 0));
			const berat = nfDec.format(Number(promptData.total_berat || 0));
			const totalRp = nfRupiah.format(Number(promptData.total_rupiah || 0));
			let whenLabel = null;
			const phraseMatch = question.match(/\b(kemarin|hari ini|sekarang|besok|lusa|keesokan hari|minggu ini|minggu lalu|bulan ini|bulan lalu|tahun ini|tahun lalu)\b/i);
			if (phraseMatch) {
				whenLabel = phraseMatch[0].toLowerCase();
				if (whenLabel === 'sekarang') whenLabel = 'hari ini';
				if (whenLabel === 'keesokan hari') whenLabel = 'besok';
			} else if (parsedCommon && parsedCommon.tgl_awal) {
				if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) {
					whenLabel = formatDateIndo(parsedCommon.tgl_awal);
				} else {
					whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
				}
			} else {
				whenLabel = 'hari ini';
			}
			const finalAnswer = `Total pembelian ${whenLabel}: ${count} transaksi, total berat ${berat} gram, total Rp ${totalRp}.`;
			res.write(`data: ${finalAnswer}\n\n`);
			res.write(`event: done\ndata: {"status":"done"}\n\n`);
			res.end();
			return;
		} catch (e) {
			// fallback to model
		}
	}

	try {
		const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
		// Default model: gunakan model yang tersedia di mesin. Ubah via OLLAMA_MODEL env.
		const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:3b";
		const payload = {
			model: ollamaModel,
			stream: true,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt }
			]
		};
		const response = await axios.post(
			`${ollamaHost}/api/chat`,
			payload,
			{ responseType: "stream" }
		);

		// Parse stream lines (Ollama streams JSON lines). Forward only textual tokens.
		// buffer untuk menyatukan seluruh jawaban
		let replyBuffer = "";
		response.data.on("data", chunk => {
			const s = chunk.toString();
			const lines = s.split(/\r?\n/).filter(Boolean);
			for (const line of lines) {
				try {
					const j = JSON.parse(line);
					const msg = j.message || {};
					const text = msg.thinking || msg.content || "";
					if (text) replyBuffer += text;
					// Jika model mengirim content final atau done, kirim buffer sekaligus
					if (msg.content && msg.content.length) {
						res.write(`data: ${replyBuffer}\n\n`);
						replyBuffer = "";
					}
					if (j.done) {
						if (replyBuffer) res.write(`data: ${replyBuffer}\n\n`);
						res.write(`event: done\ndata: {\"status\":\"done\"}\n\n`);
						res.end();
						return;
					}

					// Jika kita sudah punya data laporan hutang, kirim jawaban final
					if (promptType === "hutang" && promptData) {
						try {
							const nfInt = new Intl.NumberFormat("id-ID");
							const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
							const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
							const count = nfInt.format(Number(promptData.total_jumlah || 0));
							const berat = nfDec.format(Number(promptData.total_berat || 0));
							const totalHutang = nfRupiah.format(Number(promptData.total_hutang || 0));
							let whenLabel = 'hari ini';
							if (parsedCommon && parsedCommon.tgl_awal) {
								if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) whenLabel = formatDateIndo(parsedCommon.tgl_awal);
								else whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
							}
							const finalAnswer = `Total hutang ${whenLabel}: ${count} transaksi, total berat ${berat} gram, total hutang ${totalHutang}.`;
							res.write(`data: ${finalAnswer}\n\n`);
							res.write(`event: done\ndata: {"status":"done"}\n\n`);
							res.end();
							return;
						} catch (e) {}
					}

					// Jika kita sudah punya data laporan hutang lunas, kirim jawaban final
					if (promptType === "hutang_lunas" && promptData) {
						try {
							const nfInt = new Intl.NumberFormat("id-ID");
							const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
							const count = nfInt.format(Number(promptData.total_jumlah || 0));
							const totalBayar = nfRupiah.format(Number(promptData.total_hutang_lunas || 0));
							const totalBunga = nfRupiah.format(Number(promptData.total_bunga_lunas || 0));
							let whenLabel = 'hari ini';
							if (parsedCommon && parsedCommon.tgl_awal) {
								if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) whenLabel = formatDateIndo(parsedCommon.tgl_awal);
								else whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
							}
							const finalAnswer = `Total hutang lunas ${whenLabel}: ${count} transaksi, total bayar ${totalBayar}, total bunga ${totalBunga}.`;
							res.write(`data: ${finalAnswer}\n\n`);
							res.write(`event: done\ndata: {"status":"done"}\n\n`);
							res.end();
							return;
						} catch (e) {}
					}

					// Jika kita sudah punya data laporan cash, kirim jawaban final di server
					if (promptType === "report_cash" && promptData) {
						try {
							const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
							const totalIn = nfRupiah.format(Number(promptData.total_in || 0));
							const totalOut = nfRupiah.format(Number(promptData.total_out || 0));
							const saldo = nfRupiah.format(Number(promptData.saldo_akhir || 0));
							let whenLabel = 'hari ini';
							if (parsedCommon && parsedCommon.tgl_awal) {
								if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) whenLabel = formatDateIndo(parsedCommon.tgl_awal);
								else whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
							}
							const finalAnswer = `Total cash ${whenLabel}: masuk ${totalIn}, keluar ${totalOut}, saldo akhir ${saldo}.`;
							res.write(`data: ${finalAnswer}\n\n`);
							res.write(`event: done\ndata: {"status":"done"}\n\n`);
							res.end();
							return;
						} catch (e) {}
					}

					// Jika kita sudah punya data laporan non-cash, kirim jawaban final di server
					if (promptType === "report_non_cash" && promptData) {
						try {
							const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
							const totalIn = nfRupiah.format(Number(promptData.total_in || 0));
							const totalOut = nfRupiah.format(Number(promptData.total_out || 0));
							const saldo = nfRupiah.format(Number(promptData.saldo_akhir || 0));
							let whenLabel = 'hari ini';
							if (parsedCommon && parsedCommon.tgl_awal) {
								if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) whenLabel = formatDateIndo(parsedCommon.tgl_awal);
								else whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
							}
							const finalAnswer = `Total non-cash ${whenLabel}: masuk ${totalIn}, keluar ${totalOut}, saldo akhir ${saldo}.`;
							res.write(`data: ${finalAnswer}\n\n`);
							res.write(`event: done\ndata: {"status":"done"}\n\n`);
							res.end();
							return;
						} catch (e) {}
					}

					// Jika kita sudah punya data transaksi service, kirim jawaban final di server
					if (promptType === "service" && promptData) {
						try {
							const nfInt = new Intl.NumberFormat("id-ID");
							const nfDec = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
							const nfRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
							const qty = nfInt.format(Number(promptData.total_qty || 0));
							const berat = nfDec.format(Number(promptData.total_berat || 0));
							const totalRp = nfRupiah.format(Number(promptData.total_rp || 0));
							let whenLabel = 'hari ini';
							if (parsedCommon && parsedCommon.tgl_awal) {
								if (parsedCommon.tgl_awal === parsedCommon.tgl_akhir) whenLabel = formatDateIndo(parsedCommon.tgl_awal);
								else whenLabel = `periode ${formatDateIndo(parsedCommon.tgl_awal)} sampai ${formatDateIndo(parsedCommon.tgl_akhir)}`;
							}
							const finalAnswer = `Total service ${whenLabel}: ${qty} transaksi, berat ${berat} gram, total ${totalRp}.`;
							res.write(`data: ${finalAnswer}\n\n`);
							res.write(`event: done\ndata: {"status":"done"}\n\n`);
							res.end();
							return;
						} catch (e) {}
					}
				} catch (e) {
					// ignore non-JSON partials
				}
			}
		});
		response.data.on("end", () => {
			// ensure end
			res.write(`event: done\ndata: {\"status\":\"done\"}\n\n`);
			res.end();
		});
		response.data.on("error", err => {
			res.write(`event: error\ndata: {\"error\":\"${err.message}\"}\n\n`);
			res.end();
		});
	} catch (err) {
		res.write(`event: error\ndata: {\"error\":\"${err.message}\"}\n\n`);
		res.end();
	}
});
