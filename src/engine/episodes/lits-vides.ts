/**
 * LES LITS QUI RESTENT VIDES — le modèle des admissions de l'EHPAD de Beaune.
 *
 * Quatre-vingt-huit places, un taux d'occupation tombé à 91 %, huit lits vides
 * en moyenne et soixante noms sur la liste d'attente. Le siège parle de baisser
 * le prix de journée ou de lancer une campagne de publicité. Janvier à mars :
 * les épidémies d'hiver libèrent des chambres, les admissions ralentissent.
 * Six décisions. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · UN LIT VIDE EST UN DÉLAI, PAS UN MANQUE DE DEMANDE. Entre la libération
 *     d'une chambre et l'entrée suivante, il s'écoule 52 jours, qui se
 *     décomposent étape par étape : remise en état (5), attente de la
 *     commission d'admission mensuelle (15), appels de la liste jusqu'à trouver
 *     une personne qui veut entrer (12), dossier incomplet (9), visite de
 *     préadmission (7), date d'entrée (4). Le nombre moyen de lits vides est le
 *     nombre de chambres libérées par semaine multiplié par ce délai (en
 *     semaines) : raccourcir le délai remplit, quand le prix et la notoriété
 *     n'y touchent pas. Chaque journée vide coûte le tarif hébergement et le
 *     tarif dépendance non facturés, 94 € ; le forfait soins de l'ARS ne bouge
 *     pas à court terme.
 *   · LA LISTE D'ATTENTE EST GONFLÉE. Sur soixante inscrits, dix veulent et
 *     peuvent entrer maintenant ; les autres ont une place ailleurs, ne veulent
 *     pas entrer avant l'été, sont partis, ou relèvent d'une unité que
 *     l'établissement n'a pas. Tant qu'on ne l'appelle pas, chaque chambre
 *     libérée coûte deux jours par inscrit qui ne viendra pas. L'appeler coûte
 *     du temps, et révèle que la vraie réserve est mince : ce sont les
 *     prescripteurs qui la remplissent.
 *   · ADMETTRE VITE N'EST PAS ADMETTRE SANS ÉVALUER. Une admission faite sur
 *     dossier seul, en sortie d'hospitalisation, dépasse trois fois sur dix ce
 *     que l'unité peut accompagner : renfort de nuit en intérim, chute,
 *     réorientation après un mois, et la chambre se libère de nouveau. Une
 *     évaluation sous 72 heures garde presque toute la vitesse sans ce risque.
 *     Chaque admission tire son propre sort, d'avance.
 *   · ORCHIDIA OUVRE À BEAUNE EN FÉVRIER, et elle répond aux prescripteurs en
 *     48 heures. Elle est plus chère : baisser le prix ne joue que sur la
 *     minorité de familles qui comparent, et se paie sur toutes les journées
 *     des places à tarif libre. Ce qu'Orchidia prend, ce sont les demandes de
 *     l'hôpital auxquelles on répond trop tard, et les candidats qui attendent.
 *     Une convention avec l'hôpital vaut d'autant plus que la réponse en 72
 *     heures est tenable ; Orchidia a d'autant plus de chances de signer la
 *     sienne que vous répondez lentement.
 *
 * Le hasard tire, d'avance : les sorties de chaque semaine, un ou deux
 * imprévus, la réponse de l'hôpital à une convention, la convention
 * d'Orchidia, l'extension de l'épidémie de grippe, et le sort de chaque
 * admission (dépasse-t-elle ce que l'unité peut accompagner ?).
 *
 * L'OBJECTIF, en euros : les recettes d'hébergement et de dépendance du
 * trimestre, moins ce que coûtent les mesures et les admissions inadaptées,
 * plus l'effet sur le trimestre suivant. Cet effet est estimé comme les
 * sources permettent de le faire : on prolonge avril à juin avec les lits
 * vides de fin mars, le délai d'admission atteint (qui reprend la moitié de ce
 * qu'il avait gagné si rien n'est écrit), les sorties de printemps et les
 * candidats qui restent, au prix de journée en vigueur ; on compte ce que ce
 * printemps rapporte de plus qu'un printemps à 91 % d'occupation.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Établissement, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_DU_TRIMESTRE = 91;
export const PLACES = 88;
/** Les places habilitées à l'aide sociale : leur prix de journée est arrêté par le département. */
export const PLACES_ASH = 22;
export const PRIX_ASH = 66;
/** Les places à tarif libre : leur prix est fixé par l'établissement. */
export const PLACES_LIBRES = PLACES - PLACES_ASH;
export const PRIX_LIBRE = 78;
/** Le prix de journée hébergement moyen d'une journée facturée : 75 €. */
export const PRIX_MOYEN = (PLACES_ASH * PRIX_ASH + PLACES_LIBRES * PRIX_LIBRE) / PLACES;
/** Le tarif dépendance moyen d'une journée facturée : ticket modérateur et APA versée à la journée. */
export const DEPENDANCE = 19;
/** Ce que rapporte une journée occupée, et ce que coûte une journée vide : 94 €. */
export const RECETTE_JOUR = PRIX_MOYEN + DEPENDANCE;
/** La baisse que propose le siège, sur les places à tarif libre. */
export const BAISSE = 0.05;
export const BAISSE_PAR_JOUR = PRIX_LIBRE * BAISSE;
/** Ce que la baisse retire en moyenne à une journée facturée : 3,90 € sur les trois quarts des places. */
export const PERTE_BAISSE_JOUR = (BAISSE_PAR_JOUR * PLACES_LIBRES) / PLACES;

