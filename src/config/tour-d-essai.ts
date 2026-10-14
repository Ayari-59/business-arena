import type { EngineScenarioConfig } from "@/engine/types";

/**
 * LE TOUR D'ESSAI : UN OU DEUX TOURS POUR DE FAUX AVANT LA VRAIE PARTIE.
 *
 * Capsim fait jouer un « rehearsal » avant la compétition. Chez nous, une partie de
 * classe commençait directement au tour 1, et une équipe pouvait perdre la partie sur
 * une erreur de prise en main : un volume tapé avec un zéro de trop, un emprunt oublié.
 *
 * L'essai se joue DANS la partie, avec ses équipes, ses élèves et ses codes : mêmes
 * écrans, mêmes aides du niveau. Seuls changent la graine (le marché de l'essai ne
 * dévoile pas celui de la vraie partie) et les événements scriptés, retirés (aucun
 * courrier écrit pour un tour réel n'est rejoué à l'identique). À la bascule, tout ce
 * que l'essai a joué part dans une partie d'ARCHIVE, que seul l'animateur relit, et la
 * partie repart de l'état initial du scénario (services/tour-d-essai.service.ts).
 *
 * Ce module est pur : ce qui se décide sans base, et ce qui se lit à l'écran.
 */

/** Les longueurs d'essai proposées à la création. Aucun essai reste le défaut. */
export const TOURS_D_ESSAI = [1, 2] as const;
export type NombreDeToursDEssai = (typeof TOURS_D_ESSAI)[number];

/**
 * Comment la vraie partie commence : quand l'animateur la lance (« manuel »), ou dès
 * la clôture du dernier tour d'essai (« auto »), si l'animateur l'a choisi.
 */
export type EnchainementDeLEssai = "manuel" | "auto";

/**
 * Où en est l'essai :
 *  · `en_cours` : les tours d'essai se jouent ;
 *  · `termine` : le dernier tour d'essai est clos, la classe lit ses résultats ;
 *  · `bascule` : la vraie partie se met en place (quelques instants, et une reprise
 *    possible si la bascule a été interrompue) ;
 *  · `fini` : la vraie partie a commencé.
 */
export type PhaseDeLEssai = "en_cours" | "termine" | "bascule" | "fini";

/** Ce que `games.essai` porte (migration 0045). */
export interface TourDEssai {
  tours: NombreDeToursDEssai;
  enchainement: EnchainementDeLEssai;
  phase: PhaseDeLEssai;
  /** La graine de la VRAIE partie : la colonne `seed` porte celle de l'essai tant qu'il dure. */
  graine: number;
  /** Le scénario joué de la vraie partie, tant que l'essai dure ; retiré à la bascule. */
  scenario?: EngineScenarioConfig;
  /** Le déplacement de l'essai vers l'archive est fait (reprise d'une bascule interrompue). */
  deplace?: boolean;
  /** L'archive : la partie qui garde l'essai joué, pour le débrief. */
  archive?: string;
  /** Quand la vraie partie a commencé (ISO). */
  basculeLe?: string;
}

/** L'explication d'une ligne, sous l'option du formulaire de création. */
export const EXPLICATION_DU_TOUR_D_ESSAI =
  "Les équipes s'entraînent ; rien ne compte ; la partie repart ensuite de zéro.";

/** Le refus de la bascule pendant le calcul d'un tour d'essai. */
export const BASCULE_PENDANT_UN_CALCUL =
  "Un tour d'essai est en cours de calcul. Attendez la fin du calcul pour commencer la vraie partie.";

const PHASES: readonly PhaseDeLEssai[] = ["en_cours", "termine", "bascule", "fini"];

/** Lit `games.essai` ; null pour une partie sans essai, ou une valeur qu'on ne reconnaît pas. */
export function lireLEssai(brut: unknown): TourDEssai | null {
  if (typeof brut !== "object" || brut === null) return null;
  const e = brut as Partial<TourDEssai>;
  if (!TOURS_D_ESSAI.includes(e.tours as NombreDeToursDEssai)) return null;
  if (!PHASES.includes(e.phase as PhaseDeLEssai)) return null;
  if (typeof e.graine !== "number") return null;
  return {
    ...(e as TourDEssai),
    enchainement: e.enchainement === "auto" ? "auto" : "manuel",
  };
}

/**
 * La partie joue-t-elle encore l'essai ? Vrai de la création jusqu'à la fin de la
 * bascule : pendant ce temps, rien de ce qui s'y passe ne doit compter (profil de
 * l'élève, relevé de notes).
 */
export function enEssai(game: { essai?: unknown } | null | undefined): boolean {
  const e = lireLEssai(game?.essai);
  return e !== null && e.phase !== "fini";
}

const BORNE_DES_GRAINES = 2 ** 31 - 1;

/**
 * LA GRAINE DE L'ESSAI, TIRÉE DE CELLE DE LA PARTIE, ET JAMAIS ÉGALE.
 *
 * Déterministe : un monde de démonstration à graine imposée garde un essai
 * reproductible. Différente : l'essai ne doit rien dévoiler du marché réel (monde
 * variable, tirages d'événements, commandes exceptionnelles, caractère des bots).
 */
