/**
 * LES CHAMBRES QU'ON BRADE — le modèle du revenue management de L'Escale Lac.
 *
 * Un hôtel 4 étoiles de 84 chambres au bord du lac d'Annecy, d'avril à juin :
 * les vacances de printemps, quatre ponts de mai, l'avant-saison de juin — et,
 * pendant ces treize semaines, une bonne part de juillet-août qui se réserve.
 * Six décisions. Trois mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · UNE BAISSE GÉNÉRALE PAIE SURTOUT CEUX QUI SERAIENT VENUS. La chambre de
 *     ce soir ne se stocke pas, d'où la tentation de baisser dès que le
 *     rythme des réservations (le pick-up) paraît en retard. Mais sur les
 *     ponts et les week-ends, l'hôtel est plein ou presque : une baisse n'y
 *     ajoute aucune nuitée et retire 15 % de chaque nuitée qu'on aurait vendue
 *     de toute façon. Faite sur les seules plateformes, elle rend Bookalia et
 *     Voyagio moins chers que le site : la moitié des clients qui réservaient
 *     en direct passent par elles, et l'hôtel leur paie 17 % de commission.
 *     Le taux d'occupation monte un peu ; le revenu net baisse.
 *   · CHAQUE SEGMENT A SA FENÊTRE DE RÉSERVATION. Les clients des ponts et de
 *     l'été réservent tôt et regardent peu le prix ; la dernière minute de
 *     semaine réserve à quelques jours et y est sensible. Un retard global du
 *     pick-up se lit segment par segment et canal par canal : ici, il vient
 *     d'un séminaire de l'an dernier non reconduit et de nuits de semaine qui
 *     ne se réservent jamais si tôt. Les RESTRICTIONS valent plus qu'une
 *     baisse : une durée minimale de séjour sur les ponts supprime les nuits
 *     orphelines, et un tarif non remboursable sur les nuits de semaine
 *     attire les clients sensibles au prix sans rien céder aux autres.
 *   · LE DIRECT SE CONSTRUIT LENTEMENT. Un tarif membre sur le site — les prix
 *     publics restant les mêmes partout, la parité est respectée — déplace
 *     une part des réservations hors commission, montée progressive comprise.
 *     Il ne vaut rien si les plateformes affichent moins cher que le site, et
 *     il donne ensuite à l'hôtel un fichier à qui proposer ses nuits creuses.
 *
 * Le hasard tire, d'avance : la demande semaine par semaine, un ou deux
 * imprévus, le SCÉNARIO DE L'ÉTÉ (plein, normal ou creux, environ trois fois,
 * cinq fois et deux fois sur dix), la réponse de l'autocariste à une
 * contre-proposition, la patience du tour-opérateur, et la réaction de
 * Bookalia si le site affiche moins cher qu'elle.
 *
 * L'OBJECTIF est le revenu hébergement net de commissions : celui des séjours
 * d'avril à juin, plus celui de l'été tel qu'on peut l'estimer fin juin, moins
 * ce que coûtent les actions et l'enquête. L'été est estimé sur la saison
 * entière : les nuitées déjà réservées à leur prix, celles qui restent à
 * vendre au rythme du scénario que le trimestre a révélé, avec la grille, les
 * restrictions, les canaux et l'allotement décidés. Les nuitées et les prix
 * sont nets de commission (17 % sur les plateformes) et des frais du site
 * (3 %) ; un groupe ou un tour-opérateur paie un prix net.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CHAMBRES = 84;
export const NUITS_DU_TRIMESTRE = 91;
/** La commission de Bookalia et de Voyagio. */
export const COMMISSION = 0.17;
/** La commission de Bookalia avec le programme Préférence. */
export const COMMISSION_PREFERENCE = 0.2;
/** La part de Bookalia dans les nuitées vendues par les plateformes ; Voyagio fait le reste. */
export const PART_BOOKALIA = 0.6;
/** Ce que coûte une réservation sur le site : moteur de réservation et paiement. */
export const COUT_DIRECT = 0.03;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les demandes de groupes attendent et les grilles restent figées. */
export const PERTE_PAR_JOUR = 1500;

export type TypeDeNuit = "pont" | "weekend" | "semaine";
export const TYPES: readonly TypeDeNuit[] = ["pont", "weekend", "semaine"];

/**
 * Les nuits de chaque semaine, par type. Le 1er et le 8 mai tombent un vendredi,
 * l'Ascension le jeudi 14 mai, la Pentecôte le lundi 25 : douze nuits de ponts.
 */
export const NUITS: Record<TypeDeNuit, readonly number[]> = {
  pont: [0, 0, 0, 0, 0, 3, 3, 4, 2, 0, 0, 0, 0, 0],
  weekend: [0, 2, 2, 2, 2, 0, 0, 0, 1, 2, 2, 2, 2, 2],
  semaine: [0, 5, 5, 5, 5, 4, 4, 3, 4, 5, 5, 5, 5, 5],
};
/** Le prix public moyen d'une chambre, par type de nuit, petit-déjeuner compris. */
export const PRIX: Record<TypeDeNuit, number> = { pont: 262, weekend: 212, semaine: 158 };
/** La demande de clients individuels par nuit, au prix public, avant toute limite de chambres. */
export const DEMANDE: Record<TypeDeNuit, readonly number[]> = {
  pont: [0, 0, 0, 0, 0, 98, 96, 102, 94, 0, 0, 0, 0, 0],
  weekend: [0, 62, 68, 66, 58, 0, 0, 0, 70, 70, 72, 75, 77, 80],
  semaine: [0, 32, 40, 38, 30, 34, 34, 36, 32, 36, 38, 40, 42, 46],
};
/** La part des nuitées vendues par Bookalia et Voyagio. */
export const PART_PLATEFORMES: Record<TypeDeNuit, number> = {
  pont: 0.55,
  weekend: 0.55,
  semaine: 0.65,
};
/** La sensibilité au prix : ce que 1 % de prix en plus fait perdre de demande, en %. */
export const ELASTICITE: Record<TypeDeNuit, number> = { pont: -0.5, weekend: -0.6, semaine: -1.3 };
/**
 * La fenêtre de réservation, en semaines : la part des nuitées déjà réservées
 * quand il reste L semaines est exp(−L / fenêtre).
 */
