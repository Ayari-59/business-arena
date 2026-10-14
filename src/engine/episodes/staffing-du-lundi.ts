/**
 * LE STAFFING DU LUNDI — le modèle du bureau de Nantes d'Atlas Conseil.
 *
 * Soixante consultants, treize semaines de septembre à novembre, six
 * décisions. Chaque lundi, Aïssatou Ndour affecte les consultants aux missions
 * qui démarrent, et chaque associé veut les meilleurs pour la sienne. Le temps
 * d'un consultant ne se stocke pas : une journée non facturée est perdue, et
 * une journée mal placée coûte ailleurs. Quatre mécanismes font l'épisode, et
 * le joueur doit les découvrir :
 *
 *   · LE COÛT D'OPPORTUNITÉ D'UN SENIOR. Un senior sur une mission simple en
 *     régie facture 250 € de plus par jour qu'un confirmé ; le même senior aux
 *     commandes d'un forfait critique évite des dépassements (3 % des jours au
 *     lieu de 22 %) et un comité de pilotage de crise. Sa valeur se lit sur ce
 *     qu'il évite là où le risque est, pas sur son TJM.
 *   · LE JUNIOR SEUL DÉRAPE, LE BINÔME LE FAIT GRANDIR. Un analyste placé seul
 *     est facturé à plein sur le papier ; il dépasse, et une fois sur trois le
 *     client se plaint. En binôme avec un confirmé (une demi-journée
 *     d'encadrement par semaine), il démarre plus lentement, puis devient
 *     productif et autonome : en novembre, il peut tenir une mission.
 *   · L'INTERCONTRAT VAUT CE QU'ON EN FAIT. Le creux d'octobre est
 *     inévitable. Le remplir avec la première mission venue (une
 *     sous-traitance à 450 € par jour, ferme jusqu'à fin novembre) rapporte
 *     un peu en octobre et bloque les consultants pendant le rush de novembre ;
 *     l'employer à l'avant-vente relève le taux de transformation des
 *     propositions, la formation renforce les dossiers.
 *   · LES RÉSERVATIONS FANTÔMES. Les associés réservent des consultants « au
 *     cas où » dans Tempora : le plan de charge paraît plein (91 % en
 *     octobre) alors que le bureau est sous sa cible, et une mission signée ne
 *     trouve personne. Une réservation sans proposition remise se vérifie,
 *     puis se lève.
 *
 * L'OBJECTIF, en euros : la marge des missions du bureau sur le trimestre
 * (honoraires reconnus, moins la masse salariale des soixante consultants,
 * les dépassements valorisés au coût journalier, les achats d'indépendants,
 * les avoirs et les pénalités), plus la valeur des propositions gagnées
 * pendant le trimestre : la marge prévue des missions signées (35 % de leur
 * montant), et celle de la tranche optionnelle du centre hospitalier si elle
 * est affermie.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CONSULTANTS = 60;
/** Les jours de consultant disponibles par semaine : 60 × 5, moins 15 jours de congés en moyenne. */
export const DISPONIBLES_SEMAINE = 285;
export const OBJECTIF_OCCUPATION = 0.75;

/** Les TJM du bureau, par grade. */
export const TJM = { senior: 1100, confirme: 850, analyste: 650 } as const;
/** Le coût journalier chargé, par grade : le salaire et les charges d'un jour ouvré. */
export const COUT_JOUR = { senior: 560, confirme: 400, analyste: 300 } as const;
/** Le contrôle de gestion valorise un jour de dépassement au coût journalier moyen. */
export const COUT_JOUR_MOYEN = 400;

/* ---------------------------------------------------------------------------
 * LE BUREAU : ce que les autres missions rapportent, et ce que coûtent les salaires.
 * ------------------------------------------------------------------------- */
/** Les honoraires hebdomadaires des missions qui ne passent pas par les décisions. */
export const HONORAIRES_AUTRES = 109000;
/** La masse salariale des soixante consultants, par semaine (1,32 M€ sur le trimestre). */
export const MASSE_SALARIALE = 101500;
/** Les jours factures chaque semaine sur ces autres missions. */
export const JOURS_AUTRES = 149;
/** La saison du conseil : la rentrée, le creux d'octobre, le rush de fin d'année des clients privés. */
export const saison = (w: number) => (w <= 5 ? 1 : w <= 9 ? 0.93 : 1.05);

