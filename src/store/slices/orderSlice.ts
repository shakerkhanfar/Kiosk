import { getMenuItemObject } from "@/lib/utils";
import type { StateCreator } from "zustand";
import type { Item } from "../types";
const isTestEnv = process.env.NODE_ENV === "test";

/**
 * Represents an item in the order.
 */
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  calories: number;
}

export interface OrderSummary {
  items: OrderItem[];
  itemsTotal: number;
  deliveryCost: number;
  total: number;
}

/**
 * Interface representing the slice of state related to order management.
 */
export interface OrderSlice {
  currentOrder: OrderItem[];
  isCompleted: boolean;
  /** True while the order is on the review screen, awaiting confirmation. */
  isConfirming: boolean;
  cloneItem: Item | null;

  /**
   * Puts the order on the confirmation screen for review.
   *
   * @returns A summary of the order awaiting confirmation.
   */
  beginConfirmation: () => OrderSummary;

  /**
   * Leaves the confirmation screen and returns to ordering.
   */
  cancelConfirmation: () => void;

  /**
   * Adds an item to the current order.
   *
   * @param itemId - The ID of the item to add.
   * @param quantity - The quantity of the item to add.
   */
  addItemToOrder: (itemId: string, quantity: number) => void;

  /**
   * Sets the clone item for animations or UI purposes.
   *
   * @param item - The item to clone or null to clear the clone.
   */
  setCloneItem: (item: Item | null) => void;

  /**
   * Edits the quantity of an existing item in the order.
   *
   * @param itemId - The ID of the item to edit.
   * @param quantity - The new quantity to set.
   */
  editItemInOrder: (itemId: string, quantity: number) => void;

  /**
   * Removes an item from the current order by its ID.
   *
   * @param itemId - The ID of the item to remove.
   */
  removeItemFromOrder: (itemId: string) => void;

  /**
   * Generates a summary of the current order, including the total price.
   *
   * @returns An object containing the items in the current order and the total price and delivery cost.
   */
  showOrderSummary: () => OrderSummary;

  /**
   * Completes the current order, sets the isCompleted flag, and resets the order state.
   *
   * @returns An object containing the items in the completed order and the total price and delivery cost.
   */
  completeOrder: () => OrderSummary;

  /**
   * Cancels the current order and resets the order state.
   */
  cancelOrder: () => void;

  /**
   * Resets the order and sets isCompleted to false.
   */
  resetOrder: () => void;
}

/**
 * Creates a Zustand slice for managing the current order.
 *
 * @param set - Zustand's set function to update the state.
 * @param get - Zustand's get function to retrieve the current state.
 * @returns The OrderSlice containing the state and actions for order management.
 */
