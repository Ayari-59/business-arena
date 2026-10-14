/**
 * LES CHUTES DE LA NUIT — le modèle de l'EHPAD de Chalon-sur-Saône (Association Solvanne).
 *
 * Quatre-vingt-dix résidents, une équipe de nuit de trois personnes, un
 * trimestre d'octobre à décembre, six décisions. L'été a compté 41 chutes,
 * dont 29 entre 22 h et 7 h, et deux fractures ; des familles demandent des
 * barrières de lit, le médecin coordonnateur parle de contentions. Quatre
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LES CHUTES ONT DES CAUSES, ET ELLES SE CONCENTRENT. Douze résidents
 *     font 28 des 41 chutes ; 19 des 29 chutes de nuit tombent entre 5 h et
 *     7 h, au lever pour aller seul aux toilettes, dans le noir, en chaussons
 *     ouverts ; neuf des douze prennent un hypnotique ou un anxiolytique à
 *     20 h. Seule l'analyse des déclarations le montre (une source qui coûte
 *     du temps). Une tournée ciblée au petit matin, la lumière et le chaussage
 *     retirent la moitié des chutes du lever ; une ronde de plus ou une
 *     surveillance générale, qui passe partout à heure fixe, n'en retire
 *     presque rien, et une ronde toutes les heures réveille les résidents.
 *   · LA REVUE DES TRAITEMENTS AGIT AVEC RETARD. Un hypnotique ne s'arrête pas
 *     d'un coup : la diminution se fait par paliers, sur quatre à six
 *     semaines, avec le médecin coordonnateur, le pharmacien et les médecins
 *     traitants. Les chutes ne baissent qu'ensuite ; l'essentiel du gain est
 *     dans le risque laissé au trimestre suivant. Un somnifère plus fort rend
 *     les nuits plus calmes et les levers de 5 h plus dangereux.
 *   · LA CONTENTION DÉPLACE LE RISQUE, ET L'AGGRAVE. Une barrière
 *     de lit retire un quart des chutes du lit ; mais le résident qui
 *     l'enjambe tombe de plus haut, et se fracture plus de trois fois plus souvent.
 *     Chaque contention demande une surveillance toutes les deux heures, fait
 *     perdre la marche en quelques semaines, et une inspection la relève
 *     quand elle n'est ni motivée ni réévaluée. Le nombre de chutes baisse,
 *     le nombre de fractures monte : le tableau de bord ment à qui ne compte
 *     que les chutes. Mettre au fauteuil « pour surveiller » produit la même
 *     perte d'autonomie. Lever toutes les contentions d'un coup, sans lit bas
 *     ni tapis ni passage au lever, n'est pas mieux : des résidents qui ont
 *     perdu l'habitude de se lever seuls tombent davantage, et les familles
 *     qu'on n'a pas prévenues réclament ; il faut réévaluer une à une.
 *   · UNE FRACTURE COÛTE, ET SA RÉPÉTITION PLUS ENCORE. Chaque fracture est
 *     tirée au hasard selon le risque de la semaine : journées d'absence non
 *     facturées, dépendance accrue au retour, réclamation de la famille. Au
 *     troisième événement grave du trimestre (fracture, ou plainte d'une
 *     famille à l'ARS), l'ARS inspecte ; elle relève chaque contention en
 *     place. L'activité physique adaptée fait baisser les chutes, mais
 *     tard : c'est la meilleure option en moyenne. Les protecteurs de hanche
 *     ne retirent aucune chute ; ils rendent les fractures moins lourdes, tout
 *     de suite, et protègent mieux des mauvais trimestres.
 *
 * Le trimestre est jugé en euros, plus haut = mieux : l'opposé du coût des
 * chutes. Ce coût compte ce que le trimestre a payé (heures, matériel,
 * surveillance des contentions, soins après chaque chute, fractures,
 * réclamations, inspection), et LE RISQUE LAISSÉ : le coût attendu des
 * fractures du trimestre suivant, au niveau de risque atteint fin décembre
 * (hors effet de l'hiver), avec les mesures en place. C'est ce qui donne sa
 * valeur à une décision dont l'effet vient tard. La dignité des résidents
 * n'y est pas un coût de plus : c'est la contention qui coûte, en fractures,
 * en autonomie perdue, en inspection.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const PLACES = 90;
/** Les résidents qui chutent le plus : 28 des 41 chutes de l'été. */
export const DOUZE = 12;
export const AUTRES = PLACES - DOUZE;
/** Les chutes de juillet à septembre, par groupe et par moment : 5 h-7 h, le reste de la nuit, le jour. */
export const CHUTES_ETE = {
  douze: { matin: 16, nuit: 5, jour: 7 },
  autres: { matin: 3, nuit: 5, jour: 5 },
} as const;
export const TOTAL_ETE =
  CHUTES_ETE.douze.matin +
  CHUTES_ETE.douze.nuit +
  CHUTES_ETE.douze.jour +
  CHUTES_ETE.autres.matin +
  CHUTES_ETE.autres.nuit +
  CHUTES_ETE.autres.jour;
