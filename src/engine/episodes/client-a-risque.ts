/**
 * LE CLIENT À RISQUE — le modèle du crédit clients d'Arvel Distribution, région lyonnaise.
 *
 * Gauthier Jacquin décide qui Arvel livre à crédit, et jusqu'où. Un portefeuille
 * de 2 300 comptes, trois dossiers qui font le trimestre — une entreprise
 * générale qui gagne un gros chantier, un artisan fidèle qui paie mal, un
 * jeune promoteur-rénovateur — et un couvreur qui tombe en redressement
 * judiciaire. Treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · UNE VENTE À CRÉDIT NE VAUT QUE SA MARGE MOINS LA PERTE ATTENDUE. La
 *     perte attendue, c'est la probabilité de défaut, fois l'encours exposé,
 *     fois ce qu'on ne récupère pas (1 − taux de récupération). Le chantier
 *     de Corvelle fait 540 k€ de chiffre d'affaires, mais au prix chantier il
 *     ne laisse que 10 % de marge sur coût variable : 54 k€, à peine plus
 *     que les 42,5 k€ de perte attendue sur les 500 k€ d'encours demandés.
 *     Raisonner en chiffre d'affaires fait tout accorder ; raisonner en
 *     risque sans regarder la marge fait tout refuser, et perdre de bons
 *     clients : l'artisan qui paie à 72 jours mais paie toujours, et qui
 *     part à la concurrence si on le bloque.
 *   · UNE GARANTIE NE VAUT QUE SI ELLE COÛTE MOINS QUE LE RISQUE QU'ELLE
 *     COUVRE. L'assurance-crédit de Corvelle coûte 0,4 % du chiffre
 *     d'affaires assuré et couvre 90 % de la perte, dans la limite de ce que
 *     l'assureur agrée — qu'il réduit ou refuse selon le hasard. La caution
 *     personnelle d'un dirigeant qui a du patrimoine protège un nouveau
 *     client ; un acompte qui fait fuir la moitié du chantier, une caution
 *     bancaire imposée à un artisan sûr ou une police sur tout un portefeuille
 *     coûtent plus que ce qu'ils couvrent.
 *   · LA LIMITE S'AJUSTE AU FIL DES SIGNAUX. Un retard isolé n'annonce rien.
 *     Ce qui annonce un défaut, c'est l'accumulation : retard qui s'allonge,
 *     privilège de l'URSSAF inscrit, encours demandé à volume constant.
 *     L'assureur-crédit, qui voit les paiements de tous ses assurés, réduit
 *     son agrément deux semaines avant le premier privilège : assuré, on
 *     réagit plus tôt. Couper au premier signal perd le chantier ; ne rien
 *     ajuster laisse l'encours monter jusqu'au défaut.
 *
 * Le traitement comptable est celui du Plan comptable général : la créance
 * d'un client en procédure collective est douteuse, pas irrécouvrable ; on
 * la déprécie du hors-taxe qu'on ne pense pas récupérer, et la perte sur
 * créance irrécouvrable n'est constatée qu'à la clôture de la procédure.
 * Tous les montants sont hors taxes.
 *
 * Le trimestre est jugé en euros : la marge sur coût variable des ventes à
 * crédit, pertes sur créances, dépréciations et coût des garanties déduits,
 * en écart au budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** Le taux de marge sur coût variable des ventes au tarif. */
export const TAUX_MARGE = 0.18;
/** Au prix chantier négocié par Corvelle : 10 % seulement. */
export const TAUX_MARGE_CHANTIER = 0.1;
/** Un artisan au tarif artisan : 22 %. */
export const TAUX_MARGE_GUENARD = 0.22;
export const TAUX_MARGE_HALVANE = 0.2;

/* ---------------------------------------------------------------------------
 * CORVELLE BÂTIMENT : l'entreprise générale qui gagne un gros chantier.
 * ------------------------------------------------------------------------- */
