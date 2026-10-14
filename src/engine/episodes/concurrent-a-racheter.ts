/**
 * LE CONCURRENT À RACHETER — le modèle du rachat de Mourgue Matériaux.
 *
 * Mourgue Matériaux, un négoce familial de quatre agences en Isère (Voiron,
 * Crolles, Vizille, La Mure), est à vendre : sa présidente, Bernadette
 * Mourgue, prend sa retraite. Arvel Distribution est sur les rangs ; Sérac
 * Matériaux, un groupe adossé à un fonds d'investissement qui achète des
 * négoces en Savoie et dans la Drôme, aussi. Idriss Zerrouki, directeur du
 * développement, conduit le dossier : treize semaines, six décisions, de
 * l'offre indicative au closing.
 *
 * LA VALEUR CRÉÉE, ESTIMÉE EN SEMAINE 13. Un rachat se juge sur des années ;
 * l'épisode dure un trimestre. Il est donc jugé sur la valeur créée pour
 * Arvel telle que le contrôle de gestion l'estime chaque semaine, par rapport
 * à la situation de départ :
 *
 *   · si Arvel achète : la valeur de la cible POUR ARVEL — sa valeur
 *     d'entreprise autonome (5,5 fois l'EBE retraité), moins ce que la cible
 *     cachait (stock surévalué, client qui part, passif social), plus les
 *     synergies de coûts au taux de réalisation constaté, plus les synergies
 *     de revenus si le directeur commercial reste, moins les coûts
 *     d'intégration et les frais de la transaction —, moins le prix payé, le
 *     complément de prix s'il est dû, le coût des garanties et de la
 *     fidélisation, et ce que les garanties ne rendent pas ;
 *   · si Sérac l'emporte : la valeur que perdent les agences d'Arvel de
 *     Grenoble-Sud et de Moirans face à un concurrent renforcé à leur porte ;
 *   · dans tous les cas : les frais d'audit engagés, et ce qu'a coûté une
 *     enquête trop longue en semaine 1.
 *
 * Avant d'être connu, chaque aléa (ce que cache la cible, le passif, la
 * réaction de la cédante, le départ du directeur commercial) compte pour son
 * espérance, aux probabilités que les sources donnent ; il compte pour ce
 * qu'il est dès que le trimestre le révèle. Tant que la vente n'est pas
 * signée, l'estimation suppose qu'elle se signe à l'offre en vigueur. Le
 * hasard porte sur ce que le trimestre révèle, jamais sur les règles du
 * calcul.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE PRIX MAXIMAL SE CALCULE AVANT DE NÉGOCIER. La valeur autonome se
 *     prend sur l'EBE retraité de ce qui ne se répétera pas (un chantier
 *     exceptionnel, une rémunération de dirigeante sous le marché, un litige
 *     clos), pas sur l'EBE publié. Les synergies de coûts sont sûres à 90 % ;
 *     celles de revenus, Arvel n'en a jamais tenu qu'un tiers, et elles
 *     partent avec le directeur commercial : on ne les paie pas au vendeur.
 *     Ce prix plafond, 7,7 M€, ne se dépasse pas parce qu'un concurrent
 *     surenchérit : laisser Mourgue à Sérac coûte 220 k€ à Arvel, pas des
 *     millions.
 *   · LA MALÉDICTION DU VAINQUEUR. Dans une enchère, celui qui gagne est
 *     celui qui a le plus surestimé la cible. Sérac fait son propre audit des
 *     stocks, et ne paie jamais plus de 5,9 fois l'EBE retraité : une offre
 *     au-dessus de ce qu'il peut suivre le fait se retirer, et Arvel paie
 *     alors son offre, pas celle de Sérac. Surenchérir pour ne pas laisser la
 *     cible au concurrent, c'est donner au vendeur les synergies qu'on a
 *     calculées.
 *   · L'AUDIT CHANGE LE PRIX, ET LE PRIX DOIT CHANGER AVEC LUI. Une cible
 *     sur quatre cache un client qui part, une sur trois un stock surévalué :
 *     la due diligence coûte, et ne vaut que si l'on révise ensuite l'offre
 *     annoncée de ce qu'elle a chiffré. Revenir sur ce que l'audit découvre
 *     est la règle du jeu ; revenir sur ce que les comptes montraient déjà
 *     (l'EBE publié) est un « retrade » que la cédante peut refuser. Ce qui
 *     reste incertain se couvre : une garantie d'actif et de passif adossée à
 *     un séquestre, un complément de prix versé seulement si l'EBE tient.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La valeur que le comité de direction attend du dossier. */
export const OBJECTIF_VALEUR = 150000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un cabinet boucle la lettre d'offre dans l'urgence. */
export const PERTE_PAR_JOUR = 5000;

/* ---------------------------------------------------------------------------
 * LA CIBLE, TELLE QUE SES COMPTES LA MONTRENT.
 * ------------------------------------------------------------------------- */

