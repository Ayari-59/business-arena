/**
 * FICHE ENSEIGNANT · ÉPISODE 30, LE NOUVEAU SERVICE.
 *
 * Lancer une offre nouvelle sous incertitude : la demande ne se devine pas,
 * elle se mesure, et un petit pilote achète l'information moins cher qu'un
 * parc complet ou qu'une étude. Le piège est double : tenir la promesse faite
 * à la direction, ou attendre une information parfaite. Les chiffres du
 * hasard de la classe sont ceux de la graine 4.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "nouveau-service",
  formations: ["but-tc", "bts-mco", "but-gea"],
  programme: [
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
    "BTS MCO · Bloc 2, Animer et dynamiser l'offre commerciale",
    "BUT GEA · Aider à la prise de décision",
  ],
  notion:
    "Un client qui « aime l'idée » n'est pas un client qui achète. L'erreur classique consiste à lancer une offre nouvelle à la taille de la promesse faite à la direction, sur la foi d'un sondage d'intention, puis à piloter le lancement sur l'indicateur le plus flatteur (les demandes de devis) ; l'erreur inverse consiste à attendre une étude qui dira tout, huit semaines plus tard. Dans l'épisode, Chloé Renaud, cheffe de produit d'Arvel Distribution, lance la location de matériel de chantier : la direction veut les douze agences au trimestre et un plan à 18 locations par agence et par semaine, sans dire d'où vient ce chiffre ; un parc complet coûte 30 k€ par agence, 360 k€ pour les douze. Le sondage du marketing donne 78 % d'artisans intéressés, sans demander ni prix ni fréquence ; au comptoir, 31 artisans sur 40 se disent intéressés, mais 11 seulement ont loué quelque chose le mois dernier. Ferlane Location fait de 8 à 16 locations par semaine selon les mois, et une agence équipée a besoin d'une dizaine de locations par semaine pour couvrir ses 850 € de frais. L'élève découvre que la demande du trimestre est inconnue (faible, moyenne ou forte), qu'un pilote dans deux agences la mesure pour 28 k€ de matériel, que le terrain révèle ce qu'aucune étude ne montre (caution, retours en retard, bétonnières sales), qu'une demande de devis sur trois seulement devient une location, et qu'on n'étend que ce qu'on a bien mesuré, avec des seuils fixés d'avance.",
  objectifs: [
    "Je distingue une intention déclarée (« l'idée m'intéresse ») d'un comportement mesuré (« j'ai loué le mois dernier »).",
    "Je calcule le seuil de rentabilité d'un point de vente du service et je le compare à la demande probable.",
    "Je choisis un test (un pilote limité) qui achète de l'information à moindre coût avant d'engager tout l'investissement.",
    "Je choisis des indicateurs qui mesurent la valeur (utilisation du parc, marge par location, clients qui reviennent) plutôt que l'activité (demandes de devis).",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions d'étude de marché, d'offre de services, de marge et de seuil de rentabilité doivent avoir été vues en cours. Le test de marché, la valeur de l'information et le taux d'utilisation d'un parc peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/nouveau-service?hasard=4 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation du nombre de locations qu'une agence équipée fera par semaine, au prix prévu, une fois le service connu, et les sources qui la justifient, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la façon de lancer en semaine 1 (douze agences, six agences, le pilote, l'étude) et les indicateurs choisis en semaine 2. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 2 : suivre les demandes de devis au lieu de l'utilisation du parc.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées et vous les rangez par source : le plan de la direction (18), la fourchette de Ferlane (8 à 16), le comptoir (11 artisans sur 40 qui louent), le sondage. Vous faites dire laquelle mesure un comportement et laquelle une intention. Puis vous révélez ce que le trimestre a tiré : 10,3 locations par agence et par semaine, une demande « moyenne », juste au-dessus du seuil d'une dizaine. Vous insistez : le chiffre ne dépend d'aucune décision, mais seul un service lancé permet de le mesurer.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et ceux de la semaine 6 sur l'extension. Les élèves qui ont lancé les douze agences défendent leur choix (Ferlane encaisse chaque mois qui passe), puis la classe refait le calcul du parc : 360 k€ de matériel pour une demande inconnue, quand le pilote en engage 28. Vous enchaînez sur les devis de la semaine 2 : une demande de devis sur trois devient une location, et un artisan qui compare trois loueurs fait trois devis.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 4, « Tester, mesurer, étendre » finit à l'équilibre (+0,2 k€), « Attendre l'étude » à −16 k€, le prix de l'étude, et « Tenir la promesse » à −99,1 k€ ; sur les trente tirages, la première méthode finit au-dessus de zéro 15 fois, pour +7,8 k€ en moyenne, la promesse jamais. Vous montrez la décision où le hasard renverse le plus souvent le jugement : lancer les douze agences fait mieux que le pilote 11 fois sur 30, quand la demande tirée est forte ; et il perd jusqu'à des dizaines de milliers d'euros quand elle est faible.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : mesurer avant d'engager, et n'étendre que ce qu'on a bien mesuré. Vous la déclinez en trois gestes : un pilote qui achète l'information pour peu, des indicateurs de valeur et non d'activité, des seuils d'extension et de fermeture écrits avant de regarder les chiffres. Vous ajoutez ce que le terrain apprend et qu'aucune étude ne montre : la caution, le contrôle au retour, le forfait demi-journée, le nettoyage annoncé. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 10.3,
    etapes: [
      "Écarter ce qui ne mesure pas la demande : le plan de la direction (18 locations par agence et par semaine) « ne dit pas d'où vient ce chiffre » ; le sondage (78 % d'intéressés, 64 % qui l'utiliseraient « sûrement » ou « probablement ») ne demandait ni prix ni fréquence.",
      "Ce qui mesure un comportement : chez Ferlane, chaque agence fait de 8 à 16 locations par semaine selon les mois, sur les mêmes références ; au comptoir, 11 artisans sur 40 ont loué quelque chose le mois dernier, deux jours et demi en moyenne, et ils paieraient « un peu moins que Ferlane ». Une estimation raisonnable se place dans la fourchette de Ferlane, vers son milieu : une douzaine de locations, plutôt moins pour un nouvel entrant.",
      "Ce que dit le seuil : une agence équipée coûte environ 850 € par semaine et a besoin d'une dizaine de locations pour couvrir ses frais. L'estimation est donc proche du seuil : c'est exactement la situation où il faut mesurer avant d'équiper douze agences.",
      "Ce que le trimestre a tiré : la demande réelle est tirée au hasard pour chaque trimestre, entre 4 et 19 locations par agence et par semaine. Sous le tirage n° 4, elle est de 10,3 locations, une demande « moyenne ». L'épisode juge juste à 2 locations près, proche à 4 : une estimation de 12, au milieu de la fourchette de Ferlane, est juste.",
      "Le chiffre ne dépend d'aucune décision : il est le même pour toute la classe, quelle que soit la façon de lancer. Ce qui change, c'est le moment où on l'apprend : le pilote le mesure à peu près dès la semaine 6 ; l'étude, en semaine 9 ; les douze agences, après avoir acheté tout le parc.",
    ],
    erreurs: [
      {
        valeur: 18,
        cause:
          "Le plan de la direction pris pour une prévision : il ne dit pas d'où vient ce chiffre, au-dessus même du haut de la fourchette de Ferlane, loueur installé.",
      },
      {
        valeur: 16,
        cause:
          "Le haut de la fourchette de Ferlane retenu, comme si un nouvel entrant faisait d'emblée le meilleur mois du loueur qui tient le marché, sans les quatre agences ni la clientèle de Ferlane.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le comité a validé, la direction veut les douze agences, et chaque mois qui passe, « c'est Ferlane qui encaisse » : lancer partout en semaine 4 tient la promesse.",
      ceQuiLeDejoue:
        "Le comptoir montre que l'intérêt (31 sur 40) n'est pas la location (11 sur 40) ; Ferlane fait de 8 à 16 locations par semaine, et une agence équipée en demande une dizaine pour couvrir ses 850 € de frais. Jeanne Bellamy prévient : 360 k€ de matériel, « je ne le passerai pas à sa valeur d'achat s'il ne tourne pas ». Idrissa Sangaré : « Le moins cher pour l'apprendre, c'est rarement une étude. » Rejoué sur les trente tirages à la place du pilote, le lancement dans les douze agences perd 27,8 k€ en moyenne ; il fait mieux 11 fois, quand la demande tirée est forte.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Les demandes de devis, c'est ce que regarde la direction et le meilleur signe de la demande : le chiffre monte vite.",
      ceQuiLeDejoue:
        "La source « Comparer les demandes de devis et les locations » : une demande de devis sur trois devient une location, les devis suivent la publicité et les relances, et « un artisan qui compare trois loueurs fait trois devis ». Idrissa dit ce que suivent les loueurs : l'utilisation du parc (en dessous de 50 %, il ne paie pas), la marge par location, les clients qui reviennent. Suivre les devis surestime la demande, et fait étendre trop. Rejoué sur les trente tirages à la place des trois indicateurs, il perd 12,3 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le démarrage est mou et le comité approche : une baisse de 15 % fait décoller les locations, et la direction la réclame.",
      ceQuiLeDejoue:
        "Les six artisans appelés le disent : « Le prix leur va, à peu près. » Ce qui les gêne, c'est la caution en chèque, l'absence de forfait demi-journée, le matériel attendu qui n'est pas revenu. La matinée au retour du matériel montre où part la marge : un matériel sur quatre en retard, quarante minutes pour une bétonnière sale, la casse découverte au client suivant. La baisse fait payer 15 % de moins à ceux qui louaient déjà, et le parc n'en loue pas plus quand il est déjà dehors. Rejouée sur les trente tirages à la place de l'offre ajustée, elle perd 27 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le comité veut les douze agences, le fournisseur livre la semaine prochaine : équiper partout profite de la demande là où elle est.",
      ceQuiLeDejoue:
        "Jeanne a fait le calcul des seuils : une agence qui ouvre maintenant ne rembourse son lancement et son parc dans le trimestre qu'au-dessus de 13 locations par semaine, et perd de l'argent sous 5 ; les agences ne se valent pas (Saint-Priest ou Villeurbanne un tiers au-dessus de la moyenne, Tassin ou Villefranche un quart en dessous). Équiper partout ouvre aussi les agences où la demande ne paie pas le parc. Rejoué sur les trente tirages à la place de l'extension selon les seuils, il perd 32 k€ en moyenne ; il fait mieux 5 fois, quand la demande est forte partout.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Ferlane baisse ses prix de 15 % à côté de nos agences : sans s'aligner, on perd nos clients pour quinze pour cent.",
      ceQuiLeDejoue:
        "Les artisans disent pourquoi ils louent chez Arvel : sept sur dix parce qu'ils chargent le matériel avec leurs matériaux, à 6 h 30, sur la même facture, au vendeur qu'ils connaissent ; « le prix vient après ». Ludovic Pasquier : « Ferlane ouvre à 7 h 30. Moi, à 7 h 30, je suis sur le toit. » S'aligner retire 15 % à chaque location pour défendre un avantage qui n'est pas le prix. Rejoué sur les trente tirages à la place de la réservation au vendeur et du retrait à 6 h 30, l'alignement perd 7,7 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Le comité veut des chiffres qui donnent envie : un e-mailing aux 9 000 artisans fera s'envoler les demandes de devis.",
      ceQuiLeDejoue:
        "Les devis s'envolent, mais « beaucoup demandent du matériel qu'on n'a pas, ou dans une agence qui ne loue pas ». La source sur les clients qui reviennent montrait la bonne cible : ceux qui reviennent achètent aussi un tiers de panier en plus en matériaux, et la moitié de ceux qui ne sont pas revenus n'ont jamais été rappelés, plusieurs avec un chantier en cours. Rejoué sur les trente tirages à la place des rappels avec le pack chantier, l'e-mailing perd 6,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Personne ne sait ce que loueraient les artisans : une étude de 400 entretiens et une analyse de Ferlane le diront avant de dépenser quoi que ce soit.",
      ceQuiLeDejoue:
        "L'étude coûte 16 000 € et rend ses résultats en semaine 9, pour un parc livrable en semaine 10 : le trimestre est presque fini, sans aucune location, et Ferlane ouvre entre-temps un point de retrait à Bron. Elle mesure la demande, mais pas ce que le terrain apprend (la caution, les retours, le nettoyage). Le pilote mesure pour 28 k€ de matériel qui loue déjà. Rejouée sur les trente tirages à la place du pilote, l'étude perd 27,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Les agences ont assez de tableaux : on fera le bilan à la fin du trimestre.",
      ceQuiLeDejoue:
        "Jeanne l'a dit avant le démarrage : « Ce qui n'est pas saisi au comptoir dès le premier jour ne se reconstitue pas après. » Sans tableau, la décision d'extension de la semaine 6 se prend à l'impression, souvent enthousiaste. Le paramétrage des trois indicateurs coûte 1 000 €. Rejoué sur les trente tirages à la place du tableau, ne rien suivre perd 4 k€ en moyenne ; il fait mieux 9 fois, quand l'impression tombe juste.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Quatre semaines, c'est trop tôt pour juger : mieux vaut garder l'offre de départ.",
      ceQuiLeDejoue:
        "Le terrain a déjà parlé : trois bétonnières au béton durci, un échafaudage rendu avec deux jours de retard, un perforateur en panne depuis on ne sait quand, et un plateau fissuré reloué le lendemain. Chaque location perd une part de sa marge, chaque retard bloque la suivante, et un matériel reloué sans contrôle peut un jour blesser quelqu'un. La check-list et la nouvelle grille coûtent 1 800 €. Rejoué sur les trente tirages à la place de l'offre ajustée, ne rien changer perd 22,3 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "On aura plus de recul au trimestre prochain : ni extension ni fermeture d'ici là.",
      ceQuiLeDejoue:
        "Le recul est là : le tableau donne la demande par agence, et les seuils de Jeanne disent où ouvrir (au-dessus de 13 locations attendues) et où fermer (sous 5). Attendre laisse fermées les agences où la demande paierait le parc, et ouvertes celles où il dort. Rejoué sur les trente tirages à la place de l'extension selon les seuils, garder le dispositif perd 11,4 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Nos clients ne sont pas ceux de Ferlane : inutile de réagir.",
      ceQuiLeDejoue:
        "Nassim Cherif voit partir trois habitués chez Ferlane la semaine suivante. L'avantage d'Arvel existe (le retrait à 6 h 30 avec les matériaux, la même facture, le vendeur habituel), mais il faut le rendre visible : un module de réservation au comptoir et une heure de formation, 1 200 €. Rejoué sur les trente tirages à la place de cette réponse, ne pas réagir perd 6,5 k€ en moyenne ; il fait mieux 4 fois.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Les chiffres parleront d'eux-mêmes au comité : inutile d'en faire plus.",
      ceQuiLeDejoue:
        "La moitié des artisans qui ne sont pas revenus n'ont jamais été rappelés, et ceux qui reviennent achètent un tiers de matériaux en plus. Une demi-journée d'appels par agence et un « pack chantier » coûtent 800 €. Rejoué sur les trente tirages à la place des rappels, ne rien changer perd 3,1 k€ en moyenne ; il fait mieux 6 fois.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un concurrent à battre, d'autres une course de vitesse, d'autres une demande inconnue. Quelles sources mesuraient ce que les artisans font, et lesquelles ce qu'ils disent ?",
    "78 % d'intéressés au sondage, 11 artisans sur 40 qui ont loué le mois dernier. Pourquoi les deux chiffres ne disent-ils pas la même chose ? Lequel faut-il mettre face au seuil d'une dizaine de locations par agence ?",
    "Le pilote coûte 28 k€ de matériel et 4 000 € de lancement, l'étude 16 000 €, les douze agences 360 k€. Qu'achète chacun ? Qu'est-ce que le pilote apprend que l'étude n'apprend pas ?",
    "Une demande de devis sur trois devient une location. Pourquoi le compteur de devis est-il toujours flatteur ? Que se passe-t-il quand on étend « selon les résultats » en suivant les devis ?",
    "Sur les trente tirages, lancer les douze agences fait mieux que le pilote 11 fois, quand la demande tirée est forte. Sous le tirage n° 4, la demande était moyenne. Ceux qui ont tout lancé avaient-ils pris une mauvaise décision, même les fois où elle a gagné ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Ferlane baisse ses prix, puis propose un partenariat. Sur quoi Arvel gagne-t-il ses clients, d'après la source sur les artisans ? Dans quel cas le partenariat aurait-il été la meilleure réponse ?",
    "Quelle règle gardez-vous pour lancer une offre nouvelle ? Formulez-la en une phrase, avec un seuil dedans.",
  ],
  prolongement: {
    enonce:
      "Une enseigne envisage un service de location dans ses 12 agences. Une agence équipée d'un parc complet coûte 850 € par semaine (amortissement, financement, temps de comptoir). Une location est facturée 95 € ; la casse, le nettoyage et le transport en coûtent 25 €, et elle fait vendre en moyenne 15 € de marge sur des matériaux. La demande est inconnue : 6, 11 ou 16 locations par agence et par semaine, avec une chance sur trois chacune. 1) Calculez la marge par location et le seuil de rentabilité d'une agence, en locations par semaine. 2) Calculez le résultat hebdomadaire d'une agence dans chaque scénario. 3) Équiper les 12 agences pour 13 semaines : calculez le résultat dans chaque scénario, puis son espérance. 4) Un pilote dans 2 agences, avec un petit parc à 400 € par semaine et une capacité de 11 locations, coûte combien, ou rapporte combien, sur 13 semaines dans chaque scénario ? Que permet-il de décider ?",
    corrige:
      "1) Marge par location : 95 − 25 + 15 = 85 € ; seuil : 850 / 85 = 10 locations par semaine. 2) 6 locations : 6 × 85 − 850 = −340 € ; 11 : 935 − 850 = +85 € ; 16 : 1 360 − 850 = +510 €. 3) 12 agences × 13 semaines = 156 semaines d'agence : −340 × 156 = −53 040 € ; +85 × 156 = +13 260 € ; +510 × 156 = +79 560 €. Espérance : (−53 040 + 13 260 + 79 560) / 3 = 13 260 €, avec une chance sur trois de perdre plus de 53 k€. 4) Par agence pilote et par semaine : 6 × 85 − 400 = +110 € dans le scénario bas ; 11 × 85 − 400 = +535 € dans les deux autres (la capacité plafonne à 11). Sur 13 semaines et 2 agences : +2 860 € ou +13 910 €. Le pilote ne perd dans aucun scénario, et il dit lequel est le vrai : on équipe les autres agences si la demande dépasse le seuil, on s'arrête sinon, et l'on évite les 53 k€ de perte du scénario bas.",
  },
  evaluation: [
    "Les sources de la semaine 1 sont triées : l'élève distingue ce qui mesure un comportement (le comptoir, Ferlane) de ce qui mesure une intention (le sondage) ou une ambition (le plan).",
    "L'estimation de la demande est justifiée par les sources et comparée au seuil d'une dizaine de locations, et l'élève explique pourquoi le chiffre réel (10,3) ne se connaît qu'en lançant.",
    "Le mode de lancement est choisi en comparant ce que chaque option engage et ce qu'elle apprend (pilote, étude, parc complet).",
    "Les indicateurs suivis mesurent la valeur du service (utilisation, marge par location, retours), et l'extension s'appuie sur des seuils fixés d'avance.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 4.",
  ],
  vigilance:
    "La prévision n'est pas un calcul : la demande réelle est tirée au hasard pour chaque trimestre (entre 4 et 19 locations), et le corrigé de 10,3 est celui du tirage n° 4. Toute estimation argumentée entre 8,3 et 12,3 est jugée juste ; c'est le tri des sources qu'il faut évaluer. L'épisode évoque un échafaudage reloué avec un plateau fissuré : la location de matériel de chantier engage la responsabilité du loueur sur l'état du matériel remis, et les échafaudages sont soumis à des vérifications réglementaires ; un enseignant peut le rappeler sans entrer dans le détail.",
};
