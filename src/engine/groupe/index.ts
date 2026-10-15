import type {
  CompanyRoundResult,
  CompanyState,
  SegmentSalesDetail,
  SimulationInput,
  SimulationOutput,
} from "../types";
import { toGamme } from "../gamme";
import { executerLesRachats } from "./rachat";
import { economieDeFinDePartie, emettre, initialiserLeGroupe, valoriser } from "./valorisation";
import type { ValeurDeLEntreprise } from "./types";

export * from "./types";
export { coutAuBareme, commandeDuTour, type CommandeDuTour } from "./sous-traitance";
export { prixDeCession, structureReprise } from "./rachat";
export {
  actifEconomique,
  detteNette,
  ebeDouzeMois,
  emettre,
  initialiserLeGroupe,
  parametresDuTest,
  tailleDeLaFenetre,
  toursParAn,
  valoriser,
} from "./valorisation";

/**
 * LE TOUR D'UNE PARTIE DE NIVEAU 7, AUTOUR DU TOUR ORDINAIRE.
 *
 *   1. chaque entreprise reçoit son état de groupe à sa première ouverture ;
 *   2. sa valeur d'ouverture est calculée (le prix d'émission de ses actions) ;
 *   3. les rachats décidés se font au jour 1 (`executerLesRachats`) ;
 *   4. le tour ordinaire se joue SANS les entreprises absorbées : elles ne sont
 *      plus au marché, ne produisent plus, ne décident plus ;
 *   5. à la clôture, chaque entreprise allonge son historique d'EBE, compte ses
 *      émissions et ses dividendes par action, et dit sa valeur.
 *
 * Une partie qui ne porte ni bloc `groupe` ni entreprise absorbée ne passe pas
 * ici (voir `simulateRound`).
 */

const DISCRETIONNAIRES = (r: CompanyRoundResult) =>
  r.incomeStatement.marketingCost +
  r.incomeStatement.qualityCost +
  r.incomeStatement.maintenanceCost +
  (r.incomeStatement.engagementRse ?? 0) +
  (r.incomeStatement.rdCost ?? 0);

const flux = (r: CompanyRoundResult, label: string) =>
  r.cashFlow.items.filter((i) => i.label === label).reduce((s, i) => s + i.amount, 0);

/** Le résultat d'une entreprise absorbée : rien, au marché comme aux comptes. */
function resultatDUneAbsorbee(input: SimulationInput, state: CompanyState, potentiel: Record<string, number>): CompanyRoundResult {
  const bySegment: Record<string, SegmentSalesDetail> = {};
  for (const p of toGamme(input.scenario)) {
    for (const s of p.market.segments) {
      bySegment[s.code] = {
        potential: potentiel[s.code] ?? 0,
        attraction: 0,
        share: 0,
        demandForCompany: 0,
        sold: 0,
        lost: 0,
        revenue: 0,
        commission: 0,
      };
    }
  }
  const zero = 0;
  return {
    companyId: state.id,
    incomeStatement: {
      revenue: zero,
      productionStocked: zero,
      cogs: zero,
      variableProductionCost: zero,
      grossMargin: zero,
      marketingCost: zero,
      qualityCost: zero,
      maintenanceCost: zero,
      fixedCosts: zero,
      ebitda: zero,
      depreciation: zero,
      operatingIncome: zero,
      interest: zero,
      financialIncome: zero,
      pretaxIncome: zero,
      tax: zero,
      netIncome: zero,
    },
    balanceSheet: state.finance,
    cashFlow: { opening: 0, items: [], closing: 0 },
    functionalBalance: { frng: 0, bfr: 0, netTreasury: 0 },
    ratios: { profitability: 0, returnOnCapitalEmployed: 0, returnOnEquity: 0, leverage: 0, debtToEquity: 0, assetTurnover: 0 },
    market: { bySegment, totalShare: 0 },
    production: { planned: 0, produced: 0, machineCapacity: 0, laborCapacity: 0, utilizationRate: 0, producedQuality: 0 },
    breakeven: { unitVariableCost: 0, breakEvenUnits: null, breakEvenRevenue: null, safetyMargin: null, safetyIndex: null },
    kpis: {},
    groupe: { absorbee: state.absorption! },
  };
}

