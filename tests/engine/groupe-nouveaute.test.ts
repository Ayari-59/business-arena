import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import {
  certificationRetardee,
  etatDAdoption,
  fraisDeDeveloppement,
  migrer,
  premiereOuverture,
  ruptureDuComposant,
} from "@/engine/groupe";
import { isProductAvailable } from "@/engine/gamme";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { novaScenario } from "@/config/scenarios/nova";
import { conseilGammeScenario } from "@/config/scenarios/conseil-gamme";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { NIVEAU_GROUPE, presetByLevel } from "@/config/difficulty";
import { NOVA_HOME } from "@/config/groupe/nova";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { auCentime } from "../helpers/partie-nova-gamme";
import { proposedDecisionsFor } from "@/services/decision-baseline";

/**
 * NOVA HOME, LA NOUVEAUTÉ DU NIVEAU 7 : la référence à développer propre au
 * niveau. Elle n'existe nulle part ailleurs ; présente et jamais lancée, elle
 * ne change rien au niveau 7 d'avant, au centime ; lancée, elle passe par le
 * vrai moteur : développement par étapes, retard, frais immobilisés,
 * plateforme, cannibalisation, module radio, suiveurs.
 */
const HOME = "nova-home";
const composer = (level: number, seed = 2026, scenario = novaGammeScenario, concurrents = 4) =>
  composerLeScenarioJoue({ scenario, seed, level, concurrents, periodicity: "quarter", investmentStories: true });
const sept = composer(7);

const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "passive"];

/** Le snapshot du 7 sans la Home : la gamme et le bloc d'avant. */
function sansHome(s: EngineScenarioConfig): EngineScenarioConfig {
  const groupe = { ...s.groupe! };
  delete groupe.nouveautes;
  const sousTraitance = { ...groupe.sousTraitance };
  delete sousTraitance[HOME];
  return { ...s, products: s.products!.filter((p) => p.code !== HOME), groupe: { ...groupe, sousTraitance } };
}

function jouer(
  scenario: EngineScenarioConfig,
  retouche?: (tour: number, id: string, d: RoundDecisions, e: CompanyState) => void,
  graine = 2026,
) {
  const leviers = NIVEAU_GROUPE.decisions;
  let etats: CompanyState[] = PROFILS.map((p, i) => premiereOuverture(novaGammeCompany(`e${i}`, `E${i}`, "bot", p), scenario.groupe!, scenario.roundDays));
  let ev: EventInstance[] = [];
  let prec: Record<string, CompanyRoundResult> = {};
  const tours: { results: Record<string, CompanyRoundResult>; companies: CompanyState[]; events: EventInstance[]; decisions: Record<string, RoundDecisions> }[] = [];
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
    const out = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: ev, seed: graine });
    tours.push({ results: out.results, companies: out.companies, events: out.events, decisions });
    prec = out.results;
    etats = out.companies;
    ev = out.events;
  }
  return tours;
}

/** Retire d'un objet tout ce qui ne parle que de la Home (sa référence, ses segments, son bloc). */
function sansLaHome(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sansLaHome);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([k]) => k !== HOME && k !== "foyers" && k !== "migrants" && k !== "nouveautes")
        .map(([k, x]) => [k, sansLaHome(x)]),
    );
  }
  return v;
}

