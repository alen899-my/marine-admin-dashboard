import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",

  async redirects() {
    return [
      {
        // ":path*" matches everything, including nested routes
        source: "/:path*", 
        destination: "https://demo-maritime.parkora.io/:path*", 
        permanent: true, // Set to true for a permanent SEO move (308 redirect)
      },
    ];
  },

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