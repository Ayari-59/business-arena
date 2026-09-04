import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de LA TABLE D'AUGUSTIN (restauration).
 *
 * Le fil rouge du secteur : le ratio matières, et la double péremption —
 * le couvert non servi comme la denrée préparée non vendue sont perdus.
 */
export const BISTROT_SITUATIONS: SituationDef[] = [
  {
    code: "bistrot_t1_reprise",
    category: "prise_de_poste",
    title: "Le premier service",
    narrative:
      "Vous reprenez LA TABLE D'AUGUSTIN : 70 couverts, une brigade de dix, une carte héritée du chef précédent. Le comptable de la reprise vous a laissé une phrase : « surveille ton ratio matières, le reste suivra ».",
    problem:
      "Que signifie ce ratio, et pourquoi est-il l'indicateur roi de votre métier ?",
    diagnosticOptions: [
      {
        id: "food_cost",
        label: "C'est la part du coût des denrées dans le prix de vente : il mesure ce qu'il reste après avoir acheté à manger",
        correct: true,
      },
      {
        id: "small_drift",
        label: "Une dérive de deux points suffit à effacer le résultat, tant les marges du secteur sont minces",
        correct: true,
      },
      {
        id: "profit_margin",
        label: "C'est le taux de marge nette du restaurant",
        correct: false,
      },
      {
        id: "irrelevant",
        label: "C'est un indicateur secondaire : seul le nombre de couverts compte",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "ratio_calc",
        prompt:
          "Un ticket moyen de 33 € pour 10 € de denrées : quel est le ratio matières ?",
        options: [
          { id: "a", label: "Environ 30 %" },
          { id: "b", label: "Environ 70 %" },
          { id: "c", label: "Environ 3,3 %" },
          { id: "d", label: "Environ 23 %" },
        ],
        correctOptionId: "a",
        explain:
          "10 ÷ 33 ≈ 30 %. La profession vise 28 à 32 % : au-delà, la marge ne suffit plus à payer la brigade et le loyer.",
      },
      {
        id: "marge_couvert",
        prompt:
          "En ajoutant 3 € de frais variables (énergie de cuisson, consommables), que rapporte réellement un couvert à 33 € ?",
        options: [
          { id: "a", label: "20 € de marge sur coût variable" },
          { id: "b", label: "23 € de marge sur coût variable" },
          { id: "c", label: "33 € de chiffre d'affaires, donc 33 € de marge" },
          { id: "d", label: "10 € de marge" },
        ],
        correctOptionId: "a",
        explain:
          "33 − 10 − 3 = 20 €. C'est ce montant, et lui seul, qui vient couvrir les 90 000 € de charges de structure du trimestre.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cash_budget: "acceptable",
      relevant_costs: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["variable_costs", "contribution_margin", "breakeven", "margin_rates"],
    hints: hints([
      "Séparez ce que vous payez pour CHAQUE assiette servie de ce que vous payez chaque mois quoi qu'il arrive.",
      "Les denrées suivent les couverts ; la brigade, le loyer et l'énergie de base tombent même une salle vide.",
      "Le ratio matières rapporte le coût des denrées au prix de vente : c'est le premier chiffre que regarde un restaurateur chaque semaine.",
      "Marge par couvert = 33 − 10 − 3 = 20 €. Charges de structure décaissées = 90 000 € par trimestre.",
      "Seuil = 90 000 ÷ 20 = 4 500 couverts par trimestre, soit environ 50 par jour d'ouverture. En dessous, le service est déficitaire quelle que soit la qualité de la cuisine.",
    ]),
    trigger: { round: 1 },
    weight: 1,
    decisionLevers: [
      {
        field: "productionPlan",
        direction: "review",
        hint: "Le nombre de couverts à préparer dépend directement du seuil de rentabilité : en dessous de 50 par jour, chaque service est déficitaire.",
      },
      {
        field: "price",
        direction: "review",
        hint: "Le ticket moyen fixe la marge par couvert et donc le nombre de couverts nécessaires pour couvrir vos charges de structure.",
      },
    ],
  },
  {
    code: "bistrot_t2_fournisseur",
    category: "decision_strategique",
    title: "Le cash & carry ou le maraîcher",
    narrative:
      "Votre grossiste passe trois fois par semaine, facture à 21 jours, qualité régulière. Le cash & carry vous ferait gagner 14 % sur les denrées, payées comptant, à condition d'aller charger vous-même. Le maraîcher du coin coûte 20 % de plus, réglé à 15 jours, mais c'est lui que vous écririez sur l'ardoise.",
    problem:
      "Le ratio matières s'améliore avec le cash & carry. Est-ce une raison suffisante pour y aller ?",
    diagnosticOptions: [
      {
        id: "quality_perceived",
        label: "Non : la qualité perçue nourrit les avis en ligne, qui nourrissent la fréquentation du soir",
        correct: true,
      },
      {
        id: "cash_impact",
        label: "Payer comptant au lieu de 21 jours ponctionne la trésorerie, à résultat inchangé",
        correct: true,
      },
      {
        id: "ratio_only",
        label: "Oui : le ratio matières est le seul indicateur qui compte",
        correct: false,
      },
      {
        id: "premium_always",
        label: "Il faut toujours choisir le circuit court, quel qu'en soit le prix",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "gain_ratio",
        prompt:
          "Le cash & carry fait passer les denrées de 10 € à 8,60 € par couvert. Que devient le seuil de rentabilité, charges de structure inchangées ?",
        options: [
          { id: "a", label: "Il descend d'environ 4 500 à environ 4 200 couverts" },
          { id: "b", label: "Il monte à environ 5 200 couverts" },
          { id: "c", label: "Il ne change pas" },
          { id: "d", label: "Il descend à environ 2 800 couverts" },
        ],
        correctOptionId: "a",
        explain:
          "La marge par couvert passe de 20 € à 21,40 €. Seuil = 90 000 ÷ 21,40 ≈ 4 206 couverts. Le gain est réel, reste à savoir ce qu'il coûte en fréquentation.",
      },
      {
        id: "avis_inertie",
        prompt:
          "En restauration, la réputation évolue avec une inertie faible (0,45). Qu'est-ce que cela signifie concrètement ?",
        options: [
          { id: "a", label: "Elle réagit vite : une baisse de qualité se voit dans les avis dès le tour suivant" },
          { id: "b", label: "Elle ne bouge presque jamais" },
          { id: "c", label: "Elle ne dépend pas de la qualité servie" },
          { id: "d", label: "Elle met plusieurs années à se former" },
        ],
        correctOptionId: "a",
        explain:
          "Contrairement à l'hôtellerie ou au conseil, la réputation d'un restaurant se fait et se défait en quelques semaines. C'est une chance quand on progresse, un danger quand on rogne.",
      },
    ],
    modelRelevance: {
      multicriteria_matrix: "optimal",
      relevant_costs: "acceptable",
      cvp_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["variable_costs", "margin_rates", "bfr", "segmentation"],
    hints: hints([
      "Mettez les trois offres en colonnes : prix des denrées, qualité perçue, délai de règlement, temps de votre brigade.",
      "Le gain de 14 % est immédiat et chiffrable. Le coût, celui de la qualité perçue, est différé et indirect.",
      "Comparer des critères qui ne se mesurent pas dans la même unité, c'est le travail d'une matrice multicritère.",
      "Chiffrez le gain : 1,40 € par couvert, soit ~8 400 € par trimestre à 6 000 couverts. Comparez à ce que coûte une baisse de fréquentation du soir.",
      "N'oubliez pas la trésorerie : passer de 21 jours à comptant supprime une dette fournisseurs, donc augmente le BFR du montant de vos achats trimestriels.",
    ]),
    trigger: { round: 2 },
    weight: 1,
    decisionLevers: [
      {
        field: "qualityBudget",
        direction: "review",
        hint: "Le choix du fournisseur impacte directement la qualité perçue. Un budget qualité bien calibré protège la réputation, qui réagit vite en restauration.",
      },
      {
        field: "price",
        direction: "review",
        hint: "Si le coût des denrées baisse avec le cash & carry, la marge par couvert augmente — mais une baisse de fréquentation peut annuler le gain.",
      },
    ],
  },
  {
    code: "bistrot_t3_matieres",
    category: "contexte_marche",
    title: "Le beurre a pris 24 %",
    narrative:
      "Votre grossiste annonce une hausse brutale sur la moitié de votre carte : beurre, viande, énergie. Nous sommes en août, la salle est à moitié vide et les bureaux du quartier sont fermés.",
    problem:
      "Votre ratio matières dérape au pire moment. Que faites-vous de votre carte et de vos prix ?",
    diagnosticOptions: [
      {
        id: "menu_engineering",
        label: "Retravailler la carte : mettre en avant les plats dont la marge résiste, retirer ceux qui ne passent plus",
        correct: true,
      },
      {
        id: "price_by_segment",
        label: "Ajuster le prix en tenant compte de l'élasticité de chaque service : le midi et le soir ne réagissent pas pareil",
        correct: true,
      },
      {
        id: "absorb_all",
        label: "Tout absorber sans rien changer : la hausse finira bien par retomber",
        correct: false,
      },
      {
        id: "close",
        label: "Fermer le temps que les prix redescendent",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "seuil_deplace",
        prompt:
          "Les denrées passent de 10 € à 12,40 € par couvert. Combien de couverts faut-il désormais servir pour équilibrer, à prix et charges inchangés ?",
        options: [
          { id: "a", label: "Environ 5 110 au lieu de 4 500" },
          { id: "b", label: "Environ 4 500, inchangé" },
          { id: "c", label: "Environ 3 900" },
          { id: "d", label: "Environ 7 200" },
        ],
        correctOptionId: "a",
        explain:
          "La marge tombe de 20 € à 17,60 €. Seuil = 90 000 ÷ 17,60 ≈ 5 114 couverts. Soit 600 couverts de plus à servir : en plein creux d'août, c'est hors d'atteinte.",
      },
      {
        id: "elasticite_midi",
        prompt:
          "Le midi (élasticité −1,5) est plus sensible au prix que le soir (−1,2). Comment répercuter intelligemment ?",
        options: [
          { id: "a", label: "Moins sur la formule du midi, davantage sur la carte du soir" },
          { id: "b", label: "Uniformément sur tous les services, par équité" },
          { id: "c", label: "Davantage sur le midi, qui fait le plus de volume" },
          { id: "d", label: "Nulle part : il ne faut jamais augmenter ses prix" },
        ],
        correctOptionId: "a",
        explain:
          "On répercute là où la demande résiste le mieux. La formule du midi est un marché de prix : deux euros de plus et le client va en face ; le soir, on vient pour l'expérience.",
      },
    ],
    modelRelevance: {
      elasticity_analysis: "optimal",
      cvp_analysis: "acceptable",
      sensitivity_analysis: "acceptable",
      capacity_analysis: "irrelevant",
    },
    conceptCodes: ["price_elasticity", "contribution_margin", "breakeven", "seasonality"],
    hints: hints([
      "La hausse frappe une charge variable : quelle grandeur du compte de résultat bouge en premier ?",
      "Votre marge par couvert se comprime de 2,40 €. À 6 000 couverts, c'est 14 400 € de résultat qui s'évaporent par trimestre.",
      "Deux issues : répercuter sur le ticket, ou reconstruire la carte pour retrouver de la marge à prix constant.",
      "Le mois d'août amplifie tout : les déjeuners d'affaires tombent à 0,6 et les banquets à 0,5. Le volume ne viendra pas compenser.",
      "Répercutez segment par segment : élasticité −1,5 le midi contre −1,2 le soir. Une hausse uniforme est toujours sous-optimale quand les élasticités diffèrent.",
    ]),
    trigger: { round: 3 },
    weight: 1.5,
    decisionLevers: [
      {
        field: "price",
        direction: "up",
        hint: "Répercutez une partie de la hausse sur le prix du soir, là où l'élasticité est plus faible, pour protéger la marge sans trop perdre de couverts.",
      },
      {
        field: "productionPlan",
        direction: "down",
        hint: "En août, la demande chute : ajustez la préparation à la baisse pour éviter le gâchis de denrées déjà plus chères.",
      },
      {
        field: "qualityBudget",
        direction: "review",
        hint: "Retravailler la carte pour mettre en avant les plats dont la marge résiste permet de retrouver du ratio sans toucher au prix.",
      },
    ],
  },
  {
    code: "bistrot_t4_banquets",
    category: "contexte_marche",
    title: "La saison des banquets",
    narrative:
      "Décembre arrive : les repas d'entreprise et les banquets de fin d'année concentrent l'essentiel de leur budget annuel sur ce trimestre. Ils règlent à 30 jours, réservent des semaines à l'avance, et remplissent la salle un soir entier.",
    problem:
      "Combien de couverts préparer pour absorber le pic, et que risquez-vous en préparant trop ?",
    diagnosticOptions: [
      {
        id: "double_waste",
        label: "Sur-préparer coûte deux fois : les denrées partent à la poubelle et la marge avec",
        correct: true,
      },
      {
        id: "two_constraints",
        label: "Deux contraintes limitent le service : les places assises et les heures de brigade",
        correct: true,
      },
      {
        id: "stock_it",
        label: "Ce qui n'est pas servi se conserve et se vend au tour suivant",
        correct: false,
      },
      {
        id: "seats_only",
        label: "Seul le nombre de places assises limite le nombre de couverts",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "perissable",
        prompt:
          "Vous préparez 300 couverts de plus que ce que vous servez. Que deviennent les denrées correspondantes ?",
        options: [
          { id: "a", label: "Elles sont perdues et passent en charges du trimestre" },
          { id: "b", label: "Elles restent en stock à l'actif du bilan" },
          { id: "c", label: "Elles sont déduites du chiffre d'affaires" },
          { id: "d", label: "Elles sont reportées sur le trimestre suivant" },
        ],
        correctOptionId: "a",
        explain:
          "En restauration, rien ne se reporte : ni le couvert, ni la denrée préparée. Le gâchis est une charge du tour, exactement comme un rebut en industrie.",
      },
      {
        id: "contrainte_active",
        prompt:
          "Votre salle permet 9 000 couverts par trimestre. À 0,5 h de brigade par couvert et 10 salariés à 455 h, quelle est la capacité de travail ?",
        options: [
          { id: "a", label: "9 100 couverts : les deux contraintes se valent presque" },
          { id: "b", label: "4 550 couverts : la brigade est très limitante" },
          { id: "c", label: "18 200 couverts : la brigade n'est jamais limitante" },
          { id: "d", label: "2 275 couverts" },
        ],
        correctOptionId: "a",
        explain:
          "10 × 455 ÷ 0,5 = 9 100 couverts. Les deux plafonds sont quasiment identiques : ajouter des chaises sans renforcer la brigade ne servirait à rien, et l'inverse non plus.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      scenarios_method: "acceptable",
      relevant_costs: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["capacity", "seasonality", "variable_costs", "bfr"],
    hints: hints([
      "Regardez la saisonnalité du segment banquets : quel coefficient s'applique au quatrième trimestre ?",
      "Les banquets grimpent à 1,85 fois leur niveau ordinaire, sur un trimestre déjà à 1,25 en global.",
      "Vos deux plafonds sont proches : 9 000 couverts en salle, 9 100 en heures de brigade. L'un ne sert à rien sans l'autre.",
      "Préparer plus que ce que vous servirez coûte les denrées perdues, sans aucune contrepartie : rien ne se stocke.",
      "Estimez la demande du tour, comparez-la aux deux plafonds, et n'oubliez pas que les banquets règlent à 30 jours : le résultat arrive avant l'encaissement.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
    decisionLevers: [
      {
        field: "productionPlan",
        direction: "up",
        hint: "La demande de décembre bondit : ajustez la préparation à la hausse, mais restez sous les plafonds salle et brigade pour éviter le gâchis de denrées perdues.",
      },
      {
        field: "maintenanceBudget",
        direction: "review",
        hint: "Un pic de service sollicite fortement la cuisine. Anticipez l'entretien pour éviter une panne en plein rush de décembre.",
      },
    ],
  },
  {
    code: "bistrot_detect_below_breakeven",
    category: "alerte_comptable",
    title: "Le service ne couvre plus ses frais",
    narrative:
      "Le trimestre est déficitaire. La cuisine a bien tourné, les avis sont corrects, mais le compte d'exploitation ne suit pas.",
    problem:
      "Ratio matières, ticket moyen, fréquentation, charges de structure : par où commencer ?",
    diagnosticOptions: [
      {
        id: "quantify_gap",
        label: "Chiffrer d'abord l'écart en couverts, puis choisir le levier qui peut le combler",
        correct: true,
      },
      {
        id: "ratio_first",
        label: "Vérifier le ratio matières : c'est le levier qui agit le plus vite dans le métier",
        correct: true,
      },
      {
        id: "fire_staff",
        label: "Licencier une partie de la brigade sans autre analyse",
        correct: false,
      },
      {
        id: "raise_price_blind",
        label: "Augmenter le ticket moyen de 20 % sans regarder les segments",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "levier_ratio",
        prompt:
          "Gagner deux points de ratio matières (de 32 % à 30 % sur un ticket de 33 €) rapporte, par couvert :",
        options: [
          { id: "a", label: "Environ 0,66 € de marge supplémentaire" },
          { id: "b", label: "Environ 2 € de marge supplémentaire" },
          { id: "c", label: "Environ 6,60 € de marge supplémentaire" },
          { id: "d", label: "Rien : le ratio est un indicateur, pas un levier" },
        ],
        correctOptionId: "a",
        explain:
          "2 % de 33 € = 0,66 €. Sur 6 000 couverts, cela fait près de 4 000 € par trimestre, sans toucher au prix ni à la fréquentation. C'est pourquoi le ratio matières se surveille chaque semaine.",
      },
      {
        id: "charges_rigides",
        prompt:
          "Pourquoi la brigade est-elle un levier difficile à actionner à court terme ?",
        options: [
          { id: "a", label: "Le licenciement coûte immédiatement et l'effectif ne baisse qu'au tour suivant" },
          { id: "b", label: "Les salaires sont des charges variables" },
          { id: "c", label: "La brigade ne représente pas une part importante des charges" },
          { id: "d", label: "L'effectif n'a aucun effet sur la capacité de service" },
        ],
        correctOptionId: "a",
        explain:
          "L'asymétrie est brutale : on paie l'indemnité tout de suite, on récupère la marge plus tard, et on perd de la capacité de service au passage, donc du chiffre d'affaires.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      sensitivity_analysis: "acceptable",
      variance_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["breakeven", "contribution_margin", "fixed_costs", "safety_margin"],
    hints: hints([
      "Reprenez le compte de résultat : de combien manquez-vous pour atteindre l'équilibre ?",
      "Divisez cet écart par votre marge par couvert : vous obtenez le nombre de couverts manquants.",
      "Trois leviers, comme partout : la marge unitaire, les volumes, les charges de structure. Mais leurs délais d'action diffèrent radicalement.",
      "Dans ce métier, le ratio matières est le levier le plus rapide : il ne demande ni nouveau client ni hausse de prix visible.",
      "Seuil = 90 000 ÷ marge par couvert. Comparez à vos couverts réels : si l'écart dépasse 1 000 couverts, aucun levier unique ne suffira : il faudra les combiner.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
    decisionLevers: [
      {
        field: "price",
        direction: "review",
        hint: "Le ticket moyen est un levier rapide, mais l'élasticité diffère selon les services. Vérifiez où une hausse modérée serait absorbée sans perdre de couverts.",
      },
      {
        field: "qualityBudget",
        direction: "review",
        hint: "Deux points de ratio matières gagnés par un travail sur la carte rapportent environ 4 000 € par trimestre, sans toucher au prix ni à la fréquentation.",
      },
      {
        field: "marketingBudget",
        direction: "up",
        hint: "Si l'écart au seuil se mesure en couverts manquants, un effort promotionnel ciblé peut ramener les clients plus vite qu'une hausse de prix.",
      },
    ],
  },
  {
    code: "bistrot_t5_terrasse",
    category: "decision_strategique",
    title: "La terrasse sous verrière",
    narrative:
      "Le bailleur propose de couvrir et de chauffer la terrasse : 48 000 €, amortis sur douze trimestres. Elle ajouterait environ 1 800 couverts par trimestre, mais du printemps à l'automne seulement : en plein hiver, personne ne s'y installe. Chaque couvert laisse une vingtaine d'euros de marge.",
    problem:
      "Cet investissement rapporte-t-il plus qu'il ne coûte, et sur quoi le jugez-vous ?",
    diagnosticOptions: [
      {
        id: "actualiser",
        label: "Il faut comparer le décaissement d'aujourd'hui aux marges futures, ramenées à leur valeur d'aujourd'hui",
        correct: true,
      },
      {
        id: "saison",
        label: "Les couverts supplémentaires ne tombent pas toute l'année : le calcul doit suivre la saison",
        correct: true,
      },
      {
        id: "seuil_suffit",
        label: "Si le seuil de rentabilité est franchi cette année, l'investissement est bon",
        correct: false,
      },
      {
        id: "amortissement_flux",
        label: "Ce sont les 4 000 € d'amortissement par trimestre qu'il faut comparer aux marges",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "bistrot_actualisation",
        prompt: "Actualiser un flux futur revient à…",
        options: [
          { id: "a", label: "Reconnaître qu'un euro encaissé dans trois ans vaut moins qu'un euro aujourd'hui" },
          { id: "b", label: "Le corriger de l'inflation constatée sur la période" },
          { id: "c", label: "En retirer l'impôt sur les sociétés" },
          { id: "d", label: "Le convertir en marge sur coût variable" },
        ],
        correctOptionId: "a",
        explain:
          "Un euro disponible tout de suite peut être placé, ou éviter un emprunt. Attendre a donc un prix, et ce prix est le taux d'actualisation.",
      },
      {
        id: "bistrot_amortissement_van",
        prompt: "Dans le calcul de la valeur actuelle nette d'un investissement, l'amortissement comptable…",
        options: [
          { id: "a", label: "N'entre pas dans les flux : c'est une charge calculée, jamais décaissée" },
          { id: "b", label: "S'ajoute au décaissement initial" },
          { id: "c", label: "Remplace la marge dans les flux futurs" },
          { id: "d", label: "Double le coût réel de l'investissement" },
        ],
        correctOptionId: "a",
        explain:
          "Les 48 000 € sortent une fois, à la signature. L'amortissement ne fait que les étaler dans le compte de résultat : le compter en plus reviendrait à payer la verrière deux fois.",
      },
    ],
    modelRelevance: {
      npv: "optimal",
      breakeven_analysis: "misleading",
      capacity_analysis: "acceptable",
      irr: "acceptable",
    },
    conceptCodes: ["discounting", "irr_payback", "capacity", "seasonality"],
    hints: hints([
      "Combien de couverts la verrière ajoute-t-elle réellement sur une année entière, saison creuse comprise ?",
      "Multipliez ces couverts par la marge unitaire : voilà le flux annuel que l'investissement rapporte.",
      "Comparez ce flux au décaissement de 48 000 €, mais pas euro pour euro : les marges arrivent plus tard, et ce délai a un prix.",
      "Actualisez chaque trimestre à votre taux d'emprunt, puis retranchez les 48 000 €. Si le total reste positif, l'investissement crée de la valeur.",
      "VAN = Σ (flux du trimestre ÷ (1 + taux)^n) − investissement initial. L'amortissement n'entre nulle part : il ne se décaisse pas.",
    ]),
    trigger: { round: 5 },
    weight: 1,
    decisionLevers: [
      {
        field: "productionPlan",
        direction: "up",
        hint: "La verrière ajoute environ 1 800 couverts par trimestre en saison : préparez-vous à servir davantage si l'investissement est retenu.",
      },
      {
        field: "maintenanceBudget",
        direction: "up",
        hint: "Une terrasse couverte et chauffée s'entretient : intégrez le surcoût de maintenance dans votre calcul de VAN.",
      },
    ],
  },
  {
    code: "bistrot_t6_valeur",
    category: "decision_strategique",
    title: "Ce que vaut vraiment le bistrot",
    narrative:
      "Votre associé veut sortir du capital et demande ce que vaut sa part. Le bistrot a dégagé un résultat correct sur l'année, mais il a fallu 260 000 € de capitaux propres pour le faire tourner. Le restaurant d'en face gagne un peu moins que vous, avec deux fois moins de capitaux engagés.",
    problem:
      "Lequel des deux établissements est le mieux géré, et sur quel critère tranchez-vous ?",
    diagnosticOptions: [
      {
        id: "rapporter",
        label: "Un résultat ne se juge qu'en le rapportant aux capitaux qu'il a fallu engager",
        correct: true,
      },
      {
        id: "voisin_meilleur",
        label: "Le voisin obtient presque autant avec moitié moins : sa rentabilité est supérieure",
        correct: true,
      },
      {
        id: "plus_gros_gagne",
        label: "Le plus gros résultat désigne toujours la meilleure gestion",
        correct: false,
      },
      {
        id: "ca_decide",
        label: "C'est le chiffre d'affaires qui départage deux établissements",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "bistrot_profit_vs_rentab",
        prompt: "Profitabilité et rentabilité se distinguent en ce que…",
        options: [
          { id: "a", label: "La profitabilité rapporte le résultat au chiffre d'affaires, la rentabilité aux capitaux engagés" },
          { id: "b", label: "La profitabilité concerne le court terme, la rentabilité le long terme" },
          { id: "c", label: "La profitabilité s'exprime en euros, la rentabilité en volume" },
          { id: "d", label: "Ce sont deux mots pour la même chose" },
        ],
        correctOptionId: "a",
        explain:
          "Deux dénominateurs, deux questions. « Combien me reste-t-il sur 100 € vendus ? » n'est pas « combien rapportent les 260 000 € que j'ai immobilisés ? ».",
      },
      {
        id: "bistrot_marge_securite",
        prompt: "La marge de sécurité d'un établissement mesure…",
        options: [
          { id: "a", label: "De combien le chiffre d'affaires peut baisser avant de repasser sous le seuil de rentabilité" },
          { id: "b", label: "La trésorerie disponible en cas de coup dur" },
          { id: "c", label: "L'écart entre le prix de vente et le coût variable" },
          { id: "d", label: "Le montant du découvert encore autorisé" },
        ],
        correctOptionId: "a",
        explain:
          "C'est le matelas entre l'activité réelle et le point d'équilibre. Deux affaires au même résultat n'ont pas la même solidité si l'une travaille juste au-dessus du seuil.",
      },
    ],
    modelRelevance: {
      return_analysis: "optimal",
      breakeven_analysis: "misleading",
      sensitivity_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["profitability_vs_return", "margin_rates", "safety_margin", "fixed_costs"],
    hints: hints([
      "Regardez d'abord vos capitaux propres au bilan : c'est l'argent immobilisé dans l'affaire.",
      "Rapportez votre résultat net à ces capitaux propres, puis faites de même pour le voisin.",
      "Un résultat plus élevé obtenu avec deux fois plus de capitaux n'est pas une meilleure performance : c'est un plus gros pari.",
      "Ajoutez la marge de sécurité : à résultat égal, l'établissement le plus loin de son seuil encaissera mieux un mauvais trimestre.",
      "Rentabilité financière = résultat net ÷ capitaux propres. C'est le seul chiffre qui réponde à la question de votre associé.",
    ]),
    trigger: { round: 6 },
    weight: 1,
    decisionLevers: [
      {
        field: "price",
        direction: "review",
        hint: "Le ticket moyen nourrit le résultat, mais c'est le rapport résultat / capitaux engagés qui mesure la vraie performance. Vérifiez que vos prix maximisent la rentabilité, pas seulement le chiffre.",
      },
      {
        field: "qualityBudget",
        direction: "review",
        hint: "Un investissement qualité n'a de sens que s'il améliore le résultat plus vite qu'il ne gonfle les capitaux engagés.",
      },
    ],
  },
  {
    code: "bistrot_detect_idle_cash",
    category: "tresorerie_dormante",
    title: "La caisse fait le plein",
    narrative:
      "Les clients paient au comptant et la caisse le montre : vous détenez plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture votre découvert 9 %. Vos fournisseurs, eux, seront réglés à vingt et un jours comme d'habitude.",
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
        id: "bistrot_detect_idle_cash_placement_exces",
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
        id: "bistrot_comptant_illusion",
        prompt: "Encaisser au comptant tout en payant ses fournisseurs à vingt et un jours produit…",
        options: [
          { id: "a", label: "Un besoin en fonds de roulement négatif : la caisse est structurellement en avance sur les paiements" },
          { id: "b", label: "Un résultat d'exploitation plus élevé qu'à crédit" },
          { id: "c", label: "Une exonération de TVA sur les encaissements" },
          { id: "d", label: "Une baisse du seuil de rentabilité" },
        ],
        correctOptionId: "a",
        explain:
          "La restauration encaisse avant de payer : c'est une position enviable, mais l'avance appartient aux fournisseurs. Une caisse pleine n'est pas un bénéfice, c'est un décalage.",
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
      "Comparez votre solde aux charges de structure d'un trimestre : de combien de trimestres d'avance disposez-vous ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera rien de ce qui tombera d'ici là.",
      "Projetez les décaissements du trimestre : denrées, salaires de la brigade, loyer. Une partie de ce que vous voyez en caisse appartient déjà à vos fournisseurs.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
    decisionLevers: [
      {
        field: "maintenanceBudget",
        direction: "review",
        hint: "Une partie de la trésorerie excédentaire pourrait financer un entretien préventif, évitant un décaissement imprévu plus coûteux.",
      },
      {
        field: "marketingBudget",
        direction: "review",
        hint: "Avant de bloquer l'excédent en placement, vérifiez si un effort commercial ne rapporterait pas davantage que les 2 % du banquier.",
      },
      {
        field: "productionPlan",
        direction: "review",
        hint: "Projetez les couverts du prochain trimestre : la trésorerie nécessaire pour les denrées fixe le montant que vous pouvez réellement immobiliser.",
      },
    ],
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  bistrot_detect_idle_cash:
    "Le budget de trésorerie sépare ce que la caisse détient de ce qu'elle doit déjà. Dans un métier encaissé au comptant, c'est le seul document qui empêche de confondre avance et excédent.",
  bistrot_t5_terrasse:
    "La VAN met face à face un décaissement d'aujourd'hui et des marges de demain, en tenant compte du temps qui les sépare. Le seuil de rentabilité, lui, raisonne sur un tour et ignore les onze suivants.",
  bistrot_t6_valeur:
    "L'analyse de rentabilité rapporte le résultat aux capitaux engagés. C'est ce rapport, et non le résultat seul, qui répond à la question de votre associé.",
  bistrot_t1_reprise:
    "Le seuil de rentabilité traduit le ratio matières en une question opérationnelle : combien de couverts par jour faut-il servir pour ne plus perdre d'argent ?",
  bistrot_t2_fournisseur:
    "Trois circuits, des critères qui ne se mesurent pas dans la même unité (prix, qualité perçue, délai, temps de brigade) : c'est le cas d'école de la matrice multicritère.",
  bistrot_t3_matieres:
    "L'élasticité-prix dit ce que coûte en fréquentation chaque euro répercuté, service par service : c'est le seul outil qui arbitre entre ticket moyen et volume.",
  bistrot_t4_banquets:
    "L'analyse de capacité met en évidence la double contrainte du métier, places assises et heures de brigade, puis dimensionne la préparation sans gâchis.",
  bistrot_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart en couverts et hiérarchise les leviers selon leur délai d'action.",
};

attachModelQuestions(BISTROT_SITUATIONS, MODEL_EXPLAIN);
