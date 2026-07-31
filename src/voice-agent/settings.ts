/**
 * Runtime configuration for the voice agent.
 *
 * Values come from `.env` at build time and can be overridden at runtime from
 * the in-app settings panel (persisted in localStorage), so the demo can be
 * pointed at a different agent without a rebuild.
 */
export interface VoiceSettings {
  /** Hamsa API key (project key from the dashboard). */
  apiKey: string;
  /** Voice agent ID the kiosk connects to. */
  agentId: string;
  /** Deployment region of the Hamsa project. */
  region: "eu" | "uae";
  /** Name the agent introduces itself with — fills {{persona_name}}. */
  personaName: string;
  /** Brand the agent is taking orders for — fills {{vendor_name}}. */
  vendorName: string;
}

const STORAGE_KEY = "kiosk-demo.voice-settings";

export const defaultSettings: VoiceSettings = {
  apiKey: import.meta.env.VITE_HAMSA_API_KEY || "",
  agentId: import.meta.env.VITE_HAMSA_AGENT_ID || "",
  region: (import.meta.env.VITE_HAMSA_REGION || "eu") as "eu" | "uae",
  personaName: import.meta.env.VITE_KIOSK_PERSONA_NAME || "Delicious Assistant",
  vendorName: import.meta.env.VITE_KIOSK_VENDOR_NAME || "Delicious",
};

/** Current settings: stored overrides merged over the build-time defaults. */
export const loadSettings = (): VoiceSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
};

/** Persists overrides. Only the fields that differ from defaults are kept. */
export const saveSettings = (settings: VoiceSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to persist voice settings:", error);
  }
};

/** Drops stored overrides and falls back to the values from `.env`. */
export const clearSettings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear voice settings:", error);
  }
};

/** Whether a session can be started at all. */
export const isConfigured = (settings: VoiceSettings): boolean =>
  Boolean(settings.apiKey && settings.agentId);
