/**
 * L'INDICATEUR QUI MENT — le modèle des plateaux de prise de commande.
 *
 * Quatorze conseillers sur deux plateaux, des artisans qui appellent pour
 * commander, treize semaines, six décisions. Le siège pilote les plateaux sur
 * un seul chiffre, le taux d'appels décrochés en moins de trente secondes, et
 * une prime d'équipe y est attachée. Trois mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · QUAND UN INDICATEUR DEVIENT UN OBJECTIF, IL CESSE D'ÊTRE UNE BONNE
 *     MESURE (loi de Goodhart). La PRESSION sur le décroché raccourcit les
 *     appels : on décroche vite, on écourte, on transfère, on promet de
 *     rappeler. Le décroché reste vert, la commande ne se prend plus au
 *     premier appel ; les clients rappellent — ce qui charge encore la ligne —
 *     ou commandent ailleurs. Pousser l'indicateur fait baisser le résultat.
 *   · ON NE CORRIGE QUE CE QU'ON MESURE. Tant que personne ne suit les
 *     commandes prises au premier appel, la moyenne cache les écarts entre
 *     conseillers : un accompagnement ne peut pas viser ceux qui fabriquent
 *     les rappels. Un indicateur de RÉSULTAT à côté de l'indicateur
 *     d'activité rend les autres décisions efficaces ; dix indicateurs de plus
 *     ne rendent rien, sinon du reporting.
 *   · UNE RÈGLE DU JEU SE CHANGE AVEC CEUX QUI JOUENT. Supprimer la prime
 *     d'un coup retire la pression mais casse l'ENGAGEMENT ; la refondre avec
 *     l'équipe sur un indicateur de résultat retire la pression sans rien
 *     casser. Et tant que la prime reste attachée au décroché, toute décision
 *     qui le fait baisser pour de bonnes raisons se paie en démotivation.
 *
 * Le trimestre est jugé en euros : la marge des commandes prises à distance,
 * moins ce que coûtent les rappels, les primes, les renforts et les clients
 * perdus, en écart au budget. Un indicateur vert n'y rapporte rien.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CONSEILLERS = 14;
/** Les appels nouveaux d'une semaine ordinaire, avant les rappels. */
export const APPELS = 1500;
/** La part des appels qui portent une commande. */
export const PART_COMMANDE = 0.55;
/** Le chiffre d'affaires et la marge d'une commande prise à distance. */
export const PANIER = 330;
export const MARGE_COMMANDE = 80;
/** Ce que coûte un client qui commande ailleurs : les commandes qu'il ne passera plus. */
export const VALEUR_CLIENT_PERDU = 60;
/** Le temps de conseiller qu'un rappel consomme, en euros. */
export const COUT_RAPPEL = 3;
/** Les minutes de téléphone qu'un conseiller présent offre par semaine. */
export const MINUTES_PAR_CONSEILLER = 1300;
/** La durée d'un appel de commande quand personne ne presse, en minutes. */
export const DUREE_LIBRE = 6.5;
/** La saisie après l'appel, en minutes. */
export const SAISIE = 1.5;
export const OBJECTIF_DECROCHE = 0.9;
export const OBJECTIF_PREMIER_APPEL = 0.7;
export const SEUIL_RAPPEL = 0.15;
/** La prime d'équipe : 250 € par conseiller et par mois quand le décroché tient. */
export const PRIME_MOIS = 250 * CONSEILLERS;
/** Un poste de conseiller, charges comprises, par semaine. */
export const COUT_POSTE = 1000;
/** Le budget de contribution du trimestre : marge des commandes à distance, moins leurs coûts. */
export const BUDGET = 630000;
/** Le chiffre d'affaires à distance budgété, par semaine. */
export const CA_BUDGET = 215000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des commandes s'en vont. */
export const PERTE_PAR_JOUR = 2000;
export const COUT_RECRUTEMENT = 6000;
/** La pression sur le décroché et l'engagement de l'équipe au début du trimestre. */
export const PRESSION_DEPART = 0.6;
export const ENGAGEMENT_DEPART = 0.6;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  mesure: 0,
  prime: 1,
  ecarts: 2,
  postes: 3,
  pic: 4,
  tableau: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 3, 2, 3, 0] as const;

export const COUTS = {
  ecoute: 1500,
  reporting: 500,
  ateliers: 1200,
  formation: 4200,
  interim: 1300,
} as const;

