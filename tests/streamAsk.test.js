import test from "node:test";
import assert from "node:assert/strict";
import { createStreamAskHandler } from "../app.js";

function createMockResponse() {
  const chunks = [];
  return {
    headers: {},
    writableEnded: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    flushHeaders() {},
    write(chunk) {
      chunks.push(chunk);
    },
    end(chunk = "") {
      if (chunk) chunks.push(chunk);
      this.writableEnded = true;
    },
    getBody() {
      return chunks.join("");
    },
  };
}

function parseSse(text) {
  return text
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n");
      const eventLine = lines.find((line) => line.startsWith("event: "));
      const dataLine = lines.find((line) => line.startsWith("data: "));
      return {
        event: eventLine ? eventLine.slice(7) : "message",
        data: dataLine ? dataLine.slice(6) : "",
      };
    });
}

test("stream ask returns deterministic formatted answer and done event", async () => {
  const handler = createStreamAskHandler({
    resolveIntent: () => ({
      type: "penjualan_report",
      matchedFunction: { name: "getPenjualanAnnual", type: "penjualan_report", authPolicy: "required" },
      dateRange: { tgl_awal: "2026-03-10", tgl_akhir: "2026-03-10" },
      args: { tgl_awal: "2026-03-10", tgl_akhir: "2026-03-10" },
      requiresAuth: true,
      responseMode: "deterministic",
      confidence: 100,
      reason: "test",
      question: "berapa penjualan kemarin",
    }),
    executeIntent: async () => ({
      status: "success",
      type: "penjualan_report",
      data: { total_rupiah: 1200000, total_qty: 3, total_berat: 12.3 },
      meta: { dateRange: { tgl_awal: "2026-03-10", tgl_akhir: "2026-03-10" } },
    }),
    streamModelResponse: async () => {
      throw new Error("model should not be called");
    },
  });

  const req = { query: { question: "test", token: "abc" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  const events = parseSse(body);
  assert.equal(events.at(-1).event, "done");
  assert.match(body, /Untuk penjualan pada 10 Maret 2026/);
});

test("stream ask returns missing token error without model fallback", async () => {
  let modelCalled = false;
  const handler = createStreamAskHandler({
    resolveIntent: () => ({
      type: "stock",
      matchedFunction: { name: "getItem", type: "stock", authPolicy: "required" },
      dateRange: { tanggal: "2026-03-10" },
      args: { tanggal: "2026-03-10" },
      requiresAuth: true,
      responseMode: "deterministic",
      confidence: 90,
      reason: "test",
      question: "stok hari ini",
    }),
    executeIntent: async () => ({
      status: "missing_auth",
      type: "stock",
      message: "Maaf, token tidak tersedia. Sertakan token lewat query `?token=` atau header `x-auth-token`, atau set TKM_TOKEN di .env.",
      meta: { dateRange: { tanggal: "2026-03-10" } },
    }),
    streamModelResponse: async () => {
      modelCalled = true;
    },
  });

  const req = { query: { question: "test" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  assert.match(body, /token tidak tersedia/);
  assert.equal(modelCalled, false);
});

test("stream ask returns auth error without model fallback", async () => {
  let modelCalled = false;
  const handler = createStreamAskHandler({
    resolveIntent: () => ({
      type: "stock",
      matchedFunction: { name: "getItem", type: "stock", authPolicy: "required" },
      dateRange: { tanggal: "2026-03-10" },
      args: { tanggal: "2026-03-10" },
      requiresAuth: true,
      responseMode: "deterministic",
      confidence: 90,
      reason: "test",
      question: "stok hari ini",
    }),
    executeIntent: async () => ({
      status: "auth_error",
      type: "stock",
      message: "Maaf, server data menolak akses (token tidak valid atau kedaluwarsa). Silakan login ulang dan pastikan token dikirim lewat `?token=` atau header `x-auth-token`.",
      meta: { dateRange: { tanggal: "2026-03-10" } },
    }),
    streamModelResponse: async () => {
      modelCalled = true;
    },
  });

  const req = { query: { question: "test", token: "bad" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  assert.match(body, /token tidak valid atau kedaluwarsa/);
  assert.equal(modelCalled, false);
});

test("stream ask handles greeting without calling model", async () => {
  let modelCalled = false;
  const handler = createStreamAskHandler({
    streamModelResponse: async () => {
      modelCalled = true;
    },
  });

  const req = { query: { question: "hallo" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  assert.match(body, /Halo, saya asisten virtual/);
  assert.equal(modelCalled, false);
});

test("stream ask handles thanks without looping offer", async () => {
  let modelCalled = false;
  const handler = createStreamAskHandler({
    streamModelResponse: async () => {
      modelCalled = true;
    },
  });

  const req = { query: { question: "terima kasih" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  assert.match(body, /Sama-sama/);
  assert.equal(modelCalled, false);
});

test("stream ask avoids hallucinated data when intent is not resolved", async () => {
  let modelCalled = false;
  const handler = createStreamAskHandler({
    resolveIntent: () => ({
      type: null,
      matchedFunction: null,
      dateRange: { tgl_awal: "2026-03-10", tgl_akhir: "2026-03-10" },
      args: { tgl_awal: "2026-03-10", tgl_akhir: "2026-03-10" },
      requiresAuth: false,
      responseMode: "model_fallback",
      confidence: 0,
      reason: "no_match",
      question: "berapa sesuatu yang tidak dipahami",
    }),
    streamModelResponse: async () => {
      modelCalled = true;
    },
  });

  const req = { query: { question: "berapa sesuatu yang tidak dipahami" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  assert.match(body, /saya belum memahami maksud pertanyaan data tersebut dengan tepat/i);
  assert.equal(modelCalled, false);
});

test("stream ask blocks unsupported customer loyalty question from model fallback", async () => {
  let modelCalled = false;
  const handler = createStreamAskHandler({
    resolveIntent: () => ({
      type: null,
      matchedFunction: null,
      dateRange: {},
      args: {},
      requiresAuth: false,
      responseMode: "model_fallback",
      confidence: 0,
      reason: "no_match",
      question: "pelanggan mana yg paling loyal?",
    }),
    streamModelResponse: async () => {
      modelCalled = true;
    },
  });

  const req = { query: { question: "pelanggan mana yg paling loyal?" }, headers: {} };
  const res = createMockResponse();
  await handler(req, res);

  const body = res.getBody();
  assert.match(body, /tidak ingin memberikan jawaban yang berisiko salah/i);
  assert.equal(modelCalled, false);
});
