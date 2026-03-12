import {
  buildWhenLabel,
  formatDateIndo,
  formatDecimal,
  formatInteger,
  formatRupiah,
} from "./chat_utils.js";

function getSalesSortKey(question, defaultKey) {
  if (/berat/i.test(question)) return "berat";
  if (/harga|nilai|rp|rupiah/i.test(question)) return defaultKey === "harga" ? "harga" : "rupiah";
  if (/qty|jumlah|unit/i.test(question)) return defaultKey === "jumlah" ? "jumlah" : "qty";
  return defaultKey;
}

export function formatAnswer(type, data, meta = {}, question = "") {
  if (!type || !data) return null;
  const dateRange = meta.dateRange || {};
  const whenLabel = buildWhenLabel(question, dateRange);

  if (type === "stock") {
    const gudang = data.gudang || "TOKO";
    return `Total stock ${whenLabel}: ${formatInteger(data.total_stock)} unit (berat ${formatDecimal(data.total_berat)} gram) di gudang ${gudang}.`;
  }

  if (type === "margin_penjualan") {
    if (dateRange.tgl_awal && dateRange.tgl_akhir && dateRange.tgl_awal === dateRange.tgl_akhir) {
      return `Data penjualan tanggal ${formatDateIndo(dateRange.tgl_awal)}: ${formatRupiah(data.total_penjualan)}, margin ${formatRupiah(data.total_margin)}, qty ${formatInteger(data.total_qty)} unit, berat ${formatDecimal(data.total_berat)} gram.`;
    }
    return `Data penjualan ${whenLabel}: ${formatRupiah(data.total_penjualan)}, margin ${formatRupiah(data.total_margin)}, qty ${formatInteger(data.total_qty)} unit, berat ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "penjualan_report") {
    if (dateRange.tgl_awal && dateRange.tgl_akhir && dateRange.tgl_awal === dateRange.tgl_akhir) {
      return `Data penjualan tanggal ${formatDateIndo(dateRange.tgl_awal)}: ${formatRupiah(data.total_rupiah)}, qty ${formatInteger(data.total_qty)} unit, berat ${formatDecimal(data.total_berat)} gram.`;
    }
    return `Total penjualan ${whenLabel}: ${formatRupiah(data.total_rupiah)}, total qty: ${formatInteger(data.total_qty)} unit, total berat: ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "penjualan_marketplace") {
    if (dateRange.tgl_awal && dateRange.tgl_akhir && dateRange.tgl_awal === dateRange.tgl_akhir) {
      return `Data penjualan online tanggal ${formatDateIndo(dateRange.tgl_awal)}: ${formatRupiah(data.total_rupiah)}, qty ${formatInteger(data.total_qty)} unit, berat ${formatDecimal(data.total_berat)} gram.`;
    }
    return `Total penjualan online ${whenLabel}: ${formatRupiah(data.total_rupiah)}, total qty: ${formatInteger(data.total_qty)} unit, total berat: ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "penjualan_sales") {
    const aggregates = data.aggregate || [];
    if (!aggregates.length) {
      return "Maaf, tidak ada data penjualan per sales untuk periode yang diminta.";
    }
    const sortBy = getSalesSortKey(question, "qty");
    const rows = [...aggregates].sort((left, right) => Number(right[sortBy] || 0) - Number(left[sortBy] || 0));
    const top = rows[0];
    return `Sales terbanyak berdasarkan ${sortBy}: ${top.kode_sales} - qty ${formatInteger(top.qty)} unit, berat ${formatDecimal(top.berat)} gram, nilai ${formatRupiah(top.rupiah)}.`;
  }

  if (type === "pembelian") {
    return `Total pembelian ${whenLabel}: ${formatInteger(data.total_count)} transaksi, total berat ${formatDecimal(data.total_berat)} gram, total ${formatRupiah(data.total_rupiah)}.`;
  }

  if (type === "pembelian_sales") {
    const aggregates = data.aggregate || [];
    if (!aggregates.length) {
      return "Maaf, tidak ada data pembelian per sales untuk periode yang diminta.";
    }
    const sortBy = getSalesSortKey(question, "jumlah");
    const rows = [...aggregates].sort((left, right) => Number(right[sortBy] || 0) - Number(left[sortBy] || 0));
    const top = rows[0];
    const name = top.nama_sales || top.nama || top.kode_sales || "";
    return `Sales terbanyak berdasarkan ${sortBy}: ${name} - qty ${formatInteger(top.jumlah)} unit, berat ${formatDecimal(top.berat)} gram, nilai ${formatRupiah(top.harga)}.`;
  }

  if (type === "hutang") {
    return `Total hutang ${whenLabel}: ${formatInteger(data.total_jumlah)} transaksi, total berat ${formatDecimal(data.total_berat)} gram, total hutang ${formatRupiah(data.total_hutang)}.`;
  }

  if (type === "hutang_lunas") {
    return `Total hutang lunas ${whenLabel}: ${formatInteger(data.total_jumlah)} transaksi, total bayar ${formatRupiah(data.total_hutang_lunas)}, total bunga ${formatRupiah(data.total_bunga_lunas)}.`;
  }

  if (type === "report_cash") {
    return `Total cash ${whenLabel}: masuk ${formatRupiah(data.total_in)}, keluar ${formatRupiah(data.total_out)}, saldo akhir ${formatRupiah(data.saldo_akhir)}.`;
  }

  if (type === "report_non_cash") {
    return `Total non-cash ${whenLabel}: masuk ${formatRupiah(data.total_in)}, keluar ${formatRupiah(data.total_out)}, saldo akhir ${formatRupiah(data.saldo_akhir)}.`;
  }

  if (type === "service") {
    return `Total service ${whenLabel}: ${formatInteger(data.total_qty)} transaksi, berat ${formatDecimal(data.total_berat)} gram, total ${formatRupiah(data.total_rp)}.`;
  }

  return null;
}

export function formatExecutionError(type, meta = {}) {
  const dateRange = meta.dateRange || {};
  const whenLabel =
    dateRange.tgl_awal && dateRange.tgl_akhir && dateRange.tgl_awal === dateRange.tgl_akhir
      ? `tanggal ${formatDateIndo(dateRange.tgl_awal)}`
      : dateRange.tgl_awal && dateRange.tgl_akhir
        ? `periode ${formatDateIndo(dateRange.tgl_awal)} sampai ${formatDateIndo(dateRange.tgl_akhir)}`
        : "permintaan waktu yang diberikan";

  const labels = {
    stock: "data stock",
    margin_penjualan: "data margin penjualan",
    penjualan_report: "data penjualan",
    penjualan_marketplace: "data penjualan marketplace",
    penjualan_sales: "data penjualan per sales",
    pembelian: "data pembelian",
    pembelian_sales: "data pembelian per sales",
    hutang: "data hutang",
    hutang_lunas: "data hutang lunas",
    report_cash: "data cash",
    report_non_cash: "data non-cash",
    service: "data service",
  };

  const label = labels[type] || "data";
  return `Maaf, saya tidak dapat mengambil ${label} (${whenLabel}) dari server data. Mohon periksa konfigurasi API (base URL / token) atau jalankan endpoint debug untuk melihat detail error.`;
}
