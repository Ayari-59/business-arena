/**
 * LE VIRAGE VERS LE DOMICILE — le modèle de l'orientation stratégique de
 * l'Association Solvanne pour son prochain CPOM.
 *
 * Six EHPAD (480 places), un SSIAD, un SAAD, un dispositif renforcé de
 * soutien à domicile expérimenté depuis janvier avec l'EHPAD de Dijon-
 * Montchapet. Le schéma départemental de l'autonomie gèle les places
 * d'EHPAD et promet de financer des solutions à domicile ; Orchidia
 * Résidences ouvre une résidence services seniors à Dijon ; le conseil
 * d'administration doit arrêter en juin le mandat de négociation du CPOM.
 * Avril à juin, treize semaines, six décisions.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une orientation se joue sur la durée d'un
 * CPOM ; un épisode dure un trimestre. Le trimestre est jugé sur la VALEUR
 * CRÉÉE ESTIMÉE en semaine 13 pour l'association, par rapport à l'association
 * telle qu'elle est (480 places, aucune transformation, pas de partenariat) :
 *
 *   · chaque position prise vaut CINQ ANS D'EXCÉDENT SUPPLÉMENTAIRE, la durée
 *     du CPOM, actualisés au taux que le conseil retient pour ses projets (4 %,
 *     celui de ses emprunts à la Banque Saônelle : 1 € d'excédent annuel vaut
 *     4,45 €). Sous CPOM, l'association garde l'affectation de ses excédents :
 *     c'est ce qui finance son projet associatif ;
 *   · moins les sommes engagées et perdues : dossiers, études, aménagements,
 *     recettes perdues pendant une transformation, départs de soignants ;
 *   · plus ce que le trimestre lui-même a gagné ou perdu (imprévus) ;
 *   · recalculée chaque semaine avec ce que le trimestre a révélé : la réponse
 *     d'Orchidia (semaine 5), les chiffres du dispositif pilote et la réponse
 *     du département (semaine 6), la décision de l'ARS sur le centre de
 *     ressources territorial (semaine 10), le vote du financement du schéma
 *     et, pour qui l'a commandée, l'enquête auprès des aidants (semaine 11). Ce qui n'est pas encore
 *     révélé est compté en espérance, aux probabilités du moment.
 *
 * Ne rien faire a un coût : le virage domiciliaire vide peu à peu les EHPAD
 * hors Dijon, et la résidence d'Orchidia capte une partie des entrées de
 * Montchapet.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE SCÉNARIO DE FINANCEMENT. Le schéma sera appliqué (une chance sur
 *     deux), différé faute de budget départemental (trois sur dix) ou renforcé
 *     par des crédits de l'ARS (deux sur dix). Une place transformée perd ses
 *     recettes d'hébergement et de dépendance (le forfait soins, lui, suit la
 *     place dans le CPOM) ; elle ne rapporte que si le département finance les
 *     plans d'aide renforcés, et seulement dans la limite des places que le
 *     schéma attribue à l'association. Au-delà, ou si le schéma est différé,
 *     elle coûte. Et un service nouveau ne vit que si les familles y viennent :
 *     un accueil de jour sans transport tourne à moitié vide, ce qu'une
 *     enquête auprès des aidants dit avant d'ouvrir.
 *   · LE PILOTE RÉVÈLE. Le dispositif renforcé expérimenté depuis janvier dit
 *     en semaine 6 combien de familles le choisissent (bien moins que le plan
 *     ne le supposait) et ce qu'il coûte vraiment (les nuits). Étendre comme
 *     prévu est le réflexe ; réviser l'extension au vu des chiffres crée la
 *     valeur.
 *   · LA RÉSIDENCE SERVICES N'EST PAS NOTRE MÉTIER. Elle demande 11 M€
 *     d'emprunt, ne couvre ses charges qu'au-delà de 88 % d'occupation (91 %
 *     si la banque exige une caution), et affronte Orchidia, qui baisse ses
 *     prix là où on la concurrence. Proposer à Orchidia ce qu'elle n'a pas (le
 *     soin, l'aide, l'hébergement temporaire, l'EHPAD quand la dépendance
 *     monte) vaut plus, si elle l'accepte : elle l'accepte d'autant plus
 *     volontiers que l'association a une offre à domicile crédible.
 *   · TRANSFORMER TROP VITE. Vider quarante places en neuf mois perd un quart
 *     d'une année de leurs recettes, fait partir des soignants une fois sur
 *     deux, et engage au-delà de ce que le département financera. Transformer
 *     par étapes, au fil des départs naturels, reste réversible : les places
 *     d'hébergement temporaire restent des places de l'EHPAD.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux que le conseil retient pour ses projets, et celui qu'il retient si la banque relève ses taux. */
export const TAUX = 0.04;
export const TAUX_RELEVE = 0.045;
/** Une position se valorise sur la durée du CPOM. */
export const ANNEES = 5;
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
/** Ce que vaut 1 € d'excédent annuel sur cinq ans, à 4 % : 4,45 €. */
export const MULTIPLE = annuite(ANNEES, TAUX);
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la note au conseil se boucle avec un cabinet payé à la journée. */
export const PERTE_PAR_JOUR = 2500;
/** La valeur que le bureau du conseil attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 500000;
/** Ce que le plan pluriannuel d'investissement laisse disponible sur cinq ans, emprunts compris. */
export const ENVELOPPE = 3000000;

