/**
 * LE DISCOUNTER QUI ARRIVE — le modèle de la riposte d'Arvel Distribution
 * dans le Rhône.
 *
 * Tarval, une enseigne de négoce en libre-service, ouvre deux dépôts à
 * Vénissieux et à Saint-Priest en semaine 3, avec des prix 12 % sous ceux
 * d'Arvel au comptoir et 15 % sous eux à la palette. Huit agences, 36 M€ de
 * chiffre d'affaires, treize semaines, six décisions.
 *
 * Une stratégie se juge sur des années ; un épisode dure un trimestre. Le
 * trimestre est donc jugé sur la VALEUR ESTIMÉE EN SEMAINE 13, en écart au
 * plan d'avant Tarval :
 *
 *   · la marge du trimestre, moins les coûts des actions (camions, campagne,
 *     test, dépôt), en écart à la marge du plan ;
 *   · PLUS la valeur des positions prises : une année pleine de contribution
 *     au régime atteint en semaine 13 — les clients gardés ou perdus, les prix
 *     consentis, les contrats signés, la livraison en place —, recalculée avec
 *     ce que le trimestre a révélé (la stratégie de Tarval, sa réaction à nos
 *     baisses, l'adhésion des clients) ; ce qui reste inconnu en semaine 13 est
 *     compté en espérance ;
 *   · MOINS les sommes engagées et perdues (campagne, provision d'un litige).
 *
 * Ne rien faire n'est pas neutre : la menace seule vaut plusieurs centaines
 * de milliers d'euros. Le hasard porte sur ce que le trimestre révèle, jamais
 * sur les règles du calcul.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · TOUTE LA CLIENTÈLE N'EST PAS EXPOSÉE. Tarval ne livre pas, ne fait pas
 *     crédit, ne conseille pas : il prend des produits de base enlevés au
 *     dépôt, par ceux qui comparent. Les entreprises livrées sur chantier ne
 *     bougent pas ; les artisans du comptoir comparent une centaine de
 *     références ; les PME qui enlèvent par palettes comparent le prix de la
 *     palette, et pour six palettes, elles font trente kilomètres. Une baisse
 *     générale paie une remise à tous ceux qui ne seraient pas partis ; la
 *     riposte juste aligne ce qui se compare, là où l'on compare.
 *   · UN CONCURRENT QUI A HUIT POINTS DE FRAIS DE MOINS PEUT SUIVRE. Plus la
 *     riposte est large et visible, plus Tarval la suit, d'autant plus s'il
 *     vise la part de marché à tout prix : l'écart revient, et la baisse reste.
 *     Suivre chacune de ses promotions, c'est l'inviter à recommencer.
 *   · CE QUE LE DISCOUNTER NE SAIT PAS FAIRE SE RENFORCE, ET SE TESTE. La
 *     livraison du lendemain sur chantier retient les PME et gagne des
 *     entreprises sur les autres négoces, si les clients l'adoptent : une fois
 *     sur deux à peine. La tester dans deux agences avant de l'étendre coûte
 *     six semaines, et évite de payer quatre camions pour rien.
 *
 * Le hasard stratégique : Tarval vise la part de marché à tout prix (quatre
 * chances sur dix ; son actionnaire finance un plan de vingt dépôts) ou la
 * rentabilité de ses dépôts. Il suit nos baisses, ou non, selon leur ampleur
 * et selon sa stratégie ; sa promotion d'hiver est temporaire, ou devient son
 * prix.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Tarval ouvre ses deux dépôts au début de la semaine 3. */
export const OUVERTURE = 3;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la riposte n'est pas prête le jour de l'ouverture. */
export const PERTE_PAR_JOUR = 5000;
/** L'horizon sur lequel le comité valorise les positions prises : une année pleine. */
export const SEMAINES_PAR_AN = 52;
/** Ce que la direction attend : ne pas perdre plus que cela sur le plan. */
export const OBJECTIF_VALEUR = -600000;

/** Taux de marque : la marge commerciale rapportée au prix de vente. */
export const TAUX_DE_MARQUE = { base: 0.21, technique: 0.31 } as const;

/**
 * La clientèle de la région, au tarif d'avant Tarval, par semaine. `comparees` :
 * la part des achats de base sur des références que le client compare (le
 * panier du comptoir pour un artisan, les produits à la palette pour une PME).
 */
export const CLIENTS = {
  artisans: { comptes: 1900, ca: 110000, base: 0.6, comparees: 0.45 },
  pme: { comptes: 190, ca: 120000, base: 0.75, comparees: 0.7 },
  entreprises: { comptes: 460, ca: 460000, base: 0.24 },
} as const;
/** La part des ventes aux artisans et aux PME faite dans les cinq agences proches des dépôts. */
export const ZONE = 0.65;
/** L'écart de prix de Tarval sur les références comparées, avant toute riposte. */
export const ECART_TARVAL = { comptoir: 0.12, palette: 0.15 } as const;
/** Les frais de structure, en part du chiffre d'affaires. */
export const FRAIS = { arvel: 0.19, tarval: 0.11 } as const;
/** Ce qu'un euro de produits de base parti chez Tarval entraîne d'achats techniques avec lui. */
export const ENTRAINEMENT = 0.2;
/**
 * LA RÉPONSE AU PRIX : en deçà de 3 points d'écart, personne ne bouge ; la
 * fuite croît ensuite avec l'écart, atteint la sensibilité du groupe à 12
 * points, et plafonne à 1,3 fois celle-ci : il reste toujours des clients que
 * le prix ne fait pas bouger.
 */
export const REPONSE = { seuil: 0.03, plage: 0.09, plafond: 1.3 } as const;
/** La vitesse à laquelle les clients partent, ou reviennent, chaque semaine. */
export const VITESSE = 0.35;

