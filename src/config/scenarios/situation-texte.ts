import type { EngineScenarioConfig } from "../../engine/types";
import {
  applyPeriodicity,
  composerPerte,
  PERIODICITY_DAYS,
  periodicityFromRoundDays,
  type Periodicity,
} from "./periodicity";
import type { SituationDef } from "./situation-kit";
// conseil-hotel : l'entreprise de départ, d'où se lisent les jours-consultants et les nuitées.
import { applyPeriodicityToCompany } from "./periodicity";
import { conseilCompany } from "./conseil";
import { conseilGammeCompany } from "./conseil-gamme";
import { hotelCompany } from "./hotel";
import { hotelGammeCompany } from "./hotel-gamme";
import { isProductAvailable } from "../../engine/gamme";
import { NOVA_HOME } from "../groupe/nova";

/**
 * LE TEXTE D'UNE SITUATION SE REND À LA DURÉE DU TOUR DE SA PARTIE.
 *
 * Une partie se joue au mois, au trimestre ou à l'année (ADR-01) : le moteur
 * multiplie les flux par k = jours / 90. Les situations, elles, étaient écrites
 * au trimestre, montants compris. Une salle de VOLT FITNESS jouée au mois
 * facture 35 € par adhérent et en garde 30 de marge ; son énoncé disait « 105 €
 * par trimestre » et « 90 € de marge ». La situation entière était fausse, et
 * rien ne le signalait.
 *
 * DES JETONS DANS LES CHAÎNES, ET NON DES FONCTIONS DU SCÉNARIO. Le choix tient
 * à ce qu'une situation est une DONNÉE : on la sème en base
 * (`pedagogy-seed.service`), on la copie dans un scénario d'enseignant
 * (`serialize.ts`), on en édite le texte (`situation-patch.ts`), on en compte les
 * signes (`duree-du-tour.ts`). Une fonction ne survit à aucun de ces trajets ;
 * une chaîne à jetons, si. Le dépôt a déjà ce patron pour les guides
 * (`config/guides/jetons.ts`, `{{nom}}`), et un énoncé à jetons se lit encore
 * comme une phrase : « paient {{entier: abonnement}} € {{par trimestre}} ».
 *
 * Deux sortes de jetons.
 *  · Les MOTS DE DURÉE s'écrivent tels qu'au trimestre : `{{par trimestre}}`,
 *    `{{du trimestre}}`, `{{trimestrielle}}`. La table ci-dessous dit ce qu'ils
 *    deviennent au mois et à l'année. Les mots retenus sont masculins (mois,
 *    exercice), pour ne casser aucun accord ; l'article fait partie du jeton
 *    quand l'élision le change (« du trimestre », « de l'exercice »). Un jeton
 *    qui commence par une majuscule rend sa forme capitalisée.
 *  · Les MONTANTS s'écrivent `{{format: expression}}`. L'expression lit des
 *    grandeurs du scénario (`abonnement`, `marge`, `charges`, `attrition`…) :
 *    aucun montant de configuration n'est écrit à la main, conformément à la
 *    règle du dépôt.
 *
 * D'OÙ SE LISENT LES MONTANTS. Du scénario de la partie mis à SA durée de tour
 * par `applyPeriodicity` même : la règle du moteur, pas une copie. Le scénario
 * est celui de la définition (le registre pour un secteur intégré), et non
 * l'instantané brut de la partie : le monde variable, coché par défaut, tire les
 * charges de structure à plus ou moins 2 %, et l'instantané d'une partie au
 * trimestre aurait fait dire « 106 438 € » là où l'énoncé dit « 105 000 € »
 * depuis toujours. Le texte d'une partie au trimestre reste donc, octet pour
 * octet, celui d'avant ; au mois et à l'année, il dit ce que le moteur facture
 * dans le monde figé (garde : tests/scenarios/textes-a-la-duree.test.ts).
 *
 * LE REGISTRE GARDE LE TEXTE AU TRIMESTRE. `situationsAuTrimestre` rend les
 * sources une fois, au chargement, et c'est ce rendu que portent
 * `scenarioByCode(…).situations` et `situationByCode`. Un chemin qui n'a pas de
 * partie (catalogue, éditeur, référentiel semé) lit donc la version
 * trimestrielle sans rien faire, et un chemin oublié montrerait le texte d'hier,
 * jamais des accolades. Un chemin qui a une partie passe par
 * `situationDeLaPartie`, qui retrouve la source par l'identité de l'objet.
 */

