/**
 * LA TRÉSORERIE QUI FOND — le modèle d'une filiale d'Arvel Distribution.
 *
 * Six agences, 400 k€ de ventes par semaine, une activité qui croît et une
 * marge qui tient. Et pourtant le découvert se creuse, semaine après semaine.
 * Treize semaines, six décisions. Trois mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LE BFR AVALE LA CROISSANCE. La trésorerie d'une semaine, c'est la marge
 *     moins les charges, moins ce que le besoin en fonds de roulement a pris :
 *     créances clients plus stock, moins dettes fournisseurs. Un jour de délai
 *     client immobilise 57 k€, un jour de stock 42 k€. Le compte de résultat
 *     peut être bon et la banque inquiète : l'argent dort dans les postes du
 *     bilan, et c'est là qu'il faut aller le chercher.
 *   · LE RETARD SE CONCENTRE. La balance âgée montre qu'une quinzaine de gros
 *     encours font l'essentiel de l'échu, dont un client fragile. Relancer tôt
 *     et de manière ciblée récupère plus, plus vite, que relancer tout le
 *     monde ; et réduit ce qu'on perdra si ce client tombe.
 *   · LE CRÉDIT LE PLUS CHER EST CELUI QU'ON PREND SANS LE DEMANDER. Payer
 *     les fournisseurs en retard libère du cash tout de suite et le rend plus
 *     tard : remise de fin de trimestre perdue, pénalités, et une chance sur
 *     deux que l'assureur-crédit de Norvia coupe la couverture, ce qui fait
 *     exiger l'arriéré et bloquer une semaine de livraisons. Dépasser
 *     l'autorisation de découvert coûte un taux majoré, une commission, et des
 *     virements rejetés, d'autant plus souvent que la banque n'a pas été
 *     prévenue. À l'inverse, une banque qui a reçu un plan tôt prête pour le
 *     pic. Et l'escompte pour paiement anticipé, qui rapporte l'équivalent de
 *     19 % l'an, n'est une affaire que si on le finance sous l'autorisation.
 *
 * Le trimestre est jugé en euros : l'écart au budget de frais financiers et
 * de pertes de la filiale (agios, commissions, affacturage, impayés,
 * dépréciation du stock dormant, remises perdues, pénalités, ventes
 * manquées), escomptes obtenus déduits.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les ventes de la semaine 0, hors taxes. */
export const VENTES = 400000;
/** L'activité croît de 0,6 % par semaine : la saison du bâtiment repart. */
export const CROISSANCE = 0.006;
export const TAUX_MARGE = 0.27;
/** Le coût des ventes, rapporté aux ventes. */
const TAUX_ACHAT = 1 - TAUX_MARGE;
/** Salaires, loyers, transport : ce que la filiale décaisse chaque semaine hors achats. */
export const FIXES = 89000;
/** Semaine 12 : l'acompte d'impôt sur les sociétés et les loyers trimestriels des agences. */
export const PIC = { semaine: 12, montant: 560000 } as const;

export const DSO_DEPART = 57;
export const ENCOURS_CIMIER = 200000;
/** Ce que la relance ciblée fait payer à Cimier dès la semaine 3. */
export const ACOMPTE_CIMIER = 80000;
/** Le délai de paiement des autres clients : le délai global, Cimier mis à part. */
const DSO_AUTRES = DSO_DEPART - (ENCOURS_CIMIER / VENTES) * 7;
/** Sans rien faire, les clients paient un peu plus tard chaque semaine. */
export const DERIVE_DSO = 0.3;
export const STOCK_DEPART = 74;
export const DERIVE_STOCK = 0.15;
export const DPO = 48;
/** Norvia, le premier fournisseur : 35 % des achats. */
export const PART_NORVIA = 0.35;

