import { describe, expect, it } from "vitest";
import { botDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import { soldUnits } from "@/engine/simulation/runGame";
import { seuilDIndifference } from "@/engine/groupe";
import type { CompanyRoundResult, CompanyState, EventInstance, RoundDecisions } from "@/engine/types";
import { novaGammeCompany, novaGammeScenario } from "@/config/scenarios/nova-gamme";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { NIVEAU_GROUPE } from "@/config/difficulty";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { champDuChemin, libelleDuChamp } from "@/config/refus-de-decision";
import { vueDuGroupe, type VueDuGroupe } from "@/services/groupe-view.service";
import { eligibiliteDuRachat, type OffreSaisie } from "@/services/groupe-eligibilite";
import { etatDeLaCible, lignesDuBareme, phraseDuSeuil } from "@/components/decisions-du-groupe";
import { limitesDeLEstimation } from "@/components/resultat-estime";
import { estimerLeTour, expurgerLeScenario } from "@/engine/estimation";

/**
 * LE NIVEAU 7 SUR LA FEUILLE DE DÉCISION : ce que le formulaire envoie, où un
 * refus se pose, le seuil d'indifférence, ce que la vue du groupe montre (et
 * tait), et surtout L'ACCORD entre l'éligibilité affichée avant l'envoi et le
 * jugement du moteur au jour 1.
 */

const GRAINE = 918_273_645;
const PROFILS: BotProfile[] = ["balanced", "price_aggressive", "premium", "balanced"];
const sept = composerLeScenarioJoue({
  scenario: novaGammeScenario,
  seed: GRAINE,
  level: 7,
  concurrents: 4,
  periodicity: "quarter",
  investmentStories: true,
});

interface Partie {
  etats: CompanyState[];
  ev: EventInstance[];
  prec: Record<string, CompanyRoundResult>;
  resultats: { tour: number; result: CompanyRoundResult }[];
}

function decider(p: Partie, tour: number): Record<string, RoundDecisions> {
  const out: Record<string, RoundDecisions> = {};
  for (const [i, c] of p.etats.entries()) {
    const prec = p.prec[c.id];
    out[c.id] = botDecisions(PROFILS[i]!, {
      scenario: sept,
      state: c,
      roundIndex: tour,
      lastSoldUnits: prec ? soldUnits(prec) : undefined,
      lastSoldByProduct: prec ? soldByProduct(sept, prec.market.bySegment) : undefined,
      leviers: NIVEAU_GROUPE.decisions,
    });
  }
  return out;
}

function jouer(p: Partie, tour: number, retouche?: (d: Record<string, RoundDecisions>) => void) {
  const decisions = decider(p, tour);
  retouche?.(decisions);
  return simulateRound({ scenario: sept, roundIndex: tour, companies: p.etats, decisions, activeEvents: p.ev, seed: GRAINE });
}

function avancer(p: Partie, tour: number, retouche?: (d: Record<string, RoundDecisions>) => void) {
  const out = jouer(p, tour, retouche);
  p.etats = out.companies;
  p.ev = out.events;
  p.prec = out.results;
  p.resultats.push({ tour, result: out.results.e0! });
  return out;
}

function partie(tours: number): Partie {
  const p: Partie = {
    etats: PROFILS.map((pr, i) => novaGammeCompany(`e${i}`, `E${i}`, i === 0 ? "human" : "bot", pr)),
    ev: [],
    prec: {},
    resultats: [],
  };
  for (let t = 1; t <= tours; t++) avancer(p, t);
  return p;
}

const vue = (p: Partie, tour: number, enCours: RoundDecisions | null = null): VueDuGroupe =>
  vueDuGroupe({
    scenario: sept,
    graine: GRAINE,
    tourEnCours: tour,
    etats: p.etats,
    equipeId: "e0",
    resultats: p.resultats,
    enCours,
  })!;

describe("la feuille lit les décisions du niveau 7", () => {
  const base = () => {
    const f = new FormData();
    f.set("product.nova-go.price", "30");
    f.set("product.nova-go.productionPlan", "1000");
    return f;
  };

  it("rachat, audit, sous-traitance et synergies, sous leurs noms", () => {
    const f = base();
    f.set("rachatCible", "etranger:brightwave");
    f.set("rachatPaiement", "numeraire");
    f.set("rachatPrixMaximum", "45 000".replace(" ", ""));
    f.set("rachatEmprunt", "20000");
    f.set("rachatAugmentation", "");
    f.set("rachatPart", "0.51");
    f.set("diligence", "site_ferme:sonelec");
    f.set("sousTraitance.nova-go", "500");
    f.set("sousTraitance.nova-one", "");
    f.set("reseauEtranger.brightwave.nova-one", "100");
    f.set("fabricationEtrangere.fonika.nova-go", "250");
    const d = decisionsSaisies(f).decisions;
    expect(d.rachat).toEqual({
      cible: { type: "etranger", id: "brightwave" },
      prixMaximum: 45000,
      paiement: "numeraire",
      emprunt: 20000,
      part: 0.51,
    });
    expect(d.diligence).toEqual({ type: "site_ferme", id: "sonelec" });
    expect(d.sousTraitance).toEqual({ "nova-go": 500 });
    expect(d.reseauEtranger).toEqual({ brightwave: { "nova-one": 100 } });
    expect(d.fabricationEtrangere).toEqual({ fonika: { "nova-go": 250 } });
  });

  it("en actions, ni emprunt ni apport ; un site n'a pas de part ; un prix maximum vide n'est pas « sans limite »", () => {
    const f = base();
    f.set("rachatCible", "site_ferme:hexalys");
    f.set("rachatPaiement", "titres");
    f.set("rachatEmprunt", "20000");
    f.set("rachatPart", "0.51");
    f.set("rachatPrixMaximum", "");
    const r = decisionsSaisies(f).decisions.rachat!;
    expect(r.paiement).toBe("titres");
    expect(r.emprunt).toBeUndefined();
    expect(r.part).toBeUndefined();
    expect(Number.isNaN(r.prixMaximum)).toBe(true);
  });

  it("rien de saisi, rien d'ajouté : les autres niveaux envoient exactement ce qu'ils envoyaient", () => {
    const f = base();
    f.set("rachatCible", "");
    f.set("diligence", "");
    const d = decisionsSaisies(f).decisions;
    for (const k of ["rachat", "diligence", "sousTraitance", "reseauEtranger", "fabricationEtrangere"]) {
      expect(k in d, k).toBe(false);
    }
  });

  it("un refus du schéma se pose sur sa case, nommée dans la langue du joueur", () => {
    expect(champDuChemin(["rachat", "prixMaximum"])).toBe("rachatPrixMaximum");
    expect(champDuChemin(["rachat", "augmentationDeCapital"])).toBe("rachatAugmentation");
    expect(champDuChemin(["rachat", "cible", "id"])).toBe("rachatCible");
    expect(champDuChemin(["diligence", "type"])).toBe("diligence");
    expect(champDuChemin(["sousTraitance", "nova-go"])).toBe("sousTraitance.nova-go");
    expect(champDuChemin(["reseauEtranger", "brightwave", "nova-one"])).toBe("reseauEtranger.brightwave.nova-one");
    const ctx = {
      vocabulaire: { priceLabel: "Prix", productionPlanLabel: "Plan", units: "enceintes", unit: "enceinte" },
      references: [{ code: "nova-go", name: "NOVA Go" }],
    };
    expect(libelleDuChamp("sousTraitance.nova-go", ctx)).toBe("Sous-traitance de NOVA Go");
    expect(libelleDuChamp("rachatPrixMaximum", ctx)).toBe("Prix maximum du rachat");
  });
});

describe("fabriquer ou faire fabriquer : le seuil d'indifférence", () => {
  const lignes = sept.equipment!.types.map((t) => ({
    code: t.code,
    nom: t.name,
    cout: t.costPerUnit,
    amortissement: t.depreciationRounds,
    capacite: t.capacityPerUnit,
  }));
  const one = sept.products!.find((p) => p.code === "nova-one")!;
  const ref = sept.groupe!.sousTraitance!["nova-one"]!;
  const args = {
    ref,
    coutVariableInterne: one.materialCostPerUnit + one.otherVariableCostPerUnit,
    heuresParUnite: one.hoursPerUnit,
    heuresParPersonne: 540,
    salaireParTour: sept.hr!.salaryPerEmployeePerRound,
    lignes,
  };

  it("coût fixe de la ligne divisé par l'écart unitaire, la ligne au seuil le plus bas", () => {
    const s = seuilDIndifference(args)!;
    // Chaque ligne, à la main : amortissement + opérateurs × salaire, sur (1re tranche − coût variable).
    const ecart = ref.tranches[0]!.prix - args.coutVariableInterne;
    const parLigne = lignes.map((l) => {
      const op = Math.ceil((l.capacite * args.heuresParUnite) / args.heuresParPersonne);
      return { code: l.code, q: Math.ceil((l.cout / l.amortissement + op * args.salaireParTour) / ecart), cap: l.capacite };
    });
    const attendu = parLigne.filter((x) => x.q <= x.cap).sort((a, b) => a.q - b.q)[0]!;
    expect(s.unites).toBe(attendu.q);
    expect(s.ligne.code).toBe(attendu.code);
    expect(s.ecartParUnite).toBe(ecart);
    expect(s.unites * s.ecartParUnite).toBeGreaterThanOrEqual(s.coutFixeParTour);
    expect((s.unites - 1) * s.ecartParUnite).toBeLessThan(s.coutFixeParTour);
  });

  it("aucun seuil quand le sous-traitant ne coûte pas plus qu'en propre, ni quand aucune ligne n'y arrive", () => {
    expect(seuilDIndifference({ ...args, coutVariableInterne: ref.tranches[0]!.prix })).toBeNull();
    expect(seuilDIndifference({ ...args, lignes: lignes.map((l) => ({ ...l, capacite: 1 })) })).toBeNull();
  });

  it("la carte le dit en toutes lettres, avec le barème tranche par tranche", () => {
    const p = partie(1);
    const v = vue(p, 2);
    const st = v.sousTraitance!.find((r) => r.code === "nova-one")!;
    expect(st.seuil).toEqual(seuilDIndifference({ ...args, heuresParPersonne: p.etats[0]!.hoursPerEmployee }));
    expect(phraseDuSeuil(st)).toMatch(/^Au-dessus de .+ unités par tour durablement, une ligne en propre coûte moins cher/);
    expect(lignesDuBareme(st)).toHaveLength(ref.tranches.length);
    expect(lignesDuBareme(st)[0]).toMatch(/^jusqu'à /);
    expect(lignesDuBareme(st).at(-1)).toMatch(/^au-delà de /);
  });
});

describe("la vue du groupe", () => {
  it("ne porte jamais la graine, ni l'état d'un site qu'on n'a pas audité", () => {
    const p = partie(1);
    const v = vue(p, 2);
    expect(JSON.stringify(v)).not.toContain(String(GRAINE));
    expect(v.cibles.filter((c) => c.audit !== null)).toEqual([]);
    expect(v.ouverture!.tour).toBe(2);
    expect(v.ouverture!.situation.cash).toBe(p.etats[0]!.finance.cash);
  });

  it("une cible rachetée est « à vous » chez l'acquéreur, « déjà rachetée » chez les autres ; l'audit ne se lit que chez qui l'a payé", () => {
    const p = partie(1);
    const prix = sept.groupe!.sites!.find((s) => s.id === "sonelec")!.prix;
    const e0 = p.etats[0]!;
    avancer(p, 2, (d) => {
      d.e0!.diligence = { type: "site_ferme", id: "hexalys" };
      d.e0!.rachat = {
        cible: { type: "site_ferme", id: "sonelec" },
        prixMaximum: prix,
        paiement: "numeraire",
        emprunt: prix + Math.max(0, e0.finance.overdraft - e0.finance.cash) + 20000,
      };
    });
    expect(p.prec.e0!.groupe!.rachat!.statut).toBe("conclu");
    const v = vue(p, 3);
    expect(v.cibles.find((c) => c.id === "sonelec")!.statut).toBe("a_vous");
    expect(etatDeLaCible(v.cibles.find((c) => c.id === "hexalys")!).libelle).toBe("Disponible, auditée");
    expect(v.cibles.find((c) => c.id === "hexalys")!.audit).not.toBeNull();
    const autre = vueDuGroupe({ scenario: sept, graine: GRAINE, tourEnCours: 3, etats: p.etats, equipeId: "e1", resultats: [], enCours: null })!;
    expect(autre.cibles.find((c) => c.id === "sonelec")!.statut).toBe("vendue");
    expect(autre.cibles.find((c) => c.id === "hexalys")!.audit).toBeNull();
  });

  it("une enchère perdue se dit sur la cible", () => {
    const c = {
      ...vue(partie(1), 2).cibles[0]!,
      derniereOffre: { tour: 2, statut: "refuse" as const, motif: "Un autre acquéreur a fait une meilleure offre." },
    };
    expect(etatDeLaCible(c).libelle).toBe("Enchère perdue au tour 2");
  });
});

describe("l'éligibilité affichée avant l'envoi est le jugement du moteur", () => {
  const p = partie(1);
  const v = vue(p, 2);
  const e0 = p.etats[0]!;
  const prixSite = (id: string) => sept.groupe!.sites!.find((s) => s.id === id)!.prix;
  const couvrir = Math.max(0, e0.finance.overdraft - e0.finance.cash);
  const brightwave = v.cibles.find((c) => c.id === "brightwave")!;
  const offres: { nom: string; offre: OffreSaisie }[] = [
    {
      nom: "un site à l'emprunt, découvert couvert",
      offre: { cible: { type: "site_ferme", id: "sonelec" }, paiement: "numeraire", prixMaximum: prixSite("sonelec"), emprunt: prixSite("sonelec") + couvrir + 20000 },
    },
    {
      nom: "un prix maximum sous le prix demandé",
      offre: { cible: { type: "site_ferme", id: "hexalys" }, paiement: "numeraire", prixMaximum: 1, emprunt: prixSite("hexalys") },
    },
    {
      nom: "rien d'emprunté : la trésorerie ou le découvert",
      offre: { cible: { type: "site_ferme", id: "hexalys" }, paiement: "numeraire", prixMaximum: prixSite("hexalys") },
    },
    {
      nom: "un site payé en actions",
      offre: { cible: { type: "site_ferme", id: "hexalys" }, paiement: "titres", prixMaximum: prixSite("hexalys") },
    },
    {
      nom: "une société payée en actions avant le tour où elles s'ouvrent",
      offre: { cible: { type: "fournisseur", id: "standard" }, paiement: "titres", prixMaximum: 10_000_000 },
    },
    {
      nom: "un emprunt au-delà du plafond de la banque",
      offre: { cible: { type: "site_ferme", id: "hexalys" }, paiement: "numeraire", prixMaximum: prixSite("hexalys"), emprunt: 5_000_000 },
    },
    {
      nom: "tant d'investisseurs entrants que le contrôle se perd",
      offre: {
        cible: { type: "etranger", id: "brightwave" },
        paiement: "numeraire",
        prixMaximum: 10_000_000,
        part: brightwave.etranger!.parts[0]!,
        augmentationDeCapital: 3_000_000,
      },
    },
    {
      // Assez d'apport pour diluer les associés d'origine sous le seuil, de
      // peu : le contrôle se juge sur la valeur d'ouverture et la décote.
      nom: "des investisseurs entrants qui feraient passer les associés sous le seuil de contrôle, de peu",
      offre: {
        cible: { type: "site_ferme", id: "sonelec" },
        paiement: "numeraire",
        prixMaximum: prixSite("sonelec"),
        // Chiffré sur la configuration et la valeur de clôture du tour 1, pas sur la vue.
        augmentationDeCapital:
          (sept.groupe!.valorisation.actionsInitiales / (sept.groupe!.rachat!.seuilDeControle * 0.8) - e0.groupe!.actions) *
          p.prec.e0!.groupe!.valeur!.valeurParAction *
          (1 - sept.groupe!.rachat!.decoteDEmission),
      },
    },
    {
      nom: "un site payé par des investisseurs entrants, sous le seuil de contrôle",
      offre: {
        cible: { type: "site_ferme", id: "sonelec" },
        paiement: "numeraire",
        prixMaximum: prixSite("sonelec"),
        augmentationDeCapital: prixSite("sonelec") + couvrir + 1000,
      },
    },
    {
      nom: "une part qui n'est pas à vendre",
      offre: { cible: { type: "etranger", id: "brightwave" }, paiement: "numeraire", prixMaximum: 10_000_000, part: 0.33 },
    },
  ];

  for (const { nom, offre } of offres) {
    it(nom, () => {
      const e = eligibiliteDuRachat(v, offre)!;
      const out = jouer({ ...p, resultats: [...p.resultats] }, 2, (d) => {
        d.e0!.rachat = {
          cible: offre.cible,
          prixMaximum: offre.prixMaximum,
          paiement: offre.paiement,
          ...(offre.emprunt !== undefined ? { emprunt: offre.emprunt } : {}),
          ...(offre.augmentationDeCapital !== undefined ? { augmentationDeCapital: offre.augmentationDeCapital } : {}),
          ...(offre.part !== undefined ? { part: offre.part } : {}),
        };
      });
      const r = out.results.e0!.groupe!.rachat!;
      if (e.motif === null) {
        expect(r.statut).toBe("conclu");
        expect(e.criteres.every((k) => k.ok)).toBe(true);
      } else {
        expect(r.statut).toBe("refuse");
        expect(r.motif).toBe(e.motif);
        expect(e.criteres.some((k) => !k.ok)).toBe(true);
      }
    });
  }

  it("au moins une offre recevable et plusieurs motifs distincts : la comparaison n'est pas vide", () => {
    const verdicts = offres.map(({ offre }) => eligibiliteDuRachat(v, offre)!.motif);
    expect(verdicts.filter((m) => m === null).length).toBeGreaterThanOrEqual(2);
    expect(new Set(verdicts.filter(Boolean)).size).toBeGreaterThanOrEqual(5);
  });
});

describe("le résultat estimé au niveau 7", () => {
  it("compte la sous-traitance, et dit ce qu'il ne simule pas", () => {
    const p = partie(1);
    const e0 = p.etats[0]!;
    const decisions = decider(p, 2).e0!;
    const dossier = {
      scenario: expurgerLeScenario(sept),
      state: e0,
      roundIndex: 2,
      events: [],
      orderOffer: null,
      repartition: {},
    };
    const ventes = { "nova-go": 3000, "nova-one": 2500 };
    const sans = estimerLeTour(dossier, decisions, ventes);
    const avec = estimerLeTour(dossier, { ...decisions, sousTraitance: { "nova-go": 800 } }, ventes);
    expect(avec.resultat.groupe?.sousTraitance?.unites).toBe(800);
    expect(avec.resultatNet).not.toBeCloseTo(sans.resultatNet, 0);
    // Un rachat décidé ne change rien à l'estimation : elle ne sait pas le simuler, et le dit.
    const rachat = estimerLeTour(
      dossier,
      { ...decisions, rachat: { cible: { type: "site_ferme", id: "sonelec" }, prixMaximum: 1e6, paiement: "numeraire", emprunt: 1e5 } },
      ventes,
    );
    expect(rachat.resultatNet).toBe(sans.resultatNet);
    expect(limitesDeLEstimation({})).toBeNull();
    expect(limitesDeLEstimation({ rachat: "Sonelec" })).toMatch(/ne compte pas le rachat de Sonelec/);
    expect(limitesDeLEstimation({ rachat: "Sonelec", audit: "Hexalys", synergies: true })).toMatch(
      /le rachat de Sonelec .+, l'audit de Hexalys et les ventes et la fabrication de vos filiales étrangères/,
    );
  });
});
