import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Prisma on Vercel serverless (Next.js 16+)
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Skip TypeScript type-checking errors during Vercel CI build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export default nextConfig;

