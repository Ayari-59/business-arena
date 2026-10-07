/**
 * LE PRODUIT QUI PERD DE L'ARGENT — le modèle des gammes de l'agence de Villefranche.
 *
 * Une agence de négoce, quatre gammes (gros œuvre, outillage, plomberie-
 * chauffage, quincaillerie de finition), treize semaines, six décisions. Le
 * tableau de la direction est en COÛT COMPLET : chaque gamme y porte sa part
 * des charges communes, répartie au prorata du chiffre d'affaires. La
 * plomberie-chauffage y affiche un déficit, et la direction veut l'arrêter.
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LES CHARGES COMMUNES NE DISPARAISSENT PAS AVEC LA GAMME. Le bâtiment,
 *     la direction d'agence, la caisse, l'informatique et les frais de siège
 *     restent ; arrêter la plomberie-chauffage supprime sa marge sur coût
 *     variable, et seulement la partie de ses coûts spécifiques qui est
 *     évitable dans le trimestre (le stock, sa démarque, le showroom) : le
 *     bail du local annexe, la location du porteur et les deux salaires
 *     restent. Sa marge sur coûts spécifiques est positive : le « déficit »
 *     est fabriqué par la clé de répartition. Quand le chiffre d'affaires
 *     d'une gamme baisse, sa part de charges communes baisse avec lui et
 *     passe sur les autres : le tableau en coût complet s'améliore pendant
 *     que le résultat de l'agence se dégrade.
 *   · UNE SOUS-FAMILLE, ELLE, NE COUVRE PAS SES PROPRES COÛTS. Le corner
 *     peinture-décoration, noyé dans une quincaillerie de finition rentable,
 *     a une marge sur coûts spécifiques négative : une vendeuse dédiée, une
 *     machine à teinter louée, 900 références dont les deux tiers font la
 *     démarque. C'est lui qu'il faut fermer ou réorganiser ; le relancer par
 *     une promotion fait du volume à une marge qui ne couvre rien.
 *   · LES VENTES LIÉES. Les chauffagistes viennent pour la plomberie et
 *     achètent aussi de l'outillage et de la quincaillerie. Leur présence
 *     réagit à tout ce qui touche la gamme (arrêt, prix, vendeur, opération)
 *     avec quelques semaines d'inertie, et la part des autres rayons qu'ils
 *     emportent avec eux est tirée au hasard.
 *
 * Le trimestre est jugé en euros : le résultat de l'agence, en écart à son
 * budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE DERNIER, tel que la contrôleuse de gestion l'a arrêté (en euros).
 * Toutes les sources de l'épisode en sont tirées.
 * ------------------------------------------------------------------------- */

export type Gamme = "go" | "out" | "pc" | "qf";
export const GAMMES: readonly Gamme[] = ["go", "out", "pc", "qf"];
export const NOMS_GAMMES: Record<Gamme, string> = {
  go: "Gros œuvre",
  out: "Outillage",
  pc: "Plomberie-chauffage",
  qf: "Quincaillerie de finition",
};

/** Chiffre d'affaires, coûts variables (achats consommés, transport sur achats) et coûts spécifiques. */
export const REFERENCE: Record<Gamme, { ca: number; cv: number; cs: number }> = {
  go: { ca: 800000, cv: 640000, cs: 60000 },
  out: { ca: 300000, cv: 204000, cs: 36000 },
  pc: { ca: 500000, cv: 390000, cs: 66000 },
  qf: { ca: 200000, cv: 128000, cs: 40000 },
};

/** Les coûts spécifiques de la plomberie-chauffage : ce que la gamme seule fait exister. */
export const SPECIFIQUES_PC = {
  vendeur: 14000,
  magasinier: 6000,
  local: 8000,
  showroom: 7000,
  detention: 9000,
  demarque: 5000,
  sav: 8000,
  porteur: 9000,
} as const;
/** Ceux qui disparaîtraient dans le trimestre si la gamme s'arrêtait : le stock, sa démarque, le showroom. */
export const EVITABLES_PC =
  SPECIFIQUES_PC.detention + SPECIFIQUES_PC.demarque + SPECIFIQUES_PC.showroom;

