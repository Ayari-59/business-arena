/**
 * LES PRODUCTEURS QUI ARRÊTENT — le modèle de la collecte de la Laiterie de Kerbrélan.
 *
 * 240 millions de litres par an, 310 exploitations dans un rayon de 70 km
 * autour de Loudéac, regroupées dans l'OP Lait du Méné. La collecte a baissé
 * de 4 % en un an ; 61 exploitants ont plus de 58 ans sans repreneur connu ;
 * l'automne dernier, l'usine a acheté 8 % de son lait en spot. Le trimestre va
 * d'octobre à décembre : le creux de collecte, puis le pic des desserts de
 * Noël. Cinq mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE LAIT QUI PART SE VOIT D'AVANCE, SUR LE TERRAIN. Le fichier des
 *     producteurs donne l'âge des exploitants ; seules les visites des
 *     techniciens disent qui a un repreneur, qui en cherche un, qui arrêtera
 *     sans suite, et qui hésite à s'agrandir. Un plan ciblé, exploitation par
 *     exploitation, fait naître des projets d'installation et des contrats
 *     d'agrandissement qu'aucune mesure générale ne fait naître.
 *   · LE SPOT COMBLE UN TROU AU PRIX DU MOMENT. Le prix du lait spot de
 *     l'automne est tiré au hasard dans une fourchette, et il monte encore à
 *     Noël ; quand il est haut, c'est que le lait manque partout : au pic des
 *     desserts, l'usine ne trouve pas tout ce qu'elle cherche, et chaque
 *     millier de litres qui manque est une vente de desserts perdue, pénalités
 *     logistiques des enseignes comprises.
 *   · UNE INSTALLATION SE PRÉPARE, ET ABOUTIT AU HASARD. Un dispositif d'aide
 *     (contrat long, prime au litre pendant cinq ans, appui d'un technicien,
 *     avance pour la mise aux normes) agit avec retard : les projets
 *     aboutissent ou non en fin de trimestre, plus souvent quand ils sont
 *     accompagnés, et quand la chambre d'agriculture peut détacher une
 *     conseillère. Une prime plus forte sans accompagnement paie surtout ceux
 *     qui se seraient installés de toute façon.
 *   · UNE HAUSSE GÉNÉRALE PAIE TOUT LE MONDE POUR RETENIR QUELQUES-UNS. Dix
 *     euros de plus sur le prix de base coûtent sur tout le lait collecté, pour
 *     un effet faible : on ne retient pas par le prix un exploitant de 62 ans
 *     sans successeur.
 *   · LES TOURNÉES S'ÉTIRENT. Quand des exploitations s'arrêtent, les camions
 *     font les mêmes kilomètres pour moins de lait : le coût de collecte par
 *     litre monte. Recalculer les tournées le réduit, d'autant plus qu'on sait
 *     qui va s'arrêter.
 *
 * L'objectif est en euros. Le coût du lait du trimestre (prix de base, primes
 * de qualité, primes exceptionnelles, spot, achats à terme, collecte), comparé
 * au budget lait du trimestre, moins les ventes perdues faute de lait, PLUS la
 * valeur des volumes sécurisés pour les trois années suivantes. Cette valeur
 * est estimée comme les sources l'enseignent : chaque million de litres par an
 * gardé (une installation qui aboutit, un agrandissement signé, un GAEC qui
 * reste) évite d'acheter autant de lait spot, 50 € les 1 000 litres de plus
 * que le lait collecté, collecte comprise, pendant trois ans ; on en déduit ce
 * qui a été promis pour le garder sur la même durée (primes, coût des
 * avances). Un volume perdu (une collecte cédée) compte en négatif. Le lait
 * en plus qui arrive surtout au printemps vaut moins : l'usine en a déjà trop
 * à cette saison et revend ses excédents en spot à bas prix.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Laiterie, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const PRODUCTEURS = 310;
/** La collecte des douze derniers mois et celle de l'année d'avant, en millions de litres. */
export const COLLECTE_AN = 240;
export const COLLECTE_AN_PASSE = 250;
export const BAISSE_COLLECTE = 1 - COLLECTE_AN / COLLECTE_AN_PASSE;
/** Le prix de base de l'accord-cadre et la prime de qualité moyenne, en euros les 1 000 litres. */
export const PRIX_BASE = 452;
export const PRIMES_QUALITE = 8;
export const PRIX_PAYE = PRIX_BASE + PRIMES_QUALITE;

