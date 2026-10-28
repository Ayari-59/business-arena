import { auCentime, joursCompris, JOURS_DU_MOIS, planDAmortissement, rangDuJour, type DateDuCours, type ModeDAmortissement } from "./amortissement";
import { interetsCourus } from "./emprunt";
import type { FicheDeLExercice, LigneDeBalance } from "./exercice-de-nova";
import { valoriserLeStock, type MethodeDeStock } from "./stock";

/**
 * LE MODÈLE DE LA CLÔTURE DU COURS : les travaux d'inventaire, l'impôt sur les sociétés, le compte
 * de résultat et le bilan, puis leur analyse (soldes intermédiaires de gestion, capacité
 * d'autofinancement, bilan fonctionnel).
 *
 * Tout part de la fiche (monde/exercice-de-nova.ts) et de leviers : `cloture(fiche, leviers)` est une
 * fonction pure, que chaque laboratoire lit avec ses propres leviers (le mode d'amortissement, la
 * méthode de stock, la perte probable, la provision, le taux réduit, les délais, les travaux
 * oubliés). La comptabilité est tenue pour de vrai : la balance avant inventaire, puis chaque
 * travail en partie double, puis l'impôt ; le compte de résultat lit les classes 6 et 7, le bilan
 * les classes 1 à 5. Un bilan équilibré n'est donc pas une hypothèse : la garde le constate.
 *
 *   1. LES TRAVAUX D'INVENTAIRE, dans l'ordre du cours : la dotation aux amortissements
 *      (monde/amortissement.ts) ; le stock final (monde/stock.ts) ; la facture non parvenue ; la
 *      créance douteuse, reclassée (416) puis dépréciée sur son hors taxes ; la provision pour
 *      litige ; la charge constatée d'avance ; la facture à établir ; le produit constaté d'avance ;
 *      les intérêts courus (monde/emprunt.ts) ; les intérêts courus du placement, un produit à recevoir.
 *   2. L'IMPÔT SUR LES SOCIÉTÉS : 15 % jusqu'au plafond du taux réduit, 25 % au-delà, sur le
 *      résultat fiscal (le résultat avant impôt plus les réintégrations), arrondi à l'euro ; une
 *      perte ne paie rien.
 *   3. LES SOLDES INTERMÉDIAIRES DE GESTION, complets (marge commerciale, production, valeur ajoutée,
 *      EBE, résultat d'exploitation, résultat financier, résultat courant avant impôt, résultat
 *      exceptionnel, résultat net, plus ou moins-values de cession), avec deux retraitements au
 *      choix : le personnel extérieur rangé avec le personnel, le crédit-bail traité comme un achat
 *      financé par emprunt.
 *   4. LA CAPACITÉ D'AUTOFINANCEMENT par ses deux méthodes : additive (résultat net + dotations −
 *      reprises − produits de cession + valeur nette des actifs cédés) et soustractive (EBE + autres
 *      produits − autres charges + produits financiers encaissables − charges financières
 *      décaissables ± exceptionnel encaissable − participation − impôt).
 *   5. LE BILAN FONCTIONNEL : emplois stables (immobilisations brutes), ressources stables
 *      (capitaux propres, amortissements, dépréciations, provisions, dettes financières hors
 *      intérêts courus), fonds de roulement net global, besoin en fonds de roulement d'exploitation
 *      et hors exploitation (l'impôt dû et les intérêts courus), trésorerie nette ; et le besoin
 *      normatif, en jours, avec les délais en paramètres.
 *
 * LES DÉLAIS comme leviers : changer le délai de CampusTech ou du fournisseur change les factures
 * encore dues au 31 décembre, et la banque d'autant (ce qui n'est pas encaissé n'est pas en banque) ;
 * le résultat ne bouge pas.
 *
 * CONVENTION : une ligne de solde est débitrice positive, créditrice négative ; les montants sont au
 * centime.
 */

/** Les soldes des comptes : débiteur positif, créditeur négatif. */
export type Soldes = Readonly<Record<string, number>>;

export interface LigneDEcriture {
  compte: string;
  debit: number;
  credit: number;
}

const commencePar = (compte: string, prefixes: readonly string[]) => prefixes.some((p) => compte.startsWith(p));

/** La somme des soldes des comptes dont le numéro commence par un des préfixes, hors exclus (débit positif). */
export function sommeDesComptes(s: Soldes, prefixes: readonly string[], sauf: readonly string[] = []) {
  return auCentime(Object.entries(s).reduce((t, [c, v]) => (commencePar(c, prefixes) && !commencePar(c, sauf) ? t + v : t), 0));
}

/** Les soldes d'une balance. */
export function soldesDeLaBalance(balance: readonly LigneDeBalance[]): Record<string, number> {
  const s: Record<string, number> = {};
  for (const l of balance) s[l.compte] = auCentime((s[l.compte] ?? 0) + l.debit - l.credit);
  return s;
}