/** Le corner peinture-décoration, une sous-famille de la quincaillerie de finition. */
export const PEINTURE = { ca: 50000, cv: 38000 } as const;
export const SPECIFIQUES_PEINTURE = {
  vendeuse: 11000,
  machine: 4000,
  detention: 3000,
  demarque: 5000,
  animation: 2000,
  presentoirs: 1000,
} as const;
/** Le reste de la quincaillerie de finition : visserie, fixation, serrurerie, quincaillerie de bâtiment. */
export const QUINCAILLERIE = {
  ca: REFERENCE.qf.ca - PEINTURE.ca,
  cv: REFERENCE.qf.cv - PEINTURE.cv,
  cs: 14000,
} as const;

/** Les charges communes de l'agence, sur le trimestre. */
export const COMMUNES = {
  batiment: 62000,
  personnel: 96000,
  siege: 34000,
  energie: 14000,
  assurances: 10000,
} as const;
/** Dont, dans le personnel commun, l'intérimaire du comptoir général. */
export const INTERIM_COMPTOIR = 8000;

const somme = (o: Readonly<Record<string, number>>) => Object.values(o).reduce((s, x) => s + x, 0);
export const TOTAL_COMMUNES = somme(COMMUNES);
export const CA_TOTAL = somme(Object.fromEntries(GAMMES.map((g) => [g, REFERENCE[g].ca])));
/** La clé du tableau de la direction : les charges communes au prorata du chiffre d'affaires. */
export const TAUX_REPARTITION = TOTAL_COMMUNES / CA_TOTAL;

export const mcv = (g: Gamme) => REFERENCE[g].ca - REFERENCE[g].cv;
export const tauxMcv = (g: Gamme) => mcv(g) / REFERENCE[g].ca;
export const margeSurCoutsSpecifiques = (g: Gamme) => mcv(g) - REFERENCE[g].cs;
export const repartition = (g: Gamme) => TAUX_REPARTITION * REFERENCE[g].ca;
export const resultatCoutComplet = (g: Gamme) => margeSurCoutsSpecifiques(g) - repartition(g);
export const MCS_PEINTURE = PEINTURE.ca - PEINTURE.cv - somme(SPECIFIQUES_PEINTURE);
export const RESULTAT_REFERENCE = GAMMES.reduce((s, g) => s + resultatCoutComplet(g), 0);

/** Le budget du trimestre : le résultat que la direction attend de l'agence. */
export const BUDGET = 12000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la rumeur d'un arrêt court chez les chauffagistes. */
export const PERTE_PAR_JOUR = 1500;

/** La part de l'outillage et de la quincaillerie achetée par des chauffagistes, selon les mois. */
export const LIE = { min: 0.08, max: 0.2 } as const;
/** La part des chaudières, pompes à chaleur et ballons, que les chauffagistes comparent, dans la gamme. */
export const PART_COMPAREE = 0.45;
/** La baisse de Calorive sur ces références, à partir de la semaine 5. */
export const BAISSE_CALORIVE = 0.08;
export const DEBUT_CALORIVE = 5;
/** La hausse de prix pour « couvrir sa part de frais ». */
export const HAUSSE_PC = 0.05;
/** Les soldes de l'arrêt : la remise moyenne, et le volume qu'elle fait. */
export const SOLDES = { remise: 0.06, volume: 1.2 } as const;
/** La présence des chauffagistes se rapproche de sa cible de 40 % par semaine. */
export const INERTIE = 0.4;
/** Une fois la gamme arrêtée, un chauffagiste sur quatre revient encore pour le reste. */
export const PRESENCE_APRES_ARRET = 0.25;
/** Pendant l'arrêt annoncé, ils finissent leurs chantiers en cours, et commencent les suivants ailleurs. */
export const PRESENCE_PENDANT_ARRET = 0.8;
/** Si l'on attend, la direction tranche elle-même en semaine 5 un peu plus d'une fois sur deux. */
export const CHANCE_ARRET_IMPOSE = 0.55;
/** Ilescu Chauffage, le plus gros chauffagiste client, part une fois sur deux si l'on ne s'aligne pas. */
export const CHANCE_ILESCU = 0.5;
export const PART_ILESCU = 0.08;
export const SEMAINE_ILESCU = 7;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  gamme: 0,
  peinture: 1,
  calorive: 2,
  vendeur: 3,
  operation: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision : attendre, garder le corner, ne pas s'aligner, garder Lilian. */
