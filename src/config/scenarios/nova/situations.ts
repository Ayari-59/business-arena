/**
 * Situations pédagogiques de NOVA (doc 03 §1, doc 07 §2).
 *
 * Principe §3 : le joueur rencontre d'abord une SITUATION d'entreprise et une
 * question OUVERTE — jamais « calculez le BFR ». Les indices (5 niveaux,
 * coûts croissants — doc 03 §4) mènent progressivement de l'observation à la
 * méthode. La matrice modelRelevance évalue la compétence « choisir le bon
 * modèle » (§7) : un modèle `misleading` mène au contresens classique.
 */

export type ModelRelevance = "optimal" | "acceptable" | "misleading" | "irrelevant";
export type DetectCode = "profitable_illiquid" | "stockout" | "below_breakeven";

export interface SituationHintDef {
  level: 1 | 2 | 3 | 4 | 5;
  text: string;
  costRatio: number;
}

export interface SituationDef {
  code: string;
  title: string;
  narrative: string;
  problem: string; // question ouverte
  diagnosticOptions: { id: string; label: string; correct: boolean }[];
  modelRelevance: Record<string, ModelRelevance>; // par code de modèle ; absent = irrelevant
  conceptCodes: string[];
  hints: SituationHintDef[];
  trigger: { round: number } | { detect: DetectCode };
  weight: number;
}

/** Coûts standard des 5 niveaux (doc 03 §4) : cumulés = 45 % de score restant. */
const HINT_COSTS = [0.05, 0.1, 0.2, 0.35, 0.55] as const;
const hints = (texts: [string, string, string, string, string]): SituationHintDef[] =>
  texts.map((text, i) => ({ level: (i + 1) as 1 | 2 | 3 | 4 | 5, text, costRatio: HINT_COSTS[i]! }));

