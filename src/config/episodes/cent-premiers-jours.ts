/**
 * LES CENT PREMIERS JOURS — le contenu de l'épisode.
 *
 * Thibaut Arnal prend la direction de l'agence Arvel Distribution de
 * Meyzieu. Il arrive de Dijon, où son plan avait marché ; son prédécesseur,
 * apprécié de tous, vient de partir à la retraite ; son adjoint espérait le
 * poste. L'équipe observe le nouveau venu, la direction attend des résultats.
 * Six décisions, chacune précédée de ce qu'un directeur reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "irritants",
    t: "L'agence perd des chantiers et des artisans sur deux problèmes que l'équipe connaît : des devis qui attendent quatre jours, un comptoir saturé le matin",
  },
  {
    id: "comptoir",
    t: "Le comptoir est saturé le matin : un poste en panne fait repartir les artisans",
  },
  {
    id: "prix",
    t: "Les prix de l'agence sont trop hauts face au négoce d'en face",
  },
  {
    id: "habitudes",
    t: "L'équipe vit sur les habitudes de l'ancien directeur : l'agence est à réorganiser",
  },
] as const;

const VINCENT = {
  de: "Gérard Rabier",
  role: "Directeur régional des agences",
} as const;
const CHRISTOPHE = {
  de: "Christophe Rambaud",
  role: "Adjoint, ventes chantier",
} as const;
const AICHA = { de: "Amina Ouarab", role: "Vendeuse comptoir" } as const;
const JOSE = { de: "José Carvalho", role: "Chef de dépôt" } as const;
const LINH = { de: "Thao Vo", role: "Commerciale terrain" } as const;
const EMILIE = { de: "Axelle Peyrol", role: "Assistante commerciale" } as const;
const GESTION = {
  de: "Contrôle de gestion",
  role: "Direction régionale",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Votre premier lundi",
    jusqua: 3,
    messages: () => [
      {
        ...VINCENT,
        heure: "07:50",
        alerte: true,
        texte:
          "Bienvenue à Meyzieu, Thibaut. L'agence tient son chiffre, sans plus : 25 k€ de marge par semaine, quand le budget en attend 27. Premier point avec moi en semaine 3, et j'attends des résultats avant l'été.",
      },
      {
        ...CHRISTOPHE,
        heure: "08:15",
        texte:
          "Bonjour. Le planning de la semaine est sur ton bureau, j'ai tenu l'agence depuis le départ de Jean-Paul. Si tu as besoin, tu sais où me trouver.",
      },
      {
        ...AICHA,
        heure: "09:40",
        texte:
          "On se demande tous ce que vous allez changer. À Dijon, il paraît que vous avez tout réorganisé ?",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comptoir",
        titre: "Passer deux matinées au comptoir, dès 6 h 30",
        cout: 1,
        nature: "decisive",
        resultat:
          "À 6 h 30, une quarantaine d'artisans passent prendre des commandes préparées la veille : ils les ont envoyées par SMS à Amina ou à José avant 18 heures. Ces « bons de la veille » font 38 % des ventes du comptoir, et c'est la première raison que les artisans donnent pour venir ici plutôt qu'en face. À 7 h 15, en revanche, l'attente monte à 18 minutes : un des deux postes du comptoir est en panne depuis quatre mois, et deux artisans repartent sans rien sous vos yeux.",
      },
      {
        id: "devis",
        titre: "Lire les devis de chantier des trois derniers mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'agence répond aux devis de chantier en 4,5 jours en moyenne, contre 2 dans les meilleures agences de la région ; elle en signe un sur trois, contre 40 % là-bas. Tous les devis de plus de 5 000 € passent par Christophe, seul. Neuf ont été perdus ce trimestre, faute de réponse à temps.",
      },
      {
        id: "prix",
        titre: "Comparer les prix de l'agence à ceux du négoce d'en face",
        cout: 1,
        nature: "bruit",
        resultat:
          "Sur cinquante références courantes, l'agence est en moyenne 0,8 % plus chère : un peu moins sur l'outillage, un peu plus sur la plaque de plâtre. Rien qui explique un artisan perdu.",
      },
      {
        id: "christophe",
        titre: "Déjeuner avec Christophe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Christophe a dix-neuf ans de maison et pensait avoir le poste. Il ne le dit pas, il le laisse entendre. Il connaît chaque gros client par son prénom, fait seul tous les devis de chantier et finit à 20 heures. « Jean-Paul me laissait faire. Je suppose que ça va changer. »",
      },
      {
        id: "chevrier",
        titre: "Appeler Jean-Paul Chevrier, votre prédécesseur",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Jean-Paul : « Regarde l'agence à 6 h 30 avant de la regarder dans les tableaux. Et ne juge pas Christophe sur ses premières semaines : il est vexé, pas mauvais. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment commencez-vous ?",
    options: [
      {
        t: "Présenter dès ce matin votre plan en dix points, celui qui a marché à Dijon",
        d: "Réunion de toute l'équipe à 11 heures. Chacun sait tout de suite où vous allez.",
      },
      {
        t: "Écouter d'abord : un entretien avec chacun des quinze, des matinées au comptoir et au dépôt, des visites de clients",
        d: "Trois semaines, en commençant par Christophe. Rien ne change d'ici là ; la direction attendra.",
      },
      {
        t: "Réunir l'équipe et lancer un questionnaire anonyme sur ce qui marche et ce qui ne marche pas",
        d: "Une heure de réunion, des réponses dans dix jours.",
      },
      {
        t: "Laisser Christophe gérer le quotidien le temps de prendre vos marques",
        d: "Vous observez depuis votre bureau, sans rien bousculer.",
      },
    ],
    reactions: [
      [
        {
          ...AICHA,
          texte:
            "Ouverture à 7 heures, commandes par application, dépôt rangé par familles… On travaille autrement depuis vingt ans. Vous êtes venu voir comment on fait, au moins ?",
        },
        { ...CHRISTOPHE, texte: "C'est noté." },
      ],
      [
        {
          ...CHRISTOPHE,
          texte:
            "Une heure et demie d'entretien, et tu as surtout écouté. Jean-Paul ne m'avait jamais demandé ce que je ferais à sa place.",
        },
        {
          ...JOSE,
          texte: "Vous êtes le premier directeur que je vois au dépôt à 6 h 30.",
        },
      ],
      [
        {
          ...LINH,
          texte:
            "Le questionnaire est rempli. Les gens ont été prudents : on ne vous connaît pas encore.",
        },
      ],
      [
        {
          ...AICHA,
          texte: "On ne voit pas beaucoup le nouveau directeur. Christophe dit que c'est normal.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le premier point avec la direction",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...VINCENT,
        heure: "09:00",
        alerte: true,
        texte: `Thibaut, trois semaines déjà. Marge de la semaine : ${ctx.marge}, pour un budget de 27 k€. Qu'est-ce que tu lances ?`,
      },
      ctx.ecoute
        ? {
            ...AICHA,
            heure: "10:30",
            texte:
              "Dans vos entretiens, presque tout le monde vous a parlé du poste en panne. Si vous ne deviez faire qu'une chose…",
          }
        : {
            ...AICHA,
            heure: "10:30",
            texte:
              "Le second poste du comptoir est toujours en panne. Plus personne n'en parle, on a pris l'habitude.",
          },
      {
        ...GESTION,
        heure: "14:00",
        texte:
          "Pour information : les heures majorées de l'ouverture à 6 h 30 coûtent 900 € par semaine. L'agence de Dijon ouvre à 7 heures.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "irritants",
        titre: "Demander à l'équipe ce qui la gêne le plus au quotidien",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.ecoute
            ? "Sur quinze entretiens, onze citent d'abord le second poste du comptoir, en panne depuis quatre mois : à 7 h 15, les artisans attendent 18 minutes, et certains repartent. Un poste neuf, une douchette et un comptoir express pour les bons de la veille : 2 500 €, une semaine d'installation."
            : "Les réponses sont prudentes. Trois personnes finissent par citer le second poste du comptoir, en panne depuis quatre mois. Un poste neuf, une douchette et un comptoir express : 2 500 €.",
      },
      {
        id: "majorations",
        titre: "Regarder ce que rapportent les heures de 6 h 30",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les 900 € d'heures majorées servent à préparer les bons de la veille d'une quarantaine d'artisans réguliers : 38 % des ventes du comptoir. À Dijon, les clients commandaient par l'application ; ici, sept artisans sur dix ont plus de cinquante ans et commandent par SMS.",
      },
    ],
    question: "Que lancez-vous en premier ?",
    options: [
      {
        t: "Régler le poste du comptoir, puisque c'est ce que l'équipe signale",
        d: "Un poste neuf, une douchette et un comptoir express pour les bons de la veille. 2 500 €, en place la semaine prochaine.",
      },
      {
        t: "Aligner les horaires sur Dijon : ouverture à 7 heures, fin des bons préparés la veille",
        d: "900 € d'heures majorées économisées chaque semaine. Une note de service lundi.",
      },
      {
        t: "Promettre à l'équipe un comptoir rénové et un renfort pour l'été",
        d: "Annoncé ce soir en réunion. Vous demanderez le budget à la direction régionale ensuite.",
      },
      {
        t: "Attendre d'avoir une vue complète avant de toucher à quoi que ce soit",
        d: "Rien ne change. Vous dites à la direction que le diagnostic arrive.",
      },
    ],
    reactions: [
      [
        {
          ...AICHA,
          texte:
            "Deux postes qui marchent, et le comptoir express pour les bons. Ce matin, personne n'a attendu plus de dix minutes. Au comptoir, ils n'en reviennent pas.",
        },
      ],
      [
        {
          ...JOSE,
          alerte: true,
          texte:
            "Note reçue. Lundi, les artisans de 6 h 30 vont trouver porte close et rien de préparé. Je vous préviens : ils ne vont pas aimer.",
        },
      ],
      null,
      [
        {
          ...VINCENT,
          texte:
            "Je comprends qu'il faut du temps. Mais en semaine 8, il me faudra autre chose qu'un diagnostic.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Christophe",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...LINH,
        heure: "10:20",
        alerte: true,
        texte:
          "Thibaut, je préfère vous le dire avant que ça se sache : Christophe a accordé hier 12 % de remise à l'entreprise Gauthier sans vous en parler, et il dit au comptoir que « de toute façon, le nouveau ne connaît pas les clients ».",
      },
      {
        ...EMILIE,
        heure: "11:05",
        texte: `Délai moyen de réponse aux devis de chantier : ${ctx.delai}. Christophe en a quatorze sur son bureau.`,
      },
    ],
    sources: [
      {
        id: "equipe",
        titre: "Demander à José et Amina ce qu'ils pensent de Christophe",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Amina : « Il pensait avoir le poste, il a tenu l'agence trois mois sans qu'on le remercie. Mais c'est lui qui connaît les clients, et il le sait. Donnez-lui quelque chose de vrai à porter, pas un titre. »${
            ctx.ecoute
              ? " José ajoute : « Il a apprécié que vous le receviez en premier. Il ne vous le dira pas. »"
              : " José ajoute : « Il attend de voir si vous comptez sur lui ou pas. »"
          }`,
      },
      {
        id: "portefeuille",
        titre: "Regarder le portefeuille de Christophe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Christophe suit les vingt plus gros clients chantier de l'agence : 60 % des ventes de chantier. S'il partait, une partie le suivrait. Thao, commerciale terrain depuis deux ans, a déjà chiffré quelques devis avec lui.",
      },
    ],
    question: "Que faites-vous avec Christophe ?",
    options: [
      {
        t: "Lui confier le pôle chantiers, avec un vrai mandat et Thao en binôme à former, et l'annoncer à l'équipe",
        d: "Il décide des devis et des remises chantier dans un cadre écrit. Formation de Thao : 1 500 €. Il peut refuser.",
      },
      {
        t: "Le recadrer : rappeler qui dirige et lui retirer la validation des remises",
        d: "Un entretien formel lundi, une note à l'équipe. Les choses sont claires.",
      },
      {
        t: "Le ménager : lui laisser le quotidien et ne pas toucher à son périmètre",
        d: "Pas de vague. Il continue de gérer comme pendant l'intérim.",
      },
      {
        t: "Lui accorder une prime exceptionnelle pour son intérim",
        d: "3 000 €, versés à la fin du mois, avec vos remerciements.",
      },
    ],
    reactions: [
      [
        {
          ...CHRISTOPHE,
          texte:
            "Le pôle chantiers… Je ne m'y attendais pas. Laisse-moi le week-end, je te réponds lundi.",
        },
      ],
      [
        {
          ...CHRISTOPHE,
          texte: "Bien reçu. Je ferai ce qu'on me demande, ni plus ni moins.",
        },
        {
          ...AICHA,
          texte: "Au comptoir, ça jase. Christophe a dix-neuf ans de maison, quand même.",
        },
      ],
      [
        {
          ...LINH,
          texte:
            "Les gros clients continuent d'appeler Christophe pour tout. On ne sait plus très bien qui décide.",
        },
      ],
      [
        {
          ...CHRISTOPHE,
          texte: "Merci pour la prime. Ce n'est pas ce que j'attendais, mais merci.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "La direction veut un plan",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...VINCENT,
        heure: "08:30",
        alerte: true,
        texte: `Thibaut, le comité régional est mardi. J'ai besoin de ton plan, et de quelque chose qui se voie sur la marge avant l'été. L'agence est à ${ctx.ecart}.`,
      },
      {
        ...GESTION,
        heure: "10:00",
        texte: ctx.veille
          ? "Si vous cherchez des économies rapides : l'intérimaire du dépôt coûte 900 € par semaine, les heures majorées de 6 h 30 autant."
          : "Si vous cherchez des économies rapides : l'intérimaire du dépôt coûte 900 € par semaine.",
      },
      ...(ctx.ecoute
        ? [
            {
              ...AICHA,
              heure: "15:40",
              texte:
                "Dans vos entretiens, trois choses revenaient : les devis qui traînent, le comptoir du matin, et les artisans partis sans que personne ne les rappelle.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "dijon",
        titre: "Comparer Meyzieu et votre ancienne agence de Dijon",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "À Dijon, 60 % des commandes arrivaient par l'application, et les clients étaient surtout des entreprises de dix salariés et plus. Ici, ce sont des artisans seuls ou à deux, qui passent à l'aube avant le chantier. Le plan de Dijon a été construit pour une autre clientèle.",
      },
      {
        id: "perdus",
        titre: "Lister les artisans partis depuis un an",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Vingt-trois artisans ne viennent plus. Personne ne les a rappelés. Ceux que Thao a pu joindre citent l'attente du matin et des devis arrivés trop tard ; aucun ne parle des prix.",
      },
    ],
    question: "Quel plan présentez-vous au comité ?",
    options: [
      {
        t: "Un plan construit avec l'équipe : devis sous 48 heures, relance des artisans perdus, comptoir du matin, un chantier à la fois",
        d: "Ce que l'équipe a elle-même identifié. Formation et relances : 2 500 €. Des effets progressifs.",
      },
      {
        t: "Le plan de Dijon, complet et d'un coup : application de commande, dépôt rangé par familles, ouverture à 7 heures, objectifs individuels",
        d: "4 000 € de mise en place. Un plan éprouvé, des résultats annoncés en six semaines.",
      },
      {
        t: "Des économies tout de suite : fin de l'intérimaire du dépôt et des heures de 6 h 30",
        d: "Jusqu'à 1 800 € économisés par semaine, visibles dès le prochain point.",
      },
      {
        t: "Pas de plan avant d'avoir tout compris : l'agence tourne, on verra au prochain trimestre",
        d: "Vous présentez votre diagnostic au comité, sans engagement.",
      },
    ],
    reactions: [
      [
        {
          ...LINH,
          texte:
            "On a fait la liste des artisans perdus. J'en ai rappelé huit cette semaine ; trois sont déjà repassés.",
        },
      ],
      [
        {
          ...JOSE,
          alerte: true,
          texte:
            "On range le dépôt par familles. Les gars cherchent tout, les préparations prennent le double de temps, et les artisans de 6 h 30 trouvent porte close.",
        },
      ],
      [
        {
          ...JOSE,
          texte: "Sans l'intérimaire, on ne prépare plus les bons du matin. On fait ce qu'on peut.",
        },
      ],
      [{ ...VINCENT, texte: "Le comité a pris note. Il attendait un plan." }],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "La résidence des Peupliers",
    jusqua: 11,
    messages: () => [
      {
        ...EMILIE,
        heure: "09:10",
        alerte: true,
        texte:
          "Dorval Bâtiment nous consulte pour le lot plâtrerie-isolation de la résidence des Peupliers : vingt-quatre logements, environ 120 k€, livraisons en semaines 11 à 13. Réponse attendue mercredi.",
      },
      {
        ...LINH,
        heure: "11:30",
        texte:
          "Dorval a aussi consulté le négoce d'en face. Leur conducteur de travaux est un ancien client de Christophe.",
      },
    ],
    sources: [
      {
        id: "dorval",
        titre: "Interroger Christophe sur Dorval Bâtiment",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.allie
            ? "Christophe connaît le conducteur de travaux depuis quinze ans : « Ils veulent une livraison par étage, pas un prix cassé. Si on tient les délais, c'est pour nous. » Avec Thao, il peut chiffrer pour mardi."
            : ctx.christopheParti
              ? "Christophe n'est plus là pour répondre."
              : "Christophe répond du bout des lèvres : « Dorval ? Ils regardent surtout le prix. Fais comme tu veux. » Il ne propose pas d'aider.",
      },
      {
        id: "historique",
        titre: "Regarder les derniers gros chantiers gagnés et perdus",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les six derniers gros chantiers, l'agence en a gagné deux, ceux où Christophe avait chiffré et appelé lui-même, à 22 % de marge. Les quatre perdus l'ont été sur le délai de réponse, pas sur le prix.",
      },
    ],
    question: "Comment répondez-vous à Dorval Bâtiment ?",
    options: [
      {
        t: "Monter le devis avec Christophe et Thao, à prix normal, avec une livraison par étage",
        d: "22 % de marge si l'agence l'emporte. Christophe mène, vous signez.",
      },
      {
        t: "Le chiffrer vous-même ce week-end, comme vous le faisiez à Dijon",
        d: "Vous maîtrisez la méthode. 22 % de marge si l'agence l'emporte.",
      },
      {
        t: "Casser les prix pour être sûr de l'emporter",
        d: "15 % de marge au lieu de 22 %, et de bien meilleures chances de gagner.",
      },
      {
        t: "Décliner : l'agence n'a pas les moyens de livrer un chantier de cette taille",
        d: "Pas de risque, pas de chantier.",
      },
    ],
    reactions: [
      [
        {
          ...EMILIE,
          texte:
            "Le devis est parti mardi soir, avec le planning de livraison par étage. Christophe a appelé le conducteur de travaux.",
        },
      ],
      [
        {
          ...CHRISTOPHE,
          texte: "Tu l'as chiffré tout seul ? D'accord. On verra bien.",
        },
      ],
      [
        {
          ...LINH,
          texte: "À ce prix-là, on a toutes les chances. On ne gagnera pas grand-chose dessus.",
        },
      ],
      [
        {
          ...EMILIE,
          texte: "J'ai prévenu Dorval. Ils ont remercié, et consulté quelqu'un d'autre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le bilan des cent jours",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...VINCENT,
        heure: "08:30",
        alerte: true,
        texte: `Thibaut, ton bilan des cent jours passe au comité dans deux semaines. L'agence est à ${ctx.ecart}. Qu'est-ce que tu annonces pour la suite ?`,
      },
      ctx.allie
        ? {
            ...CHRISTOPHE,
            heure: "12:10",
            texte: `Le pôle chantiers tourne : nos devis partent en ${ctx.delai}. Thao se débrouille seule sur les petits.`,
          }
        : {
            ...AICHA,
            heure: "12:10",
            texte: "L'équipe se demande ce que vous allez annoncer au comité.",
          },
    ],
    sources: [
      {
        id: "bilan",
        titre: "Faire le point avec l'équipe sur ce qui a marché",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Artisans réguliers : ${ctx.artisans}, contre 140 à votre arrivée. Attente au comptoir à 7 h 15 : ${ctx.attente}. Confiance de l'équipe : ${ctx.confiance}. Ce qui a été lancé avec l'équipe continue sans vous ; ce qui a été imposé ne tient que tant que vous êtes derrière.`,
      },
    ],
    question: "Qu'annoncez-vous au comité ?",
    options: [
      {
        t: "Un plan partagé pour le trimestre suivant, présenté avec l'équipe, qui n'engage que ce qui est lancé",
        d: "Deux membres de l'équipe présentent avec vous. Une demi-journée de préparation : 1 000 €.",
      },
      {
        t: "Votre plan de transformation complet pour l'automne, sur le modèle de Dijon",
        d: "Ambitieux et lisible : la direction aime les plans.",
      },
      {
        t: "Un engagement chiffré : 10 % de marge en plus au prochain trimestre",
        d: "Ce que la direction veut entendre. Vous le déclinerez en objectifs individuels.",
      },
      {
        t: "Rien de nouveau : continuer sur la lancée",
        d: "Pas d'annonce, pas de promesse.",
      },
    ],
    reactions: [
      [
        {
          ...VINCENT,
          texte:
            "C'est la première fois qu'une équipe d'agence me présente elle-même son plan. Je le soutiens.",
        },
      ],
      [
        {
          ...AICHA,
          texte:
            "Encore Dijon. L'équipe a l'impression que tout ce qu'on a fait depuis trois mois ne comptait pas.",
        },
      ],
      [
        {
          ...VINCENT,
          texte: "Noté : 10 % de plus au prochain trimestre. Je l'inscris au budget.",
        },
        {
          ...AICHA,
          texte:
            "Des objectifs individuels de vente ? On va pousser des produits aux artisans. Ils vont adorer.",
        },
      ],
      [
        {
          ...VINCENT,
          texte: "Pas d'annonce ? Le comité aurait aimé savoir où va l'agence.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Écouter, puis agir avec l'équipe", chemin: [1, 0, 0, 0, 0, 0] },
  { nom: "Appliquer le plan de Dijon", chemin: [0, 1, 1, 1, 1, 1] },
  { nom: "Ne froisser personne", chemin: [3, 3, 2, 3, 3, 3] },
] as const;

/** Les options qui arrivent avec la recette d'ailleurs et l'appliquent : [décision, option]. */
export const IMPOSITIONS = [
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 1],
  [3, 2],
  [5, 1],
] as const;

