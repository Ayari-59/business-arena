import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import { parseScenarioConfig } from "../../src/config/scenarios/schema";
import { toursDeLaPartie, toursMaxDeLaPartie } from "../../src/config/scenarios/rounds";
import { tourDOuverture } from "../../src/config/scenarios/situation-kit";
import {
  MOIS_MAX,
  MOIS_PAR_DEFAUT,
  nomDuMois,
  PROFILS,
  tourDuTrimestre,
  trimestreDuTour,
} from "../../src/config/scenarios/calendrier-mensuel";
import type { EngineScenarioConfig, SegmentConfig } from "../../src/engine/types";
import { situationDeLaPartie } from "../../src/config/scenarios/situation-texte";
import { DEFAULT_RSE_CONFIG } from "../../src/engine/rse";

/**
 * LE CALENDRIER DES PARTIES AU MOIS (décision du propriétaire) : la saison du trimestre,
 * répartie entre ses trois mois par le profil du métier ; un mois de départ au choix ;
 * ce qui est écrit pour un trimestre au premier mois de ce trimestre ; douze mois sans
 * autre choix, dix-huit au plus.
 */

const reglages = (def: (typeof SCENARIOS)[number], extra: Record<string, unknown> = {}) => ({
  scenario: def.scenario,
  seed: 4242,
  variableWorld: false,
  level: 6,
  concurrents: 3,
  investmentStories: true,
  periodicity: "month" as const,
  ...extra,
});

/** Chaque segment simulé, avec la saison qu'il lit (la sienne, ou celle de son marché). */
const saisonsLues = (s: EngineScenarioConfig): { nom: string; saison: number[]; segment: SegmentConfig }[] => [
  ...s.market.segments.map((g) => ({ nom: g.name, saison: g.seasonality ?? s.market.seasonality, segment: g })),
  ...(s.products ?? []).flatMap((p) =>
    p.market.segments.map((g) => ({
      nom: `${p.name} · ${g.name}`,
      saison: g.seasonality ?? p.market.seasonality ?? s.market.seasonality,
      segment: g,
    })),
  ),
];

describe("les profils des métiers ne font que répartir", () => {
  it("dans chaque profil, les trois mois d'un trimestre font ensemble le trimestre", () => {
    for (const [metier, p] of Object.entries(PROFILS)) {
      const profils = { defaut: p.defaut, ...(p.segments ?? {}), ...(p.attrition ? { attrition: p.attrition } : {}) };
      for (const [nom, profil] of Object.entries(profils)) {
        expect(profil, `${metier} · ${nom}`).toHaveLength(12);
        for (let q = 0; q < 4; q += 1) {
          const somme = profil[3 * q]! + profil[3 * q + 1]! + profil[3 * q + 2]!;
          expect(somme, `${metier} · ${nom}, trimestre ${q + 1}`).toBeCloseTo(3, 9);
        }
      }
    }
  });

  it("chaque clientèle nommée dans un profil existe dans un scénario de ce métier (pas de faute de frappe)", () => {
    for (const [metier, p] of Object.entries(PROFILS)) {
      const codes = new Set(
        SCENARIOS.filter((d) => d.code.split("-")[0] === metier).flatMap((d) => saisonsLues(d.scenario).map((t) => t.segment.code)),
      );
      expect(codes.size, metier).toBeGreaterThan(0);
      for (const code of Object.keys(p.segments ?? {})) expect(codes.has(code), `${metier} · ${code}`).toBe(true);
    }
  });
});

