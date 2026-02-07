import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '180mb',
    },
    serverComponentsExternalPackages: ['ghostscript4js'],
    // @ts-expect-error - outputFileTracingIncludes is a valid option in newer Next.js but types might be outdated in this project
    outputFileTracingIncludes: {
      '/api/compress': ['./bin/**/*'],
    },
  },
};

export default nextConfig;
