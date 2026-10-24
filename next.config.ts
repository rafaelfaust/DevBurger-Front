import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
}

export default nextConfig
