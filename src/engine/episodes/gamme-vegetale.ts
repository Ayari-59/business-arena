/**
 * LA GAMME VÉGÉTALE — le modèle du lancement d'une gamme de desserts
 * végétaux par la Laiterie de Kerbrélan.
 *
 * Le rayon des desserts végétaux (avoine, soja, coco) croît de 15 % par an,
 * le Groupe Nordal vient d'y lancer une gamme, et le conseil
 * d'administration doit choisir : investir 3,2 M€ dans une ligne dédiée à
 * Loudéac, faire fabriquer une gamme d'essai par un façonnier, ou laisser
 * passer. Herveline Daniélou, directrice marketing et innovation, a un
 * trimestre — janvier à mars — et six décisions.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une stratégie se joue sur des années, un
 * épisode sur un trimestre. Le trimestre est jugé sur la VALEUR CRÉÉE
 * ESTIMÉE en semaine 13, en euros :
 *
 *   résultat du trimestre (marge des ventes de la gamme d'essai, moins la
 *   série courte du façonnier, la mise en place, les données, la campagne,
 *   la promotion, la réservation de créneaux, l'incident d'allergènes, le
 *   temps d'enquête) ;
 *   + la VAN, au taux de la laiterie (9 %), sur cinq ans, mois par mois à
 *     partir d'avril, de la position prise : la marge de la gamme (chiffre
 *     d'affaires × taux de marge sur coût variable de la source de
 *     production, moins la cannibalisation des desserts lactés et le
 *     soutien commercial), moins les frais fixes de la gamme et de la ligne,
 *     moins la marge que la gamme du Groupe Nordal prendra à nos crèmes
 *     desserts (l'érosion, d'autant plus forte qu'on n'a rien à mettre en
 *     rayon), moins les investissements (la ligne, reprise à sa valeur nette
 *     comptable la cinquième année), les mises en place, les pénalités du
 *     façonnier et les dédits.
 *
 * Elle est recalculée chaque semaine avec ce que le trimestre a révélé : la
 * riposte du Groupe Nordal (semaine 6 ou 7), le réachat mesuré par la carte
 * de fidélité d'Opaline (semaine 9) ou la note de la dégustation
 * (semaine 5), qui déplacent les probabilités des scénarios, puis le
 * scénario lui-même, que le panel annuel du rayon révèle en semaine 12. Ne
 * rien faire vaut quelque chose, et c'est négatif : l'érosion des crèmes
 * desserts par la gamme Nordal, sur cinq ans.
 *
 * Cinq mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE SCÉNARIO DU MARCHÉ. Le rayon peut continuer de croître de 15 % par
 *     an (essor, trois chances sur dix), ralentir à 6 % (central, un peu
 *     moins d'une chance sur deux) ou reculer (repli, une sur quatre). La
 *     ligne dédiée ne se paie que dans l'essor ; dans le repli, elle fige
 *     3,2 M€ dont la moitié reviendra au mieux.
 *   · LE TEST ACHÈTE L'INFORMATION, S'IL MESURE CE QUI COMPTE. Dix semaines
 *     chez Opaline, quatre références fabriquées par un façonnier : les
 *     commandes de l'enseigne flattent toujours (remplissage des rayons,
 *     effet de nouveauté) ; le taux de réachat des acheteurs, que seule la
 *     carte de fidélité mesure, dit si la gamme tiendra. Une promotion de
 *     lancement recrute des acheteurs de promotion et fausse la mesure.
 *   · LA CANNIBALISATION EST FAIBLE, PAS NULLE. 12 % des ventes de la gamme
 *     viennent d'acheteurs de nos crèmes desserts : 3,6 % du chiffre
 *     d'affaires de la gamme en marge perdue. Sans gamme, c'est Nordal qui
 *     prend ces clients, et davantage.
 *   · LA LIGNE DÉDIÉE EST LA SOLUTION DES GROS VOLUMES. Les desserts
 *     végétaux se vendent « sans lait » : sur une ligne lactée, même avec
 *     un nettoyage en place renforcé, on ne garantit pas l'absence de
 *     protéines de lait, et chaque trace bloque un lot. Le façonnier, qui
 *     travaille sans lait, plafonne à 1,8 million de packs par an. La ligne
 *     se commande quand les volumes la justifient.
 *   · LE GROUPE NORDAL RÉPOND AU BRUIT. Il riposte par des promotions à
 *     −34 % (le plafond légal) d'autant plus souvent que le lancement se
 *     voit : une ligne annoncée, trois enseignes d'un coup, une campagne.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation de la laiterie pour un projet d'innovation. */
export const TAUX = 0.09;
/** Celui qu'elle retient si la Banque Armorienne relève ses taux pendant le trimestre. */
export const TAUX_RELEVE = 0.1;
/** L'horizon de la valeur : cinq ans, mois par mois à partir d'avril. */
export const HORIZON = 5;
export const MOIS = HORIZON * 12;
/** La valeur que le conseil attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 100000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le dossier du conseil se boucle avec un cabinet. */
export const PERTE_PAR_JOUR = 3000;

/* ---------------------------------------------------------------------------
 * LE MARCHÉ : ce que les sources de la semaine 1 permettent de calculer.
 * ------------------------------------------------------------------------- */

export type Scenario = "essor" | "central" | "repli";
export const LES_SCENARIOS: readonly Scenario[] = ["essor", "central", "repli"];

