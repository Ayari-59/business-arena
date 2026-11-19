import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/db", () => ({ db: {} }));

import { CATALOGUE_PAR_DEFAUT, LES_OFFRES_DE_L_ARENE, NOMS_PAR_DEFAUT, VARIABLES_PAR_DEFAUT, descriptionDesTarifs, ligneDePrix, reponseCombien } from "@/config/tarifs";
import { euros, prixALaVitrine, vueDesTarifs, type Catalogue } from "@/config/catalogue";
import { PageDesTarifs } from "@/components/page-des-tarifs";
import { LesQuatreFormats } from "@/components/accueil-formats";

/**
 * LA VITRINE PREMIUM, LOT 1 (décisions du propriétaire, novembre 2026).
 *  1. L'accueil : sous les deux boutons du héros, une seule ligne (« J'ai un code de mon
 *     enseignant ») ; les deux petits paragraphes descendent dans la bande des quatre formats,
 *     sans qu'aucune phrase ni aucun lien ne quitte la page.
 *  2. Les offres de l'arène, prix publics allumés : « À partir de 290 € par an », montant lu au
 *     catalogue, « sur devis » qui reste ; prix éteints : « Sur devis », rien ne change.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
const plat = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** « à partir de 290 € » : un montant précédé de « à partir de » (pas « à partir de 5 établissements »). */
const A_PARTIR_D_UN_MONTANT = /partir de [\d\s\u00a0\u202f]+€|partir de \{?euros/i;
const espaces = (t: string) => t.replace(/[  ]/g, " ");

const ACCUEIL = lire("src/app/page.tsx");
const PREMIERE_PHRASE = "Une partie de découverte en solo, sans compte ni installation. Pour vos classes :";
const SECONDE_PHRASE = "Aussi : le cours par la simulation, ses cas pratiques et les épisodes manager.";

describe("l'accueil : une seule ligne sous les boutons, aucune phrase perdue", () => {
  it("entre les boutons et la grille des lieux, il ne reste que « J'ai un code de mon enseignant »", () => {
    const sous = ACCUEIL.slice(ACCUEIL.indexOf("data-cta-principal"), ACCUEIL.indexOf("<GrilleDesLieux"));
    const apresLesBoutons = sous.slice(sous.indexOf("Je suis enseignant"));
    // Le code JSX, commentaires retirés : les paragraphes rendus.
    const rendu = apresLesBoutons.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(rendu.match(/<p\b/g) ?? []).toHaveLength(1);
    expect(rendu).toContain("J&apos;ai un code de mon enseignant");
    expect(rendu).not.toContain("découverte en solo");
    expect(rendu).not.toContain("Les quatre formats");
  });

  it("les deux phrases et leurs liens descendent dans la bande des quatre formats", () => {
    const html = renderToStaticMarkup(createElement(LesQuatreFormats, { contraste: false, noms: NOMS_PAR_DEFAUT }));
    const t = plat(html);
    expect(t).toContain(`${PREMIERE_PHRASE} ${LES_OFFRES_DE_L_ARENE} , sur devis.`);
    expect(t).toContain(`${SECONDE_PHRASE} Les quatre formats`);
    expect(html).toMatch(/<a[^>]*href="\/tarifs"[^>]*>les offres Classe, Programme et Campus<\/a>/);
    expect(html).toMatch(/<a[^>]*href="#formats"[^>]*>Les quatre formats<\/a>/);
    // Après la liste des formats : la bande les présente d'abord.
    expect(html.indexOf("data-formats-de-l-accueil")).toBeLessThan(html.indexOf(PREMIERE_PHRASE.slice(0, 30)));
  });
});

/** Le catalogue par défaut, Classe passée à 310 € : le montant se lit au catalogue. */
const AUTRE: Catalogue = {
  ...CATALOGUE_PAR_DEFAUT,
  offres: CATALOGUE_PAR_DEFAUT.offres.map((o) => (o.code === "classe" ? { ...o, prixCents: 31000 } : o)),
};
const rendreLesTarifs = (c: Catalogue, prix: boolean) =>
  plat(
    renderToStaticMarkup(
      createElement(PageDesTarifs, { vue: vueDesTarifs(c, VARIABLES_PAR_DEFAUT, { prix }), noms: NOMS_PAR_DEFAUT, bandeau: null, prixPublics: prix }),
    ),
  );

describe("les offres de l'arène : « à partir de », prix publics allumés seulement", () => {
  it("prixALaVitrine : « à partir de 290 € par an », ou « sur devis » sans prix", () => {
    expect(espaces(prixALaVitrine(29000))).toBe("à partir de 290 € par an");
    expect(espaces(prixALaVitrine(199000))).toBe("à partir de 1 990 € par an");
    expect(prixALaVitrine(null)).toBe("sur devis");
  });

  it("/tarifs, prix allumés : chaque carte dit « À partir de … € par an », lu au catalogue, et « sur devis » reste", () => {
    const t = rendreLesTarifs(CATALOGUE_PAR_DEFAUT, true);
    for (const code of ["classe", "programme", "campus"]) {
      const o = CATALOGUE_PAR_DEFAUT.offres.find((x) => x.code === code)!;
      expect(t, code).toContain(`À partir de ${espaces(euros(o.prixCents!))} par an Prix de référence, sur devis`);
    }
    expect(rendreLesTarifs(AUTRE, true)).toContain("À partir de 310 € par an");
    expect(rendreLesTarifs(AUTRE, true)).not.toContain("À partir de 290 €");
  });

  it("/tarifs, prix éteints : « Sur devis », aucun « à partir de »", () => {
    const t = rendreLesTarifs(CATALOGUE_PAR_DEFAUT, false);
    expect(t).toContain("Sur devis");
    expect(t).not.toMatch(A_PARTIR_D_UN_MONTANT);
  });

  it("la ligne des bandes finales, la réponse « Combien ça coûte ? » et la description de /tarifs", () => {
    const allumees = [ligneDePrix(CATALOGUE_PAR_DEFAUT, true), reponseCombien(CATALOGUE_PAR_DEFAUT, true), descriptionDesTarifs(CATALOGUE_PAR_DEFAUT, true)].map(espaces);
    for (const t of allumees) {
      expect(t, t).toContain("à partir de 290 € par an");
      expect(t, t).toContain("à partir de 990 € par an");
      expect(t, t).toContain("à partir de 1 990 € par an");
      expect(t, t).toContain("sur devis");
    }
    expect(espaces(ligneDePrix(AUTRE, true))).toContain("à partir de 310 € par an");
    for (const t of [ligneDePrix(CATALOGUE_PAR_DEFAUT, false), reponseCombien(CATALOGUE_PAR_DEFAUT, false), descriptionDesTarifs(CATALOGUE_PAR_DEFAUT, false)]) {
      expect(t, t).not.toMatch(A_PARTIR_D_UN_MONTANT);
    }
  });

  it("/ecoles dit le prix de ses cartes par prixALaVitrine, jamais un montant à part", () => {
    const ecoles = lire("src/app/ecoles/page.tsx");
    expect(ecoles).toContain("prixALaVitrine(o.prixCents)");
    expect(ecoles).not.toMatch(/euros\(o\.prixCents\)\} par an/);
  });

  it("le devis, les CGV et la facture gardent le prix exact : aucun « à partir de »", () => {
    for (const f of ["src/components/devis-form.tsx", "src/app/cgv/page.tsx", "src/app/devis/page.tsx"]) {
      expect(lire(f), f).not.toMatch(/prixALaVitrine/);
      expect(lire(f), f).not.toMatch(A_PARTIR_D_UN_MONTANT);
    }
  });
});
