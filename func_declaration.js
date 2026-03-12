import * as funcs from "./function.js";

export const functionDeclarations = [
	{
		name: "getItem",
		description: "Mengambil total stock dan berat akhir berdasarkan Gudang (default TOKO)",
		func: funcs.getItem
	},
	{
		name: "getMarginPenjualan",
		description: "Mengambil ringkasan margin penjualan untuk rentang tanggal atau tanggal tertentu",
		func: funcs.getMarginPenjualan
	}
,
    {
        name: "getPenjualanAnnual",
        description: "Mengambil laporan transaksi penjualan (qty, berat, rupiah) untuk rentang tanggal",
        func: funcs.getPenjualanAnnual
    }
	,
	{
		name: "getPenjualanMarketplace",
		description: "Mengambil laporan penjualan marketplace (online) untuk rentang tanggal",
		func: funcs.getPenjualanMarketplace
	}
	,
	{
		name: "getPenjualanSales",
		description: "Mengambil laporan penjualan per sales (aggregate qty/berat/rupiah)",
		func: funcs.getPenjualanSales
	}
	,
	{
		name: "getPembelian",
		description: "Mengambil laporan transaksi pembelian (count, berat, rupiah)",
		func: funcs.getPembelian
	}
,
	{
		name: "getPembelianSales",
		description: "Mengambil data pembelian per sales (jumlah, berat, harga)",
		func: funcs.getPembelianSales
	}
	,
	{
		name: "getService",
		description: "Mengambil laporan transaksi service (qty, berat, total rp)",
		func: funcs.getService
	}
	,
	{
		name: "getHutang",
		description: "Mengambil laporan transaksi hutang (jumlah, berat, total hutang)",
		func: funcs.getHutang
	}
	,
	{
		name: "getHutangLunas",
		description: "Mengambil laporan hutang lunas (jumlah, total bayar, total bunga)",
		func: funcs.getHutangLunas
	}
	,
	{
		name: "getReportCash",
		description: "Mengambil laporan keuangan cash (total in/out, saldo akhir)",
		func: funcs.getReportCash
	}
	,
	{
		name: "getReportNonCash",
		description: "Mengambil laporan keuangan non-cash (transfer/debit/credit), supports SSE",
		func: funcs.getReportNonCash
	}
];
