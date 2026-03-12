import 'dotenv/config';
import { getReportCash } from "../function_reportcash.js";

(async () => {
  try {
    const res = await getReportCash({
      kategori: "ALL",
      tgl_from: "2026-03-12",
      tgl_to: "2026-03-12",
      user_id: "ALL",
      user_login: "devops.nagatech",
      is_sort: false
    });

    console.log('total_in:', res.total_in);
    console.log('total_out:', res.total_out);
    console.log('saldo_akhir:', res.saldo_akhir);
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
