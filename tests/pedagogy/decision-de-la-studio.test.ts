import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue, rdDuNiveau } from "@/config/scenarios/scenario-joue";
import { novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { presetByLevel, type DifficultyPreset } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import {
  aLaMesureDuNiveau,
  botDecisions,
  botPersonalityFromSeed,
  neutralDecisions,
  soldByProduct,
  type BotProfile,
} from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { auPas, proposedDecisionsFor } from "@/services/decision-baseline";
import { decisionDeReference } from "@/pedagogy/merite/reference";
import type {
  CompanyRoundResult,
  CompanyState,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";

/**
 * LA DÉCISION QUE LE NIVEAU « STRATÉGIE » ENSEIGNE : PAYER MAINTENANT POUR
 * GAGNER PLUS TARD.
 *
 * Aux niveaux 5 et 6, la R&D s'ouvre et la Studio de NOVA est le prototype à
 * financer (25 000 €, vendable au tour 2). Elle a été livrée prête un temps,
 * parce qu'une équipe qui validait les propositions faisait faillite sans
 * elle ; la cause était ailleurs (la proposition reconduisait six tours le
 * plan du tour 1, gelé sous le point mort), et la livrer prête retirait au
 * niveau sa décision. Ce banc garde les quatre propriétés qui font que la
 * décision a du sens, en VRAIES PARTIES SOLO (une équipe, deux concurrents du
 * secteur, monde variable, histoires d'investissement, comme
 * `createSoloGame`), sur douze graines, aux niveaux 5 et 6 :
 *
 *   1. ne pas développer la Studio ne tue pas : aucune défaillance, les crises
 *      restent rares, et le résultat cumulé n'est pas catastrophique ;
 *   2. financer la Studio au tour 1 rapporte NETTEMENT plus que s'en passer ;
 *   3. la financer trop tard (tour 5) ne rapporte plus rien : la décision a un
 *      bon moment ;
 *   4. le bon gestionnaire reste au-dessus, et la gestion neutre, qui finance
 *      la R&D, ne tombe jamais en défaillance.
 *
 * Ce banc est volontairement grossier : il mesure des ORDRES DE GRANDEUR et
 * des bornes larges, pas des centimes. Le témoin au centime est
 * `nova-gamme-non-regression`.
 *
 * Il se joue deux fois : sans le drapeau, et pour une partie à la proposition à
 * la demande (`propositionALaDemande`, engine/types.ts). Le formulaire à la demande
 * fait mieux sans la Studio que l'ancien, si bien qu'une borne fixe sur le résultat
 * « sans la Studio » ne disait plus la décision : décision du propriétaire, le banc
 * garde ce qui compte, l'écart. La Studio au tour 1 rapporte nettement plus que
 * s'en passer, et tard ne paie pas, avec le drapeau comme sans lui.
 */

const GRAINES = Array.from({ length: 12 }, (_, g) => 1000 + (g + 1) * 7919);
const NIVEAUX = [5, 6] as const;
/** Le tour où l'équipe engage les 25 000 € de la Studio ; `null` : jamais. */
type Politique = "propose" | "studioT1" | "studioT5" | "neutre" | "gestionnaire";

const sumSold = (b: CompanyRoundResult["market"]["bySegment"]) =>
  Object.values(b).reduce((t, x) => t + x.sold, 0);

interface Bilan {
  parties: number;
  crises: number;
  defaillances: number;
  /** Résultat net cumulé moyen de l'équipe, en euros. */
  resultat: number;
}

/**
 * Une partie solo jouée tour par tour comme `resolveGameRound` : l'équipe tient
 * sa politique, les deux concurrents jouent `botDecisions` avec la personnalité
 * de la graine, le prix humain du tour passé et les leviers figés du niveau.
 */
function partieSolo(niveau: number, graine: number, politique: Politique, drapeau: boolean) {
  const def = scenarioByCode(scenarioCodeForLevel("nova", niveau));
  const leviers = presetByLevel.get(niveau as DifficultyPreset["level"])!.decisions;
  const snapshot = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: graine,
    variableWorld: true,
    level: niveau,
    concurrents: 3,
    periodicity: "quarter",
    investmentStories: true,
    ...(drapeau ? { propositionALaDemande: true } : {}),
  });
  const equipes = [
    { id: "a-equipe", nom: def.playerTeamName, humaine: true, profil: undefined as BotProfile | undefined },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b${i}`, nom: b.name, humaine: false, profil: b.profile })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    applyPeriodicityToCompany(def.company(e.id, e.nom, e.humaine ? "human" : "bot", e.profil), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  let precedente: RoundDecisions | null = null;
  let crise = false;
  let defaillante = false;
  let resultat = 0;
  for (let tour = 1; tour <= snapshot.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    const prixHumain = precedente?.price;
    for (const e of equipes) {
      const etat = etats.find((x) => x.id === e.id)!;
      const p = precedents[e.id];
      const passe = p
        ? {
            lastSoldUnits: sumSold(p.market.bySegment),
            lastSoldByProduct: soldByProduct(snapshot, p.market.bySegment) ?? undefined,
          }
        : {};
      if (!e.humaine) {
        decisions[e.id] = botDecisions(e.profil!, {
          scenario: snapshot,
          state: etat,
          roundIndex: tour,
          ...passe,
          ...(prixHumain && prixHumain > 0 ? { humanAvgPrice: prixHumain } : {}),
          personality: botPersonalityFromSeed(graine, e.profil!),
          leviers,
        });
        continue;
      }
      let d: RoundDecisions;
      if (politique === "neutre") {
        // La gestion neutre du secteur, recalculée à chaque tour : elle finance
        // la R&D de la Studio (le profil équilibré la couvre en un tour).
        d = auPas(aLaMesureDuNiveau(neutralDecisions({ scenario: snapshot, state: etat, roundIndex: tour }), leviers));
      } else if (politique === "gestionnaire") {
        d = decisionDeReference(
          {
            scenario: snapshot,
            state: etat,
            roundIndex: tour,
            ...passe,
            ...(p ? { resultatPrecedent: p } : {}),
            ...(precedente ? { decisionPrecedente: precedente } : {}),
          },
          leviers,
        );
      } else {
        // Ce que le formulaire propose, validé sans rien toucher : la
        // proposition ne finance jamais une dépense ponctuelle, donc jamais la R&D.
        d = proposedDecisionsFor({
          snapshot,
          state: etat,
          roundIndex: tour,
          previousPayload: precedente,
          lastMarket: p ? p.market.bySegment : null,
          lastBreakEven: p ? p.breakeven.breakEvenUnits : null,
          lastNetIncome: p ? p.incomeStatement.netIncome : null,
          leviers,
        });
        const tourDeLaStudio = politique === "studioT1" ? 1 : politique === "studioT5" ? 5 : 0;
        if (tour === tourDeLaStudio && d.products?.["nova-studio"]) {
          const studio = snapshot.products!.find((x) => x.code === "nova-studio")!;
          d = structuredClone(d);
          d.products!["nova-studio"]!.rdBudget = studio.development!.cost;
          d = auPas(d);
        }
      }
      decisions[e.id] = d;
      precedente = d;
    }
    const sortie = simulateRound({
      scenario: snapshot,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: graine,
    });
    const equipe = sortie.companies.find((c) => c.id === "a-equipe")!;
    const res = sortie.results["a-equipe"]!;
    resultat += res.incomeStatement.netIncome;
    if (res.treasury?.crisis) crise = true;
    if (equipe.status === "defaillant") defaillante = true;
    etats = sortie.companies;
    evenements = sortie.events;
    precedents = sortie.results;
  }
  return { crise, defaillante, resultat };
}

function banc(niveau: number, politique: Politique, drapeau: boolean): Bilan {
  const bilan: Bilan = { parties: 0, crises: 0, defaillances: 0, resultat: 0 };
  for (const graine of GRAINES) {
    const p = partieSolo(niveau, graine, politique, drapeau);
    bilan.parties++;
    if (p.crise) bilan.crises++;
    if (p.defaillante) bilan.defaillances++;
    bilan.resultat += p.resultat;
  }
  bilan.resultat /= bilan.parties;
  return bilan;
}

describe("la Studio se développe aux niveaux 5 et 6 : la décision du niveau « Stratégie »", () => {
  it("elle est à développer aux niveaux qui ouvrent la R&D, livrée prête au 4 (fermée) et au 7 (NOVA Home)", () => {
    const studio = (s: ReturnType<typeof rdDuNiveau>) =>
      s.products!.find((p) => p.code === "nova-studio")!.development;
    expect(studio(rdDuNiveau(novaGammeScenario, 4, false))).toBeUndefined();
    expect(studio(rdDuNiveau(novaGammeScenario, 5, true))).toEqual({ cost: 25000, availableFromRound: 2 });
    expect(studio(rdDuNiveau(novaGammeScenario, 6, true))).toEqual({ cost: 25000, availableFromRound: 2 });
    expect(studio(rdDuNiveau(novaGammeScenario, 7, true))).toBeUndefined();
  });

  for (const { niveau, drapeau, partie } of NIVEAUX.flatMap((niveau) => [
    { niveau, drapeau: false, partie: "" },
    { niveau, drapeau: true, partie: ", partie à la demande" },
  ])) {
    it(`niveau ${niveau}${partie} : sans la Studio on survit, avec elle au tour 1 on gagne nettement plus, trop tard ne rapporte plus`, () => {
      const sans = banc(niveau, "propose", drapeau);
      const tot = banc(niveau, "studioT1", drapeau);
      const tard = banc(niveau, "studioT5", drapeau);

      // 1. Ne pas la développer ne tue pas.
      expect(sans.defaillances).toBe(0);
      expect(sans.crises).toBeLessThanOrEqual(1);
      expect(sans.resultat).toBeGreaterThan(-60_000);

      // 2. La financer au tour 1 rapporte nettement plus, sans crise.
      expect(tot.defaillances).toBe(0);
      expect(tot.crises).toBe(0);
      expect(tot.resultat).toBeGreaterThan(sans.resultat + 60_000);

      // 3. La financer au tour 5 ne rapporte plus : la décision a un bon moment.
      expect(tard.resultat).toBeLessThanOrEqual(sans.resultat);
      expect(tard.resultat).toBeLessThan(tot.resultat - 60_000);
    });

    it(`niveau ${niveau}${partie} : le bon gestionnaire reste au-dessus, la gestion neutre ne tombe pas`, () => {
      const sans = banc(niveau, "propose", drapeau);
      const neutre = banc(niveau, "neutre", drapeau);
      const gestionnaire = banc(niveau, "gestionnaire", drapeau);
      expect(neutre.defaillances).toBe(0);
      expect(neutre.crises).toBe(0);
      expect(gestionnaire.defaillances).toBe(0);
      expect(gestionnaire.resultat).toBeGreaterThan(sans.resultat);
      expect(gestionnaire.resultat).toBeGreaterThan(neutre.resultat);
    });
  }
});
