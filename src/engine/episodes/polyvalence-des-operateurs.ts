/**
 * LA LIGNE QUI S'ARRÊTE QUAND IL MANQUE QUELQU'UN — le modèle de la ligne 5 de Loudéac.
 *
 * L'atelier de conditionnement de la Laiterie de Kerbrélan, à Loudéac : six
 * lignes, vingt-deux conducteurs de ligne. La ligne 5 conditionne des yaourts
 * aromatisés en pots, pour la marque Kerbrélan et pour la MDD de Celtis, sur
 * une thermoformeuse qui forme les pots dans la bande, les remplit et les
 * opercule. Elle tourne en 3×8 du lundi au vendredi : trois postes, et trois
 * conducteurs seulement savent la régler — Yvonnick Gouriou le matin, Ursuline
 * Cloarec l'après-midi, Sidoine Toularastel la nuit. Yvonnick part à la retraite
 * fin juin. Janvier à mars, treize semaines, six décisions. Quatre mécanismes
 * font l'épisode, et le joueur doit les découvrir :
 *
 *   · UNE ABSENCE NON COUVERTE SE PAIE TOUT DE SUITE, ET LA DLC INTERDIT DE
 *     S'EN PROTÉGER PAR LE STOCK. Quand l'expert d'un poste manque, un
 *     conducteur d'une autre ligne fait tourner la 5 à mi-cadence sans toucher
 *     aux réglages, et la ligne s'arrête quand un changement de format tombe
 *     sur ce poste. Des yaourts à trente jours de DLC, que les enseignes veulent
 *     recevoir avec les deux tiers de leur vie, ne se fabriquent pas d'avance :
 *     l'heure perdue en mars est une rupture en mars, avec ses pénalités. En
 *     janvier, la ligne a du creux : elle absorbe les absences, et elle absorbe
 *     aussi ce que coûte une formation.
 *   · LE SAVOIR-FAIRE SE TRANSMET EN BINÔME, SUR LA LIGNE, EN SEMAINES. Un
 *     conducteur qui conduit déjà la 5 sans la régler devient autonome en une
 *     dizaine de semaines à côté d'un expert ; des standards visuels de réglage
 *     écrits avec la qualité raccourcissent l'apprentissage et réduisent les
 *     erreurs de tout le monde. Le binôme coûte du temps de ligne et un
 *     remplaçant sur la ligne d'origine du stagiaire : peu en janvier, cher en
 *     mars. Verrouiller les réglages aux trois experts « pour la qualité »
 *     protège du défaut d'aujourd'hui et fige la dépendance.
 *   · LES HEURES SUPPLÉMENTAIRES RÉPÉTÉES SE PAIENT PLUS TARD. Faire couvrir
 *     les absences par les deux experts présents rattrape la production tout
 *     de suite ; la fatigue monte, et revient en absences, en erreurs de
 *     réglage (un défaut de scellage, c'est un lot bloqué et détruit) et en
 *     risque de départ de Sidoine, que l'on sollicite ailleurs.
 *   · RECONNAÎTRE LA POLYVALENCE RETIENT ET MOTIVE. Un échelon de la
 *     classification pour qui tient deux lignes coûte chaque mois ; il retient
 *     les experts et garde les stagiaires en binôme. Une prime aux experts pour
 *     leurs heures récompense la dépendance, pas sa fin.
 *
 * L'OBJECTIF, EN EUROS, À LA SEMAINE 13. Ce que le trimestre a coûté — les
 * heures de rupture (marge sur coût variable perdue et pénalités logistiques),
 * les heures majorées, les mesures (remplaçants, intérim, standards, échelon),
 * les lots bloqués — MOINS rien d'autre, PLUS la valeur de la polyvalence
 * acquise pour le trimestre suivant, telle que les sources permettent de
 * l'estimer : au deuxième trimestre, les absences des trois experts coûteront
 * ce que coûtent leurs heures perdues au taux du printemps ; un premier
 * conducteur de plus capable de régler la ligne en couvre 88 %, un deuxième
 * 10 %. Un stagiaire encore en apprentissage compte pour la part du chemin
 * qu'il a faite, un conducteur non habilité pour 85 % de sa valeur. Le départ
 * de Sidoine, s'il arrive, se compte à ce qu'un départ a coûté l'an dernier,
 * moitié moins si la relève est prête. Au-delà de juin — la retraite
 * d'Yvonnick —, l'estimation deviendrait fragile : on ne compte rien.
 *
 * La sécurité des aliments n'est jamais un levier : un défaut de scellage est
 * toujours bloqué et détruit, et l'option qui met des conducteurs non habilités
 * seuls la nuit coûte ce qu'elle risque, un lot sorti de l'usine et rappelé.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un samedi de rattrapage décidé sans vous. */
