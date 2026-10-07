/**
 * LA PROMOTION QU'IL FAUDRA REFUSER — le modèle d'une équipe du bureau de Paris d'Atlas Conseil.
 *
 * Noé Akintola, directeur, encadre douze consultants de la practice
 * Performance opérationnelle. D'octobre à décembre : les entretiens annuels,
 * puis le comité de promotion du bureau en semaine 6. Trois consultants
 * seniors visent le grade de manager et il n'y a qu'une place : Tahina
 * Rakotoarisoa, qui a déjà piloté deux missions ; Vasco Tanneau, que soutient
 * Bathilde Sarrail, directrice dans la practice Data, pour qui il travaille
 * depuis huit mois ; Elric Mérindol, le plus apprécié des clients et du bureau,
 * qui n'a jamais piloté ni budget ni équipe. Quatre mécanismes font l'épisode :
 *
 *   · LE COMITÉ CALIBRE SUR CE QU'ON LUI APPORTE. Avec des critères écrits et
 *     les faits de l'année (évaluations de fin de mission, budgets pilotés,
 *     retours des analystes), il départage sur la capacité à encadrer. Sans
 *     eux, il suit les soutiens : le candidat qu'un second directeur défend
 *     passe devant, quelle que soit sa préparation. Le poids des faits est le
 *     produit de leur qualité (décision 1) et de l'usage qu'on en fait au
 *     comité (décision 3).
 *   · L'ANNONCE FAIT LE DÉPART. Un non-retenu qui l'apprend par le courriel du
 *     bureau, ou par la rumeur faute d'annonce, part souvent ; reçu en face,
 *     avec les critères qui ont manqué, un plan de progression écrit et une
 *     date de réexamen, il reste le plus souvent. L'engagement de chaque
 *     candidat (baromètre sur 10) encaisse la déception du comité et ce que
 *     le directeur en fait ; le risque de démission se lit sur lui.
 *   · LA COMPENSATION SE SAIT. Une augmentation hors grille ou une prime
 *     discrète retient celui qui la reçoit, mais les augmentations se lisent
 *     dans Tempora (le coût des ressources) et la rumeur fait le reste : les
 *     autres la découvrent, souvent, et demandent un rattrapage. Une promesse
 *     de promotion pour l'an prochain retient aussi, et coûte ce que coûte
 *     une promesse que le comité ne tient pas deux fois sur trois.
 *   · LES DÉPARTS SONT TIRÉS AU HASARD selon l'engagement : le premier
 *     non-retenu décide en semaine 10, le second en semaine 12.
 *
 * L'OBJECTIF, en euros : la valeur de l'équipe sur le trimestre et l'année
 * suivante, telle que les sources permettent de l'estimer en semaine 13 :
 *
 *   contribution du trimestre (chiffre d'affaires facturé moins salaires
 *   chargés, moins les jours du directeur et des seniors pris hors mission)
 *   − 48 k€ par démission, provisionnés dès qu'elle est remise (honoraires du
 *     recrutement, vacance du poste, intégration du remplaçant)
 *   − les engagements de l'année suivante : augmentation hors grille et
 *     rattrapages, promesse de promotion (deux chances sur trois d'être
 *     rompue, donc un départ), formation du plan de progression
 *   − le coût attendu d'un manager mal préparé la première année (forfaits
 *     dépassés, analystes qui partent), selon sa préparation et sa prise de
 *     poste, et ce qu'a coûté le cadrage de sa première mission.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const EFFECTIF = 12;
/** Le TJM moyen de l'équipe, d'analyste à consultant senior. */
export const TJM_MOYEN = 900;
export const TJM_SENIOR = 1000;
export const TJM_DIRECTEUR = 1300;
export const OCCUPATION_CIBLE = 0.75;
export const JOURS_OUVRES_AN = 210;
/** Le salaire annuel brut d'un consultant senior, et celui de l'équipe en moyenne. */
export const SALAIRE_SENIOR = 62000;
export const SALAIRE_MOYEN = 50000;
/** Les charges patronales, en pourcentage du brut. */
export const CHARGES = 45;
export const charge = (brut: number) => (brut * (100 + CHARGES)) / 100;

/** Le chiffre d'affaires d'une semaine pleine à 75 % d'occupation, et la masse salariale chargée. */
export const CA_NOMINAL = EFFECTIF * 5 * OCCUPATION_CIBLE * TJM_MOYEN;
export const SALAIRES_SEMAINE = (EFFECTIF * charge(SALAIRE_MOYEN)) / 52;

