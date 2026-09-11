import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/**
 * Ce que les robots peuvent indexer.
 *
 * Les pages publiques se présentent d'elles-mêmes. L'espace enseignant, l'arène,
 * les formulaires d'entrée par code et l'administration ne sont pas des pages
 * à trouver depuis un moteur de recherche : on y arrive avec un code ou un
 * compte, jamais par hasard.
 */
export const CHEMINS_PRIVES = [
  "/teacher",
  "/arena",
  "/join",
  "/compete",
  "/api",
  "/profile",
  "/admin",
  "/org",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...CHEMINS_PRIVES] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
