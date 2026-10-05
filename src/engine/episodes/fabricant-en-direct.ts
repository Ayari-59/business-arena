/**
 * LE FABRICANT QUI VEND EN DIRECT — le modèle de la riposte d'Arvel
 * Distribution à la plateforme de vente directe de Mérindal.
 *
 * Mérindal, fabricant de menuiseries et de plaques de plâtre, premier
 * fournisseur d'Arvel (10 % de ses achats), ouvre en semaine 3 une plateforme
 * qui vend en direct aux grandes entreprises du bâtiment : des semi-remorques
 * complètes, livrées sur chantier depuis l'usine, payées à trente jours.
 * Séverin Chabrol, directeur de l'offre et des achats, a treize semaines et
 * six décisions pour proposer la riposte au comité de direction.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une riposte stratégique se juge sur des
 * années ; l'épisode dure un trimestre. Le trimestre est donc jugé sur la
 * VALEUR ESTIMÉE EN SEMAINE 13, par rapport au plan d'avant l'annonce :
 *
 *   · le résultat du trimestre : l'écart de marge semaine par semaine
 *     (ce que la plateforme prend, ce que coûtent les remises, ce que
 *     rapportent les services facturés, la marque alternative, la marque
 *     propre), et les dépenses engagées (étude, test, lancements, retraits) ;
 *   · PLUS la valeur des positions prises : l'écart de marge annuel que la
 *     situation de la semaine 13 installe, compté sur deux ans et actualisé
 *     à 9 % (soit 1,76 année de marge) — au-delà, le marché aura changé ;
 *   · recalculée avec ce que le trimestre a révélé : le succès de la
 *     plateforme (connu en semaine 9), la réaction de Mérindal (semaine 8),
 *     les taux de bascule des artisans vers la marque alternative (semaine 9),
 *     l'adoption de la marque propre (semaine 11), la réponse de Mérindal à
 *     l'accord proposé (semaine 12). Avant d'être connue, chaque inconnue est
 *     prise à son espérance.
 *
 * Ne rien faire coûte : la plateforme prend sa part quoi qu'on fasse, et un
 * négociant qui ne réagit pas invite le fabricant à aller plus loin.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA PLATEFORME NE MENACE QU'UNE PARTIE DE LA CLIENTÈLE. Elle ne sert que
 *     des commandes complètes, sans stock de proximité, sans livraison
 *     fractionnée, sans crédit long ni conseil : 60 % de la marge des grands
 *     comptes, 20 % de celle des PME, rien de celle des artisans. Baisser les
 *     prix de tous pour retenir quelques-uns (la cannibalisation) coûte plus
 *     que ce qu'on sauve ; séparer le prix du produit de celui des services,
 *     et faire payer les services à qui s'en sert, protège ce qui peut l'être.
 *   · LA DÉPENDANCE SE CHIFFRE DES DEUX CÔTÉS. Arvel pèse 35 % des ventes de
 *     Mérindal en négoce dans la région, et Mérindal n'a aucun dépôt pour
 *     servir 4 000 artisans ; mais ses menuiseries sont demandées par les
 *     artisans, qui ne changent pas de marque comme de fournisseur. Le
 *     déréférencer pour le punir fait fuir des artisans et leur panier ;
 *     l'ignorer « parce qu'il a besoin de nous » l'invite à étendre la vente
 *     directe. Le pouvoir de négociation vient d'une alternative crédible et
 *     d'une proposition qui sert les deux : un partage des grands comptes.
 *   · LES COÛTS DE CHANGEMENT DÉCIDENT DE CE QUI SE REMPLACE. Les artisans
 *     prennent volontiers une autre marque de fenêtres de série, presque
 *     jamais de sur-mesure (cotes, configurateur, service après-vente) ; une
 *     marque propre marche sur la plaque standard, pas sur la menuiserie. Un
 *     test limité dit ce que les artisans font vraiment ; le plan se révise
 *     sur ses chiffres.
 *
 * Le hasard stratégique : le SCÉNARIO de la plateforme (faible, moyen ou fort
 * succès), la RÉACTION de Mérindal (accord, conflit, extension de la vente
 * directe aux artisans), dont les chances dépendent des choix d'Arvel, et sa
 * RÉPONSE à l'accord proposé en fin de trimestre.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe. */
export const TAUX = 0.09;
/** Une position se compte sur deux ans de marge : au-delà, le marché aura changé. */
export const HORIZON = 2;
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
/** Ce que vaut un euro de marge annuelle installée : deux années actualisées à 9 %. */
export const COEF = annuite(HORIZON, TAUX);
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : les commerciaux de Mérindal visitent nos grands comptes sans réponse de notre part. */
export const PERTE_PAR_JOUR = 5000;
/** Ce que la direction attend : contenir la perte de valeur sous ce montant. */
export const OBJECTIF_VALEUR = -150000;

/* ---------------------------------------------------------------------------
 * LES VENTES DE MÉRINDAL CHEZ ARVEL, PAR TYPE DE CLIENT.
 * ------------------------------------------------------------------------- */

export interface Segment {
  nom: string;
  ca: number;
  taux: number;
  /** La part de la marge faite sur des commandes que la plateforme peut servir. */
  eligible: number;
}

export const SEGMENTS = {
  grandsComptes: { nom: "grands comptes", ca: 5000000, taux: 0.13, eligible: 0.6 },
  pme: { nom: "PME du bâtiment", ca: 4000000, taux: 0.2, eligible: 0.2 },
  artisans: { nom: "artisans", ca: 5000000, taux: 0.27, eligible: 0 },
} as const satisfies Record<string, Segment>;