/** Ses achats courants, par semaine. */
export const CORVELLE_BASE = 15000;
/** Les livraisons du chantier des Terrasses, par semaine, à partir de la semaine 2. */
export const CHANTIER_HEBDO = 45000;
export const DEBUT_CHANTIER = 2;
export const SEMAINES_CHANTIER = SEMAINES - DEBUT_CHANTIER + 1;
/** Corvelle paie à 60 jours : huit semaines. */
export const DELAI_CORVELLE = 8;
export const ENCOURS_CORVELLE = CORVELLE_BASE * DELAI_CORVELLE;
export const LIMITE_CORVELLE = 150000;
export const LIMITE_DEMANDEE = 500000;
/** L'encours de croisière du chantier : l'encours actuel, plus huit semaines de chantier. */
export const ENCOURS_PALIER = ENCOURS_CORVELLE + CHANTIER_HEBDO * DELAI_CORVELLE;
/** La probabilité de défaut dans le trimestre, à la cote 7 de l'assureur-crédit. */
export const PD_CORVELLE = 0.1;
/** Ce qu'Arvel a récupéré en moyenne sur ses créances chirographaires en procédure collective. */
export const RECUPERATION_MOYENNE = 0.15;
/** La perte attendue sur l'encours demandé : PD × exposition × (1 − récupération). */
export const PERTE_ATTENDUE_DEMANDEE = PD_CORVELLE * LIMITE_DEMANDEE * (1 - RECUPERATION_MOYENNE);
/** Corvelle se dégrade une fois sur quatre ; dégradée, elle fait défaut quatre fois sur dix. */
export const P_DEGRADE = 0.25;
export const P_DEFAUT_SI_DEGRADE = PD_CORVELLE / P_DEGRADE;
/** Dégradée, Corvelle cesse de payer à l'échéance à partir de la semaine 8. */
export const SEMAINE_RALENTISSEMENT = 8;
/** L'assureur-crédit réduit son agrément en semaine 7 ; le retard qui s'allonge se voit en semaine 9 ; le privilège est publié en semaine 10. */
export const SEMAINE_ALERTE_ASSUREUR = 7;
export const SEMAINE_RETARD = 9;
export const SEMAINE_PRIVILEGE = 10;

/** L'assurance-crédit. */
export const QUOTITE = 0.9;
export const TAUX_PRIME = 0.004;
export const FRAIS_ETUDE = 150;
/** Ce que l'assureur agrée, selon le hasard : la totalité trois fois sur dix, la moitié une fois sur deux. */
export const AGREMENTS = { total: 500000, moitie: 250000 } as const;
export const P_AGREMENT_TOTAL = 0.3;
export const P_AGREMENT_MOITIE = 0.5;

/** L'acompte : 30 % de chaque commande du chantier, et Corvelle n'en prend plus que la moitié chez Arvel. */
export const ACOMPTE = 0.3;
export const PART_CHANTIER_ACOMPTE = 0.5;

/** La demande de la semaine 6 : 150 k€ de plus, pour le même volume. */
export const HAUSSE_DEMANDEE = 150000;
/** Avec la hausse, Corvelle paie à dix semaines au lieu de huit. */
export const DELAI_AVEC_HAUSSE = 10;
/** Dégradée, Corvelle paie à onze semaines. */
export const DELAI_DEGRADE = 11;
/** La limite que la surveillance applique au deuxième signal. */
export const LIMITE_SURVEILLANCE = 200000;

/* ---------------------------------------------------------------------------
 * GUÉNARD PLÂTRERIE PEINTURE : l'artisan fidèle qui paie mal.
 * ------------------------------------------------------------------------- */
export const GUENARD_HEBDO = 6000;
/** Il paie à 72 jours pour 30 contractuels : dix semaines. */
export const DELAI_GUENARD = 10;
export const ENCOURS_GUENARD = GUENARD_HEBDO * DELAI_GUENARD;
export const TRAITE_GUENARD = 18000;
export const PD_GUENARD = 0.02;
export const RECUPERATION_GUENARD = 0.3;
/** Bloqué, il part à la concurrence six fois sur dix. */
export const P_DEPART_GUENARD = 0.6;
export const PART_COMPTANT_GUENARD = 0.5;
export const PART_CAUTION_GUENARD = 0.6;

/* ---------------------------------------------------------------------------
 * HALVANE PATRIMOINE : le nouveau promoteur-rénovateur.
 * ------------------------------------------------------------------------- */
export const HALVANE_HEBDO = 22000;
export const DEBUT_HALVANE = 5;
export const LIMITE_HALVANE = 150000;
export const PD_HALVANE = 0.15;
export const SEMAINE_DEFAUT_HALVANE = 12;
/** Récupération moyenne sur un promoteur sans actif : 10 %. */
export const RECUPERATION_HALVANE = 0.1;
export const ACOMPTE_HALVANE = 0.2;
export const PART_ACOMPTE_HALVANE = 0.9;
export const PART_COMPTANT_HALVANE = 0.4;
/** La caution du dirigeant se recouvre sans procès huit fois sur dix. */
export const P_CAUTION = 0.8;
export const FRAIS_CAUTION = 4000;

/* ---------------------------------------------------------------------------
 * BRONDEL COUVERTURE : le redressement judiciaire de la semaine 8.
 * ------------------------------------------------------------------------- */
