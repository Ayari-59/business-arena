import { CONCEPTS, type ConceptDef } from "../pedagogy/concepts";

/**
 * DE LA NOTION CITÉE À SA FICHE.
 *
 * Chaque séance nomme ses notions en toutes lettres, comme l'enseignant les
 * dit : « taux de marque et taux de marge », « besoin en fonds de roulement ».
 * Les fiches notions du site les expliquent, mais rien ne reliait les deux :
 * la fiche d'atelier affichait une liste de mots morts, et l'élève qui
 * butait sur l'un d'eux n'avait aucune porte à pousser.
 *
 * Le lien se fait par le sens, pas par un identifiant à recopier dans chaque
 * séance : une table d'alias, du plus précis au plus général, reconnaît la
 * notion dans sa formulation. Une notion qu'aucune fiche ne couvre reste un
 * mot, et c'est visible : une garde veille à ce que chaque séance ouvre au
 * moins une porte.
 */

/** Sans accent, sans casse, sans ponctuation : ce qui reste du sens. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Les formulations que les ateliers emploient, et la fiche qui les couvre.
 * L'ordre importe : la première entrée reconnue gagne, donc les plus précises
 * viennent en tête (« marge sur cout variable » avant « marge »).
 */
const ALIAS: readonly [string, string][] = [
  ["seuil de rentabilite", "breakeven"],
  ["point mort", "dead_point"],
  ["marge de securite", "safety_margin"],
  ["levier operationnel", "operating_leverage"],
  ["marge sur cout variable", "contribution_margin"],
  ["taux de marque", "margin_rates"],
  ["taux de marge", "margin_rates"],
  ["coefficient multiplicateur", "markup_coefficient"],
  ["cout unitaire moyen", "weighted_average_cost"],
  ["cump", "weighted_average_cost"],
  ["cout de revient", "full_unit_cost"],
  ["cout standard", "standard_costing"],
  ["ecart sur", "volume_price_variance"],
  ["ecart entre", "volume_price_variance"],
  ["ecart de prix", "material_price_variance"],
  ["ecart d efficacite", "efficiency_variance"],
  ["ecart", "cost_variance"],
  ["charges de structure", "fixed_costs"],
  ["charges fixes", "fixed_costs"],
  ["charges variables", "variable_costs"],
  ["cout variable", "variable_costs"],
  ["prix d achat", "variable_costs"],
  ["cout d achat", "variable_costs"],
  ["cout d acquisition", "customer_acquisition_cost"],
  ["cac", "customer_acquisition_cost"],
  ["panier moyen", "average_basket"],
  ["taux de transformation", "conversion_rate"],
  ["rotation", "stock_rotation"],
  ["demarque", "markdown"],
  ["remise", "markdown"],
  ["promotion", "markdown"],
  ["solde", "markdown"],
  ["elasticite", "price_elasticity"],
  ["sensibilite au prix", "price_elasticity"],
  ["prix psychologique", "psych_price"],
  ["saison", "seasonality"],
  ["part de marche", "demand_market_share"],
  ["demande", "demand_market_share"],
  ["segment", "segmentation"],
  ["clientele", "segmentation"],
  ["assortiment", "assortment"],
  ["gamme", "assortment"],
  ["taux d occupation", "occupancy_revpar"],
  ["prix moyen", "occupancy_revpar"],
  ["revpar", "occupancy_revpar"],
  ["revenu par chambre", "occupancy_revpar"],
  ["nuitee", "occupancy_revpar"],
  ["taux d utilisation", "capacity"],
  ["capacite", "capacity"],
  ["goulot", "capacity"],
  ["saturation", "capacity"],
  ["productivite", "productivity"],
  ["rupture", "stock"],
  ["invendu", "stock"],
  ["surstock", "stock"],
  ["stock", "stock"],
  ["quantite commandee", "stock"],
  ["approvisionnement", "stock"],
  ["amortissement", "depreciation"],
  ["excedent brut", "ebitda_margin"],
  ["soldes intermediaires", "ebitda_margin"],
  ["fonds de roulement net", "frng"],
  ["besoin en fonds de roulement", "bfr"],
  ["bfr", "bfr"],
  ["fonds de roulement", "frng"],
  ["budget de tresorerie", "cash_budget"],
  ["plan de tresorerie", "cash_budget"],
  ["budget", "cash_budget"],
  ["encaissement", "cash_budget"],
  ["decaissement", "cash_budget"],
  ["delai de reglement", "payment_terms"],
  ["delais de reglement", "payment_terms"],
  ["poste clients", "payment_terms"],
  ["creance", "payment_terms"],
  ["encours", "payment_terms"],
  ["escompte", "receivables_financing"],
  ["affacturage", "receivables_financing"],
  ["mobilisation", "receivables_financing"],
  ["decouvert", "net_treasury"],
  ["tresorerie", "net_treasury"],
  ["tableau d amortissement", "loan_schedule"],
  ["emprunt", "loan_schedule"],
  ["financement", "loan_schedule"],
  ["dettes financieres", "loan_schedule"],
  ["valeur actuelle", "discounting"],
  ["van", "discounting"],
  ["actualisation", "discounting"],
  ["flux de tresorerie", "discounting"],
  ["investissement", "discounting"],
  ["tri", "irr_payback"],
  ["delai de recuperation", "irr_payback"],
  ["retour sur investissement", "irr_payback"],
  ["capacite d autofinancement", "profitability_vs_return"],
  ["rentabilite", "profitability_vs_return"],
  ["rentable", "profitability_vs_return"],
  ["commission", "distribution_commission"],
  ["marketplace", "distribution_commission"],
  ["place de marche", "distribution_commission"],
  ["tva", "vat_payable"],
  ["responsabilite societale", "csr_index"],
  ["rse", "csr_index"],
  ["extra financier", "csr_index"],
  ["empreinte", "csr_index"],
  ["environnement social gouvernance", "csr_index"],
  ["parties prenantes", "csr_index"],
  ["capital de marque", "brand_capital"],
  ["capital d image", "brand_capital"],
  ["effet differe", "brand_capital"],
  ["notoriete", "brand_capital"],
  ["fidelisation", "brand_capital"],
  ["reputation", "brand_capital"],
  ["tableau de bord", "dashboard"],
  ["indicateur", "dashboard"],
  ["compte rendu", "dashboard"],
  ["rendre compte", "dashboard"],
  ["reddition", "dashboard"],
  ["bilan", "balance_sheet"],
  ["actif et passif", "balance_sheet"],
  ["capitaux propres", "balance_sheet"],
  ["compte de resultat", "income_statement"],
  ["resultat", "income_statement"],
  ["chiffre d affaires", "revenue"],
  ["prix de vente", "revenue"],
  ["prix", "revenue"],
  ["volume de ventes", "revenue"],
  ["marge", "contribution_margin"],
  ["cout", "full_unit_cost"],
  ["risque", "operating_leverage"],
  ["prevision", "cash_budget"],
  ["note de gestion", "dashboard"],
  ["rapport de gestion", "dashboard"],
  ["preconisation", "dashboard"],
  ["diagnostic", "balance_sheet"],
  ["evolution", "dashboard"],
  ["performance", "dashboard"],
  ["trajectoire", "dashboard"],
  ["controle de coherence", "income_statement"],
  ["montee en charge", "capacity"],
  ["sous activite", "capacity"],
  ["masse salariale", "fixed_costs"],
  ["recrutement", "fixed_costs"],
  ["placement", "net_treasury"],
  ["reserve", "net_treasury"],
  ["relance", "payment_terms"],
  ["dependance", "segmentation"],
  ["canal", "segmentation"],
  ["trafic", "customer_acquisition_cost"],
  ["valeur d un client", "customer_acquisition_cost"],
  ["base installee", "brand_capital"],
  ["qualite de service", "brand_capital"],
  ["satisfaction", "brand_capital"],
  ["taux de remplissage", "capacity"],
  ["fret", "contribution_margin"],
  ["contrat", "segmentation"],
  ["horizon", "brand_capital"],
  ["sourcing", "full_unit_cost"],
  ["consolidation", "dashboard"],
  ["climat social", "csr_index"],
  ["turnover", "csr_index"],
];

const parCode = new Map(CONCEPTS.map((c) => [c.code, c]));
const nomsNormalises = CONCEPTS.map((c) => ({
  nom: normaliser(c.name),
  concept: c,
}));

/** La fiche qui couvre une notion citée, ou null si aucune ne la porte. */
export function ficheDeNotion(notion: string): ConceptDef | null {
  const n = normaliser(notion);
  if (!n) return null;
  const exact = nomsNormalises.find((c) => c.nom === n);
  if (exact) return exact.concept;
  for (const [cle, code] of ALIAS) {
    if (n.includes(cle)) return parCode.get(code) ?? null;
  }
  return null;
}

/** Les notions d'une séance, chacune avec sa fiche quand elle en a une. */
export function notionsAvecFiche(
  notions: readonly string[],
): { notion: string; fiche: ConceptDef | null }[] {
  return notions.map((notion) => ({ notion, fiche: ficheDeNotion(notion) }));
}