export const NEUTRE = [3, 3, 2, 3, 3, 3] as const;

export const COUTS = {
  mobilier: 4000,
  animationRelance: 1500,
  visites: 1400,
  prospectus: 3000,
  teteDeGondole: 2500,
  matinee: 2500,
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
    /** Un coût ponctuel, la première semaine. */
    cout?: number;
    /** Un multiplicateur du volume, par gamme. */
    volume?: Partial<Record<Gamme, number>>;
    /** Une hausse du coût variable du gros œuvre, en part du prix. */
    coutGo?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chariot",
    titre: "Panne du chariot élévateur du parc",
    de: "Boubacar Camara",
    role: "Chef de parc",
    texte:
      "Le chariot du parc a cassé son mât : une semaine de chargements à la main et de clients renvoyés, et 2 400 € de réparation.",
    duree: 1,
    effet: { cout: 2400, volume: { go: 0.8 } },
  },
  {
    id: "froid",
    titre: "Coup de froid précoce",
    de: "Lilian Guillaumin",
    role: "Vendeur-conseil plomberie-chauffage",
    texte:
      "Premières gelées : les chauffagistes enchaînent les dépannages et viennent chercher des pièces, des circulateurs et des chaudières.",
    duree: 2,
    effet: { volume: { pc: 1.25 } },
  },
  {
    id: "ciment",
    titre: "Hausse du ciment chez le fournisseur",
    de: "Boubacar Camara",
    role: "Chef de parc",
    texte:
      "Le cimentier augmente ses tarifs de 4 % sans préavis ; les prix de vente du gros œuvre ne bougeront qu'au prochain tarif.",
    duree: 4,
    effet: { coutGo: 0.015 },
  },
  {
    id: "vol",
    titre: "Vol dans le rayon outillage",
    de: "Armelle Kieffer",
    role: "Directrice de l'agence",
    texte:
      "Effraction dans la nuit : une vingtaine de perforateurs et de visseuses ont disparu. 6 500 € de stock, sous la franchise de l'assurance.",
    duree: 1,
    effet: { cout: 6500 },
  },
  {
    id: "crue",
    titre: "Crue de la Saône",
    de: "Armelle Kieffer",
    role: "Directrice de l'agence",
    texte:
      "La Saône est sortie de son lit : la route du port est coupée deux jours, et les artisans ne passent plus.",
    duree: 1,
    effet: { volume: { go: 0.75, out: 0.75, pc: 0.75, qf: 0.75 } },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  go: number;
  out: number;
  pc: number;
  qf: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La part de l'outillage et de la quincaillerie que les chauffagistes emportent avec eux s'ils partent. */
  lie: number;
  /** La part de la quincaillerie que les peintres emportent avec eux. */
  liePeintres: number;
  /** Les chauffagistes perdus par une hausse de 5 % des prix de la gamme. */
  elasticite: number;
  /** Les ventes de chaudières perdues si l'on ne s'aligne pas sur Calorive. */
  perteComparee: number;
  /** Les ventes du corner perdues en le réduisant à 250 références. */
  perteReorganisation: number;
  /** Le volume que la promotion du corner fait gagner. */
  gainRelance: number;
  /** Les chauffagistes perdus sans vendeur dédié. */
  perteVendeur: number;
  /** Ce que les visites de chantier de Lilian rapportent, de 0 à 1. */
  uVisites: number;
  /** La part des chauffagistes invités qui viennent à la matinée, de 0 à 1. */
  affluence: number;
  /** Le volume que la remise de fin de trimestre sur le gros œuvre fait gagner. */
  volumeRemise: number;
  /** Ce que la relance des devis en attente transforme, autour de 1. */
  transformation: number;
  /** La direction tranche-t-elle si l'on attend ? */
  uDirection: number;
  /** Ilescu Chauffage part-il chez Calorive ? */
  uIlescu: number;
  /** Orvalis cofinance-t-il le mobilier du corner ? */
  uOrvalis: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const entre = (r: () => number, a: number, b: number) => a + (b - a) * r();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000213 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    // L'activité commune du bâtiment (météo, chantiers), puis ce qui est propre à chaque gamme.
    const commun = 1 + 0.04 * gauss(r);
    const g = () => borne(commun * (1 + 0.05 * gauss(r)), 0.82, 1.18);
    semaines.push({ go: g(), out: g(), pc: g(), qf: g() });
  }
  const lie = entre(r, LIE.min, LIE.max);
  const liePeintres = entre(r, 0.02, 0.06);
  const elasticite = entre(r, 0.2, 0.4);
  const perteComparee = entre(r, 0.25, 0.5);
  const perteReorganisation = entre(r, 0.05, 0.4);
  const gainRelance = entre(r, 0.3, 0.9);
  const perteVendeur = entre(r, 0.15, 0.35);
  const uVisites = r();
  const affluence = r();
  const volumeRemise = entre(r, 0.15, 0.45);
  const transformation = entre(r, 0.6, 1.4);
  const uDirection = r();
  const uIlescu = r();
  const uOrvalis = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    semaines,
    lie,
    liePeintres,
    elasticite,
    perteComparee,
    perteReorganisation,
    gainRelance,
    perteVendeur,
    uVisites,
    affluence,
    volumeRemise,
    transformation,
    uDirection,
    uIlescu,
    uOrvalis,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Si l'on demande un trimestre de plus sans rien montrer, la direction tranche elle-même. */