/**
 * LE PLAN DE CHARGE D'OCTOBRE (semaines 6 à 9, du 5 au 30 octobre), tel que
 * Tempora le montre le lundi de la semaine 1.
 */
export const OCTOBRE = {
  joursOuvres: 20,
  conges: 60,
  /** Jours staffés sur des missions signées. */
  signes: 786,
  /** Jours staffés sur des propositions remises, en phase finale. */
  propositions: 72,
  /** Le taux de transformation habituel de ces propositions. */
  transformation: 0.5,
  /** Jours réservés « par précaution », sans proposition remise. */
  precaution: 180,
} as const;
export const DISPONIBLES_OCTOBRE = CONSULTANTS * OCTOBRE.joursOuvres - OCTOBRE.conges;
/** Ce que Tempora affiche : tout ce qui est réservé, comme si c'était vendu. */
export const OCCUPATION_TEMPORA =
  (OCTOBRE.signes + OCTOBRE.propositions + OCTOBRE.precaution) / DISPONIBLES_OCTOBRE;
/** Le taux d'occupation prévisible : le signé, plus les propositions à leur taux de transformation. */
export const OCCUPATION_PREVUE =
  (OCTOBRE.signes + OCTOBRE.propositions * OCTOBRE.transformation) / DISPONIBLES_OCTOBRE;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les missions de la rentrée démarrent sans équipe arrêtée. */
export const PERTE_PAR_JOUR = 2500;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  rentree: 0,
  reservation: 1,
  intercontrat: 2,
  junior: 3,
  avenant: 4,
  restitution: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 3, 0, 0, 0] as const;

/** Le forfait critique : la réorganisation des blocs opératoires du centre hospitalier de l'Estuaire. */
export const CH = {
  prix: 260000,
  /** Quatre consultants à temps plein : 260 jours prévus sur treize semaines. */
  joursSemaine: 20,
  /** Les dépassements, en part des jours prévus, selon qui pilote. */
  derive: { senior: 0.03, confirme: 0.22 },
  /** Le comité de pilotage de la semaine 7 tourne-t-il à la crise ? */
  copil: 7,
  crise: { senior: 0.08, confirme: 0.5 },
  /** Les jours de reprise et la pénalité d'un comité de crise. */
  coutCrise: 18000,
  /** La pénalité de retard du marché : 1 % du prix par semaine. */
  penaliteRetard: 0.01,
} as const;

/** La régie de Distrimer : un diagnostic des achats, deux personnes, semaines 1 à 8, puis une suite en novembre. */
export const DISTRIMER = { de: 1, a: 8, suiteDe: 10, suiteA: 13 } as const;

/** Les huit analystes arrivés en septembre. */
export const JUNIORS = {
  nombre: 8,
  /** La part de leurs jours facturée, en binôme : lente au début, puis pleine. */
  binome: { debut: 0.6, milieu: 0.85, fin: 0.95 },
  /** Seuls, ils sont factures à 80 % dès la première semaine… */
  seul: 0.8,
  /** … mais dépassent d'un jour par semaine, que quelqu'un reprend. */
  depassementSeul: 1,
  /** Une fois sur trois sur le trimestre, le client d'un junior seul se plaint. */
  risqueIncident: 0.3,
  /** L'avoir et la reprise par un confirmé. */
  coutIncident: 6000,
  /** L'encadrement d'un binôme : une demi-journée de confirmé par semaine, un quart en novembre. */
  encadrement: 0.5,
  /** Deux semaines chez Atlas Formation avant d'être staffés. */
  formation: { semaines: 2, cout: 4000 },
} as const;

/** La mission signée de la Coopérative laitière du Bocage : trois confirmés, semaines 4 à 12. */
export const COOP = { de: 4, a: 12, consultants: 3, achatIndependant: 650 } as const;
/** Une fois sur deux, la coopérative refuse d'attendre et signe avec Kéroual Consulting. */
export const CHANCE_COOP_PART = 0.5;
/**
 * Le prospect d'Assurances Ligériennes pour lequel trois confirmés sont réservés : trois fois
 * sur dix il signe, et démarre en semaine 7 ; son programme de données vaut 160 000 € sur trois
 * ans, à 35 % de marge prévue.
 */
