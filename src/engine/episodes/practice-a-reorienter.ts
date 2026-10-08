/**
 * LA PRACTICE DONT LE MARCHÉ S'ÉTEINT — le modèle de la practice Énergie et bâtiment.
 *
 * Atlas Conseil, cabinet de conseil et bureau d'études nantais. La practice
 * Énergie et bâtiment compte dix-huit consultants : des audits énergétiques
 * réglementaires (60 % de l'activité de l'an dernier) et de l'assistance à
 * maîtrise d'ouvrage (AMO). L'obligation d'audit prend fin au 31 décembre pour
 * la plupart des clients : le carnet d'audits s'éteint à une date connue. La
 * décarbonation des sites industriels monte, mais personne dans l'équipe n'en
 * a encore fait. Septembre à novembre, treize semaines, six décisions. Quatre
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE TEMPS NE SE STOCKE PAS, ET LE CARNET D'AUDITS DÉCROÎT À DATE CONNUE.
 *     Le plan de charge des audits (180 jours en septembre, 185 en octobre,
 *     104 en novembre, 70 en décembre, 24 en janvier, plus rien en février)
 *     dit d'avance quand les consultants n'auront plus rien à faire. Un jour
 *     staffable sans mission est perdu : c'est l'INTERCONTRAT, payé au coût
 *     d'un jour de salaire. Attendre « l'an prochain » laisse venir 506 jours
 *     d'intercontrat au trimestre suivant.
 *   · ON NE DEVIENT VENDABLE QUE SUR UNE VRAIE MISSION. Un consultant formé
 *     en salle n'est pas vendable : les clients industriels demandent « qui
 *     l'a déjà fait ? ». En binôme avec un expert sur une première mission
 *     réelle, il est facturé à moitié pendant qu'il apprend, et vendable seul
 *     douze semaines plus tard ; seize avec un indépendant qui repart, vingt-deux
 *     sans personne qui sache. Un expert encadre deux binômes : au-delà,
 *     l'apprentissage ralentit et la première mission risque de rater.
 *   · LES EXPERTS FONT LES PREMIÈRES RÉFÉRENCES. Recruter deux experts de la
 *     décarbonation coûte cher (honoraires de recrutement, salaires, quelques
 *     semaines sans assez de missions), mais un client achète une équipe qui
 *     a des références : leur arrivée fait signer l'équipe entière, et chaque
 *     mission réussie en ajoute une. Des indépendants de Freelancia arrivent
 *     plus vite et ne coûtent que les jours facturés, mais les références
 *     restent un peu les leurs.
 *   · CHACUN SELON SA SITUATION. Quatre consultants ne veulent pas changer
 *     de métier, chacun pour une raison différente. Un départ accompagné
 *     coûte moins qu'un départ subi (dossiers à reprendre, un client qui
 *     suit chez Kéroual Consulting) ou qu'un trimestre d'intercontrat ; imposer
 *     la reconversion à tous fait partir les gens au hasard, et un plan de
 *     départs collectif inquiète ceux qu'on voulait garder.
 *
 * L'OBJECTIF, EN EUROS. Le résultat de la practice sur le trimestre (chiffre
 * d'affaires moins salaires, frais de recrutement et de formation,
 * indépendants et pénalités de retard : c'est la marge moins l'intercontrat),
 * moins les départs, plus la VALEUR DU TRIMESTRE SUIVANT telle qu'on peut
 * l'estimer en semaine 13 : la marge du carnet de décarbonation constitué
 * (jours signés restant à produire, et la moitié des signatures que le rythme
 * de la semaine 13 promet sur décembre-février), produite par ceux qui seront
 * vendables, le reste confié à des indépendants ; la marge des audits en
 * retard reportés en décembre ; moins le coût de l'intercontrat attendu sur
 * décembre-février. Une practice qui attend affiche un trimestre correct et
 * un trimestre suivant désastreux : la valeur le dit dès la semaine 13.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CONSULTANTS = 18;
/** Jours staffables par consultant et par semaine : le cinquième va aux congés, à l'avant-vente, au cabinet. */
export const JOURS_STAFFABLES = 4;
/** Le coût salarial chargé d'un jour ouvré : 88 k€ par an sur 210 jours. */
export const COUT_JOUR = 420;
/** Celui d'un expert de la décarbonation : 136 k€ par an. */
export const COUT_JOUR_EXPERT = 650;
export const TJM = { audit: 780, auditTardif: 700, amo: 850, decarbonation: 1100 } as const;
/** Ce que coûte un jour d'indépendant de Freelancia : un expert, un auditeur. */
export const FREELANCE = { expert: 950, auditeur: 560 } as const;
/** L'AMO : un volume régulier, toute l'année. */
export const AMO_SEMAINE = 22;
/** Le plan de charge des audits, en jours à produire : les clients ont jusqu'au 31 décembre. */
export const AUDITS = {
  septembre: 180,
  octobre: 185,
  novembre: 104,
  decembre: 70,
  janvier: 24,
  fevrier: 0,
} as const;
/** Les semaines du trimestre : septembre de 1 à 4, octobre de 5 à 9, novembre de 10 à 13. */
export const MOIS = [
  { mois: "septembre", de: 1, a: 4 },
  { mois: "octobre", de: 5, a: 9 },
  { mois: "novembre", de: 10, a: 13 },
] as const;
/** Décembre à février : douze semaines ouvrées une fois les congés de fin d'année déduits. */
export const SEMAINES_SUIVANT = 12;
export const JOURS_SUIVANT = SEMAINES_SUIVANT * JOURS_STAFFABLES;
export const AUDITS_SUIVANT = AUDITS.decembre + AUDITS.janvier + AUDITS.fevrier;
export const AMO_SUIVANT = AMO_SEMAINE * SEMAINES_SUIVANT;
/** L'intercontrat de décembre à février si rien ne change, en jours : ce que la prévision demande. */
export const INTERCONTRAT_SI_RIEN = CONSULTANTS * JOURS_SUIVANT - AUDITS_SUIVANT - AMO_SUIVANT;

