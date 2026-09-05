import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DIAGNOSTIC,
  MODELE,
  STATUT_RENDUE,
  estComplet,
  estRendue,
  libelleStatut,
  manques,
  manquesEnregistres,
  messageIncomplet,
  statutDesSituations,
} from "@/config/situation-rendu";
import { RoundStatusBanner } from "@/components/round-status-banner";
import type { SituationView } from "@/services/pedagogy.service";

/**
 * LA SITUATION SE REND EN UNE FOIS, OU PAS DU TOUT.
 *
 * Constaté en production : « Enregistrer mon diagnostic » d'un côté,
 * « Valider mes réponses » de l'autre, et des équipes débriefées sur une
 * moitié de copie. Un seul bouton, grisé tant qu'une moitié manque, un
 * refus serveur identique pour un formulaire forgé, et le statut lisible
 * en tête de l'onglet Situation comme dans le bandeau d'en-tête.
 */

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: vi.fn(async () => "invite-1") }));
vi.mock("@/services/game.service", () => ({
  getGameKind: vi.fn(),
  nommerEquipe: vi.fn(),
  resolveCurrentRound: vi.fn(),
  submitTeamDecisions: vi.fn(),
}));
vi.mock("@/services/pedagogy.service", () => ({
  submitDiagnosis: vi.fn(async () => ({ score: 1 })),
  submitQuiz: vi.fn(async () => ({ score: 1 })),
  unlockHint: vi.fn(),
}));

const { submitDiagnosis, submitQuiz } = await import("@/services/pedagogy.service");
const { submitSituationAction } = await import("@/app/arena/[gameId]/actions");
const { SituationCard } = await import("@/components/situation-panel");

const ETAT = { error: null };

function formulaire(champs: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(champs)) {
    for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  }
  return fd;
}

function situation(partiel: Partial<SituationView> = {}): SituationView {
  return {
    instanceId: "inst-1",
    code: "SIT-1",
    category: "alerte_comptable",
    title: "Une marge qui fond",
    narrative: "Le compte de résultat du trimestre montre une marge en recul.",
    problem: "D'où vient le recul ?",
    origin: "scripted",
    status: "open",
    weight: 1,
    level: 1,
    aboveGameLevel: false,
    diagnosticOptions: [
      { id: "a", label: "Le prix a baissé" },
      { id: "b", label: "Les coûts ont monté" },
    ],
    quizQuestions: [
      {
        id: "model_choice",
        prompt: "Quel outil ?",
        options: [
          { id: "m1", label: "Le seuil de rentabilité" },
          { id: "m2", label: "Le BFR" },
        ],
      },
    ],
    quizAnswers: null,
    unlockedHints: [],
    nextHint: null,
    hintLimit: null,
    analyticalHints: [],
    decisionLevers: [],
    triggerFacts: null,
    diagnosis: null,
    rendered: false,
    missed: false,
    retaken: false,
    debrief: null,
    ...partiel,
  };
}

beforeEach(() => {
  vi.mocked(submitDiagnosis).mockClear();
  vi.mocked(submitQuiz).mockClear();
});

