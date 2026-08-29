import { beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Le dossier bancaire joué de bout en bout.
 *
 * Le test du moteur vérifie les calculs ; celui-ci vérifie que la règle
 * traverse tout ce qui la sépare de l'élève : le formulaire qui reçoit le
 * plan, la validation qui le laisse passer, le tour qui refuse l'emprunt non
 * appuyé, et la vue qui lui dit ensuite ce que sa banque lui consent.
 *
 * C'est la classe de défaut que les recettes navigateur ont trouvée deux fois :
 * des pièces justes, et rien qui les relie.
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

const DECISIONS: RoundDecisions = {
  price: 74,
  productionPlan: 3800,
  marketingBudget: 5000,
  qualityBudget: 2000,
  maintenanceBudget: 4000,
};

const EMPRUNT = 40000;

let prof: string;
let gameId: string;
let eleve: string;

beforeAll(async () => {
  const r = await registerTeacher({
    email: "banque@lycee.test",
    password: "motdepasse!",
    displayName: "Mme Banque",
    schoolName: "Lycée du Prévisionnel",
  });
  if ("error" in r) throw new Error(r.error);
  prof = r.userId;
  const orgId = (await getTeacherOrgId(prof))!;

  // Niveau 3 : c'est là que le financement s'ouvre, donc là que la banque
  // existe et que le plan de trésorerie prend un sens.
  const partie = await createClassGame({
    teacherId: prof,
    organizationId: orgId,
    periodicity: "quarter",
    humanTeamsCount: 1,
    botCount: 1,
    level: 3,
  });
  gameId = partie.gameId;
  const u = await db
    .insert(users)
    .values({ email: "tresorier@test.local", displayName: "Trésorier" })
    .returning({ id: users.id });
  eleve = u[0]!.id;
  const j = await joinGameByCode({ code: partie.joinCode, userId: eleve, pseudo: "Trésorier" });
  if ("error" in j) throw new Error(j.error);
});

describe("dossier bancaire, de la saisie au bilan", () => {
  it("la partie s'ouvre avec une confiance pleine et la ligne de crédit entière", async () => {
    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.enabledDecisions.finance).toBe(true);
    expect(vue.bankFile).not.toBeNull();
    expect(vue.bankFile!.trust).toBe(1);
    expect(vue.bankFile!.overdraftLimit).toBeCloseTo(vue.bankFile!.fullOverdraftLimit, 6);
    expect(vue.bankFile!.refusedLoan).toBeNull();
  });

  it("un emprunt demandé sans plan de trésorerie n'entre jamais en caisse", async () => {
    await submitTeamDecisions({
      gameId,
      userId: eleve,
      payload: { ...DECISIONS, finance: { newLoan: EMPRUNT } },
    });
    await closeCurrentRound({ gameId, teacherId: prof });

    const vue = (await getGameView(gameId, eleve))!;
    expect(vue.lastResult!.bank!.loanRequested).toBe(EMPRUNT);
    expect(vue.lastResult!.bank!.loanGranted).toBe(0);
    // et l'élève l'apprend au tour suivant, dans le panneau où il rédige
    expect(vue.bankFile!.refusedLoan).toBe(EMPRUNT);
  });

  it("le même emprunt, appuyé d'un plan, est accordé", async () => {
    const avant = (await getGameView(gameId, eleve))!;
    const detteAvant = avant.lastResult!.balanceSheet.financialDebt;

    await submitTeamDecisions({
      gameId,
      userId: eleve,
      payload: {
        ...DECISIONS,
        finance: { newLoan: EMPRUNT },
        forecast: { expectedUnits: 3800, expectedCash: 20000 },
      },
    });
    await closeCurrentRound({ gameId, teacherId: prof });

    const apres = (await getGameView(gameId, eleve))!;
    expect(apres.lastResult!.bank!.planFiled).toBe(true);
    expect(apres.lastResult!.bank!.loanGranted).toBe(EMPRUNT);
    // la dette financière monte de l'emprunt, échéance du tour déduite
    expect(apres.lastResult!.balanceSheet.financialDebt).toBeGreaterThan(detteAvant);
    expect(apres.bankFile!.refusedLoan).toBeNull();
  });

  it("un plan démenti par les faits resserre la ligne de crédit du tour suivant", async () => {
    const avant = (await getGameView(gameId, eleve))!;
    const plafondAvant = avant.bankFile!.overdraftLimit;
    const tauxAvant = avant.bankFile!.overdraftAnnualRate;

    await submitTeamDecisions({
      gameId,
      userId: eleve,
      payload: {
        ...DECISIONS,
        // une annonce sans rapport avec ce que cette entreprise peut faire
        forecast: { expectedUnits: 400000, expectedCash: 9000000 },
      },
    });
    await closeCurrentRound({ gameId, teacherId: prof });

    const apres = (await getGameView(gameId, eleve))!;
    expect(apres.lastResult!.bank!.reliability).toBeLessThan(0.1);
    expect(apres.bankFile!.trust).toBeLessThan(avant.bankFile!.trust);
    expect(apres.bankFile!.overdraftLimit).toBeLessThan(plafondAvant);
    expect(apres.bankFile!.overdraftAnnualRate).toBeGreaterThan(tauxAvant);
    // et le formulaire annonce le plafond QUI SERA APPLIQUÉ, pas le nominal
    expect(apres.treasuryOffer!.overdraftLimit).toBeCloseTo(apres.bankFile!.overdraftLimit, 6);
  });

  it("l'écart montré à l'élève porte sur tout ce qu'il a vendu", async () => {
    const vue = (await getGameView(gameId, eleve))!;
    const revue = vue.forecastReview;
    expect(revue, "aucun écart affiché après un plan déposé").not.toBeNull();
    const ventes = revue!.lines.find((l) => l.label === "Ventes")!;
    const marche = Object.values(vue.lastResult!.market.bySegment).reduce(
      (somme, d) => somme + d.sold,
      0,
    );
    const commande = vue.lastResult!.orderOffer?.delivered ?? 0;
    expect(ventes.actual).toBeCloseTo(marche + commande, 6);
  });
});
