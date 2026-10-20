import { describe, expect, it } from "vitest";
import { scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import {
  leviersFigesDuProfil,
  presetByLevel,
  profilDuNiveau,
  type DifficultyPreset,
} from "@/config/difficulty";
import { botDecisions, botPersonalityFromSeed, soldByProduct, type BotProfile } from "@/engine/bots";
import { peekEventDraw } from "@/engine/events";
import { investissementPlafonne } from "@/engine/investment/plafond";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { subventionQuiDegele } from "@/engine/estimation/degel";
import { auPas, proposedDecisionsFor } from "@/services/decision-baseline";
import { montantDemandable } from "@/services/sauvetage";
import type {
  CompanyRoundResult,
  CompanyState,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";

/**
 * UNE ÉQUIPE DÉGELÉE NE RETOMBE PAS AUSSITÔT.
 *
 * Mesuré en partie fidèle : une équipe défaillante qui recevait la subvention
 * proposée, puis validait de nouveau la proposition du formulaire, retombait
 * deux tours plus tard dans tous les cas (NOVA et bistrot). Deux causes, deux
 * corrections, gardées ensemble ici parce que l'une sans l'autre ne suffit
 * pas :
 *
 *  · après le tour gelé, la proposition lisait ses ventes nulles et proposait
 *    un plan nul (`estUnTourGele`, `services/decision-baseline.ts`) ;
 *  · le minimum qui dégèle ramène la clôture au ras du plafond de découvert,
 *    et la moindre perte du tour suivant refait une crise : le formulaire
 *    propose le minimum avec un coussin (`subventionProposeeAuDegel`).
 *
 * La partie est montée comme `createGameCore` la crée (l'équipe et deux
 * concurrents du scénario, monde variable tiré de la graine, trimestre,
 * histoires d'investissement, concurrents assainis) et close comme
 * `round-resolution` la clôt. L'équipe commet une erreur de prix au tour 1,
 * que la proposition reconduit ensuite (le prix reste le sien) ; dès qu'elle
 * ouvre un tour défaillante, elle demande le montant que le formulaire lui
 * propose (`montantDemandable`) et l'animateur l'accorde. Six tours, l'horizon
 * d'une vraie partie.
 *
 * Et la garde du minimum reste vraie dans le vrai tour, concurrents compris :
 * le minimum dégèle, 200 € de moins ne dégèle pas.
 */

const BASE = [20260101, 4242, 7, 99, 31337, 123457, 8675309, 271828];
const GRAINES = [...BASE, ...Array.from({ length: 16 }, (_, i) => 1000 + (i + 1) * 7919)];
const TOURS = 6;
/** Une rechute sur cinq au plus : « la grande majorité » des équipes dégelées tient. */
const RECHUTE_TOLEREE = 0.2;

interface Bilan {
  /** Dégelées à qui il reste au moins deux tours : de quoi retomber. */
  exposees: number;
  rechutes: number;
  /** Tours subventionnés où le minimum dégèle et 200 € de moins non. */
  minimumExact: number;
  subventionnees: number;
}

function partie(code: string, niveau: number, graine: number, prixDuTour1: number, bilan: Bilan) {
  const def = scenarioByCode(code);
  const preset = presetByLevel.get(niveau as DifficultyPreset["level"])!;
  const leviers = leviersFigesDuProfil({ difficulty: profilDuNiveau(preset) });
  const plafonne = investissementPlafonne(preset.decisions);
  const scenario = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: graine,
    variableWorld: true,
    level: niveau,
    concurrents: 3,
    periodicity: "quarter",
    investmentStories: true,
    concurrentsAssainis: true,
  });
  const equipes = [
    { id: "a-equipe", nom: def.playerTeamName, profil: undefined as BotProfile | undefined },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-bot${i}`, nom: b.name, profil: b.profile as BotProfile })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    applyPeriodicityToCompany(
      def.company(e.id, e.nom, e.profil ? "bot" : "human", e.profil),
      "quarter",
      { abonnement: def.scenario.subscription !== undefined },
    ),
  );
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  let precedente: RoundDecisions | null = null;
  let subventionAu = 0;
  const statuts: string[] = [];
  for (let tour = 1; tour <= TOURS; tour += 1) {
    const decisions: Record<string, RoundDecisions> = {};
    const moi = etats.find((c) => c.id === "a-equipe")!;
    const p = precedents["a-equipe"];
    let d = proposedDecisionsFor({
      snapshot: scenario,
      state: moi,
      roundIndex: tour,
      previousPayload: precedente,
      lastMarket: p?.market.bySegment ?? null,
      lastBreakEven: p?.breakeven.breakEvenUnits ?? null,
      lastNetIncome: p?.incomeStatement.netIncome ?? null,
      leviers,
    });
    if (tour === 1) d = auPas({ ...d, price: d.price * prixDuTour1 });
    decisions["a-equipe"] = d;
    for (const e of equipes) {
      if (!e.profil) continue;
      const etat = etats.find((c) => c.id === e.id)!;
      const r = precedents[e.id];
      decisions[e.id] = botDecisions(e.profil, {
        scenario,
        state: etat,
        roundIndex: tour,
        lastSoldUnits: r ? soldUnits(r) : undefined,
        lastSoldByProduct: r ? soldByProduct(scenario, r.market.bySegment) : undefined,
        humanAvgPrice: precedente ? precedente.price : undefined,
        personality: botPersonalityFromSeed(graine, e.profil),
        leviers,
        investissementPlafonne: plafonne,
      });
    }
    const entree = {
      scenario,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: graine,
    };
    let subventions: Record<string, number> | undefined;
    if (moi.status === "defaillant") {
      // Ce que la vue de la partie mesure : l'état d'ouverture, les événements
      // connus à l'ouverture, le tirage du tour compris.
      const tires = peekEventDraw({ scenario, roundIndex: tour, companies: etats, activeEvents: evenements, seed: graine });
      const minimum = subventionQuiDegele({
        scenario,
        state: moi,
        roundIndex: tour,
        events: [...evenements, ...tires].filter((x) => x.scope === "market" || x.companyId === moi.id),
      });
      const propose = montantDemandable({
        alerte: { defaillante: true, financementOuvert: false, subventionQuiDegele: minimum, avecAnimateur: true },
        exigence: null,
      });
      if (minimum !== null && minimum > 0 && propose !== null) {
        expect(propose).toBeGreaterThanOrEqual(minimum);
        const statutAvec = (montant: number) =>
          simulateRound({ ...entree, rescueSubsidies: { "a-equipe": montant } }).companies.find(
            (c) => c.id === "a-equipe",
          )!.status;
        bilan.subventionnees += 1;
        if (statutAvec(minimum) !== "defaillant" && statutAvec(minimum - 200) === "defaillant") {
          bilan.minimumExact += 1;
        }
        subventions = { "a-equipe": propose };
        subventionAu = tour;
      }
    }
    const sortie = simulateRound({ ...entree, ...(subventions ? { rescueSubsidies: subventions } : {}) });
    statuts.push(sortie.companies.find((c) => c.id === "a-equipe")!.status ?? "active");
    precedente = d;
    etats = sortie.companies;
    evenements = sortie.events;
    precedents = sortie.results;
  }
  // La première subvention seulement : une équipe qui retombe en demande une
  // autre, mais c'est la rechute qu'on compte.
  if (subventionAu > 0 && statuts[subventionAu - 1] !== "defaillant" && TOURS - subventionAu >= 2) {
    bilan.exposees += 1;
    if (statuts.slice(subventionAu).includes("defaillant")) bilan.rechutes += 1;
  }
}

const CAS: { code: string; niveau: number; prix: number }[] = [
  { code: "nova", niveau: 1, prix: 0.85 },
  { code: "nova", niveau: 2, prix: 0.85 },
  { code: "nova", niveau: 2, prix: 0.8 },
  { code: "nova", niveau: 3, prix: 0.85 },
  { code: "bistrot", niveau: 2, prix: 0.75 },
];

describe("après la subvention de dégel, l'équipe qui garde la proposition ne retombe pas", () => {
  for (const cas of CAS) {
    it(`${cas.code}, niveau ${cas.niveau}, prix × ${cas.prix} au tour 1`, () => {
      const bilan: Bilan = { exposees: 0, rechutes: 0, minimumExact: 0, subventionnees: 0 };
      for (const graine of GRAINES) partie(cas.code, cas.niveau, graine, cas.prix, bilan);
      // Le scénario mord : assez d'équipes tombent, sont dégelées et ont le
      // temps de retomber pour que le taux veuille dire quelque chose.
      expect(bilan.exposees).toBeGreaterThanOrEqual(10);
      expect(bilan.rechutes / bilan.exposees).toBeLessThanOrEqual(RECHUTE_TOLEREE);
      // Le minimum reste exact dans le vrai tour.
      expect(bilan.minimumExact).toBe(bilan.subventionnees);
    });
  }
});
