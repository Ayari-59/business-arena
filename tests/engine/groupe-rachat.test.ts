import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import { prixDeCession, valoriser } from "@/engine/groupe";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
  EventInstance,
  RoundDecisions,
  SimulationOutput,
} from "@/engine/types";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { NIVEAU_GROUPE } from "@/config/difficulty";
import { rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";

/**
 * RACHETER UN CONCURRENT (niveau 7) : la cible passe tout entière dans
 * l'entreprise de l'équipe au jour 1 du tour, le bilan reste équilibré au
 * centime, l'écart d'acquisition est porté et testé, la cible sort du marché.
 *
 * Le mécanisme se teste dans le monde du niveau 6 avec le bloc de groupe du 7 :
 * il ne dépend pas du marché calibré du niveau.
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "balanced"];
const sept = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
const monde: EngineScenarioConfig = { ...six, groupe: sept.groupe };
const centime = 0.01;

interface Etat {
  etats: CompanyState[];
  ev: EventInstance[];
  prec: Record<string, CompanyRoundResult>;
}

function decider(s: EngineScenarioConfig, e: Etat, tour: number): Record<string, RoundDecisions> {
  const decisions: Record<string, RoundDecisions> = {};
  for (const [i, c] of e.etats.entries()) {
    if (c.status === "absorbee") {
      decisions[c.id] = { price: 1, productionPlan: 0, marketingBudget: 0, qualityBudget: 0, maintenanceBudget: 0 };
      continue;
    }
    const p = e.prec[c.id];
    decisions[c.id] = botDecisions(PROFILS[i]!, {
      scenario: s,
      state: c,
      roundIndex: tour,
      lastSoldUnits: p ? soldUnits(p) : undefined,
      lastSoldByProduct: p ? soldByProduct(s, p.market.bySegment) : undefined,
      leviers: NIVEAU_GROUPE.decisions,
    });
  }
  return decisions;
}

function avancer(s: EngineScenarioConfig, e: Etat, tour: number, retouche?: (d: Record<string, RoundDecisions>) => void): SimulationOutput {
  const decisions = decider(s, e, tour);
  retouche?.(decisions);
  const out = simulateRound({ scenario: s, roundIndex: tour, companies: e.etats, decisions, activeEvents: e.ev, seed: 2026 });
  for (const r of Object.values(out.results)) expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(centime);
  e.etats = out.companies;
  e.ev = out.events;
  e.prec = out.results;
  return out;
}

function deuxTours(s: EngineScenarioConfig = monde): Etat {
  const e: Etat = { etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 ? "human" : "bot", p)), ev: [], prec: {} };
  avancer(s, e, 1);
  avancer(s, e, 2);
  return e;
}

const net = (c: CompanyState) => c.finance.cash - c.finance.overdraft;

describe("le rachat d'un concurrent, au jour 1", () => {
  it("le prix est le plus haut des trois valeurs, majoré de la prime ; l'écart d'acquisition est prix moins actif net", () => {
    const e = deuxTours();
    const T = e.etats[1]!;
    const p = prixDeCession(T, monde);
    expect(p.prix).toBeCloseTo(Math.max(p.actifNet, p.valeurDeRendement, p.valeurAuRythme) * (1 + monde.groupe!.rachat!.primeDeControle), 6);
    const A = e.etats[0]!;
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = { cible: T.id, prixMaximum: p.prix + 1, paiement: "numeraire", emprunt: p.prix, augmentationDeCapital: 0 };
      // un emprunt plus large que la caisse ne suffit pas toujours : on finance tout le prix
      d.e0!.rachat.emprunt = Math.min(p.prix + Math.max(0, -net(T)), 2 * A.finance.equity - A.finance.financialDebt - T.finance.financialDebt);
    });
    const r = out.results.e0!;
    const rapport = r.groupe!.rachat!;
    expect(rapport.statut, rapport.motif).toBe("conclu");
    expect(rapport.prix).toBeCloseTo(p.prix, 6);
    expect(rapport.ecart).toBeCloseTo(p.prix - T.finance.equity, 6);
    // Le tableau de flux part de la clôture d'avant, et passe par le rachat.
    expect(r.cashFlow.opening).toBeCloseTo(net(A), 6);
    const lignes = Object.fromEntries(r.cashFlow.items.map((i) => [i.label, i.amount]));
    expect(lignes.rachat_prix_paye).toBeCloseTo(-p.prix, 6);
    expect(lignes.emprunt_d_acquisition).toBeGreaterThan(0);
    expect(r.cashFlow.closing).toBeCloseTo(r.balanceSheet.cash - r.balanceSheet.overdraft, 6);
    // Les frais et l'intégration se paient dans le tour, hors EBE.
    expect(r.incomeStatement.chargesDeRachat).toBeCloseTo(rapport.frais! + rapport.integration!, 6);
    // L'écart d'acquisition est au bilan, diminué de sa dépréciation éventuelle.
    expect(r.balanceSheet.goodwill).toBeCloseTo(rapport.ecart! - (r.incomeStatement.depreciationEcartDAcquisition ?? 0), 6);
    // La cible ne joue plus : hors marché, comptes vides, et elle le reste.
    const t = out.results[T.id]!;
    expect(t.market.totalShare).toBe(0);
    expect(t.groupe!.absorbee).toEqual({ par: "e0", tour: 3 });
    expect(out.companies.find((c) => c.id === T.id)!.status).toBe("absorbee");
    const suite = avancer(monde, e, 4);
    expect(suite.results[T.id]!.incomeStatement.revenue).toBe(0);
    expect(suite.companies.find((c) => c.id === T.id)!.status).toBe("absorbee");
  });

  it("l'acquéreur reprend parc, effectif, stocks, emprunts et clientèle", () => {
    const e = deuxTours();
    const A = e.etats[0]!;
    const T = e.etats[1]!;
    const p = prixDeCession(T, monde);
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = { cible: T.id, prixMaximum: p.prix + 1, paiement: "numeraire", emprunt: p.prix / 2 + Math.max(0, -net(T)), augmentationDeCapital: p.prix / 2 };
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    const apres = out.companies.find((c) => c.id === "e0")!;
    expect((apres.fleet ?? []).length).toBe((A.fleet ?? []).length + (T.fleet ?? []).length);
    expect(r.production.machineCapacity).toBeGreaterThan(A.machineCapacity * A.availability);
    expect(apres.groupe!.rachats).toHaveLength(1);
    // Les investisseurs entrants détiennent leur apport majoré de la décote, converti en fin de partie.
    expect(apres.groupe!.actions).toBe(A.groupe!.actions);
    expect(apres.groupe!.apports).toBeCloseTo((prixDeCession(T, monde).prix / 2) / (1 - monde.groupe!.rachat!.decoteDEmission), 6);
    expect((apres.loans ?? []).length).toBeGreaterThanOrEqual((A.loans ?? []).length + (T.loans ?? []).length);
  });
});

describe("une cible défaillante, à découvert, avec stocks et une Studio lancée", () => {
  it("se reprend, et le bilan reste équilibré au centime", () => {
    const e = deuxTours();
    const A = e.etats[0]!;
    const T0 = e.etats[1]!;
    // La cible est poussée dans le pire état : défaillante, à découvert, des stocks
    // sur chaque référence, la Studio lancée et un niveau technique acquis.
    const stocks = Object.fromEntries(Object.keys(T0.finishedGoodsByProduct ?? {}).map((k) => [k, { quantity: 300, unitCost: 30 }]));
    const valeurStock = Object.values(stocks).reduce((s, l) => s + l.quantity * l.unitCost, 0);
    const decouvert = 90_000;
    const T: CompanyState = {
      ...T0,
      status: "defaillant",
      crisisStreak: 2,
      finishedGoodsByProduct: stocks,
      finishedGoods: { quantity: 900, unitCost: 30 },
      rdByProduct: { ...(T0.rdByProduct ?? {}), "nova-studio": { invested: 40_000, launched: true, launchRound: 2, techLevel: 0.05 } },
      finance: {
        ...T0.finance,
        inventoryValue: valeurStock,
        cash: 0,
        overdraft: decouvert,
        // l'actif net absorbe le découvert et les stocks : le bilan de la cible reste équilibré
        equity: T0.finance.equity + valeurStock - decouvert - (T0.finance.cash - T0.finance.overdraft) + 0 - (T0.finance.inventoryValue ?? 0),
      },
    };
    expect(Math.abs(balanceGap(T.finance))).toBeLessThan(centime);
    e.etats[1] = T;
    const p = prixDeCession(T, monde);
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = {
        cible: T.id,
        prixMaximum: p.prix + 1,
        paiement: "numeraire",
        emprunt: Math.min(p.prix + decouvert, 2 * A.finance.equity - A.finance.financialDebt - T.finance.financialDebt),
        augmentationDeCapital: 60_000,
      };
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(centime);
    const apres = out.companies.find((c) => c.id === "e0")!;
    expect(apres.rdByProduct!["nova-studio"]!.launched).toBe(true);
    expect(apres.rdByProduct!["nova-studio"]!.techLevel).toBeGreaterThanOrEqual(0.05 * 0.5);
    expect(r.groupe!.rachat!.ecart).toBeCloseTo(r.groupe!.rachat!.prix! - T.finance.equity, 6);
  });
});

describe("la fusion : le prix payé en actions", () => {
  it("aucun euro ne sort ; les actionnaires de la cible reçoivent des actions au prix de l'acquéreur", () => {
    const e = deuxTours();
    const A = e.etats[0]!;
    const T = e.etats[1]!;
    const p = prixDeCession(T, monde);
    const vA = valoriser({ groupe: A.groupe!, finance: A.finance, roundDays: monde.roundDays, multiple: monde.groupe!.valorisation.multipleEBE }).valeurParAction;
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = { cible: T.id, prixMaximum: p.prix + 1, paiement: "titres" };
    });
    const r = out.results.e0!;
    const rapport = r.groupe!.rachat!;
    expect(rapport.statut, rapport.motif).toBe("conclu");
    expect(rapport.financement!.actionsEmises).toBeCloseTo(p.prix / vA, 6);
    expect(r.cashFlow.items.find((i) => i.label === "rachat_prix_paye")).toBeUndefined();
    const apres = out.companies.find((c) => c.id === "e0")!;
    expect(apres.groupe!.actions).toBeCloseTo(A.groupe!.actions + p.prix / vA, 6);
  });
});

describe("ce que le moteur refuse, et pourquoi", () => {
  it("perdre le contrôle : payer en actions une cible qui vaut plus que soi", () => {
    const e = deuxTours();
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = { cible: "e2", prixMaximum: 1e9, paiement: "titres" };
    });
    expect(out.results.e0!.groupe!.rachat!.motif).toMatch(/contrôle/);
  });
  const essayer = (tour: number, rachat: (A: CompanyState, T: CompanyState) => RoundDecisions["rachat"]) => {
    const e = deuxTours();
    if (tour > 3) for (let t = 3; t < tour; t++) avancer(monde, e, t);
    const out = avancer(monde, e, tour, (d) => {
      d.e0!.rachat = rachat(e.etats[0]!, e.etats[2]!);
    });
    return out.results.e0!.groupe!.rachat!;
  };
  it("au-delà du prix maximum", () => {
    expect(essayer(3, (_A, T) => ({ cible: T.id, prixMaximum: 1, paiement: "numeraire" })).motif).toMatch(/prix maximum/);
  });
  it("au-delà du plafond de la banque", () => {
    expect(essayer(3, (_A, T) => ({ cible: T.id, prixMaximum: 1e9, paiement: "numeraire", emprunt: 5_000_000 })).motif).toMatch(/banque ne prête pas/);
  });
  it("au dernier tour", () => {
    expect(essayer(6, (_A, T) => ({ cible: T.id, prixMaximum: 1e9, paiement: "numeraire" })).motif).toMatch(/dernier tour/);
  });
  it("une équipe humaine ne se rachète pas", () => {
    const e = deuxTours();
    const out = avancer(monde, e, 3, (d) => {
      d.e1!.rachat = { cible: "e0", prixMaximum: 1e9, paiement: "numeraire" };
    });
    expect(out.results.e1!.groupe!.rachat!.motif).toMatch(/pas à vendre/);
  });
  it("un refus ne change rien au tour", () => {
    const a = deuxTours();
    const b = deuxTours();
    const sans = avancer(monde, a, 3);
    const refuse = avancer(monde, b, 3, (d) => {
      d.e0!.rachat = { cible: "e2", prixMaximum: 1, paiement: "numeraire" };
    });
    const { groupe: _g1, ...x } = refuse.results.e0!;
    const { groupe: _g2, ...y } = sans.results.e0!;
    void _g1;
    void _g2;
    expect(x).toEqual(y);
  });
});

describe("le test de dépréciation", () => {
  it("un écart que la valeur ne couvre plus se déprécie, après l'impôt, et ne revient pas", () => {
    const e = deuxTours();
    const A = e.etats[0]!;
    // Un écart d'acquisition énorme, porté par des capitaux propres d'autant : la valeur ne peut le couvrir.
    e.etats[0] = { ...A, finance: { ...A.finance, goodwill: 5_000_000, equity: A.finance.equity + 5_000_000 } };
    const out = avancer(monde, e, 3);
    const r = out.results.e0!;
    const dep = r.incomeStatement.depreciationEcartDAcquisition!;
    expect(dep).toBeGreaterThan(0);
    expect(r.incomeStatement.netIncome).toBeCloseTo(r.incomeStatement.pretaxIncome - r.incomeStatement.tax - dep, 6);
    expect(r.balanceSheet.goodwill).toBeCloseTo(5_000_000 - dep, 6);
    expect(r.groupe!.ecart!.valeurRecouvrable).toBeLessThan(r.groupe!.ecart!.actifEconomique);
    expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(centime);
  });
});

describe("l'enchère : plusieurs équipes sur la même cible", () => {
  /** e0 et e3 sont deux équipes de la classe ; e1 et e2, des concurrents simulés. */
  function classe(): Etat {
    const e: Etat = {
      etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 || i === 3 ? "human" : "bot", p)),
      ev: [],
      prec: {},
    };
    avancer(monde, e, 1);
    avancer(monde, e, 2);
    return e;
  }
  const offre = (_A: CompanyState, T: CompanyState, prixMaximum: number): RoundDecisions["rachat"] => ({
    cible: T.id,
    prixMaximum,
    paiement: "numeraire",
    emprunt: prixDeCession(T, monde).prix / 2 + Math.max(0, -net(T)),
    augmentationDeCapital: prixDeCession(T, monde).prix / 2,
  });

  it("la plus haute offre l'emporte, au prix demandé ; l'autre ne paie rien et sait pourquoi", () => {
    const e = classe();
    const T = e.etats[1]!;
    const prix = prixDeCession(T, monde).prix;
    const temoin = classe();
    const sans = avancer(monde, temoin, 3);
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = offre(e.etats[0]!, T, prix + 1000);
      d.e3!.rachat = offre(e.etats[3]!, T, prix + 5000);
    });
    expect(out.results.e3!.groupe!.rachat!.statut).toBe("conclu");
    expect(out.results.e3!.groupe!.rachat!.prix).toBeCloseTo(prix, 6);
    expect(out.results.e0!.groupe!.rachat!.motif).toMatch(/meilleure offre/);
    expect(out.companies.find((c) => c.id === T.id)!.absorption).toEqual({ par: "e3", tour: 3 });
    // Le perdant n'a rien payé : ses comptes sont ceux d'un tour sans offre, au marché près
    // (la cible est sortie pour tous).
    expect(out.results.e0!.cashFlow.items.find((i) => i.label === "rachat_prix_paye")).toBeUndefined();
    expect(out.results.e0!.incomeStatement.chargesDeRachat).toBeUndefined();
    expect(out.results.e0!.balanceSheet.goodwill).toBeUndefined();
    expect(out.results[T.id]!.market.totalShare).toBe(0);
    expect(sans.results[T.id]!.market.totalShare).toBeGreaterThan(0);
  });

  it("à égalité, personne ne l'emporte", () => {
    const e = classe();
    const T = e.etats[1]!;
    const prix = prixDeCession(T, monde).prix;
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = offre(e.etats[0]!, T, prix + 2000);
      d.e3!.rachat = offre(e.etats[3]!, T, prix + 2000);
    });
    expect(out.results.e0!.groupe!.rachat!.motif).toMatch(/même offre/);
    expect(out.results.e3!.groupe!.rachat!.motif).toMatch(/même offre/);
    expect(out.companies.find((c) => c.id === T.id)!.status).not.toBe("absorbee");
  });

  it("la plus haute offre sous le prix demandé : personne ne l'emporte", () => {
    const e = classe();
    const T = e.etats[1]!;
    const prix = prixDeCession(T, monde).prix;
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = offre(e.etats[0]!, T, prix - 2000);
      d.e3!.rachat = offre(e.etats[3]!, T, prix - 1000);
    });
    expect(out.results.e0!.groupe!.rachat!.motif).toMatch(/prix maximum/);
    expect(out.results.e3!.groupe!.rachat!.motif).toMatch(/prix maximum/);
    expect(out.companies.find((c) => c.id === T.id)!.status).not.toBe("absorbee");
  });
});