export const SCENARIOS: Record<
  Scenario,
  {
    nom: string;
    chance: number;
    /** La croissance annuelle du rayon, en valeur. */
    croissance: number;
    /** La part de marché que la gamme atteint, rapportée à celle du plan. */
    adoption: number;
    /** Le taux de réachat des acheteurs de la gamme d'essai, en %. */
    reachat: number;
    /** Les ventes de la gamme d'essai en sortie de caisse, en packs par magasin et par semaine. */
    rotation: number;
    /** La marge que la gamme Nordal prend chaque année à nos crèmes desserts, si nous n'avons rien en rayon. */
    erosion: number;
  }
> = {
  essor: {
    nom: "l'essor",
    chance: 0.3,
    croissance: 0.15,
    adoption: 1.3,
    reachat: 36,
    rotation: 30,
    erosion: 100000,
  },
  central: {
    nom: "le scénario central",
    chance: 0.45,
    croissance: 0.06,
    adoption: 1,
    reachat: 25,
    rotation: 22,
    erosion: 50000,
  },
  repli: {
    nom: "le repli",
    chance: 0.25,
    croissance: -0.05,
    adoption: 0.75,
    reachat: 15,
    rotation: 14,
    erosion: 15000,
  },
};

/** Le rayon des desserts végétaux frais l'an dernier, en ventes consommateurs. */
export const MARCHE = 110_000_000;
/** La part du rayon, en valeur, que le plan de la cheffe de marque vise la troisième année. */
export const PART_VISEE = 0.04;
/** La montée en puissance de la part visée, année par année. */
export const MONTEE = [0.5, 0.8, 1, 1, 1] as const;
/** Le prix net de cession rapporté au prix consommateur : TVA de 5,5 % et marge de l'enseigne. */
export const PASSAGE = 0.62;
/** Le prix net de cession d'un pack de quatre pots, et son prix consommateur moyen. */
export const PRIX_NET = 1.55;
export const PRIX_CONSOMMATEUR = PRIX_NET / PASSAGE;

/** Le chiffre d'affaires annuel de la gamme complète (dix références, trois enseignes), année 1 à 5. */
export const caGamme = (s: Scenario, annee: number) =>
  MARCHE *
  (1 + SCENARIOS[s].croissance) ** annee *
  PART_VISEE *
  MONTEE[annee - 1]! *
  SCENARIOS[s].adoption *
  PASSAGE;

/** Ce que la prévision de la semaine 1 demande : le chiffre d'affaires de la troisième année, scénario central. */
export const CA_CENTRAL_TROIS_ANS =
  MARCHE * (1 + SCENARIOS.central.croissance) ** 3 * PART_VISEE * PASSAGE;

/* ---------------------------------------------------------------------------
 * LES MOYENS DE PRODUIRE.
 * ------------------------------------------------------------------------- */

/** La Fabrique Ardaven, façonnier de desserts végétaux à Ploërmel : une usine sans lait. */
export const FACONNIER = {
  /** Le taux de marge sur coût variable de la gamme fabriquée à façon. */
  marge: 0.2,
  /** Sa capacité pour nous, en packs par an. */
  capacite: 1_800_000,
  /** La série courte du test et la mise en place chez Opaline. */
  serie: 35000,
  /** La réservation des créneaux d'avril à septembre, déduite des commandes si on les utilise. */
  reservation: 30000,
  /** Quatre fois sur dix, il ne garde que la moitié des créneaux. */
  chancePartielle: 0.4,
  /** Le contrat d'un an : un engagement d'achat, une remise, une pénalité sur ce qui n'est pas enlevé. */
  engagement: { packs: 800_000, penalite: 0.3, remise: 0.02, prixFacon: 1.24 },
  /** Sans réservation, ses créneaux partent à un autre client jusqu'à fin juin, et il faut relancer. */
  moisSansCreneaux: 3,
  relance: 40000,
  relancePivot: 10000,
} as const;

/** La ligne végétale dédiée de Loudéac : salle séparée, conditionneuse, NEP propre. */
export const LIGNE = {
  investissement: 3_200_000,
  marge: 0.4,
  /** Huit postes en 2×8, maintenance, énergie, analyses : par an. */
  fixes: 200000,
  /** Sa valeur nette comptable la cinquième année : la moitié de son prix. */
  residuelle: 2_000_000,
  /** Six mois entre la commande et la mise en service. */
  delai: 6,
  /** Commandée, la ligne ne s'annule qu'en perdant l'acompte. */
  dedit: 0.3,
} as const;

/** Produire sur une ligne lactée de Pontivy, entre deux séries, avec un NEP renforcé. */
export const PARTAGEE = {
  adaptation: 250000,
  marge: 0.27,
  /** Les changements de série et les validations de nettoyage limitent la capacité. */
  capacite: 1_500_000,
  /** Lots bloqués, analyses de traces, retraits : par an. */
  allergenes: 100000,
  /** La capacité perdue par les crèmes desserts : par an. */
  lactes: 60000,
  /** Les essais de validation du nettoyage trouvent des traces de lait une fois sur trois. */
  chanceIncident: 0.35,
  incident: 30000,
  depuis: 2,
} as const;

/** 12 % des ventes de la gamme viennent d'acheteurs de nos crèmes desserts, à 30 % de marge. */
export const CANNIBALISATION = { part: 0.12, marge: 0.3 } as const;
export const TAUX_CANNIBALISATION = CANNIBALISATION.part * CANNIBALISATION.marge;

/** Ce que la gamme occupe : la part du chiffre d'affaires de la gamme complète. */
export type Empreinte = "aucune" | "essai" | "pivot" | "large";
export const EMPREINTES: Record<
  Empreinte,
  { part: number; soutien: number; fixes: number; erosion: number }
