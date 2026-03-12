import 'dotenv/config';
import { getReportNonCash } from "../function_reportnoncash.js";

(async () => {
  try {
    const res = await getReportNonCash({
      tgl_from: "2026-03-12",
      tgl_to: "2026-03-12",
      type: "REKAP",
      jenis: "ALL",
      no_rekening: "ALL",
      valid_by: "ALL",
      user_id: "ALL",
      token: process.env.TKM_TOKEN || undefined,
      useSSE: true
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
