/**
 * L'ÉQUIPE DE JOUR ET L'ÉQUIPE DE NUIT — le modèle de l'EHPAD de Dijon-Grésilles.
 *
 * Soixante-douze résidents, deux équipes qui ne se croisent qu'un quart d'heure
 * à 6 h 45 et à 21 h, un trimestre de janvier à mars, six décisions. La nuit
 * accuse le jour de lui faire lever des résidents à 5 h 30 ; le jour accuse la
 * nuit de laisser des toilettes non faites ; les transmissions durent trois
 * minutes et deux veilleuses ont demandé leur mutation. Quatre mécanismes
 * font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA CAUSE EST À LA FRONTIÈRE DES POSTES. Cinq aides-soignants du matin
 *     tiennent quarante toilettes entre 6 h 45 et 11 h, petits-déjeuners
 *     compris ; soixante résidents ont besoin d'aide. Pour tenir, l'équipe de
 *     jour a reporté sur la nuit, par une liste jamais décidée, les toilettes
 *     de treize résidents qui n'ont rien demandé, en plus des cinq lève-tôt de
 *     leur projet personnalisé. Arrêter ces levers sans rien réorganiser
 *     renvoie la charge au matin : des toilettes reportées, des heures en plus,
 *     des familles qui se plaignent. Ce qui règle le conflit, c'est une
 *     répartition des soins sur la journée (douches l'après-midi, préparation
 *     le soir, lever à l'heure de chacun) décidée avec les deux équipes.
 *   · LES TEMPS COMMUNS COÛTENT TOUT DE SUITE ET PAIENT PLUS TARD. Une réunion
 *     jour-nuit, un chevauchement protégé pour des transmissions ciblées, la
 *     révision des plans de soins : des heures payées d'abord, un effet qui
 *     vient deux ou trois semaines après. Les transmissions de trois minutes
 *     perdent des informations (une chute à 3 h, une fièvre, un refus de
 *     boire) : chaque oubli est un événement indésirable, et un grief de plus
 *     d'une équipe contre l'autre. Tant que la nuit finit ses levers à 6 h 40,
 *     le quart d'heure de chevauchement est mangé par les toilettes.
 *   · TRANCHER FAIT PARTIR. Donner raison au jour fait monter la tension de
 *     la nuit, et les veilleuses partent : le recrutement de nuit est lent,
 *     l'intérim de nuit coûte deux fois une heure salariée, et Soralis ne
 *     tient que trois demandes sur quatre : le reste se fait en rappels sur
 *     repos, qui usent celles qui restent. Imposer une rotation
 *     jour-nuit à tous fait partir des deux côtés, au hasard des situations
 *     familiales. Le départ des deux veilleuses, puis d'une troisième, et
 *     celui d'une aide-soignante de jour sont tirés au hasard ; leurs chances
 *     dépendent de la tension que les décisions ont laissée.
 *   · LES LEVERS PRÉCOCES FONT TOMBER. Un résident levé à 5 h 30 attend deux
 *     heures au fauteuil avant le petit-déjeuner, somnolent : les chutes du
 *     petit matin et les réclamations des familles suivent le nombre de
 *     levers non demandés. La dignité des résidents n'y est pas une variable
 *     d'ajustement : la dégrader coûte.
 *
 * Le trimestre est jugé en euros : l'écart à l'enveloppe du trimestre pour
 * les heures, les remplacements de nuit, les départs et les événements
 * indésirables. Positif, le service a coûté moins que l'enveloppe.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const PLACES = 72;
/** Les résidents qui ont besoin d'aide pour la toilette du matin. */
export const AIDES_MATIN = 60;
/** Les résidents que leur projet personnalisé dit lève-tôt : les lever avant 6 h 45 est un soin. */
export const LEVE_TOT = 5;
/** Les résidents levés et lavés par la nuit avant 6 h 45, en décembre. */
export const LEVERS_DEPART = 18;
/** Les aides-soignants du matin, et les toilettes que chacun tient entre 6 h 45 et 11 h. */
export const AS_MATIN = 5;
export const TOILETTES_PAR_AS = 8;
export const CAPACITE_MATIN = AS_MATIN * TOILETTES_PAR_AS;
/** Ce que la révision des plans de soins sort du matin : douches l'après-midi, préparation le soir. */
export const DEPLACEES = 14;
/** Les levers que la nuit garde quand la nouvelle répartition tient : les lève-tôt, et un résident de plus. */
export const LEVERS_REVISION = 6;

