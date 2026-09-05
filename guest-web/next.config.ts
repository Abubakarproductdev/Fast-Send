import type { NextConfig } from "next";

const BACKEND_URL = "https://145.241.114.68.nip.io";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
