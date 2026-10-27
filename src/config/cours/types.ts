import type { EcritureAttendue } from "../../pedagogy/cours/correcteur";
import type { Ecriture } from "../../pedagogy/cours/etats";
import type { Cas } from "./cas";

/**
 * UN CHAPITRE DE COURS GUIDÉ : UNE SUITE D'ÉTAPES SUR UN CAS SIMULÉ.
 *
 * Chaque étape est une fonction du cas (les montants de l'entreprise choisie) et de
 * l'état comptable où l'élève est arrivé (le journal des écritures déjà passées).
 * Aucun texte ne porte un chiffre écrit à la main : tout se calcule.
 */

/** Ce que l'élève a devant lui à une étape : le journal passé jusque-là. */
export interface EtatDuCours {
  /** Les soldes des comptes après les écritures déjà validées. */
  soldes: Record<string, number>;
}

/** Une pièce comptable : la facture, le relevé, le contrat qui déclenche l'écriture. */
export interface Piece {
  nature: string;
  de: string;
  a: string;
  date: string;
  lignes: { libelle: string; quantite?: string; prixUnitaire?: number; montant: number }[];
  totaux: { libelle: string; montant: number; fort?: boolean }[];
  mention?: string;
}

/** Ce que l'étape montre une fois réussie. */
export type Vue = "bilan" | "resultat" | "bilan-et-resultat" | "tva" | "grand-livre" | "paie" | "immobilisation";

/** Un tableau de chiffres du cas, montré avec l'étape : des colonnes, des lignes de valeurs déjà écrites. */
export interface TableauDeDonnees {
  titre: string;
  colonnes: readonly string[];
  lignes: readonly { libelle: string; valeurs: readonly string[] }[];
}

interface Base {
  id: string;
  /** Le titre court de l'étape, pour le sommaire. */
  titre: string;
  /** Les fiches notions que l'étape fait vivre (`/notions#code`). */
  notions?: readonly string[];
  /**
   * L'étape n'existe que dans les entreprises où elle a un objet (une écriture de stock là
   * où il y a un stock) : `chapitreDuCas` retire les autres. Absent : partout.
   */
  si?: (c: Cas) => boolean;
  /** Un tableau de chiffres du cas, montré avant la question (lecture, choix, montants, tri). */
  tableau?: (c: Cas) => TableauDeDonnees;
}

export interface EtapeLecture extends Base {
  type: "lecture";
  texte: (c: Cas) => string[];
  /** Un repère à retenir, encadré. */
  repere?: (c: Cas) => string;
}

export interface EtapeEcriture extends Base {
  type: "ecriture";
  /** Ce qui se passe dans l'entreprise. */
  evenement: (c: Cas) => string;
  piece?: (c: Cas) => Piece;
  ecriture: (c: Cas) => EcritureAttendue;
  /** Les indices, du plus vague au plus précis, après une erreur. */
  indices: (c: Cas) => string[];
  /** L'explication, avec les chiffres du cas, une fois l'écriture passée. */
  explication: (c: Cas, e: EtatDuCours) => string[];
  vue?: Vue;
  /**
   * Le jour de l'échéance, pour un règlement : les règlements d'un chapitre se suivent
   * dans l'ordre de leurs dates, qui dépendent de l'entreprise (`chapitreDuCas`).
   */
  echeance?: (c: Cas) => number;
}

export interface OptionDeChoix {
  texte: string;
  juste: boolean;
  /** Pourquoi : se lit après la réponse, juste ou non. */
  retour: string;
}

export interface EtapeChoix extends Base {
  type: "choix";
  question: (c: Cas, e: EtatDuCours) => string;
  options: (c: Cas, e: EtatDuCours) => OptionDeChoix[];
  vue?: Vue;
}

export interface ChampDeMontant {
  libelle: string;
  attendu: number;
  /** Comment on le calcule : se lit après la réponse. */
  calcul: string;
  /**
   * L'écart admis, en plus ou en moins (0,01 par défaut : le centime). Un seuil de
   * rentabilité en valeur dépend de l'arrondi du taux de marge que l'élève a gardé :
   * l'euro près suffit à dire qu'il a compris.
   */
  tolerance?: number;
}

export interface EtapeMontants extends Base {
  type: "montants";
  question: (c: Cas, e: EtatDuCours) => string;
  champs: (c: Cas, e: EtatDuCours) => ChampDeMontant[];
  explication: (c: Cas, e: EtatDuCours) => string[];
  vue?: Vue;
}

