/**
 * RECONSTRUIRE OU REGROUPER — le modèle des EHPAD d'Auxonne et de Montbard.
 *
 * L'Association Solvanne gère six EHPAD en Côte-d'Or et en Saône-et-Loire.
 * Deux d'entre eux sont vétustes : Auxonne (64 places) et Montbard (70
 * places), des années 1970, avec des chambres doubles, sans pièce
 * rafraîchie, et une mise aux normes incendie exigée par la commission de
 * sécurité. Trois voies sont sur la table du conseil d'administration :
 * rénover les deux sur place, construire un EHPAD neuf de 134 places à
 * Is-sur-Tille et fermer les deux, ou reconstruire Montbard et transformer
 * Auxonne en pôle de proximité (chambres individuelles, hébergement
 * temporaire, accueil de jour). Le trimestre va de septembre à novembre :
 * le dossier d'aide à l'investissement se dépose fin octobre (semaine 9),
 * le projet de schéma départemental de l'autonomie paraît en semaine 10,
 * l'ARS et le département se prononcent sur les aides en semaine 12.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Un EHPAD se reconstruit pour quarante ans,
 * l'épisode dure un trimestre. Le trimestre est jugé sur la VALEUR CRÉÉE
 * ESTIMÉE en semaine 13 pour l'association : la VAN, au taux de 4 % retenu
 * par le conseil, sur vingt ans, des flux DIFFÉRENTIELS de la voie choisie
 * par rapport à aujourd'hui, c'est-à-dire de ce que l'association garde ou
 * perd, et non de ce que les résidents paient :
 *
 *   · la marge des journées d'hébergement gagnées ou perdues (52 € par
 *     journée : le prix de journée moins les repas, le linge et les produits
 *     qui suivent la présence), selon l'occupation que chaque bâtiment
 *     attire dans le scénario démographique du territoire, et selon le prix
 *     que les familles paieront ;
 *   · les économies qui ne passent pas par le prix de journée (une
 *     organisation des soins de plain-pied, une équipe de nuit au lieu de
 *     deux) et la marge de l'accueil de jour ;
 *   · le DÉFICIT D'HÉBERGEMENT : la part des amortissements et des frais
 *     financiers que le département ne laisse pas entrer dans le prix de
 *     journée ;
 *   · moins ce qui est perdu en route : places gelées pendant les travaux,
 *     dépassements que le plan validé ne couvre pas, recrutements et
 *     transferts, études, honoraires perdus ; et ce que le trimestre lui-même
 *     a coûté (étude de besoins, imprévus, enquête trop longue).
 *
 * Elle est recalculée chaque semaine avec ce que le trimestre a révélé :
 * l'étude de besoins (semaine 6) ou le schéma départemental (semaine 10),
 * les diagnostics de la rénovation (semaine 7), la position des élus sur le
 * transfert des autorisations (semaine 8), les sondages du terrain
 * (semaine 10), la décision sur les aides (semaine 12). Ce qui n'est pas
 * encore su est compté en espérance. Ne rien faire coûte : les chambres
 * doubles se vident, et le problème revient plus cher au prochain CPOM.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE PRIX DE JOURNÉE PORTE L'INVESTISSEMENT. En EHPAD, le résident (ou
 *     l'aide sociale) paie l'immobilier : la hausse du prix de journée
 *     hébergement vaut les amortissements et les frais financiers de
 *     l'opération, moins les charges qui disparaissent avec l'ancien
 *     bâtiment et les économies d'exploitation, rapportés aux journées à
 *     97 % d'occupation. Le département plafonne cette hausse à 10 € par
 *     jour pour les places habilitées à l'aide sociale, avec un rattrapage
 *     de 1,50 € par an s'il est prévu au plan de financement et couvert par
 *     la réserve de compensation des charges d'amortissement. Au-delà,
 *     l'association creuse son déficit d'hébergement, ou sort des places de
 *     l'habilitation. Et chaque euro au-delà de 6 € coûte des admissions.
 *   · L'AIDE À L'INVESTISSEMENT. L'ARS et le département accordent ou non
 *     une aide (20 à 25 % du coût) selon la qualité du dossier : une voie
 *     qui garde l'offre de proximité, une étude de besoins, les élus et le
 *     conseil de la vie sociale associés, un programme ajusté au territoire,
 *     l'habilitation à l'aide sociale maintenue. Elle fait baisser la hausse.
 *   · LE TERRITOIRE. Trois scénarios démographiques — besoin de places en
 *     hausse (environ trois chances sur dix), stable (un peu moins d'une sur
 *     deux), développement du domicile (une sur quatre) — décident de qui
 *     remplira des chambres doubles rénovées ou un grand établissement
 *     éloigné des familles. Une étude de besoins le dit en semaine 6 ; le
 *     schéma départemental, à tous, en semaine 10, trop tard pour arrêter le
 *     programme du dossier d'aide.
 *   · LE MOINS CHER À CONSTRUIRE N'EST PAS LE MOINS CHER. La rénovation sur
 *     place, la seule voie sous le plafond, garde des chambres doubles,
 *     gèle des places pendant trente mois et dépasse souvent son budget ; le
 *     grand établissement neuf promet des économies d'échelle, mais il
 *     dépend d'élus qui refusent de voir partir leur EHPAD, et ses
 *     amortissements dépassent le plafond.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation retenu par le conseil d'administration. */
