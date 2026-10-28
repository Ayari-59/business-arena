/**
 * FICHE ENSEIGNANT · ÉPISODE 55, LE RATIO MATIÈRE QUI DÉRAPE.
 *
 * Le ratio matière se recalcule avant de se corriger (stock initial, achats,
 * stock final), puis se décompose entre achats, pertes et portions. Le piège :
 * monter les prix pour « retrouver » 30 %, et faire baisser la marge avec le
 * ratio.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "ratio-matiere",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 1, Conception et production de services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Le ratio matière est un rapport : le coût matière consommé (stock initial + achats − stock final) sur le chiffre d'affaires nourriture. L'erreur classique consiste à le corriger avant de le vérifier, et par le levier le plus visible : monter la carte de 8 % pour revenir à l'objectif, ce qui fait baisser le ratio et la marge à la fois quand les clients d'ici, hors saison, regardent les prix. Dans l'épisode, La Table d'Augustin d'Annecy, 90 couverts, affiche 36,4 % en août pour un objectif de 30 %. L'inventaire du 31 août, fait par un commis seul après le service, a oublié la chambre froide négative du sous-sol : 4 200 € de stock manquent, et le vrai ratio est de 33,4 %. Le reste de l'écart se décompose : 28,5 % de ratio théorique d'après les fiches techniques, 0,6 point de pertes normales, 2,4 points de pertes en trop dues à une carte de trente-quatre plats (950 € jetés par semaine), un point de grammages qui dérivent sur la féra et la côte de veau, 0,9 point de hausse du beurre AOP et du veau, qui vient du marché et non du grossiste. L'élève découvre qu'on mesure avant de corriger, qu'on traite chaque cause par son levier (carte resserrée, balance au passe, produits substitués, commandes calées sur les réservations), et qu'une erreur d'inventaire non corrigée se retourne le mois suivant en un ratio trop beau.",
  objectifs: [
    "Je recalcule un coût matière consommé et un ratio matière à partir des stocks et des achats, et je repère une erreur d'inventaire.",
    "Je décompose l'écart entre le ratio réel et le ratio théorique des fiches techniques : pertes, grammages, prix d'achat.",
    "Je traite chaque cause par son levier, et je mesure ce qu'une hausse de prix fait à la marge et pas seulement au ratio.",
    "Je cale les commandes et la mise en place sur les réservations quand la fréquentation baisse.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le calcul du coût matière consommé, le ratio matière, la fiche technique et le ratio théorique doivent avoir été vus en cours, ainsi que la marge brute d'un restaurant. La décomposition d'un écart de ratio peut être faite pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/ratio-matiere?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez Nina Sabatier, gérante de la Table d'Annecy, et le ratio de 36,4 %, et vous demandez de noter sur papier, avant de valider la semaine 1, le ratio matière réel d'août recalculé et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez la décision de la semaine 1 (prix, portions, recomptage, attente) et la carte d'automne choisie en semaine 2. Un binôme qui a fini tôt décompose sur papier l'écart entre 33,4 % et les 28,5 % des fiches techniques.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous écrivez au tableau la formule du coût matière consommé, puis vous refaites le calcul de la comptabilité (50 960 €, 36,4 %) et celui avec la négative recomptée (46 760 €, 33,4 %). Vous faites expliquer les valeurs éloignées (36,4 %, 39,4 % ou 33,8 %). Vous construisez ensuite avec la classe l'escalier de l'écart : 28,5 % théoriques, 0,6 point de pertes normales, 2,4 points de pertes en trop, 1,0 point de grammages, 0,9 point de hausse d'achat, soit 33,4 %. Vous terminez par le piège du mois suivant : sans correction, septembre part d'un stock initial trop bas et affiche un ratio trop beau.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (36, 34, 28 plats avec ardoise ou 22 plats) et de la semaine 5 (Maison Vallorin). Pour Vallorin, vous faites calculer ce que coûte la bascule : 3 % sur 60 % des achats, soit 0,5 point, contre 4 500 € de remise de fin d'année perdue et trois semaines de rodage, quand la hausse du beurre et du veau suit la cotation chez tous les grossistes. Ceux qui ont monté la carte de 8 % défendent leur choix, et la classe le confronte au témoignage de Chambéry : 16 % d'habitués en moins en novembre.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Mesurer, puis traiter la cause » finit à 306,0 k€ de marge brute avec un ratio de 31,2 % ; « Attentiste » à 286,7 k€ (36,9 %) ; « Corriger par le prix » à 256,7 k€, avec moins de couverts et un ratio de 38,1 %. Vous faites remarquer que corriger par le prix donne le plus mauvais ratio et la plus mauvaise marge. Vous montrez ensuite la décision où le hasard compte : la carte d'automne. Resserrer à 22 plats fait mieux en moyenne que l'ardoise à 28 plats, mais l'ardoise fait mieux 9 fois sur 30, quand des habitués boudent la carte courte. Vous faites dire pourquoi une décision peut rester bonne en moyenne et perdre sous un tirage.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les deux règles de l'épisode : mesurer avant de corriger, et corriger chaque cause par son levier. Vous rappelez que la meilleure méthode finit encore sous le budget de 310 k€ : le budget comptait sur un ratio de 30 % dès septembre, que trois mois ne permettent pas d'atteindre. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 33.4,
    etapes: [
      "Source « Reprendre l'inventaire du 31 août avec le second » : stock au 31 juillet 16 800 €, achats nourriture d'août 47 320 €, stock compté au 31 août 13 160 €, chiffre d'affaires nourriture 140 000 € HT. Le calcul de la comptabilité : 16 800 + 47 320 − 13 160 = 50 960 €, soit 50 960 / 140 000 = 36,4 %.",
      "Même source : la chambre froide négative du sous-sol n'a pas été comptée ; sa fiche de stock, tenue à jour, indique 4 200 €. Stock final réel : 13 160 + 4 200 = 17 360 €.",
      "Coût matière consommé réel : 16 800 + 47 320 − 17 360 = 46 760 €.",
      "Ratio matière réel d'août : 46 760 / 140 000 = 33,4 %. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 0,3 point près, proche à 1 point.",
      "Pour la suite : les fiches techniques donnent 28,5 % ; les pertes pèsent 3,0 % du chiffre d'affaires au lieu de 0,6 % (2,4 points de trop), les grammages de la féra et du veau 1,0 point, la hausse du beurre et du veau 1 200 €, soit 0,9 point : 28,5 + 0,6 + 2,4 + 1,0 + 0,9 = 33,4 %.",
    ],
    erreurs: [
      {
        valeur: 36.4,
        cause:
          "Le ratio de la comptabilité repris sans vérifier l'inventaire : la négative du sous-sol manque au stock final.",
      },
      {
        valeur: 39.4,
        cause:
          "Les 4 200 € de la négative ajoutés à la consommation au lieu du stock final (50 960 + 4 200 = 55 160 €) : un stock oublié gonfle la consommation, le retrouver la fait baisser.",
      },
      {
        valeur: 33.8,
        cause:
          "Les achats d'août rapportés au chiffre d'affaires (47 320 / 140 000), sans la variation de stock : c'est un ratio d'achats, pas de consommation.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le siège le propose, les autres Tables l'ont fait au printemps, et 8 % de plus sur le ticket ramènent mécaniquement le ratio vers 30 %.",
      ceQuiLeDejoue:
        "Le ratio de 36,4 % est faux : l'inventaire oublie 4 200 € de stock, et le vrai ratio est de 33,4 %. Le service passé en cuisine montre où part le reste : 950 € de produits jetés par semaine, des assiettes plus garnies que leur fiche. Liv Duperthuy le dit : refais le calcul toi-même, sépare achats, poubelle et assiettes ; à Chambéry, +7 % en octobre ont coûté 16 % des habitués en novembre, et Anouar annonce que la salle sera faite par les clients d'ici. Rejouée sur les trente tirages à la place du recomptage, la hausse de 8 % perd 21,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "3 % de moins sur tout le catalogue, c'est une économie immédiate, et l'acheteuse du siège peut lancer la bascule tout de suite.",
      ceQuiLeDejoue:
        "La source sur le contrat des Halles : 1,5 % de remise de fin d'année sur 300 000 € d'achats, 4 500 € perdus si l'on part avant le 31 décembre, et des livraisons six jours sur sept quand Vallorin livre trois fois par semaine. Les trois fournisseurs comparés montrent que la hausse du beurre et du veau vient de la cotation : Vallorin ne l'enlève pas. Le beurre de laiterie en cuisson et le quasi de la Boucherie Pollet effacent les quatre cinquièmes du surcoût. Rejouée sur les trente tirages à la place de ces substitutions, la bascule perd 8,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Le comité veut aligner Annecy sur les autres Tables pour l'hiver, et novembre creux fera baisser le chiffre d'affaires : autant monter les prix.",
      ceQuiLeDejoue:
        "La source sur les commandes montre la vraie cause des pertes de novembre : la mise en place reste celle d'une semaine pleine, et chaque couvert prévu qui ne vient pas fait jeter environ 6,60 €, avec 17 % de couverts en moins ; les réservations sont connues trois jours à l'avance. La gérante de Chambéry raconte ce qu'une hausse coûte hors saison : 16 % d'habitués en moins, et la moitié seulement revenus en mars. Rejouée sur les trente tirages à la place des commandes calées sur les réservations, la hausse de 8 % perd 5,3 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le ratio de 36,4 % paraissait parler de lui-même. Qu'est-ce qui, dans l'inventaire du 31 août, devait vous arrêter avant de corriger quoi que ce soit ?",
    "Si personne ne corrige le stock oublié, que montrera la clôture de septembre ? Pourquoi une erreur d'inventaire se retourne-t-elle le mois suivant ?",
    "Décomposez l'écart entre 33,4 % et les 28,5 % des fiches techniques. Quelle cause pèse le plus, et quel levier la traite ?",
    "Monter la carte de 8 % fait baisser le ratio. Pourquoi la marge peut-elle baisser en même temps ? Qu'est-ce qu'un client d'ici, en novembre, a de différent d'un touriste d'août ?",
    "Resserrer la carte à 22 plats fait mieux en moyenne, mais l'ardoise à 28 plats fait mieux 9 fois sur 30. Si vous aviez choisi les 22 plats et perdu des habitués sous un autre tirage, auriez-vous pris une mauvaise décision ?",
    "Même la meilleure méthode finit sous le budget de 310 k€. Que dit cet écart du budget lui-même, et comment présenteriez-vous ce résultat à Théo Garrigues ?",
    "Quelle règle laissez-vous à la brigade pour l'hiver ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un restaurant fait 80 000 € HT de chiffre d'affaires nourriture en octobre. Stock au 30 septembre : 9 000 € ; achats d'octobre : 27 000 € ; stock compté au 31 octobre : 8 500 €, mais la réserve sèche du sous-sol, 1 500 €, a été oubliée. 1) Quel ratio matière la comptabilité affiche-t-elle ? 2) Quel est le ratio réel ? 3) En novembre, le chiffre d'affaires est encore de 80 000 €, les achats de 26 000 €, et le stock du 30 novembre est bien compté : 9 000 €. Quel ratio affiche-t-on si l'on part du stock initial non corrigé, et quel est le ratio réel ? 4) Le chef propose de monter les prix de 8 % ; le restaurant sert 2 800 couverts à 28,57 € HT et perdrait 12 % de ses couverts. Que deviennent le chiffre d'affaires et le coût matière, à 33 % de coût matière par couvert au prix d'aujourd'hui ?",
    corrige:
      "1) 9 000 + 27 000 − 8 500 = 27 500 €, soit 27 500 / 80 000 = 34,4 %. 2) Stock final réel 10 000 € : 9 000 + 27 000 − 10 000 = 26 000 €, soit 32,5 %. 3) Affiché : 8 500 + 26 000 − 9 000 = 25 500 €, soit 31,9 %, un ratio trop beau ; réel : 10 000 + 26 000 − 9 000 = 27 000 €, soit 33,75 %. 4) Coût matière d'un couvert : 28,57 × 0,33 ≈ 9,43 €. Avant : 2 800 couverts, 80 000 € de chiffre d'affaires, 26 400 € de coût matière, 53 600 € de marge. Après : 2 464 couverts à 30,86 €, soit 76 030 € de chiffre d'affaires et 23 230 € de coût matière : le ratio tombe à 30,6 %, mais la marge passe à 52 800 €, 800 € de moins.",
  },
  evaluation: [
    "Le ratio matière d'août est recalculé juste, avec le stock de la négative au stock final, et l'élève explique l'effet d'une erreur d'inventaire sur le mois suivant.",
    "L'écart au ratio théorique est décomposé par cause (pertes, grammages, prix d'achat), avec les chiffres des sources.",
    "Chaque correction est jugée sur la marge brute et non sur le seul ratio, en particulier la hausse de prix.",
    "Les choix d'achats et de commandes sont argumentés par ce que disent les sources : la cotation du marché, la remise de fin d'année, les réservations de novembre.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La fin de stock avant la fermeture (décision 6) suppose des règles d'hygiène sur la congélation et la recongélation, que l'épisode résume ainsi : « ce qui a déjà été décongelé ne se recongèle pas ». Un enseignant de production culinaire voudra rappeler le cadre exact (plan de maîtrise sanitaire, étiquetage et traçabilité des produits congelés par l'établissement) avant d'en faire une règle.",
};