/** Une feuille de route de décarbonation d'un site industriel : quarante jours. */
export const MISSION = 40;
/** Jours de décarbonation signés par semaine quand l'équipe a des experts et des références. */
export const SIGNATURES = 16;
export const SCENARIOS = [
  { id: "porteur", nom: "porteur", chance: 0.3, multiple: 1.35 },
  { id: "moyen", nom: "moyen", chance: 0.45, multiple: 1 },
  { id: "lent", nom: "lent", chance: 0.25, multiple: 0.6 },
] as const;
export type Scenario = (typeof SCENARIOS)[number];
/** Ce que pèse chaque appui dans la décision d'un client industriel. */
export const CREDIBILITE = {
  depart: 0.2,
  parExpert: 0.35,
  independants: 0.25,
  parReference: 0.1,
  certification: 0.05,
  missionRatee: -0.25,
  plafond: 1.3,
} as const;
/** Semaines entre le début d'un binôme et le moment où le consultant est vendable seul. */
export const APPRENTISSAGE = { expert: 12, independant: 16, seul: 22, surcharge: 4, pause: 4 };
export const COUTS = {
  recrutementExpert: 24000,
  certification: 1800,
  departAccompagne: 18000,
  departSubi: 35000,
  planDeDepart: 26000,
  avoir: 15000,
  penaliteParJour: 80,
} as const;
/** La commande tardive des Conserveries de l'Aulne : quarante jours d'audits en novembre. */
export const COMMANDE_TARDIVE = { jours: 40, de: 10, a: 13, decarbonation: 40 } as const;
export const ARRIVEE_EXPERTS = 7;
export const ARRIVEE_TARDIVE = 10;
/** Les jours prêtés à la practice Performance opérationnelle, refacturés au prix de cession interne. */
export const PRET_INTERNE = { jours: 72, prix: 550 } as const;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : une proposition de décarbonation qui part chez Halden Partners. */
export const PERTE_PAR_JOUR = 3000;
export const OBJECTIF_VALEUR = 60000;
export const OCCUPATION_CIBLE = 0.75;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  cap: 0,
  experts: 1,
  binomes: 2,
  reticents: 3,
  commande: 4,
  plan: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 0, 2] as const;

