/**
 * LE MARCHÉ QUI S'OUVRE — le modèle de l'entrée d'Arvel Distribution sur le
 * marché de la rénovation énergétique des maisons.
 *
 * Isolation, menuiseries, pompes à chaleur : les propriétaires de maisons
 * rénovent, aidés par l'État, et cherchent un interlocuteur unique. Arvel
 * peut leur vendre des « bouquets de travaux » clés en main, posés par les
 * artisans RGE qui sont ses clients. Un cabinet de conseil promet un marché
 * énorme ; le président veut être le premier ; un installateur intégré,
 * Solvéane, regarde la région. Geneviève Rivoallan, directrice de la
 * stratégie, a treize semaines et six décisions.
 *
 * La valeur d'une entrée sur un marché se joue sur des années ; un épisode
 * dure un trimestre. Le trimestre est donc jugé sur la VALEUR CRÉÉE ESTIMÉE en
 * semaine 13, en euros :
 *
 *   valeur = résultat du trimestre (marge des bouquets signés, moins les
 *            ouvertures, les charges fixes des agences équipées, la campagne,
 *            les contrats signés, le temps d'enquête)
 *          + valeur de la position prise pour l'an prochain : la VAN, sur
 *            trois ans au taux de 10 %, de la contribution des agences que le
 *            plan engage (bouquets × marge − charges fixes), moins les
 *            ouvertures et fermetures qu'il entraîne, les pénalités des
 *            contrats signés et la décote du stock en trop ; une agence sous
 *            son seuil de rentabilité n'est portée qu'un an, puis fermée ;
 *          − la marge de négoce perdue si Solvéane s'implante et prend les
 *            artisans comme sous-traitants.
 *
 * Tout est recalculé avec ce que le trimestre a révélé : le scénario du
 * marché (connu par l'annonce du budget en semaine 7 et par les chiffres du
 * test en semaine 8), et la décision de Solvéane (semaine 12). Avant, la
 * valeur est estimée en espérance, aux probabilités du moment. Ne rien faire
 * ne prend aucune position : l'attente vaut zéro, moins ce que Solvéane
 * coûte au négoce s'il arrive. Une entrée tardive, dans un an, n'est pas
 * comptée : rien n'est engagé pour elle.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · UN TEST EST UNE OPTION RÉELLE. Le marché accessible se calcule par le
 *     bas (400 000 maisons, 3 % qui rénovent chaque année, 4 chantiers sur 10
 *     vendus en bouquet, 15 k€ le bouquet : 72 M€), pas avec les 650 M€ du
 *     cabinet. Mais à quel rythme les clients signeront, personne ne le sait :
 *     trois scénarios, porteur, moyen, difficile (aides réduites). Ouvrir les
 *     trente agences d'un coup gagne un trimestre, et perd gros deux fois sur
 *     trois ; un test dans trois agences coûte peu, et permet d'étendre là où
 *     les chiffres le justifient — tout le réseau, les dix grandes agences,
 *     ou rien. Attendre, c'est ne rien apprendre et laisser le terrain.
 *   · UN TEST NE VAUT QUE CE QU'IL MESURE. Les dix grandes agences vendent
 *     1,75 fois plus que les vingt autres. Un test dans les trois plus
 *     grosses, ou jugé sur un chiffre d'affaires moyen sans protocole,
 *     « réussit » dans le scénario moyen, et fait étendre à des agences qui ne
 *     couvriront jamais leurs charges fixes. Seul un test sur des agences
 *     représentatives, jugé agence par agence contre le seuil de rentabilité,
 *     dit où étendre. Réviser l'ambition sur ses chiffres, à la hausse ou à la
 *     baisse, est alors la décision qui crée le plus de valeur ; tenir le plan
 *     annoncé, ou accélérer, la détruit.
 *   · LA RESSOURCE RARE, CE SONT LES ARTISANS, ET L'ENGAGEMENT SE PAIE.
 *     Solvéane s'implante plus volontiers là où un négociant a validé le
 *     marché à grand bruit, et renonce là où les artisans RGE sont déjà
 *     engagés ailleurs. Une charte de partenariat avec quarante artisans,
 *     sans exclusivité ni volume, protège à peu de frais ; une exclusivité
 *     avec volume garanti, ou l'exclusivité d'un fabricant calée sur les
 *     volumes du cabinet, se paie en pénalités dès que le marché déçoit. Une
 *     riposte préparée, déclenchée seulement si Solvéane arrive, vaut mieux
 *     qu'une baisse de prix préventive.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le cabinet facture sa présence au comité reporté. */
export const PERTE_PAR_JOUR = 2000;

/* ---------------------------------------------------------------------------
 * LE MARCHÉ : ce que les sources de la semaine 1 permettent de calculer.
 * ------------------------------------------------------------------------- */

