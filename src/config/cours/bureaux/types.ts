import type { EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Chapitre, OptionDeChoix } from "../types";

/**
 * UN BUREAU (décision du propriétaire, novembre 2026) : un cas pratique d'un genre nouveau. L'élève
 * arrive à son poste de comptable et trouve une pile de pièces ; il les ouvre une à une, les contrôle,
 * les traite, puis rend son travail. Le geste du BTS CG : vérifier, pas seulement enregistrer.
 *
 * Il reprend du cas pratique ce qui décide de l'accès (le parcours, le palier, `libre`, les chapitres
 * repris : il s'ouvre avec eux, comme un cas dédié) et ce qui le présente (le titre, l'accroche, le
 * commanditaire). Ce qui le distingue tient au service : AUCUNE RÉPONSE ATTENDUE NE PART AU NAVIGATEUR.
 * La page sert la pile et les consignes (pedagogy/cours/bureau-servi.ts) ; chaque réponse remonte à une
 * action serveur, qui la corrige et ne renvoie que la correction de ce geste (app/cours/bureau/actions.ts).
 *
 * Il vit hors du registre des chapitres et des cas (config/cours/bureaux) : il ne compte ni dans le
 * catalogue, ni dans la couverture, ni parmi les cas dédiés (un par chapitre, garde du catalogue).
 */

/**
 * La nature d'une pièce de la pile : ce qui décide de sa présentation. Une enquête (config/cours/enquetes)
 * y ajoute la balance, la note et l'écriture d'un journal ; un scénario à embranchements
 * (config/cours/scenarios), le plan de trésorerie et la facture. Les activités des chapitres
 * (novembre 2026) y ajoutent le bon de commande, le bon de livraison et le bordereau (d'un organisme,
 * d'une banque), le bon sans précision (« bon ») et la fiche d'un registre de l'entreprise (« fiche » : la
 * fiche d'immobilisation, la fiche de stock, le journal de paie) : des natures génériques, que tout
 * bureau peut employer ; le lot C, le contrat (un prêt, un crédit-bail, une offre signée) et le
 * procès-verbal (d'une assemblée).
 */
export type NatureDePiece =
  | "courriel"
  | "releve"
  | "extrait"
  | "talon"
  | "avis"
  | "lettre"
  | "balance"
  | "note"
  | "ecriture"
  | "plan"
  | "facture"
  | "bon-de-commande"
  | "bon-de-livraison"
  | "bordereau"
  | "bon"
  | "fiche"
  | "contrat"
  | "proces-verbal";

/** Une ligne d'une balance ou d'une écriture : le compte, son intitulé, son débit ou son crédit. */
export interface LigneDeCompte {
  compte: string;
  intitule: string;
  debit: number;
  credit: number;
}

/** Une ligne d'un document de banque : sa date, son libellé, son montant (débit négatif, crédit positif). */
export interface LigneDeDocument {
  date: string;
  libelle: string;
  montant: number;
}

/** Une pièce de la pile : un document, tel que l'élève le lit. Rien n'y dit ce qu'il faut en faire. */
export interface PieceDuBureau {
  code: string;
  nature: NatureDePiece;
  /** Ce qu'on lit sur la pile, avant de l'ouvrir : « Relevé de compte de mars ». */
  titre: string;
  de: string;
  a: string;
  date: string;
  /** L'objet d'un courriel ou d'une lettre, le numéro d'un chèque ou d'un avis. */
  objet?: string;
  /** Le texte d'un courriel, d'une lettre ou d'un avis. */
  paragraphes?: readonly string[];
  /** Les opérations d'un relevé ou d'un extrait de compte. */
  lignes?: readonly LigneDeDocument[];
  /** Les lignes d'une balance ou d'une écriture, compte par compte. */
  comptes?: readonly LigneDeCompte[];
  /** Les montants à part (un solde, le montant d'un chèque), le dernier en gras s'il est `fort`. */
  montants?: readonly { libelle: string; montant: number; fort?: boolean }[];
  /** Une mention en pied de pièce. */
  mention?: string;
}

