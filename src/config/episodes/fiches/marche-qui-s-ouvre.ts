import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 43, LE MARCHÉ QUI S'OUVRE.
 *
 * Compter un marché par le bas, tester avant d'engager, juger le test sur ce
 * qui décide et étendre sur ses chiffres. Les chiffres du corrigé, des
 * réflexes et du débrief se recalculent depuis le modèle de l'épisode
 * (src/engine/episodes/marche-qui-s-ouvre.ts) ; ceux du hasard de la classe
 * sont ceux de la graine 1, les moyennes celles des 30 tirages du bilan,
 * les autres décisions restant celles de la meilleure méthode.
 */
export const FICHE: FicheEnseignant = {
  code: "marche-qui-s-ouvre",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
  ],
  notion:
    "Entrer sur un marché nouveau, c'est d'abord le compter par le bas (clients possibles, part qui achète chaque année, part qui achète l'offre, prix), puis reconnaître que l'inconnue qui décide n'est pas sa taille mais le rythme auquel il achètera. Quand cette inconnue est forte, un test limité est une option réelle : il coûte peu et achète le droit d'étendre si les chiffres le justifient, de s'arrêter sinon ; la notion se rattache à la théorie des options réelles (Myers, puis Dixit et Pindyck) et, pour la conduite du test, à la planification par la découverte de McGrath et MacMillan. L'erreur classique est double : engager tout le réseau sur le chiffre d'un cabinet pour être le premier, ou attendre qu'un autre ait prouvé le marché ; s'y ajoute le test « fait pour réussir », mené dans les meilleurs sites ou jugé sur une moyenne, qui ne mesure pas ce qui décide. Dans l'épisode, un cabinet annonce 650 M€ quand les trente agences d'Arvel ont 72 M€ à portée, et une agence moyenne signera 20, 13 ou 7 bouquets par an selon le scénario, pour un seuil de rentabilité de 11 : seul un test sur trois agences représentatives, jugées une par une contre ce seuil, dit s'il faut en équiper trente, dix ou aucune. Le piège revient en semaine 8, quand le président veut tenir le plan validé et le cabinet accélérer, et dans les contrats à volume garanti, artisans ou fabricant, calés sur un marché que personne ne connaît encore.",
  objectifs: [
    "J'estime un marché accessible par le bas, du nombre de clients possibles au prix de l'offre, et je le distingue du chiffre d'un cabinet par son périmètre et ses hypothèses.",
    "Je compare, scénario par scénario, un engagement massif, un engagement partiel et un test suivi d'une extension, et je dis ce que vaut l'information que le test achète.",
    "Je conçois un test qui mesure ce qui décide : des sites représentatifs, un indicateur par site et un critère fixé d'avance, le seuil de rentabilité.",
    "Je révise un plan validé au vu des chiffres du test, à la hausse comme à la baisse, et je distingue un engagement qui protège à peu de frais d'un engagement de volume qui se paie quand le marché déçoit.",
  ],
  prerequis:
    "L'estimation d'un marché (marché total, marché accessible), la marge sur coût variable et le seuil de rentabilité, la valeur actuelle d'une suite de flux ; la notion d'option réelle peut être découverte en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/marche-qui-s-ouvre?hasard=1 : toute la classe joue le même trimestre, sous le même hasard. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous ne dites rien du test ni des options réelles : vous demandez seulement de noter, à chaque décision, le chiffre qui l'a emportée.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les six décisions, de la semaine 1 à la semaine 10. Vous circulez sans donner de réponse et relevez au tableau, sans commentaire, le marché estimé en semaine 1 et l'option choisie aux décisions 1 (l'entrée), 2 (le test) et 5 (le plan de janvier). Ceux qui finissent tôt rejouent les mêmes décisions sous un autre hasard et notent l'écart.",
    },
    {
      minutes: 15,
      titre: "Correction du marché accessible",
      detail:
        "Vous affichez les estimations de la classe, de la plus basse à la plus haute : les valeurs autour de 97,5 M€ viennent du cabinet, celles autour de 180 M€ oublient la part vendue en bouquet. Vous reconstruisez au tableau 400 000 × 3 % × 40 % × 15 k€ = 72 M€, puis vous montrez que même ce chiffre ne décide pas : les trente agences en capteraient de 4,4 à 12,5 % selon le scénario.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous prenez d'abord la décision 1 : chaque camp (les trente agences, les dix grandes, le test, l'attente) défend son choix, puis vous posez au tableau la valeur de chaque option dans les trois scénarios. Vous enchaînez sur la décision 2, ce que le test devait mesurer, et sur la décision 5, réviser ou tenir le plan. Vous terminez par les artisans, où « ne rien signer » a gagné sous le hasard de la classe.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous prévenez la classe : le hasard pèse lourd dans cet épisode, mais le hasard n° 1 est un tirage ordinaire, où aucun réflexe pris seul ne bat la méthode. Le marché y suit le scénario moyen et Solvéane ne vient pas ; la méthode y fait 153 k€, au milieu de ses 30 tirages, et « être les premiers partout » perd 149 k€, quand sur les 30 tirages il fait 3 k€ contre 259 k€ et perd de l'argent 22 fois. Vous faites ouvrir le bilan et comparer, décision par décision, le résultat obtenu au résultat moyen ; chez qui a lancé partout puis tout signé, le bloc « Vos décisions s'enchaînent » montre ce que ce détail ne dit pas.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez la démarche en quatre temps : compter le marché par le bas, identifier l'inconnue qui décide, acheter l'information au plus petit prix par un test qui la mesure, étendre ou arrêter sur ses chiffres. Vous ajoutez la règle des engagements : protéger la ressource rare à peu de frais, ne jamais garantir un volume calé sur un marché qu'on ne connaît pas. Vous distribuez le cas de prolongement.",
    },
  ],
  calcul: {
    reponse: 72,
    etapes: [
      "« Extraire les données de logement de la zone des agences » : 400 000 maisons individuelles dans la zone de chalandise des trente agences, dont 3 % engagent chaque année des travaux de rénovation énergétique aidés, soit 400 000 × 0,03 = 12 000 chantiers par an.",
      "« Interroger trente artisans RGE clients » : 4 chantiers sur 10 se vendent en bouquet coordonné, soit 12 000 × 0,4 = 4 800 bouquets par an ; les autres sont vendus lot par lot par l'artisan seul et ne sont pas à la portée de l'offre.",
      "Même source : un bouquet coûte en moyenne 15 k€ hors taxes, pose comprise. Marché accessible = 4 800 × 15 000 € = 72 000 000 €, soit 72 M€ de chiffre d'affaires par an. Il ne dépend pas du hasard : toute la classe doit trouver 72 ; l'épisode juge juste à 4 M€ près, proche à 12 M€.",
      "Contraste avec « Lire l'étude de Varenge Conseil » : 650 M€ couvrent tous les logements de la région, maisons et immeubles, dans le seul scénario où les aides augmentent ; les 15 % qu'Arvel « peut viser », soit 97,5 M€, sont une part postulée, pas un calcul.",
      "Ce que le chiffre ne dit pas : selon l'économiste de la fédération, une agence moyenne signera 20, 13 ou 7 bouquets par an, soit 600, 390 ou 210 pour le réseau, 12,5 %, 8,1 % ou 4,4 % des 4 800 bouquets accessibles. La taille du marché n'est pas l'inconnue ; le rythme de captation l'est, et c'est lui que le test doit mesurer.",
    ],
    erreurs: [
      {
        valeur: 97.5,
        cause:
          "Le chiffre du cabinet, 650 M€ × 15 % : l'élève reprend une part de marché postulée sur un périmètre (toute la région, immeubles compris) et un scénario (aides en hausse) qui ne sont pas ceux des agences. L'épisode la juge fausse.",
      },
      {
        valeur: 180,
        cause:
          "12 000 chantiers × 15 k€ : la part vendue en bouquet (4 sur 10) est oubliée, et l'on compte comme accessibles des chantiers que l'artisan vend seul, lot par lot.",
      },
      {
        valeur: 7.2,
        cause:
          "4 800 bouquets × 1 500 € : l'élève calcule la marge sur coût variable qu'Arvel tirerait de tout le marché, et non le chiffre d'affaires accessible que la question demande.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le président le veut, Solvéane regarde la région, et le cabinet annonce 650 M€ : il faut être le premier partout.",
      ceQuiLeDejoue:
        "Le lancement engage 510 k€ (250 k€ de stock, 80 k€ de campagne, 180 k€ d'ouvertures), plus que l'enveloppe de 500 k€, avant le premier bouquet, et l'étude des autres régions dit que Solvéane vient trois fois sur quatre après un lancement à grand bruit. Les autres décisions restant les meilleures, il fait 14,5 k€ en moyenne sur les 30 tirages contre 258,7 k€ pour le test, et −515 k€ dans le pire dixième : il gagne un peu dans le scénario porteur, perd lourdement dans les deux autres.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Le marché n'est pas prouvé, le chiffre du cabinet est douteux : attendre ne coûte rien et ne risque rien.",
      ceQuiLeDejoue:
        "Attendre n'apprend rien à Arvel et laisse Solvéane venir plus d'une fois sur deux, avec 80 k€ de marge de négoce à la clé quand les artisans ne sont engagés nulle part. C'est l'option la plus sûre (−40 k€ dans le pire dixième), mais elle fait −25,6 k€ en moyenne, 284 k€ de moins que le test, qui coûte 18 k€ d'ouvertures et 8 k€ de protocole.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Les directeurs régionaux proposent les trois plus grosses agences : un test doit réussir, et c'est là que sont les maisons et les meilleurs artisans.",
      ceQuiLeDejoue:
        "« Comparer ce que vendent les agences du réseau » montre que les grandes vendent 1,4 fois la moyenne et les autres 0,8 fois : dans le scénario moyen, une grande signe 18,2 bouquets par an et une autre 10,4, sous le seuil de 11. Le test en vitrine fait alors passer le marché pour porteur et étendre à vingt agences qui perdent de l'argent ; il fait mieux quinze fois sur 30, de 10 à 15 k€ (le protocole économisé), mais perd de 171 à 199 k€ les quinze autres, 85 k€ de moins en moyenne.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Solvéane appelle les artisans un par un : en prendre 120 en exclusivité avec des chantiers garantis, c'est lui fermer la porte.",
      ceQuiLeDejoue:
        "« Chiffrer les deux formules d'engagement des artisans » donne 240 bouquets garantis par an pendant deux ans, quand les dix grandes agences n'en signeraient que 182 dans le scénario moyen : 58 manquants × 300 € sur deux ans, soit 30,2 k€ de pénalités, et 125,0 k€ si le marché est difficile et l'offre arrêtée. La charte protège presque autant pour 20 k€ ; l'exclusivité fait 32 k€ de moins en moyenne.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Nordhalm paie 40 % des ouvertures et fait la meilleure remise, 8 % : c'est de l'argent tout de suite.",
      ceQuiLeDejoue:
        "« Rapporter l'engagement de volume aux bouquets » le dit : 300 pompes, c'est 750 bouquets par an, plus que les 600 des trente agences dans le meilleur scénario. À 250 € par pompe manquante pendant trois ans, les pénalités valent 37,3 k€ dans le scénario porteur, 141,3 k€ dans le moyen et 186,5 k€ dans le difficile ; l'exclusivité fait 48 k€ de moins en moyenne que le référencement sans volume.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le comité a validé les dix grandes agences en semaine 1 ; changer de plan, c'est se déjuger devant le président.",
      ceQuiLeDejoue:
        "« Lire les résultats du test, agence par agence » et « Poser le seuil de rentabilité d'une agence » donnent la réponse : une agence couvre ses charges fixes à 11 bouquets par an, 12,6 avec l'ouverture. Tenir le plan laisse vingt agences rentables de côté dans le scénario porteur et ouvre dix agences déficitaires dans le difficile : il ne fait mieux que la révision sous aucun des 30 tirages, 90 k€ de moins en moyenne.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Le cabinet dit que les premiers chiffres confirment le marché et que le risque est d'être trop prudent : Solvéane n'attendra pas.",
      ceQuiLeDejoue:
        "Les chiffres du test, jugés agence par agence, ne justifient tout le réseau que dans le scénario porteur ; dans le moyen, une petite agence signe 10,4 bouquets par an et perd 900 € chaque année, dans le difficile toutes perdent. Accélérer ne fait jamais mieux que réviser sur les 30 tirages, 196 k€ de moins en moyenne, et −482 k€ dans le pire dixième.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Si Solvéane voit qu'Arvel casse ses prix, il ne viendra pas : une baisse de commission dissuade avant qu'il soit trop tard.",
      ceQuiLeDejoue:
        "« Chiffrer les deux ripostes » : la baisse coûte 150 € sur chaque bouquet de la première année, que Solvéane vienne ou non, plus 5 k€ de campagne, soit 29,8 k€ avec le plan de dix grandes agences du hasard n° 1, pour une chance sur dix de moins qu'il vienne. La riposte ciblée ne coûte 5 k€ que s'il arrive ; la baisse préventive fait 30 k€ de moins en moyenne.",
    },
  ],
  debrief: [
    "En semaine 1, qu'est-ce qui sépare les 72 M€ du marché accessible des 97,5 M€ du cabinet ? Faites nommer les trois différences (périmètre, scénario, part postulée), puis demandez pourquoi aucun de ces deux chiffres ne suffisait à décider l'entrée : à 20, 13 ou 7 bouquets par agence et par an, le réseau prend 12,5 %, 8,1 % ou 4,4 % du marché.",
    "Le test coûtait 18 k€ d'ouvertures, 8 k€ de protocole et l'avance du premier entrant : qu'achetait-il ? Posez au tableau la valeur moyenne de chaque entrée par scénario : face aux dix grandes agences d'emblée, le test perd 19 k€ dans le porteur, gagne 19 k€ dans le moyen et 166 k€ dans le difficile, soit 43 k€ de plus sur les 30 tirages, et 244 k€ de plus que les trente agences. Pourquoi dit-on que l'information a changé la réponse, et pas seulement le résultat ?",
    "Ceux qui ont testé dans les trois plus grosses agences ont-ils mesuré le marché ? Le test en vitrine bat le test représentatif 15 fois sur 30, de 10 à 15 k€, et perd les 15 autres de 171 à 199 k€ : retrouvez lesquelles (le scénario moyen, où la moyenne passe le seuil et les petites agences non). Qu'aurait-il fallu fixer avant de voir les chiffres ?",
    "En semaine 8, le président voulait tenir le plan, le cabinet accélérer : qu'est-ce qui justifiait de réviser ? Sous le hasard n° 1, les chiffres du test donnent 17,7 bouquets par an à la grande agence et 10,2 aux autres : seule la grande passe le seuil de 12,6, et la révision retombe sur le plan validé, les dix grandes agences ; tenir le plan fait cette fois exactement autant. Sur les 30 tirages, aucune autre option ne fait jamais mieux que la révision, et tenir le plan fait 90 k€ de moins en moyenne ; mais derrière un test en vitrine, suivre ses chiffres fait moins bien que tenir le plan (174 k€ contre 200 k€). Que vaut un signal qui ne mesure pas la bonne chose ?",
    "« Ne rien signer pour l'instant : on recrutera les artisans au moment d'étendre » bat la charte 17 fois sur 30, et sous le hasard de la classe elle fait 20 k€ de mieux, les 20 k€ exacts de la charte. Les 13 autres fois, quand Solvéane s'implante, elle perd de 25 à 452 k€, si bien qu'elle fait 67 k€ de moins en moyenne. Ceux qui l'ont choisie ont-ils bien décidé, ou eu de la chance ? Qu'achète-t-on en payant une assurance qui ne sert pas, la plupart du temps ?",
    "Sous le hasard n° 1, le marché a suivi le scénario moyen et Solvéane n'est pas venu : la méthode fait 153 k€, sa 16e place sur les 30 tirages, et « être les premiers partout » perd 149 k€. Le meilleur résultat possible, 205 k€, revient à qui a testé dans les trois plus grosses agences, n'a rien signé avec les artisans et a tenu le plan : deux réflexes qui se compensent sous ce hasard, pour 156 k€ en moyenne sur les 30 tirages, contre 259 k€ pour la méthode. Un binôme qui a fini premier de la classe a-t-il pris les meilleures décisions ? Sur quoi juge-t-on une décision stratégique dont le résultat d'un trimestre dépend autant du hasard ?",
  ],
  prolongement: {
    enonce:
      "Cas écrit, 20 minutes. Les Jardineries Valadour (24 magasins : 8 grands, qui vendent 1,5 fois la moyenne du réseau, et 16 petits, 0,75 fois) envisagent de vendre des cuves de récupération d'eau de pluie posées chez le client. Un cabinet annonce un marché de 40 M€. Les données de la zone : 250 000 maisons avec jardin, dont 2 % s'équipent chaque année ; 3 acheteurs sur 10 veulent la pose ; 4 000 € HT l'installation posée. Valadour en tire 600 € de marge sur coût variable par installation ; un magasin équipé coûte 9 000 € de charges fixes par an et 3 000 € d'ouverture, et reste équipé trois ans (conseiller embauché, matériel d'exposition loué). Deux scénarios : favorable, quatre chances sur dix, un magasin moyen fait 24 installations par an ; défavorable, six sur dix, il en fait 8. On raisonne sur trois ans, sans actualiser. 1) Calculez le marché accessible et le seuil de rentabilité d'un magasin, avec et sans l'ouverture. 2) Comparez en espérance trois entrées : les 24 magasins d'emblée ; les 8 grands d'emblée ; un test de six mois dans un grand et deux petits magasins, pour 15 000 € en tout (ouvertures, protocole de suivi, fermeture éventuelle, retard), suivi de l'extension que justifient ses chiffres. Que vaut l'information du test ? 3) Le test donne 33 installations par an au grand magasin, 14 et 15 aux deux petits. Quel plan retenez-vous ? Qu'aurait conclu une lecture sur la moyenne des trois, et combien aurait-elle coûté ?",
    corrige:
      "1) 250 000 × 2 % = 5 000 maisons qui s'équipent, × 30 % = 1 500 installations posées, × 4 000 € = 6 M€ par an, loin des 40 M€ du cabinet. Seuil : 9 000 / 600 = 15 installations par an ; avec l'ouverture amortie sur trois ans (1 000 € par an), 10 000 / 600 = 16,7. 2) Rythmes : favorable, 36 par grand magasin et 18 par petit ; défavorable, 12 et 6. Contribution annuelle (rythme × 600 − 9 000) : favorable, 12 600 € et 1 800 € ; défavorable, −1 800 € et −5 400 €. Les 24 d'emblée : favorable, 3 × (8 × 12 600 + 16 × 1 800) − 24 × 3 000 = 388 800 − 72 000 = 316 800 € ; défavorable, 3 × (−14 400 − 86 400) − 72 000 = −374 400 € ; espérance 0,4 × 316 800 − 0,6 × 374 400 = 126 720 − 224 640 = −97 920 €. Les 8 grands : favorable, 3 × 8 × 12 600 − 24 000 = 278 400 € ; défavorable, 3 × 8 × (−1 800) − 24 000 = −67 200 € ; espérance 111 360 − 40 320 = 71 040 €. Le test : favorable, tout le réseau (316 800 €, mieux que les grands seuls) ; défavorable, l'arrêt (0 €, puisque même un grand magasin y perd 1 800 € par an) ; espérance 0,4 × 316 800 − 15 000 = 111 720 €. Le test bat la meilleure entrée sans information de 40 680 € ; l'information vaut 126 720 − 71 040 = 55 680 €, le prix maximal qu'on paierait pour un test qui dirait le scénario sans erreur. On attend que l'élève dise ce que le test achète : le droit d'étendre dans le cas favorable et de ne rien perdre dans le défavorable. 3) Agence par agence, contre le seuil de 16,7 : le grand magasin (33) le passe, les petits (14 et 15) non, ni même le seuil de 15 sans ouverture : on équipe les 8 grands, soit 8 × (3 × (33 × 600 − 9 000) − 3 000) = 8 × 29 400 = 235 200 €. La moyenne des trois, (33 + 14 + 15) / 3 = 20,7, passe le seuil et ferait équiper les 24 : chaque petit magasin, à 14,5 installations, perd 300 € par an, soit 3 × (−300) − 3 000 = −3 900 € sur trois ans, et 16 × 3 900 = 62 400 € pour les seize ; le plan tomberait à 172 800 €. On attend que l'élève dise qu'un test se juge site par site, sur un critère fixé avant de voir les chiffres.",
  },
  evaluation: [
    "Le marché accessible est calculé par le bas, chaque coefficient rattaché à sa source (72 M€), et distingué du chiffre du cabinet par son périmètre, son scénario et sa part postulée.",
    "Le choix de l'entrée est justifié par une comparaison scénario par scénario et par ce que le test permet de décider ensuite, non par la taille du marché ni par la vitesse.",
    "Le test est conçu avant d'en voir les chiffres : agences représentatives, bouquets signés par agence, seuil de rentabilité de 11 bouquets par an (12,6 avec l'ouverture) comme critère.",
    "Le plan de janvier suit les chiffres du test, à la hausse comme à la baisse, et les engagements de volume (artisans, fabricant) sont rapportés aux bouquets que chaque scénario permet.",
    "L'élève distingue la qualité de ses décisions de leur résultat sous le hasard n° 1, à l'aide du bilan des 30 tirages, et identifie au moins une décision où il a eu de la chance.",
  ],
  vigilance:
    "L'épisode donne les probabilités des trois scénarios et de l'arrivée de Solvéane, et un test bien conduit y révèle le scénario sans erreur, alors que ces probabilités sont des jugements et qu'un test de six semaines sur trois agences est bruité. La valeur est calculée sur trois ans au taux de 10 %, sans valeur terminale, et l'attente ne vaut que zéro moins ce que Solvéane coûte au négoce, l'entrée plus tardive n'étant pas comptée : un enseignant de stratégie pourra faire remarquer que l'option d'attendre a aussi une valeur, que le modèle ne donne pas, et que l'avantage du premier entrant s'y réduit à 3 % de bouquets en plus.",
};
