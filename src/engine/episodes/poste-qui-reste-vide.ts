/**
 * LE POSTE QUI RESTE VIDE — le modèle de l'agence de Villefranche-sur-Saône.
 *
 * Julien, technico-commercial, est parti il y a trois semaines. Ses 52 clients
 * sont répartis sur les quatre commerciaux qui restent, l'annonce recopiée de
 * l'ancienne n'attire personne, et un candidat « coup de cœur » arrive par
 * recommandation. Treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · LA VACANCE COÛTE CHAQUE SEMAINE. Un client qu'aucun commercial ne
 *     visite achète moins, puis passe à la concurrence ; l'équipe qui porte le
 *     portefeuille en plus du sien délaisse ses propres clients, et s'use.
 *     Aller vite compte — mais pas n'importe comment.
 *   · UN MAUVAIS RECRUTEMENT COÛTE PLUS QU'UNE VACANCE. L'impression d'un
 *     entretien prédit mal : le coup de cœur n'est un bon choix qu'une fois
 *     sur trois, et un entretien « au feeling » retient d'abord celui qui
 *     parle bien. Un entretien structuré (mêmes questions, mise en situation,
 *     grille, références) trie. Encore faut-il avoir des candidats à trier :
 *     c'est l'annonce qui remplit le vivier. Et un bon candidat qui attend
 *     une réponse finit par accepter une autre offre.
 *   · L'INTÉGRATION FAIT LA MONTÉE EN CHARGE. Une recrue présentée aux
 *     clients par un parrain, avec un plan pour ses premières semaines, est
 *     productive en cinq semaines ; laissée seule avec le fichier clients,
 *     elle met trois mois, perd des clients au passage de relais, et part
 *     plus souvent avant la fin de sa période d'essai. Un parrain débordé
 *     n'est pas un parrain : l'intégration dépend de ce qu'on a demandé à
 *     l'équipe en attendant.
 *
 * Le trimestre est jugé en euros : l'écart au budget de contribution du
 * portefeuille de Julien (marge, moins salaire et coûts de recrutement),
 * clients perdus, surcharge de l'équipe et échecs de recrutement compris.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Semaines de vacance avant le début du trimestre : Julien est parti il y a trois semaines. */
export const VACANCE_DEPART = 3;
/** Le portefeuille de Julien : douze gros clients, quarante plus petits. */
export const GRANDS = 12;
export const PETITS = 40;
/** La marge hebdomadaire d'un client suivi. */
export const MARGE_GRAND = 450;
export const MARGE_PETIT = 100;
/** Ce que vaut un client perdu au-delà du trimestre : le fonds de commerce. */
export const VALEUR_GRAND = 3000;
export const VALEUR_PETIT = 600;
/** La marge hebdomadaire des portefeuilles des quatre autres commerciaux. */
export const MARGE_EQUIPE = 37600;
/** La marge des affaires nouvelles qu'un commercial en poste apporte chaque semaine : chantiers, devis, nouveaux clients. */
export const DEVELOPPEMENT = 1500;
/** Le salaire chargé d'un technico-commercial, par semaine. */
export const SALAIRE = 1050;
export const CHARGE_DEPART = 1.25;
export const OBJECTIF_CHARGE = 1.1;
/** Le budget de contribution du portefeuille sur le trimestre, poste pourvu en cours de trimestre. */
export const BUDGET = 70000;
/** La marge hebdomadaire du portefeuille, tous clients suivis. */
export const MARGE_PLEINE = GRANDS * MARGE_GRAND + PETITS * MARGE_PETIT;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux laisse un concurrent passer chez un client. */
export const PERTE_PAR_JOUR = 2000;
/** Ce que coûte un recrutement raté : le salaire versé pour rien, le recrutement à refaire. */
export const COUT_ECHEC = 6000;
/** Le même échec, quand la période d'essai a filé sans décision : un CDI à défaire. */
export const COUT_ECHEC_TARDIF = 15000;
/** Une bonne recrue qui s'en va : tout recommencer, et trois mois de montée en charge perdus. */
export const COUT_DEPART_RECRUE = 12000;
/** Le départ d'un commercial de l'équipe : remplacement et clients délaissés. */
export const COUT_DEPART = 10000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  annonce: 0,
  portefeuille: 1,
  selection: 2,
  offre: 3,
  integration: 4,
  essai: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 3, 1, 1, 2] as const;

