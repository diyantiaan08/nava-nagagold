import { appendDebugLog } from "./chat_utils.js";
import { getConnectionContext, normalizeContextKey } from "./connection_context_store.js";

export function extractContextKey(reqOrContext = {}) {
  const query = reqOrContext.query || {};
  const headers = reqOrContext.headers || {};
  return normalizeContextKey(query.context_key || headers["x-context-key"] || "default");
}

export async function resolveRequestConnection(reqOrContext = {}) {
  const query = reqOrContext.query || {};
  const headers = reqOrContext.headers || {};
  const contextKey = extractContextKey(reqOrContext);
  const stored = await getConnectionContext(contextKey);

  const requestToken = query.token || headers["x-auth-token"] || "";
  const requestBaseUrl = query.base_url || headers["x-upstream-base-url"] || "";
  const baseUrl = String(requestBaseUrl || stored?.upstream_base_url || process.env.TKM_BASE_URL || "").trim().replace(/\/+$/, "");
  const token = String(requestToken || stored?.upstream_token || process.env.TKM_TOKEN || "").trim();

  const resolved = {
    contextKey,
    baseUrl,
    token,
    sources: {
      baseUrl: requestBaseUrl ? "request" : stored?.upstream_base_url ? "database" : "env",
      token: requestToken ? "request" : stored?.upstream_token ? "database" : "env",
    },
    storedContext: stored
      ? {
          context_key: stored.context_key,
          upstream_base_url: stored.upstream_base_url || "",
          has_upstream_token: Boolean(stored.upstream_token),
          updated_at: stored.updated_at || null,
        }
      : null,
  };

  appendDebugLog(
    `request_connection:${JSON.stringify({
      contextKey: resolved.contextKey,
      baseUrlSource: resolved.sources.baseUrl,
      tokenSource: resolved.sources.token,
      hasBaseUrl: Boolean(resolved.baseUrl),
      hasToken: Boolean(resolved.token),
    })}`
  );

  return resolved;
}
