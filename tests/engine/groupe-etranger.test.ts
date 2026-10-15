import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import {
  comptesDeLEtranger,
  coursMoyen,
  ecartDuBilanConsolide,
  laSociete,
  prixDeLaSociete,
  trajectoireDeLEtranger,
  type CibleDeRachat,
} from "@/engine/groupe";
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
 * RACHETER UNE ENTREPRISE ÉTRANGÈRE (niveau 7) : un modèle compact hors euro,
 * son cours sur un flux propre, une part de 51 à 100 % avec des intérêts
 * minoritaires, la consolidation au cours de clôture et au cours moyen,
 * l'écart de conversion, et deux synergies : vendre par son réseau (pris sur
 * le stock), faire fabriquer chez elle (livré en stock).
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "balanced"];
const sept = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
/** Le monde du 6 avec le bloc de groupe du 7, à la taille du scénario. */
const monde: EngineScenarioConfig = { ...six, groupe: { ...sept.groupe!, depart: undefined } };
const centime = 0.01;
const BRIGHTWAVE: CibleDeRachat = { type: "etranger", id: "brightwave" };
const FONIKA: CibleDeRachat = { type: "etranger", id: "fonika" };

interface Etat {
  etats: CompanyState[];
  ev: EventInstance[];
  prec: Record<string, CompanyRoundResult>;
}

function avancer(s: EngineScenarioConfig, e: Etat, tour: number, retouche?: (d: Record<string, RoundDecisions>) => void): SimulationOutput {
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
  retouche?.(decisions);
  const out = simulateRound({ scenario: s, roundIndex: tour, companies: e.etats, decisions, activeEvents: e.ev, seed: 2026 });
  for (const r of Object.values(out.results)) {
    expect(Math.abs(balanceGap(r.balanceSheet))).toBeLessThan(centime);
    if (r.groupe?.consolide) expect(Math.abs(ecartDuBilanConsolide(r.groupe.consolide))).toBeLessThan(centime);
  }
  e.etats = out.companies;
  e.ev = out.events;
  e.prec = out.results;
  return out;
}

function tours(n: number, s = monde, equipes = [0]): Etat {
  const e: Etat = {
    etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, equipes.includes(i) ? "human" : "bot", p)),
    ev: [],
    prec: {},
  };
  for (let t = 1; t <= n; t++) avancer(s, e, t);
  return e;
}

const offre = (e: Etat, cible: CibleDeRachat, part: number, tour: number): NonNullable<RoundDecisions["rachat"]> => {
  const prix = prixDeLaSociete(monde, laSociete(monde, e.etats, 2026, "etranger", cible.id, tour - 1)!, part).prix;
  // à l'emprunt jusqu'au plafond de la banque, le reste par des investisseurs entrants
  const A = e.etats[0]!;
  const plafond = Math.max(0, (monde.finance.maxDebtToEquity ?? 2) * A.finance.equity - A.finance.financialDebt - 1);
  const emprunt = Math.min(prix, plafond);
  return { cible, prixMaximum: prix, paiement: "numeraire", part, emprunt, augmentationDeCapital: prix - emprunt };
};

describe("l'entreprise étrangère, modèle compact", () => {
  it("son cours et son risque pays se tirent sur son flux propre ; ses comptes s'équilibrent dans sa devise", () => {
    const c = monde.groupe!.etrangers!.find((x) => x.id === "brightwave")!;
    const a = trajectoireDeLEtranger(c, 2026, 6);
    expect(trajectoireDeLEtranger(c, 2026, 6)).toEqual(a);
    expect(trajectoireDeLEtranger(c, 7, 6).cours).not.toEqual(a.cours);
    expect(a.cours[0]).toBe(c.change.coursInitial);
    // le tour 3 ne dépend pas de la longueur demandée
    expect(trajectoireDeLEtranger(c, 2026, 3).cours).toEqual(a.cours.slice(0, 4));
    for (const k of comptesDeLEtranger(c, 2026, 6)) expect(k.immobilisations + k.bfr + k.tresorerie - k.capitauxPropres - k.dette).toBeCloseTo(0, 6);
  });
});

