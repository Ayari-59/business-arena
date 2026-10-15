import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import {
  ebeDouzeMois,
  initialiserLeGroupe,
  valoriser,
  detteNette,
  type EtatDeGroupe,
} from "@/engine/groupe";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { NIVEAU_GROUPE, presetByLevel } from "@/config/difficulty";
import { auCentime } from "../helpers/partie-nova-gamme";

/**
 * LA VALEUR DE L'ENTREPRISE (niveau 7) : lue, jamais jouée.
 *
 * Le bloc de groupe fait dire sa valeur à chaque entreprise, tour par tour ;
 * il ne change rien aux flux d'une partie qui ne rachète ni ne sous-traite.
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "passive"];

function jouer(
  scenario: EngineScenarioConfig,
  leviers = presetByLevel.get(6)!.decisions,
  retouche?: (tour: number, id: string, d: RoundDecisions, e: CompanyState) => void,
) {
  let etats: CompanyState[] = PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, "bot", p));
  let ev: EventInstance[] = [];
  let prec: Record<string, CompanyRoundResult> = {};
  const tours: { results: Record<string, CompanyRoundResult>; companies: CompanyState[] }[] = [];
  for (let tour = 1; tour <= scenario.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const [i, e] of etats.entries()) {
      const p = prec[e.id];
      const d = botDecisions(PROFILS[i]!, {
        scenario,
        state: e,
        roundIndex: tour,
        lastSoldUnits: p ? soldUnits(p) : undefined,
        lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
        leviers,
      });
      retouche?.(tour, e.id, d, e);
      decisions[e.id] = d;
    }
    const out = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: ev, seed: 2026 });
    tours.push({ results: out.results, companies: out.companies });
    prec = out.results;
    etats = out.companies;
    ev = out.events;
  }
  return tours;
}

const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
const sept = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
/** Le monde du 6 avec le bloc de groupe du 7 : même marché, seuls la valeur et les leviers en plus. */
const sixAvecGroupe: EngineScenarioConfig = { ...six, groupe: sept.groupe };

const sansGroupe = (r: CompanyRoundResult) => {
  const { groupe: _g, ...reste } = r;
  void _g;
  return reste;
};
const etatSansGroupe = (c: CompanyState) => {
  const { groupe: _g, ...reste } = c;
  void _g;
  return reste;
};

describe("le niveau 7 sans rachat ni sous-traitance rejoue le niveau 6 au centime", () => {
  const avant = jouer(six);
  const apres = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions);
  it("mêmes comptes, mêmes bilans, mêmes flux, mêmes parts, tour par tour", () => {
    for (let t = 0; t < avant.length; t++) {
      for (const id of Object.keys(avant[t]!.results)) {
        expect(auCentime(sansGroupe(apres[t]!.results[id]!)), `tour ${t + 1}, ${id}`).toEqual(
          auCentime(avant[t]!.results[id]!),
        );
      }
      expect(auCentime(apres[t]!.companies.map(etatSansGroupe))).toEqual(auCentime(avant[t]!.companies));
    }
  });
  it("et chaque entreprise y dit sa valeur, cohérente avec son bilan", () => {
    for (const [t, tour] of apres.entries()) {
      for (const r of Object.values(tour.results)) {
        const v = r.groupe!.valeur!;
        // Au dernier tour, une économie de charges sous la moyenne compte comme une dette.
        if (t < apres.length - 1) expect(v.detteNette).toBeCloseTo(detteNette(r.balanceSheet), 6);
        else expect(v.detteNette).toBeGreaterThanOrEqual(detteNette(r.balanceSheet) - 1e-6);
        expect(v.valeurCapitauxPropres).toBeCloseTo(Math.max(0, v.valeurEntreprise - v.detteNette), 6);
        expect(v.valeurParAction).toBeCloseTo(v.valeurCapitauxPropres / v.actions, 9);
      }
    }
  });
});

