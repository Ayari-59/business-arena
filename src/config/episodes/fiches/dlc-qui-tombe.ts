/**
 * FICHE ENSEIGNANT · ÉPISODE 99, LES PALETTES QUI PÉRIMENT.
 *
 * La taille de lot économique (Wilson) sous une contrainte de fraîcheur : une
 * série plus longue coûte moins cher à fabriquer et plus cher à jeter. Le
 * piège : allonger les séries pour le coût unitaire et viser un service
 * parfait par du stock, sur des produits qui ne se stockent pas. Les chiffres
 * du hasard de la classe sont ceux de la graine 12, les moyennes celles des
 * 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "dlc-qui-tombe",
  formations: ["but-gea", "stmg"],
  programme: [
    "BUT GEA · Assurer la gestion et le développement de la chaîne de valeur",
    "STMG · Terminale, enseignement commun, Thème 1, Les organisations et l'activité de production de biens et de services",
  ],
  notion:
    "Produire en grandes séries fait baisser le coût unitaire : moins de changements, moins de pertes au démarrage. Mais chaque pot fabriqué en avance attend en chambre froide, vieillit, et un produit frais a une fenêtre étroite pour quitter l'usine. La taille de lot économique met les deux coûts dans le même calcul (le coût d'un changement de série contre le coût de possession du stock, casse comprise), puis se plafonne à la fenêtre de fraîcheur. L'erreur classique consiste à allonger les séries pour le coût unitaire, à brader les surplus, et à répondre aux ruptures par du stock de sécurité partout. Dans l'épisode, la casse des yaourts aromatisés et des desserts de Loudéac a coûté 2,8 % du chiffre d'affaires au printemps, le double de l'objectif, pendant que le taux de service à Celtis tombait à 96 %. Avec une DLC de 28 jours, des centrales qui en exigent les deux tiers à réception et un jour de transport, un pot doit quitter l'usine en 8 jours. La crème dessert chocolat, lancée par séries de 214 000 pots, a une taille de lot économique de 128 000 pots, six jours de ventes. L'élève découvre que la casse se fabrique au plan de production, qu'un stock de sécurité se cible sur les références dont la prévision est fiable, et qu'une prévision partagée avec l'enseigne vaut mieux qu'une promotion surproduite.",
  objectifs: [
    "Je calcule une taille de lot économique à partir du coût d'un changement de série et du coût de possession du stock, casse comprise.",
    "Je plafonne une série par la fenêtre de fraîcheur tirée de la DLC et de l'exigence des clients à réception.",
    "Je cible un stock de sécurité selon la fiabilité de la prévision de chaque famille de références.",
    "Je compare les destinations d'un surplus consommable (destruction, déstockage, don) sur ce qu'elles rapportent et ce qu'elles coûtent à la marque.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "La gestion des stocks (stock moyen, stock de sécurité, coût de possession, coût de lancement) et la formule de Wilson doivent avoir été vues ; une racine carrée suffit pour le calcul. La DLC et la règle des deux tiers à réception peuvent être présentées en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/dlc-qui-tombe?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la laiterie en deux phrases (trop de casse et trop de ruptures en même temps) sans parler de taille de lot, et vous demandez de noter sur papier la taille de lot calculée en semaine 1 et le plan proposé vendredi.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le plan de la semaine 1 (séries longues, lot économique, petites séries, statu quo) et la réponse de la semaine 6 aux ruptures. Un binôme qui a fini tôt calcule la taille de lot d'une faible rotation (12 000 pots par semaine) et la compare à la fenêtre de 8 jours.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir de la source sur la crème dessert chocolat : la demande, le coût d'un changement, le coût de possession avec le froid et la casse. Vous faites expliquer les valeurs éloignées (245, 90 ou 115 milliers), puis vous plafonnez : 128 000 pots font six jours de ventes, sous la fenêtre de 8 jours ; pour une faible rotation, Wilson donne deux semaines et demie, et c'est la fenêtre qui fixe la série.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (destruction, soldeur, don) et de la semaine 6 (trois jours partout, sécurité ciblée, arrêt de dix références, pénalités). Pour la semaine 4, vous faites lire Iwan Szymanski et Morwenna Pellen : le don rapporte 146,80 € le millier, le soldeur 80 €, mais la photographie d'Opaline a coûté une remise sur toute la marque. Pour la semaine 6, vous faites lire Alwena Coquil : une erreur de prévision de 12 % sur les fortes rotations, de 25 % sur les faibles.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Produire au plus près de la demande » finit à 2 363 k€, avec une casse ramenée à 1,4 % ; « Grandes séries et stock de sécurité » à 2 076 k€, avec 4,7 % de casse, sous l'attente (2 220 k€). Vous montrez ensuite la demande à Celtis sans contrepartie : sous ce tirage, elle finit 20 k€ au-dessus de la prévision partagée, et fait mieux 15 fois sur 30, mais elle perd 11 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la formule de Wilson et son plafond : la série est la plus petite des deux, le lot économique ou ce que la fenêtre de fraîcheur laisse vendre. Vous en tirez la règle : la casse se décide au plan, le stock de sécurité se cible, et une DLC se fixe sur une étude, jamais pour arranger le plan. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 127.92,
    etapes: [
      "Source « Chiffrer un changement de série et la casse de la crème dessert chocolat » : 150 000 pots vendus par semaine, soit D = 150 milliers ; un changement de série coûte 180 € (60 € d'équipe, 24 € de nettoyage, 96 € de mix et de pots perdus).",
      "Coût de possession d'un millier de pots pendant une semaine : 0,90 € de froid et de manutention, plus la casse, 1 % des pots par semaine de stock au coût variable de 240 € le millier, soit 2,40 € ; h = 0,90 + 2,40 = 3,30 €.",
      "Taille de lot économique : Q = √(2 × D × coût du changement / h) = √(2 × 150 × 180 / 3,30) = √16 364 ≈ 127,9 milliers de pots.",
      "Vérification par la fraîcheur : 127,9 / 150 × 7 ≈ 6 jours de ventes, sous la fenêtre de 8 jours (28 jours de DLC, un tiers à garder à réception, un jour de transport). Le lot tient ; aujourd'hui, la série de dix jours de ventes fait 214 000 pots. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 6 milliers près, proche à 20.",
    ],
    erreurs: [
      {
        valeur: 244.95,
        cause:
          "La casse est oubliée dans le coût de possession (h = 0,90 €) : la série calculée fait onze jours de ventes et dépasse la fenêtre de fraîcheur. C'est le conseil de Fanchon Lozac'h : le coût de fabriquer et le coût de jeter dans le même calcul.",
      },
      {
        valeur: 90.45,
        cause:
          "Le 2 de la formule est oublié (√(150 × 180 / 3,30)) : la formule de Wilson compare le coût de lancement au coût du stock moyen, qui vaut la moitié du lot.",
      },
      {
        valeur: 114.76,
        cause:
          "La casse est valorisée au prix de vente de 320 € au lieu du coût variable de 240 € (h = 0,90 + 3,20 = 4,10 €) : un pot jeté coûte ce qu'il a coûté à fabriquer.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Gurvan Kerebel le dit : allonger les séries, c'est moins de changements, moins de pertes au démarrage, un coût unitaire plus bas, et le soldeur prend le surplus au quart du prix.",
      ceQuiLeDejoue:
        "La décomposition de la casse du printemps montre qu'elle vient d'abord des séries trop longues : des pots qui vieillissent en chambre froide, puis que les entrepôts refusent. Les faibles rotations, lancées par séries de trois semaines, font 15 % des volumes et 51 % de la casse, alors qu'un pot doit quitter l'usine en 8 jours. Le lot économique de la crème chocolat est de six jours de ventes, pas de deux semaines. Rejouées sur les trente tirages à la place du lot économique plafonné, les séries longues perdent 70 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Les volumes de Celtis arrivent trop tard : produire chaque promotion 25 % au-dessus de l'historique évite de manquer, et les ruptures de promotion sont les plus chères.",
      ceQuiLeDejoue:
        "La relecture des huit dernières promotions : l'historique se trompe de 28 % dans les deux sens, et les lots promotionnels invendus, qui portent le marquage de l'opération, ne se vendent plus après. Nedjma Benhalima explique que Celtis partage ses volumes à quatre semaines avec les fournisseurs qui s'engagent sur le service, deux fois sur trois avec une contrepartie, et l'erreur tombe alors à 10 %. Rejouée sur les trente tirages à la place de la prévision partagée, la surproduction perd 39 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Le soldeur paie 80 € le millier et enlève à l'usine, quand la méthanisation coûte 6 € : c'est toujours mieux que de détruire.",
      ceQuiLeDejoue:
        "Iwan Szymanski chiffre le don : 60 % de réduction d'impôt sur le coût de revient de 268 €, moins 14 € de logistique, soit 146,80 € le millier, plus que le soldeur. Morwenna Pellen raconte la photographie de l'acheteur d'Opaline chez un soldeur de Saint-Brieuc : une remise sur toute la marque pendant deux mois, et environ 70 € de ventes au prix normal perdues pour chaque millier bradé. Rejoué sur les trente tirages à la place de la convention de don, le déstockage perd près de 22 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Celtis menace de confier ses faibles rotations à Nordal : trois jours de stock sur toutes les références, et plus aucune rupture.",
      ceQuiLeDejoue:
        "Alwena Coquil analyse les ruptures : les fortes rotations ne se trompent que de 12 % et un jour de sécurité couvre presque toutes leurs ruptures ; les faibles se trompent de 25 %, et une série plus trois jours de sécurité dépasse la fenêtre de 8 jours, le stock vieillit plus vite qu'il ne sert. Erwann Tromeur prévient qu'il faudra des samedis et que la chambre froide est presque pleine. Rejoués sur les trente tirages à la place de la sécurité ciblée, trois jours partout perdent 56 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Une seule série en semaine 10 : un changement de format au lieu de deux, et l'opération de rentrée est réglée.",
      ceQuiLeDejoue:
        "La relecture des opérations de rentrée : une série unique fabriquée en semaine 10 arrive pour sa seconde moitié avec moins des deux tiers de sa DLC, et 18 % des pots de la seconde semaine ont été refusés l'an dernier. La seconde semaine se prévoit à 12 % près avec les sorties de caisse des trois premiers jours, à 5 % avec les données de l'enseigne, pour un changement de format de 420 €. Rejouée sur les trente tirages à la place des deux séries, la série unique perd 15 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "C'est la plus grosse opération de l'année, Morwenna ne veut pas manquer : 20 % de plus que le volume annoncé, et aucune rupture.",
      ceQuiLeDejoue:
        "Le volume annoncé ne s'écarte du réel que de 10 % quand Celtis partage ses volumes, et la seconde semaine se règle sur les sorties de caisse de la première : la marge de 20 % se fabrique en lots promotionnels marqués, invendables après l'opération. Rejouée sur les trente tirages à la place des deux séries, elle perd près de 26 k€ en moyenne et ne fait mieux que 5 fois sur 30.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Un objectif de coût unitaire par ligne se mesure chaque jour et tout le monde le comprend ; une prime motive les chefs d'équipe.",
      ceQuiLeDejoue:
        "Gurvan Kerebel se souvient de la prime de 2023 : en deux mois, les séries s'étaient allongées de 40 %, le coût unitaire avait baissé et la casse avait monté, si bien que la prime a été supprimée. Un indicateur qui ne voit qu'un des deux coûts du calcul de Wilson pousse à l'erreur que l'épisode corrige. Fanchon Lozac'h décrit le plan industriel et commercial mensuel de Pontivy, qui a fait baisser la casse en un trimestre. Rejouée sur les trente tirages à la place de ce plan mensuel, la prime perd 56 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le directeur général voyait à la fois de la casse et des ruptures. Pourquoi les deux en même temps disent-ils que l'usine ne fabrique pas ce qui se vend, et pas qu'elle manque de capacité ?",
    "La taille de lot économique de la crème chocolat est de 128 000 pots, celle d'une faible rotation de deux semaines et demie de ventes. Pourquoi applique-t-on la formule à l'une et la fenêtre de fraîcheur à l'autre ?",
    "Sous le tirage n° 12, Celtis a accepté de partager ses volumes ; ceux qui le lui ont demandé sans contrepartie finissent 20 k€ au-dessus. Sur les trente tirages, cette demande perd 11 k€ en moyenne. Laquelle des deux propositions était la meilleure décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Le don rapporte plus que le soldeur, et le soldeur coûte en plus à la marque. Que valent ces deux chiffres pour un produit sous marque de distributeur ?",
    "Trois jours de stock partout, ou un jour sur les seules fortes rotations : pourquoi le stock de sécurité d'une faible rotation vieillit-il plus vite qu'il ne sert ? Qu'est-ce qui le supprime vraiment ?",
    "Sous le tirage n° 12, ceux qui ont porté la DLC à 35 jours sans étude ont eu un lot non conforme, et finissent 262 k€ sous la meilleure méthode. Si le lot avait été conforme, la décision aurait-elle été bonne ? Qui fixe une DLC, et sur quoi ?",
    "Quelle règle proposez-vous au comité de direction pour piloter les lignes à l'automne ? Formulez-la en une phrase, avec la fenêtre de fraîcheur dedans.",
  ],
  prolongement: {
    enonce:
      "Un dessert à faible rotation se vend à 10 000 pots par semaine. Un changement de série coûte 200 €. Un millier de pots gardé une semaine coûte 1,00 € de froid, et 2 % des pots se cassent par semaine de stock, au coût variable de 250 € le millier. La DLC est de 30 jours, les centrales exigent les deux tiers de la DLC à réception, et le transport prend un jour. 1) Calculez la taille de lot économique, en milliers de pots et en jours de ventes. 2) Calculez la fenêtre de fraîcheur, en jours entiers, et la plus grande série qui la respecte. 3) Calculez le coût hebdomadaire des changements et du stock pour cette série plafonnée. Pourquoi ne pas retenir le lot économique, alors qu'il coûterait moins ?",
    corrige:
      "1) h = 1,00 + 0,02 × 250 = 6,00 € ; Q = √(2 × 10 × 200 / 6) = √666,7 ≈ 25,8 milliers de pots, soit environ 18 jours de ventes. 2) Un tiers de 30 jours = 10 jours, moins un jour de transport : 9 jours ; série maximale : 10 × 9 / 7 ≈ 12,9 milliers de pots. 3) Changements : 10 / 12,86 × 200 ≈ 155,60 € ; stock : 12,86 / 2 × 6 ≈ 38,60 € ; total ≈ 194,10 € par semaine. Le lot économique coûterait environ 154,90 € par semaine sur le papier, mais ses pots fabriqués en début de série auraient plus de 9 jours au départ de l'usine : les centrales les refuseraient, et la casse réelle ferait exploser le coût que la formule suppose.",
  },
  evaluation: [
    "La taille de lot économique de la crème chocolat est calculée juste (demande, coût du changement, coût de possession avec la casse au coût variable) et confrontée à la fenêtre de fraîcheur.",
    "Le plan de production distingue les fortes et les faibles rotations, et le plafond de fraîcheur est appliqué là où il s'impose.",
    "Le stock de sécurité et la production des promotions sont justifiés par l'erreur de prévision de chaque famille, et par ce qu'une prévision partagée change.",
    "La destination des surplus est argumentée par ce que chaque voie rapporte et par ce qu'elle coûte à la marque, et la DLC n'est pas touchée sans étude de vieillissement.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La règle des deux tiers de DLC à réception est une exigence contractuelle des centrales dans l'épisode, pas une règle de droit. La DLC est fixée par le fabricant sous sa responsabilité, sur des études de vieillissement et, pour Listeria monocytogenes, des études de croissance : l'épisode le pose ainsi, et un professionnel de la qualité en agroalimentaire doit relire ce passage avant de le présenter comme une méthode. La réduction d'impôt pour don (60 % de la valeur en stock, dans la limite de 5 ‰ du chiffre d'affaires) et les obligations de la réglementation contre le gaspillage alimentaire (convention de don, interdiction de rendre impropres à la consommation des invendus consommables pour certains opérateurs) ont des conditions et des seuils que l'épisode ne détaille pas : à vérifier dans les textes en vigueur. L'épisode pose qu'un produit sous marque de distributeur ne peut pas sortir du circuit de l'enseigne vers un soldeur ; c'est une clause d'usage des contrats de MDD, à présenter comme telle.",
};