/** L'EBE du dernier exercice, tel que les comptes et la plaquette du banquier le présentent. */
export const EBE_PUBLIE = 1500000;
/** Ce qui ne se répétera pas, et ce qui manque aux comptes d'une entreprise familiale. */
export const RETRAITEMENTS = {
  /** La marge du chantier du collège de Vizille, livré en mars : non récurrente. */
  chantier: -150000,
  /** La présidente se payait 50 k€ ; un directeur général coûtera 130 k€ chargés. */
  remuneration: -80000,
  /** Les honoraires d'un litige clos avec un ancien fournisseur : charge non récurrente. */
  litige: 30000,
} as const;
export const EBE_RETRAITE =
  EBE_PUBLIE + RETRAITEMENTS.chantier + RETRAITEMENTS.remuneration + RETRAITEMENTS.litige;
/** La médiane des transactions comparables du négoce régional, en multiple d'EBE retraité. */
export const MULTIPLE = 5.5;
/** La valeur d'entreprise de Mourgue seule, synergies non comprises : la prévision de la semaine 1. */
export const VE_AUTONOME = MULTIPLE * EBE_RETRAITE;
/** Celle qu'on obtient en appliquant le multiple à l'EBE publié. */
export const VE_PUBLIEE = MULTIPLE * EBE_PUBLIE;
/** Emprunts moins trésorerie : le prix des titres, c'est la valeur d'entreprise moins cette dette. */
export const DETTE_NETTE = 1400000;
export const CHIFFRE_D_AFFAIRES = 21500000;

/* ---------------------------------------------------------------------------
 * CE QUE LE RACHAT RAPPORTERAIT À ARVEL.
 * ------------------------------------------------------------------------- */

/** Les synergies annuelles en régime de croisière, chiffrées par le contrôle de gestion. */
export const SYNERGIES = {
  /** Les conditions d'achat d'Arvel appliquées aux achats de Mourgue, et les tournées mutualisées. */
  achats: 150000,
  logistique: 50000,
  /** Les ventes croisées : l'outillage d'Arvel aux clients de Mourgue, et l'inverse. */
  revenus: 120000,
  /** Ce qu'Arvel a tenu, sur ses deux derniers rachats : 90 % des coûts, un tiers des revenus. */
  realisationCouts: 0.9,
  realisationRevenus: 1 / 3,
} as const;
export const SYNERGIES_COUTS = SYNERGIES.achats + SYNERGIES.logistique;
/** Les synergies se valorisent comme l'EBE : au multiple. */
export const VALEUR_SYNERGIES_COUTS = MULTIPLE * SYNERGIES_COUTS;
export const VALEUR_SYNERGIES_REVENUS = MULTIPLE * SYNERGIES.revenus;
/** Ce qu'on peut en attendre, aux taux de réalisation d'Arvel. */
export const SYNERGIES_COUTS_PROBABLES = VALEUR_SYNERGIES_COUTS * SYNERGIES.realisationCouts;
export const SYNERGIES_REVENUS_PROBABLES = VALEUR_SYNERGIES_REVENUS * SYNERGIES.realisationRevenus;
/** Systèmes, enseigne, formation : une fois pour toutes. */
export const INTEGRATION = 380000;
/** Avocats, banque conseil, droits : payés au closing. */
export const FRAIS_TRANSACTION = 60000;

/**
 * LE PRIX PLAFOND : la valeur autonome, plus les synergies de coûts au taux
 * où Arvel les tient, moins ce que le rachat coûte. Les synergies de revenus
 * n'y entrent pas : c'est la marge de sécurité, pas un cadeau au vendeur.
 */
export const PLAFOND = VE_AUTONOME + SYNERGIES_COUTS_PROBABLES - INTEGRATION - FRAIS_TRANSACTION;

/** Ce que perdent les agences de Grenoble-Sud et de Moirans si Sérac s'installe à leur porte. */
export const PERTE_SERAC = 220000;

/* ---------------------------------------------------------------------------
 * CE QUE LA CIBLE PEUT CACHER : le scénario du trimestre.
 * ------------------------------------------------------------------------- */

export type Etat = "saine" | "stock" | "client";
/** Sur les négoces familiaux qu'audite le cabinet : quatre sur dix sains, un sur trois, un sur quatre. */
export const ETATS: Readonly<Record<Etat, number>> = { saine: 0.4, stock: 0.35, client: 0.25 };
/** Le stock affiché : 3,8 M€, dont 550 k€ de références dormantes qui ne se vendront pas. */
export const STOCK_AFFICHE = 3800000;
export const STOCK_SURVALUE = 550000;
/** Bâtisseurs du Grésivaudan : 18 % du chiffre d'affaires ; s'il part, 200 k€ d'EBE en moins par an. */
export const CLIENT = { part: 0.18, ebe: 200000 } as const;
export const PERTE_CLIENT = MULTIPLE * CLIENT.ebe;
/** Le contrôle URSSAF en cours : quatre fois sur dix, un redressement de 400 k€. */
export const PASSIF = { chance: 0.4, montant: 400000 } as const;

/* ---------------------------------------------------------------------------
 * LES OFFRES ET LES ENCHÈRES.
 * ------------------------------------------------------------------------- */

