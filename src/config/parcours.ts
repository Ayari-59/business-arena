/**
 * Parcours par diplôme : l'alignement du jeu sur les référentiels (le pont
 * notions ↔ pratique, en DONNÉES — jamais en dur). Chaque parcours propose
 * des réglages de création conseillés et la correspondance bloc par bloc
 * entre le programme et ce que les équipes vivent dans l'arène.
 */

export interface ParcoursBloc {
  /** Intitulé du bloc/processus/thème du référentiel. */
  referentiel: string;
  /** Notions du programme mobilisées. */
  notions: string;
  /** Où et comment on le vit dans le jeu. */
  enJeu: string;
  /** Adéquation honnête : cœur du jeu, bien couvert, ou partiel. */
  fit: "coeur" | "couvert" | "partiel";
}

export interface Parcours {
  code: string;
  name: string;
  fullName: string;
  emoji: string;
  pitch: string;
  recommended: {
    level: number;
    levelName: string;
    periodicity: "month" | "quarter" | "year";
    periodicityLabel: string;
    vat: boolean;
    notes: string;
  };
  blocs: ParcoursBloc[];
  /** Limite assumée, affichée telle quelle (crédibilité > promesse). */
  limite?: string;
}

export const PARCOURS: readonly Parcours[] = [
  {
    code: "stmg",
    name: "STMG",
    fullName: "Bac technologique STMG · Sciences de gestion et numérique · Management",
    emoji: "🎓",
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
    blocs: [
      {
        referentiel: "Création de valeur et performance",
        notions: "chiffre d'affaires, coûts, marge, seuil de rentabilité, performance commerciale",
        enJeu:
          "Tours 1-2 : fixer un prix face à SoundBox, lire son premier compte de résultat, découvrir le seuil dans la situation dédiée, puis suivre sa part de marché et son BPI.",
        fit: "coeur",
      },
      {
        referentiel: "Temps et risque",
        notions: "trésorerie, délais de paiement, risque, assurance",
        enJeu:
          "Tour 4 : la crise de trésorerie (clients qui paient à 60 j). Cartes événements et arbitrage de l'assurance catastrophe : un coût certain contre un risque incertain.",
        fit: "coeur",
      },
      {
        referentiel: "De l'individu à l'acteur (management)",
        notions: "motivation, rémunération, décision collective",
        enJeu:
          "Le jeu se joue en équipe : chaque décision est un arbitrage collectif. La rémunération et la motivation se vivent au niveau Arbitrage (RH) pour les groupes avancés.",
        fit: "couvert",
      },
      {
        referentiel: "Numérique et intelligence collective",
        notions: "outils numériques, information et décision",
        enJeu:
          "Les KPI, graphiques et classements de l'arène sont l'information de gestion : apprendre à les lire, c'est le cours.",
        fit: "couvert",
      },
    ],
  },
  {
    code: "mco",
    name: "BTS MCO",
    fullName: "BTS Management Commercial Opérationnel",
    emoji: "🛍️",
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
    blocs: [
      {
        referentiel: "Animer et dynamiser l'offre commerciale",
        notions: "politique de prix, élasticité, prix psychologiques, communication commerciale",
        enJeu:
          "Chaque tour : arbitrer prix et budget marketing face à des segments à élasticités différentes, avec seuils psychologiques, sans oublier les cartes marché qui rebattent la demande.",
        fit: "coeur",
      },
      {
        referentiel: "Assurer la gestion opérationnelle",
        notions: "marges, seuil de rentabilité, budget de trésorerie, BFR, gestion des stocks, TVA",
        enJeu:
          "Le cœur du jeu : compte de résultat, stocks au CUMP, délais clients/fournisseurs, crise de trésorerie du tour 4, TVA à décaisser dans le BFR.",
        fit: "coeur",
      },
      {
        referentiel: "Manager l'équipe commerciale",
        notions: "recrutement, formation, rémunération, motivation",
        enJeu:
          "Niveau Arbitrage : embaucher (effet au tour suivant), former (productivité), fixer l'indice de salaire : sous-payer démotive et fait démissionner.",
        fit: "coeur",
      },
      {
        referentiel: "Développer la relation client et assurer la vente conseil",
        notions: "connaissance client, fidélisation",
        enJeu:
          "La fidélité par segment (part de marché passée) et la qualité perçue récompensent la constance : la relation client comme actif, pas comme slogan.",
        fit: "partiel",
      },
    ],
  },
  {
    code: "ndrc",
    name: "BTS NDRC",
    fullName: "BTS Négociation et Digitalisation de la Relation Client",
    emoji: "🤝",
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
    blocs: [
      {
        referentiel: "Relation client et négociation-vente",
        notions: "construction de l'offre, marge, prix plancher, conditions de paiement",
        enJeu:
          "Le coût variable unitaire et le seuil de rentabilité donnent le prix plancher ; les délais clients (30-80 j) montrent ce qu'une condition de paiement coûte réellement en trésorerie.",
        fit: "coeur",
      },
      {
        referentiel: "Relation client et animation de réseaux",
        notions: "part de marché, veille concurrentielle, animation commerciale",
        enJeu:
          "Observer SoundBox et Auris, réagir aux cartes marché, défendre sa part segment par segment, et le mode championnat pour animer la section.",
        fit: "couvert",
      },
      {
        referentiel: "Relation client à distance et digitalisation",
        notions: "outils digitaux, données clients",
        enJeu:
          "Les tableaux de bord et KPI de l'arène servent de terrain de lecture de données : le jeu n'est pas un CRM simulé.",
        fit: "partiel",
      },
    ],
    limite:
      "Business Arena entraîne la culture économique et gestionnaire du négociateur, pas les techniques d'entretien de vente ni les outils CRM, qui restent à votre main en cours.",
  },
  {
    code: "cg",
    name: "BTS CG",
    fullName: "BTS Comptabilité et Gestion",
    emoji: "🧮",
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
    blocs: [
      {
        referentiel: "P1 · Contrôle et traitement comptable des opérations commerciales",
        notions: "créances clients, dettes fournisseurs, délais de paiement",
        enJeu:
          "Créances et dettes TTC calculées chaque tour à partir des délais réels (clients 30-80 j, fournisseurs 22 j) : le poste s'explique au lieu de s'apprendre.",
        fit: "coeur",
      },
      {
        referentiel: "P3 · Gestion des obligations fiscales",
        notions: "TVA collectée, TVA déductible, TVA à décaisser, crédit de TVA, IS",
        enJeu:
          "La mécanique TVA du moteur : résultat rigoureusement HT, flux TTC, dette « TVA à décaisser » payée le tour suivant, et son poids dans le BFR. L'IS se module à la création.",
        fit: "coeur",
      },
      {
        referentiel: "P5 · Analyse et prévision de l'activité",
        notions: "coûts partiels, seuil de rentabilité, marge sur coût variable, prévisions",
        enJeu:
          "Le seuil recalculé chaque tour avec VOS charges de structure ; les situations « choisir le bon modèle » (CVP, coûts pertinents, analyse marginale) notées sur la pertinence du choix ; enfin l'atelier VAN/TRI qui se déclenche quand l'atelier sature : investir, sous-traiter ou renoncer, par le calcul.",
        fit: "coeur",
      },
      {
        referentiel: "P6 · Analyse de la situation financière",
        notions: "bilan fonctionnel, FRNG, BFR, trésorerie nette, ratios",
        enJeu:
          "L'invariant affiché partout : TN = FRNG − BFR. La crise du tour 4 le rend inoubliable, le débriefing le formalise, le BPI le note sur la durée.",
        fit: "coeur",
      },
      {
        referentiel: "P4 · Gestion des relations sociales",
        notions: "masse salariale, coût du travail",
        enJeu:
          "Le bloc RH (niveau Arbitrage) : masse salariale, coût d'un recrutement, d'un licenciement, d'une politique salariale, côté gestion et non côté paie réglementaire.",
        fit: "partiel",
      },
    ],
  },
];

export const parcoursByCode = new Map(PARCOURS.map((p) => [p.code, p]));
