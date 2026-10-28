/**
 * FICHE ENSEIGNANT · ÉPISODE 92, L'ABSENTÉISME QUI S'INSTALLE.
 *
 * Un taux d'absentéisme se découpe par motif, et chaque motif a son
 * déclencheur : les manutentions sans matériel, les rappels sur repos. Le
 * piège est de traiter l'absence comme un défaut d'assiduité, par une prime
 * ou des contre-visites.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "absenteisme-qui-s-installe",
  formations: ["stmg", "bts-gpme", "but-gea"],
  programme: [
    "STMG · Terminale, ressources humaines et communication, Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "BUT GEA · Gérer le développement des ressources humaines",
  ],
  notion:
    "Un taux d'absentéisme ne se soigne pas : il se découpe par motif, et chaque motif a son déclencheur. L'erreur classique consiste à lire l'absence comme un manque d'assiduité, et à y répondre par une prime pour ceux qui ne s'absentent pas ou par des contre-visites médicales, qui pénalisent d'abord ceux qui se sont blessés en soignant. Dans l'épisode, l'EHPAD de Montbard de l'Association Solvanne (70 places, 24 ETP d'aides-soignants) atteint 16 % d'absentéisme, avec 33 rappels sur repos en mars et deux accidents du travail au dos dans le mois ; des administrateurs proposent une prime d'assiduité et des contre-visites. La décomposition par motif montre 40 % d'absences pour accidents du travail et douleurs de dos, les deux tiers après un transfert fait sans matériel (un seul lève-personne pour deux étages), et 30 % d'arrêts courts, dont quatre sur dix commencent dans les dix jours qui suivent un rappel sur repos de la même personne. Au rythme actuel, les remplacements coûtent environ 272 k€ par an, pour 204 k€ prévus à l'EPRD. L'élève découvre qu'on fait baisser l'absentéisme en équipant les chambres et en formant à la manutention, en publiant les plannings six semaines avant avec un pool de remplacement, en répartissant les rappels, en organisant une reprise aménagée et des matins qui suivent les habitudes des résidents ; et qu'aucune mesure ne doit se gagner sur la sécurité des résidents.",
  objectifs: [
    "Je calcule le coût annuel des remplacements à partir de l'effectif, du taux d'absentéisme et du coût moyen pondéré d'une journée remplacée.",
    "Je décompose un taux d'absentéisme par motif, et je relie chaque motif à ce qui le déclenche dans l'organisation du travail.",
    "Je compare une mesure qui vise l'assiduité des salariés à une mesure qui agit sur les causes, sur ce qu'elle coûte et ce qu'elle fait aux absences.",
    "J'organise un retour après un accident du travail qui limite le risque de rechute.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions d'effectif en ETP, de taux d'absentéisme, d'accident du travail, d'heures supplémentaires, de CDD et d'intérim doivent être connues ; une moyenne pondérée suffit pour le calcul. Le rôle du médecin du travail et la visite de pré-reprise peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/absenteisme-qui-s-installe?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous lisez l'alerte du tableau de bord (16 %, 33 rappels, deux accidents du travail) et le message de la directrice générale (prime d'assiduité, contre-visites), et vous demandez de noter sur papier le coût annuel des remplacements calculé en semaine 1, avec son calcul, et le plan lancé avant le comité de direction.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le plan de la semaine 1 (prime, équipement et formation, contre-visites, rien), la réponse aux trois salariés souvent absents (semaine 4) et la reprise de Fanta Bathily (semaine 6), où la classe se partage. Un binôme qui a fini tôt calcule l'écart entre le coût au rythme actuel et le budget de l'EPRD.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous refaites le calcul avec la classe à partir de la source de Pervenche Jacquemard : les journées de travail de l'année, les journées d'absence à 16 %, et le coût moyen d'une journée remplacée, pondéré par les trois modes de remplacement. Vous faites expliquer les valeurs éloignées (204 k€, 190 k€ ou 379 k€). Vous terminez par l'écart : 68 k€ de plus que l'EPRD, bâti sur 12 %.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 et de la semaine 6. Pour la semaine 1, faites lire la réaction de Kahina Vuillemot à la prime : Fanta demande si elle la perd alors qu'elle s'est blessée en soignant. Pour la semaine 4, faites compter les rappels personne par personne : Conceição, Ouarda et Narcisse en ont accepté 48 sur 92, et cumulent 11 des 22 arrêts courts. Pour la semaine 6, faites lire l'avis du médecin du travail sur les trois façons de reprendre.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Traiter les causes, motif par motif » finit 30 k€ sous le budget de l'EPRD sur douze mois, quand « Attentiste » le dépasse de 79,9 k€ et « Prime, contrôle et bras en plus » de 120,7 k€, avec un incident lors d'un transfert fait par une ASH. L'assurance maladie a financé 40 % du matériel, et le pool n'a eu qu'une candidate interne. Vous faites lire la semaine 6 : reprendre Fanta à plein poste fait mieux 18 fois sur 30, sous ce tirage aussi, et perd 3,7 k€ en moyenne, parce que les rechutes coûtent des semaines d'arrêt. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau le tableau des motifs et de leurs déclencheurs : le dos et les transferts sans matériel, les arrêts courts et les rappels sur repos, les absences longues et la reprise. Vous rappelez la règle : on traite une absence par sa cause, pas par un soupçon sur ceux qui s'absentent. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 272.06,
    etapes: [
      "Source « Reprendre le coût des remplacements avec Pervenche Jacquemard » : 24 ETP d'aides-soignants, soit 120 journées de travail par semaine ; sur une année, 120 × 52 = 6 240 journées.",
      "Avec 16 % d'absentéisme (alerte du tableau de bord), 6 240 × 0,16 = 998,4 journées d'absence à remplacer par an.",
      "Coût moyen d'une journée remplacée, pondéré par la façon dont les absences ont été couvertes : 40 % de rappels sur repos à 260 €, 35 % de CDD à 210 €, 25 % d'intérim à 380 € : 0,40 × 260 + 0,35 × 210 + 0,25 × 380 = 104 + 73,5 + 95 = 272,50 €.",
      "Coût annuel des remplacements au rythme actuel : 998,4 × 272,50 = 272 064 €, soit 272,06 k€. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 10 k€ près, proche à 30.",
      "Pour comparer : l'EPRD prévoit 204 000 € de remplacements, calculés sur 12 % (6 240 × 0,12 × 272,50 ≈ 204 k€). Les 4 points d'absentéisme de trop coûtent environ 68 k€ par an.",
    ],
    erreurs: [
      {
        valeur: 204.05,
        cause: "Le calcul fait à 12 % d'absentéisme, l'objectif du CPOM qui a servi à bâtir l'EPRD, au lieu des 16 % actuels.",
      },
      {
        valeur: 189.7,
        cause:
          "Toutes les journées remplacées comptées au coût d'une journée salariée, 190 € (998,4 × 190) : un rappel, un CDD ou un intérim coûtent plus qu'une journée normale.",
      },
      {
        valeur: 379.39,
        cause: "Toutes les journées remplacées comptées au prix de l'intérim, 380 € (998,4 × 380) : l'intérim ne couvre qu'un quart des absences.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Deux administrateurs y sont favorables : 80 € par mois pour chaque aide-soignant sans absence donne une raison de venir travailler, pour environ 385 € par semaine.",
      ceQuiLeDejoue:
        "La décomposition par motif montre que 40 % des absences viennent du dos et des accidents du travail, les deux tiers après un transfert sans matériel, et qu'une bonne part des arrêts courts suit un rappel sur repos : une prime ne pose pas de rail ni ne rend un repos. Le médecin du travail indique que des rails au plafond et des verticalisateurs divisent par deux l'exposition du dos. Kahina Vuillemot rapporte la question de Fanta, blessée en soignant. Rejouée sur les trente tirages à la place de l'équipement et de la formation, la prime perd 38 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi: "Un administrateur le propose : contrôler chaque arrêt court par une contre-visite, pour que le message soit clair.",
      ceQuiLeDejoue:
        "Les arrêts ont tous un certificat médical, aucun n'a été contesté, et la source sur les lundis est du bruit (24 % contre 17 à 21 % les autres jours). Les arrêts courts naissent des rappels sur repos, pas d'abus démontrés. Kahina le rapporte après la première contre-visite : l'arrêt était justifié, et on ne parle que de ça dans les vestiaires. Rejouées sur les trente tirages, les contre-visites perdent 21,6 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Trois noms reviennent sans cesse dans les arrêts courts : une contre-visite à leur prochain arrêt, c'est ce que suggère un administrateur.",
      ceQuiLeDejoue:
        "Le compte des rappels personne par personne : Conceição Figueira, Ouarda Belorgey et Narcisse Lamblot ont accepté 48 des 92 rappels des douze dernières semaines, et leurs arrêts tombent presque toujours dans la semaine qui suit un rappel. Chalon l'a fait l'an dernier : 22 contre-visites, un seul arrêt jugé injustifié, et des refus de rappel qui ont doublé. Conceição, vingt-deux ans à revenir sur ses repos, le prend comme un désaveu. Rejouée sur les trente tirages à la place de la limite des rappels, la contre-visite perd 5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Des administrateurs veulent la prime dans tous les établissements et proposent Montbard comme pilote, financé sur l'enveloppe des remplacements.",
      ceQuiLeDejoue:
        "Le FAM de l'association l'a fait il y a deux ans : les arrêts courts ont baissé de 7 %, les accidents du travail pas du tout, et deux salariées privées de prime après un accident du travail ont saisi le CSE ; l'une est partie. Financer la prime sur l'enveloppe des remplacements arrête le pool, qui couvre 9 journées par semaine. Rejoué sur les trente tirages à la place du pool pérennisé, le pilote de la prime perd 46 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème d'assiduité, d'autres un manque d'effectif, d'autres le dos. Qu'est-ce que la décomposition par motif permettait de voir que le taux de 16 % cachait ?",
    "272 k€ au rythme actuel, 204 k€ au budget. Pourquoi le coût d'une journée remplacée dépend-il de la façon de la remplacer ? Quel mode de remplacement coûte le plus, et lequel use le plus l'équipe ?",
    "Conceição, Ouarda et Narcisse étaient à la fois les plus rappelés et les plus absents. Que montrait l'ordre des événements ? Pourquoi une contre-visite était-elle la mauvaise question à leur poser ?",
    "En semaine 6, reprendre Fanta à plein poste fait mieux 18 fois sur 30, sous le tirage n° 12 aussi, et perd 3,7 k€ en moyenne. Comment une décision peut-elle gagner plus souvent et rester mauvaise ? Et que pèse, en plus du chiffre, le dos de Fanta ?",
    "Deux ASH volontaires proposaient d'aider aux transferts du matin. Pourquoi était-ce un risque pour les résidents, et pour l'établissement ? Qu'a changé, à la place, l'organisation du matin selon les habitudes de chaque résident ?",
    "Une prime d'assiduité fait baisser un peu les arrêts courts. Pourquoi peut-elle pourtant être injuste, et même contraire au droit, pour ceux qui se blessent en soignant ?",
    "Quelle règle présentez-vous au comité de direction à la place de la prime ? Formulez-la en une phrase, avec un motif d'absence dedans.",
  ],
  prolongement: {
    enonce:
      "Un établissement emploie 18 ETP d'aides-soignants, à cinq journées de travail par semaine, 52 semaines par an. Son taux d'absentéisme est de 15 %. Les absences sont couvertes à 50 % par des rappels sur repos à 250 € la journée, à 30 % par des CDD à 200 € et à 20 % par de l'intérim à 360 €. 1) Calculez le nombre de journées d'absence par an et le coût moyen d'une journée remplacée. 2) Quel est le coût annuel des remplacements ? 3) Si le taux tombait à 11 %, quelle économie ferait-on ? 4) Un pool de deux aides-soignants coûte 1 800 € par semaine et couvre 9 journées d'absence par semaine, qui auraient sinon été remplacées au coût moyen. Que rapporte-t-il, net, sur un an ?",
    corrige:
      "1) 18 × 5 × 52 = 4 680 journées de travail ; 4 680 × 0,15 = 702 journées d'absence. Coût moyen : 0,5 × 250 + 0,3 × 200 + 0,2 × 360 = 125 + 60 + 72 = 257 €. 2) 702 × 257 = 180 414 €. 3) 4 680 × 0,11 = 514,8 journées, soit 514,8 × 257 ≈ 132 304 € : environ 48 110 € d'économie. 4) Le pool couvre 9 × 52 = 468 journées, qui auraient coûté 468 × 257 = 120 276 € ; il coûte 1 800 × 52 = 93 600 € : il rapporte 26 676 € net, sans compter les rappels sur repos qu'il évite et les arrêts courts qui les suivent.",
  },
  evaluation: [
    "Le coût annuel des remplacements est calculé juste (998,4 journées × 272,50 €, environ 272 k€), avec un coût moyen pondéré et la source nommée, et comparé au budget de l'EPRD.",
    "Le diagnostic décompose l'absentéisme par motif et relie chaque motif à son déclencheur, chiffres des sources à l'appui.",
    "Chaque mesure retenue agit sur une cause identifiée ; les mesures qui visent l'assiduité sont écartées avec un argument tiré des sources.",
    "La reprise après l'accident du travail est organisée pour limiter la rechute, en suivant l'avis du médecin du travail, sans glissement de tâches vers des agents non formés.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Plusieurs règles touchent au droit du travail et à la santé au travail, et l'épisode les simplifie : une prime d'assiduité qui retire la prime après un accident du travail ou une maladie expose à un risque de discrimination liée à l'état de santé, à vérifier sur la jurisprudence ; la contre-visite médicale suppose que l'employeur verse un complément de salaire et suit une procédure encadrée ; la visite de pré-reprise, la reprise aménagée et le temps partiel thérapeutique relèvent du médecin du travail et du médecin traitant, avec l'accord de l'assurance maladie pour le dernier. Les taux de rechute donnés par le médecin du travail et l'aide de l'assurance maladie (40 % du matériel) sont ceux du modèle fictif. La fiche de poste des ASH et l'interdiction du glissement de tâches vers les transferts sont posées par l'épisode : un enseignant de la filière sanitaire et sociale voudra les relire.",
};
