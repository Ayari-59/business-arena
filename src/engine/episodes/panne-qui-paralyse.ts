/**
 * LA PANNE QUI PARALYSE — le modèle de la région lyonnaise pendant la crise.
 *
 * Six agences, un système de gestion chiffré par une cyberattaque un lundi
 * matin : plus de commandes, plus de stocks à l'écran, plus de factures.
 * Treize semaines, six décisions. Trois mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LE MODE DÉGRADÉ ORGANISÉ TIENT L'ACTIVITÉ. Sans système, une agence sert
 *     ce qu'elle sait servir : avec une cellule de crise aux rôles clairs, des
 *     bons papier numérotés, un tableau partagé des stocks et une liste de
 *     clients prioritaires, elle en sert près des trois quarts ; quand tous
 *     les chefs d'agence décident de tout ensemble, à peine plus de la moitié ;
 *     livrée à elle-même, un tiers. Faire « comme avant, sur papier » tient un
 *     temps, puis la fatigue le reprend, et les bons perdus ne seront jamais
 *     facturés. La ressaisie de ces bons, une fois le système revenu, use à
 *     son tour les équipes si personne ne les relaie.
 *   · REDÉMARRER SANS NETTOYER, C'EST PARIER. Relancer tout depuis les
 *     sauvegardes, ou payer la rançon, rend le système en quelques jours…
 *     moins d'une fois sur deux. Les autres fois, la clé ne déchiffre rien, ou
 *     l'intrus encore présent chiffre tout une seconde fois et la crise
 *     recommence, plus longue. Le redémarrage par étapes, après nettoyage, est
 *     plus lent sur le papier et plus rapide en espérance ; tout nettoyer
 *     avant de tout redémarrer est un peu plus lent encore, et le plus sûr.
 *   · LE SILENCE COÛTE PLUS QUE LA MAUVAISE NOUVELLE. La confiance des
 *     clients s'use chaque semaine de panne ; elle s'use deux à trois fois
 *     plus vite quand on ne leur dit rien, et une promesse non tenue la fait
 *     tomber d'un coup. Les clients qui partent ne reviennent pas dans le
 *     trimestre.
 *
 * Le trimestre est jugé en euros : l'écart à la marge d'un trimestre normal,
 * coûts de la crise compris (prestataires, heures, rançon, remises, ventes
 * jamais facturées). Il est toujours négatif ; la question est de combien.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const AGENCES = 6;
/** La marge brute d'une semaine normale, pour les six agences. */
export const MARGE_HEBDO = 70000;
/** Le chiffre d'affaires d'une semaine normale. */
export const CA_HEBDO = 255000;
/** L'impact que la direction générale accepte pour le trimestre. */
export const PLAFOND = 300000;
export const CONFIANCE_DEPART = 72;
export const FATIGUE_DEPART = 0.2;
/** La part d'activité que la direction demande de maintenir pendant la panne. */
export const CIBLE_ACTIVITE = 0.65;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les agences attendent des consignes : de la marge perdue. */
export const PERTE_PAR_JOUR = 5000;
/** La part de Ferrand Habitat dans l'activité de la région. */
export const PART_FERRAND = 0.11;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  organisation: 0,
  communication: 1,
  redemarrage: 2,
  ferrand: 3,
  equipes: 4,
  sortie: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 3, 3, 2, 2] as const;

