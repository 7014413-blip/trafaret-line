// In-memory sliding-window limiter for public routes that cost money per call
// (Gemini, Opendatabot). One Node process serves the site, so memory is enough; with
// several processes each one limits on its own, which only makes the limit softer.

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the next request is allowed (0 when allowed). */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (now - lastSweep > windowMs) {
    for (const [k, hits] of buckets) {
      if (!hits.length || now - hits[hits.length - 1] > windowMs) buckets.delete(k);
    }
    lastSweep = now;
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfter: 0 };
}

/** Client address behind the reverse proxy (FastPanel nginx sets x-forwarded-for / x-real-ip). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}