// ---------------------------------------------------------------------------
// Les mots de durée
// ---------------------------------------------------------------------------

/** Ce que devient, au mois et à l'année, une tournure écrite au trimestre. */
const MOTS: Record<string, { month: string; year: string }> = {
  trimestre: { month: "mois", year: "exercice" },
  trimestres: { month: "mois", year: "exercices" },
  "par trimestre": { month: "par mois", year: "par an" },
  "le trimestre": { month: "le mois", year: "l'exercice" },
  "du trimestre": { month: "du mois", year: "de l'exercice" },
  "au trimestre": { month: "au mois", year: "à l'exercice" },
  "de trimestre": { month: "de mois", year: "d'exercice" },
  "de trimestres": { month: "de mois", year: "d'exercices" },
  "ce trimestre": { month: "ce mois-ci", year: "cet exercice" },
  "ce trimestre-ci": { month: "ce mois-ci", year: "cet exercice" },
  trimestriel: { month: "mensuel", year: "annuel" },
  trimestrielle: { month: "mensuelle", year: "annuelle" },
  trimestriels: { month: "mensuels", year: "annuels" },
  trimestrielles: { month: "mensuelles", year: "annuelles" },
  // À l'année, l'engagement annuel EST le tour : la tournure se décale d'un cran.
  "engagements annuels plutôt que trimestriels": {
    month: "engagements annuels plutôt que mensuels",
    year: "engagements pluriannuels plutôt qu'annuels",
  },
  // --- transport-bistrot ---------------------------------------------------
  // Un placement est bloqué UN tour (`placement_arrive_a_terme`, finance/statements.ts) :
  // « à trois mois » au trimestre, c'est « jusqu'au tour suivant ».
  "à trois mois": { month: "à un mois", year: "à un an" },
  // --- fin transport-bistrot -----------------------------------------------
  // --- conseil-hotel ---
  // Un flux annuel écrit comme quatre tours d'un trimestre : douze tours d'un mois, un seul d'un an.
  "4 trimestres": { month: "12 mois", year: "1 exercice" },
  // --- nova-courriers : les tournures des situations NOVA et des courriers ---
  "ce trimestre-là": { month: "ce mois-là", year: "cet exercice-là" },
  // --- groupe batiment-boutique-ecommerce ---
  // Une part du tour, à la même cadence : deux mois de location sur trois en
  // font vingt jours sur trente, et huit mois sur douze.
  "deux mois par trimestre": { month: "vingt jours par mois", year: "huit mois par an" },
  "qu'un mois par trimestre": { month: "que dix jours par mois", year: "que quatre mois par an" },
  // Un budget plus fin que le tour : un cran sous la durée du tour.
  "mois par mois, pas trimestre par trimestre": {
    month: "semaine par semaine, pas mois par mois",
    year: "mois par mois, pas exercice par exercice",
  },
  // --- fin du groupe batiment-boutique-ecommerce ---
};

const capitaliser = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function motDeDuree(cle: string, periodicite: Periodicity): string | undefined {
  const exact = MOTS[cle];
  if (exact) return periodicite === "quarter" ? cle : exact[periodicite];
  const minuscule = cle.charAt(0).toLowerCase() + cle.slice(1);
  if (minuscule === cle || !MOTS[minuscule]) return undefined;
  return periodicite === "quarter" ? cle : capitaliser(MOTS[minuscule]![periodicite]);
}

// ---------------------------------------------------------------------------
// Les grandeurs et leurs expressions
// ---------------------------------------------------------------------------

/**
 * Un taux tel que le texte le montre : au dixième de point. L'élève refait le
 * calcul avec le taux qu'il lit ; la valeur vie se calcule donc avec lui, et
 * non avec les décimales que l'énoncé ne donne pas.
 */
const tauxLu = (x: number) => Math.round(x * 1000) / 1000;

/** Supprime le bruit des flottants avant d'arrondir : 90 ÷ 0,16 vaut 562,5, pas 562,4999… */
const net = (x: number) => Number(x.toFixed(9));

type Grandeur = (s: EngineScenarioConfig) => number;

const abonnementDe = (s: EngineScenarioConfig) => {
  if (!s.subscription) throw new Error("Situation : le jeton « abonnement » suppose un scénario par abonnement");
  return s.subscription;
};

