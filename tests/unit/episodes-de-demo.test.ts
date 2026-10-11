import { describe, expect, it, vi } from "vitest";

// Le contrôle d'entrée des parties vit dans un service : la base n'y sert pas ici.
vi.mock("@/db", () => ({ db: {} }));

import {
  EPISODES_DE_DEMO,
  NIVEAU_DES_DEMOS,
  episodeOuvert,
  estUneDemo,
  niveauxDeLEpisode,
  type AccesAuxEpisodes,
} from "../../src/config/episodes/demos";
import { FAMILLES, SECTEURS } from "../../src/config/episodes/familles";
import {
  budgetDEnquete,
  niveauParCode,
  sourcesProposees,
} from "../../src/config/episodes/niveaux";
import { effetDuChoix } from "../../src/pedagogy/episodes/retour-immediat";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODES, episodeParCode } from "../../src/pedagogy/episodes/registre";
import { observer } from "../../src/pedagogy/profil/observations";
import { construireProfil } from "../../src/pedagogy/profil/profil";
import { entreeDePartie } from "../../src/services/episode-parties.service";
import type { PartieJouee } from "../../src/config/episodes/types";
import type { PartieEnregistree } from "../../src/pedagogy/profil/types";

/**
 * LES ÉPISODES DE DÉMONSTRATION : un par métier, tous jouables en Découverte.
 *
 * Sans licence, ce sont les seuls épisodes qui se lancent, et au seul niveau
 * Découverte. La liste se change en un endroit (config/episodes/demos.ts) ; ce test
 * garde ce que la décision exige d'elle.
 */

const secteurDe = (code: string) => FAMILLES.find((f) => f.episodes.includes(code))?.secteur;
const decouverte = niveauParCode(NIVEAU_DES_DEMOS);

describe("la liste des démonstrations", () => {
  it("compte un épisode par métier, et pas un de plus", () => {
    expect(EPISODES_DE_DEMO.length).toBe(SECTEURS.length);
    expect(new Set(EPISODES_DE_DEMO.map(secteurDe))).toEqual(new Set(SECTEURS.map((s) => s.code)));
  });

  it("ne désigne que des épisodes du registre", () => {
    for (const code of EPISODES_DE_DEMO) expect(episodeParCode(code), code).toBeDefined();
    expect(EPISODES.filter((e) => estUneDemo(e.code)).length).toBe(EPISODES_DE_DEMO.length);
  });

  it("se joue au niveau Découverte", () => {
    expect(NIVEAU_DES_DEMOS).toBe("decouverte");
    expect(decouverte.code).toBe("decouverte");
  });
});

describe("chaque démonstration se joue de bout en bout en Découverte", () => {
  for (const code of EPISODES_DE_DEMO) {
    it(code, () => {
      const ep = episodeParCode(code)!;
      // La première décision a de quoi enquêter, et son temps d'enquête ; chaque décision
      // a un vrai choix. (Une décision suivante peut n'avoir rien à vérifier : c'est
      // l'épisode, à tous les niveaux.)
      expect(sourcesProposees(decouverte, ep.etapes[0]!).length, `${code} sources`).toBeGreaterThan(0);
      for (const etape of ep.etapes) {
        expect(etape.options.length, `${code} options`).toBeGreaterThan(1);
      }
      const budget = budgetDEnquete(decouverte, ep, ep.etapes[0]!);
      if (ep.etapes[0]!.budget != null) expect(budget).toBeGreaterThan(0);
      // Chaque chemin de référence, sous plusieurs hasards : le retour immédiat de la
      // Découverte se calcule à chaque décision, le tableau de bord se lit à chaque
      // semaine, le bilan et les observations du profil acceptent la partie.
      for (const ref of ep.references) {
        for (const graine of [1, 7, 4242]) {
          for (let d = 0; d < ep.etapes.length; d += 1) {
            const effet = effetDuChoix(ep, ref.chemin, d, graine, 1);
            if (effet) expect(Number.isFinite(effet.ecart), `${code} D${d + 1}`).toBe(true);
            const lecture = ep.lire(ref.chemin.slice(0, d + 1), graine, 1, ep.etapes[d]!.jusqua);
            expect(lecture, `${code} lecture D${d + 1}`).toBeTruthy();
          }
          expect(Array.isArray(ep.imprevus(graine))).toBe(true);
          const partie: PartieJouee = {
            graine,
            chemin: ref.chemin,
            consultes: ep.etapes.map(() => []),
            jours: 1,
            diagnostic: ep.diagnostics[0]!.id,
            reevaluation: { choix: "maintient", principal: null },
            prevision: ep.prevision.min,
            confiance: 60,
            niveau: "decouverte",
          };
          expect(analyser(ep, partie).decisions.length).toBe(ep.etapes.length);
          expect(observer(ep, partie).observations.length, code).toBeGreaterThan(0);
          // Le serveur garde la partie : elle passe le contrôle d'entrée.
          const lu = entreeDePartie.safeParse({
            ...partie,
            cle: "00000000-0000-4000-8000-000000000000",
            code,
          });
          expect(lu.success, code).toBe(true);
        }
      }
    });
  }
});

