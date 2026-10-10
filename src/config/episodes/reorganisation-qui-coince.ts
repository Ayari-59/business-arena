/**
 * LA RÉORGANISATION QUI COINCE — le contenu de l'épisode.
 *
 * Isabelle Fontanel dirige les ventes de la région lyonnaise d'Arvel
 * Distribution : quatorze commerciaux répartis dans quatre agences. La
 * direction a décidé de les organiser par type de clients (grands comptes
 * d'un côté, artisans de l'autre) avec un nouvel outil de suivi, et veut tout
 * en place en semaine 13. L'annonce a été mal reçue, deux anciens freinent
 * ouvertement, l'outil reste vide. Six décisions, chacune précédée de ce
 * qu'une responsable reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "objections",
    t: "L'équipe n'est pas contre l'organisation : ses objections (ses clients, l'outil) n'ont pas été entendues, et les deux anciens entraînent les autres",
  },
  {
    id: "rythme",
    t: "Le calendrier est trop brutal : faire tout basculer d'un coup n'est pas tenable",
  },
  {
    id: "outil",
    t: "L'outil de suivi est mal conçu : tant qu'il n'est pas changé, rien n'avancera",
  },
  {
    id: "anciens",
    t: "Deux commerciaux de l'ancienne école bloquent par principe : il faut les recadrer",
  },
] as const;

const MARC = { de: "Marc Delaunay", role: "Directeur commercial" } as const;
const PATRICK = { de: "Patrick Vial", role: "Commercial, Villefranche" } as const;
const SYLVIE = { de: "Sylvie Charrier", role: "Commerciale, Gerland" } as const;
const YANIS = { de: "Yanis Belkacem", role: "Commercial, Villeurbanne" } as const;
const CAMILLE = { de: "Camille Rey", role: "Commerciale, Vénissieux" } as const;
const TABLEAU = { de: "Tableau de bord de la région", role: "Point hebdomadaire" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "L'annonce a mal pris",
    jusqua: 3,
    messages: () => [
      {
        ...MARC,
        heure: "07:50",
        texte:
          "Isabelle, j'ai eu des échos de la réunion de jeudi. Le comité de direction a validé : la nouvelle organisation doit être complète en semaine 13. Je compte sur toi.",
      },
      {
        ...PATRICK,
        heure: "08:40",
        alerte: true,
        texte:
          "Vingt-sept ans que je suis mes artisans. On me demande de les lâcher à quelqu'un qu'ils n'ont jamais vu, et de remplir des fiches le soir. Ce sera sans moi.",
      },
      {
        ...SYLVIE,
        heure: "09:15",
        texte: "On l'a appris par un mail du siège. Personne ne nous a demandé notre avis.",
      },
      {
        ...TABLEAU,
        heure: "10:00",
        texte:
          "Chiffre d'affaires de la semaine dernière : 404 k€, pour 420 k€ habituellement. Outil de suivi : 16 % des visites saisies.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "entretiens",
        titre: "Recevoir Patrick et Sylvie, chacun en tête-à-tête",
        cout: 1,
        nature: "decisive",
        resultat:
          "Ni l'un ni l'autre ne conteste l'idée : « Les grands comptes, on les sert mal, c'est vrai. » Ils refusent deux choses : lâcher du jour au lendemain les artisans qu'ils suivent depuis vingt ans, un tiers de leur chiffre, et une fiche de douze champs à remplir sur un ordinateur portable, impossible dans le camion. Sylvie : « Si on m'avait demandé, j'aurais dit comment faire. »",
      },
      {
        id: "regions",
        titre: "Demander aux autres régions comment elles s'y sont prises",
        cout: 1,
        nature: "decisive",
        resultat:
          "L'Auvergne a tout basculé d'un coup l'an dernier : −14 % de chiffre pendant huit semaines, deux départs, et des fiches vides dans l'outil trois mois après. La Bourgogne a commencé par un pilote de quatre volontaires, puis deux vagues : −4 % pendant cinq semaines, puis +6 % au-dessus de l'ancien niveau, et huit visites sur dix vraiment suivies.",
      },
      {
        id: "agences",
        titre: "Comparer les résultats des quatre agences",
        cout: 1,
        nature: "bruit",
        resultat:
          "Sur le mois, Villefranche fait −4 %, Gerland −2 %, Vénissieux −1 %, Villeurbanne +1 %. Des écarts habituels pour la saison, qui ne suivent pas la carte des mécontents.",
      },
      {
        id: "barometre",
        titre: "Faire passer un questionnaire anonyme à l'équipe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Douze réponses sur quatorze. Huit trouvent l'idée des grands comptes « logique ». Neuf craignent de perdre leurs clients, dix jugent l'outil trop lourd. Indice d'adhésion : 38 sur 100.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Agnès, aux ressources humaines",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Agnès : « Les gens résistent moins au changement qu'à ce qu'on leur retire sans leur demander. Commence par ceux qui parlent fort : ce sont souvent ceux que les autres écoutent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment répondez-vous à l'équipe cette semaine ?",
    options: [
      {
        t: "Tenir la ligne : rappeler la règle à Patrick et Sylvie, devant l'équipe",
        d: "Un rappel à l'ordre clair à la réunion de lundi. Aucun coût.",
      },
      {
        t: "Recevoir chaque commercial, Patrick et Sylvie d'abord, pour lister les objections",
        d: "Quatorze entretiens d'une heure en deux semaines. Aucun coût, mais votre agenda y passe.",
      },
      {
        t: "Réunir toute l'équipe pour réexpliquer le projet",
        d: "Une demi-journée en plénière avec le directeur commercial. 2 500 €.",
      },
      {
        t: "Laisser retomber la pression avant d'en reparler",
        d: "Ne rien dire pendant quelques semaines. Chacun reprend ses tournées.",
      },
    ],
    reactions: [
      [
        { ...PATRICK, texte: "Message reçu. Je ferai ce qu'on me dit, ni plus ni moins." },
        { ...YANIS, texte: "Ambiance glaciale au café ce matin. Personne n'a parlé du projet." },
      ],
      [
        {
          ...SYLVIE,
          texte:
            "Merci de m'avoir écoutée. Si je pouvais garder mes artisans le temps de les présenter à celui qui les reprend, je ne dirais pas non.",
        },
      ],
      [
        {
          ...YANIS,
          texte:
            "Beaucoup de diapositives, peu de questions. Personne n'a posé celle qui fâche : qui garde quels clients.",
        },
      ],
      [{ ...MARC, texte: "Isabelle, je n'entends plus parler du projet. Où en est-on ?" }],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "La bascule de lundi",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...MARC,
        heure: "09:10",
        alerte: true,
        texte:
          "Le plan prévoit la bascule de toute l'équipe lundi : portefeuilles réaffectés, grands comptes d'un côté, artisans de l'autre. Je te laisse la main sur la façon de faire. Pas sur l'échéance de la semaine 13.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Chiffre d'affaires de la semaine 3 : ${ctx.ca}. Indice d'adhésion : ${ctx.adhesion}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "volontaires",
        titre: "Demander qui serait volontaire pour commencer",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.ecoute
            ? "Quatre volontaires à Villeurbanne et à Gerland, dont Sylvie, à condition de garder ses artisans historiques le temps de les présenter à leur nouveau commercial. Ensemble, 30 % du chiffre de la région."
            : "Deux mains se lèvent, timidement : Yanis et Camille, les plus jeunes. Les autres attendent de voir. Il faudrait en désigner deux de plus pour couvrir 30 % du chiffre.",
      },
      {
        id: "passation",
        titre: "Regarder ce que devient un client qui change de commercial",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les deux dernières années : quand le commercial sortant présente lui-même son successeur, le client reste neuf fois sur dix. Quand il apprend le changement par courrier, une fois sur quatre il va voir ailleurs le temps de s'habituer.",
      },
    ],
    question: "Comment lancez-vous la nouvelle organisation ?",
    options: [
      {
        t: "Basculer toute l'équipe lundi, comme prévu",
        d: "Les quatorze portefeuilles réaffectés d'un coup. Formation de tous : 7 000 €.",
      },
      {
        t: "Commencer par un pilote de quatre semaines avec des volontaires",
        d: "Quatre commerciaux, 30 % du chiffre. 3 000 € d'accompagnement et 2 100 € de formation.",
      },
      {
        t: "Basculer d'abord les grands comptes, avec quatre commerciaux désignés",
        d: "Les quatre plus gros portefeuilles, 30 % du chiffre. 2 100 € de formation.",
      },
      {
        t: "Repousser la bascule de quelques semaines",
        d: "Le temps que l'équipe se fasse à l'idée. La semaine 13 se rapproche.",
      },
    ],
    reactions: [
      [
        {
          ...PATRICK,
          texte:
            "Mes clients ont reçu un courrier leur annonçant un nouveau commercial. Trois m'ont appelé pour savoir si j'étais malade.",
        },
        {
          ...CAMILLE,
          texte: "Je découvre soixante clients que je n'ai jamais vus. Par où je commence ?",
        },
      ],
      [
        {
          ...YANIS,
          texte:
            "On démarre lundi à quatre. On s'est fixé un point chaque vendredi avec toi, et on note tout ce qui coince.",
        },
      ],
      [
        {
          ...CAMILLE,
          texte:
            "On m'a mise sur les grands comptes. Pourquoi pas, mais j'aurais aimé qu'on me le demande.",
        },
      ],
      [
        {
          ...MARC,
          texte: "Repousser, d'accord. Mais jusqu'à quand ? La semaine 13 ne bougera pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "L'outil reste vide",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...MARC,
        heure: "11:30",
        alerte: true,
        texte: `Le siège me signale que ta région est dernière sur l'outil de suivi : ${ctx.saisies} des visites saisies. Je te propose de rendre la saisie obligatoire : pas de fiche, pas de visite comptée dans la prime.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Usage réel de l'outil (fiches qui disent ce qui a été proposé et la suite) : ${ctx.usage}. Nouvelle organisation en place : ${ctx.deploiement}.`,
      },
    ],
    sources: [
      {
        id: "fiches",
        titre: "Ouvrir vingt fiches au hasard dans l'outil",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur vingt fiches, six seulement disent ce qui a été proposé et quelle est la prochaine étape. Les autres : « visite RAS », saisies le vendredi soir. La fiche compte douze champs, et l'outil ne fonctionne pas sur téléphone.",
      },
      {
        id: "freins",
        titre: "Demander à trois commerciaux ce qui les retient",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Douze champs, sur un portable qu'on n'ouvre pas dans le camion. » « Je ne vois pas ce que ça m'apporte : les grands comptes ne me renvoient jamais rien. » Aucun ne dit qu'il ne sait pas s'en servir.",
      },
    ],
    question: "Que faites-vous de l'outil ?",
    options: [
      {
        t: "Rendre la saisie obligatoire et la contrôler chaque semaine",
        d: "Pas de fiche, pas de visite comptée dans la prime. Aucun coût ; le taux de saisie montera vite.",
      },
      {
        t: "Simplifier l'outil avec un groupe de commerciaux",
        d: "Deux ateliers, puis l'éditeur adapte la fiche : quatre champs, saisie sur téléphone. 6 000 €, livraison annoncée en semaine 7.",
      },
      {
        t: "Former toute l'équipe à l'outil pendant une journée",
        d: "Un formateur de l'éditeur, quatorze commerciaux hors tournée pendant une journée. 5 000 €.",
      },
      {
        t: "Laisser l'usage venir avec le temps",
        d: "Ceux qui y trouvent un intérêt s'y mettront.",
      },
    ],
    reactions: [
      [
        {
          ...SYLVIE,
          texte:
            "J'ai rempli mes fiches. « Visite RAS », quarante fois. Tout le monde fait pareil.",
        },
      ],
      null,
      [
        {
          ...YANIS,
          texte: "La formation était bien faite. Mais la fiche a toujours douze champs.",
        },
      ],
      [{ ...MARC, texte: "Le siège relance. Je ne vais pas pouvoir te couvrir longtemps." }],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Patrick",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Agnès Thibault",
        role: "Ressources humaines",
        heure: "10:20",
        alerte: true,
        texte:
          "Isabelle, un concurrent a approché Patrick. Il ne s'en est pas caché à la machine à café. S'il part, une partie de ses artisans le suivra.",
      },
      ...(ctx.pilote === "reussi"
        ? [
            {
              ...YANIS,
              heure: "12:05",
              texte:
                "Depuis la fin du pilote, les collègues viennent nous voir : trois m'ont demandé comment on s'organise avec les grands comptes.",
            },
          ]
        : ctx.pilote === "echoue"
          ? [
              {
                ...YANIS,
                heure: "12:05",
                texte:
                  "Depuis la fin du pilote, les collègues nous regardent comme des cobayes. Personne ne demande à être le prochain.",
              },
            ]
          : []),
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Indice d'adhésion : ${ctx.adhesion}. Nouvelle organisation en place : ${ctx.deploiement}.`,
      },
    ],
    sources: [
      {
        id: "dejeuner",
        titre: "Déjeuner avec Patrick",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.ecoute
            ? "Patrick : « Tu m'as écouté au début du trimestre, je te le reconnais. Mais je ne veux pas finir à faire de la saisie pour les jeunes. Les grands comptes, je les connais tous : ces gens-là me font confiance. » Il ne parle pas du concurrent, et il demande ce qu'on attend de lui."
            : "Patrick reste poli et fermé : « Vous avez décidé sans moi, faites sans moi. » Il laisse entendre que l'offre du concurrent est sérieuse.",
      },
      {
        id: "influence",
        titre: "Regarder qui écoute Patrick",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Cinq des quatorze commerciaux ont débuté avec lui ; trois disent attendre de voir ce qu'il fera avant de basculer. Ses quarante artisans pèsent près de 10 % du chiffre de la région.",
      },
    ],
    question: "Que faites-vous avec Patrick ?",
    options: [
      {
        t: "Lui proposer d'être référent grands comptes et de construire la passation de ses clients",
        d: "Un vrai rôle et une prime de référent de 1 500 €. Il peut dire non.",
      },
      {
        t: "Le recadrer par écrit",
        d: "Un entretien formel avec les ressources humaines, et un courrier. Aucun coût.",
      },
      {
        t: "Le laisser travailler à l'ancienne, hors du projet",
        d: "Il garde ses clients et son organisation. 10 % du chiffre resteront en dehors.",
      },
      {
        t: "Ne rien faire et attendre qu'il se décide",
        d: "S'il part, il part.",
      },
    ],
    reactions: [
      null,
      [{ ...PATRICK, alerte: true, texte: "J'ai signé le courrier. Pour le reste, on verra." }],
      [
        {
          ...CAMILLE,
          texte:
            "Patrick garde ses clients ? Donc il suffisait de refuser pour être tranquille. J'en connais qui vont s'en souvenir.",
        },
      ],
      [
        {
          ...YANIS,
          texte: "Patrick passe ses journées au téléphone. Personne ne sait avec qui.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "La semaine 13 approche",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...MARC,
        heure: "08:45",
        alerte: true,
        texte: `Il reste quatre semaines. Le comité de direction attend la nouvelle organisation complète en semaine 13 ; aujourd'hui, ${ctx.deploiement} de la région y est. Comment finis-tu ?`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Chiffre d'affaires de la semaine 9 : ${ctx.ca}. Usage réel de l'outil : ${ctx.usage}, pour ${ctx.saisies} de visites saisies.`,
      },
    ],
    sources: [
      {
        id: "passations",
        titre: "Regarder comment se sont passées les passations déjà faites",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.deploiement} des portefeuilles sont passés. Ceux qui ont été présentés au client par un collègue ont perdu deux fois moins de chiffre que ceux annoncés par courrier. Et quand toute une agence bascule la même semaine, personne n'a le temps d'accompagner personne.`,
      },
    ],
    question: "Comment finissez-vous le déploiement ?",
    options: [
      {
        t: "Basculer tous les autres lundi",
        d: "Tout est en place en semaine 10. La formation se paie au prorata des portefeuilles.",
      },
      {
        t: "Basculer le reste en deux vagues, chaque nouveau en binôme avec un commercial déjà passé",
        d: "Semaines 10 et 12, la première visite faite à deux chez le client. 2 000 € de temps de binôme, plus la formation.",
      },
      {
        t: "Laisser chacun basculer quand il se sent prêt",
        d: "Pas de date imposée : chacun choisit sa semaine.",
      },
      {
        t: "Reporter la suite au trimestre prochain",
        d: "Dire à la direction que la semaine 13 ne sera pas tenue.",
      },
    ],
    reactions: [
      [
        {
          ...CAMILLE,
          texte: "Soixante nouveaux clients d'un coup, et personne pour me les présenter.",
        },
      ],
      [
        {
          de: "Nicolas Garnier",
          role: "Commercial, Vénissieux",
          texte:
            "J'ai fait mes trois premières visites avec Yanis. Les clients savaient déjà qui j'étais.",
        },
      ],
      [
        {
          ...MARC,
          texte:
            "Chacun quand il veut ? Je crains qu'à ce rythme, certains ne se sentent jamais prêts.",
        },
      ],
      [
        {
          ...MARC,
          texte: "Je le dirai au comité. Je ne vais pas te cacher que ça ne me fait pas plaisir.",
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
        ...MARC,
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant la fin du trimestre. La région est ${ctx.ecart} à date. Je veux des résultats, et la nouvelle organisation qui tourne.`,
      },
      ...(ctx.patrickParti
        ? [
            {
              de: "Agnès Thibault",
              role: "Ressources humaines",
              heure: "14:00",
              texte:
                "Le remplaçant de Patrick ne sera pas là avant deux mois. Ses artisans sont répartis entre Villefranche et Gerland en attendant.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "usage",
        titre: "Comparer, commercial par commercial, les saisies et l'usage réel",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `L'outil affiche ${ctx.saisies} de visites saisies ; ${ctx.usage} disent vraiment quelque chose. L'écart tient surtout à quelques commerciaux à qui personne n'a montré à quoi la fiche sert aux autres. Là où un collègue l'a fait, l'usage a doublé en deux semaines.`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Afficher chaque lundi le classement des saisies et du chiffre de chacun",
        d: "Un tableau au mur de chaque agence. Aucun coût.",
      },
      {
        t: "Mesurer l'usage réel avec l'équipe et faire raconter les premiers succès",
        d: "Une réunion par agence, les pilotes témoignent, une aide pour ceux qui décrochent. 1 000 €.",
      },
      {
        t: "Lancer un challenge sur le chiffre des deux dernières semaines",
        d: "Une prime pour les meilleurs vendeurs. 6 000 € de primes.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre se finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          ...SYLVIE,
          texte: "Je suis remontée dans le classement : j'ai rempli trente fiches dimanche soir.",
        },
      ],
      [
        {
          ...YANIS,
          texte:
            "J'ai raconté comment un grand compte nous a passé une commande d'artisan grâce à une fiche. Deux collègues m'ont demandé de leur montrer.",
        },
      ],
      [
        {
          ...CAMILLE,
          texte: "Le challenge marche : tout le monde vend. Plus personne n'ouvre l'outil.",
        },
      ],
      [{ ...MARC, texte: "Le trimestre se termine. On fera le point lundi." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Faire adhérer", chemin: [1, 1, 1, 0, 1, 1] },
  { nom: "Imposer et contrôler", chemin: [0, 0, 0, 1, 0, 0] },
  { nom: "Attendre que ça passe", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/** Les options qui imposent ou contrôlent, le réflexe sous la pression de l'échéance : [décision, option]. */
