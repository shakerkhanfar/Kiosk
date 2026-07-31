import type { Tool } from "@hamsa-ai/voice-agents-sdk";
import { useKioskStore } from "@/store/kioskStore";
import { menuData } from "@/store/menuData";
import type { Category, Item } from "@/store/types";
import { endAgent } from "./agent-instance";

/**
 * Client-side implementations of the agent's WEB_TOOLs.
 *
 * The agent owns the tool contract (names, descriptions, parameter schemas)
 * on the Hamsa platform; this file only provides the implementations, which
 * the SDK registers as LiveKit RPC methods at session start. Names must match
 * the platform tools exactly.
 */

const debugEnabled = true;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const debugLog = (message: string, ...args: any[]) => {
  if (debugEnabled) {
    console.log(message, ...args);
  }
};

/**
 * Shape of the LiveKit RPC invocation the SDK appends as the last argument of
 * every tool call. `payload` is the JSON-encoded argument object.
 */
type RpcInvocation = { payload?: string };

/**
 * Reads the tool arguments out of an RPC invocation.
 *
 * The SDK invokes a tool as `fn(...Object.values(JSON.parse(payload)), rpcData)`,
 * so the positional arguments arrive in whatever key order the model produced —
 * NOT the order declared on the platform. Binding by position therefore swaps
 * arguments whenever the model reorders keys. The invocation object is always
 * last, so read the payload from there.
 */
const readArgs = (args: unknown[]): Record<string, unknown> => {
  const invocation = args[args.length - 1] as RpcInvocation | undefined;
  try {
    return JSON.parse(invocation?.payload || "{}") || {};
  } catch (error) {
    debugLog("Failed to parse tool payload:", error);
    return {};
  }
};

/* ── Menu lookup ─────────────────────────────────────────────────────────── */

/** Strips case, Arabic diacritics and punctuation so names compare loosely. */
const normalize = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();

interface MenuHit {
  item: Item;
  category: Category;
}

const allItems = (): MenuHit[] =>
  menuData.categories.flatMap((category) =>
    category.items.map((item) => ({ item, category })),
  );

/**
 * Resolves a spoken item name (English or Arabic) to a menu item.
 *
 * The agent passes names as the customer said them, so matching goes from
 * strict to loose: exact name, then substring either way, then word overlap.
 */
const findItem = (spoken: unknown): MenuHit | null => {
  const query = normalize(spoken);
  if (!query) return null;
  const candidates = allItems();

  const names = (hit: MenuHit) => [
    normalize(hit.item.name),
    normalize(hit.item.nameArabic),
    normalize(hit.item.id),
  ];

  const exact = candidates.find((hit) => names(hit).includes(query));
  if (exact) return exact;

  const partial = candidates.find((hit) =>
    names(hit).some((name) => name.includes(query) || query.includes(name)),
  );
  if (partial) return partial;

  const words = query.split(" ").filter((word) => word.length > 2);
  if (!words.length) return null;
  return (
    candidates.find((hit) =>
      names(hit).some((name) => words.every((word) => name.includes(word))),
    ) || null
  );
};

/** Resolves a spoken category name (English or Arabic) to a category. */
const findCategory = (spoken: unknown): Category | null => {
  const query = normalize(spoken);
  if (!query) return null;
  return (
    menuData.categories.find((category) =>
      [
        normalize(category.name),
        normalize(category.nameArabic),
        normalize(category.id),
      ].some((name) => name === query || name.includes(query)),
    ) || null
  );
};

/* ── Cart helpers ────────────────────────────────────────────────────────── */

/**
 * Menu prices are treated as VAT-inclusive, so the total the agent announces
 * is exactly the total on screen.
 */
const cartSummary = () => {
  const { currentOrder, showOrderSummary } = useKioskStore.getState();
  const summary = showOrderSummary();
  return {
    items: currentOrder.map((line) => ({
      item_name: line.name,
      quantity: line.quantity,
      unit_price: Number(line.price.toFixed(2)),
      line_total: Number((line.price * line.quantity).toFixed(2)),
    })),
    items_total: Number(summary.itemsTotal.toFixed(2)),
    service_fee: Number(summary.deliveryCost.toFixed(2)),
    total_incl_vat: Number(summary.total.toFixed(2)),
    currency: "SAR",
  };
};

