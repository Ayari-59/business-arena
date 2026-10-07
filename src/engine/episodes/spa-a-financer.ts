/**
 * LE SPA QUI NE SE RENTABILISE PAS SEUL — le modèle du projet de spa de
 * L'Escale Évian.
 *
 * L'Escale Évian, 4 étoiles de 66 chambres au bord du Léman : loisirs l'été,
 * séminaires et mariages, une Table d'Augustin. La directrice de l'hôtel veut
 * un spa (bassin intérieur, sauna, hammam, quatre cabines de soins) : 1,4 M€.
 * Le conseil de famille du Groupe Escale a trois usages pour cet argent : le
 * spa, la rénovation des 66 chambres, ou rien. Le directeur administratif et
 * financier instruit le dossier d'octobre à décembre, pendant la préparation
 * du budget, et monte le financement avec la Banque des Aravis. Treize
 * semaines, six décisions.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Un investissement se juge sur des années,
 * l'épisode sur un trimestre. Le trimestre est jugé sur la VALEUR CRÉÉE
 * ESTIMÉE en semaine 13, en euros :
 *
 *   la VAN, au taux du groupe (9 %, flux avant impôt), sur douze ans, des flux
 *   DIFFÉRENTIELS du projet que le conseil de famille adopte : ce que l'hôtel
 *   gagne de plus avec le projet que sans lui (prix moyen, nuitées des
 *   week-ends de basse saison, séminaires, compte propre du spa, plans
 *   commerciaux décidés), investissement, renouvellement de la sixième année
 *   et valeur résiduelle compris ;
 *   + ce que le financement retenu coûte de plus qu'un emprunt au prix du
 *     marché, et ce que coûterait une tension de trésorerie du groupe au
 *     point bas de mars ;
 *   − les sommes engagées ce trimestre (avant-projet, étude, recrutement) ;
 *   − les jours d'enquête au-delà de deux.
 *
 * Elle est recalculée chaque semaine avec ce que le trimestre a révélé :
 * l'étude du cabinet (semaine 7) ou l'analyse du revenue management
 * (semaine 6), les pré-ventes des forfaits croisées avec le fichier clients
 * (semaine 8), la réponse des clients d'Aix-les-Bains au transfert de leurs
 * séminaires, l'enquête sur la gêne des abonnements (semaine 10), l'avis de
 * la banque et la saison de Megève (semaine 12), et le bilan de
 * l'Observatoire du tourisme, qui publie en semaine 12 l'effet réel d'un spa
 * sur le prix moyen des 4 étoiles du Léman. Tant qu'une chose n'est pas sue,
 * elle est prise en espérance. Ne rien engager vaut zéro.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · UN INVESTISSEMENT HÔTELIER SE JUGE SUR TOUT L'HÔTEL. Le spa perd de
 *     l'argent sur son propre compte : les clients de l'hôtel y entrent sans
 *     payer, et son EBE est négatif. Mais il relève le prix moyen de TOUTES
 *     les chambres, remplit des week-ends de basse saison et attire des
 *     séminaires. À l'inverse, tout ce que la directrice annonce n'est pas
 *     différentiel : la moitié des forfaits bien-être seraient vendus à des
 *     habitués qui viennent déjà ; les séminaires transférés d'Aix-les-Bains
 *     ne rapportent rien au groupe, et certains clients d'Aix s'en vont ;
 *     vendre des abonnements aux habitants pour « équilibrer » le spa rend son
 *     compte bénéficiaire et coûte à l'hôtel plus qu'il ne rapporte : un spa
 *     bondé ne justifie plus le prix des chambres.
 *   · L'EFFET PRIX EST INCERTAIN, ET L'INFORMATION A UN PRIX. Selon les spas
 *     ouverts au bord des lacs alpins, l'effet sur le prix moyen est faible
 *     (5 €), moyen (10 €) ou fort (14 €), à peu près trois, quatre et demi et
 *     deux et demi chances sur dix. Faible, le spa détruit de la valeur et la
 *     rénovation vaut mieux. Une étude payante dit le scénario avant le
 *     conseil de famille ; l'analyse gratuite du revenue management le devine
 *     à 3 ou 4 € près. L'étude ne vaut que si l'on s'en sert : présenter au
 *     conseil ce que les chiffres désignent, et non le dossier d'octobre.
 *   · LE FINANCEMENT NE CHANGE PAS LA VALEUR DU PROJET, MAIS LA TRÉSORERIE DU
 *     GROUPE. Un emprunt au prix du marché ne crée ni ne détruit de valeur ;
 *     un crédit-bail plus cher en détruit, même si ses loyers « sont couverts
 *     par les flux du spa » ; payer comptant n'a pas d'intérêts mais vide la
 *     trésorerie du groupe avant le point bas de mars, et une tension coûte.
 *
 * Le hasard porte sur l'effet prix (le scénario de marché), la cannibalisation
 * des forfaits, la gêne des abonnements, le départ des clients d'Aix, l'hiver
 * de Megève, la réponse de la banque (plus favorable avec une étude) et cinq
 * imprévus ; il est tiré d'avance : une même graine donne les mêmes tirages,
 * quelles que soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe pour un projet hôtelier, flux avant impôt. */