// --- conseil-hotel ---
/** Les entreprises de départ dont une situation lit la capacité. */
const ENTREPRISES_DE_DEPART: Record<string, typeof conseilCompany> = {
  conseil: conseilCompany,
  "conseil-gamme": conseilGammeCompany,
  hotel: hotelCompany,
  "hotel-gamme": hotelGammeCompany,
};

/** L'entreprise de départ du scénario, mise à la durée de son tour par la règle du moteur. */
function entrepriseDeDepart(s: EngineScenarioConfig) {
  const fabrique = ENTREPRISES_DE_DEPART[s.code];
  if (!fabrique) throw new Error(`Situation : aucune entreprise de départ connue pour « ${s.code} »`);
  return applyPeriodicityToCompany(fabrique("situation", "situation", "human"), periodicityFromRoundDays(s.roundDays), {
    abonnement: s.subscription !== undefined,
  });
}

const investissementDe = (s: EngineScenarioConfig) => {
  if (!s.investment) throw new Error("Situation : ce jeton suppose un scénario à investissement capacitaire");
  return s.investment;
};

// --- nova-courriers : de quoi lire l'investissement, la R&D et les commandes -----


/**
 * Le premier tour où une référence en développement se vend, par la règle même
 * du moteur (`isProductAvailable`) : la R&D cumulée des tours PASSÉS doit
 * couvrir son coût, le tour de disponibilité être atteint, et, pour un
 * développement par étapes, la durée minimale écoulée depuis le démarrage.
 * `partFinancee(t)` dit quelle part du coût est engagée à la fin du tour t ; le
 * démarrage est au tour 1, celui où l'énoncé engage la première tranche. Le
 * retard de certification, un tirage, n'y entre pas : l'énoncé le dit à part.
 */
function premiereVente(s: EngineScenarioConfig, code: string, partFinancee: (tour: number) => number): number {
  const produit = s.products?.find((p) => p.code === code);
  const dev = produit?.development;
  if (!dev) throw new Error(`Situation : la référence « ${code} » n'est pas à développer dans ce scénario`);
  for (let tour = 2; tour <= 100; tour++) {
    const rd = { invested: dev.cost * partFinancee(tour - 1), launched: false, techLevel: 0, demarreAuTour: 1 };
    if (isProductAvailable({ development: dev }, rd, tour)) return tour;
  }
  throw new Error(`Situation : la référence « ${code} » ne se vend jamais`);
}

/** Les unités d'une commande d'office (cible `order`) de l'événement nommé, dans ce scénario. */
function unitesDeCommande(s: EngineScenarioConfig, code: string): number {
  const modificateurs = s.events.find((e) => e.code === code)?.modifiers.filter((m) => m.target === "order") ?? [];
  if (modificateurs.length === 0) throw new Error(`Situation : « ${code} » n'est pas une commande d'office de ce scénario`);
  return modificateurs.reduce((total, m) => total + m.value, 0);
}

