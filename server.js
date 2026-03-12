import dotenv from "dotenv";
import { createApp } from "./app.js";
import { appendDebugLog, maskToken } from "./chat_utils.js";

dotenv.config();

const hasToken = Boolean(process.env.TKM_TOKEN);
console.log(`TKM_TOKEN present: ${hasToken} preview:${hasToken ? `${String(process.env.TKM_TOKEN).slice(0, 4)}...` : "N/A"}`);
appendDebugLog(`server_start:${JSON.stringify({ hasToken, tokenPreview: maskToken(process.env.TKM_TOKEN || "") })}`);

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
