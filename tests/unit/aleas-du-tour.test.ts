import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/config/scenarios/registry";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { courrierParCode } from "@/config/courriers/registre";
import { botDecisions, neutralDecisions } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
} from "@/engine/types";
import {
  aleasDuTour,
  causesDuResultat,
  indicationDeProduction,
} from "@/components/lecture-du-resultat";

/**
 * CE QUI ARRIVE À L'ÉLÈVE DEVIENT LISIBLE.
 *
 * Deux silences, mesurés par l'audit de l'expérience de jeu :
 *
 *  · une rupture d'approvisionnement n'était affichée QUE dans le tableau des
 *    références d'une gamme. Dans les neuf secteurs mono-produit, la
 *    production baissait, le résultat baissait, et aucun écran ne disait
 *    pourquoi. C'est pourtant la seule cause mesurée d'écart entre le
 *    résultat estimé et le réel : le seul moment où l'élève peut croire que
 *    le jeu lui a menti.
 *  · « Ce qui a fait le résultat » ne nommait jamais l'aléa du tour.
 *
 * Ce test rejoue de vrais tours, avec leurs concurrents, et compare l'effet
 * annoncé à celui du moteur : le même tour, même graine, l'aléa neutralisé
 * dans le scénario (aucun tirage n'est déplacé). L'écart de production est ce
 * que l'aléa a coûté, et c'est ce chiffre que l'écran doit dire.
 */

const sansEspaces = (s: string) => s.replace(/[\s  ]/g, "");

/** Rejoue `tour` tours d'un secteur, gestion proposée ; rend le dernier tour. */
function tourJoue(
  code: string,
  graine: number,
  tour: number,
  retouche?: (s: EngineScenarioConfig) => EngineScenarioConfig,
): { scenario: EngineScenarioConfig; result: CompanyRoundResult; nouveaux: string[] } {
  const def = SCENARIOS.find((d) => d.code === code)!;
  const base = applyMarketScale(def.scenario, 1 + def.bots.length);
  const scenario = retouche ? retouche(structuredClone(base)) : base;
  let companies: CompanyState[] = [
    def.company("eleve", "Élève", "human"),
    ...def.bots.map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const profils = new Map(def.bots.map((b) => [b.id, b.profile]));
  let actifs: EventInstance[] = [];
  for (let t = 1; ; t += 1) {
    const etat = companies.find((c) => c.id === "eleve")!;
    const decisions: Record<string, RoundDecisions> = {
      eleve: neutralDecisions({ scenario, state: etat, roundIndex: t }),
    };
    for (const c of companies) {
      const p = profils.get(c.id);
      if (p !== undefined) decisions[c.id] = botDecisions(p, { scenario, state: c, roundIndex: t });
    }
    const out = simulateRound({ scenario, roundIndex: t, companies, decisions, activeEvents: actifs, seed: graine });
    if (t === tour) {
      return {
        scenario,
        result: out.results.eleve!,
        nouveaux: out.newEvents
          .filter((e) => e.scope === "market" || e.companyId === "eleve")
          .map((e) => e.code),
      };
    }
    companies = out.companies;
    actifs = out.events;
  }
}

describe("la rupture d'approvisionnement, en mono-produit (e-commerce)", () => {
  // Graine et tour où le grossiste européen fait défaut, et où l'atelier en
  // est le goulot : la rupture coûte de la production.
  const { scenario, result } = tourJoue("ecommerce", 16, 3);
  const temoin = tourJoue("ecommerce", 16, 3, (s) => ({
    ...s,
    suppliers: s.suppliers!.map((f) => ({ ...f, supplyRiskAvailabilityHit: 1 })),
  })).result;

  it("le tour rejoué est bien celui d'une rupture, et elle a coûté de la production", () => {
    expect(result.supplier?.supplyDisruption).toBe(true);
    expect(result.products).toBeUndefined();
    expect(temoin.production.produced).toBeGreaterThan(result.production.produced);
  });

  it("elle se voit sous la tuile de production", () => {
    const indication = indicationDeProduction(result);
    expect(indication).toContain("Rupture d'approvisionnement");
    expect(indication).toContain(result.supplier!.name);
  });

  it("« Ce qui a fait le résultat » la nomme, avec la production qu'elle a coûtée selon le moteur", () => {
    const perdues = temoin.production.produced - result.production.produced;
    const causes = causesDuResultat({
      result,
      prixPratique: null,
      prixDuMarche: null,
      estimation: null,
      unites: "colis",
      aleas: aleasDuTour({ scenario, result, codes: [], unites: "colis" }),
    });
    const rupture = causes.find((c) => c.cle === "alea:rupture");
    expect(rupture).toBeDefined();
    expect(rupture!.titre).toBe("Aléa du tour");
    expect(sansEspaces(rupture!.texte)).toContain(sansEspaces(`${Math.round(perdues).toLocaleString("fr-FR")} colis`));
  });
});

describe("un événement du tour (intempéries chez NOVA)", () => {
  const { scenario, result, nouveaux } = tourJoue("nova", 18, 3);
  const temoin = tourJoue("nova", 18, 3, (s) => ({
    ...s,
    events: s.events.map((e) =>
      e.code === "cold_wave"
        ? { ...e, modifiers: e.modifiers.map((m) => (m.target === "availability" ? { ...m, value: 1 } : m)) }
        : e,
    ),
  })).result;

  it("le tour rejoué est bien celui des intempéries", () => {
    expect(nouveaux).toContain("cold_wave");
  });

  it("est nommé par son courrier, avec son effet sur la production selon le moteur", () => {
    const perdues = temoin.production.produced - result.production.produced;
    expect(perdues).toBeGreaterThan(0);
    const causes = causesDuResultat({
      result,
      prixPratique: null,
      prixDuMarche: null,
      estimation: null,
      unites: "enceintes",
      aleas: aleasDuTour({ scenario, result, codes: nouveaux, unites: "enceintes" }),
    });
    const froid = causes.find((c) => c.cle === "alea:cold_wave");
    expect(froid).toBeDefined();
    expect(froid!.texte).toContain(courrierParCode.get("cold_wave")!.objet);
    expect(sansEspaces(froid!.texte)).toContain(
      sansEspaces(`${Math.round(perdues).toLocaleString("fr-FR")} enceintes`),
    );
  });

  it("un aléa dont l'effet ne se mesure pas dans les comptes est nommé quand même, sans chiffre inventé", () => {
    // Une hausse de la demande : la mesurer, ce serait rejouer le marché.
    const aleas = aleasDuTour({ scenario, result, codes: ["viral_campaign"], unites: "enceintes" });
    expect(aleas).toHaveLength(1);
    expect(aleas[0]!.texte).toContain(courrierParCode.get("viral_campaign")!.objet);
    expect(aleas[0]!.texte).toContain(courrierParCode.get("viral_campaign")!.effet);
    expect(aleas[0]!.force).toBe(0);
  });

  it("au rituel comme en synthèse, un aléa n'est jamais écarté par les autres causes", () => {
    const causes = causesDuResultat({
      result,
      prixPratique: 40,
      prixDuMarche: 80,
      estimation: { units: 1 } as never,
      unites: "enceintes",
      aleas: aleasDuTour({ scenario, result, codes: ["viral_campaign"], unites: "enceintes" }),
    });
    expect(causes.some((c) => c.cle === "alea:viral_campaign")).toBe(true);
  });
});
