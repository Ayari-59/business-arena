/**
 * FICHE ENSEIGNANT · ÉPISODE 105, LES PRODUCTEURS QUI ARRÊTENT.
 *
 * Sécuriser un approvisionnement agricole : le lait qui manque se voit des
 * années à l'avance, exploitation par exploitation. Le piège : boucher le trou
 * au spot, ou payer tous les producteurs plus cher pour en retenir quelques-uns
 * qui partent pour une autre raison que le prix.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "producteurs-qui-arretent",
  formations: ["but-gea", "bts-gpme"],
  programme: [
    "BUT GEA · Analyser les processus de l'organisation dans son environnement",
    "BUT GEA · Piloter les relations avec les parties prenantes de l'organisation",
    "BTS GPME · Bloc 1, Gérer la relation avec les clients et les fournisseurs de la PME",
  ],
  notion:
    "Un approvisionnement agricole ne se sécurise pas au jour le jour : une exploitation qui s'arrête sans repreneur se voit des années à l'avance, et c'est exploitation par exploitation qu'on la remplace (une installation accompagnée, un voisin qui s'agrandit). L'erreur classique consiste à boucher le trou au spot, au prix du moment, ou à augmenter le prix de base pour tous, alors que ceux qui partent partent pour l'âge, la santé ou l'astreinte de la traite. Dans l'épisode, Hoel Quiniou est responsable de la collecte de la Laiterie de Kerbrélan : 240 millions de litres par an contre 250 l'année d'avant, 61 exploitations sur 310 tenues par un exploitant de plus de 58 ans sans repreneur connu, et 8 % du lait acheté en spot l'automne dernier. L'OP réclame 10 € de plus les 1 000 litres, soit 2,4 M€ par an sur toute la collecte. Les visites des techniciens montrent que 12 de ces exploitations ont en fait un repreneur, et qu'aucun exploitant ne cite le prix. L'élève découvre que 24,5 millions de litres par an sont menacés, qu'un litre gardé sous contrat épargne 50 € les 1 000 litres de spot pendant trois ans, qu'un dispositif complet fait aboutir une installation cinq fois sur dix quand une prime seule n'en fait aboutir que trois, et que le spot de Noël est d'autant plus rare qu'il est cher.",
  objectifs: [
    "Je mesure un risque d'approvisionnement à partir d'un fichier de fournisseurs, en séparant ce qui est menacé de ce qui ne l'est pas.",
    "Je compare le coût d'une mesure générale (une hausse de prix pour tous) à celui d'une action ciblée sur les fournisseurs qui risquent de partir.",
    "Je calcule ce que vaut un volume gardé sous contrat sur plusieurs années, et ce qu'il coûte à garder.",
    "Je choisis comment couvrir un pic de besoin (spot, achat à terme, prime aux producteurs) en tenant compte du risque de manquer.",
  ],
  prerequis:
    "La notion d'approvisionnement, de fournisseur et de contrat d'achat doit avoir été vue en cours, ainsi que le calcul d'un coût sur plusieurs années. Le vocabulaire de la filière laitière (collecte, organisation de producteurs, prix de base, lait spot) peut être découvert pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/producteurs-qui-arretent?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le volume de lait qui disparaît si les exploitations sans repreneur arrêtent dans les trois ans, le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : les sources consultées en semaine 1 (le fichier et les visites, ou la comparaison des prix) et la réponse au pic de Noël en semaine 8, où la classe se partage entre spot, achat à terme et prime de décembre. Un binôme qui a fini tôt calcule ce que coûte la hausse de 10 € sur un an, et ce que vaut un projet d'installation de 500 000 litres gardé trois ans.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir des deux sources décisives : 31,7 millions de litres livrés par les 61 exploitants de plus de 58 ans, moins les 7,2 des 12 qui ont un repreneur en vue, soit 24,5. Vous faites expliquer les valeurs éloignées (31,7, 10, 9,6), puis vous faites dire ce que pèsent 24,5 millions de litres : environ 10 % de la collecte, et plus de 5 semaines d'usine (4,57 millions de litres transformés par semaine).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (spot, hausse générale, plan de transmission, questionnaire), puis ceux de la semaine 8. Pour la semaine 1, vous faites calculer au tableau ce que coûte la hausse (10 € × 240 millions de litres = 2,4 M€ par an) et ce que dit la visite des exploitants : aucun ne cite le prix. Pour la semaine 8, vous faites lire la source sur les trois derniers Noëls : quand le spot est cher, le lait manque partout, et chaque millier de litres qui manque coûte 1 210 €.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Vous prévenez : le prix du spot de l'automne pèse lourd, et le résultat est très bruité. Sous le tirage n° 12, le spot est au plus bas de sa fourchette : « Sécuriser le lait en amont » finit 467 k€ au-dessus du budget, « Acheter le lait qui manque et payer plus cher » 335 k€ en dessous, et l'attentisme 25 k€ en dessous ; sur les trente tirages, la première va de −722 à +729 k€ (130 k€ en moyenne) et tient le budget 18 fois, la deuxième jamais. Vous montrez la décision où le tirage de la classe ment : acheter le pic de Noël au spot fait ici un peu mieux que la prime de décembre, et perd 59 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : le lait se perd trois ans avant, quand personne n'est allé voir l'exploitant de 57 ans. Vous la déclinez : mesurer le volume menacé, agir sur ceux qui risquent de partir (installation accompagnée, voisins qui s'agrandissent), garder le spot pour ce qui reste, et couvrir un pic avant qu'il arrive. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 24.5,
    etapes: [
      "Source « Extraire du fichier des producteurs l'âge des exploitants et les volumes livrés » : sur 310 exploitations, 61 ont un exploitant de plus de 58 ans sans repreneur connu ; elles livrent 31,7 millions de litres par an, 13 % de la collecte.",
      "Source « Envoyer les deux techniciens voir les exploitants de plus de 58 ans » : 12 d'entre elles ont en fait un repreneur en vue (un enfant, un salarié, un associé), pour 7,2 millions de litres par an. Les 49 autres n'en ont pas : 21 en cherchent un, 28 arrêteront sans suite.",
      "Volume qui disparaît si les exploitations sans repreneur arrêtent : 31,7 − 7,2 = 24,5 millions de litres par an, environ 10 % des 240 millions collectés.",
      "Le calendrier des visites : 5 arrêts dans le trimestre, 17 l'an prochain, les autres d'ici trois ans. Le chiffre ne dépend ni du hasard ni des décisions : 24,5 pour toute la classe ; l'épisode le juge juste à 1 million de litres près, proche à 3.",
      "Ce qu'en tire Hoel : à 50 € les 1 000 litres de spot en plus du lait collecté, remplacer 24,5 millions de litres au spot coûterait environ 1,2 M€ par an ; c'est ce que chaque installation et chaque agrandissement permettent d'éviter, une exploitation à la fois.",
    ],
    erreurs: [
      {
        valeur: 31.7,
        cause:
          "Tout le volume des exploitants de plus de 58 ans compté comme perdu : la visite des techniciens montre que 12 d'entre eux ont un repreneur en vue, 7,2 millions de litres qui restent.",
      },
      {
        valeur: 10,
        cause:
          "La baisse de l'an dernier reprise comme prévision (250 − 240) : c'est le lait déjà perdu, pas celui qui est menacé dans les trois ans.",
      },
      {
        valeur: 9.6,
        cause:
          "La baisse de 4 % prolongée sur un an (240 × 4 %) : une tendance ne dit pas qui va s'arrêter ; le fichier et les visites le disent.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "C'est ce que l'usine fait chaque automne : le courtier a du lait pour octobre et novembre, et l'on rouvre le sujet avec l'OP en janvier.",
      ceQuiLeDejoue:
        "Le fichier des producteurs montre que les 10 millions de litres perdus en un an viennent pour l'essentiel de seize exploitations qui ont cessé sans reprise, toutes tenues par des exploitants de plus de 58 ans : le trou va se creuser, et le spot coûte 50 € les 1 000 litres de plus que le lait collecté. Visant Kerdiles le disait : « ça bouche le trou de la semaine, et la semaine d'après le trou est toujours là ». Le plan de transmission coûte 15 000 € (six semaines de CDD). Rejoué sur les trente tirages à la place du plan, le spot au fil des besoins perd 282 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "L'OP la réclame, Nordal paierait mieux : 10 € de plus retiennent les producteurs et calment l'assemblée.",
      ceQuiLeDejoue:
        "Iwan Szymanski chiffre la hausse : 2,4 M€ par an sur toute la collecte, environ 41 000 € par semaine, et un prix de base ne se reprend pas. La comparaison des prix montre des écarts de quelques euros (Nordal à +3 €, Trévallec à −3 €) qui changent de sens d'une année à l'autre, et aucun des exploitants visités ne cite le prix : l'âge, la santé, l'astreinte, une mise aux normes. Konogan Kerguéris le reconnaît lui-même : « ceux qui partent à la retraite partiront quand même ». Rejouée sur les trente tirages à la place du plan, la hausse perd 561 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "C'est comme chaque Noël, et le spot de la semaine est encore raisonnable : pourquoi payer une prime ou s'engager à 600 € ?",
      ceQuiLeDejoue:
        "La source sur les trois derniers Noëls le dit : au prix du spot s'ajoutent environ 35 € à Noël, et les années chères le courtier n'a trouvé que 500 000 litres par semaine au pic, contre plus d'un million les années calmes ; le contrôle de gestion chiffre chaque millier de litres qui manque à 1 210 € (marge des crèmes desserts et 8 % de pénalités des enseignes). Sous le tirage n° 12, le spot est au plus bas et le spot de Noël fait 1 k€ mieux que la prime de décembre ; sur les trente tirages, il perd 59 k€ en moyenne et ne fait mieux que 2 fois.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de prix, d'autres un creux de saison. Qu'est-ce qui, dans le fichier et les visites, montrait que c'était un problème de transmission ?",
    "La hausse de 10 € coûte 2,4 M€ par an. Combien d'exploitants retient-elle, et pourquoi si peu ? À qui va l'argent ?",
    "Un dispositif complet (contrat de dix ans, prime de 15 €, technicien, avance) fait aboutir une installation cinq fois sur dix, une prime de 30 € sans accompagnement trois fois. Pourquoi la prime la plus forte fait-elle moins bien, et que paie-t-elle à ceux qui se seraient installés de toute façon ?",
    "Padrig Guillouzic dit que ce n'est pas le prix qui le fait hésiter. Sur les trente tirages, la prime individuelle au GAEC fait mieux que le dispositif 17 fois, et perd pourtant en moyenne : pourquoi ? Que coûte-t-elle si l'OP l'apprend ?",
    "Sous le tirage n° 12, le spot était au plus bas, et ceux qui ont acheté le pic de Noël au spot n'ont rien perdu. Avaient-ils raison ? Qu'est-ce qui distingue la qualité d'une décision de son résultat, quand le hasard pèse autant que dans cet épisode ?",
    "Ouvrir du volume à tous, ou garantir un volume aux voisins des exploitations qui s'arrêtent : pourquoi le même litre ne vaut-il pas la même chose selon la saison où il arrive et l'endroit où il est produit ?",
    "Quelle règle gardez-vous pour sécuriser un approvisionnement ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie collecte 200 millions de litres par an. Le lait qu'il faut racheter au spot quand il manque coûte 50 € les 1 000 litres de plus que le lait collecté. Dix projets de reprise d'exploitation de 400 000 litres par an chacun sont repérés. 1) Option A : un dispositif accompagné, qui fait aboutir un projet sur deux, avec 2 500 € d'appui technique par projet suivi et une prime de 15 € les 1 000 litres versée trois ans aux projets qui aboutissent. Option B : une prime de 30 € les 1 000 litres pendant trois ans, sans accompagnement, qui fait aboutir trois projets sur dix. Pour chaque option, calculez le volume gardé, ce qu'il évite de spot en trois ans, ce qu'il coûte et le gain net. 2) L'OP demande à la place une hausse de 10 € les 1 000 litres sur toute la collecte, pendant un an ; on estime qu'elle retarderait d'un an l'arrêt de deux exploitations de 500 000 litres. Calculez son coût et ce qu'elle évite de spot.",
    corrige:
      "1) Option A : 10 × 0,4 × 50 % = 2 millions de litres par an gardés ; spot évité 2 000 000 / 1 000 × 50 × 3 = 300 000 € ; coût 10 × 2 500 = 25 000 € d'appui et 15 × 2 000 × 3 = 90 000 € de prime, soit 115 000 € ; gain net 185 000 €. Option B : 10 × 0,4 × 30 % = 1,2 million de litres par an ; spot évité 1 200 × 50 × 3 = 180 000 € ; prime 30 × 1 200 × 3 = 108 000 € ; gain net 72 000 €. Le dispositif accompagné garde plus de lait pour une prime plus faible. 2) Coût : 10 × 200 000 = 2 000 000 € (200 millions de litres font 200 000 milliers de litres). Lait gardé : 2 × 0,5 = 1 million de litres, une année, soit 1 000 × 50 = 50 000 € de spot évité. La hausse coûte 40 fois ce qu'elle rapporte : elle paie tous les producteurs pour en retenir deux.",
  },
  evaluation: [
    "Le volume menacé est calculé juste (31,7 − 7,2 = 24,5 millions de litres par an) à partir des deux sources nommées, et l'élève explique pourquoi la tendance ou le fichier seul ne suffisent pas.",
    "La hausse générale du prix de base est chiffrée (2,4 M€ par an) et comparée à une action ciblée sur les exploitations sans repreneur.",
    "Le dispositif d'installation est jugé sur ses chances d'aboutir et sur ce qu'il coûte par litre gardé, pas sur le montant de la prime.",
    "La couverture du pic de Noël est argumentée en tenant compte du risque de manquer de lait et de ce que coûte une rupture, pas du seul prix du spot de la semaine.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode simplifie la contractualisation laitière : l'accord-cadre entre la laiterie et l'organisation de producteurs, la possibilité d'une prime individuelle et la durée des contrats y sont posés pour le jeu. Avant d'en tirer une règle de droit (contrats écrits obligatoires, rôle des organisations de producteurs, construction du prix selon les lois EGAlim), un enseignant de droit ou d'économie doit relire les textes en vigueur. La destruction du lait non refroidi et des citernes positives aux inhibiteurs est reprise de l'épisode telle qu'il la pose.",
};