export const COUTS = {
  rediffusion: 1800,
  annonce: 400,
  cabinet: 9000,
  primeVisites: 1500,
  prospection: 400,
  agence: 2300,
  surenchere: 3000,
  formation: 1800,
  accompagnement: 700,
  primeObjectif: 1500,
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
  effet: { ventes?: number; attrition?: number; charge?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "concurrent",
    titre: "Un concurrent ouvre une agence à Arnas",
    de: "Nicolas Perrin",
    role: "Technico-commercial senior",
    texte:
      "Un négociant concurrent ouvre une agence à Arnas, à dix minutes. Ses commerciaux font le tour des artisans avec des remises d'ouverture.",
    duree: 3,
    effet: { attrition: 1.8 },
  },
  {
    id: "chantier",
    titre: "Un gros chantier de logements démarre",
    de: "Sylvie Bernard",
    role: "Responsable du comptoir",
    texte:
      "Le chantier des 140 logements de la ZAC démarre : les artisans du secteur commandent en volume pendant deux semaines.",
    duree: 2,
    effet: { ventes: 1.12 },
  },
  {
    id: "intemperies",
    titre: "Deux semaines d'intempéries",
    de: "Sylvie Bernard",
    role: "Responsable du comptoir",
    texte: "Pluie et gel : les chantiers sont à l'arrêt, les artisans n'achètent que l'urgent.",
    duree: 2,
    effet: { ventes: 0.85 },
  },
  {
    id: "arret",
    titre: "Mélanie en arrêt maladie",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Mélanie Garcia est en arrêt deux semaines : ses clients s'ajoutent à ceux que l'équipe porte déjà.",
    duree: 2,
    effet: { charge: 0.2 },
  },
  {
    id: "logiciel",
    titre: "Nouveau logiciel de devis",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le nouveau logiciel de devis est en place : chaque devis prend deux fois plus longtemps, le temps que l'équipe s'y fasse.",
    duree: 2,
    effet: { charge: 0.1 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  ventes: number;
  attrition: number;
  candidatures: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le coup de cœur est-il vraiment un bon technico-commercial ? */
  uCoeur: number;
  /** Le vivier contient-il un bon candidat ? */
  uVivier: number;
  /** La grille se trompe-t-elle ? */
  uGrille: number;
  /** En entretien au feeling, le coup de cœur l'emporte-t-il ? */
  uCharme: number;
  /** Au feeling, le candidat du vivier qui fait la meilleure impression est-il le bon ? */
  uImpression: number;
  /** Le candidat retenu accepte-t-il une autre offre ? */
  uOffre: number;
  /** Le candidat de repli, ou celui d'une relance, est-il bon ? */
  uRepli: number;
  /** Le cabinet a-t-il déjà un candidat dans son vivier ? */
  uCabinet: number;
  /** Bastien démissionne-t-il si l'équipe est à bout ? */
  uBastien: number;
  /** La recrue part-elle avant la fin de sa période d'essai ? */
  uRecrue: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 130363 + 29);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      ventes: Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))),
      attrition: Math.min(1.7, Math.max(0.4, 1 + 0.25 * gauss(r))),
      candidatures: Math.min(1.6, Math.max(0.5, 1 + 0.25 * gauss(r))),
    });
  }
  const uCoeur = r();
  const uVivier = r();
  const uGrille = r();
  const uCharme = r();
  const uImpression = r();
  const uOffre = r();
  const uRepli = r();
  const uCabinet = r();
  const uBastien = r();
  const uRecrue = r();
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
    uCoeur,
    uVivier,
    uGrille,
    uCharme,
    uImpression,
    uOffre,
    uRepli,
    uCabinet,
    uBastien,
    uRecrue,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LE RECRUTEMENT : qui arrive, quand, et ce qu'il vaut.
 * ------------------------------------------------------------------------- */