export const TAUX = 0.09;
/** L'horizon de la valeur : la durée de vie des équipements du spa, et du dossier. */
export const HORIZON = 12;
/** La valeur que le conseil de famille attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 150000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la note du conseil se boucle avec un cabinet. */
export const PERTE_PAR_JOUR = 2500;

/* ---------------------------------------------------------------------------
 * L'HÔTEL, SANS PROJET.
 * ------------------------------------------------------------------------- */

export const HOTEL = {
  chambres: 66,
  /** Les nuitées vendues sur les douze derniers mois. */
  nuitees: 15860,
  prixMoyen: 182,
  /** La part des nuitées vendues par Bookalia et Voyagio, et leur commission moyenne. */
  partPlateformes: 0.38,
  commission: 0.17,
  /** La marge d'une nuitée de plus en basse saison : chambre et dîner, coûts variables et commissions déduits. */
  margeNuitee: 105,
  /** Les « week-ends au bord du lac » que l'hôtel vend déjà à ses habitués, en nuitées par an. */
  weekEndsHabitues: 700,
} as const;

export const TAUX_OCCUPATION = HOTEL.nuitees / (HOTEL.chambres * 365);
/** Ce qu'un euro de prix moyen en plus rapporte par an, commissions des plateformes déduites. */
export const NET_PAR_EURO = HOTEL.nuitees * (1 - HOTEL.partPlateformes * HOTEL.commission);

/* ---------------------------------------------------------------------------
 * LES TROIS PROJETS.
 * ------------------------------------------------------------------------- */

export interface Projet {
  id: "spa" | "grand" | "renovation";
  nom: string;
  investissement: number;
  /** L'avant-projet ou les études, engagés ce trimestre dès que le projet est instruit. */
  etudes: number;
  /** Le compte d'exploitation propre d'une année pleine : chiffre d'affaires et charges. */
  ca: number;
  charges: number;
  postes: { personnel: number; produits: number; energie: number; linge: number };
  renouvellement: number;
  anneeRenouvellement: number;
  residuelle: number;
  /** Le projet porte-t-il l'effet incertain d'un spa sur le prix moyen ? */
  spa: boolean;
  /** Le supplément de prix moyen qu'il apporte en plus de l'effet du spa (la rénovation : tout le sien). */
  supplementPM: number;
  /** Les nuitées de forfaits bien-être vendues par an, habitués compris. */
  forfaits: number;
  /** Les nuitées de plus par an, hors forfaits. */
  nuiteesEnPlus: number;
  /** Les séminaires résidentiels nouveaux par an, sans rien faire, et avec un commercial dédié. */
  seminaires: { naturels: number; commercial: number };
}

/** Le spa du dossier : bassin intérieur, sauna, hammam, quatre cabines, salle de fitness. */
export const SPA: Projet = {
  id: "spa",
  nom: "le spa",
  investissement: 1400000,
  etudes: 40000,
  ca: 340000,
  charges: 370000,
  postes: { personnel: 230000, produits: 35000, energie: 60000, linge: 45000 },
  renouvellement: 120000,
  anneeRenouvellement: 6,
  residuelle: 250000,
  spa: true,
  supplementPM: 0,
  forfaits: 1400,
  nuiteesEnPlus: 0,
  seminaires: { naturels: 8, commercial: 9 },
};

/** Le spa de la directrice : le même, avec un bassin extérieur chauffé et deux cabines de plus. */
export const GRAND: Projet = {
  id: "grand",
  nom: "le grand spa",
  investissement: 1900000,
  etudes: 55000,
  ca: 430000,
  charges: 495000,
  postes: { personnel: 290000, produits: 45000, energie: 115000, linge: 45000 },
  renouvellement: 170000,
  anneeRenouvellement: 6,
  residuelle: 330000,
  spa: true,
  supplementPM: 2.5,
  forfaits: 1800,
  nuiteesEnPlus: 0,
  seminaires: { naturels: 8, commercial: 9 },
};

/** La rénovation des 66 chambres : salles de bains, sols, literie, insonorisation. */
export const RENOVATION: Projet = {
  id: "renovation",
  nom: "la rénovation des chambres",
  investissement: 950000,
  etudes: 15000,
  ca: 0,
  charges: 0,
  postes: { personnel: 0, produits: 0, energie: 0, linge: 0 },
  renouvellement: 140000,
  anneeRenouvellement: 6,
  residuelle: 0,
  spa: false,
  supplementPM: 8,
  forfaits: 0,
  nuiteesEnPlus: 361,
  seminaires: { naturels: 0, commercial: 4 },
};

/**
 * L'EFFET DU SPA SUR LE PRIX MOYEN : trois scénarios, tirés d'avance. Le
 * cabinet les tire de ce qu'ont connu les spas ouverts au bord des lacs alpins.
 */
