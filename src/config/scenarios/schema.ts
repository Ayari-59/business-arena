import { z } from "zod";
import type { EngineScenarioConfig } from "../../engine/types";

/**
 * Validation zod des configurations de scénario (§31, doc 01 §4) :
 * tout scénario est parsé à l'import et au chargement depuis la base —
 * jamais de `as` sur un JSONB.
 */

const segmentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  size: z.number().positive(),
  growth: z.number().gt(-1),
  priceElasticity: z.number().negative(),
  refPrice: z.number().positive(),
  minAcceptablePrice: z.number().nonnegative(),
  psychThresholds: z.array(
    z.object({ threshold: z.number().positive(), penalty: z.number().gt(0).lte(1) }),
  ),
  marketingSensitivity: z.number().nonnegative(),
  axisAffinity: z
    .record(z.enum(["prix", "qualite", "innovation", "image"]), z.enum(["fit", "misfit", "neutral"]))
    .optional(),
  qualitySensitivity: z.number().nonnegative(),
  loyalty: z.number().nonnegative(),
  priceEffectBounds: z
    .object({ min: z.number().nonnegative(), max: z.number().positive() })
    .refine((b) => b.min < b.max, "bornes d'effet prix incohérentes"),
  // Prix de rupture, en multiple du prix usuel. > 1 : sous 1, la clientèle
  // décrocherait au prix de référence, ce qui n'a pas de sens.
  walkAwayPriceRatio: z.number().gt(1).optional(),
  paymentDelayDays: z.number().int().nonnegative(),
  // Une commission de 100 % ne serait plus un canal de vente : la borne haute
  // est stricte, et un scénario qui la franchit ne se charge pas.
  commissionRate: z.number().gte(0).lt(1).optional(),
  marketingGate: z.number().min(0).max(1).optional(),
  seasonality: z.array(z.number().nonnegative()).optional(),
});

const priceIndexSchema = z
  .object({
    /** Écart-type du choc de cours par tour (0.08 = ±8 % typique). */
    volatility: z.number().min(0).max(0.5),
    /** Dérive tendancielle par tour (0.01 = +1 % de tendance haussière). */
    trend: z.number().min(-0.1).max(0.1),
    /**
     * Inertie du choc (0 = bruit blanc, 0.95 = cycles très lents).
     * Une valeur haute produit des tendances durables ; une valeur basse
     * donne des fluctuations indépendantes d'un tour à l'autre.
     */
    momentum: z.number().min(0).max(0.95),
    minMultiplier: z.number().min(0.5).max(1),
    maxMultiplier: z.number().min(1).max(2),
  })
  .refine((p) => p.minMultiplier < p.maxMultiplier, "priceIndex : minMultiplier doit être < maxMultiplier");

const supplierSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  narrative: z.string().min(1),
  costMultiplier: z.number().min(0.5).max(2),
  qualityBonus: z.number().min(-0.1).max(0.15),
  paymentDelayDays: z.number().int().nonnegative(),
  supplyRiskProbability: z.number().min(0).max(0.3),
  supplyRiskAvailabilityHit: z.number().min(0.5).max(1),
  priceIndex: priceIndexSchema.optional(),
});

/**
 * Un produit de la gamme et son marché. Les segments sont obligatoires ; la
 * saisonnalité, l'attraction extérieure et l'intensité concurrentielle sont
 * optionnelles (à défaut, celles du marché du scénario). Le catalogue de
 * fournisseurs propre à la référence est optionnel (à défaut, celui du
 * scénario) ; un seul fournisseur y suffit — c'est alors une référence sans
 * alternative.
 */
const productDefSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  /** Nom de repli sur écran étroit (voir ProductDef.shortName). */
  shortName: z.string().min(1).optional(),
  materialCostPerUnit: z.number().nonnegative(),
  otherVariableCostPerUnit: z.number().nonnegative(),
  hoursPerUnit: z.number().positive(),
  market: z.object({
    segments: z.array(segmentSchema).min(1),
    seasonality: z.array(z.number().nonnegative()).min(1).optional(),
    outsideAttraction: z.number().nonnegative().optional(),
    competitionIntensity: z.number().min(1).optional(),
  }),
  suppliers: z.array(supplierSchema).min(1).optional(),
  development: z
    .object({
      cost: z.number().nonnegative(),
      availableFromRound: z.number().int().min(1).optional(),
    })
    .optional(),
});

