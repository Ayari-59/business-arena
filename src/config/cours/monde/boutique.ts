import type {
  CodeDeClientele,
  CodeDeFournisseur,
  CodeDeReference,
  CodeDIndicateurDuManager,
  FicheDeLaBoutique,
  JourDOuverture,
  ReferenceDeLaBoutique,
  SeuilDAlerte,
} from "./maille-et-co";

/**
 * LE MODÈLE DU POINT DE VENTE DU COURS : la boutique MAILLE & CO, un mois puis un trimestre.
 *
 * Tout se calcule sur la fiche (monde/maille-et-co.ts), en fonctions pures : la même fiche et les
 * mêmes leviers donnent toujours les mêmes chiffres. Chaque fonction qu'un laboratoire lira prend
 * ses leviers en paramètres, avec la fiche pour valeur de départ.
 *
 *   1. LES PRIX ET LES MARGES : marge commerciale (prix HT − prix d'achat HT), taux de marque (sur
 *      le prix de vente), taux de marge (sur le prix d'achat), coefficients HT et TTC (prix ÷ prix
 *      d'achat HT), le passage d'un taux à l'autre, le prix qui garde un taux de marque.
 *   2. LES INDICATEURS DU POINT DE VENTE : trafic (entrées), passages en caisse, taux de
 *      transformation (passages ÷ entrées), indice de vente (articles ÷ passages), panier moyen
 *      (chiffre d'affaires ÷ passages), prix moyen d'un article, chiffre d'affaires au m², taux de
 *      service (ventes ÷ demande) et ventes manquées. Le chiffre d'affaires est toujours trafic ×
 *      transformation × indice de vente × prix moyen d'un article.
 *   3. LA DEMANDE, LES VENTES, LA PROMOTION : demande = demande du mois × (1 + élasticité au prix ×
 *      écart de prix relatif + élasticité à la remise × remise), à l'unité inférieure ; ventes =
 *      la plus petite de la demande et du stock en rayon ; la marge de la promotion, et le volume
 *      nécessaire pour garder la marge sans promotion (à l'unité supérieure).
 *   4. LE STOCK : stock moyen ((initial + final) ÷ 2, en valeur), coût d'achat des marchandises
 *      vendues, rotation, durée de stockage, couverture, stock de sécurité, point de commande, et
 *      un réassort jour par jour pour voir la rupture.
 *   5. LA PRÉVISION : la droite des moindres carrés (elle passe par le point moyen), les moyennes
 *      mobiles centrées sur quatre trimestres, les coefficients saisonniers (moyenne des rapports à
 *      la tendance, corrigés pour que leur somme fasse 4), la prévision de l'année N.
 *   6. LE BUDGET DU TRIMESTRE : ventes HT et TTC, quantités à acheter (ventes + stock final −
 *      stock initial), achats, marge commerciale, ce que les achats font sortir de la caisse dans
 *      le trimestre.
 *   7. LE SEUIL DE RENTABILITÉ DU POINT DE VENTE : marge sur coût variable, seuil, marge et indice
 *      de sécurité, point mort, jours de fermeture, panier plancher.
 *   8. L'ÉQUIPE ET LE PLANNING : heures du mois, coût, taux horaire chargé, part du personnel ;
 *      vendeurs nécessaires créneau par créneau selon l'affluence ; un planning face au besoin.
 *   9. L'ASSORTIMENT : la marge de chaque référence, ses parts, sa famille (locomotive, produit de
 *      volume, produit de marge, à revoir) sur les moyennes pondérées, et le retrait d'une référence.
 *  10. LE TABLEAU DE BORD DU MANAGER : les indicateurs du mois, comparés à N − 1 et à l'objectif,
 *      et leurs voyants.
 *
 * CONVENTIONS : les montants sont au centime ; les taux, les coefficients et les moyennes ne sont
 * pas arrondis (c'est l'affichage qui arrondit). Un résultat négatif est une perte.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const plancher = (x: number) => Math.floor(x + 1e-9);
/** Au centime supérieur : une marge à garder ne s'arrondit jamais vers le bas. */
const auCentimeSuperieur = (x: number) => plafond(x * 100) / 100 + 0;
/** À l'unité la plus proche, sans qu'un produit comme 150 × 0,57 (85,4999…) ne perde la moitié. */
const aLUnite = (x: number) => Math.round(x + 1e-9);

export const referenceDe = (f: FicheDeLaBoutique, code: CodeDeReference): ReferenceDeLaBoutique => {
  const r = f.gamme.find((x) => x.code === code);
  if (!r) throw new Error(`Pas de référence ${code}`);
  return r;
};

export const fournisseurDe = (f: FicheDeLaBoutique, code: CodeDeFournisseur) => {
  const fo = f.fournisseurs.find((x) => x.code === code);
  if (!fo) throw new Error(`Pas de fournisseur ${code}`);
  return fo;
};

/** Le coût variable d'un article : le prix d'achat et les autres coûts variables. */
export const coutVariable = (r: ReferenceDeLaBoutique, coutDAchat = r.coutDAchat) => auCentime(coutDAchat + r.autresCoutsVariables);

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES PRIX ET LES MARGES
// ═════════════════════════════════════════════════════════════════════════════

export const prixTtcDuHt = (prixHt: number, tauxTva: number) => auCentime(prixHt * (1 + tauxTva));
export const prixHtDuTtc = (prixTtc: number, tauxTva: number) => auCentime(prixTtc / (1 + tauxTva));

/** Taux de marge = taux de marque ÷ (1 − taux de marque) ; et l'inverse. */
export const tauxDeMargeDuTauxDeMarque = (tauxDeMarque: number) => tauxDeMarque / (1 - tauxDeMarque);
export const tauxDeMarqueDuTauxDeMarge = (tauxDeMarge: number) => tauxDeMarge / (1 + tauxDeMarge);

/** Le prix de vente HT qui garde un taux de marque, pour un prix d'achat : prix d'achat ÷ (1 − taux). */
export const prixQuiGardeLeTauxDeMarque = (coutDAchat: number, tauxDeMarque: number) => auCentime(coutDAchat / (1 - tauxDeMarque));

