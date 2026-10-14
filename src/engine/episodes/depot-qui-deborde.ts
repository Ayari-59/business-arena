/**
 * LE DÉPÔT QUI DÉBORDE — le modèle du dépôt régional de Saint-Priest.
 *
 * Un dépôt qui approvisionne les agences de la région : trois classes de
 * références, treize semaines, six décisions. Le dépôt est à la fois en
 * rupture sur ce qui se vend et plein de ce qui ne tourne pas. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE STOCK EST MAL RÉPARTI. Les paramètres de réapprovisionnement datent
 *     de dix-huit mois : deux semaines de sécurité pour toutes les références,
 *     calculées sur des ventes qui ont changé. Les A (63 % des ventes) sont
 *     sous-dimensionnées, les C sur-dimensionnées. « Commander plus de tout »
 *     remonte un peu les A et beaucoup ce qui ne sort pas ; recalculer par
 *     classe met le stock là où sont les ventes.
 *   · LE SYSTÈME CROIT AVOIR CE QUI N'EST PAS EN RAYON. Les erreurs de
 *     préparation créent du stock fantôme sur les références qui sortent le
 *     plus. Le réapprovisionnement, qui lit le stock informatique, ne
 *     recommande pas ce qui manque déjà. Compter chaque semaine les
 *     références qui tournent corrige l'écart — à condition de savoir
 *     lesquelles tournent : sans classement à jour, les comptages se
 *     dispersent.
 *   · LE COUP DE FOUET. Commander plus quand on rompt — au fournisseur en
 *     retard, ou pour suivre des agences qui se couvrent — amplifie le retard
 *     d'abord, le surstock ensuite. Et un dépôt trop plein reçoit mal : au-delà
 *     de 85 % d'occupation, chaque palette de trop coûte en manutention et
 *     retarde les réceptions de ce qui manque.
 *
 * Le trimestre est jugé en euros : l'écart au budget du dépôt, qui couvre le
 * coût de possession du stock, la marge perdue sur les ruptures et les coûts
 * logistiques exceptionnels. Plus de stock n'y est pas une sécurité : c'est
 * un coût, qui ne protège que s'il est au bon endroit.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/**
 * Les classes de références, en valeur au prix de revient. Les A se divisent
 * en deux : la visserie et les fixations, achetées chez un seul fournisseur
 * qui livre en retard, et les autres A.
 */
export type Classe = "av" | "ao" | "b" | "c";
export const CLASSES: readonly Classe[] = ["av", "ao", "b", "c"];

/** Les ventes réelles, par semaine. */
export const DEMANDE: Record<Classe, number> = { av: 56000, ao: 184000, b: 100000, c: 40000 };
/** Les ventes que le système croit encore, figées depuis dix-huit mois. */
export const PREVISION_ANCIENNE: Record<Classe, number> = {
  av: 45000,
  ao: 145000,
  b: 100000,
  c: 60000,
};
/** Le délai que le système suppose, en semaines. */
const DELAI_PARAMETRE: Record<Classe, number> = { av: 3, ao: 2, b: 2, c: 3 };
/** La place qu'un euro de stock occupe : la visserie est compacte, les références lentes encombrantes. */
const ENCOMBREMENT: Record<Classe, number> = { av: 0.5, ao: 0.7, b: 1, c: 1.4 };

export const STOCK_DEPART: Record<Classe, number> = {
  av: 45000,
  ao: 150000,
  b: 220000,
  c: 190000,
};
/** Les références sans aucune sortie depuis douze mois. */
export const DORMANT_DEPART = 800000;
/** Le stock fantôme : ce que le système croit en rayon et qui n'y est pas. */
const FANTOME_DEPART: Record<Classe, number> = { av: 25000, ao: 75000, b: 0, c: 0 };
/** La part des sorties qui crée du stock fantôme : erreurs de prélèvement, casse non déclarée. */
const DERIVE_FANTOME = 0.05;

/** La capacité du dépôt, en euros de stock « standard ». */
export const CAPACITE = 1850000;
/** Au-delà de ce taux d'occupation, un dépôt perd en productivité. */
export const SEUIL_OCCUPATION = 0.85;
const COUT_SATURATION = 60000;
/** L'occupation au-delà de laquelle le dépôt refuse les camions. */
const PLEIN = 1.05;