describe("au mois, la saison d'un trimestre se répartit entre ses trois mois", () => {
  for (const def of SCENARIOS) {
    it(`${def.code} : sur dix-huit mois depuis janvier, chaque trimestre garde sa saison, et la croissance s'arrête comme au trimestre`, () => {
      const mois = composerLeScenarioJoue(reglages(def, { moisDeDepart: 1, roundsCount: MOIS_MAX }));
      const trimestre = composerLeScenarioJoue({ ...reglages(def), periodicity: "quarter" });
      expect(mois.roundsCount).toBe(MOIS_MAX);
      expect(mois.moisDeDepart).toBe(1);
      const parMois = saisonsLues(mois);
      const parTrimestre = saisonsLues(trimestre);
      expect(parMois.map((t) => t.nom)).toEqual(parTrimestre.map((t) => t.nom));
      parMois.forEach((t, i) => {
        expect(t.saison, t.nom).toHaveLength(MOIS_MAX);
        for (let q = 1; q <= MOIS_MAX / 3; q += 1) {
          const somme = t.saison[3 * q - 3]! + t.saison[3 * q - 2]! + t.saison[3 * q - 1]!;
          expect(somme, `${t.nom}, trimestre ${q}`).toBeCloseTo(3 * parTrimestre[i]!.saison[q - 1]!, 9);
        }
      });
    });
  }

  it("le cas mord : MAILLE & CO vend plus en décembre qu'en octobre, VOLT FITNESS recrute en janvier plus qu'en mars", () => {
    const maille = composerLeScenarioJoue(reglages(SCENARIOS.find((d) => d.code === "boutique")!, { moisDeDepart: 1 }));
    expect(maille.market.seasonality[11]!).toBeGreaterThan(maille.market.seasonality[9]!);
    const volt = composerLeScenarioJoue(reglages(SCENARIOS.find((d) => d.code === "fitness")!, { moisDeDepart: 1 }));
    const resolutions = volt.market.segments.find((g) => g.code === "resolutions")!.seasonality!;
    expect(resolutions[0]!).toBeGreaterThan(resolutions[2]!);
  });

  it("une partie au mois d'avant le calendrier (sans mois de départ) relit une saison de trimestre à chaque mois, comme avant", () => {
    for (const def of SCENARIOS) {
      const avant = composerLeScenarioJoue(reglages(def));
      expect("moisDeDepart" in avant, def.code).toBe(false);
      expect(avant.roundsCount, def.code).toBe(def.scenario.roundsCount);
      expect(avant.market.seasonality, def.code).toEqual(composerLeScenarioJoue({ ...reglages(def), periodicity: "quarter" }).market.seasonality);
    }
  });

  it("l'instantané relu garde le calendrier", () => {
    const def = SCENARIOS.find((d) => d.code === "bistrot")!;
    const joue = composerLeScenarioJoue(reglages(def, { moisDeDepart: 6, roundsCount: 6 }));
    const relu = parseScenarioConfig(JSON.parse(JSON.stringify(joue)));
    expect(relu.moisDeDepart).toBe(6);
    expect(relu.market.seasonality).toEqual(joue.market.seasonality);
    expect(relu.scriptedEvents).toEqual(joue.scriptedEvents);
  });
});

describe("ce qui est écrit pour un trimestre tombe au premier mois de ce trimestre", () => {
  it("le calendrier : janvier, puis un départ en juin", () => {
    expect([1, 2, 3, 4, 5, 6].map((q) => tourDuTrimestre(q, 1, 18))).toEqual([1, 4, 7, 10, 13, 16]);
    expect([1, 2, 3, 4, 5, 6].map((q) => tourDuTrimestre(q, 1, 12))).toEqual([1, 4, 7, 10, null, null]);
    // En juin, le deuxième trimestre est en cours : il ouvre au premier mois ; le premier est passé.
    expect([1, 2, 3, 4, 5].map((q) => tourDuTrimestre(q, 6, 6))).toEqual([null, 1, 2, 5, null]);
    expect([1, 2, 3, 4, 5, 6].map((t) => nomDuMois(t, 6))).toEqual(["juin", "juillet", "août", "septembre", "octobre", "novembre"]);
    expect(trimestreDuTour(8, 6)).toBe(5);
  });

  it("les événements scriptés et les étapes d'investissement : déplacés au premier mois de leur trimestre ; leur durée, comptée en mois", () => {
    for (const def of SCENARIOS) {
      const trimestre = composerLeScenarioJoue({ ...reglages(def), periodicity: "quarter" });
      const mois = composerLeScenarioJoue(reglages(def, { moisDeDepart: 1, roundsCount: MOIS_MAX }));
      expect(
        mois.scriptedEvents.map((s) => `${s.eventCode}@${s.round}`).sort(),
        def.code,
      ).toEqual(trimestre.scriptedEvents.map((s) => `${s.eventCode}@${3 * s.round - 2}`).sort());
      mois.events.forEach((e, i) => expect(e.duration, `${def.code} · ${e.code}`).toBe(3 * trimestre.events[i]!.duration));
    }
  });

  it("une situation de trimestre s'ouvre au premier mois de son trimestre ; celle de fin de partie, au dernier mois", () => {
    const bistrot = SCENARIOS.find((d) => d.code === "bistrot")!;
    const ouvertures = bistrot.situations
      .filter((s) => "round" in s.trigger)
      .map((s) => tourDOuverture(s.trigger, 6, 6, 6));
    // Juin à novembre : le trimestre 2 en juin, le 3 en juillet, le 4 en octobre.
    expect(ouvertures).toEqual([null, 1, 2, 5, null, null]);
    const nova = SCENARIOS.find((d) => d.code === "nova")!;
    const oral = nova.situations.find((s) => "round" in s.trigger && s.trigger.finDePartie)!;
    expect(tourDOuverture(oral.trigger, 12, 6, 1)).toBe(12);
  });
});

