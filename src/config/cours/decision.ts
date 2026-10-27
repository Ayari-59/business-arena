import type { BotProfile } from "../../engine/bots";
import { runGame, soldUnits, type DecisionProviderContext } from "../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState, RoundDecisions } from "../../engine/types";
import { auCentime } from "../../pedagogy/cours/etats";
import { scenarioByCode } from "../scenarios/registry";
import { GRAINE_DU_COURS } from "./cas";
import { decisionDuCours, scenarioDuCours } from "./arene-du-cours";

/**
 * DÉCIDER : L'ARÈNE REJOUE LE TRIMESTRE À UN AUTRE PRIX.
 *
 * Le premier trimestre de l'année du cours (même réglage, même graine, mêmes concurrents),
 * joué trois fois : au prix de la gestion équilibrée, puis 10 % plus bas, puis 10 % plus
 * haut. Seul le prix change ; le plan de production, les budgets et les concurrents restent
 * ceux du trimestre. Ce que l'élève prévoit à la main, l'arène le joue : la demande répond
 * au prix, et le plan de production borne ce qui se vend. En gamme, chaque référence prend
 * le même écart de prix ; le prix moyen, lui, suit aussi ce qui se vend de chacune : si une
 * référence se vend moins qu'une autre au prix monté, il bouge de plus ou de moins de 10 %.
 *
 * La sous-traitance, elle, n'existe dans l'arène que chez NOVA (`subcontracting` de son
 * scénario) : le chapitre ne la propose que là.
 */

export const ECART_DE_PRIX = 0.1;

export interface Variante {
  facteur: number;
  quantite: number;
  prix: number;
  chiffreDAffaires: number;
  marge: number;
  resultat: number;
  /** Les ventes que le marché demandait et que le plan de production n'a pas servies. */
  perdues: number;
  /** Ce que le trimestre a produit, et ce qu'il pouvait produire (machines et équipe). */
  production: number;
  capacite: number;
  /** En gamme, le prix de chaque référence, tel que le moteur l'a appliqué ; null sans gamme. */
  prixDesReferences: Record<string, number> | null;
}

const variantes = new Map<string, Variante[]>();

function aPrix(d: RoundDecisions, facteur: number): RoundDecisions {
  if (facteur === 1) return d;
  return {
    ...d,
    price: d.price * facteur,
    ...(d.products
      ? { products: Object.fromEntries(Object.entries(d.products).map(([k, p]) => [k, { ...p, price: p.price * facteur }])) }
      : {}),
  };
}

/**
 * Le premier trimestre de l'année du cours, rejoué avec la décision de l'entreprise changée par
 * `changer` (le prix ici, le budget de la campagne ailleurs) ; les concurrents jouent les leurs.
 */
export function rejouerLePremierTrimestre(code: string, changer: (d: RoundDecisions) => RoundDecisions): CompanyRoundResult {
  const def = scenarioByCode(code);
  const scenario = scenarioDuCours(def.scenario, 1);
  const entreprises: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const partie = runGame({
    scenario,
    initialCompanies: entreprises,
    seed: GRAINE_DU_COURS,
    providers: Object.fromEntries(
      entreprises.map((e) => [
        e.id,
        (ctx: DecisionProviderContext) => {
          const d = decisionDuCours(e.botProfile as BotProfile, scenario, ctx);
          return e.id === "joueur" ? changer(d) : d;
        },
      ]),
    ),
  });
  return partie.rounds[0]!.results["joueur"]!;
}

function jouer(code: string, facteur: number): Variante {
  const r = rejouerLePremierTrimestre(code, (d) => aPrix(d, facteur));
  const is = r.incomeStatement;
  const quantite = Math.round(soldUnits(r));
  return {
    facteur,
    quantite,
    prix: auCentime(is.revenue / quantite),
    chiffreDAffaires: Math.round(is.revenue),
    marge: Math.round(is.grossMargin),
    resultat: Math.round(is.operatingIncome),
    perdues: Math.round(Object.values(r.market.bySegment).reduce((t, v) => t + (v.lost ?? 0), 0)),
    production: Math.round(r.production.produced),
    capacite: Math.round(Math.min(r.production.machineCapacity, r.production.laborCapacity)),
    prixDesReferences: r.products ? Object.fromEntries(Object.entries(r.products).map(([k, p]) => [k, p.price])) : null,
  };
}

/** Les trois trimestres joués : prix baissé, prix du trimestre, prix monté. */
export function prixRejoues(code: string): Variante[] {
  const deja = variantes.get(code);
  if (deja) return deja;
  const v = [1 - ECART_DE_PRIX, 1, 1 + ECART_DE_PRIX].map((f) => jouer(code, f));
  variantes.set(code, v);
  return v;
}

/** La sous-traitance de l'entreprise dans l'arène, ou null : seule NOVA en a une. */
export function sousTraitance(code: string) {
  const s = scenarioByCode(code).scenario;
  if (!s.subcontracting) return null;
  return {
    coutUnitaire: s.subcontracting.unitCost,
    coutVariableUnitaire: s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit,
  };
}
