/**
 * LE CLIENT QUI S'EN VA — le contenu de l'épisode.
 *
 * Arthur Barbier est responsable de la relation client des artisans d'Arvel
 * Distribution dans l'Est lyonnais : neuf cent vingt artisans actifs, six
 * agences, huit commerciaux terrain. Le nombre d'artisans actifs baisse
 * doucement depuis six mois ; le marketing propose un programme de points, les
 * commerciaux réclament des remises, et personne ne sait pourquoi les clients
 * s'en vont. Six décisions, chacune précédée de ce qu'un responsable reçoit
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
    id: "irritant",
    t: "Un irritant précis fait partir les artisans sans bruit : l'attente au comptoir à l'ouverture",
  },
  {
    id: "facturation",
    t: "Les erreurs de facturation exaspèrent les artisans, qui finissent par aller ailleurs",
  },
  {
    id: "prix",
    t: "Les concurrents sont moins chers : les artisans partent pour le prix",
  },
  {
    id: "marche",
    t: "Le marché se contracte : des artisans cessent leur activité ou partent à la retraite",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les artisans s'en vont sans bruit",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord clients",
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Artisans actifs (au moins une commande sur huit semaines) : 920, contre 985 il y a six mois. Réclamations reçues la semaine dernière : 4, comme d'habitude.",
      },
      {
        de: "Isaure Sarrazin",
        role: "Directrice commerciale régionale",
        heure: "08:45",
        texte:
          "Arthur, on perd des artisans tous les mois et personne ne sait dire pourquoi. Le marketing a un programme de points prêt à partir, les commerciaux veulent des remises. Dis-moi vendredi ce que tu fais.",
      },
      {
        de: "Grégory Tavares",
        role: "Chef des ventes",
        heure: "09:20",
        texte:
          "Mes gars me le disent tous : les concurrents cassent les prix. Donne-nous 1,5 % à négocier client par client, et on les garde.",
      },
      {
        de: "Clément Aubry",
        role: "Chef de projet fidélisation, siège",
        heure: "10:05",
        texte:
          "Le programme « Arvel Pro+ » est prêt : un point par euro acheté, pour tous les artisans, lancement possible en semaine 3. Il ne manque que ton feu vert.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "entretiens",
        titre: "Appeler vingt artisans partis ces six derniers mois",
        cout: 1.5,
        nature: "decisive",
        resultat:
          "Treize sur vingt citent l'attente au comptoir le matin : « Vingt-cinq minutes à 7 heures pour un sac de colle, je perds ma matinée de chantier. » Quatre parlent d'erreurs sur leurs factures, trois du prix. Aucun ne s'était plaint avant de partir : « À quoi bon ? Je suis allé ailleurs. »",
      },
      {
        id: "frequence",
        titre: "Extraire la fréquence de commande de chaque artisan actif",
        cout: 1,
        nature: "decisive",
        resultat:
          "116 artisans actifs ont vu leurs commandes baisser de 40 % ou plus en huit semaines, dont Kaya Rénovation, notre premier client artisan ; il y a un an, ils étaient une soixantaine. Neuf artisans partis sur dix sont passés par cette baisse pendant deux à trois mois avant de disparaître. Six seulement avaient fait une réclamation.",
      },
      {
        id: "prix",
        titre: "Comparer nos prix à ceux des deux principaux concurrents",
        cout: 1,
        nature: "bruit",
        resultat:
          "Sur les cinquante références les plus vendues aux artisans, Arvel est 1,2 % plus cher en moyenne, exactement comme il y a un an. L'écart n'a pas bougé pendant que les départs augmentaient.",
      },
      {
        id: "reclamations",
        titre: "Relire les réclamations du semestre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Quatre à cinq réclamations par semaine, un chiffre stable. Deux sur trois portent sur des erreurs de facturation : des remises mal appliquées depuis la nouvelle grille tarifaire. Presque aucune ne vient d'un artisan parti depuis.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Isaure",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Isaure : « Avant de payer tout le monde pour rester, demande à ceux qui sont partis pourquoi ils sont partis. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Lancer le programme de points pour tous les artisans",
        d: "Le programme du marketing, dès la semaine 3. 5 000 € de lancement, puis environ 2 000 € de points utilisés par semaine.",
      },
      {
        t: "Faire interroger des artisans partis, et dresser la liste de ceux dont les commandes baissent",
        d: "Lina appelle vingt artisans partis et suit la fréquence de commande de chacun, mise à jour chaque lundi. 2 500 €, premiers résultats en semaine 2.",
      },
      {
        t: "Donner aux commerciaux une enveloppe de remises à négocier",
        d: "1,5 % supplémentaire, accordé client par client à ceux qui le demandent. Environ 1 500 € par semaine.",
      },
      {
        t: "Attendre le printemps",
        d: "Les chantiers reprennent : les commandes reviendront avec eux.",
      },
    ],
    reactions: [
      [
        {
          de: "Clément Aubry",
          role: "Chef de projet fidélisation, siège",
          texte:
            "Arvel Pro+ est lancé : 610 artisans inscrits en dix jours ! Nos plus gros clients ont déjà cumulé des milliers de points.",
        },
      ],
      [
        {
          de: "Lina Mansouri",
          role: "Chargée d'études clients",
          texte:
            "J'ai appelé les vingt. Ce qui revient le plus, c'est l'attente au comptoir le matin, pas le prix. Et la liste des artisans dont les commandes baissent est prête : vous l'aurez chaque lundi.",
        },
      ],
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte:
            "Merci. Une centaine d'artisans ont déjà eu leur remise, surtout nos gros clients, qui la réclamaient depuis longtemps.",
        },
      ],
      [
        {
          de: "Isaure Sarrazin",
          role: "Directrice commerciale régionale",
          texte:
            "Le printemps, c'est aussi la saison où les autres négoces viennent chercher nos clients. Qu'est-ce qui change, concrètement ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le comptoir du matin",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Ophélie Carré",
        role: "Cheffe du comptoir, agence de Vénissieux",
        heure: "07:10",
        alerte: true,
        texte:
          "Ce matin à 7 heures, onze artisans dans la file et un seul vendeur. Deux sont repartis sans rien acheter. C'est comme ça tous les jours depuis la réorganisation de septembre.",
      },
      {
        de: "Laetitia Vigneron",
        role: "Administration des ventes",
        heure: "11:20",
        texte:
          "Pour information : 4 % des factures des comptes artisans repartent en avoir, à cause de remises mal appliquées depuis la nouvelle grille. C'est notre premier motif de réclamation.",
      },
      {
        de: "Tableau de bord clients",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 3 : ${ctx.actifs} artisans actifs, ${ctx.reclamations} réclamations dans la semaine.${
          ctx.liste ? ` Artisans dont les commandes baissent : ${ctx.enBaisse}.` : ""
        }`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "chrono",
        titre: "Chronométrer l'attente au comptoir à l'ouverture",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Entre 6 h 30 et 8 h 30, un artisan attend en moyenne ${ctx.attente} à Vénissieux, Bron et Meyzieu, contre 8 il y a un an. Depuis septembre, un seul vendeur ouvre le comptoir, et les commandes passées la veille ne sont préparées qu'à l'arrivée du client. Après 9 heures, l'attente tombe à cinq minutes. Avec la saison, la file s'allonge chaque semaine.`,
      },
      {
        id: "partis",
        titre: "Relire ce que disent les artisans partis",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.liste
            ? "Sur les vingt entretiens de Lina, treize parlent du comptoir du matin. Les quatre qui parlent des factures ajoutent qu'ils « ont fini par en avoir assez de tout ». Aucun des trois qui parlent du prix ne venait au comptoir avant 8 heures."
            : "Personne n'a interrogé les artisans partis. Les commerciaux répètent que c'est le prix ; au comptoir, on voit des artisans repartir chaque matin sans rien dire.",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Ouvrir un retrait express : les commandes de la veille prêtes à 6 h 30, et un vendeur de plus à l'ouverture",
        d: "Dans les quatre agences les plus chargées. 3 000 € de mise en place, puis 1 500 € par semaine ; une semaine de rodage.",
      },
      {
        t: "Faire contrôler les factures des comptes artisans avant envoi",
        d: "Une personne de l'administration des ventes vérifie les remises avant chaque envoi. 900 € par semaine.",
      },
      {
        t: "Compenser l'attente : 2 % de remise sur les retraits avant 9 heures",
        d: "Un geste visible pour ceux qui attendent. Environ 2 000 € par semaine.",
      },
      {
        t: "Ne rien changer au comptoir",
        d: "Il y a toujours eu du monde le matin.",
      },
    ],
    reactions: [
      [
        {
          de: "Ophélie Carré",
          role: "Cheffe du comptoir, agence de Vénissieux",
          texte:
            "Premier lundi du retrait express : les commandes de la veille étaient prêtes, les artisans repartaient en trois minutes. Un plaquiste m'a juste dit : « Enfin. »",
        },
      ],
      [
        {
          de: "Laetitia Vigneron",
          role: "Administration des ventes",
          texte:
            "Les factures partent justes. Les réclamations ont presque disparu en une semaine.",
        },
      ],
      [
        {
          de: "Ophélie Carré",
          role: "Cheffe du comptoir, agence de Vénissieux",
          texte:
            "Ils prennent la remise, et ils attendent toujours vingt minutes. Un maçon m'a dit qu'il préférait son temps à mes 2 %.",
        },
      ],
      [
        {
          de: "Ophélie Carré",
          role: "Cheffe du comptoir, agence de Vénissieux",
          texte:
            "Encore douze personnes dans la file ce matin. J'ai arrêté de compter ceux qui repartent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Ceux qui commandent moins",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Lamine Ndiaye",
        role: "Commercial terrain",
        heure: "11:30",
        alerte: true,
        texte:
          "Je suis passé chez Roger Granger, électricien à Bron. Il ne m'avait rien dit, mais il achète la moitié de ce qu'il achetait à l'automne. « Le matin, je vais au plus près », c'est tout ce qu'il m'a répondu.",
      },
      {
        de: "Clément Aubry",
        role: "Chef de projet fidélisation, siège",
        heure: "14:40",
        texte:
          "On peut envoyer dès lundi un e-mail « Vous nous manquez » avec un bon de 20 € aux artisans qui commandent moins. Le modèle est prêt.",
      },
      {
        de: "Tableau de bord clients",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: ctx.liste
          ? `Semaine 5 : ${ctx.actifs} artisans actifs ; ${ctx.enBaisse} d'entre eux ont vu leurs commandes baisser de 40 % ou plus en huit semaines.`
          : `Semaine 5 : ${ctx.actifs} artisans actifs. Personne ne suit les artisans dont les commandes baissent.`,
      },
    ],
    sources: [
      {
        id: "liste",
        titre: "Regarder qui sont les artisans en baisse",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.liste
            ? `${ctx.enBaisse} artisans, dont Kaya Rénovation, notre premier client artisan. La moitié passent au comptoir avant 8 heures. L'an dernier, ceux qu'un commercial avait appelés dans la même situation sont restés deux fois plus souvent que les autres — à condition de pouvoir leur dire ce qui avait changé.`
            : "Sans liste, les commerciaux citent de mémoire une centaine de noms ; en vérifiant, la moitié commandent normalement. Kaya Rénovation, notre premier client artisan, dont les commandes ont baissé d'un tiers, n'est sur aucune des listes.",
      },
      {
        id: "commerciaux",
        titre: "Demander à Grégory si l'équipe peut appeler",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Grégory : « Une centaine d'appels en deux semaines, c'est faisable si on lève le pied sur la prospection. Mais en avril, avec la reprise des chantiers, je ne te garantis pas que tout le monde le fera. »",
      },
    ],
    question: "Que faites-vous des artisans dont les commandes baissent ?",
    options: [
      {
        t: "Faire appeler chacun par son commercial, en deux semaines",
        d: "Un appel pour comprendre ce qui ne va pas, et dire ce qui a changé. Environ 3 000 € de temps commercial.",
      },
      {
        t: "Leur accorder 6 % de remise pendant deux mois",
        d: "Par e-mail, dès lundi, sans passer par les commerciaux. Environ 1 000 € par semaine.",
      },
      {
        t: "Envoyer l'e-mail « Vous nous manquez » avec un bon de 20 €",
        d: "Préparé par le marketing. 1 200 €.",
      },
      {
        t: "Attendre qu'ils se manifestent",
        d: "Un artisan mécontent finit toujours par le dire.",
      },
    ],
    reactions: [
      null,
      [
        {
          de: "Clément Aubry",
          role: "Chef de projet fidélisation, siège",
          texte:
            "L'e-mail est parti. Un destinataire sur trois a déjà utilisé sa remise à son passage suivant.",
        },
      ],
      [
        {
          de: "Clément Aubry",
          role: "Chef de projet fidélisation, siège",
          texte:
            "Taux d'ouverture : 31 %. Une vingtaine de bons utilisés, surtout par des artisans qui passaient de toute façon.",
        },
      ],
      [
        {
          de: "Lamine Ndiaye",
          role: "Commercial terrain",
          texte:
            "Personne ne s'est manifesté. Ils ne se manifestent jamais, en fait : ils commandent moins, puis ils ne commandent plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Faire revenir ceux qui sont partis ?",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Grégory Tavares",
        role: "Chef des ventes",
        heure: "09:00",
        alerte: true,
        texte:
          "Arthur, plus de cent artisans sont partis en six mois. Je propose une offre de reconquête : 10 % pendant trois mois et un bon de 300 € à la première commande. Mes gars s'en chargent.",
      },
      {
        de: "Tableau de bord clients",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 7 : ${ctx.actifs} artisans actifs, ${ctx.departs} artisans perdus cette semaine.`,
      },
    ],
    sources: [
      {
        id: "pourquoi",
        titre: "Regarder pourquoi les artisans partis sont partis",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.liste
              ? "En croisant les entretiens et l'historique des passages, une trentaine d'artisans partis venaient chaque matin au comptoir avant 8 heures : ceux-là sont partis pour l'attente. Les autres pour des raisons diverses : prix, déménagement, retraite."
              : "Personne ne sait pourquoi ils sont partis : aucun n'a été interrogé. Les commerciaux en connaissent quelques-uns de vue."
          }${
            ctx.express
              ? " Le retrait express tourne depuis trois semaines : il y a quelque chose de neuf à leur montrer."
              : " Au comptoir, rien n'a changé depuis leur départ."
          }`,
      },
      {
        id: "historique",
        titre: "Demander le bilan de la dernière campagne de reconquête",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Il y a deux ans, 10 % de remise offerts à 200 artisans partis : 14 sont revenus, 5 commandaient encore six mois plus tard. Coût : 31 000 €, pour l'essentiel en remises. Pendant la campagne, les commerciaux avaient espacé leurs visites aux clients actifs.",
      },
    ],
    question: "Que faites-vous pour les artisans partis ?",
    options: [
      {
        t: "Lancer l'offre de reconquête à tous les artisans partis",
        d: "10 % pendant trois mois et 300 € à la première commande. 2 500 € de campagne, puis le coût des bons et des remises.",
      },
      {
        t: "Rendre visite à ceux qui sont partis à cause du comptoir, pour leur montrer ce qui a changé",
        d: "Une trentaine de visites par les commerciaux, en semaine 8. 1 800 € de temps.",
      },
      {
        t: "Ne pas chercher à les reconquérir ce trimestre",
        d: "Les commerciaux restent sur les artisans actifs.",
      },
    ],
    reactions: [
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte:
            "L'offre est partie. On a des retours, surtout pour le bon de 300 €. Pendant ce temps, mes gars n'ont pas vu leurs clients habituels.",
        },
      ],
      [
        {
          de: "Lamine Ndiaye",
          role: "Commercial terrain",
          texte:
            "Trente visites en une semaine. Certains ont écouté, d'autres m'ont dit « on verra ». Au moins, on sait pourquoi ils sont partis.",
        },
      ],
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte: "Compris. On reste sur nos clients actifs.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Un concurrent ouvre à Décines",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Grégory Tavares",
        role: "Chef des ventes",
        heure: "08:15",
        alerte: true,
        texte:
          "Dalvaz Matériaux ouvre lundi à Décines, 6 % moins cher que nous sur le gros œuvre pendant un mois. Si on ne s'aligne pas, on perd l'Est lyonnais.",
      },
      {
        de: "Isaure Sarrazin",
        role: "Directrice commerciale régionale",
        heure: "09:00",
        texte: "Arthur, je dois répondre au siège avant lundi. On s'aligne, ou pas ?",
      },
      {
        de: "Tableau de bord clients",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 9 : ${ctx.actifs} artisans actifs${
          ctx.liste ? `, dont ${ctx.enBaisse} qui commandent nettement moins` : ""
        }.`,
      },
    ],
    sources: [
      {
        id: "dalvaz",
        titre: "Regarder ce que Dalvaz propose vraiment",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "−6 % sur trente références de gros œuvre, pendant un mois, pour l'ouverture. Ouverture à 7 h 30, pas de livraison sur chantier. Là où Dalvaz a ouvert ailleurs, trois artisans perdus sur quatre étaient des clients dont les commandes baissaient déjà ; les fidèles sont allés voir, et sont revenus.",
      },
      {
        id: "zone",
        titre: "Compter les artisans proches de Décines",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.liste
            ? `Environ 380 artisans de notre fichier travaillent à moins d'un quart d'heure de Décines. Parmi eux, ${ctx.zone} commandent moins depuis deux mois : ce sont eux que Dalvaz attirera d'abord.`
            : "Environ 380 artisans de notre fichier travaillent à moins d'un quart d'heure de Décines. Sans suivi des commandes, impossible de dire lesquels sont fragiles.",
      },
    ],
    question: "Comment répondez-vous à Dalvaz ?",
    options: [
      {
        t: "S'aligner sur ses prix pour tous les artisans pendant un mois",
        d: "−4 % sur le gros œuvre, dans toutes les agences. Environ 5 500 € par semaine.",
      },
      {
        t: "Appeler les artisans fragiles proches de Décines, et leur garantir retrait express et livraison sur chantier",
        d: "Une semaine d'appels, la livraison offerte pendant un mois. 1 000 €, puis 300 € par semaine.",
      },
      {
        t: "Ne pas réagir : nos artisans ne partiront pas pour 6 %",
        d: "Ni baisse de prix, ni action particulière.",
      },
      {
        t: "S'aligner seulement pour les artisans qui le demandent",
        d: "Les commerciaux accordent −4 % sur le gros œuvre au cas par cas. Environ 1 300 € par semaine.",
      },
    ],
    reactions: [
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte:
            "On est alignés. Les artisans ont pris la baisse ; beaucoup n'avaient même pas entendu parler de Dalvaz.",
        },
      ],
      [
        {
          de: "Lamine Ndiaye",
          role: "Commercial terrain",
          texte:
            "J'ai appelé ceux de Décines et de Meyzieu. La livraison sur chantier les intéresse plus que les 6 % : Dalvaz ne livre pas.",
        },
      ],
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte: "Dalvaz a ouvert lundi. Le parking était plein dès le premier matin.",
        },
      ],
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte:
            "Une soixantaine d'artisans ont demandé la remise : les plus gros, ceux qu'on voit tous les jours.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Clore le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Isaure Sarrazin",
        role: "Directrice commerciale régionale",
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant la revue du trimestre : ${ctx.actifs} artisans actifs. Le siège voudra savoir ce qu'on a appris, et ce qu'on met en place pour la suite.`,
      },
      {
        de: "Grégory Tavares",
        role: "Chef des ventes",
        heure: "09:10",
        texte:
          "3 % sur tout pendant deux semaines, et on finit le trimestre avec du monde au comptoir. Je te garantis le chiffre de la revue.",
      },
    ],
    sources: [],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Lancer une opération de fin de trimestre : 3 % sur tout pendant deux semaines",
        d: "Pour faire passer les artisans au comptoir avant la revue. Environ 10 000 € par semaine.",
      },
      {
        t: "Installer une alerte chaque lundi sur les artisans dont les commandes baissent, avec un appel sous 48 heures",
        d: "Un rapport automatique, et un rituel pour les commerciaux. 2 000 € de mise en place, puis 400 € par semaine.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre se finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          de: "Grégory Tavares",
          role: "Chef des ventes",
          texte:
            "Le comptoir était plein. La plupart seraient venus de toute façon ; ils ont pris les 3 % en passant.",
        },
      ],
      [
        {
          de: "Lina Mansouri",
          role: "Chargée d'études clients",
          texte:
            "La première alerte part lundi : chaque artisan signalé est attribué à son commercial, avec la date de sa dernière commande et ce qu'il achetait.",
        },
      ],
      [
        {
          de: "Isaure Sarrazin",
          role: "Directrice commerciale régionale",
          texte: "Le trimestre se termine. On fera le point lundi.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Comprendre qui part, et pourquoi", chemin: [1, 0, 0, 1, 1, 1] },
  { nom: "Points et remises pour tous", chemin: [0, 2, 2, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 2, 2] },
] as const;

/** Les options qui répondent au départ des clients en payant tout le monde : [décision, option]. */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [3, 0],
  [4, 0],
  [4, 3],
  [5, 0],
] as const;

