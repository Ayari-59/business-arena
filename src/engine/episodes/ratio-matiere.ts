/**
 * LE RATIO MATIÈRE QUI DÉRAPE — le modèle de La Table d'Augustin d'Annecy.
 *
 * Un restaurant de bistronomie de 90 couverts dans la vieille ville, une
 * brigade de huit, treize semaines de septembre à novembre : la fin de la
 * saison touristique et le retour des clients d'ici. La clôture d'août affiche
 * 36,4 % de ratio matière pour un objectif de 30 %. Quatre mécanismes font
 * l'épisode, et le joueur doit les démêler AVANT de corriger :
 *
 *   · LA MESURE ELLE-MÊME. L'inventaire du 31 août a oublié la chambre froide
 *     négative du sous-sol : le stock final est sous-évalué de 4 200 €, la
 *     consommation d'août gonflée d'autant. Le vrai ratio est de 33,4 %. Et
 *     l'erreur se retourne : si personne ne corrige le stock, la clôture de
 *     septembre part d'un stock initial trop bas et affiche un ratio trop beau
 *     — le faux signal du « c'est réglé ». Oubliés, les produits de la
 *     négative passent en partie leur date.
 *   · LA CARTE TROP LONGUE, cause principale. Trente-quatre plats, c'est
 *     autant de mises en place, de bacs et de sauces : des produits frais
 *     jetés chaque semaine, quel que soit le nombre de couverts (2,4 points
 *     au-delà des pertes normales). Resserrer la carte supprime la cause ;
 *     le faire sans savoir quels plats jettent le plus en supprime moins.
 *     Et quand novembre vide la salle, des commandes calées sur les volumes
 *     de l'été jettent davantage encore.
 *   · LES GRAMMAGES DÉRIVENT sur les deux plats signatures (le filet de féra,
 *     la côte de veau) : un point de ratio, qui s'aggrave chaque semaine tant
 *     que personne ne pèse au passe.
 *   · LA HAUSSE FOURNISSEUR EST RÉELLE, MAIS LIMITÉE au beurre AOP et au
 *     veau : moins d'un point. Elle vient du marché, pas du grossiste : en
 *     changer coûte la remise de fin d'année et trois semaines de rodage sans
 *     rien enlever de la hausse.
 *
 * Le réflexe, monter la carte de 8 % pour « retrouver » 30 %, fait baisser le
 * ratio et la marge à la fois : hors saison, les clients d'ici sont sensibles
 * au prix, et chaque couvert perdu emporte sa marge entière.
 *
 * Le trimestre est jugé en euros : la marge brute du restaurant, chiffre
 * d'affaires nourriture et boissons moins le coût matière consommé, pertes
 * comprises (produits jetés, stock perdu, remise de fin d'année perdue).
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** La clôture d'août telle que la comptabilité l'a faite, en euros HT, nourriture seule. */
export const AOUT = {
  ca: 140000,
  stockInitial: 16800,
  achats: 47320,
  stockCompte: 13160,
  /** La chambre froide négative du sous-sol, oubliée à l'inventaire du 31 août. */
  negative: 4200,
  jours: 31,
} as const;
/** Le ratio que la clôture affiche : (stock initial + achats − stock final compté) / CA. */
export const RATIO_AFFICHE_AOUT = (AOUT.stockInitial + AOUT.achats - AOUT.stockCompte) / AOUT.ca;
/** Le vrai ratio d'août : le stock final corrigé de la négative. */
export const RATIO_REEL_AOUT =
  (AOUT.stockInitial + AOUT.achats - AOUT.stockCompte - AOUT.negative) / AOUT.ca;

/** Le ticket moyen nourriture, HT, et ce qu'un couvert boit, HT. */
export const TICKET = 29;
export const BOISSONS = 8;
export const RATIO_BOISSONS = 0.24;
/** Une semaine d'août : son chiffre d'affaires nourriture, et les couverts qu'il suppose. */
export const CA_SEMAINE_AOUT = (AOUT.ca * 7) / AOUT.jours;
export const COUVERTS_AOUT = CA_SEMAINE_AOUT / TICKET;