interface BaseDuBureau {
  id: string;
  /** Le titre court de l'étape. */
  titre: string;
  /** Ce que l'élève doit faire, en une ou deux phrases. */
  consigne: string;
  /** Les pièces de la pile à garder sous les yeux pendant l'étape, par leur code. */
  pieces: readonly string[];
  /** Ce que l'élève lit, une fois l'étape réussie. */
  explication: readonly string[];
}

/** Ranger des éléments (des pièces, des lignes) dans des catégories : classer la pile, pointer. */
export interface EtapeDeClassement extends BaseDuBureau {
  type: "classement";
  categories: readonly { code: string; libelle: string }[];
  elements: readonly {
    code: string;
    libelle: string;
    /** Le montant d'une ligne, quand l'élément en est une. */
    montant?: number;
    /** La pièce que l'élément ouvre, quand il en est une. */
    piece?: string;
    categorie: string;
    pourquoi: string;
  }[];
}

/** L'état de rapprochement : un tableau à compléter, corrigé au serveur. */
export interface EtapeDEtat extends BaseDuBureau {
  type: "etat";
  grille: TableauACompleter;
}

/** Passer les écritures que le contrôle demande, une à une, dans l'ordre que l'élève choisit. */
export interface EtapeDuJournal extends BaseDuBureau {
  type: "journal";
  ecritures: readonly { id: string; ecriture: EcritureAttendue; indices: readonly string[] }[];
  /**
   * Ce que l'élève lit quand sa saisie ne ressemble à aucune écriture qui reste à passer (ajout générique
   * des activités des chapitres, novembre 2026). Absent : la phrase du rapprochement, « relisez l'état de
   * rapprochement ».
   */
  horsListe?: string;
}

/** Répondre au commanditaire : des questions à choix, chiffrées. */
export interface EtapeDeReponse extends BaseDuBureau {
  type: "reponse";
  questions: readonly { id: string; question: string; options: readonly OptionDeChoix[] }[];
}

/**
 * RECTIFIER DES ÉCRITURES (le format « enquête ») : chaque écriture qu'une étape de classement a rangée
 * dans une catégorie (« Fausse »), l'élève dit pourquoi elle est fausse, puis la passe juste. L'étape
 * de classement en donne la liste au navigateur : celle-ci ne la sert pas, elle ne sert que les raisons.
 */
export interface EtapeDeRectification extends BaseDuBureau {
  type: "rectification";
  /** L'étape de classement qui trie les écritures, et la catégorie (`dans`) de celles qui sont à rectifier. */
  depuis: { etape: string; dans: string };
  /** Les raisons possibles d'une erreur, communes à toutes les écritures : les justes et des leurres. */
  raisons: readonly { code: string; libelle: string }[];
  ecritures: readonly {
    /** Le code de l'élément de classement, qui est celui de l'écriture. */
    id: string;
    /** La raison de l'erreur, parmi `raisons`. */
    raison: string;
    /** L'écriture juste. */
    ecriture: EcritureAttendue;
    /** Ce que l'élève lit une fois l'écriture rectifiée : l'erreur, et ce qu'elle changeait. */
    pourquoi: string;
    /** Des pistes, données une à une après un essai manqué. */
    indices: readonly string[];
  }[];
}

export type EtapeDuBureau = EtapeDeClassement | EtapeDEtat | EtapeDuJournal | EtapeDeReponse | EtapeDeRectification;

export interface Bureau extends Pick<Chapitre, "code" | "parcours" | "palier" | "blocs" | "titre" | "accroche" | "objectifs" | "libre"> {
  /**
   * Le format : un bureau (la pile d'un mois, par défaut) ou une enquête (un dossier qui cache des
   * erreurs, config/cours/enquetes). Le moteur est le même ; l'adresse, l'action et les mots changent.
   */
  format?: "bureau" | "enquete";
  /** Les chapitres dont le bureau reprend les gestes : il s'ouvre avec eux, comme un cas dédié. */
  reprend: readonly string[];
  /** Qui attend le travail (« La gérante »). */
  commanditaire: string;
  /** L'entreprise du bureau, et son nom. */
  entreprise: { code: string; nom: string };
  /** Le mot d'accueil, en tête de la pile. */
  accueil: readonly string[];
  /** La pile, dans l'ordre où elle se trouve sur le bureau. */
  pile: readonly PieceDuBureau[];
  etapes: readonly EtapeDuBureau[];
}