export const COUTS = {
  /** La mise en place de la cellule de crise et du mode dégradé : téléphones, tableaux, coursiers. */
  installation: 3000,
  /** Le mode dégradé organisé, par semaine de panne pleine. */
  modeDegrade: 2500,
  /** Les heures supplémentaires d'un mode dégradé « comme avant », par semaine de panne pleine. */
  heuresDegrade: 4000,
  /** La réunion quotidienne de tous les chefs d'agence : des déplacements et des heures. */
  reunions: 1500,
  /** Le standard renforcé et les messages réguliers aux clients, par semaine de panne. */
  communication: 1500,
  /** Les appels aux seuls grands comptes. */
  grandsComptes: 500,
  /** Le prestataire de réponse à incident, pour un redémarrage nettoyé. */
  nettoyage: 38000,
  /** Le surcoût du redémarrage par étapes : chaque brique est contrôlée à part. */
  etapes: 4000,
  /** Relancer depuis les sauvegardes, sans nettoyage. */
  relance: 8000,
  rancon: 90000,
  /** Le prestataire appelé en urgence après une réinfection. */
  urgence: 70000,
  /** L'incident sur une brique redémarrée avant les autres : on l'isole et on la reprend. */
  incidentEtape: 40000,
  /** La remise de 8 % consentie à Ferrand Habitat, par semaine. */
  remiseFerrand: 2250,
  rotation: 2500,
  heuresSup: 3500,
  saisiePrioritaire: 2500,
  samedi: 3000,
  /** L'intérim de direction quand un chef d'agence s'arrête, par semaine. */
  interimChef: 2000,
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
  effet: { demande?: number; terrain?: number; confiance?: number; fatigue?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "intemperies",
    titre: "Une semaine de pluie",
    de: "Karim Belkacem",
    role: "Chef d'agence, Villeurbanne",
    texte:
      "Une semaine de pluie sans interruption : la moitié des chantiers de nos artisans sont à l'arrêt, les comptoirs sont vides.",
    duree: 1,
    effet: { demande: 0.85 },
  },
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "La grippe touche les agences : une dizaine de personnes absentes pendant deux semaines, en plein mode dégradé.",
    duree: 2,
    effet: { terrain: 0.9, fatigue: 0.03 },
  },
  {
    id: "presse",
    titre: "La presse locale s'empare de l'affaire",
    de: "Service communication",
    role: "Siège",
    texte:
      "Le quotidien régional titre sur « le négociant paralysé par des pirates ». Des clients appellent pour savoir si leurs données ont fuité.",
    duree: 1,
    effet: { confiance: -6 },
  },
  {
    id: "fournisseur",
    titre: "Retard d'un fournisseur de plaques de plâtre",
    de: "Achats",
    role: "Siège",
    texte:
      "Le fournisseur de plaques de plâtre livre avec une semaine de retard : la référence la plus demandée manque dans quatre agences.",
    duree: 1,
    effet: { terrain: 0.9 },
  },
  {
    id: "concurrent",
    titre: "Un concurrent en rupture",
    de: "Amandine Roux",
    role: "Cheffe d'agence, Vénissieux",
    texte:
      "Le négoce d'en face est en rupture sur l'isolation : ses clients viennent chez nous, même sur bons papier.",
    duree: 1,
    effet: { demande: 1.1 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Le marché de la semaine : chantiers, météo, saison. */
  demande: number;
  /** Ce que les agences arrivent à servir sans système, d'une semaine à l'autre. */
  terrain: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La durée du nettoyage, en semaines, à partir de la semaine 3. */
  nettoyage: number;
  /** Le système redémarré se fait-il chiffrer une seconde fois ? Comparé au risque de chaque méthode. */
  uReinfection: number;
  /** Combien de temps après le redémarrage la réinfection frappe, en semaines. */
  delaiReinfection: number;
  /** La clé fournie contre la rançon fonctionne-t-elle ? */
  uCle: number;
  /** Ferrand Habitat reste-t-il ? */
  uFerrand: number;
  /** Un chef d'agence s'arrête-t-il, à bout ? */
  uArret: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 3010349 + 19);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: Math.min(1.12, Math.max(0.88, 1 + 0.05 * gauss(r))),
      terrain: Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r))),
    });
  }
  const nettoyage = Math.min(4.5, Math.max(1.5, 2.7 + 0.8 * gauss(r)));
  const uReinfection = r();
  const delaiReinfection = 0.8 + 1.2 * r();
  const uCle = r();
  const uFerrand = r();
  const uArret = r();
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
    nettoyage,
    uReinfection,
    delaiReinfection,
    uCle,
    uFerrand,
    uArret,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LE REDÉMARRAGE.
 *
 * Le temps court en semaines : la semaine w va de w − 1 à w. La décision se
 * prend à la fin de la semaine 2 ; chaque méthode pose des paliers (la part
 * de l'activité que le système porte de nouveau), et une réinfection remet
 * tout à zéro avant un redémarrage forcé, nettoyé cette fois, et plus long.
 * ------------------------------------------------------------------------- */

/** Le risque qu'une méthode de redémarrage laisse l'intrus revenir. */
export const RISQUE_REINFECTION = [0.6, 0.45, 0.1, 0.03] as const;
/** Une fois sur deux, à peu près, la clé fournie contre la rançon déchiffre les données. */
export const CHANCE_CLE = 0.55;

export interface Redemarrage {
  paliers: readonly (readonly [number, number])[];
  reinfection: boolean;
  /** Le moment de la réinfection, en semaines depuis le début du trimestre. */
  momentReinfection: number | null;
  /** La clé de la rançon a-t-elle fonctionné ? `null` : rançon non payée. */
  cle: boolean | null;
  /** Les dépenses du redémarrage, semaine par semaine. */
  depenses: readonly number[];
}

export function redemarrage(choix: number, graine: number): Redemarrage {
  const h = hasard(graine);
  const n = h.nettoyage;
  const depenses = Array.from({ length: SEMAINES + 1 }, () => 0);
  const paliers: [number, number][] = [[0, 0]];
  let reinfection = false;
  let momentReinfection: number | null = null;
  let cle: boolean | null = null;
  const touche = h.uReinfection < RISQUE_REINFECTION[choix]!;

  /** Après une réinfection : un redémarrage forcé, nettoyé, et plus long que le premier. */
  const reprise = (moment: number, suite: [number, number][], cout: number) => {
    reinfection = true;
    momentReinfection = moment;
    // Ce qui devait revenir après la réinfection ne reviendra pas.
    for (let k = paliers.length - 1; k >= 0; k -= 1)
      if (paliers[k]![0] >= moment) paliers.splice(k, 1);
    paliers.push([moment, 0], ...suite);
    depenses[Math.min(SEMAINES, Math.ceil(moment))]! += cout;
  };
  /** Une réinfection d'un système mal nettoyé : tout est à refaire, sauvegardes comprises. */
  const toutARefaire = (moment: number) => reprise(moment, [[moment + n + 2.5, 1]], COUTS.urgence);

  if (choix === 0) {
    // Tout relancer depuis les sauvegardes, sans nettoyer.
    depenses[3]! += COUTS.relance;
    paliers.push([2.4, 0.8], [3.5, 0.9], [4.5, 1]);
    if (touche) toutARefaire(2.4 + h.delaiReinfection);
  } else if (choix === 1) {
    // Payer la rançon.
    depenses[3]! += COUTS.rancon;
    cle = h.uCle < CHANCE_CLE;
    if (cle) {
      paliers.push([3, 0.7], [3.6, 0.9], [4.5, 1]);
      if (touche) toutARefaire(3.6 + h.delaiReinfection);
    } else {
      // La clé ne déchiffre rien : une semaine perdue, puis le nettoyage complet.
      depenses[4]! += COUTS.nettoyage;
      paliers.push([3 + n + 1, 1]);
    }
  } else if (choix === 2) {
    // Nettoyer, puis redémarrer par étapes : commandes et facturation d'abord.
    depenses[3]! += COUTS.nettoyage + COUTS.etapes;
    // La première brique tourne pendant que le reste est encore nettoyé : un poste
    // oublié peut la contaminer. C'est le prix de la vitesse, et il est rare.
    const etape1 = 2 + n * 0.75;
    paliers.push([etape1, 0.6], [2 + n + 0.5, 1]);
    if (touche) {
      // Le reste est déjà nettoyé : on isole, on reprend la brique, on repart.
      const m = etape1 + 0.6;
      reprise(
        m,
        [
          [m + 2, 0.6],
          [Math.max(2 + n + 0.5, m + 3), 1],
        ],
        COUTS.incidentEtape,
      );
    }
  } else {
    // Tout nettoyer, puis tout redémarrer d'un bloc.
    depenses[3]! += COUTS.nettoyage;
    paliers.push([2 + n + 1, 1]);
    if (touche) toutARefaire(2 + n + 1 + h.delaiReinfection);
  }
  paliers.sort((a, b) => a[0] - b[0]);
  return { paliers, reinfection, momentReinfection, cle, depenses };
}

/** La part de la semaine w (de w − 1 à w) pendant laquelle le système porte l'activité. */
export function niveau(paliers: readonly (readonly [number, number])[], w: number): number {
  let total = 0;
  for (let k = 0; k < paliers.length; k += 1) {
    const [debut, valeur] = paliers[k]!;
    const fin = k + 1 < paliers.length ? paliers[k + 1]![0] : Infinity;
    const recouvre = Math.max(0, Math.min(w, fin) - Math.max(w - 1, debut));
    total += recouvre * valeur;
  }
  return total;
}

/** La semaine où le système est rétabli pour de bon. */
export function semaineRetablie(paliers: readonly (readonly [number, number])[]): number {
  let derniere = 0;
  for (const [t, v] of paliers) if (v < 1) derniere = t;
  const plein = paliers.find(([t, v]) => v >= 1 && t >= derniere);
  return plein ? Math.ceil(plein[0]) : 99;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/**
 * FERRAND HABITAT RESTE-T-IL ?
 *
 * Un plan de livraison chantier par chantier le convainc quand on peut le
 * tenir : avec le tableau partagé des stocks et la liste des clients
 * prioritaires du mode dégradé organisé, neuf fois sur dix ; sans, une
 * fois sur trois. La remise contre un engagement écrit le garde à coup sûr,
 * et coûte.
 */
export function chanceQueFerrandReste(chemin: readonly number[], retabli: number): number {
  const c = chemin[D.ferrand];
  if (c === 0) return chemin[D.organisation] === 0 ? 0.9 : 0.35;
  if (c === 1) return 1;
  if (c === 2) return retabli <= 6 ? 0.6 : 0.15;
  return 0.3;
}

/** Le risque qu'un chef d'agence s'arrête, lu sur la fatigue des équipes en fin de semaine 8. */
export const risqueDArret = (fatigue: number) => Math.min(0.8, Math.max(0, (fatigue - 0.45) * 2.2));

/** Ce que les agences servent sans système, selon l'organisation de la semaine 1. */
const TERRAIN = [0.72, 0.7, 0.55, 0.32] as const;
/** La première semaine, le temps de s'organiser. */
const DEMARRAGE = [0.8, 0.95, 0.85, 1] as const;
/** Ce qu'une semaine de panne pleine ajoute à la fatigue. */
const USURE = [0.045, 0.085, 0.065, 0.03] as const;
/** La part des ventes sur papier qui ne sera jamais facturée, faute de trace. */
const FUITE = [0.05, 0.1, 0.1, 0.07] as const;
/** Ce que la sortie de crise récupère de ces ventes : la part qui reste perdue. */
const RATTRAPAGE = [0.25, 0.5, 1] as const;
/** Les bons encore à ressaisir en fin de trimestre : trop vieux, une partie sera contestée. */
const CONTESTES = 0.25;
/** Ce qu'une semaine de système plein permet de ressaisir, en semaines de ventes. */
const RYTHME_SAISIE = 0.55;
/** La fatigue qu'ajoute une semaine de ventes ressaisie par les équipes, en plus du travail courant. */
const USURE_SAISIE = 0.2;

export type Semaine = {
  /** La part de l'activité normale réalisée. */
  activite: number;
  /** La part de l'activité que le système porte de nouveau. */
  systemes: number;
  /** L'indice de confiance des clients, sur 100. */
  confiance: number;
  /** La fatigue des équipes, de 0 à 1. */
  fatigue: number;
  /** Le coût cumulé de la crise : marge perdue et dépenses, depuis le début du trimestre. */
  cout: number;
  /** Ce que la semaine a coûté. */
  coutSemaine: number;
  /** Les ventes passées sur bons papier depuis le début de la panne. */
  arriere: number;
  /** Les bons papier qui restent à ressaisir dans le système. */
  aSaisir: number;
  /** La part des clients partis chez un concurrent. */
  perdus: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart à la marge d'un trimestre normal, coûts de la crise compris : plus haut, mieux c'est. */
  objectif: number;
  margePerdue: number;
  depenses: number;
  /** Les ventes sur papier jamais facturées. */
  nonFacture: number;
  /** Les bons papier pas encore ressaisis en fin de trimestre. */
  resteASaisir: number;
  reinfection: boolean;
  momentReinfection: number | null;
  cle: boolean | null;
  retabli: number;
  /** Ferrand Habitat a-t-il gardé ses commandes chez nous ? */
  ferrandReste: boolean;
  promesseRompue: boolean;
  arretChef: boolean;
  activiteMoyenne: number;
  /** L'activité moyenne pendant la panne, semaines 1 à 4. */
  activitePanne: number;
  confianceFinale: number;
  clientsPerdus: number;
  fatigueMax: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const rd = redemarrage(d3!, graine);
  const retabli = semaineRetablie(rd.paliers);
  const ferrandReste = h.uFerrand < chanceQueFerrandReste(chemin, retabli);
  const semaines: (Semaine | null)[] = [null];

  let confiance = CONFIANCE_DEPART;
  let fatigue = FATIGUE_DEPART;
  let perdus = 0;
  let arriere = 0;
  let aSaisir = 0;
  let depenses = 0;
  let margePerdue = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let cout = margePerdue;
  let promesseRompue = false;
  let arretChef = false;
  let nonFacture = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const s = niveau(rd.paliers, w);
    const panne = 1 - s;
    let coutSemaine = w === 1 ? margePerdue : 0;

    // Ce que les agences servent sans système : l'organisation, l'usure, le terrain.
    let terrain = TERRAIN[d1!]! * (w === 1 ? DEMARRAGE[d1!]! : 1) * n.terrain;
    terrain *= 1 - 0.6 * Math.max(0, fatigue - 0.45);
    const renforts = d5 === 0 && w >= 7 && w <= 9;
    const samedisFermes = d5 === 3 && w >= 7 && w <= 9;
    if (renforts) terrain *= 1.04;
    if (d5 === 1 && w >= 7 && w <= 9) terrain *= 1.08;
    if (samedisFermes) terrain *= 0.95;
    for (const a of actifs) terrain *= a.imprevu.effet.terrain ?? 1;
    terrain = Math.min(0.92, terrain);
    // Système revenu, des équipes à bout servent moins bien : erreurs, lenteurs, absences.
    const usure = 1 - 0.4 * Math.max(0, fatigue - 0.5);
    let servi = s * usure * (samedisFermes ? 0.97 : 1) + panne * terrain;
    if (arretChef && w >= 9 && w <= 12) servi *= 0.94;

    // Ce que les clients demandent encore : ceux qui sont partis ne reviennent pas.
    let marche = n.demande;
    for (const a of actifs) marche *= a.imprevu.effet.demande ?? 1;
    const ferrand = !ferrandReste && w >= 6 ? 1 - PART_FERRAND : 1;
    const demande = (1 - perdus) * ferrand;
    const activite = demande * servi * marche;
    const marge = MARGE_HEBDO * activite;
    const manque = MARGE_HEBDO * marche - marge;
    const papier = CA_HEBDO * marche * demande * panne * terrain;
    arriere += papier;
    // La ressaisie : chaque bon papier doit entrer dans le système revenu, en plus du travail courant.
    let rythme = RYTHME_SAISIE;
    if ((renforts || d5 === 1) && w >= 7 && w <= 9) rythme *= 1.5;
    if (d6 === 0 && w >= 10 && w <= 12) rythme *= 1.6;
    if (d6 === 1 && (w === 10 || w === 11)) rythme *= 1.8;
    const saisie = Math.min(aSaisir, s * CA_HEBDO * rythme);
    aSaisir += papier - saisie;
    let usureSaisie = (USURE_SAISIE * saisie) / CA_HEBDO;
    if (renforts || (d6 === 0 && w >= 10 && w <= 12)) usureSaisie *= 0.4;

    // La confiance : ce qu'on dit aux clients, et ce qu'ils vivent.
    let dc = w === 1 ? -4 : 0;
    if (!ferrandReste && w === 6) dc -= 5; // Le départ d'un grand compte se sait.
    if (w >= 2) {
      if (d2 === 0) dc += -1.5 * panne + 1.5 * s;
      if (d2 === 1) dc += w === 2 ? 3 : -4 * panne + 0.5 * s;
      if (d2 === 2) dc += -5 * panne + 0.5 * s;
      if (d2 === 3) dc += -3.4 * panne + 1 * s;
    }
    // La promesse d'un retour sous huit jours : jugée en semaine 4.
    if (d2 === 1 && w === 4 && niveau(rd.paliers, 3) < 0.85) {
      promesseRompue = true;
      dc -= 18;
    }
    dc -= 4 * Math.max(0, 1 - servi);
    if (rd.momentReinfection !== null && Math.ceil(rd.momentReinfection) === w) {
      dc -= d2 === 0 ? 7 : 12;
    }
    for (const a of actifs) {
      if (a.semaine === w && a.imprevu.effet.confiance) {
        dc += a.imprevu.effet.confiance * (d2 === 2 ? 1.8 : 1);
      }
    }
    // Une confiance déjà basse a moins à perdre : ceux qui restent sont les plus fidèles.
    if (dc < 0) dc *= Math.min(1, confiance / CONFIANCE_DEPART);
    if (d6 === 0 && w === 10) dc += 4;
    confiance = borne(confiance + dc, 0, 100);
    // Les clients qui partent : ceux qui doutent, et ceux qu'on n'a pas servis.
    perdus += (0.006 * Math.max(0, 70 - confiance)) / 10 + 0.025 * Math.max(0, 1 - servi);
    if (confiance > 70) perdus -= 0.004;
    perdus = borne(perdus, 0, 0.35);

    // La fatigue : chaque semaine de panne use, le retour du système soulage.
    let df = USURE[d1!]! * panne - 0.04 * s + usureSaisie;
    if (w >= 7 && w <= 9) {
      if (d5 === 0) df -= 0.03;
      if (d5 === 1) df += 0.03;
      if (d5 === 3) df -= 0.025;
    }
    if (w >= 10 && w <= 11) {
      if (d6 === 0) df -= 0.02;
      if (d6 === 1) df += 0.06;
      if (d6 === 2) df += 0.01;
    }
    for (const a of actifs) df += a.imprevu.effet.fatigue ?? 0;
    // Au-delà de 0,6, l'usure ralentit : ceux qui restent tiennent, ou s'arrêtent.
    if (df > 0 && fatigue > 0.6) df *= (1 - fatigue) / 0.4;
    fatigue = borne(fatigue + df, 0, 1);
    // À bout, un chef d'agence s'arrête : la décision se lit en fin de semaine 8.
    if (w === 8 && h.uArret < risqueDArret(fatigue)) arretChef = true;

    // Ce que la semaine coûte.
    let depense = rd.depenses[w]!;
    if (d1 === 0) depense += (w === 1 ? COUTS.installation : 0) + COUTS.modeDegrade * panne;
    if (d1 === 1) depense += COUTS.heuresDegrade * panne;
    if (d1 === 2) depense += COUTS.reunions * panne;
    if (w >= 2 && panne > 0) {
      if (d2 === 0) depense += COUTS.communication;
      if (d2 === 3) depense += COUTS.grandsComptes;
    }
    if (d4 === 1 && w >= 5) depense += COUTS.remiseFerrand;
    if (w >= 7 && w <= 9) {
      if (d5 === 0) depense += COUTS.rotation;
      if (d5 === 1) depense += COUTS.heuresSup;
    }
    if (d6 === 0 && w >= 10 && w <= 12) depense += COUTS.saisiePrioritaire;
    if (d6 === 1 && (w === 10 || w === 11)) depense += COUTS.samedi;
    if (arretChef && w >= 9 && w <= 12) depense += COUTS.interimChef;
    // Les bons papier qu'on ne retrouvera pas : comptés en fin de trimestre.
    if (w === SEMAINES) {
      nonFacture = arriere * FUITE[d1!]! * RATTRAPAGE[d6!]! + aSaisir * CONTESTES;
      depense += nonFacture;
    }
    depenses += depense;
    margePerdue += manque;
    coutSemaine += manque + depense;
    cout += manque + depense;

    semaines.push({
      activite,
      systemes: s,
      confiance,
      fatigue,
      cout,
      coutSemaine,
      arriere,
      aSaisir,
      perdus,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: -cout,
    margePerdue,
    depenses: depenses - nonFacture,
    nonFacture,
    resteASaisir: aSaisir,
    reinfection: rd.reinfection,
    momentReinfection: rd.momentReinfection,
    cle: rd.cle,
    retabli,
    ferrandReste,
    promesseRompue,
    arretChef,
    activiteMoyenne: pleines.reduce((x, s) => x + s.activite, 0) / SEMAINES,
    activitePanne: pleines.slice(0, 4).reduce((x, s) => x + s.activite, 0) / 4,
    confianceFinale: confiance,
    clientsPerdus: perdus,
    fatigueMax: Math.max(...pleines.map((s) => s.fatigue)),
  };
}

/** Ce qui s'est passé pendant des semaines : réinfection, Ferrand, arrêt, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const semaineReinfection = t.momentReinfection === null ? 0 : Math.ceil(t.momentReinfection);
  return {
    reinfection: t.reinfection && dans(semaineReinfection),
    semaineReinfection,
    retabli: t.retabli <= SEMAINES && dans(t.retabli),
    promesseRompue: t.promesseRompue && dans(4),
    ferrandPart: !t.ferrandReste && dans(5),
    ferrandReste: t.ferrandReste && dans(5),
    arretChef: t.arretChef && dans(9),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePanne {
  activite: number | null;
  systemes: number | null;
  confiance: number | null;
  fatigue: number | null;
  cout: number | null;
  /** Les bons papier qui restent à ressaisir. */
  arriere: number | null;
  plafondADate: number | null;
}

/** La part du plafond que la crise peut avoir consommée à une semaine donnée : l'essentiel pendant la panne. */
export const plafondADate = (semaine: number) => PLAFOND * Math.min(1, semaine / 8);

/** Ce que la directrice lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePanne {
  if (semaine === 0) {
    return {
      activite: 1,
      systemes: 0,
      confiance: CONFIANCE_DEPART,
      fatigue: FATIGUE_DEPART,
      cout: 0,
      arriere: 0,
      plafondADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    activite: s.activite,
    systemes: s.systemes,
    confiance: s.confiance,
    fatigue: s.fatigue,
    cout: s.cout,
    arriere: s.aSaisir,
    plafondADate: plafondADate(semaine),
  };
}