export const TAUX_ACTU = 0.04;
/** Le conseil juge les opérations immobilières sur vingt ans. */
export const HORIZON = 20;
/** L'année de mise en service d'un bâtiment neuf ou transformé. */
export const OUVERTURE = 3;
/** Le taux de l'offre de la Banque Saônelle, et celui qu'elle annonce si les taux montent. */
export const TAUX_EMPRUNT = 0.035;
export const TAUX_RELEVE = 0.038;
/** Le taux d'occupation sur lequel le département calcule le prix de journée. */
export const OCCUPATION_TARIF = 0.97;
/** Ce que rapporte une journée d'hébergement occupée, charges qui suivent la présence déduites. */
export const MARGE_JOURNEE = 52;
/** Le plafond de la hausse à la mise en service, et le rattrapage annuel prévu au plan. */
export const PLAFOND = 10;
export const RATTRAPAGE = 1.5;
/** La réserve de compensation des charges d'amortissement de l'association. */
export const RESERVE = 1200000;
/** Le département accepte un rattrapage sur cinq ans deux fois sur trois, sinon sur trois. */
export const LISSAGE = { long: 5, court: 3, chance: 0.65 } as const;
/** Au-delà de 6 € de hausse, chaque euro coûte des admissions : en part d'occupation, par scénario. */
export const SEUIL_ELASTICITE = 6;
export const ELASTICITE = [0.0015, 0.003, 0.0045] as const;
/** L'occupation des places sorties de l'habilitation, à prix libre, par scénario. */
export const OCCUPATION_LIBRE = [0.92, 0.82, 0.7] as const;
/** La part des places qu'on sortirait de l'habilitation à l'aide sociale. */
export const PART_LIBRE = 0.3;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le programmiste boucle le dossier du conseil, à la journée. */
export const PERTE_PAR_JOUR = 5000;
/** L'étude de besoins du territoire : son prix, et la semaine où elle conclut. */
export const ETUDE = { prix: 32000, semaine: 6 } as const;
/** La valeur que la direction générale attend de l'opération. */
export const OBJECTIF_VALEUR = 750000;

/** Les semaines où le trimestre révèle ce qu'il cache. */
export const REVELATIONS = {
  diagnostics: 7,
  elus: 8,
  depot: 9,
  schema: 10,
  sondages: 10,
  aides: 12,
  rumeur: 12,
} as const;

/** Les scénarios démographiques du territoire, et leurs chances. */
export const SCENARIOS = [
  { id: "besoin", nom: "besoin de places en hausse", chance: 0.3 },
  { id: "stable", nom: "besoin stable", chance: 0.45 },
  { id: "domicile", nom: "développement du domicile", chance: 0.25 },
] as const;
/** Les demandes d'admission par semaine, pour les deux EHPAD, selon le scénario. */
export const DEMANDES = [6.5, 5.5, 4.3] as const;
/** Le scénario dont la moyenne de demandes est la plus proche d'une moyenne observée. */
export const scenarioDesDemandes = (moyenne: number) => {
  const ecarts = DEMANDES.map((m) => Math.abs(m - moyenne));
  return ecarts.indexOf(Math.min(...ecarts));
};

export const ETABLISSEMENTS = {
  auxonne: { nom: "Auxonne", places: 64, occupation: 0.93, prix: 66.4 },
  montbard: { nom: "Montbard", places: 70, occupation: 0.92, prix: 64.9 },
} as const;
type Site = keyof typeof ETABLISSEMENTS;

/** Les journées occupées aujourd'hui dans un établissement. */
export const joursAujourdhui = (site: Site) =>
  ETABLISSEMENTS[site].places * 365 * ETABLISSEMENTS[site].occupation;

export interface Operation {
  id: string;
  nom: string;
  cout: number;
  fondsPropres: number;
  /** La durée moyenne d'amortissement, par composants. */
  duree: number;
  /** Les charges de l'ancien bâtiment qui disparaissent : amortissements qui s'achèvent, gros entretien. */
  disparait: number;
  /** Les économies d'exploitation de la section hébergement : énergie, entretien. */
  economies: number;
  /** Les places d'hébergement après l'opération. */
  places: number;
  /** Les établissements dont elle reprend les résidents. */
  sites: readonly Site[];
  /** L'occupation attendue après l'opération, par scénario. */
  occupation: readonly [number, number, number];
  /** Les flux hors prix de journée, par an et par scénario : organisation des soins, accueil de jour. */
  horsHebergement: readonly [number, number, number];
  /** Places gelées, transferts, recrutements : la perte de transition, en valeur actuelle. */
  transition: number;
  /** L'aide que l'ARS et le département peuvent accorder. */
  aide: number;
  /** La première année où l'occupation et le prix changent. */
  debut: number;
  /** Ce que l'arrivée d'Orchidia Résidences près de Montbard retire à l'occupation. */
  orchidia: number;
}

