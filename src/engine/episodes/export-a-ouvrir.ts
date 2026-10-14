/**
 * LES DESSERTS QUI PLAISENT À L'EXPORT — le modèle de l'entrée de la Laiterie
 * de Kerbrélan sur le marché espagnol des desserts lactés.
 *
 * Un importateur de Saragosse, Distribuciones Nevaria, propose de distribuer
 * les desserts Kerbrélan dans les 600 supermarchés de deux enseignes
 * espagnoles qu'il livre, avec une exclusivité de cinq ans sur toute
 * l'Espagne. Le comité de direction hésite entre signer, monter une filiale
 * commerciale à Madrid ou ne pas y aller. Corto Kerouédan, directeur export,
 * a un trimestre (avril à juin) et six décisions.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une entrée sur un marché étranger se juge
 * sur des années ; l'épisode dure treize semaines. Le trimestre est donc jugé
 * sur la VALEUR CRÉÉE ESTIMÉE EN SEMAINE 13, en euros, par rapport au statu
 * quo d'avant l'offre (pas d'Espagne, l'importateur client de la crème
 * fraîche pour ses restaurants) :
 *
 *   valeur = résultat du trimestre en Espagne (marge des packs vendus, pertes
 *            comprises, moins le référencement, le soutien marketing, le coût
 *            du test, les emballages, la filiale, le retrait éventuel, le
 *            temps d'enquête)
 *          + valeur de la position prise : la VAN, sur cinq ans au taux de
 *            9 %, de la contribution annuelle de l'Espagne (packs vendus ×
 *            marge par pack − soutien marketing − frais fixes) dans le
 *            dispositif que le trimestre laisse en place, avec ce que le
 *            contrat permet : une exclusivité avec objectifs se quitte au
 *            bout d'un an d'objectifs manqués, une exclusivité de cinq ans
 *            sans objectifs ne se quitte pas ; une filiale se ferme, à un
 *            prix ;
 *          − la marge de la crème fraîche perdue (sur cinq ans) si
 *            l'importateur, éconduit, passe chez le Groupe Nordal.
 *
 * Tout est recalculé avec ce que le trimestre a révélé : l'accueil du marché
 * (lu dans les ventes, en semaine 8 pour le test et le déploiement, en
 * semaine 13 pour une filiale), la réponse de l'importateur au contrat
 * proposé (semaine 12), le retrait d'un lot mal étiqueté. Avant d'être connue,
 * chaque inconnue est prise à son espérance, et chaque décision à venir à sa
 * valeur par défaut. Le risque que les ventes s'essoufflent après la première
 * année (trois chances sur dix) n'est jamais révélé : il compte à son
 * espérance, et c'est lui qui fait la différence entre un contrat qu'on peut
 * quitter et un contrat qu'on subit.
 *
 * Cinq mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · L'ACCUEIL DU MARCHÉ EST INCERTAIN, ET UN TEST LE RÉVÈLE. Fort, moyen ou
 *     faible, avec des probabilités que l'étude de marché donne à peu près.
 *     Six semaines dans 60 magasins disent la rotation de fond, une fois
 *     passée la curiosité des deux premières semaines ; elles coûtent le
 *     test et un été de ventes. Généraliser seulement si cette rotation
 *     couvre le soutien marketing et le référencement, c'est réviser le plan
 *     sur un fait ; généraliser quoi qu'il arrive, c'est le subir.
 *   · LE PRODUIT DÉCIDE DE CE QUI VOYAGE. Un dessert frais de Loudéac a 28
 *     jours de DLC ; la route et la plateforme de l'importateur en prennent
 *     sept, et les enseignes refusent ce qui arrive avec moins des deux tiers
 *     de sa DLC. Les packs refusés ou démarqués sont à la charge de la
 *     laiterie, d'autant plus que la rotation est lente. Les desserts
 *     stérilisés UHT de Pontivy (120 jours) se vendent un peu moins, mais
 *     ne se perdent pas, et voyagent en camion non frigorifique.
 *   · LA VALEUR ET LE RISQUE SE PARTAGENT AVEC L'IMPORTATEUR. Il porte le
 *     stock, la relation avec les centrales d'achat et la mise en rayon, et
 *     prend sa marge. Une exclusivité longue sans objectifs lui laisse la
 *     marge sans l'obliger à rien : il pousse moins dès la deuxième année,
 *     on ne peut ni partir ni renégocier. Une exclusivité courte, conditionnée
 *     à des objectifs, se quitte si le marché déçoit et se renégocie s'il
 *     réussit.
 *   · L'IMPORTATEUR RÉAGIT AU HASARD SELON LA PROPOSITION. À une exclusivité
 *     de cinq ans, il dit oui ; à deux ans avec objectifs, le plus souvent ;
 *     à un contrat sans exclusivité, rarement. Une filiale lancée sous ses
 *     yeux le fait douter. S'il refuse, il prend les desserts du Groupe
 *     Nordal, et sa crème fraîche avec.
 *   · UNE FILIALE COÛTE DES FRAIS FIXES, ET MET LA LAITERIE FACE AUX
 *     CENTRALES SANS RELAIS. Elle garde la marge de l'importateur, mais paie
 *     200 k€ de frais fixes par an que seul un accueil fort couvre,
 *     référence moins de magasins et plus cher, vend moins en rayon faute
 *     de réseau, et se ferme à un prix. Lancée pendant le test, elle ne vend
 *     rien et fait douter l'importateur.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le dossier du comité se boucle avec un cabinet export payé à la journée. */
