/**
 * FICHE ENSEIGNANT · ÉPISODE 69, LE LIVRABLE QUE LE CLIENT REFUSE.
 *
 * Conduire une mission au forfait après un refus : trouver l'hypothèse que le
 * client n'a jamais validée, valider sur un échantillon avant de généraliser,
 * et traiter une erreur à sa source plutôt qu'à la fin.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "livrable-refuse",
  formations: ["but-gaco", "but-gea"],
  programme: [
    "BUT GACO · Gérer un projet interne ou externe à l'organisation",
    "BUT GACO · Développer une approche conseil auprès des parties prenantes",
    "BUT GEA · Piloter les relations avec les parties prenantes de l'organisation",
  ],
  notion:
    "Quand un client refuse un livrable, le réflexe est de redoubler d'effort : une version « parfaite » à coups de week-ends, une forme reprise de fond en comble, des renforts pour rattraper, une relecture la veille. L'erreur classique est de croire ce que le comité dit le plus fort, la forme, sans chercher ce qu'il refuse vraiment. Dans l'épisode, Ewen Le Goff, manager chez Atlas Conseil, conduit au forfait (132 000 € HT, 150 jours vendus) le diagnostic énergétique de vingt-deux bâtiments d'Ardven Agglomération. Le rapport intermédiaire est refusé : six remarques sur huit portent sur la forme, une seule sur le fond, et c'est elle qui compte. La note de méthode a pris 2023 comme année de référence « sauf avis contraire », jamais validée, quand le cahier des charges impose les consommations déclarées par la collectivité, celles de 2019. Recalculer les vingt-deux bâtiments coûte 37 jours ; une version parfaite avec la même hypothèse sera refusée de nouveau. L'élève découvre qu'il faut faire valider la méthode puis quelques bâtiments témoins avant de généraliser, valider les hypothèses de la phase suivante sur trois fiches types, faire relire par un pair au fil de l'eau, remonter une erreur répétée jusqu'à l'outil qui la produit, et préparer le comité avec le client plutôt que le surprendre.",
  objectifs: [
    "Je distingue, dans un refus, la remarque de fond des remarques de forme.",
    "Je chiffre en jours une reprise de travail, en séparant ce qui est à refaire de ce qui est acquis.",
    "J'explique pourquoi une erreur coûte d'autant plus qu'on la trouve tard, avec un calcul en jours.",
    "Je relie la confiance du client à la suite de la mission.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de mission au forfait, de jours vendus et de jours consommés, de marge d'une mission et de jalon de validation doivent être connues. Le vocabulaire de l'audit énergétique est donné par l'épisode.",
  dureeMinutes: 90,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/livrable-refuse?hasard=16 : toute la classe joue la même mission, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul des jours de reprise si les vingt-deux bâtiments doivent être recalculés.",
    },
    {
      minutes: 30,
      titre: "La mission",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la prévision de la semaine 1, la réponse au refus (week-ends, atelier de méthode, forme, attente) et la réponse aux deux erreurs de la semaine 7.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et refaites le calcul avec l'extraction de Tempora : 2 jours par bâtiment, dont une demi-journée de visite qui reste acquise, et 4 jours de synthèse. Vous faites expliquer les valeurs éloignées de 37 jours (48, 33 ou 30). Vous comparez ensuite aux 75 jours de reste à faire planifiés et aux 88 jours restants sur les 150 vendus.",
    },
    {
      minutes: 15,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (le refus), de la semaine 3 (le lancement de la phase 2) et de la semaine 7 (les deux erreurs). Pour la semaine 1, vous faites relire le compte rendu et la note de méthode : la seule remarque de fond, l'année de référence. Pour la semaine 7, la source sur l'origine des erreurs : le prix de la chaleur du modèle commun, faux pour neuf bâtiments raccordés sur vingt-deux.",
    },
    {
      minutes: 10,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 16, « Valider en route » fait 36,3 k€ (marge de la mission et valeur espérée de la tranche optionnelle), « L'effort héroïque » −19,8 k€ et l'attente 9,5 k€ : l'effort à la fin fait moins bien que l'immobilité. Vous montrez ensuite la fin du trimestre : sous ce tirage, la directrice accepte la remise en deux temps ; sur les trente tirages, ne rien changer fait mieux 11 fois, et perd pourtant 3,7 k€ en moyenne.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : on valide avant de produire, sur un échantillon, et on corrige une erreur à sa source. Vous la déclinez en quatre gestes : chercher l'hypothèse non validée derrière un refus, faire valider des témoins, faire relire par un pair au fil de l'eau, et ne rien laisser découvrir au client en séance.",
    },
  ],
  calcul: {
    reponse: 37,
    etapes: [
      "Source « Extraire de Tempora les jours passés sur la phase 1 » : 2,0 jours par bâtiment en moyenne, dont 0,5 jour de visite et de collecte des factures, qui n'est pas à refaire si l'on change de méthode de calcul.",
      "Ce qu'il faut refaire par bâtiment : 2,0 − 0,5 = 1,5 jour, soit 22 × 1,5 = 33 jours pour les vingt-deux bâtiments.",
      "La note de synthèse et ses annexes, qui reprennent tous les chiffres : 4 jours. Total de la reprise : 33 + 4 = 37 jours. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 2 jours près.",
      "Pour la suite : 62 jours sont déjà pointés sur 150 vendus, il en reste 88, pour 75 jours de reste à faire planifiés. Avec 37 jours de reprise, la mission passe à 174 jours : le forfait est dépassé de 24 jours avant toute autre surprise.",
    ],
    erreurs: [
      {
        valeur: 48,
        cause:
          "Les visites et la collecte des factures sont comptées comme à refaire : 22 × 2 + 4 = 48 jours.",
      },
      {
        valeur: 33,
        cause: "La note de synthèse est oubliée : seuls les 22 × 1,5 jours de recalcul sont comptés.",
      },
      {
        valeur: 30,
        cause:
          "Les 30 jours de la version « parfaite » sont repris : un jour de contrôle par bâtiment et 8 jours de forme. C'est une autre reprise, qui garde l'hypothèse refusée.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Basile le propose et toute l'équipe est partante : deux week-ends, et un rapport impeccable revient chez le client sous dix jours.",
      ceQuiLeDejoue:
        "Le compte rendu du comité : six remarques de forme, et une de fond, de Tudy Gourvès, sur les consommations de référence de dix-neuf bâtiments sur vingt-deux. La note de méthode a pris 2023 sans validation, le cahier des charges impose 2019. Awen Kerrien le dit : un comité parle de la forme parce que c'est ce qu'il voit. La version parfaite coûte 30 jours, dont 12 samedis majorés, et garde l'hypothèse refusée. Rejouée sur les trente tirages à la place de l'atelier de méthode, elle perd 37 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "La phase 2 a pris trois semaines de retard : deux consultants de l'intercontrat en renfort permettent de lancer les vingt-deux fiches d'un coup.",
      ceQuiLeDejoue:
        "Tudy Gourvès prévient que les coûts de travaux de la note d'hypothèses sont 20 à 30 % sous les marchés de l'agglomération et que les élus veulent la trajectoire de −40 % en 2030 : il n'a jamais vu cette note. Sur les douze dernières missions de la practice, celles qui ont fait valider un échantillon ont passé 4 % de leurs jours en reprises, les autres 17 %. Les renforts coûtent en plus une semaine d'apprentissage. Rejoué sur les trente tirages à la place des trois fiches types, ce choix perd 16,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Awen ne veut pas d'un deuxième comité comme celui de janvier : le manager relit tout lui-même la veille de chaque envoi.",
      ceQuiLeDejoue:
        "La source sur les erreurs de la phase 1 : 0,8 erreur par bâtiment ; une relecture par un pair, 0,3 jour par fiche, en arrête quatre sur cinq. Une erreur corrigée avant envoi coûte 0,1 jour, la même trouvée par le client 0,5 jour et un peu de sa confiance ; une relecture tardive en arrête bien moins. Rejouée sur les trente tirages à la place de la relecture croisée, la relecture de la veille perd 3,6 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Deux erreurs signalées, c'est l'affaire d'une heure : Basile corrige les deux fiches ce soir, et la directrice a sa réponse lundi.",
      ceQuiLeDejoue:
        "Remonter à la source montre que les deux bâtiments sont raccordés au réseau de chaleur, et que le modèle commun utilise le prix de l'ancien contrat : neuf bâtiments sur vingt-deux sont touchés, fiches faites et à faire. Corriger le modèle et relancer coûte un jour, plus 0,3 jour par fiche. Corriger fiche par fiche laisse l'erreur courir. Rejoué sur les trente tirages à la place de l'analyse de l'origine, ce choix perd 10,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Basile part sur une avant-vente et il manque des jours : trois samedis pour toute l'équipe, et la date du 31 mars tient.",
      ceQuiLeDejoue:
        "Le CCAP prévoit 250 € de pénalité par jour calendaire de retard, mais aussi une prolongation du délai si le titulaire la demande et la justifie avant son expiration. Les samedis coûtent douze jours rachetés majorés de 10 %, et Shirin le dit : c'est quand on est fatigués qu'on se trompe. Rejoués sur les trente tirages à la place de la remise en deux temps, les samedis perdent 3,2 k€ en moyenne et ne font mieux que 8 fois.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "La tranche optionnelle vaut 96 000 € d'honoraires : une dernière nuit de relecture de toute l'équipe rendra le rapport impeccable.",
      ceQuiLeDejoue:
        "La directrice le dit : le bureau suivra l'avis de sa directrice et de son économe de flux, qui veulent ne rien découvrir en séance. Revoir le rapport avec eux une semaine avant le comité coûte deux jours et permet de reprendre les priorités. La nuit coûte trois jours majorés, et un rapport reçu la veille ne laisse rien à discuter. Rejouée sur les trente tirages à la place de la revue avec le client, la nuit perd 4,6 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "Six remarques sur huit portaient sur la forme. Pourquoi une version parfaite sur la forme était-elle sûre d'être refusée ? Quelle source le disait ?",
    "Recalculer les vingt-deux bâtiments coûte 37 jours, et la mission n'en a plus que 88 pour 75 prévus. Que valait-il mieux faire avant de relancer le recalcul ?",
    "Valider trois fiches types coûte une réunion et 2,4 jours de reprise s'il y a un écart ; trouvé en comité, le même écart se reprend sur les vingt-deux fiches. Pourquoi une erreur coûte-t-elle d'autant plus qu'on la trouve tard ?",
    "Deux erreurs sur deux fiches : pourquoi corriger les deux fiches ne suffisait-il pas ?",
    "Sous le tirage 16, la directrice a accepté la remise en deux temps. Sur les trente tirages, ne rien changer fait mieux 11 fois et perd 3,7 k€ en moyenne. Ceux qui n'ont rien changé ont-ils eu raison ?",
    "« L'effort héroïque » finit sous l'attente. Comment autant de travail peut-il faire moins bien que l'immobilité ?",
    "Quelle règle gardez-vous pour conduire une mission dont un livrable a été refusé ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Un bureau d'études doit produire trente fiches de travaux, deux jours chacune, au coût de 540 € par jour. Ses hypothèses de coûts de travaux ont une chance sur deux d'être différentes de celles du client ; si elles le sont, reprendre une fiche coûte 0,8 jour. 1) Sans validation préalable, l'écart est découvert en comité, une fois les trente fiches faites : combien de jours de reprise attend-on, en espérance, et combien d'euros ? 2) Le bureau fait d'abord trois fiches types et les valide en réunion technique (1,5 jour) avant de faire les autres : combien de jours attend-on, réunion comprise ? 3) Pourquoi la seconde méthode est-elle meilleure, même dans le cas où les hypothèses étaient justes ?",
    corrige:
      "1) Si l'écart existe, 30 × 0,8 = 24 jours de reprise ; en espérance, 0,5 × 24 = 12 jours, soit 12 × 540 = 6 480 €. 2) 1,5 jour de réunion, et si l'écart existe, 3 × 0,8 = 2,4 jours de reprise : en espérance, 1,5 + 0,5 × 2,4 = 2,7 jours, soit 1 458 €. 3) Dans le cas où les hypothèses étaient justes, la réunion coûte 1,5 jour pour rien en apparence ; mais elle évite 24 jours dans l'autre cas, et le client a validé les hypothèses : il ne découvrira rien en comité. La méthode se juge sur l'espérance et sur le pire cas, pas sur le cas où l'on a eu de la chance.",
  },
  evaluation: [
    "Les jours de reprise sont calculés juste, en séparant ce qui est acquis (les visites) de ce qui est à refaire, à partir de la source nommée.",
    "Le diagnostic du refus identifie l'hypothèse de méthode non validée, avec la source qui le montre.",
    "Le lancement de la phase 2 et le traitement des erreurs sont justifiés par le coût d'une erreur trouvée tard.",
    "La fin de la mission est conduite avec le client (remise en deux temps, revue avant le comité), pas seulement par l'effort de l'équipe.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 16.",
  ],
  vigilance:
    "L'épisode pose qu'un jour de repos racheté à un cadre au forfait jours est majoré de 10 % au moins, et décrit un dispositif de déclaration des consommations (« Éco Énergie Tertiaire ») et un objectif de −40 % en 2030 : la règle du rachat et le dispositif réel (le décret tertiaire et sa plateforme de déclaration) sont à vérifier avec un enseignant de droit ou d'énergétique.",
};
