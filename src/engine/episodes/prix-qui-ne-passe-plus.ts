/**
 * LE PRIX QUI NE PASSE PLUS — le modèle de la politique tarifaire régionale.
 *
 * Les coûts d'achat ont monté de 6 % ; la marge s'érode ; les commerciaux
 * accordent de plus en plus de remises dérogatoires « pour ne pas perdre le
 * client » ; la direction demande une hausse des prix de vente. Treize
 * semaines, six décisions. Trois mécanismes font l'épisode, et le joueur doit
 * les découvrir :
 *
 *   · TOUS LES PRIX NE SE COMPARENT PAS. Le gros œuvre (ciment, parpaings,
 *     plaque standard) se compare au centime, et au-delà d'un écart de trois
 *     points avec le concurrent les artisans vont voir ailleurs — et achètent
 *     le reste de leur chantier là où ils ont acheté le ciment. La technique
 *     et les services, personne ne les fait chiffrer. Une hausse uniforme fait
 *     partir ceux qui comparent et laisse de la marge sur la table ailleurs ;
 *     répercuter le coût famille par famille fait pire encore, parce que c'est
 *     le gros œuvre dont le coût a le plus monté.
 *   · LA HAUSSE FUIT PAR LES DÉROGATIONS. Une hausse que les clients contestent
 *     et que les commerciaux ne savent pas expliquer leur revient en remises,
 *     accordées surtout là où personne ne compare. Sans règle, la dérive
 *     continue semaine après semaine ; interdire toute dérogation fait partir
 *     les clients qui avaient vraiment un devis concurrent. Encadrer — des
 *     niveaux de délégation, un motif, un devis — garde les justifiées et
 *     coupe les autres.
 *   · UNE HAUSSE S'ACCOMPAGNE. Des commerciaux qui savent dire pourquoi, et
 *     proposer une alternative, perdent moins de clients et cèdent moins de
 *     remises ; un grand compte les écoute d'autant mieux.
 *
 * Le hasard, lui, décide si Altinéo, le concurrent d'en face, lance une
 * opération sur le gros œuvre — plus souvent quand on lui en a donné
 * l'occasion — et comment réagit Garon Bâtiment, le plus gros client de la
 * région.
 *
 * Le trimestre est jugé sur la marge commerciale de la région, frais des
 * actions compris, en écart au budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le chiffre d'affaires hebdomadaire de la région, au tarif d'avant la hausse, par famille. */