/** Les mois de la prime : elle se lit sur le décroché moyen de chaque mois. */
export const MOIS: readonly (readonly [number, number])[] = [
  [1, 4],
  [5, 8],
  [9, 13],
];

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
  effet: { appels?: number; capacite?: number; absents?: number; resolution?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "standard",
    titre: "Panne du standard téléphonique",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le standard a coupé une journée et demie : les appels sont tombés sur la messagerie, à rappeler un par un.",
    duree: 1,
    effet: { capacite: 0.8 },
  },
  {
    id: "rupture",
    titre: "Rupture sur les plaques de plâtre",
    de: "Achats",
    role: "Siège",
    texte:
      "Le fournisseur de plaques de plâtre livre avec trois semaines de retard : les artisans appellent pour trouver une solution, et beaucoup ne commandent pas.",
    duree: 2,
    effet: { appels: 1.1, resolution: -0.05 },
  },
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "La grippe touche les deux plateaux : deux conseillers absents en moyenne pendant deux semaines.",
    duree: 2,
    effet: { absents: 2 },
  },
  {
    id: "pluie",
    titre: "Une semaine de pluie",
    de: "Direction commerciale",
    role: "Région",
    texte:
      "Une semaine de pluie sans interruption : les chantiers s'arrêtent, les artisans ne commandent plus.",
    duree: 1,
    effet: { appels: 0.82 },
  },
  {
    id: "site",
    titre: "Panne du site de commande en ligne",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le site de commande en ligne est resté en panne trois jours : ses clients ont tous appelé les plateaux.",
    duree: 1,
    effet: { appels: 1.2 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  appels: number;
  absence: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le siège accepte-t-il de changer d'indicateur ? */
  uSiege: number;
  /** Yasmine part-elle si l'équipe décroche ? */
  uYasmine: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 6700417 + 59);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      appels: Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))),
      absence: Math.min(1.6, Math.max(0.5, 1 + 0.25 * gauss(r))),
    });
  }
  const uSiege = r();
  const uYasmine = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uSiege, uYasmine, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * LE SIÈGE CHANGE-T-IL D'INDICATEUR ?
 *
 * Six fois sur dix, la note convainc : le siège laisse les deux postes et suit
 * les commandes prises au premier appel. Sinon, il tranche et reprend un poste
 * en semaine 11. Le tirage ne dépend que du hasard du trimestre : proposer
 * paie en moyenne, mais c'est un pari, quand le report est une certitude.
 */
export const CHANCE_SIEGE = 0.6;
export const siegeAccepte = (chemin: readonly number[], graine: number) =>
  chemin[D.postes] === 1 && hasard(graine).uSiege < CHANCE_SIEGE;

/** Le risque que Yasmine démissionne, lu sur l'engagement de l'équipe en fin de semaine 8. */
export const risqueDeDepart = (engagement: number) =>
  Math.min(0.85, Math.max(0, (0.52 - engagement) * 3.5));

/** Les commandes prises au premier appel apparaissent-elles au tableau de bord en semaine w ? */
export function mesure(chemin: readonly number[], w: number): boolean {
  return (
    ((chemin[D.mesure] === 1 || chemin[D.mesure] === 2) && w >= 2) ||
    (chemin[D.prime] === 1 && w >= 5) ||
    (chemin[D.tableau] === 1 && w >= 12)
  );
}

