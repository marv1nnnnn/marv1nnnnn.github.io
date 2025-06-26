/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now the default in Next.js 14
  // Re-enabled static export for GitHub Pages compatibility
  // xAI API calls are now made client-side
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig