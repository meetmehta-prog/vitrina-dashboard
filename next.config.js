/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.chunkLoadTimeout = 120000; // 2 minutes
    }
    return config;
  },
  
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL,
    LEMLIST_API_KEY: process.env.LEMLIST_API_KEY,
    LEMLIST_API_KEY2: process.env.LEMLIST_API_KEY2,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Redirects (if needed)
  async redirects() {
    return [];
  },
  
  // Rewrites (if needed)
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;