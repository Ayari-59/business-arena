"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { lireContexte } from "@/lti/contexte";
import { lienParId, relierLien, type Cible } from "@/lti/liens";
import { plateformeParId } from "@/lti/plateformes";
import { createClassGame } from "@/services/game.service";
import { NiveauReserveError, OffreRequiseError } from "@/services/acces.service";
import { CohorteRefuseeError, creerCohorteDeLEnseignant } from "@/services/cohortes.service";
import { canTeacherLaunchScenario } from "@/services/scenario-editor.service";
import { DEFAULT_SCENARIO_CODE } from "@/config/scenarios/registry";
import { DEFAULT_ANSWER_FORMAT, DEFAULT_QUIZ_MODE } from "@/config/difficulty";

/**
 * CE QUE L'ENSEIGNANT FAIT DE L'ACTIVITÉ DE SON COURS : la relier à une partie ou à une
 * cohorte, existante ou créée ici.
 *
 * L'activité n'est jamais lue dans le formulaire : elle vient du contexte signé du
 * lancement (lti/contexte.ts), et l'enseignant est celui de la session ET du contexte.
 * La cible doit être à lui et à l'organisation de la plateforme (lti/liens.ts) ; la
 * création passe par les services habituels, qui appliquent la licence.
 *
 * Les refus repartent par un CODE dans l'adresse : la page dit la phrase.
 */

async function activiteDeLEnseignant(): Promise<{ enseignantId: string; lienId: string; organizationId: string }> {
  const [session, ctx] = await Promise.all([getSession(), lireContexte()]);
  if (!session || !ctx || ctx.r !== "enseignant" || ctx.u !== session.userId || !ctx.l) redirect("/lti/activite");
  const lien = await lienParId(ctx.l);
  const plateforme = lien ? await plateformeParId(lien.plateformeId) : null;
  if (!lien || !plateforme || !plateforme.actif) redirect("/lti/activite");
  return { enseignantId: session.userId, lienId: lien.id, organizationId: plateforme.organizationId };
}

const refus = (code: string): never => redirect(`/lti/activite?refus=${code}`);

async function relier(a: { enseignantId: string; lienId: string }, cible: Cible): Promise<never> {
  if (!(await relierLien({ lienId: a.lienId, enseignantId: a.enseignantId, cible }))) refus("introuvable");
  redirect(cible.type === "partie" ? `/teacher/games/${cible.id}` : `/teacher/cohortes/${cible.id}`);
}

/** Relier l'activité à une partie de classe existante de l'enseignant. */
export async function relierPartieAction(formData: FormData): Promise<void> {
  const a = await activiteDeLEnseignant();
  await relier(a, { type: "partie", id: String(formData.get("gameId") ?? "") });
}

/** Relier l'activité à une cohorte existante de l'enseignant. */
export async function relierCohorteAction(formData: FormData): Promise<void> {
  const a = await activiteDeLEnseignant();
  await relier(a, { type: "cohorte", id: String(formData.get("cohorteId") ?? "") });
}

const schemaDePartie = z.object({
  scenarioCode: z.string().min(1).catch(DEFAULT_SCENARIO_CODE),
  humanTeamsCount: z.coerce.number().int().min(1).max(8).catch(4),
  botCount: z.coerce.number().int().min(0).max(7).catch(1),
  periodicity: z.enum(["month", "quarter", "year"]).catch("quarter"),
  roundsCount: z.coerce.number().int().min(1).max(24).optional().catch(undefined),
  level: z.coerce.number().int().min(1).max(6).catch(3),
  quizMode: z.enum(["full", "model", "off"]).catch(DEFAULT_QUIZ_MODE),
  answerFormat: z.enum(["qcm", "open"]).catch(DEFAULT_ANSWER_FORMAT),
});

/** Créer une partie de classe (les réglages de la création habituelle) et y relier l'activité. */
export async function creerPartieAction(formData: FormData): Promise<void> {
  const a = await activiteDeLEnseignant();
  const r = schemaDePartie.parse({
    scenarioCode: formData.get("scenarioCode"),
    humanTeamsCount: formData.get("humanTeamsCount"),
    botCount: formData.get("botCount"),
    periodicity: formData.get("periodicity"),
    roundsCount: formData.get("roundsCount") || undefined,
    level: formData.get("level"),
    quizMode: formData.get("quizMode"),
    answerFormat: formData.get("answerFormat"),
  });
  const scenarioCode = (await canTeacherLaunchScenario(r.scenarioCode, a.enseignantId))
    ? r.scenarioCode
    : DEFAULT_SCENARIO_CODE;
  let gameId: string;
  try {
    ({ gameId } = await createClassGame({
      teacherId: a.enseignantId,
      organizationId: a.organizationId,
      periodicity: r.periodicity,
      humanTeamsCount: r.humanTeamsCount,
      botCount: r.botCount,
      level: r.level,
      variableWorld: formData.get("variableWorld") === "on",
      investmentStories: formData.get("investmentStories") === "on",
      scenarioCode,
      quizMode: r.quizMode,
      answerFormat: r.answerFormat,
      roundsCount: r.roundsCount,
    }));
  } catch (e) {
    if (e instanceof NiveauReserveError) refus("niveau");
    if (e instanceof OffreRequiseError) refus("classe");
    console.error("[lti] création de partie impossible :", e);
    refus("creation");
  }
  await relier(a, { type: "partie", id: gameId! });
}

/** Créer une cohorte (un nom, des épisodes cochés) et y relier l'activité. */
export async function creerCohorteAction(formData: FormData): Promise<void> {
  const a = await activiteDeLEnseignant();
  let id: string;
  try {
    ({ id } = await creerCohorteDeLEnseignant({
      enseignantId: a.enseignantId,
      nom: String(formData.get("nom") ?? ""),
      episodes: formData.getAll("episodes").map(String),
    }));
  } catch (e) {
    if (!(e instanceof CohorteRefuseeError)) throw e;
    refus(`cohorte-${e.raison}`);
  }
  await relier(a, { type: "cohorte", id: id! });
}
