import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 35, « LES ÉCARTS DU BUDGET ».
 *
 * L'analyse des écarts sur coûts de production avec le budget flexible :
 * l'écart sur volume d'abord, puis les écarts sur prix et sur quantité des
 * matières, sur taux et sur temps de la main-d'œuvre.
 */
export const FICHE: FicheEnseignant = {
  code: "ecarts-du-budget",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Contrôle de gestion",
  ],
  notion:
    "L'analyse des écarts sur coûts de production compare le coût réel au coût préétabli de la production réellement obtenue, c'est-à-dire au budget flexible, puis décompose cet écart en écarts sur prix et sur quantité pour les matières, sur taux et sur temps pour la main-d'œuvre. L'erreur classique qu'elle corrige est double : juger un atelier sur l'écart au budget statique, qui mêle un écart sur volume à de vrais écarts sur coûts, et s'attaquer à l'écart le plus visible plutôt qu'au plus lourd. Dans l'épisode, l'atelier béton annonce 18,1 k€ de dépassement en un mois et tout désigne la hausse du ciment ; refait à 1 040 t au lieu de 1 000, le budget en absorbe 4,4 k€, et l'écart sur prix du ciment (1,1 k€) pèse trois fois moins que l'écart sur quantité de ciment (3,3 k€) et six fois moins que l'écart sur temps (6,5 k€). Ces deux derniers ont une cause technique commune, une presse mal réglée qui oblige à surdoser et fait rebuter. Le piège de chaque décision est un écart favorable facile à obtenir (un ciment moins cher, un dosage baissé, des heures majorées supprimées) qui en dégrade un autre davantage.",
  objectifs: [
    "Je refais le budget à la production réelle et je sépare l'écart sur volume des écarts sur coûts.",
    "Je calcule les écarts sur prix et sur quantité des matières, sur taux et sur temps de la main-d'œuvre, et je vérifie que leur somme retombe sur l'écart au budget flexible.",
    "Je hiérarchise les écarts par leur montant et je remonte d'un écart sur quantité à sa cause technique.",
    "Je repère l'écart favorable qui se paie par un écart défavorable ailleurs, prix contre quantité ou taux contre temps.",
  ],
  prerequis:
    "Les coûts préétablis (fiche de coût standard d'une unité produite), la notion de budget flexible et les formules des écarts sur matières et sur main-d'œuvre directe doivent avoir été vus en cours, au moins sur un exercice simple.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/ecarts-du-budget?hasard=6 : toute la classe joue le même trimestre, sous le même aléa. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous ne dites rien de la notion : rappelez seulement que le calcul demandé en semaine 1 sera corrigé au tableau, et qu'il faut le noter avant de le saisir.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les treize semaines et lisent leur bilan. Passez dans les rangs en semaine 1 : relevez qui refait le budget à la production réelle avant de décider, et notez au tableau, sans les commenter, les estimations de l'écart sur quantité de ciment. Repérez les binômes qui se partagent sur le ciment composé et sur la revue trimestrielle.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous confrontez les estimations relevées : elles se regroupent en général autour de 3,3, 3,4, 4,2 et 5,3 k€. Faites expliquer chaque valeur par un élève qui l'a trouvée, puis posez le calcul juste : quantité préétablie pour 1 040 t, écart valorisé au prix préétabli. Terminez par l'écart sur prix (1 068 €) et le contrôle par la somme.",
    },
    {
      minutes: 30,
      titre: "Débrief des décisions",
      detail:
        "Vous partez de la décision où la classe s'est le plus partagée, souvent le ciment composé ou la revue trimestrielle, et faites défendre chaque option par ceux qui l'ont prise. Puis vous projetez le bilan des 30 tirages d'un élève et posez les questions du débrief dans l'ordre. Gardez pour la fin la revue trimestrielle : sous l'aléa 6, ne rien changer a payé, et c'est la meilleure occasion de séparer la décision de son résultat.",
    },
    {
      minutes: 20,
      titre: "Synthèse",
      detail:
        "Vous reconstruisez au tableau la décomposition complète du mois dernier : écart sur volume 4 440 €, prix du ciment 1 068 €, quantité de ciment 3 300 €, quantité de granulats 880 €, quantité d'acier 1 400 €, taux 588 €, temps 6 460 €, soit 18 136 € d'écart au budget statique. Faites constater que l'acheteur n'agit que sur 1,1 k€ et l'atelier sur près de 12 k€. Distribuez l'exercice de prolongement.",
    },
  ],
  calcul: {
    reponse: 3.3,
    etapes: [
      "Source « Refaire le budget à la production réelle avec Gwendoline » : la fiche de coût prévoit 150 kg, soit 0,150 t, de ciment par tonne bonne, au prix préétabli de 150 €/t ; l'atelier a produit 1 040 t bonnes pour un budget de 1 000 t.",
      "Quantité préétablie pour la production réelle : 0,150 × 1 040 = 156 t de ciment, et non 150 t, qui correspondent au budget statique.",
      "Quantité réelle consommée : 178 t. Écart sur quantité = (178 − 156) × 150 = 22 × 150 = 3 300 €, soit 3,3 k€, positif donc défavorable dans la convention de l'épisode (réel − préétabli).",
      "Contrôle : écart sur prix = (156 − 150) × 178 = 1 068 € ; 3 300 + 1 068 = 4 368 €, soit le coût réel du ciment (178 × 156 = 27 768 €) moins son coût préétabli pour la production réelle (156 × 150 = 23 400 €).",
      "La valeur porte sur le mois qui précède le trimestre : elle ne dépend ni des aléas ni des décisions, et vaut 3,3 k€ pour toute la classe.",
    ],
    erreurs: [
      {
        valeur: 3.4,
        cause:
          "L'écart sur quantité est valorisé au prix réel : 22 × 156 = 3 432 €. L'épisode le juge proche, mais il mêle alors une part de l'écart sur prix à l'écart sur quantité.",
      },
      {
        valeur: 4.2,
        cause:
          "La quantité préétablie est prise dans le budget statique (0,150 × 1 000 = 150 t) au lieu de la production réelle : (178 − 150) × 150 = 4 200 €. L'écart sur volume est compté comme une surconsommation.",
      },
      {
        valeur: 5.3,
        cause:
          "L'élève reprend le message de la clôture, 27,8 k€ réels pour 22,5 k€ budgétés : 5 268 € mêlent l'écart sur prix (1 068 €), l'écart sur quantité (3 300 €) et l'écart sur volume du ciment (40 t × 22,50 € = 900 €).",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le ciment a augmenté de 4 %, c'est le poste que la contrôleuse cite en premier, et la renégociation ne coûte rien.",
      ceQuiLeDejoue:
        "Le budget flexible donne un écart sur prix du ciment de 1,1 k€ ((156 − 150) × 178), le tiers de l'écart sur quantité de ciment et le sixième de l'écart sur temps ; le geste de 2 €/t rapporte environ 0,36 k€ par mois. Sur les 30 tirages, cette option laisse l'atelier 43 k€ plus loin du budget flexible que le réglage de la presse.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "L'atelier dépasse son budget, donc on serre partout : moins de ciment, moins d'heures majorées, et c'est gratuit.",
      ceQuiLeDejoue:
        "La matinée au poste de la presse montre que le demi-sac (8 % de ciment en plus) compense une vibration à 42 Hz au lieu de 50 : le retirer sans régler la presse fait passer le rebut dû à la presse de 4 à 7 points, et chaque tonne rebutée coûte 1,3 heure de plus. C'est la pire option de la décision, 57 k€ derrière le réglage en moyenne sur les 30 tirages.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Les heures supplémentaires sont payées 47,50 €/h, 25 % au-dessus du taux préétabli, et le directeur désigne lui-même la main-d'œuvre.",
      ceQuiLeDejoue:
        "Le mois dernier, l'écart sur taux ne pesait que 0,6 k€ ((38,40 − 38) × 1 470) contre 6,5 k€ pour l'écart sur temps ((1 470 − 1,25 × 1 040) × 38 = 170 × 38), et la source sur la main-d'œuvre l'impute aux rebuts. Supprimer les heures majorées fait glisser les livraisons, à 15 € par tonne et par semaine de retard : 12 k€ de moins que le retour à la formule sur les 30 tirages.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "146 €/t au lieu de 168, pour la même résistance à 28 jours : l'écart sur prix du ciment devient favorable.",
      ceQuiLeDejoue:
        "La fiche technique demande 18 % de ciment en plus pour démouler à 16 heures : rapportée au dosage de la formule, la tonne revient à 146 × 1,18 = 172,28 €, plus cher que la hausse à 168 €, sans compter 1,5 point de rebut en plus. L'écart sur prix s'améliore, l'écart sur quantité se dégrade davantage : 15 k€ de moins que la négociation sur les 30 tirages.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "L'atelier dépasse déjà son budget ; 360 t de plus vont creuser le dépassement, et le directeur préfère refuser.",
      ceQuiLeDejoue:
        "Le calcul de la commande montre que les 360 t ajoutent 40,0 k€ au budget flexible, pas au dépassement, et laissent 59 €/t de marge sur coût variable, soit 21,2 k€ ; seules les heures au-delà de la capacité coûtent en plus. Refuser coûte 14 k€ en moyenne sur les 30 tirages par rapport à l'intérim.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le directeur veut un écart favorable sur le ciment pour la revue, et 5 % de dosage en moins le donne sans rien payer.",
      ceQuiLeDejoue:
        "La norme des bordures prévient qu'un béton dosé sous la formule passe mal l'essai de gel-dégel, et un lot refusé coûte environ 12 k€ : l'écart favorable sur quantité s'achète par un risque de refus. C'est l'option la plus risquée de la décision, et 8,4 k€ de moins que l'entretien en moyenne sur les 30 tirages.",
    },
  ],
  debrief: [
    "Le directeur extrapolait « plus de 50 k€ sur le trimestre » à partir des 18,1 k€ du mois. Que reste-t-il de ce dépassement une fois le budget refait à 1 040 t, et qu'est-ce que l'écart sur volume de 4,4 k€ dit des coûts de l'atelier ?",
    "En semaine 1, quel écart était le plus visible, et lequel était le plus lourd ? Classez l'écart sur prix du ciment, l'écart sur quantité de ciment et l'écart sur temps, et dites qui, de l'acheteur ou de l'atelier, peut agir sur chacun.",
    "Ceux qui ont recadré l'équipe sur le dosage en semaine 1 ont obtenu un meilleur écart sur quantité de ciment et vu les rebuts monter : pourquoi un écart sur quantité de matière peut-il se payer en écart sur temps ?",
    "Le ciment composé coûtait 22 €/t de moins. Que valait-il rapporté à la quantité qu'il fallait doser, et dans quel écart la différence est-elle réapparue ?",
    "Sur les 30 tirages, « Ne rien changer jusqu'à la clôture » fait mieux que l'entretien préventif dans 21 cas, et coûte pourtant près de 2 k€ de plus en moyenne. Sous l'aléa 6 de la classe, la presse n'a lâché chez personne, même chez ceux qui ne l'avaient jamais fait régler : ne rien changer a fait gagner à chacun les 1,8 k€ de l'entretien, et ceux qui avaient baissé le dosage pour la revue ont vu refuser leur lot de la semaine 13. Était-ce une bonne décision, ou de la chance ?",
    "Comparez votre résultat sous l'aléa 6 et votre moyenne sur les 30 tirages : qu'est-ce qui, dans votre trimestre, tenait à vos décisions, et qu'est-ce qui tenait aux aléas (la cimenterie, l'intérim, le roulement du vibreur, la panne) ?",
    "Si vous présentiez la revue trimestrielle au directeur, dans quel ordre présenteriez-vous les écarts, et lequel mettriez-vous en premier ?",
  ],
  prolongement: {
    enonce:
      "Un atelier de pièces moulées a pour fiche de coût préétabli, par pièce : 2 kg de résine à 4 €/kg et 0,5 heure de main-d'œuvre directe à 30 €/h. Le budget du mois portait sur 2 000 pièces. L'atelier en a produit 2 200, en consommant 4 700 kg de résine achetée 3,80 €/kg (un nouveau fournisseur) et 1 150 heures payées 31 €/h. 1) Calculez le coût préétabli d'une pièce, le budget statique, le budget flexible et l'écart sur volume. 2) Décomposez l'écart au budget flexible en écarts sur prix et sur quantité de résine, sur taux et sur temps de main-d'œuvre, en convention réel − préétabli, et vérifiez la somme. 3) Le responsable des achats présente le nouveau fournisseur comme une bonne affaire : que lui répondez-vous si la surconsommation de résine vient de sa qualité ?",
    corrige:
      "1) Coût préétabli : 2 × 4 + 0,5 × 30 = 23 € par pièce. Budget statique : 2 000 × 23 = 46 000 € ; budget flexible : 2 200 × 23 = 50 600 € ; écart sur volume : 4 600 €, qui ne dit rien des coûts. 2) Coût réel : 4 700 × 3,80 + 1 150 × 31 = 17 860 + 35 650 = 53 510 € ; écart au budget flexible : 2 910 € défavorable. Prix de la résine : (3,80 − 4) × 4 700 = −940 € (favorable). Quantité de résine : (4 700 − 2 × 2 200) × 4 = 300 × 4 = 1 200 € (défavorable). Taux : (31 − 30) × 1 150 = 1 150 € (défavorable). Temps : (1 150 − 0,5 × 2 200) × 30 = 50 × 30 = 1 500 € (défavorable). Somme : −940 + 1 200 + 1 150 + 1 500 = 2 910 € ; avec le volume, 7 510 € = 53 510 − 46 000. 3) Le fournisseur fait gagner 940 € sur le prix et en coûte 1 200 sur la quantité : l'affaire perd 260 € par mois, avant même les heures qu'une résine moins régulière peut faire perdre.",
  },
  evaluation: [
    "Le budget flexible est calculé sur la production réelle, et l'écart sur volume est isolé avant toute analyse des coûts.",
    "Les quatre écarts (prix, quantité, taux, temps) sont calculés avec les bonnes bases : quantité réelle pour les écarts sur prix et sur taux, prix et taux préétablis pour les écarts sur quantité et sur temps.",
    "La somme des écarts retombe sur l'écart au budget flexible, et le contrôle est montré.",
    "Chaque écart significatif est relié à une cause et à un responsable, et les écarts sont hiérarchisés par leur montant, pas par leur visibilité.",
  ],
  vigilance:
    "L'épisode calcule les écarts en réel − préétabli et dit au joueur qu'un écart positif est défavorable ; il valorise l'écart sur quantité (et sur temps) au prix (et au taux) préétabli et l'écart sur prix (et sur taux) sur la quantité réelle, sans écart mixte isolé : vérifiez que c'est la convention de votre cours, en particulier si vous enseignez préétabli − réel ou une décomposition à trois termes. Son « écart sur volume » est la différence budget flexible − budget statique sur les seuls coûts (4,4 k€ le mois dernier), que certains cours nomment écart sur activité et réservent, sous le nom d'écart sur volume, à l'analyse de la marge.",
};