/** Les offres indicatives de la semaine 1, et le plafond que chacune suppose. */
export const OFFRES = [7200000, VE_PUBLIEE, 7900000, 0] as const;
export const PLAFONDS = [
  PLAFOND,
  VE_PUBLIEE + SYNERGIES_COUTS_PROBABLES - INTEGRATION - FRAIS_TRANSACTION,
  VE_AUTONOME + VALEUR_SYNERGIES_COUTS + VALEUR_SYNERGIES_REVENUS - INTEGRATION - FRAIS_TRANSACTION,
  0,
] as const;
/** L'exclusivité que propose la cédante : quatre semaines, sans audit approfondi, à ce prix-là. */
export const EXCLUSIVITE = 7800000;
/** Les deux audits : complet (comptes, stocks, clients, social), ou ciblé (comptes et stocks). */
export const DILIGENCE = { complete: 85000, ciblee: 40000 } as const;
/**
 * Revenir sur un chiffre que les comptes montraient déjà s'appelle un
 * retrade : la cédante rompt avec cette probabilité. Baisser sans
 * justification, aussi.
 */
export const RETRADE = { publie: 0.5, forfait: 0.4 } as const;
/** La baisse forfaitaire « pour se garder une marge ». */
export const BAISSE_FORFAITAIRE = 0.1;
/**
 * Sérac ne paie qu'entre 5,3 et 5,9 fois l'EBE retraité, et fait son propre
 * inventaire des stocks. Il ne surenchérit que s'il peut mettre 100 k€ de
 * plus que l'offre ferme d'Arvel ; son offre indicative garde 400 k€ de marge.
 */
export const SERAC = { multipleMin: 5.3, multipleMax: 5.9, ecart: 100000, marge: 400000 } as const;
/** Ce que la surenchère réflexe met au-dessus de Sérac, ou le geste que demande la cédante. */
export const SURENCHERE = 250000;
/** Le pas d'enchère du dernier tour. */
export const PAS = 50000;
/** La cédante compte un complément de prix pour 80 % de son montant ; Arvel en offre au plus 800 k€. */
export const COMPLEMENT = { decote: 0.8, max: 800000 } as const;

/* ---------------------------------------------------------------------------
 * LES GARANTIES ET LE DIRECTEUR COMMERCIAL.
 * ------------------------------------------------------------------------- */

export const GARANTIE = {
  /** Celle que propose la cédante : 5 % du prix, franchise de 50 k€, un an, sans séquestre. */
  cedante: { plafond: 0.05, franchise: 50000, recouvrement: 0.5 },
  /** Celle d'Arvel : 15 % du prix sur trois ans, franchise de 20 k€, 10 % du prix sous séquestre. */
  arvel: {
    plafond: 0.15,
    franchise: 20000,
    sequestre: 0.1,
    chance: 0.7,
    prix: 30000,
    prixRefus: 100000,
  },
  /** Renoncer à toute garantie contre une baisse de prix. */
  renonciation: 50000,
} as const;

export const DIRECTEUR = {
  /** La probabilité qu'Anthelme Rostaing parte, selon la quatrième option de la semaine 11. */
  depart: [0.45, 0.1, 0.45, 0.45],
  /** Ses clients : 60 k€ d'EBE par an le suivraient ; un tiers seulement sous non-concurrence. */
  clients: MULTIPLE * 60000,
  clientsNonConcurrence: (MULTIPLE * 60000) / 3,
  /** La prime de fidélisation, versée à 12 et 24 mois s'il est toujours là. */
  prime: 100000,
  nonConcurrence: 50000,
  /** La baisse de prix demandée à la cédante au titre du risque, acceptée une fois sur deux. */
  baisse: 150000,
  chanceBaisse: 0.5,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  offre: 0,
  diligence: 1,
  offreFerme: 2,
  enchere: 3,
  garantie: 4,
  directeur: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 6, 8, 10, 12] as const;
/** Les semaines où le trimestre révèle : l'audit, la réaction de Sérac, les achats, le closing. */
export const ANNONCES = {
  audit: 5,
  rupture: 6,
  serac: 7,
  protocole: 8,
  achats: 11,
  closing: 12,
  directeur: 13,
} as const;

