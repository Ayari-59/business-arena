import type { BalanceSheet, CompanyState, EngineScenarioConfig, RoundDecisions } from "../types";
import { addToStock } from "../inventory/cump";
import { conditionsBancaires, confianceServie } from "../finance/bank";
import { detteNette, toursParAn, valoriser } from "./valorisation";
import type { OperationDOuverture, PrixDeCession, ResultatDuRachat, ValeurDeLEntreprise } from "./types";

/**
 * RACHETER UN CONCURRENT (niveau 7).
 *
 * Le rachat se fait au jour 1 du tour, avant tout calcul : la cible, un
 * concurrent simulé, passe tout entière dans l'entreprise de l'équipe (parc
 * machine, effectif, stocks, créances, dettes, emprunts, clientèle, R&D), et
 * sort du marché. Le bilan d'ouverture de l'acquéreur devient un bilan
 * consolidé, l'écart entre le prix et l'actif net repris porté en écart
 * d'acquisition :
 *
 *   actif repris + écart d'acquisition = passif repris + prix payé
 *
 * Le prix se paie en numéraire (la caisse, un emprunt d'acquisition sous le
 * plafond de la banque, des actions vendues à des investisseurs) ou en actions
 * remises aux actionnaires de la cible (la fusion). Toute émission respecte le
 * contrôle : les actions d'origine gardent au moins `seuilDeControle`.
 *
 * Un rachat refusé ne coûte rien et dit pourquoi. Pur : aucun tirage.
 */

const actif = (c: CompanyState) => c.status !== "absorbee" && c.status !== "defaillant";

/**
 * Le prix demandé par le vendeur : la plus haute de ses trois valeurs de
 * référence (actif net, rendement sur douze mois, rendement au rythme du
 * dernier tour), majorée de la prime de contrôle. Une entreprise qui ne vaut
 * rien se cède pour un euro symbolique.
 */
export function prixDeCession(cible: CompanyState, scenario: EngineScenarioConfig): PrixDeCession {
  const cfg = scenario.groupe!;
  const g = cible.groupe!;
  const m = cfg.valorisation.multipleEBE;
  const actifNet = cible.finance.equity;
  const valeurDeRendement = valoriser({ groupe: g, finance: cible.finance, roundDays: scenario.roundDays, multiple: m })
    .valeurCapitauxPropres;
  const dernier = g.ebe.length > 0 ? g.ebe[g.ebe.length - 1]! : g.ebeReference;
  const valeurAuRythme = Math.max(0, m * toursParAn(scenario.roundDays) * dernier - detteNette(cible.finance));
  const base = Math.max(actifNet, valeurDeRendement, valeurAuRythme);
  const prix = base > 0 ? base * (1 + (cfg.rachat?.primeDeControle ?? 0)) : 1;
  return { actifNet, valeurDeRendement, valeurAuRythme, prix };
}

const somme = (a: number | undefined, b: number | undefined) =>
  a === undefined && b === undefined ? undefined : (a ?? 0) + (b ?? 0);

/** Deux historiques additionnés tour par tour, alignés sur le plus récent (pro forma). */
function proForma(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  return Array.from({ length: n }, (_, i) => (a[a.length - n + i] ?? 0) + (b[b.length - n + i] ?? 0));
}

function avecTresorerieNette(b: BalanceSheet, net: number): BalanceSheet {
  return { ...b, cash: Math.max(0, net), overdraft: Math.max(0, -net) };
}