export const PROSPECT = { chance: 0.3, de: 7, a: 13, montant: 160000 } as const;

/** La sous-traitance proposée par Halden Partners : ferme, semaines 6 à 13. */
export const HALDEN = { consultants: 4, tjm: 450, de: 6, a: 13 } as const;
/** En novembre, ces quatre consultants seraient factures sur le rush à 750 € par jour en moyenne. */
export const TJM_RUSH = 750;
export const NOVEMBRE = 10;
/** Les missions gagnées démarrent avec des indépendants quand l'équipe est prise ailleurs. */
export const DECOTE_SANS_EQUIPE = 0.85;

/** La marge prévue d'une mission de conseil signée, en part de son montant. */
export const TAUX_MARGE_MISSION = 0.35;
/** Le pipeline : les trois propositions qui se décident en semaines 9 à 11. */
export const PROPOSITIONS = [
  {
    id: "achats",
    client: "Achats Publics de l'Ouest",
    objet: "l'accord-cadre d'organisation des achats hospitaliers",
    montant: 180000,
    semaine: 9,
    chance: 0.3,
  },
  {
    id: "mutuelle",
    client: "Mutuelle des Marais",
    objet: "la refonte du pilotage des données de gestion",
    montant: 120000,
    semaine: 10,
    chance: 0.35,
  },
  {
    id: "fonderies",
    client: "Fonderies de la Sèvre",
    objet: "la supply chain du site de Cholet",
    montant: 90000,
    semaine: 11,
    chance: 0.4,
  },
] as const;
/** L'avant-vente des consultants en intercontrat : pré-diagnostic, mémoire technique, soutenance. */
export const GAIN_AVANT_VENTE = 0.2;
/** La certification de l'équipe proposée compte dans la note technique du marché public. */
export const GAIN_CERTIFICATION = 0.1;
/** La formation de l'intercontrat, en facturation de novembre. */
export const GAIN_FORMATION = { analystes: 325, tous: 750 } as const;

/** Le forfait de la communauté d'agglomération du Pays de Retz : semaines 7 à 13. */
export const RETZ = {
  prix: 42000,
  de: 7,
  a: 13,
  /** Seul, le junior dérape six fois sur dix… */
  risque: 0.6,
  /** … moins s'il a passé septembre en binôme, ou en formation. */
  baisseBinome: 0.2,
  baisseFormation: 0.15,
  risqueBinome: 0.05,
  /** Un livrable refusé : vingt-cinq jours de reprise par un confirmé, et un avoir de 10 %. */
  joursReprise: 25,
  avoir: 0.1,
  semaineDerapage: 11,
  /** Un confirmé seul fait le forfait en trente jours, pris sur la facturation. */
  joursConfirme: 30,
  /** La facturation d'un analyste placé ailleurs. */
  realisationAilleurs: 0.85,
} as const;

/** L'avenant du centre hospitalier : l'extension aux urgences, semaines 10 à 13. */
export const AVENANT = {
  prix: 48000,
  de: 10,
  a: 13,
  joursSemaine: 15,
  derive: { senior: 0.03, confirme: 0.25, independant: 0.1 },
  /** Un manager indépendant de Freelancia. */
  tjmIndependant: 1000,
} as const;
/** La suite de Distrimer sans senior, quand le junior n'est pas autonome : le client se plaint. */
export const INSATISFACTION = { chance: 0.6, cout: 14000, semaine: 12 } as const;

