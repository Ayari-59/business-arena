/**
 * LE LIBRE-SERVICE QUI PERD : le modèle du comptoir et du libre-service de
 * l'agence Arvel Distribution de Bourgoin-Jallieu.
 *
 * Ici, on ne joue pas un manager. On joue Camille Royer, en CAP Équipier
 * polyvalent du commerce : recevoir les livraisons, ranger, réassortir,
 * étiqueter, conseiller les clients. Treize semaines, six décisions, et quatre
 * mécanismes que le joueur doit découvrir :
 *
 *   · CE QUI N'EST PAS NOTÉ À LA RÉCEPTION EST PERDU. Un colis abîmé ou
 *     manquant se récupère auprès du transporteur si une réserve est écrite sur
 *     son bon avant de signer. Après la signature, il ne reste que trois jours
 *     et une lettre recommandée, et le plus souvent rien. Un manquant que
 *     personne n'a vu laisse en plus une référence vide en rayon.
 *   · CE QUI PÉRIME LE PLUS TÔT DOIT PARTIR LE PREMIER. Colles, mastics et
 *     silicones ont une date limite d'utilisation. Rangés derrière les cartons
 *     neufs, ils la passent au fond du rayon, et de plus en plus à mesure que
 *     le stock vieillit.
 *   · UN STOCK FAUX FABRIQUE DES RUPTURES. Un produit abîmé caché en réserve,
 *     ou un inventaire jamais fait, laisse croire au logiciel qu'il reste de la
 *     marchandise : personne ne recommande, et le rayon se vide sans alerte.
 *   · UN CLIENT BIEN REÇU REVIENT. Écouter, poser des questions, conseiller le
 *     bon produit, régler une réclamation tout de suite : la satisfaction au
 *     comptoir se gagne ou se perd dans chaque échange, et elle vaut de
 *     l'argent, parce qu'un client mécontent va chez le concurrent.
 *
 * Le trimestre est jugé en euros : ce que les gestes de l'équipier font perdre
 * ou gagner à l'agence (démarque, ventes manquées par les ruptures, commandes
 * en retard, clients perdus ou gagnés), comparé au plafond de pertes que la
 * directrice a fixé.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LES LIVRAISONS.
 * ------------------------------------------------------------------------- */
/** Les livraisons fournisseurs de la semaine : le lundi et le jeudi. */
export const LIVRAISONS_PAR_SEMAINE = 2;
/** La chance qu'une livraison arrive avec un colis abîmé ou un manquant. */
export const CHANCE_INCIDENT = 0.3;
/** Ce que vaut en moyenne un colis abîmé ou manquant, au prix d'achat : une palette de colle, un lot de carrelage. */
export const VALEUR_INCIDENT = 600;
/** La part des colis abîmés ou manquants récupérés quand la réserve est écrite avant de signer. */
export const RECUPERE_AVEC_RESERVE = 0.9;
/** La part récupérée quand on signe, puis qu'on vérifie : la lettre recommandée des trois jours part rarement à temps. */
export const RECUPERE_APRES_SIGNATURE = 0.1;
/** Les références vides laissées par un manquant que personne n'a vu, pendant une semaine. */
export const RUPTURES_PAR_MANQUANT_INAPERCU = 1;
/** Un manquant vu à la réception est recommandé tout de suite : il ne laisse un trou que quelques jours. */
export const RUPTURES_PAR_MANQUANT_VU = 0.3;
/** Refuser une livraison entière pour un colis abîmé : tout repart, et le rayon attend la livraison suivante. */
export const RUPTURES_PAR_REFUS = 5;
/** Les deux premières semaines, pointer chaque livraison prend du temps sur le rayon. */
export const RUPTURES_APPRENTISSAGE_CONTROLE = 1;
export const SEMAINES_D_APPRENTISSAGE = 2;

/* ---------------------------------------------------------------------------
 * LES DATES, LA CASSE, LE VOL.
 * ------------------------------------------------------------------------- */
/** Les colles, mastics et silicones jetés chaque semaine quand les cartons neufs sont rangés devant. */
export const PERIMES_BASE = 220;
/** Sans rotation, le stock vieillit : les périmés montent de 5 % par semaine. */
export const PERIMES_HAUSSE = 0.05;
/** Ce qui reste de périmés quand ce qui périme le plus tôt est mis devant. */
export const PERIMES_AVEC_ROTATION = 0.3;
/** La semaine où l'on retrie le rayon, une partie des vieux cartons part encore à la benne. */
export const PERIMES_SEMAINE_DU_TRI = 0.6;
/** Retrier le rayon prend une matinée : une référence de plus reste vide cette semaine-là. */
export const TROUS_TRI_DU_RAYON = 1;
/** La casse en rayon : sacs percés, pots tombés, emballages déchirés. */
export const CASSE_BASE = 100;
/** Le vol constaté au libre-service ; aucune décision de l'épisode n'y touche. */
export const VOL_BASE = 60;