export const VIDES_DEPART = 8;
export const TAUX_DEPART = 1 - VIDES_DEPART / PLACES;
export const TAUX_CIBLE = 0.97;
/** L'EPRD prévoyait 95 % d'occupation au premier trimestre, hiver compris. */
export const TAUX_EPRD = 0.95;
export const BUDGET_SEMAINE = PLACES * TAUX_EPRD * 7 * RECETTE_JOUR;
/** Le printemps de référence : avril à juin à 91 % d'occupation, au prix actuel. */
export const PRINTEMPS_A_91 = PLACES * 0.91 * JOURS_DU_TRIMESTRE * RECETTE_JOUR;

/** Le manque à gagner annuel de huit lits vides : la prévision de la semaine 1, en euros. */
export const MANQUE_A_GAGNER = VIDES_DEPART * 365 * RECETTE_JOUR;

/** La liste d'attente telle qu'un appel de chaque inscrit la révèle. */
export const LISTE = {
  inscrits: 60,
  ailleurs: 21,
  pasMaintenant: 14,
  partis: 6,
  horsProfil: 9,
  actifs: 10,
} as const;
export const INACTIFS_DEPART = LISTE.inscrits - LISTE.actifs;

/** Le délai entre la libération d'une chambre et l'entrée suivante, étape par étape, en jours. */
export const ETAPES_DU_DELAI = {
  remise: 5,
  commission: 15,
  appels: 12,
  dossier: 9,
  visite: 7,
  entree: 4,
} as const;
export const DELAI_DEPART = Object.values(ETAPES_DU_DELAI).reduce((s, x) => s + x, 0);
/** Un appel à un inscrit qui ne viendra pas prend deux jours : rappels, familles qui réfléchissent. */
export const JOURS_PAR_APPEL_PERDU = 2;
/** L'appel qui aboutit, et la réponse de la famille. */
export const APPEL_UTILE = 2;
/** Commission chaque semaine, chambre prête en 48 heures. */
export const DELAI_COMMISSION_RAPIDE = 3;
export const DELAI_REMISE_RAPIDE = 2;
/** Le dossier type de la convention, et la fiche simple des médecins traitants. */
export const DELAI_DOSSIER = { convention: 3, reseau: 7 } as const;
/** La visite de préadmission selon la règle retenue en semaine 7 : sur dossier, sous 72 h, telle quelle. */
export const DELAI_VISITE = [0, 3, 7, 7] as const;

