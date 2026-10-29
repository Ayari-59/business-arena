import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
// Le bilan envoie la partie au serveur dans un effet : au rendu statique, rien ne part.
vi.mock("@/app/entreprises/episode/actions", () => ({ enregistrerPartieAction: vi.fn() }));

import { FICHES } from "@/config/episodes/fiches";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { CATALOGUE_PAR_DEFAUT, LES_OFFRES_DE_L_ARENE, variablesDuCatalogue } from "@/config/tarifs";
import { vueDesTarifs } from "@/config/catalogue";
import type { PartieJouee } from "@/config/episodes/types";
import { construireProfil } from "@/pedagogy/profil/profil";
import { apercuDuProfil, MENTION_DE_L_APERCU } from "@/pedagogy/profil/apercu";
import { RetourDeLEpisode } from "@/components/episode/retour-de-l-episode";

/**
 * LES PROMESSES COMMERCIALES DE L'AUDIT (produit.md, P0-1 à P0-3 et P1-11), TENUES.
 *
 *  · P0-1 : « le guide de débrief des 113 épisodes » et « chaque épisode a son guide de
 *    débrief » : chaque épisode du registre a sa fiche, et le nombre affiché vient du
 *    registre des fiches (variable `{fiches}`), jamais d'un nombre écrit ;
 *  · P0-2 : une démonstration jouée sans licence, en Découverte, ne compte pas dans le
 *    profil ; le bilan en montre un aperçu calculé sur la partie seule, avec la mention
 *    « avec une licence, chaque épisode enrichit votre profil », et aucune page ne promet
 *    plus qu'une démonstration construit le profil ;
 *  · P0-3 : la page « établissement sans offre » ne promet plus de partie de classe ;
 *  · P1-11 : les prestations humaines (lancement, débrief animé, cohorte de quinze
 *    managers) sont sur devis, pas incluses ; la progression se dit comme le profil la
 *    calcule (les premiers épisodes face aux plus récents).
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ");

const FORMULES = CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === "entreprise")!.formules;
const VUE = vueDesTarifs(CATALOGUE_PAR_DEFAUT, variablesDuCatalogue(), { prix: false });

describe("P0-1 : le guide de débrief des épisodes", () => {
  it("chaque épisode du registre a sa fiche, et sa page de fiche", () => {
    const avecFiche = new Set(FICHES.map((f) => f.code));
    expect(EPISODES.filter((e) => !avecFiche.has(e.code)).map((e) => e.code)).toEqual([]);
    // La page de chaque fiche se lit par son code, et la liste les range toutes.
    const page = lire("app/enseignants/episodes/[code]/page.tsx");
    expect(page).toMatch(/ficheParCode\(code\)/);
    expect(lire("app/enseignants/episodes/page.tsx")).toMatch(/FICHES\.map/);
    expect(lire("app/sitemap.ts")).toMatch(/FICHES\.map/);
  });

  it("le nombre du guide vient du registre des fiches, pas de celui des épisodes", () => {
    expect(variablesDuCatalogue().fiches).toBe(String(FICHES.length));
    const guide = FORMULES.flatMap((f) => f.inclus).find((l) => /guide de débrief/.test(l));
    expect(guide).toBe("Le guide de débrief des {fiches} épisodes.");
    expect(JSON.stringify(VUE)).toContain(`Le guide de débrief des ${FICHES.length} épisodes.`);
  });

  it("/ecoles tire le nombre des fiches du registre et dit où les lire", () => {
    const ecoles = lire("app/ecoles/page.tsx");
    expect(ecoles).toMatch(/chaque épisode a son guide de débrief[^`]*\$\{FICHES\.length\} fiches/);
    expect(ecoles).toMatch(/Épisodes en classe/);
  });
});

/** Une partie de démonstration, au niveau où elle se joue sans licence. */
function partieDeDemo(code: string, niveau: PartieJouee["niveau"] = "decouverte"): PartieJouee {
  const ep = EPISODES.find((e) => e.code === code)!;
  return {
    graine: 7,
    chemin: ep.neutre.map((n) => n),
    consultes: ep.etapes.map((e) => e.sources.slice(0, 1).map((s) => s.id)),
    jours: ep.enquete.joursSansPerte,
    diagnostic: ep.diagnostics[0]!.id,
    reevaluation: { choix: "maintient", principal: null },
    prevision: ep.prevision.min,
    confiance: 60,
    niveau,
  };
}

