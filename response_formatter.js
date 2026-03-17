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

function describeSpecificDate(dateRange) {
  if (dateRange.tgl_awal && dateRange.tgl_akhir && dateRange.tgl_awal === dateRange.tgl_akhir) {
    return `pada ${formatDateIndo(dateRange.tgl_awal)}`;
  }
  return null;
}

function describeTopMemberSort(sortBy) {
  if (sortBy === "trx_point") return "point";
  if (sortBy === "trx_rp") return "nominal belanja";
  return "jumlah transaksi";
}

function buildTopMemberWhenLabel(whenLabel, specificDateLabel) {
  if (specificDateLabel) return specificDateLabel;
  if (String(whenLabel).startsWith("periode ")) return whenLabel;
  return `periode ${whenLabel}`;
}

export function formatAnswer(type, data, meta = {}, question = "") {
  if (!type || !data) return null;
  const dateRange = meta.dateRange || {};
  const whenLabel = buildWhenLabel(question, dateRange);
  const specificDateLabel = describeSpecificDate(dateRange);

  if (type === "stock") {
    const gudang = data.gudang || "TOKO";
    return `Untuk ${whenLabel}, total stok di gudang ${gudang} tercatat ${formatInteger(data.total_stock)} pcs dengan berat ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "margin_penjualan") {
    if (specificDateLabel) {
      return `Untuk penjualan ${specificDateLabel}, total penjualannya mencapai ${formatRupiah(data.total_penjualan)} dengan margin ${formatRupiah(data.total_margin)}. Jumlah yang terjual sebanyak ${formatInteger(data.total_qty)} pcs dengan total berat ${formatDecimal(data.total_berat)} gram.`;
    }
    return `Untuk periode ${whenLabel}, total penjualannya mencapai ${formatRupiah(data.total_penjualan)} dengan margin ${formatRupiah(data.total_margin)}. Jumlah yang terjual sebanyak ${formatInteger(data.total_qty)} pcs dengan total berat ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "penjualan_report") {
    if (specificDateLabel) {
      return `Untuk penjualan ${specificDateLabel}, total nilainya ${formatRupiah(data.total_rupiah)}. Jumlah barang yang terjual ${formatInteger(data.total_qty)} pcs dengan total berat ${formatDecimal(data.total_berat)} gram.`;
    }
    return `Untuk periode ${whenLabel}, total penjualannya ${formatRupiah(data.total_rupiah)}. Jumlah barang yang terjual ${formatInteger(data.total_qty)} pcs dengan total berat ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "penjualan_marketplace") {
    if (specificDateLabel) {
      return `Untuk penjualan marketplace ${specificDateLabel}, total nilainya ${formatRupiah(data.total_rupiah)}. Ada ${formatInteger(data.total_qty)} pcs terjual dengan total berat ${formatDecimal(data.total_berat)} gram.`;
    }
    return `Untuk penjualan marketplace ${whenLabel}, total nilainya ${formatRupiah(data.total_rupiah)}. Ada ${formatInteger(data.total_qty)} pcs terjual dengan total berat ${formatDecimal(data.total_berat)} gram.`;
  }

  if (type === "penjualan_sales") {
    const aggregates = data.aggregate || [];
    if (!aggregates.length) {
      return "Maaf, tidak ada data penjualan per sales untuk periode yang diminta.";
    }
    const sortBy = getSalesSortKey(question, "qty");
    const rows = [...aggregates].sort((left, right) => Number(right[sortBy] || 0) - Number(left[sortBy] || 0));
    const top = rows[0];
    return `Sales dengan performa penjualan tertinggi berdasarkan ${sortBy} adalah ${top.kode_sales}. Ia mencatat ${formatInteger(top.qty)} pcs, total berat ${formatDecimal(top.berat)} gram, dengan nilai penjualan ${formatRupiah(top.rupiah)}.`;
  }

  if (type === "pembelian") {
    return `Untuk ${whenLabel}, total pembelian tercatat ${formatInteger(data.total_count)} transaksi dengan berat ${formatDecimal(data.total_berat)} gram. Nilai pembeliannya mencapai ${formatRupiah(data.total_rupiah)}.`;
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
    return `Sales yang paling banyak melayani pembelian berdasarkan ${sortBy} adalah ${name}. Totalnya ${formatInteger(top.jumlah)} pcs dengan berat ${formatDecimal(top.berat)} gram dan nilai ${formatRupiah(top.harga)}.`;
  }

  if (type === "hutang") {
    return `Untuk ${whenLabel}, total hutang yang tercatat adalah ${formatInteger(data.total_jumlah)} transaksi. Total beratnya ${formatDecimal(data.total_berat)} gram dengan nilai hutang ${formatRupiah(data.total_hutang)}.`;
  }

  if (type === "hutang_lunas") {
    return `Untuk pelunasan hutang ${whenLabel}, tercatat ${formatInteger(data.total_jumlah)} transaksi. Total pembayaran mencapai ${formatRupiah(data.total_hutang_lunas)} dengan total bunga ${formatRupiah(data.total_bunga_lunas)}.`;
  }

  if (type === "report_cash") {
    return `Untuk kas ${whenLabel}, uang masuk tercatat ${formatRupiah(data.total_in)} dan uang keluar ${formatRupiah(data.total_out)}. Saldo akhirnya ${formatRupiah(data.saldo_akhir)}.`;
  }

  if (type === "report_non_cash") {
    return `Untuk transaksi non-cash ${whenLabel}, dana masuk tercatat ${formatRupiah(data.total_in)} dan dana keluar ${formatRupiah(data.total_out)}. Saldo akhirnya ${formatRupiah(data.saldo_akhir)}.`;
  }

  if (type === "service") {
    return `Untuk layanan service ${whenLabel}, tercatat ${formatInteger(data.total_qty)} transaksi dengan total berat ${formatDecimal(data.total_berat)} gram. Nilai transaksinya ${formatRupiah(data.total_rp)}.`;
  }

  if (type === "pesanan") {
    if (specificDateLabel) {
      return `Untuk laporan pesanan ${specificDateLabel}, tercatat ${formatInteger(data.total_qty)} item pesanan dengan total berat ${formatDecimal(data.total_berat)} gram. Total pembayaran yang sudah masuk sebesar ${formatRupiah(data.total_rupiah)}.`;
    }
    return `Untuk laporan pesanan ${whenLabel}, tercatat ${formatInteger(data.total_qty)} item pesanan dengan total berat ${formatDecimal(data.total_berat)} gram. Total pembayaran yang sudah masuk sebesar ${formatRupiah(data.total_rupiah)}.`;
  }

  if (type === "top_member") {
    const topMember = data.top_member;
    if (!topMember) {
      return "Maaf, tidak ada data top member untuk periode yang diminta.";
    }
    const sortLabel = describeTopMemberSort(data.sort_by || meta.sort_by);
    const topMemberWhenLabel = buildTopMemberWhenLabel(whenLabel, specificDateLabel);
    return `Untuk ${topMemberWhenLabel}, member dengan aktivitas belanja tertinggi berdasarkan ${sortLabel} adalah ${topMember.nama_member} dengan kode member ${topMember.kode_member}. Selama periode ini, tercatat ${formatInteger(topMember.total_transaksi)} transaksi dengan total belanja ${formatRupiah(topMember.total_rp)} dan total point ${formatInteger(topMember.total_point)}.`;
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
    pesanan: "data pesanan",
    top_member: "data top member",
  };

  const label = labels[type] || "data";
  return `Maaf, saya tidak dapat mengambil ${label} (${whenLabel}) dari server data. Mohon periksa konfigurasi API (base URL / token) atau jalankan endpoint debug untuk melihat detail error.`;
}