/* ---------------------------------------------------------------------------
 * UNE PLACE D'EHPAD, ET CE QU'ELLE DEVIENT QUAND ON LA TRANSFORME.
 * ------------------------------------------------------------------------- */

/** Les tarifs journaliers de Beaune, par section : le résident, le département, l'ARS. */
export const TARIF = { hebergement: 72, dependance: 22, soins: 38 } as const;
/** Le taux d'occupation de Beaune. */
export const OCCUPATION_BEAUNE = 0.92;
export const PLACES_BEAUNE = 88;
/** Les recettes d'hébergement et de dépendance d'une place de Beaune sur un an : ce qu'une transformation fait perdre. */
export const RECETTES_PLACE = 365 * OCCUPATION_BEAUNE * (TARIF.hebergement + TARIF.dependance);
/** La prévision de la semaine 1 : les recettes perdues par an si vingt places sont transformées. */
export const PLACES_DE_LA_PREVISION = 20;
export const RECETTES_PERDUES_20 = PLACES_DE_LA_PREVISION * RECETTES_PLACE;

/**
 * Ce que change, par an, une place transformée en hébergement temporaire,
 * accueil de jour et accompagnement renforcé à domicile : les charges qui
 * suivent la place (restauration, blanchisserie, hôtellerie, part des agents
 * de service), la participation des usagers aux nouveaux services, et le
 * financement des plans d'aide renforcés par le département, quand il existe.
 */
export const PLACE_TRANSFORMEE = { chargesEvitees: 17000, participations: 9600 } as const;

export type Scenario = "applique" | "differe" | "renforce";
export const SCENARIOS: readonly Scenario[] = ["applique", "differe", "renforce"];

/** Ce que les sources disent des chances de chaque scénario : une sur deux, trois sur dix, deux sur dix. */
export const PROBA: Record<Scenario, number> = { applique: 0.5, differe: 0.3, renforce: 0.2 };
/** Le financement départemental d'une place transformée, par an, dans la limite des places attribuées. */
export const FINANCEMENT_CD: Record<Scenario, number> = {
  applique: 11000,
  differe: 0,
  renforce: 13000,
};
/** Les places que le schéma attribue à Solvanne pour des solutions renforcées : aucune avant 2029 s'il est différé. */
export const QUOTA: Record<Scenario, number> = { applique: 20, differe: 0, renforce: 28 };

/** Le gain annuel d'une place transformée hors financement départemental : négatif. */
export const GAIN_HORS =
  -RECETTES_PLACE + PLACE_TRANSFORMEE.chargesEvitees + PLACE_TRANSFORMEE.participations;
/** Le gain annuel d'une place transformée dans la limite des places financées. */
export const gainFinance = (k: Scenario) => GAIN_HORS + FINANCEMENT_CD[k];

/** Le vote du financement du schéma, et la réponse du département au pilote. */
export const SCENARIO = { semaine: 12 } as const;
/** La chance que le département dise oui aux plans d'aide du pilote, selon ce qu'il votera. */
export const SIGNAL: Record<Scenario, number> = { applique: 0.7, differe: 0.2, renforce: 0.9 };
export const SIGNAL_SEMAINE = 6;

/* ---------------------------------------------------------------------------
 * DÉCISION 1 : L'ORIENTATION PROPOSÉE AU CONSEIL.
 * ------------------------------------------------------------------------- */

export const ORIENTATION = { defendre: 0, etapes: 1, grand: 2, attendre: 3 } as const;
/** Les places de Beaune transformées, par option. */
export const PLACES_D1 = [0, 12, 40, 0] as const;
/** Le dossier de demande d'extension de 24 places à Dijon : programmiste, architecte. */
export const DOSSIER_EXTENSION = 15000;
/** Aménager une place transformée au fil des départs : cloisons, salle d'activités, véhicule. */
export const AMENAGEMENT = 2500;
/** Vider quarante places en neuf mois : un quart d'année de leurs recettes perdu. */
export const TRANSITION_RAPIDE = 0.25 * RECETTES_PLACE * PLACES_D1[2];
/** Une fois sur deux, l'équipe de Beaune perd des soignants quand on annonce la transformation de quarante places. */
export const DEPARTS = { chance: 0.55, cout: 130000, semaine: 8 } as const;

/**
 * L'ÉROSION : les places vides que le virage domiciliaire laisse dans les
 * EHPAD hors Dijon si l'association ne s'y place pas. Un EHPAD qui offre
 * hébergement temporaire et accueil de jour y perd moins : quatre admissions
 * sur dix y passent d'abord.
 */
export const VACANCES: Record<Scenario, number> = { applique: 3, differe: 1, renforce: 5 };
/** Une place vide coûte 20 k€ par an, une fois ajustées les charges qui suivent l'occupation. */
export const COUT_PLACE_VIDE = 20000;
export const ATTENUATION_D1 = [0, 0.4, 0.6, 0] as const;

/* ---------------------------------------------------------------------------
 * DÉCISION 2 : ORCHIDIA ET SA RÉSIDENCE SERVICES SENIORS.
 * ------------------------------------------------------------------------- */

