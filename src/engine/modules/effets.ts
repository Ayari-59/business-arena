import { createRng, deriveRoundSeed, type SeededRng } from "../random";
import type {
  AdvancedHRConfig,
  AdvancedHREffects,
  CommercialActionEffects,
  CommercialActionsConfig,
  CompanyState,
  EngineScenarioConfig,
  LoanLine,
  RoundDecisions,
  SupplierNegotiationConfig,
  TrainingProgramEffects,
  TrainingProgramsConfig,
} from "../types";

/**
 * LES EFFETS DES MODULES QUE LE MOTEUR NE FAISAIT QUE PAYER.
 *
 * Formation, politiques RH, actions commerciales, contrats fournisseurs,
 * programmes R&D et options de financement : leur coût tombait, leur effet
 * jamais (ou à moitié). Chaque fonction ici dit, pour un tour, ce que le
 * module coûte, ce qu'il fait et ce qui en reste pour le tour suivant. Elles
 * sont pures et branchées dans `simulation/index.ts`, chacune au même endroit
 * que le levier existant qu'elle prolonge (productivité, départs, attraction,
 * coût matières, R&D, tableau d'emprunts).
 *
 * UN MODULE QUI N'EST PAS CHOISI NE CHANGE RIEN : chaque fonction rend alors
 * des effets nuls, et le moteur garde au bit près le calcul d'avant.
 *
 * Les durées se comptent en tours d'effet : un élément de durée N lancé au
 * tour t court les tours t à t+N−1, son coût et son effet avec. Ce qui reste
 * à courir se range dans l'état sous `remainingRounds` (tours restants après
 * celui-ci).
 */

/**
 * L'identifiant réservé d'une intervention de maintenance sur TOUT l'outil de
 * production (`RoundDecisions.maintenanceDecisions`).
 */
export const MACHINE_ATELIER = "atelier";

/** Plafonds cumulés : aucun empilement de modules ne fait un effet absurde. */
export const PLAFONDS = {
  /** Productivité gagnée par la formation et les politiques RH, ensemble. */
  productivite: 0.3,
  /** Heures gagnées sur l'absentéisme. */
  absenteisme: 0.3,
  /** Allègement du seuil de départ volontaire (formation et politiques RH). */
  departs: 0.5,
  /** Baisse du coût d'une embauche. */
  embauche: 0.5,
  /** Qualité produite gagnée (formation et R&D). */
  qualite: 0.2,
  /** Attractivité gagnée par un module (actions commerciales, R&D). */
  attractivite: 0.5,
  /** Fidélité ajoutée au coefficient du segment. */
  fidelite: 0.5,
  /** Conquête de nouveaux clients. */
  conquete: 0.5,
  /** Remise consentie sur le prix facturé (actions commerciales). */
  remise: 0.5,
  /** Baisse d'un coût variable par contrat ou R&D. */
  coutVariable: 0.5,
  /** Baisse du risque de rupture d'approvisionnement. */
  risque: 0.9,
} as const;

const plafond = (x: number, max: number) => Math.min(max, Math.max(0, x));

/**
 * LA PERTE D'UNE CRISE : la part du chiffre d'affaires du tour qu'une crise
 * emporte, avant la protection d'un plan qui la couvre et le rebond de la
 * marque. Lue aussi par l'offre, qui l'annonce : jamais écrite à la main.
 */
export const PERTE_DE_CRISE = 0.1;

/**
 * La graine dédiée de la crise d'une entreprise : dérivée de la graine de la
 * partie, du tour et de TOUT l'identifiant de l'entreprise. Le tirage ne
 * consomme rien du flux principal (événements, marché, ruptures) : une partie
 * sans crise garde ses tirages au bit près.
 */
export function rngDeCrise(seed: number, roundIndex: number, companyId: string): SeededRng {
  let h = 0x6372;
  for (let i = 0; i < companyId.length; i++) h = Math.imul(h ^ companyId.charCodeAt(i), 0x01000193) >>> 0;
  return createRng(deriveRoundSeed((seed ^ h) >>> 0, roundIndex));
}