describe("NOVA Home n'existe qu'au niveau 7", () => {
  it("aucun niveau du parcours, aucun autre scénario ne la porte ; la Studio est livrée prête au niveau 7", () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const s = composer(level);
      expect(s.products?.some((p) => p.code === HOME) ?? false, `niveau ${level}`).toBe(false);
    }
    expect(composer(7, 2026, novaScenario).products?.some((p) => p.code === HOME) ?? false).toBe(false);
    expect(composer(7, 2026, conseilGammeScenario).products?.some((p) => p.code === HOME) ?? false).toBe(false);
    const home = sept.products!.find((p) => p.code === HOME)!;
    expect(home.development).toEqual(NOVA_HOME.reference.development);
    expect(sept.products!.find((p) => p.code === "nova-studio")!.development).toBeUndefined();
    expect(sept.groupe!.nouveautes!.map((n) => n.code)).toEqual([HOME]);
    // le snapshot se relit tel quel (le schéma garde les nouveautés)
    expect(parseScenarioConfig(sept)).toEqual(sept);
  });

  it("l'adoption est tirée par la graine, sur un flux propre : la taille et la croissance des foyers, et la migration, suivent l'état", () => {
    const etats = new Set<number>();
    for (const graine of [2026, 7, 99, 1, 2, 3, 5, 8, 13, 21, 34, 4242]) {
      const k = etatDAdoption(graine, HOME, 3);
      etats.add(k);
      const etat = NOVA_HOME.adoption.etats[k]!;
      const s = composer(7, graine, novaGammeScenario, 3);
      const foyers = s.products!.find((p) => p.code === HOME)!.market.segments.find((g) => g.code === "foyers")!;
      expect(foyers.size).toBe(etat.taille);
      expect(foyers.growth).toBe(etat.croissance);
      expect(s.groupe!.nouveautes![0]!.migration.parts.passionnes).toBeCloseTo(0.2 * etat.migration, 12);
    }
    expect(etats.size).toBe(3);
  });
});

describe("présente et jamais lancée, la Home ne change rien au niveau 7", () => {
  it("mêmes comptes, mêmes bilans, mêmes parts, mêmes événements, au centime, tour par tour", () => {
    const avec = jouer(sept);
    const sans = jouer(sansHome(sept));
    for (let t = 0; t < sans.length; t++) {
      // personne ne l'a lancée
      for (const c of avec[t]!.companies) expect(c.rdByProduct?.[HOME]?.launched ?? false).toBe(false);
      expect(auCentime(avec[t]!.events)).toEqual(auCentime(sans[t]!.events));
      for (const id of Object.keys(sans[t]!.results)) {
        expect(auCentime(sansLaHome(avec[t]!.results[id]!)), `tour ${t + 1}, ${id}`).toEqual(auCentime(sansLaHome(sans[t]!.results[id]!)));
        expect(auCentime(sansLaHome(avec[t]!.decisions[id]!)), `décisions, tour ${t + 1}, ${id}`).toEqual(auCentime(sansLaHome(sans[t]!.decisions[id]!)));
      }
      expect(auCentime(sansLaHome(avec[t]!.companies))).toEqual(auCentime(sansLaHome(sans[t]!.companies)));
    }
  });
});

describe("la proposition du formulaire ne voit pas une Home qui n'est pas au marché", () => {
  it("même proposition, au centime, avec ou sans la Home dans la gamme ; elle ne la finance jamais", () => {
    const avec = jouer(sept);
    const sans = jouer(sansHome(sept));
    for (let t = 1; t < avec.length; t++) {
      for (const c of avec[t - 1]!.companies) {
        const cs = sans[t - 1]!.companies.find((x) => x.id === c.id)!;
        const args = (snapshot: EngineScenarioConfig, state: CompanyState, k: typeof avec) => ({
          snapshot,
          state,
          roundIndex: t + 1,
          previousPayload: k[t - 1]!.decisions[c.id]!,
          lastMarket: k[t - 1]!.results[c.id]!.market.bySegment,
          lastBreakEven: k[t - 1]!.results[c.id]!.breakeven.breakEvenUnits,
          lastNetIncome: k[t - 1]!.results[c.id]!.incomeStatement.netIncome,
          leviers: NIVEAU_GROUPE.decisions,
        });
        const pa = proposedDecisionsFor(args(sept, c, avec));
        const ps = proposedDecisionsFor(args(sansHome(sept), cs, sans));
        expect(auCentime(sansLaHome(pa)), `tour ${t + 1}, ${c.id}`).toEqual(auCentime(sansLaHome(ps)));
        expect(pa.products?.[HOME]?.rdBudget ?? 0).toBe(0);
      }
    }
    // et au tour 1
    const e = premiereOuverture(novaGammeCompany("e0", "E0", "human"), sept.groupe!, sept.roundDays);
    const t1 = (snapshot: EngineScenarioConfig) => proposedDecisionsFor({ snapshot, state: e, roundIndex: 1, previousPayload: null, leviers: NIVEAU_GROUPE.decisions });
    expect(auCentime(sansLaHome(t1(sept)))).toEqual(auCentime(sansLaHome(t1(sansHome(sept)))));
  });
});

