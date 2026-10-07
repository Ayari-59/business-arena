/**
 * LE LIVRABLE QUE LE CLIENT REFUSE — le modèle d'une mission d'audit énergétique.
 *
 * Atlas Conseil, practice Énergie et bâtiment : le diagnostic énergétique de
 * vingt-deux bâtiments d'Ardven Agglomération, au forfait, dans un marché
 * public à tranche ferme et tranche optionnelle. Le rapport intermédiaire
 * (phase 1 : consommations de référence) vient d'être refusé en comité de
 * pilotage. Restent la phase 2 (une fiche de scénarios de travaux par
 * bâtiment) et la phase 3 (plan pluriannuel et rapport final), à remettre fin
 * mars. Treize semaines, six décisions. Quatre mécanismes font l'épisode :
 *
 *   · LE REFUS A UNE CAUSE DE FOND. Le comité a beaucoup parlé de la forme,
 *     mais ce qu'il refuse, c'est une hypothèse de méthode jamais validée avec
 *     la collectivité : l'année de référence des consommations. Tant qu'elle
 *     n'est pas validée, toute nouvelle version est refusée.
 *   · REFAIRE SANS VALIDER REFAIT LA MÊME ERREUR. Reprendre tout le rapport,
 *     même parfaitement, avec la même hypothèse, coûte la reprise deux fois.
 *     La reprise utile commence par un atelier de méthode et quelques
 *     bâtiments témoins, puis généralise.
 *   · UNE ERREUR COÛTE D'AUTANT PLUS QU'ON LA TROUVE TARD. Les hypothèses de
 *     la phase 2 (coûts des travaux, objectif visé) sont peut-être, elles
 *     aussi, différentes de celles du client : trouvées sur trois fiches
 *     types, elles coûtent 2,4 jours ; trouvées en comité, sur toutes les
 *     fiches, dix-sept. Les erreurs de production suivent la même règle : une
 *     relecture par un pair coûte 0,3 jour par fiche et en arrête quatre sur
 *     cinq ; celles que le client trouve coûtent cinq fois plus à corriger, et
 *     de la confiance. Une erreur répétée sur plusieurs fiches vient d'un
 *     outil, pas d'une fiche : la corriger fiche par fiche la laisse courir.
 *   · LA SUITE DÉPEND DE LA CONFIANCE. La tranche optionnelle (l'assistance à
 *     maîtrise d'ouvrage du programme de travaux) ne sera affermie que si la
 *     collectivité fait confiance au cabinet, et si son budget le permet.
 *
 * Le temps des consultants ne se stocke pas : une équipe staffée qui attend
 * pointe ses jours sur la mission. Le trimestre est jugé en euros : la marge
 * de la mission (le forfait, moins les jours consommés à leur coût, les jours
 * de repos rachetés majorés, les pénalités de retard) PLUS la valeur espérée
 * de la tranche optionnelle, sa marge prévisionnelle multipliée par la chance
 * qu'elle soit affermie, estimée en semaine 13 avec ce que le trimestre a
 * révélé (la confiance de la collectivité, l'arbitrage de son budget).
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Collectivité, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const BATIMENTS = 22;
/** La tranche ferme, au forfait, et ce qu'elle représente en jours vendus. */
export const FORFAIT = 132000;
export const TJM_MOYEN = 880;
export const JOURS_VENDUS = FORFAIT / TJM_MOYEN;
/** Les jours pointés sur la phase 1 jusqu'au refus, pour 55 prévus. */
export const JOURS_AVANT = 62;
export const BUDGET_PHASE1 = 55;
/** Le reste à faire planifié avant le refus : la phase 2, la phase 3 et le pilotage. */
export const RESTE_PLANIFIE = 75;
/** Le coût d'un jour de l'équipe : les salaires chargés rapportés aux jours produits. */
export const COUT_JOUR = 540;
/** Un jour de repos racheté à un cadre au forfait jours est majoré de 10 % au moins. */
export const MAJORATION = 0.1;
/** La pénalité du CCAP par jour calendaire de retard dans la remise du rapport final. */
export const PENALITE_JOUR = 250;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, l'équipe staffée attend vos consignes. */
export const PERTE_PAR_JOUR = 1000;

/** La phase 1 : ce que Tempora a pointé par bâtiment, et ce qu'une reprise refait. */
export const PHASE1 = {
  parBatiment: 2,
  /** La visite et la collecte des factures : faites, elles ne sont pas à refaire. */
  visite: 0.5,
  synthese: 4,
  atelier: 2,
  /** Les bâtiments témoins recalculés et validés avant de généraliser. */
  temoins: 3,
  retouches: 5,
} as const;
export const RECALCUL_PAR_BATIMENT = PHASE1.parBatiment - PHASE1.visite;
/** Les jours de reprise si les vingt-deux bâtiments doivent être recalculés : la prévision de la semaine 1. */
export const JOURS_DE_REPRISE = BATIMENTS * RECALCUL_PAR_BATIMENT + PHASE1.synthese;
/** La version « parfaite » : chaque bâtiment recontrôlé selon la même méthode, et toute la forme reprise. */
export const VERSION_PARFAITE = { controle: 1, forme: 8 } as const;
export const JOURS_VERSION_PARFAITE =
  BATIMENTS * VERSION_PARFAITE.controle + VERSION_PARFAITE.forme;
export const JOURS_FORME = 8;

