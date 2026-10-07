/**
 * LES POSTES QU'ON NE POURVOIT PLUS — le modèle des recrutements de l'été du Groupe Escale.
 *
 * Février à avril : c'est maintenant que se signent les contrats de l'été.
 * Le Groupe Escale doit trouver 64 saisonniers pour les métiers en tension
 * de ses hôtels du lac et de la montagne — cuisiniers, serveurs,
 * réceptionnistes, femmes et valets de chambre —, dans un bassin d'emploi où
 * la Suisse voisine paie davantage et où un studio se loue en été le prix
 * d'un demi-salaire. Mounir Belghazi, directeur des ressources humaines du
 * groupe, décide de la campagne. Treize semaines, six décisions.
 *
 * Le trimestre se juge sur l'été qu'il prépare. L'objectif est la MARGE DE
 * L'ÉTÉ PRÉSERVÉE, estimée en semaine 13 : sur la marge que les 64 postes du
 * plan protègent dans une saison normale (douze semaines, de mi-juin à
 * début septembre), ce que les postes vides ne font pas perdre — services
 * fermés, chambres fermées à la vente, intérim —, moins tout ce que la
 * campagne a engagé : logement, primes, organisation du travail, annonces,
 * départs dans les équipes en place. La projection prolonge le trimestre
 * jusqu'à l'ouverture de la saison (mai et début juin, sans hasard nouveau)
 * avec les leviers en place, puis compte la saison sous le scénario que le
 * pick-up a révélé en semaine 8. Une saison plus forte que prévu rend chaque
 * poste vide plus cher, et en demande quelques-uns de plus.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE LOGEMENT EST LE PREMIER FREIN. Six candidats sur dix viennent
 *     d'ailleurs. Sans toit, ils signent moins, se désistent près de quatre
 *     fois plus souvent avant juin dès qu'ils trouvent mieux, et partent deux
 *     fois plus souvent en cours de saison : sur cent candidats venus
 *     d'ailleurs, treize finissent la saison quand ils doivent se loger
 *     seuls, vingt quand on les loge. Louer un immeuble et conventionner des
 *     places en résidence les fait signer et rester comme les locaux, dans la
 *     limite des lits. Une indemnité de logement ne crée pas de logement :
 *     dans un marché sans offre, elle aide peu.
 *   · PAYER DAVANTAGE LES SEULS NOUVEAUX CRÉE UNE INIQUITÉ. Un salaire
 *     d'entrée relevé ou une prime d'embauche attire un peu ; mais les
 *     saisonniers fidèles et les permanents l'apprennent en quelques jours :
 *     des fidèles ne reviennent pas, des permanents partent, chaque départ
 *     est un poste de plus à pourvoir, et la cooptation se tarit. Une prime
 *     de fin de saison versée à tous ceux qui finissent leur contrat retient
 *     sans rien casser.
 *   · LA COUPURE FAIT FUIR. Le service coupé (10 h – 14 h 30, puis
 *     18 h 30 – 23 h) décourage les candidats et fait partir en juillet. Deux
 *     équipes décalées et la semaine de quatre jours attirent et retiennent,
 *     pour 2 % de masse salariale d'été ; là où un chef n'y croit pas, cela
 *     tient mal (environ une fois sur trois), coûte plus et rapporte moins :
 *     c'est la meilleure option en moyenne, pas la plus sûre.
 *   · UN POSTE VIDE A UN COÛT. Un cuisinier qui manque ferme deux déjeuners
 *     par semaine ; une femme de chambre qui manque ferme des chambres à la
 *     vente. Un été organisé d'avance pour l'effectif réel (fermetures
 *     programmées, polyvalence entre hôtels voisins, ventes ajustées) perd
 *     moins qu'un été subi ; l'intérim couvre une partie des trous, cher. Et
 *     les postes qu'on ne pourvoira pas coûtent moins là où le pick-up est
 *     faible : réaffecter les recrues selon les réservations de chaque hôtel,
 *     plutôt que tenir la répartition de février, est la révision que le
 *     signal de la semaine 8 demande.
 *
 * Le hasard du trimestre : le bruit des candidatures, le scénario de la
 * saison (révélé par le pick-up en semaine 8), la réponse du propriétaire de
 * Sévrier sur la durée du bail, la tenue du service sans coupure, le départ
 * de Léopold Vittoz, le second de cuisine du Lac, si l'iniquité s'installe, et les imprévus.
 *
 * Les personnes sont comptées en espérance : 3,4 désistements se lisent
 * « trois ou quatre ».
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les semaines de mai et de début juin que la projection ajoute avant l'ouverture de la saison. */
export const PROJECTION = 6;
/** La saison d'été : douze semaines, de mi-juin à début septembre. */
export const SAISON = 12;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des candidats qui attendaient une réponse signent ailleurs. */
export const PERTE_PAR_JOUR = 3000;