/** La démarque du trimestre dernier, cause par cause : ce que la feuille de démarque montre en semaine 1. */
export const DEMARQUE_TRIMESTRE_DERNIER = {
  reception:
    SEMAINES * LIVRAISONS_PAR_SEMAINE * CHANCE_INCIDENT * VALEUR_INCIDENT,
  dates: SEMAINES * PERIMES_BASE,
  casse: SEMAINES * CASSE_BASE,
  vol: SEMAINES * VOL_BASE,
} as const;
export const DEMARQUE_TRIMESTRE_DERNIER_TOTAL = Object.values(
  DEMARQUE_TRIMESTRE_DERNIER,
).reduce((s, x) => s + x, 0);

/* ---------------------------------------------------------------------------
 * LE RAYON ET LES RUPTURES.
 * ------------------------------------------------------------------------- */
/** Les références vides à l'ouverture, faute de réassort, avant toute décision. */
export const RUPTURES_REASSORT = 7;
/** Les références que le logiciel croit en stock alors que le rayon est vide. */
export const ERREURS_DE_STOCK_DEPART = 3;
/** Après l'inventaire tournant, il n'en reste presque plus. */
export const ERREURS_APRES_INVENTAIRE = 0.5;
/** Sans inventaire, les erreurs de stock s'accumulent chaque semaine. */
export const ERREURS_HAUSSE = 0.25;
/** Avec les produits abîmés cachés en réserve, elles s'accumulent deux fois plus vite. */
export const ERREURS_HAUSSE_CACHE = 0.5;
/** L'inventaire tournant de l'allée prend deux heures : une référence de plus reste vide cette semaine-là. */
export const TROUS_INVENTAIRE = 1;
/** Ce qu'une référence vide pendant une semaine fait perdre : six ventes, 18 € de marge chacune. */
export const VENTES_PAR_REFERENCE = 6;
export const MARGE_PAR_VENTE = 18;
export const COUT_RUPTURE = VENTES_PAR_REFERENCE * MARGE_PAR_VENTE;
export const OBJECTIF_RUPTURES = 7;

/* ---------------------------------------------------------------------------
 * LES COMMANDES CLIENTS.
 * ------------------------------------------------------------------------- */
/** Les commandes à préparer par jour d'ouverture : comptoir, téléphone et site. */
export const COMMANDES_PAR_JOUR = 8;
export const JOURS_D_OUVERTURE = 6;
export const COMMANDES_PAR_SEMAINE = COMMANDES_PAR_JOUR * JOURS_D_OUVERTURE;
/** La part des commandes prêtes quand le client arrive, quand on les prépare à son arrivée. */
export const A_L_HEURE_DEPART = 0.74;
/** Préparées la veille : presque toutes sont prêtes. */
export const A_L_HEURE_LA_VEILLE = 0.95;
export const OBJECTIF_A_L_HEURE = 0.9;
/** Un client qui attend sa commande : une fois sur six, il ira ailleurs la prochaine fois, et une commande laisse 250 € de marge. */
export const PART_QUI_VA_AILLEURS = 1 / 6;
export const MARGE_PAR_COMMANDE = 250;
export const COUT_RETARD = PART_QUI_VA_AILLEURS * MARGE_PAR_COMMANDE;

/* ---------------------------------------------------------------------------
 * LA SATISFACTION AU COMPTOIR.
 * ------------------------------------------------------------------------- */
export const SATISFACTION_DEPART = 0.81;
export const OBJECTIF_SATISFACTION = 0.85;
/** Les clients qui passent au comptoir et au libre-service chaque semaine. */
export const CLIENTS_PAR_SEMAINE = 400;
/** Un client mécontent sur deux ne revient pas ; un client laisse 100 € de marge par trimestre. */
export const PART_QUI_NE_REVIENT_PAS = 0.5;
export const MARGE_PAR_CLIENT = 100;
/** Un point de satisfaction, par semaine : quatre clients contents ou mécontents de plus. */
export const VALEUR_POINT =
  CLIENTS_PAR_SEMAINE * 0.01 * PART_QUI_NE_REVIENT_PAS * MARGE_PAR_CLIENT;
