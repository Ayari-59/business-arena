import { describe, expect, it, vi } from "vitest";
import { aideAuDiagnosticFromProfile, niveauDuDiagnostic } from "@/config/difficulty";
import { distracteursDuModele, modeleAvecAide, optionsDuDiagnostic } from "@/config/analyse-par-niveau";

// `debrief.service` traverse `@/db`, dont l'import jette sans DATABASE_URL :
// aucune requête n'est faite ici, on ne lit que le contexte d'une partie.
vi.mock("@/db", () => ({ db: {} }));
const { modelCtxOf } = await import("@/services/debrief.service");

/**
 * L'AIDE AU DIAGNOSTIC (demande du propriétaire, 14 novembre) : aux niveaux 4 à
 * 6, l'enseignant peut rendre le diagnostic plus facile, comme au niveau 3
 * (« guidés ») ou aux niveaux 1-2 (« très guidés »), sans toucher au reste de la
 * partie. Jamais plus difficile que le niveau.
 */

const options = [
  { id: "a", correct: true },
  { id: "b", correct: false },
  { id: "c", correct: false },
  { id: "d", correct: false },
];

function partie(niveau: number, aide?: string) {
  return {
    seed: "42",
    difficultyProfile: { difficulty: { level: niveau }, ...(aide ? { aideAuDiagnostic: aide } : {}) },
  } as unknown as Parameters<typeof modelCtxOf>[0];
}

describe("l'aide au diagnostic", () => {
  it("absente ou inconnue, le diagnostic suit le niveau (parties d'avant le réglage)", () => {
    expect(aideAuDiagnosticFromProfile({})).toBe("niveau");
    expect(aideAuDiagnosticFromProfile({ aideAuDiagnostic: "plus-dur" })).toBe("niveau");
    expect(modelCtxOf(partie(5))).toMatchObject({ level: 5, analyse: 5 });
  });

  it("« guidés » ramène un niveau 4, 5 ou 6 au diagnostic du niveau 3", () => {
    for (const niveau of [4, 5, 6]) {
      const ctx = modelCtxOf(partie(niveau, "guide"))!;
      expect(ctx.level).toBe(niveau);
      expect(ctx.analyse).toBe(3);
      expect(optionsDuDiagnostic(options, ctx.analyse)).toHaveLength(3);
      expect(distracteursDuModele(ctx.analyse)).toBe(2);
      expect(modeleAvecAide(ctx.analyse)).toBe(true);
    }
  });

  it("« très guidés » ramène un niveau 4, 5 ou 6 au choix entre deux des niveaux 1-2", () => {
    for (const niveau of [4, 5, 6]) {
      const ctx = modelCtxOf(partie(niveau, "tres-guide"))!;
      expect(ctx.analyse).toBe(2);
      expect(optionsDuDiagnostic(options, ctx.analyse)).toHaveLength(2);
      expect(distracteursDuModele(ctx.analyse)).toBe(1);
    }
  });

  it("jamais plus difficile que le niveau de la partie", () => {
    expect(niveauDuDiagnostic(1, "guide")).toBe(1);
    expect(niveauDuDiagnostic(2, "guide")).toBe(2);
    expect(niveauDuDiagnostic(1, "tres-guide")).toBe(1);
    for (let n = 1; n <= 7; n++) {
      for (const aide of ["niveau", "guide", "tres-guide"] as const) {
        expect(niveauDuDiagnostic(n, aide)).toBeLessThanOrEqual(n);
      }
    }
  });
});
