"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearSession, getSession, setSession } from "@/lib/session";
import { loginTeacher, registerTeacher, getTeacherOrgId } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  drawEventCardForNextRound,
  setQuizMode,
} from "@/services/game.service";
import {
  createCompetition,
  finishCompetition,
  startFinal,
  startQualification,
} from "@/services/competition.service";
import { DEFAULT_SCENARIO_CODE, SCENARIOS } from "@/config/scenarios/registry";
import { DEFAULT_QUIZ_MODE } from "@/config/difficulty";

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

const SCENARIO_CODES = SCENARIOS.map((s) => s.code) as [string, ...string[]];

const createGameSchema = z.object({
  periodicity: z.enum(["month", "quarter", "year"]).catch("quarter"),
  humanTeamsCount: z.coerce.number().int().min(1).max(8).catch(4),
  botCount: z.coerce.number().int().min(0).max(7).catch(1),
  level: z.coerce.number().int().min(1).max(6).catch(3),
  // Tours joués : vide ou hors bornes = tous ceux du scénario. Le service
  // rabote de toute façon à ce que le secteur porte.
  roundsCount: z.coerce.number().int().min(1).max(24).optional().catch(undefined),
  // Secteur joué : un code inconnu retombe sur le scénario par défaut.
  scenarioCode: z.enum(SCENARIO_CODES).catch(DEFAULT_SCENARIO_CODE),
  // Questions posées dans les situations (voir QUIZ_MODES).
  quizMode: z.enum(["full", "model", "off"]).catch(DEFAULT_QUIZ_MODE),
});

/** Champ numérique optionnel : vide = valeur du scénario (jamais de dur). */
const optionalNumber = (raw: FormDataEntryValue | null): number | undefined => {
  const s = String(raw ?? "").trim().replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
/** Taux saisi en pourcentage (ex. 20 → 0,2). */
const optionalRate = (raw: FormDataEntryValue | null): number | undefined => {
  const n = optionalNumber(raw);
  return n === undefined ? undefined : n / 100;
};

/**
 * Renvoie l'enseignant sur ses parties avec la raison de l'échec.
 *
 * Une création qui échoue ne doit jamais ressembler à un clic non enregistré.
 * C'était le cas : sans organisation rattachée, l'action repartait vers la page
 * de connexion, qui renvoie aussitôt vers /teacher puisque la session est
 * valide. L'enseignant revenait sur sa liste, sans partie et sans un mot.
 */
function echecCreation(raison: string): never {
  redirect(`/teacher?echec=${encodeURIComponent(raison)}`);
}

export async function createClassGameAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const parsed = createGameSchema.parse({
    periodicity: formData.get("periodicity"),
    humanTeamsCount: formData.get("humanTeamsCount"),
    botCount: formData.get("botCount"),
    level: formData.get("level"),
    roundsCount: formData.get("roundsCount") || undefined,
    scenarioCode: formData.get("scenarioCode"),
    quizMode: formData.get("quizMode"),
  });
  const economicOverrides = {
    taxRate: optionalRate(formData.get("taxRate")),
    vatRate: optionalRate(formData.get("vatRate")),
    // Cycle d'exploitation : le cœur du besoin en fonds de roulement
    customerPaymentDelayDays: optionalNumber(formData.get("customerPaymentDelayDays")),
    supplierPaymentDelayDays: optionalNumber(formData.get("supplierPaymentDelayDays")),
    // Financement
    loanAnnualRate: optionalRate(formData.get("loanAnnualRate")),
    loanDurationRounds: optionalNumber(formData.get("loanDurationRounds")),
    overdraftAnnualRate: optionalRate(formData.get("overdraftAnnualRate")),
    overdraftLimit: optionalNumber(formData.get("overdraftLimit")),
    discountMaxShare: optionalRate(formData.get("discountMaxShare")),
    factoringFeeRate: optionalRate(formData.get("factoringFeeRate")),
    // Coûts et structure
    fixedCostsPerRound: optionalNumber(formData.get("fixedCostsPerRound")),
    materialCostPerUnit: optionalNumber(formData.get("materialCostPerUnit")),
    otherVariableCostPerUnit: optionalNumber(formData.get("otherVariableCostPerUnit")),
    depreciationPerRound: optionalNumber(formData.get("depreciationPerRound")),
    baseDefectRate: optionalRate(formData.get("baseDefectRate")),
  };
  const organizationId = await getTeacherOrgId(session.userId);
  if (!organizationId) {
    echecCreation(
      "Votre compte n'est rattaché à aucun établissement, la partie n'a pas pu être créée.",
    );
  }
  let gameId: string;
  try {
    ({ gameId } = await createClassGame({
      teacherId: session.userId,
      organizationId,
      periodicity: parsed.periodicity,
      humanTeamsCount: parsed.humanTeamsCount,
      botCount: parsed.botCount,
      level: parsed.level,
      economicOverrides,
      variableWorld: formData.get("variableWorld") === "on",
      scenarioCode: parsed.scenarioCode,
      quizMode: parsed.quizMode,
      roundsCount: parsed.roundsCount,
    }));
  } catch (erreur) {
    echecCreation(erreur instanceof Error ? erreur.message : "La partie n'a pas pu être créée.");
  }
  redirect(`/teacher/games/${gameId}`);
}