export const INJONCTIONS = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 1],
  [4, 0],
  [5, 0],
] as const;

/** Les options qui cèdent ou reportent, l'autre réflexe : [décision, option]. */
export const RECULS = [
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 2],
  [3, 3],
  [4, 2],
  [4, 3],
] as const;

export const REPONSES = {
  livraisonALHeure:
    "Les ateliers ont été efficaces : la fiche à quatre champs et l'application sur téléphone seront livrées en semaine 7, comme prévu.",
  livraisonEnRetard:
    "Les ateliers ont été efficaces, mais notre équipe est prise ailleurs : la nouvelle fiche ne sera livrée qu'en semaine 10. Nous en sommes désolés.",
  outilLivre:
    "La nouvelle fiche est en ligne : quatre champs, saisie sur téléphone, et les grands comptes voient ce que les artisans demandent.",
  patrickAccepte:
    "D'accord pour être référent. Je présenterai moi-même mes clients à ceux qui les reprennent : personne ne les connaît mieux que moi.",
  patrickRefuse:
    "Référent ? On veut m'acheter avec une prime pour que je fasse passer la pilule aux autres. Non merci.",
  sylvieVolontaire:
    "Je fais partie du pilote. J'ai obtenu de garder mes artisans historiques le temps de les présenter : on verra bien.",
  piloteReussi:
    "Fin du pilote : après deux semaines difficiles, nos portefeuilles font mieux qu'avant, et l'outil nous sert à nous passer des affaires.",
  piloteEchoue:
    "Fin du pilote : des clients perdus pendant les passations, et beaucoup de temps passé dans l'outil. On continue, mais l'équipe a vu que ça ne marchait pas.",
  patrickPart:
    "Isabelle, j'ai accepté l'offre d'un concurrent. Je pars à la fin du mois. Je ne vais pas te mentir : certains de mes clients me suivront.",
} as const;