/** Ce qu'un consultant senior rapporte par an et par semaine : facturé, moins son salaire chargé. */
export const CONTRIBUTION_SENIOR_AN =
  JOURS_OUVRES_AN * OCCUPATION_CIBLE * TJM_SENIOR - charge(SALAIRE_SENIOR);
export const CONTRIBUTION_SENIOR_SEMAINE = CONTRIBUTION_SENIOR_AN / 52;

/** Le départ d'un consultant senior, tel que le contrôle de gestion l'a chiffré. */
export const DEPART = {
  /** Les honoraires du cabinet de recrutement, en part du salaire annuel brut. */
  honoraires: 0.2,
  /** Les semaines de vacance avant l'arrivée du remplaçant. */
  vacance: 12,
  /** Les jours facturables que le remplaçant ne fait pas pendant son intégration. */
  integration: 20,
} as const;
export const COUT_DEPART =
  DEPART.honoraires * SALAIRE_SENIOR +
  DEPART.vacance * CONTRIBUTION_SENIOR_SEMAINE +
  DEPART.integration * TJM_SENIOR;

/** Ce qu'a coûté, la première année, un manager promu sans avoir jamais piloté de mission. */
export const COUT_MAL_PREPARE = 60000;
/** Le cadrage de la première mission d'un nouveau manager : un client qui réduit le périmètre. */
export const CADRAGE_RATE = 30000;
/** Deux promesses de promotion sur trois n'ont pas été tenues à Paris : un départ, deux fois sur trois. */
export const PROMESSE_ROMPUE = 2 / 3;
export const COUT_PROMESSE = PROMESSE_ROMPUE * COUT_DEPART;
/** L'augmentation hors grille demandée, et le rattrapage que deux autres seniors obtiennent. */
export const HORS_GRILLE = 0.08;
export const RATTRAPAGE = 0.04;
export const COUT_HORS_GRILLE = charge(HORS_GRILLE * SALAIRE_SENIOR);
export const COUT_RATTRAPAGE = 2 * charge(RATTRAPAGE * SALAIRE_SENIOR);
export const PRIME = 5000;
export const COUT_PRIME = charge(PRIME);
/** La formation au pilotage de mission du plan de progression. */
export const FORMATION = 2800;
/** La manager expérimentée en binôme : quatre jours sur le trimestre suivant. */
export const BINOME = 4 * 1100;
/** Le directeur qui garde le pilotage en janvier : huit jours d'avant-vente perdus. */
export const PILOTAGE_GARDE = 8 * TJM_DIRECTEUR;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un jour du directeur non facturé. */
export const PERTE_PAR_JOUR = TJM_DIRECTEUR;

/** Les candidats, par leur place dans les tableaux. */
export const C = { elric: 0, tahina: 1, vasco: 2 } as const;
export const NOMS = ["Elric", "Tahina", "Vasco"] as const;
export const NOMS_COMPLETS = ["Elric Mérindol", "Tahina Rakotoarisoa", "Vasco Tanneau"] as const;
/** La capacité à encadrer que montrent les faits de l'année, de 0 à 1. */
export const PREPARATION = [0.3, 0.85, 0.55] as const;
/** Ce que pèse chacun au comité quand on n'y apporte pas de faits : la notoriété et les soutiens. */
export const SOUTIEN = [1.0, 0.5, 1.6] as const;
/** La déception d'un candidat non retenu, en points d'engagement. */
export const DECEPTION = [2.0, 2.5, 1.5] as const;
/** L'attrait du marché pour chacun : Halden Partners et Kéroual Consulting recrutent des seniors. */
export const ATTRAIT = [1.1, 1.2, 0.9] as const;
export const ENGAGEMENT_DEPART = 7;
/** Au-dessus de ce niveau d'engagement, un non-retenu ne cherche plus ailleurs. */
export const SEUIL_ENGAGEMENT = 7.5;

/** Les semaines où les choses se jouent. */
export const SEMAINE = {
  entretiens: 3,
  comite: 6,
  annonce: 7,
  compensation: 9,
  rumeur: 10,
  premierDepart: 10,
  secondDepart: 12,
  cadrage: 12,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  dossier: 0,
  entretiens: 1,
  comite: 2,
  annonce: 3,
  compensation: 4,
  priseDePoste: 5,
} as const;

