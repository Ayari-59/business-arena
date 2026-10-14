/**
 * LE FOURNISSEUR QUI AUGMENTE — le modèle de la famille plâtrerie-isolation.
 *
 * Placova, le fabricant qui fournit 70 % des achats de la famille, annonce
 * +12 % au premier jour du trimestre. Treize semaines, six décisions. Quatre
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · ON NE NÉGOCIE QU'AVEC UNE SOLUTION DE REPLI. Ce que Placova concède
 *     dépend de l'alternative qu'il croit crédible : un second fournisseur en
 *     cours d'essai change la discussion, une menace sans essai ne la change
 *     pas. Sans alternative, céder contre une remise de fin d'année est
 *     encore le moins mauvais choix.
 *   · LA HAUSSE N'EST PAS UN BLOC. Sept de ses douze points tiennent au gaz,
 *     qui baisse pendant le trimestre ; trois aux matières ; deux à rien de
 *     précis. Un prix indexé sur l'énergie suit la baisse ; un prix ferme la
 *     fige. L'indexation est meilleure en moyenne, et plus risquée si le gaz
 *     remonte.
 *   · LE PRIX FACIAL N'EST PAS LE COÛT. Brévent, le fournisseur alternatif,
 *     est 9 % moins cher que le nouveau tarif, mais c'est une petite usine :
 *     au-delà de sa capacité, il livre en retard, et chaque retard se paie en
 *     dépannages au prix fort, en ventes perdues et en artisans qui partent.
 *     Les trois premières semaines avec un fournisseur qu'on n'a pas essayé
 *     coûtent plus encore.
 *   · LA PLAQUE SE COMPARE AU CENTIME. Répercuter toute la hausse sur les prix
 *     de vente rapporte si le concurrent suit, et fait partir les artisans
 *     s'il ne suit pas. Tenir le prix de la plaque standard et augmenter les
 *     références techniques protège la marge sans ouvrir la porte.
 *
 * Le trimestre est jugé sur la marge de la famille, coûts de non-qualité,
 * dépannages et ventes perdues compris : le prix d'achat n'en est qu'une part.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Ventes hebdomadaires de la famille, au prix de vente d'avant la hausse. */
export const VENTES = 122000;
/** Achats hebdomadaires de plaques à l'ancien tarif : la part de Placova au départ. */
export const PLAQUES = 70000;
/** Isolants et accessoires, achetés à d'autres fournisseurs. */
export const AUTRES = 30000;
/** Ce qu'un euro d'achat à l'ancien tarif rapporte en ventes : 18 % de marge brute. */
export const COEFFICIENT = VENTES / (PLAQUES + AUTRES);
/** Ce que les autres fournisseurs de la famille ont augmenté, eux aussi. */
export const HAUSSE_AUTRES = 0.03;
export const HAUSSE_ANNONCEE = 0.12;
/** La décomposition de la hausse : le gaz, les matières, et le reste. */
export const PART_ENERGIE = 0.07;
export const PART_MATIERES = 0.03;
/** Le prix de Brévent, au-dessus de l'ancien tarif de Placova. */
export const HAUSSE_BREVENT = 0.02;
/** Le supplément d'une livraison express chez Placova, en dépannage. */
export const EXPRESS = 0.15;
/** Le prix d'un dépannage chez un négociant confrère, au-dessus de l'ancien tarif. */
export const CONFRERES = 0.3;
/** Part des livraisons de Placova avec réserves (casse, plaques humides, erreurs). */
export const NON_CONFORMES_PLACOVA = 0.02;
/** Ce que coûte une livraison non conforme, rapporté à sa valeur : reprise, retour, geste. */
export const COUT_NON_QUALITE = 0.35;
/** Le budget de marge de la famille pour le trimestre, révisé après l'annonce. */
export const BUDGET = 230000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les agences commandent au nouveau tarif sans consigne. */
export const PERTE_PAR_JOUR = 2000;
/** L'arrêt de four de Placova, en semaines 10 et 11. */
export const ARRET = { de: 10, a: 11 } as const;
/** Ce que Placova livre pendant l'arrêt : sa part habituelle, ou moins s'il vous a déclassé. */
export const ALLOCATION = { normale: 0.65, degradee: 0.45 } as const;
/** Le stock de précaution : location d'un entrepôt, et casse en manutention. */
export const STOCK = { location: 3000, casse: 0.05 } as const;
export const FRAIS_RECLAMATION = 1000;
export const OBJECTIF_CONFORMES = 0.95;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  annonce: 0,
  negociation: 1,
  prixVente: 2,
  repartition: 3,
  arret: 4,
  avoirs: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 2, 2, 2, 2] as const;