/** Le marché accessible dans la zone des trente agences, calculé par le bas. */
export const MARCHE = {
  /** Les maisons individuelles de la zone de chalandise des agences. */
  maisons: 400000,
  /** La part qui engage chaque année des travaux de rénovation énergétique aidés. */
  renovation: 0.03,
  /** La part de ces chantiers vendus en bouquet coordonné : plusieurs lots, un interlocuteur. */
  bouquet: 0.4,
  /** Le prix moyen d'un bouquet, pose comprise, hors taxes. */
  panier: 15000,
} as const;
/** Le chiffre d'affaires annuel accessible, en euros : 72 M€. */
export const MARCHE_ACCESSIBLE =
  MARCHE.maisons * MARCHE.renovation * MARCHE.bouquet * MARCHE.panier;
/** Ce que le cabinet annonce : le marché régional, et la part qu'Arvel pourrait en prendre. */
export const CABINET = { marche: 650e6, part: 0.15 } as const;

/** Les agences du réseau : dix grandes, urbaines et périurbaines, vingt autres. */
export const AGENCES = { grandes: 10, autres: 20 } as const;
/** Ce qu'une agence vend, rapporté à la moyenne du réseau. */
export const FACTEUR = { grande: 1.4, autre: 0.8 } as const;

/** La marge sur coût variable d'Arvel sur un bouquet : matériaux et commission de coordination. */
export const MARGE = 1500;
/** La part de cette marge qui vient de la commission de coordination. */
export const COMMISSION = 450;
/** Les charges fixes annuelles d'une agence équipée : un conseiller pour trois agences, outils, animation. */
export const FIXE = 16500;
/** Ouvrir l'offre dans une agence : formation, espace conseil, communication locale. */
export const OUVERTURE = 6000;
/** La fermer après l'avoir ouverte : reclassement du conseiller, déstockage. */
export const FERMETURE = 4000;
/** Le taux et l'horizon de la valeur de la position. */
export const TAUX = 0.1;
export const HORIZON = 3;

/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
/** Ce que vaut un euro de contribution annuelle sur l'horizon : 2,49. */
export const MULTIPLE = annuite(HORIZON, TAUX);

/** Le seuil de rentabilité d'une agence, en bouquets par an : 11. */
export const SEUIL = FIXE / MARGE;
/** Le même, ouverture comprise, amortie sur l'horizon : 12,6. */
export const SEUIL_OUVERTURE = (FIXE + OUVERTURE / MULTIPLE) / MARGE;

export type CodeScenario = "porteur" | "moyen" | "difficile";

export interface Scenario {
  id: CodeScenario;
  nom: string;
  chance: number;
  /** Les bouquets qu'une agence moyenne signe par an, une fois l'offre installée. */
  bouquets: number;
  /** Les aides de l'État sont-elles maintenues l'an prochain ? */
  aides: boolean;
}

/**
 * LE SCÉNARIO DU MARCHÉ, tiré au début du trimestre. L'économiste de la
 * fédération le dit à peu près : une chance sur trois que tout se passe
 * bien, un peu moins d'une sur deux que l'adoption traîne, une sur quatre
 * que les aides baissent.
 */
export const SCENARIOS: readonly Scenario[] = [
  { id: "porteur", nom: "porteur", chance: 0.3, bouquets: 20, aides: true },
  { id: "moyen", nom: "moyen", chance: 0.45, bouquets: 13, aides: true },
  { id: "difficile", nom: "difficile", chance: 0.25, bouquets: 7, aides: false },
];
export const scenario = (id: CodeScenario) => SCENARIOS.find((s) => s.id === id)!;

/** La semaine des ouvertures, de l'annonce du budget, des chiffres du test, et de la décision de Solvéane. */
export const CALENDRIER = { ouverture: 3, aides: 7, resultats: 8, solveane: 12 } as const;

/* ---------------------------------------------------------------------------
 * CE QUE CHAQUE DÉCISION ENGAGE.
 * ------------------------------------------------------------------------- */

/** Le lancement : la campagne et le stock qu'il demande, selon l'ampleur. */
export const LANCEMENT = [
  { campagne: 80000, stock: 250000 },
  { campagne: 40000, stock: 120000 },
  { campagne: 0, stock: 0 },
  { campagne: 0, stock: 0 },
] as const;
/** Le stock dont un bouquet a besoin, et la décote du stock en trop, revendu. */
export const STOCK_PAR_BOUQUET = 420;
export const DECOTE = 0.2;
/** Le protocole de mesure du test : suivi agence par agence, contrôle de gestion. */
export const PROTOCOLE = 8000;
/** Le premier entrant : les agences ouvertes dès ce trimestre signent 3 % de bouquets en plus. */
export const PREMIER = 0.03;
/** La montée en charge d'une agence : 40 % la première semaine, 15 points de plus chaque semaine. */
export const RAMPE = { depart: 0.4, pas: 0.15 } as const;

