/**
 * L'ENSEIGNE QUI FRAPPE À LA PORTE — le modèle de la réponse du Groupe Escale
 * à l'offre d'affiliation d'Orméa Hotels.
 *
 * Orméa Hotels, chaîne internationale, propose d'affilier les huit hôtels du
 * Groupe Escale à sa marque : des redevances sur le chiffre d'affaires
 * hébergement, contre son système de réservation, sa distribution aux
 * entreprises et son programme de fidélité, Orméa Privilège. Isaline Perraud,
 * directrice générale, a le trimestre de janvier à mars et six décisions pour
 * faire sa recommandation au conseil de famille.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une affiliation engage des années ;
 * l'épisode dure un trimestre. Le trimestre est donc jugé sur la VALEUR
 * CRÉÉE ESTIMÉE EN SEMAINE 13, par rapport au statu quo (huit hôtels
 * indépendants, rien de changé) :
 *
 *   · le résultat du trimestre : l'écart au budget semaine par semaine (ce que
 *     l'essai rapporte ou coûte, le plan de clientèle directe, le programme de
 *     Bookalia, la baisse de prix, l'étude, l'avocat, les droits d'entrée,
 *     les imprévus) ;
 *   · PLUS la valeur des positions prises : pour chaque hôtel affilié, l'effet
 *     net annuel de la marque (le chiffre d'affaires qu'elle apporte, les
 *     commissions des plateformes qu'elle économise, moins les redevances)
 *     compté sur cinq ans, la durée du plan du groupe, actualisés à 8 % (3,99
 *     années) — sur trois ans seulement (2,58 années) quand une clause de
 *     sortie permet d'arrêter un hôtel qui perd —, moins les travaux imposés
 *     par les normes de la marque ; l'effet annuel des choix de distribution
 *     des hôtels de caractère, sur les mêmes cinq ans ; la perte d'Annemasse
 *     si Orméa s'installe chez un concurrent ;
 *   · recalculée avec ce que le trimestre a révélé : l'effet réel de la marque
 *     (connu en semaine 8 si l'essai a porté sur les hôtels d'affaires), la
 *     réponse d'Orméa (semaine 10), l'issue de la négociation et le choix
 *     d'Orméa pour Annemasse (semaine 12), les inscriptions au programme de
 *     clientèle directe (semaine 11). Avant d'être connue, chaque inconnue est
 *     prise à son espérance.
 *
 * Le refus par principe n'est pas neutre : Orméa veut être à Annemasse, aux
 * portes de Genève, et s'affiliera à un concurrent si ce n'est pas nous.
 *
 * Trois mécanismes font l'épisode, et la joueuse doit les découvrir :
 *
 *   · LA MARQUE NE VAUT PAS LA MÊME CHOSE PARTOUT. Les redevances (6 % du
 *     chiffre d'affaires hébergement, plus 4 % du chiffre des séjours des
 *     membres du programme) se paient sur tout le chiffre ; ce que la marque
 *     rapporte dépend du client. Pour un hôtel d'affaires, le système de
 *     réservation, les contrats entreprises et la fidélité apportent du
 *     chiffre et rapatrient des réservations des plateformes (15 à 18 % de
 *     commission) vers le canal de la marque. Pour un hôtel de loisirs ou de
 *     montagne qui vit de son emplacement et de ses habitués, la marque
 *     n'apporte presque rien, et l'on paie des redevances sur ses propres
 *     clients.
 *   · LA PERTE D'IDENTITÉ. L'Escale Lac, Évian et Megève vendent une maison :
 *     sous une enseigne, leur prime de caractère s'efface (1 % de prix moyen)
 *     et leurs habitués s'inscrivent au programme d'Orméa. Leur levier est la
 *     clientèle directe, qui se travaille (un moteur de réservation, un tarif
 *     membre), pas une plateforme de plus.
 *   · LA DÉPENDANCE. Un contrat de franchise lie pour des années : sans clause
 *     de sortie, en sortir coûte trois ans de redevances, et les normes de la
 *     marque imposent des travaux. Un essai sur les deux hôtels d'affaires,
 *     au bon moment de la saison, dit ce que la marque apporte vraiment ; le
 *     périmètre se révise sur ses chiffres, et se négocie : Orméa accepte
 *     plus ou moins un périmètre partiel selon ce qu'on lui a d'abord promis
 *     et ce qu'on exige.
 *
 * Le hasard stratégique : l'EFFET DE LA MARQUE sur la clientèle d'affaires
 * (faible, moyen, fort), la RÉPONSE D'ORMÉA au périmètre proposé (accepte,
 * exige un hôtel de caractère en plus, refuse), dont les chances dépendent
 * des choix du groupe, et son choix d'un CONCURRENT à Annemasse si le groupe
 * ne s'affilie pas.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe. */
export const TAUX = 0.08;
/** Une position se compte sur cinq ans, la durée du plan du groupe. */
export const HORIZON = 5;
/** Avec une clause de sortie, un hôtel qui perd s'arrête au bout de trois ans. */
export const SORTIE = 3;
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
export const COEF = annuite(HORIZON, TAUX);
export const COEF_SORTIE = annuite(SORTIE, TAUX);
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : les appels d'offres hébergement des entreprises genevoises se bouclent sans nous. */
export const PERTE_PAR_JOUR = 6000;
/** Ce que le conseil de famille attend : la valeur créée par la décision. */
export const OBJECTIF_VALEUR = 400000;

/* ---------------------------------------------------------------------------
 * LES HUIT HÔTELS ET LEURS CANAUX.
 * ------------------------------------------------------------------------- */

/** Bookalia prend 18 % sur les deux tiers des réservations des plateformes, Voyagio 15 % sur le tiers. */
export const PLATEFORMES = {
  bookalia: { commission: 0.18, part: 2 / 3 },
  voyagio: { commission: 0.15, part: 1 / 3 },
} as const;
export const COMMISSION =
  PLATEFORMES.bookalia.commission * PLATEFORMES.bookalia.part +
  PLATEFORMES.voyagio.commission * PLATEFORMES.voyagio.part;
/** Le coût variable d'une nuitée de plus (linge, petit-déjeuner, produits d'accueil, énergie) : 21 € sur un prix moyen de 130 €. */
export const COUT_VARIABLE = 0.16;

export type TypeHotel = "affaires" | "mixte" | "caractere";
export type IdHotel =
  | "annecy"
  | "lac"
  | "chambery"
  | "aix"
  | "evian"
  | "megeve"
  | "annemasse"
  | "albertville";

