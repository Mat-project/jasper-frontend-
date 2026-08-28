import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // ── Production Output & Optimization ──────────────────────────────────────
  // Only use standalone output in production — it traces all imports and
  // consumes significant memory, causing OOM errors in dev mode.
  ...(isProduction && { output: "standalone" }),
  reactStrictMode: true,

  // ── Remote Image Domains ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backend-production-8203.up.railway.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "eoms-production-storage.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
    ],
  },

  // ── API Proxy (environment based) ─────────────────────────────────────────
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return apiUrl
      ? [
          {
            source: "/api-proxy/:path*",
            destination: `${apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl}/:path*`,
          },
        ]
      : [];
  },

  // ── Security Headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
