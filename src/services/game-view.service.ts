import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  companyStates,
  decisions,
  gameRankings,
  games,
  roundResults,
  rounds,
} from "@/db/schema";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { computeSectorKpis, type KpiFormat } from "@/config/scenarios/sector-kpis";
import { presetFromProfile } from "@/config/difficulty";
import { teamDisplayName } from "@/config/nom-equipe";
import {
  compositionDesEquipes,
  peutChoisirSonEquipe,
  type EquipeEtSesMembres,
} from "@/services/affectation.service";
import { courrierParCode } from "@/config/courriers/registre";
import type { EventInstance } from "@/engine/types";
import { peekEventDraw } from "@/engine/events";
import { activeEventsOf, injectedEvents } from "@/services/round-resolution.service";
import { proposedDecisionsFor, startingDecisionsFor } from "@/services/decision-baseline";
import { orderOfferForRound } from "@/engine/simulation";
import { isMultiProduct, isProductAvailable, rdOpeningOf, suppliersOf, toGamme, offerProductIndex } from "@/engine/gamme";
import { COMMUNICATION_AXIS_LABELS, axesProposables } from "@/engine/market/communication";
import { computeRatios } from "@/engine/finance/ratios";
import { conditionsBancaires, confianceServie } from "@/engine/finance/bank";
import { irr, npv, paybackPeriod } from "@/engine/investment";
import { roundBriefing, type RoundBriefing } from "@/pedagogy/round-briefing";
import { computeRseIndex, type RseIndex } from "@/scoring/rse";
import { RSE_CARD_CODES } from "@/engine/rse";
import { computeRseReport, type RseReport } from "@/scoring/rse-report";
import { playWindowFor, playLockMessage } from "@/services/play-lock";
import { demandeDuTour, type DemandeDeSubvention } from "@/services/subvention.service";
import type { ExigenceSauvetage } from "@/services/sauvetage";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  RoundDecisions,
  CommunicationAxis,
  AccountingEntry,
  GeneralLedgerAccount,
  AccountingCategory,
  AccountCode,
} from "@/engine/types";
import {
  findUserTeam,
  readPendingEvents,
} from "@/services/round-resolution.service";
import { classementOuvert } from "@/config/rideau-classement";
import type { GameKind } from "@/services/game-creation.service";

/** Réexport : le nom affiché se calcule dans la config des noms d'équipe. */
export { teamDisplayName };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Transforme un Ledger en format d'affichage avec vues synthétiques.
 */
function formatAccountingData(ledger?: {
  entries: AccountingEntry[];
  accounts: Map<AccountCode, GeneralLedgerAccount>;
}): GameView["accounting"] {
  if (!ledger) return undefined;

  const byCategory: Record<AccountingCategory, AccountingEntry[]> = {
    purchase: [],
    sale: [],
    payroll: [],
    tax: [],
    financing: [],
    depreciation: [],
    inventory: [],
    cash: [],
    other: [],
  };

  for (const entry of ledger.entries) {
    byCategory[entry.category].push(entry);
  }

  const glByAccount: Record<AccountCode, GeneralLedgerAccount> = {};
  for (const [code, account] of ledger.accounts) {
    glByAccount[code] = account;
  }

  return {
    journal: ledger.entries,
    generalLedger: Array.from(ledger.accounts.values()),
    byCategory,
    glByAccount,
  };
}

// ---------------------------------------------------------------------------
// Lecture : vue joueur
// ---------------------------------------------------------------------------

