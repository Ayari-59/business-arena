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
import { computePotentialDemand } from "../market/demand";
import { attractionScore } from "../market/attraction";
import { allocateShares } from "../market/allocation";
import {
  computeProducedQuality,
  computeProduction,
  updateAvailability,
  updatePerceivedQuality,
} from "../production";
import { addToStock, removeFromStock, stockValue } from "../inventory/cump";
import { computeHr } from "../hr";
import { unitVariableCost } from "../costs";
import { computeBreakeven } from "../costs/breakeven";
import { balanceGap, computeFinance } from "../finance/statements";
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

  // 1. Événements : tirage + poursuite des événements actifs (doc 02 §7).
  const { active, drawn } = drawEvents(
    scenario,
    roundIndex,
    input.companies,
    input.activeEvents,
    rng,
  );
  const marketMods = effectiveModifiers(
    active.filter((e) => e.scope === "market"),
    "",
  );

  // 2. Demande potentielle du marché par segment (doc 02 §3.1).
  const potentialBySegment: Record<string, number> = {};
  for (const segment of scenario.market.segments) {
    potentialBySegment[segment.code] = computePotentialDemand(
      segment,
      roundIndex,
      scenario.market.seasonality,
      demandMultiplierFor(marketMods, segment.code),
    );
  }

  // 3. Production, qualité et stock disponible par entreprise (doc 02 §4-5).
  interface Working {
    state: CompanyState;
    decisions: Required<Pick<import("../types").RoundDecisions, "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "maintenanceBudget">> &
      import("../types").RoundDecisions;
    produced: number;
    machineCapacity: number;
    laborCapacity: number;
    utilizationRate: number;
    producedQuality: number;
    unitCost: number;
    stock: { quantity: number; unitCost: number };
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
    supplierQualityBonus: number;
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
            forecast: undefined,
            finance: soumis.finance?.capitalIncrease
              ? { capitalIncrease: soumis.finance.capitalIncrease }
              : undefined,
          }
        : soumis;
    const decisions = {
      price: raw.price,
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
    };
    // RH (doc 02 §4.1) : morale du tour, coûts, mouvements d'effectif à t+1.
    const hr = computeHr({
      config: scenario.hr,
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
    // Fournisseur choisi (doc 02 §5bis) : coût, qualité, risque de rupture
    const suppliers = scenario.suppliers;
    const supplier = suppliers
      ? (suppliers.find((s) => s.code === decisions.supplierChoice) ?? suppliers[0]!)
      : null;
    const supplierCostMul = supplier?.costMultiplier ?? 1;
    const supplierQualityBonus = supplier?.qualityBonus ?? 0;
    const supplyDisruption = supplier && supplier.supplyRiskProbability > 0
      ? rng.next() < supplier.supplyRiskProbability
      : false;
    const supplyAvailabilityHit = supplyDisruption ? (supplier?.supplyRiskAvailabilityHit ?? 1) : 1;
    // Capacité machine : soit calculée du parc typé, soit homogène (legacy).
    const effectiveMachineCapacity = scenario.equipment
      ? fleetCapacity(
          mergeFleet(state.fleet ?? [], state.pendingFleet ?? []),
          new Map(scenario.equipment.types.map((t) => [t.code, t])),
        )
      : state.machineCapacity + (state.pendingCapacity ?? 0);
    const production = computeProduction({
      planned: decisions.productionPlan,
      machineCapacity: effectiveMachineCapacity,
      availability: state.availability * mods.availabilityMultiplier * supplyAvailabilityHit,
      headcount: state.headcount,
      hoursPerEmployee: state.hoursPerEmployee,
      productivity: state.productivity * hr.morale,
      hoursPerUnit: scenario.product.hoursPerUnit,
    });
    const producedQuality = computeProducedQuality({
      qualityBudget: decisions.qualityBudget,
      qualitySensitivity: scenario.production.qualitySensitivity,
      qualityScale: scenario.production.qualityScale,
      utilizationRate: production.utilizationRate,
      overheatThreshold: scenario.production.overheatThreshold,
    });
    const materialMultiplier = mods.materialCostMultiplier * supplierCostMul;
    const unitCost = unitVariableCost(
      scenario.product.materialCostPerUnit * materialMultiplier,
      scenario.product.otherVariableCostPerUnit,
    );
    // Non-qualité interne (doc 02 §4.2) : rebuts fonction de la qualité
    // produite — payés (matières, MOD) mais invendables : seul le net entre
    // en stock, la perte est valorisée au coût variable.
    const defectRate = scenario.qualityCosts
      ? Math.min(0.5, Math.max(0, scenario.qualityCosts.baseDefectRate * (2 - producedQuality)))
      : 0;
    const defectUnits = production.produced * defectRate;
    const netProduced = production.produced - defectUnits;
    const scrapValue = defectUnits * unitCost;
    const stock = addToStock(state.finishedGoods, netProduced, unitCost);
    // --- Investissement capacitaire ---
    // Deux systèmes : homogène (legacy) ou typé (equipment).
    const equip = scenario.equipment;
    let investUnits = 0;
    let investOutlay = 0;
    let equipBought: Working["equipBought"] = [];
    let equipSold: Working["equipSold"] = [];
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
    return {
      state,
      decisions,
      produced: production.produced,
      machineCapacity: production.machineCapacity,
      laborCapacity: production.laborCapacity,
      utilizationRate: production.utilizationRate,
      producedQuality,
      unitCost,
      stock,
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
      supplierQualityBonus,
    };
  });

  // 4. Marché : attraction → parts → demande adressée → ventes contraintes
  //    par le stock (doc 02 §3.2-3.4).
  const salesBySegment = new Map<string, SegmentSalesDetail[]>();
  for (const segment of scenario.market.segments) {
    const attractions = working.map((w) =>
      attractionScore({
        price: w.decisions.price,
        marketingBudget: w.decisions.marketingBudget,
        perceivedQuality: w.state.perceivedQuality,
        lastShare: w.state.lastMarketShare[segment.code] ?? 0,
        segment,
        marketingScale: scenario.marketing.scale,
      }),
    );
    const shares = allocateShares(
      attractions,
      segment.competitionIntensity ?? scenario.market.competitionIntensity,
      scenario.market.outsideAttraction,
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

  // Contrainte de stock : ventes limitées au stock, réparties au prorata des segments.
  working.forEach((w, i) => {
    const demands = scenario.market.segments.map(
      (s) => salesBySegment.get(s.code)?.[i]?.demandForCompany ?? 0,
    );
    const totalDemand = demands.reduce((a, b) => a + b, 0);
    const available = w.stock.quantity;
    const serviceRate = totalDemand > 0 ? Math.min(1, available / totalDemand) : 0;
    scenario.market.segments.forEach((s) => {
      const detail = salesBySegment.get(s.code)?.[i];
      if (!detail) return;
      detail.sold = detail.demandForCompany * serviceRate;
      detail.lost = detail.demandForCompany - detail.sold;
      detail.revenue = detail.sold * w.decisions.price;
      detail.commission = detail.revenue * (s.commissionRate ?? 0);
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
    const perSegment: Record<string, SegmentSalesDetail> = {};
    let segmentUnits = 0;
    let weightedCredit = 0;
    let commissionCost = 0;
    for (const segment of scenario.market.segments) {
      const detail = salesBySegment.get(segment.code)?.[i];
      if (!detail) continue;
      perSegment[segment.code] = detail;
      segmentUnits += detail.sold;
      commissionCost += detail.commission;
      weightedCredit +=
        detail.sold * Math.min(1, segment.paymentDelayDays / scenario.roundDays);
    }
    // Commandes fermes (événement « order ») : vendues d'office en plus du
    // marché, réglées comptant, au prix imposé le cas échéant. Livrées du
    // stock restant ; au-delà, sous-traitées si l'offre le permet et que le
    // scénario a un sous-traitant (coût unitaire majoré — coûts pertinents !).
    const orderRequested = w.mods.extraOrderUnits;
    const orderDelivered = Math.min(orderRequested, Math.max(0, w.stock.quantity - segmentUnits));
    const orderShortfall = orderRequested - orderDelivered;
    const subcontracted = scenario.subcontracting
      ? Math.min(orderShortfall, w.mods.orderSubcontractMax)
      : 0;
    const subcontractCost = subcontracted * (scenario.subcontracting?.unitCost ?? 0);
    const orderUnitPrice = w.mods.orderUnitPrice ?? w.decisions.price;

    // Commande exceptionnelle acceptée : livrée du stock restant après le
    // marché et les commandes fermes (pas de sous-traitance — à prendre avec
    // ses moyens). Son délai de règlement décide de la part du CA qui part
    // en créances : rentabilité contre BFR, l'arbitrage est là.
    const offerAccepted = Boolean(roundOffer && w.decisions.acceptOrder);
    const offerDelivered =
      offerAccepted && roundOffer
        ? Math.min(
            roundOffer.units,
            Math.max(0, w.stock.quantity - segmentUnits - orderDelivered),
          )
        : 0;
    const offerRevenue = offerDelivered * (roundOffer?.price ?? 0);
    const offerCreditShare = roundOffer
      ? Math.min(1, roundOffer.paymentDelayDays / scenario.roundDays)
      : 0;

    // Non-qualité externe : retours clients fonction de la qualité perçue,
    // remboursés au prix de vente (unités détruites — la marge part entière).
    const returnedUnits = scenario.qualityCosts
      ? segmentUnits *
        Math.min(
          0.3,
          scenario.qualityCosts.externalReturnSensitivity *
            Math.max(0, 1 - w.state.perceivedQuality),
        )
      : 0;
    const refund = returnedUnits * w.decisions.price;

    const soldUnits = segmentUnits + orderDelivered + offerDelivered;
    const revenue =
      segmentUnits * w.decisions.price +
      (orderDelivered + subcontracted) * orderUnitPrice +
      offerRevenue -
      refund;
    // Part du CA à crédit, en euros : segments à leurs délais, commandes
    // fermes d'événement comptant, commande exceptionnelle à SON délai.
    const creditRevenue =
      weightedCredit * w.decisions.price + offerRevenue * offerCreditShare;
    const receivableRatio = revenue > 0 ? Math.min(1, creditRevenue / revenue) : 0;

    const { stock: stockAfterSales, cost: cogsFromStock } = removeFromStock(w.stock, soldUnits);
    // Activité périssable : ce qui n'est pas vendu dans le tour est perdu —
    // la nuit d'hôtel vide, le couvert non servi, l'heure de conseil non
    // facturée ne se reportent pas. Le gâchis est une charge du tour, au même
    // titre qu'un rebut, et le stock final est nul.
    const spoiled = scenario.perishable ? stockValue(stockAfterSales) : 0;
    const finalStock = scenario.perishable ? { quantity: 0, unitCost: 0 } : stockAfterSales;
    // Coût des ventes : sorties de stock + unités sous-traitées (achetées
    // finies et revendues) + rebuts internes (produits, payés, invendables)
    // + capacité périmée.
    const cogs = cogsFromStock + subcontractCost + w.scrapValue + spoiled;
    const inventoryChange = stockValue(finalStock) - stockValue(w.state.finishedGoods);
    const purchases =
      w.produced * scenario.product.materialCostPerUnit * w.materialMultiplier;
    // La sous-traitance est décaissée avec les autres charges variables
    // (cohérence : achats + variables décaissés = coût des ventes + Δ stock).
    const otherVariableCash =
      w.produced * scenario.product.otherVariableCostPerUnit + subcontractCost;

    // Prime d'assurance et RH : charges de structure du tour.
    const insurancePremium = w.insured ? (w.chosenFormula?.premiumPerRound ?? 0) : 0;
    const hrCost = w.hr.cost;

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
    const planFourni = planDepose(w.decisions.forecast);
    const conditions = bank
      ? conditionsBancaires(
          confianceAvant,
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
      payableRatio: Math.min(1, (w.supplier?.paymentDelayDays ?? scenario.finance.supplierPaymentDelayDays) / scenario.roundDays),
      otherVariableCash,
      inventoryChange,
      cogs,
      commissionCost,
      marketingCost: w.decisions.marketingBudget,
      qualityCost: w.decisions.qualityBudget,
      maintenanceCost: w.decisions.maintenanceBudget,
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
      w.decisions.marketingBudget +
      w.decisions.qualityBudget +
      w.decisions.maintenanceBudget;
    const breakeven = computeBreakeven({
      fixedCosts: structureCosts,
      price: w.decisions.price,
      uvc: w.unitCost,
      revenue,
    });

    // Part de marché : ventes sur le marché adressable uniquement (les
    // commandes fermes s'ajoutent au CA sans gonfler la part de marché).
    const totalShare = totalPotential > 0 ? segmentUnits / totalPotential : 0;
    totalSold += soldUnits;

    results[w.state.id] = {
      companyId: w.state.id,
      ...(statut === "defaillant" ? { defaillant: true } : {}),
      incomeStatement: finance.incomeStatement,
      balanceSheet: finance.closing,
      cashFlow: finance.cashFlow,
      functionalBalance,
      ratios,
      market: { bySegment: perSegment, totalShare },
      production: {
        planned: w.decisions.productionPlan,
        produced: w.produced,
        machineCapacity: w.machineCapacity,
        laborCapacity: w.laborCapacity,
        utilizationRate: w.utilizationRate,
        producedQuality: w.producedQuality,
      },
      breakeven,
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
              prevention: w.decisions.qualityBudget,
              internalFailure: w.scrapValue,
              externalFailure: refund,
              defectUnits: w.defectUnits,
              returnedUnits,
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
        break_even_units: breakeven.breakEvenUnits,
        safety_margin: breakeven.safetyMargin,
        roe: ratios.returnOnEquity,
        roce: ratios.returnOnCapitalEmployed,
      },
    };

    const lastMarketShare: Record<string, number> = {};
    for (const segment of scenario.market.segments) {
      lastMarketShare[segment.code] = perSegment[segment.code]?.share ?? 0;
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
      perceivedQuality: updatePerceivedQuality(
        w.state.perceivedQuality,
        w.producedQuality,
        scenario.production.qualityInertia,
      ) + w.supplierQualityBonus,
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
      finance: finance.closing,
      lastMarketShare,
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
