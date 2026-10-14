/**
 * LES ÉCARTS DU BUDGET — le modèle de l'atelier de préfabrication béton.
 *
 * L'atelier de Saint-Priest coule des linteaux, des bordures et des regards :
 * du ciment, des granulats, de l'acier, des heures d'opérateurs et une
 * vibro-presse. Chaque tonne bonne a un coût préétabli (la fiche de coût de
 * l'atelier). Treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir en DÉCOMPOSANT les écarts :
 *
 *   · L'ÉCART GLOBAL MÉLANGE TOUT. Comparé au budget statique (250 t par
 *     semaine), le réel « dépasse » d'abord parce que l'atelier produit plus :
 *     c'est un écart sur volume, pas une dérive. Seul le budget flexible
 *     (coût préétabli × production réelle) isole les écarts sur coûts, qui
 *     se décomposent à leur tour en écarts sur prix (prix réel − prix
 *     préétabli) × quantité réelle, et sur quantités (quantité réelle −
 *     quantité préétablie pour la production réelle) × prix préétabli ; de
 *     même pour la main-d'œuvre, en écart sur taux et écart sur temps.
 *   · LA CAUSE PRINCIPALE EST TECHNIQUE, ET ELLE SE LIT DANS LES QUANTITÉS.
 *     Depuis son dernier entretien, la presse vibre trop bas : le béton se
 *     compacte mal, les bordures s'effritent au démoulage. Les opérateurs
 *     compensent par un demi-sac de ciment par gâchée (écart sur quantité de
 *     ciment), et les pièces rebutées se paient deux fois : la matière perdue
 *     et les heures pour casser, évacuer, refaire (écart sur temps). Le prix
 *     du ciment a monté aussi, mais il ne pèse qu'un tiers de l'écart sur
 *     quantité. Retirer le demi-sac sans régler la presse fait rebuter plus.
 *   · UN ÉCART FAVORABLE PEUT EN CACHER UN DÉFAVORABLE. Un ciment moins cher
 *     qui demande plus de dosage, un dosage baissé pour « faire » un écart
 *     favorable, des heures supplémentaires supprimées pour ramener le taux
 *     horaire : chaque fois, l'écart qu'on regarde s'améliore et celui qu'on
 *     ne regarde pas se dégrade davantage, en rebuts, en retards, en lots
 *     refusés.
 *
 * Le trimestre est jugé en euros : l'écart au budget flexible, pertes
 * comprises (pénalités de retard, marge perdue sur les commandes qui partent,
 * lots refusés). Positif, l'atelier a produit pour moins que le coût
 * préétabli de sa production réelle.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** La fiche de coût préétabli de l'atelier, par tonne BONNE (2 % de rebuts normaux compris). */
export const STANDARD = {
  /** Tonnes de ciment par tonne bonne, et prix préétabli en €/t. */
  ciment: 0.15,
  prixCiment: 150,
  granulats: 0.8,
  prixGranulats: 20,
  acier: 0.025,
  prixAcier: 1000,
  /** Heures de main-d'œuvre directe par tonne bonne, et taux horaire préétabli. */
  heures: 1.25,
  taux: 38,
} as const;

/** Le coût préétabli d'une tonne bonne : 111 €. */
export const COUT_PREETABLI =
  STANDARD.ciment * STANDARD.prixCiment +
  STANDARD.granulats * STANDARD.prixGranulats +
  STANDARD.acier * STANDARD.prixAcier +
  STANDARD.heures * STANDARD.taux;

/** La production budgétée, en tonnes bonnes par semaine : celle du budget statique. */
export const VOLUME_BUDGET = 250;
export const BUDGET_STATIQUE = VOLUME_BUDGET * SEMAINES * COUT_PREETABLI;
/** Les commandes ordinaires, en tonnes par semaine : l'activité tourne au-dessus du budget. */
export const DEMANDE = 260;
/** Le début de la saison des chantiers de voirie : les commandes prennent 10 %. */
export const SAISON = { des: 12, hausse: 0.1 } as const;