export const PERTE_PAR_JOUR = 1400;

/* ---------------------------------------------------------------------------
 * LA LIGNE 5 : trois postes, trois experts, et ce que vaut une heure.
 * ------------------------------------------------------------------------- */
export const HEURES_POSTE = 40;
export const POSTES = 3;
export const HEURES_LIGNE = HEURES_POSTE * POSTES;
export const EXPERTS = 3;
export const CONDUCTEURS = 22;
/** Pots conditionnés par heure de ligne, TRS compris. */
export const CADENCE = 8000;
/** La marge sur coût variable d'un pot de yaourt aromatisé. */
export const MCV_POT = 0.08;
export const MARGE_HEURE = CADENCE * MCV_POT;
/** Les pénalités logistiques d'une heure de production manquante chez Celtis et Opaline. */
export const PENALITE_HEURE = 310;
/** Ce que coûte une heure de production qui manque à la commande : marge perdue et pénalités. */
export const COUT_RUPTURE_H = MARGE_HEURE + PENALITE_HEURE;
export const TAUX_SERVICE_EXIGE = 0.985;

/** Les heures de ligne que le plan demande : le creux de janvier, février, les promotions de mars. */
export const DEMANDE = { janvier: 102, fevrier: 110, mars: 117 } as const;
export const demande = (w: number) =>
  w <= 4 ? DEMANDE.janvier : w <= 8 ? DEMANDE.fevrier : DEMANDE.mars;

/* ---------------------------------------------------------------------------
 * LES ABSENCES DES EXPERTS, et ce qu'elles font perdre.
 * ------------------------------------------------------------------------- */
/** La part des heures planifiées des trois experts où ils ont manqué, l'hiver dernier. */
export const TAUX_ABSENCE_HIVER = 0.12;
export const TAUX_ABSENCE_PRINTEMPS = 0.08;
/** Chaque semaine, la chance qu'un expert manque ; il manque alors de 20 à 100 % de la semaine. */
export const P_ABSENCE = 0.2;
/** Sans conducteur qualifié : mi-cadence trois postes sur quatre, arrêt quand un changement de format tombe. */
export const MI_CADENCE = 0.5;
export const PART_ARRET = 0.25;
export const PART_PERDUE = (1 - PART_ARRET) * MI_CADENCE + PART_ARRET;
/** Sans changement de format sur le poste découvert, la ligne ne s'arrête plus : mi-cadence seulement. */
export const PART_PERDUE_ORGANISEE = MI_CADENCE;
/** Ce que la semaine 1 demande : les heures perdues en un trimestre d'hiver, au rythme des absences. */
export const HEURES_PERDUES_ATTENDUES =
  EXPERTS * HEURES_POSTE * SEMAINES * TAUX_ABSENCE_HIVER * PART_PERDUE;

/** La valeur, au deuxième trimestre, d'un conducteur de plus capable de régler la ligne. */
export const HEURES_PERDUES_PRINTEMPS =
  EXPERTS * HEURES_POSTE * SEMAINES * TAUX_ABSENCE_PRINTEMPS * PART_PERDUE;
export const COUT_ABSENCES_PRINTEMPS = HEURES_PERDUES_PRINTEMPS * COUT_RUPTURE_H;
export const COUVERTURE = [0.88, 0.1] as const;
export const VALEUR_RANG = COUVERTURE.map((c) => c * COUT_ABSENCES_PRINTEMPS);
/** Un conducteur formé mais non habilité ne sera pas mis seul sur un poste : 85 % de sa valeur. */
export const NON_HABILITE = 0.85;

/* ---------------------------------------------------------------------------
 * LA FORMATION EN BINÔME, les standards, la reconnaissance.
 * ------------------------------------------------------------------------- */
/** La part du chemin vers l'autonomie qu'un stagiaire fait par semaine de binôme. */
export const VITESSE = 0.1;
export const ACCELERATION_STANDARDS = 1.4;
/** Au poste, un stagiaire produit 37,5 % d'une heure au-dessous de 30 % du chemin, 100 % à l'autonomie. */
export const efficacite = (m: number) => Math.min(1, Math.max(0, (m - 0.3) / 0.7));
/** Tenir seul un poste entier, changements de format compris, ne s'apprend qu'au-delà de la moitié du chemin. */
export const efficaciteSeul = (m: number) => Math.min(1, Math.max(0, (m - 0.4) / 0.6));
/** La part de sa valeur qu'un stagiaire apporte au trimestre suivant, selon le chemin fait. */
export const pret = (m: number) => Math.min(1, Math.max(0, (m - 0.2) / 0.8));
/** Le remplaçant du stagiaire sur sa ligne d'origine : un opérateur intérimaire à mi-temps. */
export const REMPLACEMENT_BINOME = 560;
/** Quand le stagiaire tient seul un poste de la 5, il faut le remplacer à plein temps. */
export const REMPLACEMENT_RELAIS = 1120;
/** Les heures de ligne qu'un binôme coûte chaque semaine : explications, réglages refaits à deux. */
export const RALENTI_BINOME = 2.5;
export const STANDARDS = { cout: 2400, ralenti: 3 } as const;
/** L'échelon « conducteur polyvalent » : 95 € par mois, charges comprises 30 € par semaine. */
export const ECHELON = { mensuel: 95, semaine: 30, beneficiaires: 9 } as const;
export const PRIME_EXPERTS = { brut: 500, charge: 2175 } as const;