/** Deux moments du même cas, côte à côte : ce qui a changé, ce qui n'a pas bougé. */
export interface EtapeComparaison extends Base {
  type: "comparaison";
  question: (c: Cas) => string;
  /** L'identifiant de l'étape d'écriture qui sépare « avant » et « après ». */
  avantLEtape: string;
  libelles: { avant: string; apres: string };
  options: (c: Cas, avant: EtatDuCours, apres: EtatDuCours) => OptionDeChoix[];
  explication: (c: Cas, avant: EtatDuCours, apres: EtatDuCours) => string[];
}

/** Ranger des éléments dans des catégories : les charges, en variables ou fixes. */
export interface EtapeTri extends Base {
  type: "tri";
  question: (c: Cas) => string;
  categories: readonly { code: string; libelle: string }[];
  elements: (c: Cas) => { libelle: string; montant: number; categorie: string; pourquoi: string }[];
  explication: (c: Cas) => string[];
}

/**
 * La simulation à manipuler : un curseur sur une quantité, et ce que l'entreprise gagne ou
 * perd à chaque position. L'élève cherche la position demandée (le seuil) ; le graphique
 * montre les deux droites qui se croisent.
 */
export interface EtapeCurseur extends Base {
  type: "curseur";
  question: (c: Cas) => string;
  /** La position cherchée, et les bornes du curseur (à partir de zéro, sauf `min`). */
  cible: (c: Cas) => { attendu: number; max: number; min?: number };
  /**
   * Ce que le curseur fait varier : son nom et son unité. Absent : les ventes du mois, dans
   * l'unité de l'entreprise, comme au seuil de rentabilité.
   */
  grandeur?: (c: Cas) => { libelle: string; unite: string };
  /**
   * La position cherchée est la plus petite où le produit couvre le coût (le seuil, par
   * défaut), ou la plus grande (un délai qu'on peut accorder sans découvert).
   */
  sens?: "plus-petite" | "plus-grande";
  /** Ce que l'élève lit quand il valide trop bas ou trop haut. Absent : les mots du seuil. */
  rates?: (c: Cas) => { dessous: string; dessus: string };
  /** Le nom des deux zones du graphique, selon que le produit couvre le coût ou non. */
  zones?: readonly [string, string];
  /** Le bouton qui montre la réponse. Absent : « Montrer le seuil ». */
  montrer?: string;
  /** Ce que vaut chaque grandeur pour une quantité donnée. */
  lecture: (c: Cas, quantite: number) => { libelle: string; montant: number; fort?: boolean }[];
  /** Les deux droites du graphique : le produit et le coût, pour une quantité. */
  droites: (c: Cas) => { produit: (q: number) => number; cout: (q: number) => number; libelles: [string, string] };
  explication: (c: Cas) => string[];
}

/** Un levier du laboratoire : une grandeur que l'élève fait varier, de `min` à `max` par `pas`. */
export interface LevierDeSimulation {
  code: string;
  libelle: string;
  unite: string;
  min: number;
  max: number;
  pas: number;
  /** La position au départ : celle du cas, que l'élève déplace. */
  depart: number;
  /**
   * Un levier à choix : deux méthodes ou plus, nommées (« linéaire » ou « dégressif », « débits » ou
   * « encaissements »), chacune codée par une valeur. L'élève choisit d'un geste au lieu de glisser ;
   * `min` et `max` sont la plus petite et la plus grande valeur, `pas` sans effet.
   */
  choix?: readonly { valeur: number; libelle: string }[];
}

/**
 * Le graphique du laboratoire : une à trois courbes tracées point par point en faisant varier un
 * levier (les autres à leur position du moment), pour ce qu'un curseur ne sait pas tracer, une
 * courbe qui n'est pas une droite (la VAN selon le taux, la demande selon le prix).
 */
export interface GraphiqueDeSimulation {
  /** Le levier en abscisse : un levier qui glisse, pas un levier à choix. */
  levier: string;
  courbes: readonly { libelle: string; valeur: (position: Readonly<Record<string, number>>) => number }[];
  /** L'unité de l'axe des montants. Absent : l'euro. */
  unite?: string;
}

