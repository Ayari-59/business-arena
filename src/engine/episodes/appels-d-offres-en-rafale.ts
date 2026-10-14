/**
 * LES APPELS D'OFFRES EN RAFALE — le modèle de la practice Organisation et transformation, à Rennes.
 *
 * Janvier : les budgets publics viennent d'être votés, et douze consultations
 * tombent en six semaines sur la practice de Florimond Vannier. L'équipe ne
 * peut pas toutes les faire bien. Treize semaines, six décisions. Quatre
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · ON GAGNE SUR LA NOTE, ET LA NOTE SE FAIT AVEC DES SENIORS. Chaque
 *     marché va à l'offre la mieux notée : la valeur technique (le mémoire)
 *     et le prix, pondérés par le règlement de consultation. La note
 *     technique tient à l'avantage du cabinet (des références, un client qui
 *     nous connaît, un rédacteur du cahier des charges rencontré en amont) et
 *     à la qualité de la réponse : un manager ou un associé qui pilote le
 *     mémoire vaut six points sur soixante. Au-delà de six réponses menées de
 *     front, les seniors relisent tout trop vite, et chaque mémoire perd de
 *     sa note : répondre à tout dilue la qualité de tout.
 *   · LE TEMPS NE SE STOCKE PAS, ET IL N'EST PAS GRATUIT. Une réponse coûte
 *     des jours de seniors et de consultants, valorisés à leur coût
 *     journalier. Au-delà du temps commercial des seniors et de
 *     l'intercontrat des consultants, chaque jour est pris sur une mission
 *     facturable : il coûte le TJM qu'on ne facture pas, et une mission
 *     privée de ses seniors finit par glisser.
 *   · LE PRIX NE PÈSE QUE CE QUE LA GRILLE LUI DONNE. La note prix vaut
 *     40 × (prix le plus bas / prix du candidat) : quinze pour cent de remise
 *     rattrapent au mieux six points, et retirent plus d'un tiers de la marge
 *     du marché sur toute sa durée. Quand la technique pèse 60 %, le prix ne
 *     suffit pas.
 *   · UN MARCHÉ PEUT ÊTRE ÉCRIT POUR UN AUTRE. Le cahier des charges de
 *     Vilaine Métropole reprend la méthode du sortant, Kéroual Consulting,
 *     et exige des références que lui seul a : on ne le gagne pas, quel que
 *     soit le mémoire. Le décliner et rencontrer le nouveau directeur général
 *     des services, en revanche, donne l'avantage sur la consultation
 *     suivante.
 *
 * L'OBJECTIF, en euros : la marge des marchés gagnés sur toute leur durée,
 * au prix proposé (le chiffre d'affaires moins le coût des jours produits),
 * moins le coût des réponses : jours d'avant-vente à leur coût journalier,
 * TJM perdu sur les jours pris aux missions facturables, indépendants
 * payés, pénalités d'une mission qui glisse. Toutes les attributions tombent
 * avant la fin de la semaine 13.
 *
 * LE HASARD : la note de l'offre concurrente la mieux placée sur chaque
 * marché (son mémoire, son prix), un niveau commun de la concurrence sur le
 * trimestre, le prix de Halden à Kermelin, la réponse de l'acheteur de la
 * Métropole à une question écrite, la mission qui glisse, et les imprévus.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Cabinet, acheteurs, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un DCE reste sans pilote, la date des questions écrites passe. */
export const PERTE_PAR_JOUR = 2000;
/** La marge nette que la direction attend des marchés publics du trimestre, coût des réponses déduit. */
export const OBJECTIF = 150000;

/** Le coût journalier chargé d'un jour d'avant-vente, tel que le contrôle de gestion l'impute. */
export const COUT_JOUR = { senior: 720, consultant: 380 } as const;
/** Le TJM moyen des jours qu'on prend aux missions facturables : ce qu'on ne facture pas. */
export const TJM = { senior: 1150, consultant: 750 } as const;
/** Le TJM moyen de la practice sur ses marchés publics. */
export const TJM_PUBLIC = 820;
/** Un jour produit sur un marché : un quart de seniors, trois quarts de consultants. */
export const COUT_PRODUIT = 0.25 * COUT_JOUR.senior + 0.75 * COUT_JOUR.consultant;
/** Le coût d'un jour produit rapporté au TJM : la marge d'un marché vaut montant × (prix − ce ratio). */
export const RATIO_COUT = COUT_PRODUIT / TJM_PUBLIC;
/** Une équipe plus junior : un dixième de seniors, des analystes à 330 € par jour. */
export const RATIO_COUT_JUNIOR = (0.1 * COUT_JOUR.senior + 0.9 * 330) / TJM_PUBLIC;
/** La marge d'un marché au prix habituel, en part de son montant. */
export const TAUX_DE_MARGE = 1 - RATIO_COUT;