export interface GameView {
  gameId: string;
  kind: GameKind;
  status: string;
  currentRound: number;
  /**
   * Verrou temporel du tour courant (planning). `playable` faux = hors fenêtre :
   * l'écran passe en lecture seule et « Valider » est grisé. Dates en ISO.
   * Sans fenêtre réglée, toujours ouvert (solo libre, ou classe non planifiée).
   */
  playLock: {
    playable: boolean;
    state: "before" | "open" | "after";
    message: string | null;
    opensAt: string | null;
    closesAt: string | null;
  };
  roundsCount: number;
  roundDays: number;
  playerTeamId: string;
  playerTeamName: string;
  peutSeNommer: boolean;
  /**
   * Les équipes de la classe et qui s'y trouve, pour l'élève rangé d'office
   * dans la mauvaise. Vide en solo : il n'y a personne à rejoindre.
   */
  equipesDeLaClasse: EquipeEtSesMembres[];
  /** L'élève peut encore changer d'équipe lui-même (partie de classe, tour 1). */
  peutChoisirSonEquipe: boolean;
  /** Décisions déjà validées par l'équipe pour le tour courant (mode classe). */
  pendingDecisions: RoundDecisions | null;
  /** Courriers distribués par l'enseignant pour le tour courant. */
  courriersAnnonces: {
    code: string;
    /** null = courrier de marché (toute la classe) ; sinon l'entreprise destinataire. */
    teamId: string | null;
    teamName: string | null;
    isMyTeam: boolean;
  }[];
  /**
   * Courriers ENCORE EN VIGUEUR pour le tour à jouer : reçus à un tour
   * précédent, du moteur ou de l'enseignant, et pas encore éteints — une
   * lettre qui vaut deux trimestres pèse sur les décisions du second. Sans
   * elles, l'équipe décidait sans savoir que la conjoncture morose courait
   * toujours.
   */
  courriersEnCours: {
    code: string;
    teamId: string | null;
    teamName: string | null;
    isMyTeam: boolean;
    /** Tours pendant lesquels le courrier pèse encore, celui-ci compris. */
    roundsLeft: number;
  }[];
  /**
   * LE COURRIER DU TOUR À JOUER, lu d'avance : les plis que le moteur tirera
   * à la clôture, exactement (même graine, même tour, mêmes entreprises).
   * Vide une fois la partie finie. Ne porte que ce qui concerne l'équipe qui
   * lit : les courriers de marché et ceux qui lui sont adressés. Les courriers
   * RSE, appelés par le standing de chaque entreprise, restent découverts aux
   * résultats.
   */
  upcomingDraw: { code: string; teamId: string | null; isMyTeam: boolean }[];
  lastResult: CompanyRoundResult | null;
  /**
   * Tous les tours RÉSOLUS, du plus ancien au plus récent : de quoi rebâtir le
   * tableau de bord complet de chaque période dans l'accordéon de l'arène, sans
   * se limiter au dernier tour. Le dernier élément recoupe `lastResult`.
   */
  periods: {
    round: number;
    result: CompanyRoundResult;
    events: string[];
    decisions: RoundDecisions | null;
    forecastReview: GameView["forecastReview"];
    sectorKpis: GameView["sectorKpis"];
    competitiveBenchmark: GameView["competitiveBenchmark"];
    /** Indice RSE du tour (mesure indicative, sans effet sur la partie — Lot 1). */
    rse: RseIndex;
    /** Journal et grand livre du tour (exposé dans le tableau de bord comptabilité). */
    accounting?: GameView["accounting"];
  }[];
  /**
   * Rapport extra-financier (Lot 3) : synthèse DPEF SIMPLIFIÉE et indicative sur
   * tous les tours joués. `available` est faux quand l'équipe n'a jamais engagé
   * la RSE — l'écran invite alors à l'ouvrir plutôt que d'afficher des zéros.
   */
  rseReport: RseReport;
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
  /**
   * Le classement, UNIQUEMENT s'il a été révélé. Vide sinon : en classe et en
   * concours, c'est l'animateur qui ouvre le rideau, et la vue ne porte pas ce
   * qu'il n'a pas encore montré.
   */
  ranking: {
    name: string;
    isPlayer: boolean;
    cumulativeNetIncome: number;
    rank: number;
    bpi: number;
    /** Entreprise en cessation de paiements caractérisée (V2 couche 2, #5). */
    defaillant: boolean;
  }[];
  /** L'état du rideau : révélé ? et y a-t-il quelqu'un pour le lever ? */
  classement: { revele: boolean; parLAnimateur: boolean };
  /** L'IPG de l'équipe, révélé ou non : il mesure sa progression, pas sa place. */
  playerBpi: number | null;
  /** Moyennes 0-100 des dimensions IPG de l'équipe du joueur (6 en v2, doc 08). */
  playerDimensions: Partial<Record<string, number>> | null;
  lastDecisions: RoundDecisions | null;
  /**
   * Le point de départ du secteur, servi au tour 1 quand il n'y a encore rien
   * à reconduire. Calculé ici parce que c'est ici qu'on a le scénario joué ET
   * l'état de l'entreprise : la page, elle, proposait les chiffres de NOVA à
   * tout le monde.
   */
  startingDecisions: RoundDecisions;
  /**
   * Ce que le formulaire PROPOSE ce tour (tour précédent, sinon point de
   * départ) : la référence pour dire si l'équipe a touché prix et volume.
   */
  proposedDecisions: RoundDecisions;
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
    /**
     * Abonnement : le portefeuille d'ouverture et ce qu'il en restera au taux
     * d'attrition de base — la place à prévoir avant tout nouveau venu.
     * Absent hors modèle par abonnement.
     */
    subscription?: {
      members: number;
      expectedRetained: number;
      baseChurnRate: number;
      refPrice: number;
    };
  } | null;
  /**
   * Vocabulaire du secteur joué : on ne vend pas des « unités » dans un hôtel
   * et on n'y a pas de « machines ». Il vient du registre via le code du
   * snapshot, donc une partie garde le vocabulaire de son scénario.
   */
  vocabulary: ScenarioVocabulary;
  /** Le secteur joué, pour l'identité visuelle (icône, couleur). */
  /** Code du scénario joué : « rejouer » doit pouvoir rouvrir le MÊME métier. */
  scenarioCode: string;
  sector: import("@/config/scenarios/registry").Sector;
  /** Le pictogramme du scénario joué (NOVA en un produit et NOVA · gamme n'ont pas le même). */
  scenarioIcon: string;
  /**
   * Noms des segments du snapshot joué, par code. Sans cela le tableau du
   * marché retomberait sur les codes bruts dès qu'on quitte NOVA.
   */
  segmentNames: Record<string, string>;
  /**
   * GAMME : les références du scénario joué, dans l'ordre du moteur, avec ce
   * que le formulaire et les tableaux de bord doivent savoir de chacune —
   * coûts, main-d'œuvre, prix de référence de sa clientèle dominante, ses
   * segments, sa saison du tour à jouer et son stock à l'ouverture. `null` en
   * mono-produit : l'arène reste alors celle d'un seul produit.
   */
  gamme: {
    code: string;
    name: string;
    /**
     * Le nom à afficher sur écran étroit quand `name` ne tient pas sur un
     * bouton de téléphone. Absent : `name` est affiché partout.
     */
    shortName?: string;
    materialCostPerUnit: number;
    otherVariableCostPerUnit: number;
    hoursPerUnit: number;
    refPrice: number;
    /**
     * Taille du marché de la référence (somme de ses segments). Sert à situer
     * une référence dans la gamme — « fort volume » se déduit, ne s'écrit pas.
     */
    marketSize: number;
    segments: { code: string; name: string }[];
    seasonCoef: number;
    stock: number;
    /**
     * Les fournisseurs auxquels LA référence peut s'adresser (son catalogue
     * propre, sinon celui du scénario), avec le prix d'achat de la référence
     * chez chacun. `null` si le scénario n'en propose pas.
     */
    suppliers: {
      code: string;
      name: string;
      narrative: string;
      costMultiplier: number;
      qualityBonus: number;
      paymentDelayDays: number;
      supplyRiskProbability: number;
      materialCostPerUnit: number;
    }[] | null;
    /**
     * R&D de la référence (scénarios avec levier `rd`) : son niveau technique
     * acquis et, pour une référence à développer, où en est le développement
     * et si elle est vendable au tour à jouer. `null` sans levier R&D.
     */
    rd: {
      techLevel: number;
      development: {
        cost: number;
        availableFromRound: number;
        invested: number;
        available: boolean;
        launchRound: number | null;
      } | null;
    } | null;
  }[] | null;
  /**
   * Le levier R&D du scénario (échelle du budget par tour), `null` sans
   * levier. En mono-produit, c'est lui qui ouvre le champ R&D du formulaire.
   */
  rdOffer: { techScale: number } | null;
  /**
   * Le levier communication du scénario : les axes possibles (code, libellé,
   * ce qu'il fait), l'échelle du budget de marque, la notoriété acquise à
   * l'ouverture du tour et l'axe tenu au tour précédent. `null` sans levier.
   */
  communicationOffer: {
    axes: { code: CommunicationAxis; label: string; hint: string }[];
    brandScale: number;
    brandAwareness: number;
    lastAxis: CommunicationAxis | null;
  } | null;
  /**
   * D'où l'équipe repart pour le tour à jouer : le stock de chaque référence
   * (une seule en mono-produit, sous le code du produit) et les trois postes
   * qui font le budget de trésorerie. Ce sont les chiffres d'ouverture du
   * cockpit de prévision.
   */
  ouverture: {
    stocks: Record<string, number>;
    cash: number;
    receivables: number;
    payables: number;
  };
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
    rse: boolean;
    rd: boolean;
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
  /** Équipements typés : catalogue de machines et parc actuel. */
  equipmentOffer: {
    types: {
      code: string;
      name: string;
      capacityPerUnit: number;
      costPerUnit: number;
      depreciationRounds: number;
      maintenanceMultiplier: number;
      maxPerRound: number;
      resaleRatio: number;
    }[];
    fleet: { typeCode: string; count: number; bookValue: number }[];
    pendingFleet: { typeCode: string; count: number }[];
  } | null;
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
    /** En gamme : la référence sur laquelle porte la commande (null en mono-produit). */
    productCode: string | null;
    productName: string | null;
  } | null;
  /** Coûts unitaires du scénario (après surcharges éco) — analyse des coûts. */
  costFacts: { materialCostPerUnit: number; otherVariableCostPerUnit: number };
  /** Enveloppe d'augmentation de capital des associés (null = illimitée). */
  capitalAllowance: { total: number; remaining: number } | null;
  /**
   * Ce que la banque peut encore prêter au tour à jouer : la dette financière
   * ne dépasse pas `maxDebtToEquity` fois les capitaux propres. `null` quand
   * le scénario ne déclare aucun plafond. Une capacité à zéro n'est pas une
   * anomalie : c'est le mur, et c'est ce qui ouvre la subvention.
   */
  loanCapacity: { remaining: number; ratio: number; equity: number; debt: number } | null;
  /**
   * La demande de subvention exceptionnelle déposée par l'équipe pour le tour
   * en cours, s'il y en a une — avec la réponse de l'animateur quand il a
   * tranché. `null` hors crise : on ne dépose pas de dossier quand tout va bien.
   */
  demandeSubvention: DemandeDeSubvention | null;
  /**
   * CE QU'IL FAUT RÉUNIR POUR VALIDER LE TOUR, calculé une seule fois.
   *
   * L'écran grise le bouton avec, l'action serveur refuse la décision avec, et
   * le bandeau de crise dit avec ce qu'il reste à faire. `null` quand aucun
   * financement de sauvetage n'est exigé — hors crise, ou quand l'animateur a
   * réglé l'exigence à zéro.
   */
  exigenceSauvetage: ExigenceSauvetage | null;
  /**
   * L'ÉTAT DE TRÉSORERIE DE L'ÉQUIPE, HORS CLASSEMENT.
   *
   * La cessation de paiements n'était dite qu'à deux endroits : une ligne dans
   * l'onglet Finance d'une carte de tour, et le statut « défaillante » dans le
   * classement — que l'animateur révèle quand il veut. Une équipe gelée
   * pouvait donc ne rien voir du tout, et continuer à remplir un formulaire
   * que le moteur ignorait.
   *
   * Cet état-là ne dépend d'aucun rideau : il est à l'équipe, il la regarde.
   * `null` quand le scénario ne modélise pas la crise (pas de bloc `treasury`)
   * ou quand aucun tour n'est encore clos.
   */
  alerteTresorerie: {
    /** Le dernier tour clos s'est achevé en cessation de paiements. */
    crise: boolean;
    /** L'entreprise est gelée : le nombre de tours de crise a été atteint. */
    defaillante: boolean;
    /** Tours de crise consécutifs à ce jour. */
    toursConsecutifs: number;
    /** Combien il en faut pour que la défaillance soit prononcée. */
    toursAvantDefaillance: number;
    /** Trésorerie nette à la clôture du dernier tour (négative en découvert). */
    tresorerieNette: number;
    /** Le découvert consenti pour le tour à jouer. */
    plafondDecouvert: number;
    /**
     * Ce qui manque pour repasser sous le plafond — le montant qu'il faut
     * trouver. Zéro quand la trésorerie y est déjà.
     */
    manque: number;
    /**
     * Le tour ne peut pas être validé sans réunir `manque` en emprunt et en
     * apport. `false` : l'équipe est avertie et reste libre de couler — c'est
     * le réglage d'une séance courte, où personne ne doit rester bloqué.
     */
    financementObligatoire: boolean;
  } | null;
  /** Catalogue d'études du scénario (prix à l'échelle de la périodicité). */
  studiesOffer: {
    marketCost: number;
    priceCost: number;
    financeCost: number;
    projectCost: number;
  } | null;
  /** Rapports des études achetées au dernier tour résolu (doc 02 §8bis). */
  studyReports: StudyReports | null;
  /**
   * Benchmark concurrentiel : prix, parts de marché et indice de compétitivité
   * de chaque équipe du dernier tour résolu. Gratuit (pas une étude) : on voit
   * ses concurrents sur le marché, on ne leur ouvre pas les livres.
   */
  competitiveBenchmark: {
    competitors: {
      name: string;
      isPlayer: boolean;
      avgPrice: number | null;
      marketShare: number;
      revenue: number;
    }[];
    marketAvgPrice: number;
    competitivenessIndex: number;
  } | null;
  /**
   * Journal et grand livre du tour (Jalon C). Absent en mono-produit pour
   * non-régression. Présent en gamme pour l'atelier comptabilité.
   * Vues synthétiques : filtrage par catégorie et consultation par compte.
   */
  accounting?: {
    journal: AccountingEntry[];
    generalLedger: GeneralLedgerAccount[];
    /** Écritures groupées par catégorie pour filtrage dans les ateliers. */
    byCategory: Record<AccountingCategory, AccountingEntry[]>;
    /** Comptes du grand livre indexés par code, pour recherche rapide. */
    glByAccount: Record<AccountCode, GeneralLedgerAccount>;
  };
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
      breakEvenUnits: number | null;
      safetyMargin: number | null;
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