export const EFFET_PRIX = {
  faible: { valeur: 5, chance: 0.3 },
  moyen: { valeur: 10, chance: 0.45 },
  fort: { valeur: 14, chance: 0.25 },
} as const;
export type Scenario = keyof typeof EFFET_PRIX;
export const EFFET_ATTENDU =
  EFFET_PRIX.faible.valeur * EFFET_PRIX.faible.chance +
  EFFET_PRIX.moyen.valeur * EFFET_PRIX.moyen.chance +
  EFFET_PRIX.fort.valeur * EFFET_PRIX.fort.chance;

/** La part des forfaits vendus à des clients qui seraient venus quand même, au dossier. */
export const CANNIBALISATION_DOSSIER = 0.5;

/** L'étude du cabinet, et l'analyse du revenue management : prix, semaine du résultat, précision. */
export const ETUDE = { prix: 30000, semaine: 7 } as const;
export const REVENUE = { semaine: 6, ecart: 3.5 } as const;
/** La semaine où l'Observatoire du tourisme publie l'effet mesuré, et celle des pré-ventes. */
export const OBSERVATOIRE = 12;
export const PRE_VENTES = 8;

/** Escale Événements : la marge d'un séminaire résidentiel, à Évian et à Aix-les-Bains. */
export const SEMINAIRES = {
  margeEvian: 4600,
  margeAix: 3800,
  /** Le chiffre d'affaires d'un séminaire résidentiel, tel que la directrice le compte. */
  caEvian: 14000,
  transferes: 20,
  /** La part des clients d'Aix qui refusent le transfert, au dossier. */
  refusDossier: 0.3,
  /** Le commercial dédié : un mi-temps, charges comprises, et ses frais de recrutement. */
  commercial: 26000,
  recrutement: 6000,
} as const;

/** Les clients extérieurs au spa. */
export const EXTERIEURS = {
  abonnements: {
    nombre: 250,
    prix: 360,
    charges: 30000,
    /** La part de l'effet prix perdue, au dossier : un spa bondé le week-end ne justifie plus le prix. */
    geneDossier: 0.45,
    /** Les forfaits bien-être vendus en moins. */
    pertesForfaits: 0.3,
  },
  semaine: { ca: 18000, charges: 8000, gene: 0.02 },
  /** La semaine où l'enquête auprès des clients mesure la gêne des abonnements. */
  semaineEnquete: 10,
} as const;

/** Les imprévus chiffrés. */
export const INDICE_CONSTRUCTION = 0.03;
export const HAUSSE_ENERGIE = 0.15;
export const SUBVENTION = 50000;
/** Ce que la baisse de classement sur les plateformes ajoute à l'effet de la rénovation, en € de prix moyen. */
export const AVIS = 0.4;
export const NEIGE = 250000;

/** Le financement. */
export const PRET = {
  quotite: 0.8,
  taux: 0.042,
  duree: 12,
  frais: 0.007,
  /** Si la Banque des Aravis refuse : une autre banque, plus chère, et un dossier à refaire. */
  majoration: 0.006,
  reprise: 5000,
} as const;
/** Les chances que la banque accorde le prêt, selon le dossier. */
export const ACCORD = { etude: 0.9, revenue: 0.8, aucune: 0.6, renovation: 0.95 } as const;
export const CREDIT_BAIL = { taux: 0.052, duree: 12 } as const;
export const TRESORERIE = {
  /** Le point bas de la trésorerie du groupe en mars, sans projet. */
  pointBas: 1500000,
  seuil: 600000,
  /** La part des travaux payée avant le point bas de mars. */
  avantMars: 0.7,
  /** Un hiver sur trois, Megève démarre mal. */
  hiver: 300000,
  chanceHiver: 0.35,
  /** Une tension : la ligne de crédit de crise et ses commissions, les escomptes perdus. */
  coutFixe: 15000,
  tauxCrise: 0.12,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  projet: 0,
  etude: 1,
  seminaires: 2,
  exterieurs: 3,
  conseil: 4,
  financement: 5,
} as const;

/** Les options, par leur place dans chaque décision. */
export const O = {
  projet: { renovation: 0, spa: 1, grand: 2, rien: 3 },
  etude: { cabinet: 0, revenue: 1, aucune: 2 },
  seminaires: { transfert: 0, commercial: 1, rien: 2 },
  exterieurs: { abonnements: 0, semaine: 1, reserve: 2 },
  conseil: { maintenir: 0, chiffres: 1, reporter: 2 },
  financement: { emprunt: 0, creditBail: 1, comptant: 2 },
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 11, 12] as const;

/** Ne rien changer : rien instruit, pas d'étude, pas de plan, spa réservé à l'hôtel, payé comptant. */
export const NEUTRE = [3, 2, 2, 2, 0, 2] as const;

/* ---------------------------------------------------------------------------
 * LES CALCULS DU DOSSIER.
 * ------------------------------------------------------------------------- */

/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
export const actualise = (montant: number, annee: number, taux = TAUX) =>
  montant / (1 + taux) ** annee;
/** L'annuité constante d'un emprunt ou d'un crédit-bail. */
export const paiement = (montant: number, taux: number, duree: number) =>
  (montant * taux) / (1 - (1 + taux) ** -duree);

export const A = annuite(HORIZON, TAUX);

