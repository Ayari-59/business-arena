"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createScenarioDraftFromBuiltIn,
  deleteScenario,
  getScenarioById,
  setScenarioStatus,
  updateScenarioDefinition,
} from "@/services/scenario-editor.service";
import { isBuiltInScenarioCode, scenarioByCode } from "@/config/scenarios/registry";

function texte(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
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
