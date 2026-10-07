/**
 * LES FACTURES QUI DORMENT — le modèle de la facturation et du crédit clients
 * d'Atlas Conseil, siège de Nantes.
 *
 * Évrard Valdenaire tient la facturation et le crédit clients d'un cabinet de
 * 240 collaborateurs : 34 M€ de chiffre d'affaires, 55 % de clients privés,
 * 45 % de clients publics. En un an, le DSO est passé de 75 à 96 jours et la
 * Banque de l'Erdre s'inquiète. Le trimestre va d'octobre à décembre. Treize
 * semaines, six décisions. Quatre mécanismes font l'épisode, et le joueur
 * doit les découvrir :
 *
 *   · LA TRÉSORERIE DORT AVANT LA FACTURE. Un cabinet ne vend que du temps,
 *     et ce temps devient de l'argent en trois étapes : produit, facturé,
 *     encaissé. Entre la première et la deuxième dort l'en-cours de
 *     production : les travaux des forfaits réalisés mais non facturés, et
 *     les jours de régie dont les temps ne sont pas validés dans Tempora.
 *     Les jalons de facturation des forfaits ne partent que si le directeur
 *     de mission les déclenche ; occupé, ou soucieux de ne pas froisser son
 *     client, il attend. Une facture qui n'existe pas ne se relance pas.
 *   · UNE FACTURE PUBLIQUE REJETÉE N'EXISTE PAS. Les clients publics
 *     reçoivent leurs factures par le portail public de facturation
 *     électronique ; sans numéro d'engagement ni code service, le portail
 *     la rejette. Le délai de paiement (30 jours pour une collectivité, 50
 *     pour un hôpital) ne court qu'à compter d'un dépôt conforme : chaque
 *     rejet le fait repartir de zéro. Corriger les factures rejetées vide le
 *     stock ; exiger le numéro d'engagement avant d'émettre tarit la source.
 *   · RELANCER CE QUI N'EST PAS DÛ ABÎME SANS RAPPORTER. La liste des
 *     « clients en retard » mêle des factures vraiment échues, qui paient
 *     plus vite quand on les relance, des factures rejetées, que l'acheteur
 *     public n'a jamais reçues, et des factures contestées, qu'aucune relance
 *     ne fera payer avant que le litige soit réglé. Relancer ces deux-là
 *     froisse : un client froissé peut retirer une mission (le hasard dit
 *     lequel, et quand), et Ollivro, relancé sur une facture qu'il conteste,
 *     signe beaucoup moins volontiers l'avenant qui réglerait le litige.
 *   · LE FINANCEMENT NE RÈGLE PAS LA CAUSE. Un découvert ou un affacturage
 *     financent le creux, ils n'encaissent rien : une créance cédée avec
 *     recours reste au bilan, et le factor ne finance ni une facture rejetée
 *     ni une facture contestée. La Banque de l'Erdre accorde une facilité de
 *     caisse à qui lui montre que la trésorerie revient, beaucoup moins à
 *     qui demande seulement plus de découvert ; l'affacturage est sûr, mais
 *     cher.
 *
 * Le trimestre est jugé en euros : la TRÉSORERIE DÉGAGÉE, c'est-à-dire ce que
 * les clients ont payé au-delà de ce que le cabinet a produit (la baisse de
 * la production immobilisée, en-cours et créances), moins les coûts : frais
 * financiers, commissions, affacturage, majorations de retard, avoirs
 * consentis, frais d'avocat et marge des missions perdues par des clients
 * froissés. Tous les montants sont hors taxes ; le DSO se calcule ici en
 * rapportant les créances hors taxes au chiffre d'affaires hors taxes.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** Le chiffre d'affaires annuel, et ce qu'en vaut un jour : la base du DSO. */
export const CA_ANNUEL = 34_000_000;
export const CA_JOUR = CA_ANNUEL / 365;
export const DSO_AN_DERNIER = 75;

/** La production facturable de chaque semaine, hors taxes : le creux de fin décembre en semaine 13. */
export const PRODUCTION: readonly number[] = [
  0, 720000, 720000, 720000, 720000, 720000, 720000, 720000, 720000, 720000, 720000, 720000, 650000,
  290000,
];
export const PRODUCTION_TRIMESTRE = PRODUCTION.reduce((s, x) => s + x, 0);
/** 60 % de la production est au forfait, 40 % en régie. */
export const PART_FORFAIT = 0.6;
/** 45 % du chiffre d'affaires est fait avec des clients publics. */
export const PART_PUBLIC = 0.45;