/** Une fois sur trois seulement, le coup de cœur est un bon technico-commercial. */
export const CHANCE_COEUR = 0.35;

/** Le cabinet a un candidat dans son vivier une fois sur deux : il le présente en semaine 4, sinon en semaine 6. */
export const cabinetRapide = (graine: number) => hasard(graine).uCabinet < 0.5;

/**
 * L'ANNONCE REMPLIT LE VIVIER. Candidatures attendues par semaine, et la part
 * de profils terrain parmi elles. L'annonce recopiée, qui demande « cinq ans
 * dans le négoce » sans dire ni le secteur ni la rémunération, attire des
 * vendeurs de comptoir ; la réécrire prend la première semaine.
 */
export function fluxAnnonce(d1: number, w: number): { flux: number; qualifiees: number } {
  if (d1 === 1 && w >= 2) return { flux: 6, qualifiees: 0.35 };
  if (d1 === 0 && w >= 2) return { flux: 4, qualifiees: 0.1 };
  return { flux: 1.5, qualifiees: 0.1 };
}

/** La probabilité que le vivier contienne un bon candidat, selon le nombre de profils terrain. */
export const chanceVivier = (qualifiees: number) => 1 - Math.exp(-0.5 * qualifiees);

/** La part de chance que le candidat retenu accepte une autre offre, selon la manière de faire l'offre. */
export const REFUS = [0.12, 0.45, 0.35, 0.01] as const;
/** Les semaines que l'offre fait attendre : validation du siège, négociation. */
export const ATTENTE_OFFRE = [0, 2, 1, 0] as const;

export type Candidat = "coeur" | "vivier" | "repli" | "relance";

export interface Recrutement {
  /** La semaine des entretiens, ou de la décision quand on attend. */
  entretiens: number;
  /** La semaine où l'offre part. */
  offre: number;
  candidatures: readonly number[];
  qualifiees: readonly number[];
  chanceVivier: number;
  coeurBon: boolean;
  /** Le premier candidat retenu, avant une éventuelle réponse négative. */
  retenu: Candidat;
  retenuBon: boolean;
  /** Le candidat retenu a-t-il préféré une autre offre ? */
  refus: boolean;
  /** Celui qui arrive finalement. */
  candidat: Candidat;
  bon: boolean;
  /** La semaine où la recrue prend son poste ; au-delà de 13, après le trimestre. */
  arrivee: number;
  cabinetRapide: boolean;
}

const caches = new Map<string, Recrutement>();

