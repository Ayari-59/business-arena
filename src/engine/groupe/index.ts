import type { CompanyRoundResult, CompanyState, ProductCode, RoundDecisions, SimulationInput, SimulationOutput } from "../types";
import { consolider } from "./consolidation";
import { agrandir, apporterLeFondsDeRoulement } from "./depart";
import { laCibleEtrangere, trajectoireDeLEtranger } from "./etranger";
import { toGamme } from "../gamme";
import { PROFILS_QUI_PARTENT, commandesAuFournisseur, leFournisseur, quitterLeFournisseur } from "./fournisseur";
import { executerLesRachats } from "./rachat";
import { mettreEnRoute } from "./site-ferme";
import { economieDeFinDePartie, emettre, initialiserLeGroupe, valoriser } from "./valorisation";
import type { ValeurDeLEntreprise } from "./types";

export * from "./types";
export {
  coutAuBareme,
  commandeDuTour,
  fusionnerLesCommandes,
  seuilDIndifference,
  type CommandeDuTour,
  type LigneEnPropre,
  type SeuilDIndifference,
} from "./sous-traitance";
export {
  cleDeLaCible,
  dejaVendue,
  chiffrerLeMontage,
  jugerLeMontage,
  motifDuPaiement,
  type ChiffresDuMontage,
  type MontageDuRachat,
  type SituationDeLAcquereur,
} from "./rachat";
export { chargesDesSites, cleDuSite, etatDuSite, siteAcquis, valeurRecouvrable } from "./site-ferme";
export { fluxPropre } from "./flux-propre";
export { agrandir, apporterLeFondsDeRoulement } from "./depart";
export { coursDeLImport, prixDeLImport, probabiliteDeRupture, ruptureDeLImport } from "./import";
export { comptesDeLEtranger, coursMoyen, trajectoireDeLEtranger, ventesLocales } from "./etranger";
export { laSociete, prixDeLaSociete, valeurDeLaSociete, type Societe } from "./societe";
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
  valeurCreee,
  valoriser,
} from "./valorisation";

/**
 * LE TOUR D'UNE PARTIE DE NIVEAU 7, AUTOUR DU TOUR ORDINAIRE.
 *
 *   1. chaque entreprise reçoit, à sa première ouverture, sa taille de départ
 *      du niveau (`agrandir`) puis son état de groupe ;
 *   2. les lignes des sites rachetés dont c'est le tour rejoignent le parc ;
 *   3. sa valeur d'ouverture est calculée (le contrôle d'une émission s'y juge) ;
 *   4. les audits et les rachats décidés se font au jour 1 (`executerLesRachats`) ;
 *   5. les concurrents simulés quittent le fournisseur racheté par un
 *      concurrent, et un fournisseur racheté rationne ses clients au-delà de sa
 *      capacité (`rationner`) ;
 *   6. les filiales étrangères écoulent par leur réseau et fabriquent ce que
 *      l'équipe leur demande, au cours moyen du tour (`synergiesEtrangeres`) ;
 *   7. le tour ordinaire se joue ;
 *   8. à la clôture, chaque entreprise note ses achats aux fournisseurs, se
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
        mettreEnRoute(c.groupe ? c : premiereOuverture(c, cfg, scenario.roundDays), scenario, roundIndex),
      )
    : input.companies;

  // 3. Valeur d'ouverture : celle du groupe consolidé à la dernière clôture, s'il a des filiales.
  const ouverture = new Map<string, ValeurDeLEntreprise>();
  for (const c of companies) {
    const v = valeurDOuverture(c, scenario);
    if (v) ouverture.set(c.id, v);
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

  // 6. Les synergies des filiales étrangères : vendre par leur réseau, faire fabriquer chez elles.
  const synergies = cfg?.etrangers && !input.estimation ? synergiesEtrangeres(input, companies) : null;

  // 7. Le tour ordinaire.
  const sortie = simulerLeTour({
    ...input,
    companies,
    ...(synergies && Object.keys(synergies.ventes).length > 0 ? { ventesDuGroupe: synergies.ventes } : {}),
    ...(synergies && Object.keys(synergies.fabrication).length > 0 ? { fabricationDuGroupe: synergies.fabrication } : {}),
    ...(synergies && Object.keys(synergies.frais).length > 0 ? { fraisDesSynergies: synergies.frais } : {}),
    ...(fournisseurs ? { decisions: fournisseurs.decisions } : {}),
    ...(rachats && Object.keys(rachats.operations).length > 0 ? { operationsDeGroupe: rachats.operations } : {}),
    ...(fournisseurs && Object.keys(fournisseurs.rationnement).length > 0 ? { rationnementDuGroupe: fournisseurs.rationnement } : {}),
  });

  // 8. Clôture de groupe. D'abord les achats du tour aux fournisseurs
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
      const conso = g0.filiales.length > 0 ? consolider({ scenario, etat: c, resultat: r, companies: cloturees, graine: input.seed, roundIndex }) : null;
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
          ...(synergies?.rapports[c.id] ? { fabrication: synergies.rapports[c.id] } : {}),
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

/**
 * La première ouverture d'une entreprise au niveau 7 : sa taille de départ et son fonds de roulement,
 * puis son état de groupe. Les services l'appliquent dès la création, pour
 * que l'état du tour 0 la montre ; le moteur, à une entreprise qui ne porte
 * pas encore d'état de groupe. Jamais deux fois : l'état de groupe le marque.
 */