/* ---------------------------------------------------------------------------
 * L'EN-COURS DE PRODUCTION AU 30 SEPTEMBRE : ce que la semaine 1 doit chiffrer.
 * ------------------------------------------------------------------------- */
export const MISSIONS_FORFAIT = 64;
/** Avancement validé × prix, sur les forfaits en cours. */
export const VALEUR_REALISEE = 8_450_000;
export const FACTURE_FORFAITS = 6_610_000;
/** Les jalons franchis (livrable validé en comité de pilotage) et non déclenchés. */
export const JALONS_0 = 1_120_000;
export const NOMBRE_JALONS = 32;
/** Le reste de l'en-cours des forfaits : des travaux entre deux jalons, pas encore facturables. */
export const TRAVAUX_0 = VALEUR_REALISEE - FACTURE_FORFAITS - JALONS_0;
export const JOURS_REGIE_0 = 1060;
export const TJM_REGIE = 850;
export const REGIE_0 = JOURS_REGIE_0 * TJM_REGIE;
export const EN_COURS_0 = TRAVAUX_0 + JALONS_0 + REGIE_0;

/* ---------------------------------------------------------------------------
 * LES CRÉANCES AU 30 SEPTEMBRE : ce que la balance âgée montre, et ce qu'elle cache.
 * ------------------------------------------------------------------------- */
export const NON_ECHUES_PRIVEES_0 = 3_000_000;
/** Échues, non contestées : les seules qu'une relance fait payer plus vite. */
export const ECHUES_PRIVEES_0 = 1_450_000;
/** Acceptées par le portail : 1 700 k€ non échues, 760 k€ échues. */
export const PUBLIQUES_VALIDES_0 = 2_460_000;
export const PUBLIQUES_ECHUES_0 = 760_000;
export const REJETEES_0 = 1_240_000;
export const FACTURES_REJETEES_0 = 41;
/** Livrables non validés, avenants non signés : dont la facture de Ollivro. */
export const CONTESTEES_0 = 790_000;
export const CREANCES_0 =
  NON_ECHUES_PRIVEES_0 + ECHUES_PRIVEES_0 + PUBLIQUES_VALIDES_0 + REJETEES_0 + CONTESTEES_0;
export const DSO_0 = CREANCES_0 / CA_JOUR;
/** Ce que la liste des « clients en retard » additionne : échues, rejetées et contestées mêlées. */
export const EN_RETARD_0 = ECHUES_PRIVEES_0 + PUBLIQUES_ECHUES_0 + REJETEES_0 + CONTESTEES_0;
export const VRAIMENT_ECHUES_0 = ECHUES_PRIVEES_0 + PUBLIQUES_ECHUES_0;

/* ---------------------------------------------------------------------------
 * LES RYTHMES DU CABINET, par semaine.
 * ------------------------------------------------------------------------- */
/** La part des travaux entre jalons qui franchit un jalon chaque semaine. */
export const TAUX_JALON = 0.6;
/** La part des jalons franchis que les directeurs de mission déclenchent chaque semaine. */
export const FACT_JALONS = 0.33;
/** La part de la régie non facturée dont les temps sont validés et facturés chaque semaine. */
export const FACT_REGIE = 0.3;
/** Une facture publique sur cinq environ est rejetée par le portail. */
export const TAUX_REJET = 0.22;
/** Avec le numéro d'engagement exigé dans Tempora avant toute émission. */
export const TAUX_REJET_CONTROLE = 0.04;
/** La part des factures rejetées reprises chaque semaine, sans personne pour s'en charger. */
export const CORRECTION = 0.05;
export const CORRECTION_ACTIVE = 0.2;
export const PAIEMENT_PUBLIC = 0.114;
/** La part des factures privées qui arrivent à échéance chaque semaine (60 jours). */
export const ECHEANCE_PRIVEE = 0.114;
/** Six clients privés sur dix paient à l'échéance. */
export const A_L_HEURE = 0.6;
export const PAIEMENT_RETARD = 0.12;
/** Une relance fait payer plus vite les factures échues et non contestées. */
export const EFFET_RELANCE = 0.07;
/** Relancer les seules factures échues et non contestées, ou seulement les vingt plus gros encours échus. */
export const EFFET_RELANCE_CIBLEE = 0.06;
export const EFFET_VINGT_ENCOURS = 0.045;
export const CONTESTATION = 0.03;
export const RESOLUTION = 0.02;
/** Facturés d'office avant validation, un jalon sur quatre est contesté. */
export const CONTESTATION_D_OFFICE = 0.25;
/** Et chaque semaine, 15 % des travaux entre jalons facturés avant d'être livrés : tous contestés. */
export const FACTURATION_PREMATUREE = 0.15;

