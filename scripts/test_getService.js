import 'dotenv/config';
import { getService } from "../function_service.js";

(async () => {
  try {
    const res = await getService({
      tgl_awal: "2026-03-01",
      tgl_akhir: "2026-03-12",
      valid_by: "ALL"
    });

    console.log('total_qty:', res.total_qty);
    console.log('total_berat:', res.total_berat);
    console.log('total_rp:', res.total_rp);
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
