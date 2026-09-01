import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  decisions,
  gameRankings,
  games,
  roundResults,
  rounds,
  teams,
} from "@/db/schema";
import {
  scenarioByCode,
  type ScenarioVocabulary,
} from "@/config/scenarios/registry";
import { computeSectorKpis, type KpiFormat } from "@/config/scenarios/sector-kpis";
import { presetFromProfile } from "@/config/difficulty";
import { porteUnNomParDefaut } from "@/config/nom-equipe";
import { cardByCode } from "@/config/events/cards";
import { neutralDecisions } from "@/engine/bots";
import { type BpiDimension } from "@/scoring/bpi";
import { orderOfferForRound } from "@/engine/simulation";
import { computeRatios } from "@/engine/finance/ratios";
import { conditionsBancaires, confianceInitiale } from "@/engine/finance/bank";
import { irr, npv, paybackPeriod } from "@/engine/investment";
import { roundBriefing, type RoundBriefing } from "@/pedagogy/round-briefing";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
} from "@/engine/types";
import {
  findUserTeam,
  readPendingEvents,
} from "@/services/round-resolution.service";
import type { GameKind } from "@/services/game-creation.service";

/**
 * Nom d'équipe affiché. Les parties solo créées avant ce nettoyage portent le
 * suffixe « (vous) » dans le nom stocké : il servait à repérer le joueur, ce
 * que le surlignage de sa ligne fait déjà. On le retire à l'affichage plutôt
 * que par une migration, pour que les parties en cours en soient debarrassées
 * elles aussi.
 */
export function teamDisplayName(name: string): string {
  return name.replace(/\s*\(vous\)\s*$/, "");
}

// ---------------------------------------------------------------------------
// Lecture : vue joueur
// ---------------------------------------------------------------------------

