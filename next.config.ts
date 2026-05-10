import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree shaking cho Mantine với App Router
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "@tabler/icons-react"],
  },
};

export default nextConfig;