> = {
  aucune: { part: 0, soutien: 0, fixes: 0, erosion: 1 },
  /** Les quatre références d'essai chez Opaline, avec animation en magasin. */
  essai: { part: 0.25, soutien: 0.06, fixes: 100000, erosion: 0.8 },
  /** Les deux références à l'avoine chez Opaline, sans publicité. */
  pivot: { part: 0.2, soutien: 0.04, fixes: 50000, erosion: 0.6 },
  /** Dix références dans les trois enseignes, avec publicité et promotions. */
  large: { part: 1, soutien: 0.11, fixes: 180000, erosion: 0.4 },
};

/** La mise en place chez Celtis et Proxival : animations, prospectus, coopération commerciale. */
export const ELARGISSEMENT = 110000;
/**
 * Les négociations annuelles sont closes au 1er mars : une gamme qui n'y était pas entre chez
 * Celtis et Proxival à la réimplantation des rayons de septembre (le sixième mois après mars).
 */
export const ELARGISSEMENT_MOIS = 6;
/** Restée chez le façonnier, la ligne se décide en décembre, sur trois mois de ventes nationales. */
export const DECISION_DIFFEREE = 9;
/** Les trois enseignes vendent quatre fois et demie ce que vendent les magasins Opaline de l'Ouest. */
export const MAGASINS_OPALINE = 140;
export const FACTEUR_TROIS_ENSEIGNES = 4.5;

/* ---------------------------------------------------------------------------
 * LE TEST ET SA MESURE.
 * ------------------------------------------------------------------------- */

/** La gamme arrive en rayon en semaine 4 : dix semaines de test, jusqu'à la semaine 13. */
export const DEBUT_TEST = 4;
/** Le réachat se lit en semaine 9 ; la dégustation rend sa note en semaine 5 ; le panel annuel, le scénario en semaine 12. */
export const LECTURE = 9;
export const DEGUSTATION = 5;
export const REVELATION = 12;
/** L'effet de nouveauté, semaines 4 à 6, et les semaines de stock que l'enseigne commande à la mise en place. */
/** L'objectif du test, fixé avec Opaline : 20 packs par magasin et par semaine. */
export const OBJECTIF_ROTATION = 20;
export const NOUVEAUTE = [1.5, 1.3, 1.15] as const;
export const REMPLISSAGE = 3;

export const MESURE = { carte: 24000, degustation: 15000 } as const;
/** Les critères écrits : élargir à 30 % de réachat ou plus, garder l'avoine de 20 à 30 %, arrêter en dessous. */
export const SEUILS = { elargir: 30, garder: 20 } as const;
/** La précision de chaque mesure, en points de réachat ; les commandes sont biaisées vers le haut. */
export const SIGNAL = {
  carte: 2,
  degustation: 7,
  commandes: { biais: 9, ecart: 3 },
  promo: { carte: -4, commandes: 5 },
  campagne: { commandes: 3 },
} as const;

export const LANCEMENT = {
  campagne: 120000,
  /** La notoriété d'une campagne : 5 % de ventes en plus les deux premières années, si la gamme s'étend. */
  notoriete: 0.05,
  magasin: 20000,
  promo: { remise: 0.34, semaines: 4, volume: 1.8 },
} as const;

/** La riposte du Groupe Nordal : des promotions à −34 % sur sa gamme végétale, pendant quatre semaines. */
export const NORDAL = {
  /** Selon la stratégie : la ligne annoncée, le test chez Opaline, les trois enseignes, rien. */
  base: [0.55, 0.15, 0.5, 0] as readonly number[],
  campagne: 0.35,
  promo: 0.25,
  max: 0.9,
  remise: 0.34,
  semaines: 4,
  /** Pendant ses promotions, nos ventes d'essai baissent de 30 % ; la première année, la gamme en perd 15 %. */
  rotation: 0.7,
  baisse: 0.15,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  strategie: 0,
  mesure: 1,
  lancement: 2,
  faconnier: 3,
  revision: 4,
  production: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 4, 7, 10, 12] as const;

/** Ne rien changer, décision par décision : laisser passer, suivre les commandes, rien réserver, attendre. */
export const NEUTRE = [3, 0, 1, 2, 2, 1] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "avoine",
    titre: "Rupture de base d'avoine chez le façonnier",
    de: "Envel Danzé",
    role: "Directeur commercial, Fabrique Ardaven",
    texte:
      "Notre fournisseur de base d'avoine a perdu un lot entier au contrôle : deux semaines sans fabriquer les références à l'avoine. Les rayons vont se vider, rien à voir avec vos clients.",
  },
  {
    id: "taux",
    titre: "La Banque Armorienne relève ses taux",
    de: "Iwan Szymanski",
    role: "Directeur administratif et financier",
    texte:
      "La Banque Armorienne relève ses conditions : nous passons le taux d'actualisation des projets d'innovation de 9 % à 10 %, pour tous les dossiers.",
  },
  {
    id: "presse",
    titre: "Un magazine épingle les desserts végétaux",
    de: "Morwenna Pellen",
    role: "Cheffe de marque",
    texte:
      "Un magazine de consommateurs classe les desserts végétaux parmi les produits « ultra-transformés ». Tout le rayon perd un cinquième de ses ventes pendant trois semaines.",
  },
  {
    id: "rayon",
    titre: "Opaline réimplante son rayon ultra-frais",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Opaline réimplante tout son rayon ultra-frais : pendant deux semaines, les produits changent de place et les ventes de tout le rayon baissent d'un tiers.",
  },
  {
    id: "emballage",
    titre: "Les pots et les opercules augmentent",
    de: "Azilis Cozic",
    role: "Responsable emballages et développement",
    texte:
      "Le fournisseur de pots et d'opercules applique sa clause d'indexation : un point de marge en moins sur toute la gamme, quel que soit l'atelier qui la fabrique.",
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: Scenario;
  /** Le vrai taux de réachat de la gamme d'essai, en %. */
  reachat: number;
  /** Les erreurs de mesure, en écarts types. */
  zCarte: number;
  zDegustation: number;
  zCommandes: number;
  /** L'écart des ventes de chaque semaine, autour de la rotation du scénario (indices 1 à 13). */
  bruit: readonly number[];
  uNordal: number;
  semaineNordal: number;
  /** Le façonnier ne garde-t-il que la moitié des créneaux ? */
  uReservation: number;
  /** Les essais de nettoyage de la ligne partagée trouvent-ils des traces de lait ? */
  uIncident: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001173 + 7);
  const u = r();
  const scenario: Scenario =
    u < SCENARIOS.essor.chance
      ? "essor"
      : u < SCENARIOS.essor.chance + SCENARIOS.central.chance
        ? "central"
        : "repli";
  const reachat = SCENARIOS[scenario].reachat + borne(1.5 * gauss(r), -3, 3);
  const zCarte = borne(gauss(r), -2.5, 2.5);
  const zDegustation = borne(gauss(r), -2.5, 2.5);
  const zCommandes = borne(gauss(r), -2.5, 2.5);
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.06 * gauss(r), -0.15, 0.15));
  const uNordal = r();
  const semaineNordal = r() < 0.5 ? 6 : 7;
  const uReservation = r();
  const uIncident = r();
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
    reachat,
    zCarte,
    zDegustation,
    zCommandes,
    bruit,
    uNordal,
    semaineNordal,
    uReservation,
    uIncident,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);