export function premiereOuverture(c: CompanyState, cfg: NonNullable<SimulationInput["scenario"]["groupe"]>, roundDays: number): CompanyState {
  const grande = apporterLeFondsDeRoulement(agrandir(c, cfg.depart?.facteur ?? 1), cfg.depart?.apport ?? 0);
  return { ...grande, groupe: initialiserLeGroupe(grande, cfg, roundDays) };
}

/**
 * La valeur d'une entreprise à l'ouverture d'un tour : celle du groupe
 * consolidé à la dernière clôture, part du groupe, s'il a des filiales ; sinon
 * la sienne. Le contrôle d'une émission s'y juge, la fusion s'y émet ; la
 * feuille de décision la lit de la même fonction. `null` hors niveau 7.
 */
export function valeurDOuverture(c: CompanyState, scenario: SimulationInput["scenario"]): ValeurDeLEntreprise | null {
  const cfg = scenario.groupe;
  if (!cfg || !c.groupe) return null;
  const v = valoriser({
    groupe: c.groupe,
    finance: c.groupe.cloture?.bilan ?? c.finance,
    roundDays: scenario.roundDays,
    multiple: cfg.valorisation.multipleEBE,
  });
  return c.groupe.cloture ? partDuGroupe(v, c.groupe.cloture.valeurDesMinoritaires, c.groupe.valeurInitialeParAction) : v;
}

/**
 * LES SYNERGIES DES FILIALES ÉTRANGÈRES, AU JOUR 1. Pour chaque filiale
 * étrangère d'une entreprise : les unités qu'elle demande à son réseau
 * (bornées à sa capacité, réparties au prorata si elles la dépassent), au
 * prix local et au coût de distribution convertis au cours moyen du tour ;
 * les unités qu'elle lui fait fabriquer (bornées à la capacité de son usine),
 * au coût local converti. Chaque synergie employée paie ses frais fixes du
 * tour. Au tour du rachat, la moitié de chaque capacité : l'intégration se
 * fait progressivement.
 */
