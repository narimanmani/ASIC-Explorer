import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  serverExternalPackages: ["@yowasp/yosys", "yosys2digitaljs", "pg", "maxmind"],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/history/:path*', headers: [
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; form-action 'self'; base-uri 'self'" },
    ] }];
  },
  webpack: (config) => {
    config.resolve.alias['digitaljs$'] = path.resolve('node_modules/digitaljs/src/circuit.mjs');
    config.resolve.fallback = { ...config.resolve.fallback, url: false };
    return config;
  },
};

export default nextConfig;
