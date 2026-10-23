/**
 * LE PLAN DE COMPTES DU COURS.
 *
 * Un extrait du plan comptable général (PCG) : les comptes qu'un chapitre peut
 * demander, et quelques voisins qu'un élève peut raisonnablement proposer. Un
 * compte absent de cette liste n'est pas « faux » dans l'absolu, il n'est pas
 * attendu dans le cours : le correcteur le dit en ces termes.
 *
 * La NATURE d'un compte décide de sa place : un compte d'actif ou de passif va
 * au bilan, une charge ou un produit au compte de résultat. Les comptes de TVA
 * sont des comptes de tiers : leur solde net est une créance sur l'État (actif)
 * ou une dette envers lui (passif).
 */

export type NatureDeCompte = "actif" | "passif" | "charge" | "produit" | "tva" | "tresorerie";

export interface Compte {
  numero: string;
  intitule: string;
  nature: NatureDeCompte;
}

export const PLAN_DU_COURS: readonly Compte[] = [
  // Classe 1 : capitaux
  { numero: "101", intitule: "Capital", nature: "passif" },
  { numero: "108", intitule: "Compte de l'exploitant", nature: "passif" },
  { numero: "164", intitule: "Emprunts auprès des établissements de crédit", nature: "passif" },
  { numero: "1641", intitule: "Emprunts bancaires", nature: "passif" },
  // Classe 2 : immobilisations
  { numero: "213", intitule: "Constructions", nature: "actif" },
  { numero: "2135", intitule: "Installations générales, agencements des constructions", nature: "actif" },
  { numero: "215", intitule: "Installations techniques, matériel et outillage", nature: "actif" },
  { numero: "2154", intitule: "Matériel industriel", nature: "actif" },
  { numero: "2155", intitule: "Outillage industriel", nature: "actif" },
  { numero: "218", intitule: "Autres immobilisations corporelles", nature: "actif" },
  { numero: "2181", intitule: "Installations générales, agencements divers", nature: "actif" },
  { numero: "2182", intitule: "Matériel de transport", nature: "actif" },
  { numero: "2183", intitule: "Matériel de bureau et informatique", nature: "actif" },
  { numero: "2184", intitule: "Mobilier", nature: "actif" },
  // Classe 4 : tiers
  { numero: "401", intitule: "Fournisseurs", nature: "passif" },
  { numero: "404", intitule: "Fournisseurs d'immobilisations", nature: "passif" },
  { numero: "411", intitule: "Clients", nature: "actif" },
  { numero: "421", intitule: "Personnel, rémunérations dues", nature: "passif" },
  { numero: "425", intitule: "Personnel, avances et acomptes", nature: "actif" },
  { numero: "431", intitule: "Sécurité sociale", nature: "passif" },
  { numero: "437", intitule: "Autres organismes sociaux", nature: "passif" },
  { numero: "442", intitule: "État, impôts et taxes recouvrables sur des tiers", nature: "passif" },
  { numero: "44562", intitule: "TVA déductible sur immobilisations", nature: "tva" },
  { numero: "44566", intitule: "TVA déductible sur autres biens et services", nature: "tva" },
  { numero: "44571", intitule: "TVA collectée", nature: "tva" },
  { numero: "44551", intitule: "TVA à décaisser", nature: "tva" },
  // Classe 5 : trésorerie
  { numero: "512", intitule: "Banque", nature: "tresorerie" },
  { numero: "530", intitule: "Caisse", nature: "tresorerie" },
  // Classe 6 : charges
  { numero: "601", intitule: "Achats de matières premières", nature: "charge" },
  { numero: "602", intitule: "Achats d'autres approvisionnements", nature: "charge" },
  { numero: "604", intitule: "Achats d'études et prestations de services", nature: "charge" },
  { numero: "606", intitule: "Achats non stockés de matières et fournitures", nature: "charge" },
  { numero: "6061", intitule: "Fournitures non stockables (eau, énergie, carburant)", nature: "charge" },
  { numero: "6063", intitule: "Fournitures d'entretien et de petit équipement", nature: "charge" },
  { numero: "607", intitule: "Achats de marchandises", nature: "charge" },
  { numero: "613", intitule: "Locations", nature: "charge" },
  { numero: "6132", intitule: "Locations immobilières", nature: "charge" },
  { numero: "641", intitule: "Rémunérations du personnel", nature: "charge" },
  { numero: "645", intitule: "Charges de sécurité sociale et de prévoyance", nature: "charge" },
  { numero: "661", intitule: "Charges d'intérêts", nature: "charge" },
  { numero: "6611", intitule: "Intérêts des emprunts et dettes", nature: "charge" },
  { numero: "681", intitule: "Dotations aux amortissements", nature: "charge" },
  // Classe 7 : produits
  { numero: "701", intitule: "Ventes de produits finis", nature: "produit" },
  { numero: "704", intitule: "Travaux", nature: "produit" },
  { numero: "706", intitule: "Prestations de services", nature: "produit" },
  { numero: "707", intitule: "Ventes de marchandises", nature: "produit" },
];

const PAR_NUMERO = new Map(PLAN_DU_COURS.map((c) => [c.numero, c]));

export const compteDuPlan = (numero: string): Compte | undefined => PAR_NUMERO.get(numero.trim());

/** L'intitulé d'un compte, ou le numéro seul s'il n'est pas au plan du cours. */
export const intituleDe = (numero: string) => compteDuPlan(numero)?.intitule ?? numero;

/** Ce que la classe d'un compte (son premier chiffre) range. */
export const CLASSES: Record<string, string> = {
  "1": "les capitaux (apports, emprunts)",
  "2": "les immobilisations",
  "3": "les stocks",
  "4": "les tiers (clients, fournisseurs, État)",
  "5": "la trésorerie",
  "6": "les charges",
  "7": "les produits",
};

/** Deux comptes de la même famille : même classe et même chapitre (deux premiers chiffres). */
export const memeFamille = (a: string, b: string) => a.trim().slice(0, 2) === b.trim().slice(0, 2);
