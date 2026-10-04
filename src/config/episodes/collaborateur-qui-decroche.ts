/**
 * LE COLLABORATEUR QUI DÉCROCHE — le contenu de l'épisode.
 *
 * Sandrine Aubert est cheffe des ventes comptoir de l'agence Arvel
 * Distribution de Bron : six vendeurs qui servent les artisans du lever du
 * jour à la fermeture. Didier Fontaine, vingt ans de maison et longtemps le
 * meilleur d'entre eux, multiplie depuis deux mois les erreurs de commande ;
 * l'équipe rattrape, s'agace, et le directeur parle d'avertissement. Six
 * décisions, chacune précédée de ce qu'une cheffe des ventes reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * On parle d'une personne : les messages restent respectueux, et les fausses
 * pistes sont des rumeurs que le joueur doit apprendre à ne pas croire sur
 * parole, pas des portraits.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "outil",
    t: "Il n'a jamais été vraiment formé au nouveau logiciel : ses erreurs viennent des commandes spéciales qu'il y saisit",
  },
  {
    id: "confiance",
    t: "Il a perdu confiance en lui depuis quelques mois, et il se démobilise",
  },
  { id: "attitude", t: "Il ne fait plus d'efforts : c'est un problème d'attitude" },
  { id: "personnel", t: "Une difficulté personnelle l'empêche de se concentrer" },
] as const;

const DIDIER = { de: "Didier Fontaine", role: "Vendeur comptoir" } as const;
const KARIMA = { de: "Karima Saïdi", role: "Vendeuse comptoir" } as const;
const YACINE = { de: "Yacine Belkacem", role: "Vendeur comptoir" } as const;
const HUGO = { de: "Hugo Ferrand", role: "Vendeur comptoir" } as const;
const FRANCK = { de: "Franck Delorme", role: "Directeur de l'agence" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Didier décroche",
    jusqua: 2,
    messages: () => [
      {
        ...FRANCK,
        heure: "07:50",
        alerte: true,
        texte:
          "Sandrine, encore une commande fausse pour Roussel Maçonnerie : quarante sacs de colle au lieu de quarante sacs de mortier. C'est la troisième ce mois-ci, et c'est encore Didier. La RH dit qu'on peut lui adresser un avertissement. Je veux que ce soit réglé.",
      },
      {
        de: "Tableau de bord du comptoir",
        role: "Alerte automatique",
        heure: "08:00",
        texte:
          "Erreurs de commande de Didier Fontaine la semaine dernière : 4,2 (son niveau d'il y a six mois : moins d'une). Clients du comptoir satisfaits : 82 %, pour un objectif de 86 %.",
      },
      {
        ...KARIMA,
        heure: "08:40",
        texte:
          "J'ai encore repris deux commandes spéciales de Didier vendredi soir. Je veux bien aider, mais ça fait deux mois que ça dure.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "erreurs",
        titre: "Analyser ses erreurs des huit dernières semaines",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur 33 erreurs, 28 portent sur des commandes spéciales saisies dans le nouveau logiciel, mis en service il y a neuf semaines. Sur la vente au comptoir et l'encaissement, Didier ne se trompe pas plus qu'avant. Ses « retards » sont des commandes spéciales restées en brouillon.",
      },
      {
        id: "formation",
        titre: "Retrouver les feuilles de présence de la formation au logiciel",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Didier n'a suivi que la première demi-journée sur deux jours. Le reste du temps, il tenait le comptoir seul, à votre demande, pour que les autres puissent y aller. Personne ne l'a reprogrammé depuis.",
      },
      {
        id: "observer",
        titre: "Passer une matinée au comptoir à côté de lui",
        cout: 1,
        nature: "utile",
        resultat:
          "Didier reste le vendeur que les artisans demandent : il connaît leurs chantiers et conseille juste. Mais devant une commande spéciale, il note tout sur papier, cherche les écrans, et finit par demander à Yacine de saisir. « Avant, je connaissais les codes par cœur. Là, je me sens bête. »",
      },
      {
        id: "rumeurs",
        titre: "Écouter ce que l'équipe dit de lui",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Chacun a son idée : « il a des soucis chez lui », « il a la tête ailleurs », « il ne se donne plus la peine ». Personne ne cite un fait précis.",
      },
      {
        id: "rh",
        titre: "Appeler la responsable des ressources humaines",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Corinne Lemaire : « Avant toute sanction, il faut des faits datés et un entretien. Et demandez-vous ce qui a changé il y a deux mois. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment ouvrez-vous le sujet avec Didier ?",
    options: [
      {
        t: "Lui remettre un avertissement écrit, comme le demande le directeur",
        d: "Un courrier remis en main propre, les erreurs listées. Rapide, et le message est clair.",
      },
      {
        t: "Le recevoir en entretien : les faits, leur effet sur l'équipe et les clients, et ce qu'il en dit",
        d: "Une heure au calme, les erreurs datées sur la table, sans sanction à ce stade. Des objectifs posés ensemble.",
      },
      {
        t: "Lui en toucher un mot entre deux clients",
        d: "« Fais attention aux commandes spéciales. » Sans en faire une affaire.",
      },
      {
        t: "Attendre : il a toujours été bon, ça va passer",
        d: "L'équipe compense en attendant.",
      },
    ],
    reactions: [
      [
        {
          ...DIDIER,
          texte:
            "Bien reçu. Vingt ans ici, et c'est le premier courrier que je reçois. Je ferai attention.",
        },
        {
          ...FRANCK,
          texte: "Bien. Au moins, le dossier est ouvert.",
        },
      ],
      [
        {
          ...DIDIER,
          texte:
            "Je ne vais pas te mentir : ce logiciel, je n'y comprends rien. J'ai raté la formation, et je n'ose pas demander aux jeunes. Alors je repousse les commandes spéciales, et elles partent fausses.",
        },
      ],
      [
        {
          ...DIDIER,
          texte: "Oui, oui, je sais. Je fais attention.",
        },
        {
          ...KARIMA,
          texte: "Il s'est encore trompé cet après-midi. Je l'ai reprise.",
        },
      ],
      [
        {
          ...KARIMA,
          texte: "Encore deux commandes à reprendre ce matin. On fait comment, nous ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Construire la suite",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Tableau de bord du comptoir",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Erreurs de commande de Didier en semaine 2 : ${ctx.erreurs}. Clients du comptoir satisfaits : ${ctx.satisfaction}.`,
      },
      {
        ...FRANCK,
        heure: "18:20",
        alerte: true,
        texte: ctx.averti
          ? "L'avertissement est parti. Maintenant, il faut que ça se voie sur les commandes. Qu'est-ce que tu mets en place ?"
          : "Sandrine, je n'ai toujours rien vu passer pour Didier. Qu'est-ce que tu mets en place ?",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "yacine",
        titre: "Demander à Yacine ce qui coince dans le logiciel",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Yacine : « Une commande spéciale, c'est quatre écrans et deux codes fournisseurs. Une fois qu'on a la logique, ça va vite. Je peux lui montrer une heure par jour, sur ses vraies commandes. » ${
            ctx.ouvert
              ? "Didier lui a d'ailleurs demandé de l'aide mardi, à mi-voix."
              : "Didier ne lui a jamais rien demandé, et il évite le sujet."
          }`,
      },
      {
        id: "editeur",
        titre: "Demander à l'éditeur ses dates de formation",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux jours en centre de formation, 1 600 €. Une session en semaine 4 s'il reste des places ; sinon, la suivante est en semaine 8.",
      },
    ],
    question: "Que mettez-vous en place ?",
    options: [
      {
        t: "L'inscrire à la formation de l'éditeur",
        d: "Deux jours en centre, 1 600 €. En semaine 4 ou en semaine 8, selon les places.",
      },
      {
        t: "Un plan d'accompagnement : binôme avec Yacine, trois objectifs chiffrés, un point chaque vendredi",
        d: "Une heure par jour de Yacine pendant quatre semaines. Objectif : 2,5 erreurs par semaine au plus en semaine 6.",
      },
      {
        t: "Lui fixer un objectif d'erreurs, sous peine de procédure",
        d: "Moins de deux erreurs par semaine d'ici un mois, sinon la direction tranchera.",
      },
      {
        t: "Le retirer des commandes spéciales, que l'équipe reprendra",
        d: "Il reste à la vente et à l'encaissement. Les commandes spéciales passent aux cinq autres.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...YACINE,
          texte:
            "Première heure ce matin. Il note tout dans un carnet et il pose les bonnes questions. Il ira vite.",
        },
      ],
      [
        {
          ...DIDIER,
          texte: "Compris. Je ferai ce que je peux.",
        },
      ],
      [
        {
          ...KARIMA,
          texte: "Donc on prend ses commandes spéciales en plus des nôtres ? Jusqu'à quand ?",
        },
        {
          ...DIDIER,
          texte: "Si je ne fais plus que la caisse, autant le dire franchement.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "L'équipe gronde",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...KARIMA,
        heure: "12:10",
        alerte: true,
        texte:
          "Sandrine, on en a parlé entre nous. On rattrape les erreurs de Didier depuis deux mois et demi, et rien ne change pour nous. Lui ne risque rien, et c'est nous qui restons après dix-huit heures.",
      },
      {
        ...HUGO,
        heure: "12:30",
        texte:
          "Je n'ai rien contre Didier, au contraire. Mais on aimerait savoir ce qui se passe, et jusqu'à quand.",
      },
      {
        de: "Baromètre de l'équipe",
        role: "Questionnaire du vendredi",
        heure: "17:00",
        texte: `Climat de l'équipe : ${ctx.climat} sur 100. Risque qu'un vendeur parte dans le trimestre : ${ctx.risque}.`,
      },
    ],
    sources: [
      {
        id: "reprises",
        titre: "Compter qui a repris quoi depuis deux mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Karima a repris 60 % des commandes de Didier, souvent après la fermeture. Joël et Lucie presque rien : personne n'a jamais réparti la charge, elle est allée à la plus rapide.",
      },
      {
        id: "comptoir",
        titre: "Prendre un café avec Karima",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un négoce concurrent de Villeurbanne l'a approchée. « Je n'ai rien décidé. Mais j'ai l'impression d'être la seule à qui on demande des efforts. »",
      },
    ],
    question: "Que répondez-vous à l'équipe ?",
    options: [
      {
        t: "Réunir l'équipe : reconnaître l'effort, dire qu'un plan existe, répartir les reprises équitablement jusqu'à une date",
        d: "Une demi-heure avant l'ouverture, un tableau des reprises. Rien sur ce que Didier vous a confié.",
      },
      {
        t: "Expliquer à l'équipe ce que Didier vous a confié, pour qu'ils comprennent",
        d: "Ils sauront pourquoi il se trompe. Didier n'est pas là ce jour-là.",
      },
      {
        t: "Leur demander d'être patients : c'est provisoire",
        d: "Un mot à chacun. L'organisation ne change pas.",
      },
      {
        t: "Verser une prime exceptionnelle à l'équipe",
        d: "480 € à chacun des cinq, 2 400 € en tout, pour l'effort fourni.",
      },
    ],
    reactions: [
      [
        {
          ...KARIMA,
          texte:
            "Merci de l'avoir dit devant tout le monde. Avec le tableau des reprises, c'est plus juste, et on sait jusqu'à quand.",
        },
      ],
      [
        {
          ...DIDIER,
          texte:
            "Tu leur as parlé du logiciel et de la formation ratée ? Je l'ai appris par Joël. Je te l'avais dit à toi.",
        },
      ],
      [
        {
          ...HUGO,
          texte: "D'accord. Mais provisoire, ça fait déjà deux mois et demi.",
        },
      ],
      [
        {
          ...KARIMA,
          texte: "Merci pour la prime. Ça ne change pas qui reste le soir.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le point à mi-parcours",
    jusqua: 8,
    messages: (ctx) => [
      {
        de: "Tableau de bord du comptoir",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Erreurs de commande de Didier en semaine 6 : ${ctx.erreurs}. L'objectif de mi-parcours était de 2,5 au plus.`,
      },
      {
        ...FRANCK,
        heure: "18:15",
        alerte: true,
        texte:
          "Sandrine, la RH a préparé un courrier d'avertissement pour Didier. Je le signe lundi, sauf si tu me donnes une bonne raison de ne pas le faire.",
      },
    ],
    sources: [
      {
        id: "bilan",
        titre: "Faire le bilan des six semaines, chiffres en main",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.retire
            ? "Ses erreurs ont baissé parce qu'il ne saisit plus de commandes spéciales : il n'a rien appris du logiciel. L'équipe en saisit 30 % de plus, et ses propres erreurs augmentent."
            : ctx.tenu
              ? "Les erreurs ont nettement baissé, et ses commandes spéciales partent le jour même. L'objectif de mi-parcours est tenu."
              : "Les erreurs n'ont pas assez baissé : l'objectif de mi-parcours n'est pas tenu. Ce qui a été fait jusqu'ici n'a pas suffi.",
      },
      {
        id: "juriste",
        titre: "Demander l'avis de la RH sur un recadrage",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Corinne Lemaire : « Un recadrage écrit est légitime quand un plan a échoué : il fixe une échéance et dit ce qui se passera ensuite. Un avertissement en pleine progression serait mal compris, et contestable. »",
      },
    ],
    question: "Que décidez-vous à mi-parcours ?",
    options: [
      {
        t: "Laisser partir l'avertissement, comme le veut la direction",
        d: "Le dossier est formalisé. Ce qui a été mis en place continue à côté.",
      },
      {
        t: "Faire le point avec Didier : objectifs tenus, reconnaître les progrès et alléger le suivi ; sinon, recadrage écrit avec une échéance",
        d: "Une heure, les chiffres sous les yeux. La suite dépend de ce qu'ils disent.",
      },
      {
        t: "Continuer tel quel jusqu'à la fin du trimestre",
        d: "Mêmes points, même binôme s'il existe. Rien ne change.",
      },
      {
        t: "Arrêter le suivi : il a compris le message",
        d: "Plus de point du vendredi. On lui fait confiance.",
      },
    ],
    reactions: [
      [
        {
          ...DIDIER,
          texte:
            "J'ai reçu le courrier. J'ai fait ce qu'on m'a demandé, et je reçois un avertissement. Je ne comprends plus ce qu'on attend de moi.",
        },
      ],
      [
        {
          ...FRANCK,
          texte: "Entendu. Je garde le courrier dans le tiroir ; dis-moi ce que donne le point.",
        },
      ],
      [
        {
          ...DIDIER,
          texte: "D'accord, on continue comme ça.",
        },
      ],
      [
        {
          ...DIDIER,
          texte: "Ah. Bon. Plus de point le vendredi, donc.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La nouvelle gamme de fixations",
    jusqua: 10,
    messages: () => [
      {
        de: "Achats",
        role: "Siège",
        heure: "09:30",
        alerte: true,
        texte:
          "Les fixations techniques (chevilles chimiques, ancrages pour béton fissuré) entrent au catalogue des comptoirs en semaine 11. Le comptoir doit savoir les conseiller : un mauvais ancrage, c'est un chantier à reprendre.",
      },
      {
        ...KARIMA,
        heure: "10:05",
        texte:
          "Si personne ne s'en occupe, je veux bien former les autres. Mais je suis déjà bien chargée.",
      },
    ],
    sources: [
      {
        id: "ventes",
        titre: "Regarder qui vendait les fixations avant",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avant le nouveau logiciel, Didier faisait à lui seul la moitié des ventes de fixations de l'agence : les artisans venaient le voir pour ça. ${
            ctx.serein
              ? "Ces dernières semaines, il en reparle volontiers au comptoir."
              : "Ces dernières semaines, il ne propose plus rien de lui-même."
          }`,
      },
      {
        id: "technico",
        titre: "Demander au fournisseur ce qu'il propose",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Son technico-commercial peut venir une demi-matinée, pour 400 € : une présentation générale de la gamme, sans les cas de chantier de nos clients.",
      },
    ],
    question: "Qui forme le comptoir à la nouvelle gamme ?",
    options: [
      {
        t: "Confier à Didier la formation de l'équipe",
        d: "Il prépare deux sessions avant l'ouverture de la gamme. Personne ne connaît mieux ces produits.",
      },
      {
        t: "Faire venir le technico-commercial du fournisseur",
        d: "Une demi-matinée, 400 €. Une présentation générale.",
      },
      {
        t: "La confier à Karima",
        d: "Elle apprend vite, et elle s'est proposée. Elle a déjà beaucoup sur les épaules.",
      },
      {
        t: "Chacun se formera avec la documentation",
        d: "Les fiches techniques sont en ligne.",
      },
    ],
    reactions: [
      [
        {
          ...DIDIER,
          texte:
            "Moi ? D'accord. Je leur montrerai les cas qu'on voit vraiment sur les chantiers, pas seulement la brochure.",
        },
      ],
      [
        {
          de: "Technico-commercial",
          role: "Fournisseur de fixations",
          texte: "C'est noté pour mardi matin, avant l'ouverture. J'apporte les échantillons.",
        },
      ],
      [
        {
          ...KARIMA,
          texte: "Je m'en occupe. Je préparerai ça le soir : en journée, je n'ai pas le temps.",
        },
      ],
      [
        {
          ...HUGO,
          texte: "J'ai ouvert les fiches. Trente pages par produit. On verra au comptoir.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le rush de fin d'année",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...FRANCK,
        heure: "08:30",
        alerte: true,
        texte:
          "Les trois dernières semaines avant la fermeture des chantiers, le comptoir fait 25 % de plus. Et pour Didier, je veux un dossier bouclé avant la fin du trimestre.",
      },
      {
        de: "Tableau de bord du comptoir",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Erreurs de commande de Didier en semaine 10 : ${ctx.erreurs}. Climat de l'équipe : ${ctx.climat} sur 100.`,
      },
    ],
    sources: [
      {
        id: "commandes",
        titre: "Revoir ses commandes spéciales des deux dernières semaines",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.outil
            ? "Ses commandes spéciales partent justes et le jour même. Yacine : « Sur les commandes fournisseurs, il va plus vite que moi, maintenant. »"
            : "Ses commandes spéciales restent hésitantes : il cherche encore les écrans, et plusieurs ont dû être reprises.",
      },
    ],
    question: "Comment abordez-vous le rush, et le dossier de Didier ?",
    options: [
      {
        t: "Faire le bilan avec Didier, et lui confier le pilotage des commandes spéciales du rush",
        d: "Il gère les commandes fournisseurs des trois semaines. Le dossier se clôt sur des objectifs pour le trimestre suivant.",
      },
      {
        t: "Engager la procédure disciplinaire pour boucler le dossier",
        d: "Ce que la direction demande. Le courrier part lundi.",
      },
      {
        t: "Le garder à la vente et prendre un intérimaire pour les commandes spéciales",
        d: "Trois semaines d'intérim, 3 900 €. Didier ne touche plus aux commandes spéciales.",
      },
      {
        t: "Ne rien changer, ne rien formaliser",
        d: "Le rush passera, comme les autres années.",
      },
    ],
    reactions: [
      [
        {
          ...DIDIER,
          texte:
            "Merci. Les commandes du rush, je m'en occupe ; je ferai le point avec Yacine chaque soir.",
        },
      ],
      [
        {
          ...FRANCK,
          texte: "Merci. Le courrier part lundi, la RH s'occupe du reste.",
        },
      ],
      [
        {
          de: "Agence d'intérim",
          role: "Bron",
          texte:
            "Nous vous envoyons Maxime lundi. Il connaît la vente de matériaux, pas votre logiciel.",
        },
      ],
      [
        {
          ...HUGO,
          texte: "Premier jour du rush : la file d'attente sort jusque sur le parking.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Comprendre et accompagner", chemin: [1, 1, 0, 1, 0, 0] },
  { nom: "Sanctionner vite", chemin: [0, 2, 2, 0, 1, 1] },
  { nom: "Laisser filer", chemin: [3, 3, 2, 2, 3, 3] },
] as const;

/**
 * Les réflexes du métier face à un collaborateur qui décroche : sanctionner
 * sans avoir compris, ou éviter le conflit et laisser l'équipe absorber.
 * [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 2],
  [3, 0],
  [3, 3],
  [5, 1],
  [5, 3],
] as const;

export const REPONSES = {
  sessionProche:
    "Une place s'est libérée : Didier est inscrit à la session de la semaine 4, les deux jours.",
  sessionLointaine:
    "La session de la semaine 4 est complète. Didier est inscrit à la suivante, en semaine 8.",
} as const;
