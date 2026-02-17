import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force unique build ID with timestamp to bust cache for all users
  generateBuildId: async () => {
    return `v0.2.0-${Date.now()}`;
  },
  experimental: {
    // Allow larger file uploads (e.g. product videos ~28MB) to /api/upload/s3
    proxyClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'amzn-crystalbowls3.s3.ap-southeast-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'amzn-crystalbowl-bucket.s3.ap-southeast-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add headers to prevent aggressive caching of HTML pages
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