/** Les quatre consultants qui ne veulent pas changer de métier, chacun pour sa raison. */
export const RETICENTS = [
  { id: "marcelin", nom: "Maodez Peyrade" },
  { id: "gwenola", nom: "Gwenola Toullec" },
  { id: "esteban", nom: "Esteban Calvez" },
  { id: "baptistine", nom: "Niamh Thépaut" },
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
  effet: {
    /** Jours staffables perdus par semaine. */
    absence?: number;
    /** Jours d'audit reportés en décembre, par semaine. */
    report?: number;
    /** Jours de reprise non facturés, une fois. */
    reprise?: number;
    signatures?: number;
    capacite?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "arret",
    titre: "Arrêt maladie d'une consultante",
    de: "Ressources humaines",
    role: "Siège, Nantes",
    texte:
      "Une consultante de l'équipe audits est arrêtée trois semaines : ses visites de sites sont à redistribuer.",
    duree: 3,
    effet: { absence: 4 },
  },
  {
    id: "report",
    titre: "Un hôpital décale ses audits",
    de: "Cellule marchés publics",
    role: "Atlas Conseil",
    texte:
      "Un centre hospitalier repousse l'ordre de service de ses audits : vingt jours glissent en décembre.",
    duree: 2,
    effet: { report: 10 },
  },
  {
    id: "contestation",
    titre: "Un rapport d'audit contesté",
    de: "Responsable qualité",
    role: "Atlas Conseil",
    texte:
      "Un client conteste les relevés d'un rapport d'audit : huit jours de reprise, non facturés.",
    duree: 1,
    effet: { reprise: 8 },
  },
  {
    id: "salon",
    titre: "Les rencontres régionales de l'industrie bas carbone",
    de: "Service marketing",
    role: "Atlas Conseil",
    texte:
      "Les rencontres régionales de l'industrie bas carbone remplissent l'agenda : des industriels demandent des propositions.",
    duree: 2,
    effet: { signatures: 1.5 },
  },
  {
    id: "greve",
    titre: "Grève dans les transports",
    de: "Assistante de la practice",
    role: "Énergie et bâtiment",
    texte:
      "Grève dans les transports : une partie des visites de sites de la semaine est annulée et à replanifier.",
    duree: 1,
    effet: { capacite: 0.85 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  audits: number;
  amo: number;
  signatures: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  scenario: Scenario;
  /** Chaque expert recruté arrive-t-il à la semaine 7, ou trois semaines plus tard ? */
  uExperts: readonly [number, number];
  /** Freelancia trouve-t-il ses indépendants pour la semaine 5 ? */
  uIndependants: number;
  /** La première mission de décarbonation tourne-t-elle mal ? */
  uMission: number;
  /** Chacun des quatre réticents part-il de lui-même ? */
  uReticents: readonly number[];
  /** Un plan de départs, une bascule brutale : un consultant qu'on voulait garder part-il ? */
  uInquiets: number;
  /** Les Conserveries de l'Aulne signent-elles la feuille de route proposée ? */
  uClient: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000793 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      audits: Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))),
      amo: Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r))),
      signatures: Math.min(1.7, Math.max(0.4, 1 + 0.3 * gauss(r))),
    });
  }
  const u = r();
  const scenario = u < SCENARIOS[0].chance ? SCENARIOS[0] : u < 0.75 ? SCENARIOS[1] : SCENARIOS[2];
  const uExperts = [r(), r()] as const;
  const uIndependants = r();
  const uMission = r();
  const uReticents = [r(), r(), r(), r()];
  const uInquiets = r();
  const uClient = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    semaines,
    scenario,
    uExperts,
    uIndependants,
    uMission,
    uReticents,
    uInquiets,
    uClient,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUE LES DÉCISIONS DÉCLENCHENT, SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** L'effort d'avant-vente en décarbonation, selon le cap de la semaine 1. */
export const effortCommercial = (cap: number) =>
  cap === 1 || cap === 2 ? 1 : cap === 0 ? 0.35 : 0.15;

/** Les semaines d'arrivée des experts recrutés (aucun, un ou deux). */
export function arriveesDesExperts(chemin: readonly number[], graine: number): number[] {
  const d = chemin[D.experts];
  const h = hasard(graine);
  const n = d === 0 ? 2 : d === 1 ? 1 : 0;
  return h.uExperts
    .slice(0, n)
    .map((u) => (u < 0.25 ? ARRIVEE_TARDIVE : ARRIVEE_EXPERTS))
    .sort((a, b) => a - b);
}

/** Freelancia propose ses deux indépendants pour la semaine 5, ou la semaine 7. */
export const arriveeDesIndependants = (graine: number) =>
  hasard(graine).uIndependants < 0.3 ? 7 : 5;

/** Combien de consultants partent en binôme, et à partir de quand. */
export function binomesPrevus(chemin: readonly number[]): number {
  const d = chemin[D.binomes];
  return d === 1 ? 4 : d === 2 ? 8 : 0;
}

/**
 * LE RISQUE QUE LA PREMIÈRE MISSION RATE.
 *
 * Un expert encadre deux binômes. Au-delà, chaque binôme de trop ajoute du
 * risque ; un indépendant qui ne connaît ni l'équipe ni le cabinet encadre
 * moins bien ; sans personne qui sache, deux auditeurs apprennent sur le dos
 * du client. Une bascule brutale et des réticents envoyés de force ajoutent
 * le leur.
 */
