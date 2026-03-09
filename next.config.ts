import type { NextConfig } from "next";
import { execSync } from "child_process";
import packageJson from "./package.json";

const getGitInfo = () => {
  try {
    const commit = execSync("git rev-parse --short HEAD").toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
    return { commit, branch };
  } catch {
    return { commit: "unknown", branch: "unknown" };
  }
};

const { commit, branch } = getGitInfo();

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_APP_DESCRIPTION: packageJson.description,
    NEXT_PUBLIC_GIT_COMMIT: commit,
    NEXT_PUBLIC_GIT_BRANCH: branch,
    NEXT_PUBLIC_BUILD_DATE: new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "development",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
    ],
  },
};

export default nextConfig;