export type Semaine = {
  /** Part des appels décrochés en moins de 30 secondes, telle que le siège la lit. */
  decroche: number;
  /** Durée moyenne d'un appel, en minutes. */
  dmc: number;
  /** Part des appels de commande aboutis du premier coup. */
  premierAppel: number;
  /** Part des appelants qui devront rappeler sous 48 heures. */
  rappel: number;
  /** Appels reçus, rappels compris. */
  appels: number;
  /** Chiffre d'affaires à distance de la semaine. */
  ca: number;
  /** Marge des commandes à distance cumulée depuis le début du trimestre. */
  marge: number;
  /** Ce que la semaine a coûté : primes, renforts, rappels, clients perdus. */
  cout: number;
  /** Ce que la semaine a rapporté : sa marge, moins son coût. */
  contribution: number;
  /** La contribution cumulée depuis le début du trimestre. */
  cumul: number;
  pression: number;
  engagement: number;
  presents: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de contribution, pertes comprises : positif, les plateaux font mieux. */
  objectif: number;
  marge: number;
  couts: number;
  ca: number;
  /** Les mois où la prime a été versée, sur trois. */
  primesVersees: number;
  /** Les fins de mois, après la semaine 4, où la prime au décroché a sauté. */
  primesSautees: readonly number[];
  /** Le joueur a-t-il porté le sujet au siège, et le siège a-t-il accepté ? */
  siegeConsulte: boolean;
  siegeAccepte: boolean;
  yasminePart: boolean;
  clientsPerdus: number;
  decrocheMoyen: number;
  premierAppelMoyen: number;
  rappelMoyen: number;
  caMoyen: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const accepte = siegeAccepte(chemin, graine);
  /**
   * L'équipe voit-elle, conseiller par conseiller, ses commandes au premier
   * appel dès la semaine 2 ? C'est ce qui permet de viser l'accompagnement, et
   * de refondre la prime sur des chiffres que tout le monde connaît déjà.
   */
  const voit = d1 === 1;
  const semaines: (Semaine | null)[] = [null];
  let pression = PRESSION_DEPART;
  let engagement = ENGAGEMENT_DEPART;
  let competence = 0;
  let rappelsAvant = 410;
  let chargeAvant = 0.82;
  let marge = 0;
  let couts = 0;
  let ca = 0;
  let clientsPerdus = 0;
  let yasmine = false;
  let primesVersees = 0;
  const primesSautees: number[] = [];
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  /** Le seuil de la prime au décroché, le mois de la semaine w ; null quand elle n'en dépend plus. */
  const seuilDuMois = (w: number) =>
    w <= 4 || d2 === 2 ? OBJECTIF_DECROCHE : d2 === 3 ? 0.95 : null;
  /**
   * LA COURSE À LA PRIME. Quand le décroché du mois passe sous le seuil, les
   * conseillers le voient au tableau et pressent les appels pour sauver la
   * prime : c'est là que l'indicateur fabrique le plus de rappels.
   */
  const primeEnDanger = (w: number) => {
    const seuil = seuilDuMois(w);
    return seuil !== null && w > 1 && semaines[w - 1]!.decroche < seuil;
  };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? perte : 0;

    // La pression que l'équipe sent sur le décroché : elle suit les règles du jeu, avec retard.
    let cible = PRESSION_DEPART;
    const course = primeEnDanger(w);
    if (course) cible += 0.15;
    if (d1 === 0 && w >= 2) cible += 0.25;
    if (d1 === 1 && w >= 2) cible -= 0.12;
    if (d1 === 2 && w >= 2) cible -= 0.04;
    if (d2 === 0 && w >= 5) cible -= 0.2;
    if (d2 === 1 && w >= (voit ? 5 : 7)) cible -= voit ? 0.25 : 0.15;
    if (d2 === 3 && w >= 5) cible += 0.12;
    if (d3 === 0 && w >= 6) cible += 0.1;
    if (accepte && w >= 9) cible -= 0.35;
    if (d4 === 0 && w >= 9) cible += 0.08;
    if (d5 === 0 && w >= 10 && w <= 12) cible += 0.05;
    if (d6 === 0 && w >= 12) cible += 0.05;
    if (d6 === 1 && w >= 12) cible -= 0.1;
    // Le siège regarde toujours un peu le chrono : la pression ne descend pas sous 0,15.
    pression = borne(pression + 0.5 * (borne(cible, 0.15, 1) - pression), 0, 1);

    // L'engagement : ce que l'équipe pense de la façon dont on la juge.
    let envie = ENGAGEMENT_DEPART;
    if (d1 === 0 && w >= 2) envie -= 0.06;
    if (d1 === 1 && w >= 2) envie += 0.04;
    if (d1 === 2 && w >= 2) envie -= 0.04;
    if (d2 === 0 && w >= 4) envie -= 0.1;
    if (d2 === 1 && w >= 5) envie += 0.08;
    if (d2 === 3 && w >= 5) envie -= 0.05;
    if (d3 === 0 && w >= 6) envie -= 0.08;
    if (d3 === 1 && w >= 6 && voit) envie += 0.03;
    if (d4 === 0 && w >= 9) envie -= 0.04;
    if (accepte && w >= 9) envie += 0.1;
    if (d6 === 1 && w >= 12) envie += 0.03;
    if (d6 === 2 && w >= 12) envie -= 0.04;
    engagement = borne(engagement + 0.3 * (envie - engagement), 0, 0.8);
    if (d2 === 0 && w === 4) engagement -= 0.12; // La note de service tombe : le choc.

    // Ce que les conseillers savent faire : l'accompagnement ne vise juste que si l'on mesure.
    if (d3 === 1 && w >= 6 && w <= 9) competence += voit ? 0.009 : 0.003;
    if (d3 === 2 && w === 8) competence += 0.02;
    if (yasmine && w === 10) competence -= 0.03;

    // Qui est là.
    let postes = CONSEILLERS;
    if (w >= 9) postes -= d4 === 0 ? 2 : d4 === 3 ? 1 : 0;
    if (w >= 11 && d4 === 1 && !accepte) postes -= 1; // Le siège tranche, le temps d'organiser.
    if (yasmine && w >= 10) postes -= 1;
    let absents = 0;
    for (const a of actifs) absents += a.imprevu.effet.absents ?? 0;
    const tauxAbsence = (0.04 + 0.1 * Math.max(0, 0.6 - engagement)) * n.absence;
    let presents = (postes - absents) * (1 - tauxAbsence);
    if (d5 === 1 && w >= 10 && w <= 12) presents += 2 * 0.6; // Les intérimaires, qui apprennent.

    let efficacite = 1;
    if (d1 === 2 && w >= 2) efficacite *= 0.98; // Le reporting quotidien.
    if (d3 === 1 && w >= 6 && w <= 7) efficacite *= 0.96;
    if (d3 === 2 && w === 7) efficacite *= 0.8; // Deux jours de formation.
    if (d6 === 2 && w >= 12) efficacite *= 0.97;
    for (const a of actifs) efficacite *= a.imprevu.effet.capacite ?? 1;
    const capacite = presents * MINUTES_PAR_CONSEILLER * efficacite;

    // Les appels : les nouveaux, et les rappels que la semaine précédente a fabriqués.
    let nouveaux = APPELS * n.appels;
    if (w >= 10 && w <= 12) nouveaux *= 1.2; // Le pic de printemps.
    for (const a of actifs) nouveaux *= a.imprevu.effet.appels ?? 1;
    const appels = nouveaux + rappelsAvant;
    const dmc = DUREE_LIBRE * (1 - 0.35 * pression);
    const charge = (appels * (dmc + SAISIE)) / Math.max(1, capacite);
    /** Le décroché vécu par les clients ; celui que le siège lit peut s'en écarter. */
    const decrocheReel = borne(0.99 - 0.6 * Math.max(0, charge - 0.68), 0.55, 0.99);
    let decroche = decrocheReel;

    // La commande au premier appel : ce que la pression, la charge et l'engagement en laissent.
    let premierAppel =
      0.71 -
      0.15 * pression +
      competence +
      0.12 * (engagement - ENGAGEMENT_DEPART) -
      0.2 * Math.max(0, chargeAvant - 0.85);
    if (d1 === 2 && w >= 2) premierAppel -= 0.01; // Dix chiffres, aucun qui guide.
    if (d6 === 1 && w >= 12) premierAppel += 0.015;
    if (d6 === 2 && w >= 12) premierAppel -= 0.015;
    if (d5 === 1 && w >= 10 && w <= 12) premierAppel -= 0.025; // Les intérimaires transfèrent.
    if (d5 === 0 && w >= 10 && w <= 12) {
      premierAppel -= 0.03; // Le rappel automatique arrive trop tard.
      decroche = Math.min(0.99, decroche + 0.08);
    }
    if (d5 === 2 && w >= 10 && w <= 12) {
      premierAppel += 0.035; // Les commandes de chantier passent d'abord.
      decroche = Math.max(0.55, decroche - 0.1);
    }
    if (course) premierAppel -= 0.03; // On écourte pour sauver la prime.
    if (accepte && w >= 9) premierAppel += 0.02; // Le siège regarde enfin le résultat.
    for (const a of actifs) premierAppel += a.imprevu.effet.resolution ?? 0;
    premierAppel = borne(premierAppel, 0.4, 0.8);

    // Où vont les appels : ceux qui ne décrochent pas raccrochent souvent.
    const traites = appels * (1 - 0.5 * (1 - decrocheReel));
    const resolus = traites * premierAppel;
    const nonResolus = appels - resolus;
    const rappels = nonResolus * 0.55;
    const perdus = nonResolus * 0.2 * PART_COMMANDE;
    const commandes = resolus * PART_COMMANDE;
    const margeSemaine = commandes * MARGE_COMMANDE;
    const caSemaine = commandes * PANIER;

    // La prime : lue à la fin de chaque mois, sur le décroché moyen du mois.
    const mois = MOIS.find(([, fin]) => w === fin);
    let prime = 0;
    if (mois) {
      const [de, a] = mois;
      const passe = [...semaines.slice(de, a).map((s) => s!.decroche), decroche];
      const moyen = passe.reduce((s, x) => s + x, 0) / passe.length;
      const nouvelle = w > 4 && d2 === 1;
      const supprimee = w > 4 && d2 === 0;
      const seuil = w > 4 && d2 === 3 ? 0.95 : OBJECTIF_DECROCHE;
      if (nouvelle) {
        // La prime refondue : moitié décroché à 85 %, moitié commandes au premier appel à 68 %.
        const premier = [...semaines.slice(de, a).map((s) => s!.premierAppel), premierAppel];
        const pa = premier.reduce((s, x) => s + x, 0) / premier.length;
        prime = (PRIME_MOIS / 2) * ((moyen >= 0.85 ? 1 : 0) + (pa >= 0.68 ? 1 : 0));
      } else if (!supprimee) {
        prime = moyen >= seuil ? PRIME_MOIS : 0;
        if (!prime && w > 4) {
          // La prime qui saute : l'équipe le vit comme une sanction.
          primesSautees.push(w);
          engagement -= 0.08;
        }
      }
      if (prime > 0) primesVersees += prime / PRIME_MOIS;
    }

    // Ce que la semaine coûte.
    let depense = prime;
    if (d1 === 1 && w === 2) depense += COUTS.ecoute;
    if (d1 === 2 && w >= 2) depense += COUTS.reporting;
    if (d2 === 1 && w === 4) depense += COUTS.ateliers;
    if (d3 === 2 && w === 7) depense += COUTS.formation;
    if (d5 === 1 && w >= 10 && w <= 12) depense += 2 * COUTS.interim;
    if (d6 === 2 && w >= 12) depense += COUTS.reporting;
    if (yasmine && w === 10) depense += COUT_RECRUTEMENT;
    // Les postes rendus au siège : une économie sur le budget des plateaux.
    if (w >= 9) depense -= (CONSEILLERS - (yasmine ? 1 : 0) - postes) * COUT_POSTE;
    cout += depense + rappels * COUT_RAPPEL + perdus * VALEUR_CLIENT_PERDU;

    // À bout, Yasmine démissionne : la décision se lit en fin de semaine 8.
    if (w === 8 && h.uYasmine < risqueDeDepart(engagement)) yasmine = true;

    marge += margeSemaine;
    couts += cout;
    ca += caSemaine;
    clientsPerdus += perdus;
    rappelsAvant = rappels;
    chargeAvant = charge;

    semaines.push({
      decroche,
      dmc,
      premierAppel,
      rappel: rappels / appels,
      appels,
      ca: caSemaine,
      marge,
      cout,
      contribution: margeSemaine - cout,
      cumul: marge - couts,
      pression,
      engagement,
      presents,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const moy = (f: (s: Semaine) => number) => pleines.reduce((s, x) => s + f(x), 0) / SEMAINES;
  return {
    semaines,
    objectif: marge - couts - BUDGET,
    marge,
    couts,
    ca,
    primesVersees,
    primesSautees,
    siegeConsulte: d4 === 1,
    siegeAccepte: accepte,
    yasminePart: yasmine,
    clientsPerdus,
    decrocheMoyen: moy((s) => s.decroche),
    premierAppelMoyen: moy((s) => s.premierAppel),
    rappelMoyen: moy((s) => s.rappel),
    caMoyen: moy((s) => s.ca),
  };
}

/** Ce qui s'est passé pendant des semaines : départ, prime, siège, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    yasminePart: t.yasminePart && dans(9),
    /** La fin de mois où la prime a sauté, si elle tombe dans ces semaines. */
    primeSautee: t.primesSautees.find(dans) ?? null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureIndicateur {
  decroche: number | null;
  dmc: number | null;
  premierAppel: number | null;
  rappel: number | null;
  cumul: number | null;
  ca: number | null;
  budgetADate: number | null;
}

/** Ce que Sonia lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureIndicateur {
  if (semaine === 0) {
    return {
      decroche: 0.94,
      dmc: 5.1,
      premierAppel: null,
      rappel: 0.22,
      cumul: 0,
      ca: 205000,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    decroche: s.decroche,
    dmc: s.dmc,
    premierAppel: mesure(chemin, semaine) ? s.premierAppel : null,
    rappel: s.rappel,
    cumul: s.cumul,
    ca: s.ca,
    budgetADate: (BUDGET * semaine) / SEMAINES,
  };
}
