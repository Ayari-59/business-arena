import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { novaScenario, novaCompany } from "@/config/scenarios/nova";
import { botDecisions } from "@/engine/bots";
import type { RoundDecisions, SimulationInput } from "@/engine/types";
import {
  ecartAuTourPrecedent,
  lectureDeLaTresorerie,
  lectureDuBilan,
  lectureDuResultat,
} from "@/components/lecture-des-comptes";
import { formatEuro } from "@/lib/format";

/**
 * LES COMPTES PARLENT. En tête de chaque état, une phrase dit le chemin des
 * chiffres, avec la voix et le ton de la lecture bancaire. Elle est calculée
 * sur un vrai tour du moteur : on vérifie qu'elle cite les bons montants et
 * qu'elle prend le bon ton.
 */
function tourNova(decisions: Partial<RoundDecisions> = {}) {
  const player = novaCompany("player", "NOVA One", "human");
  const bot = novaCompany("bot", "SoundBox", "bot", "price_aggressive");
  const base: RoundDecisions = {
    price: 59,
    productionPlan: 5000,
    marketingBudget: 5000,
    qualityBudget: 3000,
    maintenanceBudget: 4000,
    ...decisions,
  } as RoundDecisions;
  const input: SimulationInput = {
    scenario: novaScenario,
    roundIndex: 1,
    companies: [player, bot],
    decisions: {
      player: base,
      bot: botDecisions("price_aggressive", { scenario: novaScenario, state: bot, roundIndex: 1 }),
    },
    activeEvents: [],
    seed: 7,
  } as SimulationInput;
  return simulateRound(input).results["player"]!;
}

describe("la lecture du compte de résultat", () => {
  it("cite les ventes, la marge sur coût variable et la structure, et prend le ton du résultat", () => {
    const r = tourNova();
    const cr = r.incomeStatement;
    const lecture = lectureDuResultat(cr);
    expect(lecture.texte).toContain(formatEuro(cr.revenue));
    expect(lecture.texte).toContain(formatEuro(cr.grossMargin));
    expect(lecture.texte).toContain(formatEuro(cr.netIncome));
    expect(lecture.ton).toBe(cr.netIncome >= 0 ? "bon" : "mauvais");
  });

  it("dit quand la structure dépasse la marge, avant même les amortissements", () => {
    const lecture = lectureDuResultat({
      revenue: 100_000,
      cogs: 60_000,
      grossMargin: 40_000,
      marketingCost: 10_000,
      qualityCost: 5_000,
      maintenanceCost: 5_000,
      fixedCosts: 30_000,
      ebitda: -10_000,
      depreciation: 4_000,
      operatingIncome: -14_000,
      interest: 1_000,
      tax: 0,
      netIncome: -15_000,
      productionStocked: 0,
    } as never);
    expect(lecture.ton).toBe("mauvais");
    expect(lecture.texte).toContain("la dépassent");
    expect(lecture.texte).toContain(formatEuro(10_000));
  });

  it("ne raconte pas de marge quand rien n'a été vendu", () => {
    const lecture = lectureDuResultat({
      revenue: 0, cogs: 0, grossMargin: 0, marketingCost: 0, qualityCost: 0, maintenanceCost: 0,
      fixedCosts: 20_000, ebitda: -20_000, depreciation: 0, operatingIncome: -20_000, interest: 0,
      tax: 0, netIncome: -20_000, productionStocked: 0,
    } as never);
    expect(lecture.texte).toContain("Aucune vente");
    expect(lecture.ton).toBe("mauvais");
  });
});

describe("la lecture du bilan", () => {
  it("lit l'équilibre fonctionnel : fonds de roulement, besoin, trésorerie nette", () => {
    const r = tourNova();
    const lecture = lectureDuBilan(r.balanceSheet, r.functionalBalance);
    expect(lecture.texte).toContain(formatEuro(r.functionalBalance.frng));
    expect(lecture.texte).toContain(formatEuro(r.functionalBalance.netTreasury));
  });

  it("nomme le découvert quand il comble l'écart, et le capital mangé par les pertes", () => {
    const lecture = lectureDuBilan(
      { fixedAssetsNet: 100, inventoryValue: 10, receivables: 10, cash: 0, equity: -5, financialDebt: 50, payables: 5, overdraft: 30 },
      { frng: -55, bfr: 15, netTreasury: -30 },
    );
    expect(lecture.ton).toBe("mauvais");
    expect(lecture.texte).toContain("capitaux propres négatifs");
    expect(lecture.texte).toContain("ne couvrent pas l'outil");
    expect(lecture.texte).toContain("le découvert");
  });
});

