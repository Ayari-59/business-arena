/**
 * COMBIEN DE TEMPS PREND UN TOUR.
 *
 * L'enseignant planifie sa séance avant de la faire : il pose une fenêtre de
 * jeu, il annonce « vous avez vingt minutes », il décide s'il fait un tour ou
 * deux dans l'heure. L'application ne lui donnait aucun élément pour trancher,
 * alors qu'elle connaît exactement ce qu'elle demande à l'élève : le volume de
 * texte qu'il doit lire, le nombre de champs qu'il doit remplir, et s'il y a
 * une situation à analyser.
 *
 * CE MODULE EST UN MODÈLE, PAS UNE MESURE, et le dire est la moitié de son
 * utilité. Ses trois constantes sont des ordres de grandeur assumés, écrites
 * ici pour être discutées et corrigées par ce qu'on observera en classe — pas
 * des valeurs relevées sur des élèves réels. Dès qu'une partie a joué un tour,
 * la médiane mesurée (services/observation) dit mieux, et c'est elle qui
 * s'affiche : l'estimation ne sert qu'avant la première séance.
 */

/**
 * Vitesse de lecture retenue : 900 signes par minute, soit environ 150 mots
 * par minute pour des mots français d'une demi-douzaine de signes.
 *
 * C'est délibérément lent pour de la lecture silencieuse ordinaire (on cite
 * plutôt 200 à 250 mots/min). Ce qui est lu ici n'est pas un roman : c'est un
 * énoncé dont il faut tirer une décision, relu, discuté à trois autour d'un
 * écran, et souvent lu par un élève qui découvre le vocabulaire du secteur.
 *
 * Le volume compté est celui des TEXTES DE SCÉNARIO : cadrage et situation.
 * Les aides du formulaire, le mandat de l'équipe et le courrier du tour n'y
 * sont pas — ils vivent dans des composants, pas dans la configuration, et
 * rien ne les mesure. Le poste « lecture » est donc un plancher.
 */
export const SIGNES_PAR_MINUTE = 900;

/**
 * Trente secondes par champ de décision ouvert.
 *
 * Tous les champs arrivent avec une valeur proposée : beaucoup sont confirmés
 * d'un regard, quelques-uns coûtent une vraie délibération. Trente secondes
 * est la moyenne assumée entre les deux — un prix qui se discute et un budget
 * d'entretien qu'on laisse tel quel.
 */
export const SECONDES_PAR_CHAMP = 30;

/**
 * La prise en main, au premier tour seulement : entrer le code, donner son
 * prénom, lire qui est l'entreprise et quel est son mandat, nommer l'équipe,
 * découvrir un assistant en six étapes. Elle ne se paie qu'une fois.
 */
export const MINUTES_PRISE_EN_MAIN = 8;

/**
 * L'analyse d'une situation, une fois son texte lu : cocher un diagnostic
 * parmi cinq, choisir un modèle, répondre aux questions. Le temps de LECTURE
 * de la situation est compté à part, avec le reste du texte.
 */
export const MINUTES_ANALYSE_SITUATION = 4;

/**
 * Les champs qu'un élève remplit quoi qu'il arrive : le prix, le volume, le
 * budget de communication, et la note qui justifie les choix.
 */
export const CHAMPS_DE_BASE = 4;

/**
 * Ce que chaque levier ouvre comme champs supplémentaires. Relevé sur
 * `components/decision-form.tsx`, levier par levier ; la somme au niveau 6
 * correspond aux champs que le formulaire porte réellement.
 *
 * `communication` n'est pas un levier de NIVEAU : c'est le scénario qui le
 * porte. Un appelant qui ne connaît que le niveau ne le passera donc jamais,
 * et l'estimation sera courte de deux champs sur les scénarios concernés.
 * C'est assumé : mieux vaut annoncer un peu moins que de compter des champs
 * qui n'existent pas dans la moitié des parties.
 */