describe("le rachat d'une entreprise étrangère, et le groupe consolidé", () => {
  it("51 % : minoritaires, bilan consolidé au cours de clôture équilibré au centime, écart de conversion", () => {
    const e = tours(1);
    const o = offre(e, BRIGHTWAVE, 0.51, 2);
    const out = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = o;
    });
    expect(out.results.e0!.groupe!.rachat!.statut, out.results.e0!.groupe!.rachat!.motif).toBe("conclu");
    const f = out.companies.find((c) => c.id === "e0")!.groupe!.filiales[0]!;
    expect(f.part).toBe(0.51);
    const c = monde.groupe!.etrangers!.find((x) => x.id === "brightwave")!;
    const { cours } = trajectoireDeLEtranger(c, 2026, 6);
    expect(f.coursDAcquisition).toBeCloseTo(cours[1]!, 9);
    expect(f.ecart).toBeCloseTo(o.prixMaximum - 0.51 * f.capitauxPropresDAcquisition * cours[1]!, 6);
    for (let t = 3; t <= monde.roundsCount; t++) {
      const r = avancer(monde, e, t).results.e0!;
      const conso = r.groupe!.consolide!;
      const comptes = comptesDeLEtranger(c, 2026, t);
      const E = comptes[t]!.capitauxPropres;
      expect(conso.interetsMinoritaires).toBeCloseTo(0.49 * E * cours[t]!, 6);
      expect(conso.filiales[0]!.cours.cloture).toBeCloseTo(cours[t]!, 9);
      expect(conso.filiales[0]!.cours.moyen).toBeCloseTo(coursMoyen(cours, t), 9);
      const convertis = comptes.slice(2, t + 1).reduce((x, k, i) => x + k.resultat * coursMoyen(cours, i + 2), 0);
      expect(conso.ecartDeConversion).toBeCloseTo(0.51 * (E * cours[t]! - f.capitauxPropresDAcquisition * cours[1]! - convertis), 6);
      expect(conso.partDesMinoritaires).toBeCloseTo(0.49 * comptes[t]!.resultat * coursMoyen(cours, t), 6);
    }
  });

  it("une part qu'elle ne propose pas ne se vend pas ; payée en actions, la fusion émet à la valeur d'ouverture", () => {
    const e = tours(1);
    const refus = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = { ...offre(e, BRIGHTWAVE, 0.51, 2), part: 0.3 };
    });
    expect(refus.results.e0!.groupe!.rachat!.motif).toMatch(/part/);
    const e2 = tours(1);
    const prix = offre(e2, FONIKA, 0.51, 2).prixMaximum;
    const out = avancer(monde, e2, 2, (d) => {
      d.e0!.rachat = { cible: FONIKA, prixMaximum: prix, paiement: "titres", part: 0.51 };
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    expect(r.groupe!.rachat!.financement!.actionsEmises).toBeGreaterThan(0);
  });

  it("vendre par son réseau : pris sur le stock qui reste, au prix local et au cours moyen ; la moitié de la capacité au tour du rachat", () => {
    const e = tours(1);
    const c = monde.groupe!.etrangers!.find((x) => x.id === "brightwave")!;
    const { cours } = trajectoireDeLEtranger(c, 2026, 6);
    const demande = { "nova-go": 1e6 };
    const t2 = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = offre(e, BRIGHTWAVE, 0.51, 2);
      d.e0!.reseauEtranger = { brightwave: demande };
    });
    expect(t2.results.e0!.groupe!.rachat!.statut, t2.results.e0!.groupe!.rachat!.motif).toBe("conclu");
    const r2 = t2.results.e0!.groupe!.reseau!["nova-go"]!;
    expect(r2.demande).toBeCloseTo(c.reseau!.capacite / 2, 6);
    expect(r2.livre).toBeLessThanOrEqual(r2.demande + 1e-9);
    expect(r2.chiffreDAffaires).toBeCloseTo(r2.livre * c.reseau!.prix["nova-go"]! * coursMoyen(cours, 2), 6);
    // le réseau employé paie ses frais fixes du tour
    expect(t2.results.e0!.groupe!.fraisDesSynergies).toBeCloseTo(c.reseau!.coutFixeParTour * coursMoyen(cours, 2), 6);
    // pas de vente sans production : le stock final ne devient jamais négatif
    expect(t2.results.e0!.products!["nova-go"]!.stock.quantity).toBeGreaterThanOrEqual(-1e-9);
    const t3 = avancer(monde, e, 3, (d) => {
      d.e0!.reseauEtranger = { brightwave: demande };
    });
    expect(t3.results.e0!.groupe!.reseau!["nova-go"]!.demande).toBeCloseTo(c.reseau!.capacite, 6);
  });

  it("faire fabriquer chez elle : des produits finis en stock, au coût local converti, sans ligne de l'équipe", () => {
    const e = tours(1);
    const c = monde.groupe!.etrangers!.find((x) => x.id === "fonika")!;
    const { cours } = trajectoireDeLEtranger(c, 2026, 6);
    avancer(monde, e, 2, (d) => {
      d.e0!.rachat = offre(e, FONIKA, 0.51, 2);
    });
    expect(e.prec.e0!.groupe!.rachat!.statut, e.prec.e0!.groupe!.rachat!.motif).toBe("conclu");
    const avant = e.etats[0]!.finishedGoodsByProduct?.["nova-one"]?.quantity ?? 0;
    const t3 = avancer(monde, e, 3, (d) => {
      d.e0!.fabricationEtrangere = { fonika: { "nova-one": 1000 } };
    });
    const fab = t3.results.e0!.groupe!.fabrication!["nova-one"]!;
    expect(fab.unites).toBeCloseTo(1000, 6);
    expect(fab.cout).toBeCloseTo(1000 * c.fabrication!.cout["nova-one"]! * coursMoyen(cours, 3), 6);
    const p = t3.results.e0!.products!["nova-one"]!;
    expect(p.sold + p.stock.quantity).toBeCloseTo(avant + p.produced + 1000 - p.defectUnits, 3);
  });
});

describe("le rejeu de mérite d'une partie avec une filiale étrangère", () => {
  it("rejoue la partie à l'identique sous sa graine, et sans faillir sous une autre", () => {
    const e: Etat = { etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 ? "human" : "bot", p)), ev: [], prec: {} };
    const jouees: RoundDecisions[] = [];
    for (let t = 1; t <= monde.roundsCount; t++) {
      avancer(monde, e, t, (d) => {
        if (t === 2) d.e0!.rachat = { cible: FONIKA, prixMaximum: 1e9, paiement: "titres", part: 0.51 };
        if (t >= 3) d.e0!.fabricationEtrangere = { fonika: { "nova-one": 1000 } };
        jouees.push(d.e0!);
      });
    }
    expect(e.etats[0]!.groupe!.filiales).toHaveLength(1);
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
    expect(rejouer(partie, 2026)).toEqual(a);
    expect(() => rejouer(partie, 7)).not.toThrow();
  });
});