/** La tranche optionnelle du CH : 140 000 €, affermie ou non après la restitution de la semaine 13. */
export const TRANCHE = {
  montant: 140000,
  base: 0.8,
  crise: 0.25,
  avenantConfirme: 0.2,
  avenantAutre: 0.1,
  restitutionSansSenior: 0.2,
} as const;
export const VALEUR_TRANCHE = TRANCHE.montant * TAUX_MARGE_MISSION;
/** Le séminaire de direction de Distrimer, semaines 12 et 13 : dix jours en régie. */
export const SEMINAIRE = { de: 12, jours: 10 } as const;
/** Deux confirmés réservés pour janvier ne facturent rien en semaines 12 et 13. */
export const RESERVATION_JANVIER = { consultants: 2, de: 12 } as const;

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
  /** Les honoraires gagnés ou perdus par semaine sur les autres missions. */
  honoraires: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "depart",
    titre: "Un consultant senior part chez Halden Partners",
    de: "Victoire Lanoë",
    role: "Présidente d'Atlas Conseil",
    texte:
      "Un consultant senior de la practice Énergie et bâtiment rejoint Halden Partners, préavis écourté : trois semaines à 5 500 € d'honoraires en moins, le temps de le remplacer sur ses audits.",
    duree: 3,
    honoraires: -5500,
  },
  {
    id: "gel",
    titre: "Un client industriel gèle ses dépenses de conseil",
    de: "Prune Lecoeur",
    role: "Contrôleuse de gestion",
    texte:
      "Un équipementier automobile suspend deux semaines toutes ses missions de conseil, le temps de revoir son budget : 9 000 € d'honoraires par semaine qui ne viendront pas.",
    duree: 2,
    honoraires: -9000,
  },
  {
    id: "grippe",
    titre: "La grippe au bureau",
    de: "Prune Lecoeur",
    role: "Contrôleuse de gestion",
    texte:
      "Une épidémie de grippe : six consultants absents en moyenne pendant deux semaines, des ateliers clients reportés.",
    duree: 2,
    honoraires: -4500,
  },
  {
    id: "tempora",
    titre: "Tempora bascule sur sa nouvelle version",
    de: "Prune Lecoeur",
    role: "Contrôleuse de gestion",
    texte:
      "La nouvelle version de Tempora a perdu une semaine de saisies : chacun refait ses temps, et une demi-journée par consultant part dans la reprise des plannings.",
    duree: 1,
    honoraires: -3000,
  },
  {
    id: "anticipee",
    titre: "Une collectivité avance le démarrage d'une mission",
    de: "Victoire Lanoë",
    role: "Présidente d'Atlas Conseil",
    texte:
      "Une communauté de communes avance de deux semaines le démarrage d'un audit énergétique déjà signé : 6 000 € d'honoraires de plus par semaine.",
    duree: 2,
    honoraires: 6000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'activité des autres missions, rapportée à sa moyenne. */
  activite: readonly number[];
  /** Le comité de pilotage du CH tourne-t-il à la crise ? */
  uCopil: number;
  /** Le client de chaque junior seul se plaint-il, et quand ? */
  uJuniors: readonly number[];
  semJuniors: readonly number[];
  /** La coopérative attend-elle ? */
  uCoop: number;
  /** Assurances Ligériennes signe-t-il ? */
  uProspect: number;
  /** Chaque proposition est-elle gagnée ? */
  uPropositions: readonly number[];
  /** Le junior du Pays de Retz dérape-t-il ? */
  uRetz: number;
  /** Le client de Distrimer se plaint-il de la suite sans senior ? */
  uDistrimer: number;
  /** La tranche optionnelle du CH est-elle affermie ? */
  uTranche: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000679 + 7);
  const activite: number[] = [1];
  for (let w = 1; w <= SEMAINES; w += 1) {
    activite.push(Math.min(1.07, Math.max(0.93, 1 + 0.03 * gauss(r))));
  }
  const uCopil = r();
  const uJuniors = Array.from({ length: JUNIORS.nombre }, () => r());
  const semJuniors = Array.from({ length: JUNIORS.nombre }, () => 3 + Math.floor(r() * 7));
  const uCoop = r();
  const uProspect = r();
  const uPropositions = PROPOSITIONS.map(() => r());
  const uRetz = r();
  const uDistrimer = r();
  const uTranche = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    activite,
    uCopil,
    uJuniors,
    semJuniors,
    uCoop,
    uProspect,
    uPropositions,
    uRetz,
    uDistrimer,
    uTranche,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Qui pilote le CH : un senior (options 1 et 2 de la rentrée) ou un confirmé. */
export const seniorAuCH = (chemin: readonly number[]) =>
  chemin[D.rentree] === 1 || chemin[D.rentree] === 2;