export const ORCHIDIA_OPTIONS = { residence: 0, convention: 1, rien: 2, prix: 3 } as const;
/** Les entrées de Montchapet que la résidence d'Orchidia capte : une place et demie par an. */
export const MENACE_ORCHIDIA = 1.5 * COUT_PLACE_VIDE;
/**
 * La convention de parcours : le SAAD intervient chez les résidents d'Orchidia
 * (heures hors APA, au tarif libre), le SSIAD y soigne, Montchapet les accueille
 * en hébergement temporaire puis quand la dépendance monte.
 */
export const CONVENTION = { heures: 9000, tarif: 31, cout: 27.3 } as const;
export const MARGE_CONVENTION = CONVENTION.heures * (CONVENTION.tarif - CONVENTION.cout);
/** La chance qu'Orchidia accepte, selon l'offre à domicile que l'association peut faire valoir. */
export const ACCEPTE_ORCHIDIA = [0.3, 0.7, 0.6, 0.4] as const;
export const REPONSE_ORCHIDIA = 5;
/** Baisser de 5 € le prix de journée des 30 places non habilitées de Montchapet. */
export const BAISSE = { euros: 5, places: 30, occupation: 0.97 } as const;
export const COUT_BAISSE = BAISSE.euros * BAISSE.places * 365 * BAISSE.occupation;

/** Notre résidence services seniors : 80 logements, 11 M€ empruntés sur 25 ans. */
export const RSS = {
  logements: 80,
  loyer: 1550,
  charges: 600000,
  emprunt: 11000000,
  duree: 25,
  etudes: 100000,
  /** Taux d'occupation à maturité, selon qu'Orchidia baisse ses prix ou non. */
  remplissage: { guerre: 0.85, paix: 0.93 },
  /** Orchidia baisse ses prix six fois sur dix là où on la concurrence. */
  riposte: 0.6,
  semaineRiposte: 7,
  /** Face à une résidence concurrente, Orchidia capte davantage d'entrées. */
  menace: 1.5,
} as const;
/** L'annuité d'un emprunt. */
export const annuiteEmprunt = (capital: number, taux: number, n: number) =>
  (capital * taux) / (1 - (1 + taux) ** -n);
/** La Banque Saônelle prête à 4 %, ou à 4,6 % avec une caution qu'elle exige une fois sur deux. */
export const TAUX_BANQUE = { base: 0.04, caution: 0.046 } as const;
export const recettesRSS = (remplissage: number) => RSS.logements * 12 * RSS.loyer * remplissage;
/** Le taux d'occupation au-delà duquel la résidence couvre ses charges et son emprunt. */
export const seuilRSS = (taux: number) =>
  (RSS.charges + annuiteEmprunt(RSS.emprunt, taux, RSS.duree)) / (RSS.logements * 12 * RSS.loyer);
export const resultatRSS = (remplissage: number, taux: number) =>
  recettesRSS(remplissage) - RSS.charges - annuiteEmprunt(RSS.emprunt, taux, RSS.duree);

/* ---------------------------------------------------------------------------
 * DÉCISION 3 : LE CENTRE DE RESSOURCES TERRITORIAL.
 * ------------------------------------------------------------------------- */

export const CRT_OPTIONS = { porter: 0, promettre: 1, rien: 2 } as const;
/** La dotation de l'ARS, et ce que coûte la mission selon ce qu'on a promis. */
export const CRT = {
  dotation: 400000,
  couts: [355000, 430000, 0],
  dossier: [20000, 25000, 0],
  base: [0.45, 0.6, 0],
  /** Ce que l'orientation de la semaine 1 fait à la crédibilité du dossier. */
  credibilite: [-0.2, 0.2, 0.05, -0.1],
  /** Une convention proposée à Orchidia : un partenariat territorial de plus. */
  partenariat: 0.1,
  semaine: 10,
  /** Un CRT gagné : ses admissions passent par l'EHPAD porteur ; perdu, elles vont au voisin. */
  erosionGagne: 0.7,
  erosionPerdu: 1.15,
  /** Le volet domicile du CRT cofinance le dispositif renforcé, par personne et par an. */
  cofinancement: 800,
} as const;
export const margeCRT = (option: number) => CRT.dotation - CRT.couts[option]!;

/* ---------------------------------------------------------------------------
 * DÉCISION 4 : LES CHIFFRES DU DISPOSITIF PILOTE.
 * ------------------------------------------------------------------------- */

export const PILOTE_OPTIONS = { etendre: 0, ajuster: 1, arreter: 2 } as const;
export const PILOTE = {
  personnes: 20,
  /** Le plan de décembre : 50 personnes en septembre, 80 % des familles éligibles intéressées. */
  plan: 50,
  adhesionPlan: 0.8,
  eligibles: 80,
  /** Le coût par personne prévu, et constaté avec les nuits assurées par une équipe propre. */
  coutPlan: 14000,
  coutNuitsPropres: 16300,
  /** Les nuits confiées à l'équipe de nuit de Montchapet. */
  coutNuitsMutualisees: 15300,
  ajuste: 30,
  /** Une place recrutée et vide coûte le cinquième d'une place pleine. */
  vide: 0.2,
  forfaitARS: 12500,
  adhesion: { moyenne: 0.5, ecart: 0.06, min: 0.38, max: 0.62 },
  semaine: 6,
} as const;
/** Le plan d'aide renforcé que le département finance, par personne et par an, selon le scénario. */
export const APA_RENFORCEE: Record<Scenario, number> = {
  applique: 4500,
  differe: 1500,
  renforce: 6000,
};