/** L'EBE propre d'un projet, sur une année pleine. */
export const ebePropre = (p: Projet) => p.ca - p.charges;

/** La VAN du spa sur son seul compte d'exploitation : le calcul du réflexe. */
export const vanPropre = (p: Projet) =>
  -p.investissement +
  ebePropre(p) * A -
  actualise(p.renouvellement, p.anneeRenouvellement) +
  actualise(p.residuelle, HORIZON);

/**
 * LE SEUIL : le supplément de prix moyen qui, à lui seul, rendrait nulle la
 * VAN du spa. Ce que la semaine 1 demande.
 */
export const SEUIL_PRIX_MOYEN = -vanPropre(SPA) / (A * NET_PAR_EURO);

export interface Hypotheses {
  /** L'effet du spa sur le prix moyen, en euros. */
  u: number;
  /** La part des forfaits vendus à des clients qui seraient venus quand même. */
  c: number;
  /** La part de l'effet prix que des abonnements feraient perdre. */
  kappa: number;
  /** La part des clients d'Aix qui refusent le transfert de leur séminaire. */
  lambda: number;
  indice: boolean;
  energie: boolean;
  subvention: boolean;
  avis: boolean;
}

/** Les hypothèses du dossier, avant que le trimestre ne révèle quoi que ce soit. */
export const HYPOTHESES_DU_DOSSIER: Hypotheses = {
  u: EFFET_ATTENDU,
  c: CANNIBALISATION_DOSSIER,
  kappa: EXTERIEURS.abonnements.geneDossier,
  lambda: SEMINAIRES.refusDossier,
  indice: false,
  energie: false,
  subvention: false,
  avis: false,
};

export interface Plans {
  seminaires: number;
  exterieurs: number;
}
export const PLANS_NEUTRES: Plans = {
  seminaires: O.seminaires.rien,
  exterieurs: O.exterieurs.reserve,
};

/** Ce qu'un plan séminaires rapporte au GROUPE chaque année, au-delà des séminaires que le projet attire seul. */
export function planSeminaires(p: Projet, plan: number, lambda: number): number {
  const s = SEMINAIRES;
  if (plan === O.seminaires.transfert) {
    return s.transferes * (s.margeEvian - s.margeAix) - lambda * s.transferes * s.margeAix;
  }
  if (plan === O.seminaires.commercial)
    return p.seminaires.commercial * s.margeEvian - s.commercial;
  return 0;
}

/** Ce que les clients extérieurs ajoutent au compte du spa chaque année. */
export function recettesExterieures(plan: number): number {
  if (plan === O.exterieurs.abonnements) {
    const a = EXTERIEURS.abonnements;
    return a.nombre * a.prix - a.charges;
  }
  if (plan === O.exterieurs.semaine) return EXTERIEURS.semaine.ca - EXTERIEURS.semaine.charges;
  return 0;
}

export interface Flux {
  /** Le supplément de prix moyen, en euros par nuitée. */
  effetPrix: number;
  prix: number;
  /** Les nuitées de plus : forfaits nets des habitués, et occupation. */
  nuitees: number;
  seminaires: number;
  /** Le compte propre du spa, clients extérieurs et énergie compris. */
  exploitation: number;
  total: number;
}

/** LES FLUX DIFFÉRENTIELS D'UNE ANNÉE PLEINE : ce que l'hôtel gagne de plus avec le projet que sans lui. */
export function fluxAnnuel(p: Projet, plans: Plans, h: Hypotheses): Flux {
  const abonnements = p.spa && plans.exterieurs === O.exterieurs.abonnements;
  const gene = !p.spa
    ? 0
    : abonnements
      ? h.kappa
      : plans.exterieurs === O.exterieurs.semaine
        ? EXTERIEURS.semaine.gene
        : 0;
  const effetPrix = (p.spa ? h.u * (1 - gene) : 0) + p.supplementPM + (!p.spa && h.avis ? AVIS : 0);
  const prix = effetPrix * NET_PAR_EURO;
  const forfaits =
    (1 - h.c) *
    p.forfaits *
    (abonnements ? 1 - EXTERIEURS.abonnements.pertesForfaits : 1) *
    HOTEL.margeNuitee;
  const nuitees = forfaits + p.nuiteesEnPlus * HOTEL.margeNuitee;
  const seminaires =
    p.seminaires.naturels * SEMINAIRES.margeEvian + planSeminaires(p, plans.seminaires, h.lambda);
  const exploitation =
    ebePropre(p) -
    (h.energie ? HAUSSE_ENERGIE * p.postes.energie : 0) +
    (p.spa ? recettesExterieures(plans.exterieurs) : 0);
  return {
    effetPrix,
    prix,
    nuitees,
    seminaires,
    exploitation,
    total: prix + nuitees + seminaires + exploitation,
  };
}

/** L'investissement, révision de prix comprise. */
export const investissement = (p: Projet, h: Pick<Hypotheses, "indice">) =>
  p.investissement * (1 + (h.indice ? INDICE_CONSTRUCTION : 0));