function synergiesEtrangeres(
  input: SimulationInput,
  companies: CompanyState[],
): {
  ventes: Record<string, Record<ProductCode, { quantite: number; prix: number; commission: number }>>;
  fabrication: Record<string, { unites: number[]; couts: number[]; total: number; qualite: number }>;
  rapports: Record<string, Record<ProductCode, { unites: number; cout: number }>>;
  frais: Record<string, number>;
} {
  const { scenario, roundIndex } = input;
  const codes = toGamme(scenario).map((p) => p.code);
  const ventes: Record<string, Record<ProductCode, { quantite: number; prix: number; commission: number }>> = {};
  const fabrication: Record<string, { unites: number[]; couts: number[]; total: number; qualite: number }> = {};
  const rapports: Record<string, Record<ProductCode, { unites: number; cout: number }>> = {};
  const frais: Record<string, number> = {};
  const payer = (id: string, montant: number) => {
    if (montant > 0) frais[id] = (frais[id] ?? 0) + montant;
  };
  const borner = (demande: Record<ProductCode, number>, capacite: number) => {
    const propres = Object.fromEntries(Object.entries(demande).map(([k, q]) => [k, Number.isFinite(Number(q)) ? Math.max(0, Number(q)) : 0]));
    const total = Object.values(propres).reduce((a, b) => a + b, 0);
    const k = total > capacite ? capacite / total : 1;
    return Object.fromEntries(Object.entries(propres).map(([code, q]) => [code, q * k]));
  };
  for (const c of companies) {
    const d = input.decisions[c.id];
    if (!d || !c.groupe || c.status === "defaillant") continue;
    for (const fil of c.groupe.filiales) {
      if (fil.type !== "etranger") continue;
      const cible = laCibleEtrangere(scenario, fil.id);
      if (!cible) continue;
      const { cours } = trajectoireDeLEtranger(cible, input.seed, roundIndex);
      const moyen = (cours[roundIndex - 1]! + cours[roundIndex]!) / 2;
      const montee = roundIndex === fil.tour ? 0.5 : 1;
      const r = cible.reseau;
      const demandeReseau = d.reseauEtranger?.[fil.id];
      if (r && demandeReseau) {
        const servi = borner(
          Object.fromEntries(Object.entries(demandeReseau).filter(([k]) => r.prix[k] !== undefined)),
          r.capacite * montee,
        );
        if (Object.values(servi).some((q) => q > 0)) payer(c.id, r.coutFixeParTour * moyen);
        for (const [code, q] of Object.entries(servi)) {
          if (q <= 0) continue;
          const prec = ventes[c.id]?.[code];
          const quantite = (prec?.quantite ?? 0) + q;
          ventes[c.id] = {
            ...(ventes[c.id] ?? {}),
            [code]: {
              quantite,
              prix: ((prec?.prix ?? 0) * (prec?.quantite ?? 0) + r.prix[code]! * moyen * q) / quantite,
              commission: ((prec?.commission ?? 0) * (prec?.quantite ?? 0) + r.coutParUnite * moyen * q) / quantite,
            },
          };
        }
      }
      const f = cible.fabrication;
      const demandeUsine = d.fabricationEtrangere?.[fil.id];
      if (f && demandeUsine) {
        const servi = borner(
          Object.fromEntries(Object.entries(demandeUsine).filter(([k]) => f.cout[k] !== undefined)),
          f.capacite * montee,
        );
        const unites = codes.map((k) => servi[k] ?? 0);
        if (unites.every((u) => u <= 0)) continue;
        payer(c.id, f.coutFixeParTour * moyen);
        const couts = codes.map((k, i) => unites[i]! * (f.cout[k] ?? 0) * moyen);
        const prec = fabrication[c.id];
        const tous = prec ? unites.map((u, i) => u + prec.unites[i]!) : unites;
        fabrication[c.id] = {
          unites: tous,
          couts: prec ? couts.map((x, i) => x + prec.couts[i]!) : couts,
          total: (prec?.total ?? 0) + couts.reduce((a, b) => a + b, 0),
          qualite: f.qualite,
        };
        rapports[c.id] = Object.fromEntries(codes.map((k, i) => [k, { unites: tous[i]!, cout: fabrication[c.id]!.couts[i]! }]).filter(([, x]) => (x as { unites: number }).unites > 0));
      }
    }
  }
  return { ventes, fabrication, rapports, frais };
}