/** Comment les juniors de septembre ont démarré. */
export const modeJuniors = (chemin: readonly number[]): "binome" | "formation" | "seul" =>
  chemin[D.rentree] === 1 ? "binome" : chemin[D.rentree] === 2 ? "formation" : "seul";

/** En novembre, un junior formé en binôme ou en formation peut tenir une mission. */
export const juniorsAutonomes = (chemin: readonly number[]) => modeJuniors(chemin) !== "seul";

/** Le comité de pilotage de la semaine 7 tourne à la crise. */
export const copilEnCrise = (chemin: readonly number[], graine: number) =>
  hasard(graine).uCopil < (seniorAuCH(chemin) ? CH.crise.senior : CH.crise.confirme);

/** Assurances Ligériennes signe, quoi qu'on fasse de la réservation. */
export const prospectSigne = (graine: number) => hasard(graine).uProspect < PROSPECT.chance;

/** Respectée, la réservation fait attendre la coopérative ; une fois sur deux, elle part. */
export const coopPart = (chemin: readonly number[], graine: number) =>
  chemin[D.reservation] === 0 && hasard(graine).uCoop < CHANCE_COOP_PART;

/** La chance de gagner chaque proposition, selon l'usage de l'intercontrat. */
export function chancesPropositions(chemin: readonly number[]): number[] {
  const d3 = chemin[D.intercontrat];
  return PROPOSITIONS.map(
    (p) =>
      p.chance +
      (d3 === 1 ? GAIN_AVANT_VENTE : 0) +
      (d3 === 2 && p.id === "achats" ? GAIN_CERTIFICATION : 0),
  );
}

/** Le risque que le junior du Pays de Retz, placé seul, dérape. */
export function risqueRetz(chemin: readonly number[]): number {
  if (chemin[D.junior] === 1) return RETZ.risqueBinome;
  if (chemin[D.junior] !== 0) return 0;
  const mode = modeJuniors(chemin);
  return (
    RETZ.risque -
    (mode === "binome" ? RETZ.baisseBinome : mode === "formation" ? RETZ.baisseFormation : 0)
  );
}

/** La chance que la tranche optionnelle du CH soit affermie. */
export function chanceTranche(chemin: readonly number[], graine: number): number {
  let p = TRANCHE.base;
  if (copilEnCrise(chemin, graine)) p -= TRANCHE.crise;
  if (chemin[D.avenant] === 0) p -= TRANCHE.avenantConfirme;
  if (chemin[D.avenant] === 2 || chemin[D.avenant] === 3) p -= TRANCHE.avenantAutre;
  if (chemin[D.restitution] === 0) p -= TRANCHE.restitutionSansSenior;
  return Math.max(0, p);
}

