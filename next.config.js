/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the output: 'export' to enable API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.unsplash.com']
  },
  trailingSlash: true,
  // Clear cache on build to fix webpack caching issues
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Disable caching for production builds
      config.cache = false;
    }
    return config;
  },
  // Temporarily disable React strict mode to avoid double rendering issues
  reactStrictMode: false,
  // Database initialization
  async headers() {
    // This is just to add a hook - the actual DB init is in the API routes
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DB-Initialized',
            value: 'true',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