/** Entre 22 h et 7 h. */
export const NUIT_ETE =
  CHUTES_ETE.douze.matin + CHUTES_ETE.douze.nuit + CHUTES_ETE.autres.matin + CHUTES_ETE.autres.nuit;
export const MATIN_ETE = CHUTES_ETE.douze.matin + CHUTES_ETE.autres.matin;
export const DOUZE_ETE = CHUTES_ETE.douze.matin + CHUTES_ETE.douze.nuit + CHUTES_ETE.douze.jour;
export const FRACTURES_ETE = 2;
/** Neuf des douze prennent un hypnotique ou un anxiolytique à 20 h ; ils font 22 des 28 chutes. */
export const SOUS_PSYCHOTROPES = 9;
export const CHUTES_SOUS_PSYCHOTROPES = 22;
const PART_PSYCHOTROPES = CHUTES_SOUS_PSYCHOTROPES / DOUZE_ETE;
/** Le risque de chute d'un résident sous psychotrope du soir, rapporté à ce qu'il serait sans. */
export const FACTEUR_PSYCHOTROPE = 2.2;
/** Ce qu'il reste de ce surcroît une fois les paliers passés. */
export const FACTEUR_APRES_REVUE = 1.1;
/** Un somnifère plus fort : des nuits plus calmes, un lever plus dangereux. */
export const FACTEUR_SOMNIFERE_FORT = 2.7;
/** Décembre (semaines 10 à 13) : un quart de chutes de plus que l'automne, sur les trois derniers hivers. */
export const HIVER = 1.25;
export const DEBUT_HIVER = 10;
/** Le chiffre que la prévision demande : les chutes d'octobre à décembre si rien ne change. */
export const CHUTES_ATTENDUES =
  (TOTAL_ETE * (DEBUT_HIVER - 1 + (SEMAINES - DEBUT_HIVER + 1) * HIVER)) / SEMAINES;
/** La direction demande un quart de chutes en moins. */
export const OBJECTIF_CHUTES = 30;

/** Les barrières de lit en place début octobre : quatorze résidents, dont cinq des douze. */
export const CONTENTIONS_DEPART = { douze: 5, autres: 9 } as const;
/** Une barrière retire un quart des chutes du lit. */
export const BARRIERE_CHUTES = 0.75;
/** La probabilité qu'une chute finisse en fracture : sans barrière, et quand le résident l'enjambe. */
export const P_FRACTURE = 0.035;
export const P_FRACTURE_BARRIERE = 0.12;
/**
 * Les protecteurs de hanche, portés par les douze, n'empêchent pas la chute : ils changent la
 * fracture. Celle du col du fémur devient une contusion ou une fracture du poignet, sans
 * hospitalisation longue : une fracture d'un résident protégé coûte 40 % d'une fracture ordinaire.
 */
export const PROTECTEURS = 0.4;
/** Au trimestre suivant, l'observance baisse : une partie des douze ne les porte plus. */
export const PROTECTEURS_DUREE = 0.6;
/** Une contention levée d'un coup, sans lit bas ni tapis : le résident tombe deux fois plus, et longtemps. */
export const REBOND = 2.5;
export const REBOND_DUREE = 1.6;

/** Les taux de chute de nuit d'un résident, par semaine, calés sur l'été (barrières comprises). */
const R_DOUZE =
  (CHUTES_ETE.douze.matin + CHUTES_ETE.douze.nuit) /
  SEMAINES /
  (DOUZE - (1 - BARRIERE_CHUTES) * CONTENTIONS_DEPART.douze);