/** Le ratio théorique des fiches techniques, aux prix d'avant la hausse, sans aucune perte. */
export const THEORIQUE = 0.285;
/** Les pertes qu'aucune cuisine n'évite : épluchures, parures, casse. */
export const PERTE_NORMALE = 0.006;
/** Les produits jetés au-delà de la normale avec une carte de 34 plats, en euros par semaine. */
export const EXCES_CARTE = 760;
/** La hausse des Halles du Semnoz : deux produits seulement, depuis juillet. Achats d'août. */
export const HAUSSE = {
  beurre: { achats: 3000, taux: 0.25 },
  veau: { achats: 4600, taux: 0.15 },
} as const;
/** Ce que la hausse a coûté en août : la part de hausse dans les achats des deux produits. */
export const SURCOUT_HAUSSE =
  (HAUSSE.beurre.achats * HAUSSE.beurre.taux) / (1 + HAUSSE.beurre.taux) +
  (HAUSSE.veau.achats * HAUSSE.veau.taux) / (1 + HAUSSE.veau.taux);

/** La décomposition du vrai ratio d'août, en parts du chiffre d'affaires nourriture. */
export const POINTS = {
  theorique: THEORIQUE,
  normales: PERTE_NORMALE,
  carte: EXCES_CARTE / CA_SEMAINE_AOUT,
  hausse: SURCOUT_HAUSSE / AOUT.ca,
  /** Le reste : ce que les deux plats signatures servent au-delà de leur fiche. */
  grammages:
    RATIO_REEL_AOUT -
    THEORIQUE -
    PERTE_NORMALE -
    EXCES_CARTE / CA_SEMAINE_AOUT -
    SURCOUT_HAUSSE / AOUT.ca,
} as const;
/** Les mêmes, en euros par couvert. */
const PAR_COUVERT = {
  theorique: POINTS.theorique * TICKET,
  hausse: POINTS.hausse * TICKET,
  grammages: POINTS.grammages * TICKET,
};
/** La dérive des grammages, par semaine, tant que personne ne pèse au passe. */
export const DERIVE_GRAMMAGES = 0.03;
/** Les deux plats signatures : leur part des plats vendus. */
export const PART_SIGNATURES = 0.24;

/** Les couverts d'une semaine ordinaire, et la part des clients d'ici : la saison qui finit. */
export const COUVERTS = [0, 1080, 1040, 1000, 960, 930, 900, 880, 950, 940, 800, 760, 740, 760];
export const LOCAUX = [0, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.72, 0.6, 0.62, 0.85, 0.85, 0.87, 0.87];
/** Les mois du trimestre, en semaines : les clôtures tombent à leur fin. */
export const MOIS = [
  { nom: "septembre", de: 1, a: 4 },
  { nom: "octobre", de: 5, a: 9 },
  { nom: "novembre", de: 10, a: 13 },
] as const;

/**
 * LE PRIX ET LES CLIENTS D'ICI. Hors saison, 8 % de plus sur la carte font
 * perdre 18 % des couverts locaux en quatre semaines (les habitués espacent
 * leurs visites), 2 % des touristes. Ce que Chambéry a vécu l'an dernier.
 */
