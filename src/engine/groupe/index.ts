import type { CompanyRoundResult, SimulationInput, SimulationOutput } from "../types";
import { executerLesRachats } from "./rachat";
import { mettreEnRoute } from "./site-ferme";
import { economieDeFinDePartie, emettre, initialiserLeGroupe, valoriser } from "./valorisation";
import type { ValeurDeLEntreprise } from "./types";

export * from "./types";
export { coutAuBareme, commandeDuTour, type CommandeDuTour } from "./sous-traitance";
export { cleDeLaCible, dejaVendue } from "./rachat";
export { chargesDesSites, cleDuSite, etatDuSite, siteAcquis, valeurRecouvrable } from "./site-ferme";
export { fluxPropre } from "./flux-propre";
export {
  actifEconomique,
  detteNette,
  ebeDouzeMois,
  emettre,
  initialiserLeGroupe,
  tailleDeLaFenetre,
  toursParAn,
  valoriser,
} from "./valorisation";

/**
 * LE TOUR D'UNE PARTIE DE NIVEAU 7, AUTOUR DU TOUR ORDINAIRE.
 *
 *   1. chaque entreprise reçoit son état de groupe à sa première ouverture ;
 *   2. les lignes des sites rachetés dont c'est le tour rejoignent le parc ;
 *   3. sa valeur d'ouverture est calculée (le contrôle d'une émission s'y juge) ;
 *   4. les audits et les rachats décidés se font au jour 1 (`executerLesRachats`) ;
 *   5. le tour ordinaire se joue ;
 *   6. à la clôture, chaque entreprise allonge son historique d'EBE, émet les
 *      actions de ses apports du tour, compte ses dividendes par action, et dit
 *      sa valeur.
 *
 * Une partie qui ne porte pas de bloc `groupe` ne passe pas ici (voir `simulateRound`).
 */

const DISCRETIONNAIRES = (r: CompanyRoundResult) =>
  r.incomeStatement.marketingCost +
  r.incomeStatement.qualityCost +
  r.incomeStatement.maintenanceCost +
  (r.incomeStatement.engagementRse ?? 0) +
  (r.incomeStatement.rdCost ?? 0);

const flux = (r: CompanyRoundResult, label: string) =>
  r.cashFlow.items.filter((i) => i.label === label).reduce((s, i) => s + i.amount, 0);

export function simulerLeGroupe(
  input: SimulationInput,
  simulerLeTour: (input: SimulationInput) => SimulationOutput,
): SimulationOutput {
  const { scenario, roundIndex } = input;
  const cfg = scenario.groupe;
  const multiple = cfg?.valorisation.multipleEBE ?? 0;

  // 1. États de groupe ; 2. mise en route des sites.
  let companies = cfg
    ? input.companies.map((c) =>
        mettreEnRoute(c.groupe ? c : { ...c, groupe: initialiserLeGroupe(c, cfg, scenario.roundDays) }, scenario, roundIndex),
      )
    : input.companies;

  // 3. Valeur d'ouverture.
  const ouverture = new Map<string, ValeurDeLEntreprise>();
  for (const c of companies) {
    if (c.groupe) ouverture.set(c.id, valoriser({ groupe: c.groupe, finance: c.finance, roundDays: scenario.roundDays, multiple }));
  }

  // 4. Audits et rachats au jour 1 (l'estimation ne voit que l'équipe : ni l'un ni l'autre).
  const rachats =
    cfg?.rachat && !input.estimation
      ? executerLesRachats({ scenario, roundIndex, companies, decisions: input.decisions, ouverture, graine: input.seed })
      : null;
  if (rachats) companies = rachats.companies;

  // 5. Le tour ordinaire.
  const sortie = simulerLeTour({
    ...input,
    companies,
    ...(rachats && Object.keys(rachats.operations).length > 0 ? { operationsDeGroupe: rachats.operations } : {}),
  });

  // 6. Clôture de groupe.
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
          ...(rachats?.diligences[c.id] ? { diligence: rachats.diligences[c.id] } : {}),
        },
      };
    }
  }
  return {
    ...sortie,
    companies: sortie.companies.map((c) => suivants.get(c.id)!),
    results,
  };
}
