import type { EcritureAttendue } from "../../pedagogy/cours/correcteur";
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
export type Vue = "bilan" | "resultat" | "bilan-et-resultat" | "tva" | "grand-livre";

interface Base {
  id: string;
  /** Le titre court de l'étape, pour le sommaire. */
  titre: string;
  /** Les fiches notions que l'étape fait vivre (`/notions#code`). */
  notions?: readonly string[];
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

export type Etape = EtapeLecture | EtapeEcriture | EtapeChoix | EtapeMontants | EtapeComparaison;

export interface Chapitre {
  code: string;
  parcours: "comptabilite-generale" | "controle-de-gestion";
  palier: 1 | 2 | 3 | 4;
  titre: string;
  accroche: string;
  /** Ce que l'élève saura faire à la fin. */
  objectifs: readonly string[];
  /** Libre d'accès, sans licence. */
  libre: boolean;
  etapes: readonly Etape[];
}