/** Le coût employeur d'un euro brut de salaire ou de prime, dans les métiers concernés. */
export const CHARGES = 1.3;

/**
 * LE DÉJEUNER DE L'ESCALE LAC, l'été : ce qu'un cuisinier qui manque fait
 * perdre. Avec cinq cuisiniers au lieu de six, le chef ferme le déjeuner deux
 * jours par semaine ; la salle est en place et reste payée.
 */
export const DEJEUNER = {
  couverts: 75,
  /** Ticket moyen du déjeuner, hors taxes. */
  ticket: 30,
  ratioMatiere: 0.3,
  servicesFermes: 2,
} as const;

/** La marge sur coût matière que deux déjeuners fermés font perdre chaque semaine. */
export const PERTE_CUISINIER =
  DEJEUNER.servicesFermes * DEJEUNER.couverts * DEJEUNER.ticket * (1 - DEJEUNER.ratioMatiere);

/**
 * LES MÉTIERS EN TENSION : les postes saisonniers de l'été à pourvoir, le
 * salaire chargé d'une semaine, et ce qu'une semaine de poste vide fait
 * perdre de marge, salaire non versé non déduit.
 */
export const METIERS = [
  { id: "cuisine", nom: "Cuisiniers", besoin: 14, salaire: 650, perte: PERTE_CUISINIER },
  { id: "salle", nom: "Serveurs", besoin: 18, salaire: 580, perte: 1500 },
  { id: "reception", nom: "Réceptionnistes", besoin: 8, salaire: 600, perte: 1300 },
  { id: "etages", nom: "Femmes et valets de chambre", besoin: 24, salaire: 560, perte: 2400 },
] as const;

/** Les postes saisonniers de l'été que le plan de février prévoit de pourvoir. */
export const BESOIN = METIERS.reduce((s, m) => s + m.besoin, 0);
const moyennePonderee = (f: (m: (typeof METIERS)[number]) => number) =>
  METIERS.reduce((s, m) => s + m.besoin * f(m), 0) / BESOIN;
/** Le salaire chargé moyen d'une semaine de saisonnier. */
export const SALAIRE_MOYEN = moyennePonderee((m) => m.salaire);
/** La marge qu'une semaine de poste vide fait perdre, en moyenne. */
export const PERTE_MOYENNE = moyennePonderee((m) => m.perte);

/** Ce que coûte un poste vide une semaine : la marge perdue, moins le salaire qu'on ne verse pas. */
export const coutDeVacance = (perte: number, salaire: number, intensite = 1) =>
  perte * intensite - salaire;
/** Le coût d'un cuisinier vacant sur tout l'été, dans une saison normale : ce que la semaine 1 demande. */
export const COUT_CUISINIER_VACANT = SAISON * coutDeVacance(PERTE_CUISINIER, METIERS[0].salaire);
/** Ce que protège un poste pourvu sur l'été, en moyenne, dans une saison normale. */
export const VALEUR_POSTE = SAISON * coutDeVacance(PERTE_MOYENNE, SALAIRE_MOYEN);
/** La marge de l'été que les 64 postes du plan protègent, dans une saison normale. */
export const MARGE_EN_JEU = BESOIN * VALEUR_POSTE;

/** Les équipes en place dans les mêmes métiers : permanents, et saisonniers fidèles déjà réengagés. */
export const PERMANENTS = 110;
export const FIDELES = 26;
/** Les contrats d'été déjà signés en janvier. */
export const SIGNES_DEPART = 6;
/** La masse salariale d'été des équipes concernées : permanents, fidèles et saisonniers du plan. */
export const MASSE_ETE = (PERMANENTS + FIDELES + BESOIN) * SALAIRE_MOYEN * SAISON;
/** L'enveloppe de la campagne accordée par la direction générale. */
export const BUDGET_CAMPAGNE = 150000;