/** Ne rien changer : pas d'offre, la data room seule, l'offre confirmée, pas de surenchère, la garantie de la cédante, signer. */
export const NEUTRE = [3, 3, 0, 1, 0, 0] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce qu'il change à la valeur de Mourgue pour Arvel, si Arvel l'achète. */
  siRachat: number;
  /** Ce qu'il change à la valeur d'Arvel, quoi qu'il arrive. */
  toujours: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "taux",
    titre: "Le taux de l'emprunt d'acquisition monte",
    de: "Rozenn Cadiou",
    role: "Directrice administrative et financière",
    texte:
      "La banque relève de 0,5 point le taux de l'emprunt qui financerait le rachat : 40 k€ de frais financiers en plus sur sa durée.",
    siRachat: -40000,
    toujours: 0,
  },
  {
    id: "permis",
    titre: "Les mises en chantier ralentissent en Isère",
    de: "Mounia Kherbache",
    role: "Contrôleuse de gestion, fusions et acquisitions",
    texte:
      "Les permis de construire reculent de 8 % dans le Grésivaudan et le Voironnais. Je baisse de 2 % l'EBE attendu de Mourgue : 143 k€ de valeur en moins si nous l'achetons.",
    siRachat: -143000,
    toujours: 0,
  },
  {
    id: "fabricant",
    titre: "Un fabricant renouvelle l'exclusivité de Mourgue",
    de: "Vianney Charrel",
    role: "Directeur régional Isère, Arvel Distribution",
    texte:
      "Menuiseries Alpinor renouvelle pour cinq ans la distribution exclusive de ses fenêtres en Isère à Mourgue. Pour un acquéreur, c'est 70 k€ de valeur en plus.",
    siRachat: 70000,
    toujours: 0,
  },
  {
    id: "acier",
    titre: "L'acier renchérit",
    de: "Mounia Kherbache",
    role: "Contrôleuse de gestion, fusions et acquisitions",
    texte:
      "Les aciers de construction prennent 6 % en un mois : le stock de fers à béton de Mourgue vaut 50 k€ de plus qu'au bilan.",
    siRachat: 50000,
    toujours: 0,
  },
  {
    id: "transporteur",
    titre: "Grève chez le transporteur des agences de l'Isère",
    de: "Vianney Charrel",
    role: "Directeur régional Isère, Arvel Distribution",
    texte:
      "Notre transporteur est en grève depuis lundi : livraisons en retard à Grenoble-Sud et Moirans, deux chantiers perdus. 25 k€ de marge envolés.",
    siRachat: 0,
    toujours: -25000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Ce que la cible cache. */
  etat: Etat;
  /** Le multiple d'EBE retraité au-delà duquel Sérac ne suit plus. */
  multipleSerac: number;
  /** La cédante rompt-elle après un retrade ? */
  uRupture: number;
  passif: boolean;
  /** Sans séquestre, récupère-t-on ce que la garantie de la cédante doit ? */
  uRecouvrement: number;
  /** La cédante accepte-t-elle le séquestre au premier prix ? */
  uSequestre: number;
  /** Accepte-t-elle la baisse demandée au titre du directeur commercial ? */
  uBaisse: number;
  /** Le directeur commercial part-il ? */
  uDirecteur: number;
  /** La part des synergies de coûts que les fournisseurs laisseront réaliser. */
  realisation: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000357 + 7);
  const ue = r();
  const etat: Etat =
    ue < ETATS.saine ? "saine" : ue < ETATS.saine + ETATS.stock ? "stock" : "client";
  const multipleSerac = SERAC.multipleMin + (SERAC.multipleMax - SERAC.multipleMin) * r();
  const uRupture = r();
  const passif = r() < PASSIF.chance;
  const uRecouvrement = r();
  const uSequestre = r();
  const uBaisse = r();
  const uDirecteur = r();
  const realisation = borne(SYNERGIES.realisationCouts + 0.06 * (r() + r() + r() - 1.5), 0.8, 1);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    etat,
    multipleSerac,
    uRupture,
    passif,
    uRecouvrement,
    uSequestre,
    uBaisse,
    uDirecteur,
    realisation,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Le prix au-delà duquel Sérac ne suit plus : il a fait son inventaire, pas l'audit des clients. */
export const plafondSerac = (h: Hasard) =>
  Math.round((h.multipleSerac * EBE_RETRAITE) / 10000) * 10000 -
  (h.etat === "stock" ? STOCK_SURVALUE : 0);
/** L'offre indicative de Sérac, connue en semaine 2 : il garde de la marge. */
export const offreIndicativeSerac = (h: Hasard) =>
  Math.round((plafondSerac(h) - SERAC.marge) / 50000) * 50000;

/* ---------------------------------------------------------------------------
 * LE DÉROULÉ DE LA VENTE : ce que les décisions et le hasard en font.
 * ------------------------------------------------------------------------- */

export type Diligence = "complete" | "ciblee" | "exclusivite" | "dataroom";
export const DILIGENCES: readonly Diligence[] = ["complete", "ciblee", "exclusivite", "dataroom"];

export interface Deroule {
  /** L'offre indicative ; 0 sans offre. */
  offre: number;
  diligence: Diligence | null;
  fraisAudit: number;
  /** Ce que l'audit a mis au jour, en semaine 5. */
  stockConnu: boolean;
  clientConnu: boolean;
  /** L'audit a recalculé l'EBE : l'écart entre l'EBE publié et l'EBE retraité est sur la table. */
  ebeConnu: boolean;
  /** Le montant des problèmes chiffrés par l'audit (stock, client), en euros. */
  risques: number;
  /** L'offre ferme de la semaine 6, et le plafond qu'Arvel se donne alors. */
  offreFerme: number;
  plafond: number;
  /** La semaine où Arvel sort de la vente, s'il en sort. */
  sortie: number | null;
  /** Pourquoi. */
  motif: "sans-offre" | "rupture" | "retrait" | "battu" | null;
  /** Ce qu'a fait Sérac après l'offre ferme. */
  serac: "surenchere" | "retrait" | "exclu" | "acheteur" | null;
  /** Sa surenchère annoncée, et son plafond réel. */
  annonceSerac: number | null;
  plafondSerac: number;
  achete: boolean;
  /** Le prix fixe payé (valeur d'entreprise), et le complément de prix promis. */
  prix: number;
  complement: number;
}

