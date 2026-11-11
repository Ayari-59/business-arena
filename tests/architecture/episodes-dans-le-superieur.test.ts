import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "@/config/ateliers/referentiels";
import { couvertureDeLaFormation, formationsAvecUnePage, tableauDeCouverture } from "@/config/couverture";
import { programmeDuDiplome } from "@/config/cours/programme";
import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { FAMILLES } from "@/config/episodes/familles";
import { FICHES, LIGNE_TRANSVERSALE } from "@/config/episodes/fiches";
import {
  ANNEES_APRES_LE_BAC,
  formationDeLaLigne,
  formationOuverteAuxEpisodes,
  NIVEAU_MINIMUM_DES_EPISODES,
  PUBLIC_DES_EPISODES,
} from "@/config/episodes/public-des-episodes";
import { FORMATIONS } from "@/config/formations";
import { CATALOGUE_PAR_DEFAUT, LIBELLES_DU_DEVIS } from "@/config/tarifs";
import { suitesDuChapitre } from "@/pedagogy/cours/suites";

/**
 * LES ÉPISODES MANAGER DANS L'ENSEIGNEMENT SUPÉRIEUR, PAS AU LYCÉE (décision du propriétaire,
 * novembre 2026).
 *
 * Aucune page, aucun registre ni aucune suite n'annonce un épisode pour une formation du lycée :
 * ni le CAP, ni la seconde, ni le bac professionnel, ni le bac STMG. Le BTS est ouvert. La règle vit dans config/episodes/public-des-episodes.ts ; cette garde la vérifie à
 * chaque endroit où un épisode rencontre une formation, et recalcule elle-même ce que chaque
 * chapitre sert, pour ne pas se contenter de relire la règle.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

/**
 * Les mots d'un niveau fermé, dans un texte qui présente des épisodes. « Seconde » seule n'y est
 * pas (« une seconde demande »), ni « première » (« une matière première ») : leurs formes
 * scolaires, oui.
 */
const NIVEAU_FERME =
  /(?<!\p{L})(CAP|STMG|lycée|lycées|lycéens?|2de|seconde (?:professionnelle|générale|pro)|bac pro|baccalauréat professionnel|bac STMG|terminale STMG|première STMG)(?!\p{L})/iu;

