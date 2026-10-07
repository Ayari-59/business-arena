/**
 * PASSER EN DOUZE HEURES — le modèle d'une unité de soins médicaux et de
 * réadaptation de la clinique du Val Solvanne.
 *
 * Quarante lits, une équipe de jour coupée en deux : une moitié veut passer
 * des postes de 7 h 30 à des postes de 12 heures (moins de jours travaillés,
 * moins de trajets), l'autre n'en veut pas. Le CSE doit être consulté. De
 * septembre à novembre, treize semaines, six décisions. Quatre mécanismes
 * font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE POSTE DE 12 HEURES A DES EFFETS DANS LES DEUX SENS. Deux relèves par
 *     jour au lieu de trois : moins d'heures payées en double pendant les
 *     transmissions, moins d'informations perdues d'une équipe à l'autre, et
 *     des candidats qui reviennent (la plupart des jeunes infirmiers demandent
 *     des 12 heures). Mais la fatigue de fin de poste fait monter les erreurs
 *     après la dixième heure, d'autant plus que les postes s'enchaînent et que
 *     la pause n'est pas protégée ; elle fait monter l'absentéisme, et une
 *     absence de 12 heures se remplace moins bien qu'une de 7 h 30. Combien,
 *     cela dépend de l'équipe : c'est la SENSIBILITÉ tirée au hasard, que
 *     personne ne connaît d'avance.
 *   · L'EXPÉRIMENTATION RÉVÈLE LES EFFETS. Un secteur volontaire, des
 *     indicateurs relevés avant et après : en semaine 7, les erreurs heure par
 *     heure disent ce que la trame coûte à CETTE équipe, et la trame peut être
 *     corrigée à temps. Sans indicateurs, on ne corrige que sur des impressions.
 *   · LE CSE CONSULTÉ TÔT, AVEC DES DONNÉES, REND LE PLUS SOUVENT UN AVIS
 *     FAVORABLE ; consulté après coup, il vote une expertise et la direction
 *     suspend le projet (tiré au hasard, plus probable sans données et plus le
 *     périmètre est large).
 *   · DEUX RYTHMES DANS UNE MÊME ÉQUIPE COÛTENT EN PLANNING. Des relèves qui ne
 *     tombent pas aux mêmes heures, des trous de fin d'après-midi comblés par
 *     l'intérim ; aligner les horaires des 7 h 30 sur les relèves des 12 heures
 *     en reprend l'essentiel.
 *
 * Imposer les 12 heures fait partir ceux qui ne peuvent pas les faire (une
 * infirmière, mère de trois enfants, tirée au hasard) ; les refuser fait
 * partir ceux qui les attendaient (une jeune infirmière que le CHU recrute en
 * 12 heures). Une erreur grave peut survenir en fin de poste : son risque suit
 * la fatigue accumulée.
 *
 * L'OBJECTIF, en euros : l'écart au budget de remplacement et d'intérim de
 * l'unité (postes vacants tenus en intérim, absences remplacées), moins le
 * surcoût des événements indésirables au-delà du niveau habituel, plus les
 * heures de chevauchement économisées, moins les coûts du projet (planning,
 * expertise), sur le trimestre ; PLUS la même chose projetée sur le trimestre
 * suivant (décembre à février), avec l'organisation retenue en semaine 11, les
 * postes pourvus d'ici là et ceux qu'elle fera pourvoir : c'est là que se lit la
 * valeur du recrutement. Si les 12 heures sont étendues aux deux autres unités,
 * ce qu'elles y gagnent ou y perdent est compté aussi.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Établissement, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const LITS = 40;
/** Journées d'hospitalisation par semaine : 40 lits occupés à 90 %. */
export const JOURNEES = 252;
/** Coût chargé moyen d'une heure de soignant salarié (infirmier ou aide-soignant). */
export const TAUX_HORAIRE = 32;
/** Une heure d'intérim chez Soralis Intérim Santé : deux fois une heure salariée. */
export const TAUX_INTERIM = 64;

/** Les relèves d'une journée : l'équipe qui arrive est payée pendant la transmission. */
export interface Releve {
  heure: string;
  minutes: number;
  arrivent: number;
  poste: string;
}
export const RELEVES_7H30: readonly Releve[] = [
  { heure: "6 h 45", minutes: 15, arrivent: 7, poste: "matin" },
  { heure: "13 h 45", minutes: 30, arrivent: 5, poste: "après-midi" },
  { heure: "21 h", minutes: 15, arrivent: 3, poste: "nuit" },
];
export const RELEVES_12H: readonly Releve[] = [
  { heure: "6 h 45", minutes: 15, arrivent: 7, poste: "jour" },
  { heure: "18 h 45", minutes: 15, arrivent: 3, poste: "nuit" },
];
/** Les heures payées en double chaque semaine : durée de chaque relève × agents qui arrivent × 7 jours. */
export const chevauchementHebdo = (releves: readonly Releve[]) =>
  7 * releves.reduce((s, r) => s + (r.minutes / 60) * r.arrivent, 0);