/** L'état de l'acquéreur au jour 1, la cible fondue dedans. */
function fusionner(args: {
  A: CompanyState;
  T: CompanyState;
  scenario: EngineScenarioConfig;
  roundIndex: number;
  prix: number;
  ecart: number;
  emprunt: number;
  augmentation: number;
  titres: number;
  actionsEmises: number;
  /** Créance des investisseurs entrants (apport majoré de la décote). */
  apport: number;
  paiement: "numeraire" | "titres";
}): CompanyState {
  const { A, T, scenario } = args;
  const fA = A.finance;
  const fT = T.finance;
  const netA = fA.cash - fA.overdraft;
  const netT = fT.cash - fT.overdraft;
  const net = netA + netT + args.emprunt + args.augmentation - (args.prix - args.titres);
  const finance = avecTresorerieNette(
    {
      fixedAssetsNet: fA.fixedAssetsNet + fT.fixedAssetsNet,
      goodwill: (fA.goodwill ?? 0) + (fT.goodwill ?? 0) + args.ecart,
      inventoryValue: fA.inventoryValue + fT.inventoryValue,
      receivables: fA.receivables + fT.receivables,
      cash: 0,
      ...(somme(fA.shortTermInvestment, fT.shortTermInvestment) !== undefined
        ? { shortTermInvestment: somme(fA.shortTermInvestment, fT.shortTermInvestment) }
        : {}),
      equity: fA.equity + args.augmentation + args.titres,
      financialDebt: fA.financialDebt + fT.financialDebt + args.emprunt,
      payables: fA.payables + fT.payables,
      overdraft: 0,
      ...(somme(fA.vatLiability, fT.vatLiability) !== undefined
        ? { vatLiability: somme(fA.vatLiability, fT.vatLiability) }
        : {}),
    },
    net,
  );

  const parReference = (() => {
    if (!A.finishedGoodsByProduct && !T.finishedGoodsByProduct) return undefined;
    const codes = new Set([...Object.keys(A.finishedGoodsByProduct ?? {}), ...Object.keys(T.finishedGoodsByProduct ?? {})]);
    return Object.fromEntries(
      [...codes].map((code) => {
        const a = A.finishedGoodsByProduct?.[code] ?? { quantity: 0, unitCost: 0 };
        const t = T.finishedGoodsByProduct?.[code];
        return [code, t && t.quantity > 0 ? addToStock(a, t.quantity, t.unitCost) : a];
      }),
    );
  })();
  const finishedGoods = parReference
    ? Object.values(parReference).reduce((s, l) => (l.quantity > 0 ? addToStock(s, l.quantity, l.unitCost) : s), {
        quantity: 0,
        unitCost: 0,
      })
    : T.finishedGoods.quantity > 0
      ? addToStock(A.finishedGoods, T.finishedGoods.quantity, T.finishedGoods.unitCost)
      : A.finishedGoods;

  const rdByProduct = A.rdByProduct
    ? Object.fromEntries(
        Object.entries(A.rdByProduct).map(([code, a]) => {
          const t = T.rdByProduct?.[code];
          if (!t) return [code, a];
          const lancement =
            a.launchRound === undefined ? t.launchRound : t.launchRound === undefined ? a.launchRound : Math.min(a.launchRound, t.launchRound);
          return [
            code,
            {
              invested: Math.max(a.invested, t.invested),
              launched: a.launched || t.launched,
              ...(lancement !== undefined ? { launchRound: lancement } : {}),
              techLevel: Math.max(a.techLevel, t.techLevel),
            },
          ];
        }),
      )
    : undefined;

  const lastMarketShare: Record<string, number> = { ...A.lastMarketShare };
  for (const [seg, part] of Object.entries(T.lastMarketShare)) lastMarketShare[seg] = Math.min(1, (lastMarketShare[seg] ?? 0) + part);

  const capaA = A.machineCapacity;
  const capaT = T.machineCapacity;
  const prefixe = <M extends { id: string }>(m: M): M => ({ ...m, id: `${T.id}:${m.id}` });
  const duree = scenario.finance.loanDurationRounds;
  const hr = scenario.hr;
  const fixes = scenario.fixedCostsPerRound;
  const gA = A.groupe!;
  const gT = T.groupe!;
  return {
    ...A,
    machineCapacity: capaA + capaT,
    availability: capaA + capaT > 0 ? (A.availability * capaA + T.availability * capaT) / (capaA + capaT) : A.availability,
    headcount: A.headcount + T.headcount,
    productivity:
      A.headcount + T.headcount > 0
        ? (A.productivity * A.headcount + T.productivity * T.headcount) / (A.headcount + T.headcount)
        : A.productivity,
    finishedGoods,
    ...(parReference ? { finishedGoodsByProduct: parReference } : {}),
    ...(A.fleet || T.fleet ? { fleet: [...(A.fleet ?? []), ...(T.fleet ?? [])] } : {}),
    ...(A.pendingFleet || T.pendingFleet ? { pendingFleet: [...(A.pendingFleet ?? []), ...(T.pendingFleet ?? [])] } : {}),
    ...(A.machineFleet || T.machineFleet
      ? { machineFleet: [...(A.machineFleet ?? []), ...(T.machineFleet ?? []).map(prefixe)] }
      : {}),
    ...(A.pendingMachineFleet || T.pendingMachineFleet
      ? { pendingMachineFleet: [...(A.pendingMachineFleet ?? []), ...(T.pendingMachineFleet ?? []).map(prefixe)] }
      : {}),
    ...(somme(A.pendingCapacity, T.pendingCapacity) !== undefined ? { pendingCapacity: somme(A.pendingCapacity, T.pendingCapacity) } : {}),
    ...(somme(A.extraDepreciationPerRound, T.extraDepreciationPerRound) !== undefined
      ? { extraDepreciationPerRound: somme(A.extraDepreciationPerRound, T.extraDepreciationPerRound) }
      : {}),
    ...(somme(A.pendingDepreciationPerRound, T.pendingDepreciationPerRound) !== undefined
      ? { pendingDepreciationPerRound: somme(A.pendingDepreciationPerRound, T.pendingDepreciationPerRound) }
      : {}),
    ...(rdByProduct ? { rdByProduct } : {}),
    lastMarketShare,
    loans: [
      ...(A.loans ?? []),
      ...(T.loans ?? []),
      ...(args.emprunt > 0 && duree !== undefined ? [{ remaining: args.emprunt, perRound: args.emprunt / duree }] : []),
    ],
    finance,
    groupe: {
      ...gA,
      actions: gA.actions + args.actionsEmises,
      ...(args.apport > 0 || gA.apports !== undefined ? { apports: (gA.apports ?? 0) + args.apport } : {}),
      ebe: proForma(gA.ebe, gT.ebe),
      discretionnaires: proForma(gA.discretionnaires, gT.discretionnaires),
      rachats: [
        ...gA.rachats,
        {
          cible: T.id,
          nom: T.name,
          tour: args.roundIndex,
          prix: args.prix,
          actifNet: fT.equity,
          ecart: args.ecart,
          paiement: args.paiement,
          actionsEmises: args.actionsEmises,
          structure: fixes - (hr ? hr.includedHeadcount * hr.salaryPerEmployeePerRound : 0),
          synergie: (scenario.groupe!.rachat?.synergieDeStructure ?? 0) * fixes,
          effectifInclus: hr?.includedHeadcount ?? 0,
          effectifMax: hr?.maxHeadcount ?? 0,
        },
      ],
    },
  };
}