/** Les sorties (décès, hospitalisations longues, départs) par semaine, sans imprévu : l'hiver, puis mars. */
export const SORTIES = [
  0, 1.15, 1.15, 1.1, 1.1, 1, 1, 1, 0.95, 0.95, 0.85, 0.85, 0.8, 0.8,
] as const;
export const SORTIES_PRINTEMPS = 0.8;
/** Orchidia Résidences ouvre en semaine 6, début février. */
export const OUVERTURE_ORCHIDIA = 6;
/** Les demandes nouvelles par semaine, avant Orchidia : hôpital, SSIAD et médecins traitants, familles. */
export const DEMANDES = { hopital: 0.5, proximite: 0.3, familles: 0.2 } as const;
/** Ce qui reste des demandes de proximité et des familles une fois Orchidia ouverte. */
export const PART_APRES_ORCHIDIA = 0.7;
/** Ce que la convention ajoute de demandes de l'hôpital, quand la réponse en 72 h est tenue. */
export const RENFORT_CONVENTION = 1.4;
/** Quand la commission reste mensuelle, l'hôpital n'envoie qu'une part de ce qu'il promet. */
export const PART_SANS_REPONSE_RAPIDE = 0.1;
export const DEMANDES_RESEAU = 0.5;
/** L'hôpital accepte la convention environ trois fois sur quatre. */
export const CHANCE_CONVENTION = 0.8;
/** Orchidia signe sa propre convention avec l'hôpital : plus souvent quand vous répondez lentement. */
export const CHANCE_ORCHIDIA = { rapide: 0.3, lent: 0.55 } as const;
/** Les candidats prêts qui renoncent ou vont ailleurs chaque semaine ; plus vite quand l'attente est longue. */
export const ATTRITION = 0.04;
export const ATTRITION_ORCHIDIA = 0.06;
export const DELAI_QUI_FAIT_FUIR = 30;
/** Les inscriptions de précaution, chaque semaine. */
export const INSCRIPTIONS_DE_PRECAUTION = 0.5;

/** Trois admissions sur dix faites sur dossier seul dépassent ce que l'unité peut accompagner. */
export const RISQUE_INADAPTEE = [0.3, 0.04, 0.03, 0.03] as const;
export const RISQUE_AVANT = 0.03;
export const NUITS_DE_RENFORT = 21;
export const NUIT_INTERIM = 400;
/** Trois semaines de renfort de nuit en intérim : 8 400 €. */
export const COUT_INADAPTEE = NUITS_DE_RENFORT * NUIT_INTERIM;
/** Le résident est réorienté vers une unité adaptée au bout de quatre semaines : la chambre se libère. */
export const SEMAINES_AVANT_REORIENTATION = 4;

/** La grippe : l'aile des Tilleuls en semaines 9 et 10 ; une fois sur trois, elle gagne les autres ailes en semaine 11. */
export const GRIPPE = { debut: 9, fin: 10, extension: 11 } as const;
export const CHANCE_EXTENSION = 0.35;
/** Les entrées possibles hors de l'aile touchée. */
export const PART_HORS_TILLEULS = 0.7;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : une demande de l'hôpital partie ailleurs, faute de réponse. */
export const PERTE_PAR_JOUR = 1500;

export const COUTS = {
  /** L'IDEC et le médecin coordonnateur, une heure de commission chaque semaine, et la procédure. */
  commission: 1300,
  campagne: 12000,
  /** Deux jours d'IDEC et trois jours de secrétariat remplacés. */
  appels: 1600,
  courrier: 250,
  enLigne: 900,
  convention: 1500,
  reseau: 1800,
  /** Quinze jours d'hébergement offerts à chaque nouvel entrant. */
  geste: 15 * PRIX_MOYEN,
  evaluation: 900,
  annulations: 800,
  grippeMaintenue: 6000,
  grippeEtendue: 14000,
  campagnePrintemps: 12000,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  lits: 0,
  liste: 1,
  prescripteurs: 2,
  evaluation: 3,
  grippe: 4,
  printemps: 5,
} as const;

