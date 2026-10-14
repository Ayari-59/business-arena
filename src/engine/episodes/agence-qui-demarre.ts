/**
 * L'AGENCE QUI DÉMARRE — le modèle de l'agence de Bourgoin-Jallieu.
 *
 * Une agence ouverte il y a un mois, une équipe neuve, des artisans fidèles à
 * un négoce local, un stock dimensionné comme celui d'une agence mature, et
 * un siège qui attend le point mort. Treize semaines, six décisions. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · ON NE CHANGE PAS DE NÉGOCE POUR UN PRIX. Les artisans restent chez
 *     Rivoire pour l'ouverture à 6 h 30, la livraison sur chantier et un
 *     comptoir qui les connaît. Une promotion remplit le magasin de chasseurs
 *     de prix qui repartent dès qu'elle s'arrête, encombre le comptoir, et
 *     offre la remise aux artisans qui seraient venus sans elle : la marge
 *     part, la clientèle ne reste pas.
 *   · LE BOUCHE-À-OREILLE SE GAGNE CLIENT PAR CLIENT. Un artisan bien servi en
 *     amène d'autres, trois semaines plus tard ; un artisan mal servi n'en
 *     amène aucun. Ce qui est gagné tôt rapporte toute la suite du trimestre,
 *     et la force du réseau varie d'un trimestre à l'autre : c'est un pari.
 *   · LE STOCK D'UNE AGENCE MATURE COÛTE À UNE AGENCE QUI DÉMARRE. Les
 *     références dormantes se paient en frais financiers, en casse et en
 *     démarque ; celles qui tournent manquent. Ajuster l'assortiment à la
 *     demande réelle libère de la trésorerie et sert mieux ; couper partout
 *     crée des ruptures sur ce que les artisans viennent chercher.
 *
 * Le trimestre est jugé en euros : la marge de l'agence moins ce qu'ont coûté
 * l'acquisition des clients (promotions, prospection, service) et le stock,
 * en écart à ce que prévoyait le plan d'affaires.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les artisans du secteur : plombiers, électriciens, maçons, plaquistes, menuisiers. */
export const MARCHE = 140;
/** Les artisans qui achètent régulièrement à l'agence au début du trimestre. */
export const REGULIERS_DEPART = 22;
/** Les clients de la promotion d'ouverture qui passent encore. */
export const CHASSEURS_DEPART = 6;
/** Ce qu'un artisan régulier achète par semaine. */
export const PANIER_ARTISAN = 850;
/** Ce qu'un chasseur de prix achète par semaine, tant qu'il vient. */
export const PANIER_CHASSEUR = 420;
/** Particuliers et passages uniques, par semaine. */
export const PASSAGE = 5000;
export const TAUX_ARTISAN = 0.27;
export const TAUX_PASSAGE = 0.3;
export const STOCK_DEPART = 420000;
export const DORMANT_DEPART = 160000;
/** Frais financiers du stock, par semaine (un peu moins de 10 % par an). */
export const PORTAGE = 0.0019;
/** Casse, démarque et obsolescence du stock dormant, par semaine. */
export const DEPRECIATION = 0.004;
/** La marge brute hebdomadaire qui couvre les salaires, le loyer et les frais fixes. */
export const POINT_MORT = 11000;
/** Le chiffre d'affaires hebdomadaire qui, au taux de marge du plan, atteint le point mort. */
export const CA_POINT_MORT = 41500;
/** La contribution que le plan d'affaires prévoyait pour le trimestre. */
export const PLAN = 90000;
/** Les artisans réguliers que le plan d'affaires prévoyait en semaine 13. */
export const PLAN_REGULIERS = 45;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des chantiers qui démarrent sans vous. */
export const PERTE_PAR_JOUR = 1200;

/** Le chiffre d'affaires hebdomadaire du plan d'affaires : 30 k€ en semaine 1, 42 k€ en semaine 13. */
export const planCA = (semaine: number) => 30000 + 1000 * (semaine - 1);

