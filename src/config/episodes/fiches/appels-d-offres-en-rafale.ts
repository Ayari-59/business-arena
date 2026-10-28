/**
 * FICHE ENSEIGNANT · ÉPISODE 67, LES APPELS D'OFFRES EN RAFALE.
 *
 * Choisir où répondre : une réponse à un appel d'offres coûte des jours de
 * seniors, la note technique se gagne avec eux, et le prix ne pèse que ce que
 * la grille lui donne.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "appels-d-offres-en-rafale",
  formations: ["but-gaco", "but-gea"],
  programme: [
    "BUT GACO · Assurer le développement des affaires, de la prospection à la fidélisation",
    "BUT GACO · Développer une approche conseil auprès des parties prenantes",
    "BUT GEA · Aider à la prise de décision",
  ],
  notion:
    "Quand les consultations tombent en rafale, le réflexe est de répondre à tout, avec des mémoires standardisés et des prix serrés, parce que « l'intercontrat est déjà payé » et qu'on ne gagne pas les marchés auxquels on ne répond pas. L'erreur classique est de ne pas compter ce que coûte une réponse, et de croire qu'on perd sur le prix. Dans l'épisode, Florimond Vannier, associé d'Atlas Conseil à Rennes, voit arriver douze appels d'offres publics en six semaines. L'an dernier, sa practice a fait 19 réponses pour 4 marchés gagnés : 64 jours de seniors et 148 jours de consultants, soit 25,6 k€ d'avant-vente par marché gagné. Les mémoires écrits par les consultants ont eu 34 sur 60, ceux pilotés par un senior 43 ; sur les marchés perdus, l'attributaire était plus cher que nous 9 fois sur 15, et nous rendions 6,5 points de technique pour 0,8 de prix. L'élève découvre qu'il faut passer les consultations à une grille de sélection, mettre des seniors sur moins de réponses, ne pas courir un marché écrit pour le sortant, et qu'une remise de 15 % rattrape au mieux 6 points de note tout en retirant plus d'un tiers de la marge.",
  objectifs: [
    "Je calcule le coût d'avant-vente d'un marché gagné à partir des jours passés et du taux de transformation.",
    "Je simule une note d'appel d'offres avec la formule du règlement de consultation, technique et prix.",
    "Je compare ce qu'une baisse de prix rapporte en points et ce qu'elle coûte en marge.",
    "Je sélectionne les consultations sur l'avantage du cabinet plutôt que sur leur montant.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les grandes lignes d'un marché public (règlement de consultation, critères pondérés, attribution à l'offre la mieux notée) et les notions de coût journalier, de TJM et de marge d'une mission doivent être connues.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/appels-d-offres-en-rafale?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du coût d'avant-vente d'un marché gagné l'an dernier, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, la liste donnée à Sterenn (les douze, les cinq de la grille, les six plus gros ou au fil de l'eau) et le prix remis à Kermelin en semaine 5. Aux plus rapides, vous demandez de calculer la marge de Kermelin au prix habituel et alignés sur Halden.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et refaites le calcul avec le bilan de Tempora : les jours de seniors et de consultants à leur coût journalier, divisés par les marchés gagnés. Vous faites expliquer les valeurs éloignées de 25,6 k€ (5,4, 46,2 ou 11,5). Vous faites ensuite le lien avec les 20 jours de seniors que coûtent cinq réponses pilotées, pour 30 jours de temps commercial : le temps de seniors est la ressource rare.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (la liste), de la semaine 3 (qui écrit les mémoires) et de la semaine 5 (le prix de Kermelin). Pour Kermelin, vous faites calculer au tableau avec la formule du règlement : 15 % sous nous, Halden reprend 6 points sur 40 ; deux jours d'associé valent environ 4,2 points sur 60, et Halden plafonne à 38 à 41 sur 60 dans les hôpitaux. Puis la marge : 121,2 k€ au prix habituel, 79,2 k€ alignés.",
    },
    {
      minutes: 20,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 12, « Choisir où répondre » fait 387,4 k€ de marge nette avec 6 marchés gagnés sur 6, « Faire du volume » 142,3 k€ avec 4 sur 13, « Au fil de l'eau » 48,3 k€. Vous prévenez que ce tirage est favorable : sur les trente, la meilleure méthode fait 262,6 k€ en moyenne, entre 17,7 et 388,2 k€. Vous montrez ensuite la réponse aux douze : sous ce tirage, à liste seule changée, elle fait à peu près comme la grille (0,8 k€ de mieux) ; sur les trente, elle perd 67 k€ en moyenne. Qualité de la décision et résultat se séparent ici.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : on répond là où l'on a un avantage, et on y met des seniors. Vous la déclinez en trois gestes : une grille go/no-go avant de lancer une réponse, une note simulée avec la formule du règlement avant de baisser un prix, et les rapports d'analyse lus avant de remettre les réponses suivantes.",
    },
  ],
  calcul: {
    reponse: 25.6,
    etapes: [
      "Source « Reprendre dans Tempora le bilan des réponses de l'an dernier » : 19 réponses, 4 marchés gagnés ; 64 jours de managers et d'associés, et 148 jours de consultants, imputés à 720 € et 380 € par jour.",
      "Coût des jours d'avant-vente : 64 × 720 = 46 080 € de seniors, et 148 × 380 = 56 240 € de consultants, soit 102 320 €.",
      "Rapporté aux marchés gagnés : 102 320 / 4 = 25 580 €, soit 25,6 k€ d'avant-vente par marché gagné. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 1 k€ près.",
      "Pour la suite : une réponse a coûté 102 320 / 19 ≈ 5,4 k€ en moyenne, mais il en a fallu près de cinq pour un marché. Sur les 7 réponses pilotées par un senior, 3 ont été gagnées ; sur les 12 écrites par les consultants, une seule.",
    ],
    erreurs: [
      {
        valeur: 5.4,
        cause:
          "Le coût est divisé par les 19 réponses au lieu des 4 marchés gagnés : c'est le coût d'une réponse, pas d'un marché.",
      },
      {
        valeur: 46.2,
        cause:
          "Les jours sont valorisés au TJM facturé (1 150 € et 750 €) au lieu du coût journalier : (64 × 1 150 + 148 × 750) / 4.",
      },
      {
        valeur: 11.5,
        cause:
          "Seuls les jours de seniors sont comptés, parce que l'intercontrat « est déjà payé » : 64 × 720 / 4.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Victoire veut du volume : Rennes a fini à 68 % d'occupation pour 75 % visés, les budgets sont votés, et on ne gagne pas un marché auquel on ne répond pas.",
      ceQuiLeDejoue:
        "Le bilan de Tempora : 4 marchés sur 19, 25,6 k€ d'avant-vente par marché gagné. Les rapports d'analyse : au-delà de six réponses menées de front, chaque réponse de plus coûtait environ 0,7 point de note technique à toutes les autres, et les mémoires de bibliothèque avaient 34 sur 60. La grille go/no-go trouve cinq consultations où le cabinet a un avantage. Rejouée sur les trente tirages à la place de la grille, la réponse aux douze perd 67 k€ en moyenne et ne fait mieux que 5 fois.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "C'est le plus gros marché de conseil de la région cette année, et une métropole en référence ouvre toutes les portes.",
      ceQuiLeDejoue:
        "Le cahier des charges impose « la démarche Cap Fusion en quatre temps », mot pour mot celle de Kéroual Consulting, sortant depuis 2021, et 20 points pour trois accompagnements de fusion depuis 2022 quand le cabinet en a un. Konan Bodiguel, arrivé en septembre, annonce des chantiers au printemps : un rendez-vous coûte un jour de senior. Rejouée sur les trente tirages à la place du rendez-vous, la réponse à fond perd 29,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Sept consultants sont en intercontrat jusqu'en mars : leur temps est déjà payé, autant qu'ils écrivent les mémoires.",
      ceQuiLeDejoue:
        "Les notes de l'an dernier : 34 sur 60 pour les mémoires de consultants relus la veille, une victoire sur 12 ; 43 sur 60 pour les mémoires pilotés, 3 sur 7. Ce n'est pas le temps des consultants qui manque, c'est celui des seniors : un pilotage prend 4 jours de senior. Rejouée sur les trente tirages à la place du pilotage, l'écriture par l'intercontrat perd 124,8 k€ en moyenne et ne fait mieux que 5 fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Victoire le dit : Kermelin est client depuis 2023, on ne va pas le perdre pour 15 %. Halden annonce des TJM autour de 700 €.",
      ceQuiLeDejoue:
        "La formule du règlement : à 15 % sous nous, Halden reprend 6 points sur 40 ; s'aligner les rattrape, pas un de plus. Halden a eu 38 à 41 sur 60 dans les hôpitaux de la région, et deux jours d'associé valent environ 4,2 points. La marge du marché tombe de 121,2 k€ à 79,2 k€ alignés. Rejoué sur les trente tirages à la place du mémoire renforcé, l'alignement perd 23,6 k€ en moyenne et ne fait mieux que 8 fois.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Une équipe plus junior, 18 % moins chère, passe sous Halden sans sacrifier la marge : un jour coûte moins.",
      ceQuiLeDejoue:
        "La source sur la marge le précise : avec l'équipe junior, la marge de Kermelin reste à 103,6 k€, mais les CV pèsent dans la note technique, et Sefora le dit : trois analystes qui n'ont jamais vu un hôpital. La note technique perd plus que la note prix ne gagne. Rejouée sur les trente tirages à la place du mémoire renforcé, l'équipe junior perd 17,9 k€ en moyenne et ne fait mieux que 8 fois.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "On lit des rejets : il faut être plus agressif sur les prix des dernières réponses.",
      ceQuiLeDejoue:
        "Les rapports d'analyse demandés aux acheteurs disent où se perdent les points : l'attributaire était souvent plus cher que nous, et les commentaires reviennent à la méthodologie générique, à l'équipe non nommée, au planning sans lien avec le calendrier du client. Reprendre un mémoire sur ces sous-critères coûte 1,5 jour de senior et 1 jour de consultant. Rejouée sur les trente tirages à la place de la reprise, la baisse de 10 % perd 21,8 k€ en moyenne et ne fait mieux que 2 fois.",
    },
  ],
  debrief: [
    "En semaine 1, qui a vu un problème de prix, qui un problème de seniors, qui un problème de sélection ? Qu'est-ce que les rapports d'analyse de l'an dernier permettaient de trancher ?",
    "Un marché gagné a coûté 25,6 k€ d'avant-vente l'an dernier. Pourquoi l'intercontrat « déjà payé » ne rend-il pas une réponse gratuite ?",
    "Avec la formule du règlement de Kermelin, que rapportent 15 % de remise en points, et que coûtent-ils en marge ? Que rapportent deux jours d'associé ?",
    "Pourquoi le plus gros marché de l'année était-il celui auquel il ne fallait pas répondre, et que valait le rendez-vous avec Konan Bodiguel ?",
    "Sous le tirage 12, répondre aux douze fait à peu près comme la grille ; sur les trente tirages, elle perd 67 k€ en moyenne. Qu'aurait-on conclu en ne regardant que son propre résultat ?",
    "Après des rejets, baisser les prix ou reprendre les mémoires : sur quoi faut-il se fonder pour choisir ?",
    "Quelle règle gardez-vous pour répondre aux appels d'offres ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Un cabinet répond à un marché de 200 k€ noté 60 points sur la valeur technique et 40 sur le prix : le prix le plus bas a 40 points, les autres 40 × (prix le plus bas / leur prix). Son mémoire vaut 42 sur 60 ; le concurrent, 38 sur 60, est 12 % moins cher. Un jour produit coûte 57 % du prix habituel. 1) Calculez les deux notes totales : qui gagne ? 2) Le cabinet s'aligne sur le prix du concurrent : qui gagne, et que devient la marge du marché ? 3) Il garde son prix et met deux jours d'associé de plus sur le mémoire, à 720 € le jour, ce qui lui donne 4 points de technique : qui gagne, et quelle marge reste-t-il ?",
    corrige:
      "1) Note prix du cabinet : 40 × 0,88 = 35,2 ; total 42 + 35,2 = 77,2. Concurrent : 38 + 40 = 78. Le concurrent gagne de 0,8 point. 2) Aligné, le cabinet a 40 au prix : 42 + 40 = 82 contre 78, il gagne ; la marge passe de 200 000 × (1 − 0,57) = 86 000 € à 200 000 × (0,88 − 0,57) = 62 000 €, soit 24 000 € de moins. 3) 46 + 35,2 = 81,2 contre 78 : il gagne aussi, et garde 86 000 − 1 440 = 84 560 € de marge, 22 560 € de plus qu'en s'alignant.",
  },
  evaluation: [
    "Le coût d'avant-vente d'un marché gagné est calculé juste, jours valorisés au coût journalier et rapportés aux seuls marchés gagnés.",
    "La sélection des consultations s'appuie sur une grille d'avantage (références, client, besoin vu en amont), pas sur leur montant.",
    "La décision de prix à Kermelin est justifiée par une simulation de la note et un calcul de la marge.",
    "Le diagnostic des rejets s'appuie sur les rapports d'analyse des offres.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 12.",
  ],
  vigilance:
    "Les règles de la commande publique sont simplifiées : la formule de notation du prix, la rencontre d'un acheteur avant la publication (l'épisode parle d'un rédacteur rencontré en amont ; les échanges préalables sont encadrés et ne doivent pas fausser la concurrence) et le référé précontractuel sont à relire avec un enseignant de droit public.",
};
