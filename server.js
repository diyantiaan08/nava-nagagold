import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import https from "https";
import fs from "fs";
dotenv.config();
import { parseDatePhrase } from "./parseNaturalDate.js";
import { functionDeclarations } from "./func_declaration.js";
import { GoogleGenAI, Type } from "@google/genai";
import {
  getSalesDetails,
  getSalesMarketplace,
  getTotalBarang,
  getTotalCash,
  getTotalNonCash,
  getPembelian,
  getService,
  getStockHutang,
  getPesananOpen,
  getPesananDone,
  getPesananFinish,
  getDataOpname,
  getManagerialAnalysis,
  getFullSummary,
  getMarginPenjualan,
  getSalesAnnual,
  getPembelianAnnual,
  getManagerialAnalysisAnnual,
} from "./function_get.js";

// Inisialisasi Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Ganti API Key kamu



// Fungsi pemrosesan pertanyaan
async function processQuestion(userQuery, res) {
  const dateRange = parseDatePhrase(userQuery); // detect natural date range
  res.write(
        `event: thinking\ndata: <think>\n\n`
      );
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // e.g. 2025-05-26

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `Hari ini adalah ${todayStr}. ${userQuery}` }],
      },
    ],
    config: {
      tools: [{ functionDeclarations }],
    },
  });

  if (response.functionCalls && response.functionCalls.length > 0) {
    for (const functionCall of response.functionCalls) {
      const name = functionCall.name;
      let args = functionCall.args;

      // 🧠 Jika args tidak ada tanggal, tambahkan dari parser
      if (dateRange) {
        if (!args.tgl_awal && !args.tgl_system) {
          args.tgl_awal = dateRange.tgl_awal;
          args.tgl_akhir = dateRange.tgl_akhir;
        }

        // fallback ke tgl_system jika function hanya mendukung tgl_system
        if (!args.tgl_system) {
          args.tgl_system = dateRange.tgl_awal;
        }
      }

      // 🧠 Jika fungsi mendukung rentang waktu
      // if (dateRange && name === "get_sales_details") {
      //   args.tgl_awal = dateRange.tgl_awal;
      //   args.tgl_akhir = dateRange.tgl_akhir;
      // }

      const functionMap = {
        get_sales_details: getSalesDetails,
        get_sales_marketplace: getSalesMarketplace,
        get_total_item: getTotalBarang,
        get_total_cash: getTotalCash,
        get_total_noncash: getTotalNonCash,
        get_pembelian: getPembelian,
        get_pembelian_annual: getPembelianAnnual,
        get_service: getService,
        get_stock_hutang: getStockHutang,
        get_pesanan_open: getPesananOpen,
        get_pesanan_done: getPesananDone,
        get_pesanan_finish: getPesananFinish,
        get_data_opname: getDataOpname,
        get_managerial_analysis: getManagerialAnalysis,
        get_managerial_analysis_annual: getManagerialAnalysisAnnual,
        get_full_summary: getFullSummary,
        get_margin_penjualan: getMarginPenjualan,
        get_sales_annual: getSalesAnnual
      };

      const func = functionMap[name];
      if (!func) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: `Fungsi ${name} belum diimplementasikan`,
          })}\n\n`
        );
        res.end();
        return;
      }

      // --- Streaming 'thinking process' (tool call) ---
      res.write(
        `event: thinking\ndata: Memikirkan untuk menggunakan alat '${name}' dengan argumen: ${JSON.stringify(args)}\n\n`
      );
      const result = await func(args);
      // --- Streaming hasil dari tool call ---
      res.write(
        `event: thinking\ndata: Hasil dari alat '${name}': ${result ? JSON.stringify(result) : "Tidak ada hasil"}}\n\n`
      );
        res.write(
        `event: thinking\ndata: </think>\n\n`
      );
      const streamingResult = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: `Sampaikan informasi dari hasil data berikut dalam satu atau dua kalimat yang mudah dipahami. Jangan berikan opsi, daftar pilihan, atau penjelasan tambahan mengenai cara penyampaiannya. Langsung berikan kalimat ringkasan datanya saja:
        ${JSON.stringify(result)}
        perhatikan penyampaian nominal uang, misalkan 43781795006 menjadi 43.781.795.006 atau 43.781 Miliar Rupiah. Jika ada angka yang terlalu besar, gunakan satuan yang sesuai seperti juta, miliar, triliun, dst.
        `,
      });


      for await (const item of streamingResult) {
      res.write(
        `event: message\ndata: ${item['candidates'].map((c) => c['content'].parts.map((p) => p.text).join('')).join('')}\n\n`
      );
      }

      // End the stream after all processing is done for this request
      res.end();
    }
  } else {
    res.write(
      `data: ${JSON.stringify({ type: "text", data: response.text })}\n\n`
    );
    res.end();
  }
}

// Endpoint REST
app.post("/ask", async (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // For Nginx

  try {
    const { question } = req.body;
    if (!question) {
      res.write(
        `data: ${JSON.stringify({
          error: "Pertanyaan tidak boleh kosong.",
        })}\n\n`
      );
      return res.end();
    }

    await processQuestion(question, res); // Pass 'res' to the processing function
  } catch (err) {
    console.error(err);
    res.write(
      `data: ${JSON.stringify({
        error: "Terjadi kesalahan saat memproses pertanyaan.",
      })}\n\n`
    );
    res.end();
  }
});

app.get("/stream/ask", async (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // For Nginx

  try {
    const { question } = req.query;
    if (!question) {
      res.write(
        `data: ${JSON.stringify({
          error: "Pertanyaan tidak boleh kosong.",
        })}\n\n`
      );
      return res.end();
    }

    await processQuestion(question, res); // Pass 'res' to the processing function
  } catch (err) {
    console.error(err);
    res.write(
      `data: ${JSON.stringify({
        error: "Terjadi kesalahan saat memproses pertanyaan.",
      })}\n\n`
    );
    res.end();
  }
});

// Mulai server
const PORT = process.env.PORT || 3000;
const IS_HTTPS = process.env.IS_HTTPS === "true";

if (IS_HTTPS) {
  const key = fs.readFileSync("/home/nodeapp/cert/private.key");
  const cert = fs.readFileSync("/home/nodeapp/cert/fullchain.pem");
  const ca = fs.readFileSync("/home/nodeapp/cert/ca_bundle.crt");
  const credentials = { key, cert, ca };
  https.createServer(credentials, app).listen(PORT, () => {
    console.log(`✅ HTTPS Server berjalan di https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`✅ HTTP Server berjalan di http://localhost:${PORT}`);
  });
}