export interface GameView {
  gameId: string;
  kind: GameKind;
  status: string;
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  playerTeamId: string;
  playerTeamName: string;
  peutSeNommer: boolean;
  /** Décisions déjà validées par l'équipe pour le tour courant (mode classe). */
  pendingDecisions: RoundDecisions | null;
  /** Cartes événement annoncées par l'enseignant pour le tour courant. */
  announcedEventCards: {
    code: string;
    /** null = carte marché (toute la classe) ; sinon l'équipe ciblée. */
    teamId: string | null;
    teamName: string | null;
    isMyTeam: boolean;
  }[];
  lastResult: CompanyRoundResult | null;
  /**
   * La prévision du tour écoulé face au réalisé. Null si le joueur n'a rien
   * annoncé : on ne reproche pas une prévision qui n'a pas été faite.
   */
  forecastReview: {
    round: number;
    lines: {
      label: string;
      forecast: number;
      actual: number;
      /** Écart relatif, null quand la prévision est nulle (division impossible). */
      relative: number | null;
      format: "units" | "euro";
    }[];
  } | null;
  /**
   * Historique des ventes, tour par tour et clientèle par clientèle. Ce sont
   * VOS données : elles sont gratuites, comme les comptes. Deux colonnes par
   * segment, la demande du marché et vos ventes, parce qu'une prévision se
   * construit sur les deux : la taille du marché donne la saison, votre part
   * dit ce que votre prix en a capté.
   */
  salesHistory: {
    segments: string[];
    /**
     * Les canaux qui prélèvent une commission, et son taux. Sans ce rappel,
     * l'équipe voit la commission au compte de résultat sans savoir à quel
     * canal l'imputer, et ne peut pas comparer une vente en direct à une vente
     * par un tiers.
     */
    commissions: { segment: string; rate: number }[];
    rounds: {
      round: number;
      price: number | null;
      /** Ce que le joueur avait annoncé pour ce tour, s'il l'a fait. */
      forecastUnits: number | null;
      bySegment: { potential: number; sold: number; revenue: number }[];
      sold: number;
      lost: number;
    }[];
  };
  /**
   * Le contexte des tours 2 et suivants, calculé sur le tour écoulé : le
   * constat et l'arbitrage qui en découle. Null au tour 1, dont le contexte
   * est écrit d'avance dans le scénario (`intro`).
   */
  roundBriefing: RoundBriefing | null;
  lastEvents: string[];
  history: { round: number; revenue: number; netIncome: number; netTreasury: number }[];
  ranking: {
    name: string;
    isPlayer: boolean;
    cumulativeNetIncome: number;
    rank: number;
    bpi: number;
  }[];
  /** Moyennes 0-100 des 7 dimensions BPI de l'équipe du joueur (doc 08). */
  playerDimensions: Partial<Record<BpiDimension, number>> | null;
  lastDecisions: RoundDecisions | null;
  /**
   * Le point de départ du secteur, servi au tour 1 quand il n'y a encore rien
   * à reconduire. Calculé ici parce que c'est ici qu'on a le scénario joué ET
   * l'état de l'entreprise : la page, elle, proposait les chiffres de NOVA à
   * tout le monde.
   */
  startingDecisions: RoundDecisions;
  /** Offre d'assurance du scénario (prime déjà à l'échelle de la périodicité). */
  insuranceOffer: { premium: number; coveredEventCodes: string[] } | null;
  /** Formules d'assurance (si le scénario en propose plusieurs). */
  insuranceFormulas: {
    code: string;
    name: string;
    premium: number;
    coveredLabels: string[];
  }[] | null;
  /** Fournisseurs disponibles (si le scénario en propose). */
  suppliersOffer: {
    code: string;
    name: string;
    narrative: string;
    costMultiplier: number;
    qualityBonus: number;
    paymentDelayDays: number;
    supplyRiskProbability: number;
    materialCostPerUnit: number;
  }[] | null;
  /** Capacité de production : machine, main-d'œuvre et goulot. */
  capacityFacts: {
    machineCapacity: number;
    laborCapacity: number;
    bottleneck: "machine" | "labor" | "balanced";
    headcount: number;
    hoursPerEmployee: number;
    productivity: number;
    hoursPerUnit: number;
  } | null;
  /**
   * Vocabulaire du secteur joué : on ne vend pas des « unités » dans un hôtel
   * et on n'y a pas de « machines ». Il vient du registre via le code du
   * snapshot, donc une partie garde le vocabulaire de son scénario.
   */
  vocabulary: ScenarioVocabulary;
  /** Le secteur joué, pour l'identité visuelle (icône, couleur). */
  sector: import("@/config/scenarios/registry").Sector;
  /**
   * Noms des segments du snapshot joué, par code. Sans cela le tableau du
   * marché retomberait sur les codes bruts dès qu'on quitte NOVA.
   */
  segmentNames: Record<string, string>;
  /**
   * Indicateurs du métier joué (RevPAR en hôtellerie, ratio matières en
   * restauration…), déjà calculés : l'arène ne fait que les mettre en forme.
   */
  sectorKpis: {
    key: string;
    label: string;
    hint: string;
    format: KpiFormat;
    value: number;
  }[];
  /**
   * Présentation du tour 1, calculée sur le SNAPSHOT joué : chiffres réels de
   * la partie (capacité, structure, coût variable) et vrais concurrents, au
   * lieu d'un texte écrit pour un seul scénario.
   */
  intro: {
    title: string;
    /**
     * Nom de l'ENTREPRISE reprise, qui n'est pas toujours celui de l'équipe :
     * en classe, l'équipe s'appelle « Équipe 3 ». La phrase d'accueil présente
     * la maison, pas l'équipe.
     */
    company: string;
    tagline: string;
    briefing: string;
    context: string;
    dilemma: {
      question: string;
      routes: { label: string; gain: string; risque: string }[];
    };
    capacity: number;
    fixedCostsPerRound: number;
    variableCostPerUnit: number;
    /** Trésorerie d'ouverture : de quoi tenir combien de temps ? */
    cash: number;
    /**
     * Le marché tel qu'il est JOUÉ, segment par segment. Les tailles, les prix
     * de référence et les délais de règlement viennent du snapshot : ce sont
     * ceux de la partie, périodicité et réglages de l'enseignant compris.
     */
    segments: {
      name: string;
      size: number;
      refPrice: number;
      paymentDelayDays: number;
      /** Votre part sur ce segment au tour écoulé. Null au tour 1. */
      yourShare: number | null;
    }[];
    competitors: string[];
  };
  /** Niveau de difficulté (préréglage en données, doc 08 §2). */
  difficulty: { level: number; name: string; hintMaxLevel: number };
  /** Décisions exposées à ce niveau (prix/production/marketing : toujours). */
  enabledDecisions: {
    quality: boolean;
    maintenance: boolean;
    finance: boolean;
    insurance: boolean;
    hr: boolean;
    investment: boolean;
    placement: boolean;
    dividend: boolean;
  };
  /**
   * Réserves distribuables : les bénéfices des tours passés non encore versés
   * aux associés. C'est le plafond du dividende, et l'élève doit le connaître
   * avant de décider, sans quoi il propose un chiffre au hasard.
   */
  distributableReserves: number;
  /** Saison du tour courant : coefficients ≠ 1 (marché global et segments). */
  seasonNotes: { name: string; coef: number }[];
  /** Investissement proposé par le scénario (échelle de la périodicité). */
  investmentOffer: { costPerCapacityUnit: number; maxPerRound: number } | null;
  /** Échéance d'emprunt obligatoire du prochain tour et dette restante. */
  debtSchedule: { nextMandatory: number; outstanding: number } | null;
  /**
   * DOSSIER BANCAIRE : ce que la banque consent pour le tour à jouer, au vu
   * des plans de trésorerie déposés jusqu'ici, et son verdict sur le dernier.
   * `null` quand le scénario n'ouvre pas de dossier bancaire.
   */
  bankFile: {
    /** Confiance actuelle, de 0 à 1. */
    trust: number;
    /** Plafond de découvert consenti pour le tour à jouer. */
    overdraftLimit: number;
    /** Plafond nominal du scénario, celui d'une confiance pleine. */
    fullOverdraftLimit: number;
    /** Taux de découvert applicable au tour à jouer. */
    overdraftAnnualRate: number;
    /** Emprunt demandé et refusé au tour précédent faute de plan. */
    refusedLoan: number | null;
    /** Fiabilité du dernier plan déposé (0..1) ; null si aucun. */
    lastReliability: number | null;
  } | null;
  /** Outils de trésorerie du scénario (taux affichés dans le formulaire). */
  treasuryOffer: {
    discountAnnualRate: number;
    discountMaxShare: number;
    factoringFeeRate: number;
    overdraftLimit: number;
    /** Taux du placement, absent si le scénario n'en propose pas. */
    placementAnnualRate: number | null;
    /** Trésorerie placée au tour précédent, revenue en caisse à l'ouverture. */
    maturedPlacement: number;
  } | null;
  /**
   * Commande exceptionnelle proposée pour le tour courant (rotation du pool,
   * doc 02 §5.1) — avec le coût variable unitaire pour poser l'arbitrage.
   */
  orderOffer: {
    code: string;
    title: string;
    narrative: string;
    units: number;
    price: number;
    paymentDelayDays: number;
    unitVariableCost: number;
    refPrice: number;
  } | null;
  /** Coûts unitaires du scénario (après surcharges éco) — analyse des coûts. */
  costFacts: { materialCostPerUnit: number; otherVariableCostPerUnit: number };
  /** Enveloppe d'augmentation de capital des associés (null = illimitée). */
  capitalAllowance: { total: number; remaining: number } | null;
  /** Catalogue d'études du scénario (prix à l'échelle de la périodicité). */
  studiesOffer: {
    marketCost: number;
    priceCost: number;
    financeCost: number;
    projectCost: number;
  } | null;
  /** Rapports des études achetées au dernier tour résolu (doc 02 §8bis). */
  studyReports: StudyReports | null;
}

