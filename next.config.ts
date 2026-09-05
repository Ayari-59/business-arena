import type { NextConfig } from "next";
import { securityHeaders } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  // La pile n'a pas à s'annoncer dans chaque réponse.
  poweredByHeader: false,
  // La fonctionnalité « ateliers » s'appelle désormais « animations » : la route
  // suit le libellé. On redirige l'ancienne URL (partagée aux profs/élèves,
  // indexée) vers la nouvelle en permanent, pour ne casser aucun lien existant.
  redirects: async () => [
    { source: "/ateliers", destination: "/animations", permanent: true },
    { source: "/ateliers/:path*", destination: "/animations/:path*", permanent: true },
    { source: "/teacher/ateliers/:path*", destination: "/teacher/animations/:path*", permanent: true },
  ],
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
