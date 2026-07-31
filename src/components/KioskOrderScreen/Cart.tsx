import type React from "react";
import { motion } from "framer-motion";
import { useKioskStore } from "@/store/kioskStore";
import Counter from "./Counter";
import { cn, getItemImage } from "@/lib/utils";
import EmptyCart from "@assets/vectors/empty-cart.svg";
import type { OrderItem } from "@/store/slices/orderSlice";

/**
 * CartItemCard component to render an individual item in the cart.
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Item ID
 * @param {string} props.name - Item name
 * @param {number} props.price - Item price
 * @param {number} props.quantity - Item quantity
 */
const CartItemCard: React.FC<OrderItem> = ({
  id,
  name,
  price,
  quantity,
  calories,
}) => {
  return (
    <motion.div
      className="relative mb-2 flex items-center rounded-[13.27px] bg-white p-2 shadow-default"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      layoutId={`item-${id}`}
    >
      <div
        className={cn(
          "-right-[10px] -top-[6px] absolute flex min-h-[26.54px] min-w-[26.54px] items-center justify-center rounded-full bg-limeGreen2 px-1",
          quantity === 1 && "hidden",
        )}
      >
        <p className="font-baloo2 font-bold text-[14.74px] text-white">
          {`x${quantity}`}
        </p>
      </div>
      <img
        src={getItemImage(id)}
        alt={name}
        className="mr-2 h-12 w-12 object-contain"
      />
      <div className="flex flex-grow flex-col items-start">
        <div className="">
          <p className="font-baloo2 font-bold text-[14.74px]">{name}</p>
        </div>
        <div className="flex w-full items-start justify-between pr-4">
          <p className={"font-baloo2 font-bold text-[11.06px] text-black/50"}>
            {`${calories} cal`}
          </p>
          <p className="font-baloo2 font-bold text-[14.74px] text-limeGreen2">{`$${price.toFixed(
            2,
          )}`}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Cart: React.FC = () => {
  const currentOrder = useKioskStore((state) => state.currentOrder);
  const showOrderSummary = useKioskStore((state) => state.showOrderSummary);
  const beginConfirmation = useKioskStore((state) => state.beginConfirmation);
  const { total, itemsTotal, deliveryCost } = showOrderSummary();

  /**
   * Handles the "Complete order" button click — sends the order to the
   * confirmation screen rather than finalising it directly.
   */
  const handleCompleteOrderClick = () => {
    beginConfirmation();
  };

  return (
    <motion.div
      className="flex h-full flex-col rounded-lg bg-lightGray pt-[55px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex items-center justify-between px-6">
        <h2 className="font-baloo2 font-bold text-[14.74px]">Your Cart</h2>
        <Counter itemCount={currentOrder.length} />
      </div>

      {currentOrder.length > 0 ? (
        <>
          <motion.div
            className="scrollbar-none z-[50] max-h-[270px] flex-grow space-y-3 overflow-auto px-5 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.6,
              delayChildren: 0.2,
              staggerChildren: 0.1,
            }}
          >
            {currentOrder.map((item) => (
              <CartItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                calories={item.calories}
              />
            ))}
          </motion.div>
          <div className="mt-auto px-6 pb-6">
            <motion.p
              className="font-baloo2 font-bold text-[24.33px] text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {`$${itemsTotal.toFixed(2)}`}
            </motion.p>
            <motion.p
              className="font-baloo2 font-bold text-[8.11px] text-black/50 leading-[15px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Delivery fees
              <br />
              <span className="text-[15px]">{`$${deliveryCost.toFixed(2)}`}</span>
            </motion.p>
            <motion.p
              className="font-baloo2 font-bold text-[31.7px] text-limeGreen2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {`$${total.toFixed(2)}`}
            </motion.p>

            <motion.button
              className="relative z-[40] rounded-[58.98px] bg-limeGreen2 px-6 py-2 font-baloo2 font-semibold text-black"
              type="button"
              onClick={handleCompleteOrderClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Complete order
            </motion.button>
          </div>
        </>
      ) : (
        <motion.div
          className="m-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={EmptyCart}
            alt="Empty Cart"
            className="h-[175px] w-[175px]"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Cart;
