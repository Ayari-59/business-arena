import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 5, LE CLIENT QUI S'EN VA.
 *
 * Une démonstration de la Découverte (config/episodes/demos.ts) : la
 * fidélisation, l'attrition silencieuse qui se lit avant le départ, et
 * l'action ciblée contre la remise pour tous. Les chiffres du hasard de la
 * classe sont ceux de la graine 4, les moyennes celles des 30 tirages du bilan.
 */
export const FICHE: FicheEnseignant = {
  code: "client-qui-s-en-va",
  formations: ["seconde-pro-rc", "bac-pro-mcv"],
  programme: [
    "2de pro RC · Collecter et exploiter l'information dans le cadre de la relation client",
    "Bac pro MCV · Bloc 2, Suivre les ventes",
  ],
  notion:
    "Un client qui part ne se plaint presque jamais : il commande moins pendant des semaines, puis plus du tout. Fidéliser, c'est donc d'abord savoir qui part et pourquoi, en interrogeant ceux qui sont partis et en suivant la fréquence de commande de ceux qui restent ; c'est ensuite traiter l'irritant qui les fait partir, et réserver l'argent à ceux qui sont en train de partir. L'erreur classique consiste à répondre aux départs par une action pour tous (programme de points, enveloppe de remises, alignement sur un concurrent), qui paie d'abord les clients qui seraient restés. Dans l'épisode, Arvel Distribution est passé de 985 à 920 artisans actifs en six mois dans l'Est lyonnais ; les réclamations ne bougent pas (quatre à cinq par semaine), le marketing a un programme de points prêt à partir et les commerciaux réclament 1,5 % de remise. Vingt artisans partis, rappelés, citent pour treize d'entre eux l'attente au comptoir le matin, pour trois seulement le prix ; le suivi de la fréquence de commande en trouve 116 dont les achats ont baissé de 40 % ou plus, contre une soixantaine il y a un an. L'élève découvre que les réclamations ne disent pas qui part, qu'un écart de prix qui n'a pas bougé (1,2 %, comme il y a un an) n'explique pas une hausse des départs, et qu'un appel à temps à un client qui commande moins coûte bien moins que la reconquête d'un client parti.",
  objectifs: [
    "Je cherche qui part et pourquoi avant d'agir : j'interroge des clients partis et je suis la fréquence de commande de ceux qui restent.",
    "Je distingue ce dont les clients se plaignent de ce qui les fait partir, et je traite l'irritant à sa source.",
    "Je cible une action de fidélisation sur les clients dont les commandes baissent, au lieu de payer tous les clients.",
    "Je fais une estimation chiffrée à partir d'une tendance, et je la compare ensuite au réalisé.",
  ],
  prerequis:
    "Les notions de client actif, de fidélisation et de fréquence d'achat doivent avoir été vues en cours ; le calcul d'une marge suffit pour lire le bilan. L'attrition silencieuse et le coût de la reconquête peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/client-qui-s-en-va?hasard=4 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Sans licence, la démonstration se joue au niveau Découverte : un repère de méthode accompagne chaque étape, et chaque décision montre aussitôt ce qu'elle a changé par rapport à ne rien changer. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation du nombre d'artisans actifs en fin de semaine 3, le calcul qui y mène et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : les sources consultées en semaine 1, et la réponse à Dalvaz Matériaux en semaine 9, où la classe se partage souvent entre l'alignement sur les prix et les appels ciblés. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 3, celle du comptoir du matin.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées, de la plus basse à la plus haute. Vous faites d'abord le calcul de tendance (65 artisans de moins en 26 semaines), puis vous montrez ce que le modèle a donné sous le tirage n° 4 : un peu moins de sept départs par semaine, tous parmi les artisans dont les commandes baissaient, pour deux à cinq nouveaux artisans. Vous faites expliquer d'où viennent les valeurs éloignées : 920 (rien ne bouge), 900 (le budget de fin de trimestre), 804 (les artisans en baisse comptés comme partis).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (points, enquête, remises, attente) et ceux de la semaine 9. Chaque camp donne son argument, puis vous faites dire à qui va l'argent du programme de points, de l'enveloppe de remises ou de l'alignement sur Dalvaz, et combien d'artisans il retient. Vous enchaînez sur le comptoir du matin : pourquoi la remise de 2 % avant 9 heures ne raccourcit pas la file, quand le retrait express la supprime.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer, et vous lisez avec la classe le rejeu de chaque décision sous trente tirages. Sous le tirage n° 4, la méthode « Comprendre qui part, et pourquoi » finit 32 k€ au-dessus du budget, « Points et remises pour tous » 138 k€ en dessous, et ne rien faire 81 k€ en dessous ; sur les trente tirages, la première tient le budget 28 fois, les deux autres jamais. Vous faites constater que la bonne méthode gagne ici presque toujours, et vous montrez la seule décision où le hasard peut renverser le jugement : les appels aux artisans qui commandent moins, que l'équipe passe ou non.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois temps de la fidélisation : savoir qui part et pourquoi (interroger les partis, suivre la fréquence de commande), traiter l'irritant qui fait partir, agir sur ceux qui commandent moins avant qu'ils ne partent. Vous opposez une action pour tous, qui paie d'abord ceux qui restaient, à une action ciblée. La consigne qui reste est le conseil d'Isaure : avant de payer tout le monde pour rester, demander à ceux qui sont partis pourquoi ils sont partis. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 910,
    etapes: [
      "Point de départ (tableau de bord et alerte du lundi) : 920 artisans actifs, c'est-à-dire ayant passé au moins une commande sur huit semaines, contre 985 il y a six mois.",
      "Tendance : 985 − 920 = 65 artisans de moins en six mois, soit 26 semaines, environ 2,5 par semaine en net. Prolongée sur trois semaines : 920 − 3 × 2,5 ≈ 912. L'épisode accepte cette estimation : il juge juste à 4 artisans près, proche à 12.",
      "Ce que la tendance ne voit pas : la source « Extraire la fréquence de commande de chaque artisan actif » compte 116 artisans dont les commandes ont baissé de 40 % ou plus, contre une soixantaine il y a un an, et neuf artisans partis sur dix sont passés par cette baisse. Le vivier des départs a presque doublé : la baisse n'a aucune raison de ralentir.",
      "Ce que donne le modèle sous le tirage n° 4 : environ 6,7 départs par semaine, tous parmi les artisans en baisse, pour 2, 5 puis 3 nouveaux artisans en semaines 1, 2 et 3. Les artisans actifs passent à 915, 914, puis 910 (910,3) en fin de semaine 3.",
      "Le chiffre ne dépend presque pas des décisions de la semaine 1, dont les effets arrivent après la semaine 3 ; il dépend un peu du hasard : de 902 à 913 selon les trente tirages du bilan.",
    ],
    erreurs: [
      {
        valeur: 920,
        cause:
          "Le chiffre du jour reporté tel quel, comme si rien ne bougeait en trois semaines : le portefeuille en a perdu 65 en six mois.",
      },
      {
        valeur: 900,
        cause:
          "Le budget pris pour une prévision : 900 artisans actifs au moins, c'est l'objectif de la fin du trimestre, pas une estimation de la semaine 3.",
      },
      {
        valeur: 804,
        cause:
          "Les 116 artisans dont les commandes baissent comptés comme déjà partis (920 − 116) : ils sont encore actifs, et c'est parmi eux que les départs viendront, quelques-uns chaque semaine.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le programme est prêt, il récompense ceux qui restent, et il se voit : le marketing le porte, et 610 artisans s'y inscrivent en dix jours.",
      ceQuiLeDejoue:
        "Les vingt artisans partis rappelés disent pourquoi ils sont partis : treize citent l'attente au comptoir le matin, trois le prix, et aucun ne s'était plaint. Le programme coûte 5 000 € de lancement, puis environ 2 000 € de points par semaine, et ce sont les plus gros clients, qui restaient, qui cumulent des milliers de points. Rejoué sur les trente tirages à la place de l'enquête, il perd plus de 45 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Les commerciaux le répètent tous : les concurrents cassent les prix. Une remise négociée client par client paraît ciblée.",
      ceQuiLeDejoue:
        "La comparaison des prix montre Arvel 1,2 % plus cher, exactement comme il y a un an : l'écart n'a pas bougé pendant que les départs augmentaient. La remise va à ceux qui la demandent, surtout les gros clients qui la réclamaient depuis longtemps, pas à ceux qui partent sans rien dire. Rejouée sur les trente tirages à la place de l'enquête, elle perd près de 38 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "C'est un geste visible pour ceux qui attendent, qui se décide tout de suite, sans réorganiser le comptoir.",
      ceQuiLeDejoue:
        "Le chronométrage de la semaine 3 montre une attente de 19 minutes entre 6 h 30 et 8 h 30, contre 8 il y a un an : un seul vendeur ouvre, et les commandes de la veille ne sont préparées qu'à l'arrivée du client. La remise ne raccourcit pas la file (« il préférait son temps à mes 2 % ») ; le retrait express la supprime. Rejouée sur les trente tirages à la place du retrait express, la remise du matin perd 80 k€ en moyenne, la plus grosse perte de l'épisode.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Plus de cent artisans sont partis en six mois : une offre forte, 10 % pendant trois mois et un bon de 300 €, semble le moyen le plus rapide de les faire revenir.",
      ceQuiLeDejoue:
        "Le bilan de la dernière campagne le disait : il y a deux ans, 31 000 € pour 200 artisans partis, 14 revenus, 5 qui commandaient encore six mois plus tard, et des commerciaux qui avaient espacé leurs visites aux clients actifs. Les trente visites à ceux qui sont partis à cause du comptoir, une fois le retrait express en place, coûtent 1 800 €. Rejouée sur les trente tirages à la place de ces visites, l'offre à tous perd près de 10 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Dalvaz ouvre à Décines 6 % moins cher sur le gros œuvre, et son parking est plein dès le premier matin : sans alignement, dit le chef des ventes, on perd l'Est lyonnais.",
      ceQuiLeDejoue:
        "La source sur Dalvaz montre une offre d'ouverture limitée (trente références, un mois, ouverture à 7 h 30, pas de livraison sur chantier) et, là où Dalvaz a ouvert ailleurs, trois artisans perdus sur quatre étaient des clients dont les commandes baissaient déjà ; les fidèles sont allés voir, et sont revenus. L'alignement pour tous coûte environ 5 500 € par semaine, payés surtout à des artisans qui n'avaient pas entendu parler de Dalvaz. Rejoué sur les trente tirages à la place des appels ciblés, il perd près de 18 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "C'est un compromis : on ne baisse les prix que pour ceux qui le demandent, environ 1 300 € par semaine au lieu de 5 500 €.",
      ceQuiLeDejoue:
        "Ceux qui demandent la remise sont une soixantaine de gros clients, « ceux qu'on voit tous les jours », pas les artisans fragiles que Dalvaz attirera d'abord. La source « Compter les artisans proches de Décines » désigne ces derniers dès que la liste des artisans en baisse existe ; les appeler et leur garantir retrait express et livraison sur chantier vise ceux-là. Rejoué sur les trente tirages à la place des appels ciblés, l'alignement à la demande perd 10 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "La revue du trimestre approche : 3 % sur tout pendant deux semaines remplissent le comptoir, et le chef des ventes garantit le chiffre.",
      ceQuiLeDejoue:
        "L'opération coûte environ 10 000 € par semaine, et la plupart des artisans « seraient venus de toute façon » : elle ne change rien pour ceux qui commandent moins. L'alerte du lundi, avec un appel sous 48 heures, coûte 2 000 € de mise en place puis 400 € par semaine, et prépare le trimestre suivant. Rejouée sur les trente tirages à la place de l'alerte, l'opération de fin de trimestre perd près de 31 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "Les réclamations sont restées à quatre ou cinq par semaine pendant que les artisans actifs baissaient. Pourquoi ce chiffre ne disait-il pas qui partait ? Quelles sources de la semaine 1 le disaient ?",
    "Treize artisans partis sur vingt citent l'attente du matin, quatre les factures, trois le prix. Les erreurs de facturation étaient un vrai irritant : pourquoi n'était-ce pas le principal, et qu'est-ce qui le montrait ?",
    "Le programme de points, l'enveloppe de remises et l'alignement sur Dalvaz ont un point commun. Lequel ? À qui va l'argent, et qu'aurait fait la même somme réservée aux artisans dont les commandes baissaient ?",
    "Pourquoi un appel ne retient-il un artisan que si l'on peut lui dire ce qui a changé ? Que valait un appel avant l'ouverture du retrait express ?",
    "Sous le tirage n° 4, l'équipe a passé presque tous les appels, et Kaya Rénovation est restée. En pleine reprise des chantiers, l'équipe ne tient ses appels que deux fois sur trois : sur les trente tirages, la remise ciblée de 6 % fait mieux que les appels 8 fois. Les appels restaient-ils le bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Faire revenir un client parti ou retenir un client qui commande moins : lequel coûte le moins, et lequel réussit le plus souvent ? Appuyez-vous sur le bilan de la campagne de reconquête d'il y a deux ans.",
    "Quelle règle gardez-vous pour le trimestre suivant ? Formulez-la en une phrase, avec un indicateur dedans.",
  ],
  prolongement: {
    enonce:
      "Un grossiste en fournitures de bureau compte 400 clients actifs, qui achètent chacun 3 000 € par trimestre et lui laissent 600 € de marge. Sans action, 40 clients partiront au prochain trimestre ; 36 d'entre eux font partie des 80 clients dont les commandes ont baissé de plus de 40 % ces deux derniers mois. 1) Quelle part des départs la liste des clients en baisse permet-elle de viser ? 2) Option A : une remise de 2 % pour tous les clients, qui retient 10 % des partants. Option B : un appel de chacun des 80 clients en baisse par son commercial, à 30 € l'appel, qui retient un partant sur trois parmi eux. Pour chaque option, calculez le coût, le nombre de clients retenus, la marge conservée et le résultat net. 3) Combien coûte chaque client retenu dans chaque option ? 4) Si l'on règle d'abord l'irritant qui fait partir les clients, l'appel en retient un sur deux : que devient l'option B ?",
    corrige:
      "1) 36 / 40 = 90 % des départs. 2) Option A : coût 400 × 3 000 × 2 % = 24 000 € ; 10 % de 40, soit 4 clients retenus ; marge conservée 4 × 600 = 2 400 € ; résultat net −21 600 €. Option B : coût 80 × 30 = 2 400 € ; 36 / 3 = 12 clients retenus ; marge conservée 12 × 600 = 7 200 € ; résultat net +4 800 €. 3) A : 24 000 / 4 = 6 000 € par client retenu ; B : 2 400 / 12 = 200 €. 4) 36 / 2 = 18 clients retenus, 10 800 € de marge conservée pour le même coût de 2 400 € : résultat net +8 400 €, environ 133 € par client retenu. La remise pour tous paie surtout les 360 clients qui restaient ; l'appel ciblé ne paie que ceux qui partaient.",
  },
  evaluation: [
    "Les sources consultées en semaine 1 sont justifiées : l'élève dit ce que les entretiens d'artisans partis et la fréquence de commande apprennent, et pourquoi les réclamations et la comparaison des prix ne le disent pas.",
    "L'estimation du nombre d'artisans actifs en semaine 3 est construite par un calcul écrit à partir des sources (tendance des six mois, rythme des départs), et l'écart avec 910 est expliqué.",
    "Chaque action de fidélisation retenue est justifiée par les clients qu'elle vise : ceux qui commandent moins, ou ceux qui sont partis pour l'irritant, et non tous les clients.",
    "L'irritant est traité à sa source, le comptoir du matin, et l'élève explique pourquoi une remise ne le compense pas.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 4.",
  ],
  vigilance:
    "Le corrigé de 910 artisans est celui du modèle sous le tirage n° 4 : les sources de la semaine 1 ne donnent pas le rythme des départs, et l'élève ne peut que l'estimer. Une estimation par la tendance des six mois (912) est jugée juste par l'épisode ; c'est la méthode, plus que le chiffre, qu'il faut corriger. Le bilan valorise aussi les artisans encore actifs en fin de trimestre (1 000 € pour un fidèle, 450 € pour un artisan dont les commandes baissent, ce qu'ils doivent rapporter au trimestre suivant) : une convention commode, à présenter comme telle.",
};
