import type { CompanyRoundResult, EngineScenarioConfig } from "../engine/types";
import type { DetectCode } from "../config/scenarios/nova/situations";
import { formatEuro, formatPercent, formatUnits } from "../lib/format";

/**
 * Détection de situations (doc 03 §1.1) : des règles observent les résultats
 * d'un tour et déclenchent les situations correspondantes pour le tour suivant.
 */
/**
 * CE QU'IL FAUT SAVOIR DU TOUR D'AVANT, et rien de plus.
 *
 * Le redressement ne demande que deux chiffres, et ce sont deux COLONNES de
 * la table des résultats : les réclamer sous forme de `CompanyRoundResult`
 * entier obligerait l'appelant à reconstruire tout un tour depuis sa trace,
 * pour en lire deux nombres.
 */
export interface TourPrecedent {
  netIncome: number;
  netTreasury: number;
}

/**
 * Le tour était-il en difficulté ? Une perte OU une trésorerie nette négative
 * — c'est-à-dire le découvert, que le modèle ouvre exactement quand la
 * trésorerie nette passe sous zéro.
 */
function enDifficulte(t: TourPrecedent): boolean {
  return t.netIncome < 0 || t.netTreasury < 0;
}

export function detectSituations(
  result: CompanyRoundResult,
  /**
   * Décisions ouvertes au niveau joué. Une situation dont l'arbitrage n'est
   * pas jouable ne doit pas s'ouvrir : elle poserait une question dont la
   * réponse n'est nulle part dans le formulaire.
   */
  enabled: { placement?: boolean } = {},
  /**
   * Le tour D'AVANT celui qu'on observe, quand il existe. Un redressement ne
   * se lit pas dans un instantané : il faut savoir d'où l'on vient.
   */
  precedent?: TourPrecedent | null,
): DetectCode[] {
  const detected: DetectCode[] = [];
  const { netIncome } = result.incomeStatement;
  const { netTreasury } = result.functionalBalance;

  if (netIncome > 0 && netTreasury < 0) detected.push("profitable_illiquid");
  if (netIncome < 0) detected.push("below_breakeven");

  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  if (sold > 0 && lost > 0.1 * sold) detected.push("stockout");

  // Atelier saturé : la machine tourne à plein ET de la demande est perdue —
  // le moment exact où la question d'investir (ou de sous-traiter) se pose.
  if (result.production.utilizationRate >= 0.97 && sold > 0 && lost > 0.05 * sold)
    detected.push("capacity_saturated");

  // Trésorerie qui dort : pas de découvert, rien de déjà placé, et un solde
  // qui dépasse une fois et demie les charges de structure du tour. Autrement
  // dit, de quoi tenir plus d'un tour et demi sans rien vendre. Ce n'est pas
  // une panne, c'est un coût d'opportunité, et il ne se voit dans aucun compte.
  if (
    enabled.placement &&
    result.balanceSheet.overdraft < 0.5 &&
    (result.balanceSheet.shortTermInvestment ?? 0) < 0.5 &&
    result.incomeStatement.fixedCosts > 0 &&
    result.balanceSheet.cash > 1.5 * result.incomeStatement.fixedCosts
  ) {
    detected.push("idle_cash");
  }

  // -------------------------------------------------------------------------
  // CE QUI A MARCHÉ. Quatre des cinq règles ci-dessus signalent un problème :
  // une équipe qui pilote bien traversait la partie sans presque rien
  // déclencher, et n'apprenait donc jamais pourquoi elle gagnait. Les deux
  // règles suivantes ouvrent une situation sur une réussite, avec le même
  // diagnostic et les mêmes questions qu'une alerte.
  //
  // Elles restent RARES par construction : servir presque toute la demande
  // sans rien laisser sur les bras demande un plan juste, et un redressement
  // suppose d'être sorti d'un trou. Une félicitation distribuée à chaque tour
  // ne vaudrait rien.
  // -------------------------------------------------------------------------

  // SERVI SANS GÂCHER : l'outil a tourné haut, presque rien n'a été refusé,
  // presque rien n'est resté. Le seuil est relatif au volume de l'équipe, comme
  // toutes les règles d'ici : un hôtel et un transporteur ne se comparent pas.
  const invendu = Math.max(0, result.production.produced - sold);
  if (
    sold > 0 &&
    result.production.utilizationRate >= 0.85 &&
    lost <= 0.03 * sold &&
    invendu <= 0.03 * sold
  ) {
    detected.push("served_without_waste");
  }

  // LE REDRESSEMENT : on venait d'un tour sous le seuil, à découvert ou en
  // trésorerie négative, et on n'y est plus.
  if (
    precedent &&
    enDifficulte(precedent) &&
    !enDifficulte({
      netIncome: result.incomeStatement.netIncome,
      netTreasury: result.functionalBalance.netTreasury,
    })
  ) {
    detected.push("recovered");
  }

  return detected;
}