/** Les options, par leur nom. */
export const O = {
  lits: { baisse: 0, circuit: 1, campagne: 2, attendre: 3 },
  liste: { appeler: 0, garder: 1, courrier: 2, enLigne: 3 },
  prescripteurs: { convention: 0, reseau: 1, geste: 2, rien: 3 },
  evaluation: { surDossier: 0, sous72h: 1, garder: 2, sansHopital: 3 },
  grippe: { toutSuspendre: 0, cibler: 1, maintenir: 2, reporter: 3 },
  printemps: { campagne: 0, procedure: 1, baisse: 2, rien: 3 },
} as const;

/** Ne rien changer, décision par décision : attendre, la liste telle quelle, le protocole habituel. */
export const NEUTRE = [3, 1, 3, 2, 0, 3] as const;

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
    /** Des sorties en plus, réparties sur la durée. */
    sorties?: number;
    /** Des chambres libres qu'on ne peut pas attribuer. */
    indisponibles?: number;
    /** Des jours de plus à la visite de préadmission. */
    visite?: number;
    /** Ce qui reste des demandes de l'hôpital. */
    hopital?: number;
    /** Ce qui reste des entrées possibles. */
    entrees?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "virus",
    titre: "Vague de virus respiratoire",
    de: "Médecin coordonnateur",
    role: "EHPAD de Beaune",
    texte:
      "Un virus respiratoire circule à Beaune : plusieurs résidents ont été hospitalisés, et deux chambres se sont libérées de plus que prévu.",
    duree: 2,
    effet: { sorties: 1 },
  },
  {
    id: "degat",
    titre: "Dégât des eaux au deuxième étage",
    de: "Responsable technique",
    role: "EHPAD de Beaune",
    texte:
      "Une canalisation a cédé au deuxième étage : deux chambres libres sont inutilisables trois semaines, le temps de sécher et de refaire les sols.",
    duree: 3,
    effet: { indisponibles: 2 },
  },
  {
    id: "idec",
    titre: "Arrêt de l'infirmière coordinatrice",
    de: "Ressources humaines",
    role: "Siège, Dijon",
    texte:
      "L'infirmière coordinatrice est en arrêt deux semaines : les visites de préadmission attendent son retour ou un créneau du médecin coordonnateur.",
    duree: 2,
    effet: { visite: 5 },
  },
  {
    id: "assistante",
    titre: "Absence au service social de l'hôpital",
    de: "Service social",
    role: "Hôpital",
    texte:
      "Deux assistantes sociales de l'hôpital sur trois sont absentes deux semaines : les demandes d'admission en EHPAD partent au compte-gouttes.",
    duree: 2,
    effet: { hopital: 0.3 },
  },
  {
    id: "neige",
    titre: "Neige sur la Côte-d'Or",
    de: "Accueil",
    role: "EHPAD de Beaune",
    texte:
      "La neige bloque les routes du Beaunois une semaine : les familles reportent les entrées et les visites de préadmission.",
    duree: 1,
    effet: { entrees: 0.5 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des sorties, semaine par semaine. */
  sorties: readonly number[];
  /** L'hôpital accepte-t-il la convention ? */
  uConvention: number;
  /** Orchidia signe-t-elle sa propre convention avec l'hôpital ? */
  uOrchidia: number;
  /** La grippe gagne-t-elle les autres ailes ? */
  uExtension: number;
  /** Le sort de chaque admission, dans l'ordre où elles se font. */
  admissions: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000859 + 7);
  const sorties: number[] = [1];
  for (let i = 1; i <= SEMAINES; i += 1) {
    sorties.push(Math.min(1.6, Math.max(0.5, 1 + 0.22 * gauss(r))));
  }
  const uConvention = r();
  const uOrchidia = r();
  const uExtension = r();
  const admissions = Array.from({ length: 80 }, () => r());
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { sorties, uConvention, uOrchidia, uExtension, admissions, imprevus };
  tirages.set(graine, h);
  return h;
}