/** Une ligne de ce que le laboratoire montre pour une position des leviers. */
export interface LigneDeSimulation {
  libelle: string;
  montant: number;
  /** L'unité de la ligne quand ce n'est pas l'euro (« kg », « heures-machine »). */
  unite?: string;
  /** Ce que vaut la ligne au départ, montré à côté : l'élève voit ce qu'il a changé. */
  reference?: number;
  /** Une ligne d'effet sur le résultat : une barre verte (favorable) ou rouge (défavorable). */
  effet?: boolean;
  fort?: boolean;
}

/**
 * LE LABORATOIRE : plusieurs leviers à la fois, et leur impact en direct (demande du propriétaire,
 * octobre 2026 : « toujours plus de simulation et de jeu pour montrer l'impact, une explication
 * expérientielle »). L'élève déplace les leviers, voit chaque écart réagir, et relève un défi :
 * une position qui atteint ce que le défi demande. Plusieurs positions peuvent le réussir ;
 * `solution` en est une, celle que montre la correction.
 */
export interface EtapeSimulation extends Base {
  type: "simulation";
  question: (c: Cas) => string;
  leviers: (c: Cas) => readonly LevierDeSimulation[];
  lecture: (c: Cas, position: Readonly<Record<string, number>>) => readonly LigneDeSimulation[];
  defi: (c: Cas) => {
    /** Ce qu'il faut obtenir, en une phrase. */
    consigne: string;
    atteint: (position: Readonly<Record<string, number>>) => boolean;
    /** Ce que l'élève lit quand sa position ne réussit pas encore le défi. */
    indice: (position: Readonly<Record<string, number>>) => string;
    solution: Readonly<Record<string, number>>;
  };
  /** Un graphique, montré sous les leviers. Absent : le tableau seul. */
  graphique?: (c: Cas) => GraphiqueDeSimulation;
  /** Le bouton qui montre une solution. Absent : « Montrer une solution ». */
  montrer?: string;
  /** Ce que l'élève a vu, une fois le défi réussi, à la position où il l'a réussi. */
  explication: (c: Cas, position: Readonly<Record<string, number>>) => string[];
}

export type Etape =
  | EtapeLecture
  | EtapeEcriture
  | EtapeChoix
  | EtapeMontants
  | EtapeComparaison
  | EtapeTri
  | EtapeCurseur
  | EtapeSimulation;

export interface Chapitre {
  code: string;
  parcours: "comptabilite-generale" | "controle-de-gestion" | "mco" | "ndrc" | "stmg" | "stmg-gf" | "stmg-rh" | "gpme" | "strategie" | "seconde-mg" | "stmg-sig" | "mhr" | "fiscalite" | "logistique" | "dscg-finance" | "cap-epc" | "vente" | "seconde-ses" | "stmg-management";
  palier: 1 | 2 | 3 | 4;
  /**
   * Les blocs de référentiel que le chapitre fait travailler, préfixés du diplôme dont ils
   * viennent (« BTS MCO Bloc 3 · Assurer la gestion opérationnelle ») : un chapitre de
   * comptabilité sert le BTS CG et le DCG à la fois, comme le tournoi inter-filières sert
   * quatre formations, et c'est le préfixe qui dit à laquelle chaque bloc appartient
   * (`referentielDeCitation`). La couverture de chaque formation les compte avec les séances
   * des ateliers (config/couverture.ts).
   *
   * Vide quand le programme que le chapitre suit n'a pas été confronté à son texte : un thème
   * cité de mémoire serait justement l'erreur que le registre des référentiels a été fait pour
   * éviter. Le chapitre paraît alors chez sa formation par son parcours, sans bloc.
   */
  blocs: readonly string[];
  titre: string;
  accroche: string;
  /** Ce que l'élève saura faire à la fin. */
  objectifs: readonly string[];
  /** Libre d'accès, sans licence. */
  libre: boolean;
  /**
   * Les seules entreprises où le chapitre se joue, quand il ne vaut pas pour toutes (un
   * service ne se stocke pas), et pourquoi, en une phrase dite à l'élève qui en arrive
   * d'une autre. Absent : les entreprises du cours, toutes.
   */
  entreprises?: { codes: readonly string[]; pourquoi: string };
  /**
   * Le journal tel que l'élève le trouve en ouvrant le chapitre : une balance, déjà passée,
   * à laquelle ses écritures s'ajoutent. Absent : un journal vide.
   */
  ouverture?: (c: Cas) => Ecriture;
  etapes: readonly Etape[];
}
