import type {
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  EventModifier,
} from "../types";
import { createRng, deriveRoundSeed, type SeededRng } from "../random";

/**
 * Moteur d'événements (doc 02 §7) : tirage seedé + application de
 * modificateurs sur les paramètres EFFECTIFS du tour (copie, jamais le
 * scénario d'origine).
 */

export interface EffectiveModifiers {
  materialCostMultiplier: number;
  demandMultiplier: Record<string, number>; // par segment, clé "*" = tous
  availabilityMultiplier: number;
  interestMultiplier: number;
  /** Commandes fermes du tour (unités, additives) — vendues d'office, réglées comptant. */
  extraOrderUnits: number;
  /** Prix unitaire imposé des commandes fermes (undefined = prix propre). */
  orderUnitPrice: number | undefined;
  /** Unités de commande sous-traitables au-delà du stock (additives). */
  orderSubcontractMax: number;
  /** Charge exceptionnelle du tour (€, additive) — ex. amende RSE (Lot 2C.2). */
  oneOffCharge: number;
  /** Produit exceptionnel du tour (€, additif) — ex. éco-subvention RSE (Lot 2C.2). */
  oneOffIncome: number;
}

export function drawEvents(
  scenario: EngineScenarioConfig,
  roundIndex: number,
  /** Seul l'identifiant sert : désigner l'entreprise qu'une carte ciblée frappe. */
  companies: ReadonlyArray<Pick<CompanyState, "id">>,
  activeEvents: EventInstance[],
  rng: SeededRng,
): { active: EventInstance[]; drawn: EventInstance[] } {
  const drawn: EventInstance[] = [];
  const activeCodes = new Set(activeEvents.map((e) => e.code));

  // 1. Événements scriptés du tour (certains — probability ignorée, doc 02 §7).
  for (const s of scenario.scriptedEvents) {
    if (s.round !== roundIndex) continue;
    const def = scenario.events.find((e) => e.code === s.eventCode);
    if (!def || activeCodes.has(def.code)) continue;
    drawn.push({
      code: def.code,
      scope: def.scope,
      companyId:
        def.scope === "company" ? companies[s.companyIndex ?? 0]?.id : undefined,
      roundsLeft: def.duration,
      modifiers: def.modifiers,
    });
  }

  // 2. Tirages probabilistes (ordre stable = ordre du scénario, PRNG seedé).
  for (const def of scenario.events) {
    if (activeCodes.has(def.code) || drawn.some((d) => d.code === def.code)) continue;
    if (def.minRound !== undefined && roundIndex < def.minRound) continue;
    if (rng.next() >= def.probability) continue;
    const companyId =
      def.scope === "company"
        ? companies[Math.floor(rng.next() * companies.length)]?.id
        : undefined;
    drawn.push({
      code: def.code,
      scope: def.scope,
      companyId,
      roundsLeft: def.duration,
      modifiers: def.modifiers,
    });
  }

  return { active: [...activeEvents, ...drawn], drawn };
}

/** Applique les modificateurs des événements actifs visibles par une entreprise. */
export function effectiveModifiers(
  events: EventInstance[],
  companyId: string,
): EffectiveModifiers {
  const out: EffectiveModifiers = {
    materialCostMultiplier: 1,
    demandMultiplier: {},
    availabilityMultiplier: 1,
    interestMultiplier: 1,
    extraOrderUnits: 0,
    orderUnitPrice: undefined,
    orderSubcontractMax: 0,
    oneOffCharge: 0,
    oneOffIncome: 0,
  };
  for (const event of events) {
    if (event.scope === "company" && event.companyId !== companyId) continue;
    for (const m of event.modifiers) out.demandMultiplier = apply(out, m);
  }
  return out;
}

function apply(out: EffectiveModifiers, m: EventModifier): Record<string, number> {
  const combine = (current: number) => (m.op === "mul" ? current * m.value : current + m.value);
  if (m.target === "material_cost") out.materialCostMultiplier = combine(out.materialCostMultiplier);
  else if (m.target === "availability") out.availabilityMultiplier = combine(out.availabilityMultiplier);
  else if (m.target === "interest_rate") out.interestMultiplier = combine(out.interestMultiplier);
  else if (m.target === "order") out.extraOrderUnits += m.value; // toujours additif (unités)
  else if (m.target === "order_price") out.orderUnitPrice = m.value; // prix imposé (absolu)
  else if (m.target === "order_subcontract") out.orderSubcontractMax += m.value;
  else if (m.target === "financial_penalty") out.oneOffCharge += m.value; // charge exceptionnelle (€)
  else if (m.target === "financial_aid") out.oneOffIncome += m.value; // produit exceptionnel (€)
  else if (m.target === "demand") {
    out.demandMultiplier["*"] = combine(out.demandMultiplier["*"] ?? 1);
  } else if (m.target.startsWith("demand:")) {
    const seg = m.target.slice("demand:".length);
    out.demandMultiplier[seg] = combine(out.demandMultiplier[seg] ?? 1);
  }
  return out.demandMultiplier;
}

/** Multiplicateur de demande effectif pour un segment (marché entier). */
export function demandMultiplierFor(mods: EffectiveModifiers, segmentCode: string): number {
  return (mods.demandMultiplier["*"] ?? 1) * (mods.demandMultiplier[segmentCode] ?? 1);
}

/** Décrémente la durée des événements ; retire les événements expirés. */
export function tickEvents(events: EventInstance[]): EventInstance[] {
  return events
    .map((e) => ({ ...e, roundsLeft: e.roundsLeft - 1 }))
    .filter((e) => e.roundsLeft > 0);
}

/**
 * LE TIRAGE, LU D'AVANCE.
 *
 * Le moteur tire les cartes d'un tour à sa clôture, avec le PRNG du tour —
 * le joueur découvrait donc l'événement dans ses résultats, après avoir
 * décidé, sans jamais le vivre. Or ce tirage est DÉTERMINISTE : même graine,
 * même tour, mêmes entreprises (triées par identifiant), mêmes événements
 * actifs ⇒ mêmes cartes. On peut donc le montrer à l'OUVERTURE du tour, face
 * cachée puis retournées, et laisser l'équipe décider en le sachant : c'est
 * le tour de table d'un vrai jeu de cartes.
 *
 * Cette fonction refait exactement ce que `simulateRound` fera : même graine
 * dérivée, même PRNG neuf, mêmes arguments, et le tirage est la première
 * chose que le moteur consomme. Elle ne modifie rien. Si un appelant lui
 * passe d'autres événements actifs que ceux de la clôture (une carte injectée
 * entre-temps), l'aperçu diverge : c'est à lui de lui donner ce que la
 * clôture verra.
 */
export function peekEventDraw(input: {
  scenario: EngineScenarioConfig;
  roundIndex: number;
  companies: ReadonlyArray<Pick<CompanyState, "id">>;
  activeEvents: EventInstance[];
  seed: number;
}): EventInstance[] {
  const rng = createRng(deriveRoundSeed(input.seed, input.roundIndex));
  return drawEvents(input.scenario, input.roundIndex, input.companies, input.activeEvents, rng).drawn;
}