/** LA VAN DES FLUX DIFFÉRENTIELS d'un projet, sur douze ans, au taux du groupe. */
export function vanProjet(p: Projet, plans: Plans, h: Hypotheses): number {
  return (
    -investissement(p, h) +
    fluxAnnuel(p, plans, h).total * A -
    actualise(p.renouvellement, p.anneeRenouvellement) +
    actualise(p.residuelle, HORIZON) +
    (p.spa && h.subvention ? SUBVENTION : 0)
  );
}

/** L'effet prix à partir duquel le spa vaut la rénovation, les autres hypothèses tenues. */
export function effetPivot(p: Projet, plans: Plans, h: Hypotheses): number {
  const a = vanProjet(p, plans, { ...h, u: 0 });
  const b = vanProjet(p, plans, { ...h, u: 1 });
  return (vanProjet(RENOVATION, plans, h) - a) / (b - a);
}

/* ---------------------------------------------------------------------------
 * LE FINANCEMENT : ce qu'il coûte de plus que le marché, et la trésorerie.
 * ------------------------------------------------------------------------- */

/** Ce que le refus de la Banque des Aravis coûte : une autre banque plus chère, un dossier à refaire. */
export function coutDuRefus(montant: number): number {
  const emprunt = PRET.quotite * montant;
  const ecart =
    paiement(emprunt, PRET.taux + PRET.majoration, PRET.duree) -
    paiement(emprunt, PRET.taux, PRET.duree);
  return ecart * annuite(PRET.duree, PRET.taux) + PRET.reprise;
}

/** Ce que le crédit-bail coûte de plus que l'emprunt : ses loyers actualisés au taux de l'emprunt, moins le prix. */
export function surcoutCreditBail(montant: number): number {
  return (
    paiement(montant, CREDIT_BAIL.taux, CREDIT_BAIL.duree) * annuite(PRET.duree, PRET.taux) -
    montant
  );
}

/** Ce qui sort de la trésorerie du groupe avant le point bas de mars. */
export function decaissement(option: number, montant: number): number {
  if (option === O.financement.emprunt) return TRESORERIE.avantMars * (1 - PRET.quotite) * montant;
  if (option === O.financement.comptant) return TRESORERIE.avantMars * montant;
  return 0;
}

/** Le coût d'une tension de trésorerie, selon le point bas atteint. */
export const tension = (pointBas: number) =>
  pointBas < TRESORERIE.seuil
    ? TRESORERIE.coutFixe + TRESORERIE.tauxCrise * (TRESORERIE.seuil - pointBas)
    : 0;

/**
 * LA VALEUR D'UN FINANCEMENT : ce qu'il coûte de plus qu'un emprunt au prix
 * du marché, et la tension de trésorerie qu'il peut provoquer. `accord` et
 * `hiver` sont des probabilités tant qu'on ne sait pas, 0 ou 1 ensuite.
 */
export function valeurFinancement(
  option: number,
  montant: number,
  o: { accord: number; hiver: number; neige: boolean; reporte?: boolean },
): { financement: number; tension: number } {
  let financement = 0;
  if (option === O.financement.emprunt) {
    financement = -PRET.frais * PRET.quotite * montant - (1 - o.accord) * coutDuRefus(montant);
  } else if (option === O.financement.creditBail) {
    financement = -surcoutCreditBail(montant);
  }
  // Un vote reporté décale les travaux d'un an : rien ne sort avant ce point bas de mars.
  const bas =
    TRESORERIE.pointBas - (o.reporte ? 0 : decaissement(option, montant)) - (o.neige ? NEIGE : 0);
  const t = o.hiver * tension(bas - TRESORERIE.hiver) + (1 - o.hiver) * tension(bas);
  return { financement, tension: -t };
}

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: "indice" | "energie" | "subvention" | "avis" | "neige";
  titre: string;
  de: string;
  role: string;
  texte: string;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "indice",
    titre: "Les entreprises révisent leurs prix",
    de: "Jovan Lazarević",
    role: "Architecte, maître d'œuvre",
    texte:
      "L'indice du coût de la construction a pris 3 % depuis les premiers chiffrages. Les entreprises révisent leurs offres d'autant, pour le spa comme pour la rénovation des chambres.",
  },
  {
    id: "energie",
    titre: "Le gaz augmente au 1er janvier",
    de: "Ivanka Anthonioz",
    role: "Responsable des achats du groupe",
    texte:
      "Notre fournisseur de gaz annonce 15 % de hausse au 1er janvier, contrat de trois ans. Pour un bassin chauffé, c'est la première ligne de charges après le personnel.",
  },
  {
    id: "subvention",
    titre: "La Région aide l'hôtellerie « quatre saisons »",
    de: "Ivanka Anthonioz",
    role: "Responsable des achats du groupe",
    texte:
      "La Région ouvre un fonds pour les équipements qui allongent la saison touristique : 50 000 € pour un spa d'hôtel, dossier à déposer avant fin décembre. La rénovation de chambres n'y est pas éligible.",
  },
  {
    id: "avis",
    titre: "L'hôtel recule sur Bookalia",
    de: "Lucile Fabbri",
    role: "Responsable revenue management et distribution",
    texte:
      "Bookalia a fait reculer L'Escale Évian dans ses classements : les avis de l'été parlent de salles de bains « datées ». Une rénovation nous ferait regagner davantage que prévu.",
  },
  {
    id: "neige",
    titre: "Megève réserve mal pour l'hiver",
    de: "Maylis Quétand",
    role: "Trésorière du groupe",
    texte:
      "Les réservations d'hiver de L'Escale Megève ont 20 % de retard sur l'an dernier : les arrhes de décembre rentreront mal. Le point bas de trésorerie du groupe, en mars, perd 250 000 €, quoi qu'on décide à Évian.",
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: Scenario;
  /** L'effet réel du spa sur le prix moyen, en euros. */
  u: number;
  /** Ce que le revenue management en estimera, à 3 ou 4 € près. */
  uRevenue: number;
  c: number;
  kappa: number;
  lambda: number;
  /** Megève démarre-t-il mal ? */
  hiver: boolean;
  /** La banque accorde le prêt si ce tirage est sous ses chances. */
  uBanque: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000619 + 7);
  // L'ordre des tirages est fixé une fois pour toutes : le changer change tous les trimestres.
  const hiver = r() < TRESORERIE.chanceHiver;
  const uBanque = r();
  const c = Math.round(borne(0.55 + 0.07 * gauss(r), 0.4, 0.7) * 100) / 100;
  const combien = r() < 0.5 ? 1 : 2;
  const us = r();
  const scenario: Scenario =
    us < EFFET_PRIX.faible.chance
      ? "faible"
      : us < EFFET_PRIX.faible.chance + EFFET_PRIX.moyen.chance
        ? "moyen"
        : "fort";
  const u = EFFET_PRIX[scenario].valeur;
  const uRevenue = Math.round(borne(u + REVENUE.ecart * gauss(r), 1, 20) * 2) / 2;
  const kappa = Math.round(borne(0.45 + 0.08 * gauss(r), 0.3, 0.6) * 100) / 100;
  const lambda = Math.round(borne(0.3 + 0.1 * gauss(r), 0.1, 0.5) * 20) / 20;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = { scenario, u, uRevenue, c, kappa, lambda, hiver, uBanque, imprevus };
  tirages.set(graine, h);
  return h;
}