/**
 * Ce que la practice peut donner aux réponses sans toucher aux missions : le
 * temps commercial des quatre seniors (Florimond, Goulven, Katell, Sefora)
 * d'ici la semaine 11, et l'intercontrat des consultants.
 */
export const CAPACITE = { senior: 30, consultant: 60 } as const;

/** La note technique d'un mémoire type, sans aucun avantage, rapportée à la note maximale. */
export const QUALITE_DE_BASE = 0.5;
export const AVANTAGE = { reference: 0.06, connu: 0.05, amont: 0.08 } as const;
export const REDACTION = { type: 0, pilote: 0.1, freelance: 0.04, groupement: 0.2 } as const;
/** Au-delà de six réponses menées de front, chaque réponse de plus retire cela à chaque mémoire. */
export const DILUTION = 0.012;
export const REPONSES_SANS_DILUTION = 6;
/** Deux jours d'associé de plus sur le mémoire de Kermelin. */
export const RENFORT = 0.07;
/** Une équipe plus junior se lit dans le mémoire : CV, encadrement. */
export const EQUIPE_JUNIOR = -0.08;
/** Un mémoire repris sur les sous-critères que les rapports d'analyse disent perdus. */
export const REPRISE = 0.07;

/** Les prix, rapportés au prix habituel de la practice. */
export const PRIX = { serre: 0.88, aligne: 0.85, junior: 0.82, baisseFinale: 0.9 } as const;

/** Les jours d'une réponse, selon qui l'écrit. */
export const JOURS = {
  type: { senior: 1, consultant: 5, cash: 0 },
  pilote: { senior: 4, consultant: 6, cash: 0 },
  freelance: { senior: 1, consultant: 0, cash: 2800 },
  fond: { senior: 8, consultant: 12, cash: 0 },
  groupement: { senior: 3, consultant: 3, cash: 0 },
} as const;
export type Redaction = keyof typeof JOURS;
export const RENDEZ_VOUS = 1;
export const QUESTION = 0.5;
export const JOURS_RENFORT = 2;
export const JOURS_REPRISE = { senior: 1.5, consultant: 1 } as const;
/** Ce que le niveau commun de la concurrence ajoute à toutes les offres concurrentes, par écart réduit. */
export const NIVEAU_COMMUN = 0.08;
/** Un recours en référé précontractuel : l'avocat, et deux jours d'associé. */
export const REFERE = { avocat: 6000, senior: 2, semaine: 10 } as const;
/** Le partage d'un groupement avec Penhors Études : moitié du montant, moitié de la marge. */
export const PART_GROUPEMENT = 0.5;

/** La mission privée qui glisse quand on lui prend ses gens. */
export const GLISSEMENT = { semaine: 9, parJour: 0.05, plafond: 0.8, cout: 15000 } as const;
/** La chance que l'acheteur de la Métropole élargisse le critère des références. */
export const CHANCE_ELARGI = 0.35;
/** La chance que Halden casse ses prix à Kermelin. */
export const CHANCE_HALDEN = 0.6;

/** Ce que la practice a fait l'an dernier, tel que Tempora le restitue. */
export const AN_DERNIER = {
  reponses: 19,
  gagnes: 4,
  seniors: 64,
  consultants: 148,
  pilotees: 7,
  gagneesPilotees: 3,
} as const;
/** Le coût d'avant-vente d'un marché gagné l'an dernier, en euros : la prévision de la semaine 1. */
export const COUT_D_UN_MARCHE_GAGNE =
  (AN_DERNIER.seniors * COUT_JOUR.senior + AN_DERNIER.consultants * COUT_JOUR.consultant) /
  AN_DERNIER.gagnes;

export interface Marche {
  id: string;
  acheteur: string;
  /** Le nom court, pour les tableaux. */
  court: string;
  objet: string;
  montant: number;
  /** Le poids de la valeur technique dans la note ; le reste est le prix. */
  technique: number;
  reference: boolean;
  connu: boolean;
  amont: boolean;
  /** L'offre concurrente la plus à craindre. */
  concurrent: string;
  /** La note technique moyenne de cette offre, rapportée à la note maximale. */
  niveau: number;
  /** Son prix, rapporté au nôtre : entre ces deux bornes. */
  prixConcurrent: readonly [number, number];
  publication: number;
  remise: number;
  attribution: number;
}

