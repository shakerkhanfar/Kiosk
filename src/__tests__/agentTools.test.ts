import { describe, expect, it, beforeEach, vi } from "vitest";

// setup-vitest.ts automocks zustand globally (the __mocks__ dir lives under
// src/, not the project root, so the manual mock is not picked up and every
// export becomes a spy). This suite drives the real store through the tools.
vi.unmock("zustand");

const { agentTools } = await import("@/voice-agent/agent-tools");
const { useKioskStore } = await import("@/store/kioskStore");

/**
 * Reproduces how the SDK invokes a tool over LiveKit RPC:
 *   fn(...Object.values(JSON.parse(payload)), rpcInvocationData)
 */
// biome-ignore lint/suspicious/noExplicitAny: tool results are untyped JSON
const invoke = (name: string, args: Record<string, unknown> = {}): any => {
  const tool = agentTools.find((t) => t.function_name === name);
  if (!tool) throw new Error(`no tool ${name}`);
  const payload = JSON.stringify(args);
  return (tool.fn as (...a: unknown[]) => unknown)(...Object.values(args), {
    payload,
    method: name,
    requestId: "1",
    callerIdentity: "agent",
  });
};

describe("agent tools", () => {
  beforeEach(() => {
    useKioskStore.setState({
      currentOrder: [],
      currentCategory: null,
      isConfirming: false,
      isCompleted: false,
    });
  });

  it("exposes exactly the tools bound to the agent", () => {
    expect(agentTools.map((t) => t.function_name).sort()).toEqual(
      [
        "add_item",
        "clear_cart",
        "confirm_order",
        "escalate_to_human",
        "get_business_info",
        "get_cart_summary",
        "get_modifiers",
        "list_menu",
        "remove_item",
        "reorder_last",
        "update_item",
        "update_quantity",
      ].sort(),
    );
  });

  it("binds arguments by name regardless of the model's key order", () => {
    const result = invoke("add_item", {
      quantity: 3,
      item_name: "Molten Cake",
    });
    expect(result.success).toBe(true);
    expect(result.item_name).toBe("Molten Cake");
    expect(result.quantity).toBe(3);
    expect(useKioskStore.getState().currentOrder[0]).toMatchObject({
      id: "molten_cake",
      quantity: 3,
    });
  });

  it("resolves spoken names in Arabic and coerces string quantities", () => {
    const result = invoke("add_item", {
      item_name: "برغر لحم",
      quantity: "2",
    });
    expect(result.success).toBe(true);
    expect(result.item_name).toBe("Beef Burger");
    expect(useKioskStore.getState().currentOrder[0].quantity).toBe(2);
  });

  it("switches the on-screen category to match what was added", () => {
    invoke("add_item", { item_name: "French Fries" });
    expect(useKioskStore.getState().currentCategory?.id).toBe("appetizers");
  });

  it("rejects items that are not on the menu", () => {
    const result = invoke("add_item", { item_name: "Sushi Platter" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not on the menu");
    expect(useKioskStore.getState().currentOrder).toHaveLength(0);
  });

  it("enforces the per-item quantity cap", () => {
    expect(
      invoke("add_item", { item_name: "Iced Tea", quantity: 9 }).success,
    ).toBe(true);
    const second = invoke("add_item", { item_name: "Iced Tea", quantity: 4 });
    expect(second.success).toBe(false);
    expect(second.error).toContain("Maximum 10");
  });

  it("updates quantity and removes items by spoken name", () => {
    invoke("add_item", { item_name: "Greek Salad", quantity: 1 });
    expect(
      invoke("update_quantity", { item_name: "Greek Salad", quantity: 4 })
        .success,
    ).toBe(true);
    expect(useKioskStore.getState().currentOrder[0].quantity).toBe(4);

    expect(invoke("remove_item", { item_name: "Greek Salad" }).success).toBe(
      true,
    );
    expect(useKioskStore.getState().currentOrder).toHaveLength(0);
  });

  it("lists a category and shows it on screen", () => {
    const result = invoke("list_menu", { category: "Burgers" });
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(6);
    expect(useKioskStore.getState().currentCategory?.id).toBe("burgers");
  });

  it("reports a cart total that matches the screen", () => {
    invoke("add_item", { item_name: "Beef Burger", quantity: 2 });
    const summary = invoke("get_cart_summary");
    const onScreen = useKioskStore.getState().showOrderSummary();
    expect(summary.total_incl_vat).toBeCloseTo(onScreen.total, 2);
  });

  it("shows the review screen before completing the order", () => {
    invoke("add_item", { item_name: "Club Sandwich" });

    const review = invoke("confirm_order");
    expect(review.status).toBe("awaiting_confirmation");
    expect(review.order_number).toBeUndefined();
    expect(useKioskStore.getState().isConfirming).toBe(true);
    expect(useKioskStore.getState().isCompleted).toBe(false);

    const done = invoke("confirm_order");
    expect(done.status).toBe("completed");
    expect(done.order_number).toMatch(/^\d{3}$/);
    expect(done.total_incl_vat).toBeGreaterThan(0);
    expect(useKioskStore.getState().isCompleted).toBe(true);
    expect(useKioskStore.getState().isConfirming).toBe(false);
  });

  it("drops the pending confirmation when the cart changes", () => {
    invoke("add_item", { item_name: "Club Sandwich" });
    invoke("confirm_order");
    expect(useKioskStore.getState().isConfirming).toBe(true);

    invoke("add_item", { item_name: "Coca Cola" });
    expect(useKioskStore.getState().isConfirming).toBe(false);
    expect(useKioskStore.getState().isCompleted).toBe(false);
  });

  it("refuses to confirm an empty cart", () => {
    const result = invoke("confirm_order");
    expect(result.success).toBe(false);
    expect(useKioskStore.getState().isConfirming).toBe(false);
  });

  it("clears the cart without throwing when it is already empty", () => {
    expect(invoke("clear_cart").success).toBe(true);
  });

  it("tells the agent there are no modifiers", () => {
    const result = invoke("get_modifiers", { item_name: "Chicken Burger" });
    expect(result.success).toBe(true);
    expect(result.modifiers).toEqual([]);
  });
});
