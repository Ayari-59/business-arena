/**
 * L'OFFRE DE RACHAT — le modèle de l'offre du Groupe Nordal sur la Laiterie
 * de Kerbrélan.
 *
 * Un lundi de septembre, le Groupe Nordal, multinationale laitière et premier
 * concurrent de la laiterie, remet au président Lénaïc Guivarc'h une offre
 * sur 100 % des titres : 7,5 fois l'excédent brut d'exploitation (EBE), soit
 * 97,5 M€ de valeur d'entreprise, valable six semaines. La famille est
 * divisée ; le conseil d'administration demande au directeur général, Yannig
 * Le Goaziou, une recommandation. Septembre à novembre, treize semaines, six
 * décisions, de la réponse à l'offre au protocole de cession.
 *
 * LA VALEUR POUR LES ACTIONNAIRES, ESTIMÉE EN SEMAINE 13. Une cession se juge
 * sur ce que la famille obtient pour ses titres, ou sur ce que valent ses
 * titres si elle garde la laiterie. Le directeur financier l'estime chaque
 * semaine :
 *
 *   · si la laiterie est vendue : le prix ferme (le multiple obtenu fois
 *     l'EBE, moins les baisses concédées après l'audit de l'acquéreur), moins
 *     la dette financière nette reprise, plus le complément de prix à sa
 *     valeur espérée, moins l'appel attendu de la garantie d'actif et de
 *     passif, moins ce que coûtent les engagements écrits ou leur absence (la
 *     clause d'approvisionnement si les producteurs ne renouvellent pas), moins
 *     les frais de la cession ;
 *   · si elle reste indépendante : la valeur actualisée des flux du plan
 *     d'affaires réaliste, dans le scénario de marché laitier que le trimestre
 *     révèle, moins les points faibles (ligne en fin de vie, mise en conformité
 *     de la station d'épuration), moins la dette nette et les frais engagés ;
 *   · dans les deux cas : ce que les imprévus ont pris ou rapporté en
 *     trésorerie, et ce qu'a coûté une enquête trop longue en semaine 1.
 *
 * Avant d'être connu, chaque aléa (le scénario de marché, les points faibles,
 * l'appel d'offres MDD de Celtis, le vote des producteurs) compte pour son
 * espérance, aux probabilités que les sources donnent ; il compte pour ce
 * qu'il est dès que le trimestre le révèle. Tant que la vente n'est pas
 * décidée, l'estimation retient la meilleure des deux voies ouvertes ; une
 * fois engagée, elle suppose que la vente se signe aux conditions en vigueur.
 * Le hasard porte sur ce que le trimestre révèle, jamais sur les règles du
 * calcul.
 *
 * Cinq mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA VALEUR INDÉPENDANTE ET LES COMPARABLES SE CALCULENT. Le plan de la
 *     direction (121 M€) suppose un marché porteur et ignore les points
 *     faibles ; le plan réaliste, actualisé et pondéré par les trois scénarios
 *     du marché laitier, donne 94 M€. Les cessions de laiteries comparables se
 *     sont faites à 8,1 fois l'EBE en médiane, soit 105,3 M€. L'offre de
 *     Nordal est au-dessus de la valeur indépendante et en dessous du marché :
 *     ni à prendre telle quelle, ni à refuser par principe.
 *   · L'AUDIT DE L'ACQUÉREUR TROUVE, OU NON, UN POINT FAIBLE. Une fois sur
 *     deux le stérilisateur de la ligne UHT de Pontivy est en fin de vie, deux
 *     fois sur cinq la station d'épuration de Loudéac doit être mise aux
 *     normes. L'acquéreur qui les découvre demande une baisse supérieure à
 *     leur coût ; un audit vendeur les chiffre d'avance, et la baisse se
 *     négocie sur leur coût réel.
 *   · LA MISE EN CONCURRENCE DISCRÈTE. La coopérative Kérouval fait une offre
 *     selon la préparation du dossier ; Nordal, qui ne participe pas aux
 *     enchères ouvertes et qui a dû céder l'exclusivité, relève son prix face
 *     à un concurrent crédible, jusqu'à ce que ses synergies le permettent.
 *     L'exclusivité signée d'emblée lui ôte toute raison de le faire.
 *   · LE COMPLÉMENT DE PRIX TRANSFÈRE DU RISQUE AU VENDEUR. Un complément
 *     indexé sur l'EBE 2027 dépend du marché laitier et des frais que le
 *     groupe acquéreur imputera à la laiterie : il vaut bien moins que le
 *     prix ferme qu'il remplace. Un complément limité, indexé sur les volumes
 *     que la laiterie maîtrise, peut se défendre ; le prix ferme est le plus
 *     sûr.
 *   · LES PRODUCTEURS PEUVENT NE PAS RENOUVELER. Sans garanties écrites sur la
 *     collecte et la formule de prix, une fois sur deux les producteurs de
 *     l'OP Lait du Méné ne renouvellent pas leurs contrats avec Nordal, et la
 *     clause d'approvisionnement fait baisser le prix. Les écrire coûte un peu
 *     de prix ; c'est en semaine 10 que la menace apparaît, et il faut alors
 *     rouvrir ce qu'on croyait négocié.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Un million d'euros. */
export const M = 1_000_000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : avocats et banquiers facturent l'urgence. */
export const PERTE_PAR_JOUR = 80000;