export const CHEVAUCHEMENT_7H30 = chevauchementHebdo(RELEVES_7H30);
export const CHEVAUCHEMENT_12H = chevauchementHebdo(RELEVES_12H);
/** La prévision de la semaine 1 : 35 − 17,5 = 17,5 heures par semaine pour toute l'unité. */
export const ECONOMIE_HEURES = CHEVAUCHEMENT_7H30 - CHEVAUCHEMENT_12H;
/** Chaque heure de chevauchement en moins est une heure d'intérim en moins. */
export const ECONOMIE_EUROS = ECONOMIE_HEURES * TAUX_INTERIM;

/** Heures de présence soignante planifiées chaque semaine dans l'unité. */
export const HEURES_SEMAINE = 840;
export const ABSENCE_BASE = 0.12;
/** La part des heures d'absence qu'on arrive à remplacer, en 7 h 30 et en 12 heures. */
export const REMPLACEMENT_7H30 = 0.65;
export const REMPLACEMENT_12H = 0.5;
/** Une heure remplacée : heures supplémentaires majorées ou intérim, en moyenne. */
export const COUT_HEURE_REMPLACEE = 48;
/** Événements indésirables avec conséquence pour le patient, par semaine, au niveau habituel. */
export const EI_BASE = 0.75;
/** Ce que coûte un événement indésirable : journées de séjour en plus, analyse, prise en charge. */
export const COUT_EI = 4000;
/** Part des événements indésirables liés aux transmissions : un tiers d'entre eux disparaît avec une relève de moins. */
export const PART_TRANSMISSIONS = 0.3;
/** L'excès d'erreurs après la dixième heure, pour une sensibilité de 1 et la trame la plus dure. */
export const EXCES_FATIGUE = 0.5;
/** L'absentéisme en plus, pour une sensibilité de 1 et la trame la plus dure. */
export const ABSENCE_FATIGUE = 0.03;
/** Au-delà de cet excès mesuré, des indicateurs font corriger la trame. */
export const SEUIL_CORRECTION = 0.12;
/** Chaque point d'heures d'absence non remplacées fait monter les erreurs de huit points. */
export const POIDS_NON_REMPLACE = 8;
/** L'absentéisme en plus dans une équipe à qui l'on impose les 12 heures. */
export const CLIMAT_IMPOSE = 0.015;

export const VACANCES_DEPART = 3;
/** Un poste vacant tenu en intérim : 35 heures payées 64 € au lieu de 32 €. */
export const SURCOUT_VACANCE = 35 * (TAUX_INTERIM - TAUX_HORAIRE);
/** Probabilité hebdomadaire de signer un candidat, en 7 h 30, et ce que les 12 heures y ajoutent. */
export const RECRUTEMENT_BASE = 0.03;
export const RECRUTEMENT_12H = 0.11;
/** Le préavis d'une recrue ou d'un départ, en semaines. */
export const PREAVIS = 4;

/** Le coût hebdomadaire de deux rythmes dans l'unité, et la part qui reste quand les horaires sont alignés. */
export const COEXISTENCE = 1400;
export const PART_ALIGNEE = 0.3;
export const COUT_ALIGNEMENT = 1000;
/** La part de l'expertise votée par le CSE à la charge de l'employeur (80 %). */
export const EXPERTISE = 12000;
export const EXPERTISE_CLINIQUE = 18000;
export const COUT_PLANNING_REFAIT = 2500;
export const COUT_EIG = 15000;
/** Ce qu'une unité qui offre des 12 heures gagne en recrutement chaque semaine, hors l'unité modèle. */
export const RECRUT_AUTRE = 300;

/** Le budget de remplacement et d'intérim de l'unité pour le trimestre. */
export const BUDGET = 80000;
export const BUDGET_HEBDO = BUDGET / SEMAINES;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des missions d'intérim réservées en urgence pour octobre. */
export const PERTE_PAR_JOUR = 1500;

/** La semaine du 1er octobre, quand le changement démarre sans attendre. */
export const DEBUT = 5;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  projet: 0,
  trame: 1,
  cse: 2,
  chiffres: 3,
  rythmes: 4,
  janvier: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 1, 0, 0, 3] as const;

export interface Trame {
  code: string;
  consecutifs: number;
  pause: number;
  protegee: boolean;
  /** La dureté de la trame : ce qui multiplie la sensibilité de l'équipe. */
  F: number;
  /** Ce qu'elle apporte au recrutement. */
  A: number;
  /** Le coût hebdomadaire des pauses tenues par un binôme, pour toute l'unité. */
  coutPause: number;
}

export const TRAMES: readonly Trame[] = [
  { code: "demandee", consecutifs: 4, pause: 30, protegee: false, F: 0.9, A: 1.2, coutPause: 0 },
  { code: "trois", consecutifs: 3, pause: 45, protegee: true, F: 0.35, A: 1, coutPause: 320 },
  { code: "deux", consecutifs: 2, pause: 30, protegee: false, F: 0.12, A: 0.6, coutPause: 0 },
];

