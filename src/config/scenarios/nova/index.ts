import type { CompanyState, EngineScenarioConfig } from "../../../engine/types";
import type { BotProfile } from "../../../engine/bots";
import { parseScenarioConfig } from "../schema";

/**
 * Scénario NOVA (doc 07) — enceinte portable « NOVA One », 6 tours
 * trimestriels, niveaux DÉCOUVERTE → GESTION.
 *
 * Toutes les valeurs économiques du jeu vivent ICI (jamais dans le moteur).
 * La dramaturgie (doc 07 §2) est portée par : la saisonnalité (pic T4),
 * l'arrivée de CampusTech au tour 3 (compte-clé payé à 60 j → BFR),
 * la hausse matières scriptée au tour 5, et les événements aléatoires.
 * Les invariants de calibration (doc 07 §4) sont testés dans
 * tests/scenarios/nova.test.ts — toute retouche de ces valeurs doit
 * les laisser verts.
 */
const rawNova = {
  code: "nova",
  version: "0.1.0",
  roundsCount: 6,
  roundDays: 90,
  market: {
    segments: [
      {
        code: "etudiants",
        name: "Étudiants (sensibles au prix)",
        size: 14000,
        growth: 0.06,
        priceElasticity: -2.2,
        refPrice: 59,
        minAcceptablePrice: 35,
        psychThresholds: [
          { threshold: 50, penalty: 0.9 },
          { threshold: 60, penalty: 0.93 },
        ],
        marketingSensitivity: 0.25,
        qualitySensitivity: 0.1,
        loyalty: 0.1,
        priceEffectBounds: { min: 0.15, max: 4 },
        paymentDelayDays: 0,
      },
      {
        code: "passionnes",
        name: "Passionnés (sensibles à la qualité)",
        size: 6000,
        growth: 0.03,
        priceElasticity: -0.7,
        refPrice: 79,
        minAcceptablePrice: 55,
        psychThresholds: [{ threshold: 100, penalty: 0.9 }],
        marketingSensitivity: 0.12,
        qualitySensitivity: 0.5,
        loyalty: 0.35,
        priceEffectBounds: { min: 0.3, max: 2.5 },
        paymentDelayDays: 0,
      },
      {
        code: "campustech",
        name: "CampusTech (chaîne de magasins, 80 j)",
        size: 12000,
        growth: 0.04,
        priceElasticity: -1.2,
        refPrice: 55,
        minAcceptablePrice: 40,
        psychThresholds: [],
        marketingSensitivity: 0.05,
        qualitySensitivity: 0.25,
        loyalty: 0.5,
        priceEffectBounds: { min: 0.3, max: 2.2 },
        paymentDelayDays: 80,
        // le compte-clé démarre au tour 3 et passe sa grosse commande au pic T4 (doc 07 §2)
        seasonality: [0, 0, 0.25, 1.4, 1, 1],
      },
    ],
    seasonality: [0.9, 0.95, 1.0, 1.35, 0.9, 1.0],
    outsideAttraction: 0.55,
    competitionIntensity: 1.6,
  },
  product: {
    code: "nova-one",
    materialCostPerUnit: 22,
    otherVariableCostPerUnit: 16, // MOD 11 € + énergie/divers 5 €
    hoursPerUnit: 0.3,
  },
  production: {
    qualitySensitivity: 0.15,
    qualityScale: 6000,
    qualityInertia: 0.6,
    maintenanceReference: 4000,
    availabilityDecay: 0.05,
  },
  marketing: { scale: 12000 },
  finance: {
    loanAnnualRate: 0.05,
    overdraftAnnualRate: 0.12,
    overdraftLimit: 30000,
    taxRate: 0.25,
    supplierPaymentDelayDays: 22,
    depreciationPerRound: 5000,
  },
  // structure totale ≈ 96 000 €/tour : 91 000 décaissés + 5 000 d'amortissements
  fixedCostsPerRound: 91000,
  // Le deck d'événements (§19) : chaque entrée est une CARTE (habillage dans
  // src/config/events/cards.ts). Probabilités faibles : 1 à 2 cartes par
  // partie en moyenne, en plus des cartes scriptées.
  events: [
    {
      code: "raw_material_spike",
      scope: "market",
      probability: 0,
      duration: 2,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.2 }],
    },
    {
      code: "machine_breakdown",
      scope: "company",
      probability: 0.05,
      minRound: 3,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.85 }],
    },
    {
      code: "viral_campaign",
      scope: "market",
      probability: 0.04,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "demand", op: "mul", value: 1.08 }],
    },
    {
      code: "competitor_bankruptcy",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 1.12 }],
    },
    {
      code: "economic_downturn",
      scope: "market",
      probability: 0.03,
      minRound: 2,
      duration: 2,
      modifiers: [{ target: "demand", op: "mul", value: 0.9 }],
    },
    {
      code: "student_fair",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [{ target: "demand:etudiants", op: "mul", value: 1.25 }],
    },
    {
      code: "premium_trend",
      scope: "market",
      probability: 0.04,
      duration: 1,
      modifiers: [{ target: "demand:passionnes", op: "mul", value: 1.3 }],
    },
    {
      code: "rate_hike",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 1.5 }],
    },
    {
      code: "rate_cut",
      scope: "market",
      probability: 0.03,
      minRound: 3,
      duration: 2,
      modifiers: [{ target: "interest_rate", op: "mul", value: 0.6 }],
    },
    {
      code: "supplier_discount",
      scope: "market",
      probability: 0.03,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 0.9 }],
    },
    {
      code: "supplier_dispute",
      scope: "company",
      probability: 0.03,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "material_cost", op: "mul", value: 1.15 }],
    },
    {
      code: "cold_wave",
      scope: "market",
      probability: 0.03,
      minRound: 2,
      duration: 1,
      modifiers: [{ target: "availability", op: "mul", value: 0.9 }],
    },
  ],
  scriptedEvents: [{ round: 5, eventCode: "raw_material_spike" }],
  // Scoring BPI (doc 08 §1) : pondérations imposées, bornes calibrées sur les
  // trajectoires de référence (snapshot doré) — min → 0 point, cible → 100.
  scoring: {
    weights: {
      economic: 0.3,
      financial: 0.2,
      commercial: 0.15,
      operational: 0.1,
      profitability: 0.1,
      strategy: 0.1,
      decisionMastery: 0.05,
    },
    benchmarks: {
      operatingIncome: { min: -50000, target: 45000 },
      revenue: { min: 150000, target: 400000 },
      netTreasury: { min: -60000, target: 80000 },
      returnOnEquity: { min: -0.1, target: 0.06 },
      marketShareTarget: 0.32,
      utilizationTarget: 0.85,
    },
  },
} satisfies EngineScenarioConfig;