/** Les grandeurs qu'un énoncé peut citer, lues du scénario mis à la durée du tour. */
const GRANDEURS: Record<string, Grandeur> = {
  /** Le prix d'un tour d'abonnement (référence du scénario). */
  abonnement: (s) => abonnementDe(s).refPrice,
  /** Le coût variable d'une unité vendue : matières et autres charges variables. */
  variable: (s) => s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit,
  /** La marge d'un tour d'abonnement. */
  marge: (s) => abonnementDe(s).refPrice - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit,
  /** Les charges de structure d'un tour. */
  charges: (s) => s.fixedCostsPerRound,
  /** L'attrition de base d'un tour, telle que le texte la montre. */
  attrition: (s) => tauxLu(abonnementDe(s).baseChurnRate),
  /** Le nombre de tours dans une année. */
  tours_par_an: (s) => 360 / s.roundDays,
  // --- transport-bistrot ---------------------------------------------------
  /**
   * La capacité du parc de départ, par tour : les machines (camions, cuisines) du parc
   * initial, chacune à sa capacité par tour. Hors abonnement, `applyPeriodicity` la met
   * à la durée du tour (× k) : 10 000 palettes au trimestre, 3 333 au mois.
   */
  capacite_parc: (s) => {
    if (!s.equipment) throw new Error("Situation : le jeton « capacite_parc » suppose un parc d'équipements");
    const types = new Map(s.equipment.types.map((t) => [t.code, t.capacityPerUnit]));
    return s.equipment.initialFleet.reduce((total, f) => {
      const capacite = types.get(f.typeCode);
      if (capacite === undefined) throw new Error(`Situation : type d'équipement inconnu « ${f.typeCode} »`);
      return total + f.count * capacite;
    }, 0);
  },
  /** Les amortissements d'un tour (`finance.depreciationPerRound`). */
  amortissements: (s) => s.finance.depreciationPerRound,
  /**
   * La durée d'amortissement d'un investissement de capacité, en tours. Une durée réelle :
   * elle se compte en tours de la nouvelle durée (12 trimestres, 36 mois, 3 exercices).
   */
  investissement_duree: (s) => {
    if (!s.investment) throw new Error("Situation : le jeton « investissement_duree » suppose un investissement");
    return s.investment.depreciationRounds;
  },
  /** La capacité qu'un investissement peut ajouter au plus en un tour : un flux par tour. */
  /** Le nombre de véhicules (ou de machines) du parc de départ, tous types confondus. */
  vehicules: (s) => {
    if (!s.equipment) throw new Error("Situation : le jeton « vehicules » suppose un parc d'équipements");
    return s.equipment.initialFleet.reduce((total, f) => total + f.count, 0);
  },
  investissement_plafond: (s) => {
    if (!s.investment) throw new Error("Situation : le jeton « investissement_plafond » suppose un investissement");
    return s.investment.maxPerRound;
  },
  /**
   * Ce qu'un porteur 12 t emmène en un tour à pleine charge : la capacité de son type
   * dans le parc (`equipment.types`), celle sur laquelle le moteur compte la flotte.
   * Hors abonnement, `applyPeriodicity` la met à la durée du tour (× k).
   */
  capacite_porteur: (s) => {
    const porteur = s.equipment?.types.find((t) => t.code === "porteur_12t");
    if (!porteur) throw new Error("Situation : le jeton « capacite_porteur » suppose un porteur 12 t dans le parc");
    return porteur.capacityPerUnit;
  },
  // --- fin transport-bistrot -----------------------------------------------
  // --- conseil-hotel ---
  /** Les jours d'un tour : les nuits qu'une chambre offre, au calendrier du moteur (30, 90, 360). */
  jours_du_tour: (s) => s.roundDays,
  /**
   * Ce que l'entreprise de départ peut vendre en un tour : le plus petit de son parc
   * et des heures de son équipe, comme le moteur produit (`engine/production`). Les
   * 720 jours-consultants d'ATLAS CONSEIL, les 5 400 nuitées de L'ESCALE au trimestre.
   */
  capacite: (s) => {
    const e = entrepriseDeDepart(s);
    return Math.min(e.machineCapacity, (e.headcount * e.hoursPerEmployee) / s.product.hoursPerUnit);
  },
  /** Les heures d'un salarié sur un tour ; au conseil, l'unité est la journée : ses jours ouvrés. */
  heures_par_salarie: (s) => entrepriseDeDepart(s).hoursPerEmployee,
  /** Le salaire chargé d'un salarié sur un tour. */
  salaire: (s) => {
    if (!s.hr) throw new Error("Situation : le jeton « salaire » suppose un scénario à effectif");
    return s.hr.salaryPerEmployeePerRound;
  },
  /** Le prix d'une unité de capacité PAR TOUR achetée en investissement. */
  cout_capacite: (s) => investissementDe(s).costPerCapacityUnit,
  /** La durée d'amortissement d'un investissement capacitaire, en tours. */
  duree_investissement: (s) => investissementDe(s).depreciationRounds,

  // --- nova-courriers : les situations NOVA et les courriers ------------------
  /** La capacité de l'atelier au départ : le parc initial, ligne par ligne, à la durée du tour. */
  capacite_initiale: (s) => {
    if (!s.equipment) throw new Error("Situation : le jeton « capacite_initiale » suppose un parc d'équipements");
    const types = new Map(s.equipment.types.map((t) => [t.code, t]));
    return s.equipment.initialFleet.reduce((total, l) => total + l.count * types.get(l.typeCode)!.capacityPerUnit, 0);
  },
  /** Le plus gros investissement capacitaire d'un tour, en unités de capacité par tour. */
  investissement_max: (s) => investissementDe(s).maxPerRound,
  /** La durée d'amortissement de cet investissement, en tours. */
  amortissement_investissement: (s) => investissementDe(s).depreciationRounds,
  /** Le taux d'actualisation par tour de l'étude de projet : le taux d'emprunt annuel au prorata du tour. */
  actualisation_du_tour: (s) => (s.finance.loanAnnualRate * s.roundDays) / 360,
  /** Le premier tour où se vend la Studio de NOVA · GAMME, financée en entier au tour 1. */
  vente_studio: (s) => premiereVente(s, "nova-studio", () => 1),
  /** Le premier tour où se vend la NOVA Home, financée en entier au tour 1 : son lancement au plus tôt. */
  home_au_plus_tot: (s) => premiereVente(s, "nova-home", () => 1),
  /** Le premier tour où se vend la NOVA Home financée par étapes : un tiers au tour 1, le reste au tour 2. */
  home_par_etapes: (s) => premiereVente(s, "nova-home", (tour) => (tour >= 2 ? 1 : 1 / 3)),
  /** La plateforme de la NOVA Home, par tour : × jours / 90, comme le niveau 7 la pose (`avecLeGroupe`). */
  plateforme_home: (s) => (NOVA_HOME.regles.plateforme.coutFixeParTour * s.roundDays) / 90,
  /** Les unités des commandes d'office, telles que le moteur les applique (`applyPeriodicity` : × jours / 90). */
  commande_tight_order: (s) => unitesDeCommande(s, "tight_order"),
  commande_xxl_order: (s) => unitesDeCommande(s, "xxl_order"),
  commande_big_order: (s) => unitesDeCommande(s, "big_order"),
  commande_boutique_commande_ce: (s) => unitesDeCommande(s, "boutique_commande_ce"),
  commande_conseil_mission_urgente: (s) => unitesDeCommande(s, "conseil_mission_urgente"),
  commande_hotel_groupe_impromptu: (s) => unitesDeCommande(s, "hotel_groupe_impromptu"),
  commande_ecom_btob: (s) => unitesDeCommande(s, "ecom_commande_b2b"),
  commande_batiment_chantier_surprise: (s) => unitesDeCommande(s, "batiment_chantier_surprise"),
  commande_transport_lot_surprise: (s) => unitesDeCommande(s, "transport_lot_surprise"),
  commande_bistrot_banquet_surprise: (s) => unitesDeCommande(s, "bistrot_banquet_surprise"),
  commande_fitness_contrat_surprise: (s) => unitesDeCommande(s, "fitness_contrat_surprise"),
  // --- groupe batiment-boutique-ecommerce (capacité du parc : `capacite_parc`, salaire : `salaire`) ---
  /** Le coût d'une embauche : un ponctuel, que la durée du tour ne change pas. */
  embauche: (s) => {
    if (!s.hr) throw new Error("Situation : le jeton « embauche » suppose un module RH");
    return s.hr.hiringCost;
  },
};

