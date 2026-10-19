import { z } from "zod";
import type { EngineScenarioConfig } from "@/engine/types";
import { mapGammeSegments } from "@/engine/gamme";
import { DEFAULT_RSE_CONFIG } from "@/engine/rse";

/**
 * Niveaux de difficulté (doc 08 §2, §20) : la difficulté n'est PAS un entier
 * codé en dur — c'est un profil paramétrique dont les six niveaux nommés sont
 * des PRÉRÉGLAGES (données ci-dessous, modifiables sans toucher au moteur).
 *
 * Le moteur économique ignore la difficulté : elle agit uniquement via des
 * paramètres effectifs (probabilités d'événements du snapshot), le plafond
 * d'indices (couche pédagogie) et les décisions exposées (couche présentation).
 */

export interface DifficultyPreset {
  /**
   * 1 à 6 : le parcours. Le 7 existe encore dans ce type, et seulement pour
   * cela : les parties créées au niveau 7 « Groupe » avant son retrait du
   * produit relisent leur profil (`NIVEAU_7_RETIRE`, plus bas). Aucun écran ne
   * le propose, aucune création ne l'accepte.
   */
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  code: string;
  name: string;
  tagline: string;
  /** Plafond d'indices débloquables (0 = aucun indice). */
  hintMaxLevel: 0 | 1 | 2 | 3 | 4 | 5;
  /**
   * Décisions exposées au joueur (prix, production, marketing : toujours actives).
   *
   * LA PROGRESSION (décision du propriétaire, octobre 2026) : l'opérationnel
   * d'abord, puis l'investissement et le financement, puis la stratégie.
   *
   *   1 Découverte   prix, production, marketing
   *   2 Gestion      + qualité, maintenance
   *   3 Pilotage     + ressources humaines, créances clients
   *   4 Arbitrage    + investissement, financement, assurance
   *   5 Stratégie    + R&D, RSE, placement
   *   6 Executive    + dividende
   *
   * La répartition d'avant (l'emprunt et l'investissement dès le niveau 1, les
   * RH au niveau 4) reste lisible pour les parties créées avant elle : voir
   * `REPARTITION_AVANT_2026_10_11` et `presetFromProfile`.
   */
  decisions: {
    quality: boolean;
    maintenance: boolean;
    /**
     * Financer : emprunter, rembourser, augmenter le capital. Ouvert avec
     * l'investissement, au niveau 4 : on ne décide pas d'acheter une machine
     * sans savoir d'où vient l'argent. Fermé, la banque ne laisse pas l'équipe
     * sans réponse : le découvert, à son taux, couvre le manque, et au-delà de
     * son plafond elle cède les créances (affacturage forcé). Aucun verrou de
     * validation ne réclame un emprunt que l'écran ne propose pas.
     */
    finance: boolean;
    /**
     * Mobiliser le poste clients (escompte, affacturage). Un outil de
     * trésorerie à part : il suppose de savoir lire un délai de paiement. Il
     * s'ouvre au niveau 3, avec les ressources humaines : c'est le niveau où
     * l'on pilote le besoin en fonds de roulement avant d'emprunter.
     */
    creances: boolean;
    insurance: boolean;
    /** RH (embauches, formation, salaires) : dès Pilotage, avant d'investir. */
    hr: boolean;
    /**
     * Investissement capacitaire : acheter de la capacité, ou des machines.
     * Ouvert au niveau 4 avec le financement, qui lui donne un sens, et après
     * les ressources humaines : une machine ne produit que si une équipe la
     * fait tourner (voir `engine/investment/plafond`, qui borne l'achat là où
     * l'investissement serait ouvert sans les embauches).
     */
    investment: boolean;
    /**
     * Engagement RSE (Lot 2) — le levier « payer maintenant, gagner plus tard ».
     * Ouvert au niveau Stratégie : c'est un arbitrage inter-temporel qui suppose
     * déjà de savoir lire une marge et une trésorerie, et il ne prend son sens
     * que sur un horizon assez long (≥ 5-6 tours).
     */
    rse: boolean;
    /**
     * Placement du surplus de trésorerie. Réservé aux niveaux hauts : c'est
     * l'arbitrage inverse du découvert, et il ne se pose qu'à quelqu'un qui
     * sait déjà lire une trésorerie. Placer trop, c'est payer un découvert à
     * 9 % en détenant un placement à 2 %.
     */
    placement: boolean;
    /**
     * Affectation du résultat : distribuer aux associés ou garder pour
     * investir. Réservée au niveau 6, dont c'est la décision propre : les cinq
     * premiers ouvrent chacun un cran, le sixième se contentait de retirer les
     * indices, ce qui n'est pas ouvrir un cran.
     */
    dividend: boolean;
    /**
     * Recherche et développement : lancer une référence à développer, élever
     * le niveau technique. Un investissement immatériel qui coûte maintenant
     * et rapporte plus tard : ouvert au niveau Stratégie, avec la RSE. Fermé,
     * les références à développer sont livrées prêtes.
     */
    rd: boolean;
    /**
     * Croissance externe : racheter un concurrent simulé, en numéraire ou en
     * actions. ABSENTE des six niveaux du parcours (et de leurs profils figés,
     * qui restent ceux d'avant). Seules les parties créées au niveau 7
     * « Groupe », avant son retrait du produit, la portent encore — figée dans
     * leur profil. Le moteur qui la joue est gardé (`engine/groupe`).
     */
    croissanceExterne?: boolean;
    /**
     * Externaliser ou internaliser : faire fabriquer des produits finis par un
     * sous-traitant, au barème, sans coût fixe. Absente des six niveaux du
     * parcours, comme la croissance externe, et pour la même raison.
     */
    externalisation?: boolean;
  };
  /** Multiplicateur des probabilités d'événements aléatoires (les 0 restent 0). */
  eventProbabilityMultiplier: number;
}

