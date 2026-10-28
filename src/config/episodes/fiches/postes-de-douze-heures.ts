/**
 * FICHE ENSEIGNANT · ÉPISODE 91, PASSER EN DOUZE HEURES.
 *
 * Changer l'organisation du temps de travail d'une équipe soignante : les
 * postes de 12 heures ont des effets bons et mauvais qui dépendent de la
 * trame et de l'équipe. Le piège est de trancher par principe, pour ou
 * contre, sans mesurer ni consulter.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "postes-de-douze-heures",
  formations: ["stmg", "bts-gpme", "dcg"],
  programme: [
    "STMG · Terminale, ressources humaines et communication, Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "DCG · UE 3, Droit social",
  ],
  notion:
    "Une nouvelle organisation du travail ne se décide pas sur un argument, même vrai : elle se mesure. Les postes de 12 heures suppriment une relève par jour, donc des heures payées en double et des informations perdues aux transmissions, et ils attirent les candidats ; mais après la dixième heure les erreurs augmentent, surtout quand les postes s'enchaînent et que la pause saute. L'erreur classique consiste à trancher par principe : généraliser vite pour recruter, ou refuser d'emblée au nom de la sécurité, et à consulter le CSE après coup. Dans l'épisode, Irène Ferrandin, cadre de santé d'une unité de 40 lits de SMR à la clinique du Val Solvanne, a quinze soignants de jour sur vingt-six qui veulent passer en 12 heures, une autre partie qui n'en veut pas, trois postes vacants tenus en intérim, et un directeur qui voudrait passer toute la clinique au 1er octobre. La comparaison des trames montre 35 heures de chevauchement par semaine en 7 h 30 contre 17,5 en 12 heures : 17,5 heures payées en double de moins chaque semaine. L'élève découvre qu'une expérimentation sur un secteur, avec des volontaires, des indicateurs relevés avant et heure par heure, une trame bornée à trois postes d'affilée avec une vraie pause, et le CSE consulté avant le démarrage, permet de garder ce qui marche et de corriger le reste.",
  objectifs: [
    "Je calcule les heures de chevauchement d'une organisation à partir de la durée des relèves et du nombre d'agents qui arrivent.",
    "J'identifie les effets attendus d'un changement d'organisation, positifs et négatifs, et les indicateurs qui permettent de les mesurer.",
    "Je conçois une expérimentation limitée (un secteur, des volontaires, une durée, un bilan) avant de généraliser.",
    "Je situe le rôle du CSE dans un projet qui modifie l'organisation du travail, et je dis à quel moment le consulter.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de durée du travail, de planning, d'absentéisme, d'intérim et de représentants du personnel doivent être connues ; une multiplication de minutes en heures suffit pour le calcul. Le rôle du CSE et la notion d'expérimentation peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/postes-de-douze-heures?hasard=16 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous lisez les deux messages du lundi (Riwanon Ravaillé pour les volontaires, Nuria Chaudrier pour les autres) et la proposition du directeur, et vous demandez de noter sur papier les heures de chevauchement économisées calculées en semaine 1, avec leur calcul, et la proposition faite vendredi.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la proposition de la semaine 1 (toute la clinique, un secteur, toute l'unité, refus), la façon d'associer le CSE (semaine 3) et la proposition pour janvier (semaine 11), où la classe se partage. Un binôme qui a fini tôt traduit les heures de chevauchement économisées en euros d'intérim par trimestre.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les heures relevées, puis vous refaites le calcul avec la classe, relève par relève : trois relèves en 7 h 30, deux en 12 heures, chacune avec sa durée et le nombre de soignants qui arrivent, sept jours sur sept. Vous faites expliquer les valeurs éloignées (2,5, 35 ou 3,5). Vous terminez par la conversion : à 64 € l'heure d'intérim, 17,5 heures font 1 120 € par semaine, autant que le surcoût d'un poste vacant.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 et de la semaine 11. Pour la semaine 1, faites lire ce que disent les études : moins d'erreurs aux transmissions, plus après la dixième heure, une ampleur qui varie d'une équipe à l'autre. Pour la semaine 3, faites lire les deux précédents de la clinique (la cuisine en 2023, l'hôpital de jour en 2024) et la note de la juriste sociale. Pour la semaine 11, faites comparer une généralisation à toute la clinique et une expérimentation proposée à la neurologie.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 16, « Expérimenter et mesurer » finit à +11,2 k€ au jugement de la direction (budget de remplacement, événements indésirables, heures de relève et coûts du projet, trimestre suivant compris), « Attentiste » à −34,9 k€, et « Généraliser au 1er octobre » à −139,5 k€, avec un événement indésirable grave, un départ, une mutation et un conflit en janvier. Vous faites lire la semaine 3 : sous ce tirage, démarrer sans consulter le CSE ne coûte que 1,4 k€, mais sur les trente tirages il perd 25 k€ en moyenne et ne fait mieux que 2 fois. C'est le moment de séparer la qualité d'une décision de son résultat, et de rappeler que la consultation est une obligation avant d'être un calcul.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les cinq pièces d'une expérimentation : un périmètre (un secteur), des volontaires, des indicateurs relevés avant, un seuil de correction écrit d'avance, un bilan présenté au CSE. Vous rappelez qu'un changement de rythme se juge aussi pour ceux qui n'en veulent pas : des postes de 7 h 30 alignés sur les relèves de 7 heures et 19 heures leur laissent leur place. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 17.5,
    etapes: [
      "Source « Comparer la trame actuelle et le projet de trame en 12 heures, relève par relève » : en 7 h 30, trois relèves par jour : à 6 h 45, 15 minutes avec 7 soignants qui arrivent ; à 13 h 45, 30 minutes avec 5 soignants ; à 21 h, 15 minutes avec 3 soignants. Chaque jour : 0,25 × 7 + 0,5 × 5 + 0,25 × 3 = 1,75 + 2,5 + 0,75 = 5 heures payées en double.",
      "En 12 heures, deux relèves : à 6 h 45, 15 minutes avec 7 soignants ; à 18 h 45, 15 minutes avec 3 soignants. Chaque jour : 0,25 × 7 + 0,25 × 3 = 2,5 heures.",
      "Sur une semaine de sept jours : 7 × 5 = 35 heures en 7 h 30, contre 7 × 2,5 = 17,5 heures en 12 heures.",
      "Heures de chevauchement économisées si toute l'unité passe en 12 heures : 35 − 17,5 = 17,5 heures par semaine. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 1 heure près, proche à 4.",
      "Pour la suite : l'unité comble ces heures par de l'intérim à 64 € l'heure, soit 17,5 × 64 = 1 120 € par semaine. Ce gain se met en regard de ce que coûteraient les erreurs de fin de poste, que seule la mesure dira.",
    ],
    erreurs: [
      {
        valeur: 2.5,
        cause: "L'économie d'une seule journée (5 − 2,5) : la question porte sur la semaine, sept jours sur sept.",
      },
      {
        valeur: 35,
        cause: "Le chevauchement total de la trame actuelle pris pour l'économie : la trame en 12 heures garde deux relèves, soit 17,5 heures.",
      },
      {
        valeur: 3.5,
        cause:
          "Les relèves comptées sans les soignants qui arrivent (la relève de 13 h 45 supprimée, 30 minutes × 7 jours) : chaque soignant qui arrive pendant une transmission est une heure payée en double.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Sept candidats sur dix demandent des postes en 12 heures : passer toute la clinique au 1er octobre fait porter l'argument du recrutement tout de suite, et le directeur le propose.",
      ceQuiLeDejoue:
        "Les études montrent des effets dont l'ampleur varie d'une équipe à l'autre, et des unités qui ont réussi en mesurant d'abord sur un secteur ; les deux autres unités n'ont rien demandé, et Hugolin Cottineau rappelle que la moitié de son équipe a des enfants en bas âge. Bénigne Vauthrin conseille de compter et d'emmener le CSE. Rejouée sur les trente tirages à la place de l'expérimentation, la généralisation à la clinique perd 20,6 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Une seule organisation pour toute l'unité, c'est plus simple à planifier, et quinze soignants sur vingt-six la veulent.",
      ceQuiLeDejoue:
        "La rencontre des deux groupes : Anthéa Galmiche partira si on le lui impose, Nuria Chaudrier demandera sa mutation, et tous disent « qu'on ne décide pas pour nous ». Sans phase d'essai, aucun indicateur n'est relevé avant, et l'on ne saura pas si les erreurs viennent de la fin des postes. Rejoué sur les trente tirages, le passage de toute l'unité perd 13,8 k€ en moyenne et ne fait mieux que 5 fois.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi: "La continuité des soins d'abord : douze heures, c'est la fatigue de fin de poste, et le débat divise l'équipe. Mieux vaut le clore.",
      ceQuiLeDejoue:
        "Térence Mabru le rappelle : trois postes vacants sont tenus en intérim, 1 120 € de plus par semaine chacun, et sept candidats sur dix demandent des 12 heures ; Nabou Cissokho a une offre en 12 heures au CHU. Les études montrent aussi qu'une relève de moins retire des erreurs de transmission. Refuser sans mesurer ferme la porte aux volontaires sans rien protéger. Rejoué sur les trente tirages, le refus perd 35,8 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Les plannings d'octobre sont prêts, le directeur préfère démarrer et faire le point en décembre : présenter un bilan au CSE paraît plus parlant qu'un projet.",
      ceQuiLeDejoue:
        "La juriste sociale du siège : la journée est plafonnée à 10 heures, un accord peut la porter à 12 après consultation du CSE, qui doit précéder la décision ; un changement mis en place sans consultation expose à un délit d'entrave, et le CSE peut voter une expertise payée à 80 % par l'employeur. Les précédents de la clinique le montrent : la cuisine en 2023, mise en place puis présentée, a coûté quatre mois de suspension et 12 000 € ; l'hôpital de jour en 2024, présenté avant, a eu un avis favorable. Rejoué sur les trente tirages, le démarrage sans consultation perd 25 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi: "Des erreurs remontent, l'équipe dit que la dernière heure est longue : au premier doute, on revient à ce qu'on connaît.",
      ceQuiLeDejoue:
        "La lecture des erreurs heure par heure dit où est le problème (après la dixième heure) et le protocole a fixé un seuil de correction à 12 % : on corrige la trame, la pause et l'heure des soins à risque, sans jeter ce qui marche (des transmissions plus complètes, une relève de moins). Rejoué sur les trente tirages à la place de la correction, l'arrêt en semaine 8 perd 29 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi: "Les candidatures arrivent : pourquoi ne pas en faire profiter les deux autres unités dès novembre, comme le propose le directeur ?",
      ceQuiLeDejoue:
        "Trois semaines de mesure ne disent pas encore ce que les 12 heures font à une autre équipe ; la fin de poste montre des pansements et des anticoagulants du soir faits par des soignants debout depuis onze heures. Hugolin Cottineau apprend l'extension par la note de service. Rejouée sur les trente tirages à la place de la correction, l'extension perd 41 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi: "Deux rythmes dans une équipe, c'est un planning refait chaque semaine et des relèves qui se croisent : revenir aux 7 h 30 pour tous rend un seul planning.",
      ceQuiLeDejoue:
        "Le compte du planning chiffre la coexistence à environ 1 400 € par semaine, et montre qu'en alignant les postes de 7 h 30 sur 7 h-14 h 30 et 11 h 30-19 h, toutes les relèves tombent à 7 heures et à 19 heures : il n'en reste que 30 %, pour 1 000 €. Anthéa et Nuria accepteraient ces horaires s'ils sont connus un mois à l'avance. Rejoué sur les trente tirages à la place de l'alignement, le retour aux 7 h 30 perd 22 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "L'expérimentation a marché dans l'unité : généraliser à toute la clinique en janvier donne un seul modèle pour recruter.",
      ceQuiLeDejoue:
        "Le bilan chiffré dit ce qui a marché dans une unité, avec des volontaires et une trame corrigée ; Hugolin Cottineau est prêt à essayer le même protocole avec son équipe, pas à se le voir imposer, et le CSE prévient qu'une généralisation est un projet important sur lequel il se réserve de voter une expertise. Rejouée sur les trente tirages à la place du bilan présenté au CSE, la généralisation perd 14,7 k€ en moyenne et fait mieux 9 fois.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi: "Le sujet divise depuis septembre : revenir aux 7 h 30 partout ferme le débat pour de bon.",
      ceQuiLeDejoue:
        "Le bilan chiffré permet de garder ce qui a fait ses preuves et de corriger le reste ; les volontaires sont déçus, deux regardent déjà les annonces du CHU, et les postes vacants resteraient à l'intérim. Rejoué sur les trente tirages à la place du bilan présenté au CSE, le retour aux 7 h 30 perd 9,7 k€ en moyenne et ne fait mieux que 3 fois.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de recrutement, d'autres une équipe à réconcilier, d'autres un danger pour les patients. Pourquoi aucune de ces lectures ne suffisait-elle à décider ? Que fallait-il savoir qu'on ne savait pas ?",
    "17,5 heures de chevauchement en moins, c'est 1 120 € d'intérim par semaine. Que faut-il mettre en face de ce gain ? Comment le mesurer sans attendre un accident ?",
    "La trame des volontaires (quatre postes d'affilée, pause quand le service le permet) était la plus attendue. Qu'est-ce que les erreurs de l'équipe de nuit et l'avis du médecin du travail disaient de la fin des postes ?",
    "Sous le tirage n° 16, démarrer sans consulter le CSE n'a presque rien coûté. Sur les trente tirages, il perd 25 k€ en moyenne. Et indépendamment du chiffre, qu'est-ce que la loi impose ?",
    "Deux rythmes dans une équipe coûtent 1 400 € par semaine. Pourquoi aligner les horaires des 7 h 30 vaut-il mieux que d'imposer un seul rythme à tous ?",
    "Sous le tirage n° 16, la généralisation au 1er octobre finit à −139,5 k€, avec un événement indésirable grave. Si ce tirage avait été clément, la décision aurait-elle été bonne ?",
    "Quelle règle gardez-vous pour changer l'organisation du travail d'une équipe ? Formulez-la en une phrase, avec les mots « mesurer » et « consulter ».",
  ],
  prolongement: {
    enonce:
      "Une unité de soins organise ses journées en trois postes : à la relève de 6 h 45, 20 minutes de transmissions avec 6 soignants qui arrivent ; à 13 h 45, 30 minutes avec 4 soignants ; à 21 h, 15 minutes avec 2 soignants. Le projet en 12 heures garde deux relèves : 6 h 45 (20 minutes, 6 soignants) et 18 h 45 (15 minutes, 2 soignants). Les heures de chevauchement sont comblées par de l'intérim à 60 € l'heure. 1) Calculez les heures de chevauchement par semaine dans chaque organisation, et l'économie. 2) Que représente cette économie sur un trimestre de 13 semaines ? 3) Un événement indésirable coûte 4 000 €. Combien d'événements de plus par trimestre les 12 heures peuvent-elles provoquer avant que l'économie soit perdue ? 4) Quels indicateurs relèveriez-vous avant et pendant une expérimentation pour le savoir ?",
    corrige:
      "1) 7 h 30 : (20/60 × 6 + 30/60 × 4 + 15/60 × 2) × 7 = (2 + 2 + 0,5) × 7 = 31,5 heures. 12 heures : (2 + 0,5) × 7 = 17,5 heures. Économie : 14 heures par semaine. 2) 14 × 60 = 840 € par semaine, soit 840 × 13 = 10 920 € par trimestre. 3) 10 920 / 4 000 ≈ 2,7 : à partir de 3 événements de plus par trimestre, l'économie est perdue. 4) Les erreurs et presque-erreurs déclarées, avec l'heure du poste ; l'absentéisme ; la part des pauses réellement prises ; les candidatures et les départs ; les heures de chevauchement réelles.",
  },
  evaluation: [
    "Les heures de chevauchement sont calculées juste, relève par relève (35 heures contre 17,5, soit 17,5 heures économisées par semaine), et traduites en euros d'intérim.",
    "Les effets positifs et négatifs des 12 heures sont identifiés à partir des sources, avec un indicateur pour chacun.",
    "La proposition retenue a la forme d'une expérimentation : périmètre, volontaires, indicateurs relevés avant, seuil de correction, bilan.",
    "Le CSE est consulté avant le démarrage, et l'élève sait dire pourquoi.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 16.",
  ],
  vigilance:
    "Les règles de droit du travail sont reprises telles que l'épisode les pose et doivent être relues par un enseignant de droit social : la durée quotidienne maximale de 10 heures portée à 12 par accord collectif, la consultation du CSE avant la décision, l'expertise votée par le CSE et sa prise en charge à 80 % par l'employeur, le délit d'entrave. Elles valent pour un établissement privé ; la fonction publique hospitalière a ses propres règles sur les postes de 12 heures, et la convention collective applicable peut ajouter des conditions (pauses, repos, majorations). Les effets des 12 heures sur les erreurs et l'absentéisme sont ceux du modèle fictif, qui s'inspire de la littérature sans la citer : à présenter comme des ordres de grandeur, pas comme des données.",
};
