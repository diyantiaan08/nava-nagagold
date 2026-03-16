import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dayjs from "dayjs";
import { parseDatePhrase } from "./parseNaturalDate.js";
import { functionDeclarations } from "./func_declaration.js";
import { resolveIntent as defaultResolveIntent } from "./intent_resolver.js";
import { executeIntent as defaultExecuteIntent, safeCallGlobal } from "./intent_executor.js";
import { formatAnswer as defaultFormatAnswer, formatExecutionError } from "./response_formatter.js";
import { DEFAULT_SYSTEM_PROMPT, streamModelResponse as defaultStreamModelResponse } from "./ollama_stream.js";
import { getSmalltalkResponse } from "./smalltalk.js";
import {
  appendDebugLog,
  endSse,
  extractTokenFromRequest,
  getMissingTokenMessage,
  writeSseData,
  writeSseEvent,
} from "./chat_utils.js";

function isLikelyDataQuestion(question = "") {
  return /\b(berapa|siapa|mana|jumlah|total|omzet|stok|stock|penjualan|pembelian|hutang|margin|cash|non(?:-|\s)?cash|service|sales|jual|menjual|laporan|saldo|pelanggan|customer|member|loyal|barang|produk|transaksi|pesanan|custom)\b/i.test(
    String(question || "")
  );
}

export function createStreamAskHandler(options = {}) {
  const declarations = options.functionDeclarations || functionDeclarations;
  const resolveIntent = options.resolveIntent || defaultResolveIntent;
  const executeIntent = options.executeIntent || defaultExecuteIntent;
  const formatAnswer = options.formatAnswer || defaultFormatAnswer;
  const streamModelResponse = options.streamModelResponse || defaultStreamModelResponse;

  return async function streamAskHandler(req, res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (res.flushHeaders) res.flushHeaders();

    const question = req.query.question || "";
    writeSseEvent(res, "thinking", "<think>");

    appendDebugLog(`question_check:${question}`);
    const smalltalkResponse = getSmalltalkResponse(question);
    if (smalltalkResponse) {
      writeSseData(res, smalltalkResponse);
      endSse(res);
      return;
    }

    const resolution = resolveIntent(question, { declarations });
    if (!resolution.type && isLikelyDataQuestion(question)) {
      writeSseData(
        res,
        "Maaf, saya belum memahami maksud pertanyaan data tersebut dengan tepat. Coba gunakan kalimat yang lebih spesifik, misalnya menyebut penjualan, pembelian, stok, hutang, cash, non-cash, service, atau sales."
      );
      endSse(res);
      return;
    }

    const execution = await executeIntent(resolution, req);

    appendDebugLog(
      `stream_ask_state:${JSON.stringify({
        question: question.slice(0, 160),
        intent: resolution.type,
        status: execution.status,
      })}`
    );

    if (execution.status === "missing_auth" || execution.status === "auth_error") {
      writeSseData(res, execution.message);
      endSse(res);
      return;
    }

    if (execution.status === "success") {
      const answer = formatAnswer(execution.type, execution.data, execution.meta, question);
      if (answer) {
        writeSseData(res, answer);
        endSse(res);
        return;
      }
    }

    if (execution.status === "execution_error" && resolution.type) {
      writeSseData(res, formatExecutionError(resolution.type, execution.meta));
      endSse(res);
      return;
    }

    if (resolution.requiresAuth && !extractTokenFromRequest(req)) {
      writeSseData(res, getMissingTokenMessage());
      endSse(res);
      return;
    }

    await streamModelResponse(res, question, { systemPrompt: DEFAULT_SYSTEM_PROMPT });
  };
}

