import type React from "react";
import { motion } from "framer-motion";
import { useKioskStore } from "@/store/kioskStore";
import { getItemImage } from "@/lib/utils";
import DeliciousLogo from "../DeliciousLogo";

/**
 * Review screen shown between ordering and completion.
 *
 * Reached from the voice agent's first `confirm_order` call or the cart's
 * "Complete order" button. The order is only finalised once it is confirmed
 * here — by tapping, or by the agent calling `confirm_order` again after the
 * customer says yes.
 */
const OrderConfirmationScreen: React.FC = () => {
  const { currentOrder, showOrderSummary, completeOrder, cancelConfirmation } =
    useKioskStore((state) => ({
      currentOrder: state.currentOrder,
      showOrderSummary: state.showOrderSummary,
      completeOrder: state.completeOrder,
      cancelConfirmation: state.cancelConfirmation,
    }));
  const { itemsTotal, deliveryCost, total } = showOrderSummary();

  return (
    <motion.div
      className="flex h-full w-full flex-col bg-white p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <DeliciousLogo className="w-[147.66px]" />
        <button
          type="button"
          onClick={cancelConfirmation}
          className="rounded-full border border-black px-4 py-2 font-baloo2 font-bold text-[13px] text-black"
        >
          Add more items
        </button>
      </div>

      <h2 className="mb-1 font-baloo2 font-bold text-[28px]">
        Please confirm your order
      </h2>
      <p className="mb-4 font-baloo2 text-[14px] text-black/50">
        Check everything is correct, then confirm.
      </p>

      <div className="scrollbar-none flex-grow space-y-2 overflow-auto pr-2">
        {currentOrder.map((item) => (
          <motion.div
            key={item.id}
            className="flex items-center rounded-[13.27px] bg-lightGray p-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-limeGreen2">
              <p className="font-baloo2 font-bold text-[13px] text-white">
                {`x${item.quantity}`}
              </p>
            </div>
            <img
              src={getItemImage(item.id)}
              alt={item.name}
              className="mr-3 h-11 w-11 object-contain"
            />
            <div className="flex flex-grow items-center justify-between pr-2">
              <div>
                <p className="font-baloo2 font-bold text-[15px]">{item.name}</p>
                <p className="font-baloo2 font-bold text-[11px] text-black/50">
                  {`${item.calories} cal`}
                </p>
              </div>
              <p className="font-baloo2 font-bold text-[15px] text-limeGreen2">
                {`$${(item.price * item.quantity).toFixed(2)}`}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 border-black/10 border-t pt-3">
        <div className="flex items-center justify-between font-baloo2 text-[14px] text-black/60">
          <span>Items</span>
          <span>{`$${itemsTotal.toFixed(2)}`}</span>
        </div>
        <div className="flex items-center justify-between font-baloo2 text-[14px] text-black/60">
          <span>Delivery fees</span>
          <span>{`$${deliveryCost.toFixed(2)}`}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-baloo2 font-bold text-[20px]">Total</span>
          <span className="font-baloo2 font-bold text-[31.7px] text-limeGreen2">
            {`$${total.toFixed(2)}`}
          </span>
        </div>

        <motion.button
          type="button"
          onClick={() => completeOrder()}
          className="mt-3 w-full rounded-[58.98px] bg-limeGreen2 py-3 font-baloo2 font-semibold text-black"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Confirm order
        </motion.button>
      </div>
    </motion.div>
  );
};

export default OrderConfirmationScreen;