/** Trois veilleuses chaque nuit : deux aides-soignantes et une agente de service. */
export const POSTES_DE_NUIT = 3;
export const VEILLEUSES = 8;
export const HEURES_NUIT = 10;
/** Une veilleuse à temps plein fait sept nuits de dix heures par quinzaine. */
export const NUITS_PAR_SEMAINE = 3.5;
/** L'heure d'aide-soignante de nuit chez Soralis Intérim Santé, hors taxes ; la TVA ne se récupère pas. */
export const INTERIM_HT = 48.5;
export const TVA = 0.2;
export const INTERIM_HEURE = INTERIM_HT * (1 + TVA);
/** L'heure de veilleuse salariée, chargée, majoration de nuit comprise. */
export const SALAIRE_HEURE = 29;
/** Une heure de rappel sur repos : majorée de 25 %, plus 20 € de prime de rappel pour une nuit. */
export const RAPPEL_HEURE = SALAIRE_HEURE * 1.25 + 2;
/** Soralis honore trois demandes de nuit sur quatre ; le reste se fait en rappels sur repos. */
export const PART_INTERIM = 0.75;
/** Une heure d'aide-soignant de jour, chargée ; majorée de 25 % en heure supplémentaire. */
export const HEURE_JOUR = 28;

/** Le chiffre que la prévision demande : une veilleuse à temps plein en intérim, un trimestre, en k€. */
export const POSTE_INTERIM_TRIMESTRE =
  (NUITS_PAR_SEMAINE * SEMAINES * HEURES_NUIT * INTERIM_HEURE) / 1000;

/** Ce que coûtent les événements indésirables à l'établissement, en moyenne. */
export const COUT_CHUTE = 700;
export const COUT_RECLAMATION = 450;
export const COUT_OUBLI = 400;
/** Une réclamation portée à l'ARS : réponse écrite, enquête interne, plan d'actions demandé. */
export const COUT_SAISINE = 5000;
/** Les taux de l'automne, par semaine : chutes hors levers précoces, réclamations, oublis. */
export const CHUTES_BASE = 1;
/** Les chutes qu'une transmission perdue laisse arriver : un résident agité, une chute à 3 h non signalée. */
export const CHUTES_PAR_OUBLI_DE_QUALITE = 0.6;
export const CHUTES_PAR_LEVER = 0.07;
export const RECLAMATIONS_BASE = 0.15;
export const RECLAMATIONS_PAR_LEVER = 0.035;
export const RECLAMATIONS_PAR_REPORT = 0.05;
export const OUBLIS_MAX = 2.5;

/** Un départ de nuit : annonce, entretiens, cinq nuits de doublure pour la recrue, temps du cadre. */
export const COUT_DEPART_NUIT = 3500;
export const COUT_DEPART_JOUR = 2500;
/** Une réunion jour-nuit de deux heures, les deux équipes payées : vingt personnes. */
export const COUT_REUNION = 1600;
/** La réunion mensuelle d'une heure inscrite au roulement : les binômes et une dizaine de présents. */
export const COUT_REUNION_MENSUELLE = 500;
/** Le chevauchement protégé : environ dix heures de veilleuses de plus par semaine. */
export const COUT_CHEVAUCHEMENT = 290;
/** La demi-journée de formation aux transmissions ciblées, pour les deux équipes. */
export const COUT_FORMATION = 1200;
/** Deux veilleuses et deux aides-soignants de jour, trois heures par semaine. */
export const COUT_REFERENTES = 360;
/** La révision des soixante-douze plans de soins : l'IDEC, le médecin coordonnateur, le groupe. */
export const COUT_REVISION = 1300;
/** Une aide-soignante en CDD de 7 h à 12 h, six matins sur sept. */
export const COUT_RENFORT = 30 * HEURE_JOUR;
export const RENFORT_TOILETTES = 8;
/** Les petits-déjeuners servis par les agents de service : le temps que les aides-soignants du matin y gagnent. */
export const GAIN_PETITS_DEJEUNERS = 4;