/** Chaque référence vide au-delà de six fait perdre un peu de satisfaction ; en deçà, elle en fait gagner. */
export const RUPTURES_NEUTRES = 6;
export const SATISFACTION_PAR_RUPTURE = 0.004;
/** Des commandes prêtes à l'heure se voient dans la satisfaction. */
export const SATISFACTION_PAR_A_L_HEURE = 0.05;
/** Un artisan prévenu par SMS que sa commande est prête : il le remarque. */
export const SATISFACTION_CLIENTS_PREVENUS = 0.01;
/** La satisfaction reste entre ces deux bornes. */
export const SATISFACTION_MIN = 0.5;
export const SATISFACTION_MAX = 0.97;

/* ---------------------------------------------------------------------------
 * LES ÉTIQUETTES ET LES PRODUITS ABÎMÉS (décision 4).
 * ------------------------------------------------------------------------- */
/** Les produits abîmés trouvés en semaine 6, au prix d'achat. */
export const ABIMES_TROUVES = 400;
/** Les clients qui voient en caisse un autre prix que l'étiquette, chaque semaine, quand les étiquettes restent fausses. */
export const ECARTS_DE_PRIX = 10;
/** La loi oblige à vendre au prix affiché : l'agence perd la différence, 15 € en moyenne. */
export const PERTE_PAR_ECART = 15;
/** Un prix différent en caisse : le client se sent trompé. */
export const SATISFACTION_ETIQUETTES_FAUSSES = -0.04;

/* ---------------------------------------------------------------------------
 * LE CONSEIL AUX PARTICULIERS (décision 5).
 * ------------------------------------------------------------------------- */
/** Les particuliers qui demandent un conseil au libre-service chaque semaine. */
export const PARTICULIERS_A_CONSEILLER = 25;
/** La marge d'un produit complémentaire : peigne, croisillons, joint, primaire. */
export const MARGE_COMPLEMENTAIRE = 15;
/** Les retours d'un produit inadapté : repris, remboursé, souvent abîmé. */
export const COUT_RETOUR = 20;
/** Le carrelage décollé d'un client mal conseillé : la colle reprise et un geste. */
export const COUT_CARRELAGE_DECOLLE = 450;
/** Une fois sur deux, la colle la moins chère ne tient pas sur ce chantier-là. */
export const CHANCE_DECOLLE = 0.5;
/** Le client au carrelage décollé le raconte au comptoir, et autour de lui. */
export const SATISFACTION_CARRELAGE_DECOLLE = -0.02;

/* ---------------------------------------------------------------------------
 * LE RETRAIT ET LA RÉCLAMATION (décision 6).
 * ------------------------------------------------------------------------- */
/** Les retraits du site qui posent un problème, et les réclamations courantes, chaque semaine. */
export const RECLAMATIONS_PAR_SEMAINE = 5;
/** Ce que vaut un client perdu après une réclamation mal reçue : sa marge de l'année. */
export const CLIENT_PERDU = 200;
/** Une commande du site, en moyenne. */
export const COMMANDE_DU_SITE = 150;
/** Rembourser sans vérifier : six fois sur dix, la commande n'avait pas à l'être en entier. */
export const PART_REMBOURSEE_A_TORT = 0.6;
/** Un produit équivalent ou un échange proposé tout de suite. */
export const COUT_ECHANGE = 8;

/* ---------------------------------------------------------------------------
 * LES PALETTES DANS LES ALLÉES (décision 3).
 * ------------------------------------------------------------------------- */
/** Une palette laissée dans une allée ouverte au public : trois fois sur dix, un client trébuche. */
export const CHANCE_ACCIDENT = 0.3;
export const COUT_ACCIDENT = 1500;

/* ---------------------------------------------------------------------------
 * CE QUE LES SOURCES DISENT, ET QUE LE MODÈLE SUPPOSE.
 * ------------------------------------------------------------------------- */
/** Les semaines de bons de livraison relus en semaine 1 : un mois. */
export const SEMAINES_DE_BONS_RELUS = 4;
/** Pointer une livraison et écrire les réserves : vingt minutes de plus. */
export const MINUTES_DE_CONTROLE = 20;
/** La part de particuliers parmi les passages en caisse, relevée à l'ouverture de l'agence (épisode « L'agence qui démarre »). */
export const PART_DE_PARTICULIERS = 0.61;
/** Les étiquettes qui ne sont plus à jour quand les prix des colles changent, en semaine 7. */
export const ETIQUETTES_FAUSSES = 12;
/** Les produits comptés dans l'allée 4 pour comparer le rayon au logiciel. */
export const PRODUITS_COMPTES = 30;

/* ---------------------------------------------------------------------------
 * LE JUGEMENT.
 * ------------------------------------------------------------------------- */