/** La commission se réunit chaque semaine : la réponse en 72 heures est tenable. */
export const reponseRapide = (chemin: readonly number[]) => chemin[D.lits] === O.lits.circuit;

/** L'hôpital accepte-t-il la convention ? Trois fois sur quatre, quel que soit le reste. */
export const conventionAcceptee = (chemin: readonly number[], graine: number) =>
  chemin[D.prescripteurs] === O.prescripteurs.convention &&
  hasard(graine).uConvention < CHANCE_CONVENTION;

/** La chance qu'Orchidia signe sa convention avec l'hôpital : moindre quand vous répondez vite. */
export const chanceOrchidia = (chemin: readonly number[]) =>
  reponseRapide(chemin) ? CHANCE_ORCHIDIA.rapide : CHANCE_ORCHIDIA.lent;
export const orchidiaSigne = (chemin: readonly number[], graine: number) =>
  hasard(graine).uOrchidia < chanceOrchidia(chemin);

/** La grippe gagne les autres ailes une fois sur trois environ, quoi qu'on décide. */
export const grippeEtendue = (graine: number) => hasard(graine).uExtension < CHANCE_EXTENSION;

/** Les appels de la liste : deux jours par inscrit qui ne viendra pas, pour chaque candidat trouvé. */
export const delaiAppels = (inactifs: number, actifs: number) =>
  APPEL_UTILE + JOURS_PAR_APPEL_PERDU * Math.min(10, inactifs / Math.max(actifs, 0.5));

export type Semaine = {
  /** Taux d'occupation moyen de la semaine. */
  occupation: number;
  /** Lits vides en fin de semaine. */
  vides: number;
  /** Délai entre la libération d'une chambre et l'entrée suivante, en jours. */
  delai: number;
  /** Inscrits sur la liste d'attente, actifs ou non. */
  inscrits: number;
  /** Candidats qui veulent et peuvent entrer maintenant. */
  actifs: number;
  sorties: number;
  admissions: number;
  /** Recettes d'hébergement et de dépendance de la semaine. */
  recettes: number;
  /** Recettes cumulées depuis janvier. */
  cumul: number;
  /** Ce que la semaine a coûté en mesures, admissions inadaptées et enquête. */
  couts: number;
  /** Demandes nouvelles de la semaine. */
  demandes: number;
};

export interface AdmissionInadaptee {
  semaine: number;
  /** La semaine où le résident est réorienté et la chambre libérée. */
  reorientation: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Recettes du trimestre, moins les coûts, plus l'effet estimé sur le printemps. */
  objectif: number;
  recettes: number;
  couts: number;
  /** Ce que le printemps rapporte de plus qu'à 91 %, mesures du printemps déduites. */
  printemps: number;
  occupationMoyenne: number;
  occupationFin: number;
  videsFin: number;
  delaiFin: number;
  /** Le délai d'admission retenu pour le printemps. */
  delaiPrintemps: number;
  admissions: number;
  sorties: number;
  inadaptees: readonly AdmissionInadaptee[];
  convention: boolean;
  orchidiaSigne: boolean;
  grippeEtendue: boolean;
  listeAJour: boolean;
  inscritsFin: number;
  actifsFin: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const rapide = reponseRapide(chemin);
  const convention = conventionAcceptee(chemin, graine);
  const orchidia = orchidiaSigne(chemin, graine);
  const etendue = grippeEtendue(graine);
  const baisse = d1 === O.lits.baisse;
  const semaines: (Semaine | null)[] = [null];

  let vides = VIDES_DEPART;
  let actifs: number = LISTE.actifs;
  let inactifs = INACTIFS_DEPART;
  let cumul = 0;
  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let admisCumul = 0;
  let sortiesCumul = 0;
  const reorientations = new Map<number, number>();
  const inadaptees: AdmissionInadaptee[] = [];
  let delai: number = DELAI_DEPART;
  let demandes = 0;

