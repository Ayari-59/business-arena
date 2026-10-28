/**
 * FICHE ENSEIGNANT · ÉPISODE 106, LE POT EN PLASTIQUE QU'IL FAUT REMPLACER.
 *
 * Conduire un changement d'emballage comme un projet : qualifier sur une ligne
 * avant de toucher à toute la gamme, et compter le coût sur une année, pas le
 * prix du pot. Le piège : tout basculer au carton pour l'annonce du salon, ou
 * attendre l'échéance sans rien engager.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "pot-a-remplacer",
  formations: ["but-gaco", "bts-sam", "but-gea"],
  programme: [
    "BUT GACO · Gérer un projet interne ou externe à l'organisation",
    "BTS SAM · Bloc 2, Gestion de projet",
    "BUT GEA · Aider à la prise de décision",
  ],
  notion:
    "Le coût d'un emballage n'est pas le prix du pot : c'est le prix du pot, plus l'éco-contribution, plus les rebuts qu'il fait à la ligne, plus la cadence qu'il fait perdre, plus la DLC qu'il ne tient pas. Et un changement d'emballage se qualifie sur une ligne et une référence avant de toucher à toute la gamme, parce que les fiches des fournisseurs sont écrites sur leurs lignes pilotes. L'erreur classique consiste à tout basculer au carton pour l'annonce du salon, les deux lignes à la fois et sans essai, ou à garder le polystyrène en attendant l'échéance, qui ne supprime pas le changement. Dans l'épisode, Azilis Cozic, responsable emballages de la Laiterie de Kerbrélan, doit rendre recyclables les 40 millions de pots de yaourts en dix-huit mois, comme l'exige Celtis, quand le président veut annoncer le carton au salon de mars. Le pot carton coûte 1,82 centime contre 1,30 pour le polystyrène, mais son éco-contribution est de 0,17 centime contre 0,36 : 132 k€ de surcoût par an, quand le polypropylène ne coûte que 24 k€ de plus. L'élève découvre que l'essai industriel de 22 000 € mesure une perte de cadence du carton bien plus forte que les 10 % annoncés, qu'un dossier chiffré obtient de Celtis une part du surcoût qu'une demande sans justificatif n'obtient pas, et qu'on n'annonce que ce qu'on a mesuré et daté.",
  objectifs: [
    "Je calcule le surcoût annuel d'un emballage en ajoutant au prix du pot l'éco-contribution, les rebuts et la cadence perdue.",
    "Je découpe un projet de changement en étapes (essai, choix, négociation, bascule ligne par ligne) et je justifie leur ordre.",
    "Je distingue une donnée annoncée par un fournisseur d'une donnée mesurée sur nos lignes, et je dis ce que l'essai apprend.",
    "J'argumente une demande de partage d'un surcoût par un dossier chiffré, et une annonce publique par ce qui est mesuré et daté.",
  ],
  prerequis:
    "La notion de projet (objectif, étapes, jalons, risques), le calcul d'un coût unitaire et d'un coût annuel doivent avoir été vus en cours. Le vocabulaire de l'emballage (éco-contribution, cadence, rebut, DLC) peut être découvert pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/pot-a-remplacer?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le surcoût annuel du pot carton sur la gamme, éco-contribution comprise, et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 (carton pour le salon, PP sur les fiches, essai, rien) et la demande faite à Celtis en semaine 6, où la classe se partage entre le forfait de 30 % et le dossier chiffré. Un binôme qui a fini tôt calcule le coût d'une année de PP avec les fiches de Maëlpack, puis avec les mesures de l'essai.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir des deux sources décisives : 1,82 + 0,17 − 1,30 − 0,36 = 0,33 centime par pot, sur 40 millions de pots, 132 k€. Vous faites expliquer les valeurs éloignées (208, 24, 66), puis vous faites le même calcul pour le PP : 0,06 centime, 24 k€. Vous terminez par ce que le calcul ne compte pas encore : les rebuts et la cadence, que seule la ligne dira.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (PP, carton, polystyrène) et de la semaine 6. Pour la semaine 4, vous faites lire les résultats de l'essai sous le tirage n° 12 : le PP perd environ 7 % de cadence pour 1,6 % de rebut, le carton 23 % de cadence pour 2 % de rebut, quand les fiches annonçaient 4 % et 10 %. Pour la semaine 6, vous faites lire le compte rendu de Cyrielle Mainguené : « Nous demandons du recyclable, pas du carton. »",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Le coût du changement est toujours une perte : on juge qui perd le moins. Sous le tirage n° 12, « Qualifier, mesurer, déployer par étapes » coûte 180 k€, « Attendre l'échéance » 331 k€ et « Tout le carton pour le salon » 553 k€ ; sur les trente tirages, la première coûte toujours le moins, et le carton pour le salon fait pire que l'attente 28 fois. Vous montrez la décision où le tirage de la classe ment : Celtis a refusé le dossier chiffré cette fois, et le forfait de 30 % fait ici 8 k€ mieux ; sur les trente tirages, il perd 5 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle d'Efflam Jézéquel : un emballage se qualifie sur une ligne et une référence avant de toucher aux autres, et son coût se compte sur une année, pas au prix du pot. Vous la déclinez en étapes de projet : l'essai, le choix sur les mesures, le dossier à l'enseigne avant le 1er mars, la bascule ligne par ligne en hiver, l'annonce de ce qui est daté. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 132,
    etapes: [
      "Source « Comparer les deux offres d'emballage » : le pot carton de Kervidal Cartonnages coûte 1,82 centime, le polystyrène d'aujourd'hui 1,30 centime ; écart de prix : 0,52 centime par pot.",
      "Source « Lire le barème de l'éco-organisme et notre dernière déclaration » : 40 millions de pots déclarés ; éco-contribution de 0,36 centime en polystyrène, malus compris, et de 0,17 centime en carton : le carton en fait économiser 0,19.",
      "Surcoût par pot, éco-contribution comprise : (1,82 + 0,17) − (1,30 + 0,36) = 1,99 − 1,66 = 0,33 centime, soit 0,0033 €.",
      "Surcoût annuel sur la gamme : 0,0033 × 40 000 000 = 132 000 €, soit 132 k€. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 10 k€ près, proche à 40.",
      "Le même calcul pour le PP de Maëlpack : (1,52 + 0,20) − 1,66 = 0,06 centime, soit 24 k€ par an. Ni l'un ni l'autre ne compte encore les rebuts et la cadence perdue : sur les fiches des fournisseurs, une année coûte 48 k€ en PP et 194 k€ en carton.",
    ],
    erreurs: [
      {
        valeur: 208,
        cause:
          "L'éco-contribution oubliée : seul l'écart de prix du pot est compté (0,52 centime × 40 millions), alors que le barème allège le carton de 0,19 centime.",
      },
      {
        valeur: 24,
        cause:
          "Le surcoût du PP donné à la place de celui du carton : c'est l'autre offre, à 0,06 centime de plus par pot.",
      },
      {
        valeur: 66,
        cause:
          "Une seule ligne comptée (20 millions de pots) : la gamme passe sur les deux lignes, 40 millions de pots par an.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le président le veut, Nordal n'y est pas encore, et les consommateurs préfèrent le carton : lancer tout de suite, c'est être prêt pour le salon.",
      ceQuiLeDejoue:
        "Erwann Tromeur prévient que les lignes sont réglées pour le polystyrène depuis quinze ans et que le dernier changement d'opercule a mis six semaines à se stabiliser ; l'étude consommateurs ne mesure aucun achat. Basculer deux lignes à la fois sans essai, c'est risquer des pots mal scellés, des lots détruits et des ruptures. L'essai coûte 22 000 €. Rejoué sur les trente tirages à la place de l'essai, le carton pour le salon coûte 96 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "L'échéance de Celtis est dans dix-huit mois : rien ne presse, et l'on ne dépense rien ce trimestre.",
      ceQuiLeDejoue:
        "Cyrielle Mainguené l'écrit dès la semaine 1 : un fournisseur sans plan à la clôture des négociations, le 1er mars, perd ses mises en avant de printemps, 35 000 € dans le modèle. Attendre reporte la bascule à la veille de l'échéance, les deux lignes ensemble, au printemps, quand tous les fournisseurs se convertissent et que les kits coûtent 20 % de plus. Rejoué sur les trente tirages à la place de l'essai, ne rien engager coûte 134 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "C'est le pot que le président veut montrer, le plus vert aux yeux des clients, et son éco-contribution est la plus faible.",
      ceQuiLeDejoue:
        "Sous le tirage n° 12, l'essai sur la ligne 2 mesure une perte de cadence de 23 % pour le carton (10 % annoncés) et un rebut de 2 %, contre 7 % et 1,6 % pour le PP ; le carton fuit au scellage dès que l'humidité du bord monte. Chaque point de cadence perdu coûte environ 3 000 € par an en samedis et en intérim. Une année de PP mesurée coûte 68 k€ de plus que le polystyrène ; le carton, environ 241 k€. Rejoué sur les trente tirages à la place du PP, le carton coûte 269 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Une filière de recyclage du polystyrène est à l'étude : on évite de dépenser pour un changement qui ne servira peut-être à rien.",
      ceQuiLeDejoue:
        "Pétroc Guézennec le dit : la filière ne sera pas en place avant trois ans, et Celtis ne comptera comme recyclable que ce que le barème reconnaît le jour de l'échéance. Garder le polystyrène, c'est basculer dans l'urgence plus tard, et perdre les mises en avant de printemps. Rejoué sur les trente tirages à la place du PP, le polystyrène coûte 198 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Les équipements sont là : basculer les deux lignes en semaines 10 et 11, c'est montrer au salon toute la gamme sortie de nos lignes.",
      ceQuiLeDejoue:
        "Klervi Nédélec le dit : ses techniciens peuvent accompagner une ligne à la fois, « deux lignes qui démarrent ensemble, ce sont des régleurs partout et nulle part ». Erwann ajoute que la ligne 1 fait les aromatisés et les fruits, où le scellage lâche, et qu'une ligne qui a tourné un mois apprend à l'autre ses réglages. Rejouée sur les trente tirages à la place de la bascule par étapes, la bascule des deux lignes d'un coup coûte 31 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "C'est la phrase que le président a écrite, et l'annonce la plus forte face à Nordal.",
      ceQuiLeDejoue:
        "Annaïg Le Dantec rappelle qu'une allégation « recyclable » doit être vraie le jour où le produit est en rayon, et qu'annoncer une matière qu'on ne mettra pas en ligne coûte environ 20 000 € de rectification ; Emerance Delafosse, chez Opaline, ne suivra que « un calendrier qui tient et des coûts mesurés ». Rejouée sur les trente tirages à la place de l'annonce de ce qui est mesuré et daté, l'annonce du carton coûte 26 k€ de plus en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une question d'image, d'autres une question de prix du pot. Qu'est-ce qui, dans les sources, montrait que le changement se jouait d'abord sur la ligne ?",
    "Le carton coûte 0,52 centime de plus au pot, mais seulement 0,33 éco-contribution comprise. Pourquoi le surcoût réel d'une année est-il pourtant bien plus élevé ? Qu'est-ce que l'essai a appris que les fiches ne disaient pas ?",
    "Pourquoi un essai de 22 000 € sur une seule référence vaut-il plus que deux semaines gagnées pour le salon ?",
    "Sous le tirage n° 12, Celtis a refusé le dossier chiffré, et ceux qui ont accepté le forfait de 30 % finissent mieux. Sur les trente tirages, le forfait fait mieux 12 fois et perd pourtant 5 k€ en moyenne : lequel choisissez-vous, et sur quel critère ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Basculer les deux lignes ensemble, produire une demi-semaine d'avance, ou passer ligne par ligne : qu'est-ce que la DLC de trente jours interdit, et qu'est-ce que la maintenance permet ?",
    "Pourquoi le président ne doit-il annoncer que ce qui est mesuré et daté ? Que risque la laiterie auprès des enseignes et des contrôleurs ?",
    "Quelle règle gardez-vous pour conduire un changement de ce type ? Formulez-la en une phrase, avec les étapes dedans.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie vend 10 millions de pots par an en polystyrène, à 1,40 centime le pot et 0,40 centime d'éco-contribution. Deux solutions recyclables : le PP à 1,60 centime et 0,22 centime d'éco-contribution ; le carton à 1,95 centime et 0,18 centime. L'essai sur ligne a mesuré un rebut de 1,5 % en PP et de 2,5 % en carton, contre 1 % en polystyrène ; un pot rebuté coûte 0,10 €. La cadence baisse de 5 % en PP et de 15 % en carton, et chaque point de cadence perdu coûte 1 000 € par an. 1) Calculez, pour chaque matière, le surcoût annuel au seul prix du pot. 2) Calculez le surcoût annuel complet : pot, éco-contribution, rebuts, cadence. 3) Quelle matière retenez-vous, et que vous aurait fait conclure le seul prix du pot ?",
    corrige:
      "1) Au prix du pot : PP (1,60 − 1,40) × 10 000 000 / 100 = 20 000 € ; carton (1,95 − 1,40) × 100 000 = 55 000 €. 2) Pot et éco-contribution : PP (1,60 + 0,22) − (1,40 + 0,40) = 0,02 centime, soit 2 000 € ; carton (1,95 + 0,18) − 1,80 = 0,33 centime, soit 33 000 €. Rebuts : PP 0,5 % × 10 000 000 × 0,10 = 5 000 € ; carton 1,5 % × 10 000 000 × 0,10 = 15 000 €. Cadence : PP 5 × 1 000 = 5 000 € ; carton 15 × 1 000 = 15 000 €. Total : PP 12 000 € par an, carton 63 000 €. 3) Le PP : 12 000 € par an, contre 63 000 € pour le carton. Au seul prix du pot, on aurait surestimé le PP (20 000 € au lieu de 12 000) et sous-estimé le carton (55 000 € au lieu de 63 000) : l'éco-contribution, les rebuts et la cadence changent l'écart.",
  },
  evaluation: [
    "Le surcoût annuel du carton est calculé juste (0,33 centime × 40 millions de pots = 132 k€), éco-contribution comprise, à partir des deux sources nommées.",
    "Le choix de la matière s'appuie sur les mesures de l'essai (cadence, rebut, DLC), et l'élève explique ce que les fiches des fournisseurs ne disaient pas.",
    "Les étapes du projet sont ordonnées et justifiées : essai, choix, dossier avant le 1er mars, bascule ligne par ligne, annonce de ce qui est daté.",
    "La demande à Celtis est argumentée par un coût mesuré et un calendrier, et l'élève sait dire ce qu'elle risque face au forfait.",
    "L'élève distingue, sur la décision de la semaine 6, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Les barèmes d'éco-contribution, la notion de « recyclable » et l'encadrement des allégations environnementales relèvent de textes qui évoluent (filière de responsabilité élargie des emballages ménagers, règles françaises et européennes sur les emballages) : les montants de l'épisode sont fictifs, et la règle doit être vérifiée avant d'être énoncée. La phrase d'Iwan Szymanski selon laquelle le surcoût de l'emballage n'est pas protégé dans la négociation comme la matière première agricole est à relire avec un enseignant de droit commercial avant d'en faire une règle.",
};