describe("P0-2 : l'aperçu du profil d'une démonstration", () => {
  it("donne les axes du profil sur la partie seule, que le profil, lui, ignore", () => {
    for (const code of EPISODES_DE_DEMO) {
      const ep = EPISODES.find((e) => e.code === code)!;
      const partie = partieDeDemo(code);
      const enregistree = { id: "a", code, versionModele: 1, date: "2026-10-28", premiere: true, partie };
      // La Découverte ne compte pas : le profil reste vide.
      expect(construireProfil([enregistree]).comptees, code).toHaveLength(0);
      const apercu = apercuDuProfil(ep, partie);
      expect(apercu.competences.length, code).toBeGreaterThan(0);
      expect(apercu.competences.some((l) => l.score != null), code).toBe(true);
      for (const l of apercu.competences) {
        if (l.score != null) expect(l.score).toBeGreaterThanOrEqual(0);
        if (l.score != null) expect(l.score).toBeLessThanOrEqual(100);
        expect(l.preuve.length, `${code} ${l.competence.code}`).toBeGreaterThan(0);
      }
      // Les mêmes calculs que le profil : la même partie, comptée en Standard, dit la même robustesse.
      const compte = construireProfil([{ ...enregistree, partie: { ...partie, niveau: "standard" } }]);
      expect(compte.comptees, code).toHaveLength(1);
      expect(apercu.robustesse.phrase, code).toBe(compte.robustesse.phrase);
      expect(apercu.risque.phrase, code).toBe(compte.risque.phrase);
    }
  });

  it("le bilan d'une démonstration sans licence montre l'aperçu et la mention ; pas avec une licence", () => {
    const code = EPISODES_DE_DEMO[0]!;
    const ep = EPISODES.find((e) => e.code === code)!;
    const rendu = (sansLicence: boolean, niveau: PartieJouee["niveau"]) =>
      texte(
        renderToStaticMarkup(
          createElement(RetourDeLEpisode, { ep, partie: partieDeDemo(code, niveau), cle: null, sansLicence }),
        ),
      );
    const demo = rendu(true, "decouverte");
    expect(demo).toContain("Aperçu de votre profil décisionnel");
    expect(demo).toContain(MENTION_DE_L_APERCU);
    expect(MENTION_DE_L_APERCU).toBe("Avec une licence, chaque épisode enrichit votre profil.");
    expect(rendu(false, "decouverte")).not.toContain("Aperçu de votre profil décisionnel");
    expect(rendu(true, "standard")).not.toContain("Aperçu de votre profil décisionnel");
  });

  it("la page d'épisode transmet la licence au bilan", () => {
    expect(lire("app/entreprises/episode/[code]/page.tsx")).toMatch(/licence=\{licencePourLEpisode\(acces, code\)\}/);
    expect(lire("components/episode/episode-joue.tsx")).toMatch(/sansLicence=\{!licence\}/);
    expect(lire("components/episode/bilan-de-l-episode.tsx")).toMatch(/sansLicence=\{sansLicence\}/);
  });

  it("aucune page ne promet sans condition qu'une démonstration construit le profil", () => {
    const liste = lire("app/entreprises/episode/page.tsx");
    expect(liste).not.toMatch(/Démonstration :\s+données fictives ; vos choix sont gardés/);
    expect(liste).toMatch(/acces\.licence \|\|/);
    expect(liste).toMatch(/Avec une licence, chaque épisode enrichit votre profil\./);
    const intro = lire("components/episode/episode-joue.tsx");
    expect(intro).toMatch(/!licence && niveaux\.every\(\(n\) => n === "decouverte"\)/);
    expect(intro).toMatch(/la Découverte ne compte pas dans le profil/);
  });
});

describe("P0-3 : l'établissement sans offre", () => {
  it("ne promet que le gratuit, et dit que les parties de classe demandent une licence de l'arène", () => {
    const page = lire("app/etablissement/sans-offre/page.tsx");
    expect(page).not.toMatch(/et les\s+parties dont vous leur donnez le code/);
    expect(page).toMatch(/Les parties de classe, [^.]*demandent une\s+licence de l&apos;arène/);
    expect(page).toMatch(/\{LES_OFFRES_DE_L_ARENE\}/);
    expect(LES_OFFRES_DE_L_ARENE).toMatch(/Classe.*Programme.*Campus/);
  });
});

describe("P1-11 : les prestations humaines, sur devis", () => {
  it("aucune ligne n'annonce le lancement, le débrief animé ou la taille de cohorte comme inclus", () => {
    const lignes = FORMULES.flatMap((f) => f.inclus);
    for (const l of lignes.filter((x) => /demi-journée|débrief animé|\{managers\}/.test(x))) {
      expect(l).toMatch(/^Sur devis : /);
    }
    expect(lignes.some((l) => /demi-journée de lancement/.test(l))).toBe(true);
    expect(JSON.stringify(VUE)).toContain("Sur devis : une cohorte de 15 managers");
  });

  it("la migration aligne le catalogue en base, et /ecoles dit la progression comme le profil la calcule", () => {
    const sql = readFileSync(join(process.cwd(), "drizzle/0051_prestations_sur_devis.sql"), "utf8");
    for (const l of FORMULES.flatMap((f) => f.inclus)) expect(sql).toContain(l.replace(/'/g, "''"));
    const ecoles = lire("app/ecoles/page.tsx");
    expect(ecoles).not.toMatch(/épisode de contrôle/);
    expect(ecoles).toMatch(/compare les premiers épisodes joués aux plus récents/);
  });
});
