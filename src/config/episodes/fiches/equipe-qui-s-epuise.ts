/**
 * FICHE ENSEIGNANT · ÉPISODE 18, L'ÉQUIPE QUI S'ÉPUISE.
 *
 * Une file de demandes qui s'alimente elle-même : au-delà de deux jours, les
 * clients relancent, et chaque relance allonge le délai. Le piège : demander
 * plus à l'équipe, qui donne de la capacité tout de suite et de la fatigue ensuite.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "equipe-qui-s-epuise",
  formations: ["seconde-pro-rc", "bac-pro-agora", "bts-ndrc"],
  programme: [
    "2de pro RC · Intégrer la relation client dans un cadre « omnicanal »",
    "Bac pro AGORA · Bloc 1, Gérer des relations avec les clients, les usagers et les adhérents",
    "BTS NDRC · Bloc 2, Relation client à distance et digitalisation",
  ],
  notion:
    "Une file de demandes qui s'allonge ne dit pas que l'équipe travaille mal : au-delà d'un certain délai, les clients relancent, et ces relances remplissent la file à leur tour. L'erreur classique consiste à répondre par la pression : heures supplémentaires imposées, objectif individuel de rendement, samedi de rattrapage ; on gagne de la capacité tout de suite, puis on la reperd en fatigue, en absences et en départs. Dans l'épisode, Nadia Haddad dirige le service client d'Arvel Distribution, douze conseillers : le délai de réponse est de 3,5 jours pour un objectif de 2, l'absentéisme de 11 % contre 5 % dans le groupe, Léa est en arrêt et Mathieu va partir. L'analyse des demandes montre 38 % de relances, faute d'accusé de réception ; les conseillers traitent 96 demandes par semaine, contre 94 dans le groupe : ils ne sont pas lents. L'élève découvre qu'un accusé de réception qui donne un délai et un tri par urgence coupent la boucle des relances, que des réponses types préparées avant une campagne évitent un afflux, qu'un conflit se traite en redistribuant le travail, et que prendre soin de l'équipe, ici, est un calcul.",
  objectifs: [
    "J'explique comment une file d'attente s'alimente elle-même par les relances, et je repère ce qui coupe la boucle.",
    "J'estime un délai de réponse à partir de la file et de la capacité de traitement de l'équipe.",
    "Je distingue une capacité gagnée tout de suite (heures, objectifs) de ce qu'elle coûte plus tard en fatigue et en départs.",
    "Je prépare un afflux prévisible (une campagne) par des réponses types plutôt que par des heures en plus.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de délai de réponse, de satisfaction client et d'absentéisme doivent avoir été vues en cours. La boucle des relances et la relation entre la file, la capacité et le délai peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/equipe-qui-s-epuise?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le délai de réponse attendu en semaine 3 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 (heures supplémentaires, accusé de réception, objectif de 110 demandes, attente) et la réponse au départ de Mathieu en semaine 3, où la classe se partage souvent. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 1 : les heures supplémentaires au lieu de l'accusé de réception.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous posez avec la classe la relation qui fait le délai : la file divisée par ce que l'équipe traite en un jour, plus une demi-journée. Avec une file qui reste vers 700 demandes et environ 200 demandes traitées par jour, on trouve 4 jours. Sous le tirage n° 12, le modèle donne 4,1 jours avec l'accusé de réception. Vous montrez ensuite que les heures supplémentaires donnent un meilleur chiffre en semaine 3 (3,5 jours), puis un délai de plus de 13 jours en fin de trimestre.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 pour Mathieu (CDI, intérim, répartir son portefeuille, 150 € de plus) et de la semaine 7 avant la campagne. Vous faites lire l'entretien avec Mathieu : il part « parce qu'ici on court tout le temps », et pourrait rester si le calme revenu continue. Pour la campagne, vous faites lire les demandes de la dernière : deux sur trois portaient sur les mêmes six questions.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Soulager la file d'abord » finit 20,1 k€ sous le budget variable de 45 k€, « Pression sur l'équipe » 89,6 k€ au-delà et l'attentisme 79,4 k€ au-delà ; sur les trente tirages, la première méthode reste sous le budget 28 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur la campagne : demander au marketing de la décaler fait mieux 20 fois sur 30, quand il accepte, mais sous le tirage de la classe il a refusé, et cela a coûté 7,3 k€.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant de demander plus à l'équipe, regarder ce qui remplit la file. Vous la déclinez en quatre gestes : couper les relances par un accusé de réception qui donne un délai, préparer les afflux prévisibles, redistribuer le travail quand une personne porte seule une charge, et donner une date aux clients qui attendent. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 4.1,
    etapes: [
      "Ce que fait le délai : la file divisée par ce que l'équipe traite en un jour, plus une demi-journée. Au départ, 600 demandes en attente et environ 200 traitées par jour : 600 / 200 + 0,5 = 3,5 jours, le chiffre du tableau de bord.",
      "La capacité : Léa est en arrêt jusqu'à la semaine 6, et l'absentéisme du service est de 11 % (source des ressources humaines). Restent une dizaine de conseillers présents, à une centaine de demandes par semaine (96 selon la comparaison) : environ 1 000 demandes par semaine, 200 par jour ouvré.",
      "Ce qui arrive : environ 940 demandes nouvelles par semaine, plus les relances, qui font 38 % des demandes selon l'analyse de la semaine. L'accusé de réception, en place à partir de la semaine 2 après une semaine pour s'y faire, en coupe la plus grande part. Il reste donc à peu près autant de demandes que l'équipe en traite : la file cesse de s'emballer, mais ne baisse pas encore, et tourne autour de 700.",
      "Estimation : 700 / 200 + 0,5 = 4 jours. Sous le tirage n° 12, le modèle donne 3,43 jours en semaine 1, 4,21 en semaine 2 (une semaine chargée, avec des absences) et 4,09 en semaine 3, avec 738 demandes en attente. Sans accusé de réception, il donne 5,48 jours ; avec les heures supplémentaires, 3,54.",
      "L'épisode juge juste à 0,3 jour près, proche à 0,8 : c'est une prévision exigeante. Selon les trente tirages du bilan, la meilleure méthode donne de 3,5 à 6,2 jours en semaine 3.",
    ],
    erreurs: [
      {
        valeur: 2,
        cause:
          "L'objectif de 2 jours pris pour une prévision, comme si l'accusé de réception vidait la file : il arrête les relances, il ne traite pas les 600 demandes déjà là.",
      },
      {
        valeur: 3.5,
        cause:
          "Le délai du jour reporté tel quel : l'équipe tourne à onze, avec 11 % d'absences, et ce qui arrive égale à peine ce qu'elle traite ; la file monte encore un peu avant de baisser.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "La file déborde : deux heures supplémentaires par jour pour toute l'équipe, pendant quatre semaines, la vident.",
      ceQuiLeDejoue:
        "L'analyse des demandes : 38 % sont des relances, faute d'accusé de réception ; à l'écoute, un appel sur deux commence par « je vous ai déjà écrit lundi ». Les heures supplémentaires coûtent 2 400 € par semaine et donnent même le meilleur délai en semaine 3, puis la fatigue revient en absences et en départ : sous le tirage de la classe, le délai finit au-delà de 13 jours sur ce chemin. Hélène Garnier : « Avant de demander plus à l'équipe, regarde ce qui remplit la file. » Rejouées sur les trente tirages à la place de l'accusé de réception, elles perdent 66,2 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi: "Fixer 110 demandes par conseiller : chacun sait ce qu'on attend de lui.",
      ceQuiLeDejoue:
        "La comparaison de productivité : 96 demandes par conseiller et par semaine, contre 94 dans le groupe, « rien d'anormal ». Le problème n'est pas le rythme, c'est ce qui remplit la file. Sophie Lambert le constate : « Pour faire 110, on bâcle les dossiers difficiles et on les laisse aux autres. » Rejoué sur les trente tirages à la place de l'accusé de réception, l'objectif perd 68,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "Répartir le portefeuille de Mathieu sur l'équipe ne coûte rien.",
      ceQuiLeDejoue:
        "L'entretien avec Mathieu : il part pour 150 € de plus par mois, mais surtout « parce qu'ici on court tout le temps », et pourrait rester si le calme revenu avec l'accusé de réception continue. Onze conseillers pour le travail de douze, c'est de la fatigue en plus, quand 450 € sur le trimestre le retiennent sept fois sur dix si la file a été soulagée. Rejoué sur les trente tirages, répartir son portefeuille perd 12 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi: "La dernière campagne a fait monter les demandes de 25 % : des heures supplémentaires volontaires pour absorber le surplus.",
      ceQuiLeDejoue:
        "Les demandes de la dernière campagne : deux sur trois portaient sur les conditions de l'offre, « les mêmes six questions, encore et encore ». Des réponses types et une page de questions fréquentes, avec le lien dans l'e-mail de la campagne, coûtent 600 € et évitent l'essentiel du surplus, quand les heures coûtent 2 000 € par semaine pendant trois semaines et fatiguent l'équipe. Rejouées sur les trente tirages, elles perdent 6,8 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "Deux semaines avant la fin : un samedi de rattrapage payé, et la file baisse.",
      ceQuiLeDejoue:
        "Le samedi coûte 3 000 € et fatigue l'équipe (« tout le monde est rincé »). Traiter d'abord les demandes les plus anciennes et donner aux autres un délai précis réduit les relances et rassure les clients : Hélène Garnier rapporte que les grands comptes apprécient qu'on leur réponde avec une date. Rejoué sur les trente tirages, le samedi perd 2,9 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un manque de productivité, d'autres un manque de monde, d'autres une file qui s'alimente elle-même. Quelles sources permettaient de trancher, et lesquelles étaient du bruit ?",
    "Avec les heures supplémentaires, le délai de la semaine 3 était meilleur qu'avec l'accusé de réception (3,5 jours contre 4,1). Pourquoi la décision qui donne le meilleur chiffre à trois semaines est-elle la pire du trimestre ?",
    "Mathieu part « parce qu'ici on court tout le temps ». Pourquoi une augmentation le retient-elle deux fois plus souvent quand la file a été soulagée ? Que dit cela de l'argent comme réponse à une surcharge ?",
    "Sophie traitait 71 % des litiges, souvent après 18 heures. En quoi le conflit avec Romain était-il un problème de répartition du travail avant d'être un problème de personnes ?",
    "Décaler la campagne fait mieux 20 fois sur 30, quand le marketing accepte ; sous le tirage de la classe, il a refusé, et ceux qui avaient tout misé là-dessus ont perdu 7,3 k€. Que valait cette décision, prise sans savoir ce que le marketing répondrait ?",
    "Sur le chemin de la pression, Inès démissionne 22 fois sur 30 ; sur celui de la meilleure méthode, jamais. Comment un départ qui n'arrive qu'en semaine 10 se décide-t-il dès la semaine 1 ?",
    "Quelle règle gardez-vous face à une équipe qui s'épuise ? Formulez-la en une phrase, avec la file dedans.",
  ],
  prolongement: {
    enonce:
      "Un service client compte 8 conseillers qui traitent chacun 100 demandes par semaine, soit 160 par jour ouvré pour l'équipe. 480 demandes attendent. Le délai de réponse vaut : file / demandes traitées par jour + 0,5 jour. Il arrive 760 demandes nouvelles par semaine ; s'y ajoutent des relances, qui valent 0,14 × (délai − 2) × 760 quand le délai dépasse 2 jours. 1) Calculez le délai actuel, les relances de la semaine et la part des relances dans les demandes. 2) De combien la file augmente-t-elle en une semaine, et quel délai cela donne-t-il ? 3) Option A : des heures supplémentaires, qui ajoutent 10 % de capacité. Option B : un accusé de réception qui supprime 60 % des relances. Pour chacune, puis pour les deux ensemble, de combien la file varie-t-elle dans la semaine ?",
    corrige:
      "1) 480 / 160 + 0,5 = 3,5 jours. Relances : 0,14 × 1,5 × 760 = 159,6, soit environ 160. Demandes : 760 + 160 = 920 ; part des relances : 160 / 920 ≈ 17 %. 2) 920 − 800 = 120 demandes de plus : la file passe à 600, et le délai à 600 / 160 + 0,5 = 4,25 jours. 3) A : capacité de 880, file + 40 (920 − 880). B : relances de 64, demandes de 824, file + 24 (824 − 800). A et B : 824 − 880 = −56, la file baisse. L'accusé de réception, payé une fois, freine plus la file que des heures payées chaque semaine ; pour la faire baisser, il faut couper les relances d'abord, et la capacité ne fait que finir le travail.",
  },
  evaluation: [
    "La prévision de la semaine 1 relie le délai à la file et à la capacité de l'équipe, en tenant compte de l'absence de Léa et de ce que l'accusé de réception coupe.",
    "Le diagnostic s'appuie sur les sources décisives (part des relances, écoute des appels) et écarte la comparaison de productivité, qui ne montrait rien d'anormal.",
    "Chaque réponse qui demande plus à l'équipe est mise en regard de ce qu'elle coûte plus tard en fatigue, en absences et en départs.",
    "Le conflit et le départ de Mathieu sont traités par leurs causes (répartition des litiges, charge) plutôt que par l'autorité ou le seul argent.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "Les heures supplémentaires imposées restent encadrées par les durées maximales du travail et le contingent annuel, et le télétravail par l'accord ou la charte de l'entreprise : à préciser par un enseignant de droit si la classe pose la question. Les relances valent 38 % des demandes dans la source de la semaine 1, mais le modèle en compte nettement moins au départ (autour de 17 %) : la proportion de la source sert au diagnostic, pas au calcul exact.",
};