/** Ce que fait de la vente une suite de décisions, sous un hasard donné. */
export function derouler(chemin: readonly number[], graine: number): Deroule {
  const h = hasard(graine);
  const [d1, d2, d3, d4] = chemin as [number, number, number, number];
  const R = plafondSerac(h);
  const base: Deroule = {
    offre: OFFRES[d1]!,
    diligence: null,
    fraisAudit: 0,
    stockConnu: false,
    clientConnu: false,
    ebeConnu: false,
    risques: 0,
    offreFerme: 0,
    plafond: PLAFONDS[d1]!,
    sortie: null,
    motif: null,
    serac: null,
    annonceSerac: null,
    plafondSerac: R,
    achete: false,
    prix: 0,
    complement: 0,
  };
  if (d1 === 3) {
    return { ...base, sortie: EFFET[D.offre], motif: "sans-offre", serac: "acheteur" };
  }
  const diligence = DILIGENCES[d2]!;
  const fraisAudit =
    diligence === "complete" ? DILIGENCE.complete : diligence === "ciblee" ? DILIGENCE.ciblee : 0;
  const stockConnu = diligence === "complete" || diligence === "ciblee";
  const clientConnu = diligence === "complete";
  const ebeConnu = stockConnu;
  const risques =
    (stockConnu && h.etat === "stock" ? STOCK_SURVALUE : 0) +
    (clientConnu && h.etat === "client" ? PERTE_CLIENT : 0);
  const exclusif = diligence === "exclusivite";
  const offre = exclusif ? Math.max(base.offre, EXCLUSIVITE) : base.offre;
  // Seule l'offre bâtie sur l'EBE publié se corrige de l'écart entre les deux EBE.
  const ecartEbe = ebeConnu && d1 === 1 ? VE_PUBLIEE - VE_AUTONOME : 0;
  const etat = { ...base, diligence, fraisAudit, stockConnu, clientConnu, ebeConnu, risques };

  // La semaine 6 : l'offre ferme.
  let offreFerme = offre;
  let plafond = base.plafond;
  let rupture = false;
  if (d3 === 3) {
    return {
      ...etat,
      offreFerme: 0,
      sortie: EFFET[D.offreFerme],
      motif: "retrait",
      serac: "acheteur",
    };
  }
  if (d3 === 1) {
    offreFerme = offre - ecartEbe - risques;
    plafond = base.plafond - ecartEbe - risques;
    if (ecartEbe > 0) rupture = h.uRupture < RETRADE.publie;
  } else if (d3 === 2) {
    offreFerme = Math.round((offre * (1 - BAISSE_FORFAITAIRE)) / 10000) * 10000;
    const justifiee = ecartEbe + risques >= offre * BAISSE_FORFAITAIRE;
    rupture = (exclusif || !justifiee) && h.uRupture < RETRADE.forfait;
  }
  const ferme = { ...etat, offreFerme, plafond };
  if (rupture) {
    return { ...ferme, sortie: ANNONCES.rupture, motif: "rupture", serac: "acheteur" };
  }

  // La semaine 7 : Sérac surenchérit s'il le peut, ou se retire.
  const surenchere = !exclusif && R >= offreFerme + SERAC.ecart;
  if (!surenchere) {
    // Personne en face : la cédante demande un geste ; seule la surenchère réflexe le paie.
    const prix = d4 === 0 ? offreFerme + SURENCHERE : offreFerme;
    return { ...ferme, serac: exclusif ? "exclu" : "retrait", achete: true, prix };
  }
  // Au dernier tour, le banquier de la cédante fait connaître l'offre finale de Sérac.
  const annonceSerac = R;
  const avecSerac = { ...ferme, serac: "surenchere" as const, annonceSerac };
  if (d4 === 0) return { ...avecSerac, achete: true, prix: R + SURENCHERE };
  if (R + PAS <= plafond) return { ...avecSerac, achete: true, prix: R + PAS };
  if (d4 === 2) {
    const complement = Math.round((R + PAS - plafond) / COMPLEMENT.decote / 10000) * 10000;
    if (complement <= COMPLEMENT.max) {
      return { ...avecSerac, achete: true, prix: plafond, complement };
    }
  }
  return { ...avecSerac, sortie: ANNONCES.protocole, motif: "battu" };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR POUR ARVEL, DANS UN MONDE DONNÉ.
 * ------------------------------------------------------------------------- */

/** Ce que la valeur suppose des aléas : leur issue, ou, tant qu'elle est inconnue, chacune des possibles. */
interface Monde {
  etat: Etat;
  passif: boolean;
  recouvre: boolean;
  sequestreAccepte: boolean;
  baisseAcceptee: boolean;
  part: boolean;
  realisation: number;
}

/** Les aléas que le trimestre a déjà révélés, en fin de semaine w. */
function connu(chemin: readonly number[], dr: Deroule, w: number) {
  const etatAudit = dr.clientConnu ? ANNONCES.audit : ANNONCES.closing;
  return {
    stock: w >= (dr.stockConnu ? ANNONCES.audit : ANNONCES.closing),
    etat: w >= etatAudit,
    passif: w >= ANNONCES.closing,
    sequestre: w >= EFFET[D.garantie],
    baisse: w >= EFFET[D.directeur],
    directeur: w >= ANNONCES.directeur,
    realisation: w >= ANNONCES.achats,
    choix: (k: number) => (w >= EFFET[k]! ? chemin[k]! : NEUTRE[k]!),
  };
}

/** Les mondes possibles en fin de semaine w, avec leur probabilité. */
function mondes(chemin: readonly number[], h: Hasard, dr: Deroule, w: number) {
  const c = connu(chemin, dr, w);
  const d6 = c.choix(D.directeur);
  const pDepart = DIRECTEUR.depart[d6]!;
  // Ce que la cible cache : révélé tout entier par l'audit complet, ou par le closing ;
  // l'audit ciblé ne dit que le stock.
  let etats: [Etat, number][];
  if (c.etat) etats = [[h.etat, 1]];
  else if (c.stock) {
    etats =
      h.etat === "stock"
        ? [["stock", 1]]
        : [
            ["saine", ETATS.saine / (ETATS.saine + ETATS.client)],
            ["client", ETATS.client / (ETATS.saine + ETATS.client)],
          ];
  } else etats = (Object.keys(ETATS) as Etat[]).map((e) => [e, ETATS[e]]);
  const deux = (sait: boolean, vrai: boolean, p: number): [boolean, number][] =>
    sait
      ? [[vrai, 1]]
      : [
          [true, p],
          [false, 1 - p],
        ];
  const sortie: { m: Monde; p: number }[] = [];
  for (const [etat, pe] of etats)
    for (const [passif, pp] of deux(c.passif, h.passif, PASSIF.chance))
      for (const [recouvre, pr] of deux(
        c.passif,
        h.uRecouvrement < GARANTIE.cedante.recouvrement,
        GARANTIE.cedante.recouvrement,
      ))
        for (const [sequestreAccepte, ps] of deux(
          c.sequestre,
          h.uSequestre < GARANTIE.arvel.chance,
          GARANTIE.arvel.chance,
        ))
          for (const [baisseAcceptee, pb] of deux(
            c.baisse,
            h.uBaisse < DIRECTEUR.chanceBaisse,
            DIRECTEUR.chanceBaisse,
          ))
            for (const [part, pd] of deux(c.directeur, h.uDirecteur < pDepart, pDepart))
              sortie.push({
                m: {
                  etat,
                  passif,
                  recouvre,
                  sequestreAccepte,
                  baisseAcceptee,
                  part,
                  realisation: c.realisation ? h.realisation : SYNERGIES.realisationCouts,
                },
                p: pe * pp * pr * ps * pb * pd,
              });
  return sortie;
}

export interface Bilan {
  /** La valeur de Mourgue pour Arvel, avant le prix. */
  valeurCible: number;
  /** Ce que coûtent les garanties et la fidélisation, et ce que les garanties rendent. */
  garanties: number;
  recupere: number;
  /** Le complément de prix effectivement versé. */
  complementVerse: number;
  /** Le prix fixe, après la baisse éventuelle obtenue au titre du directeur commercial. */
  prix: number;
  /** Ce que la cible cachait et que le prix n'a pas compté. */
  surprises: number;
}

/** La valeur pour Arvel d'un rachat au prix donné, dans un monde donné. */
function valeurDuRachat(
  dr: Deroule,
  m: Monde,
  choix: (k: number) => number,
  imprevu: number,
  ebeTenuMalgre: boolean,
): Bilan {
  const d5 = choix(D.garantie);
  const d6 = choix(D.directeur);
  const stock = m.etat === "stock" ? STOCK_SURVALUE : 0;
  const client = m.etat === "client" ? PERTE_CLIENT : 0;
  const clientsPerdus = m.part
    ? d6 === 2
      ? DIRECTEUR.clientsNonConcurrence
      : DIRECTEUR.clients
    : 0;
  const valeurCible =
    VE_AUTONOME -
    stock -
    client +
    VALEUR_SYNERGIES_COUTS * m.realisation +
    (m.part ? 0 : SYNERGIES_REVENUS_PROBABLES) -
    clientsPerdus -
    INTEGRATION -
    FRAIS_TRANSACTION -
    (m.passif ? PASSIF.montant : 0) +
    imprevu;
  let prix = dr.prix;
  if (d6 === 3 && m.baisseAcceptee) prix -= DIRECTEUR.baisse;
  if (d5 === 2) prix -= GARANTIE.renonciation;
  // La garantie couvre les dettes nées avant la cession, pas la valeur que la cédante donnait à son stock.
  const reclamable = m.passif ? PASSIF.montant : 0;
  let recupere = 0;
  let garanties = 0;
  if (d5 === 0) {
    const g = GARANTIE.cedante;
    recupere = m.recouvre
      ? Math.min(Math.max(0, reclamable - g.franchise), g.plafond * dr.prix)
      : 0;
  } else if (d5 === 1) {
    const g = GARANTIE.arvel;
    recupere = Math.min(Math.max(0, reclamable - g.franchise), g.plafond * dr.prix);
    garanties += m.sequestreAccepte ? g.prix : g.prixRefus;
  }
  if (d6 === 1 && !m.part) garanties += DIRECTEUR.prime;
  if (d6 === 2) garanties += DIRECTEUR.nonConcurrence;
  // Le complément n'est dû que si l'EBE de Mourgue tient deux ans : ni client perdu, ni directeur parti.
  const ebeTenu = m.etat !== "client" && !m.part && ebeTenuMalgre;
  const complementVerse = dr.complement > 0 && ebeTenu ? dr.complement : 0;
  return {
    valeurCible,
    garanties,
    recupere,
    complementVerse,
    prix,
    surprises: (dr.stockConnu ? 0 : stock) + (dr.clientConnu ? 0 : client),
  };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  /** L'offre d'Arvel en vigueur (valeur d'entreprise), ou le prix signé ; 0 hors de la vente. */
  offre: number;
  /** Le prix plafond qu'Arvel se donne. */
  plafond: number;
  /** La dernière offre connue de Sérac ; 0 s'il s'est retiré ou n'est pas connu. */
  serac: number;
  /** Les problèmes de la cible chiffrés à ce jour. */
  risques: number;
  /** Les frais d'audit engagés. */
  frais: number;
  /** 1 tant qu'Arvel est dans la vente ou l'a emportée. */
  enLice: number;
  achete: number;
};

const imprevuDe = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

function estimer(chemin: readonly number[], graine: number, w: number, jours: number) {
  const h = hasard(graine);
  const dr = derouler(chemin, graine);
  const c = connu(chemin, dr, w);
  const tombes = h.imprevus.filter((i) => i.semaine <= w);
  const toujours = tombes.reduce((s, i) => s + i.imprevu.toujours, 0);
  const siRachat = tombes.reduce((s, i) => s + i.imprevu.siRachat, 0);
  const permis = imprevuDe(h, "permis");
  const ebeTenuMalgre = !(permis && permis.semaine <= w);
  const perteJours = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const frais = w >= EFFET[D.diligence] ? dr.fraisAudit : 0;
  const base = perteJours + toujours - frais;
  if (w < EFFET[D.offre]) return { valeur: perteJours + toujours, dr, frais };
  if (dr.sortie !== null && w >= dr.sortie) return { valeur: base - PERTE_SERAC, dr, frais };
  // Tant que la vente n'est pas signée, on l'estime à l'offre en vigueur.
  const signe = w >= ANNONCES.protocole;
  const prixEnVigueur =
    w < EFFET[D.diligence]
      ? dr.offre
      : w < EFFET[D.offreFerme]
        ? dr.diligence === "exclusivite"
          ? Math.max(dr.offre, EXCLUSIVITE)
          : dr.offre
        : dr.offreFerme;
  const enCours: Deroule = signe ? dr : { ...dr, prix: prixEnVigueur, complement: 0 };
  let valeur = 0;
  for (const { m, p } of mondes(chemin, h, dr, w)) {
    const b = valeurDuRachat(enCours, m, c.choix, siRachat, ebeTenuMalgre);
    valeur += p * (b.valeurCible - b.prix - b.complementVerse - b.garanties + b.recupere);
  }
  return { valeur: base + valeur, dr, frais };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  etat: Etat;
  deroule: Deroule;
  /** Le bilan du rachat, si Arvel l'a emporté. */
  rachat: Bilan | null;
  passif: boolean;
  /** Le directeur commercial est-il parti ? (s'il y a eu rachat) */
  directeurParti: boolean;
  /** La réponse de la cédante au séquestre et à la baisse, si on les a demandés. */
  sequestreAccepte: boolean;
  baisseAcceptee: boolean;
  realisation: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const dr = derouler(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    const dehors = dr.sortie !== null && w >= dr.sortie;
    const offre =
      w < EFFET[D.offre] || dehors
        ? 0
        : w >= ANNONCES.protocole && dr.achete
          ? dr.prix
          : w >= EFFET[D.offreFerme]
            ? dr.offreFerme
            : w >= EFFET[D.diligence] && dr.diligence === "exclusivite"
              ? Math.max(dr.offre, EXCLUSIVITE)
              : dr.offre;
    const serac =
      w < EFFET[D.offre]
        ? 0
        : dr.serac === "exclu" && w >= EFFET[D.diligence]
          ? 0
          : w >= ANNONCES.serac && dr.serac === "retrait"
            ? 0
            : w >= ANNONCES.serac && dr.annonceSerac !== null
              ? dr.sortie === ANNONCES.protocole && w >= ANNONCES.protocole
                ? dr.plafondSerac
                : dr.annonceSerac
              : offreIndicativeSerac(h);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      offre,
      plafond: w >= EFFET[D.offreFerme] ? dr.plafond : PLAFONDS[chemin[D.offre] ?? 3]!,
      serac,
      risques: w >= ANNONCES.audit ? dr.risques : 0,
      frais: e.frais,
      enLice: w >= EFFET[D.offre] && !dehors ? 1 : 0,
      achete: dr.achete && w >= ANNONCES.protocole ? 1 : 0,
    });
    avant = e.valeur;
  }
  const m: Monde = {
    etat: h.etat,
    passif: h.passif,
    recouvre: h.uRecouvrement < GARANTIE.cedante.recouvrement,
    sequestreAccepte: h.uSequestre < GARANTIE.arvel.chance,
    baisseAcceptee: h.uBaisse < DIRECTEUR.chanceBaisse,
    part: h.uDirecteur < DIRECTEUR.depart[chemin[D.directeur]!]!,
    realisation: h.realisation,
  };
  const siRachat = h.imprevus.reduce((s, i) => s + i.imprevu.siRachat, 0);
  const rachat = dr.achete
    ? valeurDuRachat(dr, m, (k) => chemin[k]!, siRachat, !imprevuDe(h, "permis"))
    : null;
  return {
    semaines,
    objectif: semaines[SEMAINES]!.valeur,
    etat: h.etat,
    deroule: dr,
    rachat,
    passif: h.passif,
    directeurParti: dr.achete && m.part,
    sequestreAccepte: m.sequestreAccepte,
    baisseAcceptee: m.baisseAcceptee,
    realisation: h.realisation,
  };
}