/** L'enveloppe du trimestre : heures, remplacements de nuit, départs, événements indésirables. */
export const ENVELOPPE = 65000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : une semaine de plus de levers à 5 h 30. */
export const PERTE_PAR_JOUR = 700;

export const TENSION_NUIT = 0.65;
export const TENSION_JOUR = 0.5;
export const QUALITE_DEPART = 0.2;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  conflit: 0,
  transmissions: 1,
  mutations: 2,
  repartition: 3,
  chute: 4,
  printemps: 5,
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
    /** Une part de nuits en absence en plus. */
    absNuit?: number;
    absJour?: number;
    chutes?: number;
    oublis?: number;
    /** Des toilettes du matin en plus, par jour. */
    besoin?: number;
    /** Soralis ne peut rien fournir : tout se fait en rappels. */
    sansInterim?: boolean;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Saliou Ndao",
    role: "Médecin coordonnateur",
    texte:
      "La grippe est entrée dans l'établissement : onze résidents et six soignants touchés, mesures barrières renforcées pour deux semaines.",
    duree: 2,
    effet: { absNuit: 0.06, absJour: 0.05, chutes: 0.4, besoin: 2 },
  },
  {
    id: "gastro",
    titre: "Gastro-entérite au deuxième étage",
    de: "Saliha Mekhloufi",
    role: "Infirmière",
    texte:
      "Une gastro-entérite au deuxième étage : des changes toute la nuit, deux veilleuses touchées à leur tour.",
    duree: 1,
    effet: { absNuit: 0.08, oublis: 0.6, besoin: 3 },
  },
  {
    id: "carneo",
    titre: "Panne de Carnéo",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le serveur de Carnéo est tombé pour la semaine : transmissions sur papier, plans de soins imprimés en hâte.",
    duree: 1,
    effet: { oublis: 1 },
  },
  {
    id: "neige",
    titre: "Épisode de neige",
    de: "Soralis Intérim Santé",
    role: "Agence de Dijon",
    texte:
      "Routes bloquées sur l'agglomération : aucun intérimaire de nuit cette semaine, tout se fera en rappels sur repos.",
    duree: 1,
    effet: { sansInterim: true },
  },
  {
    id: "ascenseur",
    titre: "Panne de l'ascenseur",
    de: "Services techniques",
    role: "Siège",
    texte:
      "L'ascenseur du premier étage est en panne pour la semaine : petits-déjeuners en chambre, plateaux montés à pied.",
    duree: 1,
    effet: { besoin: 4 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  chutes: number;
  absences: number;
  reclamations: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Smaranda Vornicu et Nacéra Bouadjar partent-elles ? Lu en fin de semaine 5. */
  uSmaranda: number;
  uNacera: number;
  /** La nouvelle répartition tient-elle ? */
  uTient: number;
  /** Une troisième veilleuse, une aide-soignante de jour : lu en fin de semaine 9. */
  uNuit: number;
  uJour: number;
  /** La famille de Mme Sarkissian porte-t-elle sa réclamation à l'ARS ? */
  uFamille: number;
  /** Les départs que l'annonce d'une rotation déclenche, de chaque côté. */
  uRotationNuit: number;
  uRotationJour: number;
  /** Une recrue de nuit arrive-t-elle avant la fin du trimestre ? */
  uRecrue: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001003 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      chutes: Math.min(1.5, Math.max(0.6, 1 + 0.2 * gauss(r))),
      absences: Math.min(1.5, Math.max(0.6, 1 + 0.18 * gauss(r))),
      reclamations: Math.min(1.6, Math.max(0.5, 1 + 0.25 * gauss(r))),
    });
  }
  const uSmaranda = r();
  const uNacera = r();
  const uTient = r();
  const uNuit = r();
  const uJour = r();
  const uFamille = r();
  const uRotationNuit = r();
  const uRotationJour = r();
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
    uSmaranda,
    uNacera,
    uTient,
    uNuit,
    uJour,
    uFamille,
    uRotationNuit,
    uRotationJour,
    uRecrue,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/**
 * LES DEUX VEILLEUSES PARTENT-ELLES ?
 *
 * Elles décident en fin de semaine 5, quand elles ont vu ce que le cadre a fait
 * du conflit. Accepter leur mutation les fait partir à coup sûr ; les associer
 * à la répartition des tâches les retient, d'autant mieux que la nuit n'est
 * plus en guerre ; refuser la mutation les pousse à démissionner.
 */
