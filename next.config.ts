import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