const marge = (s: Segment) => s.ca * s.taux;
export const MARGES = {
  grandsComptes: marge(SEGMENTS.grandsComptes),
  pme: marge(SEGMENTS.pme),
  artisans: marge(SEGMENTS.artisans),
} as const;
export const CA_MERINDAL = SEGMENTS.grandsComptes.ca + SEGMENTS.pme.ca + SEGMENTS.artisans.ca;
export const MARGE_MERINDAL = MARGES.grandsComptes + MARGES.pme + MARGES.artisans;

/**
 * LA MARGE EXPOSÉE : celle des commandes que la plateforme peut servir. C'est
 * l'estimation que la semaine 1 demande : 60 % de la marge des grands
 * comptes, 20 % de celle des PME, rien de celle des artisans.
 */
export const MARGE_EXPOSEE = (Object.values(SEGMENTS) as Segment[]).reduce(
  (s, x) => s + marge(x) * x.eligible,
  0,
);

/** Les achats d'Arvel chez Mérindal, et tous ses achats. */
export const ACHATS_MERINDAL = CA_MERINDAL - MARGE_MERINDAL;
export const ACHATS_ARVEL = 112000000;
/** Ce qu'Arvel pèse pour Mérindal : ses ventes en négoce dans la région, et ses ventes en France. */
export const VENTES_MERINDAL_REGION = 32000000;
export const VENTES_MERINDAL_FRANCE = 380000000;
/** La remise de fin d'année que Mérindal verse sur les achats, et ce qu'il en retire en cas de conflit. */
export const RFA = { taux: 0.03, retrait: 0.015 } as const;

/* ---------------------------------------------------------------------------
 * LE SUCCÈS DE LA PLATEFORME : trois scénarios, tirés d'avance.
 * ------------------------------------------------------------------------- */

export interface Scenario {
  id: "faible" | "moyen" | "fort";
  nom: string;
  chance: number;
  /** La part de la marge exposée que la plateforme prend à son rythme de croisière. */
  prise: number;
}

export const SCENARIOS: readonly Scenario[] = [
  { id: "faible", nom: "un succès limité", chance: 0.35, prise: 0.2 },
  { id: "moyen", nom: "un succès moyen", chance: 0.45, prise: 0.45 },
  { id: "fort", nom: "un franc succès", chance: 0.2, prise: 0.7 },
];
export const PRISE_ATTENDUE = SCENARIOS.reduce((s, x) => s + x.chance * x.prise, 0);
/** La plateforme ouvre en semaine 3 et atteint son rythme de croisière en semaine 10. */
export const LANCEMENT = 3;
export const CROISIERE = 10;
/** Les premiers chiffres de la plateforme sont publiés en semaine 9. */
export const PREMIERS_CHIFFRES = 9;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS ET CE QU'ELLES CHANGENT.
 * ------------------------------------------------------------------------- */