/** La phase 2 : une fiche de scénarios de travaux par bâtiment. */
export const PHASE2 = {
  parFiche: 2,
  /** La relecture croisée d'une fiche par un pair. */
  relecture: 0.3,
  reunion: 1.5,
  /** Reprendre une fiche faite avec de mauvaises hypothèses. */
  reprise: 0.8,
  courriel: 0.5,
  /** Les fiches types de l'échantillon : une école, un gymnase, la piscine. */
  types: 3,
} as const;
export const JOURS_PHASE2 = BATIMENTS * PHASE2.parFiche;
/** La phase 3 : le plan pluriannuel d'investissement et le rapport final. */
export const PHASE3 = 18;
export const PILOTAGE = 1;
/** Les jours par semaine de l'équipe staffée, hors pilotage : Ewen et Basile, Shirin et Eliaz. */
export const CAPACITE = { a: 4, b: 5.5 } as const;
export const CAPACITE_SEMAINE = CAPACITE.a + CAPACITE.b + PILOTAGE;
/** Basile part sur une avant-vente : deux jours de moins par semaine, des semaines 10 à 13. */
export const AVANT_VENTE = { jours: 2, de: 10 } as const;
export const RENFORT_PHASE2 = { jours: 8, apprentissage: 8, de: 4, a: 7 } as const;
export const RENFORT_PHASE3 = { jours: 3, apprentissage: 3 } as const;
export const SAMEDIS = { phase1: 3, fin: 2 } as const;
/** Ce que l'équipe abat, les semaines qui suivent des samedis travaillés. */
export const FATIGUE = 0.9;

/** Les erreurs de production, par fiche et pour la phase 3, avant relecture. */
export const ERREURS_PAR_FICHE = 0.8;
export const ERREURS_PHASE3 = 4;
/** Les bâtiments raccordés au réseau de chaleur, que l'erreur du modèle de calcul touche. */
export const RESEAU_DE_CHALEUR = 9;
/** Au-delà de ce nombre d'erreurs relevées, le comité refuse le rapport de phase 2. */
export const SEUIL_REFUS = 7;
/** La part des erreurs que chaque relecture arrête. */
export const RELECTURE = {
  croisee: 0.8,
  finale: 0.35,
  associee: 0.25,
  reverification: 0.5,
  precopil: 0.5,
  nuit: 0.4,
} as const;
/** Revérifier une fiche déjà faite, de bout en bout : plus long qu'une relecture au fil de l'eau. */
export const REVERIFICATION = 0.45;
/** Corriger une erreur : trouvée en relecture au fil de l'eau, en relecture tardive, par le client. */
export const CORRECTION = { tot: 0.1, tard: 0.25, client: 0.5 } as const;

export const CONFIANCE_DEPART = 0.42;
/** Ce que chaque fait déplace dans la confiance de la collectivité. */
export const CONFIANCE = {
  atelier: 0.06,
  temoins: 0.03,
  silence: -0.04,
  nouveauRefus: -0.12,
  sousReserve: -0.02,
  acceptee: 0.08,
  retouches: -0.05,
  apresRetouches: 0.04,
  reunionTechnique: 0.03,
  methodeTardive: -0.1,
  memeErreur: -0.04,
  refusPhase2: -0.06,
  analyse: 0.02,
  reverification: 0.01,
  promesse: -0.03,
  remiseAcceptee: 0.06,
  remiseRefusee: -0.02,
  precopil: 0.06,
  nuit: -0.02,
  priorisationTardive: -0.1,
  parSemaineDeRetard: -0.06,
} as const;

/**
 * Ce que les erreurs relevées par le client retirent de sa confiance : un
 * point et demi pour la première, de moins en moins ensuite. Au-delà d'une
 * vingtaine, il ne les compte plus : il a son avis.
 */
export const entameParErreurs = (n: number) => 0.2 * (1 - Math.exp(-n / 12));

/** La tranche optionnelle : l'AMO du programme de travaux des bâtiments prioritaires. */
export const TRANCHE = { honoraires: 96000, taux: 0.38, remise: 0.1, coupDePouce: 0.15 } as const;
export const MARGE_TRANCHE = TRANCHE.honoraires * TRANCHE.taux;
export const REMISE_TRANCHE = TRANCHE.honoraires * TRANCHE.remise;

/** L'arbitrage du budget primitif, voté fin mars : ce qu'il laisse à la tranche optionnelle. */
export const SCENARIOS = [
  { nom: "Crédits inscrits", chance: 0.35, facteur: 1 },
  { nom: "Crédits arbitrés", chance: 0.45, facteur: 0.7 },
  { nom: "Crédits gelés", chance: 0.2, facteur: 0.3 },
] as const;
export const FACTEUR_ATTENDU = SCENARIOS.reduce((s, x) => s + x.chance * x.facteur, 0);
/** La semaine où la directrice apprend l'arbitrage du budget. */
export const REVELATION = 12;

/** Les hypothèses de la phase 2 et de la phase 3 sont-elles différentes de celles du client ? */
export const RISQUE_METHODE2 = 0.55;
export const RISQUE_METHODE3 = 0.5;
/** Une version « parfaite » avec la même méthode : refusée, sauf si le comité l'accepte sous réserve. */
export const REFUS_VERSION_PARFAITE = 0.85;
/** Une nouvelle version passe presque toujours quand la méthode a été validée. */
export const ACCEPTATION = { validee: 0.92, devinee: 0.7 } as const;
/** L'économe de flux lit et répond à la note d'hypothèses envoyée par courriel. */
export const LECTURE_COURRIEL = { engage: 0.75, sinon: 0.3 } as const;

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La chance que la collectivité affermisse la tranche optionnelle, avant l'arbitrage du budget. */
export const chanceTranche = (confiance: number) =>
  borne(0.1 + 1.4 * (confiance - 0.35), 0.03, 0.9);
