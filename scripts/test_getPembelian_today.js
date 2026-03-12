import 'dotenv/config';
import dayjs from 'dayjs';
import { getPembelian } from '../function_pembelian.js';

(async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const res = await getPembelian({ tgl_awal: today, tgl_akhir: today });
    console.log('date:', today);
    console.log('total_count:', res.total_count);
    console.log('total_berat:', res.total_berat);
    console.log('total_rupiah:', res.total_rupiah);
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