/** Les décisions, par leur place dans le chemin. */
export const D = {
  posture: 0,
  offre: 1,
  solvane: 2,
  marque: 3,
  deploiement: 4,
  accord: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [1, 3, 5, 7, 10, 12] as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [1, 2, 2, 2, 3, 3] as const;

/**
 * D1 · LA POSTURE. Punir (déréférencer), laisser venir, s'aligner sur les
 * prix de la plateforme, ou défendre ce que le négoce apporte et ouvrir la
 * discussion. Le facteur multiplie la part que prend la plateforme.
 */
export const POSTURE = {
  /** Laisser venir : sans réponse, les commerciaux de Mérindal ont le champ libre. */
  laisser: 1.45,
  /** S'aligner : 5 % de remise sur tout le chiffre des grands comptes et sur les commandes complètes des PME. */
  aligner: { remise: 0.05, facteur: 0.45 },
  /** Défendre et négocier : une étude et un plan de visites des quarante grands comptes. */
  defendre: { cout: 15000 },
  /** Punir : pendant le trimestre, Mérindal démarche nos clients sans retenue. */
  punir: 1.3,
} as const;
export const COUT_ALIGNEMENT =
  POSTURE.aligner.remise * (SEGMENTS.grandsComptes.ca + SEGMENTS.pme.ca * SEGMENTS.pme.eligible);

/**
 * D2 · L'OFFRE AUX GRANDS COMPTES. Les services gratuits pour retenir, le
 * prix du produit séparé de celui des services, rien, ou une remise.
 * `facteur` multiplie la part que prend la plateforme ; `annuel` est l'effet
 * sur la marge, en euros par an.
 */
export const OFFRE = [
  { facteur: 0.85, annuel: -110000 },
  { facteur: 0.6, annuel: 0 },
  { facteur: 1, annuel: 0 },
  { facteur: 0.8, annuel: -105000 },
] as const;
/** Séparer les prix : 3 % de moins sur les commandes complètes, les services facturés à qui s'en sert. */
export const SERVICES = {
  baisseCommandesCompletes: 0.03,
  caCommandesCompletes:
    SEGMENTS.grandsComptes.ca * SEGMENTS.grandsComptes.eligible +
    SEGMENTS.pme.ca * SEGMENTS.pme.eligible,
  /** Livraison fractionnée, stock réservé chantier, crédit au-delà de trente jours : ce qu'ils rapportent facturés. */
  recette: 130000,
  /** Ce que coûtent aujourd'hui les services offerts aux grands comptes, à les étendre gratuitement. */
  gratuits: 110000,
} as const;
export const ANNUEL_SEPARER =
  SERVICES.recette - SERVICES.baisseCommandesCompletes * SERVICES.caCommandesCompletes;
/** L'effet de l'offre sur la marge annuelle ; après un alignement, les commandes complètes sont déjà au prix. */
export const annuelOffre = (posture: number, offre: number) =>
  offre === 1 ? (posture === 2 ? SERVICES.recette : ANNUEL_SEPARER) : OFFRE[offre]!.annuel;
/** La remise de 3 % aux vingt premiers grands comptes. */
export const REMISE_GRANDS_COMPTES = { taux: 0.03, ca: 3500000 } as const;

/** Corbière Bâtiment, le premier grand compte : 1,5 M€ de Mérindal chez nous. */
export const CORBIERE = {
  ca: 1500000,
  taux: 0.13,
  /** S'il part, il emporte aussi le réassort et les petites commandes : la part non éligible de sa marge. */
  horsPlateforme: 0.4,
  semaine: 5,
  /** Ses chances de partir, selon l'offre de la semaine 2. */
  depart: [0.25, 0.35, 0.6, 0.3],
  /** Revenu pour le réassort et les services, s'ils sont proposés à la carte. */
  retour: 0.6,
  semaineRetour: 9,
} as const;
export const PERTE_CORBIERE = CORBIERE.ca * CORBIERE.taux * CORBIERE.horsPlateforme;

/**
 * D3 et D5 · LA MARQUE ALTERNATIVE. Solvane, fabricant savoyard de
 * menuiseries : 7 points de marge de plus que Mérindal sur ce qu'il remplace.
 * Les artisans en changent sur la série, presque jamais sur le sur-mesure.
 */
export const SOLVANE = {
  gain: 0.07,
  test: { cout: 25000, agences: 6, semaines: 4 },
  serie: { ca: 3000000, deploiement: 45000 },
  surMesure: { ca: 2500000, deploiement: 80000, sav: 25000 },
  retrait: 10000,
  /** En dessous de ce taux de bascule, la série ne paie pas son déploiement. */
  seuil: 0.12,
  prolongation: 15000,
  /** Prolonger le test : le déploiement glisse d'un trimestre. */
  decote: 0.85,
  /** Taux de bascule attendus, d'après les négoces qui ont référencé une seconde marque. */
  attenduSerie: 0.25,
  attenduSurMesure: 0.05,
} as const;
/** Ce que la série et le sur-mesure rapportent par an, au taux de bascule donné. */
export const annuelSerie = (s: number) => s * SOLVANE.serie.ca * SOLVANE.gain;
/** La marge que le sur-mesure apporte, avant son service après-vente. */
export const margeSurMesure = (s: number) => s * SOLVANE.surMesure.ca * SOLVANE.gain;
export const annuelSurMesure = (s: number) => margeSurMesure(s) - SOLVANE.surMesure.sav;
/** Ce que vaut chaque déploiement, aux taux attendus : la marge installée moins son coût. */
export const VALEUR_SERIE = annuelSerie(SOLVANE.attenduSerie) * COEF - SOLVANE.serie.deploiement;
export const VALEUR_SUR_MESURE =
  annuelSurMesure(SOLVANE.attenduSurMesure) * COEF - SOLVANE.surMesure.deploiement;

/** D4 · LA MARQUE PROPRE, fabriquée sous contrat ; lancée en semaine 8. */
export const MARQUE = {
  plaques: { ca: 3500000, gain: 0.09, lancement: 60000, attendue: 0.25 },
  menuiseries: { ca: 4000000, gain: 0.08, lancement: 120000, adoption: 0.04 },
  lancement: 8,
  resultats: 11,
} as const;
export const annuelMarquePlaques = (a: number) => a * MARQUE.plaques.ca * MARQUE.plaques.gain;
export const ANNUEL_MARQUE_MENUISERIES =
  MARQUE.menuiseries.adoption * MARQUE.menuiseries.ca * MARQUE.menuiseries.gain;

/**
 * LA RÉACTION DE MÉRINDAL, en semaine 8 : accord (il propose un partage des
 * grands comptes), conflit (il retire un point de remise de fin d'année et
 * pousse sa plateforme), ou extension (il ouvre sa plateforme aux artisans et
 * aux PME l'an prochain).
 */
export type Reaction = "accord" | "conflit" | "extension";
export const SEMAINE_REACTION = 8;
export const CONFLIT = { retrait: RFA.retrait * ACHATS_MERINDAL, poussee: 1.15 } as const;
/** L'extension aux artisans et aux PME : 8 % de la marge des artisans, 12 % de celle des PME hors commandes complètes. */
export const EXTENSION = {
  artisans: 0.08,
  pme: 0.12,
  /** Les services facturés à part protègent une partie de cette clientèle. */
  protection: 0.8,
} as const;
export const PERTE_EXTENSION =
  EXTENSION.artisans * MARGES.artisans + EXTENSION.pme * MARGES.pme * (1 - SEGMENTS.pme.eligible);

/**
 * D6 · L'ACCORD. Complet : le partage des grands comptes, une commission sur
 * les livraisons de la plateforme, et la non-vente aux artisans. Limité : le
 * seul partage des grands comptes. Les chances que Mérindal l'accepte, selon
 * sa réaction de la semaine 8.
 */
export const ACCEPTATION: Record<"complet" | "limite", Record<Reaction, number>> = {
  complet: { accord: 0.7, conflit: 0.4, extension: 0.35 },
  limite: { accord: 0.95, conflit: 0.7, extension: 0.6 },
};
/** Revenir sur un déréférencement : une chance sur trois, une sur deux pour le seul partage. */
export const ACCEPTATION_APRES_RUPTURE = { complet: 0.4, limite: 0.6 } as const;
export const SEMAINE_REPONSE = 12;
/** Le partage : Arvel livre et stocke pour la plateforme dans la région, contre une commission qui rend 35 % de la marge prise. */
export const PARTAGE = 0.35;
/** Sans engagement écrit de non-vente aux artisans, une chance sur trois que Mérindal leur ouvre sa plateforme l'an prochain. */
export const EXTENSION_FUTURE = 0.3;

/**
 * LE DÉRÉFÉRENCEMENT, au 1er janvier : les artisans qui veulent Mérindal
 * partent avec leur panier, des PME suivent, la plateforme prend toutes les
 * commandes complètes ; les marques de remplacement rendent un peu de marge.
 */
export const DEREFERENCEMENT = {
  artisans: 0.15,
  panier: 1.3,
  pme: 0.12,
  grandsComptesHorsPlateforme: 0.25,
  substitution: 150000,
  /** Mérindal assigne une fois sur deux ; les deux affaires passées se sont réglées vers 250 k€. */
  litige: { chance: 0.5, montant: 250000 },
} as const;
export const PERTE_DEREFERENCEMENT =
  DEREFERENCEMENT.artisans * DEREFERENCEMENT.panier * MARGES.artisans +
  DEREFERENCEMENT.pme * MARGES.pme +
  DEREFERENCEMENT.grandsComptesHorsPlateforme *
    MARGES.grandsComptes *
    (1 - SEGMENTS.grandsComptes.eligible) -
  DEREFERENCEMENT.substitution;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce que l'imprévu change à la marge du trimestre, en euros. */
  montant: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "greve",
    titre: "Une semaine de grève des transporteurs",
    de: "Domitille Gendron",
    role: "Cheffe d'agence, Villeurbanne",
    texte:
      "Les transporteurs bloquent les dépôts de carburant depuis lundi : plus un camion d'usine ne roule. Les entreprises viennent se servir dans nos stocks. Semaine exceptionnelle au comptoir : 30 k€ de marge en plus.",
    montant: 30000,
  },
  {
    id: "fermeture",
    titre: "Un négociant concurrent ferme deux agences en Isère",
    de: "Elouan Quiviger",
    role: "Contrôleur de gestion",
    texte:
      "Les Matériaux Pellissard ferment Voiron et Bourgoin. Leurs artisans arrivent chez nous : 40 k€ de marge en plus sur le trimestre.",
    montant: 40000,
  },
  {
    id: "gypse",
    titre: "Mérindal augmente ses plaques de 4 %",
    de: "Noam Riboulet",
    role: "Chef de produit plâtrerie et menuiseries",
    texte:
      "Le gypse et l'énergie ont monté : Mérindal passe ses plaques à +4 % au 1er du mois, comme tous les plâtriers. On ne répercute que la moitié avant janvier : 35 k€ de marge en moins sur le trimestre.",
    montant: -35000,
  },
  {
    id: "impaye",
    titre: "Un grand compte en redressement judiciaire",
    de: "Hélia Marcadet",
    role: "Directrice administrative et financière",
    texte:
      "Les Charpentes Rivolet sont en redressement judiciaire. Notre créance n'est assurée qu'en partie : 45 k€ de perte à passer ce trimestre.",
    montant: -45000,
  },
  {
    id: "logements",
    titre: "Un bailleur social lance 300 logements",
    de: "Domitille Gendron",
    role: "Cheffe d'agence, Villeurbanne",
    texte:
      "Le bailleur de la métropole a attribué ses 300 logements de Vaulx-en-Velin à trois de nos clients. Les premières livraisons partent : 35 k€ de marge en plus sur le trimestre.",
    montant: 35000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart de marge de chaque semaine, en euros, sans lien avec Mérindal (indices 1 à 13). */
  bruit: readonly number[];
  scenario: Scenario;
  /** Le tirage qui décide de la réaction de Mérindal, selon des chances qui dépendent des choix. */
  uReaction: number;
  uCorbiere: number;
  uRetour: number;
  /** Les taux de bascule des artisans vers Solvane : la série, le sur-mesure. */
  serie: number;
  surMesure: number;
  /** L'adoption de la marque propre en plaques. */
  adoption: number;
  uAcceptation: number;
  uLitige: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000381 + 7);
  const us = r();
  const scenario =
    us < SCENARIOS[0]!.chance
      ? SCENARIOS[0]!
      : us < SCENARIOS[0]!.chance + SCENARIOS[1]!.chance
        ? SCENARIOS[1]!
        : SCENARIOS[2]!;
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(2500 * gauss(r), -6000, 6000));
  const uReaction = r();
  const uCorbiere = r();
  const uRetour = r();
  const serie = borne(SOLVANE.attenduSerie + 0.12 * gauss(r), 0.03, 0.55);
  const surMesure = borne(SOLVANE.attenduSurMesure + 0.02 * gauss(r), 0.01, 0.1);
  const adoption = borne(MARQUE.plaques.attendue + 0.1 * gauss(r), 0.03, 0.5);
  const uAcceptation = r();
  const uLitige = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    scenario,
    uReaction,
    uCorbiere,
    uRetour,
    serie,
    surMesure,
    adoption,
    uAcceptation,
    uLitige,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Arvel a-t-il une alternative crédible en semaine 8 : Solvane référencée ou en test, une marque propre ? */
