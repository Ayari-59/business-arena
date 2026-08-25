"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearSession, getSession, setSession } from "@/lib/session";
import { loginTeacher, registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import { closeCurrentRound, createClassGame } from "@/services/game.service";
import {
  createCompetition,
  finishCompetition,
  startFinal,
  startQualification,
} from "@/services/competition.service";

export interface FormState {
  error: string | null;
}

const registerSchema = z.object({
  email: z.string().email("E-mail invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  displayName: z.string().min(1, "Votre nom est requis"),
  schoolName: z.string().catch(""),
  inviteCode: z.string().catch(""),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    schoolName: formData.get("schoolName") ?? "",
    inviteCode: formData.get("inviteCode") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  const result = await registerTeacher(parsed.data);
  if ("error" in result) return { error: result.error };
  await setSession(result.userId, "teacher");
  redirect("/teacher");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await loginTeacher({ email, password });
  if ("error" in result) return { error: result.error };
  await setSession(result.userId, "teacher");
  redirect("/teacher");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/teacher/login");
}

const createGameSchema = z.object({
  periodicity: z.enum(["month", "quarter", "year"]).catch("quarter"),
  humanTeamsCount: z.coerce.number().int().min(1).max(8).catch(4),
  botCount: z.coerce.number().int().min(0).max(7).catch(1),
});

export async function createClassGameAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const parsed = createGameSchema.parse({
    periodicity: formData.get("periodicity"),
    humanTeamsCount: formData.get("humanTeamsCount"),
    botCount: formData.get("botCount"),
  });
  const organizationId = await getTeacherOrgId(session.userId);
  if (!organizationId) redirect("/teacher/login");
  const { gameId } = await createClassGame({
    teacherId: session.userId,
    organizationId,
    periodicity: parsed.periodicity,
    humanTeamsCount: parsed.humanTeamsCount,
    botCount: parsed.botCount,
  });
  redirect(`/teacher/games/${gameId}`);
}

export async function closeRoundAction(gameId: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  await closeCurrentRound({ gameId, teacherId: session.userId });
  revalidatePath(`/teacher/games/${gameId}`);
}

const createCompetitionSchema = z.object({
  name: z.string().min(1).max(80).catch("Business Arena Championship"),
  periodicity: z.enum(["month", "quarter", "year"]).catch("quarter"),
  groupSize: z.coerce.number().int().min(2).max(6).catch(3),
  advancePerGroup: z.coerce.number().int().min(1).max(4).catch(1),
});

export async function createCompetitionAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const organizationId = await getTeacherOrgId(session.userId);
  if (!organizationId) redirect("/teacher/login");
  const parsed = createCompetitionSchema.parse({
    name: formData.get("name"),
    periodicity: formData.get("periodicity"),
    groupSize: formData.get("groupSize"),
    advancePerGroup: formData.get("advancePerGroup"),
  });
  const { competitionId } = await createCompetition({
    organizerId: session.userId,
    organizationId,
    ...parsed,
  });
  redirect(`/teacher/competitions/${competitionId}`);
}

export interface CompetitionActionState {
  error: string | null;
}

async function runCompetitionAction(
  competitionId: string,
  fn: (args: { competitionId: string; organizerId: string }) => Promise<unknown>,
): Promise<CompetitionActionState> {
  const session = await getSession();
  if (!session) return { error: "Session expirée : reconnectez-vous." };
  try {
    await fn({ competitionId, organizerId: session.userId });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/teacher/competitions/${competitionId}`);
  return { error: null };
}

export async function startQualificationAction(
  competitionId: string,
  _prev: CompetitionActionState,
  _formData: FormData,
): Promise<CompetitionActionState> {
  return runCompetitionAction(competitionId, startQualification);
}

export async function startFinalAction(
  competitionId: string,
  _prev: CompetitionActionState,
  _formData: FormData,
): Promise<CompetitionActionState> {
  return runCompetitionAction(competitionId, startFinal);
}

export async function finishCompetitionAction(
  competitionId: string,
  _prev: CompetitionActionState,
  _formData: FormData,
): Promise<CompetitionActionState> {
  return runCompetitionAction(competitionId, finishCompetition);
}
