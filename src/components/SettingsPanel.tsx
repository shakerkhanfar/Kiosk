import type React from "react";
import { useState } from "react";
import {
  clearSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
  type VoiceSettings,
} from "@/voice-agent/settings";

const FIELDS: { key: keyof VoiceSettings; label: string }[] = [
  { key: "apiKey", label: "API key" },
  { key: "agentId", label: "Agent ID" },
  { key: "personaName", label: "Agent name" },
  { key: "vendorName", label: "Restaurant name" },
];

/**
 * Minimal runtime configuration for the voice agent.
 *
 * Changes are saved to localStorage and picked up by the next call, so the demo
 * can be pointed at a different agent without editing `.env` and rebuilding.
 */
const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(loadSettings);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const update = (key: keyof VoiceSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSavedAt(null);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSavedAt(Date.now());
  };

  const handleReset = () => {
    clearSettings();
    setSettings(defaultSettings);
    setSavedAt(null);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-[95] rounded-full bg-black/80 px-4 py-2 font-baloo2 text-[13px] text-white"
      >
        Settings
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-[95] w-[320px] rounded-2xl bg-white p-5 font-baloo2 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-[15px]">Voice agent</h2>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[13px] text-gray-500"
        >
          Close
        </button>
      </div>

      {FIELDS.map(({ key, label }) => (
        <label key={key} className="mb-3 block text-[12px] text-gray-600">
          {label}
          <input
            type={key === "apiKey" ? "password" : "text"}
            value={settings[key]}
            onChange={(event) => update(key, event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-[13px] text-black"
          />
        </label>
      ))}

      <label className="mb-4 block text-[12px] text-gray-600">
        Region
        <select
          value={settings.region}
          onChange={(event) => update("region", event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-[13px] text-black"
        >
          <option value="eu">eu</option>
          <option value="uae">uae</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-limeGreen2 px-4 py-1.5 font-semibold text-[13px] text-black"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full bg-gray-200 px-4 py-1.5 text-[13px] text-black"
        >
          Reset
        </button>
        {savedAt !== null && (
          <span className="text-[12px] text-gray-500">
            Saved — applies to the next call
          </span>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