/** Config NOVA validée à l'import (jamais de config non parsée en circulation). */
export const novaScenario: EngineScenarioConfig = parseScenarioConfig(rawNova);

/** État initial d'une entreprise NOVA (bilan équilibré : 230 000 € de ressources). */
export function novaCompany(
  id: string,
  name: string,
  controller: "human" | "bot",
  botProfile?: BotProfile,
): CompanyState {
  return {
    id,
    name,
    controller,
    botProfile,
    perceivedQuality: 1,
    machineCapacity: 7000,
    availability: 1,
    headcount: 4,
    hoursPerEmployee: 540, // capacité MOD = 4 × 540 / 0,3 = 7 200 u/tour
    productivity: 1,
    finishedGoods: { quantity: 0, unitCost: 0 },
    finance: {
      fixedAssetsNet: 205000,
      inventoryValue: 0,
      receivables: 0,
      cash: 25000,
      equity: 150000,
      financialDebt: 80000,
      payables: 0,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/**
 * Concurrents bots de NOVA (doc 07 §1), par ordre d'entrée sur le marché.
 * Une partie à N entreprises prend les N−1 premiers (ou complète les équipes
 * humaines). SoundBox et Auris restent les deux concurrents « canoniques ».
 */
export const novaBots: { id: string; name: string; profile: BotProfile }[] = [
  { id: "soundbox", name: "SoundBox", profile: "price_aggressive" },
  { id: "auris", name: "Auris", profile: "premium" },
  { id: "vertex", name: "Vertex Audio", profile: "balanced" },
  { id: "kubo", name: "Kubo", profile: "growth" },
  { id: "practico", name: "Practico", profile: "passive" },
  { id: "onda", name: "Onda Sound", profile: "price_aggressive" },
  { id: "lumen", name: "Lumen Acoustics", profile: "premium" },
];