const tombe = (h: Hasard, id: string, w: number) => {
  const i = imprevu(h, id);
  return i !== undefined && i.semaine <= w;
};

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Une gamme est-elle en rayon pendant le trimestre ? Le test chez Opaline, ou les trois enseignes. */
export const enRayon = (chemin: readonly number[]) =>
  chemin[D.strategie] === 1 || chemin[D.strategie] === 2;

/** La probabilité que le Groupe Nordal riposte : il répond au bruit du lancement. */
export function probaNordal(chemin: readonly number[]): number {
  const base = NORDAL.base[chemin[D.strategie]!] ?? 0;
  if (base === 0) return 0;
  const lancement = chemin[D.lancement];
  const bruit = !enRayon(chemin)
    ? 0
    : lancement === 0
      ? NORDAL.campagne
      : lancement === 2
        ? NORDAL.promo
        : 0;
  return Math.min(NORDAL.max, base + bruit);
}

export const riposteNordal = (chemin: readonly number[], graine: number) =>
  hasard(graine).uNordal < probaNordal(chemin);

/** Le façonnier ne garde que la moitié des créneaux réservés. */
export const reservationPartielle = (graine: number) =>
  hasard(graine).uReservation < FACONNIER.chancePartielle;

/**
 * Ce que la mesure choisie en semaine 2 dit du réachat, en semaine 9 :
 * la carte de fidélité le mesure (une promotion de lancement le fait
 * baisser : elle recrute des acheteurs de promotion), la dégustation
 * l'approche de loin, les commandes le surestiment toujours.
 */
export function signalDuTest(chemin: readonly number[], graine: number): number | null {
  if (!enRayon(chemin)) return null;
  const h = hasard(graine);
  const lancement = chemin[D.lancement];
  switch (chemin[D.mesure]) {
    case 1:
      return h.reachat + SIGNAL.carte * h.zCarte + (lancement === 2 ? SIGNAL.promo.carte : 0);
    case 2:
      return h.reachat + SIGNAL.degustation * h.zDegustation;
    default:
      return (
        h.reachat +
        SIGNAL.commandes.biais +
        SIGNAL.commandes.ecart * h.zCommandes +
        (lancement === 2 ? SIGNAL.promo.commandes : 0) +
        (lancement === 0 ? SIGNAL.campagne.commandes : 0)
      );
  }
}

export type Etat = "aucune" | "pivot" | "large" | "prolonge";

/** Ce que la gamme devient après le trimestre, selon la proposition de la semaine 9. */
export function etatApres(chemin: readonly number[], graine: number): Etat {
  const base = chemin[D.strategie];
  if (base === 3) return "aucune";
  if (base === 0) return chemin[D.revision] === 3 ? "aucune" : "large";
  switch (chemin[D.revision]) {
    case 0:
      return "large";
    case 1: {
      const s = signalDuTest(chemin, graine)!;
      return s >= SEUILS.elargir ? "large" : s >= SEUILS.garder ? "pivot" : "aucune";
    }
    case 2:
      return "prolonge";
    default:
      return "aucune";
  }
}

/** Les essais de validation du nettoyage de la ligne partagée trouvent des traces de lait. */
export const incidentAllergenes = (chemin: readonly number[], graine: number) =>
  enRayon(chemin) &&
  chemin[D.production] === 2 &&
  etatApres(chemin, graine) !== "aucune" &&
  hasard(graine).uIncident < PARTAGEE.chanceIncident;

/* ---------------------------------------------------------------------------
 * LA VALEUR DE LA POSITION PRISE, MOIS PAR MOIS SUR CINQ ANS.
 * ------------------------------------------------------------------------- */

type Production = "aucune" | "faconnier" | "ligne" | "partagee";

interface Mois {
  empreinte: Empreinte;
  production: Production;
  /** Le chiffre d'affaires de la gamme complète est-il réduit (−10 % : Nordal a pris la place) ? */
  retard: boolean;
}