/** La riposte générale : 8 % sur toute la gamme de base, à l'enlèvement. */
export const BAISSE_GENERALE = 0.08;
/** La riposte ciblée : les références comparées ramenées à 4 % de Tarval. */
export const ECART_VISE = 0.04;
/** La baisse de toute la gamme de base dans les trois agences du nord. */
export const BAISSE_NORD = 0.05;
/** La carte comptoir que le comité voulait pour les artisans, dans les huit agences. */
export const CARTE = 0.03;

export const SCENARIO = {
  /** Tarval vise la part de marché à tout prix : quatre chances sur dix. */
  chance: 0.4,
  /** Ce que sa stratégie fait à la fuite des clients. */
  conquete: 1.2,
  rentabilite: 0.9,
  /** La semaine où sa stratégie devient claire (troisième dépôt, ou hausse de ses prix). */
  annonce: 10,
  /** En rentabilité, Tarval remonte ses prix de 3 % en janvier. */
  hausse: 0.03,
} as const;

/** La probabilité que Tarval suive notre riposte de la semaine 1, selon son ampleur. */
export const SUIVI = {
  /** [conquête, rentabilité], par option de la riposte. */
  riposte: [
    [0.65, 0.3],
    [0.1, 0.03],
    [0, 0],
    [0.5, 0.2],
  ],
  /** Une campagne « prix » le provoque. */
  campagne: 0.1,
  /** Il réagit deux semaines après son ouverture. */
  semaine: 5,
} as const;
/** Ce que la guerre des prix fait au prix de marché : on rend ce que les clients réclament. */
export const EROSION = { enlevement: 0.015, livres: 0.005 } as const;

/** La livraison du lendemain avant 7 h, gratuite dès 600 €. */
export const LIVRAISON = {
  /** Quatre camions-grue pour les huit agences, chauffeurs compris. */
  coutAnnuel: 320000,
  /** Le test : un camion dans deux agences, six semaines, et la mise en place. */
  test: { hebdo: 1200, miseEnPlace: 10000, fin: 10, agences: 0.25 },
  /** L'adoption est forte une fois sur deux à peine. */
  chanceForte: 0.45,
  forte: { entreprises: 0.065, pme: 0.3 },
  faible: { entreprises: 0.01, pme: 0.05 },
  /** Huit semaines pour que les clients prennent l'habitude. */
  montee: 8,
} as const;
/** La campagne « Arvel, les prix des pros » : radio, affichage, mailing. */
export const CAMPAGNE = { cout: 100000, artisans: 0.85, de: 4, a: 9 } as const;

/** Le fabricant de plaques et d'isolants, qui livre aussi Tarval. */
export const FABRICANT = {
  /** Sa part dans nos achats de produits de base. */
  part: 0.3,
  /** La remise de fin d'année conditionnelle : pleine à 96 % des volumes de l'an dernier, nulle à 92 %. */
  rfa: 0.03,
  plein: 0.96,
  nul: 0.92,
  /** Ce que coûte la pression : son budget de coopération retiré, et une plainte une fois sur trois. */
  cooperation: 20000,
  chancePlainte: 0.35,
  provision: 120000,
  semainePlainte: 10,
} as const;

/** La part des PME du nord qu'on attend à la signature, avant de leur proposer le contrat. */
export const ADHESION_ATTENDUE = 0.68;

/** Le contrat proposé aux PME du nord : une ristourne contre un engagement de volume. */
export const CONTRAT = {
  /** Un engagement de volume divise la fuite des signataires. */
  engagement: 0.3,
  /** Sans renouvellement, l'engagement tombe au 31 mars : un quart de l'année. */
  sansRenouvellement: 0.85,
  /** Avec la livraison en place, un dixième de PME de plus signe. */
  avecLivraison: 0.1,
  /** La ristourne de fin d'année, si la PME nous garde 90 % de ses volumes de base. */
  ristourne: 0.02,
} as const;

/** La promotion d'hiver de Tarval : −15 % sur 40 références de gros œuvre. */
export const PROMO = {
  debut: 9,
  remise: 0.15,
  /** Sa part dans les références comparées : du panier du comptoir, des produits à la palette. */
  artisans: 1 / 3,
  pme: 0.45,
  /** Une « opération » jusqu'au 31 décembre pèse moins qu'un prix. */
  temporaire: 0.7,
  /** Un prix baissé pour suivre ne remonte pas en janvier : les clients ne le laissent pas remonter. */
  ancrage: 1,
  /** Le prix garanti aux PME de la zone court jusqu'au 30 juin : la moitié de l'année qui vient. */
  garantie: 0.5,
  /** La probabilité qu'il surenchérisse si on suit : [conquête, rentabilité]. */
  escalade: [0.6, 0.25],
  semaineEscalade: 11,
} as const;

/** Le cap de décembre : ce que coûtent le dépôt à bas prix et les prix garantis. */
export const CAP = {
  /** Les 90 références du panier qu'aucun client ne regarde : 30 % du coût de l'alignement. */
  recentrage: { cout: 0.7, ecart: 0.004 },
  garantis: { guerre: [0.7, 0.3] },
  depot: {
    ouverture: 60000,
    hebdo: 4000,
    /** La part des achats partis chez Tarval qu'il reprendrait. */
    reprise: [0.45, 0.25],
    margeReprise: 0.12,
    /** La part des clients de la zone qui y passeraient d'eux-mêmes. */
    cannibalisation: 0.06,
  },
} as const;

/** La part du coût d'un alignement qui va à des références que personne ne compare. */
export const ALIGNEMENT_INUTILE = 1 - CAP.recentrage.cout;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  riposte: 0,
  livraison: 1,
  fabricant: 2,
  nord: 3,
  promo: 4,
  cap: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [3, 5, 6, 8, 9, 12] as const;

/** Ne rien changer : pas de riposte, rien de plus, rien demandé, attendre, ne pas suivre, reconduire. */
export const NEUTRE = [2, 3, 2, 3, 1, 3] as const;

