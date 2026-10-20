import { describe, expect, it } from "vitest";
import { SCENARIOS, SCENARIO_FAMILIES, scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { leviersFigesDuProfil, presetByLevel, profilDuNiveau, type DifficultyPreset } from "@/config/difficulty";
import { botDecisions, botPersonalityFromSeed, PART_DE_QUALITE_NEUTRE, soldByProduct, type BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import { simulateRound } from "@/engine/simulation";
import { proposedDecisionsFor } from "@/services/decision-baseline";
import type { CompanyRoundResult, CompanyState, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * LA MESURE QUI FONDE LA QUALITÉ PROPOSÉE (`qualiteProposee`, engine/types.ts).
 *
 * Une partie solo comme `createSoloGame` la crée : l'équipe et deux concurrents,
 * le pipeline de création (monde variable, niveau, histoires d'investissement,
 * concurrents assainis), les leviers figés du niveau ; à la clôture, les
 * concurrents reçoivent leurs ventes, le prix de l'équipe et leur personnalité,
 * comme `round-resolution.service.ts` les leur passe. L'équipe valide à chaque
 * tour ce que le formulaire lui propose, sur l'horizon d'une vraie partie (le
 * nombre de tours du scénario). Deux parties par graine, qui ne diffèrent que
 * par la donnée : la qualité proposée du scénario, et l'ancienne, la part de la
 * gestion neutre.
 *
 * Ce que la décision du propriétaire affirme :
 *   · là où le formulaire propose zéro, l'ancien budget ne fait pas mieux que
 *     zéro, en moyenne sur les graines ;
 *   · au bistrot mono-produit, où la part neutre est gardée, elle fait au
 *     moins aussi bien que zéro ;
 *   · à la salle de sport, cas limite, l'écart reste négligeable : sous un
 *     centième du résultat cumulé à qualité nulle. Le signe de l'écart y
 *     change d'une graine à l'autre, et d'un horizon à l'autre : une garde sur
 *     son signe clignoterait au premier recalibrage sans rien dire du jeu. Un
 *     centième du résultat ne départage aucune stratégie qu'un élève puisse
 *     lire, et la graine seule déplace bien davantage.
 *
 * En moyenne et non graine par graine : à l'hôtel et au bistrot en gamme,
 * l'écart d'une graine isolée frôle zéro, alors que la moyenne est nette.
 */

const GRAINES = [11, 2_027, 90_001, 424_242, 777_777, 31_415];

const niveauDe = (code: string) => SCENARIO_FAMILIES.find((f) => f.gamme === code && f.mono !== code)?.gammeFromLevel ?? 2;
const vendu = (r: CompanyRoundResult) =>
  Object.values(r.market.bySegment).reduce((t, x) => t + x.sold, 0) + (r.subscription?.retained ?? 0);

/** Le résultat net cumulé de l'équipe qui valide la proposition, sous une qualité proposée donnée. */
function partieSolo(code: string, graine: number, qualiteProposee: number): number {
  const def = scenarioByCode(code);
  const niveau = niveauDe(code);
  const preset = presetByLevel.get(niveau as DifficultyPreset["level"])!;
  const leviers = leviersFigesDuProfil({ difficulty: profilDuNiveau(preset) });
  const plafonne = investissementPlafonne(preset.decisions);
  const scenario = {
    ...composerLeScenarioJoue({
      scenario: def.scenario,
      seed: graine,
      variableWorld: true,
      level: niveau,
      concurrents: 3,
      periodicity: "quarter",
      investmentStories: true,
      concurrentsAssainis: true,
    }),
    qualiteProposee,
  };
  const equipes = [
    { id: "a-equipe", nom: def.playerTeamName, profil: undefined as BotProfile | undefined },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b${i}`, nom: b.name, profil: b.profile as BotProfile })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    applyPeriodicityToCompany(def.company(e.id, e.nom, e.profil ? "bot" : "human", e.profil), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  let precedente: RoundDecisions | null = null;
  let cumul = 0;
  for (let tour = 1; tour <= scenario.roundsCount; tour += 1) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const e of equipes) {
      const etat = etats.find((x) => x.id === e.id)!;
      const p = precedents[e.id];
      decisions[e.id] = e.profil
        ? botDecisions(e.profil, {
            scenario,
            state: etat,
            roundIndex: tour,
            lastSoldUnits: p ? vendu(p) : undefined,
            lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
            humanAvgPrice: precedente && precedente.price > 0 ? precedente.price : undefined,
            personality: botPersonalityFromSeed(graine, e.profil),
            leviers,
            investissementPlafonne: plafonne,
          })
        : proposedDecisionsFor({
            snapshot: scenario,
            state: etat,
            roundIndex: tour,
            previousPayload: precedente,
            lastMarket: p ? p.market.bySegment : null,
            lastBreakEven: p ? p.breakeven.breakEvenUnits : null,
            lastNetIncome: p ? p.incomeStatement.netIncome : null,
            leviers,
          });
    }
    precedente = decisions["a-equipe"]!;
    const sortie = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: evenements, seed: graine });
    cumul += sortie.results["a-equipe"]!.incomeStatement.netIncome;
    etats = sortie.companies;
    evenements = sortie.events;
    precedents = sortie.results;
  }
  return cumul;
}

const moyenne = (code: string, qualite: number) =>
  GRAINES.reduce((t, g) => t + partieSolo(code, g, qualite), 0) / GRAINES.length;

/** Le cas limite, où la garde porte sur la taille de l'écart et non sur son signe. */
const CAS_LIMITE = "fitness";
/** Négligeable : sous un centième du résultat cumulé à qualité nulle (voir l'en-tête). */
const NEGLIGEABLE = 0.01;

describe("la qualité proposée, mesurée en partie solo fidèle", () => {
  for (const def of SCENARIOS) {
    const proposee = def.scenario.qualiteProposee!;
    const titre =
      def.code === CAS_LIMITE
        ? `${def.code} : l'ancien budget qualité ne fait qu'un écart négligeable avec zéro`
        : proposee === 0
          ? `${def.code} : l'ancien budget qualité ne fait pas mieux que zéro`
          : `${def.code} : la part gardée fait au moins aussi bien que zéro`;
    it(titre, () => {
      const zero = moyenne(def.code, 0);
      const ancien = moyenne(def.code, PART_DE_QUALITE_NEUTRE);
      const lu = `ancien budget ${Math.round(ancien)} €, zéro ${Math.round(zero)} €`;
      // La donnée joue bien : les deux parties diffèrent, sans quoi la garde passerait à vide.
      expect(ancien, lu).not.toBe(zero);
      if (def.code === CAS_LIMITE) {
        expect(proposee, "le cas limite propose zéro").toBe(0);
        expect(Math.abs(ancien - zero), lu).toBeLessThanOrEqual(NEGLIGEABLE * Math.abs(zero));
      } else if (proposee === 0) {
        expect(ancien, lu).toBeLessThanOrEqual(zero);
      } else {
        expect(proposee, "la part gardée est celle de la gestion neutre").toBe(PART_DE_QUALITE_NEUTRE);
        expect(ancien, lu).toBeGreaterThanOrEqual(zero);
      }
    });
  }
});