/** La chance que la directrice accepte une remise en deux temps, lue sur la confiance de la semaine 9. */
export const chanceRemise = (confiance: number) => borne(0.3 + 1.6 * (confiance - 0.35), 0.05, 0.9);

/** Les décisions, par leur place dans le chemin. */
export const D = {
  refus: 0,
  phase2: 1,
  relecture: 2,
  erreurs: 3,
  planning: 4,
  copil: 5,
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
  /** En jours par semaine de capacité perdue, en jours de travail en plus, en confiance. */
  effet: { capacite?: number; travail?: number; confiance?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "La grippe dans l'équipe",
    de: "Eliaz Lachèvre",
    role: "Analyste",
    texte:
      "Shirin et moi sommes cloués au lit. On reprend dès que possible, mais comptez deux semaines au ralenti.",
    duree: 2,
    effet: { capacite: 2 },
  },
  {
    id: "factures",
    titre: "Des relevés de consommation manquants",
    de: "Shirin Abidi",
    role: "Consultante énergéticienne",
    texte:
      "Le fournisseur d'énergie n'a toujours pas transmis les relevés de quatre bâtiments. Il faut relancer et estimer en attendant : deux jours et demi de travail en plus.",
    duree: 1,
    effet: { travail: 2.5 },
  },
  {
    id: "interim",
    titre: "La directrice du patrimoine absente deux semaines",
    de: "Ardven Agglomération",
    role: "Direction du patrimoine bâti",
    texte:
      "Marjolaine Cadoret est absente deux semaines ; son adjoint assure l'intérim et découvre le dossier. Il demande une réunion pour être mis au courant.",
    duree: 1,
    effet: { travail: 1, confiance: -0.03 },
  },
  {
    id: "serveur",
    titre: "Panne du serveur de fichiers du cabinet",
    de: "Service informatique",
    role: "Atlas Conseil, Nantes",
    texte:
      "Le serveur de fichiers de Nantes a été inaccessible deux jours : les modèles de calcul et les fiches étaient dessus.",
    duree: 1,
    effet: { capacite: 2.5 },
  },
  {
    id: "commission",
    titre: "Une présentation en commission travaux",
    de: "Tugdual Ropars",
    role: "Vice-président chargé du patrimoine",
    texte:
      "La commission travaux veut entendre le cabinet sur l'avancement. Vingt minutes, et les questions des maires.",
    duree: 1,
    effet: { travail: 1.5, confiance: 0.02 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  imprevus: readonly ImprevuTire[];
  /** Le niveau d'erreurs de l'équipe ce trimestre, rapporté à la normale. */
  bruitErreurs: number;
  /** L'humeur de la collectivité, qui déplace un peu sa confiance de départ. */
  humeur: number;
  /** L'arbitrage du budget primitif. */
  scenario: number;
  uParfaite: number;
  uV2: number;
  uMethode2: number;
  uCourriel: number;
  uMethode3: number;
  uRemise: number;
  uArret: number;
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000691 + 7);
  const bruitErreurs = borne(1 + 0.25 * gauss(r), 0.5, 1.6);
  const humeur = borne(0.03 * gauss(r), -0.06, 0.06);
  const uScenario = r();
  let scenario = 0;
  let cumul = SCENARIOS[0]!.chance;
  while (scenario < SCENARIOS.length - 1 && uScenario >= cumul) {
    scenario += 1;
    cumul += SCENARIOS[scenario]!.chance;
  }
  const uParfaite = r();
  const uV2 = r();
  const uMethode2 = r();
  const uCourriel = r();
  const uMethode3 = r();
  const uRemise = r();
  const uArret = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    imprevus,
    bruitErreurs,
    humeur,
    scenario,
    uParfaite,
    uV2,
    uMethode2,
    uCourriel,
    uMethode3,
    uRemise,
    uArret,
  };
  tirages.set(graine, h);
  return h;
}

/** Les hypothèses de la phase 2 diffèrent-elles de celles du client ? Le trimestre le dit. */
export const methode2Fausse = (graine: number) => hasard(graine).uMethode2 < RISQUE_METHODE2;
export const methode3Fausse = (graine: number) => hasard(graine).uMethode3 < RISQUE_METHODE3;
/** La version « parfaite » refaite avec la même méthode : refusée, ou acceptée sous réserve. */
export const versionParfaiteRefusee = (graine: number) =>
  hasard(graine).uParfaite < REFUS_VERSION_PARFAITE;
/** L'économe de flux répond à la note d'hypothèses, plus souvent s'il a été associé à la méthode. */
export const chanceQueLeCourrielSoitLu = (chemin: readonly number[]) =>
  chemin[D.refus] === 1 ? LECTURE_COURRIEL.engage : LECTURE_COURRIEL.sinon;
export const courrielLu = (chemin: readonly number[], graine: number) =>
  chemin[D.phase2] === 2 && hasard(graine).uCourriel < chanceQueLeCourrielSoitLu(chemin);
/**
 * SHIRIN S'ARRÊTE-T-ELLE ? Les samedis se paient : après ceux de janvier, une
 * fois sur quatre elle s'arrête deux semaines en février ; après ceux de mars,
 * quatre fois sur dix, deux semaines avant la remise.
 */