/** Le plafond de pertes du trimestre, fixé par la directrice d'agence. */
export const PLAFOND_DE_PERTES = 40000;
/** La démarque visée par semaine. */
export const OBJECTIF_DEMARQUE = 500;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, le rayon n'est pas tenu : des références restent vides. */
export const PERTE_PAR_JOUR = 300;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  reception: 0,
  rangement: 1,
  reassort: 2,
  etiquettes: 3,
  conseil: 4,
  reclamation: 5,
} as const;

export const O = {
  reception: { signerVite: 0, controler: 1, verifierApres: 2, refuserTout: 3 },
  rangement: { vite: 0, rotation: 1, laVeille: 2, rotationLaVeille: 3 },
  reassort: { aLOeil: 0, facadeDAbord: 1, ventesDeLaVeille: 2, palettes: 3 },
  etiquettes: { tout: 0, balisageVite: 1, sansInventaire: 2, cacher: 3 },
  conseil: { moinsChere: 0, forcer: 1, renvoyer: 2, decouverte: 3 },
  reclamation: { serviceClient: 0, ecouter: 1, rembourser: 2, repasser: 3 },
} as const;

/** Faire comme d'habitude, décision par décision. */
export const NEUTRE = [0, 0, 0, 1, 2, 0] as const;

/**
 * La semaine où chaque décision commence à jouer : la manière de recevoir,
 * décidée le vendredi de la semaine 1, vaut pour les livraisons de la semaine 2.
 */
export const DEBUT = [2, 3, 5, 7, 9, 11] as const;

/** Ce que chaque manière de réassortir fait des références vides, et de la casse. */
export const REASSORT = [
  /** À l'œil : on remplit ce qui a l'air vide. */
  { ruptures: 1, casse: 1, satisfaction: 0 },
  /** La façade d'abord, le réassort pendant l'ouverture, transpalette dans les allées. */
  { ruptures: 0.85, casse: 1.4, satisfaction: -0.01 },
  /** D'après les ventes de la veille, puis la façade. */
  { ruptures: 0.5, casse: 1, satisfaction: 0 },
  /** Des palettes entières laissées dans les allées. */
  { ruptures: 0.75, casse: 2.5, satisfaction: -0.02 },
] as const;

/** Ce que chaque manière de conseiller fait à la satisfaction, aux ventes complémentaires et aux retours. */
export const CONSEIL = [
  /** La colle la moins chère, sans question. */
  { satisfaction: -0.02, complementaires: 0, retours: 0.1 },
  /** La plus chère, et tout le rayon : beaucoup de ventes, beaucoup de retours. */
  { satisfaction: -0.05, complementaires: 0.7, retours: 0.39 },
  /** Envoyer le client à Kevin, au comptoir : la file s'allonge. */
  { satisfaction: -0.03, complementaires: 0.15, retours: 0 },
  /** L'accueillir, lui poser des questions, conseiller, proposer ce qui lui sera utile. */
  { satisfaction: 0.06, complementaires: 0.4, retours: 0.02 },
] as const;

/** Ce que chaque manière de recevoir une réclamation fait à la satisfaction et aux clients perdus. */
export const RECLAMATION = [
  /** Renvoyer au service client du site. */
  { satisfaction: -0.04, perdus: 0.35, rembourse: 0, echange: 0 },
  /** Écouter, vérifier, proposer une solution tout de suite, noter pour la cheffe d'équipe. */
  { satisfaction: 0.05, perdus: 0.03, rembourse: 0, echange: 1 },
  /** Rembourser toute la commande sans vérifier. */
  {
    satisfaction: 0.02,
    perdus: 0.03,
    rembourse: PART_REMBOURSEE_A_TORT,
    echange: 0,
  },
  /** Demander de repasser quand la cheffe d'équipe sera là. */
  { satisfaction: -0.03, perdus: 0.25, rembourse: 0, echange: 0 },
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
    /** Multiplie la chance d'incident à chaque livraison. */
    incidents?: number;
    /** Multiplie les périmés. */
    perimes?: number;
    /** Multiplie les références vides. */
    ruptures?: number;
    /** Ajoute des références vides. */
    trous?: number;
    /** Retire des commandes prêtes à l'heure. */
    retards?: number;
    /** Sans liste des ventes de la veille, le réassort se fait à l'œil. */
    sansListe?: true;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chauffeur",
    titre: "Nouveau chauffeur chez le transporteur",
    de: "Samia Haddou",
    role: "Cheffe d'équipe",
    texte:
      "Le transporteur a un nouveau chauffeur. Les palettes arrivent mal calées, et il veut repartir vite.",
    duree: 2,
    effet: { incidents: 2 },
  },
  {
    id: "chaleur",
    titre: "Coup de chaleur",
    de: "Samia Haddou",
    role: "Cheffe d'équipe",
    texte:
      "Il fait plus de 30 degrés dans la réserve. Les mastics et les silicones vieillissent plus vite.",
    duree: 2,
    effet: { perimes: 1.8 },
  },
  {
    id: "absence",
    titre: "Un collègue en arrêt",
    de: "Manon Pellerin",
    role: "Directrice d'agence",
    texte:
      "Lucie, l'autre équipière du libre-service, est en arrêt deux semaines. Le matin, vous tenez le rayon sans elle.",
    duree: 2,
    effet: { ruptures: 1.25, retards: 0.06 },
  },
  {
    id: "salon",
    titre: "Salon de l'habitat",
    de: "Manon Pellerin",
    role: "Directrice d'agence",
    texte:
      "C'est le salon de l'habitat à Bourgoin-Jallieu. Beaucoup de particuliers samedi, et les rayons se vident vite.",
    duree: 1,
    effet: { trous: 3 },
  },
  {
    id: "caisse",
    titre: "Panne du logiciel de caisse",
    de: "Kevin Lopes",
    role: "Vendeur comptoir",
    texte:
      "Le logiciel de caisse est tombé. Les ventes sont notées à la main : pas de liste des ventes de la veille cette semaine.",
    duree: 1,
    effet: { sansListe: true },
  },
];