/* ---------------------------------------------------------------------------
 * OLLIVRO AGROALIMENTAIRE : la facture contestée.
 * ------------------------------------------------------------------------- */
export const OLLIVRO = 240_000;
/** La part conforme au contrat. */
export const OLLIVRO_CONFORME = 160_000;
/** L'extension au second site, faite sans avenant. */
export const OLLIVRO_HORS_PERIMETRE = OLLIVRO - OLLIVRO_CONFORME;
/** Ollivro signe l'avenant deux fois sur trois ; relancé sur la facture qu'il conteste, trois fois sur dix. */
export const P_AVENANT = 0.65;
export const P_AVENANT_FROISSE = 0.3;
/** La phase 3 de Ollivro : la marge qu'Atlas perd si elle part chez Kéroual Consulting. */
export const MARGE_PHASE3 = 120_000;
export const P_PHASE3_PERDUE_CONTENTIEUX = 0.75;
/** Refusant l'avenant, Ollivro met la phase 3 en concurrence : perdue quatre fois sur cinq. */
export const P_PHASE3_PERDUE_REFUS = 0.8;
export const FRAIS_AVOCAT = 4500;
export const SEMAINE_OLLIVRO = 7;

/* ---------------------------------------------------------------------------
 * LA TRÉSORERIE ET LA BANQUE DE L'ERDRE.
 * ------------------------------------------------------------------------- */
export const SOLDE_0 = -1_350_000;
export const AUTORISATION = 1_500_000;
/** À l'échéance annuelle de la ligne, fin novembre, la banque la ramène à 500 k€ : effet en semaine 10. */
export const AUTORISATION_REDUITE = 500_000;
export const SEMAINE_ECHEANCE_LIGNE = 10;
/** Ce que le cabinet décaisse chaque semaine : salaires, charges, loyers, sous-traitance, lissés. */
export const DECAISSEMENTS = 650_000;
/** Semaine 12 : prime de fin d'année, salaires de décembre versés avant Noël, échéances sociales et fiscales. */
export const PIC = { semaine: 12, montant: 2_100_000 } as const;
export const TAUX_DECOUVERT = 0.065;
/** Une échéance URSSAF ou de TVA impayée : 5 % de majoration de retard. */
export const MAJORATION = 0.05;
/** Le découvert supplémentaire demandé, ou la facilité de caisse. */
export const RALLONGE = 1_500_000;
export const COMMISSION_DECOUVERT = 0.005;
export const COMMISSION_FACILITE = 0.002;
/** En semaine 1 : 500 k€ jusqu'à fin novembre, une fois sur trois ; des frais d'étude dans tous les cas. */
export const RALLONGE_S1 = 500_000;
export const P_RALLONGE_S1 = 0.35;
export const FRAIS_ETUDE = 2500;
/** L'affacturage des créances privées : avec recours, sur les seules factures approuvées. */
export const FRAIS_AFFACTURAGE = 6000;
export const COMMISSION_AFFACTURAGE = 0.005;
export const AVANCE_FACTOR = 0.85;
export const SURCOUT_FINANCEMENT_FACTOR = 0.01;
/**
 * Ce que la banque regarde en semaine 9 : ce qui dort encore sans facture valide (en-cours non
 * facturé, factures rejetées, factures contestées). Sous 3 M€, l'échéancier est crédible ; au-delà
 * de 3,8 M€, il ne l'est pas. Au 30 septembre : 4,8 M€.
 */
export const SEUIL_CONFIANCE = 3_000_000;
export const SEUIL_DOUTE = 3_800_000;