/** La graine dédiée des remises en service (maintenance curative). */
export function rngDeMaintenance(seed: number, roundIndex: number, companyId: string): SeededRng {
  let h = 0x6d61;
  for (let i = 0; i < companyId.length; i++) h = Math.imul(h ^ companyId.charCodeAt(i), 0x01000193) >>> 0;
  return createRng(deriveRoundSeed((seed ^ h) >>> 0, roundIndex));
}

// ─── Formation ──────────────────────────────────────────────────────────────

export interface FormationDuTour {
  cout: number;
  /** Effets en vigueur ce tour, au prorata de l'effectif formé. */
  effets: TrainingProgramEffects;
  suivants: { programId: string; enrolledCount: number; remainingRounds: number }[];
}

const ZERO_FORMATION = (): TrainingProgramEffects => ({
  productivityBonus: 0,
  attritionReduction: 0,
  qualityBonus: 0,
  safetyBonus: 0,
  maintenanceSaving: 0,
});

/**
 * La formation du tour : les programmes en cours, plus les inscriptions du
 * tour. On ne forme pas plus de monde que l'effectif, ni plus que le plafond
 * du programme ; l'effet se proportionne à la part de l'effectif formée (un
 * programme qui forme toute l'équipe donne tout son effet).
 */
export function formationDuTour(args: {
  cfg: TrainingProgramsConfig | undefined;
  enCours: CompanyState["activeTrainingPrograms"];
  inscriptions: RoundDecisions["trainingEnrollments"];
  effectif: number;
}): FormationDuTour {
  const effets = ZERO_FORMATION();
  const suivants: FormationDuTour["suivants"] = [];
  let cout = 0;
  const { cfg } = args;
  if (!cfg) return { cout, effets, suivants };
  const effectif = Math.max(1, args.effectif);
  const courent: { def: TrainingProgramsConfig["programs"][number]; count: number; reste: number }[] = [];
  for (const p of args.enCours ?? []) {
    const def = cfg.programs.find((x) => x.id === p.programId);
    if (!def || p.remainingRounds <= 0) continue;
    courent.push({ def, count: Math.min(p.enrolledCount, effectif), reste: p.remainingRounds - 1 });
  }
  for (const ins of args.inscriptions ?? []) {
    if (courent.some((c) => c.def.id === ins.programId)) continue;
    if (courent.length >= cfg.maxConcurrentPrograms) continue;
    const def = cfg.programs.find((x) => x.id === ins.programId);
    if (!def) continue;
    const count = Math.min(Math.max(0, Math.floor(ins.enrolledCount)), def.maxEmployeesPerRound, effectif);
    if (count <= 0) continue;
    courent.push({ def, count, reste: def.durationRounds - 1 });
  }
  for (const c of courent) {
    cout += c.count * c.def.costPerEmployee;
    const part = c.count / effectif;
    effets.productivityBonus += c.def.effects.productivityBonus * part;
    effets.attritionReduction += c.def.effects.attritionReduction * part;
    effets.qualityBonus += c.def.effects.qualityBonus * part;
    effets.safetyBonus += c.def.effects.safetyBonus * part;
    // L'entretien économisé est un montant : il ne se proportionne pas.
    effets.maintenanceSaving += c.def.effects.maintenanceSaving;
    if (c.reste > 0) suivants.push({ programId: c.def.id, enrolledCount: c.count, remainingRounds: c.reste });
  }
  effets.productivityBonus = plafond(effets.productivityBonus, PLAFONDS.productivite);
  effets.attritionReduction = plafond(effets.attritionReduction, PLAFONDS.departs);
  effets.qualityBonus = plafond(effets.qualityBonus, PLAFONDS.qualite);
  return { cout, effets, suivants };
}

// ─── Politiques RH avancées ─────────────────────────────────────────────────

/** Les effets des politiques déployées à l'ouverture (implémentation achevée). */
export function politiquesRhEnVigueur(
  cfg: AdvancedHRConfig | undefined,
  actives: CompanyState["activeHRPolicies"],
): AdvancedHREffects {
  const eff: AdvancedHREffects = { attritionReduction: 0, productivityBonus: 0, recruitmentBonus: 0, absenteeismReduction: 0 };
  if (!cfg) return eff;
  for (const hp of actives ?? []) {
    const def = cfg.policies.find((p) => p.id === hp.id);
    if (!def || hp.roundsActive < def.implementationRounds) continue;
    eff.attritionReduction = Math.min(0.5, eff.attritionReduction + def.effects.attritionReduction);
    eff.productivityBonus = Math.min(0.3, eff.productivityBonus + def.effects.productivityBonus);
    eff.recruitmentBonus = Math.min(0.5, eff.recruitmentBonus + def.effects.recruitmentBonus);
    eff.absenteeismReduction = Math.min(0.3, eff.absenteeismReduction + def.effects.absenteeismReduction);
  }
  return eff;
}

