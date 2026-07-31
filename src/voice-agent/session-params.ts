import { menuData } from "@/store/menuData";
import type { VoiceSettings } from "./settings";

/**
 * Session variables for the agent's preamble.
 *
 * The agent's prompt is a template — every dynamic piece is a {{variable}} the
 * kiosk fills per session. Every variable the template references must be sent,
 * otherwise the placeholder is spoken literally.
 */

/** The menu, rendered from menuData so the prompt can never drift from the UI. */
export const buildMenuText = (): string =>
  menuData.categories
    .map((category) => {
      const items = category.items
        .map(
          (item) =>
            `  - ${item.name} (${item.nameArabic}) — SAR ${item.price.toFixed(2)} — ${item.calories} cal`,
        )
        .join("\n");
      return `**${category.name} (${category.nameArabic})**\n${items}`;
    })
    .join("\n\n");

const greeting = (language: "ar" | "en", vendorName: string): string =>
  language === "ar"
    ? `أهلاً وسهلاً في ${vendorName}! وش تحب تطلب؟`
    : `Welcome to ${vendorName}! What can I get you today?`;

const languageInstruction = (language: "ar" | "en"): string =>
  language === "ar"
    ? "Speak Arabic (Saudi dialect) for the whole call. Only switch to English if the customer speaks English first."
    : "Speak English for the whole call. Only switch to Arabic if the customer speaks Arabic first.";

/**
 * Builds every variable the agent's preamble references.
 *
 * @param language - Language the customer picked on the start screen.
 * @param settings - Current voice settings (persona and vendor naming).
 */
export const buildSessionParams = (
  language: "ar" | "en",
  settings: VoiceSettings,
): Record<string, string> => ({
  persona_name: settings.personaName,
  vendor_name: settings.vendorName,
  vendor_industry: "fast food restaurant",
  language_instruction: languageInstruction(language),
  customer_block: "- The customer is not identified. Do not use a name.",
  branch_name: `${settings.vendorName} — Main Branch`,
  branch_list: `- This is the only branch of ${settings.vendorName}.`,
  menu: buildMenuText(),
  // The demo menu has no sizes or options: every item is a single fixed
  // product, so the size/modifier machinery in the prompt is switched off here.
  modifiers:
    "- No item on this menu has sizes, options or modifiers. Every item is ordered exactly as listed. Never ask the customer about size, milk, sauces or add-ons.",
  upsell_block:
    "- Suggest a natural add-on when it fits the cart: fries or onion rings with a burger, a drink with a sandwich, a dessert to finish.",
  policies_block: "- Orders are prepared fresh and collected at the counter.",
  knowledge_block: "",
  max_cart_value: "500",
  max_qty_per_item: "10",
  max_retries: "3",
  retries_before_escalation: "2",
  first_message: greeting(language, settings.vendorName),
});
