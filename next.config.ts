import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "http",
        hostname: "**"
      }
    ],
    domains: [
      "platform-lookaside.fbsbx.com",
      "lh3.googleusercontent.com", 
    ],
  },
};

export default nextConfig;
