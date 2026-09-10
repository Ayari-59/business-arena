import { attachModelQuestions, hints, type SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques de MAILLE & CO (commerce de détail, gamme de cinq
 * références en maille).
 *
 * Le fil rouge du secteur : on ne fabrique rien, donc tout se joue entre le
 * prix d'achat au façonnier et le prix de vente — et le stock, qui est à la
 * fois l'outil de travail et le piège de trésorerie. Ce que la gamme ajoute :
 * cinq références n'ont ni la même marge, ni la même saison, ni la même
 * clientèle, et se disputent la même réserve au moment de Noël. Le MIX est
 * une décision.
 *
 * Chiffres de référence (le moteur les applique, les tests les relisent) :
 *   pull col rond  59 € · achat 25 €   + 3,50 € · MCV 30,50 €
 *   cardigan       79 € · achat 34 €   + 4 €    · MCV 41 €
 *   pull mérinos  129 € · achat 56 €   + 5 €    · MCV 68 €
 *   écharpe        35 € · achat 14 €   + 2 €    · MCV 19 €
 *   bonnet         25 € · achat 9,50 € + 1,50 € · MCV 14 €
 *   84 000 € de charges de structure décaissées par trimestre, 7 500 pièces
 *   de capacité de traitement.
 */
export const BOUTIQUE_SITUATIONS: SituationDef[] = [
  {
    code: "boutique_t1_reprise",
    category: "prise_de_poste",
    title: "La reprise de la boutique",
    narrative:
      "Vous reprenez MAILLE & CO : une marque de vêtements en maille, une boutique en centre-ville, six salariées, cinq références tricotées par des façonniers et une réserve encore pleine de la collection passée. L'ancienne propriétaire vous laisse un carnet où elle notait ses prix d'achat, référence par référence, et rien d'autre.",
    problem:
      "Avant de fixer vos étiquettes : qu'est-ce qui détermine si une pièce vendue vous fait gagner ou perdre de l'argent, et pourquoi la réponse n'est-elle pas la même pour un bonnet et pour un pull mérinos ?",
    diagnosticOptions: [
      {
        id: "cover_purchase",
        label: "Chaque pièce doit se vendre plus cher que son coût d'achat et ses frais variables",
        correct: true,
      },
      {
        id: "cover_fixed",
        label: "L'ensemble des marges dégagées, toutes références confondues, doit couvrir le loyer et les salaires du trimestre",
        correct: true,
      },
      {
        id: "mix_matters",
        label: "Un bonnet et un pull mérinos ne laissent pas la même marge : le mix vendu décide du seuil autant que le volume",
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
        id: "marge_vs_coeff",
        prompt:
          "Un pull col rond acheté 25 € au façonnier est vendu 59 € et supporte 3,50 € de frais variables (sac, commission carte, logistique). Quelle marge sur coût variable dégage-t-il réellement ?",
        options: [
          { id: "a", label: "30,50 €" },
          { id: "b", label: "34,00 €" },
          { id: "c", label: "25,00 €" },
          { id: "d", label: "59,00 €" },
        ],
        correctOptionId: "a",
        explain:
          "30,50 €, soit 59 − 25 − 3,50. Le coefficient multiplicateur (59 ÷ 25 ≈ 2,4, le langage du commerce) oublie les frais variables : c'est la marge sur coût variable, pas la marge commerciale, qui couvre le loyer et les salaires.",
      },
      {
        id: "mix_marge",
        prompt:
          "Le bonnet laisse 14 € de marge sur coût variable, le pull mérinos 68 €. Faut-il ne vendre que des pulls mérinos ?",
        options: [
          {
            id: "a",
            label:
              "Non : tant que la réserve n'est pas pleine, chaque pièce vendue au-dessus de son coût variable ajoute sa marge ; c'est seulement quand la capacité sature que la marge par pièce départage",
          },
          { id: "b", label: "Oui : la référence la plus rentable doit remplacer toutes les autres" },
          { id: "c", label: "Non : le bonnet coûte moins cher, il est donc plus rentable" },
          { id: "d", label: "Oui : le mérinos couvre à lui seul les charges de structure" },
        ],
        correctOptionId: "a",
        explain:
          "Chaque référence a sa clientèle : personne n'achète cinq pulls mérinos faute de bonnets. Un bonnet vendu rapporte 14 € que la boutique n'aurait pas eus. La marge par pièce ne tranche que lorsque les références se disputent une place limitée — la réserve à Noël, par exemple. C'est la logique de l'assortiment.",
      },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      marginal_analysis: "acceptable",
      psych_pricing: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: [
      "markup_coefficient",
      "contribution_margin",
      "variable_costs",
      "fixed_costs",
      "breakeven",
      "assortment",
    ],
    hints: hints([
      "Regardez votre compte de résultat : deux blocs de charges s'y comportent très différemment quand vos ventes varient.",
      "Le loyer et les salaires tombent que vous vendiez 10 ou 10 000 pièces. Le coût d'achat au façonnier, lui, suit les quantités.",
      "Chaque pièce vendue laisse « prix − coût d'achat − frais variables » pour éponger les charges de structure : 30,50 € sur un pull col rond, 14 € sur un bonnet, 68 € sur un pull mérinos.",
      "Marge sur coût variable unitaire du pull col rond = 59 − 25 − 3,50 = 30,50 €. Vos charges de structure décaissées sont de 84 000 € par trimestre.",
      "Seuil de rentabilité = 84 000 ÷ 30,50 ≈ 2 754 pulls par trimestre si vous ne vendiez que des pulls ; au mix de référence de la boutique (marge moyenne 29,35 €), 84 000 ÷ 29,35 ≈ 2 862 pièces. En dessous, la boutique perd de l'argent quoi que vous fassiez en vitrine.",
    ]),
    trigger: { round: 1 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "review", hint: "Vos étiquettes fixent la marge unitaire de chaque référence : chaque euro de prix en plus rapproche le seuil de rentabilité, mais peut coûter des volumes si vous dépassez la sensibilité de vos segments." },
      { field: "productionPlan", direction: "review", hint: "Le volume commandé, référence par référence, détermine votre stock et votre BFR : dimensionnez-le en fonction du seuil de rentabilité et de la demande de chaque pièce, pas de l'intuition." },
    ],
  },
  {
    code: "boutique_t2_circuit",
    category: "decision_strategique",
    title: "Trois façonniers, trois modèles",
    narrative:
      "Trois tricoteurs se succèdent dans votre arrière-boutique. Le façonnier de référence propose son réassort habituel à 45 jours. Un tricoteur portugais casse les prix de 18 % sur ses fins de série, mais veut un chèque à l'enlèvement et ne garantit aucun réassort. L'atelier local demande 22 % de plus, réglés à 30 jours, et vous laisse l'étiquette « fabriqué en France » et l'exclusivité sur la ville.",
    problem:
      "Sur quels critères tranchez-vous, et pourquoi le seul prix d'achat ne suffit-il pas à décider ?",
    diagnosticOptions: [
      {
        id: "multi_criteria",
        label: "Prix d'achat, image de la marque, délai de règlement et risque de rupture doivent être pesés ensemble",
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
          "Le tricoteur portugais donne le meilleur coefficient multiplicateur : c'est donc la meilleure affaire",
        correct: false,
      },
      {
        id: "premium_always",
        label: "L'atelier local est toujours le bon choix : la qualité finit toujours par payer",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "delai_bfr",
        prompt:
          "Passer d'un façonnier à 45 jours à un façonnier payé comptant, à volume d'achat identique, produit quel effet ?",
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
          "Les fins de série permettent 18 % d'économie sur le coût d'achat mais dégradent la qualité perçue. Quel segment de votre clientèle le supportera le moins ?",
        options: [
          { id: "a", label: "Les clientes fidèles, très sensibles à la qualité et peu au prix" },
          { id: "b", label: "Les passants, très sensibles au prix" },
          { id: "c", label: "Les comités d'entreprise, qui achètent au volume" },
          { id: "d", label: "Tous les segments réagissent de la même façon" },
        ],
        correctOptionId: "a",
        explain:
          "La segmentation sert exactement à cela : les fidèles arbitrent sur la qualité (élasticité-prix faible, sensibilité qualité forte), les passants sur le prix. Une décision d'achat n'a pas le même effet sur les deux — et ce sont les fidèles qui portent le cardigan et le pull mérinos, vos marges les plus fortes.",
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
      "Calculez le coefficient que chacun vous laisse tenir sur le pull col rond, à prix de vente inchangé : 59 ÷ 20,50 ≈ 2,88 chez le tricoteur portugais, 59 ÷ 25 ≈ 2,36 chez le façonnier de référence, 59 ÷ 30,50 ≈ 1,93 à l'atelier local. Le meilleur coefficient n'est pas encore la meilleure affaire.",
      "Le délai fournisseur n'apparaît pas au compte de résultat mais pèse directement sur le BFR : dettes fournisseurs = ressource, stock = emploi.",
      "Ce que le coefficient ne dit pas : les fins de série ne se réassortissent pas, donc ce qui part ne revient pas et la rotation des stocks s'arrête au premier succès. Le paiement comptant ponctionne votre trésorerie du montant des achats. Et la qualité perçue en baisse coûte des ventes chez les fidèles, qui sont justement celles qui ne regardent pas le prix et qui achètent le mérinos.",
    ]),
    trigger: { round: 2 },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "Le choix du façonnier détermine ce que vous mettez en rayon : qualité perçue, possibilité de réassort et trésorerie mobilisée en dépendent directement." },
      { field: "qualityBudget", direction: "review", hint: "L'image de la marque se construit par la sélection des pièces : les fins de série économisent sur l'achat mais dégradent l'expérience des clientes fidèles." },
      { field: "price", direction: "review", hint: "Le coefficient que chaque façonnier vous laisse tenir n'est pas le même : recalculez votre marge unitaire selon la source choisie avant de fixer vos étiquettes." },
    ],
  },
  {
    code: "boutique_t4_noel",
    category: "contexte_marche",
    title: "Le trimestre qui fait l'année",
    narrative:
      "La maille se vend l'hiver : au quatrième trimestre, les pulls partent une fois et demie plus vite, les écharpes et les bonnets plus de deux fois, et les comités d'entreprise passent leurs dotations. Votre façonnier veut vos volumes maintenant, référence par référence, et ne reprendra rien. Votre réserve, elle, ne grandit pas.",
    problem:
      "Combien commander pour Noël, de quelle référence, et à quel risque ?",
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
        id: "rare_factor",
        label:
          "La réserve est la ressource rare du trimestre : quand la demande la dépasse, la marge par pièce départage les références",
        correct: true,
      },
      {
        id: "max_always",
        label: "Commander le maximum de chaque référence : une pièce invendue se revend l'année suivante au même prix",
        correct: false,
      },
      {
        id: "wait_and_see",
        label: "Attendre les premières ventes de décembre pour se réapprovisionner",
        correct: false,
      },
    ],
    quiz: [
      {
        id: "transformation_noel",
        prompt:
          "À Noël, 5 800 visiteurs au lieu de 4 000, mais le taux de transformation tombe de 30 à 25 % faute de réassort. Panier moyen inchangé, 62 € : que coûte cette baisse ?",
        options: [
          { id: "a", label: "17 980 € : 290 clients entrés et repartis les mains vides" },
          { id: "b", label: "Rien : le nombre de clients servis augmente quand même" },
          { id: "c", label: "62 €, le panier moyen d'un client perdu" },
          { id: "d", label: "Impossible à chiffrer : un client qui n'achète pas ne se compte pas" },
        ],
        correctOptionId: "a",
        explain:
          "Cinq points de transformation perdus sur 5 800 visiteurs font 290 clients, et 290 paniers moyens à 62 € font 17 980 €. Le trafic d'un pic est déjà payé par la vitrine et la communication : ce qui décide de ce qu'il rapporte est ce que le point de vente en transforme, et ce que chaque client emporte. C'est le second levier du pic, et celui qu'on oublie en ne regardant que la commande.",
      },
      {
        id: "mix_capacite",
        prompt:
          "Votre réserve traite 7 500 pièces par trimestre et la demande de Noël la dépasse. Le bonnet laisse 14 € par pièce, l'écharpe 19 €, le pull col rond 30,50 €, le cardigan 41 €, le pull mérinos 68 €. Comment répartir la commande ?",
        options: [
          {
            id: "a",
            label:
              "Servir d'abord les plus fortes marges par pièce, chacune jusqu'à sa demande, puis les accessoires avec la place restante",
          },
          { id: "b", label: "Répartir la place à parts égales entre les cinq références" },
          { id: "c", label: "Ne commander que des bonnets et des écharpes : ce sont eux qui se vendent le plus" },
          { id: "d", label: "Ne commander que des pulls mérinos : la demande suivra la marge" },
        ],
        correctOptionId: "a",
        explain:
          "Quand une ressource limite tout, on classe les références par marge rapportée à cette ressource — ici la place en réserve, une pièce en vaut une autre. Le mérinos passe en premier, mais seulement jusqu'à ce que sa clientèle en veuille : au-delà, chaque place qu'il occupe dort. Les accessoires font le volume avec la place qui reste. C'est l'arbitrage de l'assortiment sous contrainte.",
      },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      scenarios_method: "acceptable",
      cash_budget: "acceptable",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["conversion_rate", "average_basket", "seasonality", "stock", "bfr", "capacity", "assortment", "contribution_margin"],
    hints: hints([
      "Regardez la saisonnalité de chaque référence : quel coefficient s'applique au quatrième trimestre, pour un pull et pour un bonnet ?",
      "Le pull vaut environ 1,5 fois un trimestre ordinaire, les accessoires plus du double, et les comités d'entreprise concentrent l'essentiel de leur budget sur ce tour.",
      "Deux erreurs symétriques, mais pas de même coût : la rupture perd une marge à jamais, le surstock immobilise de la trésorerie et se soldera. Et le volume commandé n'est que la moitié du sujet : le trafic du pic ne rapporte que ce que vous en transformez, et que ce que chaque client emporte.",
      "Votre capacité de traitement trimestrielle est de 7 500 pièces, toutes références confondues : elle borne ce que la boutique peut écouler, quelles que soient vos commandes. Quand la demande la dépasse, classez les références par marge par pièce.",
      "Estimez la demande du tour, référence par référence, à partir de vos ventes du tour précédent et du coefficient saisonnier de chacune ; comparez la somme à votre capacité ; servez en priorité les marges les plus fortes jusqu'à leur demande ; et vérifiez que votre trésorerie supporte le décaissement anticipé.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
    decisionLevers: [
      { field: "productionPlan", direction: "up", hint: "Le pic saisonnier exige un stock supérieur à la normale : dimensionnez la commande de chaque référence sur sa demande anticipée, dans la limite de votre capacité de traitement, en servant d'abord les marges les plus fortes." },
      { field: "marketingBudget", direction: "review", hint: "Le trafic du pic est déjà acquis par la saison, mais le taux de transformation et le panier moyen dépendent de l'animation en boutique : chaque point de conversion perdu coûte des milliers d'euros." },
      { field: "price", direction: "review", hint: "À Noël, certains segments sont moins sensibles au prix : c'est le moment de placer les références à plus forte marge et de soigner le panier moyen." },
    ],
  },
  {
    code: "boutique_t5_coton",
    category: "contexte_marche",
    title: "La laine a flambé",
    narrative:
      "Votre façonnier annonce +18 % sur la prochaine collection : la laine mérinos et le coton ont flambé, le fret aussi. Vos étiquettes, elles, sont imprimées. Le trimestre de Noël vient de vider votre trésorerie dans le réassort.",
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
          "Sur le segment des passants (élasticité-prix −2,1), augmenter le prix de 5 % fait varier la demande d'environ :",
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
          "Vous absorbez la hausse sans toucher à vos prix. Le coût d'achat du pull col rond passe de 25 € à 29,50 €. Que devient votre seuil de rentabilité, à charges de structure inchangées, si vous ne vendiez que des pulls ?",
        options: [
          { id: "a", label: "Il monte : il faut vendre environ 3 230 pulls au lieu de 2 754" },
          { id: "b", label: "Il baisse : la marge unitaire compte moins" },
          { id: "c", label: "Il ne bouge pas : les charges de structure sont identiques" },
          { id: "d", label: "Il devient impossible à atteindre" },
        ],
        correctOptionId: "a",
        explain:
          "La marge unitaire tombe de 30,50 € à 26 €. Seuil = 84 000 ÷ 26 ≈ 3 231 pulls. Absorber une hausse d'achat, c'est déplacer son seuil vers le haut sans que le client s'en aperçoive.",
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
      "Votre marge sur coût variable unitaire se comprime de 4,50 € par pull col rond, et d'autant plus que la pièce est chère : près de 10 € sur un pull mérinos. Multipliez par vos volumes trimestriels.",
      "Le réflexe du métier est de tenir son coefficient : 29,50 € × 2,4 mène le pull près de 70 €. Regardez alors où ce prix vous mène sur chaque segment avant de l'afficher.",
      "Vos segments n'ont pas la même élasticité : −0,9 pour les fidèles, −2,1 pour les passants. Et les passants portent un seuil psychologique à 60 € sur le pull : tenir votre coefficient vous fait passer de 59 à près de 70 €, donc franchir ce seuil chez la clientèle qui y est déjà la plus sensible.",
      "Chiffrez les deux branches : absorber porte le seuil de 2 754 à ~3 230 pulls ; répercuter 5 % coûte ~10 % de volume chez les passants. Comparez les marges totales, pas les pourcentages — et référence par référence : le mérinos, vendu aux fidèles, supporte la hausse ; le bonnet, vendu aux passants, ne la supporte pas.",
    ]),
    trigger: { round: 5 },
    weight: 1.5,
    decisionLevers: [
      { field: "price", direction: "up", hint: "Répercuter la hausse du coût d'achat sur le prix de vente préserve la marge unitaire, mais l'élasticité-prix vous dit combien de volume cela coûte sur chaque segment : pas le même arbitrage sur le mérinos et sur le bonnet." },
      { field: "productionPlan", direction: "review", hint: "Avec un coût d'achat plus élevé, chaque pièce invendue pèse davantage sur la trésorerie : ajustez les quantités commandées de chaque référence à la demande attendue après la hausse." },
      { field: "marketingBudget", direction: "review", hint: "Si vous absorbez la hausse, la communication peut compenser en volume ce que la marge perd en unitaire — mais chiffrez l'élasticité avant d'investir." },
    ],
  },
  {
    code: "boutique_detect_below_breakeven",
    category: "alerte_comptable",
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
        label: "Il faut chiffrer l'écart en pièces avant de choisir un levier",
        correct: true,
      },
      {
        id: "mix_lever",
        label: "Le mix est un quatrième levier : vendre la même quantité avec plus de cardigans et moins de bonnets relève la marge moyenne",
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
          { id: "a", label: "Charges de structure ÷ marge sur coût variable unitaire moyenne" },
          { id: "b", label: "Charges de structure × marge unitaire" },
          { id: "c", label: "Chiffre d'affaires ÷ coût d'achat" },
          { id: "d", label: "Capacité de traitement × coefficient multiplicateur" },
        ],
        correctOptionId: "a",
        explain:
          "C'est le volume à partir duquel la marge dégagée couvre exactement les charges de structure. Chaque pièce vendue au-delà crée du résultat. Avec plusieurs références, la marge unitaire est une moyenne pondérée par le mix vendu : changer le mix déplace le seuil.",
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
      variance_analysis: "acceptable",
      elasticity_analysis: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["breakeven", "markup_coefficient", "contribution_margin", "fixed_costs", "safety_margin", "assortment"],
    hints: hints([
      "Reprenez le compte de résultat du tour : de combien manquez-vous exactement pour équilibrer ?",
      "Divisez cet écart par votre marge sur coût variable unitaire moyenne : vous obtenez le nombre de pièces manquantes.",
      "Le seuil s'écrit : charges de structure ÷ marge unitaire. Trois leviers, donc : le numérateur, le dénominateur, ou les quantités vendues — et le mix, qui change le dénominateur sans toucher aux étiquettes.",
      "Attention au levier prix : il agit sur la marge unitaire ET sur les volumes, en sens contraire. C'est l'élasticité qui arbitre.",
      "Avec 84 000 € de charges décaissées et 29,35 € de marge moyenne au mix de référence, le seuil est à ~2 862 pièces ; il monte si vous vendez surtout des bonnets, il descend si vous vendez des cardigans. Comparez à vos ventes réelles : l'écart en pièces vous dit quel levier est atteignable ce trimestre.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "up", hint: "Augmenter le prix relève la marge unitaire et abaisse le seuil de rentabilité, à condition que l'élasticité ne fasse pas perdre plus de volume que la marge n'en gagne." },
      { field: "marketingBudget", direction: "review", hint: "La promotion peut ramener du trafic et du volume, mais elle coûte : vérifiez que chaque euro investi rapporte plus d'un euro de marge supplémentaire." },
      { field: "maintenanceBudget", direction: "down", hint: "Les charges de structure sont le numérateur du seuil : chaque euro économisé sur l'entretien de la boutique abaisse directement le nombre de pièces à vendre pour équilibrer." },
    ],
  },
  {
    code: "boutique_detect_profitable_illiquid",
    category: "alerte_comptable",
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
      "TN = FRNG − BFR. Si le résultat monte mais que le BFR monte plus vite, la trésorerie baisse. Le réassort de Noël, les cadeaux d'affaires à 60 jours et les comités d'entreprise à 45 jours travaillent dans le même sens.",
      "Deux leviers immédiats : mobiliser le poste clients (escompte ou affacturage, à un coût) ou réduire le stock — en commençant par la référence qui tourne le moins. Le troisième, allonger le crédit façonnier, se négocie : il ne se décrète pas.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "down", hint: "Réduire le stock commandé libère de la trésorerie immédiatement : chaque pièce en moins en réserve, c'est son prix d'achat qui reste en caisse." },
      { field: "price", direction: "review", hint: "Proposer un escompte pour paiement comptant aux comités d'entreprise accélère les encaissements et comprime le BFR, au prix d'une concession sur la marge." },
      { field: "maintenanceBudget", direction: "review", hint: "Les décaissements de structure pèsent sur la trésorerie au moment où ils tombent : étalez ou décalez ce qui peut l'être pour lisser les sorties de caisse." },
    ],
  },
  {
    code: "boutique_t3_soldes",
    category: "decision_strategique",
    title: "Solder, ou garder pour l'an prochain",
    narrative:
      "Il reste 400 pulls col rond de la collection de printemps, achetés 25 € l'unité et affichés 59 €. Ils ne partiront plus au tarif plein. Un déstockeur en offre 30 € l'unité, tout de suite. Accepter, c'est décider une démarque ; refuser, c'est occuper une réserve jusqu'au printemps prochain, quand la collection aura tourné.",
    problem:
      "Vendre à 30 € une pièce payée 25 €, est-ce une bonne affaire ou une perte ?",
    diagnosticOptions: [
      {
        id: "engage",
        label: "Les 25 € sont déjà payés : ils ne changent plus rien à la décision d'aujourd'hui",
        correct: true,
      },
      {
        id: "comparer_alternatives",
        label: "La vraie comparaison est entre 30 € maintenant et ce que la pièce rapportera plus tard, si elle part",
        correct: true,
      },
      {
        id: "rotation",
        label:
          "Le mètre de linéaire qu'ils occupent porterait les écharpes et les bonnets de l'hiver, qui tourneront deux fois d'ici le printemps",
        correct: true,
      },
      {
        id: "sous_prix_achat",
        label: "Vendre au-dessus du prix d'achat garantit que l'opération est rentable",
        correct: false,
      },
      {
        id: "jamais_perte",
        label: "Il ne faut jamais vendre en dessous du prix affiché : cela dévalorise la marque",
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
          { id: "c", label: "Être réparti sur les autres références de la collection" },
          { id: "d", label: "Être ajouté au coût variable de la vente" },
        ],
        correctOptionId: "a",
        explain:
          "Les 25 € sont sortis de la caisse il y a des mois, quelle que soit votre décision d'aujourd'hui. Vouloir les « récupérer » conduit à refuser 30 € et à finir avec zéro.",
      },
      {
        id: "boutique_demarque",
        prompt:
          "Solder ces 400 pulls à 30 € au lieu des 59 € affichés : que représente cette démarque ?",
        options: [
          {
            id: "a",
            label:
              "11 600 €, soit 29 € par pull sur les 400, une démarque connue parce qu'elle est décidée",
          },
          { id: "b", label: "10 000 €, le prix d'achat des pulls concernés" },
          { id: "c", label: "Aucune : la vente se fait au-dessus du prix d'achat" },
          { id: "d", label: "23 600 €, le chiffre d'affaires que ces pulls auraient dû faire" },
        ],
        correctOptionId: "a",
        explain:
          "La démarque est ce qui sort du stock sans passer en caisse au prix prévu : 29 €, soit 59 − 30, sur chacun des 400 pulls, donc 11 600 € rapportés aux 23 600 € qu'ils valaient en rayon, soit 11 600 ÷ 23 600 ≈ 49 %. Elle est CONNUE parce qu'on la décide, à la différence du vol et de la casse, qui se découvrent à l'inventaire.",
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
      "Le prix d'achat de 25 € a été payé il y a des mois. Refuser 30 € ne vous les rendra pas.",
      "Les deux options réelles sont : 30 € tout de suite, ou une vente incertaine dans un an, place occupée entre-temps.",
      "Un coût déjà engagé ne doit jamais entrer dans un arbitrage : il est le même quelle que soit l'option retenue.",
      "Comparez les seuls flux que la décision modifie : 30 € encaissés contre une réserve libérée. Et regardez la rotation, qui est l'argument du commerçant : un pull qui dort une saison entière est un emplacement qui n'a rien vendu, alors que les accessoires de l'hiver y tourneraient.",
    ]),
    trigger: { round: 3 },
    weight: 1,
    decisionLevers: [
      { field: "price", direction: "down", hint: "Baisser le prix des invendus libère de la trésorerie et de l'espace en réserve : le coût d'achat est engagé, seul l'encaissement futur compte encore." },
      { field: "productionPlan", direction: "review", hint: "La place libérée par le déstockage accueille les références de l'hiver, qui tourneront : pensez rotation du stock, pas récupération du coût d'achat." },
    ],
  },
  {
    code: "boutique_t6_capitaux",
    category: "decision_strategique",
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
        label: "Les achats de la collection de Noël se paient aux façonniers avant que Noël ne rapporte quoi que ce soit",
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
          { id: "b", label: "Augmenter la marge dégagée sur chaque pièce" },
          { id: "c", label: "Réduire les charges de structure" },
          { id: "d", label: "Allonger le crédit obtenu des façonniers" },
        ],
        correctOptionId: "a",
        explain:
          "Le même euro de stock sert plusieurs fois dans l'année au lieu d'une. La marge unitaire ne bouge pas, mais les capitaux nécessaires pour la dégager, si — et un bonnet tourne plus vite qu'un pull mérinos.",
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
      "Les commandes de la saison forte se paient aux façonniers avant que les clientes n'aient acheté quoi que ce soit.",
      "Placez sur une ligne les encaissements attendus, sur une autre les décaissements, à la date où l'argent bouge réellement.",
      "Le solde cumulé de ces deux lignes, mois après mois, est le budget de trésorerie. Son point le plus bas est votre besoin de financement.",
      "Un résultat prévisionnel positif ne dit rien du mois où vous manquerez de caisse : seul le budget de trésorerie le montre.",
    ]),
    trigger: { round: 6 },
    weight: 1,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "La commande de la prochaine collection est le premier décaissement à projeter : son montant et son calendrier déterminent combien de trésorerie doit rester disponible." },
      { field: "maintenanceBudget", direction: "review", hint: "Les charges de structure tombent chaque mois, que la boutique vende ou non : intégrez-les au budget de trésorerie pour repérer les mois tendus avant d'y être." },
    ],
  },
  {
    code: "boutique_detect_idle_cash",
    category: "tresorerie_dormante",
    title: "La caisse pleine d'après-soldes",
    narrative:
      "Les soldes ont vidé la réserve et rempli le compte : vous détenez plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an. Il facture par ailleurs votre découvert 13 %. La collection d'automne, elle, se commande aux façonniers dans quelques semaines et se paie avant d'être vendue.",
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
          { id: "a", label: "Ouvrir un découvert à 13 % tout en détenant un placement à 2 %" },
          { id: "b", label: "Perdre le capital placé si le trimestre est mauvais" },
          { id: "c", label: "Un redressement fiscal sur les produits financiers" },
          { id: "d", label: "Une baisse mécanique de son chiffre d'affaires" },
        ],
        correctOptionId: "a",
        explain:
          "Le placement est bloqué : il ne paie rien pendant le tour. Si les décaissements dépassent ce qui reste en caisse, la banque ouvre un découvert, et vous payez d'un côté six fois et demie ce que vous gagnez de l'autre.",
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
      "Projetez surtout la commande de la collection suivante : elle se paie aux façonniers avant qu'une seule pièce ne soit vendue.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte six fois et demie ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ]),
    trigger: { detect: "idle_cash" },
    weight: 0.8,
    decisionLevers: [
      { field: "productionPlan", direction: "review", hint: "La commande de la collection suivante va ponctionner la caisse : chiffrez-la avant de décider combien placer, pour ne pas financer un placement à 2 % par un découvert à 13 %." },
      { field: "maintenanceBudget", direction: "review", hint: "Les charges fixes du trimestre à venir sortiront quoi qu'il arrive : soustrayez-les du solde disponible avant d'envisager un placement." },
    ],
  },
];

