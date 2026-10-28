/**
 * FICHE ENSEIGNANT · ÉPISODE 98, LES CHANGEMENTS QUI MANGENT LA LIGNE.
 *
 * La décomposition du TRS (disponibilité, performance, qualité) : sur une
 * ligne de produits frais aux nombreuses références, les heures partent aux
 * changements de format et aux nettoyages entre recettes. Le piège : acheter
 * une ligne ou des samedis avant d'avoir regardé où partent les heures qu'on
 * a, ou écourter un nettoyage validé. Les chiffres du hasard de la classe sont
 * ceux de la graine 12, les moyennes celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "changements-de-format",
  formations: ["but-gea", "stmg"],
  programme: [
    "BUT GEA · Mettre en œuvre des leviers d'amélioration continue des performances de l'organisation",
    "STMG · Terminale, enseignement commun, Thème 1, Les organisations et l'activité de production de biens et de services",
  ],
  notion:
    "Un taux de rendement synthétique (TRS) bas ne dit pas ce qui manque : il se décompose en disponibilité (les arrêts), performance (les micro-arrêts et la cadence) et qualité (les rebuts), et chaque perte se traite à part. L'erreur classique consiste à répondre à une ligne qui ne suit plus en achetant de la capacité (une deuxième ligne) ou des heures (des samedis), avant d'avoir regardé où partent celles qu'on a ; la plus grave, à regagner du temps en écourtant un nettoyage validé. Dans l'épisode, la ligne 3 de l'usine de Loudéac de la Laiterie de Kerbrélan tourne à 57 % de TRS pour 70 % d'objectif, livre 912 500 pots bons par semaine quand l'été en demandera 1,2 million, et le directeur industriel propose une ligne à 2,4 M€ livrée en janvier. Le relevé des arrêts montre 17 heures par semaine perdues aux changements de format et aux nettoyages en place (NEP) entre recettes, dont une bonne moitié se prépare ligne en marche et une partie disparaît en ordonnant les recettes. L'élève découvre que la capacité de l'été est déjà dans la ligne, qu'un standard tient s'il est construit avec les conducteurs et ancré avant les congés, et qu'un cycle de nettoyage validé ne se négocie pas.",
  objectifs: [
    "Je calcule les heures perdues par une ligne à partir d'un relevé d'arrêts, et je les range en disponibilité, performance et qualité.",
    "Je sépare, dans un changement de format, ce qui exige la ligne arrêtée de ce qui peut se préparer ligne en marche.",
    "J'ordonne une production pour réduire les nettoyages obligatoires, en tenant compte de la durée de vie des produits et du stock.",
    "Je refuse un gain de temps qui sort du plan de maîtrise sanitaire, et je dis pourquoi.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de capacité de production, de temps d'ouverture, de cadence et de rebut doivent avoir été vues ; des conversions de minutes en heures suffisent pour le calcul. Le TRS, sa décomposition et le principe du SMED peuvent être découverts pendant la séance ; le nettoyage en place et la DLC peuvent être présentés en quelques minutes.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/changements-de-format?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la ligne en deux phrases (57 % de TRS, un été qui ne passera pas) sans parler de changements de format, et vous demandez de noter sur papier les heures perdues calculées en semaine 1 et la proposition faite au comité.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la proposition de la semaine 1 (deuxième ligne, samedis, décomposition, attente) et la réponse de la semaine 7 à l'idée de raccourcir les NEP. Un binôme qui a fini tôt calcule ce que la roue quotidienne fait gagner : 5 NEP au lieu de 9, 5 changements au lieu de 6.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir du relevé des arrêts : six changements de 65 minutes, neuf NEP de 70 minutes. Vous faites expliquer les valeurs éloignées (26,8, 10,25 ou 6,5 heures), puis vous rangez toutes les pertes du relevé dans les trois familles du TRS : les arrêts, les micro-arrêts du doseur, les pots écartés et les purges.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 5 (campagnes, roue quotidienne, allergènes le vendredi, ordre des commandes) et de la semaine 7. Pour la semaine 5, vous faites lire la matrice des enchaînements et ce qu'une série longue fait au stock : une DLC de 30 jours, des enseignes qui refusent un pot avec moins des deux tiers de sa DLC, une casse à près de 4 % à Pontivy. Pour la semaine 7, vous faites lire Annaïg Le Dantec : une cuve propre à l'œil n'est pas une cuve propre.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Décomposer avant de soigner » finit à 659 k€, « Des heures et une ligne en plus » à 418 k€ et l'attente à 364 k€ : la ligne en plus fait à peine mieux que ne rien faire. Vous faites lire les quatre réflexes : aucun ne fait mieux que la méthode sur un seul des trente tirages. Vous montrez ensuite le film d'opercules de la semaine 9 : sous ce tirage, l'essai a réussi, mais il ne réussit que deux fois sur trois. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la décomposition du TRS et la règle de l'épisode : couper le TRS en trois avant de soigner la ligne, et regagner d'abord les heures perdues aux changements. Vous la déclinez en trois gestes : préparer ligne en marche ce qui peut l'être, avec les conducteurs ; ordonner les recettes pour ne faire que les nettoyages obligatoires ; ancrer le standard avant que les équipes changent. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 17,
    etapes: [
      "Source « Dépouiller le relevé des arrêts des quatre dernières semaines » : semaine moyenne de 80 heures d'ouverture, 6 changements de format de 65 minutes chacun et 9 nettoyages en place entre deux recettes de 70 minutes chacun.",
      "Changements de format : 6 × 65 = 390 minutes, soit 6,5 heures.",
      "Nettoyages en place : 9 × 70 = 630 minutes, soit 10,5 heures. Les 45 minutes de cycle validé comptent : la ligne est arrêtée pendant tout le NEP.",
      "Heures perdues chaque semaine aux changements et aux NEP : 6,5 + 10,5 = 17 heures, plus d'un cinquième de l'ouverture. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 1 heure près, proche à 3.",
      "Pour la suite : les 470 micro-arrêts du doseur, d'une minute et quart, font environ 9,8 heures de plus, mais c'est une perte de performance, pas un changement ; les 7,2 % de pots écartés et les 5 000 pots purgés à chaque redémarrage sont des pertes de qualité.",
    ],
    erreurs: [
      {
        valeur: 26.79,
        cause:
          "Les micro-arrêts du doseur (470 × 1,25 minute, environ 9,8 heures) sont ajoutés aux changements et aux NEP : ils comptent dans les pertes de la ligne, mais pas dans celles que la question demande.",
      },
      {
        valeur: 10.25,
        cause:
          "Seule la part des NEP hors cycle validé (25 minutes) est comptée (390 + 9 × 25 = 615 minutes) : la ligne est arrêtée pendant les 70 minutes du NEP, cycle compris.",
      },
      {
        valeur: 6.5,
        cause:
          "Les nettoyages entre recettes sont oubliés, seuls les changements de format sont comptés : la question porte sur les changements et les NEP.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La ligne 3 est trop petite pour l'été : une deuxième ligne de 24 000 pots à l'heure règle la question, et Ardoform promet dix points de TRS dès la première année.",
      ceQuiLeDejoue:
        "Le devis lui-même : livraison en janvier au plus tôt, puis trois mois de montée en cadence, rien pour cet été. Le relevé des arrêts montre 17 heures par semaine perdues aux changements et aux NEP, et le chronométrage de mardi qu'une bonne moitié des gestes d'un changement n'avait pas besoin de la ligne arrêtée. Primaël Kerlogot : sur une ligne qui fait beaucoup de parfums, c'est rarement la machine qui manque. Rejouée sur les trente tirages à la place de la décomposition, la deuxième ligne perd 47 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Les commandes montent dès avril : quatre samedis en deux équipes, c'est 64 heures d'ouverture de plus tout de suite.",
      ceQuiLeDejoue:
        "Un samedi coûte 6 500 € pour 16 heures d'ouverture, quand le relevé en trouve 17 par semaine perdues aux changements et aux NEP, dont une bonne part se regagne pour quelques heures de conducteurs. Certains enchaîneront quatre semaines de six jours, et la DRH prévient qu'après trois semaines les micro-arrêts, les rebuts et les accidents remontent. Rejoués sur les trente tirages à la place de la décomposition, les samedis d'avril perdent 61 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "En juin, les enseignes demanderont 1,2 million de pots par semaine : des samedis de la semaine 9 à 13, c'est la capacité qui manque, sans toucher à la ligne.",
      ceQuiLeDejoue:
        "Klervi Nédélec explique pourquoi le doseur cale : clapets et joints usés, une révision d'une journée un samedi, 7 700 €, qui ramène les micro-arrêts de 9,8 à 6,5 heures par semaine dès la semaine 8, sans ouvrir un seul samedi de plus. Cinq samedis coûtent 32 500 €, et Maëwenn Postec rappelle que la fatigue fait remonter les rebuts et les accidents. Rejoués sur les trente tirages à la place de la révision du doseur, les samedis de juin perdent 55 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Le comité demande s'il garde le projet : une deuxième ligne pour l'an prochain met l'usine à l'abri du prochain été.",
      ceQuiLeDejoue:
        "Erwann Tromeur raconte l'été dernier : sur la ligne 1, le standard n'a pas tenu avec les intérimaires, la moitié du gain s'est perdue en trois semaines ; sur la ligne 5, chaque intérimaire formé en binôme et un changement vérifié par jour, les gains ont tenu à 90 %. Iwan Szymanski ne compte pour juillet que la capacité tenue pendant les congés, et une ligne livrée en janvier ne compte pas. L'étude coûte 24 000 € tout de suite. Rejoué sur les trente tirages à la place de l'ancrage des standards, le dossier de la deuxième ligne perd 64 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une ligne trop petite, d'autres une ligne mal utilisée. Qu'est-ce qui, dans le relevé des arrêts, permettait de trancher ? Rangez chaque perte du relevé dans la disponibilité, la performance ou la qualité.",
    "Un changement de format dure 65 minutes, dont 33 peuvent se faire ligne en marche. Pourquoi ce gain demande-t-il les conducteurs des deux équipes plutôt qu'un standard écrit par le service méthodes ?",
    "Les campagnes hebdomadaires suppriment presque tous les NEP. Pourquoi la roue quotidienne vaut-elle mieux sur des yaourts à 30 jours de DLC ? Que coûtent cinq jours de stock, chambre froide pleine ?",
    "L'équipe d'après-midi propose des NEP de 45 minutes, sans rinçage acide. Que répond le plan de maîtrise sanitaire ? Si aucun prélèvement ne revient positif ce mois-là, la décision devient-elle bonne ?",
    "Sous le tirage n° 12, l'essai du nouveau film a réussi ; il réussit environ deux fois sur trois. Ceux qui ont réglé la tête de scellage ont-ils mal décidé ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Sous le tirage n° 12, la ligne en plus et les samedis finissent à 418 k€, à peine plus que l'attente (364 k€), quand la décomposition atteint 659 k€. D'où vient l'écart ?",
    "Quelle règle gardez-vous pour une ligne qui ne suit plus ? Formulez-la en une phrase, avec les trois composantes du TRS dedans.",
  ],
  prolongement: {
    enonce:
      "Une ligne de conditionnement de crèmes desserts a une cadence nominale de 15 000 pots à l'heure et 80 heures d'ouverture par semaine. Chaque semaine : 5 changements de format de 60 minutes, 8 nettoyages entre recettes de 60 minutes, 6 heures de micro-arrêts, et 5 % de pots produits écartés. 1) Calculez la disponibilité, la performance, la qualité et le TRS, puis le nombre de pots bons par semaine. 2) Un chantier ramène les changements à 30 minutes, et un nouvel ordre des recettes ne laisse que 5 nettoyages. Calculez le nouveau TRS et les pots bons gagnés. 3) Un pot laisse 6 centimes de marge sur coût variable : que vaut le chantier par semaine ?",
    corrige:
      "1) Arrêts : 5 + 8 = 13 heures ; temps brut de fonctionnement 67 heures, disponibilité 67 / 80 = 83,75 % ; temps net de 67 − 6 = 61 heures, performance 61 / 67 ≈ 91,0 % ; qualité 95 %. Pots bons : 61 × 15 000 × 0,95 = 869 250 ; TRS : 869 250 / (80 × 15 000) ≈ 72,4 %. 2) Arrêts : 2,5 + 5 = 7,5 heures ; temps net de 80 − 7,5 − 6 = 66,5 heures ; pots bons : 66,5 × 15 000 × 0,95 = 947 625 ; TRS ≈ 79,0 % ; gain de 78 375 pots par semaine. 3) 78 375 × 0,06 = 4 702,50 € de marge par semaine, sans une heure d'ouverture de plus.",
  },
  evaluation: [
    "Les heures perdues aux changements et aux NEP sont calculées juste à partir du relevé des arrêts, et les autres pertes sont rangées dans la bonne composante du TRS.",
    "La proposition de la semaine 1 s'appuie sur la décomposition des pertes, et non sur le seul TRS global ou le devis d'un fabricant.",
    "L'ordre de fabrication retenu est justifié par la matrice des enchaînements et par la DLC, avec ce qu'il coûte en stock.",
    "Le refus de raccourcir un nettoyage validé est argumenté par le plan de maîtrise sanitaire et par le risque qu'il fait courir aux consommateurs.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Les règles d'enchaînement des recettes (NEP obligatoire après un allergène, d'un parfum foncé vers un clair, d'une recette conventionnelle vers une recette bio), la durée du cycle validé et la règle des deux tiers de DLC à la réception sont celles de l'épisode : elles dépendent du plan de maîtrise sanitaire de chaque site, de la réglementation sur les allergènes et l'agriculture biologique et des cahiers des charges des enseignes, qu'un professionnel de la qualité en agroalimentaire doit relire. La fréquence d'un prélèvement positif à Listeria après un nettoyage écourté est une hypothèse de l'épisode, pas une donnée mesurée.",
};