/** La collecte d'une semaine d'automne, en millions de litres, avant les arrêts du trimestre. */
export const COLLECTE_SEMAINE = 4.12;
/** Le creux d'automne, semaine par semaine : il se creuse en novembre, remonte en décembre avec les vêlages. */
export const SAISON = [
  1, 1, 0.99, 0.98, 0.97, 0.96, 0.96, 0.96, 0.97, 0.98, 0.99, 1, 1.01, 1.02,
] as const;
/** Ce que l'usine transforme chaque semaine, en millions de litres : les desserts de fin d'année en semaines 10 à 12. */
export const BESOIN = [
  4.57, 4.57, 4.57, 4.57, 4.57, 4.57, 4.57, 4.57, 4.57, 4.57, 4.75, 4.75, 4.75, 4.3,
] as const;
export const PIC = { debut: 10, fin: 12 } as const;

/* ---------------------------------------------------------------------------
 * L'AMONT : les exploitations dont l'exploitant a plus de 58 ans.
 * ------------------------------------------------------------------------- */
export const AGES = { exploitations: 61, volume: 31.7 } as const;
/** Ce que les visites révèlent : douze ont un repreneur en vue. */
export const AVEC_REPRENEUR = { exploitations: 12, volume: 7.2 } as const;
export const SANS_REPRENEUR = {
  exploitations: AGES.exploitations - AVEC_REPRENEUR.exploitations,
  volume: Math.round((AGES.volume - AVEC_REPRENEUR.volume) * 10) / 10,
} as const;
/** Parmi elles, celles qui cherchent un repreneur, et celles qui arrêteront sans suite. */
export const CHERCHENT_REPRENEUR = 21;
export const ARRETENT_SANS_SUITE = SANS_REPRENEUR.exploitations - CHERCHENT_REPRENEUR;
/** Le calendrier des arrêts que les exploitants annoncent : dans le trimestre, l'an prochain, ensuite. */
export const CALENDRIER = { trimestre: 5, anProchain: 17 } as const;
/** Les exploitations plus jeunes, voisines de celles qui s'arrêtent, qui hésitent à s'agrandir. */
export const HESITENT = 7;

/** Les arrêts du trimestre : des troupeaux vendus fin octobre et fin novembre (en millions de litres par an). */
export const ARRETS_TRIMESTRE = [
  { semaine: 5, exploitations: 3, volume: 1.4 },
  { semaine: 10, exploitations: 2, volume: 0.9 },
] as const;

/* ---------------------------------------------------------------------------
 * LA VALEUR D'UN LITRE GARDÉ.
 * ------------------------------------------------------------------------- */
/** Ce qu'un litre collecté sous contrat épargne par rapport au spot, collecte comprise, en € les 1 000 litres. */
export const ECART_REMPLACEMENT = 50;
/** L'horizon du plan de collecte, en années. */
export const HORIZON = 3;
/** Un million de litres par an gardé pendant l'horizon, en euros. */
export const VALEUR_ML = ECART_REMPLACEMENT * 1000 * HORIZON;
/** Des euros les 1 000 litres, payés pendant l'horizon sur un volume annuel en millions de litres. */
export const surHorizon = (euros: number, volume: number) => euros * volume * 1000 * HORIZON;

/* ---------------------------------------------------------------------------
 * LE SPOT, ET CE QUE COÛTE LE LAIT QUI MANQUE.
 * ------------------------------------------------------------------------- */
/** La fourchette du prix spot d'automne, et la tension de Noël, en € les 1 000 litres. */
export const SPOT = { min: 480, max: 600, noel: 35, bruit: 6 } as const;
export const SPOT_MOYEN = (SPOT.min + SPOT.max) / 2;
/** Le spot disponible au pic, en millions de litres par semaine : moins il y en a, plus il est cher. */
export const DISPO = { haut: 1.05, pente: 0.55, bruit: 0.05 } as const;
/** Ce que rapportent 1 000 litres transformés en crèmes desserts, et ce que coûte d'en manquer. */
export const DESSERTS = { kilos: 1250, prixKilo: 2.1, autresCouts: 1625, penalites: 0.08 } as const;
export const VALEUR_DESSERTS = DESSERTS.kilos * DESSERTS.prixKilo;
export const MARGE_DESSERTS = VALEUR_DESSERTS - DESSERTS.autresCouts;
export const PERTE_RUPTURE = MARGE_DESSERTS + DESSERTS.penalites * VALEUR_DESSERTS;

/* ---------------------------------------------------------------------------
 * LES TOURNÉES DE COLLECTE.
 * ------------------------------------------------------------------------- */
/** Quatorze camions-citernes : les kilomètres d'une semaine, et le coût d'un kilomètre (camion, chauffeur, gazole). */
export const KM_SEMAINE = 52000;
export const COUT_KM = 1.55;
export const COLLECTE_FIXE = KM_SEMAINE * COUT_KM;
export const TOURNEES = {
  /** Recalculer les tournées : moins de kilomètres, davantage si l'on sait qui va s'arrêter. */
  recalcul: 0.06,
  recalculCarte: 0.09,
  debutRecalcul: 6,
  /** Échanger les franges avec la Laiterie de Trévallec, si elle accepte. */
  echange: 0.13,
  chanceEchange: 0.55,
  debutEchange: 9,
  etude: 3000,
  /** Céder à Nordal la collecte de six exploitations isolées. */
  cession: 0.05,
  debutCession: 6,
  exploitationsCedees: 6,
  volumeCede: 0.9,
} as const;