export const SOLDE_DEPART = -1120000;
export const AUTORISATION = 1200000;
/** L'autorisation que la banque porte à qui lui présente un plan. */
export const AUTORISATION_PLAN = 1350000;
/** Celle qu'elle accorde, parfois, à une demande sans dossier. */
export const AUTORISATION_DEMANDEE = 1300000;
/** Celle à laquelle elle la réduit quand on la fait attendre. */
export const AUTORISATION_REDUITE = 1000000;
export const FACILITE = 300000;
export const TAUX_DECOUVERT = 0.065;
export const TAUX_DEPASSEMENT = 0.155;
export const TAUX_FACTOR = 0.06;
export const COMMISSION_DEPASSEMENT = 350;
/** Un virement rejeté : frais, pénalités du créancier, livraison retenue. */
export const COUT_REJET = 2000;
/** Plus le dépassement est grand, plus les virements rejetés sont gros, et chers. */
export const PART_REJETEE = 0.05;

export const OBJECTIF_DSO = 52;
export const OBJECTIF_STOCK = 70;
/** Le budget de frais financiers et de pertes du trimestre. */
export const BUDGET = 60000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des virements passés au-delà de l'autorisation. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  relance: 0,
  banque: 1,
  cimier: 2,
  stock: 3,
  escompte: 4,
  pic: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 2, 3] as const;

export const COUTS = {
  interimRelance: 1800,
  relanceGenerale: 2000,
  engagement: 1500,
  demande: 500,
  factorMiseEnPlace: 2500,
  /** La commission d'affacturage, en part du chiffre d'affaires cédé. */
  factorCommission: 0.005,
  /** La décote du rachat sans recours de la créance de Cimier. */
  decoteCimier: 0.12,
  injonction: 3000,
  retours: 9000,
  promotion: 20000,
  facilite: 800,
  /** L'affacturage ponctuel des grosses factures de mars. */
  ponctuel: 7500,
  cedePonctuel: 500000,
  penaliteFournisseurs: 1200,
  remiseNorvia: 20000,
} as const;

/** La provision pour dépréciation du stock dormant à la clôture, selon la décision sur le stock. */
export const PROVISION = [7000, 4000, 28000, 28000] as const;

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
  effet: { dso?: number; perte?: number; decaissement?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "liquidation",
    titre: "Un client artisan en liquidation",
    de: "Aurore Mazet",
    role: "Responsable du recouvrement",
    texte:
      "La SARL Deveaux Couverture est placée en liquidation judiciaire : ses 20 k€ de factures sont perdus.",
    duree: 1,
    effet: { perte: 20000 },
  },
  {
    id: "facturation",
    titre: "Panne du logiciel de facturation",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel de facturation est resté bloqué quatre jours : les factures de la semaine partent avec une semaine de retard.",
    duree: 1,
    effet: { dso: 3 },
  },
  {
    id: "courrier",
    titre: "Grève des centres de tri",
    de: "Aurore Mazet",
    role: "Responsable du recouvrement",
    texte:
      "Grève dans les centres de tri : les chèques des artisans arrivent avec une à deux semaines de retard.",
    duree: 2,
    effet: { dso: 2 },
  },
  {
    id: "acier",
    titre: "Hausse des prix de l'acier",
    de: "Julien Ribeiro",
    role: "Responsable des achats",
    texte:
      "Les fournisseurs d'armatures et de profilés appliquent une hausse de 6 % sans préavis : 12 k€ de plus à payer par semaine, le temps de répercuter.",
    duree: 2,
    effet: { decaissement: 12000 },
  },
  {
    id: "bailleur",
    titre: "Un bailleur social change de logiciel",
    de: "Aurore Mazet",
    role: "Responsable du recouvrement",
    texte:
      "L'office HLM de l'Est lyonnais migre sa comptabilité : aucun paiement de sa part pendant trois semaines.",
    duree: 3,
    effet: { dso: 1.5 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  ventes: number;
  dso: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La réponse de la banque à une demande sans dossier, ou à un rendez-vous repoussé. */
  uBanque: number;
  /** Cimier Construction fait-il défaut en semaine 10 ? */
  uCimier: number;
  /** L'assureur-crédit de Norvia coupe-t-il la couverture si l'on paie en retard ? */
  uAssureur: number;
  /** La banque accorde-t-elle une facilité pour le pic de la semaine 12 ? */
  uPic: number;
  /** Chaque semaine au-delà de l'autorisation, la banque rejette-t-elle un virement ? */
  uRejet: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 3263443 + 23);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      ventes: Math.min(1.1, Math.max(0.9, 1 + 0.035 * gauss(r))),
      dso: Math.min(1, Math.max(-1, 0.35 * gauss(r))),
    });
  }
  const uBanque = r();
  const uCimier = r();
  const uAssureur = r();
  const uPic = r();
  const uRejet = [0, ...Array.from({ length: SEMAINES }, () => r())];
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uBanque, uCimier, uAssureur, uPic, uRejet, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le hasard « moyen » sur lequel se calcule une prévision : pas de bruit, pas d'accident. */
const HASARD_MOYEN: Hasard = {
  semaines: [null, ...Array.from({ length: SEMAINES }, () => ({ ventes: 1, dso: 0 }))],
  uBanque: 1,
  uCimier: 1,
  uAssureur: 1,
  uPic: 1,
  uRejet: Array.from({ length: SEMAINES + 1 }, () => 1),
  imprevus: [],
};

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Demandé sans dossier, le relèvement du découvert est accordé trois fois sur dix. */
export const CHANCE_ACCORD = 0.3;
export const banqueAccordeSansDossier = (graine: number) => hasard(graine).uBanque < CHANCE_ACCORD;
/** Le rendez-vous repoussé, la banque réduit l'autorisation une fois sur deux. */
export const banqueReduit = (graine: number) => hasard(graine).uBanque < 0.5;

