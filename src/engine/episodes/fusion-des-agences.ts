/**
 * LA FUSION DES AGENCES — le modèle de l'agence de Vienne après le rachat.
 *
 * Arvel Distribution a racheté les Établissements Combelle, un négoce
 * familial installé à trois rues de son agence de Vienne. Jérôme Castaing doit
 * faire une seule agence de deux équipes : l'une structurée et procédurière,
 * l'autre réactive et informelle, avec des postes en double, deux logiciels,
 * deux tournées, et l'ancien patron qui reste six mois comme conseiller.
 * Treize semaines, six décisions. Trois mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LES CLIENTS SUIVENT LES PERSONNES. Les artisans du négoce n'ont pas
 *     choisi une enseigne : ils ont choisi Sébastien, Naïma, Pierrick, Raymond.
 *     Quand l'un d'eux part, une grande partie de son portefeuille part avec
 *     lui chez le concurrent. Et quand le service qu'ils connaissent se
 *     dégrade (le devis dans l'heure, la palette du matin), ils s'en vont
 *     d'eux-mêmes, semaine après semaine.
 *   · L'INCERTITUDE FAIT PARTIR LES GENS. Tant que personne ne sait ce qu'il
 *     devient, l'inquiétude monte, et avec elle le risque que les meilleurs
 *     acceptent l'offre d'un concurrent. Imposer d'un coup les procédures et
 *     les outils d'Arvel ajoute le choc à l'incertitude. Décider vite des
 *     rôles, même un rôle nouveau, la fait retomber.
 *   · CHAQUE CULTURE A QUELQUE CHOSE À DONNER, ET LES DOUBLONS COÛTENT. Les
 *     postes, les logiciels et les tournées en double coûtent chaque semaine
 *     tant qu'on ne tranche pas. Mais la réactivité du négoce fait gagner des
 *     devis qu'Arvel perd : l'étendre à toute l'agence rapporte plus que
 *     d'aligner le négoce sur des procédures qui font fuir ses clients.
 *
 * Le trimestre est jugé en euros : la marge combinée des deux agences, moins
 * les coûts d'intégration et des doublons, plus ce que l'agence laissée en
 * semaine 13 rapportera le mois suivant (les clients qu'on a gardés), en
 * écart au plan de rachat. Tout aligner en un mois et laisser vivre deux
 * agences côte à côte ne sont pas des styles : ce sont des calculs.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La marge hebdomadaire de l'agence Arvel de Vienne : 190 k€ de ventes à 24 %. */
export const MARGE_ARVEL = 45600;
/** Celle du négoce Combelle : 85 k€ de ventes à 27 %. */
export const MARGE_NEGOCE = 22950;
/** Ce que le plan de rachat attend chaque semaine des deux agences réunies. */
export const PLAN_MARGE = 66500;
/** Les clients du négoce qui commandent encore, en part de sa marge, au lendemain du rachat. */
export const CLIENTS_DEPART = 0.97;
/** La part des salariés du négoce qui se disent inquiets pour leur poste, au baromètre de la semaine 0. */
export const INQUIETUDE_DEPART = 0.55;
export const CHOC_DEPART = 0.1;
/** Le budget d'intégration du trimestre prévu au plan de rachat. */
export const BUDGET_INTEGRATION = 20000;
/** Les semaines du mois suivant que la direction compte dans le bilan du rachat. */
export const SUITE = 4;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le concurrent démarche les artisans du négoce. */
export const PERTE_PAR_JOUR = 2000;
export const OBJECTIF_CLIENTS = 0.9;

/** Les portefeuilles du négoce : qui sert quelle part de sa marge. */
export const PORTEFEUILLES = {
  sebastien: 0.32,
  naima: 0.18,
  joel: 0.14,
  raymond: 0.12,
  comptoir: 0.24,
} as const;
export type Portefeuille = keyof typeof PORTEFEUILLES;
const SEGMENTS = Object.keys(PORTEFEUILLES) as Portefeuille[];

/** La part de son portefeuille qui suit un vendeur quand il part chez un concurrent. */
export const SUIVENT = { sebastien: 0.5, naima: 0.4, joel: 0.45 } as const;