const imprevu = (h: Hasard, id: Imprevu["id"]) => h.imprevus.find((i) => i.imprevu.id === id);
const tombe = (h: Hasard, id: Imprevu["id"], w: number) => {
  const i = imprevu(h, id);
  return i !== undefined && i.semaine <= w;
};

/* ---------------------------------------------------------------------------
 * CE QUE L'ON SAIT EN FIN DE SEMAINE, ET LE PROJET QUE LE CONSEIL ADOPTE.
 * ------------------------------------------------------------------------- */

/** Le projet que la décision de la semaine 1 fait instruire. */
export const projetInstruit = (chemin: readonly number[]): Projet | null =>
  [RENOVATION, SPA, GRAND, null][chemin[D.projet]!] ?? null;

/** Le choix en vigueur en fin de semaine w : la décision prise, ou ne rien changer. */
const enVigueur = (chemin: readonly number[], k: number, w: number) =>
  w >= EFFET[k]! ? chemin[k]! : NEUTRE[k]!;

export type SourceDeLEffet = "dossier" | "revenue" | "etude" | "observatoire";

/** L'effet prix que l'on retient en fin de semaine w, et d'où on le tient. */
export function effetConnu(
  chemin: readonly number[],
  graine: number,
  w: number,
): { u: number; source: SourceDeLEffet } {
  const h = hasard(graine);
  const etude = enVigueur(chemin, D.etude, w);
  const instruit = projetInstruit(chemin) !== null && w >= EFFET[D.projet];
  if (w >= OBSERVATOIRE) return { u: h.u, source: "observatoire" };
  if (instruit && etude === O.etude.cabinet && w >= ETUDE.semaine)
    return { u: h.u, source: "etude" };
  if (instruit && etude === O.etude.revenue && w >= REVENUE.semaine) {
    return { u: h.uRevenue, source: "revenue" };
  }
  return { u: EFFET_ATTENDU, source: "dossier" };
}

/** Les hypothèses en fin de semaine w : ce que le trimestre a révélé, le dossier pour le reste. */
export function hypotheses(chemin: readonly number[], graine: number, w: number): Hypotheses {
  const h = hasard(graine);
  const transfert = enVigueur(chemin, D.seminaires, w) === O.seminaires.transfert;
  return {
    u: effetConnu(chemin, graine, w).u,
    c: w >= PRE_VENTES ? h.c : CANNIBALISATION_DOSSIER,
    kappa: w >= EXTERIEURS.semaineEnquete ? h.kappa : EXTERIEURS.abonnements.geneDossier,
    lambda: transfert ? h.lambda : SEMINAIRES.refusDossier,
    indice: tombe(h, "indice", w),
    energie: tombe(h, "energie", w),
    subvention: tombe(h, "subvention", w),
    avis: tombe(h, "avis", w),
  };
}

