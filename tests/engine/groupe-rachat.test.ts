import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import { etatDuSite, valeurRecouvrable, type CibleDeRachat, type SiteFerme } from "@/engine/groupe";
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
 * RACHETER UN SITE À L'ARRÊT (niveau 7) : un rachat d'actifs au jour 1 du
 * tour, un état caché tiré sur le flux propre du site, un audit qui le révèle,
 * des lignes qui rejoignent le parc après leur remise en route, un bilan
 * équilibré au centime, une enchère quand plusieurs équipes visent le même site.
 *
 * Le mécanisme se teste dans le monde du niveau 6 avec le bloc de groupe du 7 :
 * il ne dépend pas du marché calibré du niveau.
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "balanced"];
const sept = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
/** Le monde du 6 avec le bloc de groupe du 7, à la taille du scénario : les mécanismes ne dépendent pas de la taille de départ. */
const monde: EngineScenarioConfig = { ...six, groupe: { ...sept.groupe!, depart: undefined } };
const centime = 0.01;
const site = (id: string): SiteFerme => monde.groupe!.sites!.find((s) => s.id === id)!;
const cible = (id: string): CibleDeRachat => ({ type: "site_ferme", id });

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

function avancer(
  s: EngineScenarioConfig,
  e: Etat,
  tour: number,
  retouche?: (d: Record<string, RoundDecisions>) => void,
  graine = 2026,
): SimulationOutput {
  const decisions = decider(s, e, tour);
  retouche?.(decisions);
  const out = simulateRound({ scenario: s, roundIndex: tour, companies: e.etats, decisions, activeEvents: e.ev, seed: graine });
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

/** Une offre financée tout entière à l'emprunt, au prix demandé. */
const aLEmprunt = (id: string, prixMaximum = site(id).prix): NonNullable<RoundDecisions["rachat"]> => ({
  cible: cible(id),
  prixMaximum,
  paiement: "numeraire",
  emprunt: site(id).prix,
});

describe("l'état caché d'un site", () => {
  it("se tire sur le flux propre du site : le même toute la partie, dans les fourchettes, différent d'une graine à l'autre", () => {
    const s = site("hexalys");
    const a = etatDuSite(s, 2026);
    expect(etatDuSite(s, 2026)).toEqual(a);
    const total = s.lignes.reduce((n, l) => n + l.count, 0);
    expect(a.lignesRemisesEnRoute + a.lignesPerdues).toBe(total);
    expect(a.lignesRemisesEnRoute).toBeGreaterThanOrEqual(Math.round(s.remiseEnRoute.min * total));
    expect(a.lignesRemisesEnRoute).toBeLessThanOrEqual(Math.round(s.remiseEnRoute.max * total));
    if (a.lignesRemisesEnRoute > 0) {
      const parLigne = a.remiseEnEtat / a.lignesRemisesEnRoute;
      expect(parLigne).toBeGreaterThanOrEqual(s.remiseEnEtatParLigne.min);
      expect(parLigne).toBeLessThanOrEqual(s.remiseEnEtatParLigne.max);
    }
    expect([0, s.passifEnvironnemental.montant]).toContain(a.passifEnvironnemental);
    const graines = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => etatDuSite(s, g).lignesRemisesEnRoute);
    expect(new Set(graines).size).toBeGreaterThan(1);
  });

  it("l'audit révèle l'état réel, se paie, ne décale aucun tirage des autres", () => {
    const temoin = unTour();
    const sans = avancer(monde, temoin, 2);
    const e = unTour();
    const out = avancer(monde, e, 2, (d) => {
      d.e0!.diligence = cible("arvel");
    });
    const r = out.results.e0!;
    expect(r.groupe!.diligence!.etat).toEqual(etatDuSite(site("arvel"), 2026));
    expect(r.incomeStatement.chargesDeRachat).toBeCloseTo(site("arvel").coutDeLAudit, 6);
    expect(r.cashFlow.items.find((i) => i.label === "frais_de_rachat")!.amount).toBeCloseTo(-site("arvel").coutDeLAudit, 6);
    // les concurrents jouent exactement le même tour
    for (const id of ["e1", "e2", "e3"]) expect(out.results[id]).toEqual(sans.results[id]);
    // un second audit du même site ne coûte rien
    const encore = avancer(monde, e, 3, (d) => {
      d.e0!.diligence = cible("arvel");
    });
    expect(encore.results.e0!.groupe?.diligence).toBeUndefined();
    expect(encore.results.e0!.incomeStatement.chargesDeRachat).toBeUndefined();
  });
});