/** Les candidatures sérieuses d'une semaine ordinaire, et la part de candidats venus d'ailleurs. */
export const CANDIDATURES = 12;
export const PART_D_AILLEURS = 0.6;
/** Le printemps est la saison où l'on cherche un emploi d'été ; mai et juin, le vivier s'épuise. */
const CALENDRIER = [0, 0.85, 0.9, 0.95, 1, 1, 1.05, 1.1, 1.15, 1.2, 1.2, 1.15, 1.1, 1.05] as const;
const CALENDRIER_PROJECTION = 0.7;

/** La part des candidats qui signent : locaux, et venus d'ailleurs selon qu'ils sont logés. */
export const ACCEPTATION = { local: 0.24, loge: 0.24, sansLogement: 0.2, indemnite: 0.215 };
/** Ce que la coupure, ou un planning connu trois semaines à l'avance, retranche aux signatures. */
export const HORAIRES = { coupure: 0.88, planning: 0.92, continu: 1, continuMalTenu: 0.92 };

/** Le risque hebdomadaire qu'un candidat signé se désiste avant la saison. */
export const DESISTEMENT = {
  local: 0.006,
  loge: 0.004,
  sansLogement: 0.015,
  indemnite: 0.012,
  coopte: 0.003,
};
/** La part des saisonniers qui partent en cours de saison, au bout de six semaines en moyenne. */
export const ABANDON = { local: 0.14, loge: 0.12, sansLogement: 0.24, coopte: 0.06 };
/** Les semaines qui séparent en moyenne une signature de mars de l'ouverture de la saison. */
export const ATTENTE = 12;
/** Sur cent candidats venus d'ailleurs, combien finissent la saison : logés par le groupe, ou non. */
export const finissentSurCent = (loge: boolean) =>
  100 *
  (loge ? ACCEPTATION.loge : ACCEPTATION.sansLogement) *
  (1 - (loge ? DESISTEMENT.loge : DESISTEMENT.sansLogement)) ** ATTENTE *
  (1 - (loge ? ABANDON.loge : ABANDON.sansLogement));

/** Le logement : l'immeuble de Sévrier et la résidence de Megève. */
export const LOGEMENT = {
  lits: 28,
  loyer: 8400,
  /** Le bail que le groupe demande (mai à septembre), et celui que le propriétaire peut exiger. */
  mois: 5,
  moisLong: 7,
  megevePlaces: 10,
  megeveLoyer: 420,
  megeveMois: 3,
  /** Ce que le groupe retient chaque mois au saisonnier logé, trois mois. */
  retenue: 150,
} as const;
export const PLACES = LOGEMENT.lits + LOGEMENT.megevePlaces;
/** Le propriétaire accepte un bail de cinq mois six fois sur dix. */
export const CHANCE_BAIL_COURT = 0.6;
export const coutDuLogement = (bailCourt: boolean) =>
  LOGEMENT.loyer * (bailCourt ? LOGEMENT.mois : LOGEMENT.moisLong) +
  LOGEMENT.megevePlaces * LOGEMENT.megeveLoyer * LOGEMENT.megeveMois;

/** Les sommes brutes par personne ; le coût employeur les multiplie par CHARGES. */
export const MONTANTS = {
  salaireEntree: 150,
  annoncesDoublees: 6000,
  indemnite: 200,
  primeEmbauche: 600,
  primeFin: 350,
  revalorisation: 50,
  /** Les mois de février à septembre, sur lesquels la revalorisation des permanents est comptée. */
  moisPermanents: 8,
  test: 3000,
  planning: 2500,
  cooptation: 300,
  forum: 5000,
  annoncesMultipliees: 9000,
  surenchere: 200,
  organiser: 4000,
} as const;
/** Le service sans coupure : la masse salariale d'été en plus, et ce qu'il coûte là où il tient mal. */
export const ORGANISATION = { tient: 0.02, malTenu: 0.045 } as const;
/** Il tient environ deux fois sur trois : là où un chef n'y croit pas, les équipes décalées se défont. */
export const CHANCE_CONTINU = 0.65;
/** L'intérim de l'été : coefficient de l'agence, part des missions garanties, frais par poste réservé. */
export const INTERIM = { coefficient: 2.2, couverture: 0.35, frais: 800 } as const;
export const SURCOUT_INTERIM = (INTERIM.coefficient - 1) * SALAIRE_MOYEN;
/** Un été organisé d'avance : la part du coût d'un poste vide qui reste, prévu ou en cours de saison. */
export const ORGANISE = { prevu: 0.75, abandon: 0.85 } as const;