/** Ce que coûte chaque semaine ce qui existe en double. */
export const DOUBLONS = {
  /** Deux chefs de comptoir, deux assistantes commerciales. */
  postes: 2200,
  /** Deux logiciels : licences, et chaque commande du négoce ressaisie pour la comptabilité. */
  logiciels: 2800,
  /** Deux tournées de livraison qui se croisent dans Vienne. */
  tournees: 1300,
} as const;

/** Les doublons que le plan de rachat supposait réglés, semaine par semaine. */
export const doublonsDuPlan = (w: number) =>
  (w < 4 ? DOUBLONS.tournees : 0) +
  (w < 6 ? DOUBLONS.postes : 0) +
  (w < 10 ? DOUBLONS.logiciels : 0);

/** Les décisions, par leur place dans le chemin. */
export const D = {
  lancement: 0,
  comptoir: 1,
  raymond: 2,
  logiciel: 3,
  reactivite: 4,
  offensive: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [2, 3, 2, 2, 2, 3] as const;

export const COUTS = {
  /** Les entretiens individuels et le repas des deux équipes. */
  entretiens: 1500,
  /** Les déjeuners de Raymond avec ses quarante clients. */
  tournee: 1500,
  /** Le consultant de l'éditeur, pour une bascule en un week-end. */
  basculeRapide: 3000,
  /** La reprise des fiches clients vérifiée par les vendeurs, et les binômes de formation. */
  basculeProgressive: 3500,
  /** La tournée express du matin, étendue aux clients d'Arvel. */
  express: 1000,
  /** Les avoirs d'une bascule ratée ou d'une reprise de prix fautive. */
  avoirsBascule: 4000,
  avoirsReprise: 2000,
  /** Un gros devis mal chiffré au comptoir, vendu à perte. */
  devisAPerte: 24000,
  visites: 3000,
  courrier: 500,
  /** Huit points de remise sur le gros œuvre des clients du négoce, par semaine. */
  remise: 3400,
  /** Les remises et délais de paiement que Raymond accorde à ses anciens clients, par semaine. */
  fuiteRaymond: 900,
  fuiteRaymondPatron: 1300,
  /** Les deux agences qui se prennent les mêmes chantiers à coups de remises, par semaine. */
  concurrenceInterne: 700,
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
  effet: { marge?: number; arvel?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "pluie",
    titre: "Deux semaines de pluie",
    de: "Gilbert Aubin",
    role: "Chef des ventes, Arvel Vienne",
    texte:
      "Deux semaines de pluie sans interruption : les chantiers de gros œuvre sont à l'arrêt, les artisans ne commandent plus que le strict nécessaire.",
    duree: 2,
    effet: { marge: 0.88 },
  },
  {
    id: "chantier",
    titre: "Un promoteur lance quarante logements",
    de: "Kader Benmoussa",
    role: "Commercial terrain, Arvel Vienne",
    texte:
      "Un promoteur lance quarante logements à Estrablin : les entreprises de gros œuvre retenues se fournissent chez nous pendant deux semaines.",
    duree: 2,
    effet: { arvel: 1.08 },
  },
  {
    id: "camion",
    titre: "Le camion-grue en panne",
    de: "Pierrick Daguerre",
    role: "Chef de comptoir, Combelle",
    texte:
      "Le camion-grue est immobilisé deux semaines, boîte de vitesses cassée : il faut louer un porteur avec chauffeur pour tenir les livraisons.",
    duree: 2,
    effet: { cout: 2500 },
  },
  {
    id: "ciment",
    titre: "Rupture de ciment chez le fournisseur",
    de: "Ariane Ravier",
    role: "Cheffe de comptoir, Arvel Vienne",
    texte:
      "La cimenterie arrête un four une semaine : livraisons rationnées, et des artisans qui vont voir ailleurs pour finir leurs dalles.",
    duree: 1,
    effet: { marge: 0.93 },
  },
  {
    id: "vol",
    titre: "Un vol au dépôt du négoce",
    de: "Pierrick Daguerre",
    role: "Chef de comptoir, Combelle",
    texte:
      "Le dépôt du négoce a été cambriolé dans la nuit : outillage électroportatif volé, grillage à refaire. La franchise de l'assurance reste à notre charge.",
    duree: 1,
    effet: { cout: 6000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** L'activité des chantiers de la semaine, autour de 1. */
  activite: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Sébastien accepte-t-il l'offre du Comptoir Rhodanien ? */
  uSebastien: number;
  /** Pierrick s'en va-t-il ? */
  uJoel: number;
  /** Naïma s'en va-t-elle ? */
  uNaima: number;
  /** Raymond, mis à l'écart, le prend-il mal ? */
  uRaymond: number;
  /** La bascule en un week-end tourne-t-elle mal ? */
  uBascule: number;
  /** La reprise progressive laisse-t-elle passer des prix faux ? */
  uReprise: number;
  /** Un vendeur chiffre-t-il à perte un gros devis, sous la délégation généralisée ? */
  uDevis: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000171 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({ activite: Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))) });
  }
  const uSebastien = r();
  const uJoel = r();
  const uNaima = r();
  const uRaymond = r();
  const uBascule = r();
  const uReprise = r();
  const uDevis = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uSebastien, uJoel, uNaima, uRaymond, uBascule, uReprise, uDevis, imprevus };
  tirages.set(graine, h);
  return h;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Le risque que Sébastien accepte l'offre du concurrent, lu en fin de semaine 5. */