/** Les décisions, par leur place dans le chemin. */
export const D = {
  frequentation: 0,
  prospection: 1,
  stock: 2,
  morel: 3,
  reseau: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 3, 2] as const;

export const COUTS = {
  promo: 3000,
  /** Ouverture à 6 h 30 et livraison sur chantier : heures décalées et location du camion. */
  service: 900,
  mailing: 1500,
  prospectionCiblee: 250,
  prospectionLarge: 450,
  prixAppel: 600,
  retourPlateforme: 3000,
  parrainage: 1500,
  parFilleul: 60,
  tourneeEnPlus: 300,
  portesOuvertes: 2000,
  promoFin: 1500,
  relance: 400,
} as const;

/** La marge qui reste quand on retire `remise` du prix de vente. */
export const margeApres = (remise: number, taux = TAUX_ARTISAN) =>
  (1 - remise - (1 - taux)) / (1 - remise);

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
    /** Les achats des artisans et des chasseurs. */
    demande?: number;
    /** Les particuliers et les passages. */
    passage?: number;
    /** Ce que les artisans trouvent au comptoir. */
    service?: number;
    /** Des artisans qui viennent essayer l'agence, par semaine. */
    arrivees?: number;
    perte?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "travaux",
    titre: "Travaux sur la route d'accès",
    de: "Mairie de Bourgoin-Jallieu",
    role: "Services techniques",
    texte:
      "La route départementale devant l'agence est en travaux pour deux semaines : circulation alternée, accès difficile pour les camionnettes.",
    duree: 2,
    effet: { demande: 0.9, passage: 0.6 },
  },
  {
    id: "froid",
    titre: "Vague de froid",
    de: "Kevin Lopes",
    role: "Vendeur comptoir",
    texte:
      "Moins huit ce matin : les maçons et les plaquistes ont arrêté leurs chantiers. Personne au comptoir avant 9 heures.",
    duree: 1,
    effet: { demande: 0.75, passage: 0.8 },
  },
  {
    id: "lotissement",
    titre: "Un lotissement démarre",
    de: "Bastien Morin",
    role: "Commercial terrain",
    texte:
      "Le lotissement de soixante maisons de la ZAC des Platières démarre : les artisans qui y travaillent cherchent un négoce à moins de dix minutes.",
    duree: 2,
    effet: { demande: 1.12, arrivees: 1 },
  },
  {
    id: "placo",
    titre: "Rupture de plaques de plâtre",
    de: "Plateforme régionale",
    role: "Logistique",
    texte:
      "Rupture nationale sur la plaque de plâtre standard : deux semaines sans livraison, les plaquistes se servent où ils trouvent.",
    duree: 2,
    effet: { service: -0.1 },
  },
  {
    id: "cambriolage",
    titre: "Cambriolage de l'agence",
    de: "Samia Haddou",
    role: "Magasinière",
    texte:
      "L'agence a été cambriolée cette nuit : de l'outillage électroportatif volé, une porte du dépôt forcée. Franchise et réparations : 3 500 €.",
    duree: 1,
    effet: { perte: 3500, service: -0.04 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Les achats de la semaine : météo, chantiers, calendrier. */
  demande: number;
  passage: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La force du bouche-à-oreille entre artisans ce trimestre, de 0,45 à 1,55. */
  reseau: number;
  /** Morel Bâtiment est-il plus fragile qu'il n'y paraît ? */
  uFragile: number;
  /** Morel accepte-t-il des conditions de professionnel ? */
  uAccepte: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

/** Les tirages d'une graine, calculés une fois : le bilan en rejoue des centaines. */
export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 179424673 + 53);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: borne(1 + 0.06 * gauss(r), 0.82, 1.18),
      passage: borne(1 + 0.12 * gauss(r), 0.6, 1.4),
    });
  }
  const reseau = 0.45 + 1.1 * r();
  const uFragile = r();
  const uAccepte = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, reseau, uFragile, uAccepte, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Un peu plus d'une fois sur trois, Morel Bâtiment est au bord du redressement judiciaire. */
