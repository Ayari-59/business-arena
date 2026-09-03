import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  // La pile n'a pas à s'annoncer dans chaque réponse.
  poweredByHeader: false,
  headers: async () => [
    {
      // Les en-têtes statiques, servis partout (fichiers statiques compris) :
      // ils ne dépendent pas de la requête. La CSP, elle, porte un nonce par
      // requête et est posée par le proxy (src/proxy.ts), pas ici.
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