export const SEMAINE_BRONDEL = 8;
export const CREANCE_BRONDEL = 64000;
/** Nos marchandises encore en stock chez Brondel, au prix de vente. */
export const STOCK_BRONDEL = 21000;
/** Reprises, elles rentrent en stock à leur coût d'achat. */
export const COUT_STOCK_BRONDEL = STOCK_BRONDEL * (1 - TAUX_MARGE);
export const FRAIS_AVOCAT = 1500;
export const P_REVENDICATION = 0.6;
export const PRIX_CESSION = 0.08;

/* ---------------------------------------------------------------------------
 * LE RESTE DU PORTEFEUILLE, et les comptes en retard de la semaine 10.
 * ------------------------------------------------------------------------- */
export const RESTE_HEBDO = 300000;
/** Les 31 comptes qui cumulent au moins deux signaux. */
export const SIGNAUX_HEBDO = 24000;
export const COMPTES_SIGNAUX = 31;
/** Les 109 autres comptes en retard de plus de 30 jours : ils paient tard, mais paient. */
export const RETARDS_HEBDO = 50000;
export const COMPTES_RETARD = 140;
/** À la clôture, le commissaire aux comptes fait déprécier la moitié de ce que doivent ceux qui sont encore en retard. */
export const DEPRECIATION_DOUTEUX = 0.5;
/** La part des comptes à signaux encore en retard à la clôture : huit sur dix en moyenne. */
export const PART_DOUTEUX = 0.8;
export const PRIME_PORTEFEUILLE = 7500;
/** Ce que les comptes bloqués achètent encore, au comptant. */
export const PART_COMPTANT_BLOQUES = 0.3;
export const PART_COMPTANT_SIGNAUX_BLOQUES = 0.2;
/** Les pertes courantes des petits comptes : 0,2 % des ventes. */
export const TAUX_PERTES_COURANTES = 0.002;

