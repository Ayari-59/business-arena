import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  // La pile n'a pas à s'annoncer dans chaque réponse.
  poweredByHeader: false,
  headers: async () => [
    {
      // Un seul endroit de vérité pour les en-têtes de sécurité : ici, pas
      // dans un vercel.json (il n'y en a pas).
      source: "/(.*)",
      headers: securityHeaders(),
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;