const FONCTIONS: Record<string, (x: number, s: EngineScenarioConfig) => number> = {
  /** Un taux de perte écrit au trimestre, ramené à la durée du tour par la règle du moteur. */
  perte: (x, s) => tauxLu(composerPerte(x, s.roundDays / 90)),
  /** Un montant arrondi à l'unité, quand l'énoncé calcule avec un nombre qu'il a déjà arrondi. */
  arrondi: (x) => Math.round(net(x)),
  /**
   * Un flux du récit écrit au trimestre (un montant ou un volume par tour que le scénario
   * ne porte pas : une offre, un contrat), mis à la durée du tour comme le moteur met les
   * siens (× jours / 90). Un chiffre que le scénario porte se lit par sa grandeur, jamais
   * par `flux`.
   */
  flux: (x, s) => (x * s.roundDays) / 90,
  // --- transport-bistrot ---------------------------------------------------
  // Les « environ » d'un énoncé : le même arrondi à toutes les durées. Chacun rend, au
  // trimestre, le chiffre que le texte écrivait (3 800, 4 050, 4 200…).
  /** Arrondi à la dizaine. */
  dizaine: (x) => Math.round(net(x) / 10) * 10,
  /** Arrondi à la cinquantaine. */
  cinquantaine: (x) => Math.round(net(x) / 50) * 50,
  /** Arrondi à la centaine. */
  centaine: (x) => Math.round(net(x) / 100) * 100,
  // --- fin transport-bistrot -----------------------------------------------
  // --- groupe batiment-boutique-ecommerce (l'arrondi à la dizaine : `dizaine`) ---
  /** L'entier supérieur : un seuil en unités ne s'atteint qu'à l'unité entière suivante. */
  plafond: (x) => Math.ceil(net(x)),
};

