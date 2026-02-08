import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  basePath: "/app",
  async redirects() {
    return [
      { source: "/", destination: "/app", permanent: false, basePath: false },
    ];
  },
};

export default nextConfig;