/* ---------------------------------------------------------------------------
 * LA LAITERIE, TELLE QUE SES COMPTES LA MONTRENT.
 * ------------------------------------------------------------------------- */

export const CA = 185 * M;
/** L'excédent brut d'exploitation du dernier exercice : 7 % du chiffre d'affaires. */
export const EBE = 13 * M;
/** La dette financière nette, reprise par l'acquéreur : le prix des titres en est diminué. */
export const DETTE_NETTE = 16 * M;

/** L'offre de Nordal : 100 % des titres, à 7,5 fois l'EBE, valable six semaines. */
export const OFFRE_MULTIPLE = 7.5;
export const OFFRE = OFFRE_MULTIPLE * EBE;
/** L'offre court jusqu'au vendredi de la semaine 6. */
export const EXPIRATION = 6;

/** Les cessions de laiteries comparables des quatre dernières années, en multiple d'EBE. */
export const COMPARABLES = [
  {
    quoi: "une laiterie de produits frais de Mayenne, rachetée par un groupe laitier",
    annee: 2023,
    multiple: 7.4,
  },
  {
    quoi: "l'activité desserts lactés d'une coopérative du Sud-Ouest, cédée à un industriel",
    annee: 2024,
    multiple: 7.8,
  },
  {
    quoi: "une laiterie spécialisée dans les MDD, dans le Nord, reprise par un fonds",
    annee: 2022,
    multiple: 8.1,
  },
  { quoi: "un fabricant de yaourts de marque régionale, en Auvergne", annee: 2025, multiple: 8.5 },
  {
    quoi: "une marque de yaourts biologiques haut de gamme, très disputée",
    annee: 2024,
    multiple: 10.9,
  },
] as const;