const R_AUTRES =
  (CHUTES_ETE.autres.matin + CHUTES_ETE.autres.nuit) /
  SEMAINES /
  (AUTRES - (1 - BARRIERE_CHUTES) * CONTENTIONS_DEPART.autres);

/** Ce que coûte une chute sans fracture : relevage, examen, surveillance, plaie, déclaration, appel à la famille. */
export const COUT_CHUTE = 250;
/** Une fracture, poste par poste. */
export const FRACTURE = {
  /** Court séjour puis SMR : la place est gardée, le forfait dépendance n'est pas facturé, le forfait hospitalier est déduit. */
  jours: 35,
  parJour: 42,
  /** Au retour : une heure d'aide-soignante de plus par jour pendant treize semaines. */
  heures: 91,
  heure: 30,
  /** La réclamation de la famille : médiation, réponse écrite, franchise d'assurance. */
  reclamation: 3000,
} as const;
export const COUT_FRACTURE =
  FRACTURE.jours * FRACTURE.parJour + FRACTURE.heures * FRACTURE.heure + FRACTURE.reclamation;
/** Une contention : surveillance toutes les deux heures la nuit, réévaluation, soins en plus. */
export const COUT_CONTENTION = 120;
/** La plainte d'une famille auprès de l'ARS. */
export const PLAINTE_ARS = 4000;
/** Une réclamation d'une famille qu'on n'a pas prévenue : rendez-vous, réponse écrite, médiation. */
export const RECLAMATION_FAMILLE = 1500;
/** Lever toutes les contentions sans prévenir : une famille sur trois réclame. */
export const PART_FAMILLES_QUI_RECLAMENT = 1 / 3;
/** Au troisième événement grave du trimestre, l'ARS inspecte. */
export const SEUIL_INSPECTION = 3;
export const INSPECTION = 12000;
/** Ce que l'inspection ajoute pour chaque contention en place : injonction, réévaluations à refaire. */
export const INJONCTION_PAR_CONTENTION = 900;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, une nuit de plus sans rien changer. */
export const PERTE_PAR_JOUR = 400;

/** Les mesures, en euros. */
export const COUTS = {
  /** Ajouter une barrière de lit : barrière, housse de protection, prescription. */
  barriere: 95,
  /** Une aide-soignante de nuit de plus, sept nuits : en intérim (deux semaines), puis en CDD. */
  veilleuseInterim: 3400,
  veilleuseCdd: 1700,
  /** La tournée du petit matin : prise de poste avancée à 5 h 30, majoration de nuit. */
  tournee: 150,
  /** Veilleuses à détection de mouvement et chaussures fermées pour les douze, réunions d'analyse. */
  equipementTournee: 1400,
  reunionsAnalyse: 600,
  revueCiblee: 900,
  revueComplete: 4200,
  /** Un lit à hauteur variable et un tapis au sol. */
  litBas: 1300,
  apa: 260,
  protecteurs: 2600,
  capteursTous: 2500,
  capteursTousSemaine: 600,
  capteursCibles: 700,
  capteursCiblesSemaine: 45,
  /** Lever une contention : lit bas loué, tapis, réunion avec la famille. */
  levee: 120,
  reevaluation: 300,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  traitements: 1,
  famille: 2,
  activite: 3,
  capteurs: 4,
  contentions: 5,
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
    /** Les chutes de nuit (22 h-7 h), de tous les résidents. */
    nuit?: number;
    /** Les chutes du lever, entre 5 h et 7 h. */
    matin?: number;
    /** Les chutes des 78 autres résidents. */
    autres?: number;
    /** Toutes les chutes. */
    tout?: number;
    /** Une dépense ponctuelle, en euros. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "appel",
    titre: "Panne de l'appel-malade",
    de: "Services techniques",
    role: "Siège de l'association",
    texte:
      "Le système d'appel-malade est tombé en panne deux nuits de suite : l'équipe de nuit a fait des rondes à la lampe, sans savoir qui appelait.",
    duree: 1,
    effet: { nuit: 1.35, cout: 900 },
  },
  {
    id: "gastro",
    titre: "Gastro-entérite au deuxième étage",
    de: "Raïssa Nedjar",
    role: "Infirmière",
    texte:
      "Une gastro-entérite touche onze résidents du deuxième étage : déshydratation, levers fréquents la nuit, deux soignantes en arrêt.",
    duree: 2,
    effet: { tout: 1.2, cout: 1200 },
  },
  {
    id: "admissions",
    titre: "Trois admissions en sortie d'hospitalisation",
    de: "Sigismond Ravanel",
    role: "Directeur de l'EHPAD",
    texte:
      "Trois places libérées, trois admissions dans la semaine, toutes en sortie de court séjour : des résidents désorientés, qui ne connaissent ni leur chambre ni le chemin des toilettes.",
    duree: 3,
    effet: { autres: 1.3 },
  },
  {
    id: "protections",
    titre: "Changement de protections",
    de: "Isménie Pothier",
    role: "Aide-soignante de nuit",
    texte:
      "La centrale d'achat a changé de fournisseur de protections : les nouvelles fuient la nuit, les résidents se réveillent mouillés et se lèvent pour se changer.",
    duree: 2,
    effet: { matin: 1.3 },
  },
  {
    id: "sols",
    titre: "Réfection des sols du premier étage",
    de: "Services techniques",
    role: "Siège de l'association",
    texte:
      "Les sols du premier étage sont refaits : huit résidents changent de chambre pour une semaine, et perdent leurs repères.",
    duree: 1,
    effet: { tout: 1.15 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Le hasard des chutes de la semaine. */
  chutes: number;
  /** Le tirage des fractures de la semaine, comparé au risque. */
  fracture: number;
  /** Une fracture de la semaine vient-elle d'un lit à barrières ? */
  qui: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le troisième médecin traitant accepte-t-il la revue en commission ? */
  uMedecin: number;
  /** Le fils de Mme Lamboley écrit-il à l'ARS ? */
  uFamille: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000931 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      chutes: Math.min(1.3, Math.max(0.75, 1 + 0.1 * gauss(r))),
      fracture: r(),
      qui: r(),
    });
  }
  const uMedecin = r();
  const uFamille = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uMedecin, uFamille, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Six fois sur dix, le troisième médecin traitant accepte la revue en commission. */
