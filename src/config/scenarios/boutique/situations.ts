import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de MAILLE & CO (commerce de détail).
 *
 * Le fil rouge du secteur : on ne fabrique rien, donc tout se joue entre le
 * prix d'achat et le prix de vente — et le stock, qui est à la fois l'outil
 * de travail et le piège de trésorerie.
 */
export const BOUTIQUE_SITUATIONS: SituationDef[] = [
  {
    code: "boutique_t1_reprise",
    title: "La reprise de la boutique",
    narrative:
      "Vous reprenez MAILLE & CO : 90 m² en centre-ville, six salariées, 1 200 articles en réserve et un bail qui court. L'ancienne propriétaire vous laisse un carnet où elle notait ses prix d'achat, et rien d'autre.",
    problem:
      "Avant de fixer vos étiquettes : qu'est-ce qui détermine si un article vendu vous fait gagner ou perdre de l'argent ?",
    diagnosticOptions: [
      {
        id: "cover_purchase",
        label: "Chaque article doit se vendre plus cher que son coût d'achat et ses frais variables",
        correct: true,
      },
      {
        id: "cover_fixed",
        label: "L'ensemble des marges dégagées doit couvrir le loyer et les salaires du trimestre",
        correct: true,
      },
      {
        id: "beat_competitors",
        label: "Il faut afficher un prix inférieur à celui de l'enseigne d'en face",
        correct: false,
      },
      {
        id: "sell_stock",
        label: "Il faut écouler tout le stock, quel qu'en soit le prix",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "coefficient",
        prompt:
          "Un article acheté 18 € est vendu 45 €. Quel est le coefficient multiplicateur ?",
        options: [
          { id: "a", label: "2,5" },
          { id: "b", label: "1,6" },
          { id: "c", label: "27" },
          { id: "d", label: "0,4" },
        ],
        correctOptionId: "a",
        explain:
          "Le coefficient multiplicateur est le rapport prix de vente / prix d'achat : 45 ÷ 18 = 2,5. C'est le langage du commerce, mais il ne dit rien des frais variables ni des charges de structure.",
      },
      {
        id: "marge_vs_coeff",
        prompt:
          "Ce même article supporte 3,50 € de frais variables (sac, commission carte, logistique). Quelle marge sur coût variable dégage-t-il réellement ?",
        options: [
          { id: "a", label: "23,50 €" },
          { id: "b", label: "27,00 €" },
          { id: "c", label: "18,00 €" },
          { id: "d", label: "45,00 €" },
        ],
        correctOptionId: "a",
        explain:
          "45 − 18 − 3,50 = 23,50 €. Le coefficient multiplicateur oublie les frais variables : c'est la marge sur coût variable, pas la marge commerciale, qui couvre le loyer et les salaires.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      psych_pricing: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["markup_coefficient", "contribution_margin", "variable_costs", "fixed_costs", "breakeven"],
    hints: hints([
      "Regardez votre compte de résultat : deux blocs de charges s'y comportent très différemment quand vos ventes varient.",
      "Le loyer et les salaires tombent que vous vendiez 10 ou 10 000 articles. Le coût d'achat, lui, suit les quantités.",
      "Chaque article vendu laisse « prix − coût d'achat − frais variables » pour éponger les charges de structure.",
      "Marge sur coût variable unitaire = 45 − 18 − 3,50 = 23,50 €. Vos charges de structure décaissées sont de 84 000 € par trimestre.",
      "Seuil de rentabilité = 84 000 ÷ 23,50 ≈ 3 575 articles par trimestre. En dessous, la boutique perd de l'argent quoi que vous fassiez en vitrine.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "boutique_t2_circuit",
    title: "Trois représentants, trois modèles",
    narrative:
      "Trois commerciaux se succèdent dans votre arrière-boutique. Le grossiste propose son catalogue habituel à 45 jours. Le déstockeur casse les prix de 18 %, mais veut un chèque à l'enlèvement et ne garantit aucun réassort. Les créateurs demandent 22 % de plus, réglés à 30 jours, et vous laissent l'exclusivité sur la ville.",
    problem:
      "Sur quels critères tranchez-vous, et pourquoi le seul prix d'achat ne suffit-il pas à décider ?",
    diagnosticOptions: [
      {
        id: "multi_criteria",
        label: "Prix d'achat, image de la boutique, délai de règlement et risque de rupture doivent être pesés ensemble",
        correct: true,
      },
      {
        id: "cash_impact",
        label: "Payer comptant au lieu de 45 jours change le besoin de trésorerie, pas seulement le résultat",
        correct: true,
      },
      {
        id: "cheapest_wins",
        label:
          "Le déstockeur donne le meilleur coefficient multiplicateur : c'est donc la meilleure affaire",
        correct: false,
      },
      {
        id: "premium_always",
        label: "Le créateur est toujours le bon choix : la qualité finit toujours par payer",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "delai_bfr",
        prompt:
          "Passer d'un fournisseur à 45 jours à un fournisseur payé comptant, à volume d'achat identique, produit quel effet ?",
        options: [
          { id: "a", label: "Le besoin en fonds de roulement augmente : les dettes fournisseurs disparaissent" },
          { id: "b", label: "Le besoin en fonds de roulement diminue" },
          { id: "c", label: "Le résultat net baisse mécaniquement" },
          { id: "d", label: "Aucun effet : seul le prix d'achat compte" },
        ],
        correctOptionId: "a",
        explain:
          "Les dettes fournisseurs sont une ressource gratuite qui vient EN DÉDUCTION du BFR. Les supprimer, c'est financer soi-même son stock : le résultat ne bouge pas, la trésorerie si.",
      },
      {
        id: "qualite_perçue",
        prompt:
          "Le déstockeur permet 18 % d'économie sur le coût d'achat mais dégrade la qualité perçue. Quel segment de votre clientèle le supportera le moins ?",
        options: [
          { id: "a", label: "Les clientes fidèles, très sensibles à la qualité et peu au prix" },
          { id: "b", label: "Les chalands de passage, très sensibles au prix" },
          { id: "c", label: "Les comités d'entreprise, qui achètent au volume" },
          { id: "d", label: "Tous les segments réagissent de la même façon" },
        ],
        correctOptionId: "a",
        explain:
          "La segmentation sert exactement à cela : les fidèles arbitrent sur la qualité (élasticité-prix faible, sensibilité qualité forte), les chalands sur le prix. Une décision d'achat n'a pas le même effet sur les deux.",
      },
    ],
    modelRelevance: {
      multicriteria_matrix: "optimal",
      relevant_costs: "acceptable",
      frng_bfr_analysis: "acceptable",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["markup_coefficient", "stock_rotation", "segmentation", "variable_costs", "bfr", "margin_rates"],
    hints: hints([
      "Écrivez les trois offres côte à côte : qu'est-ce qui les distingue, au-delà du prix affiché sur le tarif ?",
      "Quatre dimensions au moins : le prix d'achat, la qualité perçue par vos clientes, le délai de règlement et le risque de rupture.",
      "Calculez le coefficient que chacun vous laisse tenir, à prix de vente inchangé : 45 ÷ 14,76 ≈ 3,05 chez le déstockeur, 45 ÷ 18 = 2,5 chez le grossiste, 45 ÷ 21,96 ≈ 2,05 chez les créateurs. Le meilleur coefficient n'est pas encore la meilleure affaire.",
      "Le délai fournisseur n'apparaît pas au compte de résultat mais pèse directement sur le BFR : dettes fournisseurs = ressource, stock = emploi.",
      "Ce que le coefficient ne dit pas : le déstockeur ne réassortit rien, donc ce qui part ne revient pas et la rotation des stocks s'arrête au premier succès. Le paiement comptant ponctionne votre trésorerie du montant des achats. Et la qualité perçue en baisse coûte des ventes chez les fidèles, qui sont justement celles qui ne regardent pas le prix.",
    ]),
    trigger: { round: 2 },
    weight: 1,
  },
  {
    code: "boutique_t4_noel",
    title: "Le trimestre qui fait l'année",
    narrative:
      "Le quatrième trimestre pèse près d'une fois et demie un trimestre ordinaire, et les comités d'entreprise passent leurs commandes de fin d'année. Votre grossiste veut vos volumes maintenant : les délais de livraison sont de six semaines, et il ne reprendra rien.",
    problem:
      "Combien commander pour Noël, et que risquez-vous en vous trompant dans un sens ou dans l'autre ?",
    diagnosticOptions: [
      {
        id: "both_risks",
        label: "Trop peu : des ventes définitivement perdues. Trop : du stock payé qui dort jusqu'au printemps",
        correct: true,
      },
      {
        id: "anticipate",
        label: "Il faut commander avant le pic, donc décaisser avant d'encaisser",
        correct: true,
      },
      {
        id: "transformer_le_trafic",
        label:
          "Le pic fait entrer plus de monde : ce que la boutique en transforme et ce que chaque client emporte décident autant que le volume commandé",
        correct: true,
      },
      {
        id: "max_always",
        label: "Commander le maximum : un article invendu se revend toujours l'année suivante au même prix",
        correct: false,
      },
      {
        id: "wait_and_see",
        label: "Attendre de voir les premières ventes de décembre pour se réapprovisionner",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "transformation_noel",
        prompt:
          "À Noël votre trafic passe de 4 000 à 5 800 visiteurs, mais votre taux de transformation tombe de 30 à 25 % faute de réassort. À panier moyen inchangé de 62 €, que coûte cette baisse ?",
        options: [
          { id: "a", label: "17 980 € : 290 clients entrés et repartis les mains vides" },
          { id: "b", label: "Rien, puisque le nombre de clients servis augmente quand même" },
          { id: "c", label: "62 €, le panier moyen d'un client perdu" },
          { id: "d", label: "Impossible à chiffrer : un client qui n'achète pas ne se compte pas" },
        ],
        correctOptionId: "a",
        explain:
          "Cinq points de transformation perdus sur 5 800 visiteurs font 290 clients, et 290 paniers moyens à 62 € font 17 980 €. Le trafic d'un pic est déjà payé par la vitrine et la communication : ce qui décide de ce qu'il rapporte est ce que le point de vente en transforme, et ce que chaque client emporte. C'est le second levier du pic, et celui qu'on oublie en ne regardant que la commande.",
      },
      {
        id: "stock_bfr",
        prompt:
          "Vous commandez 2 000 articles supplémentaires à 18 €. Quel est l'effet immédiat sur votre bilan, avant toute vente ?",
        options: [
          { id: "a", label: "+36 000 € de stock à l'actif, et une dette fournisseurs ou une sortie de trésorerie au passif" },
          { id: "b", label: "−36 000 € de résultat net" },
          { id: "c", label: "+36 000 € de chiffre d'affaires" },
          { id: "d", label: "Aucun effet tant que les articles ne sont pas vendus" },
        ],
        correctOptionId: "a",
        explain:
          "Acheter n'est pas une charge : c'est un actif qui entre au bilan. La charge n'apparaît qu'à la vente, dans le coût des ventes. Entre les deux, votre argent dort en réserve : c'est la définition du besoin en fonds de roulement.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      scenarios_method: "acceptable",
      cash_budget: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["conversion_rate", "average_basket", "seasonality", "stock", "bfr", "capacity"],
    hints: hints([
      "Regardez la saisonnalité de votre scénario : quel coefficient s'applique au quatrième trimestre ?",
      "Le pic vaut environ 1,45 fois un trimestre ordinaire, et les comités d'entreprise concentrent l'essentiel de leur budget sur ce tour.",
      "Deux erreurs symétriques, mais pas de même coût : la rupture perd une marge à jamais, le surstock immobilise de la trésorerie et se soldera. Et le volume commandé n'est que la moitié du sujet : le trafic du pic ne rapporte que ce que vous en transformez, et que ce que chaque client emporte.",
      "Votre capacité de traitement trimestrielle est de 7 500 articles : elle borne ce que la boutique peut absorber, quelles que soient vos commandes.",
      "Estimez la demande du tour à partir de vos ventes du tour précédent × 1,45, comparez-la à votre capacité, et vérifiez que votre trésorerie supporte le décaissement anticipé.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
  },
  {
    code: "boutique_t5_coton",
    title: "Le coton a flambé",
    narrative:
      "Votre grossiste annonce +18 % sur la prochaine collection : mauvaise récolte, fret en hausse. Vos étiquettes, elles, sont imprimées. Le trimestre de Noël vient de vider votre trésorerie dans le réassort.",
    problem:
      "Répercutez-vous la hausse sur vos prix de vente, ou l'absorbez-vous sur votre marge ?",
    diagnosticOptions: [
      {
        id: "elasticity_first",
        label: "Cela dépend de la sensibilité au prix de chaque segment : répercuter fait perdre des volumes",
        correct: true,
      },
      {
        id: "margin_math",
        label: "Il faut chiffrer combien de volume on peut perdre avant que la hausse de prix ne rapporte plus rien",
        correct: true,
      },
      {
        id: "always_pass",
        label:
          "Il suffit de tenir son coefficient multiplicateur : le prix de vente suit le coût, la marge est préservée",
        correct: false,
      },
      {
        id: "never_pass",
        label: "On n'augmente jamais ses prix : la clientèle partirait chez le concurrent",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "elasticite_calc",
        prompt:
          "Sur le segment des chalands (élasticité-prix −2,1), augmenter le prix de 5 % fait varier la demande d'environ :",
        options: [
          { id: "a", label: "−10,5 %" },
          { id: "b", label: "−2,1 %" },
          { id: "c", label: "+10,5 %" },
          { id: "d", label: "−5 %" },
        ],
        correctOptionId: "a",
        explain:
          "L'élasticité mesure la variation de la demande pour 1 % de variation du prix : −2,1 × 5 % ≈ −10,5 %. Sur ce segment, la hausse de prix coûte plus de volume qu'elle ne rapporte de marge unitaire.",
      },
      {
        id: "seuil_deplace",
        prompt:
          "Vous absorbez la hausse sans toucher à vos prix. Votre coût d'achat passe de 18 € à 21,24 €. Que devient votre seuil de rentabilité, à charges de structure inchangées ?",
        options: [
          { id: "a", label: "Il monte : il faut vendre environ 4 150 articles au lieu de 3 575" },
          { id: "b", label: "Il baisse : la marge unitaire compte moins" },
          { id: "c", label: "Il ne bouge pas : les charges de structure sont identiques" },
          { id: "d", label: "Il devient impossible à atteindre" },
        ],
        correctOptionId: "a",
        explain:
          "La marge unitaire tombe de 23,50 € à 20,26 €. Seuil = 84 000 ÷ 20,26 ≈ 4 146 articles. Absorber une hausse d'achat, c'est déplacer son seuil vers le haut sans que le client s'en aperçoive.",
      },
    ],
    modelRelevance: {
      elasticity_analysis: "optimal",
      cvp_analysis: "acceptable",
      sensitivity_analysis: "acceptable",
      capacity_analysis: "irrelevant",
    },
    conceptCodes: ["markup_coefficient", "psych_price", "price_elasticity", "contribution_margin", "breakeven", "margin_rates"],
    hints: hints([
      "La hausse touche votre coût d'achat, pas vos charges de structure. Quelle grandeur du compte de résultat bouge en premier ?",
      "Votre marge sur coût variable unitaire se comprime de 3,24 € par article. Multipliez par vos volumes trimestriels.",
      "Le réflexe du métier est de tenir son coefficient : 21,24 × 2,5 = 53,10 €. Regardez alors où ce prix vous mène sur chaque segment avant de l'afficher.",
      "Vos segments n'ont pas la même élasticité : −0,9 pour les fidèles, −2,1 pour les chalands. Et les chalands portent un seuil psychologique à 50 € : tenir votre coefficient vous fait passer de 45 à 53,10 €, donc franchir ce seuil chez la clientèle qui y est déjà la plus sensible.",
      "Chiffrez les deux branches : absorber porte le seuil de 3 575 à ~4 150 articles ; répercuter 5 % coûte ~10 % de volume chez les chalands. Comparez les marges totales, pas les pourcentages.",
    ]),
    trigger: { round: 5 },
    weight: 1.5,
  },
  {
    code: "boutique_detect_below_breakeven",
    title: "Le trimestre s'est terminé dans le rouge",
    narrative:
      "Les comptes du trimestre sont sortis : le résultat d'exploitation est négatif. La boutique a pourtant été ouverte tous les jours, les vendeuses ont fait leur travail, et la vitrine était soignée.",
    problem:
      "Vous n'avez pas atteint le seuil de rentabilité. Quels leviers avez-vous réellement, et lequel agit le plus vite ?",
    diagnosticOptions: [
      {
        id: "three_levers",
        label: "Trois leviers : la marge unitaire, les volumes, ou les charges de structure",
        correct: true,
      },
      {
        id: "quantify",
        label: "Il faut chiffrer l'écart en articles avant de choisir un levier",
        correct: true,
      },
      {
        id: "cut_price",
        label: "Baisser les prix est toujours la réponse : cela ramène du volume",
        correct: false,
      },
      {
        id: "wait",
        label: "Le prochain trimestre compensera de lui-même",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "seuil_formule",
        prompt: "Le seuil de rentabilité en volume se calcule :",
        options: [
          { id: "a", label: "Charges de structure ÷ marge sur coût variable unitaire" },
          { id: "b", label: "Charges de structure × marge unitaire" },
          { id: "c", label: "Chiffre d'affaires ÷ coût d'achat" },
          { id: "d", label: "Capacité de traitement × coefficient multiplicateur" },
        ],
        correctOptionId: "a",
        explain:
          "C'est le volume à partir duquel la marge dégagée couvre exactement les charges de structure. Chaque article vendu au-delà crée du résultat.",
      },
      {
        id: "levier_structure",
        prompt:
          "Réduire les charges de structure de 5 % ou augmenter la marge unitaire de 5 % : quel effet sur le seuil ?",
        options: [
          { id: "a", label: "Les deux abaissent le seuil dans des proportions comparables" },
          { id: "b", label: "Seule la baisse des charges agit sur le seuil" },
          { id: "c", label: "Seule la hausse de marge agit sur le seuil" },
          { id: "d", label: "Aucun des deux : seul le volume compte" },
        ],
        correctOptionId: "a",
        explain:
          "Le seuil est un rapport : charges ÷ marge unitaire. Diviser le numérateur ou multiplier le dénominateur par le même facteur produit le même effet. Mais dans un commerce, le loyer se renégocie une fois par bail, le prix se change demain matin.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      elasticity_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["breakeven", "markup_coefficient", "contribution_margin", "fixed_costs", "safety_margin"],
    hints: hints([
      "Reprenez le compte de résultat du tour : de combien manquez-vous exactement pour équilibrer ?",
      "Divisez cet écart par votre marge sur coût variable unitaire : vous obtenez le nombre d'articles manquants.",
      "Le seuil s'écrit : charges de structure ÷ marge unitaire. Trois leviers, donc : le numérateur, le dénominateur, ou les quantités vendues.",
      "Attention au levier prix : il agit sur la marge unitaire ET sur les volumes, en sens contraire. C'est l'élasticité qui arbitre.",
      "Avec 84 000 € de charges décaissées et 23,50 € de marge, le seuil est à ~3 575 articles. Comparez à vos ventes réelles : l'écart en articles vous dit quel levier est atteignable ce trimestre.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
  },
  {
    code: "boutique_detect_profitable_illiquid",
    title: "Rentable, et pourtant à découvert",
    narrative:
      "Votre expert-comptable est formel : le trimestre est bénéficiaire. Votre banquier l'est tout autant : vous êtes à découvert. La réserve est pleine, et les comités d'entreprise règlent à 45 jours.",
    problem:
      "Comment une boutique qui gagne de l'argent peut-elle manquer de trésorerie ?",
    diagnosticOptions: [
      {
        id: "bfr_grew",
        label: "Le stock et les créances clients ont absorbé la trésorerie plus vite que le résultat n'en a produit",
        correct: true,
      },
      {
        id: "timing",
        label: "Le résultat se constate à la vente, l'encaissement arrive plus tard",
        correct: true,
      },
      {
        id: "accounting_error",
        label: "C'est nécessairement une erreur comptable : un bénéfice, c'est de l'argent en caisse",
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
        id: "bfr_composition",
        prompt: "Dans un commerce de détail, le besoin en fonds de roulement se compose surtout :",
        options: [
          { id: "a", label: "Du stock en réserve et des créances clients, diminués des dettes fournisseurs" },
          { id: "b", label: "Du résultat net cumulé" },
          { id: "c", label: "Des immobilisations et des emprunts" },
          { id: "d", label: "Du chiffre d'affaires du trimestre" },
        ],
        correctOptionId: "a",
        explain:
          "BFR = stocks + créances − dettes fournisseurs. Un commerçant qui achète comptant et vend à crédit finance intégralement son cycle : c'est le pire des deux mondes.",
      },
      {
        id: "tn_formule",
        prompt:
          "La trésorerie nette se déduit du fonds de roulement net global et du besoin en fonds de roulement par :",
        options: [
          { id: "a", label: "TN = FRNG − BFR" },
          { id: "b", label: "TN = FRNG + BFR" },
          { id: "c", label: "TN = BFR − FRNG" },
          { id: "d", label: "TN = résultat net − dividendes" },
        ],
        correctOptionId: "a",
        explain:
          "Le FRNG est la ressource stable disponible après financement des immobilisations ; le BFR est ce que le cycle d'exploitation immobilise. La trésorerie n'est que la différence, jamais une décision directe.",
      },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "acceptable",
      return_analysis: "irrelevant",
      breakeven_analysis: "misleading",
    },
    conceptCodes: ["bfr", "frng", "net_treasury", "stock", "receivables_financing"],
    hints: hints([
      "Comparez deux choses dans vos états : le résultat net du tour, et la variation de votre trésorerie.",
      "Regardez ce qui a bougé au bilan entre l'ouverture et la clôture : le stock, les créances, les dettes fournisseurs.",
      "Le résultat est une opinion, la trésorerie est un fait. Entre les deux, il y a le besoin en fonds de roulement.",
      "TN = FRNG − BFR. Si le résultat monte mais que le BFR monte plus vite, la trésorerie baisse. Le réassort de Noël et les comités d'entreprise à 45 jours travaillent dans le même sens.",
      "Deux leviers immédiats : mobiliser le poste clients (escompte ou affacturage, à un coût) ou réduire le stock. Le troisième, allonger le crédit fournisseur, se négocie : il ne se décrète pas.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
  },
  {
    code: "boutique_t3_soldes",
    title: "Solder, ou garder pour l'an prochain",
    narrative:
      "Il reste 400 pièces de la collection de printemps, achetées 18 € l'unité et affichées 45 €. Elles ne partiront plus au tarif plein. Un client déstockeur en offre 22 € l'unité, tout de suite. Accepter, c'est décider une démarque ; refuser, c'est occuper une réserve jusqu'au printemps prochain, quand la mode aura tourné.",
    problem:
      "Vendre à 22 € une pièce payée 18 €, est-ce une bonne affaire ou une perte ?",
    diagnosticOptions: [
      {
        id: "engage",
        label: "Les 18 € sont déjà payés : ils ne changent plus rien à la décision d'aujourd'hui",
        correct: true,
      },
      {
        id: "comparer_alternatives",
        label: "La vraie comparaison est entre 22 € maintenant et ce que la pièce rapportera plus tard, si elle part",
        correct: true,
      },
      {
        id: "rotation",
        label:
          "Le mètre de linéaire qu'elles occupent porterait la collection suivante, qui tournerait deux fois d'ici le printemps",
        correct: true,
      },
      {
        id: "sous_prix_achat",
        label: "Vendre au-dessus du prix d'achat garantit que l'opération est rentable",
        correct: false,
      },
      {
        id: "jamais_perte",
        label: "Il ne faut jamais vendre en dessous du prix affiché : cela dévalorise la boutique",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "boutique_cout_engage",
        prompt: "Un coût déjà engagé et irrécupérable doit, dans une décision…",
        options: [
          { id: "a", label: "Être ignoré : seuls comptent les encaissements et décaissements que la décision change encore" },
          { id: "b", label: "Être récupéré en priorité par le prix de vente" },
          { id: "c", label: "Être réparti sur les autres articles de la collection" },
          { id: "d", label: "Être ajouté au coût variable de la vente" },
        ],
        correctOptionId: "a",
        explain:
          "Les 18 € sont sortis de la caisse il y a des mois, quelle que soit votre décision d'aujourd'hui. Vouloir les « récupérer » conduit à refuser 22 € et à finir avec zéro.",
      },
      {
        id: "boutique_demarque",
        prompt:
          "Solder ces 400 pièces à 22 € au lieu des 45 € affichés : que représente cette démarque ?",
        options: [
          {
            id: "a",
            label:
              "9 200 €, soit 23 € par pièce sur les 400, une démarque connue parce qu'elle est décidée",
          },
          { id: "b", label: "7 200 €, le prix d'achat des pièces concernées" },
          { id: "c", label: "Aucune : la vente se fait au-dessus du prix d'achat" },
          { id: "d", label: "18 000 €, le chiffre d'affaires que ces pièces auraient dû faire" },
        ],
        correctOptionId: "a",
        explain:
          "La démarque est ce qui sort du stock sans passer en caisse au prix prévu : 23 €, soit 45 − 22, sur chacune des 400 pièces, donc 9 200 € rapportés aux 18 000 € qu'elles valaient en rayon, soit 9 200 ÷ 18 000 ≈ 51 %. Elle est CONNUE parce qu'on la décide, à la différence du vol et de la casse, qui se découvrent à l'inventaire.",
      },
    ],
    modelRelevance: {
      relevant_costs: "optimal",
      breakeven_analysis: "misleading",
      marginal_analysis: "acceptable",
      frng_bfr_analysis: "acceptable",
    },
    conceptCodes: ["markdown", "stock_rotation", "sales_per_sqm", "variable_costs", "contribution_margin", "stock", "bfr"],
    hints: hints([
      "Posez-vous une seule question : que change ma décision d'aujourd'hui, en euros qui entrent ou qui sortent ?",
      "Le prix d'achat de 18 € a été payé il y a des mois. Refuser 22 € ne vous les rendra pas.",
      "Les deux options réelles sont : 22 € tout de suite, ou une vente incertaine dans un an, place occupée entre-temps.",
      "Un coût déjà engagé ne doit jamais entrer dans un arbitrage : il est le même quelle que soit l'option retenue.",
      "Comparez les seuls flux que la décision modifie : 22 € encaissés contre une réserve libérée. Et regardez la rotation, qui est l'argument du commerçant : une pièce qui dort une saison entière est un emplacement qui n'a rien vendu, alors que la collection suivante y tournerait.",
    ]),
    trigger: { round: 3 },
    weight: 1,
  },
  {
    code: "boutique_t6_capitaux",
    title: "L'argent dort dans la réserve",
    narrative:
      "Votre banquier reçoit les comptes de l'année. La boutique dégage un résultat honorable, mais il constate que le stock et les créances immobilisent une somme considérable, et que cet argent ne rapporte rien tant qu'il n'est pas vendu ni encaissé. Il vous demande le budget de trésorerie du prochain exercice.",
    problem:
      "Comment prévoir les mois où la caisse sera tendue, avant d'y être ?",
    diagnosticOptions: [
      {
        id: "decalage",
        label: "Les encaissements et les décaissements ne tombent pas au même moment : c'est ce décalage qu'il faut projeter",
        correct: true,
      },
      {
        id: "saison",
        label: "Les achats de la collection de Noël se paient avant que Noël ne rapporte quoi que ce soit",
        correct: true,
      },
      {
        id: "resultat_suffit",
        label: "Un résultat prévisionnel positif garantit une trésorerie positive",
        correct: false,
      },
      {
        id: "decouvert_regle",
        label: "Le découvert autorisé dispense de faire un budget de trésorerie",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "boutique_budget_treso",
        prompt: "Un budget de trésorerie se distingue d'un compte de résultat prévisionnel parce qu'il…",
        options: [
          { id: "a", label: "Enregistre les mouvements à la date où l'argent entre ou sort, pas à celle de la vente ou de l'achat" },
          { id: "b", label: "Ne retient que les charges décaissées et ignore les produits" },
          { id: "c", label: "Se limite aux opérations exceptionnelles" },
          { id: "d", label: "Remplace le bilan prévisionnel" },
        ],
        correctOptionId: "a",
        explain:
          "Une vente à crédit compte dans le résultat le jour de la vente, et dans la trésorerie le jour du règlement. C'est tout l'écart entre les deux documents.",
      },
      {
        id: "boutique_rotation",
        prompt: "Pour un commerce, accélérer la rotation du stock revient à…",
        options: [
          { id: "a", label: "Immobiliser moins d'argent pour un même chiffre d'affaires" },
          { id: "b", label: "Augmenter la marge dégagée sur chaque article" },
          { id: "c", label: "Réduire les charges de structure" },
          { id: "d", label: "Allonger le crédit obtenu des fournisseurs" },
        ],
        correctOptionId: "a",
        explain:
          "Le même euro de stock sert plusieurs fois dans l'année au lieu d'une. La marge unitaire ne bouge pas, mais les capitaux nécessaires pour la dégager, si.",
      },
    ],
    modelRelevance: {
      cash_budget: "optimal",
      breakeven_analysis: "misleading",
      frng_bfr_analysis: "acceptable",
      return_analysis: "acceptable",
    },
    conceptCodes: ["stock_rotation", "net_treasury", "bfr", "stock", "seasonality"],
    hints: hints([
      "Reprenez vos tours passés : à quel moment la caisse a-t-elle été la plus basse, et pourquoi ?",
      "Les commandes de la saison forte se paient au fournisseur avant que les clientes n'aient acheté quoi que ce soit.",
      "Placez sur une ligne les encaissements attendus, sur une autre les décaissements, à la date où l'argent bouge réellement.",
      "Le solde cumulé de ces deux lignes, mois après mois, est le budget de trésorerie. Son point le plus bas est votre besoin de financement.",
      "Un résultat prévisionnel positif ne dit rien du mois où vous manquerez de caisse : seul le budget de trésorerie le montre.",
    ]),
    trigger: { round: 6 },
    weight: 1,
  },
  {
    code: "boutique_detect_idle_cash",
    title: "La caisse pleine d'après-soldes",
    narrative:
      "Les soldes ont vidé la réserve et rempli le compte : vous détenez plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an. Il facture par ailleurs votre découvert 9 %. La collection d'automne, elle, se commande dans quelques semaines et se paie avant d'être vendue.",
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
        id: "boutique_detect_idle_cash_placement_exces",
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
        id: "boutique_saison_achats",
        prompt: "Dans un commerce saisonnier, un solde de trésorerie élevé après les soldes signifie surtout que…",
        options: [
          { id: "a", label: "Le stock s'est transformé en argent, et cet argent va repartir en stock à la commande suivante" },
          { id: "b", label: "L'entreprise a dégagé un résultat exceptionnel sur le trimestre" },
          { id: "c", label: "Les charges de structure ont diminué" },
          { id: "d", label: "Le besoin en fonds de roulement a définitivement disparu" },
        ],
        correctOptionId: "a",
        explain:
          "Le cycle d'un commerce fait alterner l'argent et la marchandise. Un compte plein entre deux collections n'est pas une richesse durable : c'est le creux de la vague avant le prochain achat.",
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
      "Comparez votre solde aux charges de structure d'un seul trimestre : de combien de trimestres d'avance disposez-vous ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro.",
      "Attention : le placement est bloqué jusqu'au tour suivant. Il ne réglera rien de ce qui tombera d'ici là.",
      "Projetez surtout la commande de la collection suivante : elle se paie au fournisseur avant qu'une seule pièce ne soit vendue.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte quatre fois ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  boutique_detect_idle_cash:
    "Le budget de trésorerie projette les décaissements du tour à venir, la commande de collection comprise. Seul lui dit quelle part du solde peut être bloquée sans risquer le découvert.",
  boutique_t3_soldes:
    "L'analyse des coûts pertinents écarte les 18 € déjà payés, qui sont les mêmes quelle que soit la décision, et ne garde que ce que le choix d'aujourd'hui change encore.",
  boutique_t6_capitaux:
    "Le budget de trésorerie place chaque flux à la date où l'argent bouge, et non à celle de la vente. C'est le seul document qui montre le mois où la caisse manquera.",
  boutique_t1_reprise:
    "Le seuil de rentabilité répond exactement à la question posée : combien d'articles faut-il vendre pour ne plus perdre d'argent ?",
  boutique_t2_circuit:
    "Trois offres, quatre critères hétérogènes : c'est le cas d'école de la matrice multicritère. Le seuil de rentabilité, lui, ne sait pas comparer une image de marque à un délai de paiement.",
  boutique_t4_noel:
    "L'analyse de capacité, croisée avec la saisonnalité, dimensionne un approvisionnement qui anticipe le pic au lieu de le subir.",
  boutique_t5_coton:
    "L'élasticité-prix dit ce que coûte en volume chaque point de hausse répercuté : c'est le seul outil qui arbitre entre marge unitaire et quantités.",
  boutique_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart en articles et désigne les trois leviers : marge unitaire, volumes, charges de structure.",
  boutique_detect_profitable_illiquid:
    "L'analyse FRNG / BFR est l'outil de ce diagnostic : TN = FRNG − BFR, et c'est le BFR qui a bougé, pas le résultat.",
};

attachModelQuestions(BOUTIQUE_SITUATIONS, MODEL_EXPLAIN);