/** Les artisans RGE : exclusivité avec volume garanti, charte de partenariat, ou rien. */
export const ARTISANS = {
  exclusivite: {
    nombre: 120,
    frais: 30000,
    /** Les chantiers garantis à chaque artisan, par an, pendant deux ans. */
    garantie: 2,
    annees: 2,
    penalite: 300,
    /** Ce que l'engagement retire à la probabilité que Solvéane s'implante. */
    dissuasion: 0.2,
    /** La part des bouquets perdue si Solvéane s'implante, et la marge de négoce perdue. */
    perte: 0.04,
    negoce: 8000,
  },
  charte: { nombre: 40, frais: 20000, dissuasion: 0.12, perte: 0.1, negoce: 30000 },
  aucun: { nombre: 0, frais: 0, dissuasion: 0, perte: 0.25, negoce: 80000 },
} as const;

/**
 * Le fabricant de pompes à chaleur, Nordhalm. Une pompe à chaleur dans 4
 * bouquets sur 10, à 2 500 € net la pompe : une remise de 8 % ajoute 200 €
 * par pompe, 80 € par bouquet.
 */
const PRIX_PAC = 2500;
const PART_PAC = 0.4;
export const FABRICANT = {
  prixPAC: PRIX_PAC,
  partPAC: PART_PAC,
  exclusivite: {
    taux: 0.08,
    remise: PRIX_PAC * 0.08 * PART_PAC,
    cofinancement: 0.4,
    volume: 300,
    penalite: 250,
  },
  referencement: { taux: 0.03, remise: PRIX_PAC * 0.03 * PART_PAC, chance: 0.6 },
  partage: { cofinancement: 0.5, redevance: 250 },
} as const;

/** Solvéane : sa probabilité de s'implanter selon le lancement d'Arvel (pas de dissuasion). */
export const SOLVEANE = { base: [0.75, 0.6, 0.4, 0.55], ripostePrix: 0.1 } as const;
/**
 * La riposte : une baisse de commission d'un tiers, annoncée par une
 * campagne, ou une riposte ciblée préparée et déclenchée seulement si
 * Solvéane arrive.
 */
export const RIPOSTE = {
  prix: COMMISSION / 3,
  annonce: 5000,
  ciblee: { cout: 5000, attenuation: 0.5, attenuationSansArtisans: 0.75 },
} as const;
/** Prolonger le test six mois : l'extension garde 55 % de sa valeur. */
export const DIFFERE = 0.55;

/** La valeur que la direction attend des décisions du trimestre, et l'enveloppe réservée au lancement. */
export const OBJECTIF_VALEUR = 100000;
export const ENVELOPPE = 500000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  entree: 0,
  test: 1,
  artisans: 2,
  fabricant: 3,
  extension: 4,
  riposte: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;

/** Ne rien changer, décision par décision : attendre, laisser faire, ne rien signer, tenir le plan. */
export const NEUTRE = [3, 2, 2, 2, 0, 2] as const;

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
  effet: { bouquets?: number; marge?: number; negoce?: number; agence?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "reportage",
    titre: "Un reportage sur les fraudes à la rénovation",
    de: "Eulalie Chanteloup",
    role: "Cheffe d'agence, Villefranche-sur-Saône",
    texte:
      "Hier soir, un reportage sur les démarcheurs qui arnaquent les retraités avec des pompes à chaleur. Ce matin, deux clients ont annulé leur rendez-vous. Ça va peser trois semaines, au moins.",
    duree: 3,
    effet: { bouquets: -0.3 },
  },
  {
    id: "credit",
    titre: "Les banques resserrent les prêts à la rénovation",
    de: "Solange Videau",
    role: "Directrice administrative et financière",
    texte:
      "Deux banques régionales durcissent les conditions de leurs prêts travaux : apport exigé, taux relevé. Les particuliers qui financent leur reste à charge vont hésiter un mois.",
    duree: 4,
    effet: { bouquets: -0.2 },
  },
  {
    id: "hausse",
    titre: "Les fabricants de pompes à chaleur augmentent leurs prix",
    de: "Lukas Brenner",
    role: "Responsable grands comptes, Nordhalm",
    texte:
      "Tous les fabricants passent une hausse de 3 % sur les pompes à chaleur au premier du mois, nous compris : le cuivre et les composants. Sur un bouquet, comptez 45 € de marge en moins.",
    duree: 13,
    effet: { marge: -45 },
  },
  {
    id: "promoteur",
    titre: "Un promoteur commande les menuiseries d'un lotissement",
    de: "Marwan Oukacha",
    role: "Directeur du réseau des agences",
    texte:
      "Bonne nouvelle côté négoce : un promoteur nous confie les menuiseries de ses 60 maisons à Genas. 12 k€ de marge sur le trimestre, sans rapport avec les particuliers.",
    duree: 1,
    effet: { negoce: 12000 },
  },
  {
    id: "conseiller",
    titre: "Un conseiller rénovation s'arrête deux semaines",
    de: "Eulalie Chanteloup",
    role: "Cheffe d'agence, Villefranche-sur-Saône",
    texte:
      "Notre conseiller rénovation se casse le poignet au foot : deux semaines d'arrêt. Les rendez-vous chez les particuliers des agences qu'il suit sont reportés.",
    duree: 2,
    effet: { agence: 3 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: CodeScenario;
  /** Solvéane s'implante si ce tirage est sous sa probabilité, que les décisions font varier. */
  uSolveane: number;
  /** Les agences qui se portent volontaires : deux grandes sur trois, ou une. */
  uVolontaires: number;
  /** Nordhalm accepte-t-il un référencement sans volume ? */
  uFabricant: number;
  /** L'écart des bouquets de chaque semaine au rythme du scénario (indices 1 à 13). */
  bruit: readonly number[];
  /** L'écart du rythme mesuré par le test, dans les grandes agences et dans les autres. */
  mesure: { grande: number; autre: number };
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000367 + 7);
  const uVolontaires = r();
  const uFabricant = r();
  const uSolveane = r();
  const grande = borne(0.04 * gauss(r), -0.08, 0.08);
  const u = r();
  const scenario: CodeScenario = u < 0.3 ? "porteur" : u < 0.75 ? "moyen" : "difficile";
  const mesure = { grande, autre: borne(0.04 * gauss(r), -0.08, 0.08) };
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.2 * gauss(r), -0.4, 0.4));
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = { scenario, uSolveane, uVolontaires, uFabricant, bruit, mesure, imprevus };
  tirages.set(graine, h);
  return h;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/* ---------------------------------------------------------------------------
 * LES AGENCES : celles du trimestre, celles du plan de l'an prochain.
 * ------------------------------------------------------------------------- */