export const arretTot = (chemin: readonly number[], graine: number) =>
  chemin[D.refus] === 0 && hasard(graine).uArret < 0.25;
export const arretTard = (chemin: readonly number[], graine: number) =>
  chemin[D.planning] === 0 && !arretTot(chemin, graine) && hasard(graine).uArret >= 0.6;
export const ARRET = { jours: 3, tot: 5, tard: 12 } as const;

export type Semaine = {
  /** Jours pointés sur la mission depuis son début. */
  jours: number;
  /** Jours pointés dans la semaine. */
  pointes: number;
  confiance: number;
  /** Le reste à faire jusqu'à la remise du rapport final, pilotage compris, en jours. */
  reste: number;
  /** Ce que l'équipe peut encore fournir d'ici le 31 mars, en jours. */
  capacite: number;
  /** Les jours qui manquent pour tenir la date. */
  manque: number;
  /** Les remarques d'erreur relevées par le client depuis janvier. */
  remarques: number;
  /** Les fiches de la phase 2 produites. */
  fiches: number;
  /** La marge de la mission estimée à terminaison. */
  marge: number;
  /** La chance d'affermissement de la tranche optionnelle, avant l'arbitrage du budget. */
  chance: number;
  /** La marge estimée plus la valeur espérée de la tranche optionnelle. */
  valeur: number;
  /** La phase 1 : 0 en cours, 1 validée. */
  phase1: number;
};

export type Evenement =
  | "temoins"
  | "refusV2"
  | "sousReserve"
  | "accepteeV2"
  | "retouchesV2"
  | "remarquesEcrites"
  | "courrielLu"
  | "courrielSansReponse"
  | "echantillonEcart"
  | "echantillonValide"
  | "copil2Refus"
  | "copil2Remarques"
  | "copil2Valide"
  | "arretShirin"
  | "remiseAcceptee"
  | "remiseRefusee"
  | "budget"
  | "precopilEcart";

export interface Trimestre {
  chemin: readonly number[];
  semaines: readonly (Semaine | null)[];
  /** La marge de la mission plus la valeur espérée de la tranche optionnelle. */
  objectif: number;
  marge: number;
  valeurTranche: number;
  chanceTranche: number;
  confiance: number;
  /** Tous les jours de la mission, ceux d'avant janvier compris. */
  jours: number;
  joursTrimestre: number;
  majores: number;
  penalites: number;
  retard: number;
  remarques: number;
  scenario: number;
  phase1ValideeSemaine: number | null;
  nouveauRefus: boolean;
  sousReserve: boolean;
  methode2: boolean;
  methode2Tardive: boolean;
  methode3: boolean;
  methode3Tardive: boolean;
  refusPhase2: boolean;
  arret: boolean;
  remise: boolean | null;
  pertes: number;
  journal: readonly { semaine: number; quoi: Evenement }[];
}

type Genre = "jours" | "fiches" | "phase3";
interface Tache {
  id: string;
  genre: Genre;
  /** En jours, en fiches ou en jours de phase 3 selon le genre. */
  reste: number;
  /** La semaine où elle peut commencer : avant, elle attend un retour du client. */
  des: number;
  jalon?: string;
  /** Les fiches types de l'échantillon : aucun de ces bâtiments n'est raccordé au réseau de chaleur. */
  types?: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as [number, number, number, number, number, number];
  const pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const m2 = methode2Fausse(graine);
  const m3 = methode3Fausse(graine);
  const tot = arretTot(chemin, graine);
  const tard = arretTard(chemin, graine);
  const journal: { semaine: number; quoi: Evenement }[] = [];
  const noter = (semaine: number, quoi: Evenement) => journal.push({ semaine, quoi });

  const fileA: Tache[] = [];
  const fileB: Tache[] = [];
  const verdicts: { semaine: number; jalon: string }[] = [];
  let confiance = CONFIANCE_DEPART + h.humeur;
  let pointes = 0;
  let majores = 0;
  let remarques = 0;
  let fiches = 0;
  /** Les fiches faites avec des hypothèses de phase 2 que le client ne partage pas. */
  let fichesFausses = 0;
  let m2Traitee = !m2;
  let m3Traitee = !m3;
  let m2Tardive = false;
  let m3Tardive = false;
  let echantillonValide = false;
  let modeleCorrige = false;
  let refusPhase2 = false;
  let nouveauRefus = false;
  let sousReserve = false;
  let phase1Validee: number | null = null;
  let remise: boolean | null = null;
  /** Les erreurs laissées dans les fiches, avant et après le comité de phase 2, et en phase 3. */
  let err2Avant = 0;
  let err2Apres = 0;
  let sysAvant = 0;
  let sysApres = 0;
  let err3 = 0;
  let termine = false;
  const semaines: (Semaine | null)[] = [null];

  const tauxReseau = RESEAU_DE_CHALEUR / (BATIMENTS - (d2 === 1 ? PHASE2.types : 0));
  const multErreurs = (w: number) =>
    h.bruitErreurs *
    (d1 === 0 && w <= 8 ? 1.3 : 1) *
    (d2 === 0 && w >= RENFORT_PHASE2.de && w <= RENFORT_PHASE2.a ? 1.4 : 1) *
    (echantillonValide ? 0.8 : 1);
  const erreursParFiche = (w: number) => ERREURS_PAR_FICHE * multErreurs(w);
  const croisee = (w: number) => d3 === 1 && w >= 6;
  const coutFiche = (w: number) =>
    PHASE2.parFiche +
    (croisee(w) ? PHASE2.relecture + CORRECTION.tot * RELECTURE.croisee * erreursParFiche(w) : 0);
  const coutPhase3 = () => (d3 === 1 ? 1 + 2 / PHASE3 : 1);
  const multPhase3 = (w: number) =>
    h.bruitErreurs * (d5 === 0 && w >= 10 ? 1.5 : d5 === 2 && w >= 10 ? 1.1 : 1);

