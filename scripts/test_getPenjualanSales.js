import 'dotenv/config';
import dayjs from 'dayjs';
import { getPenjualanSales } from '../function_penjualan_sales.js';

(async () => {
  try {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const res = await getPenjualanSales({ tgl_awal: yesterday, tgl_akhir: yesterday });
    console.log('date:', yesterday);
    console.log('rows length:', res.rows.length);
    console.log('aggregate top 5:', JSON.stringify(res.aggregate.slice(0,5), null, 2));
  } catch (err) {
    console.error('Error:', err && err.message || err);
    if (err && err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
