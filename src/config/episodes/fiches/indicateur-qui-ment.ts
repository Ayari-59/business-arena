/**
 * FICHE ENSEIGNANT · ÉPISODE 10, L'INDICATEUR QUI MENT.
 *
 * Un indicateur devenu objectif cesse de mesurer ce qu'il mesurait : l'équipe
 * décroche vite, écourte, et la commande ne se prend plus au premier appel.
 * Vérifier ce que compte le chiffre avant de le pousser.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "indicateur-qui-ment",
  formations: ["bts-ndrc", "bts-mco", "stmg"],
  programme: [
    "BTS NDRC · Bloc 2, Relation client à distance et digitalisation",
    "BTS MCO · Bloc 4, Manager l'équipe commerciale",
    "STMG · Terminale systèmes d'information de gestion, Thème 3, Information, action et décision",
  ],
  notion:
    "Quand un indicateur devient un objectif, et plus encore quand une prime en dépend, l'équipe optimise le chiffre au lieu du travail qu'il devait refléter. L'erreur classique consiste à pousser l'indicateur qui est au vert (un objectif relevé, un classement affiché, un seuil de prime plus haut), ou à l'enterrer sous dix autres chiffres que personne ne sait lire. Dans l'épisode, Sonia Vidal dirige les deux plateaux de prise de commande à distance d'Arvel Distribution : 94 % des appels décrochés en moins de 30 secondes, premiers du groupe six semaines d'affilée, une prime de 250 € par conseiller et par mois au-delà de 90 %, et des commandes à distance en baisse de 9 %. L'écoute de vingt appels montre sept appels terminés sans commande et une durée moyenne passée de 6 min 30 à 5 min 05 ; le croisement des numéros montre 22 % des appelants qui rappellent sous 48 heures, 62 % des commandes prises au premier appel, et un client sur cinq qui ne rappelle jamais. L'élève découvre que le meilleur au décroché est celui qui prend le moins de commandes, qu'une prime se refond avec l'équipe sur ce qu'elle doit produire, et qu'un tableau de bord tient en quatre chiffres équilibrés.",
  objectifs: [
    "Je vérifie ce qu'un indicateur compte vraiment, en le confrontant au travail réel (des appels écoutés, des numéros croisés).",
    "J'explique comment une prime attachée à un indicateur peut dégrader le résultat qu'elle devait servir.",
    "Je choisis un petit nombre d'indicateurs équilibrés (activité, qualité, résultat) et je les suis avec l'équipe.",
    "Je défends une décision de moyens auprès de la direction avec des données, pas avec des impressions.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions d'indicateur, de tableau de bord, d'objectif et de prime d'équipe doivent être connues ; le calcul d'un pourcentage suffit. La différence entre un indicateur d'activité et un indicateur de résultat, et l'effet d'une prime sur les comportements, peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/indicateur-qui-ment?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la part des appelants qui rappelleront sous 48 heures en semaine 3, le raisonnement qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la décision de la semaine 1 (objectif à 95 %, écoute, dix indicateurs, rien) et le sort de la prime en semaine 3. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 9, le pic de printemps.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites avec la classe le lien entre les trois chiffres du croisement des numéros : 62 % de commandes prises au premier appel, donc près de 4 appels sur 10 non aboutis, dont un peu plus de la moitié rappelle. Vous faites constater que trois semaines ne changent presque rien à ce chiffre, qui baisse un peu quand le chrono pèse moins (20,7 %) et monte quand on le pousse (22,8 %). Vous faites expliquer les valeurs éloignées : 38 % et 6 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 (la prime) et de la semaine 7 (les deux postes). Pour la prime, vous faites lire les résultats conseiller par conseiller : Lucas, premier au décroché, prend 48 % des commandes au premier appel, Yasmine, avant-dernière, 79 %. Pour les postes, vous faites calculer la charge réelle : 21 % d'appels en double, et un pic de +20 % en semaine 10.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Vérifier ce que mesure l'indicateur » finit 24,7 k€ au-dessus du budget, l'attentiste 44,9 k€ en dessous, et « Plus vert que vert » 117,1 k€ en dessous, avec un décroché moyen de 92 % contre 84 %. Vous montrez ensuite la décision où le hasard a déjoué la bonne méthode : sous ce tirage, le siège a refusé de changer d'indicateur. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant de pousser un indicateur, regarder ce qu'il compte ; ne jamais primer un chiffre que l'équipe peut améliorer en faisant moins bien son travail ; piloter sur quelques indicateurs qui se tiennent l'un l'autre (le décroché, la commande au premier appel, les rappels, le chiffre d'affaires). Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 20.7,
    etapes: [
      "Source « Croiser les numéros appelants sur quinze jours » : 22 % des appelants rappellent dans les 48 heures pour la même demande ; 62 % des appels de commande aboutissent du premier coup ; parmi les clients qui n'obtiennent pas leur commande au premier appel, un sur cinq ne rappelle jamais.",
      "Les trois chiffres se tiennent : avec 62 % de résolution au premier appel, près de 38 % des appels n'aboutissent pas ; un peu plus de la moitié de ces clients rappellent sous 48 heures (0,38 × 0,55 ≈ 21 %), les autres attendent, commandent ailleurs ou abandonnent. C'est le niveau de départ.",
      "La bonne décision (écouter des appels avec l'équipe et suivre les commandes prises au premier appel) desserre un peu la course au chrono : la durée d'appel remonte, et la commande au premier appel passe d'environ 62 % à 63,6 % en semaine 3. Les rappels baissent d'autant, mais lentement : la prime au décroché court toujours, et les binômes ne viennent qu'en semaine 5.",
      "Sous le tirage n° 12, le modèle donne 20,7 % (20,67) d'appelants qui rappellent en semaine 3 ; 22,8 % avec l'objectif de 95 % suivi heure par heure, 21,3 % sans rien changer. Un élève qui garde 22 % est jugé juste : l'épisode accepte 2 points d'écart, 5 pour « proche ». De 20,2 % à 25 % selon les trente tirages.",
    ],
    erreurs: [
      {
        valeur: 38,
        cause:
          "Tous les appels qui n'aboutissent pas du premier coup (100 − 62) comptés comme des rappels : une partie des clients ne rappelle pas sous 48 heures, et un sur cinq ne rappelle jamais.",
      },
      {
        valeur: 6,
        cause:
          "Les appels non décrochés en 30 secondes (100 − 94) pris pour les rappels : c'est confondre l'indicateur du siège avec ce qu'il ne mesure pas, des appels décrochés mais non résolus.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Les plateaux sont premiers du groupe à 94 % : viser 95 % et suivre le décroché heure par heure, c'est faire encore mieux sur le chiffre que regarde le siège, sans rien dépenser.",
      ceQuiLeDejoue:
        "Philippe Garcin a déjà le signal contraire : les commandes à distance ont baissé de 9 % et des artisans doivent appeler deux fois. L'écoute de vingt appels montre sept appels terminés sans commande, une durée moyenne tombée de 6 min 30 à 5 min 05, et Lucas, premier au décroché, qui raccroche au bout de trois minutes. Philippe conseille : « Avant de le pousser, regarde ce qu'il compte vraiment. » Rejoué sur les trente tirages à la place de l'écoute, l'objectif de 95 % perd 48,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Le problème vient d'un seul chiffre : en suivre dix chaque jour, c'est ne plus piloter à l'aveugle.",
      ceQuiLeDejoue:
        "Dix chiffres de plus coûtent 500 € par semaine et une heure par jour à Kevin Marchal, et l'équipe lui demande « lequel des dix chiffres compte ». Aucun ne mesure la commande prise au premier appel, ni conseiller par conseiller : impossible de savoir qui fabrique les rappels. Un seul indicateur bien choisi, suivi avec l'équipe, dit ce que les dix ne disent pas. Rejoués sur les trente tirages à la place de l'écoute, les dix indicateurs perdent 49,1 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "La prime est versée onze mois sur douze : la relever à 95 % la rend plus exigeante, pour le même montant.",
      ceQuiLeDejoue:
        "La lecture conseiller par conseiller montre que la prime récompense ceux qui raccrochent vite : les trois meilleurs au décroché prennent le moins de commandes au premier appel, Lucas 48 %, Yasmine 79 % en étant avant-dernière. Hugo Lemaire prévient qu'à 95 % « les appels de commande longs, plus personne n'en voudra ». Refondre la prime avec l'équipe, moitié décroché, moitié commandes prises au premier appel, coûte 1 200 €. Rejoué sur les trente tirages à la place de cette refonte, le seuil relevé perd 38,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Les conseillers sont très inégaux : afficher le classement du décroché permet à chacun de se situer, et ne coûte rien.",
      ceQuiLeDejoue:
        "Le classement affiché est celui de l'indicateur qui trompe : Yasmine, qui prend presque toutes les commandes de chantier, s'y voit avant-dernière et « ne sait plus ce qu'on attend » d'elle. Les chiffres conseiller par conseiller montrent de 48 % à 81 % de commandes au premier appel, et quatre conseillers qui fabriquent la moitié des rappels : des binômes autour des meilleurs preneurs de commandes transmettent ce qui manque. Rejoué sur les trente tirages à la place des binômes, le classement perd 25,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le décroché est excellent : le siège a raison, les plateaux ont de la marge, et deux postes rendus font 10 000 € d'économie.",
      ceQuiLeDejoue:
        "Le calcul de la charge réelle le contredit : environ 21 % des appelants rappellent, autant d'appels que le décroché compte deux fois, et le pic de printemps ajoute 20 % d'appels dès la semaine 10. Avec deux postes en moins, il faudrait encore raccourcir les appels pour tenir le décroché. Le siège, raconte la source sur l'histoire de l'indicateur, « change d'indicateur quand on lui apporte des données ». Rejoué sur les trente tirages à la place de la note chiffrée au siège, rendre les postes perd 20,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le rappel automatique garde le décroché au vert pendant le pic : le client laisse son numéro, et l'appel compte comme décroché.",
      ceQuiLeDejoue:
        "C'est faire mentir l'indicateur un peu plus : Patrick Simoni, rappelé jeudi pour un rappel promis mardi, « avait commandé ailleurs ». La lecture du pic de l'an dernier montre que six appels supplémentaires sur dix sont des commandes de chantier, à trois fois le panier moyen, et que les questions de suivi peuvent attendre quelques minutes : une ligne prioritaire les sépare. Rejoué sur les trente tirages à la place de la ligne prioritaire, le rappel automatique perd 19 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le siège ne regarde que le décroché : garder ce seul chiffre est le plus simple, et « au moins, c'est clair ».",
      ceQuiLeDejoue:
        "Philippe Garcin le demande : « un tableau qui me dise si on vend, pas seulement si on répond ». Le trimestre a montré qu'un décroché seul se tient en écourtant les appels. Quatre indicateurs revus chaque lundi (décroché, commandes au premier appel, rappels, chiffre d'affaires) se tiennent l'un l'autre. Rejoué sur les trente tirages à la place des quatre indicateurs, le seul décroché perd 3,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Après un trimestre trompé par un seul chiffre, tout mesurer, par conseiller et par heure, paraît la meilleure garantie de ne plus rien rater.",
      ceQuiLeDejoue:
        "C'est l'erreur des dix indicateurs de la semaine 1, en plus lourd : 500 € par semaine de reporting, et Kevin Marchal qui passe sa matinée sur les tableaux et l'après-midi à expliquer pourquoi ils sont rouges. Un tableau de bord sert à décider ; quatre chiffres que tout le monde connaît le permettent. Rejoué sur les trente tirages à la place des quatre indicateurs, le tableau de quinze perd 8,6 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le tableau était vert et les ventes baissaient. Quelles sources montraient ce que le décroché ne comptait pas ? Pourquoi la comparaison avec les autres plateaux n'apprenait-elle rien ?",
    "Lucas est premier au décroché et prend 48 % des commandes au premier appel ; Yasmine est avant-dernière et en prend 79 %. Que récompensait la prime ? Comment une prime peut-elle faire baisser le résultat qu'elle devait servir ?",
    "Pourquoi refondre la prime avec l'équipe plutôt que la supprimer par une note de service ? Que disait Hugo Lemaire de ce que représentent 250 € par mois ?",
    "Sous le tirage n° 12, le siège a refusé de piloter sur les commandes prises au premier appel, et ceux qui ont obtenu un simple report finissent 4,3 k€ au-dessus de ceux qui ont présenté la note chiffrée. Sur les trente tirages, la note fait pourtant mieux en moyenne. Leur choix était-il meilleur ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Pendant le pic, le rappel automatique garde le décroché au vert, la ligne prioritaire le fait baisser. Laquelle sert les clients ? Que montre ce choix sur la relation entre l'indicateur et le travail ?",
    "« Plus vert que vert » finit le trimestre avec le meilleur décroché moyen (92 %) et le plus mauvais résultat (117 k€ sous le budget). Comment l'expliquer en une phrase ?",
    "Quels quatre indicateurs gardez-vous pour un plateau téléphonique, et pourquoi chacun empêche-t-il les autres de mentir ?",
  ],
  prolongement: {
    enonce:
      "Un plateau reçoit 1 500 appels par semaine ; 55 % des appels résolus donnent une commande, qui laisse 80 € de marge. Situation A : 94 % des appels décrochés en 30 secondes, 62 % résolus au premier appel parmi les décrochés. Situation B, après la refonte de la prime : 88 % décrochés, 72 % résolus au premier appel. 1) Pour chaque situation, combien d'appels sont résolus du premier coup, combien de commandes en sortent, et quelle marge ? 2) Combien d'appels n'aboutissent pas du premier coup, en nombre et en part des appels ? 3) Parmi les appels non aboutis, 55 % portaient sur une commande, et un client sur cinq ne rappelle jamais : combien de commandes et de marge perd-on chaque semaine dans chaque situation ? 4) Quelle situation le siège préfère-t-il s'il ne lit que le décroché ? Laquelle rapporte le plus ?",
    corrige:
      "1) A : 1 500 × 0,94 × 0,62 = 874,2 appels résolus, 874,2 × 0,55 ≈ 480,8 commandes, 38 465 € de marge. B : 1 500 × 0,88 × 0,72 = 950,4 appels résolus, ≈ 522,7 commandes, 41 818 € de marge. 2) A : 1 500 − 874,2 = 625,8 appels, 41,7 % ; B : 549,6 appels, 36,6 %. 3) A : 625,8 × 0,55 × 0,2 ≈ 68,8 commandes perdues, 5 507 € ; B : 549,6 × 0,55 × 0,2 ≈ 60,5 commandes, 4 836 €. 4) Le siège préfère A, à 94 % de décroché ; B rapporte environ 3 350 € de marge de plus par semaine et perd moins de clients : le décroché seul classe les deux situations à l'envers.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur l'écoute des appels et le croisement des numéros, et l'élève dit pourquoi le classement des plateaux et les prix des concurrents écartent les fausses pistes.",
    "La prévision des rappels en semaine 3 est construite par un raisonnement écrit (résolution au premier appel, part des clients qui rappellent, effet lent des décisions), et l'écart avec 20,7 % est expliqué.",
    "La réponse sur la prime est justifiée par les résultats conseiller par conseiller, et l'élève explique comment une prime au décroché dégrade la commande.",
    "Le tableau de bord retenu en semaine 11 combine des indicateurs d'activité, de qualité et de résultat, et l'élève dit lequel empêche lequel de mentir.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La modification d'une prime d'équipe, et a fortiori sa suppression, touche à la rémunération : selon qu'elle relève du contrat, d'un accord collectif ou d'un engagement unilatéral de l'employeur, sa dénonciation suit des règles (information des représentants du personnel, délai de prévenance) que l'épisode ne détaille pas et qu'un professeur de droit social doit relire avant d'en faire une règle. L'enregistrement et l'écoute des appels supposent l'information des salariés et des clients.",
};
