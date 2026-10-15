import type { CompanyRoundResult, CompanyState, ProductCode, RoundDecisions, SimulationInput, SimulationOutput } from "../types";
import { consolider } from "./consolidation";
import { PROFILS_QUI_PARTENT, commandesAuFournisseur, leFournisseur, quitterLeFournisseur } from "./fournisseur";
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
  chiffresDuFournisseur,
  commandesAuFournisseur,
  comptesDuFournisseur,
  fournisseurDeLaReference,
  prixDuFournisseur,
  valeurDUneSociete,
} from "./fournisseur";
export { consolider, ecartDuBilanConsolide, margeEnStock } from "./consolidation";
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
 *   5. les concurrents simulés quittent le fournisseur racheté par un
 *      concurrent, et un fournisseur racheté rationne ses clients au-delà de sa
 *      capacité (`rationner`) ;
 *   6. le tour ordinaire se joue ;
 *   7. à la clôture, chaque entreprise note ses achats aux fournisseurs, se
 *      consolide avec ses filiales, allonge son historique d'EBE, émet les
 *      actions de ses apports du tour, compte ses dividendes par action, et
 *      dit sa valeur.
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

  // 3. Valeur d'ouverture : celle du groupe consolidé à la dernière clôture, s'il a des filiales.
  const ouverture = new Map<string, ValeurDeLEntreprise>();
  for (const c of companies) {
    if (!c.groupe) continue;
    const v = valoriser({ groupe: c.groupe, finance: c.groupe.cloture?.bilan ?? c.finance, roundDays: scenario.roundDays, multiple });
    ouverture.set(c.id, c.groupe.cloture ? partDuGroupe(v, c.groupe.cloture.valeurDesMinoritaires, c.groupe.valeurInitialeParAction) : v);
  }

  // 4. Audits et rachats au jour 1 (l'estimation ne voit que l'équipe : ni l'un ni l'autre).
  const rachats =
    cfg?.rachat && !input.estimation
      ? executerLesRachats({ scenario, roundIndex, companies, decisions: input.decisions, ouverture, graine: input.seed })
      : null;
  if (rachats) companies = rachats.companies;

  // 5. Les fournisseurs rachetés : départs des concurrents simulés, rationnement.
  const fournisseurs = cfg?.fournisseurs && !input.estimation ? rationner(input, companies) : null;
  if (fournisseurs) companies = fournisseurs.companies;

  // 6. Le tour ordinaire.
  const sortie = simulerLeTour({
    ...input,
    companies,
    ...(fournisseurs ? { decisions: fournisseurs.decisions } : {}),
    ...(rachats && Object.keys(rachats.operations).length > 0 ? { operationsDeGroupe: rachats.operations } : {}),
    ...(fournisseurs && Object.keys(fournisseurs.rationnement).length > 0 ? { rationnementDuGroupe: fournisseurs.rationnement } : {}),
  });

  // 7. Clôture de groupe. D'abord les achats du tour aux fournisseurs
  // rachetables : leur chiffre d'affaires, que la consolidation lit.
  const results: Record<string, CompanyRoundResult> = { ...sortie.results };
  const codes = (cfg?.fournisseurs ?? []).map((f) => f.code);
  const cloturees = sortie.companies.map((c) =>
    c.groupe && codes.length > 0
      ? {
          ...c,
          groupe: {
            ...c.groupe,
            achats: Object.fromEntries(
              codes.map((code) => [code, [...(c.groupe!.achats[code] ?? []), results[c.id]!.groupe?.achats?.[code] ?? 0]]),
            ),
          },
        }
      : c,
  );
  const suivants = new Map(cloturees.map((c) => [c.id, c]));
  if (cfg) {
    for (const c0 of cloturees) {
      if (!c0.groupe) continue;
      const r = results[c0.id]!;
      // Les clients rationnés ce tour, notés pour la règle des concurrents simulés.
      const c = fournisseurs?.rationnes.size
        ? {
            ...c0,
            groupe: {
              ...c0.groupe,
              filiales: c0.groupe.filiales.map((f) => ({ ...f, rationnes: [...(fournisseurs.rationnes.get(`${c0.id}:${f.id}`) ?? [])] })),
            },
          }
        : c0.groupe.filiales.some((f) => f.rationnes.length > 0)
          ? { ...c0, groupe: { ...c0.groupe, filiales: c0.groupe.filiales.map((f) => ({ ...f, rationnes: [] })) } }
          : c0;
      const g0 = c.groupe!;
      const conso = g0.filiales.length > 0 ? consolider({ scenario, etat: c, resultat: r, companies: cloturees }) : null;
      const g = conso ? { ...g0, filiales: conso.filiales, margeEnStock: conso.margeEnStock } : g0;
      const actions = g.actions;
      const dividendes = -flux(r, "dividendes_verses");
      const dernier = roundIndex >= scenario.roundsCount;
      const ebe = conso ? conso.ebe : r.incomeStatement.ebitda;
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
      const brute = valoriser({
        groupe: pourLaValeur,
        finance: conso ? conso.consolide.bilan : r.balanceSheet,
        roundDays: scenario.roundDays,
        multiple,
        ...(economie + cession > 0 ? { detteEnPlus: economie + cession } : {}),
      });
      const avant = conso ? partDuGroupe(brute, conso.valeurDesMinoritaires, g.valeurInitialeParAction) : brute;
      // Les apports du tour deviennent des actions, au prix de clôture hors apport.
      const emission = emettre({
        groupe: g,
        valeurCapitauxPropres: avant.valeurCapitauxPropres,
        apportDesAssocies: flux(r, "augmentation_capital"),
        apportDesInvestisseurs: flux(r, "augmentation_capital_investisseurs"),
        decote: cfg.rachat?.decoteDEmission ?? 0,
      });
      const avecCloture = conso
        ? { ...historique, cloture: { bilan: conso.consolide.bilan, valeurDesMinoritaires: conso.valeurDesMinoritaires } }
        : historique;
      const groupe = emission ? { ...avecCloture, actions: actions + emission.actionsEmises } : avecCloture;
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
          ...(conso ? { consolide: conso.consolide } : {}),
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

/** La valeur des capitaux propres qui revient aux actionnaires du groupe : celle des minoritaires retirée. */
function partDuGroupe(v: ValeurDeLEntreprise, minoritaires: number, valeurInitiale: number): ValeurDeLEntreprise {
  if (minoritaires <= 0) return v;
  const vcp = Math.max(0, v.valeurCapitauxPropres - minoritaires);
  const parAction = v.actions > 0 ? vcp / v.actions : 0;
  return {
    ...v,
    valeurCapitauxPropres: vcp,
    valeurParAction: parAction,
    rentabiliteTotale: (parAction + v.dividendesParAction) / valeurInitiale - 1,
  };
}

/**
 * LES FOURNISSEURS RACHETÉS, AU JOUR 1. Les concurrents simulés qui doivent
 * partir partent (règle de `fournisseur.ts`), puis chaque fournisseur racheté
 * compare les commandes de ses clients à sa capacité : il sert son groupe
 * d'abord, les autres au prorata de ce qui reste. La part servie de chaque
 * plan va au tour ordinaire.
 */
function rationner(
  input: SimulationInput,
  companies: CompanyState[],
): {
  companies: CompanyState[];
  decisions: Record<string, RoundDecisions>;
  rationnement: Record<string, Record<ProductCode, number>>;
  rationnes: Map<string, string[]>;
} {
  const { scenario, roundIndex } = input;
  const decisions = { ...input.decisions };
  const rationnement: Record<string, Record<ProductCode, number>> = {};
  const rationnes = new Map<string, string[]>();
  const etats = companies.map((owner) => {
    const g = owner.groupe;
    if (!g || g.filiales.every((f) => f.type !== "fournisseur")) return owner;
    const filiales = g.filiales.map((fil) => {
      if (fil.type !== "fournisseur") return fil;
      const f = leFournisseur(scenario, fil.id);
      if (!f) return fil;
      // Les départs : dès le tour qui suit le rachat, un concurrent simulé qui
      // achète au prix, ou qui a été rationné, s'en va.
      const partis = new Set(fil.clientsPartis);
      if (roundIndex > fil.tour)
        for (const c of companies)
          if (c.controller === "bot" && c.id !== owner.id && (PROFILS_QUI_PARTENT.includes(c.botProfile ?? "") || fil.rationnes.includes(c.id))) {
            const avant = decisions[c.id];
            if (avant && Object.keys(commandesAuFournisseur(scenario, avant, f.code)).length > 0) partis.add(c.id);
          }
      for (const id of partis) if (decisions[id]) decisions[id] = quitterLeFournisseur(scenario, decisions[id]!, f.code);
      // Le rationnement : le groupe d'abord, les autres au prorata.
      const commandes = new Map(companies.map((c) => [c.id, commandesAuFournisseur(scenario, decisions[c.id] ?? ({} as RoundDecisions), f.code)]));
      const total = (id: string) => Object.values(commandes.get(id) ?? {}).reduce((s, x) => s + x, 0);
      const duGroupe = total(owner.id);
      const desAutres = companies.filter((c) => c.id !== owner.id).reduce((s, c) => s + total(c.id), 0);
      const servi = (id: string) =>
        id === owner.id
          ? duGroupe > f.capacite ? f.capacite / duGroupe : 1
          : desAutres > Math.max(0, f.capacite - duGroupe) ? Math.max(0, f.capacite - duGroupe) / desAutres : 1;
      const touches: string[] = [];
      for (const c of companies) {
        const part = servi(c.id);
        if (part >= 1 || total(c.id) <= 0) continue;
        touches.push(c.id);
        for (const code of Object.keys(commandes.get(c.id)!))
          rationnement[c.id] = { ...(rationnement[c.id] ?? {}), [code]: Math.min(rationnement[c.id]?.[code] ?? 1, part) };
      }
      rationnes.set(`${owner.id}:${fil.id}`, touches);
      return { ...fil, clientsPartis: [...partis] };
    });
    return { ...owner, groupe: { ...g, filiales } };
  });
  return { companies: etats, decisions, rationnement, rationnes };
}