export const risqueSebastien = (inquietude: number, choc: number) =>
  borne(1.2 * (inquietude - 0.25) + 0.9 * choc, 0, 0.85);
/** Le risque que Naïma s'en aille, lu en fin de semaine 10. */
export const risqueNaima = (inquietude: number, choc: number) =>
  borne(0.9 * (inquietude - 0.25) + 0.9 * choc, 0, 0.75);

/**
 * JOËL RESTE-T-IL ?
 *
 * Vingt-deux ans chef du comptoir du négoce. Redevenir vendeur sous les
 * ordres d'Ariane, c'est une rétrogradation : il part plus d'une fois sur
 * deux, d'autant plus que le choc est fort. Un rôle nouveau, construit sur ce
 * qu'il fait mieux que personne, le retient presque toujours.
 */
export function risqueJoel(comptoir: number | undefined, inquietude: number, choc: number) {
  if (comptoir === 0) return 0.04;
  if (comptoir === 1) return borne(0.55 + 0.4 * choc, 0, 0.9);
  if (comptoir === 2) return 0.12;
  return borne(0.6 * (inquietude - 0.2), 0, 0.5);
}

/** Mis à l'écart, Raymond le prend mal une fois sur deux. */
export const CHANCE_RAYMOND_VEXE = 0.5;
export const raymondVexe = (chemin: readonly number[], graine: number) =>
  chemin[D.raymond] === 1 && hasard(graine).uRaymond < CHANCE_RAYMOND_VEXE;

/** Une bascule en un week-end tourne mal une fois sur deux : prix spéciaux et encours mal repris. */
export const CHANCE_BASCULE_RATEE = 0.5;
export const basculeRatee = (chemin: readonly number[], graine: number) =>
  chemin[D.logiciel] === 0 && hasard(graine).uBascule < CHANCE_BASCULE_RATEE;

/** Sous la délégation généralisée, un vendeur d'Arvel peu habitué chiffre à perte un gros devis. */
export const CHANCE_DEVIS_A_PERTE = 0.35;
export const devisAPerte = (chemin: readonly number[], graine: number) =>
  chemin[D.reactivite] === 0 && hasard(graine).uDevis < CHANCE_DEVIS_A_PERTE;

