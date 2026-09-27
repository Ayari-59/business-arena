import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { novaScenario, novaCompany } from "@/config/scenarios/nova";
import { botDecisions } from "@/engine/bots";
import type {
  CompanyState,
  IncomeStatement,
  RoundDecisions,
  SimulationInput,
} from "@/engine/types";
import {
  basDuCompte,
  structureDuTour,
  verdictDuTour,
} from "@/pedagogy/verdict-du-tour";
import { formatEuro } from "@/lib/format";

/**
 * OÙ LE TOUR S'EST JOUÉ.
 *
 * Le verdict répartit l'écart de résultat entre trois postes — la marge, la
 * structure, le bas du compte — et nomme le plus gros. Deux choses doivent
 * tenir, et la première est une identité comptable :
 *
 * · LA SOMME DES TROIS EST L'ÉCART, au centime. Si elle ne l'était pas, la
 *   phrase « le tour s'est joué sur X » serait une opinion.
 * · LA PHRASE DIT CE QUI S'EST PASSÉ, y compris le cas qui trompe : un poste
 *   gagne beaucoup, un autre reprend presque tout, et le résultat bouge à
 *   peine.
 *
 * Les deux premiers essais tournent sur de VRAIS tours du moteur : un verdict
 * qui ne se vérifie que sur des chiffres écrits à la main ne prouve rien.
 */

function deuxToursNova(
  tour1: Partial<RoundDecisions>,
  tour2: Partial<RoundDecisions>,
): [IncomeStatement, IncomeStatement] {
  const player = novaCompany("player", "NOVA One", "human");
  const bot = novaCompany("bot", "SoundBox", "bot", "price_aggressive");
  const base: RoundDecisions = {
    price: 59,
    productionPlan: 5000,
    marketingBudget: 5000,
    qualityBudget: 3000,
    maintenanceBudget: 4000,
  } as RoundDecisions;

  const joue = (
    roundIndex: number,
    etats: { player: CompanyState; bot: CompanyState },
    decisions: Partial<RoundDecisions>,
  ) => {
    const input: SimulationInput = {
      scenario: novaScenario,
      roundIndex,
      companies: [etats.player, etats.bot],
      decisions: {
        player: { ...base, ...decisions },
        bot: botDecisions("price_aggressive", {
          scenario: novaScenario,
          state: etats.bot,
          roundIndex,
        }),
      },
      activeEvents: [],
      seed: 7,
    } as SimulationInput;
    return simulateRound(input);
  };

  const un = joue(1, { player, bot }, tour1);
  // Le tour deux part des ÉTATS sortis du tour un : stocks, trésorerie et
  // qualité perçue s'enchaînent, sinon les deux comptes ne se suivent pas.
  const suite = (id: string) => un.companies.find((c) => c.id === id)!;
  const deux = joue(2, { player: suite("player"), bot: suite("bot") }, tour2);
  return [
    un.results["player"]!.incomeStatement,
    deux.results["player"]!.incomeStatement,
  ];
}

/** Un compte de résultat cohérent, écrit depuis ses trois blocs. */
function compte({
  marge,
  structure,
  bas,
}: {
  marge: number;
  structure: number;
  bas: number;
}): IncomeStatement {
  const ebitda = marge - structure;
  return {
    revenue: marge * 2,
    productionStocked: 0,
    cogs: marge,
    variableProductionCost: marge,
    grossMargin: marge,
    marketingCost: structure,
    qualityCost: 0,
    maintenanceCost: 0,
    fixedCosts: 0,
    ebitda,
    depreciation: bas,
    operatingIncome: ebitda - bas,
    interest: 0,
    pretaxIncome: ebitda - bas,
    tax: 0,
    netIncome: ebitda - bas,
  };
}

