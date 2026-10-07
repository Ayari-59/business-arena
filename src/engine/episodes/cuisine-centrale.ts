/**
 * LA CUISINE CENTRALE QU'ON N'ATTENDAIT PAS — le modèle du laboratoire de Seynod.
 *
 * Le Groupe Escale a équipé à Seynod un laboratoire de production : fonds et
 * sauces, pains, pâtisserie. Il doit fournir les cinq Tables d'Augustin
 * (Annecy, Chambéry, Aix-les-Bains, Évian, Megève), dont les chefs craignent
 * de perdre ce qui fait leur cuisine. Treize semaines de janvier à mars, la
 * basse saison partout sauf à Megève, en pleine saison de ski. Six décisions.
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · L'ÉCONOMIE NE VIENT QUE DE CE QU'ON COMMANDE. Les achats groupés, la
 *     productivité d'une brigade de laboratoire et les pertes évitées ne se
 *     réalisent que sur ce que les cuisines utilisent vraiment. Un chef opposé
 *     refait sur place : l'économie s'évapore, et les frais fixes du
 *     laboratoire (camion, chauffeur, énergie, analyses) courent quand même.
 *     Si les commandes sont fixées d'en haut, ce qui est livré puis refait
 *     est payé deux fois : une partie part à la poubelle.
 *   · CE QUI SE VOIT ET CE QUI NE SE VOIT PAS. Un fond, une pâte sablée, un
 *     pain du midi : les clients ne les distinguent pas. Un dessert signature
 *     sorti d'un laboratoire, si : la note des avis baisse, et les couverts
 *     avec elle. Mutualiser les bases rapporte ; mutualiser l'identité coûte.
 *   · UN PILOTE RÉVÈLE LES DÉFAUTS AVANT QU'ILS NE FRAPPENT PARTOUT. Le
 *     laboratoire monte en cadence en plusieurs semaines ; la tournée est
 *     trop longue pour tenir le froid ; le pain livré le matin est rassis au
 *     service du soir. Deux restaurants proches, en basse saison, montrent
 *     tout cela à petit coût, et leurs relevés disent quoi corriger. Cinq
 *     restaurants d'un coup, dont Megève en pleine saison, le découvrent en
 *     ruptures de service.
 *   · UN CHEF CLÉ PEUT PARTIR. Séraphin Mermillod, chef de la Table d'Annecy,
 *     part si son opposition est trop forte en fin de semaine 8 : un tirage
 *     au hasard dont la probabilité dépend de la manière dont on l'a associé
 *     (le périmètre, la date imposée, l'interdiction de refaire, les
 *     dégustations) et des incidents que sa cuisine a subis.
 *
 * Le trimestre est jugé en euros : l'économie nette réalisée (achats,
 * main-d'œuvre, pertes, moins les frais fixes du laboratoire), moins ce que
 * coûtent les contournements, les incidents de livraison, la qualité perdue
 * (les couverts qu'une note en baisse fait perdre) et le départ d'un chef.
 * Imposer et attendre ne sont pas des styles : ce sont des calculs.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la brigade du laboratoire produit des essais sans débouché. */
export const PERTE_PAR_JOUR = 1500;

/** Les restaurants, par leur place dans les tableaux. */
export const R = { annecy: 0, chambery: 1, aix: 2, evian: 3, megeve: 4 } as const;

export interface Restaurant {
  id: string;
  nom: string;
  chef: string;
  /** Le chiffre d'affaires annuel de la Table. */
  ca: number;
  /** Sa part de la production des cinq cuisines, sur l'année. */
  part: number;
  /** La note moyenne des avis au début du trimestre, sur 5. */
  note: number;
  /** L'opposition du chef au laboratoire au lendemain de l'annonce, de 0 à 1. */
  opposition: number;
  /** Le temps de route depuis Seynod, en minutes. */
  route: number;
  /** L'activité de chaque semaine, rapportée à une semaine moyenne de l'année. */
  activite: readonly number[];
}

