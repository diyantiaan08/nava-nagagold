import * as funcs from "./function.js";

export const functionDeclarations = [
	{
		name: "getItem",
		type: "stock",
		keywords: ["stock","stok","jumlah stock","jumlah stok","total stock"],
		description: "Mengambil total stock dan berat akhir berdasarkan Gudang (default TOKO)",
		func: funcs.getItem
	},
	{
		name: "getMarginPenjualan",
		type: "margin_penjualan",
		keywords: ["margin","laba","keuntungan","margin penjualan"],
		description: "Mengambil ringkasan margin penjualan untuk rentang tanggal atau tanggal tertentu",
		func: funcs.getMarginPenjualan
	}
,
	{
		name: "getPenjualanAnnual",
		type: "penjualan_report",
		keywords: ["penjualan","total penjualan","laporan penjualan","transaksi penjualan","total transaksi penjualan", "total omzet penjualan", "omzet penjualan", "penjualan tahunan", "penjualan per tahun"],
		description: "Mengambil laporan transaksi penjualan (qty, berat, rupiah) untuk rentang tanggal",
		func: funcs.getPenjualanAnnual
	}
	,
	{
		name: "getPenjualanMarketplace",
		type: "penjualan_marketplace",
		keywords: [
			"marketplace",
			"penjualan marketplace",
			"total penjualan marketplace",
			"penjualan marketplace tokopedia",
			"penjualan marketplace shopee",
			"penjualan marketplace lazada",
			"penjualan tokopedia",
			"penjualan shopee",
			"penjualan lazada",
			"penjualan online",
			"penjualan online toko",
			"data penjualan online",
			"penjualan marketplace pada",
			"penjualan marketplace tanggal",
			"market place",
			"online",
			"tokopedia",
			"shopee",
			"lazada",
			"jual online"
		],
		description: "Mengambil laporan penjualan marketplace (online) untuk rentang tanggal",
		func: funcs.getPenjualanMarketplace
	}
	,
	{
		name: "getPenjualanSales",
		type: "penjualan_sales",
		keywords: ["penjualan per sales","penjualan sales","sales terbaik","sales terbanyak","siapa sales penjualan","penjualan oleh sales"],
		description: "Mengambil laporan penjualan per sales (aggregate qty/berat/rupiah)",
		func: funcs.getPenjualanSales
	}
	,
	{
		name: "getPembelian",
		type: "pembelian",
		keywords: ["pembelian","laporan pembelian","total pembelian","transaksi pembelian"],
		description: "Mengambil laporan transaksi pembelian (count, berat, rupiah)",
		func: funcs.getPembelian
	}
,
	{
		name: "getPembelianSales",
		type: "pembelian_sales",
		keywords: [
			"pembelian per sales",
			"pembelian per sales kemarin",
			"pembelian per sales pada",
			"siapa sales pembelian",
			"pembelian sales",
			"pembelian terbanyak",
			"siapa sales pembelian terbanyak",
			"sales yang paling banyak melayani pembelian",
			"siapa sales yang paling banyak melayani pembelian",
			"sales yang paling banyak melayani pembelian kemarin",
			"melayani pembelian",
			"melayani pembelian terbanyak",
			"sales pembelian terbanyak",
			"sales pembelian",
			"sales yang melayani pembelian"
		],
		description: "Mengambil data pembelian per sales (jumlah, berat, harga)",
		func: funcs.getPembelianSales
	}
	,
	{
		name: "getService",
		type: "service",
		keywords: ["service","jasa service","perbaikan","layanan service"],
		description: "Mengambil laporan transaksi service (qty, berat, total rp)",
		func: funcs.getService
	}
	,
	{
		name: "getHutang",
		type: "hutang",
		keywords: ["hutang","utang","kreditur","pembayaran tertunda"],
		description: "Mengambil laporan transaksi hutang (jumlah, berat, total hutang)",
		func: funcs.getHutang
	}
	,
	{
		name: "getHutangLunas",
		type: "hutang_lunas",
		keywords: ["hutang lunas","pelunasan hutang","lunas","sudah dilunasi","pelunasan"],
		description: "Mengambil laporan hutang lunas (jumlah, total bayar, total bunga)",
		func: funcs.getHutangLunas
	}
	,
	{
		name: "getReportCash",
		type: "report_cash",
		keywords: ["cash","kas","saldo kas","total kas","uang kas"],
		description: "Mengambil laporan keuangan cash (total in/out, saldo akhir)",
		func: funcs.getReportCash
	}
	,
	{
		name: "getReportNonCash",
		type: "report_non_cash",
		keywords: ["non-cash","non cash","transfer","debet","kredit","rekening","rekening bank","saldo non-cash"],
		description: "Mengambil laporan keuangan non-cash (transfer/debit/credit), supports SSE",
		func: funcs.getReportNonCash
	}
];