export const CHANCE_MEDECIN = 0.6;
export const medecinAccepte = (graine: number) => hasard(graine).uMedecin < CHANCE_MEDECIN;

/**
 * LE FILS DE MME LAMBOLEY ÉCRIT-IL À L'ARS ?
 *
 * Il demande une barrière. Reçu avec le médecin coordonnateur, il accepte le
 * plan quatre fois sur cinq si l'on peut lui montrer l'analyse des chutes de
 * sa mère (la semaine 1 l'a faite) ; sans elle, une fois sur deux. Un lit bas
 * posé sans le recevoir, ou un courrier, le convainquent plus rarement. La
 * barrière, elle, le rassure : il n'écrit pas.
 */
export function chanceDePlainte(chemin: readonly number[]): number {
  const choix = chemin[D.famille] ?? NEUTRE[D.famille];
  if (choix === 0) return 0;
  if (choix === 1) return chemin[D.plan] === 2 ? 0.2 : 0.5;
  if (choix === 2) return 0.5;
  return 0.6;
}
export const plainte = (chemin: readonly number[], graine: number) =>
  hasard(graine).uFamille < chanceDePlainte(chemin);

/** Le nombre de fractures d'une semaine dont le risque attendu est `e` : une loi de Poisson, tirée par `u`. */
export function fracturesTirees(e: number, u: number): number {
  let k = 0;
  let p = Math.exp(-e);
  let cumul = p;
  while (u > cumul && k < 4) {
    k += 1;
    p *= e / k;
    cumul += p;
  }
  return k;
}

/** Le risque d'inspection : au moins `SEUIL_INSPECTION` événements graves pour une espérance `e`. */
export function chanceDInspection(e: number): number {
  let cumul = 0;
  let p = Math.exp(-e);
  for (let k = 0; k < SEUIL_INSPECTION; k += 1) {
    cumul += p;
    p *= e / (k + 1);
  }
  return 1 - cumul;
}

/** Le multiplicateur des chutes des douze, selon le psychotrope du soir (1 : celui de l'été). */
export const effetPsychotropes = (facteur: number) =>
  1 - PART_PSYCHOTROPES + (PART_PSYCHOTROPES * facteur) / FACTEUR_PSYCHOTROPE;