export type LeviersDuNiveau = DifficultyPreset["decisions"];

/** Tous les leviers fermés : le point de départ d'une répartition. */
const FERME: LeviersDuNiveau = {
  quality: false,
  maintenance: false,
  finance: false,
  creances: false,
  insurance: false,
  hr: false,
  investment: false,
  rse: false,
  placement: false,
  dividend: false,
  rd: false,
};

/**
 * Les leviers que seul le niveau 7 « Groupe » ouvrait. Le niveau est retiré du
 * produit ; cette liste reste parce qu'un profil FIGÉ les porte encore, et
 * qu'un levier qu'on ne sait plus lire serait un levier perdu au milieu d'une
 * partie. Lus dans un profil figé quand ils y sont, jamais ajoutés ailleurs.
 */
const LEVIERS_DU_NIVEAU_7_RETIRE = ["croissanceExterne", "externalisation"] as const;

export const DIFFICULTY_PRESETS: readonly DifficultyPreset[] = [
  {
    level: 1,
    code: "decouverte",
    name: "Découverte",
    tagline: "Prix, production, marketing : l'essentiel du métier, avec tous les indices.",
    hintMaxLevel: 5,
    decisions: { ...FERME },
    eventProbabilityMultiplier: 0.5,
  },
  {
    level: 2,
    code: "gestion",
    name: "Gestion",
    tagline: "Qualité et maintenance entrent en jeu : ce que vous produisez, et l'outil qui le produit.",
    hintMaxLevel: 5,
    decisions: { ...FERME, quality: true, maintenance: true },
    eventProbabilityMultiplier: 0.75,
  },
  {
    level: 3,
    code: "pilotage",
    name: "Pilotage",
    tagline: "Votre équipe et vos créances clients : effectif, salaires et trésorerie se pilotent. Indices limités.",
    hintMaxLevel: 3,
    decisions: { ...FERME, quality: true, maintenance: true, hr: true, creances: true },
    eventProbabilityMultiplier: 1,
  },
  {
    level: 4,
    code: "arbitrage",
    name: "Arbitrage",
    tagline: "Emprunter, investir, s'assurer : les grands arbitrages, sous des aléas plus fréquents.",
    hintMaxLevel: 3,
    decisions: {
      ...FERME,
      quality: true,
      maintenance: true,
      hr: true,
      creances: true,
      investment: true,
      finance: true,
      insurance: true,
    },
    eventProbabilityMultiplier: 1.25,
  },
  {
    level: 5,
    code: "strategie",
    name: "Stratégie",
    tagline: "R&D, RSE et placements : payer maintenant pour gagner plus tard. Deux indices, un marché nerveux.",
    hintMaxLevel: 2,
    decisions: {
      ...FERME,
      quality: true,
      maintenance: true,
      hr: true,
      creances: true,
      investment: true,
      finance: true,
      insurance: true,
      rd: true,
      rse: true,
      placement: true,
    },
    eventProbabilityMultiplier: 1.5,
  },
  {
    level: 6,
    code: "executive",
    name: "Executive",
    tagline:
      "Affectation du résultat, aucun indice, événements doublés : vous répondez aussi aux associés.",
    hintMaxLevel: 0,
    decisions: {
      quality: true,
      maintenance: true,
      finance: true,
      creances: true,
      insurance: true,
      hr: true,
      investment: true,
      rse: true,
      placement: true,
      dividend: true,
      rd: true,
    },
    eventProbabilityMultiplier: 2,
  },
];