export const MONTBARD_NEUF: Operation = {
  id: "montbardNeuf",
  nom: "la reconstruction de Montbard",
  cout: 8750000,
  fondsPropres: 750000,
  duree: 35,
  disparait: 62000,
  economies: 28000,
  places: 70,
  sites: ["montbard"],
  occupation: [0.985, 0.975, 0.95],
  horsHebergement: [40000, 40000, 40000],
  transition: 0,
  aide: 2000000,
  debut: OUVERTURE,
  orchidia: 0.005,
};

export const AUXONNE_TRANSFORMEE: Operation = {
  id: "auxonneTransformee",
  nom: "la transformation d'Auxonne",
  cout: 3300000,
  fondsPropres: 300000,
  duree: 25,
  disparait: 0,
  economies: 38000,
  places: 64,
  sites: ["auxonne"],
  occupation: [0.975, 0.965, 0.945],
  horsHebergement: [5000, 15000, 35000],
  transition: 220000,
  aide: 600000,
  debut: OUVERTURE,
  orchidia: 0,
};

export const RENOVATION_AUXONNE: Operation = {
  id: "renovationAuxonne",
  nom: "la rénovation d'Auxonne",
  cout: 3400000,
  fondsPropres: 350000,
  duree: 25,
  disparait: 0,
  economies: 22000,
  places: 64,
  sites: ["auxonne"],
  occupation: [0.955, 0.935, 0.895],
  horsHebergement: [0, 0, 0],
  transition: 250000,
  aide: 350000,
  debut: OUVERTURE,
  orchidia: 0,
};

export const RENOVATION_MONTBARD: Operation = {
  id: "renovationMontbard",
  nom: "la rénovation de Montbard",
  cout: 3800000,
  fondsPropres: 400000,
  duree: 25,
  disparait: 0,
  economies: 24000,
  places: 70,
  sites: ["montbard"],
  occupation: [0.955, 0.935, 0.895],
  horsHebergement: [0, 0, 0],
  transition: 290000,
  aide: 350000,
  debut: OUVERTURE,
  orchidia: 0.012,
};

export const REGROUPEMENT: Operation = {
  id: "regroupement",
  nom: "l'EHPAD neuf d'Is-sur-Tille",
  cout: 17600000,
  fondsPropres: 1400000,
  duree: 35,
  disparait: 128000,
  economies: 230000,
  places: 134,
  sites: ["auxonne", "montbard"],
  occupation: [0.985, 0.96, 0.905],
  horsHebergement: [150000, 150000, 150000],
  transition: 820000,
  aide: 3000000,
  debut: OUVERTURE,
  orchidia: 0.005,
};

export const MISE_AUX_NORMES: Operation = {
  id: "miseAuxNormes",
  nom: "la mise aux normes incendie",
  cout: 1150000,
  fondsPropres: 150000,
  duree: 15,
  disparait: 0,
  economies: 0,
  places: 134,
  sites: ["auxonne", "montbard"],
  occupation: [0.93, 0.895, 0.84],
  horsHebergement: [0, 0, 0],
  transition: 0,
  aide: 0,
  debut: 1,
  orchidia: 0.008,
};

/** Les quatre voies de la première décision. */
export const VOIES: readonly (readonly Operation[])[] = [
  [RENOVATION_AUXONNE, RENOVATION_MONTBARD],
  [REGROUPEMENT],
  [MONTBARD_NEUF, AUXONNE_TRANSFORMEE],
  [MISE_AUX_NORMES],
];
export const NOMS_DES_VOIES = [
  "la rénovation des deux EHPAD",
  "le regroupement à Is-sur-Tille",
  "la reconstruction de Montbard et la transformation d'Auxonne",
  "la seule mise aux normes",
] as const;

/** La chance de base qu'a chaque voie d'obtenir l'aide de l'ARS et du département. */
export const CHANCE_AIDE = [0.15, 0.08, 0.4, 0] as const;
/** Ce que le dossier y ajoute : l'étude et la concertation, la concertation seule. */
export const BONUS_DOSSIER = [0, 0.25, 0.12] as const;
export const BONUS_AJUSTE = { avecEtude: 0.1, sansEtude: 0.05, ajout: -0.1 } as const;
export const MALUS_HABILITATION = 0.35;
export const MALUS_ZONE = 0.05;