export const PERTE_PAR_JOUR = 2500;
/** Le taux d'actualisation de la laiterie, et l'horizon de la valeur de la position. */
export const TAUX = 0.09;
export const HORIZON = 5;
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
/** Ce que vaut un euro de contribution annuelle sur cinq ans : 3,89. */
export const MULTIPLE = annuite(HORIZON, TAUX);

/* ---------------------------------------------------------------------------
 * L'OFFRE DE L'IMPORTATEUR, et ce que les sources de la semaine 1 permettent
 * de calculer.
 * ------------------------------------------------------------------------- */

/** Les supermarchés que l'importateur livre, et ceux du test. */
export const MAGASINS = 600;
export const MAGASINS_TEST = 60;
/** Le prix de cession à l'importateur, par pack de quatre desserts. */
export const PRIX_CESSION = 1.6;
/** Le soutien marketing annuel qu'il demande : promotions, prospectus, têtes de gondole. */
export const SOUTIEN = 110000;
/** Les droits de référencement que les enseignes demandent, par magasin, payés par la laiterie. */
export const REFERENCEMENT = 150;
/** La marge annuelle de la crème fraîche que l'importateur achète déjà pour les restaurants. */
export const CREME = 20000;
/** Ce que la laiterie perd si l'importateur passe chez Nordal : cinq ans de cette marge. */
export const PERTE_CREME = CREME * MULTIPLE;

export type CodeGamme = "frais" | "uht";

export interface Gamme {
  id: CodeGamme;
  /** Le coût variable industriel d'un pack : lait, sucre, emballage, énergie. */
  cout: number;
  /** Le transport jusqu'à la plateforme de l'importateur, par pack. */
  transport: number;
  /** La durée limite de consommation à la sortie de l'usine, en jours. */
  dlc: number;
  /** Ce qu'un magasin en vend, rapporté aux desserts frais. */
  facteur: number;
}

export const GAMMES: Record<CodeGamme, Gamme> = {
  frais: { id: "frais", cout: 0.98, transport: 0.16, dlc: 28, facteur: 1 },
  uht: { id: "uht", cout: 1.02, transport: 0.06, dlc: 120, facteur: 0.85 },
};

/** Les jours de route et de plateforme : par l'importateur, ou en direct chez les centrales. */
export const ROUTE = { plateforme: 7, direct: 3, filiale: 6 } as const;
/** Livrer en direct en camions complets : le surcoût par pack. */
export const SURCOUT_DIRECT = 0.05;
/** Les enseignes refusent ce qui arrive avec moins des deux tiers de sa DLC. */
export const DEUX_TIERS = 2 / 3;
/** Les desserts UHT ne se perdent presque pas. */
export const PERTE_UHT = 0.01;

/**
 * LES PERTES DES DESSERTS FRAIS : refus à la réception et démarque reprise,
 * à la charge de la laiterie, en part des packs livrés. 4 % quand le pack
 * arrive avec 25 jours de DLC, deux points de plus par jour perdu ; plus la
 * rotation est lente, plus les packs vieillissent en rayon.
 */
export function perteFrais(dlcRestante: number, facteurScenario: number): number {
  return Math.min(0.6, Math.max(0.04, 0.04 + 0.02 * (25 - dlcRestante)) * facteurScenario);
}

export type CodeScenario = "fort" | "moyen" | "faible";

export interface Scenario {
  id: CodeScenario;
  chance: number;
  /** Les packs de desserts frais vendus par magasin et par semaine, curiosité passée. */
  rotation: number;
  /** Ce que la rotation fait aux pertes des desserts frais. */
  pertes: number;
}

/**
 * L'ACCUEIL DES DESSERTS FRANÇAIS EN ESPAGNE, tiré au début du trimestre.
 * L'étude de marché le dit à peu près : une chance sur quatre d'un accueil
 * fort, un peu moins d'une sur deux d'un accueil moyen, trois sur dix d'un
 * accueil faible.
 */
export const SCENARIOS: readonly Scenario[] = [
  { id: "fort", chance: 0.25, rotation: 20, pertes: 0.8 },
  { id: "moyen", chance: 0.45, rotation: 16, pertes: 1 },
  { id: "faible", chance: 0.3, rotation: 7, pertes: 1.6 },
];
export const scenario = (id: CodeScenario) => SCENARIOS.find((s) => s.id === id)!;

/** La curiosité des deux premières semaines de vente : 40 % de plus que la rotation de fond. */
export const NOUVEAUTE = { semaines: 2, hausse: 0.4 } as const;
/** Le risque que les ventes s'essoufflent après la première année, et de combien. */
export const ESSOUFFLEMENT = { chance: 0.3, facteur: 0.7 } as const;

/* ---------------------------------------------------------------------------
 * CE QUE CHAQUE DÉCISION ENGAGE.
 * ------------------------------------------------------------------------- */

