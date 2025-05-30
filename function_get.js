import { aggregateData } from "./mongo_get.js";
import axios from "axios";
import https from "https";
import dotenv from "dotenv";
dotenv.config();

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function getSalesDetails(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_kembali: "OPEN",
        status_valid: "DONE",
      },
    },
    {
      $group: {
        _id: "$tgl_system",
        total_data: {
          $sum: 1,
        },
        berat_gram: {
          $sum: "$berat",
        },
        total_rupiah: {
          $sum: "$harga_total",
        },
      },
    },
  ];
  return await aggregateData("tt_jual_detail", aggregate);
}

export async function getSalesAnnual(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_kembali: "OPEN",
        status_valid: "DONE",
      },
    },
    {
      $group: {
        _id: null,
        total_data: {
          $sum: 1,
        },
        berat_gram: {
          $sum: "$berat",
        },
        total_rupiah: {
          $sum: "$harga_total",
        },
      },
    },
  ];
  console.log(aggregate);
  
  return await aggregateData("tt_jual_detail", aggregate);
}

export async function getSalesMarketplace(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_kembali: "OPEN",
        status_valid: "DONE",
        kode_marketplace: {
          $ne: "-",
        },
      },
    },
    {
      $group: {
        _id: "$tgl_system",
        total: {
          $sum: 1,
        },
        berat_gram: {
          $sum: "$berat",
        },
        total_rupiah: {
          $sum: "$harga_total",
        },
      },
    },
  ];

  return await aggregateData("tt_jual_detail", aggregate);
}

export async function getTotalBarang(args) {
  const aggregate = [
    {
      $match: {
        kode_gudang: args.kode_gudang,
        stock_on_hand: {$gte:1},
      },
    },
    {
      $group: {
        _id: "$kode_gudang",
        stock_on_hand: {
          $sum: "$stock_on_hand",
        },
        berat_gram: {
          $sum: "$berat",
        },
      },
    },
  ];

  return await aggregateData("tm_barang", aggregate);
}

export async function getTotalCash(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tanggal) {
    tglFilter = args.tanggal;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tanggal: tglFilter,
        jenis: "A574C57C",
      },
    },
    {
      $group: {
        _id: "$tanggal",
        jumlah_in: {
          $sum: "$jumlah_in",
        },
        jumlah_out: {
          $sum: "$jumlah_out",
        },
      },
    },
    {
      $project: {
        _id: 1,
        jumlah_in: 1,
        jumlah_out: 1,
        total: {
          $subtract: ["$jumlah_in", "$jumlah_out"],
        },
      },
    },
  ];

  return await aggregateData("tt_cash_daily", aggregate);
}

export async function getTotalNonCash(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tanggal) {
    tglFilter = args.tanggal;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tanggal: tglFilter,
        jenis: {
          $ne: "A574C57C",
        },
        kategori: {
          $ne: "B574BE78C290B6CB72B4",
        },
      },
    },
    {
      $group: {
        _id: "$tanggal",
        jumlah_in: {
          $sum: "$jumlah_in",
        },
        jumlah_out: {
          $sum: "$jumlah_out",
        },
      },
    },
    {
      $project: {
        _id: 1,
        jumlah_in: 1,
        jumlah_out: 1,
        total: {
          $subtract: ["$jumlah_in", "$jumlah_out"],
        },
      },
    },
  ];

  return await aggregateData("tt_cash_daily", aggregate);
}

export async function getPembelian(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_valid: "DONE",
      },
    },
    {
      $group: {
        _id: "$tgl_system",
        count: {
          $sum: 1,
        },
        berat_gram: {
          $sum: "$berat",
        },
        total_rupiah: {
          $sum: "$harga",
        },
      },
    },
  ];

  return await aggregateData("tt_beli_detail", aggregate);
}

export async function getPembelianAnnual(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_valid: "DONE",
      },
    },
    {
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
        berat_gram: {
          $sum: "$berat",
        },
        total_rupiah: {
          $sum: "$harga",
        },
      },
    },
  ];

  return await aggregateData("tt_beli_detail", aggregate);
}

export async function getService(args) {
  let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_valid: "OPEN",
      },
    },
    {
      $facet: {
        transaksiSummary: [
          {
            $group: {
              _id: null,
              jumlah_data: { $sum: 1 },
              total_bayar: { $sum: "$total_bayar" },
            },
          },
        ],
        beratSummary: [
          { $unwind: "$detail_barang" },
          {
            $group: {
              _id: null,
              total_berat: { $sum: "$detail_barang.berat" },
            },
          },
        ],
      },
    },
    {
      $project: {
        jumlah_data: { $arrayElemAt: ["$transaksiSummary.jumlah_data", 0] },
        total_bayar: { $arrayElemAt: ["$transaksiSummary.total_bayar", 0] },
        total_berat_gram: { $arrayElemAt: ["$beratSummary.total_berat", 0] },
      },
    },
  ];

  return await aggregateData("tt_service_detail", aggregate);
}