export function recrutement(chemin: readonly number[], graine: number): Recrutement {
  const [d1, d2, d3, d4] = chemin as [number, number, number, number];
  const cle = `${graine}:${d1}${d2}${d3}${d4}`;
  const deja = caches.get(cle);
  if (deja) return deja;
  const h = hasard(graine);

  const candidatures = [0];
  const qualifiees = [0];
  for (let w = 1; w <= SEMAINES; w += 1) {
    const { flux, qualifiees: q } = fluxAnnonce(d1, w);
    const c = flux * h.semaines[w]!.candidatures;
    candidatures.push(c);
    qualifiees.push(c * q);
  }

  // Quand l'offre peut partir : après une semaine d'entretiens, ou plus tard si l'on attend.
  let offre = d3 === 3 ? 7 : 5;
  // Sur la route tous les jours, la responsable n'a plus le temps des entretiens.
  if (d2 === 3) offre += 1;
  const rapide = cabinetRapide(graine);
  if (d1 === 2) offre = Math.max(offre, (rapide ? 4 : 6) + 1);
  // Qui attend trop longtemps ne trouve plus les premiers candidats : ils ont signé ailleurs.
  let vivier = 0;
  for (let w = d3 === 3 ? offre - 3 : 1; w < offre; w += 1) vivier += qualifiees[w]!;
  if (d1 === 2) vivier += 2.4;
  const chance = chanceVivier(vivier);
  const vivierBon = h.uVivier < chance;
  const coeurBon = h.uCoeur < CHANCE_COEUR;
  // Relancer avec une annonce qui n'attire personne prend plus de temps.
  const relance = d1 === 1 || d1 === 2 ? 3 : 5;

  let retenu: Candidat;
  let bon: boolean;
  if (d3 === 0) {
    retenu = "coeur";
    bon = coeurBon;
  } else if (d3 === 1) {
    // La grille et la mise en situation trient : le coup de cœur passe s'il est bon.
    if (coeurBon) {
      retenu = "coeur";
      bon = true;
    } else if (vivierBon) {
      retenu = "vivier";
      bon = h.uGrille >= 0.05;
    } else {
      // Personne ne passe la grille : on relance, et l'annonce dit combien de temps cela prend.
      retenu = "relance";
      offre += relance;
      bon = h.uGrille >= 0.2;
    }
  } else if (d3 === 2) {
    // Au feeling, celui qui parle bien l'emporte une fois sur deux.
    if (h.uCharme < 0.5) {
      retenu = "coeur";
      bon = coeurBon;
    } else {
      retenu = "vivier";
      bon = vivierBon && h.uImpression < 0.6;
    }
  } else {
    // Attendre le profil idéal : le coup de cœur et les premiers candidats ont signé
    // ailleurs ; il ne reste que ceux des dernières semaines, qu'on trie avec exigence.
    if (vivierBon) {
      retenu = "vivier";
      bon = h.uGrille >= 0.1;
    } else {
      retenu = "relance";
      offre += relance;
      bon = h.uGrille >= 0.3;
    }
  }

  const retenuBon = bon;
  const entretiens = retenu === "relance" ? offre - relance : offre;
  // Le candidat qui attend une réponse accepte une autre offre.
  const pRefus = REFUS[d4]! * (d3 === 0 ? 0.5 : 1);
  const refus = h.uOffre < pRefus;
  let candidat: Candidat = retenu;
  let arrivee = offre + ATTENTE_OFFRE[d4]! + 1 + (retenu === "coeur" ? 0 : 2);
  if (refus) {
    candidat = "repli";
    // On se rabat sur le deuxième ; qui n'a vu personne d'autre doit tout recommencer.
    // Le repli vaut ce que valait la sélection, et sa propre offre attend autant.
    const repli = d3 === 0 ? 4 : 3;
    const chanceRepli =
      d3 === 0 ? 0.4 : d3 === 1 ? (vivierBon ? 0.75 : 0.5) : d3 === 2 ? 0.45 : 0.6;
    bon = h.uRepli < chanceRepli;
    arrivee = offre + ATTENTE_OFFRE[d4]! + repli + ATTENTE_OFFRE[d4]! + 1 + 2;
  }

  const r: Recrutement = {
    entretiens,
    offre,
    candidatures,
    qualifiees,
    chanceVivier: chance,
    coeurBon,
    retenu,
    retenuBon,
    refus,
    candidat,
    bon,
    arrivee,
    cabinetRapide: rapide,
  };
  caches.set(cle, r);
  return r;
}

/**
 * LA MONTÉE EN CHARGE, semaine après semaine depuis l'arrivée. Un parrain
 * débordé (l'équipe fait des visites en plus) n'est qu'à moitié parrain ; une
 * responsable déjà sur la route ne peut pas accompagner la recrue.
 */