/** Le test : animation et dégustations, petits lots en groupage (surcoût par pack). */
export const TEST = { semaines: 6, animation: 20000, groupage: 0.1, debut: 3, lecture: 8 } as const;
/** Le déploiement signé en semaine 1 : premières livraisons en semaine 5. */
export const DEPLOIEMENT = { debut: 5 } as const;
/**
 * La filiale de Madrid : création (avocats, recrutement du directeur pays),
 * frais fixes annuels (directeur, deux chefs de secteur, administration des
 * ventes, bureau), prix net obtenu des centrales, logistique propre,
 * référencement plus cher sans relais, ventes en rayon plus faibles faute de
 * réseau de mise en rayon, fermeture.
 */
export const FILIALE = {
  creation: 60000,
  fixes: 200000,
  prix: 2.02,
  logistique: 0.1,
  referencement: 300,
  rayon: 0.9,
  /** Les magasins référencés pendant le trimestre, puis chacune des cinq années. */
  ouverts: 250,
  magasins: [450, 600, 600, 600, 600] as readonly number[],
  ouverture: 10,
  fermeture: 150000,
} as const;
/** L'étiquette en espagnol : sur-étiquetage chez l'importateur, emballage bilingue, ou dédié. */
export const ETIQUETTE = {
  sur: { forfait: 15000, parPack: 0.04, jours: 2, chanceErreur: 0.3, retrait: 25000 },
  bilingue: { cliches: 12000 },
  dedie: { cliches: 30000, stock: 20000, hausse: 0.02 },
} as const;
/**
 * Un volontaire international en entreprise (VIE) à Madrid : 3 k€ par mois
 * pendant deux ans ; la présence en rayon fait 8 % de ventes en plus. Il
 * arrive en semaine 9, ou en semaine 11 si l'agence qui recrute les VIE n'a
 * pas de candidat prêt.
 */
export const VIE = {
  mensuel: 3000,
  hausse: 0.08,
  annees: 2,
  tot: 9,
  tard: 11,
  chanceTot: 0.6,
} as const;
/** La filiale lancée pendant le test : création et frais fixes, puis sa fermeture ou sa reconversion. */
export const FILIALE_ANTICIPEE = { creation: 60000, fermeture: 60000, doute: 0.6 } as const;
/** Prolonger le test de trois mois : les ventes de la première année réduites d'autant. */
export const PROLONGATION = { animation: 10000, premiereAnnee: 0.6 } as const;
/** La première année d'une généralisation en septembre : deux mois à 60 magasins, dix à 600. */
export const PREMIERE_ANNEE_TEST = 0.9;

export type CodeContrat = "troisAns" | "deuxAns" | "cinqAns" | "simple";

export interface Contrat {
  id: CodeContrat;
  /** La durée de l'engagement, en années : on ne part pas avant son terme, sauf objectifs manqués. */
  duree: number;
  /** La chance que l'importateur l'accepte, sans filiale sous ses yeux. */
  accord: number;
  /** Ce qu'il pousse, rapporté à un importateur tenu par des objectifs. */
  effort: number;
  /** L'année à partir de laquelle il pousse moins : la deuxième pour une exclusivité acquise, dès la première sans exclusivité. */
  effortDes: number;
  /** Des objectifs de rotation : manqués, ils permettent de partir avant le terme. */
  objectifs: boolean;
  /** L'année à partir de laquelle on renégocie le prix de cession, si le marché tient ; 0 : jamais. */
  renegociation: number;
  /** Le soutien de lancement concédé la première année. */
  concession: number;
}

export const CONTRATS: Record<CodeContrat, Contrat> = {
  troisAns: {
    id: "troisAns",
    duree: 3,
    accord: 1,
    effort: 1,
    effortDes: 1,
    objectifs: true,
    renegociation: 4,
    concession: 70000,
  },
  deuxAns: {
    id: "deuxAns",
    duree: 2,
    accord: 0.85,
    effort: 1,
    effortDes: 1,
    objectifs: true,
    renegociation: 3,
    concession: 0,
  },
  cinqAns: {
    id: "cinqAns",
    duree: 5,
    accord: 1,
    effort: 0.85,
    effortDes: 2,
    objectifs: false,
    renegociation: 0,
    concession: 0,
  },
  simple: {
    id: "simple",
    duree: 1,
    accord: 0.5,
    effort: 0.9,
    effortDes: 1,
    objectifs: false,
    renegociation: 0,
    concession: 0,
  },
};
/** Quitter une exclusivité avant son terme : reprise du stock de l'importateur. */
export const SORTIE = 30000;
/** Se retirer des rayons, à tout moment : reprise des invendus et frais de retrait, par magasin. */
export const RETRAIT_DES_RAYONS = 100;
/** Dans un marché faible, les enseignes retirent dès la deuxième année les références qui ne tournent pas. */
export const DEREFERENCEMENT = 0.5;
/** Dans un marché faible, l'importateur réclame en plus des promotions pour garder les références. */
export const DEFENSE = 70000;
/** Ce qu'une renégociation fait gagner, par pack, quand les objectifs sont tenus. */
export const REVALORISATION = 0.1;
/** Le VIE resserre la relation : un peu plus de chances que l'importateur accepte. */
export const BONUS_VIE = 0.05;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  entree: 0,
  gamme: 1,
  etiquette: 2,
  relais: 3,
  suite: 4,
  contrat: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 12] as const;

