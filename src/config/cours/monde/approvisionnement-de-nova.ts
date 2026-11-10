import { COMPOSANTS_PAR_ENCEINTE, NOVA_GESTION } from "./nova-gestion";
import { DELAI_DU_FOURNISSEUR, JOURS_DE_SECURITE, anneeAvec, ficheDeNova, kitsDuTrimestre } from "./production-et-logistique";

/**
 * LE MONDE DU COURS : APPROVISIONNER NOVA AU MOINDRE COÛT (le chapitre « Approvisionner au moindre
 * coût » et son cas, DCG UE11 § 3.2, BUT GEA).
 *
 * LES JEUX DE COMPOSANTS DE NOVA EN N + 1. Une enceinte se monte avec un jeu de composants
 * (budgets-operationnels.ts, JEUX_PAR_ENCEINTE), acheté à Électro-Composants Lyon à 22 € hors taxes
 * (nova-gestion.ts, COMPOSANTS_PAR_ENCEINTE), livré 6 jours de montage après la commande
 * (production-et-logistique.ts, DELAI_DU_FOURNISSEUR). AUCUNE QUANTITÉ N'EST NOUVELLE :
 *   · la consommation de l'année est la production de N + 1 des chapitres de la capacité, 5 800,
 *     7 000, 6 200 et 7 000 enceintes (production-et-logistique.ts, `anneeAvec`), soit 26 000 jeux ;
 *   · la consommation d'un jour du 1er trimestre, 100 jeux, et celle du délai, 600 jeux, sont celles
 *     du chapitre « Le stock de sécurité » (`kitsDuTrimestre`) ;
 *   · la politique d'achat d'aujourd'hui est celle de l'exercice N : une commande par mois, livrée
 *     le 10 (exercice-de-nova.ts, ELECTRO_COMPOSANTS), soit 12 commandes par an.
 * Ce fichier n'ajoute que des hypothèses de coût (COUT_DE_PASSATION, POSSESSION), le tarif dégressif
 * du fournisseur (TARIF_DEGRESSIF) et la loi de la consommation pendant le délai (ALEA_DU_DELAI).
 *
 * LES RÈGLES DE CALCUL, celles d'un énoncé (le modèle de Wilson, sans pénurie) :
 *   · la demande est régulière et connue, la livraison instantanée : le stock descend de Q à 0, le
 *     stock moyen est Q ÷ 2 (plus le stock de sécurité, s'il y en a un) ;
 *   · n = D ÷ Q commandes par an ; coût de passation de l'année = n × cl ; coût de possession =
 *     stock moyen × cs, avec cs = taux de possession × prix + coût physique, par jeu et par an ;
 *   · Q* = √(2 D cl ÷ cs) ; à l'optimum, la passation égale la possession ;
 *   · face au tarif dégressif, le coût total d'approvisionnement ajoute le coût d'achat (D × prix) :
 *     chaque tranche s'étudie en Q* si Q* y tombe, sinon à sa borne ;
 *   · en avenir aléatoire, la consommation pendant le délai suit une loi normale ; le stock de
 *     sécurité est le plus petit qui laisse un risque de rupture par commande au plus égal au risque
 *     admis, à l'unité supérieure ; point de commande = consommation moyenne du délai + sécurité.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : cs, un montant par jeu, se donne au centime (2,58 € et non
 * 2,578 €) ; Q* s'écrit à deux décimales, puis se commande à l'unité la plus proche (le coût de
 * gestion est plat autour de l'optimum) ; une quantité D ÷ n se commande à l'unité supérieure, pour
 * que les n commandes couvrent l'année ; le nombre de commandes et la période qui en découlent se
 * donnent au centième.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** À l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);

const fiche = () => ficheDeNova({ code: NOVA_GESTION.code });

/** Les jeux que la ligne consommera en N + 1 : sa production de chaque trimestre (un jeu par enceinte). */
export function consommationDeNPlus1() {
  const trimestres = anneeAvec(fiche()).trimestres.map((t) => t.production);
  return { trimestres, annee: trimestres.reduce((t, x) => t + x, 0) };
}

/** Le prix d'un jeu au tarif de base, celui de toute l'année du cours. */
export const PRIX_DU_JEU = COMPOSANTS_PAR_ENCEINTE;

/**
 * LE COÛT DE PASSATION D'UNE COMMANDE (hypothèse du cours) : 200 €, la saisie et le suivi de la
 * commande, le contrôle de la livraison à réception, et le transport, facturé par livraison.
 */
export const COUT_DE_PASSATION = 200;

/**
 * LE COÛT DE POSSESSION (hypothèse du cours) : le taux de possession, 10 % l'an du prix d'achat (le
 * coût de l'argent immobilisé dans le stock), et le coût physique, 0,40 € par jeu et par an (la place
 * louée et l'assurance ; un jeu tient dans une boîte, une enceinte finie en coûte 6 € par an,
 * production-et-logistique.ts, COUT_DE_STOCKAGE_PAR_TRIMESTRE).
 */