export const arretImpose = (chemin: readonly number[], graine: number) =>
  chemin[D.gamme] === 3 && hasard(graine).uDirection < CHANCE_ARRET_IMPOSE;

/** Le calendrier de l'arrêt de la plomberie-chauffage, s'il a lieu. */
export interface Arret {
  /** La semaine où les chauffagistes l'apprennent : plus de réassort. */
  annonce: number;
  /** Les soldes du stock, jusqu'à la fermeture. */
  soldes: number;
  /** La première semaine sans rayon. */
  fermeture: number;
  impose: boolean;
}
export function calendrierDArret(chemin: readonly number[], graine: number): Arret | null {
  if (chemin[D.gamme] === 0) return { annonce: 2, soldes: 5, fermeture: 11, impose: false };
  if (arretImpose(chemin, graine)) return { annonce: 6, soldes: 8, fermeture: 12, impose: true };
  return null;
}

/** Ilescu Chauffage part chez Calorive une fois sur deux si l'on ne s'aligne pas, tant que la gamme vit. */
export const ilescuPart = (chemin: readonly number[], graine: number) => {
  const arret = calendrierDArret(chemin, graine);
  return (
    chemin[D.calorive] === 2 &&
    (!arret || arret.annonce > SEMAINE_ILESCU) &&
    hasard(graine).uIlescu < CHANCE_ILESCU
  );
};

/** Orvalis cofinance la moitié du mobilier une fois sur deux. */
export const orvalisCofinance = (graine: number) => hasard(graine).uOrvalis < 0.5;