  // Ce que les décisions coûtent, une fois.
  if (d1 === O.lits.circuit) couts += COUTS.commission;
  if (d1 === O.lits.campagne) couts += COUTS.campagne;
  if (d2 === O.liste.appeler) couts += COUTS.appels;
  if (d2 === O.liste.courrier) couts += COUTS.courrier;
  if (d2 === O.liste.enLigne) couts += COUTS.enLigne;
  if (d3 === O.prescripteurs.convention) couts += COUTS.convention;
  if (d3 === O.prescripteurs.reseau) couts += COUTS.reseau;
  if (d4 === O.evaluation.sous72h) couts += COUTS.evaluation;
  const coutsFixes = couts;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifsImprevus = h.imprevus.filter(
      (i) => w >= i.semaine && w < i.semaine + i.imprevu.duree,
    );
    const effet = (k: keyof Imprevu["effet"], neutre: number) =>
      actifsImprevus.reduce(
        (x, i) => (i.imprevu.effet[k] === undefined ? x : i.imprevu.effet[k]!),
        neutre,
      );
    let cout = w === 1 ? coutsFixes : 0;
    const apresOrchidia = w >= OUVERTURE_ORCHIDIA;

    // La liste : nettoyée en semaine 3 par les appels, à moitié en semaine 6 par le courrier.
    if (d2 === O.liste.appeler && w === 4) inactifs = 0;
    if (d2 === O.liste.courrier && w === 6) inactifs *= 0.45;

    // Le délai d'admission de la semaine, étape par étape.
    const circuit = d1 === O.lits.circuit && w >= 2;
    const remise = circuit ? DELAI_REMISE_RAPIDE : ETAPES_DU_DELAI.remise;
    const commission = circuit ? DELAI_COMMISSION_RAPIDE : ETAPES_DU_DELAI.commission;
    const appels = delaiAppels(inactifs, actifs);
    let dossier: number = ETAPES_DU_DELAI.dossier;
    if (apresOrchidia && convention) dossier = DELAI_DOSSIER.convention;
    if (apresOrchidia && d3 === O.prescripteurs.reseau) dossier = DELAI_DOSSIER.reseau;
    let visite: number = w >= 8 ? DELAI_VISITE[d4 ?? 2]! : ETAPES_DU_DELAI.visite;
    if (visite > 0) visite += effet("visite", 0);
    delai = remise + commission + appels + dossier + visite + ETAPES_DU_DELAI.entree;

    // Les sorties de la semaine.
    const sorties =
      SORTIES[w]! * h.sorties[w]! +
      actifsImprevus.reduce((x, i) => x + (i.imprevu.effet.sorties ?? 0), 0) +
      (reorientations.get(w) ?? 0);

    // Les entrées possibles : la grippe, la neige.
    let entrees = effet("entrees", 1);
    const enGrippe = w >= GRIPPE.debut && w <= (etendue ? GRIPPE.extension : GRIPPE.fin);
    // Tout suspendre : jusqu'à huit jours après le dernier cas, soit une semaine de plus.
    if (
      d5 === O.grippe.toutSuspendre &&
      w >= GRIPPE.debut &&
      w <= (etendue ? GRIPPE.extension : GRIPPE.fin) + 1
    ) {
      entrees = 0;
    }
    if (d5 === O.grippe.cibler && enGrippe) {
      entrees *= etendue && w >= GRIPPE.extension - 1 ? 0 : PART_HORS_TILLEULS;
    }
    if (d5 === O.grippe.cibler && w === (etendue ? GRIPPE.extension : GRIPPE.fin) + 1) {
      entrees *= 1.4; // Les entrées préparées pendant la suspension se font dès la levée.
    }
    if (d5 === O.grippe.reporter && w >= GRIPPE.debut) entrees = 0;

    // Les admissions : les chambres attribuables, au rythme du délai, s'il y a des candidats.
    const attribuables = Math.max(0, vides - effet("indisponibles", 0));
    const capacite = attribuables * Math.min(1, (7 / delai) * entrees);
    const admissions = Math.min(capacite, actifs);
    actifs -= admissions;

