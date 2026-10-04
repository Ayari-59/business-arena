/**
 * LE TRIMESTRE QUI DÉRAPE — le contenu de l'épisode.
 *
 * Claire Morel, cheffe de l'agence de Lyon d'Arvel Distribution, a un
 * trimestre pour redresser une transformation des devis qui décroche. Cinq
 * décisions, chacune précédée de ce qu'un manager reçoit vraiment : des
 * messages, des alertes, et des vérifications qui coûtent du temps.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit, pour dire si la décision a
 * été prise en connaissance de cause.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */

export type IdDiagnostic = "prix" | "karim" | "livraison" | "motivation";

export const DIAGNOSTICS: readonly { id: IdDiagnostic; t: string }[] = [
  { id: "prix", t: "Nos prix ne sont plus compétitifs" },
  { id: "karim", t: "Les clients de Karim ne sont plus suivis depuis son arrêt" },
  { id: "livraison", t: "Un concurrent livre plus vite que nous" },
  { id: "motivation", t: "L'équipe commerciale est démotivée" },
];

/** Ce que les messages d'une étape lisent du tableau de bord au moment où ils arrivent. */
export interface Contexte {
  transfo4: string;
  marge: string;
  dso: string;
  ecart: number;
  ecartTxt: string;
}

export interface Message {
  de: string;
  role: string;
  heure?: string;
  alerte?: boolean;
  texte: string;
}

export interface Source {
  id: string;
  titre: string;
  /** En jours ; seul le temps de la semaine 1 est compté. */
  cout: number;
  nature: "decisive" | "utile" | "bruit" | "aide";
  resultat: string;
}

export interface Option {
  t: string;
  d: string;
  remise?: boolean;
}

