/**
 * FICHE ENSEIGNANT · ÉPISODE 70, LES JOURS QU'ON NE FACTURE PAS.
 *
 * Taux d'occupation et taux de réalisation dans un cabinet de conseil : un
 * consultant occupé n'est pas un consultant facturé, et monter l'occupation
 * sur des forfaits dépassés augmente la perte.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "jours-non-factures",
  formations: ["dcg", "but-gea", "but-gaco"],
  programme: [
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
  ],
  notion:
    "Dans une entreprise qui vend du temps, l'indicateur qu'on regarde est souvent le taux d'occupation : les jours passés en mission sur les jours disponibles. L'erreur classique est de croire qu'un consultant occupé rapporte, alors qu'au forfait un jour passé au-delà des jours vendus ne rapporte rien : c'est le taux de réalisation (jours facturés sur jours passés) qui le montre. Dans l'épisode, Clélia Kerhervé, directrice des opérations du bureau de Nantes d'Atlas Conseil (75 consultants facturables), voit l'occupation à 72 %, la plus haute depuis deux ans, et la marge des missions tomber de 448 k€ à 362 k€. En mars, 1 080 jours passés, 918 facturés : 85 % de réalisation, 61,2 % des jours disponibles facturés. Trois forfaits sur dix-huit (Kervalan, Montlouvel, Talvenec) font 150 des 162 jours non facturés ; Kervalan finira à −41,1 k€. Le TJM moyen facturé monte (862 € contre 842 €) parce que les juniors sont sur le banc, pas parce que les prix passent. L'élève découvre qu'il faut lire la réalisation mission par mission, recentrer les forfaits et faire payer le hors-périmètre par un avenant, chiffrer sur le réalisé, mettre le banc en régie même sous le catalogue plutôt qu'en renfort sur une mission dépassée, et refuser de vendre au prix du client un travail qui coûte deux fois plus de jours.",
  objectifs: [
    "Je calcule et je distingue le taux d'occupation, le taux de réalisation et la part des jours disponibles facturés.",
    "Je repère, mission par mission, où se concentrent les jours non facturés, et je calcule une marge à terminaison.",
    "J'explique un effet de structure : pourquoi un TJM moyen peut monter sans qu'aucun prix ne monte.",
    "Je compare un jour de banc, un jour de renfort sur un forfait dépassé et un jour de régie sous le prix catalogue.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de coût fixe et de coût variable, de marge et de prix forfaitaire doivent être connues. Le vocabulaire du conseil (TJM, régie, forfait, intercontrat, reste à faire) est donné par l'épisode.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/jours-non-factures?hasard=13 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du taux de réalisation de mars, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, la réponse à Victoire Lanoë en semaine 1 (renforts, revue des forfaits, Kervalan seul, attente) et la politique de prix de la semaine 5. Aux plus rapides, vous demandez de recalculer le TJM moyen de mars à la structure de l'an dernier.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et reconstruisez le tableau de Tempora au tableau : jours passés et jours facturés, mission par mission. Vous faites expliquer les valeurs éloignées de 85 % (61,2, 72 ou 78,7). Vous calculez ensuite les trois indicateurs côte à côte (occupation 72 %, réalisation 85 %, facturation 61,2 %) et la part des jours non facturés qui tient aux trois forfaits : 150 sur 162.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 3 (Kervalan), de la semaine 5 (les prix) et de la semaine 7 (les juniors du banc). Pour Kervalan, vous faites lire la source sur le rythme : comités toutes les trois semaines, agenda des chefs de service. Pour les prix, la décomposition par grade : 720 € et 1 080 €, inchangés ; la part des juniors facturés passe de 66,0 à 60,6 %. Pour le banc : un jour de régie à 650 € rapporte 650 € de plus qu'un jour de banc.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 13, « Lire la réalisation, agir mission par mission » fait 589,9 k€ de marge des missions, « Monter l'occupation » 329,8 k€ avec 81,6 % d'occupation, et ne rien changer 405,8 k€ : la méthode qui occupe le plus fait le moins de marge. Vous montrez ensuite la banque : sous ce tirage, elle accepte la contre-proposition à 720 €, qui fait 5,6 k€ de mieux que d'accepter 650 € ; sur les trente tirages, elle perd 32,9 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez les trois taux et ce que chacun mesure, puis la règle de l'épisode : seule une journée facturée rapporte, et un jour de consultant coûte autant sur le banc qu'en mission. Vous la déclinez en trois gestes : lire la réalisation mission par mission, faire payer ce qui sort du périmètre, chiffrer sur le réalisé.",
    },
  ],
  calcul: {
    reponse: 85,
    etapes: [
      "Source « Extraire de Tempora les jours passés et facturés de mars, mission par mission » : régie 320 passés, 320 facturés ; quinze forfaits dans les clous 420 et 408 ; Kervalan 120 et 60 ; Montlouvel 100 et 55 ; Talvenec 120 et 75.",
      "Jours passés : 320 + 420 + 120 + 100 + 120 = 1 080. Jours facturés : 320 + 408 + 60 + 55 + 75 = 918.",
      "Taux de réalisation : 918 / 1 080 = 0,85, soit 85 %. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 0,5 point près.",
      "Pour la suite : occupation 1 080 / 1 500 = 72 % ; jours disponibles facturés 918 / 1 500 = 61,2 %. Jours non facturés : 162, dont 60 + 45 + 45 = 150 sur les trois forfaits qui dérapent, soit 93 %.",
    ],
    erreurs: [
      {
        valeur: 61.2,
        cause:
          "Les jours facturés sont rapportés aux 1 500 jours disponibles au lieu des jours passés : c'est la part des jours disponibles facturés, pas la réalisation.",
      },
      {
        valeur: 72,
        cause:
          "Le taux d'occupation du message de Prune Lecoeur est repris à la place de la réalisation : jours passés sur jours disponibles.",
      },
      {
        valeur: 78.7,
        cause:
          "La régie est retirée du calcul, comme si seuls les forfaits comptaient : (918 − 320) / (1 080 − 320) = 598 / 760.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Victoire Lanoë veut 80 % d'occupation en juin, une douzaine de consultants sont sur le banc, et Évangéline réclame trois juniors pour Kervalan.",
      ceQuiLeDejoue:
        "Le tableau de Tempora : les trois forfaits qui dérapent ont passé 340 jours en mars pour 190 facturés. La marge à terminaison refaite avec Prune : Kervalan −41,1 k€, Montlouvel −2,1 k€, Talvenec +0,6 k€. Un renfort y ajoute des jours non facturés et des frais. Chiamaka Darrigade le dit : regarde les jours facturés sur les jours passés, mission par mission. Rejoué sur les trente tirages à la place de la revue des forfaits, ce choix perd 48,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Évangéline tient la date avec trois consultants de plus, et le CCAP prévoit 400 € de pénalités par jour de retard.",
      ceQuiLeDejoue:
        "La relecture du marché : un quart du reste à faire sort du cahier des charges, et ce hors-périmètre, chiffré à 40 jours soit 33,6 k€, fait 9,3 % d'un marché de 360 k€, une modification que l'acheteur peut signer sans nouvelle mise en concurrence. La source sur le rythme : le CHU tient un comité toutes les trois semaines, un consultant de plus ne fait pas venir les chefs de service plus vite. Rejoué sur les trente tirages à la place de l'avenant, le renfort perd 35 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Dariush Vahidi le voit : le TJM moyen facturé est à 862 € contre 842 € il y a un an, nos prix passent, relevons-les de 6 %.",
      ceQuiLeDejoue:
        "La décomposition par grade : 720 € pour les juniors, 1 080 € pour les seniors, les mêmes qu'il y a un an ; la part des juniors dans les jours facturés est passée de 66,0 % à 60,6 %. À la structure de l'an dernier, le TJM de mars serait de 842 €. Trois propositions sur six ont été perdues sur le prix. Le chiffrage sur le réalisé, avec une provision de 10 % et des jalons, donne 96 % de réalisation contre 86 %. Rejoué sur les trente tirages à la place de ce chiffrage, le relèvement perd 63,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "La banque ne paie que 650 €, sous le catalogue à 720 € ; Kervalan, c'est un client à garder, et quatre juniors l'aident à finir.",
      ceQuiLeDejoue:
        "La source sur le banc : un junior coûte 340 € par jour, sur le banc, en renfort ou chez un client. Un jour de renfort sur un forfait déjà dépassé rapporte 0 €, frais en plus ; un jour de régie à 650 € rapporte 650 € de plus qu'un jour de banc. Évangéline le dit : il faudrait les former à deux ou trois semaines de la fin, et ce qui reste, ce sont ses arbitrages. Rejoué sur les trente tirages à la place de la régie, ce choix perd 55,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Zakaria Bellouti veut l'équipe qui connaît le dossier, au même prix : refuser, c'est perdre le client.",
      ceQuiLeDejoue:
        "Le réalisé de la phase 1 : « même prix » veut dire 60 jours vendus, 48,6 k€, pour 120 jours de travail, 50 % de réalisation ; rechiffré avec des jalons, 114 jours et 92,3 k€, 95 %. Oïhana le dit : Talvenec a accepté un chiffrage détaillé plus de deux fois sur trois. Rejoué sur les trente tirages à la place du rechiffrage, « même prix » perd 13 k€ en moyenne, et fait mieux 10 fois, quand Talvenec aurait refusé.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Victoire le dit : l'été arrive, et le banc avec ; une phase 2 occupe l'équipe jusqu'en septembre.",
      ceQuiLeDejoue:
        "Le chiffrage de la phase 2 : au TJM de l'équipe, 840 €, 60 k€ paient 71 jours, quand les quatre établissements en demandent 130, soit 55 % de réalisation et une perte à terminaison. Recoupé à deux établissements en tranche ferme, le périmètre demande 75 jours : 95 % au budget du CHU. Fañch Kerros le dit : des tranches, il sait faire. Rejoué sur les trente tirages à la place du périmètre recoupé, ce choix perd 14,6 k€ en moyenne et ne fait mieux que 5 fois.",
    },
  ],
  debrief: [
    "Occupation 72 %, réalisation 85 %, 61,2 % des jours disponibles facturés : lequel de ces trois chiffres explique la baisse de la marge ? Pourquoi celui qu'on regardait ne la montrait-il pas ?",
    "150 des 162 jours non facturés tiennent à trois missions sur dix-huit. Qu'est-ce que cela change à la manière d'agir ?",
    "Mettre le banc en renfort monte l'occupation vers 80 %. Pourquoi la marge baisse-t-elle quand même ?",
    "Le TJM moyen facturé monte de 842 à 862 € sans qu'aucun prix n'ait bougé. Expliquez cet effet de structure avec les chiffres de l'épisode.",
    "Un jour de régie à 650 €, sous le catalogue, valait-il mieux qu'un jour de renfort sur Kervalan ? Sous le tirage 13, la contre-proposition à 720 € a été acceptée et fait mieux ; sur les trente tirages, elle perd 32,9 k€ en moyenne. Que fallait-il faire ?",
    "Talvenec et le CHU proposent tous deux un prix qui ne paie que la moitié des jours. Comment répondre sans perdre le client ?",
    "Quelle règle gardez-vous pour piloter la marge d'une activité qui vend du temps ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Un bureau de conseil de vingt consultants a 400 jours disponibles en mai. Ils passent 300 jours en mission, dont 255 sont facturés. 1) Calculez le taux d'occupation, le taux de réalisation et la part des jours disponibles facturés. 2) Une mission au forfait a encore 50 jours vendus à 800 € à gagner, pour 80 jours de reste à faire ; un jour de l'équipe coûte 450 €, plus 50 € de frais que le forfait ne rembourse pas. Quelle est sa marge à terminaison ? 3) Pour la finir plus vite, on y met deux juniors du banc pendant dix jours chacun, à 340 € par jour et 50 € de frais ; ils ne font avancer la mission que de 5 jours. Que deviennent la marge à terminaison de la mission, et le taux d'occupation du bureau en mai ?",
    corrige:
      "1) Occupation 300 / 400 = 75 % ; réalisation 255 / 300 = 85 % ; jours disponibles facturés 255 / 400 = 63,75 %. 2) Valeur restante 50 × 800 = 40 000 € ; coût 80 × (450 + 50) = 40 000 € ; marge à terminaison 0 €. 3) L'équipe n'a plus que 75 jours à faire : 75 × 500 = 37 500 € ; les renforts coûtent 20 × (340 + 50) = 7 800 € ; marge à terminaison 40 000 − 37 500 − 7 800 = −5 300 €. L'occupation monte à 320 / 400 = 80 %, la réalisation tombe à 255 / 320 ≈ 79,7 %. L'occupation monte, la réalisation baisse et la mission perd 5 300 €. Le salaire des juniors aurait été payé sur le banc ; en renfort, il ne rapporte rien de plus, quand une régie, même sous le prix catalogue, l'aurait facturé.",
  },
  evaluation: [
    "Le taux de réalisation de mars est calculé juste, et distingué du taux d'occupation et de la part des jours disponibles facturés.",
    "Les jours non facturés sont attribués mission par mission, et la marge à terminaison des forfaits qui dérapent est lue avant d'agir.",
    "La hausse du TJM moyen est expliquée par l'effet de structure, chiffres par grade à l'appui.",
    "Chaque usage du banc (renfort, régie, attente) est comparé sur ce qu'il rapporte de plus, le salaire étant payé dans tous les cas.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 13.",
  ],
  vigilance:
    "L'épisode pose qu'une modification de moins de 10 % du marché initial peut être signée sans nouvelle mise en concurrence : la règle des modifications de faible montant des marchés publics est à vérifier avec un enseignant de droit public (seuils et conditions).",
};