/** La trame corrigée au vu des chiffres : trois postes au plus, pause protégée, soins à risque avant la dixième heure. */
export const corriger = (t: Trame): Trame => ({
  code: "corrigee",
  consecutifs: Math.min(3, t.consecutifs),
  pause: 45,
  protegee: true,
  F: Math.min(t.F, 0.35) * 0.5,
  A: Math.min(t.A, 1),
  coutPause: 320,
});

/** L'excès d'erreurs après la dixième heure qu'une trame donne à une équipe. */
export const exces = (s: number, t: Trame) => EXCES_FATIGUE * s * t.F;

/** La probabilité d'un conflit avec le CSE : [consultation][périmètre clinique, secteur pilote, unité]. */
export const PROBA_CONFLIT = {
  avant: { clinique: 0.45, pilote: 0.15, unite: 0.3 },
  apres: { clinique: 0.75, pilote: 0.45, unite: 0.6 },
} as const;
/** Étendre aux deux autres unités en novembre, sans les consulter. */
export const PROBA_CONFLIT_EXTENSION = 0.6;
/** Généraliser en janvier : sans bilan chiffré, et avec. */
export const PROBA_CONFLIT_JANVIER = { sansDonnees: 0.55, avecDonnees: 0.45 } as const;
/** L'infirmière qui ne peut pas faire de 12 heures part si on les lui impose. */
export const PROBA_DEPART_OPPOSEE = 0.55;
/** L'aide-soignante qui ne peut plus tenir 12 heures debout demande sa mutation. */
export const PROBA_MUTATION_OPPOSEE = 0.4;
/** L'infirmière qui attendait les 12 heures part au CHU si on les refuse ou les arrête. */
export const PROBA_DEPART_VOLONTAIRE = 0.5;
/** Le cadre de neurologie accepte d'expérimenter à son tour. */
export const PROBA_UNITE_B = 0.6;

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
  effet: { absence?: number; ei?: number; remplacement?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gastro",
    titre: "Gastro-entérite dans l'unité",
    de: "Équipe opérationnelle d'hygiène",
    role: "Clinique du Val Solvanne",
    texte:
      "Six patients et quatre soignants atteints de gastro-entérite : précautions complémentaires, chambres regroupées, deux semaines difficiles.",
    duree: 2,
    effet: { absence: 0.04, ei: 1.15 },
  },
  {
    id: "carneo",
    titre: "Panne de Carnéo",
    de: "Systèmes d'information",
    role: "Siège de l'Association Solvanne",
    texte:
      "Le dossier de soins Carnéo est resté inaccessible deux jours : transmissions et administration des traitements sur papier, à ressaisir ensuite.",
    duree: 1,
    effet: { ei: 1.3 },
  },
  {
    id: "afflux",
    titre: "Afflux d'entrées depuis le CHU",
    de: "Bureau des admissions",
    role: "Clinique du Val Solvanne",
    texte:
      "Le centre hospitalier universitaire est saturé : neuf entrées en une semaine, des patients plus lourds que d'habitude, l'unité pleine.",
    duree: 2,
    effet: { ei: 1.2 },
  },
  {
    id: "soralis",
    titre: "Plus d'intérimaires le week-end",
    de: "Soralis Intérim Santé",
    role: "Agence de Dijon",
    texte:
      "Soralis Intérim Santé ne peut plus fournir d'infirmiers le week-end pendant deux semaines : ses intérimaires sont pris ailleurs.",
    duree: 2,
    effet: { remplacement: 0.7 },
  },
  {
    id: "arret",
    titre: "Une aide-soignante arrêtée un mois",
    de: "Ressources humaines",
    role: "Clinique du Val Solvanne",
    texte:
      "Une aide-soignante de l'équipe de nuit s'est fracturé le poignet en dehors du travail : un mois d'arrêt, à remplacer.",
    duree: 3,
    effet: { absence: 0.025 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  ei: number;
  absence: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La sensibilité de l'équipe à la fatigue de fin de poste : personne ne la connaît d'avance. */
  s: number;
  /** Celle des deux autres unités. */
  s2: number;
  /** Un tirage par semaine : un candidat signe-t-il ? */
  recrutement: readonly number[];
  uCse: number;
  uExtension: number;
  uJanvier: number;
  uOpposee: number;
  uMutation: number;
  uVolontaire: number;
  uAutres: readonly [number, number];
  uEig: number;
  uUniteB: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000973 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      ei: borne(1 + 0.25 * gauss(r), 0.5, 1.8),
      absence: borne(1 + 0.15 * gauss(r), 0.7, 1.4),
    });
  }
  const s = borne(Math.exp(0.4 * gauss(r)), 0.5, 2.2);
  const s2 = borne(Math.exp(0.4 * gauss(r)), 0.5, 2.2);
  const recrutement = [0, ...Array.from({ length: SEMAINES }, () => r())];
  const uCse = r();
  const uExtension = r();
  const uJanvier = r();
  const uOpposee = r();
  const uMutation = r();
  const uVolontaire = r();
  const uAutres = [r(), r()] as const;
  const uEig = r();
  const uUniteB = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    semaines,
    s,
    s2,
    recrutement,
    uCse,
    uExtension,
    uJanvier,
    uOpposee,
    uMutation,
    uVolontaire,
    uAutres,
    uEig,
    uUniteB,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * UNE SEMAINE D'UNE UNITÉ, selon son organisation.
 * ------------------------------------------------------------------------- */