/** Les soldes après une écriture. */
export function passer(s: Soldes, lignes: readonly LigneDEcriture[]): Record<string, number> {
  const r: Record<string, number> = { ...s };
  for (const l of lignes) r[l.compte] = auCentime((r[l.compte] ?? 0) + l.debit - l.credit);
  return r;
}

/** Le résultat que portent les classes 6 et 7 : les produits moins les charges. */
export const resultatDesSoldes = (s: Soldes) => auCentime(-sommeDesComptes(s, ["6", "7"]));

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES TRAVAUX D'INVENTAIRE, UN PAR UN
// ═════════════════════════════════════════════════════════════════════════════

/** Un montant hors taxes, sa TVA et son toutes taxes comprises (une facture non parvenue ou à établir). */
export function avecLaTva(ht: number, tauxDeTva: number) {
  const tva = auCentime(ht * tauxDeTva);
  return { ht, tva, ttc: auCentime(ht + tva) };
}

/**
 * LA CHARGE CONSTATÉE D'AVANCE d'une charge payée pour une durée en mois à partir d'une date : la
 * part des jours de couverture qui tombe après la clôture (mois de 30 jours).
 */
export function chargeConstateeDAvance(montant: number, debut: DateDuCours, moisCouverts: number, cloture: DateDuCours) {
  const total = moisCouverts * JOURS_DU_MOIS;
  const dansLExercice = Math.min(total, joursCompris(debut, cloture));
  const apres = total - dansLExercice;
  return { joursDansLExercice: dansLExercice, joursApres: apres, moisApres: apres / JOURS_DU_MOIS, chargeDeLExercice: auCentime((montant * dansLExercice) / total), montant: auCentime((montant * apres) / total) };
}

/** LES INTÉRÊTS COURUS D'UN PLACEMENT à une date : montant × taux × jours depuis le dépôt (jours compris) ÷ 360. */
export function interetsDuPlacement(montant: number, tauxAnnuel: number, depot: DateDuCours, date: DateDuCours) {
  return auCentime((montant * tauxAnnuel * joursCompris(depot, date)) / 360);
}

/** LA DÉPRÉCIATION D'UNE CRÉANCE DOUTEUSE : sur son hors taxes, au taux de perte probable. */
export function depreciationDeCreance(ttc: number, tauxDeTva: number, tauxDePerte: number) {
  const ht = auCentime(ttc / (1 + tauxDeTva));
  return { ttc, ht, tva: auCentime(ttc - ht), depreciation: auCentime(ht * tauxDePerte), valeurNette: auCentime(ttc - ht * tauxDePerte) };
}

/** L'AJUSTEMENT D'UNE DÉPRÉCIATION à une estimation nouvelle : un complément à doter, ou une reprise. */
export function ajustementDeDepreciation(dejaConstatee: number, necessaire: number) {
  const ecart = auCentime(necessaire - dejaConstatee);
  return { dotation: Math.max(0, ecart), reprise: Math.max(0, -ecart) };
}

/**
 * LA CRÉANCE QUI SE DÉNOUE : le client (ou son liquidateur) verse une part ; le reste est perdu
 * hors taxes (compte 654), l'État rend la TVA de la part perdue, la dépréciation se reprend.
 */
export function perteSurCreance(ttc: number, encaisse: number, tauxDeTva: number, depreciationConstatee: number) {
  const perteTtc = auCentime(ttc - encaisse);
  const perteHt = auCentime(perteTtc / (1 + tauxDeTva));
  return { encaisse, perteTtc, perteHt, tvaRecuperee: auCentime(perteTtc - perteHt), reprise: depreciationConstatee, chargeNette: auCentime(perteHt - depreciationConstatee) };
}

