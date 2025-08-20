import { askLLM } from "@/utils/ai";

export type ParsedIntent = {
  action: "send";
  amountTrx: number;
  toName?: string;
  address?: string;
  note?: string;
  category?: "groceries" | "restaurants" | "farmers_market" | "delivery" | "other" | "sustainable";
  sustainable?: boolean;
};

export async function parseVoiceToIntent(text: string): Promise<ParsedIntent | null> {
  const sys =
    "You are a parser. Extract structured payment intents for a TRON wallet focused on food. " +
    "Return strict JSON with keys: action ('send'), amountTrx (number), toName (string optional), address (optional), note (optional), category (one of groceries, restaurants, farmers_market, delivery, other, sustainable), sustainable (boolean). " +
    "Infer sustainable true for farmers markets, organic, local, vegan keywords.";
  const user = `Text: """${text}""" Return JSON only.`;
  const { completion } = await askLLM([
    { role: "system", content: sys },
    { role: "user", content: user },
  ]);

  try {
    const start = completion.indexOf("{");
    const end = completion.lastIndexOf("}");
    const json = completion.slice(start, end + 1);
    const parsed = JSON.parse(json) as ParsedIntent;
    if (!parsed || parsed.action !== "send" || !Number.isFinite(parsed.amountTrx)) return null;
    return parsed;
  } catch (e) {
    console.error("[Intent] Failed to parse LLM completion", completion, e);
    return null;
  }
}