/** Rénover : les dépassements que le plan validé ne couvre pas, connus aux diagnostics. */
export const DEPASSEMENT_RENOVATION = { moyenne: 0.09, ecart: 0.05, max: 0.22 } as const;
/** Regrouper : les élus obtiennent le refus du transfert des autorisations, sauf concertation. */
export const REFUS_TRANSFERT = { chance: 0.55, avecConcertation: 0.45, etudesPerdues: 220000 };
/** Reporter : au prochain CPOM, le même problème coûtera plus cher. */
export const COUT_DU_REPORT = 350000;
/** Le programme ajusté au territoire : gain par an selon le scénario, perte s'il l'est à tort. */
export const AJUSTEMENT = {
  gain: [30000, 10000, 40000],
  erreur: -55000,
  ajout: [150000, -120000, -380000],
  /** Ce que l'ajustement vaut pour chaque voie, rapporté à la reconstruction. */
  poids: [0.6, 0.8, 1, 0],
} as const;
/** Les terrains de Montbard. */
export const TERRAINS = {
  zone: { economie: 250000, occupation: 0.05 },
  bourg: { chance: 0.3, fondations: 1500000 },
  site: { cout: 520000 },
} as const;
/** L'annonce : chance d'une rumeur selon ce qu'on dit, et ce qu'elle coûte selon la voie. */
export const ANNONCE = {
  chance: [0.55, 0.05, 0.25],
  certain: [0, -20000, -25000],
  rumeur: [90000, 260000, 140000, 60000],
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  voie: 0,
  dossier: 1,
  plafond: 2,
  programme: 3,
  terrain: 4,
  annonce: 5,
} as const;
/** La semaine où chaque décision prend effet. */
export const EFFET = [1, 3, 5, 7, 9, 11] as const;
/** Ne rien changer : la seule mise aux normes, aucune étude, rien d'ajusté, rien annoncé. */
export const NEUTRE = [3, 0, 0, 0, 2, 0] as const;

/* ---------------------------------------------------------------------------
 * LE CALCUL DU PRIX DE JOURNÉE.
 * ------------------------------------------------------------------------- */

const actu = (t: number) => (1 + TAUX_ACTU) ** -t;
/** La somme des facteurs d'actualisation des années de à a. */
export const facteur = (de: number, a: number) => {
  let s = 0;
  for (let t = de; t <= a; t += 1) s += actu(t);
  return s;
};
/** Les journées sur lesquelles le département calcule le prix. */
export const journeesTarif = (op: Operation) => op.places * 365 * OCCUPATION_TARIF;

/**
 * LA HAUSSE DU PRIX DE JOURNÉE qu'une opération impose : amortissements et
 * intérêts de la première année, aide déduite (elle se reprend au rythme des
 * amortissements et remplace de l'emprunt), moins les charges qui
 * disparaissent et les économies, rapportés aux journées à 97 %.
 */
export function hausse(
  op: Operation,
  o: { aide?: number; taux?: number; cout?: number } = {},
): number {
  const aide = o.aide ?? 0;
  const taux = o.taux ?? TAUX_EMPRUNT;
  const cout = o.cout ?? op.cout;
  const amortissement = (cout - aide) / op.duree;
  const interets = taux * (cout - op.fondsPropres - aide);
  return (amortissement + interets - op.disparait - op.economies) / journeesTarif(op);
}

