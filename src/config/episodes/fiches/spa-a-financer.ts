/**
 * FICHE ENSEIGNANT · ÉPISODE 65, LE SPA QUI NE SE RENTABILISE PAS SEUL.
 *
 * Choix d'investissement et flux différentiels : un spa déficitaire sur son
 * propre compte se juge sur ce qu'il change à tout l'hôtel, et son
 * financement ne change pas sa valeur.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "spa-a-financer",
  formations: ["dcg", "but-gea", "bts-mhr"],
  programme: [
    "DCG · UE 6, Finance d'entreprise",
    "BUT GEA · Aider à la prise de décision",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Un investissement se juge sur les flux qu'il change, actualisés : ce que l'entreprise gagne de plus avec le projet que sans lui. Deux erreurs se répondent : écarter un projet parce qu'il est déficitaire sur son propre compte, ou l'accepter sur un chiffre d'affaires global qui ne compte ni charges, ni commissions, ni ce qui serait venu de toute façon. Dans l'épisode, Marceau Dupré, directeur financier du Groupe Escale, instruit pour le conseil de famille le spa de L'Escale Évian (1,4 M€), face à la rénovation des 66 chambres (950 k€) et au statu quo. Le compte propre du spa affiche un EBE de −30 k€ et une perte de 146,7 k€ par an amortissement compris ; la directrice annonce plus d'un million de chiffre d'affaires. Pour que le seul prix moyen rende nulle la VAN du spa, il faudrait 15,04 € de plus par nuitée, quand l'effet attendu des comparables est de 9,5 € (5, 10 ou 14 € selon le scénario). L'élève découvre que la valeur du spa vient de tout l'hôtel (prix moyen, week-ends de basse saison, séminaires nouveaux), que la moitié des forfaits et les séminaires transférés d'Aix-les-Bains ne sont pas différentiels, qu'équilibrer le compte du spa par des abonnements coûte à l'hôtel, que l'information sur l'effet prix vaut d'être payée si l'on s'en sert, et qu'un crédit-bail plus cher détruit de la valeur même si « ses loyers sont couverts ».",
  objectifs: [
    "Je calcule la VAN d'un projet avec un coefficient d'actualisation, un renouvellement et une valeur résiduelle.",
    "J'en déduis le seuil d'un paramètre (le supplément de prix moyen) qui rend la VAN nulle.",
    "Je distingue les flux différentiels d'un projet des flux qui existeraient sans lui ou qui se déplacent dans le groupe.",
    "Je sépare la décision d'investir de la décision de financement, et je juge un financement au coût de l'emprunt.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "L'actualisation, la valeur actuelle nette, le coefficient d'annuité et l'excédent brut d'exploitation doivent avoir été vus en cours. Le RevPAR et la commission des plateformes de réservation peuvent être présentés pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/spa-a-financer?hasard=6 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, avec une calculatrice. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du supplément de prix moyen qui rendrait nulle la VAN du spa, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, le projet instruit en semaine 1 (rénovation, spa, grand spa ou rien) et le financement retenu en semaine 11. Aux plus rapides, vous demandez de calculer ce que rapporte au groupe le transfert des vingt séminaires d'Aix-les-Bains.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et reconstruisez le calcul avec la classe : la VAN du compte propre du spa sur douze ans à 9 %, puis ce qu'un euro de prix moyen rapporte par an, commissions des plateformes déduites. Vous faites expliquer les valeurs éloignées de 15,04 € (14,07, 13,02 ou 9,16). Vous comparez ensuite le seuil à l'effet attendu des comparables, 9,5 € : le prix seul ne suffit pas, il faut les autres flux de l'hôtel.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (le projet), de la semaine 4 (les séminaires) et de la semaine 6 (les abonnements). Pour les séminaires, vous faites calculer au tableau : 20 × 4 600 € gagnés à Évian, 20 × 3 800 € perdus à Aix, soit 16 k€ pour le groupe avant les clients qui refusent le transfert. Pour les abonnements : 90 k€ de recettes qui font passer l'EBE du spa de −30 à +30 k€, contre un effet prix réduit de 45 % en moyenne.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 6, l'effet prix est moyen (10 €) : « Tout l'hôtel, avec et sans projet » crée 257,8 k€ de valeur, « Le compte propre du spa » −58,7 k€, ne rien engager 0. Vous montrez deux décisions : présenter au conseil le dossier d'octobre tel quel ne coûte rien sous ce tirage, parce que le spa était le bon choix, mais 71,5 k€ en moyenne sur les trente ; la rénovation fait mieux que le spa 11 fois sur 30, quand l'effet est faible, et perd 248,9 k€ en moyenne. Le bilan sépare ici la qualité d'une décision de son résultat.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : on actualise les flux différentiels de tout l'hôtel, avec et sans projet, et on finance ensuite au moindre coût sans mettre la trésorerie en danger. Vous rappelez les trois pièges : le compte propre d'un équipement, le chiffre d'affaires sans charges, et le flux qui se déplace d'un établissement à l'autre du groupe.",
    },
  ],
  calcul: {
    reponse: 15.04,
    etapes: [
      "Source « Lire le dossier de l'architecte et le compte d'exploitation du spa » : investissement 1 400 000 € en début de projet ; EBE propre de 340 000 − 370 000 = −30 000 € par an ; renouvellement de 120 000 € la sixième année ; valeur résiduelle de 250 000 € au bout de douze ans ; flux de fin d'année actualisés à 9 %.",
      "Coefficient d'annuité sur douze ans à 9 % : (1 − 1,09^−12) / 0,09 ≈ 7,1607. VAN du compte propre : −1 400 000 − 30 000 × 7,1607 − 120 000 / 1,09^6 + 250 000 / 1,09^12 = −1 400 000 − 214 822 − 71 552 + 88 884 ≈ −1 597 490 €.",
      "Source « Extraire de Hostéo les chiffres de l'hôtel » : 15 860 nuitées par an, dont 38 % par les plateformes à 17 % de commission, prélevée sur le prix entier. Un euro de prix moyen en plus rapporte 15 860 × (1 − 0,38 × 0,17) = 15 860 × 0,9354 ≈ 14 835 € par an.",
      "Seuil : le supplément qui compense la VAN négative, soit 1 597 490 / (7,1607 × 14 835) ≈ 1 597 490 / 106 232 ≈ 15,04 € par nuitée. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 0,5 € près.",
      "Lecture : les comparables donnent 5, 10 ou 14 € selon le scénario, 9,5 € en espérance. Le prix moyen seul ne paie pas le spa : sa valeur dépend des week-ends de basse saison, des séminaires nouveaux et des forfaits qui ne sont pas vendus à des habitués.",
    ],
    erreurs: [
      {
        valeur: 14.07,
        cause:
          "Les commissions des plateformes sont oubliées : chaque euro est compté sur les 15 860 nuitées entières, 1 597 490 / (7,1607 × 15 860).",
      },
      {
        valeur: 13.02,
        cause:
          "L'EBE négatif du spa n'est pas compté : seuls l'investissement, le renouvellement et la valeur résiduelle entrent dans la VAN, 1 382 668 / 106 232.",
      },
      {
        valeur: 9.16,
        cause:
          "Rien n'est actualisé : 1 400 000 + 12 × 30 000 + 120 000 − 250 000 = 1 630 000 €, divisés par douze ans puis par 14 835 €.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Maylis Quétand le dit : le spa perd 146,7 k€ par an, amortissement compris, et la famille est rassurée par un projet « qui ne perd pas d'argent ».",
      ceQuiLeDejoue:
        "Albéric Dérobert : un spa d'hôtel perd presque toujours de l'argent sur son propre compte, ce n'est pas la question ; il faut poser l'hôtel avec et sans spa. Les trois hôtels de lac appelés ont gagné 6 à 15 € de prix moyen, et aucun ne regarde le compte propre de son spa. Rejouée sur les trente tirages à la place de l'instruction du spa, la rénovation perd 248,9 k€ en moyenne ; elle fait mieux 11 fois, quand l'effet du spa est faible.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Aliénor Duchosal chiffre plus d'un million de chiffre d'affaires de plus par an, et Les Roselières ont pris 15 € de prix moyen avec leur spa.",
      ceQuiLeDejoue:
        "La projection de la directrice ne montre ni charges, ni commissions, ni investissement ; elle compte les forfaits en chiffre d'affaires et vingt séminaires transférés d'autres hôtels du groupe. Le grand spa coûte 1,9 M€, et son EBE propre est de −65 k€. Les comparables vont de 6 à 15 € : Les Roselières sont le meilleur cas. Rejoué sur les trente tirages à la place du spa instruit sur tout l'hôtel, le grand spa perd 215,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Une étude à 30 000 € pour un effet que tout le monde connaît : Les Roselières ont pris 15 €, on perd du temps et de l'argent.",
      ceQuiLeDejoue:
        "La source « Chiffrer le projet selon l'effet du spa » : sur les quatorze hôtels du panel, environ trois sur dix ont déçu, et sous un certain effet la rénovation vaut mieux que le spa. L'étude donne l'effet à 1 € près en semaine 7, avant le vote ; la Banque des Aravis accorde neuf prêts sur dix aux spas appuyés sur une étude, six sur dix sans. Rejoué sur les trente tirages à la place de l'étude, ce choix perd 57,7 k€ en moyenne, même s'il fait mieux 13 fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Calixte propose vingt séminaires déjà acquis au groupe : 280 k€ de chiffre d'affaires de plus pour Évian, sans rien recruter.",
      ceQuiLeDejoue:
        "Compter ce que chaque plan rapporte au groupe : 20 × 4 600 € de marge gagnée à Évian, 20 × 3 800 € perdue à Aix-les-Bains, dont les chambres de semaine se vident, soit 16 k€ ; et en 2022, trois clients d'Aix sur dix sont partis à la concurrence plutôt que de payer un 4 étoiles. Taïna le dit : ses clients viennent pour le prix et les thermes. Le commercial pour la Suisse apporte des séminaires nouveaux : neuf demandes suisses déclinées faute de spa. Rejoué sur les trente tirages à la place du commercial, le transfert perd 89,3 k€ en moyenne et ne fait mieux que 7 fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le conseil ne votera pas un spa qui perd de l'argent : 250 abonnements à 360 € font 90 k€ de recettes et passent l'EBE du spa de −30 à +30 k€.",
      ceQuiLeDejoue:
        "Les hôtels du panel qui vendent des abonnements ont un spa « bondé » le week-end : l'effet sur le prix moyen y est inférieur de 30 à 60 %, 45 % en moyenne, et les forfaits s'y vendent 30 % de moins. Le centre aquatique de Thonon confirme que les abonnés viendraient d'abord le week-end. Les soins de semaine ne coûtent que 2 % de l'effet. Rejoués sur les trente tirages à la place des soins de semaine, les abonnements perdent 199,3 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "On ne rouvre pas un dossier à trois semaines du vote, et les pré-ventes de forfaits marchent du tonnerre.",
      ceQuiLeDejoue:
        "Recalculer avec les chiffres du trimestre donne l'effet prix établi et la part des pré-ventes faites à des clients qui venaient déjà, puis la VAN du spa et celle de la rénovation : le dossier d'octobre ne dit pas lequel des deux l'emporte. Sous le tirage 6, l'effet est moyen et le spa reste le bon choix : tenir le dossier ne coûte rien. Rejoué sur les trente tirages à la place du dossier repris, il perd 71,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Avec le crédit-bail, rien ne sort de la trésorerie, et Aliénor le dit : les loyers sont couverts par ce que le spa rapporte, il se paie tout seul.",
      ceQuiLeDejoue:
        "La comparaison des trois financements au taux de l'emprunt : la VAN du projet ne dépend pas de son financement. Le crédit-bail à 5,2 % coûte plus que le prêt à 4,2 % sur douze ans : ses loyers, actualisés au taux de l'emprunt, dépassent le prix du projet. Le prêt garde la trésorerie au-dessus du seuil de 600 k€ en mars. Rejoué sur les trente tirages à la place du prêt, le crédit-bail perd 63 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le compte du spa perd 146,7 k€ par an et la directrice annonce plus d'un million de chiffre d'affaires. Pourquoi aucun des deux chiffres ne permet-il de décider ?",
    "Le seuil est de 15,04 € par nuitée, l'effet attendu de 9,5 €. Fallait-il en conclure que le spa détruit de la valeur ? Quels autres flux de l'hôtel entrent dans le calcul ?",
    "Vingt séminaires transférés d'Aix-les-Bains : combien rapportent-ils à Évian, et combien au groupe ? Pourquoi un flux qui se déplace n'est-il pas différentiel ?",
    "Les abonnements rendent le compte du spa bénéficiaire et font perdre de la valeur à l'hôtel. Comment ces deux affirmations peuvent-elles être vraies ensemble ?",
    "Sous le tirage 6, présenter le dossier d'octobre tel quel ne coûte rien ; sur les trente tirages, cela coûte 71,5 k€ en moyenne. Ceux qui l'ont fait ont-ils bien décidé ?",
    "Le crédit-bail « se paie tout seul ». Que répondez-vous à Aliénor, et à quel taux comparez-vous ses loyers ?",
    "Quelle règle gardez-vous pour juger un investissement dans un établissement ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 40 chambres vend 9 000 nuitées par an, dont 30 % par des plateformes à 15 % de commission. Il étudie une salle de fitness avec sauna : 300 000 € d'investissement, un EBE propre de −10 000 € par an, dix ans de durée, ni renouvellement ni valeur résiduelle, un taux d'actualisation de 8 %. 1) Calculez la VAN du compte propre de l'équipement. 2) Quel supplément de prix moyen rendrait, à lui seul, cette VAN nulle ? 3) L'équipement remplirait aussi 150 nuitées de plus en basse saison, à 90 € de marge chacune : quel est le nouveau seuil ? 4) L'effet sur le prix moyen serait de 3 € (quatre chances sur dix) ou de 7 € (six chances sur dix) : quelle est la VAN espérée du projet ?",
    corrige:
      "1) Coefficient d'annuité : (1 − 1,08^−10) / 0,08 ≈ 6,7101 ; VAN = −300 000 − 10 000 × 6,7101 ≈ −367 101 €. 2) Un euro de prix moyen rapporte 9 000 × (1 − 0,30 × 0,15) = 8 595 € par an, soit 8 595 × 6,7101 ≈ 57 673 € actualisés ; le seuil est de 367 101 / 57 673 ≈ 6,37 €. 3) Les nuitées en plus valent 150 × 90 × 6,7101 ≈ 90 586 € ; il reste 276 515 € à couvrir, soit un seuil de 276 515 / 57 673 ≈ 4,79 €. 4) Effet espéré : 0,4 × 3 + 0,6 × 7 = 5,4 € ; VAN espérée ≈ 5,4 × 57 673 − 276 515 ≈ 34 920 €. Elle est positive en espérance, mais négative d'environ 103 500 € si l'effet n'est que de 3 €.",
  },
  evaluation: [
    "La VAN du compte propre et le seuil de prix moyen sont calculés juste, avec l'actualisation, le renouvellement, la valeur résiduelle et les commissions.",
    "Les flux retenus sont différentiels : les forfaits vendus à des habitués et les séminaires transférés dans le groupe sont écartés, chiffres à l'appui.",
    "La décision sur les clients extérieurs est jugée sur la valeur de tout l'hôtel, pas sur le compte du spa.",
    "Le financement est choisi séparément de l'investissement, en comparant les coûts au taux de l'emprunt et en vérifiant la trésorerie au point bas.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 6.",
  ],
  vigilance:
    "Les flux sont comptés avant impôt, ce qui simplifie le calcul : à préciser aux étudiants de DCG, pour qui la VAN se calcule en général après impôt sur les sociétés et avec les économies d'impôt sur les amortissements. Le crédit-bail y est comparé au prêt par la seule actualisation de ses loyers, sans traitement fiscal ni comptable.",
};