export interface Parc {
  grandes: number;
  autres: number;
}
const VIDE: Parc = { grandes: 0, autres: 0 };
const TOUT: Parc = { grandes: AGENCES.grandes, autres: AGENCES.autres };
const GRANDES: Parc = { grandes: AGENCES.grandes, autres: 0 };
export const total = (p: Parc) => p.grandes + p.autres;

/** Les agences équipées pendant le trimestre, selon le lancement et le choix des agences du test. */
export function implantation(chemin: readonly number[], graine: number): Parc {
  const [d1, d2] = chemin;
  if (d1 === 0) return TOUT;
  if (d1 === 1) return d2 === 1 ? { grandes: AGENCES.grandes, autres: 2 } : GRANDES;
  if (d1 === 2) {
    if (d2 === 0) return { grandes: 3, autres: 0 };
    if (d2 === 1) return { grandes: 1, autres: 2 };
    return hasard(graine).uVolontaires < 0.5
      ? { grandes: 2, autres: 1 }
      : { grandes: 1, autres: 2 };
  }
  return VIDE;
}

/** Le plan que le comité a validé en semaine 1 pour janvier : ce que « tenir le plan » veut dire. */
export const PLAN_ANNONCE: readonly Parc[] = [TOUT, TOUT, GRANDES, VIDE];

/** Le plan que justifie un scénario : là où les agences couvrent charges fixes et ouverture. */
export function planJustifie(s: CodeScenario): Parc {
  return s === "porteur" ? TOUT : s === "moyen" ? GRANDES : VIDE;
}

/**
 * CE QUE LE TEST FAIT CROIRE. Jugé agence par agence sur des agences
 * représentatives, il dit le vrai scénario. Mené dans les plus grosses, ou
 * jugé sur un chiffre d'affaires moyen sans protocole, il fait passer le
 * scénario moyen pour porteur : la moyenne dépasse le seuil, les petites
 * agences non. Sans test, il n'y a rien à lire.
 */
export function lecture(chemin: readonly number[], graine: number): CodeScenario | null {
  if (chemin[D.entree] === 3) return null;
  const s = hasard(graine).scenario;
  if (chemin[D.test] === 1) return s;
  return s === "moyen" ? "porteur" : s;
}

/** Le plan de l'an prochain que la décision de la semaine 8 engage. */
export function planDe(chemin: readonly number[], graine: number): Parc {
  const d1 = chemin[D.entree]!;
  switch (chemin[D.extension]) {
    case 1: {
      const l = lecture(chemin, graine);
      return l ? planJustifie(l) : PLAN_ANNONCE[d1]!;
    }
    case 2:
      return implantation(chemin, graine);
    case 3:
      return TOUT;
    default:
      return PLAN_ANNONCE[d1]!;
  }
}

/** La probabilité que Solvéane s'implante, selon ce qu'Arvel a fait et signé. */
export function probaSolveane(chemin: readonly number[], semaine = SEMAINES): number {
  const dit = (k: number) => semaine >= EFFET[k]!;
  const d1 = dit(D.entree) ? chemin[D.entree]! : NEUTRE[D.entree];
  let p: number = SOLVEANE.base[d1]!;
  if (dit(D.artisans)) {
    const d3 = chemin[D.artisans];
    p -= d3 === 0 ? ARTISANS.exclusivite.dissuasion : d3 === 1 ? ARTISANS.charte.dissuasion : 0;
  }
  if (dit(D.riposte) && chemin[D.riposte] === 0 && d1 !== 3) p -= SOLVEANE.ripostePrix;
  return borne(p, 0.05, 0.95);
}

