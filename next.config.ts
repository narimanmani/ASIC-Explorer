import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  serverExternalPackages: ["@yowasp/yosys", "yosys2digitaljs"],
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.alias['digitaljs$'] = path.resolve('node_modules/digitaljs/src/circuit.mjs');
    config.resolve.fallback = { ...config.resolve.fallback, url: false };
    return config;
  },
};

export default nextConfig;
