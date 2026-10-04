/**
 * L'INDICATEUR QUI MENT — le contenu de l'épisode.
 *
 * Sonia Vidal dirige les deux plateaux de prise de commande à distance
 * d'Arvel Distribution : quatorze conseillers qui prennent au téléphone les
 * commandes des artisans. Le siège la juge sur un chiffre, les appels
 * décrochés en moins de trente secondes, et l'équipe touche une prime quand
 * il tient. Le chiffre est excellent ; les commandes baissent, et les clients
 * rappellent. Six décisions, chacune précédée de ce qu'une responsable reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "goodhart",
    t: "L'équipe court après le décroché : on répond vite, on écourte, et la commande ne se prend plus au premier appel",
  },
  {
    id: "formation",
    t: "Les conseillers ne connaissent pas assez les produits : ils promettent de rappeler faute de savoir répondre",
  },
  { id: "prix", t: "Les concurrents ont baissé leurs prix : les artisans commandent ailleurs" },
  { id: "web", t: "Les clients passent du téléphone au site web : la baisse est structurelle" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le tableau est vert, les ventes baissent",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord du siège",
        role: "Envoi automatique",
        heure: "07:30",
        texte:
          "Appels décrochés en moins de 30 secondes : 94 % la semaine dernière, pour un objectif de 90 %. Vos deux plateaux sont premiers du groupe pour la sixième semaine d'affilée.",
      },
      {
        de: "Philippe Garcin",
        role: "Directeur commercial régional",
        heure: "08:40",
        alerte: true,
        texte:
          "Sonia, bravo pour le décroché. Mais les commandes à distance ont baissé de 9 % sur le dernier trimestre, et trois artisans m'ont dit qu'il fallait appeler deux fois pour passer une commande. Dis-moi vendredi ce que tu fais.",
      },
      {
        de: "Patrick Simoni",
        role: "Plaquiste à Givors, client",
        heure: "10:15",
        texte:
          "Troisième appel pour mes rails et mes plaques. On me décroche tout de suite, on me dit qu'on me rappelle, et personne ne rappelle.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "ecoute",
        titre: "Écouter vingt appels enregistrés de la semaine",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur vingt appels de commande, sept se terminent sans commande : « je vérifie le stock et je vous rappelle », un transfert vers un collègue déjà en ligne, un devis renvoyé par e-mail. La durée moyenne d'appel est passée de 6 min 30 à 5 min 05 en un an. Lucas, premier du plateau au décroché, raccroche en moyenne au bout de trois minutes.",
      },
      {
        id: "rappels",
        titre: "Croiser les numéros appelants sur quinze jours",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "22 % des appelants rappellent dans les 48 heures pour la même demande. Seuls 62 % des appels de commande aboutissent du premier coup. Parmi les clients qui n'obtiennent pas leur commande au premier appel, un sur cinq ne rappelle jamais.",
      },
      {
        id: "groupe",
        titre: "Comparer le décroché aux autres plateaux du groupe",
        cout: 1,
        nature: "bruit",
        resultat:
          "94 % chez vous, 87 % en moyenne dans le groupe. Vos plateaux sont premiers depuis six semaines, et le siège cite votre organisation en exemple.",
      },
      {
        id: "web",
        titre: "Regarder les commandes en ligne et les prix des concurrents",
        cout: 1,
        nature: "utile",
        resultat:
          "Les commandes passées sur le site sont stables dans la région (+1 % sur un an) : les artisans ne sont pas passés du téléphone au web. Les prix des deux concurrents régionaux n'ont pas bougé.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Philippe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Philippe : « Un chiffre au vert ne dit pas que le travail est bien fait. Avant de le pousser, regarde ce qu'il compte vraiment. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Fixer un objectif de 95 % de décroché, suivi heure par heure",
        d: "Un écran sur chaque plateau, un point des superviseurs toutes les heures. Ne coûte rien.",
      },
      {
        t: "Écouter des appels avec l'équipe chaque semaine, et suivre aussi les commandes prises au premier appel",
        d: "Une heure d'écoute par semaine et par plateau, un indicateur de plus à paramétrer dans l'outil téléphonique. 1 500 €.",
      },
      {
        t: "Ajouter dix indicateurs au tableau de bord quotidien",
        d: "Durée d'appel, transferts, ventes additionnelles, taux d'occupation… tout, tous les jours. 500 € par semaine de reporting.",
      },
      {
        t: "Ne rien changer : le décroché est au vert",
        d: "Le siège est content du chiffre.",
      },
    ],
    reactions: [
      [
        {
          de: "Lucas Fabre",
          role: "Conseiller, Vénissieux",
          texte: "On le tiendra, le 95 %. Il suffit de ne pas traîner au téléphone.",
        },
      ],
      [
        {
          de: "Nathalie Pereira",
          role: "Superviseure, Villefranche",
          texte:
            "On a écouté six appels ensemble. Personne ne savait qu'on perdait autant de commandes en disant « je vous rappelle ».",
        },
      ],
      [
        {
          de: "Kevin Marchal",
          role: "Superviseur, Vénissieux",
          texte:
            "Le reporting me prend une heure par jour. L'équipe me demande lequel des dix chiffres compte.",
        },
      ],
      [
        {
          de: "Philippe Garcin",
          role: "Directeur commercial régional",
          texte:
            "Si le chiffre est vert et que les ventes baissent, quelque chose ne va pas. Qu'est-ce qui change, concrètement ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "La prime du mois prochain",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Ressources humaines",
        role: "Siège",
        heure: "15:00",
        alerte: true,
        texte:
          "La prime d'équipe — 250 € par conseiller et par mois quand le décroché dépasse 90 % — est reconduite par défaut. Souhaitez-vous la modifier à partir du mois prochain ?",
      },
      {
        de: "Tableau de bord des plateaux",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 3 : ${ctx.decroche} de décroché, ${ctx.ca} de chiffre d'affaires à distance, ${ctx.rappel} des appelants qui rappellent sous 48 heures. Commandes prises au premier appel : ${ctx.premierAppel}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "detail",
        titre: "Lire la prime et les résultats conseiller par conseiller",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `La prime a été versée onze mois sur douze. ${
            ctx.voit
              ? "Les trois conseillers au meilleur décroché sont ceux qui prennent le moins de commandes au premier appel : 48 % pour Lucas, 79 % pour Yasmine, qui est avant-dernière au décroché."
              : "Par conseiller, seul le décroché est suivi : de 89 % à 98 %. Lucas est premier. Yasmine, qui prend le plus de commandes selon les superviseurs, est avant-dernière."
          } La prime pousse chacun vers le haut du classement, quoi qu'il arrive à la commande.`,
      },
      {
        id: "delegues",
        titre: "Sonder les délégués du personnel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Hugo Lemaire : « La prime, c'est 6 % du salaire. La supprimer d'un coup, l'équipe le vivra comme une sanction. Mais personne n'y tient telle qu'elle est : elle récompense ceux qui raccrochent vite. »",
      },
    ],
    question: "Que faites-vous de la prime ?",
    options: [
      {
        t: "Supprimer la prime dès le mois prochain",
        d: "3 500 € économisés par mois. Annoncé par une note de service.",
      },
      {
        t: "Refondre la prime avec l'équipe : moitié décroché, moitié commandes prises au premier appel",
        d: "Deux ateliers avec des conseillers volontaires, 1 200 €. Le même montant, des règles nouvelles dès le mois prochain.",
      },
      {
        t: "Garder la prime telle qu'elle est",
        d: "250 € par conseiller et par mois au-delà de 90 % de décroché.",
      },
      {
        t: "Relever le seuil de la prime à 95 %",
        d: "Le même montant, plus difficile à obtenir.",
      },
    ],
    reactions: [
      [
        {
          de: "Hugo Lemaire",
          role: "Délégué du personnel",
          texte:
            "La note est tombée sans un mot d'explication. Sur les deux plateaux, on parle de sanction.",
        },
      ],
      [
        {
          de: "Yasmine Belkacem",
          role: "Conseillère, Villefranche",
          texte:
            "Pour une fois qu'on nous demande comment mesurer notre travail. J'ai proposé qu'on compte les commandes, pas les secondes.",
        },
      ],
      [
        {
          de: "Lucas Fabre",
          role: "Conseiller, Vénissieux",
          texte: "Tant mieux. On est bien partis pour la toucher ce mois-ci.",
        },
      ],
      [
        {
          de: "Hugo Lemaire",
          role: "Délégué du personnel",
          texte:
            "95 % ? Il faudra décrocher encore plus vite. Les appels de commande longs, plus personne n'en voudra.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Des conseillers très inégaux",
    jusqua: 7,
    messages: () => [
      {
        de: "Nathalie Pereira",
        role: "Superviseure, Villefranche",
        heure: "11:20",
        alerte: true,
        texte:
          "Deux entreprises de plâtrerie ont cessé de commander chez nous ce mois-ci. Les moyennes du plateau sont bonnes, mais je vois des conseillers qui ne prennent presque jamais une commande en entier.",
      },
      {
        de: "Lucas Fabre",
        role: "Conseiller, Vénissieux",
        heure: "14:05",
        texte:
          "Si on veut que je prenne plus de temps par appel, qu'on me le dise. Pour l'instant, on me félicite de décrocher vite.",
      },
    ],
    sources: [
      {
        id: "parConseiller",
        titre: "Regarder les chiffres conseiller par conseiller",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.voit
            ? `Commandes prises au premier appel : de 48 % à 81 % selon les conseillers, pour une moyenne de ${ctx.premierAppel}. Quatre conseillers fabriquent à eux seuls la moitié des rappels ; Yasmine et deux collègues prennent presque toutes les commandes de chantier.`
            : ctx.dixIndicateurs
              ? "Les dix indicateurs sont suivis par plateau, pas par conseiller. La moyenne de chaque plateau est correcte ; impossible de savoir qui fabrique les rappels."
              : "Seul le décroché est suivi par conseiller : de 89 % à 98 %. Sans les commandes prises au premier appel, impossible de savoir qui fabrique les rappels.",
      },
      {
        id: "catalogue",
        titre: "Demander le catalogue de formation",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La formation produit de deux jours coûte 4 200 € pour l'équipe et vide la moitié de chaque plateau pendant la semaine 7. Les plateaux qui l'ont suivie l'an dernier ont gagné deux points de commandes au premier appel.",
      },
    ],
    question: "Que faites-vous des écarts entre conseillers ?",
    options: [
      {
        t: "Afficher au plateau le classement individuel du décroché",
        d: "Un écran par plateau, mis à jour en continu. Ne coûte rien.",
      },
      {
        t: "Former des binômes : ceux qui prennent le plus de commandes au premier appel accompagnent les autres",
        d: "Deux demi-journées par semaine pendant un mois. Un peu de capacité en moins au début.",
      },
      {
        t: "Envoyer toute l'équipe en formation produit",
        d: "Deux jours en semaine 7, 4 200 €. Les plateaux tournent à effectif réduit pendant la formation.",
      },
      {
        t: "Ne rien changer : la moyenne est correcte",
        d: "Chacun garde sa façon de travailler.",
      },
    ],
    reactions: [
      [
        {
          de: "Yasmine Belkacem",
          role: "Conseillère, Villefranche",
          texte:
            "Je suis avant-dernière au classement. Mes clients, eux, commandent. Je ne sais plus ce qu'on attend de moi.",
        },
      ],
      [
        {
          de: "Kevin Marchal",
          role: "Superviseur, Vénissieux",
          texte:
            "Les binômes ont démarré. Lucas a passé l'après-midi avec Yasmine : une commande de chantier complète, c'est huit minutes, mais on ne la reprend pas deux fois.",
        },
      ],
      [
        {
          de: "Nathalie Pereira",
          role: "Superviseure, Villefranche",
          texte:
            "La formation était bonne. Les deux jours avec la moitié du plateau ont été longs.",
        },
      ],
      [
        {
          de: "Nathalie Pereira",
          role: "Superviseure, Villefranche",
          texte: "Rien ne change, donc. Les mêmes clients rappelleront les mêmes conseillers.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le siège veut reprendre deux postes",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Marc-Antoine Leroy",
        role: "Directeur de la relation client, siège",
        heure: "09:10",
        alerte: true,
        texte: `Avec ${ctx.decroche} de décroché cette semaine, vos plateaux ont de la marge. Je vous propose de rendre deux postes de conseiller, réaffectés au service après-vente, à partir de la semaine 9.`,
      },
      {
        de: "Agnès Royer",
        role: "Contrôle de gestion",
        heure: "11:30",
        texte:
          "Pour mémoire : un poste de conseiller coûte 1 000 € par semaine, charges comprises. Deux postes rendus, c'est 10 000 € d'économie sur le reste du trimestre.",
      },
    ],
    sources: [
      {
        id: "charge",
        titre: "Calculer la charge réelle des plateaux, rappels compris",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.rappel} des appelants rappellent sous 48 heures : autant d'appels que le décroché compte deux fois. Le pic de printemps commence en semaine 10, à +20 % d'appels. Avec deux postes en moins, il faudrait encore raccourcir les appels pour tenir le décroché.`,
      },
      {
        id: "histoire",
        titre: "Demander au siège comment il a choisi son indicateur",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le décroché en 30 secondes date de 2019, quand les plateaux perdaient un appel sur cinq. Le siège n'a jamais suivi les commandes prises au premier appel : « personne ne nous a jamais montré ce chiffre ». Il change d'indicateur quand on lui apporte des données, pas des impressions.",
      },
    ],
    question: "Que répondez-vous au siège ?",
    options: [
      {
        t: "Rendre les deux postes : l'indicateur le permet",
        d: "10 000 € d'économie sur le trimestre.",
      },
      {
        t: "Montrer au siège les commandes perdues et les rappels, et proposer de piloter sur les commandes prises au premier appel",
        d: "Une note chiffrée et une réunion. Le siège décidera, et pourra trancher sur les postes.",
      },
      {
        t: "Obtenir que la décision soit reportée au trimestre prochain",
        d: "Les deux postes restent jusqu'à la fin du trimestre. Le siège garde son indicateur.",
      },
      {
        t: "Rendre un poste et garder l'autre",
        d: "5 000 € d'économie : un compromis.",
      },
    ],
    reactions: [
      [
        {
          de: "Kevin Marchal",
          role: "Superviseur, Vénissieux",
          texte:
            "Deux postes en moins juste avant le pic de printemps… On va devoir décrocher et raccrocher encore plus vite.",
        },
      ],
      null,
      [
        {
          de: "Marc-Antoine Leroy",
          role: "Directeur de la relation client, siège",
          texte: "Va pour un report. On en reparle au trimestre prochain, chiffres à l'appui.",
        },
      ],
      [
        {
          de: "Agnès Royer",
          role: "Contrôle de gestion",
          texte: "C'est noté : un poste de moins à partir de la semaine 9.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Le pic de printemps",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Tableau de bord des plateaux",
        role: "Alerte automatique",
        heure: "07:45",
        alerte: true,
        texte:
          "Les chantiers redémarrent : l'an dernier, les appels ont monté de 20 % pendant trois semaines à partir de la semaine 10.",
      },
      {
        de: "Kevin Marchal",
        role: "Superviseur, Vénissieux",
        heure: "17:20",
        texte: `Décroché cette semaine : ${ctx.decroche}. ${
          ctx.primeAuDecroche
            ? `Si on passe sous ${ctx.seuil} ce mois-ci, la prime saute, et toute l'équipe le sait.`
            : "L'équipe tient, mais les journées vont être longues."
        }`,
      },
    ],
    sources: [
      {
        id: "pic",
        titre: "Lire les appels du pic de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Au dernier pic, six appels supplémentaires sur dix étaient des commandes de chantier ; les autres, des questions de disponibilité et de suivi de livraison, qui peuvent attendre quelques minutes. Les commandes de chantier pèsent trois fois le panier moyen, et ce sont elles qui partaient chez les concurrents.",
      },
      {
        id: "interim",
        titre: "Appeler l'agence d'intérim",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux intérimaires peuvent commencer lundi, à 1 300 € par semaine chacun. Ils savent décrocher ; ils ne connaissent ni les produits ni les clients.",
      },
    ],
    question: "Comment passez-vous le pic ?",
    options: [
      {
        t: "Activer le rappel automatique : le client laisse son numéro, l'appel compte comme décroché",
        d: "Le décroché reste au vert. Les conseillers rappellent quand ils se libèrent.",
      },
      {
        t: "Prendre deux intérimaires pendant trois semaines",
        d: "7 800 €. Deux personnes de plus pour décrocher.",
      },
      {
        t: "Ouvrir une ligne prioritaire pour les commandes de chantier, et laisser attendre un peu les questions de suivi",
        d: "Un choix de plus dans le serveur vocal. Le décroché global va baisser.",
      },
      {
        t: "Ne rien prévoir",
        d: "Les plateaux feront au mieux.",
      },
    ],
    reactions: [
      [
        {
          de: "Patrick Simoni",
          role: "Plaquiste à Givors, client",
          texte: "On m'a promis un rappel mardi. Il est arrivé jeudi : j'avais commandé ailleurs.",
        },
      ],
      [
        {
          de: "Kevin Marchal",
          role: "Superviseur, Vénissieux",
          texte:
            "Les intérimaires décrochent bien, puis passent l'appel à un collègue dès qu'on leur parle de références.",
        },
      ],
      [
        {
          de: "Yasmine Belkacem",
          role: "Conseillère, Villefranche",
          texte:
            "Les commandes de chantier passent du premier coup. Les questions de suivi attendent deux minutes de plus, et personne ne s'en plaint.",
        },
      ],
      [
        {
          de: "Nathalie Pereira",
          role: "Superviseure, Villefranche",
          texte: "On tient comme on peut. Beaucoup de « je vous rappelle ».",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le tableau de bord de demain",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Marc-Antoine Leroy",
        role: "Directeur de la relation client, siège",
        heure: "10:00",
        alerte: true,
        texte:
          "Je prépare la revue de fin de trimestre. Avec quels indicateurs voulez-vous piloter vos plateaux, dès lundi et pour le trimestre prochain ?",
      },
      {
        de: "Philippe Garcin",
        role: "Directeur commercial régional",
        heure: "16:40",
        texte: `Chiffre d'affaires à distance cette semaine : ${ctx.ca}. Décroché : ${ctx.decroche}. Je veux un tableau qui me dise si on vend, pas seulement si on répond.`,
      },
    ],
    sources: [],
    question: "Avec quel tableau de bord pilotez-vous ?",
    options: [
      {
        t: "Garder le seul décroché : c'est ce que le siège regarde",
        d: "Rien à changer.",
      },
      {
        t: "Quatre indicateurs équilibrés, revus chaque lundi avec l'équipe",
        d: "Décroché, commandes au premier appel, rappels, chiffre d'affaires. Une demi-heure par semaine et par plateau.",
      },
      {
        t: "Un tableau complet de quinze indicateurs, par conseiller et par heure",
        d: "Tout mesurer pour ne rien rater. 500 € par semaine de reporting.",
      },
    ],
    reactions: [
      [
        {
          de: "Lucas Fabre",
          role: "Conseiller, Vénissieux",
          texte: "Donc on revient au chrono. Au moins, c'est clair.",
        },
      ],
      [
        {
          de: "Nathalie Pereira",
          role: "Superviseure, Villefranche",
          texte:
            "Premier point du lundi : l'équipe a commenté les rappels d'elle-même. Quatre chiffres, tout le monde sait lesquels.",
        },
      ],
      [
        {
          de: "Kevin Marchal",
          role: "Superviseur, Vénissieux",
          texte:
            "Quinze indicateurs par conseiller et par heure : je passe ma matinée sur les tableaux, et l'après-midi à expliquer pourquoi ils sont rouges.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Vérifier ce que mesure l'indicateur", chemin: [1, 1, 1, 1, 2, 1] },
  { nom: "Plus vert que vert", chemin: [0, 3, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 2, 3, 2, 3, 0] },
] as const;

/**
 * Les réflexes du métier sous pression d'un indicateur : le pousser plus fort
 * (objectif relevé, seuil relevé, classement, rappel automatique), lui faire
 * confiance (rendre les postes), ou l'enterrer sous d'autres chiffres :
 * [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 3],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [5, 2],
] as const;

export const REPONSES = {
  siegeAccepte:
    "Vos chiffres sont convaincants. Les deux postes restent, et le tableau du siège suivra les commandes prises au premier appel dès la semaine 9, pour tous les plateaux.",
  siegeRefuse:
    "Le décroché reste notre indicateur national, et vos plateaux le tiennent largement. Je reprends un poste à partir de la semaine 11.",
} as const;