export const AJUSTEMENT_MUTATION = [1, -0.05, 0.35, 0.3] as const;
export const risqueMutation = (choix: number, tensionNuit: number) =>
  choix === 0 ? 1 : borne(AJUSTEMENT_MUTATION[choix]! + 1.1 * (tensionNuit - 0.35), 0.03, 0.9);

/**
 * La troisième veilleuse, en fin de semaine 9 : la tension de la nuit, un avertissement qui
 * tombe sur l'une d'elles, ou une répartition à laquelle la nuit avait cru et qui n'a pas tenu.
 */
export const risqueNuit = (tensionNuit: number, avertissement: boolean, desillusion = false) =>
  borne(1.6 * (tensionNuit - 0.45) + (avertissement ? 0.3 : 0) + (desillusion ? 0.6 : 0), 0, 0.85);
/** Une aide-soignante de jour, en fin de semaine 9 : la tension du jour. */
export const risqueJour = (tensionJour: number) => borne(1.6 * (tensionJour - 0.45), 0, 0.7);

/**
 * LA NOUVELLE RÉPARTITION TIENT-ELLE ?
 *
 * Des plans de soins révisés par le cadre seul ne tiennent pas trois semaines :
 * l'équipe de l'après-midi ne fait pas des douches qu'elle n'a pas choisies,
 * la nuit reprend des levers. Révisés avec les deux équipes, après une vraie
 * réunion commune et avec les veilleuses dans le groupe, ils tiennent huit
 * fois sur dix.
 */
export function chanceQueLaRepartitionTienne(chemin: readonly number[], referentes: number) {
  let p = 0.4;
  if (chemin[D.conflit] === 2) p += 0.2;
  if (chemin[D.conflit] === 0) p -= 0.2;
  if (chemin[D.conflit] === 1) p -= 0.1;
  if (chemin[D.mutations] === 1) p += 0.05 * referentes;
  if (chemin[D.transmissions] === 0) p += 0.05;
  return borne(p, 0.05, 0.9);
}

/** Les chances que la famille porte sa réclamation à l'ARS, selon la réponse qu'on lui fait. */
export const CHANCE_SAISINE = [0, 0.35, 0.5, 0.45] as const;
export const familleSaisitLARS = (choix: number, graine: number) =>
  hasard(graine).uFamille < CHANCE_SAISINE[choix]!;

/** Une rotation imposée à tous : une veilleuse part trois fois sur cinq, une aide-soignante de jour une fois sur deux. */
export const ROTATION = { nuit: [0.6, 0.25], jour: [0.5, 0.2] } as const;
export const departsDeRotation = (graine: number) => {
  const h = hasard(graine);
  const n = ROTATION.nuit.filter((p) => h.uRotationNuit < p).length;
  const j = ROTATION.jour.filter((p) => h.uRotationJour < p).length;
  return { nuit: n, jour: j };
};

