const MANUAL_BACKEND_URL_KEY = 'nava_manual_backend_url';
const DEFAULT_CONTEXT_KEY = 'default';

export interface ManualConnectionSettings {
  backendUrl: string;
}

export interface ResolvedConnectionSettings {
  apiBase: string;
  source: 'manual' | 'env' | 'default';
  hasManualOverride: boolean;
}

export interface StoredConnectionContext {
  context_key: string;
  upstream_base_url: string;
  has_upstream_token: boolean;
  token_preview: string | null;
  updated_at: string | null;
  source: string;
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function sanitizeUrl(value: string) {
  return String(value || '').trim().replace(/\/+$/, '');
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(text || 'Gagal membaca respons server.');
  }
}

export function isManualConnectionSettingsEnabled() {
  return import.meta.env.VITE_ENABLE_MANUAL_CONNECTION_SETTINGS !== 'false';
}

// Temporary manual override until the gold-store app injects connection info automatically.
export function loadManualConnectionSettings(): ManualConnectionSettings {
  const storage = getStorage();
  if (!storage) return { backendUrl: '' };

  return {
    backendUrl: sanitizeUrl(storage.getItem(MANUAL_BACKEND_URL_KEY) || ''),
  };
}

export function saveManualConnectionSettings(settings: Partial<ManualConnectionSettings>) {
  const storage = getStorage();
  if (!storage) return;

  const backendUrl = sanitizeUrl(settings.backendUrl || '');
  if (backendUrl) storage.setItem(MANUAL_BACKEND_URL_KEY, backendUrl);
  else storage.removeItem(MANUAL_BACKEND_URL_KEY);
}

export function resetManualConnectionSettings() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(MANUAL_BACKEND_URL_KEY);
}

export function resolveConnectionSettings(): ResolvedConnectionSettings {
  const manual = loadManualConnectionSettings();
  const envApiUrl = sanitizeUrl(import.meta.env.VITE_API_URL || '');
  const defaultApiUrl = 'http://localhost:3000';

  return {
    apiBase: manual.backendUrl || envApiUrl || defaultApiUrl,
    source: manual.backendUrl ? 'manual' : envApiUrl ? 'env' : 'default',
    hasManualOverride: Boolean(manual.backendUrl),
  };
}

export function maskToken(token: string) {
  if (!token) return 'Belum diisi';
  if (token.length <= 10) return token;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export async function fetchStoredConnectionContext(apiBase?: string) {
  const base = sanitizeUrl(apiBase || resolveConnectionSettings().apiBase);
  const response = await fetch(`${base}/connection/context?context_key=${encodeURIComponent(DEFAULT_CONTEXT_KEY)}`, {
    credentials: 'include',
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || 'Gagal mengambil pengaturan koneksi.');
  }
  return payload;
}

export async function saveStoredConnectionContext({
  apiBase,
  upstreamBaseUrl,
  upstreamToken,
}: {
  apiBase?: string;
  upstreamBaseUrl: string;
  upstreamToken: string;
}) {
  const base = sanitizeUrl(apiBase || resolveConnectionSettings().apiBase);
  const response = await fetch(`${base}/connection/context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      context_key: DEFAULT_CONTEXT_KEY,
      upstream_base_url: sanitizeUrl(upstreamBaseUrl),
      upstream_token: String(upstreamToken || '').trim(),
    }),
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || 'Gagal menyimpan pengaturan koneksi.');
  }
  return payload;
}

export async function resetStoredConnectionContext(apiBase?: string) {
  const base = sanitizeUrl(apiBase || resolveConnectionSettings().apiBase);
  const response = await fetch(`${base}/connection/context?context_key=${encodeURIComponent(DEFAULT_CONTEXT_KEY)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || 'Gagal mereset pengaturan koneksi.');
  }
  return payload;
}