export interface Hypotheses {
  taux: number;
  nordal: boolean;
  emballage: boolean;
  incident: boolean;
  partielle: boolean;
}

export interface Position {
  valeur: number;
  /** La ligne dédiée est-elle commandée, et quand entre-t-elle en service (mois après mars) ? */
  ligne: number | null;
  /** Le chiffre d'affaires de la première année. */
  caAnnee1: number;
  /** La pénalité du contrat d'un an, s'il est signé. */
  penalite: number;
}

/** L'empreinte et la production de chaque mois, et les flux ponctuels, pour un scénario. */
function plan(chemin: readonly number[], graine: number, s: Scenario) {
  const base = chemin[D.strategie]!;
  const mois: Mois[] = Array.from({ length: MOIS }, () => ({
    empreinte: "aucune",
    production: "aucune",
    retard: false,
  }));
  const ponctuels: { mois: number; montant: number }[] = [];
  let ligne: number | null = null;
  let partagee: number | null = null;

  if (base === 0) {
    // La ligne est commandée en janvier : en service en juillet, la gamme lancée avec elle.
    if (chemin[D.revision] === 3) {
      ponctuels.push({ mois: 0, montant: -LIGNE.dedit * LIGNE.investissement });
    } else {
      ligne = 4;
      ponctuels.push({ mois: 0, montant: -LIGNE.investissement });
      ponctuels.push({ mois: 3, montant: -ELARGISSEMENT });
      for (let m = 4; m <= MOIS; m += 1)
        mois[m - 1] = { empreinte: "large", production: "ligne", retard: false };
    }
    return { mois, ponctuels, ligne, partagee };
  }
  if (base === 3) return { mois, ponctuels, ligne, partagee };

  const etat = etatApres(chemin, graine);
  const d4 = chemin[D.faconnier];
  const d6 = chemin[D.production];
  // Sans créneaux au printemps, la gamme d'essai quitte les rayons d'avril à juin : Celtis et
  // Proxival ne référencent pas en septembre une gamme absente, l'élargissement glisse à mars,
  // et Nordal a pris la place (−10 % de ventes).
  const rayonVide = d4 === 2 && d6 !== 2;
  const elargissement = rayonVide ? 12 : ELARGISSEMENT_MOIS;
  const empreinte = (m: number): { e: Empreinte; retard: boolean } => {
    switch (etat) {
      case "large":
        return { e: base === 1 && m < elargissement ? "essai" : "large", retard: rayonVide };
      case "pivot":
        return { e: "pivot", retard: false };
      case "prolonge":
        if (m <= 6) return { e: base === 1 ? "essai" : "large", retard: false };
        if (s === "essor") {
          return base === 2 || m >= 12
            ? { e: "large", retard: true }
            : { e: "essai", retard: false };
        }
        return s === "central" ? { e: "pivot", retard: false } : { e: "aucune", retard: false };
      default:
        return { e: "aucune", retard: false };
    }
  };

  if (etat !== "aucune") {
    if (d6 === 0) {
      ligne = 1 + LIGNE.delai - 1;
      ponctuels.push({ mois: 0, montant: -LIGNE.investissement });
    } else if (d6 === 2) {
      partagee = PARTAGEE.depuis;
      ponctuels.push({ mois: 0, montant: -PARTAGEE.adaptation });
    }
  }
  let creux = false;
  for (let m = 1; m <= MOIS; m += 1) {
    const { e, retard } = empreinte(m);
    if (e === "aucune") continue;
    let production: Production =
      ligne !== null && m >= ligne
        ? "ligne"
        : partagee !== null && m >= partagee
          ? "partagee"
          : "faconnier";
    if (production === "faconnier" && d4 === 2 && m <= FACONNIER.moisSansCreneaux) {
      production = "aucune";
      creux = true;
    }
    mois[m - 1] = { empreinte: production === "aucune" ? "aucune" : e, production, retard };
  }
  if (creux && mois.some((x) => x.empreinte !== "aucune")) {
    const relance = etat === "large" ? FACONNIER.relance : FACONNIER.relancePivot;
    ponctuels.push({ mois: FACONNIER.moisSansCreneaux + 1, montant: -relance });
  }
  // Restée chez le façonnier, la gamme qui s'étend dans l'essor fait commander la ligne en
  // décembre, sur les premiers mois de ventes dans les trois enseignes : en service en juin.
  const grande = mois.some((x, i) => i >= 6 && x.empreinte === "large");
  if (ligne === null && partagee === null && s === "essor" && grande) {
    ligne = DECISION_DIFFEREE + LIGNE.delai;
    ponctuels.push({ mois: DECISION_DIFFEREE, montant: -LIGNE.investissement });
    for (let m = ligne; m <= MOIS; m += 1) {
      if (mois[m - 1]!.empreinte !== "aucune") mois[m - 1]!.production = "ligne";
    }
  }
  if (d4 === 1 && mois.slice(0, 3).some((x) => x.production === "faconnier")) {
    // La réservation est déduite des commandes d'avril à juin.
    ponctuels.push({ mois: 1, montant: FACONNIER.reservation });
  }
  return { mois, ponctuels, ligne, partagee };
}

