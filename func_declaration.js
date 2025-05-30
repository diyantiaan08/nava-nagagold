import { Type } from "@google/genai";

// Simpan semua deklarasi fungsi ke dalam array untuk tools Gemini
export const functionDeclarations = [
  {
    name: "get_sales_details",
    description:
      "Mendapatkan data penjualan berdasarkan satu tanggal atau rentang tanggal tertentu.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Jika ingin data penjualan pada satu tanggal spesifik (format: YYYY-MM-DD)",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // biarkan kosong agar Gemini bisa memilih salah satu
    },
  },
  {
    name: "get_sales_annual",
    description:
      "Mendapatkan data penjualan berdasarkan rentang tanggal tertentu. tetapi ini lebih ringkas dan cocok untuk pertanyaan dengan range tanggal yang panjang.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Jika ingin data penjualan pada satu tanggal spesifik (format: YYYY-MM-DD)",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // biarkan kosong agar Gemini bisa memilih salah satu
    },
  },
  {
    name: "get_sales_marketplace",
    description:
      "Mendapatkan total data penjualan dan total berat yang dijual di marketplace, misalnya Shopee.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Tanggal penjualan yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01,",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },

  {
    name: "get_margin_penjualan",
    description: "Mendapatkan margin dari penjualan",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description: "Tanggal dalam format YYYY-MM-DD",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_total_cash",
    description: "mengambil total rupiah berdasarkan tanggal yang diberikan",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description:
            "tanggal yang ingin dicari oleh user untuk mendapatkan data total rupiah. misalnya, tanggal 1 mei 2025",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },

  {
    name: "get_total_noncash",
    description:
      "mengambil total data pembayaran non cash berdasarkan tanggal yang diberikan. data non cash ini seperti transfer, deber, dan credit",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description:
            "tanggal yang ingin dicari oleh user untuk mendapatkan data total rupiah. misalnya, tanggal 1 mei 2025",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },

      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },

  {
    name: "get_pembelian",
    description:
      "Mendapatkan total data pembelian dan total berat yang dibeli kembali oleh toko.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Tanggal pembelian yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01,",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
  {
    name: "get_pembelian_annual",
    description:
      "Mendapatkan total data pembelian dan total berat yang dibeli kembali oleh toko dalam rentang waktu tertentu. tetapi ini lebih ringkas dan cocok untuk pertanyaan dengan range tanggal yang panjang.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Tanggal pembelian yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01,",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
  {
    name: "get_service",
    description:
      "Mendapatkan total data service (reparasi) sesuai filter tanggal yang diberikan",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Tanggal data service yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01,",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
  {
    name: "get_stock_hutang",
    description:
      'Mendapatkan total data hutang (gadai) dan berat yang belum dilunasi, yaitu dengan status_hutang:"OPEN", status_valid:"DONE"',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Tanggal hutang yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01, bisa semua tanggal",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
  {
    name: "get_pesanan_open",
    description:
      'Mendapatkan total data pesanan (barang custom) dan berat yang baru masuk atau belum selesai, yaitu dengan status_pesanan:"OPEN", status_valid:"CLOSE"',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description:
            "Tanggal pesanan yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01, bisa semua tanggal",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
  {
    name: "get_pesanan_done",
    description:
      'Mendapatkan total data pesanan (barang custom) dan berat yang sudah selesai namun belum di ambil, yaitu dengan status_pesanan:"DONE", status_valid:"CLOSE"',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description:
            "Tanggal pesanan yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01, bisa semua tanggal",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
  {
    name: "get_pesanan_finish",
    description:
      'Mendapatkan total data pesanan (barang custom) dan berat yang sudah di ambil oleh pelanggan, yaitu dengan status_pesanan:"FINISH", status_valid:"CLOSE"',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description:
            "Tanggal pesanan yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01, bisa semua tanggal",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },

  {
    name: "get_data_opname",
    description:
      'Mengambil jumlah data yang selisih (barang hilang) per nomor opname yaitu dengan status_barang:"OPEN", status_opname:"OPEN"',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_opname: {
          type: Type.STRING,
          description:
            "Tanggal data opname yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01, bisa semua tanggal",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: ["tgl_opname"],
    },
  },
  {
    name: "get_managerial_analysis",
    description:
      "Mendapatkan total data dan berat penjualan yang digrouping per jenis. kemudian setelah itu, bandingkan data mana yang paling laku jika dilihat berdasarkan qty (jumlah) ataupun berdasarkan berat dari semua jenis",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Tanggal data yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01,",
        },
      },
      required: ["tgl_system"],
    },
  },
  {
    name: "get_managerial_analysis_annual",
    description:
      "Mendapatkan total data dan berat penjualan yang digrouping per jenis. kemudian setelah itu, bandingkan data mana yang paling laku jika dilihat berdasarkan qty (jumlah) ataupun berdasarkan berat dari semua jenis",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tgl_system: {
          type: Type.STRING,
          description:
            "Jika ingin data penjualan pada satu tanggal spesifik (format: YYYY-MM-DD)",
        },
        tgl_awal: {
          type: Type.STRING,
          description:
            "Tanggal awal dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
        tgl_akhir: {
          type: Type.STRING,
          description:
            "Tanggal akhir dari rentang waktu yang ingin dicari (format: YYYY-MM-DD)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_full_summary",
    // description: 'Mendapatkan total semua data dari jika user ingin mengetahui seluruh ringkasan transaksi berdasarkan tanggal yang dipilih, misalnya 3 maret 2025',
    description:
      "Mendapatkan total semua data dari semua transaksi (semua fungsi yang ada) berdasarkan tanggal yang dipilih, misalnya 3 maret 2025",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tanggal: {
          type: Type.STRING,
          description:
            "Tanggal data yang ingin dicari (format: YYYY-MM-DD). Contoh: 2025-05-01,",
        },
      },
      required: ["tanggal"],
    },
  },
  {
    name: "get_total_item",
    description:
      "mengambil total barang dan berat dari kode gudang yang berikan, misalnya gudang TOKO.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kode_gudang: {
          type: Type.STRING,
          description:
            "lokasi gudang dimana item tersebut berada dan kode gudang barang sesuai yang ingin dicari oleh user. misalnya, gudang TOKO",
        },
      },
      required: ["kode_gudang"], // Saat ini tidak ada parameter spesifik, bisa ditambahkan jika diperlukan untuk query lebih lanjut
    },
  },
];
