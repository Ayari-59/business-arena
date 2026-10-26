import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 58, LA BRIGADE À BOUT.
 *
 * Une démonstration de la Découverte (config/episodes/demos.ts) : organiser
 * une équipe autour du pic de travail plutôt qu'ajouter des heures, et juger
 * une demande commerciale sur ce qu'elle ajoute au coup de feu. Les chiffres du
 * hasard de la classe sont ceux de la graine 12, les moyennes celles des 30
 * tirages du bilan.
 */
export const FICHE: FicheEnseignant = {
  code: "brigade-a-bout",
  formations: ["bts-mhr"],
  programme: [
    "BTS MHR · Bloc 3, Management de la production de services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "En cuisine, la charge ne se mesure pas à la semaine mais au coup de feu : le travail arrive en pics, à heure fixe, et c'est le samedi soir qui fait ou défait la semaine. Une brigade s'use davantage par son organisation (services coupés, planning connu la veille) que par le volume de ses heures. L'erreur classique consiste à répondre à une brigade à bout par des heures supplémentaires pour tous, puis à tout prendre en décembre « parce que c'est la saison ». Dans l'épisode, le chef de cuisine de La Table d'Augustin de Chambéry conduit une brigade de neuf, lui compris : 248 heures supplémentaires en septembre, 11 jours d'absence, 7 % d'assiettes retournées le samedi soir contre 1,2 % le reste de la semaine, et une commis qui regarde les annonces. Les heures n'ont pas bougé depuis le printemps (62 par semaine), mais les coupures ont doublé en juin, et quatre cuisiniers envoient 90 couverts entre 20 h et 21 h 30, soit 22,5 chacun quand le repère du groupe est de 18. L'élève découvre qu'un planning bâti autour du samedi soir, une mise en place commune, des commis formés à un second poste, des groupes déplacés en semaine, une carte qui se dresse vite et deux services à heures fixes valent mieux que des heures en plus, et que chaque choix se juge sur ce qu'il fait au coup de feu.",
  objectifs: [
    "Je repère où la charge de travail se concentre, le coup de feu, au lieu de la juger sur le volume d'heures de la semaine.",
    "Je calcule une charge de pointe par personne et je la compare à un repère.",
    "Je distingue ce qui use une équipe (coupures, planning de la veille, pic sous-dimensionné) de ce qui la fait seulement travailler plus.",
    "Je juge une demande commerciale (un groupe, une carte, des couverts en plus) sur ce qu'elle ajoute au pic, et pas seulement sur le chiffre d'affaires qu'elle apporte.",
  ],
  prerequis:
    "Les notions d'effectif, de planning, d'heures supplémentaires et de ratio matière doivent être connues ; le calcul d'une marge (chiffre d'affaires moins coût matière et coût du personnel) suffit pour lire le bilan. La charge de pointe et la polyvalence peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/brigade-a-bout?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Sans licence, la démonstration se joue au niveau Découverte : un repère de méthode accompagne chaque étape, et chaque décision montre aussitôt ce qu'elle a changé par rapport à ne rien changer. Vous demandez de noter sur papier, avant de valider la semaine 1, le nombre de couverts par cuisinier au coup de feu du samedi et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (heures supplémentaires, planning, extra ou rien) et celle de la semaine 6 aux repas de groupe de décembre. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 4 : former deux commis ou recruter un saisonnier.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir du chronométrage du samedi : 90 couverts au coup de feu, quatre cuisiniers au passe, 22,5 couverts chacun. Vous faites expliquer les valeurs éloignées (30, 18 ou 75), puis vous demandez combien il faudrait de cuisiniers pour revenir au repère de 18 : cinq, soit un de plus, à prendre sur les midis creux du mardi et du mercredi.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : les heures supplémentaires pour tous contre le planning refait autour du samedi. Vous faites lire la source sur les plannings : les heures stables depuis le printemps, les coupures passées de deux à quatre par semaine, huit absences sur onze un samedi ou un lendemain de fermeture tardive. Vous enchaînez sur les groupes de décembre et faites calculer ce que rapporte un groupe un mardi (1 372 € de chiffre d'affaires, tout en plus) et un samedi soir (140 € de plus, la salle étant déjà pleine).",
    },
    {
      minutes: 10,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Organiser la brigade autour des pics » fait 124 k€ de marge pour un budget de 100 k€, « Des heures, et tout accepter » 73 k€, et ne rien changer 87 k€ : les réflexes font moins bien que l'immobilité. Vous faites chercher pourquoi, et vous montrez la seule décision où le hasard peut renverser le jugement : le saisonnier de décembre, qui protège du départ du second.",
    },
    {
      minutes: 20,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : regarder quand le travail arrive avant de juger combien il y en a. Vous la déclinez en quatre gestes : un planning stable bâti sur le pic, une mise en place commune, la polyvalence formée pendant la période creuse, et tout ce qui peut sortir du pic (groupes en semaine, services à heures fixes, carte simple) sorti du pic. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 22.5,
    etapes: [
      "Source « Chronométrer le coup de feu de samedi soir » : 120 couverts le samedi soir, dont les trois quarts partent entre 20 h et 21 h 30, soit 0,75 × 120 = 90 couverts au coup de feu.",
      "Même source : au passe, quatre cuisiniers envoient (Lubin, Sinan, Bleuenn et Yazid). Lou-Anne, du matin, est partie à 15 h, et Gabin, l'apprenti, aide à la plonge : ils ne comptent pas.",
      "Charge du coup de feu : 90 / 4 = 22,5 couverts par cuisinier. Le repère des Tables d'Augustin est de 18 : au-delà, les assiettes retournées montent en flèche.",
      "Pour revenir au repère, il faut 90 / 18 = 5 cuisiniers au passe, soit un de plus. Les midis du mardi et du mercredi en ont cinq pour 64 couverts étalés sur deux heures : c'est là qu'il se prend.",
      "Le chiffre ne dépend pas du hasard : 22,5 pour toute la classe. L'épisode le juge juste à 1 couvert près, proche à 3. Le tableau de bord de la cuisine ne montre cet indicateur qu'une fois la prévision faite : l'exercice est de le calculer à partir des sources, et de dire ce qu'il implique.",
    ],
    erreurs: [
      {
        valeur: 30,
        cause:
          "Tous les couverts du samedi soir divisés par les quatre cuisiniers (120 / 4) : la charge se mesure sur le coup de feu, pas sur la soirée.",
      },
      {
        valeur: 18,
        cause:
          "Lou-Anne comptée au passe (90 / 5) : elle est du matin et part à 15 h. Cinq cuisiniers au passe, c'est la solution, pas la situation d'aujourd'hui.",
      },
      {
        valeur: 75,
        cause:
          "Les couverts par personne et par semaine de la comparaison entre restaurants (672 couverts pour neuf personnes) : un chiffre de volume, semblable à Annecy et à Aix-les-Bains, qui ne dit rien du pic.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La brigade manque de temps le week-end : deux heures de plus pour tout le monde le vendredi et le samedi, jusqu'aux fêtes, c'est rapide et ça ne demande aucune réorganisation.",
      ceQuiLeDejoue:
        "La source sur les plannings montre que les heures supplémentaires n'ont pas bougé depuis le printemps (62 par semaine, moins de 8 par personne) ; ce qui a changé en juin, ce sont les coupures, passées de deux à quatre par semaine, et huit absences sur onze tombent un samedi ou un lendemain de fermeture tardive. Les 32 heures de plus, environ 930 € par semaine, usent la brigade sans mettre un cuisinier de plus au passe à 20 h 30. Rejouées sur les trente tirages à la place du planning refait, elles perdent 31 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "La mise en place prend du retard : faire arriver les commis une heure plus tôt paraît la façon la plus simple de l'avancer, pour 290 € par semaine.",
      ceQuiLeDejoue:
        "La source « Suivre la mise en place d'une journée » chiffre environ 22 heures par semaine de taillage, de fonds et de garnitures faits en double : le problème est l'organisation, pas l'heure d'arrivée. Une liste de production commune les supprime, à condition d'être tenue chaque jour, ce que le planning stable permet ; Yazid, lui, prévient que l'heure de plus fait des journées de seize heures le samedi. Rejouée sur les trente tirages à la place de la liste commune, l'heure plus tôt perd 12 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Quatorze repas d'entreprise, c'est la saison et un record pour Chambéry ; les groupes de décembre font l'année de beaucoup de restaurants du groupe.",
      ceQuiLeDejoue:
        "La source « Calculer ce que rapporte un groupe » le dit : un mardi, la salle a de la place et les 1 372 € sont tout en plus ; un samedi soir, elle est pleine, le groupe remplace 28 couverts à la carte et n'apporte que 140 € de chiffre d'affaires de plus. Les samedis de groupe de l'an dernier ont fini avec deux heures et demie de dépassement, deux fois plus d'assiettes retournées et deux arrêts maladie. Rejoué sur les trente tirages à la place des groupes déplacés en semaine, tout accepter perd 6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Les clients demandent du festif, et une vraie carte de fêtes fait monter le ticket moyen du soir d'environ 3 €.",
      ceQuiLeDejoue:
        "Le chronométrage du dressage donne 4 min 30 par assiette pour les plats de fêtes à la minute, contre 2 min 40 pour la carte actuelle et 2 min 10 pour une carte courte, et 2,5 points de ratio matière en plus, quand la carte courte en retire un. Le coup de feu, déjà au-dessus du repère, se charge encore. Rejouée sur les trente tirages à la place de la carte courte, la carte de fêtes perd 6,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "160 demandes par soir pour 128 couverts : refuser du monde un soir de fête paraît du chiffre d'affaires perdu.",
      ceQuiLeDejoue:
        "La source sur les réservations montre que sept demandes sur dix veulent arriver entre 20 h et 20 h 45 : en poussant les tables, la salle prend 150 couverts presque tous à la même heure. Deux services à heures fixes, 19 h et 21 h 30, prennent aussi 150 couverts, avec un coup de feu à peine plus chargé qu'un samedi ordinaire, et sans les 35 heures supplémentaires de plus par semaine. Rejoué sur les trente tirages à la place des deux services, tout prendre en poussant les tables perd 3,5 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un manque de cuisiniers, d'autres une organisation à plat. Qu'est-ce qui, dans le planning de septembre, montrait que le volume d'heures n'était pas la cause ?",
    "Pourquoi un cuisinier de plus au coup de feu, pris sur les midis creux, fait-il plus que 32 heures supplémentaires pour toute la brigade ? Que mesure chacun des deux chiffres : 22,5 couverts par cuisinier, 62 heures supplémentaires par semaine ?",
    "Un groupe de 28 rapporte 1 372 € de chiffre d'affaires en plus un mardi, et 140 € un samedi soir : comment le même client peut-il valoir presque dix fois moins selon le soir ? Et qu'est-ce qui coûte, en plus, quand il tombe sur le pic ?",
    "En semaine 4, former deux commis à un second poste rapporte le plus en moyenne ; recruter un saisonnier coûte plus, mais protège mieux si le second part. Sur les trente tirages, le saisonnier fait mieux 7 fois : lequel choisissez-vous, et sur quel critère ?",
    "Sous le tirage n° 12, ceux qui ont fait des heures et tout accepté finissent sous ceux qui n'ont rien changé (73 k€ contre 87 k€). Comment des décisions prises pour gagner plus peuvent-elles faire moins bien que l'immobilité ?",
    "Sous le tirage n° 12, Lubin est resté dans toutes les parties, même chez ceux dont la brigade finissait usée : le bilan leur donnait 85 % de risque qu'il parte, contre 16 % avec la bonne méthode. Leur résultat prouve-t-il qu'ils pouvaient prendre ce risque ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour organiser une équipe dont le travail arrive en pics ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Une crêperie sert 140 couverts le samedi midi, dont 70 % entre 12 h 15 et 13 h 30. Trois personnes travaillent aux billigs pendant ce pic ; le repère de la maison est de 25 couverts par personne au coup de feu. Le mardi midi, elle sert 60 couverts étalés sur deux heures, avec quatre personnes en cuisine. 1) Calculez la charge du coup de feu du samedi par personne. 2) Combien faut-il de personnes au pic pour tenir le repère ? 3) Première option : 12 heures supplémentaires de plus par semaine, à 25 € l'heure, réparties sur la semaine. Seconde option : déplacer une personne du mardi midi au samedi midi. Laquelle traite le pic, et que coûte chacune ? 4) Une entreprise propose un repas de 30 couverts le samedi midi, au menu à 18 € ; la salle est pleine, et un couvert à la carte rapporte 16 € en moyenne. Quel chiffre d'affaires en plus apporte-t-il le samedi ? Et un mardi, quand la salle a de la place ?",
    corrige:
      "1) 0,70 × 140 = 98 couverts au coup de feu ; 98 / 3 ≈ 32,7 couverts par personne. 2) 98 / 25 = 3,92 : il faut 4 personnes, une de plus. 3) Les heures supplémentaires coûtent 12 × 25 = 300 € par semaine et ne mettent personne de plus au pic. Déplacer une personne ne coûte rien de plus : le mardi midi passe à trois personnes pour 60 couverts étalés sur deux heures, et le samedi tombe à 98 / 4 = 24,5 couverts par personne, sous le repère. 4) Le samedi, 30 × 18 = 540 € remplacent 30 × 16 = 480 € de couverts à la carte : 60 € de plus seulement, et 30 couverts d'un bloc sur le pic. Le mardi, les 540 € sont tout en plus.",
  },
  evaluation: [
    "La charge du coup de feu est calculée juste (90 couverts, quatre cuisiniers, 22,5 par cuisinier) à partir de la source nommée, et comparée au repère de 18.",
    "Le diagnostic distingue le volume d'heures, stable depuis le printemps, de l'organisation (coupures, planning de la veille, pic sous-dimensionné), avec les chiffres des sources.",
    "Chaque demande de décembre (groupes, carte, soirs de fêtes) est jugée sur ce qu'elle ajoute au pic et sur ce qu'elle rapporte de plus, pas sur son seul chiffre d'affaires.",
    "Le choix de la semaine 4 est argumenté comme un arbitrage entre la meilleure moyenne et la protection contre le départ du second.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le modèle compte les heures supplémentaires à un coût horaire moyen, sans distinguer les tranches de majoration.",
};