export const morelFragile = (graine: number) => hasard(graine).uFragile < 0.35;
/** Proposé à des conditions de professionnel, Morel accepte un peu plus d'une fois sur deux. */
export const morelAccepte = (graine: number) => hasard(graine).uAccepte < 0.55;

/** La force du bouche-à-oreille ce trimestre, telle que le bilan la raconte. */
export const forceDuReseau = (graine: number) => {
  const u = hasard(graine).reseau;
  return u < 0.8 ? "faible" : u < 1.2 ? "moyen" : "fort";
};

/* ---------------------------------------------------------------------------
 * MOREL BÂTIMENT : un gros client qui demande de gros prix.
 *
 * Douze compagnons, 6 000 € d'achats par semaine. Accepter ses conditions
 * (−12 %, paiement à 60 jours) fait du volume sans marge, se sait chez les
 * autres artisans, et expose à un impayé si l'entreprise est fragile. Des
 * conditions de professionnel (−4 %, 30 jours, encours plafonné, livraison
 * sur chantier) font un client plus petit, plus sûr, et qui recommande.
 * ------------------------------------------------------------------------- */
export const MOREL = {
  panierToutAccepte: 6000,
  tauxToutAccepte: margeApres(0.12),
  panierPro: 4500,
  /** −4 %, et la livraison sur chantier qui va avec. */
  tauxPro: margeApres(0.04) - 0.01,
  /** La part d'une créance qu'on ne reverra pas après un redressement judiciaire. */
  perteSurCreance: 0.85,
  encoursPlafond: 8000,
  /** Ses sous-traitants, qui viennent quand il est bien servi. */
  relais: 1.2,
} as const;

export type Semaine = {
  /** Clients professionnels actifs : artisans réguliers et chasseurs de prix. */
  clients: number;
  reguliers: number;
  chasseurs: number;
  ca: number;
  margeBrute: number;
  taux: number;
  /** La part des clients professionnels de la semaine précédente qui sont revenus. */
  retour: number;
  stock: number;
  stockDormant: number;
  /** Ce que les artisans trouvent à l'agence : horaires, livraison, disponibilité, accueil. */
  service: number;
  /** Promotions, prospection, service, impayés, imprévus. */
  couts: number;
  coutStock: number;
  /** La marge moins les coûts d'acquisition et de stock. */
  contribution: number;
  /** Les artisans réguliers perdus depuis le début du trimestre. */
  perdus: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au plan d'affaires : positif, l'agence fait mieux que prévu. */
  objectif: number;
  contribution: number;
  margeBrute: number;
  ca: number;
  couts: number;
  coutStock: number;
  reguliersFinal: number;
  /** Les artisans réguliers perdus en cours de trimestre. */
  perdus: number;
  /** Les artisans revenus grâce à la relance de fin de trimestre. */
  recuperes: number;
  filleuls: number;
  chasseursMax: number;
  tauxMoyen: number;
  margeFinale: number;
  stockFinal: number;
  dormantFinal: number;
  /** Les conditions faites à Morel : 0, les siennes ; 1, celles d'un professionnel ; 2, aucune. */
  choixMorel: number;
  morelClient: boolean;
  morelRefuse: boolean;
  morelImpaye: number;
  morelBloque: boolean;
}