/**
 * LE NIVEAU 7 « GROUPE », RETIRÉ DU PRODUIT — ET CE QUI EN RESTE ICI.
 *
 * Décision du propriétaire (octobre 2026) : le niveau est retiré. Il n'était
 * qu'un septième palier mal posé — jouable sur NOVA en gamme seulement, en solo
 * seulement, et obligeant à une note de bas de page partout : une constante à
 * côté de `NIVEAU_MAX`, une phrase à part sur /tarifs, un commentaire ici pour
 * expliquer que les ateliers, le manuel et l'examen restaient à six. Aucun
 * écran ne le propose plus, aucune création ne l'accepte plus (le niveau envoyé
 * est borné à six dès les actions, `app/actions.ts` et `app/teacher/actions.ts`).
 *
 * CE PRÉRÉGLAGE N'EST PLUS UN NIVEAU DU PRODUIT : c'est le GEL des parties qui
 * le portent. Une partie créée au niveau 7 avant le retrait continue de se
 * jouer et de se rejouer, et pour cela deux choses doivent rester lisibles :
 *   · SON MONDE — aucun indice, aléas doublés : sans ce préréglage,
 *     `presetFromProfile` ne retrouverait plus le niveau 7 et retomberait sur
 *     `LEGACY_PRESET` (niveau 3, tous les indices, aléas simples), c'est-à-dire
 *     une autre partie que celle qui a été commencée ;
 *   · SES LEVIERS — la liste figée dans son `difficultyProfile`, croissance
 *     externe et externalisation comprises (`REPARTITION_AVANT_2026_10_11`,
 *     clé 7, et `LEVIERS_DU_NIVEAU_7_RETIRE`).
 *
 * Il n'est donc PAS exporté comme un niveau à proposer, et rien ne doit le
 * remettre dans `DIFFICULTY_PRESETS` : les six niveaux du parcours restent six,
 * et les ateliers, le manuel, les lettres de mission, l'énumération des niveaux
 * dans les offres et les bornes d'un sujet d'examen restent ceux des SIX
 * (`NIVEAU_MAX`, config/vitrine-solo).
 *
 * LE MOTEUR, LUI, EST GARDÉ (`engine/groupe`, `config/groupe`) : consolidation,
 * écart d'acquisition, valeur pour l'actionnaire, externalisation sont des
 * notions à redistribuer sur les niveaux existants. Les parties figées le
 * tirent encore, et les tests du moteur l'exercent par ce préréglage.
 *
 * Garde : tests/unit/partie-de-niveau-7-d-avant.test.ts (une partie de niveau 7
 * d'avant le retrait rejouée au centime).
 */
export const NIVEAU_7_RETIRE: DifficultyPreset = {
  level: 7,
  code: "groupe",
  name: "Groupe",
  tagline: "Racheter, faire fabriquer, lancer une nouveauté, financer : vous êtes jugés sur la valeur créée pour l'actionnaire.",
  hintMaxLevel: 0,
  decisions: {
    quality: true,
    maintenance: true,
    finance: true,
    creances: true,
    insurance: true,
    hr: true,
    investment: true,
    rse: true,
    placement: true,
    dividend: true,
    rd: true,
    croissanceExterne: true,
    externalisation: true,
  },
  eventProbabilityMultiplier: 2,
};

/**
 * Les préréglages lus PAR NUMÉRO : les six du parcours, et le 7 gelé des
 * parties qui le portent (voir `NIVEAU_7_RETIRE`). Ce que cette table contient
 * n'est donc pas ce qui se propose : les écrans énumèrent `DIFFICULTY_PRESETS`.
 */
export const presetByLevel = new Map(
  [...DIFFICULTY_PRESETS, NIVEAU_7_RETIRE].map((p) => [p.level, p]),
);

/**
 * LA RÉPARTITION D'AVANT LE 11 OCTOBRE 2026, pour les parties créées avant
 * elle. Un niveau ne figeait alors que son numéro dans le profil de la partie,
 * et relisait les préréglages du moment : changer la répartition aurait fermé
 * l'emprunt au milieu d'une partie de niveau 2, ou ouvert les embauches d'une
 * partie de niveau 3. Une partie créée depuis fige sa liste de leviers
 * (`difficultyProfile.difficulty.decisions`) ; celles d'avant relisent cette
 * table, telle qu'elle était.
 */