/** Le prix d'achat le plus haut qui garde un taux de marque, à un prix de vente HT : prix × (1 − taux). */
export const coutQuiGardeLeTauxDeMarque = (prixHt: number, tauxDeMarque: number) => auCentime(prixHt * (1 - tauxDeMarque));

/** La marge commerciale d'un article et ses trois façons de la dire. */
export function margeDeLArticle(p: { prixHt: number; coutDAchat: number; tauxTva: number }) {
  const margeCommerciale = auCentime(p.prixHt - p.coutDAchat);
  const prixTtc = prixTtcDuHt(p.prixHt, p.tauxTva);
  return {
    ...p,
    prixTtc,
    margeCommerciale,
    tauxDeMarque: margeCommerciale / p.prixHt,
    tauxDeMarge: margeCommerciale / p.coutDAchat,
    coefficientHt: p.prixHt / p.coutDAchat,
    coefficientTtc: prixTtc / p.coutDAchat,
  };
}

/** Le prix d'achat d'une référence chez un fournisseur : le coût de référence × son multiplicateur. */
export const prixDAchatChez = (f: FicheDeLaBoutique, code: CodeDeReference, fournisseur: CodeDeFournisseur) =>
  auCentime(referenceDe(f, code).coutDAchat * fournisseurDe(f, fournisseur).multiplicateur);

/** Les leviers du laboratoire des marges : le prix de vente HT et le prix d'achat d'une référence. */
export interface LeviersDeLaMarge {
  reference: CodeDeReference;
  prixHt: number;
  coutDAchat: number;
}

/**
 * La marge commerciale du mois d'une référence, à un prix et un prix d'achat donnés : la demande
 * répond au prix (élasticité au prix), le stock disponible du mois borne les ventes.
 */
export function margeDuMois(f: FicheDeLaBoutique, leviers: Partial<LeviersDeLaMarge> = {}) {
  const r = referenceDe(f, leviers.reference ?? "col-rond");
  const prixHt = leviers.prixHt ?? r.prixHt;
  const coutDAchat = leviers.coutDAchat ?? r.coutDAchat;
  const m = moisDeLaReference(f, r.code, { prixHt });
  const article = margeDeLArticle({ prixHt, coutDAchat, tauxTva: r.tauxTva });
  return { ...article, reference: r.code, demande: m.demande, ventes: m.ventes, margeDuMois: auCentime(m.ventes * article.margeCommerciale) };
}