/** Ne rien changer, décision par décision : les habitudes du bureau. */
export const NEUTRE = [3, 2, 3, 0, 3, 0] as const;

/** La qualité du dossier selon la préparation de la semaine 1 : des faits, ou des adjectifs. */
export const QUALITE_DU_DOSSIER = [0.25, 1, 0.45, 0.15] as const;
/** L'usage qu'on fait du dossier au comité : défendre un nom, argumenter, négocier, ne rien dire. */
export const USAGE_AU_COMITE = [0.35, 1, 0.4, 0.25] as const;
/** Une fois sur… Bathilde accepte l'échange : Vasco cette année, Elric l'an prochain. */
export const ACCORD_BATHILDE = 0.6;
/** La découverte d'une compensation hors critères : augmentation hors grille, prime discrète. */
export const DECOUVERTE = { augmentation: 0.7, prime: 0.5 } as const;

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
  effet: { occupation?: number; attrait?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "suspension",
    titre: "Une mission suspendue",
    de: "Laiteries Brévallon",
    role: "Direction industrielle",
    texte:
      "Brévallon gèle ses dépenses de conseil jusqu'à la clôture de son budget : la mission s'arrête deux semaines, et trois consultants passent en intercontrat.",
    duree: 2,
    effet: { occupation: 0.9 },
  },
  {
    id: "grippe",
    titre: "La grippe au bureau",
    de: "Séverine Le Duigou",
    role: "Responsable RH, bureau de Paris",
    texte:
      "La grippe touche l'équipe : deux consultants absents en moyenne pendant deux semaines, des jours facturables perdus.",
    duree: 2,
    effet: { occupation: 0.93 },
  },
  {
    id: "avenant",
    titre: "Un avenant signé",
    de: "Wassila Mokrane",
    role: "Manager, practice Performance opérationnelle",
    texte:
      "La Banque de l'Erdre signe un avenant sur la mission de ses back-offices : trois semaines de plus pour deux consultants.",
    duree: 3,
    effet: { occupation: 1.05 },
  },
  {
    id: "greve",
    titre: "Grève des transports",
    de: "Séverine Le Duigou",
    role: "Responsable RH, bureau de Paris",
    texte:
      "Grève dans les transports franciliens : les ateliers chez les clients sont décalés, la semaine se fait à moitié à distance.",
    duree: 1,
    effet: { occupation: 0.94 },
  },
  {
    id: "halden",
    titre: "Halden Partners recrute à Paris",
    de: "Wassila Mokrane",
    role: "Manager, practice Performance opérationnelle",
    texte:
      "Halden Partners annonce trente recrutements à Paris, dont des managers : leurs chasseurs appellent déjà nos seniors.",
    duree: 13,
    effet: { attrait: 1.3 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit de l'occupation, semaine par semaine. */
  semaines: readonly (number | null)[];
  uComite: number;
  uBathilde: number;
  uDecouverte: number;
  uPremier: number;
  uSecond: number;
  uCadrage: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000721 + 7);
  const semaines: (number | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push(Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))));
  }
  const uComite = r();
  const uBathilde = r();
  const uDecouverte = r();
  const uPremier = r();
  const uSecond = r();
  const uCadrage = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uComite, uBathilde, uDecouverte, uPremier, uSecond, uCadrage, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le creux de fin d'année et le rush des clients privés qui bouclent leurs budgets. */
export const SAISON = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.04, 1.04, 0.92, 0.55] as const;

/* ---------------------------------------------------------------------------
 * LE COMITÉ DE PROMOTION.
 * ------------------------------------------------------------------------- */

/** Le poids des faits au comité : leur qualité (semaine 1, entretiens) fois l'usage qu'on en fait. */
export function poidsDesFaits(chemin: readonly number[]): number {
  const qualite = Math.max(
    0.05,
    QUALITE_DU_DOSSIER[chemin[D.dossier]!]! - (chemin[D.entretiens] === 3 ? 0.1 : 0),
  );
  return qualite * USAGE_AU_COMITE[chemin[D.comite]!]!;
}

