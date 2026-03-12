import 'dotenv/config';
import { getPembelianSales } from "../function_pembelian.js";

(async () => {
  try {
    const res = await getPembelianSales({
      tgl_awal: "2026-03-12",
      tgl_akhir: "2026-03-12",
      kode_sales: "ALL",
      kode_group: "ALL",
      valid_by: "ALL",
      jenis_group: "ALL",
      sortBy: "berat"
    });

    console.log('aggregate:', JSON.stringify(res.aggregate, null, 2));
    console.log('rows length:', res.rows.length);
  } catch (err) {
    console.error('Error:', err && err.message || err);
    if (err && err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
