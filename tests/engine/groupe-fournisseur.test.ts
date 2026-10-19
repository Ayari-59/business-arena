import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { balanceGap } from "@/engine/finance/statements";
import {
  chiffresDuFournisseur,
  coursDeLImport,
  comptesDuFournisseur,
  probabiliteDeRupture,
  ruptureDeLImport,
  ecartDuBilanConsolide,
  prixDuFournisseur,
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
import { NIVEAU_7_RETIRE } from "@/config/difficulty";
import { rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";

/**
 * RACHETER UN FOURNISSEUR (niveau 7) : un rachat de titres, une filiale
 * consolidée par intégration globale. Son chiffre d'affaires est la somme des
 * achats de toute la partie ; le groupe en récupère la marge, ses concurrents
 * simulés qui achètent au prix s'en vont, et sa capacité le fait rationner.
 */
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "balanced"];
const sept = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 7, concurrents: 4, periodicity: "quarter", investmentStories: true });
const six = composerLeScenarioJoue({ scenario: novaGammeScenario, seed: 2026, level: 6, concurrents: 4, periodicity: "quarter", investmentStories: true });
/**
 * Le monde du 6 avec le bloc de groupe du 7, à la taille du scénario ; le
 * fournisseur standard y est petit (peu de clients hors partie, un petit
 * bilan), pour qu'une équipe de cette taille puisse le racheter : les
 * mécanismes n'en dépendent pas.
 */
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
      leviers: NIVEAU_7_RETIRE.decisions,
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

const aLEmprunt = (s: EngineScenarioConfig, e: Etat, plus = 0): NonNullable<RoundDecisions["rachat"]> => {
  const prix = prixDuFournisseur(s, e.etats, "standard")!.prix;
  return { cible: STANDARD, prixMaximum: prix + plus, paiement: "numeraire", emprunt: prix };
};

describe("le fournisseur, modèle compact", () => {
  it("son chiffre d'affaires est la somme des achats de toute la partie ; son prix, le plus haut de son actif net et de sa valeur de rendement, avec la prime", () => {
    const e = tours(2);
    const ca = chiffresDuFournisseur(e.etats, "standard");
    expect(ca).toHaveLength(2);
    const achats = Object.values(e.prec).reduce((s, r) => s + (r.groupe?.achats?.standard ?? 0), 0);
    expect(achats).toBeGreaterThan(0);
    expect(ca[1]).toBeCloseTo(achats, 6);
    const p = prixDuFournisseur(monde, e.etats, "standard")!;
    const f = monde.groupe!.fournisseurs!.find((x) => x.code === "standard")!;
    const comptes = comptesDuFournisseur(f, ca, monde.finance.taxRate);
    expect(p.actifNet).toBeCloseTo(comptes[2]!.capitauxPropres, 6);
    // ses clients hors partie s'ajoutent, avec leur saison et leur croissance
    const ext = f.clientsExterieurs;
    expect(comptes[2]!.chiffreDAffaires).toBeCloseTo(ca[1]! + ext.chiffreDAffaires * ext.saisonnalite[1]! * (1 + ext.croissance), 6);
    expect(p.prix).toBeCloseTo(Math.max(p.actifNet, p.valeurDeRendement) * (1 + monde.groupe!.rachat!.primeDeControle), 6);
    // ses comptes s'équilibrent : actif = capitaux propres + dette
    for (const c of comptes) expect(c.immobilisations + c.bfr + c.tresorerie - c.capitauxPropres - c.dette).toBeCloseTo(0, 6);
  });
});