/** La hausse des prix de vente de la famille, selon la décision de la semaine 4. */
export const PRIX_VENTE = [0.07, 0.03, 0] as const;
/**
 * Les volumes qui restent, selon le concurrent : [s'il tient ses prix, s'il
 * suit de 4 %]. La plaque standard se compare d'une agence à l'autre ; les
 * références techniques beaucoup moins.
 */
export const VOLUMES_APRES_HAUSSE = [
  [0.62, 0.86],
  [0.96, 1],
  [1, 1.03],
] as const;

/** La part des achats de plaques confiée à Brévent à partir de la semaine 7. */
export const PART_BREVENT = [0.3, 1, 0, 0.1] as const;

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
  effet: { demande?: number; livraison?: number; gaz?: number; perte?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "greve",
    titre: "Grève des transporteurs",
    de: "Logistique",
    role: "Dépôt régional",
    texte:
      "Les transporteurs routiers bloquent les accès de la zone de Corbas : une livraison de plaques sur six arrive avec plusieurs jours de retard.",
    duree: 1,
    effet: { livraison: 0.85 },
  },
  {
    id: "promoteur",
    titre: "Un promoteur commande en urgence",
    de: "Agence de Villeurbanne",
    role: "Chef d'agence",
    texte:
      "Un promoteur rattrape le retard d'une résidence de 80 logements : ses plaquistes vident nos racks pendant deux semaines.",
    duree: 2,
    effet: { demande: 1.15 },
  },
  {
    id: "intemperies",
    titre: "Intempéries",
    de: "Agence de Givors",
    role: "Chef d'agence",
    texte:
      "Une semaine de pluie et de vent : les chantiers hors d'eau prennent du retard, les artisans décalent leurs commandes.",
    duree: 1,
    effet: { demande: 0.8 },
  },
  {
    id: "gaz",
    titre: "Flambée du gaz",
    de: "Veille marchés",
    role: "Direction des achats",
    texte:
      "Un incident sur un terminal méthanier fait bondir le prix du gaz industriel pendant trois semaines.",
    duree: 3,
    effet: { gaz: 0.3 },
  },
  {
    id: "degat",
    titre: "Dégât des eaux à Vénissieux",
    de: "Agence de Vénissieux",
    role: "Chef d'agence",
    texte:
      "Une canalisation a cédé au-dessus du stock : quarante palettes de plaques mouillées, bonnes pour la benne.",
    duree: 1,
    effet: { perte: 4000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  gaz: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le prix du gaz en fin de trimestre, rapporté à celui du jour de l'annonce. */
  gazFin: number;
  /** Ce que Brévent peut livrer par semaine, en valeur à l'ancien tarif. */
  capacite: number;
  /** La part des livraisons de Brévent avec réserves, une fois rodé. */
  qualite: number;
  /** Placova accepte-t-il ce qu'on lui demande ? */
  uNegociation: number;
  /** Le concurrent d'en face suit-il la hausse ? */
  uConcurrent: number;
  /** Constructions Vallet part-il après des ruptures ? */
  uVallet: number;
  /** Placova bloque-t-il les livraisons si on se paie sur ses factures ? */
  uBlocage: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 15485863 + 17);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: borne(1 + 0.05 * gauss(r), 0.85, 1.15),
      gaz: 0.03 * gauss(r),
    });
  }
  const gazFin = borne(0.6 + 0.3 * gauss(r), 0.2, 1.4);
  const capacite = borne(28000 + 4500 * gauss(r), 18000, 38000);
  const qualite = borne(0.05 + 0.025 * gauss(r), 0.015, 0.12);
  const uNegociation = r();
  const uConcurrent = r();
  const uVallet = r();
  const uBlocage = r();
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
    gazFin,
    capacite,
    qualite,
    uNegociation,
    uConcurrent,
    uVallet,
    uBlocage,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/**
 * LA SOLUTION DE REPLI.
 *
 * Placova sait si un camion de Brévent a déchargé chez vous. Un essai en
 * cours, ou des volumes déjà partis, rendent la menace crédible ; une
 * signature donnée en semaine 1 la rend presque nulle.
 */