/**
 * Ligne de résultat persistée : le type de la table fait foi (`$inferSelect`),
 * plutôt qu'une interface miroir recopiée à la main qui divergeait du schéma
 * sans avertissement. Les colonnes JSONB portent désormais leur type (voir
 * `db/schema/results.ts`).
 */
type PersistedResultRow = typeof roundResults.$inferSelect;

/**
 * Reconstitue le résultat complet d'un tour à partir de sa ligne persistée et
 * de sa trace moteur. Un seul endroit pour cette reconstruction : elle sert au
 * dernier tour (affiché en direct) comme à chaque tour passé de l'accordéon.
 */
function reconstructResult(
  row: PersistedResultRow,
  taxRate: number,
): { result: CompanyRoundResult; events: string[] } {
  // `engineTrace` porte désormais le type `EngineTrace` (colonne typée) : plus
  // de cast, plus de liste de champs recopiée en face de celle de l'écriture.
  const trace = row.engineTrace;
  const result: CompanyRoundResult = {
    companyId: row.teamId,
    incomeStatement: row.incomeStatement,
    balanceSheet: row.balanceSheet,
    cashFlow: row.cashFlow,
    functionalBalance: {
      frng: Number(row.frng),
      bfr: Number(row.bfr),
      netTreasury: Number(row.netTreasury),
    },
    ratios: computeRatios(row.incomeStatement, row.balanceSheet, taxRate),
    market: {
      bySegment: row.marketDetail,
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
    rse: trace.rse ?? undefined,
    kpis: {},
    // Gamme : clé émise seulement quand la ligne la porte, pour que le résultat
    // reconstruit d'une partie mono-produit garde exactement sa forme.
    ...(trace.products ? { products: trace.products } : {}),
    // R&D (mono) et communication : mêmes règles, clé émise seulement si portée.
    ...(trace.rd ? { rd: trace.rd } : {}),
    ...(trace.communication ? { communication: trace.communication } : {}),
    ...(trace.subscription ? { subscription: trace.subscription } : {}),
  };
  return { result, events: trace.events ?? [] };
}

/** La prévision d'un tour face au réalisé (identique pour tout tour résolu). */
function buildForecastReview(
  round: number,
  result: CompanyRoundResult,
  forecast: RoundDecisions["forecast"] | null | undefined,
): GameView["forecastReview"] {
  if (!forecast) return null;
  const sold =
    Object.values(result.market.bySegment).reduce((sum, d) => sum + d.sold, 0) +
    (result.extraOrders?.delivered ?? 0) +
    (result.orderOffer?.delivered ?? 0) +
    (result.subscription?.retained ?? 0);
  const lines: NonNullable<GameView["forecastReview"]>["lines"] = [];
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
      relative: Math.abs(expected) > 0.5 ? (actual - expected) / Math.abs(expected) : null,
      format,
    });
  };
  push("Ventes", forecast.expectedUnits, sold, "units");
  push("Trésorerie nette", forecast.expectedCash, result.functionalBalance.netTreasury, "euro");
  return lines.length > 0 ? { round, lines } : null;
}

