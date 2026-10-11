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
  seuilProgrammeAvantageux,
  ARGUMENTS_POUR_LES_ECOLES,
  INTEGRATION_LMS,
  ENT_DU_SECONDAIRE,
} from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";

/**
 * LA GRILLE TARIFAIRE A UNE SOURCE, ET LA PAGE LA LIT.
 *
 * Un prix écrit deux fois finit par en dire deux : c'est la leçon que le dépôt
 * a déjà payée sur le nombre de secteurs (`compte-des-secteurs.test.ts`).
 * Les prix vivent dans `config/tarifs.ts` ; la page `/tarifs` n'en écrit
 * aucun. La garde vérifie la grille validée par le propriétaire (Classe 290 €,
 * Programme 990 € et Campus 1 990 € par an, épisodes à part, tout sur devis), la
 * franchise de TVA (aucun « HT », « TTC » ni « TVA 20 % » ; la mention de l'art. 293 B
 * présente), qu'aucun texte ne parle d'un prix au mois ni d'un essai en classe, que
 * chaque offre mène à une demande de devis écrite, qu'il n'y a qu'un bouton plein,
 * celui de l'offre Programme, que les mentions comparatives se calculent sur les prix,
 * et que Moodle n'est pas annoncé comme disponible.
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
  it("porte les prix validés : Classe 290 €, Programme 990 €, Campus 1 990 € par an, lus par les cartes", () => {
    expect(PRIX).toEqual({ classe: 290, programme: 990, campus: 1990 });
    const prix = Object.fromEntries(OFFRES_ENSEIGNEMENT.map((o) => [o.code, o.prix]));
    expect(prix).toEqual({ decouverte: undefined, ...PRIX });
    expect(OFFRES_ENSEIGNEMENT.map((o) => o.code)).toEqual(["decouverte", "classe", "programme", "campus"]);
  });

  it("les mentions comparatives se calculent sur les prix, strictement", () => {
    // Programme contre autant d'offres Classe (une par groupe).
    const n = seuilProgrammeAvantageux();
    expect(n).toBe(4);
    expect((n - 1) * PRIX.classe).toBeLessThanOrEqual(PRIX.programme);
    expect(n * PRIX.classe).toBeGreaterThan(PRIX.programme);
    expect(OFFRES_ENSEIGNEMENT.find((o) => o.code === "programme")!.mention).toBe(
      `Dès ${n} groupes, moins cher que ${n} offres Classe`,
    );
    // Campus contre autant d'offres Programme (une par entreprise) : deux Programmes
    // (1 980 €) coûtent encore moins qu'un Campus (1 990 €), d'où « dès 3 ».
    const m = seuilCampusAvantageux();
    expect(m).toBe(3);
    expect((m - 1) * PRIX.programme).toBeLessThanOrEqual(PRIX.campus);
    expect(m * PRIX.programme).toBeGreaterThan(PRIX.campus);
    expect(OFFRES_ENSEIGNEMENT.find((o) => o.code === "campus")!.mention).toBe(
      `Dès ${m} entreprises, moins cher que ${m} offres Programme`,
    );
  });

  it("la page affiche les prix par an et la mention de franchise de TVA, sans HT ni TTC", () => {
    for (const attendu of ["290 €", "990 €", "1 990 €", "par an", "Dès 4 groupes", "Dès 3 entreprises"]) {
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
    expect(description).toContain("290 € par an");
    expect(description).toContain("1 990 € par an");
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
    expect(page, "un prix écrit dans la page").not.toMatch(/\b(?:290|490|990|1\s?990)\b/);
    expect(page, "un symbole euro écrit dans la page").not.toContain("€");
    // Les pages et les composants : ce que lit un visiteur. (Les épisodes ont
    // leurs propres montants, qui n'ont rien d'un tarif.)
    const ailleurs = [...fichiers(join(SRC, "app")), ...fichiers(join(SRC, "components"))]
      .filter((f) => /\b(?:290|490|990)\s?(?:€|euros)/.test(code(readFileSync(f, "utf8"))))
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
    for (const code of ["classe", "programme", "campus"] as const) {
      const o = OFFRES_ENSEIGNEMENT.find((x) => x.code === code)!;
      expect(o.precisions, code).toContain(SANS_LES_EPISODES);
    }
    expect(TEXTE).toContain("Épisodes manager");
    expect(TEXTE).toContain("Sur devis");
  });

  it("chaque offre mène à une demande de devis écrite, l'offre pré-remplie ; un seul bouton plein, sur Programme", () => {
    expect(OFFRES_ENSEIGNEMENT.filter((o) => o.bouton.principal).map((o) => o.code)).toEqual(["programme"]);
    expect(HTML.match(/\bbouton-plein\b/g) ?? []).toHaveLength(1);
    const plein = HTML.match(/<a[^>]*class="[^"]*\bbouton-plein\b[^"]*"[^>]*>([^<]*)<\/a>/);
    expect(plein?.[1]).toBe("Demander un devis");
    expect(plein?.[0]).toContain('href="/devis?offre=programme"');
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
        "/devis?offre=programme",
        "/devis?offre=campus",
        "/devis?offre=reseau",
        "/devis?offre=episodes",
        "/devis?offre=entreprise",
        "/rendez-vous",
        "/integration",
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

  it("parle aux écoles comme aux lycées ; l'intégration LTI 1.3 incluse avec son lien, le GAR à l'étude", () => {
    expect(TEXTE).toContain("L'arène, pour l'enseignement : lycées, BTS, écoles de commerce, universités");
    expect(TEXTE).toContain("étudiant");
    expect(TEXTE).toContain("intervenants");
    for (const a of ARGUMENTS_POUR_LES_ECOLES) expect(TEXTE, a.titre).toContain(a.titre);
    expect(TEXTE).toContain("Intégration à Moodle, Canvas, Blackboard, Brightspace (LTI 1.3) : incluse");
    expect(TEXTE).toContain("ENT du secondaire (GAR) : à l'étude");
    expect(INTEGRATION_LMS.lien.href).toBe("/integration");
    expect(ENT_DU_SECONDAIRE.etat).toBe("À l'étude");
    expect(TEXTE).not.toMatch(/bientôt disponible/i);
    // Le relevé n'est pas « par compétence » : la page ne le prétend pas.
    expect(TEXTE).not.toMatch(/relevé par compétences?/i);
    // « Entre campus » seulement sur devis : les concours ne le font pas d'eux-mêmes.
    expect(TEXTE).toMatch(/Entre plusieurs écoles ou campus : sur devis/);
  });

  it("le lieu d'hébergement n'est pas écrit (il n'est pas confirmé)", () => {
    expect(TEXTE).not.toMatch(/héberg|Francfort|Union européenne/i);
  });
});