export const CHAMPS_PAR_LEVIER: Record<string, number> = {
  quality: 1, // budget qualité
  maintenance: 1, // budget d'entretien
  rd: 1, // budget de recherche
  communication: 2, // budget de marque, axe tenu
  hr: 4, // embauches, départs, formation, salaires
  rse: 2, // budget RSE, investissement RSE
  finance: 3, // emprunt, remboursement, augmentation de capital
  investment: 2, // capacité machine, parc (achats et cessions)
  insurance: 1, // formule d'assurance
  placement: 3, // escompte, affacturage, placement
  dividend: 1, // dividende
};

/** Combien de champs le niveau de la partie ouvre à l'élève. */
export function champsOuverts(leviers: Record<string, boolean | undefined>): number {
  let total = CHAMPS_DE_BASE;
  for (const [levier, champs] of Object.entries(CHAMPS_PAR_LEVIER)) {
    if (leviers[levier]) total += champs;
  }
  return total;
}

/** Longueur utile d'un texte, en signes. */
const signes = (v: unknown): number => {
  if (typeof v === "string") return v.trim().length;
  if (Array.isArray(v)) return v.reduce((t: number, x) => t + signes(x), 0);
  if (v && typeof v === "object") return Object.values(v).reduce((t: number, x) => t + signes(x), 0);
  return 0;
};

/**
 * Le cadrage du scénario : le briefing, le contexte, le dilemme. Lu en entier
 * au premier tour, reconsulté ensuite.
 */
export function signesDeCadrage(scenario: {
  briefing?: unknown;
  context?: unknown;
  dilemma?: unknown;
}): number {
  return signes(scenario.briefing) + signes(scenario.context) + signes(scenario.dilemma);
}

/**
 * La situation qui s'ouvre à ce tour : son récit, sa question, ses options de
 * diagnostic. Zéro quand aucune ne se déclenche au tour dit — les situations
 * de détection, elles, dépendent des résultats et ne se prévoient pas.
 */
export function signesDeSituation(
  situations: {
    narrative?: string;
    problem?: string;
    diagnosticOptions?: { label?: string }[];
    trigger?: { round?: number } | { detect?: string };
  }[],
  round: number,
): number {
  return situations
    .filter((s) => (s.trigger as { round?: number } | undefined)?.round === round)
    .reduce(
      (total, s) =>
        total + signes(s.narrative) + signes(s.problem) + signes(s.diagnosticOptions),
      0,
    );
}

export interface FaitsDuTour {
  /** Le cadrage du scénario, en signes. Compté au premier tour seulement. */
  signesDeCadrage: number;
  /** La situation de ce tour, en signes. Zéro s'il n'y en a pas. */
  signesDeSituation: number;
  /** Champs de décision ouverts par le niveau. */
  champs: number;
  premierTour: boolean;
  /** Les questions de connaissances sont-elles posées dans cette partie ? */
  avecQuiz: boolean;
}

export interface DureeDuTour {
  /** Le total, arrondi à la minute. */
  minutes: number;
  /** Le détail, pour que le chiffre soit discutable plutôt qu'à croire. */
  lecture: number;
  saisie: number;
  analyse: number;
  priseEnMain: number;
}

/** L'estimation, poste par poste. Arrondie à la minute, jamais en dessous d'une. */
export function dureeDuTour(faits: FaitsDuTour): DureeDuTour {
  // Le cadrage ne se lit vraiment qu'au premier tour ; ensuite il est connu, et
  // l'élève y revient par bribes. On ne le recompte pas.
  const aLire =
    faits.signesDeSituation + (faits.premierTour ? faits.signesDeCadrage : 0);
  const lecture = Math.round(aLire / SIGNES_PAR_MINUTE);
  const saisie = Math.round((faits.champs * SECONDES_PAR_CHAMP) / 60);
  // Sans situation à ce tour, il n'y a rien à analyser : le temps est nul, même
  // si les questions sont activées dans la partie.
  const analyse =
    faits.avecQuiz && faits.signesDeSituation > 0 ? MINUTES_ANALYSE_SITUATION : 0;
  const priseEnMain = faits.premierTour ? MINUTES_PRISE_EN_MAIN : 0;
  return {
    minutes: Math.max(1, lecture + saisie + analyse + priseEnMain),
    lecture,
    saisie,
    analyse,
    priseEnMain,
  };
}
