import dayjs from 'dayjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chrono = require('chrono-node');

export function parseDatePhrase(text) {
  if (!text || !text.trim()) return null;

  const lowered = text.toLowerCase();
  // First, handle explicit Indonesian date formats like "5 maret 2026" or ranges
  try {
    const monthNames = {
      januari: 1, jan: 1,
      februari: 2, feb: 2,
      maret: 3, mar: 3,
      april: 4, apr: 4,
      mei: 5,
      juni: 6, jun: 6,
      juli: 7, jul: 7,
      agustus: 8, agt: 8,
      september: 9, sep: 9,
      oktober: 10, okt: 10,
      november: 11, nov: 11,
      desember: 12, des: 12
    };
    // match: 5 maret 2026 | 5-7 maret 2026 | 5 sampai 7 maret 2026
    const monthKeys = Object.keys(monthNames).join('|');
    const re = new RegExp("(\\d{1,2})(?:\\s*(?:-|sampai|to)\\s*(\\d{1,2}))?\\s+(" + monthKeys + ")(?:\\s+(\\d{4}))?", 'i');
    const m = lowered.match(re);
    if (m) {
      const d1 = Number(m[1]);
      const d2 = m[2] ? Number(m[2]) : null;
      const monthStr = m[3].toLowerCase();
      const yearStr = m[4] || String(dayjs().year());
      const month = monthNames[monthStr];
      if (month) {
        const start = dayjs(`${yearStr}-${String(month).padStart(2,'0')}-${String(d1).padStart(2,'0')}`).format('YYYY-MM-DD');
        const end = d2 ? dayjs(`${yearStr}-${String(month).padStart(2,'0')}-${String(d2).padStart(2,'0')}`).format('YYYY-MM-DD') : start;
        return { tgl_awal: start, tgl_akhir: end };
      }
    }
  } catch (e) {
    // ignore and fallback to other heuristics
  }
  // Handle common Indonesian relative words first
  if (/\bkemarin\b/.test(lowered)) {
    const t = dayjs().subtract(1, 'day');
    const d = t.format('YYYY-MM-DD');
    return { tgl_awal: d, tgl_akhir: d };
  }
  if (/\bhari ini\b|\bhari ini\b|\bsekarang\b|\btoday\b/.test(lowered)) {
    const d = dayjs().format('YYYY-MM-DD');
    return { tgl_awal: d, tgl_akhir: d };
  }
  if (/\bbesok\b|\bbesoknya\b/.test(lowered)) {
    const d = dayjs().add(1, 'day').format('YYYY-MM-DD');
    return { tgl_awal: d, tgl_akhir: d };
  }

  // Day after tomorrow
  if (/\blusa\b|\bkeesokan hari\b/.test(lowered)) {
    const d = dayjs().add(2, 'day').format('YYYY-MM-DD');
    return { tgl_awal: d, tgl_akhir: d };
  }

  // Weeks (ISO week: Monday - Sunday)
  if (/\bminggu ini\b/.test(lowered)) {
    const today = dayjs();
    const isoDow = (today.day() + 6) % 7; // 0..6 where 0=Mon
    const start = today.subtract(isoDow, 'day').format('YYYY-MM-DD');
    const end = dayjs(start).add(6, 'day').format('YYYY-MM-DD');
    return { tgl_awal: start, tgl_akhir: end };
  }
  if (/\bminggu lalu\b|\bminggu kemarin\b|\bseminggu yang lalu\b/.test(lowered)) {
    const today = dayjs();
    const isoDow = (today.day() + 6) % 7;
    const start = today.subtract(isoDow + 7, 'day').format('YYYY-MM-DD');
    const end = dayjs(start).add(6, 'day').format('YYYY-MM-DD');
    return { tgl_awal: start, tgl_akhir: end };
  }

  // Months
  if (/\bbulan ini\b/.test(lowered)) {
    const start = dayjs().startOf('month').format('YYYY-MM-DD');
    const end = dayjs().endOf('month').format('YYYY-MM-DD');
    return { tgl_awal: start, tgl_akhir: end };
  }
  if (/\bbulan lalu\b|\bbulan kemarin\b/.test(lowered)) {
    const start = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const end = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
    return { tgl_awal: start, tgl_akhir: end };
  }

  // Years
  if (/\btahun ini\b/.test(lowered)) {
    const start = dayjs().startOf('year').format('YYYY-MM-DD');
    const end = dayjs().endOf('year').format('YYYY-MM-DD');
    return { tgl_awal: start, tgl_akhir: end };
  }
  if (/\btahun lalu\b/.test(lowered)) {
    const start = dayjs().subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
    const end = dayjs().subtract(1, 'year').endOf('year').format('YYYY-MM-DD');
    return { tgl_awal: start, tgl_akhir: end };
  }
  const results = chrono.parse(text);
  if (!results.length) return null;

  const { start, end } = results[0];
  const tgl_awal = dayjs(start.date()).format('YYYY-MM-DD');
  const tgl_akhir = end ? dayjs(end.date()).format('YYYY-MM-DD') : tgl_awal;

  return { tgl_awal, tgl_akhir };
}
