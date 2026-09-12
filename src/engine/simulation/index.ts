import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EquipmentItem,
  EquipmentTypeDef,
  OrderOfferDef,
  SegmentSalesDetail,
  SimulationInput,
  SimulationOutput,
} from "../types";
import { createRng, deriveRoundSeed } from "../random";
import { JournalBuilder } from "../accounting/journal";
import { axisFitFactor, brandFactor, updateBrandAwareness } from "../market/communication";
import {
  isProductAvailable,
  rdOpeningOf,
  suppliersOf,
  toGamme,
  toGammeDecisions,
  type GammeDecision,
  type GammeProduct,
  offerProductIndex,
} from "../gamme";
import type { SupplierDef } from "../types";
import type { StockLot } from "../inventory/cump";
import { computePotentialDemand } from "../market/demand";
import { attractionScore } from "../market/attraction";
import { allocateShares } from "../market/allocation";
import {
  computeDefectRate,
  computeProducedQuality,
  computeProduction,
  updateAvailability,
  updatePerceivedQuality,
} from "../production";
import { addToStock, removeFromStock, stockValue } from "../inventory/cump";
import { computeHr } from "../hr";
import { subscriptionChurnRate } from "../subscription";
import { unitVariableCost } from "../costs";
import { computeBreakeven } from "../costs/breakeven";
import { balanceGap, computeFinance } from "../finance/statements";
import {
  DEFAULT_RSE_CONFIG,
  rseEffort,
  updateRseCapital,
  imageAttractionFactor,
  cleanDefectReduction,
  financingTrustBonus,
  socialAttritionRelief,
  evaluateRseCards,
  RSE_CARD_CODES,
} from "../rse";
import { computeFunctionalBalance } from "../finance/functional";
import { computeRatios } from "../finance/ratios";
import {
  conditionsBancaires,
  confianceInitiale,
  confianceSuivante,
  fiabiliteDuPlan,
  planDepose,
} from "../finance/bank";
import {
  demandMultiplierFor,
  drawEvents,
  effectiveModifiers,
  tickEvents,
} from "../events";

// --- Helpers pour le parc d'équipements typés ---

function mergeFleet(active: EquipmentItem[], pending: EquipmentItem[]): EquipmentItem[] {
  return [...active, ...pending];
}

function fleetCapacity(
  fleet: EquipmentItem[],
  types: Map<string, EquipmentTypeDef>,
): number {
  return fleet.reduce((sum, item) => {
    const typ = types.get(item.typeCode);
    return sum + (typ ? item.count * typ.capacityPerUnit : 0);
  }, 0);
}

export function fleetMaintenanceMultiplier(
  fleet: EquipmentItem[],
  types: Map<string, EquipmentTypeDef>,
): number {
  let totalCapacity = 0;
  let weightedSum = 0;
  for (const item of fleet) {
    const typ = types.get(item.typeCode);
    if (!typ) continue;
    const cap = item.count * typ.capacityPerUnit;
    totalCapacity += cap;
    weightedSum += cap * typ.maintenanceMultiplier;
  }
  return totalCapacity > 0 ? weightedSum / totalCapacity : 1;
}

function fleetCountOf(fleet: EquipmentItem[], typeCode: string): number {
  return fleet.reduce((s, f) => s + (f.typeCode === typeCode ? f.count : 0), 0);
}

// --- Helpers de la gamme (multi-produits) ---
//
// Règle d'or : pour une gamme d'UN produit, chaque helper renvoie la valeur du
// produit unique SANS la recomposer (pas de 0 + x, pas de x × w / w), afin que
// le chemin mono-produit reste identique au bit près à son histoire.

function sumExact(values: number[]): number {
  if (values.length === 1) return values[0]!;
  return values.reduce((a, b) => a + b, 0);
}

function weightedAverage(values: number[], weights: number[]): number {
  if (values.length === 1) return values[0]!;
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return values[0] ?? 0;
  return values.reduce((s, v, k) => s + v * (weights[k] ?? 0), 0) / total;
}

function aggregateLot(lots: StockLot[]): StockLot {
  if (lots.length === 1) return lots[0]!;
  const quantity = lots.reduce((s, l) => s + l.quantity, 0);
  const value = lots.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  return { quantity, unitCost: quantity > 0 ? value / quantity : 0 };
}

/**
 * Production d'une gamme sous capacités PARTAGÉES (doc 02 §4 étendu). Un
 * seul produit : `computeProduction` historique, tel quel. Plusieurs : la
 * capacité machine (en unités) et les heures de main-d'œuvre sont un pool
 * commun ; si la somme des plans dépasse l'un ou l'autre, TOUS les plans sont
 * réduits du même facteur — c'est le facteur rare, et l'arbitrage est laissé
 * à l'équipe (elle choisit ses plans, le moteur ne priorise pas à sa place).
 */
function allocateProduction(args: {
  gamme: GammeProduct[];
  plans: number[];
  machineCapacity: number;
  availability: number;
  headcount: number;
  hoursPerEmployee: number;
  productivity: number;
}): {
  perProduct: number[];
  produced: number;
  machineCapacity: number;
  laborCapacity: number;
  utilizationRate: number;
} {
  if (args.gamme.length === 1) {
    const r = computeProduction({
      planned: args.plans[0]!,
      machineCapacity: args.machineCapacity,
      availability: args.availability,
      headcount: args.headcount,
      hoursPerEmployee: args.hoursPerEmployee,
      productivity: args.productivity,
      hoursPerUnit: args.gamme[0]!.hoursPerUnit,
    });
    return {
      perProduct: [r.produced],
      produced: r.produced,
      machineCapacity: r.machineCapacity,
      laborCapacity: r.laborCapacity,
      utilizationRate: r.utilizationRate,
    };
  }
  const machineCapacity = Math.max(0, args.machineCapacity * args.availability);
  const laborHours = args.headcount * args.hoursPerEmployee * args.productivity;
  const plans = args.plans.map((p) => Math.max(0, p));
  const totalPlan = plans.reduce((a, b) => a + b, 0);
  const hoursNeeded = plans.reduce((s, p, k) => s + p * args.gamme[k]!.hoursPerUnit, 0);
  const machineFactor = totalPlan > 0 ? Math.min(1, machineCapacity / totalPlan) : 1;
  const laborFactor = hoursNeeded > 0 ? Math.min(1, laborHours / hoursNeeded) : 1;
  const factor = Math.min(machineFactor, laborFactor);
  const perProduct = plans.map((p) => p * factor);
  const produced = perProduct.reduce((a, b) => a + b, 0);
  // Capacité main-d'œuvre exprimée en unités AU MIX PLANIFIÉ (heures moyennes
  // pondérées par plan) — comparable à la capacité machine, en unités.
  const laborCapacity =
    hoursNeeded > 0 && totalPlan > 0 ? laborHours / (hoursNeeded / totalPlan) : Infinity;
  return {
    perProduct,
    produced,
    machineCapacity,
    laborCapacity,
    utilizationRate: machineCapacity > 0 ? produced / machineCapacity : 0,
  };
}

export const ENGINE_VERSION = "0.1.0";

/**
 * Commande exceptionnelle proposée pour un tour. L'ALTERNANCE des archétypes
 * est garantie (tours impairs : règlement à crédit — l'export qui gonfle le
 * BFR ; tours pairs : comptant à marge mince), mais l'offre est TIRÉE dans le
 * pool de l'archétype à la graine de la partie : deux parties ne proposent
 * pas la même séquence, deux équipes de la même partie voient la même offre.
 * Le tirage utilise un PRNG dédié (dérivé de la graine) : les tirages seedés
 * d'événements restent rigoureusement inchangés. Sans graine : rotation
 * historique.
 */
export function orderOfferForRound(
  scenario: EngineScenarioConfig,
  roundIndex: number,
  seed?: number,
): OrderOfferDef | null {
  const pool = scenario.orderOffers;
  if (!pool || pool.length === 0) return null;
  if (seed === undefined) return pool[(roundIndex - 1) % pool.length] ?? null;
  const credit = pool.filter((o) => o.paymentDelayDays > 0);
  const cash = pool.filter((o) => o.paymentDelayDays === 0);
  const wanted = roundIndex % 2 === 1 ? credit : cash;
  const archetype = wanted.length > 0 ? wanted : pool;
  const rng = createRng(deriveRoundSeed((seed ^ 0x0ffe12ab) >>> 0, roundIndex));
  return archetype[Math.floor(rng.next() * archetype.length)] ?? null;
}

/**
 * Résolution d'un tour (doc 02 §2). Fonction PURE et DÉTERMINISTE :
 * aucune E/S, aucun aléa hors PRNG seedé, mêmes entrées ⇒ mêmes sorties.
 * Pipeline : événements → production → stocks → marché → finance → état.
 */
