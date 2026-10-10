// Security headers for every storefront response (QA 2026-10-10, m7). The CSP allows only
// this site, the Medusa backend (API and product photos) and the WayForPay payment form.
// Next.js inlines its bootstrap scripts, so script-src keeps 'unsafe-inline'; development
// additionally needs 'unsafe-eval' for fast refresh.

export interface HeaderEntry {
  key: string;
  value: string;
}

export function contentSecurityPolicy(medusaOrigin: string, production: boolean): string {
  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...(production ? [] : ["'unsafe-eval'"])]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", medusaOrigin]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", ["'self'", medusaOrigin, ...(production ? [] : ["ws:"])]],
    ["worker-src", ["'self'", "blob:"]],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'", "https://secure.wayforpay.com"]],
    ["base-uri", ["'self'"]],
    ["object-src", ["'none'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(" ")}`).join("; ");
}

export function securityHeaders(medusaOrigin: string, production: boolean): HeaderEntry[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(medusaOrigin, production) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
    // Browsers ignore HSTS on plain http (local runs); on the server it pins https for a year.
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ];
}
