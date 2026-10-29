import { MARCHE_A_TROIS, type FicheDuMarche } from "./marche-a-trois";
import { ANNEE_N } from "./nova-capacite";
import { DELAI_CONVENU_DE_CAMPUSTECH, NOVA_GESTION, RETARD_DE_CAMPUSTECH, type FicheDeGestion } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE MARCHÉ DE NOVA, POUR L'ÉCONOMIE ET LA MERCATIQUE (le lot M4 : les trois
 * chapitres de seconde SES, « l'offre et la demande », « le prix qui équilibre le marché », « la
 * concurrence », et les six chapitres de mercatique du bac STMG, « le marché et la part de marché »,
 * « segmenter et cibler », « le prix psychologique », « la demande répond au prix », « ce que
 * rapporte la communication », « les canaux de distribution », avec leurs cas).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une simulation
 * figée, inspirée de l'arène, calculée par le cours). Cette fiche ajoute au monde ce qui manquait
 * pour lire un marché ; tout le reste est relu sur les fiches qui existent déjà, jamais recopié :
 *   · nova-gestion.ts : la NOVA One à 59 € hors taxes (38 € de coût variable, 21 € de marge), la
 *     droite de demande du trimestre (16 755 − 203 × prix enceintes, à l'unité inférieure), ce que la
 *     ligne a fabriqué au premier trimestre (4 778 enceintes : l'offre), sa capacité (7 000), les
 *     ventes du semestre mois par mois (les particuliers en ligne, CampusTech), le marché de toutes
 *     les enceintes mois par mois, le taux de TVA, l'emprunt à 5 %, le seuil d'alerte de la part de
 *     marché du tableau de bord (25 %) ;
 *   · nova-capacite.ts : les enceintes livrées chaque trimestre de l'année N (la saison) ;
 *   · marche-a-trois.ts et attractivite.ts : NOVA, SoundBox et Auris qui se partagent 17 500
 *     enceintes par trimestre, leurs prix, leurs qualités, leurs charges et la courbe de la
 *     communication. Les chapitres de la concurrence et de la communication y jouent.
 *
 * UNE SEULE DEMANDE DE NOVA (réconciliation d'octobre 2026). La droite de nova-gestion.ts,
 * 16 755 − 203 × prix, est celle du premier trimestre : à 59 €, elle donne les 4 778 enceintes vendues
 * de janvier à mars de N, et toute la demande de N a été servie (nova-capacite.ts). Les autres
 * trimestres suivent la saison de N (6 081, 5 810, 6 940 enceintes à 59 €) ; le trimestre type du
 * marché à trois est celui de janvier à mars (4 778 enceintes à 59 €). La garde tests/cours/une-seule-nova.test.ts
 * compare ces fiches.
 *
 * CONVENTIONS. Tout est hors taxes, sauf ce qu'un intermédiaire doit (une créance se lit toutes taxes
 * comprises). Un trimestre a trois mois. Une demande se compte à l'enceinte inférieure.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES CLIENTÈLES DE NOVA
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeClientele = "etudiants" | "familles" | "melomanes";

/** Une sensibilité dite en mots : la plus forte des trois clientèles, la moyenne, la plus faible. */
export type Sensibilite = "forte" | "moyenne" | "faible";

export interface ClienteleDuMarche {
  code: CodeDeClientele;
  nom: string;
  /**
   * La demande que la clientèle adresse à NOVA en un trimestre, au prix p : demandeAPrixNul −
   * perdueParEuro × p. Les trois droites s'additionnent en celle de nova-gestion.ts.
   */
  demandeAPrixNul: number;
  perdueParEuro: number;
  /** Ce que la clientèle achète en enceintes au premier trimestre, à NOVA et à tous ses concurrents. */
  tailleDuSegment: number;
  /** Les repères de prix de l'enquête : en dessous, la clientèle doute de la qualité ; le prix qu'elle juge normal ; le seuil rond qu'elle ne veut pas passer. */
  mefiance: number;
  prixNormal: number;
  seuil: number | null;
  qualite: Sensibilite;
  publicite: Sensibilite;
}

/**
 * LES TROIS CLIENTÈLES (hypothèses du cours). La droite du trimestre, 16 755 − 203 × p, se découpe en
 * trois droites qui s'additionnent exactement : les étudiants (9 555 − 140 × p), les familles
 * (5 000 − 55 × p) et les mélomanes (2 200 − 8 × p). À 59 €, ils demandent 1 295, 1 755 et 1 728
 * enceintes : les 4 778 de la droite. Les étudiants comparent les prix, les mélomanes paient la
 * qualité, les familles suivent la publicité.
 *
 * LA TAILLE DE CHAQUE SEGMENT au premier trimestre : 9 000, 5 600 et 3 500 enceintes achetées à tous
 * les vendeurs, qui font les 18 100 enceintes du marché de janvier à mars (nova-gestion.ts).
 *
 * LES REPÈRES DE PRIX de l'enquête : méfiance sous 35 €, 39 € et 49 € ; prix jugé normal 49 €, 59 € et
 * 79 € ; un seul seuil rond, celui des familles, 60 €.
 */
export const CLIENTELES: readonly ClienteleDuMarche[] = [
  { code: "etudiants", nom: "Étudiants", demandeAPrixNul: 9_555, perdueParEuro: 140, tailleDuSegment: 9_000, mefiance: 35, prixNormal: 49, seuil: null, qualite: "faible", publicite: "moyenne" },
  { code: "familles", nom: "Familles", demandeAPrixNul: 5_000, perdueParEuro: 55, tailleDuSegment: 5_600, mefiance: 39, prixNormal: 59, seuil: 60, qualite: "moyenne", publicite: "forte" },
  { code: "melomanes", nom: "Mélomanes", demandeAPrixNul: 2_200, perdueParEuro: 8, tailleDuSegment: 3_500, mefiance: 49, prixNormal: 79, seuil: null, qualite: "forte", publicite: "faible" },
];

/**
 * LE SAUT AU SEUIL (hypothèse du chapitre « Le prix psychologique ») : un test en ligne montre qu'à
 * partir de 60 €, les familles demandent 15 % de moins que leur droite ne le dit. La droite du
 * trimestre, ajustée sur trois prix, lisse ce saut : seuls le chapitre et son cas le lisent.
 */
export const SAUT_AU_SEUIL = 0.15;

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DES CHAPITRES
// ─────────────────────────────────────────────────────────────────────────────

/** L'écart de prix que les chapitres essaient, à la baisse et à la hausse : 10 % (celui de nova-gestion.ts). */
export const ECART_DE_PRIX = NOVA_GESTION.decision.ecartDePrix;

/**
 * L'ÉQUILIBRE À 1 % PRÈS (hypothèse du cours) : une demande et une offre qui ne s'écartent pas de plus
 * de 1 % de l'offre se lisent comme égales. Un écart de quelques enceintes ne change pas la lecture de
 * l'économiste.
 */
export const MARGE_D_EQUILIBRE = 0.01;

/**
 * LA FIN D'ANNÉE (hypothèses du cas « Le prix de fin d'année ») : au quatrième trimestre, chaque
 * clientèle demande autant de fois plus qu'au premier que l'année N a livré de fois plus (6 940
 * enceintes contre 4 778) ; et NOVA met en vente tout ce que sa ligne peut monter, 7 000 enceintes.
 */
export const VENTES_DE_L_ANNEE_N = ANNEE_N.demande;

/**
 * LA CAMPAGNE PROPOSÉE (hypothèse du chapitre « Ce que rapporte la communication ») : NOVA ne fait
 * pas de publicité payante ; une agence lui propose une campagne de 4 000 € par trimestre.
 */
export const CAMPAGNE_PROPOSEE = 4_000;

/** Les budgets que le chapitre essaie : sans campagne, la moitié, la campagne, une fois et demie, le double. */
export const FACTEURS_DE_BUDGET = [0, 0.5, 1, 1.5, 2] as const;

/**
 * LE CANAL INDIRECT DE NOVA : CampusTech, une chaîne de magasins sur les campus, qui achète 320
 * enceintes par mois au prix des particuliers, sans commission, payées à 60 jours convenus (le délai
 * maximal entre professionnels) et en retard de 20 jours (nova-gestion.ts). Le canal direct : les
 * particuliers, en ligne, qui paient à la commande.
 *
 * L'ATTENTE ACCEPTABLE (hypothèse du chapitre « Les canaux de distribution ») : NOVA accepte que
 * l'attente du paiement lui coûte au plus 1 % du chiffre d'affaires hors taxes du canal.
 *
 * LA MARGE À GARDER (hypothèse du chapitre) : sur une enceinte vendue par un distributeur, NOVA veut
 * garder au moins 10 € de marge, une fois payés le coût variable et l'attente.
 */
export const CANAL_INDIRECT = {
  nom: "CampusTech",
  delaiConvenu: DELAI_CONVENU_DE_CAMPUSTECH,
  retard: RETARD_DE_CAMPUSTECH,
  commission: 0,
  coutAcceptableDuDelai: 0.01,
  margeAGarder: 10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheMercatique {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  /** La fiche de gestion de NOVA : le prix, les coûts, la droite, l'offre, le semestre. */
  gestion: FicheDeGestion;
  /** Le marché à trois : les concurrents, leurs offres, la communication. */
  marche: FicheDuMarche;
  clienteles: readonly ClienteleDuMarche[];
  sautAuSeuil: number;
  ecartDePrix: number;
  margeDEquilibre: number;
  ventesDeLAnneeN: readonly number[];
  campagneProposee: number;
  facteursDeBudget: readonly number[];
  canal: typeof CANAL_INDIRECT;
}

export const MERCATIQUE_DE_NOVA: FicheMercatique = {
  code: "nova",
  entreprise: "NOVA",
  unite: "enceinte",
  unites: "enceintes",
  gestion: NOVA_GESTION,
  marche: MARCHE_A_TROIS,
  clienteles: CLIENTELES,
  sautAuSeuil: SAUT_AU_SEUIL,
  ecartDePrix: ECART_DE_PRIX,
  margeDEquilibre: MARGE_D_EQUILIBRE,
  ventesDeLAnneeN: VENTES_DE_L_ANNEE_N,
  campagneProposee: CAMPAGNE_PROPOSEE,
  facteursDeBudget: FACTEURS_DE_BUDGET,
  canal: CANAL_INDIRECT,
};

/** Les fiches de mercatique du monde du cours, par code d'entreprise. */
export const MERCATIQUE_DU_COURS: Readonly<Record<string, FicheMercatique>> = { [MERCATIQUE_DE_NOVA.code]: MERCATIQUE_DE_NOVA };

/** La fiche d'un cas : celle de son entreprise. */
export const mercatiqueDe = (c: { code: string }): FicheMercatique => {
  const f = MERCATIQUE_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de fiche de mercatique pour ${c.code}`);
  return f;
};

/** Les entreprises des chapitres du lot : NOVA seule, dont le monde du cours tient le marché. */
export const ENTREPRISES_DU_MARCHE_DE_NOVA = ["nova"] as const;

export const POURQUOI_LE_MARCHE_DE_NOVA =
  "ce chapitre lit le marché des enceintes de NOVA, que le cours tient d'un bout à l'autre : ses clientèles, son prix, ses deux concurrents et ses canaux.";
