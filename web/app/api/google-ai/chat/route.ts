// POST /api/google-ai/chat — shop assistant on Gemini (Google AI Studio key).
// Body: { messages: [{ role, text }], page? }. Limited to 20 requests per 10 minutes
// per visitor, last 12 messages, 2 000 characters each.

import { NextResponse } from "next/server";
import { assistantSystemPrompt } from "@/lib/ai/assistant-prompt";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { apiError, handleRouteError, readJson } from "@/lib/api/responses";
import { generate } from "@/services/gemini";
import type { ChatMessage, ChatRequestBody, ChatResponseBody } from "@/types/integrations";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

function cleanMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || !input.length) return null;
  const messages: ChatMessage[] = [];
  for (const item of input.slice(-MAX_MESSAGES)) {
    const m = item as Partial<ChatMessage>;
    if ((m.role !== "user" && m.role !== "assistant") || typeof m.text !== "string" || !m.text.trim()) return null;
    messages.push({ role: m.role, text: m.text.trim().slice(0, MAX_CHARS) });
  }
  // Gemini expects the conversation to start with the user and end with the user.
  while (messages.length && messages[0].role !== "user") messages.shift();
  return messages.length && messages[messages.length - 1].role === "user" ? messages : null;
}

export async function POST(request: Request) {
  const limit = rateLimit(`chat:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    return apiError("gemini", "rate_limited", "Забагато запитів. Напишіть нам у Viber або спробуйте за кілька хвилин.", { details: { retryAfter: limit.retryAfter } });
  }
  const body = await readJson<ChatRequestBody>(request);
  const messages = cleanMessages(body?.messages);
  if (!messages) return apiError("gemini", "bad_request", "Порожнє повідомлення.");
  const page = typeof body?.page === "string" && body.page.startsWith("/") ? body.page.slice(0, 120) : undefined;
  try {
    const result = await generate({ system: assistantSystemPrompt(page), messages });
    return NextResponse.json<ChatResponseBody>({ reply: result.text, model: result.model });
  } catch (error) {
    return handleRouteError("gemini", error);
  }
}