export interface Hotel {
  id: IdHotel;
  nom: string;
  chambres: number;
  type: TypeHotel;
  /** Le chiffre d'affaires hébergement de l'an dernier. */
  ca: number;
  /** La part de ce chiffre réservée par Bookalia et Voyagio. */
  plateformes: number;
  /** La part du chiffre annuel faite de janvier à mars. */
  q1: number;
}

export const HOTELS: readonly Hotel[] = [
  {
    id: "annecy",
    nom: "L'Escale Annecy-Centre",
    chambres: 60,
    type: "mixte",
    ca: 2800000,
    plateformes: 0.38,
    q1: 0.2,
  },
  {
    id: "lac",
    nom: "L'Escale Lac",
    chambres: 84,
    type: "caractere",
    ca: 5000000,
    plateformes: 0.28,
    q1: 0.1,
  },
  {
    id: "chambery",
    nom: "L'Escale Chambéry-Gare",
    chambres: 72,
    type: "affaires",
    ca: 2200000,
    plateformes: 0.4,
    q1: 0.25,
  },
  {
    id: "aix",
    nom: "L'Escale Aix-les-Bains",
    chambres: 56,
    type: "mixte",
    ca: 1800000,
    plateformes: 0.3,
    q1: 0.18,
  },
  {
    id: "evian",
    nom: "L'Escale Évian",
    chambres: 66,
    type: "caractere",
    ca: 4400000,
    plateformes: 0.24,
    q1: 0.12,
  },
  {
    id: "megeve",
    nom: "L'Escale Megève",
    chambres: 38,
    type: "caractere",
    ca: 3400000,
    plateformes: 0.22,
    q1: 0.48,
  },
  {
    id: "annemasse",
    nom: "L'Escale Annemasse",
    chambres: 78,
    type: "affaires",
    ca: 3400000,
    plateformes: 0.42,
    q1: 0.25,
  },
  {
    id: "albertville",
    nom: "L'Escale Albertville",
    chambres: 44,
    type: "mixte",
    ca: 1000000,
    plateformes: 0.4,
    q1: 0.22,
  },
];

export const hotel = (id: IdHotel) => HOTELS.find((h) => h.id === id)!;
const somme = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);
export const CA_HEBERGEMENT = somme(HOTELS.map((h) => h.ca));
export const CHAMBRES = somme(HOTELS.map((h) => h.chambres));
export const caDuType = (t: TypeHotel) =>
  somme(HOTELS.filter((h) => h.type === t).map((h) => h.ca));
export const CA_AFFAIRES = caDuType("affaires");
export const CA_CARACTERE = caDuType("caractere");
/** Ce que les plateformes coûtent aujourd'hui aux deux hôtels d'affaires, par an. */
export const COMMISSIONS_AFFAIRES = somme(
  HOTELS.filter((h) => h.type === "affaires").map((h) => h.ca * h.plateformes * COMMISSION),
);

/** Le chiffre d'une semaine de janvier à mars. */
export const hebdo = (h: Hotel) => (h.ca * h.q1) / 13;
const CARACTERE = HOTELS.filter((h) => h.type === "caractere");
export const HEBDO_CARACTERE = somme(CARACTERE.map(hebdo));
/** La part des hôtels de caractère réservée en direct (site, téléphone, habitués) ; le reste par les agences et les groupes. */
export const AGENCES_CARACTERE = 0.1;
export const DIRECTE_DEPART =
  somme(CARACTERE.map((h) => h.ca * (1 - h.plateformes - AGENCES_CARACTERE))) / CA_CARACTERE;

/* ---------------------------------------------------------------------------
 * CE QUE LA MARQUE APPORTE : trois scénarios pour la clientèle d'affaires.
 * ------------------------------------------------------------------------- */

export type IdScenario = "faible" | "moyen" | "fort";
export interface Scenario {
  id: IdScenario;
  nom: string;
  chance: number;
}
export const SCENARIOS: readonly Scenario[] = [
  { id: "faible", nom: "un effet faible", chance: 0.3 },
  { id: "moyen", nom: "un effet moyen", chance: 0.45 },
  { id: "fort", nom: "un effet fort", chance: 0.25 },
];

export interface Effet {
  /** Le chiffre d'affaires hébergement que la marque ajoute, ou retire (le prix d'un hôtel de caractère). */
  hausse: Record<IdScenario, number>;
  /** Les points de chiffre que la marque rapatrie des plateformes vers son canal. */
  rapatrie: Record<IdScenario, number>;
  /** La part du chiffre faite par des membres d'Orméa Privilège, sur laquelle la fidélité se paie. */
  membres: number;
}
const partout = (x: number): Record<IdScenario, number> => ({ faible: x, moyen: x, fort: x });

export const EFFETS: Record<TypeHotel | "collection", Effet> = {
  affaires: {
    hausse: { faible: -0.03, moyen: 0.12, fort: 0.17 },
    rapatrie: { faible: 0.1, moyen: 0.2, fort: 0.24 },
    membres: 0.3,
  },
  mixte: {
    hausse: { faible: 0, moyen: 0.02, fort: 0.04 },
    rapatrie: { faible: 0.04, moyen: 0.07, fort: 0.09 },
    membres: 0.15,
  },
  /** Sous l'enseigne, la prime de la maison s'efface : 1 % de prix moyen. */
  caractere: { hausse: partout(-0.01), rapatrie: partout(0.03), membres: 0.15 },
  /** « Orméa Collection » : la maison garde son nom, paie les mêmes redevances. */
  collection: { hausse: partout(0), rapatrie: partout(0.03), membres: 0.15 },
};
export const chanceScenario = (id: IdScenario) => SCENARIOS.find((s) => s.id === id)!.chance;
const enEsperance = (f: (s: IdScenario) => number) =>
  somme(SCENARIOS.map((s) => s.chance * f(s.id)));
/** Les points rapatriés des plateformes, en espérance, dans les hôtels d'affaires. */
export const RAPATRIE_ATTENDU = enEsperance((s) => EFFETS.affaires.rapatrie[s]);
/**
 * L'ÉCONOMIE DE COMMISSIONS DES HÔTELS D'AFFAIRES, en espérance : ce que la
 * semaine 1 demande d'estimer. Les points rapatriés, sur 5,6 M€, à 17 %.
 */
