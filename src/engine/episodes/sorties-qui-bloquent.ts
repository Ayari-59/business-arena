/**
 * LES SORTIES QUI BLOQUENT — le modèle de la clinique du Val Solvanne.
 *
 * Une clinique de soins médicaux et de réadaptation (SMR) de 120 lits, à
 * Dijon, gérée par l'Association Solvanne. Les services de court séjour du
 * centre hospitalier universitaire et des cliniques de l'agglomération lui
 * adressent des patients après une fracture, un accident vasculaire, une
 * hospitalisation qui a fait perdre l'autonomie. La durée moyenne de séjour
 * est passée de 28 à 34 jours, le court séjour attend dix jours une place,
 * et le conseil d'administration propose d'ouvrir quinze lits. Treize
 * semaines, d'octobre à décembre, six décisions. Quatre mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · LA DURÉE DE SÉJOUR S'ALLONGE EN AVAL. Les soins durent toujours quatre
 *     semaines ; c'est l'attente qui a grandi. Quatre patients sur dix ont
 *     besoin, à leur sortie, d'une place en EHPAD, d'un SSIAD ou d'une aide à
 *     domicile, d'un domicile aménagé ou d'une mesure de protection ; tant
 *     qu'elle n'est pas prête, ils restent, médicalement sortants, dans un
 *     lit. Leur attente a deux parts : le dossier (demande d'admission en
 *     EHPAD, APA, devis d'aménagement, saisine du juge), qu'on peut lancer dès
 *     l'entrée, et la place, que seuls l'aval et les conventions donnent. Plus
 *     on envoie de patients vers un aval plein, plus l'attente de place
 *     s'allonge : quinze lits de plus remplissent l'aval d'autant, et se
 *     remplissent eux-mêmes des mêmes séjours bloqués.
 *   · UNE JOURNÉE BLOQUÉE EST UNE ADMISSION REFUSÉE. Les lits sont pleins :
 *     chaque lit qu'occupe un patient médicalement sortant manque au patient
 *     que le court séjour voudrait adresser. La recette d'activité suit les
 *     semaines de soins ; une journée d'attente ne rapporte presque rien. Et
 *     quand le délai de réponse s'allonge, les services prescripteurs
 *     prennent l'habitude d'adresser ailleurs (le moment où chacun bascule
 *     est tiré au hasard, et vient d'autant plus tôt que le délai est long).
 *   · LES CONVENTIONS AVEC L'AVAL AGISSENT TARD, ET PAS TOUJOURS. Les EHPAD et
 *     le SSIAD de l'association, ou ceux d'autres gestionnaires, peuvent
 *     réserver des places aux sortants de la clinique ; ils acceptent ou non,
 *     et les places n'arrivent que des semaines plus tard. Une place réservée
 *     n'attend pas : sans dossier prêt, elle part au suivant de la liste de
 *     l'EHPAD, et la réservation se paie quand même.
 *   · SORTIR TROP TÔT FAIT REVENIR LE PATIENT. Renvoyer chez lui un patient
 *     dont le domicile ou l'aide ne sont pas prêts, ou raccourcir les soins
 *     pour tenir une durée cible, libère un lit tout de suite ; une partie de
 *     ces patients repasse par les urgences du CHU. Une réhospitalisation
 *     coûte, et chacune abîme la confiance des services du CHU.
 *
 * Le trimestre est jugé en euros : le résultat d'activité de la clinique
 * (recettes d'activité nettes des charges variables, moins ce que coûtent
 * les mesures prises, lits, personnel, réservations, et les
 * réhospitalisations), en écart à l'EPRD, moins la valeur des adressages
 * perdus : un service prescripteur qui a pris l'habitude d'adresser ailleurs
 * envoie moins de patients pendant au moins un an, et la direction
 * financière l'estime en recettes perdues.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LA CLINIQUE.
 * ------------------------------------------------------------------------- */
export const LITS = 120;
/** L'aile fermée en 2021, toujours autorisée par l'ARS : quinze lits qu'on peut rouvrir. */
export const LITS_AILE = 15;
/** Le taux d'occupation qu'on tient au mieux : le temps de préparer la chambre entre deux patients. */
export const OCCUPATION = 0.97;
export const CAPACITE = LITS * OCCUPATION;
/** La durée des soins proprement dits, en jours : elle n'a pas bougé. */
export const DMS_MEDICALE = 28;
/** La durée moyenne de séjour d'il y a deux ans. */
export const DMS_ANCIENNE = 28;
/** La part des patients qui ont besoin d'une solution d'aval pour sortir. */
export const PART_AVAL = 0.42;

