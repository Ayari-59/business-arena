/**
 * L'ASSOCIATION QUI DEMANDE À ÊTRE REPRISE — le modèle de la reprise des
 * Primevères par l'Association Solvanne.
 *
 * L'association des Primevères, à Nuits-Saint-Georges, gère un institut
 * médico-éducatif (IME, 45 enfants et adolescents) et un établissement et
 * service d'aide par le travail (ESAT, 60 travailleurs). Elle est au bord de
 * la cessation de paiements : dix-huit jours de trésorerie, des fonds propres
 * négatifs, un siège trop lourd pour sa taille. L'ARS demande à Solvanne de
 * la reprendre par fusion-absorption avant l'été. Ursule Mauvernay, directrice
 * générale, a le trimestre de janvier à mars pour répondre, faire auditer,
 * négocier avec l'autorité de tarification et préparer les équipes.
 *
 * LA VALEUR CRÉÉE, ESTIMÉE EN SEMAINE 13. Une reprise se juge sur des années ;
 * l'épisode dure un trimestre. Il est jugé sur ce que la reprise apporte ou
 * coûte aux réserves de Solvanne sur les cinq ans du prochain CPOM, en cumul
 * non actualisé, par rapport à la situation de départ, telle que la direction
 * financière l'estime chaque semaine :
 *
 *   · si Solvanne reprend : le résultat des budgets sociaux repris (le déficit
 *     d'aujourd'hui, moins les économies de la fusion), ce que l'ARS finance
 *     (la transition, les économies laissées dans les dotations par avenant
 *     au CPOM, la reprise du passif social, les passifs révélés par l'audit
 *     si on les lui présente), moins ce qui reste à la charge de Solvanne
 *     (passif social, contentieux prud'homal, travaux de mise en sécurité),
 *     le budget commercial de l'ESAT, le coût des départs de cadres, les frais
 *     de fusion et d'audit, plus le crédit gagné auprès de l'ARS ;
 *   · si Solvanne refuse ou se retire : un autre gestionnaire reprend les
 *     Primevères, et Solvanne paie, ou non, ce refus au prochain CPOM.
 *
 * Avant d'être connu, chaque aléa (l'enveloppe régionale, la réponse de l'ARS,
 * ce que cachent les Primevères, la rancune de l'ARS, les départs) compte pour
 * son espérance, aux probabilités que les sources donnent ; il compte pour ce
 * qu'il est dès que le trimestre le révèle. Une décision pas encore prise
 * compte comme « ne rien changer ». Le hasard porte sur ce que le trimestre
 * révèle, jamais sur les règles du calcul.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · L'AUDIT COÛTE, ET CHANGE LA RÉPONSE. Les comptes certifiés ne disent ni
 *     le contentieux prud'homal en cours, ni l'état de l'internat. Un audit
 *     complet les révèle avant le vote ; présentés à l'ARS, ils s'inscrivent
 *     dans l'avenant (le contentieux en crédits non reconductibles, les
 *     travaux au plan pluriannuel d'investissement) ; découverts après le
 *     vote, ils sont pour Solvanne.
 *   · CE QUE L'ARS ACCORDE DÉPEND DU DOSSIER. Sa réponse est tirée au hasard,
 *     mais ses chances suivent la qualité du dossier : chiffré, audité,
 *     cohérent avec ce qu'elle a le droit de financer. Un « oui » donné
 *     d'avance lui retire toute raison de payer ; l'enveloppe régionale de
 *     l'année (confortable, normale, serrée) fait le reste.
 *   · LE BUDGET COMMERCIAL DE L'ESAT EST À PART. Le budget annexe de
 *     production et de commercialisation s'équilibre par ses ventes : l'ARS
 *     ne le finance pas, et faire glisser ses charges sur le budget social est
 *     rejeté à la première lecture. Seul un plan commercial le redresse.
 *   · REFUSER A UN PRIX. Si Solvanne refuse, un autre gestionnaire reprend les
 *     Primevères, et l'ARS s'en souvient six fois sur dix au prochain CPOM ;
 *     se retirer après avoir négocié se paie plus cher encore.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les années du prochain CPOM, sur lesquelles la reprise se juge. */
export const HORIZON = 5;
/** La valeur que le conseil d'administration attend de la reprise, au moins. */
export const OBJECTIF_VALEUR = 100000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : l'avocat prépare la réponse à l'ARS dans l'urgence. */
export const PERTE_PAR_JOUR = 2000;

/** Les Primevères, d'après leurs comptes 2025. */
export const PRIMEVERES = {
  enfants: 45,
  travailleurs: 60,
  salaries: 68,
  produits: 6100000,
  /** Les déficits des budgets sociaux : l'IME, et le budget principal de l'ESAT. */
  deficitIme: 175000,
  deficitEsatSocial: 35000,
  /** La trésorerie, en jours de charges, au 1er janvier. */
  tresorerie: 18,
} as const;
export const DEFICIT_SOCIAL = PRIMEVERES.deficitIme + PRIMEVERES.deficitEsatSocial;