const plansEnVigueur = (chemin: readonly number[], w: number): Plans => ({
  seminaires: enVigueur(chemin, D.seminaires, w),
  exterieurs: enVigueur(chemin, D.exterieurs, w),
});

/**
 * LE PROJET QUE LE CONSEIL DE FAMILLE ADOPTE en semaine 11. Présenter « ce
 * que les chiffres désignent », c'est comparer, avec ce que l'on sait en
 * semaine 8, la VAN du spa instruit à celle de la rénovation.
 */
export function projetAdopte(
  chemin: readonly number[],
  graine: number,
  w: number = SEMAINES,
): Projet | null {
  const p = projetInstruit(chemin);
  if (!p || !p.spa) return p;
  const conseil = chemin[D.conseil];
  if (conseil === O.conseil.maintenir) return p;
  // Reporté, le conseil votera en mars sur ce que l'on saura alors ; d'ici là, sur ce que l'on sait.
  const quand = conseil === O.conseil.chiffres ? PRE_VENTES : w;
  const h = hypotheses(chemin, graine, quand);
  const plans = plansEnVigueur(chemin, quand);
  return vanProjet(p, plans, h) >= vanProjet(RENOVATION, plans, h) ? p : RENOVATION;
}

/** Le vote est-il reporté à mars ? Le projet perd alors une saison : tout glisse d'un an. */
export const voteReporte = (chemin: readonly number[]) =>
  projetInstruit(chemin)?.spa === true && chemin[D.conseil] === O.conseil.reporter;

/** Les chances que la banque accorde le prêt, selon le projet et le dossier. */
export function chanceDAccord(chemin: readonly number[], p: Projet | null): number {
  if (!p) return 1;
  if (!p.spa) return ACCORD.renovation;
  const e = chemin[D.etude];
  return e === O.etude.cabinet
    ? ACCORD.etude
    : e === O.etude.revenue
      ? ACCORD.revenue
      : ACCORD.aucune;
}

/** La banque accorde-t-elle le prêt ? Elle ne répond qu'à qui le demande. */
export function pretAccorde(chemin: readonly number[], graine: number): boolean | null {
  if (chemin[D.financement] !== O.financement.emprunt) return null;
  const p = projetAdopte(chemin, graine);
  if (!p) return null;
  return hasard(graine).uBanque < chanceDAccord(chemin, p);
}

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** La VAN des flux différentiels du projet sur la table. */
  van: number;
  /** Le flux différentiel d'une année pleine. */
  differentiel: number;
  /** Le prix moyen visé avec le projet sur la table. */
  prixVise: number;
  /** L'effet du spa sur le prix moyen, tel qu'on l'estime. */
  effet: number;
  /** Le point bas de la trésorerie du groupe en mars, prévu. */
  tresorerie: number;
  /** Les sommes engagées ce trimestre. */
  engage: number;
  financement: number;
};

export interface Estimation extends Semaine {
  projet: Projet | null;
  tension: number;
}

function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const instruit = w >= EFFET[D.projet] ? projetInstruit(chemin) : null;
  const projet = w >= EFFET[D.conseil] ? projetAdopte(chemin, graine, w) : instruit;
  const reporte = w >= EFFET[D.conseil] && voteReporte(chemin);
  const hyp = hypotheses(chemin, graine, w);
  const plans = plansEnVigueur(chemin, w);

  let engage = 0;
  if (instruit) {
    engage += instruit.etudes;
    if (w >= EFFET[D.etude] && chemin[D.etude] === O.etude.cabinet) engage += ETUDE.prix;
    if (w >= EFFET[D.seminaires] && chemin[D.seminaires] === O.seminaires.commercial) {
      engage += SEMINAIRES.recrutement;
    }
    if (projet && projet !== instruit) engage += projet.etudes;
  }

  let van = 0;
  let differentiel = 0;
  let effetPrix = 0;
  let financement = 0;
  let t = 0;
  let tresorerie = TRESORERIE.pointBas - (tombe(h, "neige", w) ? NEIGE : 0);
  const option = enVigueur(chemin, D.financement, w);
  if (projet) {
    const f = fluxAnnuel(projet, plans, hyp);
    van = vanProjet(projet, plans, hyp) / (reporte ? 1 + TAUX : 1);
    differentiel = f.total;
    effetPrix = f.effetPrix;
    const montant = investissement(projet, hyp);
    const sait = w >= OBSERVATOIRE;
    const accord =
      option !== O.financement.emprunt
        ? 1
        : sait && w >= EFFET[D.financement]
          ? pretAccorde(chemin, graine)
            ? 1
            : 0
          : chanceDAccord(chemin, projet);
    const v = valeurFinancement(option, montant, {
      accord,
      hiver: sait ? (h.hiver ? 1 : 0) : TRESORERIE.chanceHiver,
      neige: tombe(h, "neige", w),
      reporte,
    });
    financement = v.financement;
    t = v.tension;
    if (!reporte) tresorerie -= decaissement(option, montant);
  }
  if (w >= OBSERVATOIRE && h.hiver) tresorerie -= TRESORERIE.hiver;

  const valeur =
    -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR + van + financement + t - engage;
  return {
    valeur,
    variation: 0,
    van,
    differentiel,
    prixVise: HOTEL.prixMoyen + effetPrix,
    effet: hyp.u,
    tresorerie,
    engage,
    financement: financement + t,
    projet,
    tension: t,
  };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  instruit: Projet | null;
  adopte: Projet | null;
  scenario: Scenario;
  u: number;
  uRevenue: number;
  c: number;
  kappa: number;
  lambda: number;
  hiver: boolean;
  /** La VAN des flux différentiels du projet adopté, avec ce que le trimestre a révélé. */
  van: number;
  /** Le flux différentiel d'une année pleine du projet adopté. */
  differentiel: number;
  /** Ce que le financement a coûté de plus que le marché, tension de trésorerie comprise. */
  financement: number;
  tension: number;
  pret: boolean | null;
  engage: number;
  tresorerie: number;
  /** L'option de financement retenue, et le vote reporté à mars. */
  financementChoisi: number;
  reporte: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    const { projet: _p, tension: _t, ...s } = e;
    semaines.push({ ...s, variation: e.valeur - avant });
    avant = e.valeur;
    fin = e;
  }
  return {
    semaines,
    objectif: fin!.valeur,
    instruit: projetInstruit(chemin),
    adopte: fin!.projet,
    scenario: h.scenario,
    u: h.u,
    uRevenue: h.uRevenue,
    c: h.c,
    kappa: h.kappa,
    lambda: h.lambda,
    hiver: h.hiver,
    van: fin!.van,
    differentiel: fin!.differentiel,
    financement: fin!.financement,
    tension: fin!.tension,
    pret: pretAccorde(chemin, graine),
    engage: fin!.engage,
    tresorerie: fin!.tresorerie,
    financementChoisi: chemin[D.financement]!,
    reporte: voteReporte(chemin),
  };
}