/** Le budget de marge nette du trimestre : marge, moins pertes, dépréciations et garanties. */
export const BUDGET = 715000;
/** Le budget de pertes et dépréciations du trimestre. */
export const BUDGET_PERTES = 70000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des commandes du chantier passées ailleurs. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  corvelle: 0,
  guenard: 1,
  halvane: 2,
  signaux: 3,
  brondel: 4,
  cloture: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 1, 2, 1, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: { ventes?: number; perte?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "fraude",
    titre: "Une commande frauduleuse",
    de: "Soline Abadie",
    role: "Analyste crédit",
    texte:
      "Un escroc a commandé 11 k€ d'outillage au nom d'un client existant, livré sur un chantier fantôme. La créance est perdue.",
    duree: 1,
    effet: { perte: 11000 },
  },
  {
    id: "liquidation",
    titre: "Un plaquiste en liquidation judiciaire",
    de: "Soline Abadie",
    role: "Analyste crédit",
    texte:
      "La SARL Daurat Plâtres est mise en liquidation judiciaire. Ses 9 k€ HT sont dépréciés en totalité : rien ne reviendra aux créanciers chirographaires.",
    duree: 1,
    effet: { perte: 9000 },
  },
  {
    id: "intemperies",
    titre: "Deux semaines d'intempéries",
    de: "Quentin Marsal",
    role: "Responsable grands comptes",
    texte:
      "Pluie et gel : les chantiers de gros œuvre sont à l'arrêt, les commandes du portefeuille baissent de 15 % pendant deux semaines.",
    duree: 2,
    effet: { ventes: 0.85 },
  },
  {
    id: "transport",
    titre: "Grève chez le transporteur",
    de: "Logistique",
    role: "Plateforme de Saint-Priest",
    texte:
      "Grève chez le transporteur régional : une semaine de livraisons reportées, et des clients qui achètent au plus près.",
    duree: 1,
    effet: { ventes: 0.88 },
  },
  {
    id: "taux",
    titre: "Des programmes immobiliers gelés",
    de: "Quentin Marsal",
    role: "Responsable grands comptes",
    texte:
      "Les taux remontent : deux promoteurs gèlent leurs programmes, et les entreprises qui y travaillaient commandent moins pendant trois semaines.",
    duree: 3,
    effet: { ventes: 0.95 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des ventes du portefeuille, semaine par semaine. */
  ventes: readonly number[];
  /** Corvelle se dégrade-t-elle ? */
  uDegrade: number;
  /** Dégradée, fait-elle défaut ? Et quand ? */
  uDefaut: number;
  semaineDefaut: number;
  /** Ce que le mandataire estime récupérable sur Corvelle. */
  recuperationCorvelle: number;
  /** La réponse de l'assureur-crédit à la demande d'agrément. */
  uAssureur: number;
  /** Bloqué, Guénard part-il ? */
  uGuenard: number;
  uDefautGuenard: number;
  uHalvane: number;
  recuperationHalvane: number;
  /** La caution du dirigeant d'Halvane se recouvre-t-elle sans procès ? */
  uCaution: number;
  /** Le dividende que le mandataire de Brondel estime. */
  recuperationBrondel: number;
  /** La revendication des marchandises aboutit-elle ? */
  uRevendication: number;
  /** La part des comptes à signaux encore en retard à la clôture. */
  partDouteux: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000313 + 7);
  const ventes = [1];
  for (let i = 1; i <= SEMAINES; i += 1) {
    ventes.push(Math.min(1.06, Math.max(0.94, 1 + 0.025 * gauss(r))));
  }
  const uDegrade = r();
  const uDefaut = r();
  const semaineDefaut = 10 + Math.floor(r() * 3);
  const recuperationCorvelle = 0.3 * r();
  const uAssureur = r();
  const uGuenard = r();
  const uDefautGuenard = r();
  const recuperationBrondel = 0.3 * r();
  const recuperationHalvane = 0.2 * r();
  const uCaution = r();
  const uHalvane = r();
  const uRevendication = r();
  const partDouteux = 0.6 + 0.4 * r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    ventes,
    uDegrade,
    uDefaut,
    semaineDefaut,
    recuperationCorvelle,
    uAssureur,
    uGuenard,
    uDefautGuenard,
    uHalvane,
    recuperationHalvane,
    uCaution,
    recuperationBrondel,
    uRevendication,
    partDouteux,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI TOMBE SELON LE HASARD, ET CE QUI EN DÉCOULE DES DÉCISIONS.
 * ------------------------------------------------------------------------- */

/** Corvelle se dégrade-t-elle ce trimestre ? Le hasard seul en décide. */
export const corvelleDegrade = (graine: number) => hasard(graine).uDegrade < P_DEGRADE;
/** La semaine du redressement judiciaire de Corvelle ; 0 : pas de défaut. */
export function semaineDefautCorvelle(graine: number): number {
  const h = hasard(graine);
  return h.uDegrade < P_DEGRADE && h.uDefaut < P_DEFAUT_SI_DEGRADE ? h.semaineDefaut : 0;
}

/** Ce que l'assureur-crédit agrée sur Corvelle, si on le lui demande. */
export function agrementAccorde(graine: number): number {
  const u = hasard(graine).uAssureur;
  return u < P_AGREMENT_TOTAL
    ? AGREMENTS.total
    : u < P_AGREMENT_TOTAL + P_AGREMENT_MOITIE
      ? AGREMENTS.moitie
      : 0;
}
export const agrement = (chemin: readonly number[], graine: number) =>
  chemin[D.corvelle] === 1 ? agrementAccorde(graine) : 0;

/** La semaine où la surveillance ramène la limite de Corvelle à 200 k€ ; 0 : jamais. */
export function semaineReduction(chemin: readonly number[], graine: number): number {
  if (chemin[D.signaux] !== 1 || !corvelleDegrade(graine)) return 0;
  // Assuré, l'alerte de l'assureur est le deuxième signal ; sinon, le retard qui s'allonge.
  return agrement(chemin, graine) > 0 ? SEMAINE_ALERTE_ASSUREUR + 1 : SEMAINE_RETARD + 1;
}

/** Bloqué, Guénard part à la concurrence six fois sur dix. */
export const guenardPartSiBloque = (graine: number) => hasard(graine).uGuenard < P_DEPART_GUENARD;
export const guenardDefaut = (graine: number) => hasard(graine).uDefautGuenard < PD_GUENARD;
export const halvaneDefaut = (graine: number) => hasard(graine).uHalvane < PD_HALVANE;
export const cautionRecouvree = (graine: number) => hasard(graine).uCaution < P_CAUTION;
export const revendicationAboutit = (graine: number) =>
  hasard(graine).uRevendication < P_REVENDICATION;

export type Semaine = {
  /** Marge nette cumulée : marge sur coût variable, moins pertes, dépréciations et garanties. */
  marge: number;
  /** Chiffre d'affaires à crédit cumulé. */
  ventes: number;
  /** Pertes sur créances et dépréciations cumulées. */
  pertes: number;
  /** Coût des garanties cumulé : primes, frais d'étude, d'avocat, de caution. */
  garanties: number;
  /** Ce que la semaine a apporté à la marge nette. */
  contribution: number;
  encoursCorvelle: number;
  limiteCorvelle: number;
  /** La part de l'encours de Corvelle que l'assureur couvre (avant quotité). */
  couvert: number;
  /** La probabilité de défaut de Corvelle que le crédit retient en fin de semaine. */
  pdCorvelle: number;
  /** La perte attendue des comptes sensibles : Corvelle, Guénard, Halvane. */
  perteAttendue: number;
  encoursGuenard: number;
  encoursHalvane: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge nette en écart au budget : positive, le trimestre fait mieux que prévu. */
  objectif: number;
  margeNette: number;
  /** Marge sur coût variable des ventes à crédit, avant pertes. */
  margeBrute: number;
  ventes: number;
  pertes: number;
  garanties: number;
  corvelleDegrade: boolean;
  corvelleDefaut: number;
  recuperationCorvelle: number;
  /** La perte nette sur Corvelle : dépréciation de la part non couverte. */
  perteCorvelle: number;
  agrement: number | null;
  alerteAssureur: boolean;
  semaineReduction: number;
  chantierLivre: number;
  limiteFinale: number;
  guenardParti: boolean;
  guenardBloque: boolean;
  halvaneOuvert: boolean;
  halvaneDefaut: boolean;
  cautionRecouvree: boolean;
  perteHalvane: number;
  revendication: boolean | null;
  recuperationBrondel: number;
  perteBrondel: number;
  /** Ce que les livraisons aux comptes à signaux ont coûté en dépréciations à la clôture. */
  depreciationDouteux: number;
}

/** Une facture : son montant exposé, sa semaine, et ce qui en est couvert. */
interface Facture {
  semaine: number;
  expose: number;
}

const somme = (fs: readonly Facture[]) => fs.reduce((s, f) => s + f.expose, 0);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const degrade = corvelleDegrade(graine);
  const defaut = semaineDefautCorvelle(graine);
  const agree = d1 === 1 ? agrementAccorde(graine) : null;
  const alerte = degrade && (agree ?? 0) > 0;
  const reduction = semaineReduction(chemin, graine);
  const bloque = d2 === 0 || (d6 === 0 && d2 !== 1);
  const guenardParti = bloque && guenardPartSiBloque(graine);
  const gDefaut = guenardDefaut(graine);
  const hOuvert = d3 !== 1;
  const hDefaut = hOuvert && d3 !== 2 && halvaneDefaut(graine);
  const caution = cautionRecouvree(graine);
  const revendique = d5 === 2 ? revendicationAboutit(graine) : null;

  // Corvelle : les factures non payées, à partir de l'encours de départ.
  let factures: Facture[] = Array.from({ length: DELAI_CORVELLE }, (_, k) => ({
    semaine: k - DELAI_CORVELLE + 1,
    expose: CORVELLE_BASE,
  }));
  let limite = LIMITE_CORVELLE;
  let avantBlocage = LIMITE_CORVELLE;
  let chantierLivre = 0;
  let perteCorvelle = 0;
  let defautPasse = false;
  // Guénard.
  let gFactures: Facture[] = Array.from({ length: DELAI_GUENARD }, (_, k) => ({
    semaine: k - DELAI_GUENARD + 1,
    expose: GUENARD_HEBDO,
  }));
  let gEncoursCouvert = false;
  // Halvane.
  let hFactures: Facture[] = [];
  let perteHalvane = 0;
  let perteBrondel = 0;
  let depreciationDouteux = 0;

  let marge = 0;
  let margeBrute = 0;
  let ventes = 0;
  let pertes = 0;
  let garanties = 0;
  const semaines: (Semaine | null)[] = [null];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let mb = 0; // marge sur coût variable de la semaine
    let ca = 0;
    let pe = 0; // pertes et dépréciations de la semaine
    let ga = 0; // coût des garanties de la semaine
    if (w === 1) mb -= Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

    /* ---- Corvelle ---- */
    if (w === 2 && d1 !== 3) limite = LIMITE_DEMANDEE;
    if (w === 7 && d4 === 0) limite += HAUSSE_DEMANDEE;
    if (w === 7 && d4 === 3) {
      avantBlocage = limite;
      limite = 0; // bloqué jusqu'au paiement du retard
    }
    if (w === 9 && d4 === 3) limite = avantBlocage; // le retard payé, les achats courants reprennent
    if (reduction && w === reduction) limite = Math.min(limite, LIMITE_SURVEILLANCE);
    const enDefaut = defaut > 0 && w >= defaut;
    if (!enDefaut) {
      // Les paiements : Corvelle paie les factures arrivées à échéance.
      let delai = DELAI_CORVELLE;
      if (d4 === 0 && w >= 7) delai = DELAI_AVEC_HAUSSE;
      if (degrade && w >= SEMAINE_RALENTISSEMENT) delai = DELAI_DEGRADE;
      factures = factures.filter((f) => f.semaine > w - delai);
      // La semaine 10, les comptes à signaux sont passés au comptant ou bloqués : Corvelle aussi, dégradée.
      const signauxCumules = degrade && w >= 11 && (d6 === 0 || d6 === 1);
      if (signauxCumules) limite = Math.min(limite, somme(factures));
      // Les livraisons, dans la limite.
      let place = Math.max(0, limite - somme(factures));
      const base = Math.min(CORVELLE_BASE, place);
      place -= base;
      let chantier = 0;
      // Refusé, le chantier est signé ailleurs ; bloqué en semaine 7, Corvelle en confie la suite à un concurrent.
      if (w >= DEBUT_CHANTIER && d1 !== 3 && !(d4 === 3 && w >= 7)) {
        const demande = CHANTIER_HEBDO * (d1 === 2 ? PART_CHANTIER_ACOMPTE : 1);
        const parEuro = d1 === 2 ? 1 - ACOMPTE : 1;
        chantier = Math.min(demande, place / parEuro);
        factures.push({ semaine: w, expose: base + chantier * parEuro });
      } else {
        factures.push({ semaine: w, expose: base });
      }
      chantierLivre += chantier;
      mb += base * TAUX_MARGE + chantier * TAUX_MARGE_CHANTIER;
      ca += base + chantier;
      if (agree && w >= DEBUT_CHANTIER && !(alerte && w > SEMAINE_ALERTE_ASSUREUR)) {
        ga += (base + chantier) * TAUX_PRIME;
      }
    }
    if (w === 2 && d1 === 1) ga += FRAIS_ETUDE;
    const encours = somme(factures);
    // L'assureur couvre, dans la limite de son agrément, les factures nées avant son alerte.
    const couvert =
      agree && w >= DEBUT_CHANTIER
        ? Math.min(
            agree,
            somme(factures.filter((f) => !alerte || f.semaine <= SEMAINE_ALERTE_ASSUREUR)),
          )
        : 0;
    if (defaut && w === defaut && !defautPasse) {
      defautPasse = true;
      // Le redressement : la créance devient douteuse, dépréciée de la part non couverte qu'on ne récupérera pas.
      perteCorvelle = (encours - QUOTITE * couvert) * (1 - h.recuperationCorvelle);
      pe += perteCorvelle;
    }

    /* ---- Guénard ---- */
    const guenardClient = !(guenardParti && w >= (d2 === 0 ? 3 : 11));
    {
      gFactures = gFactures.filter((f) => f.semaine > w - DELAI_GUENARD);
      let part = 1;
      if (d2 === 0 && w >= 3 && w <= 4) part = 0;
      if (d2 === 1 && w >= 3) part = PART_COMPTANT_GUENARD;
      if (d2 === 3 && w >= 3) part = PART_CAUTION_GUENARD;
      if (d6 === 0 && d2 !== 1 && w >= 11) part = 0;
      if (!guenardClient) part = 0;
      const achat = GUENARD_HEBDO * part;
      if (achat > 0 && d2 !== 1) gFactures.push({ semaine: w, expose: achat });
      mb += achat * TAUX_MARGE_GUENARD;
      ca += achat;
      if (d2 === 3 && w >= 3) gEncoursCouvert = true;
      if (gDefaut && w === 9) {
        const expose = somme(gFactures);
        if (!gEncoursCouvert) pe += expose * (1 - RECUPERATION_GUENARD);
        gFactures = [];
      }
    }

    /* ---- Halvane ---- */
    if (hOuvert && w >= DEBUT_HALVANE && !(hDefaut && w >= SEMAINE_DEFAUT_HALVANE)) {
      hFactures = hFactures.filter((f) => f.semaine > w - DELAI_CORVELLE);
      const demande =
        HALVANE_HEBDO * (d3 === 2 ? PART_COMPTANT_HALVANE : d3 === 3 ? PART_ACOMPTE_HALVANE : 1);
      const parEuro = d3 === 3 ? 1 - ACOMPTE_HALVANE : 1;
      const achat =
        d3 === 2 ? demande : Math.min(demande, (LIMITE_HALVANE - somme(hFactures)) / parEuro);
      if (d3 !== 2) hFactures.push({ semaine: w, expose: achat * parEuro });
      mb += achat * TAUX_MARGE_HALVANE;
      ca += achat;
    }
    if (hDefaut && w === SEMAINE_DEFAUT_HALVANE) {
      const perte = somme(hFactures) * (1 - h.recuperationHalvane);
      if (d3 === 3) {
        // La caution solvable paie la perte ; restent les frais de l'avoir appelée.
        perteHalvane = caution ? 0 : perte;
        ga += FRAIS_CAUTION;
      } else perteHalvane = perte;
      pe += perteHalvane;
      hFactures = [];
    }

    /* ---- Brondel ---- */
    if (d5 === 0 && w === SEMAINE_BRONDEL + 1) {
      // Passée en perte sans être déclarée : la créance est inopposable, rien ne reviendra.
      perteBrondel = CREANCE_BRONDEL;
      pe += perteBrondel;
    }
    if (d5 === 3 && w === SEMAINE_BRONDEL + 2) {
      perteBrondel = CREANCE_BRONDEL * (1 - PRIX_CESSION);
      pe += perteBrondel;
    }
    if (d5 === 2 && w === SEMAINE_BRONDEL + 1) ga += FRAIS_AVOCAT;
    if ((d5 === 1 || d5 === 2) && w === SEMAINE_BRONDEL + 4) {
      // Le mandataire estime le dividende : on déprécie le hors-taxe qu'on ne récupérera pas.
      const reprise = revendique ? STOCK_BRONDEL : 0;
      const marchandises = revendique ? STOCK_BRONDEL - COUT_STOCK_BRONDEL : 0;
      perteBrondel = marchandises + (CREANCE_BRONDEL - reprise) * (1 - h.recuperationBrondel);
      pe += perteBrondel;
    }

    /* ---- Le reste du portefeuille, et les comptes en retard ---- */
    let facteur = h.ventes[w]!;
    for (const a of actifs) facteur *= a.imprevu.effet.ventes ?? 1;
    let signaux = SIGNAUX_HEBDO;
    let retards = RETARDS_HEBDO;
    let signauxACredit = SIGNAUX_HEBDO;
    if (w >= 11 && d6 === 0) {
      signaux *= PART_COMPTANT_SIGNAUX_BLOQUES;
      retards *= PART_COMPTANT_BLOQUES;
      signauxACredit = 0;
    }
    if (w >= 11 && d6 === 1) {
      signaux *= PART_COMPTANT_BLOQUES;
      signauxACredit = 0;
    }
    const autres = RESTE_HEBDO - SIGNAUX_HEBDO - RETARDS_HEBDO;
    const reste = (autres + signaux + retards) * facteur;
    mb += reste * TAUX_MARGE;
    ca += reste;
    pe += reste * TAUX_PERTES_COURANTES;
    if (w >= 11 && signauxACredit > 0) {
      // Livrés à crédit à trois semaines de la clôture, ils seront encore en retard : dépréciés.
      const d = signauxACredit * facteur * h.partDouteux * DEPRECIATION_DOUTEUX;
      depreciationDouteux += d;
      pe += d;
    }
    if (d6 === 2 && w === 11) ga += PRIME_PORTEFEUILLE;
    for (const a of actifs)
      if (a.semaine === w && a.imprevu.effet.perte) pe += a.imprevu.effet.perte;

    /* ---- Le bilan de la semaine ---- */
    const contribution = mb - pe - ga;
    margeBrute += mb;
    marge += contribution;
    ventes += ca;
    pertes += pe;
    garanties += ga;

    // La probabilité de défaut que le crédit retient : la cote, puis les signaux.
    const signauxVus = !degrade
      ? 0
      : (alerte && w >= SEMAINE_ALERTE_ASSUREUR ? 1 : 0) +
        (w >= SEMAINE_RETARD ? 1 : 0) +
        (w >= SEMAINE_PRIVILEGE ? 1 : 0);
    const pdCorvelle = enDefaut
      ? 1
      : signauxVus >= 1
        ? P_DEFAUT_SI_DEGRADE
        : !degrade && w >= SEMAINE_PRIVILEGE
          ? 0.04
          : PD_CORVELLE;
    const encoursG = somme(gFactures);
    const encoursH = somme(hFactures);
    const perteAttendue =
      (enDefaut ? 0 : pdCorvelle * (encours - QUOTITE * couvert) * (1 - RECUPERATION_MOYENNE)) +
      (gEncoursCouvert ? 0 : PD_GUENARD * encoursG * (1 - RECUPERATION_GUENARD)) +
      (hDefaut && w >= SEMAINE_DEFAUT_HALVANE
        ? 0
        : PD_HALVANE * encoursH * (1 - RECUPERATION_HALVANE) * (d3 === 3 ? 1 - P_CAUTION : 1));

    semaines.push({
      marge,
      ventes,
      pertes,
      garanties,
      contribution,
      encoursCorvelle: encours,
      limiteCorvelle: enDefaut ? 0 : limite,
      couvert,
      pdCorvelle,
      perteAttendue,
      encoursGuenard: encoursG,
      encoursHalvane: encoursH,
    });
  }

  return {
    semaines,
    objectif: marge - BUDGET,
    margeNette: marge,
    margeBrute,
    ventes,
    pertes,
    garanties,
    corvelleDegrade: degrade,
    corvelleDefaut: defaut,
    recuperationCorvelle: h.recuperationCorvelle,
    perteCorvelle,
    agrement: agree,
    alerteAssureur: alerte,
    semaineReduction: reduction,
    chantierLivre,
    limiteFinale: semaines[SEMAINES]!.limiteCorvelle,
    guenardParti,
    guenardBloque: bloque,
    halvaneOuvert: hOuvert,
    halvaneDefaut: hDefaut,
    cautionRecouvree: d3 === 3 && hDefaut && caution,
    perteHalvane,
    revendication: revendique,
    recuperationBrondel: h.recuperationBrondel,
    perteBrondel,
    depreciationDouteux,
  };
}