const modifierSchema = z.object({
  target: z.union([
    z.literal("material_cost"),
    z.literal("demand"),
    z.literal("availability"),
    z.literal("interest_rate"),
    z.literal("order"),
    z.literal("order_price"),
    z.literal("order_subcontract"),
    z.templateLiteral(["demand:", z.string()]),
  ]),
  op: z.enum(["mul", "add"]),
  value: z.number(),
});

const eventSchema = z.object({
  code: z.string().min(1),
  scope: z.enum(["market", "company"]),
  probability: z.number().min(0).max(1),
  minRound: z.number().int().positive().optional(),
  duration: z.number().int().positive(),
  modifiers: z.array(modifierSchema).min(1),
});

export const engineScenarioConfigSchema = z.object({
  code: z.string().min(1),
  version: z.string().min(1),
  roundsCount: z.number().int().min(1).max(24),
  roundDays: z.number().int().positive(),
  market: z.object({
    segments: z.array(segmentSchema).min(1),
    seasonality: z.array(z.number().nonnegative()).min(1),
    outsideAttraction: z.number().nonnegative(),
    competitionIntensity: z.number().min(1),
  }),
  product: z.object({
    code: z.string().min(1),
    materialCostPerUnit: z.number().nonnegative(),
    otherVariableCostPerUnit: z.number().nonnegative(),
    hoursPerUnit: z.number().positive(),
  }),
  // Gamme : cette clé DOIT être déclarée ici, sans quoi le parse la retirerait
  // en silence et une partie à gamme retomberait en mono-produit.
  products: z.array(productDefSchema).min(2).optional(),
  production: z.object({
    qualitySensitivity: z.number().nonnegative(),
    qualityScale: z.number().positive(),
    qualityInertia: z.number().min(0).max(1),
    maintenanceReference: z.number().nonnegative(),
    availabilityDecay: z.number().min(0).max(0.5),
    overheatThreshold: z.number().min(0.5).max(1).optional(),
    availabilityFloor: z.number().min(0).max(0.9).optional(),
  }),
  marketing: z.object({ scale: z.number().positive() }),
  finance: z.object({
    loanAnnualRate: z.number().min(0).max(1),
    overdraftAnnualRate: z.number().min(0).max(1),
    overdraftLimit: z.number().nonnegative(),
    taxRate: z.number().min(0).max(1),
    vatRate: z.number().min(0).max(0.5).optional(),
    supplierPaymentDelayDays: z.number().int().nonnegative(),
    depreciationPerRound: z.number().nonnegative(),
    loanDurationRounds: z.number().positive().optional(),
    maxCapitalIncreaseTotal: z.number().positive().optional(),
    maxDebtToEquity: z.number().positive().optional(),
    crisisRoundsBeforeFailure: z.number().int().positive().optional(),
    rescueFinancingRequired: z.boolean().optional(),
    /**
     * Dossier bancaire. Ce schéma est la frontière que traverse le snapshot
     * d'une partie : une clé qu'il ignore est SILENCIEUSEMENT retirée, et la
     * règle ne s'appliquerait plus qu'en mémoire, jamais en partie.
     */
    bank: z
      .object({
        memory: z.number().min(0).max(1),
        maxOverdraftSpread: z.number().min(0).max(0.5),
        minOverdraftShare: z.number().min(0).max(1),
      })
      .optional(),
    // Conditions court terme exposées aux équipes (information pédagogique).
    /** Taux d'escompte annuel sur les créances clients (ex : 0.10 = 10 %). */
    discountRate: z.number().min(0).max(1).optional(),
    /** Part des créances clients escomptables (ex : 0.80 = 80 %). */
    discountableRatio: z.number().min(0).max(1).optional(),
    /** Rémunération annuelle des placements de trésorerie (ex : 0.03 = 3 %). */
    placementRate: z.number().min(0).max(1).optional(),
    /**
     * Catégories d'emprunt moyen terme (machines, installations) : chacune
     * avec son plafond (% du coût de l'investissement), sa durée propre en
     * tours et, optionnellement, son taux (à défaut : loanAnnualRate).
     */
    loanCategories: z
      .object({
        machines: z
          .object({
            maxLoanRatio: z.number().min(0).max(1),
            durationRounds: z.number().int().positive(),
            annualRate: z.number().min(0).max(1).optional(),
          })
          .optional(),
        installations: z
          .object({
            maxLoanRatio: z.number().min(0).max(1),
            durationRounds: z.number().int().positive(),
            annualRate: z.number().min(0).max(1).optional(),
            label: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  treasury: z
    .object({
      discountAnnualRate: z.number().min(0).max(0.3),
      discountMaxShare: z.number().min(0).max(1),
      factoringFeeRate: z.number().min(0).max(0.2),
      forcedFactoringFeeRate: z.number().min(0).max(0.3),
      // Le placement rapporte peu, par construction : c'est ce qui rend
      // l'arbitrage réel face à un découvert bien plus cher.
      placementAnnualRate: z.number().min(0).max(0.1).optional(),
    })
    .optional(),
  fixedCostsPerRound: z.number().nonnegative(),
  // Activité de service : la capacité non vendue est perdue, jamais stockée.
  perishable: z.boolean().optional(),
  // Concurrents pilotés : le supplément de prix du premium, propre au métier.
  bots: z
    .object({
      premiumPriceRatio: z.number().min(1).max(2).optional(),
    })
    .optional(),
  // Modèle par abonnement : le portefeuille n'existe que si le bloc est déclaré.
  subscription: z
    .object({
      baseChurnRate: z.number().min(0).max(1),
      qualityChurnSensitivity: z.number().nonnegative(),
      priceChurnSensitivity: z.number().nonnegative(),
      refPrice: z.number().positive(),
      crowdingThreshold: z.number().min(0).max(1),
      crowdingChurn: z.number().min(0).max(1),
      maxChurnRate: z.number().min(0).max(1).optional(),
      churnSeasonality: z.array(z.number().nonnegative()).optional(),
    })
    .optional(),
  suppliers: z.array(supplierSchema).min(2).optional(),
  insurance: z
    .object({
      premiumPerRound: z.number().nonnegative(),
      coveredEventCodes: z.array(z.string().min(1)).min(1),
      formulas: z
        .array(
          z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            premiumPerRound: z.number().nonnegative(),
            coveredEventCodes: z.array(z.string().min(1)).min(1),
          }),
        )
        .min(1)
        .optional(),
    })
    .optional(),
  investment: z
    .object({
      costPerCapacityUnit: z.number().positive(),
      depreciationRounds: z.number().positive(),
      maxPerRound: z.number().positive(),
    })
    .optional(),
  equipment: z
    .object({
      types: z
        .array(
          z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            capacityPerUnit: z.number().positive(),
            costPerUnit: z.number().positive(),
            depreciationRounds: z.number().positive(),
            maintenanceMultiplier: z.number().positive(),
            maxPerRound: z.number().int().positive(),
            resaleRatio: z.number().min(0).max(1).optional(),
            wearRatePerRound: z.number().min(0).max(1).optional(),
            breakdownThreshold: z.number().min(0).max(1).optional(),
            maintenanceRepairRate: z.number().min(0).max(1).optional(),
          }),
        )
        .min(1),
      initialFleet: z
        .array(z.object({ typeCode: z.string().min(1), count: z.number().int().positive() }))
        .min(1),
    })
    .optional(),
  // Études achetables : l'information a un prix (charge de structure).
  studies: z
    .object({
      marketCost: z.number().positive(),
      priceCost: z.number().positive(),
      financeCost: z.number().positive(),
      projectCost: z.number().positive(),
    })
    .optional(),
  // Catalogue d'études enrichi (studiesV2) : taxonomie à 6 catégories + prévision.
  studiesV2: z
    .object({
      categories: z
        .array(
          z.object({
            code: z.string().min(1),
            label: z.string().min(1),
            cost: z.number().positive(),
            description: z.string().min(1),
            revealsFields: z.array(z.string()),
            isSubscription: z.boolean().optional(),
          }),
        )
        .min(1),
      forecastStudy: z
        .object({
          horizons: z
            .array(
              z.object({
                months: z.number().int().positive(),
                cost: z.number().positive(),
              }),
            )
            .min(1),
        })
        .optional(),
      maxStudiesPerRound: z.number().int().positive().optional(),
    })
    .optional(),
  // Commandes exceptionnelles entre les tours : rotation déterministe.
  orderOffers: z
    .array(
      z.object({
        code: z.string().min(1),
        title: z.string().min(1),
        narrative: z.string().min(1),
        units: z.number().positive(),
        price: z.number().positive(),
        paymentDelayDays: z.number().min(0).max(180),
        productCode: z.string().min(1).optional(),
      }),
    )
    .min(1)
    .optional(),
  subcontracting: z.object({ unitCost: z.number().positive() }).optional(),
  qualityCosts: z
    .object({
      baseDefectRate: z.number().min(0).max(0.2),
      externalReturnSensitivity: z.number().min(0).max(2),
      maintenanceDefectSensitivity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  qualityActions: z
    .object({
      actions: z
        .array(
          z.object({
            code: z.string().min(1),
            label: z.string().min(1),
            levels: z
              .array(
                z.object({
                  level: z.number().int().min(1).max(3),
                  label: z.string().min(1),
                  cost: z.number().nonnegative(),
                  durationRounds: z.number().int().min(1),
                  effects: z.object({
                    defectRateReduction: z.number().min(0).max(1).optional(),
                    returnRateReduction: z.number().min(0).max(1).optional(),
                    productionCostReduction: z.number().min(0).max(0.5).optional(),
                    qualityImageBonus: z.number().min(0).max(0.5).optional(),
                    maintenanceSaving: z.number().nonnegative().optional(),
                  }),
                  prerequisiteLevel: z.number().int().min(1).optional(),
                }),
              )
              .min(1)
              .max(3),
          }),
        )
        .min(1),
      maxConcurrentActions: z.number().int().positive().optional(),
    })
    .optional(),
  hr: z
    .object({
      salaryPerEmployeePerRound: z.number().positive(),
      includedHeadcount: z.number().int().positive(),
      hiringCost: z.number().nonnegative(),
      firingCost: z.number().nonnegative(),
      trainingScale: z.number().positive(),
      trainingSensitivity: z.number().min(0).max(0.5),
      maxProductivity: z.number().min(1).max(2),
      moraleSensitivity: z.number().min(0).max(2),
      attritionThreshold: z.number().min(0.8).max(1),
      maxHiresPerRound: z.number().int().positive(),
      maxHeadcount: z.number().int().positive(),
      salaryIndexBounds: z.tuple([z.number().min(0.5), z.number().max(2)]).optional(),
      moraleBounds: z.tuple([z.number().min(0), z.number().max(2)]).optional(),
    })
    .optional(),
  events: z.array(eventSchema),
  scriptedEvents: z.array(
    z.object({
      round: z.number().int().positive(),
      eventCode: z.string().min(1),
      companyIndex: z.number().int().nonnegative().optional(),
    }),
  ),
  scoring: z.object({
    weights: z
      .object({
        economic: z.number().min(0).max(1),
        financial: z.number().min(0).max(1),
        commercial: z.number().min(0).max(1),
        operational: z.number().min(0).max(1),
        profitability: z.number().min(0).max(1),
        strategy: z.number().min(0).max(1),
        decisionMastery: z.number().min(0).max(1),
      })
      .refine(
        (w) => Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 1e-6,
        "les pondérations de l'IPG doivent sommer à 1",
      ),
    benchmarks: z.object({
      operatingIncome: z.object({ min: z.number(), target: z.number() }),
      revenue: z.object({ min: z.number(), target: z.number() }),
      netTreasury: z.object({ min: z.number(), target: z.number() }),
      returnOnEquity: z.object({ min: z.number(), target: z.number() }),
      marketShareTarget: z.number().gt(0).lte(1),
      utilizationTarget: z.number().gt(0).lte(1),
    }),
    coherenceThresholds: z.object({
      premiumPriceRatio: z.number().positive().optional(),
      minQualityEffortRatio: z.number().min(0).max(1).optional(),
      highMarketingLostRatio: z.number().min(0).max(1).optional(),
      lowMaintenanceRatio: z.number().min(0).max(1).optional(),
      highUtilizationFloor: z.number().min(0).max(1).optional(),
    }).optional(),
  }),
  enrichedBots: z.boolean().optional(),
  // Recherche et développement : le levier n'existe que si le bloc est déclaré.
  rd: z
    .object({
      techScale: z.number().positive(),
      techSensitivity: z.number().nonnegative(),
      techMax: z.number().min(0).max(1),
      techInertia: z.number().min(0).max(1),
    })
    .optional(),
  // Grille R&D par thème × niveau : actions concrètes avec effets mesurables.
  rdGrid: z
    .object({
      themes: z.array(
        z.object({
          code: z.string().min(1),
          label: z.string().min(1),
          levels: z.array(
            z.object({
              level: z.number().int().positive(),
              label: z.string().min(1),
              cost: z.number().positive(),
              durationRounds: z.number().int().positive(),
              effects: z.object({
                materialCostReduction: z.number().min(0).max(1).optional(),
                defectReduction: z.number().min(0).max(1).optional(),
                demandBonus: z.number().min(0).max(1).optional(),
                capacityBonus: z.number().min(0).max(1).optional(),
              }),
              prerequisiteLevel: z.number().int().positive().optional(),
            }),
          ),
        }),
      ),
    })
    .optional(),
  // Communication (marque et axe) : le levier n'existe que si le bloc est déclaré.
  communication: z
    .object({
      brandScale: z.number().positive(),
      brandSensitivity: z.number().nonnegative(),
      brandMax: z.number().min(0).max(2),
      brandInertia: z.number().min(0).max(1),
      axisFit: z.number().min(1).max(3),
      axisMisfit: z.number().min(0).max(1),
      axisSwitchDecay: z.number().min(0).max(1),
    })
    .optional(),
  // Actions de maintenance par machine (préventive / curative).
  // Inspiré de StratiRAC : 3 niveaux par type, effets sur l'usure, le risque
  // de panne et la restauration de capacité. Absent = comportement historique.
  maintenanceActions: z
    .object({
      types: z.array(
        z.object({
          code: z.string().min(1),
          label: z.string().min(1),
          levels: z.array(
            z.object({
              level: z.number().int().min(1).max(3),
              label: z.string().min(1),
              laborCost: z.number().nonnegative(),
              downtimeCost: z.number().nonnegative(),
              timeHoursN1: z.number().nonnegative(),
              timeHoursN2: z.number().nonnegative(),
              timeHoursN3: z.number().nonnegative(),
              wearReduction: z.number().min(0).max(1).optional(),
              breakdownRiskReduction: z.number().min(0).max(1).optional(),
              capacityRestoration: z.number().min(0).max(1).optional(),
            }),
          ).min(1).max(3),
        }),
      ).min(1),
    })
    .optional(),
  // Hygiène & Sécurité (H&S) : catalogue d'actions ponctuelles ou récurrentes
  // avec effets sur l'attrition RH, la productivité, l'image RSE et les rebuts.
  healthSafetyActions: z
    .object({
      actions: z.array(
        z.object({
          code: z.string().min(1),
          label: z.string().min(1),
          description: z.string().optional(),
          laborCost: z.number().nonnegative(),
          immobilizationCost: z.number().nonnegative().optional(),
          timeHoursN1: z.number().nonnegative().optional(),
          timeHoursN2: z.number().nonnegative().optional(),
          timeHoursN3: z.number().nonnegative().optional(),
          requiresMachine: z.boolean().optional(),
          effects: z.object({
            attritionReduction: z.number().min(0).max(1).optional(),
            accidentRateReduction: z.number().min(0).max(1).optional(),
            hrImageBonus: z.number().min(0).max(1).optional(),
            productivityBonus: z.number().min(0).max(0.3).optional(),
            maintenanceSaving: z.number().nonnegative().optional(),
            defectReduction: z.number().min(0).max(0.3).optional(),
          }),
          isRecurring: z.boolean().optional(),
          durationRounds: z.number().int().positive().optional(),
        }),
      ).min(1),
      maxActionsPerRound: z.number().int().positive().optional(),
    })
    .optional(),
  // Programmes de formation RH : catalogue des sessions de formation,
  // effets sur productivité, attrition et qualité.
  trainingPrograms: z
    .object({
      programs: z.array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          domaine: z.enum(["production", "commercial", "management", "rh", "technique"]),
          durationRounds: z.number().int().min(1),
          costPerEmployee: z.number().min(0),
          maxEmployeesPerRound: z.number().int().min(1),
          effects: z.object({
            productivityBonus: z.number().min(0).max(1).default(0),
            attritionReduction: z.number().min(0).max(1).default(0),
            qualityBonus: z.number().min(0).max(1).default(0),
            safetyBonus: z.number().min(0).max(1).default(0),
            maintenanceSaving: z.number().min(0).default(0),
          }),
        }),
      ).min(1),
      maxConcurrentPrograms: z.number().int().min(1).default(2),
    })
    .optional(),
  // Actions commerciales enrichies : promotions, fidélisation, prospection,
  // avec effets sur demande, loyauté, marge et image.
  commercialActions: z
    .object({
      actions: z.array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          type: z.enum(["promotion", "fidelisation", "prospection", "communication"]),
          targetSegment: z.string().optional(),
          isRecurring: z.boolean().default(false),
          durationRounds: z.number().int().min(1).default(1),
          costPerRound: z.number().min(0),
          effects: z.object({
            demandBonus: z.number().min(-0.5).max(1).default(0),
            loyaltyBonus: z.number().min(0).max(1).default(0),
            marginImpact: z.number().min(-0.5).max(0).default(0),
            imageBonus: z.number().min(-1).max(1).default(0),
            newClientRatio: z.number().min(0).max(0.5).default(0),
          }),
        }),
      ).min(1),
      maxActionsPerRound: z.number().int().min(1).default(2),
    })
    .optional(),
  // Négociation fournisseurs (vague 5) : contrats de remise volume.
  supplierNegotiation: z.object({
    contracts: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      supplierType: z.enum(["matiere", "energie", "logistique", "soustraitance"]),
      volumeThreshold: z.number().min(0),
      discountRate: z.number().min(0).max(0.3),
      contractDurationRounds: z.number().int().min(1),
      supplyRiskReduction: z.number().min(0).max(1).default(0),
    })).min(1),
    maxActiveContracts: z.number().int().min(1).default(2),
  }).optional(),
  // Gestion de la capacité (vague 5) : options d'expansion de la capacité de production.
  capacityExpansion: z.object({
    options: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["atelier", "equipeNuit", "sousTraitance", "automatisation"]),
      capacityBonus: z.number().min(0.1).max(2),
      costPerRound: z.number().min(0),
      setupCost: z.number().min(0).default(0),
      minProductionLevel: z.number().min(0).default(0),
      maxRounds: z.number().int().min(1).default(99),
    })).min(1),
    maxActiveOptions: z.number().int().min(1).default(1),
  }).optional(),
  // Marché international (vague 5) : expansion vers de nouveaux marchés.
  internationalMarkets: z.object({
    markets: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      region: z.enum(["europe", "amerique", "asie", "afrique"]),
      demandMultiplier: z.number().min(0.5).max(5),
      baseEntryRound: z.number().int().min(1),
      entryInvestment: z.number().min(0),
      exchangeRateVolatility: z.number().min(0).max(0.3).default(0.05),
      tariffRate: z.number().min(0).max(0.5).default(0),
      localAdaptationCost: z.number().min(0).default(0),
    })).min(1),
    maxActiveMarkets: z.number().int().min(1).default(2),
  }).optional(),
  // Innovation produit (vague 5) : développement de nouvelles gammes/services.
  productInnovation: z.object({
    innovations: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["gamme", "packaging", "service", "digital"]),
      developmentRounds: z.number().int().min(1),
      devCostPerRound: z.number().min(0),
      launchCost: z.number().min(0).default(0),
      effects: z.object({
        priceBonus: z.number().min(0).max(0.5).default(0),
        demandBonus: z.number().min(0).max(1).default(0),
        marginBonus: z.number().min(-0.2).max(0.3).default(0),
        cannibalizationRate: z.number().min(0).max(0.5).default(0),
      }),
    })).min(1),
    maxSimultaneousDev: z.number().int().min(1).default(1),
  }).optional(),
  // Programme RSE / empreinte carbone (vague 5) : actions RSE structurées.
  rseProgram: z.object({
    actions: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      category: z.enum(["energie", "dechets", "mobilite", "fournisseurs", "social"]),
      costPerRound: z.number().min(0),
      implementationRounds: z.number().int().min(1).default(1),
      effects: z.object({
        carbonReduction: z.number().min(0).max(1).default(0),
        imageBonus: z.number().min(0).max(0.3).default(0),
        employeeSatisfaction: z.number().min(0).max(0.2).default(0),
        energySaving: z.number().min(0).default(0),
      }),
    })).min(1),
    carbonBudget: z.number().min(0).optional(),
  }).optional(),
  // RSE (Responsabilité Sociale des Entreprises) : le levier n'existe que si
  // le bloc est déclaré. Absent → DEFAULT_RSE_CONFIG. Les grandeurs sont sans
  // dimension : normalisées par l'échelle marketing du scénario.
  rse: z
    .object({
      imageDemandSensitivity: z.number().nonnegative(),
      imageInertia: z.number().min(0).max(1),
      cleanDefectReductionMax: z.number().min(0).max(1),
      cleanInertia: z.number().min(0).max(1),
      financingTrustBonus: z.number().min(0).max(1),
      socialAttritionRelief: z.number().min(0).max(1),
      cards: z.object({
        minRound: z.number().int().positive(),
        labelImageThreshold: z.number().min(0).max(1),
        labelDemandBonus: z.number().nonnegative(),
        labelDuration: z.number().int().positive(),
        badBuzzImageCeiling: z.number().min(0).max(1),
        badBuzzProbability: z.number().min(0).max(1),
        badBuzzDemandMalus: z.number().min(0).max(1),
        aidCleanThreshold: z.number().min(0).max(1),
        aidAmount: z.number().nonnegative(),
        sanctionProbability: z.number().min(0).max(1),
        fineAmount: z.number().nonnegative(),
      }),
    })
    .optional(),
  // Catalogue d'actions R&D ponctuelles (vague 1) : projets avec effets sur
  // coûts, qualité et image. Absent = pas d'actions R&D disponibles.
  rdActions: z.object({
    actions: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      theme: z.string().min(1),
      level: z.number().int().min(1).max(3),
      costPerRound: z.number().min(0),
      durationRounds: z.number().int().min(1),
      effects: z.object({
        costReduction: z.number().min(0).max(1).default(0),
        qualityBonus: z.number().min(0).max(1).default(0),
        imageBonus: z.number().min(0).max(1).default(0),
      }),
    })).min(1),
    maxSimultaneousProjects: z.number().int().min(1).default(2),
  }).optional(),
  // Stratégie de prix (vague 6) : multiplicateurs de prix et effets sur la demande et la marge.
  pricingStrategy: z.object({
    strategies: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["premium", "penetration", "dynamique", "segmentation", "psychologique"]),
      priceMultiplier: z.number().min(0.5).max(2),
      demandImpact: z.number().min(-0.5).max(0.3),
      marginImpact: z.number().min(-0.3).max(0.5),
      imageImpact: z.number().min(-0.2).max(0.3).default(0),
      minRound: z.number().int().min(1).default(1),
    })).min(1),
    maxActiveStrategies: z.number().int().min(1).default(1),
  }).optional(),
  // RH avancée (vague 6) : politiques RH avec effets sur l'attrition, la productivité et le recrutement.
  advancedHR: z.object({
    policies: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["recrutement", "carrieres", "salaires", "teletravail", "bienEtre"]),
      costPerRound: z.number().min(0),
      implementationRounds: z.number().int().min(1).default(1),
      effects: z.object({
        attritionReduction: z.number().min(0).max(0.5).default(0),
        productivityBonus: z.number().min(0).max(0.3).default(0),
        recruitmentBonus: z.number().min(0).max(0.5).default(0),
        absenteeismReduction: z.number().min(0).max(0.3).default(0),
      }),
    })).min(1),
    maxActivePolicies: z.number().int().min(1).default(3),
  }).optional(),
  // Gestion de crise (vague 6) : plans de préparation aux crises avec réduction de l'impact.
  crisisManagement: z.object({
    plans: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      crisisType: z.enum(["greve", "rappelProduit", "cyberAttaque", "ruptureFournisseur", "criseSanitaire"]),
      preparationCostPerRound: z.number().min(0),
      activationCost: z.number().min(0),
      effects: z.object({
        revenueProtection: z.number().min(0).max(1).default(0),
        recoverySpeedBonus: z.number().min(0).max(1).default(0),
        imageProtection: z.number().min(0).max(1).default(0),
      }),
    })).min(1),
    crisisEventProbability: z.number().min(0).max(0.2).default(0.05),
  }).optional(),
  // Partenariats & alliances (vague 6) : accords commerciaux avec effets sur revenus, coûts et R&D.
  partnerships: z.object({
    options: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["codeveloppement", "licence", "jointVenture", "appelOffre", "franchise"]),
      entryFee: z.number().min(0).default(0),
      royaltiesPerRound: z.number().min(0).default(0),
      minRound: z.number().int().min(1).default(1),
      durationRounds: z.number().int().min(1),
      effects: z.object({
        revenueBonus: z.number().min(-0.1).max(1).default(0),
        costReduction: z.number().min(0).max(0.3).default(0),
        rdBonus: z.number().min(0).max(0.5).default(0),
        marketAccessBonus: z.number().min(0).max(0.5).default(0),
      }),
    })).min(1),
    maxActivePartnerships: z.number().int().min(1).default(2),
  }).optional(),
  // Transformation digitale (vague 6) : projets IT avec effets sur l'efficacité et la demande.
  digitalTransformation: z.object({
    projects: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["erp", "crm", "automatisation", "dataAnalytics", "ecommerce"]),
      implementationRounds: z.number().int().min(1),
      costPerRound: z.number().min(0),
      maintenanceCostPerRound: z.number().min(0).default(0),
      effects: z.object({
        efficiencyBonus: z.number().min(0).max(0.4).default(0),
        costReduction: z.number().min(0).max(0.3).default(0),
        demandBonus: z.number().min(0).max(0.3).default(0),
        errorReduction: z.number().min(0).max(0.5).default(0),
      }),
    })).min(1),
    maxSimultaneousProjects: z.number().int().min(1).default(2),
  }).optional(),
  // Gestion de marque (vague 6) : actions de renforcement de la marque et de la réputation.
  brandManagement: z.object({
    actions: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["reputation", "communicationCrise", "ambassadeurs", "nps", "certificationLabel"]),
      costPerRound: z.number().min(0),
      durationRounds: z.number().int().min(1).default(1),
      isRecurring: z.boolean().default(false),
      effects: z.object({
        imageBonus: z.number().min(-0.1).max(0.5).default(0),
        loyaltyBonus: z.number().min(0).max(0.3).default(0),
        priceAcceptance: z.number().min(0).max(0.2).default(0),
        crisisRecovery: z.number().min(0).max(1).default(0),
      }),
    })).min(1),
    maxActionsPerRound: z.number().int().min(1).default(2),
  }).optional(),
  // Catalogue d'options de financement (vague 3) : lignes de crédit et emprunts.
  // Absent = pas d'options de financement structurées disponibles.
  financingOptions: z.object({
    options: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["creditLine", "termLoan"]),
      maxAmount: z.number().min(0),
      interestRatePerRound: z.number().min(0).max(0.1),
      durationRounds: z.number().int().min(1),
      availableFromRound: z.number().int().min(1).default(1),
    })).min(1),
  }).optional(),
}) satisfies z.ZodType<EngineScenarioConfig>;