/** Solvéane s'implante-t-il ? Le tirage est fixé d'avance ; sa probabilité dépend des décisions. */
export const solveaneEntre = (chemin: readonly number[], graine: number) =>
  hasard(graine).uSolveane < probaSolveane(chemin);

/** Nordhalm accepte un référencement sans volume six fois sur dix. */
export const referencementAccepte = (graine: number) =>
  hasard(graine).uFabricant < FABRICANT.referencement.chance;

/** Le rythme annuel de bouquets d'une agence, tel que le test le mesure. */
export function rythmeMesure(graine: number, type: "grande" | "autre"): number {
  const h = hasard(graine);
  return scenario(h.scenario).bouquets * FACTEUR[type] * (1 + h.mesure[type]);
}

/* ---------------------------------------------------------------------------
 * LA VALEUR DE LA POSITION : le plan de l'an prochain, sur trois ans.
 * ------------------------------------------------------------------------- */

const artisansDe = (d3: number | undefined) =>
  d3 === 0 ? ARTISANS.exclusivite : d3 === 1 ? ARTISANS.charte : ARTISANS.aucun;

interface Contexte {
  chemin: readonly number[];
  graine: number;
  /** La semaine de l'estimation : seules les décisions déjà en vigueur comptent. */
  w: number;
}

export interface Position {
  exploitation: number;
  ouvertures: number;
  fermetures: number;
  penalites: number;
  stock: number;
  riposte: number;
  negoce: number;
  total: number;
  /** Les bouquets que le plan signerait chaque année, et sa contribution annuelle. */
  bouquets: number;
  annuel: number;
}

const POSITION_NULLE: Position = {
  exploitation: 0,
  ouvertures: 0,
  fermetures: 0,
  penalites: 0,
  stock: 0,
  riposte: 0,
  negoce: 0,
  total: 0,
  bouquets: 0,
  annuel: 0,
};

/** La marge d'un bouquet, selon l'accord avec le fabricant et la hausse des pompes à chaleur. */
function margeBouquet(c: Contexte, w: number): number {
  const h = hasard(c.graine);
  let m = MARGE;
  if (w >= EFFET[D.fabricant]) {
    const d4 = c.chemin[D.fabricant];
    if (d4 === 0) m += FABRICANT.exclusivite.remise;
    if (d4 === 1 && referencementAccepte(c.graine)) m += FABRICANT.referencement.remise;
    if (d4 === 3) m -= FABRICANT.partPAC * FABRICANT.partage.redevance;
  }
  const hausse = imprevu(h, "hausse");
  if (hausse && hausse.semaine <= w) m += hausse.imprevu.effet.marge!;
  return m;
}

/** Ce que le fabricant rembourse des ouvertures : 40 % en exclusivité, 50 % en partage du risque. */
function cofinancement(c: Contexte): number {
  if (c.w < EFFET[D.fabricant]) return 0;
  const d4 = c.chemin[D.fabricant];
  return d4 === 0
    ? FABRICANT.exclusivite.cofinancement
    : d4 === 3
      ? FABRICANT.partage.cofinancement
      : 0;
}

/**
 * LA VALEUR D'UN PLAN, dans un scénario donné, selon que Solvéane s'implante
 * ou non : la contribution des agences sur trois ans, les ouvertures et les
 * fermetures, les pénalités des contrats, la décote du stock en trop, la
 * riposte, la marge de négoce perdue.
 */