export function chanceDeRater(
  chemin: readonly number[],
  encadrants: { experts: number; independants: number },
  binomes: number,
): number {
  if (binomes === 0) return encadrants.experts + encadrants.independants > 0 ? 0.05 : 0;
  const places = encadrants.experts * 2 + encadrants.independants;
  let p: number;
  if (places === 0) p = 0.45;
  else {
    const base = encadrants.experts > 0 ? 0.1 : 0.18;
    p = base + 0.15 * Math.max(0, binomes / places - 1);
  }
  if (chemin[D.cap] === 2) p += 0.15;
  if (chemin[D.reticents] === 0) p += 0.1;
  return Math.min(0.7, p);
}

/** La chance qu'un réticent parte de lui-même, selon la manière dont on le traite. */
export function chanceDePartir(chemin: readonly number[], qui: number): number {
  const d = chemin[D.reticents];
  if (d === 0) return 0.4;
  if (d === 2) return 0.2;
  if (d === 1) return qui === 0 ? 0.05 : 0;
  return 0;
}

/** Les Conserveries signent la feuille de route plus souvent quand Atlas a des références. */
export const chanceQueLeClientSigne = (credibilite: number) => (credibilite >= 0.7 ? 0.6 : 0.3);

export type Semaine = {
  /** Jours facturés rapportés aux jours ouvrés des consultants de la practice. */
  occupation: number;
  /** Jours staffables sans mission, cumulés depuis le début du trimestre. */
  intercontrat: number;
  intercontratSemaine: number;
  /** Jours de décarbonation signés, restant à produire. */
  carnet: number;
  /** Experts présents et consultants en binôme : ceux qui font de la décarbonation. */
  enDecarbonation: number;
  experts: number;
  binomes: number;
  /** L'intercontrat attendu de décembre à février, en jours, avec ce qu'on sait en fin de semaine. */
  interSuivant: number;
  /** Le résultat cumulé de la practice : chiffre d'affaires moins salaires, frais et départs. */
  resultat: number;
  /** L'estimation de l'objectif : le résultat cumulé plus la valeur du trimestre suivant. */
  valeur: number;
  /** Jours d'audit en retard. */
  retard: number;
  credibilite: number;
  /** Jours signés dans la semaine. */
  signes: number;
  /** Jours de décarbonation produits dans la semaine. */
  produits: number;
  consultants: number;
};

export interface Depart {
  qui: string;
  semaine: number;
  cout: number;
  nature: "accompagne" | "subi" | "mobilite" | "plan";
}

