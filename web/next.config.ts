import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vercel combined deployment: web/ is built via `web/package.json` builder.
  // Local dev convenience: proxy API routes to FastAPI so NEXT_PUBLIC_API_BASE=""
  // can still work with `next dev` without CORS. In Vercel prod, vercel.json
  // handles the routing, so this is a no-op there.
  async rewrites() {
    // If API_BASE is empty/relative (Vercel prod same-origin), no proxy needed.
    if (!API_BASE || API_BASE === "" || API_BASE.startsWith("/")) {
      return [];
    }
    const targets = [
      "health",
      "diagnose",
      "diagnose/:path*",
      "route",
      "diagnostic-rules",
      "diagnostic-rules/:path*",
      "cases",
      "cases/:path*",
      "metrics",
      "evidence-check",
      "static/:path*",
      "openapi.json",
      "docs",
      "docs/:path*",
    ];
    return targets.map((src) => ({
      source: `/${src}`,
      destination: `${API_BASE}/${src}`,
    }));
  },
  // Optional: allow Vercel to serve via `output: 'standalone'` if needed
  // (not required for vercel.json builds approach, but harmless)
  experimental: {
    // turbo not needed
  },
};

export default nextConfig;