describe("le développement par étapes", () => {
  const home = sept.products!.find((p) => p.code === HOME)!;
  const rd = (x: Partial<import("@/engine/types").ProductRdState>) => ({ invested: 0, launched: false, techLevel: 0, ...x });

  it("rien avant le démarrage ; deux tours au moins entre le tiers engagé et la première vente ; jamais avant le tour 3", () => {
    expect(isProductAvailable(home, rd({ invested: 90_000 }), 3)).toBe(false); // pas démarré
    expect(isProductAvailable(home, rd({ invested: 90_000, demarreAuTour: 1 }), 2)).toBe(false);
    expect(isProductAvailable(home, rd({ invested: 90_000, demarreAuTour: 1 }), 3)).toBe(true);
    expect(isProductAvailable(home, rd({ invested: 90_000, demarreAuTour: 2 }), 3)).toBe(false);
    expect(isProductAvailable(home, rd({ invested: 60_000, demarreAuTour: 1 }), 5)).toBe(false);
    expect(isProductAvailable(home, rd({ invested: 90_000, demarreAuTour: 1, retardJusquAu: 3 }), 3)).toBe(false);
    expect(isProductAvailable(home, rd({ invested: 90_000, demarreAuTour: 1, retardJusquAu: 3 }), 4)).toBe(true);
    expect(isProductAvailable(home, rd({ invested: 90_000, launched: true, abandonnee: true }), 4)).toBe(false);
  });

  it("dans une partie : un tiers au T1 démarre, la suite au T2, vendable au T3 (ou au T4 si la certification glisse)", () => {
    const tours = jouer(sept, (tour, id, d) => {
      if (id !== "e0") return;
      if (tour === 1) d.products![HOME]!.rdBudget = 30_000;
      if (tour === 2) d.products![HOME]!.rdBudget = 60_000;
    });
    const e0 = (t: number) => tours[t - 1]!.companies.find((c) => c.id === "e0")!.rdByProduct![HOME]!;
    expect(e0(1).demarreAuTour).toBe(1);
    expect(e0(2).certificationTiree).toBe(true);
    const retard = certificationRetardee(2026, "e0", HOME, 0.3);
    expect(e0(2).retardJusquAu).toBe(retard ? 3 : undefined);
    expect(tours[2]!.results.e0!.groupe!.nouveautes![HOME]!.auMarche).toBe(!retard);
    expect(tours[3]!.results.e0!.groupe!.nouveautes![HOME]!.auMarche).toBe(true);
    // le retard est tiré une fois, pour l'entreprise, sur son propre flux
    expect(certificationRetardee(2026, "e0", HOME, 0.3)).toBe(retard);
  });
});

