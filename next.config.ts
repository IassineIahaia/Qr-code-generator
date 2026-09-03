import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem isto o Turbopack sobe a raiz até um package-lock.json de fora do repo.
  turbopack: { root: __dirname },
};

export default nextConfig;
