import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 46, LE RÉSEAU D'AGENCES À REDESSINER.
 *
 * Les chiffres du corrigé, des réflexes et du débrief se recalculent depuis le
 * modèle de l'épisode (src/engine/episodes/reseau-a-redessiner.ts) ; les
 * moyennes sont celles des trente tirages du bilan, le reste du meilleur
 * chemin inchangé ; ceux du hasard de la classe sont ceux de la graine 22.
 */
export const FICHE: FicheEnseignant = {
  code: "reseau-a-redessiner",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "Master de management · Stratégie d'entreprise",
    "DCG · UE 7, Management",
  ],
  notion:
    "Un réseau d'agences se gère comme un portefeuille : chaque ouverture, fermeture ou transformation se juge sur ce qu'elle change à la marge de tout le réseau, et non sur le compte d'exploitation du site. L'erreur classique est double : on ouvre un site sur un chiffre d'affaires qu'il prendra d'abord aux agences voisines (la cannibalisation), et l'on ferme une agence « en perte » après frais de siège alors que ces frais restent au réseau et qu'une partie seulement de ses clients suit à l'agence voisine (le report de clientèle). S'y ajoutent deux questions de stratégie concurrentielle : sous une demande incertaine, un format léger qui pourra grandir vaut mieux qu'un engagement complet, et ce qui dissuade un concurrent d'entrer est un engagement crédible, coûteux à défaire, pas une baisse de prix qui n'engage à rien ; ce dernier point se rattache aux travaux de Schelling et de Dixit sur l'engagement et la dissuasion à l'entrée. L'épisode fait vivre tout cela à Arvel Distribution, négoce de matériaux : en semaine 1, l'étude de zone affiche 244 k€ de résultat par an pour une agence complète à Mions, qui n'ajoute que 28 k€ au réseau, quand un simple comptoir en ajoute 40 et fait renoncer le concurrent deux fois sur trois. Le même piège revient avec Bron, dernière du classement, et avec le point de retrait de Villeurbanne-Nord, qui dépasse son plan avec les clients d'une autre agence Arvel.",
  objectifs: [
    "Je calcule la marge incrémentale d'un site pour le réseau, cannibalisation déduite, et je l'oppose au résultat que son compte d'exploitation affiche.",
    "Je juge une fermeture sur ce qu'elle change à la marge du réseau : coûts fixes propres supprimés, frais communs qui restent, part du chiffre qui suit à l'agence voisine.",
    "Je proportionne l'engagement à une demande incertaine et je distingue un engagement qui dissuade un concurrent d'une riposte qui ne l'engage à rien.",
    "Je chiffre ce que vaut une information payante avant de trancher, et je révise un plan quand un signal le dément.",
  ],
  prerequis:
    "La marge sur coûts variables, la distinction entre coûts fixes propres d'un site et frais communs répartis, l'actualisation d'une annuité constante et le calcul d'une espérance ; les notions de barrière à l'entrée et de riposte concurrentielle peuvent être découvertes en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/reseau-a-redessiner?hasard=22 : toute la classe joue le même trimestre, sous le même aléa. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous précisez seulement que le comité juge le trimestre sur la valeur créée estimée, cinq ans de marge au taux du groupe, et vous demandez de noter, à chaque décision, le chiffre qui l'a emportée.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les six décisions, de la semaine 1 à la semaine 10. Vous circulez sans répondre et relevez au tableau, sans commentaire, la marge incrémentale saisie en semaine 1 et l'option retenue pour Mions, pour Bron et pour Villeurbanne-Nord. Ceux qui finissent tôt rejouent les mêmes décisions sous un autre aléa et notent l'écart.",
    },
    {
      minutes: 15,
      titre: "Correction de la marge incrémentale de Mions",
      detail:
        "Vous affichez les estimations de la classe, de la plus haute à la plus basse : celles qui avoisinent 244 k€ reprennent le compte de l'étude, les négatives retirent trop de chiffre. Vous reconstruisez le calcul à partir de l'étude de zone et du croisement des adresses de livraison, puis vous faites expliquer l'écart de 216 k€ : c'est la marge que Saint-Priest et Vénissieux perdraient. Vous terminez par le comptoir, qui ajoute 40 k€ par an pour 80 k€ de travaux.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous partez de la décision où la classe s'est le plus divisée, le plus souvent le format à Mions ou le sort de Bron. Chaque camp défend son option, puis vous ressortez la source qui tranchait : les adresses de livraison et l'historique de Talvère pour Mions, la décomposition du compte et le devenir des clients des agences fermées pour Bron. Vous enchaînez sur Villeurbanne-Nord, où l'indicateur qui semblait confirmer le plan le démentait.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Prévenez la classe : les aléas pèsent très lourd dans cet épisode. Sous l'aléa n° 22, la zone est votée, mais Talvère s'installe malgré le comptoir (trois chances sur dix) et 41 % seulement des clients de Bron auraient suivi : la bonne méthode y crée 304 k€, 14e tirage sur 30, au-dessus de l'objectif de 150 k€, pour 360 en moyenne (689 k€ quand la zone est votée, 31 k€ quand elle ne l'est pas). Vous faites comparer, décision par décision, le résultat obtenu et ce que chaque option vaut sur les trente tirages, en commençant par Bron, puis par les contrats annuels, qui font 85 k€ de mieux sous cet aléa et 32 k€ de moins en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez les règles que l'épisode a fait éprouver : juger un site sur la marge qu'il ajoute au réseau, fermer sur les coûts qui disparaissent et les clients qui suivent, mesurer avant de couper quand le report est inconnu, commencer petit quand la demande est incertaine, dissuader par un engagement et non par un prix. Vous distribuez le cas de prolongement, à traiter en classe ou à la maison.",
    },
  ],
  calcul: {
    reponse: 28,
    etapes: [
      "D'après « Lire l'étude de zone du cabinet », une agence complète à Mions ferait 2,6 M€ de chiffre d'affaires à maturité, pour 380 k€ de coûts fixes propres par an ; le taux de marge sur coûts variables du réseau est de 24 %.",
      "D'après « Croiser les adresses de livraison et les comptes clients de la zone », les clients de la zone font déjà 1,2 M€ chez Arvel (0,8 M€ à Saint-Priest, 0,4 M€ à Vénissieux), et une agence ouverte à proximité en reprend les trois quarts : 0,75 × 1,2 = 0,9 M€.",
      "Chiffre d'affaires vraiment nouveau pour le réseau : 2,6 − 0,9 = 1,7 M€ ; marge sur coûts variables incrémentale : 24 % × 1,7 M€ = 408 k€.",
      "Marge incrémentale annuelle : 408 − 380 = 28 k€. Les 350 k€ de travaux sont un investissement, hors de la marge annuelle ; le calcul est fait hors zone d'aménagement et sans Talvère, et ne dépend pas des aléas. L'épisode le juge juste à 8 k€ près, proche à 25 k€.",
      "Contrôle : le compte d'exploitation de l'étude affiche 24 % × 2,6 M€ − 380 = 244 k€ ; l'écart de 216 k€ est la marge des 0,9 M€ repris aux voisines (24 % × 0,9 M€). Le comptoir ajoute 24 % × (1,35 − 0,6) − 140 = 40 k€ par an, plus que l'agence, pour 80 k€ de travaux au lieu de 350.",
    ],
    erreurs: [
      {
        valeur: 244,
        cause:
          "Le résultat affiché par l'étude, 24 % × 2,6 M€ − 380 k€ : tout le chiffre de l'agence est compté comme nouveau, la cannibalisation n'est pas déduite. C'est l'erreur la plus fréquente, et l'épisode la juge fausse.",
      },
      {
        valeur: -44,
        cause:
          "Tout le chiffre de la zone (1,2 M€) est retiré au lieu des trois quarts : 24 % × (2,6 − 1,2) M€ − 380 k€. On confond le chiffre fait dans la zone et la part qu'une agence en reprend.",
      },
      {
        valeur: -238.2,
        cause:
          "La valeur de l'agence sur cinq ans, travaux déduits, au lieu de la marge annuelle : 28 × 3,99 − 350. Le chiffre est juste, et instructif (sans le vote, l'agence détruit de la valeur), mais ce n'est pas la grandeur demandée.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "L'étude affiche 244 k€ de résultat par an, Talvère cherche un terrain, et le premier installé gardera la zone : il faut y être avant elle, et en grand.",
      ceQuiLeDejoue:
        "Les adresses de livraison montrent que l'agence reprendrait 0,9 M€ aux voisines : elle n'ajoute que 28 k€ par an, et sans le vote elle détruit 3,99 × 28 − 350 = −238 k€. Le comptoir ajoute 40 k€ par an pour 80 k€ de travaux et fait déjà renoncer Talvère deux fois sur trois ; sur les 30 tirages, l'agence crée 179 k€ en moyenne, le comptoir 360 k€.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Bron est dernière des trente et une à −60 k€, la direction financière veut la fermer, et Saint-Priest est prête à reprendre ses clients.",
      ceQuiLeDejoue:
        "Décomposé, le compte montre une contribution de +120 k€ : les 180 k€ de frais de siège restent au réseau. Il faut que plus de 45 % du chiffre suive pour que la fermeture paie ; les fermetures passées vont de 31 à 52 %, et moins quand un concurrent reprend le local. En espérance, fermer vaut −67 k€, tester +28,5 k€ ; sur les 30 tirages, 273 k€ contre 360 k€.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Talvère vient d'annoncer Mions dans la presse ; une baisse de prix immédiate montre qu'il n'y a pas de place pour elle.",
      ceQuiLeDejoue:
        "La baisse coûte 75 k€ sur six mois plus 25 k€ de prix qui ne remontent pas, et là où Talvère est venue malgré tout, elle a pris 11 % au lieu de 12 % ; à Vienne, elle a ouvert quand même. Avec un comptoir ouvert, elle ne vient que trois fois sur dix : sur les 30 tirages, la baisse fait 269 k€ contre 360 k€ pour l'absence de riposte.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le point de retrait dépasse son plan d'environ 40 %, le permis est obtenu et le bail signé : le test confirme la décision de juin.",
      ceQuiLeDejoue:
        "Le croisement des comptes clients montre que 70 % de ce chiffre vient de Villeurbanne et de Vaulx. Avec 50 % de clients nouveaux, l'agence ajoute 24 % × 1 M€ − 230 = 10 k€ par an, soit 3,99 × 10 − 100 = −60 k€, quand le point de retrait seul ajoute 14 k€ par an, +29 k€ dédit entier payé. Sur les 30 tirages, lancer fait 264 k€ contre 360 k€, et jamais mieux sur aucun d'eux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "C'est le meilleur emplacement de l'Est lyonnais, Talvère l'a visité, et le président veut l'acheter pour qu'elle ne l'ait pas.",
      ceQuiLeDejoue:
        "Si la zone est votée, achat et réservation mènent au même terrain au même prix ; si elle est repoussée, l'achat perd 180 k€, la réservation 35 k€ : 0,5 × (180 − 35) = 72,5 k€ de moins en espérance. Talvère n'a pas fait d'offre, et l'achat lui retire l'emplacement, pas la zone (dix points de chance en moins) ; sur les 30 tirages, 287,5 k€ contre 360 k€.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Chacun reste responsable de son compte ; neutraliser ou mutualiser, c'est payer des primes sur un chiffre qu'on n'a pas fait.",
      ceQuiLeDejoue:
        "Sous l'aléa n° 22, 1 145 k€ de chiffre passeront d'un site Arvel à un autre : jugés chacun sur son agence, les directeurs se le disputent pour 4,5 %, soit 52 k€, contre 0,6 % et 7 k€ avec une part de la prime sur le bassin. Sur les 30 tirages, 316 k€ contre 360 k€.",
    },
  ],
  debrief: [
    "L'étude de zone affiche 244 k€ de résultat par an pour l'agence de Mions, le calcul en donne 28. Qu'est-ce que le compte d'exploitation d'un site compte comme nouveau qui ne l'est pas pour le réseau ? Pourquoi le comptoir, plus petit, ajoute-t-il davantage (40 k€ pour 80 k€ de travaux) ?",
    "Un comptoir de 80 k€ fait renoncer Talvère deux fois sur trois ; une baisse de prix de 100 k€ ne la détourne pas, et ne lui retire qu'un point de part si elle vient. Qu'est-ce qui rend un engagement crédible aux yeux d'un concurrent ? Pourquoi un format léger, qui pourra devenir l'agence de la zone si le vote est positif, vaut-il mieux qu'une agence complète sous une demande à une chance sur deux ?",
    "Bron est à −60 k€ dans le classement et contribue pour +120 k€ au réseau : que deviennent ses 180 k€ de frais de siège si elle ferme ? Qui, dans la classe, a fermé sur le classement, et quelle part du chiffre fallait-il voir suivre à Saint-Priest pour que la fermeture paie ?",
    "Le test de Bron coûte 25 k€ et ne fait fermer l'agence que 9 fois sur 30 : garder Bron telle quelle le bat sur 23 tirages sur 30, et fait pourtant 27 k€ de moins en moyenne. Sous l'aléa n° 22, 41 % seulement du chiffre aurait suivi, le test a conclu à garder l'agence, et garder d'emblée a fait 25 k€ de mieux. Le bilan juge les deux choix bons : garder est l'option la plus sûre (son pire cas est meilleur), et 27 k€ restent un prix défendable au regard de l'enjeu. Lequel préférer ? Qu'achète-t-on avec 25 k€ d'information, et que rapporte-t-elle les fois où elle fait fermer (de 97 à 318 k€, sauf deux fois où un concurrent a repris le local) ?",
    "À Villeurbanne-Nord, le point de retrait dépassait son plan d'environ 40 %. Pourquoi ce signal, lu seul, poussait-il à lancer l'agence, et pourquoi, croisé avec les comptes clients, poussait-il à y renoncer ? Qu'est-ce qui rend difficile de revenir sur une décision de juin, bail signé et permis obtenu ?",
    "Pourquoi la règle des primes des directeurs d'agence fait-elle partie de la stratégie du réseau ? Que se passe-t-il quand chaque directeur est jugé sur un compte que le nouveau site cannibalise ?",
    "Sous l'aléa n° 22, la bonne méthode a créé 304 k€, au-dessus de l'objectif de 150 k€ ; sur les 30 tirages, elle en crée 360 en moyenne, de −199 à 1 081 k€ selon le vote de la zone et la décision de Talvère. Le réflexe du comité a créé 124 k€ sous cet aléa, l'attentisme a détruit 65 k€. Que conclure d'un binôme qui a acheté le terrain et fait autant que la méthode parce que la zone a été votée, ou de celui qui a signé les contrats et gagné 85 k€ de plus parce que Talvère est venue ? Sur quoi juge-t-on une décision stratégique, si ce n'est sur le résultat d'un trimestre ?",
  ],
  prolongement: {
    enonce:
      "Maison Varenne exploite quatorze boulangeries-cafés en Bretagne ; son taux de marge sur coûts variables est de 35 %, et une position se valorise sur cinq ans de marge au taux de 8 % (1 € de marge annuelle vaut 3,99 €). 1) Un nouveau quartier, les Prés-Neufs, s'ouvre à 2 km de deux boutiques du réseau, qui font aujourd'hui 900 k€ de chiffre d'affaires avec ses habitants. Un magasin complet ferait 1 200 k€ de chiffre, pour 190 k€ de coûts fixes propres par an et 300 k€ de travaux ; il reprendrait aux deux boutiques les deux tiers du chiffre qu'elles font dans le quartier. Un kiosque ferait 540 k€, pour 60 k€ de coûts fixes et 60 k€ de travaux, et en reprendrait le tiers. Calculez, pour chaque format, le résultat affiché, la marge incrémentale annuelle et la valeur sur cinq ans. 2) La boutique du centre-ville est dernière du classement : 700 k€ de chiffre, 150 k€ de coûts fixes propres, 120 k€ de frais de siège répartis. Sa fermeture coûterait 40 k€ ; la boutique voisine absorberait sans coût supplémentaire les clients qui la suivent, et lors des fermetures passées 25 à 35 % du chiffre a suivi. Faut-il la fermer ? 3) Une chaîne nationale annonce son arrivée aux Prés-Neufs ; le directeur commercial propose de baisser de 5 % pendant six mois les prix des deux boutiques voisines. Que vaut cette riposte, comparée à l'ouverture du kiosque ?",
    corrige:
      "1) Magasin : résultat affiché 0,35 × 1 200 − 190 = 230 k€ ; chiffre repris 2/3 × 900 = 600 k€, chiffre nouveau 600 k€, marge incrémentale 0,35 × 600 − 190 = 20 k€ par an ; valeur 3,99 × 20 − 300 = −220 k€. Kiosque : résultat affiché 0,35 × 540 − 60 = 129 k€ ; chiffre repris 300 k€, chiffre nouveau 240 k€, marge incrémentale 0,35 × 240 − 60 = 24 k€ par an ; valeur 3,99 × 24 − 60 = +36 k€. Le magasin affiche le meilleur résultat et détruit de la valeur ; on attend le kiosque, et la phrase qui dit pourquoi : les deux tiers de ce que vendrait le magasin sont déjà vendus par le réseau. 2) Résultat affiché 0,35 × 700 − 150 − 120 = −25 k€, mais contribution +95 k€ : les 120 k€ de frais de siège resteront, répartis sur les treize autres boutiques. La fermeture ne garde la marge annuelle que si plus de 1 − 150 / 245 = 39 % du chiffre suit (43 % en comptant les 40 k€ de fermeture sur cinq ans). Avec 30 %, la marge du réseau baisse de 0,35 × 700 × 0,70 − 150 = 21,5 k€ par an, soit 3,99 × 21,5 + 40 = 126 k€ de valeur détruite : on garde la boutique, ou l'on mesure d'abord le report. 3) La baisse coûte 5 % × 900 k€ × 6/12 = 22,5 k€ de marge, à coup sûr, et ne dit rien au concurrent : elle peut être levée le jour où il ouvre. Le kiosque, travaux engagés et bail signé, est une présence qu'on ne défait pas, et il vaut +36 k€ par lui-même : on attend que l'élève y voie un engagement crédible, et non une riposte par les prix.",
  },
  evaluation: [
    "La marge incrémentale de l'agence de Mions est posée pas à pas, la cannibalisation déduite et les travaux tenus hors de la marge annuelle, et l'écart avec le résultat affiché est expliqué.",
    "La décision sur Bron distingue les coûts fixes propres, qui disparaissent, des frais communs, qui restent, et s'appuie sur la part du chiffre qui doit suivre pour que la fermeture paie.",
    "Le choix du format à Mions et la réponse à Talvère sont justifiés par la demande incertaine et par la crédibilité de l'engagement, chiffres des sources à l'appui.",
    "L'élève dit ce que vaut l'information du test de Bron et pourquoi il a, ou non, révisé le plan de Villeurbanne-Nord au vu des comptes clients.",
    "L'élève distingue, sur le bilan des trente tirages, la qualité d'une décision de son résultat sous l'aléa de la classe.",
  ],
  vigilance:
    "La valeur d'une position est comptée sur cinq ans de marge actualisés à 8 %, sans valeur terminale, alors que le bail d'une agence court neuf ans et que la zone est donnée « pour dix ans » : un autre horizon changerait les montants, et peut-être certains écarts. Les fréquences de Talvère et la « chance sur deux » du vote sont traitées comme des probabilités connues, et l'entrée du concurrent comme un tirage qui dépend de la présence d'Arvel, non comme le choix d'un rival qui anticipe : un enseignant de stratégie voudra le signaler.",
};