describe("le rejeu de mérite d'une partie avec rachat", () => {
  it("rejoue la partie à l'identique sous sa graine, et sans faillir sous une autre", () => {
    // Les décisions du joueur : la gestion neutre, et un rachat de SoundBox au tour 3.
    const e = deuxTours();
    const jouees: RoundDecisions[] = [];
    const e2: Etat = { etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 ? "human" : "bot", p)), ev: [], prec: {} };
    void e;
    for (let t = 1; t <= monde.roundsCount; t++) {
      avancer(monde, e2, t, (d) => {
        if (t === 3) {
          // En actions, et sans plafond de prix : le rachat ne dépend ni de la caisse
          // ni du prix exact, qui changent sous une autre graine.
          d.e0!.rachat = { cible: e2.etats[1]!.id, prixMaximum: 1e9, paiement: "titres" };
        }
        jouees.push(d.e0!);
      });
    }
    const partie: PartieARejouer = {
      graine: 2026,
      joueur: "e0",
      equipes: PROFILS.map((p, i) => ({ id: `e${i}`, controller: i === 0 ? "human" : "bot", botProfile: i === 0 ? null : p })),
      etatsInitiaux: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 ? "human" : "bot", p)),
      tours: monde.roundsCount,
      scenarioPour: () => monde,
      decisions: jouees,
      reconduits: jouees.map(() => false),
      pedagogie: jouees.map(() => ({})),
      leviers: NIVEAU_GROUPE.decisions,
    };
    const a = rejouer(partie, 2026);
    const b = rejouer(partie, 2026);
    expect(a).toEqual(b);
    // SoundBox est sortie du marché au tour 3 du rejeu.
    expect(a.tours[2]!.parEquipe.e1!.revenue).toBe("0");
    expect(a.tours[5]!.parEquipe.e1!.revenue).toBe("0");
    expect(() => rejouer(partie, 7)).not.toThrow();
  });
});