export type Semaine = {
  /** Résidents levés avant 6 h 45 par la nuit. */
  levers: number;
  /** Toilettes du matin reportées ou bâclées, par jour. */
  reportees: number;
  /** Durée des transmissions de 6 h 45, en minutes. */
  minutes: number;
  qualite: number;
  tensionNuit: number;
  tensionJour: number;
  chutes: number;
  reclamations: number;
  oublis: number;
  /** Nuits tenues en intérim ou en rappel sur repos dans la semaine. */
  remplacements: number;
  /** Veilleuses manquantes à l'effectif. */
  vacants: number;
  /** Ce que la semaine a coûté : heures, remplacements, départs, événements indésirables. */
  cout: number;
  coutCumule: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart à l'enveloppe : positif, le trimestre a coûté moins que prévu. */
  objectif: number;
  cout: number;
  heures: number;
  remplacementsNuit: number;
  departs: number;
  evenements: number;
  chutes: number;
  reclamations: number;
  oublis: number;
  leversFinaux: number;
  leversMoyens: number;
  smarandaPart: boolean;
  naceraPart: boolean;
  troisiemePart: boolean;
  jourPart: boolean;
  rotation: { nuit: number; jour: number };
  /** La répartition révisée : `null` si elle n'a pas été tentée. */
  repartitionTient: boolean | null;
  chanceRepartition: number;
  saisine: boolean;
  departsNuit: number;
  departsJour: number;
  /** Le chiffre que la prévision de la semaine 1 demande, en k€. */
  posteInterim: number;
}