  const produire = (n: number, w: number, types: boolean) => {
    const e = n * erreursParFiche(w);
    const laissees = croisee(w) ? e * (1 - RELECTURE.croisee) : e;
    if (w <= 9) err2Avant += laissees;
    else err2Apres += laissees;
    if (!modeleCorrige && !types) {
      if (w <= 9) sysAvant += n * tauxReseau;
      else sysApres += n * tauxReseau;
    }
    fiches += n;
    if (!m2Traitee) fichesFausses += n;
  };

  const travailler = (file: Tache[], dispo: number, w: number) => {
    while (dispo > 1e-9 && file.length) {
      const t = file[0]!;
      if (t.des > w) break;
      if (t.genre === "jours") {
        const d = Math.min(dispo, t.reste);
        t.reste -= d;
        dispo -= d;
      } else if (t.genre === "fiches") {
        const c = coutFiche(w);
        const n = Math.min(t.reste, dispo / c);
        produire(n, w, !!t.types);
        t.reste -= n;
        dispo -= n * c;
      } else {
        const c = coutPhase3();
        const u = Math.min(t.reste, dispo / c);
        const e = (u / PHASE3) * ERREURS_PHASE3 * multPhase3(w);
        err3 += d3 === 1 ? e * (1 - RELECTURE.croisee) : e;
        t.reste -= u;
        dispo -= u * c;
      }
      if (t.reste <= 1e-9) {
        file.shift();
        if (t.jalon) verdicts.push({ semaine: w + 1, jalon: t.jalon });
      }
    }
    return dispo;
  };

  const tache = (id: string, n: number, extra: Partial<Tache> = {}): Tache => ({
    id,
    genre: "jours",
    reste: n,
    des: 0,
    ...extra,
  });
  const reprisePhase1 = (w: number) => {
    fileA.push(tache("atelier", PHASE1.atelier));
    fileA.push(tache("reprise", JOURS_DE_REPRISE, { jalon: "v2", des: w }));
  };
  const accepter = (w: number, validee: boolean) => {
    if (h.uV2 < (validee ? ACCEPTATION.validee : ACCEPTATION.devinee)) {
      confiance += CONFIANCE.acceptee;
      phase1Validee = w;
      noter(w, "accepteeV2");
    } else {
      confiance += CONFIANCE.retouches;
      fileA.unshift(tache("retouches", PHASE1.retouches, { jalon: "retouches" }));
      noter(w, "retouchesV2");
    }
  };
  /** La méthode de la phase 1 a-t-elle été validée avec le client avant la nouvelle version ? */
  let methodeValidee = d1 === 1;