export const OBJECTIF_SERVICE = 0.97;
/** Le coût de possession du stock : capital, assurance, obsolescence, 25 % par an. */
export const TAUX_POSSESSION = 0.25 / 52;
/** La marge perdue par euro de vente manquée au prix de revient : une partie des ventes se reporte. */
export const MARGE_PERDUE = 0.25;

/** Le budget du dépôt : possession, ruptures, coûts exceptionnels. */
export const BUDGET = 220000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux se paie en dépannages express pour les agences. */
export const PERTE_PAR_JOUR = 2000;

/** Les ventes des A et des B, celles que les agences commandent pour elles-mêmes. */
const VENTES_AGENCES = DEMANDE.av + DEMANDE.ao + DEMANDE.b;
export const VENTES_PAR_JOUR = (DEMANDE.av + DEMANDE.ao + DEMANDE.b + DEMANDE.c) / 7;

/** Les références A, celles dont les ruptures se voient en agence. */
const REFERENCES_A = { av: 300, ao: 600 } as const;
export const NB_REFERENCES_A = REFERENCES_A.av + REFERENCES_A.ao;

/** Le chantier de rénovation des semaines 12 et 13 : ce qu'il ajoute aux ventes, par semaine. */
export const CHANTIER: Partial<Record<Classe, number>> = { ao: 80000, b: 40000 };

/** Les décisions, par leur place dans le chemin. */
export const D = {
  stocks: 0,
  inventaire: 1,
  fournisseur: 2,
  place: 3,
  agences: 4,
  cloture: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 3, 3, 0, 3] as const;

export const COUTS = {
  /** Recalcul des paramètres : deux jours d'approvisionneur et un consultant de l'éditeur. */
  recalcul: 1500,
  /** Le surcoût d'une livraison express, en part de la valeur livrée. */
  express: 0.12,
  /** Les comptages tournants : deux préparateurs une demi-journée par semaine. */
  comptage: 600,
  /** Fermer le dépôt deux jours pour un inventaire complet. */
  inventaireComplet: 14000,
  /** Le surcoût du second fournisseur, en part de la valeur achetée. */
  secondFournisseur: 0.03,
  /** L'entrepôt de débord : loyer et navettes, par semaine. */
  debord: 4500,
  /** La décote moyenne d'un retour fournisseur ou d'un déstockage. */
  decote: 0.06,
  /** Le stock dormant qu'on peut retourner ou transférer. */
  destockable: 300000,
  /** Le surcoût des commandes urgentes « pour être prêts », en part de la valeur. */
  urgence: 0.03,
  /** La livraison directe du chantier par les fournisseurs, en part de la valeur livrée. */
  directe: 0.05,
} as const;

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
    /** Multiplie les ventes des A. */
    demandeA?: number;
    /** La part des réceptions repoussée d'une semaine. */
    retard?: number;
    /** La part des commandes de la semaine qui part quand même, passée à la main. */
    commandes?: number;
    /** Multiplie la capacité du dépôt. */
    capacite?: number;
    /** Un coût direct, par semaine. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chantiers",
    titre: "Reprise des chantiers après les intempéries",
    de: "Olivier Jacquet",
    role: "Responsable de l'agence de Vénissieux",
    texte:
      "Après trois semaines de pluie, tous les chantiers repartent en même temps : les artisans vident nos rayons de fixations et de consommables.",
    duree: 2,
    effet: { demandeA: 1.15 },
  },
  {
    id: "transporteur",
    titre: "Grève chez le transporteur",
    de: "Réception",
    role: "Quai du dépôt",
    texte:
      "Grève chez le transporteur régional : une bonne partie des livraisons fournisseurs de la semaine arrivera la semaine prochaine.",
    duree: 1,
    effet: { retard: 0.5 },
  },
  {
    id: "erp",
    titre: "Panne du logiciel de gestion",
    de: "Service informatique",
    role: "Siège",
    texte:
      "La mise à jour du logiciel de gestion a bloqué les commandes automatiques toute la semaine : les approvisionneurs n'ont pu passer à la main que les plus urgentes.",
    duree: 1,
    effet: { commandes: 0.5 },
  },
  {
    id: "rack",
    titre: "Un rack endommagé",
    de: "Bruno Ferreira",
    role: "Chef d'équipe préparation",
    texte:
      "Un chariot a heurté un pied de rack dans l'allée 14 : quarante emplacements condamnés le temps que le fabricant passe.",
    duree: 2,
    effet: { capacite: 0.93 },
  },
  {
    id: "grippe",
    titre: "Grippe chez les préparateurs",
    de: "Bruno Ferreira",
    role: "Chef d'équipe préparation",
    texte:
      "Cinq préparateurs absents cette semaine : on a pris des intérimaires, et les réceptions passent après les expéditions.",
    duree: 1,
    effet: { retard: 0.3, cout: 2500 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Les ventes de la semaine, rapportées à la normale. */
  demande: number;
  /** La part de la semaine dans les erreurs de préparation. */
  derive: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le fournisseur tient-il des commandes lissées et annoncées ? */
  uFournisseur: number;
  /** Le grand compte part-il si le service se dégrade ? */
  uClient: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1299709 + 31);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: borne(1 + 0.07 * gauss(r), 0.82, 1.2),
      derive: borne(1 + 0.3 * gauss(r), 0.4, 1.6),
    });
  }
  const uFournisseur = r();
  const uClient = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uFournisseur, uClient, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Sept fois sur dix, le fournisseur tient des commandes régulières annoncées à l'avance. */