export async function getStockHutang(args) {
  const matchStage = {
    status_valid: "DONE",
    status_hutang: "OPEN",
  };

  if (args.tgl_system) {
    matchStage.tgl_system = args.tgl_system;
  }

  const aggregate = [
    { $match: matchStage },
    {
      $facet: {
        totalTransaksi: [
          {
            $group: {
              _id: null,
              jumlah_data: { $sum: 1 },
              jumlah_hutang_rp: { $sum: "$jumlah_hutang" },
            },
          },
        ],
        totalDetail: [
          { $unwind: "$detail_barang" },
          {
            $group: {
              _id: null,
              total_berat: { $sum: "$detail_barang.berat" },
              total_jumlah_barang: { $sum: "$detail_barang.jumlah" },
            },
          },
        ],
      },
    },
    {
      $project: {
        jumlah_data: { $arrayElemAt: ["$totalTransaksi.jumlah_data", 0] },
        jumlah_hutang_rp: { $arrayElemAt: ["$totalTransaksi.total_hutang", 0] },
        total_berat_gram: { $arrayElemAt: ["$totalDetail.total_berat", 0] },
        total_jumlah_barang: {
          $arrayElemAt: ["$totalDetail.total_jumlah_barang", 0],
        },
      },
    },
  ];

  return await aggregateData("tt_hutang_detail", aggregate);
}

export async function getPesananOpen(args) {
  const matchStage = {
    status_validasi: "CLOSE",
    status_pesanan: "OPEN",
  };

  if (args.tanggal) {
    matchStage.tanggal = args.tanggal;
  }

  const aggregate = [
    { $match: matchStage },
    { $unwind: "$detail_barang" },
    {
      $group: {
        _id: "$_id",
        berat_gram: { $sum: "$detail_barang.perkiraan_berat" },
        total_harga: { $first: "$total_harga" },
        jumlah_bayar: { $first: "$jumlah_bayar" },
        sisa_bayar: { $first: "$sisa_bayar" },
      },
    },
    {
      $group: {
        _id: null,
        jumlah_data: { $sum: 1 },
        berat_gram: { $sum: "$berat_gram" },
        total_harga: { $sum: "$total_harga" },
        jumlah_bayar: { $sum: "$jumlah_bayar" },
        sisa_bayar: { $sum: "$sisa_bayar" },
      },
    },
  ];

  return await aggregateData("tt_pesanan", aggregate);
}

export async function getPesananDone(args) {
  const matchStage = {
    status_validasi: "CLOSE",
    status_pesanan: "DONE",
  };

  if (args.tanggal) {
    matchStage.tanggal = args.tanggal;
  }

  const aggregate = [
    { $match: matchStage },
    { $unwind: "$detail_barang" },
    {
      $group: {
        _id: "$_id",
        berat_gram: { $sum: "$detail_barang.perkiraan_berat" },
        total_harga: { $first: "$total_harga" },
        jumlah_bayar: { $first: "$jumlah_bayar" },
        sisa_bayar: { $first: "$sisa_bayar" },
      },
    },
    {
      $group: {
        _id: null,
        jumlah_data: { $sum: 1 },
        berat_gram: { $sum: "$berat_gram" },
        total_harga: { $sum: "$total_harga" },
        jumlah_bayar: { $sum: "$jumlah_bayar" },
        sisa_bayar: { $sum: "$sisa_bayar" },
      },
    },
  ];

  return await aggregateData("tt_pesanan", aggregate);
}

export async function getPesananFinish(args) {
  const matchStage = {
    status_validasi: "CLOSE",
    status_pesanan: "FINISH",
  };

  if (args.tanggal) {
    matchStage.tanggal = args.tanggal;
  }

  const aggregate = [
    { $match: matchStage },
    { $unwind: "$detail_barang" },
    {
      $group: {
        _id: "$_id",
        berat_gram: { $sum: "$detail_barang.perkiraan_berat" },
        total_harga: { $first: "$total_harga" },
        jumlah_bayar: { $first: "$jumlah_bayar" },
        sisa_bayar: { $first: "$sisa_bayar" },
      },
    },
    {
      $group: {
        _id: null,
        jumlah_data: { $sum: 1 },
        berat_gram: { $sum: "$berat_gram" },
        total_harga: { $sum: "$total_harga" },
        jumlah_bayar: { $sum: "$jumlah_bayar" },
        sisa_bayar: { $sum: "$sisa_bayar" },
      },
    },
  ];

  return await aggregateData("tt_pesanan", aggregate);
}