export const MARCHES: readonly Marche[] = [
  {
    id: "kermelin",
    acheteur: "Centre hospitalier de Kermelin",
    court: "CH de Kermelin",
    objet: "réorganisation des admissions et des circuits administratifs",
    montant: 280000,
    technique: 0.6,
    reference: true,
    connu: true,
    amont: false,
    concurrent: "Halden Partners",
    niveau: 0.66,
    prixConcurrent: [0.86, 1],
    publication: 1,
    remise: 7,
    attribution: 10,
  },
  {
    id: "pontcallec",
    acheteur: "CCAS de Pontcallec",
    court: "CCAS de Pontcallec",
    objet: "schéma d'organisation de l'action sociale",
    montant: 110000,
    technique: 0.6,
    reference: true,
    connu: false,
    amont: true,
    concurrent: "Lizen Conseil",
    niveau: 0.67,
    prixConcurrent: [0.86, 1.02],
    publication: 1,
    remise: 5,
    attribution: 8,
  },
  {
    id: "sdis",
    acheteur: "SDIS d'Armor-Vilaine",
    court: "SDIS",
    objet: "organisation des gardes et qualité de vie au travail",
    montant: 160000,
    technique: 0.6,
    reference: true,
    connu: true,
    amont: true,
    concurrent: "Kéroual Consulting",
    niveau: 0.7,
    prixConcurrent: [0.88, 1.02],
    publication: 2,
    remise: 6,
    attribution: 9,
  },
  {
    id: "argoat",
    acheteur: "Agglomération Argoat-Lié",
    court: "Argoat-Lié",
    objet: "mutualisation des services de la ville-centre et de l'agglomération",
    montant: 190000,
    technique: 0.6,
    reference: true,
    connu: false,
    amont: true,
    concurrent: "Kéroual Consulting",
    niveau: 0.7,
    prixConcurrent: [0.88, 1.02],
    publication: 3,
    remise: 11,
    attribution: 13,
  },
  {
    id: "keravel",
    acheteur: "Office public de l'habitat Ker Avel",
    court: "OPH Ker Avel",
    objet: "réorganisation de la gestion locative de proximité",
    montant: 130000,
    technique: 0.6,
    reference: true,
    connu: true,
    amont: false,
    concurrent: "Lizen Conseil",
    niveau: 0.68,
    prixConcurrent: [0.86, 1.02],
    publication: 4,
    remise: 11,
    attribution: 13,
  },
  {
    id: "metropole",
    acheteur: "Vilaine Métropole",
    court: "Vilaine Métropole",
    objet: "accompagnement de la fusion de six directions",
    montant: 420000,
    technique: 0.6,
    reference: false,
    connu: false,
    amont: false,
    concurrent: "Kéroual Consulting",
    niveau: 0.84,
    prixConcurrent: [0.92, 1.04],
    publication: 2,
    remise: 6,
    attribution: 9,
  },
  {
    id: "departement",
    acheteur: "Département d'Armor-Vilaine",
    court: "Département",
    objet: "évaluation de la politique départementale de la jeunesse",
    montant: 240000,
    technique: 0.6,
    reference: false,
    connu: false,
    amont: false,
    concurrent: "Morgat Évaluation",
    niveau: 0.7,
    prixConcurrent: [0.86, 1],
    publication: 1,
    remise: 5,
    attribution: 8,
  },
  {
    id: "mdph",
    acheteur: "MDPH d'Armor-Vilaine",
    court: "MDPH",
    objet: "réduction des délais de traitement des demandes",
    montant: 90000,
    technique: 0.5,
    reference: true,
    connu: false,
    amont: false,
    concurrent: "Lizen Conseil",
    niveau: 0.6,
    prixConcurrent: [0.78, 0.92],
    publication: 2,
    remise: 5,
    attribution: 8,
  },
  {
    id: "eaux",
    acheteur: "Syndicat des eaux du Blavet-Scorff",
    court: "Syndicat des eaux",
    objet: "schéma directeur des systèmes d'information",
    montant: 150000,
    technique: 0.6,
    reference: false,
    connu: false,
    amont: false,
    concurrent: "Numéricor",
    niveau: 0.68,
    prixConcurrent: [0.86, 1.02],
    publication: 3,
    remise: 7,
    attribution: 10,
  },
  {
    id: "saintkerlan",
    acheteur: "Ville de Saint-Kerlan",
    court: "Saint-Kerlan",
    objet: "audit organisationnel des services techniques",
    montant: 70000,
    technique: 0.5,
    reference: true,
    connu: false,
    amont: false,
    concurrent: "Lizen Conseil",
    niveau: 0.6,
    prixConcurrent: [0.8, 0.96],
    publication: 5,
    remise: 9,
    attribution: 12,
  },
  {
    id: "kerhuel",
    acheteur: "Syndicat mixte du port de Kerhuel",
    court: "Port de Kerhuel",
    objet: "plan stratégique du port à dix ans",
    montant: 120000,
    technique: 0.6,
    reference: false,
    connu: false,
    amont: false,
    concurrent: "Halden Partners",
    niveau: 0.66,
    prixConcurrent: [0.86, 1.02],
    publication: 5,
    remise: 11,
    attribution: 13,
  },
  {
    id: "ght",
    acheteur: "GHT Rance-Argoat",
    court: "GHT Rance-Argoat",
    objet: "accompagnement de la direction commune des quatre hôpitaux",
    montant: 260000,
    technique: 0.6,
    reference: true,
    connu: false,
    amont: false,
    concurrent: "Halden Partners",
    niveau: 0.72,
    prixConcurrent: [0.86, 1],
    publication: 6,
    remise: 11,
    attribution: 13,
  },
  {
    // Le treizième : une procédure adaptée de la Métropole, publiée en semaine 7.
    id: "dechets",
    acheteur: "Vilaine Métropole",
    court: "Métropole, collecte des déchets",
    objet: "diagnostic de l'organisation de la direction de la collecte des déchets",
    montant: 110000,
    technique: 0.6,
    reference: true,
    connu: false,
    amont: false,
    concurrent: "Kéroual Consulting",
    niveau: 0.7,
    prixConcurrent: [0.88, 1.02],
    publication: 7,
    remise: 10,
    attribution: 12,
  },
];