/* ---------------------------------------------------------------------------
 * LES GROUPES DE CLIENTS EXPOSÉS : artisans et PME, dans la zone et au nord.
 * ------------------------------------------------------------------------- */

export type CleGroupe = "artisansZone" | "artisansNord" | "pmeZone" | "pmeNord";

export interface Groupe {
  cle: CleGroupe;
  segment: "artisans" | "pme";
  zone: boolean;
  /** Les achats de base et techniques par semaine, au tarif d'avant Tarval. */
  base: number;
  technique: number;
  comparees: number;
  /** L'écart de Tarval sur ce que ce groupe compare. */
  ecart: number;
  /** La part de ses achats de base qui part chez Tarval à 12 points d'écart. */
  sensibilite: number;
}

const groupe = (
  cle: CleGroupe,
  segment: "artisans" | "pme",
  zone: boolean,
  sensibilite: number,
): Groupe => {
  const c = CLIENTS[segment];
  const part = zone ? ZONE : 1 - ZONE;
  return {
    cle,
    segment,
    zone,
    base: c.ca * c.base * part,
    technique: c.ca * (1 - c.base) * part,
    comparees: c.comparees,
    ecart: segment === "artisans" ? ECART_TARVAL.comptoir : ECART_TARVAL.palette,
    sensibilite,
  };
};

/**
 * Les artisans du nord ne font pas trente kilomètres pour un panier de
 * comptoir ; les PME du nord, si, pour six palettes.
 */
export const GROUPES: readonly Groupe[] = [
  groupe("artisansZone", "artisans", true, 0.2),
  groupe("artisansNord", "artisans", false, 0.02),
  groupe("pmeZone", "pme", true, 0.4),
  groupe("pmeNord", "pme", false, 0.3),
];

const E = CLIENTS.entreprises;
const BASE_E = E.ca * E.base;
const TECH_E = E.ca * (1 - E.base);

/** La marge commerciale d'une semaine du plan, sans Tarval. */
export const MARGE_PLAN =
  GROUPES.reduce(
    (s, g) => s + g.base * TAUX_DE_MARQUE.base + g.technique * TAUX_DE_MARQUE.technique,
    0,
  ) +
  BASE_E * TAUX_DE_MARQUE.base +
  TECH_E * TAUX_DE_MARQUE.technique;

/** Le chiffre d'affaires d'une semaine du plan. */
export const CA_PLAN = CLIENTS.artisans.ca + CLIENTS.pme.ca + CLIENTS.entreprises.ca;
/** Les ventes de base d'une semaine du plan, tous clients. */
export const BASE_PLAN = GROUPES.reduce((s, g) => s + g.base, 0) + BASE_E;

/** La part du chiffre d'affaires qu'on croit exposée : la base enlevée dans la zone. */
export const PART_EXPOSEE = GROUPES.filter((g) => g.zone).reduce((s, g) => s + g.base, 0) / CA_PLAN;

/** Ce que coûterait par an la baisse générale, à volumes constants : ce que la semaine 1 demande. */
export const COUT_BAISSE_GENERALE =
  BAISSE_GENERALE *
  (CLIENTS.artisans.ca * CLIENTS.artisans.base + CLIENTS.pme.ca * CLIENTS.pme.base) *
  SEMAINES_PAR_AN;

/** La réponse au prix : la part de la sensibilité d'un groupe qui part, à un écart donné. */
export const reponse = (ecart: number) =>
  Math.min(REPONSE.plafond, Math.max(0, (ecart - REPONSE.seuil) / REPONSE.plage));

/** La baisse qui ramène un écart de Tarval à l'écart visé. */
export const alignement = (ecartTarval: number, vise = ECART_VISE) =>
  1 - (1 - ecartTarval) / (1 - vise);

/** L'écart perçu : le prix de Tarval rapporté au nôtre, nos baisses comprises. */
export const ecartPercu = (ecartTarval: number, baisse: number) =>
  1 - (1 - ecartTarval) / (1 - baisse);

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
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "intemperies",
    titre: "Deux semaines de pluie et de gel",
    de: "Fulvio Ranieri",
    role: "Chef de l'agence de Vénissieux",
    texte:
      "Pluie toute la semaine, gel annoncé pour la suivante : les chantiers s'arrêtent, les comptoirs sont vides. On perd 15 % de ventes sur deux semaines, comme tout le monde.",
    duree: 2,
  },
  {
    id: "ciment",
    titre: "Les cimentiers augmentent leurs prix",
    de: "Service achats",
    role: "Siège",
    texte:
      "Les cimentiers passent une hausse de 4 % au 1er du mois. Le groupe ne la répercute pas avant janvier : la marge de la gamme de base perd 0,8 point jusqu'à la fin du trimestre.",
    duree: 13,
  },
  {
    id: "zac",
    titre: "Le chantier de la ZAC démarre",
    de: "Nesrine Bekkali",
    role: "Contrôleuse de gestion régionale",
    texte:
      "Le gros œuvre de la ZAC de Vaulx-en-Velin démarre : les entreprises livrées commandent 6 % de plus pendant quatre semaines.",
    duree: 4,
  },
  {
    id: "erp",
    titre: "Panne du système de gestion",
    de: "Informatique du groupe",
    role: "Siège",
    texte:
      "Panne du système de gestion lundi et mardi : comptoirs en mode dégradé, bons de livraison à la main. On estime la perte à 6 % des ventes de la semaine.",
    duree: 1,
  },
  {
    id: "commercial",
    titre: "Un commercial PME part chez Tarval",
    de: "Léandre Pélardy",
    role: "Directeur commercial régional",
    texte:
      "Marceau Duteil, notre commercial PME de la zone sud, part chez Tarval à la fin du mois. Il connaît chacun de ses clients, et leurs prix palette.",
    duree: 13,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart de ventes de chaque semaine autour du plan (indices 1 à 13). */
  bruit: readonly number[];
  conquete: boolean;
  /** Les tirages des réactions de Tarval : à la riposte, puis si on suit sa promotion. */
  uSuivi: number;
  uEscalade: number;
  /** La sensibilité réelle de chaque groupe, rapportée à celle qu'on attend. */
  sensibilite: Readonly<Record<CleGroupe, number>>;
  /** L'adoption de la livraison du lendemain. */
  forte: boolean;
  /** La part des PME du nord qui signe les prix palette. */
  adhesion: number;
  uPlainte: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000333 + 7);
  const conquete = r() < SCENARIO.chance;
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.025 * gauss(r), -0.06, 0.06));
  const uSuivi = r();
  const uEscalade = r();
  const sensibilite = {
    artisansZone: borne(1 + 0.15 * gauss(r), 0.7, 1.3),
    artisansNord: borne(1 + 0.15 * gauss(r), 0.7, 1.3),
    pmeZone: borne(1 + 0.1 * gauss(r), 0.8, 1.2),
    pmeNord: borne(1 + 0.12 * gauss(r), 0.75, 1.25),
  };
  const forte = r() < LIVRAISON.chanceForte;
  const adhesion = borne(ADHESION_ATTENDUE + 0.1 * gauss(r), 0.5, 0.8);
  const uPlainte = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    conquete,
    uSuivi,
    uEscalade,
    sensibilite,
    forte,
    adhesion,
    uPlainte,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La probabilité que Tarval suive la riposte de la semaine 1. */