export const ECONOMIE_AFFAIRES = RAPATRIE_ATTENDU * CA_AFFAIRES * COMMISSION;

/** Les redevances d'Orméa : sur tout le chiffre hébergement, et sur celui des membres. */
export const REDEVANCES = {
  marque: 0.04,
  marketing: 0.02,
  fidelite: 0.04,
  /** Les conditions de groupe, pour les huit hôtels : 3 % de redevance de marque au lieu de 4 %. */
  marqueGroupe: 0.03,
  /** Pour les huit hôtels, Orméa participe aux travaux. */
  participationGroupe: 600000,
  /** Le droit d'entrée, par hôtel, payé à la signature. */
  entree: 20000,
} as const;
export const FRAIS = REDEVANCES.marque + REDEVANCES.marketing;
export const FRAIS_GROUPE = REDEVANCES.marqueGroupe + REDEVANCES.marketing;

/** Les travaux que les normes de la marque imposent, par chambre ; le plafond négociable. */
export const TRAVAUX = {
  affaires: 5000,
  mixte: 4000,
  caractere: 7000,
  collection: 3000,
  plafond: 2500,
} as const;

/** Ce que l'affiliation change chaque année, pour un hôtel : la marque apporte, on paie. */
export function netAnnuel(
  h: Hotel,
  s: IdScenario,
  frais: number,
  collection = false,
): { apport: number; economie: number; redevances: number; net: number } {
  const e = EFFETS[collection ? "collection" : h.type];
  const u = e.hausse[s];
  // Le chiffre en plus d'un hôtel d'affaires est fait de nuitées, qui coûtent ; celui qu'un hôtel
  // de caractère perd est du prix, qui ne coûte rien.
  const apport = h.ca * u * (u > 0 ? 1 - COUT_VARIABLE : 1);
  const economie = COMMISSION * e.rapatrie[s] * h.ca;
  const redevances = (frais + REDEVANCES.fidelite * e.membres) * h.ca * (1 + u);
  return { apport, economie, redevances, net: apport + economie - redevances };
}

export interface Termes {
  frais: number;
  sortie: boolean;
  plafond: boolean;
}

export const travaux = (h: Hotel, t: Termes, collection = false) =>
  h.chambres *
  Math.min(TRAVAUX[collection ? "collection" : h.type], t.plafond ? TRAVAUX.plafond : Infinity);

/**
 * Ce que vaut l'affiliation d'un hôtel : cinq ans d'effet net, trois si l'on
 * peut sortir d'un hôtel qui perd, moins les travaux. Le contrat « Orméa
 * Collection » est celui d'Orméa, sans clause de sortie.
 */
export function valeurHotel(h: Hotel, s: IdScenario, t: Termes, collection = false): number {
  const n = netAnnuel(h, s, t.frais, collection).net;
  const sortie = t.sortie && !collection;
  return n * (sortie && n < 0 ? COEF_SORTIE : COEF) - travaux(h, t, collection);
}

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS ET CE QU'ELLES CHANGENT.
 * ------------------------------------------------------------------------- */