/** Une petite arithmétique : nombres, grandeurs, fonctions, + − × ÷ et parenthèses. */
function evaluer(source: string, s: EngineScenarioConfig): number {
  const jetons = source.match(/\d+(?:\.\d+)?|[a-z_]+|[-+*/()]/g) ?? [];
  if (jetons.join("") !== source.replace(/\s+/g, "")) {
    throw new Error(`Situation : expression illisible « ${source} »`);
  }
  let i = 0;
  const lire = () => jetons[i++];
  const voir = () => jetons[i];
  const facteur = (): number => {
    const t = lire();
    if (t === undefined) throw new Error(`Situation : expression incomplète « ${source} »`);
    if (t === "-") return -facteur();
    if (t === "(") {
      const v = somme();
      if (lire() !== ")") throw new Error(`Situation : parenthèse non fermée « ${source} »`);
      return v;
    }
    if (/^\d/.test(t)) return Number(t);
    if (voir() === "(") {
      const f = FONCTIONS[t];
      if (!f) throw new Error(`Situation : fonction inconnue « ${t} »`);
      lire();
      const v = somme();
      if (lire() !== ")") throw new Error(`Situation : parenthèse non fermée « ${source} »`);
      return f(v, s);
    }
    const g = GRANDEURS[t];
    if (!g) throw new Error(`Situation : grandeur inconnue « ${t} »`);
    return g(s);
  };
  const produit = (): number => {
    let v = facteur();
    while (voir() === "*" || voir() === "/") v = lire() === "*" ? v * facteur() : v / facteur();
    return v;
  };
  const somme = (): number => {
    let v = produit();
    while (voir() === "+" || voir() === "-") v = lire() === "+" ? v + produit() : v - produit();
    return v;
  };
  const v = somme();
  if (i !== jetons.length) throw new Error(`Situation : expression illisible « ${source} »`);
  if (!Number.isFinite(v)) throw new Error(`Situation : expression sans valeur « ${source} »`);
  return v;
}

// ---------------------------------------------------------------------------
// Les formats
// ---------------------------------------------------------------------------

/** Les milliers séparés d'une espace, comme les énoncés l'ont toujours écrit. */
const milliers = (n: number) => String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const entier = (x: number) => {
  const n = Math.round(net(x));
  return (n < 0 ? "-" : "") + milliers(n);
};
const avecVirgule = (x: number, min: number, max: number) =>
  net(x).toLocaleString("fr-FR", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: false });

const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize",
];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** Un entier de 0 à 99 en toutes lettres (orthographe traditionnelle). */
function enMots(n: number, feminin: boolean): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  const un = feminin ? "une" : "un";
  if (n === 1) return un;
  if (n <= 16) return UNITES[n]!;
  if (n < 20) return `dix-${UNITES[n - 10]}`;
  if (n >= 80) {
    const reste = n - 80;
    return reste === 0 ? "quatre-vingts" : `quatre-vingt-${reste === 1 ? un : enMots(reste, feminin)}`;
  }
  const dizaine = n >= 60 ? 60 : Math.floor(n / 10) * 10;
  const reste = n - dizaine;
  const tete = DIZAINES[dizaine / 10]!;
  if (reste === 0) return tete;
  if (reste === 1) return `${tete} et ${un}`;
  if (reste === 11 && dizaine === 60) return "soixante et onze";
  return `${tete}-${enMots(reste, feminin)}`;
}

/** Des points d'écart : en toutes lettres quand c'est un entier, sinon au dixième ; singulier sous deux. */
function points(x: number): string {
  const v = Math.round(net(x * 100) * 10) / 10;
  const nombre = Number.isInteger(v) && v <= 16 ? enMots(v, false) : avecVirgule(v, 0, 1);
  return `${nombre} ${Math.abs(v) < 2 ? "point" : "points"}`;
}

// --- transport-bistrot -----------------------------------------------------

/** Un entier de 0 à 999, en toutes lettres ; `devant` : suivi de « mille », qui fige « cent » et « vingt ». */
function centaines(n: number, devant: boolean): string {
  const c = Math.floor(n / 100);
  const reste = n % 100;
  let mots = reste === 0 && c > 0 ? "" : enMots(reste, false);
  if (devant && mots.endsWith("quatre-vingts")) mots = mots.slice(0, -1);
  if (c === 0) return mots;
  const cent = c === 1 ? "cent" : `${enMots(c, false)} cent${reste === 0 && !devant ? "s" : ""}`;
  return mots ? `${cent} ${mots}` : cent;
}

