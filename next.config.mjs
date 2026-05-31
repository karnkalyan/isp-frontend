/** @type {import('next').NextConfig} */
const apiProxyTarget =
  process.env.INTERNAL_API_BASE_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL !== "/api"
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : "http://localhost:3200");

const nextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget.replace(/\/+$/, "")}/:path*`,
      },
    ];
  },

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
        "cms.arrownet.com.np",
        "localhost:4000",
        "cms.arrownet.simulcast.com.np",
      ],
    },
  },
};

export default nextConfig;