export interface Organisation {
  /** La part de l'équipe en 12 heures : 0, la moitié (un secteur), ou toute l'unité. */
  part: number;
  trame: Trame;
  aligne: boolean;
  /** Plus de 1 quand chacun choisit son rythme au mois le mois. */
  desordre: number;
  /** L'absentéisme en plus que laissent un conflit ou une erreur grave. */
  climat: number;
}

export interface Bilan {
  ei: number;
  absenteisme: number;
  remplacement: number;
  surcoutEI: number;
  chevauchement: number;
  economie: number;
  pause: number;
  coexistence: number;
}

/** Ce que coûte et rapporte une semaine d'organisation ; `bruit` et `imprevu` à 1 en projection. */
export function semaineType(
  o: Organisation,
  s: number,
  bruit: Bruit = { ei: 1, absence: 1 },
  effet: { absence: number; ei: number; remplacement: number } = {
    absence: 0,
    ei: 1,
    remplacement: 1,
  },
): Bilan {
  const { part, trame } = o;
  const absenteisme =
    (ABSENCE_BASE + o.climat + effet.absence + part * ABSENCE_FATIGUE * s * trame.F) *
    bruit.absence;
  const partRemplacee =
    (REMPLACEMENT_7H30 - part * (REMPLACEMENT_7H30 - REMPLACEMENT_12H)) * effet.remplacement;
  const absent = absenteisme * HEURES_SEMAINE;
  const nonRemplace = (absent * (1 - partRemplacee)) / HEURES_SEMAINE;
  const multiplicateur =
    1 -
    part * PART_TRANSMISSIONS * (1 / 3) +
    part * exces(s, trame) +
    POIDS_NON_REMPLACE * (nonRemplace - ABSENCE_BASE * (1 - REMPLACEMENT_7H30));
  const ei = EI_BASE * multiplicateur * bruit.ei * effet.ei;
  const coexistence =
    part > 0 && part < 1 ? COEXISTENCE * (o.aligne ? PART_ALIGNEE : 1) * o.desordre : 0;
  return {
    ei,
    absenteisme,
    remplacement: absent * partRemplacee * COUT_HEURE_REMPLACEE,
    surcoutEI: (ei - EI_BASE) * COUT_EI,
    chevauchement: CHEVAUCHEMENT_7H30 - part * ECONOMIE_HEURES,
    economie: part * ECONOMIE_EUROS,
    pause: part * trame.coutPause,
    coexistence,
  };
}

const SEPT_TRENTE: Organisation = {
  part: 0,
  trame: TRAMES[0]!,
  aligne: false,
  desordre: 1,
  climat: 0,
};

/** Ce qu'une autre unité de 40 lits gagne (ou perd) chaque semaine en passant toute en 12 heures. */
export function gainAutreUnite(t: Trame, s2: number, climat = CLIMAT_IMPOSE): number {
  const a = semaineType({ ...SEPT_TRENTE, part: 1, trame: t, climat }, s2);
  const b = semaineType(SEPT_TRENTE, s2);
  const net = (x: Bilan) => x.economie - x.remplacement - x.surcoutEI - x.pause;
  return net(a) - net(b) + RECRUT_AUTRE * t.A;
}

/* ---------------------------------------------------------------------------
 * LE DÉROULÉ DU TRIMESTRE : qui travaille comment, semaine après semaine.
 * ------------------------------------------------------------------------- */
export type Perimetre = "clinique" | "pilote" | "unite" | null;

export const perimetre = (chemin: readonly number[]): Perimetre =>
  (["clinique", "pilote", "unite", null] as const)[chemin[D.projet] ?? 3] ?? null;

/** Des indicateurs relevés avant le démarrage : seule l'expérimentation les prévoit. */
export const avecIndicateurs = (chemin: readonly number[]) => chemin[D.projet] === 1;

export interface Deroule {
  /** Indexés de 1 à 13. */
  orgs: Organisation[];
  autres: boolean[];
  debut: number | null;
  conflit: "avant" | "apres" | null;
  conflitExtension: boolean;
  suspendu: number | null;
  corrige: boolean;
  /** Semaine où l'on impose les 12 heures à l'unité entière. */
  imposition: number | null;
  /** Semaine où l'on refuse ou arrête les 12 heures. */
  refus: number | null;
  /** Semaines où les deux autres unités passent en 12 heures sans l'avoir choisi. */
  impositionAutres: number | null;
  ponctuels: number[];
  excesMesure: number;
}