/**
 * Un entier de 0 à 999 999 en toutes lettres (orthographe traditionnelle) : « sept mille
 * quatre cents », « mille cent vingt », « deux mille quatre cent soixante-dix ».
 */
function enLettres(x: number): string {
  const n = Math.round(net(x));
  if (n < 0 || n > 999_999) return entier(n);
  const m = Math.floor(n / 1000);
  const reste = n % 1000;
  if (m === 0) return centaines(reste, false);
  const mille = m === 1 ? "mille" : `${centaines(m, true)} mille`;
  return reste === 0 ? mille : `${mille} ${centaines(reste, false)}`;
}

/** Un nombre au centième au plus, sans zéro inutile : « 455 », « 151,67 », « 1 820 ». */
function nombre(x: number): string {
  const v = Math.round(net(x) * 100) / 100;
  if (Number.isInteger(v)) return entier(v);
  const [ent, dec] = avecVirgule(Math.abs(v), 0, 2).split(",");
  return `${v < 0 ? "-" : ""}${milliers(Number(ent))},${dec}`;
}

// --- fin transport-bistrot -------------------------------------------------

const FORMATS: Record<string, (x: number) => string> = {
  /** Un montant à l'euro : « 105 000 ». */
  entier,
  /** Un montant au centime : « 13,50 ». */
  centimes: (x) => avecVirgule(x, 2, 2),
  /** Un taux en pour cent, au dixième : « 15 », « 5,3 ». */
  taux: (x) => avecVirgule(Math.round(net(x * 100) * 10) / 10, 0, 1),
  /** Un rapport en pour cent entier : « 50 ». */
  pourcent: (x) => entier(x * 100),
  /** Un taux en fraction, au millième : « 0,15 », « 0,053 ». */
  decimal: (x) => avecVirgule(x, 2, 3),
  /** La partie entière, en toutes lettres : « six ». */
  mots: (x) => enMots(Math.floor(net(x)), false),
  /** La même, au féminin : « une fois ». */
  mots_f: (x) => enMots(Math.floor(net(x)), true),
  /** Un écart de taux en points : « cinq points », « 1,8 point ». */
  points,
  Points: (x) => capitaliser(points(x)),
  // --- transport-bistrot ---------------------------------------------------
  /** Un entier en toutes lettres, jusqu'à 999 999 : « sept mille quatre cents ». */
  lettres: enLettres,
  /** Un nombre au centième au plus : « 455 » au trimestre, « 151,67 » au mois. */
  nombre,
  // --- fin transport-bistrot -----------------------------------------------

  // --- nova-courriers ---------------------------------------------------------
  /** Le même, en tête de phrase : « Neuf cents palettes ». */
  Lettres: (x) => capitaliser(enLettres(x)),
  /** Un taux en pour cent, au centième : « 1,25 », « 0,42 », « 5 ». */
  taux_centieme: (x) => avecVirgule(Math.round(net(x * 100) * 100) / 100, 0, 2),
  /** Le tour où une chose arrive, depuis le premier : « au suivant » pour le deuxième, « au tour 4 » au-delà. */
  au_tour: (x) => (Math.round(net(x)) === 2 ? "au suivant" : `au tour ${Math.round(net(x))}`),
};

// ---------------------------------------------------------------------------
// Le rendu
// ---------------------------------------------------------------------------

const JETON = /\{\{([^{}]+)\}\}/g;

/** Le texte, ses jetons rendus pour ce scénario (déjà mis à la durée du tour). */
export function rendreTexte(texte: string, scenario: EngineScenarioConfig): string {
  if (!texte.includes("{{")) return texte;
  const periodicite = periodicityFromRoundDays(scenario.roundDays);
  return texte.replace(JETON, (_, brut: string) => {
    const contenu = brut.trim();
    const deuxPoints = contenu.indexOf(":");
    const format = deuxPoints > 0 ? contenu.slice(0, deuxPoints).trim() : "";
    if (format === "accord") {
      // {{accord: expression | singulier | pluriel}} : le verbe suit le nombre.
      const [expression, singulier, pluriel] = contenu.slice(deuxPoints + 1).split("|").map((p) => p.trim());
      if (!expression || singulier === undefined || pluriel === undefined) {
        throw new Error(`Situation : accord mal écrit {{${brut}}}`);
      }
      const v = Math.round(net(evaluer(expression, scenario) * 100) * 10) / 10;
      return Math.abs(v) < 2 ? singulier : pluriel;
    }
    if (format && FORMATS[format]) return FORMATS[format]!(evaluer(contenu.slice(deuxPoints + 1).trim(), scenario));
    const mot = motDeDuree(contenu, periodicite);
    if (mot === undefined) throw new Error(`Situation : jeton inconnu {{${brut}}}`);
    return mot;
  });
}

