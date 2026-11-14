import type { RoundDecisions } from "@/engine/types";

/**
 * « LE RESTE, COMME AU TOUR DERNIER » (séance d'essai, P1-8).
 *
 * Au niveau 3, un tour sur téléphone faisait onze étapes de décision : commande, ventes
 * estimées, prix, production, fournisseur, budgets, programmes, équipe, créances,
 * études, note. Mesuré : 20 écrans et 2 000 à 2 700 mots par tour. Décision du
 * propriétaire : mêmes leviers, mais, à partir du tour 2, ceux dont l'équipe garde les
 * valeurs du tour d'avant se replient en une étape, qui se déplie et laisse chacun
 * modifiable. Au tour 1, rien n'est replié : tout est nouveau.
 *
 * Ce qui ne se replie jamais : la commande exceptionnelle (une offre nouvelle à chaque
 * tour), les ventes estimées, le prix et la production (les décisions du tour), la note,
 * et les leviers des niveaux hauts qui engagent l'entreprise (financer, investir,
 * dividende, croissance externe, faire fabriquer).
 */

/** La clé de l'étape qui regroupe les leviers repliés, et sa question. */
export const CLE_DU_RESTE = "reste";
export const QUESTION_DU_RESTE = "Le reste, comme au tour dernier";

/** Le début de la clé des cartes de modules (« Programmes ») : `decision-form.tsx`. */
export const PREFIXE_DES_CARTES_DE_MODULES = "modules-";

type Decisions = Pick<
  RoundDecisions,
  | "supplierChoice"
  | "marketingBudget"
  | "qualityBudget"
  | "maintenanceBudget"
  | "rdBudget"
  | "communicationAxis"
  | "brandMarketingBudget"
  | "hr"
  | "rse"
  | "treasury"
  | "insurance"
  | "studies"
  | "qualityActions"
  | "startedRdActionIds"
  | "stoppedModuleItems"
>;

const egal = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const rien = (x: unknown) =>
  x === undefined ||
  x === null ||
  x === 0 ||
  x === false ||
  (Array.isArray(x) && x.length === 0) ||
  (typeof x === "object" && !Array.isArray(x) && Object.values(x as object).every(rien));

/**
 * Le levier de cette carte garde-t-il, ce tour, la valeur du tour d'avant ? Les leviers
 * qui se reconduisent (fournisseur, budgets, salaires, assurance) se comparent ; ceux
 * d'un seul tour (embauches, escompte, études, programmes) ne gardent rien quand rien
 * n'est engagé.
 */
export function carteInchangee(cle: string, d: Decisions, p: Decisions): boolean {
  if (cle.startsWith(PREFIXE_DES_CARTES_DE_MODULES)) {
    return rien(d.qualityActions) && rien(d.startedRdActionIds) && rien(d.stoppedModuleItems);
  }
  switch (cle) {
    case "fournisseur":
      return (d.supplierChoice ?? "") === (p.supplierChoice ?? "");
    case "budgets":
      return (
        d.marketingBudget === p.marketingBudget &&
        d.qualityBudget === p.qualityBudget &&
        d.maintenanceBudget === p.maintenanceBudget &&
        (d.rdBudget ?? 0) === (p.rdBudget ?? 0)
      );
    case "maintenance":
      return d.maintenanceBudget === p.maintenanceBudget;
    case "communication":
      return egal(d.communicationAxis, p.communicationAxis) && (d.brandMarketingBudget ?? 0) === (p.brandMarketingBudget ?? 0);
    case "rh":
      return (
        !d.hr?.hire &&
        !d.hr?.fire &&
        !d.hr?.trainingBudget &&
        (d.hr?.salaryIndex ?? 1) === (p.hr?.salaryIndex ?? 1)
      );
    case "rse":
      return egal(d.rse, p.rse);
    case "mobilisation":
      return !d.treasury?.discount && !d.treasury?.factoring;
    case "assurance":
      return egal(d.insurance || null, p.insurance || null);
    case "etudes":
      return rien(d.studies);
    default:
      return false;
  }
}

/**
 * LES CARTES À REPLIER ce tour, dans leur ordre. Rien au tour 1, ni sans décision du tour
 * d'avant ; rien non plus quand une seule carte se replierait : une étape pour une
 * étape ne fait rien gagner.
 */
export function cartesARepliser(args: {
  cles: readonly string[];
  tour: number;
  /** Ce que la feuille propose ce tour (la reconduction du tour d'avant). */
  proposees: Decisions;
  /** Ce que l'équipe a joué au tour d'avant ; `null` au tour 1. */
  precedentes: Decisions | null | undefined;
}): string[] {
  if (args.tour < 2 || !args.precedentes) return [];
  const p = args.precedentes;
  const repliees = args.cles.filter((cle) => carteInchangee(cle, args.proposees, p));
  return repliees.length >= 2 ? repliees : [];
}
