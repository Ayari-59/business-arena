import { DIFFICULTY_PRESETS, type DifficultyPreset } from "./difficulty";
import type { EngineScenarioConfig } from "../engine/types";

/**
 * Les leviers de décision d'un tour.
 *
 * Ils étaient jusqu'ici une propriété du formulaire et de lui seul : pour
 * savoir combien de décisions une équipe prend, il fallait ouvrir une partie et
 * compter les champs à l'écran. La présentation du jeu ne pouvait donc rien en
 * dire sans écrire un nombre à la main, qui aurait vieilli au premier niveau
 * retouché.
 *
 * Ce registre nomme chaque levier et dit ce qui l'ouvre. Le formulaire reste
 * seul à décider de la mise en page ; un test vérifie qu'aucun champ de
 * décision n'existe à l'écran sans figurer ici, sans quoi le compte annoncé
 * mentirait sans que rien ne le signale.
 *
 * L'ordre de cette liste est celui du cycle d'exploitation, et c'est celui du
 * formulaire : on vend, on achète, on fait venir les clients, on paie ses
 * équipes, on finance, on se couvre, on s'informe, on prévoit.
 */
export interface LevierDeDecision {
  /** Le `name` du champ dans le formulaire de décision. */
  champ: string;
  nom: string;
  /**
   * Ce qui ouvre le levier : un drapeau du niveau de difficulté, « toujours »
   * quand il est de tous les tours, ou « secteur » quand il dépend d'une offre
   * du scénario (les neuf en proposent, mais rien ne l'impose).
   */
  ouvertPar: keyof DifficultyPreset["decisions"] | "toujours" | "secteur";
  /**
   * Pour un levier « secteur » que seuls certains scénarios offrent : ce que
   * le scénario doit déclarer pour que le levier existe à l'écran. Absent, le
   * levier est compté pour tous les secteurs.
   */
  secteurSi?: (scenario: EngineScenarioConfig) => boolean;
}

export const LEVIERS: readonly LevierDeDecision[] = [
  { champ: "acceptOrder", nom: "Commande exceptionnelle", ouvertPar: "secteur" },
  { champ: "price", nom: "Prix de vente", ouvertPar: "toujours" },
  { champ: "productionPlan", nom: "Volume du tour", ouvertPar: "toujours" },
  { champ: "supplierChoice", nom: "Choix du fournisseur", ouvertPar: "secteur" },
  { champ: "marketingBudget", nom: "Budget marketing", ouvertPar: "toujours" },
  {
    champ: "brandMarketingBudget",
    nom: "Budget de marque",
    ouvertPar: "secteur",
    secteurSi: (s) => Boolean(s.communication) && Boolean(s.products),
  },
  { champ: "communicationAxis", nom: "Axe de communication", ouvertPar: "secteur", secteurSi: (s) => Boolean(s.communication) },
  { champ: "qualityBudget", nom: "Budget qualité", ouvertPar: "quality" },
  { champ: "maintenanceBudget", nom: "Budget maintenance", ouvertPar: "maintenance" },
  { champ: "rdBudget", nom: "Recherche et développement", ouvertPar: "rd" },
  { champ: "hire", nom: "Embauches", ouvertPar: "hr" },
  { champ: "fire", nom: "Départs", ouvertPar: "hr" },
  { champ: "trainingBudget", nom: "Budget formation", ouvertPar: "hr" },
  { champ: "salaryPercent", nom: "Niveau des salaires", ouvertPar: "hr" },
  { champ: "rseBudget", nom: "Budget RSE", ouvertPar: "rse" },
  { champ: "rseInvestment", nom: "Investissement RSE (process propre)", ouvertPar: "rse" },
  { champ: "newLoan", nom: "Nouvel emprunt", ouvertPar: "finance" },
  { champ: "loanRepayment", nom: "Remboursement d'emprunt", ouvertPar: "finance" },
  { champ: "capitalIncrease", nom: "Augmentation de capital", ouvertPar: "finance" },
  { champ: "machineCapacityUnits", nom: "Investissement de capacité", ouvertPar: "investment" },
  { champ: "dividend", nom: "Dividende", ouvertPar: "dividend" },
  { champ: "discount", nom: "Escompte de créances", ouvertPar: "finance" },
  { champ: "factoring", nom: "Affacturage", ouvertPar: "finance" },
  { champ: "placement", nom: "Placement de trésorerie", ouvertPar: "placement" },
  { champ: "insurance", nom: "Couverture d'assurance", ouvertPar: "insurance" },
  { champ: "studyMarket", nom: "Étude de marché", ouvertPar: "secteur" },
  { champ: "studyPrice", nom: "Étude des prix", ouvertPar: "secteur" },
  { champ: "studyFinance", nom: "Étude financière", ouvertPar: "secteur" },
  { champ: "studyProject", nom: "Étude de projet", ouvertPar: "secteur" },
  { champ: "expectedUnits", nom: "Ventes prévues", ouvertPar: "finance" },
  { champ: "expectedCash", nom: "Trésorerie prévue", ouvertPar: "finance" },
];

/**
 * Les leviers ouverts à un niveau donné.
 *
 * Les leviers « secteur » sont comptés : les neuf métiers proposent tous un
 * fournisseur, des études et une commande exceptionnelle. Les compter revient
 * donc à décrire ce qu'une équipe rencontre vraiment, et non un minimum
 * théorique que personne ne joue. Ceux que seuls certains scénarios offrent
 * (la marque, l'axe de communication) ne sont retenus que si le scénario
 * donné les déclare ; sans scénario, ils sont comptés, comme l'étendue.
 */
export function leviersDuNiveau(niveau: number, scenario?: EngineScenarioConfig): LevierDeDecision[] {
  const preset = DIFFICULTY_PRESETS.find((p) => p.level === niveau);
  if (!preset) return [];
  return LEVIERS.filter(
    (l) =>
      (l.ouvertPar === "toujours" ||
        l.ouvertPar === "secteur" ||
        preset.decisions[l.ouvertPar] === true) &&
      (!scenario || !l.secteurSi || l.secteurSi(scenario)),
  );
}

/** Le nombre de décisions par tour, du niveau le plus simple au plus complet. */
export function etendueDesDecisions(): { minimum: number; maximum: number } {
  const comptes = DIFFICULTY_PRESETS.map((p) => leviersDuNiveau(p.level).length);
  return { minimum: Math.min(...comptes), maximum: Math.max(...comptes) };
}