/* ---------------------------------------------------------------------------
 * LE PLAN, LA HAUSSE, LE DISPOSITIF D'INSTALLATION.
 * ------------------------------------------------------------------------- */
/** Ce que chaque manière de voir l'amont fait naître : projets d'installation et voisins prêts à s'agrandir. */
export const PLAN = {
  coutSemaine: 2500,
  debut: 2,
  fin: 7,
  projets: 8,
  hesitants: HESITENT,
} as const;
export const QUESTIONNAIRE = { cout: 4000, projets: 4, hesitants: 3 } as const;
export const SANS_PLAN = { projets: 2, hesitants: 2 } as const;
/** La hausse générale du prix de base, en € les 1 000 litres, à partir de novembre. */
export const HAUSSE = {
  euros: 10,
  debut: 5,
  /** Les producteurs nourrissent un peu plus : +0,4 % de collecte après un mois. */
  collecte: 0.004,
  effetCollecte: 9,
  /** Deux exploitants repoussent leur arrêt d'un an : un million de litres, une année. */
  retenu: 1,
  /** Le GAEC hésite un peu moins à partir. */
  gaec: 0.15,
} as const;
/** Un projet d'installation : le volume repris, en millions de litres par an. */
export const VOLUME_PROJET = 0.5;
/** Ce que la chambre d'agriculture peut faire : détacher une conseillère, une fois sur deux ou trois. */
export const CHANCE_CHAMBRE = 0.6;
/** La chance qu'un projet aboutisse, selon le dispositif, et ce que la chambre y ajoute. */
export const INSTALLATION = [
  { base: 0.2, chambre: 0.1, prime: 0 },
  { base: 0.5, chambre: 0.2, prime: 15 },
  { base: 0.3, chambre: 0.1, prime: 30 },
] as const;
export const DUREE_PRIME = 5;
export const APPUI = 2500;
export const CONVENTION = 5000;
/** L'avance remboursable pour la mise aux normes : ce qu'elle coûte, intérêts et risque de non-remboursement. */
export const AVANCE = { montant: 40000, cout: 0.08 } as const;
export const COUT_AVANCE = AVANCE.montant * AVANCE.cout;
export const SEMAINE_INSTALLATIONS = 12;

/* ---------------------------------------------------------------------------
 * LE GAEC QUE NORDAL SOLLICITE.
 * ------------------------------------------------------------------------- */
export const GAEC = {
  volume: 1.5,
  /** La chance qu'il parte, selon la réponse ; un plan ciblé l'a vu venir. */
  depart: { aligne: 0.2, laisser: 0.65, plan: 0.05 },
  departDispositif: [0.55, 0.15, 0.3],
  /** La prime individuelle hors accord-cadre, et ce que l'OP exige si elle l'apprend. */
  primeNordal: 12,
  fuite: 0.5,
  hausseFuite: 5,
  debutFuite: 10,
  /** L'avance pour le robot de traite du fils. */
  avance: 80000,
  semaine: 12,
} as const;

/* ---------------------------------------------------------------------------
 * LE PIC DE DÉCEMBRE.
 * ------------------------------------------------------------------------- */
export const TERME = { prix: 600, decote: 50 } as const;
/** La prime de décembre sur les litres livrés en plus, la réponse des producteurs (Ml par semaine), et l'effet d'aubaine. */
export const PRIME_DECEMBRE = {
  euros: 40,
  reponseMin: 0.04,
  reponseMax: 0.12,
  aubaine: 0.04,
} as const;
export const DEBUT_REPONSE = 10;

/* ---------------------------------------------------------------------------
 * LES VOISINS QUI HÉSITENT À S'AGRANDIR, ET LES AUTRES MANIÈRES DE TROUVER DU LAIT.
 * ------------------------------------------------------------------------- */
export const AGRANDIR = { volume: 0.3, chance: 0.5, avance: 30000 } as const;
export const COUT_AVANCE_AGRANDIR = AGRANDIR.avance * AVANCE.cout;
/** Le volume ouvert à tous : surtout du lait de printemps, que l'usine revend en spot à bas prix. */
export const OUVERT = { volume: 2, printemps: 0.5, spotPrintemps: 380 } as const;
/** Un litre de plus au printemps et le reste de l'année, en € les 1 000 litres gagnés par an. */
export const VALEUR_OUVERT =
  OUVERT.printemps * (OUVERT.spotPrintemps - PRIX_PAYE) +
  (1 - OUVERT.printemps) * ECART_REMPLACEMENT;
/** Le contrat d'approvisionnement de la Coopérative de l'Oust : livré à l'usine, au-dessus de notre lait collecté. */
export const COOPERATIVE = { volume: 2, surcout: 35 } as const;

