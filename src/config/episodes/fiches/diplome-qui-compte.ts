/**
 * FICHE ENSEIGNANT · ÉPISODE 63, LE DIPLÔME QUI COMPTE.
 *
 * Diplôme, emploi et salaire en seconde : les titulaires d'un diplôme
 * recherché sont rares parce qu'ils trouvent du travail, et les payer au
 * minimum coûte plus cher qu'on ne l'économise.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "diplome-qui-compte",
  formations: ["seconde-ses"],
  programme: ["2de SES · Quelles relations entre le diplôme, l'emploi et le salaire ?"],
  notion:
    "Le diplôme protège du chômage et donne accès à un meilleur salaire : c'est pour cela que ceux qui ont un diplôme recherché sont rares sur le marché, déjà en emploi ou encore en formation. L'erreur classique est de croire qu'on fait des économies en recrutant les moins chers et en payant tout le monde au minimum, ou au contraire que le diplôme suffit et que l'expérience ne compte pas. Dans l'épisode, Noa Martin, en alternance aux ressources humaines du Groupe Escale à Annecy, prépare l'été : 80 candidatures, environ 15 % de titulaires du CAP, soit une douzaine pour 14 postes de cuisine. Le tableau des diplômes (fictif) donne 45 % d'emploi et 1 350 € net pour les sans diplôme, 65 % et 1 450 € avec un CAP ou un BEP. La grille du groupe paie 1 820 € brut au niveau 1, 2 000 € avec un CAP, 2 170 € avec un CAP et de l'expérience ou une expérience reconnue. L'élève découvre qu'il faut aller chercher les diplômés là où ils sont (lycées hôteliers et CFA), mettre chacun au poste que demande sa qualification, payer selon une règle claire, que l'expérience se reconnaît (jusqu'à la VAE), et qu'un réseau aide à trouver un emploi sans remplacer la qualification.",
  objectifs: [
    "Je lis un tableau qui croise le diplôme, le taux d'emploi et le salaire, et j'en tire une conclusion.",
    "Je calcule un effectif à partir d'un total et d'un pourcentage.",
    "J'explique pourquoi un diplôme recherché rend ses titulaires rares sur le marché du travail.",
    "Je distingue le diplôme, l'expérience et le réseau dans l'accès à l'emploi et dans le salaire.",
  ],
  prerequis:
    "Savoir calculer un pourcentage d'un total. Les notions de diplôme, de qualification, de taux d'emploi et de salaire peuvent être découvertes pendant la séance ; il n'est pas nécessaire d'avoir commencé le chapitre.",
  dureeMinutes: 90,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/diplome-qui-compte?hasard=6 : toute la classe joue la même saison, sous les mêmes aléas. Les élèves jouent en binôme. Vous précisez que le tableau des diplômes et la grille de salaires de l'épisode sont fictifs. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du nombre de titulaires du CAP attendus parmi les candidatures.",
    },
    {
      minutes: 30,
      titre: "La saison",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la prévision de la semaine 1, la manière de chercher les cuisiniers (semaine 1) et le niveau donné à Karim (semaine 8).",
    },
    {
      minutes: 10,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées et refaites le calcul : 80 × 15 / 100 = 12. Vous faites expliquer les valeurs éloignées (15, 68 ou 120). Vous montrez que le tirage de la classe en a donné 11 : une part de 15 % est une moyenne, le nombre réel varie un peu. Douze diplômés pour quatorze postes de cuisine : le manque se voit dès le calcul.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (étudiants moins chers ou lycées et CFA), de la semaine 4 (la grille) et de la semaine 8 (Karim ou Léa). Pour la semaine 1, vous faites relire le tableau : un CAP donne 65 % d'emploi contre 45 % sans diplôme ; ceux qui l'ont ont déjà un travail, ou finissent leur année au lycée. Pour la semaine 8, vous opposez ce que dit un diplôme (ce qu'on a appris) et ce que dit l'expérience (ce qu'on sait faire).",
    },
    {
      minutes: 10,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 6, « Le diplôme, l'expérience et la grille » finit avec 22,9 k€ d'avance sur le budget de la saison (les saisonniers qui reviendront compris), « Le moins cher d'abord » le dépasse de 17,3 k€, et faire comme d'habitude de 35,6 k€. Sur les trente tirages, l'ordre ne change jamais : la saison payée au minimum coûte plus cher, à cause des départs, des postes vides et des plats ratés. Vous rappelez que le résultat d'une partie dépend aussi du hasard, mais qu'ici les décisions pèsent bien plus que lui.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois idées de la séance : le diplôme protège du chômage et rend ses titulaires rares ; le salaire suit le diplôme et l'expérience ; le réseau aide à trouver un emploi. Vous les rattachez à la question du programme, et vous proposez de comparer le tableau fictif de l'épisode à des données publiques sur l'insertion des jeunes.",
    },
  ],
  calcul: {
    reponse: 12,
    etapes: [
      "Message de Marwa Selmi : 80 candidatures pour la saison. Repère de la prévision : environ 15 % d'entre elles viennent de titulaires du CAP.",
      "Prendre 15 % de 80, c'est multiplier 80 par 15 puis diviser par 100 : 80 × 15 = 1 200, et 1 200 / 100 = 12 titulaires du CAP attendus.",
      "Comparer au besoin : 12 titulaires du CAP au plus pour 14 postes de cuisine, si tous acceptent. La source « Trier les candidatures par diplôme » le confirme : peu de candidats ont un CAP, et presque aucun en cuisine.",
      "Sous le tirage de la classe, le tri en trouve 11 : la part réelle varie autour de 15 %. L'épisode juge juste une prévision à moins de 2 titulaires près : 12 l'est.",
    ],
    erreurs: [
      {
        valeur: 15,
        cause: "Le pourcentage est pris pour un nombre de personnes : 15 % devient 15 candidats.",
      },
      {
        valeur: 68,
        cause:
          "Le calcul donne ceux qui n'ont pas de CAP : 80 − 12 = 68, la part de 85 % qui reste.",
      },
      {
        valeur: 120,
        cause:
          "La division par 100 est faite à moitié : 80 × 15 / 10 = 120, plus que le nombre de candidatures, ce qui aurait dû alerter.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Les étudiants sont nombreux, disponibles, et payés au premier niveau de la grille : on remplit la cuisine tout de suite et pour moins cher.",
      ceQuiLeDejoue:
        "La fiche de poste lue avec Bastien Revil, le chef : les postes de cuisine demandent les gestes du CAP (découper, cuire, respecter l'hygiène). Un candidat sans CAP en cuisine coûte en plats ratés et en retards ; le chef le dit : il faut tout leur apprendre en plein service. Mounir Belghazi conseillait de regarder où sont les diplômés en juin : dans les lycées hôteliers et les CFA. Rejoué sur les trente tirages à la place des lycées et des CFA, ce choix fait dépenser 18,4 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Le budget compte : mettre les moins chers partout, même en cuisine, baisse la masse salariale.",
      ceQuiLeDejoue:
        "La fiche de poste distingue les postes : la cuisine demande le CAP, la plonge et le ménage s'apprennent en une demi-journée de formation. L'été dernier, les départs venaient de saisonniers jamais formés et de diplômés mal placés. Rejoué sur les trente tirages à la place de « chacun à sa place, avec une formation courte », ce choix fait dépenser 10,9 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Mounir rappelle qu'il n'y a pas de budget à jeter par les fenêtres : le niveau 1 pour tous est la masse salariale la plus basse.",
      ceQuiLeDejoue:
        "La grille place le CAP au niveau 2, 2 000 € brut contre 1 820 €, et les hôtels du lac paient les titulaires du CAP au moins au niveau 2 : un cuisinier diplômé payé au minimum trouve mieux à côté. Marwa le constate : deux cuisiniers ont signé ailleurs. Les 180 € brut économisés par mois ne paient pas les remplacements et les postes vides. Rejoué sur les trente tirages à la place de la grille, ce choix fait dépenser 14,8 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Les amis des salariés arrivent en quelques jours, quand une annonce prend trois semaines ; en juillet, on ne peut pas attendre.",
      ceQuiLeDejoue:
        "La source sur les étés passés : quatre saisonniers sur dix sont venus par un salarié, mais les recommandés n'avaient pas toujours la qualification du poste. Marwa donnait la solution : en mêlant le réseau, les annonces et les lycées, on tient la semaine suivante, avec les mêmes critères pour tous. Rejoué sur les trente tirages à la place de la cooptation parmi d'autres sources, ce choix fait dépenser 3,9 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le diplôme est une garantie : Léa a le CAP, Karim n'en a pas, on prend toujours le diplômé.",
      ceQuiLeDejoue:
        "L'essai d'une matinée : Karim tient le poste sans aide et dirige les commis, Léa découvre la cadence d'un service. Un diplôme dit ce qu'on a appris, l'expérience ce qu'on sait déjà faire ; la grille reconnaît six ans d'expérience au niveau 3, et Marwa rappelle que la VAE permettrait à Karim d'obtenir son CAP. Rejoué sur les trente tirages à la place de l'essai, ce choix fait dépenser 3,5 k€ de plus en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "La grille ne se discute pas : répondre « c'est comme ça » ferme la discussion sans rien coûter.",
      ceQuiLeDejoue:
        "Les deux fiches de paie comparées à la grille : Léa est au niveau 2, celui du CAP, Karim au niveau 3 pour son expérience, et Léa y passera avec l'ancienneté. Expliquer la règle ne coûte rien de plus ; la source sur les retours dit que les saisonniers qui reviennent ont été traités avec des règles claires, et un retour, c'est un recrutement et une formation de moins. Rejouée sur les trente tirages à la place de la grille montrée, cette réponse fait dépenser 8,7 k€ de plus en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "Dans le tableau des diplômes, que gagne-t-on en emploi et en salaire avec un CAP plutôt que sans diplôme ? Pourquoi est-ce justement ce qui rend les titulaires du CAP difficiles à recruter en juin ?",
    "Douze titulaires du CAP au plus pour quatorze postes de cuisine : que fallait-il en conclure en semaine 1 ?",
    "Payer tout le monde au niveau 1 était la masse salariale la plus basse. Pourquoi la saison « Le moins cher d'abord » a-t-elle coûté plus que le budget ?",
    "Karim a six ans d'expérience et pas de diplôme, Léa un CAP de juin et pas d'expérience. Qu'est-ce que chacun des deux apporte à l'entreprise ? Que permet la VAE ?",
    "Le réseau permet de trouver un emploi vite. Pourquoi une cooptation seule a-t-elle fait venir des personnes sans la qualification du poste ?",
    "Léa gagne moins que Karim alors qu'elle a le diplôme. Est-ce injuste ? Quelle réponse lui permet de comprendre, et de revenir l'été prochain ?",
    "Répondez en une phrase à la question du programme : quelles relations entre le diplôme, l'emploi et le salaire ? Mettez-y un chiffre de l'épisode.",
  ],
  prolongement: {
    enonce:
      "Un restaurant de bord de mer reçoit 50 candidatures pour l'été, dont 12 % viennent de titulaires du CAP de cuisine. Il lui faut 5 cuisiniers pour trois mois. Sa grille paie 1 800 € brut par mois au niveau 1 (sans diplôme) et 1 950 € au niveau 2 (avec un CAP). 1) Combien de titulaires du CAP y a-t-il parmi les candidatures ? 2) S'il paie ses 5 cuisiniers diplômés au niveau 1, combien économise-t-il par mois, puis sur la saison ? 3) Payés au niveau 1, deux d'entre eux partent au bout d'un mois. Chaque départ coûte 600 € de remplacement, et le poste reste vide deux semaines, à 1 500 € par semaine. Combien coûtent ces deux départs ? 4) Le restaurant a-t-il fait une économie ?",
    corrige:
      "1) 50 × 12 / 100 = 6 titulaires du CAP. 2) L'écart est de 1 950 − 1 800 = 150 € brut par mois et par cuisinier : 5 × 150 = 750 € par mois, soit 750 × 3 = 2 250 € sur la saison. 3) Un départ coûte 600 + 2 × 1 500 = 3 600 € ; deux départs, 7 200 €. 4) Non : il perd 7 200 − 2 250 = 4 950 €, sans compter que les remplaçants sont plus difficiles à trouver en pleine saison.",
  },
  evaluation: [
    "Le nombre de titulaires du CAP attendus est calculé juste (80 × 15 % = 12), et comparé aux 14 postes de cuisine.",
    "La lecture du tableau des diplômes relie le diplôme au taux d'emploi et au salaire, avec ses chiffres.",
    "Le niveau donné à chaque salarié est justifié par le diplôme et l'expérience, selon une règle commune.",
    "Le rôle du réseau est expliqué, avec sa limite : il ne garantit pas la qualification.",
  ],
  vigilance:
    "Le tableau des diplômes et la grille de salaires sont fictifs, l'épisode le dit : à comparer avec des données publiques sur l'insertion des jeunes avant d'en tirer des chiffres réels. Le coût employeur y est un coefficient forfaitaire de 1,35. La VAE est présentée de façon simplifiée.",
};
