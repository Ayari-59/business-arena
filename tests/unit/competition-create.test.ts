import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * UNE CRÉATION DE CONCOURS QUI ÉCHOUE LE DIT, ET GARDE LA SAISIE.
 *
 * Constaté en production : première soumission du formulaire « Organiser un
 * concours » → champ nom vidé, aucun message, aucun concours créé ; le second
 * essai identique réussissait. L'action ne pouvait pas répondre autrement que
 * par une redirection, et toute erreur repartait sans être montrée.
 *
 * Les gardes : l'action renvoie toujours un état (erreur lisible + saisie),
 * la redirection n'a lieu que si le concours existe, et le formulaire affiche
 * l'erreur en remettant la saisie à sa place.
 */

const REDIRECTION = "__redirect__";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`${REDIRECTION}${url}`);
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
const { getTeacherOrgId } = await import("@/services/auth.service");
const { createCompetition } = await import("@/services/competition.service");
const { createCompetitionAction } = await import("@/app/teacher/actions");
const { CompetitionCreateForm } = await import("@/components/competition-create-form");

const ETAT = { error: null, values: null };

function formulaire(champs: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) fd.set(k, v);
  return fd;
}

const SAISIE = { name: "Championnat QA", periodicity: "month", groupSize: "4", advancePerGroup: "2" };

beforeEach(() => {
  vi.mocked(getSession).mockResolvedValue({ userId: "prof-1", role: "teacher" } as never);
  vi.mocked(getTeacherOrgId).mockResolvedValue("org-1");
  vi.mocked(createCompetition).mockReset();
});

describe("createCompetitionAction", () => {
  it("nom vide : une erreur explicite, rien de créé, la saisie rendue", async () => {
    const etat = await createCompetitionAction(ETAT, formulaire({ ...SAISIE, name: "   " }));
    expect(etat.error).toBe("Donnez un nom au concours.");
    expect(etat.values).toMatchObject({ name: "   ", periodicity: "month", groupSize: "4" });
    expect(createCompetition).not.toHaveBeenCalled();
  });

  it("données valides : le concours est créé et l'enseignant redirigé vers sa page", async () => {
    vi.mocked(createCompetition).mockResolvedValue({ competitionId: "concours-42", joinCode: "E8C7Y4" });
    await expect(createCompetitionAction(ETAT, formulaire(SAISIE))).rejects.toThrow(
      `${REDIRECTION}/teacher/competitions/concours-42`,
    );
    expect(createCompetition).toHaveBeenCalledWith({
      organizerId: "prof-1",
      organizationId: "org-1",
      name: "Championnat QA",
      periodicity: "month",
      groupSize: 4,
      advancePerGroup: 2,
    });
  });

  it("le service échoue : un message, pas une redirection, et la saisie conservée", async () => {
    vi.mocked(createCompetition).mockRejectedValue(new Error("connexion perdue"));
    const etat = await createCompetitionAction(ETAT, formulaire(SAISIE));
    expect(etat.error).toContain("n'a pas pu être créé");
    expect(etat.error).toContain("connexion perdue");
    expect(etat.values).toEqual(SAISIE);
  });

  it("sans établissement rattaché : un message, pas un renvoi muet vers la connexion", async () => {
    vi.mocked(getTeacherOrgId).mockResolvedValue(null);
    const etat = await createCompetitionAction(ETAT, formulaire(SAISIE));
    expect(etat.error).toContain("aucun établissement");
    expect(etat.values?.name).toBe("Championnat QA");
    expect(createCompetition).not.toHaveBeenCalled();
  });

  it("session expirée : un message plutôt qu'une redirection", async () => {
    vi.mocked(getSession).mockResolvedValue(null as never);
    const etat = await createCompetitionAction(ETAT, formulaire(SAISIE));
    expect(etat.error).toContain("Session expirée");
    expect(createCompetition).not.toHaveBeenCalled();
  });
});

describe("CompetitionCreateForm", () => {
  it("vierge : les champs de l'action, un bouton, aucun message d'erreur", () => {
    const html = renderToStaticMarkup(createElement(CompetitionCreateForm));
    for (const nom of ["name", "periodicity", "groupSize", "advancePerGroup"]) {
      expect(html).toContain(`name="${nom}"`);
    }
    expect(html).toContain("Créer le concours et ouvrir les inscriptions");
    expect(html).not.toContain('role="alert"');
  });

  it("après un échec : l'erreur est affichée et la saisie remise en place", () => {
    const html = renderToStaticMarkup(
      createElement(CompetitionCreateForm, {
        initial: { error: "Donnez un nom au concours.", values: SAISIE },
      }),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Donnez un nom au concours.");
    expect(html).toContain('value="Championnat QA"');
    expect(html).toMatch(/<option[^>]*selected[^>]*value="4"|<option[^>]*value="4"[^>]*selected/);
    expect(html).toMatch(/<option[^>]*selected[^>]*value="month"|<option[^>]*value="month"[^>]*selected/);
  });
});