/** L'enveloppe de prix du lait du trimestre, en € les 1 000 litres transformés. */
export const PRIX_BUDGET = 484;
/** Le budget lait du trimestre : le lait à transformer, au prix du budget. */
export const BUDGET_TRIMESTRE = BESOIN.slice(1).reduce((s, b) => s + b * 1000 * PRIX_BUDGET, 0);
/** Le coût de collecte de septembre, et celui d'il y a un an, en € les 1 000 litres. */
export const COUT_COLLECTE_DEPART = COLLECTE_FIXE / (COLLECTE_SEMAINE * 1000);
export const COUT_COLLECTE_AN_PASSE =
  COLLECTE_FIXE / ((COLLECTE_SEMAINE * 1000) / (1 - BAISSE_COLLECTE));
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : du lait spot acheté dans l'urgence, sans négocier. */
export const PERTE_PAR_JOUR = 4000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  tournees: 1,
  installation: 2,
  gaec: 3,
  decembre: 4,
  agrandir: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [0, 0, 0, 2, 0, 0] as const;

/** Le chiffre que la prévision demande : le lait qui disparaît si les exploitations sans repreneur arrêtent. */
export const VOLUME_QUI_DISPARAIT = SANS_REPRENEUR.volume;

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
    /** Du lait perdu à la collecte, en millions de litres, la semaine de l'imprévu. */
    perdu?: number;
    /** La collecte multipliée, chaque semaine de l'imprévu. */
    collecte?: number;
    /** Le coût des tournées multiplié, jusqu'à la fin du trimestre. */
    gazole?: number;
    /** Du besoin en plus, en millions de litres par semaine. */
    besoin?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "tempete",
    titre: "Tempête sur le Méné",
    de: "Joran Kerneur",
    role: "Chef du parc de collecte",
    texte:
      "La tempête a coupé l'électricité dans 35 exploitations pendant plus de douze heures : sans refroidissement, leur lait a été détruit sur place, comme le veut la règle. 250 000 litres de moins cette semaine.",
    duree: 1,
    effet: { perdu: 0.25 },
  },
  {
    id: "fco",
    titre: "Fièvre catarrhale dans le secteur",
    de: "Sklaerenn Le Saout",
    role: "Technicienne d'élevage",
    texte:
      "La fièvre catarrhale ovine touche des troupeaux bovins du secteur : fièvre, vaches qui mangent moins, production en baisse. Les vétérinaires attendent 3 % de lait en moins pendant trois semaines.",
    duree: 3,
    effet: { collecte: 0.97 },
  },
  {
    id: "gazole",
    titre: "Le gazole augmente",
    de: "Joran Kerneur",
    role: "Chef du parc de collecte",
    texte:
      "Le gazole a pris 12 centimes en dix jours : les tournées coûtent 5 % de plus, jusqu'à nouvel ordre.",
    duree: 99,
    effet: { gazole: 1.05 },
  },
  {
    id: "inhibiteurs",
    titre: "Deux citernes positives aux antibiotiques",
    de: "Annaïg Le Dantec",
    role: "Responsable qualité",
    texte:
      "Deux citernes ont été trouvées positives aux inhibiteurs à la réception : 60 000 litres détruits. Les exploitations en cause sont identifiées par les échantillons de chaque ferme ; leur assurance paiera le lait, pas le manque à l'usine.",
    duree: 1,
    effet: { perdu: 0.06 },
  },
  {
    id: "promotion",
    titre: "Celtis avance une opération sur les crèmes desserts",
    de: "Baptistin Haddadi",
    role: "Directeur commercial",
    texte:
      "Celtis avance de trois semaines son opération sur les crèmes desserts Kerbrélan : 120 000 litres de lait de plus à transformer chaque semaine, pendant deux semaines.",
    duree: 2,
    effet: { besoin: 0.12 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  collecte: number;
  besoin: number;
  spot: number;
  dispo: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le niveau du prix spot de l'automne, de 0 (le bas de la fourchette) à 1 (le haut). */
  niveauSpot: number;
  /** La Laiterie de Trévallec accepte-t-elle l'échange ? */
  uEchange: number;
  /** La chambre d'agriculture peut-elle détacher une conseillère ? */
  uChambre: number;
  /** Chaque projet d'installation aboutit-il ? */
  uProjets: readonly number[];
  /** Le GAEC part-il chez Nordal ? L'OP apprend-elle la prime individuelle ? */
  uGaec: number;
  uFuite: number;
  /** Chaque voisin qui hésite accepte-t-il de s'agrandir ? */
  uVoisins: readonly number[];
  /** La réponse des producteurs à la prime de décembre, de 0 (la plus faible) à 1. */
  uReponse: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001087 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      collecte: Math.min(1.04, Math.max(0.96, 1 + 0.012 * gauss(r))),
      besoin: Math.min(1.04, Math.max(0.96, 1 + 0.01 * gauss(r))),
      spot: gauss(r),
      dispo: gauss(r),
    });
  }
  const niveauSpot = r();
  const uEchange = r();
  const uChambre = r();
  const uProjets = Array.from({ length: PLAN.projets }, () => r());
  const uGaec = r();
  const uFuite = r();
  const uVoisins = Array.from({ length: HESITENT }, () => r());
  const uReponse = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    semaines,
    niveauSpot,
    uEchange,
    uChambre,
    uProjets,
    uGaec,
    uFuite,
    uVoisins,
    uReponse,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LES RÈGLES.
 * ------------------------------------------------------------------------- */