export const RESTAURANTS: readonly Restaurant[] = [
  {
    id: "annecy",
    nom: "Annecy",
    chef: "Séraphin Mermillod",
    ca: 1_900_000,
    part: 0.29,
    note: 4.6,
    opposition: 0.62,
    route: 15,
    activite: [0.68, 0.66, 0.68, 0.7, 0.72, 0.8, 0.82, 0.8, 0.78, 0.8, 0.84, 0.88, 0.92],
  },
  {
    id: "chambery",
    nom: "Chambéry",
    chef: "Elio Santoni",
    ca: 1_300_000,
    part: 0.2,
    note: 4.4,
    opposition: 0.28,
    route: 45,
    activite: [0.84, 0.88, 0.92, 0.92, 0.94, 0.92, 0.9, 0.9, 0.94, 0.96, 0.96, 0.96, 0.94],
  },
  {
    id: "aix",
    nom: "Aix-les-Bains",
    chef: "Harmonie Desgranges",
    ca: 1_000_000,
    part: 0.15,
    note: 4.3,
    opposition: 0.38,
    route: 35,
    activite: [0.55, 0.55, 0.56, 0.58, 0.62, 0.66, 0.7, 0.74, 0.8, 0.86, 0.9, 0.94, 0.98],
  },
  {
    id: "evian",
    nom: "Évian",
    chef: "Jordi Puigvert",
    ca: 1_200_000,
    part: 0.19,
    note: 4.4,
    opposition: 0.45,
    route: 75,
    activite: [0.52, 0.5, 0.52, 0.54, 0.56, 0.62, 0.64, 0.62, 0.6, 0.62, 0.66, 0.7, 0.74],
  },
  {
    id: "megeve",
    nom: "Megève",
    chef: "Ximun Berthoud",
    ca: 1_100_000,
    part: 0.17,
    note: 4.5,
    opposition: 0.52,
    route: 70,
    activite: [1.8, 1.7, 1.75, 1.8, 1.85, 2.05, 2.1, 2.05, 1.95, 1.8, 1.7, 1.6, 1.5],
  },
];

/** Les familles de produits, par leur place dans les tableaux. */
export const F = { fonds: 0, pains: 1, bases: 2, signatures: 3 } as const;

export interface Famille {
  id: string;
  nom: string;
  /** Ce que la famille coûte aujourd'hui par an dans les cinq cuisines : matière, heures, pertes. */
  actuel: number;
  /** Ce qu'elle coûterait par an produite au laboratoire et livrée. */
  labo: number;
}

/** Le dossier du laboratoire, famille par famille. */
export const FAMILLES: readonly Famille[] = [
  { id: "fonds", nom: "Fonds et sauces de base", actuel: 320_000, labo: 222_000 },
  { id: "pains", nom: "Pains", actuel: 270_000, labo: 188_000 },
  {
    id: "bases",
    nom: "Bases pâtissières (pâtes, crèmes, biscuits)",
    actuel: 218_000,
    labo: 154_000,
  },
  { id: "signatures", nom: "Desserts signatures", actuel: 240_000, labo: 168_000 },
];

/** Les frais fixes annuels du laboratoire, qu'il produise ou non. */
export const FRAIS_FIXES = { camion: 34_000, energie: 12_000, analyses: 6_000 } as const;
export const FRAIS_FIXES_ANNUELS = FRAIS_FIXES.camion + FRAIS_FIXES.energie + FRAIS_FIXES.analyses;
export const FRAIS_FIXES_SEMAINE = FRAIS_FIXES_ANNUELS / 52;

/** L'économie annuelle d'une famille au laboratoire, toute la production passée. */
export const economieDeFamille = (f: number) => FAMILLES[f]!.actuel - FAMILLES[f]!.labo;
/** L'économie annuelle attendue si tout le périmètre prévu passe au laboratoire, frais fixes déduits. */
export const ECONOMIE_PREVUE =
  FAMILLES.reduce((s, _, f) => s + economieDeFamille(f), 0) - FRAIS_FIXES_ANNUELS;

/** La montée en cadence du laboratoire : sa capacité, semaine après semaine depuis sa première livraison, en volume des cinq cuisines à leur activité moyenne. */
export const MONTEE = [0.35, 0.5, 0.65, 0.8, 0.9, 1.0, 1.1] as const;