export const REBUT_NORMAL = 0.02;
/** Par tonne COULÉE, rebuts normaux déduits : ce que la fiche suppose. */
export const PAR_TONNE_COULEE = {
  ciment: STANDARD.ciment * (1 - REBUT_NORMAL),
  granulats: STANDARD.granulats * (1 - REBUT_NORMAL),
  acier: STANDARD.acier * (1 - REBUT_NORMAL),
} as const;
/** Heures pour casser, évacuer et refaire le moule d'une tonne rebutée. */
export const MANUTENTION_REBUT = 1.3;
/** Heures de coulage par tonne coulée : la fiche, moins la manutention des rebuts normaux. */
export const HEURES_COULEE =
  STANDARD.heures * (1 - REBUT_NORMAL) - REBUT_NORMAL * MANUTENTION_REBUT;

/**
 * LA DÉRIVE DE LA PRESSE. La vibration tourne à 42 Hz au lieu de 50 depuis
 * l'entretien de l'automne. Avec le demi-sac de ciment des opérateurs, 4 %
 * de rebuts en plus ; sans lui, 7 %. Les moules de regards usés en ajoutent 1 %.
 */
export const DERIVE = {
  vibrationReelle: 42,
  vibrationNominale: 50,
  surdosage: 0.08,
  rebutPresse: 0.04,
  rebutPresseSansSurdosage: 0.07,
  rebutMoules: 0.01,
  /** Heures d'attente par tonne bonne, quand la presse se bloque sur une pièce mal compactée. */
  attente: 0.025,
} as const;

/** Les heures normales de l'équipe par semaine (dix opérateurs). */
export const CAPACITE = 350;
export const HEURES_SUP = { plafond: 40, majoration: 0.25, samedis: 110, limitees: 15 } as const;
export const TAUX_SUP = STANDARD.taux * (1 + HEURES_SUP.majoration);
export const INTERIM = { heures: 70, taux: 40, frais: 500 } as const;

/** Le mois qui précède le trimestre, tel que le contrôle de gestion l'a arrêté. */
export const MOIS_DERNIER = {
  /** Production budgétée et réelle, en tonnes bonnes. */
  budget: 1000,
  production: 1040,
  ciment: 178,
  prixCiment: 156,
  granulats: 876,
  acier: 27.4,
  heures: 1470,
  taux: 38.4,
  rebut: 0.07,
} as const;

/** Les écarts du mois dernier, en euros : positif, défavorable (réel au-dessus du préétabli). */
export const ECARTS_MOIS_DERNIER = (() => {
  const m = MOIS_DERNIER;
  const s = STANDARD;
  const statique = m.budget * COUT_PREETABLI;
  const flexible = m.production * COUT_PREETABLI;
  const reel =
    m.ciment * m.prixCiment +
    m.granulats * s.prixGranulats +
    m.acier * s.prixAcier +
    m.heures * m.taux;
  return {
    statique,
    flexible,
    reel,
    global: reel - statique,
    volume: flexible - statique,
    prixCiment: (m.prixCiment - s.prixCiment) * m.ciment,
    quantiteCiment: (m.ciment - s.ciment * m.production) * s.prixCiment,
    quantiteGranulats: (m.granulats - s.granulats * m.production) * s.prixGranulats,
    quantiteAcier: (m.acier - s.acier * m.production) * s.prixAcier,
    taux: (m.taux - s.taux) * m.heures,
    temps: (m.heures - s.heures * m.production) * s.taux,
  };
})();

/** Le prix du ciment : celui du mois dernier, la hausse annoncée, ce que la négociation obtient. */
export const PRIX_CIMENT = {
  actuel: 156,
  hausse: 168,
  negocie: 158,
  compose: 146,
  /** Le geste que l'acheteur obtient en faisant jouer la concurrence. */
  geste: 2,
} as const;
export const HAUSSE_DES = 7;
/** Le ciment composé : moins cher, mais plus lent à durcir. Il faut doser plus pour démouler. */
export const CIMENT_COMPOSE = { dosage: 0.18, rebut: 0.015 } as const;
/** La cimenterie accepte l'engagement de volume six fois sur dix. */
export const CHANCE_CIMENTERIE = 0.6;
export const PRIX_ACIER_HAUSSE = 1060;