describe("la durée d'une partie au mois", () => {
  it(`${MOIS_PAR_DEFAUT} mois sans autre choix, ${MOIS_MAX} au plus ; au mois d'avant le calendrier, comme avant`, () => {
    const nova = SCENARIOS.find((d) => d.code === "nova")!.scenario;
    expect(toursDeLaPartie(nova, undefined, "month", true)).toBe(MOIS_PAR_DEFAUT);
    expect(toursMaxDeLaPartie(nova, "month", true)).toBe(MOIS_MAX);
    expect(toursDeLaPartie(nova, 40, "month", true)).toBe(MOIS_MAX);
    expect(toursDeLaPartie(nova, undefined, "month")).toBe(nova.roundsCount);
    expect(toursMaxDeLaPartie(nova, "year")).toBe(nova.roundsCount);
  });
});

describe("une situation qui raconte un tour déjà joué ne s'ouvre jamais au premier mois", () => {
  /**
   * Les tournures qui supposent un tour joué dans CETTE partie : un mois écoulé, un
   * atelier qui a plafonné, des comptes reçus, une saison finie. Une situation dont le
   * récit au mois en porte une est marquée `supposeUnTourJoue` (décision du propriétaire).
   */
  const PASSE = /écoulé|a plafonné|derniers comptes|vient de vider|est finie|a déjà progressé|renouvellements est sorti|ne s'est pas réinscrite|le mois est bénéficiaire|le résultat est bon|a dégagé un résultat|a tranché/i;

  it("chaque récit au mois qui raconte un tour joué porte la marque, et chaque marque a son récit", () => {
    for (const def of SCENARIOS) {
      for (const s of def.situations) {
        if (!("round" in s.trigger) || s.trigger.round < 2 || s.trigger.finDePartie || s.trigger.requires || s.seulementAvec) continue;
        const rendue = situationDeLaPartie(s, 30, 1);
        const raconte = PASSE.test(`${rendue.narrative} ${rendue.problem}`);
        expect(s.trigger.supposeUnTourJoue === true, `${def.code} · ${s.code} : ${rendue.narrative.slice(0, 90)}`).toBe(raconte);
      }
    }
  });

  it("pour chaque mois de départ : jamais au premier mois ; au deuxième s'il est encore dans son trimestre, sinon pas du tout", () => {
    for (const def of SCENARIOS) {
      for (const s of def.situations.filter((x) => "round" in x.trigger && x.trigger.supposeUnTourJoue)) {
        const trigger = s.trigger as { round: number; supposeUnTourJoue: true };
        for (let depart = 1; depart <= 12; depart += 1) {
          const tour = tourDOuverture(trigger, MOIS_MAX, 6, depart);
          expect(tour, `${s.code}, départ ${depart}`).not.toBe(1);
          if (tour !== null) expect(trimestreDuTour(tour, depart), `${s.code}, départ ${depart}`).toBe(trigger.round);
        }
      }
    }
    // NOVA, « Le mois écoulé est bouclé » (trimestre 2) : départ en avril, au deuxième mois
    // (mai) ; départ en juin, jamais (juillet est un autre trimestre) ; départ en janvier, avril.
    const nova = SCENARIOS.find((d) => d.code === "nova")!;
    const ecart = nova.situations.find((s) => s.code === "nova_t2_variance_decomposition")!;
    expect([4, 6, 1].map((d) => tourDOuverture(ecart.trigger, 12, 6, d))).toEqual([2, null, 4]);
  });
});

describe("les cartes RSE au mois, sur le calendrier : la même chance par an, le temps réel", () => {
  for (const def of SCENARIOS.slice(0, 4)) {
    it(`${def.code} : mauvaise presse et amende gardent leur chance annuelle ; la mauvaise presse dure trois mois, l'amende vaut un trimestre`, () => {
      const trimestre = composerLeScenarioJoue({ ...reglages(def), periodicity: "quarter" });
      const mois = composerLeScenarioJoue(reglages(def, { moisDeDepart: 6 }));
      const q = (trimestre.rse ?? DEFAULT_RSE_CONFIG).cards;
      const m = mois.rse!.cards;
      const parAn = (p: number, tours: number) => 1 - Math.pow(1 - p, tours);
      expect(parAn(m.badBuzzProbability, 12)).toBeCloseTo(parAn(q.badBuzzProbability, 4), 9);
      expect(parAn(m.sanctionProbability, 12)).toBeCloseTo(parAn(q.sanctionProbability, 4), 9);
      // Le cas mord : la chance d'un mois est sous celle d'un trimestre.
      expect(m.badBuzzProbability).toBeLessThan(q.badBuzzProbability);
      expect(m.badBuzzDuration).toBe(3 * (q.badBuzzDuration ?? 1));
      expect(m.labelDuration).toBe(3 * q.labelDuration);
      expect(m.fineAmount).toBeCloseTo(3 * q.fineAmount, 9);
      // « Pas avant le tour q » : q − 1 trimestres de jeu depuis le départ, quel que soit le mois.
      expect(m.minRound).toBe(3 * (q.minRound - 1) + 1);
      // Au trimestre, rien ne bouge.
      expect(trimestre.rse?.cards.badBuzzDuration).toBeUndefined();
    });
  }
});
