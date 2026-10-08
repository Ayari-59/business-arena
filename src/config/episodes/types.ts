/**
 * CE QU'EST UN ÉPISODE MANAGER.
 *
 * Un épisode met une personne dans la peau d'un manager pendant un trimestre :
 * des messages qui arrivent, des vérifications qui coûtent du temps, six
 * décisions, et un bilan qui rejoue chacune sous trente tirages du même hasard
 * pour séparer la qualité de la décision de la chance.
 *
 * Tout ce qui change d'un épisode à l'autre — le métier, les chiffres que le
 * manager regarde, ce sur quoi on le juge, ce que ses décisions révèlent de
 * lui — tient dans une définition `Episode`. L'interface et l'analyse du bilan
 * sont communes : un nouvel épisode s'écrit sans toucher ni à l'une ni à
 * l'autre.
 *
 * Les fonctions qui lisent le résultat d'une simulation sont déclarées en
 * MÉTHODES : chaque épisode a son propre type de résultat, et c'est ce qui
 * permet de les ranger tous dans un même registre.
 */
import type { CodeNiveau } from "./niveaux";

/** Ce que les messages et les sources d'une étape lisent de la situation au moment où ils arrivent. */
export type Contexte = Readonly<Record<string, string | number | boolean>>;

export interface Message {
  de: string;
  role: string;
  heure?: string;
  alerte?: boolean;
  texte: string;
}

export interface Source {
  id: string;
  titre: string;
  /** En jours ; seul le temps de l'enquête de la première décision est compté. */
  cout: number;
  nature: "decisive" | "utile" | "bruit" | "aide";
  /** Ce que la vérification apprend ; certaines dépendent des décisions déjà prises. */
  resultat: string | ((ctx: Contexte) => string);
}

export interface Option {
  t: string;
  d: string;
}

export interface Etape {
  moment: string;
  titre: string;
  /** La dernière semaine que la décision couvre. */
  jusqua: number;
  messages: (ctx: Contexte) => Message[];
  /** Le temps d'enquête disponible, en jours (première décision seulement). */
  budget?: number;
  sources: readonly Source[];
  diagnostic?: boolean;
  prevision?: boolean;
  reevaluation?: boolean;
  question: string;
  options: readonly Option[];
  /** Les réponses du terrain à chaque option ; `null` quand elles dépendent du hasard. */
  reactions: readonly (readonly Message[] | null)[];
}

/** Une semaine simulée : les grandeurs que le tableau de bord et la courbe lisent. */
export type Semaine = Readonly<Record<string, number>>;

/** Ce que tout résultat de simulation porte, quel que soit l'épisode. */
export interface Resultat {
  /** Indexées de 1 à 13 ; l'indice 0 est vide. */
  semaines: readonly (Semaine | null)[];
  /** Ce sur quoi la direction juge le trimestre ; plus c'est haut, mieux c'est. */
  objectif: number;
}

/** L'état d'une partie terminée, tel que le bilan le lit. */
export interface PartieJouee {
  graine: number;
  chemin: readonly number[];
  /** Les sources consultées, étape par étape. */
  consultes: readonly (readonly string[])[];
  jours: number;
  diagnostic: string;
  reevaluation: { choix: "maintient" | "corrige"; principal: string | null };
  /** La prévision chiffrée de la première décision. */
  prevision: number;
  confiance: number;
  /** Le niveau joué ; Standard s'il n'est pas dit. Il ne change pas le jugement du bilan. */
  niveau?: CodeNiveau;
}

export interface Indicateur {
  cle: string;
  nom: string;
  format: (v: number) => string;
  /** Le format d'un écart, s'il diffère de celui de la valeur (des points plutôt que des pourcents). */
  formatEcart?: (v: number) => string;
  /** 1 si monter est une bonne nouvelle, -1 sinon. */
  sensBon: 1 | -1;
  aide: (semaine: number, lecture: Lecture) => string;
  /** Une jauge d'avancement : la valeur rapportée à une cible. */
  jauge?: (lecture: Lecture) => { part: number; enRetard: boolean } | null;
}

/** Ce que le tableau de bord montre à la fin d'une semaine. `null` : pas encore de valeur. */
export type Lecture = Readonly<Record<string, number | null>>;

export interface Tuile {
  nom: string;
  valeur: string;
  aide: string;
  tenu: boolean;
}

export interface Constat {
  /** 1 : acquis ; entre 0 et 1 : en partie ; 0 : à travailler. */
  score: number;
  texte: string;
}

export interface Episode<R extends Resultat = Resultat> {
  code: string;
  numero: number;
  domaine: string;
  titre: string;
  /** Une phrase pour la carte de l'épisode dans la liste. */
  resume: string;
  /** La personne qu'on incarne, et son équipe. */
  persona: string;
  mandat: readonly { fort: string; texte: string }[];
  /** Ce sur quoi la direction juge le trimestre, en une phrase. */
  jugement: string;
  duree: string;
  /** « Votre agence », « Votre service » : le nom du tableau de bord. */
  nomDuTableau: string;

  diagnostics: readonly { id: string; t: string }[];
  etapes: readonly Etape[];
  /** Les choix que le tableau de bord suppose tant qu'une décision n'est pas prise : ne rien changer. */
  neutre: readonly number[];
  /** Les manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
  references: readonly { nom: string; chemin: readonly number[] }[];

  enquete: {
    /** Au-delà de ce nombre de jours d'enquête, l'attente coûte. */
    joursSansPerte: number;
    consigne: string;
    /**
     * Ce qui clôt l'enquête de la première décision, dit après « avant » :
     * « le point de vendredi » si l'épisode ne dit rien.
     */
    echeance?: string;
    /** Le message qui dit ce que l'attente a coûté. */
    perte(jours: number): Message | null;
  };
  prevision: {
    libelle: string;
    unite: string;
    placeholder: string;
    min: number;
    max: number;
    step: number;
    /** La valeur réalisée, dans l'unité de la prévision. */
    reel(t: R): number;
  };

  simuler(chemin: readonly number[], graine: number, jours: number): R;
  lire(decisions: readonly number[], graine: number, jours: number, semaine: number): Lecture;
  indicateurs: readonly Indicateur[];
  contexte(lecture: Lecture, decisions: readonly number[]): Contexte;
  /** Les trois chiffres qui résument les semaines d'une décision. */
  recap(t: R, de: number, a: number): readonly [string, string][];
  courbe: {
    titre: string;
    cle: string;
    /** La cadence de l'objectif, par semaine. */
    cible: number;
    libelleCible: string;
    graduations: readonly number[];
    format: (v: number) => string;
    details(s: Semaine): string[];
  };
  /** Les réactions qui dépendent du hasard ; `null` : celles de l'étape. */
  reactions(etape: number, choix: number, graine: number): Message[] | null;
  /** Ce qui est arrivé pendant des semaines : les suites de décisions, et les imprévus. */
  evenements(
    chemin: readonly number[],
    graine: number,
    de: number,
    a: number,
  ): { lies: Message[]; imprevus: Message[] };
  imprevus(graine: number): { semaine: number; titre: string }[];

  bilan: {
    titre(t: R): string;
    formatObjectif: (v: number) => string;
    /** Ce que les barres de comparaison mesurent. */
    noteDesBarres: string;
    tuiles(t: R): Tuile[];
    hasard(t: R, graine: number): { titre: string; texte: string }[];
  };
  comportements(p: PartieJouee, t: R): Constat[];
  axe(constats: readonly Constat[]): { titre: string; texte: string };
}