/** La recette d'activité moyenne d'un séjour, et ses charges variables. */
export const RECETTE_SEJOUR = 4600;
export const CHARGES_SEJOUR = 600;
/** Une semaine de soins : la recette d'activité nette d'un séjour, répartie sur ses quatre semaines. */
export const RECETTE_SEMAINE = (RECETTE_SEJOUR - CHARGES_SEJOUR) / (DMS_MEDICALE / 7);

/* ---------------------------------------------------------------------------
 * L'AVAL : pourquoi les patients médicalement sortants attendent.
 * ------------------------------------------------------------------------- */
export type Motif = "ehpad" | "domicileAide" | "amenagement" | "protection";
export const MOTIFS: readonly Motif[] = ["ehpad", "domicileAide", "amenagement", "protection"];

export interface Aval {
  nom: string;
  /** La part des patients qui ont besoin d'un aval et attendent celui-ci. */
  part: number;
  /** Les patients qui l'attendent, le jour de la revue des dossiers. */
  depart: number;
  /** L'attente du dossier, en semaines : demande, pièces, accord de la famille, financement. */
  dossier: number;
  /** L'attente de la place, ou des travaux, en semaines, une fois le dossier prêt. */
  place: number;
}

export const AVAL: Record<Motif, Aval> = {
  ehpad: { nom: "une place en EHPAD", part: 0.45, depart: 11, dossier: 1, place: 1.44 },
  domicileAide: {
    nom: "un SSIAD ou une aide à domicile",
    part: 0.25,
    depart: 4,
    dossier: 0.6,
    place: 1,
  },
  amenagement: {
    nom: "l'aménagement de leur domicile",
    part: 0.2,
    depart: 4,
    dossier: 0.5,
    place: 1.5,
  },
  protection: { nom: "une mesure de protection", part: 0.1, depart: 2, dossier: 2, place: 0 },
};

/** Les patients médicalement sortants, le jour de la revue des dossiers. */
export const BLOQUES_DEPART = MOTIFS.reduce((s, m) => s + AVAL[m].depart, 0);
/** Les patients en soins au départ : le reste des lits occupés. */
export const EN_SOINS_DEPART = CAPACITE - BLOQUES_DEPART;
/** Les admissions d'une semaine au départ : ce que les sorties de soins libèrent. */
export const ADMISSIONS_DEPART = EN_SOINS_DEPART / (DMS_MEDICALE / 7);
/** Les journées bloquées d'un trimestre au rythme du départ : la prévision de la semaine 1. */
export const JOURNEES_BLOQUEES_RYTHME = BLOQUES_DEPART * 7 * SEMAINES;
/** La durée moyenne de séjour au départ : les soins, plus l'attente. */
export const DMS_DEPART = DMS_MEDICALE + (7 * BLOQUES_DEPART) / ADMISSIONS_DEPART;

/** Plus on adresse de patients à un aval plein, plus l'attente d'une place s'allonge. */
export const CONGESTION = 1.5;

/* ---------------------------------------------------------------------------
 * LES PRESCRIPTEURS : les services qui adressent les patients.
 * ------------------------------------------------------------------------- */
export interface Prescripteur {
  id: string;
  nom: string;
  part: number;
  chu: boolean;
}

export const PRESCRIPTEURS: readonly Prescripteur[] = [
  { id: "ortho", nom: "l'orthopédie du CHU", part: 0.28, chu: true },
  { id: "neuro", nom: "la neurologie du CHU", part: 0.2, chu: true },
  { id: "geriatrie", nom: "la gériatrie aiguë du CHU", part: 0.22, chu: true },
  { id: "interne", nom: "la médecine interne du CHU", part: 0.12, chu: true },
  { id: "valendons", nom: "la clinique chirurgicale des Valendons", part: 0.18, chu: false },
];

/** Le délai de réponse au départ, en jours : le temps qu'un patient adressé attend une place. */
export const DELAI_DEPART = 10;
/** Chaque semaine, la part des demandes en attente que le court séjour place ailleurs. */
export const ABANDON = 0.18;
/** Les demandes d'admission d'une semaine au départ. */
export const DEMANDES_DEPART =
  ADMISSIONS_DEPART + (ABANDON * (DELAI_DEPART / 7) * ADMISSIONS_DEPART) / (1 - ABANDON);
