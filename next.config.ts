import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: '/borewell-drilling-:area',
        destination: '/borewell-drilling/:area',
      },
    ]
  },
};

export default nextConfig;
