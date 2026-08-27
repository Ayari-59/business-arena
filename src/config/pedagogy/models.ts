/**
 * Référentiel des 18 modèles d'aide à la décision du MVP (doc 03 §3, §6).
 * La compétence centrale du produit : « quel modèle pour comprendre et
 * résoudre CE problème ? » (§7).
 */

export interface DecisionModelDef {
  code: string;
  name: string;
  description: string;
  objective: string;
  difficulty: number; // 1..6
  conceptCodes: string[];
}

export const DECISION_MODELS: DecisionModelDef[] = [
  { code: "elasticity_analysis", name: "Analyse de l'élasticité", difficulty: 2,
    description: "Mesurer la réaction de la demande à une variation de prix, segment par segment.",
    objective: "Choisir un prix en connaissant la sensibilité réelle des clients.",
    conceptCodes: ["price_elasticity", "demand_market_share", "segmentation"] },
  { code: "psych_pricing", name: "Prix psychologique", difficulty: 1,
    description: "Positionner le prix par rapport aux seuils perçus par les clients.",
    objective: "Éviter de franchir un seuil symbolique qui fait décrocher la demande.",
    conceptCodes: ["psych_price", "revenue"] },
  { code: "cvp_analysis", name: "Analyse coût-volume-profit", difficulty: 2,
    description: "Relier prix, volume, coûts variables et fixes pour prévoir le résultat.",
    objective: "Simuler l'effet d'une décision de prix ou de volume sur le profit.",
    conceptCodes: ["contribution_margin", "fixed_costs", "variable_costs", "revenue"] },
  { code: "breakeven_analysis", name: "Seuil de rentabilité", difficulty: 1,
    description: "Calculer le volume ou le CA à partir duquel l'activité devient bénéficiaire.",
    objective: "Savoir combien il faut vendre pour ne plus perdre d'argent.",
    conceptCodes: ["breakeven", "dead_point", "safety_margin", "contribution_margin", "fixed_costs"] },
  { code: "marginal_analysis", name: "Analyse marginale", difficulty: 3,
    description: "Raisonner sur la dernière unité : que rapporte-t-elle, que coûte-t-elle ?",
    objective: "Décider d'accepter ou non un volume supplémentaire.",
    conceptCodes: ["variable_costs", "contribution_margin"] },
  { code: "relevant_costs", name: "Analyse des coûts pertinents", difficulty: 3,
    description: "Ne compter que les coûts et recettes qui CHANGENT avec la décision.",
    objective: "Éviter le piège du coût complet sur les décisions ponctuelles (commande exceptionnelle).",
    conceptCodes: ["variable_costs", "fixed_costs", "contribution_margin"] },
  { code: "frng_bfr_analysis", name: "Analyse FRNG / BFR", difficulty: 3,
    description: "Décomposer la trésorerie en équilibre stable (FRNG) et besoin du cycle (BFR).",
    objective: "Comprendre pourquoi la trésorerie se dégrade alors que l'activité va bien.",
    conceptCodes: ["frng", "bfr", "net_treasury"] },
  { code: "cash_budget", name: "Budget de trésorerie", difficulty: 3,
    description: "Prévoir mois par mois les encaissements et décaissements.",
    objective: "Anticiper les impasses de trésorerie avant qu'elles n'arrivent.",
    conceptCodes: ["net_treasury", "bfr"] },
  { code: "variance_analysis", name: "Analyse des écarts", difficulty: 4,
    description: "Décomposer l'écart entre prévu et réalisé en effets prix, volume et coût.",
    objective: "Savoir POURQUOI le résultat diffère de la prévision.",
    conceptCodes: ["revenue", "variable_costs"] },
  { code: "multicriteria_matrix", name: "Matrice multicritère", difficulty: 2,
    description: "Noter des options sur plusieurs critères pondérés.",
    objective: "Structurer un choix quand aucun critère unique ne suffit.",
    conceptCodes: [] },
  { code: "sensitivity_analysis", name: "Analyse de sensibilité", difficulty: 4,
    description: "Faire varier une hypothèse et mesurer l'impact sur le résultat.",
    objective: "Identifier les hypothèses qui font vraiment basculer la décision.",
    conceptCodes: ["safety_margin"] },
  { code: "scenarios_method", name: "Méthode des scénarios", difficulty: 4,
    description: "Chiffrer des futurs contrastés (optimiste / central / pessimiste).",
    objective: "Décider en univers incertain sans parier sur une seule prévision.",
    conceptCodes: [] },
  { code: "npv", name: "VAN (valeur actuelle nette)", difficulty: 5,
    description: "Actualiser les flux futurs d'un investissement et les comparer au coût initial.",
    objective: "Dire si un investissement crée ou détruit de la valeur.",
    conceptCodes: ["profitability_vs_return"] },
  { code: "irr", name: "TRI (taux de rentabilité interne)", difficulty: 5,
    description: "Trouver le taux d'actualisation qui annule la VAN.",
    objective: "Comparer le rendement d'un projet au coût du financement.",
    conceptCodes: ["profitability_vs_return"] },
  { code: "decision_tree", name: "Arbre de décision", difficulty: 4,
    description: "Représenter décisions et aléas en branches avec probabilités et gains.",
    objective: "Choisir la branche à meilleure espérance quand le hasard s'en mêle.",
    conceptCodes: [] },
  { code: "return_analysis", name: "Analyse de rentabilité", difficulty: 4,
    description: "Rapporter le résultat aux capitaux engagés (économique) et aux capitaux propres (financière).",
    objective: "Juger la performance par rapport aux moyens, pas au montant brut.",
    conceptCodes: ["profitability_vs_return"] },
  { code: "productivity_analysis", name: "Analyse de productivité", difficulty: 3,
    description: "Mesurer la production par unité de ressource et son évolution.",
    objective: "Détecter les gisements d'efficacité de l'outil de production.",
    conceptCodes: ["productivity", "capacity"] },
  { code: "capacity_analysis", name: "Analyse de capacité", difficulty: 2,
    description: "Confronter la demande prévisible aux capacités machine et main-d'œuvre.",
    objective: "Dimensionner production, stocks et investissements avant les pics.",
    conceptCodes: ["capacity", "stock", "seasonality"] },
];

export const modelByCode = new Map(DECISION_MODELS.map((m) => [m.code, m]));