/** Ce qui s'est passé pendant des semaines : signaux, défauts, départs, procédures, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    alerteAssureur: t.alerteAssureur && dans(SEMAINE_ALERTE_ASSUREUR),
    retardCorvelle: t.corvelleDegrade && dans(SEMAINE_RETARD),
    privilege: t.corvelleDegrade && dans(SEMAINE_PRIVILEGE),
    reduction: t.semaineReduction > 0 && dans(t.semaineReduction),
    defautCorvelle: t.corvelleDefaut > 0 && dans(t.corvelleDefaut),
    guenardParti: t.guenardParti && dans(chemin[D.guenard] === 0 ? 4 : 11),
    guenardReste: t.guenardBloque && !t.guenardParti && dans(chemin[D.guenard] === 0 ? 4 : 11),
    guenardDefaut: guenardDefaut(graine) && dans(9),
    halvaneDefaut: t.halvaneDefaut && dans(SEMAINE_DEFAUT_HALVANE),
    revendication: t.revendication !== null && dans(SEMAINE_BRONDEL + 3) ? t.revendication : null,
    estimationBrondel:
      (chemin[D.brondel] === 1 || chemin[D.brondel] === 2) && dans(SEMAINE_BRONDEL + 4),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureCredit {
  marge: number | null;
  ventes: number | null;
  encoursCorvelle: number | null;
  perteAttendue: number | null;
  pertes: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  budgetADate: number | null;
  limiteCorvelle: number | null;
  couvert: number | null;
  pdCorvelle: number | null;
  garanties: number | null;
  encoursGuenard: number | null;
  encoursHalvane: number | null;
  /** 1 : Corvelle est en redressement judiciaire. */
  corvelleDefaut: number | null;
  /** Les signaux de Corvelle visibles à date : retard qui s'allonge, privilège. */
  signauxCorvelle: number | null;
  /** 1 : Guénard est parti à la concurrence. */
  guenardParti: number | null;
}

