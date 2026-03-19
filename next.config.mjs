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
        "api.cms.arrownet.com.np", // Added API domain
        "localhost:4000",
        "cms.arrownet.simulcast.com.np" // It is good practice to keep localhost explicitly
      ],
    },
  },
  output: 'standalone',
};

export default nextConfig;