/** Ce qui s'est passé pendant des semaines : études, pré-ventes, enquête, conseil, banque, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const p = projetInstruit(chemin);
  const spa = p !== null && p.spa;
  return {
    revenue: p !== null && chemin[D.etude] === O.etude.revenue && dans(REVENUE.semaine),
    etude: p !== null && chemin[D.etude] === O.etude.cabinet && dans(ETUDE.semaine),
    preVentes: spa && dans(PRE_VENTES),
    enquete:
      spa && chemin[D.exterieurs] === O.exterieurs.abonnements && dans(EXTERIEURS.semaineEnquete),
    conseil: p !== null && dans(EFFET[D.conseil]),
    banque: p !== null && chemin[D.financement] === O.financement.emprunt && dans(OBSERVATOIRE),
    tension: p !== null && dans(OBSERVATOIRE),
    observatoire: dans(OBSERVATOIRE),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureSpa {
  valeur: number | null;
  prixVise: number | null;
  differentiel: number | null;
  tresorerie: number | null;
  engage: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  effet: number | null;
  van: number | null;
  financement: number | null;
  /** 0 : aucun projet ; 1 : le spa ; 2 : le grand spa ; 3 : la rénovation. */
  projet: number | null;
  /** 0 : le dossier ; 1 : le revenue management ; 2 : l'étude ; 3 : l'Observatoire. */
  source: number | null;
  c: number | null;
  kappa: number | null;
  lambda: number | null;
  indice: number | null;
  energie: number | null;
  subvention: number | null;
  avis: number | null;
  neige: number | null;
}

const codeProjet = (p: Projet | null) =>
  p === null ? 0 : p.id === "spa" ? 1 : p.id === "grand" ? 2 : 3;
const codeSource: Record<SourceDeLEffet, number> = {
  dossier: 0,
  revenue: 1,
  etude: 2,
  observatoire: 3,
};

/**
 * Ce que Marceau lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureSpa {
  const h = hasard(graine);
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const w = Math.max(0, semaine);
  const hyp = hypotheses(chemin, graine, w);
  const caches = {
    effet: hyp.u,
    source: codeSource[effetConnu(chemin, graine, w).source],
    c: hyp.c,
    kappa: hyp.kappa,
    lambda: hyp.lambda,
    indice: hyp.indice ? 1 : 0,
    energie: hyp.energie ? 1 : 0,
    subvention: hyp.subvention ? 1 : 0,
    avis: hyp.avis ? 1 : 0,
    neige: tombe(h, "neige", w) ? 1 : 0,
  };
  if (semaine === 0) {
    return {
      valeur: 0,
      prixVise: HOTEL.prixMoyen,
      differentiel: 0,
      tresorerie: TRESORERIE.pointBas,
      engage: 0,
      van: 0,
      financement: 0,
      projet: 0,
      ...caches,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const projet =
    semaine >= EFFET[D.conseil] ? t.adopte : semaine >= EFFET[D.projet] ? t.instruit : null;
  return {
    valeur: s.valeur,
    prixVise: s.prixVise,
    differentiel: s.differentiel,
    tresorerie: s.tresorerie,
    engage: s.engage,
    van: s.van,
    financement: s.financement,
    projet: codeProjet(projet),
    ...caches,
  };
}
