import dayjs from "dayjs";
import fs from "fs";

export const DEBUG_LOG_PATH = "/tmp/sse_debug.log";

export function appendDebugLog(message) {
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, `${message}\n`);
  } catch (error) {
    // ignore debug logging failures
  }
}

export function formatDateIndo(isoDate) {
  if (!isoDate) return "";
  const d = dayjs(isoDate);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${d.date()} ${months[d.month()]} ${d.year()}`;
}

export function formatInteger(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

export function formatDecimal(value) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}

export function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function extractTokenFromRequest(reqOrContext = {}) {
  const query = reqOrContext.query || {};
  const headers = reqOrContext.headers || {};
  return query.token || headers["x-auth-token"] || process.env.TKM_TOKEN || "";
}

export function extractIncomingHeaders(reqOrContext = {}) {
  return reqOrContext.headers || {};
}

export function getMissingTokenMessage() {
  return "Maaf, token tidak tersedia. Sertakan token lewat query `?token=` atau header `x-auth-token`, atau set TKM_TOKEN di .env.";
}

export function getAuthFailedMessage() {
  return "Maaf, server data menolak akses (token tidak valid atau kedaluwarsa). Silakan login ulang dan pastikan token dikirim lewat `?token=` atau header `x-auth-token`.";
}

export function maskToken(token) {
  if (!token) return null;
  const value = String(token);
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function writeSseData(res, message) {
  res.write(`data: ${message}\n\n`);
}

export function writeSseEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${data}\n\n`);
}

export function endSse(res, status = "done") {
  writeSseEvent(res, "done", JSON.stringify({ status }));
  res.end();
}

export function detectRelativeDateLabel(question = "") {
  const match = question.match(
    /\b(kemarin|hari ini|sekarang|besok|lusa|keesokan hari|minggu ini|minggu lalu|minggu kemarin|bulan ini|bulan lalu|tahun ini|tahun lalu)\b/i
  );
  if (!match) return null;
  let label = match[0].toLowerCase();
  if (label === "sekarang") label = "hari ini";
  if (label === "keesokan hari") label = "besok";
  return label;
}

export function buildWhenLabel(question = "", dateRange = {}) {
  const relativeLabel = detectRelativeDateLabel(question);
  if (relativeLabel) return relativeLabel;

  if (dateRange.tgl_awal && dateRange.tgl_akhir) {
    if (dateRange.tgl_awal === dateRange.tgl_akhir) {
      return formatDateIndo(dateRange.tgl_awal);
    }
    return `periode ${formatDateIndo(dateRange.tgl_awal)} sampai ${formatDateIndo(dateRange.tgl_akhir)}`;
  }

  if (dateRange.tanggal) {
    return formatDateIndo(dateRange.tanggal);
  }

  return "hari ini";
}

export function getQuestionLower(question = "") {
  return String(question || "").toLowerCase();
}

export function safeJsonParse(input, fallback = null) {
  try {
    return JSON.parse(input);
  } catch (error) {
    return fallback;
  }
}
