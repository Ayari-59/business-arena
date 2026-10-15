import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import { prixDuFournisseur, type CibleDeRachat } from "@/engine/groupe";
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

/**
 * LE RACHAT, QUELLE QUE SOIT LA CIBLE (niveau 7) : les règles communes au
 * jour 1 du tour. Ni au premier ni au dernier tour, une cible ne se rachète
 * qu'une fois ; la banque, la caisse et le contrôle refusent ce qu'ils ne
 * peuvent pas suivre ; des investisseurs entrants reçoivent leurs actions à
 * la clôture ; plusieurs équipes sur la même cible, c'est une enchère.
 *
 * Le mécanisme se teste sur le fournisseur standard, dans le monde du
 * niveau 6 avec le bloc de groupe du 7, le fournisseur rendu petit pour
 * qu'une équipe de cette taille puisse le racheter : les règles n'en
 * dépendent pas.
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "balanced"];
const sept = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
const monde: EngineScenarioConfig = {
  ...six,
  groupe: {
    ...sept.groupe!,
    depart: undefined,
    fournisseurs: sept.groupe!.fournisseurs!.map((f) =>
      f.code === "standard"
        ? {
            ...f,
            clientsExterieurs: { ...f.clientsExterieurs, chiffreDAffaires: 50_000 },
            immobilisations: 60_000,
            dette: 30_000,
            tresorerie: 15_000,
          }
        : f,
    ),
  },
};
const centime = 0.01;
const STANDARD: CibleDeRachat = { type: "fournisseur", id: "standard" };

interface Etat {
  etats: CompanyState[];
  ev: EventInstance[];
  prec: Record<string, CompanyRoundResult>;
}

function decider(s: EngineScenarioConfig, e: Etat, tour: number): Record<string, RoundDecisions> {
  const decisions: Record<string, RoundDecisions> = {};
  for (const [i, c] of e.etats.entries()) {
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

const depart = (equipes: number[] = [0]): Etat => ({
  etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, equipes.includes(i) ? "human" : "bot", p)),
  ev: [],
  prec: {},
});

function unTour(equipes?: number[]): Etat {
  const e = depart(equipes);
  avancer(monde, e, 1);
  return e;
}

/** Le prix demandé à l'ouverture du tour qui vient. */
const prix = (e: Etat) => prixDuFournisseur(monde, e.etats, STANDARD.id)!.prix;

/** Une offre financée tout entière à l'emprunt, découvert de l'acquéreur couvert. */
function aLEmprunt(e: Etat, id = "e0", prixMaximum = prix(e)): NonNullable<RoundDecisions["rachat"]> {
  const A = e.etats.find((c) => c.id === id)!;
  return {
    cible: STANDARD,
    prixMaximum,
    paiement: "numeraire",
    emprunt: prix(e) + Math.max(0, A.finance.overdraft - A.finance.cash) + 20_000,
  };
}