/**
 * Ne rien changer, décision par décision : décliner l'offre, garder la gamme
 * vue au salon, laisser l'importateur sur-étiqueter, suivre depuis Loudéac,
 * laisser le test continuer, accorder ce qu'il demande.
 */
export const NEUTRE = [3, 0, 0, 2, 2, 2] as const;

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
  effet: { jours?: number; ventes?: number; pertes?: number; transport?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "frontiere",
    titre: "Des barrages routiers à la frontière",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Des agriculteurs bloquent l'autoroute au Perthus depuis mardi. Nos camions pour l'Espagne passent par Irun avec trois jours de retard cette semaine.",
    duree: 1,
    effet: { jours: 3 },
  },
  {
    id: "chaleur",
    titre: "Une vague de chaleur sur l'Espagne",
    de: "Annaïg Le Dantec",
    role: "Responsable qualité",
    texte:
      "Quarante degrés annoncés à Saragosse et à Madrid pour deux semaines. Les enseignes espagnoles contrôlent les températures à quai : tout lot frais qui a frôlé la limite sera refusé.",
    duree: 2,
    effet: { pertes: 0.05 },
  },
  {
    id: "gazole",
    titre: "Une surcharge carburant sur le transport",
    de: "Transports Kerfroid",
    role: "Service clients",
    texte:
      "Le gazole a pris 9 % en un mois : la surcharge carburant de nos tarifs internationaux passe à 1,5 centime par pack jusqu'à nouvel ordre.",
    duree: 13,
    effet: { transport: 0.015 },
  },
  {
    id: "television",
    titre: "Une émission espagnole sur la cuisine bretonne",
    de: "Herveline Daniélou",
    role: "Directrice marketing et innovation",
    texte:
      "Une émission de cuisine très suivie en Espagne a consacré un numéro à la Bretagne, desserts au lait compris. Nevaria nous dit que ça se sent en rayon depuis lundi.",
    duree: 2,
    effet: { ventes: 0.15 },
  },
  {
    id: "adv",
    titre: "L'administration des ventes export en arrêt",
    de: "Baptistin Haddadi",
    role: "Directeur commercial",
    texte:
      "L'assistante de l'administration des ventes export est arrêtée une semaine. Les commandes de nos clients étrangers sont saisies avec retard : des ruptures en rayon à prévoir.",
    duree: 1,
    effet: { ventes: -0.3 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: CodeScenario;
  /** L'importateur accepte le contrat proposé si ce tirage est sous sa probabilité. */
  uImportateur: number;
  /** Le sur-étiquetage laisse-t-il passer une erreur sur la mention des allergènes, et quand ? */
  uEtiquette: number;
  semaineErreur: number;
  /** La semaine où le VIE arrive à Madrid, s'il est recruté. */
  semaineVie: number;
  /** L'écart des ventes de chaque semaine à la rotation de fond (indices 1 à 13). */
  bruit: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001159 + 7);
  const u = r();
  const scenario: CodeScenario = u < 0.25 ? "fort" : u < 0.7 ? "moyen" : "faible";
  const uImportateur = r();
  const uEtiquette = r();
  const semaineErreur = 7 + Math.floor(r() * 4);
  const semaineVie = r() < VIE.chanceTot ? VIE.tot : VIE.tard;
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.06 * gauss(r), -0.15, 0.15));
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
    uImportateur,
    uEtiquette,
    semaineErreur,
    semaineVie,
    bruit,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);
const actif = (h: Hasard, id: string, w: number) => {
  const i = imprevu(h, id);
  return i !== undefined && w >= i.semaine && w < i.semaine + i.imprevu.duree;
};

/* ---------------------------------------------------------------------------
 * LES CHOIX, LUS DANS LE CHEMIN.
 * ------------------------------------------------------------------------- */

export type Entree = "signe" | "test" | "filiale" | "decline";
export const entreeDe = (chemin: readonly number[]): Entree =>
  (["signe", "test", "filiale", "decline"] as const)[chemin[D.entree]!]!;
export const gammeDe = (chemin: readonly number[]): CodeGamme =>
  chemin[D.gamme] === 1 ? "uht" : "frais";
/** Les desserts frais livrés en direct chez les centrales, sans passer par la plateforme. */
export const enDirect = (chemin: readonly number[]) => chemin[D.gamme] === 2;
export type CodeEtiquette = "sur" | "bilingue" | "dedie";
export const etiquetteDe = (chemin: readonly number[]): CodeEtiquette =>
  (["sur", "bilingue", "dedie"] as const)[chemin[D.etiquette]!]!;
export type Relais = "filiale" | "vie" | "loudeac";
export const relaisDe = (chemin: readonly number[]): Relais =>
  (["filiale", "vie", "loudeac"] as const)[chemin[D.relais]!]!;
export const contratDe = (chemin: readonly number[]): Contrat =>
  CONTRATS[(["troisAns", "deuxAns", "cinqAns", "simple"] as const)[chemin[D.contrat]!]!];

/** Les jours de DLC qui restent à un pack quand il arrive chez l'enseigne. */
export function dlcALaReception(chemin: readonly number[], retard = 0): number {
  const g = GAMMES[gammeDe(chemin)];
  const route =
    entreeDe(chemin) === "filiale"
      ? ROUTE.filiale
      : enDirect(chemin)
        ? ROUTE.direct
        : ROUTE.plateforme;
  const etiquetage = etiquetteDe(chemin) === "sur";
  return g.dlc - route - (etiquetage ? ETIQUETTE.sur.jours : 0) - retard;
}