/**
 * LES ÉCONOMIES DE LA FUSION, par an en régime de croisière : le siège des
 * Primevères (direction générale, comptabilité, paie, commissaire aux
 * comptes) remplacé par celui de Solvanne, qui demande un renfort ; les achats
 * et les transports mutualisés. La moitié seulement la première année.
 */
export const ECONOMIES = { siege: 250000, renfort: 60000, achats: 90000 } as const;
export const ECONOMIES_NETTES = ECONOMIES.siege - ECONOMIES.renfort + ECONOMIES.achats;
/** Le résultat des budgets sociaux repris : l'année de transition, puis chaque année suivante. */
export const RESULTAT_TRANSITION = ECONOMIES_NETTES / 2 - DEFICIT_SOCIAL;
export const RESULTAT_REGIME = ECONOMIES_NETTES - DEFICIT_SOCIAL;
export const RESULTAT_CUMULE = RESULTAT_TRANSITION + (HORIZON - 1) * RESULTAT_REGIME;

/**
 * LE PASSIF SOCIAL NON PROVISIONNÉ : les indemnités de départ à la retraite
 * des salariés qui partiront dans les cinq ans (six mois de salaire chargé
 * chacun), et les jours épargnés sur les comptes épargne-temps.
 */
export const IDR = { salaries: 12, mois: 6, salaireCharge: 3900 } as const;
export const CET = { jours: 440, coutJour: 190 } as const;
export const MONTANT_IDR = IDR.salaries * IDR.mois * IDR.salaireCharge;
export const MONTANT_CET = CET.jours * CET.coutJour;
export const PASSIF_SOCIAL = MONTANT_IDR + MONTANT_CET;

/** Ce que les comptes ne disent pas : un contentieux prud'homal, des travaux de mise en sécurité. */
export const PRUDHOMMES = { chance: 0.5, montant: 85000 } as const;
export const TRAVAUX = {
  chance: 0.6,
  moyenne: 300000,
  ecart: 50000,
  min: 200000,
  max: 420000,
} as const;

/**
 * CE QUE L'ARS PEUT ACCORDER. Les crédits non reconductibles de l'année de
 * transition, toujours ; un avenant au CPOM qui laisse les économies de la
 * fusion dans les dotations (sans lui, l'ARS reprend l'excédent à partir de
 * la troisième année) ; la reprise du passif social.
 */
export const TRANSITION = -RESULTAT_TRANSITION;
export const ECONOMIES_REPRISES = (HORIZON - 2) * RESULTAT_REGIME;

/** Les trois états de l'enveloppe régionale de crédits non reconductibles, connus en semaine 7. */
export const SCENARIOS = [
  { id: "confortable", nom: "confortable", chance: 0.25, effet: 0.15 },
  { id: "normale", nom: "normale", chance: 0.45, effet: 0 },
  { id: "serree", nom: "serrée", chance: 0.3, effet: -0.25 },
] as const;

/** La qualité du dossier : ce qui fait pencher l'ARS. */
export const QUALITE = {
  /** Selon ce que le dossier demande : rien de chiffré, tout chiffré, tout y compris l'ESAT commercial, les déficits seulement. */
  dossier: [0.1, 0.6, 0.35, 0.6],
  /** Selon l'audit : aucun, complet, financier et social, par le siège. */
  audit: [0, 0.2, 0.1, 0.03],
  /** Selon la réponse de principe : un oui sans conditions ôte à l'ARS toute raison de payer. */
  reponse: [-0.3, 0, 0, -0.15],
  /** L'accord complet si le tirage est sous la qualité ; partiel s'il est sous la qualité plus cet écart. */
  partiel: 0.35,
  /** Une seconde demande, appuyée sur des chiffres d'audit, est plus facile à accorder. */
  seconde: 0.1,
  /** Des charges glissées du budget commercial vers le budget social, et rejetées. */
  imputation: -0.15,
  /** Un ultimatum braque l'ARS : rouvrir en menaçant de se retirer. */
  ultimatum: -0.12,
  min: 0.02,
  max: 0.95,
} as const;

/** Les frais de la fusion (commissaire à la fusion, notaire, avocats) ; ceux d'un retrait tardif. */
export const FRAIS_FUSION = 40000;
export const FRAIS_RETRAIT = 15000;
/** Rouvrir la négociation reporte le vote : deux mois de gestion transitoire de plus. */
export const COUT_REPORT = 10000;
/** Le coût de chaque audit : aucun, complet, financier et social, par le siège. */
export const AUDITS = [0, 48000, 22000, 6000] as const;