  for (let w = 1; w <= SEMAINES; w += 1) {
    // Ce qui arrive en début de semaine : les décisions qui prennent effet, les retours du client.
    if (w === 1) {
      if (d1 === 0) {
        fileA.push(tache("parfaite", JOURS_VERSION_PARFAITE, { jalon: "v2" }));
      } else if (d1 === 1) {
        fileA.push(tache("atelier", PHASE1.atelier));
        fileA.push(tache("temoins", PHASE1.temoins * RECALCUL_PAR_BATIMENT, { jalon: "temoins" }));
        fileA.push(
          tache(
            "recalcul",
            (BATIMENTS - PHASE1.temoins) * RECALCUL_PAR_BATIMENT + PHASE1.synthese,
            { jalon: "v2", des: 2 },
          ),
        );
      } else if (d1 === 2) {
        fileA.push(tache("forme", JOURS_FORME, { jalon: "v2" }));
      }
    }
    if (w === 2 && d1 === 1) confiance += CONFIANCE.atelier;
    if (w === 2 && d1 === 3) confiance += CONFIANCE.silence;
    if (w === 3 && d1 === 3) {
      noter(w, "remarquesEcrites");
      fileA.push(tache("reprise", JOURS_DE_REPRISE, { jalon: "v2" }));
    }

    for (const v of verdicts.filter((x) => x.semaine === w)) {
      if (v.jalon === "temoins") {
        confiance += CONFIANCE.temoins;
        noter(w, "temoins");
      } else if (v.jalon === "v2") {
        if (d1 === 0 && !methodeValidee) {
          if (versionParfaiteRefusee(graine)) {
            confiance += CONFIANCE.nouveauRefus;
            nouveauRefus = true;
            methodeValidee = true;
            reprisePhase1(w);
            noter(w, "refusV2");
          } else {
            confiance += CONFIANCE.sousReserve;
            sousReserve = true;
            phase1Validee = w;
            noter(w, "sousReserve");
          }
        } else if (d1 === 2 && !methodeValidee) {
          confiance += CONFIANCE.nouveauRefus;
          nouveauRefus = true;
          methodeValidee = true;
          reprisePhase1(w);
          noter(w, "refusV2");
        } else {
          accepter(w, methodeValidee);
        }
      } else if (v.jalon === "retouches") {
        confiance += CONFIANCE.apresRetouches;
        phase1Validee = w;
        noter(w, "accepteeV2");
      } else if (v.jalon === "courriel") {
        if (courrielLu(chemin, graine)) {
          noter(w, "courrielLu");
          if (!m2Traitee) {
            fileB.unshift(tache("reprise2", fichesFausses * PHASE2.reprise));
            m2Traitee = true;
          }
        } else noter(w, "courrielSansReponse");
      } else if (v.jalon === "echantillon") {
        confiance += CONFIANCE.reunionTechnique;
        echantillonValide = true;
        if (!m2Traitee) {
          fileB.unshift(tache("reprise2", fichesFausses * PHASE2.reprise));
          m2Traitee = true;
          noter(w, "echantillonEcart");
        } else noter(w, "echantillonValide");
        const suite = fileB.find((t) => t.id === "fiches");
        if (suite) suite.des = w;
      }
    }

    if (w === 4) {
      // La phase 2 démarre, organisée selon la décision de la semaine 3.
      if (d2 === 0) fileB.push(tache("apprentissage", RENFORT_PHASE2.apprentissage));
      if (d2 === 2) fileB.push(tache("courriel", PHASE2.courriel, { jalon: "courriel" }));
      if (d2 === 1) {
        fileB.push({ id: "types", genre: "fiches", reste: PHASE2.types, des: 0, types: true });
        fileB.push(tache("reunion", PHASE2.reunion, { jalon: "echantillon" }));
        fileB.push({ id: "fiches", genre: "fiches", reste: BATIMENTS - PHASE2.types, des: 99 });
      } else {
        fileB.push({ id: "fiches", genre: "fiches", reste: BATIMENTS, des: 0 });
      }
      fileB.push({ id: "phase3", genre: "phase3", reste: PHASE3, des: 0 });
    }

    if (w === 8) {
      // La réponse aux deux erreurs que la directrice a relevées en semaine 7.
      const faites = fiches;
      if (d4 === 1) {
        fileB.unshift(tache("analyse", 1 + 0.3 * (sysAvant + sysApres)));
        sysAvant = 0;
        sysApres = 0;
        modeleCorrige = true;
        confiance += CONFIANCE.analyse;
      } else if (d4 === 2) {
        const trouvees = err2Avant * RELECTURE.reverification;
        err2Avant -= trouvees;
        fileB.unshift(
          tache(
            "reverification",
            faites * REVERIFICATION + CORRECTION.tot * trouvees + 0.3 * (sysAvant + sysApres),
          ),
        );
        sysAvant = 0;
        sysApres = 0;
        modeleCorrige = true;
        confiance += CONFIANCE.reverification;
      } else if (d4 === 0) {
        fileB.unshift(tache("deux", 0.4));
        sysAvant = Math.max(0, sysAvant - 2);
      } else {
        confiance += CONFIANCE.promesse;
      }
    }

    if (w === 9) {
      if (d3 === 0) fileA.unshift(tache("relectureFinale", 2.5));
      if (d3 === 2) fileA.unshift(tache("associee", 1));
    }

    if (w === 10) {
      // Le comité de pilotage de la phase 2.
      if (d3 === 0 || d3 === 2) {
        const part = d3 === 0 ? RELECTURE.finale : RELECTURE.associee;
        const trouvees = err2Avant * part;
        err2Avant -= trouvees;
        fileB.unshift(tache("corrections", CORRECTION.tard * trouvees));
      }
      if (sousReserve) {
        // La méthode de la phase 1 n'avait jamais été validée : tout revient.
        confiance += CONFIANCE.nouveauRefus;
        refusPhase2 = true;
        fileA.unshift(tache("majFiches", 0.3 * fiches));
        fileA.unshift(tache("reprise", JOURS_DE_REPRISE));
        fileA.unshift(tache("atelier", PHASE1.atelier));
        noter(w, "copil2Refus");
      }
      if (!m2Traitee) {
        confiance += CONFIANCE.methodeTardive;
        refusPhase2 = true;
        m2Tardive = true;
        m2Traitee = true;
        fileB.unshift(tache("reprise2", fichesFausses * PHASE2.reprise));
        if (!sousReserve) noter(w, "copil2Refus");
      }
      const n = err2Avant + sysAvant;
      remarques += n;
      confiance -= entameParErreurs(remarques) - entameParErreurs(remarques - n);
      if (sysAvant > 0.5 && !modeleCorrige) confiance += CONFIANCE.memeErreur;
      fileB.unshift(tache("corrigerClient", CORRECTION.client * n));
      if (!refusPhase2 && n >= SEUIL_REFUS) {
        refusPhase2 = true;
        confiance += CONFIANCE.refusPhase2;
        fileB.unshift(tache("refonte", 4));
        noter(w, "copil2Remarques");
      } else if (!refusPhase2) noter(w, "copil2Valide");
      err2Avant = 0;
      sysAvant = 0;

      // Le planning de fin de trimestre, décidé en semaine 9.
      if (d5 === 1) {
        remise = h.uRemise < chanceRemise(semaines[9]!.confiance);
        if (remise) {
          confiance += CONFIANCE.remiseAcceptee;
          fileA.unshift(tache("priorisation", 1.5 + (m3Traitee ? 0 : 1)));
          m3Traitee = true;
          noter(w, "remiseAcceptee");
        } else {
          confiance += CONFIANCE.remiseRefusee;
          noter(w, "remiseRefusee");
        }
      }
      if (d5 === 2) fileB.unshift(tache("apprentissage3", RENFORT_PHASE3.apprentissage));
    }

    if (w === REVELATION) noter(w, "budget");
    if (w === 12 && d6 === 0) fileA.unshift(tache("precopil", 2));
    if (w === 13) {
      if (d6 === 0) {
        confiance += CONFIANCE.precopil;
        const trouvees = err3 * RELECTURE.precopil;
        err3 -= trouvees;
        let extra = 0.2 * trouvees;
        if (!m3Traitee) {
          extra += 3;
          m3Traitee = true;
          noter(w, "precopilEcart");
        }
        fileA.unshift(tache("suitesPrecopil", extra));
      }
      if (d6 === 1) {
        confiance += CONFIANCE.nuit;
        majores += 3;
        fileA.unshift(tache("nuit", 3));
      }
      if (d3 === 0) fileA.unshift(tache("relectureFinale3", 1.5));
    }

    for (const { imprevu, semaine } of h.imprevus) {
      if (semaine !== w) continue;
      if (imprevu.effet.travail) fileB.unshift(tache(imprevu.id, imprevu.effet.travail));
      confiance += imprevu.effet.confiance ?? 0;
    }

    // Les capacités de la semaine.
    const samedis =
      (d1 === 0 && w <= 2 ? 2 * SAMEDIS.phase1 : 0) +
      (d5 === 0 && w >= 10 && w <= 12 ? 2 * SAMEDIS.fin : 0);
    let capA = CAPACITE.a + samedis / 2 - (w >= AVANT_VENTE.de ? AVANT_VENTE.jours : 0);
    let capB = CAPACITE.b + samedis / 2;
    if (d2 === 0 && w >= RENFORT_PHASE2.de && w <= RENFORT_PHASE2.a) capB += RENFORT_PHASE2.jours;
    if (d5 === 2 && w >= 10) capB += RENFORT_PHASE3.jours;
    if (
      (tot && (w === ARRET.tot || w === ARRET.tot + 1)) ||
      (tard && (w === ARRET.tard || w === ARRET.tard + 1))
    ) {
      capB -= ARRET.jours;
      if (w === (tot ? ARRET.tot : ARRET.tard)) noter(w, "arretShirin");
    }
    for (const { imprevu, semaine } of h.imprevus) {
      if (w >= semaine && w < semaine + imprevu.duree) capB -= imprevu.effet.capacite ?? 0;
    }
    capA = Math.max(0, capA);
    capB = Math.max(0, capB);

    // Le travail : chacun sur sa file, puis le temps qui reste sur l'autre.
    // Les semaines qui suivent des samedis travaillés, on avance moins vite.
    const fatigue = (d1 === 0 && w >= 3 && w <= 6) || (d5 === 0 && w >= 11) ? FATIGUE : 1;
    const resteA = travailler(fileA, capA * fatigue, w);
    const resteB = travailler(fileB, capB * fatigue, w);
    travailler(fileB, resteA, w);
    travailler(fileA, resteB, w);
    const charge = termine ? 0 : capA + capB + PILOTAGE;
    pointes += charge;
    if (!termine) majores += samedis;
    termine = w >= 4 && fileA.length === 0 && fileB.length === 0;

    // Ce que le tableau de bord projette à la fin de la semaine.
    const prevu = w < 4 ? JOURS_PHASE2 + PHASE3 + (d1 === 3 && w < 3 ? JOURS_DE_REPRISE : 0) : 0;
    const reste =
      resteDesFiles(fileA, fileB, coutFiche(w), coutPhase3()) + prevu + (SEMAINES - w) * PILOTAGE;
    const capacite = capaciteRestante(w);
    const manque = Math.max(0, reste - capacite);
    const marge = margeEstimee(JOURS_AVANT + pointes + reste, majores, manque, !!remise, pertes);
    const c = borne(confiance, 0, 1);
    const facteur = w >= REVELATION ? SCENARIOS[h.scenario]!.facteur : FACTEUR_ATTENDU;
    semaines.push({
      jours: JOURS_AVANT + pointes,
      pointes: charge,
      confiance: c,
      reste,
      capacite,
      manque,
      remarques,
      fiches,
      marge,
      chance: chanceDeLaTranche(c, d6, w),
      valeur: marge + valeurDeLaTranche(c, d6, w, facteur),
      phase1: phase1Validee !== null && phase1Validee <= w ? 1 : 0,
    });
  }