/** Les pertes, en part des packs livrés : refus à la réception et démarque reprise. */
export function pertes(chemin: readonly number[], s: CodeScenario, retard = 0): number {
  if (gammeDe(chemin) === "uht") return PERTE_UHT;
  return perteFrais(dlcALaReception(chemin, retard), scenario(s).pertes);
}

/**
 * LA MARGE PAR PACK VENDU : le prix, moins ce que coûtent les packs livrés
 * pour en vendre un (coût variable, transport, étiquette, groupage du test),
 * pertes comprises.
 */
export function margeParPack(
  chemin: readonly number[],
  s: CodeScenario,
  o: { test?: boolean; retard?: number; perteEnPlus?: number; transportEnPlus?: number } = {},
): number {
  const g = GAMMES[gammeDe(chemin)];
  const filiale = entreeDe(chemin) === "filiale";
  const prix = filiale ? FILIALE.prix : PRIX_CESSION;
  const livre =
    g.cout +
    g.transport +
    (o.transportEnPlus ?? 0) +
    (enDirect(chemin) ? SURCOUT_DIRECT : 0) +
    (filiale ? FILIALE.logistique : 0) +
    (etiquetteDe(chemin) === "sur" ? ETIQUETTE.sur.parPack : 0) +
    (o.test ? TEST.groupage : 0);
  const perte = Math.min(0.9, pertes(chemin, s, o.retard ?? 0) + (o.perteEnPlus ?? 0));
  return prix - livre / (1 - perte);
}

/** Ce qu'un magasin vend chaque semaine, curiosité passée, selon la gamme, l'emballage et le relais. */
export function rotation(chemin: readonly number[], s: CodeScenario, avecVie: boolean): number {
  const g = GAMMES[gammeDe(chemin)];
  const filiale = entreeDe(chemin) === "filiale";
  return (
    scenario(s).rotation *
    g.facteur *
    (filiale ? FILIALE.rayon : 1) *
    (avecVie && !filiale ? 1 + VIE.hausse : 1) *
    (etiquetteDe(chemin) === "dedie" ? 1 + ETIQUETTE.dedie.hausse : 1)
  );
}

/* ---------------------------------------------------------------------------
 * LA VALEUR DE LA POSITION PRISE, en semaine 13.
 * ------------------------------------------------------------------------- */

const actualise = (t: number) => 1 / (1 + TAUX) ** t;

/**
 * LE SEUIL DE GÉNÉRALISATION : la rotation de fond, en packs par magasin et
 * par semaine, à partir de laquelle 600 magasins couvrent le soutien
 * marketing et le référencement des 540 magasins à ouvrir, étalé sur cinq
 * ans. Il dépend de la marge par pack, donc de la gamme et de l'étiquette.
 */
export function seuilDeGeneralisation(chemin: readonly number[], s: CodeScenario = "moyen") {
  const m = margeParPack(chemin, s);
  const fixe = SOUTIEN + (REFERENCEMENT * (MAGASINS - MAGASINS_TEST)) / MULTIPLE;
  return fixe / (m * MAGASINS * 52);
}

/**
 * La VAN, sur cinq ans, d'un contrat d'importation sur 600 magasins dans un
 * scénario donné. L'essoufflement possible compte à son espérance. Une année
 * perdante, on part si le contrat le permet : à son terme, ou avant quand des
 * objectifs sont manqués (ils le sont quand les ventes tombent sous le niveau
 * du test, pas quand ils ont été fixés sur un test faible). Partir avant le
 * terme d'une exclusivité coûte. Un contrat qui tient se renégocie à son
 * terme, si le marché tient.
 */
export function vanImportateur(
  chemin: readonly number[],
  s: CodeScenario,
  c: Contrat,
  o: { premiereAnnee: number; soutienPremiere: number; vie: boolean },
): number {
  const m = margeParPack(chemin, s);
  const rot = rotation(chemin, s, o.vie);
  const branche = (essouffle: boolean) => {
    let total = 0;
    for (let t = 1; t <= HORIZON; t += 1) {
      const effort = t >= c.effortDes ? c.effort : 1;
      const recul = t >= 2 && (essouffle || s === "faible");
      const r =
        rot *
        effort *
        (essouffle && t >= 2 ? ESSOUFFLEMENT.facteur : 1) *
        (s === "faible" && t >= 2 ? DEREFERENCEMENT : 1);
      const volume = r * MAGASINS * 52 * (t === 1 ? o.premiereAnnee : 1);
      const reneg =
        c.renegociation > 0 && t >= c.renegociation && !recul ? REVALORISATION * volume : 0;
      const contribution =
        volume * m +
        reneg -
        SOUTIEN * (t === 1 ? o.soutienPremiere : 1) -
        (t === 1 ? c.concession : 0) -
        (s === "faible" && t >= 2 ? DEFENSE : 0) -
        (o.vie && t <= VIE.annees ? VIE.mensuel * 12 : 0);
      total += contribution * actualise(t);
      if (contribution < 0 && t < HORIZON) {
        const auTerme = t >= c.duree;
        if (auTerme || (c.objectifs && recul)) {
          total -= (RETRAIT_DES_RAYONS * MAGASINS + (auTerme ? 0 : SORTIE)) * actualise(t);
          break;
        }
      }
    }
    return total;
  };
  return (1 - ESSOUFFLEMENT.chance) * branche(false) + ESSOUFFLEMENT.chance * branche(true);
}