export function derouler(chemin: readonly number[], graine: number): Deroule {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5] = chemin as readonly number[];
  const p = perimetre(chemin);
  const trame0 = TRAMES[d2 ?? 0]!;
  const orgs: Organisation[] = [];
  const autres: boolean[] = [];
  const ponctuels = Array.from({ length: SEMAINES + 1 }, () => 0);
  for (let w = 0; w <= SEMAINES; w += 1) {
    orgs.push({ ...SEPT_TRENTE, trame: trame0 });
    autres.push(false);
  }
  const depuis = (w: number, f: (o: Organisation) => Organisation) => {
    for (let k = w; k <= SEMAINES; k += 1) orgs[k] = f(orgs[k]!);
  };
  const autresDepuis = (w: number, v: boolean) => {
    for (let k = w; k <= SEMAINES; k += 1) autres[k] = v;
  };

  let debut: number | null = null;
  let conflit: Deroule["conflit"] = null;
  let suspendu: number | null = null;
  let imposition: number | null = null;
  let refus: number | null = d1 === 3 ? 2 : null;
  let impositionAutres: number | null = null;
  let corrige = false;
  let conflitExtension = false;

  if (p && d3 !== 2) {
    const quand = d3 === 0 ? "avant" : "apres";
    const enConflit = h.uCse < PROBA_CONFLIT[quand][p];
    if (enConflit && quand === "avant") {
      // Le CSE vote une expertise avant le démarrage : on attend son rendu, en décembre.
      conflit = "avant";
      ponctuels[5]! += p === "clinique" ? EXPERTISE_CLINIQUE : EXPERTISE;
    } else {
      debut = quand === "avant" ? DEBUT + 1 : DEBUT;
      const part = p === "pilote" ? 0.5 : 1;
      depuis(debut, (o) => ({ ...o, part }));
      if (p === "clinique") {
        autresDepuis(debut, true);
        impositionAutres = debut;
      }
      if (p !== "pilote") {
        imposition = debut;
        depuis(debut, (o) => ({ ...o, climat: o.climat + CLIMAT_IMPOSE }));
      }
      if (enConflit) {
        // Consulté après coup, le CSE vote une expertise ; la direction suspend tout en semaine 8.
        conflit = "apres";
        suspendu = 8;
        ponctuels[7]! += (p === "clinique" ? EXPERTISE_CLINIQUE : EXPERTISE) + COUT_PLANNING_REFAIT;
        depuis(8, (o) => ({ ...o, part: 0, climat: o.climat + 0.015 }));
        autresDepuis(8, false);
        refus = 8;
      }
    }
  }

  const enCours = (w: number) => orgs[w]!.part > 0;
  const excesMesure = exces(h.s, trame0);

  // Semaine 7 : les premiers chiffres.
  if (enCours(7)) {
    if (d4 === 1) {
      if (avecIndicateurs(chemin)) {
        if (excesMesure > SEUIL_CORRECTION) {
          corrige = true;
          depuis(8, (o) => ({ ...o, trame: corriger(o.trame) }));
        }
      } else {
        // Sans indicateurs, on ajuste le planning sur les plaintes, pas la fatigue.
        ponctuels[8]! += 800;
      }
    } else if (d4 === 2) {
      depuis(8, (o) => ({ ...o, part: 0 }));
      autresDepuis(8, false);
      refus = refus ?? 8;
    } else if (d4 === 3 && !autres[8]) {
      if (h.uExtension < PROBA_CONFLIT_EXTENSION) {
        conflitExtension = true;
        ponctuels[10]! += EXPERTISE_CLINIQUE + COUT_PLANNING_REFAIT;
        autresDepuis(9, true);
        autresDepuis(11, false);
        depuis(11, (o) => ({ ...o, part: 0, climat: o.climat + 0.015 }));
        suspendu = 11;
        refus = refus ?? 11;
      } else {
        autresDepuis(9, true);
      }
      impositionAutres = 9;
    }
  }

  // Semaine 9 : un rythme ou deux.
  const part9 = orgs[9]!.part;
  if (part9 > 0) {
    if (d5 === 0) {
      depuis(10, (o) =>
        o.part === 0 ? o : { ...o, part: o.part === 1 ? 0.75 : o.part, desordre: 1.25 },
      );
    } else if (d5 === 1 && part9 < 1) {
      ponctuels[10]! += COUT_ALIGNEMENT;
      depuis(10, (o) => ({ ...o, aligne: true }));
    } else if (d5 === 2 && part9 < 1) {
      depuis(11, (o) => (o.part === 0 ? o : { ...o, part: 1, climat: o.climat + CLIMAT_IMPOSE }));
      imposition = imposition ?? 11;
    } else if (d5 === 3) {
      depuis(11, (o) => ({ ...o, part: 0 }));
      refus = refus ?? 11;
    }
  }

  return {
    orgs,
    autres,
    debut,
    conflit,
    conflitExtension,
    suspendu,
    corrige,
    imposition,
    refus,
    impositionAutres,
    ponctuels,
    excesMesure,
  };
}