/** Indicateurs du métier d'un tour (l'attrition se lit sur le tour précédent). */
function buildSectorKpis(
  result: CompanyRoundResult,
  previousSegments: CompanyRoundResult["market"]["bySegment"] | null,
  snapshot: EngineScenarioConfig,
  kpis: Parameters<typeof computeSectorKpis>[0],
): GameView["sectorKpis"] {
  const segmentUnits = Object.values(result.market.bySegment).reduce((sum, s) => sum + s.sold, 0);
  const totalUnits =
    segmentUnits +
    (result.extraOrders?.delivered ?? 0) +
    (result.orderOffer?.delivered ?? 0) +
    (result.subscription?.retained ?? 0);
  return computeSectorKpis(kpis, {
    result,
    previousSegments,
    segmentUnits,
    totalUnits,
    roundDays: snapshot.roundDays,
    scenario: snapshot,
  });
}

/** Benchmark concurrentiel d'un tour (prix moyen, parts, indice de compétitivité). */
function buildBenchmark(
  rows: PersistedResultRow[],
  teamRows: { id: string; name: string }[],
  playerTeamId: string,
): GameView["competitiveBenchmark"] {
  if (rows.length === 0) return null;
  const competitors = rows
    .map((row) => {
      const detail = row.marketDetail as Record<string, { sold?: number }> | null;
      const units = detail
        ? Object.values(detail).reduce((sum, d) => sum + (d.sold ?? 0), 0)
        : 0;
      return {
        name: teamDisplayName(teamRows.find((t) => t.id === row.teamId)?.name ?? "?"),
        isPlayer: row.teamId === playerTeamId,
        avgPrice: units > 1 ? Number(row.revenue) / units : null,
        marketShare: Number(row.marketShare),
        revenue: Number(row.revenue),
      };
    })
    .sort((a, b) => b.marketShare - a.marketShare);
  const withPrice = competitors.filter((c) => c.avgPrice !== null);
  const marketAvgPrice =
    withPrice.length > 0
      ? withPrice.reduce((s, c) => s + c.avgPrice!, 0) / withPrice.length
      : 0;
  const player = competitors.find((c) => c.isPlayer);
  const competitivenessIndex =
    player && marketAvgPrice > 0 && player.avgPrice !== null
      ? marketAvgPrice / player.avgPrice
      : 1;
  return { competitors, marketAvgPrice, competitivenessIndex };
}