/** Ce que la manière de voir l'amont (première décision) fait connaître. */
export function connaissance(chemin: readonly number[]) {
  const p = chemin[D.plan];
  if (p === 2) return { projets: PLAN.projets, hesitants: PLAN.hesitants, carte: true };
  if (p === 3)
    return { projets: QUESTIONNAIRE.projets, hesitants: QUESTIONNAIRE.hesitants, carte: false };
  return { projets: SANS_PLAN.projets, hesitants: SANS_PLAN.hesitants, carte: false };
}

/** La Laiterie de Trévallec accepte l'échange des franges un peu plus d'une fois sur deux. */
export const echangeAccepte = (graine: number) => hasard(graine).uEchange < TOURNEES.chanceEchange;

/** La chambre d'agriculture détache une conseillère installation, selon le hasard du trimestre. */
export const chambreActive = (graine: number) => hasard(graine).uChambre < CHANCE_CHAMBRE;

/** La chance qu'un projet d'installation aboutisse, selon le dispositif et la chambre. */
export function chanceDInstaller(chemin: readonly number[], graine: number): number {
  const i = INSTALLATION[chemin[D.installation] ?? 0]!;
  return i.base + (chambreActive(graine) ? i.chambre : 0);
}

/** Les projets d'installation qui aboutissent en semaine 12. */
export function installations(chemin: readonly number[], graine: number): number {
  const n = connaissance(chemin).projets;
  const p = chanceDInstaller(chemin, graine);
  return hasard(graine)
    .uProjets.slice(0, n)
    .filter((u) => u < p).length;
}

/** La chance que le GAEC parte chez Nordal, selon la réponse, le dispositif, le plan et la hausse. */
export function chanceDePartir(chemin: readonly number[]): number {
  const g = chemin[D.gaec];
  let p: number =
    g === 0
      ? GAEC.depart.aligne
      : g === 1
        ? GAEC.departDispositif[chemin[D.installation] ?? 0]!
        : GAEC.depart.laisser;
  if (chemin[D.plan] === 2) p -= GAEC.depart.plan;
  if (chemin[D.plan] === 1) p -= HAUSSE.gaec;
  return Math.max(0.02, p);
}
export const gaecPart = (chemin: readonly number[], graine: number) =>
  hasard(graine).uGaec < chanceDePartir(chemin);
/** L'OP apprend la prime individuelle une fois sur deux. */
export const fuite = (chemin: readonly number[], graine: number) =>
  chemin[D.gaec] === 0 && hasard(graine).uFuite < GAEC.fuite;

/** Les voisins qui acceptent de s'agrandir, parmi ceux qu'on connaît. */
export function agrandissements(chemin: readonly number[], graine: number): number {
  if (chemin[D.agrandir] !== 1) return 0;
  const n = connaissance(chemin).hesitants;
  return hasard(graine)
    .uVoisins.slice(0, n)
    .filter((u) => u < AGRANDIR.chance).length;
}

/** La réponse des producteurs à la prime de décembre, en millions de litres par semaine. */
export const reponseDecembre = (graine: number) =>
  PRIME_DECEMBRE.reponseMin +
  hasard(graine).uReponse * (PRIME_DECEMBRE.reponseMax - PRIME_DECEMBRE.reponseMin);

/** Le prix spot d'une semaine : le niveau de l'automne, la tension de Noël, et le bruit. */
export function prixSpot(graine: number, w: number): number {
  const h = hasard(graine);
  const niveau = SPOT.min + h.niveauSpot * (SPOT.max - SPOT.min);
  return niveau + (w >= PIC.debut ? SPOT.noel : 0) + SPOT.bruit * h.semaines[w]!.spot;
}

/** Le spot disponible au pic : quand le prix est haut, c'est que le lait manque partout. */
export function dispoSpot(graine: number, w: number): number {
  if (w < PIC.debut || w > PIC.fin) return Infinity;
  const h = hasard(graine);
  return Math.max(
    0.3,
    DISPO.haut - DISPO.pente * h.niveauSpot + DISPO.bruit * h.semaines[w]!.dispo,
  );
}

