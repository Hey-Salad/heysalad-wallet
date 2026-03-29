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

function isValidParsedIntent(value: unknown): value is ParsedIntent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const actionOk = v.action === "send";
  const amountOk = Number.isFinite(v.amountTrx as number);
  return actionOk && amountOk;
}

export async function parseVoiceToIntent(text: string): Promise<ParsedIntent | null> {
  try {
    const sys =
      "You are a parser. Extract structured payment intents for a TRON wallet focused on food. " +
      "Return strict JSON with keys: action ('send'), amountTrx (number), toName (string optional), address (optional), note (optional), category (one of groceries, restaurants, farmers_market, delivery, other, sustainable), sustainable (boolean). " +
      "Infer sustainable true for farmers markets, organic, local, vegan keywords. Return JSON only with no prose.";

    const user = `Text: """${text}"""`;

    const { completion } = await askLLM([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);

    const start = completion.indexOf("{");
    const end = completion.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      console.warn("[Intent] No JSON found in completion", completion);
      return null;
    }

    const json = completion.slice(start, end + 1);

    let parsedUnknown: unknown;
    try {
      parsedUnknown = JSON.parse(json);
    } catch (e) {
      console.error("[Intent] JSON.parse failed", json, e);
      return null;
    }

    if (!isValidParsedIntent(parsedUnknown)) {
      console.warn("[Intent] Parsed intent invalid", parsedUnknown);
      return null;
    }

    const parsed = parsedUnknown as ParsedIntent;
    return parsed;
  } catch (e) {
    console.error("[Intent] Failed to parse LLM completion (outer)", e);
    return null;
  }
}