/** La commande de la ZAC des Tuileries : 360 t de bordures, livrées des semaines 8 à 11. */
export const COMMANDE_ZAC = { tonnes: 360, de: 8, a: 11, prix: 170 } as const;
/** La marge sur coût variable d'une tonne vendue : prix moyen moins coût préétabli. */
export const MARGE = COMMANDE_ZAC.prix - COUT_PREETABLI;
/** Pénalité par tonne livrée en retard et par semaine ; au-delà de 100 t, les commandes partent. */
export const PENALITE = 15;
export const RETARD_MAX = 100;
/** Un lot refusé à la réception : 80 t de bordures à refaire et la pénalité du client. */
export const LOT_REFUSE = 12000;
/** Une panne de presse en pleine saison : deux jours d'arrêt. */
export const PANNE = { reparation: 3000, capacite: 0.5, heuresPerdues: 120 } as const;
/** Un intérimaire sur deux n'a jamais vu de béton ; un changement de moule mal réglé fait rebuter. */
export const CHANCE_INTERIM_EXPERIMENTE = 0.6;
export const CHANCE_FICHE_INCOMPLETE = 0.35;
export const CHANCE_ROULEMENT_USE = 0.35;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, le surdosage et les rebuts continuent. */
export const PERTE_PAR_JOUR = 1200;

export const COUTS = {
  technicien: 2800,
  roulement: 1900,
  moules: 2500,
  essais: 900,
  doseur: 5000,
  formation: 2600,
  binome: 1200,
  entretien: 1800,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  ecart: 0,
  dosage: 1,
  ciment: 2,
  commande: 3,
  regleur: 4,
  revue: 5,
} as const;