export const HAUSSE_CARTE = 0.08;
export const PERTE_LOCAUX_HAUSSE = 0.18;
export const PERTE_TOURISTES_HAUSSE = 0.02;
/** Les mises en place calées sur les volumes passés : ce qu'un couvert manquant fait jeter, par euro de coût théorique. */
export const PERTE_ECART = 0.8;
/** La remise de fin d'année des Halles du Semnoz, perdue si l'on part avant le 31 décembre. */
export const RFA = 4500;
/** Ce que les produits oubliés dans la négative perdent, faute d'être vus : DLC dépassées. */
export const NEGATIVE_PERDUE = 1500;
/** Le stock frais d'une carte de 34 plats, à la fermeture de la cuisine pour travaux. */
export const STOCK_FRAIS = 4800;
/** La formule du midi : prix nourriture HT, boissons HT, et la part de clients déjà venus. */
export const FORMULE = { ticket: 17, ratio: 0.3, boissons: 3, couverts: 60, cannibalisation: 0.5 };
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, la commande et la mise en place partent telles quelles. */
export const PERTE_PAR_JOUR = 400;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  ratio: 0,
  carte: 1,
  signatures: 2,
  fournisseur: 3,
  novembre: 4,
  fermeture: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

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
    /** Sur tous les couverts. */
    couverts?: number;
    /** Sur les seuls touristes. */
    touristes?: number;
    /** Sur les produits jetés au-delà de la normale. */
    exces?: number;
    grammages?: number;
    /** Une perte de stock, rapportée au stock frais d'une carte de 34 plats. */
    stock?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "froid",
    titre: "Panne de la chambre froide positive",
    de: "Philémon Gruffaz",
    role: "Second de cuisine",
    texte:
      "Le compresseur de la chambre froide positive a lâché dans la nuit de dimanche : 9 °C à l'ouverture. Tout le frais est parti à la poubelle, règles HACCP obligent.",
    duree: 1,
    effet: { stock: 0.3 },
  },
  {
    id: "pluie",
    titre: "Deux semaines de pluie",
    de: "Anouar Benkirane",
    role: "Maître d'hôtel",
    texte:
      "Pluie et fraîcheur deux semaines de suite : la terrasse est rangée plus tôt que prévu, et les touristes de passage ne s'arrêtent plus.",
    duree: 2,
    effet: { touristes: 0.8 },
  },
  {
    id: "congres",
    titre: "Un congrès en ville",
    de: "Anouar Benkirane",
    role: "Maître d'hôtel",
    texte:
      "Un congrès de huit cents personnes au centre de congrès : complet tous les soirs de la semaine, et des groupes au déjeuner.",
    duree: 1,
    effet: { couverts: 1.1 },
  },
  {
    id: "second",
    titre: "Le second de cuisine en arrêt",
    de: "Ressources humaines",
    role: "Siège, Annecy",
    texte:
      "Philémon Gruffaz est en arrêt deux semaines : le chef tient la cuisine seul avec les commis, et la mise en place se fait au jugé.",
    duree: 2,
    effet: { exces: 1.25, grammages: 1.3 },
  },
  {
    id: "plonge",
    titre: "Panne du lave-vaisselle",
    de: "Soumaïla Diarra",
    role: "Plongeur",
    texte:
      "Le lave-vaisselle est tombé en panne un vendredi soir : service réduit jusqu'au mardi, le temps que le technicien passe.",
    duree: 1,
    effet: { couverts: 0.95 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  couverts: number;
  pertes: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Les habitués rejettent-ils la carte courte ? */
  uCarte: number;
  /** La gravité du rodage chez un nouveau grossiste. */
  uRodage: number;
  /** Le succès de la formule du midi. */
  uFormule: number;
  /** Un billet critique après une hausse de septembre ? */
  uCritique: number;
  /** Un billet critique après une hausse de novembre ? */
  uCritiqueNovembre: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000429 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      couverts: Math.min(1.06, Math.max(0.94, 1 + 0.02 * gauss(r))),
      pertes: Math.min(1.35, Math.max(0.65, 1 + 0.12 * gauss(r))),
    });
  }
  const uFormule = r();
  const uRodage = r();
  const uCarte = r();
  const uCritique = r();
  const uCritiqueNovembre = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uCarte, uRodage, uFormule, uCritique, uCritiqueNovembre, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur trois, des habitués réclament le plat que la carte courte a retiré. */