/** La médiane des multiples : celle que l'on retient, parce qu'un cas hors norme ne la déplace pas. */
export function mediane(xs: readonly number[]): number {
  const t = [...xs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
}
export const MULTIPLE_COMPARABLES = mediane(COMPARABLES.map((c) => c.multiple));
/** La valeur d'entreprise au multiple des transactions comparables : ce que la semaine 1 demande. */
export const VE_COMPARABLES = MULTIPLE_COMPARABLES * EBE;

/**
 * LE MARCHÉ LAITIER DES TROIS PROCHAINES ANNÉES, selon la note de conjoncture
 * de l'interprofession : la valeur d'entreprise que donne le plan d'affaires
 * réaliste, actualisé, dans chaque scénario, et l'EBE 2027 qu'il prévoit.
 */
export const SCENARIOS = {
  porteur: { chance: 0.3, ve: 112 * M, ebe2027: 14.8 * M, nom: "porteur" },
  moyen: { chance: 0.45, ve: 97 * M, ebe2027: 13.4 * M, nom: "moyen" },
  degrade: { chance: 0.25, ve: 78 * M, ebe2027: 11.6 * M, nom: "dégradé" },
} as const;
export type Scenario = keyof typeof SCENARIOS;
export const LISTE_SCENARIOS = ["porteur", "moyen", "degrade"] as const;
/** La valeur d'entreprise attendue du plan réaliste, avant les points faibles. */
export const VE_PLAN_REALISTE = LISTE_SCENARIOS.reduce(
  (s, k) => s + SCENARIOS[k].chance * SCENARIOS[k].ve,
  0,
);
/** Le plan de la direction : un marché porteur, aucun point faible, actualisé à 7 %. */
export const PLAN_DIRECTION = 121 * M;

/** Les deux points faibles qu'un audit peut trouver, chacun selon le hasard du trimestre. */
export const POINTS_FAIBLES = {
  /** Le stérilisateur de la ligne UHT n°2 de Pontivy, installé en 1998. */
  ligne: { chance: 0.5, cout: 3.5 * M },
  /** La station d'épuration de Loudéac, aux rejets proches des seuils de l'arrêté préfectoral. */
  station: { chance: 0.4, cout: 2.5 * M },
} as const;
export const COUT_ATTENDU =
  POINTS_FAIBLES.ligne.chance * POINTS_FAIBLES.ligne.cout +
  POINTS_FAIBLES.station.chance * POINTS_FAIBLES.station.cout;
/** La valeur d'entreprise de la laiterie indépendante, points faibles comptés à leur espérance. */
export const VE_INDEPENDANTE = VE_PLAN_REALISTE - COUT_ATTENDU;
/** Ce que valent les titres si la famille garde la laiterie, tel qu'on l'estime en semaine 1. */
export const TITRES_INDEPENDANTE = VE_INDEPENDANTE - DETTE_NETTE;

/**
 * L'APPEL D'OFFRES MDD DE CELTIS POUR 2027 : 8 % des volumes. Gagné quatre
 * fois sur cinq, il ajoute un peu à la valeur indépendante ; perdu, il en ôte
 * davantage. En espérance, le plan réaliste le compte déjà.
 */
export const CELTIS = { chance: 0.8, gain: 0.5 * M, perte: 2 * M } as const;

/** Le Groupe Nordal : ce que ses synergies lui permettent de payer, et ce qu'il a fait ailleurs. */
export const NORDAL = {
  /** Au-delà, il détruirait de la valeur pour lui-même. */
  plafond: 8.5,
  /** Face à une offre concurrente, il passe devant de 0,35 fois l'EBE. */
  surenchere: 0.35,
  /** Seul en lice, s'il relève, c'est à 7,8. */
  relance: 7.8,
  chances: {
    /** Il suit une offre concurrente crédible, dans un second tour discret. */
    suitConcurrent: 0.85,
    /** Seul en lice, prié d'améliorer : il relève, ou il se retire. */
    relanceSeul: 0.35,
    retraitSeul: 0.15,
    /** Il ne participe pas aux enchères ouvertes. */
    retraitEnchere: 0.6,
    /** Sans audit, pas d'offre ferme. */
    retraitAudit: 0.4,
    /** Il accepte de prolonger son offre. */
    prolonge: 0.6,
  },
} as const;

/** La coopérative Kérouval : une offre selon la préparation du dossier. */
export const KEROUVAL = {
  min: 7.6,
  max: 8.1,
  chances: { sondage: 0.55, enchere: 0.65, auditVendeur: 0.2 },
} as const;

/** La baisse demandée après l'audit, en multiple du coût réel des points trouvés. */
export const RETRADE = {
  auditVendeur: 1.3,
  nordal: 1.6,
  coop: 1.4,
  auditPresse: 2,
  /** Refuser toute baisse : l'acquéreur tient son prix, ou se retire. */
  tient: { avecRival: 0.3, seul: 0.2 },
  /** Faire chiffrer les points par un expert indépendant, quand il n'y a pas d'audit vendeur. */
  contreExpertise: { cout: 120000, avecRival: 0.85, seul: 0.65 },
} as const;

/**
 * LA STRUCTURE DU PRIX que l'acquéreur propose au protocole : 2 M€ de plus
 * affichés, dont 6 M€ en complément de prix indexé sur l'EBE 2027 (versé de
 * 0 à 100 % entre 13 et 14,6 M€), contre 4 M€ de prix ferme en moins.
 */
export const STRUCTURE = {
  abandonEBE: 4 * M,
  complementEBE: 6 * M,
  seuilBas: 13 * M,
  seuilHaut: 14.6 * M,
  /** Les frais de groupe que l'acquéreur imputera à la laiterie, et qui réduisent l'EBE mesuré. */
  fraisDeGroupe: { nordal: 0.3 * M, coop: 0.1 * M },
  /** La variante sur les volumes : 2 M€ de ferme en moins, 3 M€ si les volumes 2027 tiennent. */
  abandonVolumes: 2 * M,
  complementVolumes: 3 * M,
} as const;

/** La garantie d'actif et de passif : le passif caché attendu, et ce que le plafond en laisse. */
export const GARANTIE = {
  passifCache: { sansAudit: 1 * M, avecAudit: 0.4 * M },
  /** Plafonnée à 10 % du prix, trois ans, franchise : la moitié de l'appel attendu. */
  plafonnee: 0.5,
} as const;

/** L'OP Lait du Méné : 240 millions de litres, dont 86 chez les producteurs qui menacent. */
export const OP = {
  volume: 240,
  menace: 86,
  /** Le surcoût du lait spot qui remplacerait le leur, en euros les 1 000 litres. */
  surcoutSpot: 40,
  /** Sans garanties écrites, trois fois sur cinq, ils ne renouvellent pas avec Nordal. */
  chance: 0.6,
  /** Avec une prime de fidélité payée par la famille, une fois sur quatre. */
  chancePrime: 0.25,
  /** La clause d'approvisionnement : moins de 90 % du lait sous contrat au 31 décembre. */
  clause: 8 * M,
  /** Ce que Nordal retire du prix pour écrire les garanties et le maintien de l'emploi. */
  garanties: 1.2 * M,
  prime: 1.5 * M,
} as const;

/** Les frais de la cession, et ce que coûtent une enchère ouverte et une data room sans précaution. */
export const FRAIS = {
  conseils: 0.4 * M,
  auditVendeur: 0.35 * M,
  banque: { forfait: 0.3 * M, commission: 0.015 },
  /** L'enchère se sait : producteurs et enseignes s'inquiètent, Celtis en profite. */
  rumeur: 1.2 * M,
  /** Nordal a vu les marges par enseigne et les prix MDD : s'il n'achète pas, il s'en sert. */
  fuite: 1.5 * M,
} as const;

/** La valeur que le conseil attend de la recommandation : au moins 82 M€ pour les titres. */
export const OBJECTIF_VALEUR = 82 * M;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  reponse: 0,
  audit: 1,
  concurrence: 2,
  retrade: 3,
  structure: 4,
  producteurs: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;
/** Les semaines où le trimestre révèle ce qu'il cachait. */
export const REVELE = {
  coop: 4,
  auditVendeur: 4,
  audit: 6,
  protocole: 8,
  lettreOP: 10,
  marche: 12,
  celtis: 12,
  vote: 12,
} as const;

/** Ne rien changer, décision par décision : garder la laiterie, ne rien ouvrir, ne rien négocier. */
export const NEUTRE = [1, 3, 3, 0, 0, 0] as const;

/* ---------------------------------------------------------------------------
 * LES CALCULS DU DIRECTEUR FINANCIER.
 * ------------------------------------------------------------------------- */

/** La part du complément sur l'EBE versée pour un EBE 2027 mesuré donné. */
export const partComplementEBE = (ebe: number) =>
  Math.min(1, Math.max(0, (ebe - STRUCTURE.seuilBas) / (STRUCTURE.seuilHaut - STRUCTURE.seuilBas)));

/** Le complément sur l'EBE versé dans un scénario, après les frais de groupe de l'acquéreur. */
export const complementEBE = (s: Scenario, acquereur: Acquereur) =>
  STRUCTURE.complementEBE *
  partComplementEBE(SCENARIOS[s].ebe2027 - STRUCTURE.fraisDeGroupe[acquereur]);

/** Ce que vaut en espérance le complément sur l'EBE, aux probabilités de la note de conjoncture. */
export const complementEBEAttendu = (acquereur: Acquereur) =>
  LISTE_SCENARIOS.reduce((t, s) => t + SCENARIOS[s].chance * complementEBE(s, acquereur), 0);

/** Le surcoût annuel du lait spot si les producteurs qui menacent partent. */
export const SURCOUT_SPOT_ANNUEL = OP.menace * 1e6 * (OP.surcoutSpot / 1000);

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */

export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce qu'il prend ou rapporte en trésorerie : les titres en sont diminués ou augmentés. */
  tresorerie: number;
  /** Ce qu'il ôte à la valeur de la laiterie indépendante seulement. */
  independante: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "panne",
    titre: "Une conditionneuse cassée à Loudéac",
    de: "Gurvan Kerebel",
    role: "Responsable de production de Loudéac",
    texte:
      "L'arbre de transmission de la conditionneuse de la ligne 3 a cassé : quatre jours d'arrêt, la production reportée sur les lignes 2 et 5 en 3×8. Réparation et ventes perdues : 350 k€.",
    tresorerie: -350000,
    independante: 0,
  },
  {
    id: "taux",
    titre: "La Banque Armorienne relève ses taux",
    de: "Iwan Szymanski",
    role: "Directeur administratif et financier",
    texte:
      "La Banque Armorienne relève ses conditions pour le refinancement de l'an prochain. Pour la laiterie seule, le coût du capital monte d'un quart de point : 2 M€ de moins sur la valeur indépendante. Les acquéreurs, eux, se financent ailleurs.",
    tresorerie: 0,
    independante: -2 * M,
  },
  {
    id: "urssaf",
    titre: "Un redressement de l'URSSAF",
    de: "Maëwenn Postec",
    role: "Directrice des ressources humaines",
    texte:
      "Le contrôle de l'URSSAF se termine : les primes d'équipe de Pontivy auraient dû entrer dans l'assiette des cotisations. Redressement et majorations : 250 k€.",
    tresorerie: -250000,
    independante: 0,
  },
  {
    id: "subvention",
    titre: "Une aide pour la chaudière biomasse",
    de: "Djibril Ouedraogo",
    role: "Responsable énergie et travaux neufs",
    texte:
      "L'agence publique de la transition écologique retient notre dossier de chaudière biomasse pour Loudéac : 300 k€ d'aide, versés à la mise en service.",
    tresorerie: 300000,
    independante: 0,
  },
  {
    id: "froid",
    titre: "Une rupture de la chaîne du froid",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Une semi-remorque des Transports Kerfroid est arrivée à Rennes avec un groupe froid en panne : quatre lots de crème dessert au-dessus de la température. Lots bloqués et détruits, pénalités de Celtis ; le transporteur n'en couvre qu'une partie. Reste à notre charge : 200 k€.",
    tresorerie: -200000,
    independante: 0,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: Scenario;
  ligne: boolean;
  station: boolean;
  /** La coopérative fait-elle une offre, et à quel multiple ? */
  uCoop: number;
  mCoop: number;
  uEnchere: number;
  uAudit: number;
  /** La réponse de Nordal au second tour, ou à la demande de prolongation. */
  uReaction: number;
  /** La réponse de l'acquéreur au refus d'une baisse, ou à la contre-expertise. */
  uRetrade: number;
  uOP: number;
  celtis: boolean;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001177 + 7);
  const us = r();
  const scenario: Scenario =
    us < SCENARIOS.porteur.chance
      ? "porteur"
      : us < SCENARIOS.porteur.chance + SCENARIOS.moyen.chance
        ? "moyen"
        : "degrade";
  const ligne = r() < POINTS_FAIBLES.ligne.chance;
  const station = r() < POINTS_FAIBLES.station.chance;
  const uCoop = r();
  const mCoop = Math.round((KEROUVAL.min + (KEROUVAL.max - KEROUVAL.min) * r()) * 20) / 20;
  const uEnchere = r();
  const uAudit = r();
  const uReaction = r();
  const uRetrade = r();
  const uOP = r();
  const celtis = r() < CELTIS.chance;
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
    ligne,
    station,
    uCoop,
    mCoop,
    uEnchere,
    uAudit,
    uReaction,
    uRetrade,
    uOP,
    celtis,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Le coût réel des points faibles de ce trimestre. */