export type Semaine = {
  /** La marge combinée des deux agences. */
  marge: number;
  margeArvel: number;
  margeNegoce: number;
  /** Les clients du négoce qui commandent encore, en part de sa marge au rachat. */
  clients: number;
  inquietude: number;
  choc: number;
  /** Ce que coûtent cette semaine les postes, logiciels et tournées en double. */
  doublons: number;
  /** Les coûts d'intégration cumulés depuis le début du trimestre. */
  integration: number;
  /** Ce que la semaine apporte à l'objectif : marge, moins doublons et coûts. */
  contribution: number;
  /** Ce que le plan attendait de la semaine. */
  plan: number;
  /** Le service du négoce tel que ses clients le vivent : 1, le devis dans l'heure et la palette du matin. */
  reactivite: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au plan de rachat, mois suivant compris : positif, l'agence fait mieux que le plan. */
  objectif: number;
  marge: number;
  doublons: number;
  integration: number;
  /** Ce que l'agence laissée en semaine 13 rapporte sur le mois suivant. */
  suite: number;
  sebastienPart: boolean;
  joelPart: boolean;
  naimaPart: boolean;
  raymondVexe: boolean;
  basculeRatee: boolean;
  repriseFautive: boolean;
  devisAPerte: boolean;
  clientsFinal: number;
  doublonsFinal: number;
  inquietudeFinale: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const vexe = raymondVexe(chemin, graine);
  const ratee = basculeRatee(chemin, graine);
  const aPerte = devisAPerte(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const ret: Record<Portefeuille, number> = {
    sebastien: CLIENTS_DEPART,
    naima: CLIENTS_DEPART,
    joel: CLIENTS_DEPART,
    raymond: CLIENTS_DEPART,
    comptoir: CLIENTS_DEPART,
  };
  let retArvel = 1;
  let inquietude = INQUIETUDE_DEPART;
  let choc = CHOC_DEPART;
  let integration = 0;
  let marge = 0;
  let doublonsTotal = 0;
  let total = 0;
  let sebastienParti = false;
  let joelParti = false;
  let naimaParti = false;
  let repriseFautive = false;
  /** Les clients qui suivront un vendeur parti, à prendre sur trois semaines. */
  const aSuivre: Partial<Record<Portefeuille, { reste: number; part: number }>> = {};
  let reactivite = 1;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  /** Les tournées fusionnent quand l'organisation cible le dit. */
  const tourneesFusionnees = (w: number) =>
    (d1 === 0 && w >= 4) || (d1 === 1 && w >= 2) || (d1 === 3 && w >= 8);
  const postesTranches = (w: number) => (d2 === 0 || d2 === 1) && w >= 6;
  const logicielUnique = (w: number) => (d4 === 0 && w >= 10) || (d4 === 1 && w >= 11);
  const doublonsDe = (w: number) =>
    (tourneesFusionnees(w) ? 0 : DOUBLONS.tournees) +
    (postesTranches(w) ? 0 : DOUBLONS.postes) +
    (logicielUnique(w) ? 0 : DOUBLONS.logiciels);
  /** Ce que la délégation généralisée fait gagner à Arvel : moitié moins sans Pierrick pour la piloter. */
  const gainReactivite = () => (d5 === 0 ? (joelParti ? 0.045 : 0.09) : d5 === 3 ? 0.035 : 0);
  /** Ce que Raymond coûte chaque semaine en remises et délais accordés à l'ancienne. */
  const fuite = d3 === 2 ? COUTS.fuiteRaymond : d3 === 3 ? COUTS.fuiteRaymondPatron : 0;
  const present: Record<Portefeuille, () => boolean> = {
    sebastien: () => !sebastienParti,
    naima: () => !naimaParti,
    joel: () => !joelParti,
    raymond: () => true,
    comptoir: () => !(joelParti && naimaParti),
  };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? perte : 0;

    // L'inquiétude et le choc : ce que les décisions font à l'équipe du négoce.
    if (w >= 2) {
      if (d1 === 0 && w <= 5) inquietude -= w === 3 ? 0.13 : 0.05;
      if (d1 === 1) {
        inquietude += 0.02;
        if (w <= 3) choc += 0.12;
      }
      if (d1 === 2) inquietude += 0.005;
      if (d1 === 3) inquietude += w <= 6 ? 0.04 : -0.02;
    }
    if (w >= 4) {
      if (d2 === 0) inquietude -= w === 4 ? 0.12 : 0.02;
      if (d2 === 1 && w === 4) {
        inquietude -= 0.04;
        choc += 0.1;
      }
      if (d2 === 2) inquietude += 0.015;
      if (d2 === 3) inquietude += 0.01;
    }
    if (w >= 6) {
      if (d3 === 0) inquietude -= 0.03;
      if (d3 === 1 && w === 6) choc += 0.05;
      if (vexe && w === 7) {
        choc += 0.12;
        inquietude += 0.08;
      }
      if (d3 === 2) inquietude += 0.008;
      if (d3 === 3) inquietude -= 0.01;
    }
    if (d4 === 0 && w === 9) {
      choc += ratee ? 0.25 : 0.1;
      inquietude += ratee ? 0.13 : 0.05;
    }
    if (d4 === 1 && w === 10) inquietude -= 0.02;
    if (d4 === 2 && w >= 8) inquietude += 0.005;
    if (w === 10) {
      if (d5 === 0) {
        choc -= 0.1;
        inquietude -= 0.04;
      }
      if (d5 === 1) {
        choc += 0.12;
        inquietude += 0.04;
      }
      if (d5 === 3) choc -= 0.05;
    }
    if (w >= 10 && d5 === 2) inquietude += 0.005;
    choc = borne(choc - 0.01, 0, 0.9);
    inquietude = borne(inquietude, 0.08, 0.95);

    // Le service que vivent les clients du négoce.
    reactivite = 1;
    if (d1 === 1 && w >= 2) reactivite = 0.72;
    if (w >= 10 && d5 === 0) reactivite = 1;
    if (w >= 10 && d5 === 1) reactivite = 0.72;
    if (d4 === 0 && (w === 9 || (ratee && w === 10))) reactivite -= ratee ? 0.35 : 0.1;
    if (d4 === 1 && w === 10) reactivite -= 0.05;

    // Les clients qui partent : le service dégradé, l'inquiétude qu'ils sentent, les vendeurs partis.
    const offensive =
      w >= 12
        ? defense(chemin, { sebastien: sebastienParti, naima: naimaParti, joel: joelParti })
        : null;
    for (const s of SEGMENTS) {
      let risque = 0.002 + 0.04 * Math.max(0, 1 - reactivite) + 0.008 * inquietude;
      if (!present[s]()) risque += 0.01;
      if (s === "raymond") {
        if (d3 === 0 && w >= 6) risque -= 0.002;
        if (d3 === 1 && w >= 6) risque += 0.012;
        if (vexe && w >= 7 && w <= 9) risque += 0.13;
      }
      if (offensive) risque += offensive.negoce[s];
      ret[s] *= 1 - borne(risque, 0, 1);
      const suivi = aSuivre[s];
      if (suivi && suivi.reste > 0) {
        ret[s] -= suivi.part;
        suivi.reste -= 1;
      }
      ret[s] = Math.max(0, ret[s]);
    }
    retArvel *= 1 - (0.001 + (offensive ? offensive.arvel : 0));

    // La marge des deux agences.
    let activite = n.activite;
    let arvel = 1;
    for (const a of actifs) {
      activite *= a.imprevu.effet.marge ?? 1;
      arvel *= a.imprevu.effet.arvel ?? 1;
      cout += a.imprevu.effet.cout ?? 0;
    }
    const gain = w >= 10 ? gainReactivite() : 0;
    const margeArvel = MARGE_ARVEL * retArvel * activite * arvel * (1 + gain);
    let disruption = 1;
    if (d4 === 0 && w === 9) disruption = ratee ? 0.8 : 0.96;
    if (d4 === 0 && w === 10 && ratee) disruption = 0.8;
    if (d4 === 1 && w === 10) disruption = 0.98;
    if (repriseFautive && w === 11) disruption = 0.92;
    const margeNegoce =
      MARGE_NEGOCE *
      SEGMENTS.reduce((x, s) => x + PORTEFEUILLES[s] * ret[s], 0) *
      activite *
      disruption;
    let margeSemaine = margeArvel + margeNegoce;
    if (d1 === 2) margeSemaine -= COUTS.concurrenceInterne;
    if (w >= 6) margeSemaine -= fuite;
    if (d6 === 2 && w >= 12) margeSemaine -= COUTS.remise;

    // Les coûts d'intégration.
    let integ = 0;
    if (d1 === 0 && w === 1) integ += COUTS.entretiens;
    if (d3 === 0 && w === 6) integ += COUTS.tournee;
    if (d4 === 0 && w === 8) integ += COUTS.basculeRapide;
    if (d4 === 0 && ratee && w === 10) integ += COUTS.avoirsBascule;
    if (d4 === 1 && w === 8) integ += COUTS.basculeProgressive;
    if (repriseFautive && w === 11) integ += COUTS.avoirsReprise;
    if (d5 === 0 && w >= 10) integ += COUTS.express;
    if (aPerte && w === 11) integ += COUTS.devisAPerte;
    if (d6 === 0 && w === 12) integ += COUTS.visites;
    if (d6 === 1 && w === 12) integ += COUTS.courrier;
    integration += integ;
    cout += integ;

    const doublons = doublonsDe(w);
    doublonsTotal += doublons;
    marge += margeSemaine;
    const contribution = margeSemaine - doublons - cout;
    total += contribution;

    semaines.push({
      marge: margeSemaine,
      margeArvel,
      margeNegoce,
      clients: SEGMENTS.reduce((x, s) => x + PORTEFEUILLES[s] * ret[s], 0),
      inquietude,
      choc,
      doublons,
      integration,
      contribution,
      plan: PLAN_MARGE - doublonsDuPlan(w),
      reactivite,
    });

    // Les départs, lus en fin de semaine : ils prennent effet la semaine suivante.
    if (w === 5 && h.uSebastien < risqueSebastien(inquietude, choc)) {
      sebastienParti = true;
      aSuivre.sebastien = { reste: 3, part: (ret.sebastien * SUIVENT.sebastien) / 3 };
    }
    if (w === 6 && h.uJoel < risqueJoel(d2, inquietude, choc)) {
      joelParti = true;
      aSuivre.joel = { reste: 3, part: (ret.joel * SUIVENT.joel) / 3 };
    }
    if (w === 10 && h.uNaima < risqueNaima(inquietude, choc)) {
      naimaParti = true;
      aSuivre.naima = { reste: 3, part: (ret.naima * SUIVENT.naima) / 3 };
    }
    // La reprise progressive : une fois sur cinq des prix faux, deux fois plus souvent sans Pierrick.
    if (w === 10 && d4 === 1 && h.uReprise < (joelParti ? 0.4 : 0.2)) repriseFautive = true;
  }

  // Le mois suivant : l'offensive du concurrent dure encore deux semaines, les clients qui
  // suivent un vendeur parti finissent de partir, et ce qui reste en double coûte encore.
  const offensive = defense(chemin, {
    sebastien: sebastienParti,
    naima: naimaParti,
    joel: joelParti,
  });
  for (const s of SEGMENTS) {
    let r = ret[s] * (1 - offensive.negoce[s]) ** 2;
    const suivi = aSuivre[s];
    if (suivi) r -= suivi.part * suivi.reste;
    ret[s] = Math.max(0, r);
  }
  retArvel *= (1 - offensive.arvel) ** 2;
  const croisiere =
    MARGE_ARVEL * retArvel * (1 + gainReactivite()) +
    MARGE_NEGOCE * SEGMENTS.reduce((x, s) => x + PORTEFEUILLES[s] * ret[s], 0) -
    fuite -
    (d1 === 2 ? COUTS.concurrenceInterne : 0) -
    (d5 === 0 ? COUTS.express : 0) -
    doublonsDe(SEMAINES + 1);
  const suite = SUITE * croisiere - (d6 === 2 ? 2 * COUTS.remise : 0);

  const plan =
    Array.from({ length: SEMAINES }, (_, i) => PLAN_MARGE - doublonsDuPlan(i + 1)).reduce(
      (x, v) => x + v,
      0,
    ) -
    BUDGET_INTEGRATION +
    SUITE * PLAN_MARGE;
  const derniere = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: total + suite - plan,
    marge,
    doublons: doublonsTotal,
    integration,
    suite,
    sebastienPart: sebastienParti,
    joelPart: joelParti,
    naimaPart: naimaParti,
    raymondVexe: vexe,
    basculeRatee: ratee,
    repriseFautive,
    devisAPerte: aPerte,
    clientsFinal: derniere.clients,
    doublonsFinal: derniere.doublons,
    inquietudeFinale: derniere.inquietude,
  };
}