export const REPONSES = {
  appelsTenus:
    "Cent appels passés en deux semaines. La plupart des artisans n'avaient rien dit à personne ; ils ont été surpris qu'on les appelle, et contents.",
  appelsManques:
    "Avec la reprise des chantiers, l'équipe n'a passé qu'une trentaine d'appels sur la centaine prévue. Je relance, mais ils sont sur la route du matin au soir.",
  kayaPart:
    "Kaya Rénovation n'a rien commandé depuis trois semaines. J'ai appelé Mustafa Kaya : ses gars se servent chez un concurrent qui leur prépare tout pour 6 h 30. « Personne ne m'a rien demandé », m'a-t-il dit.",
  kayaReste:
    "Mustafa Kaya a repassé une commande de chantier complète cette semaine. « Le matin, ça va mieux », m'a-t-il dit.",
  visitesReussies: (n: number) =>
    `${n} artisans partis ont rouvert leur compte après la visite : ils sont venus voir le retrait express à 6 h 45, et ils sont restés.`,
  visitesVaines: (n: number) =>
    `${n <= 1 ? "Un seul artisan" : `${n} artisans seulement`} sur trente ont repassé commande. Les autres sont allés voir le comptoir un matin : rien n'avait changé.`,
  reconquete: (n: number) =>
    `${n} artisans partis ont repassé commande avec le bon de 300 €. Combien resteront quand la remise s'arrêtera ?`,
} as const;