export const FENETRE: Record<TypeDeNuit, number> = { pont: 6, weekend: 3.5, semaine: 1.2 };
/** L'occupation la plus haute qu'on atteint : au-delà, des nuits orphelines restent vides. */
export const PLAFOND: Record<TypeDeNuit, number> = { pont: 0.92, weekend: 0.97, semaine: 0.98 };
/** Avec une durée minimale de séjour, les ponts se remplissent sans nuits orphelines. */
export const PLAFOND_PONTS_DUREE_MIN = 0.99;
/** Les nuitées de groupes déjà contractées, sur les nuits de semaine. */
export const GROUPES: readonly number[] = [0, 50, 40, 60, 70, 50, 60, 30, 60, 70, 60, 70, 60, 50];
export const PRIX_GROUPE = 139;
/** Le séminaire de l'an dernier (semaine 6), non reconduit cette année. */
export const SEMINAIRE_PERDU = { semaine: 6, nuitees: 210 } as const;
/** La demande de l'an dernier, rapportée à celle de cette année : les ponts tombaient moins bien. */
export const AN_DERNIER: Record<TypeDeNuit, number> = { pont: 0.94, weekend: 0.99, semaine: 1.03 };
/** Les annulations tardives des réservations des plateformes, en semaine et le week-end. */
export const ANNULATIONS = { taux: 0.08, nonRevendues: 0.5 } as const;

/** Les leviers de la première décision. */
export const BAISSE_PLATEFORMES = 0.15;
/** La part des clients du site qui comparent avec les plateformes et y réservent si elles sont moins chères. */
export const COMPARENT = 0.5;
export const BAISSE_GENERALE = 0.1;
export const NON_REMBOURSABLE = { remise: 0.1, part: 0.35, volume: 0.06 } as const;

/** Bookalia Préférence : trois points de commission en plus pour un meilleur classement. */
export const PREFERENCE = { visibilite: 0.04, bascule: 0.08 } as const;
/** Le tarif membre : −5 % pour les inscrits, montée sur huit semaines. */
export const MEMBRE = {
  remise: 0.05,
  bascule: 0.25,
  montee: 8,
  adhesion: 0.2,
  cout: 3000,
} as const;
/** Des prix publics plus bas sur le site que sur les plateformes. */
export const SITE_MOINS_CHER = {
  remise: 0.08,
  bascule: 0.35,
  montee: 3,
  cout: 1000,
  represailles: 0.6,
  /** Ce qui reste des réservations Bookalia quand l'hôtel recule dans son classement. */
  effet: 0.85,
  des: 7,
} as const;

/** Le groupe d'Autocars Brenval : trois nuits, sur le pont de l'Ascension ou la semaine suivante. */
export const BRENVAL = {
  chambres: 36,
  nuits: 3,
  prix: 145,
  contre: 150,
  accepte: 0.55,
  semainePont: 7,
  semaineContre: 8,
  reservation: 3,
} as const;

/** La fin juin : vente flash, offre aux membres, journées d'étude. */
export const VENTE_FLASH = 0.25;
export const OFFRE_MEMBRES = {
  remise: 0.15,
  avecMembres: 0.2,
  sansMembres: 0.05,
  prise: 0.15,
} as const;
export const JOURNEES_ETUDE = {
  prix: 145,
  nuitees: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 24],
} as const;

/** L'été : 62 nuits, de juillet à fin août. */
export const ETE = {
  nuits: 62,
  prix: 285,
  partPlateformes: 0.5,
  plafond: 0.95,
  elasticite: -1,
  /** La part des nuitées d'été réservée avant avril, puis chaque semaine du trimestre. */
  avant: 0.28,
  parSemaine: 0.03,
} as const;
export const CAPACITE_ETE = CHAMBRES * ETE.nuits;

export interface Scenario {
  id: "plein" | "normal" | "creux";
  nom: string;
  chance: number;
  /** Les nuitées d'été que les clients individuels demanderaient au prix de la grille. */
  demande: number;
  /** La demande de juin suit l'été. */
  juin: number;
  /** Le pick-up d'été sur l'an dernier, tel qu'il se lit à partir de fin mai. */
  pickup: number;
  /** La part de l'allotement que le tour-opérateur remplit, et celle des chambres rendues que l'hôtel revend. */
  usage: number;
  revente: number;
}
export const SCENARIOS: readonly Scenario[] = [
  {
    id: "plein",
    nom: "plein",
    chance: 0.3,
    demande: 5400,
    juin: 1.03,
    pickup: 0.09,
    usage: 0.85,
    revente: 0.8,
  },
  {
    id: "normal",
    nom: "normal",
    chance: 0.5,
    demande: 4750,
    juin: 1,
    pickup: 0.01,
    usage: 0.75,
    revente: 0.5,
  },
  {
    id: "creux",
    nom: "creux",
    chance: 0.2,
    demande: 4250,
    juin: 0.95,
    pickup: -0.11,
    usage: 0.6,
    revente: 0.2,
  },
];