/** La cible, une fois absorbée : une ligne d'équipe qui ne joue plus. */
function absorbee(T: CompanyState, par: string, tour: number): CompanyState {
  return {
    id: T.id,
    name: T.name,
    controller: T.controller,
    ...(T.botProfile !== undefined ? { botProfile: T.botProfile } : {}),
    status: "absorbee",
    absorption: { par, tour },
    perceivedQuality: T.perceivedQuality,
    machineCapacity: 0,
    availability: T.availability,
    headcount: 0,
    hoursPerEmployee: T.hoursPerEmployee,
    productivity: T.productivity,
    finishedGoods: { quantity: 0, unitCost: 0 },
    finance: {
      fixedAssetsNet: 0,
      inventoryValue: 0,
      receivables: 0,
      cash: 0,
      equity: 0,
      financialDebt: 0,
      payables: 0,
      overdraft: 0,
    },
    lastMarketShare: {},
  };
}

/** Structure reprise par tour : charges des sociétés absorbées, synergies déduites dès le tour qui suit. */
export function structureReprise(state: CompanyState, roundIndex: number): number {
  return (state.groupe?.rachats ?? []).reduce((s, r) => s + r.structure - (roundIndex > r.tour ? r.synergie : 0), 0);
}

export interface RachatsDuTour {
  companies: CompanyState[];
  operations: Record<string, OperationDOuverture>;
  rapports: Record<string, ResultatDuRachat>;
}

interface Offre {
  idA: string;
  A: CompanyState;
  T: CompanyState;
  d: NonNullable<RoundDecisions["rachat"]>;
  valeurs: PrixDeCession;
  paiement: "numeraire" | "titres";
  titres: number;
  emprunt: number;
  augmentation: number;
  numeraire: number;
  /** Actions remises aux actionnaires de la cible (paiement en titres). */
  actionsEmises: number;
  /** Ce que les investisseurs entrants détiendront : leur apport, majoré de la décote. */
  apport: number;
  vA: number;
}

/**
 * LES RACHATS DU JOUR 1, ET L'ENCHÈRE.
 *
 * Chaque offre est d'abord jugée seule (tour, cible, prix maximum, trésorerie,
 * plafond de la banque, découvert, contrôle). Puis, cible par cible, la plus
 * haute offre recevable l'emporte, au prix demandé par le vendeur ; deux plus
 * hautes offres égales, et personne ne l'emporte. Les autres ne paient rien et
 * leur résultat dit pourquoi. Les rachats gagnants se font dans l'ordre des
 * acquéreurs ; chacun laisse au moins un concurrent sur le marché.
 */