/** Cimier Construction fait défaut en semaine 10 une fois sur cinq ; on récupère 30 % de la créance. */
export const SEMAINE_CIMIER = 10;
export const RISQUE_CIMIER = 0.2;
export const cimierDefaut = (graine: number) => hasard(graine).uCimier < RISQUE_CIMIER;

/**
 * L'ASSUREUR-CRÉDIT DE NORVIA.
 *
 * Il note ses clients sur leurs retards de paiement : trois semaines de
 * retard, et il coupe la couverture une fois sur deux. Norvia exige alors son
 * arriéré, passe à trente jours, et retient une semaine de livraisons.
 */
export const chanceDeCoupure = (chemin: readonly number[]) => (chemin[D.relance] === 0 ? 0.5 : 0);
const coupeSous = (chemin: readonly number[], h: Hasard) => h.uAssureur < chanceDeCoupure(chemin);
export const norviaCoupe = (chemin: readonly number[], graine: number) =>
  coupeSous(chemin, hasard(graine));

/**
 * LA FACILITÉ POUR LE PIC DE LA SEMAINE 12.
 *
 * Une banque prête à qui la prévient. Prévision à l'appui, elle accorde la
 * facilité neuf fois sur dix si elle a reçu un plan en semaine 3 ; à peine
 * plus d'une fois sur trois si on lui a seulement demandé de l'argent ; une
 * fois sur cinq si on l'a fait attendre.
 */
export function chanceFacilite(chemin: readonly number[]): number {
  if (chemin[D.pic] !== 1) return 0;
  return [0.9, 0.35, 1, 0.2][chemin[D.banque]!] ?? 0;
}
const faciliteSous = (chemin: readonly number[], h: Hasard) => h.uPic < chanceFacilite(chemin);
export const faciliteAccordee = (chemin: readonly number[], graine: number) =>
  faciliteSous(chemin, hasard(graine));

/** La probabilité qu'un virement soit rejeté, une semaine au-delà de l'autorisation. */
export const risqueDeRejet = (chemin: readonly number[]) =>
  chemin[D.banque] === 0 ? 0.3 : chemin[D.banque] === 1 ? 0.5 : 0.6;

