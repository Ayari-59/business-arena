"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getOrCreateGuestUserId } from "@/lib/guest";
import { createSoloGame } from "@/services/game.service";
import { NiveauGroupeReserveError, TropDePartiesError } from "@/services/game-creation.service";
import { DEFAULT_SCENARIO_CODE, SCENARIOS } from "@/config/scenarios/registry";
import { NiveauReserveError } from "@/services/acces.service";
import { getSession } from "@/lib/session";

const periodicitySchema = z.enum(["month", "quarter", "year"]).catch("quarter");
const companiesSchema = z.coerce.number().int().min(2).max(8).catch(3);
/** 7 : le niveau « Groupe », hors parcours : `createSoloGame` exige une licence et NOVA en gamme. */
const levelSchema = z.coerce.number().int().min(1).max(7).catch(3);
const roundsCountSchema = z.coerce.number().int().min(1).max(24).optional().catch(undefined);
/** Secteur choisi : un code inconnu retombe sur le scénario par défaut. */
const scenarioSchema = z
  .enum(SCENARIOS.map((s) => s.code) as [string, ...string[]])
  .catch(DEFAULT_SCENARIO_CODE);

export async function startGameAction(formData: FormData): Promise<void> {
  const periodicity = periodicitySchema.parse(formData.get("periodicity"));
  const companiesCount = companiesSchema.parse(formData.get("companiesCount"));
  const level = levelSchema.parse(formData.get("level"));
  const scenarioCode = scenarioSchema.parse(formData.get("scenarioCode"));
  const roundsCount = roundsCountSchema.parse(formData.get("roundsCount") || undefined);
  // LES NIVEAUX FERMÉS SANS LICENCE : `createSoloGame` applique la règle comme l'écran
  // l'affiche (config/vitrine-solo.ts), et un formulaire forgé ne passe pas outre. Un
  // enseignant connecté dont l'établissement est sous licence les ouvre.
  const session = await getSession();
  // L'ADRESSE D'ORIGINE AVANT L'INVITÉ. Le plafond se compte dessus, et
  // `createSoloGame` refuse au-delà : autrement, une boucle sur ce formulaire
  // créerait autant de parties complètes qu'elle fait de requêtes.
  const h = await headers();
  const ip = h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
  const userId = await getOrCreateGuestUserId();
  let gameId: string;
  try {
    gameId = await createSoloGame(
      userId,
      periodicity,
      companiesCount,
      level,
      true,
      scenarioCode,
      roundsCount,
      ip,
      { licencePar: session?.userId ?? null },
    );
  } catch (e) {
    // Le formulaire n'a pas de canal d'erreur (pas de `useActionState`) : on
    // revient sur la page, qui dit pourquoi. Toute autre panne remonte.
    if (e instanceof TropDePartiesError) redirect("/jouer?trop=1");
    if (e instanceof NiveauReserveError) redirect("/jouer?reserve=1");
    if (e instanceof NiveauGroupeReserveError) redirect("/jouer?groupe=1");
    throw e;
  }
  redirect(`/arena/${gameId}`);
}

