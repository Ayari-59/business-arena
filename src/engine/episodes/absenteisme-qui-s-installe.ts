/**
 * L'ABSENTÉISME QUI S'INSTALLE — le modèle de l'EHPAD de Montbard (Association Solvanne).
 *
 * Soixante-dix résidents, vingt-quatre équivalents temps plein d'aides-soignants
 * (120 journées de travail par semaine au planning), un trimestre d'avril à juin,
 * six décisions. L'absentéisme des aides-soignants est à 16 % sur douze mois,
 * quand le secteur tourne entre 10 et 14 %. Quatre mécanismes font l'épisode, et
 * le joueur doit les découvrir :
 *
 *   · L'ABSENTÉISME SE LIT PAR MOTIFS. Trois motifs qui n'ont ni les mêmes causes
 *     ni les mêmes remèdes : les accidents du travail et les arrêts pour le dos
 *     (40 % des journées), les arrêts courts (30 %), les longues maladies et
 *     autres absences longues (30 %), sur lesquelles un trimestre ne peut presque
 *     rien. Le taux global ne dit rien de tout cela ; la décomposition, qui coûte
 *     une journée d'enquête, dit tout.
 *   · LE DOS SE PROTÈGE PAR LE MATÉRIEL, ET AVEC RETARD. Les arrêts pour le dos
 *     suivent l'exposition aux manutentions sans matériel : transferts et
 *     redressements de résidents très dépendants faits à bras. Rails de
 *     transfert, verticalisateurs et formation coûtent tout de suite et n'agissent
 *     qu'une fois posés (semaine 7) ; l'assurance maladie, au titre des risques
 *     professionnels, en finance une part si le dossier est retenu, ce que le
 *     hasard décide. Un nouvel accident au dos est un tirage, dont la
 *     probabilité suit l'exposition semaine après semaine.
 *   · LES ARRÊTS COURTS SUIVENT LES RAPPELS SUR REPOS. Chaque absence se couvre
 *     par un rappel d'une collègue sur son repos, un CDD ou l'intérim ; les
 *     rappels fatiguent, et fabriquent les arrêts courts des semaines suivantes,
 *     qui appellent de nouveaux rappels. Un planning publié six semaines à
 *     l'avance et un pool de remplacement cassent la boucle ; répartir les
 *     rappels plutôt que de toujours appeler les mêmes la desserre.
 *   · LA PRIME D'ASSIDUITÉ SOIGNE LE SYMPTÔME. Elle fait à peine baisser les
 *     arrêts courts, rien sur les accidents (elle fait même venir travailler
 *     avec le dos bloqué), et prive de prime celles qui se sont blessées en
 *     soignant : un sentiment d'injustice qui fait partir. Les contre-visites
 *     médicales systématiques font de même, en plus cher.
 *
 * L'OBJECTIF, en euros : l'écart au budget de remplacement des aides-soignants
 * inscrit à l'EPRD (calculé sur 12 % d'absentéisme), sur douze mois d'avril à
 * mars. Le coût compte les remplacements (rappels sur repos payés en heures
 * supplémentaires majorées, CDD, intérim de Soralis Intérim Santé, pool) et les
 * mesures (prime, contre-visites, matériel net de l'aide, formation), pour le
 * trimestre joué, PUIS pour les trois trimestres suivants projetés au rythme que
 * les mesures en place à la semaine 13 installent : sans bruit ni imprévu, avec
 * l'exposition au dos, le pool, le planning et la prime tels qu'ils sont fin
 * juin, et les suites certaines du trimestre (rechute, départ). Le matériel est
 * compté à son prix, net de l'aide : ce que l'établissement débourse dans
 * l'année, sans amortissement ni économie au-delà de mars. Ce qui agit tard
 * rapporte donc moins : c'est voulu.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les trois trimestres suivants, projetés au rythme atteint. */
