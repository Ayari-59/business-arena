import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 31, LA COMMANDE À PRIX CASSÉ.
 *
 * Coût marginal contre coût complet, capacité et coût d'opportunité : une
 * commande sous le coût complet enrichit un atelier qui a de la place, et le
 * même prix l'appauvrit quand il est plein.
 */
export const FICHE: FicheEnseignant = {
  code: "commande-a-prix-casse",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Contrôle de gestion",
  ],
  notion:
    "Une commande supplémentaire se juge à ce qu'elle ajoute aux coûts, son coût marginal, et non au coût complet, qui répartit sur une activité normale des charges fixes payées avec ou sans elle. L'erreur classique consiste à refuser une commande « vendue à perte » parce que son prix est inférieur au coût complet : on laisse les charges fixes où elles sont et la marge sur coût variable sur la table. L'erreur symétrique est tout aussi fréquente : une fois la leçon apprise, on accepte tout prix supérieur au coût variable, y compris quand l'atelier est plein et que chaque unité de plus coûte des heures supplémentaires et la marge des clients réguliers qu'elle évince. L'épisode met les élèves à la tête d'un atelier de façonnage de panneaux qui tourne à 672 panneaux pour 1 000 de capacité ; un promoteur demande 1 600 panneaux à 39 € quand la fiche de coût affiche 46 €, dont 20 € de charges fixes. Le même prix de 39 € revient en semaine 6, en pleine saison, et ne couvre plus le coût marginal ; entre les deux, un client régulier réclame ce prix sur un volume qu'il commanderait de toute façon, et la révision de la scie pose la question du coût d'une heure de machine quand elle est rare.",
  objectifs: [
    "Je décompose un coût complet unitaire en coût variable et en quote-part de charges fixes, et je dis laquelle une décision modifie.",
    "Je calcule la marge sur coût variable d'une commande supplémentaire et je la compare à la perte affichée en coût complet.",
    "Je chiffre le coût d'opportunité d'une unité produite quand la capacité est saturée : heures supplémentaires et marge des clients évincés.",
    "Je distingue un prix marginal, réservé à un volume qui n'existerait pas sans lui, d'une remise accordée sur un volume acquis.",
  ],
  prerequis:
    "Les élèves doivent avoir vu la distinction entre charges variables et charges fixes, la marge sur coût variable et le coût complet unitaire ; la notion de capacité de production peut être découverte en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/commande-a-prix-casse?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous ne dites rien du coût marginal : vous demandez seulement de noter, à chaque décision, l'argument qui l'a emporté.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les six décisions, de la semaine 1 à la semaine 10. Vous circulez et relevez, sans les corriger, la prévision de marge déposée en semaine 1 et la réponse donnée à Habitat Cévral. Au tableau, vous ouvrez discrètement deux colonnes : « refus ou 46 € » et « 39 € accepté ».",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous affichez les estimations de la classe, de la plus basse à la plus haute : les valeurs négatives viennent presque toujours du coût complet. Vous reconstruisez au tableau la fiche de coût (26 € de coût variable, 20 € de charges fixes) puis la marge sur coût variable de la commande, 20,8 k€. Vous faites ensuite calculer l'écart avec la « perte » de 11,2 k€ annoncée par la contrôleuse de gestion : 32 k€, soit exactement les charges fixes que le coût complet impute à la commande.",
    },
    {
      minutes: 25,
      titre: "Débrief des décisions qui ont partagé la classe",
      detail:
        "Vous partez de la décision où la classe s'est le plus divisée, en général la réponse au promoteur ou le second lot de la semaine 6. Chaque camp donne son argument, puis vous ressortez la source qui tranchait : la fiche de coût et le plan de charge en semaine 1, le calcul du coût d'un panneau de plus en pleine saison en semaine 6. Vous terminez par Rioult : le même prix, cette fois sur un volume acquis.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous faites ouvrir le bilan et comparer le résultat obtenu sous le tirage n° 12 au résultat moyen sur trente tirages. Vous prenez la révision de la scie comme cas d'école : l'option qui semble la plus économe gagne presque toujours, et perd beaucoup quand elle perd. Vous faites dire à la classe ce qu'on juge alors, la décision ou son résultat.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle en deux lignes : avec de la capacité libre, le coût d'un panneau de plus est son coût variable ; sans capacité libre, il y ajoute le coût de ce qu'il évince. Vous rappelez à quoi sert encore le coût complet, fixer un tarif sur l'année, et à quoi il ne sert pas, juger une commande de plus. Vous distribuez l'exercice de prolongement.",
    },
  ],
  calcul: {
    reponse: 20.8,
    etapes: [
      "Coût variable unitaire, d'après « Décomposer la fiche de coût avec Yuna » : 21 € de panneau brut + 3,50 € de chants et consommables + 1,50 € d'énergie et d'usure des lames = 26 €.",
      "Quote-part de charges fixes : 16 000 € par semaine répartis sur une activité normale de 800 panneaux = 20 € ; coût complet 26 + 20 = 46 €. Ces 16 000 € sont dus que l'atelier façonne la commande ou non.",
      "Capacité, d'après « Regarder le plan de charge des treize semaines avec Driss » : 672 panneaux pour 1 000 de capacité en semaines 1 à 7, donc plus de 320 panneaux libres par semaine pour les 200 de Cévral. Le calcul demandé ignore le chevauchement des semaines 9 et 10 avec la pleine saison, qui se traite en semaine 2.",
      "Marge sur coût variable unitaire : 39 − 26 = 13 € par panneau.",
      "Marge sur coût variable de la commande : 13 € × 1 600 panneaux = 20 800 €, soit 20,8 k€.",
      "Contrôle : en coût complet, (39 − 46) × 1 600 = −11 200 € ; l'écart de 32 000 € avec la marge sur coût variable est la quote-part de charges fixes imputée à la commande (20 € × 1 600), payée de toute façon.",
    ],
    erreurs: [
      {
        valeur: -11.2,
        cause:
          "Le résultat en coût complet, (39 − 46) × 1 600 : l'élève reprend le message de la contrôleuse de gestion et traite les charges fixes comme si la commande les créait.",
      },
      {
        valeur: -17.6,
        cause:
          "Le coût complet « groupe » de 50 € de la clé de répartition du siège, (39 − 50) × 1 600 : des frais de structure facturés au forfait, que la commande ne modifie pas, comptés comme un coût de la commande.",
      },
      {
        valeur: 62.4,
        cause:
          "Le chiffre d'affaires de la commande, 39 € × 1 600 : l'élève confond ce que la commande rapporte en ventes et ce qu'elle rapporte en marge.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "« On ne vend pas à perte » : 39 € sont sous les 46 € du coût complet, et la contrôleuse de gestion annonce 11 200 € de perte.",
      ceQuiLeDejoue:
        "La fiche de coût montre que 20 des 46 € sont des charges fixes de 16 000 € par semaine, dues avec ou sans la commande, et le plan de charge laisse plus de 320 panneaux libres par semaine jusqu'en semaine 7. Refuser abandonne 20,8 k€ de marge sur coût variable ; sur trente tirages, ce refus coûte 13,9 k€ de marge en moyenne par rapport à l'acceptation à nos conditions.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Contre-proposer le coût complet paraît prudent : on ne perd rien, et le promoteur peut accepter.",
      ceQuiLeDejoue:
        "Le plancher de la décision est le coût variable de 26 €, pas les 46 € du coût complet, et Thaïs Ventura annonce un prix, pas une base de négociation : « Notre prix : 39 € ». Le promoteur ne l'accepte qu'une fois sur cinq, et pas sous le tirage n° 12 : sur trente tirages, l'option fait 10,6 k€ de moins en moyenne que l'acceptation à nos conditions.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "39 € couvrent largement les 26 € de coût variable, l'élève vient de l'apprendre, et Rioult pèse 15 % du volume de l'atelier.",
      ceQuiLeDejoue:
        "La source sur Agencements Rioult rappelle que ses 120 panneaux par semaine viendraient de toute façon : à 39 € au lieu de 58 €, chaque panneau perd 19 € de marge, plus de 20 k€ sur les neuf semaines qui restent. Ce n'est pas un prix marginal, c'est une remise ; c'est l'option la plus coûteuse de la décision, près de 20 k€ de moins en moyenne.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "« 39 €, c'est 13 € au-dessus du coût variable, comme la première fois » : l'argument du directeur commercial reprend la leçon de la semaine 1.",
      ceQuiLeDejoue:
        "En semaines 9 à 12, l'atelier est déjà plein : les 100 premiers panneaux en plus se font en heures supplémentaires à 37 €, les suivants font attendre des habitués dont la moitié part avec 32 € de marge, soit au moins 42 € par panneau. Sur trente tirages, accepter en pleine saison fait 9,3 k€ de moins en moyenne que livrer après la pleine saison.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le chef d'atelier l'affirme : deux jours d'arrêt ne coûtent rien, l'équipe est payée de toute façon et fera l'inventaire.",
      ceQuiLeDejoue:
        "En semaine 9, l'atelier est plein : 400 panneaux de capacité en moins, dont 100 rattrapés en heures supplémentaires (1 100 €) et 300 qui font attendre des habitués, la moitié perdue à 32 € de marge (4 800 €), soit près de 5 900 €. La révision le week-end coûte 4 800 €, le contrôle vibratoire 600 € ; l'arrêt en semaine 9 est la pire option, 4,8 k€ de moins en moyenne.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le tarif est fixé au coût complet plus 26 % ; si le coût complet a changé, il paraît logique de le répercuter.",
      ceQuiLeDejoue:
        "La décomposition de la semaine 10 montre que ni le coût variable (26 €) ni les charges fixes (16 000 € par semaine) n'ont bougé : seul le volume a changé, et au trimestre suivant la quote-part reviendra à 20 €. Sur le meilleur chemin sous le tirage n° 12, le coût complet recalculé tombe à 43,07 € et le tarif à 54,30 € : la baisse cède de la marge sur un volume qui ne réagit qu'à 0,8 % pour 1 % de baisse, 7,9 k€ de moins en moyenne.",
    },
  ],
  debrief: [
    "En semaine 1, qu'est-ce que la commande de Cévral changeait réellement dans les 46 € de la fiche de coût, et qu'est-ce qu'elle laissait tel quel ? Faites justifier la réponse par la fiche de coût et le plan de charge.",
    "Ceux qui ont contre-proposé 46 € ont-ils pris moins de risque que ceux qui ont accepté 39 € à leurs conditions ? Sous le tirage n° 12, le promoteur a refusé : qu'est-ce qui a été perdu, et qu'aurait-on gagné dans le cas favorable, une fois sur cinq ?",
    "Pourquoi le même prix de 39 €, qui enrichissait l'atelier en semaine 4, l'appauvrit-il en semaine 10 ? Sous le tirage n° 12, Cévral a accepté 48 € en pleine saison : est-ce que cela fait de 48 € un bon prix, ou le promoteur n'acceptait-il qu'une fois sur quatre ?",
    "Accorder 39 € à Rioult, est-ce appliquer le raisonnement marginal de la semaine 1 ? À quelle condition un prix inférieur au tarif reste-t-il un prix marginal, et non une remise ?",
    "Ceux qui ont reporté la révision de la scie au trimestre prochain, sans rien changer, ont fait sous le tirage n° 12 à peu près aussi bien que ceux qui l'ont reportée sous contrôle vibratoire, à moins de 1 k€ près ; sur trente tirages, ils font mieux 26 fois. Pourquoi l'option est-elle pourtant moins bonne, avec 1,6 k€ de moins en moyenne ? Faites retrouver ce qui se passe les quatre fois où la scie casse sans surveillance : entre 12,8 et 18,3 k€ de perte, en pleine saison.",
    "La méthode « raisonner à la marge, capacité comprise » finit en moyenne 19,3 k€ au-dessus du budget sur trente tirages, l'attentisme 7,9 k€ en dessous ; sous le tirage n° 12, l'attentisme finit pourtant 4,9 k€ au-dessus. Un élève qui a terminé au-dessus du budget a-t-il bien décidé ? Sur quoi faut-il juger une décision prise sous incertitude ?",
    "En semaine 10, le coût complet recalculé avait baissé : à quoi le coût complet sert-il encore dans l'atelier, et pour quelles décisions ne faut-il pas s'en servir ?",
  ],
  prolongement: {
    enonce:
      "Une imprimerie façonne au plus 50 000 brochures par mois en heures normales. Son coût variable est de 2,10 € par brochure (papier 1,40 €, encres 0,45 €, énergie 0,25 €) ; ses charges fixes, 60 000 € par mois, sont réparties sur une activité normale de 40 000 brochures. Son tarif est de 4,50 €. Un client nouveau propose 8 000 brochures livrées dans le mois, à 3,00 € l'unité. 1) Calculez le coût complet unitaire, puis le résultat de la commande en coût complet et sa marge sur coût variable ; expliquez l'écart. 2) Le mois prévu, le carnet de commandes des clients habituels n'est que de 36 000 brochures : faut-il accepter ? 3) La commande tombe finalement en pleine saison, avec 48 000 brochures de clients habituels. Au-delà de 50 000, l'imprimerie peut faire 3 000 brochures en heures supplémentaires, à 0,60 € de plus l'unité ; au-delà encore, chaque brochure de la commande prend la place d'une brochure d'un client habituel, perdue. Que rapporte la commande, et quel prix minimal faudrait-il en demander ? 4) Un client habituel, qui commande 5 000 brochures par mois, réclame à son tour 3,00 € : que coûterait ce geste par mois ?",
    corrige:
      "1) Charges fixes unitaires : 60 000 / 40 000 = 1,50 € ; coût complet 2,10 + 1,50 = 3,60 €. Résultat en coût complet : (3,00 − 3,60) × 8 000 = −4 800 €. Marge sur coût variable : (3,00 − 2,10) × 8 000 = 0,90 × 8 000 = 7 200 €. L'écart de 12 000 € est la quote-part de charges fixes imputée à la commande (1,50 € × 8 000), due avec ou sans elle. 2) Avec 36 000 brochures, la charge passe à 44 000 pour 50 000 de capacité : la commande ne coûte que son coût variable et augmente le résultat du mois de 7 200 € ; il faut l'accepter. 3) La charge monte à 56 000, soit 6 000 au-delà de la capacité : 3 000 en heures supplémentaires, 3 000 × 0,60 = 1 800 € ; 3 000 brochures d'habitués perdues, à 4,50 − 2,10 = 2,40 € de marge, soit 7 200 €. La commande rapporte 7 200 − 1 800 − 7 200 = −1 800 €. Prix minimal : 2,10 + (1 800 + 7 200) / 8 000 = 2,10 + 1,125 = 3,225 €, soit 3,23 € arrondi au centime supérieur. 4) Ces 5 000 brochures seraient venues au tarif : le geste coûte (4,50 − 3,00) × 5 000 = 7 500 € de marge par mois, sans une brochure de plus ; ce n'est pas un prix marginal mais une remise.",
  },
  evaluation: [
    "Le coût complet est décomposé en coût variable et en quote-part de charges fixes, et l'élève dit laquelle la commande modifie.",
    "La marge sur coût variable de la commande est calculée juste (20,8 k€) et l'écart avec la perte en coût complet est expliqué par les charges fixes imputées.",
    "En pleine saison, le coût marginal intègre les heures supplémentaires et la marge des clients évincés, chiffrées à partir des sources.",
    "L'élève distingue un prix marginal, attaché à un volume en plus et à des conditions, d'une remise sur un volume acquis.",
    "Une décision est justifiée par l'information disponible au moment de la prendre et par le résultat moyen sur trente tirages, pas par le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La fiche de coût répartit les charges fixes sur une activité normale de 800 panneaux, à la manière d'une imputation rationnelle, alors que le tableau de bord et le recalcul de la semaine 10 les rapportent au volume réel ; les deux conventions coexistent sans être nommées. Les salaires de l'équipe sont traités comme intégralement fixes, seules les heures supplémentaires étant variables, et un panneau d'habitué en retard est réputé perdu une fois sur deux : des hypothèses de modèle à présenter comme telles.",
};
