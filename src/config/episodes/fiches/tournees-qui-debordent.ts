/**
 * FICHE ENSEIGNANT · ÉPISODE 17, LES TOURNÉES QUI DÉBORDENT.
 *
 * Organisation des tournées de livraison : remplir les tournées (créneaux
 * réalistes, regroupement par secteur, confirmation la veille) avant d'acheter
 * de la capacité. Le piège : un camion de plus, des heures, tout au sous-traitant.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "tournees-qui-debordent",
  formations: ["seconde-pro-gatl", "bac-pro-mcv", "bts-mco"],
  programme: [
    "2de pro GATL · 2, Organiser et planifier l'activité, et 4, Traiter les flux physiques en relation avec les données de gestion",
    "Bac pro MCV · Bloc 2, Suivre les ventes",
    "BTS MCO · Bloc 3, Assurer la gestion opérationnelle",
  ],
  notion:
    "Quand les livraisons débordent, le réflexe est d'acheter de la capacité : un camion de plus, des intérimaires, des heures supplémentaires, tout le surplus au sous-traitant. Or une tournée coûte surtout par son existence, et un arrêt de plus dans une tournée qui passe déjà dans le secteur ne coûte presque rien : la vraie capacité se trouve dans le nombre d'arrêts par tournée. Dans l'épisode, Farid Bensaïd, responsable transport d'Arvel Distribution pour la région lyonnaise, a 13 % de livraisons en retard pour un objectif de 8 %, un coût de 98 € par livraison pour un budget de 92 €, et 42 heures supplémentaires par semaine. L'analyse des tournées montre 5,4 arrêts par tournée contre 7,2 il y a deux ans, 148 km par jour contre 96, et 64 % des livraisons à une heure précise promise par le commercial : les tournées sont bâties autour de ces heures, pas autour des secteurs. Le sous-traitant fait 30 à 35 livraisons par semaine à 95 €, quand un arrêt de plus dans une tournée coûte une dizaine d'euros. L'élève découvre que des créneaux réalistes, des livraisons regroupées à jours fixes et une confirmation la veille remplissent les tournées, font baisser les retards et le coût, et ne laissent au sous-traitant que les pics.",
  objectifs: [
    "Je calcule un coût par livraison et je sépare ce que coûte une tournée de ce que coûte un arrêt de plus.",
    "Je relie les retards à leurs causes (créneaux intenables, sous-traitance, heures supplémentaires) à partir d'un relevé chiffré.",
    "J'organise la livraison au client : des créneaux réalistes, des jours fixes par secteur, une confirmation la veille.",
    "Je réserve la sous-traitance aux pics, et je prépare un pic en livrant d'avance ce qui peut se stocker.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de tournée de livraison, de coût de transport, de sous-traitance et de taux de service doivent avoir été vues en cours. Le coût marginal d'un arrêt et la confirmation de livraison peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/tournees-qui-debordent?hasard=8 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, la part des livraisons qui arriveront en retard en semaine 3 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 (un neuvième camion, des créneaux réalistes, tout au sous-traitant, les heures supplémentaires) et la préparation du pic en semaine 5, où la classe se partage souvent. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 5 : réserver 45 livraisons chez Brunelière au lieu de la livraison d'avance.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le calcul avec la classe à partir du relevé des 33 retards sur 255 livraisons : 19 sur des heures impossibles dès la commande, 7 chez le sous-traitant, 4 en heures supplémentaires, 3 sur un accès fermé. Les créneaux réalistes, en place en semaine 3, retirent l'essentiel des 19 : on arrive autour de 8 %. Sous le tirage n° 8, le modèle donne 8,7 %, contre 12,6 % avec le neuvième camion et 13,5 % sans rien changer.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 face à la hausse de Brunelière (accepter, contrat de pics, chauffeur en CDD, pénalités) et de la semaine 4 sur les petites livraisons. Vous faites calculer au tableau ce que coûte une livraison selon qui la fait : un arrêt de plus dans une tournée, une dizaine d'euros ; Brunelière, 95 puis 106 € ; une tournée express pour un carton de vis. Vous terminez sur la confirmation de la veille : sept livraisons ratées sur dix étaient évitables.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 8, « Organiser les tournées avant d'acheter de la capacité » finit 9,7 k€ sous le budget du transport, avec un coût de 84,87 € par livraison ; « Ajouter des camions et des heures » finit 116,2 k€ au-delà et l'attentisme 84,1 k€ au-delà. Sur les trente tirages, la première méthode reste sous le budget 24 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur le pic : louer deux camions fait mieux 4 fois sur 30, et perd 6,4 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : remplir les tournées avant d'en ajouter. Vous la déclinez en quatre gestes : des créneaux réalistes décidés avec les commerciaux, des livraisons regroupées à jours fixes par secteur, une confirmation la veille avec le chef de chantier, et un sous-traitant réservé aux pics. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 8.5,
    etapes: [
      "Alerte du lundi : 13 % des livraisons en retard la semaine dernière, pour un objectif de 8 %. Source « Regarder pourquoi les livraisons sont arrivées en retard » : 33 retards sur 255 livraisons, dont 19 sur une heure impossible à tenir dès la commande, 7 chez le sous-traitant, 4 sur des tournées finies en heures supplémentaires, 3 sur un accès de chantier fermé.",
      "Les créneaux réalistes fixés avec les commerciaux (une demi-journée par défaut) agissent dès la semaine 2 et pleinement en semaine 3. Hubert Lhermet le confirme : sur dix heures précises promises, sept n'en étaient pas vraiment. Les 19 retards de créneaux tombent à environ 6.",
      "Ce qui reste : environ 6 retards de créneaux, 7 du sous-traitant, qui livre toujours ses 30 livraisons par semaine, et quelques heures supplémentaires et accès fermés, soit une vingtaine de retards pour 255 livraisons : environ 8 %. La semaine 3 est un peu plus chargée (un chantier de groupe scolaire depuis la semaine 2), ce qui pousse vers 8 à 9 %.",
      "Sous le tirage n° 8, le modèle donne 11,8 %, 11,1 % puis 8,7 % pour les semaines 1 à 3. Avec le neuvième camion, il donne 12,6 % en semaine 3 ; sans rien changer, 13,5 %.",
      "L'épisode juge juste à 1,5 point près, proche à 4. Selon les trente tirages du bilan, la meilleure méthode donne de 7,5 % à 10 % en semaine 3.",
    ],
    erreurs: [
      {
        valeur: 13,
        cause:
          "Le taux de la semaine dernière reporté tel quel, comme si les créneaux revus ne changeaient rien aux 19 retards qu'ils causaient.",
      },
      {
        valeur: 3,
        cause:
          "Seuls les retards d'heures supplémentaires et d'accès comptés (7 sur 255) : les créneaux ne disparaissent pas tous, et le sous-traitant garde ses 7 retards tant qu'il livre au quotidien.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "Les tournées débordent : un neuvième camion avec un intérimaire, cinq tournées de plus par semaine.",
      ceQuiLeDejoue:
        "L'analyse des tournées avec Awa Kouyaté : 5,4 arrêts par tournée contre 7,2 il y a deux ans, 148 km par jour contre 96, et avec des créneaux à la demi-journée, les mêmes livraisons tiendraient dans sept à huit tournées de moins par semaine. Le camion coûte 2 900 € par semaine, et l'intérimaire, qui ne connaît ni les chantiers ni les accès, livre plus souvent en retard. Sabine Courtial : « Avant d'acheter des camions, regarde combien d'arrêts tu fais par tournée. » Rejoué sur les trente tirages, il perd 56,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi: "Les chauffeurs sont à bout : tout le surplus au sous-traitant, et plus d'heures supplémentaires.",
      ceQuiLeDejoue:
        "Les factures de Brunelière : 30 à 35 livraisons par semaine, toutes les semaines, contre une dizaine il y a un an, à 95 € la livraison, quand un arrêt de plus dans une tournée coûte une dizaine d'euros. Le sous-traitant ne couvre plus des pics, il porte une part permanente du volume, et il livre plus souvent en retard que la flotte. Rejoué sur les trente tirages, tout lui confier perd 49,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "Brunelière augmente de 12 % : embaucher un chauffeur en CDD et louer un camion pour reprendre son volume.",
      ceQuiLeDejoue:
        "Le calcul de ce que la flotte peut livrer seule : avec les tournées revues, nos quarante tournées livrent presque tout le volume courant ; le volume quotidien de Brunelière ne sert plus qu'à remplir ses camions. Le CDD coûte 1 500 € de recrutement puis 2 700 € par semaine pour une capacité dont on n'a besoin que dans les pics, quand Brunelière accepte 99 € pour un contrat de pics. Rejoué sur les trente tirages, il perd 15,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi: "Les artisans commandent au jour le jour : une tournée express l'après-midi garde les clients pressés.",
      ceQuiLeDejoue:
        "L'analyse de la taille des livraisons : 41 % pèsent moins de 300 kg, un chantier sur trois est livré plusieurs fois dans la même semaine, et une livraison de moins de 150 € de marchandise coûte plus à livrer qu'elle ne rapporte. Huit artisans sur dix acceptent deux passages par semaine à jours fixes si on les annonce. L'express, que les commerciaux vendent à tout le monde, multiplie les allers-retours « pour un carton de vis ». Rejoué sur les trente tirages, il perd 39,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi: "Pour le pic, deux camions loués avec chauffeurs : on ne dépend de personne.",
      ceQuiLeDejoue:
        "Les deux derniers pics : +31 % puis +19 % sur trois semaines, avec des semaines 6 et 7 calmes, et trois livraisons de pic sur dix étaient des matériaux que les chantiers pouvaient stocker plus tôt ; trois grands chantiers sur cinq ont la place. Les deux camions coûtent 5 800 € par semaine, avec des intérimaires qui ne connaissent pas les accès. Rejoué sur les trente tirages à la place de la livraison d'avance, il perd 6,4 k€ en moyenne ; il fait mieux 4 fois sur 30 seulement.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi: "Faire face avec les heures supplémentaires et une prime de pic : les chauffeurs connaissent le terrain.",
      ceQuiLeDejoue:
        "Awa Kouyaté a prévenu : en pic, Brunelière est saturé et ne prendra pas plus de vingt-cinq livraisons par semaine au pied levé. Les heures en plus finissent dans les bouchons du soir, sur des chantiers fermés, et Kemal Aydin annonce « trois semaines de journées à onze heures ». Rejoué sur les trente tirages à la place de la livraison d'avance, il perd 3,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi: "Les chantiers sont mécontents : relivrer dès le lendemain matin, en priorité absolue.",
      ceQuiLeDejoue:
        "L'analyse des livraisons ratées : sept sur dix auraient pu être évitées, personne n'avait prévenu le chef de chantier ou l'accès était fermé le matin, et les chantiers appelés la veille ont presque tous été livrés du premier coup. La confirmation coûte 350 € par semaine ; relivrer en heures supplémentaires rallonge les tournées sans empêcher la livraison ratée suivante. Rejoué sur les trente tirages, il perd 3,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "20 % de livraisons en plus avant les congés : deux samedis de livraison avec toute l'équipe.",
      ceQuiLeDejoue:
        "Chaque samedi coûte 3 400 € en heures majorées, et Kemal Aydin le constate : un chantier sur cinq était fermé, une partie du chargement est revenue au dépôt. Un calendrier par secteur bâti avec les commerciaux remplit les tournées de la semaine, et Brunelière prend le surplus au tarif du contrat de pics. Rejoué sur les trente tirages, les samedis perdent 14 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 5,
      option: 3,
      pourquoi: "Les commerciaux connaissent leurs clients : les laisser promettre, et faire au mieux.",
      ceQuiLeDejoue:
        "C'est le mécanisme de la semaine 1 qui revient : des dates promises sans calendrier font zigzaguer les tournées d'un bout à l'autre de l'agglomération, les arrêts par tournée retombent et les retards remontent. Hubert Lhermet le reconnaît après le calendrier par secteur : « mes commerciaux n'ont plus à négocier chaque heure ». Rejoué sur les trente tirages, laisser promettre perd 4,7 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une flotte trop petite, d'autres des tournées mal remplies. Quels chiffres de l'analyse des tournées permettaient de trancher ?",
    "Une livraison coûte une dizaine d'euros quand elle s'ajoute à une tournée qui passe dans le secteur, 95 € quand Brunelière la fait. Pourquoi cet écart ? Qu'est-ce qui coûte, dans une tournée : les arrêts ou la tournée elle-même ?",
    "Qui décidait des heures de livraison avant la semaine 1 ? Pourquoi une heure promise par un commercial peut-elle coûter plus cher que le camion qui la livre ?",
    "Pour le pic, réserver 45 livraisons chez Brunelière fait mieux 9 fois sur 30 que la livraison d'avance, et louer deux camions 4 fois. Sous le tirage de la classe, les grands chantiers ont accepté de stocker. Si vous ne saviez pas qu'ils accepteraient, laquelle choisiriez-vous ?",
    "« Ajouter des camions et des heures » finit plus bas que ne rien changer, sous le tirage n° 8 comme en moyenne (−118,6 k€ contre −88,3 k€). Comment acheter de la capacité peut-il coûter plus cher que l'immobilité ?",
    "Sept livraisons ratées sur dix étaient évitables par un appel la veille. Pourquoi est-ce si souvent la dernière solution à laquelle on pense ?",
    "Quelle règle gardez-vous face à des tournées qui débordent ? Formulez-la en une phrase, avec les arrêts par tournée dedans.",
  ],
  prolongement: {
    enonce:
      "Un service transport doit livrer 250 livraisons par semaine. Ses frais fixes (salaires des chauffeurs, camions) sont de 12 000 € par semaine ; chaque tournée coûte en plus 140 €, et chaque arrêt 9 €. Ses huit camions font 40 tournées par semaine. Ce qui ne tient pas dans les tournées part au sous-traitant, à 106 € la livraison. 1) Avec 5,4 arrêts par tournée, combien de livraisons la flotte fait-elle, combien partent au sous-traitant, et quel est le coût par livraison ? 2) Même calcul avec 6,25 arrêts par tournée, grâce à des créneaux réalistes. 3) Même calcul avec 5,4 arrêts et un neuvième camion loué 2 900 € par semaine, qui ajoute 5 tournées. Que concluez-vous ?",
    corrige:
      "1) 40 × 5,4 = 216 livraisons par la flotte, 34 au sous-traitant. Coût : 12 000 + 40 × 140 + 216 × 9 + 34 × 106 = 12 000 + 5 600 + 1 944 + 3 604 = 23 148 €, soit 92,59 € par livraison. 2) 40 × 6,25 = 250 : tout tient dans les tournées. Coût : 12 000 + 5 600 + 250 × 9 = 19 850 €, soit 79,40 € par livraison. 3) 45 × 5,4 = 243 livraisons par la flotte, 7 au sous-traitant. Coût : 12 000 + 2 900 + 45 × 140 + 243 × 9 + 7 × 106 = 12 000 + 2 900 + 6 300 + 2 187 + 742 = 24 129 €, soit 96,52 € par livraison. Le camion de plus coûte plus cher que la situation de départ ; remplir les tournées fait baisser le coût de 13 € par livraison.",
  },
  evaluation: [
    "La prévision de la semaine 1 est construite à partir du relevé des causes de retard, et tient compte du moment où chaque décision agit.",
    "Le coût d'une livraison est analysé en séparant le coût d'une tournée, celui d'un arrêt et celui du sous-traitant.",
    "Les décisions sur les petites livraisons et les livraisons ratées s'appuient sur les sources chiffrées (taille des commandes, causes des échecs) plutôt que sur l'urgence.",
    "La sous-traitance et la préparation du pic sont argumentées comme un choix entre capacité permanente et capacité de pointe.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "Les coûts (140 € la tournée, environ 9 € l'arrêt, 42 € l'heure supplémentaire) sont des hypothèses du modèle. Les heures supplémentaires des chauffeurs routiers relèvent de règles propres au transport (temps de conduite et de service) que l'épisode ne traite pas : à préciser si la classe pose la question.",
};