export const SEMAINES_PROJETEES = 39;
export const ETP_AS = 24;
/** Journées de travail d'aides-soignants au planning, par semaine : 24 ETP × 5. */
export const JOURS_PLANNING = ETP_AS * 5;
export const TAUX_DEPART = 0.16;
/** Le taux que vise le CPOM, et sur lequel l'EPRD calcule le budget de remplacement. */
export const TAUX_CIBLE = 0.12;
/** La part de chaque motif dans les journées d'absence des douze derniers mois. */
export const PARTS = { dos: 0.4, courts: 0.3, longues: 0.3 } as const;
/** Le coût d'une journée d'aide-soignant (7 heures), chargée, selon qui la fait. */
export const JOURNEE = { salariee: 190, cdd: 210, rappel: 260, interim: 380 } as const;
/** Comment les absences ont été couvertes sur douze mois. */
export const MIX_DEPART = { rappel: 0.4, cdd: 0.35, interim: 0.25 } as const;
export const COUT_MOYEN_DEPART =
  MIX_DEPART.rappel * JOURNEE.rappel +
  MIX_DEPART.cdd * JOURNEE.cdd +
  MIX_DEPART.interim * JOURNEE.interim;
/** Les journées d'absence d'une année au rythme actuel. */
export const JOURS_ABSENCE_AN = TAUX_DEPART * JOURS_PLANNING * 52;
/** Ce que coûtent les remplacements d'une année au rythme actuel : la prévision de la semaine 1. */
export const COUT_ANNUEL_DEPART = JOURS_ABSENCE_AN * COUT_MOYEN_DEPART;
/** Le budget de remplacement des aides-soignants inscrit à l'EPRD, sur 12 % d'absentéisme. */
export const BUDGET =
  Math.round((TAUX_CIBLE * JOURS_PLANNING * 52 * COUT_MOYEN_DEPART) / 1000) * 1000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, la semaine se recolle à coups de rappels et d'intérim. */
export const PERTE_PAR_JOUR = 900;

/* Les motifs, au rythme de départ : 19,2 journées d'absence par semaine. */
const ABSENCES_DEPART = TAUX_DEPART * JOURS_PLANNING;
/** Les longues maladies : 5,76 journées par semaine, hors de portée d'un trimestre. */
export const LONGUES = PARTS.longues * ABSENCES_DEPART;
/** Un accident ou un arrêt pour le dos dure six semaines : 30 journées. */
export const DUREE_DOS = 6;
/** La probabilité, chaque semaine, d'un nouvel arrêt long pour le dos, à exposition 1. */
export const P_DOS = 0.12;
/** Les arrêts plus courts pour douleurs de dos et d'épaules (TMS), à exposition 1. */
export const TMS = PARTS.dos * ABSENCES_DEPART - P_DOS * DUREE_DOS * 5;
/** Les rappels sur repos de départ : 40 % des absences. */
export const RAPPELS_DEPART = MIX_DEPART.rappel * ABSENCES_DEPART;
/** Chaque rappel sur repos fabrique 0,3 journée d'arrêt court dans les deux semaines. */
export const ARRETS_PAR_RAPPEL = 0.3;
/** Les arrêts courts que fait un planning modifié sans cesse. */
export const INSTABILITE = 0.9;
/** Les arrêts courts qu'on ne maîtrise pas : viroses, enfants malades. */
export const COURTS_INCOMPRESSIBLES =
  PARTS.courts * ABSENCES_DEPART - ARRETS_PAR_RAPPEL * RAPPELS_DEPART - INSTABILITE;

export const EQUIPEMENT = {
  chambres: 12,
  rail: 1800,
  verticalisateurs: 2,
  verticalisateur: 2600,
  formation: 3000,
  /** Une journée de formation par aide-soignant, remplacée en CDD. */
  journeesFormation: ETP_AS,
  /** La semaine où rails et verticalisateurs sont posés. */
  pose: 7,
  /** Ce que la formation retire de l'exposition, dès la semaine 3. */
  effetFormation: 0.85,
  /** Ce que le matériel retire en plus, une fois posé. */
  effetMateriel: 0.5,
} as const;
export const MATERIEL =
  EQUIPEMENT.chambres * EQUIPEMENT.rail + EQUIPEMENT.verticalisateurs * EQUIPEMENT.verticalisateur;
export const COUT_EQUIPEMENT =
  MATERIEL + EQUIPEMENT.formation + EQUIPEMENT.journeesFormation * JOURNEE.cdd;
/** L'aide de l'assurance maladie au titre des risques professionnels : 40 % du matériel, si le dossier est retenu. */
export const AIDE = { part: 0.4, chance: 0.6, semaine: 6 } as const;
export const MONTANT_AIDE = AIDE.part * MATERIEL;