export const levier = (chemin: readonly number[]) =>
  (chemin[D.solvane] === 0 || chemin[D.solvane] === 1 ? 0.3 : 0) +
  (chemin[D.marque] === 0 || chemin[D.marque] === 1 ? 0.1 : 0);

/**
 * Les chances de chaque réaction de Mérindal, selon ce qu'Arvel a montré
 * avant la semaine 8. Mérindal a besoin du négoce pour les artisans : il
 * négocie avec qui propose un partage et peut se passer de lui, il pousse son
 * avantage chez qui ne réagit pas, il riposte contre qui l'attaque.
 */
export function chancesReaction(chemin: readonly number[]): Record<Reaction, number> {
  const p = chemin[D.posture];
  if (p === 0) return { accord: 0, conflit: 0.5, extension: 0.5 };
  const l = levier(chemin);
  const hostile = (chemin[D.solvane] === 0 ? 0.1 : 0) + (chemin[D.marque] === 0 ? 0.05 : 0);
  const base = p === 3 ? { a: 0.45, e: 0.2 } : p === 1 ? { a: 0, e: 0.7 } : { a: 0.05, e: 0.1 };
  const accord = borne(base.a + l - hostile, 0, 1);
  const extension = borne(base.e - l / 2, 0, 1 - accord);
  return { accord, extension, conflit: 1 - accord - extension };
}