/**
 * Ce que la formation et les politiques RH font au modèle RH, plafonds
 * cumulés appliqués. Tout à zéro sans module : le calcul RH d'avant.
 */
export function leviersRh(formation: TrainingProgramEffects, rh: AdvancedHREffects) {
  return {
    /** Productivité du tour : × (1 + bonus). */
    productivite: plafond(formation.productivityBonus + rh.productivityBonus, PLAFONDS.productivite),
    /** Heures réellement travaillées : × (1 + bonus). */
    absenteisme: plafond(rh.absenteeismReduction, PLAFONDS.absenteisme),
    /** Allègement du seuil de départ volontaire, ajouté à ceux de la RSE et de l'H&S. */
    departs: plafond(formation.attritionReduction + rh.attritionReduction, PLAFONDS.departs),
    /** Coût d'une embauche : × (1 − bonus). */
    embauche: plafond(rh.recruitmentBonus, PLAFONDS.embauche),
  };
}

// ─── Actions commerciales ───────────────────────────────────────────────────

export interface ActionsCommercialesDuTour {
  cout: number;
  effets: CommercialActionEffects;
  suivantes: { id: string; remainingRounds: number }[];
}

/**
 * Les actions commerciales du tour : celles qui courent et celles lancées ce
 * tour, dans la limite des actions menées de front. Une action reconduite
 * (`isRecurring`) repart à chaque échéance jusqu'à ce qu'on l'arrête.
 */
export function actionsCommercialesDuTour(args: {
  cfg: CommercialActionsConfig | undefined;
  enCours: CompanyState["activeCommercialActions"];
  lancees: string[] | undefined;
}): ActionsCommercialesDuTour {
  const effets: CommercialActionEffects = { demandBonus: 0, loyaltyBonus: 0, marginImpact: 0, imageBonus: 0, newClientRatio: 0 };
  const suivantes: ActionsCommercialesDuTour["suivantes"] = [];
  let cout = 0;
  const { cfg } = args;
  if (!cfg) return { cout, effets, suivantes };
  const courent: { def: CommercialActionsConfig["actions"][number]; reste: number }[] = [];
  for (const a of args.enCours ?? []) {
    const def = cfg.actions.find((x) => x.id === a.id);
    if (!def || a.remainingRounds <= 0) continue;
    courent.push({ def, reste: a.remainingRounds - 1 });
  }
  for (const id of args.lancees ?? []) {
    if (courent.some((c) => c.def.id === id)) continue;
    if (courent.length >= cfg.maxActionsPerRound) continue;
    const def = cfg.actions.find((x) => x.id === id);
    if (!def) continue;
    courent.push({ def, reste: def.durationRounds - 1 });
  }
  for (const c of courent) {
    cout += c.def.costPerRound;
    effets.demandBonus += c.def.effects.demandBonus;
    effets.loyaltyBonus += c.def.effects.loyaltyBonus;
    effets.marginImpact += c.def.effects.marginImpact;
    effets.imageBonus += c.def.effects.imageBonus;
    effets.newClientRatio += c.def.effects.newClientRatio;
    if (c.reste > 0) suivantes.push({ id: c.def.id, remainingRounds: c.reste });
    else if (c.def.isRecurring) suivantes.push({ id: c.def.id, remainingRounds: c.def.durationRounds });
  }
  effets.demandBonus = Math.max(-0.5, Math.min(PLAFONDS.attractivite, effets.demandBonus));
  effets.imageBonus = Math.max(-0.5, Math.min(PLAFONDS.attractivite, effets.imageBonus));
  effets.loyaltyBonus = plafond(effets.loyaltyBonus, PLAFONDS.fidelite);
  effets.newClientRatio = plafond(effets.newClientRatio, PLAFONDS.conquete);
  effets.marginImpact = -plafond(-effets.marginImpact, PLAFONDS.remise);
  return { cout, effets, suivantes };
}