/** Ne rien changer à l'atelier, décision par décision. */
export const NEUTRE = [0, 2, 2, 3, 2, 2] as const;

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
  effet: {
    /** La part de la capacité de la semaine, et les heures payées sans produire. */
    capacite?: number;
    heuresPerdues?: number;
    /** Granulats humides : on en consomme plus, et un peu plus de ciment. */
    granulats?: number;
    ciment?: number;
    /** Heures de manutention en plus, par tonne bonne. */
    manutention?: number;
    /** Heures normales en moins (un opérateur absent). */
    absence?: number;
    /** Le prix de l'acier, jusqu'à la fin du trimestre. */
    prixAcier?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gel",
    titre: "Gel au petit matin",
    de: "Djamel Amrouche",
    role: "Chef d'équipe",
    texte:
      "Moins six ce matin et hier : impossible de couler avant midi deux jours de suite. L'équipe a nettoyé les moules en attendant.",
    duree: 1,
    effet: { capacite: 0.8, heuresPerdues: 60 },
  },
  {
    id: "granulats",
    titre: "Granulats détrempés",
    de: "Adrien Kowalski",
    role: "Acheteur",
    texte:
      "La carrière a livré deux semaines de gravillons détrempés par les pluies : il faut corriger l'eau et doser plus large.",
    duree: 2,
    effet: { granulats: 1.06, ciment: 1.03 },
  },
  {
    id: "pont",
    titre: "Panne du pont roulant",
    de: "Djamel Amrouche",
    role: "Chef d'équipe",
    texte:
      "Le pont roulant est en panne jusqu'à vendredi : on sort les regards au chariot, deux fois plus lentement.",
    duree: 1,
    effet: { manutention: 0.12 },
  },
  {
    id: "acier",
    titre: "Hausse de l'acier",
    de: "Adrien Kowalski",
    role: "Acheteur",
    texte:
      "Le fournisseur d'armatures passe une hausse de 6 % à compter de lundi, jusqu'à nouvel ordre : 1 060 € la tonne.",
    duree: 13,
    effet: { prixAcier: PRIX_ACIER_HAUSSE },
  },
  {
    id: "accident",
    titre: "Accident du travail",
    de: "Djamel Amrouche",
    role: "Chef d'équipe",
    texte:
      "Ange s'est écrasé la main entre deux moules. Rien de cassé, mais il est arrêté deux semaines.",
    duree: 2,
    effet: { absence: 35 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Les commandes de chaque semaine, rapportées à la moyenne. */
  demande: readonly number[];
  /** Le technicien trouve-t-il le roulement du vibreur usé ? */
  uRoulement: number;
  /** La cimenterie accepte-t-elle l'engagement de volume ? */
  uCimenterie: number;
  /** L'agence trouve-t-elle des intérimaires qui connaissent le béton ? */
  uInterim: number;
  /** La fiche de réglage d'Armel couvre-t-elle tous les moules ? */
  uFiche: number;
  /** La presse lâche-t-elle en semaine 12 ? */
  uPanne: number;
  /** Les deux réceptions de lots par les clients : semaines 7 et 13. */
  uLots: readonly [number, number];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000253 + 7);
  const demande: number[] = [0];
  for (let i = 1; i <= SEMAINES; i += 1) {
    demande.push(Math.min(1.12, Math.max(0.88, 1 + 0.05 * gauss(r))));
  }
  const uRoulement = r();
  const uCimenterie = r();
  const uInterim = r();
  const uFiche = r();
  const uPanne = r();
  const uLots: [number, number] = [r(), r()];
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { demande, uRoulement, uCimenterie, uInterim, uFiche, uPanne, uLots, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le technicien trouve le roulement du vibreur usé : la pièce n'arrive qu'en semaine 5. */
export const roulementUse = (graine: number) => hasard(graine).uRoulement < CHANCE_ROULEMENT_USE;
export const cimenterieAccepte = (graine: number) => hasard(graine).uCimenterie < CHANCE_CIMENTERIE;
export const interimExperimente = (graine: number) =>
  hasard(graine).uInterim < CHANCE_INTERIM_EXPERIMENTE;
export const ficheIncomplete = (graine: number) => hasard(graine).uFiche < CHANCE_FICHE_INCOMPLETE;

/**
 * LA PRESSE COMPACTE-T-ELLE MAL CETTE SEMAINE ? 1 : à 42 Hz ; 0 : réglée.
 *
 * Le technicien du fabricant la règle en semaine 2 ; si le roulement du
 * vibreur est usé, elle ne tient qu'à moitié jusqu'à la pièce de la semaine
 * 5. Le formateur du fabricant, venu en semaine 10, la règle aussi s'il la
 * trouve encore déréglée.
 */
export function defautPresse(chemin: readonly number[], graine: number, w: number): number {
  if (chemin[D.ecart] === 1 && w >= 2) return roulementUse(graine) && w < 5 ? 0.4 : 0;
  if (chemin[D.regleur] === 0 && w >= 10) return 0;
  return 1;
}

/** La presse n'a jamais été réglée avant la saison : ses vibreurs chauffent. */
const presseJamaisReglee = (chemin: readonly number[]) =>
  chemin[D.ecart] !== 1 && chemin[D.regleur] !== 0;

/** Le risque que la presse lâche en semaine 12, en pleine saison. */
export function risquePanne(chemin: readonly number[]): number {
  if (chemin[D.revue] === 1) return 0.05;
  return presseJamaisReglee(chemin) ? 0.55 : 0.4;
}
export const panneTombe = (chemin: readonly number[], graine: number) =>
  hasard(graine).uPanne < risquePanne(chemin);

/** Le surdosage de ciment de la semaine : le demi-sac des opérateurs, ou le dosage baissé. */
export function surdosage(chemin: readonly number[], w: number): number {
  if (chemin[D.revue] === 0 && w >= 12) return -0.05;
  if (chemin[D.ecart] === 3 && w >= 2) return 0;
  if (chemin[D.dosage] === 0 && w >= 4) return 0;
  if (chemin[D.dosage] === 1 && w >= 6) return 0;
  return DERIVE.surdosage;
}

const cimentCompose = (chemin: readonly number[], w: number) =>
  chemin[D.ciment] === 0 && w >= HAUSSE_DES;

/**
 * LE RISQUE QU'UN CLIENT REFUSE UN LOT, à la réception des semaines 7 et 13.
 *
 * Un béton mal compacté sans le ciment qui le compensait, un dosage baissé
 * sous la formule, un ciment lent démoulé trop tôt : la résistance au
 * gel-dégel ne passe plus.
 */
export function risqueLot(chemin: readonly number[], graine: number, lot: 0 | 1): number {
  const [de, a] = lot === 0 ? [2, 7] : [8, 13];
  let risque = 0.03;
  let fragile = false;
  for (let w = de; w <= a; w += 1) {
    if (surdosage(chemin, w) <= 0 && defautPresse(chemin, graine, w) >= 0.5) fragile = true;
  }
  if (fragile) risque += 0.35;
  if (lot === 1 && chemin[D.revue] === 0) risque += 0.4;
  if (cimentCompose(chemin, a)) risque += lot === 0 ? 0.1 : 0.15;
  return Math.min(0.9, risque);
}
export const lotRefuse = (chemin: readonly number[], graine: number, lot: 0 | 1) =>
  hasard(graine).uLots[lot] < risqueLot(chemin, graine, lot);

export type Semaine = {
  /** Tonnes bonnes produites, commandées, et en retard en fin de semaine. */
  production: number;
  demande: number;
  retard: number;
  /** Part du tonnage coulé partie au rebut. */
  rebut: number;
  /** Ciment consommé par tonne bonne, en kg. */
  ciment: number;
  /** Heures de main-d'œuvre par tonne bonne. */
  heures: number;
  /** Taux horaire moyen payé, heures supplémentaires et intérim compris. */
  taux: number;
  prixCiment: number;
  heuresSup: number;
  /** Coûts réels de production : matières et main-d'œuvre. */
  coutProduction: number;
  /** Ce que la production réelle aurait dû coûter : coût préétabli × tonnes bonnes. */
  flexible: number;
  statique: number;
  /** Les dépenses que les décisions ajoutent : technicien, essais, formation… */
  charges: number;
  /** Pénalités de retard, marge perdue, lots refusés, réparations. */
  pertes: number;
  /** Coût réel de production par tonne bonne, hors charges et pertes. */
  coutParTonne: number;
  ecartPrixCiment: number;
  ecartQuantiteCiment: number;
  ecartPrixAutres: number;
  ecartQuantiteAutres: number;
  ecartTaux: number;
  ecartTemps: number;
  /** L'écart de la semaine au budget flexible, charges et pertes comprises : positif, défavorable. */
  ecart: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget flexible, pertes comprises : positif, l'atelier a coûté moins que prévu. */
  objectif: number;
  production: number;
  flexible: number;
  statique: number;
  /** Coût réel total : production, charges des décisions, pertes. */
  reel: number;
  ecarts: {
    prixCiment: number;
    quantiteCiment: number;
    prixAutres: number;
    quantiteAutres: number;
    taux: number;
    temps: number;
    charges: number;
    pertes: number;
    /** Budget flexible − budget statique : ce que l'activité ajoute, sans rien dire des coûts. */
    volume: number;
  };
  rebutMoyen: number;
  /** Ciment par tonne bonne sur les quatre dernières semaines, en kg. */
  cimentFin: number;
  heuresFin: number;
  /** Tonnes perdues : commandes parties ailleurs, faute d'être livrées. */
  perdu: number;
  retardFin: number;
  lotsRefuses: number;
  semainesLotsRefuses: readonly number[];
  panne: boolean;
  roulementUse: boolean;
  /** La réponse de la cimenterie, si on lui a demandé. */
  cimenterie: "accepte" | "refuse" | null;
  interim: "experimente" | "debutant" | null;
  ficheIncomplete: boolean | null;
  commandeAcceptee: boolean;
  /** L'écart sur quantité de ciment du mois dernier, en k€ : ce que la prévision demande. */
  ecartQuantiteCimentMois: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const accepte = d3 === 1 ? cimenterieAccepte(graine) : null;
  const experimente = d4 === 2 ? interimExperimente(graine) : null;
  const incomplete = d5 === 1 ? ficheIncomplete(graine) : null;
  const panne = panneTombe(chemin, graine);
  const lots = [lotRefuse(chemin, graine, 0), lotRefuse(chemin, graine, 1)];
  const commande = d4 !== 0;
  const semaines: (Semaine | null)[] = [null];
  let retard = 0;
  let perdu = 0;
  let prixAcier: number = STANDARD.prixAcier;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let charges = 0;
    let pertes = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    const zac = w >= COMMANDE_ZAC.de && w <= COMMANDE_ZAC.a;
    const parSemaine = COMMANDE_ZAC.tonnes / (COMMANDE_ZAC.a - COMMANDE_ZAC.de + 1);

    // Le ciment : son prix, son type, et ce que les opérateurs en mettent.
    const compose = cimentCompose(chemin, w);
    let prixCiment: number =
      w < HAUSSE_DES
        ? PRIX_CIMENT.actuel
        : compose
          ? PRIX_CIMENT.compose
          : accepte
            ? PRIX_CIMENT.negocie
            : PRIX_CIMENT.hausse;
    if (d1 === 0 && w >= 3 && !compose) prixCiment -= PRIX_CIMENT.geste;
    const s = surdosage(chemin, w);
    const defaut = defautPresse(chemin, graine, w);

    // Les rebuts : la presse, les moules, le ciment, les mains neuves, les réglages.
    let rebut: number = REBUT_NORMAL;
    rebut += defaut * (s >= 0.04 ? DERIVE.rebutPresse : DERIVE.rebutPresseSansSurdosage);
    if (!(d1 === 2 && w >= 3)) rebut += DERIVE.rebutMoules;
    if (compose) rebut += CIMENT_COMPOSE.rebut;
    if (s < 0) rebut += 0.01;
    if (d4 === 2 && zac && !experimente) rebut += 0.02;
    if (d4 === 1 && zac) rebut += 0.01;
    if (w >= 11) {
      // Armel est parti : à chaque changement de moule, quelqu'un d'autre règle la presse.
      if (d5 === 2) rebut += 0.04;
      else if (d5 === 1) rebut += incomplete ? 0.035 : 0.01;
      else rebut += 0.005;
    }

    // Les heures par tonne bonne : couler, casser et refaire les rebuts, attendre la presse.
    let manutention = 0;
    for (const a of actifs) manutention += a.imprevu.effet.manutention ?? 0;
    const heures =
      (HEURES_COULEE + MANUTENTION_REBUT * rebut) / (1 - rebut) +
      DERIVE.attente * defaut +
      manutention;

    // Ce que l'atelier peut produire cette semaine.
    let demande = DEMANDE * h.demande[w]! * (w >= SAISON.des ? 1 + SAISON.hausse : 1);
    if (commande && zac) demande += parSemaine;
    let normales = CAPACITE;
    for (const a of actifs) normales -= a.imprevu.effet.absence ?? 0;
    let plafondSup: number = HEURES_SUP.plafond;
    if (d1 === 3 && w >= 2) plafondSup = HEURES_SUP.limitees;
    if (d2 === 3 && w >= 4) plafondSup = 0;
    if (d4 === 1 && zac) plafondSup = HEURES_SUP.samedis;
    const interim = d4 === 2 && zac ? INTERIM.heures : 0;
    let part = 1;
    let perdues = 0;
    for (const a of actifs) {
      part *= a.imprevu.effet.capacite ?? 1;
      perdues += a.imprevu.effet.heuresPerdues ?? 0;
    }
    if (panne && w === 12) {
      part *= PANNE.capacite;
      perdues += PANNE.heuresPerdues;
      pertes += PANNE.reparation;
    }
    const disponibles = (normales + interim + plafondSup) * part;
    const aProduire = demande + retard;
    const production = Math.min(aProduire, disponibles / heures);
    retard = aProduire - production;
    if (retard > RETARD_MAX) {
      perdu += retard - RETARD_MAX;
      pertes += (retard - RETARD_MAX) * MARGE;
      retard = RETARD_MAX;
    }
    pertes += retard * PENALITE;
    if (d4 === 0 && zac) pertes += parSemaine * MARGE;

    // La main-d'œuvre : heures normales d'abord, puis l'intérim, puis les heures supplémentaires.
    const travaillees = production * heures + perdues;
    const enNormales = Math.min(travaillees, normales);
    const enInterim = Math.min(travaillees - enNormales, interim);
    const heuresSup = travaillees - enNormales - enInterim;
    const coutMO = enNormales * STANDARD.taux + enInterim * INTERIM.taux + heuresSup * TAUX_SUP;
    const taux = coutMO / Math.max(1, travaillees);

    // Les matières, pour tout le tonnage coulé : les pièces bonnes et les rebuts.
    const coulee = production / (1 - rebut);
    let facteurCiment = (1 + s) * (compose ? 1 + CIMENT_COMPOSE.dosage : 1);
    let facteurGranulats = 1;
    for (const a of actifs) {
      facteurCiment *= a.imprevu.effet.ciment ?? 1;
      facteurGranulats *= a.imprevu.effet.granulats ?? 1;
      if (a.imprevu.effet.prixAcier && w === a.semaine) prixAcier = a.imprevu.effet.prixAcier;
    }
    const ciment = coulee * PAR_TONNE_COULEE.ciment * facteurCiment;
    const granulats = coulee * PAR_TONNE_COULEE.granulats * facteurGranulats;
    const acier = coulee * PAR_TONNE_COULEE.acier;
    const coutProduction =
      ciment * prixCiment + granulats * STANDARD.prixGranulats + acier * prixAcier + coutMO;

    // Ce que les décisions coûtent en elles-mêmes.
    if (d1 === 1 && w === 2) charges += COUTS.technicien;
    if (d1 === 1 && w === 5 && roulementUse(graine)) charges += COUTS.roulement;
    if (d1 === 2 && w === 3) charges += COUTS.moules;
    if (d2 === 0 && w === 4) charges += COUTS.essais;
    if (d2 === 1 && w === 6) charges += COUTS.doseur;
    if (d4 === 2 && w === COMMANDE_ZAC.de) charges += INTERIM.frais;
    if (d5 === 0 && w === 10) charges += COUTS.formation;
    if (d5 === 1 && w === 10) charges += COUTS.binome;
    if (d6 === 1 && w === 12) charges += COUTS.entretien;
    if (w === 7 && lots[0]) pertes += LOT_REFUSE;
    if (w === 13 && lots[1]) pertes += LOT_REFUSE;

    const flexible = production * COUT_PREETABLI;
    semaines.push({
      production,
      demande,
      retard,
      rebut,
      ciment: (ciment / production) * 1000,
      heures: travaillees / production,
      taux,
      prixCiment,
      heuresSup,
      coutProduction,
      flexible,
      statique: VOLUME_BUDGET * COUT_PREETABLI,
      charges,
      pertes,
      coutParTonne: coutProduction / production,
      ecartPrixCiment: (prixCiment - STANDARD.prixCiment) * ciment,
      ecartQuantiteCiment: (ciment - STANDARD.ciment * production) * STANDARD.prixCiment,
      ecartPrixAutres: (prixAcier - STANDARD.prixAcier) * acier,
      ecartQuantiteAutres:
        (granulats - STANDARD.granulats * production) * STANDARD.prixGranulats +
        (acier - STANDARD.acier * production) * STANDARD.prixAcier,
      ecartTaux: (taux - STANDARD.taux) * travaillees,
      ecartTemps: (travaillees - STANDARD.heures * production) * STANDARD.taux,
      ecart: coutProduction + charges + pertes - flexible,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const somme = (f: (x: Semaine) => number) => pleines.reduce((t, x) => t + f(x), 0);
  const production = somme((x) => x.production);
  const flexible = somme((x) => x.flexible);
  const reel = somme((x) => x.coutProduction + x.charges + x.pertes);
  const fin = pleines.slice(-4);
  const prodFin = fin.reduce((t, x) => t + x.production, 0);
  return {
    semaines,
    objectif: flexible - reel,
    production,
    flexible,
    statique: BUDGET_STATIQUE,
    reel,
    ecarts: {
      prixCiment: somme((x) => x.ecartPrixCiment),
      quantiteCiment: somme((x) => x.ecartQuantiteCiment),
      prixAutres: somme((x) => x.ecartPrixAutres),
      quantiteAutres: somme((x) => x.ecartQuantiteAutres),
      taux: somme((x) => x.ecartTaux),
      temps: somme((x) => x.ecartTemps),
      charges: somme((x) => x.charges),
      pertes: somme((x) => x.pertes),
      volume: flexible - BUDGET_STATIQUE,
    },
    rebutMoyen: somme((x) => x.rebut * x.production) / production,
    cimentFin: fin.reduce((t, x) => t + x.ciment * x.production, 0) / prodFin,
    heuresFin: fin.reduce((t, x) => t + x.heures * x.production, 0) / prodFin,
    perdu,
    retardFin: retard,
    lotsRefuses: lots.filter(Boolean).length,
    semainesLotsRefuses: [lots[0] ? 7 : 0, lots[1] ? 13 : 0].filter((x) => x > 0),
    panne,
    roulementUse: d1 === 1 && roulementUse(graine),
    cimenterie: accepte === null ? null : accepte ? "accepte" : "refuse",
    interim: experimente === null ? null : experimente ? "experimente" : "debutant",
    ficheIncomplete: incomplete,
    commandeAcceptee: commande,
    ecartQuantiteCimentMois: ECARTS_MOIS_DERNIER.quantiteCiment / 1000,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, lots, panne, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    roulement: t.roulementUse && dans(5),
    cimenterie: t.cimenterie !== null && dans(6),
    interim: t.interim !== null && dans(8),
    fiche: t.ficheIncomplete === true && dans(11),
    lots: t.semainesLotsRefuses.filter(dans),
    panne: t.panne && dans(12),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureAtelier {
  /** Cumul, réel − budget flexible, charges et pertes comprises : positif, défavorable. */
  ecartFlexible: number | null;
  /** Cumul, réel − budget statique : positif, défavorable en apparence. */
  ecartStatique: number | null;
  production: number | null;
  rebut: number | null;
  ciment: number | null;
  heures: number | null;
  taux: number | null;
  prixCiment: number | null;
  /** La production budgétée à date. */
  volumeADate: number | null;
  /** Budget flexible − budget statique, cumulé : l'effet de volume. */
  volume: number | null;
  ecartPrixCiment: number | null;
  ecartQuantiteCiment: number | null;
  ecartTaux: number | null;
  ecartTemps: number | null;
  ecartQuantiteAutres: number | null;
  retard: number | null;
  heuresSup: number | null;
}

/** Ce que Léna lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAtelier {
  if (semaine === 0) {
    const m = MOIS_DERNIER;
    return {
      ecartFlexible: 0,
      ecartStatique: 0,
      production: 0,
      rebut: m.rebut,
      ciment: (m.ciment / m.production) * 1000,
      heures: m.heures / m.production,
      taux: m.taux,
      prixCiment: m.prixCiment,
      volumeADate: 0,
      volume: 0,
      ecartPrixCiment: 0,
      ecartQuantiteCiment: 0,
      ecartTaux: 0,
      ecartTemps: 0,
      ecartQuantiteAutres: 0,
      retard: 0,
      heuresSup: m.heures / 4 - CAPACITE > 0 ? m.heures / 4 - CAPACITE : 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const ecoulees = t.semaines.slice(1, semaine + 1) as Semaine[];
  const cumul = (f: (x: Semaine) => number) => ecoulees.reduce((x, w) => x + f(w), 0);
  const s = t.semaines[semaine]!;
  const reel = cumul((x) => x.coutProduction + x.charges + x.pertes);
  return {
    ecartFlexible: reel - cumul((x) => x.flexible),
    ecartStatique: reel - cumul((x) => x.statique),
    production: cumul((x) => x.production),
    rebut: s.rebut,
    ciment: s.ciment,
    heures: s.heures,
    taux: s.taux,
    prixCiment: s.prixCiment,
    volumeADate: VOLUME_BUDGET * semaine,
    volume: cumul((x) => x.flexible - x.statique),
    ecartPrixCiment: cumul((x) => x.ecartPrixCiment),
    ecartQuantiteCiment: cumul((x) => x.ecartQuantiteCiment),
    ecartTaux: cumul((x) => x.ecartTaux),
    ecartTemps: cumul((x) => x.ecartTemps),
    ecartQuantiteAutres: cumul((x) => x.ecartQuantiteAutres),
    retard: s.retard,
    heuresSup: s.heuresSup,
  };
}