/** Le facteur psychotrope de la semaine `w`, selon la revue des traitements choisie. */
export function facteurPsychotrope(choix: number, accepte: boolean, w: number): number {
  const cible = accepte
    ? FACTEUR_APRES_REVUE
    : (6 * FACTEUR_APRES_REVUE + 3 * FACTEUR_PSYCHOTROPE) / SOUS_PSYCHOTROPES;
  // La diminution se fait par paliers, sur quatre semaines, une fois la commission passée.
  const paliers = (debut: number) =>
    w <= debut
      ? FACTEUR_PSYCHOTROPE
      : FACTEUR_PSYCHOTROPE - (FACTEUR_PSYCHOTROPE - cible) * Math.min(1, (w - debut) / 4);
  if (choix === 0) return paliers(4);
  if (choix === 1) return w >= 3 ? FACTEUR_SOMNIFERE_FORT : FACTEUR_PSYCHOTROPE;
  // La revue des 90 : les douze passent avec les autres, par ordre de chambre.
  if (choix === 2) return paliers(8);
  return FACTEUR_PSYCHOTROPE;
}

/** L'activité physique adaptée : rien avant la semaine 9, puis un quart de chutes en moins chez les douze. */
export const effetActivite = (choix: number, w: number) =>
  choix === 0 && w >= 10 ? Math.max(0.55, 1 - 0.1 * (w - 9)) : 1;

export type Semaine = {
  chutes: number;
  /** Les chutes entre 22 h et 7 h. */
  chutesNuit: number;
  chutesCumul: number;
  /** Les fractures de la semaine. */
  fractures: number;
  fracturesCumul: number;
  /** Le nombre de fractures attendu cette semaine, au vu du risque. */
  risque: number;
  /** Les résidents sous barrière de lit la nuit. */
  contentions: number;
  /** Ce que la semaine a coûté. */
  cout: number;
  coutCumule: number;
};

export interface FractureTiree {
  semaine: number;
  /** Le résident avait-il une barrière de lit ? */
  barriere: boolean;
  /** Le rang de la fracture dans le trimestre. */
  rang: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'opposé du coût des chutes : plus haut = mieux. */
  objectif: number;
  /** Le coût total : le trimestre, et le risque laissé. */
  coutTotal: number;
  /** Ce que le trimestre a payé. */
  coutTrimestre: number;
  /** Le coût attendu des fractures du trimestre suivant. */
  risqueLaisse: number;
  /** Les fractures attendues par semaine fin décembre, hors hiver. */
  risqueFinal: number;
  mesures: number;
  chutes: number;
  chutesNuit: number;
  fractures: number;
  fracturesDetail: readonly FractureTiree[];
  /** Les fractures attendues sur le trimestre, au vu du risque de chaque semaine. */
  fracturesAttendues: number;
  plainte: boolean;
  /** La semaine où l'inspection est annoncée ; 0 : pas d'inspection. */
  inspection: number;
  coutInspection: number;
  medecinAccepte: boolean;
  contentionsFin: number;
  contentionsMax: number;
  /** Les réclamations des familles quand toutes les contentions sont levées d'un coup. */
  reclamations: number;
  /** Le chiffre que la prévision de la semaine 1 demande. */
  chutesAttendues: number;
}

const SANS_IMPREVU = { nuit: 1, matin: 1, autres: 1 } as const;

interface Etat {
  /** Les douze et les autres sous barrière. */
  kd: number;
  ka: number;
  /** Les résidents dont la contention a été levée d'un coup, sans rien à la place. */
  rebondD: number;
  rebondA: number;
  /** La marche perdue par les douze : un surcroît de chutes. */
  perte: number;
}