export function reaction(chemin: readonly number[], graine: number): Reaction {
  const c = chancesReaction(chemin);
  const u = hasard(graine).uReaction;
  return u < c.accord ? "accord" : u < c.accord + c.extension ? "extension" : "conflit";
}

/** Corbière part-il en semaine 5 ? */
export const corbierePart = (chemin: readonly number[], graine: number) =>
  hasard(graine).uCorbiere < CORBIERE.depart[chemin[D.offre]!]!;
/** Revient-il en semaine 9, pour le réassort et les services à la carte ? */
export const corbiereRevient = (chemin: readonly number[], graine: number) =>
  corbierePart(chemin, graine) && chemin[D.offre] === 1 && hasard(graine).uRetour < CORBIERE.retour;

/** Solvane est-elle encore dans nos agences après la semaine 10 ? */
export function solvanePresente(chemin: readonly number[]): boolean {
  const s = chemin[D.solvane];
  const d = chemin[D.deploiement];
  if (d === 2) return false;
  if (s === 2) return d === 0 || d === 1;
  return true;
}
/** Le sur-mesure de Solvane est-il dans nos agences : une attaque du cœur de Mérindal. */
export const surMesureDeploye = (chemin: readonly number[]) =>
  (chemin[D.solvane] === 0 && (chemin[D.deploiement] === 0 || chemin[D.deploiement] === 3)) ||
  chemin[D.deploiement] === 0;

/** Les chances que Mérindal accepte l'accord proposé en semaine 11 : complet (1) ou limité (2). */
export function chanceAcceptation(chemin: readonly number[], etat: Reaction): number {
  const forme = chemin[D.accord] === 2 ? "limite" : "complet";
  const base =
    chemin[D.posture] === 0 ? ACCEPTATION_APRES_RUPTURE[forme] : ACCEPTATION[forme][etat];
  return borne(
    base +
      (solvanePresente(chemin) ? 0.1 : 0) +
      (chemin[D.marque] === 0 || chemin[D.marque] === 1 ? 0.05 : 0) -
      (surMesureDeploye(chemin) ? 0.15 : 0) -
      (chemin[D.posture] === 1 ? 0.25 : 0),
    0,
    0.98,
  );
}

/** Mérindal signe-t-il l'accord proposé ? */
export const accordAccepte = (chemin: readonly number[], graine: number) =>
  (chemin[D.accord] === 1 || chemin[D.accord] === 2) &&
  hasard(graine).uAcceptation < chanceAcceptation(chemin, reaction(chemin, graine));

/**
 * La rupture est-elle maintenue au 1er janvier ? Déréférencer en semaine 1
 * peut se rattraper en semaine 11, si Mérindal accepte l'accord proposé ;
 * rompre en semaine 11 est définitif.
 */
export function derefere(chemin: readonly number[], graine: number): boolean {
  if (chemin[D.accord] === 0) return true;
  if (chemin[D.posture] !== 0) return false;
  return !accordAccepte(chemin, graine);
}

/** Mérindal assigne-t-il Arvel pour rupture brutale d'une relation commerciale établie ? */
export const litige = (chemin: readonly number[], graine: number) =>
  derefere(chemin, graine) && hasard(graine).uLitige < DEREFERENCEMENT.litige.chance;

/* ---------------------------------------------------------------------------
 * LA VALEUR, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

/** Ce que le trimestre a appris à la fin d'une semaine : le reste est pris à son espérance. */
interface Savoir {
  prise: number;
  reaction: Reaction | null;
  corbiere: boolean | null;
  retour: boolean | null;
  serie: number;
  surMesure: number;
  adoption: number;
  acceptation: boolean | null;
}

/**
 * La situation d'Arvel à l'issue des décisions, en marge annuelle par
 * rapport au plan : ce que la plateforme prend, et chacun des leviers.
 */
export interface Position {
  /** La marge que la plateforme prend, par an. */
  captee: number;
  posture: number;
  offre: number;
  corbiere: number;
  conflit: number;
  /** L'extension de la vente directe aux artisans : décidée, ou à craindre l'an prochain. */
  extension: number;
  solvane: number;
  marque: number;
  dereferencement: number;
  total: number;
  /** Les achats chez Mérindal l'an prochain. */
  achats: number;
  rfa: number;
}