/** Rapports d'études : des données riches et variées pour décider. */
export interface StudyReports {
  round: number;
  cost: number;
  market?: {
    segments: {
      name: string;
      potential: number;
      yourShare: number;
      yourSold: number;
      yourLost: number;
    }[];
    competitors: {
      name: string;
      isPlayer: boolean;
      avgPrice: number | null;
      marketShare: number;
      revenue: number;
      netIncome: number;
    }[];
  };
  price?: {
    yourPrice: number;
    segments: {
      name: string;
      refPrice: number;
      elasticity: number;
      minAcceptablePrice: number;
      thresholds: number[];
    }[];
  };
  finance?: {
    ratios: {
      profitability: number;
      returnOnCapitalEmployed: number;
      returnOnEquity: number;
      debtToEquity: number;
      assetTurnover: number;
    };
    costs: {
      unitVariableCost: number;
      unitMargin: number;
      breakEvenUnits: number;
      safetyMargin: number;
    };
    sector: { teams: number; avgRevenue: number; avgNetIncome: number; avgNetTreasury: number };
  };
  project?: {
    investment: {
      capacityUnits: number;
      outlay: number;
      lostUnits: number;
      unitMargin: number;
      ratePerRound: number;
      rounds: number;
      npv: number;
      irr: number | null;
      paybackRounds: number | null;
    } | null;
    currentOffer: {
      title: string;
      units: number;
      price: number;
      margin: number;
      carryCost: number;
      paymentDelayDays: number;
    } | null;
  };
}