describe("les frais de développement immobilisés", () => {
  it("la R&D qui couvre le coût sort de la caisse et entre à l'actif, sans toucher l'EBE ; le bilan tient au centime", () => {
    const sans = jouer(sept);
    const avec = jouer(sept, (tour, id, d) => {
      if (id === "e0" && tour === 1) d.products![HOME]!.rdBudget = 90_000;
    });
    const a = avec[0]!.results.e0!;
    const b = sans[0]!.results.e0!;
    expect(a.incomeStatement.ebitda).toBeCloseTo(b.incomeStatement.ebitda, 6);
    expect(a.incomeStatement.rdCost ?? 0).toBeCloseTo(b.incomeStatement.rdCost ?? 0, 6);
    expect(a.balanceSheet.fixedAssetsNet - b.balanceSheet.fixedAssetsNet).toBeCloseTo(90_000, 6);
    expect(a.groupe!.nouveautes![HOME]!.immobilise).toBeCloseTo(90_000, 6);
    for (const t of avec) for (const r of Object.values(t.results)) expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(0.01);
    // amortis à partir du lancement, sur huit trimestres, hors EBE ; la plateforme dans l'EBE
    const lancement = avec.findIndex((t) => t.results.e0!.groupe!.nouveautes![HOME]!.auMarche);
    expect(lancement).toBeGreaterThanOrEqual(2);
    const n = avec[lancement]!.results.e0!.groupe!.nouveautes![HOME]!;
    expect(n.amortissement).toBeCloseTo(90_000 / 8, 6);
    expect(n.plateforme).toBe(8_000);
    for (let t = 0; t < lancement; t++) expect(avec[t]!.results.e0!.groupe!.nouveautes![HOME]!.plateforme).toBe(0);
  });

  it("l'amortissement suit le lancement ; la dépréciation prend ce que la valeur d'utilité ne couvre plus, et tout à l'abandon", () => {
    const ouverture = { invested: 90_000, launched: true, techLevel: 0, immobilise: 90_000, amorti: 11_250, contributions: [30_000] };
    const bon = fraisDeDeveloppement({ ouverture, cout: 90_000, budget: 0, auMarche: true, abandon: false, duree: 8, contribution: 30_000 });
    expect(bon.amortissement).toBeCloseTo(11_250, 9);
    expect(bon.depreciation).toBe(0);
    const echec = fraisDeDeveloppement({ ouverture, cout: 90_000, budget: 0, auMarche: true, abandon: false, duree: 8, contribution: -5_000 });
    // contribution moyenne 12 500 sur 6 tours restants = 75 000 < 67 500 ? non : pas de dépréciation
    expect(echec.depreciation).toBe(0);
    const pire = fraisDeDeveloppement({ ouverture: { ...ouverture, contributions: [2_000] }, cout: 90_000, budget: 0, auMarche: true, abandon: false, duree: 8, contribution: 0 });
    // utilité = 1 000 × 6 = 6 000 ; valeur nette après amortissement 67 500 : 61 500 dépréciés
    expect(pire.depreciation).toBeCloseTo(61_500, 6);
    expect(pire.immobilise - pire.amorti).toBeCloseTo(6_000, 6);
    const abandon = fraisDeDeveloppement({ ouverture, cout: 90_000, budget: 0, auMarche: false, abandon: true, duree: 8 });
    expect(abandon.depreciation).toBeCloseTo(78_750, 6);
    expect(abandon.immobilise - abandon.amorti).toBeCloseTo(0, 9);
  });

  it("abandonner la retire du marché, arrête la plateforme et déprécie ce qui reste, bilan au centime", () => {
    const tours = jouer(sept, (tour, id, d) => {
      if (id !== "e0") return;
      if (tour === 1) d.products![HOME]!.rdBudget = 30_000;
      if (tour === 2) d.products![HOME]!.abandonner = true;
    });
    const n2 = tours[1]!.results.e0!.groupe!.nouveautes![HOME]!;
    expect(n2.abandon).toBe(true);
    expect(n2.depreciation).toBeCloseTo(30_000, 6);
    expect(n2.valeurNette).toBeCloseTo(0, 6);
    for (const t of tours.slice(1)) {
      expect(t.results.e0!.groupe!.nouveautes![HOME]!.auMarche).toBe(false);
      expect(t.results.e0!.groupe!.nouveautes![HOME]!.plateforme).toBe(0);
      expect(Math.abs(balanceGap(t.results.e0!.balanceSheet))).toBeLessThan(0.01);
    }
    expect(tours.at(-1)!.companies.find((c) => c.id === "e0")!.rdByProduct![HOME]!.abandonnee).toBe(true);
  });
});

