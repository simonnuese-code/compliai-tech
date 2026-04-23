import type { NextConfig } from "next";

// Force Vercel Rebuild


const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/curacon-extract',
        destination: 'https://curacon-extract.vercel.app/curacon-extract',
      },
      {
        source: '/curacon-extract/:path*',
        destination: 'https://curacon-extract.vercel.app/curacon-extract/:path*',
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
       {
        protocol: 'https',
        hostname: '**',
      },
    ]
  },
};

export default nextConfig;
