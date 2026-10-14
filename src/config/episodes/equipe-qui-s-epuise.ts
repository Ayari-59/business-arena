/**
 * L'ÉQUIPE QUI S'ÉPUISE — le contenu de l'épisode.
 *
 * Nadia Haddad dirige le service client d'Arvel Distribution : douze
 * conseillers qui répondent aux artisans et aux grands comptes. Les délais de
 * réponse s'allongent, l'absentéisme monte, un conseiller va partir. Six
 * décisions, chacune précédée de ce qu'une responsable reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "relances",
    t: "Les retards font écrire les clients deux fois : la file s'alimente elle-même",
  },
  { id: "productivite", t: "Les conseillers ne traitent pas assez de demandes" },
  { id: "motivation", t: "L'équipe manque de motivation" },
  { id: "effectif", t: "Il manque du monde : Léa est absente et l'équipe tourne à onze" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les délais explosent",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord du service",
        role: "Alerte automatique",
        heure: "07:45",
        alerte: true,
        texte:
          "Délai moyen de réponse : 3,5 jours ouvrés la semaine dernière, pour un objectif de 2. Satisfaction client : 83 %.",
      },
      {
        de: "Hélène Garnier",
        role: "Directrice des opérations",
        heure: "08:30",
        texte:
          "Nadia, j'ai trois grands comptes qui se plaignent du service client cette semaine. Dis-moi vendredi ce que tu fais.",
      },
      {
        de: "Romain Petitjean",
        role: "Conseiller",
        heure: "09:05",
        texte: "On n'arrive plus à vider la file. Chaque matin il y a plus de mails que la veille.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "demandes",
        titre: "Analyser les demandes de la semaine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "38 % des demandes sont des relances : des clients qui écrivent une deuxième ou une troisième fois pour la même question, faute de réponse. Aucun accusé de réception ne part quand un client écrit.",
      },
      {
        id: "ecoute",
        titre: "Écouter trois conseillers au téléphone",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les conseillers sont rapides et compétents. Mais un appel sur deux commence par « je vous ai déjà écrit lundi ». Sophie : « On passe nos journées à répondre à des gens qui attendent une réponse qu'on leur a déjà promise. »",
      },
      {
        id: "productivite",
        titre: "Comparer la productivité aux autres services",
        cout: 1,
        nature: "bruit",
        resultat:
          "96 demandes traitées par conseiller et par semaine, contre 94 en moyenne dans le groupe. Rien d'anormal.",
      },
      {
        id: "rh",
        titre: "Faire le point avec les ressources humaines",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Léa est en arrêt jusqu'à la semaine 6. L'absentéisme du service est à 11 %, contre 5 % dans le groupe. Mathieu a demandé un rendez-vous pour la fin de la semaine prochaine.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Hélène",
        cout: 0.5,
        nature: "aide",
        resultat: "Hélène : « Avant de demander plus à l'équipe, regarde ce qui remplit la file. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Imposer deux heures supplémentaires par jour",
        d: "Toute l'équipe, pendant quatre semaines. 2 400 € par semaine.",
      },
      {
        t: "Envoyer un accusé de réception et trier les demandes par urgence",
        d: "Un message automatique qui donne un délai, et une file pour les urgences. 800 €, une semaine pour s'y faire.",
      },
      {
        t: "Fixer un objectif de 110 demandes par conseiller",
        d: "Un objectif individuel, suivi chaque semaine.",
      },
      {
        t: "Attendre le retour de Léa",
        d: "Elle revient en semaine 7. L'équipe fera avec d'ici là.",
      },
    ],
    reactions: [
      [
        {
          de: "Romain Petitjean",
          role: "Conseiller",
          texte:
            "On fera les heures. Mais on rentre tard, et la file est toujours aussi longue le matin.",
        },
      ],
      [
        {
          de: "Sophie Lambert",
          role: "Conseillère senior",
          texte:
            "Depuis l'accusé de réception, les clients ne réécrivent presque plus. On répond enfin aux vraies questions.",
        },
      ],
      [
        {
          de: "Sophie Lambert",
          role: "Conseillère senior",
          texte:
            "Pour faire 110, on bâcle les dossiers difficiles et on les laisse aux autres. L'ambiance s'en ressent.",
        },
      ],
      [
        {
          de: "Hélène Garnier",
          role: "Directrice des opérations",
          texte: "Les grands comptes me rappellent. Qu'est-ce qui change, concrètement ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Mathieu s'en va",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Mathieu Roche",
        role: "Conseiller",
        heure: "16:20",
        alerte: true,
        texte:
          "Nadia, je préfère te le dire en face : j'ai accepté un poste ailleurs. Je pars à la fin de la semaine 5.",
      },
      {
        de: "Tableau de bord du service",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Délai moyen de réponse en semaine 3 : ${ctx.delai}. Demandes en attente : ${ctx.file}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "entretien",
        titre: "Prendre le temps d'un entretien avec Mathieu",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Mathieu part pour 150 € de plus par mois, mais surtout « parce qu'ici on court tout le temps ». ${
            ctx.fileSoulagee
              ? "Il reconnaît que c'est plus calme depuis l'accusé de réception, et pourrait rester si ça continue."
              : "Il ne voit pas ce qui pourrait changer."
          }`,
      },
      {
        id: "recrutement",
        titre: "Demander aux RH ce que coûte un remplacement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un recrutement en CDI prend cinq semaines (4 000 € de cabinet) : la recrue arriverait en semaine 9. Un intérimaire peut commencer en semaine 6, à 1 400 € par semaine.",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Lancer un recrutement en CDI",
        d: "Arrivée en semaine 9, le temps d'apprendre le métier. 4 000 € de cabinet.",
      },
      {
        t: "Prendre un intérimaire dès la semaine 6",
        d: "Jusqu'à la fin du trimestre, à 1 400 € par semaine. Un peu moins efficace qu'un conseiller formé.",
      },
      {
        t: "Répartir son portefeuille sur l'équipe",
        d: "Ne coûte rien. Onze conseillers pour le travail de douze, en attendant.",
      },
      {
        t: "Lui proposer 150 € de plus par mois pour qu'il reste",
        d: "450 € sur le trimestre. Il dira oui, ou pas.",
      },
    ],
    reactions: [
      [
        {
          de: "Ressources humaines",
          role: "Siège",
          texte:
            "Le cabinet a lancé l'annonce. Première sélection de candidats dans deux semaines.",
        },
      ],
      [
        {
          de: "Ressources humaines",
          role: "Siège",
          texte:
            "L'agence d'intérim nous propose Yanis, qui a déjà fait du service client. Il commence en semaine 6.",
        },
      ],
      [
        {
          de: "Romain Petitjean",
          role: "Conseiller",
          texte: "On va encore se partager le travail d'un absent. Ça commence à faire beaucoup.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Sophie et Romain ne se parlent plus",
    jusqua: 7,
    messages: () => [
      {
        de: "Romain Petitjean",
        role: "Conseiller",
        heure: "11:40",
        alerte: true,
        texte:
          "Sophie me renvoie tous les dossiers de litige en disant que c'est mon tour. Je ne suis pas formé aux litiges. Je ne vais pas tenir comme ça.",
      },
      {
        de: "Sophie Lambert",
        role: "Conseillère senior",
        heure: "14:15",
        texte:
          "Depuis deux ans, c'est moi qui prends tous les litiges. Quand je demande de l'aide, on me regarde comme si je refusais de travailler.",
      },
    ],
    sources: [
      {
        id: "litiges",
        titre: "Regarder qui traite les litiges depuis six mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sophie a traité 71 % des litiges du service, souvent après 18 heures. Personne d'autre n'a été formé à ces dossiers.",
      },
    ],
    question: "Comment traitez-vous le conflit ?",
    options: [
      {
        t: "Les recevoir ensemble et redéfinir qui traite quoi",
        d: "Une heure à trois, une règle écrite, et un suivi dans quinze jours.",
      },
      {
        t: "Créer une file d'expertise tournante pour les litiges",
        d: "Sophie forme deux collègues en deux semaines, puis les litiges tournent. Un peu de capacité perdue pendant la formation.",
      },
      {
        t: "Trancher en faveur de Sophie, la plus expérimentée",
        d: "Romain prendra sa part des litiges. Rapide.",
      },
      {
        t: "Laisser faire : ce sont des adultes",
        d: "Ils finiront par s'arranger.",
      },
    ],
    reactions: [
      [
        {
          de: "Sophie Lambert",
          role: "Conseillère senior",
          texte: "Merci d'avoir pris le temps. C'est la première fois qu'on en parle vraiment.",
        },
      ],
      [
        {
          de: "Romain Petitjean",
          role: "Conseiller",
          texte:
            "J'ai fait ma première formation litiges avec Sophie. Elle explique bien, en fait.",
        },
      ],
      [
        {
          de: "Romain Petitjean",
          role: "Conseiller",
          texte: "Bien compris. Je prendrai les litiges. Je ne suis pas sûr de bien les faire.",
        },
      ],
      [
        {
          de: "Fatima Benali",
          role: "Conseillère",
          texte: "L'ambiance est lourde au plateau. Tout le monde évite Sophie et Romain.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le marketing lance une promotion",
    jusqua: 9,
    messages: () => [
      {
        de: "Marketing",
        role: "Siège",
        heure: "10:00",
        alerte: true,
        texte:
          "Pour info : nous lançons une promotion sur l'outillage électroportatif des semaines 9 à 11, envoyée à 40 000 clients.",
      },
      {
        de: "Tableau de bord du service",
        role: "Historique",
        heure: "10:05",
        texte:
          "La dernière campagne de ce type avait fait monter les demandes de 25 % pendant trois semaines.",
      },
    ],
    sources: [
      {
        id: "campagne",
        titre: "Lire les demandes de la dernière campagne",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Deux demandes sur trois portaient sur les conditions de l'offre : dates, produits concernés, cumul avec les remises des grands comptes. Les mêmes six questions, encore et encore.",
      },
    ],
    question: "Comment préparez-vous le service ?",
    options: [
      {
        t: "Demander au marketing de décaler la campagne",
        d: "De trois semaines, quand Léa sera revenue et l'équipe au complet. Le marketing décidera.",
      },
      {
        t: "Prévoir des heures supplémentaires volontaires, majorées",
        d: "Pendant les trois semaines de la campagne. 2 000 € par semaine.",
      },
      {
        t: "Préparer des réponses types et une page de questions fréquentes",
        d: "Avec le marketing, avant le lancement. 600 €.",
      },
      {
        t: "Ne rien prévoir",
        d: "On verra bien.",
      },
    ],
    reactions: [
      null,
      [
        {
          de: "Fatima Benali",
          role: "Conseillère",
          texte: "Je veux bien faire des heures. Mais trois semaines, c'est long.",
        },
      ],
      [
        {
          de: "Marketing",
          role: "Siège",
          texte:
            "La page de questions est en ligne et le lien figure dans l'e-mail de la campagne. Merci pour l'idée.",
        },
      ],
      [
        {
          de: "Romain Petitjean",
          role: "Conseiller",
          texte: "La campagne est partie. Les mails arrivent par paquets.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "L'équipe demande du télétravail",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Délégués du personnel",
        role: "Service client",
        heure: "09:30",
        alerte: true,
        texte:
          "L'équipe demande deux jours de télétravail par semaine, comme les autres services du groupe. Les trajets sont longs, et la fatigue se voit.",
      },
      {
        de: "Tableau de bord du service",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Absentéisme du service en semaine 9 : ${ctx.absenteisme}. Délai moyen de réponse : ${ctx.delai}.`,
      },
    ],
    sources: [
      {
        id: "charte",
        titre: "Relire la charte de télétravail du groupe",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le groupe autorise deux jours par semaine, à condition d'un planning d'équipe et de plages de présence communes. Les services qui l'ont fait ont vu leur absentéisme baisser d'un tiers.",
      },
    ],
    question: "Que répondez-vous ?",
    options: [
      {
        t: "Accepter à l'essai, avec un planning et des plages communes",
        d: "Deux jours par semaine, un bilan dans trois mois.",
      },
      {
        t: "Accepter pour ceux qui le veulent, sans cadre",
        d: "Chacun choisit ses jours.",
      },
      {
        t: "Refuser : ce n'est pas le moment",
        d: "Le service est en difficulté, tout le monde sur place.",
      },
      {
        t: "Reporter la décision au trimestre prochain",
        d: "On en reparlera quand les délais seront revenus.",
      },
    ],
    reactions: [
      [
        {
          de: "Fatima Benali",
          role: "Conseillère",
          texte: "Merci. Le planning est affiché, tout le monde s'y retrouve.",
        },
      ],
      [
        {
          de: "Sophie Lambert",
          role: "Conseillère senior",
          texte: "Le mardi, on n'est plus que trois sur place, et personne pour les litiges.",
        },
      ],
      [
        {
          de: "Délégués du personnel",
          role: "Service client",
          texte: "L'équipe prend acte. Elle est déçue.",
        },
      ],
      [
        {
          de: "Délégués du personnel",
          role: "Service client",
          texte: "L'équipe aurait préféré une réponse.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Finir le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Hélène Garnier",
        role: "Directrice des opérations",
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant la fin du trimestre. Délai moyen : ${ctx.delai}, et ${ctx.file} demandes en attente. Qu'est-ce que tu prévois ?`,
      },
    ],
    sources: [],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Organiser un samedi de rattrapage payé",
        d: "Toute l'équipe, en semaine 12. 3 000 €.",
      },
      {
        t: "Traiter d'abord les demandes les plus anciennes, et dire aux autres quand elles auront leur réponse",
        d: "Un message d'attente qui donne un délai précis.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre se finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          de: "Romain Petitjean",
          role: "Conseiller",
          texte: "On a fait le samedi. La file a baissé, et tout le monde est rincé.",
        },
      ],
      [
        {
          de: "Hélène Garnier",
          role: "Directrice des opérations",
          texte: "Les grands comptes me disent qu'on leur répond avec une date. Ça change tout.",
        },
      ],
      [
        {
          de: "Hélène Garnier",
          role: "Directrice des opérations",
          texte: "Le trimestre se termine. On fera le point lundi.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Soulager la file d'abord", chemin: [1, 3, 1, 2, 0, 1] },
  { nom: "Pression sur l'équipe", chemin: [0, 2, 2, 1, 2, 0] },
  { nom: "Attentiste", chemin: [3, 2, 3, 3, 3, 2] },
] as const;

/**
 * Les options qui répondent à une surcharge en demandant plus à l'équipe : [décision, option].
 * Refuser le télétravail (D5) n'y figure pas : il ne demande pas plus de travail, et le bilan
 * le juge défendable sur le meilleur chemin (moins de 1 000 € sous la meilleure option).
 */
export const PRESSIONS = [
  [0, 0],
  [0, 2],
  [1, 2],
  [3, 1],
  [5, 0],
] as const;

export const REPONSES = {
  mathieuReste:
    "J'ai réfléchi. Si ça continue de se calmer comme ces derniers temps, je reste. Merci d'avoir fait le geste.",
  mathieuPart: "Merci, mais ma décision est prise. Je pars à la fin de la semaine 5.",
  campagneDecalee: "D'accord pour décaler : la campagne partira en semaine 12.",
  campagneMaintenue:
    "Impossible de décaler, les magasins sont déjà prévenus. La campagne part en semaine 9.",
} as const;
