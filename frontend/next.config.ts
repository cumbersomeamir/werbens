import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  basePath: "/app",
  async redirects() {
    return [
      { source: "/", destination: "/app", permanent: false, basePath: false },
      { source: "/portfolio", destination: "/app/portfolio", permanent: false, basePath: false },
      { source: "/portfolio/:category", destination: "/app/portfolio/:category", permanent: false, basePath: false },
      { source: "/packages", destination: "/app/packages", permanent: false, basePath: false },
      { source: "/pricing", destination: "/app/pricing", permanent: false, basePath: false },
      { source: "/robots.txt", destination: "/app/robots.txt", permanent: false, basePath: false },
      { source: "/sitemap.xml", destination: "/app/sitemap.xml", permanent: false, basePath: false },
      { source: "/api/auth/:path*", destination: "/app/api/auth/:path*", permanent: false, basePath: false },
    ];
  },
};

export default nextConfig;