/** Le prix facturé l'année k après la mise en service, selon la manière de présenter la hausse. */
export function prixFacture(h: number, presentation: number, k: number, ans: number): number {
  if (h <= PLAFOND) return h;
  if (presentation === 1) return Math.min(h, PLAFOND + RATTRAPAGE * Math.min(k, ans));
  return PLAFOND;
}

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce que l'imprévu coûte au trimestre, en euros. */
  cout: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "canicule",
    titre: "Une canicule tardive",
    de: "Valère Bellefontaine",
    role: "Directeur de l'EHPAD de Montbard",
    texte:
      "Quatre jours à 35 °C. Sans pièce rafraîchie, nous avons loué des climatiseurs mobiles et renforcé les équipes pour faire boire et rafraîchir les résidents : 14 k€. L'ARS a demandé notre plan bleu.",
    cout: 14000,
  },
  {
    id: "chaudiere",
    titre: "La chaudière de Montbard lâche",
    de: "Rosalinde Charvolin",
    role: "Responsable des travaux du siège",
    texte:
      "La chaudière de Montbard a lâché un matin à 12 °C. Chaudière mobile en trois heures, puis remplacement du brûleur : 36 k€, quelle que soit la suite du bâtiment.",
    cout: 36000,
  },
  {
    id: "taux",
    titre: "La banque relève son offre",
    de: "Valdemar Joubaud",
    role: "Chargé d'affaires, Banque Saônelle",
    texte:
      "Les taux longs ont monté : notre offre passe de 3,5 % à 3,8 % sur vingt-cinq ans, pour toute opération signée au printemps.",
    cout: 0,
  },
  {
    id: "orchidia",
    titre: "Orchidia Résidences s'installe à Semur-en-Auxois",
    de: "Valère Bellefontaine",
    role: "Directeur de l'EHPAD de Montbard",
    texte:
      "Orchidia Résidences rachète l'EHPAD privé de Semur-en-Auxois, à vingt kilomètres, et annonce des chambres neuves et climatisées. Deux familles sur notre liste d'attente y sont déjà allées visiter.",
    cout: 0,
  },
  {
    id: "indice",
    titre: "Le coût de la construction monte",
    de: "Ljubica Feuillade",
    role: "Économiste de la construction",
    texte:
      "L'indice du coût de la construction a pris 3 % depuis l'été. Toutes les opérations encore à consulter seront chiffrées 3 % plus cher.",
    cout: 0,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** 0 : besoin en hausse ; 1 : stable ; 2 : développement du domicile. */
  scenario: number;
  /** Les demandes d'admission de chaque semaine (indices 1 à 13). */
  demandes: readonly number[];
  /** L'écart d'occupation de chaque semaine. */
  bruit: readonly number[];
  /** Le scénario que les demandes des six premières semaines laissent croire. */
  signal: number;
  uAide: number;
  uLissage: number;
  uSol: number;
  uRefus: number;
  uRumeur: number;
  /** Le dépassement que les diagnostics d'une rénovation révéleraient, en part du coût. */
  depassement: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001017 + 7);
  const u = r();
  const scenario =
    u < SCENARIOS[0].chance ? 0 : u < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  const demandes: number[] = [0];
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) {
    demandes.push(Math.max(0, Math.round(DEMANDES[scenario]! + 1.4 * gauss(r))));
    bruit.push(borne(0.006 * gauss(r), -0.015, 0.015));
  }
  const signal = scenarioDesDemandes(demandes.slice(1, 7).reduce((s, x) => s + x, 0) / 6);
  const uAide = r();
  const uLissage = r();
  const uSol = r();
  const uRefus = r();
  const uRumeur = r();
  const depassement = borne(
    DEPASSEMENT_RENOVATION.moyenne + DEPASSEMENT_RENOVATION.ecart * gauss(r),
    0,
    DEPASSEMENT_RENOVATION.max,
  );
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    scenario,
    demandes,
    bruit,
    signal,
    uAide,
    uLissage,
    uSol,
    uRefus,
    uRumeur,
    depassement,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);
const tombe = (h: Hasard, id: string, w: number) => {
  const i = imprevu(h, id);
  return i !== undefined && i.semaine <= w;
};

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La chance d'obtenir l'aide, selon la voie et le dossier. */
export function chanceAide(c: readonly number[]): number {
  const voie = c[D.voie]!;
  if (voie === 3) return 0;
  let p = CHANCE_AIDE[voie]! + BONUS_DOSSIER[c[D.dossier]!]!;
  if (c[D.programme] === 1)
    p += c[D.dossier] === 1 ? BONUS_AJUSTE.avecEtude : BONUS_AJUSTE.sansEtude;
  if (c[D.programme] === 2) p += BONUS_AJUSTE.ajout;
  if (c[D.plafond] === 2) p -= MALUS_HABILITATION;
  if (voie === 2 && c[D.terrain] === 0) p -= MALUS_ZONE;
  return borne(p, 0.02, 0.9);
}
export const aideAccordee = (c: readonly number[], graine: number) =>
  hasard(graine).uAide < chanceAide(c);

/** Le département accepte-t-il un rattrapage sur cinq ans ? */
export const lissageLong = (graine: number) => hasard(graine).uLissage < LISSAGE.chance;
/** Les sondages du terrain du centre-bourg révèlent-ils des argiles ? */
export const argiles = (graine: number) => hasard(graine).uSol < TERRAINS.bourg.chance;
export const chanceRefus = (c: readonly number[]) =>
  c[D.dossier] === 0 ? REFUS_TRANSFERT.chance : REFUS_TRANSFERT.avecConcertation;
/** Les élus obtiennent-ils le refus du transfert des autorisations ? */
export const transfertRefuse = (c: readonly number[], graine: number) =>
  c[D.voie] === 1 && hasard(graine).uRefus < chanceRefus(c);
/** Une rumeur part-elle dans la presse locale ? */
export const rumeur = (c: readonly number[], graine: number) =>
  hasard(graine).uRumeur < ANNONCE.chance[c[D.annonce]!]!;
/** Le scénario sur lequel le programme est ajusté : celui de l'étude, ou celui que les demandes laissent croire. */
export const scenarioLu = (c: readonly number[], graine: number) =>
  c[D.dossier] === 1 ? hasard(graine).scenario : hasard(graine).signal;

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, SACHANT TOUT.
 * ------------------------------------------------------------------------- */

export interface Etat {
  scenario: number;
  aide: boolean;
  lissageLong: boolean;
  argiles: boolean;
  refus: boolean;
  rumeur: boolean;
  depassement: number;
  taux: number;
  indice: number;
  orchidia: boolean;
  /** Le scénario est-il su ? L'ajustement du programme ne se valorise qu'alors. */
  scenarioSu: boolean;
  signal: number;
}