/** Le crédit gagné auprès de l'ARS par une reprise : son appui au prochain CPOM. */
export const CREDIT = { reprise: 80000, repriseSansConditions: 100000 } as const;
/**
 * LA RANCUNE DE L'ARS au prochain CPOM : l'extension de douze places du FAM
 * refusée et les crédits non reconductibles comptés. Six fois sur dix après un
 * refus, plus souvent et plus cher après un retrait tardif.
 */
export const RANCUNE = {
  moyenne: 190000,
  ecart: 40000,
  min: 110000,
  max: 270000,
  leger: 30000,
  refus: { chance: 0.6, facteur: 1 },
  perdu: { chance: 0.6, facteur: 0.8 },
  retrait: { chance: 0.75, facteur: 1.2 },
  retraitApresOui: { chance: 0.9, facteur: 1.3 },
} as const;
/** Faute de réponse, l'ARS confie le dossier à un autre gestionnaire une fois sur deux. */
export const CHANCE_PERTE = 0.5;

/**
 * LE BUDGET COMMERCIAL DE L'ESAT : la blanchisserie perd 80 k€ par an depuis
 * qu'une clinique a renégocié son contrat, les espaces verts et le
 * conditionnement en gagnent 25.
 */
export const ESAT = {
  blanchisserie: -80000,
  espacesVerts: 15000,
  conditionnement: 10000,
  /** Recentrer : sortir du contrat déficitaire, redéployer, réviser les tarifs. */
  recentrage: { cout: 20000, premiereAnnee: -30000, regime: -5000 },
  /** L'appel d'offres d'entretien des espaces verts de la communauté de communes. */
  appel: { materiel: 50000, chance: 0.5, gain: 38000, annees: 4, revente: 15000 },
} as const;
export const DEFICIT_ESAT = -(ESAT.blanchisserie + ESAT.espacesVerts + ESAT.conditionnement);
/** Ce que chaque plan pour le budget commercial coûte sur cinq ans, hors appel d'offres. */
export const VALEUR_RECENTRAGE =
  -ESAT.recentrage.cout + ESAT.recentrage.premiereAnnee + (HORIZON - 1) * ESAT.recentrage.regime;
export const VALEUR_STATU_QUO = -HORIZON * DEFICIT_ESAT;
export const VALEUR_APPEL_GAGNE =
  VALEUR_RECENTRAGE - ESAT.appel.materiel + ESAT.appel.annees * ESAT.appel.gain;
export const VALEUR_APPEL_PERDU = VALEUR_RECENTRAGE - ESAT.appel.materiel + ESAT.appel.revente;

/**
 * LES ÉQUIPES : la directrice de l'IME et le chef des ateliers de l'ESAT ont
 * des offres ailleurs. Chaque façon de préparer la fusion a son coût, et ses
 * chances de les garder. [directrice, chef des ateliers]
 */
export const EQUIPES = {
  departs: [
    [0.7, 0.5],
    [0.12, 0.1],
    [0.08, 0.08],
    [0.85, 0.3],
  ],
  couts: [0, 15000, 90000, -20000],
  directrice: 90000,
  chef: 35000,
} as const;

