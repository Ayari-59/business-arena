/**
 * FICHE ENSEIGNANT · ÉPISODE 20, L'AGENDA QUI DÉBORDE.
 *
 * Délégation et gestion du temps d'un manager : quand tout passe par lui, c'est
 * l'attente qui coûte. Déléguer par paliers avec un cadre écrit, protéger
 * l'important. Le piège : travailler plus, ou tout déléguer d'un coup sans cadre.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "agenda-qui-deborde",
  formations: ["bts-mco", "bts-sam", "bts-gpme"],
  programme: [
    "BTS MCO · Bloc 4, Manager l'équipe commerciale",
    "BTS SAM · Bloc 1, Optimisation des processus administratifs",
    "BTS GPME · Bloc 4, Soutenir le fonctionnement et le développement de la PME",
  ],
  notion:
    "Un manager par qui tout passe devient le goulot de son organisation : les dossiers attendent sa signature, et c'est l'attente, plus que le travail, qui coûte. L'erreur classique consiste à travailler plus, ou à se débarrasser de tout d'un coup sans dire jusqu'où chacun peut décider. Dans l'épisode, Clovis Lemaistre dirige l'agence Arvel Distribution de Genas, quatorze personnes : il travaille 61 heures par semaine, 64 dossiers attendent sa signature depuis 3,9 jours, le drive n'avance pas et aucun entretien annuel n'est fait. Le relevé de son agenda montre 14 heures de réunions, 9 d'interruptions et 38 heures à signer 82 dossiers, dont sept sur dix sont des devis de moins de 5 000 € ou des plannings que ses adjoints ont déjà préparés. Les devis signés en moins de deux jours se transforment à 58 %, au-delà de trois jours à 31 %. L'élève découvre qu'une délégation par paliers avec un cadre écrit (un seuil, un contrôle par sondage) vide le bureau sans perdre la maîtrise, que des réunions courtes avec un ordre du jour rendent du temps à tous, qu'un projet avance quand on le confie à celui dont c'est le terrain, et qu'une erreur de délégué se traite en corrigeant la règle, pas en reprenant tout.",
  objectifs: [
    "J'analyse un agenda pour séparer ce qui demande ma décision de ce qui peut être délégué.",
    "J'estime l'évolution d'une file de dossiers à partir des arrivées, de ce que je délègue et du temps qu'il me reste.",
    "Je délègue par paliers avec un cadre écrit : un périmètre, un seuil, un contrôle, un point régulier.",
    "Je traite une erreur de délégation en cherchant sa cause et en ajustant la règle, sans reprendre toute la délégation.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de délégation, de priorité et de réunion efficace doivent avoir été vues en cours. La relation entre la file d'attente et le délai, et la délégation par paliers, peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/agenda-qui-deborde?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le nombre de dossiers qui attendront sur le bureau de Clovis en fin de semaine 2 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : le choix de la semaine 1 (travailler plus, déléguer par paliers, tout déléguer, tenir) et la réaction au devis Aubrac en semaine 8, où la classe se partage souvent. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 1 : tout déléguer d'un coup au lieu des paliers.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le calcul : 82 dossiers arrivent chaque semaine, Clovis en traite environ un toutes les 28 minutes sur le temps que lui laissent réunions, interruptions et formation de ses adjoints, et la délégation monte par paliers (un quart des devis et plannings la première semaine, près de la moitié la deuxième). La file baisse en semaine 2, vers 55 dossiers dans une semaine ordinaire ; sous le tirage n° 12, la semaine 2 est calme et le modèle donne 44,5. Vous montrez que « travailler plus » donne une file plus courte en semaine 2 (19), puis plus de 100 dossiers en semaine 9.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 sur le drive (vos demi-journées, Tariq, le soir, plus tard) et de la semaine 8 après le devis Aubrac. Vous faites lire l'écoute des adjoints (« Personne ne m'a jamais dit jusqu'où je pouvais décider ») et la reprise du devis avec Gwenaëlle : la règle disait 5 000 € par devis, pas par chantier. Vous faites formuler par la classe la règle qui aurait suffi.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Déléguer avec un cadre, protéger l'important » finit 37,5 k€ au-dessus du budget de marge nette, « Travailler plus, tout contrôler » 79,6 k€ en dessous et l'attentisme 126,4 k€ en dessous ; sur les trente tirages, la première méthode tient le budget 28 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur le drive : bloquer deux demi-journées dans son agenda fait mieux 10 fois sur 30 que de le confier à Tariq, et perd en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la question d'Hortense Valadier : qu'est-ce qui n'a pas besoin de passer par moi ? Vous la déclinez en quatre gestes : déléguer par paliers avec un seuil et un contrôle par sondage, alléger les réunions, confier un projet à celui dont c'est le terrain avec un point d'étape, et corriger la règle quand un délégué se trompe. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 45,
    etapes: [
      "Alerte du lundi : 64 dossiers en attente. Source « Relever une semaine de votre agenda » : sur 61 heures, 14 de réunions, 9 d'interruptions et 38 pour signer 82 dossiers, soit environ 28 minutes par dossier. Les devis font 45 % des dossiers et les plannings 30 %.",
      "La délégation par paliers ne vide pas le bureau d'un coup : les adjoints signent environ un quart des devis et des plannings la première semaine, près de la moitié la deuxième, et renvoient encore à Clovis une partie de ce qu'ils ne savent pas trancher. Net, environ 15 % des dossiers lui échappent en semaine 1 et près de 30 % en semaine 2. Les six heures par semaine pour former ses adjoints sont prises sur son temps.",
      "Semaine 1 : il reçoit encore les trois quarts de 82 dossiers et en traite à peu près autant : la file reste autour de 65. Semaine 2 : il ne reçoit plus que 70 % des arrivées et traite environ 70 dossiers : la file baisse d'une dizaine à une vingtaine de dossiers, vers 55 dans une semaine ordinaire.",
      "Sous le tirage n° 12, la semaine 1 est chargée (87 arrivées, file à 66,4) et la semaine 2 calme (67 arrivées, environ 20 % de moins) : le modèle donne 44,5 dossiers en fin de semaine 2. Avec « travailler plus », il donne 19,4 ; sans rien changer, 52,5.",
      "L'épisode juge juste à 8 dossiers près, proche à 20. Selon les trente tirages du bilan, la meilleure méthode donne de 32,6 à 77,4 dossiers en fin de semaine 2 : le chiffre dépend beaucoup du nombre d'arrivées de la semaine.",
    ],
    erreurs: [
      {
        valeur: 25,
        cause:
          "L'objectif de 25 dossiers au plus pris pour la prévision, comme si la délégation était complète dès la première semaine : elle monte par paliers, et former les adjoints prend du temps.",
      },
      {
        valeur: 64,
        cause:
          "Le chiffre du lundi reporté tel quel, comme si déléguer ne changeait rien en deux semaines : près de 30 % des dossiers ne passent plus par Clovis en semaine 2.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "La pile est là : arriver à 6 h 30 et passer le samedi sur les dossiers, ça ne coûte rien à l'agence.",
      ceQuiLeDejoue:
        "Le relevé de l'agenda : sept dossiers sur dix sont des devis de moins de 5 000 € ou des plannings que les adjoints ont déjà préparés. Travailler plus vide la pile deux semaines, puis la fatigue allonge chaque dossier et multiplie les erreurs, signées le soir ; les adjoints attendent toujours ses réponses. Hortense Valadier : « Avant de travailler plus, regarde ce qui n'a pas besoin de passer par toi. » Rejoué sur les trente tirages à la place de la délégation par paliers, il perd 29,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi: "Déléguer, c'est bien : autant tout confier dès lundi, chaque adjoint signe son secteur, et le bureau se vide.",
      ceQuiLeDejoue:
        "L'écoute des adjoints : Gwenaëlle ne peut pas accorder 3 % sans Clovis, et Tariq dit que personne ne lui a jamais dit jusqu'où il pouvait décider. Sans cadre, la moitié de ce qu'ils ne savent pas trancher revient sur le bureau, et deux remises de 12 % partent sans que personne ne les voie. Rejoué sur les trente tirages à la place de la délégation par paliers, il perd 20,6 k€ en moyenne, 47,7 k€ sous le tirage de la classe, et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi: "Pour garder la main sur ce qu'on délègue : un point d'une heure chaque soir avec les adjoints.",
      ceQuiLeDejoue:
        "Le compte du temps en réunion : la réunion du lundi mobilise quatorze personnes 2 h 30, soit 35 heures par semaine, et la moitié des sujets ne concernent que deux ou trois personnes. Ajouter cinq heures par semaine pour lui et ses adjoints va dans le mauvais sens ; Tariq finit ses plannings après 19 heures. Rejoué sur les trente tirages à la place d'un point de quinze minutes et d'une réunion de 45 minutes, il perd 21,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi: "Le drive avancera le soir et le week-end, quand l'agence est calme, sans toucher aux journées.",
      ceQuiLeDejoue:
        "La liste de ce qui reste : 28 heures de travail, rien de bloquant, « il manque quelqu'un qui y consacre du temps chaque semaine ». Tariq : « Le drive, c'est ma cour et mes caristes. Si tu me le confies, il me faut une demi-heure avec toi chaque semaine. » Le soir, fatigué, on avance moins vite, et l'ouverture de la semaine 9 ne bougera pas. Rejoué sur les trente tirages à la place du pilotage confié à Tariq, il perd 11,8 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi: "La campagne sera bouclée à temps : tous les entretiens en une journée, avec le formulaire.",
      ceQuiLeDejoue:
        "Les entretiens de l'an dernier avaient été faits ainsi, en une journée de décembre, et rien n'a été suivi : Gwenaëlle demandait déjà « plus de responsabilités, et de pouvoir signer ». Mireille Dupuy rappelle que le groupe recommande que chacun soit reçu par son responsable direct, une heure et demie préparation comprise. Rejoué sur les trente tirages à la place des entretiens confiés aux adjoints préparés, il perd 3,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi: "Un devis presque sans marge : reprendre la signature de tous les devis, plus rien ne part sans visa.",
      ceQuiLeDejoue:
        "La reprise du dossier avec Gwenaëlle : la règle disait 5 000 € par devis, pas par chantier, et le reste de ses devis est juste ; un double regard au-delà de 15 000 € par chantier aurait suffi. Tout reprendre remet le directeur au centre de la file et retire à son adjointe la confiance gagnée en deux mois. Rejoué sur les trente tirages à la place de la règle ajoutée, il perd 5,2 k€ en moyenne, 32,8 k€ sous le tirage de la classe, et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi: "Un compromis : les adjoints continuent de signer, et on relit tout, le soir, avant envoi.",
      ceQuiLeDejoue:
        "Relire tout, c'est reprendre le temps qu'on avait libéré, le soir, fatigué, et dire aux adjoints qu'on ne leur fait pas confiance : Tariq le dit, « Si tu relis tout, à quoi ça sert que je signe ? ». La cause de l'erreur était une règle mal posée, pas un manque de contrôle général. Rejoué sur les trente tirages, il perd 2,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "60 000 € de matériaux : monter l'offre soi-même, le soir et le samedi, pour qu'elle soit irréprochable.",
      ceQuiLeDejoue:
        "Le cahier des charges demande douze heures, des prix ligne à ligne sur 140 références, et Bilal le dit : celle qui connaît les prix nets et les artisans du chantier, c'est Gwenaëlle. Les deux marchés de l'an dernier, montés par le directeur dans l'urgence, ont été perdus sur le prix des isolants, que les vendeurs connaissaient mieux que lui. Rejoué sur les trente tirages à la place de l'offre confiée à Gwenaëlle avec un prix plancher, il perd 6,1 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu trop de réunions, d'autres des adjoints pas au niveau, d'autres un manque d'encadrement. Que montrait le relevé de l'agenda, et pourquoi la comparaison des effectifs était-elle du bruit ?",
    "Pourquoi l'attente coûte-t-elle plus que le travail ? Que deviennent les devis signés après trois jours, et les plannings validés après 16 heures ?",
    "« Travailler plus » donne la file la plus courte en semaine 2, puis la plus longue en fin de trimestre. Qu'est-ce qui, dans le modèle et dans la vie, transforme des heures en plus en erreurs et en absence ?",
    "Tout déléguer d'un coup et déléguer par paliers vident tous deux le bureau. Qu'est-ce qu'un cadre écrit change pour celui qui reçoit la délégation ?",
    "Après le devis Aubrac, reprendre toutes les signatures paraît prudent. Pourquoi est-ce, ici, la réaction la plus coûteuse ? Quelle règle aurait suffi, et qui pouvait la trouver ?",
    "Bloquer deux demi-journées pour piloter soi-même le drive fait mieux 10 fois sur 30 que de le confier à Tariq. Sur quoi fondez-vous votre choix, quand vous ne savez pas comment Tariq tiendra ?",
    "Quelle règle gardez-vous pour un agenda qui déborde ? Formulez-la en une phrase, avec ce qui n'a pas besoin de passer par vous.",
  ],
  prolongement: {
    enonce:
      "Un directeur d'agence travaille 61 heures par semaine : 14 heures de réunions, 9 heures d'interruptions, et 38 heures pour signer 82 dossiers. 45 % des dossiers sont des devis et 30 % des plannings. 1) Combien de minutes passe-t-il en moyenne par dossier ? 2) Il confie à ses adjoints 70 % des devis et des plannings, et contrôle un dossier délégué sur cinq, en y passant moitié moins de temps qu'à le signer. Combien d'heures de signature et de contrôle lui reste-t-il, et combien en libère-t-il ? 3) Les devis signés en moins de deux jours se transforment à 58 %, ceux qui attendent plus de trois jours à 31 %. Pour 36 devis par semaine d'un montant moyen de 3 000 €, combien de chiffre d'affaires signé de plus par semaine apporte le passage de plus de trois jours à moins de deux ?",
    corrige:
      "1) 38 / 82 ≈ 0,463 heure, soit environ 28 minutes par dossier. 2) Dossiers délégués : 0,70 × 0,75 × 82 ≈ 43 ; il en signe encore 82 − 43 = 39, soit 39 × 0,463 ≈ 18 heures. Il en contrôle 43 / 5 ≈ 8,6, à 0,23 heure chacun, soit environ 2 heures. Total : environ 20 heures, au lieu de 38 : il en libère environ 18. 3) (0,58 − 0,31) × 36 × 3 000 = 0,27 × 108 000 = 29 160 € de chiffre d'affaires signé de plus par semaine.",
  },
  evaluation: [
    "La prévision de la semaine 1 tient compte des arrivées, de la montée de la délégation par paliers et du temps que la formation des adjoints prend au directeur.",
    "Le diagnostic s'appuie sur le relevé de l'agenda et la mesure de l'attente, et écarte la comparaison des effectifs.",
    "La délégation choisie est décrite avec son cadre : un périmètre, un seuil, un contrôle par sondage, un point régulier.",
    "La réponse à l'erreur de délégation cherche la cause et ajuste la règle plutôt que de reprendre tout le pouvoir de signature.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "L'« entretien annuel » de l'épisode est l'entretien d'évaluation pratiqué par le groupe ; il ne se confond pas avec l'entretien professionnel prévu par le code du travail, qui a son propre rythme et son propre contenu : à préciser aux élèves. Les 61 heures par semaine d'un directeur posent la question des durées maximales et des repos, selon son statut (cadre au forfait ou non), que l'épisode ne traite pas.",
};
