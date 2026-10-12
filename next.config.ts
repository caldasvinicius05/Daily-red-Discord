import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLIENT_ID is public; expose it to the browser under a NEXT_PUBLIC_ name.
  // CLIENT_SECRET and PUBLIC_KEY stay server-only.
  env: {
    NEXT_PUBLIC_DISCORD_CLIENT_ID: process.env.CLIENT_ID,
  },
  // pokemon-showdown is a large CommonJS package; keep it out of the server bundle.
  serverExternalPackages: ["pokemon-showdown"],
  // Migrations are read from disk at startup, not imported, so the file tracer can't see
  // them. Without this, serverless deploys (Vercel) ship without the SQL files.
  outputFileTracingIncludes: {
    "/api/**": ["./drizzle/**/*"],
  },
  // In dev, the Activity reaches us through a Cloudflare tunnel and Discord's proxy;
  // Next blocks dev assets from other origins unless they're listed here.
  allowedDevOrigins: ["*.trycloudflare.com", "*.discordsays.com"],
};

export default nextConfig;
