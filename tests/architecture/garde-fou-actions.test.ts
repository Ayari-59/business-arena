import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * TOUT FORMULAIRE QUI APPELLE UNE ACTION SERVEUR PASSE PAR LE GARDE-FOU.
 *
 * Le garde-fou (components/guarded-action.tsx) transforme une absence de
 * réponse en message et rejoue la saisie. Il ne sert que s'il est posé
 * partout : ce test lit les sources des formulaires listés dans la vague 1
 * et refuse un useActionState nu ou un <form action={…}> direct sur une
 * action serveur, hors déconnexion.
 */

/** Composants client : le hook, une ref sur le <form>, le message. */
const COMPOSANTS_GARDES = [
  "src/components/competition-create-form.tsx", // création de concours
  "src/components/card-deck.tsx", // tirage de carte
  "src/components/competition-controls.tsx", // inscriptions, groupes, finale
  "src/components/decision-form.tsx", // décisions du tour
  "src/components/situation-panel.tsx", // diagnostic, modèle, indices
  "src/components/team-name-form.tsx", // nom d'entreprise
  "src/components/join-form.tsx", // /join
  "src/components/competition-join-form.tsx", // /compete
];

/** Pages serveur : GuardedForm autour des actions sans état. */
const PAGES_GARDEES: { file: string; formulaires: number }[] = [
  { file: "src/app/teacher/page.tsx", formulaires: 1 }, // création de partie
  { file: "src/app/teacher/games/[gameId]/page.tsx", formulaires: 3 }, // questions posées, situations manquées, clôture
];

describe("composants client gardés", () => {
  for (const file of COMPOSANTS_GARDES) {
    it(`${file} : useGuardedAction, ref sur le formulaire, message affiché`, () => {
      const source = readFileSync(file, "utf8");
      expect(source, "useActionState nu").not.toMatch(/\buseActionState\b/);
      expect(source).toContain("useGuardedAction(");
      expect(source).toContain("<GuardError");
      const formulaires = source.match(/<form\b/g) ?? [];
      const refs = source.match(/<form\s+ref=\{[a-zA-Z.]*formRef\}/g) ?? [];
      expect(refs.length, "chaque <form> porte la ref du garde-fou").toBe(formulaires.length);
      expect(formulaires.length).toBeGreaterThan(0);
      // Chaque appel nomme l'action, pour la console.
      const appels = source.match(/useGuardedAction\(/g) ?? [];
      const labels = source.match(/label:\s*[`"']/g) ?? [];
      expect(labels.length).toBeGreaterThanOrEqual(appels.length);
    });
  }
});

describe("pages serveur gardées", () => {
  for (const { file, formulaires } of PAGES_GARDEES) {
    it(`${file} : ${formulaires} GuardedForm, aucun <form action> direct hors déconnexion`, () => {
      const source = readFileSync(file, "utf8");
      const gardes = source.match(/<GuardedForm\b/g) ?? [];
      expect(gardes.length).toBe(formulaires);
      const directs = (source.match(/<form\s+action=\{([a-zA-Z.]+)/g) ?? []).map((m) =>
        m.replace(/<form\s+action=\{/, ""),
      );
      expect(directs.filter((a) => a !== "logoutAction")).toEqual([]);
    });
  }
});

describe("le garde-fou lui-même", () => {
  const source = readFileSync("src/components/guarded-action.tsx", "utf8");

  it("attrape tout, ne réessaie jamais, désactive pendant l'attente", () => {
    expect(source).toContain("catch (e)");
    expect(source).not.toMatch(/retry|réessai automatique/i);
    expect(source).toContain("console.warn(\"[action-failed]\"");
    expect(source).toContain("disabled={pending}");
  });

  it("le délai par défaut est de 20 secondes", () => {
    expect(source).toContain("DELAI_PAR_DEFAUT_MS = 20_000");
  });
});
