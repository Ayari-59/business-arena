import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 32, « Le produit qui perd de l'argent ».
 *
 * Coûts partiels : marge sur coût variable, marge sur coûts spécifiques, et
 * charges communes réparties qui ne disparaissent pas avec la gamme.
 */
export const FICHE: FicheEnseignant = {
  code: "produit-deficitaire",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Contrôle de gestion",
  ],
  notion:
    "L'épisode travaille le raisonnement en coûts partiels : la marge sur coût variable d'une gamme, puis sa marge sur coûts spécifiques, ce qui lui reste pour contribuer aux charges communes. L'erreur qu'il corrige est classique : lire un résultat en coût complet comme ce que l'entreprise gagnerait en supprimant la gamme, alors que ce résultat dépend d'une clé de répartition et que les charges communes restent après l'arrêt. Au tableau de la direction, la plomberie-chauffage affiche −16 k€, mais elle dégage 44 k€ de marge sur coûts spécifiques ; c'est la part de 60 k€ de charges communes, répartie à 12 % du chiffre d'affaires, qui la met dans le rouge. Le piège de la première décision est donc de l'arrêter, ou de lui faire « couvrir sa part de frais » par une hausse de prix. L'épisode pousse ensuite le raisonnement un cran plus loin : la seule activité qui ne couvre pas ses propres coûts est un corner peinture, noyé dans une quincaillerie de finition bénéficiaire au tableau, et les chauffagistes que la gamme attire achètent aussi dans les autres rayons.",
  objectifs: [
    "Je calcule la marge sur coût variable et la marge sur coûts spécifiques d'une gamme à partir de son compte détaillé.",
    "Je distingue, parmi les coûts spécifiques d'une gamme, ceux qui disparaîtraient vraiment avec elle dans l'horizon de la décision.",
    "J'explique comment une clé de répartition des charges communes fabrique le déficit d'une gamme en coût complet.",
    "Je repère, sous une gamme bénéficiaire au tableau, la sous-famille dont la marge ne couvre pas ses coûts spécifiques.",
  ],
  prerequis:
    "Les élèves doivent savoir séparer charges variables et charges fixes, calculer une marge sur coût variable et son taux, et avoir vu le principe du coût complet, avec la répartition des charges indirectes.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Envoyez le lien /entreprises/episode/produit-deficitaire?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Annoncez seulement qu'une gamme est en déficit et que la direction veut l'arrêter, sans rien dire des coûts partiels.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions. Circulez au moment de la prévision de la semaine 1 et relevez, sans les corriger, quelques estimations de la marge sur coûts spécifiques ; notez aussi qui a ouvert les deux sources du compte et des charges communes. Demandez à chaque binôme de garder sur papier ses choix des décisions 1 et 5.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Écrivez au tableau les estimations relevées, du plus bas au plus haut : on y trouve souvent −16 k€, 110 k€ et 44 k€. Reconstituez avec la classe le compte de la plomberie-chauffage, de la marge sur coût variable à la marge sur coûts spécifiques, puis retrouvez le −16 k€ du tableau en retranchant les 60 k€ de charges communes. Terminez par la ligne qui prépare la décision : sur 66 k€ de coûts spécifiques, 21 k€ seulement disparaîtraient ce trimestre.",
    },
    {
      minutes: 25,
      titre: "La décision qui partage la classe",
      detail:
        "Faites lever la main sur la décision 1 : arrêter, montrer la marge sur coûts spécifiques, relever les prix, attendre. Faites défendre chaque camp avec un chiffre, puis calculez ensemble ce que devient le résultat de l'agence sans la gamme, et ce que devient le gros œuvre au tableau quand les 216 k€ de charges communes se répartissent sur trois gammes. Reprenez de la même façon la décision 5, où la tête de gondole outillage a ses partisans.",
    },
    {
      minutes: 10,
      titre: "Le bilan des trente tirages",
      detail:
        "Projetez le bilan d'un élève qui a attendu en décision 1 : sous le tirage 12, la direction n'a pas tranché, et son résultat égale celui du meilleur chemin. Montrez ensuite les trente tirages, où attendre coûte près de 18 k€ en moyenne. Faites formuler la différence entre une décision bien prise et un trimestre bien fini.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Écrivez au tableau la cascade : chiffre d'affaires, coûts variables, marge sur coût variable, coûts spécifiques, marge sur coûts spécifiques, charges communes, résultat. Faites noter la règle de décision : on arrête une activité quand sa marge sur coût variable ne paie pas les coûts qu'on évite en l'arrêtant, pas quand son résultat en coût complet est négatif. Distribuez l'exercice de prolongement, à faire en classe ou à la maison.",
    },
  ],
  calcul: {
    reponse: 44,
    etapes: [
      "Source « Décomposer le compte de la plomberie-chauffage avec Ninon » : chiffre d'affaires 500 k€, coûts variables 390 k€, d'où une marge sur coût variable de 110 k€, soit un taux de 22 %.",
      "Coûts spécifiques de la gamme, même source : 14 + 6 + 8 + 7 + 9 + 5 + 8 + 9 = 66 k€ (vendeur-conseil, magasinier, local annexe, showroom, détention du stock, démarque, SAV, porteur).",
      "Marge sur coûts spécifiques : 110 − 66 = 44 k€. La valeur porte sur le trimestre dernier : elle ne dépend ni du hasard ni des décisions, et vaut 44 k€ sous la graine 12 comme sous toutes les autres.",
      "Rapprochement avec le tableau, source « Lister les charges communes, et ce qui partirait avec la gamme » : 216 k€ de charges communes réparties à 12 % du chiffre d'affaires, soit 60 k€ pour la gamme ; 44 − 60 = −16 k€, le déficit affiché.",
      "Pour la décision, même source : seuls la détention du stock, la démarque et le showroom disparaîtraient ce trimestre, soit 9 + 5 + 7 = 21 k€ de coûts évitables sur 66 k€.",
    ],
    erreurs: [
      {
        valeur: -16,
        cause:
          "L'élève reprend le résultat en coût complet du tableau : il a retranché la part de 60 k€ de charges communes, qui n'appartient pas à la marge sur coûts spécifiques.",
      },
      {
        valeur: 110,
        cause:
          "L'élève s'arrête à la marge sur coût variable et oublie de retrancher les 66 k€ de coûts spécifiques.",
      },
      {
        valeur: 89,
        cause:
          "L'élève ne retranche que les 21 k€ de coûts évitables : il confond coût spécifique et coût évitable, deux notions qui ne servent pas à la même question.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le tableau montre −16 k€ depuis quatre trimestres : supprimer la gamme, c'est supprimer la perte.",
      ceQuiLeDejoue:
        "Sur un trimestre plein, l'arrêt fait perdre 110 k€ de marge sur coût variable pour 21 k€ de coûts évités : le résultat de l'agence passe de +20 k€ à −69 k€, avant même les achats des chauffagistes dans les autres rayons.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Une hausse de 5 % rapporte 25 k€ de marge sur le papier et efface le déficit sans rien arrêter.",
      ceQuiLeDejoue:
        "Les 25 k€ supposent un volume constant ; or, le taux de marge passant de 22 % à 25,7 %, il suffit de perdre 18,5 % des ventes pour tout reperdre, avec Calorive à dix minutes. Et la gamme n'a aucune « part de frais » à rattraper : sa marge sur coûts spécifiques est déjà de +44 k€.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Le corner est petit et la quincaillerie de finition est rentable : avec 60 % de ventes en plus, il se redressera.",
      ceQuiLeDejoue:
        "Le corner a une marge sur coûts spécifiques de 12 − 26 = −14 k€. À −15 %, son taux de marge sur coût variable tombe de 24 % à 10,6 % : même avec +60 % de volume, sa marge passe de 12 k€ à 7,2 k€, avant l'animation et le mobilier.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Une gamme déjà dans le rouge au tableau ne peut pas se permettre de baisser ses prix.",
      ceQuiLeDejoue:
        "S'aligner sur les 40 références comparées coûte 8 % de 225 k€, soit 18 k€ de marge sur un trimestre plein ; mais les chauffagistes achètent tout le chantier au même endroit, et c'est alors la marge entière de ces références, des raccords et d'une part des autres rayons qui part chez Calorive.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Supprimer le poste réduit les coûts spécifiques de 14 k€ et rapproche la gamme de l'équilibre au tableau.",
      ceQuiLeDejoue:
        "La source des congés d'août le chiffre : sans Lilian, −27 % de ventes sur la gamme, soit 30 k€ de marge sur coût variable perdus par trimestre pour 14 k€ de salaire économisé.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le gros œuvre fait près de la moitié du chiffre d'affaires de l'agence : c'est là qu'une opération pèse le plus.",
      ceQuiLeDejoue:
        "À −4 % et +12 % de volume, chaque euro de ventes d'avant rapporte 1,12 × 0,16 = 0,179 € de marge au lieu de 0,20 € : environ 3,8 k€ de marge perdue sur trois semaines, plus 3 k€ de prospectus.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le directeur régional demande du volume, et le gros œuvre est la gamme qui en fait le plus.",
      ceQuiLeDejoue:
        "La source des devis fait le calcul : à −8 %, le taux de marge du gros œuvre tombe de 20 % à 13 %, et il faudrait 67 % de volume en plus pour garder la même marge, quand 38 devis attendent d'être relancés sans remise.",
    },
  ],
  debrief: [
    "En semaine 1, qu'est-ce qui disparaîtrait vraiment avec la plomberie-chauffage, et qu'est-ce qui resterait ? Classez les 66 k€ de coûts spécifiques et les 216 k€ de charges communes en deux colonnes.",
    "Si l'on arrête la gamme, les 216 k€ de charges communes se répartissent sur les trois autres : que devient le gros œuvre au tableau de la direction, et quelle gamme faudrait-il alors arrêter au trimestre suivant ?",
    "La quincaillerie de finition est à +8 k€ au tableau. Comment le corner peinture, à −14 k€ de marge sur coûts spécifiques, pouvait-il y passer inaperçu, et pourquoi le relancer par une remise aggrave-t-il sa situation ?",
    "En décision 5, la tête de gondole outillage sans remise bat la matinée chauffagistes sur 9 tirages sur 30 et rapporte 3 k€ de moins en moyenne ; sous le tirage 12, elle fait 5 k€ de moins. Ceux qui l'ont choisie se sont-ils trompés de calcul, ou ont-ils préféré une option plus sûre ? Dans quelle situation auraient-ils eu raison ?",
    "Sous le tirage de la classe, la direction n'a pas tranché, et ceux qui ont demandé un trimestre de plus finissent exactement au même résultat que le meilleur chemin. Leur décision était-elle bonne ? Que disent les trente tirages, où attendre coûte près de 18 k€ en moyenne ?",
    "Puisque le coût complet trompe ici, à quoi sert-il ? Pour quelles décisions la direction a-t-elle raison de vouloir que chaque gamme couvre, à terme, sa part des charges communes ?",
  ],
  prolongement: {
    enonce:
      "Une librairie-papeterie a trois rayons. Livres : chiffre d'affaires 400 k€, coûts variables 280 k€, coûts spécifiques 50 k€. Papeterie : 250 k€, 150 k€, 30 k€. Jeux : 150 k€, 105 k€, 24 k€. Les charges communes, 120 k€, sont réparties au prorata du chiffre d'affaires. 1) Calculez le résultat de chaque rayon en coût complet et le résultat du magasin. 2) Calculez la marge sur coût variable, son taux et la marge sur coûts spécifiques de chaque rayon. 3) La gérante veut arrêter les jeux. Seuls 14 k€ de leurs coûts spécifiques disparaîtraient la première année, et les clients venus pour les jeux font 5 % des ventes de papeterie. Quel serait le résultat du magasin sans les jeux ? Que lui conseillez-vous ?",
    corrige:
      "1) Taux de répartition : 120 / 800 = 15 %. Livres : 120 − 50 − 60 = +10 k€ ; papeterie : 100 − 30 − 37,5 = +32,5 k€ ; jeux : 45 − 24 − 22,5 = −1,5 k€. Magasin : +41 k€. 2) Livres : marge sur coût variable 120 k€ (30 %), marge sur coûts spécifiques 70 k€ ; papeterie : 100 k€ (40 %), 70 k€ ; jeux : 45 k€ (30 %), 21 k€. 3) Sans les jeux : 45 k€ de marge perdue, 14 k€ de coûts évités, et 5 % de la marge de la papeterie, soit 5 k€, perdus avec les clients des jeux. Résultat : 41 − 45 + 14 − 5 = +5 k€, soit 36 k€ de moins. Il faut garder les jeux : ils apportent 21 k€ aux charges communes, et leur déficit de 1,5 k€ ne vient que de la répartition.",
  },
  evaluation: [
    "La marge sur coûts spécifiques de la gamme est calculée juste, 44 k€, avec la marge sur coût variable et les coûts spécifiques nommés à chaque étape.",
    "Le déficit de −16 k€ est expliqué par la part de charges communes réparties, chiffrée à 60 k€, et non par une gamme qui vendrait trop bas.",
    "La décision d'arrêt est jugée sur les coûts réellement évitables dans l'horizon, 21 k€, et non sur l'ensemble des coûts spécifiques.",
    "Le corner peinture est identifié comme la seule activité dont la marge ne couvre pas ses coûts spécifiques, chiffre à l'appui.",
    "Chaque choix est justifié par ses effets attendus, et non par le résultat obtenu sous le tirage de la classe.",
  ],
  vigilance:
    "L'épisode distingue coûts spécifiques (66 k€, ceux que la gamme seule fait exister) et coûts évitables dans le trimestre (21 k€), en classant le bail du local annexe, la location du porteur, le SAV et les salaires reclassés comme spécifiques mais non évitables : une convention que tous les manuels ne posent pas ainsi. Les coûts variables se limitent aux achats consommés et au transport sur achats, et la répartition des charges communes au prorata du chiffre d'affaires est une clé volontairement simple.",
};
