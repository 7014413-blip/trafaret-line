// Google AI Studio (Gemini API) client:
// POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// header x-goog-api-key. Needs GEMINI_API_KEY; GEMINI_MODEL defaults to gemini-2.5-flash.

import "server-only";
import type { ChatMessage, GeminiRawResponse } from "../types/integrations";
import { envNumber, envOr, requireEnv, UpstreamError } from "./config";
import { fetchJson } from "./http";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GenerateOptions {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
}

export function geminiModel(): string {
  return envOr("GEMINI_MODEL", "gemini-2.5-flash");
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { GEMINI_API_KEY } = requireEnv("gemini", ["GEMINI_API_KEY"]);
  const model = geminiModel();
  const body = {
    systemInstruction: { parts: [{ text: options.system }] },
    contents: options.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? envNumber("GEMINI_MAX_TOKENS", 800),
    },
  };
  const { status, data } = await fetchJson<GeminiRawResponse & { error?: { message?: string } }>(
    "gemini", `${BASE}/${encodeURIComponent(model)}:generateContent`, { body, headers: { "x-goog-api-key": GEMINI_API_KEY }, timeoutMs: 30_000 },
  );
  if (status !== 200) throw new UpstreamError("gemini", `Gemini: ${data?.error?.message ?? `HTTP ${status}`}`, status);
  if (data.promptFeedback?.blockReason) throw new UpstreamError("gemini", `Gemini blocked the request: ${data.promptFeedback.blockReason}`, 200);
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) throw new UpstreamError("gemini", `Gemini returned no text (${data.candidates?.[0]?.finishReason ?? "unknown"})`, 200);
  return { text, model: data.modelVersion ?? model };
}