export const D = {
  ligne: 0,
  essai: 1,
  caractere: 2,
  contrat: 3,
  perimetre: 4,
  reponse: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [1, 3, 5, 7, 9, 11] as const;
/** Ne rien changer : demander du temps, pas d'essai, rien pour les hôtels de caractère, le contrat type, s'en tenir à la ligne, signer ce qui a été proposé s'il convient. */
export const NEUTRE = [3, 0, 3, 0, 0, 2] as const;

/** D1 · L'étude hôtel par hôtel : un cabinet et le revenue management, trois semaines. */
export const ETUDE = 15000;
/** D1 · Accepter le principe des huit : Orméa lance l'audit de pré-affiliation, 2 500 € par hôtel. */
export const DOSSIER = 20000;

/** D2 · L'ESSAI : deux hôtels connectés à Orméa pendant six semaines, de la semaine 3 à la semaine 8. */
export const ESSAI = {
  debut: 3,
  fin: 8,
  /** Orméa prend 15 % sur les réservations qu'elle apporte. */
  commission: 0.15,
  interface: 8000,
  /** Les chiffres sont connus en fin de semaine 8. */
  resultats: 8,
} as const;
export const HOTELS_ESSAI: Record<1 | 2, readonly IdHotel[]> = {
  1: ["annemasse", "chambery"],
  2: ["lac", "megeve"],
};
/** Ce qu'Orméa apporterait dans un hôtel de caractère en janvier-mars : un peu à L'Escale Lac, qui tourne à vide ; à Megève, complet, elle prend la place de nos habitués. */
export const ESSAI_CARACTERE: Partial<
  Record<IdHotel, { hausse: number; rapatrie: number; deplace: number }>
> = {
  lac: { hausse: 0.02, rapatrie: 0.03, deplace: 0 },
  megeve: { hausse: 0, rapatrie: 0.03, deplace: 0.1 },
};
/** Les habitués de Megève, délogés par des membres d'Orméa : une chance sur deux, en semaine 6. */
export const HABITUES = { chance: 0.5, semaine: 6, cout: 20000 } as const;

/** Ce que l'essai rapporte par euro de chiffre d'un hôtel testé, pendant une semaine. */
export function gainEssai(h: Hotel, s: IdScenario): number {
  const c = h.type === "affaires" ? null : ESSAI_CARACTERE[h.id];
  const u = c ? c.hausse : EFFETS.affaires.hausse[s];
  const dp = c ? c.rapatrie : EFFETS.affaires.rapatrie[s];
  const deplace = c ? c.deplace : 0;
  return u * (1 - COUT_VARIABLE) + dp * COMMISSION - (u + dp + deplace) * ESSAI.commission;
}

/** D3 · LES HÔTELS DE CARACTÈRE : le programme de Bookalia, la clientèle directe, une baisse de prix. */
export const BOOKALIA_PP = {
  /** Trois points de commission de plus sur les réservations Bookalia. */
  surcommission: 0.03,
  /** Des réservations Bookalia en plus, dont la moitié auraient été prises en direct. */
  volume: 0.08,
  cannibalise: 0.5,
} as const;
const PART_BOOKALIA_CARACTERE =
  (somme(CARACTERE.map((h) => h.ca * h.plateformes)) / CA_CARACTERE) * PLATEFORMES.bookalia.part;
/** L'effet du programme de Bookalia, par euro de chiffre Bookalia. */
export const EFFET_PP =
  -BOOKALIA_PP.surcommission +
  BOOKALIA_PP.volume *
    ((1 - BOOKALIA_PP.cannibalise) *
      (1 - COUT_VARIABLE - PLATEFORMES.bookalia.commission - BOOKALIA_PP.surcommission) -
      BOOKALIA_PP.cannibalise * (PLATEFORMES.bookalia.commission + BOOKALIA_PP.surcommission));
export const ANNUEL_PP = EFFET_PP * PART_BOOKALIA_CARACTERE * CA_CARACTERE;
export const CA_BOOKALIA_CARACTERE = PART_BOOKALIA_CARACTERE * CA_CARACTERE;

/** Le plan de clientèle directe : moteur de réservation, CRM dans Hostéo, tarif membre « Cercle Escale ». */
export const DIRECT = {
  investissement: 90000,
  fonctionnement: 20000,
  /** Le tarif membre : 5 % de moins que le prix public, pour les inscrits. */
  remise: 0.05,
  /** Les points rapatriés des plateformes vers le direct, en moyenne chez les hôtels qui l'ont fait. */
  attendu: 0.065,
  ecart: 0.015,
  min: 0.02,
  max: 0.1,
  /** Les premières inscriptions se lisent en semaine 11. */
  resultats: 11,
} as const;
export const annuelDirect = (a: number) =>
  a * CA_CARACTERE * (COMMISSION - DIRECT.remise) - DIRECT.fonctionnement;

/** La baisse de 5 % du prix sur notre site, pour tous : un quart du chiffre des hôtels de caractère s'y réserve. */
export const BAISSE = { taux: 0.05, site: 0.25, rapatrie: 0.03 } as const;
export const EFFET_BAISSE =
  -BAISSE.taux * BAISSE.site + BAISSE.rapatrie * (COMMISSION - BAISSE.taux);
export const ANNUEL_BAISSE = EFFET_BAISSE * CA_CARACTERE;

/** D4 · LE CONTRAT. L'avocat, si l'on négocie ; ce qu'en sortir coûte sans clause. */
export const AVOCAT = 10000;
export const INDEMNITE_ANNEES = 3;

export function termes(c: readonly number[], huit: boolean): Termes {
  const k = c[D.contrat];
  const base = huit ? FRAIS_GROUPE : FRAIS;
  return {
    frais: base - (k === 3 ? 0.01 : 0),
    sortie: k === 1 || k === 2 || k === 3,
    plafond: k === 1 || k === 3,
  };
}

/** D5 · LE PÉRIMÈTRE PROPOSÉ. */
export type Proposition = "huit" | "affaires" | "annemasse" | "aucun" | "reporter";
export const AFFAIRES: readonly IdHotel[] = ["annemasse", "chambery"];
export const TOUS: readonly IdHotel[] = HOTELS.map((h) => h.id);
export const PERIMETRES: Record<"huit" | "affaires" | "annemasse", readonly IdHotel[]> = {
  huit: TOUS,
  affaires: AFFAIRES,
  annemasse: ["annemasse"],
};

/** La ligne annoncée au conseil en semaine 1. */
export const LIGNE: readonly Proposition[] = ["huit", "aucun", "affaires", "aucun"];

/** Ce qu'on propose à Orméa en semaine 9. Revoir le périmètre sur l'essai : rien si les hôtels d'affaires n'ont pas gagné. */
export function proposition(c: readonly number[], s: IdScenario): Proposition {
  const p = c[D.perimetre];
  if (p === 0) return LIGNE[c[D.ligne]!]!;
  if (p === 1) return c[D.essai] === 1 && s === "faible" ? "aucun" : "affaires";
  if (p === 2) return "annemasse";
  return "reporter";
}

/** Reporter : Orméa attend jusqu'à l'automne sept fois sur dix ; le périmètre se décide alors, un trimestre plus tard. */
export const REPORT = { patience: 0.7, decote: 0.9 } as const;

/* ---------------------------------------------------------------------------
 * LA RÉPONSE D'ORMÉA, en semaine 10, et ce qui s'ensuit.
 * ------------------------------------------------------------------------- */

export type Reponse = "accepte" | "contre" | "refuse";
export const SEMAINE_REPONSE = 10;
export const SIGNATURE = 12;
/**
 * En semaine 12, l'Observatoire hôtelier des Alpes publie ce que la marque a
 * apporté aux hôtels affiliés de la région : l'effet de la marque est alors
 * connu de tous. L'essai le donne quatre semaines plus tôt, avant de proposer.
 */
export const OBSERVATOIRE = 12;

/** Les chances de chaque réponse à un périmètre partiel, avant ce que le groupe a montré. */
export const BASE_REPONSE: Record<"affaires" | "annemasse", Record<Reponse, number>> = {
  affaires: { accepte: 0.55, contre: 0.3, refuse: 0.15 },
  annemasse: { accepte: 0.5, contre: 0.3, refuse: 0.2 },
};
/** Ce qui déplace les chances : la ligne de départ, l'essai, les exigences du contrat. */
export const AJUSTEMENTS = {
  /** Promettre les huit, puis revenir à deux : Orméa se sent trompée. */
  ligne: [
    { contre: 0.1, refuse: 0.15 },
    { contre: 0.05, refuse: 0.1 },
    { contre: 0, refuse: 0 },
    { contre: 0.1, refuse: 0.05 },
  ],
  /** Un essai concluant à Annemasse : Orméa a vu ce qu'elle y gagne. */
  essaiConcluant: -0.1,
  /** Un essai à Megève : Orméa a vu l'hôtel complet, et le veut. */
  essaiCaractere: 0.1,
  contrat: [
    { contre: 0, refuse: 0 },
    { contre: 0.05, refuse: 0 },
    { contre: 0, refuse: 0 },
    { contre: 0.15, refuse: 0.2 },
  ],
} as const;

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function chancesReponse(
  c: readonly number[],
  s: IdScenario,
  prop: Proposition,
): Record<Reponse, number> {
  if (prop === "huit") return { accepte: 1, contre: 0, refuse: 0 };
  const base = BASE_REPONSE[prop === "annemasse" ? "annemasse" : "affaires"];
  const l = AJUSTEMENTS.ligne[c[D.ligne]!]!;
  const k = AJUSTEMENTS.contrat[c[D.contrat]!]!;
  const essai =
    c[D.essai] === 1 && s !== "faible"
      ? AJUSTEMENTS.essaiConcluant
      : c[D.essai] === 2
        ? AJUSTEMENTS.essaiCaractere
        : 0;
  const refuse = borne(base.refuse + l.refuse + k.refuse, 0, 0.9);
  const contre = borne(base.contre + l.contre + k.contre + essai, 0, 1 - refuse);
  return { accepte: 1 - refuse - contre, contre, refuse };
}

/**
 * D6 · CE QUE DEVIENT LA NÉGOCIATION selon la réponse d'Orméa et ce qu'on lui
 * répond. Si elle exige un hôtel de caractère (Évian en « Orméa Collection ») :
 * le lui céder, lui offrir Annecy-Centre à la place, tenir, ou renoncer. Si
 * elle refuse le périmètre partiel : lui céder les huit, lui offrir
 * Annecy-Centre, tenir, ou renoncer.
 */
export const ISSUES = {
  contre: { mixtes: 0.9, tenir: 0.65 },
  refuse: { mixtes: 0.35, tenir: 0.15 },
} as const;
/** Ce qu'Orméa exige quand elle contre-propose : ses deux adresses de prestige, en « Orméa Collection ». */
export const EXIGES: readonly IdHotel[] = ["evian", "megeve"];
/** La contrepartie qu'on peut lui offrir à la place : deux hôtels mixtes. */
export const CONTREPARTIE: readonly IdHotel[] = ["annecy", "aix"];

export interface Perimetre {
  hotels: readonly IdHotel[];
  /** Évian et Megève en « Orméa Collection ». */
  collection: boolean;
}
export const AUCUN: Perimetre = { hotels: [], collection: false };
const avec = (ids: readonly IdHotel[], ajouts: readonly IdHotel[]): readonly IdHotel[] => [
  ...ids,
  ...ajouts.filter((x) => !ids.includes(x)),
];

/** Les issues possibles de la négociation, et leurs chances. */
export function issues(
  prop: "huit" | "affaires" | "annemasse",
  rep: Reponse,
  d6: number,
): [Perimetre, number][] {
  const ids = PERIMETRES[prop];
  const signe: Perimetre = { hotels: ids, collection: false };
  if (d6 === 3) return [[AUCUN, 1]];
  if (rep === "accepte") return [[signe, 1]];
  const q = ISSUES[rep];
  if (d6 === 0) {
    return rep === "contre"
      ? [[{ hotels: avec(ids, EXIGES), collection: true }, 1]]
      : [[{ hotels: TOUS, collection: false }, 1]];
  }
  if (d6 === 1) {
    return [
      [{ hotels: avec(ids, CONTREPARTIE), collection: false }, q.mixtes],
      [AUCUN, 1 - q.mixtes],
    ];
  }
  return [
    [signe, q.tenir],
    [AUCUN, 1 - q.tenir],
  ];
}

/** Le concurrent : sans nous, Orméa affilie l'Arcadelle, 4 étoiles ouvert l'an dernier à Annemasse. */
export const CONCURRENT = {
  chance: { faible: 0.1, moyen: 0.45, fort: 0.65 } as Record<IdScenario, number>,
  /** Décliner d'emblée ou faire attendre Orméa la pousse vers lui. */
  ligne: [0, 0.15, 0, 0.1],
  /** L'Escale Annemasse perdrait 5 % de son chiffre, les entreprises qui exigent une marque. */
  perte: 0.05,
} as const;
export const PERTE_CONCURRENT = hotel("annemasse").ca * CONCURRENT.perte * (1 - COUT_VARIABLE);
export const chanceConcurrent = (c: readonly number[], s: IdScenario) =>
  borne(CONCURRENT.chance[s] + CONCURRENT.ligne[c[D.ligne]!]!, 0, 0.9);

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  montant: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "salon",
    titre: "Un salon international à Genève",
    de: "Romuald Aubertin",
    role: "Directeur de L'Escale Annemasse",
    texte:
      "Le salon de la haute horlogerie a débordé de Genève : Annemasse affiche complet cinq nuits de suite, à 40 % au-dessus du prix moyen. 35 k€ de chiffre en plus sur la semaine.",
    montant: 35000,
  },
  {
    id: "neige",
    titre: "La route de Megève coupée deux jours",
    de: "Annabelle Socquet",
    role: "Directrice de L'Escale Megève",
    texte:
      "Chute de neige record : la route est coupée deux jours en pleine saison. Arrivées décalées, départs bloqués, chambres offertes aux clients coincés : 30 k€ de moins.",
    montant: -30000,
  },
  {
    id: "panne",
    titre: "Hostéo en panne un week-end",
    de: "Kaïs Benamar",
    role: "Responsable des systèmes d'information",
    texte:
      "Le logiciel Hostéo est tombé de vendredi soir à dimanche : plus de plan des chambres ni de synchronisation avec les plateformes. Trois surréservations, onze clients délogés à nos frais : 18 k€.",
    montant: -18000,
  },
  {
    id: "cures",
    titre: "Les thermes d'Aix-les-Bains ouvrent plus tôt",
    de: "Ilse Montmasson",
    role: "Contrôleuse de gestion",
    texte:
      "Les thermes ouvrent la saison des cures trois semaines plus tôt que prévu : Aix-les-Bains remplit avec des curistes en séjour de trois semaines. 25 k€ de chiffre en plus.",
    montant: 25000,
  },
  {
    id: "greve",
    titre: "Une grève des cheminots",
    de: "Ana Sousa",
    role: "Directrice de L'Escale Chambéry-Gare",
    texte:
      "Grève des cheminots trois jours : les clients d'affaires annulent, les réservations à la nuitée tombent. Chambéry-Gare à 30 % d'occupation : 22 k€ de moins.",
    montant: -22000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: Scenario;
  /** L'écart au budget de chaque semaine, sans lien avec Orméa (indices 1 à 13). */
  bruit: readonly number[];
  uReponse: number;
  uIssue: number;
  uPatience: number;
  uHabitues: number;
  /** Les points de chiffre que le plan de clientèle directe rapatrie des plateformes. */
  adoption: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000621 + 7);
  const us = r();
  const scenario =
    us < SCENARIOS[0]!.chance
      ? SCENARIOS[0]!
      : us < SCENARIOS[0]!.chance + SCENARIOS[1]!.chance
        ? SCENARIOS[1]!
        : SCENARIOS[2]!;
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(3000 * gauss(r), -7000, 7000));
  const uReponse = r();
  const uIssue = r();
  const uPatience = r();
  const uHabitues = r();
  const adoption = borne(DIRECT.attendu + DIRECT.ecart * gauss(r), DIRECT.min, DIRECT.max);
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
    bruit,
    uReponse,
    uIssue,
    uPatience,
    uHabitues,
    adoption,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