export function executerLesRachats(args: {
  scenario: EngineScenarioConfig;
  roundIndex: number;
  companies: CompanyState[];
  decisions: Record<string, RoundDecisions>;
  /** Valeur de chaque entreprise à l'ouverture (prix d'émission des actions remises). */
  ouverture: Map<string, ValeurDeLEntreprise>;
}): RachatsDuTour {
  const { scenario, roundIndex } = args;
  const cfg = scenario.groupe?.rachat;
  const out: RachatsDuTour = { companies: args.companies, operations: {}, rapports: {} };
  if (!cfg) return out;
  const parId = new Map(args.companies.map((c) => [c.id, c]));
  const acquereurs = args.companies
    .filter((c) => args.decisions[c.id]?.rachat)
    .map((c) => c.id)
    .sort((a, b) => a.localeCompare(b));
  const refuse = (idA: string, cible: string, motif: string) => {
    out.rapports[idA] = { statut: "refuse", motif, cible, nom: parId.get(cible)?.name ?? cible };
  };

  // 1. Chaque offre, jugée seule.
  const offres: Offre[] = [];
  for (const idA of acquereurs) {
    const d = args.decisions[idA]!.rachat!;
    const A = parId.get(idA)!;
    const T = parId.get(d.cible);
    if (roundIndex < cfg.tourMin) {
      refuse(idA, d.cible, `Un rachat se décide à partir du tour ${cfg.tourMin} : il faut des comptes pour fixer un prix.`);
      continue;
    }
    if (roundIndex >= scenario.roundsCount) {
      refuse(idA, d.cible, "Un rachat au dernier tour ne se jugerait sur rien.");
      continue;
    }
    if (!actif(A) || !A.groupe) {
      refuse(idA, d.cible, "Une entreprise en défaillance ne rachète pas.");
      continue;
    }
    if (!T || T.id === A.id || T.controller !== "bot" || T.status === "absorbee" || !T.groupe) {
      refuse(idA, d.cible, "Cette entreprise n'est pas à vendre.");
      continue;
    }
    const valeurs = prixDeCession(T, scenario);
    const prix = valeurs.prix;
    if (prix > d.prixMaximum + 1e-6) {
      refuse(idA, d.cible, `Le vendeur demande ${Math.round(prix)} €, au-delà de votre prix maximum.`);
      continue;
    }
    const vA = args.ouverture.get(A.id)?.valeurParAction ?? 0;
    const paiement = d.paiement === "titres" ? "titres" : "numeraire";
    const titres = paiement === "titres" ? prix : 0;
    const emprunt = paiement === "titres" ? 0 : Math.max(0, d.emprunt ?? 0);
    const augmentation = paiement === "titres" ? 0 : Math.max(0, d.augmentationDeCapital ?? 0);
    if ((titres > 0 || augmentation > 0) && vA <= 0) {
      refuse(idA, d.cible, "Vos actions ne valent rien : personne n'en achète.");
      continue;
    }
    // Le contrôle se juge à la valeur d'ouverture : actions remises, et ce que
    // les investisseurs entrants détiendraient à ce prix.
    const actionsEmises = titres > 0 ? titres / vA : 0;
    const apport = augmentation > 0 ? augmentation / (1 - cfg.decoteDEmission) : 0;
    const g = A.groupe;
    const actionsInitiales = scenario.groupe!.valorisation.actionsInitiales;
    const equivalent = actionsEmises + ((g.apports ?? 0) + apport) / vA;
    if (actionsInitiales / (g.actions + equivalent) < cfg.seuilDeControle - 1e-9) {
      refuse(idA, d.cible, "Vous émettriez tant d'actions que vous perdriez le contrôle de l'entreprise.");
      continue;
    }
    const numeraire = Math.max(0, prix - titres - emprunt - augmentation);
    if (numeraire > Math.max(0, A.finance.cash) + 0.005) {
      refuse(idA, d.cible, "Votre trésorerie ne couvre pas la part du prix que ni l'emprunt ni les investisseurs ne financent.");
      continue;
    }
    const ratioMax = scenario.finance.maxDebtToEquity;
    if (ratioMax !== undefined && emprunt > 0) {
      const plafond = ratioMax * (A.finance.equity + augmentation + titres) - (A.finance.financialDebt + T.finance.financialDebt);
      if (emprunt > plafond + 0.005) {
        refuse(
          idA,
          d.cible,
          `La banque ne prête pas plus de ${Math.max(0, Math.round(plafond))} € pour ce rachat : la dette dépasserait ${ratioMax} fois les capitaux propres.`,
        );
        continue;
      }
    }
    const bank = scenario.finance.bank;
    const limite = bank
      ? conditionsBancaires(
          confianceServie(A, scenario),
          { overdraftLimit: scenario.finance.overdraftLimit, overdraftAnnualRate: scenario.finance.overdraftAnnualRate },
          bank,
        ).overdraftLimit
      : scenario.finance.overdraftLimit;
    const netApres =
      A.finance.cash - A.finance.overdraft + (T.finance.cash - T.finance.overdraft) + emprunt + augmentation - (prix - titres);
    if (netApres < -limite - 0.005) {
      refuse(idA, d.cible, "Après le rachat, votre découvert dépasserait ce que la banque autorise : empruntez de quoi le couvrir.");
      continue;
    }
    offres.push({ idA, A, T, d, valeurs, paiement, titres, emprunt, augmentation, numeraire, actionsEmises, apport, vA });
  }

  // 2. L'enchère : cible par cible, la plus haute offre l'emporte ; à égalité, personne.
  const gagnantes: Offre[] = [];
  const parCible = new Map<string, Offre[]>();
  for (const o of offres) parCible.set(o.T.id, [...(parCible.get(o.T.id) ?? []), o]);
  for (const [, lot] of parCible) {
    const haute = Math.max(...lot.map((o) => o.d.prixMaximum));
    const enTete = lot.filter((o) => o.d.prixMaximum === haute);
    for (const o of lot) {
      if (enTete.length > 1 && o.d.prixMaximum === haute) {
        refuse(o.idA, o.T.id, "Deux acquéreurs ont fait la même offre : le vendeur n'a cédé à aucun.");
      } else if (o.d.prixMaximum < haute) {
        refuse(o.idA, o.T.id, "Un autre acquéreur a fait une meilleure offre.");
      }
    }
    if (enTete.length === 1) gagnantes.push(enTete[0]!);
  }

  // 3. Les rachats gagnants, dans l'ordre des acquéreurs.
  const prises = new Set<string>();
  for (const o of gagnantes.sort((a, b) => a.idA.localeCompare(b.idA))) {
    const { A, T, valeurs, paiement, titres, emprunt, augmentation, numeraire, actionsEmises, apport, vA } = o;
    const restants = args.companies.filter(
      (c) => c.id !== A.id && c.id !== T.id && actif(c) && !prises.has(c.id),
    );
    if (restants.length === 0) {
      refuse(o.idA, T.id, "Il doit rester au moins un concurrent sur le marché.");
      continue;
    }
    const prix = valeurs.prix;
    const ecart = prix - T.finance.equity;
    parId.set(
      A.id,
      fusionner({ A, T, scenario, roundIndex, prix, ecart, emprunt, augmentation, titres, actionsEmises, apport, paiement }),
    );
    parId.set(T.id, absorbee(T, A.id, roundIndex));
    prises.add(T.id);
    const synergie = (cfg.synergieDeStructure ?? 0) * scenario.fixedCostsPerRound;
    const frais = cfg.fraisDeTransaction * prix;
    const integration = cfg.coutDIntegration * toursParAn(scenario.roundDays) * synergie;
    const netT = T.finance.cash - T.finance.overdraft;
    out.operations[A.id] = {
      flux: [
        ...(prix - titres > 0 ? [{ label: "rachat_prix_paye", amount: -(prix - titres) }] : []),
        ...(netT !== 0 ? [{ label: "rachat_tresorerie_acquise", amount: netT }] : []),
        ...(emprunt > 0 ? [{ label: "emprunt_d_acquisition", amount: emprunt }] : []),
        ...(augmentation > 0 ? [{ label: "augmentation_capital_investisseurs", amount: augmentation }] : []),
      ],
      chargesDeRachat: frais + integration,
      actionsEmises,
    };
    out.rapports[A.id] = {
      statut: "conclu",
      cible: T.id,
      nom: T.name,
      valeurs,
      prix,
      ecart,
      paiement,
      financement: {
        numeraire,
        emprunt,
        augmentation,
        titres,
        actionsEmises,
        ...(paiement === "titres"
          ? {
              parite:
                valoriser({
                  groupe: T.groupe!,
                  finance: T.finance,
                  roundDays: scenario.roundDays,
                  multiple: scenario.groupe!.valorisation.multipleEBE,
                }).valeurCapitauxPropres /
                Math.max(1, T.groupe!.actions) /
                vA,
            }
          : {}),
      },
      frais,
      integration,
    };
  }
  out.companies = args.companies.map((c) => parId.get(c.id)!);
  return out;
}
