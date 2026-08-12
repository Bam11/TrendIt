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
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "*.supabase.co"
      }
    ],
    // domains: [
    //   "platform-lookaside.fbsbx.com",
    //   "lh3.googleusercontent.com", 
    // ],
  },
};

export default nextConfig;