export type Semaine = {
  /** Ce que la semaine apporte à l'objectif : marge et propositions gagnées. */
  contribution: number;
  /** La marge des missions de la semaine. */
  margeSemaine: number;
  /** La marge cumulée depuis le début du trimestre. */
  marge: number;
  /** La valeur des propositions gagnées depuis le début du trimestre. */
  propositions: number;
  /** Les jours factures rapportés aux jours disponibles. */
  occupation: number;
  /** Les consultants sans mission facturable, en équivalents temps plein. */
  intercontrat: number;
  /** Les jours de dépassement cumulés sur les forfaits et les missions des juniors. */
  depassements: number;
  factures: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge des missions du trimestre, plus la valeur des propositions gagnées. */
  objectif: number;
  marge: number;
  propositions: number;
  occupationMoyenne: number;
  /** Le taux d'occupation prévisible d'octobre, calculé sur le plan de charge du lundi de la semaine 1. */
  occupationPrevue: number;
  occupationOctobre: number;
  depassements: number;
  crise: boolean;
  incidents: number;
  coopPart: boolean;
  prospectSigne: boolean;
  /** Le prospect a signé, mais personne ne l'attendait : la mission est partie chez Halden. */
  prospectPerdu: boolean;
  gagnees: readonly string[];
  retzDerape: boolean;
  distrimerMecontent: boolean;
  trancheAffermie: boolean;
  chanceTranche: number;
  autonomes: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const crise = copilEnCrise(chemin, graine);
  const signe = prospectSigne(graine);
  const part = coopPart(chemin, graine);
  const mode = modeJuniors(chemin);
  const autonomes = juniorsAutonomes(chemin);
  const pTranche = chanceTranche(chemin, graine);
  const pProps = chancesPropositions(chemin);
  const derapeRetz = h.uRetz < risqueRetz(chemin);
  const mecontent = d5 === 1 && !autonomes && h.uDistrimer < INSATISFACTION.chance;
  const affermie = h.uTranche < pTranche;
  const comite = d1 === 3;
  const deriveCH = seniorAuCH(chemin) ? CH.derive.senior : CH.derive.confirme;
  const semaines: (Semaine | null)[] = [null];
  let marge = 0;
  let propositions = 0;
  let depassements = 0;
  let incidents = 0;
  let occupationTotale = 0;
  let octobre = 0;
  const gagnees: string[] = [];
  const revenuEquipe = COOP.consultants * 5 * TJM.confirme;
  const margeIndependants = COOP.consultants * 5 * (TJM.confirme - COOP.achatIndependant);
  const prospectPerdu = signe && d2 === 1;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let m = 0;
    let factures = 0;
    let gain = 0;

    // Le reste du bureau : les autres missions, et les salaires des soixante.
    const autres = HONORAIRES_AUTRES * saison(w) * h.activite[w]!;
    const ecartImprevus = actifs.reduce((s, a) => s + a.imprevu.honoraires, 0);
    m += autres + ecartImprevus - MASSE_SALARIALE;
    factures += JOURS_AUTRES * saison(w) * h.activite[w]! + ecartImprevus / TJM.confirme;
    if (w === 1) m -= Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

    // D1. Le centre hospitalier : un forfait, des dépassements selon qui le pilote.
    const debutCH = comite ? 2 : 1;
    if (w >= debutCH) {
      m += CH.prix / SEMAINES;
      const derive = CH.joursSemaine * deriveCH;
      m -= derive * COUT_JOUR_MOYEN;
      depassements += derive;
      factures += CH.joursSemaine + derive;
    }
    if (comite && w === 2) m -= CH.prix * CH.penaliteRetard;
    if (crise && w === CH.copil) {
      m -= CH.coutCrise;
      depassements += CH.coutCrise / COUT_JOUR_MOYEN;
    }

    // D1. Distrimer, en régie : deux seniors, ou un senior et un confirmé.
    if (w >= (comite ? 2 : DISTRIMER.de) && w <= DISTRIMER.a) {
      const seniors = d1 === 0 || d1 === 3;
      m += 5 * (seniors ? 2 * TJM.senior : TJM.senior + TJM.confirme);
      factures += 10;
    }

    // D1. Les juniors de septembre : sept sur leurs missions, le huitième au Pays de Retz à partir de la semaine 7.
    const n = w >= RETZ.de ? JUNIORS.nombre - 1 : JUNIORS.nombre;
    let r = 0;
    let encadrement = 0;
    if (mode === "seul") {
      r = comite && w === 1 ? 0 : JUNIORS.seul;
      if (!(comite && w === 1)) {
        m -= n * JUNIORS.depassementSeul * COUT_JOUR_MOYEN;
        depassements += n * JUNIORS.depassementSeul;
      }
    } else if (mode === "binome") {
      const b = JUNIORS.binome;
      r = w <= 3 ? b.debut : w <= 8 ? b.milieu : b.fin;
      encadrement = w <= 8 ? JUNIORS.encadrement : JUNIORS.encadrement / 2;
    } else {
      const b = JUNIORS.binome;
      r = w <= JUNIORS.formation.semaines ? 0 : w <= 6 ? b.milieu : b.fin;
      if (w > JUNIORS.formation.semaines)
        encadrement = w <= 8 ? JUNIORS.encadrement : JUNIORS.encadrement / 2;
      if (w === 1) m -= JUNIORS.formation.cout;
    }
    m += n * 5 * r * TJM.analyste - n * encadrement * TJM.confirme;
    factures += n * 5 * r - n * encadrement;
    if (mode === "seul") {
      h.uJuniors.forEach((u, j) => {
        if (u < JUNIORS.risqueIncident && h.semJuniors[j] === w) {
          m -= JUNIORS.coutIncident;
          incidents += 1;
        }
      });
    }

    // D2. La coopérative, et la réservation d'Hamelin.
    if (d2 === 1) {
      if (w >= COOP.de && w <= COOP.a) {
        m += revenuEquipe;
        factures += 15;
      }
    } else if (d2 === 2) {
      if (w >= COOP.de + 1 && w <= COOP.a) {
        if (signe) m += margeIndependants;
        else {
          m += revenuEquipe;
          factures += 15;
        }
      }
    } else if (d2 === 3) {
      if (w >= COOP.de && w <= COOP.a) m += margeIndependants;
    }
    if (d2 !== 1 && signe && w >= PROSPECT.de) {
      m += revenuEquipe;
      factures += 15;
      if (w === PROSPECT.de) gain += PROSPECT.montant * TAUX_MARGE_MISSION;
    }
    if (d2 === 0 && w >= NOVEMBRE) {
      // La coopérative a attendu : elle démarre en novembre ; sinon, les trois vont au rush.
      if (!part) {
        if (signe) m += margeIndependants;
        else {
          m += revenuEquipe;
          factures += 15;
        }
      } else if (!signe) {
        m += revenuEquipe * 0.8;
        factures += 12;
      }
    }
    if (d2 === 3 && !signe && w >= NOVEMBRE) {
      m += revenuEquipe * 0.8;
      factures += 12;
    }

    // D3. L'intercontrat d'octobre.
    if (d3 === 0 && w >= HALDEN.de) {
      m += HALDEN.consultants * 5 * HALDEN.tjm;
      factures += HALDEN.consultants * 5;
      if (w >= NOVEMBRE) {
        m -= HALDEN.consultants * 5 * TJM_RUSH;
        factures -= HALDEN.consultants * 5;
      }
    }
    if (w >= NOVEMBRE) {
      if (d3 === 1) m += GAIN_FORMATION.analystes;
      if (d3 === 2) m += GAIN_FORMATION.tous;
    }
    PROPOSITIONS.forEach((p, k) => {
      if (p.semaine === w && h.uPropositions[k]! < pProps[k]!) {
        gain += p.montant * TAUX_MARGE_MISSION * (d3 === 0 ? DECOTE_SANS_EQUIPE : 1);
        gagnees.push(p.id);
      }
    });

    // D4. Le Pays de Retz.
    if (w >= RETZ.de) {
      m += RETZ.prix / (RETZ.a - RETZ.de + 1);
      if (d4 === 0) factures += 5;
      if (d4 === 1) {
        m -= JUNIORS.encadrement * TJM.confirme;
        factures += 5 - JUNIORS.encadrement;
      }
      if (d4 === 2) {
        const parSemaine = RETZ.joursConfirme / (RETZ.a - RETZ.de + 1);
        m -= parSemaine * TJM.confirme;
        m += 5 * RETZ.realisationAilleurs * TJM.analyste;
        factures += 5 * RETZ.realisationAilleurs;
      }
      if (derapeRetz && w === RETZ.semaineDerapage) {
        const plein = RETZ.joursReprise * TJM.confirme + RETZ.prix * RETZ.avoir;
        const cout = d4 === 1 ? plein / 2 : plein;
        m -= cout;
        const j = d4 === 1 ? RETZ.joursReprise / 2 : RETZ.joursReprise;
        depassements += j;
        factures -= j;
      }
    }

    // D5. L'avenant du CH, et la suite de Distrimer.
    if (w >= AVENANT.de) {
      const suite = d5 === 1 ? 5 * (TJM.confirme + TJM.analyste) : 5 * (TJM.senior + TJM.confirme);
      m += suite;
      factures += 10;
      if (d5 !== 3) m += AVENANT.prix / (AVENANT.a - AVENANT.de + 1);
      const derive =
        d5 === 0
          ? AVENANT.derive.confirme
          : d5 === 1
            ? AVENANT.derive.senior
            : d5 === 2
              ? AVENANT.derive.independant
              : 0;
      m -= AVENANT.joursSemaine * derive * COUT_JOUR_MOYEN;
      depassements += AVENANT.joursSemaine * derive;
      if (d5 === 0) m -= 5 * TJM.confirme; // le confirmé qui pilote l'avenant quitte le rush
      if (d5 === 1) m -= 5 * TJM.analyste; // l'analyste qui reprend Distrimer quitte le rush
      if (d5 === 2) m -= 5 * AVENANT.tjmIndependant;
      if (d5 !== 3) factures += d5 === 2 ? 10 : 15;
      if (d5 !== 3) factures -= d5 === 2 ? 0 : 5;
      if (mecontent && w === INSATISFACTION.semaine) m -= INSATISFACTION.cout;
    }

    // D6. Le séminaire de Distrimer, la réservation de janvier, la restitution du CH.
    if (w >= SEMINAIRE.de) {
      m += (SEMINAIRE.jours / 2) * (d6 === 0 ? TJM.senior : TJM.confirme);
      factures += SEMINAIRE.jours / 2;
      if (d6 === 0 || d6 === 2) {
        m -= RESERVATION_JANVIER.consultants * 5 * TJM.confirme;
        factures -= RESERVATION_JANVIER.consultants * 5;
      }
    }
    if (w === SEMAINES && affermie) gain += VALEUR_TRANCHE;

    marge += m;
    propositions += gain;
    const occupation = factures / DISPONIBLES_SEMAINE;
    occupationTotale += occupation;
    if (w >= 6 && w <= 9) octobre += factures;
    semaines.push({
      contribution: m + gain,
      margeSemaine: m,
      marge,
      propositions,
      occupation,
      intercontrat: Math.max(0, (DISPONIBLES_SEMAINE - factures) / 5),
      depassements,
      factures: factures,
    });
  }

  return {
    semaines,
    objectif: marge + propositions,
    marge,
    propositions,
    occupationMoyenne: occupationTotale / SEMAINES,
    occupationPrevue: OCCUPATION_PREVUE,
    occupationOctobre: octobre / (4 * DISPONIBLES_SEMAINE),
    depassements,
    crise,
    incidents,
    coopPart: part,
    prospectSigne: signe,
    prospectPerdu,
    gagnees,
    retzDerape: derapeRetz,
    distrimerMecontent: mecontent,
    trancheAffermie: affermie,
    chanceTranche: pTranche,
    autonomes,
  };
}