// ─── Contrats fournisseurs ──────────────────────────────────────────────────

export interface ContratsDuTour {
  /** Remise sur les matières (contrats « matiere »). */
  remiseMatieres: number;
  /** Remise sur les autres charges variables (énergie, logistique, sous-traitance). */
  remiseAutres: number;
  /** Baisse de la probabilité de rupture d'approvisionnement. */
  risque: number;
  /** Contrats en vigueur ce tour. */
  enVigueur: string[];
  suivants: { id: string; remainingRounds: number }[];
}

/**
 * Les contrats fournisseurs : ceux qui courent et ceux signés ce tour. La
 * remise n'est due qu'aux tours où la production atteint le volume
 * d'engagement du contrat ; la sécurisation de l'approvisionnement, elle, vaut
 * tant que le contrat court. Un contrat ne s'arrête pas avant son terme.
 */
export function contratsDuTour(args: {
  cfg: SupplierNegotiationConfig | undefined;
  enCours: CompanyState["activeSupplierContracts"];
  signes: string[] | undefined;
}): Omit<ContratsDuTour, "remiseMatieres" | "remiseAutres"> & {
  remises: (production: number) => { remiseMatieres: number; remiseAutres: number; appliques: string[] };
} {
  const suivants: ContratsDuTour["suivants"] = [];
  const { cfg } = args;
  if (!cfg)
    return { risque: 0, enVigueur: [], suivants, remises: () => ({ remiseMatieres: 0, remiseAutres: 0, appliques: [] }) };
  const courent: { def: SupplierNegotiationConfig["contracts"][number]; reste: number }[] = [];
  for (const c of args.enCours ?? []) {
    const def = cfg.contracts.find((x) => x.id === c.id);
    if (!def || c.remainingRounds <= 0) continue;
    courent.push({ def, reste: c.remainingRounds - 1 });
  }
  for (const id of args.signes ?? []) {
    if (courent.some((c) => c.def.id === id)) continue;
    if (courent.length >= cfg.maxActiveContracts) continue;
    const def = cfg.contracts.find((x) => x.id === id);
    if (!def) continue;
    courent.push({ def, reste: def.contractDurationRounds - 1 });
  }
  let resteSansRisque = 1;
  for (const c of courent) {
    resteSansRisque *= 1 - c.def.supplyRiskReduction;
    if (c.reste > 0) suivants.push({ id: c.def.id, remainingRounds: c.reste });
  }
  return {
    risque: plafond(1 - resteSansRisque, PLAFONDS.risque),
    enVigueur: courent.map((c) => c.def.id),
    suivants,
    remises: (production: number) => {
      let remiseMatieres = 0;
      let remiseAutres = 0;
      const appliques: string[] = [];
      for (const c of courent) {
        if (production < c.def.volumeThreshold) continue;
        appliques.push(c.def.id);
        if (c.def.supplierType === "matiere") remiseMatieres += c.def.discountRate;
        else remiseAutres += c.def.discountRate;
      }
      return {
        remiseMatieres: plafond(remiseMatieres, PLAFONDS.coutVariable),
        remiseAutres: plafond(remiseAutres, PLAFONDS.coutVariable),
        appliques,
      };
    },
  };
}

// ─── Programmes R&D ─────────────────────────────────────────────────────────

type RdActions = NonNullable<EngineScenarioConfig["rdActions"]>;

export interface EffetsRd {
  costReduction: number;
  qualityBonus: number;
  imageBonus: number;
}

/** Les effets des programmes achevés à l'ouverture : ils durent toute la partie. */
export function rdEnVigueur(cfg: RdActions | undefined, acheves: string[] | undefined): EffetsRd {
  const eff: EffetsRd = { costReduction: 0, qualityBonus: 0, imageBonus: 0 };
  if (!cfg) return eff;
  for (const id of acheves ?? []) {
    const def = cfg.actions.find((a) => a.id === id);
    if (!def) continue;
    eff.costReduction += def.effects.costReduction;
    eff.qualityBonus += def.effects.qualityBonus;
    eff.imageBonus += def.effects.imageBonus;
  }
  return {
    costReduction: plafond(eff.costReduction, PLAFONDS.coutVariable),
    qualityBonus: plafond(eff.qualityBonus, PLAFONDS.qualite),
    imageBonus: plafond(eff.imageBonus, PLAFONDS.attractivite),
  };
}