export async function getGameView(gameId: string, userId: string): Promise<GameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return null;
  const { team: playerTeam, allTeams: teamRows } = await findUserTeam(gameId, userId);
  if (!playerTeam) return null;

  const gameRounds = await db
    .select()
    .from(rounds)
    .where(eq(rounds.gameId, gameId))
    .orderBy(asc(rounds.index));
  const resolved = gameRounds.filter((r) => r.status === "resolved");
  const roundIndexById = new Map(gameRounds.map((r) => [r.id, r.index]));

  const gameResults = await db
    .select()
    .from(roundResults)
    .where(inArray(roundResults.roundId, gameRounds.map((r) => r.id)));

  const history = gameResults
    .filter((r) => r.teamId === playerTeam.id)
    .map((r) => ({
      round: roundIndexById.get(r.roundId)!,
      revenue: Number(r.revenue),
      netIncome: Number(r.netIncome),
      netTreasury: Number(r.netTreasury),
    }))
    .sort((a, b) => a.round - b.round);

  // Historique des ventes : les décisions de TOUS les tours joués, pour
  // remettre le prix pratiqué en face des volumes qu'il a produits. Sans le
  // prix, la série des ventes ne s'explique pas.
  const playerDecisionRows = await db
    .select()
    .from(decisions)
    .where(
      and(
        inArray(decisions.roundId, gameRounds.map((r) => r.id)),
        eq(decisions.teamId, playerTeam.id),
      ),
    );
  const priceByRound = new Map(
    playerDecisionRows.map((d) => [
      roundIndexById.get(d.roundId)!,
      (d.payload as RoundDecisions).price ?? null,
    ]),
  );
  const forecastByRound = new Map(
    playerDecisionRows.map((d) => [
      roundIndexById.get(d.roundId)!,
      (d.payload as RoundDecisions).forecast ?? null,
    ]),
  );

  const lastRound = resolved.at(-1);
  let lastResult: CompanyRoundResult | null = null;
  let lastEvents: string[] = [];
  let lastDecisions: RoundDecisions | null = null;
  if (lastRound) {
    const row = gameResults.find((r) => r.roundId === lastRound.id && r.teamId === playerTeam.id);
    if (row) {
      const trace = row.engineTrace as {
        production: CompanyRoundResult["production"];
        breakeven: CompanyRoundResult["breakeven"];
        events: string[];
        extraOrders?: CompanyRoundResult["extraOrders"] | null;
        orderOffer?: CompanyRoundResult["orderOffer"] | null;
        studies?: CompanyRoundResult["studies"] | null;
        capital?: CompanyRoundResult["capital"] | null;
        insurance?: CompanyRoundResult["insurance"] | null;
        supplier?: CompanyRoundResult["supplier"] | null;
        hr?: CompanyRoundResult["hr"] | null;
        investment?: CompanyRoundResult["investment"] | null;
        qualityCosts?: CompanyRoundResult["qualityCosts"] | null;
        debt?: CompanyRoundResult["debt"] | null;
        treasury?: CompanyRoundResult["treasury"] | null;
        bank?: CompanyRoundResult["bank"] | null;
      };
      lastResult = {
        companyId: playerTeam.id,
        incomeStatement: row.incomeStatement as CompanyRoundResult["incomeStatement"],
        balanceSheet: row.balanceSheet as CompanyRoundResult["balanceSheet"],
        cashFlow: row.cashFlow as CompanyRoundResult["cashFlow"],
        functionalBalance: {
          frng: Number(row.frng),
          bfr: Number(row.bfr),
          netTreasury: Number(row.netTreasury),
        },
        ratios: {} as CompanyRoundResult["ratios"],
        market: {
          bySegment: row.marketDetail as CompanyRoundResult["market"]["bySegment"],
          totalShare: Number(row.marketShare),
        },
        production: trace.production,
        breakeven: trace.breakeven,
        extraOrders: trace.extraOrders ?? undefined,
        orderOffer: trace.orderOffer ?? undefined,
        studies: trace.studies ?? undefined,
        capital: trace.capital ?? undefined,
        insurance: trace.insurance ?? undefined,
        supplier: trace.supplier ?? undefined,
        hr: trace.hr ?? undefined,
        investment: trace.investment ?? undefined,
        qualityCosts: trace.qualityCosts ?? undefined,
        debt: trace.debt ?? undefined,
        treasury: trace.treasury ?? undefined,
        bank: trace.bank ?? undefined,
        kpis: {},
      };
      lastEvents = trace.events ?? [];
    }
    const decisionRow = playerDecisionRows.find((d) => d.roundId === lastRound.id);
    if (decisionRow) lastDecisions = decisionRow.payload as RoundDecisions;
  }

  // Décisions déjà soumises pour le tour courant (mode classe : en attente de clôture)
  let pendingDecisions: RoundDecisions | null = null;
  const currentRoundRow = gameRounds.find((r) => r.index === game.currentRound);
  if (currentRoundRow && currentRoundRow.status === "open") {
    const row = playerDecisionRows.find((d) => d.roundId === currentRoundRow.id);
    if (row && row.status === "validated") pendingDecisions = row.payload as RoundDecisions;
  }

  // dernier état persisté de l'équipe (échéanciers d'emprunts pour l'affichage)
  const stateRow = (
    await db
      .select()
      .from(companyStates)
      .where(eq(companyStates.teamId, playerTeam.id))
      .orderBy(desc(companyStates.roundIndex))
      .limit(1)
  )[0];
  const currentState = stateRow?.state as
    | { loans?: { remaining: number; perRound: number }[]; bankTrust?: number }
    | undefined;

  const rankingRows = await db.select().from(gameRankings).where(eq(gameRankings.gameId, gameId));
  const ranking = rankingRows
    .map((r) => {
      const team = teamRows.find((t) => t.id === r.teamId);
      return {
        name: teamDisplayName(team?.name ?? "?"),
        isPlayer: r.teamId === playerTeam.id,
        cumulativeNetIncome: Number(
          (r.detail as { cumulativeNetIncome?: number })?.cumulativeNetIncome ?? 0,
        ),
        rank: r.rank,
        bpi: Number(r.bpi),
      };
    })
    .sort((a, b) => a.rank - b.rank);
  const playerRankingRow = rankingRows.find((r) => r.teamId === playerTeam.id);
  const playerDimensions =
    ((playerRankingRow?.detail as { dimensions?: Partial<Record<BpiDimension, number>> })
      ?.dimensions as Partial<Record<BpiDimension, number>> | undefined) ?? null;

  // Rapports des études achetées au dernier tour résolu (doc 02 §8bis) :
  // construits à la lecture depuis les résultats persistés — la facture est
  // déjà dans les comptes, ici on livre l'information payée.
  const studyReports: StudyReports | null = await (async () => {
    const purchased = lastResult?.studies?.purchased ?? [];
    if (!lastRound || !lastResult || purchased.length === 0) return null;
    const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
    const cvu =
      snapshot.product.materialCostPerUnit + snapshot.product.otherVariableCostPerUnit;
    const lastRows = gameResults.filter((r) => r.roundId === lastRound.id);
    const reports: StudyReports = {
      round: lastRound.index,
      cost: lastResult.studies?.cost ?? 0,
    };

    if (purchased.includes("market")) {
      const own = lastResult.market.bySegment;
      reports.market = {
        segments: snapshot.market.segments.map((seg) => {
          const d = own[seg.code];
          return {
            name: seg.name,
            potential: d?.potential ?? 0,
            yourShare: d?.share ?? 0,
            yourSold: d?.sold ?? 0,
            yourLost: d?.lost ?? 0,
          };
        }),
        competitors: lastRows
          .map((row) => {
            const detail = row.marketDetail as Record<
              string,
              { sold?: number }
            > | null;
            const units = detail
              ? Object.values(detail).reduce((sum, d) => sum + (d.sold ?? 0), 0)
              : 0;
            return {
              name: teamDisplayName(teamRows.find((t) => t.id === row.teamId)?.name ?? "?"),
              isPlayer: row.teamId === playerTeam.id,
              avgPrice: units > 1 ? Number(row.revenue) / units : null,
              marketShare: Number(row.marketShare),
              revenue: Number(row.revenue),
              netIncome: Number(row.netIncome),
            };
          })
          .sort((a, b) => b.marketShare - a.marketShare),
      };
    }

    if (purchased.includes("price")) {
      reports.price = {
        yourPrice: lastDecisions?.price ?? 0,
        segments: snapshot.market.segments.map((seg) => ({
          name: seg.name,
          refPrice: seg.refPrice,
          elasticity: Math.round(seg.priceElasticity * 10) / 10,
          minAcceptablePrice: seg.minAcceptablePrice,
          thresholds: (seg.psychThresholds ?? []).map((t) => t.threshold),
        })),
      };
    }

    if (purchased.includes("finance")) {
      const ratios = computeRatios(
        lastResult.incomeStatement,
        lastResult.balanceSheet,
        snapshot.finance.taxRate,
      );
      const others = lastRows.filter((r) => r.teamId !== playerTeam.id);
      const avg = (pick: (r: (typeof lastRows)[number]) => number) =>
        others.length > 0 ? others.reduce((sum, r) => sum + pick(r), 0) / others.length : 0;
      reports.finance = {
        ratios: {
          profitability: ratios.profitability,
          returnOnCapitalEmployed: ratios.returnOnCapitalEmployed,
          returnOnEquity: ratios.returnOnEquity,
          debtToEquity: ratios.debtToEquity,
          assetTurnover: ratios.assetTurnover,
        },
        costs: {
          unitVariableCost: cvu,
          unitMargin: (lastDecisions?.price ?? 0) - cvu,
          breakEvenUnits: lastResult.breakeven.breakEvenUnits,
          safetyMargin: lastResult.breakeven.safetyMargin,
        },
        sector: {
          teams: others.length,
          avgRevenue: avg((r) => Number(r.revenue)),
          avgNetIncome: avg((r) => Number(r.netIncome)),
          avgNetTreasury: avg((r) => Number(r.netTreasury)),
        },
      };
    }

    if (purchased.includes("project")) {
      const inv = snapshot.investment;
      const lostUnits = Object.values(lastResult.market.bySegment).reduce(
        (sum, d) => sum + d.lost,
        0,
      );
      const unitMargin = (lastDecisions?.price ?? snapshot.market.segments[0]?.refPrice ?? 0) - cvu;
      let investment: NonNullable<StudyReports["project"]>["investment"] = null;
      if (inv) {
        const outlay = inv.maxPerRound * inv.costPerCapacityUnit;
        const ratePerRound = (snapshot.finance.loanAnnualRate * snapshot.roundDays) / 360;
        const rounds = Math.round(inv.depreciationRounds);
        const extraSold = Math.min(lostUnits, inv.maxPerRound);
        const flowPerRound = extraSold * unitMargin;
        const flows = [-outlay, ...Array.from({ length: rounds }, () => flowPerRound)];
        investment = {
          capacityUnits: inv.maxPerRound,
          outlay,
          lostUnits,
          unitMargin,
          ratePerRound,
          rounds,
          npv: npv(flows, ratePerRound),
          irr: irr(flows),
          paybackRounds: paybackPeriod(flows),
        };
      }
      const offer = orderOfferForRound(snapshot, game.currentRound, game.seed);
      reports.project = {
        investment,
        currentOffer: offer
          ? {
              title: offer.title,
              units: offer.units,
              price: offer.price,
              margin: offer.units * (offer.price - cvu),
              carryCost:
                offer.units *
                offer.price *
                (offer.paymentDelayDays / 360) *
                snapshot.finance.overdraftAnnualRate,
              paymentDelayDays: offer.paymentDelayDays,
            }
          : null,
      };
    }
    return reports;
  })();

  const profile = game.difficultyProfile as { kind?: GameKind };
  return {
    gameId,
    kind: profile.kind ?? "solo",
    status: game.status,
    currentRound: game.currentRound,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    playerTeamId: playerTeam.id,
    playerTeamName: teamDisplayName(playerTeam.name),
    // L'équipe peut encore se nommer tant qu'elle porte son numéro et que le
    // premier tour n'est pas clos.
    peutSeNommer: porteUnNomParDefaut(playerTeam.name) && game.currentRound === 1,
    pendingDecisions,
    announcedEventCards: readPendingEvents(game.difficultyProfile).map((card) => {
      const target = card.teamId ? teamRows.find((t) => t.id === card.teamId) : undefined;
      return {
        code: card.code,
        teamId: card.teamId,
        teamName: target?.name ?? null,
        isMyTeam: card.teamId === playerTeam.id,
      };
    }),
    lastResult,
    forecastReview: (() => {
      if (!lastRound || !lastResult) return null;
      const round = roundIndexById.get(lastRound.id)!;
      const forecast = forecastByRound.get(round);
      if (!forecast) return null;
      // Tout ce qui a été vendu, commande exceptionnelle comprise : c'est ce
      // que le moteur compare au plan, et l'élève savait en décidant s'il
      // acceptait la commande.
      const sold =
        Object.values(lastResult.market.bySegment).reduce((sum, d) => sum + d.sold, 0) +
        (lastResult.extraOrders?.delivered ?? 0) +
        (lastResult.orderOffer?.delivered ?? 0);
      const lines: {
        label: string;
        forecast: number;
        actual: number;
        relative: number | null;
        format: "units" | "euro";
      }[] = [];
      const push = (
        label: string,
        expected: number | undefined,
        actual: number,
        format: "units" | "euro",
      ) => {
        if (expected === undefined) return;
        lines.push({
          label,
          forecast: expected,
          actual,
          // Une prévision nulle rend l'écart relatif indéfini : mieux vaut ne
          // rien afficher qu'un pourcentage infini.
          relative: Math.abs(expected) > 0.5 ? (actual - expected) / Math.abs(expected) : null,
          format,
        });
      };
      push("Ventes", forecast.expectedUnits, sold, "units");
      push(
        "Trésorerie nette",
        forecast.expectedCash,
        lastResult.functionalBalance.netTreasury,
        "euro",
      );
      return lines.length > 0 ? { round, lines } : null;
    })(),
    salesHistory: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const codes = snapshot.market.segments.map((seg) => seg.code);
      return {
        segments: snapshot.market.segments.map((seg) => seg.name),
        commissions: snapshot.market.segments
          .filter((seg) => (seg.commissionRate ?? 0) > 0)
          .map((seg) => ({ segment: seg.name, rate: seg.commissionRate! })),
        rounds: gameResults
          .filter((r) => r.teamId === playerTeam.id)
          .map((r) => {
            const detail = r.marketDetail as Record<
              string,
              { potential: number; sold: number; lost: number; revenue?: number } | undefined
            >;
            const rows = codes.map((code) => detail[code]);
            const index = roundIndexById.get(r.roundId)!;
            const prix = priceByRound.get(index) ?? null;
            const bySegment = codes.map((code) => ({
              potential: Math.round(detail[code]?.potential ?? 0),
              sold: Math.round(detail[code]?.sold ?? 0),
              // Les parties jouées avant que le moteur ne relève le chiffre
              // d'affaires par canal n'en portent pas : il se reconstitue
              // exactement, l'entreprise pratiquant un seul prix.
              revenue: Math.round(
                detail[code]?.revenue ?? (detail[code]?.sold ?? 0) * (prix ?? 0),
              ),
            }));
            return {
              round: index,
              price: prix,
              forecastUnits: forecastByRound.get(index)?.expectedUnits ?? null,
              bySegment,
              sold: Math.round(rows.reduce((sum, d) => sum + (d?.sold ?? 0), 0)),
              lost: Math.round(rows.reduce((sum, d) => sum + (d?.lost ?? 0), 0)),
            };
          })
          .sort((a, b) => a.round - b.round),
      };
    })(),
    roundBriefing: (() => {
      if (!lastResult) return null;
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const definition = scenarioByCode(snapshot.code);
      const preset = presetFromProfile(game.difficultyProfile);
      return roundBriefing({
        result: lastResult,
        vocabulary: definition.vocabulary,
        enabled: {
          finance: preset.decisions.finance,
          investment: preset.decisions.investment,
          hr: preset.decisions.hr,
        },
        hasTreasuryTools: Boolean(snapshot.treasury),
        hasInvestmentOffer: Boolean(snapshot.investment),
        perishable: Boolean(snapshot.perishable),
      });
    })(),
    lastEvents,
    history,
    ranking,
    playerDimensions,
    lastDecisions,
    startingDecisions: (() => {
      /**
       * Le formulaire n'accepte pas n'importe quel nombre : ses champs
       * avancent par pas de 1, le prix par pas de 0,1. Une valeur par défaut
       * calculée, donc décimale, rend le tour ENTIÈREMENT insoumettable : le
       * navigateur refuse la validation sans message visible, et l'élève clique
       * sans que rien ne se passe. Un défaut proposé doit être soumettable tel
       * quel.
       */
      const auPas = (d: RoundDecisions): RoundDecisions => ({
        ...d,
        price: Math.round(d.price * 10) / 10,
        productionPlan: Math.round(d.productionPlan),
        marketingBudget: Math.round(d.marketingBudget),
        qualityBudget: Math.round(d.qualityBudget),
        maintenanceBudget: Math.round(d.maintenanceBudget),
      });
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const state = stateRow?.state as CompanyState | undefined;
      // Sans état persisté il n'y a pas de capacité à viser : on s'en tient
      // alors au prix de référence du secteur, jamais à celui d'un autre.
      if (!state) {
        const main = [...snapshot.market.segments].sort((a, b) => b.size - a.size)[0];
        return auPas({
          price: main?.refPrice ?? 50,
          productionPlan: 0,
          marketingBudget: 0.5 * snapshot.marketing.scale,
          qualityBudget: 0.5 * snapshot.production.qualityScale,
          maintenanceBudget: snapshot.production.maintenanceReference,
        });
      }
      return auPas(
        neutralDecisions({ scenario: snapshot, state, roundIndex: game.currentRound }),
      );
    })(),
    insuranceOffer: (() => {
      const offer = (
        game.scenarioSnapshot as {
          insurance?: { premiumPerRound: number; coveredEventCodes: string[] };
        }
      ).insurance;
      return offer
        ? { premium: offer.premiumPerRound, coveredEventCodes: offer.coveredEventCodes }
        : null;
    })(),
    insuranceFormulas: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const formulas = snapshot.insurance?.formulas;
      if (!formulas || formulas.length === 0) return null;
      // Le libellé français du deck de cartes, et non la clé technique : c'est
      // le seul endroit de l'écran de décision où l'élève lisait « natural
      // disaster, cold wave ». Les mêmes événements lui seront montrés sous
      // leur nom de carte quand ils tomberont.
      const eventLabels = (codes: string[]) =>
        codes.map((c) => cardByCode.get(c)?.title ?? c.replace(/_/g, " "));
      return formulas.map((f) => ({
        code: f.code,
        name: f.name,
        premium: f.premiumPerRound,
        coveredLabels: eventLabels(f.coveredEventCodes),
      }));
    })(),
    suppliersOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (!snapshot.suppliers || snapshot.suppliers.length === 0) return null;
      return snapshot.suppliers.map((s) => ({
        code: s.code,
        name: s.name,
        narrative: s.narrative,
        costMultiplier: s.costMultiplier,
        qualityBonus: s.qualityBonus,
        paymentDelayDays: s.paymentDelayDays,
        supplyRiskProbability: s.supplyRiskProbability,
        materialCostPerUnit: Math.round(snapshot.product.materialCostPerUnit * s.costMultiplier * 100) / 100,
      }));
    })(),
    vocabulary: scenarioByCode(
      (game.scenarioSnapshot as { code?: string } | null)?.code,
    ).vocabulary,
    sector: scenarioByCode(
      (game.scenarioSnapshot as { code?: string } | null)?.code,
    ).sector,
    segmentNames: Object.fromEntries(
      (game.scenarioSnapshot as EngineScenarioConfig).market.segments.map((s) => [
        s.code,
        s.name,
      ]),
    ),
    sectorKpis: (() => {
      if (!lastResult) return [];
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const segmentUnits = Object.values(lastResult.market.bySegment).reduce(
        (sum, s) => sum + s.sold,
        0,
      );
      // Le chiffre d'affaires inclut les commandes fermes et l'offre du tour :
      // les indicateurs par unité doivent compter les mêmes ventes, sans quoi
      // un PMC ou un ticket moyen serait faussé les tours de grosse commande.
      const totalUnits =
        segmentUnits +
        (lastResult.extraOrders?.delivered ?? 0) +
        (lastResult.orderOffer?.delivered ?? 0);
      // Segments du tour précédent : seule donnée nécessaire à l'attrition.
      const previousRound = resolved.at(-2);
      const previousRow = previousRound
        ? gameResults.find(
            (r) => r.roundId === previousRound.id && r.teamId === playerTeam.id,
          )
        : undefined;
      return computeSectorKpis(scenarioByCode(snapshot.code).kpis, {
        result: lastResult,
        previousSegments:
          (previousRow?.marketDetail as CompanyRoundResult["market"]["bySegment"]) ?? null,
        segmentUnits,
        totalUnits,
        roundDays: snapshot.roundDays,
        scenario: snapshot,
      });
    })(),
    intro: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const definition = scenarioByCode(snapshot.code);
      const state = stateRow?.state as CompanyState | undefined;
      return {
        title: definition.title,
        company: definition.playerTeamName,
        tagline: definition.tagline,
        briefing: definition.briefing,
        context: definition.context,
        dilemma: definition.dilemma,
        capacity: Math.round(state?.machineCapacity ?? 0),
        fixedCostsPerRound: snapshot.fixedCostsPerRound,
        variableCostPerUnit:
          snapshot.product.materialCostPerUnit + snapshot.product.otherVariableCostPerUnit,
        cash: Math.round(state?.finance.cash ?? 0),
        segments: snapshot.market.segments.map((seg) => ({
          name: seg.name,
          size: Math.round(seg.size),
          refPrice: seg.refPrice,
          paymentDelayDays: seg.paymentDelayDays,
          yourShare: lastResult?.market.bySegment[seg.code]?.share ?? null,
        })),
        competitors: teamRows
          .filter((t) => t.id !== playerTeam.id)
          .map((t) => teamDisplayName(t.name)),
      };
    })(),
    capacityFacts: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const state = stateRow?.state as CompanyState | undefined;
      if (!state) return null;
      const mc = state.machineCapacity + (state.pendingCapacity ?? 0);
      const lc = (state.headcount * state.hoursPerEmployee * state.productivity) /
        snapshot.product.hoursPerUnit;
      const bottleneck: "machine" | "labor" | "balanced" =
        mc < lc * 0.95 ? "machine" : lc < mc * 0.95 ? "labor" : "balanced";
      return {
        machineCapacity: Math.round(mc),
        laborCapacity: Math.round(lc),
        bottleneck,
        headcount: state.headcount,
        hoursPerEmployee: state.hoursPerEmployee,
        productivity: state.productivity,
        hoursPerUnit: snapshot.product.hoursPerUnit,
      };
    })(),
    difficulty: (() => {
      const preset = presetFromProfile(game.difficultyProfile);
      return { level: preset.level, name: preset.name, hintMaxLevel: preset.hintMaxLevel };
    })(),
    enabledDecisions: presetFromProfile(game.difficultyProfile).decisions,
    distributableReserves: Math.max(
      0,
      (stateRow?.state as CompanyState | undefined)?.reserves ?? 0,
    ),
    investmentOffer: (() => {
      const offer = (game.scenarioSnapshot as EngineScenarioConfig).investment;
      return offer
        ? { costPerCapacityUnit: offer.costPerCapacityUnit, maxPerRound: offer.maxPerRound }
        : null;
    })(),
    debtSchedule: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (snapshot.finance.loanDurationRounds === undefined) return null;
      // état courant de l'équipe : dernier état persisté (ou état initial)
      const loans = (currentState?.loans ?? []) as { remaining: number; perRound: number }[];
      const outstanding = loans.reduce((s, l) => s + l.remaining, 0);
      const nextMandatory = loans.reduce((s, l) => s + Math.min(l.perRound, l.remaining), 0);
      return { nextMandatory, outstanding };
    })(),
    bankFile: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const bank = snapshot.finance.bank;
      if (!bank) return null;
      const trust = confianceInitiale((currentState ?? {}) as CompanyState);
      const conditions = conditionsBancaires(
        trust,
        {
          overdraftLimit: snapshot.finance.overdraftLimit,
          overdraftAnnualRate: snapshot.finance.overdraftAnnualRate,
        },
        bank,
      );
      const dernier = lastResult?.bank ?? null;
      return {
        trust,
        overdraftLimit: conditions.overdraftLimit,
        fullOverdraftLimit: snapshot.finance.overdraftLimit,
        overdraftAnnualRate: conditions.overdraftAnnualRate,
        refusedLoan:
          dernier && dernier.loanRequested > 0 && dernier.loanGranted === 0
            ? dernier.loanRequested
            : null,
        lastReliability: dernier?.reliability ?? null,
      };
    })(),
    treasuryOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      return snapshot.treasury
        ? {
            discountAnnualRate: snapshot.treasury.discountAnnualRate,
            placementAnnualRate: snapshot.treasury.placementAnnualRate ?? null,
            maturedPlacement: Math.round(
              (stateRow?.state as CompanyState | undefined)?.finance.shortTermInvestment ?? 0,
            ),
            discountMaxShare: snapshot.treasury.discountMaxShare,
            factoringFeeRate: snapshot.treasury.factoringFeeRate,
            // Le plafond ANNONCÉ doit être celui qui sera appliqué : quand la
            // banque a resserré la ligne, l'afficher au nominal ferait
            // dépasser un élève qui a fait le calcul juste.
            overdraftLimit: (() => {
              const bank = snapshot.finance.bank;
              if (!bank) return snapshot.finance.overdraftLimit;
              return conditionsBancaires(
                confianceInitiale((currentState ?? {}) as CompanyState),
                {
                  overdraftLimit: snapshot.finance.overdraftLimit,
                  overdraftAnnualRate: snapshot.finance.overdraftAnnualRate,
                },
                bank,
              ).overdraftLimit;
            })(),
          }
        : null;
    })(),
    capitalAllowance: (() => {
      const cap = (game.scenarioSnapshot as EngineScenarioConfig).finance.maxCapitalIncreaseTotal;
      if (cap === undefined) return null;
      const raised = (currentState as { capitalRaised?: number } | undefined)?.capitalRaised ?? 0;
      return { total: cap, remaining: Math.max(0, cap - raised) };
    })(),
    costFacts: (() => {
      const product = (game.scenarioSnapshot as EngineScenarioConfig).product;
      return {
        materialCostPerUnit: product.materialCostPerUnit,
        otherVariableCostPerUnit: product.otherVariableCostPerUnit,
      };
    })(),
    studiesOffer: (() => {
      const catalog = (game.scenarioSnapshot as EngineScenarioConfig).studies;
      return catalog ? { ...catalog } : null;
    })(),
    studyReports,
    orderOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const offer = orderOfferForRound(snapshot, game.currentRound, game.seed);
      if (!offer) return null;
      return {
        code: offer.code,
        title: offer.title,
        narrative: offer.narrative,
        units: offer.units,
        price: offer.price,
        paymentDelayDays: offer.paymentDelayDays,
        unitVariableCost:
          snapshot.product.materialCostPerUnit + snapshot.product.otherVariableCostPerUnit,
        refPrice: snapshot.market.segments[0]?.refPrice ?? offer.price,
      };
    })(),
    seasonNotes: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const idx = game.currentRound - 1;
      const notes: { name: string; coef: number }[] = [];
      const global = snapshot.market.seasonality[idx];
      if (global !== undefined && Math.abs(global - 1) > 0.01)
        notes.push({ name: "Marché", coef: global });
      for (const seg of snapshot.market.segments) {
        const coef = seg.seasonality?.[idx];
        if (coef !== undefined && Math.abs(coef - 1) > 0.01)
          notes.push({ name: seg.name, coef });
      }
      return notes;
    })(),
  };
}