describe("le rachat d'un site, au jour 1", () => {
  it("un rachat d'actifs : prix et remise en état immobilisés, passif et frais en charges, l'excédent sur la valeur recouvrable déprécié, sans écart d'acquisition", () => {
    const e = unTour();
    const A = e.etats[0]!;
    const s = site("hexalys");
    const out = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = aLEmprunt("hexalys");
    });
    const r = out.results.e0!;
    const rapport = r.groupe!.rachat!;
    expect(rapport.statut, rapport.motif).toBe("conclu");
    const etat = etatDuSite(s, 2026);
    const cout = s.prix + etat.remiseEnEtat;
    const recouvrable = valeurRecouvrable(s, etat, monde);
    expect(rapport.site!.etat).toEqual(etat);
    expect(rapport.site!.valeurInscrite).toBeCloseTo(Math.min(cout, recouvrable), 6);
    expect(rapport.site!.depreciation).toBeCloseTo(Math.max(0, cout - recouvrable), 6);
    expect(r.incomeStatement.chargesDeRachat).toBeCloseTo(monde.groupe!.rachat!.fraisDeTransaction * s.prix + etat.passifEnvironnemental, 6);
    const items = Object.fromEntries(r.cashFlow.items.map((i) => [i.label, i.amount]));
    expect(items.rachat_prix_paye).toBeCloseTo(-s.prix, 6);
    expect(items.emprunt_d_acquisition).toBeCloseTo(s.prix, 6);
    if (etat.remiseEnEtat > 0) expect(items.remise_en_etat_du_site).toBeCloseTo(-etat.remiseEnEtat, 6);
    expect(r.cashFlow.opening).toBeCloseTo(A.finance.cash - A.finance.overdraft, 6);
    expect(r.balanceSheet.goodwill).toBeUndefined();
    // les lignes ne produisent pas encore
    expect(r.production.machineCapacity).toBeCloseTo(out.results.e1!.production.machineCapacity, 6);
    const apres = out.companies.find((c) => c.id === "e0")!;
    expect(apres.groupe!.sites).toHaveLength(1);
    expect((apres.loans ?? []).length).toBe((A.loans ?? []).length + 1);
  });

  it("la moitié des lignes rejoint le parc après le délai, le reste au tour suivant ; elles s'amortissent sur leur valeur inscrite", () => {
    const e = unTour();
    const s = site("hexalys");
    const etat = etatDuSite(s, 2026);
    expect(etat.lignesRemisesEnRoute).toBeGreaterThan(1);
    avancer(monde, e, 2, (d) => {
      d.e0!.rachat = aLEmprunt("hexalys");
    });
    const inscrite = e.etats[0]!.groupe!.sites[0]!.valeurInscrite;
    const parc = (c: CompanyState) => (c.machineFleet ?? []).filter((m) => m.id.startsWith("site_ferme:hexalys")).length;
    const premiere = Math.ceil(etat.lignesRemisesEnRoute / 2);
    const t3 = avancer(monde, e, 2 + s.delai);
    expect(parc(t3.companies.find((c) => c.id === "e0")!)).toBe(premiere);
    const t4 = avancer(monde, e, 3 + s.delai);
    const A4 = t4.companies.find((c) => c.id === "e0")!;
    expect(parc(A4)).toBe(etat.lignesRemisesEnRoute);
    expect(A4.groupe!.sites[0]!.enAttente).toHaveLength(0);
    // les lots du site s'amortissent sur leur valeur inscrite, pas au prix du neuf
    const lots = (A4.fleet ?? []).filter((l) => l.coutDOrigine !== undefined);
    expect(lots.reduce((x, l) => x + l.coutDOrigine!, 0)).toBeCloseTo(inscrite, 6);
  });

  it("le site se paie en numéraire ; il ne se rachète qu'une fois, ni au premier ni au dernier tour", () => {
    const titres = avancer(monde, unTour(), 2, (d) => {
      d.e0!.rachat = { cible: cible("sonelec"), prixMaximum: 1e9, paiement: "titres" };
    });
    expect(titres.results.e0!.groupe!.rachat!.motif).toMatch(/liquidateur/);
    expect(titres.results.e0!.balanceSheet.fixedAssetsNet).toBeCloseTo(avancer(monde, unTour(), 2).results.e0!.balanceSheet.fixedAssetsNet, 6);
    const t1 = avancer(monde, depart(), 1, (d) => {
      d.e0!.rachat = aLEmprunt("sonelec");
    });
    expect(t1.results.e0!.groupe!.rachat!.motif).toMatch(/à partir du tour/);
    const deux = unTour([0, 3]);
    avancer(monde, deux, 2, (d) => {
      d.e0!.rachat = aLEmprunt("sonelec");
    });
    const t3 = avancer(monde, deux, 3, (d) => {
      d.e3!.rachat = aLEmprunt("sonelec");
    });
    expect(t3.results.e3!.groupe!.rachat!.motif).toMatch(/pas à vendre/);
    const tard = unTour();
    for (let t = 2; t < monde.roundsCount; t++) avancer(monde, tard, t);
    const dernier = avancer(monde, tard, monde.roundsCount, (d) => {
      d.e0!.rachat = aLEmprunt("arvel");
    });
    expect(dernier.results.e0!.groupe!.rachat!.motif).toMatch(/dernier tour/);
  });

  it("la banque, la caisse et le contrôle refusent ce qu'ils ne peuvent pas suivre", () => {
    const e = unTour();
    const A = e.etats[0]!;
    const trop = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = { ...aLEmprunt("arvel"), emprunt: 10 * A.finance.equity };
    });
    expect(trop.results.e0!.groupe!.rachat!.motif).toMatch(/banque ne prête pas/);
    const sansFinancement = avancer(monde, unTour(), 2, (d) => {
      d.e0!.rachat = { cible: cible("arvel"), prixMaximum: 1e9, paiement: "numeraire" };
    });
    expect(sansFinancement.results.e0!.groupe!.rachat!.motif).toMatch(/trésorerie ne couvre pas/);
    const controle = avancer(monde, unTour(), 2, (d) => {
      d.e0!.rachat = { cible: cible("arvel"), prixMaximum: 1e9, paiement: "numeraire", augmentationDeCapital: 10 * A.finance.equity };
    });
    expect(controle.results.e0!.groupe!.rachat!.motif).toMatch(/contrôle/);
  });

  it("un rachat moitié investisseurs : leurs actions sont émises à la clôture, au prix hors apport, avec la décote", () => {
    const e = unTour();
    const A = e.etats[0]!;
    const s = site("sonelec");
    const out = avancer(monde, e, 2, (d) => {
      d.e0!.rachat = { cible: cible("sonelec"), prixMaximum: s.prix, paiement: "numeraire", emprunt: s.prix / 2, augmentationDeCapital: s.prix / 2 };
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    const em = r.groupe!.valeur!.emission!;
    const C = s.prix / 2;
    expect(em.apport).toBeCloseTo(C, 6);
    expect(em.prixParAction).toBeCloseTo((r.groupe!.valeur!.valeurCapitauxPropres - C) / A.groupe!.actions, 6);
    expect(out.companies.find((c) => c.id === "e0")!.groupe!.actions).toBeCloseTo(
      A.groupe!.actions + C / (em.prixParAction * (1 - monde.groupe!.rachat!.decoteDEmission)),
      6,
    );
  });
});

