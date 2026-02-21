import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Force rebuild - Feb 13
  experimental: {
    turbo: {
      resolveExtensions: [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
      ],
    },
  },
};

export default nextConfig;