export function chanceSuivi(chemin: readonly number[], conquete: boolean): number {
  const p = SUIVI.riposte[chemin[D.riposte]!]![conquete ? 0 : 1]!;
  return p > 0 && chemin[D.livraison] === 0 ? p + SUIVI.campagne : p;
}

/** Tarval suit-il notre riposte, en semaine 5 ? */
export const tarvalSuit = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return h.uSuivi < chanceSuivi(chemin, h.conquete);
};

/** La probabilité que Tarval surenchérisse si l'on suit sa promotion d'hiver. */
export function chanceEscalade(chemin: readonly number[], conquete: boolean): number {
  return chemin[D.promo] === 0 ? PROMO.escalade[conquete ? 0 : 1]! : 0;
}

export const tarvalSurencherit = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return h.uEscalade < chanceEscalade(chemin, h.conquete);
};

/** La plainte de Tarval, si l'on a fait pression sur le fabricant. */
export const plainte = (chemin: readonly number[], graine: number) =>
  chemin[D.fabricant] === 0 && hasard(graine).uPlainte < FABRICANT.chancePlainte;

/** La livraison est-elle en place pour l'an prochain ? */
export const livraisonEnPlace = (chemin: readonly number[], forte: boolean) =>
  chemin[D.livraison] === 1 || (chemin[D.livraison] === 2 && forte);

/** La part des PME du nord qui signe les prix palette. */
export const signataires = (chemin: readonly number[], h: Pick<Hasard, "adhesion" | "forte">) =>
  Math.min(0.9, h.adhesion + (livraisonEnPlace(chemin, h.forte) ? CONTRAT.avecLivraison : 0));

/* ---------------------------------------------------------------------------
 * LE MONDE D'UNE SEMAINE : ce que nos décisions et celles de Tarval font aux
 * prix, à la fuite et aux coûts.
 * ------------------------------------------------------------------------- */

/** Ce que le trimestre réserve, ou ce qu'on en suppose quand on ne le sait pas encore. */
export interface Monde {
  conquete: boolean;
  /** La semaine où Tarval suit nos baisses ; Infinity : jamais. */
  guerre: number;
  /** La semaine où la guerre s'aggrave, parce qu'on a suivi sa promotion en pleine guerre. */
  aggravee: number;
  forte: boolean;
  adhesion: number;
  /** La stratégie de Tarval est-elle connue ? Elle décide si sa promotion devient son prix. */
  annonce: boolean;
  /** Sa promotion d'hiver est-elle lancée ? */
  promo: boolean;
}

/** La semaine du régime : l'année qui suit le trimestre. */
const REGIME = 14;

interface Conditions {
  /** Par groupe (et, pour les PME du nord, signataires puis non-signataires). */
  groupes: {
    g: Groupe;
    poids: number;
    /** La fuite vers laquelle le groupe tend. */
    cible: number;
    /** Ce que nos baisses coûtent, en part du prix, sur les achats de base gardés. */
    remise: number;
    ecart: number;
  }[];
  /** Ce que les entreprises livrées achètent de plus, et ce qu'on leur rend. */
  gainLivres: number;
  remiseLivres: number;
  /** Les coûts de la semaine : camions, test, dépôt. */
  fixes: number;
  rfa: boolean;
  depot: boolean;
}

const intensitePromo = (w: number, m: Monde) => {
  if (!m.promo || w < PROMO.debut) return 0;
  if (w < REGIME) return PROMO.temporaire;
  return m.annonce && m.conquete ? 1 : 0;
};

/** La couverture de la livraison : la part de la région desservie, montée en charge comprise. */
export function couvertureLivraison(d2: number, w: number, forte: boolean): number {
  const montee = (depuis: number) => Math.min(1, Math.max(0, (w - depuis + 1) / LIVRAISON.montee));
  if (d2 === 1) return w >= REGIME ? 1 : w >= EFFET[D.livraison] ? montee(EFFET[D.livraison]) : 0;
  if (d2 !== 2) return 0;
  if (w >= REGIME) return forte ? 1 : 0;
  if (w < EFFET[D.livraison]) return 0;
  if (w <= LIVRAISON.test.fin) return LIVRAISON.test.agences * montee(EFFET[D.livraison]);
  return forte
    ? LIVRAISON.test.agences + (1 - LIVRAISON.test.agences) * montee(LIVRAISON.test.fin + 1)
    : 0;
}