export const NOVA_SITUATIONS: SituationDef[] = [
  {
    code: "nova_t1_takeover",
    title: "Prise en main",
    narrative:
      "Vous venez de reprendre NOVA. L'ancien dirigeant vous laisse un atelier, quatre opérateurs, un produit apprécié — et un marché où SoundBox casse les prix pendant qu'Auris vise le haut de gamme.",
    problem:
      "Avant de fixer votre prix et votre production : de quoi votre entreprise a-t-elle besoin chaque période pour ne pas perdre d'argent ?",
    diagnosticOptions: [
      { id: "cover_fixed", label: "Vendre assez d'unités pour couvrir les charges de structure", correct: true },
      { id: "unit_margin", label: "Que chaque unité vendue rapporte plus que son coût variable", correct: true },
      { id: "max_volume", label: "Produire au maximum de la capacité, quoi qu'il arrive", correct: false },
      { id: "lowest_price", label: "Avoir le prix le plus bas du marché", correct: false },
    ],
    modelRelevance: {
      breakeven_analysis: "optimal",
      cvp_analysis: "acceptable",
      psych_pricing: "acceptable",
      npv: "irrelevant",
    },
    conceptCodes: ["revenue", "fixed_costs", "variable_costs", "contribution_margin", "breakeven"],
    hints: hints([
      "Regardez vos charges : certaines tombent chaque période, que vous vendiez ou non.",
      "Combien chaque enceinte vendue laisse-t-elle une fois ses coûts variables payés ?",
      "Il existe un volume de ventes précis à partir duquel vous cessez de perdre de l'argent.",
      "Une analyse du seuil de rentabilité donnerait un objectif chiffré à votre premier trimestre.",
      "Divisez les charges de structure par la marge sur coût variable unitaire (prix − 38 €) : c'est votre seuil en volume.",
    ]),
    trigger: { round: 1 },
    weight: 1,
  },
  {
    code: "nova_t2_price_war",
    title: "Le prix fait la demande",
    narrative:
      "Vos ventes du premier tour sont tombées. Sur le segment étudiant, SoundBox affiche un prix agressif et rafle des parts de marché — pendant que les passionnés, eux, n'ont presque pas bougé.",
    problem:
      "Pourquoi vos segments réagissent-ils si différemment, et comment fixer votre prix pour le prochain tour ?",
    diagnosticOptions: [
      { id: "elastic_students", label: "Les étudiants sont très sensibles au prix, les passionnés beaucoup moins", correct: true },
      { id: "psych_threshold", label: "Certains niveaux de prix (50 €, 60 €) agissent comme des seuils psychologiques", correct: true },
      { id: "quality_drop", label: "Notre qualité s'est effondrée d'un tour à l'autre", correct: false },
      { id: "market_shrink", label: "Le marché total est en train de disparaître", correct: false },
    ],
    modelRelevance: {
      elasticity_analysis: "optimal",
      psych_pricing: "optimal",
      cvp_analysis: "acceptable",
      breakeven_analysis: "acceptable",
      relevant_costs: "irrelevant",
    },
    conceptCodes: ["price_elasticity", "psych_price", "segmentation", "demand_market_share"],
    hints: hints([
      "Comparez la baisse de vos ventes segment par segment : elle n'est pas uniforme.",
      "De combien vos ventes étudiantes ont-elles chuté, pour quel écart de prix avec SoundBox ?",
      "La sensibilité de la demande au prix porte un nom : elle se mesure, segment par segment.",
      "Une analyse d'élasticité — complétée par les seuils de prix psychologiques — éclairerait votre choix.",
      "Testez un prix juste sous un seuil (59,90 plutôt que 60) et estimez e = %ΔQ / %ΔP par segment pour choisir.",
    ]),
    trigger: { round: 2 },
    weight: 1,
  },
  {
    code: "nova_t3_capacity",
    title: "Produire n'est pas vendre",
    narrative:
      "La demande décolle : marketing, croissance du marché… et la chaîne CampusTech vous ouvre ses rayons. Mais l'atelier a plafonné et des clients sont repartis les mains vides.",
    problem:
      "Votre marché demande plus que vous ne produisez. Qu'est-ce qui limite réellement votre production, et que pouvez-vous y faire avant le pic de fin d'année ?",
    diagnosticOptions: [
      { id: "machine_limit", label: "La capacité machine (et sa disponibilité) plafonne la production", correct: true },
      { id: "anticipate_stock", label: "Il faut produire AVANT le pic pour constituer du stock", correct: true },
      { id: "price_too_low", label: "Le prix est trop bas, il suffit de l'augmenter fortement", correct: false },
      { id: "hire_sales", label: "Le problème vient du manque de commerciaux", correct: false },
    ],
    modelRelevance: {
      capacity_analysis: "optimal",
      productivity_analysis: "acceptable",
      cvp_analysis: "acceptable",
      breakeven_analysis: "irrelevant",
      elasticity_analysis: "misleading",
    },
    conceptCodes: ["capacity", "stock", "seasonality", "productivity"],
    hints: hints([
      "Regardez la colonne « Manqué » de votre tableau de marché : ces clients voulaient acheter.",
      "Votre production a-t-elle atteint votre plan… ou votre plafond ?",
      "Capacité machine, disponibilité, main-d'œuvre : la contrainte la plus serrée décide de tout.",
      "Une analyse de capacité, croisée avec la saisonnalité, dirait quoi produire dès maintenant.",
      "Produisez au plafond dès ce tour pour stocker : le pic du tour 4 dépassera largement vos 7 000 unités.",
    ]),
    trigger: { round: 3 },
    weight: 1,
  },
  {
    code: "nova_t4_paradox",
    title: "Le paradoxe du succès",
    narrative:
      "Trimestre record : le pic saisonnier et la grosse commande CampusTech gonflent votre chiffre d'affaires, le résultat est positif… et pourtant votre banquier appelle : le compte vire au rouge.",
    problem:
      "Votre entreprise gagne de l'argent mais n'en a plus en caisse. Identifiez les causes possibles de ce paradoxe.",
    diagnosticOptions: [
      { id: "receivables", label: "CampusTech paie à 80 jours : le CA est devenu des créances, pas du cash", correct: true },
      { id: "bfr_growth", label: "La croissance gonfle le besoin en fonds de roulement plus vite que les ressources", correct: true },
      { id: "fake_profit", label: "Le résultat comptable est faux, il faut le recalculer", correct: false },
      { id: "too_much_marketing", label: "Le budget marketing a vidé la caisse à lui seul", correct: false },
    ],
    modelRelevance: {
      frng_bfr_analysis: "optimal",
      cash_budget: "optimal",
      breakeven_analysis: "misleading",
      return_analysis: "irrelevant",
      cvp_analysis: "irrelevant",
    },
    conceptCodes: ["frng", "bfr", "net_treasury"],
    hints: hints([
      "Examinez ce qui a le plus évolué à votre bilan depuis le tour dernier.",
      "Quel élément du cycle d'exploitation (stocks, créances clients, dettes fournisseurs) a explosé ?",
      "Réfléchissez au financement du cycle d'exploitation : qui avance l'argent entre la vente et l'encaissement ?",
      "Une analyse FRNG / BFR décomposerait votre trésorerie et montrerait où elle est partie.",
      "Calculez le FRNG (ressources stables − immobilisations), puis le BFR (stocks + créances − fournisseurs) : TN = FRNG − BFR. Levier : emprunt, ou négocier les délais.",
    ]),
    trigger: { round: 4 },
    weight: 1.5,
  },
  {
    code: "nova_t5_returns",
    title: "Gagner de l'argent… ou être rentable ?",
    narrative:
      "Le contrecoup saisonnier tasse les ventes et les matières premières ont renchéri de 20 %. En comité, on compare : Auris affiche un résultat plus faible que d'autres — mais avec deux fois moins de capitaux engagés.",
    problem:
      "Entre « gagner beaucoup » et « bien utiliser l'argent investi », comment jugez-vous vraiment une performance ?",
    diagnosticOptions: [
      { id: "relative_to_capital", label: "Un résultat se juge par rapport aux capitaux engagés pour l'obtenir", correct: true },
      { id: "margin_squeeze", label: "La hausse des matières comprime la marge sur coût variable et relève le seuil", correct: true },
      { id: "big_profit_wins", label: "Le plus gros résultat en euros est toujours la meilleure performance", correct: false },
      { id: "cut_all_costs", label: "Il faut couper tous les budgets pour restaurer le résultat", correct: false },
    ],
    modelRelevance: {
      return_analysis: "optimal",
      breakeven_analysis: "acceptable",
      cvp_analysis: "acceptable",
      frng_bfr_analysis: "irrelevant",
      psych_pricing: "irrelevant",
    },
    conceptCodes: ["profitability_vs_return", "contribution_margin", "breakeven", "margin_rates"],
    hints: hints([
      "Deux entreprises, deux résultats, deux tailles de bilan : que compare-t-on vraiment ?",
      "20 000 € de résultat avec 200 000 € investis, est-ce mieux que 30 000 € avec 500 000 € ?",
      "Rapporter le résultat au CA (profitabilité) ou aux capitaux (rentabilité) ne raconte pas la même histoire.",
      "Une analyse de rentabilité (économique et financière) départagerait les performances.",
      "Calculez Re = REX net d'IS / (capitaux propres + dettes) et Rf = résultat net / capitaux propres, et recalculez votre seuil avec le nouveau coût matière.",
    ]),
    trigger: { round: 5 },
    weight: 1,
  },
  {
    code: "nova_t6_final",
    title: "Le grand oral",
    narrative:
      "Dernier tour : votre conseil d'administration attend un cap assumé. Consolider la marge ? Défendre la part de marché ? Reconstituer la trésorerie ? Tout, vous ne pourrez pas.",
    problem:
      "Quel arbitrage final choisissez-vous, et surtout : sur quels critères le défendez-vous ?",
    diagnosticOptions: [
      { id: "explicit_criteria", label: "Un bon arbitrage explicite ses critères et leurs pondérations", correct: true },
      { id: "coherent_story", label: "Les décisions doivent être cohérentes avec le positionnement tenu depuis le début", correct: true },
      { id: "copy_leader", label: "Copier la stratégie du leader du classement suffit", correct: false },
      { id: "last_round_max", label: "Au dernier tour, seul le résultat immédiat compte, peu importe le bilan", correct: false },
    ],
    modelRelevance: {
      multicriteria_matrix: "optimal",
      scenarios_method: "acceptable",
      sensitivity_analysis: "acceptable",
      cvp_analysis: "acceptable",
    },
    conceptCodes: ["profitability_vs_return", "safety_margin", "demand_market_share"],
    hints: hints([
      "Relisez votre trajectoire : où avez-vous gagné, où avez-vous souffert ?",
      "Quels critères comptent pour VOTRE entreprise aujourd'hui : marge, part de marché, trésorerie ?",
      "Quand plusieurs critères se disputent une décision, il faut les pondérer explicitement.",
      "Une matrice multicritère structurerait votre arbitrage final.",
      "Listez 3 options, notez-les de 1 à 5 sur marge / part de marché / trésorerie, pondérez selon votre situation, choisissez la meilleure note pondérée.",
    ]),
    trigger: { round: 6 },
    weight: 1,
  },

  // --- Situations détectées (doc 03 §1.1) -------------------------------
  {
    code: "detect_profitable_illiquid",
    title: "Bénéficiaire… mais à découvert",
    narrative:
      "Vos comptes du tour écoulé affichent un résultat positif — et pourtant votre trésorerie nette est passée dans le rouge.",
    problem: "Comment expliquer qu'une entreprise qui gagne de l'argent se retrouve à découvert ?",
    diagnosticOptions: [
      { id: "cash_vs_profit", label: "Le résultat est comptable ; la trésorerie dépend des encaissements réels", correct: true },
      { id: "bfr_up", label: "Stocks et créances ont absorbé le cash (BFR en hausse)", correct: true },
      { id: "accounting_error", label: "C'est forcément une erreur de calcul", correct: false },
    ],
    modelRelevance: { frng_bfr_analysis: "optimal", cash_budget: "acceptable", breakeven_analysis: "misleading" },
    conceptCodes: ["net_treasury", "bfr", "frng"],
    hints: hints([
      "Comparez l'évolution de votre résultat et celle de votre trésorerie : elles divergent.",
      "Où est passé l'argent des ventes que vous avez pourtant réalisées ?",
      "Vendre n'est pas encaisser : le cycle d'exploitation immobilise des fonds.",
      "L'analyse FRNG / BFR est l'outil de ce diagnostic.",
      "TN = FRNG − BFR : calculez les deux termes et regardez lequel a bougé.",
    ]),
    trigger: { detect: "profitable_illiquid" },
    weight: 1,
  },
  {
    code: "detect_stockout",
    title: "Des clients repartis sans acheter",
    narrative:
      "Au tour écoulé, une part importante de la demande qui vous était adressée n'a pas pu être servie : votre stock était vide.",
    problem: "Que vous coûte réellement une rupture, et comment l'éviter au prochain tour ?",
    diagnosticOptions: [
      { id: "lost_margin", label: "Chaque vente manquée est une marge perdue et un client déçu", correct: true },
      { id: "plan_ahead", label: "Le plan de production doit anticiper la demande, pas la suivre", correct: true },
      { id: "good_sign", label: "Une rupture prouve que tout va bien puisque tout est vendu", correct: false },
    ],
    modelRelevance: { capacity_analysis: "optimal", cvp_analysis: "acceptable", elasticity_analysis: "misleading" },
    conceptCodes: ["stock", "capacity", "seasonality"],
    hints: hints([
      "La colonne « Manqué » de votre marché n'est pas anecdotique ce tour-ci.",
      "Votre production a-t-elle suivi la demande… ou le plan de la période passée ?",
      "Un stock d'anticipation se construit avant que la demande n'arrive.",
      "Une analyse de capacité croisée avec la saisonnalité dimensionnerait votre plan.",
      "Planifiez production = demande prévue × (1 + marge de sécurité) dans la limite de vos capacités, en produisant l'excédent un tour avant le pic.",
    ]),
    trigger: { detect: "stockout" },
    weight: 0.8,
  },
  {
    code: "detect_below_breakeven",
    title: "Sous la ligne de flottaison",
    narrative: "Le tour écoulé s'est soldé par une perte : vos ventes n'ont pas couvert vos charges.",
    problem: "Votre entreprise perd de l'argent. Où se situe le problème : volume, prix, ou coûts ?",
    diagnosticOptions: [
      { id: "under_threshold", label: "Le volume vendu est resté sous le seuil de rentabilité", correct: true },
      { id: "check_margin", label: "Il faut vérifier la marge sur coût variable et le poids des fixes", correct: true },
      { id: "always_lower_price", label: "Baisser le prix augmente toujours le résultat", correct: false },
    ],
    modelRelevance: { breakeven_analysis: "optimal", cvp_analysis: "optimal", frng_bfr_analysis: "irrelevant" },
    conceptCodes: ["breakeven", "contribution_margin", "fixed_costs", "safety_margin"],
    hints: hints([
      "Comparez vos unités vendues à celles qu'il aurait fallu vendre pour équilibrer.",
      "Votre marge unitaire couvre-t-elle, multipliée par vos ventes, vos charges de structure ?",
      "Le seuil de rentabilité donne l'objectif ; la marge sur coût variable, le levier.",
      "Une analyse coût-volume-profit montrerait quel levier (prix, volume, coûts) est le plus efficace.",
      "SR = fixes / (prix − coût variable unitaire) : jouez chaque levier dans la formule et comparez.",
    ]),
    trigger: { detect: "below_breakeven" },
    weight: 0.8,
  },
];

export const situationByCode = new Map(NOVA_SITUATIONS.map((s) => [s.code, s]));
