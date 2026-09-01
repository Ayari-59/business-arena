import { attachModelQuestions, hints, type DecisionLever, type SituationCategory, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de PIXEL & CO (e-commerce).
 *
 * Le fil rouge du secteur : le trafic s'achète. La question du métier n'est
 * jamais « quelle est ma marge ? » mais « ma marge par commande couvre-t-elle
 * ce que m'a coûté ce client ? ».
 */
export const ECOMMERCE_SITUATIONS: SituationDef[] = [
  {
    code: "ecom_t1_acquisition",
    category: "prise_de_poste",
    title: "Le premier euro de publicité",
    narrative:
      "Vous reprenez PIXEL & CO : un entrepôt loué, 2 000 références en stock, un site qui fonctionne et zéro notoriété. Sans budget de publicité, le compteur de visiteurs reste à trois chiffres par jour.",
    problem:
      "Un client acquis par la publicité vous coûte de l'argent avant d'en rapporter. À partir de quand la dépense est-elle justifiée ?",
    diagnosticOptions: [
      {
        id: "margin_vs_cac",
        label: "Quand la marge dégagée par la commande dépasse ce que la publicité a coûté pour l'obtenir",
        correct: true,
      },
      {
        id: "traffic_is_bought",
        label: "Le budget d'acquisition n'est pas un confort : sans lui, il n'y a pas de commandes du tout",
        correct: true,
      },
      {
        id: "revenue_only",
        label: "Dès que le chiffre d'affaires augmente, la publicité est rentable",
        correct: false,
      },
      {
        id: "never_pay",
        label: "Il ne faut jamais payer pour du trafic : le référencement naturel suffit",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "cac_calcul",
        prompt:
          "Vous dépensez 30 000 € de publicité et obtenez 2 000 commandes de nouveaux clients. Quel est le coût d'acquisition ?",
        options: [
          { id: "a", label: "15 € par client" },
          { id: "b", label: "30 € par client" },
          { id: "c", label: "60 000 €" },
          { id: "d", label: "0,067 € par client" },
        ],
        correctOptionId: "a",
        explain:
          "30 000 ÷ 2 000 = 15 €. Ce chiffre ne veut rien dire seul : il ne prend son sens que comparé à la marge que rapporte une commande.",
      },
      {
        id: "marge_nette_acquisition",
        prompt:
          "Une commande à 68 € coûte 38 € en marchandise et logistique, et 15 € d'acquisition. Que reste-t-il pour les charges de structure ?",
        options: [
          { id: "a", label: "15 €" },
          { id: "b", label: "30 €" },
          { id: "c", label: "53 €" },
          { id: "d", label: "68 €" },
        ],
        correctOptionId: "a",
        explain:
          "68 − 38 − 15 = 15 €. La moitié de la marge part en publicité : c'est la réalité du métier, et c'est pourquoi le panier moyen y compte autant.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      marginal_analysis: "acceptable",
      relevant_costs: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["average_basket", "contribution_margin", "variable_costs", "fixed_costs", "breakeven"],
    hints: hints([
      "Décomposez ce que devient un billet de 68 € encaissé : où va-t-il, poste par poste ?",
      "Trois postes le mangent : la marchandise, la logistique, et la publicité qui a amené le client.",
      "Les deux premiers figurent dans le coût variable classique. Le troisième est propre au commerce en ligne.",
      "Marge par commande = 68 − 27 − 11 = 30 €. Coût d'acquisition = budget publicité ÷ nouvelles commandes.",
      "Tant que le coût d'acquisition reste sous 30 €, chaque nouveau client contribue. Au-delà, vendre davantage appauvrit l'entreprise.",
    ]),
    trigger: { round: 1 },
    weight: 1,
    decisionLevers: [
      { field: "marketingBudget", direction: "review", hint: "Chaque euro de publicité doit rapporter plus qu'il ne coûte. Calibrez le budget d'acquisition pour que le coût par client reste sous la marge par commande." },
      { field: "price", direction: "review", hint: "Le panier moyen détermine la marge qui doit absorber le coût d'acquisition. Un prix trop bas ne laisse rien après la publicité." },
    ],
  },
  {
    code: "ecom_t2_fidelisation",
    category: "decision_strategique",
    title: "Deux clients, deux coûts",
    narrative:
      "Votre tableau de bord distingue deux populations : ceux qui arrivent par la publicité, et ceux qui reviennent d'eux-mêmes. Les seconds achètent plus cher, plus souvent, et ne coûtent rien à faire venir.",
    problem:
      "Faut-il investir pour acquérir de nouveaux clients, ou pour faire revenir les anciens ?",
    diagnosticOptions: [
      {
        id: "retention_cheaper",
        label: "Un client qui revient ne coûte aucun euro d'acquisition : sa marge est intégralement conservée",
        correct: true,
      },
      {
        id: "quality_drives_return",
        label: "Ce qui fait revenir (délai, qualité, service) se décide au tour précédent, pas au tour même",
        correct: true,
      },
      {
        id: "acquisition_only",
        label: "Seule l'acquisition fait croître : la fidélisation est une dépense de confort",
        correct: false,
      },
      {
        id: "same_value",
        label: "Un client acquis et un client fidèle rapportent exactement la même chose",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "segment_marge",
        prompt:
          "Le segment fidèle achète à 78 € contre 62 € pour le trafic payant, sans coût d'acquisition. Quel écart de marge par commande ?",
        options: [
          { id: "a", label: "16 € de panier en plus, plus la totalité du coût d'acquisition économisé" },
          { id: "b", label: "16 € seulement" },
          { id: "c", label: "Aucun écart : le coût variable est identique" },
          { id: "d", label: "L'écart dépend uniquement du prix affiché" },
        ],
        correctOptionId: "a",
        explain:
          "Le panier est plus élevé ET la publicité n'a rien coûté. C'est un double effet, et c'est pourquoi la base installée est l'actif le plus précieux d'un pure player.",
      },
      {
        id: "qualite_differee",
        prompt:
          "Le budget qualité (photos, service client, délais) agit sur les ventes :",
        options: [
          { id: "a", label: "Avec retard : il fait revenir au tour suivant ceux qui ont commandé ce tour-ci" },
          { id: "b", label: "Immédiatement, dès le tour où il est engagé" },
          { id: "c", label: "Jamais : la qualité n'influence pas un achat en ligne" },
          { id: "d", label: "Uniquement sur le segment marketplace" },
        ],
        correctOptionId: "a",
        explain:
          "C'est une charge immédiate pour un chiffre d'affaires différé. Couper la qualité embellit le trimestre en cours et vide la base fidèle des suivants.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      multicriteria_matrix: "acceptable",
      marginal_analysis: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["average_basket", "segmentation", "contribution_margin", "demand_market_share", "margin_rates"],
    hints: hints([
      "Comparez les deux segments ligne à ligne : panier moyen, coût variable, coût d'acquisition.",
      "Le trafic payant se repaie à chaque commande. Le client fidèle, lui, ne se paie qu'une fois.",
      "La question n'est pas « lequel rapporte le plus » mais « ce que change chaque euro selon l'endroit où je le mets ».",
      "Comparer deux affectations d'un même euro sur ce qu'elles modifient réellement, c'est l'analyse des coûts pertinents.",
      "Chiffrez : 78 − 38 = 40 € de marge chez un fidèle, contre 62 − 38 − 15 = 9 € chez un client acquis. Le rapport est de un à quatre.",
    ]),
    trigger: { round: 2 },
    weight: 1.5,
    decisionLevers: [
      { field: "qualityBudget", direction: "up", hint: "La qualité (photos, service, délais) fait revenir les clients sans coût d'acquisition. Investir ici maintenant, c'est de la marge gratuite au tour suivant." },
      { field: "marketingBudget", direction: "review", hint: "Un client fidèle rapporte quatre fois plus qu'un client acquis. Réévaluez la part du budget consacrée à l'acquisition face à celle qui nourrit la fidélisation." },
    ],
  },
  {
    code: "ecom_t4_pic",
    category: "contexte_marche",
    title: "Black Friday et fêtes",
    narrative:
      "Le quatrième trimestre pèse plus d'une fois et demie un trimestre ordinaire. Vos concurrents ont réservé leurs espaces publicitaires depuis septembre, et votre entrepôt prépare 7 000 commandes par trimestre, pas une de plus.",
    problem:
      "Comment préparer un pic qui exige à la fois du stock, de la capacité d'expédition et du budget d'acquisition ?",
    diagnosticOptions: [
      {
        id: "three_constraints",
        label: "Trois contraintes simultanées : la marchandise, la capacité de préparation et le budget publicitaire",
        correct: true,
      },
      {
        id: "cash_before",
        label: "Tout se décaisse AVANT d'encaisser : stock acheté, publicité payée, commandes livrées ensuite",
        correct: true,
      },
      {
        id: "ads_enough",
        label: "Il suffit d'augmenter le budget publicitaire : la demande fera le reste",
        correct: false,
      },
      {
        id: "stock_enough",
        label: "Il suffit d'avoir du stock : à Noël, tout se vend",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "goulot",
        prompt:
          "Vous achetez pour 9 000 commandes de stock mais l'entrepôt n'en prépare que 7 000. Combien vendrez-vous au mieux ?",
        options: [
          { id: "a", label: "7 000 : la contrainte la plus serrée décide" },
          { id: "b", label: "9 000 : le stock est disponible" },
          { id: "c", label: "16 000 : les deux s'additionnent" },
          { id: "d", label: "8 000, la moyenne des deux" },
        ],
        correctOptionId: "a",
        explain:
          "Une chaîne vaut son maillon le plus faible. Les 2 000 commandes de stock excédentaire ne seront pas expédiées, mais elles auront été payées.",
      },
      {
        id: "decaissement",
        prompt:
          "Vous décaissez le stock et la publicité au tour du pic, mais une part des ventes passe par la marketplace payée à 30 jours. Quel effet ?",
        options: [
          { id: "a", label: "Le besoin en fonds de roulement gonfle au moment où la trésorerie est la plus sollicitée" },
          { id: "b", label: "Aucun effet : le chiffre d'affaires compense" },
          { id: "c", label: "Le résultat net baisse mécaniquement" },
          { id: "d", label: "La trésorerie s'améliore grâce au volume" },
        ],
        correctOptionId: "a",
        explain:
          "Le pic est un piège de trésorerie classique : on paie tout d'avance, on encaisse une partie plus tard. Beaucoup d'e-commerçants rentables meurent en décembre.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      cash_budget: "acceptable",
      scenarios_method: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["seasonality", "capacity", "stock", "bfr"],
    hints: hints([
      "Regardez la saisonnalité : quel coefficient s'applique au quatrième trimestre ?",
      "Le pic vaut 1,6 fois un trimestre ordinaire. Comparez cette demande à ce que votre entrepôt sait traiter.",
      "Trois plafonds à vérifier ensemble : le stock disponible, la capacité de préparation, et le budget d'acquisition qui déclenche les commandes.",
      "La contrainte la plus serrée décide de tout : acheter du stock au-delà de la capacité d'expédition, c'est immobiliser de la trésorerie pour rien.",
      "Et n'oubliez pas le calendrier des flux : le stock et la publicité se paient ce tour-ci, une partie des ventes s'encaisse au suivant.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
    decisionLevers: [
      { field: "productionPlan", direction: "up", hint: "Le pic exige du stock supplémentaire, mais uniquement à hauteur de ce que l'entrepôt peut expédier. Inutile d'acheter au-delà de la capacité de préparation." },
      { field: "marketingBudget", direction: "up", hint: "Les enchères publicitaires montent en période de fêtes. Réservez un budget d'acquisition suffisant pour capter la demande saisonnière." },
      { field: "maintenanceBudget", direction: "review", hint: "La capacité de l'entrepôt est le goulot d'étranglement. Vérifiez si un investissement logistique permet de desserrer cette contrainte avant le pic." },
    ],
  },
  {
    code: "ecom_t5_commission",
    category: "contexte_marche",
    title: "Ce que la place de marché prélève",
    narrative:
      "La place de marché qui vous apporte un quart de vos commandes annonce que sa commission montera l'an prochain. Son responsable vous propose d'en reparler si vous vous engagez sur un volume.",
    problem:
      "Ce canal vaut-il encore ce qu'il coûte, et qu'avez-vous à mettre dans la balance ?",
    diagnosticOptions: [
      {
        id: "charge_not_discount",
        label: "La commission est une charge prélevée sur chaque vente : elle réduit la marge sans que le prix affiché bouge",
        correct: true,
      },
      {
        id: "dependency_is_risk",
        label: "Un canal qui pèse un quart des commandes et dont vous ne fixez pas les règles est un risque autant qu'un débouché",
        correct: true,
      },
      {
        id: "raise_price",
        label: "Une commission plus haute se compense en montant le prix du même pourcentage",
        correct: false,
      },
      {
        id: "volume_wins",
        label: "Tant que le canal apporte du volume, le taux de sa commission importe peu",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "marge_apres_commission",
        prompt:
          "Une commande passée par la place de marché : 68 € payés par le client, 38 € de marchandise et de logistique, 12 % de commission. Que vous reste-t-il ?",
        options: [
          { id: "a", label: "21,84 €" },
          { id: "b", label: "26,40 €" },
          { id: "c", label: "30 €" },
          { id: "d", label: "8,16 €" },
        ],
        correctOptionId: "a",
        explain:
          "Il reste 21,84 €, soit 68 − 38 − 8,16. La commission se calcule sur le prix et non sur la marge : elle en emporte plus du quart, sans jamais apparaître sur le prix affiché.",
      },
      {
        id: "part_de_marge",
        prompt:
          "Le trimestre se solde par 1 500 commandes en direct et 500 par la place de marché. Quelle part de votre marge vient du canal partenaire ?",
        options: [
          { id: "a", label: "Environ 19,5 %, alors qu'il fait le quart des commandes" },
          { id: "b", label: "25 %, comme sa part des commandes" },
          { id: "c", label: "12 %, le taux de la commission" },
          { id: "d", label: "Un tiers, le canal étant le plus dynamique" },
        ],
        correctOptionId: "a",
        explain:
          "10 920 ÷ 55 920 ≈ 19,5 %. Le canal apporte une commande sur quatre et moins d'une marge sur cinq : le compter en commandes surestime ce qu'il rapporte, et fait négocier sur le mauvais chiffre.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      elasticity_analysis: "acceptable",
      marginal_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["contribution_margin", "variable_costs", "margin_rates", "revenue", "segmentation"],
    hints: hints([
      "Reprenez une commande passée par ce canal et suivez le billet de 68 € : qui prend quoi, et dans quel ordre ?",
      "Trois prélèvements, pas deux : la marchandise, la logistique, et le tiers qui a apporté le client.",
      "La commission porte sur le PRIX et non sur la marge. À 12 %, elle prend 8,16 € sur une commande de 68 €.",
      "Comparez alors les deux marges, 30 € en direct contre 21,84 € par le canal, et pesez chacune par son volume plutôt que par son nombre de commandes.",
      "Monter le prix pour absorber la commission coûte du volume, et pas le même partout : la clientèle qui compare part la première, celle qui revient reste. Ce que vous apportez au partenaire est un meilleur argument que ce que vous lui demandez.",
    ]),
    trigger: { round: 5 },
    weight: 1.5,
    decisionLevers: [
      { field: "price", direction: "review", hint: "La commission se calcule sur le prix, pas sur la marge. Ajuster le prix du canal partenaire peut compenser la hausse, mais au risque de perdre du volume." },
      { field: "marketingBudget", direction: "review", hint: "Si la marge par commande marketplace diminue, chaque euro de publicité rapporte davantage en direct. Rééquilibrez l'effort d'acquisition entre les deux canaux." },
    ],
  },
  {
    code: "ecom_detect_below_breakeven",
    category: "alerte_comptable",
    title: "Le trimestre est déficitaire",
    narrative:
      "Le chiffre d'affaires a progressé, les commandes aussi, et le résultat d'exploitation est négatif. Le tableau de bord publicitaire, lui, affiche de bons chiffres.",
    problem:
      "Vendre plus et perdre de l'argent : comment est-ce possible, et par quel levier redresser ?",
    diagnosticOptions: [
      {
        id: "cac_too_high",
        label: "Le coût d'acquisition dépasse peut-être la marge que rapporte une commande",
        correct: true,
      },
      {
        id: "quantify",
        label: "Il faut chiffrer la marge NETTE d'acquisition avant de décider quoi que ce soit",
        correct: true,
      },
      {
        id: "spend_more",
        label: "Augmenter encore le budget publicitaire pour atteindre la taille critique",
        correct: false,
      },
      {
        id: "cut_all",
        label: "Couper toute la publicité : c'est elle qui coûte",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "croissance_destructrice",
        prompt:
          "Une commande rapporte 30 € de marge et coûte 34 € d'acquisition. Que produit une hausse des volumes ?",
        options: [
          { id: "a", label: "Elle aggrave la perte : chaque commande supplémentaire détruit 4 €" },
          { id: "b", label: "Elle réduit la perte grâce aux économies d'échelle" },
          { id: "c", label: "Elle est neutre sur le résultat" },
          { id: "d", label: "Elle améliore le résultat dès que le seuil est franchi" },
        ],
        correctOptionId: "a",
        explain:
          "C'est le piège du commerce en ligne : croître quand la marge nette d'acquisition est négative accélère la faillite. Le volume n'est pas la solution, c'est l'accélérateur.",
      },
      {
        id: "leviers",
        prompt: "Quel levier N'améliore PAS la marge nette d'acquisition ?",
        options: [
          { id: "a", label: "Augmenter le nombre de commandes à coût d'acquisition inchangé" },
          { id: "b", label: "Relever le panier moyen" },
          { id: "c", label: "Faire revenir les clients existants" },
          { id: "d", label: "Négocier de meilleurs tarifs logistiques" },
        ],
        correctOptionId: "a",
        explain:
          "La marge nette d'acquisition se calcule PAR commande : multiplier les commandes ne la change pas. Trois vrais leviers : le panier, la fidélisation, le coût variable.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      marginal_analysis: "acceptable",
      cvp_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["average_basket", "breakeven", "contribution_margin", "fixed_costs", "safety_margin"],
    hints: hints([
      "Regardez le compte de résultat : quel poste a le plus augmenté en même temps que le chiffre d'affaires ?",
      "Calculez ce que rapporte une commande APRÈS la publicité qui l'a déclenchée, pas avant.",
      "Marge nette d'acquisition = (CA − coût variable − budget publicitaire) ÷ commandes. Si elle est négative, croître aggrave tout.",
      "Le seuil de rentabilité classique ignore la publicité, qu'il traite comme une charge de structure. En e-commerce, c'est trompeur : elle varie avec le volume visé.",
      "Trois leviers agissent réellement : relever le panier moyen, faire revenir les clients (acquisition nulle), ou réduire le coût variable. Le volume seul n'en est pas un.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
    decisionLevers: [
      { field: "marketingBudget", direction: "down", hint: "Si le coût d'acquisition dépasse la marge par commande, chaque nouveau client aggrave la perte. Réduisez le budget jusqu'à retrouver une marge nette positive." },
      { field: "price", direction: "up", hint: "Relever le panier moyen augmente la marge disponible pour absorber le coût d'acquisition. C'est l'un des trois vrais leviers de redressement." },
      { field: "qualityBudget", direction: "review", hint: "Investir dans la qualité fait revenir les clients existants, dont le coût d'acquisition est nul. C'est un levier différé mais puissant pour sortir du déficit." },
    ],
  },
  {
    code: "ecom_detect_profitable_illiquid",
    category: "alerte_comptable",
    title: "Bénéficiaire, et pourtant à découvert",
    narrative:
      "Les comptes sont bons, l'entrepôt est plein, et votre banquier vous appelle. Le stock a été payé à 45 jours, mais la marketplace, elle, règle à 30.",
    problem:
      "Comment un e-commerçant rentable peut-il manquer de trésorerie ?",
    diagnosticOptions: [
      {
        id: "stock_and_receivables",
        label: "Le stock et les créances marketplace ont absorbé la trésorerie plus vite que le résultat n'en a produit",
        correct: true,
      },
      {
        id: "prepaid_growth",
        label: "Croître suppose d'acheter le stock AVANT de le vendre : la croissance consomme du cash",
        correct: true,
      },
      {
        id: "accounting_error",
        label: "C'est forcément une erreur comptable : un bénéfice, c'est de l'argent disponible",
        correct: false,
      },
      {
        id: "sell_more",
        label: "Il suffit de vendre davantage pour que la trésorerie revienne",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "bfr_ecommerce",
        prompt: "Le besoin en fonds de roulement d'un pure player se compose surtout :",
        options: [
          { id: "a", label: "Du stock en entrepôt et des créances marketplace, diminués des dettes fournisseurs" },
          { id: "b", label: "Du budget publicitaire engagé" },
          { id: "c", label: "Des immobilisations et des emprunts" },
          { id: "d", label: "Du résultat net cumulé" },
        ],
        correctOptionId: "a",
        explain:
          "BFR = stocks + créances − dettes fournisseurs. Le stock est l'actif principal d'un pure player : c'est aussi son principal besoin de financement.",
      },
      {
        id: "tn_formule",
        prompt: "La trésorerie nette se déduit par :",
        options: [
          { id: "a", label: "TN = FRNG − BFR" },
          { id: "b", label: "TN = résultat net − investissements" },
          { id: "c", label: "TN = chiffre d'affaires − charges décaissées" },
          { id: "d", label: "TN = FRNG + BFR" },
        ],
        correctOptionId: "a",
        explain:
          "La trésorerie n'est jamais une décision directe : c'est ce qui reste des ressources stables une fois financé le cycle d'exploitation.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      return_analysis: "irrelevant",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["bfr", "frng", "net_treasury", "stock"],
    hints: hints([
      "Comparez le résultat net du tour à la variation de votre trésorerie : l'écart est parlant.",
      "Regardez ce qui a bougé au bilan : le stock, les créances, les dettes fournisseurs.",
      "TN = FRNG − BFR. Si le résultat monte mais que le stock monte plus vite, la trésorerie baisse.",
      "Un pure player en croissance achète toujours plus de stock qu'il n'en vend : c'est structurel, pas accidentel.",
      "Leviers immédiats : réduire le stock dormant, mobiliser les créances marketplace (à un coût), ou négocier le délai fournisseur, le seul qui soit gratuit.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "down", hint: "Le stock immobilise la trésorerie bien avant de générer des ventes. Réduisez les achats pour libérer du cash et abaisser le BFR." },
      { field: "maintenanceBudget", direction: "review", hint: "La logistique et les délais fournisseurs pèsent sur le cycle de trésorerie. Négocier les échéances ou optimiser l'infrastructure peut desserrer la contrainte sans toucher au résultat." },
    ],
  },
  {
    code: "ecommerce_t3_retours",
    category: "contexte_marche",
    title: "Une commande sur huit revient",
    narrative:
      "Le service client remonte un chiffre que personne ne regardait : 12 % des commandes sont retournées. Chaque retour, ce sont des frais de port dans les deux sens, un article à contrôler et à remettre en rayon, parfois invendable. La marge affichée sur une commande, elle, n'en tient aucun compte.",
    problem:
      "Que devient votre marge quand une commande sur huit revient, et où faut-il agir ?",
    diagnosticOptions: [
      {
        id: "marge_reelle",
        label: "La marge qui compte est celle des commandes CONSERVÉES, une fois les retours payés",
        correct: true,
      },
      {
        id: "cout_variable",
        label: "Le coût d'un retour se comporte comme un coût variable : il grandit avec le volume vendu",
        correct: true,
      },
      {
        id: "retours_marginaux",
        label: "À 12 %, les retours restent négligeables sur le résultat",
        correct: false,
      },
      {
        id: "interdire",
        label: "Refuser les retours est la solution la plus rentable",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "ecom_marge_apres_retours",
        prompt: "Un taux de retour de 12 % agit sur le compte de résultat comme…",
        options: [
          { id: "a", label: "Une hausse du coût variable unitaire, qui abaisse la marge et relève le seuil de rentabilité" },
          { id: "b", label: "Une charge de structure supplémentaire, indépendante du volume" },
          { id: "c", label: "Une baisse du prix de vente affiché" },
          { id: "d", label: "Un simple décalage de trésorerie, sans effet sur le résultat" },
        ],
        correctOptionId: "a",
        explain:
          "Plus vous vendez, plus vous encaissez de retours. C'est bien la marge sur chaque commande qui se réduit, donc le nombre de commandes nécessaires à l'équilibre qui augmente.",
      },
      {
        id: "ecom_prevention",
        prompt: "Dépenser pour réduire les retours (photos, tailles, description) se juge en comparant…",
        options: [
          { id: "a", label: "Le coût de la prévention au coût des retours qu'elle évite" },
          { id: "b", label: "Le coût de la prévention au chiffre d'affaires total" },
          { id: "c", label: "Le taux de retour au taux de marge" },
          { id: "d", label: "Le nombre de retours au nombre de visiteurs" },
        ],
        correctOptionId: "a",
        explain:
          "C'est l'arbitrage classique de la qualité : prévenir coûte tout de suite et de façon certaine, subir coûte plus tard et de façon variable. Le bon niveau est un calcul.",
      },
    ],
    modelRelevance: {
      cvp_analysis: "optimal",
      elasticity_analysis: "misleading",
      breakeven_analysis: "acceptable",
      relevant_costs: "acceptable",
    },
    conceptCodes: ["variable_costs", "contribution_margin", "margin_rates", "breakeven"],
    hints: hints([
      "Sur 100 commandes expédiées, combien restent réellement vendues ?",
      "Chaque retour coûte deux ports et une manipulation : ajoutez cette somme au coût de chaque commande conservée.",
      "Recalculez votre marge unitaire avec ce coût en plus. De combien a-t-elle fondu ?",
      "Une marge plus faible relève le seuil : combien de commandes faut-il désormais pour couvrir la structure ?",
      "Comparez enfin le coût d'une prévention (meilleures photos, guide des tailles) au coût des retours qu'elle éviterait.",
    ]),
    trigger: { round: 3 },
    weight: 1,
    decisionLevers: [
      { field: "qualityBudget", direction: "up", hint: "De meilleures photos, un guide des tailles, des descriptions précises : la prévention coûte moins cher que les retours qu'elle évite." },
      { field: "price", direction: "review", hint: "Le coût des retours réduit la marge réelle par commande. Vérifiez que le prix couvre encore la structure une fois ce coût intégré." },
    ],
  },
  {
    code: "ecommerce_t6_scenarios",
    category: "decision_strategique",
    title: "Et si le trafic doublait de prix",
    narrative:
      "Les enchères publicitaires montent : vos concurrents payent de plus en plus cher le même clic. Votre coût d'acquisition a déjà progressé cette année. Pour le budget de l'an prochain, personne ne peut vous dire s'il augmentera de 10 % ou de 60 %.",
    problem:
      "Comment décider d'un budget quand le paramètre central est inconnu ?",
    diagnosticOptions: [
      {
        id: "plusieurs_hypotheses",
        label: "Il faut bâtir plusieurs hypothèses chiffrées plutôt que de parier sur une seule",
        correct: true,
      },
      {
        id: "point_bascule",
        label: "Ce qui compte est de trouver le niveau de coût d'acquisition à partir duquel l'activité devient déficitaire",
        correct: true,
      },
      {
        id: "moyenne",
        label: "Retenir la moyenne des prévisions donne la meilleure décision",
        correct: false,
      },
      {
        id: "attendre_de_voir",
        label: "Mieux vaut attendre de connaître le vrai chiffre avant de décider",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "ecom_methode_scenarios",
        prompt: "La méthode des scénarios consiste à…",
        options: [
          { id: "a", label: "Chiffrer une hypothèse basse, une moyenne et une haute, puis regarder si la décision change selon l'hypothèse" },
          { id: "b", label: "Choisir l'hypothèse la plus probable et s'y tenir" },
          { id: "c", label: "Faire la moyenne des résultats possibles" },
          { id: "d", label: "Reporter la décision jusqu'à disparition de l'incertitude" },
        ],
        correctOptionId: "a",
        explain:
          "Une décision qui reste bonne dans les trois scénarios est robuste. Une décision qui n'est bonne que dans le meilleur des cas est un pari, et il faut le savoir avant de le prendre.",
      },
      {
        id: "ecom_cac_limite",
        prompt: "Le coût d'acquisition maximal supportable pour une commande est atteint quand…",
        options: [
          { id: "a", label: "Il égale la marge que cette commande dégage une fois tous ses autres coûts payés" },
          { id: "b", label: "Il égale le prix de vente affiché" },
          { id: "c", label: "Il dépasse le budget publicitaire du trimestre" },
          { id: "d", label: "Il représente plus de 10 % du chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "Au-delà, chaque nouveau client coûte plus cher qu'il ne rapporte, et vendre davantage aggrave la perte. C'est un plafond, pas un objectif.",
      },
    ],
    modelRelevance: {
      scenarios_method: "optimal",
      breakeven_analysis: "misleading",
      sensitivity_analysis: "acceptable",
      cvp_analysis: "acceptable",
    },
    conceptCodes: ["demand_market_share", "contribution_margin", "safety_margin", "profitability_vs_return"],
    hints: hints([
      "Reprenez ce qu'une commande vous laisse une fois le produit, la logistique et les retours payés.",
      "Ce montant est le coût d'acquisition maximal que vous pouvez supporter. Où en êtes-vous aujourd'hui ?",
      "Chiffrez trois hypothèses de hausse : faible, moyenne, forte. Que devient le résultat dans chacune ?",
      "Repérez celle qui vous fait basculer sous le seuil : c'est elle qui doit gouverner le budget, pas la moyenne.",
      "Une décision robuste tient dans les trois scénarios. Si elle ne tient que dans le meilleur, c'est un pari, et il faut le nommer comme tel.",
    ]),
    trigger: { round: 6 },
    weight: 1,
    decisionLevers: [
      { field: "marketingBudget", direction: "review", hint: "Si le coût d'acquisition monte de 60 %, le budget actuel devient peut-être déficitaire. Testez plusieurs hypothèses avant de fixer le montant." },
      { field: "qualityBudget", direction: "up", hint: "Quand le trafic payant devient trop cher, la base fidèle est le meilleur amortisseur. Investir dans la qualité réduit la dépendance à la publicité." },
      { field: "price", direction: "review", hint: "Un coût d'acquisition en hausse grignote la marge. Vérifiez à quel prix le modèle reste rentable dans le scénario le plus défavorable." },
    ],
  },
  {
    code: "ecom_detect_idle_cash",
    category: "tresorerie_dormante",
    title: "L'après-fêtes",
    narrative:
      "Le pic des fêtes a rempli le compte : plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture le découvert 9 %. Le trimestre qui s'ouvre est le plus creux de l'année, et les retours de décembre ne sont pas tous remboursés.",
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
        id: "ecom_detect_idle_cash_placement_exces",
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
        id: "ecom_retours_a_venir",
        prompt: "Après un pic de ventes, une part du solde encaissé est déjà engagée parce que…",
        options: [
          { id: "a", label: "Les retours du pic seront remboursés au trimestre suivant, et les fournisseurs réglés à échéance" },
          { id: "b", label: "Les plateformes reprennent leur commission un an plus tard" },
          { id: "c", label: "La publicité du pic se paie avec un trimestre de décalage" },
          { id: "d", label: "L'impôt sur les sociétés est prélevé au moment de la vente" },
        ],
        correctOptionId: "a",
        explain:
          "Une commande encaissée n'est pas une commande acquise tant que le délai de rétractation court. Le solde de janvier porte encore les remboursements de décembre.",
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
      "Comparez votre solde aux charges de structure d'un trimestre : de combien de trimestres d'avance disposez-vous vraiment ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera rien de ce qui tombera d'ici là.",
      "Projetez le trimestre creux : publicité pour maintenir le trafic, règlement des fournisseurs du pic, et remboursement des retours de décembre.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
    decisionLevers: [
      { field: "productionPlan", direction: "down", hint: "Le trimestre creux ne justifie pas un stock élevé. Réduisez les achats pour ne pas immobiliser du cash qui pourrait être placé ou gardé en réserve." },
      { field: "maintenanceBudget", direction: "review", hint: "L'excédent de trésorerie peut financer un investissement logistique ou plateforme, à condition de conserver assez de liquidités pour le trimestre à venir." },
    ],
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  ecom_detect_idle_cash:
    "Le budget de trésorerie place chaque flux à sa date réelle, remboursements de retours compris. Seul lui distingue ce que la caisse détient de ce qu'elle doit encore rendre.",
  ecommerce_t3_retours:
    "L'analyse coût-volume-profit intègre le coût des retours au coût variable, recalcule la marge par commande et le nombre de commandes nécessaires à l'équilibre.",
  ecommerce_t6_scenarios:
    "La méthode des scénarios chiffre plusieurs hypothèses et cherche celle qui fait basculer la décision. Face à un paramètre inconnu, c'est plus honnête qu'une prévision unique.",
  ecom_t1_acquisition:
    "Le seuil de rentabilité pose la question du métier dans les bons termes : combien de commandes faut-il, une fois la publicité payée ?",
  ecom_t2_fidelisation:
    "L'analyse des coûts pertinents compare ce que chaque euro CHANGE selon l'endroit où on le met, acquérir ou fidéliser, au lieu de comparer des chiffres d'affaires.",
  ecom_t4_pic:
    "L'analyse de capacité met en évidence la contrainte la plus serrée : acheter du stock au-delà de ce que l'entrepôt sait expédier immobilise de la trésorerie pour rien.",
  ecom_t5_commission:
    "L'analyse des coûts pertinents ne retient que ce qui CHANGE avec le canal : la commission, et rien d'autre. Les charges de structure sont les mêmes que la commande vienne du site ou de la place de marché, et les compter des deux côtés brouille la comparaison.",
  ecom_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart, à condition de traiter la publicité pour ce qu'elle est ici : une charge qui varie avec le volume visé.",
  ecom_detect_profitable_illiquid:
    "L'analyse FRNG / BFR explique seule qu'une entreprise rentable manque de trésorerie : c'est le stock qui a bougé, pas le résultat.",
};

attachModelQuestions(ECOMMERCE_SITUATIONS, MODEL_EXPLAIN);