export const REPARTITION_AVANT_2026_10_11: Readonly<Record<DifficultyPreset["level"], LeviersDuNiveau>> = {
  1: { ...FERME, finance: true, investment: true },
  2: { ...FERME, quality: true, maintenance: true, finance: true, investment: true },
  3: {
    ...FERME,
    quality: true,
    maintenance: true,
    finance: true,
    creances: true,
    insurance: true,
    investment: true,
  },
  4: {
    ...FERME,
    quality: true,
    maintenance: true,
    finance: true,
    creances: true,
    insurance: true,
    hr: true,
    investment: true,
    rse: true,
    rd: true,
  },
  5: {
    ...FERME,
    quality: true,
    maintenance: true,
    finance: true,
    creances: true,
    insurance: true,
    hr: true,
    investment: true,
    rse: true,
    rd: true,
    placement: true,
  },
  6: {
    quality: true,
    maintenance: true,
    finance: true,
    creances: true,
    insurance: true,
    hr: true,
    investment: true,
    rse: true,
    placement: true,
    dividend: true,
    rd: true,
  },
  // Le niveau 7 n'existait pas, et il est depuis retiré du produit : une partie
  // qui le porte fige toujours ses leviers, et c'est par eux qu'elle se rejoue.
  // Cette ligne est le dernier recours, pour un profil de niveau 7 écrit sans
  // sa liste de leviers : elle rend ceux du niveau, jamais ceux d'un autre.
  7: { ...NIVEAU_7_RETIRE.decisions },
};

/**
 * Le premier niveau qui ouvre un levier (« les embauches s'ouvrent au niveau
 * 3 ») : lu dans les préréglages, jamais écrit dans une phrase. `apres` : le
 * premier au-delà de ce niveau (une partie d'avant la répartition actuelle, au
 * niveau 3, apprend que les embauches viennent au 4, pas « au 3 »). `null` si
 * aucun niveau ne l'ouvre.
 */
export function premierNiveauQuiOuvre(
  levier: keyof DifficultyPreset["decisions"],
  presets: readonly DifficultyPreset[] = DIFFICULTY_PRESETS,
  apres = 0,
): number | null {
  return presets.find((p) => p.level > apres && p.decisions[levier])?.level ?? null;
}

/** Comportement des parties créées AVANT le sélecteur (rétro-compatibilité). */
export const LEGACY_PRESET: DifficultyPreset = {
  level: 3,
  code: "legacy",
  name: "Pilotage",
  tagline: "",
  hintMaxLevel: 5,
  decisions: { quality: true, maintenance: true, finance: true, creances: true, insurance: true, hr: false, investment: false, rse: false, placement: false, dividend: false, rd: false },
  eventProbabilityMultiplier: 1,
};

/** Une liste de leviers figée dans un profil : chaque drapeau booléen lu, les absents fermés. */
function leviersFiges(brut: unknown): LeviersDuNiveau | null {
  if (!brut || typeof brut !== "object") return null;
  const lus = Object.entries(brut as Record<string, unknown>).filter(
    ([cle, v]) =>
      (cle in FERME || (LEVIERS_DU_NIVEAU_7_RETIRE as readonly string[]).includes(cle)) && typeof v === "boolean",
  );
  if (lus.length === 0) return null;
  return { ...FERME, ...Object.fromEntries(lus) };
}

/**
 * Le difficultyProfile d'une partie, à sa création : le niveau, son nom, et SA
 * LISTE DE LEVIERS, figée. La répartition peut changer ensuite sans toucher aux
 * parties en cours.
 */
export function profilDuNiveau(preset: DifficultyPreset): {
  level: DifficultyPreset["level"];
  name: string;
  decisions: LeviersDuNiveau;
} {
  return { level: preset.level, name: preset.name, decisions: { ...preset.decisions } };
}

/**
 * Les leviers FIGÉS d'une partie, s'il y en a (une partie créée depuis la
 * répartition d'octobre 2026). `null` pour les parties d'avant : leurs
 * concurrents pilotés continuent de jouer comme ils ont toujours joué.
 */
export function leviersFigesDuProfil(profile: unknown): LeviersDuNiveau | null {
  return leviersFiges((profile as { difficulty?: { decisions?: unknown } } | null)?.difficulty?.decisions);
}

/**
 * Lit le préréglage d'un difficultyProfile de partie (null → LEGACY_PRESET).
 * Les leviers sont ceux FIGÉS à la création ; une partie d'avant qui n'en a
 * pas relit la répartition de son époque (`REPARTITION_AVANT_2026_10_11`).
 */
export function presetFromProfile(profile: unknown): DifficultyPreset {
  const d = (profile as { difficulty?: { level?: number; decisions?: unknown } })?.difficulty;
  const base = d?.level ? presetByLevel.get(d.level as DifficultyPreset["level"]) : undefined;
  if (!base) return LEGACY_PRESET;
  return {
    ...base,
    decisions: leviersFiges(d?.decisions) ?? { ...REPARTITION_AVANT_2026_10_11[base.level] },
  };
}