export const CA = { base: 85000, technique: 72000, services: 23000 } as const;
/** Le coût d'un euro vendu au tarif d'avant la hausse, AVANT la hausse des coûts. */
export const COUT_UNITAIRE = {
  base: 0.78,
  technique: 0.64,
  services: 0.52,
} as const;
/** Ce que les coûts ont pris, famille par famille : 6 % en moyenne. */
export const HAUSSE_COUTS = {
  base: 0.075,
  technique: 0.045,
  services: 0.04,
} as const;
/** Les remises dérogatoires, en part du chiffre d'affaires au tarif. */
export const REMISES_DEPART = 0.034;
export const REMISES_AN_DERNIER = 0.015;
/** Le plafond que la région Alpes tient avec sa grille de délégation. */
export const PLAFOND_REMISES = 0.02;
/** Ce qu'Altinéo a annoncé sur le gros œuvre, à partir de la semaine 3. */
export const HAUSSE_ALTINEO = 0.02;
/** La marge commerciale budgétée pour le trimestre, révisée après la hausse des coûts. */
export const BUDGET = 650000;
export const OBJECTIF_TAUX = 0.28;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, le tarif part plus tard et les remises continuent. */
export const PERTE_PAR_JOUR = 1500;
/** Garon Bâtiment : ses achats hebdomadaires au tarif, gros œuvre et technique. */
export const GARON = { base: 9600, technique: 6400 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  hausse: 0,
  derogations: 1,
  commerciaux: 2,
  altineo: 3,
  garon: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [2, 2, 0, 2, 3, 2] as const;

/** La hausse des prix de vente, famille par famille, selon la décision de la semaine 1. */
export const HAUSSES: readonly {
  base: number;
  technique: number;
  services: number;
}[] = [
  { base: 0.06, technique: 0.06, services: 0.06 },
  { base: 0.02, technique: 0.09, services: 0.15 },
  { base: 0, technique: 0, services: 0 },
  { base: 0.075, technique: 0.045, services: 0.04 },
];

export const COUTS = {
  revue: 400,
  formation: 3000,
  courrier: 1500,
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
    /** Les volumes de toutes les familles. */
    volume?: number;
    /** Les volumes du gros œuvre seulement. */
    base?: number;
    /** La part de la hausse effectivement facturée. */
    tarif?: number;
    /** Le coût des services (carburant, chauffeurs). */
    services?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "pluie",
    titre: "Dix jours de pluie",
    de: "Direction régionale",
    role: "Région",
    texte:
      "Dix jours de pluie sans interruption : les chantiers de gros œuvre s'arrêtent, les artisans ne passent plus au comptoir.",
    duree: 1,
    effet: { volume: 0.86 },
  },
  {
    id: "ciment",
    titre: "Rupture chez le cimentier",
    de: "Pascale Héraud",
    role: "Achats, siège",
    texte:
      "Arrêt technique chez le cimentier : deux semaines de livraisons au compte-gouttes, et des agences en rupture sur le ciment.",
    duree: 2,
    effet: { base: 0.88 },
  },
  {
    id: "chantier",
    titre: "Un gros chantier de logements démarre",
    de: "Mamadou Kanté",
    role: "Directeur des ventes, région",
    texte:
      "Le chantier des deux cents logements de Vénissieux démarre : les maçons du secteur passent commande en même temps.",
    duree: 2,
    effet: { base: 1.1 },
  },
  {
    id: "logiciel",
    titre: "Le nouveau tarif mal chargé",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le fichier tarif ne s'est pas chargé dans deux agences : une semaine de factures à l'ancien prix, impossibles à reprendre.",
    duree: 1,
    effet: { tarif: 0.6 },
  },
  {
    id: "gazole",
    titre: "Flambée du gazole",
    de: "Aïcha Mesbah",
    role: "Responsable logistique, région",
    texte:
      "Le gazole a pris 14 centimes en dix jours : les tournées de livraison coûtent nettement plus cher, pour un prix inchangé.",
    duree: 2,
    effet: { services: 1.15 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  volume: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La sensibilité réelle des clients du gros œuvre au prix : 1 en moyenne. */
  elasticite: number;
  /** Altinéo lance-t-il son opération sur le gros œuvre ? */
  uAltineo: number;
  /** Comment Garon Bâtiment prend-il la réponse qu'on lui fait ? */
  uGaron: number;
  /** La direction accepte-t-elle de changer la prime des commerciaux ce trimestre ? */
  uPrime: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000033 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      volume: Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))),
    });
  }
  const elasticite = Math.min(1.4, Math.max(0.6, 1 + 0.25 * gauss(r)));
  const uAltineo = r();
  const uGaron = r();
  const uPrime = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, elasticite, uAltineo, uGaron, uPrime, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * ALTINÉO LANCE-T-IL UNE OPÉRATION SUR LE GROS ŒUVRE ?
 *
 * Il en parle depuis des mois ; il la lance d'autant plus volontiers qu'on lui
 * a ouvert la porte en augmentant le gros œuvre au-dessus de lui. Une hausse
 * différenciée, qui reste alignée sur les références d'appel, ne lui donne
 * pas d'argument.
 */
export function chanceOperation(chemin: readonly number[]): number {
  const h = HAUSSES[chemin[D.hausse] ?? 2]!.base;
  return h >= 0.07 ? 0.75 : h >= 0.05 ? 0.65 : h > 0 ? 0.4 : 0.3;
}
export const operationAltineo = (chemin: readonly number[], graine: number) =>
  hasard(graine).uAltineo < chanceOperation(chemin);

/**
 * GARON BÂTIMENT ACCEPTE-T-IL UN PRIX FERME CONTRE UN ENGAGEMENT ?
 *
 * Son acheteur conteste le gros œuvre, qu'il fait chiffrer chez Altinéo ; il
 * n'a jamais fait chiffrer la technique. Le rendez-vous marche d'autant mieux
 * que la hausse du gros œuvre est restée mesurée, et que son commercial sait
 * expliquer la hausse et proposer une alternative.
 */
export function chanceAccord(chemin: readonly number[]): number {
  if (chemin[D.garon] !== 1) return 0;
  const forme = chemin[D.commerciaux] === 1 ? 0.3 : chemin[D.commerciaux] === 3 ? 0.1 : 0;
  const mesure = HAUSSES[chemin[D.hausse] ?? 2]!.base <= 0.02 ? 0.2 : 0;
  return Math.min(0.92, 0.4 + forme + mesure);
}