/** L'allotement de Meerland Reizen pour juillet-août. */
export const ALLOTEMENT = { chambres: 12, prix: 155, release: 21, semaine: 7 } as const;
/** L'analyse du pick-up d'été par marché, et la patience de Meerland. */
export const ANALYSE = { cout: 1500, attente: 0.65 } as const;
/** Revoir l'été date par date, selon le scénario que le pick-up révèle. */
export const ADAPTE: readonly { prix: number; volume: number; plafond: number }[] = [
  { prix: 1.1, volume: 1 / 1.1, plafond: 0.975 },
  { prix: 1.03, volume: 1, plafond: 0.965 },
  { prix: 0.965, volume: 1.07, plafond: 0.95 },
];
export const HAUSSE_ETE = 0.1;

/** Les budgets : le trimestre, et l'été tel que le siège l'a construit en mars. */
export const BUDGET_TRIMESTRE = 880000;
export const BUDGET_ETE = 1230000;
/** Le RevPAR moyen du budget, d'avril à juin. */
export const REVPAR_BUDGET = 128;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  pickup: 0,
  groupe: 1,
  direct: 2,
  allotement: 3,
  ete: 4,
  juin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 1, 3, 1, 0, 3] as const;

/** La semaine à partir de laquelle chaque décision s'applique aux réservations. */
export const EFFET = [1, 3, 5, 7, 9, 11] as const;

/* ---------------------------------------------------------------------------
 * CE QUE LES SOURCES DE LA SEMAINE 1 PERMETTENT DE CALCULER.
 * ------------------------------------------------------------------------- */

/** Une nuitée vendue par les plateformes rapporte 83 % de son prix ; sur le site, 97 %. */
export const netPlateforme = (prix: number) => prix * (1 - COMMISSION);
export const netDirect = (prix: number) => prix * (1 - COUT_DIRECT);
export const NUITS_DE_PONTS = NUITS.pont.reduce((s, x) => s + x, 0);
/** Les nuitées de ponts que les plateformes vendent, à l'occupation de l'an dernier. */
export const NUITEES_PONTS_PLATEFORMES =
  NUITS_DE_PONTS * CHAMBRES * PLAFOND.pont * PART_PLATEFORMES.pont;
/** Ce que coûterait 15 % de moins sur ces nuitées, net de commission : la prévision de la semaine 1. */
export const PERTE_PONTS =
  NUITEES_PONTS_PLATEFORMES * PRIX.pont * BAISSE_PLATEFORMES * (1 - COMMISSION);

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
  effet: { types?: readonly TypeDeNuit[]; demande?: number; horsService?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "hosteo",
    titre: "Panne du gestionnaire de canaux",
    de: "Systèmes d'information",
    role: "Siège",
    texte:
      "Hostéo n'a plus parlé aux plateformes pendant deux jours : des chambres vendues deux fois, trois clients délogés à l'Orméa à nos frais, et des ventes perdues le temps de tout fermer.",
    duree: 1,
    effet: { demande: 0.92, cout: 2400 },
  },
  {
    id: "pluie",
    titre: "Des week-ends de pluie froide",
    de: "Réception",
    role: "L'Escale Lac",
    texte:
      "Pluie et 9 degrés annoncés deux week-ends de suite : les clients de dernière minute renoncent au lac.",
    duree: 2,
    effet: { types: ["pont", "weekend"], demande: 0.88 },
  },
  {
    id: "congres",
    titre: "Un congrès médical à Annecy",
    de: "Office de tourisme",
    role: "Annecy",
    texte:
      "Un congrès de cardiologie déplacé au dernier moment au centre de congrès : 1 400 participants cherchent une chambre en semaine.",
    duree: 1,
    effet: { types: ["semaine"], demande: 1.25 },
  },
  {
    id: "degat",
    titre: "Dégât des eaux au deuxième étage",
    de: "Service technique",
    role: "L'Escale Lac",
    texte:
      "Une colonne d'eau a cédé au deuxième étage : six chambres hors service pendant dix jours, le temps des séchages et des peintures.",
    duree: 2,
    effet: { horsService: 4.5, cout: 1800 },
  },
  {
    id: "greve",
    titre: "Grève du contrôle aérien",
    de: "Réception",
    role: "L'Escale Lac",
    texte:
      "Grève du contrôle aérien en Europe : les clients britanniques et néerlandais de la semaine annulent ou décalent leur séjour.",
    duree: 1,
    effet: { demande: 0.9 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Les écarts de demande, semaine par semaine et type de nuit. */
  semaines: readonly (Record<TypeDeNuit, number> | null)[];
  /** L'été : 0 plein, 1 normal, 2 creux. */
  scenario: number;
  /** Le bruit du pick-up d'été tant qu'il ne dit encore rien. */
  bruitEte: number;
  /** Brenval accepte-t-il les dates de semaine ? */
  uBrenval: number;
  /** Meerland attend-il l'analyse ? */
  uMeerland: number;
  /** Bookalia fait-elle reculer l'hôtel dans son classement ? */
  uBookalia: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000423 + 7);
  const semaines: (Record<TypeDeNuit, number> | null)[] = [null];
  const ecart = () => Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r)));
  for (let w = 1; w <= SEMAINES; w += 1) {
    semaines.push({ pont: ecart(), weekend: ecart(), semaine: ecart() });
  }
  // L'été se tire sur une suite régulière plutôt qu'au fil du générateur : les trente
  // tirages du bilan représentent alors les trois étés dans leurs proportions.
  const u = (graine * 0.6180339887 + 0.31) % 1;
  const scenario =
    u < SCENARIOS[0]!.chance ? 0 : u < SCENARIOS[0]!.chance + SCENARIOS[1]!.chance ? 1 : 2;
  const bruitEte = gauss(r);
  const uBrenval = r();
  const uMeerland = r();
  const uBookalia = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, scenario, bruitEte, uBrenval, uMeerland, uBookalia, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Brenval accepte la contre-proposition un peu plus d'une fois sur deux. */
