/**
 * FICHE ENSEIGNANT · ÉPISODE 3, L'APPEL D'OFFRES.
 *
 * Choisir ses dossiers, lire la grille de notation et tenir son prix : une
 * équipe qui répond à tout perd le dossier qui compte, et un marché gagné
 * sous son prix plancher coûte trois ans de marge.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "appel-d-offres",
  formations: ["bts-ndrc", "bts-mco", "but-tc"],
  programme: [
    "BTS NDRC · Bloc 1, Relation client et négociation-vente",
    "BUT TC · Vendre une offre commerciale",
    "BUT TC · Manager la relation client",
  ],
  notion:
    "Répondre à un appel d'offres, c'est d'abord choisir à quoi l'on répond, puis lire ce que l'acheteur note, et enfin savoir sous quel prix un marché ne vaut plus d'être gagné. L'erreur classique consiste à répondre à tout « pour ne laisser passer aucune affaire », puis à jouer le marché sur le seul prix. Dans l'épisode, Vincent Lambertin, responsable grands comptes d'Arvel Distribution, reçoit l'accord-cadre de Balmes Habitat (1 200 logements, trois ans, environ 2,4 M€) en même temps que les consultations de Maisons Ardanel et du Haut-Garon. Le plan de charge le dit : les comptes en place prennent 14 des 20 jours de l'équipe chaque semaine, il en reste 6 pour les offres. Le règlement de Balmes donne 60 points à la valeur technique et 40 au prix, chaque pour cent au-dessus du moins-disant ne retirant que 0,8 point ; au tarif grands comptes, la marge nette du marché n'est que de 5 %, le plancher est à 3 % sous le tarif, et chaque point de remise coûte 22 000 € sur trois ans. L'élève découvre qu'un mémoire écrit critère par critère rapporte plus de points qu'une baisse de 6 %, qu'une question posée à l'acheteuse révèle 60 % de logements occupés et deux points de coût, et qu'une concession s'échange contre une contrepartie.",
  objectifs: [
    "Je fais le plan de charge d'une équipe avant de m'engager sur plusieurs consultations, et je choisis celles où je peux gagner.",
    "Je lis une grille de notation et je calcule ce qu'une baisse de prix rapporte en points, comparé à ce qu'un mémoire technique peut rapporter.",
    "Je calcule la marge nette d'un marché pluriannuel, son prix plancher et ce que coûte chaque point de remise sur toute sa durée.",
    "Je négocie une concession contre une contrepartie qui réduit le coût du service, au lieu d'accorder l'effort demandé.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de marge brute, de marge nette et de coût de revient doivent être connues, ainsi que le principe d'une procédure d'appel d'offres (règlement de consultation, critères, offre finale). Le plan de charge, la note prix d'une formule linéaire et le prix plancher peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/appel-d-offres?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la charge de l'équipe prévue en semaine 3 en pourcentage de sa capacité, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : le tri des consultations en semaine 1, et le prix remis à Balmes en semaine 4. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision du prix.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le plan de charge de la semaine 3 avec la classe : 14 jours de comptes en place, ce que Balmes demande cette semaine-là, la réponse légère au Haut-Garon, sur 20 jours. Vous comparez avec le chemin où l'on répond aux trois consultations : Ardanel ajoute 5 jours en semaine 3 et l'équipe passe au-delà de 110 %. Vous faites expliquer les valeurs éloignées : 70 % et 110 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix du tri (semaine 1), du prix (semaine 4) et de la réponse à la demande de 5 % (semaine 7). Pour le prix, vous faites calculer au tableau, avec la simulation de la formule de Balmes, ce que rapporte une baisse de 6 % (moins de cinq points) et ce qu'elle coûte (environ 130 000 € sur trois ans, et un marché à perte). Pour la négociation, vous faites dire ce que les commandes groupées par résidence rapportent au dépôt.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Qualifier, lire la grille, tenir son prix » finit 81,9 k€ au-dessus de l'objectif, l'attentiste 44,2 k€ en dessous, et « Répondre à tout, baisser le prix » 255,2 k€ en dessous : il gagne Balmes, à perte, avec une erreur de bordereau. Vous montrez ensuite ce que ce tirage a de favorable : sous lui, même 4 % au-dessus du tarif auraient gagné. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois questions de l'épisode : ai-je les jours pour répondre ? Où sont les points ? Sous quel prix ce marché me coûte-t-il de l'argent ? Vous ajoutez la règle de négociation : une concession se donne contre une contrepartie écrite. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 87.1,
    etapes: [
      "Source « Faire le plan de charge de l'équipe » : 20 jours de travail par semaine (Vincent, deux chargés d'affaires, une chargée d'études de prix), dont 14 pris par les comptes en place ; il en reste 6 pour les offres.",
      "Avec la bonne décision (l'équipe sur Balmes, le Haut-Garon en version légère, Ardanel décliné), la semaine 3 demande : 2 jours d'analyse du dossier Balmes, une demi-journée pour poser les questions à l'acheteuse, 1,5 jour pour la réponse légère au Haut-Garon, soit 4 jours d'offres. Ardanel, qui en aurait demandé 5 cette semaine-là, est décliné.",
      "Sans aléa : (14 + 4) / 20 = 90 % de la capacité. Sous le tirage n° 12, les comptes en place demandent un peu moins que d'ordinaire (environ 13,4 jours) : (13,4 + 4) / 20 ≈ 87,1 %.",
      "Le chiffre dépend du tri : en répondant aux trois consultations, la semaine 3 demande 14 + 2 + 5 + 2 = 23 jours sans aléa, soit 115 %, et environ 112 % sous le même tirage ; l'équipe déborde dès la semaine 2. L'épisode juge juste à 8 points près, proche à 20 ; de 85,6 % à 98,8 % selon les trente tirages pour la bonne décision.",
    ],
    erreurs: [
      {
        valeur: 70,
        cause:
          "Les seuls comptes en place (14 / 20) : les jours pris par les offres sont oubliés, comme si répondre aux consultations ne coûtait rien à l'équipe.",
      },
      {
        valeur: 110,
        cause:
          "Le plan de charge de qui répond aux trois consultations, avec les 12 jours d'Ardanel étalés à 4 par semaine : (14 + 2 + 4 + 2) / 20. Ardanel est compté alors que la bonne décision le décline, ou la décision a été prise sans plan de charge.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "On ne laisse passer aucune affaire, l'équipe connaît les produits, et répondre ne coûte rien de plus : chacun prend un dossier en plus de ses clients.",
      ceQuiLeDejoue:
        "Le plan de charge le chiffrait : 6 jours par semaine pour les offres, 30 jusqu'à la remise de Balmes, quand Ardanel en demande 12 d'ici la semaine 3, le Haut-Garon 4 à 6 et Balmes 10 à 18, « tout en même temps » en semaines 2 et 3. L'historique ajoutait qu'Ardanel a reconduit trois fois son sortant, avec une grille à 80 % sur le prix. Les jours en trop se prennent aux clients en place : les devis de Vauclair attendent, et le dossier Balmes se fait la nuit. Rejoué sur les trente tirages à la place du tri, répondre à tout perd 73,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Grandval sera 5 à 6 % sous nous, « c'est sûr » : baisser de 6 % donne le prix le plus bas de la consultation, et Odile ne veut pas perdre Balmes pour trois points de remise.",
      ceQuiLeDejoue:
        "La simulation de la formule le montre : au tarif, 35,3 points sur 40 ; à 6 % de remise, 40, soit moins de cinq points gagnés, quand un mémoire critère par critère en rapporte une dizaine. Le calcul du coût complet le dit aussi : marge nette de 5 % au tarif, plancher à 3 % sous le tarif, chaque point de remise à 22 000 € sur trois ans, et « à 6 % de remise, le marché perd de l'argent chaque année ». Rejouée sur les trente tirages à la place du tarif, la baisse de 6 % perd 101,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "C'est ce que l'acheteuse attend de chaque candidat : accorder les 5 % paraît le prix à payer pour emporter le marché.",
      ceQuiLeDejoue:
        "Leïla rapporte que les candidats lâchent en général entre 1 et 4 %, et le recalcul de la marge avant de répondre montre où mènent 5 % : chaque point coûte 22 000 € sur trois ans, et le dépôt estime que des commandes groupées par résidence, passées 72 heures à l'avance, réduisent le coût du service d'un point et demi. Accorder 2 % contre cette contrepartie coûte un demi-point net, et Margot Kerguelen y voit un avantage pour ses gardiens. Rejoué sur les trente tirages à la place de l'échange, accorder les 5 % perd 70,4 k€ en moyenne et fait mieux 7 fois sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Vauclair est le premier compte de l'équipe : s'aligner sur les 5 % le garde à coup sûr.",
      ceQuiLeDejoue:
        "L'alignement coûte 35 000 € de marge sur l'année (5 % de 700 000 €), et la vérification de l'offre concurrente en montrait les limites : Grandval livre à J+2 au lieu de J+1 et pas le samedi, et n'est moins cher que sur les trente références principales. L'historique des devis disait ce que Frédéric Vautrin reproche quand le compte a été négligé : d'abord le service, puis le prix. Une revue d'affaires et 1,5 % sur les références clés le gardent presque toujours. Rejoué sur les trente tirages à la place de la revue d'affaires, l'alignement perd 27,6 k€ en moyenne et ne fait mieux qu'une fois.",
    },
  ],
  debrief: [
    "En semaine 1, Odile conseillait : « Avant de compter tes prix, compte tes jours. » Qu'est-ce que le plan de charge montrait ? Qu'avez-vous décliné, et pourquoi Ardanel plutôt que le Haut-Garon ?",
    "La grille de Balmes donne 60 points à la technique et 40 au prix. Combien rapportent 6 % de baisse ? Combien rapportait un mémoire écrit critère par critère, avec le chef de dépôt et les chauffeurs ?",
    "Ne poser aucune question « pour ne pas montrer notre jeu », ou poser trois questions écrites : qu'ont appris ceux qui les ont posées ? Pourquoi appeler Raphaël Mendy n'était-il pas une option ?",
    "Au tarif, la marge nette du marché est de 5 % ; le plancher est à 2 %. Gagner Balmes à 6 % de remise, est-ce gagner ? Sous le tirage n° 12, « Répondre à tout, baisser le prix » gagne Balmes et finit pourtant 255 k€ sous l'objectif : pourquoi ?",
    "Sous le tirage n° 12, Arvel aurait gagné Balmes même 4 % au-dessus du tarif, et 87,5 k€ de plus : la note technique de Grandval et de Gabriac était faible ce trimestre. Sur les trente tirages, le prix majoré perd pourtant 18,1 k€ en moyenne et ne fait mieux que 8 fois. De même, maintenir l'offre sans effort fait mieux 25 fois sur 30, mais perd 10 k€ en moyenne. Comment une option peut-elle gagner souvent et perdre en moyenne ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Accorder 2 % contre des commandes groupées, ou 5 % sans rien : qu'est-ce qui fait d'une concession un échange ?",
    "Quelle règle gardez-vous avant de répondre à une consultation ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un distributeur répond à un marché de 800 000 € par an pendant trois ans. Au tarif, sa marge nette est de 5 % ; il refuse de descendre sous 2 %. La grille donne 60 points à la technique et 40 au prix ; l'offre la moins chère a 40 points, et chaque pour cent d'écart au-dessus d'elle retire 0,8 point. Un concurrent remet 4 % sous le tarif du distributeur, avec 42 points de technique ; le distributeur a 47 points de technique. 1) Quelle marge nette le marché rapporte-t-il sur trois ans au tarif ? Combien coûte chaque point de remise sur trois ans ? 2) Au tarif, quelle est la note totale de chaque candidat ? Qui gagne ? 3) Le distributeur baisse de 6 % : quelle note obtient-il, et quelle marge nette garde-t-il sur trois ans ? 4) Quel est son prix plancher, et que vaut sa note à ce prix ?",
    corrige:
      "1) 800 000 × 3 × 5 % = 120 000 € ; chaque point de remise coûte 800 000 × 3 × 1 % = 24 000 €. 2) Le concurrent est le moins cher : 40 + 42 = 82 points. Le distributeur est 4 % au-dessus : 40 − 4 × 0,8 = 36,8 points de prix, 83,8 au total : il gagne au tarif. 3) Il devient le moins cher : 40 + 47 = 87 points, pour une marge nette de 5 − 6 = −1 %, soit −24 000 € sur trois ans : il gagne un marché à perte, et 3,2 points de prix lui ont coûté 144 000 €. 4) Le plancher est à 3 % sous le tarif (5 − 2) ; il reste 1 % au-dessus du concurrent : 40 − 0,8 = 39,2 + 47 = 86,2 points, pour 48 000 € de marge nette sur trois ans.",
  },
  evaluation: [
    "Le tri des consultations de la semaine 1 s'appuie sur un plan de charge chiffré (14 jours de comptes en place sur 20) et sur l'historique des réponses.",
    "La prévision de la charge en semaine 3 est construite par un calcul écrit (jours des comptes en place, jours de chaque offre, capacité), et l'écart avec 87,1 % est expliqué.",
    "Le prix remis est justifié par la simulation de la note prix et par le calcul du plancher, et l'élève dit ce que coûte chaque point de remise sur les trois ans.",
    "La réponse à la demande de 5 % et celle à Vauclair sont argumentées comme des échanges (contrepartie, service), pas comme des alignements.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La procédure de l'épisode (questions écrites publiées pour tous, négociation avec les trois offres retenues, meilleure et dernière offre) suit les principes de la commande publique, égalité de traitement des candidats comprise, sans entrer dans le détail du code de la commande publique : un professeur d'économie et gestion vérifiera ce qu'il en dit avant d'en faire une règle générale. La formule de note prix et l'actualisation de la marge sur trois ans sont des conventions de l'épisode.",
};