const tirer = <T>(u: number, chances: readonly [T, number][]): T => {
  let cumul = 0;
  for (const [x, p] of chances) {
    cumul += p;
    if (u < cumul) return x;
  }
  return chances.at(-1)![0];
};

/** La réponse d'Orméa au périmètre proposé, ou `null` s'il n'y a rien à lui répondre. */
export function reponse(c: readonly number[], graine: number): Reponse | null {
  const s = hasard(graine).scenario.id;
  const prop = proposition(c, s);
  if (prop === "aucun" || prop === "reporter") return null;
  const ch = chancesReponse(c, s, prop);
  return tirer(hasard(graine).uReponse, [
    ["accepte", ch.accepte],
    ["contre", ch.contre],
    ["refuse", ch.refuse],
  ]);
}

/** Le périmètre finalement signé, en semaine 12 ; reporter ne signe rien ce trimestre. */
export function signe(c: readonly number[], graine: number): Perimetre {
  const s = hasard(graine).scenario.id;
  const prop = proposition(c, s);
  const rep = reponse(c, graine);
  if (rep === null || prop === "aucun" || prop === "reporter") return AUCUN;
  return tirer(hasard(graine).uIssue, issues(prop, rep, c[D.reponse]!));
}

/** Orméa attend-elle l'automne, quand on reporte ? */
export const patiente = (c: readonly number[], graine: number) =>
  proposition(c, hasard(graine).scenario.id) === "reporter" &&
  hasard(graine).uPatience < REPORT.patience;