/** Un ou deux imprévus par trimestre, à égalité de chances, entre la semaine 2 et la semaine 11. */
export const CHANCE_DEUX_IMPREVUS = 0.5;
export const PREMIERE_SEMAINE_IMPREVU = 2;
export const SEMAINES_POSSIBLES_IMPREVU = 10;

/** La moitié des incidents de livraison sont des manquants, l'autre moitié des colis abîmés. */
export const PART_DE_MANQUANTS = 0.5;

/**
 * LE BRUIT DE CHAQUE SEMAINE : son écart type, et ses bornes. Les commandes
 * varient de 5 % autour de leur moyenne, les références vides de 10 %, la
 * satisfaction de moins d'un point, le vol de 30 %.
 */
export const BRUIT = {
  commandes: { ecart: 0.05, min: 0.88, max: 1.12 },
  ruptures: { ecart: 0.1, min: 0.7, max: 1.3 },
  satisfaction: { ecart: 0.008, min: -0.02, max: 0.02 },
  vol: { ecart: 0.3, min: 0.3, max: 1.8 },
} as const;
/** Un tirage autour de 1 (ou de 0 pour la satisfaction), borné. */
const bruite = (
  b: { ecart: number; min: number; max: number },
  centre: number,
  z: number,
) => Math.min(b.max, Math.max(b.min, centre + b.ecart * z));

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Une livraison : un incident ou non, sa valeur, et s'il s'agit d'un manquant. */
interface Livraison {
  u: number;
  valeur: number;
  manquant: boolean;
}

interface Bruit {
  livraisons: readonly Livraison[];
  commandes: number;
  ruptures: number;
  satisfaction: number;
  vol: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La colle la moins chère tient-elle sur le chantier du particulier ? */
  uDecolle: number;
  /** Un client trébuche-t-il sur une palette laissée dans l'allée ? */
  uAccident: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 92821 + 13);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    const livraisons: Livraison[] = [];
    for (let k = 0; k < LIVRAISONS_PAR_SEMAINE; k += 1) {
      // La valeur d'un incident va de la moitié à une fois et demie la moyenne.
      livraisons.push({
        u: r(),
        valeur: VALEUR_INCIDENT * (0.5 + r()),
        manquant: r() < PART_DE_MANQUANTS,
      });
    }
    semaines.push({
      livraisons,
      commandes: bruite(BRUIT.commandes, 1, gauss(r)),
      ruptures: bruite(BRUIT.ruptures, 1, gauss(r)),
      satisfaction: bruite(BRUIT.satisfaction, 0, gauss(r)),
      vol: bruite(BRUIT.vol, 1, gauss(r)),
    });
  }
  const uDecolle = r();
  const uAccident = r();
  const combien = r() < CHANCE_DEUX_IMPREVUS ? 2 : 1;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({
      imprevu,
      semaine:
        PREMIERE_SEMAINE_IMPREVU + Math.floor(r() * SEMAINES_POSSIBLES_IMPREVU),
    });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uDecolle, uAccident, imprevus };
  tirages.set(graine, h);
  return h;
}

/** La colle la moins chère ne tient pas : le carrelage se décolle en semaine 12. */
export const carrelageDecolle = (chemin: readonly number[], graine: number) =>
  chemin[D.conseil] === O.conseil.moinsChere &&
  hasard(graine).uDecolle < CHANCE_DECOLLE;

