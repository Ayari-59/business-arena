import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

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
    conceptCodes: ["contribution_margin", "variable_costs", "fixed_costs", "breakeven"],
    hints: hints([
      "Décomposez ce que devient un billet de 68 € encaissé : où va-t-il, poste par poste ?",
      "Trois postes le mangent : la marchandise, la logistique, et la publicité qui a amené le client.",
      "Les deux premiers figurent dans le coût variable classique. Le troisième est propre au commerce en ligne.",
      "Marge par commande = 68 − 27 − 11 = 30 €. Coût d'acquisition = budget publicité ÷ nouvelles commandes.",
      "Tant que le coût d'acquisition reste sous 30 €, chaque nouveau client contribue. Au-delà, vendre davantage appauvrit l'entreprise.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "ecom_t2_fidelisation",
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
        label: "Ce qui fait revenir — délai, qualité, service — se décide au tour précédent, pas au tour même",
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
    conceptCodes: ["segmentation", "contribution_margin", "demand_market_share", "margin_rates"],
    hints: hints([
      "Comparez les deux segments ligne à ligne : panier moyen, coût variable, coût d'acquisition.",
      "Le trafic payant se repaie à chaque commande. Le client fidèle, lui, ne se paie qu'une fois.",
      "La question n'est pas « lequel rapporte le plus » mais « ce que change chaque euro selon l'endroit où je le mets ».",
      "Comparer deux affectations d'un même euro sur ce qu'elles modifient réellement, c'est l'analyse des coûts pertinents.",
      "Chiffrez : 78 − 38 = 40 € de marge chez un fidèle, contre 62 − 38 − 15 = 9 € chez un client acquis. Le rapport est de un à quatre.",
    ]),
    trigger: { round: 2 },
    weight: 1.5,
  },
  {
    code: "ecom_t4_pic",
    title: "Black Friday et fêtes",
    narrative:
      "Le quatrième trimestre pèse plus d'une fois et demie un trimestre ordinaire. Vos concurrents ont réservé leurs espaces publicitaires depuis septembre, et votre entrepôt prépare 7 000 commandes par trimestre — pas une de plus.",
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
          "Une chaîne vaut son maillon le plus faible. Les 2 000 commandes de stock excédentaire ne seront pas expédiées — mais elles auront été payées.",
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
  },
  {
    code: "ecom_t5_frais_port",
    title: "Les frais de port explosent",
    narrative:
      "Le transporteur réévalue toute sa grille : +20 % sur chaque colis. Vos concurrents affichent « livraison offerte » en gros sur leur page d'accueil.",
    problem:
      "Répercutez-vous la hausse, ou offrez-vous les frais de port pour rester compétitif ?",
    diagnosticOptions: [
      {
        id: "not_free",
        label: "« Livraison offerte » n'est jamais gratuit : quelqu'un paie, et c'est votre marge",
        correct: true,
      },
      {
        id: "elasticity_decides",
        label: "L'arbitrage dépend de la sensibilité au prix de chaque segment",
        correct: true,
      },
      {
        id: "always_free",
        label: "Il faut toujours offrir les frais de port : c'est devenu la norme",
        correct: false,
      },
      {
        id: "always_pass",
        label: "Il faut toujours répercuter intégralement : le client comprendra",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "seuil_deplace",
        prompt:
          "Le coût variable passe de 38 € à 41 € par commande, prix inchangé à 68 €. Que devient le seuil de rentabilité (structure 48 000 €) ?",
        options: [
          { id: "a", label: "Il monte d'environ 1 600 à environ 1 780 commandes" },
          { id: "b", label: "Il baisse à environ 1 400 commandes" },
          { id: "c", label: "Il ne bouge pas : la structure est identique" },
          { id: "d", label: "Il monte à environ 3 200 commandes" },
        ],
        correctOptionId: "a",
        explain:
          "La marge tombe de 30 € à 27 €. Seuil = 48 000 ÷ 27 ≈ 1 778 commandes. Absorber une hausse, c'est déplacer son seuil sans que le client s'en aperçoive.",
      },
      {
        id: "segment_sensible",
        prompt:
          "Quel segment supportera le moins une hausse de prix : le trafic payant (élasticité −2,3) ou la base fidèle (−0,9) ?",
        options: [
          { id: "a", label: "Le trafic payant : il compare les prix avant de cliquer" },
          { id: "b", label: "La base fidèle : elle est plus exigeante" },
          { id: "c", label: "Les deux réagissent identiquement" },
          { id: "d", label: "Aucun : l'élasticité ne s'applique pas en ligne" },
        ],
        correctOptionId: "a",
        explain:
          "Le client acquis par la publicité arbitre sur le prix affiché — c'est souvent ce qui l'a fait venir. Le client fidèle achète pour d'autres raisons.",
      },
    ],
    modelRelevance: {
      elasticity_analysis: "optimal",
      cvp_analysis: "acceptable",
      sensitivity_analysis: "acceptable",
      capacity_analysis: "irrelevant",
    },
    conceptCodes: ["price_elasticity", "contribution_margin", "breakeven", "margin_rates"],
    hints: hints([
      "La hausse touche une charge variable, pas la structure. Quelle grandeur bouge en premier ?",
      "Votre marge par commande se comprime de 3 €. Multipliez par vos volumes trimestriels.",
      "Offrir les frais de port revient exactement à absorber la hausse : le geste commercial est une baisse de marge déguisée.",
      "Répercuter coûte du volume, et pas le même sur chaque segment : −2,3 chez le trafic payant, −0,9 chez les fidèles.",
      "Une troisième voie existe : relever le panier moyen (franco de port à partir d'un montant) plutôt que le prix unitaire. La marge par commande monte sans que le prix affiché bouge.",
    ]),
    trigger: { round: 5 },
    weight: 1.5,
  },
  {
    code: "ecom_detect_below_breakeven",
    title: "Le trimestre est déficitaire",
    narrative:
      "Le chiffre d'affaires a progressé, les commandes aussi — et le résultat d'exploitation est négatif. Le tableau de bord publicitaire, lui, affiche de bons chiffres.",
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
    conceptCodes: ["breakeven", "contribution_margin", "fixed_costs", "safety_margin"],
    hints: hints([
      "Regardez le compte de résultat : quel poste a le plus augmenté en même temps que le chiffre d'affaires ?",
      "Calculez ce que rapporte une commande APRÈS la publicité qui l'a déclenchée, pas avant.",
      "Marge nette d'acquisition = (CA − coût variable − budget publicitaire) ÷ commandes. Si elle est négative, croître aggrave tout.",
      "Le seuil de rentabilité classique ignore la publicité, qu'il traite comme une charge de structure. En e-commerce, c'est trompeur : elle varie avec le volume visé.",
      "Trois leviers agissent réellement : relever le panier moyen, faire revenir les clients (acquisition nulle), ou réduire le coût variable. Le volume seul n'en est pas un.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
  },
  {
    code: "ecom_detect_profitable_illiquid",
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
      "Leviers immédiats : réduire le stock dormant, mobiliser les créances marketplace (à un coût), ou négocier le délai fournisseur — le seul qui soit gratuit.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  ecom_t1_acquisition:
    "Le seuil de rentabilité pose la question du métier dans les bons termes : combien de commandes faut-il, une fois la publicité payée ?",
  ecom_t2_fidelisation:
    "L'analyse des coûts pertinents compare ce que chaque euro CHANGE selon l'endroit où on le met — acquérir ou fidéliser — au lieu de comparer des chiffres d'affaires.",
  ecom_t4_pic:
    "L'analyse de capacité met en évidence la contrainte la plus serrée : acheter du stock au-delà de ce que l'entrepôt sait expédier immobilise de la trésorerie pour rien.",
  ecom_t5_frais_port:
    "L'élasticité-prix dit ce que coûte en volume chaque euro répercuté, segment par segment : c'est le seul outil qui arbitre entre marge et quantités.",
  ecom_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart — à condition de traiter la publicité pour ce qu'elle est ici : une charge qui varie avec le volume visé.",
  ecom_detect_profitable_illiquid:
    "L'analyse FRNG / BFR explique seule qu'une entreprise rentable manque de trésorerie : c'est le stock qui a bougé, pas le résultat.",
};

attachModelQuestions(ECOMMERCE_SITUATIONS, MODEL_EXPLAIN);