export const coutReel = (h: Hasard) =>
  (h.ligne ? POINTS_FAIBLES.ligne.cout : 0) + (h.station ? POINTS_FAIBLES.station.cout : 0);

/* ---------------------------------------------------------------------------
 * LA VENTE, TELLE QUE LES DÉCISIONS ET LE HASARD LA DÉROULENT.
 * ------------------------------------------------------------------------- */

export type Acquereur = "nordal" | "coop";

export type ReponseD1 = "exclusivite" | "rejet" | "maintien" | "retrait-enchere" | "reste-enchere";
export type ReponseD3 =
  | "surenchere"
  | "maintien"
  | "retrait"
  | "exclusivite"
  | "prolonge"
  | "caduque"
  | "acceptee"
  | "expiree"
  | "seule-coop"
  | "aucune";
export type ReponseD4 = "aucune" | "accepte" | "tient" | "part" | "chiffre" | "refuse-chiffre";

export interface Offre {
  qui: Acquereur;
  multiple: number;
}

/** Le déroulé de la vente : qui reste en lice, à quel prix, et ce que chacun a répondu. */
export interface Deroule {
  reponseD1: ReponseD1;
  /** Nordal est-il encore en lice après la semaine 2, puis après la semaine 4 ? */
  nordal2: boolean;
  nordal4: boolean;
  /** Nordal a-t-il refusé de poursuivre sans audit ? */
  retraitAudit: boolean;
  /** L'offre de la coopérative, si elle en fait une. */
  coop: number | null;
  /** La chance qu'elle en fasse une, au vu de la préparation. */
  chanceCoop: number;
  reponseD3: ReponseD3;
  /** L'offre retenue après le second tour, et l'autre, encore en lice. */
  retenue: Offre | null;
  rival: Offre | null;
  /** Ce que l'audit trouve, et la baisse que l'acquéreur demande. */
  cout: number;
  demande: number;
  reponseD4: ReponseD4;
  contreExpertise: boolean;
  /** L'acquéreur final, au prix final (en multiple), et la baisse concédée. */
  finale: Offre | null;
  baisse: number;
}