export const CARTE_REJETEE = 0.35;
/** Ce que coûte ce rejet : des clients d'ici qui viennent moins souvent. */
export const PERTE_REJET = 0.05;
export const carteRejetee = (graine: number) => hasard(graine).uCarte < CARTE_REJETEE;
/** La gravité du rodage chez un nouveau grossiste : de 0,5 à 1,5. */
export const rodage = (graine: number) => 0.5 + hasard(graine).uRodage;
/** Le succès de la formule du midi : de 0,2 à 1,6 fois les 60 couverts espérés. */
export const succesFormule = (graine: number) => 0.2 + 1.4 * hasard(graine).uFormule;

/**
 * LE BILLET CRITIQUE. Un blog culinaire très lu des Annéciens relève les
 * hausses de prix et les assiettes qui maigrissent : plus cher, moins bon.
 * Il tombe ou non selon le hasard, plus souvent quand le restaurant a fait
 * les deux.
 */
export function chanceDeCritique(chemin: readonly number[]): number {
  const d1 = chemin[D.ratio];
  return d1 === 0 ? 0.45 : d1 === 1 ? 0.5 : 0;
}
export function chanceDeCritiqueNovembre(chemin: readonly number[]): number {
  if (chemin[D.novembre] !== 2) return 0;
  return chemin[D.ratio] === 0 ? 0.6 : 0.4;
}
export const critique = (chemin: readonly number[], graine: number) =>
  hasard(graine).uCritique < chanceDeCritique(chemin);
export const critiqueNovembre = (chemin: readonly number[], graine: number) =>
  hasard(graine).uCritiqueNovembre < chanceDeCritiqueNovembre(chemin);
export const SEMAINE_CRITIQUE = 6;
export const SEMAINE_CRITIQUE_NOVEMBRE = 11;

/** Ce que la carte retire des produits jetés au-delà de la normale, selon qu'on sait lesquels. */
export function facteurCarte(chemin: readonly number[]): number {
  const pese = chemin[D.ratio] === 2;
  switch (chemin[D.carte]) {
    case 0:
      return 1.25;
    case 1:
      return 1 - (pese ? 0.8 : 0.45);
    case 2:
      return 1 - (pese ? 0.4 : 0.35);
    default:
      return 1;
  }
}
/** Le stock frais qu'une carte fait tenir en chambre froide, rapporté à 34 plats. */
export const FACTEUR_STOCK = [1.1, 0.7, 0.85, 1] as const;
/** Ce que la fermeture pour travaux fait perdre du stock frais, selon ce qui a été prévu. */
export const PERTE_FERMETURE = [0.08, 0.4, 0.25, 0.6] as const;

export type Semaine = {
  /** Le ratio matière consommé de la semaine : coût matière nourriture / CA nourriture. */
  ratio: number;
  couverts: number;
  locaux: number;
  /** Le ticket moyen nourriture, HT, formules comprises. */
  ticket: number;
  caNourriture: number;
  coutNourriture: number;
  /** Les produits jetés et le stock perdu, en euros. */
  pertes: number;
  marge: number;
  margeCumul: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge brute du trimestre, pertes comprises. */
  objectif: number;
  caNourriture: number;
  caBoissons: number;
  coutNourriture: number;
  pertes: number;
  couverts: number;
  locaux: number;
  /** Les couverts locaux qu'aurait faits le même trimestre sans rien changer aux prix ni à la carte. */
  locauxAttendus: number;
  /** Le vrai ratio du trimestre. */
  ratio: number;
  /** Le ratio de chaque mois, tel que la clôture l'affiche. */
  affiches: readonly number[];
  /** Le vrai ratio de chaque mois. */
  reels: readonly number[];
  negativeRecomptee: boolean;
  critique: boolean;
  critiqueNovembre: boolean;
  carteRejetee: boolean;
  rodage: number | null;
  formule: number | null;
  rfaPerdue: boolean;
  stockPerdu: number;
}

