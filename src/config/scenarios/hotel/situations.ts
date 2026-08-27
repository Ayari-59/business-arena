import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de L'ESCALE (hôtellerie).
 *
 * Le fil rouge du secteur : une capacité rigide et périssable face à des
 * charges de structure écrasantes. Tout se joue sur le taux d'occupation et
 * sur le prix — jamais sur le stock, qui n'existe pas.
 */
export const HOTEL_SITUATIONS: SituationDef[] = [
  {
    code: "hotel_t1_reprise",
    title: "Soixante chambres et un crédit",
    narrative:
      "Vous reprenez L'ESCALE : 60 chambres, quatorze salariés, 900 000 € de crédit immobilier et une clientèle partagée entre affaires en semaine et tourisme le week-end. Le trimestre offre 5 400 nuitées à vendre. Pas une de plus, pas une reportable.",
    problem:
      "Qu'est-ce qui distingue fondamentalement une nuitée invendue d'un article invendu dans un magasin ?",
    diagnosticOptions: [
      {
        id: "perishable",
        label: "Elle est définitivement perdue : une nuit ne se stocke pas et ne se revend jamais",
        correct: true,
      },
      {
        id: "fixed_costs_run",
        label: "Les charges de structure tombent que la chambre soit occupée ou non",
        correct: true,
      },
      {
        id: "resell_later",
        label: "Elle se reporte sur le trimestre suivant, comme un stock",
        correct: false,
      },
      {
        id: "no_cost",
        label: "Elle ne coûte rien puisqu'on n'a rien dépensé pour elle",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "marge_nuitee",
        prompt:
          "Une nuitée vendue 95 € coûte 21 € en variable (petit-déjeuner, blanchisserie, commission). Que rapporte-t-elle à la couverture des charges de structure ?",
        options: [
          { id: "a", label: "74 €" },
          { id: "b", label: "95 €" },
          { id: "c", label: "21 €" },
          { id: "d", label: "Cela dépend du taux d'occupation" },
        ],
        correctOptionId: "a",
        explain:
          "95 − 21 = 74 € de marge sur coût variable. En hôtellerie, cette marge est très élevée en proportion du prix : c'est pourquoi chaque point d'occupation compte autant.",
      },
      {
        id: "taux_equilibre",
        prompt:
          "Avec 158 000 € de charges de structure décaissées par trimestre et 74 € de marge par nuitée, combien de nuitées faut-il vendre pour équilibrer ?",
        options: [
          { id: "a", label: "Environ 2 140, soit 40 % d'occupation" },
          { id: "b", label: "Environ 5 400, soit 100 % d'occupation" },
          { id: "c", label: "Environ 1 660, soit 31 % d'occupation" },
          { id: "d", label: "Environ 3 500, soit 65 % d'occupation" },
        ],
        correctOptionId: "a",
        explain:
          "158 000 ÷ 74 ≈ 2 140 nuitées sur 5 400 offertes, soit ~40 %. En ajoutant les budgets commerciaux et d'entretien, le seuil réel monte vers 52 % : c'est le taux d'occupation d'équilibre, l'indicateur que tout hôtelier surveille.",
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
      "Comptez ce que l'hôtel peut vendre au maximum sur un trimestre : 60 chambres × 90 nuits.",
      "Une chambre vide ce soir ne se vendra pas deux fois demain. La capacité est offerte chaque jour et expire chaque nuit.",
      "Vos charges de structure (salaires, énergie, taxes, assurances) ne dépendent pas du nombre de clients.",
      "Marge par nuitée = 95 − 21 = 74 €. Charges de structure décaissées = 158 000 € par trimestre.",
      "Seuil = 158 000 ÷ 74 ≈ 2 140 nuitées, soit 40 % d'occupation. Au-delà, chaque nuitée apporte 74 € presque intégralement en résultat : c'est le levier d'exploitation de l'hôtellerie.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "hotel_t2_yield",
    title: "Brader ou tenir son prix ?",
    narrative:
      "Jeudi soir, 18 h. Dix-sept chambres sont encore libres pour la nuit. Une plateforme vous propose de les écouler à 58 €, bien en dessous de votre tarif affiché de 95 €, et sous les yeux de vos clients habituels.",
    problem:
      "Accepter 58 € pour une chambre qui vaut 95 € : décision absurde ou bonne gestion ?",
    diagnosticOptions: [
      {
        id: "above_variable",
        label: "Tant que le prix dépasse le coût variable de 21 €, la vente améliore le résultat",
        correct: true,
      },
      {
        id: "price_image",
        label: "Mais brader systématiquement abîme le tarif de référence et la clientèle affaires",
        correct: true,
      },
      {
        id: "never_below",
        label: "Il ne faut jamais vendre sous le tarif affiché, à aucune condition",
        correct: false,
      },
      {
        id: "full_cost",
        label: "Il faut refuser : 58 € ne couvre pas le coût complet d'une chambre",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "cout_pertinent",
        prompt:
          "Pour décider d'accepter cette nuitée à 58 €, quel coût est PERTINENT ?",
        options: [
          { id: "a", label: "Le coût variable de 21 €, seul coût que la décision fait apparaître" },
          { id: "b", label: "Le coût complet, charges de structure réparties comprises" },
          { id: "c", label: "Le prix de revient de la construction de l'hôtel" },
          { id: "d", label: "L'amortissement trimestriel du bâtiment" },
        ],
        correctOptionId: "a",
        explain:
          "Les charges de structure et l'amortissement sont engagés quoi qu'il arrive : ils ne sont pas pertinents pour cette décision-ci. Seul compte ce que la décision change réellement : 21 € de coût, 37 € de marge gagnée plutôt que zéro.",
      },
      {
        id: "risque_image",
        prompt:
          "Quel est le vrai danger d'un bradage systématique auprès de la clientèle affaires (élasticité −0,7) ?",
        options: [
          { id: "a", label: "Elle apprend à attendre les prix bas, et le tarif de référence s'effondre" },
          { id: "b", label: "Elle disparaît immédiatement, très sensible au prix" },
          { id: "c", label: "Rien : cette clientèle ne regarde pas les plateformes" },
          { id: "d", label: "Le coût variable augmente" },
        ],
        correctOptionId: "a",
        explain:
          "Une élasticité faible signifie que cette clientèle ne fuit pas pour quelques euros, mais elle observe. Brader une nuit sauve un trimestre ; brader chaque semaine détruit le prix moyen de tous les suivants.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      marginal_analysis: "acceptable",
      elasticity_analysis: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["variable_costs", "contribution_margin", "price_elasticity", "capacity"],
    hints: hints([
      "Posez la question autrement : que se passe-t-il si vous refusez ? La chambre reste vide et rapporte zéro.",
      "Comparez deux scénarios : vendre à 58 €, ou ne rien vendre du tout. Qu'est-ce qui change dans vos charges ?",
      "Les charges de structure sont déjà engagées : elles ne dépendent pas de cette décision. On parle de coûts non pertinents.",
      "58 € − 21 € de coût variable = 37 € de marge gagnée. Face à 0 € si la chambre reste vide, le calcul est sans appel.",
      "Mais l'arbitrage n'est pas seulement comptable : le tarif bradé est visible, et la clientèle affaires apprend vite. Le yield management consiste à brader tard, peu, et sans casser le tarif de référence.",
    ]),
    trigger: { round: 2 },
    weight: 1.5,
  },
  {
    code: "hotel_t3_saison",
    title: "La haute saison arrive",
    narrative:
      "L'été approche : le tourisme de loisirs double, la clientèle affaires s'effondre et les séminaires disparaissent complètement. Vos concurrents affichent déjà leurs tarifs de juillet.",
    problem:
      "Comment votre politique tarifaire et vos effectifs doivent-ils suivre une demande qui change de nature, pas seulement de volume ?",
    diagnosticOptions: [
      {
        id: "mix_change",
        label: "Le mix de clientèle change : le segment qui domine l'été n'a ni la même élasticité ni le même délai de paiement",
        correct: true,
      },
      {
        id: "staff_ahead",
        label: "Les embauches doivent être décidées avant le pic : elles ne produisent leur effet qu'au tour suivant",
        correct: true,
      },
      {
        id: "same_price",
        label: "Le tarif doit rester identique toute l'année, par souci d'équité",
        correct: false,
      },
      {
        id: "capacity_grows",
        label: "La capacité augmente naturellement en haute saison",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "elasticite_mix",
        prompt:
          "L'été, la clientèle loisirs (élasticité −1,75) domine au lieu des affaires (−0,7). Quelle conséquence sur votre marge de manœuvre tarifaire ?",
        options: [
          { id: "a", label: "Elle se réduit : une hausse de prix coûte désormais beaucoup plus de volume" },
          { id: "b", label: "Elle augmente : la demande est plus forte, donc on peut tout se permettre" },
          { id: "c", label: "Elle est identique : l'élasticité ne dépend pas du segment" },
          { id: "d", label: "Elle disparaît : le prix devient sans effet" },
        ],
        correctOptionId: "a",
        explain:
          "Une demande plus forte autorise des prix plus élevés, mais une clientèle plus élastique les sanctionne plus durement. Les deux effets jouent en sens contraire : c'est précisément l'arbitrage du yield management.",
      },
      {
        id: "embauche_decalage",
        prompt:
          "Vous embauchez trois saisonniers ce tour-ci. Quand la capacité de travail augmente-t-elle ?",
        options: [
          { id: "a", label: "Au tour suivant : le coût de recrutement est immédiat, l'effet est différé" },
          { id: "b", label: "Immédiatement, dès la signature" },
          { id: "c", label: "Jamais : l'effectif n'influence pas la capacité d'un hôtel" },
          { id: "d", label: "Au bout de deux tours" },
        ],
        correctOptionId: "a",
        explain:
          "C'est l'asymétrie fondamentale des ressources humaines : on paie le recrutement tout de suite, on récolte la capacité plus tard. Décider en juillet pour juillet, c'est décider trop tard.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      elasticity_analysis: "acceptable",
      scenarios_method: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["seasonality", "segmentation", "capacity", "price_elasticity"],
    hints: hints([
      "Regardez la saisonnalité de chaque segment séparément, pas seulement la saisonnalité globale.",
      "L'été, les affaires tombent à 0,5 et les séminaires à 0,3, mais le tourisme grimpe à 2,0. Ce n'est pas un pic : c'est un changement de clientèle.",
      "Chaque segment a son élasticité et son délai de paiement : le mix détermine à la fois votre latitude tarifaire et votre trésorerie.",
      "Côté capacité, 0,75 h de travail par nuitée : à 14 salariés, la main-d'œuvre peut devenir contraignante avant les chambres.",
      "Décidez les embauches AU TOUR PRÉCÉDENT le pic : le coût de recrutement est immédiat, l'effet sur la capacité arrive au tour suivant.",
    ]),
    trigger: { round: 3 },
    weight: 1.5,
  },
  {
    code: "hotel_t5_renovation",
    title: "Dix chambres condamnées",
    narrative:
      "Dix chambres du deuxième étage sont hors service depuis des années : salles de bains hors normes, moquettes fatiguées. Les rouvrir coûterait 90 000 €, amortis sur dix ans. Elles ajouteraient 900 nuitées vendables par trimestre.",
    problem:
      "Cet investissement vaut-il d'être fait, et sur quoi le jugez-vous ?",
    diagnosticOptions: [
      {
        id: "future_flows",
        label: "Sur les flux futurs qu'il génère, comparés au décaissement d'aujourd'hui",
        correct: true,
      },
      {
        id: "occupancy_matters",
        label: "Sur le taux d'occupation attendu de ces chambres : une chambre rouverte mais vide ne rapporte rien",
        correct: true,
      },
      {
        id: "breakeven_only",
        label: "Sur le seuil de rentabilité, qui suffit à trancher tout investissement",
        correct: false,
      },
      {
        id: "always_expand",
        label: "Agrandir est toujours rentable : plus de chambres, plus de chiffre d'affaires",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "van_principe",
        prompt: "La valeur actuelle nette d'un investissement compare :",
        options: [
          { id: "a", label: "Le décaissement initial aux flux futurs actualisés qu'il génère" },
          { id: "b", label: "Le chiffre d'affaires attendu au coût de l'investissement" },
          { id: "c", label: "L'amortissement annuel au résultat net" },
          { id: "d", label: "Le coût de l'investissement au seuil de rentabilité" },
        ],
        correctOptionId: "a",
        explain:
          "La VAN actualise : 74 € encaissés dans trois ans valent moins que 74 € aujourd'hui. C'est le seul modèle qui prenne le temps au sérieux ; le seuil de rentabilité, lui, l'ignore complètement.",
      },
      {
        id: "flux_pertinent",
        prompt:
          "Si ces 900 nuitées supplémentaires ne se remplissent qu'à 60 %, quel flux annuel supplémentaire faut-il retenir ?",
        options: [
          { id: "a", label: "900 × 0,60 × 74 € × 4 trimestres ≈ 159 800 €" },
          { id: "b", label: "900 × 95 € × 4 trimestres ≈ 342 000 €" },
          { id: "c", label: "900 × 74 € × 4 trimestres ≈ 266 400 €" },
          { id: "d", label: "90 000 € ÷ 10 ans = 9 000 €" },
        ],
        correctOptionId: "a",
        explain:
          "Ce sont les MARGES réellement encaissées qui comptent, pas le chiffre d'affaires théorique ni la capacité brute. Un investissement capacitaire ne vaut que par le taux d'occupation qu'on lui prête.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      irr: "acceptable",
      relevant_costs: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["discounting", "irr_payback", "capacity", "profitability_vs_return"],
    hints: hints([
      "Observez d'abord vos derniers tours : avez-vous refusé des clients faute de chambres, ou avez-vous eu du mal à remplir ?",
      "Un investissement ne se juge pas sur le chiffre d'affaires qu'il permet, mais sur la marge supplémentaire qu'il dégage.",
      "Le décaissement est immédiat, les flux s'étalent sur des années. Comparer directement les deux serait ignorer le temps.",
      "La VAN actualise les flux futurs à un taux : 90 000 € aujourd'hui contre 900 nuitées × taux d'occupation × 74 € par trimestre, pendant quarante trimestres.",
      "Testez plusieurs taux d'occupation : à 80 % l'opération est excellente, à 40 % elle détruit de la valeur. C'est une analyse de sensibilité qui doit accompagner votre VAN.",
    ]),
    trigger: { round: 5 },
    weight: 1.5,
  },
  {
    code: "hotel_detect_below_breakeven",
    title: "Sous le taux d'occupation d'équilibre",
    narrative:
      "Le trimestre s'achève en perte d'exploitation. L'hôtel a tourné, le personnel était là, les chambres étaient propres, mais trop d'entre elles sont restées vides trop souvent.",
    problem:
      "Vous êtes sous votre taux d'occupation d'équilibre. Baisser les prix pour remplir, ou les tenir pour préserver la marge ?",
    diagnosticOptions: [
      {
        id: "elasticity_decides",
        label: "Cela dépend de l'élasticité : la baisse ne paie que si le volume gagné compense la marge perdue",
        correct: true,
      },
      {
        id: "fixed_costs_pressure",
        label: "Avec des charges de structure aussi lourdes, remplir a une valeur particulière",
        correct: true,
      },
      {
        id: "cut_staff",
        label: "Licencier immédiatement est la seule réponse possible",
        correct: false,
      },
      {
        id: "raise_price",
        label: "Augmenter les prix pour compenser la perte sur les chambres vides",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "levier_exploitation",
        prompt:
          "Un hôtel a des charges de structure très lourdes et une marge unitaire très élevée. Comment se comporte son résultat quand l'occupation varie ?",
        options: [
          { id: "a", label: "Il varie très fortement : c'est un levier d'exploitation élevé" },
          { id: "b", label: "Il varie peu : les charges absorbent les écarts" },
          { id: "c", label: "Il ne dépend pas de l'occupation" },
          { id: "d", label: "Il varie proportionnellement au chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "Chaque nuitée au-delà du seuil apporte 74 € presque entièrement en résultat ; chaque nuitée manquante en retire autant. C'est le levier d'exploitation : ce qui rend l'hôtellerie explosive à la hausse et dangereuse à la baisse.",
      },
      {
        id: "marge_securite",
        prompt: "La marge de sécurité mesure :",
        options: [
          { id: "a", label: "L'écart entre l'activité réalisée et le seuil de rentabilité" },
          { id: "b", label: "La trésorerie disponible en fin de trimestre" },
          { id: "c", label: "Le nombre de chambres inoccupées" },
          { id: "d", label: "Le montant du découvert autorisé" },
        ],
        correctOptionId: "a",
        explain:
          "Elle dit de combien l'activité peut reculer avant que l'établissement ne bascule en perte. Négative, elle chiffre exactement le chemin à parcourir pour revenir à l'équilibre.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      elasticity_analysis: "acceptable",
      cvp_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["breakeven", "safety_margin", "contribution_margin", "price_elasticity"],
    hints: hints([
      "Calculez votre taux d'occupation réel du tour : nuitées vendues ÷ 5 400.",
      "Comparez-le à votre taux d'équilibre : environ 52 % une fois les budgets commerciaux financés.",
      "L'écart, converti en nuitées, vous dit ce qu'il manque. Reste à savoir par quel levier le combler.",
      "Baisser le prix agit sur deux grandeurs opposées : la marge unitaire baisse, le volume monte. C'est l'élasticité du segment visé qui décide.",
      "Chiffrez : à −10 % de prix sur la clientèle loisirs (élasticité −1,75), la demande gagne ~17,5 %. Marge à 95 € : 74 € ; à 85,50 € : 64,50 €. Comparez les marges TOTALES, pas les taux.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
  },
  {
    code: "hotel_detect_capacity_saturated",
    title: "Complet, et des clients refusés",
    narrative:
      "L'hôtel a affiché complet plusieurs nuits, et la réception a dû refuser du monde. C'est une excellente nouvelle. C'est aussi le signe que vous laissez de l'argent sur la table.",
    problem:
      "Quand la demande dépasse durablement la capacité, quels leviers avez-vous, et lequel coûte le moins cher ?",
    diagnosticOptions: [
      {
        id: "raise_price",
        label: "Monter le prix : la demande excédentaire absorbe la hausse sans perte de volume réelle",
        correct: true,
      },
      {
        id: "invest_rooms",
        label: "Investir pour rouvrir des chambres, si la saturation est durable et non saisonnière",
        correct: true,
      },
      {
        id: "lower_price",
        label: "Baisser le prix pour attirer encore plus de clients",
        correct: false,
      },
      {
        id: "do_nothing",
        label: "Ne rien faire : être complet est déjà l'optimum",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "prix_sature",
        prompt:
          "Quand la demande dépasse la capacité, augmenter le prix produit quel effet sur le résultat ?",
        options: [
          { id: "a", label: "Il augmente : les nuitées vendues restent les mêmes, mais chacune rapporte plus" },
          { id: "b", label: "Il baisse : on perd des clients" },
          { id: "c", label: "Il ne bouge pas : la capacité est fixe" },
          { id: "d", label: "Il dépend uniquement du coût variable" },
        ],
        correctOptionId: "a",
        explain:
          "C'est la situation la plus favorable qui soit : vendre à 105 € ce qu'on vendait 95 € sans perdre une seule nuitée. Refuser des clients à prix bas, c'est refuser de la marge.",
      },
      {
        id: "saturation_durable",
        prompt:
          "Avant d'investir 90 000 € dans de nouvelles chambres, que faut-il vérifier en priorité ?",
        options: [
          { id: "a", label: "Que la saturation est durable et non un simple pic saisonnier" },
          { id: "b", label: "Que le résultat net du trimestre est positif" },
          { id: "c", label: "Que le prix affiché est le plus élevé de la ville" },
          { id: "d", label: "Que les concurrents investissent aussi" },
        ],
        correctOptionId: "a",
        explain:
          "Une capacité créée pour trois semaines d'été se paie douze mois par an, en amortissements et en charges. La saisonnalité se gère par le prix ; la croissance durable, par l'investissement.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      npv: "acceptable",
      elasticity_analysis: "acceptable",
      cash_budget: "irrelevant",
    },
    conceptCodes: ["capacity", "demand_market_share", "price_elasticity", "discounting"],
    hints: hints([
      "Regardez votre taux d'utilisation : à quel niveau êtes-vous, et sur combien de tours ?",
      "Refuser un client, c'est perdre 74 € de marge, mais c'est aussi le signe que votre prix est trop bas.",
      "Quand la capacité est saturée, le prix devient le seul levier gratuit : il ne coûte rien à mettre en œuvre.",
      "Avant d'investir, distinguez saturation SAISONNIÈRE (un pic d'été) et saturation DURABLE (tous les tours). La première se gère par le prix.",
      "Si la saturation est durable, comparez le coût de la capacité (100 € par nuitée trimestrielle) aux marges futures actualisées : c'est une VAN, pas un seuil de rentabilité.",
    ]),
    trigger: { detect: "capacity_saturated" },
    weight: 1,
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  hotel_t1_reprise:
    "Le seuil de rentabilité traduit la question du secteur en une phrase : quel taux d'occupation faut-il atteindre pour ne plus perdre d'argent ?",
  hotel_t2_yield:
    "L'analyse des coûts pertinents isole ce que la décision change vraiment, les 21 € de coût variable, et écarte les charges déjà engagées, qui ne devraient jamais entrer dans cet arbitrage.",
  hotel_t3_saison:
    "L'analyse de capacité, croisée avec la saisonnalité par segment, dimensionne effectifs et tarifs avant le pic plutôt qu'après.",
  hotel_t5_renovation:
    "La VAN compare le décaissement d'aujourd'hui aux marges futures actualisées. Le seuil de rentabilité, lui, ignore le temps : il ne sait pas juger un investissement sur dix ans.",
  hotel_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart en nuitées et met en évidence le levier d'exploitation propre à l'hôtellerie.",
  hotel_detect_capacity_saturated:
    "L'analyse de capacité distingue la saturation saisonnière, qui se gère par le prix, de la saturation durable, qui justifie d'investir.",
};

attachModelQuestions(HOTEL_SITUATIONS, MODEL_EXPLAIN);