export const POSSESSION = { taux: 0.1, physiqueParJeu: 0.4 } as const;

/** La politique d'aujourd'hui : une commande par mois, comme en N. */
export const COMMANDES_D_AUJOURD_HUI = 12;

/** Les semaines d'une année, pour dire la période entre deux commandes. */
export const SEMAINES_PAR_AN = 52;

/** Le coût de possession d'un jeu pendant un an, à un prix donné. */
export const coutDePossession = (prix: number = PRIX_DU_JEU) => auCentime(POSSESSION.taux * prix + POSSESSION.physiqueParJeu);

/** Le coût de gestion du stock pour une quantité commandée : passation, possession, total. */
export function coutDeGestion(quantite: number, prix: number = PRIX_DU_JEU, securite = 0, nombreDeCommandes?: number) {
  const D = consommationDeNPlus1().annee;
  const cs = coutDePossession(prix);
  const commandes = nombreDeCommandes ?? D / quantite;
  const stockMoyen = quantite / 2 + securite;
  const passation = auCentime(commandes * COUT_DE_PASSATION);
  const possession = auCentime(stockMoyen * cs);
  return { D, quantite, prix, cs, commandes, stockMoyen, passation, possession, total: auCentime(passation + possession) };
}

/** Le même coût, pour un nombre de commandes par an : la quantité de chacune est D ÷ n. */
export const coutPourNCommandes = (n: number) => coutDeGestion(plafond(consommationDeNPlus1().annee / n), PRIX_DU_JEU, 0, n);

/** LE MODÈLE DE WILSON : Q* = √(2 D cl ÷ cs), n* = D ÷ Q*, T* en semaines, et le coût de gestion à l'optimum. */
export function wilson(prix: number = PRIX_DU_JEU) {
  const D = consommationDeNPlus1().annee;
  const cs = coutDePossession(prix);
  /** Q* à deux décimales, puis à l'unité : on commande des jeux entiers. */
  const quantiteExacte = auCentime(Math.sqrt((2 * D * COUT_DE_PASSATION) / cs));
  const quantite = Math.round(quantiteExacte);
  const c = coutDeGestion(quantite, prix);
  const commandes = auCentime(D / quantite);
  return { ...c, quantiteExacte, quantite, commandes, semaines: auCentime(SEMAINES_PAR_AN / commandes) };
}

/** Le nombre de commandes par an, entier, qui rend le coût de gestion le plus faible. */
export function meilleurNombreDeCommandes(max = 26) {
  let meilleur = 1;
  for (let n = 1; n <= max; n++) if (coutPourNCommandes(n).total < coutPourNCommandes(meilleur).total - 1e-9) meilleur = n;
  return meilleur;
}

/** Une tranche du tarif : à partir de combien de jeux commandés en une fois, et le prix du jeu. */
export interface TrancheDuTarif {
  des: number;
  prix: number;
  remise: number;
}

/**
 * LE TARIF DÉGRESSIF D'ÉLECTRO-COMPOSANTS (hypothèse du cours) : 22 € le jeu sous 2 600 jeux par
 * commande, 1 % de remise de 2 600 à 6 499 jeux (21,78 €), 1,5 % à partir de 6 500 jeux (21,67 €).
 * Les seuils sont des lots du fournisseur : 2 600 jeux, une commande sur 10 ; 6 500, une sur 4.
 */
export const TARIF_DEGRESSIF: readonly TrancheDuTarif[] = [
  { des: 0, prix: PRIX_DU_JEU, remise: 0 },
  { des: 2_600, prix: auCentime(PRIX_DU_JEU * 0.99), remise: 0.01 },
  { des: 6_500, prix: auCentime(PRIX_DU_JEU * 0.985), remise: 0.015 },
];

/** Le prix du jeu pour une quantité commandée en une fois. */
export const prixPourLaQuantite = (quantite: number, tarif: readonly TrancheDuTarif[] = TARIF_DEGRESSIF) => [...tarif].reverse().find((t) => quantite >= t.des - 1e-9)!.prix;

/** Le coût total d'approvisionnement d'une quantité : l'achat de l'année au prix de sa tranche, et la gestion du stock. */
export function coutTotalDApprovisionnement(quantite: number, tarif: readonly TrancheDuTarif[] = TARIF_DEGRESSIF) {
  const prix = prixPourLaQuantite(quantite, tarif);
  const g = coutDeGestion(quantite, prix);
  const achat = auCentime(g.D * prix);
  return { ...g, achat, totalDApprovisionnement: auCentime(achat + g.total) };
}