/** La valeur, à la fin du trimestre, de la position prise : VAN sur cinq ans, dans un scénario. */
export function valeurPosition(
  chemin: readonly number[],
  graine: number,
  s: Scenario,
  hyp: Hypotheses,
): Position {
  const { mois, ponctuels, ligne, partagee } = plan(chemin, graine, s);
  const d4 = chemin[D.faconnier];
  const contrat = enRayon(chemin) && d4 === 0;
  const actualise = (m: number) => (1 + hyp.taux) ** (m / 12);
  const erosion = SCENARIOS[s].erosion;
  const emballage = hyp.emballage ? 0.01 : 0;
  let valeur = 0;
  let caAnnee1 = 0;
  let packsFaconnier = 0;
  for (let m = 1; m <= MOIS; m += 1) {
    const x = mois[m - 1]!;
    const annee = Math.ceil(m / 12);
    const e = EMPREINTES[x.empreinte];
    let flux = (-erosion * e.erosion) / 12 - e.fixes / 12;
    if (x.production !== "aucune") {
      let demande = (caGamme(s, annee) / 12) * e.part;
      if (hyp.nordal && annee === 1) demande *= 1 - NORDAL.baisse;
      if (x.retard) demande *= 0.9;
      if (enRayon(chemin) && chemin[D.lancement] === 0 && x.empreinte === "large" && annee <= 2) {
        demande *= 1 + LANCEMENT.notoriete;
      }
      let marge: number;
      let ca: number;
      if (x.production === "ligne") {
        marge = LIGNE.marge;
        ca = demande;
      } else if (x.production === "partagee") {
        marge = PARTAGEE.marge;
        ca = Math.min(demande, (PARTAGEE.capacite / 12) * PRIX_NET);
      } else {
        const partielle = hyp.partielle && d4 === 1 && m <= 6 ? 0.5 : 1;
        marge = FACONNIER.marge + (contrat && annee === 1 ? FACONNIER.engagement.remise : 0);
        ca = Math.min(demande, (FACONNIER.capacite / 12) * PRIX_NET * partielle);
        if (annee === 1) packsFaconnier += ca / PRIX_NET;
      }
      if (annee === 1) caAnnee1 += ca;
      flux += ca * (marge - emballage - TAUX_CANNIBALISATION - e.soutien);
    }
    if (ligne !== null && m >= ligne) flux -= LIGNE.fixes / 12;
    if (partagee !== null && m >= partagee) {
      flux -= (PARTAGEE.allergenes * (hyp.incident ? 2 : 1) + PARTAGEE.lactes) / 12;
    }
    valeur += flux / actualise(m);
  }
  for (const p of ponctuels) valeur += p.montant / actualise(p.mois);
  if (ligne !== null) valeur += LIGNE.residuelle / actualise(MOIS);
  let penalite = 0;
  if (contrat) {
    penalite =
      Math.max(0, FACONNIER.engagement.packs - packsFaconnier) * FACONNIER.engagement.penalite;
    valeur -= penalite / actualise(12);
  }
  return { valeur, ligne, caAnnee1, penalite };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export interface VentesDeLaSemaine {
  /** Les packs vendus en sortie de caisse, par magasin Opaline. */
  rotation: number;
  /** Les packs vendus en sortie de caisse, toutes enseignes. */
  sorties: number;
  /** Les commandes des enseignes, en euros. */
  commandes: number;
  /** La remise de Nordal sur sa gamme, cette semaine. */
  nordal: number;
  promo: boolean;
}

/** Les ventes de la gamme d'essai une semaine donnée ; rien hors du test. */
export function ventes(chemin: readonly number[], graine: number, w: number): VentesDeLaSemaine {
  const h = hasard(graine);
  const riposte = riposteNordal(chemin, graine);
  const nordalActif = riposte && w >= h.semaineNordal && w < h.semaineNordal + NORDAL.semaines;
  const nordal = nordalActif ? NORDAL.remise : 0;
  if (!enRayon(chemin) || w < DEBUT_TEST) {
    return { rotation: 0, sorties: 0, commandes: 0, nordal, promo: false };
  }
  const k = w - DEBUT_TEST;
  const promo = chemin[D.lancement] === 2 && k < LANCEMENT.promo.semaines;
  let rotation = SCENARIOS[h.scenario].rotation * (1 + h.bruit[w]!) * (NOUVEAUTE[k] ?? 1);
  if (promo) rotation *= LANCEMENT.promo.volume;
  if (nordalActif) rotation *= NORDAL.rotation;
  const presse = imprevu(h, "presse");
  if (presse && w >= presse.semaine && w < presse.semaine + 3) rotation *= 0.8;
  const rayon = imprevu(h, "rayon");
  if (rayon && w >= rayon.semaine && w < rayon.semaine + 2) rotation *= 2 / 3;
  const avoine = imprevu(h, "avoine");
  const rupture = avoine !== undefined && w >= avoine.semaine && w < avoine.semaine + 2;
  if (rupture) rotation *= 0.5;
  const facteur = chemin[D.strategie] === 2 ? FACTEUR_TROIS_ENSEIGNES : 1;
  const sorties = rotation * MAGASINS_OPALINE * facteur;
  const commandes = rupture
    ? 0
    : sorties * PRIX_NET * (w === DEBUT_TEST ? 1 + REMPLISSAGE : promo && k === 0 ? 1.4 : 1.03);
  return { rotation, sorties, commandes, nordal, promo };
}

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** Le résultat du trimestre à ce jour. */
  resultat: number;
  /** Les commandes de la semaine, en euros. */
  commandes: number;
  /** Les ventes en sortie de caisse, en packs par magasin Opaline. */
  rotation: number;
  /** Le réachat mesuré par la carte, en % ; −1 s'il ne l'est pas. */
  reachat: number;
  /** Les sommes engagées à ce jour. */
  engage: number;
  /** La remise du Groupe Nordal sur sa gamme végétale cette semaine. */
  nordal: number;
  /** La probabilité de l'essor, telle qu'on l'estime en fin de semaine. */
  essor: number;
  taux: number;
};