export function createApp(options = {}) {
  const declarations = options.functionDeclarations || functionDeclarations;
  const streamAskHandler = createStreamAskHandler(options);

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(bodyParser.json());

  app.post("/getitem", async (req, res) => {
    try {
      const { tanggal, gudang, natural_date } = req.body;
      let tgl = tanggal;
      if (!tgl && natural_date) {
        const parsed = parseDatePhrase(natural_date);
        tgl = parsed ? parsed.tgl_awal : undefined;
      }
      const getItem = declarations.find((entry) => entry.name === "getItem");
      if (!getItem) return res.status(500).json({ error: "getItem not found" });
      const result = await getItem.func({ tanggal: tgl, gudang });
      res.json(result);
    } catch (error) {
      const status = error && error.response && error.response.status;
      const body = error && error.response && error.response.data;
      res.status(500).json({ error: error.message, status, body });
    }
  });

  app.post("/getpenjualan", async (req, res) => {
    try {
      const { tanggal_awal, tanggal_akhir } = req.body;
      let tgl_awal = tanggal_awal;
      let tgl_akhir = tanggal_akhir;
      if (!tgl_awal && req.body.natural_date) {
        const parsed = parseDatePhrase(req.body.natural_date);
        if (parsed) {
          tgl_awal = parsed.tgl_awal;
          tgl_akhir = parsed.tgl_akhir || parsed.tgl_awal;
        }
      }
      tgl_awal = tgl_awal || dayjs().format("YYYY-MM-DD");
      tgl_akhir = tgl_akhir || tgl_awal;
      const fn = declarations.find((entry) => entry.name === "getPenjualanAnnual");
      if (!fn) return res.status(500).json({ error: "getPenjualanAnnual not found" });
      const incomingToken = req.body.token || req.headers["x-auth-token"] || req.query.token;
      const result = await fn.func({ tgl_awal, tgl_akhir, token: incomingToken });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/test/all", async (req, res) => {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.status(400).json({
        error: "missing token. provide ?token= or x-auth-token header or set TKM_TOKEN in .env",
      });
    }

    const date = req.query.date || dayjs().format("YYYY-MM-DD");
    const candidates = [
      { name: "getItem", args: { tanggal: date } },
      { name: "getHutang", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getHutangLunas", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getMarginPenjualan", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getPembelian", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getPembelianSales", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getPenjualanMarketplace", args: { tgl_from: date, tgl_to: date } },
      { name: "getPenjualanSales", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getPenjualanAnnual", args: { tgl_awal: date, tgl_akhir: date } },
      { name: "getReportCash", args: { tgl_from: date, tgl_to: date } },
      { name: "getReportNonCash", args: { tgl_from: date, tgl_to: date } },
      { name: "getPesanan", args: { tgl_from: date, tgl_to: date } },
      { name: "getService", args: { tgl_awal: date, tgl_akhir: date } },
    ];
    const out = {};

    for (const candidate of candidates) {
      const fn = declarations.find((entry) => entry.name === candidate.name);
      if (!fn) {
        out[candidate.name] = { error: "not found" };
        continue;
      }
      try {
        const result = await safeCallGlobal(fn.func, {
          ...candidate.args,
          token,
          incomingHeaders: req.headers,
        });
        out[candidate.name] = { ok: true, result };
      } catch (error) {
        if (error && error.message === "AUTH_TERMINATED") {
          return res.status(401).json({ error: "auth terminated by upstream", detail: "invalid token" });
        }
        out[candidate.name] = { ok: false, error: error && error.message, stack: error && error.stack };
      }
    }

    res.json(out);
  });

  app.get("/debug/call", async (req, res) => {
    const name = req.query.fn;
    if (!name) return res.status(400).json({ error: "missing fn param" });
    const fn = declarations.find((entry) => entry.name === name);
    if (!fn) return res.status(404).json({ error: "function not found" });
    const token = extractTokenFromRequest(req);

    try {
      const args = req.query.args ? JSON.parse(req.query.args) : {};
      const result = await fn.func({ token, incomingHeaders: req.headers, ...args });
      res.json({ ok: true, result });
    } catch (error) {
      res.json({ ok: false, error: error && error.message, stack: error && error.stack });
    }
  });

  app.get("/stream/ask", streamAskHandler);

  return app;
}
