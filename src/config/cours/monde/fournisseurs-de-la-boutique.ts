import { assortiment, referenceDe } from "./boutique";
import type { CodeDeFournisseur, CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : CHOISIR ET NÉGOCIER AVEC LE FOURNISSEUR (BTS MCO, bloc 2, chapitre « Choisir et
 * négocier avec le fournisseur »).
 *
 * Les trois façonniers sont ceux de la fiche (monde/maille-et-co.ts) : leurs prix rapportés au
 * référent, leurs délais de paiement et de livraison, leurs minimums de commande, leur réassort. Ce
 * module ajoute ce qu'il faut pour les départager et négocier, chaque hypothèse nommée :
 *   1. LA GRILLE MULTICRITÈRE : six critères pondérés, une note de 0 à 5 par façonnier et par critère,
 *      tirée de la fiche (et, pour la qualité, du taux de retour des clients) ; la note pondérée, sur 5.
 *   2. LA COOPÉRATION COMMERCIALE : une mise en avant que le façonnier paie, face à la marge de la
 *      mise en avant qu'elle déplace.
 *   3. LE SEUIL DE REVENTE À PERTE : le prix d'achat effectif d'un pull col rond (le prix net de la
 *      facture, plus le transport, moins les autres avantages du façonnier), qui borne la remise d'une
 *      fin de série hors soldes.
 *   4. LE CADRE DES NÉGOCIATIONS : la convention écrite, le plafond des délais de paiement.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA GRILLE MULTICRITÈRE
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeCritere = "prix" | "paiement" | "livraison" | "minimum" | "reassort" | "qualite";

/**
 * LES CRITÈRES ET LEURS POIDS (hypothèse du cours : les poids de l'acheteuse de la boutique), sur 100.
 * Le prix et la qualité se partagent 50 points : le laboratoire déplace ce partage, les quatre autres
 * critères gardent leurs poids.
 */
export const CRITERES: readonly { code: CodeDeCritere; libelle: string; poids: number }[] = [
  { code: "prix", libelle: "Prix d'achat", poids: 30 },
  { code: "paiement", libelle: "Délai de paiement", poids: 15 },
  { code: "livraison", libelle: "Délai de livraison", poids: 15 },
  { code: "minimum", libelle: "Minimum de commande", poids: 10 },
  { code: "reassort", libelle: "Réassort en saison", poids: 10 },
  { code: "qualite", libelle: "Qualité", poids: 20 },
];

/** Les points que le prix et la qualité se partagent. */
export const POIDS_DU_PRIX_ET_DE_LA_QUALITE = 50;

/**
 * LE TAUX DE RETOUR DES CLIENTS (hypothèse du cours, relevé l'an passé) : la part des articles rapportés
 * pour un défaut (bouloche, couture, taille). Il fonde la note de qualité.
 */
export const TAUX_DE_RETOUR: Readonly<Record<CodeDeFournisseur, number>> = { faconnier: 0.02, "fins-de-serie": 0.06, "atelier-local": 0.005 };

/**
 * LES NOTES DE 0 À 5 (hypothèse du cours : le barème de l'acheteuse), critère par critère, tirées de la
 * fiche : le moins cher a 5 au prix, le plus cher 1 ; le plus long délai de paiement 5, le comptant 0 ;
 * la livraison la plus rapide 5, la plus lente 1 ; le plus petit minimum 5, le plus grand 1 ; le
 * réassort 5, son absence 0 ; le moins de retours 5, le plus 1.
 */
export const NOTES: Readonly<Record<CodeDeFournisseur, Readonly<Record<CodeDeCritere, number>>>> = {
  faconnier: { prix: 3, paiement: 5, livraison: 1, minimum: 3, reassort: 5, qualite: 4 },
  "fins-de-serie": { prix: 5, paiement: 0, livraison: 5, minimum: 1, reassort: 0, qualite: 1 },
  "atelier-local": { prix: 1, paiement: 3, livraison: 3, minimum: 5, reassort: 5, qualite: 5 },
};

/**
 * LE QUATRIÈME FAÇONNIER (hypothèse du cas « Un quatrième façonnier ») : un tricoteur italien. Son
 * prix d'achat vaut 96 % de celui du référent (24 € le pull col rond, net de remise) ; il est payé à
 * 30 jours, livre en 12 jours, à partir de 150 articles, réassortit en saison ; 3 % de retours chez ses
 * clients. Les notes suivent le barème de l'acheteuse. Il facture 0,80 € de transport par pull et
 * accorde 3 % de ristourne de fin d'année, sans coopération commerciale. Il offrirait 5 % de remise si
 * la boutique s'engageait à ne jamais vendre le col rond sous 60 € toutes taxes comprises.
 */
export const QUATRIEME_FACONNIER = {
  nom: "Tricoteur italien",
  multiplicateur: 0.96,
  delaiDePaiement: 30,
  delaiDeLivraison: 12,
  minimumDeCommande: 150,
  reassort: true,
  tauxDeRetour: 0.03,
  notes: { prix: 4, paiement: 3, livraison: 3, minimum: 3, reassort: 5, qualite: 3 } as Readonly<Record<CodeDeCritere, number>>,
  transportParArticle: 0.8,
  ristourne: 0.03,
  remiseContrePrixImpose: 0.05,
  prixPlancherImpose: 60,
} as const;

/** La note pondérée de notes quelconques, sur 5, quand le prix pèse `poidsDuPrix`. */
export function notePondereeDe(notes: Readonly<Record<CodeDeCritere, number>>, poidsDuPrix: number = CRITERES[0]!.poids) {
  const poids = poidsAvecLePrix(poidsDuPrix);
  return somme(CRITERES.map((c) => poids[c.code] * notes[c.code])) / 100;
}

/** Le seuil de revente à perte du col rond chez le quatrième façonnier. */
export function seuilChezLeQuatrieme(f: FicheDeLaBoutique) {
  const r = referenceDe(f, ACHAT_DU_COL_ROND.reference);
  const q = QUATRIEME_FACONNIER;
  const prixNet = auCentime(r.coutDAchat * q.multiplicateur);
  const ristourne = auCentime(prixNet * q.ristourne);
  const seuilHt = auCentime(prixNet + q.transportParArticle - ristourne);
  const seuilTtc = auCentime(seuilHt * (1 + r.tauxTva));
  return { r, prixNet, transport: q.transportParArticle, ristourne, seuilHt, seuilTtc, remiseMaximale: (r.prixTtc - seuilTtc) / r.prixTtc };
}

/** Les poids, quand le prix en prend `poidsDuPrix` et la qualité le reste des 50 points. */
export function poidsAvecLePrix(poidsDuPrix: number): Readonly<Record<CodeDeCritere, number>> {
  const p = Object.fromEntries(CRITERES.map((c) => [c.code, c.poids])) as Record<CodeDeCritere, number>;
  return { ...p, prix: poidsDuPrix, qualite: POIDS_DU_PRIX_ET_DE_LA_QUALITE - poidsDuPrix };
}

/** La note pondérée d'un façonnier, sur 5 : la somme des poids × notes, divisée par 100 (non arrondie). */
export function notePonderee(fournisseur: CodeDeFournisseur, poidsDuPrix: number = CRITERES[0]!.poids) {
  return notePondereeDe(NOTES[fournisseur], poidsDuPrix);
}

/** La grille, façonnier par façonnier, et le classement. */
export function grilleDesFournisseurs(f: FicheDeLaBoutique, poidsDuPrix: number = CRITERES[0]!.poids) {
  const lignes = f.fournisseurs.map((x) => ({ code: x.code, nom: x.nom, note: notePonderee(x.code, poidsDuPrix) }));
  const classement = [...lignes].sort((a, b) => b.note - a.note);
  return { lignes, premier: classement[0]!, classement };
}

/** Le plus petit poids entier du prix où `a` passe devant `b` (ou les égale, si `ex aequo`). */
export function poidsDuPrixQuiFaitPasser(a: CodeDeFournisseur, b: CodeDeFournisseur, exAequo = true) {
  for (let p = 0; p <= POIDS_DU_PRIX_ET_DE_LA_QUALITE; p++) {
    const d = notePonderee(a, p) - notePonderee(b, p);
    if (exAequo ? d >= -1e-9 : d > 1e-9) return p;
  }
  return null;
}

/** Le plus petit poids entier du prix où `a` passe en tête de la grille, devant les deux autres. */
export function poidsDuPrixQuiMetEnTete(f: FicheDeLaBoutique, a: CodeDeFournisseur) {
  for (let p = 0; p <= POIDS_DU_PRIX_ET_DE_LA_QUALITE; p++) {
    if (f.fournisseurs.every((x) => x.code === a || notePonderee(a, p) > notePonderee(x.code, p) + 1e-9)) return p;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA COOPÉRATION COMMERCIALE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA COOPÉRATION COMMERCIALE PROPOSÉE (hypothèse du cours) : le façonnier de référence paie 1 200 € hors
 * taxes pour que la boutique mette son pull col rond en vitrine et en tête de rayon pendant un mois.
 * La mise en avant fait vendre 40 pulls col rond de plus ; elle prend la place de celle du mérinos, qui
 * fait vendre chaque mois 25 mérinos de plus. On compare à la marge sur coût variable d'un article.
 */
export const COOPERATION_PROPOSEE = {
  remuneration: 1_200,
  reference: "col-rond" as CodeDeReference,
  ventesEnPlus: 40,
  referenceDeplacee: "merinos" as CodeDeReference,
  ventesPerdues: 25,
} as const;

export function cooperationCommerciale(f: FicheDeLaBoutique, remuneration: number = COOPERATION_PROPOSEE.remuneration) {
  const a = assortiment(f);
  const de = (code: CodeDeReference) => a.references.find((r) => r.code === code)!;
  const mise = de(COOPERATION_PROPOSEE.reference);
  const deplacee = de(COOPERATION_PROPOSEE.referenceDeplacee);
  const margeGagnee = auCentime(COOPERATION_PROPOSEE.ventesEnPlus * mise.margeUnitaire);
  const margePerdue = auCentime(COOPERATION_PROPOSEE.ventesPerdues * deplacee.margeUnitaire);
  return {
    remuneration,
    mise,
    deplacee,
    margeGagnee,
    margePerdue,
    effetNet: auCentime(remuneration + margeGagnee - margePerdue),
    /** La plus petite rémunération qui rend la mise en avant neutre pour la boutique. */
    remunerationPlancher: auCentime(Math.max(0, margePerdue - margeGagnee)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE SEUIL DE REVENTE À PERTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PRIX D'ACHAT EFFECTIF DU PULL COL ROND (hypothèse du cours, sur la règle du code de commerce,
 * art. L. 442-5) : le prix unitaire net de la facture du façonnier (25 € hors taxes), plus le
 * transport payé par la boutique (0,50 € par pull), moins les autres avantages financiers du façonnier
 * ramenés au pull : la ristourne de fin d'année (2 % du prix net) et la coopération commerciale
 * (1 200 € pour une commande de 600 pulls). C'est le « triple net ». Le seuil de revente à perte
 * s'entend taxes comprises : on lui ajoute la TVA, et on le compare à l'étiquette.
 */
export const ACHAT_DU_COL_ROND = {
  reference: "col-rond" as CodeDeReference,
  transportParArticle: 0.5,
  ristourne: 0.02,
  articlesDeLaCommande: 600,
} as const;

/** La remise annoncée pour la fin de série du col rond, hors période de soldes (hypothèse du cours). */
export const REMISE_DE_LA_FIN_DE_SERIE = 0.6;

/**
 * L'AMENDE DE LA REVENTE À PERTE (code de commerce, art. L. 442-5) : 75 000 € pour une personne
 * physique ; une société encourt le quintuple. // À VÉRIFIER
 */
export const AMENDE_DE_LA_REVENTE_A_PERTE = 75_000;

export function seuilDeReventeAPerte(f: FicheDeLaBoutique) {
  const r = referenceDe(f, ACHAT_DU_COL_ROND.reference);
  const prixNet = r.coutDAchat;
  const ristourne = auCentime(prixNet * ACHAT_DU_COL_ROND.ristourne);
  const cooperation = auCentime(COOPERATION_PROPOSEE.remuneration / ACHAT_DU_COL_ROND.articlesDeLaCommande);
  const seuilHt = auCentime(prixNet + ACHAT_DU_COL_ROND.transportParArticle - ristourne - cooperation);
  const seuilTtc = auCentime(seuilHt * (1 + r.tauxTva));
  const remiseMaximale = (r.prixTtc - seuilTtc) / r.prixTtc;
  const prixDeLaFinDeSerie = auCentime(r.prixTtc * (1 - REMISE_DE_LA_FIN_DE_SERIE));
  return {
    r,
    prixNet,
    transport: ACHAT_DU_COL_ROND.transportParArticle,
    ristourne,
    cooperation,
    seuilHt,
    seuilTtc,
    remiseMaximale,
    prixDeLaFinDeSerie,
    finDeSerieAPerte: prixDeLaFinDeSerie < seuilTtc,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LE CADRE DES NÉGOCIATIONS COMMERCIALES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PLAFOND DES DÉLAIS DE PAIEMENT ENTRE PROFESSIONNELS (code de commerce, art. L. 441-10) : 60 jours
 * à compter de la date de la facture, ou 45 jours fin de mois si le contrat le prévoit.
 */
export const DELAI_DE_PAIEMENT_MAXIMAL_EN_JOURS = 60;

/** Le délai que propose l'atelier local en échange d'un prix plus bas (hypothèse du cours). */
export const DELAI_PROPOSE_PAR_L_ATELIER = 75;

/**
 * LA CONVENTION ÉCRITE (code de commerce, art. L. 441-3) : elle fixe, pour l'année, le prix, les
 * réductions et les services de coopération commerciale ; elle est conclue au plus tard le 1er mars.
 */
export const DATE_LIMITE_DE_LA_CONVENTION = "1er mars";
