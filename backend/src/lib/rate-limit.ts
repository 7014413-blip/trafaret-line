// In-memory sliding-window limits for the public storefront routes (QA 2026-10-10, M8):
// layout uploads and checkout cost disk space and manager time, so one address may only
// call them a few times. One Medusa process serves the shop; with several processes each
// one limits on its own, which only makes the limit softer. nginx limits stay recommended.

import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

interface Window {
  hits: number[];
  bytes: { at: number; size: number }[];
}

const windows = new Map<string, Window>();
let lastSweep = Date.now();

export interface RouteLimit {
  /** Name of the bucket ("upload", "checkout"). */
  name: string;
  /** Requests per window per address. */
  limit: number;
  windowMs: number;
  /** Optional cap on request body bytes per window per address. */
  maxBytes?: number;
}

/**
 * Client address behind FastPanel nginx, or the socket. nginx sets x-real-ip to the address it
 * saw and appends that address to x-forwarded-for, so only x-real-ip and the last
 * x-forwarded-for entry come from our proxy; earlier entries are whatever the client sent and
 * would let one client pass as many addresses (QA 2026-10-16).
 */
export function clientAddress(req: MedusaRequest): string {
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  const forwarded = req.headers["x-forwarded-for"];
  const header = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;
  const last = header?.split(",").map((part) => part.trim()).filter(Boolean).pop();
  if (last) return last;
  return req.socket?.remoteAddress ?? "unknown";
}

function sweep(now: number, windowMs: number): void {
  if (now - lastSweep < windowMs) return;
  for (const [key, w] of windows) {
    const lastHit = w.hits[w.hits.length - 1] ?? 0;
    const lastBytes = w.bytes[w.bytes.length - 1]?.at ?? 0;
    if (now - Math.max(lastHit, lastBytes) > windowMs) windows.delete(key);
  }
  lastSweep = now;
}

/** Records one call; returns seconds to wait when the limit is reached, otherwise 0. */
export function takeLimit(key: string, rule: RouteLimit, bodyBytes: number, now = Date.now()): number {
  sweep(now, rule.windowMs);
  const w = windows.get(key) ?? { hits: [], bytes: [] };
  w.hits = w.hits.filter((t) => now - t < rule.windowMs);
  w.bytes = w.bytes.filter((b) => now - b.at < rule.windowMs);
  const usedBytes = w.bytes.reduce((sum, b) => sum + b.size, 0);
  const overCount = w.hits.length >= rule.limit;
  const overBytes = rule.maxBytes != null && usedBytes + bodyBytes > rule.maxBytes;
  if (overCount || overBytes) {
    windows.set(key, w);
    const oldest = Math.min(w.hits[0] ?? now, w.bytes[0]?.at ?? now);
    return Math.max(1, Math.ceil((rule.windowMs - (now - oldest)) / 1000));
  }
  w.hits.push(now);
  if (bodyBytes > 0) w.bytes.push({ at: now, size: bodyBytes });
  windows.set(key, w);
  return 0;
}

/** Medusa middleware for one route: 429 with Retry-After when the address is over the limit. */
export function limitRoute(rule: RouteLimit) {
  return (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction): void => {
    const length = Number(req.headers["content-length"] ?? 0) || 0;
    const wait = takeLimit(`${rule.name}:${clientAddress(req)}`, rule, length);
    if (wait > 0) {
      res.setHeader("Retry-After", String(wait));
      res.status(429).json({ errors: ["rate_limited"], message: "Too many requests" });
      return;
    }
    next();
  };
}