function valeurPlan(c: Contexte, plan: Parc, s: CodeScenario, entre: boolean): Position {
  const { chemin, w } = c;
  const dit = (k: number) => w >= EFFET[k]!;
  const d1 = chemin[D.entree]!;
  const d3 = dit(D.artisans) ? chemin[D.artisans] : NEUTRE[D.artisans];
  const d6 = dit(D.riposte) ? chemin[D.riposte] : NEUTRE[D.riposte];
  const art = artisansDe(d3);
  const ciblee = d6 === 1 && entre;
  const attenuation = ciblee
    ? d3 === 2
      ? RIPOSTE.ciblee.attenuationSansArtisans
      : RIPOSTE.ciblee.attenuation
    : 1;
  const perte = entre ? art.perte * attenuation : 0;
  const n = scenario(s).bouquets * (1 - perte);
  const marge = margeBouquet(c, w);
  const ici = implantation(chemin, c.graine);
  // Les agences ouvertes dès ce trimestre par un lancement gardent l'avance du premier entrant.
  const avance = d1 === 0 || d1 === 1 ? 1 + PREMIER : 1;
  const groupes = [
    { nombre: Math.min(plan.grandes, ici.grandes), rythme: n * FACTEUR.grande * avance },
    { nombre: plan.grandes - Math.min(plan.grandes, ici.grandes), rythme: n * FACTEUR.grande },
    { nombre: Math.min(plan.autres, ici.autres), rythme: n * FACTEUR.autre * avance },
    { nombre: plan.autres - Math.min(plan.autres, ici.autres), rythme: n * FACTEUR.autre },
  ];
  let bouquets = 0;
  let annuel = 0;
  let exploitation = 0;
  for (const g of groupes) {
    if (g.nombre === 0) continue;
    const contribution = g.rythme * marge - FIXE;
    bouquets += g.nombre * g.rythme;
    annuel += g.nombre * contribution;
    // Une agence qui perd de l'argent est fermée au bout d'un an : on ne la porte pas trois ans.
    exploitation +=
      g.nombre *
      (contribution >= 0 ? contribution * MULTIPLE : (contribution - FERMETURE) / (1 + TAUX));
  }

  const nouvelles = Math.max(0, plan.grandes - ici.grandes) + Math.max(0, plan.autres - ici.autres);
  const fermees = Math.max(0, ici.grandes - plan.grandes) + Math.max(0, ici.autres - plan.autres);
  const ouvertures = -nouvelles * OUVERTURE * (1 - cofinancement(c));
  const fermetures = -fermees * FERMETURE;

  let penalites = 0;
  if (dit(D.artisans) && d3 === 0) {
    const e = ARTISANS.exclusivite;
    penalites -=
      Math.max(0, e.nombre * e.garantie - bouquets) * e.penalite * annuite(e.annees, TAUX);
  }
  if (dit(D.fabricant) && chemin[D.fabricant] === 0) {
    const f = FABRICANT.exclusivite;
    penalites -= Math.max(0, f.volume - FABRICANT.partPAC * bouquets) * f.penalite * MULTIPLE;
  }
  const stockAchete = dit(D.entree) ? LANCEMENT[d1]!.stock : 0;
  const stock = -DECOTE * Math.max(0, stockAchete - bouquets * STOCK_PAR_BOUQUET);
  let riposte = 0;
  if (d6 === 0) riposte -= RIPOSTE.annonce + (RIPOSTE.prix * bouquets) / (1 + TAUX);
  if (ciblee) riposte -= RIPOSTE.ciblee.cout;
  const negoce = entre ? -art.negoce * attenuation : 0;
  const totalPlan = exploitation + ouvertures + fermetures + penalites + stock + riposte + negoce;
  return {
    exploitation,
    ouvertures,
    fermetures,
    penalites,
    stock,
    riposte,
    negoce,
    total: totalPlan,
    bouquets,
    annuel,
  };
}

/**
 * La position dans un scénario : le plan engagé, ou, si le test est
 * prolongé, six mois de plus des agences du test et une extension qui ne
 * garde que 55 % de sa valeur.
 */
function valeurPosition(c: Contexte, s: CodeScenario, entre: boolean): Position {
  const { chemin, w } = c;
  if (w < EFFET[D.entree]) return POSITION_NULLE;
  if (w >= EFFET[D.extension] && chemin[D.extension] === 2 && chemin[D.entree] !== 3) {
    const ici = valeurPlan(c, implantation(chemin, c.graine), s, entre);
    const plus = valeurPlan(c, planJustifie(s), s, entre);
    const semestre = ici.annuel * 0.5;
    const x = (v: number) => DIFFERE * v;
    return {
      exploitation: semestre + x(plus.exploitation),
      ouvertures: x(plus.ouvertures),
      fermetures: x(plus.fermetures),
      penalites: x(plus.penalites),
      stock: x(plus.stock),
      riposte: x(plus.riposte),
      negoce: plus.negoce,
      total:
        semestre +
        x(plus.exploitation + plus.ouvertures + plus.fermetures + plus.penalites) +
        x(plus.stock + plus.riposte) +
        plus.negoce,
      bouquets: ici.bouquets,
      annuel: ici.annuel,
    };
  }
  const plan =
    w >= EFFET[D.extension] ? planDe(chemin, c.graine) : PLAN_ANNONCE[chemin[D.entree]!]!;
  return valeurPlan(c, plan, s, entre);
}

/** Ce que l'on croit du scénario en fin de semaine w : a priori, après le budget, après le test. */
export function croyance(graine: number, w: number): Record<CodeScenario, number> {
  const s = hasard(graine).scenario;
  if (w >= CALENDRIER.resultats) {
    return {
      porteur: s === "porteur" ? 1 : 0,
      moyen: s === "moyen" ? 1 : 0,
      difficile: s === "difficile" ? 1 : 0,
    };
  }
  if (w >= CALENDRIER.aides) {
    if (s === "difficile") return { porteur: 0, moyen: 0, difficile: 1 };
    const p = scenario("porteur").chance;
    const m = scenario("moyen").chance;
    return { porteur: p / (p + m), moyen: m / (p + m), difficile: 0 };
  }
  return { porteur: 0.3, moyen: 0.45, difficile: 0.25 };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** Le résultat du trimestre à date. */
  resultat: number;
  /** Les sommes engagées à date : ouvertures, campagne, stock, contrats, charges, plan. */
  engage: number;
  /** Les agences équipées. */
  agences: number;
  /** Les bouquets signés dans la semaine, et depuis le lancement. */
  signes: number;
  bouquets: number;
  /** Les artisans partenaires sous contrat. */
  artisans: number;
};