/** Le pool : deux aides-soignantes à temps plein, congés déduits, 4,5 journées chacune. */
export const POOL = { aides: 2, journees: 4.5, debut: 5, chanceComplet: 0.65, renfort: 9 } as const;
export const COUT_POOL_SEMAINE = POOL.aides * 5 * JOURNEE.salariee;
/** Un rappel sur deux… : la part des journées du pool qui remplace un rappel plutôt qu'un intérim. */
const POOL_SUR_RAPPELS = 0.7;
/** La prime de rappel majorée : 35 € de plus par rappel. */
export const MAJORATION_RAPPEL = 35;
/** La prime d'assiduité : 80 € par mois et par AS sans absence, charges comprises, par semaine. */
export const PRIME = { mensuelle: 80, charges: 1.45, partSansAbsence: 0.6 } as const;
export const PRIME_SEMAINE = Math.round(
  (ETP_AS * PRIME.partSansAbsence * PRIME.mensuelle * PRIME.charges * 12) / 52,
);
/** Une contre-visite médicale, par arrêt court ; un arrêt court dure 2,5 journées en moyenne. */
export const CONTRE_VISITE = 120;
const DUREE_ARRET_COURT = 2.5;

/** La reprise de Fanta Bathily en semaine 7 : le risque de rechute, sans puis avec matériel. */
export const RECHUTE = {
  plein: [0.45, 0.3],
  amenagee: [0.15, 0.08],
  tpt: [0.05, 0.03],
} as const;
/**
 * Une rechute : un nouvel arrêt à partir de la semaine 9. Douze semaines après une
 * reprise à plein poste ; huit après une reprise aménagée, quatre à temps partiel
 * thérapeutique : plus la reprise est suivie, plus la douleur est vue tôt.
 */
export const RECHUTE_SEMAINE = 9;
export const RECHUTE_DUREE = { plein: 12, amenagee: 8, tpt: 4 } as const;
export const dureeDeRechute = (chemin: readonly number[]) =>
  chemin[D.reprise] === 1
    ? RECHUTE_DUREE.amenagee
    : chemin[D.reprise] === 2
      ? RECHUTE_DUREE.tpt
      : RECHUTE_DUREE.plein;
/** Le binôme d'une reprise aménagée : des journées de renfort, sans puis avec matériel. */
export const BINOME = [1.5, 0.7] as const;
/** Le temps partiel thérapeutique à 60 % : deux journées par semaine à remplacer, cinq semaines. */
export const TPT = { journees: 2, semaines: 5 } as const;