/** Les semaines où le trimestre révèle quelque chose. */
export const ANNONCES = {
  perte: 4,
  auditSocial: 5,
  auditBatiments: 6,
  ars: 7,
  controle: 9,
  reponse2: 11,
  cpom: 11,
  departs: 12,
  appel: 12,
  prudhommes: 12,
  commission: 13,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = { reponse: 0, audit: 1, dossier: 2, esat: 3, cap: 4, equipes: 5 } as const;
/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;
/** Ne rien changer : différer la réponse, pas d'audit, rien chiffré, ESAT en l'état, voter comme prévu, rien annoncer. */
export const NEUTRE = [3, 0, 0, 0, 0, 0] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce qu'il coûte à la reprise, si elle se fait. */
  cout: number;
  /** Ce qu'il change aux dispositions de l'ARS. */
  qualite: number;
  /** Les jours de trésorerie que les Primevères perdent. */
  tresorerie: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "La grippe dans trois EHPAD de Solvanne",
    de: "Cassien Calvayrac",
    role: "Directeur des ressources humaines, Solvanne",
    texte:
      "L'épidémie de grippe touche Montchapet, Beaune et Chalon : un soignant sur cinq est arrêté. Toute l'équipe RH du siège est sur les plannings pour deux semaines ; le cabinet d'avocats reprend la préparation juridique de la fusion, 12 k€ d'honoraires de plus.",
    cout: 12000,
    qualite: 0,
    tresorerie: 0,
  },
  {
    id: "banque",
    titre: "La banque coupe la facilité de caisse des Primevères",
    de: "Alcide Mazodier",
    role: "Président des Primevères",
    texte:
      "La Banque Saônelle ne renouvelle pas notre facilité de caisse. Nous perdons huit jours de trésorerie ; j'ai prévenu l'ARS. Elle sait maintenant qu'il n'y a plus de temps.",
    cout: 0,
    qualite: 0.08,
    tresorerie: 8,
  },
  {
    id: "inspection",
    titre: "Une inspection de l'ARS à l'IME des Primevères",
    de: "Irmine Marsaudon",
    role: "Directrice de l'IME des Primevères",
    texte:
      "Après la réclamation d'une famille sur les transports, l'ARS a inspecté l'IME. Pas de faute grave, mais six injonctions : projets personnalisés à mettre à jour, registre des événements indésirables, formation. Le plan d'actions coûtera 30 k€ ; l'ARS y voit une raison de plus de presser la reprise.",
    cout: 30000,
    qualite: 0.05,
    tresorerie: 0,
  },
  {
    id: "revalorisation",
    titre: "Une revalorisation salariale de la branche",
    de: "Eudoxie Rambourg",
    role: "Directrice administrative et financière, Solvanne",
    texte:
      "L'avenant de revalorisation de la branche est agréé : +1,2 % sur les salaires au 1er avril, financé à 80 % par les autorités de tarification. Aux Primevères, le reste fera 6 k€ de déficit de plus par an, 30 k€ sur cinq ans.",
    cout: 30000,
    qualite: 0,
    tresorerie: 0,
  },
  {
    id: "chaudiere",
    titre: "La chaudière de l'internat des Primevères lâche",
    de: "Rosalinde Charvolin",
    role: "Responsable des travaux, siège de Solvanne",
    texte:
      "La chaudière de l'internat de l'IME est hors service ; les enfants dorment chez eux trois nuits, le temps d'un chauffage d'appoint. La remplacer coûte 22 k€, que les Primevères ne peuvent pas payer : ce sera pour le repreneur.",
    cout: 22000,
    qualite: 0,
    tresorerie: 0,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'enveloppe régionale de crédits non reconductibles : 0 confortable, 1 normale, 2 serrée. */
  scenario: number;
  /** Les tirages des deux réponses de l'ARS. */
  u1: number;
  u2: number;
  prudhommes: boolean;
  /** Le montant des travaux de mise en sécurité de l'internat, 0 s'il n'y en a pas. */
  travaux: number;
  uRancune: number;
  montantRancune: number;
  uPerte: number;
  uDirectrice: number;
  uChef: number;
  /** La communauté de communes attribue-t-elle le marché des espaces verts à l'ESAT ? */
  appel: boolean;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001023 + 7);
  const us = r();
  const scenario =
    us < SCENARIOS[0].chance ? 0 : us < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  const u1 = r();
  const u2 = r();
  const prudhommes = r() < PRUDHOMMES.chance;
  const aTravaux = r() < TRAVAUX.chance;
  const montant = borne(TRAVAUX.moyenne + TRAVAUX.ecart * gauss(r), TRAVAUX.min, TRAVAUX.max);
  const travaux = aTravaux ? Math.round(montant / 1000) * 1000 : 0;
  const uRancune = r();
  const montantRancune =
    Math.round(borne(RANCUNE.moyenne + RANCUNE.ecart * gauss(r), RANCUNE.min, RANCUNE.max) / 1000) *
    1000;
  const uPerte = r();
  const uDirectrice = r();
  const uChef = r();
  const appel = r() >= 1 - ESAT.appel.chance;
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    scenario,
    u1,
    u2,
    prudhommes,
    travaux,
    uRancune,
    montantRancune,
    uPerte,
    uDirectrice,
    uChef,
    appel,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LA QUALITÉ DU DOSSIER, ET CE QUE L'ARS ACCORDE.
 * ------------------------------------------------------------------------- */

const qBorne = (q: number) => borne(q, QUALITE.min, QUALITE.max);

/** Le bonus des imprévus qui pressent l'ARS, tombés au plus tard la semaine donnée. */
const bonusImprevus = (h: Hasard, jusqua: number) =>
  h.imprevus.reduce((s, i) => s + (i.semaine <= jusqua ? i.imprevu.qualite : 0), 0);

/** Les chances d'un accord complet à la première demande (semaine 7), selon le dossier et l'enveloppe. */
export function qualitePremiere(chemin: readonly number[], scenario: number, bonus = 0): number {
  return qBorne(
    QUALITE.dossier[chemin[D.dossier]!]! +
      QUALITE.audit[chemin[D.audit]!]! +
      QUALITE.reponse[chemin[D.reponse]!]! +
      SCENARIOS[scenario]!.effet +
      bonus,
  );
}