/** Refusé net, Garon met une partie de ses achats en concurrence d'autant plus que le gros œuvre a monté. */
export function risqueRefus(chemin: readonly number[]): number {
  if (chemin[D.garon] !== 2) return 0;
  const h = HAUSSES[chemin[D.hausse] ?? 2]!.base;
  return Math.min(0.7, 0.3 + 4 * Math.max(0, h - 0.02));
}

export type IssueGaron = "accord" | "partiel" | "garde" | "cede" | "remise";

export function issueGaron(chemin: readonly number[], graine: number): IssueGaron {
  const u = hasard(graine).uGaron;
  switch (chemin[D.garon]) {
    case 0:
      return "cede";
    case 1:
      return u < chanceAccord(chemin) ? "accord" : "partiel";
    case 2:
      return u < risqueRefus(chemin) ? "partiel" : "garde";
    default:
      return "remise";
  }
}

/** Une fois sur deux, la direction accepte de passer la prime des commerciaux sur la marge dès le mois prochain. */
export const CHANCE_PRIME = 0.5;
export const primeAcceptee = (chemin: readonly number[], graine: number) =>
  chemin[D.derogations] === 3 && hasard(graine).uPrime < CHANCE_PRIME;

export type Semaine = {
  /** Taux de marge commerciale de la semaine, sur le chiffre d'affaires net. */
  tauxMarge: number;
  /** Remises dérogatoires de la semaine, en part du chiffre d'affaires au tarif. */
  remises: number;
  /** Volumes du gros œuvre, rapportés à ceux d'avant la hausse. */
  volumeBase: number;
  /** La hausse de prix réellement encaissée, remises comprises, par rapport à avant. */
  hausseNette: number;
  /** Chiffre d'affaires net de la semaine. */
  ca: number;
  /** Marge commerciale de la semaine, frais des actions déduits. */
  marge: number;
  /** Ce que la semaine a coûté hors marge : actions, attente, gestes au grand compte. */
  cout: number;
  /** La marge cumulée depuis le début du trimestre. */
  cumul: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge commerciale du trimestre, frais compris, en écart au budget : positif, la région fait mieux. */
  objectif: number;
  marge: number;
  ca: number;
  operation: boolean;
  garon: IssueGaron;
  primeProposee: boolean;
  primeAcceptee: boolean;
  tauxMoyen: number;
  remisesFinales: number;
  volumeBaseMoyen: number;
  hausseNetteMoyenne: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const hausse = HAUSSES[d1 ?? 2]!;
  const operation = operationAltineo(chemin, graine);
  const garon = issueGaron(chemin, graine);
  const prime = primeAcceptee(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const cout = {
    base: COUT_UNITAIRE.base * (1 + HAUSSE_COUTS.base),
    technique: COUT_UNITAIRE.technique * (1 + HAUSSE_COUTS.technique),
    services: COUT_UNITAIRE.services * (1 + HAUSSE_COUTS.services),
  };
  let remises = REMISES_DEPART;
  let vb = 1;
  let vt = 1;
  let vs = 1;
  let cumul = 0;
  let ca = 0;
  let somme = { taux: 0, base: 0, nette: 0 };
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = (k: keyof Imprevu["effet"]) =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[k] ?? 1), 1);

    // Les prix de la semaine : la hausse part en semaine 2.
    const facturee = effet("tarif");
    let hb = w >= 2 ? hausse.base * facturee : 0;
    const ht = w >= 2 ? hausse.technique * facturee : 0;
    const hs = w >= 2 ? hausse.services * facturee : 0;
    if (d4 === 0 && w >= 8) hb -= 0.05; // L'alignement sur Altinéo, sur tout le gros œuvre.
    const concurrent = w >= 3 ? HAUSSE_ALTINEO : 0;

    // Ce que les clients font de la hausse : ceux qui comparent partent, avec retard.
    const ecart = hb - concurrent;
    let perteBase =
      h.elasticite * (2 * Math.max(0, ecart) + 4 * Math.max(0, ecart - 0.03)) - Math.max(0, -ecart);
    let perteTech = 0.5 * ht;
    let perteServ = 0.3 * hs + Math.max(0, hs - 0.15);
    // Des commerciaux qui savent expliquer la hausse perdent moins de clients.
    let accompagnement = 1;
    if (w >= 6) accompagnement = [0.95, 0.55, 1, 0.85][d3 ?? 0]!;
    if (prime && w >= 9) accompagnement *= 0.9;
    perteBase = perteBase > 0 ? perteBase * accompagnement : perteBase;
    perteTech *= accompagnement;
    perteServ *= accompagnement;
    // Interdire toute dérogation : les clients qui avaient un vrai devis concurrent partent.
    if (d2 === 0 && w >= 4) {
      perteBase += 0.07;
      perteTech += 0.03;
    }
    // Au-delà d'un tiers des volumes, ce ne sont plus des clients qui partent, c'est l'agence qui ferme.
    perteBase = Math.min(0.3, perteBase);
    // Ceux qui achètent leur gros œuvre ailleurs y achètent aussi une partie du reste.
    const croise = 0.3 * Math.max(0, perteBase);
    // L'objectif de volume : les commerciaux vont chercher des commandes, remise en main.
    // Il se trouve surtout sur le gros œuvre, le plus facile à vendre et le moins margé.
    const poussee = d3 === 2 && w >= 6 ? 1 : 0;
    vb += 0.5 * (1 - perteBase + 0.03 * poussee - vb);
    vt += 0.5 * (1 - perteTech - croise + 0.005 * poussee - vt);
    vs += 0.5 * (1 - perteServ - croise - vs);

    // L'opération d'Altinéo sur les références d'appel, en semaines 9 à 11.
    let promo = 0;
    if (operation && w >= 9) {
      const pendant = w <= 11;
      // Sans riposte, un client sur cinq va voir ; une partie ne revient pas,
      // et ceux qui restent chez Altinéo y prennent aussi leur technique.
      if (d4 === 2) promo = pendant ? 0.25 : 0.22;
      // La riposte au devis arrive après coup : la première semaine est perdue.
      if (d4 === 1) promo = w === 9 ? 0.18 : pendant ? 0.07 : 0.055;
      if (d4 === 3) promo = 0;
      if (d4 === 0) promo = pendant ? 0.02 : 0;
    }

    // Les volumes de la semaine ; la remise de fin de trimestre en attire un peu plus.
    const tous = n.volume * effet("volume") * (d6 === 0 && w >= 12 ? 1.05 : 1);
    const qb = vb * tous * effet("base") * (1 - promo);
    const qt = vt * tous * (1 - (d4 === 2 ? 0.6 : 0.3) * promo);
    const qs = vs * tous;
    const pb = 1 + hb;
    const pt = 1 + ht;
    const ps = 1 + hs;
    // Les services qu'on offrait sans le savoir, facturés en fin de trimestre.
    const factures = d6 === 1 && w >= 12 ? 2800 : 0;
    const tarif = CA.base * qb * pb + CA.technique * qt * pt + CA.services * qs * ps + factures;
    const achats =
      CA.base * qb * cout.base +
      CA.technique * qt * cout.technique +
      CA.services * qs * cout.services * effet("services") +
      (factures ? 300 : 0);

    // Les remises dérogatoires : la dérive, et ce qui la freine.
    let brute = 0.036 + (w >= 2 ? [0.015, 0.005, 0.001, 0.016][d1 ?? 2]! : 0);
    if (w >= 6) brute += [0, -0.006, 0.002, -0.002][d3 ?? 0]!;
    if (w >= 6 && d3 === 1) brute -= 0.5 * ([0.015, 0.005, 0.001, 0.016][d1 ?? 2] ?? 0);
    if (w >= 11 && d5 === 0) brute += 0.005; // Les autres grands comptes ont appris la nouvelle.
    if (w >= 11 && d5 === 3) brute += 0.003;
    let cible = brute;
    if (w >= 4) {
      if (d2 === 0) cible = 0.009;
      if (d2 === 1) cible = 0.017 + 0.2 * Math.max(0, brute - 0.036);
      if (d2 === 3 && prime && w >= 9) cible = 0.02 + 0.3 * Math.max(0, brute - 0.036);
      // L'objectif de volume s'achète en remises, jusqu'au plafond de chaque délégation.
      if (d2 !== 0 && d3 === 2 && w >= 6) cible += 0.006;
    }
    if (d6 === 3 && w >= 12) cible = Math.min(cible, 0.015 + 0.4 * Math.max(0, cible - 0.015));
    remises += (w === 12 && d6 === 3 ? 0.7 : 0.35) * (cible - remises);
    remises = borne(remises, 0.005, 0.09);
    let gestes = remises * tarif;

    // Les ripostes à Altinéo, et ce qu'elles coûtent.
    if (d4 === 1) {
      if (operation && w >= 9 && w <= 11) {
        gestes += 0.4 * 0.5 * 0.06 * CA.base * qb * (w === 9 ? 0.5 : 1);
      }
    }
    if (d4 === 3 && w >= 8) {
      // Les clients garantis font chiffrer partout pour faire jouer la garantie.
      gestes += 920;
      if (operation && w >= 9 && w <= 11) gestes += 0.4 * 0.5 * 0.06 * CA.base * qb;
    }

    // Garon Bâtiment, à partir de la semaine 10.
    let garonPerdu = 0;
    if (w >= 10) {
      const margeGaron = GARON.base * (pb - cout.base) + GARON.technique * (pt - cout.technique);
      // Lui accorder ce qu'il demande : ses anciens prix, et au moins 3 % sur tout.
      if (garon === "cede") {
        gestes += GARON.base * Math.max(0.03, hb) + GARON.technique * Math.max(0.03, ht);
      }
      if (garon === "remise") gestes += 0.06 * (GARON.base * pb + GARON.technique * pt);
      // Le prix ferme sur le gros œuvre, contre 10 % d'achats en plus.
      if (garon === "accord") gestes += GARON.base * Math.max(0, hb) - 0.1 * margeGaron;
      if (garon === "partiel" && w >= 11) garonPerdu = (d5 === 1 ? 0.5 : 0.6) * margeGaron;
    }

    // La remise de fin de trimestre : 3 % sur tout.
    if (d6 === 0 && w >= 12) gestes += 0.03 * tarif;

    const caNet = tarif - gestes;
    const margeBrute = tarif - achats - gestes - garonPerdu;
    let frais = w === 1 ? perte : 0;
    if (d2 === 1 && w >= 4) frais += COUTS.revue;
    if (d3 === 1 && w === 6) frais += COUTS.formation;
    if (d3 === 3 && w === 6) frais += COUTS.courrier;
    const marge = margeBrute - frais;
    cumul += marge;
    ca += caNet;
    const volumeAvant = CA.base * qb + CA.technique * qt + CA.services * qs;
    const hausseNette = caNet / volumeAvant / (1 - REMISES_DEPART) - 1;
    const tauxMarge = margeBrute / caNet;
    somme = {
      taux: somme.taux + tauxMarge,
      base: somme.base + qb,
      nette: somme.nette + hausseNette,
    };

    semaines.push({
      tauxMarge,
      remises,
      volumeBase: qb,
      hausseNette,
      ca: caNet,
      marge,
      cout: frais + garonPerdu,
      cumul,
    });
  }

  return {
    semaines,
    objectif: cumul - BUDGET,
    marge: cumul,
    ca,
    operation,
    garon,
    primeProposee: d2 === 3,
    primeAcceptee: prime,
    tauxMoyen: somme.taux / SEMAINES,
    remisesFinales: remises,
    volumeBaseMoyen: somme.base / SEMAINES,
    hausseNetteMoyenne: somme.nette / SEMAINES,
  };
}