export const MATIN = {
  reorganisation: 1500,
  interim: 950,
  effet: 0.85,
  effetInterim: 0.9,
} as const;
export const INCIDENT_ASH = { chance: 0.5, semaine: 10, journees: 20, enquete: 1500 } as const;
export const DEPART = { annonce: 8, dernier: 10, recrutement: 2500, vacance: 6 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  causes: 0,
  planning: 1,
  rappels: 2,
  reprise: 3,
  matin: 4,
  suite: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 0, 3, 2] as const;

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
  /** Les semaines où il peut tomber. */
  fenetre: readonly [number, number];
  effet: { courts?: number; longues?: number; exposition?: number; interim?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gastro",
    titre: "Épidémie de gastro-entérite",
    de: "Zoubida Mérigot",
    role: "Infirmière coordinatrice",
    texte:
      "Une gastro-entérite touche le premier étage : neuf résidents et cinq soignants en quinze jours. Précautions complémentaires, repas en chambre, et des arrêts de deux ou trois jours en cascade.",
    duree: 2,
    fenetre: [2, 8],
    effet: { courts: 3.5 },
  },
  {
    id: "soralis",
    titre: "Soralis Intérim Santé à court d'intérimaires",
    de: "Yvelise Pontarlier",
    role: "Chargée de clientèle, Soralis Intérim Santé",
    texte:
      "Nous ne pourrons honorer que la moitié de vos demandes cette semaine : nos aides-soignantes sont toutes placées. Je suis désolée.",
    duree: 1,
    fenetre: [2, 11],
    effet: { interim: 0.5 },
  },
  {
    id: "chaleur",
    titre: "Premier épisode de forte chaleur",
    de: "Idir Fréminet",
    role: "Médecin coordonnateur",
    texte:
      "Alerte canicule sur la Côte-d'Or : le plan bleu est déclenché. Hydratation toutes les deux heures, résidents en salle rafraîchie, et des soignants qui finissent épuisés.",
    duree: 1,
    fenetre: [9, 11],
    effet: { courts: 1, exposition: 1.1 },
  },
  {
    id: "admissions",
    titre: "Deux admissions de résidents très dépendants",
    de: "Zoubida Mérigot",
    role: "Infirmière coordinatrice",
    texte:
      "Deux admissions cette semaine depuis le centre hospitalier : deux résidents en GIR 1, qui ne se lèvent plus seuls. Six transferts lourds de plus par jour.",
    duree: 3,
    fenetre: [2, 11],
    effet: { exposition: 1.2 },
  },
  {
    id: "operation",
    titre: "Une aide-soignante de nuit opérée",
    de: "Pervenche Jacquemard",
    role: "Responsable administrative et RH",
    texte:
      "Une aide-soignante de nuit est opérée de l'épaule : arrêt d'un mois, sans lien avec le travail. Il faut couvrir ses nuits.",
    duree: 4,
    fenetre: [2, 10],
    effet: { longues: 5 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  courts: number;
  longues: number;
  tms: number;
  /** Un nouvel arrêt long pour le dos commence-t-il cette semaine ? */
  uDos: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** L'assurance maladie retient-elle le dossier d'aide ? */
  uAide: number;
  /** Deux candidates pour le pool, ou une seule ? */
  uPool: number;
  /** Fanta rechute-t-elle après sa reprise ? */
  uRechute: number;
  /** Et si elle reprend à mi-temps thérapeutique : un autre tirage, un autre rythme. */
  uRechuteMiTemps: number;
  /** Conceição démissionne-t-elle ? */
  uDepart: number;
  /** Un transfert fait par une ASH tourne-t-il mal ? */
  uAsh: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000981 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      courts: Math.min(1.4, Math.max(0.6, 1 + 0.15 * gauss(r))),
      longues: Math.min(1.25, Math.max(0.75, 1 + 0.08 * gauss(r))),
      tms: Math.min(1.4, Math.max(0.6, 1 + 0.15 * gauss(r))),
      uDos: r(),
    });
  }
  const uAide = r();
  const uPool = r();
  const uRechute = r();
  const uRechuteMiTemps = r();
  const uDepart = r();
  const uAsh = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    const [de, a] = imprevu.fenetre;
    imprevus.push({ imprevu, semaine: de + Math.floor(r() * (a - de + 1)) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uAide, uPool, uRechute, uRechuteMiTemps, uDepart, uAsh, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Six fois sur dix, l'assurance maladie retient le dossier d'aide. */
export const aideAccordee = (chemin: readonly number[], graine: number) =>
  chemin[D.causes] === 1 && hasard(graine).uAide < AIDE.chance;

/** Deux candidates pour le pool, environ deux fois sur trois ; sinon une seule jusqu'en semaine 9. */
export const poolComplet = (graine: number) => hasard(graine).uPool < POOL.chanceComplet;

const equipe = (chemin: readonly number[]) => chemin[D.causes] === 1;

/**
 * Le risque de rechute de Fanta, selon sa reprise et le matériel en place,
 * dans une équipe ordinaire. Quand d'autres arrêts pour le dos tombent avant sa
 * reprise, l'équipe est à court et on lui redonne vite les transferts lourds :
 * il est multiplié par 2,5 avec deux arrêts, par 4 avec trois (un temps partiel
 * thérapeutique l'en protège : elle n'est là qu'à 60 %, sur les soins légers).
 */
/** Le multiplicateur du risque de rechute, selon les arrêts pour le dos tombés avant la semaine 9. */
export const SURCHARGE = [0.4, 1, 2.5, 4] as const;
export function risqueDeRechute(chemin: readonly number[], arretsAvant = 1): number {
  const k = equipe(chemin) ? 1 : 0;
  const d4 = chemin[D.reprise];
  if (d4 === 2) return RECHUTE.tpt[k];
  const base = d4 === 1 ? RECHUTE.amenagee[k] : RECHUTE.plein[k];
  return Math.min(0.9, base * SURCHARGE[Math.min(3, arretsAvant)]!);
}

/**
 * CONCEIÇÃO PART-ELLE ? Vingt-deux ans de maison, elle fait partie des trois
 * qu'on rappelle toujours. Ce qui la fait partir : être rappelée sans fin, et
 * être traitée en suspecte. Lu en fin de semaine 8.
 */
export function risqueDeDepart(chemin: readonly number[]): number {
  const [d1, d2, d3] = chemin;
  let risque = 0.05;
  if (d1 === 0) risque += 0.15; // La prime : Fanta, blessée en soignant, en est privée.
  if (d1 === 2) risque += 0.15; // Un médecin à la porte de chaque arrêt.
  if (d2 === 2) risque += 0.08; // Plus de rappels, payés plus cher.
  if (d3 === 0) risque += 0.35; // Une contre-visite pour celles qui disent toujours oui.
  if (d3 === 1) risque -= 0.03; // Plus jamais rappelée au-delà de deux fois par mois.
  if (d3 === 2) risque += 0.05;
  if (d3 === 3) risque += 0.2;
  return Math.min(0.85, risque);
}
export const conceicaoPart = (chemin: readonly number[], graine: number) =>
  hasard(graine).uDepart < risqueDeDepart(chemin);

/** Un transfert fait par une ASH non formée tourne mal une fois sur deux sur le trimestre. */
export const incidentAsh = (chemin: readonly number[], graine: number) =>
  chemin[D.matin] === 2 && hasard(graine).uAsh < INCIDENT_ASH.chance;

/** Ce qui expose le dos des soignants, hors imprévus : 1 au départ. */
export function exposition(chemin: readonly number[], w: number, graine: number): number {
  const [d1, , , , d5, d6] = chemin;
  let e = 1;
  if (d1 === 1 && w >= 3) e *= EQUIPEMENT.effetFormation;
  if (d1 === 1 && w >= EQUIPEMENT.pose) e *= EQUIPEMENT.effetMateriel;
  // La prime fait venir travailler avec le dos bloqué : les arrêts arrivent plus tard, plus longs.
  if ((d1 === 0 && w >= 3) || (d6 === 0 && w >= 11)) e *= 1.08;
  if (d5 === 0 && w >= 10) e *= MATIN.effet;
  if (d5 === 1 && w >= 9 && w <= SEMAINES) e *= MATIN.effetInterim;
  if (d5 === 2 && w >= 9 && !(incidentAsh(chemin, graine) && w >= INCIDENT_ASH.semaine)) e *= 0.94;
  return e;
}

/**
 * LA COUVERTURE D'UNE SEMAINE D'ABSENCES : le pool d'abord, puis les rappels sur
 * repos, les CDD, et l'intérim pour le reste.
 */
export function couvrir(
  absences: number,
  p: {
    pool: number;
    partRappels: number;
    partCdd: number;
    plafond: boolean;
    majoration: boolean;
    interimDispo?: number;
  },
) {
  const pool = Math.min(p.pool, absences);
  let rappels = Math.max(0, p.partRappels * absences - POOL_SUR_RAPPELS * pool);
  let versInterim = 0;
  // Le plafond : les trois qui disaient toujours oui ne sont plus appelées au-delà.
  if (p.plafond) {
    versInterim = rappels * 0.15;
    rappels -= versInterim;
  }
  const cdd = Math.min(p.partCdd * absences, absences - pool - rappels);
  let interim = Math.max(0, absences - pool - rappels - cdd);
  if (p.interimDispo != null && p.interimDispo < 1) {
    const manque = interim * (1 - p.interimDispo);
    interim -= manque;
    rappels += manque;
  }
  const cout =
    rappels * (JOURNEE.rappel + (p.majoration ? MAJORATION_RAPPEL : 0)) +
    cdd * JOURNEE.cdd +
    interim * JOURNEE.interim;
  return { pool, rappels, cdd, interim, cout };
}

export type Semaine = {
  /** Le taux d'absentéisme des aides-soignants de la semaine. */
  taux: number;
  absences: number;
  /** Journées d'absence pour le dos : accidents du travail et TMS. */
  dos: number;
  courts: number;
  longues: number;
  rappels: number;
  interim: number;
  cdd: number;
  /** Ce que la semaine a coûté : remplacements, pool, mesures. */
  cout: number;
  /** Le coût cumulé depuis le début du trimestre. */
  coutCumule: number;
  exposition: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de remplacement sur douze mois : positif, l'établissement reste dessous. */
  objectif: number;
  coutTrimestre: number;
  /** Les trois trimestres suivants, au rythme que les mesures de fin juin installent. */
  projection: number;
  cout12Mois: number;
  /** Le taux d'absentéisme projeté pour les trois trimestres suivants. */
  tauxProjete: number;
  tauxMoyen: number;
  tauxFinal: number;
  rappelsTotal: number;
  interimTotal: number;
  /** Les semaines où un nouvel arrêt long pour le dos a commencé. */
  arretsDos: readonly number[];
  aideAccordee: boolean;
  poolComplet: boolean;
  rechute: boolean;
  conceicaoPart: boolean;
  incidentAsh: boolean;
  risqueDepart: number;
  /** Le coût annuel au rythme d'avant les décisions, en k€ : la prévision de la semaine 1. */
  coutAnnuelDepart: number;
}

interface Regime {
  pool: number;
  partRappels: number;
  partCdd: number;
  plafond: boolean;
  majoration: boolean;
  conc: number;
  instab: number;
  facteurCourts: number;
}

/** Les règles en vigueur une semaine donnée : pool, rappels, planning, prime. */
function regime(chemin: readonly number[], graine: number, w: number, projete: boolean): Regime {
  const [d1, d2, d3, , , d6] = chemin;
  // Le pool est à l'essai jusqu'à fin juin ; la décision de la semaine 10 le prolonge ou non.
  let nPool = 0;
  if (!projete) {
    if (d2 === 0 && w >= POOL.debut) nPool = poolComplet(graine) || w >= POOL.renfort ? 2 : 1;
  } else if (d6 === 1) {
    nPool = 2;
  }
  const planningStable = (d2 === 0 || d2 === 1) && w >= 4;
  const majoration = d2 === 2 && w >= 3;
  let partRappels = majoration ? 0.55 : MIX_DEPART.rappel;
  if (d1 === 2 && w >= 2) partRappels *= 0.8; // Sous contre-visite, on décroche moins le téléphone.
  if (d3 === 0 && w >= 5) partRappels *= 0.75;
  const plafond = d3 === 1 && w >= 5;
  let facteurCourts = 1;
  if ((d1 === 0 && w >= 3) || (d6 === 0 && (w >= 11 || projete))) facteurCourts *= 0.93;
  if (d1 === 2 && w >= 2) facteurCourts *= 0.95;
  if (d3 === 0 && w >= 5) facteurCourts *= 0.97;
  return {
    pool: nPool * POOL.journees,
    partRappels,
    partCdd: planningStable || (projete && d6 === 1) ? 0.42 : MIX_DEPART.cdd,
    plafond,
    majoration,
    // Répartir les rappels : la fatigue ne s'accumule plus sur les mêmes.
    conc: plafond ? 0.45 : d3 === 2 && w >= 5 ? 0.85 : 1,
    instab: planningStable || (projete && d6 === 1) ? 0.3 : majoration ? 1.15 : 1,
    facteurCourts,
  };
}

const coutPool = (reg: Regime) => (reg.pool / POOL.journees) * 5 * JOURNEE.salariee;

/** Les arrêts courts d'une semaine, selon les rappels des deux semaines précédentes. */
const arretsCourts = (reg: Regime, rappelsRecents: number) =>
  (COURTS_INCOMPRESSIBLES +
    ARRETS_PAR_RAPPEL * reg.conc * rappelsRecents +
    INSTABILITE * reg.instab) *
  reg.facteurCourts;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const aide = aideAccordee(chemin, graine);
  let rechuteOui = false;
  const depart = conceicaoPart(chemin, graine);
  const ash = incidentAsh(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const historique = [RAPPELS_DEPART, RAPPELS_DEPART];
  const dosActifs: number[] = []; // Les semaines de début des arrêts pour le dos en cours.
  const arretsDos: number[] = [];
  const attente = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let coutCumule = 0;
  let rappelsTotal = 0;
  let interimTotal = 0;
  let sommeTaux = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const reg = regime(chemin, graine, w, false);
    let cout = w === 1 ? attente : 0;

    // LE DOS : l'exposition, les TMS, et les arrêts longs qui tombent ou non.
    let e = exposition(chemin, w, graine);
    for (const a of actifs) e *= a.imprevu.effet.exposition ?? 1;
    if (n.uDos < P_DOS * e) {
      dosActifs.push(w);
      arretsDos.push(w);
    }
    let dos = TMS * e * n.tms;
    for (const debut of dosActifs) if (w - debut < DUREE_DOS) dos += 5;
    if (w === RECHUTE_SEMAINE) {
      const u = d4 === 2 ? h.uRechuteMiTemps : h.uRechute;
      rechuteOui = u < risqueDeRechute(chemin, arretsDos.length);
    }
    // Fanta, en accident du travail jusqu'en semaine 6, puis sa reprise.
    if (w <= 6) dos += 5;
    if (rechuteOui && w >= RECHUTE_SEMAINE && w < RECHUTE_SEMAINE + dureeDeRechute(chemin))
      dos += 5;
    let reprise = 0;
    if (d4 === 1 && w >= 7 && w <= 10) reprise = BINOME[equipe(chemin) ? 1 : 0];
    if (d4 === 2 && w >= 7 && w < 7 + TPT.semaines) reprise = TPT.journees;

    // LES ARRÊTS COURTS : ce que les rappels des deux semaines précédentes ont fabriqué.
    let courts = arretsCourts(reg, (historique[0]! + historique[1]!) / 2) * n.courts;
    if (d5 === 0 && w >= 10) courts -= 0.2; // Un matin moins pressé.
    for (const a of actifs) courts += a.imprevu.effet.courts ?? 0;
    let longues = LONGUES * n.longues;
    for (const a of actifs) longues += a.imprevu.effet.longues ?? 0;

    const absences = dos + courts + longues + reprise;
    let interimDispo = 1;
    for (const a of actifs) interimDispo *= a.imprevu.effet.interim ?? 1;
    const c = couvrir(absences, { ...reg, interimDispo });
    historique.shift();
    historique.push(c.rappels);
    rappelsTotal += c.rappels;
    interimTotal += c.interim;

    // Ce que la semaine coûte : la couverture, le pool, les mesures.
    cout += c.cout + coutPool(reg);
    if ((d1 === 0 && w >= 3) || (d6 === 0 && w >= 11)) cout += PRIME_SEMAINE;
    if (d1 === 2 && w >= 2) cout += (courts / DUREE_ARRET_COURT) * CONTRE_VISITE;
    if (d1 === 1) {
      if (w === 3 || w === 4)
        cout += (EQUIPEMENT.formation + EQUIPEMENT.journeesFormation * JOURNEE.cdd) / 2;
      if (w === EQUIPEMENT.pose) cout += MATERIEL;
      if (w === AIDE.semaine && aide) cout -= MONTANT_AIDE;
    }
    if (d3 === 0 && w === 5) cout += 3 * CONTRE_VISITE;
    if (d5 === 0 && w === 9) cout += MATIN.reorganisation;
    if (d5 === 1 && w >= 9) cout += MATIN.interim;
    if (ash && w >= INCIDENT_ASH.semaine && w < INCIDENT_ASH.semaine + 4) {
      cout += (INCIDENT_ASH.journees / 4) * JOURNEE.cdd;
      if (w === INCIDENT_ASH.semaine) cout += INCIDENT_ASH.enquete;
    }
    // Conceição partie : son poste est tenu en intérim, au-delà de son salaire.
    if (depart && w > DEPART.dernier) cout += 5 * (JOURNEE.interim - JOURNEE.salariee);
    coutCumule += cout;

    const taux = absences / JOURS_PLANNING;
    sommeTaux += taux;
    semaines.push({
      taux,
      absences,
      dos,
      courts,
      longues,
      rappels: c.rappels,
      interim: c.interim,
      cdd: c.cdd,
      cout,
      coutCumule,
      exposition: e,
    });
  }

  // LA PROJECTION : trois trimestres au rythme que les mesures de fin juin installent.
  const regP = regime(chemin, graine, SEMAINES, true);
  let eP = exposition(chemin, SEMAINES, graine);
  if (d5 === 1) eP /= MATIN.effetInterim; // L'intérim du matin s'arrête fin juin.
  if (d5 === 2 && !ash) eP /= 0.94; // Les ASH ne font plus de transferts : l'IDEC y met fin.
  const dosP = (TMS + P_DOS * DUREE_DOS * 5) * eP;
  let courtsP = arretsCourts(regP, RAPPELS_DEPART);
  let couverture = couvrir(dosP + LONGUES + courtsP, regP);
  for (let k = 0; k < 30; k += 1) {
    courtsP = arretsCourts(regP, couverture.rappels) - (d5 === 0 ? 0.2 : 0);
    couverture = couvrir(dosP + LONGUES + courtsP, regP);
  }
  const absencesP = dosP + LONGUES + courtsP;
  const margeCouverture = couverture.cout / Math.max(1, absencesP - couverture.pool);
  let semaineP = couverture.cout + coutPool(regP);
  if (d1 === 0 || d6 === 0) semaineP += PRIME_SEMAINE;
  if (d1 === 2) semaineP += (courtsP / DUREE_ARRET_COURT) * CONTRE_VISITE;
  let projection = SEMAINES_PROJETEES * semaineP;
  // Les suites certaines du trimestre.
  const resteDeRechute = dureeDeRechute(chemin) - (SEMAINES - RECHUTE_SEMAINE + 1);
  if (rechuteOui && resteDeRechute > 0) projection += resteDeRechute * 5 * margeCouverture;
  if (depart) {
    projection += DEPART.recrutement + DEPART.vacance * 5 * (JOURNEE.interim - JOURNEE.salariee);
  }

  const coutTrimestre = coutCumule;
  const cout12Mois = coutTrimestre + projection;
  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: BUDGET - cout12Mois,
    coutTrimestre,
    projection,
    cout12Mois,
    tauxProjete: absencesP / JOURS_PLANNING,
    tauxMoyen: sommeTaux / SEMAINES,
    tauxFinal: (pleines[10]!.taux + pleines[11]!.taux + pleines[12]!.taux) / 3,
    rappelsTotal,
    interimTotal,
    arretsDos,
    aideAccordee: aide,
    poolComplet: d2 === 0 && poolComplet(graine),
    rechute: rechuteOui,
    conceicaoPart: depart,
    incidentAsh: ash,
    risqueDepart: risqueDeDepart(chemin),
    coutAnnuelDepart: COUT_ANNUEL_DEPART / 1000,
  };
}