describe("le rachat d'un fournisseur, et le groupe consolidé", () => {
  it("titres au bilan social, filiale intégrée au consolidé, écart d'acquisition, ventes internes éliminées ; les deux bilans équilibrés au centime", () => {
    const e = tours(2);
    const A = e.etats[0]!;
    const offre = aLEmprunt(monde, e);
    const prix = offre.prixMaximum;
    const out = avancer(monde, e, 3, (d) => {
      d.e0!.rachat = offre;
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    expect(r.groupe!.rachat!.paiement).toBe("numeraire");
    const f = out.companies.find((c) => c.id === "e0")!.groupe!.filiales[0]!;
    expect(f.prixPaye).toBeCloseTo(prix, 6);
    expect(f.ecart).toBeCloseTo(prix - f.capitauxPropresDAcquisition, 6);
    const conso = r.groupe!.consolide!;
    expect(conso.bilan.goodwill).toBeCloseTo(f.ecart - f.depreciation, 6);
    // les titres disparaissent, les immobilisations de la filiale entrent
    const filiale = conso.filiales[0]!;
    expect(conso.bilan.fixedAssetsNet).toBeCloseTo(r.balanceSheet.fixedAssetsNet - prix + filiale.comptes.immobilisations, 6);
    // ses ventes au groupe sont éliminées : le chiffre d'affaires du groupe n'en garde que le reste
    expect(conso.eliminations.ventesInternes).toBeCloseTo(r.groupe!.achats!.standard!, 6);
    expect(conso.chiffreDAffaires).toBeCloseTo(
      r.incomeStatement.revenue + filiale.comptes.chiffreDAffaires - conso.eliminations.ventesInternes,
      6,
    );
    expect(conso.ebe).toBeCloseTo(r.incomeStatement.ebitda + filiale.comptes.ebe - conso.eliminations.margeEnStock, 6);
    expect(conso.interetsMinoritaires).toBe(0);
    // le prix payé est sorti, l'emprunt est entré ; frais en charges
    const items = Object.fromEntries(r.cashFlow.items.map((i) => [i.label, i.amount]));
    expect(items.rachat_prix_paye).toBeCloseTo(-prix, 6);
    expect(items.emprunt_d_acquisition).toBeCloseTo(prix, 6);
    expect(r.incomeStatement.chargesDeRachat).toBeCloseTo(monde.groupe!.rachat!.fraisDeTransaction * prix, 6);
    // la valeur du groupe se lit sur le bilan consolidé, l'historique d'EBE est pro forma
    const g = out.companies.find((c) => c.id === "e0")!.groupe!;
    expect(g.ebe).toHaveLength(3);
    expect(g.ebe[2]).toBeCloseTo(conso.ebe, 6);
    expect(A.groupe!.ebe[0]).toBeLessThan(g.ebe[0]!);
  });

  it("les concurrents qui achètent au prix partent au tour d'après, les autres restent tant qu'ils sont servis", () => {
    const e = tours(2);
    avancer(monde, e, 3, (d) => {
      d.e0!.rachat = aLEmprunt(monde, e);
    });
    const t4 = avancer(monde, e, 4);
    // SoundBox (agressif) est parti ; Auris (premium) et Vertex (équilibré) restent
    expect(t4.results.e1!.groupe!.achats!.standard ?? 0).toBe(0);
    expect(t4.results.e2!.groupe!.achats!.standard ?? 0).toBeGreaterThan(0);
    expect(t4.results.e3!.groupe!.achats!.standard ?? 0).toBeGreaterThan(0);
    expect(t4.companies.find((c) => c.id === "e0")!.groupe!.filiales[0]!.clientsPartis).toEqual(["e1"]);
  });

  it("à capacité trop courte, le groupe est servi d'abord, les autres rationnés ; un rationné part au tour d'après", () => {
    const etroit: EngineScenarioConfig = {
      ...monde,
      groupe: {
        ...monde.groupe!,
        fournisseurs: monde.groupe!.fournisseurs!.map((f) => (f.code === "standard" ? { ...f, capacite: 200_000 } : f)),
      },
    };
    const e = tours(2, etroit);
    const t3 = avancer(etroit, e, 3, (d) => {
      d.e0!.rachat = aLEmprunt(etroit, e);
    });
    expect(t3.results.e0!.groupe!.rationnement).toBeUndefined();
    expect(Object.values(t3.results.e3!.groupe!.rationnement ?? {}).every((x) => x < 1)).toBe(true);
    expect(t3.results.e3!.production.produced).toBeLessThan(t3.results.e3!.production.planned);
    const t4 = avancer(etroit, e, 4);
    expect(t4.results.e3!.groupe!.achats!.standard ?? 0).toBe(0);
  });

  it("payé en actions (la fusion), à partir du tour où la valeur de l'action reflète des résultats : les vendeurs reçoivent des actions à la valeur d'ouverture, aucun euro ne sort", () => {
    const tot = tours(2);
    const trop = avancer(monde, tot, 3, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "titres" };
    });
    expect(trop.results.e0!.groupe!.rachat!.motif).toMatch(new RegExp(`à partir du tour ${monde.groupe!.rachat!.tourMinTitres}`));
    expect(trop.companies.find((c) => c.id === "e0")!.groupe!.filiales).toHaveLength(0);
    const e = tours(monde.groupe!.rachat!.tourMinTitres! - 1);
    const A = e.etats[0]!;
    const prix = prixDuFournisseur(monde, e.etats, "standard")!.prix;
    const out = avancer(monde, e, monde.groupe!.rachat!.tourMinTitres!, (d) => {
      d.e0!.rachat = { cible: STANDARD, prixMaximum: prix, paiement: "titres" };
    });
    const r = out.results.e0!;
    expect(r.groupe!.rachat!.statut, r.groupe!.rachat!.motif).toBe("conclu");
    expect(r.cashFlow.items.find((i) => i.label === "rachat_prix_paye")).toBeUndefined();
    const emises = r.groupe!.rachat!.financement!.actionsEmises;
    expect(emises).toBeGreaterThan(0);
    expect(out.companies.find((c) => c.id === "e0")!.groupe!.actions).toBeCloseTo(A.groupe!.actions + emises, 6);
  });

  it("un fournisseur que tout le monde quitte ne vaut plus son prix : l'écart se déprécie, le bilan consolidé reste équilibré", () => {
    const e = tours(2);
    avancer(monde, e, 3, (d) => {
      d.e0!.rachat = aLEmprunt(monde, e);
    });
    // l'équipe et ses clients restants passent tous ailleurs
    let depreciation = 0;
    for (let t = 4; t <= monde.roundsCount; t++) {
      const out = avancer(monde, e, t, (d) => {
        for (const id of ["e0", "e2", "e3"])
          for (const p of Object.values(d[id]!.products ?? {})) p.supplierChoice = "lowcost";
      });
      depreciation += out.results.e0!.groupe!.consolide!.filiales[0]!.depreciationDuTour;
    }
    expect(depreciation).toBeGreaterThan(0);
  });
});

