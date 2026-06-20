import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships native-ish deps (fontkit, yoga) that must not be
  // bundled by the server compiler — keep it external so PDF rendering works on
  // Vercel serverless.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
