/**
 * FICHE ENSEIGNANT · ÉPISODE 108, LA LIGNE QUI S'ARRÊTE QUAND IL MANQUE QUELQU'UN.
 *
 * Développer la polyvalence d'une équipe : un savoir-faire critique se
 * transmet en binôme, sur la ligne, pendant le creux, et se reconnaît. Le
 * piège : acheter des heures (heures supplémentaires, intérim) ou attendre le
 * départ en retraite pour recruter.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "polyvalence-des-operateurs",
  formations: ["stmg", "bts-sam", "but-gea"],
  programme: [
    "STMG · Terminale, ressources humaines et communication, Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
    "BUT GEA · Gérer le développement des ressources humaines",
  ],
  notion:
    "Quand un savoir-faire critique tient à quelques personnes, chaque absence se paie tout de suite, et un départ se paie pour des années. La polyvalence se construit : on repère qui peut apprendre (la matrice de polyvalence), on transmet en binôme sur la ligne, au moment où la charge le permet, on écrit les standards qui raccourcissent l'apprentissage, on habilite et on reconnaît ceux qui tiennent deux postes. L'erreur classique consiste à acheter des heures (les experts en heures supplémentaires, un intérimaire « qui connaît la machine ») ou à attendre le départ en retraite pour recruter. Dans l'épisode, Erwann Tromeur, chef de l'atelier de conditionnement de la Laiterie de Kerbrélan, n'a que trois conducteurs sur vingt-deux capables de régler la thermoformeuse de la ligne 5, un par poste ; l'hiver dernier, ils ont manqué 12 % de leurs heures, et Yvonnick Gouriou part à la retraite fin juin. L'élève découvre que ces absences font perdre 117 heures de production par trimestre d'hiver, environ 111 k€ à 950 € l'heure, que deux binômes lancés pendant le creux de janvier coûtent bien moins, que des standards visuels font passer la formation de 10 à 7 semaines, et qu'un échelon de 95 € par mois retient les stagiaires quand une prime aux seuls experts récompense la dépendance.",
  objectifs: [
    "Je lis une matrice de polyvalence et j'y repère les postes qui ne tiennent qu'à quelques personnes.",
    "Je chiffre ce que coûtent les absences sur un poste critique, en heures et en euros.",
    "Je construis un plan de transmission (binômes, standards écrits, habilitation) et je justifie le moment où le lancer.",
    "Je distingue une mesure qui reconnaît la polyvalence d'une mesure qui récompense la dépendance.",
  ],
  prerequis:
    "Les notions de compétence, de qualification, de formation et de rémunération doivent avoir été vues en cours. La matrice de polyvalence, le tutorat en binôme et l'habilitation peuvent être découverts pendant la séance ; le calcul d'une marge suffit pour lire le bilan.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/polyvalence-des-operateurs?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, les heures de production que la ligne 5 perd en un trimestre d'hiver faute de conducteur qualifié, et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la décision de la semaine 1 (heures supplémentaires, binômes, intérim, attendre) et la réponse à l'arrêt d'Ursuline Cloarec en semaine 6, où la classe se partage souvent. Un binôme qui a fini tôt calcule ce que coûte l'échelon « conducteur polyvalent » sur un trimestre, et ce que vaut au printemps un conducteur de plus capable de régler la ligne.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir du relevé des absences : 3 postes × 40 heures × 13 semaines = 1 560 heures planifiées, dont 12 % d'absence, soit 187,2 heures sans expert ; trois postes sur quatre à mi-cadence, le quatrième à l'arrêt, soit 62,5 % de l'heure perdue : 117 heures. Vous faites expliquer les valeurs éloignées (187, 94, 78), puis vous traduisez : à 950 € l'heure, environ 111 k€.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (prime aux experts, report, échelon) et de la semaine 6. Pour la semaine 1, vous faites lire la matrice : Arthaud Bourdonnec et Zainab Ollitrault sont déjà au niveau 3 sur la 5, et janvier est creux (102 heures de ligne contre 117 en mars). Pour la semaine 6, vous faites comparer les heures supplémentaires d'Yvonnick et de Sidoine, déjà au maximum, au stagiaire le plus avancé avec les standards au poste.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Le résultat est un coût : on juge qui perd le moins. Sous le tirage n° 12, « Transmettre pendant le creux » coûte 19 k€, « Heures sup et recrutement » 138 k€, l'attentisme 154 k€ ; sur les trente tirages, 32 k€ contre 149 et 134 k€ en moyenne, et la première finit même positive 9 fois. Vous faites remarquer qu'acheter des heures fait en moyenne moins bien que ne rien faire, et vous montrez la décision où le hasard compte le plus : la réponse à l'arrêt d'Ursuline, qui dépend de l'avancée des stagiaires.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de Gurvan Kerebel : avant d'acheter des heures, regarder qui pourrait apprendre, et quand. Vous la déclinez en cinq gestes : la matrice, les binômes dans le creux, les standards écrits avec la qualité, l'habilitation, la reconnaissance dans la classification. Vous rappelez qu'aucun de ces gestes ne touche à la sécurité des aliments : un défaut de scellage est toujours bloqué et détruit. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 117,
    etapes: [
      "Source « Relever les absences et les arrêts de la ligne 5 sur un an » : la ligne tourne en 3×8 du lundi au vendredi, trois postes de 40 heures par semaine ; sur un trimestre de 13 semaines, les trois experts ont 3 × 40 × 13 = 1 560 heures planifiées.",
      "Même source : l'hiver dernier, ils ont manqué 12 % de leurs heures planifiées : 1 560 × 0,12 = 187,2 heures sans conducteur qualifié.",
      "Ce que perd une heure sans expert : trois postes sur quatre, la ligne tourne à mi-cadence (la moitié de l'heure perdue) ; le quatrième, un changement de format tombe sur le poste et la ligne s'arrête (toute l'heure perdue). Part perdue : 0,75 × 0,5 + 0,25 × 1 = 0,625.",
      "Heures de production perdues : 187,2 × 0,625 = 117 heures par trimestre d'hiver. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 6 heures près, proche à 20.",
      "En euros : une heure qui manque coûte 640 € de marge sur coût variable (8 000 pots à 0,08 €) et 310 € de pénalités, soit 950 € ; 117 heures coûtent environ 111 k€. Au printemps, à 8 % d'absence, ce seraient 78 heures, 74 k€.",
    ],
    erreurs: [
      {
        valeur: 187,
        cause:
          "Toutes les heures d'absence comptées comme perdues (1 560 × 12 %) : trois fois sur quatre, la ligne tourne encore à mi-cadence.",
      },
      {
        valeur: 94,
        cause:
          "La mi-cadence appliquée à toutes les heures d'absence (187,2 × 0,5) : l'arrêt du quatrième poste, quand un changement de format tombe, est oublié.",
      },
      {
        valeur: 78,
        cause:
          "Le taux d'absence du printemps (8 %) pris à la place de celui de l'hiver (12 %) : la question porte sur un trimestre d'hiver.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Les trois experts savent faire, tout de suite : des heures supplémentaires et des samedis rattrapent la production sans rien réorganiser.",
      ceQuiLeDejoue:
        "Sidoine Toularastel le dit dès la semaine 1 : « ça fait trois ans que c'est pour dépanner ». Chaque heure rattrapée coûte 180 € en heures majorées, plus 1 500 € par samedi ouvert, et la fatigue revient en absences, en défauts de scellage et en risque de départ. Rien ne change pour l'été : Yvonnick part fin juin. Rejouées sur les trente tirages à la place des binômes, les heures supplémentaires perdent 91 k€ en moyenne et ne font mieux qu'une fois.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Un intérimaire qui connaît les thermoformeuses, c'est un expert de plus sans former personne.",
      ceQuiLeDejoue:
        "Casimir Rospabé, de Kerlann Intérim, n'en trouve qu'une fois sur deux à cette saison, à 1 900 € la semaine, et pas avant la semaine 4 ; il aura conduit d'autres machines, sur d'autres formats. Annaïg Le Dantec se souvient de l'intérimaire de la ligne 2 : deux lots bloqués en un mois, et parti à la fin de sa mission. Rejoué sur les trente tirages à la place des binômes, l'intérim perd 95 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Yvonnick ne part qu'en juin : on recrutera son remplaçant au printemps, et d'ici là on fait avec les trois experts.",
      ceQuiLeDejoue:
        "Ysée Bescond l'écrit : janvier est creux (102 heures de ligne par semaine), mars ne l'est pas (117), et rien ne se produit d'avance avec trente jours de DLC. Gurvan Kerebel ajoute : « Janvier est creux ; mars ne le sera pas. » Un conducteur devient autonome en une dizaine de semaines de binôme : commencé au printemps, il ne sera pas prêt pour l'été. Rejoué sur les trente tirages à la place des binômes, attendre perd 96 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Yvonnick et Sidoine savent tenir la ligne : les faire monter à 48 heures couvre l'après-midi sans risque pour la qualité.",
      ceQuiLeDejoue:
        "Les 48 heures sont le maximum légal d'une semaine, et la moyenne de 44 heures sur douze semaines s'applique aussi, heures déjà faites depuis janvier comprises. Le relevé de l'an dernier montre que sept défauts de scellage sur dix sont survenus après la neuvième heure de travail ou sur un changement de format fait par quelqu'un qui ne le faisait pas d'habitude. Le stagiaire le plus avancé, avec les standards au poste et Yvonnick joignable, coûte 1 120 € de remplaçant par semaine. Rejoué sur les trente tirages à la place du stagiaire, le passage à 48 heures perd 16 k€ en moyenne et ne fait mieux que 7 fois.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Mars est le mois des promotions de Celtis : un samedi de rattrapage chaque semaine sécurise le taux de service, et Gurvan les signe.",
      ceQuiLeDejoue:
        "Un samedi ouvert coûte 1 500 € avant la première heure produite (nettoyage en place, énergie, un cariste, un laborantin), et Sidoine prévient qu'on lui a proposé un poste de jour ailleurs. La source des compteurs montre ce qui fait perdre des heures : un changement de format sur quatre tombe sur un poste sans personne pour le faire. Les regrouper sur les postes où un qualifié est présent, faits par les stagiaires sous son contrôle, ne coûte rien. Rejoués sur les trente tirages à la place de cette organisation, les samedis perdent 9 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Yvonnick part : il faut le remplacer par quelqu'un d'expérimenté, comme on remplace tout départ.",
      ceQuiLeDejoue:
        "Maëwenn Postec le dit : un cabinet coûte 6 500 €, quatre mois, et moins d'une chance sur deux de trouver un conducteur de thermoformeuse dans le centre Bretagne avant juin ; s'il vient, il arrive en juin et doit apprendre les formats. Habiliter les stagiaires coûte 1 200 € chacun, et un conducteur de plus capable de régler la ligne évite 88 % des 74 k€ d'heures perdues du printemps. Rejoué sur les trente tirages à la place de l'habilitation, le recrutement perd 9 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème d'absences, d'autres un manque d'effectif ou une machine trop difficile. Qu'est-ce qui, dans la matrice de polyvalence et le relevé des absences, montrait que la ligne dépendait de trois personnes ?",
    "Pourquoi lancer les binômes en janvier plutôt qu'en mars ? Qu'est-ce que le creux du plan absorbe, que la pleine saison n'absorbe pas ?",
    "Les standards visuels écrits avec la qualité font passer la formation de 10 à 7 semaines et divisent les défauts de scellage par deux à Pontivy. Pourquoi verrouiller les consignes, que proposait la qualité, protège-t-il aujourd'hui et fige-t-il la dépendance ?",
    "Une prime de 500 € aux trois experts ou un échelon de 95 € par mois pour qui tient deux lignes : laquelle des deux reconnaît la polyvalence ? Que dit Dorine Tanniou de ce qu'on retient au vestiaire ?",
    "Sur les trente tirages, faire monter les experts à 48 heures pendant l'arrêt d'Ursuline fait mieux que le stagiaire 7 fois : quand, et pourquoi ? Le stagiaire restait-il le bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Mettre le stagiaire le plus avancé seul la nuit, sans habilitation, ne coûte rien. Pourquoi est-ce pourtant exclu, et que dit Annaïg Le Dantec ?",
    "Quelle règle gardez-vous pour un poste qui ne tient qu'à quelques personnes ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Sur une ligne de fromage râpé, deux postes de 38 heures par semaine, seuls deux conducteurs savent régler l'ensacheuse. L'hiver, ils manquent 10 % de leurs heures planifiées ; sans eux, 60 % de l'heure est perdue en moyenne. Une heure de production perdue coûte 800 €. 1) Calculez les heures perdues sur un trimestre de 13 semaines, et leur coût. 2) Option A : couvrir les absences par les deux experts en heures supplémentaires, à 180 € l'heure de ligne rattrapée, avec six samedis ouverts à 1 500 € chacun. Combien coûte-t-elle par trimestre ? 3) Option B : former un troisième conducteur en binôme pendant dix semaines, avec un remplaçant à 500 € par semaine sur sa ligne d'origine ; au trimestre suivant, où les absences tombent à 8 %, il évite 85 % des heures perdues. Combien coûte la formation, et combien évite-t-elle au trimestre suivant ? 4) Laquelle recommandez-vous, et pourquoi ?",
    corrige:
      "1) Heures planifiées : 2 × 38 × 13 = 988 ; absences : 988 × 10 % = 98,8 heures ; heures perdues : 98,8 × 60 % ≈ 59,3 heures ; coût : 59,28 × 800 ≈ 47 424 €. 2) 59,28 × 180 ≈ 10 670 € et 6 × 1 500 = 9 000 €, soit environ 19 670 € par trimestre, à refaire chaque trimestre, avec la fatigue en plus. 3) Formation : 10 × 500 = 5 000 €, une fois. Trimestre suivant : 988 × 8 % × 60 % ≈ 47,4 heures, 37 939 € ; 85 % évités, environ 32 248 €. 4) L'option B : elle coûte 5 000 € une fois, contre environ 19 670 € pour chaque trimestre d'heures supplémentaires, elle évite plus de 32 000 € dès le trimestre suivant, et elle réduit la dépendance au lieu de l'entretenir.",
  },
  evaluation: [
    "Les heures perdues sont calculées juste (1 560 × 12 % × 62,5 % = 117 heures) à partir de la source nommée, et traduites en euros.",
    "Le plan de transmission est construit (qui, avec qui, quand) à partir de la matrice de polyvalence, et le choix de janvier est justifié par la charge.",
    "Les standards, l'habilitation et la reconnaissance sont reliés à ce qu'ils changent : la durée de formation, les défauts de scellage, l'abandon des binômes.",
    "Les heures supplémentaires sont jugées sur leur coût, leurs limites légales et leurs effets différés (fatigue, défauts, départ), pas sur la production rattrapée tout de suite.",
    "L'élève distingue, sur la décision de la semaine 6, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode pose les durées maximales du travail telles que le Code du travail les fixe en règle générale (48 heures sur une même semaine, 44 heures en moyenne sur douze semaines consécutives) : des accords collectifs ou des autorisations peuvent y déroger, et un enseignant de droit du travail doit relire la règle avant de l'énoncer. La création d'un échelon de classification relève de la négociation (accord d'entreprise, convention collective) et ne se décide pas seul : l'épisode la simplifie en une proposition aux délégués pendant les négociations annuelles. L'habilitation au poste par la qualité est une règle interne de l'entreprise de l'épisode, non une obligation légale.",
};