/**
 * Le déroulé d'un programme R&D : il se paie à chaque tour de travaux, et
 * s'achève au bout de sa durée ; ses effets valent dès le tour qui suit.
 */
export function rdDuTour(args: {
  cfg: RdActions | undefined;
  enCours: CompanyState["rdActionsInProgress"];
  acheves: string[] | undefined;
  lances: string[] | undefined;
}): { cout: number; enCours: { id: string; roundsCompleted: number }[]; acheves: string[] } {
  const { cfg } = args;
  const acheves = [...(args.acheves ?? [])];
  const enCours: { id: string; roundsCompleted: number }[] = [];
  let cout = 0;
  if (!cfg) return { cout, enCours: [...(args.enCours ?? [])], acheves };
  const avancer = (id: string, faits: number) => {
    const def = cfg.actions.find((a) => a.id === id);
    if (!def) return;
    cout += def.costPerRound;
    if (faits >= def.durationRounds) {
      if (!acheves.includes(id)) acheves.push(id);
    } else enCours.push({ id, roundsCompleted: faits });
  };
  for (const p of args.enCours ?? []) avancer(p.id, p.roundsCompleted + 1);
  for (const id of args.lances ?? []) {
    if (enCours.some((p) => p.id === id) || acheves.includes(id)) continue;
    if ((args.enCours ?? []).some((p) => p.id === id)) continue;
    if (enCours.length >= cfg.maxSimultaneousProjects) continue;
    avancer(id, 1);
  }
  return { cout, enCours, acheves };
}

// ─── Options de financement ─────────────────────────────────────────────────

type OptionsDeFinancement = NonNullable<EngineScenarioConfig["financingOptions"]>;

/** L'encours d'une option dans le tableau d'emprunts. */
export function encoursDeLOption(loans: LoanLine[] | undefined, optionId: string): number {
  return (loans ?? []).filter((l) => l.optionId === optionId).reduce((t, l) => t + l.remaining, 0);
}

/**
 * Les tirages accordés ce tour : option ouverte à ce tour, montant dans la
 * limite de ce qui reste de l'enveloppe de l'option (son encours déduit), puis
 * dans la limite de ce que la banque prête encore (même plafond d'endettement
 * que l'emprunt ordinaire). Chaque tirage devient une ligne d'emprunt.
 */
export function tiragesDuTour(args: {
  cfg: OptionsDeFinancement | undefined;
  loans: LoanLine[] | undefined;
  demandes: RoundDecisions["financingDraws"];
  roundIndex: number;
  plafondBanque: number;
}): LoanLine[] {
  const { cfg } = args;
  if (!cfg) return [];
  let reste = Math.max(0, args.plafondBanque);
  const lignes: LoanLine[] = [];
  for (const d of args.demandes ?? []) {
    const def = cfg.options.find((o) => o.id === d.optionId);
    if (!def || args.roundIndex < def.availableFromRound) continue;
    if (lignes.some((l) => l.optionId === def.id)) continue;
    const enveloppe = Math.max(0, def.maxAmount - encoursDeLOption(args.loans, def.id));
    const montant = Math.min(Math.max(0, d.amount), enveloppe, reste);
    if (!(montant > 0)) continue;
    reste -= montant;
    lignes.push({
      remaining: montant,
      perRound: montant / def.durationRounds,
      ratePerRound: def.interestRatePerRound,
      optionId: def.id,
    });
  }
  return lignes;
}

/** L'encours et les intérêts du tour des lignes à taux propre, sur l'état d'ouverture. */
export function lignesATauxPropre(loans: LoanLine[] | undefined): { encours: number; interets: number } {
  let encours = 0;
  let interets = 0;
  for (const l of loans ?? []) {
    if (l.ratePerRound === undefined) continue;
    encours += l.remaining;
    interets += l.remaining * l.ratePerRound;
  }
  return { encours, interets };
}
