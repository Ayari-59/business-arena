import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  // La pile n'a pas à s'annoncer dans chaque réponse.
  poweredByHeader: false,
  headers: async () => [
    {
      // Tous les en-têtes de sécurité, CSP comprise, servis partout (fichiers
      // statiques compris). Ils ne dépendent pas de la requête : les pages
      // restent donc éligibles au rendu statique (plus de nonce par requête).
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