export function rythme(chemin: readonly number[], w: number, k: number): number {
  // Avant la décision de la semaine 7, la recrue est accueillie comme on peut.
  if (w < DEBUT_INTEGRATION) return ACCUEIL;
  const d2 = chemin[D.portefeuille];
  switch (chemin[D.integration]) {
    case 0:
      return d2 === 2 ? 0.11 : 0.2;
    case 2:
      return k <= 2 ? 0 : 0.17;
    case 3:
      return d2 === 3 ? 0.09 : 0.17;
    default:
      return 0.08;
  }
}

/** La semaine où l'intégration décidée en fin de semaine 7 commence. */
export const DEBUT_INTEGRATION = 8;
/** La montée en charge d'une recrue arrivée avant : un accueil sans plan. */
export const ACCUEIL = 0.1;
/** Les clients qui partent au passage de relais, par semaine, pendant le premier mois. */
export const RELAIS = [0.003, 0.02, 0.012, 0.004] as const;
/** Le risque qu'une bonne recrue parte en période d'essai, selon son intégration. */
export const DEPART_RECRUE = [0.1, 0.35, 0.15, 0.1] as const;

/** Le risque que Bastien démissionne, lu sur la surcharge cumulée de l'équipe en fin de semaine 8. */
export const risqueBastien = (surcharge: number) =>
  Math.min(0.8, Math.max(0, (surcharge - 0.6) * 0.7));

/** La couverture du portefeuille par l'équipe en attendant, gros et petits clients, et la charge en plus. */
export function interim(d2: number, w: number): { grands: number; petits: number; charge: number } {
  if (w <= 2 || d2 === 0) return { grands: 0.5, petits: 0.3, charge: 0.25 };
  if (d2 === 1) return { grands: 0.75, petits: 0.4, charge: 0.15 };
  if (d2 === 2) return { grands: 0.75, petits: 0.55, charge: 0.35 };
  return { grands: 0.9, petits: 0.35, charge: 0.08 };
}