describe("ce qui manque au rendu", () => {
  it("nomme la moitié absente, dans l'ordre diagnostic puis modèle", () => {
    expect(manques({ options: [], questions: ["q1"], reponses: {} })).toEqual([DIAGNOSTIC, MODELE]);
    expect(manques({ options: ["a"], questions: ["q1"], reponses: {} })).toEqual([MODELE]);
    expect(manques({ options: [], questions: ["q1"], reponses: { q1: "x" } })).toEqual([DIAGNOSTIC]);
    expect(manques({ options: ["a"], questions: ["q1", "q2"], reponses: { q1: "x" } })).toEqual([MODELE]);
  });

  it("sans question posée, le diagnostic suffit", () => {
    expect(estComplet({ options: ["a"], questions: [], reponses: {} })).toBe(true);
    expect(estComplet({ options: [], questions: [], reponses: {} })).toBe(false);
  });

  it("le message dit exactement ce qui manque", () => {
    expect(messageIncomplet([DIAGNOSTIC])).toBe("Situation incomplète : il manque le diagnostic");
    expect(messageIncomplet([MODELE])).toBe("Situation incomplète : il manque le modèle");
    expect(messageIncomplet([DIAGNOSTIC, MODELE])).toBe(
      "Situation incomplète : il manque le diagnostic et le modèle",
    );
  });

  it("une situation est rendue quand ses deux moitiés sont enregistrées", () => {
    expect(estRendue(situation())).toBe(false);
    expect(manquesEnregistres(situation({ diagnosis: { selected: ["a"], freeText: "" } }))).toEqual([MODELE]);
    expect(manquesEnregistres(situation({ quizAnswers: { model_choice: "m1" } }))).toEqual([DIAGNOSTIC]);
    expect(
      estRendue(situation({ diagnosis: { selected: ["a"], freeText: "" }, quizAnswers: { model_choice: "m1" } })),
    ).toBe(true);
    // Modèle non demandé (QCM désactivés) : le diagnostic seul rend la situation.
    expect(estRendue(situation({ quizQuestions: [], diagnosis: { selected: ["a"], freeText: "" } }))).toBe(true);
  });

  it("le statut d'ensemble du tour agrège sans doublon", () => {
    expect(statutDesSituations([])).toBeNull();
    const s = statutDesSituations([
      situation({ diagnosis: { selected: ["a"], freeText: "" } }),
      situation({ instanceId: "inst-2" }),
    ]);
    expect(s).toEqual({ rendues: 0, total: 2, manques: [DIAGNOSTIC, MODELE] });
    expect(libelleStatut(s!)).toBe("Situation incomplète : il manque le diagnostic et le modèle");
    const rendue = statutDesSituations([
      situation({ diagnosis: { selected: ["a"], freeText: "" }, quizAnswers: { model_choice: "m1" } }),
    ]);
    expect(libelleStatut(rendue!)).toBe(STATUT_RENDUE);
  });
});

describe("submitSituationAction : rendu impossible avec une seule moitié", () => {
  it("diagnostic seul → refus, rien n'est enregistré", async () => {
    const etat = await submitSituationAction(
      "g1",
      "inst-1",
      ETAT,
      formulaire({ options: ["a"], freeText: "", questions: "model_choice" }),
    );
    expect(etat.error).toBe("Situation incomplète : il manque le modèle");
    expect(submitDiagnosis).not.toHaveBeenCalled();
    expect(submitQuiz).not.toHaveBeenCalled();
  });

  it("modèle seul → refus, rien n'est enregistré", async () => {
    const etat = await submitSituationAction(
      "g1",
      "inst-1",
      ETAT,
      formulaire({ questions: "model_choice", quiz_model_choice: "m1" }),
    );
    expect(etat.error).toBe("Situation incomplète : il manque le diagnostic");
    expect(submitDiagnosis).not.toHaveBeenCalled();
    expect(submitQuiz).not.toHaveBeenCalled();
  });

  it("deux questions posées, une seule répondue → refus", async () => {
    const etat = await submitSituationAction(
      "g1",
      "inst-1",
      ETAT,
      formulaire({ options: ["a"], questions: "k1,model_choice", quiz_model_choice: "m1" }),
    );
    expect(etat.error).toBe("Situation incomplète : il manque le modèle");
    expect(submitDiagnosis).not.toHaveBeenCalled();
  });

  it("rendu complet → diagnostic puis modèle enregistrés", async () => {
    const etat = await submitSituationAction(
      "g1",
      "inst-1",
      ETAT,
      formulaire({
        options: ["a", "b"],
        freeText: "Les coûts d'achat ont grimpé.",
        questions: "model_choice",
        quiz_model_choice: "m1",
      }),
    );
    expect(etat).toEqual({ error: null });
    expect(submitDiagnosis).toHaveBeenCalledWith({
      instanceId: "inst-1",
      userId: "invite-1",
      selectedOptionIds: ["a", "b"],
      freeText: "Les coûts d'achat ont grimpé.",
    });
    expect(submitQuiz).toHaveBeenCalledWith({
      instanceId: "inst-1",
      userId: "invite-1",
      answers: { model_choice: "m1" },
    });
    const diagnosticAvant = vi.mocked(submitDiagnosis).mock.invocationCallOrder[0] ?? Infinity;
    const modeleAvant = vi.mocked(submitQuiz).mock.invocationCallOrder[0] ?? -Infinity;
    expect(diagnosticAvant).toBeLessThan(modeleAvant);
  });

  it("sans question posée, le diagnostic seul rend la situation", async () => {
    const etat = await submitSituationAction(
      "g1",
      "inst-1",
      ETAT,
      formulaire({ options: ["b"], freeText: "", questions: "" }),
    );
    expect(etat).toEqual({ error: null });
    expect(submitDiagnosis).toHaveBeenCalledOnce();
    expect(submitQuiz).not.toHaveBeenCalled();
  });

  it("une erreur du service est rendue lisible", async () => {
    vi.mocked(submitQuiz).mockRejectedValueOnce(new Error("Le QCM de cette situation est déjà validé"));
    const etat = await submitSituationAction(
      "g1",
      "inst-1",
      ETAT,
      formulaire({ options: ["a"], questions: "model_choice", quiz_model_choice: "m1" }),
    );
    expect(etat.error).toBe("Le QCM de cette situation est déjà validé");
  });
});