/** Les chances que la seconde demande (semaine 11) soit accordée. */
export function qualiteSeconde(chemin: readonly number[], scenario: number, bonus = 0): number {
  return qBorne(
    QUALITE.dossier[chemin[D.dossier]!]! +
      QUALITE.audit[chemin[D.audit]!]! +
      QUALITE.reponse[chemin[D.reponse]!]! +
      SCENARIOS[scenario]!.effet +
      bonus +
      QUALITE.seconde +
      (chemin[D.esat] === 2 ? QUALITE.imputation : 0) +
      (chemin[D.cap] === 3 ? QUALITE.ultimatum : 0),
  );
}

/** Les probabilités des trois réponses de l'ARS : [minimale, partielle, complète]. */
export function chancesReponse(chemin: readonly number[], q: number): [number, number, number] {
  // Qui ne demande que les déficits n'obtient jamais la reprise du passif.
  const complet = chemin[D.dossier] === 3 ? 0 : q;
  const auMoinsPartiel = Math.min(1, q + QUALITE.partiel);
  return [1 - auMoinsPartiel, auMoinsPartiel - complet, complet];
}

/** La réponse tirée : 1 minimale (la transition), 2 partielle (+ l'avenant), 3 complète (+ le passif social). */
export function niveauReponse(chemin: readonly number[], q: number, u: number): 1 | 2 | 3 {
  const [, partiel, complet] = chancesReponse(chemin, q);
  return u < complet ? 3 : u < complet + partiel ? 2 : 1;
}

/** Ce que l'audit choisi révèle : le contentieux (complet, financier et social), les travaux (complet). */
export const auditRevele = (audit: number) => ({
  prudhommes: audit === 1 || audit === 2,
  travaux: audit === 1,
});

type ModeRefus = "refus" | "perdu" | "retrait" | "retraitApresOui";

const rancuneDe = (h: Hasard, mode: ModeRefus, connu: boolean) => {
  const r = RANCUNE[mode];
  if (connu) return r.facteur * (h.uRancune < r.chance ? h.montantRancune : RANCUNE.leger);
  return r.facteur * (r.chance * RANCUNE.moyenne + (1 - r.chance) * RANCUNE.leger);
};

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export type Issue = "reprise" | "refus" | "perdu" | "retrait";

export interface Estimation {
  valeur: number;
  /** Ce qui est acquis de l'ARS, en euros sur cinq ans. */
  couverture: number;
  /** Les passifs connus des Primevères. */
  passifs: number;
  /** Ce qui en reste à la charge de Solvanne, si elle reprend. */
  nonCouverts: number;
  /** Le déficit annuel prévu du budget commercial de l'ESAT, en régime. */
  deficitEsat: number;
  issue: Issue | null;
}

/** Les décisions qui ont pris effet en fin de semaine w ; les autres valent « ne rien changer ». */
const enVigueur = (chemin: readonly number[], w: number) =>
  NEUTRE.map((n, k) => (w >= EFFET[k]! ? (chemin[k] ?? n) : n));

