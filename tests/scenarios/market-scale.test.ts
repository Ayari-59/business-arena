import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import {
  applyMarketScale,
  CONCURRENTS_DE_CALIBRATION,
  facteurDeMarche,
} from "../../src/config/scenarios/market-scale";
import { simulateRound } from "../../src/engine/simulation";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import type { CompanyState, EngineScenarioConfig, RoundDecisions } from "../../src/engine/types";

/**
 * LE MONDE DOIT RESTER JOUABLE QUAND LA CLASSE GRANDIT.
 *
 * Toutes les entreprises d'une partie se partagent le même marché, ce qui fait
 * la concurrence et qui est voulu. Mais les scénarios sont calibrés contre
 * trois concurrents, et le gâteau était de taille fixe : à six équipes plus
 * deux bots, plus AUCUNE entreprise n'atteignait son seuil, pas même en jouant
 * au mieux. Rien ne le signalait, ni au moteur ni à l'enseignant, qui l'aurait
 * découvert en séance trois devant sa classe.
 *
 * Aucun test ne pouvait le voir : la suite jouait chaque secteur avec un joueur
 * et sept bots sans jamais regarder si quelqu'un gagnait de l'argent, et la
 * calibration se faisait à trois. Le défaut vivait exactement entre les deux.
 */
const CUMUL_MINIMUM = 0;

function meilleurCumul(
  d: (typeof SCENARIOS)[number],
  concurrents: number,
  scenario: EngineScenarioConfig,
): number {
  const profils = d.bots.map((b) => b.profile);
  let companies: CompanyState[] = Array.from({ length: concurrents }, (_, i) =>
    d.company(`c${i}`, `Équipe ${i + 1}`, "bot", profils[i % profils.length]!),
  );
  const profil = new Map(
    companies.map((c, i) => [c.id, profils[i % profils.length]! as BotProfile]),
  );
  const dernier: Record<string, number> = {};
  const cumul: Record<string, number> = {};
  for (let round = 1; round <= scenario.roundsCount; round += 1) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const c of companies) {
      decisions[c.id] = botDecisions(profil.get(c.id)!, {
        scenario,
        state: c,
        roundIndex: round,
        lastSoldUnits: dernier[c.id],
      });
    }
    const out = simulateRound({
      scenario,
      roundIndex: round,
      companies,
      decisions,
      activeEvents: [],
      seed: 7,
    });
    for (const c of companies) {
      const r = out.results[c.id]!;
      dernier[c.id] = Object.values(r.market.bySegment).reduce((s, x) => s + x.sold, 0);
      cumul[c.id] = (cumul[c.id] ?? 0) + r.incomeStatement.netIncome;
    }
    companies = out.companies;
  }
  return Math.max(...Object.values(cumul));
}

describe("dimensionnement du marché", () => {
  it("le facteur suit la taille de la classe et ne rétrécit jamais le marché", () => {
    expect(facteurDeMarche(CONCURRENTS_DE_CALIBRATION)).toBe(1);
    expect(facteurDeMarche(6)).toBe(2);
    expect(facteurDeMarche(9)).toBe(3);
    // Une partie plus petite que la calibration garde le marché d'origine :
    // un duel à deux se jouerait sinon sur un marché rétréci, plus dur que ce
    // que le scénario annonce.
    expect(facteurDeMarche(2)).toBe(1);
    expect(facteurDeMarche(1)).toBe(1);
    expect(facteurDeMarche(0)).toBe(1);
    expect(facteurDeMarche(Number.NaN)).toBe(1);
  });

  it("seule la taille des segments bouge", () => {
    // Les élasticités, les prix de référence et l'attraction du concurrent
    // extérieur sont des propriétés du métier, pas de la classe.
    for (const d of SCENARIOS) {
      const large = applyMarketScale(d.scenario, 9);
      expect(large.market.outsideAttraction).toBe(d.scenario.market.outsideAttraction);
      expect(large.market.seasonality).toEqual(d.scenario.market.seasonality);
      d.scenario.market.segments.forEach((s, i) => {
        const apres = large.market.segments[i]!;
        expect(apres.size, `${d.code}/${s.code} : taille non redimensionnée`).toBe(
          Math.round(s.size * 3),
        );
        expect(apres.priceElasticity, `${d.code}/${s.code}`).toBe(s.priceElasticity);
        expect(apres.refPrice, `${d.code}/${s.code}`).toBe(s.refPrice);
        expect(apres.seasonality, `${d.code}/${s.code}`).toEqual(s.seasonality);
        expect(apres.loyalty, `${d.code}/${s.code}`).toBe(s.loyalty);
      });
      // Les charges de structure ne bougent pas : c'est ce qui garde le seuil
      // de rentabilité au même endroit, et donc l'exercice intact.
      expect(large.fixedCostsPerRound).toBe(d.scenario.fixedCostsPerRound);
      expect(large.product).toEqual(d.scenario.product);
    }
  });

  it("le redimensionnement améliore la situation dans les neuf secteurs", () => {
    // La propriété dont ce changement répond, et elle vaut partout : à huit
    // concurrents, le marché dimensionné laisse strictement mieux que le marché
    // fixe. C'est vrai même du transport, qui reste par ailleurs mal calibré.
    for (const d of SCENARIOS) {
      const concurrents = 8;
      const fixe = meilleurCumul(d, concurrents, d.scenario);
      const dimensionne = meilleurCumul(d, concurrents, applyMarketScale(d.scenario, concurrents));
      expect(
        dimensionne,
        `${d.code} : ${Math.round(dimensionne / 1000)} k€ avec dimensionnement contre ${Math.round(fixe / 1000)} k€ sans`,
      ).toBeGreaterThan(fixe);
    }
  });

  it("une classe nombreuse reste jouable", () => {
    // La règle qui manquait : à huit concurrents, il faut qu'une entreprise au
    // moins finisse la partie dans le vert. Sans redimensionnement, la meilleure
    // des huit finissait lourdement dans le rouge dans TOUS les secteurs.
    //
    // Le transport a longtemps été écarté ici, nommément : il était perdant même
    // joué seul, parce qu'il chargeait chaque palette de 43 € de frais de route,
    // soit le coût d'un camion complet, tout en payant la conduite en charges de
    // structure. L'exception portait une assertion qui devait tomber le jour du
    // recalibrage. Elle est tombée, et les neuf secteurs sont ici.
    for (const d of SCENARIOS) {
      const concurrents = 8;
      const cumul = meilleurCumul(d, concurrents, applyMarketScale(d.scenario, concurrents));
      expect(
        cumul,
        `${d.code} : à ${concurrents} concurrents, la meilleure entreprise finit à ${Math.round(cumul / 1000)} k€`,
      ).toBeGreaterThan(CUMUL_MINIMUM);
    }
  });

  it("la création de partie dimensionne réellement le marché", () => {
    // La fonction peut être parfaite et n'être appelée nulle part : le défaut
    // serait alors exactement celui d'avant, sans qu'aucun autre test ne bouge.
    const service = readFileSync("src/services/game.service.ts", "utf-8");
    expect(service, "le service n'importe pas le dimensionnement").toContain("applyMarketScale");
    const appel = service.slice(service.indexOf("const scenarioSnapshot"));
    expect(
      appel.slice(0, appel.indexOf(";")),
      "le dimensionnement n'entre pas dans l'instantané du scénario",
    ).toContain("applyMarketScale");
    expect(
      appel.slice(0, appel.indexOf(";")),
      "le nombre de concurrents ne vient pas de la partie créée",
    ).toContain("concurrents");
  });
});