describe("la carte de situation : un seul bouton, grisé tant qu'une moitié manque", () => {
  function carte(s: SituationView): string {
    return renderToStaticMarkup(createElement(SituationCard, { gameId: "g1", situation: s }));
  }

  it("rien de rendu : statut en tête, bouton unique et désactivé", () => {
    const html = carte(situation());
    expect(html).toContain("Situation incomplète : il manque le diagnostic et le modèle");
    expect(html).toContain("Valider mon analyse");
    expect(html).not.toContain("Enregistrer mon diagnostic");
    expect(html).not.toContain("Valider mes réponses");
    expect(html.match(/type="submit"/g)?.length).toBe(1);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    // Le formulaire porte les deux moitiés et la liste des questions à rendre.
    expect(html).toContain('name="options"');
    expect(html).toContain('name="quiz_model_choice"');
    expect(html).toContain('name="questions" value="model_choice"');
  });

  it("diagnostic déjà enregistré, modèle manquant : le statut le dit, les cases restent cochées", () => {
    const html = carte(situation({ diagnosis: { selected: ["b"], freeText: "Mon analyse" } }));
    expect(html).toContain("Situation incomplète : il manque le modèle");
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="b"/);
    expect(html).not.toMatch(/<input[^>]*checked=""[^>]*value="a"/);
    expect(html).toContain("Mon analyse");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
  });

  it("rendue : la confirmation d'enregistrement remplace le formulaire", () => {
    const html = carte(
      situation({ diagnosis: { selected: ["a"], freeText: "" }, quizAnswers: { model_choice: "m1" } }),
    );
    // Plus d'étiquette « Situation rendue » : juste la confirmation
    // d'enregistrement, et le formulaire a disparu.
    expect(html).toContain("Diagnostic et modèle enregistrés");
    expect(html).not.toContain("statut-situation");
    expect(html).not.toContain("Valider mon analyse");
    expect(html).not.toContain('name="options"');
  });

  it("QCM désactivés : le diagnostic seul suffit, sans question dans le formulaire", () => {
    const html = carte(situation({ quizQuestions: [] }));
    expect(html).toContain("Situation incomplète : il manque le diagnostic");
    expect(html).toContain('name="questions" value=""');
    expect(html).not.toContain("quiz_");
  });
});

describe("le bandeau d'en-tête reprend le statut à côté de « À vous de jouer »", () => {
  function bandeau(situations: ReturnType<typeof statutDesSituations>, pendingDecisions = false): string {
    return renderToStaticMarkup(
      createElement(RoundStatusBanner, {
        currentRound: 2,
        roundsCount: 6,
        roundDays: 30,
        pendingDecisions,
        kind: "class",
        finished: false,
        situations,
      }),
    );
  }

  it("incomplète : plus d'étiquette de statut, seul l'appel à décider demeure", () => {
    const html = bandeau(statutDesSituations([situation()]));
    expect(html).toContain("À vous de jouer");
    // On n'affiche plus « Situation incomplète » : le bouton grisé le dit déjà.
    expect(html).not.toContain("statut-situation");
    expect(html).not.toContain("Situation incomplète");
    expect(html).toContain('href="#decisions"');
  });

  it("le bandeau ne montre plus de statut de situation, même une fois rendue", () => {
    const rendue = statutDesSituations([
      situation({ diagnosis: { selected: ["a"], freeText: "" }, quizAnswers: { model_choice: "m1" } }),
    ]);
    expect(bandeau(rendue)).not.toContain("statut-situation");
    expect(bandeau(rendue, true)).not.toContain("statut-situation");
    expect(bandeau(rendue, true)).toContain("Décisions enregistrées");
  });

  it("aucune situation ce tour : rien de plus dans le bandeau", () => {
    const html = bandeau(null);
    expect(html).not.toContain("statut-situation");
  });
});