export const fournisseurTient = (graine: number) => hasard(graine).uFournisseur < 0.7;

/**
 * LE GRAND COMPTE PART-IL ?
 *
 * Delorme Construction s'approvisionne par trois agences. Si le taux de
 * service des semaines 5 à 8 reste sous 95 %, il passe une partie de ses
 * chantiers chez un concurrent ; plus le service est bas, plus c'est probable.
 */
export const risqueDePerdreLeClient = (service: number) => borne((0.95 - service) * 5, 0, 0.7);
/** La marge que le grand compte apporte, par semaine. */
export const MARGE_CLIENT = 4500;

export type Semaine = {
  /** La part des commandes des agences servie dans la semaine. */
  service: number;
  /** Les références en rupture en fin de semaine. */
  ruptures: number;
  /** Le stock physique total, dormants compris. */
  stock: number;
  /** Le stock en jours de ventes. */
  couverture: number;
  occupation: number;
  /** Le stock fantôme : l'écart entre l'inventaire informatique et le rayon. */
  ecart: number;
  /** Ce que la semaine a coûté : possession, ruptures, saturation, dépenses. */
  cout: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget du dépôt : positif, le dépôt est sous le budget. */
  objectif: number;
  margePerdue: number;
  possession: number;
  saturation: number;
  depenses: number;
  clientPerdu: boolean;
  /** Le fournisseur a-t-il tenu les commandes lissées ? `null` : on ne les lui a pas proposées. */
  fournisseurATenu: boolean | null;
  serviceMoyen: number;
  /** Le taux de service moyen des semaines 10 à 13 : ce que les agences retiennent. */
  serviceFin: number;
  /** La première semaine où le dépôt a dépassé sa capacité : palettes dans les allées. */
  premiereSemaineSaturee: number | null;
  stockFinal: number;
  occupationFinale: number;
  ecartFinal: number;
  /** Le surplus que les agences ont stocké chez elles en semaines 9 à 11. */
  stocksAgences: number;
  /** Ce que les agences commandent en plus de leurs ventes en semaines 9 à 11, faute de confiance. */
  surcommande: number;
}

/** Le délai réel du fournisseur de visserie, pour une commande passée en fin de semaine `w`. */
function delaiVisserie(w: number, d3: number | undefined, tient: boolean): number {
  if (w <= 3) return 3;
  if (w >= 6 && d3 === 1) {
    // S'il ne tient pas, ses petites commandes régulières passent après les grosses.
    if (tient) return 2;
    if (w <= 8) return 6;
  }
  if (w >= 6 && w <= 8 && d3 === 0) return 6;
  // Soulagé de la moitié de ses volumes, il rattrape une semaine.
  if (w >= 6 && d3 === 2) return 3;
  return w >= 10 ? 3 : 5;
}