export async function getDataOpname(args) {
  const aggregate = [
    {
      $match: {
        tgl_opname: args.tgl_opname,
        status_opname: "OPEN",
        status_barang: "OPEN",
      },
    },
    {
      $group: {
        _id: "$no_opname",
        count: {
          $sum: 1,
        },
      },
    },
  ];

  return await aggregateData("tt_opname", aggregate);
}

export async function getManagerialAnalysis(args) {
  const aggregate = [
    {
      $match: {
        tgl_system: args.tgl_system,
        status_kembali:"OPEN"
      },
    },
    {
      $group: {
        _id: "$kode_dept",
        jumlah_perjenis: {
          $sum: 1,
        },
        berat_gram_perjenis: {
          $sum: "$berat",
        },
      },
    },
  ];

  return await aggregateData("tt_jual_detail", aggregate);
}

export async function getManagerialAnalysisAnnual(args) {
   let tglFilter = {};

  if (args.tgl_awal && args.tgl_akhir) {
    tglFilter = { $gte: args.tgl_awal, $lte: args.tgl_akhir };
  } else if (args.tgl_system) {
    tglFilter = args.tgl_system;
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }
  const aggregate = [
    {
      $match: {
        tgl_system: tglFilter,
        status_kembali:"OPEN"
      },
    },
    {
      $group: {
        _id: "$kode_dept",
        jumlah_perjenis: {
          $sum: 1,
        },
        berat_gram_perjenis: {
          $sum: "$berat",
        },
      },
    },
  ];

  return await aggregateData("tt_jual_detail", aggregate);
}

export async function getFullSummary(args) {
  const { tanggal, kode_gudang } = args;
  const result = {};

  try {
    result.salesDetails = await getSalesDetails({ tgl_system: tanggal });
    result.salesMarketplace = await getSalesMarketplace({
      tgl_system: tanggal,
    });
    result.totalItem = await getTotalBarang({ kode_gudang });
    result.totalCash = await getTotalCash({ tanggal });
    result.totalNonCash = await getTotalNonCash({ tanggal });
    result.pembelian = await getPembelian({ tgl_system: tanggal });
    result.service = await getService({ tgl_system: tanggal });
    result.stockHutang = await getStockHutang({ tgl_system: tanggal });
    result.pesananMasuk = await getPesananOpen({ tanggal });
    result.pesananDone = await getPesananDone({ tanggal });
    result.pesananDiambil = await getPesananFinish({ tanggal });
    result.dataOpname = await getDataOpname({ tgl_opname: tanggal });

    return result; // tambahkan return jika ingin hasilnya bisa digunakan
  } catch (error) {
    console.error("Terjadi error saat mengambil data:", error);
    throw error;
  }
}

export async function getMarginPenjualan(args) {
  try {
    let payload ={};
  if (args.tgl_awal && args.tgl_akhir) {
   payload = {
      tgl_awal: args.tgl_awal, // format: YYYY-MM-DD
      tgl_akhir: args.tgl_akhir, // format: YYYY-MM-DD
      kode_group: "ALL",
      jenis_group: "ALL",
      valid_by: "ALL",
    };
  } else if (args.tgl_system) {
     payload = {
      tgl_awal: args.tanggal, // format: YYYY-MM-DD
      tgl_akhir: args.tanggal, // format: YYYY-MM-DD
      kode_group: "ALL",
      jenis_group: "ALL",
      valid_by: "ALL",
    };
  } else {
    throw new Error("Harus menyertakan tgl_system atau tgl_awal & tgl_akhir");
  }

   

    const response = await axios.post(
      "https://103.196.146.42:5021/api/v1/penjualan/reports-margin-penjualan",
      payload,
      { httpsAgent: httpsAgent }
    );

    const data = await response.data;
    console.log(data);
    
    // Proses perhitungan margin, berat, penjualan
    let totalMargin = 0;
    let totalBeratGram = 0;
    let totalPenjualan = 0;

    data.forEach((item) => {
      totalMargin += Number(item.margin || 0);
      totalBeratGram += Number(item.berat || 0);
      totalPenjualan += Number(item.di_jual || 0);
    });

    return {
      totalPenjualan:totalPenjualan, // dalam ribuan
      totalMargin: totalMargin, // dalam ribuan
      totalBeratGram: totalBeratGram.toFixed(3), // dalam ribuan
      count: data.length,
    };
  } catch (error) {
    console.error("🔥 Terjadi kesalahan:", error.message);
    throw error;
  }
}
