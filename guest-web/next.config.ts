import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.10.4'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Keep the Vercel-to-backend connection on HTTPS. This is the
        // canonical backend host used by the mobile app configuration.
        destination: 'https://20.244.11.161.nip.io/api/:path*',
      },
    ]
  },
};

export default nextConfig;