/** Le taux de références en rupture, pour un stock disponible de `c` semaines de commandes. */
const tauxDeRupture = (c: number) => borne(Math.max(1 - c, 0.3 * Math.exp(-1.6 * (c - 1))), 0, 1);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const tient = fournisseurTient(graine);
  const semaines: (Semaine | null)[] = [null];

  const stock = { ...STOCK_DEPART };
  const fantome = { ...FANTOME_DEPART };
  let dormant = DORMANT_DEPART;
  // Les réceptions attendues, semaine par semaine ; les commandes déjà passées arrivent en début de trimestre.
  const arrivees = CLASSES.reduce(
    (acc, k) => ({ ...acc, [k]: Array.from({ length: 24 }, () => 0) }),
    {} as Record<Classe, number[]>,
  );
  for (const k of CLASSES) {
    for (let w = 1; w <= DELAI_PARAMETRE[k]; w += 1) arrivees[k][w] = DEMANDE[k] * 0.95;
  }

  let margePerdue = 0;
  let possession = 0;
  let saturation = 0;
  let depenses = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let stocksAgences = 0;
  let surcommande = 0;
  let clientPerdu = false;
  let premiereSemaineSaturee: number | null = null;
  const services: number[] = [];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? depenses : 0;
    let depense = 0;

    // La place dans le dépôt, avant les réceptions.
    let capacite = CAPACITE;
    for (const a of actifs) capacite *= a.imprevu.effet.capacite ?? 1;
    if (d4 === 0 && w >= 8) capacite *= 1.15;
    const volume = () =>
      CLASSES.reduce((s, k) => s + stock[k] * ENCOMBREMENT[k], 0) + dormant * ENCOMBREMENT.c;
    const occupationAvant = volume() / capacite;

    // Les réceptions : un dépôt trop plein en laisse attendre une partie au quai.
    let retard = Math.min(0.5, 3 * Math.max(0, occupationAvant - 0.92));
    for (const a of actifs) retard = Math.max(retard, a.imprevu.effet.retard ?? 0);
    // Le fournisseur débordé par les commandes doublées décale aussi ce qu'il devait livrer.
    if (d3 === 0 && w >= 6 && w <= 10) {
      arrivees.av[w + 1]! += arrivees.av[w]! * 0.5;
      arrivees.av[w] = arrivees.av[w]! * 0.5;
    }
    // Et au-delà de 105 %, plus rien n'entre : les camions repartent.
    const entrant = CLASSES.reduce(
      (s, k) => s + arrivees[k][w]! * (1 - retard) * ENCOMBREMENT[k],
      0,
    );
    const place = Math.max(0, PLEIN * capacite - volume());
    const recu = entrant > place ? (1 - retard) * (place / entrant) : 1 - retard;
    for (const k of CLASSES) {
      const prevu = arrivees[k][w]!;
      arrivees[k][w + 1]! += prevu * (1 - recu);
      stock[k] += prevu * recu;
    }

    // Les livraisons express de début de trimestre sur les A en rupture.
    if (d1 === 2 && w >= 2 && w <= 5) {
      for (const k of ["av", "ao"] as const) {
        const express = 0.6 * Math.max(0, 1.6 * DEMANDE[k] - stock[k]);
        stock[k] += express;
        depense += express * COUTS.express + 500;
      }
    }
    // Le chantier des semaines 12 et 13 : ce qu'on a préparé.
    if (w === 12 && d6 === 0) {
      // Tout remonter de 20 % : un peu de ce que le chantier prendra, beaucoup du reste.
      for (const k of CLASSES) {
        const urgent = 0.2 * 2 * DEMANDE[k];
        stock[k] += urgent;
        depense += urgent * COUTS.urgence;
      }
    }
    if (w === 12 && d6 === 1) {
      // La liste de matériel du chantier, commandée à la référence près.
      for (const k of CLASSES) stock[k] += 2 * (CHANTIER[k] ?? 0);
    }

    // Ce que les agences commandent : leurs ventes, et en semaines 9 à 11, des stocks de précaution.
    const serviceRecent =
      services.length >= 8
        ? services.slice(4, 8).reduce((s, x) => s + x, 0) / 4
        : (services.at(-1) ?? 0.9);
    const precaution = borne(0.2 + 2 * (0.97 - serviceRecent), 0.2, 0.35);
    if (w === 9) surcommande = precaution;
    let commande = 0;
    let servi = 0;
    let rupturesRefs = 0;
    let manque = 0;
    for (const k of CLASSES) {
      let vente = DEMANDE[k] * n.demande;
      if (k === "av" || k === "ao") for (const a of actifs) vente *= a.imprevu.effet.demandeA ?? 1;
      if (w >= 12) {
        if (d6 === 2) depense += (CHANTIER[k] ?? 0) * COUTS.directe;
        else vente += CHANTIER[k] ?? 0;
      }
      let q = vente;
      if (k !== "c" && w >= 9 && w <= 11) {
        if (d5 === 0 || d5 === 2) q = vente * (1 + precaution);
        if (d5 === 3) q = Math.min(vente * (1 + precaution), DEMANDE[k]);
      }
      // Ensuite, elles vivent sur ce qu'elles ont stocké, et commandent moins.
      if (k !== "c" && w >= 12) {
        q = Math.max(0.5 * vente, vente - 0.5 * stocksAgences * (DEMANDE[k] / VENTES_AGENCES));
      }
      const c = stock[k] / Math.max(1, q);
      // Une référence que le système croit en rayon n'est pas recommandée : elle reste vide.
      const fantomes = 0.15 * (fantome[k] / Math.max(1, fantome[k] + stock[k]));
      const u = 1 - (1 - tauxDeRupture(c)) * (1 - fantomes);
      const sert = q * (1 - u);
      stock[k] -= sert;
      // Un plafond trop bas ne laisse pas passer les pics de vente réels.
      const plafonne = d5 === 3 && w >= 9 && w <= 11 ? 0.5 * Math.max(0, vente - q) : 0;
      const perdu = u * Math.min(q, vente) + plafonne;
      manque += perdu;
      if (k !== "c" && w >= 9 && w <= 11 && q > vente) stocksAgences += (q - vente) * (1 - u);
      commande += q;
      servi += sert;
      if (k === "av" || k === "ao") rupturesRefs += u * REFERENCES_A[k];
      fantome[k] += DERIVE_FANTOME * sert * n.derive * (k === "av" || k === "ao" ? 1 : 0);
    }
    if (w >= 12) stocksAgences *= 0.5;
    const service = servi / commande;
    services.push(service);
    const margeSemaine = MARGE_PERDUE * manque;

    // L'inventaire : ce que le système croit en rayon.
    if (w >= 4) {
      for (const k of ["av", "ao"] as const) {
        if (d2 === 0) fantome[k] *= d1 === 1 ? 0.35 : 0.7;
        if (d2 === 2) fantome[k] *= 0.92;
        if (d2 === 1 && w === 4) fantome[k] = 0;
      }
    }
    if (d2 === 0 && w >= 4) depense += COUTS.comptage;
    if (d2 === 1 && w === 4) depense += COUTS.inventaireComplet;

    // Le déstockage des dormants, en semaines 8 et 9.
    if (d4 === 1 && (w === 8 || w === 9)) {
      const sortie = COUTS.destockable / 2;
      dormant -= sortie;
      depense += sortie * COUTS.decote;
    }
    if (d4 === 0 && w >= 8) depense += COUTS.debord;
    if (d1 === 1 && w === 2) depense += COUTS.recalcul;

    // Les commandes de fin de semaine : remonter au niveau cible, sur le stock que le système croit avoir.
    // Le gel des achats : seules les urgences passent, au téléphone.
    let passe = d4 === 2 && (w === 8 || w === 9) ? 0.4 : 1;
    for (const a of actifs) passe *= a.imprevu.effet.commandes ?? 1;
    for (const k of CLASSES) {
      let prevision = PREVISION_ANCIENNE[k];
      let securite = 2;
      if (d1 === 1 && w >= 2) {
        prevision = DEMANDE[k];
        securite = k === "c" ? 1 : 2;
      }
      if (d1 === 0 && w >= 2) securite = 2.5;
      let cible = prevision * (DELAI_PARAMETRE[k] + securite);
      if (d2 === 3 && w >= 4) cible *= 1.15;
      if (d5 === 2 && k !== "c" && w >= 9) cible *= 1 + 1.5 * precaution;
      const enCours = arrivees[k].slice(w + 1).reduce((s, x) => s + x, 0);
      let besoin = passe * Math.max(0, cible - (stock[k] + fantome[k] + enCours));
      if (k === "av") {
        // Le coup de fouet : on double ce qu'on demande au fournisseur en retard.
        if (d3 === 0 && w >= 6 && w <= 8) besoin *= 2;
        if (d3 === 2 && w >= 6) {
          // La moitié chez un second fournisseur, plus cher, livré en deux semaines.
          const moitie = besoin / 2;
          depense += moitie * COUTS.secondFournisseur;
          arrivees.av[w + 2]! += moitie;
          besoin -= moitie;
        }
        const delai = delaiVisserie(w, d3, tient);
        arrivees.av[w + delai]! += besoin;
      } else {
        arrivees[k][w + DELAI_PARAMETRE[k]]! += besoin;
      }
    }

    // Le grand compte juge le service des semaines 5 à 8.
    if (w === 8) {
      const s58 = services.slice(4, 8).reduce((s, x) => s + x, 0) / 4;
      clientPerdu = h.uClient < risqueDePerdreLeClient(s58);
    }
    const perteClient = clientPerdu && w >= 9 ? MARGE_CLIENT : 0;

    // Ce que la semaine coûte.
    const physique = CLASSES.reduce((s, k) => s + stock[k], 0) + dormant;
    const occupation = volume() / capacite;
    const possessionSemaine = physique * TAUX_POSSESSION;
    const saturationSemaine = COUT_SATURATION * Math.max(0, occupation - SEUIL_OCCUPATION);
    for (const a of actifs) depense += a.imprevu.effet.cout ?? 0;
    margePerdue += margeSemaine + perteClient;
    possession += possessionSemaine;
    saturation += saturationSemaine;
    depenses += depense;
    cout += margeSemaine + perteClient + possessionSemaine + saturationSemaine + depense;
    if (occupation >= 1 && premiereSemaineSaturee === null) premiereSemaineSaturee = w;

    semaines.push({
      service,
      ruptures: rupturesRefs,
      stock: physique,
      couverture: physique / VENTES_PAR_JOUR,
      occupation,
      ecart: fantome.av + fantome.ao,
      cout,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const derniere = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: BUDGET - margePerdue - possession - saturation - depenses,
    margePerdue,
    possession,
    saturation,
    depenses,
    clientPerdu,
    fournisseurATenu: d3 === 1 ? tient : null,
    serviceMoyen: pleines.reduce((s, x) => s + x.service, 0) / SEMAINES,
    serviceFin: pleines.slice(9).reduce((s, x) => s + x.service, 0) / 4,
    premiereSemaineSaturee,
    stockFinal: derniere.stock,
    occupationFinale: derniere.occupation,
    ecartFinal: derniere.ecart,
    stocksAgences,
    surcommande,
  };
}