/** La baisse que demande un acquéreur qui a trouvé des points faibles. */
function facteur(qui: Acquereur, chemin: readonly number[]): number {
  if (chemin[D.audit] === 1) return RETRADE.auditVendeur;
  if (qui === "nordal" && chemin[D.audit] === 3) return RETRADE.auditPresse;
  return qui === "nordal" ? RETRADE.nordal : RETRADE.coop;
}

const meilleure = (offres: readonly (Offre | null)[]): Offre | null =>
  offres.reduce<Offre | null>(
    (m, o) => (o && (!m || o.multiple > m.multiple + 1e-9) ? o : m),
    null,
  );

export function derouler(chemin: readonly number[], graine: number): Deroule {
  const h = hasard(graine);
  const [d1, d2, d3, d4] = chemin as [number, number, number, number];

  // Semaine 2 : la réponse à l'offre.
  let reponseD1: ReponseD1;
  let nordal2: boolean;
  if (d1 === 0) [reponseD1, nordal2] = ["exclusivite", true];
  else if (d1 === 1) [reponseD1, nordal2] = ["rejet", false];
  else if (d1 === 2) [reponseD1, nordal2] = ["maintien", true];
  else {
    const part = h.uEnchere < NORDAL.chances.retraitEnchere;
    [reponseD1, nordal2] = [part ? "retrait-enchere" : "reste-enchere", !part];
  }

  // Semaine 4 : l'audit refusé, et l'offre de la coopérative.
  const retraitAudit = nordal2 && d2 === 3 && h.uAudit < NORDAL.chances.retraitAudit;
  const nordal4 = nordal2 && !retraitAudit;
  let chanceCoop = d1 === 2 ? KEROUVAL.chances.sondage : d1 === 3 ? KEROUVAL.chances.enchere : 0;
  if (chanceCoop > 0 && d2 === 1) chanceCoop += KEROUVAL.chances.auditVendeur;
  const coop = h.uCoop < chanceCoop ? h.mCoop : null;
  const offreCoop: Offre | null = coop !== null ? { qui: "coop", multiple: coop } : null;

  // Semaine 5 : le second tour, l'acceptation, la prolongation ou l'expiration.
  let reponseD3: ReponseD3 = "aucune";
  let nordal: number | null = nordal4 ? OFFRE_MULTIPLE : null;
  let retenue: Offre | null = null;
  let rival: Offre | null = null;
  const enLice = () =>
    meilleure([nordal !== null ? { qui: "nordal", multiple: nordal } : null, offreCoop]);
  const autre = (o: Offre | null) =>
    o === null
      ? null
      : o.qui === "nordal"
        ? offreCoop
        : nordal !== null
          ? ({ qui: "nordal", multiple: nordal } as Offre)
          : null;
  if (d1 === 1) {
    reponseD3 = "aucune";
  } else if (d3 === 3) {
    reponseD3 = "expiree";
  } else if (d3 === 0) {
    retenue = enLice();
    reponseD3 = retenue ? "acceptee" : "aucune";
  } else if (d3 === 1) {
    if (nordal !== null && d1 === 0) {
      reponseD3 = "exclusivite";
    } else if (nordal !== null && coop !== null) {
      if (h.uReaction < NORDAL.chances.suitConcurrent) {
        nordal =
          Math.round(Math.min(NORDAL.plafond, Math.max(nordal, coop + NORDAL.surenchere)) * 100) /
          100;
        reponseD3 = "surenchere";
      } else reponseD3 = "maintien";
    } else if (nordal !== null) {
      if (h.uReaction < NORDAL.chances.relanceSeul) {
        nordal = NORDAL.relance;
        reponseD3 = "surenchere";
      } else if (h.uReaction < NORDAL.chances.relanceSeul + NORDAL.chances.retraitSeul) {
        nordal = null;
        reponseD3 = "retrait";
      } else reponseD3 = "maintien";
    } else {
      reponseD3 = coop !== null ? "seule-coop" : "aucune";
    }
    retenue = enLice();
    rival = autre(retenue);
  } else {
    // d3 === 2 : demander une prolongation, sans parler de la coopérative.
    if (nordal !== null) {
      if (d1 === 0 || h.uReaction < NORDAL.chances.prolonge) reponseD3 = "prolonge";
      else {
        nordal = null;
        reponseD3 = "caduque";
      }
    }
    retenue = enLice();
    rival = autre(retenue);
  }
  if (d1 === 0) rival = null;

  // Semaine 6 : l'audit de l'acquéreur ; semaine 7 : la réponse à la baisse demandée.
  const cout = coutReel(h);
  let finale = retenue;
  let baisse = 0;
  let demande = 0;
  let reponseD4: ReponseD4 = "aucune";
  let contreExpertise = false;
  if (retenue && cout > 0) {
    demande = facteur(retenue.qui, chemin) * cout;
    if (d4 === 0) {
      reponseD4 = "accepte";
      baisse = demande;
    } else if (d4 === 1) {
      const tient = rival ? RETRADE.tient.avecRival : RETRADE.tient.seul;
      if (h.uRetrade < tient) {
        reponseD4 = "tient";
        baisse = 0;
      } else {
        reponseD4 = "part";
        finale = rival;
        baisse = rival ? facteur(rival.qui, chemin) * cout : 0;
      }
    } else if (d2 === 1) {
      reponseD4 = "chiffre";
      baisse = cout;
    } else {
      contreExpertise = true;
      const accepte = rival ? RETRADE.contreExpertise.avecRival : RETRADE.contreExpertise.seul;
      if (h.uRetrade < accepte) {
        reponseD4 = "chiffre";
        baisse = cout;
      } else {
        reponseD4 = "refuse-chiffre";
        baisse = demande;
      }
    }
  }

  return {
    reponseD1,
    nordal2,
    nordal4,
    retraitAudit,
    coop,
    chanceCoop,
    reponseD3,
    retenue,
    rival,
    cout,
    demande,
    reponseD4,
    contreExpertise,
    finale,
    baisse,
  };
}