/** La VAN, sur cinq ans, d'une filiale qui sert elle-même les centrales ; on la ferme si elle perd. */
export function vanFiliale(chemin: readonly number[], s: CodeScenario): number {
  const m = margeParPack(chemin, s);
  const rot = rotation(chemin, s, false);
  const branche = (essouffle: boolean) => {
    let total = 0;
    for (let t = 1; t <= HORIZON; t += 1) {
      const magasins = FILIALE.magasins[t - 1]!;
      const nouveaux = magasins - (t === 1 ? FILIALE.ouverts : FILIALE.magasins[t - 2]!);
      const r =
        rot *
        (essouffle && t >= 2 ? ESSOUFFLEMENT.facteur : 1) *
        (s === "faible" && t >= 2 ? DEREFERENCEMENT : 1);
      const contribution =
        r * magasins * 52 * m - FILIALE.fixes - Math.max(0, nouveaux) * FILIALE.referencement;
      total += contribution * actualise(t);
      if (t >= 2 && t < HORIZON && contribution < 0) {
        total -= FILIALE.fermeture * actualise(t);
        break;
      }
    }
    return total;
  };
  return (1 - ESSOUFFLEMENT.chance) * branche(false) + ESSOUFFLEMENT.chance * branche(true);
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La généralisation que la décision de la semaine 8 engage, au vu du test. */
export function generalise(chemin: readonly number[], s: CodeScenario): boolean {
  if (entreeDe(chemin) !== "test") return false;
  const suite = chemin[D.suite]!;
  if (suite === 0) return true;
  if (suite === 3) return false;
  return rotation(chemin, s, false) >= seuilDeGeneralisation(chemin, s);
}

/** La chance que l'importateur accepte le contrat proposé. */
export function chanceDAccord(chemin: readonly number[]): number {
  const c = contratDe(chemin);
  const r = relaisDe(chemin);
  if (c.id === "cinqAns") return 1;
  const p =
    c.accord * (r === "filiale" ? FILIALE_ANTICIPEE.doute : 1) + (r === "vie" ? BONUS_VIE : 0);
  return Math.min(1, p);
}

/** L'importateur accepte-t-il le contrat proposé en semaine 11 ? */
export const accordImportateur = (chemin: readonly number[], graine: number) =>
  hasard(graine).uImportateur < chanceDAccord(chemin);

/** Le sur-étiquetage laisse passer une erreur sur la mention des allergènes, trois fois sur dix. */
export const erreurDEtiquette = (chemin: readonly number[], graine: number) =>
  entreeDe(chemin) !== "decline" &&
  etiquetteDe(chemin) === "sur" &&
  hasard(graine).uEtiquette < ETIQUETTE.sur.chanceErreur;

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** Le résultat cumulé du trimestre en Espagne, en euros. */
  resultat: number;
  /** Les packs vendus en Espagne dans la semaine. */
  packs: number;
  /** Les magasins qui vendent les desserts Kerbrélan. */
  magasins: number;
  /** La DLC qui reste aux packs à leur arrivée chez l'enseigne, en jours. */
  dlc: number;
  /** Les pertes de la semaine, en part des packs livrés. */
  pertes: number;
  /** Les sommes engagées depuis le début du trimestre, en euros. */
  engage: number;
};

/** Les magasins qui vendent en semaine w. */
function magasinsEn(chemin: readonly number[], w: number): number {
  const e = entreeDe(chemin);
  if (e === "signe") return w >= DEPLOIEMENT.debut ? MAGASINS : 0;
  if (e === "test") return w >= TEST.debut ? MAGASINS_TEST : 0;
  if (e === "filiale") return w >= FILIALE.ouverture ? FILIALE.ouverts : 0;
  return 0;
}
/** La première semaine de vente. */
const debutDesVentes = (chemin: readonly number[]) => {
  const e = entreeDe(chemin);
  return e === "signe" ? DEPLOIEMENT.debut : e === "test" ? TEST.debut : FILIALE.ouverture;
};

/** La semaine où l'accueil du marché est connu. */
export const semaineDeLecture = (chemin: readonly number[]) => {
  const e = entreeDe(chemin);
  return e === "filiale" ? SEMAINES : e === "decline" ? Infinity : TEST.lecture;
};

/** Le chemin tel qu'il est connu en fin de semaine w : les décisions à venir valent « ne rien changer ». */
const effectif = (chemin: readonly number[], w: number) =>
  chemin.map((c, k) => (w >= EFFET[k]! ? c : NEUTRE[k]!));

export interface Flux {
  marge: number;
  couts: number;
  packs: number;
  magasins: number;
  dlc: number;
  pertes: number;
}

