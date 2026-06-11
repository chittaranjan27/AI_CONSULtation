import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  experimental: {
    // Cache dynamic pages in the client-side router for 30 seconds.
    // Navigating back to an already-visited admin page within 30s
    // will use the cached version instead of re-fetching from the server.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
