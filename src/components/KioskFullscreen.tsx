import type React from "react";
import { useEffect, useState } from "react";
import KioskOrderScreen from "./KioskOrderScreen/KioskOrderScreen";

/**
 * The surface the kiosk screens were designed against (the iPad mock's inner
 * size). Everything inside is laid out in these units and scaled as a whole,
 * so proportions and type sizes stay exactly as designed at any window size.
 */
const BASE_WIDTH = 971.68;
const BASE_HEIGHT = 650.98;

interface KioskFullscreenProps {
  /** Ends the session and returns to the landing page. */
  onExit: () => void;
}

/**
 * Full-window kiosk view, shown for the duration of a voice session.
 *
 * Scales the designed surface to fit the window rather than reflowing it —
 * reflowing would leave the fixed type sizes tiny on a large monitor.
 */
const KioskFullscreen: React.FC<KioskFullscreenProps> = ({ onExit }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      setScale(
        Math.min(
          window.innerWidth / BASE_WIDTH,
          window.innerHeight / BASE_HEIGHT,
        ),
      );
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#E8F0F9]">
      <div
        className="overflow-hidden rounded-[28px] bg-white shadow-2xl"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <KioskOrderScreen />
      </div>

      <button
        type="button"
        onClick={onExit}
        className="absolute top-5 right-5 z-[90] rounded-full bg-black/80 px-5 py-2 font-baloo2 text-[13px] text-white"
      >
        End session
      </button>
    </div>
  );
};

export default KioskFullscreen;
