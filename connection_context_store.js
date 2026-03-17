import { getMongoDb } from "./mongo_client.js";
import { maskToken } from "./chat_utils.js";

const COLLECTION_NAME = "connection_contexts";

export function normalizeContextKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "default";
}

export async function getConnectionContext(contextKey = "default") {
  const db = await getMongoDb();
  if (!db) return null;

  return db.collection(COLLECTION_NAME).findOne({ context_key: normalizeContextKey(contextKey) });
}

export async function upsertConnectionContext({ contextKey = "default", upstreamBaseUrl = "", upstreamToken = "" } = {}) {
  const db = await getMongoDb();
  if (!db) {
    throw new Error("MONGO_NOT_CONFIGURED");
  }

  const context_key = normalizeContextKey(contextKey);
  const payload = {
    context_key,
    upstream_base_url: String(upstreamBaseUrl || "").trim().replace(/\/+$/, ""),
    upstream_token: String(upstreamToken || "").trim(),
    updated_at: new Date(),
  };

  await db.collection(COLLECTION_NAME).updateOne(
    { context_key },
    {
      $set: payload,
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  );

  return payload;
}

export async function deleteConnectionContext(contextKey = "default") {
  const db = await getMongoDb();
  if (!db) {
    throw new Error("MONGO_NOT_CONFIGURED");
  }

  await db.collection(COLLECTION_NAME).deleteOne({ context_key: normalizeContextKey(contextKey) });
}

export function serializeConnectionContext(doc) {
  if (!doc) {
    return {
      context_key: "default",
      upstream_base_url: "",
      has_upstream_token: false,
      token_preview: null,
      updated_at: null,
      source: "env",
    };
  }

  return {
    context_key: doc.context_key,
    upstream_base_url: doc.upstream_base_url || "",
    has_upstream_token: Boolean(doc.upstream_token),
    token_preview: maskToken(doc.upstream_token || ""),
    updated_at: doc.updated_at || null,
    source: "database",
  };
}
