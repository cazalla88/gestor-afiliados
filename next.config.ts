import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.es',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.co.uk',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.de',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.fr',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.it',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.ca',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.co.jp',
      },
      {
        protocol: 'https',
        hostname: '**.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