/**
 * LE TABLEAU DES TRANCHES : pour chacune, le Q* de son prix ; s'il tombe dans la tranche, on le
 * retient, sinon la borne de la tranche la plus proche ; puis le coût total d'approvisionnement.
 */
export function tableauDesTranches(tarif: readonly TrancheDuTarif[] = TARIF_DEGRESSIF) {
  const D = consommationDeNPlus1().annee;
  const lignes = tarif.map((t, i) => {
    const haut = tarif[i + 1] ? tarif[i + 1]!.des - 1 : D;
    const w = wilson(t.prix);
    const dedans = w.quantite >= t.des && w.quantite <= haut;
    const retenue = dedans ? w.quantite : w.quantite < t.des ? t.des : haut;
    const c = coutTotalDApprovisionnement(retenue, tarif);
    return { tranche: t, haut, qEtoileExacte: w.quantiteExacte, qEtoile: w.quantite, dedans, retenue, ...c };
  });
  const meilleure = lignes.reduce((m, l) => (l.totalDApprovisionnement < m.totalDApprovisionnement ? l : m));
  return { lignes, meilleure };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'AVENIR ALÉATOIRE : LE STOCK DE SÉCURITÉ PAR LA LOI NORMALE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA CONSOMMATION PENDANT LE DÉLAI (hypothèse du cours) : au 1er trimestre, la ligne consomme en
 * moyenne 600 jeux pendant les 6 jours du délai (kitsDuTrimestre) ; d'une commande à l'autre, elle
 * s'en écarte selon les commandes des clients, suivant une loi normale d'écart type 50 jeux.
 * NOVA admet un risque de rupture de 5 % par commande.
 */
export const ALEA_DU_DELAI = { ecartType: 50, risqueAdmis: 0.05 } as const;

/**
 * LES VALEURS DE LA TABLE DE LA LOI NORMALE CENTRÉE RÉDUITE que l'élève lit : la valeur t telle que
 * P(T ≤ t) vaut le taux de service.
 */
export const TABLE_DE_LA_LOI_NORMALE: readonly { service: number; t: number }[] = [
  { service: 0.9, t: 1.28 },
  { service: 0.95, t: 1.645 },
  { service: 0.975, t: 1.96 },
  { service: 0.99, t: 2.33 },
];

/** La fonction de répartition de la loi normale centrée réduite (approximation d'Abramowitz et Stegun, à 10⁻⁷). */
export function repartitionNormale(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/** La consommation pendant le délai : sa moyenne (celle du chapitre « Le stock de sécurité ») et son écart type. */
export function consommationDuDelai() {
  const k = kitsDuTrimestre(fiche(), 1);
  return { parJour: k.parJour, delai: DELAI_DU_FOURNISSEUR, moyenne: k.pendantLeDelai, ecartType: ALEA_DU_DELAI.ecartType };
}

/** Le risque de rupture d'une commande avec un stock de sécurité donné : P(consommation du délai > moyenne + sécurité). */
export function risqueDeRupture(securite: number) {
  const c = consommationDuDelai();
  return 1 - repartitionNormale(securite / c.ecartType);
}

/** Le plus petit stock de sécurité, à l'unité, qui tient le risque admis. */
export function securiteAuRisque(risque: number = ALEA_DU_DELAI.risqueAdmis) {
  let s = 0;
  while (risqueDeRupture(s) > risque + 1e-12) s++;
  return s;
}

/** Le stock de sécurité par la table : t × écart type, à l'unité supérieure, le point de commande et ce que le stock coûte à posséder. */
export function securiteParLaTable(service: number = 1 - ALEA_DU_DELAI.risqueAdmis, prix: number = tableauDesTranches().meilleure.prix) {
  const c = consommationDuDelai();
  const t = TABLE_DE_LA_LOI_NORMALE.find((x) => Math.abs(x.service - service) < 1e-9)!.t;
  const brut = t * c.ecartType;
  const securite = plafond(brut);
  const cs = coutDePossession(prix);
  return { ...c, service, t, brut, securite, pointDeCommande: c.moyenne + securite, cs, coutAnnuel: auCentime(securite * cs) };
}

/** Le stock de sécurité de 3 jours du chapitre « Le stock de sécurité », vu par la loi normale. */
export function troisJoursFaceALaLoi(prix: number = tableauDesTranches().meilleure.prix) {
  const c = consommationDuDelai();
  const securite = c.parJour * JOURS_DE_SECURITE;
  return { jours: JOURS_DE_SECURITE, securite, z: securite / c.ecartType, risque: risqueDeRupture(securite), coutAnnuel: auCentime(securite * coutDePossession(prix)) };
}

/** Les ruptures attendues sur une année : le nombre de commandes × le risque de chacune. */
export const rupturesParAn = (commandes: number, risque: number) => commandes * risque;