export interface Etape {
  moment: string;
  titre: string;
  /** La dernière semaine que la décision couvre. */
  jusqua: number;
  messages: (ctx: Contexte) => Message[];
  budget?: number;
  sources: readonly Source[];
  diagnostic?: boolean;
  prevision?: boolean;
  reevaluation?: boolean;
  question: string;
  options: readonly Option[];
  /** Les réponses du terrain à chaque option ; `null` quand elles dépendent du hasard (Delta). */
  reactions: readonly (Message[] | null)[];
}

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La transformation décroche",
    jusqua: 4,
    messages: () => [
      {
        de: "Tableau de bord commercial",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Taux de transformation des devis : 33,6 % la semaine dernière, contre 38 % il y a un mois.",
      },
      {
        de: "Marc Delorme",
        role: "Directeur régional",
        heure: "08:12",
        texte:
          "Claire, ta transformation a perdu plus de 4 points en trois semaines. On fait le point vendredi : je veux ton analyse et ce que tu décides.",
      },
      {
        de: "Sophie Martin",
        role: "Administration des ventes",
        heure: "09:40",
        texte:
          "Pour info, le dépôt régional a encore pris du retard dans la préparation cette semaine.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "detail",
        titre: "Détail par commercial",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La baisse se concentre sur deux portefeuilles : celui de Karim (moins 11 points), en arrêt maladie depuis trois semaines et dont personne ne suit les devis, et celui de Julie (moins 4 points). Les cinq autres commerciaux sont stables.",
      },
      {
        id: "appel",
        titre: "Appeler un client perdu",
        cout: 1,
        nature: "decisive",
        resultat:
          "M. Ferreira, plaquiste à Villeurbanne : « Rien contre vos prix. Brico-Pro Rhône me livre le lendemain, chez vous c'est trois jours. Sur un chantier, je ne peux pas attendre. »",
      },
      {
        id: "prix",
        titre: "Comparer vos prix à la concurrence",
        cout: 1,
        nature: "bruit",
        resultat:
          "Sur les 40 références les plus vendues, vos prix sont à 1,5 % près ceux de Brico-Pro Rhône. Aucun écart n'explique une perte de clients.",
      },
      {
        id: "adv",
        titre: "Faire le point avec l'administration des ventes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Depuis la réorganisation du dépôt régional, la préparation prend 48 heures au lieu de 24. Vos clients sont livrés en trois jours en moyenne.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Marc",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Marc : « Avant de toucher aux prix, regarde où ça décroche exactement. Une moyenne cache toujours quelque chose. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Remise de 5 % sur les grands comptes",
        d: "Pour regagner les affaires perdues. Coûte 5 points de marge sur ce segment.",
        remise: true,
      },
      {
        t: "Réaffecter le portefeuille de Karim",
        d: "Ses 38 comptes répartis entre Julie et Thomas jusqu'à son retour.",
      },
      {
        t: "Lancer une campagne de prospection",
        d: "Deux jours par commercial pour trouver de nouveaux clients.",
      },
      { t: "Attendre la fin du mois", d: "Une baisse sur trois semaines peut être passagère." },
    ],
    reactions: [
      [
        {
          de: "Achats, Groupe Delta",
          role: "Grand compte",
          texte:
            "Nous avons bien noté la remise de 5 %. Pouvez-vous l'étendre à nos trois filiales ?",
        },
        {
          de: "Julie Roux",
          role: "Commerciale, secteur Est",
          texte: "Les grands comptes signent un peu plus, mais mes artisans continuent de partir.",
        },
      ],
      [
        {
          de: "Julie Roux",
          role: "Commerciale, secteur Est",
          texte:
            "Je reprends douze comptes de Karim. Ça fait beaucoup, mais trois devis en attente ont déjà été relancés.",
        },
        {
          de: "Thomas Petit",
          role: "Commercial, secteur Centre",
          texte:
            "Les clients de Karim étaient contents qu'on les rappelle. Deux m'ont dit qu'ils commandaient chez Brico-Pro faute de nouvelles.",
        },
      ],
      [
        {
          de: "Thomas Petit",
          role: "Commercial, secteur Centre",
          texte:
            "Quatorze rendez-vous de prospection pris. En revanche, on a moins de temps pour les clients actuels.",
        },
      ],
      [
        {
          de: "Marc Delorme",
          role: "Directeur régional",
          texte: "Tu attends quoi exactement ? Je ne vois rien bouger.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les artisans veulent être livrés demain",
    jusqua: 7,
    messages: (ctx: Contexte) => [
      {
        de: "Tableau de bord commercial",
        role: "Point hebdomadaire",
        heure: "08:00",
        alerte: false,
        texte: `Transformation des devis en semaine 4 : ${ctx.transfo4}. Marge brute depuis le début du trimestre : ${ctx.marge}.`,
      },
      {
        de: "Ferreira Plâtrerie",
        role: "Client artisan",
        heure: "10:05",
        texte: "Trois de mes collègues m'ont demandé si vous livrez enfin sous 24 heures.",
      },
      {
        de: "Sophie Martin",
        role: "Administration des ventes",
        heure: "11:20",
        texte:
          "Le dépôt propose un créneau de livraison garantie le lendemain aux agences qui le demandent. Il y a un coût logistique.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "j1",
        titre: "Coût du créneau de livraison le lendemain",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le dépôt garantit la livraison le lendemain contre 1 point de coût logistique sur les commandes des grands comptes et des artisans.",
      },
      {
        id: "stock",
        titre: "Stock disponible à l'agence",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'agence a en stock 70 % des références courantes des artisans. Le retrait sous 2 heures est possible, mais peu de clients le savent.",
      },
    ],
    question: "Comment répondez-vous au délai de livraison ?",
    options: [
      {
        t: "Garantir la livraison le lendemain",
        d: "Créneau négocié avec le dépôt. Coûte 1 point de marge sur les grands comptes et les artisans.",
      },
      {
        t: "Faire connaître le retrait en agence sous 2 heures",
        d: "Campagne auprès des artisans. Ne coûte rien, ne change rien pour les grands comptes.",
      },
      {
        t: "S'aligner par une remise de 3 %",
        d: "Sur les grands comptes et les artisans, pour compenser le délai.",
        remise: true,
      },
      { t: "Ne rien changer", d: "Le dépôt finira par résorber son retard." },
    ],
    reactions: [
      [
        {
          de: "Achats, Groupe Delta",
          role: "Grand compte",
          texte: "La livraison le lendemain change tout pour nos chantiers. Merci.",
        },
      ],
      [
        {
          de: "Ferreira Plâtrerie",
          role: "Client artisan",
          texte:
            "Je ne savais pas que vous aviez tout ça en stock. Je passe chercher demain matin.",
        },
      ],
      [
        {
          de: "Contrôle de gestion",
          role: "Direction financière",
          texte:
            "La remise de 3 % pèse sur la marge de l'agence, et vos clients demandent toujours quand ils seront livrés.",
        },
      ],
      [
        {
          de: "Julie Roux",
          role: "Commerciale, secteur Est",
          texte: "Encore deux chantiers perdus pour un délai de livraison.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Vos clients paient de plus en plus tard",
    jusqua: 9,
    messages: (ctx: Contexte) => [
      {
        de: "Contrôle de gestion",
        role: "Direction financière",
        heure: "09:15",
        alerte: true,
        texte: `Le délai de paiement de vos clients est passé de 52 à ${ctx.dso} jours. Au-delà de 55 jours, le coût du financement est refacturé à l'agence en fin de trimestre : 1 500 € par jour.`,
      },
      {
        de: "Comptabilité, Groupe Delta",
        role: "Grand compte",
        heure: "14:30",
        texte:
          "Nos factures du mois seront réglées à 75 jours, comme pour nos autres fournisseurs.",
      },
    ],
    sources: [
      {
        id: "balance",
        titre: "Balance âgée des créances",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "62 % des retards viennent de quatre grands comptes. Les artisans paient à l'heure.",
      },
    ],
    question: "Que faites-vous des retards de paiement ?",
    options: [
      {
        t: "Relancer les impayés de plus de 45 jours",
        d: "Les commerciaux s'en chargent : un peu moins de temps pour vendre.",
      },
      {
        t: "Proposer un escompte de 2 % pour paiement à 10 jours",
        d: "Aux grands comptes. Environ six sur dix devraient l'accepter.",
      },
      {
        t: "Bloquer les comptes en retard",
        d: "Plus de livraison tant que l'arriéré n'est pas réglé.",
      },
      { t: "Ne rien faire", d: "Les grands comptes paient tard, mais ils paient." },
    ],
    reactions: [
      [
        {
          de: "Julie Roux",
          role: "Commerciale, secteur Est",
          texte: "On relance, mais ça prend du temps sur les rendez-vous.",
        },
      ],
      [
        {
          de: "Comptabilité, Groupe Delta",
          role: "Grand compte",
          texte: "L'escompte nous intéresse : nous réglerons désormais à 10 jours.",
        },
      ],
      [
        {
          de: "Achats, Groupe Delta",
          role: "Grand compte",
          texte: "Bloquer nos livraisons ? Nous allons revoir nos volumes avec vous.",
        },
      ],
      [
        {
          de: "Contrôle de gestion",
          role: "Direction financière",
          texte: "Le délai continue de monter. La pénalité tombera en fin de trimestre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Delta demande 8 %",
    jusqua: 11,
    messages: () => [
      {
        de: "Achats, Groupe Delta",
        role: "Grand compte",
        heure: "10:00",
        alerte: false,
        texte:
          "Nous pouvons vous passer une commande supplémentaire de 40 000 € d'ici la fin du trimestre, contre 8 % de remise sur l'ensemble de nos commandes jusque-là.",
      },
      {
        de: "Karim Benali",
        role: "Commercial",
        heure: "16:45",
        texte: "Bonne nouvelle : je reprends lundi.",
      },
    ],
    sources: [
      {
        id: "poids",
        titre: "Le poids de Delta dans votre chiffre",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Delta pèse 20 % du chiffre des grands comptes, environ 6 500 € par semaine, à 26 % de marge. La remise s'appliquerait aussi à ces commandes-là.",
      },
    ],
    question: "Que répondez-vous à Delta ?",
    options: [
      {
        t: "Accepter les 8 %",
        d: "40 000 € de plus à 18 % de marge, et 8 % de remise sur les commandes habituelles de Delta.",
      },
      {
        t: "Contre-proposer 4 %",
        d: "Même commande, remise réduite. Delta accepte environ une fois sur deux.",
      },
      { t: "Refuser", d: "Delta pourrait réduire ses commandes : environ trois chances sur dix." },
    ],
    reactions: [
      [
        {
          de: "Achats, Groupe Delta",
          role: "Grand compte",
          texte:
            "Commande de 40 000 € confirmée. La remise de 8 % s'applique dès la semaine prochaine.",
        },
      ],
      null,
      null,
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Deux semaines pour finir",
    jusqua: 13,
    messages: (ctx: Contexte) => [
      {
        de: "Marc Delorme",
        role: "Directeur régional",
        heure: "08:30",
        alerte: true,
        texte:
          ctx.ecart > 0
            ? `Il te manque ${ctx.ecartTxt} par rapport à l'objectif de chiffre d'affaires à date. Deux semaines pour finir. Je compte sur toi.`
            : "Tu es au-dessus de l'objectif de chiffre d'affaires à date. Ne lâche rien sur la marge pour les deux dernières semaines.",
      },
      {
        de: "Julie Roux",
        role: "Commerciale, secteur Est",
        heure: "11:10",
        texte:
          "Une quinzaine de devis d'artisans dorment depuis plus de trois semaines. On pourrait les relancer.",
      },
    ],
    sources: [],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Remise de 5 % sur tout pour finir",
        d: "Deux semaines, tous les clients. Fait du chiffre tout de suite.",
        remise: true,
      },
      {
        t: "Relancer tous les devis en attente des artisans",
        d: "Toute l'équipe au téléphone pendant deux semaines.",
      },
      { t: "Ne rien changer", d: "Le trimestre se finira où il doit." },
    ],
    reactions: [
      [
        {
          de: "Thomas Petit",
          role: "Commercial, secteur Centre",
          texte:
            "Les commandes affluent. Plusieurs clients avancent des achats qu'ils prévoyaient au trimestre prochain.",
        },
      ],
      [
        {
          de: "Julie Roux",
          role: "Commerciale, secteur Est",
          texte: "Six devis signés sur les relances, sans remise.",
        },
      ],
      [
        {
          de: "Marc Delorme",
          role: "Directeur régional",
          texte: "Le trimestre se termine sans surprise.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Diagnostic d'abord", chemin: [1, 0, 1, 1, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 2] },
  { nom: "Réflexe remise", chemin: [0, 2, 1, 0, 0] },
] as const;

/** Les options qui répondent à une difficulté par une remise générale : [décision, option]. */
export const REMISES_REFLEXES = [
  [0, 0],
  [1, 2],
  [4, 0],
] as const;

/** Les réponses de Delta, qui dépendent du hasard du trimestre. */
export const REPONSES_DE_DELTA = {
  accepte: "Nous acceptons 4 %. La commande de 40 000 € est confirmée.",
  refuseContreProposition:
    "4 %, ce n'est pas assez. Nous gardons nos commandes habituelles, sans supplément.",
  reduit: "Nous réduisons de moitié nos commandes chez vous jusqu'à la fin du trimestre.",
  maintient: "Nous prenons acte et maintenons nos commandes habituelles.",
} as const;