export const alternativeCredible = (chemin: readonly number[]) =>
  chemin[D.annonce] === 1 || chemin[D.annonce] === 2;

/** La chance que Placova accepte une formule indexée. */
export function chanceIndexation(chemin: readonly number[]): number {
  if (alternativeCredible(chemin)) return 0.9;
  return chemin[D.annonce] === 0 ? 0.2 : 0.35;
}

/** La chance que Placova cède à un ultimatum : un bluff sans essai se voit. */
export const chanceUltimatum = (chemin: readonly number[]) =>
  alternativeCredible(chemin) ? 0.5 : 0.15;

export type Issue = "compromis" | "indexe" | "refus" | "cede" | "rompu" | "signe";

/** Ce que Placova répond en semaine 3, selon la demande et la solution de repli. */
export function issueNegociation(chemin: readonly number[], graine: number): Issue {
  const u = hasard(graine).uNegociation;
  switch (chemin[D.negociation]) {
    case 0:
      return "compromis";
    case 1:
      return u < chanceIndexation(chemin) ? "indexe" : "refus";
    case 2:
      return u < chanceUltimatum(chemin) ? "cede" : "rompu";
    default:
      return "signe";
  }
}

/** Le prix ferme du compromis : un point de moins quand Placova craint de perdre les volumes. */
export function prixCompromis(chemin: readonly number[]): number {
  if (alternativeCredible(chemin)) return 0.095;
  return chemin[D.annonce] === 0 ? 0.11 : 0.105;
}

/** Le concurrent d'en face tient ses prix une fois sur deux. */
export const concurrentTient = (graine: number) => hasard(graine).uConcurrent < 0.5;

/** Se payer sur les factures de Placova le fait bloquer les livraisons une fois sur deux. */
export const placovaBloque = (chemin: readonly number[], graine: number) =>
  chemin[D.avoirs] === 3 && hasard(graine).uBlocage < 0.5;

/** Le risque que Constructions Vallet parte, lu sur les ventes perdues des semaines 1 à 8. */
export const risqueVallet = (pertesMoyennes: number) => borne((pertesMoyennes - 0.01) * 12, 0, 0.8);

/** Le prix du gaz d'une semaine, rapporté à celui du jour de l'annonce. */
export function gaz(graine: number, w: number): number {
  const h = hasard(graine);
  let g = 1 + ((h.gazFin - 1) * (w - 1)) / 12 + h.semaines[w]!.gaz;
  for (const i of h.imprevus) {
    if (w >= i.semaine && w < i.semaine + i.imprevu.duree) g += i.imprevu.effet.gaz ?? 0;
  }
  return Math.max(0.2, g);
}

