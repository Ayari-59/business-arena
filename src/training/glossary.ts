import type { GlossaryEntry } from "./types";

/** Game and business concepts glossary */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  // Game Mechanics
  round: {
    id: "round",
    type: "glossary",
    term: "Tour",
    definition: "Une période de temps dans la simulation où vous prenez des décisions commerciales.",
    example: "Au tour 1, vous décidez du prix de vente et du plan de production.",
    category: "game-mechanics",
    relatedTerms: ["decision", "simulation"],
  },
  decision: {
    id: "decision",
    type: "glossary",
    term: "Décision",
    definition: "Action que vous prenez chaque tour : prix, volume produit, budgets, etc.",
    example: "Fixer le prix à 50€ et produire 1 000 unités est une décision.",
    category: "game-mechanics",
    relatedTerms: ["round", "consequence"],
  },
  simulation: {
    id: "simulation",
    type: "glossary",
    term: "Simulation",
    definition: "Le moteur économique qui calcule les résultats de vos décisions.",
    example: "La simulation montre comment votre prix affecte la demande et vos profits.",
    category: "game-mechanics",
    relatedTerms: ["round", "decision"],
  },

  // Market Concepts
  market_segment: {
    id: "market-segment",
    type: "glossary",
    term: "Segment de marché",
    definition: "Un groupe de clients avec des besoins et sensibilités similaires.",
    example: "Les clients haut de gamme sont plus sensibles à la qualité qu'au prix.",
    category: "market",
    relatedTerms: ["demand", "price-elasticity", "market-share"],
  },
  demand: {
    id: "demand",
    type: "glossary",
    term: "Demande",
    definition: "Le nombre d'unités que les clients veulent acheter à un prix donné.",
    example: "À 40€, la demande est 5 000 unités. À 60€, elle tombe à 3 000.",
    category: "market",
    relatedTerms: ["market-segment", "price-elasticity", "revenue"],
  },
  price_elasticity: {
    id: "price-elasticity",
    type: "glossary",
    term: "Élasticité-prix de la demande",
    definition: "La mesure de la sensibilité de la demande à une variation de prix.",
    example: "Si baisse le prix de 10%, la demande monte de 20% : élasticité = -2.",
    category: "market",
    relatedTerms: ["demand", "market-segment", "revenue"],
  },
  market_share: {
    id: "market-share",
    type: "glossary",
    term: "Part de marché",
    definition: "Le pourcentage des ventes totales d'un segment que vous capturez.",
    example: "Si vous vendez 300 unités sur 1 000 vendues totalement : 30% de part.",
    category: "market",
    relatedTerms: ["market-segment", "competition", "demand"],
  },
  competition: {
    id: "competition",
    type: "glossary",
    term: "Concurrence",
    definition: "L'intensité de la rivalité entre entreprises pour les clients.",
    example: "Une concurrence forte = les clients changent facilement de fournisseur.",
    category: "market",
    relatedTerms: ["market-share", "price-elasticity"],
  },

  // Finance Concepts
  revenue: {
    id: "revenue",
    type: "glossary",
    term: "Chiffre d'affaires (CA)",
    definition: "Le total des ventes : Prix × Quantité vendue.",
    example: "Vendre 1 000 unités à 50€ = CA de 50 000€.",
    category: "finance",
    relatedTerms: ["cost", "profit", "margin"],
  },
  variable_cost: {
    id: "variable-cost",
    type: "glossary",
    term: "Coût variable",
    definition: "Un coût qui change proportionnellement avec le volume produit.",
    example: "Les matières premières coûtent 20€ par unité : 100 unités = 2 000€.",
    category: "finance",
    relatedTerms: ["fixed-cost", "cost", "contribution-margin"],
  },
  fixed_cost: {
    id: "fixed-cost",
    type: "glossary",
    term: "Coût fixe",
    definition: "Un coût qui reste le même quel que soit le volume produit.",
    example: "Le loyer de l'usine : 10 000€/mois, peu importe si vous produisez 100 ou 1 000 unités.",
    category: "finance",
    relatedTerms: ["variable-cost", "cost", "breakeven"],
  },
  cost: {
    id: "cost",
    type: "glossary",
    term: "Coût",
    definition: "L'argent dépensé pour produire et vendre : matières, salaires, loyer, etc.",
    example: "Coût total = coûts variables + coûts fixes.",
    category: "finance",
    relatedTerms: ["variable-cost", "fixed-cost", "revenue"],
  },
  profit: {
    id: "profit",
    type: "glossary",
    term: "Bénéfice / Profit",
    definition: "Ce qui reste après avoir soustrait les coûts du chiffre d'affaires.",
    example: "CA 100 000€ - Coûts 60 000€ = Profit 40 000€.",
    category: "finance",
    relatedTerms: ["revenue", "cost", "margin"],
  },
  margin: {
    id: "margin",
    type: "glossary",
    term: "Marge",
    definition: "Le profit par unité vendue : Prix - Coût unitaire.",
    example: "Prix 50€ - Coût 20€ = Marge 30€ par unité.",
    category: "finance",
    relatedTerms: ["profit", "revenue", "contribution-margin"],
  },
  contribution_margin: {
    id: "contribution-margin",
    type: "glossary",
    term: "Marge sur coûts variables",
    definition: "Le profit qui contribue à couvrir les coûts fixes : Prix - Coûts variables.",
    example: "Prix 50€ - Coûts variables 20€ = Contribution 30€.",
    category: "finance",
    relatedTerms: ["margin", "variable-cost", "fixed-cost"],
  },
  breakeven: {
    id: "breakeven",
    type: "glossary",
    term: "Seuil de rentabilité",
    definition: "Le volume ou le CA à partir duquel vous êtes bénéficiaire (résultat = 0).",
    example: "Si vos coûts fixes = 10 000€ et marge = 5€, seuil = 2 000 unités.",
    category: "finance",
    relatedTerms: ["fixed-cost", "contribution-margin", "profit"],
  },
  cash_treasury: {
    id: "cash-treasury",
    type: "glossary",
    term: "Trésorerie",
    definition: "L'argent liquide disponible pour les opérations : solde de banque.",
    example: "Vous avez 50 000€ de trésorerie pour la prochaine semaine.",
    category: "finance",
    relatedTerms: ["bfr", "working-capital"],
  },
  bfr: {
    id: "bfr",
    type: "glossary",
    term: "BFR (Besoin en fonds de roulement)",
    definition: "L'argent immobilisé dans les stocks et créances client.",
    example: "Vous stockez 500 unités (capital gelé) et attendez 15 jours le paiement.",
    category: "finance",
    relatedTerms: ["cash-treasury", "working-capital", "stock"],
  },

  // Production & Quality
  production: {
    id: "production",
    type: "glossary",
    term: "Production",
    definition: "Le nombre d'unités que vous décidez de fabriquer chaque tour.",
    example: "Vous décidez de produire 1 000 unités ce tour.",
    category: "production",
    relatedTerms: ["capacity", "quality", "stock"],
  },
  capacity: {
    id: "capacity",
    type: "glossary",
    term: "Capacité",
    definition: "Le maximum que vous pouvez produire avec votre usine et vos employés.",
    example: "Votre usine peut produire maximum 2 000 unités/tour.",
    category: "production",
    relatedTerms: ["production", "investment", "maintenance"],
  },
  quality: {
    id: "quality",
    type: "glossary",
    term: "Qualité",
    definition: "Le niveau de qualité perçu par les clients, affectant la demande.",
    example: "Investir en qualité attire les clients et augmente les prix acceptés.",
    category: "production",
    relatedTerms: ["production", "demand", "margin"],
  },
  stock: {
    id: "stock",
    type: "glossary",
    term: "Stock",
    definition: "Les unités produites mais non encore vendues.",
    example: "Vous produisez 1 000 unités mais n'en vendez que 800 : stock = 200.",
    category: "production",
    relatedTerms: ["production", "capacity", "bfr"],
  },
  maintenance: {
    id: "maintenance",
    type: "glossary",
    term: "Maintenance",
    definition: "L'entretien de votre usine pour garder une disponibilité machine.",
    example: "Moins vous maintenez, plus les pannes augmentent et la production baisse.",
    category: "production",
    relatedTerms: ["capacity", "production"],
  },

  // HR & Strategy
  salary: {
    id: "salary",
    type: "glossary",
    term: "Salaires",
    definition: "Le coût des employés, à ajuster selon le marché du travail.",
    example: "Payer 2 500€ minimum ou perdre les meilleurs talents à la concurrence.",
    category: "hr",
    relatedTerms: ["employee-retention", "productivity"],
  },
  employee_retention: {
    id: "employee-retention",
    type: "glossary",
    term: "Rétention des employés",
    definition: "Votre capacité à garder les meilleurs employés sans qu'ils partent.",
    example: "Salaires bas = forte attrition = moins de production.",
    category: "hr",
    relatedTerms: ["salary", "productivity"],
  },
  productivity: {
    id: "productivity",
    type: "glossary",
    term: "Productivité",
    definition: "La production par employé : mesure de l'efficacité.",
    example: "10 employés produisant 1 000 unités = productivité de 100 unités/employé.",
    category: "hr",
    relatedTerms: ["employee-retention", "capacity", "production"],
  },

  // Marketing & Brand
  marketing_budget: {
    id: "marketing-budget",
    type: "glossary",
    term: "Budget marketing",
    definition: "L'investissement pour augmenter la demande et l'image de marque.",
    example: "Dépenser 5 000€ en marketing augmente la demande de 10%.",
    category: "marketing",
    relatedTerms: ["demand", "brand-image"],
  },
  brand_image: {
    id: "brand-image",
    type: "glossary",
    term: "Image de marque",
    definition: "La perception des clients et du marché envers votre entreprise.",
    example: "Une bonne image permet de charger un prix plus élevé.",
    category: "marketing",
    relatedTerms: ["marketing-budget", "demand", "quality"],
  },

  // Analysis & Decision Models
  breakeven_analysis: {
    id: "breakeven-analysis",
    type: "glossary",
    term: "Analyse du seuil de rentabilité",
    definition: "Déterminer le volume minimum pour être bénéficiaire.",
    example: "À 30€ de marge, il faut vendre 1 000 unités pour couvrir 30 000€ de coûts fixes.",
    category: "analysis",
    relatedTerms: ["breakeven", "fixed-cost", "contribution-margin"],
  },
  sensitivity_analysis: {
    id: "sensitivity-analysis",
    type: "glossary",
    term: "Analyse de sensibilité",
    definition: "Tester comment le résultat change si une hypothèse varie.",
    example: "« Que se passe-t-il si le coût des matières augmente de 10% ? »",
    category: "analysis",
    relatedTerms: ["scenario", "forecasting"],
  },
  scenario_planning: {
    id: "scenario-planning",
    type: "glossary",
    term: "Planification par scénarios",
    definition: "Préparer des plans pour différents futurs possibles (optimiste/pessimiste).",
    example: "Scénario optimiste : +20% de demande. Pessimiste : -20%.",
    category: "analysis",
    relatedTerms: ["sensitivity-analysis", "forecasting"],
  },
  pricing_strategy: {
    id: "pricing-strategy",
    type: "glossary",
    term: "Stratégie de prix",
    definition: "La décision de quel prix pratiquer en fonction de la concurrence et des coûts.",
    example: "Prix bas = volume, prix haut = marge. À trouver l'équilibre.",
    category: "analysis",
    relatedTerms: ["price-elasticity", "competition", "margin"],
  },
};

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY[id];
}

export function getGlossaryByCategory(category: string): GlossaryEntry[] {
  return Object.values(GLOSSARY).filter((entry) => entry.category === category);
}

export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.toLowerCase();
  return Object.values(GLOSSARY).filter((entry) => entry.term.toLowerCase().includes(q) || entry.definition.toLowerCase().includes(q));
}