/** Les chutes attendues d'une semaine, et les fractures qu'elles portent, sans hasard ni hiver. */
function chutesDeLaSemaine(
  chemin: readonly number[],
  w: number,
  e: Etat,
  facteur: number,
  imp: Readonly<{ nuit: number; matin: number; autres: number }> = SANS_IMPREVU,
): {
  douze: number;
  nuit: number;
  total: number;
  fractures: number;
  barriere: number;
  /** Ce que coûte une fracture de la semaine, rapporté à une fracture ordinaire. */
  gravite: number;
} {
  const [d1, , , d4, d5, d6] = chemin;
  const m = effetPsychotropes(facteur) * (1 + e.perte) * effetActivite(d4!, w);
  // Ce que chaque mesure retire, ou ajoute, aux chutes du lever, du reste de la nuit, des autres.
  let matinD = imp.nuit * imp.matin;
  let nuitD = imp.nuit;
  let jourD = 1;
  let nuitA = imp.nuit;
  const matinA = imp.matin;
  let autres = imp.autres;
  if (d1 === 1 && w >= 2) {
    matinD *= 0.88;
    nuitD *= 0.88;
    nuitA *= 0.88;
  }
  if (d1 === 2) {
    if (w === 2) matinD *= 0.7;
    if (w >= 3) matinD *= 0.5;
    if (w >= 2) nuitD *= 0.85;
  }
  if (chemin[D.traitements] === 2 && w >= 10) autres *= 0.97;
  if (d4 === 0) autres *= 1 - 0.5 * (1 - effetActivite(0, w));
  if (d4 === 1 && w >= 7) jourD *= 0.85;
  if (w >= 10) {
    if (d5 === 0) {
      matinD *= 0.94;
      nuitD *= 0.94;
      nuitA *= 0.94;
    }
    if (d5 === 1) {
      matinD *= d1 === 2 ? 0.55 : 0.85;
      nuitD *= d1 === 2 ? 0.7 : 0.9;
    }
    if (d5 === 2) {
      matinD *= 1.1;
      nuitD *= 1.3;
      nuitA *= 1.3;
    }
  }
  // Lever d'un coup : des résidents qui ont perdu l'habitude de se lever seuls tombent davantage.
  const rebond = d6 === 2 && w >= 11 ? (w > SEMAINES ? REBOND_DUREE : REBOND) : 1;
  const libresD = DOUZE - e.kd - e.rebondD + rebond * e.rebondD;
  const barriereD = BARRIERE_CHUTES * e.kd;
  const libresA = AUTRES - e.ka - e.rebondA + rebond * e.rebondA;
  const barriereA = BARRIERE_CHUTES * e.ka;
  const partMatin = CHUTES_ETE.douze.matin / (CHUTES_ETE.douze.matin + CHUTES_ETE.douze.nuit);
  const partMatinA = CHUTES_ETE.autres.matin / (CHUTES_ETE.autres.matin + CHUTES_ETE.autres.nuit);
  const nuitParResidentD = R_DOUZE * m * (partMatin * matinD + (1 - partMatin) * nuitD);
  const nuitParResidentA = R_AUTRES * autres * nuitA * (partMatinA * matinA + (1 - partMatinA));
  const douzeLibres = libresD * nuitParResidentD;
  const douzeBarriere = barriereD * nuitParResidentD;
  const douzeJour = (CHUTES_ETE.douze.jour / SEMAINES) * m * jourD;
  const autresLibres = libresA * nuitParResidentA;
  const autresBarriere = barriereA * nuitParResidentA;
  const autresJour = (CHUTES_ETE.autres.jour / SEMAINES) * autres;
  const hanches = d4 === 2 && w >= 7 ? (w > SEMAINES ? PROTECTEURS_DUREE : PROTECTEURS) : 1;
  const fracturesDouze =
    douzeBarriere * P_FRACTURE_BARRIERE + (douzeLibres + douzeJour) * P_FRACTURE;
  const barriere = (douzeBarriere + autresBarriere) * P_FRACTURE_BARRIERE;
  const fractures =
    fracturesDouze +
    autresBarriere * P_FRACTURE_BARRIERE +
    (autresLibres + autresJour) * P_FRACTURE;
  const nuit = douzeLibres + douzeBarriere + autresLibres + autresBarriere;
  return {
    douze: douzeLibres + douzeBarriere + douzeJour,
    nuit,
    total: nuit + douzeJour + autresJour,
    fractures,
    barriere,
    gravite: 1 - ((1 - hanches) * fracturesDouze) / fractures,
  };
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const accepte = medecinAccepte(graine);
  const aPlainte = plainte(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const e: Etat = {
    kd: CONTENTIONS_DEPART.douze,
    ka: CONTENTIONS_DEPART.autres,
    rebondD: 0,
    rebondA: 0,
    perte: 0,
  };
  let coutCumule = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let mesures = 0;
  let chutesCumul = 0;
  let chutesNuit = 0;
  let fracturesCumul = 0;
  let attendues = 0;
  let graves = 0;
  let inspection = 0;
  let coutInspection = 0;
  let contentionsMax = 0;
  let reclamations = 0;
  const detail: FractureTiree[] = [];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? coutCumule : 0;
    let depense = 0;

    // Qui est sous barrière cette semaine.
    if (d1 === 0 && w === 2) {
      const ajout = DOUZE - e.kd + 7;
      e.kd = DOUZE;
      e.ka += 7;
      depense += ajout * COUTS.barriere;
    }
    if (d3 === 0 && w === 5 && e.kd < DOUZE) {
      e.kd += 1;
      depense += COUTS.barriere;
    }
    if (d3 === 0 && w === 6) {
      // La barrière de Mme Lamboley se voit : cinq autres familles demandent la même.
      e.ka += 5;
      depense += 5 * COUTS.barriere;
    }
    if (w === 11) {
      if (d6 === 0) {
        // Pendant l'épidémie, faute de bras : des barrières pour les résidents agités.
        e.ka += 4;
        depense += 4 * COUTS.barriere;
      } else if (d6 === 1) {
        // Réévaluer : garder celles qui se justifient, lever les autres avec un lit bas et un tapis.
        const levees = Math.max(0, e.kd - 1) + Math.max(0, e.ka - 2);
        e.kd = Math.min(e.kd, 1);
        e.ka = Math.min(e.ka, 2);
        depense += COUTS.reevaluation + levees * COUTS.levee;
      } else if (d6 === 2) {
        e.rebondD = e.kd;
        e.rebondA = e.ka;
        reclamations = Math.round((e.kd + e.ka) * PART_FAMILLES_QUI_RECLAMENT);
        depense += reclamations * RECLAMATION_FAMILLE;
        e.kd = 0;
        e.ka = 0;
      }
    }
    contentionsMax = Math.max(contentionsMax, e.kd + e.ka);

    // Les mesures et ce qu'elles coûtent.
    if (d1 === 1 && w >= 2) depense += w <= 3 ? COUTS.veilleuseInterim : COUTS.veilleuseCdd;
    if (d1 === 2) {
      if (w === 1) depense += COUTS.reunionsAnalyse;
      if (w === 2) depense += COUTS.equipementTournee;
      if (w >= 2) depense += COUTS.tournee;
    }
    if (d2 === 0 && w === 3) depense += COUTS.revueCiblee;
    if (d2 === 2 && w >= 3 && w <= 12) depense += COUTS.revueComplete / 10;
    if ((d3 === 1 || d3 === 2) && w === 5) depense += COUTS.litBas;
    if (d4 === 0 && w >= 7) depense += COUTS.apa;
    if (d4 === 2 && w === 7) depense += COUTS.protecteurs;
    if (d5 === 0 && w === 9) depense += COUTS.capteursTous;
    if (d5 === 0 && w >= 10) depense += COUTS.capteursTousSemaine;
    if (d5 === 1 && w === 9) depense += COUTS.capteursCibles;
    if (d5 === 1 && w >= 10) depense += COUTS.capteursCiblesSemaine;
    for (const a of actifs) if (a.semaine === w) depense += a.imprevu.effet.cout ?? 0;
    mesures += depense;
    const surveillance = (e.kd + e.ka) * COUT_CONTENTION;

    // Les chutes de la semaine, et les fractures qu'elles portent.
    const facteur = facteurPsychotrope(d2!, accepte, w);
    let mult = (w >= DEBUT_HIVER ? HIVER : 1) * n.chutes;
    for (const a of actifs) mult *= a.imprevu.effet.tout ?? 1;
    const c = chutesDeLaSemaine(chemin, w, e, facteur, {
      nuit: actifs.reduce((x, a) => x * (a.imprevu.effet.nuit ?? 1), 1),
      matin: actifs.reduce((x, a) => x * (a.imprevu.effet.matin ?? 1), 1),
      autres: actifs.reduce((x, a) => x * (a.imprevu.effet.autres ?? 1), 1),
    });
    const nuitW = c.nuit * mult;
    const chutes = c.total * mult;
    const risque = c.fractures * mult;
    const fractures = fracturesTirees(risque, n.fracture);
    attendues += risque;
    for (let k = 0; k < fractures; k += 1) {
      detail.push({
        semaine: w,
        barriere: n.qui < c.barriere / Math.max(1e-9, c.fractures),
        rang: detail.length + 1,
      });
    }
    chutesCumul += chutes;
    chutesNuit += nuitW;
    fracturesCumul += fractures;

    // La plainte du fils de Mme Lamboley arrive en semaine 5.
    const plainteSemaine = aPlainte && w === 5;
    graves += fractures + (plainteSemaine ? 1 : 0);
    let inspecte = 0;
    if (!inspection && graves >= SEUIL_INSPECTION) {
      inspection = w;
      inspecte = INSPECTION + (e.kd + e.ka) * INJONCTION_PAR_CONTENTION;
      coutInspection = inspecte;
    }

    // La marche perdue : les barrières en plus, le fauteuil ; l'activité la rend en partie.
    e.perte += (0.02 * Math.max(0, e.kd - CONTENTIONS_DEPART.douze)) / DOUZE;
    if (d4 === 1 && w >= 7) e.perte += 0.02;
    if (d4 === 0 && w >= 9) e.perte = Math.max(0, e.perte - 0.01);
    e.perte = borne(e.perte, 0, 0.5);

    const coutSemaine =
      depense +
      surveillance +
      Math.max(0, chutes - fractures) * COUT_CHUTE +
      fractures * COUT_FRACTURE * c.gravite +
      (plainteSemaine ? PLAINTE_ARS : 0) +
      inspecte;
    cout += coutSemaine;
    coutCumule += coutSemaine;

    semaines.push({
      chutes,
      chutesNuit: nuitW,
      chutesCumul,
      fractures,
      fracturesCumul,
      risque,
      contentions: e.kd + e.ka,
      cout,
      coutCumule,
    });
  }

  // Le risque laissé : les fractures attendues d'une semaine de janvier, avec ce qui est en place
  // (la semaine « 14 », hors hiver, hors hasard).
  const fin = chutesDeLaSemaine(
    chemin,
    SEMAINES + 1,
    e,
    facteurPsychotrope(d2!, accepte, SEMAINES),
  );
  const risqueFinal = fin.fractures;
  const risqueLaisse = risqueFinal * fin.gravite * SEMAINES * COUT_FRACTURE;
  const coutTotal = coutCumule + risqueLaisse;
  return {
    semaines,
    objectif: -coutTotal,
    coutTotal,
    coutTrimestre: coutCumule,
    risqueLaisse,
    risqueFinal,
    mesures,
    chutes: chutesCumul,
    chutesNuit,
    fractures: fracturesCumul,
    fracturesDetail: detail,
    fracturesAttendues: attendues,
    plainte: aPlainte,
    inspection,
    coutInspection,
    medecinAccepte: accepte,
    contentionsFin: e.kd + e.ka,
    reclamations,
    contentionsMax,
    chutesAttendues: CHUTES_ATTENDUES,
  };
}