/** Ce que pèse chaque candidat au comité, hors accord avec Bathilde. */
export function poidsAuComite(chemin: readonly number[], bathildeFroissee = false): number[] {
  const f = poidsDesFaits(chemin);
  // Le directeur qui porte Elric ajoute son poids au sien ; Bathilde éconduite pousse plus fort.
  const pousse =
    (chemin[D.dossier] === 0 ? 0.6 : 0) +
    (chemin[D.entretiens] === 0 ? 0.6 : 0) +
    (chemin[D.comite] === 0 ? 2 : 0);
  const soutien = [SOUTIEN[0] + pousse, SOUTIEN[1], SOUTIEN[2] + (bathildeFroissee ? 0.3 : 0)];
  return soutien.map((s, i) => (1 - f) * s + f * 10 * Math.max(0, PREPARATION[i]! - 0.5));
}

/** Les chances de chacun au comité, sans accord avec Bathilde. */
export function chancesAuComite(chemin: readonly number[], bathildeFroissee = false): number[] {
  const w = poidsAuComite(chemin, bathildeFroissee);
  const total = w.reduce((s, x) => s + x, 0);
  return w.map((x) => x / total);
}

/** Bathilde accepte-t-elle l'échange ? Seul le choix de le lui proposer compte. */
export const bathildeAccepte = (graine: number) => hasard(graine).uBathilde < ACCORD_BATHILDE;

export interface Comite {
  promu: number;
  /** L'échange avec Bathilde : `null` s'il n'a pas été proposé. */
  accord: boolean | null;
}

export function comite(chemin: readonly number[], graine: number): Comite {
  const h = hasard(graine);
  if (chemin[D.comite] === 2 && bathildeAccepte(graine)) return { promu: C.vasco, accord: true };
  const accord = chemin[D.comite] === 2 ? false : null;
  const p = chancesAuComite(chemin, accord === false);
  const promu = h.uComite < p[0]! ? 0 : h.uComite < p[0]! + p[1]! ? 1 : 2;
  return { promu, accord };
}

/** Le risque qu'un non-retenu démissionne, lu sur son engagement. */
export const risqueDeDepart = (engagement: number, attrait: number) =>
  Math.min(0.75, 0.04 + attrait * 0.11 * Math.max(0, SEUIL_ENGAGEMENT - engagement));

export type Semaine = {
  /** La valeur de l'équipe estimée à date : contribution cumulée moins provisions. */
  valeur: number;
  /** La contribution cumulée du trimestre : facturé moins salaires et jours hors mission. */
  contribution: number;
  occupation: number;
  /** L'engagement moyen des trois candidats, sur 10. */
  engagement: number;
  eElric: number;
  eTahina: number;
  eVasco: number;
  departs: number;
  /** Les provisions cumulées : départs, engagements de l'année suivante. */
  provisions: number;
  /** Ce que la semaine a ajouté à la valeur. */
  variation: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  objectif: number;
  chemin: readonly number[];
  promu: number;
  accord: boolean | null;
  /** Le non-retenu le plus exposé, puis l'autre. */
  premier: number;
  second: number;
  /** À qui l'on a promis la promotion de l'an prochain, s'il y a lieu. */
  promis: number | null;
  /** La compensation hors critères a-t-elle été découverte ? `null` : aucune. */
  decouverte: boolean | null;
  partis: readonly number[];
  cadrageRate: boolean;
  contribution: number;
  provisions: number;
  /** Le coût attendu du manager la première année, estimé en semaine 13. */
  coutManager: number;
  engagementFinal: number;
}

/** Les deux non-retenus : le plus exposé d'abord (Elric, sinon Tahina). */
export const nonRetenus = (promu: number): [number, number] =>
  promu === C.elric ? [C.tahina, C.vasco] : [C.elric, promu === C.tahina ? C.vasco : C.tahina];