/** La matinée chauffagistes n'a lieu que si la gamme est encore là en semaine 9. */
export const matineeALieu = (chemin: readonly number[], graine: number) => {
  const arret = calendrierDArret(chemin, graine);
  return chemin[D.operation] === 2 && !arret;
};

export type Semaine = {
  /** Le chiffre d'affaires de l'agence dans la semaine. */
  ca: number;
  /** La marge sur coût variable de l'agence dans la semaine. */
  mcv: number;
  /** Le résultat de la semaine : marge sur coût variable, moins tous les coûts fixes et ponctuels. */
  resultat: number;
  /** Le résultat cumulé depuis le début du trimestre. */
  cumul: number;
  /** Le taux de marge sur coût variable de l'agence, à date. */
  tauxMcv: number;
  /** La marge sur coûts spécifiques de la plomberie-chauffage, à date. */
  mcsPc: number;
  /** Son résultat en coût complet, à date, tel que le tableau de la direction le montre. */
  pcComplet: number;
  /** La marge sur coûts spécifiques du corner peinture, à date. */
  mcsPeinture: number;
  /** Les achats des chauffagistes en outillage et quincaillerie dans la semaine. */
  liees: number;
  /** La présence des chauffagistes : 1, comme au trimestre dernier. */
  presence: number;
  /** Le chiffre d'affaires de la plomberie-chauffage dans la semaine. */
  caPc: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le résultat de l'agence en écart à son budget : positif, au-dessus. */
  objectif: number;
  resultat: number;
  ca: number;
  tauxMcv: number;
  mcsPc: number;
  pcComplet: number;
  mcsPeinture: number;
  /** Ce que les chauffagistes ont acheté dans les autres rayons, rapporté au trimestre dernier. */
  lieesRapport: number;
  arret: Arret | null;
  ilescuPart: boolean;
  orvalisCofinance: boolean;
  matinee: boolean;
  presenceFinale: number;
  /** La marge sur coûts spécifiques de la plomberie-chauffage au trimestre dernier : la prévision. */
  mcsPcReference: number;
}

