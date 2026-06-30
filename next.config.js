/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
    instrumentationHook: true,
  },
}
module.exports = nextConfig
