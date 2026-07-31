import { agentTools } from "./agent-tools";
import { endAgent as endCurrentAgent, getAgent } from "./agent-instance";
import { buildSessionParams } from "./session-params";
import { isConfigured, loadSettings } from "./settings";

/**
 * Custom hook to manage the state and functionality of the Hamsa voice agent.
 *
 * @returns {{
 *  startAgent: (language: "ar" | "en") => Promise<void>;
 *  endAgent: () => void;
 * }}
 */
const useVoiceAgent = () => {
  /**
   * Starts the voice agent.
   * Logs an error message if the agent fails to start.
   */
  const startAgent = async (language: "ar" | "en"): Promise<void> => {
    const settings = loadSettings();
    if (!isConfigured(settings)) {
      console.error(
        "Missing Hamsa configuration: set an API key and agent ID in .env or the settings panel.",
      );
      return;
    }

    try {
      // Ask for the microphone before connecting so a denied permission shows
      // up as a clear console error rather than a silent, mute session.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) track.stop();
    } catch (error) {
      console.error("Microphone unavailable:", error);
      return;
    }

    try {
      // `start` is async — awaiting it is what routes connection failures
      // (bad key, unknown agent, no network) into the catch below.
      await getAgent().start({
        agentId: settings.agentId,
        voiceEnablement: true,
        tools: agentTools,
        params: buildSessionParams(language, settings),
      });
      console.log("Agent started successfully");
    } catch (error) {
      console.error("Failed to start agent:", error);
    }
  };

  /**
   * Ends (pauses) the voice agent.
   * Logs an error message if the agent fails to end.
   */
  const endAgent = (): void => {
    endCurrentAgent();
  };

  return { startAgent, endAgent };
};

export default useVoiceAgent;
