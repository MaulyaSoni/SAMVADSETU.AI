// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Enable server actions
      enabled: true,
    },
    // Disable Turbopack due to compatibility issues
    turbopack: false,
  },
  // Configure webpack for compatibility
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      // Lower CPU usage
      poll: 1000,
      // Increase build timeouts
      aggregateTimeout: 500,
    }
    return config
  },
}

module.exports = nextConfig