/** L'excédent annuel du dispositif, selon l'option, l'adhésion, le scénario et le CRT. */
export function margePilote(option: number, adhesion: number, k: Scenario, crt: boolean): number {
  const recette = PILOTE.forfaitARS + APA_RENFORCEE[k] + (crt ? CRT.cofinancement : 0);
  const candidats = PILOTE.eligibles * adhesion;
  if (option === PILOTE_OPTIONS.etendre) {
    const pleines = Math.min(PILOTE.plan, candidats);
    const vides = PILOTE.plan - pleines;
    return (
      pleines * (recette - PILOTE.coutNuitsPropres) - vides * PILOTE.vide * PILOTE.coutNuitsPropres
    );
  }
  if (option === PILOTE_OPTIONS.ajuster) {
    return Math.min(PILOTE.ajuste, candidats) * (recette - PILOTE.coutNuitsMutualisees);
  }
  return 0;
}

/* ---------------------------------------------------------------------------
 * DÉCISION 5 : L'ACCUEIL DE JOUR DE BEAUNE.
 * ------------------------------------------------------------------------- */

export const ACCUEIL_OPTIONS = { ouvrir: 0, enquete: 1, minibus: 2, renoncer: 3 } as const;
export type Demande = "forte" | "faible";
export const ACCUEIL = {
  places: 12,
  jours: 250,
  /** La recette d'une journée de présence : forfait soins de l'ARS, participation de la personne, APA. */
  recette: 80,
  /** Deux équivalents temps plein, le local, l'animation. */
  fixes: 150000,
  /** Le taux d'occupation, selon la demande des aidants et selon que le transport est organisé. */
  occupation: { forte: { sans: 0.65, avec: 0.9 }, faible: { sans: 0.4, avec: 0.6 } },
  /** Un minibus et un chauffeur, forfait transport de l'ARS déduit. */
  transport: 30000,
  /** Six places, le transport assuré par les tournées du SSIAD. */
  petit: { places: 6, fixes: 85000, transport: 15000, occupation: { forte: 0.95, faible: 0.85 } },
  chanceForte: 0.5,
  enquete: 12000,
  resultat: 11,
  amenagement: 60000,
} as const;

/** L'excédent annuel d'un accueil de jour, selon son format et la demande. */
export function margeAccueil(format: "grand" | "minibus" | "petit", demande: Demande): number {
  if (format === "petit") {
    const p = ACCUEIL.petit;
    return (
      p.places * ACCUEIL.jours * ACCUEIL.recette * p.occupation[demande] - p.fixes - p.transport
    );
  }
  const avec = format === "minibus";
  const o = ACCUEIL.occupation[demande][avec ? "avec" : "sans"];
  return (
    ACCUEIL.places * ACCUEIL.jours * ACCUEIL.recette * o -
    ACCUEIL.fixes -
    (avec ? ACCUEIL.transport : 0)
  );
}
/** Le format que l'enquête fait retenir, une fois la demande connue. */
export const formatInforme = (demande: Demande): "minibus" | "petit" =>
  margeAccueil("minibus", demande) >= margeAccueil("petit", demande) ? "minibus" : "petit";

/** L'excédent annuel de l'accueil de jour, selon l'option et la demande. */
export function margeOption(o: number, demande: Demande): number {
  if (o === ACCUEIL_OPTIONS.ouvrir) return margeAccueil("grand", demande);
  if (o === ACCUEIL_OPTIONS.minibus) return margeAccueil("minibus", demande);
  if (o === ACCUEIL_OPTIONS.enquete) return margeAccueil(formatInforme(demande), demande);
  return 0;
}

/* ---------------------------------------------------------------------------
 * DÉCISION 6 : LE MANDAT DE NÉGOCIATION DU CPOM.
 * ------------------------------------------------------------------------- */

export const CPOM_OPTIONS = { identique: 0, paliers: 1, ferme: 2, report: 3 } as const;
/**
 * La dotation complémentaire du SAAD (0,50 € par heure sur 95 000 heures),
 * que le département réserve aux gestionnaires engagés dans le schéma ; s'il
 * diffère le schéma, il ne la verse à personne.
 */
