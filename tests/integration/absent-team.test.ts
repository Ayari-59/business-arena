import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Une équipe absente au tour 1 joue le secteur, pas NOVA.
 *
 * Le repli du moteur codait en dur 59 € et 4 800 unités, les valeurs d'un
 * fabricant d'enceintes portables. Sur ATLAS CONSEIL, dont la journée se
 * facture 560 € au segment principal pour une capacité de 720 jours, cela
 * simulait une entreprise vendant 4 800 jours à 59 € : le tour d'une équipe
 * simplement en retard devenait une faillite, alors que la reconduction est
 * censée être neutre.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { decisions, rounds, teams } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { closeCurrentRound, createClassGame, getGameView, joinGameByCode } from "@/services/game.service";
import { users } from "@/db/schema";
import { scenarioByCode } from "@/config/scenarios/registry";

let teacherId: string;
let orgId: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "absent@lycee.test",
    password: "motdepasse!",
    displayName: "M. Absent",
    schoolName: "Lycée du Retard",
  });
  if ("error" in r) throw new Error(r.error);
  teacherId = r.userId;
  orgId = (await getTeacherOrgId(teacherId))!;
});

/** Décisions effectivement jouées par l'unique équipe HUMAINE du tour 1. */
async function decisionsJouees(gameId: string) {
  const roundRows = await db.select().from(rounds).where(eq(rounds.gameId, gameId));
  const premier = roundRows.find((r) => r.index === 1)!;
  const rows = await db.select().from(decisions).where(eq(decisions.roundId, premier.id));
  const teamRows = await db.select().from(teams).where(eq(teams.gameId, gameId));
  const humaines = new Set(
    teamRows.filter((t) => t.controller === "human").map((t) => t.id),
  );
  return rows
    .filter((r) => humaines.has(r.teamId))
    .map((r) => r.payload as { price: number; productionPlan: number });
}

describe("le repli d'une équipe absente", () => {
  it("applique le tarif et le volume du secteur joué, pas ceux de NOVA", async () => {
    const conseil = scenarioByCode("conseil");
    const principal = [...conseil.scenario.market.segments].sort((a, b) => b.size - a.size)[0]!;

    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "conseil",
    });
    const eleve = await db
      .insert(users)
      .values({ email: "retard@test.local", displayName: "Retard" })
      .returning({ id: users.id });
    const r = await joinGameByCode({ code: joinCode, userId: eleve[0]!.id, pseudo: "Retard" });
    if ("error" in r) throw new Error(r.error);

    // personne ne soumet : la clôture doit reconduire, pas punir
    await closeCurrentRound({ gameId, teacherId });

    const jouees = await decisionsJouees(gameId);
    expect(jouees).toHaveLength(1);
    const { price, productionPlan } = jouees[0]!;
    expect(price).toBeCloseTo(principal.refPrice, 6);
    expect(price).not.toBe(59); // le prix de l'enceinte NOVA
    expect(productionPlan).toBeLessThan(4800); // le volume de l'atelier NOVA

    // et le tour reste jouable : la capacité n'est pas dépassée d'un facteur six
    const etat = conseil.company("t", "T", "human");
    const capacite = Math.min(
      etat.machineCapacity,
      (etat.headcount * etat.hoursPerEmployee * etat.productivity) /
        conseil.scenario.product.hoursPerUnit,
    );
    expect(productionPlan).toBeLessThanOrEqual(capacite);
  });

  it("le formulaire propose le même point de départ que celui du secteur", async () => {
    const hotel = scenarioByCode("hotel");
    const principal = [...hotel.scenario.market.segments].sort((a, b) => b.size - a.size)[0]!;

    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "hotel",
    });
    const eleve = await db
      .insert(users)
      .values({ email: "hotelier@test.local", displayName: "Hotelier" })
      .returning({ id: users.id });
    const r = await joinGameByCode({ code: joinCode, userId: eleve[0]!.id, pseudo: "Hotelier" });
    if ("error" in r) throw new Error(r.error);

    const view = await getGameView(gameId, eleve[0]!.id);
    expect(view!.lastDecisions).toBeNull(); // rien à reconduire au tour 1
    expect(view!.startingDecisions.price).toBeCloseTo(principal.refPrice, 6);
    expect(view!.startingDecisions.maintenanceBudget).toBeCloseTo(
      hotel.scenario.production.maintenanceReference,
      6,
    );
  });

  it("le point de départ est soumettable tel quel par le formulaire", async () => {
    // Relevé par le parcours en navigateur : un budget de 7 379,138 € proposé
    // par défaut rendait le tour insoumettable. Les champs avancent par pas de
    // 1, le prix par pas de 0,1, et le navigateur refuse en silence : l'élève
    // clique sur « Valider » et rien ne se passe, sans un mot d'explication.
    const { gameId, joinCode } = await createClassGame({
      teacherId,
      organizationId: orgId,
      periodicity: "month", // la périodicité est ce qui produit les décimales
      humanTeamsCount: 1,
      botCount: 1,
      scenarioCode: "conseil",
      level: 5,
    });
    const eleve = await db
      .insert(users)
      .values({ email: "pas@test.local", displayName: "Pas" })
      .returning({ id: users.id });
    const r = await joinGameByCode({ code: joinCode, userId: eleve[0]!.id, pseudo: "Pas" });
    if ("error" in r) throw new Error(r.error);

    const d = (await getGameView(gameId, eleve[0]!.id))!.startingDecisions;
    for (const [nom, valeur] of [
      ["productionPlan", d.productionPlan],
      ["marketingBudget", d.marketingBudget],
      ["qualityBudget", d.qualityBudget],
      ["maintenanceBudget", d.maintenanceBudget],
    ] as const) {
      expect(Number.isInteger(valeur), `${nom} vaut ${valeur}, le champ avance par pas de 1`)
        .toBe(true);
    }
    // le prix accepte le dixième, pas au delà
    expect(Math.round(d.price * 10) / 10, `prix ${d.price}`).toBe(d.price);
  });
});