/**
 * Le risque qu'Orméa s'affilie l'Arcadelle, faute d'Annemasse. Orméa choisira
 * son partenaire dans l'année : en semaine 13, ce n'est encore qu'un risque,
 * compté à sa probabilité, que le scénario de la marque rend plus ou moins fort.
 */
export function risqueConcurrent(c: readonly number[], graine: number): number {
  const s = hasard(graine).scenario.id;
  if (signe(c, graine).hotels.includes("annemasse") || patiente(c, graine)) return 0;
  return chanceConcurrent(c, s);
}

/** Les habitués de Megève délogés pendant l'essai. */
export const habitues = (c: readonly number[], graine: number) =>
  c[D.essai] === 2 && hasard(graine).uHabitues < HABITUES.chance;

/* ---------------------------------------------------------------------------
 * LA VALEUR, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

/** Les décisions en vigueur en fin de semaine w : les autres comptent comme « ne rien changer ». */
const enVigueur = (chemin: readonly number[], w: number) =>
  NEUTRE.map((n, k) => (w >= EFFET[k]! ? (chemin[k] ?? n) : n));

/** Ce que l'on sait à la fin de la semaine w ; le reste est pris à son espérance. */
interface Savoir {
  scenario: IdScenario | null;
  reponse: Reponse | null | undefined;
  issue: Perimetre | null;
  patience: boolean | null;
  adoption: number;
}

function savoir(chemin: readonly number[], graine: number, w: number): Savoir {
  const h = hasard(graine);
  const c = enVigueur(chemin, w);
  const essaiAffaires = c[D.essai] === 1 && w >= ESSAI.resultats;
  return {
    scenario: essaiAffaires || w >= OBSERVATOIRE ? h.scenario.id : null,
    reponse: w >= SEMAINE_REPONSE ? reponse(c, graine) : undefined,
    issue: w >= SIGNATURE ? signe(c, graine) : null,
    patience: w >= SEMAINE_REPONSE ? hasard(graine).uPatience < REPORT.patience : null,
    adoption: w >= DIRECT.resultats ? h.adoption : DIRECT.attendu,
  };
}

/** L'effet annuel des choix de distribution sur les hôtels de caractère restés indépendants. */
function annuelCaractere(d3: number, adoption: number, partIndependante: number): number {
  const a = d3 === 0 ? ANNUEL_PP : d3 === 1 ? annuelDirect(adoption) : d3 === 2 ? ANNUEL_BAISSE : 0;
  return a * partIndependante;
}
/** La part directe des hôtels de caractère, projetée, selon les choix et ce qui est affilié. */
function directeCaractere(d3: number, adoption: number, ids: readonly IdHotel[], coll: boolean) {
  const delta =
    d3 === 0
      ? -BOOKALIA_PP.volume * BOOKALIA_PP.cannibalise * PART_BOOKALIA_CARACTERE
      : d3 === 1
        ? adoption
        : d3 === 2
          ? BAISSE.rapatrie
          : 0;
  let x = 0;
  for (const h of CARACTERE) {
    const affilie = ids.includes(h.id);
    const base = 1 - h.plateformes - AGENCES_CARACTERE;
    // Affilié, l'hôtel voit ses habitués réserver par le canal d'Orméa ; indépendant, il garde ses leviers.
    x +=
      h.ca *
      (affilie
        ? base - EFFETS[coll && EXIGES.includes(h.id) ? "collection" : "caractere"].membres
        : base + delta);
  }
  return x / CA_CARACTERE;
}

export interface Position {
  /** La valeur des affiliations signées ou espérées, travaux et droits d'entrée compris. */
  affiliation: number;
  /** La perte d'Annemasse si Orméa s'affilie l'Arcadelle. */
  concurrent: number;
  /** La valeur des choix de distribution des hôtels de caractère. */
  caractere: number;
  total: number;
  /** Les redevances annuelles à payer à Orméa, pour ce qui est sur la table. */
  redevances: number;
  /** La part directe des hôtels de caractère, projetée sur l'an prochain. */
  directe: number;
}

/** Ce que vaut un périmètre signé, sous un scénario. */
function valeurPerimetre(
  c: readonly number[],
  p: Perimetre,
  s: IdScenario,
  entreeComptee: boolean,
): { valeur: number; redevances: number } {
  const huit = p.hotels.length === HOTELS.length;
  const t = termes(c, huit);
  let valeur = huit ? REDEVANCES.participationGroupe : 0;
  let redevances = 0;
  for (const id of p.hotels) {
    const h = hotel(id);
    const coll = p.collection && EXIGES.includes(id);
    valeur += valeurHotel(h, s, t, coll);
    redevances += netAnnuel(h, s, t.frais, coll).redevances;
  }
  if (entreeComptee) valeur -= REDEVANCES.entree * p.hotels.length;
  return { valeur, redevances };
}