// ---------------------------------------------------------------------------
// Métadonnées de détection (A1 — causalité visible, doc 03 §1.1)
//
// Chaque règle porte les faits chiffrés qui l'ont déclenchée. Ces faits sont
// présentés au joueur dans le bloc « Pourquoi cette situation ? » et utilisent
// UNIQUEMENT des valeurs extraites du CompanyRoundResult — jamais de
// formulation du type « Votre décision X a provoqué Y ».
// ---------------------------------------------------------------------------

export interface TriggerFact {
  label: string;
  value: string;
  /** Sémantique pour le rendu : vert / rouge / neutre. */
  direction: "positive" | "negative" | "neutral";
}

/**
 * Les noms des clientèles et des références, code par code. Le résultat d'un
 * tour ne connaît que des codes ; l'élève, lui, lit « Pros » ou « NOVA Go ».
 * Sans ce dictionnaire les faits restent des totaux, et une rupture ne dit ni
 * QUI est reparti ni de QUOI il manquait.
 */
export interface NomsDuMarche {
  clienteles: Record<string, string>;
  references: Record<string, string>;
}

const SANS_NOMS: NomsDuMarche = { clienteles: {}, references: {} };

export function nomsDuMarche(
  scenario: Pick<EngineScenarioConfig, "market" | "products">,
): NomsDuMarche {
  const noms: NomsDuMarche = { clienteles: {}, references: {} };
  for (const s of scenario.market.segments) noms.clienteles[s.code] = s.name;
  for (const p of scenario.products ?? []) {
    noms.references[p.code] = p.name;
    for (const s of p.market.segments) noms.clienteles[s.code] = s.name;
  }
  return noms;
}

interface DetectionMeta {
  buildFacts(result: CompanyRoundResult, noms?: NomsDuMarche): TriggerFact[];
}

function marketTotals(result: CompanyRoundResult): {
  sold: number;
  lost: number;
  /** Demande du marché entier, toutes clientèles — la zone de chalandise. */
  potential: number;
  /** Ce qui s'est adressé à VOUS, avant la contrainte de stock. */
  adressee: number;
} {
  const segments = Object.values(result.market.bySegment);
  const sold = segments.reduce((s, d) => s + d.sold, 0);
  const lost = segments.reduce((s, d) => s + d.lost, 0);
  const potential = segments.reduce((s, d) => s + (d.potential ?? 0), 0);
  const adressee = segments.reduce((s, d) => s + (d.demandForCompany ?? d.sold + d.lost), 0);
  return { sold, lost, potential, adressee };
}

/**
 * LA DEMANDE PERDUE, ET D'OÙ ELLE VENAIT. « Une part importante de la demande
 * n'a pas pu être servie » ne dit ni combien de clients il y avait sur le
 * marché, ni combien étaient venus à vous, ni lesquels sont repartis. Ces
 * quatre lignes le disent, puis une par clientèle quand il y en a plusieurs :
 * c'est la zone de chalandise que l'élève doit avoir sous les yeux pour
 * dimensionner son prochain plan de production.
 *
 * En gamme, le détail se fait par RÉFÉRENCE et non par clientèle : chaque
 * référence a son marché, et la question n'est pas « qui est reparti » mais
 * « de quoi manquait-il, et qu'est-ce qui dort » — la référence en rupture
 * et celle qui reste en stock se lisent sur la même ligne.
 */