const scenarioWithChecks = engineScenarioConfigSchema.superRefine((s, ctx) => {
  const checkCoverage = (label: string, codes: string[]) => {
    for (const code of codes) {
      const event = s.events.find((e) => e.code === code);
      if (!event) {
        ctx.addIssue({ code: "custom", message: `${label} : événement couvert inconnu « ${code} »` });
      } else if (event.modifiers.some((m) => m.target === "demand" || m.target.startsWith("demand:"))) {
        ctx.addIssue({
          code: "custom",
          message: `${label} : « ${code} » modifie la demande (paramètre de marché, non couvrable)`,
        });
      }
    }
  };
  // Gamme : codes de produits uniques, et codes de segments uniques sur TOUTE
  // la gamme — parts de marché et demandes potentielles sont indexées par
  // code de segment, deux produits qui partageraient un code se confondraient.
  if (s.products) {
    const productCodes = new Set<string>();
    const segmentCodes = new Set<string>();
    for (const p of s.products) {
      if (productCodes.has(p.code)) {
        ctx.addIssue({ code: "custom", message: `gamme : code de produit en double « ${p.code} »` });
      }
      productCodes.add(p.code);
      for (const seg of p.market.segments) {
        if (segmentCodes.has(seg.code)) {
          ctx.addIssue({
            code: "custom",
            message: `gamme : code de segment « ${seg.code} » partagé par deux produits`,
          });
        }
        segmentCodes.add(seg.code);
      }
      // Le catalogue propre d'une référence : codes uniques EN SON SEIN (le
      // même code peut désigner un fournisseur différent d'une référence à
      // l'autre — le déstockeur des bonnets n'est pas celui des pulls).
      if (p.suppliers) {
        const supplierCodes = new Set<string>();
        for (const sup of p.suppliers) {
          if (supplierCodes.has(sup.code)) {
            ctx.addIssue({
              code: "custom",
              message: `gamme : fournisseur « ${sup.code} » en double pour « ${p.code} »`,
            });
          }
          supplierCodes.add(sup.code);
        }
      }
    }
  }
  checkCoverage("assurance", s.insurance?.coveredEventCodes ?? []);
  for (const f of s.insurance?.formulas ?? []) {
    checkCoverage(`assurance (${f.code})`, f.coveredEventCodes);
  }
});

export function parseScenarioConfig(raw: unknown): EngineScenarioConfig {
  return scenarioWithChecks.parse(raw);
}