/** L'offensive du Comptoir Rhodanien, à partir de la semaine 12 : ce qu'elle arrache chaque semaine. */
export const OFFENSIVE = { negoce: 0.05, arvel: 0.012 } as const;

/**
 * CE QUI PROTÈGE DE L'OFFENSIVE.
 *
 * Un artisan démarché par un concurrent reste quand son vendeur habituel
 * vient le voir : la visite vaut beaucoup tant que le vendeur est là, bien
 * moins quand il est parti. La remise protège tout le monde, mais se paie sur
 * chaque sac de ciment ; le courrier impersonnel fait plutôt fuir.
 */
export function defense(
  chemin: readonly number[],
  partis: { sebastien: boolean; naima: boolean; joel: boolean },
): { negoce: Record<Portefeuille, number>; arvel: number } {
  const d6 = chemin[D.offensive];
  const facteur = (s: Portefeuille) => {
    if (d6 === 1) return 1.15;
    if (d6 === 2) return 0.35;
    if (d6 === 3) return 1;
    // Les visites : avec le vendeur habituel, ou avec un inconnu.
    if (s === "raymond") return chemin[D.raymond] === 0 ? 0.15 : 0.6;
    if (s === "comptoir") return partis.joel && partis.naima ? 0.7 : 0.4;
    return partis[s] ? 0.7 : 0.15;
  };
  const negoce = Object.fromEntries(
    SEGMENTS.map((s) => [s, OFFENSIVE.negoce * facteur(s)]),
  ) as Record<Portefeuille, number>;
  const arvel = OFFENSIVE.arvel * (d6 === 0 ? 0.5 : d6 === 1 ? 0.8 : 1);
  return { negoce, arvel };
}

