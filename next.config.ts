import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