export const marche = (id: string) => MARCHES.find((m) => m.id === id)!;
/** Les douze consultations du début d'année, sans le treizième. */
export const DOUZE = MARCHES.filter((m) => m.id !== "dechets");
export const MONTANT_DES_DOUZE = DOUZE.reduce((s, m) => s + m.montant, 0);

/** Les décisions, par leur place dans le chemin. */
export const D = {
  selection: 0,
  metropole: 1,
  redaction: 2,
  prix: 3,
  treizieme: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision : répondre au fil de l'eau, comme l'an dernier. */
export const NEUTRE = [3, 2, 0, 2, 2, 2] as const;

/**
 * Ce que chaque option de la semaine 1 retient parmi les onze consultations
 * autres que la Métropole, dont le sort se décide en semaine 2.
 */
export const SELECTIONS: readonly (readonly string[])[] = [
  DOUZE.filter((m) => m.id !== "metropole").map((m) => m.id),
  ["kermelin", "pontcallec", "sdis", "argoat", "keravel"],
  ["kermelin", "ght", "departement", "argoat", "sdis"],
  ["kermelin", "pontcallec", "departement", "sdis", "mdph", "argoat", "eaux"],
];

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce que le trimestre perd de temps commercial des seniors et d'intercontrat. */
  effet: { senior?: number; consultant?: number; sansSuite?: boolean; rectificatif?: boolean };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "arret",
    titre: "Katell en arrêt deux semaines",
    de: "Ressources humaines",
    role: "Siège, Nantes",
    texte:
      "Katell Jaouen est en arrêt maladie pour deux semaines. Ses comités de pilotage retombent sur Goulven et Sefora : six jours de temps commercial en moins pour les seniors.",
    effet: { senior: 6 },
  },
  {
    id: "urgence",
    titre: "Une mission privée signée en urgence",
    de: "Fortunée Trévidic",
    role: "Associée, Performance opérationnelle, Nantes",
    texte:
      "Un industriel de Lorient signe une mission de six semaines qui démarre lundi. Je te prends trois consultants de Rennes en intercontrat : quinze jours de moins pour tes réponses.",
    effet: { consultant: 15 },
  },
  {
    id: "grippe",
    titre: "La grippe au bureau de Rennes",
    de: "Ressources humaines",
    role: "Siège, Nantes",
    texte:
      "La grippe touche le bureau de Rennes : quatre consultants et un manager absents quelques jours. Deux jours de seniors et huit de consultants en moins.",
    effet: { senior: 2, consultant: 8 },
  },
  {
    id: "sansSuite",
    titre: "Une procédure déclarée sans suite",
    de: "Sterenn Le Scao",
    role: "Responsable des propositions",
    texte: "",
    effet: { sansSuite: true },
  },
  {
    id: "rectificatif",
    titre: "Un dossier de consultation modifié",
    de: "Sterenn Le Scao",
    role: "Responsable des propositions",
    texte: "",
    effet: { rectificatif: true },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
  /** Le marché que vise l'imprévu, s'il en vise un. */
  marche: string | null;
}

