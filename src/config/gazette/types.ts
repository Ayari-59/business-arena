/**
 * LA GAZETTE DE L'ARÈNE : UNE COUPURE DE PRESSE PAR TOUR.
 *
 * Le journal du monde de la partie. Il parle de ce qui concerne TOUTES les
 * entreprises (la demande, les coûts d'achat, le crédit, l'activité, la
 * concurrence, la saison), jamais d'une seule. Il sort du moteur, pas d'un
 * texte libre : un article se calcule à partir des événements de marché DÉJÀ
 * tirés pour le tour (le tirage est déterministe, voir `peekEventDraw`) et de
 * la tendance de fond du scénario. Il ne contredit donc jamais ce qui arrive.
 *
 * Le journal est fictif. Son nom, sa maquette et ses sources n'empruntent rien
 * à un titre réel.
 */

/** Ce dont un article parle. `calme` : la tendance de fond, quand rien ne bouge. */
export type SujetDeLaGazette = "demande" | "concurrence" | "couts" | "taux" | "activite" | "calme";

export type SensDuSujet = "hausse" | "baisse" | "stable";

/**
 * FAIT ou PRÉVISION. Aux niveaux 1 et 2, tout ce que le journal écrit est un
 * fait : ce qui est annoncé arrive. Plus haut, ce qui n'est pas encore arrivé
 * s'écrit au conditionnel des analystes (« les analystes s'attendent à… ») ;
 * la plupart de ces prévisions se réalisent, et quelques-unes, selon une règle
 * écrite (`incertitude.ts`), sont démenties.
 */
export type FiabiliteDeLaGazette = "fait" | "prevision";

/** Une chose que l'article dit, gardée pour le bilan et pour les gardes. */
export interface ElementDeLArticle {
  sujet: SujetDeLaGazette;
  sens: SensDuSujet;
  fiabilite: FiabiliteDeLaGazette;
  /**
   * Une prévision qui ne se réalisera pas. Toujours une `prevision`, jamais
   * sur un sujet où quelque chose se passe vraiment ce tour-là.
   */
  dementi: boolean;
  /** L'événement du moteur qui fonde la phrase (null : la saison, le calme). */
  code: string | null;
  /** Vrai pour un événement qui tombe ce tour ; faux pour un événement qui se poursuit. */
  nouveau: boolean;
}

/** L'article, tel qu'il se lit et tel qu'il se garde. */
export interface ArticleDeLaGazette {
  tour: number;
  /** La rubrique du journal : Conjoncture, Matières premières, Financement… */
  rubrique: string;
  titre: string;
  /** Le chapô : trois ou quatre lignes, en phrases complètes. */
  chapo: string;
  /** « fait » quand tout ce qui est écrit est acquis ; « prevision » sinon. */
  fiabilite: FiabiliteDeLaGazette;
  /** Ce que l'article dit, sujet par sujet (vide pour un article d'enseignant). */
  sujets: ElementDeLArticle[];
  /**
   * Qui l'a écrit. L'élève ne le voit pas : un article d'enseignant reste la
   * presse du monde de la partie (décision du lot). L'enseignant, lui, le voit.
   */
  auteur: "gazette" | "enseignant";
}

/** Le nom du journal, une fois pour toutes. Fictif. */
export const NOM_DU_JOURNAL = "La Gazette de l'Arène";
/** Ce que le bandeau du journal porte sous son nom. */
export const DEVISE_DU_JOURNAL = "Économie régionale";
/**
 * Le prix du numéro, sur la ligne de date : un repère de journal, que le lecteur
 * reconnaît d'un coup d'œil. Fictif, et sans rapport avec les comptes de la partie.
 */
export const PRIX_DU_NUMERO = "1,20 €";
/** La signature, au pied de l'article : le journal parle par son correspondant. */
export const SIGNATURE_DU_JOURNAL = "De notre correspondant économique";