/** Les levers précoces que l'organisation impose la semaine `w`, avant la répartition. */
function leversDuConflit(choix: number, w: number) {
  if (w < 2) return LEVERS_DEPART;
  if (choix === 1) return LEVE_TOT;
  // Après la réunion, les deux équipes arrêtent tout de suite les levers des quatre résidents qui tombent.
  if (choix === 2 && w >= 3) return LEVERS_DEPART - 4;
  return LEVERS_DEPART;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const choix = (d: number): number => chemin[d] ?? NEUTRE[d]!;
  const [d1, d2, d3, d4, d5, d6] = [0, 1, 2, 3, 4, 5].map(choix) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const semaines: (Semaine | null)[] = [null];
  let tn = TENSION_NUIT;
  let tj = TENSION_JOUR;
  let q = QUALITE_DEPART;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let coutCumule = 0;
  let heures = 0;
  let remplacementsNuit = 0;
  let departs = 0;
  let evenements = perte;
  let chutesT = 0;
  let reclamT = 0;
  let oublisT = 0;
  let sommeLevers = 0;
  let smaranda = false;
  let nacera = false;
  let troisieme = false;
  let jourPart = false;
  let tient: boolean | null = null;
  let chance = 0;
  let saisine = false;
  let vacantsNuit = 0;
  let recrue = 0;
  let departsJour = 0;
  let levers = LEVERS_DEPART;
  const rotation = d6 === 1 ? departsDeRotation(graine) : { nuit: 0, jour: 0 };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let heuresW = 0;
    let departW = 0;
    let chocN = 0;
    let chocJ = 0;

    // La répartition révisée, tirée une fois, quand elle se met en place (semaine 9).
    if (d4 === 0 && w === 9) {
      chance = chanceQueLaRepartitionTienne(chemin, Number(!smaranda) + Number(!nacera));
      tient = h.uTient < chance;
      if (!tient) {
        chocN += 0.2;
        chocJ += 0.2;
      }
    }

    // Combien de résidents la nuit lève avant 6 h 45.
    let l = leversDuConflit(d1, w);
    let deplacees = 0;
    let renfort = 0;
    if (d4 === 0 && w >= 9) {
      l = tient ? LEVERS_REVISION : 16;
      deplacees = tient ? DEPLACEES : 4;
    }
    if (d4 === 1 && w >= 7) {
      l = Math.min(l, 7);
      renfort = RENFORT_TOILETTES;
    }
    if (d4 === 2 && w >= 7) l = 10;
    if (d5 === 0 && w >= 9 && l > LEVE_TOT + 3) l -= 3; // Les résidents qui tombent ne sont plus levés tôt.
    // Sans temps communs inscrits dans le roulement, l'organisation retombe : l'après-midi lâche
    // les douches, et la pression du matin refait monter les levers.
    if ((d6 === 2 || d6 === 3) && w >= 11) {
      deplacees = Math.max(0, deplacees - 7 * (w - 10));
      l = Math.max(l, Math.min(16, levers + 5));
    }
    levers = l;

    // Le matin : ce qu'il reste à faire, et ce que l'équipe de jour peut tenir.
    let besoin = AIDES_MATIN - l - deplacees;
    for (const a of actifs) besoin += a.imprevu.effet.besoin ?? 0;
    let absJour = (0.06 + 0.1 * tj) * n.absences;
    for (const a of actifs) absJour += a.imprevu.effet.absJour ?? 0;
    const capacite =
      CAPACITE_MATIN * (1 - 0.6 * Math.max(0, absJour - 0.11)) +
      renfort +
      (d1 === 2 && w >= 3 ? GAIN_PETITS_DEJEUNERS : 0) -
      (jourPart ? 2 : 0);
    // Trancher pour la nuit : le matin s'organise un peu au bout de deux semaines.
    const adaptation = d1 === 1 && w >= 4 ? 4 : 0;
    const reportees = Math.max(0, besoin - capacite - adaptation);

    // Les transmissions : un chevauchement protégé, sauf s'il est mangé par les levers.
    // Les temps communs de la réunion durent tant qu'on en fait quelque chose : une répartition
    // laissée aux équipes les éteint en semaine 8, une répartition qui ne tient pas en semaine 9 ;
    // sans roulement, ils s'arrêtent en semaine 10.
    const temps =
      d1 === 2 &&
      w >= 3 &&
      (w <= 10 || d6 === 0) &&
      !(d4 === 3 && w >= 8) &&
      !(tient === false && w >= 9);
    let cibleQ = 0.2;
    const chevauchement = d2 === 0 && w >= 3 && !(d6 === 2 && w >= 11);
    if (chevauchement) cibleQ += l >= 16 ? 0.25 : 0.55;
    if (d2 === 1 && w >= 3) cibleQ += 0.18;
    if (d2 === 2 && w >= 3) cibleQ += 0.06;
    if (temps) cibleQ += 0.06;
    if (d5 === 0 && w >= 9) cibleQ += 0.05;
    if (d6 === 0 && w >= 11) cibleQ += 0.08; // Un binôme de transmission jour-nuit par étage.
    q += 0.45 * (cibleQ - q);
    const minutes = 3 + 15 * Math.max(0, q - QUALITE_DEPART);

    // La tension de chaque équipe.
    if (d1 === 0 && w === 2) chocN += 0.12;
    if (d1 === 1 && w === 2) chocJ += 0.12;
    if (d3 === 2 && w === 5) chocN += 0.08;
    if (d1 === 2 && d4 === 3 && w === 7) chocN += 0.08;
    if (d5 === 1 && w === 9) chocN += 0.15;
    if (d5 === 3 && w === 9) chocN += 0.06;
    if (d6 === 1 && w === 11) {
      chocN += 0.15;
      chocJ += 0.12;
    }
    const imposes = Math.max(0, l - LEVE_TOT) / (LEVERS_DEPART - LEVE_TOT);
    const commun =
      (temps ? 0.12 : 0) +
      (chevauchement ? 0.05 : 0) +
      (d5 === 0 && w >= 9 && w <= 10 ? 0.05 : 0) +
      (d6 === 0 && w >= 11 ? 0.04 : 0);
    let griefs = 0;
    if (d2 === 1 && w >= 3) griefs += 0.03;
    if (d2 === 2 && w >= 3) griefs += 0.07;
    let cibleN = 0.18 + 0.35 * imposes + 0.15 * (1 - q) + 0.04 * vacantsNuit - commun + griefs;
    let cibleJ = 0.2 + 0.02 * reportees + 0.15 * (1 - q) + 0.06 * departsJour - commun + griefs;
    if (d1 === 3 && w >= 2 && w <= 3) {
      cibleN -= 0.03;
      cibleJ -= 0.03;
    }
    if (d3 === 1 && w >= 5 && w <= 8) cibleN -= 0.05;
    if (d4 === 2 && w >= 7) {
      cibleN += 0.05;
      cibleJ += 0.03;
    }
    if (d4 === 0 && w >= 7) cibleJ -= 0.02;
    tn = borne(tn + 0.35 * (Math.max(0.15, cibleN) - tn) + chocN, 0.1, 1);
    tj = borne(tj + 0.35 * (Math.max(0.15, cibleJ) - tj) + chocJ, 0.1, 1);

    // Les départs, lus en fin de semaine : les deux veilleuses, puis la troisième et le jour.
    if (w === 5) {
      smaranda = h.uSmaranda < risqueMutation(d3, tn);
      nacera = h.uNacera < risqueMutation(d3, tn);
      for (const part of [smaranda, nacera]) if (part) departW += COUT_DEPART_NUIT;
    }
    if (w === 9) {
      troisieme = h.uNuit < risqueNuit(tn, d5 === 1, tient === false);
      jourPart = h.uJour < risqueJour(tj);
      if (troisieme) departW += COUT_DEPART_NUIT;
      if (jourPart) {
        departW += COUT_DEPART_JOUR;
        departsJour += 1;
      }
    }
    if (d6 === 1 && w === 11) {
      departW += rotation.nuit * COUT_DEPART_NUIT + rotation.jour * COUT_DEPART_JOUR;
      departsJour += rotation.jour;
    }
    // Les mutations prennent effet en semaine 7 ; les démissions après deux semaines.
    vacantsNuit =
      (w >= 7 ? Number(smaranda) + Number(nacera) : 0) +
      (w >= 11 && troisieme ? 1 : 0) +
      (w >= 13 ? rotation.nuit : 0);
    // Une recrue de nuit, si le recrutement a été lancé tôt (mutations acceptées en semaine 4).
    recrue = d3 === 0 && w >= 11 && h.uRecrue < 0.5 ? 1 : 0;
    const vacants = Math.max(0, vacantsNuit - recrue);

    // Les nuits à remplacer : les absences, et les postes vacants.
    let absNuit = (0.08 + 0.08 * tn) * n.absences;
    if (d6 === 1 && w >= 11) absNuit += 0.05;
    for (const a of actifs) absNuit += a.imprevu.effet.absNuit ?? 0;
    const nuitsAbsentes = POSTES_DE_NUIT * 7 * absNuit;
    const nuitsVacantes = vacants * NUITS_PAR_SEMAINE;
    const sansInterim = actifs.some((a) => a.imprevu.effet.sansInterim);
    const partInterim = sansInterim ? 0 : PART_INTERIM;
    const heureRemplacee = partInterim * INTERIM_HEURE + (1 - partInterim) * RAPPEL_HEURE;
    const remplacement =
      nuitsAbsentes * HEURES_NUIT * heureRemplacee +
      nuitsVacantes * HEURES_NUIT * (heureRemplacee - SALAIRE_HEURE);
    // Les rappels sur repos usent celles qui restent.
    tn = borne(tn + 0.01 * (1 - partInterim) * (nuitsAbsentes + nuitsVacantes) * 0.25, 0.05, 1);

    // Les heures : temps communs, groupe de travail, renfort, heures du matin.
    if (d1 === 2 && (w === 2 || w === 3)) heuresW += COUT_REUNION;
    if (d1 === 3 && w === 1) heuresW += 400;
    if (d2 === 0 && w === 3) heuresW += COUT_FORMATION;
    if (chevauchement) heuresW += COUT_CHEVAUCHEMENT;
    if (d2 === 1 && w === 3) heuresW += 600;
    if (d3 === 1 && w >= 5 && w <= 8) heuresW += COUT_REFERENTES;
    if (d4 === 0 && (w === 7 || w === 8)) heuresW += COUT_REVISION;
    if (d4 === 1 && w >= 7) heuresW += COUT_RENFORT;
    if (d5 === 0 && w === 9) heuresW += 700;
    if (d6 === 0 && w === 12) heuresW += COUT_REUNION_MENSUELLE;
    heuresW += reportees * 7 * 0.75 * HEURE_JOUR * 1.25;

    // Les événements indésirables.
    let chutes =
      (CHUTES_BASE +
        CHUTES_PAR_OUBLI_DE_QUALITE * (1 - q) +
        CHUTES_PAR_LEVER * Math.max(0, l - LEVE_TOT)) *
      n.chutes;
    chutes += 0.08 * vacants;
    if (d6 === 1 && w >= 11) chutes += 0.3; // Des soignants de jour de nuit, qui ne connaissent pas les résidents.
    for (const a of actifs) chutes += a.imprevu.effet.chutes ?? 0;
    const reclamations =
      (RECLAMATIONS_BASE +
        RECLAMATIONS_PAR_LEVER * Math.max(0, l - LEVE_TOT) +
        RECLAMATIONS_PAR_REPORT * reportees) *
      n.reclamations;
    let oublis = OUBLIS_MAX * (1 - q);
    for (const a of actifs) oublis += a.imprevu.effet.oublis ?? 0;
    let evenementsW = chutes * COUT_CHUTE + reclamations * COUT_RECLAMATION + oublis * COUT_OUBLI;
    if (w === 9 && familleSaisitLARS(d5, graine)) {
      saisine = true;
      evenementsW += COUT_SAISINE;
    }

    const cout = heuresW + remplacement + departW + evenementsW + (w === 1 ? perte : 0);
    coutCumule += cout;
    heures += heuresW;
    remplacementsNuit += remplacement;
    departs += departW;
    evenements += evenementsW;
    chutesT += chutes;
    reclamT += reclamations;
    oublisT += oublis;
    sommeLevers += l;

    semaines.push({
      levers: l,
      reportees,
      minutes,
      qualite: q,
      tensionNuit: tn,
      tensionJour: tj,
      chutes,
      reclamations,
      oublis,
      remplacements: nuitsAbsentes + nuitsVacantes,
      vacants,
      cout,
      coutCumule,
    });
  }

  const departsNuit = Number(smaranda) + Number(nacera) + Number(troisieme) + rotation.nuit;
  return {
    semaines,
    objectif: ENVELOPPE - coutCumule,
    cout: coutCumule,
    heures,
    remplacementsNuit,
    departs,
    evenements,
    chutes: chutesT,
    reclamations: reclamT,
    oublis: oublisT,
    leversFinaux: levers,
    leversMoyens: sommeLevers / SEMAINES,
    smarandaPart: smaranda,
    naceraPart: nacera,
    troisiemePart: troisieme,
    jourPart,
    rotation,
    repartitionTient: tient,
    chanceRepartition: chance,
    saisine,
    departsNuit,
    departsJour,
    posteInterim: POSTE_INTERIM_TRIMESTRE,
  };
}

