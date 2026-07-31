/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_HAMSA_API_KEY: string;
  readonly VITE_HAMSA_AGENT_ID: string;
  readonly VITE_HAMSA_REGION?: "eu" | "uae";
  readonly VITE_KIOSK_PERSONA_NAME?: string;
  readonly VITE_KIOSK_VENDOR_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