describe("ce qui se lance, selon la licence", () => {
  const sans: AccesAuxEpisodes = { licence: false, source: null };
  const avec: AccesAuxEpisodes = { licence: true, source: "compte" };

  it("sans licence : les démonstrations, en Découverte seulement ; les autres, rien", () => {
    for (const ep of EPISODES) {
      if (estUneDemo(ep.code)) {
        expect(niveauxDeLEpisode(sans, ep.code)).toEqual(["decouverte"]);
        expect(episodeOuvert(sans, ep.code, "standard")).toBe(false);
      } else {
        expect(niveauxDeLEpisode(sans, ep.code), ep.code).toEqual([]);
        expect(episodeOuvert(sans, ep.code)).toBe(false);
      }
    }
  });

  it("avec licence : tous les épisodes, à tous les niveaux", () => {
    for (const ep of EPISODES) {
      expect(niveauxDeLEpisode(avec, ep.code)).toEqual(["decouverte", "standard", "expert"]);
    }
  });

  it("sans licence, le profil ne recommande que des démonstrations", () => {
    const partie = (code: string, i: number): PartieEnregistree => {
      const ep = episodeParCode(code)!;
      return {
        id: `p${i}`,
        code,
        versionModele: 1,
        date: `2026-10-0${i + 1}T10:00:00.000Z`,
        premiere: true,
        partie: {
          graine: 7,
          chemin: ep.references[0]!.chemin,
          consultes: ep.etapes.map(() => []),
          jours: 1,
          diagnostic: ep.diagnostics[0]!.id,
          reevaluation: { choix: "maintient", principal: null },
          prevision: ep.prevision.min,
          confiance: 60,
          niveau: "standard",
        },
      };
    };
    // Un profil établi (des parties en Standard, jouées sous licence auparavant) : la
    // recommandation, sans licence, ne sort plus des démonstrations.
    const parties = ["trimestre-qui-derape", "equipe-qui-s-epuise", "depot-qui-deborde"].map(
      partie,
    );
    const ouvert = (code: string) => episodeOuvert(sans, code);
    for (const objectif of [null, "R2", "R5"] as const) {
      const profil = construireProfil(parties, undefined, { objectif, proposables: ouvert });
      for (const r of profil.recommandations) expect(estUneDemo(r.code), r.code).toBe(true);
      for (const l of profil.competences)
        for (const c of l.ouLObserver) expect(estUneDemo(c), c).toBe(true);
    }
    // Sans aucune partie : le bilan d'entrée, réduit à ce qui se lance.
    const vide = construireProfil([], undefined, { proposables: ouvert });
    expect(vide.recommandations.map((r) => r.code).every(estUneDemo)).toBe(true);
    expect(vide.recommandations.length).toBeGreaterThan(0);
  });
});