/** La valeur d'une reprise, sachant ce que la semaine w a révélé. */
function valeurReprise(c: readonly number[], h: Hasard, w: number, accordee?: boolean) {
  const [d1, d2, , d4, d5, d6] = c as [number, number, number, number, number, number];
  const connuScenario = w >= ANNONCES.ars;
  const connuReponse = w >= ANNONCES.ars;
  const rouvre = d5 === 1 || d5 === 3;
  const connuSeconde = w >= ANNONCES.reponse2;
  const revele = auditRevele(d2);

  // Les passifs cachés : leur montant, et s'ils sont connus.
  const prudConnu = (revele.prudhommes && w >= ANNONCES.auditSocial) || w >= ANNONCES.prudhommes;
  const travauxConnus =
    (revele.travaux && w >= ANNONCES.auditBatiments) || w >= ANNONCES.commission;
  const prud = prudConnu
    ? h.prudhommes
      ? PRUDHOMMES.montant
      : 0
    : PRUDHOMMES.chance * PRUDHOMMES.montant;
  const trav = travauxConnus ? h.travaux : TRAVAUX.chance * TRAVAUX.moyenne;

  const scenarios = connuScenario ? [h.scenario] : [0, 1, 2];
  let valeurARS = 0;
  let couverture = 0;
  let nonCouverts = 0;
  for (const s of scenarios) {
    const poids = connuScenario ? 1 : SCENARIOS[s]!.chance;
    const q1 = qualitePremiere(c, s, bonusImprevus(h, Math.min(w, ANNONCES.ars)));
    const q2 = qualiteSeconde(c, s, bonusImprevus(h, Math.min(w, ANNONCES.reponse2)));
    let probas: [number, number, number];
    if (connuReponse) {
      const n = niveauReponse(c, q1, h.u1);
      probas = [n === 1 ? 1 : 0, n === 2 ? 1 : 0, n === 3 ? 1 : 0];
    } else {
      probas = chancesReponse(c, q1);
    }
    const ps = !rouvre
      ? 0
      : accordee !== undefined
        ? accordee
          ? 1
          : 0
        : connuSeconde
          ? h.u2 < q2
            ? 1
            : 0
          : q2;
    const pAvenant = probas[1] + probas[2] + probas[0] * ps;
    const pPassif = probas[2] + (probas[0] + probas[1]) * ps;
    const pCaches = ps;
    const cacheCouvert = pCaches * ((revele.prudhommes ? prud : 0) + (revele.travaux ? trav : 0));
    const v =
      TRANSITION -
      (1 - pAvenant) * ECONOMIES_REPRISES -
      (1 - pPassif) * PASSIF_SOCIAL -
      prud -
      trav +
      cacheCouvert;
    valeurARS += poids * v;
    // Ce qui est acquis : seulement ce que l'ARS a déjà répondu.
    if (connuReponse) {
      const acquisAvenant = probas[1] + probas[2] + (connuSeconde ? probas[0] * ps : 0);
      const acquisPassif = probas[2] + (connuSeconde ? (probas[0] + probas[1]) * ps : 0);
      const acquisCaches = connuSeconde ? cacheCouvert : 0;
      couverture +=
        poids *
        (TRANSITION +
          acquisAvenant * ECONOMIES_REPRISES +
          acquisPassif * PASSIF_SOCIAL +
          acquisCaches);
      nonCouverts +=
        poids *
        ((1 - acquisPassif) * PASSIF_SOCIAL +
          (prudConnu ? prud : 0) +
          (travauxConnus ? trav : 0) -
          acquisCaches);
    } else {
      nonCouverts += poids * (PASSIF_SOCIAL + (prudConnu ? prud : 0) + (travauxConnus ? trav : 0));
    }
  }

  // Le budget commercial de l'ESAT.
  let esat: number;
  let deficitEsat: number;
  if (d4 === 1) {
    esat = VALEUR_RECENTRAGE;
    deficitEsat = -ESAT.recentrage.regime;
  } else if (d4 === 3) {
    const connu = w >= ANNONCES.appel;
    const p = connu ? (h.appel ? 1 : 0) : ESAT.appel.chance;
    esat = p * VALEUR_APPEL_GAGNE + (1 - p) * VALEUR_APPEL_PERDU;
    deficitEsat = -ESAT.recentrage.regime - (connu && h.appel ? ESAT.appel.gain : 0);
  } else if (d4 === 2) {
    esat = VALEUR_STATU_QUO;
    // Les charges glissées sur le budget social masquent le déficit, jusqu'au contrôle.
    deficitEsat = w >= ANNONCES.controle ? DEFICIT_ESAT : DEFICIT_ESAT - 35000;
  } else {
    esat = VALEUR_STATU_QUO;
    deficitEsat = DEFICIT_ESAT;
  }

  // Les équipes : les départs, connus en semaine 12.
  const [pDir, pChef] = EQUIPES.departs[d6]!;
  const connuDeparts = w >= ANNONCES.departs;
  const dir = connuDeparts ? (h.uDirectrice < pDir ? 1 : 0) : pDir;
  const chef = connuDeparts ? (h.uChef < pChef ? 1 : 0) : pChef;
  const equipes = -EQUIPES.couts[d6]! - dir * EQUIPES.directrice - chef * EQUIPES.chef;

  const imprevus = h.imprevus.reduce((s, i) => s + (i.semaine <= w ? i.imprevu.cout : 0), 0);
  const credit = d1 === 0 ? CREDIT.repriseSansConditions : CREDIT.reprise;
  const valeur =
    RESULTAT_CUMULE +
    valeurARS +
    esat +
    equipes -
    imprevus +
    credit -
    FRAIS_FUSION -
    AUDITS[d2]! -
    (rouvre ? COUT_REPORT : 0);
  const passifs = PASSIF_SOCIAL + (prudConnu ? prud : 0) + (travauxConnus ? trav : 0);
  return { valeur, couverture, passifs, nonCouverts, deficitEsat };
}