/* ---------------------------------------------------------------------------
 * LA COLLECTE ET LES ACHATS, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

/** Le lait que les arrêts du trimestre ont retiré de la semaine w, en millions de litres. */
export const arretsCumules = (w: number) =>
  ARRETS_TRIMESTRE.filter((a) => w >= a.semaine).reduce((s, a) => s + a.volume, 0) / 52;

/** La collecte attendue d'une semaine, sans aléa : ce sur quoi se fonde la prévision du manque. */
export function collecteTendance(chemin: readonly number[], w: number): number {
  let c = (COLLECTE_SEMAINE - arretsCumules(w)) * SAISON[w]!;
  if (chemin[D.plan] === 1 && w >= HAUSSE.effetCollecte) c *= 1 + HAUSSE.collecte;
  return c;
}

/** Le manque prévu en semaine 8 pour chaque semaine du pic, en millions de litres. */
export function manquePrevu(chemin: readonly number[]): number {
  let s = 0;
  for (let w = PIC.debut; w <= PIC.fin; w += 1) s += BESOIN[w]! - collecteTendance(chemin, w);
  return s / (PIC.fin - PIC.debut + 1);
}

/** Le coefficient des kilomètres d'une semaine, selon les tournées. */
function kilometres(chemin: readonly number[], graine: number, w: number): number {
  const t = chemin[D.tournees];
  if (t === 1 && w >= TOURNEES.debutRecalcul) {
    return 1 - (connaissance(chemin).carte ? TOURNEES.recalculCarte : TOURNEES.recalcul);
  }
  if (t === 2 && w >= TOURNEES.debutEchange && echangeAccepte(graine)) return 1 - TOURNEES.echange;
  if (t === 3 && w >= TOURNEES.debutCession) return 1 - TOURNEES.cession;
  return 1;
}

export type Semaine = {
  /** Le lait collecté dans la semaine, en millions de litres. */
  collecte: number;
  besoin: number;
  /** Le lait acheté hors collecte : spot et à terme. */
  spot: number;
  terme: number;
  /** La part du besoin couverte hors collecte. */
  partAchete: number;
  prixSpot: number;
  /** Le lait qui a manqué, en millions de litres. */
  rupture: number;
  /** Le coût de collecte, en € les 1 000 litres collectés. */
  coutCollecte: number;
  /** Ce que le lait de la semaine a coûté, en euros, et en € les 1 000 litres transformés. */
  coutLait: number;
  prixRevient: number;
  coutCumule: number;
  budgetCumule: number;
  /** Ce que la semaine a coûté par rapport au budget, ventes perdues comprises. */
  ecart: number;
  /** Les volumes sécurisés pour les années suivantes, en millions de litres par an. */
  securise: number;
};

export interface Futur {
  installations: number;
  /** Les installations : valeur du lait gardé, primes et avances déduites. */
  valeurInstallations: number;
  gaecReste: boolean;
  valeurGaec: number;
  agrandissements: number;
  valeurAgrandir: number;
  /** Les autres manières de trouver du lait : hausse, volume ouvert, coopérative, collecte cédée. */
  valeurAutres: number;
  /** Les volumes sécurisés pour les années suivantes, en millions de litres par an. */
  volume: number;
  total: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget lait du trimestre, ventes perdues comprises, plus la valeur des volumes sécurisés. */
  objectif: number;
  /** Le coût du lait du trimestre, et le budget. */
  coutLait: number;
  budget: number;
  ventesPerdues: number;
  /** Le lait qui a manqué au pic, en millions de litres. */
  rupture: number;
  spot: number;
  terme: number;
  collecte: number;
  partAchete: number;
  coutCollecteMoyen: number;
  futur: Futur;
  echange: boolean;
  chambre: boolean;
  fuite: boolean;
  niveauSpot: number;
  /** Le chiffre que la prévision de la semaine 1 demande, en millions de litres par an. */
  volumeQuiDisparait: number;
}

