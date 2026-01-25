import type { NextConfig } from "next";

// Force Vercel Rebuild


const nextConfig: NextConfig = {
  reactCompiler: true,
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