/** Ce qui s'est passé pendant des semaines : arrêts pour le dos, rechute, départ, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    arretsDos: t.arretsDos.filter(dans),
    aide: chemin[D.causes] === 1 && dans(AIDE.semaine) ? t.aideAccordee : null,
    rechute: t.rechute && dans(RECHUTE_SEMAINE),
    departAnnonce: t.conceicaoPart && dans(DEPART.annonce),
    departEffectif: t.conceicaoPart && dans(DEPART.dernier + 1),
    incidentAsh: t.incidentAsh && dans(INCIDENT_ASH.semaine),
    poolRenfort: chemin[D.planning] === 0 && !poolComplet(graine) && dans(POOL.renfort),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEhpad {
  taux: number | null;
  coutCumule: number | null;
  budgetADate: number | null;
  rappels: number | null;
  courts: number | null;
  dos: number | null;
  interim: number | null;
  absences: number | null;
  arretsDos: number | null;
  aide: number | null;
}

/** Ce que Valère lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEhpad {
  if (semaine === 0) {
    return {
      taux: TAUX_DEPART,
      coutCumule: 0,
      budgetADate: 0,
      rappels: RAPPELS_DEPART,
      courts: PARTS.courts * ABSENCES_DEPART,
      dos: PARTS.dos * ABSENCES_DEPART,
      interim: MIX_DEPART.interim * ABSENCES_DEPART,
      absences: ABSENCES_DEPART,
      arretsDos: 0,
      aide: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    taux: s.taux,
    coutCumule: s.coutCumule,
    budgetADate: (BUDGET * semaine) / 52,
    rappels: s.rappels,
    courts: s.courts,
    dos: s.dos,
    interim: s.interim,
    absences: s.absences,
    arretsDos: t.arretsDos.filter((w) => w <= semaine).length,
    aide: chemin[D.causes] === 1 && semaine >= AIDE.semaine ? (t.aideAccordee ? 1 : 0) : null,
  };
}