export const brenvalAccepte = (graine: number) => hasard(graine).uBrenval < BRENVAL.accepte;
/** Où loge le groupe Brenval : sur le pont, la semaine suivante, ou ailleurs. */
export function groupeBrenval(
  chemin: readonly number[],
  graine: number,
): "pont" | "semaine" | null {
  if (chemin[D.groupe] === 0) return "pont";
  if (chemin[D.groupe] === 2 && brenvalAccepte(graine)) return "semaine";
  return null;
}
/** Meerland attend l'analyse environ deux fois sur trois ; sinon elle signe avec l'Orméa. */
export const meerlandAttend = (graine: number) => hasard(graine).uMeerland < ANALYSE.attente;
/** Les chambres d'allotement signées avec Meerland pour l'été. */
export function chambresAllouees(chemin: readonly number[], graine: number): number {
  const d = chemin[D.allotement];
  if (d === 0) return ALLOTEMENT.chambres;
  if (d === 2) return ALLOTEMENT.chambres / 2;
  if (d === 3 && meerlandAttend(graine)) {
    // L'analyse dit l'été : tout l'allotement s'il est creux, la moitié s'il est normal, rien s'il est plein.
    const s = hasard(graine).scenario;
    return s === 2 ? ALLOTEMENT.chambres : s === 1 ? ALLOTEMENT.chambres / 2 : 0;
  }
  return 0;
}
/** Un site moins cher que Bookalia : six fois sur dix, l'hôtel recule dans son classement. */
export const bookaliaSanctionne = (chemin: readonly number[], graine: number) =>
  chemin[D.direct] === 2 && hasard(graine).uBookalia < SITE_MOINS_CHER.represailles;

/* ---------------------------------------------------------------------------
 * LES RÉSERVATIONS, TRANCHE PAR TRANCHE.
 *
 * Les nuitées d'une semaine se réservent au fil des semaines qui la précèdent,
 * selon la fenêtre de chaque segment. Chaque tranche se réserve aux conditions
 * en vigueur cette semaine-là, et prend les chambres qui restent : quand
 * l'hôtel est plein, la demande d'une baisse tardive ne trouve plus de chambre,
 * mais la baisse a été payée sur toutes les nuitées vendues avant.
 * ------------------------------------------------------------------------- */

/** La part des nuitées déjà réservées quand il reste L semaines. */
export const dejaReserve = (type: TypeDeNuit, L: number) =>
  Math.exp(-Math.max(0, L) / FENETRE[type]);

interface Tranche {
  /** La semaine de réservation : 0 avant le trimestre. */
  b: number;
  demande: number;
  /** Les parts de la tranche : plateformes, site au prix public, site au tarif membre ou à l'offre. */
  plateformes: number;
  site: number;
  membres: number;
  prixPlateformes: number;
  prixSite: number;
  prixMembres: number;
  commission: number;
  /** La part des nuitées des plateformes annulées trop tard pour être revendues. */
  perte: number;
  /** Un groupe ou un tour-opérateur : un prix net, sans commission. */
  fixe?: { prix: number };
}

interface Rempli {
  chambres: number;
  brut: number;
  net: number;
  direct: number;
  transitoires: number;
}

/** Remplit les chambres dans l'ordre des réservations. */
function remplir(tranches: readonly Tranche[], capacite: number, prix: number) {
  let reste = Math.max(0, capacite);
  const parSemaine = new Map<number, number>();
  const total: Rempli = { chambres: 0, brut: 0, net: 0, direct: 0, transitoires: 0 };
  for (const t of tranches) {
    const prises = Math.min(t.demande, reste);
    reste -= prises;
    parSemaine.set(t.b, (parSemaine.get(t.b) ?? 0) + prises);
    if (prises <= 0) continue;
    if (t.fixe) {
      total.chambres += prises;
      total.brut += prises * t.fixe.prix;
      total.net += prises * t.fixe.prix;
      continue;
    }
    const parts = t.plateformes + t.site + t.membres;
    const p = (prises * t.plateformes) / parts;
    const s = (prises * t.site) / parts;
    const m = (prises * t.membres) / parts;
    const vendues = p * (1 - t.perte);
    total.chambres += vendues + s + m;
    total.transitoires += vendues + s + m;
    total.direct += s + m;
    total.brut += prix * (vendues * t.prixPlateformes + s * t.prixSite + m * t.prixMembres);
    total.net +=
      prix *
      (vendues * t.prixPlateformes * (1 - t.commission) +
        (s * t.prixSite + m * t.prixMembres) * (1 - COUT_DIRECT));
  }
  return { ...total, parSemaine };
}