export interface Projection {
  /** Le carnet de décarbonation et la moitié des signatures que le rythme promet. */
  carnetPondere: number;
  /** La marge de ce carnet, produite par l'équipe ou par des indépendants. */
  valeurCarnet: number;
  intercontrat: number;
  /** Consultants vendables seuls, en équivalent temps plein, sur décembre-février. */
  vendables: number;
  valeur: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  objectif: number;
  /** Le résultat du trimestre : chiffre d'affaires moins salaires, frais, indépendants et pénalités. */
  resultat: number;
  marge: number;
  /** Le coût des jours d'intercontrat du trimestre. */
  coutIntercontrat: number;
  intercontratJours: number;
  departs: readonly Depart[];
  coutDeparts: number;
  projection: Projection;
  scenario: Scenario;
  arrivees: readonly number[];
  independants: number | null;
  /** La semaine où la première mission rate, ou `null`. */
  missionRatee: number | null;
  clientSigne: boolean | null;
  occupationMoyenne: number;
  carnetFinal: number;
  produitsTotal: number;
  signesTotal: number;
  references: number;
  binomes: number;
  /** La semaine où les binômes commencent, et celle où ils deviennent vendables seuls. */
  debutBinomes: number | null;
  vendablesEn: number | null;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Les jours d'audit à produire dans une semaine, selon le plan de charge. */
export function auditsDeLaSemaine(w: number): number {
  const m = MOIS.find((x) => w >= x.de && w <= x.a)!;
  return AUDITS[m.mois] / (m.a - m.de + 1);
}

interface Etat {
  consultants: number;
  experts: number;
  independants: number;
  binomes: number;
  debutBinomes: number | null;
  apprentissage: number;
  carnet: number;
  retard: number;
  reportes: number;
  rythme: number;
  plan: number;
}

/**
 * LA VALEUR DU TRIMESTRE SUIVANT, estimée avec ce qu'on sait à une semaine
 * donnée : qui sera vendable, ce qui est signé, ce que le rythme promet.
 */
export function projeter(e: Etat): Projection {
  let carnetPondere = e.carnet + 0.5 * e.rythme * SEMAINES_SUIVANT;
  let frais = 0;
  let experts = e.experts;
  let joursExperts = experts * JOURS_SUIVANT;
  let formation = 0;
  let amo = AMO_SUIVANT;
  // Les binômes : la part du trimestre suivant où chacun est vendable seul.
  const vendableDes = e.debutBinomes === null ? null : e.debutBinomes + e.apprentissage;
  const part =
    vendableDes === null ? 0 : borne((SEMAINES + SEMAINES_SUIVANT + 1 - vendableDes) / 12, 0, 1);
  let factures = e.binomes * JOURS_SUIVANT * (part + (1 - part) * 0.5);
  let staffes = e.binomes * JOURS_SUIVANT;
  if (e.plan === 1) {
    // Une deuxième vague calée sur le carnet : un binôme par 100 jours signés, dans la limite de l'encadrement.
    // Les premiers binômes, presque autonomes, libèrent les experts pour une nouvelle vague.
    const places = experts * 2 + e.independants;
    const vague = Math.min(places, Math.floor(carnetPondere / 100), e.consultants - e.binomes);
    factures += vague * JOURS_SUIVANT * 0.5;
    staffes += vague * JOURS_SUIVANT;
  } else if (e.plan === 0) {
    // Tout basculer en janvier : dix jours de formation en salle pour chacun, l'AMO délaissée.
    const enSalle = e.consultants - e.binomes;
    formation = enSalle * 10;
    frais += enSalle * COUTS.certification;
    amo *= 0.75;
  } else if (e.plan === 3) {
    // Trois experts de plus, en poste à la mi-janvier.
    frais += 3 * COUTS.recrutementExpert;
    experts += 3;
    joursExperts += 3 * 36;
    carnetPondere += 0.3 * e.rythme * SEMAINES_SUIVANT;
  }
  // Le carnet se produit d'abord par les experts, puis par l'équipe ; le reste part chez des indépendants.
  const parExperts = Math.min(carnetPondere, joursExperts);
  const parEquipe = Math.min(carnetPondere - parExperts, factures);
  const parIndependants = carnetPondere - parExperts - parEquipe;
  const ratio = factures > 0 ? parEquipe / factures : 0;
  const staffesDecarbonation = staffes * ratio;
  const valeurCarnet =
    parExperts * TJM.decarbonation -
    joursExperts * COUT_JOUR_EXPERT +
    parEquipe * TJM.decarbonation -
    staffesDecarbonation * COUT_JOUR +
    parIndependants * (TJM.decarbonation - FREELANCE.expert);
  const audits = AUDITS_SUIVANT + e.reportes + e.retard;
  let libres = Math.max(
    0,
    e.consultants * JOURS_SUIVANT - audits - amo - staffesDecarbonation - formation,
  );
  // Planifier personne par personne : ceux qui restent sans mission sont prêtés à une autre practice.
  const pret = e.plan === 1 ? Math.min(libres, PRET_INTERNE.jours) : 0;
  libres -= pret;
  const vendables = experts + e.binomes * part;
  const valeur =
    valeurCarnet +
    e.retard * (TJM.audit - COUT_JOUR) +
    pret * (PRET_INTERNE.prix - COUT_JOUR) -
    (libres + formation) * COUT_JOUR -
    frais;
  return { carnetPondere, valeurCarnet, intercontrat: libres, vendables, valeur };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [cap, dExperts, dBinomes, dReticents, dCommande, dPlan] = chemin as number[];
  const arrivees = arriveesDesExperts(chemin, graine);
  const independantsDes = dExperts === 2 ? arriveeDesIndependants(graine) : null;
  const prevus = binomesPrevus(chemin);
  const effort = effortCommercial(cap!);

  // Les départs, tirés d'avance selon les choix.
  const departs: Depart[] = [];
  if (cap === 2 && h.uInquiets < 0.45) {
    departs.push({ qui: "un auditeur senior", semaine: 6, cout: COUTS.departSubi, nature: "subi" });
  }
  RETICENTS.forEach((p, i) => {
    if (dReticents === 1) {
      // Au cas par cas, chacun finit ses audits : départ et mobilité prennent effet au 1er décembre.
      if (p.id === "gwenola")
        departs.push({
          qui: p.nom,
          semaine: 14,
          cout: COUTS.departAccompagne,
          nature: "accompagne",
        });
      if (p.id === "esteban")
        departs.push({ qui: p.nom, semaine: 14, cout: 0, nature: "mobilite" });
    }
    if (dReticents === 3) {
      departs.push({ qui: p.nom, semaine: 10, cout: COUTS.planDeDepart, nature: "plan" });
      return;
    }
    if (h.uReticents[i]! < chanceDePartir(chemin, i)) {
      departs.push({ qui: p.nom, semaine: 9 + (i % 3), cout: COUTS.departSubi, nature: "subi" });
    }
  });
  if (dReticents === 3 && h.uInquiets < 0.35) {
    departs.push({
      qui: "une consultante qu'on voulait garder",
      semaine: 11,
      cout: COUTS.departSubi,
      nature: "subi",
    });
  }
  const inquieteEnBinome = dReticents === 3 && h.uInquiets < 0.35 && prevus > 0;
  // Niamh, rassurée au cas par cas, rejoint les binômes.
  const binomesTotal = prevus + (dReticents === 1 && prevus > 0 ? 1 : 0);

  const semaines: (Semaine | null)[] = [null];
  let carnet = 0;
  let retard = 0;
  let reportes = 0;
  let intercontratJours = 0;
  let coutIntercontrat = 0;
  let resultat = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let marge = resultat;
  let coutDeparts = 0;
  let produitsCumul = 0;
  let produitsIndependants = 0;
  let signesTotal = 0;
  let debutBinomes: number | null = null;
  let apprentissage = 0;
  let missionRatee: number | null = null;
  let debutProduction: number | null = null;
  let tirageRate = false;
  let clientSigne: boolean | null = null;
  let factureTotal = 0;
  let ouvresTotal = 0;
  let binomes = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = 0;
    let recette = 0;
    let fraisSemaine = 0;

    // Qui est là.
    const partis = departs.filter((x) => x.semaine <= w);
    for (const x of departs.filter((x) => x.semaine === w)) coutDeparts += x.cout;
    const consultants = CONSULTANTS - partis.length;
    const experts = arrivees.filter((a) => a <= w).length;
    for (const a of arrivees) if (a === w) fraisSemaine += COUTS.recrutementExpert;
    const independants = independantsDes !== null && w >= independantsDes ? 2 : 0;

    // Les binômes démarrent quand il y a quelqu'un pour les encadrer, pas avant la semaine 6.
    if (debutBinomes === null && binomesTotal > 0 && w >= 6) {
      const encadrants = experts + independants;
      if (encadrants > 0 || dExperts === 3) {
        debutBinomes = w;
        const places = experts * 2 + independants;
        const base =
          experts > 0
            ? APPRENTISSAGE.expert
            : independants > 0
              ? APPRENTISSAGE.independant
              : APPRENTISSAGE.seul;
        apprentissage =
          base + (places > 0 && binomesTotal > places * 1.5 ? APPRENTISSAGE.surcharge : 0);
      }
    }
    binomes = debutBinomes !== null ? binomesTotal - (inquieteEnBinome && w >= 11 ? 1 : 0) : 0;
    // La commande tardive acceptée en rappelant les binômes : quatre semaines sans apprendre.
    const rappeles =
      dCommande === 0 && w >= COMMANDE_TARDIVE.de && w <= COMMANDE_TARDIVE.a && binomes > 0;
    if (rappeles && w === COMMANDE_TARDIVE.de) apprentissage += APPRENTISSAGE.pause;
    const binomesActifs = rappeles ? 0 : binomes;

    // La crédibilité auprès des industriels : experts, indépendants, références, accidents.
    const references = Math.min(
      4,
      Math.floor((produitsCumul - produitsIndependants / 2) / MISSION),
    );
    let credibilite =
      CREDIBILITE.depart +
      CREDIBILITE.parExpert * experts +
      (independants > 0 ? CREDIBILITE.independants : 0) +
      CREDIBILITE.parReference * references +
      (dBinomes === 0 && w >= 10 ? CREDIBILITE.certification : 0) +
      (missionRatee !== null && w > missionRatee ? CREDIBILITE.missionRatee : 0);
    credibilite = borne(credibilite, 0.05, CREDIBILITE.plafond);

    // Les signatures de la semaine.
    let signes = 0;
    if (w >= 2) {
      signes = SIGNATURES * h.scenario.multiple * effort * credibilite * n.signatures;
      for (const a of actifs) signes *= a.imprevu.effet.signatures ?? 1;
    }
    if (dCommande === 1 && w === 11) {
      // Les Conserveries répondent à la proposition de feuille de route.
      const cred9 = semaines[9]!.credibilite;
      clientSigne = h.uClient < chanceQueLeClientSigne(cred9);
      if (clientSigne) signes += COMMANDE_TARDIVE.decarbonation;
    }
    signesTotal += signes;
    carnet += signes;

    // La production de décarbonation : experts, indépendants, binômes à mi-temps facturable.
    // Un expert encadre deux binômes, un indépendant un seul : au-delà, chaque binôme produit moins.
    const places = experts * 2 + independants;
    const encadrement =
      binomesActifs === 0 ? 1 : places > 0 ? Math.min(1, places / binomesActifs) : 0.5;
    const capaciteDecarbonation =
      JOURS_STAFFABLES * experts +
      JOURS_STAFFABLES * independants +
      2 * encadrement * binomesActifs;
    const produits = Math.min(carnet, capaciteDecarbonation);
    const taux = capaciteDecarbonation > 0 ? produits / capaciteDecarbonation : 0;
    carnet -= produits;
    if (produits > 0 && debutProduction === null) debutProduction = w;
    produitsCumul += produits;
    const parIndependants = capaciteDecarbonation > 0 ? JOURS_STAFFABLES * independants * taux : 0;
    produitsIndependants += parIndependants;
    recette += produits * TJM.decarbonation;
    cout += parIndependants * FREELANCE.expert;
    const expertsOisifs = JOURS_STAFFABLES * experts * (1 - taux);
    const staffesBinomes = JOURS_STAFFABLES * binomesActifs * taux;

    // La première mission passe son premier comité de pilotage quatre semaines après son début.
    if (!tirageRate && debutProduction !== null && w === debutProduction + 4) {
      tirageRate = true;
      const p = chanceDeRater(chemin, { experts, independants }, binomesActifs > 0 ? binomes : 0);
      if (h.uMission < p) {
        missionRatee = w;
        cout += COUTS.avoir;
        carnet = Math.max(0, carnet - 30);
      }
    }

    // L'équipe : ce qu'elle a à faire, et ce qui reste sans mission.
    let capacite = consultants * JOURS_STAFFABLES;
    for (const a of actifs) {
      capacite -= a.imprevu.effet.absence ?? 0;
      capacite *= a.imprevu.effet.capacite ?? 1;
    }
    let formation = 0;
    if (cap === 2 && w >= 3 && w <= 8) formation += 20;
    if (dBinomes === 0 && w >= 6 && w <= 9) formation += (CONSULTANTS * 5) / 4;
    if (dBinomes === 0 && w === 6) fraisSemaine += CONSULTANTS * COUTS.certification;
    let reprise = 0;
    for (const a of actifs) if (w === a.semaine) reprise += a.imprevu.effet.reprise ?? 0;
    let audits = auditsDeLaSemaine(w) * n.audits;
    // Annoncer la bascule inquiète les clients d'audit : un sur dix part finir chez Kéroual Consulting.
    if (cap === 2 && w >= 5) audits *= 0.9;
    let report = 0;
    for (const a of actifs) report += a.imprevu.effet.report ?? 0;
    audits -= report;
    reportes += report;
    let tardifs = 0;
    if (cap === 0 && w >= 4) tardifs += 5;
    const commandeIci =
      (dCommande === 0 || dCommande === 1) && w >= COMMANDE_TARDIVE.de && w <= COMMANDE_TARDIVE.a;
    if (commandeIci) tardifs += COMMANDE_TARDIVE.jours / 4;
    if (dCommande === 2 && w >= COMMANDE_TARDIVE.de && w <= COMMANDE_TARDIVE.a) {
      const j = COMMANDE_TARDIVE.jours / 4;
      recette += j * TJM.auditTardif;
      cout += j * FREELANCE.auditeur;
    }
    const amo = AMO_SEMAINE * n.amo;
    // Priorités : la formation et les binômes sont planifiés ; puis l'AMO ; puis les audits.
    let reste = Math.max(0, capacite - formation - staffesBinomes - reprise);
    const amoFaite = Math.min(reste, amo);
    reste -= amoFaite;
    const aAuditer = audits + tardifs + retard;
    const auditsFaits = Math.min(reste, aAuditer);
    reste -= auditsFaits;
    retard = aAuditer - auditsFaits;
    // Les audits faits sont d'abord les plus anciens ; les tardifs sont au tarif remisé.
    const partTardive = aAuditer > 0 ? tardifs / aAuditer : 0;
    recette +=
      amoFaite * TJM.amo +
      auditsFaits * (1 - partTardive) * TJM.audit +
      auditsFaits * partTardive * TJM.auditTardif;
    cout += retard * COUTS.penaliteParJour;
    const oisifs = reste;
    intercontratJours += oisifs;
    const coutOisifs = oisifs * COUT_JOUR + expertsOisifs * COUT_JOUR_EXPERT;
    coutIntercontrat += coutOisifs;

    // Les salaires : toute l'équipe, toute la semaine.
    const salaires = consultants * 5 * COUT_JOUR + experts * 5 * COUT_JOUR_EXPERT;
    cout += salaires + fraisSemaine;
    const net = recette - cout;
    resultat += net;
    marge += net + coutOisifs;

    const factures = amoFaite + auditsFaits + staffesBinomes * 0.5;
    const ouvres = consultants * 5;
    factureTotal += factures;
    ouvresTotal += ouvres;

    const rythme = SIGNATURES * h.scenario.multiple * effort * credibilite * (w >= 2 ? 1 : 0);
    const proj = projeter({
      consultants,
      experts,
      independants,
      binomes,
      debutBinomes,
      apprentissage,
      carnet,
      retard,
      reportes,
      rythme,
      plan: w >= 11 ? dPlan! : 2,
    });
    semaines.push({
      occupation: factures / ouvres,
      intercontrat: intercontratJours,
      intercontratSemaine: oisifs,
      carnet,
      enDecarbonation: experts + independants + binomes,
      experts,
      binomes,
      interSuivant: proj.intercontrat,
      resultat: resultat - coutDeparts,
      valeur: resultat - coutDeparts + proj.valeur,
      retard,
      credibilite,
      signes,
      produits,
      consultants,
    });
  }

