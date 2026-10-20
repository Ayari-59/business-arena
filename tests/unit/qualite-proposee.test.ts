import { describe, expect, it } from "vitest";
import { SCENARIOS, SCENARIO_FAMILIES, type ScenarioDefinition } from "@/config/scenarios/registry";
import { avecLaQualiteProposeeDe, composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { aLaMesureDuNiveau, botDecisions, neutralDecisions, PART_DE_QUALITE_NEUTRE, type BotProfile } from "@/engine/bots";
import { decisionDeLaGestionNeutre } from "@/pedagogy/merite/etalons";
import { decisionDeReference } from "@/pedagogy/merite/reference";
import { difficulteDeLaGraine } from "@/pedagogy/examen/lot";
import { toGamme } from "@/engine/gamme";
import { fallbackDecisions } from "@/services/decision.service";
import { avecLaQualiteProposee, proposedDecisionsFor, startingDecisionsFor } from "@/services/decision-baseline";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";

/**
 * LA QUALITÉ PROPOSÉE VIENT DE LA DONNÉE DU SCÉNARIO, ET LA GESTION NEUTRE N'EN
 * DÉPEND PAS.
 *
 * Décision du propriétaire : le formulaire propose zéro qualité partout, sauf au
 * bistrot mono-produit, où il garde la part de la gestion neutre. Le prix ne
 * change pas. La valeur est un champ du scénario (`qualiteProposee`,
 * engine/types.ts, où se lit la mesure qui la fonde), figé dans l'instantané ;
 * l'étalon de l'examen, le bon gestionnaire du mérite et les concurrents
 * pilotés continuent de jouer `neutralDecisions`, sans le lire.
 */

/** La décision du propriétaire, scénario par scénario. */
const QUALITE_PROPOSEE: Record<string, number> = {
  nova: 0,
  "nova-gamme": 0,
  boutique: 0,
  "boutique-mono": 0,
  hotel: 0,
  "hotel-gamme": 0,
  bistrot: 0.5,
  "bistrot-gamme": 0,
  conseil: 0,
  "conseil-gamme": 0,
  ecommerce: 0,
  "ecommerce-gamme": 0,
  fitness: 0,
  batiment: 0,
  transport: 0,
};

/** Le niveau où la variante se joue : la gamme à partir du niveau de sa famille, le mono-produit au niveau 2. */
const niveauDe = (code: string) => SCENARIO_FAMILIES.find((f) => f.gamme === code && f.mono !== code)?.gammeFromLevel ?? 2;

/** L'instantané d'une partie créée aujourd'hui (`createGameCore`), relu comme la clôture le relit. */
function instantane(def: ScenarioDefinition, niveau: number): EngineScenarioConfig {
  const compose = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: 4_242,
    variableWorld: true,
    level: niveau,
    concurrents: 3,
    periodicity: "quarter",
    investmentStories: true,
    concurrentsAssainis: true,
  });
  return parseScenarioConfig(JSON.parse(JSON.stringify(compose)));
}

const ouverture = (def: ScenarioDefinition, id = "a-equipe", profil?: BotProfile): CompanyState =>
  applyPeriodicityToCompany(def.company(id, def.playerTeamName, profil ? "bot" : "human", profil), "quarter", {
    abonnement: def.scenario.subscription !== undefined,
  });

/** Une partie d'avant le champ : son instantané ne le porte pas. */
const sansLeChamp = (s: EngineScenarioConfig): EngineScenarioConfig => {
  const { qualiteProposee: _q, ...reste } = s;
  void _q;
  return reste;
};

/** La décision sans ses budgets qualité : ce qui ne doit pas bouger avec la qualité proposée. */
const horsQualite = (d: RoundDecisions) => ({
  ...d,
  qualityBudget: null,
  products: Object.fromEntries(Object.entries(d.products ?? {}).map(([c, p]) => [c, { ...p, qualityBudget: null }])),
});

