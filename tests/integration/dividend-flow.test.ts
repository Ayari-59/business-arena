import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Le dividende joué de bout en bout, au niveau 6.
 *
 * Le test du moteur vérifie le calcul ; celui-ci vérifie que la décision
 * traverse tout ce qui la sépare de l'élève : le niveau qui l'ouvre, la vue
 * qui lui annonce ce qu'il peut distribuer, la validation qui accepte le
 * montant, et le tour qui l'applique vraiment.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

import { db } from "@/db";
import { users } from "@/db/schema";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import {
  closeCurrentRound,
  createClassGame,
  getGameView,
  joinGameByCode,
  submitTeamDecisions,
} from "@/services/game.service";
import type { RoundDecisions } from "@/engine/types";

/** Des décisions prudentes : il faut un bénéfice pour avoir à distribuer. */
const DECISIONS: RoundDecisions = {
  price: 74,
  productionPlan: 3800,
  marketingBudget: 5000,
  qualityBudget: 2000,
  maintenanceBudget: 4000,
};

let prof: string;
let orgId: string;
let gameId: string;
let eleve: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "dividende@lycee.test",
    password: "motdepasse!",
    displayName: "M. Dividende",
    schoolName: "Lycée des Associés",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  orgId = (await getTeacherOrgId(prof))!;

  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 6,
  });
  gameId = partie.gameId;
  const u = await db
    .insert(users)
    .values({ email: "associe@test.local", displayName: "Associé" })
    .returning({ id: users.id });
  eleve = u[0]!.id;
  const j = await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Associé" });
  if ("error" in j) throw new Error(j.error);
});

describe("affectation du résultat, niveau 6", () => {
  it("au premier tour la décision est ouverte, mais il n'y a rien à distribuer", async () => {
    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.enabledDecisions.dividend).toBe(true);
    expect(vue.distributableReserves).toBe(0);
  });

  it("un tour bénéficiaire constitue des réserves distribuables", async () => {
    await submitTeamDecisions({ gameId, userId: eleve, payload: DECISIONS });
    await closeCurrentRound({ gameId, teacherId: prof });

    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.lastResult!.incomeStatement.netIncome).toBeGreaterThan(0);
    expect(vue.distributableReserves).toBeCloseTo(vue.lastResult!.incomeStatement.netIncome, 6);
  });

  it("le dividende versé sort des capitaux propres et de la trésorerie", async () => {
    const avant = (await getGameView(gameId, eleve))!;
    const reserves = avant.distributableReserves;
    expect(reserves).toBeGreaterThan(0);
    const capitauxAvant = avant.lastResult!.balanceSheet.equity;

    const verse = Math.round(reserves / 2);
    await submitTeamDecisions({
      gameId,
      userId: eleve,
      payload: { ...DECISIONS, finance: { dividend: verse } },
    });
    await closeCurrentRound({ gameId, teacherId: prof });

    const apres = (await getGameView(gameId, eleve))!;
    const resultat = apres.lastResult!.incomeStatement.netIncome;
    // capitaux propres = ceux d'avant + résultat du tour − dividende
    expect(apres.lastResult!.balanceSheet.equity).toBeCloseTo(
      capitauxAvant + resultat - verse,
      2,
    );
    // et les réserves ont bien été entamées
    expect(apres.distributableReserves).toBeCloseTo(reserves + resultat - verse, 2);
  });

  it("une demande supérieure aux réserves est servie à hauteur de ce qui existe", async () => {
    const avant = (await getGameView(gameId, eleve))!;
    const reserves = avant.distributableReserves;
    const capitauxAvant = avant.lastResult!.balanceSheet.equity;

    await submitTeamDecisions({
      gameId,
      userId: eleve,
      payload: { ...DECISIONS, finance: { dividend: reserves * 5 } },
    });
    await closeCurrentRound({ gameId, teacherId: prof });

    const apres = (await getGameView(gameId, eleve))!;
    const resultat = apres.lastResult!.incomeStatement.netIncome;
    // écrêté aux réserves : ni plus, ni refus pur et simple
    expect(apres.lastResult!.balanceSheet.equity).toBeCloseTo(
      capitauxAvant + resultat - reserves,
      2,
    );
    expect(apres.distributableReserves).toBeCloseTo(Math.max(0, resultat), 2);
  });

  it("le dividende figure au tableau de flux, sous un nom lisible", async () => {
    const vue = (await getGameView(gameId, eleve))!;
    const ligne = vue.lastResult!.cashFlow.items.find((i) => i.label === "dividendes_verses");
    expect(ligne, "aucune ligne de dividende dans le tableau de flux").toBeDefined();
    expect(ligne!.amount).toBeLessThan(0);
  });

  it("aux autres niveaux la décision reste fermée et sans effet", async () => {
    const partie = await createClassGame({
      teacherId: prof,
      organizationId: orgId,
      periodicity: "quarter",
      humanTeamsCount: 1,
      botCount: 1,
      level: 5,
    });
    const u = await db
      .insert(users)
      .values({ email: "strategie@test.local", displayName: "Stratège" })
      .returning({ id: users.id });
    const j = await joinGameByCode({
      code: partie.joinCode,
      userId: u[0]!.id,
      pseudo: "Stratège",
    });
    if ("error" in j) throw new Error(j.error);

    const vue = (await getGameView(partie.gameId, u[0]!.id))!;
    expect(vue.difficulty.name).toBe("Stratégie");
    expect(vue.enabledDecisions.dividend).toBe(false);
  });
});