/** Ce qui s'est passé pendant des semaines : l'audit, la cédante, Sérac, le closing, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dr = derouler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const enLice = (w: number) => dr.sortie === null || w < dr.sortie;
  return {
    exclusivite: dr.diligence === "exclusivite" && dans(EFFET[D.diligence]),
    audit:
      (dr.diligence === "complete" || dr.diligence === "ciblee") &&
      dans(ANNONCES.audit) &&
      enLice(ANNONCES.audit),
    reponse: dr.offreFerme > 0 && dans(ANNONCES.rupture),
    serac: dr.offreFerme > 0 && dr.motif !== "rupture" && dans(ANNONCES.serac),
    protocole: dr.offreFerme > 0 && dr.motif !== "rupture" && dans(ANNONCES.protocole),
    seracAchete: dr.sortie !== null && dans(ANNONCES.protocole),
    achats: dr.achete && dans(ANNONCES.achats),
    closing: dr.achete && dans(ANNONCES.closing),
    directeur: dr.achete && dans(ANNONCES.directeur),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureRachat {
  valeur: number | null;
  offre: number | null;
  serac: number | null;
  risques: number | null;
  frais: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  plafond: number | null;
  enLice: number | null;
  achete: number | null;
  etat: number | null;
  passif: number | null;
  annonceSerac: number | null;
  seracRetire: number | null;
  stockConnu: number | null;
  clientConnu: number | null;
  ebeConnu: number | null;
  offreFerme: number | null;
  prix: number | null;
  complement: number | null;
  indicativeSerac: number | null;
}

const ETAT_CODE: Readonly<Record<Etat, number>> = { saine: 0, stock: 1, client: 2 };

/**
 * Ce qu'Idriss lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRachat {
  const h = hasard(graine);
  const commun = {
    etat: ETAT_CODE[h.etat],
    passif: h.passif ? 1 : 0,
    indicativeSerac: offreIndicativeSerac(h),
  };
  if (semaine === 0) {
    return {
      valeur: 0,
      offre: 0,
      serac: null,
      risques: 0,
      frais: 0,
      plafond: PLAFOND,
      enLice: 1,
      achete: 0,
      annonceSerac: null,
      seracRetire: 0,
      stockConnu: 0,
      clientConnu: 0,
      ebeConnu: 0,
      offreFerme: 0,
      prix: 0,
      complement: 0,
      ...commun,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const dr = t.deroule;
  const audit = semaine >= ANNONCES.audit;
  return {
    valeur: s.valeur,
    offre: s.offre,
    serac: semaine >= EFFET[D.offre] ? s.serac : null,
    risques: s.risques,
    frais: s.frais,
    plafond: s.plafond,
    enLice: s.enLice,
    achete: s.achete,
    annonceSerac: semaine >= ANNONCES.serac ? dr.annonceSerac : null,
    seracRetire:
      (semaine >= ANNONCES.serac && dr.serac === "retrait") ||
      (semaine >= EFFET[D.diligence] && dr.serac === "exclu")
        ? 1
        : 0,
    stockConnu: audit && dr.stockConnu ? 1 : 0,
    clientConnu: audit && dr.clientConnu ? 1 : 0,
    ebeConnu: audit && dr.ebeConnu ? 1 : 0,
    offreFerme: semaine >= EFFET[D.offreFerme] ? dr.offreFerme : 0,
    prix: s.achete ? dr.prix : 0,
    complement: s.achete ? dr.complement : 0,
    ...commun,
  };
}
