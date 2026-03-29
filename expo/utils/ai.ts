export type LLMMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export type LLMResponse = { completion: string };

export async function askLLM(messages: LLMMessage[]): Promise<LLMResponse> {
  console.log("[AI] askLLM messages", messages);
  const res = await fetch("https://toolkit.rork.com/text/llm/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[AI] LLM error", res.status, text);
    throw new Error("AI service failed");
  }
  const data = (await res.json()) as LLMResponse;
  console.log("[AI] LLM completion received");
  return data;
}

export type STTResponse = { text: string; language: string };

export async function transcribeAudio(formData: FormData): Promise<STTResponse> {
  console.log("[AI] transcribeAudio start");
  const res = await fetch("https://toolkit.rork.com/stt/transcribe/", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[AI] STT error", res.status, text);
    throw new Error("Speech-to-text failed");
  }
  const data = (await res.json()) as STTResponse;
  console.log("[AI] STT response", data.language, data.text.slice(0, 64));
  return data;
}