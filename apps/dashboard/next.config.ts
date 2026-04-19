import type { NextConfig } from "next";

function resolveApiUpstream(): string {
  const explicit = process.env.API_UPSTREAM_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const pub = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ?? "";
  const origin = pub.replace(/\/api$/i, "");
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    return origin;
  }

  return "http://127.0.0.1:3001";
}

const API_UPSTREAM_URL = resolveApiUpstream();

const nextConfig: NextConfig = {
  transpilePackages: ["antd"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_UPSTREAM_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
