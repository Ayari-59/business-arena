import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * UN VOLUME NUL N'EST PAS UNE DÉCISION.
 *
 * Constaté en production (audit croisé §07) : un plan de production vide
 * devenait 0 côté serveur sans erreur, et une équipe validait prix et
 * production sans les toucher sans que rien ne le dise. Ici : le serveur
 * refuse le volume nul dans la langue du secteur, et le formulaire prévient
 * avant d'envoyer des valeurs proposées non touchées.
 */

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => "invite-1" }));
vi.mock("@/services/pedagogy.service", () => ({
  submitDiagnosis: vi.fn(),
  submitQuiz: vi.fn(),
  unlockHint: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  getGameKind: vi.fn(async () => "class"),
  getGameVocabulary: vi.fn(async () => ({
    productionPlanLabel: "Nuitées mises en vente",
    units: "nuitées",
    unit: "nuitée",
    priceLabel: "Prix moyen par nuitée",
  })),
  nommerEquipe: vi.fn(),
  resolveCurrentRound: vi.fn(),
  submitTeamDecisions: vi.fn(async () => ({ roundIndex: 1 })),
}));

const { playRoundAction } = await import("@/app/arena/[gameId]/actions");
const { submitTeamDecisions } = await import("@/services/game.service");

function formulaire(champs: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
}

const BASE = { price: "120", marketingBudget: "3000", qualityBudget: "0", maintenanceBudget: "0" };

describe("refus serveur du volume pivot", () => {
  it("volume 0 : refusé, dans la langue du secteur, rien n'est enregistré", async () => {
    const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: "0" }));
    expect(etat.error).toContain("Nuitées mises en vente");
    expect(etat.error).toContain("≥ 1");
    expect(etat.error).toContain("nuitées");
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });

  it("volume vide ou négatif : même refus", async () => {
    for (const v of ["", "  ", "-5", "abc"]) {
      const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: v }));
      expect(etat.error, `volume « ${v} »`).toContain("≥ 1");
    }
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });

  it("volume ≥ 1 : les décisions passent", async () => {
    const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: "1" }));
    expect(etat.error).toBeNull();
    expect(submitTeamDecisions).toHaveBeenCalledTimes(1);
  });
});

describe("le formulaire prévient avant d'envoyer des valeurs proposées", () => {
  const source = readFileSync(join(process.cwd(), "src", "components", "decision-form.tsx"), "utf8");

  it("compare les pivots aux valeurs proposées au moment de la soumission", () => {
    expect(source).toContain("pivotsNonTouches(");
    expect(source).toContain("onSubmit={verifierPivots}");
    expect(source).toContain("proposed?: RoundDecisions");
  });

  it("affiche le bandeau non bloquant avec ses deux issues", () => {
    expect(source).toContain("Vous validez avec les valeurs proposées pour");
    expect(source).toContain("C&apos;est un choix ?");
    expect(source).toContain("Oui, je garde ces valeurs");
    expect(source).toContain("Non, je les modifie");
    // « Oui » envoie vraiment ; « Non » ramène au premier champ non touché.
    expect(source).toContain("requestSubmit()");
    expect(source).toContain(".focus()");
  });
});