export type Semaine = {
  /** Ce que la filiale doit financer en fin de semaine : découvert et avances du factor. */
  besoin: number;
  /** Le découvert bancaire utilisé, positif. */
  decouvert: number;
  /** Ce que le factor avance au-delà de l'autorisation. */
  factor: number;
  autorisation: number;
  depassement: number;
  /** Délai moyen de paiement des clients, en jours de ventes. */
  dso: number;
  /** Stock, en jours de coût des ventes. */
  stock: number;
  /** Besoin en fonds de roulement : créances + stock − dettes fournisseurs. */
  bfr: number;
  /** Ce que Cimier Construction doit encore. */
  cimier: number;
  /** Frais financiers et pertes cumulés depuis le début du trimestre. */
  couts: number;
  /** Ce que la semaine a coûté. */
  cout: number;
  agios: number;
  rejet: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de frais financiers et de pertes : positif, la filiale est sous le budget. */
  objectif: number;
  couts: number;
  /** Agios, commissions, frais d'affacturage et de procédure. */
  frais: number;
  /** Impayés et dépréciation du stock dormant. */
  pertes: number;
  escomptes: number;
  /** Remises perdues, pénalités, ventes manquées, frais de déstockage. */
  manques: number;
  cimierDefaut: boolean;
  cimierPerte: number;
  norviaCoupe: boolean;
  /** La remise de fin de trimestre de Norvia, perdue pour retard de paiement. */
  remisePerdue: boolean;
  banqueAccorde: boolean;
  banqueReduit: boolean;
  faciliteAccordee: boolean;
  rejets: readonly number[];
  semainesEnDepassement: number;
  decouvertFinal: number;
  decouvertMax: number;
  dsoFinal: number;
  stockFinal: number;
}

const tendance = (w: number) => VENTES * (1 + CROISSANCE) ** w;
const bfrClients = (vb: number, dso: number, cimier: number, cede: number) =>
  (vb * dso) / 7 + cimier - cede;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  return simulerSous(chemin, hasard(graine), jours);
}

/** La prévision de trésorerie : les décisions prises, la suite inchangée, sans bruit ni accident. */
export function prevoir(decisions: readonly number[]): Trimestre {
  return simulerSous(
    NEUTRE.map((n, i) => decisions[i] ?? n),
    HASARD_MOYEN,
    0,
  );
}