export interface Hasard {
  /** Par marché : l'écart de la meilleure offre concurrente à sa note technique moyenne, et son prix. */
  concurrence: Readonly<Record<string, { technique: number; prix: number }>>;
  /** Le niveau commun de la concurrence ce trimestre, en écart réduit. */
  niveau: number;
  /** Halden casse-t-il ses prix à Kermelin ? */
  uHalden: number;
  /** L'acheteur de la Métropole élargit-il le critère des références ? */
  uElargi: number;
  /** La mission privée glisse-t-elle ? */
  uGlissement: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000651 + 7);
  const concurrence: Record<string, { technique: number; prix: number }> = {};
  for (const m of MARCHES) {
    const technique = borne(0.06 * gauss(r), -0.15, 0.15);
    const u = r();
    concurrence[m.id] = {
      technique,
      prix: m.prixConcurrent[0] + u * (m.prixConcurrent[1] - m.prixConcurrent[0]),
    };
  }
  const niveau = borne(gauss(r), -2.5, 2.5);
  const uHalden = r();
  const prixHalden = borne(0.015 * gauss(r), -0.03, 0.03);
  // Le prix de Halden à Kermelin : 15 % sous le nôtre s'il casse ses prix, 3 % sinon.
  concurrence.kermelin = {
    technique: concurrence.kermelin!.technique,
    prix: (uHalden < CHANCE_HALDEN ? 0.85 : 0.97) + prixHalden,
  };
  const uElargi = r();
  const uGlissement = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    const semaine = 2 + Math.floor(r() * 10);
    const u = r();
    let cible: string | null = null;
    if (imprevu.effet.sansSuite || imprevu.effet.rectificatif) {
      // Une consultation des douze, hors la Métropole : remise mais pas encore attribuée pour une
      // procédure sans suite, encore ouverte pour un dossier modifié.
      const ouverts = DOUZE.filter(
        (m) =>
          m.id !== "metropole" &&
          (imprevu.effet.sansSuite
            ? m.remise < semaine && m.attribution > semaine
            : m.publication <= semaine && m.remise > semaine),
      );
      cible = ouverts.length ? ouverts[Math.floor(u * ouverts.length)]!.id : null;
    }
    imprevus.push({ imprevu, semaine, marche: cible });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { concurrence, niveau, uHalden, uElargi, uGlissement, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Halden a-t-il cassé ses prix à Kermelin ? */
export const haldenAgressif = (graine: number) => hasard(graine).uHalden < CHANCE_HALDEN;
/** L'acheteur de la Métropole élargit le critère des références, si on le lui demande. */
export const critereElargi = (graine: number) => hasard(graine).uElargi < CHANCE_ELARGI;
/** La chance qu'une mission privée de ses gens glisse : 5 % par jour pris, au plus 80 %. */
export const chanceDeGlissement = (joursPris: number) =>
  Math.min(GLISSEMENT.plafond, GLISSEMENT.parJour * joursPris);

/* ---------------------------------------------------------------------------
 * LES RÉPONSES : qui répond à quoi, comment, et à quel prix.
 * ------------------------------------------------------------------------- */

/** Les jours d'une réponse, semaine par semaine. */
interface Charge {
  senior: number;
  consultant: number;
  cash: number;
}

export interface Reponse {
  marche: Marche;
  redaction: Redaction;
  /** Le prix proposé, rapporté au prix habituel. */
  prix: number;
  /** Ce que la réponse ajoute ou retire à la qualité du mémoire, hors avantage et rédaction. */
  bonus: number;
  amont: boolean;
  /** La part du marché et de la marge qui revient au cabinet. */
  part: number;
  ratioCout: number;
  charge: (Charge | null)[];
}

const vide = (): (Charge | null)[] =>
  Array.from({ length: SEMAINES + 1 }, (_, w) =>
    w === 0 ? null : { senior: 0, consultant: 0, cash: 0 },
  );

/** Répartit des jours sur des semaines, également. */
function etaler(charge: (Charge | null)[], de: number, a: number, jours: Partial<Charge>) {
  const n = a - de + 1;
  if (n <= 0) return;
  for (let w = de; w <= a; w += 1) {
    const c = charge[w]!;
    c.senior += (jours.senior ?? 0) / n;
    c.consultant += (jours.consultant ?? 0) / n;
    c.cash += (jours.cash ?? 0) / n;
  }
}

/** Les deux plus gros marchés d'une sélection : ceux qu'on pilote quand on ne pilote pas tout. */
const deuxPlusGros = (ids: readonly string[]) =>
  [...ids]
    .map(marche)
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 2)
    .map((m) => m.id);

/** Ce que l'option de la semaine 3 fait écrire, pour un marché de la sélection. */
function redactionDe(d3: number, id: string, selection: readonly string[]): Redaction {
  if (d3 === 1) return "pilote";
  if (d3 === 2) return "freelance";
  if (d3 === 3) return deuxPlusGros(selection).includes(id) ? "pilote" : "type";
  return "type";
}

