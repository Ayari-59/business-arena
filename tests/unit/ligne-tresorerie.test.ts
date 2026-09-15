import { describe, expect, it } from "vitest";
import { ligneTresorerie } from "@/components/ligne-tresorerie";
import { formatEuro as e } from "@/lib/format";

const rien = {
  discounted: 0, factored: 0, forcedFactored: 0, financingCost: 0, crisis: false, placed: 0, matured: 0, placementIncome: 0,
};

describe("la ligne trésorerie du tour", () => {
  it("tait le coût financier quand il est nul", () => {
    // « coût financier 0 € » à côté d'une crise laissait croire qu'elle ne
    // coûte rien. Une crise sans créances à céder ne coûte pas de commission :
    // on ne le dit pas, on ne dit que ce qui s'est passé.
    const l = ligneTresorerie({ ...rien, crisis: true });
    expect(l).not.toContain("coût financier");
    expect(l).toBe("💶 Trésorerie : 🚨 CRISE DE TRÉSORERIE : plafond dépassé et plus de créances à céder.");
  });

  it("le dit quand il est réel, et ponctue entre les morceaux", () => {
    const l = ligneTresorerie({ ...rien, forcedFactored: 12000, financingCost: 1080, crisis: true });
    expect(l).toBe(
      `💶 Trésorerie : ⚠️ affacturage FORCÉ par la banque ${e(12000)} (découvert au-delà du plafond) · coût financier ${e(1080)}. 🚨 CRISE DE TRÉSORERIE : plafond dépassé et plus de créances à céder.`,
    );
    // pas de séparateur orphelin, jamais
    expect(l).not.toMatch(/·\s*\.|:\s*·|·\s*$/);
  });

  it("enchaîne escompte, placement et coût dans l'ordre des mouvements", () => {
    const l = ligneTresorerie({ ...rien, discounted: 5000, financingCost: 112.5, placed: 20000 });
    expect(l).toBe(
      `💶 Trésorerie : escompte ${e(5000)} · coût financier ${e(112.5)} · ${e(20000)} placés jusqu'au tour suivant`,
    );
  });
});