/** Les conditions d'une tranche de réservations : ce que les décisions en vigueur font au prix, au canal, au volume. */
function conditions(
  chemin: readonly number[],
  graine: number,
  b: number,
  type: TypeDeNuit | "ete",
  semaineSejour: number,
  base: number,
  scenario = hasard(graine).scenario,
): Tranche {
  const ete = type === "ete";
  const partPlat = ete ? ETE.partPlateformes : PART_PLATEFORMES[type];
  const e = ete ? ETE.elasticite : ELASTICITE[type];
  const t: Tranche = {
    b,
    demande: 0,
    plateformes: partPlat,
    site: 1 - partPlat,
    membres: 0,
    prixPlateformes: 1,
    prixSite: 1,
    prixMembres: 1,
    commission: COMMISSION,
    perte:
      type === "weekend" || type === "semaine" ? ANNULATIONS.taux * ANNULATIONS.nonRevendues : 0,
  };
  const [d1, , d3, , d5, d6] = chemin;

  // La première décision : les séjours d'avril à juin.
  if (!ete && b >= EFFET[D.pickup]) {
    if (d1 === 0) {
      t.plateformes *= (1 - BAISSE_PLATEFORMES) ** e;
      const passent = t.site * COMPARENT;
      t.site -= passent;
      t.plateformes += passent;
      t.prixPlateformes = 1 - BAISSE_PLATEFORMES;
    } else if (d1 === 1) {
      const v = (1 - BAISSE_GENERALE) ** e;
      t.plateformes *= v;
      t.site *= v;
      t.prixPlateformes = 1 - BAISSE_GENERALE;
      t.prixSite = 1 - BAISSE_GENERALE;
    } else if (d1 === 2 && type === "semaine") {
      const nr = NON_REMBOURSABLE;
      t.plateformes *= 1 + nr.volume;
      t.site *= 1 + nr.volume;
      t.prixPlateformes *= 1 - nr.part * nr.remise;
      t.prixSite *= 1 - nr.part * nr.remise;
      t.perte *= 1 - nr.part;
    }
  }

  // L'été, revu à partir de fin mai.
  if (ete && b >= EFFET[D.ete]) {
    if (d5 === 1) {
      const a = ADAPTE[scenario]!;
      t.plateformes *= a.volume;
      t.site *= a.volume;
      t.prixPlateformes *= a.prix;
      t.prixSite *= a.prix;
    } else if (d5 === 2) {
      t.plateformes *= (1 - BAISSE_PLATEFORMES) ** e;
      const passent = t.site * COMPARENT;
      t.site -= passent;
      t.plateformes += passent;
      t.prixPlateformes = 1 - BAISSE_PLATEFORMES;
    } else if (d5 === 3) {
      const v = (1 + HAUSSE_ETE) ** e;
      t.plateformes *= v;
      t.site *= v;
      t.prixPlateformes *= 1 + HAUSSE_ETE;
      t.prixSite *= 1 + HAUSSE_ETE;
    }
  }

  // Le canal direct, à partir de fin avril : il vaut pour le trimestre et pour l'été.
  if (b >= EFFET[D.direct]) {
    const sitePlusCher = !ete && d1 === 0;
    if (d3 === 0 && b <= SEMAINES + (ete ? 1 : 0)) {
      // Trois mois de programme : la moitié de l'été qui reste à vendre en profite encore.
      const part = b > SEMAINES ? 0.5 : 1;
      t.commission += part * PART_BOOKALIA * (COMMISSION_PREFERENCE - COMMISSION);
      t.plateformes *= 1 + part * PREFERENCE.visibilite;
      const passent = t.site * PREFERENCE.bascule * part;
      t.site -= passent;
      t.plateformes += passent;
    } else if (d3 === 1) {
      const montee = Math.min(1, (b - EFFET[D.direct] + 1) / MEMBRE.montee);
      const bascule = MEMBRE.bascule * montee * (sitePlusCher ? 0.2 : 1);
      const viennent = t.plateformes * bascule;
      const inscrits = t.site * MEMBRE.adhesion * montee;
      t.plateformes -= viennent;
      t.site -= inscrits;
      t.membres += viennent + inscrits;
      t.prixMembres = t.prixSite * (1 - MEMBRE.remise);
    } else if (d3 === 2) {
      const montee = Math.min(1, (b - EFFET[D.direct] + 1) / SITE_MOINS_CHER.montee);
      const bascule = SITE_MOINS_CHER.bascule * montee * (sitePlusCher ? 0.3 : 1);
      const viennent = t.plateformes * bascule;
      t.plateformes -= viennent;
      t.site += viennent;
      t.prixSite *= 1 - SITE_MOINS_CHER.remise;
      if (bookaliaSanctionne(chemin, graine) && b >= SITE_MOINS_CHER.des) {
        t.plateformes *= 1 - PART_BOOKALIA * (1 - SITE_MOINS_CHER.effet);
      }
    }
  }

  // La fin juin.
  if (!ete && b >= EFFET[D.juin] && semaineSejour >= EFFET[D.juin]) {
    if (d6 === 0 && type !== "pont") {
      const avant = t.prixPlateformes;
      const flash = 1 - VENTE_FLASH;
      t.plateformes *= (flash / avant) ** e;
      const passent = t.site * COMPARENT;
      t.site -= passent;
      t.plateformes += passent;
      t.prixPlateformes = flash;
    } else if (d6 === 1 && type === "semaine") {
      const o = OFFRE_MEMBRES;
      const nouveaux = d3 === 1 ? o.avecMembres : o.sansMembres;
      const prennent = t.site * o.prise;
      // Les membres et le site, mêlés : l'offre se paie au prix du site moins 15 %.
      const avantOffre = t.membres * t.prixMembres;
      t.site -= prennent;
      t.membres += prennent + nouveaux;
      t.prixMembres =
        (avantOffre + (prennent + nouveaux) * t.prixSite * (1 - o.remise)) / t.membres;
    }
  }

  t.demande = base * (t.plateformes + t.site + t.membres);
  return t;
}