/** Un permanent qui part : recrutement, intégration, savoir-faire perdu, en plus du poste à pourvoir. */
export const COUT_DEPART_PERMANENT = 5000;
/** Léopold Vittoz, second de cuisine de L'Escale Lac depuis onze ans : sans lui, l'été du restaurant se réduit. */
export const COUT_SECOND = 40000;

/** Les scénarios de la saison, que le pick-up révèle en semaine 8. */
export const SCENARIOS = [
  { id: "forte", nom: "Saison forte", chance: 0.4, besoin: 5, intensite: 1.15, ecart: 0.15 },
  { id: "normale", nom: "Saison normale", chance: 0.4, besoin: 0, intensite: 1, ecart: 0.2 },
  { id: "faible", nom: "Saison faible", chance: 0.2, besoin: -5, intensite: 0.8, ecart: 0.25 },
] as const;
export const REVELATION = 8;
/**
 * RÉAFFECTER SELON LE PICK-UP. Les hôtels ne se remplissent pas tous pareil :
 * envoyer les recrues là où les réservations sont les plus fortes laisse les
 * postes vides là où ils coûtent le moins. Sur les dix premiers postes vides,
 * le coût baisse de l'écart que le pick-up révèle entre les hôtels (`ecart`) ;
 * servir d'abord les restaurants, sans regarder le pick-up, n'en gagne qu'une
 * part fixe.
 */
export const REAFFECTATION = { capacite: 12, restaurants: 0.08, finMai: 0.4 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  axe: 0,
  primes: 1,
  horaires: 2,
  vivier: 3,
  pickup: 4,
  ete: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 0, 3] as const;

