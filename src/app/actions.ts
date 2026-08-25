"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { createSoloGame } from "@/services/game.service";

const periodicitySchema = z.enum(["month", "quarter", "year"]).catch("quarter");

export async function startGameAction(formData: FormData): Promise<void> {
  const periodicity = periodicitySchema.parse(formData.get("periodicity"));
  const userId = await getOrCreateGuestUserId();
  const gameId = await createSoloGame(userId, periodicity);
  redirect(`/arena/${gameId}`);
}