describe("la qualité proposée est une donnée de chaque scénario", () => {
  it("les quinze scénarios du registre la posent, à la valeur décidée", () => {
    expect(Object.fromEntries(SCENARIOS.map((d) => [d.code, d.scenario.qualiteProposee]))).toEqual(QUALITE_PROPOSEE);
  });

  for (const def of SCENARIOS) {
    const niveau = niveauDe(def.code);
    const part = QUALITE_PROPOSEE[def.code]!;
    const leviers = presetByLevel.get(niveau as 1 | 2 | 3 | 4 | 5 | 6)!.decisions;

    describe(`${def.code}, niveau ${niveau}`, () => {
      const snapshot = instantane(def, niveau);
      const etat = ouverture(def);

      it("l'instantané de la partie la garde, relu par la porte du moteur", () => {
        expect(leviers.quality).toBe(true);
        expect(snapshot.qualiteProposee).toBe(part);
      });

      it("le formulaire la propose au départ, et rien d'autre ne bouge", () => {
        const proposee = startingDecisionsFor(snapshot, etat, 1, leviers);
        const avant = startingDecisionsFor(sansLeChamp(snapshot), etat, 1, leviers);
        expect(horsQualite(proposee)).toEqual(horsQualite(avant));
        if (part === 0) {
          expect(proposee.qualityBudget).toBe(0);
          for (const p of Object.values(proposee.products ?? {})) expect(p.qualityBudget ?? 0).toBe(0);
        } else {
          // La part de la gestion neutre : la proposition d'avant, au bit près.
          expect(proposee).toEqual(avant);
          expect(proposee.qualityBudget).toBeGreaterThan(0);
        }
        // Elle vient bien de la donnée : une autre part, une autre qualité proposée.
        const autre = startingDecisionsFor({ ...snapshot, qualiteProposee: 0.25 }, etat, 1, leviers);
        expect(horsQualite(autre)).toEqual(horsQualite(avant));
        const n = Math.max(1, Object.keys(avant.products ?? {}).length);
        expect(Math.abs(autre.qualityBudget - avant.qualityBudget / 2)).toBeLessThanOrEqual(n);
      });

      it("sans état persisté, la même part de qualityScale", () => {
        const d = startingDecisionsFor(snapshot, undefined, 1, leviers);
        const total = Object.values(d.products ?? {}).reduce((t, p) => t + (p.qualityBudget ?? 0), 0);
        const attendu = part * snapshot.production.qualityScale;
        const n = Math.max(1, toGamme(snapshot).length);
        expect(Math.abs((d.products ? total : d.qualityBudget) - attendu)).toBeLessThanOrEqual(n);
      });

      it("l'équipe absente du premier tour reçoit la qualité que le formulaire lui aurait proposée", () => {
        const absente = fallbackDecisions(snapshot, etat, 1, leviers);
        const neutre = neutralDecisions({ scenario: snapshot, state: etat, roundIndex: 1, leviers });
        expect(absente.qualityBudget).toBeCloseTo((neutre.qualityBudget * part) / PART_DE_QUALITE_NEUTRE, 6);
        expect(horsQualite(absente)).toEqual(
          horsQualite({ ...neutre, finance: { ...(neutre.finance ?? {}), newLoan: 0, loanRepayment: 0 } }),
        );
      });

      it("l'étalon de l'examen et les concurrents ne la lisent pas", () => {
        const ctx = (s: EngineScenarioConfig, id = "a-equipe", profil?: BotProfile) => ({
          scenario: s,
          state: ouverture(def, id, profil),
          roundIndex: 1,
          leviers,
        });
        const mondes = [snapshot, sansLeChamp(snapshot), { ...snapshot, qualiteProposee: 2 }];
        const lu = (s: EngineScenarioConfig) => ({
          neutre: neutralDecisions(ctx(s)),
          etalon: decisionDeLaGestionNeutre(ctx(s), leviers),
          concurrents: def.bots.map((b) => botDecisions(b.profile as BotProfile, ctx(s, b.id, b.profile as BotProfile))),
        });
        const reference = lu(sansLeChamp(snapshot));
        for (const s of mondes) expect(lu(s)).toEqual(reference);
        // Et la gestion neutre garde sa qualité, là où le formulaire n'en propose pas.
        expect(reference.etalon.qualityBudget).toBeGreaterThan(0);
      });

      it("le bon gestionnaire du mérite part de la qualité que le formulaire propose, et de rien d'autre", () => {
        // Décision du propriétaire : garder le formulaire tel quel ne doit pas suffire à
        // battre le bon gestionnaire. Sans le champ, il garde la qualité neutre (une
        // partie d'avant ne change pas de verdict) ; avec, il suit la proposition.
        const ctx = (s: EngineScenarioConfig) => ({ scenario: s, state: ouverture(def), roundIndex: 1, leviers });
        const avant = decisionDeReference(ctx(sansLeChamp(snapshot)), leviers);
        const apres = decisionDeReference(ctx(snapshot), leviers);
        const proposee = avecLaQualiteProposee(snapshot, neutralDecisions(ctx(snapshot)));
        const qualite = (d: RoundDecisions) => [d.qualityBudget, ...Object.values(d.products ?? {}).map((p) => p.qualityBudget)];
        if (leviers.quality) expect(qualite(apres)).toEqual(qualite(aLaMesureDuNiveau(proposee, leviers, neutralDecisions(ctx(snapshot)))));
        // Rien d'autre que la qualité ne bouge.
        const sansQualite = (d: RoundDecisions) => {
          const c = structuredClone(d) as RoundDecisions;
          c.qualityBudget = 0;
          for (const p of Object.values(c.products ?? {})) if (p.qualityBudget !== undefined) p.qualityBudget = 0;
          return c;
        };
        expect(sansQualite(apres)).toEqual(sansQualite(avant));
      });
    });
  }
});

