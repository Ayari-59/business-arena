import { coutVariable, referenceDe } from "./boutique";
import type { CodeDeClientele, CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MODÈLE DU MAGASIN AU QUOTIDIEN : LA VENTE ET LA CAISSE DE MAILLE & CO (palier 1 : le CAP Équipier
 * polyvalent du commerce, la seconde et le bac pro Métiers du commerce et de la vente).
 *
 * Les chapitres « Recevoir une livraison », « Remplir le rayon », « Le prix affiché », « Tenir la
 * caisse », « Le panier moyen », « Suivre ses ventes », « Le client qui revient » et « Un nouveau
 * client » lisent tous la même boutique, celle du parcours BTS MCO (monde/maille-et-co.ts) : son mois
 * de janvier référence par référence et clientèle par clientèle, ses étiquettes, son façonnier, ses
 * trois années passées. Ce fichier ne fait que les compter avec les gestes du magasin, en fonctions
 * pures : la même fiche et les mêmes leviers donnent toujours les mêmes chiffres, et chaque fonction
 * qu'un curseur ou un laboratoire lit prend ses leviers en paramètres.
 *
 *   1. LES ÉTIQUETTES ET LA PROMOTION : prix HT, TVA, prix TTC affiché ; la remise, le nouveau prix,
 *      et ce que la promotion fait vendre (la demande répond à la remise, le rayon borne les ventes).
 *   2. LA CAISSE : le ticket et la monnaie ; la journée moyenne réglée en caisse, les espèces, le
 *      fond de caisse, le tiroir compté et l'écart ; les passages au coffre.
 *   3. LA RÉCEPTION : le bon de livraison du façonnier, le compte carton par carton, l'écart, le
 *      stock après la réception ; ce que la boutique saisit, réclame et paie.
 *   4. LE RAYON : les ventes d'un jour, les jours avant la rupture, le délai du façonnier, ce que
 *      coûte une rupture, et ce qu'il faut commander pour le mois suivant.
 *   5. LE PANIER : le panier moyen, le coût et la marge d'une vente, l'article proposé en plus, un
 *      mois de décembre pour comparer, l'indice de vente qui fait le panier.
 *   6. LE SUIVI DES VENTES : l'objectif d'un trimestre, le réalisé, l'écart, la demande, le verdict.
 *   7. LA FIDÉLITÉ : les clientes de la carte, celles qui reviennent et celles qui partent, ce que
 *      vaut une cliente gardée ; une fermeture pour travaux.
 *   8. LA CONQUÊTE : une campagne qui fait entrer des passants, ce qu'elle rapporte et ce qu'elle
 *      laisse une fois payée.
 *
 * LES HYPOTHÈSES DU COURS sont des constantes nommées, chacune commentée à sa place. CONVENTIONS :
 * les montants sont au centime ; un prix ou une marge à l'unité est arrondi au centime AVANT d'être
 * multiplié (l'élève refait le calcul avec le chiffre qu'il lit) ; le mois commercial a 30 jours
 * aux ventes régulières (la fiche).
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const plafond = (x: number) => Math.ceil(x - 1e-9);
const plancher = (x: number) => Math.floor(x + 1e-9);

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES ÉTIQUETTES ET LA PROMOTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * L'ARRONDI DE L'ÉTIQUETTE (hypothèse du cours) : un prix affiché se termine par un multiple de 10
 * centimes, arrondi vers le bas (le client ne paie jamais plus que le prix calculé, et une remise
 * annoncée vaut au moins ce qu'elle annonce). Les étiquettes de MAILLE & CO tombent juste.
 */
export const ARRONDI_DE_L_ETIQUETTE = 0.1;

/** L'article dont l'élève vérifie l'étiquette au rayon (hypothèse du cours). */
export const ARTICLE_A_ETIQUETER: CodeDeReference = "echarpe";

/** Le prix affiché : au centime, puis aux 10 centimes du dessous. */
export function arrondiDeLEtiquette(x: number): number {
  const pas = Math.round(ARRONDI_DE_L_ETIQUETTE * 100);
  return (plancher(Math.round(x * 100) / pas) * pas) / 100;
}

export interface Etiquette {
  code: CodeDeReference;
  nom: string;
  ht: number;
  taux: number;
  tva: number;
  ttc: number;
  /** Le prix posé sur l'étiquette, arrondi. */
  affiche: number;
}

/** Les étiquettes du rayon : le prix hors taxes, la TVA, le prix toutes taxes, le prix affiché. */
export function etiquettesDuRayon(f: FicheDeLaBoutique): Etiquette[] {
  return f.gamme.map((r) => {
    const tva = auCentime(r.prixHt * r.tauxTva);
    const ttc = auCentime(r.prixHt + tva);
    return { code: r.code, nom: r.nom, ht: r.prixHt, taux: r.tauxTva, tva, ttc, affiche: arrondiDeLEtiquette(ttc) };
  });
}

export const etiquetteDe = (f: FicheDeLaBoutique, code: CodeDeReference) => etiquettesDuRayon(f).find((e) => e.code === code)!;

/** Un mois d'une référence face à une remise : la demande du mois au prix de l'étiquette, et le stock en rayon. */
export interface MoisDeLaPromotion {
  reference: CodeDeReference;
  /** Les articles demandés dans le mois au prix de l'étiquette, sans remise. */
  demandeDuMois: number;
  remise: number;
  stockEnRayon: number;
}

/**
 * Les ventes d'un mois à une remise : demande = demande du mois × (1 + élasticité à la remise ×
 * remise), à l'unité inférieure (l'élasticité de la fiche) ; ventes = la plus petite de la demande
 * et du stock en rayon ; le reste est une vente manquée. Le chiffre d'affaires est hors taxes, au
 * prix payé (l'étiquette moins la remise).
 */
export function ventesALaRemise(f: FicheDeLaBoutique, m: MoisDeLaPromotion) {
  const r = referenceDe(f, m.reference);
  const demande = Math.max(0, plancher(m.demandeDuMois * (1 + f.elasticiteALaRemise * m.remise)));
  const vendus = Math.min(demande, Math.max(0, m.stockEnRayon));
  const prixPaye = auCentime(r.prixHt * (1 - m.remise));
  return { demande, vendus, manques: demande - vendus, prixPaye, chiffreDAffaires: auCentime(vendus * prixPaye) };
}

export type BilanDeLaPromotion = "plus-et-plus" | "plus-mais-moins" | "rien-de-plus";

/** Une promotion : l'étiquette, puis le mois avec et sans la remise, au même stock en rayon. */
export function promotionDuMois(f: FicheDeLaBoutique, m: MoisDeLaPromotion) {
  const article = etiquetteDe(f, m.reference);
  const montantDeLaRemise = auCentime(article.affiche * m.remise);
  const calcule = auCentime(article.affiche - montantDeLaRemise);
  const nouveauPrix = arrondiDeLEtiquette(calcule);
  const sans = ventesALaRemise(f, { ...m, remise: 0 });
  const avec = ventesALaRemise(f, m);
  const ventesEnPlus = avec.vendus - sans.vendus;
  const chiffreEnPlus = auCentime(avec.chiffreDAffaires - sans.chiffreDAffaires);
  const bilan: BilanDeLaPromotion = ventesEnPlus <= 0 ? "rien-de-plus" : chiffreEnPlus > 0 ? "plus-et-plus" : "plus-mais-moins";
  return {
    ...m,
    article,
    montantDeLaRemise,
    calcule,
    nouveauPrix,
    arrondi: auCentime(calcule - nouveauPrix) > 0,
    prixHtPromo: avec.prixPaye,
    sans,
    avec,
    ventesEnPlus,
    chiffreEnPlus,
    bilan,
  };
}

/** La promotion de la fiche : 10 % sur le pull col rond en février, 700 pulls en rayon, la demande de janvier. */
export function promotionDeFevrier(f: FicheDeLaBoutique, remise: number = f.promotion.remise) {
  const r = referenceDe(f, f.promotion.reference);
  return promotionDuMois(f, { reference: r.code, demandeDuMois: r.demandeDuMois, remise, stockEnRayon: f.promotion.stockEnRayon });
}

/** Les bornes des remises que l'élève essaie, en pourcentage entier. */
export const REMISES_ESSAYEES = { min: 0, max: 30 } as const;

/** La plus forte remise (en % entier) qui garde le chiffre d'affaires du mois au moins à celui sans remise. */
export function remiseQuiGardeLeChiffre(f: FicheDeLaBoutique): number {
  const sans = promotionDeFevrier(f, 0).sans.chiffreDAffaires;
  let meilleure = 0;
  for (let p = REMISES_ESSAYEES.min; p <= REMISES_ESSAYEES.max; p++) if (promotionDeFevrier(f, p / 100).avec.chiffreDAffaires >= sans) meilleure = p;
  return meilleure;
}

/** Une remise qui fait mieux que sans promotion, sans laisser un client repartir sans son pull. */
export const remiseQuiPaieSansRupture = (f: FicheDeLaBoutique, remise: number) => {
  const p = promotionDeFevrier(f, remise);
  return p.avec.chiffreDAffaires > p.sans.chiffreDAffaires && p.avec.manques === 0;
};

/**
 * LA PROMOTION DE NOËL (hypothèse du cas « La promotion de Noël ») : en décembre, la boutique a
 * demandé 1 400 pulls col rond au prix de l'étiquette (le mois de décembre ci-dessous) et en a 1 600
 * en rayon et en réserve.
 */
export const RAYON_DE_DECEMBRE = { reference: "col-rond" as CodeDeReference, stockEnRayon: 1_600 };

// ═════════════════════════════════════════════════════════════════════════════
// 2. LA CAISSE
// ═════════════════════════════════════════════════════════════════════════════

/** Le panier du client que l'élève passe en caisse (hypothèse du cours). */
export const TICKET_DU_CLIENT: readonly { reference: CodeDeReference; quantite: number }[] = [
  { reference: "echarpe", quantite: 1 },
  { reference: "bonnet", quantite: 1 },
];

/** Le billet que le client donne pour payer (hypothèse du cours). */
export const BILLET_DU_CLIENT = 100;

/** Le fond de caisse du matin : la monnaie mise dans le tiroir avant la première vente (hypothèse du cours). */
export const FOND_DE_CAISSE = 150;

/** La part du chiffre d'affaires TTC réglé en caisse qui se paie en espèces, le reste par carte (hypothèse du cours). */
export const PART_EN_ESPECES = 0.25;

/** L'erreur de la journée (hypothèse du cours) : un billet de 10 € rendu en trop à un client. */
export const ERREUR_DE_LA_JOURNEE = -10;

/**
 * LE PLAFOND DU TIROIR (hypothèse du cours, une consigne de sécurité courante) : le tiroir ne doit
 * jamais garder plus de 500 € d'espèces. Au-delà, le responsable passe prendre l'excédent et le
 * met au coffre ; il laisse le fond de caisse.
 */
export const PLAFOND_DU_TIROIR = 500;

/** Les billets et les pièces d'un tiroir-caisse, du plus grand au plus petit. */
export const COUPURES = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01] as const;

/** Un montant en billets et en pièces, en prenant toujours la plus grande coupure possible. */
export function enCoupures(montant: number): { valeur: number; nombre: number }[] {
  let reste = Math.round(montant * 100);
  const out: { valeur: number; nombre: number }[] = [];
  for (const v of COUPURES) {
    const c = Math.round(v * 100);
    const n = Math.floor(reste / c);
    if (n > 0) out.push({ valeur: v, nombre: n });
    reste -= n * c;
  }
  return out;
}

/** Le ticket du client, sa monnaie, et deux erreurs de caissier (un billet de 10 € en trop, la plus petite pièce oubliée). */
export function ticketDuClient(f: FicheDeLaBoutique) {
  const lignes = TICKET_DU_CLIENT.map((l) => {
    const e = etiquetteDe(f, l.reference);
    return { code: e.code, nom: e.nom, quantite: l.quantite, prix: e.affiche, montant: auCentime(l.quantite * e.affiche) };
  });
  const total = auCentime(somme(lignes.map((l) => l.montant)));
  if (total > BILLET_DU_CLIENT) throw new Error(`Le billet de ${BILLET_DU_CLIENT} € ne paie pas le ticket de ${total} €`);
  const rendu = auCentime(BILLET_DU_CLIENT - total);
  const monnaie = enCoupures(rendu);
  const petite = monnaie.at(-1)!.valeur;
  return {
    lignes,
    total,
    billet: BILLET_DU_CLIENT,
    rendu,
    monnaie,
    plus: { coupures: enCoupures(auCentime(rendu + 10)), montant: auCentime(rendu + 10) },
    moins: { coupures: enCoupures(auCentime(rendu - petite)), montant: auCentime(rendu - petite), oubli: petite },
  };
}

/** Une clientèle d'un mois : ses passages en caisse, ses articles, son délai de règlement. */
export interface ClienteleDuMois {
  code: CodeDeClientele;
  nom: string;
  tickets: number;
  achats: Readonly<Record<CodeDeReference, number>>;
  delaiDeReglement: number;
}

/** Un mois de ventes de la boutique, clientèle par clientèle. */
export interface MoisDeVentes {
  libelle: string;
  clienteles: readonly ClienteleDuMois[];
}

/** Janvier de l'année N, le mois de la fiche. */
export const janvier = (f: FicheDeLaBoutique): MoisDeVentes => ({ libelle: f.moisDeReference, clienteles: f.clienteles });

/**
 * DÉCEMBRE DE L'ANNÉE N − 1 (hypothèse du cours, pour comparer à janvier) : le mois des cadeaux. Le
 * trimestre 4 de N − 1 a vendu 12 500 articles (la fiche) ; décembre en fait 5 000, aux mêmes
 * étiquettes. Les clients y prennent surtout des écharpes et des bonnets à offrir : 3 130 passages
 * en caisse et 260 000 € hors taxes, un panier plus petit qu'en janvier. Les comités d'entreprise
 * passent 30 commandes, réglées à 45 jours : elles ne passent pas en caisse.
 */
export const DECEMBRE_N_MOINS_1: MoisDeVentes = {
  libelle: "décembre",
  clienteles: [
    { code: "fideles", nom: "Clientes fidèles", tickets: 900, achats: { "col-rond": 400, cardigan: 300, merinos: 120, echarpe: 400, bonnet: 230 }, delaiDeReglement: 0 },
    { code: "passants", nom: "Passants", tickets: 2_200, achats: { "col-rond": 850, cardigan: 520, merinos: 140, echarpe: 950, bonnet: 540 }, delaiDeReglement: 0 },
    { code: "comites", nom: "Comités d'entreprise", tickets: 30, achats: { "col-rond": 150, cardigan: 80, merinos: 40, echarpe: 150, bonnet: 130 }, delaiDeReglement: 45 },
  ],
};

/** Les comptes d'une clientèle (ou de plusieurs) : passages, articles, chiffre d'affaires HT, coût variable, marge. */
export function comptesDe(f: FicheDeLaBoutique, clienteles: readonly ClienteleDuMois[]) {
  const lignes = clienteles.flatMap((c) => Object.entries(c.achats) as [CodeDeReference, number][]);
  const tickets = somme(clienteles.map((c) => c.tickets));
  const articles = somme(lignes.map(([, q]) => q));
  const chiffreDAffaires = auCentime(somme(lignes.map(([code, q]) => q * referenceDe(f, code).prixHt)));
  const coutDesVentes = auCentime(somme(lignes.map(([code, q]) => q * coutVariable(referenceDe(f, code)))));
  return { tickets, articles, chiffreDAffaires, coutDesVentes, marge: auCentime(chiffreDAffaires - coutDesVentes) };
}

/**
 * La journée moyenne réglée en caisse d'un mois : les clientèles qui paient en caisse (délai de
 * règlement nul), divisées par les jours du mois ; le chiffre d'affaires TTC, les espèces, le tiroir
 * attendu le soir (fond de caisse + espèces), le tiroir compté (avec l'erreur de la journée), l'écart
 * et ce qui part au coffre.
 */
export function journeeEnCaisse(f: FicheDeLaBoutique, mois: MoisDeVentes = janvier(f), erreur: number = ERREUR_DE_LA_JOURNEE) {
  const enCaisse = comptesDe(f, mois.clienteles.filter((c) => c.delaiDeReglement === 0));
  const facture = comptesDe(f, mois.clienteles.filter((c) => c.delaiDeReglement > 0));
  const jours = f.joursDuMois;
  const taux = f.gamme[0]!.tauxTva;
  const htDuJour = auCentime(enCaisse.chiffreDAffaires / jours);
  const tvaDuJour = auCentime(htDuJour * taux);
  const ttcDuJour = auCentime(htDuJour + tvaDuJour);
  const especes = auCentime(ttcDuJour * PART_EN_ESPECES);
  const attendu = auCentime(FOND_DE_CAISSE + especes);
  const compte = auCentime(attendu + erreur);
  return {
    mois: mois.libelle,
    articlesDuMois: enCaisse.articles,
    ticketsDuMois: enCaisse.tickets,
    chiffreDuMois: enCaisse.chiffreDAffaires,
    chiffreFacture: facture.chiffreDAffaires,
    jours,
    taux,
    articlesParJour: Math.round(enCaisse.articles / jours),
    htDuJour,
    tvaDuJour,
    ttcDuJour,
    especes,
    attendu,
    compte,
    tiroir: enCoupures(compte),
    ecart: auCentime(compte - attendu),
    auCoffre: auCentime(compte - FOND_DE_CAISSE),
    /** Ce qu'un client laisse en moyenne en caisse, TTC, au centime. */
    ticketMoyenTtc: auCentime((enCaisse.chiffreDAffaires * (1 + taux)) / enCaisse.tickets),
  };
}

/** Le tiroir après un nombre de clients payés en espèces, au ticket moyen TTC, depuis le fond de caisse. */
export const tiroirApres = (f: FicheDeLaBoutique, clients: number) => auCentime(FOND_DE_CAISSE + clients * journeeEnCaisse(f).ticketMoyenTtc);

/** Le plus de clients payés en espèces que le tiroir accepte avant de dépasser son plafond. */
export const clientsAvantLeCoffre = (f: FicheDeLaBoutique) => plancher((PLAFOND_DU_TIROIR - FOND_DE_CAISSE) / journeeEnCaisse(f).ticketMoyenTtc);

/** Les passages au coffre que l'élève essaie dans une journée. */
export const PASSAGES_AU_COFFRE = { min: 0, max: 5 } as const;

/**
 * La journée avec des passages au coffre répartis régulièrement : les espèces arrivent au même
 * rythme toute la journée ; à chaque passage, l'excédent sur le fond de caisse part au coffre. Le
 * tiroir le plus plein est le fond de caisse plus les espèces d'une période (espèces ÷ (passages + 1)).
 */
export function journeeAvecLeCoffre(f: FicheDeLaBoutique, passages: number) {
  const j = journeeEnCaisse(f);
  const parPeriode = auCentime(j.especes / (passages + 1));
  const plusPlein = auCentime(FOND_DE_CAISSE + parPeriode);
  return { passages, especes: j.especes, parPeriode, plusPlein, auDessus: auCentime(plusPlein - PLAFOND_DU_TIROIR), sousLePlafond: plusPlein <= PLAFOND_DU_TIROIR };
}

/** Le moins de passages au coffre qui garde le tiroir sous son plafond toute la journée. */
export function passagesNecessaires(f: FicheDeLaBoutique): number {
  for (let n = PASSAGES_AU_COFFRE.min; n <= PASSAGES_AU_COFFRE.max; n++) if (journeeAvecLeCoffre(f, n).sousLePlafond) return n;
  throw new Error("Aucun nombre de passages ne garde le tiroir sous son plafond");
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA RÉCEPTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE BON DU FAÇONNIER (hypothèse du cours) : la fiche date chaque livraison de janvier (les
 * écharpes le 8, les pulls col rond le 10, les cardigans le 12, les pulls mérinos le 15). Pour
 * l'exercice, le cours les regroupe sur un seul bon de livraison, celui du mois : 1 000 articles.
 */
export const ARTICLES_PAR_CARTON = 10;

/** UN CARTON MANQUE, sur la ligne la plus grosse du bon (hypothèse du cours, pour entraîner au contrôle). */
export const CARTONS_MANQUANTS = 1;

/**
 * LES DEUX ÉCARTS (hypothèse du cas « Les deux écarts ») : en février, le façonnier livre les mêmes
 * quantités qu'en janvier ; un carton manque sur la ligne la plus grosse, un carton est en trop sur
 * la plus petite, et le total du bon tombe juste.
 */
export const CARTONS_DE_CHAQUE_ECART = 1;

/** Le bon de livraison du façonnier : les références livrées en janvier, et le stock du 1er janvier. */
export function bonDuFaconnier(f: FicheDeLaBoutique) {
  const lignes = f.gamme
    .map((r) => ({ code: r.code, nom: r.nom, avant: r.stockInitial, commandee: somme(r.livraisons.map((l) => l.quantite)), prixDAchat: r.coutDAchat }))
    .filter((l) => l.commandee > 0);
  return {
    lignes,
    totalCommande: somme(lignes.map((l) => l.commandee)),
    /** Le stock de toute la boutique au 1er janvier, références sans livraison comprises. */
    totalAvant: somme(f.gamme.map((r) => r.stockInitial)),
  };
}

/** La réception du chapitre : le bon, le compte (un carton manque sur la plus grosse ligne), l'écart, le stock après. */
export function receptionDuFaconnier(f: FicheDeLaBoutique) {
  const bon = bonDuFaconnier(f);
  const plusGrosse = bon.lignes.reduce((a, b) => (b.commandee > a.commandee ? b : a));
  const plusPetite = bon.lignes.reduce((a, b) => (b.commandee < a.commandee ? b : a));
  const manquants = CARTONS_MANQUANTS * ARTICLES_PAR_CARTON;
  const comptes = bon.lignes.map((l) => ({ ...l, surLeBon: l.commandee, comptee: l.code === plusGrosse.code ? l.commandee - manquants : l.commandee }));
  const ecart = comptes.find((l) => l.code === plusGrosse.code)!;
  const totalRecu = somme(comptes.map((l) => l.comptee));
  return {
    ...bon,
    comptes,
    ecart,
    enTrop: plusPetite,
    manquants,
    totalRecu,
    apresDeLEcart: ecart.avant + ecart.comptee,
    totalApres: bon.totalAvant + totalRecu,
    /** La facture du façonnier pour la ligne de l'écart : ce que dit le bon, au prix d'achat. */
    factureDeLaLigne: auCentime(ecart.surLeBon * ecart.prixDAchat),
  };
}

/** Les cartons qui peuvent manquer sur la ligne de l'écart sans que le rayon manque une vente du mois. */
export function cartonsQuiPeuventManquer(f: FicheDeLaBoutique) {
  const { ecart } = receptionDuFaconnier(f);
  const demande = referenceDe(f, ecart.code).demandeDuMois;
  return plancher((ecart.avant + ecart.surLeBon - demande) / ARTICLES_PAR_CARTON);
}

/** Le stock disponible du mois sur la ligne de l'écart, avec un nombre de cartons manquants. */
export function disponibleAvecDesCartonsManquants(f: FicheDeLaBoutique, cartons: number) {
  const { ecart } = receptionDuFaconnier(f);
  return ecart.avant + ecart.surLeBon - cartons * ARTICLES_PAR_CARTON;
}

/** Ce que la boutique saisit en stock et réclame au façonnier, face à ce qui est vraiment arrivé. */
export function saisieDeLaReception(f: FicheDeLaBoutique, saisis: number, reclames: number) {
  const r = receptionDuFaconnier(f);
  const enReserve = r.ecart.avant + r.ecart.comptee;
  const enMachine = r.ecart.avant + saisis;
  return {
    enReserve,
    enMachine,
    /** Ce que le stock affiché compte en trop (négatif : en moins), face à la réserve. */
    ecartDInventaire: enMachine - enReserve,
    facture: r.factureDeLaLigne,
    avoir: auCentime(reclames * r.ecart.prixDAchat),
    aPayer: auCentime(r.factureDeLaLigne - reclames * r.ecart.prixDAchat),
    /** Ce que la boutique paierait pour des articles jamais reçus (négatif : elle réclame trop). */
    payeSansEtreRecu: auCentime((r.manquants - reclames) * r.ecart.prixDAchat),
    juste: saisis === r.ecart.comptee && reclames === r.manquants,
  };
}

/** La livraison de février du cas : les lignes de janvier, un carton de moins sur la plus grosse, un de plus sur la plus petite. */
export function livraisonAvecDeuxEcarts(f: FicheDeLaBoutique) {
  const bon = bonDuFaconnier(f);
  const manque = bon.lignes.reduce((a, b) => (b.commandee > a.commandee ? b : a));
  const enTrop = bon.lignes.reduce((a, b) => (b.commandee < a.commandee ? b : a));
  const ecart = CARTONS_DE_CHAQUE_ECART * ARTICLES_PAR_CARTON;
  const comptes = bon.lignes.map((l) => ({
    ...l,
    surLeBon: l.commandee,
    comptee: l.code === manque.code ? l.commandee - ecart : l.code === enTrop.code ? l.commandee + ecart : l.commandee,
  }));
  return {
    comptes,
    manque: comptes.find((l) => l.code === manque.code)!,
    enTrop: comptes.find((l) => l.code === enTrop.code)!,
    ecart,
    totalSurLeBon: somme(comptes.map((l) => l.surLeBon)),
    totalCompte: somme(comptes.map((l) => l.comptee)),
    payesSansEtreRecus: auCentime(ecart * manque.prixDAchat),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE RAYON
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE MOIS SUIVANT (hypothèse du cours) : en février, les clients demandent autant de cardigans
 * qu'en janvier, et la réserve est vide au 1er février (la fiche : 120 + 240 − 360 = 0). La
 * commande, passée au façonnier ses 21 jours de délai avant, arrive le 1er février ; elle se
 * compte en cartons de 10.
 */
export const COMMANDES_ESSAYEES = { min: 200, max: 600, pas: ARTICLES_PAR_CARTON } as const;

/** L'article en rupture en janvier : la référence dont la demande dépasse les ventes. */
export function articleEnRupture(f: FicheDeLaBoutique) {
  const r = f.gamme.find((x) => x.demandeDuMois > x.ventesDuMois);
  if (!r) throw new Error("Aucune référence en rupture en janvier");
  return r;
}

/** Les chiffres du rayon : le rythme, les jours qui restent, le délai du façonnier, la rupture. */
export function rayonDuMois(f: FicheDeLaBoutique) {
  const r = articleEnRupture(f);
  const livraison = r.livraisons[0]!;
  const delai = f.fournisseurs.find((x) => x.code === "faconnier")!.delaiDeLivraison;
  // Les ventes d'un jour, à l'unité : le rythme que l'équipier retient.
  const parJour = Math.round(r.demandeDuMois / f.joursDuMois);
  const joursAvant = plancher(r.stockInitial / parJour);
  const joursApres = plancher(livraison.quantite / parJour);
  const manquees = r.demandeDuMois - r.ventesDuMois;
  return {
    code: r.code,
    nom: r.nom,
    stock: r.stockInitial,
    demande: r.demandeDuMois,
    vendues: r.ventesDuMois,
    jours: f.joursDuMois,
    prixHt: r.prixHt,
    prixDAchat: r.coutDAchat,
    livraison,
    delai,
    parJour,
    joursAvant,
    /** Les jours sans l'article si le responsable commandait le 1er janvier : le délai passe la rupture. */
    joursSans: Math.max(0, delai - joursAvant),
    /** Les jours de rayon vide avant la livraison déjà commandée (elle arrive le matin de son jour). */
    joursVidesAvantLaLivraison: Math.max(0, livraison.jour - 1 - joursAvant),
    /** Après la livraison du jour dit : les jours qu'elle tient, et ce qui manque pour atteindre le délai d'un réassort commandé ce jour-là. */
    joursApres,
    joursSansApres: Math.max(0, delai - joursApres),
    articlesEnDanger: Math.max(0, delai - joursApres) * parJour,
    manquees,
    ventesPerdues: auCentime(manquees * r.prixHt),
    /** Le stock qu'il faut au moins avoir le jour où l'on commande : les ventes pendant le délai. */
    stockPourLeDelai: parJour * delai,
  };
}

/** Le mois de février avec une commande donnée : la demande de janvier, la réserve vide au départ. */
export function fevrierAvecUneCommande(f: FicheDeLaBoutique, commande: number) {
  const r = articleEnRupture(f);
  const vendues = Math.min(commande, r.demandeDuMois);
  return {
    demande: r.demandeDuMois,
    commande,
    vendues,
    manquees: r.demandeDuMois - vendues,
    reste: commande - vendues,
    chiffreDAffaires: auCentime(vendues * r.prixHt),
    ventesPerdues: auCentime((r.demandeDuMois - vendues) * r.prixHt),
    achat: auCentime(commande * r.coutDAchat),
  };
}

/** La plus petite commande, en cartons entiers, qui sert toute la demande de février. */
export const commandeDeFevrier = (f: FicheDeLaBoutique) => Math.max(COMMANDES_ESSAYEES.min, plafond(articleEnRupture(f).demandeDuMois / ARTICLES_PAR_CARTON) * ARTICLES_PAR_CARTON);

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE PANIER
// ═════════════════════════════════════════════════════════════════════════════

/** Les ventes de plus que l'équipe fait chaque jour du mois (hypothèse du cours). */
export const VENTES_DE_PLUS_PAR_JOUR = 2;

/** Les deux articles dont l'élève lit la part dans le panier (hypothèse du cours). */
export const ARTICLES_COMPARES: readonly [CodeDeReference, CodeDeReference] = ["echarpe", "merinos"];

/** L'article déjà dans le panier du client, à qui le vendeur en propose un second (hypothèse du cours). */
export const ARTICLE_DU_CLIENT: CodeDeReference = "col-rond";

/** Le poste dont le curseur cherche ce qu'il doit vendre pour payer son coût : un vendeur à temps plein (la fiche). */
export const POSTE_DU_VENDEUR_EN_PLUS = "vendeur";

/**
 * L'OBJECTIF DE PANIER (hypothèse du cours) : la responsable demande à l'équipe un panier moyen
 * d'au moins 100 € hors taxes, en faisant prendre plus d'articles à chaque passage en caisse.
 */
export const OBJECTIF_DE_PANIER = 100;

/** Les bornes de l'indice de vente (articles par passage en caisse) que l'élève essaie. */
export const INDICES_ESSAYES = { min: 1, max: 2.5, pas: 0.01 } as const;

/**
 * Le panier, le coût et la marge d'une vente sur un mois, EN CAISSE : le panier moyen divise le
 * chiffre d'affaires encaissé en caisse par les passages en caisse. Les commandes des comités
 * d'entreprise, facturées et réglées plus tard, ne passent pas en caisse (journeeEnCaisse, « Tenir la
 * caisse ») : les compter au numérateur gonflerait le panier (audit pédagogique, P1-7).
 */
export function panierDuMois(f: FicheDeLaBoutique, mois: MoisDeVentes = janvier(f)) {
  const k = comptesDe(f, mois.clienteles.filter((c) => c.delaiDeReglement === 0));
  const panier = auCentime(k.chiffreDAffaires / k.tickets);
  const coutDUneVente = auCentime(k.coutDesVentes / k.tickets);
  const marge = auCentime(panier - coutDUneVente);
  const jours = f.joursDuMois;
  const ventesEnPlus = VENTES_DE_PLUS_PAR_JOUR * jours;
  return {
    mois: mois.libelle,
    ...k,
    panier,
    coutDUneVente,
    marge,
    jours,
    ventesEnPlus,
    caEnPlus: auCentime(ventesEnPlus * panier),
    margeEnPlus: auCentime(ventesEnPlus * marge),
    /** L'indice de vente (articles par passage) et le prix moyen d'un article, non arrondis. */
    indiceDeVente: k.articles / k.tickets,
    prixMoyenDeLArticle: k.chiffreDAffaires / k.articles,
    margeMoyenneDeLArticle: k.marge / k.articles,
  };
}

/** Les articles du mois : vendus, chiffre d'affaires, prix, coût variable, marge, part dans le panier. */
export function articlesDuMois(f: FicheDeLaBoutique, mois: MoisDeVentes = janvier(f)) {
  const { tickets } = panierDuMois(f, mois);
  return f.gamme.map((r) => {
    const vendus = somme(mois.clienteles.filter((c) => c.delaiDeReglement === 0).map((c) => c.achats[r.code] ?? 0));
    const chiffreDAffaires = auCentime(vendus * r.prixHt);
    const cout = coutVariable(r);
    return { code: r.code, nom: r.nom, vendus, chiffreDAffaires, prix: r.prixHt, cout, marge: auCentime(r.prixHt - cout), dansLePanier: auCentime(chiffreDAffaires / tickets) };
  });
}

/** L'article à proposer en plus : la plus forte marge, face au plus vendu et au moins cher des autres. */
export function articleAConseiller(f: FicheDeLaBoutique) {
  const articles = articlesDuMois(f);
  const autres = articles.filter((a) => a.code !== ARTICLE_DU_CLIENT);
  const meilleur = autres.reduce((m, a) => (a.marge > m.marge ? a : m));
  const reste = autres.filter((a) => a !== meilleur);
  const plusVendu = reste.reduce((m, a) => (a.vendus > m.vendus ? a : m));
  const moinsCher = reste.filter((a) => a !== plusVendu).reduce((m, a) => (a.prix < m.prix ? a : m));
  return { client: articles.find((a) => a.code === ARTICLE_DU_CLIENT)!, meilleur, plusVendu, moinsCher };
}

/** Le coût d'un vendeur de plus pour un mois : son salaire brut et les cotisations patronales de la fiche. */
export function coutDUnVendeurEnPlus(f: FicheDeLaBoutique) {
  const s = f.equipe.find((x) => x.code === POSTE_DU_VENDEUR_EN_PLUS)!;
  return { poste: s.poste, brut: s.brutMensuel, cout: auCentime(s.brutMensuel * (1 + f.tauxPatronal)) };
}

/** La marge du mois gagnée par des ventes de plus chaque jour, à la marge d'une vente. */
export const margeDesVentesEnPlus = (f: FicheDeLaBoutique, parJour: number) => auCentime(parJour * f.joursDuMois * panierDuMois(f).marge);

/** Les ventes de plus par jour qu'il faut pour payer le vendeur de plus. */
export const ventesPourLeVendeur = (f: FicheDeLaBoutique) => plafond(coutDUnVendeurEnPlus(f).cout / (f.joursDuMois * panierDuMois(f).marge));

/** Le mois à un indice de vente donné : le prix moyen d'un article et les passages en caisse de janvier ne bougent pas. */
export function moisALIndice(f: FicheDeLaBoutique, indice: number) {
  const p = panierDuMois(f);
  const panier = auCentime(indice * p.prixMoyenDeLArticle);
  const marge = auCentime(indice * p.margeMoyenneDeLArticle);
  return { indice, panier, marge, articles: Math.round(indice * p.tickets), margeDuMois: auCentime(p.tickets * marge), chiffreDAffaires: auCentime(p.tickets * panier) };
}

/**
 * Le mois à un nombre d'articles vendus donné, les passages en caisse et le prix moyen d'un article de
 * janvier gardés : le levier du laboratoire du panier. Au départ, les articles de janvier : le
 * laboratoire repart du mois que l'élève vient de lire, au centime près (audit pédagogique, P1-7 :
 * l'indice arrondi au centième donnait un panier de départ qui n'était pas celui de janvier).
 */
export function moisAuxArticles(f: FicheDeLaBoutique, articles: number) {
  const p = panierDuMois(f);
  const panier = auCentime((articles * p.prixMoyenDeLArticle) / p.tickets);
  const marge = auCentime((articles * p.margeMoyenneDeLArticle) / p.tickets);
  return { articles, indice: Math.round((articles / p.tickets) * 100) / 100, panier, marge, margeDuMois: auCentime(articles * p.margeMoyenneDeLArticle) };
}

/** Les bornes du levier des articles du laboratoire : un article par passage en caisse, jusqu'à l'indice le plus haut essayé. */
export const articlesEssayes = (f: FicheDeLaBoutique) => {
  const { tickets } = panierDuMois(f);
  return { min: Math.round(INDICES_ESSAYES.min * tickets), max: Math.round(INDICES_ESSAYES.max * tickets), pas: 1 };
};

/** Le plus petit nombre d'articles du mois qui porte le panier moyen à l'objectif. */
export function articlesPourLObjectif(f: FicheDeLaBoutique): number {
  const { min, max } = articlesEssayes(f);
  for (let n = min; n <= max; n++) if (moisAuxArticles(f, n).panier >= OBJECTIF_DE_PANIER) return n;
  throw new Error("Aucun nombre d'articles ne porte le panier à l'objectif");
}

/** Le plus petit indice de vente (au centième) qui porte le panier moyen à l'objectif. */
export function indicePourLObjectif(f: FicheDeLaBoutique): number {
  for (let i = Math.round(INDICES_ESSAYES.min * 100); i <= Math.round(INDICES_ESSAYES.max * 100); i++) if (moisALIndice(f, i / 100).panier >= OBJECTIF_DE_PANIER) return i / 100;
  throw new Error("Aucun indice ne porte le panier à l'objectif");
}

/** Deux mois côte à côte, et ce que la comparaison conclut (cas « Le panier de fin d'année »). */
export type BilanDeFinDAnnee = "rapporte-plus" | "pareil" | "panier-baisse" | "cout-monte";

/** En dessous de 1 % d'écart, le panier ou la marge « n'a pas bougé » (hypothèse du cas). */
export const SEUIL_DE_VARIATION = 0.01;

export function decembreFaceAJanvier(f: FicheDeLaBoutique) {
  const debut = panierDuMois(f, janvier(f));
  const fin = panierDuMois(f, DECEMBRE_N_MOINS_1);
  const ecartDuPanier = auCentime(fin.panier - debut.panier);
  const ecartDeLaMarge = auCentime(fin.marge - debut.marge);
  const bouge = (ecart: number, base: number) => Math.abs(ecart) > base * SEUIL_DE_VARIATION;
  const bilan: BilanDeFinDAnnee = !bouge(ecartDeLaMarge, debut.marge)
    ? "pareil"
    : ecartDeLaMarge > 0
      ? "rapporte-plus"
      : bouge(ecartDuPanier, debut.panier) && ecartDuPanier < 0
        ? "panier-baisse"
        : "cout-monte";
  return { debut, fin, ecartDuPanier, ecartDeLaMarge, bilan };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LE SUIVI DES VENTES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA RÈGLE DE L'OBJECTIF (hypothèse du cours) : l'objectif d'un trimestre, ce sont les ventes du
 * même trimestre de l'année d'avant, plus 5 %, arrondies à l'article du dessus. Le même trimestre,
 * pour que la saison (un trimestre 4 deux fois plus fort qu'un trimestre moyen) ne fausse pas
 * l'objectif. En pourcentage entier, pour qu'il se calcule sans erreur d'arrondi.
 */
export const PROGRESSION_EN_POURCENT = 5;

/** L'année suivie : N − 1, la dernière des trois années passées ; elle se compare à N − 2. */
export const ANNEE_SUIVIE = "N-1" as const;

/** Le trimestre suivi au chapitre : le quatrième, celui de Noël. */
export const TRIMESTRE_SUIVI = 4 as const;

/** L'objectif posé sur les ventes de l'année d'avant : arrondi à l'unité du dessus. */
export const objectifSur = (ventes: number, progression: number = PROGRESSION_EN_POURCENT) => plafond((ventes * (100 + progression)) / 100);

const auDixieme = (x: number) => Math.round(x * 10) / 10;

export type Verdict = "atteint" | "clients" | "service";

type AnneeSuivie = "N-2" | "N-1";
const ANNEE_D_AVANT: Record<AnneeSuivie, "N-3" | "N-2"> = { "N-2": "N-3", "N-1": "N-2" };

/** Le suivi d'un trimestre : son objectif, le réalisé, l'écart, la demande, et ce qui l'explique. */
export function suiviDuTrimestre(f: FicheDeLaBoutique, trimestre: 1 | 2 | 3 | 4 = TRIMESTRE_SUIVI, annee: AnneeSuivie = ANNEE_SUIVIE, progression: number = PROGRESSION_EN_POURCENT) {
  const lu = (a: string) => {
    const t = f.historique.find((x) => x.annee === a && x.trimestre === trimestre)!;
    return { ventes: t.ventes, demande: t.demande, repartis: t.demande - t.ventes };
  };
  const avant = lu(ANNEE_D_AVANT[annee]);
  const pendant = lu(annee);
  const objectif = objectifSur(avant.ventes, progression);
  const ecart = pendant.ventes - objectif;
  // D'abord l'objectif ; manqué, les clients venus, puis les clients servis. Les étiquettes n'ont pas changé.
  const verdict: Verdict = ecart >= 0 ? "atteint" : pendant.demande < objectif ? "clients" : "service";
  return {
    trimestre,
    annee,
    anneeDAvant: ANNEE_D_AVANT[annee],
    progression,
    avant,
    pendant,
    objectif,
    exact: (avant.ventes * (100 + progression)) / 100,
    ecart,
    ecartEnPourcentage: auDixieme((ecart / objectif) * 100),
    tauxDeRealisation: auDixieme((pendant.ventes / objectif) * 100),
    demandeFaceALObjectif: pendant.demande - objectif,
    verdict,
  };
}

export type Suivi = ReturnType<typeof suiviDuTrimestre>;

/** Le suivi des quatre trimestres d'une année. */
export const suiviDeLAnnee = (f: FicheDeLaBoutique, annee: AnneeSuivie = ANNEE_SUIVIE) => ([1, 2, 3, 4] as const).map((t) => suiviDuTrimestre(f, t, annee));

/** La plus forte progression (en % entier) que les ventes réalisées auraient atteinte. */
export function progressionAtteinte(f: FicheDeLaBoutique, trimestre: 1 | 2 | 3 | 4 = TRIMESTRE_SUIVI): number {
  const k = suiviDuTrimestre(f, trimestre);
  let p = 0;
  while (objectifSur(k.avant.ventes, p + 1) <= k.pendant.ventes) p++;
  return p;
}

/** Les articles de plus en réserve que l'élève essaie pour le trimestre suivi. */
export const RESERVE_ESSAYEE = { min: 0, max: 3_000, pas: 100 } as const;

/** Le trimestre suivi avec des articles de plus en réserve : les ventes montent jusqu'à la demande. */
export function trimestreAvecPlusDeReserve(f: FicheDeLaBoutique, enPlus: number) {
  const k = suiviDuTrimestre(f);
  const ventes = Math.min(k.pendant.demande, k.pendant.ventes + enPlus);
  return {
    enPlus,
    ventes,
    repartis: k.pendant.demande - ventes,
    objectif: k.objectif,
    tauxDeRealisation: auDixieme((ventes / k.objectif) * 100),
    tauxDeService: auDixieme((ventes / k.pendant.demande) * 100),
  };
}

/** Le moins d'articles de plus en réserve (sur le pas) qui sert toute la demande du trimestre suivi. */
export const reservePourTousLesServir = (f: FicheDeLaBoutique) => {
  const k = suiviDuTrimestre(f);
  return plafond(k.pendant.repartis / RESERVE_ESSAYEE.pas) * RESERVE_ESSAYEE.pas;
};

// ═════════════════════════════════════════════════════════════════════════════
// 7. LA FIDÉLITÉ
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES CLIENTES DE LA CARTE (hypothèse du cours) : une cliente fidèle passe en caisse une fois par
 * mois. Les 340 passages des clientes fidèles en janvier (la fiche) sont donc 340 clientes.
 */
export const PASSAGES_PAR_MOIS_D_UNE_FIDELE = 1;

/**
 * LES DÉPARTS (hypothèse du cours) : chaque mois, 5 % des clientes de la carte ne reviennent pas
 * (elles déménagent, achètent ailleurs, oublient la boutique). Le nombre se compte à l'unité la
 * plus proche.
 */
export const TAUX_DE_DEPART_PAR_MOIS = 0.05;

/** LES NOUVELLES CARTES (hypothèse du cours) : chaque mois, 15 passants prennent la carte de fidélité. */
export const NOUVELLES_CARTES_PAR_MOIS = 15;

/** Les taux de départ que l'élève essaie, en pourcentage entier. */
export const TAUX_ESSAYES = { min: 1, max: 10, pas: 1 } as const;

/** Les clientes de la carte en janvier, et ce que rapporte un de leurs passages. */
export function carteDeFidelite(f: FicheDeLaBoutique) {
  const fideles = f.clienteles.find((c) => c.code === "fideles")!;
  const k = comptesDe(f, [fideles]);
  const clientes = fideles.tickets / PASSAGES_PAR_MOIS_D_UNE_FIDELE;
  const margeDUnPassage = auCentime(k.marge / fideles.tickets);
  const margeDUnMois = auCentime(margeDUnPassage * PASSAGES_PAR_MOIS_D_UNE_FIDELE);
  return {
    clientes,
    ...k,
    margeDUnPassage,
    margeDUnMois,
    /** Une cliente gardée toute l'année : douze mois de marge. */
    margeDeLAnnee: auCentime(12 * margeDUnMois),
    /** Une cliente qui part après janvier : les onze mois qu'elle ne fait plus. */
    margePerdueSiEllePart: auCentime(11 * margeDUnMois),
  };
}

/** Un mois du fichier : celles du début, celles qui partent, celles qui reviennent, les nouvelles, celles de la fin. */
export function moisDuFichier(debut: number, taux: number = TAUX_DE_DEPART_PAR_MOIS, nouvelles: number = NOUVELLES_CARTES_PAR_MOIS) {
  const parties = Math.round(debut * taux);
  const revenues = debut - parties;
  return { debut, parties, revenues, nouvelles, fin: revenues + nouvelles };
}

/** Le fichier de la carte de février à décembre, depuis les clientes de janvier. */
export function anneeDuFichier(f: FicheDeLaBoutique, taux: number = TAUX_DE_DEPART_PAR_MOIS, nouvelles: number = NOUVELLES_CARTES_PAR_MOIS) {
  const mois: ReturnType<typeof moisDuFichier>[] = [];
  let n = carteDeFidelite(f).clientes;
  for (let i = 0; i < 11; i++) {
    const m = moisDuFichier(n, taux, nouvelles);
    mois.push(m);
    n = m.fin;
  }
  return { mois, fevrier: mois[0]!, finDeDecembre: n, depart: carteDeFidelite(f).clientes };
}

/** Le plus haut taux de départ (en % entier) qui garde au 31 décembre au moins les clientes de janvier. */
export function tauxQuiGardeLeFichier(f: FicheDeLaBoutique): number {
  let meilleur = 0;
  for (let t = TAUX_ESSAYES.min; t <= TAUX_ESSAYES.max; t++) if (anneeDuFichier(f, t / 100).finDeDecembre >= carteDeFidelite(f).clientes) meilleur = t;
  return meilleur;
}

/**
 * LA FERMETURE POUR TRAVAUX (hypothèse du cas « Les travaux de l'été ») : la boutique doit fermer
 * 15 jours, la moitié d'un mois, pour refaire sa vitrine, en mai ou en juillet. Pendant la
 * fermeture, elle perd les ventes de ces jours (au rythme du trimestre de l'année N − 1) ; et une
 * cliente fidèle sur cinq qui trouve porte close ne revient pas.
 */
export const JOURS_DE_FERMETURE = 15;
export const PART_DES_FIDELES_QUI_NE_REVIENNENT_PAS = 0.2;
export const MOIS_DES_TRAVAUX = { mai: 2, juillet: 3 } as const;

/** Ce que coûte la fermeture dans un mois du trimestre donné : les ventes perdues, les fidèles perdues. */
export function fermeturePourTravaux(f: FicheDeLaBoutique, trimestre: 1 | 2 | 3 | 4) {
  const t = f.historique.find((x) => x.annee === "N-1" && x.trimestre === trimestre)!;
  const carte = carteDeFidelite(f);
  const p = panierDuMois(f);
  const margeDUnArticle = auCentime(p.margeMoyenneDeLArticle);
  const parJour = auCentime(t.ventes / (3 * f.joursDuMois));
  const articlesPerdus = Math.round(parJour * JOURS_DE_FERMETURE);
  const fidelesAttendues = Math.round((carte.clientes * JOURS_DE_FERMETURE) / f.joursDuMois);
  const fidelesPerdues = Math.round(fidelesAttendues * PART_DES_FIDELES_QUI_NE_REVIENNENT_PAS);
  const margeDesVentes = auCentime(articlesPerdus * margeDUnArticle);
  const margeDesFideles = auCentime(fidelesPerdues * carte.margeDeLAnnee);
  return {
    trimestre,
    ventesDuTrimestre: t.ventes,
    joursDuTrimestre: 3 * f.joursDuMois,
    parJour,
    articlesPerdus,
    margeDUnArticle,
    margeDesVentes,
    fidelesAttendues,
    fidelesPerdues,
    margeDesFideles,
    total: auCentime(margeDesVentes + margeDesFideles),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. LA CONQUÊTE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES OFFRES DE L'AGENCE (hypothèse du cours) : une campagne de janvier (affiches, réseaux sociaux,
 * prospectus) fait entrer des passants de plus, de moins en moins par euro dépensé : 300 entrées
 * pour 1 000 €, 500 pour 2 000 €, 650 pour 4 000 €. Ces passants achètent comme ceux de janvier
 * (leur taux de transformation, leur panier, leur marge).
 */
export const OFFRES_DE_CAMPAGNE: readonly { budget: number; entrees: number }[] = [
  { budget: 0, entrees: 0 },
  { budget: 1_000, entrees: 300 },
  { budget: 2_000, entrees: 500 },
  { budget: 4_000, entrees: 650 },
];

/** La campagne du chapitre : 2 000 € (hypothèse du cours). */
export const CAMPAGNE_DU_CHAPITRE = 2_000;

/** La campagne plus forte du cas : 4 000 € (hypothèse du cas « Une campagne plus forte »). */
export const CAMPAGNE_PLUS_FORTE = 4_000;

/** LES NOUVEAUX QUI REVIENNENT (hypothèse du cours) : un client gagné sur cinq prend la carte et revient chaque mois. */
export const PART_DES_GAGNES_QUI_PRENNENT_LA_CARTE = 0.2;

/** Ce que fait un passant de janvier : il entre, passe en caisse ou non, laisse un panier et une marge. */
export function passantsDeJanvier(f: FicheDeLaBoutique) {
  const p = f.clienteles.find((c) => c.code === "passants")!;
  const k = comptesDe(f, [p]);
  return {
    entrees: p.entrees,
    ...k,
    tauxDeTransformation: p.tickets / p.entrees,
    panier: auCentime(k.chiffreDAffaires / p.tickets),
    margeDUneVente: auCentime(k.marge / p.tickets),
  };
}

/** Une campagne : les entrées, les ventes gagnées, ce qu'elles rapportent, et ce qu'elle laisse une fois payée. */
export function campagne(f: FicheDeLaBoutique, budget: number = CAMPAGNE_DU_CHAPITRE) {
  const offre = OFFRES_DE_CAMPAGNE.find((o) => o.budget === budget);
  if (!offre) throw new Error(`Pas d'offre de campagne à ${budget} €`);
  const p = passantsDeJanvier(f);
  const ventes = Math.round(offre.entrees * p.tauxDeTransformation);
  const marge = auCentime(ventes * p.margeDUneVente);
  const nouvellesFideles = Math.round(ventes * PART_DES_GAGNES_QUI_PRENNENT_LA_CARTE);
  return {
    budget,
    entrees: offre.entrees,
    ventes,
    chiffreDAffaires: auCentime(ventes * p.panier),
    marge,
    coutDUneVente: ventes > 0 ? auCentime(budget / ventes) : 0,
    laisse: auCentime(marge - budget),
    nouvellesFideles,
    margeDuMoisSuivant: auCentime(nouvellesFideles * carteDeFidelite(f).margeDUnMois),
  };
}

/** Les ventes gagnées qu'il faut pour payer une campagne, à la marge d'une vente d'un passant. */
export const ventesPourPayer = (f: FicheDeLaBoutique, budget: number = CAMPAGNE_DU_CHAPITRE) => plafond(budget / passantsDeJanvier(f).margeDUneVente);

/** L'offre qui laisse le plus une fois payée. */
export const meilleureCampagne = (f: FicheDeLaBoutique) => OFFRES_DE_CAMPAGNE.map((o) => campagne(f, o.budget)).reduce((a, b) => (b.laisse > a.laisse ? b : a));
