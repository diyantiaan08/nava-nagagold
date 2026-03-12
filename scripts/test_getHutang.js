import 'dotenv/config';
import { getHutang } from "../function_hutang.js";

(async () => {
  try {
    const res = await getHutang({
      tgl_awal: "2026-02-01",
      tgl_akhir: "2026-03-12",
      valid_by: "ALL",
      type_tgl: "tgl_hutang"
    });

    console.log('total_jumlah:', res.total_jumlah);
    console.log('total_berat:', res.total_berat);
    console.log('total_hutang:', res.total_hutang);
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