/**
 * Questions posées dans les situations. Le réglage distingue deux choses que
 * le QCM confondait :
 *
 * - les questions de CONNAISSANCES (définitions, formules) redemandent ce que
 *   le diagnostic teste déjà, mais hors contexte ;
 * - la question du MODÈLE d'analyse est la compétence propre de la
 *   plateforme, la seule qui mesure le choix de l'outil de raisonnement.
 *
 * D'où trois positions, et non un interrupteur : « model » est le défaut, il
 * garde l'essentiel sans l'habillage scolaire.
 */
export type QuizMode = "full" | "model" | "off";

export const DEFAULT_QUIZ_MODE: QuizMode = "model";

export const QUIZ_MODES: readonly { code: QuizMode; name: string; help: string }[] = [
  {
    code: "full",
    name: "Connaissances et modèle",
    help: "Deux questions de connaissances par situation, plus la question du modèle d'analyse. Le score se partage moitié diagnostic, moitié QCM.",
  },
  {
    code: "model",
    name: "Modèle d'analyse seul",
    help: "Une seule question : quel modèle mobiliser ici. C'est la compétence que la plateforme mesure, sans interroger les définitions.",
  },
  {
    code: "off",
    name: "Aucune question",
    help: "Le diagnostic fait toute la note. Le débriefing continue d'indiquer le modèle attendu et son explication, en lecture seule.",
  },
];

/**
 * LE FORMAT DES RÉPONSES : QCM, OU QUESTIONS OUVERTES.
 *
 * Le diagnostic et le modèle d'analyse se répondent d'ordinaire en cochant : des cases
 * pour le diagnostic, un choix pour le modèle. Un enseignant peut vouloir une partie sans
 * QCM, où l'élève écrit avec ses mots. Le texte est alors ramené aux options de la
 * situation par les mots qu'il emploie (voir `pedagogy/reponse-ouverte`), de sorte que
 * le score, le débriefing et la maîtrise suivent le chemin d'avant. Cette correction est
 * approximative : l'enseignant relit les textes, conservés tels quels.
 *
 * Le réglage est indépendant du mode des questions (`QuizMode`) : il dit COMMENT on
 * répond à ce qui est posé, pas CE QUI est posé.
 */
export type AnswerFormat = "qcm" | "open";

export const DEFAULT_ANSWER_FORMAT: AnswerFormat = "qcm";

export const ANSWER_FORMATS: readonly { code: AnswerFormat; name: string; help: string }[] = [
  {
    code: "qcm",
    name: "QCM",
    help: "Cases à cocher pour le diagnostic, un choix parmi des propositions pour le modèle d'analyse.",
  },
  {
    code: "open",
    name: "Questions ouvertes",
    help: "L'élève écrit son diagnostic et le modèle qu'il mobilise, avec ses mots. Corrigé automatiquement par mots-clés, donc de façon approximative.",
  },
];

/** Réglage d'une partie ; absent (parties d'avant ce réglage) = QCM, comme à l'époque. */
export function answerFormatFromProfile(profile: unknown): AnswerFormat {
  const p = profile as { answerFormat?: unknown } | null;
  return p?.answerFormat === "open" ? "open" : "qcm";
}

/**
 * Réglage d'une partie. Deux replis, dans cet ordre :
 * `quizMode` explicite, puis l'ancien drapeau booléen des parties créées avant
 * ce réglage (absent = tout servi, comme à l'époque).
 */
export function quizModeFromProfile(profile: unknown): QuizMode {
  const p = profile as { quizMode?: unknown; quizEnabled?: boolean } | null;
  if (p?.quizMode === "full" || p?.quizMode === "model" || p?.quizMode === "off") {
    return p.quizMode;
  }
  return p?.quizEnabled === false ? "off" : "full";
}

// ---------------------------------------------------------------------------
// Paramètres économiques modulables à la création (jamais codés en dur) :
// chaque champ absent conserve la valeur du scénario. Bornes = garde-fous.
// Les montants s'entendent en BASE TRIMESTRIELLE (redimensionnés ensuite
// par la périodicité) ; les taux sont des fractions (0,2 = 20 %).
// ---------------------------------------------------------------------------

