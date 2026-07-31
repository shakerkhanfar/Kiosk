import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Demo from "../../components/Demo";
import Header from "@/components/Header";
import Body from "@/components/Body";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Footer from "@/components/Footer";
import ExitButton from "@/components/ExitButton";
import SettingsPanel from "@/components/SettingsPanel";
import KioskFullscreen from "@/components/KioskFullscreen";
import useVoiceAgent from "@/voice-agent/useVoiceAgent";
import { useKioskStore } from "@/store/kioskStore";

const MainLayout: React.FC = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { startAgent, endAgent } = useVoiceAgent();
  const { selectLanguage, resetOrder, removeCategory } = useKioskStore(
    (state) => ({
      selectLanguage: state.selectLanguage,
      resetOrder: state.resetOrder,
      removeCategory: state.removeCategory,
    }),
  );

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleDemoStart = (language: "ar" | "en") => {
    setIsOpen(true);
    selectLanguage(language);
    startAgent(language);
  };

  /** Ends the call and returns to the landing page with a clean slate. */
  const handleExit = () => {
    endAgent();
    resetOrder();
    removeCategory();
    setIsOpen(false);
  };

  // A running session takes over the whole window — the marketing page is the
  // entry point, not part of the kiosk itself.
  if (isOpen && !isSmallScreen) {
    return <KioskFullscreen onExit={handleExit} />;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#E8F0F9]">
      <BackgroundBeams />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-[60] flex h-full w-[45%] max-w-[650px] flex-col justify-between pb-[47px] pl-[47px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Header />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Body handleDemoStart={handleDemoStart} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Footer />
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1 }}
        className="absolute inset-0"
      >
        <Demo isOpen={false} />
      </motion.div>

      <AnimatePresence>
        {isSmallScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className=" fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-100 "
          >
            <div className="rounded-lg bg-white p-6 text-center font-baloo2">
              <h2 className="mb-4 font-bold text-xl">Screen Size Notice</h2>
              <p>This demo works best on screens 1024px or larger.</p>
              <p>Please use a larger device or resize your browser window.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExitButton />
      <SettingsPanel />
    </div>
  );
};

export default MainLayout;
