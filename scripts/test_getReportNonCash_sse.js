import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const _es = require('eventsource');
const EventSource = _es.EventSource || _es.default || _es;

const BASE = 'https://tkmputri.goldstore.id/api/v1/report-non-cash';
const from = process.env.TGL_FROM || '2026-03-12';
const to = process.env.TGL_TO || from;
const type = process.env.TYPE || 'REKAP';
const jenis = process.env.JENIS || 'ALL';
const no_rekening = process.env.NO_REKENING || 'ALL';
const valid_by = process.env.VALID_BY || 'ALL';
const user_id = process.env.USER_ID || 'ALL';
const token = process.env.TKM_TOKEN;

if (!token) {
  console.error('TKM_TOKEN not set in environment or .env');
  process.exit(1);
}

const url = `${BASE}?tgl_from=${encodeURIComponent(from)}&tgl_to=${encodeURIComponent(to)}&type=${encodeURIComponent(type)}&jenis=${encodeURIComponent(jenis)}&no_rekening=${encodeURIComponent(no_rekening)}&valid_by=${encodeURIComponent(valid_by)}&user_id=${encodeURIComponent(user_id)}&token=${encodeURIComponent(token)}`;

console.log('Connecting to SSE URL:', url.replace(token, '<<TOKEN_REDACTED>>'));

const es = new EventSource(url);

let total_in = 0;
let total_out = 0;
let rows = [];

es.addEventListener('report-non-cash', (e) => {
  try {
    const obj = JSON.parse(e.data);
    rows.push(obj);
    // exclude SALDO AWAL when summing incoming amounts
    if (!obj.kategori || String(obj.kategori).toUpperCase() !== 'SALDO AWAL') {
      total_in += Number(obj.jumlah_in || obj.jumlah_in_fee || 0);
    }
    total_out += Number(obj.jumlah_out || 0);
    console.log('event report-non-cash:', obj.kategori, 'in', obj.jumlah_in || 0, 'out', obj.jumlah_out || 0);
  } catch (err) {
    console.error('Failed parse report-non-cash data:', e.data);
  }
});

es.addEventListener('done', (e) => {
  console.log('SSE done event:', e.data);
  const saldo = total_in - total_out;
  console.log('Aggregated total_in:', total_in);
  console.log('Aggregated total_out:', total_out);
  console.log('Saldo akhir:', saldo);
  console.log('Rows received:', rows.length);
  es.close();
  process.exit(0);
});

es.addEventListener('open', () => console.log('SSE connection opened'));

es.addEventListener('error', (err) => {
  console.error('SSE error', err && err.message ? err.message : err);
  es.close();
  process.exit(1);
});
