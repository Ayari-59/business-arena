import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import {
  ebeDouzeMois,
  emettre,
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
const sixAvecGroupe: EngineScenarioConfig = { ...six, groupe: { ...sept.groupe!, depart: undefined } };

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
  it("une augmentation de capital émet des actions à la valeur de clôture du tour hors apport ; un dividende se compte par action", () => {
    const tours = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions, (tour, id, d) => {
      if (id !== "e0") return;
      if (tour === 2) d.finance = { ...(d.finance ?? {}), capitalIncrease: 50000 };
      if (tour === 4) d.finance = { ...(d.finance ?? {}), dividend: 10000 };
    });
    const g1 = tours[0]!.companies.find((c) => c.id === "e0")!.groupe!;
    const g2 = tours[1]!.companies.find((c) => c.id === "e0")!.groupe!;
    const v2 = tours[1]!.results.e0!.groupe!.valeur!;
    const prix = (v2.valeurCapitauxPropres - 50000) / g1.actions;
    expect(v2.emission!.apport).toBeCloseTo(50000, 6);
    expect(v2.emission!.prixParAction).toBeCloseTo(prix, 6);
    expect(g2.actions).toBeCloseTo(g1.actions + 50000 / prix, 6);
    expect(v2.actions).toBeCloseTo(g2.actions, 9);
    // au tour même, la levée ne change pas la valeur d'une action d'origine
    expect(v2.valeurParAction).toBeCloseTo(prix, 6);
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

describe("l'émission au prix de clôture hors apport", () => {
  const g = { actions: 10000, valeurInitialeParAction: 20 };
  it("une levée oisive laisse la valeur par action intacte", () => {
    // 200 000 de capitaux propres sans la levée, 50 000 apportés qui dorment en caisse
    const e = emettre({ groupe: g, valeurCapitauxPropres: 250000, apportDesAssocies: 50000, apportDesInvestisseurs: 0, decote: 0.1 })!;
    expect(e.prixParAction).toBeCloseTo(20, 9);
    expect(250000 / (g.actions + e.actionsEmises)).toBeCloseTo(20, 9);
  });
  it("une levée employée partage la valeur créée avec ses souscripteurs", () => {
    const e = emettre({ groupe: g, valeurCapitauxPropres: 250000, apportDesAssocies: 50000, apportDesInvestisseurs: 0, decote: 0 })!;
    // l'argent employé crée 30 000 de valeur ensuite : les nouveaux en ont leur part
    const part = e.actionsEmises / (g.actions + e.actionsEmises);
    const apres = 280000 / (g.actions + e.actionsEmises);
    expect(part).toBeCloseTo(0.2, 9);
    expect(apres * g.actions - 200000).toBeCloseTo(30000 * (1 - part), 6);
  });
  it("les investisseurs d'un rachat souscrivent avec la décote ; une entreprise sans valeur émet au plancher", () => {
    const e = emettre({ groupe: g, valeurCapitauxPropres: 250000, apportDesAssocies: 0, apportDesInvestisseurs: 45000, decote: 0.1 })!;
    expect(e.prixParAction).toBeCloseTo(20.5, 9);
    expect(e.actionsEmises).toBeCloseTo(45000 / (20.5 * 0.9), 9);
    const z = emettre({ groupe: g, valeurCapitauxPropres: 10000, apportDesAssocies: 50000, apportDesInvestisseurs: 0, decote: 0 })!;
    expect(z.prixParAction).toBeCloseTo(0.2, 9);
    expect(emettre({ groupe: g, valeurCapitauxPropres: 1, apportDesAssocies: 0, apportDesInvestisseurs: 0, decote: 0 })).toBeNull();
  });
});

describe("ni la levée oisive ni la cession de dernier tour ne font de valeur", () => {
  const ref = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions).at(-1)!.results.e0!.groupe!.valeur!;
  it("une augmentation de capital dont l'argent dort en caisse est neutre au prix du tour ; ensuite, ses souscripteurs ne prennent que leur part de l'écart de valeur", () => {
    const refTours = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions);
    const tours = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions, (tour, id, d) => {
      if (id === "e0" && tour === 2) d.finance = { ...(d.finance ?? {}), capitalIncrease: 100000 };
    });
    const vRef2 = refTours[1]!.results.e0!.groupe!.valeur!;
    const v2 = tours[1]!.results.e0!.groupe!.valeur!;
    // au tour de la levée, l'action d'origine vaut ce qu'elle vaudrait sans elle
    expect(v2.valeurParAction / vRef2.valeurParAction - 1).toBeLessThan(0.005);
    expect(v2.valeurParAction / vRef2.valeurParAction - 1).toBeGreaterThan(-0.005);
    // à la fin, l'argent dormant est toujours là : les nouveaux ont leur apport
    // au prix d'émission, plus leur part de ce que l'entreprise a gagné ou perdu depuis
    const avec = tours.at(-1)!.results.e0!.groupe!.valeur!;
    const N = refTours[1]!.companies.find((c) => c.id === "e0")!.groupe!.actions;
    const n = avec.actions - N;
    const attendu = (N * ref.valeurParAction + n * v2.emission!.prixParAction) / (N + n);
    expect(Math.abs(avec.valeurParAction / attendu - 1)).toBeLessThan(0.005);
  });
  it("vendre des machines au dernier tour ne relève pas la valeur", () => {
    const avec = jouer(sixAvecGroupe, NIVEAU_GROUPE.decisions, (tour, id, d) => {
      if (id === "e0" && tour === sixAvecGroupe.roundsCount)
        d.investment = { ...(d.investment ?? {}), equipmentSell: [{ typeCode: "manual", quantity: 4 }] };
    }).at(-1)!.results.e0!;
    expect(avec.investment?.saleProceeds ?? 0).toBeGreaterThan(0);
    expect(avec.groupe!.valeur!.rentabiliteTotale).toBeLessThanOrEqual(ref.rentabiliteTotale + 0.005);
  });
});