describe("la lecture du budget de trésorerie", () => {
  it("dit d'où à où, si les encaissements ont couvert, et le poste le plus lourd", () => {
    const r = tourNova();
    const labels = { encaissements_clients: "Encaissements clients", paiements_fournisseurs: "Paiements fournisseurs" };
    const lecture = lectureDeLaTresorerie(r.cashFlow, labels);
    expect(lecture.texte).toContain(formatEuro(r.cashFlow.opening));
    expect(lecture.texte).toContain(formatEuro(r.cashFlow.closing));
    expect(lecture.texte).toContain("le poste le plus lourd");
  });

  it("prend le ton mauvais quand la caisse finit à découvert", () => {
    const lecture = lectureDeLaTresorerie(
      { opening: 1000, items: [{ label: "a", amount: 500 }, { label: "b", amount: -2000 }], closing: -500 },
      { a: "Encaissements", b: "Paiements" },
    );
    expect(lecture.ton).toBe("mauvais");
    expect(lecture.texte).toContain("n'ont pas couvert");
    expect(lecture.texte).toContain("paiements");
  });
});

/**
 * LA COLONNE D'ÉCART DES ÉTATS FINANCIERS.
 *
 * Un niveau ne dit pas si c'est bon : 1 240 000 € de chiffre d'affaires est une
 * bonne nouvelle après 980 000, une mauvaise après 1 400 000. C'est la colonne
 * d'écart qui le dit — et c'est elle, seule, qui porte le vert et le rouge
 * depuis qu'il n'y a plus de jauge ni de pastille « tenu / manqué ».
 *
 * Deux règles, et la première est celle qui s'oubliait : SANS RÉFÉRENCE AU TOUR
 * PRÉCÉDENT, LA CELLULE RESTE VIDE. Écrire « 0 » dirait « rien n'a bougé », ce
 * qui est faux — on ne sait pas.
 */
describe("l'écart au tour précédent", () => {
  it("au premier tour, il n'y a pas d'écart : null, et non zéro", () => {
    expect(ecartAuTourPrecedent(1_240_000, null)).toBeNull();
    expect(ecartAuTourPrecedent(1_240_000, undefined)).toBeNull();
  });

  it("une ligne que le tour précédent ne portait pas n'a pas d'écart non plus", () => {
    // Une charge de R&D, une subvention de sauvetage : la ligne apparaît ce
    // tour-ci, et rien ne la précède.
    expect(ecartAuTourPrecedent(-12_000, undefined)).toBeNull();
  });

  it("l'écart est signé dans le sens où la ligne s'affiche", () => {
    expect(ecartAuTourPrecedent(1_240_000, 980_000)).toEqual({
      montant: 260_000,
      relatif: 260_000 / 980_000,
    });
    // Une charge s'affiche en négatif : elle s'aggrave en descendant.
    expect(ecartAuTourPrecedent(-9_000, -6_000)?.montant).toBe(-3_000);
  });

  it("le pourcentage se taît quand il n'a pas de sens", () => {
    // Référence nulle : division impossible.
    expect(ecartAuTourPrecedent(4_000, 0)).toEqual({ montant: 4_000, relatif: null });
    // Changement de signe : « +250 % » pour un passage de −2 000 à +3 000 ne
    // veut rien dire ; le montant, lui, le dit.
    expect(ecartAuTourPrecedent(3_000, -2_000)).toEqual({ montant: 5_000, relatif: null });
    expect(ecartAuTourPrecedent(-2_000, 3_000)).toEqual({ montant: -5_000, relatif: null });
  });

  it("un écart nul se distingue d'un écart inconnu", () => {
    expect(ecartAuTourPrecedent(5_000, 5_000)).toEqual({ montant: 0, relatif: 0 });
  });
});