/** Ce qui s'est passé pendant des semaines : l'opération d'Altinéo, Garon, la prime, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    operation: t.operation && dans(9),
    pasDOperation: !t.operation && dans(9),
    garon: dans(10) ? t.garon : null,
    garonPart: t.garon === "partiel" && dans(11),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePrix {
  tauxMarge: number | null;
  remises: number | null;
  volumeBase: number | null;
  hausseNette: number | null;
  cumul: number | null;
  budgetADate: number | null;
  /** La hausse affichée au tarif, en moyenne pondérée : pour comparer à la hausse nette. */
  hausseAffichee: number | null;
}

/** La hausse affichée au tarif, pondérée par le chiffre d'affaires des familles. */
export function hausseAffichee(d1: number): number {
  const h = HAUSSES[d1]!;
  const total = CA.base + CA.technique + CA.services;
  return (CA.base * h.base + CA.technique * h.technique + CA.services * h.services) / total;
}

/** Ce que Malik lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePrix {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      tauxMarge: 0.242,
      remises: REMISES_DEPART,
      volumeBase: 1,
      hausseNette: 0,
      cumul: 0,
      budgetADate: 0,
      hausseAffichee: decisions[D.hausse] === undefined ? 0 : hausseAffichee(chemin[D.hausse]!),
    };
  }
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    tauxMarge: s.tauxMarge,
    remises: s.remises,
    volumeBase: s.volumeBase,
    hausseNette: s.hausseNette,
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    hausseAffichee: semaine >= 2 ? hausseAffichee(chemin[D.hausse]!) : 0,
  };
}
