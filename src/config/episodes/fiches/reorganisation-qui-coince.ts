/**
 * FICHE ENSEIGNANT · ÉPISODE 28, LA RÉORGANISATION QUI COINCE.
 *
 * Conduire le changement dans une équipe commerciale : écouter les
 * objections, commencer par un pilote de volontaires, simplifier l'outil avec
 * ceux qui s'en servent, faire de l'ancien influent un relais. Le piège est
 * double : imposer et contrôler, ou reculer pour ne froisser personne. Les
 * chiffres du hasard de la classe sont ceux de la graine 12.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "reorganisation-qui-coince",
  formations: ["bts-mco", "but-gaco", "dcg"],
  programme: [
    "BTS MCO · Bloc 4, Manager l'équipe commerciale",
    "BUT GACO · Participer au pilotage RH de l'organisation",
    "DCG · UE 7, Management des organisations",
  ],
  notion:
    "Les gens résistent moins au changement qu'à ce qu'on leur retire sans leur demander. L'erreur classique consiste à lire la résistance comme un refus de principe, qu'on recadre, qu'on contrôle et qu'on fait basculer d'un coup ; l'erreur inverse consiste à reculer, reporter ou exempter pour que la pression retombe. Dans l'épisode, Isabelle Fontanel dirige quatorze commerciaux d'Arvel Distribution dans quatre agences lyonnaises : la direction veut les organiser par type de clients, grands comptes d'un côté, artisans de l'autre, avec un nouvel outil de suivi, le tout en place en semaine 13. L'annonce, apprise par un mail du siège, a mal pris : Patrick Vial (vingt-sept ans de maison) et Sylvie Charrier freinent, l'indice d'adhésion est à 38 sur 100, l'outil n'enregistre que 16 % des visites, et le chiffre est tombé de 420 à 404 k€ par semaine. Les sources montrent que huit commerciaux sur douze trouvent l'idée « logique » : ce qu'ils refusent, c'est de lâcher du jour au lendemain les artisans qu'ils suivent depuis vingt ans et une fiche de douze champs impossible à remplir dans le camion. L'Auvergne a tout basculé d'un coup (−14 % pendant huit semaines, deux départs) ; la Bourgogne a commencé par un pilote de quatre volontaires (−4 % pendant cinq semaines, puis +6 %). L'élève découvre que la courbe du changement se creuse moins quand le client est présenté par son commercial, que l'outil s'utilise quand il sert à ceux qui le remplissent, et que l'ancien qu'on écoute devient le meilleur relais.",
  objectifs: [
    "Je distingue l'adhésion à un projet de l'adhésion à ses modalités, et je fais dire les objections avant de décider.",
    "Je choisis un mode de déploiement (d'un coup, pilote puis vagues) en comparant la profondeur et la durée du creux qu'il provoque.",
    "Je mesure l'usage réel d'un outil plutôt que le taux de saisie, et j'explique pourquoi une saisie obligatoire produit des fiches vides.",
    "Je transforme un opposant influent en relais en lui confiant un rôle réel dans le changement.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de changement organisationnel, de résistance au changement, de leadership et de communication managériale doivent avoir été vues en cours ; le calcul d'une marge suffit pour lire le bilan. La courbe du changement, l'expérimentation pilote et la différence entre saisie et usage peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/reorganisation-qui-coince?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation de l'indice d'adhésion de l'équipe en semaine 3 et ce qui la justifie, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la réponse à l'équipe en semaine 1 (tenir la ligne, recevoir chacun, la plénière, laisser retomber) et ce qui a été fait de Patrick en semaine 7. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 5 : la saisie obligatoire au lieu de la fiche simplifiée.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées et vous les rapprochez du choix de la semaine 1. Vous partez des 38 sur 100 du questionnaire anonyme et vous refaites le raisonnement : les entretiens durent deux semaines, et les deux anciens, encore remontés, continuent d'entraîner les autres. Le modèle donne 45 en recevant chacun, 38 avec la plénière, 36 en laissant retomber, 29 en tenant la ligne devant l'équipe. Vous faites expliquer les valeurs éloignées (38, 50, 60).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 3 (tout basculer, le pilote, les grands comptes désignés, repousser) et de la semaine 7 sur Patrick. Vous faites lire la source des autres régions, puis celle sur les clients qui changent de commercial : présenté par le sortant, le client reste neuf fois sur dix ; prévenu par courrier, une fois sur quatre il va voir ailleurs. Pour l'outil, vous faites ouvrir les vingt fiches de la source : six seulement disent ce qui a été proposé et la suite.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Faire adhérer » finit 48,1 k€ au-dessus du budget, dynamique laissée comprise, « Attendre que ça passe » 18 k€ en dessous, « Imposer et contrôler » 68,2 k€ en dessous ; sur les trente tirages, la première tient le budget 27 fois, l'attente 10 fois, l'injonction jamais. Sous ce tirage, le pilote a réussi (huit chances sur dix après les entretiens) et Patrick a accepté d'être référent. Vous montrez les décisions où le hasard peut renverser le jugement : basculer toute l'équipe d'un coup fait mieux que le pilote 4 fois sur 30, quand le pilote échoue.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les deux réflexes de l'épisode, l'injonction et le recul, et ce qu'ils ont en commun : ni l'un ni l'autre ne traite les objections. Vous leur opposez quatre gestes : écouter d'abord ceux qui parlent fort, commencer par des volontaires, simplifier l'outil avec ceux qui s'en servent, faire présenter chaque client par celui qui le connaît. Vous rappelez que l'échéance de la semaine 13 se tient mieux en deux vagues accompagnées qu'en un seul lundi. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 45,
    etapes: [
      "Point de départ (questionnaire anonyme de la semaine 1) : indice d'adhésion de 38 sur 100. Huit réponses sur douze trouvent l'idée des grands comptes « logique » ; neuf craignent de perdre leurs clients, dix jugent l'outil trop lourd.",
      "Ce que font les entretiens : quatorze entretiens d'une heure en deux semaines, Patrick et Sylvie d'abord. Sylvie le dit ensuite : « Merci de m'avoir écoutée. » Le modèle compte environ 4 points d'adhésion par semaine d'entretiens, pendant les deux semaines : 38 + 8 = 46.",
      "Ce qui freine encore : les deux anciens restent remontés (Patrick : « Ce sera sans moi »), et leur ressentiment, même en baisse après avoir été reçus, retire un peu d'adhésion chaque semaine : environ 0,5 point en semaine 1, 0,3 en semaine 2 et 0,3 en semaine 3.",
      "Estimation : 46 − 1 ≈ 45 sur 100 en fin de semaine 3 (44,96). L'épisode juge juste à 3 points près, proche à 8. Le chiffre ne dépend pas du hasard : il est le même pour toute la classe et sur les trente tirages.",
      "Pour comparer : en tenant la ligne devant l'équipe, l'adhésion tombe à 29, et le ressentiment des anciens monte ; avec la plénière, 38 ; en laissant retomber la pression, 36. Les entretiens sont la seule réponse qui rapproche l'équipe de l'objectif de 60.",
    ],
    erreurs: [
      {
        valeur: 38,
        cause:
          "Le chiffre du questionnaire reporté tel quel, comme si deux semaines d'entretiens, Patrick et Sylvie d'abord, ne changeaient rien à l'adhésion.",
      },
      {
        valeur: 50,
        cause:
          "Quatre points comptés chaque semaine pendant trois semaines (38 + 12) : les entretiens durent deux semaines, et les anciens, encore remontés, continuent de peser sur les autres.",
      },
      {
        valeur: 60,
        cause:
          "L'objectif d'adhésion pris pour une prévision : 60 sur 100 est ce que la direction attend, pas ce que trois semaines d'écoute produisent en partant de 38.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le comité de direction a validé, l'échéance est fixée : rappeler la règle à Patrick et Sylvie devant l'équipe évite que le projet s'enlise.",
      ceQuiLeDejoue:
        "Reçus en tête-à-tête, ni Patrick ni Sylvie ne contestent l'idée (« Les grands comptes, on les sert mal, c'est vrai ») : ils refusent de lâcher d'un coup un tiers de leur chiffre et une fiche de douze champs. Agnès Thibault le dit : « Commence par ceux qui parlent fort : ce sont souvent ceux que les autres écoutent. » Le rappel public fait tomber l'adhésion à 29 et monter le ressentiment des anciens. Rejoué sur les trente tirages à la place des entretiens, il perd 62,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Le plan prévoit la bascule lundi, et Marc Delaunay ne lâchera pas l'échéance : tout basculer d'un coup laisse le plus de temps pour s'adapter avant la semaine 13.",
      ceQuiLeDejoue:
        "La source des autres régions : l'Auvergne a tout basculé d'un coup, −14 % de chiffre pendant huit semaines, deux départs et des fiches vides trois mois après ; la Bourgogne, avec un pilote de quatre volontaires, −4 % pendant cinq semaines puis +6 %. Et un client prévenu par courrier va voir ailleurs une fois sur quatre (les clients de Patrick l'appellent « pour savoir s'il était malade »). Rejouée sur les trente tirages à la place du pilote, la bascule générale perd 11,6 k€ en moyenne ; elle fait mieux 4 fois, quand le pilote échoue.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "La région est dernière sur l'outil : rendre la saisie obligatoire et la lier à la prime fera monter le taux tout de suite, sans rien coûter.",
      ceQuiLeDejoue:
        "Les vingt fiches ouvertes au hasard montrent que le problème n'est pas le taux : six seulement disent ce qui a été proposé et la suite, les autres sont des « visite RAS » saisies le vendredi soir. Les commerciaux disent ce qui les retient : douze champs, un portable qu'on n'ouvre pas dans le camion, et « je ne vois pas ce que ça m'apporte ». Obligatoire, la saisie monte et l'usage reste vide (Sylvie : « Visite RAS, quarante fois »). Rejouée sur les trente tirages à la place de la fiche simplifiée, elle perd 13,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Patrick parle d'un concurrent à la machine à café et freine ouvertement : un recadrage écrit avec les ressources humaines pose les limites.",
      ceQuiLeDejoue:
        "La source « Regarder qui écoute Patrick » : cinq commerciaux sur quatorze ont débuté avec lui, trois attendent de voir ce qu'il fera, et ses quarante artisans pèsent près de 10 % du chiffre. Au déjeuner, s'il a été écouté en semaine 1, il dit ce qu'il veut : ne pas « finir à faire de la saisie pour les jeunes », et il connaît tous les grands comptes. Recadré, il signe « pour le reste, on verra », et son ressentiment fait monter le risque qu'il parte avec ses clients. Rejoué sur les trente tirages à la place du rôle de référent, le recadrage perd 25,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Il reste quatre semaines : basculer tous les autres lundi met toute la région dans la nouvelle organisation dès la semaine 10, avant l'échéance.",
      ceQuiLeDejoue:
        "La source sur les passations déjà faites : les portefeuilles présentés au client par un collègue ont perdu deux fois moins de chiffre que ceux annoncés par courrier, « et quand toute une agence bascule la même semaine, personne n'a le temps d'accompagner personne ». Deux vagues en binôme, en semaines 10 et 12, tiennent aussi l'échéance. Rejouée sur les trente tirages à la place des deux vagues, la bascule générale perd 6,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Afficher chaque lundi le classement des saisies et du chiffre stimule l'équipe, et ne coûte rien.",
      ceQuiLeDejoue:
        "La source « Comparer les saisies et l'usage réel » montre l'écart : ce qui manque, c'est que quelqu'un montre à quoi la fiche sert aux autres ; là où un collègue l'a fait, l'usage a doublé en deux semaines. Le classement fait remplir des fiches pour remonter (« trente fiches dimanche soir »), pas des fiches utiles. Rejoué sur les trente tirages à la place des réunions où les pilotes témoignent, il perd 6,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "L'annonce a mal pris : laisser retomber la pression quelques semaines évite d'envenimer les choses.",
      ceQuiLeDejoue:
        "Le silence ne traite aucune objection, et Marc Delaunay le remarque (« je n'entends plus parler du projet »), pendant que l'échéance de la semaine 13 se rapproche. L'adhésion baisse à 36 au lieu de monter, et les volontaires ne se lèvent pas quand il faut lancer le pilote. Rejoué sur les trente tirages à la place des entretiens, il perd 46,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "L'équipe n'est pas prête : repousser la bascule de quelques semaines lui laisse le temps de se faire à l'idée.",
      ceQuiLeDejoue:
        "Les volontaires existent dès que les objections ont été entendues : quatre à Villeurbanne et à Gerland, dont Sylvie, 30 % du chiffre, à condition de garder ses artisans le temps de les présenter. Repousser comprime tout le déploiement dans les dernières semaines, sans pilote pour former les suivants. Rejoué sur les trente tirages à la place du pilote, le report perd 20,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Ceux qui y trouvent un intérêt s'y mettront : forcer l'usage d'un outil ne marche jamais.",
      ceQuiLeDejoue:
        "Personne n'y trouve d'intérêt tant que la fiche a douze champs et ne s'ouvre pas sur téléphone, et que les grands comptes « ne renvoient jamais rien ». Simplifier l'outil avec un groupe de commerciaux (quatre champs, saisie sur téléphone) crée cet intérêt, pour 6 000 €. Rejoué sur les trente tirages à la place de la fiche simplifiée, attendre l'usage perd 6,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Patrick a vingt-sept ans de maison : le laisser travailler à l'ancienne, avec ses clients, évite qu'il parte.",
      ceQuiLeDejoue:
        "Camille Rey le dit : « Donc il suffisait de refuser pour être tranquille. » Ses quarante artisans, près de 10 % du chiffre, restent hors de la nouvelle organisation, et ceux qui attendaient de voir ce qu'il ferait n'ont plus de raison de basculer. Référent, il présente lui-même ses clients à ceux qui les reprennent. Rejouée sur les trente tirages à la place du rôle de référent, l'exemption perd 8,8 k€ en moyenne ; elle fait mieux 6 fois, quand Patrick aurait refusé le rôle.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "On ne retient pas quelqu'un qui veut partir : s'il part, il part.",
      ceQuiLeDejoue:
        "Une partie de ses artisans le suivrait (Agnès Thibault le prévient), son remplaçant mettrait deux mois à arriver, et trois commerciaux attendent de voir ce qu'il fera. Le rôle de référent lui donne ce qu'il demande au déjeuner, pour une prime de 1 500 €. Rejoué sur les trente tirages à la place du rôle de référent, ne rien faire perd 11,7 k€ en moyenne ; il fait mieux 6 fois, toutes parmi celles où Patrick aurait refusé le rôle de référent.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Laisser chacun basculer quand il se sent prêt respecte le rythme de l'équipe, et personne n'est forcé.",
      ceQuiLeDejoue:
        "Marc Delaunay le craint : « certains ne se sentiront jamais prêts ». Sans date, les plus réticents restent dans l'ancienne organisation, et l'échéance de la semaine 13 n'est pas tenue ; les deux vagues accompagnées donnent une date et un binôme à chacun. Rejoué sur les trente tirages à la place des deux vagues, le libre choix perd 10,8 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Mieux vaut avouer que la semaine 13 ne sera pas tenue que de bâcler la fin du déploiement.",
      ceQuiLeDejoue:
        "Rien n'oblige à bâcler : la source sur les passations montre comment finir sans creux profond, en deux vagues où chaque nouveau fait sa première visite avec un collègue déjà passé (« Les clients savaient déjà qui j'étais »). Le report laisse la région à moitié dans deux organisations un trimestre de plus. Rejoué sur les trente tirages à la place des deux vagues, il perd 16,1 k€ en moyenne et ne fait mieux qu'une fois.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu deux anciens qui bloquent par principe, d'autres un calendrier trop brutal, d'autres des objections jamais entendues. Quelles sources permettaient de trancher, et que montrait la comparaison des quatre agences ?",
    "Huit commerciaux sur douze trouvent l'idée logique, et l'adhésion est à 38 sur 100. Comment les deux chiffres peuvent-ils être vrais en même temps ? À quoi l'équipe résiste-t-elle vraiment ?",
    "L'Auvergne et la Bourgogne ont fait le même changement. Comparez leurs courbes : la profondeur du creux, sa durée, ce qui vient après. Qu'est-ce qui, dans la façon de faire, explique la différence ?",
    "La saisie obligatoire fait monter le taux de saisie. Pourquoi ce chiffre est-il trompeur ? Quel indicateur fallait-il suivre ?",
    "Sous le tirage n° 12, le pilote a réussi et Patrick a accepté d'être référent. Sur les trente tirages, tout basculer d'un coup fait mieux que le pilote 4 fois, quand le pilote échoue. Le pilote restait-il le bon choix ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Imposer et reculer sont deux réflexes opposés. Qu'ont-ils en commun ? Citez une décision de chaque sorte que vous avez prise ou envisagée.",
    "Quelle règle gardez-vous pour conduire un changement que l'équipe n'a pas choisi ? Formulez-la en une phrase, avec ce qu'il faut faire en premier.",
  ],
  prolongement: {
    enonce:
      "Une région commerciale fait 420 000 € de chiffre d'affaires par semaine, avec un taux de marge de 25 %. Deux façons de déployer une nouvelle organisation sur un trimestre de 13 semaines. A, tout d'un coup : −14 % de chiffre pendant 8 semaines, puis le niveau d'avant. B, un pilote puis des vagues : −4 % pendant 5 semaines, puis +6 % pendant les 8 semaines suivantes. 1) Calculez, pour chaque option, la variation de chiffre d'affaires et de marge sur le trimestre. 2) Quel écart de marge sépare les deux options ? 3) Avec l'option A, un commercial influent risque de partir : son portefeuille fait 40 000 € de chiffre par semaine, 35 % de ses clients le suivraient, et son départ coûte 15 000 € de remplacement. Que coûte son départ en marge sur 8 semaines, remplacement compris ? 4) Un rôle de référent, avec une prime de 1 500 €, le retient trois fois sur quatre : que vaut cette prime ?",
    corrige:
      "1) A : −0,14 × 420 000 × 8 = −470 400 € de chiffre, soit −117 600 € de marge. B : −0,04 × 420 000 × 5 = −84 000 €, puis +0,06 × 420 000 × 8 = +201 600 € : +117 600 € de chiffre, soit +29 400 € de marge. 2) 29 400 − (−117 600) = 147 000 € de marge d'écart. 3) 0,35 × 40 000 = 14 000 € de chiffre par semaine, soit 3 500 € de marge ; sur 8 semaines, 28 000 €, plus 15 000 € de remplacement : 43 000 €. 4) Le départ évité trois fois sur quatre vaut 0,75 × 43 000 = 32 250 € en moyenne, pour 1 500 € de prime : le rôle vaut vingt fois ce qu'il coûte, à condition que la personne y voie une reconnaissance et non un achat.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 distingue l'adhésion au projet de l'adhésion à ses modalités, avec les sources qui le montrent (les entretiens, le questionnaire).",
    "L'estimation de l'adhésion en semaine 3 est raisonnée à partir du questionnaire et de ce que la décision de la semaine 1 change, et l'écart avec 45 est expliqué.",
    "Le mode de déploiement est justifié par la comparaison des régions et par ce que devient un client qui change de commercial.",
    "L'outil est jugé sur son usage réel et non sur le taux de saisie, et l'opposant influent reçoit un rôle qui répond à ce qu'il demande.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'indice d'adhésion est un indicateur du modèle : la source n'en donne que la valeur de départ, et l'élève estime l'effet des entretiens ; c'est le raisonnement qu'il faut corriger. Lier la prime au nombre de fiches saisies, comme le propose le directeur commercial, est une modification d'un élément de rémunération variable : selon le contrat et les règles d'attribution de la prime, elle peut demander l'accord du salarié ou une consultation ; l'épisode ne le traite pas, et l'enseignant de droit peut le relever. Le « recadrage par écrit » n'est pas une sanction disciplinaire au sens du Code du travail tant qu'il reste un rappel ; s'il en devient une, la procédure s'applique.",
};