/** La part de l'opposition d'un chef qui se traduit en production refaite sur place. */
export const PENTE_DU_CONTOURNEMENT = 0.75;
/** Quand chacun commande ce qu'il veut, les habitudes plafonnent les commandes. */
export const PLAFOND_DU_VOLONTARIAT = 0.4;
/** Ce qui est livré puis refait finit en partie à la poubelle : le reste part en repas du personnel ou au congélateur. */
export const PART_JETEE = 0.2;
/** Le pain du soir : livré le matin, il est rassis au service du soir, et refait. */
export const PAIN_DU_SOIR = 0.4;
/** Cuit sur place à partir de pâtons crus surgelés, le pain coûte un peu plus que livré cuit. */
export const PAIN_CORRIGE = 0.88;

/** Ce qu'une brigade utilise des produits du laboratoire, ses premières semaines, seule ou avec des chefs relais. */
export const APPRENTISSAGE = [0.6, 0.75, 0.9] as const;
export const RELAIS = [0.9, 0.95] as const;

/** La probabilité d'un incident de livraison par semaine et par restaurant servi, avant toute correction. */
export const P_INCIDENT = 0.15;
export const P_RUPTURE = 0.3;
export const P_GRAVE = 0.07;
export const COUT_INCIDENT = 800;
export const COUT_GRAVE = 12000;

/** Une baisse d'un point de la note des avis fait perdre ce part des couverts. */
export const COUVERTS_PAR_POINT = 0.12;
/** La marge sur coût variable d'un couvert perdu : le chiffre, moins la matière et l'extra. */
export const MARGE_SUR_COUT_VARIABLE = 0.65;
/** Un dessert signature sorti du laboratoire coûte ce que les avis lui retirent. */
export const CHUTE_SIGNATURES = 0.25;
export const ECART_BASES = 0.04;
export const PAIN_RASSIS = 0.02;

/** Le départ de Séraphin : le cabinet, le chef de cuisine en extra, les habitués qui le suivent. */
export const DEPART = { recrutement: 12_000, interim: 1500, couverts: 0.07 } as const;

/** Les petits-déjeuners des sept hôtels hors Megève : pains et viennoiseries. */
export const PETITS_DEJEUNERS = { parSemaine: 2100, achat: 1.05, labo: 0.6 } as const;
export const GAIN_PETITS_DEJEUNERS =
  PETITS_DEJEUNERS.parSemaine * (PETITS_DEJEUNERS.achat - PETITS_DEJEUNERS.labo);

/** Une fois sur deux, le comité accepte de reporter la suite après la saison. */
export const CHANCE_REPORT = 0.5;