const parSemaine = (x: number) => x / SEMAINES;
/** Les ventes d'outillage et de quincaillerie d'une semaine ordinaire, au hasard de la semaine. */
const baseLiees = (n: Bruit) =>
  parSemaine(REFERENCE.out.ca) * n.out + parSemaine(QUINCAILLERIE.ca) * n.qf;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const arret = calendrierDArret(chemin, graine);
  const ilescu = ilescuPart(chemin, graine);
  const cofinance = orvalisCofinance(graine);
  const matinee = matineeALieu(chemin, graine);
  const cvPc = REFERENCE.pc.cv / REFERENCE.pc.ca;
  const cvGo = REFERENCE.go.cv / REFERENCE.go.ca;
  const cvOut = REFERENCE.out.cv / REFERENCE.out.ca;
  const cvQ = QUINCAILLERIE.cv / QUINCAILLERIE.ca;
  const cvP = PEINTURE.cv / PEINTURE.ca;
  // Sans s'aligner, les chaudières se vendent chez Calorive ; plus encore si l'on a augmenté.
  const perteComparee = Math.min(0.8, h.perteComparee * (d1 === 2 ? 1.5 : 1));

  const semaines: (Semaine | null)[] = [null];
  let presence = 1;
  let peintres = 1;
  let comparees = 1;
  let cumul = 0;
  let caCumul = 0;
  let mcvCumul = 0;
  let mcsPc = 0;
  let caPcCumul = 0;
  let communesCumul = 0;
  let mcsPeinture = 0;
  let lieesCumul = 0;
  let lieesReference = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const vol = (g: Gamme) => actifs.reduce((x, a) => x * (a.imprevu.effet.volume?.[g] ?? 1), 1);
    let ponctuel = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    for (const a of actifs) if (a.semaine === w) ponctuel += a.imprevu.effet.cout ?? 0;

    const ouverte = !arret || w < arret.fermeture;
    const enArret = !!arret && w >= arret.annonce;
    const enSoldes = !!arret && w >= arret.soldes && w < arret.fermeture;

    // La présence des chauffagistes : ce qui les retient, ce qui les fait partir.
    let cible = 1;
    if (enArret) cible = ouverte ? PRESENCE_PENDANT_ARRET : PRESENCE_APRES_ARRET;
    if (d1 === 2 && w >= 2) cible *= 1 - h.elasticite;
    if (d3 === 2 && w >= DEBUT_CALORIVE) cible *= 1 - 0.3 * perteComparee;
    if (ilescu && w >= SEMAINE_ILESCU) cible *= 1 - PART_ILESCU;
    if (d4 === 0 && w >= 8) cible *= 1 - h.perteVendeur;
    if (d4 === 2 && w >= 8) cible *= 1 - 0.4 * h.perteVendeur;
    if (d4 === 1 && w >= 7 && ouverte) {
      // Les visites de chantier de Lilian : bien plus fructueuses quand Amara tient le comptoir.
      cible *= 1 + (d2 === 1 ? 0.07 : 0.025) * (0.4 + 1.2 * h.uVisites);
    }
    if (matinee && w >= 9) cible *= 1 + 0.3 * h.affluence * (d3 === 2 ? 0.5 : 1);
    presence += INERTIE * (cible - presence);

    // Les chaudières et pompes à chaleur comparées : ce qu'on perd sans s'aligner.
    const cibleComparees = d3 === 2 && w >= DEBUT_CALORIVE ? 1 - perteComparee : 1;
    comparees += INERTIE * (cibleComparees - comparees);

    // La plomberie-chauffage.
    let caPc = 0;
    let mcvPc = 0;
    if (ouverte) {
      let prixC = d1 === 2 && w >= 2 ? 1 + HAUSSE_PC : 1;
      let prixR = prixC;
      let volR = 1;
      if (w >= DEBUT_CALORIVE && d3 === 0) prixC = 1 - BAISSE_CALORIVE;
      if (w >= DEBUT_CALORIVE && d3 === 1) {
        prixC = 1 - BAISSE_CALORIVE;
        prixR = 1 - BAISSE_CALORIVE;
        volR = 1.04;
      }
      let boost = vol("pc");
      if (enSoldes) {
        prixC *= 1 - SOLDES.remise;
        prixR *= 1 - SOLDES.remise;
        boost *= SOLDES.volume;
      }
      // Amara au comptoir plomberie : Lilian chiffre plus de chaudières.
      if (d2 === 1 && w >= 4) boost *= 1.03;
      if (matinee && w === 9) boost *= 1 + 0.6 * h.affluence * (d3 === 2 ? 0.5 : 1);
      if (d6 === 1 && w >= 12) boost *= 1 + 0.1 * h.transformation;
      const base = parSemaine(REFERENCE.pc.ca) * n.pc * presence * boost;
      const c = base * PART_COMPAREE * comparees;
      const reste = base * (1 - PART_COMPAREE) * volR;
      caPc = c * prixC + reste * prixR;
      mcvPc = c * (prixC - cvPc) + reste * (prixR - cvPc);
    }

    // Le gros œuvre.
    let prixGo = 1;
    let volGo = vol("go");
    if (d5 === 0 && w >= 9 && w <= 11) {
      prixGo = 0.96;
      volGo *= 1.12;
    }
    if (d6 === 0 && w >= 12) {
      prixGo = 0.92;
      volGo *= 1 + h.volumeRemise;
    }
    if (d6 === 1 && w >= 12) volGo *= 1 + 0.03 * h.transformation;
    const coutGo = cvGo + actifs.reduce((s, a) => s + (a.imprevu.effet.coutGo ?? 0), 0);
    const baseGo = parSemaine(REFERENCE.go.ca) * n.go * volGo;
    const caGo = baseGo * prixGo;
    const mcvGo = baseGo * (prixGo - coutGo);

    // Les ventes liées : la part des autres rayons qui suit les chauffagistes.
    const liees = 1 - h.lie * (1 - presence);
    const lieesP = 1 - h.liePeintres * (1 - peintres);

    // L'outillage.
    let prixOut = 1;
    let volOut = vol("out") * liees;
    if (d5 === 1 && w >= 9) volOut *= 1.1;
    if (d6 === 2 && w >= 12) {
      prixOut = 0.9;
      volOut *= 1.2;
    }
    const baseOut = parSemaine(REFERENCE.out.ca) * n.out * volOut;
    const caOut = baseOut * prixOut;
    const mcvOut = baseOut * (prixOut - cvOut);

    // La quincaillerie, hors peinture.
    let prixQ = 1;
    let volQ = vol("qf") * liees * lieesP;
    if (d6 === 2 && w >= 12) {
      prixQ = 0.9;
      volQ *= 1.2;
    }
    const baseQ = parSemaine(QUINCAILLERIE.ca) * n.qf * volQ;
    const caQ = baseQ * prixQ;
    const mcvQ = baseQ * (prixQ - cvQ);

    // Le corner peinture : fermé, réorganisé, relancé, ou laissé tel quel.
    let prixP = 1;
    let volP = vol("qf");
    let csPeinture = parSemaine(somme(SPECIFIQUES_PEINTURE));
    const ferme = d2 === 0 && w >= 5;
    if (d2 === 0 && w >= 3 && w <= 4) {
      prixP = 0.8;
      volP *= 1.6;
    }
    if (ferme) {
      // Le corner fermé ne garde que la machine, le temps du préavis ; Amara passe au comptoir.
      volP = 0;
      csPeinture = w >= 7 ? 0 : parSemaine(SPECIFIQUES_PEINTURE.machine);
    }
    if (d2 === 1 && w >= 4) {
      volP *= 1 - h.perteReorganisation;
      const s = SPECIFIQUES_PEINTURE;
      // Amara passe la moitié de son temps au comptoir plomberie : son coût change de gamme.
      csPeinture = parSemaine(
        s.vendeuse / 2 +
          s.machine +
          s.detention / 2 +
          (s.demarque * 3) / 10 +
          s.animation / 2 +
          s.presentoirs / 2,
      );
    }
    if (d2 === 2 && w >= 4) {
      prixP = 0.85;
      volP *= 1 + h.gainRelance;
    }
    peintres += INERTIE * ((ferme ? 0 : 1) - peintres);
    const baseP = parSemaine(PEINTURE.ca) * n.qf * volP;
    const caP = baseP * prixP;
    const mcvP = baseP * (prixP - cvP);
    if (d2 === 2 && w === 4) {
      ponctuel += COUTS.animationRelance + (cofinance ? COUTS.mobilier / 2 : COUTS.mobilier);
    }

    // Les coûts spécifiques : ceux de la plomberie-chauffage, puis ceux des autres gammes.
    let csPc = parSemaine(REFERENCE.pc.cs);
    if (!ouverte) csPc -= parSemaine(EVITABLES_PC);
    if (d4 === 0 && w >= 8) csPc -= parSemaine(SPECIFIQUES_PC.vendeur);
    if (d4 === 2 && w >= 8) csPc -= 0.4 * parSemaine(SPECIFIQUES_PC.vendeur);
    if (d2 === 1 && w >= 4) csPc += parSemaine(SPECIFIQUES_PEINTURE.vendeuse / 2);
    if (d4 === 1 && w >= 7 && ouverte) ponctuel += COUTS.visites / 7;
    const csAutres = parSemaine(REFERENCE.go.cs + REFERENCE.out.cs + QUINCAILLERIE.cs);

    // Les charges communes : seul l'intérim du comptoir disparaît, quand Amara le remplace.
    let communes = parSemaine(TOTAL_COMMUNES);
    if (ferme) communes += parSemaine(SPECIFIQUES_PEINTURE.vendeuse - INTERIM_COMPTOIR);

    // Les opérations commerciales.
    if (w === 9) {
      if (d5 === 0) ponctuel += COUTS.prospectus;
      if (d5 === 1) ponctuel += COUTS.teteDeGondole;
      if (matinee) ponctuel += COUTS.matinee;
    }

    const ca = caPc + caGo + caOut + caQ + caP;
    const marge = mcvPc + mcvGo + mcvOut + mcvQ + mcvP;
    const resultat = marge - csPc - csPeinture - csAutres - communes - ponctuel;
    cumul += resultat;
    caCumul += ca;
    mcvCumul += marge;
    mcsPc += mcvPc - csPc;
    caPcCumul += caPc;
    communesCumul += communes;
    mcsPeinture += mcvP - csPeinture;
    // Ce que les chauffagistes achètent en outillage et en quincaillerie, hors opérations.
    const lieesSemaine = h.lie * presence * baseLiees(n);
    lieesCumul += lieesSemaine;
    lieesReference += h.lie * baseLiees(n);

    semaines.push({
      ca,
      mcv: marge,
      resultat,
      cumul,
      tauxMcv: mcvCumul / caCumul,
      mcsPc,
      pcComplet: mcsPc - (communesCumul * caPcCumul) / caCumul,
      mcsPeinture,
      liees: lieesSemaine,
      presence,
      caPc,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: cumul - BUDGET,
    resultat: cumul,
    ca: caCumul,
    tauxMcv: fin.tauxMcv,
    mcsPc: fin.mcsPc,
    pcComplet: fin.pcComplet,
    mcsPeinture: fin.mcsPeinture,
    lieesRapport: lieesCumul / lieesReference,
    arret,
    ilescuPart: ilescu,
    orvalisCofinance: cofinance,
    matinee,
    presenceFinale: presence,
    mcsPcReference: margeSurCoutsSpecifiques("pc"),
  };
}

