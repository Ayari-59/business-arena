"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { createSoloGame } from "@/services/game.service";

const periodicitySchema = z.enum(["month", "quarter", "year"]).catch("quarter");
const companiesSchema = z.coerce.number().int().min(2).max(8).catch(3);

export async function startGameAction(formData: FormData): Promise<void> {
  const periodicity = periodicitySchema.parse(formData.get("periodicity"));
  const companiesCount = companiesSchema.parse(formData.get("companiesCount"));
  const userId = await getOrCreateGuestUserId();
  const gameId = await createSoloGame(userId, periodicity, companiesCount);
  redirect(`/arena/${gameId}`);
}