function simulerSous(chemin: readonly number[], h: Hasard, jours: number): Trimestre {
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const coupe = coupeSous(chemin, h);
  const facilite = faciliteSous(chemin, h);
  const accorde = d2 === 1 && h.uBanque < CHANCE_ACCORD;
  const reduit = d2 === 3 && h.uBanque < 0.5;
  const defaut = h.uCimier < RISQUE_CIMIER;
  const pRejet = risqueDeRejet(chemin);
  const retardFournisseurs = d1 === 0 || d6 === 0;

  // Les ventes des quatre semaines précédentes lissent la base des créances et du stock.
  const ventes: number[] = [tendance(-3), tendance(-2), tendance(-1), tendance(0)];
  const base = () => ventes.slice(-4).reduce((s, x) => s + x, 0) / 4;
  let vb = base();
  let dsoAutres = DSO_AUTRES;
  let cimier = ENCOURS_CIMIER;
  let stock = STOCK_DEPART;
  let dpoNorvia = DPO;
  let dpoAutres = DPO;
  const bfrDe = (dso: number, cede: number) =>
    bfrClients(vb, dso, cimier, cede) +
    (TAUX_ACHAT * vb * stock) / 7 -
    (TAUX_ACHAT * vb * (PART_NORVIA * dpoNorvia + (1 - PART_NORVIA) * dpoAutres)) / 7;
  let bfr = bfrDe(dsoAutres, 0);
  let solde = SOLDE_DEPART;
  let couts = 0;
  let frais = 0;
  let pertes = 0;
  let escomptes = 0;
  let manques = 0;
  let cimierPerte = 0;
  let decouvertMax = -solde;
  const rejets: number[] = [];
  const semaines: (Semaine | null)[] = [null];
  // L'échéancier porte sur ce que Cimier doit encore en semaine 6.
  const echeance = (ENCOURS_CIMIER - (d1 === 1 ? ACOMPTE_CIMIER : 0)) / 8;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let decaisse = 0; // ce qui sort en cash, hors flux d'exploitation
    let cout = 0; // ce que la semaine coûte au regard du budget
    const payer = (x: number, poste: "frais" | "pertes" | "manques") => {
      cout += x;
      decaisse += x;
      if (poste === "frais") frais += x;
      else if (poste === "pertes") pertes += x;
      else manques += x;
    };
    if (w === 1) payer(Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR, "frais");

    // Les ventes, et celles qu'on manque.
    let manque = 0;
    if (d1 === 2 && w >= 3) manque += 0.005; // les artisans relancés pour 300 € vont voir ailleurs
    if (coupe && w === 7) manque += 0.08; // Norvia retient ses livraisons
    if (d3 === 2 && w >= 6) manque += 0.012; // Cimier achète ailleurs
    if (d3 === 0 && w >= 6) manque += 0.003; // Cimier, payé à la commande, commande un peu moins
    if (d4 === 2 && w >= 9 && w <= 12) manque += 0.045; // ruptures sur les références qui tournent
    const v = tendance(w) * n.ventes;
    const venteManquee = v * manque;
    ventes.push(v - venteManquee);
    manques += venteManquee * TAUX_MARGE;
    cout += venteManquee * TAUX_MARGE;
    vb = base();

    // Le délai de paiement des clients : il dérive, sauf si on relance.
    let derive = DERIVE_DSO;
    if (d1 === 1 && w >= 2) derive = 0.15;
    if (d1 === 2 && w >= 3) derive = 0.2;
    dsoAutres += derive + n.dso * 0.3;
    if (d1 === 1 && w >= 2 && w <= 5) dsoAutres -= 1.2;
    if (d1 === 2 && w >= 3 && w <= 6) dsoAutres -= 0.7;
    let bosse = 0;
    for (const a of actifs) bosse += a.imprevu.effet.dso ?? 0;

    // Cimier Construction.
    if (d1 === 1 && w === 3) cimier -= ACOMPTE_CIMIER; // la relance ciblée l'a fait payer en partie
    if (w === 6 && d3 === 1) {
      payer(cimier * COUTS.decoteCimier, "pertes");
      cimier = 0;
    }
    if (w === 6 && d3 === 2) payer(COUTS.injonction, "frais");
    if (d3 === 0 && w >= 6) cimier = Math.max(0, cimier - echeance);
    if (w === SEMAINE_CIMIER && defaut && cimier > 0) {
      cimierPerte = cimier * 0.7;
      payer(cimierPerte, "pertes"); // l'argent qui ne rentrera pas
      cimier = 0;
    }
    if (d3 === 2 && !defaut && w === 12) cimier = 0; // l'injonction de payer a abouti

    // Le stock.
    let deriveStock = DERIVE_STOCK;
    if ((d4 === 0 || d4 === 2) && w >= 8) deriveStock = 0;
    stock += deriveStock;
    if (d4 === 0 && w >= 8 && w <= 12) stock -= 1.5;
    if (d4 === 1 && w >= 8 && w <= 10) stock -= 1.6;
    if (d4 === 2 && w >= 8 && w <= 11) stock -= 2.2;
    if (d4 === 0 && w >= 8 && w <= 10) payer(COUTS.retours / 3, "manques");
    if (d4 === 1 && w >= 8 && w <= 10) payer(COUTS.promotion / 3, "manques");

    // Les fournisseurs.
    if (d1 === 0 && w >= 2 && w <= 4) {
      dpoNorvia += 7;
      dpoAutres += 7;
    }
    if (coupe && w === 7) dpoNorvia = 30;
    if (w >= 10 && d5 === 0) dpoNorvia = Math.max(10, dpoNorvia - 7);
    if (w >= 10 && d5 === 1) dpoNorvia = Math.max(30, dpoNorvia - 7);
    if (d6 === 0 && w === 12) {
      dpoNorvia += 14;
      dpoAutres += 14;
    }
    if (d1 === 0 && w >= 3) payer(COUTS.penaliteFournisseurs, "manques");
    if (d6 === 0 && w >= 12 && d1 !== 0) payer(COUTS.penaliteFournisseurs, "manques");
    const achatsNorvia = TAUX_ACHAT * v * PART_NORVIA;
    if (w >= 10 && (d5 === 0 || d5 === 1)) {
      const e = achatsNorvia * (d5 === 0 ? 0.02 : 0.01);
      escomptes += e;
      cout -= e;
      decaisse -= e;
    }
    if (w === SEMAINES && retardFournisseurs) {
      // La remise de fin de trimestre est perdue : elle ne sera pas versée, elle ne sort pas.
      cout += COUTS.remiseNorvia;
      manques += COUTS.remiseNorvia;
    }

    // Les mesures et leurs frais.
    if (d1 === 1 && w === 2) payer(COUTS.interimRelance, "frais");
    if (d1 === 2 && w === 3) payer(COUTS.relanceGenerale, "frais");
    if (d2 === 0 && w === 4) payer(COUTS.engagement, "frais");
    if (d2 === 1 && w === 4) payer(COUTS.demande, "frais");
    if (d2 === 2 && w === 5) payer(COUTS.factorMiseEnPlace, "frais");
    if (d2 === 2 && w >= 5) payer(v * COUTS.factorCommission, "frais");
    if (d6 === 1 && w === 12) payer(COUTS.facilite, "frais");
    if (d6 === 2 && w === 12) payer(COUTS.ponctuel, "frais");
    for (const a of actifs) {
      if (a.semaine === w && a.imprevu.effet.perte) payer(a.imprevu.effet.perte, "pertes");
      decaisse += a.imprevu.effet.decaissement ?? 0;
    }
    if (w === PIC.semaine) decaisse += PIC.montant;
    if (w === SEMAINES) {
      // La dépréciation du stock dormant : une charge, pas un décaissement.
      const provision = PROVISION[d4 as 0 | 1 | 2 | 3] ?? PROVISION[3];
      cout += provision;
      pertes += provision;
    }

    // La trésorerie : la marge, moins les charges, moins ce que le BFR a pris.
    const cede = d6 === 2 && w >= 12 ? COUTS.cedePonctuel : 0;
    const nouveauBfr = bfrDe(dsoAutres + bosse, cede);
    solde += (v - venteManquee) * TAUX_MARGE - FIXES - (nouveauBfr - bfr) - decaisse;
    bfr = nouveauBfr;

    // Le découvert, l'autorisation, et ce que coûte le dépassement.
    let autorisation = AUTORISATION;
    if (d2 === 0 && w >= 4) autorisation = AUTORISATION_PLAN;
    if (accorde && w >= 5) autorisation = AUTORISATION_DEMANDEE;
    if (reduit && w >= 7) autorisation = AUTORISATION_REDUITE;
    if (facilite && w >= 12) autorisation += FACILITE;
    const avecFactor = d2 === 2 && w >= 5;
    const besoinAvant = Math.max(0, -solde);
    let agios = (Math.min(besoinAvant, autorisation) * TAUX_DECOUVERT) / 52;
    let factor = 0;
    let depassement = 0;
    let rejet = 0;
    if (avecFactor) {
      // Le factor avance les factures : il finance tout ce qui dépasse, à son taux.
      factor = Math.max(0, besoinAvant - autorisation);
      agios += (factor * TAUX_FACTOR) / 52;
    } else {
      depassement = Math.max(0, besoinAvant - autorisation);
      if (depassement > 0) {
        agios += (depassement * TAUX_DEPASSEMENT) / 52 + COMMISSION_DEPASSEMENT;
        if (h.uRejet[w]! < pRejet * Math.min(1, depassement / 200000)) {
          rejet = COUT_REJET + Math.min(depassement, 300000) * PART_REJETEE;
          rejets.push(w);
        }
      }
    }
    solde -= agios + rejet;
    cout += agios + rejet;
    frais += agios + rejet;
    couts += cout;
    const besoin = Math.max(0, -solde);
    const decouvert = Math.max(0, besoin - factor);
    decouvertMax = Math.max(decouvertMax, decouvert);

    semaines.push({
      besoin,
      decouvert,
      factor,
      autorisation,
      depassement,
      dso: (bfrClients(vb, dsoAutres + bosse, cimier, cede) / vb) * 7,
      stock,
      bfr,
      cimier,
      couts,
      cout,
      agios,
      rejet,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const derniere = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: BUDGET - couts,
    couts,
    frais,
    pertes,
    escomptes,
    manques,
    cimierDefaut: defaut,
    cimierPerte,
    norviaCoupe: coupe,
    remisePerdue: retardFournisseurs,
    banqueAccorde: accorde,
    banqueReduit: reduit,
    faciliteAccordee: facilite,
    rejets,
    semainesEnDepassement: pleines.filter((s) => s.depassement > 0).length,
    decouvertFinal: derniere.decouvert,
    decouvertMax,
    dsoFinal: derniere.dso,
    stockFinal: derniere.stock,
  };
}

/** La situation du lundi de la semaine 1. */
export const DEPART = (() => {
  const vb = (tendance(-3) + tendance(-2) + tendance(-1) + tendance(0)) / 4;
  const clients = bfrClients(vb, DSO_AUTRES, ENCOURS_CIMIER, 0);
  const stock = (TAUX_ACHAT * vb * STOCK_DEPART) / 7;
  const fournisseurs = (TAUX_ACHAT * vb * DPO) / 7;
  return {
    decouvert: -SOLDE_DEPART,
    dso: (clients / vb) * 7,
    stock: STOCK_DEPART,
    bfr: clients + stock - fournisseurs,
    clients,
    valeurStock: stock,
    fournisseurs,
  };
})();

/** Ce qui s'est passé pendant des semaines : Cimier, Norvia, la banque, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    cimierDefaut: t.cimierDefaut && dans(SEMAINE_CIMIER),
    norviaCoupe: t.norviaCoupe && dans(6),
    banqueReduit: t.banqueReduit && dans(7),
    facilite: chemin[D.pic] === 1 && dans(12) ? t.faciliteAccordee : null,
    injonction: chemin[D.cimier] === 2 && !t.cimierDefaut && dans(12),
    rejets: t.rejets.filter(dans),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureTresorerie {
  decouvert: number | null;
  dso: number | null;
  stock: number | null;
  bfr: number | null;
  couts: number | null;
  autorisation: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  cimier: number | null;
  /** Le besoin de financement au plus haut d'ici la semaine 13, selon la prévision. */
  previsionPic: number | null;
  /** La semaine où la prévision place ce pic. */
  semainePic: number | null;
  /** Le même pic si l'on prend l'escompte de Norvia (tant que la décision reste à prendre). */
  picAvecEscompte: number | null;
  /** La première semaine où la prévision passe au-delà de l'autorisation ; 0 : jamais. */
  premierDepassement: number | null;
}