export function simulateRound(input: SimulationInput): SimulationOutput {
  const { scenario, roundIndex } = input;
  const rng = createRng(deriveRoundSeed(input.seed, roundIndex));
  // La gamme : un produit (les secteurs historiques, marché = scenario.market,
  // chemin identique au bit près) ou plusieurs (chacun avec son marché, usine
  // et finance communes). `multi` gouverne les seuls champs ajoutés à l'état et
  // aux résultats : rien n'est émis en mono-produit.
  const gamme = toGamme(scenario);
  const multi = gamme.length > 1;

  // Journal comptable (Jalon B du plan fondation comptable) : en gamme, on
  // enregistre chaque flux (achat, vente, paie, amortissement, financement).
  // En mono-produit, le journal reste vide (non émis dans le résultat).
  const journalByCompany: Map<string, JournalBuilder> = new Map();
  for (const company of input.companies) {
    journalByCompany.set(company.id, new JournalBuilder());
  }

  // 1. Événements : tirage + poursuite des événements actifs (doc 02 §7).
  const { active, drawn } = drawEvents(
    scenario,
    roundIndex,
    input.companies,
    input.activeEvents,
    rng,
  );
  // 1bis. Cartes événement RSE (Lot 2C) : company-scope, tirées sur le
  // capital-image d'OUVERTURE de chaque entreprise. Elles n'entrent PAS dans
  // marketMods (scope company) et leur effet demande est appliqué via
  // l'attraction (le moteur n'applique pas les modificateurs de demande
  // company-scope ailleurs — voir rseCardFactor plus bas). RNG DÉDIÉ : ne pas
  // consommer le stream principal préserve tous les tirages existants.
  const rseCardsConfig = scenario.rse?.cards ?? DEFAULT_RSE_CONFIG.cards;
  const rseCardRng = createRng(deriveRoundSeed(input.seed ^ 0x52534332, roundIndex));
  for (const state of input.companies) {
    if (state.status === "defaillant") continue;
    const draws = evaluateRseCards({
      imageCapital: Math.max(0, state.rseImageCapital ?? 0),
      cleanCapital: Math.max(0, state.rseCleanCapital ?? 0),
      roundIndex,
      config: rseCardsConfig,
      scale: scenario.marketing.scale,
      // Deux tirages INDÉPENDANTS (bad buzz, sanction), sur le stream dédié.
      badBuzzRoll: rseCardRng.next(),
      sanctionRoll: rseCardRng.next(),
    });
    for (const d of draws) {
      if (active.some((e) => e.code === d.code && e.companyId === state.id)) continue;
      // Chaque carte porte UN effet : demande (2C), amende ou subvention (2C.2).
      const modifiers =
        d.demandFactor !== undefined
          ? [{ target: "demand" as const, op: "mul" as const, value: d.demandFactor }]
          : d.penalty !== undefined
            ? [{ target: "financial_penalty" as const, op: "add" as const, value: d.penalty }]
            : [{ target: "financial_aid" as const, op: "add" as const, value: d.aid ?? 0 }];
      const instance = {
        code: d.code,
        scope: "company" as const,
        companyId: state.id,
        roundsLeft: d.duration,
        modifiers,
      };
      active.push(instance);
      drawn.push(instance);
    }
  }

  const marketMods = effectiveModifiers(
    active.filter((e) => e.scope === "market"),
    "",
  );

  // 2. Demande potentielle du marché par segment (doc 02 §3.1).
  const potentialBySegment: Record<string, number> = {};
  for (const product of gamme) {
    for (const segment of product.market.segments) {
      potentialBySegment[segment.code] = computePotentialDemand(
        segment,
        roundIndex,
        product.market.seasonality,
        demandMultiplierFor(marketMods, segment.code),
      );
    }
  }

  // 3. Production, qualité et stock disponible par entreprise (doc 02 §4-5).
  interface Working {
    state: CompanyState;
    decisions: Required<Pick<import("../types").RoundDecisions, "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "maintenanceBudget">> &
      import("../types").RoundDecisions;
    /** Décisions par produit, dans l'ordre de la gamme (mono : les scalaires recopiés). */
    gamme: GammeDecision[];
    /** Unités produites par produit (mono : [produced]). */
    producedPerProduct: number[];
    produced: number;
    machineCapacity: number;
    laborCapacity: number;
    utilizationRate: number;
    /** Qualité produite de l'entreprise (mono : celle du produit ; gamme : moyenne pondérée). */
    producedQuality: number;
    /** Qualité produite par produit (mono : [producedQuality]). */
    productQuality: number[];
    /** Qualité perçue d'OUVERTURE par produit (mono : [state.perceivedQuality]). */
    productPerceived: number[];
    /** Budget qualité total du tour (mono : le scalaire ; gamme : somme des références). */
    qualityTotal: number;
    /**
     * R&D (scénarios avec bloc `rd`, sinon tout à zéro et rien n'est émis) :
     * l'état d'ouverture de chaque référence, sa disponibilité ce tour (une
     * référence en développement ne se produit ni ne se vend), le budget du
     * tour et l'état de clôture qui alimentera le tour suivant.
     */
    productRdOpening: (import("../types").ProductRdState | null)[];
    productAvailable: boolean[];
    rdTotal: number;
    productRdNext: (import("../types").ProductRdState | null)[];
    /**
     * Communication (levier `communication`, sinon neutre et rien n'est émis) :
     * notoriété d'ouverture, axe et budget de marque du tour, adéquation de
     * l'axe par segment (remplie au marché) et notoriété de clôture.
     */
    brandOpening: number;
    communicationAxis: import("../types").CommunicationAxis | undefined;
    brandBudget: number;
    axisFitBySegment: Record<string, number>;
    brandNext: number;
    /** Fournisseur de chaque produit (mono : [supplier]). */
    productSuppliers: (import("../types").SupplierDef | null)[];
    /** Rupture d'approvisionnement subie par chaque produit. */
    productDisruptions: boolean[];
    /** Coût variable unitaire par produit (mono : [unitCost]). */
    unitCosts: number[];
    /** Multiplicateur du coût matières par produit (mono : [materialMultiplier]). */
    materialMultipliers: number[];
    /** Stocks d'ouverture et de fin de production, par produit. */
    openingStocks: StockLot[];
    productStocks: StockLot[];
    productDefectUnits: number[];
    productScrap: number[];
    materialMultiplier: number;
    mods: ReturnType<typeof effectiveModifiers>;
    insured: boolean;
    neutralizedEvents: string[];
    hr: ReturnType<typeof computeHr>;
    hrRelevant: boolean;
    defectUnits: number;
    scrapValue: number;
    investUnits: number;
    investOutlay: number;
    equipBought: { typeCode: string; typeName: string; quantity: number; unitCost: number }[];
    equipSold: { typeCode: string; typeName: string; quantity: number; salePrice: number; bookValue: number }[];
    equipSaleProceeds: number;
    equipDisposalLoss: number;
    equipNewFleet: EquipmentItem[];
    equipPendingFleet: EquipmentItem[];
    equipDepreciation: number;
    chosenFormula: import("../types").InsuranceFormulaDef | null;
    supplier: import("../types").SupplierDef | null;
    supplyDisruption: boolean;
    // Engagement RSE (Lot 2). Les EFFETS (facteur image, réduction rebuts) sont
    // dérivés du capital d'OUVERTURE — différés. Les CAPITAUX « next » intègrent
    // la dépense de ce tour et alimentent l'état suivant.
    rseBudget: number;
    rseInvestment: number;
    rseCost: number;
    rseImageFactor: number;
    rseCardFactor: number;
    rseDefectReduction: number;
    rseAttritionRelief: number;
    rseNextImageCapital: number;
    rseNextCleanCapital: number;
    /**
     * Abonnement (bloc `subscription`, sinon tout à zéro et rien n'est émis) :
     * portefeuille d'ouverture, occupation, taux d'attrition, adhérents restés
     * (à servir en priorité) et, rempli au marché, adhérents effectivement
     * servis sur la capacité du tour.
     */
    subOpening: number;
    subOccupancy: number;
    subChurnRate: number;
    subRetained: number;
    subServed: number;
  }

  // Assurance (doc 02 §7.2) : pour les assurés, les événements couverts
  // sont exclus des modificateurs EFFECTIFS de l'entreprise.
  const insuranceOffer = scenario.insurance;
  // résout les formules disponibles (rétro-compatible : ancien format = formule unique "default")
  const insuranceFormulas = insuranceOffer?.formulas ??
    (insuranceOffer ? [{ code: "default", name: "Assurance catastrophe", premiumPerRound: insuranceOffer.premiumPerRound, coveredEventCodes: insuranceOffer.coveredEventCodes }] : []);

  const working: Working[] = input.companies.map((state) => {
    const soumis = input.decisions[state.id];
    if (!soumis) throw new Error(`Décisions manquantes pour ${state.id} (ADR-04 : reconduire en amont)`);
    // Gel de faillite (V2 couche 2, #5) : une entreprise défaillante ne produit
    // plus, ne dépense plus, n'emprunte plus. Seule l'augmentation de capital
    // reste ouverte — une recapitalisation qui la ramène sous le plafond de
    // découvert la fait repasser `active` (voir plus bas). Le prix est sans
    // effet sans production ; on le laisse tel quel.
    const raw =
      state.status === "defaillant"
        ? {
            ...soumis,
            productionPlan: 0,
            marketingBudget: 0,
            qualityBudget: 0,
            maintenanceBudget: 0,
            insurance: undefined,
            acceptOrder: false,
            studies: undefined,
            hr: undefined,
            investment: undefined,
            treasury: undefined,
            rse: undefined,
            forecast: undefined,
            products: undefined,
            brandMarketingBudget: undefined,
            communicationAxis: undefined,
            finance: soumis.finance?.capitalIncrease
              ? { capitalIncrease: soumis.finance.capitalIncrease }
              : undefined,
          }
        : soumis;
    const decisions = {
      // Prix borné à ≥ 0 comme les autres leviers : le schéma (min 1) et les
      // bots (plancher au coût variable) protègent le jeu, mais un appelant hors
      // schéma (import, éditeur, test) pouvait injecter un prix ≤ 0 — attraction
      // nulle et marge de sécurité −Infinity. Clamp défensif dans le moteur.
      price: Math.max(0, raw.price),
      productionPlan: Math.max(0, raw.productionPlan),
      marketingBudget: Math.max(0, raw.marketingBudget),
      qualityBudget: Math.max(0, raw.qualityBudget),
      maintenanceBudget: Math.max(0, raw.maintenanceBudget),
      insurance: raw.insurance,
      acceptOrder: raw.acceptOrder,
      supplierChoice: raw.supplierChoice,
      studies: raw.studies,
      hr: raw.hr,
      treasury: raw.treasury,
      finance: raw.finance,
      forecast: raw.forecast,
      products: raw.products,
      brandMarketingBudget: raw.brandMarketingBudget,
      communicationAxis: raw.communicationAxis,
    };
    // Engagement RSE (Lot 2) : réglages effectifs et capitaux d'OUVERTURE. Lus
    // ici car le climat social (Lot 2B) les consomme dès le calcul RH ; l'effet
    // image et la réduction des rebuts, plus bas, s'en servent aussi.
    const rseConfig = scenario.rse ?? DEFAULT_RSE_CONFIG;
    const rseOpeningImage = Math.max(0, state.rseImageCapital ?? 0);
    const rseOpeningClean = Math.max(0, state.rseCleanCapital ?? 0);
    // CLIMAT SOCIAL (Lot 2B) : un employeur engagé retient mieux. On abaisse le
    // seuil d'attrition effectif — le salaire peut glisser plus bas avant qu'une
    // démission ne survienne. Effet DIFFÉRÉ (capital d'ouverture), comme l'image.
    const rseAttritionRelief = socialAttritionRelief(
      rseOpeningImage,
      rseConfig.socialAttritionRelief,
    );
    // RH (doc 02 §4.1) : morale du tour, coûts, mouvements d'effectif à t+1.
    const hr = computeHr({
      config:
        scenario.hr && rseAttritionRelief > 0
          ? {
              ...scenario.hr,
              attritionThreshold: scenario.hr.attritionThreshold * (1 - rseAttritionRelief),
            }
          : scenario.hr,
      decisions: raw.hr,
      headcount: state.headcount,
      productivity: state.productivity,
    });
    const hrRelevant =
      scenario.hr !== undefined &&
      (raw.hr !== undefined || state.headcount !== scenario.hr.includedHeadcount);
    // Assurance : résoudre la formule choisie
    const chosenFormula = (() => {
      if (!decisions.insurance || !insuranceOffer) return null;
      if (typeof decisions.insurance === "string") {
        return insuranceFormulas.find((f) => f.code === decisions.insurance) ?? null;
      }
      // booléen true → première formule (rétro-compatibilité)
      return insuranceFormulas[0] ?? null;
    })();
    const insured = chosenFormula !== null;
    const covered = new Set(chosenFormula?.coveredEventCodes ?? []);
    const neutralizedEvents = insured
      ? active
          .filter(
            (e) =>
              covered.has(e.code) && (e.scope === "market" || e.companyId === state.id),
          )
          .map((e) => e.code)
      : [];
    const companyEvents = insured ? active.filter((e) => !covered.has(e.code)) : active;
    const mods = effectiveModifiers(companyEvents, state.id);
    // Décisions par produit (mono : les scalaires bornés ci-dessus, recopiés).
    const gammeDecisionsBrutes = toGammeDecisions(decisions, gamme);
    // R&D (levier `rd`) : l'état d'ouverture de chaque référence. Une
    // référence à développer n'est vendable qu'une fois son coût couvert par
    // la R&D cumulée des tours PASSÉS (le lancement suit le tour qui couvre
    // le coût) et jamais avant son tour de disponibilité. Sans bloc `rd`,
    // tout est disponible et rien n'est calculé : chemin historique.
    const productRdOpening = gamme.map((p) => rdOpeningOf(scenario, state, p.code));
    const productAvailable = gamme.map((p, k) => isProductAvailable(p, productRdOpening[k]!, roundIndex));
    // Une référence en développement ne se produit pas : son plan tombe à
    // zéro, sa R&D reste (c'est elle qui la fera naître). Faillite : plus de
    // R&D non plus, l'entreprise est gelée.
    const gammeDecisions = gammeDecisionsBrutes.map((d, k) => ({
      ...d,
      productionPlan: productAvailable[k] ? d.productionPlan : 0,
      rdBudget: scenario.rd && state.status !== "defaillant" ? d.rdBudget : 0,
    }));
    const rdTotal = scenario.rd ? sumExact(gammeDecisions.map((d) => d.rdBudget)) : 0;
    // Fournisseur choisi (doc 02 §5bis) : coût, qualité, délai, risque de
    // rupture. Mono-produit : le fournisseur scalaire. Gamme : chaque
    // référence a le sien (`products[code].supplierChoice`, sinon le
    // scalaire), résolu dans SON catalogue — le sien s'il en déclare un,
    // sinon celui du scénario ; un code inconnu du catalogue retombe sur son
    // premier fournisseur. Le fournisseur scalaire reste celui du bloc
    // d'entreprise.
    const resolveIn = (catalogue: SupplierDef[] | null, code: string | undefined) =>
      catalogue ? (catalogue.find((s) => s.code === code) ?? catalogue[0]!) : null;
    const supplier = resolveIn(suppliersOf({}, scenario), decisions.supplierChoice);
    const productSuppliers = multi
      ? gammeDecisions.map((d, k) => resolveIn(suppliersOf(gamme[k]!, scenario), d.supplierChoice))
      : [supplier];
    // La rupture se tire UNE fois par fournisseur réellement utilisé, dans
    // l'ordre de la gamme (mono : le seul tirage historique).
    const disruptionBySupplier = new Map<string, boolean>();
    for (const s of productSuppliers) {
      if (!s || disruptionBySupplier.has(s.code)) continue;
      disruptionBySupplier.set(
        s.code,
        s.supplyRiskProbability > 0 ? rng.next() < s.supplyRiskProbability : false,
      );
    }
    const productDisruptions = productSuppliers.map((s) => (s ? (disruptionBySupplier.get(s.code) ?? false) : false));
    const supplyDisruption = supplier ? (disruptionBySupplier.get(supplier.code) ?? false) : false;
    const supplyAvailabilityHit = supplyDisruption ? (supplier?.supplyRiskAvailabilityHit ?? 1) : 1;
    // Capacité machine : soit calculée du parc typé, soit homogène (legacy).
    const effectiveMachineCapacity = scenario.equipment
      ? fleetCapacity(
          mergeFleet(state.fleet ?? [], state.pendingFleet ?? []),
          new Map(scenario.equipment.types.map((t) => [t.code, t])),
        )
      : state.machineCapacity + (state.pendingCapacity ?? 0);
    // Mono-produit : la rupture ampute la disponibilité de l'usine (chemin
    // historique). Gamme : elle ampute le plan des SEULES références que le
    // fournisseur défaillant fournit — les autres ne sont pas touchées.
    const production = allocateProduction({
      gamme,
      plans: multi
        ? gammeDecisions.map((d, k) =>
            d.productionPlan *
            (productDisruptions[k]! ? (productSuppliers[k]?.supplyRiskAvailabilityHit ?? 1) : 1),
          )
        : gammeDecisions.map((d) => d.productionPlan),
      machineCapacity: effectiveMachineCapacity,
      availability:
        state.availability * mods.availabilityMultiplier * (multi ? 1 : supplyAvailabilityHit),
      headcount: state.headcount,
      hoursPerEmployee: state.hoursPerEmployee,
      productivity: state.productivity * hr.morale,
    });
    // Qualité produite PAR PRODUIT. En gamme, l'échelle du budget qualité est
    // divisée par le nombre de références : un budget réparti à parts égales
    // donne à chacune exactement la qualité que le scalaire donnait à
    // l'entreprise ; concentré sur une référence, il la distingue.
    const qualityScale = multi
      ? scenario.production.qualityScale / gamme.length
      : scenario.production.qualityScale;
    const productQuality = gammeDecisions.map((d) =>
      computeProducedQuality({
        qualityBudget: d.qualityBudget,
        qualitySensitivity: scenario.production.qualitySensitivity,
        qualityScale,
        utilizationRate: production.utilizationRate,
        overheatThreshold: scenario.production.overheatThreshold,
      }),
    );
    const producedQuality = multi
      ? weightedAverage(productQuality, production.perProduct)
      : productQuality[0]!;
    const qualityTotal = multi ? sumExact(gammeDecisions.map((d) => d.qualityBudget)) : decisions.qualityBudget;
    // Qualité perçue d'ouverture par produit : en gamme, celle de la
    // référence si elle est suivie, sinon celle de l'entreprise.
    const productPerceived = gamme.map((p) =>
      multi ? (state.perceivedQualityByProduct?.[p.code] ?? state.perceivedQuality) : state.perceivedQuality,
    );
    // R&D de clôture : le cumul investi ; le lancement dès que le coût est
    // couvert (effectif au tour suivant) ; le niveau technique nourri par la
    // R&D au-delà du coût de développement, à rendements décroissants et
    // lissé — il s'érode quand la R&D cesse, la concurrence rattrape.
    const productRdNext = productRdOpening.map((rd, k) => {
      if (!rd || !scenario.rd) return null;
      const cfg = scenario.rd;
      const dev = gamme[k]!.development;
      const budget = gammeDecisions[k]!.rdBudget;
      const remaining = dev ? Math.max(0, dev.cost - rd.invested) : 0;
      const beyond = Math.max(0, budget - remaining);
      const target = Math.min(cfg.techMax, cfg.techSensitivity * Math.log(1 + beyond / cfg.techScale));
      const techLevel = cfg.techInertia * rd.techLevel + (1 - cfg.techInertia) * target;
      const invested = rd.invested + budget;
      const launched = productAvailable[k]!;
      return {
        invested,
        launched,
        ...(launched
          ? { launchRound: rd.launchRound ?? roundIndex }
          : rd.launchRound !== undefined
            ? { launchRound: rd.launchRound }
            : {}),
        techLevel,
      };
    });
    // Communication (levier `communication`) : la notoriété d'ouverture, l'axe
    // et le budget de marque du tour (gamme seulement : en mono, le marketing
    // reste un budget unique), la notoriété de clôture — usée si l'axe change.
    const comm = scenario.communication;
    const brandOpening = comm ? Math.max(0, state.brandAwareness ?? 0) : 0;
    const communicationAxis = comm ? decisions.communicationAxis : undefined;
    const brandBudget = comm && multi ? Math.max(0, decisions.brandMarketingBudget ?? 0) : 0;
    const axisChanged =
      comm !== undefined &&
      state.lastCommunicationAxis !== undefined &&
      communicationAxis !== undefined &&
      communicationAxis !== state.lastCommunicationAxis;
    const brandNext = comm ? updateBrandAwareness(brandOpening, brandBudget, axisChanged, comm) : 0;
    const materialMultiplier = mods.materialCostMultiplier * (supplier?.costMultiplier ?? 1);
    const materialMultipliers = multi
      ? productSuppliers.map((s) => mods.materialCostMultiplier * (s?.costMultiplier ?? 1))
      : [materialMultiplier];
    // Coût variable unitaire de chaque produit (mono : le seul, expression
    // historique inchangée).
    const unitCosts = gamme.map((p, k) =>
      unitVariableCost(p.materialCostPerUnit * materialMultipliers[k]!, p.otherVariableCostPerUnit),
    );
    // --- Engagement RSE (Lot 2) ---
    // La dépense de CE tour est une charge décaissée (comme le marketing) et
    // n'alimente le capital qu'à la clôture : ses effets (image → demande,
    // rebuts en moins) se lisent sur le capital d'OUVERTURE, donc ils sont
    // DIFFÉRÉS. C'est l'arbitrage : payer maintenant, gagner plus tard.
    // (rseConfig, rseOpeningImage, rseOpeningClean déclarés plus haut : le
    // climat social les consomme dès le calcul RH.)
    const rseBudget = Math.max(0, raw.rse?.budget ?? 0);
    const rseInvestment = Math.max(0, raw.rse?.investment ?? 0);
    const rseCost = rseBudget + rseInvestment;
    const rseScale = scenario.marketing.scale;
    const rseImageFactor = imageAttractionFactor(rseOpeningImage, rseConfig.imageDemandSensitivity);
    // Cartes RSE (Lot 2C) : leur effet demande passe par l'attraction (le moteur
    // n'applique pas les modificateurs de demande company-scope ailleurs). On
    // isole les SEULS codes RSE : les autres événements company-scope à modif de
    // demande (conseil, nova) gardent leur comportement historique intact.
    const rseCardFactor = active
      .filter(
        (e) =>
          e.companyId === state.id &&
          (e.code === RSE_CARD_CODES.label || e.code === RSE_CARD_CODES.badBuzz),
      )
      .reduce(
        (f, e) => f * (e.modifiers.find((m) => m.target === "demand")?.value ?? 1),
        1,
      );
    const rseDefectReduction = cleanDefectReduction(
      rseOpeningClean,
      rseConfig.cleanDefectReductionMax,
    );
    const rseNextImageCapital = updateRseCapital(
      rseOpeningImage,
      rseEffort(rseBudget, rseScale),
      rseConfig.imageInertia,
    );
    const rseNextCleanCapital = updateRseCapital(
      rseOpeningClean,
      rseEffort(rseInvestment, rseScale),
      rseConfig.cleanInertia,
    );
    // Non-qualité interne (doc 02 §4.2) : rebuts fonction de la qualité
    // produite — payés (matières, MOD) mais invendables : seul le net entre
    // en stock, la perte est valorisée au coût variable. Le capital « process
    // propre » RSE en retranche une part (effet différé, capital d'ouverture).
    // Taux de rebut PAR PRODUIT : la qualité produite de chaque référence
    // (mono : le seul, sur la qualité produite historique).
    const productDefectRate = productQuality.map((quality) =>
      scenario.qualityCosts
        ? computeDefectRate({
            baseDefectRate: scenario.qualityCosts.baseDefectRate,
            producedQuality: quality,
            rseDefectReduction,
            // La maintenance n'agit sur les rebuts que si le scénario l'active
            // (maintenanceDefectSensitivity > 0) ; sinon facteur neutre, comportement
            // historique. Référence : budget de maintenance de référence du scénario.
            maintenanceBudget: decisions.maintenanceBudget,
            maintenanceReference: scenario.production.maintenanceReference,
            maintenanceDefectSensitivity: scenario.qualityCosts.maintenanceDefectSensitivity,
          })
        : 0,
    );
    // Rebuts et entrée en stock, PRODUIT PAR PRODUIT (mono : expressions
    // historiques sur le produit unique et le lot `finishedGoods`).
    const openingStocks: StockLot[] = gamme.map((p) =>
      multi ? (state.finishedGoodsByProduct?.[p.code] ?? { quantity: 0, unitCost: 0 }) : state.finishedGoods,
    );
    const productDefectUnits = production.perProduct.map((q, k) => q * productDefectRate[k]!);
    const productScrap = productDefectUnits.map((d, k) => d * unitCosts[k]!);
    const productStocks = production.perProduct.map((q, k) =>
      addToStock(openingStocks[k]!, q - productDefectUnits[k]!, unitCosts[k]!),
    );
    const defectUnits = sumExact(productDefectUnits);
    const scrapValue = sumExact(productScrap);
    // --- Investissement capacitaire ---
    // Deux systèmes : homogène (legacy) ou typé (equipment).
    const equip = scenario.equipment;
    let investUnits = 0;
    let investOutlay = 0;
    const equipBought: Working["equipBought"] = [];
    const equipSold: Working["equipSold"] = [];
    let equipSaleProceeds = 0;
    let equipDisposalLoss = 0;
    let equipNewFleet: EquipmentItem[] = [];
    let equipPendingFleet: EquipmentItem[] = [];
    let equipDepreciation = 0;

    if (equip) {
      const typeMap = new Map(equip.types.map((t) => [t.code, t]));
      // Parc actif = parc existant + pending du tour précédent
      const activeFleet = mergeFleet(state.fleet ?? [], state.pendingFleet ?? []);
      // Ventes d'équipement (retrait du parc actif)
      const sellRequests = raw.investment?.equipmentSell ?? [];
      let fleet = [...activeFleet.map((f) => ({ ...f }))];
      for (const req of sellRequests) {
        const typ = typeMap.get(req.typeCode);
        if (!typ || req.quantity <= 0) continue;
        let toSell = Math.min(req.quantity, fleetCountOf(fleet, req.typeCode));
        if (toSell <= 0) continue;
        const resaleRatio = typ.resaleRatio ?? 0.5;
        let soldBookValue = 0;
        let soldCount = 0;
        // Vendre en commençant par les plus anciens (FIFO)
        for (const item of fleet) {
          if (item.typeCode !== req.typeCode || item.count <= 0) continue;
          const take = Math.min(toSell, item.count);
          const bvPerUnit = item.count > 0 ? item.bookValue / item.count : 0;
          soldBookValue += take * bvPerUnit;
          item.count -= take;
          item.bookValue -= take * bvPerUnit;
          soldCount += take;
          toSell -= take;
          if (toSell <= 0) break;
        }
        const salePrice = soldBookValue * resaleRatio;
        equipSaleProceeds += salePrice;
        equipDisposalLoss += soldBookValue - salePrice;
        equipSold.push({
          typeCode: req.typeCode,
          typeName: typ.name,
          quantity: soldCount,
          salePrice,
          bookValue: soldBookValue,
        });
      }
      fleet = fleet.filter((f) => f.count > 0);
      // Achats d'équipement (en attente, en service à t+1)
      const buyRequests = raw.investment?.equipmentBuy ?? [];
      const newPending: EquipmentItem[] = [];
      for (const req of buyRequests) {
        const typ = typeMap.get(req.typeCode);
        if (!typ || req.quantity <= 0) continue;
        const qty = Math.min(req.quantity, typ.maxPerRound);
        const cost = qty * typ.costPerUnit;
        investOutlay += cost;
        investUnits += qty * typ.capacityPerUnit;
        newPending.push({
          typeCode: req.typeCode,
          count: qty,
          acquiredRound: roundIndex,
          bookValue: cost,
        });
        equipBought.push({
          typeCode: req.typeCode,
          typeName: typ.name,
          quantity: qty,
          unitCost: typ.costPerUnit,
        });
      }
      // Amortissement du parc actif (chaque lot s'amortit linéairement)
      for (const item of fleet) {
        const typ = typeMap.get(item.typeCode);
        if (!typ || item.bookValue <= 0) continue;
        const originalCost = item.count * typ.costPerUnit;
        const depPerRound = originalCost / typ.depreciationRounds;
        const dep = Math.min(depPerRound, item.bookValue);
        equipDepreciation += dep;
        item.bookValue = Math.max(0, item.bookValue - dep);
      }
      equipNewFleet = fleet.filter((f) => f.count > 0);
      equipPendingFleet = newPending;
    } else if (scenario.investment) {
      investUnits = Math.min(
        Math.max(0, raw.investment?.machineCapacityUnits ?? 0),
        scenario.investment.maxPerRound,
      );
      investOutlay = investUnits * scenario.investment.costPerCapacityUnit;
    }
    // Abonnement : le portefeuille d'ouverture part en partie (attrition
    // fonction de la qualité perçue, du prix et de la saturation du tour) ;
    // le reste sera servi en priorité sur la capacité, au marché.
    const sub = scenario.subscription;
    const subOpening = sub ? Math.max(0, state.members ?? 0) : 0;
    const subCapacity = Math.min(production.machineCapacity, production.laborCapacity);
    const subOccupancy = sub ? (subCapacity > 0 ? subOpening / subCapacity : 1) : 0;
    const subChurnRate = sub
      ? subscriptionChurnRate({
          config: sub,
          perceivedQuality: productPerceived[0]!,
          price: gammeDecisions[0]!.price,
          occupancy: subOccupancy,
          roundIndex,
        })
      : 0;
    const subRetained = subOpening * (1 - subChurnRate);
    return {
      state,
      decisions,
      gamme: gammeDecisions,
      producedPerProduct: production.perProduct,
      produced: production.produced,
      machineCapacity: production.machineCapacity,
      laborCapacity: production.laborCapacity,
      utilizationRate: production.utilizationRate,
      producedQuality,
      productQuality,
      productPerceived,
      qualityTotal,
      productRdOpening,
      productAvailable,
      rdTotal,
      productRdNext,
      brandOpening,
      communicationAxis,
      brandBudget,
      axisFitBySegment: {},
      brandNext,
      productSuppliers,
      productDisruptions,
      unitCosts,
      materialMultipliers,
      openingStocks,
      productStocks,
      productDefectUnits,
      productScrap,
      materialMultiplier,
      mods,
      insured,
      neutralizedEvents,
      hr,
      hrRelevant,
      defectUnits,
      scrapValue,
      investUnits,
      investOutlay,
      equipBought,
      equipSold,
      equipSaleProceeds,
      equipDisposalLoss,
      equipNewFleet,
      equipPendingFleet,
      equipDepreciation,
      chosenFormula,
      supplier,
      supplyDisruption,
      rseBudget,
      rseInvestment,
      rseCost,
      rseImageFactor,
      rseCardFactor,
      rseDefectReduction,
      rseAttritionRelief,
      rseNextImageCapital,
      rseNextCleanCapital,
      subOpening,
      subOccupancy,
      subChurnRate,
      subRetained,
      subServed: 0,
    };
  });

  // 4. Marché : attraction → parts → demande adressée → ventes contraintes
  //    par le stock (doc 02 §3.2-3.4).
  const salesBySegment = new Map<string, SegmentSalesDetail[]>();
  // UN MARCHÉ PAR PRODUIT : la concurrence se joue produit par produit, sur
  // les segments du produit, avec le prix et le marketing décidés pour lui.
  // Mono-produit : le marché du produit unique est `scenario.market`, même
  // ordre de segments, mêmes décisions — chemin identique.
  gamme.forEach((product, k) => {
    for (const segment of product.market.segments) {
      const attractions = working.map((w) => {
        // Faillite (V2 couche 2, #5) : une entreprise défaillante est dormante ce
        // tour — production nulle, stock non réapprovisionné. La laisser dans le
        // calcul d'attraction lui faisait capter une part (son prix cassé donne
        // une attraction élevée) qu'elle ne pouvait pas servir : la demande
        // captée partait intégralement en « perdue », amputant d'autant les
        // concurrents actifs sans faute de leur part. Attraction nulle → part 0
        // (allocateShares écarte les scores ≤ 0), et les parts se renormalisent
        // entre les entreprises réellement au marché.
        // Une référence en développement n'est pas au marché : attraction
        // nulle, sa demande se renormalise entre celles qui la vendent.
        if (w.state.status === "defaillant" || !w.productAvailable[k]) return 0;
        // Communication : l'adéquation de l'axe à CE segment porte (ou dessert)
        // le marketing spécifique de la référence et la notoriété de marque.
        // Sans levier : facteur 1, expression historique.
        const comm = scenario.communication;
        const rd = w.productRdOpening[k];
        const fit = comm
          ? axisFitFactor(
              w.communicationAxis,
              segment,
              {
                price: w.gamme[k]!.price,
                techLevel: rd?.techLevel ?? 0,
                freshlyLaunched: rd?.launchRound !== undefined && roundIndex - rd.launchRound <= 1,
              },
              comm,
            )
          : 1;
        if (comm) w.axisFitBySegment[segment.code] = fit;
        return attractionScore({
          price: w.gamme[k]!.price,
          marketingBudget: comm ? w.gamme[k]!.marketingBudget * fit : w.gamme[k]!.marketingBudget,
          // La qualité perçue DE LA RÉFÉRENCE (mono : celle de l'entreprise).
          perceivedQuality: w.productPerceived[k]!,
          lastShare: w.state.lastMarketShare[segment.code] ?? 0,
          segment,
          marketingScale: scenario.marketing.scale,
          // Capital-image (2A) ET cartes RSE (2C) modulent l'attractivité ;
          // la notoriété de marque (communication) aussi, à l'adéquation de l'axe.
          imageFactor: comm
            ? w.rseImageFactor * w.rseCardFactor * brandFactor(w.brandOpening, fit)
            : w.rseImageFactor * w.rseCardFactor,
        });
      });
      const shares = allocateShares(
        attractions,
        segment.competitionIntensity ?? product.market.competitionIntensity,
        product.market.outsideAttraction,
      );
      const potential = potentialBySegment[segment.code] ?? 0;
      salesBySegment.set(
        segment.code,
        working.map((_, i) => ({
          potential,
          attraction: attractions[i] ?? 0,
          share: shares[i] ?? 0,
          demandForCompany: potential * (shares[i] ?? 0),
          sold: 0,
          lost: 0,
          revenue: 0,
          commission: 0,
        })),
      );
    }
  });

  // Contrainte de stock : ventes limitées au stock DU PRODUIT, réparties au
  // prorata de ses segments.
  working.forEach((w, i) => {
    gamme.forEach((product, k) => {
      const demands = product.market.segments.map(
        (s) => salesBySegment.get(s.code)?.[i]?.demandForCompany ?? 0,
      );
      const totalDemand = demands.reduce((a, b) => a + b, 0);
      // Abonnement : les adhérents restés sont servis d'abord sur la capacité
      // de la première référence (une entreprise défaillante n'en sert aucun) ;
      // le marché n'a que les places restantes. Sans le modèle : expression
      // historique.
      if (scenario.subscription && k === 0) {
        w.subServed =
          w.state.status === "defaillant"
            ? 0
            : Math.min(w.subRetained, w.productStocks[k]!.quantity);
      }
      const available =
        scenario.subscription && k === 0
          ? w.productStocks[k]!.quantity - w.subServed
          : w.productStocks[k]!.quantity;
      const serviceRate = totalDemand > 0 ? Math.min(1, available / totalDemand) : 0;
      product.market.segments.forEach((s) => {
        const detail = salesBySegment.get(s.code)?.[i];
        if (!detail) return;
        detail.sold = detail.demandForCompany * serviceRate;
        detail.lost = detail.demandForCompany - detail.sold;
        detail.revenue = detail.sold * w.gamme[k]!.price;
        detail.commission = detail.revenue * (s.commissionRate ?? 0);
      });
    });
  });

  // 5-6. Finance et nouvel état par entreprise (doc 02 §6).
  const results: Record<string, CompanyRoundResult> = {};
  const nextCompanies: CompanyState[] = [];
  let totalSold = 0;
  const totalPotential = Object.values(potentialBySegment).reduce((a, b) => a + b, 0);
  // Commande exceptionnelle du tour (doc 02 §5.1) : la même pour tous,
  // tirée à la graine de la partie (alternance crédit / comptant garantie).
  const roundOffer = orderOfferForRound(scenario, roundIndex, input.seed);

  working.forEach((w, i) => {
    // Faillite (V2 couche 2, #5) : une entreprise défaillante est dormante — elle
    // ne vend RIEN ce tour. Le marché l'écarte déjà (attraction nulle ⇒ 0 unité
    // de segment). Restait une fuite : une commande ferme d'événement, ou une
    // commande exceptionnelle, puisait dans son STOCK RÉSIDUEL. Une entreprise à
    // l'arrêt n'honore pas de commande ; son stock reste gelé jusqu'à la reprise.
    const dormant = w.state.status === "defaillant";
    const perSegment: Record<string, SegmentSalesDetail> = {};
    let segmentUnits = 0;
    let commissionCost = 0;
    // Unités et crédit pondéré PAR PRODUIT (mono : le produit unique accumule
    // exactement ce que `segmentUnits` accumulait, dans le même ordre).
    const productSegmentUnits: number[] = gamme.map(() => 0);
    const productCredit: number[] = gamme.map(() => 0);
    const productLost: number[] = gamme.map(() => 0);
    gamme.forEach((product, k) => {
      for (const segment of product.market.segments) {
        const detail = salesBySegment.get(segment.code)?.[i];
        if (!detail) continue;
        perSegment[segment.code] = detail;
        segmentUnits += detail.sold;
        commissionCost += detail.commission;
        productSegmentUnits[k]! += detail.sold;
        productLost[k]! += detail.lost;
        productCredit[k]! +=
          detail.sold * Math.min(1, segment.paymentDelayDays / scenario.roundDays);
      }
    });
    // Le premier produit de la gamme porte les commandes fermes d'événement et
    // la commande exceptionnelle du tour (mono : le seul produit).
    const mainStock = w.productStocks[0]!;
    const mainUnits = productSegmentUnits[0]!;
    const mainPrice = w.gamme[0]!.price;
    // Commandes fermes (événement « order ») : vendues d'office en plus du
    // marché, réglées comptant, au prix imposé le cas échéant. Livrées du
    // stock restant ; au-delà, sous-traitées si l'offre le permet et que le
    // scénario a un sous-traitant (coût unitaire majoré — coûts pertinents !).
    const orderRequested = dormant ? 0 : w.mods.extraOrderUnits;
    const orderDelivered = Math.min(orderRequested, Math.max(0, mainStock.quantity - mainUnits));
    const orderShortfall = orderRequested - orderDelivered;
    const subcontracted = scenario.subcontracting
      ? Math.min(orderShortfall, w.mods.orderSubcontractMax)
      : 0;
    const subcontractCost = subcontracted * (scenario.subcontracting?.unitCost ?? 0);
    const orderUnitPrice = w.mods.orderUnitPrice ?? mainPrice;

    // Commande exceptionnelle acceptée : livrée du stock restant après le
    // marché et les commandes fermes (pas de sous-traitance — à prendre avec
    // ses moyens). Son délai de règlement décide de la part du CA qui part
    // en créances : rentabilité contre BFR, l'arbitrage est là.
    // En gamme, la commande porte sur la référence qu'elle nomme et se sert
    // sur SON stock (mono, et offre sans référence : la première, expression
    // historique au bit près).
    const offerIndex = offerProductIndex(gamme, roundOffer);
    const offerAccepted = !dormant && Boolean(roundOffer && w.decisions.acceptOrder);
    const offerDelivered =
      offerAccepted && roundOffer
        ? Math.min(
            roundOffer.units,
            Math.max(
              0,
              w.productStocks[offerIndex]!.quantity -
                productSegmentUnits[offerIndex]! -
                (offerIndex === 0 ? orderDelivered : 0),
            ),
          )
        : 0;
    const offerRevenue = offerDelivered * (roundOffer?.price ?? 0);
    const offerCreditShare = roundOffer
      ? Math.min(1, roundOffer.paymentDelayDays / scenario.roundDays)
      : 0;

    // Non-qualité externe : retours clients fonction de la qualité perçue,
    // remboursés au prix de vente (unités détruites — la marge part entière).
    // Le taux de retour est celui de chaque référence (mono : de l'entreprise).
    const productReturnRate = w.productPerceived.map((perceived) =>
      scenario.qualityCosts
        ? Math.min(
            0.3,
            scenario.qualityCosts.externalReturnSensitivity * Math.max(0, 1 - perceived),
          )
        : 0,
    );
    const productReturned = productSegmentUnits.map((u, k) =>
      scenario.qualityCosts ? u * productReturnRate[k]! : 0,
    );
    const returnedUnits = sumExact(productReturned);
    const refund = sumExact(productReturned.map((r, k) => r * w.gamme[k]!.price));

    // Ventes par produit : le marché du produit, plus, pour le premier de la
    // gamme, les commandes fermes et la commande exceptionnelle (mono : tout).
    // Abonnement : les adhérents conservés sont des ventes de la première
    // référence, au prix du tour, réglées comptant. Sans le modèle : zéro,
    // et l'expression historique est conservée telle quelle.
    const retainedRevenue = scenario.subscription ? w.subServed * w.gamme[0]!.price : 0;
    const productSold = productSegmentUnits.map(
      (u, k) =>
        u +
        (k === 0 ? orderDelivered : 0) +
        (k === offerIndex ? offerDelivered : 0) +
        (scenario.subscription && k === 0 ? w.subServed : 0),
    );
    const soldUnits = sumExact(productSold);
    const productSegmentRevenue = productSegmentUnits.map((u, k) => u * w.gamme[k]!.price);
    const revenue = scenario.subscription
      ? sumExact(productSegmentRevenue) +
        retainedRevenue +
        (orderDelivered + subcontracted) * orderUnitPrice +
        offerRevenue -
        refund
      : sumExact(productSegmentRevenue) +
        (orderDelivered + subcontracted) * orderUnitPrice +
        offerRevenue -
        refund;
    // Part du CA à crédit, en euros : segments à leurs délais, commandes
    // fermes d'événement comptant, commande exceptionnelle à SON délai.
    const creditRevenue =
      sumExact(productCredit.map((c, k) => c * w.gamme[k]!.price)) +
      offerRevenue * offerCreditShare;
    const receivableRatio = revenue > 0 ? Math.min(1, creditRevenue / revenue) : 0;
    const vatRate = scenario.finance.vatRate ?? 0;

    // Jalon B : Enregistrement des ventes (débit 411 / crédit 701, TVA débit 411 / crédit 4457)
    if (multi && revenue > 0) {
      for (let k = 0; k < gamme.length; k++) {
        const productRevenue = productSegmentRevenue[k]!;
        if (productRevenue > 0) {
          // Vente HT : débit client (411) / crédit vente (701)
          journalByCompany.get(w.state.id)!.record({
            day: 1,
            label: `Vente - ${gamme[k]!.name}`,
            category: "sale",
            debitAccount: "411",
            debitLabel: "Clients",
            creditAccount: "701",
            creditLabel: "Ventes de produits finis",
            amount: productRevenue,
            metadata: {
              productCode: gamme[k]!.code,
              quantity: productSegmentUnits[k],
              unitPrice: w.gamme[k]!.price,
            },
          });
          // TVA facturée si applicable
          if (vatRate > 0) {
            const saleVat = productRevenue * vatRate;
            journalByCompany.get(w.state.id)!.record({
              day: 1,
              label: `TVA facturée - ${gamme[k]!.name}`,
              category: "tax",
              debitAccount: "411",
              debitLabel: "Clients",
              creditAccount: "4457",
              creditLabel: "TVA à payer",
              amount: saleVat,
              metadata: { productCode: gamme[k]!.code },
            });
          }
        }
      }
    }

    const removals = w.productStocks.map((s, k) => removeFromStock(s, productSold[k]!));
    const cogsFromStock = sumExact(removals.map((r) => r.cost));
    // Activité périssable : ce qui n'est pas vendu dans le tour est perdu —
    // la nuit d'hôtel vide, le couvert non servi, l'heure de conseil non
    // facturée ne se reportent pas. Le gâchis est une charge du tour, au même
    // titre qu'un rebut, et le stock final est nul.
    const spoiled = scenario.perishable
      ? sumExact(removals.map((r) => stockValue(r.stock)))
      : 0;
    const finalStocks: StockLot[] = removals.map((r) =>
      scenario.perishable ? { quantity: 0, unitCost: 0 } : r.stock,
    );
    const finalStock = aggregateLot(finalStocks);
    // Coût des ventes : sorties de stock + unités sous-traitées (achetées
    // finies et revendues) + rebuts internes (produits, payés, invendables)
    // + capacité périmée.
    const cogs = cogsFromStock + subcontractCost + w.scrapValue + spoiled;
    const inventoryChange =
      sumExact(finalStocks.map(stockValue)) - sumExact(w.openingStocks.map(stockValue));
    // Achats de matières au coût du fournisseur DE CHAQUE RÉFÉRENCE (mono : le
    // multiplicateur unique, expression historique).
    const productPurchases = w.producedPerProduct.map(
      (q, k) => q * gamme[k]!.materialCostPerUnit * w.materialMultipliers[k]!,
    );
    const purchases = sumExact(productPurchases);

    // Jalon B : Enregistrement des achats (débit 601 + 4452 / crédit 401 montant TTC)
    if (multi && purchases > 0) {
      for (let k = 0; k < gamme.length; k++) {
        if (productPurchases[k]! > 0) {
          const purchaseHt = productPurchases[k]!;
          const purchaseVat = vatRate > 0 ? purchaseHt * vatRate : 0;

          // Enregistrement combiné : débit 601 + 4452 / crédit 401
          // Achat HT
          journalByCompany.get(w.state.id)!.record({
            day: 1,
            label: `Achat matière première - ${gamme[k]!.name}`,
            category: "purchase",
            debitAccount: "601",
            debitLabel: "Achats de matières premières",
            creditAccount: "401",
            creditLabel: "Fournisseurs",
            amount: purchaseHt,
            metadata: {
              productCode: gamme[k]!.code,
              quantity: w.producedPerProduct[k],
              unitPrice: gamme[k]!.materialCostPerUnit * w.materialMultipliers[k]!,
            },
          });
          // TVA déductible si applicable
          if (purchaseVat > 0) {
            journalByCompany.get(w.state.id)!.record({
              day: 1,
              label: `TVA déductible - ${gamme[k]!.name}`,
              category: "tax",
              debitAccount: "4452",
              debitLabel: "TVA déductible",
              creditAccount: "401",
              creditLabel: "Fournisseurs",
              amount: purchaseVat,
              metadata: { productCode: gamme[k]!.code },
            });
          }
        }
      }
    }

    // Délai de règlement fournisseur : celui du fournisseur (mono), ou la
    // moyenne des délais des fournisseurs de chaque référence pondérée par
    // ses achats (gamme).
    const payableRatioOf = (s: import("../types").SupplierDef | null) =>
      Math.min(1, (s?.paymentDelayDays ?? scenario.finance.supplierPaymentDelayDays) / scenario.roundDays);
    const payableRatio = multi
      ? weightedAverage(w.productSuppliers.map(payableRatioOf), productPurchases)
      : payableRatioOf(w.supplier);
    // La sous-traitance est décaissée avec les autres charges variables
    // (cohérence : achats + variables décaissés = coût des ventes + Δ stock).
    const otherVariableCash =
      sumExact(w.producedPerProduct.map((q, k) => q * gamme[k]!.otherVariableCostPerUnit)) +
      subcontractCost;
    // Marketing : somme des budgets par produit (mono : le scalaire), plus le
    // budget de marque quand le levier communication existe.
    const marketingTotal = scenario.communication
      ? sumExact(w.gamme.map((d) => d.marketingBudget)) + w.brandBudget
      : sumExact(w.gamme.map((d) => d.marketingBudget));

    // Prime d'assurance et RH : charges de structure du tour.
    const insurancePremium = w.insured ? (w.chosenFormula?.premiumPerRound ?? 0) : 0;
    const hrCost = w.hr.cost;

    // Jalon B : Enregistrement de la paie (débit 641, 645 / crédit 512)
    if (multi && hrCost > 0 && w.state.headcount > 0) {
      // Salaires bruts (641) : estimé 60% de la masse salariale
      const grossSalaries = hrCost * 0.6;
      if (grossSalaries > 0) {
        journalByCompany.get(w.state.id)!.record({
          day: 1,
          label: "Salaires bruts",
          category: "payroll",
          debitAccount: "641",
          debitLabel: "Salaires et traitements",
          creditAccount: "512",
          creditLabel: "Banque",
          amount: grossSalaries,
          metadata: { employeeCount: w.state.headcount },
        });
      }
      // Cotisations sociales (645) : estimé 40% de la masse salariale
      const socialContributions = hrCost * 0.4;
      if (socialContributions > 0) {
        journalByCompany.get(w.state.id)!.record({
          day: 1,
          label: "Cotisations sociales",
          category: "payroll",
          debitAccount: "645",
          debitLabel: "Cotisations sociales patronales",
          creditAccount: "512",
          creditLabel: "Banque",
          amount: socialContributions,
          metadata: { employeeCount: w.state.headcount },
        });
      }
    }

    // Études achetées (doc 02 §8bis) : l'information se paie — la facture est
    // une charge de structure, le rapport est délivré avec les résultats.
    const studiesPurchased = scenario.studies
      ? (["market", "price", "finance", "project"] as const).filter(
          (k) => w.decisions.studies?.[k],
        )
      : [];
    const studiesCost = studiesPurchased.reduce(
      (sum, k) => sum + scenario.studies![`${k}Cost`],
      0,
    );

    // Échéanciers d'emprunts (doc 02 §6.5) : les échéances sont OBLIGATOIRES,
    // le remboursement décidé est un anticipé facultatif. Sans échéancier au
    // scénario : remboursement libre (comportement historique).
    const scheduled = scenario.finance.loanDurationRounds !== undefined;
    const loans = w.state.loans ?? [];
    const mandatoryRepayment = scheduled
      ? loans.reduce((s, l) => s + Math.min(l.perRound, l.remaining), 0)
      : 0;
    const requestedRepayment = Math.max(0, w.decisions.finance?.loanRepayment ?? 0);
    const earlyRepayment = scheduled
      ? Math.min(requestedRepayment, Math.max(0, w.state.finance.financialDebt - mandatoryRepayment))
      : Math.min(requestedRepayment, w.state.finance.financialDebt);
    // DOSSIER BANCAIRE (scénarios portant un finance.bank). Le plan de
    // trésorerie déposé avec les décisions est la pièce que lit la banque :
    // sans lui, la demande d'emprunt n'est pas instruite. Et la fiabilité des
    // plans passés, résumée dans la confiance, fixe le plafond de découvert
    // consenti ce tour et le taux auquel il est facturé.
    const bank = scenario.finance.bank;
    const confianceAvant = confianceInitiale(w.state);
    // FINANCEMENT VERT (Lot 2B) : le capital-image RSE relève la confiance
    // servie à la banque (borné à 1) — découvert plus large, taux plus doux.
    // Effet DIFFÉRÉ (capital d'ouverture) : un engagement d'aujourd'hui
    // n'améliore les conditions qu'aux tours suivants.
    const rseFinancingBonus = financingTrustBonus(
      w.state.rseImageCapital ?? 0,
      (scenario.rse ?? DEFAULT_RSE_CONFIG).financingTrustBonus,
    );
    const confianceGreen = Math.min(1, confianceAvant + rseFinancingBonus);
    const planFourni = planDepose(w.decisions.forecast);
    const conditions = bank
      ? conditionsBancaires(
          confianceGreen,
          {
            overdraftLimit: scenario.finance.overdraftLimit,
            overdraftAnnualRate: scenario.finance.overdraftAnnualRate,
          },
          bank,
        )
      : {
          overdraftLimit: scenario.finance.overdraftLimit,
          overdraftAnnualRate: scenario.finance.overdraftAnnualRate,
        };
    const loanRequested = Math.max(0, w.decisions.finance?.newLoan ?? 0);
    const newLoan = bank && !planFourni ? 0 : loanRequested;

    // Augmentation de capital : bornée par l'enveloppe TOTALE des associés
    // (scenario.finance.maxCapitalIncreaseTotal) — un apport illimité
    // fausserait le jeu de trésorerie. Sans plafond : comportement historique.
    const requestedCapital = Math.max(0, w.decisions.finance?.capitalIncrease ?? 0);
    const capitalCap = scenario.finance.maxCapitalIncreaseTotal;
    const raisedBefore = w.state.capitalRaised ?? 0;
    const capitalIncrease =
      capitalCap !== undefined
        ? Math.min(requestedCapital, Math.max(0, capitalCap - raisedBefore))
        : requestedCapital;

    // Dividende : borné par les RÉSERVES, les bénéfices des tours passés non
    // encore distribués. Le résultat du tour en cours n'en fait pas partie, il
    // n'est pas connu quand la décision se prend. La caisse, elle, n'est pas
    // un plafond : une entreprise rentable peut ne pas avoir de quoi payer, et
    // c'est précisément la leçon du niveau. Le découvert et ses garde-fous
    // s'appliquent alors comme pour toute autre sortie.
    const reservesBefore = w.state.reserves ?? 0;
    const dividend = Math.min(
      Math.max(0, w.decisions.finance?.dividend ?? 0),
      Math.max(0, reservesBefore),
    );

    // Faillite (#5) : une entreprise défaillante est DORMANTE, pas seulement
    // muette. Geler la seule production tout en laissant courir les charges de
    // structure et les intérêts la ferait perdre PLUS vite qu'en continuant —
    // l'inverse d'une cessation d'activité. On neutralise donc aussi ses charges
    // passives (structure, amortissements, intérêts) : ses capitaux propres se
    // figent jusqu'à recapitalisation. Le remboursement d'emprunt est neutre sur
    // les capitaux propres (cash ET dette baissent) mais on le suspend aussi,
    // une entreprise à l'arrêt ne décaissant plus rien.
    const gelee = w.state.status === "defaillant";
    const finance = computeFinance({
      opening: w.state.finance,
      roundDays: scenario.roundDays,
      revenue,
      receivableRatio,
      purchases,
      payableRatio,
      otherVariableCash,
      inventoryChange,
      cogs,
      commissionCost,
      marketingCost: marketingTotal,
      qualityCost: w.qualityTotal,
      maintenanceCost: w.decisions.maintenanceBudget,
      // Faillite : entreprise gelée, aucune dépense — donc pas d'engagement RSE.
      rseCost: gelee ? 0 : w.rseCost,
      // R&D : ligne et flux absents sans levier (rdTotal = 0).
      ...(w.rdTotal > 0 ? { rdCost: w.rdTotal } : {}),
      // Cartes RSE à effet trésorerie (Lot 2C.2) : amende / éco-subvention.
      exceptionalCharge: gelee ? 0 : w.mods.oneOffCharge,
      exceptionalIncome: gelee ? 0 : w.mods.oneOffIncome,
      fixedCosts: gelee ? 0 : scenario.fixedCostsPerRound + insurancePremium + hrCost + studiesCost,
      // amortissements : base du scénario + investissements en service
      // (y compris celui mis en service ce tour) OU amortissement du parc typé
      depreciation: gelee
        ? 0
        : scenario.equipment
          ? w.equipDepreciation
          : scenario.finance.depreciationPerRound +
            (w.state.extraDepreciationPerRound ?? 0) +
            (w.state.pendingDepreciationPerRound ?? 0),
      loanAnnualRate: gelee ? 0 : scenario.finance.loanAnnualRate,
      overdraftAnnualRate: gelee ? 0 : conditions.overdraftAnnualRate,
      interestMultiplier: w.mods.interestMultiplier,
      taxRate: scenario.finance.taxRate,
      openingTaxLossCarryforward: w.state.taxLossCarryforward ?? 0,
      vatRate: scenario.finance.vatRate ?? 0,
      newLoan,
      loanRepayment: gelee ? 0 : mandatoryRepayment + earlyRepayment,
      capitalIncrease,
      dividend,
      investmentOutlay: w.investOutlay - w.equipSaleProceeds,
      disposalLoss: w.equipDisposalLoss,
      ...(scenario.treasury
        ? {
            treasury: {
              discountRequest: Math.max(0, w.decisions.treasury?.discount ?? 0),
              factoringRequest: Math.max(0, w.decisions.treasury?.factoring ?? 0),
              discountAnnualRate: scenario.treasury.discountAnnualRate,
              discountMaxShare: scenario.treasury.discountMaxShare,
              factoringFeeRate: scenario.treasury.factoringFeeRate,
              forcedFactoringFeeRate: scenario.treasury.forcedFactoringFeeRate,
              overdraftLimit: conditions.overdraftLimit,
              placementRequest: Math.max(0, w.decisions.treasury?.placement ?? 0),
              placementAnnualRate: scenario.treasury.placementAnnualRate,
            },
          }
        : {}),
    });

    const gap = balanceGap(finance.closing);
    if (Math.abs(gap) > 0.01) {
      throw new Error(`Bilan déséquilibré (${gap.toFixed(4)} €) pour ${w.state.id}`);
    }

    // Jalon B : Enregistrement de la dépréciation (débit 681 / crédit 2185)
    const depreciationAmount = finance.incomeStatement.depreciation;
    if (multi && depreciationAmount > 0) {
      journalByCompany.get(w.state.id)!.record({
        day: 1,
        label: "Amortissement des immobilisations",
        category: "depreciation",
        debitAccount: "681",
        debitLabel: "Dotations aux amortissements - immobilisations corporelles",
        creditAccount: "2185",
        creditLabel: "Amortissements des installations, machines et outillage",
        amount: depreciationAmount,
      });
    }

    // Jalon B : Enregistrement des frais financiers (débit 661 / crédit 512)
    const interest = finance.incomeStatement.interest;
    if (multi && interest > 0) {
      journalByCompany.get(w.state.id)!.record({
        day: 1,
        label: "Intérêts d'emprunts",
        category: "financing",
        debitAccount: "661",
        debitLabel: "Charges d'intérêts",
        creditAccount: "512",
        creditLabel: "Banque",
        amount: interest,
      });
    }

    // Jalon B : Enregistrement des nouveaux emprunts (débit 512 / crédit 16)
    if (multi && newLoan > 0) {
      journalByCompany.get(w.state.id)!.record({
        day: 1,
        label: "Nouvel emprunt",
        category: "financing",
        debitAccount: "512",
        debitLabel: "Banque",
        creditAccount: "16",
        creditLabel: "Emprunts et dettes assimilées",
        amount: newLoan,
      });
    }

    // Échéanciers du tour suivant : échéances prélevées, anticipé imputé
    // séquentiellement, nouvel emprunt à la durée standard (1re échéance à t+1).
    let nextLoans = w.state.loans;
    let nextMandatory = 0;
    if (scheduled && !gelee) {
      let earlyLeft = earlyRepayment;
      nextLoans = loans
        .map((l) => {
          const afterMandatory = l.remaining - Math.min(l.perRound, l.remaining);
          const applied = Math.min(earlyLeft, afterMandatory);
          earlyLeft -= applied;
          return { remaining: afterMandatory - applied, perRound: l.perRound };
        })
        .filter((l) => l.remaining > 0.005);
      if (newLoan > 0) {
        nextLoans = [
          ...nextLoans,
          { remaining: newLoan, perRound: newLoan / scenario.finance.loanDurationRounds! },
        ];
      }
      nextMandatory = nextLoans.reduce((s, l) => s + Math.min(l.perRound, l.remaining), 0);
    }

    // Faillite (V2 couche 2, #5) : cessation de paiements = crise de trésorerie
    // CARACTÉRISÉE (découvert au-delà du plafond ET plus aucune créance à céder,
    // finance.treasury.crisis). On ne s'appuie QUE sur ce signal : un scénario
    // sans bloc `treasury` ne modélise aucun mécanisme de cessation de paiements
    // dure (ni affacturage forcé ni crise) — y déclarer une faillite sur un
    // simple dépassement de découvert « autorisé » confondrait un pilotage
    // agressif avec l'insolvabilité. Deux tours consécutifs → défaillance ; le
    // compteur retombe à zéro dès qu'un tour repasse sous le plafond (une
    // recapitalisation, par exemple), ce qui dégèle l'entreprise.
    const enCessationDePaiements = finance.treasury.crisis;
    const crisisStreak = enCessationDePaiements ? (w.state.crisisStreak ?? 0) + 1 : 0;
    const statut: "active" | "defaillant" = crisisStreak >= 2 ? "defaillant" : "active";

    const functionalBalance = computeFunctionalBalance(finance.closing);
    // Le plan de CE tour n'est jugeable qu'une fois le tour joué : sa
    // fiabilité fixe les conditions du tour SUIVANT, jamais celles du tour en
    // cours, qui ont été consenties sur la foi des tours passés.
    const fiabilite = bank
      ? fiabiliteDuPlan({
          expectedUnits: w.decisions.forecast?.expectedUnits,
          expectedCash: w.decisions.forecast?.expectedCash,
          soldUnits,
          netTreasury: functionalBalance.netTreasury,
          cashScale: scenario.fixedCostsPerRound,
        })
      : null;
    const confianceApres = bank
      ? confianceSuivante(confianceAvant, fiabilite, bank)
      : confianceAvant;
    const ratios = computeRatios(
      finance.incomeStatement,
      finance.closing,
      scenario.finance.taxRate,
    );
    // Seuil : charges de structure du tour = fixes + assurance + amortissements
    // + budgets discrétionnaires (la prime déplace le seuil : c'est le point).
    const structureCosts =
      scenario.fixedCostsPerRound +
      insurancePremium +
      hrCost +
      studiesCost +
      finance.incomeStatement.depreciation +
      marketingTotal +
      w.qualityTotal +
      w.rdTotal +
      w.decisions.maintenanceBudget;
    // Seuil : en gamme, prix moyen pondéré par les unités vendues et coût
    // variable moyen pondéré par les unités produites (mono : les valeurs du
    // produit unique, sans recomposition).
    const breakeven = computeBreakeven({
      fixedCosts: structureCosts,
      price: weightedAverage(
        w.gamme.map((d) => d.price),
        productSegmentUnits,
      ),
      uvc: weightedAverage(w.unitCosts, w.producedPerProduct),
      revenue,
    });

    // Part de marché : ventes sur le marché adressable uniquement (les
    // commandes fermes s'ajoutent au CA sans gonfler la part de marché).
    const totalShare = totalPotential > 0 ? segmentUnits / totalPotential : 0;
    totalSold += soldUnits;
    // Abonnement : le portefeuille de clôture ouvre le tour suivant — les
    // adhérents servis plus les nouveaux venus du marché (les commandes
    // fermes et l'offre du tour sont des contrats d'un tour, hors portefeuille).
    const subClosing = scenario.subscription && !dormant ? w.subServed + productSegmentUnits[0]! : 0;

    // Qualité perçue de fin de tour, PAR RÉFÉRENCE. Le bonus qualité du
    // fournisseur s'applique à la qualité PRODUITE ce tour, avant lissage — et
    // non en addition APRÈS l'inertie. Ajouté après, il se composait :
    // `previous` contenant déjà le bonus des tours passés, l'effet réel valait
    // bonus/(1-inertie) au point fixe (×2,5 en nova) et persistait plusieurs
    // tours après un changement de fournisseur. Fondu dans le produit, l'effet
    // à l'équilibre vaut exactement le bonus, et il décroît normalement par
    // inertie dès qu'on quitte le fournisseur. (Mono : le produit unique et
    // le fournisseur scalaire — expression historique.)
    // Le niveau technique acquis (R&D) s'ajoute de même, sur le capital
    // d'OUVERTURE : effet différé, comme l'image RSE. Sans levier R&D : 0,
    // expression historique.
    const productNextPerceived = w.productPerceived.map((previous, k) =>
      updatePerceivedQuality(
        previous,
        w.productQuality[k]! +
          (w.productSuppliers[k]?.qualityBonus ?? 0) +
          (w.productRdOpening[k]?.techLevel ?? 0),
        scenario.production.qualityInertia,
      ),
    );

    results[w.state.id] = {
      companyId: w.state.id,
      ...(statut === "defaillant" ? { defaillant: true } : {}),
      // R&D en mono-produit : budget et niveau technique du produit unique.
      ...(scenario.rd && !multi
        ? { rd: { budget: w.gamme[0]!.rdBudget, techLevel: w.productRdNext[0]!.techLevel } }
        : {}),
      // Communication : l'axe, la marque, la notoriété, l'adéquation par segment.
      ...(scenario.communication
        ? {
            communication: {
              axis: w.communicationAxis ?? null,
              brandBudget: w.brandBudget,
              brandAwareness: w.brandNext,
              fitBySegment: w.axisFitBySegment,
            },
          }
        : {}),
      incomeStatement: finance.incomeStatement,
      balanceSheet: finance.closing,
      cashFlow: finance.cashFlow,
      functionalBalance,
      ratios,
      market: { bySegment: perSegment, totalShare },
      // Abonnement : le portefeuille du tour, émis SEULEMENT avec le modèle.
      ...(scenario.subscription
        ? {
            subscription: {
              opening: w.subOpening,
              churnRate: w.subChurnRate,
              churned: w.subOpening - w.subRetained,
              retained: w.subServed,
              unserved: w.subRetained - w.subServed,
              newMembers: dormant ? 0 : productSegmentUnits[0]!,
              closing: subClosing,
              occupancy: w.subOccupancy,
              retainedRevenue,
            },
          }
        : {}),
      production: {
        planned: sumExact(w.gamme.map((d) => d.productionPlan)),
        produced: w.produced,
        machineCapacity: w.machineCapacity,
        laborCapacity: w.laborCapacity,
        utilizationRate: w.utilizationRate,
        producedQuality: w.producedQuality,
      },
      breakeven,
      // Gamme : détail par produit, émis SEULEMENT en multi-produits — le
      // résultat sérialisé d'une partie mono-produit ne change pas.
      ...(multi
        ? {
            products: Object.fromEntries(
              gamme.map((product, k) => [
                product.code,
                {
                  planned: w.gamme[k]!.productionPlan,
                  produced: w.producedPerProduct[k]!,
                  defectUnits: w.productDefectUnits[k]!,
                  unitVariableCost: w.unitCosts[k]!,
                  price: w.gamme[k]!.price,
                  marketingBudget: w.gamme[k]!.marketingBudget,
                  qualityBudget: w.gamme[k]!.qualityBudget,
                  producedQuality: w.productQuality[k]!,
                  perceivedQuality: productNextPerceived[k]!,
                  ...(w.productSuppliers[k]
                    ? {
                        supplier: {
                          code: w.productSuppliers[k]!.code,
                          name: w.productSuppliers[k]!.name,
                          costMultiplier: w.productSuppliers[k]!.costMultiplier,
                          qualityBonus: w.productSuppliers[k]!.qualityBonus,
                          supplyDisruption: w.productDisruptions[k]!,
                        },
                      }
                    : {}),
                  ...(w.productRdNext[k]
                    ? {
                        rd: {
                          budget: w.gamme[k]!.rdBudget,
                          techLevel: w.productRdNext[k]!.techLevel,
                          ...(product.development
                            ? {
                                development: {
                                  cost: product.development.cost,
                                  availableFromRound: product.development.availableFromRound ?? 1,
                                  invested: w.productRdNext[k]!.invested,
                                  launched: w.productRdNext[k]!.launched,
                                  ...(w.productRdNext[k]!.launchRound !== undefined
                                    ? { launchRound: w.productRdNext[k]!.launchRound }
                                    : {}),
                                },
                              }
                            : {}),
                        },
                      }
                    : {}),
                  // Les ventes de la référence : son marché, plus les commandes
                  // fermes (première référence) et la commande exceptionnelle
                  // (la référence qu'elle nomme), au prix de chacune.
                  sold: productSold[k]!,
                  lost: productLost[k]!,
                  revenue:
                    productSegmentRevenue[k]! +
                    (k === 0 ? (orderDelivered + subcontracted) * orderUnitPrice : 0) +
                    (k === offerIndex ? offerRevenue : 0) +
                    (scenario.subscription && k === 0 ? retainedRevenue : 0),
                  stock: finalStocks[k]!,
                  segments: product.market.segments.map((s) => s.code),
                },
              ]),
            ),
          }
        : {}),
      ...(orderRequested > 0
        ? {
            extraOrders: {
              requested: orderRequested,
              delivered: orderDelivered,
              subcontracted,
              unitPrice: orderUnitPrice,
            },
          }
        : {}),
      ...(studiesPurchased.length > 0
        ? { studies: { purchased: [...studiesPurchased], cost: studiesCost } }
        : {}),
      ...(capitalCap !== undefined && requestedCapital > 0
        ? {
            capital: {
              requested: requestedCapital,
              applied: capitalIncrease,
              remainingAfter: Math.max(0, capitalCap - raisedBefore - capitalIncrease),
            },
          }
        : {}),
      ...(roundOffer
        ? {
            orderOffer: {
              code: roundOffer.code,
              title: roundOffer.title,
              accepted: offerAccepted,
              delivered: offerDelivered,
              unitPrice: roundOffer.price,
              revenue: offerRevenue,
              paymentDelayDays: roundOffer.paymentDelayDays,
              onCredit: offerRevenue * offerCreditShare,
              ...(gamme.length > 1 ? { productCode: gamme[offerIndex]!.code } : {}),
            },
          }
        : {}),
      ...(w.investOutlay > 0 || w.equipSold.length > 0
        ? {
            investment: {
              capacityUnits: w.investUnits,
              outlay: w.investOutlay,
              ...(w.equipBought.length > 0 ? { bought: w.equipBought } : {}),
              ...(w.equipSold.length > 0 ? { sold: w.equipSold } : {}),
              ...(w.equipSaleProceeds > 0 ? { saleProceeds: w.equipSaleProceeds } : {}),
              ...(w.equipDisposalLoss > 0 ? { disposalLoss: w.equipDisposalLoss } : {}),
            },
          }
        : {}),
      ...(scheduled
        ? {
            debt: {
              mandatoryRepayment,
              earlyRepayment,
              newLoan,
              outstanding: finance.closing.financialDebt,
              nextMandatory,
            },
          }
        : {}),
      ...(scenario.treasury &&
      (finance.treasury.discounted > 0 ||
        finance.treasury.factored > 0 ||
        finance.treasury.forcedFactored > 0 ||
        finance.treasury.placed > 0 ||
        finance.treasury.matured > 0 ||
        finance.treasury.crisis)
        ? { treasury: finance.treasury }
        : {}),
      ...(scenario.qualityCosts
        ? {
            qualityCosts: {
              prevention: w.qualityTotal,
              internalFailure: w.scrapValue,
              externalFailure: refund,
              defectUnits: w.defectUnits,
              returnedUnits,
            },
          }
        : {}),
      // Engagement RSE (Lot 2) : présent dès qu'on dépense OU qu'un capital
      // court encore (l'effet différé se lit même sans dépense ce tour).
      ...(w.rseCost > 0 || w.rseNextImageCapital > 0 || w.rseNextCleanCapital > 0
        ? {
            rse: {
              budget: w.rseBudget,
              investment: w.rseInvestment,
              imageCapital: w.rseNextImageCapital,
              cleanCapital: w.rseNextCleanCapital,
              imageFactor: w.rseImageFactor,
              defectReduction: w.rseDefectReduction,
              financingBonus: rseFinancingBonus,
              attritionRelief: w.rseAttritionRelief,
            },
          }
        : {}),
      ...(w.insured
        ? {
            insurance: {
              premium: insurancePremium,
              ...(w.chosenFormula && w.chosenFormula.code !== "default"
                ? { formulaCode: w.chosenFormula.code }
                : {}),
              neutralizedEvents: w.neutralizedEvents,
            },
          }
        : {}),
      ...(w.supplier
        ? {
            supplier: {
              code: w.supplier.code,
              name: w.supplier.name,
              costMultiplier: w.supplier.costMultiplier,
              qualityBonus: w.supplier.qualityBonus,
              supplyDisruption: w.supplyDisruption,
            },
          }
        : {}),
      ...(w.hrRelevant
        ? {
            hr: {
              headcount: w.state.headcount,
              hired: w.hr.hired,
              fired: w.hr.fired,
              departed: w.hr.departed,
              trainingBudget: w.hr.trainingBudget,
              salaryIndex: w.hr.salaryIndex,
              cost: hrCost,
              nextHeadcount: w.hr.nextHeadcount,
            },
          }
        : {}),
      ...(bank
        ? {
            bank: {
              trustBefore: confianceAvant,
              trustAfter: confianceApres,
              reliability: fiabilite,
              planFiled: planFourni,
              loanRequested,
              loanGranted: newLoan,
              overdraftLimit: conditions.overdraftLimit,
              overdraftAnnualRate: conditions.overdraftAnnualRate,
            },
          }
        : {}),
      kpis: {
        revenue,
        net_income: finance.incomeStatement.netIncome,
        cash: finance.closing.cash,
        net_treasury: functionalBalance.netTreasury,
        frng: functionalBalance.frng,
        bfr: functionalBalance.bfr,
        inventory_value: finance.closing.inventoryValue,
        receivables: finance.closing.receivables,
        payables: finance.closing.payables,
        market_share: totalShare,
        utilization_rate: w.utilizationRate,
        // Le carnet KPI est un Record<string, number> (persisté en base, où les
        // non-finis étaient déjà repliés sur 0) : un seuil inexistant s'y note 0.
        break_even_units: breakeven.breakEvenUnits ?? 0,
        safety_margin: breakeven.safetyMargin ?? 0,
        roe: ratios.returnOnEquity,
        roce: ratios.returnOnCapitalEmployed,
      },
      // Journal comptable (Jalon B du plan fondation comptable) : présent
      // SEULEMENT en multi-produits pour non-régression des snapshots mono.
      ...(multi ? { accounting: journalByCompany.get(w.state.id)!.build() } : {}),
    };

    const lastMarketShare: Record<string, number> = {};
    for (const product of gamme) {
      for (const segment of product.market.segments) {
        lastMarketShare[segment.code] = perSegment[segment.code]?.share ?? 0;
      }
    }
    // Mise à jour du parc et de la capacité machine pour le prochain tour.
    const nextFleetState = scenario.equipment
      ? {
          machineCapacity: fleetCapacity(
            w.equipNewFleet,
            new Map(scenario.equipment.types.map((t) => [t.code, t])),
          ),
          fleet: w.equipNewFleet,
          pendingFleet: w.equipPendingFleet,
          pendingCapacity: undefined,
          extraDepreciationPerRound: undefined,
          pendingDepreciationPerRound: undefined,
        }
      : {
          machineCapacity: w.state.machineCapacity + (w.state.pendingCapacity ?? 0),
          pendingCapacity: w.investUnits,
          extraDepreciationPerRound:
            (w.state.extraDepreciationPerRound ?? 0) + (w.state.pendingDepreciationPerRound ?? 0),
          pendingDepreciationPerRound: scenario.investment
            ? w.investOutlay / scenario.investment.depreciationRounds
            : 0,
        };
    nextCompanies.push({
      ...w.state,
      headcount: w.hr.nextHeadcount,
      productivity: w.hr.nextProductivity,
      ...nextFleetState,
      ...(scheduled ? { loans: nextLoans } : {}),
      ...(capitalIncrease > 0 || w.state.capitalRaised !== undefined
        ? { capitalRaised: raisedBefore + capitalIncrease }
        : {}),
      // Les réserves suivent le résultat et les distributions. Elles sont
      // tenues pour TOUTES les parties, même celles où le dividende n'est pas
      // ouvert : une partie qui passerait au niveau 6 en cours de route
      // trouverait sinon des réserves vides malgré ses bénéfices.
      reserves: reservesBefore + finance.incomeStatement.netIncome - dividend,
      // Faillite : statut et compteur de crise portés au tour suivant. Suivis
      // seulement dès qu'une crise apparaît (puis maintenus) — les parties sans
      // crise n'en portent jamais le champ, snapshot inchangé en régime nominal.
      ...(statut === "defaillant" || w.state.status !== undefined ? { status: statut } : {}),
      ...(crisisStreak > 0 || w.state.crisisStreak !== undefined ? { crisisStreak } : {}),
      // Déficit reportable : suivi seulement à partir du moment où une perte
      // apparaît (puis maintenu, même retombé à 0). Les parties sans perte n'en
      // portent jamais le champ — snapshot inchangé pour le cas courant.
      ...(finance.taxLossCarryforward > 0 || w.state.taxLossCarryforward !== undefined
        ? { taxLossCarryforward: finance.taxLossCarryforward }
        : {}),
      ...(bank ? { bankTrust: confianceApres } : {}),
      // Capitaux RSE (Lot 2) : suivis seulement dès qu'un capital existe (puis
      // maintenus, même retombés à 0 par inertie) — les parties sans engagement
      // n'en portent jamais le champ, snapshot inchangé en régime nominal.
      ...(w.rseNextImageCapital > 0 || w.state.rseImageCapital !== undefined
        ? { rseImageCapital: w.rseNextImageCapital }
        : {}),
      ...(w.rseNextCleanCapital > 0 || w.state.rseCleanCapital !== undefined
        ? { rseCleanCapital: w.rseNextCleanCapital }
        : {}),
      // Gamme : chaque référence suit sa propre qualité perçue ; celle de
      // l'entreprise en est la moyenne pondérée par les unités produites.
      perceivedQuality: multi
        ? weightedAverage(productNextPerceived, w.producedPerProduct)
        : productNextPerceived[0]!,
      ...(multi
        ? {
            perceivedQualityByProduct: Object.fromEntries(
              gamme.map((product, k) => [product.code, productNextPerceived[k]!]),
            ),
          }
        : {}),
      // R&D : l'état de chaque référence, émis SEULEMENT avec le levier.
      ...(scenario.rd
        ? {
            rdByProduct: Object.fromEntries(
              gamme.map((product, k) => [product.code, w.productRdNext[k]!]),
            ),
          }
        : {}),
      // Communication : notoriété et axe tenu, émis SEULEMENT avec le levier.
      ...(scenario.communication
        ? {
            brandAwareness: w.brandNext,
            ...(w.communicationAxis !== undefined ? { lastCommunicationAxis: w.communicationAxis } : {}),
          }
        : {}),
      availability: updateAvailability({
        current: w.state.availability,
        maintenanceBudget: w.decisions.maintenanceBudget,
        maintenanceReference: scenario.production.maintenanceReference * (
          scenario.equipment
            ? fleetMaintenanceMultiplier(
                mergeFleet(w.state.fleet ?? [], w.state.pendingFleet ?? []),
                new Map(scenario.equipment.types.map((t) => [t.code, t])),
              )
            : 1
        ),
        availabilityDecay: scenario.production.availabilityDecay,
        availabilityFloor: scenario.production.availabilityFloor,
      }),
      finishedGoods: finalStock,
      // Gamme : stocks par produit, émis SEULEMENT en multi-produits.
      ...(multi
        ? {
            finishedGoodsByProduct: Object.fromEntries(
              gamme.map((product, k) => [product.code, finalStocks[k]!]),
            ),
          }
        : {}),
      finance: finance.closing,
      lastMarketShare,
      // Abonnement : le portefeuille de clôture, émis SEULEMENT avec le modèle.
      ...(scenario.subscription ? { members: subClosing } : {}),
    });
  });

  return {
    companies: nextCompanies,
    results,
    market: { potentialBySegment, totalSold },
    events: tickEvents(active),
    newEvents: drawn,
  };
}