/** Les probabilités des scénarios en fin de semaine w, au vu de ce que le trimestre a appris. */
export function probabilites(
  chemin: readonly number[],
  graine: number,
  w: number,
): Record<Scenario, number> {
  const h = hasard(graine);
  if (w >= REVELATION) {
    return { essor: 0, central: 0, repli: 0, [h.scenario]: 1 } as Record<Scenario, number>;
  }
  const mesure = chemin[D.mesure];
  const signal = signalDuTest(chemin, graine);
  let ecart: number | null = null;
  if (signal !== null && mesure === 1 && w >= LECTURE) ecart = Math.hypot(SIGNAL.carte, 1.5);
  if (signal !== null && mesure === 2 && w >= DEGUSTATION) {
    ecart = Math.hypot(SIGNAL.degustation, 1.5);
  }
  const p = {} as Record<Scenario, number>;
  let total = 0;
  for (const s of LES_SCENARIOS) {
    const v =
      ecart === null
        ? SCENARIOS[s].chance
        : SCENARIOS[s].chance * Math.exp(-(((signal! - SCENARIOS[s].reachat) / ecart) ** 2) / 2);
    p[s] = v;
    total += v;
  }
  for (const s of LES_SCENARIOS) p[s] /= total;
  return p;
}

/** Les décisions déjà prises en fin de semaine w ; les autres, « ne rien changer ». */
const decide = (chemin: readonly number[], w: number) =>
  chemin.map((c, k) => (w >= EFFET[k]! ? c : NEUTRE[k]!));

export interface Estimation {
  valeur: number;
  resultat: number;
  position: number;
  engage: number;
}

/** Ce que coûtent, semaine par semaine, les décisions du trimestre. */
function coutsDeLaSemaine(chemin: readonly number[], graine: number, w: number): number {
  const base = chemin[D.strategie];
  const test = enRayon(chemin);
  let c = 0;
  if (w === EFFET[D.strategie]) {
    if (base === 1) c += FACONNIER.serie;
    if (base === 2) c += FACONNIER.serie + ELARGISSEMENT;
  }
  if (w === EFFET[D.mesure] && test) {
    c += chemin[D.mesure] === 1 ? MESURE.carte : chemin[D.mesure] === 2 ? MESURE.degustation : 0;
  }
  if (w === EFFET[D.lancement] && test) {
    c += chemin[D.lancement] === 0 ? LANCEMENT.campagne : LANCEMENT.magasin;
  }
  if (w === EFFET[D.faconnier] && test && chemin[D.faconnier] === 1) c += FACONNIER.reservation;
  if (w === SEMAINES && incidentAllergenes(chemin, graine)) c += PARTAGEE.incident;
  return c;
}

/** La marge des ventes d'une semaine : sortie de caisse, cannibalisation déduite, promotions payées. */
function margeDeLaSemaine(chemin: readonly number[], graine: number, w: number): number {
  const v = ventes(chemin, graine, w);
  if (v.sorties === 0) return 0;
  const emballage = tombe(hasard(graine), "emballage", w) ? 0.01 : 0;
  let m = v.sorties * PRIX_NET * (FACONNIER.marge - emballage - TAUX_CANNIBALISATION);
  if (v.promo) m -= v.sorties * PRIX_CONSOMMATEUR * LANCEMENT.promo.remise;
  return m;
}

/** Les sommes engagées en fin de semaine w. */
function engageA(chemin: readonly number[], graine: number, w: number): number {
  const c = decide(chemin, w);
  let e = 0;
  for (let k = 1; k <= w; k += 1) e += coutsDeLaSemaine(c, graine, k);
  if (c[D.strategie] === 0) e += LIGNE.investissement;
  if (enRayon(c)) {
    if (c[D.faconnier] === 0) e += FACONNIER.engagement.packs * FACONNIER.engagement.prixFacon;
    if (w >= EFFET[D.revision] && etatApres(c, graine) !== "aucune") {
      if (c[D.production] === 0 && w >= EFFET[D.production]) e += LIGNE.investissement;
      if (c[D.production] === 2 && w >= EFFET[D.production]) e += PARTAGEE.adaptation;
    }
  }
  return e;
}

