import axios from "axios";
import { appendDebugLog, endSse, writeSseData, writeSseEvent } from "./chat_utils.js";

export const DEFAULT_SYSTEM_PROMPT =
  "Kamu adalah asisten virtual untuk membantu user membaca dan menanyakan data pada program toko emas milik user. Kamu bukan pemilik toko, bukan pemilik sistem, dan tidak boleh berbicara seolah-olah toko atau program itu milikmu. Selalu gunakan sudut pandang yang benar seperti \"toko Anda\", \"program Anda\", atau \"data Anda\", bukan \"toko saya\" atau \"program saya\". Jika user hanya menyapa, berterima kasih, atau mengakhiri percakapan, balas dengan singkat, hangat, dan natural tanpa terus-menerus menawarkan bantuan yang berulang. Jawab langsung dalam bahasa Indonesia dengan kalimat yang ramah dan jelas. Jangan tampilkan proses berpikir (no chain-of-thought), jangan tanya balik, dan jangan output JSON atau tabel. Format angka sesuai lokal Indonesia (ribuan pakai titik, desimal pakai koma, rupiah pakai format rupiah). Jika pertanyaan membutuhkan data, gunakan data yang diberikan oleh backend dan masukkan ke jawaban. Jika tidak tahu jawab dengan jujur.";

export async function streamModelResponse(res, userPrompt, options = {}) {
  const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:3b";
  const payload = {
    model: ollamaModel,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  appendDebugLog(
    `ollama_request:${JSON.stringify({
      host: ollamaHost,
      model: ollamaModel,
      promptPreview: String(userPrompt).slice(0, 160),
    })}`
  );

  try {
    const response = await axios.post(`${ollamaHost}/api/chat`, payload, {
      responseType: "stream",
    });

    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const text = parsed && parsed.message ? parsed.message.content || "" : "";
          if (text) writeSseData(res, text);
          if (parsed && parsed.done) {
            endSse(res);
          }
        } catch (error) {
          // ignore partial JSON line
        }
      }
    });

    response.data.on("end", () => {
      if (!res.writableEnded) endSse(res);
    });

    response.data.on("error", (error) => {
      if (!res.writableEnded) {
        writeSseEvent(res, "error", JSON.stringify({ error: error.message }));
        res.end();
      }
    });
  } catch (error) {
    writeSseEvent(res, "error", JSON.stringify({ error: error.message }));
    res.end();
  }
}
