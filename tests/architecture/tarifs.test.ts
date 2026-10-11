import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/tarifs" }));

import TarifsPage, { metadata } from "@/app/tarifs/page";
import {
  CONDITIONS_DE_VENTE,
  FORMULE_EN_CLASSE,
  FORMULES_ENTREPRISES,
  MENTION_TVA,
  OFFRES_ENSEIGNEMENT,
  OPTIONS,
  PRIX,
  QUESTIONS_TARIFS,
  RESEAUX,
  SANS_LES_EPISODES,
  seuilCampusAvantageux,
} from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";

/**
 * LA GRILLE TARIFAIRE A UNE SOURCE, ET LA PAGE LA LIT.
 *
 * Un prix écrit deux fois finit par en dire deux : c'est la leçon que le dépôt
 * a déjà payée sur le nombre de secteurs (`compte-des-secteurs.test.ts`).
 * Les prix vivent dans `config/tarifs.ts` ; la page `/tarifs` n'en écrit
 * aucun. La garde vérifie la grille validée par le propriétaire (Classe 490 €
 * et Campus 990 € par an, épisodes à part, tout sur devis), la franchise de TVA
 * (aucun « HT », « TTC » ni « TVA 20 % » ; la mention de l'art. 293 B présente),
 * qu'aucun texte ne parle d'un prix au mois ni d'un essai en classe, que chaque
 * offre mène à une demande de devis écrite, et qu'il n'y a qu'un bouton plein :
 * celui de l'offre Campus.
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
  it("porte les prix validés : Classe 490 € et Campus 990 € par an, lus par les cartes", () => {
    expect(PRIX).toEqual({ classe: 490, campus: 990 });
    const prix = Object.fromEntries(OFFRES_ENSEIGNEMENT.map((o) => [o.code, o.prix]));
    expect(prix).toEqual({ decouverte: undefined, ...PRIX });
  });

  it("« plus avantageux dès 3 enseignants » se calcule sur les prix", () => {
    const n = seuilCampusAvantageux();
    expect(n).toBe(3);
    expect((n - 1) * PRIX.classe).toBeLessThanOrEqual(PRIX.campus);
    expect(n * PRIX.classe).toBeGreaterThan(PRIX.campus);
    expect(OFFRES_ENSEIGNEMENT.find((o) => o.code === "campus")!.mention).toBe(
      `Plus avantageux dès ${n} enseignants`,
    );
  });

  it("la page affiche les prix par an et la mention de franchise de TVA, sans HT ni TTC", () => {
    for (const attendu of ["490 €", "990 €", "par an", "Plus avantageux dès 3 enseignants"]) {
      expect(TEXTE, attendu).toContain(attendu);
    }
    expect(MENTION_TVA).toBe("TVA non applicable, art. 293 B du CGI");
    expect(TEXTE).toContain(MENTION_TVA);
    expect(HTML).toContain("data-mention-tva");
    expect(CONDITIONS_DE_VENTE.some((c) => c.includes(MENTION_TVA))).toBe(true);
    expect(TEXTE).not.toMatch(/\bHT\b|\bTTC\b|TVA 20|588|1 188/);
    expect(TEXTE).not.toMatch(/le plus choisi/i);
    expect(metadata.title).toBe("Tarifs");
    const description = String(metadata.description).replace(/[\u202f\u00a0]/g, " ");
    expect(description).toContain("490 € par an");
    expect(description).toContain(MENTION_TVA);
    expect(description).not.toMatch(/\bHT\b|\bTTC\b/);
  });

  it("aucun prix « HT » ou « TTC », ni « TVA 20 % » commerciale, dans src/", () => {
    // Le moteur et les contenus de jeu parlent de TVA, de créances TTC et de résultat HT :
    // c'est la comptabilité des entreprises simulées, pas un tarif. On cherche ici les
    // formes d'un PRIX : « 490 € HT », « HT / an », « HT par an », « € TTC », « TVA 20 % en sus ».
    const PRIX_TAXE = /€\s?(?:HT|TTC)\b|\bHT\s?\/\s?an\b|\bHT par an\b|TVA \$\{|TVA 20\s?% en sus|prixTTC|PRIX_HT/;
    // Les contenus de jeu (épisodes, scénarios, moteur, pédagogie) chiffrent les affaires
    // des entreprises simulées, en HT comme dans la vraie vie : ils sont hors du champ.
    const JEU = /^(?:config\/episodes|config\/scenarios|engine|pedagogy)\//;
    const fautifs = fichiers(SRC)
      .filter((f) => !JEU.test(f.slice(SRC.length + 1)))
      .filter((f) => PRIX_TAXE.test(code(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1));
    expect(fautifs, `prix taxés : ${fautifs.join(", ")}`).toEqual([]);
    // Et, dans les fichiers qui vendent, plus aucun « HT », « TTC » ni taux de TVA du tout.
    const QUI_VENDENT = [
      "config/tarifs.ts",
      "config/editeur.ts",
      "app/tarifs/page.tsx",
      "app/devis/page.tsx",
      "app/devis/actions.ts",
      "components/devis-form.tsx",
      "services/devis.service.ts",
      "app/admin/page.tsx",
    ];
    for (const f of QUI_VENDENT) {
      expect(code(lire(f)), f).not.toMatch(/\bHT\b|\bTTC\b|TVA 20/);
    }
  });

  it("les prix n'ont qu'une source : ni la page ni aucun autre fichier ne les écrit", () => {
    const page = code(lire("app/tarifs/page.tsx"));
    expect(page).toContain('from "@/config/tarifs"');
    expect(page, "un prix écrit dans la page").not.toMatch(/\b(?:490|990)\b/);
    expect(page, "un symbole euro écrit dans la page").not.toContain("€");
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
      FORMULE_EN_CLASSE.nom,
      ...FORMULE_EN_CLASSE.inclus,
      ...FORMULES_ENTREPRISES.flatMap((f) => [f.nom, ...f.inclus]),
      ...OPTIONS.map((o) => o.nom),
      ...CONDITIONS_DE_VENTE,
      ...QUESTIONS_TARIFS.flatMap((x) => [x.q, x.r]),
    ];
    for (const t of textes) {
      expect(t, t).not.toMatch(/mensuel|par mois|\/\s?mois|essai en classe/i);
    }
  });

  it("les offres de l'arène disent qu'elles n'incluent pas les épisodes manager", () => {
    for (const code of ["classe", "campus"] as const) {
      const o = OFFRES_ENSEIGNEMENT.find((x) => x.code === code)!;
      expect(o.precisions, code).toContain(SANS_LES_EPISODES);
    }
    expect(TEXTE).toContain("Épisodes manager");
    expect(TEXTE).toContain("Sur devis");
  });

  it("chaque offre mène à une demande de devis écrite, l'offre pré-remplie ; un seul bouton plein, sur Campus", () => {
    expect(OFFRES_ENSEIGNEMENT.filter((o) => o.bouton.principal).map((o) => o.code)).toEqual(["campus"]);
    expect(HTML.match(/\bbouton-plein\b/g) ?? []).toHaveLength(1);
    const plein = HTML.match(/<a[^>]*class="[^"]*\bbouton-plein\b[^"]*"[^>]*>([^<]*)<\/a>/);
    expect(plein?.[1]).toBe("Demander un devis");
    expect(plein?.[0]).toContain('href="/devis?offre=campus"');
    expect(HTML.match(/\bbouton-filet\b/g)?.length).toBeGreaterThanOrEqual(4);
    const libelles = [...HTML.matchAll(/<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/g)].map((m) =>
      m[1]!.replace(/<[^>]+>/g, "").trim(),
    );
    expect(libelles.length).toBeGreaterThan(4);
    for (const l of libelles) {
      expect(l, "un bouton qui encaisse ou commande").not.toMatch(/pa(?:y|ie)|régler|acheter|commander/i);
    }
    const cibles = [...HTML.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
    expect(new Set(cibles)).toEqual(
      new Set([
        "/jouer",
        "/devis?offre=classe",
        "/devis?offre=campus",
        "/devis?offre=reseau",
        "/devis?offre=episodes",
        "/devis?offre=entreprise",
        "/rendez-vous",
        "/orientation",
        "/mentions-legales",
      ]),
    );
    expect(TEXTE).toContain("Tester le simulateur");
    expect(TEXTE).not.toContain("Commander");
    expect(TEXTE).not.toMatch(/carte bancaire/i);
  });

  it("dit qui établit les devis et les factures, et l'adresse de contact en texte", () => {
    expect(TEXTE).toContain(VENDEUR.nom);
    expect(CONDITIONS_DE_VENTE.some((c) => c.includes(VENDEUR.nom))).toBe(true);
    expect(HTML).toMatch(new RegExp(`select-all[^>]*>${VENDEUR.contact.replace(/\./g, "\\.")}<`));
  });

  it("le lieu d'hébergement n'est pas écrit (il n'est pas confirmé)", () => {
    expect(TEXTE).not.toMatch(/héberg|Francfort|Union européenne/i);
  });
});
