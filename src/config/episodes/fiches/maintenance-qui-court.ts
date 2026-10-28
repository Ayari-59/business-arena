/**
 * FICHE ENSEIGNANT · ÉPISODE 109, LA MAINTENANCE QUI COURT APRÈS LES PANNES.
 *
 * Passer du curatif au préventif : l'historique des pannes dit où regarder,
 * le temps moyen entre deux pannes se calcule organe par organe, et le
 * préventif coûte tout de suite pour agir plus tard. Le piège : ajouter un
 * dépanneur de nuit, ou suspendre l'entretien pour produire d'avance.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "maintenance-qui-court",
  formations: ["but-gea", "bts-gpme"],
  programme: [
    "BUT GEA · Mettre en œuvre des leviers d'amélioration continue des performances de l'organisation",
    "BUT GEA · Analyser les processus de l'organisation dans son environnement",
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
  ],
  notion:
    "Une équipe de maintenance qui passe ses heures à dépanner n'a plus le temps de prévenir, et plus elle dépanne, plus il y a de pannes. Pour en sortir, on compte : l'historique des pannes, classé par organe, montre qu'une poignée d'organes font l'essentiel des arrêts, et le temps moyen entre deux pannes (MTBF) dit lesquels traiter d'abord. L'erreur classique consiste à ajouter un dépanneur (le technicien de nuit), à stocker toutes les pièces du constructeur, ou à suspendre l'entretien avant un pic pour produire d'avance des produits qui ne se stockent pas. Dans l'épisode, Klervi Nédélec, responsable maintenance de l'usine de Loudéac, voit la ligne de remplissage des desserts perdre 19 heures par mois en pannes, quand 70 % des heures de ses douze techniciens partent en dépannage ; le directeur industriel réclame un technicien de nuit avant le pic de décembre. L'historique de six mois montre 104 pannes et 114 heures d'arrêt, dont 86 % sur trois familles d'organes ; la scelleuse tombe en moyenne toutes les 70 heures de fonctionnement, et les pannes de nuit n'attendent l'astreinte qu'un peu plus de deux heures par mois. L'élève découvre qu'un plan préventif ciblé, un stock de 14 000 € de pièces critiques, des gestes de premier niveau écrits avec les conducteurs et des joints remplacés à fréquence fixe valent plus qu'un technicien de plus.",
  objectifs: [
    "Je classe un historique de pannes par organe et j'en tire les quelques organes qui font l'essentiel des arrêts.",
    "Je calcule un temps moyen entre deux pannes (MTBF) et une durée moyenne de réparation à partir d'un historique.",
    "Je chiffre ce que coûte une heure d'arrêt, rattrapée ou perdue, et je compare le coût d'une mesure à ce qu'elle évite.",
    "J'organise un dispositif qui tient dans la durée (préventif planifié, premier niveau, pièces critiques) plutôt qu'une réponse au dernier incident.",
  ],
  prerequis:
    "La distinction entre maintenance corrective et préventive, et le calcul d'une moyenne et d'une part en pourcentage, doivent avoir été vus en cours. Les indicateurs MTBF et MTTR et la loi de Pareto peuvent être introduits pendant la séance ; le calcul d'une marge suffit pour lire le bilan.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/maintenance-qui-court?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le temps moyen entre deux pannes de la scelleuse sur les six derniers mois et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la décision de la semaine 1 (technicien de nuit, plan préventif, révision générale, dépannage) et la réponse à Gurvan Kerebel en semaine 8, qui veut suspendre l'entretien pour produire d'avance. Un binôme qui a fini tôt calcule le MTBF de chaque famille d'organes et celui de la ligne entière.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir de l'historique de la GMAO : 2 704 heures de fonctionnement, moins les 41 heures d'arrêt de la scelleuse, divisées par ses 38 pannes, soit 70 heures. Vous faites expliquer les valeurs éloignées (24,9, 1,1, 114,9), puis vous dressez avec la classe le classement des organes par heures d'arrêt : scelleuse, doseurs et vérins font 98 heures sur 114, 86 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (standards écrits avec les conducteurs, note de service, tournées des techniciens, rien) et de la semaine 8. Pour la semaine 1, vous faites calculer ce que gagnerait un technicien de nuit : une panne sur quatre tombe la nuit, l'astreinte met une demi-heure, soit un peu plus de 2 heures par mois sur 19. Pour la semaine 8, vous faites lire la source d'Ysée Bescond : un dessert produit plus de dix jours avant l'expédition n'est plus livrable.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Le résultat est un coût : le trimestre et l'estimation du pic de décembre. Sous le tirage n° 12, « Analyser, prévenir, outiller » coûte 128 k€ (environ 6 heures d'arrêt attendues en décembre), « Dépanner plus vite » 221 k€ et l'attentisme 220 k€ (20 à 24 heures attendues) ; sur les trente tirages, la première coûte toujours le moins. Vous montrez la décision où le hasard renverse parfois le jugement : la note de service imposée aux conducteurs fait mieux que les standards écrits avec eux 11 fois, selon ce que le CSE accepte.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de Fanchon Lozac'h : avant d'ajouter quelqu'un pour dépanner, compter ses pannes, lesquelles, combien de fois, combien de temps. Vous la déclinez : classer, calculer le MTBF par organe, prévenir sur les organes qui tombent, avoir leurs pièces, faire voir aux conducteurs ce qu'ils voient déjà, et planifier le préventif pour qu'il ne saute pas au pic. Vous rappelez que la sécurité n'est pas une variable : consignation avant tout geste, fragment de joint, lot bloqué. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 70.1,
    etapes: [
      "Source « Extraire et classer l'historique des pannes de la ligne (GMAO, six mois) » : sur 26 semaines, la ligne a fonctionné 2 704 heures (104 heures par semaine) ; les capteurs de la scelleuse ont fait 38 pannes et 41 heures d'arrêt.",
      "Le MTBF est le temps de bon fonctionnement entre deux pannes : on retire du temps de fonctionnement les heures passées en panne, 2 704 − 41 = 2 663 heures.",
      "MTBF de la scelleuse : 2 663 / 38 ≈ 70,1 heures. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 3 heures près, proche à 10. (Sans retirer les heures d'arrêt, 2 704 / 38 ≈ 71,2 heures : l'écart est dans la marge.)",
      "Pour comparer : les joints des doseurs, (2 704 − 36) / 34 ≈ 78,5 heures ; les vérins, (2 704 − 21) / 12 ≈ 223,6 heures ; la ligne entière, (2 704 − 114) / 104 ≈ 24,9 heures. Durée moyenne d'une réparation de la scelleuse : 41 / 38 ≈ 1,1 heure.",
      "Ce qu'en tire Klervi : la scelleuse tombe environ 1,5 fois par semaine (38 pannes en 26 semaines). Trois familles d'organes font 114 − 16 = 98 heures d'arrêt sur 114, 86 % : c'est là que le plan préventif commence.",
    ],
    erreurs: [
      {
        valeur: 24.9,
        cause:
          "Le MTBF de la ligne entière, toutes pannes confondues ((2 704 − 114) / 104), donné à la place de celui de la scelleuse.",
      },
      {
        valeur: 1.1,
        cause:
          "La durée moyenne d'une panne (41 heures / 38 pannes), qui est le MTTR, confondue avec le temps entre deux pannes.",
      },
      {
        valeur: 114.9,
        cause:
          "Les heures du calendrier (26 semaines × 168 heures) prises à la place des heures de fonctionnement : la ligne ne tourne que 104 heures par semaine, et ne tombe en panne que quand elle tourne.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Efflam Jézéquel le demande, et la nuit on attend l'astreinte : un technicien de plus sur place, c'est des pannes plus courtes.",
      ceQuiLeDejoue:
        "La reprise des bons de travail le chiffre : les 26 pannes de nuit ont attendu l'astreinte 13 heures en six mois, à peine plus de 2 heures par mois sur les 19 ; le technicien coûte 4 000 € de cabinet puis 1 250 € par semaine, et n'arrive qu'en semaine 7 ou 11. Les 19 heures viennent de trois familles d'organes dont toutes les gammes préventives sont en retard. Rejoué sur les trente tirages à la place du plan préventif, le technicien de nuit coûte 22 k€ de plus en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Décembre ne laisse pas une heure de marge : récupérer les heures d'entretien pour faire du stock de desserts, c'est être prêt pour le pic.",
      ceQuiLeDejoue:
        "Ysée Bescond le dit : avec 30 jours de DLC et les deux tiers exigés à la livraison, un dessert produit plus de dix jours avant l'expédition n'est plus livrable, et le stock de novembre finirait déclassé, environ 4 000 €. Sulivan Daoudal prévient que les pièces changées en septembre arriveront en fin de vie en décembre si on ne les rechange pas ; caler l'entretien dans les NEP ne prend à la ligne que 30 % du temps planifié. Rejouée sur les trente tirages à la place de l'entretien calé dans les NEP, la suspension coûte 36 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Pour quatre semaines seulement, un technicien intérimaire de nuit est la sécurité qu'Efflam attend, sans recrutement.",
      ceQuiLeDejoue:
        "Sulivan Daoudal fait le calcul : un technicien de nuit gagne une demi-heure sur une panne sur quatre, quelques heures sur le mois, pour 7 300 € d'intérim. Fanchon Lozac'h explique ce qui tient au pic : un préparateur-planificateur, 600 € par semaine, qui cale le préventif dans le plan de production et prépare des interventions qui durent un cinquième de moins. Rejoué sur les trente tirages à la place du planificateur, l'intérimaire de nuit coûte 7 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 3,
      pourquoi:
        "En décembre, chaque panne coûte 3 800 € l'heure : mettre toute l'équipe sur le dépannage, c'est avoir quelqu'un à chaque panne, et le préventif reprendra en janvier.",
      ceQuiLeDejoue:
        "Sulivan Daoudal le dit : au pic, le préventif saute le premier, et sans lui les organes refaits redeviennent en quelques semaines ceux de l'été. Toute l'équipe au dépannage ne raccourcit les réparations que d'un dixième, quand une intervention préparée dure un cinquième de moins. Rejoué sur les trente tirages à la place du planificateur, tout le monde au dépannage coûte 7 k€ de plus en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de nuit, d'autres une ligne vétuste ou des pièces qui manquent. Qu'est-ce qui, dans l'historique classé par organe et dans l'emploi du temps des techniciens, montrait que le préventif avait été laissé filer ?",
    "Le MTBF de la scelleuse est de 70 heures, celui de la ligne de 25. Que dit chacun des deux chiffres, et lequel sert à décider ?",
    "Un stock de 14 000 € de pièces critiques ou la liste complète du constructeur à 120 000 € : que protège chacun, et que coûte-t-il à immobiliser à 25 % par an ?",
    "Sur les trente tirages, la note de service imposée aux conducteurs fait mieux 11 fois que les standards écrits avec eux. Pourquoi, et pourquoi perd-elle pourtant en moyenne ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Gurvan voulait produire d'avance pour décembre. Pourquoi la DLC des desserts rend-elle ce stock inutile, et que coûte en décembre un entretien suspendu en novembre ?",
    "Pourquoi un préparateur-planificateur protège-t-il mieux le pic qu'un technicien de plus ? Qu'est-ce qui fait sauter le préventif quand la production presse ?",
    "Quelle règle gardez-vous pour sortir d'une maintenance qui court après les pannes ? Formulez-la en une phrase, avec un indicateur dedans.",
  ],
  prolongement: {
    enonce:
      "Une ensacheuse de fromage râpé a fonctionné 1 500 heures en trois mois. Son historique : soudeuse, 30 pannes et 27 heures d'arrêt ; peseuse, 15 pannes et 18 heures ; convoyeur, 5 pannes et 5 heures. Une heure d'arrêt coûte 2 000 €. 1) Quelle part des heures d'arrêt font la soudeuse et la peseuse ? 2) Calculez le MTBF et la durée moyenne de réparation (MTTR) de la soudeuse et de la peseuse. 3) Un plan préventif sur la soudeuse coûte 8 000 € par trimestre et divise ses pannes par deux, à durée de réparation égale. Combien d'heures et d'euros évite-t-il par trimestre ? 4) On propose à la place un technicien de nuit, à 1 200 € par semaine sur 13 semaines : une panne sur quatre tombe la nuit, et il fait gagner une demi-heure sur chacune. Combien évite-t-il, pour quel coût ?",
    corrige:
      "1) 27 + 18 = 45 heures sur 50, soit 90 %. 2) Soudeuse : MTBF (1 500 − 27) / 30 ≈ 49,1 heures ; MTTR 27 / 30 = 0,9 heure. Peseuse : MTBF (1 500 − 18) / 15 ≈ 98,8 heures ; MTTR 18 / 15 = 1,2 heure. 3) 15 pannes de moins × 0,9 heure = 13,5 heures évitées, soit 13,5 × 2 000 = 27 000 € pour 8 000 € de plan : 19 000 € de gain net par trimestre. 4) 50 pannes × 1/4 × 0,5 heure = 6,25 heures, soit 12 500 € évités, pour 13 × 1 200 = 15 600 € : il coûte plus qu'il n'évite, et ne retire aucune panne.",
  },
  evaluation: [
    "Le MTBF de la scelleuse est calculé juste ((2 704 − 41) / 38 ≈ 70 heures) à partir de l'historique, et distingué du MTBF de la ligne et de la durée moyenne de réparation.",
    "Les organes à traiter d'abord sont désignés par l'historique classé (86 % des heures d'arrêt sur trois familles), et le plan préventif est ciblé sur eux.",
    "Chaque mesure est comparée à ce qu'elle évite : le technicien de nuit à ses 2 heures par mois, le stock à son coût de possession, la suspension de l'entretien à la DLC des desserts.",
    "Les gestes de premier niveau sont construits avec les conducteurs, formés et faits sous consignation, et l'élève explique pourquoi une note de service ne suffit pas.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La consignation avant toute intervention sur une machine, le document unique d'évaluation des risques et la consultation du CSE sur un changement de l'organisation du travail sont posés par l'épisode comme des règles de l'usine ; leur fondement dans le Code du travail est à faire préciser par un enseignant de droit du travail avant d'en faire une règle générale. La conduite à tenir après un fragment de joint dans le produit (lot bloqué, trié, détruit) est reprise de l'épisode telle qu'il la pose.",
};
