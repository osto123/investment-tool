import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Receipt uploads go through a Server Action; the default body limit is 1 MB,
    // but the app allows receipts up to 10 MB (MAX_RECEIPT_BYTES). Raise it so the
    // upload reaches the action instead of failing at the framework layer.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
