// Replaces fetch for a service test: every call is recorded and answered by `answer`, so the
// real service code runs against the provider formats in data/knowledge_base/mock_*.json.

import { vi } from "vitest";

export interface RecordedCall {
  url: string;
  body: unknown;
  headers: Record<string, string>;
}

export function stubFetch(answer: (call: RecordedCall) => { status?: number; json: unknown }): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const call: RecordedCall = {
      url: String(url),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    calls.push(call);
    const { status = 200, json } = answer(call);
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  });
  return calls;
}
