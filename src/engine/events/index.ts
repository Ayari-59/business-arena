import type {
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  EventModifier,
} from "../types";
import type { SeededRng } from "../random";

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
}

export function drawEvents(
  scenario: EngineScenarioConfig,
  roundIndex: number,
  companies: CompanyState[],
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