/** Les producteurs renouvellent-ils avec l'acquéreur ? Seul Nordal est menacé, et selon les garanties. */
export function producteursPartent(chemin: readonly number[], graine: number): boolean {
  const dr = derouler(chemin, graine);
  const d6 = chemin[D.producteurs];
  if (dr.finale?.qui !== "nordal" || d6 === 1 || d6 === 3) return false;
  const h = hasard(graine);
  return h.uOP < (d6 === 2 ? OP.chancePrime : OP.chance);
}

/* ---------------------------------------------------------------------------
 * LA VALEUR POUR LES ACTIONNAIRES, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export interface Estimation {
  /** La valeur des titres pour la famille, en euros. */
  valeur: number;
  /** La valeur de la laiterie indépendante (valeur d'entreprise). */
  independante: number;
  /** La meilleure offre en lice, en valeur d'entreprise, baisse connue déduite ; null : aucune. */
  offre: number | null;
  acquereurs: number;
  /** Le lait sous contrat pour l'an prochain, en millions de litres. */
  lait: number;
  /** La voie retenue : 0 indépendante, 1 vente à Nordal, 2 vente à la coopérative, 3 encore ouverte. */
  voie: number;
  /** Les frais engagés. */
  frais: number;
}

/** Ce que l'on sait en fin de semaine w ; le reste est pris à son espérance. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const dr = derouler(chemin, graine);
  const [d1, d2, d3, , d5, d6] = chemin as [number, number, number, number, number, number];
  const dit = (k: number) => w >= EFFET[k]!;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  let tresorerie = 0;
  let surIndependante = 0;
  for (const i of h.imprevus) {
    if (i.semaine <= w) {
      tresorerie += i.imprevu.tresorerie;
      surIndependante += i.imprevu.independante;
    }
  }

  // Ce que la laiterie vaut seule.
  const marche = w >= REVELE.marche;
  const auditVendeurFait = d2 === 1 && dit(D.audit) && w >= REVELE.auditVendeur;
  const auditFait = w >= REVELE.audit && dit(D.concurrence) && dr.retenue !== null;
  const coutConnu = auditVendeurFait || auditFait;
  const cout = coutConnu ? dr.cout : COUT_ATTENDU;
  const veMarche = marche
    ? SCENARIOS[h.scenario].ve + (h.celtis ? CELTIS.gain : -CELTIS.perte)
    : VE_PLAN_REALISTE;
  const independante = veMarche - cout + surIndependante;

  // Les frais engagés, quelle que soit l'issue.
  let fraisCommuns = 0;
  if (d2 === 1 && dit(D.audit)) fraisCommuns += FRAIS.auditVendeur;
  if (d1 === 3 && dit(D.reponse)) fraisCommuns += FRAIS.banque.forfait + FRAIS.rumeur;
  if (dr.contreExpertise && w >= EFFET[D.retrade]) fraisCommuns += RETRADE.contreExpertise.cout;
  const fuite = d2 === 0 && dit(D.audit) ? FRAIS.fuite : 0;

  const engagee = d1 === 0 || (dit(D.concurrence) && d3 !== 3);
  const renonce = dit(D.producteurs) && d6 === 3;
  // Renoncer après avoir engagé la vente : les conseils sont payés quand même.
  const conseilsPerdus = renonce && engagee && derouler(chemin, graine).finale ? FRAIS.conseils : 0;
  const titresIndependante =
    independante - DETTE_NETTE - fraisCommuns - fuite - conseilsPerdus + tresorerie - perte;

  // Les offres en lice cette semaine.
  const offresEnLice: Offre[] = [];
  if (dit(D.reponse) && d1 !== 1) {
    if (w < EFFET[D.concurrence]) {
      const nordal = w >= REVELE.coop ? dr.nordal4 : dr.nordal2;
      if (nordal) offresEnLice.push({ qui: "nordal", multiple: OFFRE_MULTIPLE });
      if (w >= REVELE.coop && dr.coop !== null && d1 !== 0) {
        offresEnLice.push({ qui: "coop", multiple: dr.coop });
      }
    } else if (w < EFFET[D.retrade]) {
      if (dr.retenue) offresEnLice.push(dr.retenue);
      if (dr.rival) offresEnLice.push(dr.rival);
    } else if (dr.finale) {
      offresEnLice.push(dr.finale);
      if (dr.rival && dr.rival.qui !== dr.finale.qui) offresEnLice.push(dr.rival);
    }
  }

  // L'offre que la famille signerait cette semaine, et la baisse qu'on en connaît.
  let cible: Offre | null = null;
  let baisse = 0;
  /** La baisse que l'acquéreur a demandée ou obtenue : celle que l'offre affichée déduit. */
  let baisseConnue = 0;
  if (dit(D.reponse) && d1 !== 1) {
    if (w < EFFET[D.concurrence]) {
      cible = meilleure(offresEnLice);
    } else if (w < EFFET[D.retrade]) {
      cible = dr.retenue;
    } else {
      cible = dr.finale;
    }
    if (cible) {
      if (w >= EFFET[D.retrade]) baisse = baisseConnue = dr.baisse;
      else if (w >= REVELE.audit && dit(D.concurrence)) baisse = baisseConnue = dr.demande;
      else baisse = (dit(D.audit) ? facteur(cible.qui, chemin) : facteur(cible.qui, [])) * cout;
    }
  }

  let titresVente: number | null = null;
  if (cible && !renonce) {
    const prix = cible.multiple * EBE - baisse;
    let structure = 0;
    let garantie =
      (d2 === 1 && dit(D.audit) ? GARANTIE.passifCache.avecAudit : GARANTIE.passifCache.sansAudit) *
      GARANTIE.plafonnee;
    // Les producteurs : la menace apparaît en semaine 10, le vote tombe en semaine 12.
    let producteurs = 0;
    let chanceRenouvellement = 1;
    if (cible.qui === "nordal" && w >= REVELE.lettreOP) {
      let chance: number = OP.chance;
      if (dit(D.producteurs)) {
        if (d6 === 1) chance = 0;
        if (d6 === 2) chance = OP.chancePrime;
        if (d6 === 1) producteurs -= OP.garanties;
        if (d6 === 2) producteurs -= OP.prime;
      }
      const partent = w >= REVELE.vote ? (producteursPartent(chemin, graine) ? 1 : 0) : chance;
      producteurs -= partent * OP.clause;
      chanceRenouvellement = 1 - partent;
    } else if (cible.qui === "coop" && dit(D.producteurs) && d6 === 2) {
      producteurs -= OP.prime;
    }
    if (dit(D.structure)) {
      const passif = d2 === 1 ? GARANTIE.passifCache.avecAudit : GARANTIE.passifCache.sansAudit;
      garantie = passif * (d5 === 0 ? 1 : GARANTIE.plafonnee);
      if (d5 === 0 || d5 === 3) {
        const complement = marche
          ? complementEBE(h.scenario, cible.qui)
          : complementEBEAttendu(cible.qui);
        structure = -STRUCTURE.abandonEBE + complement;
      } else if (d5 === 2) {
        const volumes = w >= REVELE.celtis ? (h.celtis ? 1 : 0) : CELTIS.chance;
        structure =
          -STRUCTURE.abandonVolumes + STRUCTURE.complementVolumes * volumes * chanceRenouvellement;
      }
    }
    const banque = d1 === 3 ? FRAIS.banque.commission * prix : 0;
    const fuiteVente = cible.qui === "nordal" ? 0 : fuite;
    titresVente =
      prix -
      DETTE_NETTE +
      structure +
      producteurs -
      garantie -
      FRAIS.conseils -
      banque -
      fraisCommuns -
      fuiteVente +
      tresorerie -
      perte;
  }

  let valeur: number;
  let voie: number;
  if (titresVente === null) {
    valeur = titresIndependante;
    voie = 0;
  } else if (engagee) {
    valeur = titresVente;
    voie = cible!.qui === "nordal" ? 1 : 2;
  } else {
    valeur = Math.max(titresVente, titresIndependante);
    voie = 3;
  }
  if (!dit(D.reponse)) {
    valeur = titresIndependante;
    voie = 3;
  }

  const partent = w >= REVELE.vote && voie === 1 && producteursPartent(chemin, graine);
  return {
    valeur,
    independante,
    offre: cible && !renonce ? cible.multiple * EBE - baisseConnue : null,
    acquereurs: renonce ? 0 : offresEnLice.length,
    lait: partent ? OP.volume - OP.menace : OP.volume,
    voie,
    frais: fraisCommuns + (titresVente !== null && engagee ? FRAIS.conseils : 0),
  };
}