describe("l'enchère : plusieurs équipes sur le même site", () => {
  it("la plus haute offre l'emporte, au prix demandé ; l'autre ne paie rien et sait pourquoi", () => {
    const s = site("hexalys");
    const out = avancer(monde, unTour([0, 3]), 2, (d) => {
      d.e0!.rachat = aLEmprunt("hexalys", s.prix + 1000);
      d.e3!.rachat = aLEmprunt("hexalys", s.prix + 5000);
    });
    expect(out.results.e3!.groupe!.rachat!.statut).toBe("conclu");
    expect(out.results.e3!.groupe!.rachat!.prix).toBeCloseTo(s.prix, 6);
    expect(out.results.e0!.groupe!.rachat!.motif).toMatch(/meilleure offre/);
    expect(out.results.e0!.cashFlow.items.find((i) => i.label === "rachat_prix_paye")).toBeUndefined();
    expect(out.results.e0!.incomeStatement.chargesDeRachat).toBeUndefined();
  });

  it("à égalité, personne ne l'emporte ; sous le prix demandé, personne non plus", () => {
    const s = site("hexalys");
    const egal = avancer(monde, unTour([0, 3]), 2, (d) => {
      d.e0!.rachat = aLEmprunt("hexalys", s.prix + 2000);
      d.e3!.rachat = aLEmprunt("hexalys", s.prix + 2000);
    });
    expect(egal.results.e0!.groupe!.rachat!.motif).toMatch(/même offre/);
    expect(egal.results.e3!.groupe!.rachat!.motif).toMatch(/même offre/);
    expect(egal.companies.every((c) => c.groupe!.sites.length === 0)).toBe(true);
    const sous = avancer(monde, unTour([0, 3]), 2, (d) => {
      d.e0!.rachat = aLEmprunt("hexalys", s.prix - 2000);
      d.e3!.rachat = aLEmprunt("hexalys", s.prix - 1000);
    });
    expect(sous.results.e0!.groupe!.rachat!.motif).toMatch(/prix maximum/);
    expect(sous.results.e3!.groupe!.rachat!.motif).toMatch(/prix maximum/);
  });
});

describe("le rejeu de mérite d'une partie avec un site racheté", () => {
  it("rejoue la partie à l'identique sous sa graine, et sans faillir sous une autre", () => {
    const e = depart();
    const jouees: RoundDecisions[] = [];
    for (let t = 1; t <= monde.roundsCount; t++) {
      avancer(monde, e, t, (d) => {
        if (t === 1) d.e0!.diligence = cible("hexalys");
        if (t === 2) d.e0!.rachat = { ...aLEmprunt("hexalys"), emprunt: site("hexalys").prix + 20000 };
        jouees.push(d.e0!);
      });
    }
    expect(e.etats[0]!.groupe!.sites).toHaveLength(1);
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