export type Semaine = {
  /** Candidatures reçues depuis le début du trimestre. */
  candidatures: number;
  /** Semaines sans commercial sur le portefeuille, depuis le départ de Julien. */
  vacance: number;
  /** Clients du portefeuille perdus depuis le début du trimestre. */
  clientsPerdus: number;
  /** Charge de l'équipe : 1, chacun son portefeuille. */
  charge: number;
  /** Montée en charge de la recrue ; 0 tant qu'elle n'est pas là. */
  montee: number;
  /** 1 si une recrue est en poste. */
  presente: number;
  /** Marge du portefeuille de Julien dans la semaine. */
  marge: number;
  /** Ce que la semaine apporte à l'objectif : marge, moins salaires, coûts et pertes. */
  contribution: number;
  /** Dépenses de recrutement et d'intégration cumulées. */
  depenses: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de contribution du portefeuille, pertes et échecs compris. */
  objectif: number;
  recrutement: Recrutement;
  /** La semaine d'arrivée de la recrue, si elle arrive dans le trimestre. */
  arrivee: number | null;
  bastienPart: boolean;
  /** La recrue est partie (ou a été remerciée) avant la fin du trimestre. */
  recruePart: boolean;
  rupture: boolean;
  /** Le coût d'un recrutement raté, compté dans l'objectif. */
  echec: number;
  clientsPerdus: number;
  grandsPerdus: number;
  vacanceTotale: number;
  chargeMoyenne: number;
  monteeFinale: number;
  depenses: number;
  margeTotale: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, , d4, d5, d6] = chemin as [number, number, number, number, number, number];
  const rec = recrutement(chemin, graine);
  const arrivee = rec.arrivee <= SEMAINES ? rec.arrivee : null;
  const semaines: (Semaine | null)[] = [null];
  let grands = GRANDS;
  let petits = PETITS;
  let montee = 0;
  let candidatures = 0;
  let vacance = VACANCE_DEPART;
  let depenses = 0;
  let surcharge = 0;
  let bastien = false;
  let partie = false;
  let rupture = false;
  let echec = 0;
  let margeTotale = 0;
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  // Une mauvaise recrue se voit quand on fait le point, ou quand on l'accompagne.
  const vue = d6 === 0 || d5 === 3;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let depense = 0;
    let autres = w === 1 ? enquete : 0;

    // La rupture de la période d'essai, décidée en fin de semaine 10.
    if (w === 11 && d6 === 1 && arrivee !== null && arrivee <= 10 && !partie) {
      partie = true;
      rupture = true;
      echec += COUT_ECHEC;
      autres += COUT_ECHEC;
    }
    const presente = arrivee !== null && w >= arrivee && !partie;
    const k = presente ? w - arrivee + 1 : 0;
    // Les semaines depuis le début de l'intégration choisie.
    const ki =
      presente && w >= DEBUT_INTEGRATION ? w - Math.max(arrivee, DEBUT_INTEGRATION) + 1 : 0;
    if (presente) {
      // Sans retour à mi-période d'essai, la recrue ne sait plus quoi corriger : elle plafonne.
      if (!(w >= 11 && d6 === 2)) montee += rythme(chemin, w, ki);
      if (w >= 11 && d6 === 0) montee += 0.05;
      if (w >= 11 && d6 === 3) montee += 0.02;
      montee = Math.min(rec.bon ? 1 : 0.45, montee);
    } else {
      vacance += 1;
    }
    // Une mauvaise recrue visite, mais ses visites produisent peu : devis faux, relances oubliées.
    const efficace = presente ? (rec.bon ? montee : 0.5 * montee) : 0;
    // La responsable qui l'accompagne voit les erreurs et les rattrape.
    const degats = presente && !rec.bon ? 0.015 * montee * (ki >= 1 && d5 === 3 ? 0.3 : 1) : 0;
    const relais = presente && k <= 4 ? (w < DEBUT_INTEGRATION ? RELAIS[1] : RELAIS[d5]!) : 0;

    // Qui suit les clients de Julien.
    const it = interim(d2, w);
    const repris = bastien ? 0.85 : 1;
    const couvG = efficace + (1 - efficace) * it.grands * repris;
    const couvP = efficace + (1 - efficace) * it.petits * repris;

    // La charge de l'équipe : le portefeuille en plus, le parrainage, les imprévus.
    let charge = 1 + it.charge * (1 - efficace);
    if (ki >= 1 && ki <= 4 && d5 === 0) charge += 0.06;
    if (bastien) charge += 0.2;
    for (const a of actifs) charge += a.imprevu.effet.charge ?? 0;
    surcharge += Math.max(0, charge - OBJECTIF_CHARGE);

    // Ce que le portefeuille rapporte, et ce qu'il perd.
    let ventes = n.ventes;
    let attrition = n.attrition;
    for (const a of actifs) {
      ventes *= a.imprevu.effet.ventes ?? 1;
      attrition *= a.imprevu.effet.attrition ?? 1;
    }
    const marge =
      (grands * MARGE_GRAND * (0.6 + 0.4 * couvG) +
        petits * MARGE_PETIT * (0.6 + 0.4 * couvP) +
        DEVELOPPEMENT * efficace * (w >= 11 ? [1.3, 1, 1, 1.15][d6]! : 1)) *
      ventes;
    const perdusG = grands * borne((0.045 * (1 - couvG) + degats + relais) * attrition, 0, 0.3);
    const perdusP = petits * borne((0.022 * (1 - couvP) + degats + relais) * attrition, 0, 0.3);
    grands -= perdusG;
    petits -= perdusP;
    const valeurPerdue = perdusG * VALEUR_GRAND + perdusP * VALEUR_PETIT;
    const perteEquipe = MARGE_EQUIPE * 0.25 * Math.max(0, charge - 1.05);

    // Ce que la semaine coûte.
    if (w === 1) depense += [COUTS.rediffusion, COUTS.annonce, COUTS.cabinet, 0][d1]!;
    const enAttente = arrivee === null || w < arrivee;
    if (w >= 3 && enAttente && d2 === 1) autres += COUTS.prospection;
    if (w >= 3 && enAttente && d2 === 2) depense += COUTS.primeVisites;
    if (w >= 3 && enAttente && d2 === 3) autres += COUTS.agence;
    if (presente && k === 1 && d4 === 3) depense += COUTS.surenchere;
    if (ki === 1 && d5 === 2) depense += COUTS.formation;
    if (ki >= 1 && ki <= 4 && d5 === 3) autres += COUTS.accompagnement;
    if (w === 13 && d6 === 3 && presente) depense += COUTS.primeObjectif;
    const salaire = presente ? SALAIRE + (d4 === 3 ? 40 : d4 === 2 ? -40 : 0) : 0;
    depenses += depense;

    // À bout, Bastien démissionne : la décision se lit en fin de semaine 8.
    if (w === 8 && h.uBastien < risqueBastien(surcharge)) {
      bastien = true;
      autres += COUT_DEPART;
    }
    // En fin de semaine 12, la recrue reste ou s'en va.
    if (w === 12 && presente && k >= 3) {
      const risque = rec.bon ? DEPART_RECRUE[d5]! * [0.4, 1, 2.5, 1][d6]! : vue ? 0 : 0.4;
      if (h.uRecrue < risque) {
        partie = true;
        const cout = rec.bon ? COUT_DEPART_RECRUE : COUT_ECHEC;
        echec += cout;
        autres += cout;
      }
    }

    candidatures += w < rec.offre ? rec.candidatures[w]! : 0;
    margeTotale += marge;
    const contribution = marge - salaire - depense - valeurPerdue - perteEquipe - autres;
    semaines.push({
      candidatures,
      vacance,
      clientsPerdus: GRANDS + PETITS - grands - petits,
      charge,
      montee: presente ? montee : 0,
      presente: presente ? 1 : 0,
      marge,
      contribution,
      depenses,
    });
  }

  // Une mauvaise recrue encore en poste : l'échec viendra au trimestre suivant. Vu à
  // temps, il se règle à la fin de la période d'essai ; sinon, c'est un CDI à défaire.
  const tardif =
    arrivee !== null && !partie && !rec.bon ? (vue ? COUT_ECHEC : COUT_ECHEC_TARDIF) : 0;
  echec += tardif;
  const pleines = semaines.slice(1) as Semaine[];
  const total = pleines.reduce((s, x) => s + x.contribution, 0);
  const fin = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: total - tardif - BUDGET,
    recrutement: rec,
    arrivee,
    bastienPart: bastien,
    recruePart: partie,
    rupture,
    echec,
    clientsPerdus: fin.clientsPerdus,
    grandsPerdus: GRANDS - grands,
    vacanceTotale: fin.vacance,
    chargeMoyenne: pleines.reduce((s, x) => s + x.charge, 0) / SEMAINES,
    monteeFinale: fin.montee,
    depenses,
    margeTotale,
  };
}