export const createOrderSlice: StateCreator<OrderSlice> = (set, get) => ({
  currentOrder: [],
  isCompleted: false,
  isConfirming: false,
  cloneItem: null,

  /**
   * Puts the order on the confirmation screen for review.
   *
   * @returns A summary of the order awaiting confirmation.
   */
  beginConfirmation: () => {
    if (get().currentOrder.length === 0) {
      throw new Error("Error: Cannot confirm an empty order.");
    }
    set({ isConfirming: true });
    console.log("Order is awaiting confirmation.");
    return get().showOrderSummary();
  },

  /**
   * Leaves the confirmation screen and returns to ordering.
   */
  cancelConfirmation: () => {
    set({ isConfirming: false });
    console.log("Order confirmation was dismissed.");
  },

  /**
   * Adds an item to the current order. If the item already exists in the order, it updates the quantity.
   *
   * @param itemId - The ID of the item to add.
   * @param quantity - The quantity to add.
   */
  addItemToOrder: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      throw new Error("Error: Quantity must be greater than 0.");
    }
    const item = getMenuItemObject(itemId);
    if (!item) {
      throw new Error(`Error: Item with id ${itemId} not found.`);
    }

    const existingItem = get().currentOrder.find(
      (orderItem) => orderItem.id === itemId,
    );

    const setCurrentOrder = () => {
      set((state) => {
        const existingItemIndex = state.currentOrder.findIndex(
          (orderItem) => orderItem.id === itemId,
        );

        if (existingItemIndex !== -1) {
          // Update quantity if item already exists
          const updatedOrder = [...state.currentOrder];
          updatedOrder[existingItemIndex].quantity += quantity;

          return { currentOrder: updatedOrder };
        }

        // Add new item if it doesn't exist in the order
        const newOrderItem: OrderItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity,
          calories: item.calories,
        };
        return { currentOrder: [newOrderItem, ...state.currentOrder] };
      });
    };

    if (isTestEnv) {
      setCurrentOrder();
      return;
    }

    if (!existingItem) {
      set({ cloneItem: item });
    }

    setTimeout(() => {
      setCurrentOrder();
      if (!existingItem && get().cloneItem !== null) {
        set({ cloneItem: null });
      }
    }, 100);

    console.log(`Added to order: ${quantity}x ${item.name}`);
  },

  /**
   * Sets the clone item for animations or UI purposes.
   *
   * @param item - The item to clone or null to clear the clone.
   */
  setCloneItem: (item: Item | null) => {
    set({ cloneItem: item });
  },

  /**
   * Edits the quantity of an existing item in the order.
   *
   * @param itemId - The ID of the item to edit.
   * @param quantity - The new quantity to set.
   */
  editItemInOrder: (itemId: string, quantity: number) => {
    const item = getMenuItemObject(itemId);
    if (!item) {
      throw new Error(`Error: Item with id ${itemId} not found.`);
    }

    const existingOrderItem = get().currentOrder.find(
      (orderItem) => orderItem.id === itemId,
    );

    if (!existingOrderItem) {
      throw new Error(`Error: Item with id ${itemId} not found in order.`);
    }

    if (quantity <= 0) {
      throw new Error("Error: Quantity must be greater than 0.");
    }

    set((state) => ({
      currentOrder: state.currentOrder.map((orderItem) =>
        orderItem.id === itemId ? { ...orderItem, quantity } : orderItem,
      ),
    }));
    console.log(`Edited item in order: ${itemId} to quantity ${quantity}`);
  },

  /**
   * Removes an item from the current order by its ID.
   *
   * @param itemId - The ID of the item to remove.
   */
  removeItemFromOrder: (itemId: string) => {
    const existingOrderItem = get().currentOrder.find(
      (orderItem) => orderItem.id === itemId,
    );

    if (!existingOrderItem) {
      throw new Error(`Error: Item with id ${itemId} not found in order.`);
    }

    set((state) => ({
      currentOrder: state.currentOrder.filter((item) => item.id !== itemId),
    }));
    console.log(`Removed item from order: ${itemId}`);
  },

  /**
   * Generates a summary of the current order, including the total price.
   *
   * @returns An object containing the items in the current order and the total price and delivery cost.
   */
  showOrderSummary: () => {
    const currentOrder = get().currentOrder;
    const itemsTotal = currentOrder.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const deliveryCost = 0.5; // Fixed delivery cost, adjust as needed
    const total = itemsTotal + deliveryCost;

    return {
      items: currentOrder,
      itemsTotal,
      deliveryCost,
      total,
    };
  },

  /**
   * Completes the current order, sets the isCompleted flag, and resets the order state.
   *
   * @returns An object containing the items in the completed order and the total price.
   */
  completeOrder: () => {
    const currentOrder = get().currentOrder;
    if (currentOrder.length === 0) {
      throw new Error("Error: Cannot complete an empty order.");
    }

    // Ending the call is the caller's job (the confirm_order tool delays it so
    // the agent can finish announcing the order number and total).
    const orderSummary = get().showOrderSummary();
    set({ isCompleted: true, isConfirming: false, currentOrder: [] });
    console.log("Order completed successfully.");
    return orderSummary;
  },

  /**
   * Cancels the current order and resets the order state.
   */
  cancelOrder: () => {
    const currentOrder = get().currentOrder;
    if (currentOrder.length === 0) {
      throw new Error("Error: No order to cancel.");
    }

    set({ currentOrder: [], isCompleted: false, isConfirming: false });
    console.log("Order was cancelled.");
  },

  /**
   * Resets the order and sets isCompleted to false.
   */
  resetOrder: () => {
    set({ currentOrder: [], isCompleted: false, isConfirming: false });
    console.log("Order has been reset.");
  },
});