/** Les réponses que le chemin fait remettre, avec leurs jours semaine par semaine. */
export function reponses(chemin: readonly number[], graine: number): Reponse[] {
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const h = hasard(graine);
  const selection = SELECTIONS[d1!]!;
  const prixDeBase = d1 === 0 ? PRIX.serre : 1;
  const liste: Reponse[] = [];

  // Les consultations retenues en semaine 1 : un mémoire type jusqu'à la semaine 3, puis ce que décide la semaine 3.
  for (const id of selection) {
    const m = marche(id);
    const red = redactionDe(d3!, id, selection);
    const charge = vide();
    const n = m.remise - m.publication + 1;
    const avant = Math.max(0, Math.min(3, m.remise) - m.publication + 1);
    etaler(charge, m.publication, Math.min(3, m.remise), {
      senior: (JOURS.type.senior * avant) / n,
      consultant: (JOURS.type.consultant * avant) / n,
    });
    const depuis = Math.max(4, m.publication);
    etaler(charge, depuis, m.remise, {
      senior: Math.max(0, JOURS[red].senior - (JOURS.type.senior * avant) / n),
      consultant: Math.max(0, JOURS[red].consultant - (JOURS.type.consultant * avant) / n),
      cash: JOURS[red].cash,
    });
    let prix = prixDeBase;
    let bonus = 0;
    let ratioCout = RATIO_COUT;
    if (id === "kermelin") {
      if (d4 === 0) prix = PRIX.aligne;
      if (d4 === 1) {
        bonus += RENFORT;
        etaler(charge, 6, 7, { senior: JOURS_RENFORT });
      }
      if (d4 === 3) {
        prix = PRIX.junior;
        bonus += EQUIPE_JUNIOR;
        ratioCout = RATIO_COUT_JUNIOR;
      }
    }
    // Un dossier modifié par l'acheteur : une partie de la réponse est à reprendre.
    const rect = h.imprevus.find((i) => i.imprevu.effet.rectificatif && i.marche === id);
    if (rect && rect.semaine < m.remise) {
      etaler(charge, rect.semaine + 1, m.remise, { senior: 1, consultant: 3 });
    }
    liste.push({
      marche: m,
      redaction: red,
      prix,
      bonus,
      amont: m.amont,
      part: 1,
      ratioCout,
      charge,
    });
  }

  // Vilaine Métropole : à fond, en mémoire type, ou à fond si la question écrite fait élargir le critère.
  const met = marche("metropole");
  const elargi = d2 === 3 && critereElargi(graine);
  if (d2 === 0 || d2 === 2 || elargi) {
    const red: Redaction = d2 === 2 ? "type" : "fond";
    const charge = vide();
    etaler(charge, elargi ? 4 : 3, met.remise, JOURS[red]);
    liste.push({
      marche: met,
      redaction: red,
      prix: prixDeBase,
      bonus: 0,
      amont: false,
      part: 1,
      ratioCout: RATIO_COUT,
      charge,
    });
  }

  // Le treizième : la consultation de la Métropole sur la collecte des déchets.
  if (d5 !== 2) {
    const m = marche("dechets");
    const red: Redaction = d5 === 0 ? "type" : d5 === 1 ? "pilote" : "groupement";
    const charge = vide();
    etaler(charge, 8, m.remise, JOURS[red]);
    liste.push({
      marche: m,
      redaction: red,
      prix: prixDeBase,
      bonus: 0,
      amont: d2 === 1,
      part: d5 === 3 ? PART_GROUPEMENT : 1,
      ratioCout: RATIO_COUT,
      charge,
    });
  }

  // La fin du trimestre : les réponses à remettre en semaine 11.
  for (const r of liste) {
    if (r.marche.remise !== 11) continue;
    if (d6 === 0) r.prix *= PRIX.baisseFinale;
    if (d6 === 1) {
      r.bonus += REPRISE;
      etaler(r.charge, 10, 11, JOURS_REPRISE);
    }
  }
  return liste;
}

/** La qualité d'un mémoire, rapportée à la note technique maximale. */
export function qualite(r: Reponse, nbReponses: number): number {
  const m = r.marche;
  return (
    QUALITE_DE_BASE +
    (m.reference ? AVANTAGE.reference : 0) +
    (m.connu ? AVANTAGE.connu : 0) +
    (r.amont ? AVANTAGE.amont : 0) +
    REDACTION[r.redaction === "fond" ? "pilote" : r.redaction] +
    r.bonus -
    DILUTION * Math.max(0, nbReponses - REPONSES_SANS_DILUTION)
  );
}

export interface Notation {
  /** Nos notes, sur 100 : technique et prix. */
  technique: number;
  prix: number;
  /** Celles de l'offre concurrente la mieux placée. */
  techniqueConcurrent: number;
  prixConcurrent: number;
  /** Le prix concurrent, rapporté à notre prix habituel. */
  prixRelatifConcurrent: number;
}

/** La note des deux offres, selon le règlement de consultation : le prix le plus bas a toute la note prix. */
export function noter(r: Reponse, nbReponses: number, graine: number, elargi = false): Notation {
  const h = hasard(graine);
  const m = r.marche;
  const c = h.concurrence[m.id]!;
  const poidsPrix = 100 * (1 - m.technique);
  // Le critère élargi, la Métropole compte nos références de fusion, et le sortant perd une part de son avance.
  const niveau = m.id === "metropole" && elargi ? 0.75 : m.niveau;
  const notreQualite =
    qualite(r, nbReponses) + (m.id === "metropole" && elargi ? AVANTAGE.reference : 0);
  // Le sortant qui a écrit le cahier des charges ne dépend pas de la concurrence du trimestre.
  const taille = m.id === "metropole" && !elargi;
  const leurQualite = niveau + c.technique + (taille ? 0 : NIVEAU_COMMUN * h.niveau);
  const plusBas = Math.min(r.prix, c.prix);
  return {
    technique: 100 * m.technique * notreQualite,
    prix: (poidsPrix * plusBas) / r.prix,
    techniqueConcurrent: 100 * m.technique * leurQualite,
    prixConcurrent: (poidsPrix * plusBas) / c.prix,
    prixRelatifConcurrent: c.prix,
  };
}