/* ---------------------------------------------------------------------------
 * LES HEURES SUPPLÉMENTAIRES, l'intérim, les lots bloqués, le départ.
 * ------------------------------------------------------------------------- */
/** Les heures de ligne que les experts peuvent rattraper par semaine : 44 h en moyenne sur douze semaines. */
export const HS_MAX = 12;
/** Pendant l'arrêt d'Ursuline : Yvonnick et Sidoine à 48 heures, le maximum légal d'une semaine. */
export const HS_ARRET = 16;
/** Pendant l'arrêt d'Ursuline, des yaourts MDD fabriqués sur une ligne de Pontivy : heures et surcoût. */
export const TRANSFERT = { heures: 7, coutHeure: 260 } as const;
/** Une heure de ligne rattrapée : deux personnes en heures majorées, et le démarrage du samedi. */
export const COUT_RATTRAPAGE_H = 180;
/** Ouvrir la ligne un samedi : nettoyage en place, énergie, un cariste et un laborantin. */
export const COUT_SAMEDI = 1500;
export const FATIGUE_DEPART = 0.4;
export const INTERIM = { semaine: 1900, chance: 0.5, arrivee: 4, rendement: 0.6 } as const;
export const COUT_LOT = 14000;
/** Un lot refait : les heures de ligne perdues. */
export const REPRISE_H = 5;
export const COUT_RETRAIT = 38000;
export const COUT_DEPART = 55000;
export const HABILITATION = 1200;
export const RECRUTEMENT = { cabinet: 6500, chance: 0.45, valeur: 0.12 } as const;
export const DECLASSEMENT_SEMAINE = 1300;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  standards: 1,
  reconnaissance: 2,
  arret: 3,
  heures: 4,
  releve: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 1, 3, 3, 3] as const;
/** La semaine où chaque décision commence à agir. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;

/** Les options, par leur sens. */
export const O = {
  plan: { heuresSup: 0, binomes: 1, interim: 2, attendre: 3 },
  standards: { ecrire: 0, cahier: 1, verrouiller: 2, rien: 3 },
  reconnaissance: { prime: 0, nao: 1, echelon: 2 },
  arret: { binome: 0, heuresSup: 1, organiser: 2, laisser: 3 },
  heures: { samedis: 0, organiser: 1, series: 2, rien: 3 },
  releve: { habiliter: 0, recruter: 1, nuit: 2, rien: 3 },
} as const;

