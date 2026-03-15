/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix for "Cross origin request detected" warning
  experimental: {
    serverActions: {
      allowedOrigins: [
        "radius.kisan.net.np",
        "radius.namaste.net.np",
        "localhost:4001",
        "192.168.200.11:3000" // It is good practice to keep localhost explicitly
      ],
    },
  },
  output: 'standalone',
};

export default nextConfig;