/** Une palette dans l'allée : un client trébuche en semaine 7. */
export const clientTrebuche = (chemin: readonly number[], graine: number) =>
  chemin[D.reassort] === O.reassort.palettes &&
  hasard(graine).uAccident < CHANCE_ACCIDENT;

/** La semaine où le carrelage se décolle, et celle où un client trébuche. */
export const SEMAINE_DECOLLE = 12;
export const SEMAINE_ACCIDENT = 7;

export type Semaine = {
  /** La démarque déclarée de la semaine, en euros. */
  demarque: number;
  /** Les références vides à l'ouverture, en moyenne sur la semaine. */
  ruptures: number;
  /** La part des commandes clients prêtes quand le client arrive. */
  aLHeure: number;
  satisfaction: number;
  /** Les commandes clients à préparer dans la semaine. */
  commandes: number;
  /** Les colis abîmés ou manquants de la semaine. */
  incidents: number;
  /** Ce que la semaine a coûté à l'agence, tout compris. */
  cout: number;
  /** Les pertes cumulées depuis le début du trimestre. */
  pertes: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au plafond de pertes : positif, l'agence a perdu moins que le plafond. */
  objectif: number;
  pertes: number;
  demarque: number;
  /** Ce qui est resté à la charge de l'agence sur les colis abîmés ou manquants. */
  incidentsPerdus: number;
  incidents: number;
  rupturesMoyennes: number;
  aLHeureMoyen: number;
  satisfactionMoyenne: number;
  carrelageDecolle: boolean;
  clientTrebuche: boolean;
  /** La démarque cachée en réserve, retrouvée à l'inventaire de fin de trimestre. */
  demarqueCachee: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(
  chemin: readonly number[],
  graine: number,
  jours = 0,
): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const decolle = carrelageDecolle(chemin, graine);
  const trebuche = clientTrebuche(chemin, graine);
  const joue = (d: number, w: number) => w >= DEBUT[d]!;
  const semaines: (Semaine | null)[] = [null];
  let pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let demarqueTotale = 0;
  let incidentsPerdus = 0;
  let incidents = 0;
  let cachee = 0;
  let erreurs = ERREURS_DE_STOCK_DEPART;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter(
      (i) => w >= i.semaine && w < i.semaine + i.imprevu.duree,
    );
    const effet = (cle: "incidents" | "perimes" | "ruptures") =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[cle] ?? 1), 1);
    let cout = w === 1 ? pertes : 0;

    // La réception : chaque colis abîmé ou manquant, récupéré ou perdu.
    let perduReception = 0;
    let trousReception = 0;
    let incidentsSemaine = 0;
    // Avant la décision, on reçoit comme d'habitude : on signe vite.
    const reception = joue(D.reception, w) ? d1 : O.reception.signerVite;
    for (const l of n.livraisons) {
      if (l.u >= CHANCE_INCIDENT * effet("incidents")) continue;
      incidentsSemaine += 1;
      if (reception === O.reception.controler) {
        perduReception += l.valeur * (1 - RECUPERE_AVEC_RESERVE);
        if (l.manquant) trousReception += RUPTURES_PAR_MANQUANT_VU;
      } else if (reception === O.reception.verifierApres) {
        perduReception += l.valeur * (1 - RECUPERE_APRES_SIGNATURE);
        if (l.manquant) trousReception += RUPTURES_PAR_MANQUANT_VU;
      } else if (reception === O.reception.refuserTout) {
        trousReception += RUPTURES_PAR_REFUS;
      } else {
        perduReception += l.valeur;
        if (l.manquant) trousReception += RUPTURES_PAR_MANQUANT_INAPERCU;
      }
    }
    incidents += incidentsSemaine;
    incidentsPerdus += perduReception;
    if (
      reception === O.reception.controler &&
      w < DEBUT[D.reception] + SEMAINES_D_APPRENTISSAGE
    )
      trousReception += RUPTURES_APPRENTISSAGE_CONTROLE;

    // Les dates : sans rotation, le stock vieillit et les périmés montent.
    const rotation =
      joue(D.rangement, w) &&
      (d2 === O.rangement.rotation || d2 === O.rangement.rotationLaVeille);
    let perimes =
      PERIMES_BASE * (1 + PERIMES_HAUSSE * (w - 1)) * effet("perimes");
    if (rotation)
      perimes *=
        w === DEBUT[D.rangement]
          ? PERIMES_SEMAINE_DU_TRI
          : PERIMES_AVEC_ROTATION;
    const trousRangement =
      rotation && w === DEBUT[D.rangement] ? TROUS_TRI_DU_RAYON : 0;

    // Le réassort : la manière de remplir le rayon avant l'ouverture.
    const sansListe = actifs.some((a) => a.imprevu.effet.sansListe);
    let reassort: (typeof REASSORT)[number] = REASSORT[O.reassort.aLOeil];
    if (joue(D.reassort, w)) {
      reassort = REASSORT[d3 as 0 | 1 | 2 | 3];
      if (sansListe && d3 === O.reassort.ventesDeLaVeille)
        reassort = REASSORT[O.reassort.aLOeil];
    }

    // Les étiquettes, les produits abîmés et l'inventaire tournant.
    let demarqueEtiquettes = 0;
    let ecarts = 0;
    let satisfactionEtiquettes = 0;
    if (joue(D.etiquettes, w)) {
      if (d4 === O.etiquettes.tout) {
        if (w === DEBUT[D.etiquettes]) demarqueEtiquettes += ABIMES_TROUVES;
        erreurs =
          w === DEBUT[D.etiquettes] ? erreurs : ERREURS_APRES_INVENTAIRE;
      } else if (d4 === O.etiquettes.sansInventaire) {
        if (w === DEBUT[D.etiquettes]) demarqueEtiquettes += ABIMES_TROUVES;
        erreurs += ERREURS_HAUSSE;
      } else if (d4 === O.etiquettes.balisageVite) {
        // Les produits abîmés restent en rayon : vendus, puis rapportés.
        if (w === DEBUT[D.etiquettes] + 1) demarqueEtiquettes += ABIMES_TROUVES;
        ecarts = ECARTS_DE_PRIX * PERTE_PAR_ECART;
        satisfactionEtiquettes = SATISFACTION_ETIQUETTES_FAUSSES;
        erreurs += ERREURS_HAUSSE;
      } else {
        // Cachés en réserve : la démarque ne se voit pas, le stock devient faux.
        if (w === DEBUT[D.etiquettes]) cachee += ABIMES_TROUVES;
        erreurs += ERREURS_HAUSSE_CACHE;
      }
    }
    const trousInventaire =
      d4 === O.etiquettes.tout && w === DEBUT[D.etiquettes]
        ? TROUS_INVENTAIRE
        : 0;

    let trous = 0;
    for (const a of actifs) trous += a.imprevu.effet.trous ?? 0;
    const ruptures =
      (RUPTURES_REASSORT * reassort.ruptures + erreurs) *
        effet("ruptures") *
        n.ruptures +
      trousReception +
      trousRangement +
      trousInventaire +
      trous;

    // La démarque de la semaine : ce qu'on déclare, et ce qu'on cache.
    let casse = CASSE_BASE * reassort.casse;
    const vol = VOL_BASE * n.vol;
    if (joue(D.etiquettes, w) && d4 === O.etiquettes.cacher) {
      cachee += casse;
      casse = 0;
    }
    let demarque = perduReception + perimes + casse + vol + demarqueEtiquettes;
    // L'inventaire de fin de trimestre retrouve ce qui était caché en réserve.
    if (w === SEMAINES) demarque += cachee;
    demarqueTotale += demarque;

    // Les commandes clients.
    const commandes = COMMANDES_PAR_SEMAINE * n.commandes;
    const laVeille =
      joue(D.rangement, w) &&
      (d2 === O.rangement.laVeille || d2 === O.rangement.rotationLaVeille);
    let aLHeure = laVeille ? A_L_HEURE_LA_VEILLE : A_L_HEURE_DEPART;
    for (const a of actifs) aLHeure -= a.imprevu.effet.retards ?? 0;
    aLHeure = borne(aLHeure, 0, 1);
    const retards = commandes * (1 - aLHeure);

    // Le conseil aux particuliers.
    let complementaires = 0;
    let retours = 0;
    let satisfactionConseil = 0;
    if (joue(D.conseil, w)) {
      const c = CONSEIL[d5 as 0 | 1 | 2 | 3];
      satisfactionConseil = c.satisfaction;
      complementaires =
        PARTICULIERS_A_CONSEILLER * c.complementaires * MARGE_COMPLEMENTAIRE;
      retours =
        PARTICULIERS_A_CONSEILLER *
        c.retours *
        (MARGE_COMPLEMENTAIRE + COUT_RETOUR);
    }
    let decollement = 0;
    if (decolle && w >= SEMAINE_DECOLLE) {
      satisfactionConseil += SATISFACTION_CARRELAGE_DECOLLE;
      if (w === SEMAINE_DECOLLE) decollement = COUT_CARRELAGE_DECOLLE;
    }

    // La réclamation et le retrait des commandes du site.
    let perdus = 0;
    let rembourse = 0;
    let echanges = 0;
    let satisfactionReclamation = 0;
    if (joue(D.reclamation, w)) {
      const r = RECLAMATION[d6 as 0 | 1 | 2 | 3];
      satisfactionReclamation = r.satisfaction;
      perdus = RECLAMATIONS_PAR_SEMAINE * r.perdus * CLIENT_PERDU;
      rembourse = RECLAMATIONS_PAR_SEMAINE * r.rembourse * COMMANDE_DU_SITE;
      echanges = RECLAMATIONS_PAR_SEMAINE * r.echange * COUT_ECHANGE;
    }

    const accident = trebuche && w === SEMAINE_ACCIDENT ? COUT_ACCIDENT : 0;
    const prevenus =
      laVeille && d2 === O.rangement.rotationLaVeille
        ? SATISFACTION_CLIENTS_PREVENUS
        : 0;

    const satisfaction = borne(
      SATISFACTION_DEPART +
        SATISFACTION_PAR_A_L_HEURE * (aLHeure - A_L_HEURE_DEPART) -
        SATISFACTION_PAR_RUPTURE * (ruptures - RUPTURES_NEUTRES) +
        prevenus +
        reassort.satisfaction +
        satisfactionEtiquettes +
        satisfactionConseil +
        satisfactionReclamation +
        n.satisfaction,
      SATISFACTION_MIN,
      SATISFACTION_MAX,
    );
    // Les clients perdus ou gagnés : négatif, la satisfaction rapporte.
    const clients = (OBJECTIF_SATISFACTION - satisfaction) * 100 * VALEUR_POINT;

    const semaine =
      demarque +
      ruptures * COUT_RUPTURE +
      retards * COUT_RETARD +
      ecarts +
      clients +
      retours +
      decollement +
      perdus +
      rembourse +
      echanges +
      accident -
      complementaires;
    pertes += semaine;
    cout += semaine;

    semaines.push({
      demarque,
      ruptures,
      aLHeure,
      satisfaction,
      commandes,
      incidents: incidentsSemaine,
      cout,
      pertes,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const enMoyenne = (cle: keyof Semaine) =>
    pleines.reduce((s, x) => s + x[cle], 0) / SEMAINES;
  return {
    semaines,
    objectif: PLAFOND_DE_PERTES - pertes,
    pertes,
    demarque: demarqueTotale,
    incidentsPerdus,
    incidents,
    rupturesMoyennes: enMoyenne("ruptures"),
    aLHeureMoyen: enMoyenne("aLHeure"),
    satisfactionMoyenne: enMoyenne("satisfaction"),
    carrelageDecolle: decolle,
    clientTrebuche: trebuche,
    demarqueCachee: cachee,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(
  chemin: readonly number[],
  graine: number,
  de: number,
  a: number,
) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  // La première semaine, après la décision, où un colis abîmé ou manquant arrive.
  const premier = t.semaines.findIndex(
    (s, w) => s !== null && w >= DEBUT[D.reception] && s.incidents > 0,
  );
  return {
    /** Le premier colis abîmé ou manquant, signé sans réserve : le transporteur ne rembourse rien. */
    litigePerdu:
      chemin[D.reception] === O.reception.signerVite &&
      premier > 0 &&
      dans(premier),
    semaineDuLitige: premier,
    trebuche: t.clientTrebuche && dans(SEMAINE_ACCIDENT),
    decolle: t.carrelageDecolle && dans(SEMAINE_DECOLLE),
    cacheeRetrouvee: t.demarqueCachee > 0 && dans(SEMAINES),
    demarqueCachee: t.demarqueCachee,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDuRayon {
  demarque: number | null;
  ruptures: number | null;
  aLHeure: number | null;
  satisfaction: number | null;
  pertes: number | null;
  plafondADate: number | null;
}

/** Ce que Camille lit à la fin d'une semaine ; les décisions à venir comptent comme « faire comme d'habitude ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDuRayon {
  if (semaine === 0) {
    return {
      demarque: DEMARQUE_TRIMESTRE_DERNIER_TOTAL / SEMAINES,
      ruptures: RUPTURES_REASSORT + ERREURS_DE_STOCK_DEPART,
      aLHeure: A_L_HEURE_DEPART,
      satisfaction: SATISFACTION_DEPART,
      pertes: 0,
      plafondADate: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    demarque: s.demarque,
    ruptures: s.ruptures,
    aLHeure: s.aLHeure,
    satisfaction: s.satisfaction,
    pertes: s.pertes,
    plafondADate: (PLAFOND_DE_PERTES * semaine) / SEMAINES,
  };
}