/** Ce qui s'est passé pendant des semaines : les fractures, la plainte, l'inspection, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    fractures: t.fracturesDetail.filter((f) => dans(f.semaine)),
    plainte: t.plainte && dans(5),
    inspection: t.inspection > 0 && dans(t.inspection),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureChutes {
  chutes: number | null;
  chutesCumul: number | null;
  fractures: number | null;
  contentions: number | null;
  cout: number | null;
  /** Le repère à date : 30 chutes au plus sur le trimestre, au prorata. */
  objectifADate: number | null;
  /** Lu pour les messages. */
  chutesNuit: number | null;
  plainte: number | null;
  inspection: number | null;
}

/** Ce qu'Ernestine lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureChutes {
  if (semaine === 0) {
    return {
      chutes: TOTAL_ETE / SEMAINES,
      chutesCumul: 0,
      fractures: 0,
      contentions: CONTENTIONS_DEPART.douze + CONTENTIONS_DEPART.autres,
      cout: 0,
      objectifADate: 0,
      chutesNuit: NUIT_ETE / SEMAINES,
      plainte: 0,
      inspection: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    chutes: s.chutes,
    chutesCumul: s.chutesCumul,
    fractures: s.fracturesCumul,
    contentions: s.contentions,
    cout: s.coutCumule,
    objectifADate: (OBJECTIF_CHUTES * semaine) / SEMAINES,
    chutesNuit: s.chutesNuit,
    plainte: t.plainte && semaine >= 5 ? 1 : 0,
    inspection: t.inspection > 0 && semaine >= t.inspection ? 1 : 0,
  };
}
