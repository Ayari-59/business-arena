import { botDecisions, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";
import { novaCompany, novaScenario } from "@/config/scenarios/nova";
import { bistrotCompany, bistrotScenario } from "@/config/scenarios/bistrot";
import { ecommerceCompany, ecommerceScenario } from "@/config/scenarios/ecommerce";
import { conseilCompany, conseilScenario } from "@/config/scenarios/conseil";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import type { LeviersDuNiveau } from "@/config/difficulty";

/**
 * UNE PARTIE SANS AUCUN MODULE, RÉSUMÉE AU CENTIME.
 *
 * Quatre entreprises jouent toute la partie avec les décisions des bots
 * (finance, RH, investissement, trésorerie compris), sans jamais cocher un
 * module. Le résumé garde, tour par tour et entreprise par entreprise, le compte
 * de résultat, le bilan, le tableau de flux et la part de marché, arrondis au
 * centime. Il a été enregistré AVANT les correctifs des modules
 * (`tests/fixtures/parties-sans-module.json`) : une partie sans module doit le
 * retrouver à l'identique.
 */

type Fabrique = (id: string, name: string, controller: "human" | "bot", profile?: BotProfile) => CompanyState;

export const SECTEURS: Record<string, { scenario: EngineScenarioConfig; company: Fabrique }> = {
  nova: { scenario: novaScenario, company: novaCompany as Fabrique },
  bistrot: { scenario: bistrotScenario, company: bistrotCompany as Fabrique },
  ecommerce: { scenario: ecommerceScenario, company: ecommerceCompany as Fabrique },
  conseil: { scenario: conseilScenario, company: conseilCompany as Fabrique },
};

export const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "passive"];

export const GRAINE_SANS_MODULE = 2026;

// `|| 0` : un -0 arrondi est un 0 (le JSON du témoin ne garde pas le signe).
const centime = (x: number) => Math.round(x * 100) / 100 || 0;

/** Tous les nombres d'un objet, arrondis au centime (les autres valeurs telles quelles). */
function auCentime(v: unknown): unknown {
  if (typeof v === "number") return Number.isFinite(v) ? centime(v) : String(v);
  if (Array.isArray(v)) return v.map(auCentime);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([, x]) => x !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => [k, auCentime(x)]),
    );
  }
  return v;
}

export interface ReglageSansModule {
  secteur: keyof typeof SECTEURS;
  periodicity?: "month" | "quarter";
  /** Les leviers passés au moteur (absents : comme avant les correctifs). */
  leviers?: LeviersDuNiveau | null;
}

export function jouerSansModule(r: ReglageSansModule) {
  const { scenario: brut, company } = SECTEURS[r.secteur]!;
  const periodicity = r.periodicity ?? "quarter";
  const scenario =
    periodicity === "quarter"
      ? brut
      : composerLeScenarioJoue({ scenario: brut, seed: GRAINE_SANS_MODULE, concurrents: 3, periodicity });
  let etats: CompanyState[] = PROFILS.map((p, i) =>
    applyPeriodicityToCompany(company(`e${i}`, `Entreprise ${i}`, "bot", p), periodicity),
  ).sort((a, b) => a.id.localeCompare(b.id));
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  const tours: unknown[] = [];
  for (let tour = 1; tour <= scenario.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const [i, etat] of etats.entries()) {
      decisions[etat.id] = botDecisions(PROFILS[i]!, {
        scenario,
        state: etat,
        roundIndex: tour,
        lastSoldUnits: precedents[etat.id] ? soldUnits(precedents[etat.id]!) : undefined,
      });
    }
    const entree: Parameters<typeof simulateRound>[0] = {
      scenario,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: GRAINE_SANS_MODULE,
    };
    if (r.leviers !== undefined) (entree as unknown as Record<string, unknown>).leviers = r.leviers;
    const sortie = simulateRound(entree);
    tours.push(
      auCentime(
        Object.fromEntries(
          etats.map((e) => {
            const res = sortie.results[e.id]!;
            return [
              e.id,
              {
                incomeStatement: res.incomeStatement,
                balanceSheet: res.balanceSheet,
                cashFlow: res.cashFlow,
                totalShare: res.market.totalShare,
                events: sortie.newEvents.map((x) => x.code),
              },
            ];
          }),
        ),
      ),
    );
    precedents = sortie.results;
    etats = [...sortie.companies].sort((a, b) => a.id.localeCompare(b.id));
    evenements = sortie.events;
  }
  return tours;
}
