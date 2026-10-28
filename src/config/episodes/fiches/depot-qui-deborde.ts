/**
 * FICHE ENSEIGNANT · ÉPISODE 13, LE DÉPÔT QUI DÉBORDE.
 *
 * Gestion des stocks par classe ABC, stock de sécurité, inventaire tournant et
 * effet coup de fouet : le dépôt manque de ce qui se vend et déborde de ce qui
 * dort. Le piège : répondre à la rupture en ajoutant du stock ou de la place.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "depot-qui-deborde",
  formations: ["seconde-pro-gatl", "bts-mco", "but-gea"],
  programme: [
    "2de pro GATL · 4, Traiter les flux physiques en relation avec les données de gestion",
    "BTS MCO · Bloc 3, Assurer la gestion opérationnelle",
    "BUT GEA · Assurer la gestion et le développement de la chaîne de valeur",
  ],
  notion:
    "Un dépôt peut être à la fois en rupture et plein à craquer : la rupture ne dit pas qu'il manque du stock, elle dit que le stock n'est pas au bon endroit. L'erreur classique consiste à répondre aux ruptures en commandant plus de tout, puis au débordement en louant de la place. Dans l'épisode, Juliette Brunet dirige le dépôt régional d'Arvel Distribution à Saint-Priest : 91 % de taux de service aux agences pour un objectif de 97 %, 130 références A en rupture, 94 % d'occupation et 1,4 M€ de stock. L'extraction ABC montre que les 900 références A font 63 % des ventes et 85 % des ruptures pour 14 % de la valeur du stock, quand les 6 300 références C font 10 % des ventes et 70 % du stock, dont 800 k€ sans aucune sortie depuis douze mois. Les paramètres de réapprovisionnement datent de dix-huit mois : deux semaines de sécurité partout, sur des ventes qui ont changé (A en hausse de 26 %, C en baisse d'un tiers), et le système croit avoir en rayon des pièces qui n'y sont pas. L'élève découvre qu'il faut recalculer les paramètres par classe, compter chaque semaine ce qui tourne, faire sortir les dormants, et que commander plus quand on rompt, au fournisseur en retard comme aux agences qui se couvrent, amplifie le retard d'abord et le surstock ensuite.",
  objectifs: [
    "Je classe des références en A, B et C et je compare leur part des ventes, des ruptures et du stock.",
    "Je calcule un stock cible à partir des ventes réelles, du délai et du stock de sécurité, et sa couverture en semaines.",
    "Je distingue le stock informatique du stock physique, et je choisis un inventaire tournant sur les références qui tournent.",
    "Je reconnais l'effet coup de fouet : une commande doublée par précaution allonge les délais et gonfle le stock.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de stock de sécurité, de délai de réapprovisionnement, de taux de service et de rupture doivent avoir été vues en cours, ainsi que la méthode ABC. Le coût de possession du stock et l'effet coup de fouet peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/depot-qui-deborde?hasard=10 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le taux de service attendu en semaine 3 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 (stocks relevés de 25 %, paramètres recalculés, express, attente) et celle de la semaine 5 à Visseries du Dauphiné, où la classe se partage souvent. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 7 : l'entrepôt de Corbas au lieu du déstockage.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le raisonnement : le stock des A couvre moins d'une semaine de ventes, et une commande passée cette semaine n'arrive pas avant deux ou trois semaines ; le taux de service continue donc de glisser sous 91 %. Vous montrez ensuite ce que la classe ne pouvait pas savoir : sous le tirage n° 10, la reprise des chantiers fait monter les ventes des A de 15 % en semaines 2 et 3, et le taux tombe à 85,4 %. Vous faites expliquer les valeurs éloignées (91, 97, 94).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 5 (doubler, prévisions partagées, second fournisseur, relances) et de la semaine 7 (débord, déstockage, gel, rangement). Pour la semaine 1, vous faites lire l'extraction ABC et les paramètres : relever tout de 25 % remonte un peu les A et beaucoup ce qui dort. Pour la semaine 5, vous faites lire l'appel à Marc Perrin : son atelier est saturé parce qu'un client a doublé ses commandes.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 10, « Mettre le stock au bon endroit » finit 20,8 k€ sous le budget du dépôt de 220 k€, « Commander plus de tout » 94,7 k€ au-delà, et l'attentisme 97,2 k€ au-delà ; sur les trente tirages, la première méthode reste sous le budget 30 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur la semaine 5 : Visseries a tenu sous le tirage de la classe, mais le second fournisseur fait mieux 9 fois sur 30.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant de commander plus, regarder où sont les ruptures et où est le stock. Vous la déclinez en quatre gestes : des paramètres recalculés par classe sur les ventes réelles, un comptage tournant des A chaque semaine, la sortie des dormants plutôt qu'un entrepôt de plus, et une allocation des A au prorata des ventes réelles quand les agences se couvrent. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 85,
    etapes: [
      "Tableau de bord du lundi : 91 % de taux de service la semaine dernière, pour un objectif de 97 %, 130 références A en rupture et 94 % d'occupation.",
      "Sources « Extraire les ventes, le stock et les ruptures par classe ABC » et « Relire les paramètres » : les A font 63 % des ventes et 85 % des ruptures, et leurs ventes ont progressé de 26 % depuis le calcul des paramètres. Dans le dépôt, les A ont 195 k€ de stock pour environ 240 k€ de ventes par semaine : moins d'une semaine de couverture. Le comptage montre en plus 7 références sur 30 introuvables alors que le système les croit en stock.",
      "Les commandes passées en fin de semaine 1 arrivent deux ou trois semaines plus tard : ni le recalcul des paramètres, ni le relèvement de 25 %, ni l'attente ne changent le stock avant la semaine 4. Seul l'express livre dès la semaine 2, sans changer grand-chose (86 % en semaine 3). Le taux de service continue donc de glisser : 89,3 % en semaine 1 et 87,9 % en semaine 2 sous le tirage de la classe.",
      "Ce que personne ne pouvait prévoir en semaine 1 : sous le tirage n° 10, la reprise des chantiers après les intempéries fait monter les ventes des A de 15 % en semaines 2 et 3. Le taux de service tombe à 85,4 % en semaine 3, quelle que soit la décision de la semaine 1 (hors express).",
      "L'épisode juge juste à 5 points près, proche à 8. Un raisonnement juste sans l'imprévu donne autour de 88 à 89 %, ce qui est jugé juste ; selon les trente tirages du bilan, la valeur va de 77,3 % à 93,4 %, le plus souvent entre 86 et 91 %.",
    ],
    erreurs: [
      {
        valeur: 91,
        cause:
          "Le taux de la semaine dernière reporté tel quel, comme si le stock des A, qui couvre moins d'une semaine de ventes, ne continuait pas de baisser en attendant les commandes.",
      },
      {
        valeur: 97,
        cause:
          "L'objectif pris pour une prévision, comme si les paramètres recalculés agissaient tout de suite : les commandes de la semaine 1 n'arrivent pas avant la semaine 4.",
      },
      {
        valeur: 94,
        cause:
          "Le taux d'occupation des emplacements (94 %) confondu avec le taux de service : un dépôt plein ne dit pas qu'il sert bien.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "On manque : relever les stocks de sécurité de 25 % partout, pour ne plus jamais manquer.",
      ceQuiLeDejoue:
        "L'extraction ABC le disait : les ruptures sont sur les A (85 %), le stock sur les C (70 %), dont 800 k€ sans sortie depuis douze mois. Les paramètres reposent sur des ventes vieilles de dix-huit mois : relever tout de 25 % remonte un peu les A, sous-estimés de 26 %, et beaucoup ce qui dort, dans un dépôt déjà occupé à 94 %. Rejoué sur les trente tirages à la place du recalcul par classe, il perd 45,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi: "Le système se trompe sur ce qu'il a : ajouter 15 % à toutes les commandes compense les écarts.",
      ceQuiLeDejoue:
        "Le comptage de vingt A trouve six écarts, concentrés sur les références qui sortent le plus, et Bruno Ferreira explique que l'écart grandit d'environ 5 % de ce qui sort chaque semaine. Ajouter 15 % partout gonfle aussi les B et les C, et ne corrige pas le stock que le système croit avoir. Les comptages tournants, 600 € par semaine, corrigent l'écart là où il est : 900 références à compter, pas 9 000. Rejoué sur les trente tirages, le plus 15 % perd 12,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi: "Le fournisseur livre en cinq semaines : doubler les commandes pour se couvrir, ce qui arrive en trop servira plus tard.",
      ceQuiLeDejoue:
        "Marc Perrin l'expliquait : son atelier est saturé parce qu'un gros client a doublé ses commandes par peur de manquer, et il peut revenir à deux semaines pour les clients qui donnent des prévisions et commandent à date fixe, « à condition de ne pas recevoir d'autres commandes doublées ». Doubler, c'est passer après la file : six semaines de délai, puis une livraison groupée qui encombre le dépôt. Rejoué sur les trente tirages à la place des prévisions partagées, il perd 13,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi: "Des palettes au sol dans trois allées : louer de la place à Corbas règle le problème dès la semaine 8.",
      ceQuiLeDejoue:
        "La liste des dormants : 800 k€ de références sans sortie occupent près de 60 % des emplacements, et 300 k€ peuvent repartir par retours, transferts et déstockage, pour une décote d'environ 18 000 €. Le débord coûte 4 500 € par semaine, soit 27 000 € des semaines 8 à 13, garde tout le stock et son coût de possession, et oblige à aller chercher ce qu'on y range. Rejoué sur les trente tirages à la place du déstockage, il perd 17,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi: "Les agences commandent plus : la demande monte, il faut commander plus aux fournisseurs pour la suivre.",
      ceQuiLeDejoue:
        "La comparaison des commandes aux ventes au comptoir montre que les agences commandent de 20 à 35 % de plus que ce qu'elles vendent : ce sont des stocks de précaution, et ce qu'elles stockent aujourd'hui, elles ne le commanderont pas en semaines 12 et 13. Commander plus sur ces commandes gonflées remplit le dépôt au moment où elles cessent. Rejoué sur les trente tirages à la place de l'allocation au prorata des ventes, il perd 11 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "240 k€ de matériel à sortir en deux semaines : remonter tous les stocks de 20 % pour être prêts.",
      ceQuiLeDejoue:
        "La liste du conducteur de travaux tenait sur quatre pages : 140 références, presque toutes des A et des B, avec les quantités semaine par semaine, et aucune C. Remonter tout de 20 %, c'est environ 152 k€ de commandes urgentes sur tout le catalogue, dont une bonne partie ne servira pas au chantier, avec 3 % de transport express. Rejoué sur les trente tirages à la place de la liste commandée à la référence près, il perd 6,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le dépôt avait 130 références A en rupture et 94 % d'occupation. Comment les deux peuvent-ils être vrais en même temps ? Quels chiffres de l'extraction ABC le montraient ?",
    "Pourquoi aucune décision de la semaine 1, sauf l'express, ne pouvait-elle faire remonter le taux de service avant la semaine 4 ? Et pourquoi l'express, qui livre en 48 heures, a-t-il pourtant fait perdre 57,3 k€ en moyenne ?",
    "Le système croyait avoir en rayon des pièces qui n'y étaient pas. Pourquoi ne les recommandait-il pas ? Que fait un inventaire complet que ne fait pas un comptage tournant, et l'inverse ?",
    "Sous le tirage de la classe, Visseries du Dauphiné a tenu les commandes régulières, comme 7 fois sur 10. Le second fournisseur du groupe fait mieux 9 fois sur 30, quand Visseries ne tient pas. Lequel choisissez-vous, et sur quel critère ?",
    "En semaine 9, les agences commandaient de 20 à 35 % de plus que leurs ventes. Qu'arrive-t-il au dépôt si on les sert toutes, ou si on commande plus pour les suivre ? Comment s'appelle cet effet ?",
    "Sous le tirage n° 10, « Commander plus de tout » finit 94,7 k€ au-delà du budget ; en moyenne sur les trente tirages, il fait même moins bien que ne rien changer (−102,9 k€ contre −89,2 k€). Comment ajouter du stock peut-il coûter plus que l'immobilité ?",
    "Quelle règle gardez-vous face à des ruptures ? Formulez-la en une phrase, avec la classe ABC dedans.",
  ],
  prolongement: {
    enonce:
      "Un dépôt gère deux classes de références. Classe A : ventes réelles de 20 000 € par semaine, mais le système prévoit encore 15 000 €. Classe C : ventes réelles de 4 000 € par semaine, le système en prévoit 6 000 €. Le stock cible vaut prévision × (délai + stock de sécurité, en semaines). Le délai est de 2 semaines pour les A, de 3 pour les C ; le stock de sécurité est aujourd'hui de 2 semaines pour tous. 1) Calculez le stock cible actuel de chaque classe, et sa couverture en semaines de ventes réelles. 2) Première option : relever le stock de sécurité de 25 % (2,5 semaines) sans changer les prévisions. Seconde option : recalculer sur les ventes réelles, avec 2 semaines de sécurité pour les A et 1 pour les C. Calculez les stocks cibles et les couvertures. 3) Le coût de possession est de 25 % par an. Que coûte chaque situation sur un an ? Laquelle protège les A ?",
    corrige:
      "1) A : 15 000 × (2 + 2) = 60 000 €, soit 3 semaines de ventes réelles pour 4 semaines de délai et de sécurité : il manque une semaine. C : 6 000 × (3 + 2) = 30 000 €, soit 7,5 semaines. Total 90 000 €. 2) Relèvement de 25 % : A 15 000 × 4,5 = 67 500 € (3,4 semaines, toujours trop peu), C 6 000 × 5,5 = 33 000 € (8,25 semaines) ; total 100 500 €. Recalcul : A 20 000 × 4 = 80 000 € (4 semaines), C 4 000 × 4 = 16 000 € (4 semaines) ; total 96 000 €. 3) Coût de possession annuel : 90 000 × 0,25 = 22 500 € aujourd'hui, 100 500 × 0,25 = 25 125 € avec le relèvement, 96 000 × 0,25 = 24 000 € avec le recalcul. Le recalcul coûte 1 125 € de moins par an que le relèvement, et c'est le seul qui couvre les A : le stock passe des C, qui dorment, aux A, qui se vendent.",
  },
  evaluation: [
    "La prévision de la semaine 1 tient compte du délai de réapprovisionnement : rien de ce qui est commandé en semaine 1 n'arrive avant la semaine 4.",
    "Le diagnostic s'appuie sur l'analyse ABC chiffrée : les ruptures sur les A, le stock sur les C, des paramètres calés sur des ventes anciennes.",
    "Les réponses au fournisseur en retard et aux agences qui se couvrent sont argumentées contre l'effet coup de fouet, avec les sources de l'épisode.",
    "Le manque de place est traité par la sortie des dormants, chiffrée (décote, loyer évité, coût de possession), plutôt que par de la place en plus.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "Le coût de possession de 25 % par an et le seuil de 85 % d'occupation au-delà duquel le dépôt perd en productivité sont des hypothèses du modèle, pas des normes. Sous le tirage de la classe, un imprévu de la semaine 2 (la reprise des chantiers) fait tomber le taux de service de la semaine 3 sous ce qu'un raisonnement juste pouvait prévoir : à dire aux élèves avant de corriger.",
};