export interface Detail {
  valeur: number;
  /** La hausse nécessaire de l'opération principale, et le prix facturé à l'ouverture. */
  hausse: number;
  /** Le déficit d'hébergement actualisé. */
  deficit: number;
  /** Le déficit d'hébergement de la dernière année : ce que le prix ne couvrira jamais. */
  reste: number;
  occupation: number;
}

/** Le coût d'une opération, indice et terrain compris. */
function coutDe(op: Operation, c: readonly number[], e: Pick<Etat, "indice">): number {
  let cout = op.cout;
  if (op === MONTBARD_NEUF && c[D.terrain] === 0) cout -= TERRAINS.zone.economie;
  return cout * e.indice;
}

/** La hausse de chaque opération de la voie, aide accordée ou non. */
export function haussesDeLaVoie(c: readonly number[], e: Pick<Etat, "aide" | "taux" | "indice">) {
  return VOIES[c[D.voie]!]!.map((op) =>
    hausse(op, { aide: e.aide ? op.aide : 0, taux: e.taux, cout: coutDe(op, c, e) }),
  );
}

export function valeurSachant(chemin: readonly number[], e: Etat): Detail {
  let c = chemin;
  let valeur = 0;
  if (c[D.voie] === 1 && e.refus) {
    // Le transfert refusé, le regroupement tombe : on revient à la seule mise aux normes.
    c = [3, ...chemin.slice(1)];
    valeur -= REFUS_TRANSFERT.etudesPerdues;
  }
  const voie = c[D.voie]!;
  const s = e.scenario;
  let deficit = 0;
  let reste = 0;
  let occupationService = 0;
  let placesService = 0;
  let hPrincipale = 0;
  VOIES[voie]!.forEach((op) => {
    const cout = coutDe(op, c, e);
    const h = hausse(op, { aide: e.aide ? op.aide : 0, taux: e.taux, cout });
    hPrincipale = Math.max(hPrincipale, h);
    let occ = op.occupation[s]! - (e.orchidia ? op.orchidia : 0);
    if (op === MONTBARD_NEUF && c[D.terrain] === 0) occ -= TERRAINS.zone.occupation;
    const auj = op.sites.reduce((t, site) => t + joursAujourdhui(site), 0);
    const ans = e.lissageLong ? LISSAGE.long : LISSAGE.court;
    const libre = c[D.plafond] === 2 && h > PLAFOND;
    for (let t = op.debut; t <= HORIZON; t += 1) {
      const k = t - op.debut;
      let o: number;
      let manque: number;
      if (libre) {
        const habilitees = occ - ELASTICITE[s]! * Math.max(0, PLAFOND - SEUIL_ELASTICITE);
        o = (1 - PART_LIBRE) * habilitees + PART_LIBRE * Math.min(occ, OCCUPATION_LIBRE[s]!);
        manque = 0;
      } else {
        const p = prixFacture(h, c[D.plafond]!, k, ans);
        o = occ - ELASTICITE[s]! * Math.max(0, p - SEUIL_ELASTICITE);
        manque = (h - p) * journeesTarif(op);
      }
      const flux = MARGE_JOURNEE * (op.places * 365 * o - auj) + op.horsHebergement[s]! - manque;
      valeur += flux * actu(t);
      deficit += manque * actu(t);
      if (t === HORIZON) reste += manque;
      if (k === 0) {
        occupationService += op.places * o;
        placesService += op.places;
      }
    }
    valeur -= op.transition;
    if (voie === 0) valeur -= e.depassement * cout;
  });
  if (voie === 2) {
    if (c[D.terrain] === 1 && e.argiles) valeur -= TERRAINS.bourg.fondations;
    if (c[D.terrain] === 2) valeur -= TERRAINS.site.cout;
  }
  if (voie === 3) valeur -= COUT_DU_REPORT;
  // Le programme : ajusté sur ce qu'on a lu du territoire, ou grossi de dix places.
  const poids = AJUSTEMENT.poids[voie]!;
  if (e.scenarioSu && poids > 0) {
    const kService = facteur(OUVERTURE, HORIZON);
    if (c[D.programme] === 1) {
      const lu = c[D.dossier] === 1 ? s : e.signal;
      valeur += poids * kService * (lu === s ? AJUSTEMENT.gain[s]! : AJUSTEMENT.erreur);
    }
    if (c[D.programme] === 2) valeur += poids * AJUSTEMENT.ajout[s]!;
  }
  // L'annonce aux résidents, aux familles et aux équipes.
  valeur += ANNONCE.certain[c[D.annonce]!]!;
  if (e.rumeur) valeur -= ANNONCE.rumeur[voie]!;
  return {
    valeur,
    hausse: hPrincipale,
    deficit,
    reste,
    occupation: placesService ? occupationService / placesService : 0,
  };
}

/* ---------------------------------------------------------------------------
 * CE QU'ON SAIT EN FIN DE SEMAINE w : le reste est pris en espérance.
 * ------------------------------------------------------------------------- */

/** Les choix qui ont pris effet en semaine w ; les autres comptent comme « ne rien changer ». */
export const effectifs = (chemin: readonly number[], w: number) =>
  NEUTRE.map((n, k) => (w >= EFFET[k]! ? (chemin[k] ?? n) : n));

