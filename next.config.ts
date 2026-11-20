import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old site at this address used other paths. Search results, shared
  // links and bookmarks still point at them, so each goes to its nearest page
  // here instead of a 404. Permanent, so Google moves its index across.
  async redirects() {
    return [
      { source: "/category/return-gifts", destination: "/shop/return-gifts", permanent: true },
      { source: "/category/bulk-custom-orders", destination: "/bulk-orders", permanent: true },
      { source: "/category/kids-learning", destination: "/shop/kids", permanent: true },
      { source: "/category/kids-room-decor", destination: "/shop/kids", permanent: true },
      { source: "/category/birthday", destination: "/shop/return-gifts", permanent: true },
      { source: "/category/mothers-day", destination: "/for-her", permanent: true },
      { source: "/category/fathers-day", destination: "/for-him", permanent: true },
      { source: "/category/:slug*", destination: "/shop/all", permanent: true },
      { source: "/product/:sku(minimo-.*)", destination: "/shop/all", permanent: true },
      { source: "/checkout", destination: "/cart", permanent: false },
      // Temporary: phone sign-in (PR #1) adds a real /account page; remove this then.
      { source: "/account", destination: "/orders", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/art/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/video/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
    ];
  },
};

export default nextConfig;