/**
 * Les options qui ne changent rien pour ne froisser personne : [décision, option].
 * « Continuer sur la lancée » au bilan des cent jours (D6) n'y figure pas : après des
 * décisions qui ont déjà changé l'agence, ne pas en promettre davantage est défendable,
 * et le bilan le juge ainsi sur le meilleur chemin.
 */
export const MENAGEMENTS = [
  [0, 3],
  [1, 3],
  [2, 2],
  [3, 3],
] as const;

/** Les promesses faites avant d'en tenir les moyens : [décision, option]. */
export const PROMESSES = [
  [1, 2],
  [5, 2],
] as const;

export const REPONSES = {
  renfortAccorde:
    "D'accord pour le renfort : un intérimaire au comptoir dès la semaine 6, jusqu'à la fin de l'été. Le comptoir rénové, on verra l'an prochain.",
  renfortRefuse:
    "Pas de renfort ni de travaux ce trimestre, Thibaut : le budget est bouclé. Il fallait m'en parler avant de l'annoncer à l'équipe.",
  renfortArrive:
    "L'intérimaire est arrivé au comptoir ce matin. Vous aviez dit un renfort, il est là.",
  renfortAttendu:
    "Alors, ce renfort pour l'été ? L'équipe en parle. Personne n'a rien vu venir, et on commence à se dire que c'étaient des mots.",
  christopheAccepte:
    "J'accepte. À une condition : que les remises chantier, ce soit vraiment moi qui les décide, dans ton cadre. Thao commence lundi avec moi.",
  christopheRefuse:
    "J'ai réfléchi. Je préfère rester sur mes clients, comme avant. Thao peut venir voir comment je fais, si tu veux.",
  christophePart:
    "Thibaut, je pars. J'ai accepté un poste de chef d'agence chez un négoce de Pont-de-Chéruy. Je finis vendredi. Mes clients savent où me trouver.",
  chantierGagne: "Dorval Bâtiment retient notre offre : premières livraisons en semaine 11.",
  chantierGagnePrix:
    "Dorval Bâtiment retient notre offre. Leur acheteur m'a dit qu'on était « nettement moins chers que tout le monde ».",
  chantierPerdu: "Dorval Bâtiment a retenu le négoce d'en face. Pas de détail sur les raisons.",
} as const;