const rampe = (w: number, debut: number, duree: number) =>
  w < debut ? 0 : Math.min(1, (w - debut + 1) / duree);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const aCritique = critique(chemin, graine);
  const aCritiqueNov = critiqueNovembre(chemin, graine);
  const rejet = d2 === 1 && carteRejetee(graine);
  const sev = rodage(graine);
  const succes = succesFormule(graine);
  const exces = facteurCarte(chemin);
  const stock = STOCK_FRAIS * FACTEUR_STOCK[d2 ?? 3]!;
  const semaines: (Semaine | null)[] = [null];
  const vus: number[] = [COUVERTS_AOUT, COUVERTS_AOUT, COUVERTS_AOUT];
  let margeCumul = 0;
  let total = { caN: 0, caB: 0, coutN: 0, pertes: 0, couverts: 0, locaux: 0, attendus: 0 };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);

    // Qui vient : les clients d'ici, les touristes, et ce que les décisions leur font.
    let fl = 1;
    let ft = 1;
    let prix = 1;
    let extra = 0;
    if (d1 === 0 && w >= 2) {
      prix *= 1 + HAUSSE_CARTE;
      fl *= 1 - PERTE_LOCAUX_HAUSSE * rampe(w, 2, 4);
      ft *= 1 - PERTE_TOURISTES_HAUSSE;
    }
    if (d1 === 1 && w >= 2) {
      fl *= 1 - 0.08 * rampe(w, 2, 4);
      ft *= 0.99;
    }
    if (aCritique && w >= SEMAINE_CRITIQUE) {
      fl *= 0.95;
      ft *= 0.98;
    }
    if (d2 === 0 && w >= 3) fl *= 1.005;
    if (rejet && w >= 4) fl *= 1 - PERTE_REJET;
    if (d3 === 1 && w >= 5) {
      fl *= 1 - 0.04 * rampe(w, 5, 3);
      extra += 4 * PART_SIGNATURES * 0.5;
    }
    if (d3 === 2 && w >= 5) {
      fl *= 0.96;
      ft *= 0.98;
    }
    if (d4 === 0 && w >= 6 && w <= 8) {
      fl *= 1 - 0.02 * sev;
      ft *= 1 - 0.02 * sev;
    }
    if (d4 === 2 && w >= 6) {
      fl *= 1 - 0.035 * rampe(w, 6, 3);
      extra += 2 * 0.3 * 0.6;
    }
    if (d5 === 2 && w >= 10) {
      prix *= 1 + HAUSSE_CARTE;
      fl *= 1 - PERTE_LOCAUX_HAUSSE * rampe(w, 10, 4);
      ft *= 1 - PERTE_TOURISTES_HAUSSE;
    }
    if (aCritiqueNov && w >= SEMAINE_CRITIQUE_NOVEMBRE) fl *= 0.95;
    let remise = 1;
    if (d6 === 2 && w >= 12) {
      remise = 0.8;
      fl *= 1.06;
      ft *= 1.06;
    }
    let fc = n.couverts;
    for (const a of actifs) fc *= a.imprevu.effet.couverts ?? 1;
    const ftImprevu = actifs.reduce((x, a) => x * (a.imprevu.effet.touristes ?? 1), 1);
    const baseLocaux = COUVERTS[w]! * LOCAUX[w]! * fc;
    const baseTouristes = COUVERTS[w]! * (1 - LOCAUX[w]!) * fc * ftImprevu;
    // La formule du midi : des clients d'ici en plus, dont une part venait déjà à la carte.
    const formule = d5 === 1 && w >= 9 ? FORMULE.couverts * succes : 0;
    const locauxCarte = Math.max(0, baseLocaux * fl - FORMULE.cannibalisation * formule);
    const carte = locauxCarte + baseTouristes * ft;
    const couverts = carte + formule;

    // Ce que chaque couvert coûte en matière, aux grammages et aux prix d'achat du moment.
    let theorique = PAR_COUVERT.theorique;
    if (d1 === 1 && w >= 2) theorique *= 0.92;
    if (d4 === 0 && w >= 9) theorique *= 1 - 0.03 * 0.6;
    let hausse = PAR_COUVERT.hausse;
    if (d4 === 1 && w >= 6) hausse *= 0.2;
    let grammages = PAR_COUVERT.grammages * (1 + DERIVE_GRAMMAGES * (w - 1));
    if (d3 === 0 && w >= 5) grammages = PAR_COUVERT.grammages * 0.15;
    if (d3 === 2 && w >= 5) grammages = PAR_COUVERT.grammages * 0.1;
    for (const a of actifs) grammages *= a.imprevu.effet.grammages ?? 1;

    // Les produits jetés : les pertes normales, la carte, et les commandes calées sur le passé.
    let facteur = exces * n.pertes;
    if (d1 === 2) facteur *= 0.9;
    if (d5 === 0 && w >= 8) facteur *= 0.9;
    if (d5 === 1 && w >= 9) facteur *= 0.92;
    if (d6 === 0 && w >= 11) facteur *= 0.85;
    for (const a of actifs) facteur *= a.imprevu.effet.exces ?? 1;
    const reference = (vus.at(-1)! + vus.at(-2)! + vus.at(-3)!) / 3;
    // Plus la carte est large, plus la mise en place faite pour rien est grande.
    let ecart =
      PERTE_ECART * (0.6 + 0.4 * exces) * PAR_COUVERT.theorique * Math.max(0, reference - carte);
    if (d5 === 0 && w >= 8) ecart *= 0.15;
    vus.push(carte);
    let pertes = PERTE_NORMALE * TICKET * carte + EXCES_CARTE * facteur + ecart;
    if (w === 1) pertes += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    if (d1 !== 2 && w >= 5 && w <= 9) pertes += NEGATIVE_PERDUE / 5;
    for (const a of actifs) {
      if (a.imprevu.effet.stock && w === a.semaine) pertes += a.imprevu.effet.stock * stock;
    }
    if (w === SEMAINES) pertes += PERTE_FERMETURE[d6 ?? 3]! * stock;

    // Les achats qui ne sont pas des pertes mais coûtent : dépannages, remise perdue.
    let autres = 0;
    if (d4 === 0 && w >= 6 && w <= 8) autres += 400 * sev;
    // La remise de fin d'année provisionnée chaque mois ne viendra plus : reprise sur le reste du trimestre.
    if (d4 === 0 && w >= 6) autres += RFA / (SEMAINES - 5);

    const ticketCarte = (TICKET * prix + extra) * remise;
    const caNourriture = carte * ticketCarte + formule * FORMULE.ticket;
    const coutNourriture =
      carte * (theorique + hausse + grammages) +
      formule * FORMULE.ticket * FORMULE.ratio +
      pertes +
      autres;
    const caBoissons = carte * BOISSONS + formule * FORMULE.boissons;
    const coutBoissons = caBoissons * RATIO_BOISSONS;
    const marge = caNourriture + caBoissons - coutNourriture - coutBoissons;
    margeCumul += marge;

    total = {
      caN: total.caN + caNourriture,
      caB: total.caB + caBoissons,
      coutN: total.coutN + coutNourriture,
      pertes: total.pertes + pertes,
      couverts: total.couverts + couverts,
      locaux: total.locaux + locauxCarte + formule,
      attendus: total.attendus + baseLocaux,
    };
    semaines.push({
      ratio: coutNourriture / caNourriture,
      couverts,
      locaux: locauxCarte + formule,
      ticket: caNourriture / couverts,
      caNourriture,
      coutNourriture,
      pertes,
      marge,
      margeCumul,
    });
  }

  // Les clôtures : le vrai ratio de chaque mois, et celui qu'affiche la comptabilité.
  const pleines = semaines as Semaine[];
  const reels = MOIS.map((m) => {
    const ws = pleines.slice(m.de, m.a + 1);
    return (
      ws.reduce((s, x) => s + x.coutNourriture, 0) / ws.reduce((s, x) => s + x.caNourriture, 0)
    );
  });
  const recomptee = d1 === 2;
  // Sans recomptage, septembre part d'un stock initial trop bas : sa consommation paraît plus faible.
  const caSeptembre = pleines.slice(1, 5).reduce((s, x) => s + x.caNourriture, 0);
  const affiches = reels.map((r, i) =>
    i === 0 && !recomptee ? r - AOUT.negative / caSeptembre : r,
  );

  return {
    semaines,
    objectif: margeCumul,
    caNourriture: total.caN,
    caBoissons: total.caB,
    coutNourriture: total.coutN,
    pertes: total.pertes,
    couverts: total.couverts,
    locaux: total.locaux,
    locauxAttendus: total.attendus,
    ratio: total.coutN / total.caN,
    affiches,
    reels,
    negativeRecomptee: recomptee,
    critique: aCritique,
    critiqueNovembre: aCritiqueNov,
    carteRejetee: rejet,
    rodage: d4 === 0 ? sev : null,
    formule: d5 === 1 ? succes : null,
    rfaPerdue: d4 === 0,
    stockPerdu: PERTE_FERMETURE[d6 ?? 3]! * stock,
  };
}