describe("la règle : dans l'enseignement supérieur", () => {
  it("ouvre toutes les formations du supérieur du registre, et aucune du lycée", () => {
    expect(NIVEAU_MINIMUM_DES_EPISODES).toBe(1);
    for (const f of FORMATIONS) {
      const niveau = ANNEES_APRES_LE_BAC[f.optionDe ?? f.code]!;
      expect(formationOuverteAuxEpisodes(f.code), f.code).toBe(niveau >= 1);
    }
    expect(formationOuverteAuxEpisodes("bts-cg")).toBe(true);
    expect(formationOuverteAuxEpisodes("stmg")).toBe(false);
  });

  it("donne un niveau à chaque formation du registre, une option comptant pour son diplôme", () => {
    for (const f of FORMATIONS) {
      if (f.optionDe) expect(ANNEES_APRES_LE_BAC[f.code], f.code).toBeUndefined();
      else expect(ANNEES_APRES_LE_BAC[f.code], `${f.code} : sans niveau`).toBeTypeOf("number");
    }
    for (const code of Object.keys(ANNEES_APRES_LE_BAC)) expect(FORMATIONS.some((f) => f.code === code), code).toBe(true);
  });

  it("se dit en clair, sans nommer un niveau fermé", () => {
    expect(PUBLIC_DES_EPISODES).toMatch(/^Dans l'enseignement supérieur : BTS, BUT/);
    expect(PUBLIC_DES_EPISODES).not.toMatch(NIVEAU_FERME);
  });
});

describe("le registre des fiches enseignant", () => {
  it("n'annonce aucune formation fermée", () => {
    for (const fiche of FICHES)
      for (const c of fiche.formations) expect(formationOuverteAuxEpisodes(c), `${fiche.code} annonce ${c}`).toBe(true);
  });

  it("ne cite aucune ligne de programme d'une formation fermée", () => {
    for (const fiche of FICHES)
      for (const ligne of fiche.programme) {
        const code = formationDeLaLigne(ligne);
        if (code) expect(formationOuverteAuxEpisodes(code), `${fiche.code} : « ${ligne} »`).toBe(true);
        expect(ligne, `${fiche.code} : « ${ligne} »`).not.toMatch(/^(CAP|STMG|2de|Bac pro|Seconde|Terminale|Première)\b/);
      }
  });

  it("garde toutes les fiches : aucun épisode n'est retiré", () => {
    expect(FICHES.length).toBe(FAMILLES.flatMap((f) => f.episodes).length);
  });

  // Audit pédagogique du 11 novembre 2026, P2-8 : six fiches écrites pour le lycée ou le bac pro
  // perdaient, avec la règle, toutes leurs formations et toutes leurs lignes de programme ; l'enseignant
  // ne lisait plus à quoi elles servent. Une fiche sans formation ni ligne ouverte se dit transversale.
  it("dit à quoi sert chaque fiche : une ligne de programme, ou qu'elle est transversale", () => {
    const muettes = FICHES.filter((f) => f.programme.length === 0).map((f) => f.code);
    expect(muettes).toEqual([]);
    const transversales = FICHES.filter((f) => f.programme.includes(LIGNE_TRANSVERSALE)).map((f) => f.code);
    expect(transversales.sort()).toEqual(["bureau-qui-s-echauffe", "client-qui-s-en-va", "diplome-qui-compte", "libre-service-qui-perd", "lits-vides", "repit-a-creer"]);
    for (const f of FICHES.filter((x) => x.programme.includes(LIGNE_TRANSVERSALE))) expect(f.formations, f.code).toEqual([]);
  });
});

describe("la couverture et le programme d'une formation fermée", () => {
  it("ne comptent aucun épisode", () => {
    for (const f of formationsAvecUnePage().filter((x) => !formationOuverteAuxEpisodes(x.code))) {
      for (const b of couvertureDeLaFormation(f.code))
        expect(b.situations.map((s) => s.code), `${f.code} / ${b.referentiel}`).toEqual([]);
      for (const l of tableauDeCouverture(f.code).lignes)
        expect(l.couverture?.situations ?? [], `${f.code} / ${l.bloc}`).toEqual([]);
      expect(programmeDuDiplome(f.code)!.episodes, f.code).toEqual([]);
    }
  });

  it("la page du diplôme ne montre la colonne et la section des épisodes qu'à une formation ouverte", () => {
    const page = lire("src/app/parcours/[formation]/page.tsx");
    expect(page).toMatch(/formationOuverteAuxEpisodes\(code\)/);
    expect(page).toMatch(/avecEpisodes \?/);
  });
});

/** Ce qu'un chapitre sert, recalculé ici : la formation que suit son parcours, et celles dont il cite un bloc. */
function formationsServies(code: string): Set<string> {
  const situation = SITUATIONS.find((s) => s.code === code);
  const codes = situation ? situation.reprend : [code];
  const servies = new Set<string>();
  for (const c of codes) {
    const chapitre = CHAPITRES.find((x) => x.code === c);
    if (!chapitre) continue;
    const suivie = PARCOURS.find((p) => p.code === chapitre.parcours)?.formation;
    if (suivie) servies.add(suivie);
    for (const bloc of chapitre.blocs) {
      const cite = referentielDeCitation(bloc);
      if (cite) servies.add(cite.code);
    }
  }
  return servies;
}

describe("les suites d'un chapitre (« Et ensuite »)", () => {
  it("ne proposent aucun épisode à la fin d'un chapitre écrit pour les seules formations fermées", () => {
    let fermes = 0;
    for (const c of [...CHAPITRES, ...SITUATIONS]) {
      const servies = [...formationsServies(c.code)];
      if (servies.length === 0 || servies.some(formationOuverteAuxEpisodes)) continue;
      fermes++;
      const s = suitesDuChapitre(c.code);
      expect(s.episodes, `${c.code} (${servies.join(", ")})`).toEqual([]);
      expect(s.episodesDuTheme, c.code).toBe(0);
    }
    expect(fermes, "aucun chapitre fermé : la garde ne garde rien").toBeGreaterThan(0);
  });

  it("en proposent toujours à la fin d'un chapitre qui sert une formation ouverte", () => {
    for (const c of CHAPITRES) {
      if (![...formationsServies(c.code)].some(formationOuverteAuxEpisodes)) continue;
      const s = suitesDuChapitre(c.code);
      if (s.episodesDuTheme > 0) expect(s.episodes.length, c.code).toBeGreaterThan(0);
    }
  });
});

describe("les textes qui présentent les épisodes", () => {
  it("les familles du catalogue ne s'adressent à aucun niveau fermé", () => {
    for (const f of FAMILLES) expect(f.texte, f.code).not.toMatch(NIVEAU_FERME);
  });

  it("l'offre Épisodes manager ne nomme aucun niveau fermé", () => {
    for (const code of ["episodes", "entreprise"] as const) {
      expect(LIBELLES_DU_DEVIS[code].exempleOrganisation ?? "", code).not.toMatch(NIVEAU_FERME);
      const offre = CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === code)!;
      const textes = [offre.nom, offre.sousTitre, ...offre.inclus, ...(offre.formules ?? []).flatMap((x) => [x.nom, ...x.inclus])];
      for (const t of textes) expect(t, code).not.toMatch(NIVEAU_FERME);
    }
  });

  it("les pages des épisodes en classe disent le public, et ne lisent que le registre filtré", () => {
    for (const chemin of ["src/app/enseignants/episodes/page.tsx", "src/app/enseignants/episodes/[code]/page.tsx"]) {
      const page = lire(chemin);
      expect(page, chemin).toMatch(/PUBLIC_DES_EPISODES|DANS_LE_SUPERIEUR/);
      expect(page, chemin).not.toMatch(/FICHES_ECRITES/);
    }
  });
});
