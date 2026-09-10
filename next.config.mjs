/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Server-only packages configuration if needed
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