/** Ce qui s'est passé pendant des semaines : arrêt de la gamme, Ilescu, matinée, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    arretImpose: !!t.arret?.impose && dans(5),
    directionAttend: chemin[D.gamme] === 3 && !t.arret && dans(5),
    soldes: !!t.arret && dans(t.arret.soldes),
    fermeture: !!t.arret && dans(t.arret.fermeture),
    ilescuPart: t.ilescuPart && dans(SEMAINE_ILESCU),
    matinee: t.matinee && dans(9),
    lilianPart: chemin[D.vendeur] === 0 && dans(8),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureGammes {
  resultat: number | null;
  tauxMcv: number | null;
  mcsPc: number | null;
  pcComplet: number | null;
  liees: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  presence: number | null;
  mcsPeinture: number | null;
  caPc: number | null;
  arret: number | null;
}

/**
 * Ce que Matthias lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». Au lundi de la semaine 1, rien n'est encore
 * cumulé : on montre le trimestre dernier.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureGammes {
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      resultat: null,
      tauxMcv: (CA_TOTAL - GAMMES.reduce((s, g) => s + REFERENCE[g].cv, 0)) / CA_TOTAL,
      mcsPc: null,
      pcComplet: null,
      liees: h.lie * parSemaine(REFERENCE.out.ca + QUINCAILLERIE.ca),
      budgetADate: 0,
      presence: 1,
      mcsPeinture: null,
      caPc: parSemaine(REFERENCE.pc.ca),
      arret: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    resultat: s.cumul,
    tauxMcv: s.tauxMcv,
    mcsPc: s.mcsPc,
    pcComplet: s.pcComplet,
    liees: s.liees,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    presence: s.presence,
    mcsPeinture: s.mcsPeinture,
    caPc: s.caPc,
    arret: t.arret && semaine >= 5 ? 1 : 0,
  };
}