describe("le rejeu de mérite d'une partie avec un fournisseur racheté", () => {
  it("rejoue la partie à l'identique sous sa graine, et sans faillir sous une autre", () => {
    const e: Etat = { etats: PROFILS.map((p, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 ? "human" : "bot", p)), ev: [], prec: {} };
    const jouees: RoundDecisions[] = [];
    for (let t = 1; t <= monde.roundsCount; t++) {
      avancer(monde, e, t, (d) => {
        if (t === monde.groupe!.rachat!.tourMinTitres) d.e0!.rachat = { cible: STANDARD, prixMaximum: 1e9, paiement: "titres" };
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
      leviers: NIVEAU_7_RETIRE.decisions,
    };
    const a = rejouer(partie, 2026);
    expect(rejouer(partie, 2026)).toEqual(a);
    expect(() => rejouer(partie, 7)).not.toThrow();
  });
});

describe("l'import, au niveau 7 : le moins cher, mais en devise et fragile aux pics", () => {
  const imp = monde.groupe!.import!;
  it("son cours suit une marche aléatoire sur son flux propre ; sa rupture est plus probable aux pics", () => {
    const a = coursDeLImport(2026, imp, 6);
    expect(a[0]).toBe(1);
    expect(coursDeLImport(2026, imp, 6)).toEqual(a);
    expect(coursDeLImport(7, imp, 6)).not.toEqual(a);
    const pic = monde.market.seasonality.findIndex((x) => x >= imp.rupture.seuilDePic) + 1;
    expect(probabiliteDeRupture(monde, imp, pic)).toBe(imp.rupture.probabiliteAuxPics);
    expect(probabiliteDeRupture(monde, imp, 1)).toBe(imp.rupture.probabilite);
    expect(imp.rupture.probabiliteAuxPics).toBeGreaterThan(imp.rupture.probabilite);
  });

  it("acheter à l'import ne décale aucun tirage des autres ; son prix suit le cours du tour", () => {
    const sans = tours(1);
    const t2 = avancer(monde, sans, 2);
    const avec = tours(1);
    const t2i = avancer(monde, avec, 2, (d) => {
      for (const p of Object.values(d.e0!.products ?? {})) p.supplierChoice = imp.code;
    });
    for (const id of ["e1", "e2", "e3"]) expect(t2i.results[id]).toEqual(t2.results[id]);
    expect(t2i.events).toEqual(t2.events);
    // et les tours suivants des concurrents restent les mêmes
    const t3 = avancer(monde, sans, 3);
    const t3i = avancer(monde, avec, 3, (d) => {
      for (const p of Object.values(d.e0!.products ?? {})) p.supplierChoice = imp.code;
    });
    expect(t3i.events).toEqual(t3.events);
    // ses ruptures sont celles de son flux propre, tour par tour
    for (let t = 4; t <= monde.roundsCount; t++) {
      const out = avancer(monde, avec, t, (d) => {
        for (const p of Object.values(d.e0!.products ?? {})) p.supplierChoice = imp.code;
      });
      expect(out.results.e0!.products!["nova-one"]!.supplier!.supplyDisruption).toBe(ruptureDeLImport(monde, 2026, imp, t, "e0"));
    }
    const ruptures = [1, 2, 3, 4, 5, 6].map((t) => ruptureDeLImport(monde, 2026, imp, t, "e0"));
    expect(ruptures).toEqual([1, 2, 3, 4, 5, 6].map((t) => ruptureDeLImport(monde, 2026, imp, t, "e0")));
    const c = coursDeLImport(2026, imp, 2);
    const one = t2i.results.e0!.products!["nova-one"]!.supplier!;
    expect(one.code).toBe(imp.code);
    expect(one.priceIndexMultiplier).toBeCloseTo((c[1]! + c[2]!) / 2, 9);
  });
});
