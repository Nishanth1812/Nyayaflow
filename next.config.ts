import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? (process.env.VERCEL ? "" : "http://localhost:8000");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Local dev convenience: proxy API routes to FastAPI without CORS. Vercel
  // uses the same-origin routes declared in vercel.json.
  async rewrites() {
    // If API_BASE is empty/relative (Vercel prod same-origin), no proxy needed.
    if (!API_BASE || API_BASE.startsWith("/")) {
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
};

export default nextConfig;
