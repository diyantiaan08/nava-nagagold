import dotenv from 'dotenv';
dotenv.config();
import { getPenjualanAnnual } from '../function_penjualan.js';

(async () => {
  try {
    const token = process.env.TKM_TOKEN || '';
    console.log('Using token length:', token ? token.length : 0);
    const res = await getPenjualanAnnual({ tgl_awal: '2026-03-12', tgl_akhir: '2026-03-12', valid_by: 'ALL', type: 'SEMUA', useSSE: true, token });
    console.log('Result:', res);
  } catch (err) {
    console.error('ERROR:', err && err.response ? err.response.status : err.message || err);
    if (err && err.response && err.response.data) console.error('Body:', err.response.data);
    process.exit(1);
  }
})();