/** La situation installée par un chemin, selon ce qu'on sait ; ce qui ne l'est pas est pesé par sa chance. */
function position(c: readonly number[], s: Savoir): Position {
  const [p, o, sv, m, dp, ac] = c as [number, number, number, number, number, number];
  // L'état de la relation : connu, ou chaque réaction pesée par sa chance.
  const etats: [Reaction, number][] = s.reaction
    ? [[s.reaction, 1]]
    : (Object.entries(chancesReaction(c)) as [Reaction, number][]);
  const propose = ac === 1 || ac === 2;
  let conflit = 0;
  let extension = 0;
  let partage = 0;
  for (const [etat, poids] of etats) {
    const accepte = !propose
      ? 0
      : s.acceptation === null
        ? chanceAcceptation(c, etat)
        : s.acceptation
          ? 1
          : 0;
    partage += poids * accepte;
    // Un accord complet refusé durcit la relation : Mérindal le lit comme une exigence hostile.
    if (etat === "conflit" || (etat === "accord" && ac === 1)) conflit += poids * (1 - accepte);
    // Seul l'accord complet écarte la vente aux artisans ; sans lui, elle reste à craindre.
    const couvert = ac === 1 ? accepte : 0;
    extension += poids * (etat === "extension" ? 1 - couvert : EXTENSION_FUTURE * (1 - couvert));
  }
  // Rupture maintenue : le déréférencement s'applique, quoi qu'ait fait Mérindal.
  const derefere = ac === 0 ? 1 : p === 0 ? 1 - partage : 0;
  const facteur =
    (p === 1 ? POSTURE.laisser : p === 2 ? POSTURE.aligner.facteur : 1) * OFFRE[o]!.facteur;
  let prise = Math.min(1, s.prise * facteur * (1 + (CONFLIT.poussee - 1) * conflit));
  prise = prise * (1 - derefere) + derefere;
  const captee = MARGE_EXPOSEE * prise * (1 - PARTAGE * partage * (1 - derefere));

  const garde = 1 - derefere;
  const posture = p === 2 ? -COUT_ALIGNEMENT * garde : 0;
  const offre = annuelOffre(p, o) * garde;
  const pCorbiere = s.corbiere === null ? CORBIERE.depart[o]! : s.corbiere ? 1 : 0;
  const pRetour =
    s.retour === null ? (o === 1 ? pCorbiere * CORBIERE.retour : 0) : s.retour ? 1 : 0;
  const corbiere = -PERTE_CORBIERE * (pCorbiere - pRetour) * garde;
  const vConflit = -CONFLIT.retrait * conflit * garde;
  const vExtension = -PERTE_EXTENSION * (o === 1 ? EXTENSION.protection : 1) * extension * garde;

  // Solvane : ce qui reste dans les agences à la fin du trimestre.
  const { serie, surMesure } = solvaneEnPlace(c, s.serie);
  // Prolonger le test : la série se déploiera le trimestre suivant, si elle passe le seuil.
  const prolonge =
    sv === 1 && dp === 3
      ? (Math.max(0, annuelSerie(s.serie) * COEF - SOLVANE.serie.deploiement) * SOLVANE.decote) /
        COEF
      : 0;
  const vSolvane =
    (serie ? annuelSerie(s.serie) : 0) + (surMesure ? annuelSurMesure(s.surMesure) : 0) + prolonge;
  const marque =
    (m === 0 || m === 1 ? annuelMarquePlaques(s.adoption) : 0) +
    (m === 0 ? ANNUEL_MARQUE_MENUISERIES : 0);
  const dereferencement = -PERTE_DEREFERENCEMENT * derefere;
  const total =
    -captee +
    posture +
    offre +
    corbiere +
    vConflit +
    vExtension +
    vSolvane +
    marque +
    dereferencement;
  // Les achats chez Mérindal l'an prochain : moins ce que la plateforme prend, ce que Solvane et la marque propre remplacent.
  const repris =
    (serie ? s.serie * SOLVANE.serie.ca : 0) +
    (surMesure ? s.surMesure * SOLVANE.surMesure.ca : 0) +
    (m === 0 || m === 1 ? s.adoption * MARQUE.plaques.ca : 0);
  const achats =
    (ACHATS_MERINDAL -
      prise * SERVICES.caCommandesCompletes * (1 - SEGMENTS.grandsComptes.taux) -
      repris * (1 - SEGMENTS.artisans.taux)) *
    garde;
  return {
    captee,
    posture,
    offre,
    corbiere,
    conflit: vConflit,
    extension: vExtension,
    solvane: vSolvane,
    marque,
    dereferencement,
    total,
    achats,
    rfa: RFA.taux - (conflit > 0.5 ? RFA.retrait : 0),
  };
}

/**
 * Ce que Solvane a en place à la fin du trimestre : la série, le sur-mesure.
 * Déployer « ce que les chiffres ont validé » ne garde la série que si son
 * taux de bascule passe le seuil, et retire le sur-mesure.
 */
export function solvaneEnPlace(
  c: readonly number[],
  serieConnue: number,
): { serie: boolean; surMesure: boolean } {
  const sv = c[D.solvane];
  const dp = c[D.deploiement];
  if (dp === 2) return { serie: false, surMesure: false };
  if (sv === 0) {
    // Tout est déjà dans les agences : on garde, ou on retire le sur-mesure.
    return { serie: true, surMesure: dp !== 1 };
  }
  if (sv === 1) {
    if (dp === 0) return { serie: true, surMesure: true };
    if (dp === 1) return { serie: serieConnue >= SOLVANE.seuil, surMesure: false };
    return { serie: false, surMesure: false };
  }
  // Rien n'a été référencé : on déploie à l'aveugle, ou rien.
  if (dp === 0) return { serie: true, surMesure: true };
  if (dp === 1) return { serie: true, surMesure: false };
  return { serie: false, surMesure: false };
}