/** Ce qui s'est passé pendant des semaines : billets, rejet de la carte, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    critique: t.critique && dans(SEMAINE_CRITIQUE),
    critiqueNovembre: t.critiqueNovembre && dans(SEMAINE_CRITIQUE_NOVEMBRE),
    carteRejetee: t.carteRejetee && dans(4),
    negativePerdue: !t.negativeRecomptee && dans(7),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** La marge brute qu'aurait le trimestre à 30 % de ratio matière, sur les couverts prévus. */
export const BUDGET =
  COUVERTS.reduce((s, c) => s + c, 0) * (TICKET * 0.7 + BOISSONS * (1 - RATIO_BOISSONS));

export interface LectureTable {
  ratio: number | null;
  ratioMois: number | null;
  /** Le vrai ratio du même mois : il diffère de la clôture tant que la négative n'a pas été recomptée. */
  ratioMoisReel: number | null;
  /** Le mois de la dernière clôture : 8 pour août, 9 pour septembre… */
  mois: number;
  couverts: number | null;
  partLocaux: number | null;
  ticket: number | null;
  marge: number | null;
  budgetADate: number | null;
  pertes: number | null;
}

/** Le dernier mois clôturé à la fin d'une semaine. */
export const moisClos = (semaine: number) =>
  semaine >= 13 ? 11 : semaine >= 9 ? 10 : semaine >= 4 ? 9 : 8;

/** Ce que Nina lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureTable {
  if (semaine === 0) {
    return {
      ratio: null,
      ratioMois: RATIO_AFFICHE_AOUT,
      ratioMoisReel: RATIO_REEL_AOUT,
      mois: 8,
      couverts: COUVERTS_AOUT,
      partLocaux: 0.4,
      ticket: TICKET,
      marge: 0,
      budgetADate: 0,
      pertes: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const mois = moisClos(semaine);
  const budgetADate = COUVERTS.slice(1, semaine + 1).reduce(
    (x, c) => x + c * (TICKET * 0.7 + BOISSONS * (1 - RATIO_BOISSONS)),
    0,
  );
  return {
    ratio: s.ratio,
    ratioMois:
      mois === 8
        ? t.negativeRecomptee
          ? RATIO_REEL_AOUT
          : RATIO_AFFICHE_AOUT
        : t.affiches[mois - 9]!,
    ratioMoisReel: mois === 8 ? RATIO_REEL_AOUT : t.reels[mois - 9]!,
    mois,
    couverts: s.couverts,
    partLocaux: s.locaux / s.couverts,
    ticket: s.ticket,
    marge: s.margeCumul,
    budgetADate,
    pertes: s.pertes,
  };
}