export const economicOverridesSchema = z.object({
  /** Taux d'IS (impôt sur les bénéfices). */
  taxRate: z.number().min(0).max(0.6).optional(),
  /** Taux de TVA (0 = désactivée). */
  vatRate: z.number().min(0).max(0.3).optional(),
  /** Taux d'emprunt annuel. */
  loanAnnualRate: z.number().min(0).max(0.25).optional(),
  /** Taux de découvert annuel. */
  overdraftAnnualRate: z.number().min(0).max(0.4).optional(),
  /** Délai de paiement fournisseurs (jours). */
  supplierPaymentDelayDays: z.number().int().min(0).max(120).optional(),
  /**
   * Délai de règlement des clients À CRÉDIT (jours). Voir
   * `applyEconomicOverrides` : les segments payés comptant le restent.
   */
  customerPaymentDelayDays: z.number().int().min(0).max(180).optional(),
  /** Plafond de découvert autorisé (€). Au-delà, l'affacturage forcé s'enclenche. */
  overdraftLimit: z.number().min(0).max(5_000_000).optional(),
  /** Durée d'amortissement d'un nouvel emprunt, en tours. */
  loanDurationRounds: z.number().int().min(1).max(60).optional(),
  /**
   * Capacité d'endettement : la banque ne prête pas au-delà de ce multiple
   * des capitaux propres. Bas, elle coupe le crédit tôt et la crise arrive
   * vite ; haut, l'équipe peut s'enfoncer longtemps avant de trouver le mur.
   */
  maxDebtToEquity: z.number().min(0).max(20).optional(),
  /**
   * Tours de cessation de paiements CONSÉCUTIFS avant la défaillance. 1 : la
   * sanction tombe au premier tour dans le rouge, pour une séance courte.
   * 4 : le temps de redresser, pour un atelier qui court sur plusieurs
   * séances.
   */
  crisisRoundsBeforeFailure: z.number().int().min(1).max(10).optional(),
  /**
   * Le financement de sauvetage est-il un verrou ou un avertissement ? Saisi
   * comme 1 (obligatoire) ou 0 (simple alerte) : le panneau ne pose que des
   * champs numériques, et une case à cocher y serait le seul cas particulier.
   */
  rescueFinancingRequired: z.number().min(0).max(1).optional(),
  /** Dotations aux amortissements par trimestre (€). */
  depreciationPerRound: z.number().min(0).max(500_000).optional(),
  /** Part maximale du poste clients mobilisable à l'escompte (0-1). */
  discountMaxShare: z.number().min(0).max(1).optional(),
  /** Commission d'affacturage (part du montant cédé, 0-0,2). */
  factoringFeeRate: z.number().min(0).max(0.2).optional(),
  /** Charges de structure par trimestre (salaires, loyers, charges sociales…). */
  fixedCostsPerRound: z.number().min(0).max(5_000_000).optional(),
  /** Coût matières par unité produite. */
  materialCostPerUnit: z.number().min(0).max(500).optional(),
  /** Autres coûts variables unitaires (main-d'œuvre chargée, énergie…). */
  otherVariableCostPerUnit: z.number().min(0).max(500).optional(),
  /** Taux de rebuts de base (active les coûts de la non-qualité, 0-15 %). */
  baseDefectRate: z.number().min(0).max(0.15).optional(),
  /**
   * RSE (Lot 2) — force de l'effet image → demande. Facteur d'attractivité au
   * point d'équilibre ≈ 1 + valeur × ln(1 + budget/échelle marketing). 0 = la
   * RSE ne fait plus rien sur la demande (l'indice reste mesuré).
   */
  rseImageDemandSensitivity: z.number().min(0).max(2).optional(),
  /** RSE (Lot 2) — réduction maximale du taux de rebuts par le « process propre » (0-90 %). */
  rseCleanDefectReductionMax: z.number().min(0).max(0.9).optional(),
});

export type EconomicOverrides = z.infer<typeof economicOverridesSchema>;

/**
 * Validation champ par champ : une valeur hors bornes est simplement ignorée
 * (retour à la valeur du scénario) au lieu de faire échouer la création.
 */
export function sanitizeEconomicOverrides(raw: EconomicOverrides | undefined): EconomicOverrides {
  if (!raw) return {};
  const out: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(economicOverridesSchema.shape)) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const parsed = (fieldSchema as z.ZodType).safeParse(value);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as EconomicOverrides;
}

/**
 * Applique les paramètres économiques au scénario de BASE (avant périodicité).
 *
 * Deux choses que ce réglage ne touche VOLONTAIREMENT pas :
 * - les délais des OFFRES de commande exceptionnelle, dont l'alternance
 *   crédit / comptant est le cœur de l'exercice ;
 * - les délais propres à chaque FOURNISSEUR, qui opposent justement un
 *   déstockeur payé comptant à un grossiste à 45 jours.
 * Les uniformiser reviendrait à supprimer l'arbitrage qu'ils enseignent.
 */
