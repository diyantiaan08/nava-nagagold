/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ENABLE_MANUAL_CONNECTION_SETTINGS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