function faitsDeDemandePerdue(r: CompanyRoundResult, noms: NomsDuMarche): TriggerFact[] {
  const t = marketTotals(r);
  const faits: TriggerFact[] = [];
  if (t.potential > 0)
    faits.push({ label: "Demande du marché, toutes clientèles", value: formatUnits(t.potential), direction: "neutral" });
  faits.push(
    { label: "Demande qui vous était adressée", value: formatUnits(t.adressee), direction: "neutral" },
    { label: "Unités vendues", value: formatUnits(t.sold), direction: "neutral" },
    {
      label: "Demande non servie",
      value: `${formatUnits(t.lost)} (${formatPercent(t.lost / Math.max(1, t.adressee))} de ce qui vous était adressé)`,
      direction: "negative",
    },
  );
  if (r.products) {
    for (const [code, p] of Object.entries(r.products)) {
      if (p.sold + p.lost < 0.5 && p.stock.quantity < 0.5) continue; // référence non vendable ce tour
      const manque = p.lost > 0.5;
      faits.push({
        label: `${noms.references[code] ?? code}`,
        value: manque
          ? `${formatUnits(p.lost)} sur ${formatUnits(p.sold + p.lost)} repartis sans acheter · ${formatUnits(p.stock.quantity)} en stock`
          : `rien de manqué · ${formatUnits(p.stock.quantity)} en stock`,
        direction: manque ? "negative" : "neutral",
      });
    }
    return faits;
  }
  const parClientele = Object.entries(r.market.bySegment).filter(([, d]) => d.lost > 0.5);
  if (Object.keys(r.market.bySegment).length > 1)
    for (const [code, d] of parClientele)
      faits.push({
        label: `dont ${noms.clienteles[code] ?? code}`,
        value: `${formatUnits(d.lost)} sur ${formatUnits(d.demandForCompany ?? d.sold + d.lost)} repartis sans acheter`,
        direction: "negative",
      });
  return faits;
}

export const DETECTION_METADATA: Record<DetectCode, DetectionMeta> = {
  profitable_illiquid: {
    buildFacts(r) {
      return [
        { label: "Résultat net", value: formatEuro(r.incomeStatement.netIncome), direction: "positive" },
        { label: "Trésorerie nette", value: formatEuro(r.functionalBalance.netTreasury), direction: "negative" },
      ];
    },
  },
  below_breakeven: {
    buildFacts(r) {
      return [
        { label: "Résultat net", value: formatEuro(r.incomeStatement.netIncome), direction: "negative" },
      ];
    },
  },
  stockout: {
    buildFacts(r, noms = SANS_NOMS) {
      return faitsDeDemandePerdue(r, noms);
    },
  },
  capacity_saturated: {
    buildFacts(r, noms = SANS_NOMS) {
      return [
        { label: "Taux d'utilisation", value: formatPercent(r.production.utilizationRate), direction: "neutral" },
        ...faitsDeDemandePerdue(r, noms),
      ];
    },
  },
  served_without_waste: {
    buildFacts(r) {
      const t = marketTotals(r);
      const invendu = Math.max(0, r.production.produced - t.sold);
      return [
        {
          label: "Taux d'utilisation",
          value: formatPercent(r.production.utilizationRate),
          direction: "positive",
        },
        { label: "Unités vendues", value: formatUnits(t.sold), direction: "positive" },
        {
          label: "Demande non servie",
          value: `${formatUnits(t.lost)} (${formatPercent(t.lost / Math.max(1, t.sold))} des ventes)`,
          direction: "positive",
        },
        {
          label: "Resté sur les bras",
          value: `${formatUnits(invendu)} (${formatPercent(invendu / Math.max(1, t.sold))} des ventes)`,
          direction: "positive",
        },
      ];
    },
  },
  recovered: {
    buildFacts(r) {
      return [
        { label: "Résultat net", value: formatEuro(r.incomeStatement.netIncome), direction: "positive" },
        {
          label: "Trésorerie nette",
          value: formatEuro(r.functionalBalance.netTreasury),
          direction: "positive",
        },
        {
          label: "Découvert",
          value: r.balanceSheet.overdraft > 0.5 ? formatEuro(r.balanceSheet.overdraft) : "aucun",
          direction: "positive",
        },
      ];
    },
  },
  idle_cash: {
    buildFacts(r) {
      const cash = r.balanceSheet.cash;
      const fixedCosts = r.incomeStatement.fixedCosts;
      const ratioVal = (cash / fixedCosts).toFixed(1).replace(".", ",");
      return [
        { label: "Trésorerie disponible", value: formatEuro(cash), direction: "neutral" },
        { label: "Charges de structure", value: formatEuro(fixedCosts), direction: "neutral" },
        { label: "Ratio trésorerie / charges", value: `${ratioVal}×`, direction: "neutral" },
      ];
    },
  },
};