export const COUTS = {
  /** Une demi-journée de travail des cinq chefs à Seynod : heures et déplacements. */
  atelier: 800,
  /** Le relevé quotidien du pilote, par semaine. */
  releves: 100,
  bacs: 1200,
  tournee: 100,
  camion: 550,
  degustations: 150,
  audit: 2500,
  relais: 400,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  perimetre: 0,
  bascule: 1,
  livraisons: 2,
  qualite: 3,
  generalisation: 4,
  suite: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 1, 3, 2] as const;

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
    /** La capacité du laboratoire. */
    capacite?: number;
    /** L'économie sur les achats. */
    achats?: number;
    /** La probabilité d'un incident de livraison, dans les restaurants concernés. */
    livraison?: number;
    /** L'activité des restaurants concernés. */
    activite?: number;
    ou?: readonly number[];
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "neige",
    titre: "Chutes de neige sur les routes",
    de: "Teodor Ionescu",
    role: "Chauffeur-livreur, laboratoire de Seynod",
    texte:
      "Quarante centimètres de neige entre Sallanches et Megève, chaînes obligatoires, et la route du Chablais en vigilance : deux jours de livraisons en retard vers Megève et Évian.",
    duree: 1,
    effet: { livraison: 2.5, ou: [R.evian, R.megeve] },
  },
  {
    id: "cellule",
    titre: "Panne de la cellule de refroidissement",
    de: "Swann Joubertin",
    role: "Responsable du laboratoire",
    texte:
      "La cellule de refroidissement rapide est tombée en panne mardi. Sans elle, impossible de refroidir les fonds dans les délais HACCP : la moitié de la production de la semaine est perdue ou reportée.",
    duree: 1,
    effet: { capacite: 0.5 },
  },
  {
    id: "grippe",
    titre: "La grippe au laboratoire",
    de: "Swann Joubertin",
    role: "Responsable du laboratoire",
    texte:
      "Deux des cinq personnes de la brigade du laboratoire sont arrêtées pour la grippe, pour deux semaines. On produit ce qu'on peut.",
    duree: 2,
    effet: { capacite: 0.75 },
  },
  {
    id: "beurre",
    titre: "Le beurre augmente",
    de: "Kadiatou Sidibé",
    role: "Contrôleuse de gestion restauration",
    texte:
      "Le beurre AOP prend 9 % chez les grossistes. Le contrat annuel du laboratoire en amortit l'essentiel : sur ce qu'il produit, l'économie grossit d'autant.",
    duree: 3,
    effet: { achats: 1.12 },
  },
  {
    id: "congres",
    titre: "Un congrès médical à Aix-les-Bains",
    de: "Escale Événements",
    role: "Commercial groupes",
    texte:
      "Un congrès de rhumatologie remplit Aix-les-Bains et Chambéry pendant une semaine : les deux Tables affichent complet midi et soir.",
    duree: 1,
    effet: { activite: 1.25, ou: [R.chambery, R.aix] },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Le bruit de l'activité de chaque restaurant. */
  activite: readonly number[];
  /** Le tirage d'un incident de livraison, par restaurant. */
  incident: readonly number[];
  /** Sa gravité, s'il a lieu. */
  gravite: readonly number[];
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Séraphin part-il, si son opposition est trop forte ? */
  uIgnace: number;
  /** Le comité accepte-t-il de reporter la suite ? */
  uComite: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000579 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    const activite = RESTAURANTS.map(() => Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))));
    const incident = RESTAURANTS.map(() => r());
    const gravite = RESTAURANTS.map(() => r());
    semaines.push({ activite, incident, gravite });
  }
  const uIgnace = r();
  const uComite = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uIgnace, uComite, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le risque que Séraphin démissionne, lu sur son opposition en fin de semaine 8. */
export const risqueDeDepart = (opposition: number) =>
  Math.min(0.85, Math.max(0, (opposition - 0.45) * 2));

/** Le comité accepte-t-il de reporter la suite après la saison ? Seul le choix de le demander compte. */
export const reportAccepte = (chemin: readonly number[], graine: number) =>
  chemin[D.generalisation] === 3 && hasard(graine).uComite < CHANCE_REPORT;

/** Les restaurants qui basculent en semaine 3, selon la deuxième décision. */
export function premiersServis(d2: number | undefined): readonly number[] {
  if (d2 === 0) return [R.annecy, R.chambery, R.aix, R.evian, R.megeve];
  if (d2 === 1) return [R.chambery, R.aix];
  if (d2 === 2) return [R.evian, R.megeve];
  return [];
}

/** La part de la production d'une cuisine qu'une famille représente, en coût de laboratoire. */
const VOLUME = FAMILLES.map((f) => f.labo / FAMILLES.reduce((s, x) => s + x.labo, 0));

