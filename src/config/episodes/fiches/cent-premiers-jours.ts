/**
 * FICHE ENSEIGNANT · ÉPISODE 22, LES CENT PREMIERS JOURS.
 *
 * La prise de poste d'un manager : comprendre avant de changer, régler vite
 * l'irritant que l'équipe signale, faire de l'adjoint déçu un allié. Le piège
 * est double : la recette de l'ancienne agence, et l'immobilisme qui ne froisse
 * personne. Les chiffres du hasard de la classe sont ceux de la graine 12.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "cent-premiers-jours",
  formations: ["bts-mco", "but-tc", "dcg"],
  programme: [
    "BTS MCO · Bloc 4, Manager l'équipe commerciale",
    "BUT TC · Manager une équipe commerciale sur un espace de vente",
    "DCG · UE 7, Management des organisations",
  ],
  notion:
    "Un manager qui prend un poste arrive avec peu de crédit, et ses premières semaines le remplissent ou le vident. L'erreur classique consiste à appliquer la recette qui a marché ailleurs, tout de suite et d'un bloc, pour montrer qu'on dirige ; l'erreur inverse consiste à ne rien toucher pour ne froisser personne. Dans l'épisode, Thibaut Arnal prend l'agence Arvel Distribution de Meyzieu, quinze personnes, 25 k€ de marge par semaine pour un budget de 27 k€ ; il arrive de Dijon, où son plan avait marché, et Christophe Rambaud, son adjoint, espérait le poste. Les sources montrent ce que les tableaux ne montrent pas : les « bons de la veille » préparés pour l'ouverture de 6 h 30 font 38 % des ventes du comptoir et coûtent 900 € d'heures majorées par semaine ; un des deux postes du comptoir est en panne depuis quatre mois (18 minutes d'attente à 7 h 15) ; les devis de chantier attendent 4,5 jours contre 2 dans les meilleures agences, parce que Christophe les fait tous seul. L'élève découvre que la recette de Dijon casse ce qui marche ici (une autre clientèle : des artisans seuls qui commandent par SMS), que régler en semaine 4 l'irritant que onze personnes sur quinze ont cité vaut plus qu'un plan, et que l'adjoint déçu, associé avec un vrai mandat, devient l'allié qui gagne les chantiers.",
  objectifs: [
    "Je recueille l'information avant de décider : je vais sur le terrain, j'écoute chaque membre de l'équipe et je repère ce qui marche avant de changer quoi que ce soit.",
    "Je distingue une pratique coûteuse qui fait venir les clients d'une dépense inutile, en chiffrant ce qu'elle rapporte autant que ce qu'elle coûte.",
    "Je transforme un collaborateur déçu en allié en lui confiant un rôle réel, avec un cadre écrit, plutôt qu'en le recadrant ou en le ménageant.",
    "Je ne promets que ce que je maîtrise, et je construis un plan avec l'équipe qui le portera.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de style de management, de motivation et de légitimité du manager doivent avoir été vues en cours ; le calcul d'une marge commerciale suffit pour lire le bilan. La notion de crédit du nouveau venu et la conduite d'entretiens individuels de prise de poste peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/cent-premiers-jours?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous présentez Thibaut en une phrase (un directeur qui a réussi à Dijon et prend Meyzieu) et vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation de la confiance de l'équipe au baromètre en semaine 3 et ce qui la justifie, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la décision de la semaine 1 (le plan en dix points, l'écoute, le questionnaire ou l'observation) et ce qui a été fait de Christophe en semaine 5. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 3 : aligner les horaires sur Dijon au lieu de réparer le poste du comptoir.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées, de la plus basse à la plus haute, et vous les rapprochez du choix de la semaine 1 de chacun : le baromètre ne bouge que par ce que le directeur fait. Vous refaites le raisonnement à partir des 35 sur 100 du tableau de bord d'arrivée, puis vous donnez ce que le modèle a lu : 43 sur 100 avec les entretiens, 24 avec le plan en dix points, 36 avec le questionnaire, 31 en observant depuis son bureau. Vous faites expliquer les valeurs éloignées (35, 38, 60).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et ceux de la semaine 5 sur Christophe. Pour la semaine 3, vous faites lire la source « Regarder ce que rapportent les heures de 6 h 30 » : les 900 € servent les bons de la veille, 38 % des ventes du comptoir. Pour Christophe, les élèves qui l'ont recadré défendent leur choix (il a accordé 12 % de remise sans prévenir), puis la classe le confronte à la source sur son portefeuille : les vingt plus gros clients chantier, 60 % des ventes de chantier.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Écouter, puis agir avec l'équipe » finit 59,5 k€ au-dessus du budget, dynamique laissée comprise, « Ne froisser personne » 32,5 k€ en dessous, et « Appliquer le plan de Dijon » 74,7 k€ en dessous. Sur les trente tirages, la première méthode finit au-dessus du budget les 30 fois (entre 13 et 61 k€), les deux autres jamais. Vous montrez la seule décision où le hasard peut renverser le jugement : casser les prix pour Dorval Bâtiment, qui fait mieux que le devis à prix normal 4 fois sur 30 : chaque fois, Christophe avait refusé le pôle chantiers et le devis à prix normal était perdu.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois temps de la prise de poste : comprendre (terrain, entretiens, ce qui marche avant ce qui ne marche pas), une victoire rapide sur l'irritant que l'équipe signale, puis un plan construit avec ceux qui le porteront. Vous ajoutez les deux interdits : la recette d'ailleurs appliquée sans regarder la clientèle, et la promesse faite avant d'en avoir les moyens. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 43,
    etapes: [
      "Point de départ : le tableau de bord d'arrivée donne une confiance de l'équipe de 35 sur 100 au baromètre hebdomadaire, pour un objectif de 60. Aux messages du lundi, Amina Ouarab résume l'humeur : « On se demande tous ce que vous allez changer. »",
      "Ce que fait la décision de la semaine 1 : les entretiens avec chacun des quinze, les matinées au comptoir et au dépôt durent trois semaines. Les réactions le disent (« Jean-Paul ne m'avait jamais demandé ce que je ferais à sa place », « Vous êtes le premier directeur que je vois au dépôt à 6 h 30 ») : la confiance monte chaque semaine d'écoute. Le modèle compte 3 points par semaine pendant les trois semaines, soit 9 points.",
      "Ce qui use la confiance : le temps sans résultat retire environ 0,4 point par semaine, soit 1,2 point sur trois semaines.",
      "Estimation : 35 + 9 − 1,2 = 42,8, soit 43 sur 100 en fin de semaine 3. L'épisode juge juste à 4 points près, proche à 10. Le chiffre ne dépend pas du hasard : il est le même pour toute la classe et sur les trente tirages.",
      "Pour comparer : avec le plan en dix points, 35 − 10 − 1,2 = 23,8 ; avec le questionnaire anonyme, 35 + 2 − 1,2 = 35,8 ; en laissant Christophe gérer, 35 − 3 − 1,2 = 30,8. Seule l'écoute rapproche l'équipe de l'objectif de 60.",
    ],
    erreurs: [
      {
        valeur: 35,
        cause:
          "Le chiffre d'arrivée reporté tel quel, comme si trois semaines d'entretiens et de matinées au comptoir ne changeaient rien à ce que l'équipe pense du nouveau directeur.",
      },
      {
        valeur: 38,
        cause:
          "L'effet de l'écoute compté une seule fois (35 + 3), alors que les entretiens et les matinées au comptoir durent trois semaines et que chacune ajoute du crédit.",
      },
      {
        valeur: 60,
        cause:
          "L'objectif du mandat pris pour une prévision : 60 sur 100 est ce que la direction attend au baromètre, pas ce que trois semaines d'arrivée peuvent produire en partant de 35.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le plan a marché à Dijon, la direction attend des résultats avant l'été : le présenter dès le lundi montre qu'on sait où l'on va.",
      ceQuiLeDejoue:
        "Jean-Paul Chevrier le dit au téléphone : « Regarde l'agence à 6 h 30 avant de la regarder dans les tableaux. » La matinée au comptoir montre que les bons de la veille font 38 % des ventes et sont la première raison de venir ici ; le plan de Dijon (ouverture à 7 heures, application de commande) les supprime. La confiance tombe de 35 à 24 en trois semaines, et les chances que Christophe accepte ensuite le pôle chantiers tombent de trois sur quatre à une sur cinq. Rejoué sur les trente tirages à la place de l'écoute, le plan du lundi perd 36 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Le contrôle de gestion le signale : 900 € d'heures majorées par semaine, quand Dijon ouvre à 7 heures. C'est une économie visible tout de suite.",
      ceQuiLeDejoue:
        "La source « Regarder ce que rapportent les heures de 6 h 30 » répond : les 900 € préparent les bons d'une quarantaine d'artisans réguliers, 38 % des ventes du comptoir, et sept artisans sur dix ont plus de cinquante ans et commandent par SMS. José Carvalho prévient : « Lundi, les artisans de 6 h 30 vont trouver porte close. » Rejoué sur les trente tirages à la place de la réparation du poste, l'alignement des horaires perd 62 k€ en moyenne, la plus grosse perte de l'épisode, et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Christophe a accordé 12 % de remise à l'entreprise Gauthier sans prévenir et dit que « le nouveau ne connaît pas les clients » : il faut rappeler qui dirige.",
      ceQuiLeDejoue:
        "Amina le dit : « Donnez-lui quelque chose de vrai à porter, pas un titre. » Le portefeuille de Christophe, ce sont les vingt plus gros clients chantier, 60 % des ventes de chantier : « S'il partait, une partie le suivrait. » Recadré, il fait « ni plus ni moins », sa rancœur monte, et son départ devient probable. Rejoué sur les trente tirages à la place du pôle chantiers, le recadrage perd 44,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Le comité régional veut un plan lisible et des résultats en six semaines : celui de Dijon est complet et éprouvé.",
      ceQuiLeDejoue:
        "La source « Comparer Meyzieu et votre ancienne agence de Dijon » : là-bas, 60 % des commandes arrivaient par l'application, de la part d'entreprises de dix salariés et plus ; ici, ce sont des artisans seuls ou à deux qui passent à l'aube. Le plan coûte 4 000 €, supprime les bons de la veille et range le dépôt par familles (« les préparations prennent le double de temps »). Rejoué sur les trente tirages à la place du plan construit avec l'équipe, il perd 40 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "La direction veut « quelque chose qui se voie sur la marge avant l'été » : supprimer l'intérimaire du dépôt et les heures de 6 h 30 économise jusqu'à 1 800 € par semaine, visibles au prochain point.",
      ceQuiLeDejoue:
        "Les vingt-trois artisans partis depuis un an citent l'attente du matin et les devis arrivés trop tard ; aucun ne parle des prix ni des coûts. Sans l'intérimaire, José ne prépare plus les bons du matin, l'attente monte et les artisans partent semaine après semaine, ce que les 1 800 € ne compensent pas. Rejouées sur les trente tirages à la place du plan partagé, les économies perdent 30,5 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Au bilan des cent jours, un plan de transformation ambitieux et lisible est ce que la direction aime entendre.",
      ceQuiLeDejoue:
        "La source « Faire le point avec l'équipe sur ce qui a marché » le dit : ce qui a été lancé avec l'équipe continue sans vous ; ce qui a été imposé ne tient que tant que vous êtes derrière. Le plan de Dijon pour l'automne retire 10 points de confiance et supprime les bons de la veille au trimestre suivant ; Amina : « L'équipe a l'impression que tout ce qu'on a fait depuis trois mois ne comptait pas. » Rejoué sur les trente tirages à la place du plan partagé, il perd 16 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Christophe a tenu l'agence pendant l'intérim : le laisser faire le temps de prendre ses marques évite de le froisser et de bousculer l'équipe.",
      ceQuiLeDejoue:
        "Observer depuis son bureau n'apprend pas ce que la matinée au comptoir et les devis montraient en une demi-journée, et l'équipe le remarque (« On ne voit pas beaucoup le nouveau directeur »). La confiance baisse à 31 au lieu de monter à 43. Rejouée sur les trente tirages à la place de l'écoute, cette attente perd 20 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Un nouveau directeur ne doit pas agir sur une vue partielle : mieux vaut attendre le diagnostic complet.",
      ceQuiLeDejoue:
        "Le diagnostic était fait : onze entretiens sur quinze citaient d'abord le poste en panne depuis quatre mois, avec 18 minutes d'attente à 7 h 15 et des artisans qui repartent. Le réparer coûte 2 500 €, s'installe en une semaine, et c'est la preuve qu'on a été entendu. Rejoué sur les trente tirages à la place de la réparation, attendre perd 27 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Christophe est vexé : lui laisser son périmètre évite le conflit et garde les gros clients.",
      ceQuiLeDejoue:
        "Thao Vo décrit ce que cela donne : « Les gros clients continuent d'appeler Christophe pour tout. On ne sait plus très bien qui décide. » Les devis restent à 4,5 jours, ceux de plus de 5 000 € passent toujours par un seul homme, et neuf ont été perdus ce trimestre faute de réponse à temps. Rejoué sur les trente tirages à la place du pôle chantiers, le ménagement perd 23,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "L'agence tourne : mieux vaut tout comprendre avant de s'engager devant le comité, et présenter un diagnostic sans promesse.",
      ceQuiLeDejoue:
        "Les sources de la semaine 7 donnaient le plan : devis sous 48 heures, relance des vingt-trois artisans partis que personne n'a rappelés, comptoir du matin. Thao en a rappelé huit dans la semaine, trois sont repassés. Gérard Rabier, lui, avait prévenu : « En semaine 8, il me faudra autre chose qu'un diagnostic. » Rejoué sur les trente tirages à la place du plan partagé, ne rien présenter perd 15 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont présenté leur plan, d'autres ont écouté. Qu'est-ce que la matinée au comptoir de 6 h 30 apprenait, que le tableau de bord ne montrait pas ?",
    "Les heures majorées de 6 h 30 coûtent 900 € par semaine. Qu'est-ce qu'elles rapportent ? Comment le contrôle de gestion et José Carvalho peuvent-ils regarder la même dépense et en tirer deux conclusions opposées ?",
    "Christophe a accordé 12 % de remise sans prévenir. Pourquoi le recadrer était-il tentant, et pourquoi était-ce le plus mauvais choix ? Qu'est-ce qui, dans sa façon d'avoir été traité depuis le premier jour, faisait monter ses chances d'accepter le pôle chantiers jusqu'à trois sur quatre ?",
    "Le plan de Dijon a marché à Dijon. Qu'est-ce qui, dans la clientèle de Meyzieu, le rendait mauvais ici ? Citez deux chiffres de la source qui compare les deux agences.",
    "Sous le tirage n° 12, Christophe a accepté et Dorval Bâtiment a retenu l'offre de l'agence. Sur les trente tirages, Christophe accepte 22 fois, et casser les prix fait mieux que le devis à prix normal 4 fois, toutes parmi les 8 où il a refusé. Le devis monté avec Christophe restait-il le bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Promettre un renfort à l'équipe avant d'en avoir le budget : qu'est-ce que la promesse coûte quand la direction refuse, et pourquoi coûte-t-elle plus que de n'avoir rien promis ?",
    "Quelle règle gardez-vous pour une prise de poste ? Formulez-la en une phrase, avec ce qu'il faut faire dans le premier mois.",
  ],
  prolongement: {
    enonce:
      "Une agence de négoce ouvre à 6 h 30 pour une quarantaine d'artisans réguliers, qui achètent chacun 460 € par semaine avec un taux de marge de 28 %. L'ouverture matinale coûte 900 € d'heures majorées par semaine. Un nouveau directeur propose de la supprimer. 1) Quelle marge un artisan régulier rapporte-t-il par semaine ? 2) Combien d'artisans faut-il perdre pour que la perte de marge annule l'économie hebdomadaire ? 3) Si l'agence perd un artisan de plus chaque semaine (un en semaine 1, deux en semaine 2, et ainsi de suite jusqu'à treize en semaine 13), comparez l'économie et la marge perdue sur le trimestre de treize semaines. 4) Les treize artisans perdus ne reviennent pas : que coûte la décision sur les huit semaines du trimestre suivant ?",
    corrige:
      "1) 460 × 0,28 = 128,80 € de marge par artisan et par semaine. 2) 900 / 128,80 ≈ 6,99 : à partir de 7 artisans perdus, l'économie est annulée. 3) Économie : 13 × 900 = 11 700 €. Marge perdue : 1 + 2 + … + 13 = 91 semaines d'artisan, soit 91 × 128,80 = 11 720,80 € ; sur le trimestre, la décision ne rapporte rien (−20,80 €). 4) Sur les huit semaines suivantes : 13 × 128,80 × 8 = 13 395,20 € de marge perdue, pour 8 × 900 = 7 200 € d'économie, soit −6 195,20 €. Une économie qui fait partir des clients se juge sur la durée, pas sur le premier mois.",
  },
  evaluation: [
    "Les sources consultées en semaine 1 sont justifiées : l'élève dit ce que la matinée au comptoir et les devis apprennent, et pourquoi la comparaison des prix ne dit rien d'un artisan perdu.",
    "L'estimation de la confiance en semaine 3 est raisonnée à partir du chiffre d'arrivée et de ce que la décision de la semaine 1 produit, et l'écart avec 43 est expliqué.",
    "Chaque dépense coupée ou gardée est jugée sur ce qu'elle rapporte autant que sur ce qu'elle coûte (les heures de 6 h 30, l'intérimaire du dépôt).",
    "Le traitement de Christophe est argumenté avec les sources : son portefeuille, ce que dit l'équipe, le cadre écrit du pôle chantiers.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La prévision porte sur un indicateur du modèle, la confiance au baromètre, que les sources ne chiffrent pas : l'élève ne peut que l'estimer à partir du chiffre d'arrivée et des réactions de l'équipe. C'est le raisonnement (la décision de la semaine 1 fait monter ou baisser la confiance, et l'effet dure trois semaines) plus que le chiffre qu'il faut corriger. Les heures majorées de l'ouverture à 6 h 30 sont traitées comme un coût hebdomadaire global, sans détailler les règles de majoration ni le travail de nuit.",
};