export function buildTriggerContext(
  code: DetectCode,
  result: CompanyRoundResult,
  noms: NomsDuMarche = SANS_NOMS,
): TriggerFact[] {
  return DETECTION_METADATA[code].buildFacts(result, noms);
}

// ---------------------------------------------------------------------------
// Conséquences pédagogiques (A2 — évolution avant/après, doc 03 §1.1)
//
// Chaque règle de détection porte aussi les indicateurs à comparer entre le
// tour de détection (avant) et le tour de résolution (après). Les faits
// montrent une ÉVOLUTION constatée, jamais une attribution causale : le
// système ne dit pas « Votre décision X a provoqué Y ».
// ---------------------------------------------------------------------------

export interface ConsequenceFact {
  label: string;
  before: string;
  after: string;
  delta: string;
  /** Sémantique économique : une baisse de « demande non servie » est positive. */
  direction: "positive" | "negative" | "neutral";
}

interface ConsequenceMeta {
  buildFacts(before: CompanyRoundResult, after: CompanyRoundResult): ConsequenceFact[];
}

function deltaEuro(before: number, after: number): { delta: string; direction: ConsequenceFact["direction"] } {
  const diff = after - before;
  const sign = diff >= 0 ? "+" : "";
  return {
    delta: `${sign}${formatEuro(diff)}`,
    direction: diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral",
  };
}

function deltaPercent(before: number, after: number): { delta: string; direction: ConsequenceFact["direction"] } {
  const diff = after - before;
  const sign = diff >= 0 ? "+" : "";
  return {
    delta: `${sign}${formatPercent(diff)}`,
    direction: diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral",
  };
}

function deltaUnits(before: number, after: number): { delta: string; direction: ConsequenceFact["direction"] } {
  const diff = after - before;
  const sign = diff >= 0 ? "+" : "";
  return {
    delta: `${sign}${formatUnits(diff)}`,
    direction: diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral",
  };
}