const deux = (su: boolean, vrai: boolean, p: number): [boolean, number][] =>
  su
    ? [[vrai, 1]]
    : [
        [true, p],
        [false, 1 - p],
      ];

export interface Estimation {
  valeur: number;
  /** La hausse nécessaire espérée de l'opération principale. */
  hausse: number;
  /** L'aide espérée, en euros. */
  aide: number;
  occupation: number;
}

const memo = new Map<string, Estimation>();

export function estimer(chemin: readonly number[], graine: number, w: number): Estimation {
  const h = hasard(graine);
  const c = effectifs(chemin, w);
  const voie = c[D.voie]!;
  const etude = c[D.dossier] === 1;
  const scenarioSu = w >= REVELATIONS.schema || (etude && w >= ETUDE.semaine);
  const aideSue = w >= REVELATIONS.aides;
  const refusSu = w >= REVELATIONS.elus;
  const solSu = w >= REVELATIONS.sondages;
  const rumeurSue = w >= REVELATIONS.rumeur;
  const diagSu = w >= REVELATIONS.diagnostics;
  const taux = tombe(h, "taux", w) ? TAUX_RELEVE : TAUX_EMPRUNT;
  const indice = tombe(h, "indice", w) ? 1.03 : 1;
  const orchidia = tombe(h, "orchidia", w);
  const cle = [
    graine,
    c.join(""),
    +scenarioSu,
    +aideSue,
    +refusSu,
    +solSu,
    +rumeurSue,
    +diagSu,
    taux,
    indice,
    +orchidia,
  ].join("|");
  const deja = memo.get(cle);
  if (deja) return deja;

  const pAide = chanceAide(c);
  const scenarios: [number, number][] = scenarioSu
    ? [[h.scenario, 1]]
    : SCENARIOS.map((x, i) => [i, x.chance]);
  const aides =
    voie === 3 ? [[false, 1] as [boolean, number]] : deux(aideSue, h.uAide < pAide, pAide);
  const lissages =
    c[D.plafond] === 1
      ? deux(true, lissageLong(graine), LISSAGE.chance)
      : [[true, 1] as [boolean, number]];
  const sols =
    voie === 2 && c[D.terrain] === 1
      ? deux(solSu, argiles(graine), TERRAINS.bourg.chance)
      : [[false, 1] as [boolean, number]];
  const refus =
    voie === 1
      ? deux(refusSu, transfertRefuse(c, graine), chanceRefus(c))
      : [[false, 1] as [boolean, number]];
  const rumeurs = deux(rumeurSue, rumeur(c, graine), ANNONCE.chance[c[D.annonce]!]!);
  const depassement = diagSu ? h.depassement : DEPASSEMENT_RENOVATION.moyenne;

  let valeur = 0;
  let haussePond = 0;
  let occupation = 0;
  for (const [s, ps] of scenarios)
    for (const [aide, pa] of aides)
      for (const [lissage, pl] of lissages)
        for (const [sol, pso] of sols)
          for (const [ref, pr] of refus)
            for (const [rum, pru] of rumeurs) {
              const poids = ps * pa * pl * pso * pr * pru;
              const d = valeurSachant(c, {
                scenario: s,
                aide,
                lissageLong: lissage,
                argiles: sol,
                refus: ref,
                rumeur: rum,
                depassement,
                taux,
                indice,
                orchidia,
                scenarioSu,
                signal: h.signal,
              });
              valeur += poids * d.valeur;
              haussePond += poids * d.hausse;
              occupation += poids * d.occupation;
            }
  // Ce que le trimestre lui-même a coûté.
  if (etude) valeur -= ETUDE.prix;
  for (const i of h.imprevus) if (i.semaine <= w) valeur -= i.imprevu.cout;
  const aideMax = VOIES[voie]!.reduce((t, op) => t + op.aide, 0);
  const e: Estimation = {
    valeur,
    hausse: haussePond,
    aide:
      voie === 3 || (voie === 1 && refusSu && transfertRefuse(c, graine))
        ? 0
        : aideSue
          ? h.uAide < pAide
            ? aideMax
            : 0
          : pAide * aideMax,
    occupation,
  };
  memo.set(cle, e);
  return e;
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** La hausse de prix de journée nécessaire, espérée, en € par jour. */
  hausse: number;
  /** L'aide à l'investissement espérée, ou accordée, en euros. */
  aide: number;
  /** L'occupation des deux EHPAD dans la semaine. */
  occupation: number;
  /** Les demandes d'admission reçues dans la semaine. */
  demandes: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  voie: number;
  scenario: number;
  aide: boolean;
  chanceAide: number;
  montantAide: number;
  /** La hausse nécessaire de l'opération principale, aide comprise, et le prix facturé à l'ouverture. */
  hausse: number;
  deficit: number;
  /** Le déficit d'hébergement de la dernière année : ce que le prix ne couvrira jamais. */
  reste: number;
  /** L'occupation attendue à la mise en service. */
  occupation: number;
  refus: boolean;
  argiles: boolean;
  lissageLong: boolean;
  rumeur: boolean;
  depassement: number;
  signal: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let rumeurDepuis = Infinity;
  if (rumeur(chemin, graine)) rumeurDepuis = REVELATIONS.rumeur;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w);
    const valeur = e.valeur - perte;
    const derive = [0.0006, -0.0004, -0.0012][h.scenario]! * w;
    semaines.push({
      valeur,
      variation: valeur - avant,
      hausse: e.hausse,
      aide: e.aide,
      occupation: borne(
        0.925 +
          derive +
          h.bruit[w]! -
          (w >= rumeurDepuis ? 0.012 : 0) -
          (tombe(h, "orchidia", w) ? 0.004 : 0),
        0.85,
        0.99,
      ),
      demandes: Math.max(0, h.demandes[w]! - (w >= rumeurDepuis ? 2 : 0)),
    });
    avant = valeur;
  }
  const c = [...chemin];
  const refus = transfertRefuse(c, graine);
  const aide = c[D.voie] !== 3 && !refus && aideAccordee(c, graine);
  const fin: Etat = {
    scenario: h.scenario,
    aide,
    lissageLong: lissageLong(graine),
    argiles: argiles(graine),
    refus,
    rumeur: rumeur(c, graine),
    depassement: h.depassement,
    taux: tombe(h, "taux", SEMAINES) ? TAUX_RELEVE : TAUX_EMPRUNT,
    indice: tombe(h, "indice", SEMAINES) ? 1.03 : 1,
    orchidia: tombe(h, "orchidia", SEMAINES),
    scenarioSu: true,
    signal: h.signal,
  };
  const d = valeurSachant(c, fin);
  const voieFinale = refus ? 3 : c[D.voie]!;
  return {
    semaines,
    objectif: semaines[SEMAINES]!.valeur,
    voie: c[D.voie]!,
    scenario: h.scenario,
    aide,
    chanceAide: chanceAide(c),
    montantAide: aide ? VOIES[voieFinale]!.reduce((t, op) => t + op.aide, 0) : 0,
    hausse: d.hausse,
    deficit: d.deficit,
    reste: d.reste,
    occupation: d.occupation,
    refus,
    argiles: c[D.voie] === 2 && c[D.terrain] === 1 && argiles(graine),
    lissageLong: lissageLong(graine),
    rumeur: rumeur(c, graine),
    depassement: h.depassement,
    signal: h.signal,
  };
}