function conditions(
  chemin: readonly number[],
  w: number,
  m: Monde,
  h: Hasard,
  commercial: boolean,
): Conditions {
  const regime = w >= REGIME;
  const a = (k: number) => w >= EFFET[k]!;
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const multiple = m.conquete ? SCENARIO.conquete : SCENARIO.rentabilite;
  const guerre = w >= m.guerre;
  const aggravee = w >= m.aggravee;
  const promo = intensitePromo(w, m);
  const couverture = couvertureLivraison(d2!, w, m.forte);
  const livraison = m.forte ? LIVRAISON.forte : LIVRAISON.faible;
  const phi = signataires(chemin, m);

  const groupes: Conditions["groupes"] = [];
  for (const g of GROUPES) {
    // La riposte de la semaine 1 : sur les références comparées (c1) et sur le reste de la base (r1).
    let c1 = 0;
    let r1 = 0;
    if (a(D.riposte)) {
      if (d1 === 0 || (d1 === 3 && g.zone)) {
        c1 = BAISSE_GENERALE;
        r1 = BAISSE_GENERALE;
      } else if (d1 === 1 && g.zone) {
        c1 = alignement(g.ecart);
      }
    }
    // Les baisses qui suivent : la carte des artisans, la baisse du nord.
    let c = 0;
    let r = 0;
    if (a(D.nord)) {
      if (d4 === 0 && g.segment === "artisans") {
        c += CARTE;
        r += CARTE;
      }
      if (d4 === 2 && !g.zone) {
        c = Math.max(c, BAISSE_NORD - c1);
        r = Math.max(r, BAISSE_NORD - r1);
      }
    }
    // Tarval : son écart, sa promotion, sa hausse de janvier s'il vise la rentabilité.
    const inc = PROMO.remise * (g.segment === "artisans" ? PROMO.artisans : PROMO.pme);
    let tarval = 1 - (1 - g.ecart) * (1 - inc * promo);
    if (regime && m.annonce && !m.conquete) tarval = 1 - (1 - tarval) * (1 + SCENARIO.hausse);
    // Le prix palette garanti par écrit aux PME de la zone : invisible pour Tarval, qui ne peut pas le suivre.
    let prive = 0;
    if (a(D.promo) && m.promo && w >= PROMO.debut) {
      // Suivre sa promotion : le temps qu'elle dure, puis un prix que les clients ne laissent pas remonter.
      if (d5 === 0) c += promo > 0 ? inc * promo : regime ? inc * PROMO.ancrage : 0;
      if (d5 === 2 && g.cle === "pmeZone") {
        // Le prix de sa promotion, guerre comprise, à 4 % près, figé jusqu'au 30 juin.
        const publique = c1 + c;
        const enPromo = 1 - (1 - g.ecart) * (1 - inc);
        const vise = alignement(guerre ? 1 - (1 - enPromo) * (1 - publique) : enPromo);
        prive = Math.max(0, vise - publique) * (regime ? PROMO.garantie : 1);
      }
    }
    let sens = g.sensibilite * multiple * h.sensibilite[g.cle];
    if (commercial && g.cle === "pmeZone") sens *= regime ? 1.1 : 1.25;
    if (g.segment === "artisans" && d2 === 0 && w >= CAMPAGNE.de && w <= CAMPAGNE.a) {
      sens *= CAMPAGNE.artisans;
    }
    if (g.segment === "pme") sens *= 1 - livraison.pme * couverture;
    // Le cap de décembre, pour l'année qui vient : la riposte ramenée à ce qui retient.
    let partCout = 1;
    let ecartEnPlus = 0;
    if (regime && d6 === 1) {
      if (g.cle === "artisansNord") c1 = 0;
      // Personne ne compare le reste de la gamme : la riposte n'y garde aucune baisse.
      r1 = 0;
      partCout = CAP.recentrage.cout;
      ecartEnPlus = c1 > 0 ? CAP.recentrage.ecart : 0;
    }
    // Les PME du nord se comptent en deux parts : celles qui signeraient le contrat, et les autres.
    const sousGroupes =
      g.cle === "pmeNord"
        ? [
            { poids: phi, signe: a(D.nord) && d4 === 1 },
            { poids: 1 - phi, signe: false },
          ]
        : [{ poids: 1, signe: false }];
    for (const sg of sousGroupes) {
      let baisse = c1 + c + prive;
      let reste = r1 + r;
      let engagement = 1;
      if (sg.signe) {
        // La ristourne n'est due que sur les volumes gardés ; l'engagement retient.
        baisse += CONTRAT.ristourne;
        reste += CONTRAT.ristourne;
        engagement = regime && d6 !== 1 ? CONTRAT.sansRenouvellement : CONTRAT.engagement;
      }
      // Des prix garantis égaux à ceux de Tarval, dans la zone, toute l'année.
      if (regime && d6 === 0 && g.zone) baisse += Math.max(0, tarval - baisse);
      // En guerre, Tarval suit chacune de nos baisses : son écart revient.
      const tarvalSuivi = guerre ? 1 - (1 - tarval) * (1 - (baisse - prive)) : tarval;
      const ecart = ecartPercu(tarvalSuivi, baisse) + ecartEnPlus;
      const erosion = guerre ? EROSION.enlevement * (aggravee ? 2 : 1) : 0;
      const coutComparees = baisse - c1 * (1 - partCout);
      const remise = g.comparees * coutComparees + (1 - g.comparees) * reste + erosion;
      groupes.push({
        g,
        poids: sg.poids,
        cible: sens * reponse(ecart) * engagement,
        remise,
        ecart,
      });
    }
  }

  let fixes = 0;
  if (d2 === 1 && w >= EFFET[D.livraison]) fixes += LIVRAISON.coutAnnuel / SEMAINES_PAR_AN;
  if (d2 === 2 && w >= EFFET[D.livraison]) {
    if (w <= LIVRAISON.test.fin) fixes += LIVRAISON.test.hebdo;
    else if (m.forte) fixes += LIVRAISON.coutAnnuel / SEMAINES_PAR_AN;
  }
  const depot = regime && d6 === 2;
  if (depot) fixes += CAP.depot.hebdo;
  return {
    groupes,
    gainLivres: (m.forte ? LIVRAISON.forte : LIVRAISON.faible).entreprises * couverture,
    remiseLivres: guerre ? EROSION.livres * (aggravee ? 2 : 1) : 0,
    fixes,
    rfa: a(D.fabricant) && d3 === 1,
    depot,
  };
}