export type Semaine = {
  /** Revenu par chambre disponible : chiffre d'affaires hébergement de la semaine, divisé par les chambres de la semaine. */
  revpar: number;
  /** Taux d'occupation. */
  to: number;
  /** Prix moyen des nuitées vendues. */
  pm: number;
  /** Le revenu hébergement de la semaine, net de commissions. */
  net: number;
  brut: number;
  chambres: number;
  /** La part des nuitées d'individuels vendues en direct. */
  direct: number;
  /** Le revenu net cumulé depuis avril, frais des actions déduits. */
  cumul: number;
  /** Les nuitées réservées pour le reste du trimestre, en fin de semaine, et l'écart à l'an dernier. */
  carnet: number;
  pickup: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le revenu hébergement net : le trimestre, plus l'été estimé fin juin, frais et enquête déduits. */
  objectif: number;
  revenuTrimestre: number;
  brutTrimestre: number;
  valeurEte: number;
  /** Ce que Meerland paie pour l'allotement. */
  revenuAllotement: number;
  couts: number;
  nuitees: number;
  revpar: number;
  to: number;
  pm: number;
  partDirecte: number;
  /** L'été : nuitées vendues aux individuels, et occupation estimée, allotement compris. */
  nuiteesEte: number;
  toEte: number;
  scenario: number;
  groupe: "pont" | "semaine" | null;
  allotement: number;
  meerlandParti: boolean;
  bookalia: boolean;
}

/** Les nuitées réservées pour une semaine de séjour, tranche par tranche, et son revenu. */
function semaineDeSejour(chemin: readonly number[], graine: number, w: number) {
  const h = hasard(graine);
  const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
  const horsService = actifs.reduce((s, a) => s + (a.imprevu.effet.horsService ?? 0), 0);
  const scenario = SCENARIOS[h.scenario]!;
  const groupe = groupeBrenval(chemin, graine);
  const parType = TYPES.map((type) => {
    const n = NUITS[type][w]!;
    if (n === 0) return null;
    let demande = DEMANDE[type][w]! * n * h.semaines[w]![type];
    if (w >= 9) demande *= scenario.juin;
    for (const a of actifs) {
      if (!a.imprevu.effet.types || a.imprevu.effet.types.includes(type)) {
        demande *= a.imprevu.effet.demande ?? 1;
      }
    }
    let plafond = PLAFOND[type];
    if (type === "pont" && chemin[D.pickup] === 2) {
      plafond += (PLAFOND_PONTS_DUREE_MIN - plafond) * (1 - dejaReserve("pont", w));
    }
    const capacite = n * (CHAMBRES - horsService) * plafond;
    const tranches: Tranche[] = [];
    const fixe = (b: number, chambres: number, prix: number): Tranche => ({
      b,
      demande: chambres,
      plateformes: 0,
      site: 0,
      membres: 0,
      prixPlateformes: 1,
      prixSite: 1,
      prixMembres: 1,
      commission: 0,
      perte: 0,
      fixe: { prix },
    });
    if (type === "semaine") tranches.push(fixe(0, GROUPES[w]!, PRIX_GROUPE));
    // La demande réservée pendant la semaine b : avant le trimestre (b = 0), tout ce qui
    // l'était déjà à w semaines du séjour ; ensuite, ce que chaque semaine ajoute.
    const reservee = (b: number) =>
      demande * (dejaReserve(type, w - b) - (b === 0 ? 0 : dejaReserve(type, w - b + 1)));
    for (let b = 0; b <= w; b += 1) {
      if (b === BRENVAL.reservation) {
        if (groupe === "pont" && type === "pont" && w === BRENVAL.semainePont) {
          tranches.push(fixe(b, BRENVAL.chambres * BRENVAL.nuits, BRENVAL.prix));
        }
        if (groupe === "semaine" && type === "semaine" && w === BRENVAL.semaineContre) {
          tranches.push(fixe(b, BRENVAL.chambres * BRENVAL.nuits, BRENVAL.contre));
        }
      }
      if (b === EFFET[D.juin] && type === "semaine" && chemin[D.juin] === 2) {
        const etude = JOURNEES_ETUDE.nuitees[w]!;
        if (etude > 0) tranches.push(fixe(b, etude, JOURNEES_ETUDE.prix));
      }
      tranches.push(conditions(chemin, graine, b, type, w, reservee(b)));
    }
    return { type, ...remplir(tranches, capacite, PRIX[type]) };
  }).filter((x) => x !== null);
  const cout = actifs
    .filter((a) => a.semaine === w)
    .reduce((s, a) => s + (a.imprevu.effet.cout ?? 0), 0);
  return { parType, cout };
}