export type Semaine = {
  /** L'économie nette cumulée depuis le début du trimestre. */
  economie: number;
  /** L'économie de la semaine sur les achats, les heures et les pertes, moins ce qui est livré et jeté. */
  brute: number;
  /** Ce que la semaine a coûté ou rapporté, tout compris. */
  nette: number;
  /** La part des frais fixes du laboratoire couverte par l'économie, depuis le début du trimestre. */
  couverture: number;
  /** La part de la production prévue au laboratoire refaite sur place, dans les restaurants servis. */
  refaits: number;
  /** La note moyenne des avis des cinq Tables. */
  note: number;
  /** Les incidents de livraison depuis le début du trimestre. */
  incidents: number;
  /** Les restaurants servis par le laboratoire. */
  servis: number;
  /** La part de la commande que le laboratoire n'a pas pu produire. */
  rupture: number;
  /** L'opposition moyenne des chefs, et celle de Séraphin. */
  opposition: number;
  oppositionIgnace: number;
  /** Ce que coûtent cette semaine les contournements, les incidents et la qualité perdue. */
  contournements: number;
  coutIncidents: number;
  coutQualite: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'économie nette du trimestre, contournements, incidents, qualité perdue et départs compris. */
  objectif: number;
  /** L'économie brute réalisée : achats, heures, pertes. */
  brute: number;
  contournements: number;
  coutIncidents: number;
  coutQualite: number;
  coutDepart: number;
  couts: number;
  fraisFixes: number;
  incidents: number;
  graves: number;
  ignacePart: boolean;
  /** La semaine où Séraphin annonce son départ ; `null` : il reste. */
  annonceIgnace: number | null;
  /** `null` : on n'a rien demandé au comité. */
  reportAccepte: boolean | null;
  /** Les desserts signatures sont-ils au laboratoire en fin de trimestre ? */
  signatures: boolean;
  /** Les dégustations ont-elles rendu les desserts signatures aux cuisines ? */
  signaturesRendues: boolean;
  painCorrige: boolean;
  servis: number;
  refaitsFinal: number;
  noteFinale: number;
  noteDepart: number;
  /** La semaine où chaque restaurant est passé au laboratoire ; `null` : jamais. */
  bascules: readonly (number | null)[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const moyennePonderee = (xs: readonly number[]) =>
  xs.reduce((s, x, r) => s + x * RESTAURANTS[r]!.part, 0);
export const NOTE_DEPART = moyennePonderee(RESTAURANTS.map((r) => r.note));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const n = RESTAURANTS.length;
  const o = RESTAURANTS.map((r) => r.opposition);
  const note = RESTAURANTS.map((r) => r.note);
  const bascule: (number | null)[] = RESTAURANTS.map(() => null);
  // Les commandes fixées par le siège : ce qui est livré et refait est payé deux fois.
  const imposee = RESTAURANTS.map(() => d1 === 0);
  const perimetre = [d1 !== 2, true, d1 !== 2, d1 === 0];
  const report = d5 === 3 ? reportAccepte(chemin, graine) : null;
  const pilote = d2 === 1 || d2 === 2;
  let painCorrige = false;
  let ecartBases = true;
  let signaturesRendues = false;
  let premiere: number | null = null;
  /** La semaine où Séraphin annonce son départ ; `null` : il reste. */
  let annonce: number | null = null;

  const semaines: (Semaine | null)[] = [null];
  let economie = 0;
  let cumulBrute = 0;
  let cumulFixes = 0;
  let totalBrute = 0;
  let contournements = 0;
  let coutIncidents = 0;
  let coutQualite = 0;
  let coutDepart = 0;
  let couts = 0;
  let incidents = 0;
  let graves = 0;
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  const servir = (r: number, w: number) => {
    if (bascule[r] !== null) return;
    bascule[r] = w;
    if (premiere === null) premiere = w;
  };
  const ajuster = (delta: number, ou: readonly number[] = [0, 1, 2, 3, 4]) => {
    for (const r of ou) o[r] = borne(o[r]! + delta, 0, 1);
  };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const bruit = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? enquete : 0;

    // D1 — le périmètre, et la manière de l'arrêter.
    if (w === 1) {
      if (d1 === 0) {
        ajuster(0.08);
        ajuster(0.12, [R.annecy]);
      }
      if (d1 === 1) {
        ajuster(-0.2);
        ajuster(-0.05, [R.annecy]);
      }
      if (d1 === 2) ajuster(-0.04);
      if (d1 === 3) ajuster(-0.12);
    }
    if (d1 === 1 && w <= 2) cout += COUTS.atelier;

    // D2 — la bascule de la semaine 3.
    if (w === 3) {
      for (const r of premiersServis(d2)) servir(r, w);
      if (d2 === 0) ajuster(0.08);
      if (d2 === 1) ajuster(-0.05, [R.chambery, R.aix]);
      if (d2 === 2) ajuster(0.15, [R.megeve]);
    }
    if (pilote && w >= 3 && w <= 8) cout += COUTS.releves;

    // D3 — les premières livraisons.
    if (w === 5) {
      if (d3 === 0) {
        for (let r = 0; r < n; r += 1) imposee[r] = true;
        ajuster(0.12);
      }
      if (d3 === 1) {
        cout += COUTS.bacs;
        ajuster(
          -0.05,
          bascule.flatMap((b, r) => (b === null ? [] : [r])),
        );
      }
      if (d3 === 2) ajuster(-0.02);
    }
    if (d3 === 1 && w >= 5) cout += COUTS.tournee;
    if (d3 === 2 && w >= 5) cout += COUTS.camion;

    // D4 — mesurer la qualité.
    if (w === 7) {
      if (d4 === 0) {
        ecartBases = false;
        ajuster(-0.12);
      }
      if (d4 === 2) cout += COUTS.audit;
      if (d4 === 3) {
        ecartBases = false;
        ajuster(-0.05);
      }
    }
    if (d4 === 0 && w >= 7) cout += COUTS.degustations;
    // À l'aveugle, les desserts signatures du laboratoire perdent : les chefs les reprennent.
    if (d4 === 0 && w === 8 && perimetre[F.signatures]) {
      perimetre[F.signatures] = false;
      signaturesRendues = true;
      ajuster(-0.05);
    }

    // D5 — la suite de la bascule.
    const restants = RESTAURANTS.flatMap((_, r) => (bascule[r] === null ? [r] : []));
    if (w === 9) {
      if (d5 === 1 || d5 === 2) painCorrige = true;
      if (d5 === 0) {
        for (const r of restants) servir(r, w);
        ajuster(0.05, restants);
      }
      if (d5 === 1) {
        for (const r of restants) servir(r, w);
        ajuster(d2 === 1 ? -0.15 : d2 === 2 ? -0.06 : -0.04, restants);
        ajuster(-0.04);
        cout += COUTS.relais * Math.max(1, restants.length);
      }
      if (d5 === 2) for (const r of restants) servir(r, w);
      if (d5 === 3 && !report) {
        for (const r of restants) {
          servir(r, w);
          imposee[r] = true;
        }
        ajuster(0.1, restants);
      }
    }

    // D6 — ce qu'on ajoute au laboratoire.
    if (w === 11) {
      if (d6 === 0) {
        perimetre[F.signatures] = true;
        ajuster(0.08);
        ajuster(0.2, [R.annecy]);
      }
      if (d6 === 3) ajuster(-0.15);
    }

    // Le départ de Séraphin : le cabinet dès l'annonce, un chef en extra deux semaines plus tard.
    if (annonce === w) {
      cout += DEPART.recrutement;
      coutDepart += DEPART.recrutement;
    }
    if (annonce !== null && w >= annonce + 2) {
      cout += DEPART.interim;
      coutDepart += DEPART.interim;
      if (w === annonce + 2) o[R.annecy] = 0.45;
    }

    // Ce que les cuisines demandent au laboratoire, et ce qu'il peut produire.
    const activite = RESTAURANTS.map((rest, r) => {
      let a = rest.activite[w - 1]! * bruit.activite[r]!;
      for (const i of actifs)
        if (i.imprevu.effet.ou?.includes(r)) a *= i.imprevu.effet.activite ?? 1;
      return a;
    });
    const volume = perimetre.reduce((s, dans, f) => s + (dans ? VOLUME[f]! : 0), 0);
    const demande = RESTAURANTS.reduce(
      (s, rest, r) => s + (bascule[r] !== null ? rest.part * activite[r]! * volume : 0),
      0,
    );
    let capacite = premiere === null ? 0 : MONTEE[Math.min(w - premiere, MONTEE.length - 1)]!;
    let achats = 1;
    for (const i of actifs) {
      capacite *= i.imprevu.effet.capacite ?? 1;
      achats *= i.imprevu.effet.achats ?? 1;
    }
    const rupture = demande > 0 ? Math.max(0, 1 - capacite / demande) : 0;

    let brute = 0;
    let jete = 0;
    let incidentsSemaine = 0;
    let coutIncidentsSemaine = 0;
    let prevu = 0;
    let utilise = 0;
    const touches: number[] = [];
    for (let r = 0; r < n; r += 1) {
      const rest = RESTAURANTS[r]!;
      const debut = bascule[r] ?? null;
      if (debut === null || w < debut) continue;
      // La première semaine des relais, la cuisine garde sa production à côté : rien à gagner, rien à rompre.
      const doublon = d5 === 1 && debut === 9 && w === 9;
      let c = borne(1 - PENTE_DU_CONTOURNEMENT * o[r]!, 0.25, 0.97);
      // Une brigade apprend à travailler les produits du laboratoire ; des relais l'y aident.
      const relaye = d5 === 1 && debut === 9;
      const apprentissage = relaye ? (RELAIS[w - debut] ?? 1) : (APPRENTISSAGE[w - debut] ?? 1);
      if (d1 === 3) c = Math.min(c, PLAFOND_DU_VOLONTARIAT);
      for (let f = 0; f < FAMILLES.length; f += 1) {
        if (!perimetre[f]) continue;
        const fam = FAMILLES[f]!;
        const poids = (rest.part * activite[r]!) / 52;
        let gain = (fam.actuel - fam.labo) * poids * achats;
        const coutLabo = fam.labo * poids;
        let part = Math.min(c * apprentissage, 1 - rupture);
        if (f === F.pains) {
          if (painCorrige) gain *= PAIN_CORRIGE;
          else part *= 1 - PAIN_DU_SOIR;
        }
        if (d4 === 3 && w >= 7 && (f === F.fonds || f === F.bases)) gain *= 0.7;
        const livre = imposee[r] ? 1 - rupture : part;
        prevu += coutLabo;
        utilise += coutLabo * part;
        brute += gain * part * (doublon ? 0.5 : 1);
        if (!doublon) jete += PART_JETEE * coutLabo * (livre - part);
      }
      if (doublon) continue;
      // Les incidents de livraison : la tournée, le froid, les ruptures.
      let p = P_INCIDENT * (r === R.megeve ? 1.8 : 1) * (w - debut < 2 ? 1.4 : 1);
      if (w >= 5 && d3 === 1) p *= d2 === 1 ? 0.3 : d2 === 2 ? 0.4 : 0.55;
      if (w >= 5 && d3 === 2) p *= 0.25;
      if (w >= 7 && d4 === 2) p *= 0.7;
      for (const i of actifs)
        if (i.imprevu.effet.ou?.includes(r)) p *= i.imprevu.effet.livraison ?? 1;
      p += P_RUPTURE * rupture;
      if (bruit.incident[r]! < p) {
        const grave = bruit.gravite[r]! < P_GRAVE && !(d3 === 2 && w >= 5);
        incidentsSemaine += 1;
        if (grave) graves += 1;
        coutIncidentsSemaine += (grave ? COUT_GRAVE : COUT_INCIDENT) * (r === R.megeve ? 1.4 : 1);
        note[r] = note[r]! - (grave ? 0.15 : 0.03);
        touches.push(r);
      }
    }
    if (d6 === 1 && w >= 11) brute += GAIN_PETITS_DEJEUNERS * achats;
    if (d6 === 3 && w >= 11) cout += 0.25 * Math.max(0, brute);
    incidents += incidentsSemaine;

    // La note des avis : elle suit, avec retard, ce que les clients trouvent dans l'assiette.
    let qualite = 0;
    for (let r = 0; r < n; r += 1) {
      const rest = RESTAURANTS[r]!;
      const servi = bascule[r] !== null && w >= bascule[r]!;
      let cible = rest.note;
      if (servi && perimetre[F.signatures])
        cible -= CHUTE_SIGNATURES * (d4 === 3 && w >= 7 ? 0.5 : 1);
      if (servi && ecartBases && (perimetre[F.fonds] || perimetre[F.bases])) cible -= ECART_BASES;
      if (servi && perimetre[F.pains] && !painCorrige) cible -= PAIN_RASSIS;
      note[r] = note[r]! + 0.3 * (cible - note[r]!);
      const ca = (rest.ca / 52) * activite[r]!;
      qualite +=
        ca * COUVERTS_PAR_POINT * Math.max(0, rest.note - note[r]!) * MARGE_SUR_COUT_VARIABLE;
      if (r === R.annecy && annonce !== null && w >= annonce)
        qualite += ca * DEPART.couverts * MARGE_SUR_COUT_VARIABLE;
    }

    // Ce que la semaine fait aux chefs : les incidents fâchent, les semaines sans histoire apaisent.
    for (let r = 0; r < n; r += 1) {
      const servi = bascule[r] !== null && w >= bascule[r]!;
      const ici = touches.filter((x) => x === r).length;
      const ailleurs = touches.length - ici;
      let delta = 0.06 * ici + 0.015 * ailleurs;
      if (servi) {
        if (ici === 0) delta -= 0.01;
        delta += 0.06 * rupture;
        if (perimetre[F.pains] && !painCorrige) delta += 0.01;
      }
      o[r] = borne(o[r]! + delta, 0, 1);
    }
    // À bout, Séraphin démissionne : la décision se lit en fin de semaine 8, et encore en fin de
    // semaine 11 pour qui touche alors à ses desserts.
    if ((w === 8 || w === 11) && annonce === null && h.uIgnace < risqueDeDepart(o[R.annecy]!)) {
      annonce = w + 1;
    }

    const fixes = FRAIS_FIXES_SEMAINE;
    const nette = brute - jete - fixes - coutIncidentsSemaine - qualite - cout;
    economie += nette;
    totalBrute += brute;
    cumulBrute += brute - jete;
    cumulFixes += fixes;
    contournements += jete;
    coutIncidents += coutIncidentsSemaine;
    coutQualite += qualite;
    couts += cout;
    semaines.push({
      economie,
      brute: brute - jete,
      nette,
      couverture: cumulBrute / cumulFixes,
      refaits: prevu > 0 ? 1 - utilise / prevu : 0,
      note: moyennePonderee(note),
      incidents,
      servis: bascule.filter((b) => b !== null && b <= w).length,
      rupture,
      opposition: o.reduce((s, x) => s + x, 0) / n,
      oppositionIgnace: o[R.annecy]!,
      contournements: jete,
      coutIncidents: coutIncidentsSemaine,
      coutQualite: qualite,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: economie,
    brute: totalBrute,
    contournements,
    coutIncidents,
    coutQualite,
    coutDepart,
    couts: couts - coutDepart,
    fraisFixes: cumulFixes,
    incidents,
    graves,
    ignacePart: annonce !== null,
    annonceIgnace: annonce,
    reportAccepte: report,
    signatures: perimetre[F.signatures]!,
    signaturesRendues,
    painCorrige,
    servis: fin.servis,
    refaitsFinal: fin.refaits,
    noteFinale: fin.note,
    noteDepart: NOTE_DEPART,
    bascules: bascule,
  };
}

/** Ce qui s'est passé pendant des semaines : bascules, départ, réponse du comité, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const avant = de > 1 ? t.semaines[de - 1]!.incidents : 0;
  const incidents = t.semaines[Math.min(a, SEMAINES)]!.incidents - avant;
  return {
    ignacePart: t.annonceIgnace !== null && dans(t.annonceIgnace),
    ignaceParti: t.annonceIgnace !== null && dans(t.annonceIgnace + 2),
    signaturesRendues: t.signaturesRendues && dans(8),
    report: t.reportAccepte !== null && dans(9) ? t.reportAccepte : null,
    incidents,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureCuisine {
  economie: number | null;
  couverture: number | null;
  refaits: number | null;
  note: number | null;
  incidents: number | null;
  servis: number | null;
  rupture: number | null;
  opposition: number | null;
  ignaceParti: number | null;
}

/** Ce que Théo lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureCuisine {
  if (semaine === 0) {
    return {
      economie: 0,
      couverture: 0,
      refaits: 0,
      note: NOTE_DEPART,
      incidents: 0,
      servis: 0,
      rupture: 0,
      opposition: RESTAURANTS.reduce((s, r) => s + r.opposition, 0) / RESTAURANTS.length,
      ignaceParti: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    economie: s.economie,
    couverture: s.couverture,
    refaits: s.refaits,
    note: s.note,
    incidents: s.incidents,
    servis: s.servis,
    rupture: s.rupture,
    opposition: s.opposition,
    ignaceParti: t.annonceIgnace !== null && semaine >= t.annonceIgnace ? 1 : 0,
  };
}