/** Les clients froissés : une chance sur sept par point de froissement de perdre une mission. */
export const P_PAR_POINT = 0.15;
export const MARGE_MISSION = 80_000;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la facturation de septembre attend, des encaissements glissent. */
export const PERTE_PAR_JOUR = 10_000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  priorite: 0,
  portail: 1,
  jalons: 2,
  ollivro: 3,
  banque: 4,
  cloture: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [2, 3, 3, 3, 3, 3] as const;

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
  effet: { public?: number; facturation?: number; correction?: number; gel?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "portail",
    titre: "Panne du portail public de facturation",
    de: "Assita Ouattara",
    role: "Chargée de facturation",
    texte:
      "Le portail public de facturation est indisponible trois jours : les services facturiers des clients publics prennent une semaine de retard dans leurs mandatements.",
    duree: 1,
    effet: { public: 0.7 },
  },
  {
    id: "sauvegarde",
    titre: "Un client en procédure de sauvegarde",
    de: "Prune Lecoeur",
    role: "Contrôleuse de gestion",
    texte:
      "Un distributeur de la région, client de la practice Performance opérationnelle, est placé en procédure de sauvegarde : ses 65 k€ de factures échues sont gelées.",
    duree: 1,
    effet: { gel: 65000 },
  },
  {
    id: "comptable",
    titre: "Paiements bloqués chez un grand hôpital",
    de: "Assita Ouattara",
    role: "Chargée de facturation",
    texte:
      "Le centre hospitalier de Pornevaux change de logiciel comptable : ses paiements, et ceux de deux autres établissements du même groupement, sont suspendus deux semaines.",
    duree: 2,
    effet: { public: 0.8 },
  },
  {
    id: "tempora",
    titre: "Mise à jour de Tempora",
    de: "Direction des systèmes d'information",
    role: "Siège de Nantes",
    texte:
      "La mise à jour de Tempora bloque la génération des factures pendant quatre jours : la facturation de la semaine attend.",
    duree: 1,
    effet: { facturation: 0.3 },
  },
  {
    id: "arret",
    titre: "Une chargée de facturation arrêtée",
    de: "Ressources humaines",
    role: "Siège de Nantes",
    texte:
      "Maïssa Roudaut, chargée de facturation, est arrêtée deux semaines. L'équipe tourne à deux au lieu de trois.",
    duree: 2,
    effet: { facturation: 0.8, correction: 0.5 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des encaissements, semaine par semaine. */
  bruit: readonly number[];
  /** La réponse de la banque en semaine 1, puis en semaine 9. */
  uBanque1: number;
  uBanque5: number;
  /** Ollivro signe-t-il l'avenant ? */
  uOllivro: number;
  /** Mis en demeure, Ollivro confie-t-il la phase 3 à Kéroual ? */
  uPhase3: number;
  /** Un client froissé retire-t-il une mission, en semaine 9, puis en semaine 13 ? */
  uFroisse1: number;
  uFroisse2: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000669 + 7);
  const bruit = [1];
  for (let i = 1; i <= SEMAINES; i += 1) {
    bruit.push(Math.min(1.12, Math.max(0.88, 1 + 0.015 * gauss(r))));
  }
  const uBanque1 = r();
  const uBanque5 = r();
  const uOllivro = r();
  const uPhase3 = r();
  const uFroisse1 = r();
  const uFroisse2 = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    uBanque1,
    uBanque5,
    uOllivro,
    uPhase3,
    uFroisse1,
    uFroisse2,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI TOMBE SELON LE HASARD, ET CE QUI EN DÉCOULE DES DÉCISIONS.
 * ------------------------------------------------------------------------- */

/** La banque accorde-t-elle 500 k€ de plus en semaine 1 ? Une fois sur trois, sans dossier. */
export const rallongeS1Accordee = (graine: number) => hasard(graine).uBanque1 < P_RALLONGE_S1;

/** Ollivro a-t-il été relancé sur la facture qu'il conteste ? */
export const ollivroFroisse = (chemin: readonly number[]) => chemin[D.priorite] === 0;
export const chanceAvenant = (chemin: readonly number[]) =>
  ollivroFroisse(chemin) ? P_AVENANT_FROISSE : P_AVENANT;
export const avenantSigne = (chemin: readonly number[], graine: number) =>
  chemin[D.ollivro] === 1 && hasard(graine).uOllivro < chanceAvenant(chemin);

/**
 * LA BANQUE DE L'ERDRE, EN SEMAINE 9. Son comité de crédit prête sur un
 * échéancier crédible : des factures émises, acceptées, non contestées. Il
 * regarde donc ce qui dort encore sans facture valide à la fin de la semaine
 * 8 : en-cours non facturé, factures rejetées, factures contestées. Une
 * facilité de caisse appuyée sur cet échéancier passe 85 fois sur cent sous
 * 3 M€ ; une demande de découvert sans dossier, bien moins souvent. Une
 * première demande en semaine 1 a laissé une trace.
 */
export function chanceBanque(option: number, endormi8: number, dejaSollicitee: boolean): number {
  const palier = endormi8 <= SEUIL_CONFIANCE ? 0 : endormi8 <= SEUIL_DOUTE ? 1 : 2;
  const p =
    option === 2 ? [0.85, 0.55, 0.25][palier]! : option === 0 ? [0.35, 0.2, 0.1][palier]! : 0;
  return Math.max(0, p - (dejaSollicitee ? 0.15 : 0));
}

/** Le risque de perdre une mission, selon les points de froissement. */
export const risqueDePerte = (points: number) => Math.min(0.9, P_PAR_POINT * points);

/** Les points de froissement des trois premières décisions, puis des trois dernières. */
export function froissement(chemin: readonly number[]): [number, number] {
  const [d1, d2, d3, d4, , d6] = chemin;
  const premiers = (d1 === 0 ? 2 : 0) + (d2 === 0 ? 1.5 : 0) + (d3 === 2 ? 2 : 0);
  const derniers = (d4 === 0 ? 0.5 : 0) + (d6 === 0 ? 1.5 : 0);
  return [premiers, derniers];
}

export type Semaine = {
  /** La trésorerie dégagée depuis le début du trimestre, coûts déduits. */
  degage: number;
  /** Ce que la semaine a apporté à la trésorerie dégagée. */
  contribution: number;
  encaissements: number;
  production: number;
  factures: number;
  /** L'en-cours de production non facturé : travaux entre jalons, jalons franchis, régie. */
  enCours: number;
  jalons: number;
  regie: number;
  creances: number;
  dso: number;
  /** L'en-cours et les créances, en jours de chiffre d'affaires. */
  immobilisation: number;
  rejetees: number;
  contestees: number;
  /** Ce qui dort sans facture valide : en-cours non facturé, factures rejetées, factures contestées. */
  endormi: number;
  /** Les factures échues et non contestées : les seules que la relance fait payer. */
  echues: number;
  /** Le poste clients privé : ce qu'un factor pourrait reprendre. */
  prive: number;
  solde: number;
  /** Le solde si toutes les échéances avaient été payées : ce que la prévision montre. */
  besoin: number;
  plafond: number;
  couts: number;
  /** Le solde que la prévision donne au pic de la semaine 12, échéances toutes payées. */
  picPrevu: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La trésorerie dégagée sur le trimestre, coûts déduits : plus elle est haute, mieux c'est. */
  objectif: number;
  encaissements: number;
  production: number;
  /** Les coûts déduits, par nature. */
  fraisFinanciers: number;
  majorations: number;
  affacturage: number;
  avoirs: number;
  margePerdue: number;
  autresCouts: number;
  couts: number;
  dsoFinal: number;
  enCoursFinal: number;
  rejeteesFinal: number;
  /** Les échéances rejetées faute de ligne, cumulées sur le trimestre. */
  depassement: number;
  /** La semaine du premier rejet ; 0 : aucun. */
  semaineRejet: number;
  rallongeS1: boolean;
  /** La réponse de la banque en semaine 9 ; `null` si rien n'a été demandé. */
  banque: boolean | null;
  degageSemaine8: number;
  endormiSemaine8: number;
  avenant: boolean | null;
  phase3Perdue: boolean;
  /** Les missions retirées par des clients froissés, et quand. */
  missionsPerdues: number[];
  froissement: number;
  ollivroEncaisse: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const rallongeS1 = d1 === 3 && rallongeS1Accordee(graine);
  const signe = avenantSigne(chemin, graine);
  const phase3Perdue =
    (d4 === 0 && h.uPhase3 < P_PHASE3_PERDUE_CONTENTIEUX) ||
    (d4 === 1 && !signe && h.uPhase3 < P_PHASE3_PERDUE_REFUS);
  const [f1, f2] = froissement(chemin);
  const missionsPerdues: number[] = [];
  if (h.uFroisse1 < risqueDePerte(f1)) missionsPerdues.push(9);
  if (h.uFroisse2 < risqueDePerte(f2)) missionsPerdues.push(13);

  let travaux = TRAVAUX_0;
  let jalons = JALONS_0;
  let regie = REGIE_0;
  let nonEchues = NON_ECHUES_PRIVEES_0;
  let echues = ECHUES_PRIVEES_0;
  let publiques = PUBLIQUES_VALIDES_0;
  let rejetees = REJETEES_0;
  let contestees = CONTESTEES_0 - OLLIVRO;
  let ollivro = OLLIVRO;
  let gelees = 0;
  let solde = SOLDE_0;
  let degage = 0;
  let encaisse = 0;
  let produit = 0;
  let ollivroEncaisse = 0;
  const cout = {
    financiers: 0,
    majorations: 0,
    affacturage: 0,
    avoirs: 0,
    marge: 0,
    autres: 0,
  };
  let banque: boolean | null = null;
  let degage8 = 0;
  let endormi8 = 0;
  let depassement = 0;
  let reporte = 0;
  let premierRejet = 0;
  let extra = 0;
  let factorActif = false;
  const semaines: (Semaine | null)[] = [null];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = (k: keyof Imprevu["effet"]) =>
      actifs.reduce((m, a) => m * (a.imprevu.effet[k] ?? 1), 1);
    const n = h.bruit[w]!;
    let couts = 0;
    if (w === 1) {
      const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      cout.autres += perte;
      couts += perte;
    }

    /* ---- La production, et les jalons qu'elle franchit ---- */
    const prod = PRODUCTION[w]!;
    produit += prod;
    travaux += PART_FORFAIT * prod;
    regie += (1 - PART_FORFAIT) * prod;
    const franchis = TAUX_JALON * travaux;
    travaux -= franchis;
    jalons += franchis;

    /* ---- La facturation ---- */
    let fJ = FACT_JALONS;
    let fR = FACT_REGIE;
    if (d1 === 1 && w >= 2 && w <= 4) [fJ, fR] = [0.42, 0.38];
    if (d1 === 0 && w >= 2 && w <= 5) fR -= 0.03; // l'équipe relance au lieu de facturer
    if (d3 === 0 && w >= 5 && w <= 8) fJ += 0.05;
    if (d3 === 1 && w >= 5) [fJ, fR] = [0.44, 0.38];
    if (d3 === 2 && w >= 5) fJ = 0.75;
    const capacite = effet("facturation");
    let factJ = fJ * capacite * jalons;
    let factR = fR * capacite * regie;
    // Les rattrapages : la revue des en-cours de la semaine 2, la facturation d'avant la clôture.
    if (d1 === 1 && w === 2) [factJ, factR] = [0.45 * jalons, 0.4 * regie];
    if (d6 === 1 && w === 11)
      [factJ, factR] = [Math.max(factJ, 0.5 * jalons), Math.max(factR, 0.5 * regie)];
    jalons -= factJ;
    regie -= factR;
    let premature = 0;
    if (d3 === 2 && w >= 5) {
      premature = FACTURATION_PREMATUREE * travaux;
      travaux -= premature;
    }
    const contestJ = d3 === 2 && w >= 5 ? CONTESTATION_D_OFFICE : CONTESTATION;
    const versContestees = contestJ * factJ + CONTESTATION * factR + premature;
    const propres = factJ + factR - contestJ * factJ - CONTESTATION * factR;
    const factures = factJ + factR + premature;
    const auPortail = PART_PUBLIC * propres;
    const rejet = d2 === 1 && w >= 3 ? TAUX_REJET_CONTROLE : TAUX_REJET;

    /* ---- Les encaissements ---- */
    // Publics : la clôture des mandatements freine la semaine 12 et arrête presque tout en semaine 13.
    let pp = PAIEMENT_PUBLIC;
    if (d2 === 0 && w >= 3 && w <= 6) pp += 0.015;
    if (w === 12) pp *= 0.5;
    if (w === 13) pp *= 0.3;
    if (d6 === 1 && w === 11) pp = 0.13;
    if (d6 === 1 && w === 12) pp = 0.11;
    const payesPublics = pp * n * effet("public") * publiques;
    // Privés : à l'échéance, six sur dix paient ; les autres passent en retard.
    const echeance = ECHEANCE_PRIVEE * nonEchues;
    const aLHeure = A_L_HEURE * echeance * n;
    let pe = PAIEMENT_RETARD;
    if (d1 === 0 && w >= 2 && w <= 5) pe += EFFET_RELANCE;
    if (d1 === 2 && w >= 2 && w <= 5) pe += 0.01;
    if (d6 === 0 && w >= 11) pe += EFFET_RELANCE;
    if (d6 === 1 && w >= 11) pe += EFFET_RELANCE_CIBLEE;
    if (d6 === 2 && w >= 11) pe += EFFET_VINGT_ENCOURS;
    const payesEchues = Math.min(echues, pe * n * echues);
    // Ollivro : l'avenant signé, ou l'avoir, débloquent la part conforme en semaine 9.
    let ollivroPaye = 0;
    if (w === SEMAINE_OLLIVRO && (signe || d4 === 2)) {
      if (d4 === 2) {
        cout.avoirs += OLLIVRO_HORS_PERIMETRE;
        couts += OLLIVRO_HORS_PERIMETRE;
        ollivro -= OLLIVRO_HORS_PERIMETRE;
      }
    }
    if (w === 9 && (signe || d4 === 2)) ollivroPaye += OLLIVRO_CONFORME;
    if (w === 12 && signe) ollivroPaye += OLLIVRO_HORS_PERIMETRE;
    ollivro -= ollivroPaye;
    ollivroEncaisse += ollivroPaye;
    const encaissements = payesPublics + aLHeure + payesEchues + ollivroPaye;
    encaisse += encaissements;

    /* ---- Les stocks de créances ---- */
    const corrigees = (d2 === 1 || d2 === 2) && w >= 3 ? CORRECTION_ACTIVE : CORRECTION;
    const reprises = corrigees * effet("correction") * rejetees;
    publiques += reprises - payesPublics + (1 - rejet) * auPortail;
    rejetees += rejet * auPortail - reprises;
    const resolues = RESOLUTION * contestees;
    contestees += versContestees - resolues;
    nonEchues += propres - auPortail - echeance;
    echues += echeance - aLHeure * 1 - payesEchues + resolues;
    for (const a of actifs) {
      if (a.semaine === w && a.imprevu.effet.gel) {
        const g = Math.min(echues, a.imprevu.effet.gel);
        echues -= g;
        gelees += g;
      }
    }

    /* ---- Le contentieux, les clients froissés ---- */
    if (d4 === 0 && w === 8) {
      cout.autres += FRAIS_AVOCAT;
      couts += FRAIS_AVOCAT;
    }
    if (phase3Perdue && w === 10) {
      cout.marge += MARGE_PHASE3;
      couts += MARGE_PHASE3;
    }
    for (const s of missionsPerdues) {
      if (s === w) {
        cout.marge += MARGE_MISSION;
        couts += MARGE_MISSION;
      }
    }

    /* ---- La banque et le financement ---- */
    if (d1 === 3 && w === 1) {
      cout.autres += FRAIS_ETUDE;
      couts += FRAIS_ETUDE;
    }
    if (w === 9) {
      if (d5 === 0 || d5 === 2) {
        banque = h.uBanque5 < chanceBanque(d5, endormi8, d1 === 3);
        if (banque) {
          const c = RALLONGE * (d5 === 0 ? COMMISSION_DECOUVERT : COMMISSION_FACILITE);
          cout.financiers += c;
          couts += c;
        }
      }
      if (d5 === 1) {
        cout.affacturage += FRAIS_AFFACTURAGE;
        couts += FRAIS_AFFACTURAGE;
      }
    }
    if (d5 === 1 && w === 11) {
      // Le factor reprend le poste clients privé approuvé : commission sur ce qui lui est cédé.
      factorActif = true;
      const c = COMMISSION_AFFACTURAGE * (nonEchues + echues);
      cout.affacturage += c;
      couts += c;
    }
    if (factorActif && w > 11) {
      const c = COMMISSION_AFFACTURAGE * (propres - auPortail);
      cout.affacturage += c;
      couts += c;
    }
    extra = 0;
    if (rallongeS1 && w <= 9) extra += RALLONGE_S1;
    if (banque && w >= 10) extra += RALLONGE;
    if (factorActif) extra += AVANCE_FACTOR * (nonEchues + echues);
    const ligne = w >= SEMAINE_ECHEANCE_LIGNE ? AUTORISATION_REDUITE : AUTORISATION;
    const plafond = ligne + extra;

    // Les intérêts de la semaine, sur le découvert de la semaine précédente.
    const utilise = Math.min(Math.max(0, -solde), plafond);
    let interets = (utilise * TAUX_DECOUVERT) / 52;
    if (factorActif) interets += (Math.max(0, utilise - ligne) * SURCOUT_FINANCEMENT_FACTOR) / 52;
    cout.financiers += interets;
    couts += interets;

    const decaisse = DECAISSEMENTS + (w === PIC.semaine ? PIC.montant : 0);
    // Seuls les coûts qui sortent de la caisse pèsent sur le solde.
    const sortent =
      couts -
      (w === 10 && phase3Perdue ? MARGE_PHASE3 : 0) -
      (missionsPerdues.includes(w) ? MARGE_MISSION : 0) -
      (d4 === 2 && w === SEMAINE_OLLIVRO ? OLLIVRO_HORS_PERIMETRE : 0);
    solde += encaissements - decaisse - sortent;
    // Ce qui a été rejeté se paie dès que la ligne le permet.
    if (reporte > 0) {
      const paye = Math.min(reporte, Math.max(0, solde + plafond));
      reporte -= paye;
      solde -= paye;
    }
    if (-solde > plafond) {
      // Au-delà du plafond, la banque rejette : échéances URSSAF et TVA reportées, majorées de 5 %.
      const rejete = -solde - plafond;
      const m = MAJORATION * rejete;
      if (!premierRejet) premierRejet = w;
      depassement += rejete;
      reporte += rejete + m;
      solde = -plafond;
      cout.majorations += m;
      couts += m;
    }

    const contribution = encaissements - prod - couts;
    degage += contribution;
    const enCours = travaux + jalons + regie;
    const creances = nonEchues + echues + publiques + rejetees + contestees + ollivro + gelees;
    const endormi = enCours + rejetees + contestees + ollivro;
    if (w === 8) [degage8, endormi8] = [degage, endormi];
    semaines.push({
      degage,
      contribution,
      encaissements,
      production: prod,
      factures,
      enCours,
      jalons,
      regie,
      creances,
      dso: creances / CA_JOUR,
      immobilisation: (enCours + creances) / CA_JOUR,
      rejetees,
      contestees: contestees + ollivro,
      endormi,
      echues,
      prive: nonEchues + echues,
      solde,
      besoin: solde - reporte,
      plafond,
      couts: Object.values(cout).reduce((s, x) => s + x, 0),
      picPrevu: 0,
    });
  }
  const pic = semaines[PIC.semaine]!.besoin;
  for (const s of semaines) if (s) s.picPrevu = pic;
  const fin = semaines[SEMAINES]!;
  const total = Object.values(cout).reduce((s, x) => s + x, 0);

  return {
    semaines,
    objectif: degage,
    encaissements: encaisse,
    production: produit,
    fraisFinanciers: cout.financiers,
    majorations: cout.majorations,
    affacturage: cout.affacturage,
    avoirs: cout.avoirs,
    margePerdue: cout.marge,
    autresCouts: cout.autres,
    couts: total,
    dsoFinal: fin.dso,
    enCoursFinal: fin.enCours,
    rejeteesFinal: fin.rejetees,
    depassement,
    semaineRejet: premierRejet,
    rallongeS1,
    banque,
    degageSemaine8: degage8,
    endormiSemaine8: endormi8,
    avenant: d4 === 1 ? signe : null,
    phase3Perdue,
    missionsPerdues,
    froissement: f1 + f2,
    ollivroEncaisse,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, litiges, clients froissés, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    avenant: t.avenant !== null && dans(SEMAINE_OLLIVRO) ? t.avenant : null,
    ollivroPaye: t.ollivroEncaisse > 0 && dans(9),
    phase3Perdue: t.phase3Perdue && dans(10),
    banque: t.banque !== null && dans(9) ? t.banque : null,
    factor: chemin[D.banque] === 1 && dans(11),
    depassement: t.semaineRejet > 0 && dans(t.semaineRejet),
    missionsPerdues: t.missionsPerdues.filter(dans),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureFacturation {
  tresorerieDegagee: number | null;
  dso: number | null;
  enCours: number | null;
  rejetees: number | null;
  solde: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  jalons: number | null;
  regie: number | null;
  contestees: number | null;
  echues: number | null;
  endormi: number | null;
  prive: number | null;
  plafond: number | null;
  immobilisation: number | null;
  picPrevu: number | null;
}

/** Ce qu'Évrard lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureFacturation {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  if (semaine === 0) {
    return {
      tresorerieDegagee: 0,
      dso: DSO_0,
      enCours: EN_COURS_0,
      rejetees: REJETEES_0,
      solde: SOLDE_0,
      jalons: JALONS_0,
      regie: REGIE_0,
      contestees: CONTESTEES_0,
      echues: ECHUES_PRIVEES_0,
      endormi: EN_COURS_0 + REJETEES_0 + CONTESTEES_0,
      prive: NON_ECHUES_PRIVEES_0 + ECHUES_PRIVEES_0,
      plafond: AUTORISATION,
      immobilisation: (EN_COURS_0 + CREANCES_0) / CA_JOUR,
      picPrevu: t.semaines[PIC.semaine]!.solde,
    };
  }
  const s = t.semaines[semaine]!;
  return {
    tresorerieDegagee: s.degage,
    dso: s.dso,
    enCours: s.enCours,
    rejetees: s.rejetees,
    solde: s.solde,
    jalons: s.jalons,
    regie: s.regie,
    contestees: s.contestees,
    echues: s.echues,
    endormi: s.endormi,
    prive: s.prive,
    plafond: s.plafond,
    immobilisation: s.immobilisation,
    picPrevu: s.picPrevu,
  };
}