/** Ce qui s'est passé pendant des semaines : comité, plaintes, coopérative, prospect, propositions. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const incidents =
    modeJuniors(chemin) === "seul"
      ? h.semJuniors.filter((s, j) => h.uJuniors[j]! < JUNIORS.risqueIncident && dans(s))
      : [];
  return {
    copil: dans(CH.copil),
    crise: t.crise && dans(CH.copil),
    incidents,
    prospectPerdu: t.prospectPerdu && dans(PROSPECT.de),
    prospectSigne: t.prospectSigne && chemin[D.reservation] !== 1 && dans(PROSPECT.de),
    propositions: PROPOSITIONS.filter((p) => dans(p.semaine)).map((p) => ({
      ...p,
      gagnee: t.gagnees.includes(p.id),
    })),
    retzDerape: t.retzDerape && dans(RETZ.semaineDerapage),
    distrimerMecontent: t.distrimerMecontent && dans(INSATISFACTION.semaine),
    tranche: dans(SEMAINES),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureStaffing {
  marge: number | null;
  budgetADate: number | null;
  occupation: number | null;
  intercontrat: number | null;
  depassements: number | null;
  propositions: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  crise: number | null;
  autonomes: number | null;
}

/** Le budget de marge des missions du bureau sur le trimestre, hors propositions gagnées. */
export const BUDGET = 860000;

/** Ce qu'Aïssatou lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureStaffing {
  if (semaine === 0) {
    return {
      marge: 0,
      budgetADate: 0,
      occupation: 0.58,
      intercontrat: 24,
      depassements: 0,
      propositions: 0,
      crise: 0,
      autonomes: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    marge: s.marge,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    occupation: s.occupation,
    intercontrat: s.intercontrat,
    depassements: s.depassements,
    propositions: s.propositions,
    crise: semaine >= CH.copil && t.crise ? 1 : 0,
    autonomes: t.autonomes ? 1 : 0,
  };
}