  const fin = semaines[SEMAINES]!;
  // Ceux qui partent au 1er décembre : le départ se paie au trimestre, leur temps n'est plus à occuper ensuite.
  const auPremierDecembre = departs.filter((x) => x.semaine > SEMAINES);
  for (const x of auPremierDecembre) coutDeparts += x.cout;
  // Tout basculer en janvier inquiète : un consultant senior annonce son départ.
  if (dPlan === 0 && h.uInquiets < 0.4) {
    departs.push({
      qui: "un consultant senior",
      semaine: 13,
      cout: COUTS.departSubi,
      nature: "subi",
    });
    coutDeparts += COUTS.departSubi;
  }
  const projection = projeter({
    consultants: fin.consultants - auPremierDecembre.length,
    experts: fin.experts,
    independants: independantsDes !== null ? 2 : 0,
    binomes: fin.binomes,
    debutBinomes,
    apprentissage,
    carnet: fin.carnet,
    retard: fin.retard,
    reportes,
    rythme: SIGNATURES * h.scenario.multiple * effort * fin.credibilite,
    plan: dPlan!,
  });
  return {
    semaines,
    objectif: resultat - coutDeparts + projection.valeur,
    resultat,
    marge,
    coutIntercontrat,
    intercontratJours,
    departs,
    coutDeparts,
    projection,
    scenario: h.scenario,
    arrivees,
    independants: independantsDes,
    missionRatee,
    clientSigne,
    occupationMoyenne: factureTotal / ouvresTotal,
    carnetFinal: fin.carnet,
    produitsTotal: produitsCumul,
    signesTotal,
    references: Math.min(4, Math.floor((produitsCumul - produitsIndependants / 2) / MISSION)),
    binomes: fin.binomes,
    debutBinomes,
    vendablesEn: debutBinomes === null ? null : debutBinomes + apprentissage,
  };
}