const enEuros = (ml: number, prix: number) => ml * 1000 * prix;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, , d3, , d5] = chemin;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const fuiteOP = fuite(chemin, graine);
  const reponse = reponseDecembre(graine);
  const aTerme = d5 === 1 ? manquePrevu(chemin) : 0;
  const semaines: (Semaine | null)[] = [null];
  let gazole = 1;
  let coutCumule = 0;
  let budgetCumule = 0;
  let ventesPerdues = 0;
  let ruptureTotale = 0;
  let spotTotal = 0;
  let termeTotal = 0;
  let collecteTotale = 0;
  let besoinTotal = 0;
  let coutCollecteTotal = 0;
  const futur = projeter(chemin, graine);

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    for (const a of actifs)
      if (a.semaine === w && a.imprevu.effet.gazole) gazole *= a.imprevu.effet.gazole;

    // La collecte : la tendance, l'aléa, les imprévus, la réponse à la prime de décembre.
    let collecte = collecteTendance(chemin, w) * n.collecte;
    for (const a of actifs) {
      collecte *= a.imprevu.effet.collecte ?? 1;
      if (a.semaine === w) collecte -= a.imprevu.effet.perdu ?? 0;
    }
    if (d5 === 2 && w >= DEBUT_REPONSE) collecte += reponse;

    // Le besoin de l'usine, et ce qu'il faut acheter.
    let besoin = BESOIN[w]! * n.besoin;
    for (const a of actifs) besoin += a.imprevu.effet.besoin ?? 0;
    const terme = w >= PIC.debut && w <= PIC.fin ? aTerme : 0;
    const manque = besoin - collecte - terme;
    const prix = prixSpot(graine, w);
    const spot = Math.min(Math.max(0, manque), dispoSpot(graine, w));
    const rupture = Math.max(0, manque) - spot;
    // Le lait acheté à terme en trop est revendu en lait de report, avec une décote.
    const surplus = Math.max(0, -manque);

    // Ce que coûte le lait de la semaine.
    let prixCollecte: number = PRIX_PAYE;
    if (d1 === 1 && w >= HAUSSE.debut) prixCollecte += HAUSSE.euros;
    if (fuiteOP && w >= GAEC.debutFuite) prixCollecte += GAEC.hausseFuite;
    let cout = enEuros(collecte, prixCollecte);
    if (d5 === 2 && w >= DEBUT_REPONSE) {
      cout += enEuros(reponse + PRIME_DECEMBRE.aubaine, PRIME_DECEMBRE.euros);
    }
    cout += enEuros(spot, prix) + enEuros(terme, TERME.prix);
    cout -= enEuros(Math.min(surplus, terme), prix - TERME.decote);
    const coutCollecte = COLLECTE_FIXE * kilometres(chemin, graine, w) * gazole;
    cout += coutCollecte;
    // Les dépenses du plan et des dispositifs.
    if (d1 === 2 && w >= PLAN.debut && w <= PLAN.fin) cout += PLAN.coutSemaine;
    if (d1 === 3 && w === 2) cout += QUESTIONNAIRE.cout;
    if (chemin[D.tournees] === 2 && w === 3) cout += TOURNEES.etude;
    if (d3 === 1 && w === 5) cout += CONVENTION;
    if (d3 === 1 && w === 8) cout += APPUI * connaissance(chemin).projets;
    if (w === 1) cout += perte;

    const perdues = enEuros(rupture, PERTE_RUPTURE);
    const budget = enEuros(BESOIN[w]!, PRIX_BUDGET);
    coutCumule += cout;
    budgetCumule += budget;
    ventesPerdues += perdues;
    ruptureTotale += rupture;
    spotTotal += spot;
    termeTotal += terme;
    collecteTotale += collecte;
    besoinTotal += besoin;
    coutCollecteTotal += coutCollecte;

    semaines.push({
      collecte,
      besoin,
      spot,
      terme,
      partAchete: (spot + terme) / besoin,
      prixSpot: prix,
      rupture,
      coutCollecte: coutCollecte / (collecte * 1000),
      coutLait: cout,
      prixRevient: cout / ((besoin - rupture) * 1000),
      coutCumule,
      budgetCumule,
      ecart: budget - cout - perdues,
      securise: securiseADate(chemin, w, futur),
    });
  }

  return {
    semaines,
    objectif: budgetCumule - coutCumule - ventesPerdues + futur.total,
    coutLait: coutCumule,
    budget: budgetCumule,
    ventesPerdues,
    rupture: ruptureTotale,
    spot: spotTotal,
    terme: termeTotal,
    collecte: collecteTotale,
    partAchete: (spotTotal + termeTotal) / besoinTotal,
    coutCollecteMoyen: coutCollecteTotal / (collecteTotale * 1000),
    futur,
    echange: chemin[D.tournees] === 2 && echangeAccepte(graine),
    chambre: chambreActive(graine),
    fuite: fuiteOP,
    niveauSpot: h.niveauSpot,
    volumeQuiDisparait: VOLUME_QUI_DISPARAIT,
  };
}

/**
 * LA VALEUR DES VOLUMES SÉCURISÉS, estimée en fin de trimestre comme les
 * sources l'enseignent : le lait gardé pendant trois ans, au prix du spot
 * qu'il évite, moins ce qui a été promis pour le garder sur la même durée.
 */