/** Règle les questions posées dans les situations d'une partie en cours. */
export async function setQuizModeAction(gameId: string, formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const mode = z
    .enum(["full", "model", "off"])
    .catch(DEFAULT_QUIZ_MODE)
    .parse(formData.get("mode"));
  await setQuizMode({ gameId, teacherId: session.userId, mode });
  revalidatePath(`/teacher/games/${gameId}`);
}

export interface CloseRoundState {
  error: string | null;
}

/**
 * Clôt le tour que l'enseignant a confirmé (champ `roundIndex`). Un double
 * envoi retombe sur un tour déjà clos : le serveur ne simule rien de plus
 * et la page se rafraîchit simplement.
 */
export async function closeRoundAction(
  gameId: string,
  _prev: CloseRoundState,
  formData: FormData,
): Promise<CloseRoundState> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const brut = Number(formData.get("roundIndex"));
  const expectedRound = Number.isInteger(brut) && brut > 0 ? brut : undefined;
  try {
    await closeCurrentRound({ gameId, teacherId: session.userId, expectedRound });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "La clôture a échoué." };
  }
  revalidatePath(`/teacher/games/${gameId}`);
  return { error: null };
}

const createCompetitionSchema = z.object({
  // Le nom est la seule saisie libre : vide, on le dit, on ne le remplace pas.
  name: z
    .string()
    .trim()
    .min(1, "Donnez un nom au concours.")
    .max(80, "Nom du concours : 80 caractères maximum."),
  periodicity: z.enum(["month", "quarter", "year"]).catch("quarter"),
  groupSize: z.coerce.number().int().min(2).max(6).catch(3),
  advancePerGroup: z.coerce.number().int().min(1).max(4).catch(1),
});

/** Ce que l'enseignant avait saisi : rendu au formulaire quand la création échoue. */
export interface CreateCompetitionValues {
  name: string;
  periodicity: string;
  groupSize: string;
  advancePerGroup: string;
}

export interface CreateCompetitionState {
  error: string | null;
  values: CreateCompetitionValues | null;
}

/**
 * Crée un concours, ou dit pourquoi il n'a pas été créé.
 *
 * Constaté en production : une première soumission repartait sans un mot, le
 * nom effacé, aucun concours dans la liste. L'action renvoyait vers la page de
 * connexion sans organisation rattachée, et laissait toute autre erreur
 * remonter sans la montrer. Elle répond maintenant toujours par un état : une
 * erreur lisible et la saisie intacte, ou la redirection vers le concours.
 */
export async function createCompetitionAction(
  _prev: CreateCompetitionState,
  formData: FormData,
): Promise<CreateCompetitionState> {
  const values: CreateCompetitionValues = {
    name: String(formData.get("name") ?? ""),
    periodicity: String(formData.get("periodicity") ?? "quarter"),
    groupSize: String(formData.get("groupSize") ?? "3"),
    advancePerGroup: String(formData.get("advancePerGroup") ?? "1"),
  };
  const session = await getSession();
  if (!session) return { error: "Session expirée : reconnectez-vous.", values };
  const parsed = createCompetitionSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide.", values };
  }
  const organizationId = await getTeacherOrgId(session.userId);
  if (!organizationId) {
    return {
      error: "Votre compte n'est rattaché à aucun établissement, le concours n'a pas pu être créé.",
      values,
    };
  }
  let competitionId: string;
  try {
    ({ competitionId } = await createCompetition({
      organizerId: session.userId,
      organizationId,
      ...parsed.data,
    }));
  } catch (erreur) {
    const detail = erreur instanceof Error && erreur.message ? ` (${erreur.message})` : "";
    return {
      error: `Le concours n'a pas pu être créé, votre saisie est conservée : réessayez${detail}.`,
      values,
    };
  }
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

export interface DrawCardState {
  error: string | null;
  drawnCode: string | null;
}

/** Tirage d'une carte événement (animation de classe, mode apprentissage). */
export async function drawCardAction(
  gameId: string,
  _prev: DrawCardState,
  formData: FormData,
): Promise<DrawCardState> {
  const session = await getSession();
  if (!session) return { error: "Session expirée.", drawnCode: null };
  const eventCode = String(formData.get("eventCode") ?? "").trim() || undefined;
  const teamId = String(formData.get("teamId") ?? "").trim() || undefined;
  try {
    const { eventCode: drawn } = await drawEventCardForNextRound({
      gameId,
      teacherId: session.userId,
      eventCode,
      teamId,
    });
    revalidatePath(`/teacher/games/${gameId}`);
    return { error: null, drawnCode: drawn };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur.", drawnCode: null };
  }
}