export const CONSEQUENCE_METADATA: Record<DetectCode, ConsequenceMeta> = {
  served_without_waste: {
    buildFacts(before, after) {
      const t = (r: CompanyRoundResult) => {
        const seg = Object.values(r.market.bySegment);
        const sold = seg.reduce((x, d) => x + d.sold, 0);
        return { sold, lost: seg.reduce((x, d) => x + d.lost, 0), invendu: Math.max(0, r.production.produced - sold) };
      };
      const b = t(before);
      const a = t(after);
      const util = deltaPercent(before.production.utilizationRate, after.production.utilizationRate);
      return [
        {
          label: "Taux d'utilisation",
          before: formatPercent(before.production.utilizationRate),
          after: formatPercent(after.production.utilizationRate),
          delta: util.delta,
          direction: util.direction,
        },
        {
          label: "Demande non servie",
          before: formatUnits(b.lost),
          after: formatUnits(a.lost),
          delta: deltaUnits(b.lost, a.lost).delta,
          // Polarité inversée : moins de demande refusée est une amélioration.
          direction: a.lost < b.lost ? "positive" : a.lost > b.lost ? "negative" : "neutral",
        },
        {
          label: "Resté sur les bras",
          before: formatUnits(b.invendu),
          after: formatUnits(a.invendu),
          delta: deltaUnits(b.invendu, a.invendu).delta,
          direction: a.invendu < b.invendu ? "positive" : a.invendu > b.invendu ? "negative" : "neutral",
        },
      ];
    },
  },
  recovered: {
    buildFacts(before, after) {
      const res = deltaEuro(before.incomeStatement.netIncome, after.incomeStatement.netIncome);
      const treso = deltaEuro(before.functionalBalance.netTreasury, after.functionalBalance.netTreasury);
      return [
        {
          label: "Résultat net",
          before: formatEuro(before.incomeStatement.netIncome),
          after: formatEuro(after.incomeStatement.netIncome),
          delta: res.delta,
          direction: res.direction,
        },
        {
          label: "Trésorerie nette",
          before: formatEuro(before.functionalBalance.netTreasury),
          after: formatEuro(after.functionalBalance.netTreasury),
          delta: treso.delta,
          direction: treso.direction,
        },
      ];
    },
  },
  profitable_illiquid: {
    buildFacts(before, after) {
      const ni = deltaEuro(before.incomeStatement.netIncome, after.incomeStatement.netIncome);
      const nt = deltaEuro(before.functionalBalance.netTreasury, after.functionalBalance.netTreasury);
      return [
        {
          label: "Résultat net",
          before: formatEuro(before.incomeStatement.netIncome),
          after: formatEuro(after.incomeStatement.netIncome),
          ...ni,
        },
        {
          label: "Trésorerie nette",
          before: formatEuro(before.functionalBalance.netTreasury),
          after: formatEuro(after.functionalBalance.netTreasury),
          delta: nt.delta,
          direction: nt.direction,
        },
      ];
    },
  },
  below_breakeven: {
    buildFacts(before, after) {
      const ni = deltaEuro(before.incomeStatement.netIncome, after.incomeStatement.netIncome);
      const rev = deltaEuro(before.incomeStatement.revenue, after.incomeStatement.revenue);
      return [
        {
          label: "Résultat net",
          before: formatEuro(before.incomeStatement.netIncome),
          after: formatEuro(after.incomeStatement.netIncome),
          ...ni,
        },
        {
          label: "Chiffre d'affaires",
          before: formatEuro(before.incomeStatement.revenue),
          after: formatEuro(after.incomeStatement.revenue),
          ...rev,
        },
      ];
    },
  },
  stockout: {
    buildFacts(before, after) {
      const bTotals = marketTotals(before);
      const aTotals = marketTotals(after);
      const sold = deltaUnits(bTotals.sold, aTotals.sold);
      const lost = deltaUnits(bTotals.lost, aTotals.lost);
      return [
        {
          label: "Unités vendues",
          before: formatUnits(bTotals.sold),
          after: formatUnits(aTotals.sold),
          ...sold,
        },
        {
          label: "Demande non servie",
          before: formatUnits(bTotals.lost),
          after: formatUnits(aTotals.lost),
          delta: lost.delta,
          // Polarity inversée : une baisse de demande non servie est positive
          direction: aTotals.lost < bTotals.lost ? "positive" : aTotals.lost > bTotals.lost ? "negative" : "neutral",
        },
      ];
    },
  },
  capacity_saturated: {
    buildFacts(before, after) {
      const ur = deltaPercent(before.production.utilizationRate, after.production.utilizationRate);
      const bTotals = marketTotals(before);
      const aTotals = marketTotals(after);
      const lost = deltaUnits(bTotals.lost, aTotals.lost);
      return [
        {
          label: "Taux d'utilisation",
          before: formatPercent(before.production.utilizationRate),
          after: formatPercent(after.production.utilizationRate),
          delta: ur.delta,
          // Polarity inversée : un taux qui baisse signifie de la capacité libérée
          direction: after.production.utilizationRate < before.production.utilizationRate
            ? "positive"
            : after.production.utilizationRate > before.production.utilizationRate
              ? "negative"
              : "neutral",
        },
        {
          label: "Demande non servie",
          before: formatUnits(bTotals.lost),
          after: formatUnits(aTotals.lost),
          delta: lost.delta,
          direction: aTotals.lost < bTotals.lost ? "positive" : aTotals.lost > bTotals.lost ? "negative" : "neutral",
        },
      ];
    },
  },
  idle_cash: {
    buildFacts(before, after) {
      const cash = deltaEuro(before.balanceSheet.cash, after.balanceSheet.cash);
      const bRatio = before.incomeStatement.fixedCosts > 0
        ? before.balanceSheet.cash / before.incomeStatement.fixedCosts
        : 0;
      const aRatio = after.incomeStatement.fixedCosts > 0
        ? after.balanceSheet.cash / after.incomeStatement.fixedCosts
        : 0;
      const bRatioStr = bRatio.toFixed(1).replace(".", ",");
      const aRatioStr = aRatio.toFixed(1).replace(".", ",");
      const ratioDiff = aRatio - bRatio;
      const ratioDelta = `${ratioDiff >= 0 ? "+" : ""}${ratioDiff.toFixed(1).replace(".", ",")}×`;
      return [
        {
          label: "Trésorerie disponible",
          before: formatEuro(before.balanceSheet.cash),
          after: formatEuro(after.balanceSheet.cash),
          delta: cash.delta,
          // Polarity inversée : une baisse de trésorerie oisive est positive (investie)
          direction: after.balanceSheet.cash < before.balanceSheet.cash
            ? "positive"
            : after.balanceSheet.cash > before.balanceSheet.cash
              ? "negative"
              : "neutral",
        },
        {
          label: "Ratio trésorerie / charges",
          before: `${bRatioStr}×`,
          after: `${aRatioStr}×`,
          delta: ratioDelta,
          direction: aRatio < bRatio ? "positive" : aRatio > bRatio ? "negative" : "neutral",
        },
      ];
    },
  },
};