export const ATTENTE_DEPART = (DELAI_DEPART / 7) * ADMISSIONS_DEPART;
/** Le délai que les services acceptent sans chercher ailleurs, en jours. */
export const DELAI_TOLERE = 7;
/** Le risque hebdomadaire de basculer, par jour de délai au-delà du délai toléré. */
export const RISQUE_PAR_JOUR = 0.02;
/** Ce qu'une réhospitalisation ajoute au risque qu'un service du CHU bascule. */
export const RISQUE_PAR_REHOSPITALISATION = 0.05;
/** Un service qui a basculé n'adresse plus que 60 % de ses demandes. */
export const ADRESSAGE_RESTANT = 0.6;
/** La valeur d'un service qui adresse ailleurs : un an de recettes perdues, estimé par la direction financière. */
export const VALEUR_ADRESSEUR = 30000;

/* ---------------------------------------------------------------------------
 * LES RÉHOSPITALISATIONS.
 * ------------------------------------------------------------------------- */
/** Un patient sorti avant que son domicile ou son aide soient prêts revient une fois sur trois. */
export const REHOSP_SORTIE_PREMATUREE = 0.33;
/** Un patient aux soins raccourcis de deux jours revient une fois sur quatre. */
export const REHOSP_SOINS_RACCOURCIS = 0.25;
/** Ce qu'une réhospitalisation coûte à la clinique, estimé par la direction financière. */
export const COUT_REHOSPITALISATION = 2800;

/* ---------------------------------------------------------------------------
 * LE BUDGET.
 * ------------------------------------------------------------------------- */
/**
 * L'EPRD du trimestre : le résultat d'activité attendu, construit sur une durée moyenne de
 * séjour de 33 jours (98,8 patients en soins sur les 116,4 lits occupés).
 */
export const DMS_EPRD = 33;
export const EPRD = 1284000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, rien ne bouge et les lits restent bloqués. */
export const PERTE_PAR_JOUR = 1500;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  strategie: 0,
  stock: 1,
  conventions: 2,
  domicile: 3,
  hiver: 4,
  fetes: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 3, 3] as const;

/** Rouvrir l'aile : quinze lits à partir de la semaine 5, le temps de recruter. */
export const AILE = {
  ouverture: 5,
  remiseEnEtat: 12000,
  /** Le personnel des quinze lits, dont une bonne part en intérim les premiers mois. */
  personnel: 15500,
} as const;

/** Préparer la sortie dès l'entrée : date de sortie prévisionnelle, assistante sociale, staff de sortie. */
export const PREPARATION = {
  /** L'attente du dossier est réduite de 60 % pour les patients concernés. */
  dossier: 0.6,
  /** L'ergothérapeute visite le domicile dans le premier mois : les travaux commencent plus tôt. */
  amenagement: 0.15,
  /** Le renfort d'une demi-assistante sociale et le temps du staff. */
  cout: 750,
} as const;

/** La durée de séjour cible imposée aux médecins : 28 jours. */
export const DMS_CIBLE = {
  /** Les soins raccourcis de deux jours en moyenne. */
  soins: 26,
  /** La part des patients en attente d'une aide ou d'un aménagement poussés vers la sortie chaque semaine. */
  poussee: 0.25,
} as const;

/** La cellule de sortie : les dossiers en attente repris un par un, semaines 4 à 7. */
export const CELLULE = { de: 4, a: 7, acceleration: 0.7, cout: 3500 } as const;
/** Les patients qui attendent une aide ou un aménagement, renvoyés chez eux en semaine 4. */
export const RETOUR_FAMILLE = { semaine: 4, part: 0.7 } as const;
/** L'hébergement temporaire en EHPAD en sortie d'hospitalisation : entre 1 et 4 places en octobre. */
export const TEMPORAIRE = { semaine: 4, min: 1, max: 4 } as const;

/** Les conventions avec l'aval (troisième décision). */
export const CONVENTIONS = {
  /** Places prioritaires dans les EHPAD et au SSIAD de l'association, négociées avec leurs directeurs. */
  interne: {
    /** Les directeurs d'EHPAD ont leurs propres listes d'attente : une fois sur deux, ils acceptent. */
    accord: 0.5,
    debut: 7,
    ehpad: 0.5,
    domicileAide: 0.45,
    cout: 1000,
  },
  /** La même convention, imposée par la directrice générale après le comité de direction. */
  imposee: {
    debut: 9,
    /** Des directeurs contraints réservent moins de places qu'ils n'en libèrent. */
    efficacite: 0.8,
  },
  /** Des EHPAD et un SSIAD d'autres gestionnaires : plus chers pour les familles, moins de places. */
  externe: {
    accord: 0.6,
    debut: 8,
    ehpad: 0.35,
    domicileAide: 0.3,
    cout: 1600,
  },
  /** Sans dossier prêt, une place réservée sur deux part au suivant de la liste. */
  sansPreparation: 0.5,
} as const;

