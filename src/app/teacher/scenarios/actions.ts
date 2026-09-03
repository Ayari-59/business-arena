"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createScenarioDraftFromBuiltIn,
  deleteScenario,
  getScenarioById,
  setScenarioStatus,
  updateScenarioDefinition,
  updateSituationText,
} from "@/services/scenario-editor.service";
import { isBuiltInScenarioCode, scenarioByCode } from "@/config/scenarios/registry";
import {
  applyEconomicOverrides,
  applyScoringWeightOverrides,
  sanitizeEconomicOverrides,
  sanitizeScoringWeightOverrides,
} from "@/config/difficulty";
import { applyMarketSettings } from "@/config/scenarios/engine-settings";

function texte(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** Champ numérique optionnel : vide = valeur inchangée. */
function optionalNumber(form: FormData, name: string): number | undefined {
  const s = texte(form, name).replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
/** Taux saisi en pourcentage (20 → 0,2). */
function optionalRate(form: FormData, name: string): number | undefined {
  const n = optionalNumber(form, name);
  return n === undefined ? undefined : n / 100;
}

/** Duplique un secteur intégré en brouillon enseignant puis ouvre l'éditeur. */
export async function duplicateScenarioAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const baseCode = texte(formData, "baseCode");
  if (!isBuiltInScenarioCode(baseCode)) {
    redirect("/teacher/scenarios?echec=" + encodeURIComponent("Secteur de base inconnu."));
  }
  const base = scenarioByCode(baseCode);
  const title = texte(formData, "title") || `${base.title} (copie)`;
  const summary = await createScenarioDraftFromBuiltIn({
    baseCode,
    authorId: session.userId,
    title,
  });
  redirect(`/teacher/scenarios/${summary.id}`);
}

/** Enregistre l'habillage (narratif) d'un brouillon. */
export async function updateNarrativeAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const id = texte(formData, "scenarioId");
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) {
    redirect("/teacher/scenarios?echec=" + encodeURIComponent("Scénario introuvable."));
  }

  const title = texte(formData, "title");
  const tagline = texte(formData, "tagline");
  const briefing = texte(formData, "briefing");
  const context = texte(formData, "context");
  const playerTeamName = texte(formData, "playerTeamName");
  const question = texte(formData, "dilemmaQuestion");
  if (!title || !tagline || !briefing || !context || !playerTeamName || !question) {
    redirect(
      `/teacher/scenarios/${id}?echec=` +
        encodeURIComponent("Tous les champs de l'habillage sont requis."),
    );
  }

  const routeCount = loaded.definition.dilemma.routes.length;
  const routes = Array.from({ length: routeCount }, (_, i) => ({
    label: texte(formData, `route${i}Label`),
    gain: texte(formData, `route${i}Gain`),
    risque: texte(formData, `route${i}Risque`),
  }));

  await updateScenarioDefinition(
    id,
    {
      ...loaded.definition,
      title,
      tagline,
      briefing,
      context,
      playerTeamName,
      dilemma: { question, routes },
    },
    session.userId,
  );
  redirect(`/teacher/scenarios/${id}?ok=1`);
}