  // La remise du rapport final, et le comité de pilotage qui le reçoit.
  if (d3 === 0) err3 *= 1 - RELECTURE.finale;
  if (d6 === 1) {
    err3 *= 1 - RELECTURE.nuit;
    err2Apres *= 0.85;
  }
  const resteLivrable = resteDesFiles(fileA, fileB, coutFiche(13), coutPhase3());
  const semainesApres = resteLivrable / (CAPACITE.a + CAPACITE.b);
  const retard = Math.max(0, semainesApres - (remise ? 2 : 0));
  const penalites = PENALITE_JOUR * 7 * retard;
  let corrections = 0;
  if (!m3Traitee) {
    confiance += CONFIANCE.priorisationTardive;
    m3Tardive = true;
    corrections += 5;
  }
  const n3 = err3 + err2Apres + sysApres;
  remarques += n3;
  confiance -= entameParErreurs(remarques) - entameParErreurs(remarques - n3);
  confiance += CONFIANCE.parSemaineDeRetard * retard;
  corrections += CORRECTION.client * n3;
  confiance = borne(confiance, 0, 1);

  const joursTrimestre = pointes + resteLivrable + semainesApres * PILOTAGE + corrections;
  const joursTotal = JOURS_AVANT + joursTrimestre;
  const marge =
    FORFAIT - COUT_JOUR * joursTotal - COUT_JOUR * MAJORATION * majores - penalites - pertes;
  const facteur = SCENARIOS[h.scenario]!.facteur;
  const chance = chanceDeLaTranche(confiance, d6, 13);
  const valeurTranche = valeurDeLaTranche(confiance, d6, 13, facteur);
  return {
    chemin,
    semaines,
    objectif: marge + valeurTranche,
    marge,
    valeurTranche,
    chanceTranche: chance,
    confiance,
    jours: joursTotal,
    joursTrimestre,
    majores,
    penalites,
    retard,
    remarques,
    scenario: h.scenario,
    phase1ValideeSemaine: phase1Validee,
    nouveauRefus,
    sousReserve,
    methode2: m2,
    methode2Tardive: m2Tardive,
    methode3: m3,
    methode3Tardive: m3Tardive,
    refusPhase2,
    arret: tot || tard,
    remise,
    pertes,
    journal,
  };
}

