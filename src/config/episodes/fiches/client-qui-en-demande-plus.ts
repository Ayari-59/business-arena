import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 68, LE CLIENT QUI EN DEMANDE TOUJOURS PLUS.
 *
 * Une démonstration de la Découverte (config/episodes/demos.ts) : tenir le
 * périmètre d'une mission au forfait, le taux de réalisation et la marge à
 * terminaison, l'avenant proposé tôt et l'échange plutôt que le oui ou le non.
 * Les chiffres du hasard de la classe sont ceux de la graine 12, les moyennes
 * celles des 30 tirages du bilan.
 */
export const FICHE: FicheEnseignant = {
  code: "client-qui-en-demande-plus",
  formations: ["but-gaco", "but-gea"],
  programme: [
    "BUT GACO · Gérer un projet interne ou externe à l'organisation",
    "BUT GACO · Développer une approche conseil auprès des parties prenantes",
    "BUT GEA · Évaluer l'activité de l'organisation",
  ],
  notion:
    "Une mission vendue au forfait a un prix fixe : chaque jour passé sur une demande que le contrat ne prévoit pas coûte son coût de revient, ne rapporte rien, fait baisser le taux de réalisation (les honoraires rapportés à la valeur des jours passés au prix de vente) et retarde ce que le client a acheté. Tenir le périmètre, ce n'est pas dire non : c'est relire le contrat, chiffrer chaque demande, proposer un avenant tôt, quand le client a encore du budget, ou un échange contre un livrable devenu moins utile, et faire arbitrer la sponsor. L'erreur classique consiste à tout accepter pour faire plaisir, en pensant que la suite se jouera sur la satisfaction ; l'erreur inverse, à refuser sèchement. Dans l'épisode, Atlas Conseil mène chez Morvanel une mission de 330 jours pour 330 k€, soit un TJM de 1 000 € pour un coût de revient de 600 € par jour ; le directeur des opérations ajoute quatre « petites choses » qui font 40 jours, dont 6 déjà prévus au contrat, sur un plan déjà plein. L'élève découvre que les absorber ferait tomber le taux de réalisation à 90,7 %, à peine au-dessus des 90 % que vise la practice, avant même les demandes des semaines suivantes, et que la suite de 300 k€ se joue sur les livrables à l'heure et sur une proposition qui répond aux priorités de la sponsor, pas sur une remise.",
  objectifs: [
    "Je relis un contrat pour distinguer ce qui est au périmètre de ce qui ne l'est pas.",
    "Je calcule le taux de réalisation et la marge à terminaison d'une mission au forfait, et je mesure ce qu'y coûte une demande absorbée.",
    "Je transforme une demande hors périmètre en avenant chiffré, en échange ou en report, plutôt que de l'accepter ou de la refuser d'emblée.",
    "Je prépare une proposition commerciale à partir des priorités du client, demandées plutôt que supposées.",
  ],
  prerequis:
    "Les notions de prix de vente journalier, de coût de revient et de marge doivent être acquises, ainsi que la lecture d'un contrat de prestation simple. Le taux de réalisation et la marge à terminaison peuvent être introduits pendant la séance, à partir de la question de la semaine 1.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/client-qui-en-demande-plus?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Sans licence, la démonstration se joue au niveau Découverte : un repère de méthode accompagne chaque étape, et chaque décision montre aussitôt ce qu'elle a changé par rapport à ne rien changer. Vous présentez la situation en deux phrases (un forfait signé, un client qui ajoute des demandes) sans prononcer le mot « périmètre », et vous demandez de noter sur papier le taux de réalisation calculé en semaine 1 et la réponse faite à Brieuc.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans donner de réponse, et vous relevez la réponse aux quatre demandes de la semaine 1 et celle de la semaine 3 sur la ligne de surgelés. À qui hésite, vous rappelez seulement la consigne : au-delà de deux jours d'enquête, Brieuc n'attend plus et met les consultants sur ses demandes.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les taux relevés, puis vous reconstruisez le calcul : ce que le contrat facture (330 k€), ce que valent les jours qu'il faudrait passer (330 + 34 jours au TJM de 1 000 €). Vous faites dire pourquoi le tableau de bord des arrêts ne compte pas, et d'où viennent les valeurs à 89,2 %, 89,7 % ou 100 %. Vous terminez par la marge : 34 jours à 600 €, soit 20,4 k€ de coût de revient que personne ne paiera.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Partez de la semaine 1 : faites défendre « tout accepter », « l'avenant » et « le refus » par un élève qui l'a choisi. Faites chiffrer l'avenant (34 jours au TJM du forfait, 34 k€) face aux 60 k€ d'enveloppe que l'usine doit engager avant la revue budgétaire de fin octobre. Enchaînez sur la ligne de surgelés, où l'échange contre le benchmark devenu inutile donne au client ce qu'il veut sans coûter de jours à la mission, puis sur le comité de pilotage, où la sponsor découvre des demandes qu'elle ne connaissait pas.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Sous le tirage n° 12, « Cadrer, chiffrer, arbitrer » fait 236 k€ (141 k€ de marge à terminaison et 94,5 k€ de suite espérée, Aourell ayant donné son accord de principe), « Dire oui à tout » 74 k€ et l'attentisme 92 k€. Vous faites lire deux décisions où une autre option fait mieux presque toujours et perd pourtant en moyenne : refuser la présentation de la semaine 11 gagne 3,6 k€ sur 26 tirages et perd la suite sur les 4 autres ; écrire la suite sur les demandes de Brieuc gagne 1,2 k€ sur 23 tirages et la perd sur les 7 autres.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la formule du taux de réalisation et les quatre réponses possibles à une demande : l'avenant, l'échange, le report dans la suite, le geste annoncé. Vous rappelez le conseil de Lothaire : relire ce que le client a acheté, chiffrer ce qu'il demande, proposer un avenant tôt, et ne jamais dire non sans proposer autre chose. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 90.66,
    etapes: [
      "Source « Relire la proposition commerciale signée » : phases 2 et 3, 330 jours (310 d'équipe, 20 de direction de mission) pour 330 k€, soit un TJM moyen de 1 000 €. Le tableau de bord hebdomadaire des arrêts est au lot 2 ; la ligne 4, les équipes de nuit et les stocks n'y sont pas.",
      "Source « Chiffrer les demandes en attente dans Tempora » : ligne 4, 14 jours ; tableau de bord des arrêts, 6 jours ; formation des chefs d'équipe de nuit, 8 jours ; analyse des stocks, 12 jours. Hors périmètre : 14 + 8 + 12 = 34 jours ; les 6 jours du tableau de bord sont déjà dans les 330 jours du forfait.",
      "Taux de réalisation = honoraires / (jours passés × TJM). Si les 34 jours sont absorbés gratuitement, la mission demande 330 + 34 = 364 jours pour les mêmes 330 k€.",
      "Taux de réalisation = 330 000 / (364 × 1 000) = 90,66 %, à peine au-dessus des 90 % que vise la practice, et avant toute nouvelle demande. Le calcul ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 0,5 point près, proche à 2.",
      "Pour la suite : 34 jours au coût de revient de 600 € font 20,4 k€ de marge en moins sur les 132 k€ prévus au budget, et le plan, déjà plein (280 jours de travail et 30 de provision pour 310 de capacité), ne les absorbe qu'en consommant toute la provision, et au-delà. Chiffrés au TJM du forfait, ils font l'avenant de 34 k€.",
    ],
    erreurs: [
      {
        valeur: 89.19,
        cause:
          "Les six jours du tableau de bord comptés avec le reste (330 / 370) : la proposition signée le prévoit au lot 2, il est déjà payé par le forfait.",
      },
      {
        valeur: 89.7,
        cause:
          "Les 34 jours rapportés aux 330 du forfait et retirés de 100 % (1 − 34 / 330) : le taux se calcule en divisant les honoraires par la valeur de tous les jours passés, pas en retranchant une part.",
      },
      {
        valeur: 100,
        cause:
          "Le taux projeté par Tempora recopié, ou la provision de 30 jours supposée absorber les demandes : la provision est là pour les aléas du cœur de mission, et les demandes la dépassent.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "C'est le client, les consultants sont sur place, et la sponsor parle d'une suite pour l'an prochain : faire plaisir à Brieuc paraît le meilleur investissement.",
      ceQuiLeDejoue:
        "La proposition signée ne prévoit ni la ligne 4, ni les équipes de nuit, ni les stocks, et son article 7 prévoit un avenant au TJM du forfait pour toute demande hors périmètre ; Tempora chiffre ces trois demandes à 34 jours sur un plan déjà plein, soit 20,4 k€ de coût de revient et du retard sur ce qu'Aourell a acheté. L'usine a 60 k€ d'enveloppe à engager avant fin octobre ; Brieuc, lui, annonce « deux ou trois autres petites choses ». Rejoué sur les trente tirages à la place de l'avenant, tout accepter perd 62 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Ce n'est que l'affaire de quelques jours, l'équipe est la mieux placée, et dire non au client qu'on vient de servir paraît maladroit.",
      ceQuiLeDejoue:
        "Deux consultants pendant trois semaines, ce sont 24 jours pris sur le cœur de mission. Erell confirme qu'il reste de l'enveloppe à engager avant la revue budgétaire, et Aourell dit qu'elle n'a plus besoin cette année du benchmark des quatre usines (30 jours) : l'avenant de 24 k€ ou l'échange donnaient le démarrage sans le prendre sur le forfait. Rejoué sur les trente tirages à la place de l'avenant, dire oui perd 32 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Ces coups de main font la relation avec les ateliers, les chefs d'atelier en remercient l'équipe, et chacun ne prend que quelques heures.",
      ceQuiLeDejoue:
        "Les relevés de Tempora montrent une pente : 1,5 jour par semaine en septembre, un quart de jour de plus chaque semaine, et encore 20 jours d'ici fin novembre, soit 12 k€ de coût de revient pris sur le cœur de mission. L'analyste méthodes de l'usine peut reprendre le reporting après deux jours de formation, et préfère l'avoir en main. Rejoué sur les trente tirages à la place du transfert, laisser faire perd 16 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Une suite de 300 k€ serait la meilleure nouvelle de la practice : une remise de 10 % paraît le moyen le plus sûr de la verrouiller avant l'arbitrage du budget.",
      ceQuiLeDejoue:
        "Le chiffrage de Prune le dit : 300 k€ à 35 % de marge font 105 k€, et la remise en coûte 30. Surtout, la proposition est écrite sur les demandes de Brieuc, alors que le comité exécutif hésite entre consolider Loudéac et déployer la méthode dans les autres usines, à peu près une chance sur deux chacune : seul l'entretien avec Aourell dit laquelle. Rejouée sur les trente tirages à la place de l'entretien, la remise perd près de 30 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Six jours, c'est la dernière demande, et une belle présentation au comité exécutif du groupe met la mission en valeur ; inutile d'en faire une affaire.",
      ceQuiLeDejoue:
        "Les six jours sont pris de toute façon ; annoncés et valorisés « offert » sur la facture finale (6 k€), ils comptent dans le jugement d'Aourell, pourvu que l'essentiel des livrables soit à l'heure, ce que le point avec Rokia permet de vérifier. Faits en silence, ils ne comptent pour personne. Sous le tirage de la classe, les deux options font jeu égal ; rejoué sur les trente tirages, le silence perd 6 k€ en moyenne face au geste annoncé et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, qu'est-ce qui permettait de dire que l'une des quatre demandes était déjà payée ? Pourquoi fallait-il relire le contrat avant de répondre, plutôt que de juger les demandes sur leur taille ?",
    "Un taux de réalisation de 90,7 % paraît encore correct. Que devient-il si les demandes « rapides » continuent chaque semaine ? Que coûtent les jours absorbés à la marge, et au planning du cœur de mission ?",
    "Sous le tirage n° 12, l'avenant de la semaine 1 a été signé ; le modèle le fait signer sept fois sur dix. Pourquoi un avenant proposé tôt passe-t-il mieux qu'une régularisation après coup ? Que change l'enveloppe à engager avant fin octobre ?",
    "Le refus sec protège la marge : que coûte-t-il ? Comparez la réponse de Brieuc au courriel de refus et celle d'Aourell à l'échange proposé en semaine 3.",
    "Refuser la présentation de la semaine 11 fait mieux que le geste annoncé sur 26 tirages sur 30, et perd pourtant 4,8 k€ en moyenne. Que se passe-t-il sur les quatre autres tirages ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Sous le tirage n° 12, la priorité d'Aourell était de consolider Loudéac : la proposition écrite sur les demandes de Brieuc tombait juste. Ceux qui l'ont envoyée sans entretien ont-ils bien décidé ? Que vaut un entretien de deux jours quand la priorité du client est inconnue ?",
    "Quelle règle gardez-vous pour répondre à une demande hors périmètre ? Formulez-la en une phrase, avec les quatre réponses possibles.",
  ],
  prolongement: {
    enonce:
      "Un cabinet de conseil mène une mission au forfait de 120 jours pour 96 000 € ; son coût de revient journalier est de 450 €. En cours de mission, le client demande trois travaux que le contrat ne prévoit pas : 6, 4 et 5 jours. 1) Calculez le TJM moyen du forfait, la marge à terminaison prévue et son taux. 2) Si les trois demandes sont absorbées gratuitement, calculez le taux de réalisation et la marge à terminaison. 3) Le cabinet propose un avenant au TJM du forfait pour les demandes de 6 et 5 jours, et un échange pour celle de 4 jours contre un livrable de 4 jours que le client juge devenu inutile. Calculez le montant de l'avenant, le taux de réalisation et la marge à terminaison. 4) À partir de combien de jours absorbés gratuitement le taux de réalisation passe-t-il sous 90 % ?",
    corrige:
      "1) TJM = 96 000 / 120 = 800 € ; marge prévue = 96 000 − 120 × 450 = 42 000 €, soit 43,75 % des honoraires. 2) 15 jours absorbés : taux de réalisation = 96 000 / (135 × 800) ≈ 88,9 % ; marge = 96 000 − 135 × 450 = 35 250 €. 3) Avenant = 11 × 800 = 8 800 € ; jours passés = 120 + 11 + 4 − 4 = 131 ; honoraires = 104 800 € ; taux de réalisation = 104 800 / (131 × 800) = 100 % ; marge = 104 800 − 131 × 450 = 45 850 €, plus que prévu. 4) Le taux passe sous 90 % quand 120 + n dépasse 96 000 / (0,90 × 800) ≈ 133,3 jours, soit à partir de 14 jours absorbés.",
  },
  evaluation: [
    "Le taux de réalisation de la semaine 1 est calculé juste, et l'élève dit pourquoi le tableau de bord des arrêts n'en fait pas partie, en citant la proposition signée.",
    "Chaque demande hors périmètre reçoit une réponse argumentée (avenant, échange, report ou geste annoncé), chiffrée en jours et en euros.",
    "L'élève explique ce que coûte deux fois un jour absorbé : en marge, au coût de revient, et en retard sur le cœur de mission.",
    "La proposition de suite s'appuie sur les priorités de la sponsor, recherchées avant d'écrire, et non sur une remise.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode définit le taux de réalisation comme les honoraires rapportés à la valeur, au TJM du forfait, de tous les jours passés ; d'un cabinet à l'autre, la définition varie, à préciser aux élèves. La suite y est comptée comme une espérance (un accord de principe signé neuf fois sur dix, une mise en concurrence gagnée trois fois sur dix) ajoutée à une marge réelle : une convention de l'épisode, à présenter comme telle.",
};
