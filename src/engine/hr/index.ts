import type { EngineScenarioConfig, RoundDecisions } from "../types";

/**
 * Ressources humaines (doc 02 §4.1) : embauches, licenciements, formation et
 * politique salariale. Règles :
 * - les mouvements d'effectif (embauche, licenciement, démission) prennent
 *   effet au tour SUIVANT — le recrutement prend du temps ; les coûts tombent
 *   ce tour (asymétrie pédagogique voulue) ;
 * - seul l'ÉCART de masse salariale est facturé : les salaires de
 *   `includedHeadcount` employés à l'indice 1 sont déjà dans les coûts fixes
 *   du scénario (réduire l'effectif ou l'indice ÉCONOMISE donc des charges) ;
 * - sous-payer dégrade la productivité du tour (morale) et, sous le seuil
 *   d'attrition, provoque une démission par tour ;
 * - la formation élève la productivité du tour suivant, à rendements
 *   décroissants, plafonnée.
 */

type HrConfig = NonNullable<EngineScenarioConfig["hr"]>;
type HrDecisions = NonNullable<RoundDecisions["hr"]>;

export interface HrOutcome {
  /** Multiplicateur de productivité du tour (morale salariale). */
  morale: number;
  /** Charge de structure RH du tour (négatif = économie). */
  cost: number;
  hired: number;
  fired: number;
  departed: number;
  trainingBudget: number;
  salaryIndex: number;
  nextHeadcount: number;
  nextProductivity: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function computeHr(args: {
  config: HrConfig | undefined;
  decisions: HrDecisions | undefined;
  headcount: number;
  productivity: number;
}): HrOutcome {
  const neutral: HrOutcome = {
    morale: 1,
    cost: 0,
    hired: 0,
    fired: 0,
    departed: 0,
    trainingBudget: 0,
    salaryIndex: 1,
    nextHeadcount: args.headcount,
    nextProductivity: args.productivity,
  };
  const c = args.config;
  if (!c) return neutral;

  const d = args.decisions ?? {};
  const salaryIndex = clamp(d.salaryIndex ?? 1, 0.8, 1.3);
  const fired = clamp(Math.floor(d.fire ?? 0), 0, Math.max(0, args.headcount - 1));
  const hired = clamp(
    Math.floor(d.hire ?? 0),
    0,
    Math.min(c.maxHiresPerRound, Math.max(0, c.maxHeadcount - args.headcount + fired)),
  );
  const trainingBudget = Math.max(0, d.trainingBudget ?? 0);

  // Démission : sous le seuil d'attrition, un salarié part chaque tour
  // (jamais en dessous d'un salarié restant, licenciements compris).
  const departed =
    salaryIndex < c.attritionThreshold && args.headcount - fired - 1 >= 1 ? 1 : 0;

  // Masse salariale du tour : écart vs ce que les coûts fixes couvrent déjà.
  const payrollExtra =
    args.headcount * c.salaryPerEmployeePerRound * salaryIndex -
    c.includedHeadcount * c.salaryPerEmployeePerRound;

  const cost =
    payrollExtra + hired * c.hiringCost + fired * c.firingCost + trainingBudget;

  const morale = clamp(1 + c.moraleSensitivity * (salaryIndex - 1), 0.85, 1.12);

  const nextProductivity = Math.min(
    c.maxProductivity,
    args.productivity + c.trainingSensitivity * Math.log(1 + trainingBudget / c.trainingScale),
  );

  return {
    morale,
    cost,
    hired,
    fired,
    departed,
    trainingBudget,
    salaryIndex,
    nextHeadcount: Math.max(1, args.headcount + hired - fired - departed),
    nextProductivity,
  };
}
