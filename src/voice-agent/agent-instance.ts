import { HamsaVoiceAgent } from "@hamsa-ai/voice-agents-sdk";
import { loadSettings } from "./settings";

/**
 * Owns the single live HamsaVoiceAgent.
 *
 * Kept in its own module — free of any store or tool imports — so the order
 * store can end a call without pulling the tool layer back in through a cycle.
 * The instance is rebuilt whenever the API key or region changes in settings,
 * since both are fixed at construction time.
 */
let instance: HamsaVoiceAgent | null = null;
let instanceKey = "";

/** The agent for the current settings, constructing it on first use. */
export const getAgent = (): HamsaVoiceAgent => {
  const { apiKey, region } = loadSettings();
  const key = `${apiKey}|${region}`;

  if (!instance || key !== instanceKey) {
    instance = new HamsaVoiceAgent(apiKey, { region });
    instanceKey = key;

    // Attached here, once per instance: startAgent runs again on every "New
    // Order", and re-registering per call would stack duplicate handlers.
    instance.on("transcriptionReceived", (text: string) => {
      console.log("User speech transcription received", text);
    });
    instance.on("answerReceived", (text: string) => {
      console.log("Agent answer received", text);
    });
    instance.on("callStarted", () => console.log("Call started"));
    instance.on("callEnded", () => console.log("Call ended"));
    instance.on("error", (error: unknown) => {
      console.error("Voice agent error:", error);
    });
  }

  return instance;
};

/** Ends the current call, if one is running. Safe to call at any time. */
export const endAgent = (): void => {
  try {
    instance?.end();
  } catch (error) {
    console.error("Failed to end agent:", error);
  }
};