/** Ce que l'on sait en fin de semaine w : le reste est pris en espérance. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const c = decide(chemin, w);
  let resultat = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  for (let k = 1; k <= w; k += 1) {
    resultat += margeDeLaSemaine(c, graine, k) - coutsDeLaSemaine(c, graine, k);
  }
  const hyp: Hypotheses = {
    taux: tombe(h, "taux", w) ? TAUX_RELEVE : TAUX,
    nordal: riposteNordal(c, graine) && w >= h.semaineNordal,
    emballage: tombe(h, "emballage", w),
    incident: w >= SEMAINES && incidentAllergenes(c, graine),
    partielle: w >= EFFET[D.faconnier] && reservationPartielle(graine),
  };
  const p = probabilites(c, graine, w);
  let position = 0;
  for (const s of LES_SCENARIOS) {
    if (p[s] > 0) position += p[s] * valeurPosition(c, graine, s, hyp).valeur;
  }
  return { valeur: resultat + position, resultat, position, engage: engageA(chemin, graine, w) };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  resultat: number;
  position: number;
  engage: number;
  scenario: Scenario;
  reachat: number;
  signal: number | null;
  etat: Etat;
  nordal: boolean;
  ligne: number | null;
  incident: boolean;
  partielle: boolean;
  penalite: number;
  caAnnee1: number;
  taux: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = estimer(chemin, graine, 0, 0).valeur;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    const c = decide(chemin, w);
    const v = ventes(c, graine, w);
    const lu = enRayon(c) && c[D.mesure] === 1 && w >= LECTURE;
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      resultat: e.resultat,
      commandes: v.commandes,
      rotation: v.rotation,
      reachat: lu ? signalDuTest(c, graine)! : -1,
      engage: e.engage,
      nordal: v.nordal,
      essor: probabilites(c, graine, w).essor,
      taux: tombe(h, "taux", w) ? TAUX_RELEVE : TAUX,
    });
    avant = e.valeur;
    fin = e;
  }
  const hyp: Hypotheses = {
    taux: semaines[SEMAINES]!.taux,
    nordal: riposteNordal(chemin, graine),
    emballage: tombe(h, "emballage", SEMAINES),
    incident: incidentAllergenes(chemin, graine),
    partielle: reservationPartielle(graine),
  };
  const pos = valeurPosition(chemin, graine, h.scenario, hyp);
  return {
    semaines,
    objectif: fin!.valeur,
    resultat: fin!.resultat,
    position: fin!.position,
    engage: fin!.engage,
    scenario: h.scenario,
    reachat: h.reachat,
    signal: signalDuTest(chemin, graine),
    etat: etatApres(chemin, graine),
    nordal: riposteNordal(chemin, graine),
    ligne: pos.ligne,
    incident: incidentAllergenes(chemin, graine),
    partielle: enRayon(chemin) && chemin[D.faconnier] === 1 && reservationPartielle(graine),
    penalite: pos.penalite,
    caAnnee1: pos.caAnnee1,
    taux: hyp.taux,
  };
}

/** Ce qui s'est passé pendant des semaines : la riposte, la mesure, le panel, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    arrivee: enRayon(chemin) && dans(DEBUT_TEST),
    nordal: riposteNordal(chemin, graine) && dans(h.semaineNordal),
    degustation: enRayon(chemin) && chemin[D.mesure] === 2 && dans(DEGUSTATION),
    lecture: enRayon(chemin) && dans(LECTURE),
    revision: dans(EFFET[D.revision]),
    panel: dans(REVELATION),
    incident: incidentAllergenes(chemin, graine) && dans(SEMAINES),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureVegetale {
  valeur: number | null;
  commandes: number | null;
  reachat: number | null;
  engage: number | null;
  nordal: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  commandesCumul: number | null;
  /** Ce que l'objectif du test représente en commandes, à ce jour. */
  objectifCumul: number | null;
  /** Les commandes de la mise en place, en semaine 4. */
  remplissage: number | null;
  rotation: number | null;
  rotationMoyenne: number | null;
  signal: number | null;
  essor: number | null;
  taux: number | null;
  etat: number | null;
  riposte: number | null;
}

const ETATS: readonly Etat[] = ["aucune", "pivot", "large", "prolonge"];

/**
 * Ce qu'Herveline lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureVegetale {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    const e = estimer(NEUTRE, graine, 0, 0);
    return {
      valeur: e.valeur,
      commandes: 0,
      reachat: null,
      engage: 0,
      nordal: 0,
      commandesCumul: 0,
      objectifCumul: 0,
      remplissage: null,
      rotation: null,
      rotationMoyenne: null,
      signal: null,
      essor: SCENARIOS.essor.chance,
      taux: TAUX,
      etat: null,
      riposte: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  let cumul = 0;
  let rot = 0;
  let n = 0;
  for (let w = 1; w <= semaine; w += 1) {
    const x = t.semaines[w]!;
    cumul += x.commandes;
    if (w >= DEBUT_TEST) {
      rot += x.rotation;
      n += 1;
    }
  }
  const c = decide(chemin, semaine);
  const facteur = c[D.strategie] === 2 ? FACTEUR_TROIS_ENSEIGNES : 1;
  return {
    valeur: s.valeur,
    commandes: enRayon(c) ? s.commandes : null,
    reachat: s.reachat >= 0 ? s.reachat : null,
    engage: s.engage,
    nordal: s.nordal,
    commandesCumul: cumul,
    objectifCumul: OBJECTIF_ROTATION * MAGASINS_OPALINE * facteur * PRIX_NET * n,
    remplissage: semaine >= DEBUT_TEST ? t.semaines[DEBUT_TEST]!.commandes : null,
    rotation: enRayon(c) && semaine >= DEBUT_TEST ? s.rotation : null,
    rotationMoyenne: n ? rot / n : null,
    signal: semaine >= LECTURE ? signalDuTest(c, graine) : null,
    essor: s.essor,
    taux: s.taux,
    etat: semaine >= EFFET[D.revision] ? ETATS.indexOf(etatApres(c, graine)) : null,
    riposte: riposteNordal(c, graine) && semaine >= hasard(graine).semaineNordal ? 1 : 0,
  };
}

/* ---------------------------------------------------------------------------
 * LES CHIFFRES QUE LES SOURCES MONTRENT, recalculés depuis le modèle.
 * ------------------------------------------------------------------------- */

/** Ce que l'érosion des crèmes desserts coûte sur cinq ans, sans gamme à nous, au taux de la laiterie. */
export function erosionSurCinqAns(s: Scenario, taux = TAUX): number {
  let v = 0;
  for (let m = 1; m <= MOIS; m += 1) v += SCENARIOS[s].erosion / 12 / (1 + taux) ** (m / 12);
  return v;
}

/** La capacité du façonnier pour nous, en chiffre d'affaires annuel. */
export const CAPACITE_FACONNIER_EUROS = FACONNIER.capacite * PRIX_NET;

/** La marge que la cannibalisation coûte, pour un chiffre d'affaires de la gamme donné. */
export const margeCannibalisee = (ca: number) => ca * TAUX_CANNIBALISATION;