/** Ce que la semaine w rapporte et coûte, avec les décisions prises jusque-là. */
function semaine(chemin: readonly number[], graine: number, w: number): Flux {
  const h = hasard(graine);
  const c = effectif(chemin, w);
  const e = entreeDe(c);
  let couts = 0;
  // Ce que chaque décision coûte la semaine où elle prend effet.
  if (w === EFFET[D.entree]) {
    if (e === "signe") couts += REFERENCEMENT * MAGASINS;
    if (e === "test") couts += REFERENCEMENT * MAGASINS_TEST + TEST.animation;
    if (e === "filiale") couts += FILIALE.creation;
  }
  if (e === "filiale" && w >= 3) couts += FILIALE.fixes / 52;
  if (e === "filiale" && w === FILIALE.ouverture) couts += FILIALE.ouverts * FILIALE.referencement;
  if (e !== "decline" && w === EFFET[D.etiquette]) {
    const et = etiquetteDe(c);
    if (et === "sur") couts += ETIQUETTE.sur.forfait;
    if (et === "bilingue") couts += ETIQUETTE.bilingue.cliches;
    if (et === "dedie") couts += ETIQUETTE.dedie.cliches + ETIQUETTE.dedie.stock;
  }
  const relais = e === "signe" || e === "test" ? relaisDe(c) : "loudeac";
  if (relais === "vie" && w >= h.semaineVie) couts += (VIE.mensuel * 12) / 52;
  if (relais === "filiale") {
    if (w === EFFET[D.relais]) couts += FILIALE_ANTICIPEE.creation;
    if (w > EFFET[D.relais]) couts += FILIALE.fixes / 52;
  }
  if (e === "signe" && w >= DEPLOIEMENT.debut) couts += SOUTIEN / 52;

  const magasins = magasinsEn(c, w);
  const s = h.scenario;
  const retard = actif(h, "frontiere", w) ? (imprevu(h, "frontiere")!.imprevu.effet.jours ?? 0) : 0;
  const perteEnPlus =
    actif(h, "chaleur", w) && gammeDe(c) === "frais"
      ? (imprevu(h, "chaleur")!.imprevu.effet.pertes ?? 0)
      : 0;
  const transportEnPlus =
    imprevu(h, "gazole") && w >= imprevu(h, "gazole")!.semaine
      ? (imprevu(h, "gazole")!.imprevu.effet.transport ?? 0)
      : 0;
  const dlc = e === "decline" ? 0 : dlcALaReception(c, retard);
  const perte = e === "decline" ? 0 : Math.min(0.9, pertes(c, s, retard) + perteEnPlus);
  if (magasins === 0) return { marge: 0, couts, packs: 0, magasins, dlc, pertes: perte };

  const depuis = w - debutDesVentes(c);
  const curiosite = depuis < NOUVEAUTE.semaines ? 1 + NOUVEAUTE.hausse : 1;
  let ventes = 1 + h.bruit[w]!;
  for (const id of ["television", "adv"]) {
    if (actif(h, id, w)) ventes += imprevu(h, id)!.imprevu.effet.ventes ?? 0;
  }
  // Un lot mal étiqueté retiré : deux semaines sans ventes, et le retrait à payer.
  const erreur = erreurDEtiquette(c, graine);
  const retire = erreur && (w === h.semaineErreur || w === h.semaineErreur + 1);
  if (erreur && w === h.semaineErreur) couts += ETIQUETTE.sur.retrait;
  const vie = relais === "vie" && w >= h.semaineVie;
  const packs = retire ? 0 : magasins * rotation(c, s, vie) * curiosite * Math.max(0, ventes);
  const m = margeParPack(c, s, {
    test: e === "test",
    retard,
    perteEnPlus,
    transportEnPlus,
  });
  return { marge: packs * m, couts, packs, magasins, dlc, pertes: perte };
}

/**
 * LA VALEUR DE LA POSITION, telle qu'on l'estime en fin de semaine w, pour un
 * chemin effectif et un scénario donnés (l'espérance sur les scénarios est
 * prise plus bas), avec la réponse de l'importateur si elle est connue.
 */