/** L'engagement de chacun en fin de semaine `w`, avant toute démission. */
function engagements(
  chemin: readonly number[],
  w: number,
  promu: number,
  promis: number | null,
  decouverte: boolean,
): number[] {
  const [d1, d2, , d4, d5] = chemin;
  const [premier, second] = nonRetenus(promu);
  return [0, 1, 2].map((i) => {
    let e = ENGAGEMENT_DEPART;
    if (w >= SEMAINE.entretiens) {
      if (d2 === 0) e += i === C.elric ? 0.5 : -0.8;
      if (d2 === 1) e -= 0.3;
      if (d2 === 3) e -= 0.3;
    }
    if (w >= SEMAINE.annonce) {
      if (i === promu) {
        e += 1.5;
      } else {
        e -= DECEPTION[i]!;
        if (d2 === 0 && i === C.elric) e -= 1.5;
        if (d2 === 1) e += d1 === 1 ? 1.2 : 0.5;
        if (d2 === 3) e -= 0.4;
        // Défendre Elric contre les faits se sait : le comité n'est pas étanche.
        if (chemin[D.comite] === 0 && i !== C.elric) e -= 0.8;
        // Sans recommandation, personne n'a été défendu : chacun le comprend.
        if (chemin[D.comite] === 3) e -= 0.6;
        if (d4 === 0) e -= 1;
        if (d4 === 1) e += d1 === 1 ? 1.6 : 0.9;
        if (d4 === 2) e -= 1.4;
        if (promis !== null) e += i === promis ? 2.5 : -0.8;
      }
    }
    if (w >= SEMAINE.compensation && i === premier) {
      if (d5 === 0) e += 1.5;
      if (d5 === 1) e += d4 === 1 ? 1.4 : 0.8;
      if (d5 === 2) e += 1;
      if (d5 === 3) e -= 0.6;
    }
    if (w >= SEMAINE.rumeur && decouverte) {
      if (i === second) e -= 1.5;
      if (i === promu) e -= 0.8;
    }
    return Math.min(10, Math.max(0, e));
  });
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, , d3, d4, d5, d6] = chemin;
  const { promu, accord } = comite(chemin, graine);
  const [premier, second] = nonRetenus(promu);
  const promis = accord === true ? C.elric : d4 === 3 ? premier : null;
  const compense = d5 === 0 || d5 === 2;
  const decouverte = compense
    ? h.uDecouverte < (d5 === 0 ? DECOUVERTE.augmentation : DECOUVERTE.prime)
    : null;
  const preparation = PREPARATION[promu]!;
  const facteurManager = [1.2, 0.35, 0.6][d6!]!;
  const chanceRate = (1 - preparation) * [0.9, 0.5, 0][d6!]!;
  const cadrageRate = h.uCadrage < chanceRate;
  const coutManager = COUT_MAL_PREPARE * (1 - preparation) * facteurManager;

  const semaines: (Semaine | null)[] = [null];
  const partis: number[] = [];
  const pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let contribution = -pertes;
  let provisions = 0;
  let valeurPrecedente = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const e = engagements(chemin, w, promu, promis, decouverte === true);

    // Les démissions : le plus exposé en semaine 10, l'autre en semaine 12.
    const attrait = actifs.reduce((a, i) => a * (i.imprevu.effet.attrait ?? 1), 1);
    if (w === SEMAINE.premierDepart) {
      if (h.uPremier < risqueDeDepart(e[premier]!, ATTRAIT[premier]! * attrait)) {
        partis.push(premier);
        provisions += COUT_DEPART;
      }
    }
    if (w === SEMAINE.secondDepart) {
      if (h.uSecond < risqueDeDepart(e[second]!, ATTRAIT[second]! * attrait)) {
        partis.push(second);
        provisions += COUT_DEPART;
      }
    }

    // Ce que l'équipe facture : la saison, le hasard, les imprévus, l'engagement des seniors.
    let occupation = OCCUPATION_CIBLE * SAISON[w]! * h.semaines[w]!;
    for (const a of actifs) occupation *= a.imprevu.effet.occupation ?? 1;
    let ca = (CA_NOMINAL * occupation) / OCCUPATION_CIBLE;
    for (let i = 0; i < 3; i += 1) {
      const facture = 5 * occupation * TJM_SENIOR;
      ca += facture * 0.03 * (e[i]! - ENGAGEMENT_DEPART);
      if (partis.includes(i)) ca -= facture * 0.2; // en préavis, la tête ailleurs
    }

    // Les jours pris hors mission, et ce que coûtent les mesures.
    let cout = SALAIRES_SEMAINE;
    if (d1 === 1 && w <= 2) cout += 2 * TJM_DIRECTEUR;
    if (d1 === 2 && w === 2) cout += 3 * TJM_SENIOR;
    if ((d3 === 0 || d3 === 1) && w === 5) cout += TJM_DIRECTEUR;
    if (d4 === 1 && w === SEMAINE.annonce) cout += TJM_DIRECTEUR;
    contribution += ca - cout;

    // Les engagements de l'année suivante, provisionnés quand on les prend.
    if (w === SEMAINE.comite && accord === true) provisions += COUT_PROMESSE;
    if (w === SEMAINE.annonce && d4 === 3 && accord !== true) provisions += COUT_PROMESSE;
    if (w === SEMAINE.compensation) {
      if (d5 === 0) provisions += COUT_HORS_GRILLE;
      if (d5 === 1) provisions += FORMATION;
      if (d5 === 2) provisions += COUT_PRIME;
    }
    if (w === SEMAINE.rumeur && decouverte) provisions += COUT_RATTRAPAGE;
    if (w === SEMAINE.cadrage) {
      if (d6 === 1) provisions += BINOME;
      if (d6 === 2) provisions += PILOTAGE_GARDE;
      if (cadrageRate) provisions += CADRAGE_RATE;
    }
    if (w === SEMAINES) provisions += coutManager;

    const valeur = contribution - provisions;
    semaines.push({
      valeur,
      contribution,
      occupation,
      engagement: (e[0]! + e[1]! + e[2]!) / 3,
      eElric: e[0]!,
      eTahina: e[1]!,
      eVasco: e[2]!,
      departs: partis.length,
      provisions,
      variation: valeur - valeurPrecedente,
    });
    valeurPrecedente = valeur;
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: fin.valeur,
    chemin: [...chemin],
    promu,
    accord,
    premier,
    second,
    promis,
    decouverte,
    partis,
    cadrageRate,
    contribution: fin.contribution,
    provisions: fin.provisions,
    coutManager,
    engagementFinal: fin.engagement,
  };
}

