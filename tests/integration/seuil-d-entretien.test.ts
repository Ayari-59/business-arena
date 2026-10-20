import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * LA PHRASE DU BUDGET D'ENTRETIEN DIT LE VRAI SEUIL.
 *
 * Elle annonçait, chez NOVA : « En dessous de 4 000 € la disponibilité se
 * dégrade, au-dessus elle se rétablit. » Or le moteur rapporte le budget à la
 * référence du métier MULTIPLIÉE par l'exigence d'entretien du parc, et la
 * disponibilité ne baisse que sous les deux tiers de cette référence
 * effective : un rétablissement de moitié de l'usure par euro au-dessus
 * équilibre l'usure en dessous. Le vrai seuil était 3 124 €, la valeur
 * pré-remplie 4 686 €, et à 4 000 € rien ne se dégradait.
 *
 * Ce test n'emprunte pas le calcul qu'il garde : il demande au moteur
 * lui-même, par dichotomie sur `updateAvailability`, le plus petit budget qui
 * ne dégrade pas un atelier entamé, et exige que la phrase servie à l'écran le
 * dise. Et la valeur pré-remplie ne bouge pas : elle est la gestion neutre,
 * étalon de l'examen et du mérite.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { games, users } from "@/db/schema";
import { createSoloGame, getGameView } from "@/services/game.service";
import { aideDuBudgetEntretien } from "@/config/entretien";
import { updateAvailability } from "@/engine/production";
import type { EngineScenarioConfig } from "@/engine/types";

const sansEspacesFines = (s: string) => s.replace(/[  ]/g, " ");

let userId = "";
let gameId = "";
let scenario: EngineScenarioConfig;

beforeAll(async () => {
  userId = (
    await db
      .insert(users)
      .values({ email: "seuil@business-arena.local", displayName: "Seuil" })
      .returning({ id: users.id })
  )[0]!.id;
  gameId = await createSoloGame(userId, "quarter", 4, 2, false, "nova");
  scenario = (await db.select().from(games).where(eq(games.id, gameId)))[0]!
    .scenarioSnapshot as EngineScenarioConfig;
});

/**
 * Le seuil selon le moteur, sans formule : le plus petit budget qui ne
 * dégrade pas un atelier à 90 %, pour une référence effective donnée.
 */
const seuilSelonLeMoteur = (referenceEffective: number): number => {
  const garde = (budget: number) =>
    updateAvailability({
      current: 0.9,
      maintenanceBudget: budget,
      maintenanceReference: referenceEffective,
      availabilityDecay: scenario.production.availabilityDecay,
      availabilityFloor: scenario.production.availabilityFloor,
    }) >= 0.9;
  let bas = 0;
  let haut = referenceEffective;
  while (haut - bas > 0.01) {
    const m = (bas + haut) / 2;
    if (garde(m)) haut = m;
    else bas = m;
  }
  return haut;
};

describe("la phrase du budget d'entretien chez NOVA", () => {
  it("dit le seuil où la disponibilité cesse de baisser, pas la référence du scénario", async () => {
    const vue = (await getGameView(gameId, userId))!;
    // La référence effective est celle que la gestion neutre dépense, et que le
    // formulaire pré-remplit : la référence du métier × l'exigence du parc.
    const preRempli = vue.proposedDecisions.maintenanceBudget;
    expect(preRempli).toBeGreaterThan(scenario.production.maintenanceReference);
    // Le pré-rempli est arrondi à l'euro : le seuil se lit donc à l'euro près.
    const seuil = Math.round(seuilSelonLeMoteur(preRempli));

    const phrase = sansEspacesFines(aideDuBudgetEntretien(vue.capacityFacts));
    expect(phrase).toContain(`En dessous de ${seuil.toLocaleString("fr-FR").replace(/[  ]/g, " ")} €`);
    // Le chiffre recopié du scénario n'est plus annoncé comme un seuil.
    const reference = Math.round(scenario.production.maintenanceReference)
      .toLocaleString("fr-FR")
      .replace(/[  ]/g, " ");
    expect(phrase).not.toContain(`${reference} €`);
  });

  it("la valeur pré-remplie ne bouge pas : la gestion neutre reste l'étalon", async () => {
    const vue = (await getGameView(gameId, userId))!;
    // 4 000 € × l'exigence d'entretien du parc de départ de NOVA.
    expect(Math.round(vue.proposedDecisions.maintenanceBudget)).toBe(4686);
  });
});
