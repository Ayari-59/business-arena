/**
 * FICHE ENSEIGNANT · ÉPISODE 112, LA GAMME VÉGÉTALE.
 *
 * Lancer une innovation sur un marché incertain : acheter de l'information
 * par un test réversible, mesurer ce qui compte (le réachat, pas les
 * commandes), décider sur des critères écrits d'avance. Le piège : investir
 * tout de suite dans une ligne pour occuper le terrain, ou laisser passer.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "gamme-vegetale",
  formations: ["but-tc", "dcg"],
  programme: [
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
    "DCG · UE 7, Management des organisations",
    "École de commerce · Stratégie d'entreprise",
  ],
  notion:
    "Sur un marché que personne ne sait chiffrer, on n'achète pas une usine, on achète de l'information : un test réversible, chez un façonnier et dans une enseigne, sur quelques références, jugé sur des critères écrits avant le test. Encore faut-il mesurer ce qui compte : les commandes du distributeur comptent ce qui entre en magasin (le remplissage des rayons, l'effet de nouveauté), le taux de réachat des acheteurs dit si la gamme tiendra. L'erreur classique consiste à commander tout de suite la ligne dédiée « pour ne pas laisser le rayon au Groupe Nordal », à laisser passer, ou à s'engager sur l'enthousiasme des premières commandes. Dans l'épisode, Herveline Daniélou, directrice marketing de la Laiterie de Kerbrélan, doit recommander au conseil une ligne de 3,2 M€, une gamme d'essai chez un façonnier, ou rien, sur un rayon de 110 M€ qui a pris 15 % l'an dernier mais peut ralentir à 6 % ou reculer. L'élève découvre que le plan vise environ 3,2 M€ de chiffre d'affaires la troisième année dans le scénario central, que la ligne ne se paie que dans l'essor, qu'il faut 1 M€ de chiffre d'affaires rien que pour que ses 40 % de marge couvrent ses frais fixes face aux 20 % du façonnier, et qu'un lancement discret provoque moins la riposte de Nordal qu'une campagne.",
  objectifs: [
    "Je calcule un chiffre d'affaires prévisionnel à partir de la taille d'un marché, de sa croissance, d'une part visée et du passage du prix consommateur au prix net.",
    "Je compare un investissement irréversible à un test réversible selon les scénarios du marché.",
    "Je choisis l'indicateur qui mesure vraiment le succès d'un lancement, et je fixe avant le test les seuils de décision.",
    "Je tiens compte de la réaction d'un concurrent et de la cannibalisation dans l'évaluation d'une nouvelle gamme.",
  ],
  prerequis:
    "Le lancement d'un produit nouveau, la notion de part de marché, le calcul d'une marge sur coût variable et la valeur actuelle nette doivent avoir été vus en cours. Le taux de réachat, le façonnage et la cannibalisation peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/gamme-vegetale?hasard=29 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le chiffre d'affaires annuel de la gamme la troisième année dans le scénario central, et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la recommandation de la semaine 1 (ligne, test, façonnier dans les trois enseignes, rien) et l'indicateur choisi en semaine 2 pour juger le test (commandes, carte de fidélité, dégustation), où la classe se partage souvent. Un binôme qui a fini tôt calcule le chiffre d'affaires qu'il faut à la ligne pour seulement couvrir ses frais fixes.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir de l'étude de panel et du plan de Morwenna Pellen : 110 M€ × 1,06³ ≈ 131 M€ de rayon la troisième année, 4 % de part, 5,24 M€ de ventes consommateurs, 62 % en prix net, environ 3 249 k€. Vous faites expliquer les valeurs éloignées (5 240, 2 728, 4 149), puis vous comparez à la capacité du façonnier, 1,8 million de packs, environ 2,8 M€.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 et de la semaine 9 (élargir comme annoncé, critères écrits, prolonger, arrêter). Pour la semaine 2, vous faites lire la source sur la mesure : les commandes surestimaient le réachat d'environ 9 points, la carte le mesure à 2 points près, la dégustation à 7. Pour la semaine 9, vous faites relire les critères : élargir à 30 % de réachat, garder les deux références à l'avoine entre 20 et 30 %, arrêter en dessous.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 29, le marché suit le scénario central et le réachat mesuré est d'environ 27 % : on garde l'avoine chez Opaline. « Tester, mesurer, réviser » perd 119 k€ de valeur estimée, l'attentisme 202 k€, la ligne commandée tout de suite 800 k€. Sur les trente tirages, le test crée 123 k€ en moyenne (de −166 à +1 053 k€), la ligne en détruit 759 k€ ; le test est le meilleur 19 fois, l'attentisme 8 fois (quand le rayon recule), la ligne 3 fois (dans l'essor). Vous faites dire pourquoi la méthode qui gagne le plus souvent n'est pas celle qui gagne à coup sûr.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de Zénaïde Boscher : sur un marché qu'on ne sait pas chiffrer, on n'achète pas une usine, on achète de l'information, et l'on écrit avant le test ce qui fera accélérer, pivoter ou arrêter. Vous la déclinez : test réversible, mesure du réachat, lancement discret, créneaux réservés sans engagement de volume, critères appliqués, ligne commandée quand les volumes dépassent la capacité du façonnier. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 3249,
    etapes: [
      "Source « Lire l'étude de l'institut de panel sur le rayon » : 110 M€ de ventes consommateurs l'an dernier ; dans le scénario central, la croissance retombe à 6 % par an dès cette année.",
      "Le rayon la troisième année : 110 × 1,06 × 1,06 × 1,06 = 110 × 1,191 ≈ 131,0 M€ de ventes consommateurs.",
      "Source « Reprendre le plan de la gamme avec Morwenna Pellen » : le plan vise 4 % du rayon en valeur la troisième année, soit 131,0 × 0,04 ≈ 5,24 M€ de ventes consommateurs de la gamme.",
      "Même source : le prix net de cession vaut 62 % du prix consommateur, une fois déduites la TVA à 5,5 % et la marge de l'enseigne. Chiffre d'affaires de la laiterie : 5 240 470 × 0,62 ≈ 3 249 092 €, soit environ 3 249 k€. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 100 k€ près, proche à 300.",
      "Ce qu'en tire Herveline : c'est plus que la capacité du façonnier (1,8 million de packs à 1,55 €, environ 2,8 M€), mais la ligne gagne 20 points de marge sur le façonnier pour 200 k€ de frais fixes par an : il lui faut 1 M€ de chiffre d'affaires pour seulement les couvrir, et bien davantage pour rembourser 3,2 M€. Dans le repli, le rayon recule de 5 % par an et la part visée n'est pas atteinte.",
    ],
    erreurs: [
      {
        valeur: 5240,
        cause:
          "Les ventes consommateurs de la gamme données comme chiffre d'affaires de la laiterie : le passage au prix net (62 %), TVA et marge de l'enseigne déduites, est oublié.",
      },
      {
        valeur: 2728,
        cause:
          "La croissance oubliée : 4 % du rayon de l'an dernier (110 M€ × 0,04 × 0,62), alors que la part visée est celle du rayon de la troisième année.",
      },
      {
        valeur: 4149,
        cause:
          "La croissance de l'an dernier, 15 %, prolongée trois ans : c'est le scénario de l'essor, pas le scénario central que demande la question.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Efflam Jézéquel le dit : chaque mois perdu, c'est Nordal qui s'installe dans les linéaires ; commandée cette semaine, la ligne met la gamme en rayon en juillet dans les trois enseignes.",
      ceQuiLeDejoue:
        "L'étude de panel donne trois scénarios, dont le repli une fois sur quatre, et la ligne ne se paie que dans l'essor ; Iwan Szymanski ne veut pas défendre 3,2 M€ « sur un marché que personne ne sait chiffrer ». La source sur Nordal montre aussi qu'une usine annoncée provoque sa riposte environ une fois sur deux. Le consultant qui promet 30 % du rayon en 2030 prolonge la croissance d'une seule année. Rejouée sur les trente tirages à la place du test, la ligne commandée tout de suite détruit 882 k€ de plus en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Le végétal n'est pas notre métier, et l'on évite tout risque sur un marché incertain.",
      ceQuiLeDejoue:
        "Le plan de Morwenna Pellen chiffre ce que coûte l'absence : sans gamme, Nordal prendra à nos crèmes desserts environ 50 k€ de marge par an dans le scénario central, 100 k€ dans l'essor. Le test ne coûte que 35 k€ de série courte et de mise en place, et se décide fin mars. Rejoué sur les trente tirages à la place du test, laisser passer perd 333 k€ en moyenne ; il fait mieux 8 fois, quand le rayon recule.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Baptistin Haddadi le dit : si Opaline recommande, c'est que ça se vend, et les commandes ne coûtent rien.",
      ceQuiLeDejoue:
        "La source sur la mesure le dit : à la mise en place, l'enseigne commande trois semaines de stock pour remplir ses rayons, et les premières semaines portent l'effet de nouveauté ; sur les tests passés, le réachat déduit des commandes était surestimé d'environ 9 points. La carte de fidélité, 24 k€, le mesure à 2 points près. Rejouées sur les trente tirages à la place de la carte, les commandes font mieux 19 fois, le plus souvent parce qu'elles mènent à la même décision et font économiser les 24 k€, et perdent pourtant 72 k€ en moyenne, parce qu'elles font élargir à tort.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Morwenna Pellen le demande : il faut que ça se voie, sinon Nordal occupera le terrain.",
      ceQuiLeDejoue:
        "L'étude des lancements récents montre que Nordal riposte par des promotions à −34 % environ une fois sur deux face à un lancement annoncé à grand bruit, une fois sur sept face à un test discret dans une seule enseigne ; pendant ses promotions, nos ventes baissent de 30 %. Un lancement en magasin chez Opaline coûte 20 k€, la campagne 120 k€. Rejouée sur les trente tirages à la place du lancement en magasin, la campagne perd 93 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Les commandes dépassent l'objectif du test : un contrat d'un an garde les créneaux et donne 2 points de marge en plus.",
      ceQuiLeDejoue:
        "Le contrat engage à enlever 800 000 packs, et chaque pack non enlevé se paie 0,30 €, soit 240 k€ si la gamme s'arrête ; deux références chez Opaline seules en vendraient quatre fois moins. La réservation des créneaux coûte 30 k€, déduits des commandes si la gamme continue. Rejoué sur les trente tirages à la place de la réservation, le contrat d'un an perd 126 k€ en moyenne et ne fait mieux que 7 fois.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "On l'a dit au conseil en janvier : si le test marche, on va vite, et les commandes dépassent l'objectif.",
      ceQuiLeDejoue:
        "Les critères écrits le disent : élargir à 30 % de réachat, garder l'avoine entre 20 et 30 %, arrêter en dessous ; Iwan Szymanski a chiffré que l'élargissement détruit de la valeur dans le scénario central et dans le repli. Sous le tirage n° 29, le réachat mesuré est d'environ 27 % : on garde l'avoine. Rejoué sur les trente tirages à la place des critères, l'élargissement comme annoncé perd 213 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le contrat d'essai s'arrête fin mars, et commandée maintenant, la ligne est prête en septembre : après, ce sera six mois de plus.",
      ceQuiLeDejoue:
        "Efflam Jézéquel chiffre lui-même que la ligne gagne 20 points de marge sur le façonnier mais coûte 200 k€ de frais fixes par an : il lui faut plus de 1 M€ de chiffre d'affaires pour seulement les couvrir, et des volumes au-delà de la capacité du façonnier pour rembourser 3,2 M€. Restée chez le façonnier, une gamme qui s'élargit peut faire commander la ligne en décembre, sur trois mois de ventes nationales. Sous le tirage n° 29, la ligne commandée maintenant perd 2,2 M€ ; rejouée sur les trente tirages à la place du façonnier, 1,1 M€ en moyenne, et ne fait mieux que 3 fois.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une course pour les linéaires, d'autres un risque de cannibalisation. Qu'est-ce qui, dans l'étude de panel et le plan de la gamme, montrait qu'on ne savait pas encore chiffrer le marché ?",
    "Les commandes d'Opaline dépassaient l'objectif, et le réachat mesuré par la carte n'était que d'environ 27 %. Pourquoi les deux chiffres ne disent-ils pas la même chose ? Lequel dit si la gamme tiendra ?",
    "Pourquoi fallait-il écrire les critères avant le test ? Que se passe-t-il quand on les fixe après avoir vu les commandes ?",
    "Sur les trente tirages, laisser passer est la meilleure méthode 8 fois, et la ligne commandée tout de suite 3 fois. Le test, meilleur 19 fois, restait-il le bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Une campagne qui se voit ou un lancement discret en magasin : que fait chacun à la riposte de Nordal, et donc à la mesure du test ?",
    "La ligne gagne 20 points de marge sur le façonnier. À partir de quel chiffre d'affaires couvre-t-elle ses frais fixes, et pourquoi la commander en décembre plutôt qu'en mars ?",
    "Quelle règle gardez-vous pour lancer un produit sur un marché incertain ? Formulez-la en une phrase, avec un indicateur dedans.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie envisage une gamme de fromages végétaux. Le rayon fait 50 M€ de ventes consommateurs et croît de 8 % par an dans le scénario central ; le plan vise 5 % du rayon la troisième année ; le prix net de cession vaut 62 % du prix consommateur. La cannibalisation coûte 3 % du chiffre d'affaires de la gamme. Un façonnier offre 22 % de marge sur coût variable, sans frais fixes ; une ligne dédiée offre 40 %, avec 180 000 € de frais fixes par an, pour 2 M€ d'investissement. 1) Calculez le chiffre d'affaires de la troisième année dans le scénario central. 2) Calculez la contribution annuelle de la gamme cette année-là, cannibalisation déduite, chez le façonnier et sur la ligne dédiée. 3) À partir de quel chiffre d'affaires la ligne fait-elle mieux que le façonnier ? 4) Combien d'années faudrait-il, au volume de la troisième année, pour que l'écart rembourse l'investissement ? Que recommandez-vous ?",
    corrige:
      "1) 50 × 1,08³ ≈ 50 × 1,2597 ≈ 62,99 M€ de rayon ; 5 % : 3,149 M€ de ventes consommateurs ; × 0,62 ≈ 1 952 554 €. 2) Façonnier : 1 952 554 × (0,22 − 0,03) ≈ 370 985 €. Ligne : 1 952 554 × (0,40 − 0,03) − 180 000 ≈ 722 445 − 180 000 = 542 445 €. 3) La ligne gagne 18 points de marge : elle fait mieux au-delà de 180 000 / 0,18 = 1 000 000 € de chiffre d'affaires. 4) L'écart vaut 542 445 − 370 985 ≈ 171 460 € par an ; 2 000 000 / 171 460 ≈ 11,7 ans. Au volume du scénario central, la ligne ne se rembourse pas sur un horizon raisonnable : rester chez le façonnier, et ne commander la ligne que si les ventes mesurées dépassent nettement ce volume.",
  },
  evaluation: [
    "Le chiffre d'affaires de la troisième année est calculé juste (110 × 1,06³ × 4 % × 62 %, environ 3 249 k€) à partir des deux sources nommées, et l'élève distingue ventes consommateurs et chiffre d'affaires.",
    "Le choix de la semaine 1 est argumenté selon les scénarios du marché : ce que la ligne rapporte dans l'essor, ce qu'elle coûte dans le repli, ce que le test permet de réviser.",
    "L'indicateur du test est le réachat mesuré, les critères sont écrits avant le test et appliqués à la semaine 9.",
    "La riposte du concurrent, la cannibalisation et la capacité du façonnier sont prises en compte, chiffres à l'appui.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 29.",
  ],
  vigilance:
    "L'épisode pose le plafond de 34 % des promotions sur les produits alimentaires comme « le plafond légal » : l'encadrement des promotions en valeur et en volume issu des lois EGAlim est à vérifier dans sa version en vigueur avant d'être énoncé. L'allégation « sans lait », la gestion des allergènes et le taux de TVA de 5,5 % sont repris de l'épisode tels qu'il les pose ; un enseignant de droit ou de fiscalité doit les relire.",
};