/** Les deux stagiaires que la matrice désigne : Arthaud, de la ligne 4, avec Yvonnick ; Zainab, de la 6, avec Ursuline. */
export const TUTEURS = [0, 1] as const;
/** Le risque qu'un stagiaire quitte le binôme en fin de semaine 5, selon la reconnaissance. */
export const ABANDON = [
  [0.25, 0.45],
  [0.2, 0.4],
  [0.05, 0.1],
] as const;

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
  effet: { absence?: number; capacite?: number; demande?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Service de santé au travail",
    role: "Usine de Loudéac",
    texte:
      "L'épidémie de grippe atteint l'usine : une vingtaine d'arrêts sur deux semaines, dans tous les ateliers. Les experts de la ligne 5 n'y échappent pas plus que les autres.",
    duree: 2,
    effet: { absence: 0.25 },
  },
  {
    id: "tempete",
    titre: "Tempête sur le centre Bretagne",
    de: "Maixent Le Rhun",
    role: "Chef d'équipe du matin, conditionnement",
    texte:
      "Tempête dans la nuit de mardi : routes coupées, arbres sur la départementale. L'équipe de nuit n'a pas pu venir, et celle du matin est arrivée à 9 heures. Dix heures de ligne perdues.",
    duree: 1,
    effet: { capacite: 10 },
  },
  {
    id: "film",
    titre: "Film d'operculage non conforme",
    de: "Annaïg Le Dantec",
    role: "Responsable qualité",
    texte:
      "Le lot de film d'operculage livré lundi ne scelle pas à la température habituelle : bloqué à réception. Sept heures d'arrêt le temps que le fournisseur en livre un autre.",
    duree: 1,
    effet: { capacite: 7 },
  },
  {
    id: "panne",
    titre: "Panne de la station de scellage",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Une résistance de la station de scellage de la thermoformeuse a lâché. Six heures d'arrêt pour la changer et requalifier le scellage avec la qualité.",
    duree: 1,
    effet: { capacite: 6 },
  },
  {
    id: "celtis",
    titre: "Promotion avancée par Celtis",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Celtis avance d'une semaine sa promotion sur les yaourts aromatisés : huit heures de ligne de plus à produire cette semaine, sans possibilité de les faire d'avance.",
    duree: 1,
    effet: { demande: 8 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Expert par expert, semaine par semaine (indice 0 vide) : manque-t-il, et combien. */
  absence: readonly (readonly number[])[];
  duree: readonly (readonly number[])[];
  /** Le tirage d'un défaut de réglage, semaine par semaine. */
  erreur: readonly number[];
  /** La facilité d'apprendre d'Arthaud et de Zainab. */
  aptitude: readonly number[];
  abandon: readonly number[];
  uInterim: number;
  uDepart: number;
  uFuite: number;
  uRecrue: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001107 + 7);
  const absence: number[][] = [];
  const duree: number[][] = [];
  for (let e = 0; e < EXPERTS; e += 1) {
    const a = [1];
    const d = [0];
    for (let w = 1; w <= SEMAINES; w += 1) {
      a.push(r());
      d.push(r());
    }
    absence.push(a);
    duree.push(d);
  }
  const erreur = [1];
  for (let w = 1; w <= SEMAINES; w += 1) erreur.push(r());
  const aptitude = [0.8 + 0.4 * r(), 0.8 + 0.4 * r()];
  const abandon = [r(), r()];
  const uInterim = r();
  const uDepart = r();
  const uFuite = r();
  const uRecrue = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    absence,
    duree,
    erreur,
    aptitude,
    abandon,
    uInterim,
    uDepart,
    uFuite,
    uRecrue,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** L'agence trouve-t-elle un conducteur « qui connaît les thermoformeuses » ? Une fois sur deux. */
export const interimTrouve = (graine: number) => hasard(graine).uInterim < INTERIM.chance;

/** Le risque que Sidoine parte, lu sur la fatigue des experts en fin de semaine 10. */
export const risqueDeDepart = (fatigue: number, reconnaissance: number) =>
  borne(0.06 + 1.2 * Math.max(0, fatigue - FATIGUE_DEPART), 0, 0.6) *
  ([0.8, 1, 0.45][reconnaissance] ?? 1);

/** La chance, chaque semaine, d'un défaut de réglage qui fait bloquer un lot. */
export function risqueDErreur(x: {
  fatigue: number;
  standards: number;
  /** Les heures tenues seules par chaque stagiaire, et leur chemin fait. */
  stagiaires: readonly { heures: number; m: number; nuit?: boolean; entier?: boolean }[];
  interim: number;
  decouvert: number;
  facteur: number;
}) {
  const std = [0.5, 0.85, 0.7, 1][x.standards] ?? 1;
  const stdStagiaire = [0.5, 0.85, 0, 1][x.standards] ?? 1;
  let p = 0.025 * (1 + 4 * Math.max(0, x.fatigue - FATIGUE_DEPART)) * std;
  for (const s of x.stagiaires) {
    p +=
      (s.heures / HEURES_POSTE) *
      0.45 *
      Math.max(0, 1.15 - s.m) *
      stdStagiaire *
      (s.nuit ? 1.5 : 1) *
      (s.entier ? 1.3 : 1);
  }
  p += (x.interim / HEURES_POSTE) * 0.15 * std;
  p += (x.decouvert / HEURES_POSTE) * 0.04;
  return Math.min(0.6, p * x.facteur);
}

export type Semaine = {
  /** Heures de production perdues faute de conducteur qualifié, cette semaine. */
  perdues: number;
  /** Les mêmes, depuis le début du trimestre. */
  perduesCumul: number;
  /** Heures de ligne manquant à la commande : la rupture. */
  rupture: number;
  service: number;
  /** Heures de ligne rattrapées en heures supplémentaires par les experts, depuis le début. */
  heuresSup: number;
  fatigue: number;
  /** Le chemin fait vers l'autonomie par chacun des deux stagiaires (0 s'il n'y en a pas). */
  m1: number;
  m2: number;
  /** Conducteurs capables de régler la ligne : les experts présents, plus la part autonome des stagiaires. */
  qualifies: number;
  /** Ce que la semaine a coûté, et ce que le trimestre a coûté jusqu'ici. */
  cout: number;
  coutCumul: number;
  lot: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur de la polyvalence acquise, moins ce que le trimestre a coûté. */
  objectif: number;
  valeur: number;
  coutRuptures: number;
  coutHeuresSup: number;
  coutMesures: number;
  coutLots: number;
  perdues: number;
  rupture: number;
  serviceMoyen: number;
  heuresSup: number;
  fatigueFinale: number;
  /** Les semaines où un lot a été bloqué. */
  lots: readonly number[];
  retrait: number | null;
  kilianPart: boolean;
  /** Les stagiaires qui ont quitté le binôme en fin de semaine 5. */
  abandons: readonly number[];
  /** La semaine où chaque stagiaire est devenu autonome, ou `null`. */
  autonomie: readonly (number | null)[];
  mFinal: readonly number[];
  interimDemande: boolean;
  interim: boolean;
  recrutementLance: boolean;
  recrue: boolean;
  /** Les conducteurs capables de régler la ligne en fin de trimestre. */
  qualifiesFinal: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as [number, number, number, number, number, number];
  const binomes = d1 === O.plan.binomes;
  const interim = d1 === O.plan.interim && interimTrouve(graine);
  const semaines: (Semaine | null)[] = [null];

  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let coutRuptures = 0;
  let coutHeuresSup = perte;
  let coutMesures = 0;
  let coutLots = 0;
  let coutCumul = perte;
  let perduesCumul = 0;
  let ruptureCumul = 0;
  let heuresSup = 0;
  let fatigue = FATIGUE_DEPART;
  let kilianPart = false;
  let retrait: number | null = null;
  const m = binomes ? [0, 0] : [];
  const parti = [false, false];
  const abandons: number[] = [];
  const autonomie: (number | null)[] = binomes ? [null, null] : [];
  const lots: number[] = [];
  let sommeService = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? perte : 0;
    let mesures = 0;

    // Qui manque, poste par poste : le matin d'Yvonnick, l'après-midi d'Ursuline, la nuit de Sidoine.
    let grippe = 0;
    for (const a of actifs) grippe += a.imprevu.effet.absence ?? 0;
    const p = P_ABSENCE * (1 + 1.5 * Math.max(0, fatigue - FATIGUE_DEPART)) + grippe;
    const absent = [0, 1, 2].map((e) => {
      if (e === 1 && w >= 7 && w <= 9) return 1; // Ursuline, opérée du genou.
      if (e === 2 && kilianPart && w >= 12) return 1; // Sidoine parti.
      return h.absence[e]![w]! < p ? 0.2 + 0.8 * h.duree[e]![w]! : 0;
    });

    // Les stagiaires disponibles, et le chemin qu'ils ont fait.
    const actifsStagiaires = binomes ? [0, 1].filter((k) => !parti[k]) : [];
    const rendement = (k: number) => {
      const e = efficacite(m[k]!) * (d2 === O.standards.verrouiller ? 0.75 : 1);
      return 1 - PART_PERDUE * (1 - e);
    };
    // Tenir seul un poste trois semaines, avec tous ses changements de format, demande plus.
    const rendementSeul = (k: number) => {
      const e = efficaciteSeul(m[k]!) * (d2 === O.standards.verrouiller ? 0.75 : 1);
      return 1 - PART_PERDUE * (1 - e);
    };

    // Les postes découverts, et qui les tient.
    interface Trou {
      poste: number;
      heures: number;
      organise: boolean;
    }
    const trous: Trou[] = absent
      .map((a, e) => ({
        poste: e,
        heures: HEURES_POSTE * a,
        organise:
          (e === 1 && w >= 7 && w <= 9 && d4 === O.arret.organiser) ||
          (w >= 9 && (d5 === O.heures.organiser || d5 === O.heures.series)),
      }))
      .filter((t) => t.heures > 0)
      .sort((a, b) => b.heures - a.heures);
    const tenus = new Map<number, number>(); // stagiaire → heures tenues seul
    let posteEntier = false;
    const libres = [...actifsStagiaires].sort((a, b) => m[b]! - m[a]!);
    let heuresInterim = 0;
    let decouvertNonOrganise = 0;
    let perdues = 0;
    let rattrapable: { heures: number; part: number }[] = [];
    // Pendant l'arrêt d'Ursuline, l'option choisie tient son poste d'abord.
    const nuitParStagiaire = d6 === O.releve.nuit && w >= 11 && libres.length > 0;
    let kilianLibre = false;
    if (nuitParStagiaire) {
      // Le stagiaire le plus avancé prend la nuit, seul ; Sidoine, s'il est là, couvre les absences.
      const k = libres.shift()!;
      const heuresKilian = HEURES_POSTE * (1 - absent[2]!);
      tenus.set(k, (tenus.get(k) ?? 0) + HEURES_POSTE);
      perdues += HEURES_POSTE * (1 - rendement(k));
      const iKilian = trous.findIndex((t) => t.poste === 2);
      if (iKilian >= 0) trous.splice(iKilian, 1);
      kilianLibre = heuresKilian > 0;
    }
    for (const t of trous) {
      let qui: "stagiaire" | "interim" | "kilian" | null = null;
      if (t.poste === 1 && w >= 7 && w <= 9) {
        if (d4 === O.arret.binome && libres.length) qui = "stagiaire";
      } else if (kilianLibre) {
        qui = "kilian";
      } else if (libres.length && efficacite(m[libres[0]!]!) > 0) {
        qui = "stagiaire";
      } else if (interim && w >= INTERIM.arrivee && heuresInterim === 0) {
        qui = "interim";
      }
      if (qui === "kilian") {
        kilianLibre = false;
      } else if (qui === "stagiaire") {
        const k = libres.shift()!;
        const entier = t.poste === 1 && w >= 7 && w <= 9;
        if (entier) posteEntier = true;
        tenus.set(k, (tenus.get(k) ?? 0) + t.heures);
        perdues += t.heures * (1 - (entier ? rendementSeul(k) : rendement(k)));
      } else if (qui === "interim") {
        heuresInterim += t.heures;
        const e = w === INTERIM.arrivee ? 0.3 : INTERIM.rendement;
        perdues += t.heures * PART_PERDUE * (1 - e);
      } else {
        const part = t.organise ? PART_PERDUE_ORGANISEE : PART_PERDUE;
        if (!t.organise) decouvertNonOrganise += t.heures;
        rattrapable.push({ heures: t.heures, part });
      }
    }

    // Les heures supplémentaires : les experts présents rattrapent ce qui reste découvert.
    const hsActives =
      w >= 9
        ? d5 === O.heures.samedis ||
          (d1 === O.plan.heuresSup && (d5 === O.heures.series || d5 === O.heures.rien))
        : d1 === O.plan.heuresSup && w >= 2;
    let plafond = hsActives ? HS_MAX : 0;
    if (d4 === O.arret.heuresSup && w >= 7 && w <= 9) plafond += HS_ARRET;
    let rattrape = 0;
    rattrapable = rattrapable.sort((a, b) => b.part - a.part);
    for (const r of rattrapable) {
      const x = Math.min(r.heures, plafond - rattrape);
      rattrape += x;
      perdues += (r.heures - x) * r.part;
    }
    heuresSup += rattrape;
    // Au-delà de six heures, il faut ouvrir la ligne le samedi : nettoyage, énergie, cariste, laboratoire.
    // Les samedis planifiés de la semaine 9 s'ouvrent chaque semaine, qu'il y ait beaucoup à rattraper ou non.
    const samedi = rattrape > 6 || (d5 === O.heures.samedis && w >= 9);
    const coutHs = rattrape * COUT_RATTRAPAGE_H + (samedi ? COUT_SAMEDI : 0);
    coutHeuresSup += coutHs;
    cout += coutHs;
    perduesCumul += perdues;

    // Le défaut de réglage de la semaine, s'il tombe.
    const stagiairesSeuls = [...tenus.entries()].map(([k, heures]) => ({
      heures,
      m: m[k]!,
      nuit: nuitParStagiaire,
      entier: posteEntier,
    }));
    let facteur = 1;
    if (w >= 9 && d5 === O.heures.organiser) facteur *= 0.8;
    if (w >= 9 && d5 === O.heures.series) facteur *= 0.6;
    if (w >= 11 && d6 === O.releve.habiliter) facteur *= 0.85;
    const pErreur = risqueDErreur({
      fatigue,
      standards: w >= 4 ? d2 : O.standards.rien,
      stagiaires: stagiairesSeuls,
      interim: heuresInterim,
      decouvert: decouvertNonOrganise,
      facteur,
    });
    const lot = h.erreur[w]! < pErreur ? 1 : 0;
    if (lot) {
      lots.push(w);
      coutLots += COUT_LOT;
      cout += COUT_LOT;
      if (nuitParStagiaire && h.uFuite < 0.3 && retrait === null) {
        retrait = w;
        coutLots += COUT_RETRAIT;
        cout += COUT_RETRAIT;
      }
    }

    // Ce que la formation et les mesures prennent à la ligne cette semaine.
    let ralenti = 0;
    const enBinome = actifsStagiaires.filter((k) => !tenus.has(k) && m[k]! < 1 && w >= 2);
    ralenti += enBinome.length * RALENTI_BINOME;
    if (d2 === O.standards.ecrire && w >= 3 && w <= 6) ralenti += STANDARDS.ralenti;
    if (d6 === O.releve.habiliter && (w === 11 || w === 12)) ralenti += 2 * actifsStagiaires.length;
    if (interim && (w === INTERIM.arrivee || w === INTERIM.arrivee + 1)) ralenti += 3;
    for (const a of actifs) ralenti += a.imprevu.effet.capacite ?? 0;

    // La rupture : ce que la ligne n'a pas fait de ce que le plan demandait. Pas de stock d'avance.
    let besoin = demande(w);
    for (const a of actifs) besoin += a.imprevu.effet.demande ?? 0;
    const transfert = d4 === O.arret.organiser && w >= 7 && w <= 9 ? TRANSFERT.heures : 0;
    const capacite = HEURES_LIGNE - perdues - ralenti - lot * REPRISE_H + transfert;
    const rupture = Math.max(0, besoin - capacite);
    ruptureCumul += rupture;
    const service = 1 - rupture / besoin;
    sommeService += service;
    coutRuptures += rupture * COUT_RUPTURE_H;
    cout += rupture * COUT_RUPTURE_H;

    // Les mesures.
    if (binomes && w >= 2) {
      for (const k of actifsStagiaires) {
        if (tenus.has(k))
          mesures += REMPLACEMENT_RELAIS * Math.min(1, tenus.get(k)! / HEURES_POSTE);
        else if (m[k]! < 1) mesures += REMPLACEMENT_BINOME;
      }
    }
    if (interim && w >= INTERIM.arrivee) mesures += INTERIM.semaine;
    if (d4 === O.arret.organiser && w >= 7 && w <= 9)
      mesures += TRANSFERT.heures * TRANSFERT.coutHeure;
    if (d2 === O.standards.ecrire && w === 3) mesures += STANDARDS.cout;
    if (d3 === O.reconnaissance.echelon && w >= 5) {
      const nouveaux = actifsStagiaires.filter((k) => m[k]! >= 1).length;
      mesures += (ECHELON.beneficiaires + nouveaux) * ECHELON.semaine;
    }
    if (d3 === O.reconnaissance.prime && w === 5) mesures += PRIME_EXPERTS.charge;
    if (d5 === O.heures.series && w >= 9) mesures += DECLASSEMENT_SEMAINE;
    if (d6 === O.releve.habiliter && w === 11) mesures += HABILITATION * actifsStagiaires.length;
    if (d6 === O.releve.recruter && w === 11) mesures += RECRUTEMENT.cabinet;
    coutMesures += mesures;
    cout += mesures;
    coutCumul += cout;

    // Les stagiaires avancent : à côté de leur tuteur, ou seuls au poste.
    if (binomes && w >= 2) {
      let vitesse = VITESSE;
      if (w >= 3) {
        vitesse *=
          d2 === O.standards.ecrire
            ? w === 3
              ? 1.15
              : ACCELERATION_STANDARDS
            : d2 === O.standards.cahier
              ? 1.1
              : d2 === O.standards.verrouiller
                ? 0.75
                : 1;
      }
      if (w >= 5) vitesse *= [0.9, 0.95, 1.15][d3] ?? 1;
      if (w >= 9 && d5 === O.heures.organiser) vitesse *= 1.2;
      vitesse *= 1 - 0.4 * Math.max(0, fatigue - FATIGUE_DEPART);
      for (const k of actifsStagiaires) {
        if (m[k]! >= 1.3) continue;
        const v = vitesse * h.aptitude[k]!;
        const tuteur = TUTEURS[k]!;
        m[k] = tenus.has(k) ? m[k]! + v * 0.7 : m[k]! + v * (1 - 0.5 * absent[tuteur]!);
        if (m[k]! >= 1 && autonomie[k] === null) autonomie[k] = w;
      }
    }

    // La fatigue des experts : les heures rattrapées, et le repos.
    const presents = Math.max(
      1,
      absent.reduce((s, a) => s + (1 - a), 0),
    );
    fatigue += 0.007 * (rattrape / presents) - 0.015;
    if (w >= 9 && d5 === O.heures.organiser) fatigue -= 0.02;
    fatigue = borne(fatigue, 0, 1);

    // Fin de semaine 5 : un stagiaire peu reconnu retourne sur sa ligne.
    if (binomes && w === 5) {
      for (const k of [0, 1]) {
        if (h.abandon[k]! < (ABANDON[d3]?.[k] ?? 0)) {
          parti[k] = true;
          abandons.push(k);
        }
      }
    }
    // Fin de semaine 10 : Sidoine, sollicité ailleurs, décide.
    if (w === 10 && h.uDepart < risqueDeDepart(fatigue, d3)) kilianPart = true;

    const qualifiesSemaine =
      EXPERTS -
      (kilianPart && w >= 12 ? 1 : 0) +
      actifsStagiaires.reduce((s, k) => s + efficacite(m[k]!), 0);
    semaines.push({
      perdues,
      perduesCumul,
      rupture,
      service,
      heuresSup,
      fatigue,
      m1: binomes ? m[0]! : 0,
      m2: binomes ? m[1]! : 0,
      qualifies: qualifiesSemaine,
      cout,
      coutCumul,
      lot,
    });
  }

  // La valeur de la polyvalence acquise, au deuxième trimestre.
  const restants = binomes ? [0, 1].filter((k) => !parti[k]) : [];
  const parValeur = restants.map((k) => m[k]!).sort((a, b) => b - a);
  const habilite = d6 === O.releve.habiliter ? 1 : NON_HABILITE;
  let valeur = parValeur.reduce((s, x, i) => s + (VALEUR_RANG[i] ?? 0) * pret(x) * habilite, 0);
  const releve = Math.min(
    1,
    parValeur.reduce((s, x) => s + efficacite(x), 0),
  );
  if (kilianPart) valeur -= COUT_DEPART * (1 - 0.5 * releve);
  if (d3 === O.reconnaissance.echelon) {
    const nouveaux = parValeur.filter((x) => x >= 1).length;
    valeur -= (ECHELON.beneficiaires + nouveaux) * ECHELON.semaine * SEMAINES;
  }
  const recrue = d6 === O.releve.recruter && h.uRecrue < RECRUTEMENT.chance;
  if (recrue) valeur += RECRUTEMENT.valeur * (VALEUR_RANG[0] ?? 0);

  const s13 = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: valeur - coutRuptures - coutHeuresSup - coutMesures - coutLots,
    valeur,
    coutRuptures,
    coutHeuresSup,
    coutMesures,
    coutLots,
    perdues: perduesCumul,
    rupture: ruptureCumul,
    serviceMoyen: sommeService / SEMAINES,
    heuresSup,
    fatigueFinale: fatigue,
    lots,
    retrait,
    kilianPart,
    abandons,
    autonomie,
    mFinal: binomes ? [m[0]!, m[1]!] : [],
    interimDemande: d1 === O.plan.interim,
    interim,
    recrutementLance: d6 === O.releve.recruter,
    recrue,
    qualifiesFinal: s13.qualifies,
  };
}