/** Les dépenses engagées, semaine par semaine : études, test, lancements, retraits. */
function depenses(c: readonly number[], s: Savoir, w: number): number {
  const [p, , sv, m, dp] = c as [number, number, number, number, number, number];
  let x = 0;
  if (w === EFFET[D.posture] && p === 3) x -= POSTURE.defendre.cout;
  if (w === EFFET[D.solvane]) {
    if (sv === 1) x -= SOLVANE.test.cout;
    if (sv === 0) x -= SOLVANE.serie.deploiement + SOLVANE.surMesure.deploiement;
  }
  if (w === EFFET[D.marque]) {
    if (m === 0 || m === 1) x -= MARQUE.plaques.lancement;
    if (m === 0) x -= MARQUE.menuiseries.lancement;
  }
  if (w === EFFET[D.deploiement]) {
    const avant = sv === 0;
    const { serie, surMesure } = solvaneEnPlace(c, s.serie);
    if (avant) {
      if (!surMesure) x -= SOLVANE.retrait;
      if (!serie) x -= SOLVANE.retrait;
    } else {
      if (serie) x -= SOLVANE.serie.deploiement;
      if (surMesure) x -= SOLVANE.surMesure.deploiement;
      if (sv === 1 && dp === 3) x -= SOLVANE.prolongation;
    }
  }
  return x;
}

export type Semaine = {
  /** La valeur estimée en fin de semaine, par rapport au plan d'avant l'annonce, en euros. */
  valeur: number;
  variation: number;
  /** La marge que la plateforme prend cette semaine-là, au rythme annuel. */
  captee: number;
  /** L'écart de marge cumulé du trimestre, par rapport au plan, dépenses comprises. */
  ecart: number;
  /** La part de Mérindal dans les achats d'Arvel, projetée sur l'an prochain. */
  dependance: number;
  rfa: number;
  /** L'écart de marge annuel installé, tel qu'on l'estime en fin de semaine. */
  annuel: number;
};

/** Ce que l'on sait à la fin de la semaine w. */
function savoir(chemin: readonly number[], graine: number, w: number): Savoir {
  const h = hasard(graine);
  return {
    prise: w >= PREMIERS_CHIFFRES ? h.scenario.prise : PRISE_ATTENDUE,
    reaction: w >= SEMAINE_REACTION ? reaction(chemin, graine) : null,
    corbiere: w >= CORBIERE.semaine ? corbierePart(chemin, graine) : null,
    retour: w >= CORBIERE.semaineRetour ? corbiereRevient(chemin, graine) : null,
    serie: w >= PREMIERS_CHIFFRES ? h.serie : SOLVANE.attenduSerie,
    surMesure: w >= PREMIERS_CHIFFRES ? h.surMesure : SOLVANE.attenduSurMesure,
    adoption: w >= MARQUE.resultats ? h.adoption : MARQUE.plaques.attendue,
    acceptation: w >= SEMAINE_REPONSE ? accordAccepte(chemin, graine) : null,
  };
}

/** Les décisions en vigueur en fin de semaine w : les autres comptent comme « ne rien changer ». */
const enVigueur = (chemin: readonly number[], w: number) =>
  NEUTRE.map((n, k) => (w >= EFFET[k]! ? (chemin[k] ?? n) : n));

/** Mérindal est-il en conflit avec Arvel pendant la semaine w ? */
function enConflit(chemin: readonly number[], graine: number, w: number): boolean {
  if (w < SEMAINE_REACTION) return false;
  const etat = reaction(chemin, graine);
  const resolu = w >= SEMAINE_REPONSE && accordAccepte(chemin, graine);
  const durci = etat === "accord" && chemin[D.accord] === 1 && w >= SEMAINE_REPONSE;
  return (etat === "conflit" || durci) && !resolu;
}

/**
 * La marge que la plateforme prend pendant la semaine w, au rythme annuel :
 * elle monte de son ouverture (semaine 3) à son rythme de croisière
 * (semaine 10) ; l'accord signé en rend une part par la commission.
 */
export function captureRealisee(chemin: readonly number[], graine: number, w: number): number {
  const h = hasard(graine);
  const c = enVigueur(chemin, w);
  const [p, o] = c as [number, number];
  const rampe = Math.min(1, Math.max(0, (w - LANCEMENT + 1) / (CROISIERE - LANCEMENT + 1)));
  const facteur =
    (p === 0 ? POSTURE.punir : p === 1 ? POSTURE.laisser : p === 2 ? POSTURE.aligner.facteur : 1) *
    OFFRE[o]!.facteur *
    (enConflit(chemin, graine, w) ? CONFLIT.poussee : 1);
  const signe = w >= SEMAINE_REPONSE && accordAccepte(chemin, graine);
  return (
    MARGE_EXPOSEE * Math.min(1, h.scenario.prise * rampe * facteur) * (signe ? 1 - PARTAGE : 1)
  );
}

/**
 * L'écart de marge réalisé pendant la semaine w, au rythme annuel : ce qui
 * est déjà en place cette semaine-là, avec les vraies valeurs du hasard.
 */
function realiseAnnuel(chemin: readonly number[], graine: number, w: number): number {
  const h = hasard(graine);
  const c = enVigueur(chemin, w);
  const [p, o, sv, m, dp] = c as [number, number, number, number, number, number];
  let x = -captureRealisee(chemin, graine, w);
  if (p === 2) x -= COUT_ALIGNEMENT;
  x += annuelOffre(p, o);
  if (w >= CORBIERE.semaine && corbierePart(chemin, graine)) {
    if (!(w >= CORBIERE.semaineRetour && corbiereRevient(chemin, graine))) x -= PERTE_CORBIERE;
  }
  if (enConflit(chemin, graine, w)) x -= CONFLIT.retrait;
  if ((sv === 0 && w >= EFFET[D.solvane]) || w >= EFFET[D.deploiement]) {
    const { serie, surMesure } = solvaneEnPlace(c, h.serie);
    if (serie) x += annuelSerie(h.serie);
    if (surMesure) x += annuelSurMesure(h.surMesure);
  }
  if (sv === 1 && w >= EFFET[D.solvane] && (w < EFFET[D.deploiement] || dp === 3)) {
    // Le test : six agences sur trente.
    x += (annuelSerie(h.serie) * SOLVANE.test.agences) / 30;
  }
  if ((m === 0 || m === 1) && w >= MARQUE.lancement) x += annuelMarquePlaques(h.adoption);
  if (m === 0 && w >= MARQUE.lancement) x += ANNUEL_MARQUE_MENUISERIES;
  return x;
}

