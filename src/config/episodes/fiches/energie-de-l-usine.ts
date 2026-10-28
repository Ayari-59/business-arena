/**
 * FICHE ENSEIGNANT · ÉPISODE 107, LA FACTURE D'ÉNERGIE DE L'USINE.
 *
 * Réduire un coût d'énergie : mesurer par usage avant d'agir, régler avant
 * d'investir, couvrir le volume qu'on sait consommer. Le piège : croire que le
 * prix et l'horaire font la facture, signer trois ans de prix fixe sur tout le
 * volume, ou relever la consigne des chambres froides.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "energie-de-l-usine",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Mettre en œuvre des leviers d'amélioration continue des performances de l'organisation",
  ],
  notion:
    "Une facture d'énergie se réduit d'abord par ce qu'on mesure : on ne règle bien, on n'investit juste et on ne couvre bien que ce qu'on sait consommer, usage par usage. L'erreur classique consiste à croire que le prix et l'horaire font la facture : arrêter une ligne aux heures chères, signer un prix fixe de trois ans sur tout le volume actuel, au moment où l'on va justement consommer moins, ou économiser sur le froid au détriment de la sécurité des aliments. Dans l'épisode, Djibril Ouedraogo, responsable énergie de l'usine de Loudéac de la Laiterie de Kerbrélan, voit la facture passer de 2,9 à 5,1 M€ en deux ans ; le directeur financier veut signer trois ans à 103 €/MWh, la production propose d'arrêter la ligne 5 de 17 à 21 heures. Les relevés montrent que le réseau d'air comprimé appelle encore 110 kW le dimanche, lignes arrêtées : 964 MWh perdus par an, environ 140 k€ à 145 €/MWh. L'élève découvre que l'arrêt de la ligne ne fait gagner que 91 € par semaine, parce que seul l'acheminement distingue les heures, que 22 000 € de réglages mesurés valent plus qu'un compresseur neuf, que la récupération de chaleur se rembourse en deux ans et demi quand la pompe à chaleur ne paie pas son annuité, et que la chaîne du froid n'est pas une variable.",
  objectifs: [
    "Je calcule une consommation annuelle à partir d'une puissance et d'une durée, et je la traduis en euros.",
    "Je décompose une facture d'énergie par usage et par composante (fourniture, acheminement), et je dis sur quoi chaque décision agit.",
    "Je compare un investissement à son gain annuel par le délai de récupération et par l'annuité.",
    "Je choisis une couverture de prix en tenant compte du volume que je vais vraiment consommer et du risque de marché.",
  ],
  prerequis:
    "Le calcul d'un coût unitaire, d'un délai de récupération et la distinction entre charges fixes et variables doivent avoir été vus en cours. Les notions d'énergie (kW et MWh), de contrat indexé ou à prix fixe et d'annuité peuvent être introduites pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/energie-de-l-usine?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, l'électricité perdue chaque année dans les fuites d'air comprimé et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la première décision (ligne 5, sous-comptage, audit, contrat) et le contrat signé en semaine 8, où la classe se partage entre l'offre à trois ans, le ruban de 60 %, le prix fixe d'un an et le marché. Un binôme qui a fini tôt calcule le délai de récupération et l'annuité de la récupération de chaleur et de la pompe à chaleur.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir des relevés du dimanche : 110 kW appelés lignes arrêtées, sur un réseau sous pression 8 760 heures par an, soit 963,6 MWh. Vous faites expliquer les valeurs éloignées (18,5, 137, 963 600), puis vous traduisez en euros : à 145 €/MWh, environ 140 k€ par an, pour rien.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (consigne relevée, préparation, préparation et groupe de secours, rien) et de la semaine 8. Pour la ligne 5, vous faites calculer au tableau 0,38 MW × 20 heures × 12 €/MWh = 91 € par semaine, contre 3 400 € de samedis et 4 800 € de ruptures. Pour le contrat, vous faites comparer le volume des douze derniers mois (21 137 MWh) à celui que les relevés projettent après les économies (environ 19 960 MWh) : la clause de volume facture ce qu'on ne consomme plus.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12 (une canicule modérée, un marché qui baisse), « Mesurer, réparer, puis couvrir » finit 426 k€ sous les deux budgets, l'attentisme 53 k€ sous, « Le prix et l'horaire » 1,1 M€ au-delà ; sur les trente tirages, la première tient le budget 29 fois (269 k€ en moyenne), la deuxième une fois. Vous montrez la décision où le tirage de la classe punit plus que la moyenne : la consigne relevée a fait cette fois un retrait-rappel, et perd ici 434 k€ ; sur les trente tirages, 155 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de Gweltaz Le Gac : mesurer usage par usage avant de toucher au contrat, on ne couvre bien que ce qu'on sait consommer. Vous la déclinez en quatre temps : mesurer, régler, investir sur un besoin mesuré, couvrir le talon, puis suivre pour que les fuites ne reviennent pas. Vous rappelez la limite posée par Efflam Jézéquel : ni la sécurité des aliments ni le taux de service ne sont des variables d'économie. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 963.6,
    etapes: [
      "Source « Relever les sous-compteurs existants, et l'usine un dimanche, lignes arrêtées » : le dimanche, lignes arrêtées et aucun nettoyage en cours, les compresseurs appellent encore 110 kW. C'est la puissance perdue par le réseau.",
      "Même source : le réseau reste sous pression 8 760 heures par an (24 × 365), jour et nuit, semaine et week-end : la fuite ne s'arrête jamais.",
      "Énergie perdue : 110 kW × 8 760 h = 963 600 kWh, soit 963,6 MWh par an. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 50 MWh près, proche à 150.",
      "Contrôle par la semaine : 110 × 168 heures = 18,48 MWh par semaine, sur les 61,5 MWh d'air comprimé : les fuites font environ 30 % de l'air.",
      "En euros : au prix de l'électricité tout compris (144,84 €/MWh), 963,6 MWh coûtent environ 140 k€ par an. Réparer les fuites étiquetées en supprime 75 %, dans les 22 000 € de réglages.",
    ],
    erreurs: [
      {
        valeur: 18.5,
        cause:
          "La perte d'une semaine (110 kW × 168 h = 18,48 MWh) donnée pour l'année : la prévision porte sur douze mois.",
      },
      {
        valeur: 137.3,
        cause:
          "La fuite comptée les seuls dimanches (110 kW × 24 h × 52) : on la mesure le dimanche parce que les lignes sont arrêtées, mais elle court toute la semaine.",
      },
      {
        valeur: 963600,
        cause:
          "Le bon calcul laissé en kWh (110 × 8 760) : la prévision est demandée en MWh, il faut diviser par 1 000.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Les fins de journée sont les heures les plus chères : arrêter la ligne 5 de 17 à 21 heures a un effet immédiat, et Gurvan Kerebel est prêt.",
      ceQuiLeDejoue:
        "La décomposition de la facture le dit : le contrat est indexé sur la moyenne mensuelle du marché, et seul l'acheminement distingue les heures, de 12 €/MWh en été. Les 7,6 MWh déplacés chaque semaine (0,38 MW × 20 heures) ne font gagner que 91 €, contre 3 400 € de samedis majorés et 4 800 € de pénalités et de ventes perdues : les yaourts aromatisés ne se produisent pas d'avance. Rejoué sur les trente tirages à la place de la campagne de sous-comptage, l'arrêt de la ligne perd 238 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Les produits sortent du tunnel à 4 °C de toute façon : remonter les chambres de 2 °C pendant la canicule soulage les groupes et la facture, sans aucun coût.",
      ceQuiLeDejoue:
        "Annaïg Le Dantec le dit : les durées de vie, de 24 à 35 jours, ont été validées avec un stockage à 4 °C, et le plan de maîtrise sanitaire ne permet pas 6 °C. L'économie, 8 % du froid, vaut deux à trois mille euros par semaine ; un autocontrôle non conforme bloque des lots (60 000 €), un lot livré en cause est rappelé (420 000 €). Sous le tirage n° 12, c'est un rappel, et la consigne relevée perd 434 k€ ; rejouée sur les trente tirages à la place de la préparation des groupes, elle perd 155 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Trois ans sans surprise, c'est ce que le comité attend après deux ans de hausse : Iwan Szymanski veut signer, et l'offre expire ce soir.",
      ceQuiLeDejoue:
        "L'offre fige 103 €/MWh hors acheminement pendant trois ans, quand le marché à terme cote plus bas et que les deux années suivantes cotent encore 1 et 2 % de moins ; elle porte sur tout le volume actuel, 21 137 MWh, alors que les relevés projettent moins après les réglages, et chaque MWh non consommé sous 95 % du volume est facturé 40 €. Le ruban de 60 % du volume mesuré, au prix à terme plus 2 €, couvre le talon qui tourne jour et nuit. Rejoué sur les trente tirages à la place du ruban, le contrat de trois ans perd 334 k€ en moyenne et ne fait mieux que 5 fois, quand le marché flambe.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Pour finir le trimestre sous le budget, on reprend l'arrêt de la ligne 5 jusqu'à fin septembre : c'est rapide.",
      ceQuiLeDejoue:
        "Le calcul n'a pas changé depuis juillet : 91 € gagnés par semaine contre les samedis et les ruptures, et à la rentrée les volontaires se font rares. Klervi Nédélec rappelle que, sans suivi, 40 % des fuites réparées reviennent dans l'année et que les réglages dérivent d'environ 30 % ; le suivi mensuel et la tournée trimestrielle coûtent 9 000 € cette année. Rejoué sur les trente tirages à la place du suivi, l'arrêt de la ligne perd 91 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de prix, d'autres un problème d'heures ou d'équipements vétustes. Qu'est-ce qui, dans les relevés du dimanche et la décomposition de la facture, montrait que la consommation était la première cause ?",
    "Arrêter la ligne 5 aux heures chères ne fait gagner que 91 € par semaine. Pourquoi l'heure de consommation ne change-t-elle presque rien au prix, avec ce contrat ? Que coûte, en face, ce qu'on ne produit pas ?",
    "La récupération de chaleur se rembourse en deux ans et demi ; la pompe à chaleur évite plus de gaz, mais consomme de l'électricité à 145 €/MWh pour remplacer du gaz à 52. Que comparez-vous pour choisir : le gaz évité, le délai de récupération ou l'annuité ?",
    "Pourquoi une couverture se dimensionne-t-elle sur le volume mesuré après les économies, et pas sur celui des douze derniers mois ? Que fait la clause de volume à celui qui a signé trois ans sur tout le volume actuel ?",
    "Sous le tirage n° 12, la consigne relevée des chambres froides a fini en retrait-rappel. Ceux qui l'ont choisie ont-ils eu de la malchance, ou pris une mauvaise décision ? Que vaut une économie de quelques milliers d'euros contre 12 % de risque de rappel à 420 000 € ?",
    "Le contrat de trois ans fait mieux que le ruban 5 fois sur les trente tirages, quand le marché flambe. Qu'est-ce qui distingue la qualité d'une décision de son résultat ? Le prix fixe d'un an, plus sûr et plus cher, était-il un mauvais choix ?",
    "Quelle règle gardez-vous pour réduire une facture d'énergie ? Formulez-la en une phrase, avec les étapes dans l'ordre.",
  ],
  prolongement: {
    enonce:
      "Dans une biscuiterie, le réseau d'air comprimé appelle 60 kW le dimanche, lignes arrêtées ; il reste sous pression toute l'année. L'électricité coûte 140 €/MWh tout compris. 1) Calculez l'électricité perdue chaque année dans les fuites, et son coût. 2) Une campagne de réparation coûte 15 000 € et supprime 70 % des fuites : quel gain annuel, et en combien de mois se rembourse-t-elle ? 3) On propose aussi une récupération de chaleur à 300 000 €, aidée à hauteur de 50 000 €, qui évite 2 000 MWh de gaz par an à 50 €/MWh. Calculez son délai de récupération, puis son annuité sur dix ans à 8 % (14,9 % du montant net par an), et son gain net annuel. 4) Dans quel ordre engagez-vous ces deux actions, et pourquoi ?",
    corrige:
      "1) 60 kW × 8 760 h = 525 600 kWh, soit 525,6 MWh ; 525,6 × 140 = 73 584 € par an. 2) Gain : 70 % × 73 584 ≈ 51 509 € par an ; 15 000 / 51 509 ≈ 0,29 an, soit environ 3,5 mois. 3) Montant net : 300 000 − 50 000 = 250 000 € ; gain : 2 000 × 50 = 100 000 € par an ; délai de récupération : 250 000 / 100 000 = 2,5 ans ; annuité : 0,149 × 250 000 = 37 250 € ; gain net annuel : 100 000 − 37 250 = 62 750 €. 4) D'abord la réparation des fuites : elle coûte peu, agit tout de suite et se rembourse en quelques mois. Ensuite l'investissement, dimensionné sur les besoins d'eau chaude mesurés, et un suivi pour que les fuites réparées ne reviennent pas.",
  },
  evaluation: [
    "La perte annuelle des fuites est calculée juste (110 kW × 8 760 h = 963,6 MWh) à partir de la source nommée, et traduite en euros.",
    "L'élève dit sur quelle composante de la facture agit chaque décision (consommation, fourniture, acheminement) et explique pourquoi l'arrêt de la ligne 5 ne rapporte presque rien.",
    "Les investissements sont comparés par leur délai de récupération et leur annuité, sur des besoins mesurés.",
    "Le contrat retenu est justifié par le volume mesuré après économies et par le risque de marché, et l'élève sait ce que la clause de volume coûte.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La consigne de 4 °C, les durées de vie validées et les suites d'un autocontrôle non conforme (lots bloqués, retrait-rappel) sont reprises de l'épisode telles qu'il les pose, dans le cadre du plan de maîtrise sanitaire ; les températures réglementaires de conservation des produits laitiers frais sont à vérifier sur les textes en vigueur avant d'être énoncées. Les certificats d'économies d'énergie, les tarifs d'acheminement et les structures de contrat (ruban, clause de volume) sont simplifiés et leurs montants fictifs.",
};