/** L'été, estimé sur la saison entière avec les décisions prises et le scénario révélé. */
export function valeurDeLEte(
  chemin: readonly number[],
  graine: number,
  allotement = chambresAllouees(chemin, graine),
  scenario = hasard(graine).scenario,
) {
  const s = SCENARIOS[scenario]!;
  let plafond: number = ETE.plafond;
  if (chemin[D.ete] === 1) {
    const reste = 1 - ETE.avant - (EFFET[D.ete] - 1) * ETE.parSemaine;
    plafond += (ADAPTE[scenario]!.plafond - ETE.plafond) * reste;
  }
  const capacite = CAPACITE_ETE * plafond;
  const tranches: Tranche[] = [];
  const nuiteesAllouees = allotement * ETE.nuits;
  const occupees = nuiteesAllouees * s.usage;
  const rendues = nuiteesAllouees - occupees;
  for (let b = 0; b <= SEMAINES + 1; b += 1) {
    if (b === ALLOTEMENT.semaine && allotement > 0) {
      tranches.push({
        b,
        demande: occupees,
        plateformes: 0,
        site: 0,
        membres: 0,
        prixPlateformes: 1,
        prixSite: 1,
        prixMembres: 1,
        commission: 0,
        perte: 0,
        fixe: { prix: ALLOTEMENT.prix },
      });
    }
    const part =
      b === 0
        ? ETE.avant
        : b <= SEMAINES
          ? ETE.parSemaine
          : 1 - ETE.avant - SEMAINES * ETE.parSemaine;
    tranches.push(conditions(chemin, graine, b, "ete", 99, s.demande * part, scenario));
  }
  // Les chambres rendues à 21 jours ne se revendent qu'en partie.
  const r = remplir(tranches, capacite - rendues * (1 - s.revente), ETE.prix);
  const revenuAllotement = Math.min(occupees, r.chambres) * ALLOTEMENT.prix;
  return {
    net: r.net,
    nuitees: r.chambres,
    revenuAllotement,
    individuels: r.net - revenuAllotement,
    to: r.chambres / CAPACITE_ETE,
  };
}

/** Les nuitées que l'an dernier avait déjà réservées, pour le reste du trimestre, en fin de semaine t. */
export function carnetAnDernier(t: number): number {
  let total = 0;
  for (let w = t + 1; w <= SEMAINES; w += 1) {
    for (const type of TYPES) {
      const n = NUITS[type][w]!;
      if (n === 0) continue;
      total += DEMANDE[type][w]! * AN_DERNIER[type] * n * dejaReserve(type, w - t);
    }
    total += GROUPES[w]! + (w === SEMINAIRE_PERDU.semaine ? SEMINAIRE_PERDU.nuitees : 0);
  }
  return total;
}

/** Le carnet d'un type de nuit, cette année et l'an dernier, à demande moyenne, en début de trimestre. */
export function carnetDeDepart(type: TypeDeNuit | "groupes") {
  let cette = 0;
  let derniere = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    if (type === "groupes") {
      cette += GROUPES[w]!;
      derniere += GROUPES[w]! + (w === SEMINAIRE_PERDU.semaine ? SEMINAIRE_PERDU.nuitees : 0);
      continue;
    }
    const n = NUITS[type][w]!;
    const x = DEMANDE[type][w]! * n * dejaReserve(type, w);
    cette += x;
    derniere += x * AN_DERNIER[type];
  }
  return { cette, derniere, ecart: cette / derniere - 1 };
}

export function couts(chemin: readonly number[]): number {
  return (
    (chemin[D.direct] === 1 ? MEMBRE.cout : 0) +
    (chemin[D.direct] === 2 ? SITE_MOINS_CHER.cout : 0) +
    (chemin[D.allotement] === 3 ? ANALYSE.cout : 0)
  );
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const frais = couts(chemin);
  const sejours = Array.from({ length: SEMAINES + 1 }, (_, w) =>
    w === 0 ? null : semaineDeSejour(chemin, graine, w),
  );
  const semaines: (Semaine | null)[] = [null];
  let cumul = -enquete;
  let brutTotal = 0;
  let netTotal = 0;
  let chambresTotal = 0;
  let directTotal = 0;
  let transitoiresTotal = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const s = sejours[w]!;
    const brut = s.parType.reduce((x, p) => x + p.brut, 0);
    const net = s.parType.reduce((x, p) => x + p.net, 0) - s.cout;
    const chambres = s.parType.reduce((x, p) => x + p.chambres, 0);
    const direct = s.parType.reduce((x, p) => x + p.direct, 0);
    const transitoires = s.parType.reduce((x, p) => x + p.transitoires, 0);
    // Les frais des actions se paient la semaine où elles partent.
    const fraisDeLaSemaine =
      (w === EFFET[D.direct] ? frais - (chemin[D.allotement] === 3 ? ANALYSE.cout : 0) : 0) +
      (w === EFFET[D.allotement] && chemin[D.allotement] === 3 ? ANALYSE.cout : 0);
    cumul += net - fraisDeLaSemaine;
    brutTotal += brut;
    netTotal += net;
    chambresTotal += chambres;
    directTotal += direct;
    transitoiresTotal += transitoires;
    // Le carnet du reste du trimestre, tel que Hostéo le montre en fin de semaine w.
    let carnet = 0;
    for (let v = w + 1; v <= SEMAINES; v += 1) {
      for (const p of sejours[v]!.parType) {
        for (const [b, n] of p.parSemaine) if (b <= w) carnet += n;
      }
    }
    const ly = carnetAnDernier(w);
    semaines.push({
      revpar: brut / (7 * CHAMBRES),
      to: chambres / (7 * CHAMBRES),
      pm: chambres > 0 ? brut / chambres : 0,
      net,
      brut,
      chambres,
      direct: transitoires > 0 ? direct / transitoires : 0,
      cumul,
      carnet,
      pickup: ly > 0 ? carnet / ly - 1 : 0,
    });
  }
  const ete = valeurDeLEte(chemin, graine);
  const groupe = groupeBrenval(chemin, graine);
  return {
    semaines,
    objectif: netTotal + ete.net - frais - enquete,
    revenuTrimestre: netTotal,
    brutTrimestre: brutTotal,
    valeurEte: ete.net,
    revenuAllotement: ete.revenuAllotement,
    couts: frais + enquete,
    nuitees: chambresTotal,
    revpar: brutTotal / (NUITS_DU_TRIMESTRE * CHAMBRES),
    to: chambresTotal / (NUITS_DU_TRIMESTRE * CHAMBRES),
    pm: brutTotal / chambresTotal,
    partDirecte: directTotal / transitoiresTotal,
    nuiteesEte: ete.nuitees,
    toEte: ete.to,
    scenario: h.scenario,
    groupe,
    allotement: chambresAllouees(chemin, graine),
    meerlandParti: chemin[D.allotement] === 3 && !meerlandAttend(graine),
    bookalia: bookaliaSanctionne(chemin, graine),
  };
}

