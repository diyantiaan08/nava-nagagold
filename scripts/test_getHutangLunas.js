import 'dotenv/config';
import { getHutangLunas } from "../function_hutang.js";

(async () => {
  try {
    const res = await getHutangLunas({
      tgl_awal: "2026-03-01",
      tgl_akhir: "2026-03-12",
      valid_by: "ALL",
      type_tgl: "tgl_lunas",
      berdasarkan: "ALL"
    });

    console.log('total_jumlah:', res.total_jumlah);
    console.log('total_hutang_lunas:', res.total_hutang_lunas);
    console.log('total_bunga_lunas:', res.total_bunga_lunas);
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