export function projeter(chemin: readonly number[], graine: number): Futur {
  const [d1, d2, d3, d4, , d6] = chemin;
  // Les installations.
  const nInstall = installations(chemin, graine);
  const prime = INSTALLATION[d3 ?? 0]!.prime;
  let valeurInstallations =
    nInstall * (VALEUR_ML * VOLUME_PROJET - surHorizon(prime, VOLUME_PROJET));
  if (d3 === 1) valeurInstallations -= nInstall * COUT_AVANCE;
  // Le GAEC.
  const reste = !gaecPart(chemin, graine);
  let valeurGaec = 0;
  if (reste) {
    valeurGaec = VALEUR_ML * GAEC.volume;
    if (d4 === 0) valeurGaec -= surHorizon(GAEC.primeNordal, GAEC.volume);
    if (d4 === 1) {
      valeurGaec -= surHorizon(INSTALLATION[d3 ?? 0]!.prime, GAEC.volume);
      valeurGaec -= GAEC.avance * AVANCE.cout;
    }
  }
  // Les voisins qui s'agrandissent.
  const nAgrandir = agrandissements(chemin, graine);
  const valeurAgrandir = nAgrandir * (VALEUR_ML * AGRANDIR.volume - COUT_AVANCE_AGRANDIR);
  // Les autres manières de trouver du lait, ou d'en perdre.
  let valeurAutres = 0;
  let volumeAutres = 0;
  if (d1 === 1) valeurAutres += HAUSSE.retenu * ECART_REMPLACEMENT * 1000;
  if (d2 === 3) {
    valeurAutres -= VALEUR_ML * TOURNEES.volumeCede;
    volumeAutres -= TOURNEES.volumeCede;
  }
  if (d6 === 2) {
    valeurAutres += OUVERT.volume * 1000 * VALEUR_OUVERT * HORIZON;
    volumeAutres += OUVERT.volume;
  }
  if (d6 === 3) {
    valeurAutres += surHorizon(ECART_REMPLACEMENT - COOPERATIVE.surcout, COOPERATIVE.volume);
    volumeAutres += COOPERATIVE.volume;
  }
  const volume =
    nInstall * VOLUME_PROJET +
    (reste ? GAEC.volume : 0) +
    nAgrandir * AGRANDIR.volume +
    volumeAutres;
  return {
    installations: nInstall,
    valeurInstallations,
    gaecReste: reste,
    valeurGaec,
    agrandissements: nAgrandir,
    valeurAgrandir,
    valeurAutres,
    volume,
    total: valeurInstallations + valeurGaec + valeurAgrandir + valeurAutres,
  };
}

/** Les volumes sécurisés connus à la fin de la semaine w : installations et GAEC en semaine 12, le reste en 13. */
function securiseADate(chemin: readonly number[], w: number, f: Futur): number {
  let v = 0;
  if (chemin[D.tournees] === 3 && w >= TOURNEES.debutCession) v -= TOURNEES.volumeCede;
  if (w >= SEMAINE_INSTALLATIONS) {
    v += f.installations * VOLUME_PROJET + (f.gaecReste ? GAEC.volume : 0);
  }
  if (w >= SEMAINES) {
    v += f.agrandissements * AGRANDIR.volume;
    if (chemin[D.agrandir] === 2) v += OUVERT.volume;
    if (chemin[D.agrandir] === 3) v += COOPERATIVE.volume;
  }
  return v;
}

/** Ce qui s'est passé pendant des semaines : ruptures au pic, et imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const ruptures: { semaine: number; volume: number }[] = [];
  for (let w = de; w <= a && w <= SEMAINES; w += 1) {
    const r = t.semaines[w]!.rupture;
    if (r > 0.005) ruptures.push({ semaine: w, volume: r });
  }
  return { t, ruptures, imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)) };
}

export interface LectureCollecte {
  collecte: number | null;
  partAchete: number | null;
  coutCollecte: number | null;
  coutCumule: number | null;
  securise: number | null;
  budgetADate: number | null;
  /** Lus pour les messages et les sources. */
  prixSpot: number | null;
  prixRevient: number | null;
  manquePrevu: number | null;
  collecteAnPasse: number | null;
}

/** La collecte de la même semaine l'an dernier, avant la baisse de 4 %. */
export const collecteAnPasse = (w: number) =>
  (COLLECTE_SEMAINE * SAISON[w]!) / (1 - BAISSE_COLLECTE);

/** Ce que Hoel lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureCollecte {
  if (semaine === 0) {
    return {
      collecte: COLLECTE_SEMAINE,
      partAchete: (BESOIN[0]! - COLLECTE_SEMAINE) / BESOIN[0]!,
      coutCollecte: COUT_COLLECTE_DEPART,
      coutCumule: 0,
      securise: 0,
      budgetADate: 0,
      prixSpot: SPOT_MOYEN,
      prixRevient: null,
      manquePrevu: null,
      collecteAnPasse: collecteAnPasse(0),
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    collecte: s.collecte,
    partAchete: s.partAchete,
    coutCollecte: s.coutCollecte,
    coutCumule: s.coutCumule,
    securise: s.securise,
    budgetADate: s.budgetCumule,
    prixSpot: s.prixSpot,
    prixRevient: s.prixRevient,
    manquePrevu: manquePrevu(chemin),
    collecteAnPasse: collecteAnPasse(semaine),
  };
}
