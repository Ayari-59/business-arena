import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATTENTES, confirmationCloture } from "@/config/cloture";

/**
 * CLORE UN TOUR SE CONFIRME, ET L'ATTENTE SE VOIT.
 *
 * Constaté en production : « Clore le tour » partait au premier clic, sans
 * dire combien d'équipes avaient validé ni que le geste est irréversible ;
 * pendant les quinze secondes de simulation, rien ne bougeait, et un second
 * clic pouvait clore le tour suivant.
 */

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`__redirect__${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));
vi.mock("@/services/auth.service", () => ({
  getTeacherOrgId: vi.fn(),
  loginTeacher: vi.fn(),
  registerTeacher: vi.fn(),
}));
vi.mock("@/services/competition.service", () => ({
  createCompetition: vi.fn(),
  finishCompetition: vi.fn(),
  startFinal: vi.fn(),
  startQualification: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  closeCurrentRound: vi.fn(),
  createClassGame: vi.fn(),
  drawEventCardForNextRound: vi.fn(),
  setQuizMode: vi.fn(),
}));

const { getSession } = await import("@/lib/session");
const { closeCurrentRound } = await import("@/services/game.service");
const { closeRoundAction } = await import("@/app/teacher/actions");
const { CloseRoundForm } = await import("@/components/close-round-form");
const { LongActionProgress } = await import("@/components/long-action-progress");

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ userId: "prof-1", role: "teacher" } as never);
  vi.mocked(closeCurrentRound).mockReset();
  vi.mocked(closeCurrentRound).mockResolvedValue({ roundIndex: 2, finished: false, alreadyClosed: false });
});

describe("le texte de la confirmation", () => {
  it("compte les équipes qui ont validé et annonce la reconduction des autres", () => {
    const t = confirmationCloture({ tour: 2, validees: 3, total: 5 });
    expect(t.titre).toBe("Clore le tour 2 ?");
    expect(t.detail).toBe(
      "3 équipes sur 5 ont validé leurs décisions. Les 2 autres reconduiront les décisions du tour précédent.",
    );
    expect(t.irreversible).toMatch(/irréversible/);
    expect(t.confirmer).toBe("Clore et simuler");
    expect(t.annuler).toBe("Annuler");
  });

  it("accorde au singulier et signale quand toutes sont prêtes", () => {
    expect(confirmationCloture({ tour: 1, validees: 1, total: 2 }).detail).toBe(
      "1 équipe sur 2 a validé leurs décisions. L'autre reconduira les décisions du tour précédent.",
    );
    expect(confirmationCloture({ tour: 1, validees: 4, total: 4 }).detail).toMatch(/toutes sont prêtes/);
    expect(confirmationCloture({ tour: 1, validees: 0, total: 0 }).detail).toMatch(/Aucune équipe/);
  });
});

describe("le formulaire de clôture", () => {
  const props = { gameId: "g1", tour: 2, validees: 3, total: 5 };

  it("au repos : un seul bouton, qui n'envoie rien", () => {
    const html = renderToStaticMarkup(createElement(CloseRoundForm, props));
    expect(html).toContain("Clore le tour 2 et simuler");
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Clore le tour 2 et simuler/);
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain("Clore et simuler");
    // Le tour affiché voyage avec le formulaire.
    expect(html).toContain('name="roundIndex" value="2"');
  });

  it("confirmation ouverte : la modale dit combien ont validé, irréversible, deux choix", () => {
    const html = renderToStaticMarkup(createElement(CloseRoundForm, { ...props, ouvert: true }));
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Clore le tour 2 ?");
    expect(html).toContain("3 équipes sur 5 ont validé leurs décisions");
    expect(html).toContain("irréversible");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Clore et simuler<\/button>/);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Annuler<\/button>/);
  });
});

describe("l'attente d'une action longue", () => {
  it("une barre indéterminée et le délai annoncé", () => {
    const html = renderToStaticMarkup(createElement(LongActionProgress, { label: ATTENTES.cloture }));
    expect(html).toContain('role="status"');
    expect(html).toContain("barre-indeterminee");
    expect(html).toContain("Simulation en cours, environ 15 s");
  });

  it("les délais annoncés sont ceux du prompt", () => {
    expect(ATTENTES.cloture).toBe("Simulation en cours, environ 15 s");
    expect(ATTENTES.creationPartie).toMatch(/environ 10 s/);
    expect(ATTENTES.creationConcours).toMatch(/environ 10 s/);
    expect(ATTENTES.tirageGroupes).toMatch(/Tirage des groupes.*environ 10 s/);
  });
});

describe("closeRoundAction : le tour confirmé est transmis au serveur", () => {
  function fd(roundIndex: string): FormData {
    const f = new FormData();
    f.set("roundIndex", roundIndex);
    return f;
  }

  it("passe le numéro du tour affiché", async () => {
    const etat = await closeRoundAction("g1", { error: null }, fd("2"));
    expect(etat).toEqual({ error: null });
    expect(closeCurrentRound).toHaveBeenCalledWith({ gameId: "g1", teacherId: "prof-1", expectedRound: 2 });
  });

  it("sans numéro lisible, laisse le serveur clore le tour courant", async () => {
    await closeRoundAction("g1", { error: null }, fd(""));
    expect(closeCurrentRound).toHaveBeenCalledWith({ gameId: "g1", teacherId: "prof-1", expectedRound: undefined });
  });

  it("une erreur du service devient un message, pas une page blanche", async () => {
    vi.mocked(closeCurrentRound).mockRejectedValueOnce(new Error("Cette partie est terminée"));
    const etat = await closeRoundAction("g1", { error: null }, fd("2"));
    expect(etat.error).toBe("Cette partie est terminée");
  });
});