/** L'aménagement provisoire : ergothérapeute à domicile, aides techniques louées, aide à domicile. */
export const PROVISOIRE = { semaine: 8, travaux: 0.15, cout: 500 } as const;
/** Renvoyer chez eux sans attendre l'aménagement, à partir de la semaine 8. */
export const SANS_AMENAGEMENT = { semaine: 8, attente: 0.3 } as const;

/** L'hiver : l'épidémie de grippe et les fêtes. */
export const HIVER = {
  de: 10,
  /** Le court séjour en tension adresse 20 % de demandes en plus. */
  demandes: 1.2,
  /** Les EHPAD touchés par la grippe admettent moins vite. */
  ehpad: 1.25,
  /** Pendant les fêtes, semaines 12 et 13, les EHPAD et les SSIAD admettent au ralenti. */
  fetes: 12,
  ralentiFetes: 1.5,
} as const;

/** Les lits de renfort hivernal en intérim, semaines 10 à 13. */
export const RENFORT = { lits: 10, remiseEnEtat: 5000, personnel: 12500 } as const;
/** Accepter des patients encore instables : environ un sur seize repart au CHU. */
export const INSTABLES = { retransferts: 1 / 16, risqueChu: 0.5 } as const;
/** Sortir avant midi et le samedi, et réserver chaque jour deux places au CHU. */
export const FLUIDITE = { occupation: 0.99, risqueChu: 0.6, cout: 900 } as const;

