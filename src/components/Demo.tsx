import { memo } from "react";
import Kiosk from "@assets/images/kiosk.png";
import KioskOrderScreen from "./KioskOrderScreen/KioskOrderScreen";
import { useKioskStore } from "@/store/kioskStore";
import { AnimatePresence, motion } from "framer-motion";
import Mascot from "./KioskOrderScreen/Mascot";
import FoodImage from "@assets/images/food.png";
import { cn } from "@/lib/utils";
import { BorderBeam } from "./magicui/border-beam";

interface MascotAndFoodProps {
  isCategoryList: boolean;
  isCompleted: boolean;
}

const MascotAndFood: React.FC<MascotAndFoodProps> = memo(
  ({ isCategoryList, isCompleted }) =>
    !isCategoryList && (
      <div className="-bottom-[280px] absolute z-10 flex w-full items-center justify-between">
        <motion.img
          layoutId="food-poster-image"
          src={FoodImage}
          alt="Food"
          className={cn(
            "-left-[200px] relative h-[238.87px] w-[308.94px]",
            isCompleted ? "-left-[210px]" : "-left-[200px]",
          )}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        />
        <motion.div
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          {!isCompleted ? (
            <Mascot className="-right-[400px] relative top-[70px] h-[701.85px] w-[720.28px]" />
          ) : (
            <Mascot
              className="-top-[200px] relative right-[200px] h-[604.54px] w-[620.02px]"
              orderComplete={true}
            />
          )}
        </motion.div>
      </div>
    ),
);

interface DemoProps {
  isOpen: boolean;
}
// Main Demo component
const Demo: React.FC<DemoProps> = ({ isOpen }) => {
  const { currentCategory, isCompleted } = useKioskStore((state) => ({
    currentCategory: state.currentCategory,
    isCompleted: state.isCompleted,
  }));

  const isCategoryList: boolean = !currentCategory;

  return (
    <div
      className={cn(
        "relative flex h-screen w-full items-center justify-center overflow-hidden",
        isOpen && "z-[90]",
      )}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 bg-white bg-opacity-80 backdrop-blur-md"
          />
        )}
      </AnimatePresence>
      <div className="relative z-20 flex w-full items-center justify-center">
        <motion.div
          className={cn("ipad-wrapper max-w-[970px]")}
          animate={{ x: isOpen ? 0 : "68%" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          {!isOpen && (
            <div className="border-beam-container">
              <BorderBeam borderWidth={9} className="rounded-[50px]" />
            </div>
          )}

          {/* iPad Content */}
          <div
            className={cn(
              "flex items-center justify-center rounded-[3rem]",
              !isOpen && "pointer-events-none",
            )}
            id="ipad-content"
          >
            <KioskOrderScreen />
            <motion.div
              className={cn(
                "absolute z-30 flex items-center justify-center",
                !isCategoryList && "hidden",
              )}
              initial={{ opacity: 0 }}
              animate={{ x: isOpen ? "500px" : "-560px", opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <img
                src={Kiosk}
                alt="Kiosk"
                className="relative z-[30] h-[531px] w-[254px]"
              />
            </motion.div>
          </div>

          <MascotAndFood
            isCategoryList={isCategoryList}
            isCompleted={isCompleted}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Demo;