function borne(x: number, a: number, b: number) {
  return Math.min(b, Math.max(a, x));
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const fragile = morelFragile(graine);
  const morelPro = d4 === 1 && morelAccepte(graine);
  const morelTout = d4 === 0;
  const semaines: (Semaine | null)[] = [null];
  // Les trois semaines de retard du bouche-à-oreille lisent l'avant-trimestre.
  const historique: { reguliers: number; service: number }[] = [
    { reguliers: REGULIERS_DEPART, service: 0.5 },
    { reguliers: REGULIERS_DEPART, service: 0.5 },
    { reguliers: REGULIERS_DEPART, service: 0.5 },
  ];
  let reguliers = REGULIERS_DEPART;
  let chasseurs = CHASSEURS_DEPART;
  let stock = STOCK_DEPART;
  let dormant = DORMANT_DEPART;
  let perdus = 0;
  let recuperes = 0;
  let filleuls = 0;
  let chasseursMax = chasseurs;
  let morelImpaye = 0;
  let morelBloque = false;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = (cle: "demande" | "passage") =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[cle] ?? 1), 1);
    const demande = n.demande * effet("demande");
    let couts = w === 1 ? perteEnquete : 0;
    for (const a of actifs) if (a.semaine === w) couts += a.imprevu.effet.perte ?? 0;

    // Les leviers de la semaine.
    const service = d1 === 1 && w >= 2 ? (w === 2 ? 0.6 : 1) : 0;
    const remise =
      d1 === 0 && w >= 2 && w <= 4
        ? 0.15
        : d5 === 2 && w === 10
          ? 0.2
          : d6 === 0 && w >= 12
            ? 0.1
            : 0;
    const prixAppel = d2 === 2 && w >= 4;
    const destockage = d3 === 1 && w >= 6 && w <= 8;
    const assortiment = d3 === 0 && w >= 7;

    // Les chasseurs de prix : ils viennent pour une remise et repartent avec elle.
    let arriventChasseurs = 0;
    if (d1 === 0 && w >= 2 && w <= 4) arriventChasseurs += 12;
    if (prixAppel) arriventChasseurs += 3;
    if (destockage) arriventChasseurs += 6;
    if (d5 === 2 && w === 10) arriventChasseurs += 15;
    if (d6 === 0 && w >= 12) arriventChasseurs += 8;
    const fideliteChasseurs = remise > 0 || destockage ? 0.8 : prixAppel ? 0.75 : 0.55;
    const chasseursAvant = chasseurs;
    chasseurs = chasseurs * fideliteChasseurs + arriventChasseurs * demande;
    chasseursMax = Math.max(chasseursMax, chasseurs);

    // Ce que les artisans trouvent au comptoir.
    let qualite = 0.5 + 0.25 * service;
    if (d2 === 1 && w >= 4) qualite -= 0.04; // Bastien sur la route quatre jours sur cinq.
    if (d2 === 3 && w >= 4) qualite += 0.02; // Bastien au comptoir.
    if (assortiment) qualite += 0.08;
    if (d3 === 2 && w >= 7) qualite -= 0.12; // Ruptures sur les références qui tournent.
    if (d6 === 1 && w >= 12) qualite += 0.04;
    qualite -= 0.003 * chasseurs; // Le comptoir encombré à l'heure où les artisans chargent.
    for (const a of actifs) qualite += a.imprevu.effet.service ?? 0;
    qualite = borne(qualite, 0.2, 0.95);

    // Les artisans qui arrivent : spontanément, par la prospection, par le bouche-à-oreille.
    const place = Math.max(0, 1 - reguliers / MARCHE);
    let essais = 0.8 * demande;
    if (remise > 0) essais += 0.8;
    if (prixAppel) essais += 0.3;
    if (d1 === 2 && w >= 2 && w <= 5) essais += 0.5;
    const conversion = (base: number, parService: number) =>
      base + parService * (service > 0 ? 1 : 0) + (assortiment ? 0.03 : 0);
    let prospection = 0;
    if (d2 === 0 && w >= 4) prospection += 12 * conversion(0.04, 0.09);
    if (d2 === 1 && w >= 4) prospection += 28 * (0.02 + 0.03 * (service > 0 ? 1 : 0));
    if (d5 === 1 && w >= 10) prospection += 6 * conversion(0.06, 0.1);
    const avant = historique[historique.length - 3]!;
    const bouche = 0.07 * h.reseau * avant.reguliers * Math.max(0, avant.service - 0.55);
    let parrainage = 0;
    if (d5 === 0 && w >= 10) {
      parrainage = 0.33 * h.reseau ** 2 * reguliers * Math.max(0, qualite - 0.55) * place;
      filleuls += parrainage;
    }
    let arrivees = (essais + prospection + bouche) * place + parrainage;
    for (const a of actifs) arrivees += a.imprevu.effet.arrivees ?? 0;
    if (morelPro && !fragile && w >= 10 && w <= 12) arrivees += MOREL.relais;

    // Les artisans qui retournent chez Rivoire : d'autant plus que le service déçoit.
    let usure = 0.08 * (1 - qualite);
    if (d6 === 1 && w >= 12) usure *= 0.3;
    const reguliersAvant = reguliers;
    const departs = reguliers * usure;
    perdus += departs;
    reguliers += arrivees - departs;
    if (d6 === 1 && w === 12) {
      // La relance ramène une partie des artisans qui ne venaient plus.
      const revenus = 0.75 * perdus;
      recuperes = revenus;
      reguliers += revenus;
    }

    // Ce qui se vend, et ce qu'il en reste.
    let panier = PANIER_ARTISAN * demande * (1 + 0.08 * service);
    if (d3 === 2 && w >= 7) panier *= 0.94;
    if (d6 === 1 && w === 12) panier *= 1 + (1.5 * recuperes) / Math.max(1, reguliers);
    let tauxArtisan = margeApres(remise);
    if (prixAppel) tauxArtisan -= 0.035;
    if (morelTout && w >= 9) tauxArtisan -= 0.01; // Les conditions de Morel se savent.
    const caArtisans = reguliers * panier;
    const caChasseurs = chasseurs * PANIER_CHASSEUR * demande;
    const tauxChasseurs = remise > 0 ? margeApres(remise) : prixAppel || destockage ? 0.08 : 0.16;
    const caPassage =
      PASSAGE *
      n.passage *
      effet("passage") *
      (1 + 2.5 * remise) *
      (prixAppel ? 1.1 : 1) *
      (destockage ? 1.3 : 1);
    const tauxPassage = margeApres(remise, TAUX_PASSAGE);

    // Morel Bâtiment.
    let caMorel = 0;
    let margeMorel = 0;
    if (morelTout && w >= 8 && !(fragile && w >= 12)) {
      caMorel = MOREL.panierToutAccepte * demande;
      margeMorel = caMorel * MOREL.tauxToutAccepte;
    }
    if (morelTout && fragile && w === 12) {
      // Redressement judiciaire : quatre semaines d'achats à 60 jours, aucune encore réglée.
      morelImpaye = 4 * MOREL.panierToutAccepte * MOREL.perteSurCreance;
      couts += morelImpaye;
    }
    if (morelPro && w >= 8 && !(fragile && w >= 11)) {
      caMorel = MOREL.panierPro * demande;
      margeMorel = caMorel * MOREL.tauxPro;
    }
    if (morelPro && fragile && w === 11) {
      // Le compte est bloqué au premier retard : la perte s'arrête au plafond.
      morelBloque = true;
      morelImpaye = MOREL.encoursPlafond * MOREL.perteSurCreance;
      couts += morelImpaye;
    }

    // Le stock.
    let caDestockage = 0;
    let margeDestockage = 0;
    if (d3 === 0 && w === 6) {
      stock -= 110000;
      dormant -= Math.min(dormant, 110000);
      couts += COUTS.retourPlateforme;
    }
    if (destockage) {
      const sorti = Math.min(dormant, 80000 / 3);
      stock -= sorti;
      dormant -= sorti;
      caDestockage = (sorti / (1 - TAUX_ARTISAN)) * 0.65;
      margeDestockage = caDestockage - sorti;
    }
    if (d3 === 2 && w >= 6) stock = Math.max(250000, stock - 12000);
    dormant += d3 === 0 && w >= 6 ? 300 : 1500; // Des références qui cessent de tourner.
    const coutStock = stock * PORTAGE + dormant * DEPRECIATION;

    // Les coûts d'acquisition et de service.
    if (d1 === 0 && w === 2) couts += COUTS.promo;
    if (d1 === 1 && w >= 2) couts += COUTS.service;
    if (d1 === 2 && w === 2) couts += COUTS.mailing;
    if (d2 === 0 && w >= 4) couts += COUTS.prospectionCiblee;
    if (d2 === 1 && w >= 4) couts += COUTS.prospectionLarge;
    if (d2 === 2 && w === 4) couts += COUTS.prixAppel;
    if (d5 === 0 && w === 10) couts += COUTS.parrainage;
    if (d5 === 0 && w >= 10) couts += COUTS.parFilleul * parrainage;
    if (d5 === 1 && w >= 10) couts += COUTS.tourneeEnPlus;
    if (d5 === 2 && w === 10) couts += COUTS.portesOuvertes;
    if (d6 === 0 && w === 12) couts += COUTS.promoFin;
    if (d6 === 1 && w === 12) couts += COUTS.relance;

    const ca = caArtisans + caChasseurs + caPassage + caMorel + caDestockage;
    const margeBrute =
      caArtisans * tauxArtisan +
      caChasseurs * tauxChasseurs +
      caPassage * tauxPassage +
      margeMorel +
      margeDestockage;
    const retour =
      (reguliersAvant - departs + chasseursAvant * fideliteChasseurs) /
      Math.max(1, reguliersAvant + chasseursAvant);
    historique.push({ reguliers, service: qualite });

    semaines.push({
      clients: reguliers + chasseurs + (caMorel > 0 ? 1 : 0),
      reguliers,
      chasseurs,
      ca,
      margeBrute,
      taux: margeBrute / ca,
      retour,
      stock,
      stockDormant: dormant,
      service: qualite,
      couts,
      coutStock,
      contribution: margeBrute - couts - coutStock,
      perdus,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const somme = (f: (s: Semaine) => number) => pleines.reduce((x, s) => x + f(s), 0);
  const contribution = somme((s) => s.contribution);
  const ca = somme((s) => s.ca);
  const margeBrute = somme((s) => s.margeBrute);
  const derniere = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: contribution - PLAN,
    contribution,
    margeBrute,
    ca,
    couts: somme((s) => s.couts),
    coutStock: somme((s) => s.coutStock),
    reguliersFinal: derniere.reguliers,
    perdus,
    recuperes,
    filleuls,
    chasseursMax,
    tauxMoyen: margeBrute / ca,
    margeFinale: derniere.margeBrute,
    stockFinal: derniere.stock,
    dormantFinal: derniere.stockDormant,
    choixMorel: d4 ?? 2,
    morelClient: morelTout || morelPro,
    morelRefuse: d4 === 1 && !morelPro,
    morelImpaye,
    morelBloque,
  };
}