export type Semaine = {
  /** Le prix d'achat moyen des plaques reçues, au-dessus de l'ancien tarif. */
  hausse: number;
  /** La marge de la semaine, tous coûts de non-qualité compris. */
  margeSemaine: number;
  /** La marge cumulée depuis le début du trimestre. */
  marge: number;
  /** La part des plaques commandées à Brévent. */
  partBrevent: number;
  /** La part des plaques commandées livrées à l'heure et sans réserve. */
  conformes: number;
  /** Les volumes vendus, 100 = la moyenne du trimestre dernier. */
  volumes: number;
  /** Les coûts de non-qualité cumulés : réserves, dépannages, ventes perdues. */
  nonQualite: number;
  /** Ce qu'on peut réclamer aux fournisseurs : les réserves, et une part des retards. */
  reclamable: number;
  gaz: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge de la famille sur le trimestre, coûts de non-qualité et ruptures compris. */
  objectif: number;
  issue: Issue;
  concurrentTient: boolean;
  valletPart: boolean;
  placovaBloque: boolean;
  /** Le stock de précaution a-t-il couvert l'arrêt de four ? */
  stock: boolean;
  avoirs: number;
  remiseFinAnnee: number;
  nonQualite: number;
  hausseMoyenne: number;
  conformesMoyen: number;
  volumesMoyen: number;
  partBreventFinale: number;
  gazFin: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, , d3, d4, d5, d6] = chemin as readonly number[];
  const issue = issueNegociation(chemin, graine);
  const tient = concurrentTient(graine);
  const bloque = placovaBloque(chemin, graine);
  const degrade = issue === "rompu";
  const semaines: (Semaine | null)[] = [null];

  let marge = 0;
  let nonQualite = 0;
  let reservesCumulees = 0;
  let surcoutDepannage = 0;
  let achatsPlacova = 0;
  let partMax = 0;
  let perdus = 0;
  let pertesCumulees = 0;
  let semainesBrevent = 0;
  let vallet = false;
  let stockParSemaine = 0;
  let prixStock = 0;
  let avoirs = 0;
  let remiseFinAnnee = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let frais = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    for (const a of actifs) frais += a.imprevu.effet.perte ?? 0;

    // Le prix de Placova : le tarif annoncé, puis ce que la négociation a donné.
    const g = gaz(graine, w);
    let hP = HAUSSE_ANNONCEE;
    if (w >= 3) {
      if (issue === "compromis") hP = prixCompromis(chemin);
      if (issue === "indexe") hP = PART_MATIERES + PART_ENERGIE * g;
      if (issue === "cede") hP = 0.07;
      // Rompu : Placova retire la remise de fidélité d'un point, et vous déclasse.
      if (issue === "rompu") hP = HAUSSE_ANNONCEE + 0.01;
    }

    // La demande : le marché, les prix de vente, les artisans perdus.
    let demande = n.demande;
    for (const a of actifs) demande *= a.imprevu.effet.demande ?? 1;
    let p = 0;
    if (w >= 5) {
      const plein = VOLUMES_APRES_HAUSSE[d3!]![tient ? 0 : 1];
      demande *= w === 5 ? (1 + plein) / 2 : plein;
      p = PRIX_VENTE[d3!]!;
    }
    demande *= 1 - perdus;
    if (vallet) demande *= 0.94;

    // La part de Brévent : l'essai ou la bascule de la semaine 1, puis la répartition.
    let s = 0;
    if (w >= 2 && w <= 6) s = d1 === 1 ? 0.05 : d1 === 2 ? 1 : 0;
    if (w >= 7) s = PART_BREVENT[d4!]!;
    const commandes = PLAQUES * demande;
    let aBrevent = commandes * s;
    let aPlacova = commandes - aBrevent;

    // L'arrêt de four de Placova, et ce qu'on a prévu pour le passer.
    let manque = 0;
    let depannage = 0;
    let coutDepannage = 0;
    let duStock = 0;
    let perdu = 0;
    let artisansFideles = 1;
    const enArret = w >= ARRET.de && w <= ARRET.a;
    if (w === ARRET.de - 1 && d5 === 1) {
      // Deux semaines de manque achetées avant l'arrêt, au prix de la semaine 9.
      stockParSemaine = PLAQUES * (1 - s) * (1 - ALLOCATION.normale);
      prixStock = 1 + hP;
      frais += STOCK.location + STOCK.casse * 2 * stockParSemaine * prixStock;
    }
    if (enArret) {
      manque = aPlacova * (1 - (degrade ? ALLOCATION.degradee : ALLOCATION.normale));
      aPlacova -= manque;
      if (d5 === 0) {
        aBrevent += manque;
        manque = 0;
      } else if (d5 === 1) {
        duStock = Math.min(manque, stockParSemaine);
        manque -= duStock;
        perdu += manque;
      } else if (d5 === 3) {
        depannage += manque;
        coutDepannage += manque * (1 + CONFRERES);
        surcoutDepannage += manque * (CONFRERES - hP);
      } else {
        perdu += manque;
        artisansFideles = 0.5;
      }
    }
    if (bloque && w >= SEMAINES - 1) {
      // Placova bloque les livraisons des deux dernières semaines : dépannage chez les confrères.
      const bloquees = aPlacova;
      aPlacova = 0;
      depannage += bloquees * 0.75;
      coutDepannage += bloquees * 0.75 * (1 + CONFRERES);
      surcoutDepannage += bloquees * 0.75 * (CONFRERES - hP);
      perdu += bloquees * 0.25;
    }

    // Brévent : sa capacité, et les trois premières semaines d'un fournisseur qu'on n'a pas essayé.
    // Un fournisseur qu'on découvre livre peu la première semaine, et mal les trois premières.
    const rode = semainesBrevent >= 3;
    const rodage = semainesBrevent === 0 ? 0.4 : rode ? 1 : 0.7;
    // Prévenu à temps, un Brévent rodé ajoute une équipe pendant l'arrêt de Placova.
    const capacite = h.capacite * rodage * (enArret && d5 === 0 && rode ? 1.3 : 1);
    let qB = h.qualite * (rode ? 1 : 2.5);
    if (d1 === 1 && w >= 7) qB *= 0.7; // L'essai a permis de caler le cahier des charges.
    const livreB = Math.min(aBrevent, capacite);
    const retardB = aBrevent - livreB;
    if (retardB > 0) {
      // Les agences se dépannent : chez Placova en express, ou chez un confrère pendant l'arrêt.
      const prixSecours = enArret ? 1 + CONFRERES : 1 + hP + EXPRESS;
      depannage += retardB * 0.75;
      coutDepannage += retardB * 0.75 * prixSecours;
      surcoutDepannage += retardB * 0.75 * (prixSecours - 1 - HAUSSE_BREVENT);
      perdu += retardB * 0.25;
    }
    if (aBrevent > 0.01 * commandes) semainesBrevent += 1;
    partMax = Math.max(partMax, w >= 3 ? s : 0);

    // La grève : une livraison sur six arrive trop tard pour le chantier.
    let livraison = 1;
    for (const a of actifs) livraison *= a.imprevu.effet.livraison ?? 1;
    const retardGreve = (aPlacova + livreB) * (1 - livraison) * 0.3;
    perdu += retardGreve;

    // Ce que la semaine a coûté et rapporté.
    const qP = NON_CONFORMES_PLACOVA + (degrade ? 0.015 : 0);
    const coutPlacova = aPlacova * (1 + hP);
    const coutBrevent = livreB * (1 + HAUSSE_BREVENT);
    const coutStock = duStock * prixStock;
    const vendues = demande * VENTES - perdu * COEFFICIENT;
    const ventes = vendues * (1 + p);
    const achats =
      coutPlacova +
      coutBrevent +
      coutDepannage +
      coutStock +
      AUTRES * demande * (1 + HAUSSE_AUTRES) -
      // Les plaques arrivées après le chantier restent en stock pour le trimestre suivant.
      retardGreve * (1 + hP);
    const reserves = COUT_NON_QUALITE * (qP * coutPlacova + qB * coutBrevent);
    const margePerdue = perdu * (COEFFICIENT * (1 + p) - 1 - hP);
    reservesCumulees += reserves;
    // Les réserves portées sur les bons de livraison, et une part des retards.
    const reclamable = reservesCumulees + 0.3 * surcoutDepannage;
    nonQualite += reserves + margePerdue + Math.max(0, coutDepannage - depannage * (1 + hP));
    achatsPlacova += coutPlacova;

    // Les artisans servis en retard vont voir ailleurs, et certains ne reviennent pas.
    const partPerdue = perdu / Math.max(1, commandes + AUTRES * demande);
    perdus = Math.min(0.25, perdus + 0.15 * partPerdue * artisansFideles);
    if (w <= 8) pertesCumulees += partPerdue;
    if (w === 8 && h.uVallet < risqueVallet(pertesCumulees / 8)) vallet = true;

    // La fin du trimestre : les avoirs réclamés, la remise de fin d'année.
    if (w === SEMAINES) {
      const base = reclamable;
      if (d6 === 0) avoirs = 0.8 * base - FRAIS_RECLAMATION;
      if (d6 === 1) avoirs = 0.3 * base;
      if (d6 === 3) avoirs = base;
      if (issue === "signe" && partMax <= 0.1) remiseFinAnnee = 0.02 * achatsPlacova;
    }

    const margeSemaine = ventes - achats - reserves - frais + avoirs + remiseFinAnnee;
    marge += margeSemaine;
    const recues = aPlacova + livreB + depannage + duStock;
    const valeurRecues = coutPlacova + coutBrevent + coutDepannage + coutStock;
    semaines.push({
      hausse: recues > 0 ? valeurRecues / recues - 1 : hP,
      margeSemaine,
      marge,
      partBrevent: commandes > 0 ? aBrevent / commandes : 0,
      conformes: borne(
        ((aPlacova * (1 - qP) + livreB * (1 - qB) + duStock) * livraison) / commandes,
        0,
        1,
      ),
      volumes: (100 * vendues) / VENTES,
      nonQualite,
      reclamable,
      gaz: g,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const moyenneDe = (f: (s: Semaine) => number) => pleines.reduce((x, s) => x + f(s), 0) / SEMAINES;
  return {
    semaines,
    objectif: marge,
    issue,
    concurrentTient: tient,
    valletPart: vallet,
    placovaBloque: bloque,
    stock: d5 === 1,
    avoirs,
    remiseFinAnnee,
    nonQualite,
    hausseMoyenne: moyenneDe((s) => s.hausse),
    conformesMoyen: moyenneDe((s) => s.conformes),
    volumesMoyen: moyenneDe((s) => s.volumes),
    partBreventFinale: pleines[SEMAINES - 1]!.partBrevent,
    gazFin: h.gazFin,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses de Placova, départs, blocages, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    issue: dans(3) ? t.issue : null,
    valletPart: t.valletPart && dans(9),
    placovaBloque: t.placovaBloque && dans(13),
    remiseFinAnnee: dans(13) && chemin[D.negociation] === 3 ? t.remiseFinAnnee : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureAchats {
  hausse: number | null;
  marge: number | null;
  partBrevent: number | null;
  conformes: number | null;
  volumes: number | null;
  nonQualite: number | null;
  reclamable: number | null;
  budgetADate: number | null;
}

/** Ce qu'on lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAchats {
  if (semaine === 0) {
    return {
      hausse: HAUSSE_ANNONCEE,
      marge: 0,
      partBrevent: 0,
      conformes: 0.97,
      volumes: 100,
      nonQualite: 0,
      reclamable: 0,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    hausse: s.hausse,
    marge: s.marge,
    partBrevent: s.partBrevent,
    conformes: s.conformes,
    volumes: s.volumes,
    nonQualite: s.nonQualite,
    reclamable: s.reclamable,
    budgetADate: (BUDGET * semaine) / SEMAINES,
  };
}
