/**
 * Parcours par diplôme : l'alignement du jeu sur les référentiels (le pont
 * notions ↔ pratique, en DONNÉES — jamais en dur). Chaque parcours propose
 * des réglages de création conseillés et une limite assumée.
 *
 * LA CORRESPONDANCE BLOC PAR BLOC N'EST PLUS ICI : elle se dérive du déroulé
 * des séances, pour les treize ateliers et non plus pour quatre diplômes
 * (src/config/couverture.ts). Les phrases qui disaient ce qui se joue
 * vraiment y ont été déplacées, pas recopiées.
 */

export interface Parcours {
  code: string;
  name: string;
  fullName: string;
  pitch: string;
  /**
   * Les ateliers écrits pour ce diplôme.
   *
   * Sans ce lien, rien ne dit qu'un atelier est DÉJÀ servi par un parcours, et
   * la page ne sait pas quelles filières lui restent à citer — elle se
   * contentait d'en nommer quatre, et sa bande finale invitait BUT GEA et DCG
   * à écrire alors que les deux ont un atelier publié.
   */
  ateliers: readonly string[];
  recommended: {
    level: number;
    levelName: string;
    periodicity: "month" | "quarter" | "year";
    periodicityLabel: string;
    vat: boolean;
    notes: string;
  };
  /** Limite assumée, affichée telle quelle (crédibilité > promesse). */
  limite?: string;
}

export const PARCOURS: readonly Parcours[] = [
  {
    code: "stmg",
    ateliers: ["stmg"],
    name: "STMG",
    fullName:
      "Bac technologique STMG · Sciences de gestion et numérique · Management",
    pitch:
      "Découvrir la création de valeur en la vivant : une entreprise, des décisions simples, et les notions de première qui prennent corps tour après tour.",
    recommended: {
      level: 2,
      levelName: "Gestion",
      periodicity: "quarter",
      periodicityLabel: "Un trimestre par tour",
      vat: false,
      notes:
        "Tous les indices disponibles ; qualité et maintenance ouvertes, finance masquée. Une séance = un tour + son débriefing.",
    },
  },
  {
    code: "mco",
    ateliers: ["mco", "mco2"],
    name: "BTS MCO",
    fullName: "BTS Management Commercial Opérationnel",
    pitch:
      "La gestion opérationnelle d'une unité commerciale, en vrai : offre, prix, marges, trésorerie, et le management d'équipe au niveau Arbitrage.",
    recommended: {
      level: 3,
      levelName: "Pilotage",
      periodicity: "quarter",
      periodicityLabel: "Un trimestre par tour",
      vat: true,
      notes:
        "TVA activée (gestion courante réelle). Passez au niveau 4 · Arbitrage en seconde année pour ouvrir le bloc RH.",
    },
  },
  {
    code: "ndrc",
    ateliers: ["ndrc", "fitness"],
    name: "BTS NDRC",
    fullName: "BTS Négociation et Digitalisation de la Relation Client",
    pitch:
      "La culture gestion du négociateur : savoir jusqu'où descendre en prix, lire une marge, comprendre les délais de paiement, pour négocier en connaissant ses chiffres.",
    recommended: {
      level: 2,
      levelName: "Gestion",
      periodicity: "month",
      periodicityLabel: "Un mois par tour",
      vat: false,
      notes:
        "Rythme mensuel court, idéal en séances rapprochées. Le championnat inter-équipes fait une excellente animation de section.",
    },
    limite:
      "Business Arena entraîne la culture économique et gestionnaire du négociateur, pas les techniques d'entretien de vente ni les outils CRM, qui restent à votre main en cours.",
  },
  {
    code: "cg",
    ateliers: ["cg1"],
    name: "BTS CG",
    fullName: "BTS Comptabilité et Gestion",
    pitch:
      "Les processus du référentiel, produits par une vraie entreprise : chaque tour génère un compte de résultat, un bilan équilibré au centime, une TVA à décaisser, à analyser et non à recopier.",
    recommended: {
      level: 4,
      levelName: "Arbitrage",
      periodicity: "quarter",
      periodicityLabel: "Un trimestre par tour",
      vat: true,
      notes:
        "TVA 20 % activée, IS modulable dans les paramètres économiques (comparez 15 % / 25 % / 33 % entre deux parties). RH ouverte (paie et charges).",
    },
  },
];

export const parcoursByCode = new Map(PARCOURS.map((p) => [p.code, p]));