interface Flux {
  resultat: number;
  engage: number;
  signes: number;
}

/** Ce que la semaine w apporte au résultat du trimestre et aux engagements. */
function semaineDuTrimestre(
  chemin: readonly number[],
  graine: number,
  w: number,
  jours: number,
): Flux {
  const h = hasard(graine);
  const c: Contexte = { chemin, graine, w };
  const dit = (k: number) => w >= EFFET[k]!;
  const d1 = dit(D.entree) ? chemin[D.entree]! : NEUTRE[D.entree];
  let resultat = 0;
  let engage = 0;
  if (w === 1) resultat -= Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  if (w === EFFET[D.entree]) {
    resultat -= LANCEMENT[d1]!.campagne;
    engage += LANCEMENT[d1]!.campagne + LANCEMENT[d1]!.stock;
  }
  const ici = dit(D.entree) ? implantation(chemin, graine) : VIDE;
  if (w === CALENDRIER.ouverture) {
    resultat -= total(ici) * OUVERTURE;
    engage += total(ici) * OUVERTURE;
    if (chemin[D.test] === 1 && d1 !== 3) {
      resultat -= PROTOCOLE;
      engage += PROTOCOLE;
    }
  }
  if (w === EFFET[D.artisans]) {
    const f = artisansDe(chemin[D.artisans]).frais;
    resultat -= f;
    engage += f;
  }
  if (w === EFFET[D.fabricant]) {
    const rembourse = cofinancement(c) * total(ici) * OUVERTURE;
    resultat += rembourse;
    engage -= rembourse;
  }
  const promoteur = imprevu(h, "promoteur");
  if (promoteur && promoteur.semaine === w) resultat += promoteur.imprevu.effet.negoce!;

  let signes = 0;
  if (w >= CALENDRIER.ouverture && total(ici) > 0) {
    const s = scenario(h.scenario);
    const premier = d1 === 0 || d1 === 1 ? 1 + PREMIER : 1;
    const rampe = Math.min(1, RAMPE.depart + RAMPE.pas * (w - CALENDRIER.ouverture));
    const actives = total(ici);
    let facteur = ici.grandes * FACTEUR.grande + ici.autres * FACTEUR.autre;
    const conseiller = imprevu(h, "conseiller");
    if (
      conseiller &&
      w >= conseiller.semaine &&
      w < conseiller.semaine + conseiller.imprevu.duree
    ) {
      // Les trois agences qu'il suit, prises parmi les autres d'abord.
      const sans = Math.min(actives, conseiller.imprevu.effet.agence!);
      const autres = Math.min(ici.autres, sans);
      facteur -= autres * FACTEUR.autre + (sans - autres) * FACTEUR.grande;
    }
    let choc = 1;
    for (const id of ["reportage", "credit"]) {
      const i = imprevu(h, id);
      if (i && w >= i.semaine && w < i.semaine + i.imprevu.duree) choc += i.imprevu.effet.bouquets!;
    }
    signes = ((s.bouquets * premier * facteur) / 52) * rampe * (1 + h.bruit[w]!) * choc;
    const fixes = (actives * FIXE) / 52;
    resultat += signes * margeBouquet(c, w) - fixes;
    engage += fixes;
  }
  return { resultat, engage, signes };
}

export interface Estimation {
  valeur: number;
  position: number;
}