/** La semaine où le candidat retenu répond à l'offre. */
export const semaineDeReponse = (chemin: readonly number[], graine: number) =>
  recrutement(chemin, graine).offre + Math.max(1, ATTENTE_OFFRE[chemin[D.offre]!]!);

/** La semaine où la recrue quitte l'agence, si elle part pendant le trimestre. */
export function semaineDeDepart(t: Trimestre): number | null {
  if (!t.recruePart) return null;
  return t.rupture ? 11 : 12;
}

/** Ce qui s'est passé pendant des semaines : sélection, réponse à l'offre, arrivée, départs, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const rec = t.recrutement;
  const dans = (w: number) => w >= de && w <= a;
  const reponse = semaineDeReponse(chemin, graine);
  const depart = semaineDeDepart(t);
  return {
    /** La semaine d'entretiens : ce que la sélection a donné. */
    selection: dans(rec.entretiens) && chemin[D.selection] !== 0,
    /** Le coup de cœur a signé ailleurs pendant qu'on attendait. */
    coeurParti: chemin[D.selection] === 3 && dans(6),
    refus: rec.refus && dans(reponse),
    accepte: !rec.refus && rec.arrivee <= SEMAINES && dans(reponse),
    arrivee: t.arrivee !== null && dans(t.arrivee),
    reclamation: t.arrivee !== null && !rec.bon && t.arrivee + 3 <= SEMAINES && dans(t.arrivee + 3),
    bastienPart: t.bastienPart && dans(8),
    recruePart: depart !== null && !t.rupture && dans(depart),
    rupture: t.rupture && dans(11),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** Un code par personne, pour que le tableau de bord puisse dire de qui il parle. */