/** Les marges de la gamme au mois de référence : chaque référence, et le taux de marque moyen. */
export function margesDeLaGamme(f: FicheDeLaBoutique) {
  const references = f.gamme.map((r) => {
    const a = margeDeLArticle(r);
    return { ...a, code: r.code, nom: r.nom, ventes: r.ventesDuMois, chiffreDAffaires: auCentime(r.ventesDuMois * r.prixHt), achatsVendus: auCentime(r.ventesDuMois * r.coutDAchat) };
  });
  const chiffreDAffaires = auCentime(somme(references.map((x) => x.chiffreDAffaires)));
  const achatsVendus = auCentime(somme(references.map((x) => x.achatsVendus)));
  const margeCommerciale = auCentime(chiffreDAffaires - achatsVendus);
  return { references, chiffreDAffaires, achatsVendus, margeCommerciale, tauxDeMarque: margeCommerciale / chiffreDAffaires, tauxDeMarge: margeCommerciale / achatsVendus };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LES INDICATEURS DU POINT DE VENTE
// ═════════════════════════════════════════════════════════════════════════════

/** Les chiffres d'une clientèle (ou du mois) et ses ratios. */
function ratios(entrees: number, tickets: number, articles: number, chiffreDAffaires: number) {
  return {
    entrees,
    tickets,
    articles,
    chiffreDAffaires,
    tauxDeTransformation: tickets / entrees,
    indiceDeVente: articles / tickets,
    panierMoyen: chiffreDAffaires / tickets,
    prixMoyenDeLArticle: chiffreDAffaires / articles,
  };
}

/** Les indicateurs du mois de référence, clientèle par clientèle, puis pour la boutique. */
export function indicateursDuMois(f: FicheDeLaBoutique) {
  const prix = (code: CodeDeReference) => referenceDe(f, code).prixHt;
  const clienteles = f.clienteles.map((c) => {
    const lignes = Object.entries(c.achats) as [CodeDeReference, number][];
    const articles = somme(lignes.map(([, q]) => q));
    const chiffreDAffaires = auCentime(somme(lignes.map(([code, q]) => q * prix(code))));
    return { code: c.code as CodeDeClientele, nom: c.nom, delaiDeReglement: c.delaiDeReglement, ...ratios(c.entrees, c.tickets, articles, chiffreDAffaires) };
  });
  const total = ratios(
    somme(clienteles.map((c) => c.entrees)),
    somme(clienteles.map((c) => c.tickets)),
    somme(clienteles.map((c) => c.articles)),
    auCentime(somme(clienteles.map((c) => c.chiffreDAffaires))),
  );
  const references = f.gamme.map((r) => ({
    code: r.code,
    nom: r.nom,
    demande: r.demandeDuMois,
    ventes: r.ventesDuMois,
    ventesManquees: r.demandeDuMois - r.ventesDuMois,
    chiffreDAffaires: auCentime(r.ventesDuMois * r.prixHt),
    chiffreDAffairesManque: auCentime((r.demandeDuMois - r.ventesDuMois) * r.prixHt),
  }));
  const demande = somme(references.map((r) => r.demande));
  const ventesManquees = somme(references.map((r) => r.ventesManquees));
  return {
    clienteles,
    ...total,
    /** Le chiffre d'affaires du mois pour un mètre carré de surface de vente. */
    chiffreDAffairesAuM2: total.chiffreDAffaires / f.surfaceDeVente,
    references,
    demande,
    ventesManquees,
    chiffreDAffairesManque: auCentime(somme(references.map((r) => r.chiffreDAffairesManque))),
    /** La part de la demande servie : à ne pas confondre avec le taux de transformation. */
    tauxDeService: total.articles / demande,
  };
}

/** Les quatre leviers du chiffre d'affaires d'une boutique. */
export interface LeviersDesIndicateurs {
  trafic: number;
  tauxDeTransformation: number;
  indiceDeVente: number;
  prixMoyenDeLArticle: number;
}

/** Les leviers du mois de référence. */
export function leviersDuMois(f: FicheDeLaBoutique): LeviersDesIndicateurs {
  const m = indicateursDuMois(f);
  return { trafic: m.entrees, tauxDeTransformation: m.tauxDeTransformation, indiceDeVente: m.indiceDeVente, prixMoyenDeLArticle: m.prixMoyenDeLArticle };
}

/**
 * Le chiffre d'affaires par ses indicateurs : trafic × taux de transformation × indice de vente ×
 * prix moyen d'un article. Avec les leviers du mois, il retombe sur le chiffre d'affaires du mois.
 */
export function chiffreDAffairesParLesIndicateurs(f: FicheDeLaBoutique, leviers: Partial<LeviersDesIndicateurs> = {}) {
  const l = { ...leviersDuMois(f), ...leviers };
  const tickets = l.trafic * l.tauxDeTransformation;
  const articles = tickets * l.indiceDeVente;
  const panierMoyen = l.indiceDeVente * l.prixMoyenDeLArticle;
  return { ...l, tickets, articles, panierMoyen, chiffreDAffaires: auCentime(tickets * panierMoyen) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA DEMANDE, LES VENTES, LA PROMOTION
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers d'une référence pour un mois : le prix de l'étiquette (HT), la remise, le stock en rayon. */
export interface LeviersDeLaReference {
  prixHt: number;
  remise: number;
  stockEnRayon: number;
}

/**
 * La demande du mois d'une référence : la demande au prix de l'étiquette × (1 + élasticité au prix
 * × (prix − étiquette) ÷ étiquette + élasticité à la remise × remise), à l'unité inférieure,
 * jamais négative. C'est une droite en prix comme en remise.
 */
export function demandeDeLaReference(f: FicheDeLaBoutique, code: CodeDeReference, leviers: Partial<Pick<LeviersDeLaReference, "prixHt" | "remise">> = {}) {
  const r = referenceDe(f, code);
  const prixHt = leviers.prixHt ?? r.prixHt;
  const remise = leviers.remise ?? 0;
  const facteur = 1 + f.elasticiteAuPrix * ((prixHt - r.prixHt) / r.prixHt) + f.elasticiteALaRemise * remise;
  return Math.max(0, plancher(r.demandeDuMois * facteur));
}

/** Le stock disponible d'une référence en janvier : le stock du 1er janvier et les livraisons du mois. */
export const stockDisponible = (r: ReferenceDeLaBoutique) => r.stockInitial + somme(r.livraisons.map((l) => l.quantite));

/**
 * Le mois d'une référence : ventes = la plus petite de la demande et du stock en rayon (borné par la
 * capacité du rayon) ; ce qui n'est pas servi est une vente manquée. Les marges sont celles des
 * ventes au prix payé (l'étiquette moins la remise).
 */
export function moisDeLaReference(f: FicheDeLaBoutique, code: CodeDeReference, leviers: Partial<LeviersDeLaReference> = {}) {
  const r = referenceDe(f, code);
  const prixHt = leviers.prixHt ?? r.prixHt;
  const remise = leviers.remise ?? 0;
  const stockEnRayon = Math.min(r.capaciteDuRayon, Math.max(0, leviers.stockEnRayon ?? stockDisponible(r)));
  const prixPaye = auCentime(prixHt * (1 - remise));
  const demande = demandeDeLaReference(f, code, { prixHt, remise });
  const ventes = Math.min(demande, stockEnRayon);
  const cv = coutVariable(r);
  return {
    code,
    prixHt,
    remise,
    prixPaye,
    stockEnRayon,
    demande,
    ventes,
    ventesManquees: demande - ventes,
    chiffreDAffaires: auCentime(ventes * prixPaye),
    margeCommercialeUnitaire: auCentime(prixPaye - r.coutDAchat),
    margeUnitaire: auCentime(prixPaye - cv),
    margeCommerciale: auCentime(ventes * (prixPaye - r.coutDAchat)),
    marge: auCentime(ventes * (prixPaye - cv)),
  };
}

/** Les leviers de la promotion : la référence, la remise, le stock en rayon du mois. */
export interface LeviersDeLaPromotion {
  reference: CodeDeReference;
  remise: number;
  stockEnRayon: number;
}

/**
 * La promotion : le mois sans remise et le mois avec, au même stock en rayon. Le volume nécessaire
 * est celui qui, à la marge unitaire en promotion, rend la marge sur coût variable sans promotion
 * (à l'unité supérieure). La promotion paie si les ventes l'atteignent : il faut que la demande
 * suive (la remise attire), ET que l'offre suive (le stock la sert).
 */
export function promotion(f: FicheDeLaBoutique, leviers: Partial<LeviersDeLaPromotion> = {}) {
  const l = { ...f.promotion, ...leviers };
  const sans = moisDeLaReference(f, l.reference, { stockEnRayon: l.stockEnRayon });
  const avec = moisDeLaReference(f, l.reference, { remise: l.remise, stockEnRayon: l.stockEnRayon });
  const volumeNecessaire = avec.margeUnitaire > 0 ? plafond(sans.marge / avec.margeUnitaire) : null;
  return {
    ...l,
    sans,
    avec,
    baisseDeLaMargeUnitaire: (sans.margeUnitaire - avec.margeUnitaire) / sans.margeUnitaire,
    volumeNecessaire,
    hausseNecessaire: volumeNecessaire === null ? null : volumeNecessaire / sans.ventes - 1,
    gain: auCentime(avec.marge - sans.marge),
    laDemandeSuit: volumeNecessaire !== null && avec.demande >= volumeNecessaire,
    lOffreSuit: avec.ventes === avec.demande,
  };
}

/**
 * La remise la plus forte qui garde la marge sans promotion, pour un volume attendu : la marge
 * unitaire à garder (marge sans promotion ÷ volume attendu), le prix plancher (coût variable +
 * cette marge) et la remise sur l'étiquette.
 */
export function remiseMaximale(f: FicheDeLaBoutique, code: CodeDeReference, hausseAttendue: number) {
  const r = referenceDe(f, code);
  const sans = moisDeLaReference(f, code);
  const volumeAttendu = Math.round(sans.ventes * (1 + hausseAttendue));
  const margeUnitaireAGarder = auCentimeSuperieur(sans.marge / volumeAttendu);
  const prixPlancher = auCentime(coutVariable(r) + margeUnitaireAGarder);
  return { margeSansPromotion: sans.marge, volumeAttendu, margeUnitaireAGarder, prixPlancher, remise: 1 - prixPlancher / r.prixHt };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE STOCK
// ═════════════════════════════════════════════════════════════════════════════

/** Le stock de sécurité : les ventes d'un jour × le délai de sécurité, à l'unité supérieure. */
export const stockDeSecurite = (ventesParJour: number, delaiDeSecurite: number) => plafond(ventesParJour * delaiDeSecurite);

/** Le point de commande (stock d'alerte) : les ventes pendant le délai de livraison, plus le stock de sécurité. */
export const pointDeCommande = (ventesParJour: number, delaiDeLivraison: number, securite: number) => plafond(ventesParJour * delaiDeLivraison) + securite;

/**
 * Le stock du mois de référence, référence par référence (au prix d'achat de la gamme, qui ne
 * change pas dans le mois) puis en valeur : stock moyen = (initial + final) ÷ 2 ; coût d'achat des
 * marchandises vendues = initial + achats − final ; rotation = ce coût ÷ stock moyen ; durée de
 * stockage = jours du mois ÷ rotation ; couverture du stock final = final ÷ ventes par jour. Le
 * stock de sécurité et le point de commande se lisent chez le fournisseur donné.
 */
export function stockDuMois(f: FicheDeLaBoutique, fournisseur: CodeDeFournisseur = "faconnier") {
  const fo = fournisseurDe(f, fournisseur);
  const references = f.gamme.map((r) => {
    const livre = somme(r.livraisons.map((l) => l.quantite));
    const final = r.stockInitial + livre - r.ventesDuMois;
    const ventesParJour = r.ventesDuMois / f.joursDuMois;
    const securite = stockDeSecurite(ventesParJour, f.delaiDeSecurite);
    return {
      code: r.code,
      nom: r.nom,
      initial: r.stockInitial,
      livre,
      disponible: r.stockInitial + livre,
      vendu: r.ventesDuMois,
      final,
      valeurInitiale: auCentime(r.stockInitial * r.coutDAchat),
      achats: auCentime(livre * r.coutDAchat),
      valeurFinale: auCentime(final * r.coutDAchat),
      ventesParJour,
      couverture: final / ventesParJour,
      stockDeSecurite: securite,
      pointDeCommande: pointDeCommande(ventesParJour, fo.delaiDeLivraison, securite),
    };
  });
  const valeurInitiale = auCentime(somme(references.map((r) => r.valeurInitiale)));
  const achats = auCentime(somme(references.map((r) => r.achats)));
  const valeurFinale = auCentime(somme(references.map((r) => r.valeurFinale)));
  const stockMoyen = auCentime((valeurInitiale + valeurFinale) / 2);
  const coutDAchatDesVendues = auCentime(valeurInitiale + achats - valeurFinale);
  const rotation = coutDAchatDesVendues / stockMoyen;
  const dureeDeStockage = f.joursDuMois / rotation;
  const vendus = somme(references.map((r) => r.vendu));
  const final = somme(references.map((r) => r.final));
  return {
    references,
    initial: somme(references.map((r) => r.initial)),
    livre: somme(references.map((r) => r.livre)),
    vendus,
    final,
    valeurInitiale,
    achats,
    valeurFinale,
    stockMoyen,
    coutDAchatDesVendues,
    rotation,
    dureeDeStockage,
    ventesParJour: vendus / f.joursDuMois,
    couverture: final / (vendus / f.joursDuMois),
    delaiDePaiement: fo.delaiDePaiement,
    /** Les jours où le fournisseur finance l'article déjà vendu (négatif : le magasin le finance). */
    joursFinancesParLeFournisseur: fo.delaiDePaiement - dureeDeStockage,
  };
}

/** Les leviers du réassort d'une référence, jour par jour. */
export interface LeviersDuReassort {
  demandeParJour: number;
  stockInitial: number;
  pointDeCommande: number;
  quantiteCommandee: number;
  delaiDeLivraison: number;
  /** Le retard de la livraison sur le délai annoncé, en jours. */
  retard: number;
  jours: number;
}

/**
 * Les leviers d'une référence chez le façonnier de référence, au rythme de janvier, sur un
 * trimestre : le stock de départ est le stock disponible de janvier (le stock du 1er janvier et
 * la livraison du mois), la quantité commandée un mois de ventes (au moins le minimum du façonnier).
 */
export function leviersDuReassort(f: FicheDeLaBoutique, code: CodeDeReference = "col-rond"): LeviersDuReassort {
  const s = stockDuMois(f).references.find((r) => r.code === code)!;
  return {
    demandeParJour: s.ventesParJour,
    stockInitial: s.disponible,
    pointDeCommande: s.pointDeCommande,
    quantiteCommandee: Math.max(s.vendu, fournisseurDe(f, "faconnier").minimumDeCommande),
    delaiDeLivraison: fournisseurDe(f, "faconnier").delaiDeLivraison,
    retard: 0,
    jours: 3 * f.joursDuMois,
  };
}

/**
 * LE RÉASSORT JOUR PAR JOUR. Chaque matin, la livraison attendue ce jour-là arrive ; la boutique
 * vend la demande du jour dans la limite de son stock (le reste est une vente manquée) ; le soir,
 * si le stock et la commande en cours ne dépassent pas le point de commande et qu'aucune commande
 * n'est en route, elle commande la quantité dite, livrée après le délai et le retard.
 */
export function simulerLeReassort(l: LeviersDuReassort) {
  let stock = l.stockInitial;
  let enCours: { arrivee: number; quantite: number } | null = null;
  const jours: { jour: number; livre: number; vendu: number; manque: number; stockDuSoir: number; commande: boolean }[] = [];
  for (let jour = 1; jour <= l.jours; jour++) {
    let livre = 0;
    if (enCours && enCours.arrivee === jour) {
      livre = enCours.quantite;
      stock += livre;
      enCours = null;
    }
    const vendu = Math.min(stock, l.demandeParJour);
    stock -= vendu;
    let commande = false;
    if (!enCours && stock <= l.pointDeCommande) {
      enCours = { arrivee: jour + l.delaiDeLivraison + l.retard + 1, quantite: l.quantiteCommandee };
      commande = true;
    }
    jours.push({ jour, livre, vendu, manque: l.demandeParJour - vendu, stockDuSoir: stock, commande });
  }
  return {
    jours,
    ventes: somme(jours.map((j) => j.vendu)),
    ventesManquees: somme(jours.map((j) => j.manque)),
    joursDeRupture: jours.filter((j) => j.manque > 0).length,
    commandes: jours.filter((j) => j.commande).length,
    stockMoyen: somme(jours.map((j) => j.stockDuSoir)) / l.jours,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LA PRÉVISION DES VENTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * La droite des moindres carrés y = a x + b : a = Σ (x − x̄)(y − ȳ) ÷ Σ (x − x̄)², b = ȳ − a x̄. Elle
 * passe toujours par le point moyen (x̄, ȳ).
 */
export function moindresCarres(points: readonly { x: number; y: number }[]) {
  const n = points.length;
  const xMoyen = somme(points.map((p) => p.x)) / n;
  const yMoyen = somme(points.map((p) => p.y)) / n;
  const a = somme(points.map((p) => (p.x - xMoyen) * (p.y - yMoyen))) / somme(points.map((p) => (p.x - xMoyen) ** 2));
  return { n, xMoyen, yMoyen, a, b: yMoyen - a * xMoyen, en: (x: number) => yMoyen + a * (x - xMoyen) };
}

/**
 * Les moyennes mobiles centrées sur quatre trimestres : (y(t−2) ÷ 2 + y(t−1) + y(t) + y(t+1) +
 * y(t+2) ÷ 2) ÷ 4. Elles effacent la saison ; les deux premiers et les deux derniers trimestres
 * n'en ont pas (null).
 */
export function moyennesMobilesCentrees(serie: readonly number[]): (number | null)[] {
  return serie.map((_, i) => (i < 2 || i > serie.length - 3 ? null : (serie[i - 2]! / 2 + serie[i - 1]! + serie[i]! + serie[i + 1]! + serie[i + 2]! / 2) / 4));
}

/**
 * La méthode de la tendance : les moindres carrés sur les moyennes mobiles centrées (la méthode
 * retenue : la saison n'y pèse plus), ou sur les douze trimestres bruts (la méthode qu'il faut
 * critiquer : le trimestre 4 tombe toujours en fin d'année, et tire la pente vers le haut).
 */
export type MethodeDeTendance = "moyennes-mobiles" | "trimestres-bruts";

/**
 * La prévision de l'année N. Le rang t des trimestres va de 1 (trimestre 1 de N − 3) à 12, puis de
 * 13 à 16 pour l'année N. Le coefficient saisonnier d'un trimestre est la moyenne de ses rapports
 * demande ÷ tendance ; on le corrige en le multipliant par 4 ÷ (somme des quatre), pour que la
 * saison se compense sur l'année. La prévision est la tendance × le coefficient corrigé.
 */
export function prevoirLesVentes(f: FicheDeLaBoutique, methode: MethodeDeTendance = "moyennes-mobiles") {
  const demande = f.historique.map((h) => h.demande);
  const mmc = moyennesMobilesCentrees(demande);
  const points =
    methode === "trimestres-bruts"
      ? demande.map((y, i) => ({ x: i + 1, y }))
      : mmc.flatMap((y, i) => (y === null ? [] : [{ x: i + 1, y }]));
  const droite = moindresCarres(points);
  const serie = f.historique.map((h, i) => {
    const tendance = droite.en(i + 1);
    return { ...h, rang: i + 1, moyenneMobile: mmc[i]!, tendance, rapport: h.demande / tendance };
  });
  const coefficientsBruts = [1, 2, 3, 4].map((q) => {
    const rapports = serie.filter((s) => s.trimestre === q).map((s) => s.rapport);
    return somme(rapports) / rapports.length;
  });
  const sommeBrute = somme(coefficientsBruts);
  const coefficients = coefficientsBruts.map((c) => (c * 4) / sommeBrute);
  const previsions = [13, 14, 15, 16].map((rang, k) => {
    const tendance = droite.en(rang);
    return { rang, trimestre: k + 1, tendance, coefficient: coefficients[k]!, prevision: tendance * coefficients[k]! };
  });
  return {
    methode,
    serie,
    droite: { a: droite.a, b: droite.b, xMoyen: droite.xMoyen, yMoyen: droite.yMoyen, n: droite.n },
    coefficientsBruts,
    sommeBrute,
    coefficients,
    previsions,
    totalPrevu: somme(previsions.map((p) => p.prevision)),
  };
}

/**
 * La tendance annuelle : les moindres carrés sur les trois totaux annuels (x = 1, 2, 3), prolongés
 * à x = 4 ; et les coefficients saisonniers par la part de l'année (demande du trimestre ÷ moyenne
 * trimestrielle de son année), en moyenne sur les trois années.
 */
export function tendanceAnnuelle(f: FicheDeLaBoutique) {
  const annees = ["N-3", "N-2", "N-1"] as const;
  const totaux = annees.map((a) => somme(f.historique.filter((h) => h.annee === a).map((h) => h.demande)));
  const droite = moindresCarres(totaux.map((y, i) => ({ x: i + 1, y })));
  const anneeN = droite.en(4);
  const coefficients = [1, 2, 3, 4].map((q) => somme(annees.map((a, i) => f.historique.find((h) => h.annee === a && h.trimestre === q)!.demande / (totaux[i]! / 4))) / 3);
  return { totaux, droite: { a: droite.a, b: droite.b, xMoyen: droite.xMoyen, yMoyen: droite.yMoyen }, anneeN, coefficients, previsions: coefficients.map((c) => (anneeN / 4) * c) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LE BUDGET DU POINT DE VENTE
// ═════════════════════════════════════════════════════════════════════════════

/** Les leviers du budget : les ventes prévues et le stock final voulu de chaque référence, le fournisseur. */
export interface LeviersDuBudget {
  ventesPrevues: Partial<Record<CodeDeReference, number>>;
  stockFinalVoulu: Partial<Record<CodeDeReference, number>>;
  fournisseur: CodeDeFournisseur;
}

/**
 * Le budget du trimestre 1 de N : quantités à acheter = ventes prévues + stock final voulu − stock
 * initial (jamais négatives) ; achats au prix du fournisseur ; marge commerciale = ventes HT −
 * coût d'achat des marchandises vendues (stock initial + achats − stock final, en valeur). Les
 * achats se font régulièrement sur le trimestre : la part payée dans le trimestre est 1 − délai ÷
 * jours (jamais négative), le reste est dû au fournisseur à la fin.
 */
export function budgetDuTrimestre(f: FicheDeLaBoutique, leviers: Partial<LeviersDuBudget> = {}) {
  const b = f.budget;
  const fournisseur = leviers.fournisseur ?? b.fournisseur;
  const fo = fournisseurDe(f, fournisseur);
  const references = f.gamme.map((r) => {
    const ventes = leviers.ventesPrevues?.[r.code] ?? b.ventesPrevues[r.code];
    const stockFinal = leviers.stockFinalVoulu?.[r.code] ?? b.stockFinalVoulu[r.code];
    const achats = Math.max(0, ventes + stockFinal - r.stockInitial);
    const coutDAchat = prixDAchatChez(f, r.code, fournisseur);
    // Le stock du 1er janvier a été acheté au prix du façonnier de référence.
    const valeurInitiale = auCentime(r.stockInitial * r.coutDAchat);
    const achatsHt = auCentime(achats * coutDAchat);
    const disponible = r.stockInitial + achats;
    const coutMoyen = disponible > 0 ? (valeurInitiale + achatsHt) / disponible : r.coutDAchat;
    const valeurFinale = auCentime((r.stockInitial + achats - ventes) * coutMoyen);
    return {
      code: r.code,
      nom: r.nom,
      ventes,
      prixHt: r.prixHt,
      ventesHt: auCentime(ventes * r.prixHt),
      stockInitial: r.stockInitial,
      stockFinal: r.stockInitial + achats - ventes,
      achats,
      coutDAchat,
      achatsHt,
      valeurInitiale,
      valeurFinale,
      coutDAchatDesVendues: auCentime(valeurInitiale + achatsHt - valeurFinale),
    };
  });
  const s = (g: (r: (typeof references)[number]) => number) => auCentime(somme(references.map(g)));
  const ventesHt = s((r) => r.ventesHt);
  const achatsHt = s((r) => r.achatsHt);
  const coutDAchatDesVendues = s((r) => r.coutDAchatDesVendues);
  const tauxTva = f.gamme[0]!.tauxTva;
  const achatsTtc = auCentime(achatsHt * (1 + tauxTva));
  const partPayee = Math.max(0, 1 - fo.delaiDePaiement / b.jours);
  const decaisse = auCentime(achatsTtc * partPayee);
  return {
    fournisseur,
    references,
    ventes: somme(references.map((r) => r.ventes)),
    achats: somme(references.map((r) => r.achats)),
    ventesHt,
    ventesTtc: auCentime(ventesHt * (1 + tauxTva)),
    achatsHt,
    achatsTtc,
    coutDAchatDesVendues,
    margeCommerciale: auCentime(ventesHt - coutDAchatDesVendues),
    partPayee,
    decaisse,
    detteFournisseur: auCentime(achatsTtc - decaisse),
    /** L'objectif de chiffre d'affaires d'un mois : le tiers du trimestre. */
    objectifDuMois: auCentime(ventesHt / 3),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. LE SEUIL DE RENTABILITÉ DU POINT DE VENTE
// ═════════════════════════════════════════════════════════════════════════════

/** Les charges fixes du mois : le personnel (l'équipe) et les charges du point de vente. */
export function chargesFixesDuMois(f: FicheDeLaBoutique) {
  const personnel = equipeDuMois(f).cout;
  const c = f.charges;
  return { ...c, personnel, total: auCentime(c.loyer + personnel + c.publicite + c.entretien + c.amortissement) };
}

/** Les leviers du seuil : les jours de fermeture du mois, le panier moyen, les passages en caisse, les charges fixes. */
export interface LeviersDuSeuil {
  joursDeFermeture: number;
  panierMoyen: number;
  tickets: number;
  chargesFixes: number;
}

/**
 * Le seuil du mois. Le taux de marge sur coût variable est celui du mois de référence (la
 * composition des ventes ne change pas) ; le chiffre d'affaires vaut passages × panier, réduit
 * des jours de fermeture (ventes régulières sur le mois). Le seuil en valeur = charges fixes ÷
 * taux de marge ; le point mort est le jour où les ventes cumulées l'atteignent, fermeture du
 * début du mois comprise (null s'il n'est pas atteint).
 */
export function seuilDuPointDeVente(f: FicheDeLaBoutique, leviers: Partial<LeviersDuSeuil> = {}) {
  const m = indicateursDuMois(f);
  const coutsVariablesDuMois = auCentime(somme(f.gamme.map((r) => r.ventesDuMois * coutVariable(r))));
  const tauxDeMarge = (m.chiffreDAffaires - coutsVariablesDuMois) / m.chiffreDAffaires;
  const jours = f.joursDuMois;
  const fermeture = leviers.joursDeFermeture ?? 0;
  const tickets = leviers.tickets ?? m.tickets;
  const panierMoyen = leviers.panierMoyen ?? m.panierMoyen;
  const chargesFixes = leviers.chargesFixes ?? chargesFixesDuMois(f).total;
  const chiffreDAffairesDUnMoisPlein = tickets * panierMoyen;
  const chiffreDAffaires = auCentime((chiffreDAffairesDUnMoisPlein * (jours - fermeture)) / jours);
  const marge = auCentime(chiffreDAffaires * tauxDeMarge);
  const seuil = auCentime(chargesFixes / tauxDeMarge);
  const margeDeSecurite = auCentime(chiffreDAffaires - seuil);
  const joursDeVenteAuSeuil = plafond((seuil / chiffreDAffairesDUnMoisPlein) * jours);
  return {
    tickets,
    panierMoyen,
    joursDeFermeture: fermeture,
    chiffreDAffaires,
    coutsVariables: auCentime(chiffreDAffaires - marge),
    marge,
    tauxDeMarge,
    chargesFixes,
    resultat: auCentime(marge - chargesFixes),
    seuil,
    margeDeSecurite,
    indiceDeSecurite: margeDeSecurite / chiffreDAffaires,
    pointMort: fermeture + joursDeVenteAuSeuil <= jours ? fermeture + joursDeVenteAuSeuil : null,
    /** Les passages en caisse qu'il faut au panier moyen pour atteindre le seuil. */
    ticketsAuSeuil: plafond(seuil / panierMoyen),
    /** Le plus petit panier qui ne fait pas perdre d'argent, aux passages en caisse et aux jours ouverts. */
    panierPlancher: (chargesFixes / tauxDeMarge / tickets) * (jours / (jours - fermeture)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. L'ÉQUIPE ET LE PLANNING
// ═════════════════════════════════════════════════════════════════════════════

/** Les heures du mois d'un contrat : les heures de la semaine × 52 ÷ 12, au centième. */
export const heuresDuMois = (f: FicheDeLaBoutique, heuresParSemaine: number) => auCentime(heuresParSemaine * f.semainesParMois);

/** L'équipe du mois : heures, coût (brut + cotisations patronales), taux horaire chargé, et ce qu'elle fait vendre. */
export function equipeDuMois(f: FicheDeLaBoutique) {
  const salaries = f.equipe.map((s) => {
    const heures = heuresDuMois(f, s.heuresParSemaine);
    const cout = auCentime(s.brutMensuel * (1 + f.tauxPatronal));
    return { ...s, heuresDuMois: heures, cout, tauxHoraireCharge: cout / heures };
  });
  const heuresParSemaine = somme(salaries.map((s) => s.heuresParSemaine));
  const heures = auCentime(somme(salaries.map((s) => s.heuresDuMois)));
  const brut = auCentime(somme(salaries.map((s) => s.brutMensuel)));
  const cout = auCentime(somme(salaries.map((s) => s.cout)));
  const chiffreDAffaires = margesDeLaGamme(f).chiffreDAffaires;
  return {
    salaries,
    effectif: salaries.length,
    heuresParSemaine,
    heuresDuMois: heures,
    brut,
    cout,
    tauxHoraireCharge: cout / heures,
    chiffreDAffaires,
    partDuPersonnel: cout / chiffreDAffaires,
    chiffreDAffairesParHeure: chiffreDAffaires / heures,
    chiffreDAffairesParSalarie: chiffreDAffaires / salaries.length,
  };
}

/** Les leviers du planning : la règle d'encadrement, les tâches hors vente, une affluence plus ou moins forte. */
export interface LeviersDuPlanning {
  entreesParVendeur: number;
  presenceMinimale: number;
  tachesHorsVente: number;
  /** Le multiplicateur de l'affluence de la semaine type (1 : janvier). */
  affluence: number;
  /** Le taux horaire chargé d'une heure de travail (par défaut, celui de l'équipe). */
  tauxHoraire: number;
}

/**
 * Les heures nécessaires selon l'affluence : sur chaque créneau, le plus grand de la présence
 * minimale et des entrées ÷ entrées par vendeur, à l'unité supérieure ; plus les tâches hors
 * vente. La semaine × 52 ÷ 12 donne le mois, et son coût au taux horaire chargé.
 */
export function heuresNecessaires(f: FicheDeLaBoutique, leviers: Partial<LeviersDuPlanning> = {}) {
  const r = f.reglesDuPlanning;
  const l = {
    entreesParVendeur: leviers.entreesParVendeur ?? r.entreesParVendeur,
    presenceMinimale: leviers.presenceMinimale ?? r.presenceMinimale,
    tachesHorsVente: leviers.tachesHorsVente ?? r.tachesHorsVente,
    affluence: leviers.affluence ?? 1,
    tauxHoraire: leviers.tauxHoraire ?? equipeDuMois(f).tauxHoraireCharge,
  };
  const jours = (Object.keys(f.affluence) as JourDOuverture[]).map((jour) => {
    const entrees = f.affluence[jour].map((e) => e * l.affluence);
    const vendeurs = entrees.map((e) => Math.max(l.presenceMinimale, plafond(e / l.entreesParVendeur)));
    return { jour, entrees, vendeurs, heures: somme(vendeurs) };
  });
  const heuresDeVente = somme(jours.map((j) => j.heures));
  const parSemaine = heuresDeVente + l.tachesHorsVente;
  const parMois = heuresDuMois(f, parSemaine);
  return { leviers: l, jours, entreesDeLaSemaine: somme(jours.map((j) => somme(j.entrees))), heuresDeVente, tachesHorsVente: l.tachesHorsVente, parSemaine, parMois, cout: auCentime(parMois * l.tauxHoraire) };
}

/**
 * Un planning face au besoin : créneau par créneau, les vendeurs présents moins les vendeurs
 * nécessaires. Les heures manquantes sont les créneaux en sous-effectif ; les heures en trop, ceux
 * en sureffectif. Le planning est de la même forme que l'affluence (vendeurs présents par heure).
 */
export function planningFaceAuBesoin(f: FicheDeLaBoutique, planning: Readonly<Record<JourDOuverture, readonly number[]>> = f.planning, leviers: Partial<LeviersDuPlanning> = {}) {
  const besoin = heuresNecessaires(f, leviers);
  const jours = besoin.jours.map((b) => {
    const presents = planning[b.jour];
    const ecarts = b.vendeurs.map((v, i) => presents[i]! - v);
    return { jour: b.jour, presents, vendeurs: b.vendeurs, ecarts, manquantes: somme(ecarts.map((e) => Math.max(0, -e))), enTrop: somme(ecarts.map((e) => Math.max(0, e))) };
  });
  const heuresPlanifiees = somme(jours.map((j) => somme(j.presents)));
  return {
    besoin,
    jours,
    heuresPlanifiees,
    heuresDuPlanning: heuresPlanifiees + besoin.tachesHorsVente,
    heuresManquantes: somme(jours.map((j) => j.manquantes)),
    heuresEnTrop: somme(jours.map((j) => j.enTrop)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. L'ASSORTIMENT
// ═════════════════════════════════════════════════════════════════════════════

export type FamilleDeLAssortiment = "locomotive" | "volume" | "marge" | "a-revoir";

/**
 * La marge de chaque référence et sa famille. Une référence vend beaucoup si ses ventes dépassent
 * la moyenne de la gamme (ventes ÷ nombre de références) ; elle marge fort si sa marge unitaire
 * dépasse la marge unitaire moyenne PONDÉRÉE (marge totale ÷ articles vendus). Les deux :
 * locomotive ; beaucoup de ventes, petite marge : produit de volume ; peu de ventes, forte marge :
 * produit de marge ; ni l'un ni l'autre : à revoir.
 */
export function assortiment(f: FicheDeLaBoutique, quantites: Partial<Record<CodeDeReference, number>> = {}) {
  const lignes = f.gamme.map((r) => {
    const ventes = quantites[r.code] ?? r.ventesDuMois;
    const margeUnitaire = auCentime(r.prixHt - coutVariable(r));
    return { code: r.code, nom: r.nom, ventes, prixHt: r.prixHt, coutVariable: coutVariable(r), margeUnitaire, chiffreDAffaires: auCentime(ventes * r.prixHt), marge: auCentime(ventes * margeUnitaire) };
  });
  const ventes = somme(lignes.map((l) => l.ventes));
  const chiffreDAffaires = auCentime(somme(lignes.map((l) => l.chiffreDAffaires)));
  const marge = auCentime(somme(lignes.map((l) => l.marge)));
  const ventesMoyennes = ventes / lignes.length;
  const margeUnitaireMoyenne = marge / ventes;
  const references = lignes.map((l) => {
    const beaucoup = l.ventes > ventesMoyennes;
    const fort = l.margeUnitaire > margeUnitaireMoyenne;
    const famille: FamilleDeLAssortiment = beaucoup && fort ? "locomotive" : beaucoup ? "volume" : fort ? "marge" : "a-revoir";
    return { ...l, partDuChiffreDAffaires: l.chiffreDAffaires / chiffreDAffaires, partDeLaMarge: l.marge / marge, famille };
  });
  return { references, ventes, chiffreDAffaires, marge, ventesMoyennes, margeUnitaireMoyenne };
}

/**
 * Retirer une référence : sa marge est perdue ; une part de ses ventes se reporte sur les autres
 * références (à l'unité la plus proche), à leur marge unitaire moyenne (leur marge ÷ leurs ventes).
 */
export function retirerUneReference(f: FicheDeLaBoutique, code: CodeDeReference, partReportee: number) {
  const a = assortiment(f);
  const visee = a.references.find((r) => r.code === code)!;
  const autres = a.references.filter((r) => r.code !== code);
  const margeDesAutres = auCentime(somme(autres.map((r) => r.marge)));
  const ventesDesAutres = somme(autres.map((r) => r.ventes));
  const margeUnitaireDesAutres = margeDesAutres / ventesDesAutres;
  const unitesReportees = aLUnite(visee.ventes * partReportee);
  const margeRecuperee = auCentime(unitesReportees * margeUnitaireDesAutres);
  return { visee, margeDesAutres, ventesDesAutres, margeUnitaireDesAutres, unitesReportees, margeRecuperee, effetNet: auCentime(margeRecuperee - visee.marge) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. LE TABLEAU DE BORD DU MANAGER
// ═════════════════════════════════════════════════════════════════════════════

/** Un voyant s'allume sous un plancher, ou au-dessus d'un plafond. */
export const voyantAllume = (s: SeuilDAlerte, valeur: number) => (s.sens === "plancher" ? valeur < s.seuil : valeur > s.seuil);

/**
 * Le tableau de bord du mois : chaque indicateur, sa valeur, celle de janvier N − 1 quand elle
 * existe, son seuil et son voyant. Les leviers des indicateurs (trafic, transformation, indice de
 * vente, prix moyen d'un article) se propagent : le chiffre d'affaires, la marge, l'indice de
 * sécurité et la part du personnel suivent.
 */
export function tableauDeBordDuManager(f: FicheDeLaBoutique, leviers: Partial<LeviersDesIndicateurs> = {}) {
  const ca = chiffreDAffairesParLesIndicateurs(f, leviers);
  const n1 = f.moisN1;
  const mois = indicateursDuMois(f);
  const marges = margesDeLaGamme(f);
  const seuil = seuilDuPointDeVente(f, { tickets: ca.tickets, panierMoyen: ca.panierMoyen });
  const equipe = equipeDuMois(f);
  const objectif = budgetDuTrimestre(f).objectifDuMois;
  const valeurs: Record<CodeDIndicateurDuManager, { valeur: number; n1: number | null }> = {
    realisationDeLObjectif: { valeur: ca.chiffreDAffaires / objectif, n1: null },
    evolutionDuTrafic: { valeur: ca.trafic / n1.trafic - 1, n1: null },
    tauxDeTransformation: { valeur: ca.tauxDeTransformation, n1: n1.tickets / n1.trafic },
    panierMoyen: { valeur: ca.panierMoyen, n1: n1.chiffreDAffaires / n1.tickets },
    indiceDeVente: { valeur: ca.indiceDeVente, n1: n1.articles / n1.tickets },
    tauxDeService: { valeur: mois.tauxDeService, n1: n1.articles / n1.demande },
    tauxDeMarque: { valeur: marges.tauxDeMarque, n1: null },
    indiceDeSecurite: { valeur: seuil.indiceDeSecurite, n1: null },
    partDuPersonnel: { valeur: equipe.cout / ca.chiffreDAffaires, n1: null },
    dureeDeStockage: { valeur: stockDuMois(f).dureeDeStockage, n1: null },
  };
  const indicateurs = (Object.keys(f.seuilsDAlerte) as CodeDIndicateurDuManager[]).map((code) => ({
    code,
    ...valeurs[code],
    ...f.seuilsDAlerte[code],
    voyant: voyantAllume(f.seuilsDAlerte[code], valeurs[code].valeur),
  }));
  return {
    chiffreDAffaires: ca.chiffreDAffaires,
    chiffreDAffairesN1: n1.chiffreDAffaires,
    evolutionDuChiffreDAffaires: ca.chiffreDAffaires / n1.chiffreDAffaires - 1,
    objectif,
    indicateurs,
    voyantsAllumes: indicateurs.filter((i) => i.voyant).map((i) => i.code),
  };
}
