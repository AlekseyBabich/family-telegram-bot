/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOTIFY_API_KEY?: string;
  readonly VITE_NOTIFY_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