export function applyEconomicOverrides(
  scenario: EngineScenarioConfig,
  overrides: EconomicOverrides | undefined,
): EngineScenarioConfig {
  if (!overrides || Object.values(overrides).every((v) => v === undefined)) return scenario;
  const treasury = scenario.treasury;
  // Délai client : appliqué aux seuls segments qui font DÉJÀ crédit. Un
  // particulier qui paie en caisse continue de payer en caisse — sans quoi
  // le réglage effacerait la distinction que le scénario met en scène. En
  // gamme, la règle vaut pour le marché de chaque produit.
  const delai = overrides.customerPaymentDelayDays;
  const avecDelais =
    delai === undefined
      ? scenario
      : mapGammeSegments(scenario, (s) =>
          s.paymentDelayDays > 0 ? { ...s, paymentDelayDays: delai } : s,
        );
  return {
    ...avecDelais,
    product: {
      ...scenario.product,
      materialCostPerUnit: overrides.materialCostPerUnit ?? scenario.product.materialCostPerUnit,
      otherVariableCostPerUnit:
        overrides.otherVariableCostPerUnit ?? scenario.product.otherVariableCostPerUnit,
    },
    // Gamme : la surcharge des coûts s'applique à CHAQUE produit. Clé émise
    // seulement si le scénario en porte une (mono-produit inchangé).
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => ({
            ...p,
            materialCostPerUnit: overrides.materialCostPerUnit ?? p.materialCostPerUnit,
            otherVariableCostPerUnit:
              overrides.otherVariableCostPerUnit ?? p.otherVariableCostPerUnit,
          })),
        }
      : {}),
    finance: {
      ...scenario.finance,
      taxRate: overrides.taxRate ?? scenario.finance.taxRate,
      vatRate: overrides.vatRate ?? scenario.finance.vatRate,
      loanAnnualRate: overrides.loanAnnualRate ?? scenario.finance.loanAnnualRate,
      overdraftAnnualRate: overrides.overdraftAnnualRate ?? scenario.finance.overdraftAnnualRate,
      overdraftLimit: overrides.overdraftLimit ?? scenario.finance.overdraftLimit,
      supplierPaymentDelayDays:
        overrides.supplierPaymentDelayDays ?? scenario.finance.supplierPaymentDelayDays,
      loanDurationRounds: overrides.loanDurationRounds ?? scenario.finance.loanDurationRounds,
      maxDebtToEquity: overrides.maxDebtToEquity ?? scenario.finance.maxDebtToEquity,
      crisisRoundsBeforeFailure:
        overrides.crisisRoundsBeforeFailure ?? scenario.finance.crisisRoundsBeforeFailure,
      rescueFinancingRequired:
        overrides.rescueFinancingRequired === undefined
          ? scenario.finance.rescueFinancingRequired
          : overrides.rescueFinancingRequired === 1,
      depreciationPerRound:
        overrides.depreciationPerRound ?? scenario.finance.depreciationPerRound,
    },
    // Mobilisation du poste clients : réglable seulement là où le scénario
    // l'ouvre déjà. La créer de toutes pièces ajouterait des décisions que
    // l'énoncé du scénario ne présente pas.
    ...(treasury
      ? {
          treasury: {
            ...treasury,
            discountMaxShare: overrides.discountMaxShare ?? treasury.discountMaxShare,
            factoringFeeRate: overrides.factoringFeeRate ?? treasury.factoringFeeRate,
          },
        }
      : {}),
    fixedCostsPerRound: overrides.fixedCostsPerRound ?? scenario.fixedCostsPerRound,
    // RSE (Lot 2) : les réglages écrasent le bloc `rse` du scénario (créé à
    // partir des défauts s'il est absent). Les grandeurs non fournies gardent
    // leur valeur ; on ne touche qu'aux deux exposées à l'enseignant.
    ...(overrides.rseImageDemandSensitivity !== undefined ||
    overrides.rseCleanDefectReductionMax !== undefined
      ? {
          rse: {
            ...(scenario.rse ?? DEFAULT_RSE_CONFIG),
            imageDemandSensitivity:
              overrides.rseImageDemandSensitivity ??
              (scenario.rse ?? DEFAULT_RSE_CONFIG).imageDemandSensitivity,
            cleanDefectReductionMax:
              overrides.rseCleanDefectReductionMax ??
              (scenario.rse ?? DEFAULT_RSE_CONFIG).cleanDefectReductionMax,
          },
        }
      : {}),
    // Non-qualité : l'activer à la création crée le bloc qualityCosts
    // (sensibilité aux retours externes : donnée ci-dessous, pas du dur).
    ...(overrides.baseDefectRate !== undefined && overrides.baseDefectRate > 0
      ? {
          qualityCosts: {
            baseDefectRate: overrides.baseDefectRate,
            externalReturnSensitivity: 0.5,
          },
        }
      : {}),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * PONDÉRATIONS DU IPG, PARAMÉTRABLES PAR L'ENSEIGNANT (V2 couche 2, chantier #3).
 *
 * Hors moteur : le module de scoring (src/scoring/bpi.ts) reste pur et ignore
 * ces réglages ; on ne fait que réécrire `scenario.scoring.weights` AVANT de
 * figer le snapshot, exactement comme les paramètres économiques. Tout le
 * scoring aval (tour et classement) lit alors les poids surchargés sans le
 * savoir.
 *
 * L'enseignant pondère les SIX dimensions affichées de l'IPG v2. En interne, le
 * scénario porte sept poids : « pilotage » y est la SOMME de `strategy` +
 * `operational`, et le scoring v2 ne lit jamais que cette somme. On répartit
 * donc « pilotage » entre les deux en conservant le ratio d'origine — neutre
 * pour le calcul, et le schéma (somme = 1) reste satisfait.
 * ──────────────────────────────────────────────────────────────────────────── */