export type Semaine = {
  /** La valeur des titres pour la famille, estimée en fin de semaine. */
  valeur: number;
  variation: number;
  independante: number;
  offre: number;
  acquereurs: number;
  lait: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur des titres pour la famille, estimée en semaine 13, en euros. */
  objectif: number;
  deroule: Deroule;
  /** La voie finale : 0 indépendante, 1 vente à Nordal, 2 vente à la coopérative. */
  voie: number;
  /** Le prix de la valeur d'entreprise obtenu, baisse déduite ; 0 si la laiterie reste indépendante. */
  prix: number;
  independante: number;
  scenario: Scenario;
  celtis: boolean;
  producteursPartent: boolean;
  /** Le complément de prix finalement dû, en euros. */
  complement: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = TITRES_INDEPENDANTE;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      independante: e.independante,
      offre: e.offre ?? 0,
      acquereurs: e.acquereurs,
      lait: e.lait,
    });
    avant = e.valeur;
    fin = e;
  }
  const dr = derouler(chemin, graine);
  const voie = fin!.voie === 3 ? 0 : fin!.voie;
  const d5 = chemin[D.structure];
  const partent = voie === 1 && producteursPartent(chemin, graine);
  let complement = 0;
  if (voie !== 0 && dr.finale) {
    if (d5 === 0 || d5 === 3) complement = complementEBE(h.scenario, dr.finale.qui);
    if (d5 === 2 && h.celtis && !partent) complement = STRUCTURE.complementVolumes;
  }
  return {
    semaines,
    objectif: fin!.valeur,
    deroule: dr,
    voie,
    prix: voie !== 0 && dr.finale ? dr.finale.multiple * EBE - dr.baisse : 0,
    independante: fin!.independante,
    scenario: h.scenario,
    celtis: h.celtis,
    producteursPartent: partent,
    complement,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, audits, vote, marché, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    reponseD1: dans(EFFET[D.reponse]),
    coop: dans(REVELE.coop),
    auditVendeur: chemin[D.audit] === 1 && dans(REVELE.auditVendeur),
    reponseD3: dans(EFFET[D.concurrence]),
    audit: dans(REVELE.audit),
    reponseD4: dans(EFFET[D.retrade]),
    marche: dans(REVELE.marche),
    vote: dans(REVELE.vote),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureRachat {
  valeur: number | null;
  offre: number | null;
  independante: number | null;
  acquereurs: number | null;
  lait: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  voie: number | null;
  coop: number | null;
  nordal: number | null;
  retenue: number | null;
  retenueCoop: number | null;
  rival: number | null;
  cout: number | null;
  demande: number | null;
  ligne: number | null;
  station: number | null;
  reponseD4: number | null;
  /** L'acquéreur après l'audit : son multiple, s'il s'agit de la coopérative, la baisse concédée. */
  finale: number | null;
  finaleCoop: number | null;
  baisse: number | null;
  /** Nordal s'est-il retiré faute d'audit ? */
  retraitAudit: number | null;
}

export const REPONSES_D4: readonly ReponseD4[] = [
  "aucune",
  "accepte",
  "tient",
  "part",
  "chiffre",
  "refuse-chiffre",
];

/**
 * Ce que Yannig lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRachat {
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      valeur: TITRES_INDEPENDANTE,
      offre: OFFRE,
      independante: VE_INDEPENDANTE,
      acquereurs: 1,
      lait: OP.volume,
      voie: 3,
      coop: null,
      nordal: OFFRE_MULTIPLE,
      retenue: null,
      retenueCoop: null,
      rival: null,
      cout: null,
      demande: null,
      ligne: null,
      station: null,
      reponseD4: null,
      finale: null,
      finaleCoop: null,
      baisse: null,
      retraitAudit: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const dr = t.deroule;
  const vendeur = chemin[D.audit] === 1 && semaine >= REVELE.auditVendeur;
  const audit = semaine >= REVELE.audit && dr.retenue !== null && decisions.length > D.concurrence;
  const connu = vendeur || audit;
  return {
    valeur: s.valeur,
    offre: s.offre > 0 ? s.offre : null,
    independante: s.independante,
    acquereurs: s.acquereurs,
    lait: s.lait,
    voie:
      semaine >= EFFET[D.concurrence]
        ? dr.retenue
          ? dr.retenue.qui === "nordal"
            ? 1
            : 2
          : 0
        : 3,
    coop: semaine >= REVELE.coop ? dr.coop : null,
    nordal:
      semaine >= REVELE.coop
        ? dr.nordal4
          ? OFFRE_MULTIPLE
          : null
        : dr.nordal2
          ? OFFRE_MULTIPLE
          : null,
    retenue: semaine >= EFFET[D.concurrence] && dr.retenue ? dr.retenue.multiple : null,
    retenueCoop:
      semaine >= EFFET[D.concurrence] && dr.retenue ? (dr.retenue.qui === "coop" ? 1 : 0) : null,
    rival: semaine >= EFFET[D.concurrence] && dr.rival ? dr.rival.multiple : null,
    cout: connu ? dr.cout : null,
    demande: audit ? dr.demande : null,
    ligne: connu ? (h.ligne ? 1 : 0) : null,
    station: connu ? (h.station ? 1 : 0) : null,
    reponseD4: semaine >= EFFET[D.retrade] ? REPONSES_D4.indexOf(dr.reponseD4) : null,
    finale: semaine >= EFFET[D.retrade] && dr.finale ? dr.finale.multiple : null,
    finaleCoop:
      semaine >= EFFET[D.retrade] && dr.finale ? (dr.finale.qui === "coop" ? 1 : 0) : null,
    baisse: semaine >= EFFET[D.retrade] ? dr.baisse : null,
    retraitAudit: semaine >= REVELE.coop ? (dr.retraitAudit ? 1 : 0) : null,
  };
}