/** Ce qu'une semaine rapporte, selon la fuite de chaque groupe. */
interface Bilan {
  marge: number;
  contribution: number;
  ca: number;
  /** Les achats de base gardés, par segment, rapportés au plan. */
  artisans: number;
  artisansZone: number;
  pme: number;
  pmeNord: number;
  pmeZone: number;
  /** L'écart perçu au comptoir, dans la zone. */
  ecart: number;
  rfa: number;
}

function compter(
  cond: Conditions,
  fuites: readonly number[],
  o: { ventes: number; livres: number; margeBase: number; conquete: boolean },
): Bilan {
  const mB = TAUX_DE_MARQUE.base + o.margeBase;
  const mT = TAUX_DE_MARQUE.technique;
  let marge = 0;
  let ca = 0;
  let baseGardee = 0;
  let volume = 0;
  let parti = 0;
  let zoneGardee = 0;
  let margeZone = 0;
  const seg = { artisans: 0, artisansZone: 0, pme: 0, pmeNord: 0, pmeZone: 0 };
  cond.groupes.forEach((x, i) => {
    const lambda = fuites[i]!;
    const base = x.g.base * x.poids * o.ventes;
    const garde = base * (1 - lambda);
    const tech = (x.g.technique * x.poids - ENTRAINEMENT * x.g.base * x.poids * lambda) * o.ventes;
    marge += garde * (mB - x.remise) + tech * mT;
    ca += garde * (1 - x.remise) + tech;
    baseGardee += garde;
    volume += x.g.base * x.poids * (1 - lambda);
    parti += base * lambda;
    if (x.g.zone) {
      zoneGardee += garde;
      margeZone += garde * (mB - x.remise);
    }
    const plan = x.g.base * x.poids;
    if (x.g.segment === "artisans") {
      seg.artisans += plan * (1 - lambda);
      if (x.g.zone) seg.artisansZone += plan * (1 - lambda);
    } else {
      seg.pme += plan * (1 - lambda);
      if (x.g.zone) seg.pmeZone += plan * (1 - lambda);
      else seg.pmeNord += plan * (1 - lambda);
    }
  });
  const livres = 1 + cond.gainLivres;
  const baseE = BASE_E * livres * o.livres;
  marge += baseE * (mB - cond.remiseLivres) + TECH_E * livres * o.livres * mT;
  ca += baseE * (1 - cond.remiseLivres) + TECH_E * livres * o.livres;
  baseGardee += baseE;
  volume += BASE_E * livres;
  // La remise conditionnelle du fabricant, selon les volumes tenus.
  let rfa = 0;
  if (cond.rfa) {
    const ratio = volume / BASE_PLAN;
    const taux = Math.min(
      1,
      Math.max(0, (ratio - FABRICANT.nul) / (FABRICANT.plein - FABRICANT.nul)),
    );
    rfa = FABRICANT.rfa * taux * FABRICANT.part * (1 - TAUX_DE_MARQUE.base) * baseGardee;
  }
  marge += rfa;
  // Le dépôt à bas prix : il reprend une part de ce qui est parti, et prend aux agences de la zone.
  let depot = 0;
  if (cond.depot) {
    const k = o.conquete ? 0 : 1;
    depot =
      CAP.depot.reprise[k]! * parti * CAP.depot.margeReprise -
      CAP.depot.cannibalisation * (margeZone - zoneGardee * CAP.depot.margeReprise);
  }
  marge += depot;
  const zoneArtisans = cond.groupes.find((x) => x.g.cle === "artisansZone")!;
  const pBase = (cle: "artisans" | "pme") =>
    GROUPES.filter((g) => g.segment === cle).reduce((s, g) => s + g.base, 0);
  const pNord = GROUPES.find((g) => g.cle === "pmeNord")!.base;
  const pZone = GROUPES.find((g) => g.cle === "pmeZone")!.base;
  const aZone = GROUPES.find((g) => g.cle === "artisansZone")!.base;
  return {
    marge,
    contribution: marge - cond.fixes,
    ca,
    artisans: seg.artisans / pBase("artisans"),
    artisansZone: seg.artisansZone / aZone,
    pme: seg.pme / pBase("pme"),
    pmeNord: seg.pmeNord / pNord,
    pmeZone: seg.pmeZone / pZone,
    ecart: zoneArtisans.ecart,
    rfa,
  };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR DES POSITIONS : une année pleine au régime atteint.
 * ------------------------------------------------------------------------- */

/** Les décisions qui ne sont pas encore en vigueur une semaine donnée comptent comme « ne rien changer ». */
const enVigueur = (chemin: readonly number[], w: number) =>
  chemin.map((o, k) => (w >= EFFET[k]! ? o : NEUTRE[k]!));

/** La contribution d'une semaine de l'année qui vient, dans un monde donné, en écart au plan. */
function ecartAuRegime(chemin: readonly number[], m: Monde, h: Hasard, commercial: boolean) {
  const cond = conditions(chemin, REGIME, m, h, commercial);
  const b = compter(
    cond,
    cond.groupes.map((x) => x.cible),
    { ventes: 1, livres: 1, margeBase: 0, conquete: m.conquete },
  );
  return b.contribution - MARGE_PLAN;
}

/** Ce que l'on sait en fin de semaine w ; le reste est compté en espérance. */
export interface Savoir {
  scenario: boolean;
  suivi: boolean;
  escalade: boolean;
  adoption: boolean;
}

const savoirA = (w: number): Savoir => ({
  scenario: w >= SCENARIO.annonce,
  suivi: w >= SUIVI.semaine,
  escalade: w >= PROMO.semaineEscalade,
  adoption: w >= LIVRAISON.test.fin,
});

/**
 * LA VALEUR DES POSITIONS, estimée en fin de semaine w : une année pleine au
 * régime, en espérance sur ce qu'on ne sait pas encore.
 */
export function valeurDesPositions(chemin: readonly number[], graine: number, w: number): number {
  const h = hasard(graine);
  const c = enVigueur(chemin, w);
  const s = savoirA(w);
  const commercial = h.imprevus.some((i) => i.imprevu.id === "commercial" && i.semaine <= w);
  const scenarios = s.scenario
    ? [{ p: 1, conquete: h.conquete }]
    : [
        { p: SCENARIO.chance, conquete: true },
        { p: 1 - SCENARIO.chance, conquete: false },
      ];
  const adoptions = s.adoption
    ? [{ p: 1, forte: h.forte }]
    : [
        { p: LIVRAISON.chanceForte, forte: true },
        { p: 1 - LIVRAISON.chanceForte, forte: false },
      ];
  let total = 0;
  for (const sc of scenarios) {
    // La réaction à la riposte : connue après la semaine 5, sinon en espérance.
    const pSuivi = chanceSuivi(c, sc.conquete);
    const suivis =
      w < EFFET[D.riposte]
        ? [{ p: 1, oui: false }]
        : s.suivi
          ? [{ p: 1, oui: h.uSuivi < chanceSuivi(c, h.conquete) }]
          : [
              { p: pSuivi, oui: true },
              { p: 1 - pSuivi, oui: false },
            ];
    const pEsc = chanceEscalade(c, sc.conquete);
    const escalades =
      w < EFFET[D.promo]
        ? [{ p: 1, oui: false }]
        : s.escalade
          ? [{ p: 1, oui: h.uEscalade < chanceEscalade(c, h.conquete) }]
          : [
              { p: pEsc, oui: true },
              { p: 1 - pEsc, oui: false },
            ];
    for (const su of suivis) {
      for (const es of escalades) {
        for (const ad of adoptions) {
          const p = sc.p * su.p * es.p * ad.p;
          if (p === 0) continue;
          const base: Monde = {
            conquete: sc.conquete,
            guerre: su.oui ? SUIVI.semaine : es.oui ? PROMO.semaineEscalade : Infinity,
            aggravee: su.oui && es.oui ? PROMO.semaineEscalade : Infinity,
            forte: ad.forte,
            adhesion: w >= EFFET[D.nord] ? h.adhesion : ADHESION_ATTENDUE,
            annonce: s.scenario,
            promo: w >= PROMO.debut,
          };
          let v = ecartAuRegime(c, base, h, commercial);
          // Des prix garantis un an : Tarval suit, ou non, l'an prochain ; compté en espérance.
          if (c[D.cap] === 0 && base.guerre === Infinity) {
            const q = CAP.garantis.guerre[sc.conquete ? 0 : 1]!;
            const enGuerre = ecartAuRegime(c, { ...base, guerre: REGIME }, h, commercial);
            v = (1 - q) * v + q * enGuerre;
          }
          total += p * v * SEMAINES_PAR_AN;
        }
      }
    }
  }
  return total;
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur estimée en fin de semaine, en écart au plan, en euros. */
  valeur: number;
  variation: number;
  /** La marge commerciale de la semaine, et la contribution, coûts des actions déduits. */
  marge: number;
  contribution: number;
  ca: number;
  /** L'écart de prix avec Tarval au comptoir, dans la zone. */
  ecart: number;
  /** Les achats de base gardés, rapportés au plan (1 : rien de perdu). */
  artisans: number;
  artisansZone: number;
  pme: number;
  pmeNord: number;
  pmeZone: number;
  /** Tarval suit-il nos baisses (1) ou non (0) ? */
  guerre: number;
};

/** Le monde réel du trimestre, tel que le hasard l'a tiré. */
export function mondeReel(chemin: readonly number[], graine: number): Monde {
  const h = hasard(graine);
  const suit = tarvalSuit(chemin, graine);
  const esc = tarvalSurencherit(chemin, graine);
  return {
    conquete: h.conquete,
    guerre: suit ? SUIVI.semaine : esc ? PROMO.semaineEscalade : Infinity,
    aggravee: suit && esc ? PROMO.semaineEscalade : Infinity,
    forte: h.forte,
    adhesion: h.adhesion,
    annonce: false,
    promo: true,
  };
}

/** Les sommes engagées une semaine donnée, hors coûts hebdomadaires. */
function ponctuel(chemin: readonly number[], graine: number, w: number): number {
  let s = 0;
  if (chemin[D.livraison] === 0 && w >= CAMPAGNE.de && w < CAMPAGNE.de + 4) s += CAMPAGNE.cout / 4;
  if (chemin[D.livraison] === 2 && w === EFFET[D.livraison]) s += LIVRAISON.test.miseEnPlace;
  if (chemin[D.fabricant] === 0 && w === EFFET[D.fabricant]) s += FABRICANT.cooperation;
  if (plainte(chemin, graine) && w === FABRICANT.semainePlainte) s += FABRICANT.provision;
  if (chemin[D.cap] === 2 && w === EFFET[D.cap]) s += CAP.depot.ouverture;
  return s;
}

/** La provision attendue d'une plainte qu'on ne connaît pas encore. */
const plainteAttendue = (chemin: readonly number[], w: number) =>
  chemin[D.fabricant] === 0 && w >= EFFET[D.fabricant] && w < FABRICANT.semainePlainte
    ? FABRICANT.chancePlainte * FABRICANT.provision
    : 0;

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur estimée avant la première décision : ce que coûterait de ne rien faire. */
  depart: number;
  /** La valeur estimée en semaine 13, en écart au plan d'avant Tarval. */
  objectif: number;
  /** La marge du trimestre, coûts des actions déduits, en écart au plan. */
  trimestre: number;
  /** La valeur des positions : une année pleine au régime atteint. */
  positions: number;
  conquete: boolean;
  guerre: boolean;
  escalade: boolean;
  forte: boolean;
  /** La part des PME du nord qui a signé, si on leur a proposé les prix palette. */
  signataires: number | null;
  plainte: boolean;
  rfa: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const m = mondeReel(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let fuites: number[] | null = null;
  let cumul = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const depart = valeurDesPositions(chemin, graine, 0);
  let avant = depart;
  let rfa = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const tombe = (id: string, duree = 13) =>
      h.imprevus.some((i) => i.imprevu.id === id && w >= i.semaine && w < i.semaine + duree);
    const cond = conditions(
      chemin,
      w,
      { ...m, annonce: w >= SCENARIO.annonce },
      h,
      tombe("commercial"),
    );
    const cibles = cond.groupes.map((x) => (w >= OUVERTURE ? x.cible : 0));
    fuites = (fuites ?? cibles.map(() => 0)).map((l, i) => l + VITESSE * (cibles[i]! - l));
    const ventes =
      (1 + h.bruit[w]!) * (tombe("intemperies", 2) ? 0.85 : 1) * (tombe("erp", 1) ? 0.94 : 1);
    const livres = ventes * (tombe("zac", 4) ? 1.06 : 1);
    const b = compter(cond, fuites, {
      ventes,
      livres,
      margeBase: tombe("ciment") ? -0.008 : 0,
      conquete: m.conquete,
    });
    rfa += b.rfa;
    cumul += b.contribution - MARGE_PLAN - ponctuel(chemin, graine, w);
    const valeur = cumul - plainteAttendue(chemin, w) + valeurDesPositions(chemin, graine, w);
    semaines.push({
      valeur,
      variation: valeur - avant,
      marge: b.marge,
      contribution: b.contribution,
      ca: b.ca,
      ecart: b.ecart,
      artisans: b.artisans,
      artisansZone: b.artisansZone,
      pme: b.pme,
      pmeNord: b.pmeNord,
      pmeZone: b.pmeZone,
      guerre: w >= m.guerre ? 1 : 0,
    });
    avant = valeur;
  }
  const fin = semaines[SEMAINES]!;
  const positions = valeurDesPositions(chemin, graine, SEMAINES);
  return {
    semaines,
    depart,
    objectif: fin.valeur,
    trimestre: fin.valeur - positions,
    positions,
    conquete: h.conquete,
    guerre: m.guerre <= SEMAINES,
    escalade: tarvalSurencherit(chemin, graine),
    forte: h.forte,
    signataires: chemin[D.nord] === 1 ? signataires(chemin, h) : null,
    plainte: plainte(chemin, graine),
    rfa,
  };
}