/** Ce qui s'est passé pendant des semaines : lots, départ, abandons, autonomies, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    lots: t.lots.filter(dans),
    retrait: t.retrait !== null && dans(t.retrait) ? t.retrait : null,
    kilianPart: t.kilianPart && dans(11),
    abandons: dans(6) ? t.abandons : [],
    autonomies: t.autonomie
      .map((w, k) => ({ k, w }))
      .filter((x): x is { k: number; w: number } => x.w !== null && dans(x.w + 1)),
    interim: t.interim && dans(INTERIM.arrivee),
    retourGwenola: dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePolyvalence {
  perduesCumul: number | null;
  service: number | null;
  heuresSup: number | null;
  qualifies: number | null;
  coutCumul: number | null;
  /** Les clés suivantes ne sont pas affichées : elles nourrissent les messages et les sources. */
  progression: number | null;
  m1: number | null;
  m2: number | null;
  fatigue: number | null;
  lots: number | null;
  /** 1 si le stagiaire a quitté son binôme. */
  abandon1: number | null;
  abandon2: number | null;
  semaine: number | null;
}

/** Ce qu'Erwann lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePolyvalence {
  if (semaine === 0) {
    return {
      perduesCumul: 0,
      service: 0.976,
      heuresSup: 0,
      qualifies: EXPERTS,
      coutCumul: 0,
      progression: 0,
      m1: 0,
      m2: 0,
      fatigue: FATIGUE_DEPART,
      lots: 0,
      abandon1: 0,
      abandon2: 0,
      semaine: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    perduesCumul: s.perduesCumul,
    service: s.service,
    heuresSup: s.heuresSup,
    qualifies: s.qualifies,
    coutCumul: s.coutCumul,
    progression: (Math.min(1, s.m1) + Math.min(1, s.m2)) / 2,
    m1: s.m1,
    m2: s.m2,
    fatigue: s.fatigue,
    lots: t.lots.filter((w) => w <= semaine).length,
    abandon1: semaine >= 5 && t.abandons.includes(0) ? 1 : 0,
    abandon2: semaine >= 5 && t.abandons.includes(1) ? 1 : 0,
    semaine,
  };
}