/** Ce qui s'est passé pendant des semaines : arrivées, départs, mission, réponse du client, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    arrivees: t.arrivees.filter(dans),
    independants: t.independants !== null && dans(t.independants) ? t.independants : null,
    debutBinomes: t.debutBinomes !== null && dans(t.debutBinomes) ? t.debutBinomes : null,
    missionRatee: t.missionRatee !== null && dans(t.missionRatee) ? t.missionRatee : null,
    /** Le premier comité de pilotage passé sans encombre. */
    missionReussie: t.missionRatee === null && t.produitsTotal > 0 && dans(11),
    departs: t.departs.filter((x) => x.nature === "subi" && dans(Math.min(x.semaine, SEMAINES))),
    clientSigne: t.clientSigne !== null && dans(11) ? t.clientSigne : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePractice {
  occupation: number | null;
  intercontrat: number | null;
  carnet: number | null;
  enDecarbonation: number | null;
  interSuivant: number | null;
  credibilite: number | null;
  retard: number | null;
  consultants: number | null;
  experts: number | null;
  binomes: number | null;
  resultat: number | null;
  valeur: number | null;
  signes: number | null;
}

/** Ce qu'Abel lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePractice {
  if (semaine === 0) {
    return {
      occupation: OCCUPATION_CIBLE,
      intercontrat: 0,
      carnet: 0,
      enDecarbonation: 0,
      // L'intercontrat de décembre à février : c'est ce que la prévision demande d'estimer.
      interSuivant: null,
      credibilite: CREDIBILITE.depart,
      retard: 0,
      consultants: CONSULTANTS,
      experts: 0,
      binomes: 0,
      resultat: 0,
      valeur: null,
      signes: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    occupation: s.occupation,
    intercontrat: s.intercontrat,
    carnet: s.carnet,
    enDecarbonation: s.enDecarbonation,
    interSuivant: s.interSuivant,
    credibilite: s.credibilite,
    retard: s.retard,
    consultants: s.consultants,
    experts: s.experts,
    binomes: s.binomes,
    resultat: s.resultat,
    valeur: s.valeur,
    signes: s.signes,
  };
}