/** Ce qui s'est passé pendant des semaines : étude, diagnostics, élus, schéma, sondages, aides, rumeur. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    etude: chemin[D.dossier] === 1 && dans(ETUDE.semaine),
    diagnostics: chemin[D.voie] === 0 && dans(REVELATIONS.diagnostics),
    elus: chemin[D.voie] === 1 && dans(REVELATIONS.elus),
    schema: dans(REVELATIONS.schema),
    sondages: chemin[D.voie] === 2 && chemin[D.terrain] === 1 && dans(REVELATIONS.sondages),
    aides: chemin[D.voie] !== 3 && !transfertRefuse(chemin, graine) && dans(REVELATIONS.aides),
    rumeur: rumeur(chemin, graine) && dans(REVELATIONS.rumeur),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureReconstruction {
  valeur: number | null;
  hausse: number | null;
  aide: number | null;
  occupation: number | null;
  demandes: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  demandesMoyennes: number | null;
  scenarioSu: number | null;
  /** Le scénario, une fois su ; celui que les demandes vues laissent croire. */
  scenario: number | null;
  signal: number | null;
  taux: number | null;
  indice: number | null;
}

/** Ce que Noëlle lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureReconstruction {
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      valeur: 0,
      hausse: 0,
      aide: 0,
      occupation: 0.925,
      demandes: DEMANDES[1],
      demandesMoyennes: DEMANDES[1],
      scenarioSu: 0,
      scenario: null,
      signal: 1,
      taux: TAUX_EMPRUNT,
      indice: 1,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const vues = h.demandes.slice(1, semaine + 1);
  const etude = chemin[D.dossier] === 1 && decisions.length > D.dossier;
  const su = semaine >= REVELATIONS.schema || (etude && semaine >= ETUDE.semaine);
  const moyenne = vues.reduce((a, b) => a + b, 0) / vues.length;
  return {
    valeur: s.valeur,
    hausse: s.hausse,
    aide: s.aide,
    occupation: s.occupation,
    demandes: s.demandes,
    demandesMoyennes: moyenne,
    scenarioSu: su ? 1 : 0,
    scenario: su ? h.scenario : null,
    signal: scenarioDesDemandes(moyenne),
    taux: tombe(h, "taux", semaine) ? TAUX_RELEVE : TAUX_EMPRUNT,
    indice: tombe(h, "indice", semaine) ? 1.03 : 1,
  };
}