export function buildConsequenceContext(
  code: DetectCode,
  before: CompanyRoundResult,
  after: CompanyRoundResult,
): ConsequenceFact[] {
  return CONSEQUENCE_METADATA[code].buildFacts(before, after);
}

// ---------------------------------------------------------------------------
// Interprétation pédagogique (A3 — mécanisme de gestion, doc 03 §1.1)
//
// Chaque règle de détection porte une interprétation qui relie les faits
// observés (A1) et l'évolution mesurée (A2) à un mécanisme de gestion.
// L'interprétation est contextualisée par la direction globale de l'évolution
// (amélioration, dégradation, stabilité) mais ne formule AUCUNE attribution
// causale : le système ne dit pas « Votre décision X a provoqué Y ».
// ---------------------------------------------------------------------------

export interface InterpretationFact {
  mechanism: string;
  explanation: string;
  takeaway: string;
}

type OverallDirection = "positive" | "negative" | "neutral";

interface InterpretationMeta {
  buildInterpretation(direction: OverallDirection): InterpretationFact;
}

export function overallDirection(facts: ConsequenceFact[]): OverallDirection {
  let pos = 0;
  let neg = 0;
  for (const f of facts) {
    if (f.direction === "positive") pos++;
    else if (f.direction === "negative") neg++;
  }
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

export const INTERPRETATION_METADATA: Record<DetectCode, InterpretationMeta> = {
  served_without_waste: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "Servir presque toute la demande sans rien laisser sur les bras suppose un plan " +
          "dimensionné sur la demande attendue, et non sur la capacité disponible. Ni la " +
          "rupture évitée ni l'invendu qui n'existe pas n'apparaissent au compte de résultat : " +
          "ce geste ne se voit que dans les volumes.",
        explanation:
          direction === "positive"
            ? "L'ajustement s'est maintenu ou amélioré au tour suivant : ce n'était pas un coup de chance."
            : direction === "negative"
              ? "L'ajustement ne s'est pas reproduit au tour suivant. Un plan juste une fois ne dit pas encore une méthode."
              : "L'ajustement est resté comparable d'un tour à l'autre.",
        takeaway:
          "Un plan juste se construit sur la demande attendue, pas sur ce que l'outil sait " +
          "produire. Reproduire ce résultat demande de savoir CE QUI l'a produit : la prévision, " +
          "le prix, ou la saison.",
      };
    },
  },
  recovered: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "Sortir d'une perte ou d'un découvert suppose d'avoir agi sur ce qui l'avait causé : " +
          "le volume, le prix, les charges ou le financement. Le redressement se lit dans " +
          "l'écart entre deux tours, jamais dans un seul.",
        explanation:
          direction === "positive"
            ? "Le redressement s'est confirmé au tour suivant : la correction tient."
            : direction === "negative"
              ? "Les indicateurs sont repartis dans l'autre sens : le redressement n'était pas encore consolidé."
              : "La situation est restée comparable au tour suivant.",
        takeaway:
          "Un redressement ne vaut que s'il se reproduit. Identifier le levier qui a joué est " +
          "ce qui sépare une correction d'une embellie.",
      };
    },
  },
  profitable_illiquid: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "Le résultat comptable mesure la rentabilité sur une période, tandis que la " +
          "trésorerie reflète les flux réels d'encaissement et de décaissement. Ces deux " +
          "grandeurs peuvent évoluer dans des directions opposées.",
        explanation:
          direction === "positive"
            ? "La trésorerie nette s'est améliorée, ce qui traduit un meilleur alignement " +
              "entre les flux d'encaissement et les besoins de financement à court terme."
            : direction === "negative"
              ? "La tension de trésorerie persiste malgré un résultat positif. L'écart entre " +
                "rentabilité comptable et liquidité disponible reste significatif."
              : "L'écart entre la rentabilité comptable et la trésorerie disponible reste " +
                "comparable à la période précédente.",
        takeaway:
          "Une entreprise peut être rentable et manquer de liquidités : le résultat ne " +
          "garantit pas la capacité à honorer ses échéances.",
      };
    },
  },
  below_breakeven: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "Le seuil de rentabilité est le niveau d'activité à partir duquel le chiffre " +
          "d'affaires couvre l'ensemble des charges, fixes et variables. En dessous, chaque " +
          "euro de vente ne suffit pas à absorber les coûts de structure.",
        explanation:
          direction === "positive"
            ? "Le résultat net s'est rapproché de l'équilibre ou l'a dépassé, ce qui est " +
              "cohérent avec une meilleure couverture des charges par le volume d'activité."
            : direction === "negative"
              ? "Le résultat net s'est éloigné de l'équilibre. Le niveau d'activité reste " +
                "insuffisant pour couvrir les charges de structure."
              : "Le niveau de résultat est resté comparable. La couverture des charges par " +
                "l'activité n'a pas significativement évolué.",
        takeaway:
          "Le résultat dépend du rapport entre le volume d'activité et le niveau des " +
          "charges. Agir sur les prix, les volumes ou les coûts modifie la position par " +
          "rapport au seuil de rentabilité.",
      };
    },
  },
  stockout: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "Une rupture de stock survient lorsque la demande excède la quantité disponible " +
          "à la vente. La demande non servie représente des ventes potentielles que " +
          "l'entreprise n'a pas pu réaliser.",
        explanation:
          direction === "positive"
            ? "La demande non servie a diminué, ce qui traduit une meilleure adéquation " +
              "entre la disponibilité des produits et le niveau de demande."
            : direction === "negative"
              ? "La demande non servie a augmenté. L'écart entre la demande et la " +
                "disponibilité s'est creusé."
              : "Le niveau de demande non servie est resté comparable. L'adéquation entre " +
                "offre et demande n'a pas significativement évolué.",
        takeaway:
          "Une entreprise peut perdre des ventes non pas faute de clients, mais faute de " +
          "produits disponibles. La gestion des stocks arbitre entre le coût de détention " +
          "et le risque de rupture.",
      };
    },
  },
  capacity_saturated: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "La capacité de production est une contrainte physique : lorsque l'outil de " +
          "production est utilisé à son maximum, toute demande supplémentaire ne peut être " +
          "satisfaite sans investissement ou sous-traitance.",
        explanation:
          direction === "positive"
            ? "La pression sur la capacité a diminué, ce qui traduit un meilleur équilibre " +
              "entre le volume de demande et les moyens de production disponibles."
            : direction === "negative"
              ? "La saturation de l'outil de production persiste ou s'est aggravée. La " +
                "demande continue de dépasser la capacité disponible."
              : "Le taux d'utilisation et la demande non servie sont restés comparables. La " +
                "contrainte de capacité n'a pas significativement évolué.",
        takeaway:
          "Quand la demande dépasse la capacité, l'entreprise fait face à un arbitrage : " +
          "investir pour accroître sa capacité, ajuster sa politique commerciale, ou " +
          "accepter de ne pas servir une partie de la demande.",
      };
    },
  },
  idle_cash: {
    buildInterpretation(direction) {
      return {
        mechanism:
          "La trésorerie qui dépasse largement les besoins de fonctionnement représente un " +
          "coût d'opportunité : cet argent disponible ne produit aucun rendement alors " +
          "qu'il pourrait être mobilisé — investissement, placement, remboursement anticipé.",
        explanation:
          direction === "positive"
            ? "La trésorerie disponible a diminué par rapport aux charges de structure, ce " +
              "qui traduit une mobilisation des liquidités excédentaires."
            : direction === "negative"
              ? "L'excédent de trésorerie s'est maintenu ou amplifié. Les liquidités " +
                "disponibles restent significativement supérieures aux besoins de fonctionnement."
              : "Le rapport entre la trésorerie et les charges de structure est resté comparable.",
        takeaway:
          "Conserver des liquidités assure la sécurité financière, mais au-delà d'un seuil, " +
          "l'argent qui dort représente un manque à gagner. L'arbitrage porte sur l'équilibre " +
          "entre sécurité et rendement.",
      };
    },
  },
};

export function buildInterpretation(
  code: DetectCode,
  consequenceFacts: ConsequenceFact[],
): InterpretationFact {
  return INTERPRETATION_METADATA[code].buildInterpretation(overallDirection(consequenceFacts));
}