/** Pourquoi le modèle pertinent est le bon outil — correction du débriefing. */
const MODEL_EXPLAIN: Record<string, string> = {
  boutique_detect_idle_cash:
    "Le budget de trésorerie projette les décaissements du tour à venir, la commande de collection comprise. Seul lui dit quelle part du solde peut être bloquée sans risquer le découvert.",
  boutique_t3_soldes:
    "L'analyse des coûts pertinents écarte les 25 € déjà payés, qui sont les mêmes quelle que soit la décision, et ne garde que ce que le choix d'aujourd'hui change encore.",
  boutique_t6_capitaux:
    "Le budget de trésorerie place chaque flux à la date où l'argent bouge, et non à celle de la vente. C'est le seul document qui montre le mois où la caisse manquera.",
  boutique_t1_reprise:
    "Le seuil de rentabilité répond exactement à la question posée : combien de pièces faut-il vendre, et à quelle marge moyenne, pour ne plus perdre d'argent ?",
  boutique_t2_circuit:
    "Trois offres, quatre critères hétérogènes : c'est le cas d'école de la matrice multicritère. Le seuil de rentabilité, lui, ne sait pas comparer une image de marque à un délai de paiement.",
  boutique_t4_noel:
    "L'analyse de capacité, croisée avec la saisonnalité de chaque référence, dimensionne un réassort qui anticipe le pic au lieu de le subir, et classe les références quand la réserve ne suffit plus.",
  boutique_t5_coton:
    "L'élasticité-prix dit ce que coûte en volume chaque point de hausse répercuté : c'est le seul outil qui arbitre entre marge unitaire et quantités, référence par référence.",
  boutique_detect_below_breakeven:
    "Le seuil de rentabilité chiffre l'écart en pièces et désigne les leviers : marge unitaire, volumes, charges de structure — et le mix, qui déplace la marge moyenne.",
  boutique_detect_profitable_illiquid:
    "L'analyse FRNG / BFR est l'outil de ce diagnostic : TN = FRNG − BFR, et c'est le BFR qui a bougé, pas le résultat.",
};

attachModelQuestions(BOUTIQUE_SITUATIONS, MODEL_EXPLAIN);
