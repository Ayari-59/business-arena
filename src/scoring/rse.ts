import type { CompanyRoundResult } from "@/engine/types";

/**
 * INDICE RSE — LOT 1 : UNE MESURE, PAS ENCORE UN LEVIER.
 *
 * Cet indice LIT le résultat d'un tour et en dérive une lecture
 * environnement / social / gouvernance (ESG). Il n'influe sur RIEN : ni le
 * marché, ni les événements, ni le classement, ni le BPI. C'est une prise de
 * conscience — l'élève VOIT l'empreinte RSE des décisions qu'il a déjà prises
 * (fournisseur, rebuts, salaires, formation, transparence du plan). Les effets
 * de jeu (image, risque, financement) viendront au Lot 2.
 *
 * Conséquence de ce choix : le module est PUR et se calcule à la lecture, à
 * partir du seul résultat persisté. Aucun champ moteur, aucune migration.
 *
 * Chaque pilier part d'une base neutre (50) et bouge selon les signaux
 * disponibles. Un pilier qu'aucun signal du scénario n'alimente reste à 50 et
 * se déclare `evaluated: false` : on ne récompense ni ne punit une dimension
 * que le scénario ne met pas en jeu (pas de RH, pas de banque…).
 */

export interface RsePillar {
  /** Note du pilier, 0–100 (50 = neutre). */
  score: number;
  /** Un signal du scénario alimente-t-il ce pilier ? Sinon la note reste neutre. */
  evaluated: boolean;
}

export interface RseIndex {
  /** Indice global 0–100 (moyenne des trois piliers). */
  score: number;
  environment: RsePillar;
  social: RsePillar;
  governance: RsePillar;
  /** Faits saillants, en clair, pour le débriefing (au plus quelques-uns). */
  notes: string[];
}

const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));
const round = (v: number): number => Math.round(v);

/**
 * ENVIRONNEMENT : sourcing responsable (bonus qualité du fournisseur, absence
 * de rupture), maîtrise des rebuts et des retours, effort de prévention.
 */
function environment(r: CompanyRoundResult, notes: string[]): RsePillar {
  let score = 50;
  let evaluated = false;

  if (r.supplier) {
    evaluated = true;
    // qualityBonus est une fraction (±0,05 = ±5 %). Un fournisseur mieux-disant
    // sur la qualité sert de proxy « approvisionnement responsable ».
    score += clamp(r.supplier.qualityBonus * 200, -20, 20);
    if (r.supplier.qualityBonus > 0.001) notes.push("Approvisionnement de meilleure qualité");
    if (r.supplier.supplyDisruption) {
      score -= 15;
      notes.push("Rupture d'approvisionnement");
    }
  }

  if (r.qualityCosts) {
    evaluated = true;
    const produced = Math.max(1, r.production?.produced ?? 0);
    const defectRate = r.qualityCosts.defectUnits / produced;
    score -= clamp(defectRate * 100 * 2, 0, 25); // 5 % de rebuts → −10
    if (defectRate > 0.05) notes.push("Rebuts élevés");
    if (r.qualityCosts.prevention > 0) score += 5;
  }

  return { score: round(clamp(score)), evaluated };
}

/**
 * SOCIAL : rémunération face au marché, effort de formation, climat (les
 * démissions signalent un climat dégradé — elles surviennent quand le salaire
 * passe sous le seuil d'attrition).
 */
function social(r: CompanyRoundResult, notes: string[]): RsePillar {
  if (!r.hr) return { score: 50, evaluated: false };
  let score = 50;

  // salaryIndex : 1 = salaire de marché. Au-dessus = mieux-disant social.
  score += clamp((r.hr.salaryIndex - 1) * 100, -20, 20);
  if (r.hr.salaryIndex < 0.98) notes.push("Salaires sous le marché");
  else if (r.hr.salaryIndex > 1.02) notes.push("Salaires au-dessus du marché");

  if (r.hr.trainingBudget > 0) {
    score += 10;
    notes.push("Effort de formation");
  }
  if (r.hr.departed > 0) {
    score -= clamp(r.hr.departed * 10, 0, 20);
    notes.push("Départs (climat social)");
  }

  return { score: round(clamp(score)), evaluated: true };
}

/**
 * GOUVERNANCE : transparence (un plan de trésorerie accompagne-t-il les
 * décisions ?), fiabilité de ce plan, et prudence financière (une crise de
 * trésorerie caractérisée est un défaut de pilotage).
 */
function governance(r: CompanyRoundResult, notes: string[]): RsePillar {
  let score = 50;
  let evaluated = false;

  if (r.bank) {
    evaluated = true;
    if (r.bank.planFiled) {
      score += 15;
      if (r.bank.reliability !== null) score += clamp(r.bank.reliability * 20, 0, 20);
    } else {
      score -= 10;
      notes.push("Plan de trésorerie non déposé");
    }
  }

  if (r.treasury?.crisis) {
    evaluated = true;
    score -= 15;
    notes.push("Crise de trésorerie (imprudence)");
  }

  return { score: round(clamp(score)), evaluated };
}

/**
 * Indice RSE d'un tour, dérivé de son seul résultat. L'indice global est la
 * moyenne des trois piliers (les piliers non évalués comptent pour leur valeur
 * neutre, 50 — ni bonus ni malus).
 */
export function computeRseIndex(r: CompanyRoundResult): RseIndex {
  const notes: string[] = [];
  const e = environment(r, notes);
  const s = social(r, notes);
  const g = governance(r, notes);
  const score = round((e.score + s.score + g.score) / 3);
  return { score, environment: e, social: s, governance: g, notes: notes.slice(0, 5) };
}