/** Ce qui s'est passé pendant des semaines : départs, bascule, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    sebastienPart: t.sebastienPart && dans(6),
    joelPart: t.joelPart && dans(7),
    naimaPart: t.naimaPart && dans(11),
    raymondVexe: t.raymondVexe && dans(7),
    bascule: chemin[D.logiciel] === 0 && dans(9) ? (t.basculeRatee ? "ratee" : "reussie") : null,
    repriseFautive: t.repriseFautive && dans(11),
    devisAPerte: t.devisAPerte && dans(11),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureFusion {
  marge: number | null;
  clients: number | null;
  inquietude: number | null;
  doublons: number | null;
  integration: number | null;
  /** Ce que le plan attendait de la semaine ; pour l'aide du tableau. */
  plan: number | null;
  /** Le budget d'intégration consommable à date, au prorata des semaines. */
  budgetADate: number | null;
  /** Qui est encore là, pour les messages : 1 présent, 0 parti. */
  sebastien: number | null;
  joel: number | null;
  naima: number | null;
}

/** Ce que Jérôme lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureFusion {
  if (semaine === 0) {
    return {
      marge: MARGE_ARVEL + MARGE_NEGOCE * CLIENTS_DEPART,
      clients: CLIENTS_DEPART,
      inquietude: INQUIETUDE_DEPART,
      doublons: doublonsDuPlan(0),
      integration: 0,
      plan: PLAN_MARGE,
      budgetADate: 0,
      sebastien: 1,
      joel: 1,
      naima: 1,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    marge: s.marge,
    clients: s.clients,
    inquietude: s.inquietude,
    doublons: s.doublons,
    integration: s.integration,
    plan: s.plan,
    budgetADate: (BUDGET_INTEGRATION * semaine) / SEMAINES,
    sebastien: t.sebastienPart && semaine >= 6 ? 0 : 1,
    joel: t.joelPart && semaine >= 7 ? 0 : 1,
    naima: t.naimaPart && semaine >= 11 ? 0 : 1,
  };
}