/** Ce qui s'est passé pendant des semaines : le grand compte, la livraison groupée, la saturation, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    inventaireComplet: chemin[D.inventaire] === 1 && dans(4),
    saturation: t.premiereSemaineSaturee !== null && dans(t.premiereSemaineSaturee),
    clientPerdu: t.clientPerdu && dans(9),
    livraisonGroupee: chemin[D.fournisseur] === 0 && dans(12),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

const volumeDepart =
  CLASSES.reduce((s, k) => s + STOCK_DEPART[k] * ENCOMBREMENT[k], 0) +
  DORMANT_DEPART * ENCOMBREMENT.c;
const stockDepart = CLASSES.reduce((s, k) => s + STOCK_DEPART[k], 0) + DORMANT_DEPART;

/** La situation que Juliette trouve en arrivant, la semaine 1 au matin. */
export const DEPART = {
  service: 0.91,
  ruptures: 130,
  stock: stockDepart,
  couverture: stockDepart / VENTES_PAR_JOUR,
  occupation: volumeDepart / CAPACITE,
  ecart: FANTOME_DEPART.av + FANTOME_DEPART.ao,
} as const;

export interface LectureDepot {
  service: number | null;
  ruptures: number | null;
  couverture: number | null;
  stock: number | null;
  occupation: number | null;
}

/** Ce que Juliette lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDepot {
  if (semaine === 0) {
    const { service, ruptures, couverture, stock, occupation } = DEPART;
    return { service, ruptures, couverture, stock, occupation };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    service: s.service,
    ruptures: s.ruptures,
    couverture: s.couverture,
    stock: s.stock,
    occupation: s.occupation,
  };
}
