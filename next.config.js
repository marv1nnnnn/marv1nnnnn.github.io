/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now the default in Next.js 14
  // Static export for local HTML/JS/CSS runnable files
  // xAI API calls are now made client-side
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: 'loose'
  },
  // Ensure all assets are self-contained for local running
  assetPrefix: './',
  basePath: '',
  // Disable server-side features for full static compatibility
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  }
}

module.exports = nextConfig