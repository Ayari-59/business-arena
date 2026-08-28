import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de VOLT FITNESS (modèle par abonnement).
 *
 * Le fil rouge du secteur : le client ne s'achète pas une fois, il se garde.
 * Un point d'attrition en moins vaut plus qu'un point de prix en plus.
 */
export const FITNESS_SITUATIONS: SituationDef[] = [
  {
    code: "fitness_t1_recurrent",
    title: "Mille six cents adhérents et un crédit",
    narrative:
      "Vous reprenez VOLT FITNESS : 1 200 m², huit salariés, un parc de machines financé à crédit et 1 600 adhérents qui paient 105 € par trimestre. Le chiffre d'affaires du prochain trimestre est déjà connu, à ceux qui partiront près.",
    problem:
      "Qu'est-ce qu'un revenu récurrent change à la façon de piloter l'entreprise ?",
    diagnosticOptions: [
      {
        id: "predictable",
        label: "Le chiffre d'affaires est prévisible : il retombe tel quel au tour suivant si personne ne part",
        correct: true,
      },
      {
        id: "churn_is_the_lever",
        label: "La question centrale devient « combien partent ? » plutôt que « combien j'en vends ? »",
        correct: true,
      },
      {
        id: "no_risk",
        label: "Un revenu récurrent supprime le risque : les charges sont couvertes d'avance",
        correct: false,
      },
      {
        id: "price_only",
        label: "Seul le prix de l'abonnement détermine la performance",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "marge_adherent",
        prompt:
          "Un abonnement à 105 € le trimestre coûte 15 € en variable. Que rapporte un adhérent à la couverture des charges ?",
        options: [
          { id: "a", label: "90 € par trimestre, et autant à chaque trimestre où il reste" },
          { id: "b", label: "105 € une seule fois" },
          { id: "c", label: "15 € par trimestre" },
          { id: "d", label: "90 €, une seule fois à l'inscription" },
        ],
        correctOptionId: "a",
        explain:
          "C'est toute la différence du modèle par abonnement : la marge se répète sans nouvel effort commercial, tant que l'adhérent reste.",
      },
      {
        id: "seuil_adherents",
        prompt:
          "Avec 78 000 € de charges de structure décaissées et 90 € de marge par adhérent, combien faut-il d'adhérents pour équilibrer ?",
        options: [
          { id: "a", label: "Environ 870, soit 40 % de la capacité" },
          { id: "b", label: "Environ 2 200, soit la capacité entière" },
          { id: "c", label: "Environ 1 600, l'effectif actuel" },
          { id: "d", label: "Environ 430" },
        ],
        correctOptionId: "a",
        explain:
          "78 000 ÷ 90 ≈ 867 adhérents sur 2 200 places. Au-delà, chaque adhérent supplémentaire apporte 90 € presque intégralement en résultat.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      capacity_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["contribution_margin", "fixed_costs", "breakeven", "capacity"],
    hints: hints([
      "Distinguez ce que coûte UN adhérent de plus de ce que coûte la salle, pleine ou vide.",
      "Le loyer, les coachs et le crédit tombent identiquement que vous ayez 800 ou 2 000 adhérents.",
      "Chaque adhérent laisse 105 − 15 = 90 € par trimestre pour couvrir cette structure.",
      "Seuil = 78 000 ÷ 90 ≈ 870 adhérents. Vous en avez 1 600 : la marge de sécurité existe, mais l'été arrive.",
      "Et surtout : ces 90 € reviennent CHAQUE trimestre tant que l'adhérent reste. C'est ce qui distingue ce modèle de tous les autres.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "fitness_t2_attrition",
    title: "Ceux qui ne reviennent pas",
    narrative:
      "Le tableau des renouvellements est sorti. Sur les 400 inscrits de janvier, 62 renouvellent. Chez les pratiquants réguliers, en revanche, neuf sur dix restent, et certains sont là depuis six ans.",
    problem:
      "Combien vaut un adhérent conservé, comparé à un adhérent qu'il faut aller chercher ?",
    diagnosticOptions: [
      {
        id: "ltv",
        label: "Un adhérent vaut la somme des marges qu'il rapportera avant de partir, pas celle d'un seul trimestre",
        correct: true,
      },
      {
        id: "retention_beats_acquisition",
        label: "Réduire l'attrition augmente cette valeur sans dépenser un euro de publicité",
        correct: true,
      },
      {
        id: "same_thing",
        label: "Un adhérent conservé et un adhérent acquis se valent : tous deux paient 105 €",
        correct: false,
      },
      {
        id: "churn_normal",
        label: "L'attrition est une fatalité du métier : rien ne permet d'agir dessus",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "ltv_calcul",
        prompt:
          "Un adhérent rapporte 90 € de marge par trimestre et le taux d'attrition trimestriel est de 15 %. Quelle est sa valeur vie ?",
        options: [
          { id: "a", label: "600 €, il reste en moyenne un peu plus de six trimestres" },
          { id: "b", label: "90 €, un seul trimestre" },
          { id: "c", label: "13,50 €" },
          { id: "d", label: "1 350 €" },
        ],
        correctOptionId: "a",
        explain:
          "Valeur vie = marge ÷ taux d'attrition = 90 ÷ 0,15 = 600 €. Un adhérent n'est pas une vente : c'est une série de marges dont la longueur dépend de la rétention.",
      },
      {
        id: "effet_levier_churn",
        prompt:
          "Vous ramenez l'attrition de 15 % à 10 %. Que devient la valeur vie d'un adhérent ?",
        options: [
          { id: "a", label: "Elle passe de 600 € à 900 €, soit +50 %" },
          { id: "b", label: "Elle augmente de 5 %" },
          { id: "c", label: "Elle ne change pas : la marge trimestrielle est identique" },
          { id: "d", label: "Elle double" },
        ],
        correctOptionId: "a",
        explain:
          "90 ÷ 0,10 = 900 €. Cinq points d'attrition en moins valent 300 € par adhérent : aucun budget publicitaire n'offre un tel rendement.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      return_analysis: "acceptable",
      relevant_costs: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["discounting", "contribution_margin", "segmentation", "profitability_vs_return"],
    hints: hints([
      "Comparez deux adhérents : celui de janvier qui part en avril, et le régulier présent depuis six ans.",
      "Ils paient le même prix. Ce qui les distingue, c'est le NOMBRE de trimestres qu'ils paieront.",
      "Un adhérent n'est donc pas une vente ponctuelle : c'est une suite de marges futures, plus ou moins longue.",
      "Évaluer une suite de flux futurs, c'est exactement ce que fait la valeur actuelle nette. Valeur vie ≈ marge trimestrielle ÷ taux d'attrition.",
      "À 90 € de marge : 600 € si l'attrition est de 15 %, 900 € si elle tombe à 10 %. Le levier de la rétention est bien plus puissant que celui du prix.",
    ]),
    trigger: { round: 2 },
    weight: 1.5,
  },
  {
    code: "fitness_t3_ete",
    title: "Le creux de l'été",
    narrative:
      "Juillet. Le plateau est vide à quatorze heures, les cours collectifs sont annulés faute d'inscrits, et la moitié des adhérents de janvier ne s'est pas réinscrite. Le loyer, les salaires et l'échéance du crédit, eux, tombent comme chaque trimestre.",
    problem:
      "Comment traverser un trimestre où la demande s'effondre alors que les charges ne bougent pas ?",
    diagnosticOptions: [
      {
        id: "fixed_costs_stay",
        label: "Les charges de structure ne suivent pas la saison : c'est la définition même d'une charge fixe",
        correct: true,
      },
      {
        id: "anticipate",
        label: "Un creux saisonnier se prépare au trimestre précédent, pas pendant",
        correct: true,
      },
      {
        id: "fire_staff",
        label: "Licencier l'équipe pour l'été et réembaucher en septembre",
        correct: false,
      },
      {
        id: "close",
        label: "Fermer la salle deux mois : sans adhérents, autant économiser",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "saisonnalite_charges",
        prompt:
          "La demande chute de moitié en juillet. De combien baissent vos charges de structure ?",
        options: [
          { id: "a", label: "Elles ne baissent pas : loyer, salaires et crédit sont indépendants de la fréquentation" },
          { id: "b", label: "De moitié également" },
          { id: "c", label: "De 15 €, le coût variable par adhérent" },
          { id: "d", label: "Proportionnellement au taux de remplissage" },
        ],
        correctOptionId: "a",
        explain:
          "Seuls les 15 € de coût variable par adhérent disparaissent avec lui. Tout le reste continue de courir : c'est ce qui rend le creux d'été si dangereux.",
      },
      {
        id: "marge_securite",
        prompt:
          "Votre marge de sécurité mesure :",
        options: [
          { id: "a", label: "De combien l'activité peut reculer avant de basculer sous le seuil de rentabilité" },
          { id: "b", label: "Le montant du découvert autorisé" },
          { id: "c", label: "Le nombre de places libres sur le plateau" },
          { id: "d", label: "La trésorerie disponible en fin de trimestre" },
        ],
        correctOptionId: "a",
        explain:
          "Avec 1 600 adhérents et un seuil à 870, la marge de sécurité est de 730 adhérents. Un été qui en fait partir 800 fait basculer l'exercice.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cash_budget: "acceptable",
      scenarios_method: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["seasonality", "fixed_costs", "safety_margin", "breakeven"],
    hints: hints([
      "Regardez la saisonnalité de chaque segment : lequel s'effondre, lequel résiste ?",
      "Les inscrits de janvier tombent à 0,25 de leur niveau. Les réguliers, eux, restent à 0,75.",
      "Vos charges, elles, sont à 1,0 toute l'année. Seuls les 15 € de variable par adhérent disparaissent.",
      "Calculez votre marge de sécurité : combien d'adhérents pouvez-vous perdre avant de passer sous le seuil de 870 ?",
      "Les vraies réponses se jouent AVANT : fidéliser les inscrits de janvier, signer des contrats entreprises moins saisonniers, ou vendre des engagements annuels plutôt que trimestriels.",
    ]),
    trigger: { round: 3 },
    weight: 1.5,
  },
  {
    code: "fitness_t5_saturation",
    title: "Trop de monde aux heures de pointe",
    narrative:
      "Dix-huit heures trente. File d'attente devant les tapis, vestiaires pleins, et trois avis en ligne cette semaine sur le thème « impossible de s'entraîner correctement ». Vos adhérents réguliers commencent à demander un remboursement.",
    problem:
      "Vendre plus d'abonnements que la salle ne peut en accueillir : où est le piège ?",
    diagnosticOptions: [
      {
        id: "saturation_feeds_churn",
        label: "La saturation dégrade l'expérience, donc la rétention : l'attrition monte et détruit la valeur vie",
        correct: true,
      },
      {
        id: "double_capacity",
        label: "La capacité est double : la surface ET l'encadrement doivent suivre",
        correct: true,
      },
      {
        id: "sell_more",
        label: "Tant qu'il reste des places au fichier, il faut vendre : l'abonnement est du revenu pur",
        correct: false,
      },
      {
        id: "raise_price_only",
        label: "Il suffit d'augmenter le prix : les mécontents partiront d'eux-mêmes",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "cout_cache_saturation",
        prompt:
          "Vous inscrivez 300 adhérents de plus mais l'attrition passe de 10 % à 16 %. Que devient la valeur vie (marge 90 €) ?",
        options: [
          { id: "a", label: "Elle tombe de 900 € à 563 €, soit −37 % sur CHAQUE adhérent" },
          { id: "b", label: "Elle augmente grâce aux 300 nouveaux" },
          { id: "c", label: "Elle ne change pas : la marge est identique" },
          { id: "d", label: "Elle baisse de 6 %" },
        ],
        correctOptionId: "a",
        explain:
          "90 ÷ 0,16 = 563 €. La dégradation ne touche pas que les nouveaux : elle frappe toute la base. C'est pourquoi sur-vendre peut détruire plus de valeur qu'il n'en crée.",
      },
      {
        id: "contrainte_double",
        prompt:
          "Votre plateau accepte 2 200 adhérents et votre équipe peut en encadrer 2 427. Quelle est la capacité réelle ?",
        options: [
          { id: "a", label: "2 200 : la contrainte la plus serrée décide" },
          { id: "b", label: "2 427 : l'équipe suit" },
          { id: "c", label: "4 627 : les deux s'additionnent" },
          { id: "d", label: "2 313, la moyenne des deux" },
        ],
        correctOptionId: "a",
        explain:
          "Ajouter des coachs sans agrandir ne sert à rien, et agrandir sans recruter non plus. Les deux plafonds doivent monter ensemble.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      npv: "acceptable",
      relevant_costs: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["capacity", "productivity", "discounting", "demand_market_share"],
    hints: hints([
      "Regardez votre taux de remplissage, puis vos deux plafonds : la surface et l'encadrement.",
      "Un abonnement vendu à un adhérent qui ne peut pas s'entraîner reste encaissé, ce trimestre-ci seulement.",
      "La saturation ne coûte rien immédiatement : elle se paie au trimestre suivant, en résiliations.",
      "Et elle ne frappe pas que les nouveaux : toute la base subit la dégradation, donc toute la base voit sa valeur vie baisser.",
      "Trois voies : investir dans un plateau supplémentaire, recruter des coachs, ou étaler la fréquentation par le tarif (créneaux creux moins chers).",
    ]),
    trigger: { round: 5 },
    weight: 1.5,
  },
  {
    code: "fitness_detect_below_breakeven",
    title: "Sous le seuil",
    narrative:
      "Le trimestre s'achève en perte. La salle a ouvert tous les jours, les coachs étaient présents, le matériel fonctionnait, mais les adhérents n'étaient pas assez nombreux.",
    problem:
      "Recruter de nouveaux adhérents, retenir les anciens, ou réduire la structure : lequel agit le plus vite, et lequel le plus fort ?",
    diagnosticOptions: [
      {
        id: "retention_first",
        label: "Retenir coûte moins cher que recruter, et agit sur toute la base à la fois",
        correct: true,
      },
      {
        id: "quantify_gap",
        label: "Il faut d'abord chiffrer l'écart en adhérents avant de choisir un levier",
        correct: true,
      },
      {
        id: "cut_coaches",
        label: "Réduire l'équipe de coachs : c'est le poste le plus lourd",
        correct: false,
      },
      {
        id: "raise_price",
        label: "Augmenter le prix de l'abonnement sans rien changer d'autre",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "ecart_adherents",
        prompt:
          "Il manque 27 000 € pour équilibrer et chaque adhérent rapporte 90 € de marge. Combien d'adhérents manquent ?",
        options: [
          { id: "a", label: "300" },
          { id: "b", label: "27 000" },
          { id: "c", label: "2 430 000" },
          { id: "d", label: "90" },
        ],
        correctOptionId: "a",
        explain:
          "27 000 ÷ 90 = 300 adhérents. Convertir un écart en euros en un écart en clients rend la décision concrète : 300, c'est atteignable ; 3 000 ne le serait pas.",
      },
      {
        id: "cout_coach",
        prompt:
          "Pourquoi réduire l'équipe de coachs est-il dangereux dans ce modèle ?",
        options: [
          { id: "a", label: "Moins d'encadrement dégrade l'expérience, donc la rétention, donc le revenu récurrent" },
          { id: "b", label: "Les salaires sont des charges variables" },
          { id: "c", label: "Le licenciement est gratuit mais lent" },
          { id: "d", label: "L'effectif n'a aucun effet sur la capacité d'accueil" },
        ],
        correctOptionId: "a",
        explain:
          "Dans un modèle par abonnement, l'économie d'aujourd'hui devient l'attrition de demain. Le levier qui semble le plus rapide est souvent le plus coûteux.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      npv: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["breakeven", "safety_margin", "contribution_margin", "fixed_costs"],
    hints: hints([
      "Reprenez le compte de résultat : de combien manquez-vous exactement ?",
      "Divisez cet écart par 90 € : vous obtenez le nombre d'adhérents manquants.",
      "Trois leviers comme partout : la marge par adhérent, le nombre d'adhérents, la structure. Mais ici, un quatrième les traverse tous : l'attrition.",
      "Retenir un adhérent existant ne coûte rien en acquisition et agit sur toute la base. Recruter coûte, et ne remplace qu'un départ.",
      "Attention au faux ami : couper l'encadrement ou l'entretien améliore ce trimestre-ci et dégrade la rétention de tous les suivants.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
  },
  {
    code: "fitness_t4_annuel",
    title: "Douze mois encaissés d'avance",
    narrative:
      "Votre responsable commercial propose une formule annuelle : 340 € réglés en une fois, contre 105 € par trimestre aujourd'hui, soit 420 € sur l'année. Vous perdez 80 € par adhérent, mais vous encaissez tout au premier jour, et l'adhérent ne peut plus partir en cours d'année.",
    problem:
      "Que gagne réellement la salle à se faire payer d'avance, au-delà du chiffre d'affaires ?",
    diagnosticOptions: [
      {
        id: "bfr_negatif",
        label: "Encaisser avant de fournir la prestation finance l'exploitation : le besoin en fonds de roulement devient négatif",
        correct: true,
      },
      {
        id: "attrition_bloquee",
        label: "L'adhérent engagé pour l'année ne se perd plus en cours de route",
        correct: true,
      },
      {
        id: "remise_perte",
        label: "Une remise de 80 € est une perte sèche qu'aucun avantage ne compense",
        correct: false,
      },
      {
        id: "resultat_double",
        label: "Encaisser douze mois d'avance multiplie le résultat de l'exercice par quatre",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "fitness_bfr_negatif",
        prompt: "Une activité encaissée d'avance présente un besoin en fonds de roulement négatif, ce qui signifie que…",
        options: [
          { id: "a", label: "Les clients financent le cycle d'exploitation : l'argent rentre avant que les charges ne sortent" },
          { id: "b", label: "L'entreprise perd de l'argent sur son exploitation" },
          { id: "c", label: "Le fonds de roulement est insuffisant" },
          { id: "d", label: "Les fournisseurs sont payés comptant" },
        ],
        correctOptionId: "a",
        explain:
          "C'est la position enviable de la salle de sport, comme du restaurant ou du commerce de détail : le client paie avant d'avoir consommé, et cette avance finance l'activité gratuitement.",
      },
      {
        id: "fitness_produit_avance",
        prompt: "Le chiffre d'affaires d'un abonnement annuel encaissé en janvier…",
        options: [
          { id: "a", label: "Se rattache aux périodes pendant lesquelles la prestation est fournie, même si la trésorerie arrive tout de suite" },
          { id: "b", label: "Est intégralement acquis au résultat dès l'encaissement" },
          { id: "c", label: "N'apparaît qu'à la fin de l'année d'abonnement" },
          { id: "d", label: "Se comptabilise en dette financière" },
        ],
        correctOptionId: "a",
        explain:
          "Trésorerie et résultat ne suivent pas le même calendrier : l'argent est là, le produit ne l'est pas encore. Confondre les deux fait croire à une richesse qui n'existe pas.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      breakeven_analysis: "misleading",
      cash_budget: "acceptable",
      npv: "acceptable",
    },
    conceptCodes: ["bfr", "frng", "net_treasury", "discounting"],
    hints: hints([
      "Comparez d'abord ce que rapporte un adhérent sur l'année dans les deux formules : 420 € contre 340 €.",
      "Puis regardez QUAND cet argent arrive : quatre fois dans l'année, ou une seule fois en janvier ?",
      "Un encaissement anticipé, c'est de l'argent disponible pour payer les charges avant même d'avoir fourni la prestation.",
      "Cette avance des clients réduit votre besoin en fonds de roulement, parfois jusqu'à le rendre négatif : ce sont eux qui financent la salle.",
      "Ajoutez enfin l'attrition évitée : un adhérent engagé douze mois ne part pas en mars. Comparez ce gain aux 80 € de remise.",
    ]),
    trigger: { round: 4 },
    weight: 1,
  },
  {
    code: "fitness_t6_seconde_salle",
    title: "Une seconde salle, ou pas",
    narrative:
      "Un local se libère dans le quartier voisin : 220 000 € d'aménagement. Vous ne savez pas si la demande y est. Votre étude interne dit qu'il y a environ deux chances sur trois d'atteindre 1 400 adhérents, et une sur trois de plafonner à 600, auquel cas la salle perdrait de l'argent chaque trimestre.",
    problem:
      "Comment décider d'un investissement dont le résultat dépend d'un événement incertain ?",
    diagnosticOptions: [
      {
        id: "ponderer",
        label: "Il faut chiffrer chaque issue et la pondérer par sa probabilité",
        correct: true,
      },
      {
        id: "reduire_incertitude",
        label: "Une étude de terrain ou une ouverture progressive réduirait l'incertitude avant d'engager les 220 000 €",
        correct: true,
      },
      {
        id: "meilleur_cas",
        label: "Si le meilleur scénario est bon, l'investissement doit être fait",
        correct: false,
      },
      {
        id: "jamais_risque",
        label: "Un investissement dont une issue est déficitaire ne doit jamais être engagé",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "fitness_esperance",
        prompt: "L'espérance de gain d'une décision incertaine s'obtient en…",
        options: [
          { id: "a", label: "Multipliant chaque issue par sa probabilité, puis en additionnant" },
          { id: "b", label: "Retenant l'issue la plus probable" },
          { id: "c", label: "Faisant la moyenne simple des issues" },
          { id: "d", label: "Retenant systématiquement l'issue la plus défavorable" },
        ],
        correctOptionId: "a",
        explain:
          "Deux chances sur trois de gagner 90 000 € et une sur trois d'en perdre 60 000 donnent une espérance positive. Cela ne dit pas que vous gagnerez : cela dit que le pari est favorable.",
      },
      {
        id: "fitness_valeur_information",
        prompt: "Payer une étude avant de décider a de la valeur lorsque…",
        options: [
          { id: "a", label: "Son résultat est susceptible de changer la décision, et qu'elle coûte moins que ce que l'erreur coûterait" },
          { id: "b", label: "Elle confirme l'intuition du dirigeant" },
          { id: "c", label: "Elle est moins chère que l'investissement lui-même" },
          { id: "d", label: "Elle supprime totalement l'incertitude" },
        ],
        correctOptionId: "a",
        explain:
          "Une information qui ne changerait rien à la décision ne vaut rien, si bon marché soit-elle. C'est l'écart entre décider informé et décider à l'aveugle qui se paie.",
      },
    ],
    modelRelevance: {
      decision_tree: "optimal",
      breakeven_analysis: "misleading",
      npv: "acceptable",
      scenarios_method: "acceptable",
    },
    conceptCodes: ["discounting", "irr_payback", "capacity", "profitability_vs_return"],
    hints: hints([
      "Chiffrez d'abord les deux issues séparément : que rapporte la salle à 1 400 adhérents, que coûte-t-elle à 600 ?",
      "Actualisez chacune sur la durée de l'investissement : les flux lointains valent moins que les proches.",
      "Multipliez chaque résultat par sa probabilité, deux tiers et un tiers, puis additionnez.",
      "Une espérance positive rend le pari favorable. Vérifiez ensuite que la mauvaise issue ne mettrait pas la première salle en danger.",
      "Demandez-vous enfin ce qu'une étude préalable changerait à votre décision. Si la réponse est « rien », elle ne vaut pas son prix.",
    ]),
    trigger: { round: 6 },
    weight: 1,
  },
  {
    code: "fitness_detect_idle_cash",
    title: "Janvier a rempli la caisse",
    narrative:
      "Les inscriptions de début d'année ont fait entrer beaucoup d'argent d'un coup : plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture le découvert 9 %. Cet argent doit pourtant faire vivre la salle jusqu'à décembre, y compris pendant l'été où plus personne ne s'inscrit.",
    problem:
      "Cet argent qui dort, faut-il le placer, et jusqu'à quel montant ?",
    diagnosticOptions: [
      {
        id: "cout_opportunite",
        label: "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner",
        correct: true,
      },
      {
        id: "garder_de_quoi_payer",
        label: "Le montant bloqué ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir",
        correct: true,
      },
      {
        id: "tout_placer",
        label: "Puisque le placement rapporte, autant y mettre la totalité du solde",
        correct: false,
      },
      {
        id: "ameliore_exploitation",
        label: "Placer améliore le résultat d'exploitation de l'entreprise",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "fitness_detect_idle_cash_placement_exces",
        prompt: "Placer la totalité de sa trésorerie expose l'entreprise à…",
        options: [
          { id: "a", label: "Ouvrir un découvert à 9 % tout en détenant un placement à 2 %" },
          { id: "b", label: "Perdre le capital placé si le trimestre est mauvais" },
          { id: "c", label: "Un redressement fiscal sur les produits financiers" },
          { id: "d", label: "Une baisse mécanique de son chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "Le placement est bloqué : il ne paie rien pendant le tour. Si les décaissements dépassent ce qui reste en caisse, la banque ouvre un découvert, et vous payez d'un côté quatre fois ce que vous gagnez de l'autre.",
      },
      {
        id: "fitness_encaisse_avance",
        prompt: "Un encaissement perçu d'avance pour une prestation à fournir toute l'année…",
        options: [
          { id: "a", label: "Est de la trésorerie disponible, mais correspond à un service encore dû : il finance les charges des mois à venir" },
          { id: "b", label: "Constitue un bénéfice acquis dès l'encaissement" },
          { id: "c", label: "Peut être placé en totalité, la prestation ne coûtant rien" },
          { id: "d", label: "Doit être remboursé au client en fin d'exercice" },
        ],
        correctOptionId: "a",
        explain:
          "L'adhérent a payé pour douze mois d'ouverture, de chauffage et d'encadrement. Bloquer cette somme reviendrait à financer janvier avec l'argent de novembre, qui n'est pas encore gagné.",
      },
    ],
    modelRelevance: {
      cash_budget: "optimal",
      breakeven_analysis: "misleading",
      frng_bfr_analysis: "acceptable",
      npv: "acceptable",
    },
    conceptCodes: ["net_treasury", "frng", "bfr", "profitability_vs_return"],
    hints: hints([
      "Comparez votre solde aux charges de structure d'un trimestre : combien de trimestres la salle pourrait-elle ouvrir sans une inscription de plus ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera rien de ce qui tombera d'ici là.",
      "Projetez l'année entière, et surtout le creux de l'été : les charges tombent tous les mois, les inscriptions non.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  fitness_detect_idle_cash:
    "Le budget de trésorerie étale sur l'année les charges que l'encaissement de janvier doit couvrir. Seul lui montre que ce solde n'est pas un excédent, mais une avance à faire durer.",
  fitness_t4_annuel:
    "L'analyse FRNG / BFR montre ce que le compte de résultat cache : encaissé d'avance, l'abonnement fait financer l'exploitation par les adhérents eux-mêmes.",
  fitness_t6_seconde_salle:
    "L'arbre de décision chiffre chaque issue et la pondère par sa probabilité. Face à une demande incertaine, la VAN seule devrait choisir une hypothèse, donc parier sans le dire.",
  fitness_t1_recurrent:
    "Le seuil de rentabilité traduit le modèle récurrent en une question simple : combien d'adhérents faut-il pour couvrir une structure qui ne bouge jamais ?",
  fitness_t2_attrition:
    "Un adhérent est une SUITE de marges futures, pas une vente : c'est exactement ce qu'évalue la valeur actuelle nette. Le seuil de rentabilité, lui, ne raisonne que sur un trimestre.",
  fitness_t3_ete:
    "Le seuil de rentabilité et la marge de sécurité chiffrent ce que la saison peut emporter avant que l'exercice ne bascule.",
  fitness_t5_saturation:
    "L'analyse de capacité met en évidence la double contrainte, surface et encadrement, ainsi que le coût caché de la sur-vente : l'attrition qu'elle provoque.",
  fitness_detect_below_breakeven:
    "Le seuil de rentabilité convertit l'écart en nombre d'adhérents et rend la décision concrète, levier par levier.",
};

attachModelQuestions(FITNESS_SITUATIONS, MODEL_EXPLAIN);
