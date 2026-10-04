import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  apportPourRemonterLaCaisse,
  ESSAIS_MAX,
  recapitaliserSiBesoin,
} from "@/services/recapitalisation-automatique";
import { roundBriefing } from "@/pedagogy/round-briefing";
import { NOVA_DEFINITION } from "@/config/scenarios/registry";
import type { CompanyRoundResult, RoundDecisions, SimulationOutput } from "@/engine/types";

// Le bandeau charge le formulaire de demande, qui charge les actions serveur, qui
// chargent la base : on ferme cette frontière, ce test ne fait aucune requête.
vi.mock("@/components/demande-subvention", () => ({ DemandeSubvention: () => null }));
const { AlerteTresorerie } = await import("@/components/alerte-tresorerie");

/**
 * LES ASSOCIÉS RECAPITALISENT D'OFFICE, AUX NIVEAUX SANS FINANCEMENT.
 *
 * Aux niveaux 1-2, ni emprunt ni augmentation de capital ne se saisissent ; une
 * crise de trésorerie réclamait pourtant l'un ou l'autre, et la partie se
 * bloquait. Ces tests tiennent la règle qui la remplace, avec un moteur factice :
 * ce qui compte ici est la boucle (rejouer avec l'apport, s'arrêter à
 * l'enveloppe), pas l'économie du moteur — celle-ci est vérifiée de bout en bout
 * dans tests/integration/crise-niveau-1.test.ts.
 */

const resultat = (p: {
  netTreasury: number;
  crisis: boolean;
  requested?: number;
  applied?: number;
}): CompanyRoundResult =>
  ({
    functionalBalance: { netTreasury: p.netTreasury },
    treasury: { crisis: p.crisis },
    ...(p.requested !== undefined ? { capital: { requested: p.requested, applied: p.applied ?? p.requested, remainingAfter: 0 } } : {}),
  }) as unknown as CompanyRoundResult;

const decision = (extra: Partial<RoundDecisions> = {}): RoundDecisions => ({
  price: 59,
  productionPlan: 1000,
  marketingBudget: 0,
  qualityBudget: 0,
  maintenanceBudget: 0,
  ...extra,
});

describe("ce qu'il faut apporter", () => {
  it("de quoi remonter la caisse à zéro, arrondi à l'euro supérieur", () => {
    expect(apportPourRemonterLaCaisse(resultat({ netTreasury: -32_384.44, crisis: true }))).toBe(32_385);
  });

  it("rien hors crise, même avec une caisse négative dans le découvert autorisé", () => {
    expect(apportPourRemonterLaCaisse(resultat({ netTreasury: -10_000, crisis: false }))).toBe(0);
  });

  it("rien quand l'enveloppe est épuisée : la demande a été écrêtée, y ajouter ne change rien", () => {
    expect(
      apportPourRemonterLaCaisse(resultat({ netTreasury: -50_000, crisis: true, requested: 40_000, applied: 10_000 })),
    ).toBe(0);
  });
});