describe("la valeur de départ est la valeur comptable", () => {
  it("VCP₀ = capitaux propres d'ouverture, rentabilité nulle", () => {
    const e = novaGammeCompany("x", "X", "human");
    const g = initialiserLeGroupe(e, sept.groupe!, sept.roundDays);
    const v = valoriser({ groupe: g, finance: e.finance, roundDays: sept.roundDays, multiple: sept.groupe!.valorisation.multipleEBE });
    expect(v.valeurCapitauxPropres).toBeCloseTo(e.finance.equity, 6);
    expect(v.rentabiliteTotale).toBeCloseTo(0, 9);
  });

  it("l'EBE des douze derniers mois annualise la fenêtre et l'amorce par la référence", () => {
    const g: Pick<EtatDeGroupe, "ebe" | "ebeReference"> = { ebe: [10, 20], ebeReference: 5 };
    // trimestre : 4 tours, deux connus, deux de référence
    expect(ebeDouzeMois(g, 90)).toBeCloseTo(5 + 5 + 10 + 20, 9);
    // mois : fenêtre de 4 mois annualisée ×3
    expect(ebeDouzeMois(g, 30)).toBeCloseTo((5 + 5 + 10 + 20) * 3, 9);
    // année : le dernier exercice
    expect(ebeDouzeMois(g, 360)).toBeCloseTo(20, 9);
  });
});

describe("actions, dilution et dividendes", () => {
  it("une augmentation de capital est un apport, converti à la valeur de fin de partie ; un dividende se compte par action", () => {
    const tours = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions, (tour, id, d) => {
      if (id !== "e0") return;
      if (tour === 2) d.finance = { ...(d.finance ?? {}), capitalIncrease: 50000 };
      if (tour === 4) d.finance = { ...(d.finance ?? {}), dividend: 10000 };
    });
    const g1 = tours[0]!.companies.find((c) => c.id === "e0")!.groupe!;
    const g2 = tours[1]!.companies.find((c) => c.id === "e0")!.groupe!;
    expect(g2.actions).toBe(g1.actions);
    expect(g2.apports).toBeCloseTo(50000, 6);
    const v2 = tours[1]!.results.e0!.groupe!.valeur!;
    expect(v2.valeurParAction).toBeCloseTo(Math.max(0, v2.valeurCapitauxPropres - 50000) / v2.actions, 9);
    const g3 = tours[2]!.companies.find((c) => c.id === "e0")!.groupe!;
    const g4 = tours[3]!.companies.find((c) => c.id === "e0")!.groupe!;
    const verse = -tours[3]!.results.e0!.cashFlow.items.filter((i) => i.label === "dividendes_verses").reduce((s, i) => s + i.amount, 0);
    expect(verse).toBeGreaterThan(0);
    expect(g4.dividendesParAction - g3.dividendesParAction).toBeCloseTo(verse / g4.actions, 9);
    const v = tours[3]!.results.e0!.groupe!.valeur!;
    expect(v.rentabiliteTotale).toBeCloseTo((v.valeurParAction + v.dividendesParAction) / g4.valeurInitialeParAction - 1, 9);
  });

  it("couper ses charges au dernier tour ne gonfle pas la valeur", () => {
    const coupe = (tour: number, id: string, d: RoundDecisions) => {
      if (id !== "e0" || tour !== sixAvecGroupe.roundsCount) return;
      d.marketingBudget = 0;
      d.qualityBudget = 0;
      d.maintenanceBudget = 0;
      d.brandMarketingBudget = 0;
      for (const p of Object.values(d.products ?? {})) {
        p.marketingBudget = 0;
        p.qualityBudget = 0;
      }
    };
    const ref = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions).at(-1)!.results.e0!;
    const avec = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions, coupe).at(-1)!.results.e0!;
    expect(avec.incomeStatement.ebitda).toBeGreaterThan(ref.incomeStatement.ebitda);
    expect(avec.groupe!.valeur!.valeurEntreprise).toBeLessThanOrEqual(ref.groupe!.valeur!.valeurEntreprise + 1);
    // ni la caisse qu'elle laisse : une dépense reportée compte comme une dette
    expect(avec.groupe!.valeur!.valeurCapitauxPropres).toBeLessThanOrEqual(ref.groupe!.valeur!.valeurCapitauxPropres + 1);
  });

  it("un bilan avec écart d'acquisition reste équilibré au contrôle", () => {
    const b = { ...novaGammeCompany("x", "X", "human").finance };
    expect(balanceGap({ ...b, goodwill: 10, equity: b.equity + 10 })).toBeCloseTo(0, 9);
    expect(balanceGap({ ...b, goodwill: 10 })).toBeCloseTo(10, 9);
  });
});