    // Le sort de chaque admission, dans l'ordre où elles se font.
    const avant = Math.floor(admisCumul);
    admisCumul += admissions;
    for (let k = avant; k < Math.floor(admisCumul); k += 1) {
      const risque = w >= 8 ? RISQUE_INADAPTEE[d4 ?? 2]! : RISQUE_AVANT;
      if (h.admissions[k]! < risque) {
        const reorientation = w + SEMAINES_AVANT_REORIENTATION;
        inadaptees.push({ semaine: w, reorientation });
        reorientations.set(reorientation, (reorientations.get(reorientation) ?? 0) + 1);
        cout += COUT_INADAPTEE;
      }
    }

    // La grippe, si l'on maintient les entrées contre l'avis de l'équipe d'hygiène.
    if (d5 === O.grippe.maintenir && w === GRIPPE.fin) {
      cout += etendue ? COUTS.grippeEtendue : COUTS.grippeMaintenue;
    }
    if (d5 === O.grippe.cibler && etendue && w === GRIPPE.extension) {
      cout += COUTS.annulations;
      actifs = Math.max(0, actifs - 1.5); // Deux familles prévenues la veille vont chez Orchidia.
    }
    if (d3 === O.prescripteurs.geste && w >= OUVERTURE_ORCHIDIA) cout += admissions * COUTS.geste;

    // Les lits vides, et ce que la semaine a facturé.
    const debut = vides;
    vides = borne(vides + sorties - admissions, 0, PLACES);
    sortiesCumul += sorties;
    const occupation = 1 - (debut + vides) / 2 / PLACES;
    const recetteJour = RECETTE_JOUR - (baisse && w >= 2 ? PERTE_BAISSE_JOUR : 0);
    const recettes = occupation * PLACES * 7 * recetteJour;
    cumul += recettes;

    // Les demandes nouvelles : l'hôpital, la proximité, les familles.
    let hopital: number = DEMANDES.hopital;
    if (apresOrchidia) {
      // Signée sans réponse rapide, la convention déçoit : l'hôpital voit les réponses arriver en
      // trois semaines, et revient à ce qu'il envoyait à un établissement lent.
      hopital = convention
        ? rapide
          ? DEMANDES.hopital + RENFORT_CONVENTION * (orchidia ? 0.5 : 1)
          : DEMANDES.hopital * (orchidia ? 0.4 : PART_APRES_ORCHIDIA) +
            RENFORT_CONVENTION * PART_SANS_REPONSE_RAPIDE
        : d3 === O.prescripteurs.convention
          ? DEMANDES.hopital * (orchidia ? 0.6 : 0.9) // Refusée, la démarche a quand même renoué le lien.
          : DEMANDES.hopital * (orchidia ? 0.4 : PART_APRES_ORCHIDIA);
    }
    if (d4 === O.evaluation.sansHopital && w >= 8) hopital = 0;
    hopital *= effet("hopital", 1);
    let proximite: number = DEMANDES.proximite;
    if (apresOrchidia) {
      proximite = d3 === O.prescripteurs.reseau ? DEMANDES_RESEAU : proximite * PART_APRES_ORCHIDIA;
    }
    let familles: number = DEMANDES.familles;
    if (apresOrchidia && !baisse) familles *= PART_APRES_ORCHIDIA;
    if (baisse && w >= 2) familles += 0.1; // Les familles qui comparent les prix.
    if (d3 === O.prescripteurs.geste && apresOrchidia) familles += 0.12;
    if (d1 === O.lits.campagne && w >= 3 && w <= 8) {
      familles += 0.3;
      inactifs += 1.5;
    }
    if (d2 === O.liste.enLigne && w >= 4) {
      familles += 0.05;
      inactifs += 2;
    }
    inactifs += INSCRIPTIONS_DE_PRECAUTION;
    demandes = hopital + proximite + familles;
    const fuite =
      ATTRITION + (apresOrchidia && delai > DELAI_QUI_FAIT_FUIR ? ATTRITION_ORCHIDIA : 0);
    actifs = (actifs + demandes) * (1 - fuite);
    couts += cout - (w === 1 ? coutsFixes : 0);