export const codeCandidat = (c: Candidat, bon: boolean) =>
  c === "coeur" ? 0 : c === "vivier" ? (bon ? 1 : 2) : c === "relance" ? 3 : 4;

export interface LectureAgence {
  candidatures: number | null;
  vacance: number | null;
  clientsPerdus: number | null;
  charge: number | null;
  montee: number | null;
  /** Les semaines écoulées depuis l'arrivée de la recrue ; null tant qu'elle n'est pas là. */
  semainesEnPoste: number | null;
  /** Ce que la vérification des références révélerait du coup de cœur : 1, un bon commercial. */
  coeurBon: number;
  /** La recrue en poste est-elle bonne ? 1, oui ; 0, non ; null, pas de recrue. */
  recrueBonne: number | null;
  /** Les profils terrain reçus. */
  qualifiees: number | null;
  /** Le candidat retenu à l'issue de la sélection (code), une fois les entretiens passés. */
  retenu: number | null;
  /** La recrue en poste, ou attendue une fois l'offre acceptée (code). */
  recrue: number | null;
  /** La semaine d'arrivée prévue, si elle tombe dans le trimestre. */
  arrivee: number | null;
  /** 1 si le cabinet a un candidat dans son vivier. */
  cabinetRapide: number;
}

/** Ce que la responsable lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAgence {
  const coeurBon = hasard(graine).uCoeur < CHANCE_COEUR ? 1 : 0;
  if (semaine === 0) {
    return {
      candidatures: 0,
      vacance: VACANCE_DEPART,
      clientsPerdus: 0,
      charge: CHARGE_DEPART,
      montee: null,
      semainesEnPoste: null,
      coeurBon,
      recrueBonne: null,
      qualifiees: 0,
      retenu: null,
      recrue: null,
      arrivee: null,
      cabinetRapide: cabinetRapide(graine) ? 1 : 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const rec = t.recrutement;
  let qualifiees = 0;
  for (let w = 1; w <= semaine && w < rec.offre; w += 1) qualifiees += rec.qualifiees[w]!;
  const choisi = decisions.length > D.selection && semaine >= rec.entretiens;
  return {
    candidatures: s.candidatures,
    vacance: s.vacance,
    clientsPerdus: s.clientsPerdus,
    charge: s.charge,
    montee: s.presente ? s.montee : null,
    semainesEnPoste: s.presente ? semaine - t.arrivee! + 1 : null,
    coeurBon,
    recrueBonne: s.presente ? (rec.bon ? 1 : 0) : null,
    qualifiees,
    retenu: choisi ? codeCandidat(rec.retenu, rec.retenuBon) : null,
    recrue:
      s.presente || (decisions.length > D.offre && t.arrivee !== null && semaine < t.arrivee)
        ? codeCandidat(rec.candidat, rec.bon)
        : null,
    arrivee: decisions.length > D.offre ? t.arrivee : null,
    cabinetRapide: rec.cabinetRapide ? 1 : 0,
  };
}
