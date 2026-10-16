import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { aLaMesureDuNiveau, botDecisions, neutralDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { premiereOuverture } from "@/engine/groupe";
import { balanceGap } from "@/engine/finance/statements";
import { proposedDecisionsFor } from "@/services/decision-baseline";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * LE DÉPART DU NIVEAU 7 NE MÈNE PAS À LA CRISE.
 *
 * L'entreprise du niveau 7 démarre deux fois plus grande, pour une demande
 * qui, avant les pics, n'a pas bougé : elle stocke au premier tour, et paie
 * ce stock comptant. Sans le fonds de roulement de départ, une équipe qui
 * validait les décisions proposées entrait en crise de trésorerie au tour 1
 * et en défaillance au tour 2, dans onze parties sur douze ; la gestion
 * neutre aussi entrait en crise.
 *
 * La garde : sur douze graines, partie comme le service la crée (état du
 * tour 0 agrandi), une équipe qui valide la proposition de la feuille à
 * chaque tour, une équipe en gestion neutre, et les concurrents simulés
 * traversent les six tours sans défaillance ; les deux équipes, sans crise.
 */

const GRAINES = Array.from({ length: 12 }, (_, i) => 1000 + (i + 1) * 7919);

function partie(graine: number) {
  const def = scenarioByCode(scenarioCodeForLevel("nova", 7));
  const s: EngineScenarioConfig = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: graine,
    level: 7,
    concurrents: 4,
    periodicity: "quarter",
    investmentStories: true,
  });
  const leviers = presetByLevel.get(7)!.decisions;
  const profils = def.bots.slice(0, 2).map((b) => b.profile as BotProfile);
  const equipes = [
    { id: "propose", ctl: "human" as const, profil: undefined },
    { id: "neutre", ctl: "human" as const, profil: undefined },
    ...profils.map((p, i) => ({ id: `bot${i}`, ctl: "bot" as const, profil: p })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    premiereOuverture(applyPeriodicityToCompany(def.company(e.id, e.id, e.ctl, e.profil), "quarter", { abonnement: false }), s.groupe!, s.roundDays),
  );
  let ev: EventInstance[] = [];
  let prec: Record<string, CompanyRoundResult> = {};
  let derniere: RoundDecisions | null = null;
  const parEquipe: Record<string, { crise: boolean; defaillante: boolean; resultat: number }> = {};
  for (let tour = 1; tour <= s.roundsCount; tour++) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const [i, c] of etats.entries()) {
      const e = equipes[i]!;
      if (e.id === "propose") {
        derniere = proposedDecisionsFor({ snapshot: s, state: c, roundIndex: tour, previousPayload: derniere, leviers });
        decisions[c.id] = derniere;
      } else if (e.id === "neutre") {
        decisions[c.id] = aLaMesureDuNiveau(neutralDecisions({ scenario: s, state: c, roundIndex: tour }), leviers);
      } else {
        const p = prec[c.id];
        decisions[c.id] = botDecisions(e.profil!, {
          scenario: s,
          state: c,
          roundIndex: tour,
          lastSoldUnits: p ? soldUnits(p) : undefined,
          lastSoldByProduct: p ? soldByProduct(s, p.market.bySegment) : undefined,
          leviers,
        });
      }
    }
    const out = simulateRound({ scenario: s, roundIndex: tour, companies: etats, decisions, activeEvents: ev, seed: graine });
    for (const c of out.companies) {
      const r = out.results[c.id]!;
      expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(0.01);
      const a = (parEquipe[c.id] ??= { crise: false, defaillante: false, resultat: 0 });
      a.crise ||= Boolean(r.treasury?.crisis);
      a.defaillante ||= c.status === "defaillant";
      a.resultat += r.incomeStatement.netIncome;
    }
    etats = out.companies;
    ev = out.events;
    prec = out.results;
  }
  return parEquipe;
}

describe("le départ du niveau 7", () => {
  it("le fonds de roulement de départ est un apport des associés : bilan d'ouverture équilibré", () => {
    const s = composerLeScenarioJoue({
      scenario: scenarioByCode(scenarioCodeForLevel("nova", 7)).scenario,
      seed: 1,
      level: 7,
      concurrents: 3,
      periodicity: "quarter",
      investmentStories: true,
    });
    const def = scenarioByCode(scenarioCodeForLevel("nova", 7));
    const brut = applyPeriodicityToCompany(def.company("e", "E", "human"), "quarter", { abonnement: false });
    const o = premiereOuverture(brut, s.groupe!, s.roundDays);
    const f = s.groupe!.depart!.facteur;
    const apport = s.groupe!.depart!.apport!;
    expect(apport).toBeGreaterThan(0);
    expect(o.finance.cash).toBeCloseTo(brut.finance.cash * f + apport, 6);
    expect(o.finance.equity).toBeCloseTo(brut.finance.equity * f + apport, 6);
    const b = o.finance;
    expect(
      Math.abs(b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash - (b.equity + b.financialDebt + b.payables + b.overdraft)),
    ).toBeLessThan(0.01);
    // L'apport suit la durée du tour, comme le stock qu'il finance.
    const mois = composerLeScenarioJoue({
      scenario: def.scenario,
      seed: 1,
      level: 7,
      concurrents: 3,
      periodicity: "month",
      investmentStories: true,
    });
    expect(mois.groupe!.depart!.apport!).toBeCloseTo(apport * (mois.roundDays / 90), 6);
  });

  it(
    "sur douze graines : proposition validée et gestion neutre sans crise ni défaillance, concurrents sans défaillance",
    () => {
      let crises = 0;
      for (const g of GRAINES) {
        const r = partie(g);
        for (const [id, a] of Object.entries(r)) {
          expect(a.defaillante, `${id}, graine ${g} : défaillante`).toBe(false);
          if (id === "propose" || id === "neutre") crises += a.crise ? 1 : 0;
        }
      }
      expect(crises, "équipes en crise de trésorerie").toBe(0);
    },
    300_000,
  );
});
