import dayjs from "dayjs";
import { functionDeclarations } from "./func_declaration.js";
import { parseDatePhrase } from "./parseNaturalDate.js";
import { appendDebugLog, getQuestionLower } from "./chat_utils.js";

const SPECIAL_SIGNALS = {
  pembelian: /\bpembelian\b/i,
  penjualan: /\bpenjualan\b/i,
  sales: /\bsales\b/i,
  member: /\bmember\b/i,
  marketplace: /\bmarketplace\b|\btokopedia\b|\bshopee\b|\blazada\b|\bonline\b/i,
  hutangLunas: /\bhutang lunas\b|\blunas hutang\b|pelunasan hutang|\bsudah dilunasi\b/i,
  nonCash: /\bnon(?:-|\s)?cash\b|transfer|debet|kredit|rekening|rekening bank/i,
  cash: /\bcash\b|\bkas\b|saldo kas|uang kas|total kas/i,
  margin: /\bmargin\b|\blaba\b|\bkeuntungan\b/i,
};

function detectTopMemberSortBy(question = "") {
  if (/\b(point|poin)\b/i.test(question)) return "trx_point";
  if (/\b(nominal|rupiah|rp|belanja terbesar|nilai belanja|omzet member)\b/i.test(question)) return "trx_rp";
  return "trx_count";
}

function buildDateRange(dateMode, parsedDate) {
  const today = dayjs().format("YYYY-MM-DD");
  if (dateMode === "single") {
    return { tanggal: (parsedDate && parsedDate.tgl_awal) || today };
  }

  if (dateMode === "from_to") {
    const from = (parsedDate && parsedDate.tgl_awal) || today;
    const to = (parsedDate && parsedDate.tgl_akhir) || from;
    return { tgl_from: from, tgl_to: to, tgl_awal: from, tgl_akhir: to };
  }

  const start = (parsedDate && parsedDate.tgl_awal) || today;
  const end = (parsedDate && parsedDate.tgl_akhir) || start;
  return { tgl_awal: start, tgl_akhir: end };
}

function getDeclarationMatches(declaration, question, normalizedQuestion) {
  const reasons = [];
  let score = declaration.priority || 0;

  for (const keyword of declaration.keywords || []) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(question)) {
      score += keyword.length;
      reasons.push(`keyword:${keyword}`);
    }
  }

  for (const pattern of declaration.patterns || []) {
    if (pattern.test(question)) {
      score += 50;
      reasons.push(`pattern:${pattern.source}`);
    }
  }

  if (!reasons.length) return null;

  if (declaration.type === "pembelian_sales" && SPECIAL_SIGNALS.pembelian.test(question) && SPECIAL_SIGNALS.sales.test(question)) {
    score += 500;
    reasons.push("rule:pembelian_sales_priority");
  }

  if (declaration.type === "penjualan_sales" && SPECIAL_SIGNALS.penjualan.test(question) && SPECIAL_SIGNALS.sales.test(question)) {
    score += 400;
    reasons.push("rule:penjualan_sales_priority");
  }

  if (declaration.type === "penjualan_marketplace" && SPECIAL_SIGNALS.marketplace.test(question)) {
    score += 450;
    reasons.push("rule:marketplace_priority");
  }

  if (declaration.type === "report_non_cash" && SPECIAL_SIGNALS.nonCash.test(question)) {
    score += 450;
    reasons.push("rule:non_cash_priority");
  }

  if (declaration.type === "hutang_lunas" && SPECIAL_SIGNALS.hutangLunas.test(question)) {
    score += 450;
    reasons.push("rule:hutang_lunas_priority");
  }

  if (declaration.type === "margin_penjualan" && SPECIAL_SIGNALS.margin.test(question)) {
    score += 500;
    reasons.push("rule:margin_priority");
  }

  if (declaration.type === "penjualan_report" && SPECIAL_SIGNALS.marketplace.test(question)) {
    score -= 200;
    reasons.push("penalty:marketplace_overlap");
  }

  if (declaration.type === "penjualan_report" && SPECIAL_SIGNALS.sales.test(question) && SPECIAL_SIGNALS.penjualan.test(question)) {
    score -= 150;
    reasons.push("penalty:penjualan_sales_overlap");
  }

  if (declaration.type === "pembelian" && SPECIAL_SIGNALS.sales.test(question) && SPECIAL_SIGNALS.pembelian.test(question)) {
    score -= 125;
    reasons.push("penalty:pembelian_sales_overlap");
  }

  if (declaration.type === "report_cash" && SPECIAL_SIGNALS.nonCash.test(question)) {
    score -= 250;
    reasons.push("penalty:cash_vs_non_cash_overlap");
  }

  if (declaration.type === "hutang" && SPECIAL_SIGNALS.hutangLunas.test(question)) {
    score -= 250;
    reasons.push("penalty:hutang_lunas_overlap");
  }

  if (declaration.type === "penjualan_report" && SPECIAL_SIGNALS.margin.test(question) && normalizedQuestion.includes("penjualan")) {
    score -= 200;
    reasons.push("penalty:margin_overlap");
  }

  return { declaration, score, reasons };
}

export function resolveIntent(question, options = {}) {
  const declarations = options.declarations || functionDeclarations;
  const normalizedQuestion = getQuestionLower(question);
  const parsedDate = parseDatePhrase(question);
  const candidates = [];

  for (const declaration of declarations) {
    const candidate = getDeclarationMatches(declaration, question, normalizedQuestion);
    if (candidate) candidates.push(candidate);
  }

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return (right.declaration.priority || 0) - (left.declaration.priority || 0);
  });

  const selected = candidates[0] || null;
  const matchedFunction = selected ? selected.declaration : null;
  const dateRange = buildDateRange(matchedFunction ? matchedFunction.dateMode : "range", parsedDate);
  const result = {
    type: matchedFunction ? matchedFunction.type : null,
    matchedFunction,
    dateRange,
    args: { ...dateRange },
    confidence: selected ? selected.score : 0,
    reason: selected ? selected.reasons.join(", ") : "no_match",
    requiresAuth: matchedFunction ? matchedFunction.authPolicy !== "none" : false,
    responseMode: matchedFunction ? matchedFunction.responseMode : "model_fallback",
    parsedDate,
    question,
  };

  if (matchedFunction && matchedFunction.type === "top_member") {
    result.args.sort_by = detectTopMemberSortBy(question);
  }

  appendDebugLog(
    `intent_resolution:${JSON.stringify({
      question: question.slice(0, 160),
      type: result.type,
      reason: result.reason,
      confidence: result.confidence,
      parsedDate,
    })}`
  );

  return result;
}