/** Ce que l'on sait en fin de semaine w ; le reste compte pour son espérance. */
export function estimer(
  chemin: readonly number[],
  graine: number,
  w: number,
  jours: number,
): Estimation {
  const h = hasard(graine);
  const perte = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const c = enVigueur(chemin, w);
  const passifsConnus = PASSIF_SOCIAL;
  const vide = (valeur: number, issue: Issue): Estimation => ({
    valeur: perte + valeur,
    couverture: 0,
    passifs: passifsConnus,
    nonCouverts: 0,
    deficitEsat: DEFICIT_ESAT,
    issue,
  });
  if (w < EFFET[D.reponse]) {
    return { ...vide(0, "reprise"), issue: null };
  }
  const connuCpom = w >= ANNONCES.cpom;
  const d1 = c[D.reponse]!;
  if (d1 === 2) return vide(-rancuneDe(h, "refus", connuCpom), "refus");

  const valeurPerdu = -rancuneDe(h, "perdu", connuCpom) - AUDITS[c[D.audit]!]! / 2;
  const suite = (): Estimation => {
    if (c[D.cap] === 2) {
      const mode = d1 === 0 ? "retraitApresOui" : "retrait";
      return vide(-rancuneDe(h, mode, connuCpom) - AUDITS[c[D.audit]!]! - FRAIS_RETRAIT, "retrait");
    }
    const enReprise = (r: ReturnType<typeof valeurReprise>): Estimation => ({
      valeur: perte + r.valeur,
      couverture: r.couverture,
      passifs: r.passifs,
      nonCouverts: r.nonCouverts,
      deficitEsat: r.deficitEsat,
      issue: "reprise",
    });
    if (c[D.cap] === 3) {
      // L'ultimatum : la reprise si l'ARS accorde la seconde demande, le retrait sinon.
      const mode = d1 === 0 ? "retraitApresOui" : "retrait";
      const retrait = vide(
        -rancuneDe(h, mode, connuCpom) - AUDITS[c[D.audit]!]! - FRAIS_RETRAIT - COUT_REPORT,
        "retrait",
      );
      const ps =
        w >= ANNONCES.reponse2
          ? secondeAccordee(c, graine)
            ? 1
            : 0
          : qualiteSeconde(c, h.scenario, bonusImprevus(h, w));
      if (ps === 1) return enReprise(valeurReprise(c, h, w, true));
      if (ps === 0) return retrait;
      const oui = enReprise(valeurReprise(c, h, w, true));
      return { ...oui, valeur: ps * oui.valeur + (1 - ps) * retrait.valeur };
    }
    return enReprise(valeurReprise(c, h, w));
  };
  if (d1 === 3) {
    if (w >= ANNONCES.perte) {
      if (h.uPerte < CHANCE_PERTE) return vide(valeurPerdu, "perdu");
      return suite();
    }
    const s = suite();
    return {
      ...s,
      valeur: CHANCE_PERTE * (perte + valeurPerdu) + (1 - CHANCE_PERTE) * s.valeur,
    };
  }
  return suite();
}

/** L'ARS accorde-t-elle la seconde demande, celle de la semaine 11 ? */
export function secondeAccordee(chemin: readonly number[], graine: number): boolean {
  const h = hasard(graine);
  return h.u2 < qualiteSeconde(chemin, h.scenario, bonusImprevus(h, ANNONCES.reponse2));
}

/** Les Primevères sont-elles confiées à un autre gestionnaire faute de réponse ? */
export const dossierPerdu = (chemin: readonly number[], graine: number) =>
  chemin[D.reponse] === 3 && hasard(graine).uPerte < CHANCE_PERTE;

/** L'issue du trimestre, une fois toutes les décisions prises. */
export function issueDe(chemin: readonly number[], graine: number): Issue {
  if (chemin[D.reponse] === 2) return "refus";
  if (dossierPerdu(chemin, graine)) return "perdu";
  if (chemin[D.cap] === 2) return "retrait";
  if (chemin[D.cap] === 3 && !secondeAccordee(chemin, graine)) return "retrait";
  return "reprise";
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** Les engagements obtenus de l'ARS, en euros sur cinq ans. */
  couverture: number;
  /** Les passifs connus des Primevères. */
  passifs: number;
  nonCouverts: number;
  /** Le déficit annuel prévu du budget commercial de l'ESAT. */
  deficitEsat: number;
  /** La trésorerie des Primevères, en jours de charges. */
  tresorerie: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  issue: Issue;
  scenario: number;
  /** La réponse de l'ARS en semaine 7 : 1 minimale, 2 partielle, 3 complète ; 0 sans objet. */
  reponse: 0 | 1 | 2 | 3;
  /** La seconde réponse, si la négociation a été rouverte. */
  seconde: boolean | null;
  prudhommes: boolean;
  travaux: number;
  /** Ce que l'audit a révélé avant le vote. */
  revele: { prudhommes: boolean; travaux: boolean };
  /** L'ARS a-t-elle fait payer le refus au prochain CPOM ? null : pas de refus. */
  rancune: boolean | null;
  montantRancune: number;
  /** Ce que le refus ou le retrait coûte au prochain CPOM ; 0 si Solvanne reprend. */
  coutRefus: number;
  departDirectrice: boolean;
  departChef: boolean;
  appel: boolean | null;
  couverture: number;
  passifs: number;
  nonCouverts: number;
  deficitEsat: number;
}