describe("les règles du rachat, au jour 1", () => {
  it("ni au premier ni au dernier tour ; une cible rachetée n'est plus à vendre", () => {
    const e1 = depart();
    const t1 = avancer(monde, e1, 1, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "numeraire", emprunt: 1e6 };
    });
    expect(t1.results.e0!.groupe!.rachat!.motif).toMatch(/à partir du tour/);
    const deux = unTour([0, 3]);
    const conclu = avancer(monde, deux, 2, (d) => {
      d.e0!.rachat = aLEmprunt(deux);
    });
    expect(conclu.results.e0!.groupe!.rachat!.statut, conclu.results.e0!.groupe!.rachat!.motif).toBe("conclu");
    const t3 = avancer(monde, deux, 3, (d) => {
      d.e3!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "numeraire", emprunt: 1e5 };
    });
    expect(t3.results.e3!.groupe!.rachat!.motif).toMatch(/pas à vendre/);
    const tard = unTour();
    for (let t = 2; t < monde.roundsCount; t++) avancer(monde, tard, t);
    const dernier = avancer(monde, tard, monde.roundsCount, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "numeraire", emprunt: 1e5 };
    });
    expect(dernier.results.e0!.groupe!.rachat!.motif).toMatch(/dernier tour/);
  });

  it("la banque, la caisse et le contrôle refusent ce qu'ils ne peuvent pas suivre", () => {
    const e = unTour();
    const A = e.etats[0]!;
    const trop = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = { ...aLEmprunt(e), emprunt: 10 * A.finance.equity };
    });
    expect(trop.results.e0!.groupe!.rachat!.motif).toMatch(/banque ne prête pas/);
    const sansFinancement = avancer(monde, unTour(), 2, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "numeraire" };
    });
    expect(sansFinancement.results.e0!.groupe!.rachat!.motif).toMatch(/trésorerie ne couvre pas/);
    const controle = avancer(monde, unTour(), 2, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "numeraire", augmentationDeCapital: 10 * A.finance.equity };
    });
    expect(controle.results.e0!.groupe!.rachat!.motif).toMatch(/contrôle/);
  });

  it("un rachat moitié investisseurs : leurs actions sont émises à la clôture, au prix hors apport, avec la décote", () => {
    const e = unTour();
    const A = e.etats[0]!;
    const p = prix(e);
    const couvrir = Math.max(0, A.finance.overdraft - A.finance.cash) + 20_000;
    const out = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: p, paiement: "numeraire", emprunt: p / 2 + couvrir, augmentationDeCapital: p / 2 };
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    const em = r.groupe!.valeur!.emission!;
    const C = p / 2;
    expect(em.apport).toBeCloseTo(C, 6);
    expect(em.prixParAction).toBeCloseTo((r.groupe!.valeur!.valeurCapitauxPropres - C) / A.groupe!.actions, 6);
    expect(out.companies.find((c) => c.id === "e0")!.groupe!.actions).toBeCloseTo(
      A.groupe!.actions + C / (em.prixParAction * (1 - monde.groupe!.rachat!.decoteDEmission)),
      6,
    );
  });
});

describe("l'enchère : plusieurs équipes sur la même cible", () => {
  it("la plus haute offre l'emporte, au prix demandé ; l'autre ne paie rien et sait pourquoi", () => {
    const e = unTour([0, 3]);
    const p = prix(e);
    const out = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = aLEmprunt(e, "e0", p + 1000);
      d.e3!.rachat = aLEmprunt(e, "e3", p + 5000);
    });
    expect(out.results.e3!.groupe!.rachat!.statut, out.results.e3!.groupe!.rachat!.motif).toBe("conclu");
    expect(out.results.e3!.groupe!.rachat!.prix).toBeCloseTo(p, 6);
    expect(out.results.e0!.groupe!.rachat!.motif).toMatch(/meilleure offre/);
    expect(out.results.e0!.cashFlow.items.find((i) => i.label === "rachat_prix_paye")).toBeUndefined();
    expect(out.results.e0!.incomeStatement.chargesDeRachat).toBeUndefined();
  });

  it("à égalité, personne ne l'emporte ; sous le prix demandé, personne non plus", () => {
    const e = unTour([0, 3]);
    const p = prix(e);
    const egal = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = aLEmprunt(e, "e0", p + 2000);
      d.e3!.rachat = aLEmprunt(e, "e3", p + 2000);
    });
    expect(egal.results.e0!.groupe!.rachat!.motif).toMatch(/même offre/);
    expect(egal.results.e3!.groupe!.rachat!.motif).toMatch(/même offre/);
    expect(egal.companies.every((c) => (c.groupe?.filiales ?? []).length === 0)).toBe(true);
    const f = unTour([0, 3]);
    const q = prix(f);
    const sous = avancer(monde, f, 2, (d) => {
      d.e0!.rachat = aLEmprunt(f, "e0", q - 2000);
      d.e3!.rachat = aLEmprunt(f, "e3", q - 1000);
    });
    expect(sous.results.e0!.groupe!.rachat!.motif).toMatch(/prix maximum/);
    expect(sous.results.e3!.groupe!.rachat!.motif).toMatch(/prix maximum/);
  });
});