describe("le verdict du tour", () => {
  it("répartit l'écart de résultat sans reste, sur un vrai tour du moteur", () => {
    const [un, deux] = deuxToursNova({}, { price: 64, marketingBudget: 12000 });
    const v = verdictDuTour(deux, un);
    const somme = v.contributions.reduce((t, c) => t + c.apport, 0);
    expect(v.ecart).not.toBeNull();
    expect(somme).toBeCloseTo(v.ecart!, 2);
    // Et l'écart est bien celui des deux comptes.
    expect(v.ecart!).toBeCloseTo(deux.netIncome - un.netIncome, 6);
  });

  it("décompose le tour en trois postes qui rendent le résultat", () => {
    const [, deux] = deuxToursNova({}, { qualityBudget: 9000 });
    // marge − structure − bas = net : c'est l'identité dont vit le verdict.
    expect(
      deux.grossMargin - structureDuTour(deux) - basDuCompte(deux),
    ).toBeCloseTo(deux.netIncome, 2);
    expect(verdictDuTour(deux, null).contributions).toHaveLength(0);
  });

  it("nomme le poste qui a fait le tour, et le chiffre", () => {
    const avant = compte({ marge: 100_000, structure: 60_000, bas: 10_000 });
    const apres = compte({ marge: 130_000, structure: 60_000, bas: 10_000 });
    const v = verdictDuTour(apres, avant);
    expect(v.poste).toBe("marge");
    expect(v.ton).toBe("bon");
    expect(v.phrase).toContain("la marge sur les ventes");
    expect(v.phrase).toContain("elle a rapporté");
    expect(v.phrase).toContain(`${formatEuro(30_000)} de plus`);
  });

  it("dit quand un poste reprend ce que l'autre a gagné", () => {
    // Le cas qui trompe : 30 000 € de marge en plus, 28 000 € de budgets en
    // plus, et un résultat qui bouge à peine. Sans l'incise, l'élève croit que
    // la décomposition mentait.
    const avant = compte({ marge: 100_000, structure: 60_000, bas: 10_000 });
    const apres = compte({ marge: 130_000, structure: 88_000, bas: 10_000 });
    const v = verdictDuTour(apres, avant);
    expect(v.poste).toBe("marge");
    expect(v.phrase).toContain("En face, les charges de structure ont repris");
    expect(v.phrase).toContain(formatEuro(28_000));
  });

  it("accorde la phrase au poste dont elle parle", () => {
    const avant = compte({ marge: 100_000, structure: 40_000, bas: 10_000 });
    const structure = verdictDuTour(
      compte({ marge: 100_000, structure: 70_000, bas: 10_000 }),
      avant,
    );
    expect(structure.poste).toBe("structure");
    expect(structure.phrase).toContain("elles ont coûté");
    expect(structure.phrase).toContain(`${formatEuro(30_000)} de plus`);
    const bas = verdictDuTour(
      compte({ marge: 100_000, structure: 40_000, bas: 31_000 }),
      avant,
    );
    expect(bas.poste).toBe("bas");
    expect(bas.phrase).toContain("il a pris");
    expect(bas.phrase).toContain(`${formatEuro(21_000)} de plus`);
  });

  it("dit qu'une marge en recul rapporte moins, et non qu'elle coûte plus", () => {
    // Le piège de la phrase à trous : « la marge a coûté 30 000 € de plus » se
    // lisait à l'envers de ce qui s'était passé.
    const v = verdictDuTour(
      compte({ marge: 100_000, structure: 60_000, bas: 10_000 }),
      compte({ marge: 130_000, structure: 60_000, bas: 10_000 }),
    );
    expect(v.poste).toBe("marge");
    expect(v.ton).toBe("mauvais");
    expect(v.phrase).toContain(`elle a rapporté ${formatEuro(30_000)} de moins`);
    expect(v.phrase).not.toContain("coûté");
  });

  it("au premier tour, dit si la marge couvre la structure", () => {
    const couvre = verdictDuTour(
      compte({ marge: 100_000, structure: 60_000, bas: 0 }),
      null,
    );
    expect(couvre.ecart).toBeNull();
    expect(couvre.poste).toBeNull();
    expect(couvre.phrase).toContain("couvre les charges de structure");
    expect(couvre.ton).toBe("bon");
    const decouvert = verdictDuTour(
      compte({ marge: 40_000, structure: 60_000, bas: 0 }),
      null,
    );
    expect(decouvert.phrase).toContain("ne couvre pas");
    expect(decouvert.ton).toBe("mauvais");
  });

  it("ne prétend pas qu'un tour immobile s'est joué quelque part", () => {
    const meme = compte({ marge: 100_000, structure: 60_000, bas: 10_000 });
    const v = verdictDuTour(meme, meme);
    expect(v.ton).toBe("neutre");
    expect(v.poste).toBeNull();
    expect(v.phrase).toContain("Rien n'a bougé");
  });
});