    semaines.push({
      occupation,
      vides,
      delai,
      inscrits: actifs + inactifs,
      actifs,
      sorties,
      admissions,
      recettes,
      cumul,
      couts: cout,
      demandes,
    });
  }

  // LE PRINTEMPS : avril à juin, prolongés avec ce que mars a laissé.
  const ecrit = d6 === O.printemps.procedure;
  const delaiPrintemps = ecrit ? delai : delai + 0.5 * (DELAI_DEPART - delai);
  const baissePrintemps = baisse || d6 === O.printemps.baisse;
  let demandesPrintemps = demandes * (ecrit ? 1 : 0.85);
  if (d6 === O.printemps.campagne) demandesPrintemps += 0.3;
  let v = vides;
  let a = actifs;
  let recettesPrintemps = 0;
  for (let w = SEMAINES + 1; w <= 2 * SEMAINES; w += 1) {
    const debut = v;
    const adm = Math.min(v * Math.min(1, 7 / delaiPrintemps), a);
    a =
      (a - adm + demandesPrintemps) *
      (1 - ATTRITION - (delaiPrintemps > DELAI_QUI_FAIT_FUIR ? ATTRITION_ORCHIDIA : 0));
    v = borne(v + SORTIES_PRINTEMPS + (reorientations.get(w) ?? 0) - adm, 0, PLACES);
    const occ = 1 - (debut + v) / 2 / PLACES;
    recettesPrintemps +=
      occ * PLACES * 7 * (RECETTE_JOUR - (baissePrintemps ? PERTE_BAISSE_JOUR : 0));
  }
  const printemps =
    recettesPrintemps -
    PRINTEMPS_A_91 -
    (d6 === O.printemps.campagne ? COUTS.campagnePrintemps : 0);

  const pleines = semaines.slice(1) as Semaine[];
  const derniere = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: cumul - couts + printemps,
    recettes: cumul,
    couts,
    printemps,
    occupationMoyenne: pleines.reduce((s, x) => s + x.occupation, 0) / SEMAINES,
    occupationFin: 1 - derniere.vides / PLACES,
    videsFin: derniere.vides,
    delaiFin: derniere.delai,
    delaiPrintemps,
    admissions: admisCumul,
    sorties: sortiesCumul,
    inadaptees,
    convention,
    orchidiaSigne: orchidia,
    grippeEtendue: etendue,
    listeAJour: d2 === O.liste.appeler,
    inscritsFin: derniere.inscrits,
    actifsFin: derniere.actifs,
  };
}

/** Ce qui s'est passé pendant des semaines : conventions, épidémie, admissions inadaptées, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    orchidia: dans(OUVERTURE_ORCHIDIA + 1),
    grippeEtendue: t.grippeEtendue && dans(GRIPPE.extension),
    inadaptees: t.inadaptees.filter((x) => dans(x.semaine)),
    reorientations: t.inadaptees.filter((x) => dans(x.reorientation)),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureLits {
  occupation: number | null;
  vides: number | null;
  delai: number | null;
  inscrits: number | null;
  recettes: number | null;
  actifs: number | null;
  budgetADate: number | null;
  admissions: number | null;
  sorties: number | null;
}

/** Ce que Corentine lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureLits {
  if (semaine === 0) {
    return {
      occupation: TAUX_DEPART,
      vides: VIDES_DEPART,
      delai: DELAI_DEPART,
      inscrits: LISTE.inscrits,
      recettes: 0,
      actifs: LISTE.actifs,
      budgetADate: 0,
      admissions: 0,
      sorties: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const deja = t.semaines.slice(1, semaine + 1) as Semaine[];
  return {
    occupation: s.occupation,
    vides: s.vides,
    delai: s.delai,
    inscrits: s.inscrits,
    recettes: s.cumul,
    actifs: s.actifs,
    budgetADate: BUDGET_SEMAINE * semaine,
    admissions: deja.reduce((x, w) => x + w.admissions, 0),
    sorties: deja.reduce((x, w) => x + w.sorties, 0),
  };
}
