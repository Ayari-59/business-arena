import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/tarifs" }));

import TarifsPage, { metadata } from "@/app/tarifs/page";
import {
  CONDITIONS_DE_VENTE,
  FORMULES_ENTREPRISES,
  OFFRES_ENSEIGNEMENT,
  OPTIONS,
  PRIX_HT,
  QUESTIONS_TARIFS,
  RESEAUX,
  TAUX_TVA,
  prixTTC,
  seuilEtablissementAvantageux,
} from "@/config/tarifs";

/**
 * LA GRILLE TARIFAIRE A UNE SOURCE, ET LA PAGE LA LIT.
 *
 * Un prix écrit deux fois finit par en dire deux : c'est la leçon que le dépôt
 * a déjà payée sur le nombre de secteurs (`compte-des-secteurs.test.ts`).
 * Les prix vivent dans `config/tarifs.ts` ; la page `/tarifs` n'en écrit
 * aucun. La garde vérifie la grille validée par le propriétaire (490 et 990 €
 * HT par an, TTC = HT × 1,2), qu'aucun texte ne parle d'un prix au mois ni
 * d'un essai en classe (il n'y en a pas), et qu'il n'y a qu'un bouton plein :
 * celui de l'offre Établissement.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
/** Le code seul : les commentaires racontent la règle, et la citent. */
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

function fichiers(racine: string): string[] {
  return readdirSync(racine).flatMap((e) => {
    const c = join(racine, e);
    return statSync(c).isDirectory() ? fichiers(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

const HTML = renderToStaticMarkup(createElement(TarifsPage));
/** Le texte rendu, balises retirées, espaces fines ramenées à l'espace. */
const TEXTE = HTML.replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/[  ]/g, " ")
  .replace(/\s+/g, " ");

describe("la grille tarifaire", () => {
  it("porte les prix validés : 490 et 990 € HT par an, TVA 20 %, TTC = HT × 1,2", () => {
    expect(PRIX_HT).toEqual({ enseignant: 490, etablissement: 990 });
    expect(TAUX_TVA).toBe(0.2);
    expect(prixTTC(PRIX_HT.enseignant)).toBe(588);
    expect(prixTTC(PRIX_HT.etablissement)).toBe(1188);
    for (const o of OFFRES_ENSEIGNEMENT) {
      if (o.prixHT === undefined) continue;
      expect(prixTTC(o.prixHT), o.code).toBe(Math.round(o.prixHT * 1.2));
    }
    // Les offres payantes lisent leur prix dans PRIX_HT, pas dans un chiffre recopié.
    const prix = Object.fromEntries(OFFRES_ENSEIGNEMENT.map((o) => [o.code, o.prixHT]));
    expect(prix).toEqual({ decouverte: undefined, ...PRIX_HT });
  });

  it("« plus avantageux dès 3 enseignants » se calcule sur les prix", () => {
    const n = seuilEtablissementAvantageux();
    expect(n).toBe(3);
    expect((n - 1) * PRIX_HT.enseignant).toBeLessThanOrEqual(PRIX_HT.etablissement);
    expect(n * PRIX_HT.enseignant).toBeGreaterThan(PRIX_HT.etablissement);
    expect(OFFRES_ENSEIGNEMENT.find((o) => o.code === "etablissement")!.mention).toBe(
      `Plus avantageux dès ${n} enseignants`,
    );
  });

  it("la page affiche les prix HT, le TTC et la TVA lus dans la grille", () => {
    for (const attendu of ["490 € HT / an", "588 € TTC", "990 € HT / an", "1 188 € TTC", "TVA 20 %"]) {
      expect(TEXTE, attendu).toContain(attendu);
    }
    expect(TEXTE).toContain("Plus avantageux dès 3 enseignants");
    expect(TEXTE).not.toMatch(/le plus choisi/i);
    expect(metadata.title).toBe("Tarifs");
    expect(String(metadata.description).replace(/[\u202f\u00a0]/g, " ")).toContain("490 € HT par an");
  });

  it("les prix n'ont qu'une source : ni la page ni aucun autre fichier ne les écrit", () => {
    const page = code(lire("app/tarifs/page.tsx"));
    expect(page).toContain('from "@/config/tarifs"');
    expect(page, "un prix écrit dans la page").not.toMatch(/\b(?:490|588|990|1\s?188)\b/);
    expect(page, "un symbole euro écrit dans la page").not.toContain("€");
    expect(page, "un taux écrit dans la page").not.toMatch(/\b20\s?%/);
    // Les pages et les composants : ce que lit un visiteur. (Les épisodes ont
    // leurs propres montants, qui n'ont rien d'un tarif.)
    const ailleurs = [...fichiers(join(SRC, "app")), ...fichiers(join(SRC, "components"))]
      .filter((f) => /\b(?:490|990)\s?(?:€|euros)/.test(code(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1));
    expect(ailleurs, `prix recopiés hors de config/tarifs.ts : ${ailleurs.join(", ")}`).toEqual([]);
  });

  it("aucune mention d'un prix au mois ni d'un essai en classe", () => {
    const textes = [
      TEXTE,
      String(metadata.description),
      RESEAUX.texte,
      ...OFFRES_ENSEIGNEMENT.flatMap((o) => [o.nom, o.pourQui, o.mention ?? "", ...o.inclus, ...o.precisions]),
      ...FORMULES_ENTREPRISES.flatMap((f) => [f.nom, ...f.inclus]),
      ...OPTIONS.map((o) => o.nom),
      ...CONDITIONS_DE_VENTE,
      ...QUESTIONS_TARIFS.flatMap((x) => [x.q, x.r]),
    ];
    for (const t of textes) {
      expect(t, t).not.toMatch(/mensuel|par mois|\/\s?mois|essai en classe/i);
    }
  });

  it("un seul bouton plein, sur l'offre Établissement ; aucun bouton « Payer »", () => {
    expect(OFFRES_ENSEIGNEMENT.filter((o) => o.bouton.principal).map((o) => o.code)).toEqual([
      "etablissement",
    ]);
    expect(HTML.match(/\bbouton-plein\b/g) ?? []).toHaveLength(1);
    const plein = HTML.match(/<a[^>]*class="[^"]*\bbouton-plein\b[^"]*"[^>]*>([^<]*)<\/a>/);
    expect(plein?.[1]).toBe("Demander un bon de commande");
    expect(plein?.[0]).toContain('href="/rendez-vous"');
    // Les autres sont des boutons secondaires (filet), et rien n'encaisse en ligne.
    expect(HTML.match(/\bbouton-filet\b/g)?.length).toBeGreaterThanOrEqual(3);
    const libelles = [...HTML.matchAll(/<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/g)].map((m) =>
      m[1]!.replace(/<[^>]+>/g, "").trim(),
    );
    expect(libelles.length).toBeGreaterThan(4);
    for (const l of libelles) expect(l, "un bouton qui encaisse").not.toMatch(/pa(?:y|ie)|régler|acheter/i);
    const cibles = [...HTML.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(cibles)).toEqual(new Set(["/jouer", "/rendez-vous", "/orientation", "/mentions-legales"]));
    expect(TEXTE).toContain("Tester le simulateur");
    expect(TEXTE).toContain("Commander");
    expect(TEXTE).toContain("Demander un devis");
  });

  it("le lieu d'hébergement n'est pas écrit (il n'est pas confirmé)", () => {
    expect(TEXTE).not.toMatch(/héberg|Francfort|Union européenne/i);
  });
});
