import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, EventInstance, RoundDecisions } from "@/engine/types";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel, type DifficultyPreset } from "@/config/difficulty";

/**
 * UNE PARTIE NOVA EN GAMME, RÉSUMÉE AU CENTIME, AUX NIVEAUX QUI LA JOUENT.
 *
 * Le témoin `parties-sans-module` ne joue que le NOVA d'une seule enceinte. Le
 * niveau 7 (« Groupe ») s'ajoute au moteur sur la variante en gamme : avant la
 * première ligne de ce travail, la gamme a donc été enregistrée aux niveaux 4,
 * 5 et 6, au trimestre et au mois, quatre entreprises pilotées par les bots,
 * bornées aux leviers du niveau, scénario composé comme à la création d'une
 * partie (histoires d'investissement comprises). Le résumé garde le compte de
 * résultat, le bilan, le tableau de flux, la production, le seuil et la part
 * de marché de chaque entreprise, tour par tour, arrondis au centime.
 *
 * Le témoin (`tests/fixtures/parties-nova-gamme.json`) ne se régénère pas : un
 * écart est une régression.
 */

export const PROFILS_GAMME: BotProfile[] = ["balanced", "price_aggressive", "premium", "passive"];
export const GRAINE_GAMME = 2026;
export const NIVEAUX_GAMME = [4, 5, 6] as const;

const centime = (x: number) => Math.round(x * 100) / 100 || 0;

export function auCentime(v: unknown): unknown {
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

export function jouerNovaGamme(r: { niveau: number; periodicity: "quarter" | "month" }) {
  const preset = presetByLevel.get(r.niveau as DifficultyPreset["level"])!;
  const leviers = preset.decisions;
  const scenario = composerLeScenarioJoue({
    scenario: novaGammeScenario,
    seed: GRAINE_GAMME,
    level: r.niveau,
    concurrents: PROFILS_GAMME.length,
    periodicity: r.periodicity,
    investmentStories: true,
  });
  let etats: CompanyState[] = PROFILS_GAMME.map((p, i) =>
    applyPeriodicityToCompany(novaGammeCompany(`e${i}`, `Entreprise ${i}`, "bot", p), r.periodicity),
  ).sort((a, b) => a.id.localeCompare(b.id));
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  const tours: unknown[] = [];
  for (let tour = 1; tour <= scenario.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const [i, etat] of etats.entries()) {
      const p = precedents[etat.id];
      decisions[etat.id] = botDecisions(PROFILS_GAMME[i]!, {
        scenario,
        state: etat,
        roundIndex: tour,
        lastSoldUnits: p ? soldUnits(p) : undefined,
        lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
        leviers,
      });
    }
    const sortie = simulateRound({
      scenario,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: GRAINE_GAMME,
    });
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
                production: res.production,
                breakeven: res.breakeven,
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