/** Les factures dont le paiement tombe après la clôture, pour un délai donné : ce qui reste dû. */
export function facturesEnCours(factures: readonly { date: DateDuCours; ttc: number }[], delai: number, cloture: DateDuCours) {
  const fin = rangDuJour(cloture);
  const dues = factures.filter((f) => rangDuJour(f.date) + delai > fin);
  return { factures: dues, montant: auCentime(dues.reduce((t, f) => t + f.ttc, 0)) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. L'IMPÔT SUR LES SOCIÉTÉS
// ═════════════════════════════════════════════════════════════════════════════

export interface BaremeDeLImpot {
  tauxReduit: number;
  plafondDuTauxReduit: number;
  tauxNormal: number;
  eligibleAuTauxReduit: boolean;
}

/** L'impôt sur les sociétés d'un résultat fiscal : le taux réduit jusqu'au plafond, le taux normal au-delà, arrondi à l'euro. */
export function impotSurLesSocietes(resultatFiscal: number, b: BaremeDeLImpot) {
  if (resultatFiscal <= 0) return { resultatFiscal, baseAuTauxReduit: 0, baseAuTauxNormal: 0, aTauxReduit: 0, aTauxNormal: 0, exact: 0, impot: 0 };
  const baseAuTauxReduit = b.eligibleAuTauxReduit ? Math.min(resultatFiscal, b.plafondDuTauxReduit) : 0;
  const baseAuTauxNormal = auCentime(resultatFiscal - baseAuTauxReduit);
  const aTauxReduit = auCentime(baseAuTauxReduit * b.tauxReduit);
  const aTauxNormal = auCentime(baseAuTauxNormal * b.tauxNormal);
  const exact = auCentime(baseAuTauxReduit * b.tauxReduit + baseAuTauxNormal * b.tauxNormal);
  return { resultatFiscal, baseAuTauxReduit, baseAuTauxNormal, aTauxReduit, aTauxNormal, exact, impot: Math.round(exact) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA CLÔTURE DE L'EXERCICE
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDeTravail =
  | "dotation"
  | "stock"
  | "factureNonParvenue"
  | "creanceDouteuse"
  | "provision"
  | "chargeConstateeDAvance"
  | "factureAEtablir"
  | "produitConstateDAvance"
  | "interetsCourus"
  | "interetsDuPlacement";

export interface Travail {
  code: CodeDeTravail;
  libelle: string;
  /** Le montant que le travail rattache ou retire (hors taxes). */
  montant: number;
  lignes: LigneDEcriture[];
  /** Ce que le travail change au résultat : positif s'il l'augmente. */
  effetSurLeResultat: number;
}

/** Les leviers d'un laboratoire de clôture. */
export interface LeviersDeLaCloture {
  modeDAmortissement: ModeDAmortissement;
  methodeDeStock: MethodeDeStock;
  /** La perte probable estimée sur la créance litigieuse, en part de son hors taxes. */
  tauxDePerteProbable: number;
  provisionPourLitige: number;
  eligibleAuTauxReduit: boolean;
  /** Le délai de paiement de CampusTech, en jours. */
  delaiCampusTech: number;
  /** Le délai de paiement accordé par Électro-Composants, en jours. */
  delaiFournisseur: number;
  /** Les travaux que le comptable n'a pas passés (le laboratoire des oublis). */
  travauxOublies: readonly CodeDeTravail[];
  /** Les charges non déductibles que l'impôt réintègre au résultat fiscal. */
  reintegrationsFiscales: number;
  /** Le taux annuel du compte à terme. */
  tauxDuPlacement: number;
}

/** Les leviers de la fiche : ce que la fiche a retenu. */
export function leviersDeLaFiche(f: FicheDeLExercice): LeviersDeLaCloture {
  return {
    modeDAmortissement: f.equipement.mode,
    methodeDeStock: f.methodeDeStock,
    tauxDePerteProbable: f.sonora.redressement.tauxDePerteProbable,
    provisionPourLitige: f.litige.montantProbable,
    eligibleAuTauxReduit: f.impot.eligibleAuTauxReduit,
    delaiCampusTech: f.campustech.delai,
    delaiFournisseur: f.fournisseur.delai,
    travauxOublies: [],
    reintegrationsFiscales: 0,
    tauxDuPlacement: f.placement.tauxAnnuel,
  };
}

/** Les factures de l'année de CampusTech, le 20 de chaque mois, toutes taxes comprises. */
export function facturesDeCampusTech(f: FicheDeLExercice) {
  const ttc = avecLaTva(f.campustech.enceintesParFacture * f.prixDeLEnceinte, f.tauxDeTva).ttc;
  return f.livraisons.map((_, m) => ({ date: { jour: f.campustech.jourDeFacturation, mois: m + 1 } as DateDuCours, ttc }));
}

/** Les factures de l'année d'Électro-Composants, le 10 de chaque mois, toutes taxes comprises. */
export function facturesDuFournisseur(f: FicheDeLExercice) {
  return f.facturesDeComposantsHt.map((ht, m) => ({ date: { jour: f.fournisseur.jourDeFacturation, mois: m + 1 } as DateDuCours, ttc: avecLaTva(ht, f.tauxDeTva).ttc }));
}

/**
 * La balance avant inventaire avec les délais des leviers : les créances sur CampusTech et la dette
 * envers le fournisseur au 31 décembre, et la banque qui en est le complément.
 */
export function balanceAvecLesDelais(f: FicheDeLExercice, delaiCampusTech: number, delaiFournisseur: number): LigneDeBalance[] {
  const clients = facturesEnCours(facturesDeCampusTech(f), delaiCampusTech, f.cloture).montant - facturesEnCours(facturesDeCampusTech(f), f.campustech.delai, f.cloture).montant;
  const fournisseur = facturesEnCours(facturesDuFournisseur(f), delaiFournisseur, f.cloture).montant - facturesEnCours(facturesDuFournisseur(f), f.fournisseur.delai, f.cloture).montant;
  return f.balanceAvantInventaire.map((l) => {
    if (l.compte === "411") return { ...l, debit: auCentime(l.debit + clients) };
    if (l.compte === "401") return { ...l, credit: auCentime(l.credit + fournisseur) };
    if (l.compte === "512") {
      const solde = auCentime(l.debit - l.credit - clients + fournisseur);
      return { ...l, debit: Math.max(0, solde), credit: Math.max(0, -solde) };
    }
    return l;
  });
}

/** Les travaux d'inventaire de la fiche, avec les leviers : chacun, son écriture et son effet sur le résultat. */
export function travauxDInventaire(f: FicheDeLExercice, l: LeviersDeLaCloture): Travail[] {
  const tva = f.tauxDeTva;
  const travaux: Omit<Travail, "effetSurLeResultat">[] = [];

  const dotation = planDAmortissement(f.immobilisation, l.modeDAmortissement)[0]!.dotation;
  travaux.push({
    code: "dotation",
    libelle: "la dotation aux amortissements de la ligne",
    montant: dotation,
    lignes: [
      { compte: "6811", debit: dotation, credit: 0 },
      { compte: f.equipement.compteDAmortissement, debit: 0, credit: dotation },
    ],
  });

  const stock = valoriserLeStock(f.composantsDeDecembre, l.methodeDeStock);
  const initial = f.composantsDeDecembre.initial.valeur;
  travaux.push({
    code: "stock",
    libelle: "le stock final de composants",
    montant: stock.final.valeur,
    lignes: [
      ...(initial > 0
        ? [
            { compte: "6031", debit: initial, credit: 0 },
            { compte: "31", debit: 0, credit: initial },
          ]
        : []),
      { compte: "31", debit: stock.final.valeur, credit: 0 },
      { compte: "6031", debit: 0, credit: stock.final.valeur },
    ],
  });

  const fnp = avecLaTva(f.factureNonParvenue.ht, tva);
  travaux.push({
    code: "factureNonParvenue",
    libelle: "la facture non parvenue de Composants Express",
    montant: fnp.ht,
    lignes: [
      { compte: "601", debit: fnp.ht, credit: 0 },
      { compte: "44586", debit: fnp.tva, credit: 0 },
      { compte: "408", debit: 0, credit: fnp.ttc },
    ],
  });

  const litigieuse = f.creances.find((c) => c.litigieuse)!;
  const dep = depreciationDeCreance(litigieuse.ttc, tva, l.tauxDePerteProbable);
  travaux.push({
    code: "creanceDouteuse",
    libelle: `la créance de ${litigieuse.client}, reclassée en douteuse et dépréciée`,
    montant: dep.depreciation,
    lignes: [
      { compte: "416", debit: litigieuse.ttc, credit: 0 },
      { compte: "411", debit: 0, credit: litigieuse.ttc },
      { compte: "6817", debit: dep.depreciation, credit: 0 },
      { compte: "491", debit: 0, credit: dep.depreciation },
    ],
  });

  travaux.push({
    code: "provision",
    libelle: "la provision pour litige",
    montant: l.provisionPourLitige,
    lignes: [
      { compte: "6815", debit: l.provisionPourLitige, credit: 0 },
      { compte: "1511", debit: 0, credit: l.provisionPourLitige },
    ],
  });

  const cca = chargeConstateeDAvance(f.assurance.prime, f.assurance.date, f.assurance.moisCouverts, f.cloture).montant;
  travaux.push({
    code: "chargeConstateeDAvance",
    libelle: "la part de la prime d'assurance qui couvre N+1",
    montant: cca,
    lignes: [
      { compte: "486", debit: cca, credit: 0 },
      { compte: "616", debit: 0, credit: cca },
    ],
  });

  const fae = avecLaTva(f.commandeUrgenteDeDecembre.enceintes * f.prixDeLEnceinte, tva);
  travaux.push({
    code: "factureAEtablir",
    libelle: "la commande urgente de CampusTech, livrée, pas encore facturée",
    montant: fae.ht,
    lignes: [
      { compte: "418", debit: fae.ttc, credit: 0 },
      { compte: "701", debit: 0, credit: fae.ht },
      { compte: "44587", debit: 0, credit: fae.tva },
    ],
  });

  const pca = auCentime(f.livraisonDiffereeDeDecembre.enceintes * f.prixDeLEnceinte);
  travaux.push({
    code: "produitConstateDAvance",
    libelle: "les enceintes facturées à CampusTech, livrées en janvier",
    montant: pca,
    lignes: [
      { compte: "701", debit: pca, credit: 0 },
      { compte: "487", debit: 0, credit: pca },
    ],
  });

  const icne = interetsCourus(f.pret, f.cloture).montant;
  travaux.push({
    code: "interetsCourus",
    libelle: "les intérêts courus de l'emprunt",
    montant: icne,
    lignes: [
      { compte: "6611", debit: icne, credit: 0 },
      { compte: "1688", debit: 0, credit: icne },
    ],
  });

  // Les intérêts du placement, courus depuis le jour du dépôt (jour compris), à recevoir à l'échéance.
  const placement = interetsDuPlacement(f.placement.montant, l.tauxDuPlacement, f.placement.date, f.cloture);
  travaux.push({
    code: "interetsDuPlacement",
    libelle: "les intérêts courus du compte à terme, à recevoir",
    montant: placement,
    lignes: [
      { compte: f.placement.compteDesInteretsCourus, debit: placement, credit: 0 },
      { compte: f.placement.compteDeProduit, debit: 0, credit: placement },
    ],
  });

  return travaux.map((t) => ({ ...t, effetSurLeResultat: resultatDesSoldes(passer({}, t.lignes)) }));
}

/** LA CLÔTURE DE L'EXERCICE, avec ses leviers : la balance, les travaux, l'impôt, les états et leur analyse. */
export function cloture(f: FicheDeLExercice, leviers: Partial<LeviersDeLaCloture> = {}) {
  const l: LeviersDeLaCloture = { ...leviersDeLaFiche(f), ...leviers };
  const balance = balanceAvecLesDelais(f, l.delaiCampusTech, l.delaiFournisseur);
  const avant = soldesDeLaBalance(balance);
  const resultatAvantInventaire = resultatDesSoldes(avant);
  const tous = travauxDInventaire(f, l);
  const passes = tous.filter((t) => !l.travauxOublies.includes(t.code));
  const apresTravaux = passes.reduce<Record<string, number>>((s, t) => passer(s, t.lignes), avant);
  const resultatAvantImpot = resultatDesSoldes(apresTravaux);
  const impot = impotSurLesSocietes(auCentime(resultatAvantImpot + l.reintegrationsFiscales), { ...f.impot, eligibleAuTauxReduit: l.eligibleAuTauxReduit });
  const soldes = passer(apresTravaux, [
    { compte: "695", debit: impot.impot, credit: 0 },
    { compte: "444", debit: 0, credit: impot.impot },
  ]);
  const resultatNet = resultatDesSoldes(soldes);
  const sig = soldesIntermediaires(soldes);
  return {
    leviers: l,
    balance,
    soldesAvantInventaire: avant as Soldes,
    resultatAvantInventaire,
    travaux: passes,
    travauxOublies: tous.filter((t) => l.travauxOublies.includes(t.code)),
    resultatAvantImpot,
    impot,
    resultatNet,
    soldes: soldes as Soldes,
    compteDeResultat: compteDeResultat(soldes),
    bilanAvantInventaire: bilanComptable(avant, resultatAvantInventaire),
    bilan: bilanComptable(soldes, resultatNet),
    sig,
    caf: capaciteDAutofinancement(soldes),
    fonctionnel: bilanFonctionnel(soldes, resultatNet),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE COMPTE DE RÉSULTAT ET LE BILAN
// ═════════════════════════════════════════════════════════════════════════════

/** Le compte de résultat, par nature : exploitation, financier, exceptionnel, participation et impôt. */
export function compteDeResultat(s: Soldes) {
  const produits = {
    exploitation: auCentime(-sommeDesComptes(s, ["70", "71", "72", "74", "75", "781", "791"])),
    financiers: auCentime(-sommeDesComptes(s, ["76", "786", "796"])),
    exceptionnels: auCentime(-sommeDesComptes(s, ["77", "787", "797"])),
  };
  const charges = {
    exploitation: sommeDesComptes(s, ["60", "61", "62", "63", "64", "65", "681"]),
    financieres: sommeDesComptes(s, ["66", "686"]),
    exceptionnelles: sommeDesComptes(s, ["67", "687"]),
    participation: sommeDesComptes(s, ["691"]),
    impot: sommeDesComptes(s, ["695", "696", "697", "698", "699"]),
  };
  const totalProduits = auCentime(produits.exploitation + produits.financiers + produits.exceptionnels);
  const totalCharges = auCentime(Object.values(charges).reduce((t, x) => t + x, 0));
  const detail = Object.entries(s)
    .filter(([c, v]) => (c.startsWith("6") || c.startsWith("7")) && v !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([compte, v]) => ({ compte, montant: compte.startsWith("7") ? auCentime(-v) : v }));
  return { produits, charges, totalProduits, totalCharges, resultat: auCentime(totalProduits - totalCharges), detail };
}

/** Un compte de classe 4 qui n'est ni un client, ni une régularisation, ni une dépréciation. */
const tiersDivers = (c: string) => c.startsWith("4") && !commencePar(c, ["41", "486", "487", "49"]);

/** Le bilan comptable : l'actif en brut, amortissements et net ; le passif, résultat compris. */
export function bilanComptable(s: Soldes, resultat: number) {
  const entrees = Object.entries(s);
  const debiteurs = (filtre: (c: string) => boolean) => auCentime(entrees.reduce((t, [c, v]) => (filtre(c) && v > 0 ? t + v : t), 0));
  const crediteurs = (filtre: (c: string) => boolean) => auCentime(entrees.reduce((t, [c, v]) => (filtre(c) && v < 0 ? t - v : t), 0));
  const immobilisationsBrutes = sommeDesComptes(s, ["2"], ["28", "29"]);
  const amortissements = auCentime(-sommeDesComptes(s, ["28", "29"]));
  const stocksBruts = sommeDesComptes(s, ["3"], ["39"]);
  const depreciationDesStocks = auCentime(-sommeDesComptes(s, ["39"]));
  const clientsBruts = sommeDesComptes(s, ["41"]);
  const depreciationDesClients = auCentime(-sommeDesComptes(s, ["49"]));
  const actif = {
    immobilisations: { brut: immobilisationsBrutes, amortissements, net: auCentime(immobilisationsBrutes - amortissements) },
    stocks: { brut: stocksBruts, depreciation: depreciationDesStocks, net: auCentime(stocksBruts - depreciationDesStocks) },
    clients: { brut: clientsBruts, depreciation: depreciationDesClients, net: auCentime(clientsBruts - depreciationDesClients) },
    autresCreances: debiteurs(tiersDivers),
    /** Les placements de trésorerie (classe 50) et leurs intérêts courus. */
    valeursMobilieresDePlacement: debiteurs((c) => c.startsWith("50")),
    disponibilites: debiteurs((c) => c.startsWith("5") && !c.startsWith("50")),
    chargesConstateesDAvance: sommeDesComptes(s, ["486"]),
  };
  const capital = auCentime(-sommeDesComptes(s, ["10", "11", "12", "13", "14"]));
  const passif = {
    capitauxPropres: { capital, resultat, total: auCentime(capital + resultat) },
    provisions: auCentime(-sommeDesComptes(s, ["15"])),
    emprunts: auCentime(-sommeDesComptes(s, ["16", "17"]) + crediteurs((c) => c.startsWith("5"))),
    fournisseurs: crediteurs((c) => c.startsWith("40")),
    dettesFiscalesEtSociales: crediteurs((c) => commencePar(c, ["42", "43", "44"])),
    autresDettes: crediteurs((c) => tiersDivers(c) && !commencePar(c, ["40", "42", "43", "44"])),
    produitsConstatesDAvance: auCentime(-sommeDesComptes(s, ["487"])),
  };
  const totalActif = auCentime(
    actif.immobilisations.net + actif.stocks.net + actif.clients.net + actif.autresCreances + actif.valeursMobilieresDePlacement + actif.disponibilites + actif.chargesConstateesDAvance,
  );
  const totalPassif = auCentime(
    passif.capitauxPropres.total + passif.provisions + passif.emprunts + passif.fournisseurs + passif.dettesFiscalesEtSociales + passif.autresDettes + passif.produitsConstatesDAvance,
  );
  return { actif, passif, totalActif, totalPassif };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LES SOLDES INTERMÉDIAIRES DE GESTION ET LA CAPACITÉ D'AUTOFINANCEMENT
// ═════════════════════════════════════════════════════════════════════════════

/** Les retraitements optionnels des soldes. */
export interface RetraitementsDesSoldes {
  /** Le personnel intérimaire ou mis à disposition (compte 621), rangé avec les charges de personnel. */
  personnelExterieur?: number;
  /** Le crédit-bail traité comme un achat financé par emprunt : les redevances sortent des consommations. */
  creditBail?: { redevances: number; dotationEquivalente: number };
}

/** Les soldes intermédiaires de gestion, en cascade, avec leurs retraitements. */
export function soldesIntermediaires(s: Soldes, r: RetraitementsDesSoldes = {}) {
  const ventesDeMarchandises = auCentime(-sommeDesComptes(s, ["707", "7097"]));
  const coutDAchatDesMarchandisesVendues = sommeDesComptes(s, ["607", "6037", "6087", "6097"]);
  const margeCommerciale = auCentime(ventesDeMarchandises - coutDAchatDesMarchandisesVendues);
  const productionVendue = auCentime(-sommeDesComptes(s, ["70"], ["707", "7097"]));
  const productionStockee = auCentime(-sommeDesComptes(s, ["71"]));
  const productionImmobilisee = auCentime(-sommeDesComptes(s, ["72"]));
  const production = auCentime(productionVendue + productionStockee + productionImmobilisee);
  const personnelExterieur = r.personnelExterieur ?? 0;
  const redevances = r.creditBail?.redevances ?? 0;
  const dotationEquivalente = r.creditBail?.dotationEquivalente ?? 0;
  const consommations = auCentime(sommeDesComptes(s, ["60", "61", "62"], ["607", "6037", "6087", "6097"]) - personnelExterieur - redevances);
  const valeurAjoutee = auCentime(margeCommerciale + production - consommations);
  const subventions = auCentime(-sommeDesComptes(s, ["74"]));
  const impotsEtTaxes = sommeDesComptes(s, ["63"]);
  const personnel = auCentime(sommeDesComptes(s, ["64"]) + personnelExterieur);
  const excedentBrutDExploitation = auCentime(valeurAjoutee + subventions - impotsEtTaxes - personnel);
  const reprisesEtTransferts = auCentime(-sommeDesComptes(s, ["781", "791"]));
  const autresProduits = auCentime(-sommeDesComptes(s, ["75"]));
  const dotations = auCentime(sommeDesComptes(s, ["681"]) + dotationEquivalente);
  const autresCharges = sommeDesComptes(s, ["65"]);
  const resultatDExploitation = auCentime(excedentBrutDExploitation + reprisesEtTransferts + autresProduits - dotations - autresCharges);
  const produitsFinanciers = auCentime(-sommeDesComptes(s, ["76", "786", "796"]));
  const chargesFinancieres = auCentime(sommeDesComptes(s, ["66", "686"]) + redevances - dotationEquivalente);
  const resultatFinancier = auCentime(produitsFinanciers - chargesFinancieres);
  const resultatCourantAvantImpot = auCentime(resultatDExploitation + resultatFinancier);
  const produitsExceptionnels = auCentime(-sommeDesComptes(s, ["77", "787", "797"]));
  const chargesExceptionnelles = sommeDesComptes(s, ["67", "687"]);
  const resultatExceptionnel = auCentime(produitsExceptionnels - chargesExceptionnelles);
  const participation = sommeDesComptes(s, ["691"]);
  const impot = sommeDesComptes(s, ["695", "696", "697", "698", "699"]);
  const resultatNet = auCentime(resultatCourantAvantImpot + resultatExceptionnel - participation - impot);
  const plusOuMoinsValues = auCentime(-sommeDesComptes(s, ["775"]) - sommeDesComptes(s, ["675"]));
  return {
    ventesDeMarchandises,
    coutDAchatDesMarchandisesVendues,
    margeCommerciale,
    productionVendue,
    productionStockee,
    productionImmobilisee,
    production,
    consommations,
    valeurAjoutee,
    subventions,
    impotsEtTaxes,
    personnel,
    excedentBrutDExploitation,
    reprisesEtTransferts,
    autresProduits,
    dotations,
    autresCharges,
    resultatDExploitation,
    produitsFinanciers,
    chargesFinancieres,
    resultatFinancier,
    resultatCourantAvantImpot,
    produitsExceptionnels,
    chargesExceptionnelles,
    resultatExceptionnel,
    participation,
    impot,
    resultatNet,
    plusOuMoinsValues,
  };
}

/** Le partage de la valeur ajoutée : la part du personnel, des prêteurs, de l'État et de l'entreprise. */
export function partageDeLaValeurAjoutee(sig: ReturnType<typeof soldesIntermediaires>) {
  const va = sig.valeurAjoutee;
  return {
    personnel: sig.personnel / va,
    preteurs: sig.chargesFinancieres / va,
    etat: (sig.impotsEtTaxes + sig.impot) / va,
    excedentBrut: sig.excedentBrutDExploitation / va,
  };
}

/** La capacité d'autofinancement, par la méthode additive et par la méthode soustractive. */
export function capaciteDAutofinancement(s: Soldes) {
  const sig = soldesIntermediaires(s);
  const dotations = sommeDesComptes(s, ["681", "686", "687"]);
  const reprises = auCentime(-sommeDesComptes(s, ["781", "786", "787"]));
  const produitsDeCession = auCentime(-sommeDesComptes(s, ["775"]));
  const valeurNetteCedee = sommeDesComptes(s, ["675"]);
  const quotePartDesSubventions = auCentime(-sommeDesComptes(s, ["777"]));
  const additive = auCentime(sig.resultatNet + dotations - reprises - produitsDeCession + valeurNetteCedee - quotePartDesSubventions);
  const transfertsDExploitation = auCentime(-sommeDesComptes(s, ["791"]));
  const produitsFinanciersEncaissables = auCentime(-sommeDesComptes(s, ["76", "796"]));
  const chargesFinancieresDecaissables = sommeDesComptes(s, ["66"]);
  const produitsExceptionnelsEncaissables = auCentime(-sommeDesComptes(s, ["771", "778", "797"]));
  const chargesExceptionnellesDecaissables = sommeDesComptes(s, ["671", "678"]);
  const soustractive = auCentime(
    sig.excedentBrutDExploitation +
      transfertsDExploitation +
      sig.autresProduits -
      sig.autresCharges +
      produitsFinanciersEncaissables -
      chargesFinancieresDecaissables +
      produitsExceptionnelsEncaissables -
      chargesExceptionnellesDecaissables -
      sig.participation -
      sig.impot,
  );
  return { additive, soustractive, dotations, reprises };
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. LE BILAN FONCTIONNEL
// ═════════════════════════════════════════════════════════════════════════════

/** Un compte de tiers hors exploitation : l'impôt sur les bénéfices, les fournisseurs d'immobilisations, les comptes divers. */
const horsExploitation = (c: string) => commencePar(c, ["444", "404", "405", "45", "46", "47"]) && !commencePar(c, ["486", "487"]);

/** Le bilan fonctionnel : les quatre masses, le fonds de roulement, le besoin en fonds de roulement, la trésorerie nette. */
export function bilanFonctionnel(s: Soldes, resultat: number) {
  const entrees = Object.entries(s);
  const debiteurs = (filtre: (c: string) => boolean) => auCentime(entrees.reduce((t, [c, v]) => (filtre(c) && v > 0 ? t + v : t), 0));
  const crediteurs = (filtre: (c: string) => boolean) => auCentime(entrees.reduce((t, [c, v]) => (filtre(c) && v < 0 ? t - v : t), 0));
  const emploisStables = sommeDesComptes(s, ["2"], ["28", "29"]);
  const capitauxPropres = auCentime(-sommeDesComptes(s, ["10", "11", "12", "13", "14"]) + resultat);
  const amortissementsEtDepreciations = auCentime(-sommeDesComptes(s, ["28", "29", "39", "49"]));
  const provisions = auCentime(-sommeDesComptes(s, ["15"]));
  const dettesFinancieres = auCentime(-sommeDesComptes(s, ["16", "17"], ["1688"]));
  const ressourcesStables = auCentime(capitauxPropres + amortissementsEtDepreciations + provisions + dettesFinancieres);
  const fondsDeRoulement = auCentime(ressourcesStables - emploisStables);
  const tiersDExploitation = (c: string) => c.startsWith("4") && !c.startsWith("49") && !horsExploitation(c);
  const actifDExploitation = auCentime(sommeDesComptes(s, ["3"], ["39"]) + debiteurs(tiersDExploitation));
  const passifDExploitation = crediteurs(tiersDExploitation);
  const actifHorsExploitation = debiteurs(horsExploitation);
  const passifHorsExploitation = auCentime(crediteurs(horsExploitation) - sommeDesComptes(s, ["1688"]));
  const besoinDExploitation = auCentime(actifDExploitation - passifDExploitation);
  const besoinHorsExploitation = auCentime(actifHorsExploitation - passifHorsExploitation);
  const besoinEnFondsDeRoulement = auCentime(besoinDExploitation + besoinHorsExploitation);
  // La trésorerie active : la banque, et les placements à un an au plus avec leurs intérêts courus (508, 5088).
  const tresorerieActive = debiteurs((c) => c.startsWith("5"));
  const tresoreriePassive = crediteurs((c) => c.startsWith("5"));
  return {
    emploisStables,
    ressourcesStables: { capitauxPropres, amortissementsEtDepreciations, provisions, dettesFinancieres, total: ressourcesStables },
    fondsDeRoulement,
    actifDExploitation,
    passifDExploitation,
    actifHorsExploitation,
    passifHorsExploitation,
    besoinDExploitation,
    besoinHorsExploitation,
    besoinEnFondsDeRoulement,
    tresorerieActive,
    tresoreriePassive,
    tresorerieNette: auCentime(tresorerieActive - tresoreriePassive),
  };
}

/**
 * LE BESOIN EN FONDS DE ROULEMENT NORMATIF, avec les délais en paramètres : les créances valent les
 * ventes TTC de l'année × délai des clients ÷ 360, les dettes les achats TTC × délai des
 * fournisseurs ÷ 360. Le besoin et la trésorerie nette (fonds de roulement − besoin) sont affines
 * en chaque délai : la droite d'un curseur.
 */
export function besoinSelonLesDelais(p: {
  fondsDeRoulement: number;
  ventesTtcAnnuelles: number;
  delaiClients: number;
  achatsTtcAnnuels: number;
  delaiFournisseurs: number;
  stock: number;
  /** Ce que le besoin compte en plus (autres créances − autres dettes d'exploitation et hors exploitation). */
  autres: number;
}) {
  const creances = auCentime((p.ventesTtcAnnuelles * p.delaiClients) / 360);
  const dettes = auCentime((p.achatsTtcAnnuels * p.delaiFournisseurs) / 360);
  const besoin = auCentime(p.stock + creances - dettes + p.autres);
  return { creances, dettes, besoin, tresorerieNette: auCentime(p.fondsDeRoulement - besoin), enJoursDeVentesTtc: (besoin / p.ventesTtcAnnuelles) * 360 };
}

/** La date d'échéance d'une facture payée à un délai en jours (mois de 30 jours). */
export const echeanceDUneFacture = (date: DateDuCours, delai: number): DateDuCours => {
  const rang = rangDuJour(date) + delai;
  const exercice = Math.floor((rang - 1) / 360);
  const dansLAnnee = rang - exercice * 360;
  return { jour: ((dansLAnnee - 1) % 30) + 1, mois: Math.floor((dansLAnnee - 1) / 30) + 1, exercice };
};
