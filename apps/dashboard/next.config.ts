import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["antd"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