/** Ce que vaut un périmètre pour un chemin, au scénario connu ou en espérance, droits d'entrée compris. */
export function valeurAttendue(
  c: readonly number[],
  hotels: readonly IdHotel[],
  collection: boolean,
  s: IdScenario | null,
): number {
  const p: Perimetre = { hotels, collection };
  return s
    ? valeurPerimetre(c, p, s, true).valeur
    : enEsperance((x) => valeurPerimetre(c, p, x, true).valeur);
}
/** Le risque qu'Orméa s'affilie l'Arcadelle, au scénario connu ou en espérance. */
export const risqueAttendu = (c: readonly number[], s: IdScenario | null) =>
  s ? chanceConcurrent(c, s) : enEsperance((x) => chanceConcurrent(c, x));

/** La situation installée par un chemin en fin de semaine w, selon ce qu'on sait. */
function position(chemin: readonly number[], graine: number, w: number): Position {
  const c = enVigueur(chemin, w);
  const k = savoir(chemin, graine, w);
  const scenarios: [IdScenario, number][] = k.scenario
    ? [[k.scenario, 1]]
    : SCENARIOS.map((s) => [s.id, s.chance]);
  // Les droits d'entrée sont payés à la signature : avant, ils comptent dans la position.
  const entree = w < SIGNATURE;
  let affiliation = 0;
  let vConcurrent = 0;
  let caractere = 0;
  let redevances = 0;
  let directe = 0;
  for (const [s, ps] of scenarios) {
    const prop = proposition(c, s);
    // Les périmètres possibles en fin de négociation, et leurs chances.
    let fins: [Perimetre, number][];
    let report = 0;
    let patience = 0;
    if (prop === "aucun") fins = [[AUCUN, 1]];
    else if (prop === "reporter") {
      fins = [[AUCUN, 1]];
      patience = k.patience === null ? REPORT.patience : k.patience ? 1 : 0;
      // À l'automne, on signe les hôtels d'affaires s'ils valent quelque chose, au vu de l'essai s'il a eu lieu.
      const t = termes(c, false);
      const vAff = (x: IdScenario) => somme(AFFAIRES.map((id) => valeurHotel(hotel(id), x, t)));
      const signeraitAutomne = c[D.essai] === 1 ? vAff(s) > 0 : enEsperance((x) => vAff(x)) > 0;
      report = patience * REPORT.decote * (signeraitAutomne ? vAff(s) : 0);
    } else if (k.issue) fins = [[k.issue, 1]];
    else {
      const reps: [Reponse, number][] =
        k.reponse !== undefined && k.reponse !== null
          ? [[k.reponse, 1]]
          : (Object.entries(chancesReponse(c, s, prop)) as [Reponse, number][]);
      fins = reps.flatMap(([rep, pr]) =>
        issues(prop, rep, c[D.reponse]!).map(([p, q]): [Perimetre, number] => [p, pr * q]),
      );
    }
    for (const [p, q] of fins) {
      const poids = ps * q;
      const v = valeurPerimetre(c, p, s, entree);
      affiliation += poids * (v.valeur + report);
      redevances += poids * v.redevances;
      // Sans Annemasse dans la marque, Orméa peut s'affilier l'Arcadelle, sauf si elle attend l'automne.
      if (!p.hotels.includes("annemasse")) {
        const risque = chanceConcurrent(c, s) * (1 - patience);
        vConcurrent -= poids * risque * PERTE_CONCURRENT * COEF;
      }
      const independants = CARACTERE.filter((h) => !p.hotels.includes(h.id));
      const part = somme(independants.map((h) => h.ca)) / CA_CARACTERE;
      caractere += poids * annuelCaractere(c[D.caractere]!, k.adoption, part) * COEF;
      directe += poids * directeCaractere(c[D.caractere]!, k.adoption, p.hotels, p.collection);
    }
  }
  // Les redevances affichées : celles du périmètre sur la table, même avant la réponse.
  return {
    affiliation,
    concurrent: vConcurrent,
    caractere,
    total: affiliation + vConcurrent + caractere,
    redevances: Math.max(redevances, redevancesSurLaTable(c, k)),
    directe,
  };
}

/** Les redevances du périmètre que la ligne ou la proposition met sur la table, en espérance. */
function redevancesSurLaTable(c: readonly number[], k: Savoir): number {
  if (k.issue) return 0;
  const s = k.scenario;
  const prop = s ? proposition(c, s) : c[D.perimetre] === 0 ? LIGNE[c[D.ligne]!]! : null;
  if (!prop || prop === "aucun" || prop === "reporter") return 0;
  const p = PERIMETRES[prop];
  const t = termes(c, prop === "huit");
  return somme(
    p.map((id) =>
      s
        ? netAnnuel(hotel(id), s, t.frais).redevances
        : enEsperance((x) => netAnnuel(hotel(id), x, t.frais).redevances),
    ),
  );
}

/** L'écart au budget d'une semaine, avec les vraies valeurs du hasard. */
function realise(chemin: readonly number[], graine: number, w: number, jours: number): number {
  const h = hasard(graine);
  const c = enVigueur(chemin, w);
  const s = h.scenario.id;
  let x = h.bruit[w]!;
  if (w === 1) {
    x -= Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    if (c[D.ligne] === 2) x -= ETUDE;
    if (c[D.ligne] === 0) x -= DOSSIER;
  }
  const e = c[D.essai];
  if ((e === 1 || e === 2) && w >= ESSAI.debut && w <= ESSAI.fin) {
    if (w === ESSAI.debut) x -= ESSAI.interface;
    const rampe = w === ESSAI.debut ? 0.5 : 1;
    for (const id of HOTELS_ESSAI[e]) x += rampe * hebdo(hotel(id)) * gainEssai(hotel(id), s);
  }
  if (w === HABITUES.semaine && habitues(c, graine)) x -= HABITUES.cout;
  const d3 = c[D.caractere];
  if (w >= EFFET[D.caractere]) {
    if (d3 === 0) x += (EFFET_PP * CA_BOOKALIA_CARACTERE * (HEBDO_CARACTERE / CA_CARACTERE)) / 1;
    if (d3 === 1) {
      if (w === EFFET[D.caractere]) x -= DIRECT.investissement;
      const rampe = Math.min(1, (w - EFFET[D.caractere]) / 8);
      x +=
        rampe * h.adoption * HEBDO_CARACTERE * (COMMISSION - DIRECT.remise) -
        DIRECT.fonctionnement / 52;
    }
    if (d3 === 2) x += EFFET_BAISSE * HEBDO_CARACTERE;
  }
  if (w === EFFET[D.contrat] && c[D.contrat] !== 0) x -= AVOCAT;
  if (w === SIGNATURE) x -= REDEVANCES.entree * signe(c, graine).hotels.length;
  for (const i of h.imprevus) if (i.semaine === w) x += i.imprevu.montant;
  return x;
}

