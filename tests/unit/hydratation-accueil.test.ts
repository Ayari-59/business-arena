import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * L'ACCUEIL S'HYDRATE SANS ERREUR (#418), MÊME RÉGÉNÉRÉ SOUS « /index ».
 *
 * Constaté en production (audit d'octobre 2026) : « Minified React error #418;
 * args[]=HTML » à chaque chargement de `/`. La charge RSC servie portait
 * `"c":["","index"]` : la régénération de l'accueil (ISR) sur Vercel le rend
 * sous le chemin `/index`. `usePathname()` valait `/index` au serveur, `/` au
 * client, et la barre d'action mobile manquait au HTML du serveur (vérifié sur
 * la page servie : rien entre `</footer>` et le script du service worker).
 *
 * On rend ici, de façon déterministe, les composants communs qui lisent le
 * chemin : sous `/index` (le serveur régénéré) et sous `/` (le navigateur), le
 * HTML doit être le même.
 */

let chemin = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => chemin,
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
}));

async function rendre(nom: string, module: string, sous: string): Promise<string> {
  chemin = sous;
  const mod = (await import(module)) as Record<string, FunctionComponent>;
  return renderToStaticMarkup(createElement(mod[nom]!));
}

describe("les composants communs rendent la même chose sous /index et sous /", () => {
  it.each([
    ["BarreDActionMobile", "@/components/barre-d-action-mobile"],
    ["SiteHeader", "@/components/site-header"],
    ["PiedDePage", "@/components/pied-de-page"],
    ["InstallPrompt", "@/components/install-prompt"],
  ])("%s", async (nom, module) => {
    const serveur = await rendre(nom, module, "/index");
    const navigateur = await rendre(nom, module, "/");
    expect(serveur).toBe(navigateur);
  }, 30_000);

  it("la barre d'action de l'accueil est bien dans le HTML du serveur régénéré", async () => {
    expect(await rendre("BarreDActionMobile", "@/components/barre-d-action-mobile", "/index")).toContain(
      "data-barre-action",
    );
  }, 30_000);
});

describe("aucun composant ne lit le chemin sans le normaliser", () => {
  it("usePathname n'est appelé que par lib/chemin-de-la-page.ts", () => {
    const racine = join(process.cwd(), "src");
    const fichiers = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? fichiers(p) : /\.tsx?$/.test(p) ? [p] : [];
      });
    const fautifs = fichiers(racine)
      .filter((f) => !f.endsWith(join("lib", "chemin-de-la-page.ts")))
      .filter((f) => /\busePathname\s*\(/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(racine.length + 1));
    expect(fautifs).toEqual([]);
  });
});