/** Ce qui s'est passé pendant des semaines : le comité, les démissions, la rumeur, le cadrage. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    comite: dans(SEMAINE.comite),
    premierPart: t.partis.includes(t.premier) && dans(SEMAINE.premierDepart),
    premierReste: !t.partis.includes(t.premier) && dans(SEMAINE.premierDepart),
    secondPart: t.partis.includes(t.second) && dans(SEMAINE.secondDepart),
    decouverte: t.decouverte === true && dans(SEMAINE.rumeur),
    cadrage: chemin[D.priseDePoste] !== 2 && dans(SEMAINE.cadrage),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** Le budget de contribution du trimestre, et la valeur que la direction attend. */
export const BUDGET_CONTRIBUTION = 290000;
export const OBJECTIF_VALEUR = 260000;

export interface LectureEquipe {
  valeur: number | null;
  contribution: number | null;
  budgetADate: number | null;
  occupation: number | null;
  engagement: number | null;
  departs: number | null;
  eElric: number | null;
  eTahina: number | null;
  eVasco: number | null;
  /** Le promu (0, 1, 2), une fois le comité passé ; −1 avant. */
  promu: number | null;
  premier: number | null;
  second: number | null;
  accord: number | null;
  promis: number | null;
  premierParti: number | null;
  decouverte: number | null;
}

/** Ce que Noé lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEquipe {
  if (semaine === 0) {
    return {
      valeur: 0,
      contribution: 0,
      budgetADate: 0,
      occupation: 0.74,
      engagement: ENGAGEMENT_DEPART,
      departs: 0,
      eElric: ENGAGEMENT_DEPART,
      eTahina: ENGAGEMENT_DEPART,
      eVasco: ENGAGEMENT_DEPART,
      promu: -1,
      premier: -1,
      second: -1,
      accord: -1,
      promis: -1,
      premierParti: 0,
      decouverte: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const apresComite = semaine >= SEMAINE.comite;
  return {
    valeur: s.valeur,
    contribution: s.contribution,
    budgetADate: (BUDGET_CONTRIBUTION * semaine) / SEMAINES,
    occupation: s.occupation,
    engagement: s.engagement,
    departs: s.departs,
    eElric: s.eElric,
    eTahina: s.eTahina,
    eVasco: s.eVasco,
    promu: apresComite ? t.promu : -1,
    premier: apresComite ? t.premier : -1,
    second: apresComite ? t.second : -1,
    accord: t.accord === null || !apresComite ? -1 : t.accord ? 1 : 0,
    promis: t.promis === null || semaine < SEMAINE.annonce ? -1 : t.promis,
    premierParti: semaine >= SEMAINE.premierDepart && t.partis.includes(t.premier) ? 1 : 0,
    decouverte: semaine >= SEMAINE.rumeur && t.decouverte ? 1 : 0,
  };
}