export const DOTATION = { parHeure: 0.5, heures: 95000 } as const;
export const DOTATION_ANNUELLE = DOTATION.parHeure * DOTATION.heures;
/** L'engagement ferme : 40 places transformées au total d'ici 2029, contre une aide non reconductible. */
export const FERME = { places: 40, aide: 150000 } as const;
/** La clause de revoyure rouvre jusqu'à 20 places transformées que personne ne finance. */
export const REVOYURE = { places: 20, cout: 4000 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  orientation: 0,
  orchidia: 1,
  crt: 2,
  pilote: 3,
  accueil: 4,
  cpom: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;

/**
 * Ne rien changer, décision par décision : attendre le vote du schéma, ne pas
 * s'occuper d'Orchidia, ne pas candidater, laisser le plan du pilote suivre son
 * cours, renoncer à l'accueil de jour, reporter la négociation du CPOM.
 */
export const NEUTRE = [3, 2, 2, 0, 3, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce que l'imprévu ajoute au résultat du trimestre, en euros. */
  effet: number;
  taux?: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chaleur",
    titre: "Un premier épisode de forte chaleur",
    de: "Direction de la qualité",
    role: "Siège",
    texte:
      "Le plan bleu est déclenché dans les six EHPAD : renforts d'hydratation la nuit, salles rafraîchies, heures supplémentaires. Environ 18 k€ sur le trimestre.",
    effet: -18000,
  },
  {
    id: "avenant",
    titre: "Une mesure salariale de la convention collective",
    de: "Direction des ressources humaines",
    role: "Siège",
    texte:
      "L'avenant salarial agréé s'applique au 1er avril ; l'ARS et le département ne le compenseront qu'à la prochaine campagne budgétaire. 32 k€ à porter ce trimestre.",
    effet: -32000,
  },
  {
    id: "cnr",
    titre: "Des crédits non reconductibles de l'ARS",
    de: "Délégation départementale",
    role: "Agence régionale de santé",
    texte:
      "L'ARS notifie 24 k€ de crédits non reconductibles pour la qualité de vie au travail : les rails de transfert de Beaune et Chalon sont financés.",
    effet: 24000,
  },
  {
    id: "taux",
    titre: "La Banque Saônelle relève ses taux",
    de: "Direction financière",
    role: "Siège",
    texte:
      "La Banque Saônelle relève d'un demi-point le taux de nos prochains emprunts : le conseil valorisera désormais ses projets à 4,5 %.",
    effet: 0,
    taux: TAUX_RELEVE,
  },
  {
    id: "carneo",
    titre: "Une panne de Carnéo",
    de: "Systèmes d'information",
    role: "Siège",
    texte:
      "Le dossier de soins Carnéo est resté inaccessible deux jours : transmissions sur papier, puis ressaisie. 9 k€ d'heures supplémentaires.",
    effet: -9000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: Scenario;
  /** La réponse du département aux plans d'aide du pilote : favorable ou non. */
  signal: boolean;
  /** La part des familles éligibles qui choisissent le dispositif renforcé. */
  adhesion: number;
  uOrchidia: number;
  uRiposte: number;
  uBanque: number;
  uCRT: number;
  uDeparts: number;
  /** La demande des aidants pour l'accueil de jour de Beaune. */
  demande: Demande;
  bruit: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001027 + 7);
  // L'ordre des tirages est fixé une fois pour toutes : le changer changerait tous les trimestres.
  const u = r();
  const scenario: Scenario =
    u < PROBA.applique ? "applique" : u < PROBA.applique + PROBA.differe ? "differe" : "renforce";
  const signal = r() < SIGNAL[scenario];
  const a = PILOTE.adhesion;
  const adhesion = borne(a.moyenne + a.ecart * gauss(r), a.min, a.max);
  const uOrchidia = r();
  const uRiposte = r();
  const uBanque = r();
  const uCRT = r();
  const uDeparts = r();
  const demande: Demande = r() < ACCUEIL.chanceForte ? "forte" : "faible";
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.004 * gauss(r), -0.01, 0.01));
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((x, y) => x.semaine - y.semaine);
  const h: Hasard = {
    scenario,
    signal,
    adhesion,
    uOrchidia,
    uRiposte,
    uBanque,
    uCRT,
    uDeparts,
    demande,
    bruit,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La chance qu'Orchidia accepte la convention, vu l'orientation de la semaine 1. */
export const chanceOrchidia = (chemin: readonly number[]) =>
  ACCEPTE_ORCHIDIA[chemin[D.orientation]!]!;
export const orchidiaAccepte = (chemin: readonly number[], graine: number) =>
  chemin[D.orchidia] === ORCHIDIA_OPTIONS.convention &&
  hasard(graine).uOrchidia < chanceOrchidia(chemin);

/** Orchidia baisse-t-elle ses prix face à notre résidence ? */
export const orchidiaRiposte = (chemin: readonly number[], graine: number) =>
  chemin[D.orchidia] === ORCHIDIA_OPTIONS.residence && hasard(graine).uRiposte < RSS.riposte;

/** Le taux que la Banque Saônelle accorde pour la résidence. */
export const tauxBanque = (graine: number) =>
  hasard(graine).uBanque < 0.5 ? TAUX_BANQUE.base : TAUX_BANQUE.caution;

/** La chance que l'ARS retienne le dossier de l'association. */
export function chanceCRT(chemin: readonly number[]): number {
  const o = chemin[D.crt]!;
  if (o === CRT_OPTIONS.rien) return 0;
  const p =
    CRT.base[o]! +
    CRT.credibilite[chemin[D.orientation]!]! +
    (chemin[D.orchidia] === ORCHIDIA_OPTIONS.convention ? CRT.partenariat : 0);
  return borne(p, 0.05, 0.95);
}
export const crtGagne = (chemin: readonly number[], graine: number) =>
  hasard(graine).uCRT < chanceCRT(chemin);

/** L'équipe de Beaune perd-elle des soignants ? Seulement si l'on vide quarante places d'un coup. */
export const departsBeaune = (chemin: readonly number[], graine: number) =>
  chemin[D.orientation] === ORIENTATION.grand && hasard(graine).uDeparts < DEPARTS.chance;

/** La croyance sur le scénario : a priori, après la réponse du département au pilote, puis le vote. */
export function croyance(graine: number, w: number): Record<Scenario, number> {
  const h = hasard(graine);
  if (w >= SCENARIO.semaine) {
    return {
      applique: h.scenario === "applique" ? 1 : 0,
      differe: h.scenario === "differe" ? 1 : 0,
      renforce: h.scenario === "renforce" ? 1 : 0,
    };
  }
  if (w < SIGNAL_SEMAINE) return { ...PROBA };
  const v = (k: Scenario) => PROBA[k] * (h.signal ? SIGNAL[k] : 1 - SIGNAL[k]);
  const total = SCENARIOS.reduce((s, k) => s + v(k), 0);
  return {
    applique: v("applique") / total,
    differe: v("differe") / total,
    renforce: v("renforce") / total,
  };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR DES POSITIONS.
 * ------------------------------------------------------------------------- */

/**
 * Les places transformées sur la durée du CPOM, et ce qu'elles rapportent, dans
 * un scénario : celles de la semaine 1, plus celles que le mandat du CPOM
 * engage (jusqu'aux places financées par paliers, ou 40 au total s'il est
 * ferme). Transformées par étapes, elles restent réversibles : si le schéma
 * est différé, elles redeviennent des places permanentes au bout d'un an.
 * Transformées d'un coup, elles ne le sont plus, sauf par la clause de revoyure.
 */
export function transformations(
  d1: number,
  d6: number,
  k: Scenario,
  multiple = MULTIPLE,
): { valeur: number; annuel: number; places: number; ajoutees: number } {
  const n1: number = PLACES_D1[d1]!;
  const rapide = d1 === ORIENTATION.grand;
  const ferme = d6 === CPOM_OPTIONS.ferme;
  const q = QUOTA[k];
  let total = n1;
  if (ferme) total = Math.max(n1, FERME.places);
  else if (d6 === CPOM_OPTIONS.paliers) total = Math.max(n1, q);
  const ajoutees = total - n1;
  let valeur = -AMENAGEMENT * ajoutees + (ferme ? FERME.aide : 0);
  if (!rapide && !ferme && total > q) {
    // Des places d'hébergement temporaire que personne ne finance : on les rouvre au bout d'un an.
    valeur += (total - q) * GAIN_HORS;
    total = q;
  }
  if (rapide && d6 === CPOM_OPTIONS.paliers && total > q) {
    const rouvertes = Math.min(REVOYURE.places, total - q);
    total -= rouvertes;
    valeur -= rouvertes * REVOYURE.cout;
  }
  const finance = Math.min(total, q);
  const annuel = finance * gainFinance(k) + (total - finance) * GAIN_HORS;
  valeur += multiple * annuel;
  return { valeur, annuel, places: total, ajoutees };
}

/** La valeur de la position face à Orchidia, une fois connus sa réponse et sa riposte. */
export function valeurOrchidia(
  o: number,
  accepte: boolean,
  riposte: boolean,
  taux: number,
  multiple = MULTIPLE,
): { valeur: number; annuel: number } {
  let annuel = -MENACE_ORCHIDIA;
  let valeur = 0;
  if (o === ORCHIDIA_OPTIONS.residence) {
    const remplissage = riposte ? RSS.remplissage.guerre : RSS.remplissage.paix;
    annuel = resultatRSS(remplissage, taux) - RSS.menace * MENACE_ORCHIDIA;
    valeur = -RSS.etudes;
  } else if (o === ORCHIDIA_OPTIONS.convention) {
    annuel = accepte ? MARGE_CONVENTION : -MENACE_ORCHIDIA;
  } else if (o === ORCHIDIA_OPTIONS.prix) {
    annuel = -COUT_BAISSE - MENACE_ORCHIDIA / 2;
  }
  return { valeur: valeur + multiple * annuel, annuel };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** L'excédent annuel supplémentaire des positions prises, en espérance. */
  excedent: number;
  /** Les sommes engagées : dossiers, études, travaux, emprunts. */
  engage: number;
  /** Le taux d'occupation des six EHPAD dans la semaine. */
  occupation: number;
  /** La probabilité, vue de cette semaine, que le département diffère le financement du schéma. */
  differe: number;
};

export interface Estimation {
  valeur: number;
  excedent: number;
  engage: number;
  transformations: number;
  erosion: number;
  orchidia: number;
  crt: number;
  pilote: number;
  accueil: number;
  dotation: number;
  orientation: number;
  trimestre: number;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/** Ce que l'on sait en fin de semaine w ; ce qui n'est pas révélé est compté en espérance. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const dit = (k: number) => w >= EFFET[k]!;
  const choix = (k: number) => (dit(k) ? chemin[k]! : NEUTRE[k]!);
  const tombe = (id: string) => {
    const i = imprevu(h, id);
    return i !== undefined && i.semaine <= w;
  };
  const multiple = tombe("taux") ? annuite(ANNEES, TAUX_RELEVE) : MULTIPLE;
  const pi = croyance(graine, w);
  const esp = (f: (k: Scenario) => number) => SCENARIOS.reduce((s, k) => s + pi[k] * f(k), 0);
  const effectif = chemin.map((_, k) => choix(k));

  let trimestre = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  for (const { imprevu: i, semaine } of h.imprevus) if (semaine <= w) trimestre += i.effet;

  let excedent = 0;
  let engage = 0;
  const d1 = choix(D.orientation);
  const d6 = choix(D.cpom);

  // Le centre de ressources territorial : candidature, puis décision de l'ARS en semaine 10.
  const pCRT = chanceCRT(effectif);
  const crtConnu = w >= CRT.semaine;
  const pGagne = crtConnu ? (crtGagne(effectif, graine) ? 1 : 0) : pCRT;
  let vCRT = 0;
  if (dit(D.crt)) {
    const o = chemin[D.crt]!;
    vCRT = -CRT.dossier[o]! + pGagne * multiple * margeCRT(o);
    excedent += pGagne * margeCRT(o);
    engage += CRT.dossier[o]!;
  }

  // L'orientation de la semaine 1, et les places que le mandat du CPOM y ajoute.
  let vOrientation = 0;
  let vTransfo = 0;
  let vErosion = 0;
  let vDotation = 0;
  if (dit(D.orientation)) {
    if (d1 === ORIENTATION.defendre) vOrientation -= DOSSIER_EXTENSION;
    if (d1 === ORIENTATION.etapes) vOrientation -= AMENAGEMENT * PLACES_D1[d1];
    if (d1 === ORIENTATION.grand) {
      vOrientation -= TRANSITION_RAPIDE;
      const connu = w >= DEPARTS.semaine;
      const p = connu ? (departsBeaune(effectif, graine) ? 1 : 0) : DEPARTS.chance;
      vOrientation -= p * DEPARTS.cout;
    }
    engage += d1 === ORIENTATION.defendre ? DOSSIER_EXTENSION : AMENAGEMENT * PLACES_D1[d1]!;
    vTransfo = esp((k) => transformations(d1, d6, k, multiple).valeur);
    excedent += esp((k) => transformations(d1, d6, k, multiple).annuel);
    engage += AMENAGEMENT * esp((k) => transformations(d1, d6, k, multiple).ajoutees);

    // L'érosion des EHPAD hors Dijon, que l'offre de répit et le CRT atténuent.
    const fCRT = pGagne * CRT.erosionGagne + (1 - pGagne) * CRT.erosionPerdu;
    const pertes = esp((k) => VACANCES[k]) * COUT_PLACE_VIDE * (1 - ATTENUATION_D1[d1]!) * fCRT;
    vErosion = -multiple * pertes;
    excedent -= pertes;
  }

  // Orchidia : sa réponse en semaine 5, sa riposte en semaine 7.
  let vOrchidia = 0;
  if (dit(D.orchidia)) {
    const o = chemin[D.orchidia]!;
    const pA =
      o !== ORCHIDIA_OPTIONS.convention
        ? 0
        : w >= REPONSE_ORCHIDIA
          ? orchidiaAccepte(effectif, graine)
            ? 1
            : 0
          : chanceOrchidia(effectif);
    const pR =
      o !== ORCHIDIA_OPTIONS.residence
        ? 0
        : w >= RSS.semaineRiposte
          ? orchidiaRiposte(effectif, graine)
            ? 1
            : 0
          : RSS.riposte;
    const t = tauxBanque(graine);
    for (const [accepte, pa] of [
      [true, pA],
      [false, 1 - pA],
    ] as const) {
      for (const [riposte, pr] of [
        [true, pR],
        [false, 1 - pR],
      ] as const) {
        if (pa * pr === 0) continue;
        const v = valeurOrchidia(o, accepte, riposte, t, multiple);
        vOrchidia += pa * pr * v.valeur;
        excedent += pa * pr * v.annuel;
      }
    }
    if (o === ORCHIDIA_OPTIONS.residence) engage += RSS.emprunt + RSS.etudes;
  }

  // Le dispositif renforcé : l'adhésion est connue en semaine 6, le scénario en semaine 12.
  let vPilote = 0;
  if (dit(D.pilote)) {
    const o = chemin[D.pilote]!;
    const m = esp(
      (k) =>
        pGagne * margePilote(o, h.adhesion, k, true) +
        (1 - pGagne) * margePilote(o, h.adhesion, k, false),
    );
    vPilote = multiple * m;
    excedent += m;
  }

  // L'accueil de jour : la demande des aidants n'est connue que de qui a fait l'enquête (semaine 11).
  let vAccueil = 0;
  if (dit(D.accueil)) {
    const o = chemin[D.accueil]!;
    const connu = o === ACCUEIL_OPTIONS.enquete && w >= ACCUEIL.resultat;
    const demandes: readonly (readonly [Demande, number])[] = connu
      ? [[h.demande, 1]]
      : [
          ["forte", ACCUEIL.chanceForte],
          ["faible", 1 - ACCUEIL.chanceForte],
        ];
    for (const [dem, p] of demandes) {
      vAccueil += p * multiple * margeOption(o, dem);
      excedent += p * margeOption(o, dem);
    }
    if (o === ACCUEIL_OPTIONS.enquete) vAccueil -= ACCUEIL.enquete;
    engage +=
      (o === ACCUEIL_OPTIONS.enquete ? ACCUEIL.enquete : 0) +
      (o === ACCUEIL_OPTIONS.ouvrir || o === ACCUEIL_OPTIONS.minibus || connu
        ? ACCUEIL.amenagement
        : 0);
  }

  // La dotation complémentaire du SAAD, que le département réserve aux gestionnaires engagés.
  if (dit(D.cpom)) {
    const o = chemin[D.cpom]!;
    const annuel = esp((k) =>
      k === "differe"
        ? 0
        : o === CPOM_OPTIONS.paliers || o === CPOM_OPTIONS.ferme
          ? DOTATION_ANNUELLE
          : 0,
    );
    const pAR = 1 - pi.differe;
    vDotation =
      o === CPOM_OPTIONS.report
        ? pAR * DOTATION_ANNUELLE * (multiple - 1 / (1 + TAUX))
        : multiple * annuel;
    excedent += o === CPOM_OPTIONS.report ? pAR * DOTATION_ANNUELLE : annuel;
  }

  const valeur =
    trimestre +
    vOrientation +
    vTransfo +
    vErosion +
    vOrchidia +
    vCRT +
    vPilote +
    vAccueil +
    vDotation;
  return {
    valeur,
    excedent,
    engage,
    transformations: vTransfo,
    erosion: vErosion,
    orchidia: vOrchidia,
    crt: vCRT,
    pilote: vPilote,
    accueil: vAccueil,
    dotation: vDotation,
    orientation: vOrientation,
    trimestre,
  };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  scenario: Scenario;
  /** Les choix de la semaine 1 et de la semaine 2, pour le bilan. */
  orientation: number;
  choixOrchidia: number;
  signal: boolean;
  adhesion: number;
  orchidiaAccepte: boolean;
  orchidiaRiposte: boolean;
  chanceOrchidia: number;
  crtGagne: boolean;
  chanceCRT: number;
  departs: boolean;
  demande: Demande;
  places: number;
  excedent: number;
  engage: number;
  estimation: Estimation;
  taux: number;
}

/** Le taux d'occupation de départ des six EHPAD. */
export const OCCUPATION_DEPART = 0.955;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    let occupation = OCCUPATION_DEPART - 0.0003 * w + h.bruit[w]!;
    // Annoncer la transformation de Beaune gèle ses admissions dès la semaine 3.
    if (chemin[D.orientation] === ORIENTATION.grand && w >= 3) occupation -= 0.0015 * (w - 2);
    if (chemin[D.orchidia] === ORCHIDIA_OPTIONS.prix && w >= 4) occupation += 0.0004 * (w - 3);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      excedent: e.excedent,
      engage: e.engage,
      occupation,
      differe: croyance(graine, w).differe,
    });
    avant = e.valeur;
    fin = e;
  }
  const t = imprevu(h, "taux");
  return {
    semaines,
    objectif: fin!.valeur,
    scenario: h.scenario,
    orientation: chemin[D.orientation]!,
    choixOrchidia: chemin[D.orchidia]!,
    signal: h.signal,
    adhesion: h.adhesion,
    orchidiaAccepte: orchidiaAccepte(chemin, graine),
    orchidiaRiposte: orchidiaRiposte(chemin, graine),
    chanceOrchidia: chanceOrchidia(chemin),
    crtGagne: crtGagne(chemin, graine),
    chanceCRT: chanceCRT(chemin),
    departs: departsBeaune(chemin, graine),
    demande: h.demande,
    places: transformations(chemin[D.orientation]!, chemin[D.cpom]!, h.scenario).places,
    excedent: fin!.excedent,
    engage: fin!.engage,
    estimation: fin!,
    taux: t && t.semaine <= SEMAINES ? TAUX_RELEVE : TAUX,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, résultats, votes, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    orchidia: chemin[D.orchidia] === ORCHIDIA_OPTIONS.convention && dans(REPONSE_ORCHIDIA),
    riposte: chemin[D.orchidia] === ORCHIDIA_OPTIONS.residence && dans(RSS.semaineRiposte),
    departs: chemin[D.orientation] === ORIENTATION.grand && dans(DEPARTS.semaine),
    crt: chemin[D.crt] !== CRT_OPTIONS.rien && dans(CRT.semaine),
    enquete: chemin[D.accueil] === ACCUEIL_OPTIONS.enquete && dans(ACCUEIL.resultat),
    vote: dans(SCENARIO.semaine),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureVirage {
  valeur: number | null;
  excedent: number | null;
  engage: number | null;
  occupation: number | null;
  differe: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  adhesion: number | null;
  signal: number | null;
  taux: number | null;
}

/** Ce que Gratienne lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureVirage {
  const h = hasard(graine);
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const tx = imprevu(h, "taux");
  if (semaine === 0) {
    return {
      valeur: 0,
      excedent: 0,
      engage: 0,
      occupation: OCCUPATION_DEPART,
      differe: PROBA.differe,
      adhesion: h.adhesion,
      signal: h.signal ? 1 : 0,
      taux: TAUX,
    };
  }
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    valeur: s.valeur,
    excedent: s.excedent,
    engage: s.engage,
    occupation: s.occupation,
    differe: s.differe,
    adhesion: h.adhesion,
    signal: h.signal ? 1 : 0,
    taux: tx && tx.semaine <= semaine ? TAUX_RELEVE : TAUX,
  };
}
