/**
 * FICHE ENSEIGNANT · ÉPISODE 90, LE DOSSIER DE SOINS QUE PERSONNE NE REMPLIT.
 *
 * Un système d'information ne sert que s'il est là où se fait le travail :
 * des tablettes au chariot, des plans de soins écrits avec les équipes, des
 * référents. Le piège est d'obliger et de contrôler, de former en salle, ou
 * de revenir au papier après la première erreur.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "dossier-de-soins",
  formations: ["stmg", "bts-sam", "dcg"],
  programme: [
    "STMG · Terminale, systèmes d'information de gestion, Thème 1 · Organisation et numérisation",
    "BTS SAM · Bloc 1, Optimisation des processus administratifs",
    "DCG · UE 8, Système d'information de gestion",
  ],
  notion:
    "Un outil numérique qu'on n'utilise pas n'est pas d'abord un problème de volonté : c'est un outil qui n'est pas là où se fait le travail, ou qui ne décrit pas le travail réel. L'erreur classique consiste à rendre la saisie obligatoire et à la faire contrôler, à reformer tout le monde en salle, ou à revenir au papier dès qu'un incident survient. Dans l'épisode, Carnéo, le dossier de soins informatisé de l'Association Solvanne, marche dans trois EHPAD et pas à Beaune, Chalon-sur-Saône et Montbard : 10 % des transmissions y sont saisies au moment du soin, la tablette de l'étage est fixée au mur du poste de soins, celle de nuit dort dans un tiroir, le Wi-Fi ne passe pas au deuxième étage de Montbard, et dix-sept plans de soins sur vingt sont le plan type du déploiement (« toilette complète à 7 h » pour tous, aucun change de nuit). Les soignants notent sur papier pendant le tour et recopient en fin de poste : la moitié des 420 postes de la semaine y passent vingt minutes, soit 70 heures de recopie par semaine. L'élève découvre que le temps se gagne en mettant les tablettes sur les chariots, en refaisant les plans avec chaque équipe, en formant des référents de jour et de nuit, en retirant le cahier papier pour n'avoir qu'un support, et en donnant à chaque remplaçant un accès nominatif.",
  objectifs: [
    "Je mesure le coût d'un double support (papier puis saisie) en heures et en euros, à partir des journaux de connexion et des plannings.",
    "Je distingue un défaut d'usage qui vient de l'organisation (où est l'outil, ce qu'il décrit) d'un défaut de formation ou de volonté.",
    "Je choisis un mode d'accompagnement du changement (référents, formation en salle, contrôle) d'après ce qui a marché ailleurs.",
    "Je justifie l'accès nominatif à un dossier de données de santé et je dis ce qu'un compte partagé empêche.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de système d'information, de processus, de double saisie et de traçabilité doivent être connues ; une multiplication suffit pour le calcul. Ce qu'est un dossier de soins et une transmission entre équipes peut être présenté en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/dossier-de-soins?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous lisez le message de Ndeye Quillardet (« on écrit dans le cahier en redescendant ») et la proposition du directeur de Montbard (une saisie obligatoire, contrôlée chaque jour), et vous demandez de noter sur papier les heures de recopie calculées en semaine 1, avec leur calcul, et le plan présenté vendredi.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le plan de la semaine 1 (obligation, tablettes au chariot, module de saisie rapide, attente), la règle fixée après le pansement non refait (semaine 7) et l'été des remplaçants (semaine 11), où la classe se partage. Un binôme qui a fini tôt calcule ce que coûtent les heures de recopie sur un an.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les heures relevées, puis vous refaites le calcul avec la classe à partir de deux sources : les plannings (60 postes de soignants par jour dans les trois EHPAD, sept jours sur sept) et les journaux de connexion (la moitié des postes recopient, vingt minutes chacun). Vous faites expliquer les valeurs éloignées (10, 140 ou 42 heures). Vous terminez par le coût : 70 heures à 30 € font 2 100 € par semaine, plus de 27 k€ sur le trimestre.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 7 et de la semaine 11. Pour la semaine 1, faites lire la réaction de la cadre de Beaune au contrôle quotidien : des saisies à 13 h 45 et 20 h 50, toutes « RAS, résident calme ». Pour la semaine 7, faites relire l'analyse de l'événement : le soin modifié était sur papier à 10 h 15 et dans Carnéo à 20 h 50, deux supports et aucun complet. Pour la semaine 11, faites lire l'avis du délégué à la protection des données sur le compte partagé.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Mettre l'outil dans le travail réel » finit à 22 k€ de gain net, « Obliger, puis revenir au papier » à 20,6 k€ de perte et « Attentiste » à 30,5 k€ de perte. Vous faites lire deux décisions où le hasard compte : retirer le cahier un EHPAD après l'autre fait mieux 12 fois sur 30 que la bascule simultanée et perd 1,4 k€ en moyenne, et le compte partagé de l'été fait mieux 18 fois, mais perd 2,3 k€ en moyenne parce qu'une transmission contestée ne peut plus être attribuée. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau trois questions à poser avant d'accuser une équipe de ne pas utiliser un outil : où est l'outil au moment du travail ? décrit-il le travail réel ? qui aide sur place ? Vous rappelez que deux supports valent moins qu'un, et que la traçabilité d'un dossier de soins exige que chacun signe ce qu'il écrit. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 70,
    etapes: [
      "Source « Demander aux cadres le planning type des trois EHPAD » : 21 postes de soignants par jour à Beaune, 22 à Chalon-sur-Saône et 17 à Montbard, matin, après-midi et nuit compris, sept jours sur sept : 60 postes par jour, soit 60 × 7 = 420 postes par semaine.",
      "Source « Extraire les journaux de connexion de Carnéo » : la moitié des postes ouvrent Carnéo en fin de poste pour une session de 20 minutes en moyenne, pour y recopier ce qu'ils ont écrit sur papier. 420 × 0,5 = 210 postes recopient chaque semaine.",
      "Heures de recopie par semaine : 210 × 20 / 60 = 70 heures. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 5 heures près, proche à 15.",
      "Pour la suite : à 30 € l'heure de soignant (même source des plannings), 70 × 30 = 2 100 € par semaine, soit 27 300 € sur les treize semaines du trimestre. Les six minutes de lecture du cahier puis de l'écran à chaque relève s'y ajoutent.",
    ],
    erreurs: [
      {
        valeur: 10,
        cause: "Un seul jour compté (60 × 0,5 × 20 / 60) : la question porte sur la semaine, sept jours sur sept.",
      },
      {
        valeur: 140,
        cause: "Tous les postes comptés comme recopiant (420 × 20 / 60) : la moitié seulement recopie ; 40 % n'ouvrent pas Carnéo et 10 % saisissent au moment du soin.",
      },
      {
        valeur: 42,
        cause: "Les six minutes de lecture du cahier puis de l'écran à chaque relève (420 × 6 / 60) prises pour la recopie : c'est un autre temps perdu, pas celui qu'on demande.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le directeur de Montbard le demande : les équipes disent que Carnéo leur prend du temps, il faut une règle et des cadres qui contrôlent chaque jour.",
      ceQuiLeDejoue:
        "Les journaux de connexion montrent que les soignants ouvrent Carnéo en fin de poste pour recopier, et qu'aucune connexion n'a lieu la nuit à Beaune et à Chalon ; le tour de soins à Chalon montre la tablette fixée au mur et des plans de soins où le soin n'existe pas. Obliger fait recopier davantage : la cadre de Beaune trouve des saisies à 13 h 45 et 20 h 50, presque toutes « RAS, résident calme ». Rejouée sur les trente tirages à la place des tablettes au chariot, l'obligation perd 57 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Les directeurs disent que les équipes ont besoin d'être accompagnées : personne ne connaît mieux l'outil que le formateur de l'éditeur.",
      ceQuiLeDejoue:
        "Edmée Faucompré raconte ce qui a marché à Montchapet : deux référents, de jour et de nuit, formés deux jours, avec deux heures par semaine pour aider les collègues au chariot ; l'usage a triplé en six semaines. La journée de formation en salle de l'automne n'avait donné que trois points, partis un mois plus tard. Fleur Mabillot le dit : on sait où cliquer, ce qui manque, c'est de pouvoir le faire dans le couloir. Rejouée sur les trente tirages à la place des référents, la formation par l'éditeur perd 25 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Un pansement n'a pas été refait pendant deux jours : revenir au papier, c'est un seul support, celui que tout le monde connaît.",
      ceQuiLeDejoue:
        "L'analyse de l'événement montre que la cause est le double support : le soin modifié était sur papier à 10 h 15 et dans Carnéo à 20 h 50, l'équipe du matin écrivait dans l'un, celle de l'après-midi lisait l'autre ; dans les EHPAD qui ont retiré le cahier, ce type d'événement est devenu rare. La convention de l'ARS expose à la reprise des crédits non reconductibles en cas d'abandon, une fois sur deux ces dernières années. Rejoué sur les trente tirages à la place du retrait du cahier, le retour au papier perd 35,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Un poste sur cinq tenu par un remplaçant sans compte : suspendre Carnéo l'été et reprendre en septembre paraît plus simple, propose le directeur de Montbard.",
      ceQuiLeDejoue:
        "Les Grésilles racontent l'été dernier : les remplaçants écrivaient sur papier, les titulaires recopiaient, et l'usage a perdu un cinquième en août. Créer un compte nominatif prend dix minutes, une demi-heure d'accueil au chariot suffit, et le délégué à la protection des données rappelle que chaque accès doit être nominatif. Suspendre l'été, c'est revenir au double support et tout relancer en septembre. Rejouée sur les trente tirages à la place des comptes nominatifs, la suspension perd 25 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu des équipes qui résistent, d'autres une formation ratée, d'autres un outil mal placé. Qu'est-ce que les journaux de connexion, heure par heure, montraient que le nombre de connexions par soignant ne montrait pas ?",
    "70 heures de recopie par semaine, c'est 2 100 €. Combien de temps faut-il pour que les tablettes durcies, les téléphones de nuit et les bornes Wi-Fi soient payés par le temps gagné ? Qu'est-ce que ce calcul ne compte pas ?",
    "Dix-sept plans de soins sur vingt disent « toilette complète à 7 h » pour tous. Pourquoi des plans faux font-ils revenir les soignants à la feuille, même avec une tablette au chariot ? Pourquoi les refaire avec les équipes, et pas par l'éditeur ?",
    "Après le pansement non refait, revenir au papier paraissait prudent. Qu'est-ce qui, dans l'analyse de l'événement, montrait que le danger venait d'avoir deux supports ?",
    "Retirer le cahier dans les trois EHPAD en même temps ou l'un après l'autre : sur les trente tirages, la bascule progressive fait mieux 12 fois. Laquelle choisissez-vous, et sur quel critère ?",
    "Le compte partagé de l'été fait mieux 18 fois sur 30 et perd 2,3 k€ en moyenne. Pourquoi l'accès nominatif reste-t-il une obligation, même quand le compte partagé coûte moins cher la plupart du temps ?",
    "Quelle règle gardez-vous avant de reprocher à une équipe de ne pas utiliser un outil ? Formulez-la en une phrase.",
  ],
  prolongement: {
    enonce:
      "Une résidence a 30 postes de soignants par jour, sept jours sur sept. 60 % des postes recopient en fin de poste, dans le logiciel, ce qu'ils ont noté sur papier, pendant 15 minutes en moyenne. Une heure de soignant coûte 30 €. 1) Combien d'heures de recopie par semaine, et combien d'euros ? 2) Des tablettes sur les chariots coûtent 9 000 € ; avec elles, 10 % seulement des postes recopient encore, toujours 15 minutes. Combien d'heures et d'euros gagne-t-on par semaine ? 3) En combien de semaines les tablettes sont-elles payées par le temps gagné ? 4) Citez deux conditions, tirées de l'épisode, sans lesquelles les tablettes ne feraient pas baisser la recopie.",
    corrige:
      "1) 30 × 7 = 210 postes par semaine ; 210 × 0,6 = 126 postes recopient ; 126 × 15 / 60 = 31,5 heures, soit 31,5 × 30 = 945 € par semaine. 2) 210 × 0,1 × 15 / 60 = 5,25 heures restent ; on gagne 31,5 − 5,25 = 26,25 heures, soit 787,50 € par semaine. 3) 9 000 / 787,50 ≈ 11,4 semaines, soit 12 semaines. 4) Des plans de soins qui décrivent les soins réellement faits, refaits avec les équipes ; un seul support, le cahier papier retiré ; des référents de jour et de nuit pour aider au chariot ; un réseau qui passe partout (une seule de ces conditions suffit par réponse).",
  },
  evaluation: [
    "Les heures de recopie sont calculées juste (420 postes, la moitié, 20 minutes : 70 heures par semaine), avec les deux sources nommées, et traduites en euros.",
    "Le diagnostic s'appuie sur l'observation du travail réel (où est la tablette, ce que disent les plans de soins), et non sur la volonté des équipes.",
    "Le mode d'accompagnement retenu est justifié par ce qui a marché dans les EHPAD où l'outil fonctionne.",
    "La décision après l'événement indésirable s'appuie sur son analyse (deux supports) et vise un seul support.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12, en nommant l'obligation d'accès nominatif.",
  ],
  vigilance:
    "L'accès au dossier de soins relève des règles de protection des données de santé (accès nominatif, traçabilité, secret partagé entre professionnels) : l'avis du délégué à la protection des données est repris tel que l'épisode le pose, et un enseignant voudra rappeler le cadre du RGPD et du code de la santé publique sans entrer dans un détail que l'épisode ne vérifie pas. Le plan bleu, la veille saisonnière canicule à partir du 1er juin, l'évaluation de la qualité des établissements et la reprise des crédits non reconductibles par l'ARS sont présentés de façon simplifiée. Les soins cités (pansements, changes, hydratation) sont des situations du jeu, pas des consignes de soin.",
};