export function graineDEssai(graine: number): number {
  const brassee = Math.imul((graine ^ 0x5bd1e995) >>> 0, 0x27d4eb2d) >>> 0;
  const candidate = (brassee % BORNE_DES_GRAINES) + 1;
  return candidate === graine ? (candidate % BORNE_DES_GRAINES) + 1 : candidate;
}

/**
 * LE SCÉNARIO DE L'ESSAI : celui de la partie, joué sur les seuls tours d'essai, et
 * SANS événement scripté. Un courrier écrit pour le tour réel (la flambée d'une
 * matière, une histoire d'investissement) n'est pas rejoué à blanc : la classe le
 * découvrirait deux fois, et la seconde ne surprendrait plus personne.
 */
export function scenarioDEssai(
  scenario: EngineScenarioConfig,
  tours: NombreDeToursDEssai,
): EngineScenarioConfig {
  return {
    ...scenario,
    roundsCount: Math.max(1, Math.min(tours, scenario.roundsCount)),
    scriptedEvents: [],
  };
}

/**
 * Les clés du profil de partie qui sont de l'ÉTAT DE JEU, et non des réglages : les
 * événements en cours, les courriers distribués, la Gazette parue et les consignes de
 * l'enseignant sur ses articles. Elles partent avec l'essai ; les réglages (niveau,
 * questions, format des réponses, politique des situations manquées) restent.
 */
export const CLES_DE_JEU_DU_PROFIL = [
  "activeEvents",
  "pendingEvents",
  "pendingEventCodes",
  "gazette",
] as const;

/** Le profil de la partie tel qu'il était avant tout tour joué : les réglages seuls. */
export function profilDeDepart(profil: unknown): Record<string, unknown> {
  const copie = { ...((profil as Record<string, unknown> | null) ?? {}) };
  for (const cle of CLES_DE_JEU_DU_PROFIL) delete copie[cle];
  return copie;
}

/**
 * LA NUMÉROTATION AFFICHÉE. Pendant l'essai : « Tour d'essai 1/2 ». Ensuite, et pour
 * toute partie sans essai : « Tour 1/12 », la vraie partie recommençant à 1.
 */
export function tourAffiche(args: {
  essai: TourDEssai | null;
  tour: number;
  tours: number;
}): string {
  if (args.essai && args.essai.phase !== "fini") {
    return `Tour d'essai ${Math.min(args.tour, args.essai.tours)}/${args.essai.tours}`;
  }
  return `Tour ${args.tour}/${args.tours}`;
}

/** Le bandeau que les équipes lisent en tête de l'arène ; null quand il n'y a rien à dire. */
export function bandeauDeLEssai(args: {
  essai: TourDEssai | null;
  tour: number;
  /** Au moins un tour de la vraie partie est clos : l'annonce de départ s'efface. */
  vraiTourJoue: boolean;
}): { titre: string; texte: string; ton: "essai" | "depart" } | null {
  const e = args.essai;
  if (!e) return null;
  if (e.phase === "en_cours") {
    return {
      ton: "essai",
      titre: `Tour d'essai ${Math.min(args.tour, e.tours)}/${e.tours} · ne compte pas`,
      texte:
        "Jouez comme pour de vrai : les résultats s'affichent pour apprendre, puis la partie repart de zéro.",
    };
  }
  if (e.phase === "termine" || e.phase === "bascule") {
    return {
      ton: "essai",
      titre: "Tour d'essai terminé · ne compte pas",
      texte:
        e.enchainement === "auto"
          ? "La vraie partie commence dans un instant. Vos entreprises repartent de zéro."
          : "Lisez vos résultats : la vraie partie commence quand votre animateur la lance, et vos entreprises repartent de zéro.",
    };
  }
  if (args.tour === 1 && !args.vraiTourJoue) {
    return {
      ton: "depart",
      titre: "La vraie partie commence",
      texte: "Vos entreprises repartent de zéro. À partir de maintenant, chaque tour compte.",
    };
  }
  return null;
}

/**
 * Le choix du formulaire de création : « aucun » (le défaut, et toute valeur
 * inconnue), 1 ou 2 tours ; l'enchaînement automatique si la case est cochée.
 */
export function lireLeChoixDEssai(
  tours: unknown,
  enchainement: unknown,
): { tours: NombreDeToursDEssai; enchainement: EnchainementDeLEssai } | undefined {
  const n = Number(tours);
  if (!TOURS_D_ESSAI.includes(n as NombreDeToursDEssai)) return undefined;
  return { tours: n as NombreDeToursDEssai, enchainement: enchainement === "on" ? "auto" : "manuel" };
}

/** La confirmation du geste « Commencer la vraie partie », et son attente. */
export const CONFIRMATION_DE_LA_BASCULE = {
  titre: "Commencer la vraie partie ?",
  detail:
    "Toutes les entreprises repartent de l'état initial du scénario. Les équipes, leurs élèves et les codes restent. L'essai reste à revoir pour le débrief.",
  irreversible: "Ce geste ne se défait pas : l'essai ne reprend plus.",
  confirmer: "Commencer la vraie partie",
  annuler: "Pas encore",
  attente: "La vraie partie se met en place",
} as const;