/** La semaine où chaque décision commence à agir. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;

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
  effet: { candidatures?: number; signature?: number; desistement?: number; sansLogement?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "salon",
    titre: "Un salon d'hôtels suisses à Annemasse",
    de: "Marwa Selmi",
    role: "Chargée de recrutement, siège",
    texte:
      "Douze hôtels de Genève et de Lausanne tiennent un salon de recrutement à Annemasse cette semaine et la suivante. Deux candidats signés m'ont déjà demandé s'ils pouvaient « réfléchir encore ».",
    duree: 2,
    effet: { candidatures: 0.85, desistement: 1.8 },
  },
  {
    id: "site",
    titre: "Panne du site carrières",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le formulaire de candidature du site carrières est tombé en panne et personne ne s'en est aperçu pendant cinq jours : les candidatures de la semaine sont perdues.",
    duree: 1,
    effet: { candidatures: 0.4 },
  },
  {
    id: "reportage",
    titre: "Un reportage sur les métiers de la saison",
    de: "Mahé Arbez",
    role: "Responsable de la communication",
    texte:
      "La télévision régionale a passé un reportage sur les saisonniers du lac, tourné en partie dans nos cuisines. Les candidatures affluent.",
    duree: 1,
    effet: { candidatures: 1.3 },
  },
  {
    id: "absence",
    titre: "La chargée de recrutement en arrêt",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Marwa Selmi est en arrêt deux semaines. Les entretiens sont repoussés, et des candidats qui attendaient une réponse ont signé ailleurs.",
    duree: 2,
    effet: { signature: 0.8 },
  },
  {
    id: "residence",
    titre: "Une résidence étudiante ferme pour travaux",
    de: "Pascaline Domenge",
    role: "Directrice de L'Escale Annecy-Centre",
    texte:
      "La résidence étudiante de Cran-Gevrier ferme trois mois pour travaux : 140 studios en moins sur le marché, juste avant l'été. Les saisonniers qui cherchaient à s'y loger cherchent ailleurs, ou renoncent.",
    duree: 3,
    effet: { sansLogement: 0.6, desistement: 1.2 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des candidatures, semaine par semaine. */
  candidatures: readonly number[];
  /** Le scénario de la saison : 0 forte, 1 normale, 2 faible. */
  scenario: number;
  /** Le propriétaire de Sévrier accepte-t-il un bail de cinq mois ? */
  uBail: number;
  /** Le service sans coupure tient-il ? */
  uContinu: number;
  /** Le second de cuisine part-il si l'iniquité s'installe ? */
  uSecond: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000547 + 7);
  const candidatures = [1];
  for (let w = 1; w <= SEMAINES; w += 1) {
    candidatures.push(Math.min(1.25, Math.max(0.75, 1 + 0.1 * gauss(r))));
  }
  const u = r();
  const scenario =
    u < SCENARIOS[0].chance ? 0 : u < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  const uBail = r();
  const uContinu = r();
  const uSecond = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { candidatures, scenario, uBail, uContinu, uSecond, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le bail de Sévrier : cinq mois, ou sept si le propriétaire l'exige. */
export const bailCourt = (graine: number) => hasard(graine).uBail < CHANCE_BAIL_COURT;
/** Le service sans coupure tient-il, là où on le met en place ? */
export const continuTient = (graine: number) => hasard(graine).uContinu < CHANCE_CONTINU;

/** Les mesures qui paient davantage les seuls nouveaux, actives en semaine w. */
export function iniquite(chemin: readonly number[], w: number): number {
  return (
    (chemin[D.axe] === 0 && w >= EFFET[D.axe] + 1 ? 1 : 0) +
    (chemin[D.primes] === 0 && w >= EFFET[D.primes] + 1 ? 1 : 0) +
    (chemin[D.ete] === 0 && w >= EFFET[D.ete] + 1 ? 1 : 0)
  );
}

/**
 * LÉOPOLD PART-IL ?
 *
 * Second de cuisine de L'Escale Lac depuis onze ans, Léopold Vittoz gagne moins que ce
 * qu'on promet à un chef de partie qui arrive. Une mesure pour les seuls
 * nouveaux le fait partir presque une fois sur deux, deux mesures sept fois
 * sur dix ; une surenchère de fin de campagne ajoute son poids. Sans
 * iniquité, il reste.
 */
export const chanceQueLeSecondParte = (n: number) => [0, 0.45, 0.7, 0.8][Math.min(3, n)]!;
export function departDuSecond(chemin: readonly number[], graine: number): number | null {
  const u = hasard(graine).uSecond;
  const n7 = iniquite(chemin, 7);
  if (n7 > 0 && u < chanceQueLeSecondParte(n7)) return 7;
  if (chemin[D.ete] === 0 && u < chanceQueLeSecondParte(n7 + 1)) return 12;
  return null;
}

export type Semaine = {
  /** Contrats d'été signés et toujours valables en fin de semaine. */
  pourvus: number;
  /** Candidatures sérieuses reçues dans la semaine. */
  candidatures: number;
  /** Contrats signés dans la semaine. */
  signatures: number;
  /** Désistements cumulés depuis février. */
  desistements: number;
  /** Départs cumulés dans les équipes en place : fidèles qui ne reviennent pas, permanents partis. */
  departs: number;
  /** Coûts engagés cumulés : logement, primes signées, organisation, annonces. */
  couts: number;
  /** Lits occupés à Sévrier et à Megève. */
  loges: number;
  /** Les postes à pourvoir que le plan vise cette semaine, remplacements compris. */
  cible: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge de l'été préservée, moins les coûts engagés : plus haut, mieux c'est. */
  objectif: number;
  chemin: readonly number[];
  scenario: number;
  bailCourt: boolean | null;
  continuTient: boolean | null;
  /** La semaine où Léopold annonce son départ, ou `null`. */
  second: number | null;
  /** Saisonniers du plan présents à l'ouverture de la saison, projection comprise. */
  effectif: number;
  /** Ce qu'il faut réellement à l'ouverture : le plan, la saison, les remplacements. */
  besoin: number;
  vacants: number;
  surplus: number;
  /** Départs en cours de saison, en espérance. */
  abandons: number;
  desistements: number;
  fidelesPerdus: number;
  permanentsPartis: number;
  cooptes: number;
  loges: number;
  /** Ce que les postes vides de l'été coûtent : marge perdue, intérim. */
  perteVacance: number;
  /** Tout ce que la campagne a engagé, saison comprise. */
  couts: number;
  /** Départs de permanents, départ de Léopold, enquête. */
  autresPertes: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const sc = SCENARIOS[h.scenario]!;
  const bail = d1 === 1 ? bailCourt(graine) : null;
  const tient = d3 === 0 || d3 === 1 ? continuTient(graine) : null;
  const second = departDuSecond(chemin, graine);
  const semaines: (Semaine | null)[] = [null];

  // Les contrats signés, par origine : locaux, venus d'ailleurs logés ou non, cooptés.
  let sL = SIGNES_DEPART;
  let sH = 0;
  let sN = 0;
  let sC = 0;
  let places = d1 === 1 ? PLACES : 0;
  let fidelesPerdus = 0;
  let permanentsPartis = 0;
  let desistements = 0;
  let couts = 0;
  let autresPertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES + PROJECTION; w += 1) {
    const projection = w > SEMAINES;
    const actifs = projection
      ? []
      : h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = (k: keyof Imprevu["effet"]) =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[k] ?? 1), 1);

    // Les leviers en place cette semaine.
    const loge = d1 === 1 && w >= EFFET[D.axe];
    const indemnite = d1 === 2 && w >= EFFET[D.axe];
    const salaireEntree = d1 === 0 && w >= EFFET[D.axe];
    const primeEmbauche = d2 === 0 && w >= EFFET[D.primes];
    const primeFin = d2 === 1 && w >= EFFET[D.primes];
    const revalorisation = d2 === 2 && w >= EFFET[D.primes];
    const continu = (d3 === 0 && w >= EFFET[D.horaires]) || (d3 === 1 && tient === true && w >= 9);
    const malTenu = continu && tient === false;
    const planning = d3 === 2 && w >= EFFET[D.horaires];
    const cooptation = d4 === 0 && w >= EFFET[D.vivier];
    const forum = d4 === 1 && w >= EFFET[D.vivier] + 1;
    const annonces = d4 === 2 && w >= EFFET[D.vivier];
    const surenchere = d6 === 0 && w >= EFFET[D.ete];
    const n = iniquite(chemin, w);

    // Les coûts engagés au moment où la décision se prend.
    if (w === EFFET[D.axe]) {
      if (d1 === 1) couts += coutDuLogement(bail!);
      if (d1 === 0) couts += MONTANTS.annoncesDoublees;
    }
    if (w === EFFET[D.primes] && d2 === 2) {
      couts += MONTANTS.revalorisation * CHARGES * PERMANENTS * MONTANTS.moisPermanents;
    }
    if (w === EFFET[D.horaires]) {
      if (d3 === 0) couts += MASSE_ETE * ORGANISATION.tient;
      if (d3 === 1) couts += MONTANTS.test;
      if (d3 === 2) couts += MONTANTS.planning;
    }
    if (d3 === 0 && tient === false && w === 6) {
      couts += MASSE_ETE * (ORGANISATION.malTenu - ORGANISATION.tient);
    }
    if (d3 === 1 && tient === true && w === 9) couts += MASSE_ETE * ORGANISATION.tient;
    if (w === EFFET[D.vivier]) {
      if (d4 === 1) couts += MONTANTS.forum;
      if (d4 === 2) couts += MONTANTS.annoncesMultipliees;
    }
    if (w === EFFET[D.ete] && d6 === 2) couts += MONTANTS.organiser;

    // Les candidatures.
    let candidats =
      CANDIDATURES *
      (projection ? CALENDRIER_PROJECTION : CALENDRIER[w]! * h.candidatures[w]!) *
      effet("candidatures");
    if (salaireEntree) candidats *= 1.06;
    // Des annonces en plus : des candidatures en plus, souvent sans expérience ni logement.
    if (annonces) candidats *= 1.14;
    const saisonDuVivier = projection ? CALENDRIER_PROJECTION : 1;
    const candForum = forum ? 4 * saisonDuVivier : 0;
    const candCoopt = cooptation
      ? 1.6 * saisonDuVivier * (n > 0 ? 0.4 : 1) * (second !== null && w > second ? 0.6 : 1)
      : 0;

    // Ce qui fait signer.
    const horaires = continu
      ? malTenu
        ? HORAIRES.continuMalTenu
        : HORAIRES.continu
      : planning
        ? HORAIRES.planning
        : HORAIRES.coupure;
    let salaire = 1;
    if (salaireEntree) salaire *= 1.05;
    if (primeEmbauche) salaire *= 1.04;
    if (revalorisation) salaire *= 1.02;
    if (primeFin) salaire *= 1.02;
    if (surenchere) salaire *= 1.06;
    const k = horaires * salaire * effet("signature");
    const accLocal = ACCEPTATION.local * k;
    const accLoge = ACCEPTATION.loge * k;
    const accSans =
      (indemnite ? ACCEPTATION.indemnite : ACCEPTATION.sansLogement) * k * effet("sansLogement");

    // Au forum, des étudiants qui comparent les offres : ils signent moins.
    const locaux = (candidats * (1 - PART_D_AILLEURS) + candForum * 0.15 * 0.8) * accLocal;
    const dAilleurs = candidats * PART_D_AILLEURS + candForum * 0.85 * 0.8;
    const logesPossibles = loge ? Math.min(places, dAilleurs * accLoge) : 0;
    const sansLogement = (dAilleurs - (loge ? logesPossibles / accLoge : 0)) * accSans;
    // Les cooptés connaissent le métier et l'équipe ; la moitié vient d'ailleurs et doit se loger.
    const placesApres = places - logesPossibles;
    const accCoopt = 0.5 * salaire;
    const cooptLoges = loge ? Math.min(placesApres, candCoopt * 0.5 * accCoopt) : 0;
    const cooptes =
      candCoopt * 0.5 * accCoopt + cooptLoges + (candCoopt * 0.5 * accCoopt - cooptLoges) * 0.4;

    // On ne signe que ce que le plan demande encore.
    const stock = sL + sH + sN + sC;
    const cible = BESOIN + fidelesPerdus + permanentsPartis;
    const proposes = locaux + logesPossibles + sansLogement + cooptes;
    const reste = Math.max(0, cible - stock);
    const part = proposes > 0 ? Math.min(1, reste / proposes) : 0;
    sL += locaux * part;
    sH += logesPossibles * part;
    sN += sansLogement * part;
    sC += cooptes * part;
    places -= (logesPossibles + cooptLoges) * part;
    const signes = proposes * part;
    if (salaireEntree) couts += signes * MONTANTS.salaireEntree * CHARGES * 3;
    if (primeEmbauche) couts += signes * MONTANTS.primeEmbauche * CHARGES;
    if (surenchere) couts += signes * MONTANTS.surenchere * CHARGES * 3;
    if (indemnite) couts += sansLogement * part * MONTANTS.indemnite * CHARGES * 3;

    // Les désistements avant la saison.
    let m = effet("desistement");
    if (primeFin) m *= 0.55;
    if (revalorisation) m *= 0.9;
    if (continu) m *= malTenu ? 0.9 : 0.8;
    if (planning) m *= 0.9;
    if (surenchere && w > EFFET[D.ete]) m *= 1.4; // ceux qui ont signé avant l'apprennent
    const dL = sL * DESISTEMENT.local * m;
    const dH = sH * DESISTEMENT.loge * m;
    const dN =
      sN *
      (indemnite ? DESISTEMENT.indemnite : DESISTEMENT.sansLogement) *
      m *
      (2 - effet("sansLogement"));
    const dC = sC * DESISTEMENT.coopte * m;
    sL -= dL;
    sH -= dH;
    sN -= dN;
    sC -= dC;
    places += dH;
    desistements += dL + dH + dN + dC;

    // Les équipes en place : des fidèles ne reviennent pas, des permanents partent.
    let mf = 1;
    if (primeFin) mf *= 0.5;
    if (continu) mf *= 0.8;
    fidelesPerdus += (FIDELES - fidelesPerdus) * (0.003 + 0.005 * n) * mf * effet("desistement");
    let mp = 1;
    if (revalorisation) mp *= 0.6;
    if (continu) mp *= 0.8;
    const partis = (PERMANENTS - permanentsPartis) * (0.0015 + 0.001 * n) * mp;
    permanentsPartis += partis;
    autresPertes += partis * COUT_DEPART_PERMANENT;
    if (second === w) autresPertes += COUT_SECOND;

    if (!projection) {
      semaines.push({
        pourvus: sL + sH + sN + sC,
        candidatures: candidats + candForum + candCoopt,
        signatures: signes,
        desistements,
        departs: fidelesPerdus + permanentsPartis + (second !== null && w >= second ? 1 : 0),
        couts,
        loges: d1 === 1 ? PLACES - places : 0,
        cible: Math.max(0, cible),
      });
    }
  }

  // L'ouverture de la saison.
  const effectif = sL + sH + sN + sC;
  const besoin = BESOIN + sc.besoin + fidelesPerdus + permanentsPartis;
  const vacants = Math.max(0, besoin - effectif);
  const surplus = Math.max(0, effectif - besoin);
  const continuEte = d3 === 0 || (d3 === 1 && tient === true);
  let ma = 1;
  if (d2 === 1) ma *= 0.4;
  if (continuEte) ma *= tient ? 0.6 : 0.9;
  if (d3 === 2) ma *= 0.9;
  if (d6 === 0) ma *= 1.2;
  const abandons =
    (sL * ABANDON.local + sH * ABANDON.loge + sN * ABANDON.sansLogement + sC * ABANDON.coopte) * ma;
  // Des recrues en trop comblent les départs de l'été ; au-delà, leur salaire est à moitié perdu.
  const abandonsNets = Math.max(0, abandons - surplus);
  const surplusNet = Math.max(0, surplus - abandons);
  const cv = coutDeVacance(PERTE_MOYENNE, SALAIRE_MOYEN, sc.intensite);
  // Où sont les postes vides : réaffectés selon le pick-up, ils coûtent moins.
  // Attendre la fin mai : la moitié des recrues sont déjà affectées, il ne reste qu'une part du gain.
  const gain =
    d5 === 1
      ? sc.ecart
      : d5 === 2
        ? REAFFECTATION.restaurants
        : d5 === 3
          ? sc.ecart * REAFFECTATION.finMai
          : 0;
  const cvPrevu =
    vacants > 0 ? cv * (1 - (gain * Math.min(vacants, REAFFECTATION.capacite)) / vacants) : cv;
  let perteVacance: number;
  if (d6 === 2) {
    perteVacance =
      vacants * SAISON * ORGANISE.prevu * cvPrevu +
      abandonsNets * (SAISON / 2) * ORGANISE.abandon * cv;
  } else if (d6 === 1) {
    const couvert = (x: number) =>
      INTERIM.couverture * SURCOUT_INTERIM + (1 - INTERIM.couverture) * x;
    perteVacance =
      vacants * SAISON * couvert(cvPrevu) +
      abandonsNets * (SAISON / 2) * couvert(cv) +
      INTERIM.frais * vacants;
  } else {
    perteVacance = vacants * SAISON * cvPrevu + abandonsNets * (SAISON / 2) * cv;
  }
  perteVacance += surplusNet * SALAIRE_MOYEN * SAISON * 0.5;

  // Ce qui se paie pendant la saison.
  const loges = d1 === 1 ? PLACES - places : 0;
  if (d1 === 1) couts -= loges * LOGEMENT.retenue * 3;
  if (d2 === 1) {
    couts += (effectif - abandons + FIDELES - fidelesPerdus) * MONTANTS.primeFin * CHARGES;
  }
  if (d2 === 2) {
    couts += (effectif + FIDELES - fidelesPerdus) * MONTANTS.revalorisation * CHARGES * 3;
  }
  if (d4 === 0) couts += sC * (1 - ABANDON.coopte) * MONTANTS.cooptation * CHARGES;

  const objectif = MARGE_EN_JEU - perteVacance - couts - autresPertes;
  return {
    semaines,
    objectif,
    chemin: [...chemin],
    scenario: h.scenario,
    bailCourt: bail,
    continuTient: tient,
    second,
    effectif,
    besoin,
    vacants,
    surplus,
    abandons,
    desistements,
    fidelesPerdus,
    permanentsPartis,
    cooptes: sC,
    loges: borne(loges, 0, PLACES),
    perteVacance,
    couts,
    autresPertes,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    second: t.second !== null && dans(t.second),
    continuMalTenu: chemin[D.horaires] === 0 && t.continuTient === false && dans(6),
    continuTient: chemin[D.horaires] === 0 && t.continuTient === true && dans(6),
    test: chemin[D.horaires] === 1 && dans(8),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePenurie {
  pourvus: number | null;
  candidatures: number | null;
  desistements: number | null;
  departs: number | null;
  couts: number | null;
  /** Non affichées : ce que les messages et les sources lisent. */
  cible: number | null;
  loges: number | null;
  scenario: number | null;
  second: number | null;
  /** Le rythme de signatures qui pourvoirait le plan à l'ouverture. */
  rythme: number | null;
}

/** Le rythme qui pourvoirait les 64 postes à l'ouverture, de février à mi-juin. */
export const rythme = (semaine: number) =>
  SIGNES_DEPART + ((BESOIN - SIGNES_DEPART) * semaine) / (SEMAINES + PROJECTION);

/** Ce que Mounir lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePenurie {
  if (semaine === 0) {
    return {
      pourvus: SIGNES_DEPART,
      candidatures: 10,
      desistements: 0,
      departs: 0,
      couts: 0,
      cible: BESOIN,
      loges: 0,
      scenario: null,
      second: 0,
      rythme: SIGNES_DEPART,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    pourvus: s.pourvus,
    candidatures: s.candidatures,
    desistements: s.desistements,
    departs: s.departs,
    couts: s.couts,
    cible: s.cible,
    loges: s.loges,
    scenario: semaine >= REVELATION ? t.scenario : null,
    second: t.second !== null && semaine >= t.second ? 1 : 0,
    rythme: rythme(semaine),
  };
}
