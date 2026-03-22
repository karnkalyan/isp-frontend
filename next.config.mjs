/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "radius.kisan.net.np",
        "radius.namaste.net.np",
        "api.cms.arrownet.com.np",
        "localhost:4000",
        "cms.arrownet.simulcast.com.np",
      ],
    },
  },
};

export default nextConfig;