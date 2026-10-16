import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers";

// Product photos are served by Medusa's file module (local: http://localhost:9000/static/…,
// server: the backend address in NEXT_PUBLIC_MEDUSA_URL).
const medusa = new URL(process.env.NEXT_PUBLIC_MEDUSA_URL ?? "http://localhost:9000");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // A server copy (deploy/staging) ships the self-contained build: server.js with only the
  // packages it uses. Local runs and CI keep the usual `next start`.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders(medusa.origin, process.env.NODE_ENV === "production") }];
  },
  images: {
    remotePatterns: [
      { protocol: medusa.protocol.replace(":", "") as "http" | "https", hostname: medusa.hostname, port: medusa.port, pathname: "/static/**" },
      { protocol: "http", hostname: "localhost", port: "9000", pathname: "/static/**" },
    ],
  },
};

export default nextConfig;