/** Fermer douze lits pendant les fêtes, comme chaque année. */
export const FERMETURE = { lits: 12, economie: 9000 } as const;
/** Les sorties programmées avant les fêtes : permanence de l'assistante sociale, admissions avancées. */
export const SORTIES_PROGRAMMEES = { ralenti: 0.85, cout: 1500 } as const;
/** Faire sortir pour Noël les patients presque prêts. */
export const NOEL = { part: 0.4, soins: 0.1 } as const;

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
    admissions?: number;
    sorties?: number;
    ehpad?: number;
    dossier?: number;
    demandes?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gastro",
    titre: "Gastro-entérite dans une unité",
    de: "Aude Lantenois",
    role: "Responsable qualité et gestion des risques",
    texte:
      "Cas groupés de gastro-entérite au deuxième étage : l'unité est fermée aux admissions une semaine, le temps des mesures d'hygiène.",
    duree: 1,
    effet: { admissions: 0.6 },
  },
  {
    id: "carneo",
    titre: "Panne du dossier de soins Carnéo",
    de: "Systèmes d'information",
    role: "Siège de l'association",
    texte:
      "Carnéo est tombé deux jours : transmissions sur papier, ordonnances de sortie et courriers ressaisis. Les sorties de la semaine ont glissé.",
    duree: 1,
    effet: { sorties: 0.75 },
  },
  {
    id: "ehpadGrippe",
    titre: "Un EHPAD de l'association suspend ses admissions",
    de: "Edmée Faucompré",
    role: "Directrice de l'EHPAD de Dijon-Montchapet",
    texte:
      "Cas de grippe chez nos résidents : sur avis de l'ARS, nous suspendons les admissions deux semaines.",
    duree: 2,
    effet: { ehpad: 1.6 },
  },
  {
    id: "assistante",
    titre: "L'assistante sociale en arrêt",
    de: "Ressources humaines",
    role: "Siège de l'association",
    texte:
      "Ramatoulaye Soumaré est en arrêt deux semaines. Le service social du siège assure une permanence d'une demi-journée par semaine.",
    duree: 2,
    effet: { dossier: 1.6 },
  },
  {
    id: "afflux",
    titre: "Afflux au CHU après un accident",
    de: "Sabri Mabanza",
    role: "Cadre de la cellule de gestion des lits, CHU",
    texte:
      "Accident d'autocar sur l'A31 : nos services de chirurgie sont pleins, nous vous adressons tout ce qui peut l'être pendant deux semaines.",
    duree: 2,
    effet: { demandes: 1.3 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Les demandes d'admission, rapportées à leur moyenne. */
  demandes: number;
  /** Les places d'aval qui se libèrent, rapportées à leur moyenne. */
  aval: number;
  /** Les réhospitalisations, rapportées à leur probabilité. */
  rehosp: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le seuil de chaque service prescripteur : il bascule quand son risque cumulé le dépasse. */
  seuils: readonly number[];
  /** Les directeurs d'EHPAD et le SSIAD de l'association acceptent-ils la convention ? */
  uInterne: number;
  /** Les gestionnaires hors association acceptent-ils ? */
  uExterne: number;
  /** Les places d'hébergement temporaire libres en octobre. */
  placesTemporaires: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000861 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let w = 1; w <= SEMAINES; w += 1) {
    semaines.push({
      demandes: Math.min(1.2, Math.max(0.8, 1 + 0.07 * gauss(r))),
      aval: Math.min(1.35, Math.max(0.65, 1 + 0.15 * gauss(r))),
      rehosp: Math.min(2.5, Math.max(0.1, 1 + 0.6 * gauss(r))),
    });
  }
  const seuils = PRESCRIPTEURS.map(() => -Math.log(1 - r()));
  const uInterne = r();
  const uExterne = r();
  const placesTemporaires =
    TEMPORAIRE.min + Math.floor(r() * (TEMPORAIRE.max - TEMPORAIRE.min + 1));
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, seuils, uInterne, uExterne, placesTemporaires, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La semaine où la convention interne prend effet, ou 0 si les directeurs d'EHPAD la refusent. */
export function debutInterne(chemin: readonly number[], graine: number): number {
  const c = chemin[D.conventions];
  if (c === 2) return CONVENTIONS.imposee.debut;
  if (c !== 0) return 0;
  return hasard(graine).uInterne < CONVENTIONS.interne.accord ? CONVENTIONS.interne.debut : 0;
}

/** La semaine où la convention hors association prend effet, ou 0 si elle est refusée. */
export function debutExterne(chemin: readonly number[], graine: number): number {
  if (chemin[D.conventions] !== 1) return 0;
  return hasard(graine).uExterne < CONVENTIONS.externe.accord ? CONVENTIONS.externe.debut : 0;
}

/** Une place réservée sert-elle ? Pleinement si le dossier est prêt dès l'entrée, une fois sur deux sinon. */
export const efficaciteDesPlaces = (chemin: readonly number[]) =>
  chemin[D.strategie] === 1 ? 1 : CONVENTIONS.sansPreparation;

/** Le risque hebdomadaire qu'un service bascule, selon le délai de réponse en jours. */
export const risqueDeBascule = (delai: number) =>
  RISQUE_PAR_JOUR * Math.max(0, delai - DELAI_TOLERE);

export type Semaine = {
  /** Les patients médicalement sortants qui attendent leur aval, en fin de semaine. */
  bloques: number;
  /** Les patients en soins. */
  enSoins: number;
  admissions: number;
  /** Le délai de réponse aux services prescripteurs, en jours. */
  delai: number;
  /** La durée moyenne de séjour, en jours : les soins, plus l'attente. */
  dms: number;
  demandes: number;
  /** Les demandes que le court séjour a placées ailleurs dans la semaine. */
  adresseesAilleurs: number;
  rehospitalisations: number;
  /** Les lits installés. */
  lits: number;
  /** Ce que la semaine apporte au résultat : recettes nettes, moins les coûts, les réhospitalisations et les adressages perdus. */
  contribution: number;
  /** Le résultat d'activité cumulé depuis le début du trimestre. */
  resultat: number;
  /** Les journées bloquées cumulées depuis le début du trimestre. */
  journeesBloquees: number;
  prescripteursPerdus: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le résultat d'activité en écart à l'EPRD, adressages perdus compris : positif, au-dessus de l'EPRD. */
  objectif: number;
  resultat: number;
  recettes: number;
  /** Ce qu'ont coûté les mesures : lits, personnel, réservations, renforts. */
  couts: number;
  rehospitalisations: number;
  coutRehospitalisations: number;
  journeesBloquees: number;
  admissions: number;
  /** Les services prescripteurs qui ont pris l'habitude d'adresser ailleurs, et quand. */
  perdus: readonly { id: string; semaine: number }[];
  valeurPerdue: number;
  debutInterne: number;
  debutExterne: number;
  placesTemporaires: number;
  dmsFinale: number;
  delaiFinal: number;
  bloquesFinal: number;
  dmsMoyenne: number;
  /** Les journées bloquées d'un trimestre au rythme de la revue des dossiers. */
  journeesAuRythme: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const rampe = (w: number, de: number, semaines: number) => borne((w - de + 1) / semaines, 0, 1);
const parMotif = (f: (m: Motif) => number) =>
  Object.fromEntries(MOTIFS.map((m) => [m, f(m)])) as Record<Motif, number>;

/** Le flux hebdomadaire vers chaque aval au départ. */
export const fluxDepart = (m: Motif) => ADMISSIONS_DEPART * PART_AVAL * AVAL[m].part;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, , d4, d5, d6] = chemin;
  const interne = debutInterne(chemin, graine);
  const externe = debutExterne(chemin, graine);
  const efficacite = efficaciteDesPlaces(chemin);
  const semaines: (Semaine | null)[] = [null];

  let enSoins = EN_SOINS_DEPART;
  // Deux cohortes : les patients qui attendaient le jour de la revue, dont personne n'a préparé
  // la sortie à l'entrée, et ceux qui deviennent sortants pendant le trimestre.
  const anciens = parMotif((m) => AVAL[m].depart);
  const nouveaux = parMotif(() => 0);
  /** Les flux vers chaque aval des dernières semaines : ce qui encombre l'aval. */
  const historique = Object.fromEntries(
    MOTIFS.map((m) => [m, [fluxDepart(m), fluxDepart(m)]]),
  ) as Record<Motif, number[]>;
  let attente = ATTENTE_DEPART;
  let admissionsRecentes = [ADMISSIONS_DEPART, ADMISSIONS_DEPART];
  const risques = PRESCRIPTEURS.map(() => 0);
  const perdus: { id: string; semaine: number }[] = [];
  let rehospAVenir = 0;
  let resultat = 0;
  let recettes = 0;
  let couts = 0;
  let rehospTotal = 0;
  let journeesBloquees = 0;
  let admissionsTotal = 0;
  let valeurPerdue = 0;
  let dmsSomme = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = (k: keyof Imprevu["effet"]) =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[k] ?? 1), 1);
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // Les lits, et le taux d'occupation qu'on tient.
    let lits = LITS;
    if (d1 === 0 && w >= AILE.ouverture) lits += LITS_AILE * rampe(w, AILE.ouverture, 2);
    if (d5 === 0 && w >= HIVER.de) lits += RENFORT.lits * rampe(w, HIVER.de, 2);
    if (d6 === 0 && w >= HIVER.fetes) lits -= FERMETURE.lits;
    let occupation = OCCUPATION;
    if (d5 === 2 && w >= HIVER.de) {
      // Sans date de sortie prévisionnelle, les sorties du matin et du samedi s'organisent mal.
      occupation += (FLUIDITE.occupation - OCCUPATION) * (d1 === 1 ? 1 : 0.5);
    }
    const capacite = lits * occupation;

    // Les soins : chaque semaine, un quart des patients en soins devient médicalement sortant.
    const cible = d1 === 2 && w >= 2;
    const dureeSoins = cible ? DMS_CIBLE.soins : DMS_MEDICALE;
    let prets = enSoins / (dureeSoins / 7);
    let raccourcis = cible ? prets * (1 - DMS_CIBLE.soins / DMS_MEDICALE) : 0;
    if (d6 === 2 && w >= HIVER.fetes) {
      const noel = enSoins * NOEL.soins;
      prets += noel;
      raccourcis += noel;
    }
    prets = Math.min(prets, enSoins);
    enSoins -= prets;
    const versAval = prets * PART_AVAL;

    // L'aval : le dossier, puis la place.
    const prep = d1 === 1 ? rampe(w, 2, 4) : 0;
    let premature = 0;
    let bloquesTotal = 0;
    for (const m of MOTIFS) {
      const a = AVAL[m];
      const entree = versAval * a.part;
      const hist = historique[m];
      hist.push(entree);
      const recent = hist.slice(-3).reduce((s, x) => s + x, 0) / 3;

      let dossier = a.dossier * effet("dossier");
      if (d2 === 0 && w >= CELLULE.de && w <= CELLULE.a) dossier *= 1 - CELLULE.acceleration;
      let place = a.place;
      if (m === "ehpad" || m === "domicileAide") {
        place *= Math.pow(recent / fluxDepart(m), CONGESTION);
        const contrainte = chemin[D.conventions] === 2 ? CONVENTIONS.imposee.efficacite : 1;
        if (interne && w >= interne) place *= 1 - CONVENTIONS.interne[m] * efficacite * contrainte;
        if (externe && w >= externe) place *= 1 - CONVENTIONS.externe[m] * efficacite;
        if (w >= HIVER.de && m === "ehpad") place *= HIVER.ehpad;
        if (w >= HIVER.fetes) {
          place *= d6 === 1 ? SORTIES_PROGRAMMEES.ralenti : HIVER.ralentiFetes;
        }
        if (m === "ehpad") place *= effet("ehpad");
      }
      if (m === "amenagement" && d4 === 1 && w >= PROVISOIRE.semaine) place *= PROVISOIRE.travaux;
      // Préparée dès l'entrée, la sortie a son dossier prêt plus tôt, et les travaux commencent plus tôt.
      const placeNouveaux =
        m === "amenagement" ? place * (1 - PREPARATION.amenagement * prep) : place;
      const dossierNouveaux = dossier * (1 - PREPARATION.dossier * prep);
      const taux = (d: number, p: number) =>
        Math.min(0.95, (n.aval * effet("sorties")) / Math.max(0.3, d + p));
      let vieux = anciens[m] * (1 - taux(dossier, place));
      let recents = nouveaux[m] * (1 - taux(dossierNouveaux, placeNouveaux));

      // L'hébergement temporaire en EHPAD : une sortie vers un lieu qui accueille et soigne.
      if (d2 === 2 && w === TEMPORAIRE.semaine && m === "ehpad") {
        const pris = Math.min(vieux, h.placesTemporaires);
        vieux -= pris;
        recents -= Math.min(recents, h.placesTemporaires - pris);
      }

      // Les sorties qui n'attendent pas que l'aide ou le domicile soient prêts.
      let pousse = 0;
      const aDomicile = m === "domicileAide" || m === "amenagement";
      const pousser = (part: number) => {
        pousse = 1 - (1 - pousse) * (1 - part);
      };
      if (cible && aDomicile) pousser(DMS_CIBLE.poussee);
      if (d2 === 1 && w === RETOUR_FAMILLE.semaine && aDomicile) pousser(RETOUR_FAMILLE.part);
      if (d4 === 0 && w >= SANS_AMENAGEMENT.semaine && m === "amenagement") {
        pousser(1 - SANS_AMENAGEMENT.attente);
      }
      if (d6 === 2 && w >= HIVER.fetes && aDomicile) pousser(NOEL.part);
      premature += (vieux + recents) * pousse;
      vieux *= 1 - pousse;
      recents *= 1 - pousse;

      // Les nouveaux sortants ; sans attendre l'aménagement, la plupart rentrent tout de suite.
      let arrivent = entree;
      if (d4 === 0 && w >= SANS_AMENAGEMENT.semaine && m === "amenagement") {
        premature += entree * (1 - SANS_AMENAGEMENT.attente);
        arrivent = entree * SANS_AMENAGEMENT.attente;
      }
      anciens[m] = vieux;
      nouveaux[m] = recents + arrivent;
      bloquesTotal += anciens[m] + nouveaux[m];
    }

    // Les réhospitalisations : les sorties prématurées d'une semaine reviennent la suivante.
    let rehosp = rehospAVenir;
    rehospAVenir =
      (premature * REHOSP_SORTIE_PREMATUREE + raccourcis * REHOSP_SOINS_RACCOURCIS) * n.rehosp;

    // Les demandes et les admissions.
    let demandes = 0;
    for (const p of PRESCRIPTEURS) {
      const perdu = perdus.some((x) => x.id === p.id);
      demandes += DEMANDES_DEPART * p.part * (perdu ? ADRESSAGE_RESTANT : 1);
    }
    demandes *= n.demandes * effet("demandes");
    if (w >= HIVER.de) demandes *= HIVER.demandes;
    const libres = Math.max(0, capacite - enSoins - bloquesTotal);
    const admissions = Math.min(libres * effet("admissions"), attente + demandes);
    // Des patients encore instables : une partie repart au CHU dans la semaine.
    const retransferts =
      d5 === 1 && w >= HIVER.de ? admissions * INSTABLES.retransferts * n.rehosp : 0;
    rehosp += retransferts;
    const restent = attente + demandes - admissions;
    const adresseesAilleurs = restent * ABANDON;
    attente = restent - adresseesAilleurs;
    enSoins += admissions - retransferts;
    admissionsRecentes = [...admissionsRecentes.slice(-2), admissions];
    const rythme = Math.max(
      1,
      admissionsRecentes.reduce((s, x) => s + x, 0) / admissionsRecentes.length,
    );
    const delai = (attente / rythme) * 7;

    // Les services prescripteurs : le délai et les réhospitalisations usent leur confiance.
    let perteDeLaSemaine = 0;
    PRESCRIPTEURS.forEach((p, k) => {
      if (perdus.some((x) => x.id === p.id)) return;
      let risque = risqueDeBascule(delai);
      if (p.chu) {
        if (d5 === 1 && w >= HIVER.de) risque *= INSTABLES.risqueChu;
        if (d5 === 2 && w >= HIVER.de) risque *= FLUIDITE.risqueChu;
        risque += RISQUE_PAR_REHOSPITALISATION * rehosp;
      }
      risques[k] = risques[k]! + risque;
      if (risques[k]! > h.seuils[k]!) {
        perdus.push({ id: p.id, semaine: w });
        perteDeLaSemaine += VALEUR_ADRESSEUR;
      }
    });

    // Ce que la semaine coûte.
    if (d1 === 0 && w === 2) cout += AILE.remiseEnEtat;
    if (d1 === 0 && w >= AILE.ouverture) cout += AILE.personnel;
    if (d1 === 1 && w >= 2) cout += PREPARATION.cout;
    if (d2 === 0 && w === CELLULE.de) cout += CELLULE.cout;
    if (interne && w >= interne) cout += CONVENTIONS.interne.cout * (2 - efficacite);
    if (externe && w >= externe) cout += CONVENTIONS.externe.cout * (2 - efficacite);
    if (d4 === 1 && w >= PROVISOIRE.semaine) cout += PROVISOIRE.cout;
    if (d5 === 0 && w === HIVER.de) cout += RENFORT.remiseEnEtat;
    if (d5 === 0 && w >= HIVER.de) cout += RENFORT.personnel;
    if (d5 === 2 && w >= HIVER.de) cout += FLUIDITE.cout;
    if (d6 === 0 && w >= HIVER.fetes) cout -= FERMETURE.economie;
    if (d6 === 1 && w === HIVER.fetes) cout += SORTIES_PROGRAMMEES.cout;

    const recette = enSoins * RECETTE_SEMAINE;
    const coutRehosp = rehosp * COUT_REHOSPITALISATION;
    resultat += recette - cout - coutRehosp;
    recettes += recette;
    couts += cout;
    rehospTotal += rehosp;
    valeurPerdue += perteDeLaSemaine;
    journeesBloquees += bloquesTotal * 7;
    admissionsTotal += admissions;

    const dms = dureeSoins + (7 * bloquesTotal) / Math.max(1, prets);
    dmsSomme += dms;
    semaines.push({
      bloques: bloquesTotal,
      enSoins,
      admissions,
      delai,
      dms,
      demandes,
      adresseesAilleurs,
      rehospitalisations: rehosp,
      lits,
      contribution: recette - cout - coutRehosp - perteDeLaSemaine,
      resultat,
      journeesBloquees,
      prescripteursPerdus: perdus.length,
    });
  }

  const derniere = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: resultat - EPRD - valeurPerdue,
    resultat,
    recettes,
    couts,
    rehospitalisations: rehospTotal,
    coutRehospitalisations: rehospTotal * COUT_REHOSPITALISATION,
    journeesBloquees,
    admissions: admissionsTotal,
    perdus,
    valeurPerdue,
    debutInterne: interne,
    debutExterne: externe,
    placesTemporaires: chemin[D.stock] === 2 ? h.placesTemporaires : 0,
    dmsFinale: derniere.dms,
    delaiFinal: derniere.delai,
    bloquesFinal: derniere.bloques,
    dmsMoyenne: dmsSomme / SEMAINES,
    journeesAuRythme: JOURNEES_BLOQUEES_RYTHME,
  };
}