/** Enregistre les paramètres moteur (économie, BPI, marché) d'un brouillon. */
export async function updateEconomicsAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const id = texte(formData, "scenarioId");
  const loaded = await getScenarioById(id, session.userId);
  if (!loaded) {
    redirect("/teacher/scenarios?echec=" + encodeURIComponent("Scénario introuvable."));
  }

  const economic = sanitizeEconomicOverrides({
    taxRate: optionalRate(formData, "taxRate"),
    vatRate: optionalRate(formData, "vatRate"),
    customerPaymentDelayDays: optionalNumber(formData, "customerPaymentDelayDays"),
    supplierPaymentDelayDays: optionalNumber(formData, "supplierPaymentDelayDays"),
    loanAnnualRate: optionalRate(formData, "loanAnnualRate"),
    loanDurationRounds: optionalNumber(formData, "loanDurationRounds"),
    overdraftAnnualRate: optionalRate(formData, "overdraftAnnualRate"),
    overdraftLimit: optionalNumber(formData, "overdraftLimit"),
    discountMaxShare: optionalRate(formData, "discountMaxShare"),
    factoringFeeRate: optionalRate(formData, "factoringFeeRate"),
    fixedCostsPerRound: optionalNumber(formData, "fixedCostsPerRound"),
    materialCostPerUnit: optionalNumber(formData, "materialCostPerUnit"),
    otherVariableCostPerUnit: optionalNumber(formData, "otherVariableCostPerUnit"),
    depreciationPerRound: optionalNumber(formData, "depreciationPerRound"),
    baseDefectRate: optionalRate(formData, "baseDefectRate"),
  });
  const scoring = sanitizeScoringWeightOverrides({
    economic: optionalRate(formData, "bpiEconomic"),
    financial: optionalRate(formData, "bpiFinancial"),
    commercial: optionalRate(formData, "bpiCommercial"),
    profitability: optionalRate(formData, "bpiProfitability"),
    pilotage: optionalRate(formData, "bpiPilotage"),
    decisionMastery: optionalRate(formData, "bpiDecisionMastery"),
  });
  const segCount = optionalNumber(formData, "segCount") ?? 0;
  const segments = Array.from({ length: segCount }, (_, i) => ({
    code: texte(formData, `seg${i}Code`),
    size: optionalNumber(formData, `seg${i}Size`),
    refPrice: optionalNumber(formData, `seg${i}RefPrice`),
  })).filter((s) => s.code);
  const market = {
    competitionIntensity: optionalNumber(formData, "competitionIntensity"),
    segments,
  };

  const nextConfig = applyMarketSettings(
    applyScoringWeightOverrides(applyEconomicOverrides(loaded.definition.scenario, economic), scoring),
    market,
  );

  try {
    await updateScenarioDefinition(
      id,
      { ...loaded.definition, scenario: nextConfig },
      session.userId,
    );
  } catch {
    // parseScenarioConfig refuse une config incohérente (prix ≤ 0, etc.).
    redirect(
      `/teacher/scenarios/${id}?echec=` +
        encodeURIComponent("Réglages refusés : une valeur rend le scénario incohérent."),
    );
  }
  redirect(`/teacher/scenarios/${id}?ok=eco`);
}

/** Enregistre le texte d'une situation d'un brouillon. */
export async function updateSituationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const id = texte(formData, "scenarioId");
  const code = texte(formData, "situationCode");

  const diagCount = optionalNumber(formData, "diagCount") ?? 0;
  const diagnosticLabels = Array.from({ length: diagCount }, (_, i) => texte(formData, `diag${i}`));
  const hintTexts = Array.from({ length: 5 }, (_, i) => texte(formData, `hint${i}`));

  try {
    await updateSituationText(
      id,
      code,
      {
        title: texte(formData, "title"),
        narrative: texte(formData, "narrative"),
        problem: texte(formData, "problem"),
        diagnosticLabels,
        hintTexts,
        modelExplain: texte(formData, "modelExplain"),
        triggerRound: optionalNumber(formData, "triggerRound"),
        weight: optionalNumber(formData, "weight"),
      },
      session.userId,
    );
  } catch (e) {
    const raison = e instanceof Error ? e.message : "Enregistrement refusé.";
    redirect(
      `/teacher/scenarios/${id}/situations/${encodeURIComponent(code)}?echec=` +
        encodeURIComponent(raison),
    );
  }
  redirect(`/teacher/scenarios/${id}/situations/${encodeURIComponent(code)}?ok=1`);
}

export async function publishScenarioAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const id = texte(formData, "scenarioId");
  const status = texte(formData, "status");
  if (status !== "draft" && status !== "published" && status !== "archived") {
    redirect("/teacher/scenarios?echec=" + encodeURIComponent("Statut inconnu."));
  }
  await setScenarioStatus(id, status, session.userId);
  redirect("/teacher/scenarios");
}

export async function deleteScenarioAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const id = texte(formData, "scenarioId");
  await deleteScenario(id, session.userId);
  redirect("/teacher/scenarios");
}
