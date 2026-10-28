/**
 * FICHE ENSEIGNANT · ÉPISODE 110, LE PIC DES FÊTES.
 *
 * Dimensionner les équipes pour un pic saisonnier : le besoin se compte en
 * heures de ligne, la DLC interdit de stocker le pic, et un intérimaire vaut ce
 * qu'on a préparé pour lui. Le piège : appeler l'intérim au dernier moment,
 * produire d'avance au-delà de la DLC, imposer des heures à tous.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "pic-des-fetes",
  formations: ["but-gea", "bts-gpme", "bts-sam"],
  programme: [
    "BUT GEA · Gérer l'administration du personnel",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
  ],
  notion:
    "Un pic saisonnier se prépare en heures de travail, et tôt : on compte ce qu'il faudra produire chaque semaine, on le divise par ce qu'une ligne sort vraiment en une heure, on retire ce que les équipes en place assurent déjà, et c'est ce trou qu'on comble, en combinant les leviers que le droit et les accords permettent. L'erreur classique consiste à appeler l'agence d'intérim quand les commandes sont fermes, à produire d'avance des produits frais que la DLC rend invendables, ou à imposer des heures à tous (congés refusés, samedis par note de service, six heures de plus à Noël). Dans l'épisode, Maëwenn Postec, DRH de la Laiterie de Kerbrélan, doit tenir le pic de décembre des lignes 5 et 6 de Loudéac, où les ventes de desserts doublent ; l'an dernier, 9 intérimaires sur 18 sont arrivés le 30 novembre, sans formation, et 5 sont partis avant Noël. L'élève découvre qu'il manque 130 heures de ligne par semaine au pic, soit six personnes pour chacune, qu'un pot de 28 jours de DLC doit quitter l'usine au plus 8 jours après sa fabrication, et que l'accord d'entreprise (40 heures en décembre, récupérées en janvier), les congés décalés au volontariat, une équipe de suppléance discutée avec le CSE, des intérimaires recrutés en octobre et formés, et des petites séries regroupées couvrent le pic sans heures imposées.",
  objectifs: [
    "Je calcule un besoin en heures de travail à partir d'une prévision de ventes, d'une cadence et d'un taux de rendement, et j'en retire la capacité en place.",
    "Je traduis un besoin en heures en effectif, et je combine les leviers de la capacité humaine (temps de travail, congés, week-end, intérim, organisation).",
    "Je tiens compte des contraintes du droit du travail et du dialogue social (accord collectif, avis du CSE, volontariat) dans le choix d'un levier.",
    "J'explique pourquoi la DLC d'un produit frais limite le stock d'avance, et ce que coûte un intérimaire mal préparé.",
  ],
  prerequis:
    "Les notions d'effectif, de durée du travail, d'heures supplémentaires, de travail temporaire et le rôle du CSE doivent avoir été vues en cours. Le taux de rendement synthétique, l'aménagement du temps de travail sur l'année et l'équipe de suppléance peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/pic-des-fetes?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, les heures de ligne supplémentaires nécessaires par semaine au pic de décembre et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la décision de la semaine 1 (agence fin novembre, intérimaires formés en octobre, production d'avance, intérimaires sans formation) et la façon d'ouvrir le week-end en semaine 4, où la classe se partage entre l'équipe de suppléance, la note de service et les samedis volontaires. Un binôme qui a fini tôt calcule l'âge maximal d'un pot au départ de l'usine.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir des deux sources décisives : 1 260 000 pots par semaine au pic, 4 500 pots par heure de ligne (7 200 × 62,5 %), 280 heures de ligne, moins les 150 que font les équipes en place : 130 heures. Vous faites expliquer les valeurs éloignées (25, 280, 780), puis vous faites traduire en effectif : six personnes par heure de ligne, 780 heures de travail par semaine.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 et de la semaine 8 (intérimaires partout, postes simples avec tuteur, sur le tas). Vous faites construire au tableau le plan qui comble les 130 heures : 21 heures par la modulation à 40 heures, 44 heures par week-end de suppléance, 20 heures en regroupant les petites séries, le reste par les intérimaires formés. Pour la semaine 4, vous faites lire la source du service juridique : une équipe de suppléance demande un accord ou l'autorisation de l'inspection du travail, après avis du CSE.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, où le CSE a rendu un avis favorable, « Trouver les heures tôt » laisse 593 k€ de marge sur le pic avec 98,6 % de taux de service, « L'intérim au dernier moment, les heures imposées » 352 k€ avec 76 % (et 198 000 pots refusés pour fraîcheur), « Comme chaque année » 254 k€ avec 58 % ; l'ordre est le même sous les trente tirages. Vous montrez les décisions où le hasard renverse parfois le jugement : l'avis du CSE (les samedis volontaires font mieux 9 fois sur 30) et les intérimaires mis partout (12 fois).",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle d'Efflam Jézéquel : avant de parler de stock ou d'intérim, compter les heures. Vous la déclinez : le besoin en heures, la limite que pose la DLC, les leviers négociés plutôt qu'imposés, les intérimaires recrutés tôt, formés et placés sur des postes simples, les heures regagnées par l'organisation. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 130,
    etapes: [
      "Source « Lire les prévisions de ventes de la supply chain » : 630 000 pots par semaine en octobre, 1 260 000 les semaines des 14 et 21 décembre, le double.",
      "Source « Demander à la production la fiche des lignes 5 et 6 » : 7 200 pots à l'heure en cadence nominale, un TRS de 62,5 % ; une ligne sort vraiment 7 200 × 0,625 = 4 500 pots par heure.",
      "Heures de ligne nécessaires au pic : 1 260 000 / 4 500 = 280 heures par semaine.",
      "Heures que font les équipes en place : deux lignes, deux postes, cinq jours, 7,5 heures de production par poste, soit 2 × 2 × 5 × 7,5 = 150 heures. Il manque 280 − 150 = 130 heures de ligne par semaine. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 5 heures près, proche à 20.",
      "En effectif : une ligne en marche mobilise six personnes, soit 130 × 6 = 780 heures de travail par semaine à trouver. Une heure de ligne qui manque au pic coûte 4 500 pots × (0,11 € de marge + 0,051 € de pénalité), environ 725 €.",
    ],
    erreurs: [
      {
        valeur: 25,
        cause:
          "La cadence nominale prise sans le TRS (1 260 000 / 7 200 = 175 heures, moins 150) : une ligne ne sort pas 7 200 pots par heure, elle en sort 4 500.",
      },
      {
        valeur: 280,
        cause:
          "Le besoin total en heures de ligne donné à la place du besoin supplémentaire : les 150 heures que font déjà les équipes en place ne sont pas retirées.",
      },
      {
        valeur: 780,
        cause:
          "Les heures de travail des personnes (130 × 6) données à la place des heures de ligne : c'est l'étape suivante du calcul, pas la réponse.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "C'est ce qu'on fait chaque année : on ne paie rien avant décembre, et l'on commande quand les commandes des enseignes sont fermes.",
      ceQuiLeDejoue:
        "Le bilan de l'intérim de l'an dernier le dit : appelée le 26 novembre pour 18 intérimaires, l'agence en a envoyé 9, sans formation, et 5 étaient partis avant Noël ; Trévélo Intérim prévenait qu'en décembre tout le bassin recrute. Commandés début octobre, dix intérimaires arrivent presque tous et sont formés deux semaines, pour 3 500 € de formation et 9 800 € par semaine. Rejoué sur les trente tirages à la place de cette commande, l'appel de fin novembre perd 43 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Les lignes ont de la marge en octobre : faire tourner le samedi et remplir les chambres froides, c'est autant de moins à produire en décembre.",
      ceQuiLeDejoue:
        "Ysée Bescond le dit dès la semaine 1 : 28 jours de DLC, les deux tiers exigés à réception et une journée de transport, un pot doit quitter l'usine au plus 8 jours après sa fabrication. Un pot fait le 31 octobre ne peut pas partir le 14 décembre : refusé, il se vend 0,08 € à un soldeur après avoir coûté 0,23 €. Rejoué sur les trente tirages à la place des intérimaires formés, produire d'avance perd 114 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Tout le monde présent à Noël, plus 15 heures de ligne par semaine : c'est le moyen le plus sûr d'avoir les bras.",
      ceQuiLeDejoue:
        "L'accord d'entreprise de 2021 permet 40 heures en décembre sans majoration, récupérées en janvier, soit 21 heures de ligne par semaine ; six salariés sur huit décaleraient leurs congés contre 200 € et la garantie du 24 ou du 31. Paterne Allanic prévient que refuser tous les congés sera vécu comme une punition, et il y a deux ans les ponts supprimés ont fait des arrêts maladie la semaine même. Rejoué sur les trente tirages à la place de l'accord, le refus des congés perd 52 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Une note de service ne demande pas d'attendre le CSE : un samedi sur deux pour tous, c'est simple et rapide.",
      ceQuiLeDejoue:
        "Paterne Allanic le dit : « Par note de service, ce sera non, et on écrira à l'inspection du travail. » Une équipe de suppléance au volontariat, discutée avec le CSE, donne 44 heures de ligne par week-end, le double d'un samedi ; associé tôt, le CSE rend un avis favorable environ trois fois sur quatre. Rejoué sur les trente tirages à la place de la suppléance, le samedi imposé perd 27 k€ en moyenne, et ne fait mieux que 3 fois, quand le CSE refuse.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Trois semaines d'avance chez Kerfroid, et l'on est tranquille jusqu'au 10 décembre, comme le propose Gurvan Kerebel.",
      ceQuiLeDejoue:
        "Annaïg Le Dantec le rappelle : un pot fabriqué le 16 novembre doit partir au plus tard le 24, et Celtis a refusé l'an dernier deux camions à 17 jours de DLC restante. La chambre froide de l'usine garde 300 000 pots, une semaine d'avance ; au-delà, on paie la location et l'on produit des pots qui seront refusés. Rejoué sur les trente tirages à la place d'une semaine d'avance, trois semaines perdent 48 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Les enseignes confirment 1 260 000 pots pour Noël : six heures de plus pour tous jusqu'au 24, c'est 28 heures de ligne par semaine.",
      ceQuiLeDejoue:
        "Erwann Tromeur montre où partent les heures : 24 changements de format par semaine, 75 minutes chacun, pour quatorze petites références qui ne font que 9 % des volumes ; produites en deux campagnes, huit changements suffisent, et 20 heures de ligne reviennent sans un euro. Naïm Lefeuvre ajoute que servir d'abord les commandes sous pénalité en évite deux sur cinq, et Tahar Héliès que six heures de plus, deux semaines de suite après le début du pic, « c'est le scénario des accidents de fin d'année ». Rejoué sur les trente tirages à la place du regroupement, imposer les heures perd 14 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de stock, d'autres de fidélisation des intérimaires ou de TRS. Qu'est-ce qui, dans les prévisions et la fiche des lignes, montrait que c'étaient des heures à trouver, et tôt ?",
    "Pourquoi la DLC de 28 jours limite-t-elle l'avance à une semaine ? Faites le calcul des 8 jours, et dites ce qu'il advient d'un pot fait en octobre.",
    "40 heures en décembre par l'accord de 2021, ou 15 heures supplémentaires majorées : quelle différence pour l'entreprise, et pour les salariés ? Pourquoi le décalage des congés au volontariat marche-t-il mieux que le refus ?",
    "L'équipe de suppléance demande l'avis du CSE, et il peut être défavorable. Sur les trente tirages, les samedis volontaires font mieux 9 fois. La suppléance restait-elle le bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Un intérimaire non formé sur la thermoformeuse ou à la préparation des mix a trois fois plus d'accidents qu'un salarié formé. Pourquoi des postes simples et un tuteur pour quatre les font-ils aussi rester ?",
    "Regrouper les petites références rend 20 heures de ligne par semaine sans coût. Pourquoi cette réponse vient-elle si rarement avant les heures imposées ?",
    "Quelle règle gardez-vous pour préparer un pic d'activité ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une biscuiterie vend 900 000 paquets par semaine au pic de Noël. Ses trois lignes ont une cadence nominale de 6 000 paquets à l'heure et un TRS de 60 % ; elles tournent en deux postes, cinq jours, avec 7 heures de production par poste, et chaque ligne en marche mobilise cinq personnes. 1) Combien d'heures de ligne faut-il au pic, et combien en manque-t-il ? Combien d'heures de travail cela représente-t-il ? 2) Un accord permet de passer à 39 heures au lieu de 35 en décembre, récupérées en janvier : combien d'heures de ligne cela donne-t-il ? 3) Regrouper les petites séries ramène les changements de format de 12 à 4 par semaine, à une heure chacun : combien d'heures regagne-t-on ? 4) Combien reste-t-il à trouver, et que coûterait de ne pas les trouver, si une heure de ligne manquante fait perdre 0,12 € de marge et 0,05 € de pénalité par paquet ? 5) Les paquets ont une DLC de 21 jours, les enseignes en exigent les deux tiers, et le transport prend un jour : combien de jours au plus un paquet peut-il attendre à l'usine ?",
    corrige:
      "1) Cadence réelle : 6 000 × 0,60 = 3 600 paquets par heure ; besoin : 900 000 / 3 600 = 250 heures de ligne ; en place : 3 × 2 × 5 × 7 = 210 heures ; il en manque 40, soit 40 × 5 = 200 heures de travail par semaine. 2) 210 × (39 / 35 − 1) = 210 × 4 / 35 = 24 heures de ligne. 3) (12 − 4) × 1 = 8 heures. 4) 40 − 24 − 8 = 8 heures de ligne ; une heure manquante coûte 3 600 × (0,12 + 0,05) = 612 €, soit 8 × 612 = 4 896 € par semaine. 5) Il faut livrer avec au moins 21 × 2/3 = 14 jours de DLC : 21 − 14 = 7 jours, moins un jour de transport, soit 6 jours au plus à l'usine.",
  },
  evaluation: [
    "Le besoin du pic est calculé juste (1 260 000 / 4 500 − 150 = 130 heures de ligne) à partir des sources nommées, et traduit en effectif.",
    "Le plan qui comble le besoin combine plusieurs leviers chiffrés (modulation, congés décalés, week-end, intérim, regroupement des séries) et en fait la somme.",
    "Chaque levier sur le temps de travail est justifié par sa base (l'accord d'entreprise, l'avis du CSE, le volontariat) et non imposé par note de service.",
    "La DLC est prise en compte dans le stock d'avance (au plus 8 jours), et l'intérim est préparé : commandé tôt, formé, placé sur des postes simples.",
    "L'élève distingue, sur la décision de la semaine 4, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Plusieurs règles du droit du travail sont posées par l'épisode et doivent être relues par un enseignant de la discipline avant d'être énoncées : l'aménagement du temps de travail sur une période supérieure à la semaine par accord collectif, l'équipe de suppléance (accord ou autorisation de l'inspection du travail, majoration d'au moins 50 %), le contingent annuel d'heures supplémentaires, les délais de modification des dates de congés payés, et la formation renforcée à la sécurité due aux intérimaires affectés à des postes à risques particuliers. L'épisode les simplifie pour le jeu.",
};
