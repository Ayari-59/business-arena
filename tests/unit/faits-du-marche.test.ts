import { describe, expect, it } from "vitest";
import { faitsDuMarche } from "@/lib/faits-du-marche";
import type { GameView } from "@/services/game-view.service";

/**
 * LA BANDE DE MARCHÉ NE MONTRE QUE DES FAITS DE LA PARTIE (lot 6C).
 *
 * Trois choses doivent rester vraies :
 *   1. un écart n'existe QUE si la vue expose la valeur du tour passé — sinon le
 *      fait est posé sans écart, jamais avec un chiffre fabriqué ;
 *   2. les faits porteurs d'écart passent AVANT les faits posés (c'est eux qui
 *      font la vie de la bande) ;
 *   3. chaque valeur vient d'une donnée de la vue, pas d'une invention.
 *
 * Vue rouge une fois : avant de forcer l'ordre, « saison » sortait avant « prix
 * du marché » et la bande montrait d'abord un fait sans écart.
 */

/** Une vue minimale : seuls les champs que la fonction lit sont posés. */
function vue(p: Partial<GameView>): GameView {
  return {
    competitiveBenchmark: null,
    periods: [],
    seasonNotes: [],
    costFacts: { materialCostPerUnit: 0, otherVariableCostPerUnit: 0 },
    financeOffer: null,
    bankFile: null,
    courriersEnCours: [],
    classement: { revele: false, parLAnimateur: false },
    ranking: [],
    gamme: null,
    ...p,
  } as unknown as GameView;
}

function bench(marketAvgPrice: number, playerShare: number, index: number) {
  return {
    competitors: [
      {
        name: "Vous",
        isPlayer: true,
        avgPrice: 100,
        marketShare: playerShare,
        revenue: 0,
        style: null,
        embleme: null,
      },
    ],
    marketAvgPrice,
    competitivenessIndex: index,
  } as NonNullable<GameView["competitiveBenchmark"]>;
}

describe("les faits de la bande de marché", () => {
  it("ne porte aucun écart au premier tour (rien à comparer)", () => {
    const now = bench(120, 0.25, 1.05);
    const faits = faitsDuMarche(vue({ competitiveBenchmark: now, periods: [] }));
    const prix = faits.find((f) => f.cle === "prix-marche");
    expect(prix).toBeDefined();
    expect(prix!.valeur).toContain("120");
    // Pas de tour passé dans periods : pas d'écart inventé.
    expect(prix!.ecart).toBeNull();
  });

  it("porte un écart réel quand le tour passé est dans periods", () => {
    const prev = bench(100, 0.2, 1.0);
    const now = bench(120, 0.25, 1.1);
    const faits = faitsDuMarche(
      vue({
        competitiveBenchmark: now,
        // periods.at(-2) est le tour d'avant le dernier clos.
        periods: [
          { competitiveBenchmark: prev },
          { competitiveBenchmark: now },
        ] as unknown as GameView["periods"],
      }),
    );
    const prix = faits.find((f) => f.cle === "prix-marche")!;
    expect(prix.ecart).not.toBeNull();
    expect(prix.ecart!.valeur).toBeCloseTo(20); // 120 - 100
    const part = faits.find((f) => f.cle === "part-marche")!;
    expect(part.ecart!.valeur).toBeCloseTo(0.05); // 0,25 - 0,20
  });

  it("met les faits porteurs d'écart avant les faits posés", () => {
    const prev = bench(100, 0.2, 1.0);
    const now = bench(120, 0.25, 1.1);
    const faits = faitsDuMarche(
      vue({
        competitiveBenchmark: now,
        periods: [
          { competitiveBenchmark: prev },
          { competitiveBenchmark: now },
        ] as unknown as GameView["periods"],
        costFacts: { materialCostPerUnit: 30, otherVariableCostPerUnit: 10 },
        financeOffer: { loanAnnualRate: 0.05, loanDurationRounds: null, roundDays: 30 },
      }),
    );
    const premierPose = faits.findIndex((f) => f.ecart === null);
    const dernierAvecEcart = faits.map((f) => f.ecart !== null).lastIndexOf(true);
    expect(dernierAvecEcart).toBeLessThan(premierPose);
  });

  it("pose le coût variable et le taux sans écart (le tour passé n'est pas exposé)", () => {
    const faits = faitsDuMarche(
      vue({
        costFacts: { materialCostPerUnit: 30, otherVariableCostPerUnit: 10 },
        financeOffer: { loanAnnualRate: 0.05, loanDurationRounds: null, roundDays: 30 },
      }),
    );
    const cout = faits.find((f) => f.cle === "cout-variable")!;
    expect(cout.valeur).toContain("40");
    expect(cout.ecart).toBeNull();
    const credit = faits.find((f) => f.cle === "credit")!;
    expect(credit.ecart).toBeNull();
  });

  it("ne montre le rang que lorsque le classement est révélé", () => {
    const ranking = [
      { isPlayer: true, rank: 2 },
      { isPlayer: false, rank: 1 },
    ] as unknown as GameView["ranking"];
    expect(
      faitsDuMarche(vue({ ranking, classement: { revele: false, parLAnimateur: true } })).some(
        (f) => f.cle === "rang",
      ),
    ).toBe(false);
    expect(
      faitsDuMarche(vue({ ranking, classement: { revele: true, parLAnimateur: true } })).some(
        (f) => f.cle === "rang",
      ),
    ).toBe(true);
  });
  it("en gamme, le coût variable est une FOURCHETTE par référence, jamais le chiffre d'une seule", () => {
    // Vu rouge : la bande écrivait « 27 € », le coût de la PREMIÈRE référence
    // seulement (costFacts), là où la gamme va de 27 à 77 €. Le contexte de
    // décision le dit déjà : « un seul chiffre mentirait ».
    const ref = (m: number, o: number) => ({ materialCostPerUnit: m, otherVariableCostPerUnit: o });
    const faits = faitsDuMarche(
      vue({
        costFacts: { materialCostPerUnit: 20, otherVariableCostPerUnit: 7 },
        gamme: [ref(20, 7), ref(70, 7), ref(35, 7), ref(41, 7)] as unknown as GameView["gamme"],
      }),
    );
    const cout = faits.find((f) => f.cle === "cout-variable")!;
    expect(cout.valeur).toMatch(/27\s*€\s*–\s*77\s*€/);
    expect(cout.ecart).toBeNull();
  });

  it("ne juge en vert ou rouge que l'écart dont le sens est une bonne ou une mauvaise nouvelle", () => {
    // Un prix du marché qui baisse, un indice de compétitivité-prix qui baisse :
    // ni bon ni mauvais en soi. La part de marché qui monte : une bonne nouvelle.
    const prev = bench(100, 0.2, 1.1);
    const now = bench(90, 0.25, 1.0);
    const faits = faitsDuMarche(
      vue({
        competitiveBenchmark: now,
        periods: [
          { competitiveBenchmark: prev },
          { competitiveBenchmark: now },
        ] as unknown as GameView["periods"],
      }),
    );
    const lecture = (cle: string) => faits.find((f) => f.cle === cle)!.ecart!.lecture;
    expect(lecture("prix-marche")).toBe("neutre");
    expect(lecture("indice-prix")).toBe("neutre");
    expect(lecture("part-marche")).toBe("favorable-a-la-hausse");
  });
});
