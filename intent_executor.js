import { appendDebugLog, extractIncomingHeaders, getAuthFailedMessage, getMissingTokenMessage, maskToken } from "./chat_utils.js";
import { resolveRequestConnection } from "./request_connection.js";

export async function safeCallGlobal(fn, args) {
  try {
    return await fn(args);
  } catch (error) {
    const status = error && error.response && error.response.status;
    appendDebugLog(
      `safeCallGlobal_error:${JSON.stringify({
        fn: fn && fn.name ? fn.name : "anonymous",
        status,
        message: error && error.message,
      })}`
    );
    if (status === 400 || status === 401) {
      throw new Error("AUTH_TERMINATED");
    }
    throw error;
  }
}

function buildFunctionArgs(resolution, req, connection) {
  const incomingHeaders = extractIncomingHeaders(req);
  const args = {
    ...resolution.args,
    token: connection.token,
    baseUrl: connection.baseUrl,
    incomingHeaders,
  };

  if (resolution.type === "report_cash") {
    args.user_login = process.env.USER_LOGIN || "devops.nagatech";
  }

  if (resolution.type === "report_non_cash") {
    args.useSSE = true;
  }

  return args;
}

export async function executeIntent(resolution, req, options = {}) {
  if (!resolution || !resolution.matchedFunction) {
    return {
      status: "no_intent",
      type: null,
      data: null,
      meta: { dateRange: resolution ? resolution.dateRange : {} },
    };
  }

  const connection = await (options.resolveConnection || resolveRequestConnection)(req);
  if (resolution.requiresAuth && !connection.token) {
    return {
      status: "missing_auth",
      type: resolution.type,
      data: null,
      message: getMissingTokenMessage(),
      meta: { dateRange: resolution.dateRange, reason: resolution.reason, connection },
    };
  }

  const args = buildFunctionArgs(resolution, req, connection);
  appendDebugLog(
    `intent_execute:${JSON.stringify({
      type: resolution.type,
      functionName: resolution.matchedFunction.name,
      connection: {
        contextKey: connection.contextKey,
        baseUrl: connection.baseUrl || null,
        tokenSource: connection.sources.token,
        baseUrlSource: connection.sources.baseUrl,
      },
      args: {
        ...args,
        token: maskToken(args.token),
        incomingHeaders: args.incomingHeaders
          ? {
              hasCookie: Boolean(args.incomingHeaders.cookie),
              referer: args.incomingHeaders.referer || null,
              origin: args.incomingHeaders.origin || null,
            }
          : null,
      },
    })}`
  );

  try {
    const data = await (options.safeCall || safeCallGlobal)(resolution.matchedFunction.func, args);
    return {
      status: "success",
      type: resolution.type,
      data,
        meta: {
          dateRange: resolution.dateRange,
          reason: resolution.reason,
          confidence: resolution.confidence,
          responseMode: resolution.responseMode,
          connection,
        },
      };
  } catch (error) {
    if (error && error.message === "AUTH_TERMINATED") {
      return {
        status: "auth_error",
        type: resolution.type,
        data: null,
        message: getAuthFailedMessage(),
        meta: { dateRange: resolution.dateRange, reason: resolution.reason, connection },
      };
    }

    appendDebugLog(
      `intent_execute_error:${JSON.stringify({
        type: resolution.type,
        functionName: resolution.matchedFunction.name,
        message: error && error.message,
      })}`
    );
    return {
      status: "execution_error",
      type: resolution.type,
      data: null,
      error,
      meta: { dateRange: resolution.dateRange, reason: resolution.reason, connection },
    };
  }
}