/** The upsell gate the preamble expects back from every cart-changing tool. */
const upsellGate = () => ({
  upsell_allowed: useKioskStore.getState().currentOrder.length > 0,
});

const MAX_QTY_PER_ITEM = 10;

/**
 * Changing the cart invalidates whatever is on the review screen, so any
 * pending confirmation is dropped and the customer goes back to ordering.
 */
const leaveConfirmation = (): void => {
  const store = useKioskStore.getState();
  if (store.isConfirming) store.cancelConfirmation();
};

/** Normalizes a spoken quantity to a positive integer, defaulting to 1. */
const toQuantity = (value: unknown): number => {
  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
};

const notOnMenu = (spoken: unknown) => ({
  success: false,
  error: `"${String(spoken ?? "")}" is not on the menu. Offer something from the menu instead.`,
});

/* ── Tools ───────────────────────────────────────────────────────────────── */

/**
 * The agent already carries each tool's description and parameter schema (they
 * are WEB_TOOLs bound to it on the platform), so only `function_name` and `fn`
 * are sent from here. The SDK's `Tool` type also covers client-declared tools,
 * where the description is mandatory — hence the cast.
 */
const tools = [
  {
    function_name: "add_item",
    fn: (...args: unknown[]) => {
      const { item_name, quantity } = readArgs(args);
      debugLog("add_item:", { item_name, quantity });
      leaveConfirmation();
      const hit = findItem(item_name);
      if (!hit) return notOnMenu(item_name);

      const qty = toQuantity(quantity);
      const store = useKioskStore.getState();
      const existing = store.currentOrder.find(
        (line) => line.id === hit.item.id,
      );
      const resulting = (existing?.quantity ?? 0) + qty;
      if (resulting > MAX_QTY_PER_ITEM) {
        return {
          success: false,
          error: `Maximum ${MAX_QTY_PER_ITEM} of any single item. The cart already has ${existing?.quantity ?? 0}.`,
        };
      }

      try {
        // Show the item's category on screen so the customer sees what was added.
        if (store.currentCategory?.id !== hit.category.id) {
          store.selectCategory(hit.category.id);
        }
        store.addItemToOrder(hit.item.id, qty);
        return {
          success: true,
          item_name: hit.item.name,
          quantity: qty,
          unit_price: hit.item.price,
          // The store applies the add on a short animation delay, so report the
          // projected line rather than re-reading the cart here.
          line_quantity: resulting,
          note: "This item has no sizes or options.",
          ...upsellGate(),
        };
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    function_name: "remove_item",
    fn: (...args: unknown[]) => {
      const { item_name } = readArgs(args);
      debugLog("remove_item:", { item_name });
      leaveConfirmation();
      const hit = findItem(item_name);
      if (!hit) return notOnMenu(item_name);
      try {
        useKioskStore.getState().removeItemFromOrder(hit.item.id);
        return { success: true, item_name: hit.item.name, ...upsellGate() };
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    function_name: "update_quantity",
    fn: (...args: unknown[]) => {
      const { item_name, quantity } = readArgs(args);
      debugLog("update_quantity:", { item_name, quantity });
      leaveConfirmation();
      const hit = findItem(item_name);
      if (!hit) return notOnMenu(item_name);

      const qty = toQuantity(quantity);
      if (qty > MAX_QTY_PER_ITEM) {
        return {
          success: false,
          error: `Maximum ${MAX_QTY_PER_ITEM} of any single item.`,
        };
      }
      try {
        useKioskStore.getState().editItemInOrder(hit.item.id, qty);
        return {
          success: true,
          item_name: hit.item.name,
          quantity: qty,
          ...upsellGate(),
        };
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    function_name: "update_item",
    fn: (...args: unknown[]) => {
      const { item_name } = readArgs(args);
      debugLog("update_item:", { item_name });
      // Nothing on this menu is customisable, so there is never anything to
      // change on a line — only its quantity, which is a different tool.
      return {
        success: false,
        error:
          "Items on this menu have no sizes or options, so there is nothing to change. Use update_quantity to change how many, or remove_item to take it off.",
      };
    },
  },
  {
    function_name: "clear_cart",
    fn: () => {
      debugLog("clear_cart");
      const store = useKioskStore.getState();
      store.resetOrder();
      store.removeCategory();
      return { success: true, message: "The cart is now empty." };
    },
  },
  {
    function_name: "list_menu",
    fn: (...args: unknown[]) => {
      const { category } = readArgs(args);
      debugLog("list_menu:", { category });
      const match = findCategory(category);

      if (match) {
        // Switching the screen is half this tool's job — the customer should
        // see the category they asked about.
        useKioskStore.getState().selectCategory(match.id);
        return {
          success: true,
          category: match.name,
          items: match.items.map((item) => ({
            item_name: item.name,
            item_name_ar: item.nameArabic,
            price: item.price,
            calories: item.calories,
          })),
        };
      }

      if (category) {
        return {
          success: false,
          error: `There is no "${String(category)}" category.`,
          categories: menuData.categories.map((c) => c.name),
        };
      }

      useKioskStore.getState().removeCategory();
      return {
        success: true,
        categories: menuData.categories.map((c) => ({
          category: c.name,
          category_ar: c.nameArabic,
          items: c.items.map((item) => item.name),
        })),
      };
    },
  },
  {
    function_name: "get_modifiers",
    fn: (...args: unknown[]) => {
      const { item_name } = readArgs(args);
      debugLog("get_modifiers:", { item_name });
      const hit = findItem(item_name);
      if (!hit) return notOnMenu(item_name);
      return {
        success: true,
        item_name: hit.item.name,
        modifiers: [],
        note: "This item has no sizes or options — it is ordered as listed. Do not ask the customer about customisations.",
      };
    },
  },
  {
    function_name: "get_cart_summary",
    fn: () => {
      debugLog("get_cart_summary");
      return { success: true, ...cartSummary(), ...upsellGate() };
    },
  },
  {
    function_name: "confirm_order",
    fn: () => {
      debugLog("confirm_order");
      const store = useKioskStore.getState();
      // Read the cart before completing — completing empties it.
      const summary = cartSummary();

      // First call puts the order on the review screen; the order is only
      // finalised once the customer has confirmed what they can see.
      if (!store.isConfirming) {
        try {
          store.beginConfirmation();
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: any) {
          return { success: false, error: error.message };
        }
        return {
          success: true,
          status: "awaiting_confirmation",
          ...summary,
          instruction:
            "The order is now on screen for the customer to review. Tell them the total and ask them to confirm it is correct. Call confirm_order again once they say yes.",
        };
      }

      try {
        store.completeOrder();
        // Three digits, matching what the preamble tells the agent to announce.
        const orderNumber = String(Math.floor(100 + Math.random() * 900));
        // Let the agent finish announcing the number and total before the
        // session is torn down.
        setTimeout(endAgent, 10000);
        return {
          success: true,
          status: "completed",
          order_number: orderNumber,
          total_incl_vat: summary.total_incl_vat,
          currency: "SAR",
          items: summary.items,
        };
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    function_name: "reorder_last",
    fn: () => {
      debugLog("reorder_last");
      return {
        success: false,
        error:
          "This kiosk does not keep order history, so there is no previous order to load. Ask the customer what they would like today.",
      };
    },
  },
  {
    function_name: "escalate_to_human",
    fn: (...args: unknown[]) => {
      const { reason } = readArgs(args);
      debugLog("escalate_to_human:", { reason });
      return {
        success: true,
        message:
          "A staff member has been notified and is on their way to the kiosk.",
      };
    },
  },
  {
    function_name: "get_business_info",
    fn: () => {
      debugLog("get_business_info");
      return {
        success: true,
        categories: menuData.categories.map((c) => c.name),
        opening_hours: "Daily, 10:00 to 23:00",
        collection: "Orders are collected at the counter.",
      };
    },
  },
];

export const agentTools = tools as unknown as Tool[];
