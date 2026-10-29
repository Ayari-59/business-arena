import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LES PAGES PUBLIQUES SANS PERSONNALISATION SE SERVENT DU CACHE (audit d'octobre 2026, P2-6).
 *
 * Mesuré en production : 715 réponses sur 810 en `private, no-store`, /tarifs compris.
 * /tarifs se rendait à chaque visite pour que la fin d'une promotion s'y lise aussitôt ;
 * elle est maintenant régénérée toutes les cinq minutes (ISR), et tout de suite après un
 * enregistrement dans /admin/offres (revalidatePath). Les pages ci-dessous ne lisent ni
 * session, ni cookie, ni paramètre d'adresse : elles restent statiques ou en ISR. Celles
 * qui le font (/cours, /devis, /entreprises/episode…) personnalisent le rendu et restent
 * dynamiques.
 */

const PAGES = [
  "page.tsx",
  "tarifs/page.tsx",
  "notions/page.tsx",
  "parcours/page.tsx",
  "ecoles/page.tsx",
  "enseignants/page.tsx",
  "entreprises/page.tsx",
  "fonctionnalites/page.tsx",
  "animations/page.tsx",
  "orientation/page.tsx",
  "mentions-legales/page.tsx",
];

const lire = (p: string) => readFileSync(join(process.cwd(), "src/app", p), "utf8");
/** Le code sans ses commentaires : une phrase qui cite « searchParams » ne compte pas. */
const code = (p: string) => lire(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("cache des pages publiques", () => {
  it.each(PAGES)("%s ne force pas le rendu dynamique et ne lit rien de la requête", (p) => {
    const src = code(p);
    expect(src).not.toMatch(/dynamic\s*=\s*["']force-dynamic["']/);
    expect(src).not.toMatch(/getSession|getGuestUserId|cookies\(\)|headers\(\)|searchParams|connection\(\)/);
  });

  it("/tarifs se régénère toutes les cinq minutes, et à chaque enregistrement du catalogue", () => {
    expect(lire("tarifs/page.tsx")).toMatch(/export const revalidate = 300;/);
    expect(lire("admin/offres/actions.ts")).toMatch(/PAGES_DU_CATALOGUE = \[\s*"\/tarifs"/);
  });
});