/** Ce qui s'est passé pendant des semaines : conventions, services perdus, réhospitalisations, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const rehosp = t.semaines
    .slice(de, a + 1)
    .reduce((s, x) => s + (x ? x.rehospitalisations : 0), 0);
  return {
    interne: t.debutInterne > 0 && dans(t.debutInterne),
    externe: t.debutExterne > 0 && dans(t.debutExterne),
    perdus: t.perdus.filter((p) => dans(p.semaine)),
    rehosp,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureClinique {
  resultat: number | null;
  eprdADate: number | null;
  bloques: number | null;
  dms: number | null;
  delai: number | null;
  admissions: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  journeesBloquees: number | null;
  prescripteursPerdus: number | null;
  rehospitalisations: number | null;
  lits: number | null;
  demandes: number | null;
}

/** Ce que Médéric lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureClinique {
  if (semaine === 0) {
    return {
      resultat: 0,
      eprdADate: 0,
      bloques: BLOQUES_DEPART,
      dms: DMS_DEPART,
      delai: DELAI_DEPART,
      admissions: ADMISSIONS_DEPART,
      journeesBloquees: 0,
      prescripteursPerdus: 0,
      rehospitalisations: 0,
      lits: LITS,
      demandes: DEMANDES_DEPART,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    resultat: s.resultat,
    eprdADate: (EPRD * semaine) / SEMAINES,
    bloques: s.bloques,
    dms: s.dms,
    delai: s.delai,
    admissions: s.admissions,
    journeesBloquees: s.journeesBloquees,
    prescripteursPerdus: s.prescripteursPerdus,
    rehospitalisations: t.semaines
      .slice(1, semaine + 1)
      .reduce((x, y) => x + (y ? y.rehospitalisations : 0), 0),
    lits: s.lits,
    demandes: s.demandes,
  };
}
