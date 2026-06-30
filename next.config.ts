import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/AibleBox" : "";

const nextConfig: NextConfig = {
  ...(isGithubPages ? { output: "export" as const } : {}),
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (isGithubPages || process.env.NODE_ENV !== "development") {
      return [];
    }

    const chatOrigin = process.env.EXCEL_AI_CHAT_DEV_URL ?? "http://localhost:3001";
    const admissionOrigin = process.env.ADMISSION_DEV_URL ?? "http://localhost:3002";
    return [
      { source: "/chat", destination: `${chatOrigin}/chat` },
      { source: "/chat/:path*", destination: `${chatOrigin}/chat/:path*` },
      { source: "/admission", destination: `${admissionOrigin}/admission` },
      { source: "/admission/:path*", destination: `${admissionOrigin}/admission/:path*` },
    ];
  },
};

export default nextConfig;
