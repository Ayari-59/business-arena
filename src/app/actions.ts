"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { createSoloGame } from "@/services/game.service";
import { DEFAULT_SCENARIO_CODE, SCENARIOS } from "@/config/scenarios/registry";

const periodicitySchema = z.enum(["month", "quarter", "year"]).catch("quarter");
const companiesSchema = z.coerce.number().int().min(2).max(8).catch(3);
const levelSchema = z.coerce.number().int().min(1).max(6).catch(3);
/** Secteur choisi : un code inconnu retombe sur le scénario par défaut. */
const scenarioSchema = z
  .enum(SCENARIOS.map((s) => s.code) as [string, ...string[]])
  .catch(DEFAULT_SCENARIO_CODE);

export async function startGameAction(formData: FormData): Promise<void> {
  const periodicity = periodicitySchema.parse(formData.get("periodicity"));
  const companiesCount = companiesSchema.parse(formData.get("companiesCount"));
  const level = levelSchema.parse(formData.get("level"));
  const scenarioCode = scenarioSchema.parse(formData.get("scenarioCode"));
  const userId = await getOrCreateGuestUserId();
  // monde variable par défaut : deux parties solo ne se ressemblent pas
  const gameId = await createSoloGame(
    userId,
    periodicity,
    companiesCount,
    level,
    true,
    scenarioCode,
  );
  redirect(`/arena/${gameId}`);
}