/** La valeur de la position estimée en fin de semaine w, en espérance sur ce qu'on ne sait pas encore. */
function positionEstimee(chemin: readonly number[], graine: number, w: number): number {
  const c: Contexte = { chemin, graine, w };
  const b = croyance(graine, w);
  const p =
    w >= CALENDRIER.solveane ? (solveaneEntre(chemin, graine) ? 1 : 0) : probaSolveane(chemin, w);
  let v = 0;
  for (const s of SCENARIOS) {
    if (b[s.id] === 0) continue;
    const oui = p > 0 ? valeurPosition(c, s.id, true).total : 0;
    const non = p < 1 ? valeurPosition(c, s.id, false).total : 0;
    v += b[s.id] * (p * oui + (1 - p) * non);
  }
  return v;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  scenario: CodeScenario;
  /** Le résultat du trimestre, et la valeur de la position à la semaine 13. */
  resultat: number;
  position: Position;
  /** Les agences équipées ce trimestre, et celles du plan de l'an prochain. */
  implantation: Parc;
  plan: Parc;
  /** Le plan que le scénario justifiait. */
  justifie: Parc;
  /** Ce que le test a fait croire, s'il y en a eu un. */
  lecture: CodeScenario | null;
  solveane: boolean;
  probaSolveane: number;
  /** La réponse de Nordhalm à une demande de référencement, s'il y en a eu une. */
  referencement: boolean | null;
  engage: number;
  bouquets: number;
  artisans: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let resultat = 0;
  let engage = 0;
  let bouquets = 0;
  let avant = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const f = semaineDuTrimestre(chemin, graine, w, jours);
    resultat += f.resultat;
    engage += f.engage;
    bouquets += f.signes;
    const plan = w >= EFFET[D.extension] ? planDe(chemin, graine) : null;
    const ici = w >= EFFET[D.entree] ? implantation(chemin, graine) : VIDE;
    const ouvrir = plan
      ? Math.max(0, plan.grandes - ici.grandes) + Math.max(0, plan.autres - ici.autres)
      : 0;
    const valeur = resultat + positionEstimee(chemin, graine, w);
    semaines.push({
      valeur,
      variation: valeur - avant,
      resultat,
      engage: engage + ouvrir * OUVERTURE * (1 - cofinancement({ chemin, graine, w })),
      agences: w >= CALENDRIER.ouverture ? total(ici) : 0,
      signes: f.signes,
      bouquets,
      artisans: w >= EFFET[D.artisans] ? artisansDe(chemin[D.artisans]).nombre : 0,
    });
    avant = valeur;
  }
  const fin = semaines[SEMAINES]!;
  const entre = solveaneEntre(chemin, graine);
  const c: Contexte = { chemin, graine, w: SEMAINES };
  return {
    semaines,
    objectif: fin.valeur,
    scenario: h.scenario,
    resultat,
    position: valeurPosition(c, h.scenario, entre),
    implantation: implantation(chemin, graine),
    plan: chemin[D.extension] === 2 ? implantation(chemin, graine) : planDe(chemin, graine),
    justifie: planJustifie(h.scenario),
    lecture: lecture(chemin, graine),
    solveane: entre,
    probaSolveane: probaSolveane(chemin),
    referencement: chemin[D.fabricant] === 1 ? referencementAccepte(graine) : null,
    engage: fin.engage,
    bouquets: fin.bouquets,
    artisans: fin.artisans,
  };
}

/** Les bouquets que le plan engagé signerait chaque année, Solvéane absent : ce que la riposte par les prix coûterait. */
export function bouquetsDuPlan(chemin: readonly number[], graine: number): number {
  const c: Contexte = { chemin, graine, w: EFFET[D.extension] };
  return valeurPlan(c, planDe(chemin, graine), hasard(graine).scenario, false).bouquets;
}

/** Ce qui s'est passé pendant des semaines : ouvertures, budget, test, plan, Solvéane, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const ici = implantation(chemin, graine);
  return {
    ouverture: total(ici) > 0 && dans(CALENDRIER.ouverture),
    remboursement:
      total(ici) > 0 &&
      (chemin[D.fabricant] === 0 || chemin[D.fabricant] === 3) &&
      dans(EFFET[D.fabricant]),
    aides: dans(CALENDRIER.aides),
    resultats: total(ici) > 0 && dans(CALENDRIER.resultats),
    plan: dans(EFFET[D.extension]),
    solveane: dans(CALENDRIER.solveane),
    bilan: dans(SEMAINES),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureMarche {
  valeur: number | null;
  engage: number | null;
  agences: number | null;
  bouquets: number | null;
  artisans: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  aides: number | null;
  rythmeGrande: number | null;
  rythmeAutre: number | null;
  testGrandes: number | null;
  testAutres: number | null;
  planGrandes: number | null;
  planAutres: number | null;
  bouquetsPlan: number | null;
  solveane: number | null;
}

/**
 * Ce que Geneviève lit à la fin d'une semaine ; les décisions à venir
 * comptent comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureMarche {
  const h = hasard(graine);
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const ici = implantation(chemin, graine);
  const commun = {
    rythmeGrande: rythmeMesure(graine, "grande"),
    rythmeAutre: rythmeMesure(graine, "autre"),
    testGrandes: ici.grandes,
    testAutres: ici.autres,
  };
  if (semaine === 0) {
    return {
      valeur: 0,
      engage: 0,
      agences: 0,
      bouquets: 0,
      artisans: 0,
      aides: null,
      ...commun,
      planGrandes: null,
      planAutres: null,
      bouquetsPlan: null,
      solveane: null,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const planConnu = semaine >= EFFET[D.extension];
  const plan = planConnu ? t.plan : null;
  return {
    valeur: s.valeur,
    engage: s.engage,
    agences: s.agences,
    bouquets: s.bouquets,
    artisans: s.artisans,
    aides: semaine >= CALENDRIER.aides ? (scenario(h.scenario).aides ? 1 : 0) : null,
    ...commun,
    planGrandes: plan ? plan.grandes : null,
    planAutres: plan ? plan.autres : null,
    bouquetsPlan: planConnu ? bouquetsDuPlan(chemin, graine) : null,
    solveane: semaine >= CALENDRIER.solveane ? (t.solveane ? 1 : 0) : null,
  };
}
