import dayjs from 'dayjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chrono = require('chrono-node');

export function parseDatePhrase(text) {
  const results = chrono.parse(text);
  if (!results.length) return null;

  const { start, end } = results[0];
  const tgl_awal = dayjs(start.date()).format('YYYY-MM-DD');
  const tgl_akhir = end ? dayjs(end.date()).format('YYYY-MM-DD') : tgl_awal;

  return { tgl_awal, tgl_akhir };
}