export async function getGameView(gameId: string, userId: string): Promise<GameView | null> {
  const game = (await db.select().from(games).where(eq(games.id, gameId)))[0];
  if (!game) return null;
  const { team: playerTeam, allTeams: teamRows } = await findUserTeam(gameId, userId);
  if (!playerTeam) return null;
  const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
  // Le scénario réellement joué : intégré (registre) OU enseignant (base). Le
  // registre synchrone retombe sur NOVA pour un code base — d'où la résolution
  // par la source unique, ici, une fois, réutilisée dans toute la vue.
  const scenarioDef = await resolveScenarioDefinition(snapshot.code);
  const taxRate = snapshot.finance.taxRate;

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
      const rec = reconstructResult(row, taxRate);
      lastResult = rec.result;
      lastEvents = rec.events;
    }
    const decisionRow = playerDecisionRows.find((d) => d.roundId === lastRound.id);
    if (decisionRow) lastDecisions = decisionRow.payload;
  }

  // Tableau de bord complet de CHAQUE tour résolu (accordéon de l'arène) : on
  // reconstitue le résultat, la prévision, les indicateurs métier et le
  // benchmark tour par tour, sans se limiter au dernier.
  const periods: GameView["periods"] = [];
  for (let i = 0; i < resolved.length; i++) {
    const rnd = resolved[i];
    if (!rnd) continue;
    const idx = roundIndexById.get(rnd.id)!;
    const row = gameResults.find((g) => g.roundId === rnd.id && g.teamId === playerTeam.id);
    if (!row) continue;
    const { result, events } = reconstructResult(row, taxRate);
    const dec = playerDecisionRows.find((d) => d.roundId === rnd.id)?.payload ?? null;
    const prevRnd = resolved[i - 1];
    const prevRow = prevRnd
      ? gameResults.find((g) => g.roundId === prevRnd.id && g.teamId === playerTeam.id)
      : undefined;
    const prevSegments = prevRow?.marketDetail ?? null;
    const rowsOfRound = gameResults.filter((g) => g.roundId === rnd.id);
    periods.push({
      round: idx,
      result,
      events,
      decisions: dec,
      forecastReview: buildForecastReview(idx, result, dec?.forecast),
      sectorKpis: buildSectorKpis(result, prevSegments, snapshot, scenarioDef.kpis),
      competitiveBenchmark: buildBenchmark(rowsOfRound, teamRows, playerTeam.id),
      rse: computeRseIndex(result),
      accounting: formatAccountingData(result.accounting),
    });
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
    | {
        loans?: { remaining: number; perRound: number }[];
        bankTrust?: number;
        /** Le bilan d'ouverture du tour à jouer : ce que la banque lit. */
        finance?: { equity: number; financialDebt: number };
      }
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
        defaillant: Boolean((r.detail as { defaillant?: boolean })?.defaillant),
      };
    })
    .sort((a, b) => a.rank - b.rank);
  const playerRankingRow = rankingRows.find((r) => r.teamId === playerTeam.id);

  // ── LE RIDEAU SUR LE CLASSEMENT ─────────────────────────────────────────
  // En classe et en concours, c'est l'animateur qui révèle. Tant qu'il ne l'a
  // pas fait, la vue de l'élève NE CONTIENT PAS le classement : on ne le cache
  // pas à l'affichage, on ne l'envoie pas. Le cockpit Excel et l'assistant IA
  // lisent cette même vue, et sont donc muets eux aussi — sans quoi le rideau
  // se contournerait en exportant un tableur ou en posant la question.
  //
  // En solo, personne n'est là pour ouvrir : le classement face aux bots est la
  // boucle de retour du jeu, il reste immédiat.
  const kindDeLaPartie = (game.difficultyProfile as { kind?: GameKind }).kind ?? "solo";
  // La composition des équipes ne concerne que la classe : en solo, les autres
  // entreprises sont des bots, et il n'y a personne à rejoindre.
  const equipesDeLaClasse =
    kindDeLaPartie === "solo" ? [] : await compositionDesEquipes(gameId);
  const dernierResolu = resolved.slice().sort((a2, b2) => b2.index - a2.index)[0];
  const classementRevele = classementOuvert({
    kind: kindDeLaPartie,
    revelationDuDernierTourClos: dernierResolu?.rankingRevealedAt,
  });
  // L'IPG de l'équipe reste sien, révélé ou non : il mesure sa progression,
  // pas sa place. C'est le RANG qui fait l'événement, donc le rang qu'on garde.
  const playerBpi = playerRankingRow ? Number(playerRankingRow.bpi) : null;
  const playerDimensions =
    ((playerRankingRow?.detail as { dimensions?: Partial<Record<string, number>> })
      ?.dimensions as Partial<Record<string, number>> | undefined) ?? null;

  // Rapports des études achetées au dernier tour résolu (doc 02 §8bis) :
  // construits à la lecture depuis les résultats persistés — la facture est
  // déjà dans les comptes, ici on livre l'information payée.
  const studyReports: StudyReports | null = await (async () => {
    const purchased = lastResult?.studies?.purchased ?? [];
    if (!lastRound || !lastResult || purchased.length === 0) return null;
    const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
    // Coût variable unitaire RÉEL du dernier tour (fournisseur choisi inclus),
    // tel que le moteur l'a employé pour le seuil — et non le coût standard du
    // scénario, qui divergerait dès qu'une équipe change de fournisseur.
    const cvu = lastResult.breakeven.unitVariableCost;
    const lastRows = gameResults.filter((r) => r.roundId === lastRound.id);
    const reports: StudyReports = {
      round: lastRound.index,
      cost: lastResult.studies?.cost ?? 0,
    };

    if (purchased.includes("market")) {
      const own = lastResult.market.bySegment;
      reports.market = {
        segments: toGamme(snapshot).flatMap((p) => p.market.segments).map((seg) => {
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
        segments: toGamme(snapshot).flatMap((p) => p.market.segments).map((seg) => ({
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
      // La marge de l'offre se calcule au coût variable de SA référence.
      const offerGamme = toGamme(snapshot);
      const offerCible = offerGamme[offerProductIndex(offerGamme, offer)]!;
      const offerCvu = offerCible.materialCostPerUnit + offerCible.otherVariableCostPerUnit;
      reports.project = {
        investment,
        currentOffer: offer
          ? {
              title: offer.title,
              units: offer.units,
              price: offer.price,
              margin: offer.units * (offer.price - offerCvu),
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

  const competitiveBenchmark: GameView["competitiveBenchmark"] = (() => {
    if (!lastRound) return null;
    const lastRows = gameResults.filter((r) => r.roundId === lastRound.id);
    if (lastRows.length === 0) return null;
    const competitors = lastRows
      .map((row) => {
        const detail = row.marketDetail as Record<string, { sold?: number }> | null;
        const units = detail
          ? Object.values(detail).reduce((sum, d) => sum + (d.sold ?? 0), 0)
          : 0;
        return {
          name: teamDisplayName(teamRows.find((t) => t.id === row.teamId)?.name ?? "?"),
          isPlayer: row.teamId === playerTeam.id,
          avgPrice: units > 1 ? Number(row.revenue) / units : null,
          marketShare: Number(row.marketShare),
          revenue: Number(row.revenue),
        };
      })
      .sort((a, b) => b.marketShare - a.marketShare);
    const withPrice = competitors.filter((c) => c.avgPrice !== null);
    const marketAvgPrice =
      withPrice.length > 0
        ? withPrice.reduce((s, c) => s + c.avgPrice!, 0) / withPrice.length
        : 0;
    const player = competitors.find((c) => c.isPlayer);
    const competitivenessIndex =
      player && marketAvgPrice > 0 && player.avgPrice !== null
        ? marketAvgPrice / player.avgPrice
        : 1;
    return { competitors, marketAvgPrice, competitivenessIndex };
  })();

  const playWindow = await playWindowFor(
    { opensAt: game.opensAt, closesAt: game.closesAt, competitionStageId: game.competitionStageId },
    currentRoundRow
      ? { opensAt: currentRoundRow.opensAt, deadline: currentRoundRow.deadline }
      : null,
  );
  const playLock = {
    playable: playWindow.playable,
    state: playWindow.state,
    message: playLockMessage(playWindow),
    opensAt: playWindow.opensAt ? playWindow.opensAt.toISOString() : null,
    closesAt: playWindow.closesAt ? playWindow.closesAt.toISOString() : null,
  };

  // LE DOSSIER BANCAIRE, CALCULÉ UNE FOIS. L'alerte de trésorerie a besoin du
  // MÊME plafond de découvert que celui annoncé au formulaire : deux calculs
  // séparés finiraient par diverger, et l'écran dirait à l'élève de repasser
  // sous un seuil qui n'est pas celui que la banque applique.
  const bankFileView = (() => {
    const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
    const bank = snapshot.finance.bank;
    if (!bank) return null;
    const trust = confianceServie((currentState ?? {}) as CompanyState, snapshot);
    const conditions = conditionsBancaires(
      trust,
      {
        overdraftLimit: snapshot.finance.overdraftLimit,
        overdraftAnnualRate: snapshot.finance.overdraftAnnualRate,
      },
      bank,
    );
    return {
      trust,
      overdraftLimit: conditions.overdraftLimit,
      fullOverdraftLimit: snapshot.finance.overdraftLimit,
      overdraftAnnualRate: conditions.overdraftAnnualRate,
      lastReliability: lastResult?.bank?.reliability ?? null,
    };
  })();

  const alerteView = (() => {
    const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
    // Pas de bloc `treasury` : le scénario ne modélise aucune cessation de
    // paiements dure, il n'y a rien à alerter.
    if (!snapshot.treasury || !lastResult) return null;
    const streak = (currentState as { crisisStreak?: number } | undefined)?.crisisStreak ?? 0;
    const defaillante =
      (currentState as { status?: string } | undefined)?.status === "defaillant";
    const crise = Boolean(lastResult.treasury?.crisis);
    if (!crise && !defaillante) return null;
    // Le plafond du tour À JOUER : c'est celui sous lequel il faut repasser.
    const plafond = bankFileView?.overdraftLimit ?? snapshot.finance.overdraftLimit;
    const tresorerie = lastResult.functionalBalance.netTreasury;
    return {
      crise,
      defaillante,
      toursConsecutifs: streak,
      toursAvantDefaillance: snapshot.finance.crisisRoundsBeforeFailure ?? 2,
      tresorerieNette: tresorerie,
      plafondDecouvert: plafond,
      manque: Math.max(0, -tresorerie - plafond),
      financementObligatoire: snapshot.finance.rescueFinancingRequired ?? true,
    };
  })();

  const loanCapacityView = (() => {
    const ratio = (game.scenarioSnapshot as EngineScenarioConfig).finance.maxDebtToEquity;
    if (ratio === undefined) return null;
    // Les capitaux propres et la dette d'OUVERTURE du tour à jouer : ce sont
    // ceux que la banque lit quand elle instruit la demande.
    const finance = currentState?.finance;
    const equity = finance?.equity ?? 0;
    const debt = finance?.financialDebt ?? 0;
    return { remaining: Math.max(0, ratio * equity - debt), ratio, equity, debt };
  })();

  const capitalAllowanceView = (() => {
    const cap = (game.scenarioSnapshot as EngineScenarioConfig).finance.maxCapitalIncreaseTotal;
    if (cap === undefined) return null;
    const raised = (currentState as { capitalRaised?: number } | undefined)?.capitalRaised ?? 0;
    return { total: cap, remaining: Math.max(0, cap - raised) };
  })();

  // LA DEMANDE DE SUBVENTION DU TOUR EN COURS, et l'exigence de sauvetage
  // calculée UNE FOIS pour tout le monde.
  //
  // L'écran grise le bouton avec, l'action serveur refuse la décision avec, et
  // le bandeau de crise dit avec ce qu'il reste à faire. Les recalculer chacun
  // de son côté, à partir de trois champs épars, c'est se donner rendez-vous
  // pour diverger : l'élève lirait un seuil et le serveur en appliquerait un
  // autre.
  const demandeSubvention = alerteView?.crise
    ? await demandeDuTour(playerTeam.id, game.currentRound)
    : null;
  const exigenceSauvetage =
    alerteView?.crise && alerteView.financementObligatoire
      ? {
          manque: alerteView.manque,
          capaciteEmprunt: loanCapacityView?.remaining ?? null,
          enveloppeApport: capitalAllowanceView?.remaining ?? null,
          subventionAccordee:
            demandeSubvention?.statut === "granted"
              ? (demandeSubvention.montantAccorde ?? 0)
              : 0,
          demandeDeposee: demandeSubvention !== null,
          // En solo, personne n'instruira quoi que ce soit : le verrou se lève
          // de lui-même plutôt que d'ouvrir un formulaire sans destinataire.
          avecAnimateur: kindDeLaPartie !== "solo",
        }
      : null;

  return {
    gameId,
    kind: kindDeLaPartie,
    status: game.status,
    currentRound: game.currentRound,
    playLock,
    roundsCount: (game.scenarioSnapshot as { roundsCount: number }).roundsCount,
    roundDays: (game.scenarioSnapshot as { roundDays: number }).roundDays,
    playerTeamId: playerTeam.id,
    playerTeamName: teamDisplayName(playerTeam.name),
    // L'équipe se nomme, et se RENOMME, tant que le premier tour n'est pas
    // clos. Le panneau ne disparaissait auparavant qu'au premier nom adopté :
    // une coquille tapée à la hâte — « Les Enteprises du Nrd » — restait au
    // classement et sur le relevé de notes pendant six trimestres, sans que
    // personne, élève ou enseignant, puisse la corriger. Le service, lui,
    // autorisait déjà le changement : c'était l'écran qui se fermait trop tôt.
    //
    // Jamais en solo. Le joueur seul reprend une entreprise qui existe, porte
    // un nom, une histoire et un secteur — NOVA, L'ESCALE, MAILLE & CO —, et
    // ce nom est la moitié de la mise en situation. Lui proposer de le changer
    // ouvrirait un écran de plus avant la première décision, pour renommer ce
    // que le scénario vient de planter.
    peutSeNommer: kindDeLaPartie !== "solo" && game.currentRound === 1,
    equipesDeLaClasse,
    peutChoisirSonEquipe: kindDeLaPartie !== "solo" && peutChoisirSonEquipe(game),
    pendingDecisions,
    courriersAnnonces: readPendingEvents(game.difficultyProfile).map((card) => {
      const target = card.teamId ? teamRows.find((t) => t.id === card.teamId) : undefined;
      return {
        code: card.code,
        teamId: card.teamId,
        teamName: target?.name ?? null,
        isMyTeam: card.teamId === playerTeam.id,
      };
    }),
    courriersEnCours: (() => {
      const actifs = (game.difficultyProfile as { activeEvents?: EventInstance[] }).activeEvents;
      return (Array.isArray(actifs) ? actifs : [])
        .filter((e) => e.roundsLeft > 0)
        .map((e) => {
          const teamId = e.scope === "company" ? (e.companyId ?? null) : null;
          return {
            code: e.code,
            teamId,
            teamName: teamId ? (teamRows.find((t) => t.id === teamId)?.name ?? null) : null,
            isMyTeam: teamId === playerTeam.id,
            roundsLeft: e.roundsLeft,
          };
        });
    })(),
    upcomingDraw: await (async () => {
      if (game.status === "finished") return [];
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      // Les entreprises telles que la clôture les passera au moteur : les
      // états du tour précédent, triés par identifiant (round-resolution).
      const etats = await db
        .select({ teamId: companyStates.teamId })
        .from(companyStates)
        .where(
          and(
            eq(companyStates.roundIndex, game.currentRound - 1),
            inArray(companyStates.teamId, teamRows.map((t) => t.id)),
          ),
        );
      const companies = etats.map((r) => ({ id: r.teamId })).sort((a, b) => a.id.localeCompare(b.id));
      if (companies.length !== teamRows.length) return [];
      const actifs = activeEventsOf(game.difficultyProfile);
      const tirees = peekEventDraw({
        scenario: snapshot,
        roundIndex: game.currentRound,
        companies,
        activeEvents: [...actifs, ...injectedEvents(snapshot, readPendingEvents(game.difficultyProfile), actifs)],
        seed: game.seed,
      });
      return tirees
        .filter((e) => e.scope === "market" || e.companyId === playerTeam.id)
        .map((e) => ({
          code: e.code,
          teamId: e.scope === "company" ? (e.companyId ?? null) : null,
          isMyTeam: e.scope === "company" && e.companyId === playerTeam.id,
        }));
    })(),
    lastResult,
    periods,
    // Rapport extra-financier (Lot 3) : synthèse indicative dérivée de tous les
    // tours résolus. Lecture seule, comme l'indice RSE.
    rseReport: computeRseReport(
      periods.map((p) => ({ round: p.round, result: p.result, events: p.events, rse: p.rse })),
      RSE_CARD_CODES,
    ),
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
        (lastResult.orderOffer?.delivered ?? 0) +
        (lastResult.subscription?.retained ?? 0);
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
      // En gamme, l'historique couvre les clientèles de toutes les références.
      const segments = toGamme(snapshot).flatMap((p) => p.market.segments);
      const codes = segments.map((seg) => seg.code);
      return {
        segments: segments.map((seg) => seg.name),
        commissions: segments
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
      const definition = scenarioDef;
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
    ranking: classementRevele ? ranking : [],
    classement: { revele: classementRevele, parLAnimateur: kindDeLaPartie !== "solo" },
    playerBpi,
    playerDimensions,
    lastDecisions,
    // Le point de départ et les valeurs proposées viennent du même calcul que
    // celui du serveur (decision-baseline) : ce que le formulaire propose est
    // exactement ce à quoi la validation sera comparée.
    startingDecisions: startingDecisionsFor(
      game.scenarioSnapshot as EngineScenarioConfig,
      stateRow?.state as CompanyState | undefined,
      game.currentRound,
    ),
    proposedDecisions: (() => {
      return proposedDecisionsFor({
        snapshot: game.scenarioSnapshot as EngineScenarioConfig,
        state: stateRow?.state as CompanyState | undefined,
        roundIndex: game.currentRound,
        previousPayload: lastDecisions,
      });
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
      // L'objet du courrier en français, et non la clé technique : c'est
      // le seul endroit de l'écran de décision où l'élève lisait « natural
      // disaster, cold wave ». Les mêmes événements lui seront montrés sous
      // leur nom de carte quand ils tomberont.
      const eventLabels = (codes: string[]) =>
        codes.map((c) => courrierParCode.get(c)?.objet ?? c.replace(/_/g, " "));
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
    vocabulary: scenarioDef.vocabulary,
    scenarioCode: snapshot.code,
    sector: scenarioDef.sector,
    scenarioIcon: scenarioDef.icon,
    // Tous les segments que le moteur simule : en gamme, ceux de chaque
    // produit (le marché du scénario n'en est que le premier).
    segmentNames: Object.fromEntries(
      toGamme(game.scenarioSnapshot as EngineScenarioConfig).flatMap((p) =>
        p.market.segments.map((s) => [s.code, s.name] as const),
      ),
    ),
    ouverture: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const state = stateRow?.state as CompanyState | undefined;
      const stocks: Record<string, number> = {};
      for (const p of toGamme(snapshot)) {
        stocks[p.code] = Math.round(
          isMultiProduct(snapshot)
            ? (state?.finishedGoodsByProduct?.[p.code]?.quantity ?? 0)
            : (state?.finishedGoods.quantity ?? 0),
        );
      }
      return {
        stocks,
        cash: Math.round(state?.finance.cash ?? 0),
        receivables: Math.round(state?.finance.receivables ?? 0),
        payables: Math.round(state?.finance.payables ?? 0),
      };
    })(),
    gamme: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (!isMultiProduct(snapshot)) return null;
      const state = stateRow?.state as CompanyState | undefined;
      const idx = game.currentRound - 1;
      return toGamme(snapshot).map((p) => {
        const main = [...p.market.segments].sort((a, b) => b.size - a.size)[0];
        return {
          code: p.code,
          name: p.name,
          ...(p.shortName ? { shortName: p.shortName } : {}),
          materialCostPerUnit: p.materialCostPerUnit,
          otherVariableCostPerUnit: p.otherVariableCostPerUnit,
          hoursPerUnit: p.hoursPerUnit,
          refPrice: main?.refPrice ?? 0,
          marketSize: p.market.segments.reduce((t, s) => t + s.size, 0),
          segments: p.market.segments.map((s) => ({ code: s.code, name: s.name })),
          seasonCoef: p.market.seasonality[idx] ?? 1,
          stock: Math.round(state?.finishedGoodsByProduct?.[p.code]?.quantity ?? 0),
          suppliers:
            suppliersOf(p, snapshot)?.map((s) => ({
              code: s.code,
              name: s.name,
              narrative: s.narrative,
              costMultiplier: s.costMultiplier,
              qualityBonus: s.qualityBonus,
              paymentDelayDays: s.paymentDelayDays,
              supplyRiskProbability: s.supplyRiskProbability,
              materialCostPerUnit: Math.round(p.materialCostPerUnit * s.costMultiplier * 100) / 100,
            })) ?? null,
          rd: (() => {
            const rd = rdOpeningOf(snapshot, state ?? {}, p.code);
            if (!rd) return null;
            return {
              techLevel: rd.techLevel,
              development: p.development
                ? {
                    cost: p.development.cost,
                    availableFromRound: p.development.availableFromRound ?? 1,
                    invested: rd.invested,
                    available: isProductAvailable(p, rd, game.currentRound),
                    launchRound: rd.launchRound ?? null,
                  }
                : null,
            };
          })(),
        };
      });
    })(),
    rdOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      return snapshot.rd ? { techScale: snapshot.rd.techScale } : null;
    })(),
    communicationOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (!snapshot.communication) return null;
      const state = stateRow?.state as CompanyState | undefined;
      return {
        // Pas tous les axes : celui de l'innovation n'est proposé que là où le
        // secteur a de quoi le tenir (un levier R&D). Ailleurs il ne pourrait
        // que desservir, et un choix qui ne peut que coûter n'est pas un choix.
        axes: axesProposables(snapshot).map((code) => ({
          code,
          ...COMMUNICATION_AXIS_LABELS[code],
        })),
        brandScale: snapshot.communication.brandScale,
        brandAwareness: state?.brandAwareness ?? 0,
        lastAxis: state?.lastCommunicationAxis ?? null,
      };
    })(),
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
        (lastResult.orderOffer?.delivered ?? 0) +
        (lastResult.subscription?.retained ?? 0);
      // Segments du tour précédent : seule donnée nécessaire à l'attrition.
      const previousRound = resolved.at(-2);
      const previousRow = previousRound
        ? gameResults.find(
            (r) => r.roundId === previousRound.id && r.teamId === playerTeam.id,
          )
        : undefined;
      return computeSectorKpis(scenarioDef.kpis, {
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
      const definition = scenarioDef;
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
        segments: toGamme(snapshot)
          .flatMap((p) => p.market.segments)
          .map((seg) => ({
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
      let mc: number;
      if (snapshot.equipment) {
        const types = new Map(snapshot.equipment.types.map((t) => [t.code, t]));
        const all = [...(state.fleet ?? []), ...(state.pendingFleet ?? [])];
        mc = all.reduce((sum, item) => {
          const typ = types.get(item.typeCode);
          return sum + (typ ? item.count * typ.capacityPerUnit : 0);
        }, 0);
      } else {
        mc = state.machineCapacity + (state.pendingCapacity ?? 0);
      }
      const lc = (state.headcount * state.hoursPerEmployee * state.productivity) /
        snapshot.product.hoursPerUnit;
      const bottleneck: "machine" | "labor" | "balanced" =
        mc < lc * 0.95 ? "machine" : lc < mc * 0.95 ? "labor" : "balanced";
      const sub = snapshot.subscription;
      return {
        machineCapacity: Math.round(mc),
        laborCapacity: Math.round(lc),
        bottleneck,
        headcount: state.headcount,
        hoursPerEmployee: state.hoursPerEmployee,
        productivity: state.productivity,
        hoursPerUnit: snapshot.product.hoursPerUnit,
        ...(sub
          ? {
              subscription: {
                members: Math.round(state.members ?? 0),
                expectedRetained: Math.round((state.members ?? 0) * (1 - sub.baseChurnRate)),
                baseChurnRate: sub.baseChurnRate,
                refPrice: sub.refPrice,
              },
            }
          : {}),
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
    equipmentOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      if (!snapshot.equipment) return null;
      const state = stateRow?.state as CompanyState | undefined;
      const activeFleet = (state?.fleet ?? []) as { typeCode: string; count: number; bookValue: number }[];
      const pending = (state?.pendingFleet ?? []) as { typeCode: string; count: number }[];
      const fleetByType = new Map<string, { count: number; bookValue: number }>();
      for (const item of activeFleet) {
        const existing = fleetByType.get(item.typeCode);
        if (existing) {
          existing.count += item.count;
          existing.bookValue += item.bookValue;
        } else {
          fleetByType.set(item.typeCode, { count: item.count, bookValue: item.bookValue });
        }
      }
      const pendingByType = new Map<string, number>();
      for (const item of pending) {
        pendingByType.set(item.typeCode, (pendingByType.get(item.typeCode) ?? 0) + item.count);
      }
      return {
        types: snapshot.equipment.types.map((t) => ({
          code: t.code,
          name: t.name,
          capacityPerUnit: t.capacityPerUnit,
          costPerUnit: t.costPerUnit,
          depreciationRounds: t.depreciationRounds,
          maintenanceMultiplier: t.maintenanceMultiplier,
          maxPerRound: t.maxPerRound,
          resaleRatio: t.resaleRatio ?? 0.3,
        })),
        fleet: snapshot.equipment.types.map((t) => ({
          typeCode: t.code,
          count: fleetByType.get(t.code)?.count ?? 0,
          bookValue: fleetByType.get(t.code)?.bookValue ?? 0,
        })),
        pendingFleet: snapshot.equipment.types.map((t) => ({
          typeCode: t.code,
          count: pendingByType.get(t.code) ?? 0,
        })),
      };
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
    bankFile: bankFileView,
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
                confianceServie((currentState ?? {}) as CompanyState, snapshot),
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
    alerteTresorerie: alerteView,
    loanCapacity: loanCapacityView,
    capitalAllowance: capitalAllowanceView,
    demandeSubvention,
    exigenceSauvetage,
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
    competitiveBenchmark,
    orderOffer: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const offer = orderOfferForRound(snapshot, game.currentRound, game.seed);
      if (!offer) return null;
      // La commande porte sur une référence : son coût variable et son prix
      // usuel sont ceux de CETTE référence (mono : le produit du scénario).
      const gamme = toGamme(snapshot);
      const cible = gamme[offerProductIndex(gamme, offer)]!;
      return {
        code: offer.code,
        title: offer.title,
        narrative: offer.narrative,
        units: offer.units,
        price: offer.price,
        paymentDelayDays: offer.paymentDelayDays,
        unitVariableCost: cible.materialCostPerUnit + cible.otherVariableCostPerUnit,
        refPrice: cible.market.segments[0]?.refPrice ?? offer.price,
        productCode: isMultiProduct(snapshot) ? cible.code : null,
        productName: isMultiProduct(snapshot) ? cible.name : null,
      };
    })(),
    seasonNotes: (() => {
      const snapshot = game.scenarioSnapshot as EngineScenarioConfig;
      const idx = game.currentRound - 1;
      const notes: { name: string; coef: number }[] = [];
      if (isMultiProduct(snapshot)) {
        // Chaque référence a sa saison : c'est elle que l'équipe doit lire.
        for (const p of toGamme(snapshot)) {
          const coef = p.market.seasonality[idx];
          if (coef !== undefined && Math.abs(coef - 1) > 0.01)
            notes.push({ name: p.name, coef });
          for (const seg of p.market.segments) {
            const c = seg.seasonality?.[idx];
            if (c !== undefined && Math.abs(c - 1) > 0.01) notes.push({ name: seg.name, coef: c });
          }
        }
        return notes;
      }
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
    accounting: formatAccountingData(lastResult?.accounting),
  };
}