/** La part qu'apportent les 12 heures au recrutement, selon la trame et l'organisation. */
const attrait = (o: Organisation) => (o.part > 0 ? o.trame.A * (o.desordre > 1 ? 1.15 : 1) : 0);

export type Semaine = {
  /** Événements indésirables avec conséquence, pour 1 000 journées. */
  ei: number;
  absenteisme: number;
  vacants: number;
  /** Heures payées en double pendant les relèves. */
  chevauchement: number;
  /** Remplacements et intérim cumulés depuis le début du trimestre. */
  depenses: number;
  /** Part de l'équipe en 12 heures. */
  douze: number;
  /** Ce que la semaine a coûté au-delà du budget (négatif : en dessous). */
  ecart: number;
  /** Ce que la semaine a coûté : remplacements, intérim, erreurs, projet, moins les chevauchements. */
  cout: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  objectif: number;
  /** L'écart du trimestre seul. */
  trimestre: number;
  /** La valeur projetée du trimestre suivant. */
  projection: number;
  eiTotal: number;
  eiPourMille: number;
  absenteismeMoyen: number;
  vacantsFin: number;
  recrues: number;
  /** Semaines où un candidat a signé. */
  signatures: number[];
  departOpposee: number | null;
  departVolontaire: number | null;
  mutation: number | null;
  conflit: "avant" | "apres" | null;
  conflitExtension: boolean;
  conflitJanvier: boolean;
  eig: boolean;
  uniteB: boolean;
  corrige: boolean;
  debut: number | null;
  excesMesure: number;
  sensibilite: number;
  chevauchementFin: number;
}

/** Les départs tirés au hasard, selon ce qu'on a imposé ou refusé. */
function departs(chemin: readonly number[], graine: number, r: Deroule) {
  const h = hasard(graine);
  const janvier = chemin[D.janvier];
  const ran = r.orgs.some((o) => o.part > 0);
  let imposee = r.imposition;
  if (imposee === null && janvier === 0) imposee = SEMAINES + 1;
  let refusee = r.refus;
  if (refusee === null && janvier === 2 && ran) refusee = SEMAINES + 1;
  return {
    opposee: imposee !== null && h.uOpposee < PROBA_DEPART_OPPOSEE ? imposee + PREAVIS : null,
    mutation:
      imposee !== null && h.uMutation < PROBA_MUTATION_OPPOSEE ? imposee + PREAVIS + 2 : null,
    volontaire:
      refusee !== null && h.uVolontaire < PROBA_DEPART_VOLONTAIRE ? refusee + PREAVIS : null,
  };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const r = derouler(chemin, graine);
  const dep = departs(chemin, graine, r);
  const semaines: (Semaine | null)[] = [null];
  let vacants = VACANCES_DEPART;
  const arrivees = Array.from({ length: SEMAINES + 30 }, () => 0);
  let enAttente = 0;
  const signatures: number[] = [];
  let depenses = 0;
  let trimestre = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let eiTotal = 0;
  let absences = 0;
  let expo = 0;
  let eig = false;
  const annonceJanvier = r.debut === null && perimetre(chemin) !== null;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const o = r.orgs[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = { absence: 0, ei: 1, remplacement: 1 };
    for (const a of actifs) {
      effet.absence += a.imprevu.effet.absence ?? 0;
      effet.ei *= a.imprevu.effet.ei ?? 1;
      effet.remplacement *= a.imprevu.effet.remplacement ?? 1;
    }
    // Qui arrive, qui part.
    vacants -= arrivees[w]!;
    enAttente -= arrivees[w]!;
    if (dep.opposee === w) vacants += 1;
    if (dep.volontaire === w) vacants += 1;
    if (dep.mutation === w) vacants += 1;
    const org = eig && w >= 11 ? { ...o, climat: o.climat + 0.01 } : o;
    const b = semaineType(org, h.s, h.semaines[w]!, effet);

    // Un candidat signe-t-il ? Il arrive après son préavis.
    if (w >= 3 && vacants - enAttente > 0) {
      const a = attrait(o) || (annonceJanvier ? 0.4 * o.trame.A : 0);
      if (h.recrutement[w]! < RECRUTEMENT_BASE + RECRUTEMENT_12H * a) {
        signatures.push(w);
        arrivees[w + PREAVIS]! += 1;
        enAttente += 1;
      }
    }

    // L'erreur grave : son risque suit la fatigue accumulée des semaines 5 à 8.
    if (w >= 5 && w <= 10) expo += (o.part * exces(h.s, o.trame)) / 6;
    let ponctuel = r.ponctuels[w]!;
    if (w === 10 && h.uEig < 0.04 + 1.2 * expo) {
      eig = true;
      ponctuel += COUT_EIG;
    }

    let autres = 0;
    if (r.autres[w]) autres += 2 * gainAutreUnite(o.trame, h.s2);
    const depense = vacants * SURCOUT_VACANCE + b.remplacement;
    depenses += depense;
    const cout = depense + b.surcoutEI + b.pause + b.coexistence + ponctuel - b.economie - autres;
    trimestre += BUDGET_HEBDO - cout;
    eiTotal += b.ei;
    absences += b.absenteisme;
    semaines.push({
      ei: (b.ei / JOURNEES) * 1000,
      absenteisme: b.absenteisme,
      vacants,
      chevauchement: b.chevauchement,
      depenses,
      douze: o.part,
      ecart: cout - BUDGET_HEBDO,
      cout,
    });
  }
  // Les départs dans les deux autres unités, quand on leur a imposé les 12 heures.
  if (r.impositionAutres !== null) {
    for (const u of h.uAutres) {
      if (u < PROBA_DEPART_OPPOSEE) {
        const restant = Math.max(0, SEMAINES - (r.impositionAutres + PREAVIS) + 1);
        trimestre -= restant * SURCOUT_VACANCE;
      }
    }
  }

  const p = projeter(chemin, graine, r, dep, vacants, enAttente, arrivees);
  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: trimestre + p.valeur,
    trimestre,
    projection: p.valeur,
    eiTotal,
    eiPourMille: (eiTotal / (JOURNEES * SEMAINES)) * 1000,
    absenteismeMoyen: absences / SEMAINES,
    vacantsFin: vacants,
    recrues: signatures.length,
    signatures,
    departOpposee: dep.opposee,
    departVolontaire: dep.volontaire,
    mutation: dep.mutation,
    conflit: r.conflit,
    conflitExtension: r.conflitExtension,
    conflitJanvier: p.conflit,
    eig,
    uniteB: p.uniteB,
    corrige: r.corrige,
    debut: r.debut,
    excesMesure: r.excesMesure,
    sensibilite: h.s,
    chevauchementFin: pleines[SEMAINES - 1]!.chevauchement,
  };
}

