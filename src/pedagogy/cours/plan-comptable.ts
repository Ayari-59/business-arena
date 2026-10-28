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
  { numero: "151", intitule: "Provisions pour risques", nature: "passif" },
  { numero: "1511", intitule: "Provisions pour litiges", nature: "passif" },
  { numero: "164", intitule: "Emprunts auprès des établissements de crédit", nature: "passif" },
  { numero: "1641", intitule: "Emprunts bancaires", nature: "passif" },
  { numero: "1688", intitule: "Intérêts courus sur emprunts", nature: "passif" },
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
  // Classe 3 : stocks
  { numero: "31", intitule: "Matières premières et fournitures", nature: "actif" },
  { numero: "335", intitule: "Travaux en cours", nature: "actif" },
  { numero: "37", intitule: "Stocks de marchandises", nature: "actif" },
  { numero: "370", intitule: "Stocks de marchandises", nature: "actif" },
  // Comptes d'amortissement : en soustraction de l'immobilisation qu'ils suivent.
  { numero: "281", intitule: "Amortissements des immobilisations corporelles", nature: "actif" },
  { numero: "2813", intitule: "Amortissements des constructions", nature: "actif" },
  { numero: "28135", intitule: "Amortissements des installations générales, agencements des constructions", nature: "actif" },
  { numero: "2815", intitule: "Amortissements des installations techniques, matériel et outillage", nature: "actif" },
  { numero: "28154", intitule: "Amortissements du matériel industriel", nature: "actif" },
  { numero: "28155", intitule: "Amortissements de l'outillage industriel", nature: "actif" },
  { numero: "2818", intitule: "Amortissements des autres immobilisations corporelles", nature: "actif" },
  { numero: "28181", intitule: "Amortissements des installations générales, agencements divers", nature: "actif" },
  { numero: "28182", intitule: "Amortissements du matériel de transport", nature: "actif" },
  { numero: "28183", intitule: "Amortissements du matériel de bureau et informatique", nature: "actif" },
  { numero: "28184", intitule: "Amortissements du mobilier", nature: "actif" },
  // Classe 4 : tiers
  { numero: "401", intitule: "Fournisseurs", nature: "passif" },
  { numero: "404", intitule: "Fournisseurs d'immobilisations", nature: "passif" },
  { numero: "408", intitule: "Fournisseurs, factures non parvenues", nature: "passif" },
  { numero: "411", intitule: "Clients", nature: "actif" },
  { numero: "416", intitule: "Clients douteux ou litigieux", nature: "actif" },
  { numero: "418", intitule: "Clients, produits non encore facturés", nature: "actif" },
  { numero: "421", intitule: "Personnel, rémunérations dues", nature: "passif" },
  { numero: "425", intitule: "Personnel, avances et acomptes", nature: "actif" },
  { numero: "431", intitule: "Sécurité sociale", nature: "passif" },
  { numero: "437", intitule: "Autres organismes sociaux", nature: "passif" },
  { numero: "442", intitule: "État, impôts et taxes recouvrables sur des tiers", nature: "passif" },
  { numero: "444", intitule: "État, impôts sur les bénéfices", nature: "passif" },
  { numero: "44562", intitule: "TVA déductible sur immobilisations", nature: "tva" },
  { numero: "44566", intitule: "TVA déductible sur autres biens et services", nature: "tva" },
  { numero: "44586", intitule: "TVA sur factures non parvenues", nature: "tva" },
  { numero: "44571", intitule: "TVA collectée", nature: "tva" },
  { numero: "44587", intitule: "TVA sur factures à établir", nature: "tva" },
  { numero: "44551", intitule: "TVA à décaisser", nature: "tva" },
  { numero: "486", intitule: "Charges constatées d'avance", nature: "actif" },
  { numero: "487", intitule: "Produits constatés d'avance", nature: "passif" },
  // Dépréciations des comptes de tiers : en soustraction des créances qu'elles suivent.
  { numero: "491", intitule: "Dépréciations des comptes de clients", nature: "actif" },
  // Classe 5 : trésorerie (les placements à un an au plus et leurs intérêts courus en sont, comme au bilan fonctionnel)
  { numero: "508", intitule: "Autres valeurs mobilières de placement et créances assimilées", nature: "tresorerie" },
  { numero: "5088", intitule: "Intérêts courus sur placements", nature: "tresorerie" },
  { numero: "512", intitule: "Banque", nature: "tresorerie" },
  { numero: "530", intitule: "Caisse", nature: "tresorerie" },
  // Classe 6 : charges
  { numero: "601", intitule: "Achats de matières premières", nature: "charge" },
  { numero: "602", intitule: "Achats d'autres approvisionnements", nature: "charge" },
  { numero: "604", intitule: "Achats d'études et prestations de services", nature: "charge" },
  { numero: "606", intitule: "Achats non stockés de matières et fournitures", nature: "charge" },
  { numero: "6061", intitule: "Fournitures non stockables (eau, énergie, carburant)", nature: "charge" },
  { numero: "6063", intitule: "Fournitures d'entretien et de petit équipement", nature: "charge" },
  { numero: "603", intitule: "Variations des stocks (approvisionnements et marchandises)", nature: "charge" },
  { numero: "6037", intitule: "Variation des stocks de marchandises", nature: "charge" },
  { numero: "6031", intitule: "Variation des stocks de matières premières et fournitures", nature: "charge" },
  { numero: "607", intitule: "Achats de marchandises", nature: "charge" },
  { numero: "61", intitule: "Services extérieurs (loyer et frais de structure)", nature: "charge" },
  { numero: "613", intitule: "Locations", nature: "charge" },
  { numero: "615", intitule: "Entretien et réparations", nature: "charge" },
  { numero: "616", intitule: "Primes d'assurances", nature: "charge" },
  { numero: "62", intitule: "Autres services extérieurs", nature: "charge" },
  { numero: "622", intitule: "Rémunérations d'intermédiaires et honoraires", nature: "charge" },
  { numero: "623", intitule: "Publicité, publications, relations publiques", nature: "charge" },
  { numero: "64", intitule: "Charges de personnel", nature: "charge" },
  { numero: "6132", intitule: "Locations immobilières", nature: "charge" },
  { numero: "641", intitule: "Rémunérations du personnel", nature: "charge" },
  { numero: "645", intitule: "Charges de sécurité sociale et de prévoyance", nature: "charge" },
  { numero: "654", intitule: "Pertes sur créances irrécouvrables", nature: "charge" },
  { numero: "658", intitule: "Charges diverses de gestion courante", nature: "charge" },
  { numero: "661", intitule: "Charges d'intérêts", nature: "charge" },
  { numero: "665", intitule: "Escomptes accordés", nature: "charge" },
  { numero: "6611", intitule: "Intérêts des emprunts et dettes", nature: "charge" },
  { numero: "681", intitule: "Dotations aux amortissements, dépréciations et provisions", nature: "charge" },
  { numero: "695", intitule: "Impôts sur les bénéfices", nature: "charge" },
  { numero: "6811", intitule: "Dotations aux amortissements des immobilisations incorporelles et corporelles", nature: "charge" },
  { numero: "6815", intitule: "Dotations aux provisions d'exploitation", nature: "charge" },
  { numero: "6817", intitule: "Dotations aux dépréciations des actifs circulants", nature: "charge" },
  // Classe 7 : produits
  { numero: "701", intitule: "Ventes de produits finis", nature: "produit" },
  { numero: "765", intitule: "Escomptes obtenus", nature: "produit" },
  { numero: "764", intitule: "Revenus des valeurs mobilières de placement", nature: "produit" },
  { numero: "7133", intitule: "Variation des en-cours de production de biens", nature: "produit" },
  { numero: "704", intitule: "Travaux", nature: "produit" },
  { numero: "706", intitule: "Prestations de services", nature: "produit" },
  { numero: "707", intitule: "Ventes de marchandises", nature: "produit" },
  // Les réductions accordées après la facture (un avoir pour une remise oubliée, un rabais) :
  // un compte de produits qui se débite, et vient en moins des ventes.
  { numero: "709", intitule: "Rabais, remises et ristournes accordés par l'entreprise", nature: "produit" },
  { numero: "781", intitule: "Reprises sur amortissements, dépréciations et provisions", nature: "produit" },
  { numero: "7815", intitule: "Reprises sur provisions d'exploitation", nature: "produit" },
  { numero: "7817", intitule: "Reprises sur dépréciations des actifs circulants", nature: "produit" },
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