export interface Estimation {
  valeur: number;
  ecart: number;
  position: Position;
}

/** La valeur estimée en fin de semaine w : le trimestre réalisé, plus la position installée. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  let ecart = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  for (let k = 1; k <= w; k += 1) {
    const c = enVigueur(chemin, k);
    ecart += realiseAnnuel(chemin, graine, k) / 52 + h.bruit[k]!;
    ecart += depenses(c, savoir(chemin, graine, k), k);
    for (const i of h.imprevus) if (i.semaine === k) ecart += i.imprevu.montant;
  }
  const c = enVigueur(chemin, w);
  const s = savoir(chemin, graine, w);
  const pos = position(c, s);
  // Le litige pour rupture brutale : à son espérance tant que la rupture n'est pas confirmée.
  const rompt = c[D.posture] === 0 || c[D.accord] === 0;
  const vLitige =
    -DEREFERENCEMENT.litige.montant *
    (w >= SEMAINE_REPONSE
      ? litige(chemin, graine)
        ? 1
        : 0
      : rompt
        ? DEREFERENCEMENT.litige.chance
        : 0);
  return { valeur: ecart + COEF * pos.total + vLitige, ecart, position: pos };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur estimée en semaine 13, par rapport au plan d'avant l'annonce, en euros. */
  objectif: number;
  scenario: Scenario;
  reaction: Reaction;
  chances: Record<Reaction, number>;
  corbiere: "reste" | "parti" | "revenu";
  serie: number;
  surMesure: number;
  adoption: number;
  /** L'accord proposé en fin de trimestre : accepté, refusé, ou pas proposé. */
  accord: "complet" | "limite" | "refuse" | "rompu" | "aucun";
  litige: boolean;
  derefere: boolean;
  position: Position;
  /** L'écart de marge du trimestre, dépenses comprises. */
  ecart: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    const achatsTotaux = ACHATS_ARVEL - (ACHATS_MERINDAL - e.position.achats) * 0.25;
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      captee: captureRealisee(chemin, graine, w),
      ecart: e.ecart,
      dependance: e.position.achats / achatsTotaux,
      rfa: e.position.rfa,
      annuel: e.position.total,
    });
    avant = e.valeur;
    fin = e;
  }
  const part = corbierePart(chemin, graine);
  const ac = chemin[D.accord];
  const accepte = accordAccepte(chemin, graine);
  return {
    semaines,
    objectif: fin!.valeur,
    scenario: h.scenario,
    reaction: reaction(chemin, graine),
    chances: chancesReaction(chemin),
    corbiere: !part ? "reste" : corbiereRevient(chemin, graine) ? "revenu" : "parti",
    serie: h.serie,
    surMesure: h.surMesure,
    adoption: h.adoption,
    accord:
      ac === 0
        ? "rompu"
        : ac === 1 || ac === 2
          ? accepte
            ? ac === 1
              ? "complet"
              : "limite"
            : "refuse"
          : "aucun",
    litige: litige(chemin, graine),
    derefere: derefere(chemin, graine),
    position: fin!.position,
    ecart: fin!.ecart,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    lancement: dans(LANCEMENT),
    litige: chemin[D.posture] === 0 && dans(4),
    corbiere: dans(CORBIERE.semaine),
    reaction: dans(SEMAINE_REACTION),
    chiffres: dans(PREMIERS_CHIFFRES),
    retour: dans(CORBIERE.semaineRetour) && corbiereRevient(chemin, graine),
    marque: (chemin[D.marque] === 0 || chemin[D.marque] === 1) && dans(MARQUE.resultats),
    reponse: dans(SEMAINE_REPONSE),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureFabricant {
  valeur: number | null;
  captee: number | null;
  ecart: number | null;
  dependance: number | null;
  rfa: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  prise: number | null;
  reaction: number | null;
  corbiere: number | null;
  serie: number | null;
  surMesure: number | null;
  adoption: number | null;
}

const REACTIONS: readonly Reaction[] = ["accord", "conflit", "extension"];
export const reactionParCode = (n: number | null | undefined): Reaction | null =>
  n == null || n < 0 ? null : (REACTIONS[n] ?? null);

/**
 * Ce que Séverin lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureFabricant {
  const h = hasard(graine);
  if (semaine === 0) {
    return {
      valeur: 0,
      captee: 0,
      ecart: 0,
      dependance: ACHATS_MERINDAL / ACHATS_ARVEL,
      rfa: RFA.taux,
      prise: null,
      reaction: -1,
      corbiere: -1,
      serie: null,
      surMesure: null,
      adoption: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    valeur: s.valeur,
    captee: s.captee,
    ecart: s.ecart,
    dependance: s.dependance,
    rfa: s.rfa,
    prise: semaine >= PREMIERS_CHIFFRES ? h.scenario.prise : null,
    reaction: semaine >= SEMAINE_REACTION ? REACTIONS.indexOf(t.reaction) : -1,
    corbiere:
      semaine >= CORBIERE.semaineRetour && t.corbiere === "revenu"
        ? 2
        : semaine >= CORBIERE.semaine && t.corbiere !== "reste"
          ? 1
          : semaine >= CORBIERE.semaine
            ? 0
            : -1,
    serie: semaine >= PREMIERS_CHIFFRES ? h.serie : null,
    surMesure: semaine >= PREMIERS_CHIFFRES ? h.surMesure : null,
    adoption: semaine >= MARQUE.resultats ? h.adoption : null,
  };
}
