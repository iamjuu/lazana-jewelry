import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force unique build ID with timestamp to bust cache for all users
  generateBuildId: async () => {
    return `v0.4.0-${Date.now()}`;
  },
  experimental: {
    // Allow larger file uploads (e.g. product videos ~28MB) to /api/upload/cloudinary
    proxyClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