/** Ce qui s'est passé pendant des semaines : réactions de Tarval, test, contrats, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const riposte = chemin[D.riposte] !== 2;
  return {
    ouverture: dans(OUVERTURE),
    suivi: riposte && dans(SUIVI.semaine),
    test: (chemin[D.livraison] === 1 || chemin[D.livraison] === 2) && dans(LIVRAISON.test.fin),
    plainte: chemin[D.fabricant] === 0 && dans(FABRICANT.semainePlainte),
    contrats: chemin[D.nord] === 1 && dans(EFFET[D.nord]),
    promo: dans(PROMO.debut),
    annonce: dans(SCENARIO.annonce),
    escalade: chemin[D.promo] === 0 && dans(PROMO.semaineEscalade),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDiscounter {
  valeur: number | null;
  marge: number | null;
  ecart: number | null;
  pme: number | null;
  artisans: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  pmeZone: number | null;
  pmeNord: number | null;
  artisansZone: number | null;
  /** 1 : Tarval a suivi nos baisses ; 0 : non ; −1 : on ne le sait pas encore. */
  guerre: number | null;
  /** 1 : Tarval vise la part de marché ; 0 : la rentabilité ; −1 : pas encore connu. */
  conquete: number | null;
  /** 1 : la livraison est adoptée ; 0 : non ; −1 : pas encore connu. */
  forte: number | null;
  /** La part des PME du nord qui a signé, une fois le contrat proposé. */
  signataires: number | null;
  /** La marge du trimestre, coûts des actions déduits, en écart au plan, à date. */
  cumul: number | null;
}

/**
 * Ce que Faustine lit à la fin d'une semaine ; les décisions à venir
 * comptent comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDiscounter {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      valeur: valeurDesPositions(NEUTRE, graine, 0),
      marge: MARGE_PLAN,
      ecart: ECART_TARVAL.comptoir,
      pme: 1,
      artisans: 1,
      pmeZone: 1,
      pmeNord: 1,
      artisansZone: 1,
      guerre: -1,
      conquete: -1,
      forte: -1,
      signataires: null,
      cumul: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    valeur: s.valeur,
    marge: s.marge,
    ecart: s.ecart,
    pme: s.pme,
    artisans: s.artisans,
    pmeZone: s.pmeZone,
    pmeNord: s.pmeNord,
    artisansZone: s.artisansZone,
    guerre: semaine >= SUIVI.semaine ? s.guerre : -1,
    conquete: semaine >= SCENARIO.annonce ? (h.conquete ? 1 : 0) : -1,
    forte: semaine >= LIVRAISON.test.fin ? (h.forte ? 1 : 0) : -1,
    signataires: chemin[D.nord] === 1 && semaine >= EFFET[D.nord] ? signataires(chemin, h) : null,
    cumul: s.valeur - valeurDesPositions(chemin, graine, semaine),
  };
}