describe("rejouer le tour avec l'apport", () => {
  /** Un moteur factice : la caisse vaut −60 000 + l'apport décidé, moins 5 000 de frais par rejeu. */
  const moteur = (decisions: Record<string, RoundDecisions>): SimulationOutput => {
    const apport = decisions.eq?.finance?.capitalIncrease ?? 0;
    const net = -60_000 + apport;
    return { results: { eq: resultat({ netTreasury: net, crisis: net < -30_000, requested: apport, applied: apport }) } } as unknown as SimulationOutput;
  };

  it("apporte ce qui manque, et le tour rejoué n'est plus en crise", () => {
    const simuler = vi.fn(moteur);
    const r = recapitaliserSiBesoin({ equipes: ["eq"], decisions: { eq: decision() }, simuler });
    expect(r.apports.eq).toBe(60_000);
    expect(r.decisions.eq!.finance?.capitalIncrease).toBe(60_000);
    expect(r.sortie.results.eq!.treasury?.crisis).toBe(false);
    expect(simuler).toHaveBeenCalledTimes(2); // un passage, un rejeu
  });

  it("ne rejoue pas une équipe qui n'est pas en crise", () => {
    const simuler = vi.fn(() => ({ results: { eq: resultat({ netTreasury: 5_000, crisis: false }) } }) as unknown as SimulationOutput);
    const r = recapitaliserSiBesoin({ equipes: ["eq"], decisions: { eq: decision() }, simuler });
    expect(simuler).toHaveBeenCalledTimes(1);
    expect(r.apports).toEqual({});
  });

  it("n'apporte qu'aux équipes désignées : les autres gardent leur crise", () => {
    const simuler = (d: Record<string, RoundDecisions>) =>
      ({
        results: {
          eq: resultat({ netTreasury: -60_000 + (d.eq?.finance?.capitalIncrease ?? 0), crisis: (d.eq?.finance?.capitalIncrease ?? 0) < 30_000 }),
          autre: resultat({ netTreasury: -90_000, crisis: true }),
        },
      }) as unknown as SimulationOutput;
    const r = recapitaliserSiBesoin({ equipes: ["eq"], decisions: { eq: decision(), autre: decision() }, simuler });
    expect(r.apports.autre).toBeUndefined();
    expect(r.decisions.autre!.finance?.capitalIncrease).toBeUndefined();
  });

  it("s'arrête quand l'enveloppe est épuisée, sans boucler : la crise suit son cours", () => {
    // L'enveloppe n'accorde que 10 000 : la demande est écrêtée, la crise reste.
    const simuler = vi.fn((d: Record<string, RoundDecisions>) => {
      const demande = d.eq?.finance?.capitalIncrease ?? 0;
      const applique = Math.min(demande, 10_000);
      return { results: { eq: resultat({ netTreasury: -60_000 + applique, crisis: true, requested: demande, applied: applique }) } } as unknown as SimulationOutput;
    });
    const r = recapitaliserSiBesoin({ equipes: ["eq"], decisions: { eq: decision() }, simuler });
    expect(r.sortie.results.eq!.treasury?.crisis).toBe(true);
    expect(simuler.mock.calls.length).toBeLessThanOrEqual(ESSAIS_MAX + 1);
    expect(simuler.mock.calls.length).toBe(2); // un passage, un rejeu : l'écrêtage est constaté, on s'arrête
  });

  it("ajoute à un apport déjà décidé au lieu de l'écraser, et ne touche pas l'objet d'origine", () => {
    const origine = { eq: decision({ finance: { capitalIncrease: 5_000 } }) };
    const r = recapitaliserSiBesoin({ equipes: ["eq"], decisions: origine, simuler: moteur });
    expect(origine.eq.finance?.capitalIncrease).toBe(5_000);
    expect(r.decisions.eq!.finance?.capitalIncrease).toBeGreaterThanOrEqual(60_000);
  });
});

describe("ce que le joueur lit", () => {
  const alerte = {
    crise: true,
    defaillante: false,
    toursConsecutifs: 1,
    toursAvantDefaillance: 2,
    tresorerieNette: -150_000,
    plafondDecouvert: -120_000,
    manque: 32_384.44,
    financementObligatoire: true,
  };

  it("bandeau, niveaux 1-2 : l'enveloppe est épuisée, plus d'emprunt réclamé", () => {
    const html = renderToStaticMarkup(
      createElement(AlerteTresorerie, { gameId: "g1", alerte, exigence: null, sansFinancement: true }),
    );
    expect(html).toContain("ils ont déjà apporté toute leur enveloppe");
    expect(html).not.toContain("Emprunt, apport des associés, cession");
  });

  it("bandeau, autres niveaux : décider ce tour-ci, comme avant", () => {
    const html = renderToStaticMarkup(
      createElement(AlerteTresorerie, { gameId: "g1", alerte, exigence: null, sansFinancement: false }),
    );
    expect(html).toContain("il faut décider ce tour-ci");
  });

  it("bilan du tour : l'apport des associés est dit au joueur qui ne l'a pas décidé", () => {
    const result = {
      production: { produced: 1000 },
      market: { bySegment: { a: { sold: 800, lost: 0 } } },
      functionalBalance: { netTreasury: 0 },
      balanceSheet: { overdraft: 0 },
      incomeStatement: { operatingIncome: -1000, netIncome: -1000 },
      capital: { requested: 45_000, applied: 45_000, remainingAfter: 55_000 },
    } as unknown as CompanyRoundResult;
    const vocabulary = NOVA_DEFINITION.vocabulary;
    const b = roundBriefing({ result, vocabulary, enabled: { finance: false, investment: false, hr: false }, hasTreasuryTools: true, hasInvestmentOffer: false, perishable: false });
    expect(b.code).toBe("partners_rescue");
    expect(b.headline).toContain("vos associés ont apporté");
    // Aux niveaux qui ont le financement, un apport est une décision du joueur : pas ce message.
    const decide = roundBriefing({ result, vocabulary, enabled: { finance: true, investment: false, hr: false }, hasTreasuryTools: true, hasInvestmentOffer: false, perishable: false });
    expect(decide.code).not.toBe("partners_rescue");
  });
});
