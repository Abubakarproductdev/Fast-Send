import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.10.4'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://20.244.11.161.nip.io/api/:path*', // Proxy to Backend
      },
    ]
  },
};

export default nextConfig;