/** Les jetons d'un texte brut. */
export const jetonsDe = (texte: string): string[] => [...texte.matchAll(JETON)].map((m) => m[1]!.trim());

/** Tous les champs textuels d'une situation, rendus : ceux que l'élève ou l'enseignant lit. */
export function rendreSituation(def: SituationDef, scenario: EngineScenarioConfig): SituationDef {
  const r = (t: string) => rendreTexte(t, scenario);
  return {
    ...def,
    title: r(def.title),
    narrative: r(def.narrative),
    problem: r(def.problem),
    diagnosticOptions: def.diagnosticOptions.map((o) => ({ ...o, label: r(o.label) })),
    quiz: def.quiz.map((q) => ({
      ...q,
      prompt: r(q.prompt),
      explain: r(q.explain),
      options: q.options.map((o) => ({
        ...o,
        label: r(o.label),
        ...(o.aide !== undefined ? { aide: r(o.aide) } : {}),
      })),
    })),
    hints: def.hints.map((h) => ({ ...h, text: r(h.text) })),
    decisionLevers: def.decisionLevers.map((l) => ({ ...l, hint: r(l.hint) })),
  };
}

/** Tous les textes d'une situation, à plat : de quoi chercher un jeton ou un mot oublié. */
export function textesDe(def: SituationDef): string[] {
  return [
    def.title,
    def.narrative,
    def.problem,
    ...def.diagnosticOptions.map((o) => o.label),
    ...def.quiz.flatMap((q) => [q.prompt, q.explain, ...q.options.flatMap((o) => [o.label, o.aide ?? ""])]),
    ...def.hints.map((h) => h.text),
    ...def.decisionLevers.map((l) => l.hint),
  ];
}

// ---------------------------------------------------------------------------
// Le registre au trimestre, et la partie à sa durée
// ---------------------------------------------------------------------------

interface Rendus {
  source: SituationDef;
  parDuree: Record<Periodicity, SituationDef>;
}

/** Le rendu au trimestre que porte le registre → sa source et ses rendus à chaque durée. */
const RENDUS = new WeakMap<SituationDef, Rendus>();

/**
 * Les situations d'un scénario, rendues au trimestre pour le registre. Les trois
 * durées sont rendues dès le chargement : un jeton mal écrit lève à l'import, et
 * non au milieu d'une partie au mois. Une situation sans jeton est rendue telle
 * quelle, même objet.
 */
export function situationsAuTrimestre(sources: SituationDef[], scenario: EngineScenarioConfig): SituationDef[] {
  const auMois = applyPeriodicity(scenario, "month");
  const aLAnnee = applyPeriodicity(scenario, "year");
  return sources.map((source) => {
    if (!textesDe(source).some((t) => t.includes("{{"))) return source;
    const trimestre = rendreSituation(source, applyPeriodicity(scenario, "quarter"));
    RENDUS.set(trimestre, {
      source,
      parDuree: {
        quarter: trimestre,
        month: rendreSituation(source, auMois),
        year: rendreSituation(source, aLAnnee),
      },
    });
    return trimestre;
  });
}

/** La durée d'un tour lue dans un instantané de partie (90 jours par défaut). */
export function dureeDuTourDe(instantane: unknown): number {
  const jours = (instantane as { roundDays?: unknown } | null | undefined)?.roundDays;
  return typeof jours === "number" && jours > 0 ? jours : PERIODICITY_DAYS.quarter;
}

/**
 * La situation telle que SA partie la montre. `def` est celle du registre (ou
 * d'un scénario d'enseignant, rendue telle quelle : son texte est déjà écrit).
 * Au trimestre, c'est le même objet : rien ne change, au bit près.
 */
export function situationDeLaPartie(def: SituationDef, roundDays: number): SituationDef {
  const rendus = RENDUS.get(def);
  if (!rendus) return def;
  return rendus.parDuree[periodicityFromRoundDays(roundDays)];
}

/** La source à jetons d'une situation du registre ; la situation elle-même si elle n'en a pas. */
export function sourceDe(def: SituationDef): SituationDef {
  return RENDUS.get(def)?.source ?? def;
}