export const scoringWeightOverridesSchema = z.object({
  economic: z.number().min(0).max(1).optional(),
  financial: z.number().min(0).max(1).optional(),
  commercial: z.number().min(0).max(1).optional(),
  profitability: z.number().min(0).max(1).optional(),
  pilotage: z.number().min(0).max(1).optional(),
  decisionMastery: z.number().min(0).max(1).optional(),
});

export type ScoringWeightOverrides = z.infer<typeof scoringWeightOverridesSchema>;

/** Les six dimensions pondérables de l'IPG v2, dans l'ordre d'affichage. */
export const SCORING_WEIGHT_DIMENSIONS = [
  "economic",
  "financial",
  "commercial",
  "profitability",
  "pilotage",
  "decisionMastery",
] as const;

/** Validation champ par champ : une valeur hors bornes est ignorée. */
export function sanitizeScoringWeightOverrides(
  raw: ScoringWeightOverrides | undefined,
): ScoringWeightOverrides {
  if (!raw) return {};
  const out: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(scoringWeightOverridesSchema.shape)) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const parsed = (fieldSchema as z.ZodType).safeParse(value);
    if (parsed.success && parsed.data !== undefined) out[key] = parsed.data;
  }
  return out as ScoringWeightOverrides;
}

/**
 * Réécrit les pondérations de l'IPG depuis les réglages de l'enseignant. Les
 * dimensions non fournies gardent la valeur du scénario. Le résultat est
 * TOUJOURS renormalisé (somme = 1, exigée par le schéma de scoring) : les
 * réglages expriment un poids RELATIF, jamais une valeur absolue. Une somme
 * nulle (tout à zéro) est ignorée — retour au scénario.
 */
export function applyScoringWeightOverrides(
  scenario: EngineScenarioConfig,
  overrides: ScoringWeightOverrides | undefined,
): EngineScenarioConfig {
  if (!overrides || Object.values(overrides).every((v) => v === undefined)) return scenario;
  const base = scenario.scoring.weights;
  const basePilotage = base.strategy + base.operational;
  const six = {
    economic: overrides.economic ?? base.economic,
    financial: overrides.financial ?? base.financial,
    commercial: overrides.commercial ?? base.commercial,
    profitability: overrides.profitability ?? base.profitability,
    pilotage: overrides.pilotage ?? basePilotage,
    decisionMastery: overrides.decisionMastery ?? base.decisionMastery,
  };
  const sum =
    six.economic +
    six.financial +
    six.commercial +
    six.profitability +
    six.pilotage +
    six.decisionMastery;
  if (sum <= 0) return scenario;
  const k = 1 / sum;
  // Répartition stratégie / opérationnel : conserve le ratio d'origine (le
  // scoring v2 n'en lit que la somme, via « pilotage »).
  const stratShare = basePilotage > 0 ? base.strategy / basePilotage : 0.5;
  const pilotageW = six.pilotage * k;
  return {
    ...scenario,
    scoring: {
      ...scenario.scoring,
      weights: {
        economic: six.economic * k,
        financial: six.financial * k,
        commercial: six.commercial * k,
        profitability: six.profitability * k,
        strategy: pilotageW * stratShare,
        operational: pilotageW * (1 - stratShare),
        decisionMastery: six.decisionMastery * k,
      },
    },
  };
}

/** Applique l'intensité d'événements du niveau (les probabilités 0 restent 0). */
export function applyEventIntensity(
  scenario: EngineScenarioConfig,
  multiplier: number,
): EngineScenarioConfig {
  if (multiplier === 1) return scenario;
  return {
    ...scenario,
    events: scenario.events.map((e) => ({
      ...e,
      probability: Math.min(0.9, e.probability * multiplier),
    })),
  };
}