/** Le pick-up d'été sur l'an dernier, tel que Lucile le lit en fin de semaine t. */
export function pickupEte(graine: number, t: number): number {
  const h = hasard(graine);
  const clair = Math.min(1, Math.max(0, (t - 6) / 2));
  return clair * SCENARIOS[h.scenario]!.pickup + 0.02 * h.bruitEte * (1 - 0.5 * clair);
}

/** Ce qui s'est passé pendant des semaines : groupe, Bookalia, Meerland, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const dans = (w: number) => w >= de && w <= a;
  const groupe = groupeBrenval(chemin, graine);
  return {
    groupeLoge:
      groupe !== null && dans(groupe === "pont" ? BRENVAL.semainePont : BRENVAL.semaineContre),
    bookalia: bookaliaSanctionne(chemin, graine) && dans(SITE_MOINS_CHER.des),
    analyse: chemin[D.allotement] === 3 && dans(EFFET[D.allotement]),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEscale {
  revpar: number | null;
  to: number | null;
  pm: number | null;
  net: number | null;
  direct: number | null;
  pickup: number | null;
  budgetADate: number | null;
  /** Pour les messages et les sources. */
  carnet: number | null;
  pickupEte: number | null;
  scenario: number | null;
  membres: number | null;
}

/** Ce que Romy lit le vendredi soir ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEscale {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const h = hasard(graine);
  const membres =
    chemin[D.direct] === 1 ? Math.round(1800 + 260 * Math.max(0, semaine - EFFET[D.direct])) : 0;
  if (semaine === 0) {
    return {
      revpar: 96,
      to: 0.6,
      pm: 160,
      net: 0,
      direct: 0.38,
      pickup: carnetDepartTotal().ecart,
      budgetADate: 0,
      carnet: carnetDepartTotal().cette,
      pickupEte: pickupEte(graine, 0),
      scenario: null,
      membres: 0,
    };
  }
  const s = t.semaines[semaine]!;
  return {
    revpar: s.revpar,
    to: s.to,
    pm: s.pm,
    net: s.cumul,
    direct: s.direct,
    pickup: semaine < SEMAINES ? s.pickup : null,
    budgetADate: (BUDGET_TRIMESTRE * semaine) / SEMAINES,
    carnet: s.carnet,
    pickupEte: pickupEte(graine, semaine),
    scenario: semaine >= 8 ? h.scenario : null,
    membres,
  };
}

/** Le carnet de tout le trimestre au premier lundi, cette année et l'an dernier, à demande moyenne. */
export function carnetDepartTotal() {
  const parts = (["pont", "weekend", "semaine", "groupes"] as const).map(carnetDeDepart);
  const cette = parts.reduce((s, p) => s + p.cette, 0);
  const derniere = parts.reduce((s, p) => s + p.derniere, 0);
  return { cette, derniere, ecart: cette / derniere - 1 };
}

/* ---------------------------------------------------------------------------
 * LES CHIFFRES QUE LES SOURCES DONNENT, calculés sur le modèle.
 * ------------------------------------------------------------------------- */

/** Ce que rapporte en moyenne une nuitée de pont vendue par les canaux habituels, net. */
export const NET_PONT =
  PRIX.pont *
  (PART_PLATEFORMES.pont * (1 - COMMISSION) + (1 - PART_PLATEFORMES.pont) * (1 - COUT_DIRECT));
/** Ce que le groupe Brenval coûterait sur le pont : chaque nuitée prend la place d'une nuitée à NET_PONT. */
export const DEPLACEMENT_BRENVAL = BRENVAL.chambres * BRENVAL.nuits * (NET_PONT - BRENVAL.prix);
/** Ce que rapporte de plus une nuitée qui passe des plateformes au site, au tarif membre. */
export const GAIN_MEMBRE = ((1 - MEMBRE.remise) * (1 - COUT_DIRECT)) / (1 - COMMISSION) - 1;

/** L'allotement, été par été, à grille et canaux inchangés : ce qu'il change à la valeur de l'été. */
export function chiffresAllotement(chambres: number) {
  const parScenario = SCENARIOS.map(
    (_, s) => valeurDeLEte(NEUTRE, 1, chambres, s).net - valeurDeLEte(NEUTRE, 1, 0, s).net,
  );
  const esperance = SCENARIOS.reduce((acc, sc, s) => acc + sc.chance * parScenario[s]!, 0);
  return { parScenario, esperance };
}

/** Une vente flash sur les nuits de semaine : les nuitées et le revenu net, rapportés à ceux d'avant. */
export function effetVenteFlash() {
  const p = PART_PLATEFORMES.semaine;
  const perte = ANNULATIONS.taux * ANNULATIONS.nonRevendues;
  const flash = 1 - VENTE_FLASH;
  const plateformes = p * flash ** ELASTICITE.semaine + (1 - p) * COMPARENT;
  const site = (1 - p) * (1 - COMPARENT);
  const avant = p * (1 - perte) * (1 - COMMISSION) + (1 - p) * (1 - COUT_DIRECT);
  const apres = plateformes * (1 - perte) * flash * (1 - COMMISSION) + site * (1 - COUT_DIRECT);
  return { nuitees: plateformes + site - 1, net: apres / avant - 1 };
}