/**
 * LE TRIMESTRE SUIVANT, avec l'organisation retenue en semaine 11. Les valeurs sont
 * attendues (sans bruit), sauf les réactions tirées au hasard : le CSE si l'on généralise,
 * le cadre de neurologie si on lui propose d'expérimenter.
 */
function projeter(
  chemin: readonly number[],
  graine: number,
  r: Deroule,
  dep: { opposee: number | null; volontaire: number | null; mutation: number | null },
  vacantsFin: number,
  enAttenteFin: number,
  arrivees: readonly number[],
) {
  const h = hasard(graine);
  const d6 = chemin[D.janvier];
  const fin = r.orgs[SEMAINES]!;
  const aTourne = r.orgs.some((o) => o.part > 0);
  const donnees = avecIndicateurs(chemin) && r.orgs.filter((o) => o.part > 0).length >= 3;
  const climatFin = fin.climat + (r.conflit === "apres" || r.conflitExtension ? 0.01 : 0);
  let o: Organisation = { ...fin, climat: climatFin };
  let autres = r.autres[SEMAINES]!;
  let attraitProj = 1;
  let conflit = false;
  let uniteB = false;
  let ponctuel = 0;
  let perteDeMoitie = false;
  const trameDepart = TRAMES[chemin[D.trame] ?? 0]!;
  const suspendu = r.conflit !== null || r.conflitExtension;

  if (d6 === 0) {
    // Généraliser : l'unité entière et les deux autres, avec la trame du moment.
    const trame = aTourne ? fin.trame : trameDepart;
    o = {
      ...o,
      part: 1,
      trame,
      aligne: false,
      desordre: 1,
      climat: o.climat + (r.imposition === null ? CLIMAT_IMPOSE : 0),
    };
    autres = true;
    const p = suspendu
      ? 0.8
      : donnees
        ? PROBA_CONFLIT_JANVIER.avecDonnees
        : PROBA_CONFLIT_JANVIER.sansDonnees;
    if (h.uJanvier < p) {
      conflit = true;
      ponctuel += EXPERTISE_CLINIQUE;
      perteDeMoitie = true;
    }
    if (r.impositionAutres === null) {
      for (const u of h.uAutres) if (u < PROBA_DEPART_OPPOSEE) ponctuel += 9 * SURCOUT_VACANCE;
    }
  } else if (d6 === 1) {
    // Le bilan chiffré au CSE ; garder ce qui a fait ses preuves ; proposer une seconde unité.
    if (aTourne && !suspendu) {
      let trame = fin.trame;
      if (donnees && exces(h.s, trame) > SEUIL_CORRECTION) trame = corriger(trame);
      if (fin.part > 0) {
        const garde = { ...o, trame };
        // Des chiffres permettent aussi de renoncer, quand les 12 heures coûtent plus qu'elles ne rapportent.
        o =
          !donnees || valeurHebdo(garde, h.s) >= valeurHebdo({ ...garde, part: 0 }, h.s)
            ? garde
            : { ...garde, part: 0 };
      } else {
        // Revenu aux 7 h 30 en cours de trimestre : un secteur repart en janvier.
        o = { ...o, part: 0.5, trame, aligne: false, desordre: 1 };
      }
    } else {
      // Rien de mesuré encore : une expérimentation en janvier, sur un secteur.
      o = { ...o, part: 0.5, trame: trameDepart, aligne: false, desordre: 1 };
    }
    autres = false;
    if (h.uUniteB < PROBA_UNITE_B) {
      uniteB = true;
      ponctuel -= 13 * 0.5 * Math.max(gainAutreUnite(corriger(trameDepart), h.s2) - 300, -200);
    }
  } else if (d6 === 2) {
    o = { ...o, part: 0 };
    autres = false;
  } else {
    // Prolonger sans trancher : rien ne change, et les candidats hésitent.
    attraitProj = 0.6;
  }

  // Le départ que provoque la décision de janvier, s'il ne s'est pas déjà produit.
  const departs: number[] = [];
  if (dep.opposee !== null && dep.opposee > SEMAINES) departs.push(dep.opposee - SEMAINES);
  if (dep.volontaire !== null && dep.volontaire > SEMAINES) departs.push(dep.volontaire - SEMAINES);
  if (dep.mutation !== null && dep.mutation > SEMAINES) departs.push(dep.mutation - SEMAINES);

  let vac = vacantsFin;
  let attente = enAttenteFin;
  const arrivent = Array.from({ length: 40 }, (_, k) => arrivees[SEMAINES + k] ?? 0);
  let valeur = -ponctuel;
  const p = RECRUTEMENT_BASE + RECRUTEMENT_12H * attrait(o) * attraitProj;
  for (let k = 1; k <= SEMAINES; k += 1) {
    vac -= arrivent[k]!;
    attente -= arrivent[k]!;
    for (const d of departs) if (d === k) vac += 1;
    const libres = Math.max(0, vac - attente);
    const signe = Math.min(libres, p);
    arrivent[k + PREAVIS] = (arrivent[k + PREAVIS] ?? 0) + signe;
    attente += signe;
    const b = semaineType(o, h.s);
    let autresGain = autres ? 2 * gainAutreUnite(o.trame, h.s2) : 0;
    let economie = b.economie;
    if (perteDeMoitie && k > 6) {
      autresGain = 0;
      economie = 0;
    }
    const cout =
      Math.max(0, vac) * SURCOUT_VACANCE +
      b.remplacement +
      b.surcoutEI +
      b.pause +
      b.coexistence -
      economie -
      autresGain;
    valeur += BUDGET_HEBDO - cout;
  }
  return { valeur, conflit, uniteB };
}

