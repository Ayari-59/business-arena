/**
 * L'ÉQUIPE DISPERSÉE — le contenu de l'épisode.
 *
 * Benoît Le Bihan dirige les neuf technico-commerciaux itinérants d'Arvel
 * Distribution sur le Rhône, l'Ain et l'Isère : chacun sur son secteur, chez
 * les artisans et sur les chantiers, et lui les voit rarement. Les résultats
 * vont du simple au double, les comptes rendus ne remontent plus, les deux
 * plus récents se sentent seuls, et la direction propose de géolocaliser les
 * véhicules. Six décisions, chacune précédée de ce qu'un responsable
 * d'équipe itinérante reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "isolement",
    t: "L'équipe n'a ni cadre ni lien : les débutants, seuls sur leur secteur, décrochent, et les comptes rendus ne servent à personne",
  },
  {
    id: "competences",
    t: "Les deux plus récents ne savent pas encore monter un devis technique",
  },
  {
    id: "activite",
    t: "Certains ne travaillent pas assez : on ne sait pas où ils sont",
  },
  { id: "secteurs", t: "Les secteurs des moins bons sont moins porteurs" },
] as const;

const RAPHAEL = {
  de: "Marius Montagnon",
  role: "Directeur commercial régional",
} as const;
const ELODIE = {
  de: "Ambre Vasquez",
  role: "Technico-commerciale, Isère nord",
} as const;
const ALASSANE = {
  de: "Alassane Koné",
  role: "Technico-commercial, Rhône est",
} as const;
const GREGOIRE = {
  de: "Félix Matthey",
  role: "Technico-commercial, Ain",
} as const;
const KILLIAN = {
  de: "Killian Desbois",
  role: "Technico-commercial, Isère sud",
} as const;
const ANAIS = {
  de: "Anaïs Morvan",
  role: "Technico-commerciale, Bresse",
} as const;
const FARID = {
  de: "Nordine Messaoudi",
  role: "Technico-commercial, Lyon ouest",
} as const;
const JOSIANE = {
  de: "Monique Bouvier",
  role: "Assistante commerciale",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La direction veut savoir où ils sont",
    jusqua: 3,
    messages: () => [
      {
        ...RAPHAEL,
        heure: "07:40",
        alerte: true,
        texte:
          "Benoît, les résultats de ton équipe vont du simple au double : Ambre et Alassane tiennent leur budget, Anaïs et Killian en sont à la moitié. Et la moitié des comptes rendus ne sont plus remplis. Le siège propose d'équiper les véhicules d'un boîtier de géolocalisation : au moins, on saura où ils sont. Dis-moi vendredi ce que tu fais.",
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Alerte automatique",
        heure: "08:00",
        texte:
          "Marge de l'équipe la semaine dernière : 54 k€, pour un budget de 58 k€ par semaine. Comptes rendus remplis : 55 % des visites.",
      },
      {
        ...KILLIAN,
        heure: "09:10",
        texte:
          "Bonjour Benoît, une question : pour le devis de bardage de la menuiserie de Voiron, je peux descendre sous le tarif ? Je n'ai personne d'autre à qui demander.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "visites",
        titre: "Comparer les visites et les devis de chacun",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les neuf font entre 21 et 26 visites par semaine : Anaïs et Killian en font autant que les autres. Mais ils signent un devis sur cinq, contre un sur deux pour Ambre et Alassane, et ils perdent surtout les dossiers techniques : bardage, isolation, menuiseries sur mesure.",
      },
      {
        id: "appels",
        titre: "Appeler chacun des neuf, vingt minutes",
        cout: 1,
        nature: "decisive",
        resultat:
          "Killian : « Depuis mon intégration, j'ai vu l'équipe une fois. Quand je bloque sur un devis, je n'ai personne à appeler. » Anaïs dit la même chose, avec d'autres mots. Nordine : « Les comptes rendus, personne ne les lit. » Ambre : « Laisse-nous travailler, mais dis-nous où on va. »",
      },
      {
        id: "secteurs",
        titre: "Étudier le potentiel des secteurs",
        cout: 1,
        nature: "utile",
        resultat:
          "Le potentiel par commercial varie de moins de 10 % d'un secteur à l'autre. Celui de Killian, au sud de l'Isère, est même un peu au-dessus de la moyenne : son prédécesseur y faisait le budget.",
      },
      {
        id: "plaquette",
        titre: "Lire la plaquette du boîtier de géolocalisation",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le fournisseur promet « jusqu'à 20 % de visites en plus » et un tableau des kilomètres et des temps d'arrêt par véhicule. La plaquette ne parle pas de ventes.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Danielle Thévenet",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Danielle, qui dirige l'équipe itinérante de Saint-Étienne : « Avant de savoir où ils sont, demande-toi ce qu'ils attendent de toi. Et regarde ce que les moins bons ne savent pas faire, pas combien de kilomètres ils font. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à la direction, et que mettez-vous en place ?",
    options: [
      {
        t: "Équiper les véhicules et exiger un compte rendu chaque soir",
        d: "Le boîtier du siège dans les neuf véhicules, un compte rendu de journée avant 19 heures. 1 800 € d'installation, 300 € par semaine.",
      },
      {
        t: "Fixer à chacun ses objectifs de marge, et instaurer des rituels : un point individuel de vingt minutes chaque semaine, une réunion d'équipe par mois à l'agence",
        d: "Une demi-journée par semaine de votre temps au téléphone ; 1 400 € de déplacements par réunion, en semaines 4, 8 et 12.",
      },
      {
        t: "Fixer à chacun ses objectifs de marge, et ne regarder que les résultats",
        d: "Un tableau envoyé à chacun en fin de mois. Ne coûte rien.",
      },
      {
        t: "Laisser chacun s'organiser : ce sont des professionnels",
        d: "Vous restez joignable s'ils appellent. Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...ELODIE,
          texte:
            "Un boîtier dans ma voiture après douze ans de maison. Je finirai mes tournées, mais je ne vois pas ce que ça va vendre de plus.",
        },
        {
          ...RAPHAEL,
          texte: "Bien. Le siège sera content : on saura enfin où ils sont.",
        },
      ],
      [
        {
          ...ANAIS,
          texte:
            "Vingt minutes avec vous ce matin : c'est la première fois qu'on me demande comment se passent mes chantiers. Et je sais enfin ce qu'on attend de moi.",
        },
      ],
      [
        {
          ...ALASSANE,
          texte:
            "Des objectifs clairs, ça me va. Pour le reste, on se débrouille, comme d'habitude.",
        },
      ],
      [
        {
          ...RAPHAEL,
          texte:
            "Laisser faire, c'est ce qu'on fait depuis un an, Benoît. Les chiffres de Killian ne remonteront pas tout seuls.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Killian se décourage",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...KILLIAN,
        heure: "17:45",
        alerte: true,
        texte:
          "Benoît, j'ai perdu le devis de bardage de Voiron. Le troisième ce mois-ci. Je fais mes visites, je fais mes devis, et je ne signe rien. Je me demande si ce métier est fait pour moi.",
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Marge de l'équipe en semaine 3 : ${ctx.marge}. Un autonome vend ${ctx.ecart} fois plus qu'un débutant.`,
      },
      {
        ...RAPHAEL,
        heure: "18:30",
        texte: ctx.geoloc
          ? "Les boîtiers sont posés : Killian fait autant de kilomètres que les autres. Alors qu'est-ce qui coince ?"
          : "Que fais-tu pour les deux derniers ? Le budget suppose qu'ils montent en puissance ce trimestre.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "devis",
        titre: "Relire les devis perdus d'Anaïs et de Killian",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur 14 devis perdus depuis deux mois, 11 portent sur des solutions techniques. Les prix étaient dans la norme ; les dossiers, incomplets : pas de relevé sur le chantier, pas de variante, pas de calepinage. Ambre et Alassane gagnent ces devis-là deux fois sur trois.",
      },
      {
        id: "binome",
        titre: "Demander à Alassane et à Ambre s'ils prendraient un débutant en tournée",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.geoloc
            ? "Alassane : « Jouer les formateurs pendant que le siège compte mes kilomètres ? Je le ferai si tu me le demandes. Sans plus. » Ambre n'a pas répondu."
            : "Alassane : « Volontiers. À mes débuts, c'est un ancien qui m'a tout appris, sur les chantiers. » Ambre : « D'accord, si c'est avec Anaïs : on a le même genre de clients. Mais je ne promets pas d'être patiente. »",
      },
    ],
    question: "Comment faites-vous progresser Anaïs et Killian ?",
    options: [
      {
        t: "Monter deux binômes : une journée par semaine en tournée avec Alassane ou Ambre",
        d: "Pendant quatre semaines. Les deux anciens feront un peu moins de visites pour eux-mêmes. Un binôme, ça prend ou pas.",
      },
      {
        t: "Les accompagner vous-même une journée par semaine sur leurs chantiers",
        d: "Pendant quatre semaines, 350 € de déplacements par semaine. Vous connaissez les produits, moins leurs clients.",
      },
      {
        t: "Leur fixer un plan de visites renforcé : 20 % de visites en plus, suivies chaque semaine",
        d: "Plus de visites, donc plus de devis. Le suivi passe par le tableau des visites.",
      },
      {
        t: "Les encourager au téléphone : ils vont prendre leurs marques",
        d: "Un appel à chacun pour les rassurer. Rien ne change.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...KILLIAN,
          texte:
            "Mardi, on a fait le relevé ensemble chez le menuisier de Voiron. J'avais toujours chiffré sans monter sur le chantier.",
        },
      ],
      [
        {
          ...ANAIS,
          texte:
            "Vingt pour cent de visites en plus, d'accord. Mais si je perds mes devis, j'en perdrai juste davantage.",
        },
      ],
      [
        {
          ...KILLIAN,
          texte: "Merci de l'appel. Je vais m'accrocher.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Les comptes rendus ne remontent plus",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...RAPHAEL,
        heure: "08:20",
        alerte: true,
        texte:
          "Benoît, le contrôle de gestion me signale que trois de tes commerciaux n'ont rempli aucun compte rendu depuis trois semaines, dont Nordine. Sans compte rendu, pas de visibilité. Je veux que ça change.",
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Point hebdomadaire",
        heure: "08:30",
        texte: `Comptes rendus remplis la semaine dernière : ${ctx.comptesRendus} des visites.`,
      },
      ...(ctx.geoloc
        ? [
            {
              ...JOSIANE,
              heure: "09:15",
              texte:
                "Les comptes rendus du soir arrivent, mais beaucoup tiennent en trois lettres : « RAS ». Je les classe.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "outil",
        titre: "Remplir vous-même un compte rendu sur la tablette",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Douze champs obligatoires par visite, dont sept que personne n'exploite : surface du dépôt, nombre de salariés, concurrent principal… Comptez quatre minutes par visite, plus d'une heure par jour. Depuis six mois, aucun compte rendu n'a reçu de réponse.",
      },
      {
        id: "farid",
        titre: "Appeler Nordine",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Je les remplissais. Personne ne les lit. Le jour où j'ai signalé un programme de quarante logements à Bourgoin, personne ne m'a rappelé, et c'est un concurrent qui l'a eu. Si quelqu'un s'en servait, je les ferais. »",
      },
    ],
    question: "Que faites-vous des comptes rendus ?",
    options: [
      {
        t: "Envoyer un rappel écrit : compte rendu obligatoire chaque soir, avant 19 heures",
        d: "Un courrier à chacun, et la liste des retardataires chaque lundi.",
      },
      {
        t: "Réduire le compte rendu à trois lignes, et les lire",
        d: "Client, projet, prochaine étape. Vous les lisez chaque semaine et vous y répondez, au point individuel ou par écrit.",
      },
      {
        t: "Les faire remplir par Monique, à partir d'un appel le soir",
        d: "Dix minutes au téléphone par commercial. 500 € par semaine d'heures d'assistante.",
      },
      {
        t: "Laisser les comptes rendus en l'état : seuls les résultats comptent",
        d: "On ne relance personne.",
      },
    ],
    reactions: [
      [
        {
          ...FARID,
          texte: "Bien reçu. Vous aurez vos comptes rendus.",
        },
        {
          de: "Albane Grangier",
          role: "Technico-commerciale, Rhône sud",
          texte: "Une heure de saisie le soir, c'est une visite de moins le lendemain.",
        },
      ],
      [
        {
          ...FARID,
          texte:
            "Trois lignes, je peux. Et si quelqu'un répond, j'y mettrai même les chantiers que je croise pour les autres.",
        },
      ],
      [
        {
          ...JOSIANE,
          texte:
            "Les appels du soir sont calés. Certains me racontent leur journée pendant vingt minutes : ils n'ont personne d'autre à qui la raconter.",
        },
      ],
      [
        {
          ...RAPHAEL,
          texte: "Je note que tu ne changes rien. Le contrôle de gestion aussi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Ambre écoute les offres",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...GREGOIRE,
        heure: "11:30",
        alerte: true,
        texte:
          "Benoît, je préfère que tu le saches par moi : Ambre a déjeuné avec le directeur régional d'un négoce concurrent. Elle n'a rien signé, mais elle y pense.",
      },
      {
        de: "Baromètre de l'équipe",
        role: "Questionnaire du vendredi",
        heure: "17:00",
        texte: `Engagement de l'équipe : ${ctx.engagement} sur 100. Risque qu'un commercial parte dans le trimestre : ${ctx.risque}.`,
      },
    ],
    sources: [
      {
        id: "cafe",
        titre: "Prendre un café avec Ambre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.geoloc
            ? "« Ce n'est pas l'argent. Douze ans que je fais mon chiffre, et on me met un boîtier dans la voiture comme à une débutante. Là-bas, on me propose de monter une équipe grands comptes. »"
            : ctx.rituels
              ? "« Ce n'est pas l'argent. Le point du lundi, je l'aime bien, mais pour moi ce sont vingt minutes à raconter ce que je sais faire. Là-bas, on me propose de monter une équipe grands comptes. J'aimerais qu'on me confie quelque chose ici. »"
              : "« Ce n'est pas l'argent. Je ne sais jamais si ce que je fais compte, ni où va l'équipe. Là-bas, on me propose de monter une équipe grands comptes. »",
      },
      {
        id: "rh",
        titre: "Demander aux ressources humaines ce que coûterait son départ",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un remplacement : 7 000 € de cabinet, et trois mois avant qu'une recrue soit à son niveau. Ses clients suivent rarement un remplaçant : en général, un sur trois reste chez Arvel.",
      },
    ],
    question: "Que faites-vous avec Ambre ?",
    options: [
      {
        t: "Lui donner plus d'autonomie et une mission : référente des grands comptes de l'équipe",
        d: "Un point tous les quinze jours au lieu de chaque semaine, ses grands comptes en pleine main, et les sujets techniques à animer avec les collègues.",
      },
      {
        t: "S'aligner sur l'offre : 600 € de plus par mois",
        d: "Marius donne son accord. 900 € d'ici la fin du trimestre.",
      },
      {
        t: "Lui rappeler que le cadre vaut pour tout le monde",
        d: "Mêmes règles, mêmes outils, mêmes points pour tous. L'équité avant tout.",
      },
      {
        t: "Ne rien faire : si elle veut partir, elle partira",
        d: "Vous n'abordez pas le sujet.",
      },
    ],
    reactions: [
      [
        {
          ...ELODIE,
          texte: "Référente grands comptes… Je ne m'y attendais pas. Laisse-moi le week-end.",
        },
      ],
      [
        {
          ...ELODIE,
          texte: "Merci pour le geste. Je vais réfléchir.",
        },
      ],
      [
        {
          ...ELODIE,
          texte: "Compris. Les mêmes règles pour tous.",
        },
      ],
      [
        {
          ...GREGOIRE,
          texte: "Elle n'en parle plus. Mais elle a pris un deuxième déjeuner.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Une nouvelle gamme à lancer",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Marketing",
        role: "Siège",
        heure: "09:00",
        alerte: true,
        texte:
          "Le fabricant lance sa gamme d'isolation thermique par l'extérieur en semaine 11. Les artisans la demandent ; c'est un produit technique, qui se vend sur le chantier, relevé et devis à l'appui.",
      },
      {
        ...RAPHAEL,
        heure: "10:15",
        texte:
          "Benoît, ta réunion de la semaine 10 tombe bien pour lancer la gamme. Qu'est-ce que tu prévois ?",
      },
      ...(ctx.killianParti
        ? [
            {
              ...JOSIANE,
              heure: "11:00",
              texte:
                "Le secteur de Killian est réparti entre Alassane et Jérémy en attendant un recrutement. Les clients demandent qui va passer.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "bardage",
        titre: "Relire le lancement de la gamme bardage, l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Lancée par l'envoi de la documentation : trois commerciaux sur neuf en ont vendu dans le trimestre, toujours les mêmes. L'équipe de Saint-Étienne l'avait lancée en atelier entre commerciaux, chacun avec un chantier réel : huit sur dix en vendaient le mois suivant.",
      },
      {
        id: "fabricant",
        titre: "Demander au fabricant ce qu'il propose",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une demi-journée de formation en visio avec leur technicien, 900 €. Ou la documentation et les fiches de pose, gratuites.",
      },
    ],
    question: "Comment lancez-vous la gamme ?",
    options: [
      {
        t: "Faire de la réunion un atelier entre pairs : les meilleurs montrent un chantier réel, puis chacun prépare un devis",
        d: "Une journée entière à l'agence, en présentiel. 1 600 € de déplacements et de repas, et une journée sans visites.",
      },
      {
        t: "Envoyer la documentation et les fiches de pose à chacun",
        d: "Gratuit. Chacun s'y met à son rythme.",
      },
      {
        t: "Lancer un challenge : classement chaque lundi, une prime au premier",
        d: "2 000 € de prime en fin de trimestre. Les ventes de la gamme affichées chaque semaine.",
      },
      {
        t: "Faire former l'équipe par le technicien du fabricant, en visio",
        d: "Une demi-journée, 900 €.",
      },
    ],
    reactions: [
      [
        {
          ...JOSIANE,
          texte:
            "Atelier calé pour mardi à l'agence. Alassane a déjà choisi son chantier, et chacun apporte un devis en cours.",
        },
      ],
      [
        {
          de: "Jérémy Tisserand",
          role: "Technico-commercial, Beaujolais",
          texte: "Bien reçu la documentation. Je regarde ça dès que j'ai un moment.",
        },
      ],
      [
        {
          ...GREGOIRE,
          texte: "Un challenge, j'aime bien. Je compte le gagner.",
        },
        {
          ...ANAIS,
          texte: "Je finirai dernière, comme d'habitude.",
        },
      ],
      [
        {
          de: "Fabricant",
          role: "Service technique",
          texte: "Notre technicien interviendra mardi en visio, de 9 heures à midi.",
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
        ...RAPHAEL,
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant la clôture. Marge nette de ton équipe à date : ${ctx.cumul}, pour un budget à date de ${ctx.budgetADate}. Qu'est-ce que tu fais pour finir ?`,
      },
    ],
    sources: [
      {
        id: "encours",
        titre: "Passer en revue les devis en cours de l'équipe",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "71 devis ouverts de plus de 5 000 €. Quatre sur dix attendent depuis plus de dix jours une réponse technique, un prix à valider ou une visite à deux. Les commerciaux ne relancent pas ce qu'ils ne savent pas débloquer.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Un point téléphonique chaque matin avec chacun, et l'état des devis chaque soir",
        d: "Jusqu'à la clôture. Vous saurez tout, chaque jour.",
      },
      {
        t: "Revoir avec chacun ses cinq plus gros devis, et ce qu'il lui faut pour conclure",
        d: "Une validation de prix, une réponse technique, une visite à deux : vous débloquez ce qui attend.",
      },
      {
        t: "Autoriser trois points de remise pour conclure avant la clôture",
        d: "Les commerciaux ont la main jusqu'à la fin du trimestre. Les artisans suivront, ou pas.",
      },
      {
        t: "Laisser chacun finir son trimestre",
        d: "Ils connaissent leurs clients.",
      },
    ],
    reactions: [
      [
        {
          ...FARID,
          texte:
            "Le point de 8 heures, puis l'état des devis à 19 heures. Je passe plus de temps au téléphone avec vous qu'avec mes clients.",
        },
      ],
      [
        {
          ...ALASSANE,
          texte:
            "Tu m'as validé le prix du chantier de Meyzieu en dix minutes. Signé ce matin. Il attendait depuis deux semaines.",
        },
      ],
      null,
      [
        {
          ...RAPHAEL,
          texte: "Bien. On fera les comptes à la clôture.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Objectifs, rituels et pairs", chemin: [1, 0, 1, 0, 0, 1] },
  { nom: "Contrôler l'activité", chemin: [0, 2, 0, 2, 2, 0] },
  { nom: "Laisser chacun faire", chemin: [3, 3, 3, 3, 1, 3] },
] as const;

/**
 * Les réflexes du métier face à une équipe qu'on ne voit pas : la surveiller
 * (boîtier, comptes rendus exigés, points quotidiens) ou la laisser faire.
 * [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 0],
  [2, 3],
  [3, 2],
  [3, 3],
  [5, 0],
  [5, 3],
] as const;

export const REPONSES = {
  deuxBinomes: [
    {
      ...ALASSANE,
      texte:
        "Première tournée avec Killian : il pose les bonnes questions, et il a enfin vu un relevé de chantier. Il ira vite.",
    },
    {
      ...ANAIS,
      texte:
        "Ambre m'a montré comment elle monte un dossier d'isolation, de la visite au devis. J'ai tout noté.",
    },
  ],
  binomeKillian: [
    {
      ...ALASSANE,
      texte: "Première tournée avec Killian : il pose les bonnes questions. Il ira vite.",
    },
    {
      ...ANAIS,
      texte:
        "La journée avec Ambre a été longue. Elle va vite, explique peu, et je n'ose pas lui demander de répéter.",
    },
  ],
  binomeAnais: [
    {
      ...KILLIAN,
      texte:
        "Avec Alassane, on ne s'est pas trouvés. Il fait ses visites, je le suis, et le soir je ne sais pas ce que j'ai appris.",
    },
    {
      ...ANAIS,
      texte:
        "Ambre m'a montré comment elle monte un dossier d'isolation, de la visite au devis. J'ai tout noté.",
    },
  ],
  aucunBinome: [
    {
      ...KILLIAN,
      texte:
        "Avec Alassane, on ne s'est pas trouvés. Il fait ses visites, je le suis, et le soir je ne sais pas ce que j'ai appris.",
    },
    {
      ...ANAIS,
      texte:
        "La journée avec Ambre a été longue. Elle va vite, explique peu, et je n'ose pas lui demander de répéter.",
    },
  ],
  remiseSuivie:
    "Les artisans ont sauté sur la remise : trois commandes avancées rien que dans l'Ain cette semaine.",
  remiseIgnoree:
    "La remise ne fait bouger personne : les artisans commandent quand le chantier démarre, pas avant. Et ceux qui commandaient de toute façon ont pris les trois points.",
  binomeReticent:
    "Je tourne avec Killian comme tu me l'as demandé. Mais entre le boîtier et le compte rendu du soir, je n'ai pas la tête à transmettre.",
  elodieReste:
    "J'ai décliné l'offre. Je reste, et je compte bien faire quelque chose de ce qu'on m'a confié.",
  elodiePart:
    "Benoît, j'ai accepté l'offre. Je pars à la fin du mois, en solde de congés. Ce n'est pas contre toi.",
  killianPart:
    "Benoît, je démissionne. Je fais mes visites, je ne signe rien, et je ne vois pas comment ça va changer. Je pars à la fin de mon préavis, en solde de congés.",
} as const;
