import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Single deployable unit: UI, REST API and data layer ship together.
  poweredByHeader: false,
};

export default nextConfig;