/** La valeur hebdomadaire d'une organisation, sans les postes vacants : ce qu'un bilan chiffré compare. */
export function valeurHebdo(o: Organisation, s: number): number {
  const b = semaineType(o, s);
  return (
    b.economie -
    b.remplacement -
    b.surcoutEI -
    b.pause -
    b.coexistence +
    RECRUTEMENT_12H * attrait(o) * SURCOUT_VACANCE * 6
  );
}

export interface LectureDouze {
  ei: number | null;
  absenteisme: number | null;
  vacants: number | null;
  chevauchement: number | null;
  depenses: number | null;
  budgetADate: number | null;
  /** Clés non affichées, pour les messages et les sources. */
  douze: number | null;
  exces: number | null;
  indicateurs: number | null;
  conflit: number | null;
  corrige: number | null;
  aTourne: number | null;
}

/** Ce qu'Irène lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDouze {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      ei: (EI_BASE / JOURNEES) * 1000,
      absenteisme: ABSENCE_BASE,
      vacants: VACANCES_DEPART,
      chevauchement: CHEVAUCHEMENT_7H30,
      depenses: 0,
      budgetADate: 0,
      douze: 0,
      exces: 0,
      indicateurs: avecIndicateurs(chemin) ? 1 : 0,
      conflit: 0,
      corrige: 0,
      aTourne: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const conflitConnu =
    (t.conflit === "avant" && semaine >= 5) ||
    (t.conflit === "apres" && semaine >= 7) ||
    (t.conflitExtension && semaine >= 10);
  return {
    ei: s.ei,
    absenteisme: s.absenteisme,
    vacants: s.vacants,
    chevauchement: s.chevauchement,
    depenses: s.depenses,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    douze: s.douze,
    exces: t.excesMesure,
    indicateurs: avecIndicateurs(chemin) ? 1 : 0,
    conflit: conflitConnu ? 1 : 0,
    corrige: t.corrige && semaine >= 8 ? 1 : 0,
    aTourne: t.semaines.slice(1, semaine + 1).some((x) => x!.douze > 0) ? 1 : 0,
  };
}