function resteDesFiles(fileA: Tache[], fileB: Tache[], coutFiche: number, coutPhase3: number) {
  return [...fileA, ...fileB].reduce(
    (s, t) =>
      s +
      (t.genre === "jours"
        ? t.reste
        : t.genre === "fiches"
          ? t.reste * coutFiche
          : t.reste * coutPhase3),
    0,
  );
}

/** Ce que l'équipe peut encore fournir d'ici la fin de la semaine 13, avant samedis et renforts. */
export function capaciteRestante(semaine: number) {
  let c = 0;
  for (let w = semaine + 1; w <= SEMAINES; w += 1) {
    c += CAPACITE_SEMAINE - (w >= AVANT_VENTE.de && semaine >= 9 ? AVANT_VENTE.jours : 0);
  }
  return c;
}

/** La marge à terminaison : le forfait moins tous les jours, les rachats majorés et les pénalités projetées. */
function margeEstimee(
  joursTotal: number,
  majores: number,
  manque: number,
  delaiObtenu: boolean,
  pertes: number,
) {
  const semainesDeRetard = Math.max(0, manque / (CAPACITE.a + CAPACITE.b) - (delaiObtenu ? 2 : 0));
  return (
    FORFAIT -
    COUT_JOUR * joursTotal -
    COUT_JOUR * MAJORATION * majores -
    PENALITE_JOUR * 7 * semainesDeRetard -
    pertes
  );
}

/** La chance d'affermissement, avec le coup de pouce d'une remise proposée en comité final. */
function chanceDeLaTranche(confiance: number, d6: number | undefined, semaine: number) {
  const remise = d6 === 2 && semaine >= 12;
  return Math.min(0.95, chanceTranche(confiance) + (remise ? TRANCHE.coupDePouce : 0));
}

/** La valeur espérée de la tranche : sa marge (remise déduite) par la chance qu'elle soit affermie. */
export function valeurDeLaTranche(
  confiance: number,
  d6: number | undefined,
  semaine: number,
  facteur: number,
) {
  const remise = d6 === 2 && semaine >= 12;
  return (
    chanceDeLaTranche(confiance, d6, semaine) *
    facteur *
    (MARGE_TRANCHE - (remise ? REMISE_TRANCHE : 0))
  );
}

/** Ce qui s'est passé pendant des semaines : les retours du client, l'arrêt de Shirin, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    journal: t.journal.filter((e) => dans(e.semaine)),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureMission {
  jours: number | null;
  confiance: number | null;
  manque: number | null;
  remarques: number | null;
  marge: number | null;
  valeur: number | null;
  /** Clés non affichées, pour les messages et les sources. */
  reste: number | null;
  capacite: number | null;
  fiches: number | null;
  phase1: number | null;
  chance: number | null;
  nouveauRefus: number | null;
  sousReserve: number | null;
  scenario: number | null;
}

/** Ce qu'Ewen lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureMission {
  if (semaine === 0) {
    const reste = RESTE_PLANIFIE;
    const marge = FORFAIT - COUT_JOUR * (JOURS_AVANT + reste);
    return {
      jours: JOURS_AVANT,
      confiance: CONFIANCE_DEPART,
      manque: 0,
      remarques: 0,
      marge,
      valeur: marge + chanceTranche(CONFIANCE_DEPART) * FACTEUR_ATTENDU * MARGE_TRANCHE,
      reste,
      capacite: capaciteRestante(0),
      fiches: 0,
      phase1: 0,
      chance: chanceTranche(CONFIANCE_DEPART),
      nouveauRefus: 0,
      sousReserve: 0,
      scenario: -1,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const avant = (w: number) => w <= semaine;
  return {
    jours: s.jours,
    confiance: s.confiance,
    manque: s.manque,
    remarques: s.remarques,
    marge: s.marge,
    valeur: s.valeur,
    reste: s.reste,
    capacite: s.capacite,
    fiches: s.fiches,
    phase1: s.phase1,
    chance: s.chance,
    nouveauRefus: t.journal.some((e) => e.quoi === "refusV2" && avant(e.semaine)) ? 1 : 0,
    sousReserve: t.journal.some((e) => e.quoi === "sousReserve" && avant(e.semaine)) ? 1 : 0,
    scenario: semaine >= REVELATION ? t.scenario : -1,
  };
}