function position(c: readonly number[], s: CodeScenario, graine: number, w: number): number {
  const e = entreeDe(c);
  if (e === "decline") return w >= EFFET[D.entree] ? -PERTE_CREME : 0;
  if (e === "filiale") return vanFiliale(c, s) - PERTE_CREME;
  const vie = relaisDe(c) === "vie";
  const filialeEnPlus = relaisDe(c) === "filiale" ? -FILIALE_ANTICIPEE.fermeture : 0;
  if (e === "signe") {
    return (
      vanImportateur(c, s, CONTRATS.cinqAns, { premiereAnnee: 1, soutienPremiere: 1, vie }) +
      filialeEnPlus
    );
  }
  // Le test : généraliser ou non, puis la réponse de l'importateur au contrat proposé.
  const prolonge = c[D.suite] === 2;
  if (!generalise(c, s)) {
    return (
      filialeEnPlus - RETRAIT_DES_RAYONS * MAGASINS_TEST - (prolonge ? PROLONGATION.animation : 0)
    );
  }
  const premiereAnnee = prolonge ? PROLONGATION.premiereAnnee : PREMIERE_ANNEE_TEST;
  const contrat = contratDe(c);
  const deal =
    vanImportateur(c, s, contrat, { premiereAnnee, soutienPremiere: 1, vie }) -
    REFERENCEMENT * (MAGASINS - MAGASINS_TEST) -
    (prolonge ? PROLONGATION.animation : 0);
  const p = w >= EFFET[D.contrat] ? (accordImportateur(c, graine) ? 1 : 0) : chanceDAccord(c);
  return filialeEnPlus + p * deal - (1 - p) * PERTE_CREME;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  entree: Entree;
  gamme: CodeGamme;
  scenario: CodeScenario;
  /** Le résultat du trimestre en Espagne, et la valeur de la position en semaine 13. */
  resultat: number;
  position: number;
  /** Les packs vendus sur le trimestre, et la rotation de fond lue en semaine 8. */
  packs: number;
  rotationLue: number | null;
  seuil: number;
  generalise: boolean;
  /** La réponse de l'importateur au contrat de la semaine 11 : `null` s'il n'y en a pas eu. */
  accord: boolean | null;
  /** L'importateur est-il passé chez Nordal ? */
  nordal: boolean;
  erreurEtiquette: boolean;
  dlc: number;
  /** Les pertes des packs livrés sur le trimestre : refus et démarque. */
  pertes: number;
  engage: number;
  /** Le contrat d'importation en place en semaine 13, s'il y en a un. */
  contrat: CodeContrat | null;
  relais: Relais;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let resultat = -enquete;
  let engage = enquete;
  let packs = 0;
  let livres = 0;
  let avant = 0;
  let derniere = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const f = semaine(chemin, graine, w);
    resultat += f.marge - f.couts;
    engage += f.couts;
    packs += f.packs;
    livres += f.packs / (1 - f.pertes);
    const c = effectif(chemin, w);
    const connu = w >= semaineDeLecture(c);
    const pos = connu
      ? position(c, h.scenario, graine, w)
      : SCENARIOS.reduce((t, s) => t + s.chance * position(c, s.id, graine, w), 0);
    const valeur = resultat + pos;
    semaines.push({
      valeur,
      variation: valeur - avant,
      resultat,
      packs: f.packs,
      magasins: f.magasins,
      dlc: f.dlc,
      pertes: f.pertes,
      engage,
    });
    avant = valeur;
    derniere = pos;
  }
  const e = entreeDe(chemin);
  const gen = generalise(chemin, h.scenario);
  const accord = e === "test" && gen ? accordImportateur(chemin, graine) : null;
  return {
    semaines,
    objectif: semaines[SEMAINES]!.valeur,
    entree: e,
    gamme: gammeDe(chemin),
    scenario: h.scenario,
    resultat,
    position: derniere,
    packs,
    rotationLue: e === "test" || e === "signe" ? rotation(chemin, h.scenario, false) : null,
    seuil: seuilDeGeneralisation(chemin, h.scenario),
    generalise: gen,
    accord,
    nordal: e === "decline" || e === "filiale" || accord === false,
    erreurEtiquette: erreurDEtiquette(chemin, graine),
    dlc: dlcALaReception(chemin),
    pertes: livres > 0 ? 1 - packs / livres : 0,
    engage,
    contrat: e === "signe" ? "cinqAns" : accord ? contratDe(chemin).id : null,
    relais: relaisDe(chemin),
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, lectures, retrait, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const e = t.entree;
  return {
    reponse: dans(EFFET[D.entree]),
    premiersLots: (e === "test" || e === "signe") && dans(debutDesVentes(chemin)),
    vie: (e === "test" || e === "signe") && relaisDe(chemin) === "vie" && dans(h.semaineVie),
    filialeVue: e === "test" && relaisDe(chemin) === "filiale" && dans(TEST.lecture),
    retrait: t.erreurEtiquette && dans(h.semaineErreur),
    lecture: (e === "test" || e === "signe") && dans(TEST.lecture),
    suite: e === "test" && dans(EFFET[D.suite]),
    contrat: e === "test" && t.generalise && dans(EFFET[D.contrat]),
    filiale: e === "filiale" && dans(FILIALE.ouverture),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureExport {
  valeur: number | null;
  resultat: number | null;
  packs: number | null;
  dlc: number | null;
  pertes: number | null;
  /** Non affichés : ce que les messages, les sources et la jauge lisent. */
  dlcUsine: number | null;
  magasins: number | null;
  engage: number | null;
  /** La rotation de fond lue par le test ou les premières semaines, une fois connue. */
  rotation: number | null;
  /** L'accueil du marché, une fois lu : 0 fort, 1 moyen, 2 faible. */
  scenario: number | null;
}

/**
 * Ce que Corto lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureExport {
  if (semaine === 0) {
    return {
      valeur: 0,
      resultat: 0,
      packs: 0,
      dlc: null,
      pertes: null,
      dlcUsine: null,
      magasins: 0,
      engage: 0,
      rotation: null,
      scenario: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const lu = semaine >= semaineDeLecture(chemin);
  const vend = s.magasins > 0;
  return {
    valeur: s.valeur,
    resultat: s.resultat,
    packs: s.packs,
    dlc: vend ? s.dlc : null,
    pertes: vend ? s.pertes : null,
    dlcUsine: vend ? GAMMES[gammeDe(chemin)].dlc : null,
    magasins: s.magasins,
    engage: s.engage,
    rotation: lu && t.rotationLue !== null ? t.rotationLue : null,
    scenario: lu ? SCENARIOS.findIndex((x) => x.id === t.scenario) : null,
  };
}