describe("la cannibalisation, le module radio, les suiveurs", () => {
  it("la migration conserve le potentiel ; rien sans Home au marché", () => {
    const n = sept.groupe!.nouveautes![0]!;
    const p = { etudiants: 10_000, passionnes: 4_000, campustech: 9_000, migrants: 1 };
    const q = { ...p };
    const flux = migrer(q, n, true);
    expect(q.etudiants + q.passionnes + q.campustech + q.migrants).toBeCloseTo(p.etudiants + p.passionnes + p.campustech, 9);
    expect(flux).toBeCloseTo(10_000 * n.migration.parts.etudiants! + 4_000 * n.migration.parts.passionnes!, 9);
    expect(q.campustech).toBe(9_000);
    const r = { ...p };
    expect(migrer(r, n, false)).toBe(0);
    expect(r).toEqual({ ...p, migrants: 0 });
  });

  it("lancée par une entreprise, la Home prend des acheteurs de One à tout le marché ; les suiveurs la développent ensuite, SoundBox jamais", () => {
    const tours = jouer(sept, (tour, id, d) => {
      if (id === "e0" && tour === 1) d.products![HOME]!.rdBudget = 90_000;
    });
    const t = tours.findIndex((x) => x.results.e0!.groupe!.nouveautes![HOME]!.auMarche);
    const sans = jouer(sept);
    // Le potentiel des étudiants baisse pour tout le monde, celui des migrants apparaît.
    const pot = (r: CompanyRoundResult, s: string) => r.market.bySegment[s]!.potential;
    expect(pot(tours[t]!.results.e1!, "etudiants")).toBeLessThan(pot(sans[t]!.results.e1!, "etudiants"));
    expect(pot(tours[t]!.results.e1!, "migrants")).toBeGreaterThan(0);
    expect(pot(sans[t]!.results.e1!, "migrants")).toBe(0);
    // Le suiveur équilibré ou premium l'a vue et la finance au tour suivant ; l'agressif jamais.
    const apres = tours[t]!.companies;
    expect(apres.find((c) => c.id === "e2")!.groupe!.nouveautesAuMarche).toEqual([HOME]);
    const rdPremium = tours[t + 1]!.decisions.e2!.products![HOME]!.rdBudget ?? 0;
    expect(rdPremium).toBeGreaterThan(0);
    for (const x of tours) expect(x.decisions.e1!.products![HOME]!.rdBudget ?? 0).toBe(0);
  });

  it("le module radio rompt sur son flux propre, plus souvent à Noël, sans décaler aucun autre tirage", () => {
    const r = sept.groupe!.nouveautes![0]!.ruptures![0]!;
    let horsPic = 0, auPic = 0;
    for (let g = 0; g < 2000; g++) {
      if (ruptureDuComposant(g, r, 1, 3, "e0")) horsPic++;
      if (ruptureDuComposant(g, r, 1.6, 4, "e0")) auPic++;
    }
    expect(horsPic / 2000).toBeGreaterThan(0.07);
    expect(horsPic / 2000).toBeLessThan(0.13);
    expect(auPic / 2000).toBeGreaterThan(0.25);
    expect(auPic / 2000).toBeLessThan(0.35);
    // Lancer la Home ne change pas les événements tirés de la partie.
    const avec = jouer(sept, (tour, id, d) => {
      if (id === "e0" && tour === 1) d.products![HOME]!.rdBudget = 90_000;
    });
    const sans = jouer(sept);
    for (let t = 0; t < sans.length; t++) expect(avec[t]!.events.map((e) => e.code)).toEqual(sans[t]!.events.map((e) => e.code));
  });

  it("le snapshot du niveau 6 ne voit rien des nouveautés, même avec le bloc de groupe du 7", () => {
    const six = composer(6);
    expect(six.products!.some((p) => p.code === HOME)).toBe(false);
    expect(presetByLevel.get(6)!.decisions.croissanceExterne).toBeUndefined();
  });
});