/** Ce qui s'est passé pendant des semaines : Morel, le parrainage, la relance, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    promoFinie: chemin[D.frequentation] === 0 && dans(5),
    morelImpaye: chemin[D.morel] === 0 && t.morelImpaye > 0 && dans(12),
    morelBloque: t.morelBloque && dans(11),
    morelRecommande: t.morelClient && chemin[D.morel] === 1 && !t.morelBloque && dans(10),
    parrainage: chemin[D.reseau] === 0 && dans(12),
    relance: chemin[D.fin] === 1 && dans(13),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
    trimestre: t,
  };
}

export interface LectureAgence {
  clients: number | null;
  reguliers: number | null;
  ca: number | null;
  taux: number | null;
  retour: number | null;
  stockDormant: number | null;
  stock: number | null;
  margeBrute: number | null;
  /** Les artisans réguliers qui ont cessé de venir depuis le début du trimestre. */
  perdus: number | null;
  planCA: number | null;
}

/** Ce que la directrice lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAgence {
  if (semaine === 0) {
    return {
      clients: REGULIERS_DEPART + CHASSEURS_DEPART,
      reguliers: REGULIERS_DEPART,
      ca: 24200,
      taux: 0.258,
      retour: 0.89,
      stockDormant: DORMANT_DEPART,
      stock: STOCK_DEPART,
      margeBrute: 6250,
      perdus: 0,
      planCA: planCA(0),
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    clients: s.clients,
    reguliers: s.reguliers,
    ca: s.ca,
    taux: s.taux,
    retour: s.retour,
    stockDormant: s.stockDormant,
    stock: s.stock,
    margeBrute: s.margeBrute,
    perdus: s.perdus,
    planCA: planCA(semaine),
  };
}