export function simulerLeGroupe(
  input: SimulationInput,
  simulerLeTour: (input: SimulationInput) => SimulationOutput,
): SimulationOutput {
  const { scenario, roundIndex } = input;
  const cfg = scenario.groupe;
  const multiple = cfg?.valorisation.multipleEBE ?? 0;

  // 1. États de groupe.
  let companies = cfg
    ? input.companies.map((c) =>
        c.groupe || c.status === "absorbee" ? c : { ...c, groupe: initialiserLeGroupe(c, cfg, scenario.roundDays) },
      )
    : input.companies;

  // 2. Valeur d'ouverture.
  const ouverture = new Map<string, ValeurDeLEntreprise>();
  for (const c of companies) {
    if (c.groupe) ouverture.set(c.id, valoriser({ groupe: c.groupe, finance: c.finance, roundDays: scenario.roundDays, multiple }));
  }

  // 3. Rachats au jour 1 (l'estimation ne voit que l'équipe : elle ne rachète pas).
  const rachats =
    cfg?.rachat && !input.estimation
      ? executerLesRachats({ scenario, roundIndex, companies, decisions: input.decisions, ouverture })
      : null;
  if (rachats) companies = rachats.companies;

  // 4. Le tour ordinaire, sans les absorbées.
  const actives = companies.filter((c) => c.status !== "absorbee");
  const decisions = Object.fromEntries(actives.map((c) => [c.id, input.decisions[c.id]!]));
  const sortie = simulerLeTour({
    ...input,
    companies: actives,
    decisions,
    ...(rachats && Object.keys(rachats.operations).length > 0 ? { operationsDeGroupe: rachats.operations } : {}),
  });

  // 5. Clôture de groupe.
  const results: Record<string, CompanyRoundResult> = { ...sortie.results };
  const suivants = new Map(sortie.companies.map((c) => [c.id, c]));
  if (cfg) {
    for (const c of sortie.companies) {
      if (!c.groupe) continue;
      const r = results[c.id]!;
      const g = c.groupe;
      const actions = g.actions;
      const dividendes = -flux(r, "dividendes_verses");
      const dernier = roundIndex >= scenario.roundsCount;
      const ebe = r.incomeStatement.ebitda;
      const disc = DISCRETIONNAIRES(r);
      const historique = {
        ...g,
        dividendesParAction: g.dividendesParAction + (dividendes > 0 && actions > 0 ? dividendes / actions : 0),
        ebe: [...g.ebe, ebe],
        discretionnaires: [...g.discretionnaires, disc],
      };
      const economie = dernier ? economieDeFinDePartie(disc, g.discretionnaires) : 0;
      // Au dernier tour, la caisse d'une cession de machines ne se compte pas
      // comme de la valeur, ni l'impôt que sa moins-value économise : l'outil
      // vendu aurait servi ensuite.
      const moinsValue = r.investment?.disposalLoss ?? 0;
      const cession = dernier
        ? (r.investment?.saleProceeds ?? 0) +
          scenario.finance.taxRate * Math.min(moinsValue, Math.max(0, r.incomeStatement.pretaxIncome + moinsValue))
        : 0;
      const pourLaValeur = economie > 0 ? { ...historique, ebe: [...g.ebe, ebe - economie] } : historique;
      const avant = valoriser({
        groupe: pourLaValeur,
        finance: r.balanceSheet,
        roundDays: scenario.roundDays,
        multiple,
        ...(economie + cession > 0 ? { detteEnPlus: economie + cession } : {}),
      });
      // Les apports du tour deviennent des actions, au prix de clôture hors apport.
      const emission = emettre({
        groupe: g,
        valeurCapitauxPropres: avant.valeurCapitauxPropres,
        apportDesAssocies: flux(r, "augmentation_capital"),
        apportDesInvestisseurs: flux(r, "augmentation_capital_investisseurs"),
        decote: cfg.rachat?.decoteDEmission ?? 0,
      });
      const groupe = emission ? { ...historique, actions: actions + emission.actionsEmises } : historique;
      const valeur = emission
        ? {
            ...avant,
            actions: groupe.actions,
            valeurParAction: avant.valeurCapitauxPropres / groupe.actions,
            rentabiliteTotale:
              (avant.valeurCapitauxPropres / groupe.actions + groupe.dividendesParAction) / g.valeurInitialeParAction - 1,
            emission,
          }
        : avant;
      suivants.set(c.id, { ...c, groupe });
      results[c.id] = {
        ...r,
        groupe: {
          ...(r.groupe ?? {}),
          valeur,
          ...(rachats?.rapports[c.id] ? { rachat: rachats.rapports[c.id] } : {}),
        },
      };
    }
  }
  for (const c of companies) {
    if (c.status !== "absorbee") continue;
    results[c.id] = resultatDUneAbsorbee(input, c, sortie.market.potentialBySegment);
    suivants.set(c.id, c);
  }
  return {
    ...sortie,
    companies: input.companies.map((c) => suivants.get(c.id)!),
    results,
  };
}