/** La marge d'un marché gagné, sur toute sa durée, au prix proposé. */
export const margeDuMarche = (r: Pick<Reponse, "marche" | "prix" | "part" | "ratioCout">) =>
  r.marche.montant * r.part * (r.prix - r.ratioCout);

export interface Issue {
  id: string;
  /** Remis, puis gagné, perdu, ou déclaré sans suite par l'acheteur. */
  etat: "gagne" | "perdu" | "sansSuite";
  notation: Notation;
  marge: number;
  prix: number;
  redaction: Redaction;
}

export type Semaine = {
  /** La marge des marchés gagnés, moins tout ce que les réponses ont coûté, depuis le début du trimestre. */
  marge: number;
  /** Ce que les réponses ont coûté pendant la semaine. */
  cout: number;
  gagnes: number;
  resultats: number;
  /** Gagnés sur résultats connus ; 0 tant qu'aucun résultat n'est tombé. */
  transformation: number;
  caGagne: number;
  remises: number;
  /** Jours de seniors donnés aux réponses, cumulés. */
  seniors: number;
  /** Jours pris sur des missions facturables, cumulés. */
  facturables: number;
  /** Sur les marchés perdus à date : écarts moyens de note (nous moins l'attributaire), sur 100. */
  perdus: number;
  ecartTechnique: number;
  ecartPrix: number;
  /** Les marchés perdus où nous étions moins chers que l'attributaire. */
  moinsChers: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  objectif: number;
  chemin: readonly number[];
  issues: readonly Issue[];
  nbReponses: number;
  margeGagnee: number;
  coutReponses: number;
  joursSeniors: number;
  joursFacturables: number;
  glissement: boolean;
  elargi: boolean;
  /** Un référé a été déposé contre des rejets ; le juge l'a rejeté. */
  refere: boolean;
  gagnes: number;
  resultats: number;
  transformation: number;
  caGagne: number;
}