/** La part du chiffre hébergement de la semaine réservée par les plateformes. */
export function partPlateformes(chemin: readonly number[], graine: number, w: number): number {
  const c = enVigueur(chemin, w);
  const s = hasard(graine).scenario.id;
  const total = somme(HOTELS.map(hebdo));
  let plat = somme(HOTELS.map((h) => hebdo(h) * h.plateformes));
  const e = c[D.essai];
  if ((e === 1 || e === 2) && w >= ESSAI.debut && w <= ESSAI.fin) {
    const rampe = w === ESSAI.debut ? 0.5 : 1;
    for (const id of HOTELS_ESSAI[e]) {
      const h = hotel(id);
      const dp =
        h.type === "affaires" ? EFFETS.affaires.rapatrie[s] : ESSAI_CARACTERE[id]!.rapatrie;
      plat -= rampe * hebdo(h) * dp;
    }
  }
  if (w >= EFFET[D.caractere]) {
    const d3 = c[D.caractere];
    if (d3 === 0)
      plat += BOOKALIA_PP.volume * CA_BOOKALIA_CARACTERE * (HEBDO_CARACTERE / CA_CARACTERE);
    if (d3 === 1)
      plat -= Math.min(1, (w - EFFET[D.caractere]) / 8) * hasard(graine).adoption * HEBDO_CARACTERE;
    if (d3 === 2) plat -= BAISSE.rapatrie * HEBDO_CARACTERE;
  }
  return plat / total;
}

export interface Semaine {
  /** La valeur créée estimée en fin de semaine, par rapport au statu quo, en euros. */
  valeur: number;
  variation: number;
  plateformes: number;
  /** L'écart au budget cumulé du trimestre. */
  ecart: number;
  redevances: number;
  directe: number;
  [cle: string]: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  objectif: number;
  scenario: Scenario;
  reponse: Reponse | null;
  chances: Record<Reponse, number> | null;
  proposition: Proposition;
  signe: Perimetre;
  /** Le risque, en fin de trimestre, qu'Orméa s'affilie l'Arcadelle. */
  concurrent: number;
  patience: boolean;
  habitues: boolean;
  adoption: number;
  position: Position;
  ecart: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let ecart = 0;
  let avant = 0;
  let pos: Position | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    ecart += realise(chemin, graine, w, jours);
    pos = position(chemin, graine, w);
    const valeur = ecart + pos.total;
    semaines.push({
      valeur,
      variation: valeur - avant,
      plateformes: partPlateformes(chemin, graine, w),
      ecart,
      redevances: pos.redevances,
      directe: pos.directe,
    });
    avant = valeur;
  }
  const s = h.scenario.id;
  const prop = proposition(chemin, s);
  const rep = reponse(chemin, graine);
  return {
    semaines,
    objectif: semaines[SEMAINES]!.valeur,
    scenario: h.scenario,
    reponse: rep,
    chances:
      prop === "aucun" || prop === "reporter" || prop === "huit"
        ? null
        : chancesReponse(chemin, s, prop),
    proposition: prop,
    signe: signe(chemin, graine),
    concurrent: risqueConcurrent(chemin, graine),
    patience: patiente(chemin, graine),
    habitues: habitues(chemin, graine),
    adoption: h.adoption,
    position: pos!,
    ecart,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const e = chemin[D.essai];
  return {
    essai: (e === 1 || e === 2) && dans(ESSAI.debut),
    habitues: dans(HABITUES.semaine) && habitues(chemin, graine),
    resultats: dans(ESSAI.resultats),
    observatoire: dans(OBSERVATOIRE),
    reponse: dans(SEMAINE_REPONSE),
    adoption: chemin[D.caractere] === 1 && dans(DIRECT.resultats),
    signature: dans(SIGNATURE),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEnseigne {
  valeur: number | null;
  plateformes: number | null;
  redevances: number | null;
  ecart: number | null;
  directe: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  scenario: number | null;
  reponse: number | null;
  adoption: number | null;
  /** Orméa attend-elle l'automne : 1, 0, ou -1 tant qu'on ne le sait pas. */
  patience: number | null;
  [cle: string]: number | null;
}

const SCENARIOS_IDS: readonly IdScenario[] = ["faible", "moyen", "fort"];
const REPONSES: readonly Reponse[] = ["accepte", "contre", "refuse"];
export const scenarioParCode = (n: number | null | undefined): IdScenario | null =>
  n == null || n < 0 ? null : (SCENARIOS_IDS[n] ?? null);
export const reponseParCode = (n: number | null | undefined): Reponse | null =>
  n == null || n < 0 ? null : (REPONSES[n] ?? null);

/** Ce qu'Isaline lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEnseigne {
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      valeur: 0,
      plateformes: partPlateformes(NEUTRE, graine, 0),
      redevances: 0,
      ecart: 0,
      directe: DIRECTE_DEPART,
      scenario: -1,
      reponse: -1,
      adoption: null,
      patience: -1,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const essaiAffaires = decisions[D.essai] === 1;
  return {
    valeur: s.valeur,
    plateformes: s.plateformes,
    redevances: s.redevances,
    ecart: s.ecart,
    directe: s.directe,
    scenario:
      (essaiAffaires && semaine >= ESSAI.resultats) || semaine >= OBSERVATOIRE
        ? SCENARIOS_IDS.indexOf(h.scenario.id)
        : -1,
    reponse: semaine >= SEMAINE_REPONSE && t.reponse ? REPONSES.indexOf(t.reponse) : -1,
    adoption: semaine >= DIRECT.resultats ? h.adoption : null,
    patience:
      semaine >= SEMAINE_REPONSE && t.proposition === "reporter" ? (t.patience ? 1 : 0) : -1,
  };
}