describe("ce que la qualité proposée ne touche pas", () => {
  const nova = SCENARIOS.find((d) => d.code === "nova")!;
  const snapshot = instantane(nova, 2);
  const etat = ouverture(nova);

  it("un levier qualité fermé (niveau 1) garde la valeur neutre du champ caché", () => {
    const n1 = presetByLevel.get(1)!.decisions;
    expect(n1.quality).toBe(false);
    const neutre = neutralDecisions({ scenario: snapshot, state: etat, roundIndex: 1 });
    expect(snapshot.qualiteProposee).toBe(0);
    expect(startingDecisionsFor(snapshot, etat, 1, n1).qualityBudget).toBe(Math.round(neutre.qualityBudget));
    expect(startingDecisionsFor(snapshot, undefined, 1, n1).qualityBudget).toBe(
      Math.round(PART_DE_QUALITE_NEUTRE * snapshot.production.qualityScale),
    );
    expect(fallbackDecisions(snapshot, etat, 1, n1).qualityBudget).toBe(
      neutralDecisions({ scenario: snapshot, state: etat, roundIndex: 1, leviers: n1 }).qualityBudget,
    );
  });

  it("une partie d'avant le champ garde la proposition de sa création", () => {
    const n2 = presetByLevel.get(2)!.decisions;
    const ancien = sansLeChamp(snapshot);
    const neutre = neutralDecisions({ scenario: ancien, state: etat, roundIndex: 1 });
    expect(startingDecisionsFor(ancien, etat, 1, n2).qualityBudget).toBe(Math.round(neutre.qualityBudget));
    expect(neutre.qualityBudget).toBeGreaterThan(0);
    // Le parse ne l'invente pas.
    expect("qualiteProposee" in parseScenarioConfig(JSON.parse(JSON.stringify(ancien)))).toBe(false);
  });

  it("le rejeu du bilan recompose le monde avec la qualité proposée de l'instantané joué", () => {
    const composer = (s: EngineScenarioConfig) =>
      composerLeScenarioJoue({
        scenario: s,
        seed: 77,
        variableWorld: true,
        level: 2,
        concurrents: 3,
        periodicity: "quarter",
        investmentStories: true,
        concurrentsAssainis: true,
      });
    // Une partie d'avant : recomposée SANS le champ, son monde d'une autre graine
    // est celui d'avant, et sa graine jouée retrouve son instantané.
    const avant = avecLaQualiteProposeeDe(nova.scenario, {});
    expect("qualiteProposee" in composer(avant)).toBe(false);
    expect(composer(avant)).toEqual(sansLeChamp(composer(nova.scenario)));
    // Une partie qui la porte : la sienne, même si le registre a changé depuis.
    expect(composer(avecLaQualiteProposeeDe(nova.scenario, { qualiteProposee: 0.5 })).qualiteProposee).toBe(0.5);
    expect(composer(avecLaQualiteProposeeDe(nova.scenario, { qualiteProposee: 0 })).qualiteProposee).toBe(0);
  });

  it("une référence de la gamme tout juste lancée reçoit la qualité proposée du départ", () => {
    const def = SCENARIOS.find((d) => d.code === "nova-gamme")!;
    const s = instantane(def, 4);
    const leviers = presetByLevel.get(4)!.decisions;
    const ouvertureGamme = ouverture(def);
    const depart = startingDecisionsFor(s, ouvertureGamme, 1, leviers);
    const [lancee, ...autres] = Object.keys(depart.products!);
    const precedente: RoundDecisions = {
      ...depart,
      products: {
        ...depart.products,
        [lancee!]: { ...depart.products![lancee!]!, productionPlan: 0, marketingBudget: 0, qualityBudget: 0 },
        ...Object.fromEntries(autres.map((c) => [c, { ...depart.products![c]!, qualityBudget: 1_234 }])),
      },
    };
    const marche = Object.fromEntries(
      toGamme(s).flatMap((p) => p.market.segments.map((seg) => [seg.code, { sold: 500, lost: 0 }])),
    );
    const arg = { state: ouvertureGamme, roundIndex: 2, previousPayload: precedente, lastMarket: marche, leviers };
    const d = proposedDecisionsFor({ ...arg, snapshot: { ...s, qualiteProposee: 0.25 } });
    const departAutre = startingDecisionsFor({ ...s, qualiteProposee: 0.25 }, ouvertureGamme, 2, leviers);
    expect(d.products![lancee!]!.qualityBudget).toBe(departAutre.products![lancee!]!.qualityBudget);
    expect(d.products![lancee!]!.qualityBudget).toBeGreaterThan(0);
    // Les références déjà au marché reconduisent la décision de l'équipe.
    for (const c of autres) expect(d.products![c]!.qualityBudget).toBe(1_234);
  });
});

describe("l'examen ne bouge pas avec la qualité proposée", () => {
  it("la difficulté d'une graine du lot est la même, que le scénario porte le champ ou non", () => {
    for (const code of ["nova", "bistrot", "hotel-gamme"]) {
      const def = SCENARIOS.find((d) => d.code === code)!;
      const reglages = (s: EngineScenarioConfig) => ({
        definition: { ...def, scenario: s },
        niveau: niveauDe(code),
        tours: def.scenario.roundsCount,
        bots: 2,
        periodicite: "quarter" as const,
      });
      const sans = difficulteDeLaGraine(reglages(sansLeChamp(def.scenario)), 31_337);
      expect(difficulteDeLaGraine(reglages(def.scenario), 31_337)).toEqual(sans);
      expect(difficulteDeLaGraine(reglages({ ...def.scenario, qualiteProposee: 2 }), 31_337)).toEqual(sans);
    }
  });
});