/** Les marchés perdus dont le résultat est connu à la fin d'une semaine. */
const perdusAvant = (issues: readonly Issue[], semaine: number) =>
  issues.filter((x) => x.etat === "perdu" && marche(x.id).attribution <= semaine).length;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const liste = reponses(chemin, graine);
  const elargi = chemin[D.metropole] === 3 && critereElargi(graine);
  const n = liste.length;
  const sansSuite = h.imprevus.find((i) => i.imprevu.effet.sansSuite);
  const issues: Issue[] = liste.map((r) => {
    const notation = noter(r, n, graine, elargi);
    const nous = notation.technique + notation.prix;
    const eux = notation.techniqueConcurrent + notation.prixConcurrent;
    const etat: Issue["etat"] =
      sansSuite && sansSuite.marche === r.marche.id ? "sansSuite" : nous > eux ? "gagne" : "perdu";
    return {
      id: r.marche.id,
      etat,
      notation,
      marge: etat === "gagne" ? margeDuMarche(r) : 0,
      prix: r.prix,
      redaction: r.redaction,
    };
  });

  // Les jours prévus pour le treizième, la question écrite ou le rendez-vous à la Métropole.
  const extra = vide();
  if (chemin[D.metropole] === 1) etaler(extra, 4, 4, { senior: RENDEZ_VOUS });
  if (chemin[D.metropole] === 3) etaler(extra, 3, 3, { senior: QUESTION });
  // Le référé : seulement s'il y a des rejets à contester en semaine 9.
  const refere = chemin[D.fin] === 3 && perdusAvant(issues, REFERE.semaine - 1) > 0;
  if (refere)
    etaler(extra, REFERE.semaine, REFERE.semaine, { senior: REFERE.senior, cash: REFERE.avocat });

  const semaines: (Semaine | null)[] = [null];
  let capSenior: number = CAPACITE.senior;
  let capConsultant: number = CAPACITE.consultant;
  let usageSenior = 0;
  let usageConsultant = 0;
  let pris = { senior: 0, consultant: 0 };
  const perteDEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let marge = 0;
  let margeGagnee = 0;
  let coutReponses = 0;
  let glissement = false;

  for (let w = 1; w <= SEMAINES; w += 1) {
    for (const i of h.imprevus) {
      if (i.semaine !== w) continue;
      capSenior -= i.imprevu.effet.senior ?? 0;
      capConsultant -= i.imprevu.effet.consultant ?? 0;
    }
    let s = extra[w]!.senior;
    let k = extra[w]!.consultant;
    let cash = extra[w]!.cash;
    for (const r of liste) {
      s += r.charge[w]!.senior;
      k += r.charge[w]!.consultant;
      cash += r.charge[w]!.cash;
    }
    usageSenior += s;
    usageConsultant += k;
    // Au-delà du temps commercial et de l'intercontrat, les jours sont pris aux missions facturables.
    const prisSenior = Math.max(pris.senior, usageSenior - capSenior);
    const prisConsultant = Math.max(pris.consultant, usageConsultant - capConsultant);
    let cout =
      s * COUT_JOUR.senior +
      k * COUT_JOUR.consultant +
      cash +
      (prisSenior - pris.senior) * (TJM.senior - COUT_JOUR.senior) +
      (prisConsultant - pris.consultant) * (TJM.consultant - COUT_JOUR.consultant);
    pris = { senior: prisSenior, consultant: prisConsultant };
    if (w === 1) cout += perteDEnquete;
    // La mission privée de ses gens glisse : la décision se lit en fin de semaine 9.
    if (w === GLISSEMENT.semaine) {
      const joursPris = pris.senior + pris.consultant / 2;
      if (h.uGlissement < chanceDeGlissement(joursPris)) {
        glissement = true;
        cout += GLISSEMENT.cout;
      }
    }
    coutReponses += cout;
    let gain = 0;
    for (const x of issues) {
      if (marche(x.id).attribution === w && x.etat === "gagne") gain += x.marge;
    }
    margeGagnee += gain;
    marge += gain - cout;

    const connus = issues.filter(
      (x) => marche(x.id).attribution <= w && (x.etat === "gagne" || x.etat === "perdu"),
    );
    const perdus = connus.filter((x) => x.etat === "perdu");
    const gagnes = connus.length - perdus.length;
    const moy = (f: (x: Issue) => number) =>
      perdus.length ? perdus.reduce((t, x) => t + f(x), 0) / perdus.length : 0;
    semaines.push({
      marge,
      cout,
      gagnes,
      resultats: connus.length,
      transformation: connus.length ? gagnes / connus.length : 0,
      caGagne: issues
        .filter((x) => x.etat === "gagne" && marche(x.id).attribution <= w)
        .reduce((t, x) => {
          const r = liste.find((y) => y.marche.id === x.id)!;
          return t + r.marche.montant * r.part * r.prix;
        }, 0),
      remises: liste.filter((r) => r.marche.remise <= w).length,
      seniors: usageSenior,
      facturables: pris.senior + pris.consultant,
      perdus: perdus.length,
      ecartTechnique: moy((x) => x.notation.technique - x.notation.techniqueConcurrent),
      ecartPrix: moy((x) => x.notation.prix - x.notation.prixConcurrent),
      moinsChers: perdus.filter((x) => x.prix < x.notation.prixRelatifConcurrent).length,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: fin.marge,
    chemin: [...chemin],
    issues,
    nbReponses: n,
    margeGagnee,
    coutReponses,
    joursSeniors: fin.seniors,
    joursFacturables: fin.facturables,
    glissement,
    elargi,
    refere,
    gagnes: fin.gagnes,
    resultats: fin.resultats,
    transformation: fin.transformation,
    caGagne: fin.caGagne,
  };
}

/** Ce qui s'est passé pendant des semaines : attributions, glissement, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    attributions: t.issues
      .filter((x) => dans(marche(x.id).attribution))
      .sort((x, y) => marche(x.id).attribution - marche(y.id).attribution),
    glissement: t.glissement && dans(GLISSEMENT.semaine),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureRafale {
  marge: number | null;
  gagnes: number | null;
  transformation: number | null;
  seniors: number | null;
  facturables: number | null;
  /** Des clés que le tableau n'affiche pas, pour les messages et les sources. */
  resultats: number | null;
  remises: number | null;
  nbReponses: number | null;
  perdus: number | null;
  ecartTechnique: number | null;
  ecartPrix: number | null;
  moinsChers: number | null;
  /** Le temps commercial des seniors qui reste, imprévus compris. */
  resteSenior: number | null;
  /** Les jours de seniors que les réponses en cours demanderont d'ici la fin, décisions à venir inchangées. */
  seniorsPrevus: number | null;
}

/** Ce que Florimond lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRafale {
  if (semaine === 0) {
    return {
      marge: 0,
      gagnes: 0,
      transformation: null,
      seniors: 0,
      facturables: 0,
      resultats: 0,
      remises: 0,
      nbReponses: 0,
      perdus: 0,
      ecartTechnique: 0,
      ecartPrix: 0,
      moinsChers: 0,
      resteSenior: CAPACITE.senior,
      seniorsPrevus: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const perte = hasard(graine)
    .imprevus.filter((i) => i.semaine <= semaine)
    .reduce((x, i) => x + (i.imprevu.effet.senior ?? 0), 0);
  return {
    marge: s.marge,
    gagnes: s.gagnes,
    transformation: s.resultats ? s.transformation : null,
    seniors: s.seniors,
    facturables: s.facturables,
    resultats: s.resultats,
    remises: s.remises,
    nbReponses: t.nbReponses,
    perdus: s.perdus,
    ecartTechnique: s.ecartTechnique,
    ecartPrix: s.ecartPrix,
    moinsChers: s.moinsChers,
    resteSenior: CAPACITE.senior - perte - s.seniors,
    seniorsPrevus: t.joursSeniors,
  };
}