/**
 * Ce que la responsable financière lit à la fin d'une semaine ; les décisions
 * à venir comptent comme « ne rien changer ». La prévision part de la
 * situation réelle de la semaine et y ajoute les flux d'un trimestre moyen.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureTresorerie {
  const p = prevoir(decisions);
  const e = prevoir([...NEUTRE.slice(0, D.escompte).map((n, i) => decisions[i] ?? n), 0]);
  const pic = (decalage: number, depuis: number, q = p) => {
    let max = -Infinity;
    let quand = depuis;
    let premier = 0;
    for (let w = Math.max(1, depuis); w <= SEMAINES; w += 1) {
      const b = q.semaines[w]!.besoin + decalage;
      if (b > max) {
        max = b;
        quand = w;
      }
      if (!premier && b > q.semaines[w]!.autorisation) premier = w;
    }
    return { max, quand, premier };
  };
  if (semaine === 0) {
    const { max, quand, premier } = pic(0, 1);
    return {
      decouvert: DEPART.decouvert,
      dso: DEPART.dso,
      stock: DEPART.stock,
      bfr: DEPART.bfr,
      couts: 0,
      autorisation: AUTORISATION,
      budgetADate: 0,
      cimier: ENCOURS_CIMIER,
      previsionPic: max,
      semainePic: quand,
      picAvecEscompte: pic(0, 1, e).max,
      premierDepassement: premier,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  const decalage = (q: Trimestre) => s.besoin - q.semaines[semaine]!.besoin;
  const { max, quand, premier } =
    semaine < SEMAINES
      ? pic(decalage(p), semaine + 1)
      : { max: s.besoin, quand: SEMAINES, premier: 0 };
  const avecEscompte =
    semaine < SEMAINES && decisions.length <= D.escompte
      ? pic(decalage(e), semaine + 1, e).max
      : max;
  return {
    decouvert: s.decouvert,
    dso: s.dso,
    stock: s.stock,
    bfr: s.bfr,
    couts: s.couts,
    autorisation: s.autorisation,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    cimier: s.cimier,
    previsionPic: max,
    semainePic: quand,
    picAvecEscompte: avecEscompte,
    premierDepassement: premier,
  };
}