const tresorerieA = (h: Hasard, w: number) => {
  let t = PRIMEVERES.tresorerie - 1.5 * w;
  for (const i of h.imprevus) if (i.semaine <= w) t -= i.imprevu.tresorerie;
  // En semaine 7, l'ARS verse une avance sur les crédits de transition, quel que soit le repreneur.
  if (w >= ANNONCES.ars) t += 25;
  return Math.max(2, t);
};

/** La façon dont Solvanne a dit non, qui règle la rancune de l'ARS. */
export const modeRefus = (chemin: readonly number[], issue: Issue): ModeRefus =>
  issue === "retrait"
    ? chemin[D.reponse] === 0
      ? "retraitApresOui"
      : "retrait"
    : issue === "perdu"
      ? "perdu"
      : "refus";

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      couverture: e.couverture,
      passifs: e.passifs,
      nonCouverts: e.nonCouverts,
      deficitEsat: e.deficitEsat,
      tresorerie: tresorerieA(h, w),
    });
    avant = e.valeur;
    fin = e;
  }
  const issue = issueDe(chemin, graine);
  const enJeu = issue === "reprise" || issue === "retrait";
  const q1 = qualitePremiere(chemin, h.scenario, bonusImprevus(h, ANNONCES.ars));
  const q2 = qualiteSeconde(chemin, h.scenario, bonusImprevus(h, ANNONCES.reponse2));
  const r = auditRevele(chemin[D.audit]!);
  const reprise = issue === "reprise";
  const [pDir, pChef] = EQUIPES.departs[chemin[D.equipes]!]!;
  return {
    semaines,
    objectif: fin!.valeur,
    issue,
    scenario: h.scenario,
    reponse: enJeu ? niveauReponse(chemin, q1, h.u1) : 0,
    seconde: enJeu && (chemin[D.cap] === 1 || chemin[D.cap] === 3) ? h.u2 < q2 : null,
    prudhommes: h.prudhommes,
    travaux: h.travaux,
    revele: enJeu
      ? { prudhommes: r.prudhommes && h.prudhommes, travaux: r.travaux && h.travaux > 0 }
      : { prudhommes: false, travaux: false },
    rancune: reprise ? null : h.uRancune < RANCUNE[modeRefus(chemin, issue)].chance,
    montantRancune: h.montantRancune,
    coutRefus: reprise ? 0 : rancuneDe(h, modeRefus(chemin, issue), true),
    departDirectrice: reprise && h.uDirectrice < pDir,
    departChef: reprise && h.uChef < pChef,
    appel: reprise && chemin[D.esat] === 3 ? h.appel : null,
    couverture: fin!.couverture,
    passifs: fin!.passifs,
    nonCouverts: fin!.nonCouverts,
    deficitEsat: fin!.deficitEsat,
  };
}

export interface LectureReprise {
  valeur: number | null;
  passifs: number | null;
  couverture: number | null;
  deficitEsat: number | null;
  tresorerie: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  besoin: number | null;
  nonCouverts: number | null;
  reponse: number | null;
  scenario: number | null;
  prudhommes: number | null;
  travaux: number | null;
  perdu: number | null;
  enJeu: number | null;
}

/** Ce qu'Ursule lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureReprise {
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      valeur: 0,
      passifs: null,
      couverture: 0,
      deficitEsat: DEFICIT_ESAT,
      tresorerie: PRIMEVERES.tresorerie,
      besoin: null,
      nonCouverts: null,
      reponse: -1,
      scenario: -1,
      prudhommes: -1,
      travaux: -1,
      perdu: 0,
      enJeu: 1,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const e = estimer(chemin, graine, semaine, jours);
  const c = enVigueur(chemin, semaine);
  const revele = auditRevele(c[D.audit]!);
  const enJeu = e.issue === "reprise" || e.issue === null;
  const q1 = qualitePremiere(c, h.scenario, bonusImprevus(h, ANNONCES.ars));
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    valeur: e.valeur,
    passifs: e.passifs,
    couverture: e.couverture,
    deficitEsat: e.deficitEsat,
    tresorerie: s.tresorerie,
    besoin: TRANSITION + ECONOMIES_REPRISES + e.passifs,
    nonCouverts: e.nonCouverts,
    reponse: enJeu && semaine >= ANNONCES.ars ? niveauReponse(c, q1, h.u1) : -1,
    scenario: semaine >= ANNONCES.ars ? h.scenario : -1,
    prudhommes:
      revele.prudhommes && semaine >= ANNONCES.auditSocial
        ? h.prudhommes
          ? PRUDHOMMES.montant
          : 0
        : -1,
    travaux: revele.travaux && semaine >= ANNONCES.auditBatiments ? h.travaux : -1,
    perdu: e.issue === "perdu" ? 1 : 0,
    enJeu: enJeu ? 1 : 0,
  };
}
