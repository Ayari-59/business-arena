/**
 * Référentiel des 20 concepts du MVP (doc 03 §2) — données, pas code.
 * Chaque concept a 3 profondeurs d'explication (intuition / méthode / formel)
 * et un axe de compétence pour le profil joueur (§28).
 */

export type ConceptDomain =
  | "market"
  | "commercial"
  | "costs"
  | "margins"
  | "thresholds"
  | "production"
  | "finance"
  | "profitability";

export type SkillAxis =
  | "finance"
  | "marketing"
  | "production"
  | "analysis"
  | "strategy"
  | "decision"
  | "risk";

export interface ConceptDef {
  code: string;
  name: string;
  domain: ConceptDomain;
  axis: SkillAxis;
  definition: string;
  intuition: string;
  method: string;
  formula?: string;
}

export const CONCEPTS: ConceptDef[] = [
  {
    code: "demand_market_share",
    name: "Demande et part de marché",
    domain: "market",
    axis: "marketing",
    definition: "La demande est la quantité que le marché veut acheter ; votre part de marché est la fraction que vous en captez.",
    intuition: "Le gâteau (la demande) et votre part du gâteau sont deux choses différentes : le gâteau peut grossir pendant que votre part rétrécit.",
    method: "Comparez l'évolution de la demande totale du segment et celle de vos ventes : si le marché croît plus vite que vous, vous perdez du terrain.",
    formula: "Part de marché = vos ventes / demande totale du marché",
  },
  {
    code: "price_elasticity",
    name: "Élasticité-prix",
    domain: "market",
    axis: "marketing",
    definition: "Sensibilité de la demande à une variation de prix.",
    intuition: "Baisser le prix de 10 % peut faire gagner 25 % de clients (segment élastique)… ou presque rien (segment rigide). Tous les clients ne réagissent pas pareil.",
    method: "Testez de petites variations de prix et observez la variation des ventes segment par segment.",
    formula: "e = (ΔQ/Q) / (ΔP/P) — e < −1 : demande élastique",
  },
  {
    code: "psych_price",
    name: "Prix psychologique",
    domain: "market",
    axis: "marketing",
    definition: "Seuils de prix perçus par les clients : 59,90 € n'est pas 60 €.",
    intuition: "La perception du prix n'est pas linéaire : franchir un seuil symbolique fait décrocher la demande plus que l'écart ne le justifie. Un prix trop bas peut aussi inquiéter.",
    method: "Repérez les seuils (50 €, 60 €, 100 €…) et positionnez-vous juste en dessous quand la marge le permet.",
  },
  {
    code: "seasonality",
    name: "Saisonnalité",
    domain: "market",
    axis: "analysis",
    definition: "Variations régulières de la demande selon la période (fêtes, rentrée…).",
    intuition: "Si le pic de demande arrive au tour 4, c'est au tour 3 qu'il faut produire : après, il est trop tard.",
    method: "Lisez les coefficients saisonniers, anticipez la production et les stocks un tour avant le pic.",
  },
  {
    code: "revenue",
    name: "Chiffre d'affaires (prix × volume)",
    domain: "commercial",
    axis: "marketing",
    definition: "Total des ventes valorisées au prix de vente.",
    intuition: "Le CA peut monter alors que la rentabilité baisse : vendre plus en gagnant moins par unité n'est pas toujours un progrès.",
    method: "Décomposez toujours une variation de CA en effet prix et effet volume.",
    formula: "CA = prix × quantités vendues",
  },
  {
    code: "segmentation",
    name: "Segmentation",
    domain: "commercial",
    axis: "marketing",
    definition: "Découpage du marché en groupes de clients aux comportements homogènes.",
    intuition: "Un étudiant et un passionné n'achètent pas la même chose au même prix : un seul prix pour tous, c'est un compromis qui déçoit tout le monde.",
    method: "Analysez vos ventes segment par segment, jamais en masse globale.",
  },
  {
    code: "fixed_costs",
    name: "Coûts fixes",
    domain: "costs",
    axis: "finance",
    definition: "Charges indépendantes du volume produit (loyer, salaires de structure, amortissements).",
    intuition: "Que vous vendiez 0 ou 5 000 enceintes, le loyer tombe. C'est un tapis roulant : il faut vendre assez chaque période juste pour le payer.",
    method: "Isolez les charges qui ne bougent pas quand le volume bouge.",
  },
  {
    code: "variable_costs",
    name: "Coûts variables",
    domain: "costs",
    axis: "finance",
    definition: "Charges proportionnelles au volume (matières, main-d'œuvre directe, énergie).",
    intuition: "Chaque unité produite « emporte » son coût : produire plus coûte plus, produire moins soulage immédiatement.",
    method: "Calculez le coût variable unitaire : c'est le plancher absolu de votre prix de vente durable.",
  },
  {
    code: "contribution_margin",
    name: "Marge sur coût variable",
    domain: "margins",
    axis: "finance",
    definition: "Ce que chaque unité vendue laisse pour couvrir les coûts fixes, puis dégager un profit.",
    intuition: "À 59 € avec 38 € de coût variable, chaque enceinte « contribue » pour 21 € : les 4 571 premières paient la structure, les suivantes font le bénéfice.",
    method: "MCV unitaire = prix − coût variable unitaire ; MCV totale = MCV unitaire × volume.",
    formula: "MCV = CA − coûts variables ; taux de MCV = MCV / CA",
  },
  {
    code: "margin_rates",
    name: "Taux de marge et taux de marque",
    domain: "margins",
    axis: "finance",
    definition: "Deux façons d'exprimer la même marge : rapportée au coût (marge) ou au prix (marque).",
    intuition: "Une marge de 21 € sur 38 € de coût, c'est 55 % de taux de marge mais 36 % de taux de marque : attention à qui parle de quoi.",
    method: "Précisez toujours le dénominateur avant de comparer des « pourcentages de marge ».",
    formula: "Taux de marge = marge/coût ; taux de marque = marge/prix",
  },
  {
    code: "breakeven",
    name: "Seuil de rentabilité",
    domain: "thresholds",
    axis: "finance",
    definition: "Niveau d'activité à partir duquel l'entreprise ne perd plus d'argent.",
    intuition: "C'est la ligne de flottaison : en dessous, chaque période creuse la perte ; au-dessus, chaque vente supplémentaire devient du bénéfice net de coûts variables.",
    method: "Divisez les coûts fixes par la marge sur coût variable unitaire.",
    formula: "SR (volume) = coûts fixes / MCV unitaire ; SR (valeur) = coûts fixes / taux de MCV",
  },
  {
    code: "dead_point",
    name: "Point mort",
    domain: "thresholds",
    axis: "finance",
    definition: "Date à laquelle le seuil de rentabilité est atteint dans la période.",
    intuition: "« À partir du 20 novembre, on travaille pour nous » : le point mort traduit le seuil en jours de calendrier.",
    method: "Point mort = (SR en valeur / CA) × durée de la période.",
  },
  {
    code: "safety_margin",
    name: "Marge de sécurité",
    domain: "thresholds",
    axis: "risk",
    definition: "Ce que le CA peut perdre avant de repasser sous le seuil de rentabilité.",
    intuition: "C'est votre coussin : une marge de sécurité de 8 % signifie qu'une baisse de 8 % des ventes vous met dans le rouge.",
    method: "Marge de sécurité = CA − seuil de rentabilité ; indice = marge / CA.",
  },
  {
    code: "capacity",
    name: "Capacité et taux d'utilisation",
    domain: "production",
    axis: "production",
    definition: "Volume maximal productible et proportion réellement utilisée.",
    intuition: "On ne vend pas ce qu'on n'a pas produit : une demande record ne sert à rien si l'atelier plafonne. Et une usine à 40 % paie des fixes pour rien.",
    method: "Comparez plan de production, capacité machine × disponibilité, et capacité main-d'œuvre : la plus petite gagne.",
  },
  {
    code: "stock",
    name: "Stocks et rupture",
    domain: "production",
    axis: "production",
    definition: "Réserve de produits entre production et vente ; la rupture est une vente perdue.",
    intuition: "Le stock coûte (il immobilise de l'argent), la rupture coûte plus (client perdu, image dégradée) : tout l'art est entre les deux.",
    method: "Surveillez les ventes manquées par segment et constituez du stock avant les pics saisonniers.",
  },
  {
    code: "productivity",
    name: "Productivité",
    domain: "production",
    axis: "production",
    definition: "Production obtenue par unité de ressource (heure de travail, machine).",
    intuition: "Deux ateliers identiques peuvent produire différemment : maintenance, organisation et climat social font la différence.",
    method: "Suivez unités/heure et disponibilité machine ; une maintenance négligée se paie en pannes.",
  },
  {
    code: "frng",
    name: "FRNG — fonds de roulement",
    domain: "finance",
    axis: "finance",
    definition: "Excédent des ressources stables sur les emplois stables, disponible pour financer le cycle d'exploitation.",
    intuition: "Ce que les capitaux longs (capital + emprunts) laissent une fois les machines et locaux payés : la réserve qui finance le quotidien.",
    method: "FRNG = (capitaux propres + dettes financières) − actif immobilisé net.",
    formula: "FRNG = ressources stables − emplois stables",
  },
  {
    code: "bfr",
    name: "BFR — besoin en fonds de roulement",
    domain: "finance",
    axis: "finance",
    definition: "Argent immobilisé par le cycle d'exploitation : stocks + créances clients − dettes fournisseurs.",
    intuition: "Entre le moment où vous payez vos fournisseurs et celui où vos clients vous paient, quelqu'un doit avancer l'argent : c'est vous. Plus vous grandissez, plus l'avance grossit.",
    method: "BFR = stocks + créances clients − dettes fournisseurs. Leviers : délais clients, délais fournisseurs, niveau de stock.",
    formula: "BFR = stocks + créances − dettes d'exploitation",
  },
  {
    code: "net_treasury",
    name: "Trésorerie nette",
    domain: "finance",
    axis: "finance",
    definition: "Ce qui reste du FRNG une fois le BFR financé — le solde disponible en banque.",
    intuition: "On peut être bénéficiaire et à découvert : le résultat est une opinion, la trésorerie est un fait. C'est elle qui fait vivre ou mourir l'entreprise.",
    method: "TN = FRNG − BFR. Si TN < 0 : augmenter le FRNG (capital, emprunt long) ou réduire le BFR (délais, stocks).",
    formula: "Trésorerie nette = FRNG − BFR = disponibilités − concours bancaires",
  },
  {
    code: "profitability_vs_return",
    name: "Profitabilité vs rentabilité",
    domain: "profitability",
    axis: "analysis",
    definition: "La profitabilité rapporte le résultat au CA ; la rentabilité le rapporte aux capitaux engagés.",
    intuition: "Gagner 20 000 € est « bien » ? Cela dépend : avec 100 000 € investis c'est excellent, avec 2 millions c'est médiocre. Le montant seul ne dit rien.",
    method: "Profitabilité = résultat/CA ; rentabilité économique = résultat d'exploitation net d'IS / capitaux engagés ; rentabilité financière = résultat net / capitaux propres.",
  },
];

export const conceptByCode = new Map(CONCEPTS.map((c) => [c.code, c]));