/** Ce qui s'est passé pendant des semaines : départs, répartition, famille, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    t,
    mutations: dans(5),
    repartition: t.repartitionTient !== null && dans(9),
    saisine: t.saisine && dans(9),
    troisiemePart: t.troisiemePart && dans(9),
    jourPart: t.jourPart && dans(9),
    rotation: chemin[D.printemps] === 1 && dans(11),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureJourNuit {
  coutCumule: number | null;
  enveloppeADate: number | null;
  levers: number | null;
  chutes: number | null;
  minutes: number | null;
  remplacements: number | null;
  /** Lus pour les messages : les veilleuses parties, et la répartition. */
  veilleusesParties: number | null;
  reportees: number | null;
  repartitionTient: number | null;
}

/** Ce qu'Hélier lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureJourNuit {
  if (semaine === 0) {
    return {
      coutCumule: 0,
      enveloppeADate: 0,
      levers: LEVERS_DEPART,
      chutes:
        CHUTES_BASE +
        CHUTES_PAR_OUBLI_DE_QUALITE * (1 - QUALITE_DEPART) +
        CHUTES_PAR_LEVER * (LEVERS_DEPART - LEVE_TOT),
      minutes: 3,
      remplacements: POSTES_DE_NUIT * 7 * (0.08 + 0.08 * TENSION_NUIT),
      veilleusesParties: 0,
      reportees: AIDES_MATIN - LEVERS_DEPART - CAPACITE_MATIN,
      repartitionTient: null,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    coutCumule: s.coutCumule,
    enveloppeADate: (ENVELOPPE * semaine) / SEMAINES,
    levers: s.levers,
    chutes: s.chutes,
    minutes: s.minutes,
    remplacements: s.remplacements,
    veilleusesParties: semaine >= 6 ? Number(t.smarandaPart) + Number(t.naceraPart) : 0,
    reportees: s.reportees,
    repartitionTient:
      t.repartitionTient === null || semaine < 9 ? null : Number(t.repartitionTient),
  };
}
