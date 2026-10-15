import type { CompanyState, EngineScenarioConfig, LoanLine } from "../types";

/**
 * LES EFFETS DES MODULES GARDÉS QUE LE MOTEUR CALCULE À PART.
 *
 * Les programmes de R&D se paient à chaque tour de travaux et agissent une
 * fois achevés ; les lignes d'emprunt à taux propre, tirées sur les options de
 * financement avant leur retrait, se remboursent et portent intérêt à leur
 * taux. Les fonctions sont pures et branchées dans `simulation/index.ts`.
 *
 * UN MODULE QUI N'EST PAS CHOISI NE CHANGE RIEN : chaque fonction rend alors
 * des effets nuls, et le moteur garde au bit près le calcul d'avant.
 */

/** Plafonds cumulés : aucun empilement d'effets ne fait un effet absurde. */
export const PLAFONDS = {
  /** Qualité produite gagnée (programmes R&D). */
  qualite: 0.2,
  /** Attractivité gagnée (programmes R&D). */
  attractivite: 0.5,
  /** Baisse d'un coût variable (programmes R&D). */
  coutVariable: 0.5,
} as const;

const plafond = (x: number, max: number) => Math.min(max, Math.max(0, x));

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

// ─── Lignes d'emprunt à taux propre ─────────────────────────────────────────

/**
 * L'encours et les intérêts du tour des lignes à taux propre, sur l'état
 * d'ouverture. Les options de financement ne se tirent plus ; les lignes déjà
 * tirées d'une partie en cours gardent leur taux jusqu'à leur dernière échéance.
 */
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