/** Ce que Gauthier lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureCredit {
  if (semaine === 0) {
    return {
      marge: 0,
      ventes: 0,
      encoursCorvelle: ENCOURS_CORVELLE,
      perteAttendue:
        PD_CORVELLE * ENCOURS_CORVELLE * (1 - RECUPERATION_MOYENNE) +
        PD_GUENARD * ENCOURS_GUENARD * (1 - RECUPERATION_GUENARD),
      pertes: 0,
      budgetADate: 0,
      limiteCorvelle: LIMITE_CORVELLE,
      couvert: 0,
      pdCorvelle: PD_CORVELLE,
      garanties: 0,
      encoursGuenard: ENCOURS_GUENARD,
      encoursHalvane: 0,
      corvelleDefaut: 0,
      signauxCorvelle: 0,
      guenardParti: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const degrade = t.corvelleDegrade;
  return {
    marge: s.marge,
    ventes: s.ventes,
    encoursCorvelle: s.encoursCorvelle,
    perteAttendue: s.perteAttendue,
    pertes: s.pertes,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    limiteCorvelle: s.limiteCorvelle,
    couvert: s.couvert,
    pdCorvelle: s.pdCorvelle,
    garanties: s.garanties,
    encoursGuenard: s.encoursGuenard,
    encoursHalvane: s.encoursHalvane,
    corvelleDefaut: t.corvelleDefaut > 0 && semaine >= t.corvelleDefaut ? 1 : 0,
    signauxCorvelle: degrade
      ? (semaine >= SEMAINE_RETARD ? 1 : 0) + (semaine >= SEMAINE_PRIVILEGE ? 1 : 0)
      : 0,
    guenardParti: t.guenardParti && semaine >= (decisions[D.guenard] === 0 ? 4 : 11) ? 1 : 0,
  };
}
