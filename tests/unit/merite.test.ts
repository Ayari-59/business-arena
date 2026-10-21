import { describe, expect, it } from "vitest";
import { avecLaQualiteProposee, proposedDecisionsFor } from "@/services/decision-baseline";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { DIFFICULTY_PRESETS, presetByLevel, type LeviersDuNiveau } from "@/config/difficulty";
import { aLaMesureDuNiveau, neutralDecisions, variableCostPerUnit, type BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { commeEnBase, rejouer, type DecideurDuJoueur, type IssueDuRejeu, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import {
  decisionDeReference,
  decisionDuBonGestionnaire,
  partieDeLaReference,
  sansAvenir,
  selonLeNiveau,
} from "@/pedagogy/merite/reference";
import {
  CAS_DU_MERITE,
  GRAINES_DU_MERITE,
  SEUIL_DES_DECISIONS_SOLIDES,
  SEUILS_DE_LA_SUITE,
  casDuMerite,
  conseillerLaSuite,
  echelleDeLaReference,
  estFavorable,
  placeDuTirage,
  sontSolides,
  gagneSonMarche,
  verdictDuMerite,
} from "@/pedagogy/merite/verdict";

/**
 * MÉRITE OU CHANCE, LES PIÈCES PURES : la matrice, ses seuils, le niveau
 * conseillé, la référence, le rejeu sans base. La garde de vérité (le rejeu
 * retrouve au centime une partie jouée par le vrai pipeline) vit dans
 * tests/integration/merite.test.ts, parce qu'elle a besoin du vrai pipeline.
 */

/**
 * Une partie en mémoire, comme une partie solo : trois entreprises, monde variable, leviers figés.
 * `aLaDemande` : une partie créée avec la proposition à la demande (`propositionALaDemande`),
 * dont le bon gestionnaire tient le formulaire.
 */
function partieEnMemoire(niveau = 3, entreprise = "nova", graine = 4242, aLaDemande = false) {
  const def = scenarioByCode(scenarioCodeForLevel(entreprise, niveau));
  const ouverts = presetByLevel.get(niveau as 3)!.decisions;
  const equipes = [
    { id: "a-joueur", controller: "human" as const, botProfile: null },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-${i}`, controller: "bot" as const, botProfile: b.profile as string })),
  ];
  const mondes = new Map<number, EngineScenarioConfig>();
  const scenarioPour = (g: number) => {
    if (!mondes.has(g)) {
      mondes.set(
        g,
        commeEnBase(
          composerLeScenarioJoue({
            scenario: def.scenario,
            seed: g,
            variableWorld: true,
            level: niveau,
            concurrents: equipes.length,
            periodicity: "quarter",
            investmentStories: true,
            leviers: ouverts,
            ...(aLaDemande ? { propositionALaDemande: true } : {}),
          }),
        ),
      );
    }
    return mondes.get(g)!;
  };
  const etats = equipes.map((t) =>
    applyPeriodicityToCompany(
      def.company(t.id, t.id, t.controller, (t.botProfile ?? undefined) as BotProfile | undefined),
      "quarter",
      { abonnement: def.scenario.subscription !== undefined },
    ),
  );
  const base: PartieARejouer = {
    graine,
    joueur: "a-joueur",
    equipes,
    etatsInitiaux: etats,
    tours: scenarioPour(graine).roundsCount,
    scenarioPour,
    decisions: [],
    reconduits: [],
    pedagogie: [],
    investissementPlafonne: investissementPlafonne(ouverts),
    leviers: ouverts,
  };
  return { base, ouverts };
}

type Contexte = Parameters<Extract<DecideurDuJoueur, { type: "methode" }>["decider"]>[0];

/** Une stratégie jouée sous la graine de la partie : ses décisions, gardées comme la base les garde. */
function jouer(base: PartieARejouer, decider: (c: Contexte) => RoundDecisions): PartieARejouer {
  const prises: RoundDecisions[] = [];
  rejouer(base, base.graine, {
    type: "methode",
    decider: (c) => {
      const d = decider(c);
      prises.push(commeEnBase(d));
      return d;
    },
  });
  return { ...base, decisions: prises, reconduits: prises.map(() => false), pedagogie: prises.map(() => ({})) };
}

describe("la référence : un bon gestionnaire, déterministe", () => {
  const { base, ouverts } = partieEnMemoire();
  const methode = {
    type: "methode" as const,
    decider: (c: Parameters<typeof decisionDeReference>[0]) => decisionDeReference(c, ouverts),
  };

  it("deux rejeux de la référence sous la même graine sont identiques", () => {
    expect(rejouer(base, 7, methode)).toEqual(rejouer(base, 7, methode));
  });

  it("jouer les décisions de la référence comme un joueur redonne la référence, au centime", () => {
    const ref = rejouer(base, 11, methode);
    const joueur = rejouer(jouer({ ...base, graine: 11 }, (c) => decisionDeReference(c, ouverts)), 11);
    expect(joueur.joueur).toEqual(ref.joueur);
    expect(joueur.tours).toEqual(ref.tours);
  });

  it("un autre marché donne un autre résultat : la graine porte bien le hasard", () => {
    const a = rejouer(base, 1, methode).joueur.resultatNetCumule;
    const b = rejouer(base, 2, methode).joueur.resultatNetCumule;
    expect(a).not.toBe(b);
  });

  it("elle fait mieux que la gestion neutre qu'elle tient : c'est un étalon exigeant", () => {
    const neutre = jouer(base, (c) => selonLeNiveau(neutralDecisions(c), ouverts));
    const reference = partieDeLaReference(base, ouverts);
    const n = GRAINES_DU_MERITE.slice(0, 5).map((g) => rejouer(neutre, g).joueur.resultatNetCumule);
    const r = GRAINES_DU_MERITE.slice(0, 5).map((g) => rejouer(reference, g).joueur.resultatNetCumule);
    expect(r.every((v, i) => v > n[i]!)).toBe(true);
  });
});

/**
 * Les leviers qu'une décision emploie AU-DELÀ du défaut d'un champ fermé (celui
 * que le formulaire envoie, `aLaMesureDuNiveau`, la neutre portant la qualité et
 * l'entretien). Une décision au niveau n'en emploie aucun de fermé.
 */
function leviersFermesEmployes(d: RoundDecisions, neutre: RoundDecisions, ouverts: LeviersDuNiveau): string[] {
  const fermes: string[] = [];
  if (!ouverts.quality && d.qualityBudget !== neutre.qualityBudget) fermes.push("quality");
  if (!ouverts.maintenance && d.maintenanceBudget !== neutre.maintenanceBudget) fermes.push("maintenance");
  if (!ouverts.hr && d.hr !== undefined) fermes.push("hr");
  if (!ouverts.investment && d.investment !== undefined) fermes.push("investment");
  if (!ouverts.insurance && d.insurance) fermes.push("insurance");
  if (!ouverts.rse && d.rse !== undefined) fermes.push("rse");
  if (!ouverts.rd && (d.rdBudget !== undefined || Object.values(d.products ?? {}).some((p) => p.rdBudget !== undefined))) fermes.push("rd");
  if (!ouverts.creances && d.treasury !== undefined) fermes.push("creances");
  if (!ouverts.placement && (d.treasury?.placement ?? 0) > 0) fermes.push("placement");
  if (!ouverts.finance && ((d.finance?.newLoan ?? 0) > 0 || (d.finance?.loanRepayment ?? 0) > 0)) fermes.push("finance");
  if ((d.finance?.capitalIncrease ?? 0) > 0) fermes.push("apport");
  if ((d.finance?.dividend ?? 0) > 0) fermes.push("dividend");
  return fermes;
}

describe("la référence ne joue que les leviers ouverts, aux six niveaux", () => {
  for (const p of DIFFICULTY_PRESETS) {
    for (const entreprise of ["nova", "hotel", "fitness"]) {
      it(`niveau ${p.level}, ${entreprise} : aucun levier fermé, à aucun tour`, () => {
        const { base, ouverts } = partieEnMemoire(p.level, entreprise);
        const employes = new Set<string>();
        rejouer(base, 5, {
          type: "methode",
          decider: (c) => {
            const d = decisionDeReference(c, ouverts);
            const { neutre } = decisionDuBonGestionnaire(c);
            for (const f of leviersFermesEmployes(d, aLaMesureDuNiveau(neutre, ouverts), ouverts)) employes.add(f);
            return d;
          },
        });
        expect([...employes]).toEqual([]);
      });
    }
  }

  it("la garde sait tomber : la décision brute, sans le filtre du niveau, emploie des leviers fermés", () => {
    const { base, ouverts } = partieEnMemoire(1);
    const employes = new Set<string>();
    rejouer(base, 5, {
      type: "methode",
      decider: (c) => {
        const { decision, neutre } = decisionDuBonGestionnaire(c);
        for (const f of leviersFermesEmployes(decision, neutre, ouverts)) employes.add(f);
        return decisionDeReference(c, ouverts);
      },
    });
    expect(employes.size).toBeGreaterThan(0);
  });

  it("un levier que le niveau n'ouvre pas est fermé à la méthode, au défaut du formulaire", () => {
    const d: RoundDecisions = {
      price: 59,
      productionPlan: 4000,
      marketingBudget: 6000,
      qualityBudget: 3000,
      maintenanceBudget: 4000,
      insurance: "base",
      hr: { salaryIndex: 1 },
      treasury: { discount: 0, factoring: 0, placement: 5000 },
      finance: { newLoan: 1000, loanRepayment: 0 },
    };
    // Niveau 1 : la qualité et l'entretien partent à la valeur que porte le
    // champ caché du formulaire, celle de la gestion neutre (ici, `d` lui-même) ;
    // ni assurance, ni équipe, ni créances, ni emprunt.
    const n1 = selonLeNiveau(d, presetByLevel.get(1)!.decisions);
    expect(n1.qualityBudget).toBe(3000);
    expect(n1.maintenanceBudget).toBe(4000);
    expect(n1.insurance).toBe(false);
    expect(n1.hr).toBeUndefined();
    expect(n1.treasury).toBeUndefined();
    expect(n1.finance).toEqual({ newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
    // Niveau 3 : l'équipe et les créances, sans placement ni emprunt.
    const n3 = selonLeNiveau(d, presetByLevel.get(3)!.decisions);
    expect(n3.hr).toEqual({ salaryIndex: 1 });
    expect(n3.treasury).toEqual({ discount: 0, factoring: 0, placement: 0 });
    expect(n3.insurance).toBe(false);
    expect(n3.finance).toEqual({ newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
    // Niveau 4 : l'emprunt et l'assurance ; l'apport et le dividende restent hors de la méthode.
    const n4 = selonLeNiveau(d, presetByLevel.get(4)!.decisions);
    expect(n4.insurance).toBe("base");
    expect(n4.finance).toEqual({ newLoan: 1000, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
    expect(n4.treasury?.placement).toBe(0);
    const n5 = selonLeNiveau(d, presetByLevel.get(5)!.decisions);
    expect(n5.treasury?.placement).toBe(5000);
  });
});

describe("le rejeu relit les nombres comme la base les rend", () => {
  it("les clés d'un objet jsonb : les plus courtes d'abord, puis octet par octet", () => {
    expect(Object.keys(commeEnBase({ zz: 1, b: 2, a: 3, aaa: 4, ab: 5 }))).toEqual(["a", "b", "ab", "zz", "aaa"]);
    expect(commeEnBase({ x: undefined, y: -0 })).toEqual({ y: 0 });
  });
});

describe("la référence ne lit rien du futur", () => {
  const { base, ouverts } = partieEnMemoire(4, "nova");

  it("les saisons des tours à venir changées, la décision du tour est la même", () => {
    const contextes: Contexte[] = [];
    rejouer(base, 9, {
      type: "methode",
      decider: (c) => {
        contextes.push(structuredClone(c));
        return decisionDeReference(c, ouverts);
      },
    });
    expect(contextes.length).toBe(base.tours);
    for (const c of contextes) {
      const brouille = (s: number[]) => s.map((v, i) => (i >= c.roundIndex ? v * 3 + 1 : v));
      const avenir: EngineScenarioConfig = {
        ...c.scenario,
        market: {
          ...c.scenario.market,
          seasonality: brouille(c.scenario.market.seasonality),
          segments: c.scenario.market.segments.map((g) => (g.seasonality ? { ...g, seasonality: brouille(g.seasonality) } : g)),
        },
        ...(c.scenario.products
          ? {
              products: c.scenario.products.map((p) => ({
                ...p,
                market: {
                  ...p.market,
                  ...(p.market.seasonality ? { seasonality: brouille(p.market.seasonality) } : {}),
                  segments: p.market.segments.map((g) => (g.seasonality ? { ...g, seasonality: brouille(g.seasonality) } : g)),
                },
              })),
            }
          : {}),
      };
      expect(decisionDeReference({ ...c, scenario: avenir }, ouverts)).toEqual(decisionDeReference(c, ouverts));
    }
  });

  it("une partie à la demande aussi : les saisons à venir changées, la décision du tour est la même", () => {
    const { base: b, ouverts: o } = partieEnMemoire(4, "nova", 4242, true);
    expect(b.scenarioPour(b.graine).propositionALaDemande).toBe(true);
    const contextes: Contexte[] = [];
    rejouer(b, 9, {
      type: "methode",
      decider: (c) => {
        contextes.push(structuredClone(c));
        return decisionDeReference(c, o);
      },
    });
    for (const c of contextes) {
      const brouille = (s: number[]) => s.map((v, i) => (i >= c.roundIndex ? v * 3 + 1 : v));
      const avenir: EngineScenarioConfig = {
        ...c.scenario,
        market: {
          ...c.scenario.market,
          seasonality: brouille(c.scenario.market.seasonality),
          segments: c.scenario.market.segments.map((g) => (g.seasonality ? { ...g, seasonality: brouille(g.seasonality) } : g)),
        },
        ...(c.scenario.products
          ? {
              products: c.scenario.products.map((p) => ({
                ...p,
                market: {
                  ...p.market,
                  ...(p.market.seasonality ? { seasonality: brouille(p.market.seasonality) } : {}),
                  segments: p.market.segments.map((g) => (g.seasonality ? { ...g, seasonality: brouille(g.seasonality) } : g)),
                },
              })),
            }
          : {}),
      };
      expect(decisionDeReference({ ...c, scenario: avenir }, o)).toEqual(decisionDeReference(c, o));
    }
  });

  it("la garde sait tomber : la gestion neutre, elle, lit la saison du tour suivant", () => {
    const { base: b } = partieEnMemoire(1, "nova");
    const s = b.scenarioPour(b.graine);
    const etat = b.etatsInitiaux[0]!;
    const ctx = { scenario: s, state: etat, roundIndex: 1 };
    const avenir = { ...s, market: { ...s.market, seasonality: s.market.seasonality.map((v, i) => (i >= 1 ? v * 3 : v)) } };
    expect(neutralDecisions({ ...ctx, scenario: avenir }).productionPlan).not.toBe(neutralDecisions(ctx).productionPlan);
    // Privée de l'avenir, elle ne le voit plus.
    expect(neutralDecisions({ ...ctx, scenario: sansAvenir(avenir, 1) }).productionPlan).toBe(
      neutralDecisions({ ...ctx, scenario: sansAvenir(s, 1) }).productionPlan,
    );
  });
});

/**
 * LES STRATÉGIES TÉMOINS TOMBENT DANS LA BONNE CASE, sur trois entreprises et
 * deux niveaux : le verdict complet, sur les trente marchés, comme le service
 * le calcule (la partie jouée sous sa graine, la référence qui joue la même).
 */
describe("les stratégies témoins tombent dans la bonne case", () => {
  /**
   * Ce que le formulaire propose (la neutre, à la qualité que le scénario fait proposer),
   * prix relevé de 8 % à chaque tour : un seul geste, sur le formulaire tel qu'il s'affiche.
   */
  const prixPlus8 = (o: LeviersDuNiveau) => (c: Contexte) => {
    const neutre = neutralDecisions(c);
    const d = aLaMesureDuNiveau(avecLaQualiteProposee(c.scenario, neutre), o, neutre);
    return {
      ...d,
      price: d.price * 1.08,
      ...(d.products
        ? { products: Object.fromEntries(Object.entries(d.products).map(([k, p]) => [k, { ...p, price: p.price * 1.08 }])) }
        : {}),
    };
  };
  /** Sous le coût variable : 90 % de ce que coûte une unité. */
  const sousLeCout = (o: LeviersDuNiveau) => (c: Contexte) => {
    const d = aLaMesureDuNiveau(neutralDecisions(c), o);
    const k = (variableCostPerUnit(c.scenario) * 0.9) / d.price;
    return {
      ...d,
      price: d.price * k,
      ...(d.products
        ? { products: Object.fromEntries(Object.entries(d.products).map(([n, p]) => [n, { ...p, price: p.price * k }])) }
        : {}),
    };
  };
  /**
   * Raisonnée : le prix du tour passé relevé de 6 % quand des ventes ont manqué,
   * baissé de 6 % quand le stock dépasse le quart des ventes ; le volume sur la
   * demande observée (ventes et ventes manquées), la saison du tour, moins le stock.
   */
  const raisonnee = (o: LeviersDuNiveau) => (c: Contexte) => {
    const d = aLaMesureDuNiveau(neutralDecisions(c), o);
    const r = c.resultatPrecedent;
    const prec = c.decisionPrecedente;
    if (!r || !prec) return d;
    const vendu = Object.values(r.market.bySegment).reduce((s, x) => s + x.sold, 0);
    const manque = Object.values(r.market.bySegment).reduce((s, x) => s + x.lost, 0);
    const stock = c.state.finishedGoods.quantity;
    const k = manque > 0.05 * Math.max(1, vendu) ? 1.06 : stock > 0.25 * Math.max(1, vendu) ? 0.94 : 1;
    const saison = c.scenario.market.seasonality;
    const ratio = (saison[c.roundIndex - 1] ?? 1) / Math.max(0.01, saison[c.roundIndex - 2] ?? 1);
    const capacite = Math.min(
      c.state.machineCapacity * c.state.availability,
      (c.state.headcount * c.state.hoursPerEmployee * c.state.productivity) / c.scenario.product.hoursPerUnit,
    );
    return {
      ...d,
      price: Math.max(variableCostPerUnit(c.scenario) * 1.15, prec.price * k),
      productionPlan: Math.min(capacite, Math.max(0, (vendu + manque) * ratio * 1.05 - stock)),
    };
  };

  const verdictDe = (base: PartieARejouer, ouverts: LeviersDuNiveau, strategie: (c: Contexte) => RoundDecisions) => {
    const partie = jouer(base, strategie);
    const reference = partieDeLaReference(base, ouverts);
    return verdictDuMerite({
      joue: rejouer(partie, base.graine),
      joueur: GRAINES_DU_MERITE.map((g) => rejouer(partie, g)),
      reference: GRAINES_DU_MERITE.map((g) => rejouer(reference, g)),
      libelles: Array.from({ length: base.tours }, (_, i) => `Tour ${i + 1}`),
      niveau: 1,
      niveauMax: 6,
      entreprise: "nova",
      entreprises: ["nova"],
    });
  };

  for (const entreprise of ["nova", "ecommerce", "conseil"]) {
    for (const niveau of [1, 2, 3]) {
      it(`${entreprise}, niveau ${niveau} : +8 % de prix fragile, la raisonnée solide, sous le coût jamais`, () => {
        const { base, ouverts } = partieEnMemoire(niveau, entreprise);
        const naive = verdictDe(base, ouverts, prixPlus8(ouverts));
        const bonne = verdictDe(base, ouverts, raisonnee(ouverts));
        const mauvaise = verdictDe(base, ouverts, sousLeCout(ouverts));
        expect(naive.solides, `+8 % : ${naive.battues}/30, ${Math.round(naive.ecart.relatif * 100)} %`).toBe(false);
        expect(bonne.solides, `raisonnée : ${bonne.battues}/30, ${Math.round(bonne.ecart.relatif * 100)} %`).toBe(true);
        expect(mauvaise.solides).toBe(false);
        expect(mauvaise.battues).toBe(0);
      }, 60_000);
    }
  }
});

/**
 * LES MÊMES TÉMOINS DANS UNE PARTIE À LA DEMANDE (`propositionALaDemande`), dont le
 * formulaire planifie sur la demande et dont le bon gestionnaire le tient (rapport
 * « mesure-gestionnaire », mesuré dans cette configuration exacte) : le formulaire validé
 * tel quel est fragile, +8 % de prix aussi, la raisonnée reste solide. Un témoin
 * fragile : la raisonnée à l'e-commerce, aux niveaux 2 et 3, bat le bon gestionnaire sur
 * 20 marchés sur 30, pile au seuil.
 */
describe("les stratégies témoins d'une partie à la demande", () => {
  const prixPlus8 = (o: LeviersDuNiveau) => (c: Contexte) => {
    const neutre = neutralDecisions(c);
    const d = aLaMesureDuNiveau(avecLaQualiteProposee(c.scenario, neutre), o, neutre);
    return {
      ...d,
      price: d.price * 1.08,
      ...(d.products
        ? { products: Object.fromEntries(Object.entries(d.products).map(([k, p]) => [k, { ...p, price: p.price * 1.08 }])) }
        : {}),
    };
  };
  const raisonnee = (o: LeviersDuNiveau) => (c: Contexte) => {
    const d = aLaMesureDuNiveau(neutralDecisions(c), o);
    const r = c.resultatPrecedent;
    const prec = c.decisionPrecedente;
    if (!r || !prec) return d;
    const vendu = Object.values(r.market.bySegment).reduce((s, x) => s + x.sold, 0);
    const manque = Object.values(r.market.bySegment).reduce((s, x) => s + x.lost, 0);
    const stock = c.state.finishedGoods.quantity;
    const k = manque > 0.05 * Math.max(1, vendu) ? 1.06 : stock > 0.25 * Math.max(1, vendu) ? 0.94 : 1;
    const saison = c.scenario.market.seasonality;
    const ratio = (saison[c.roundIndex - 1] ?? 1) / Math.max(0.01, saison[c.roundIndex - 2] ?? 1);
    const capacite = Math.min(
      c.state.machineCapacity * c.state.availability,
      (c.state.headcount * c.state.hoursPerEmployee * c.state.productivity) / c.scenario.product.hoursPerUnit,
    );
    return {
      ...d,
      price: Math.max(variableCostPerUnit(c.scenario) * 1.15, prec.price * k),
      productionPlan: Math.min(capacite, Math.max(0, (vendu + manque) * ratio * 1.05 - stock)),
    };
  };
  const formulaire = (o: LeviersDuNiveau) => (c: Contexte) =>
    proposedDecisionsFor({
      snapshot: c.scenario,
      state: c.state,
      roundIndex: c.roundIndex,
      previousPayload: c.decisionPrecedente ?? null,
      lastMarket: c.resultatPrecedent?.market.bySegment ?? null,
      lastBreakEven: c.resultatPrecedent?.breakeven.breakEvenUnits ?? null,
      lastNetIncome: c.resultatPrecedent?.incomeStatement.netIncome ?? null,
      leviers: o,
    });
  const battues = (base: PartieARejouer, ouverts: LeviersDuNiveau, strategie: (c: Contexte) => RoundDecisions) => {
    const partie = jouer(base, strategie);
    const reference = partieDeLaReference(base, ouverts);
    return verdictDuMerite({
      joue: rejouer(partie, base.graine),
      joueur: GRAINES_DU_MERITE.map((g) => rejouer(partie, g)),
      reference: GRAINES_DU_MERITE.map((g) => rejouer(reference, g)),
      libelles: Array.from({ length: base.tours }, (_, i) => `Tour ${i + 1}`),
      niveau: 1,
      niveauMax: 6,
      entreprise: "nova",
      entreprises: ["nova"],
    });
  };

  for (const entreprise of ["nova", "ecommerce", "conseil"]) {
    for (const niveau of [1, 2, 3]) {
      it(`${entreprise}, niveau ${niveau} : le formulaire validé et +8 % fragiles, la raisonnée solide`, () => {
        const { base, ouverts } = partieEnMemoire(niveau, entreprise, 4242, true);
        expect(base.scenarioPour(base.graine).propositionALaDemande).toBe(true);
        const valider = battues(base, ouverts, formulaire(ouverts));
        const naive = battues(base, ouverts, prixPlus8(ouverts));
        const bonne = battues(base, ouverts, raisonnee(ouverts));
        expect(valider.solides, `formulaire : ${valider.battues}/30`).toBe(false);
        expect(naive.solides, `+8 % : ${naive.battues}/30`).toBe(false);
        expect(bonne.solides, `raisonnée : ${bonne.battues}/30`).toBe(true);
      }, 60_000);
    }
  }
});

describe("la matrice : quatre cas, deux critères écrits", () => {
  it("les quatre cas, dans le vocabulaire des épisodes", () => {
    expect(casDuMerite(true, true)).toBe("merite");
    expect(casDuMerite(true, false)).toBe("malchance");
    expect(casDuMerite(false, true)).toBe("chance");
    expect(casDuMerite(false, false)).toBe("lecon");
    expect(Object.values(CAS_DU_MERITE).map((c) => c.nom)).toEqual(["Mérité", "Malchance", "Chance", "Leçon"]);
  });

  it("des décisions sont solides à deux marchés sur trois, sans condition d'écart moyen", () => {
    expect(SEUIL_DES_DECISIONS_SOLIDES).toBeCloseTo(2 / 3);
    expect(sontSolides(20, 30)).toBe(true);
    expect(sontSolides(19, 30)).toBe(false);
    expect(sontSolides(30, 30)).toBe(true);
    expect(sontSolides(0, 30)).toBe(false);
    expect(sontSolides(0, 0)).toBe(false);
  });

  it("il gagne son marché : 1er le plus souvent, ou 1er sur au moins la moitié des marchés", () => {
    const compte = (premiers: number, deuxiemes: number, troisiemes: number) => [premiers, deuxiemes, troisiemes];
    expect(gagneSonMarche({ plusSouvent: 1, compte: compte(12, 10, 8) }, 30)).toBe(true);
    expect(gagneSonMarche({ plusSouvent: 1, compte: compte(15, 15, 0) }, 30)).toBe(true);
    expect(gagneSonMarche({ plusSouvent: 2, compte: compte(11, 12, 7) }, 30)).toBe(false);
    expect(gagneSonMarche({ plusSouvent: 3, compte: compte(0, 0, 30) }, 30)).toBe(false);
    // La règle de la moitié tient seule, si la place la plus fréquente venait d'ailleurs.
    expect(gagneSonMarche({ plusSouvent: 2, compte: compte(15, 15, 0) }, 30)).toBe(true);
    expect(gagneSonMarche({ plusSouvent: 1, compte: [] }, 0)).toBe(false);
  });

  it("l'échelle d'un écart : le résultat de la référence, au moins 5 % de son chiffre d'affaires", () => {
    expect(echelleDeLaReference(100_000, 1_000_000)).toBe(100_000);
    expect(echelleDeLaReference(-80_000, 1_000_000)).toBe(80_000);
    expect(echelleDeLaReference(1_000, 1_000_000)).toBe(50_000);
    expect(echelleDeLaReference(0, 0)).toBe(1);
  });

  it("la place du marché joué, et la meilleure moitié", () => {
    const valeurs = Array.from({ length: 30 }, (_, i) => i * 100);
    expect(placeDuTirage(valeurs, 5000)).toBe(1);
    expect(placeDuTirage(valeurs, 2900)).toBe(1);
    expect(placeDuTirage(valeurs, 2850)).toBe(2);
    expect(placeDuTirage(valeurs, -10)).toBe(30);
    expect(estFavorable(15, 30)).toBe(true);
    expect(estFavorable(16, 30)).toBe(false);
  });
});

describe("le niveau conseillé suit le verdict", () => {
  const ENTREPRISES = ["nova", "boutique", "hotel"];
  const suite = (score: number, ecart: number, solides: boolean, niveau = 3, entreprise = "boutique", gagne = false) =>
    conseillerLaSuite({ score, ecart, solides, gagne, niveau, niveauMax: 6, entreprise, entreprises: ENTREPRISES });

  it("ses seuils, écrits", () => {
    expect(SEUILS_DE_LA_SUITE).toEqual({ descente: { part: 0.4, ecart: -0.25 } });
  });

  it("des décisions solides : un niveau de plus, même entreprise", () => {
    expect(suite(0.8, 0.1, true)).toMatchObject({ sens: "monter", niveau: 4, entreprise: "boutique", memeEntreprise: true });
    expect(suite(1, 0.5, true)).toMatchObject({ sens: "monter", niveau: 4 });
  });

  it("entre les deux, même niveau, entreprise suivante", () => {
    // Plus d'un marché sur deux, pas deux sur trois : on reste.
    expect(suite(0.6, 0.02, false)).toMatchObject({ sens: "rester", niveau: 3, entreprise: "hotel", memeEntreprise: false });
    expect(suite(0.6, 0.02, false).pourquoi).toMatch(/sur 60\s% des marchés possibles seulement, trop peu souvent pour être solides/);
    // Peu de marchés battus, mais pas loin : on reste.
    expect(suite(0.1, -0.24, false)).toMatchObject({ sens: "rester", niveau: 3 });
    // Loin, mais sur plus de 40 % des marchés : on reste.
    expect(suite(0.41, -0.6, false)).toMatchObject({ sens: "rester", niveau: 3 });
    // La dernière entreprise revient à la première.
    expect(suite(0.5, 0, false, 3, "hotel").entreprise).toBe("nova");
  });

  it("loin du bon gestionnaire, sur les deux critères : un niveau de moins, même entreprise", () => {
    expect(suite(0.4, -0.26, false)).toMatchObject({ sens: "descendre", niveau: 2, entreprise: "boutique" });
    expect(suite(0, -1, false)).toMatchObject({ sens: "descendre", niveau: 2 });
  });

  it("il gagne son marché : jamais de descente, même niveau, autre entreprise", () => {
    const loin = suite(0, -0.6, false, 2, "boutique", true);
    expect(loin).toMatchObject({ sens: "rester", niveau: 2, entreprise: "hotel", memeEntreprise: false, gagne: true });
    expect(loin.pourquoi).toBe(
      "Vous gagnez votre marché ; un bon gestionnaire aurait fait mieux sur ces mêmes marchés (vous faites 60\u00a0% de résultat en moins en moyenne). Restez au niveau 2 et essayez une autre entreprise : le niveau suivant se propose quand vos décisions sont solides.",
    );
    expect(loin.pourquoi).not.toMatch(/niveau inférieur|Rejouez cette entreprise au niveau 1|restent loin/);
    // Solides, il monte comme tout le monde.
    expect(suite(0.8, 0.1, true, 2, "boutique", true)).toMatchObject({ sens: "monter", niveau: 3 });
    // Au premier niveau aussi : une autre entreprise, pas la même rejouée.
    expect(suite(0, -0.6, false, 1, "boutique", true)).toMatchObject({ sens: "rester", niveau: 1, entreprise: "hotel" });
  });

  it("aux bornes : on ne monte pas au-delà du niveau le plus haut, on ne descend pas sous le premier", () => {
    expect(suite(0.9, 0.2, true, 6)).toMatchObject({ sens: "rester", niveau: 6, entreprise: "hotel" });
    expect(suite(0.1, -0.5, false, 1)).toMatchObject({ sens: "rester", niveau: 1, entreprise: "boutique" });
  });
});

/** Une issue de rejeu fabriquée : seuls comptent le résultat, le rang et les tours. */
function issue(graine: number, resultat: number, rang = 2, parTour?: number[]): IssueDuRejeu {
  const tours = parTour ?? [resultat / 2, resultat / 2];
  return {
    graine,
    joueur: { ipg: 50, rang, resultatNetCumule: resultat, chiffreDAffairesCumule: 100_000, tresorerieFinale: 1000, tresorerieLaPlusBasse: 1000, defaillant: false },
    sur: 3,
    resultatParTour: tours,
    parEquipe: {},
    tours: [],
  };
}

describe("le verdict : les quatre cas fabriqués", () => {
  const N = GRAINES_DU_MERITE.length;
  const libelles = ["Trimestre 1", "Trimestre 2"];
  const fabriquer = (battues: number, obtenu: number, deCombien = 2000, rang = 2, ailleurs = 500) => {
    // Les décisions du joueur font 1 000 à 30 000 €, à la place `rang` ; la
    // référence fait `deCombien` de moins sur les marchés que le joueur bat,
    // `ailleurs` de plus sur les autres.
    const joueur = GRAINES_DU_MERITE.map((g, i) => issue(g, (i + 1) * 1000, rang));
    const reference = GRAINES_DU_MERITE.map((g, i) =>
      issue(g, i >= N - battues ? (i + 1) * 1000 - deCombien : (i + 1) * 1000 + ailleurs, 1),
    );
    return verdictDuMerite({
      joue: issue(999, obtenu),
      joueur,
      reference,
      libelles,
      niveau: 3,
      niveauMax: 6,
      entreprise: "nova",
      entreprises: ["nova", "hotel"],
    });
  };

  it("Mérité : solides, et un marché dans la meilleure moitié", () => {
    const v = fabriquer(24, 28_000);
    expect(v.battues).toBe(24);
    expect(v.ecart.relatif).toBeGreaterThan(0.05);
    expect(v.cas).toBe("merite");
    expect(v.joue.place).toBe(3);
    expect(v.phrases.verdict).toMatch(/^Mérité\. Vos décisions font mieux qu'un bon gestionnaire sur 24 des 30 marchés possibles, de \d+\s% en moyenne/);
    expect(v.phrases.marche).toBe("Votre marché était le 3e plus favorable sur 30 : très favorable.");
    expect(v.suite).toMatchObject({ sens: "monter", niveau: 4 });
  });

  it("Malchance : solides, mais un marché dans la moins bonne moitié", () => {
    const v = fabriquer(20, 3_000);
    expect(v.cas).toBe("malchance");
    expect(v.phrases.verdict).toMatch(/À refaire quand même/);
    expect(v.phrases.marche).toMatch(/très défavorable/);
  });

  it("de peu, mais partout : solide, aucun écart moyen n'est exigé", () => {
    // 100 € de mieux partout : moins de 1 % du résultat de la référence.
    const v = fabriquer(30, 2_000, 100);
    expect(v.battues).toBe(30);
    expect(v.ecart.relatif).toBeLessThan(0.01);
    expect(v.solides).toBe(true);
    expect(v.cas).toBe("malchance");
  });

  it("deux marchés sur trois en perdant en moyenne : solides, et la phrase le dit sans « de −x % »", () => {
    // 100 € de mieux sur 20 marchés, 10 000 € de moins sur les 10 autres.
    const v = fabriquer(20, 28_000, 100, 2, 10_000);
    expect(v.solides).toBe(true);
    expect(v.ecart.relatif).toBeLessThan(0);
    expect(v.phrases.verdict).toMatch(
      /^Mérité\. Vos décisions font mieux qu'un bon gestionnaire sur 20 des 30 marchés possibles \(en moyenne, \d+\s% de résultat en moins\), et votre résultat est à leur hauteur\.$/,
    );
    expect(v.suite.pourquoi).toMatch(/sur 67\s% des marchés possibles \(en moyenne, \d+\s% de résultat en moins\)\. Passez au niveau 4/);
  });

  it("Chance : fragiles, mais un marché favorable", () => {
    const v = fabriquer(10, 22_000);
    expect(v.cas).toBe("chance");
    expect(v.phrases.verdict).toMatch(/doit beaucoup au marché/);
    expect(v.suite).toMatchObject({ sens: "rester", niveau: 3 });
  });

  it("Leçon : fragiles, et le marché le montre", () => {
    const v = fabriquer(0, 2_000);
    expect(v.cas).toBe("lecon");
    expect(v.phrases.verdict).toBe(
      "Leçon. Vos décisions ne font mieux qu'un bon gestionnaire sur aucun des 30 marchés possibles, et ce marché-ci le montre.",
    );
  });

  describe("il gagne son marché : jamais renvoyé au niveau inférieur", () => {
    // Aucun marché battu, 10 000 € de moins que la référence partout : loin d'elle.
    it("1er le plus souvent, et Leçon : pas de descente, même niveau, autre entreprise", () => {
      const v = fabriquer(0, 2_000, 2000, 1, 10_000);
      expect(v.cas).toBe("lecon");
      expect(v.rangs.plusSouvent).toBe(1);
      expect(v.ecart.relatif).toBeLessThan(SEUILS_DE_LA_SUITE.descente.ecart);
      expect(v.suite).toMatchObject({ sens: "rester", niveau: 3, entreprise: "hotel", gagne: true });
      expect(v.phrases.verdict).toBe(
        "Leçon. Vous gagnez votre marché (1re place sur 30 des 30), mais vos décisions ne font mieux qu'un bon gestionnaire sur aucun des 30 marchés possibles, et ce marché-ci le montre.",
      );
      expect(v.suite.pourquoi).toMatch(/^Vous gagnez votre marché ; un bon gestionnaire aurait fait mieux sur ces mêmes marchés .* Restez au niveau 3 et essayez une autre entreprise/);
    });

    it("dernier le plus souvent, et Leçon : la descente reste possible", () => {
      const v = fabriquer(0, 2_000, 2000, 3, 10_000);
      expect(v.cas).toBe("lecon");
      expect(v.rangs.plusSouvent).toBe(3);
      expect(v.suite).toMatchObject({ sens: "descendre", niveau: 2, entreprise: "nova", gagne: false });
      expect(v.phrases.verdict).not.toMatch(/gagnez/);
    });

    it("solides : la montée, qu'il gagne son marché ou non", () => {
      expect(fabriquer(24, 28_000, 2000, 1).suite).toMatchObject({ sens: "monter", niveau: 4, gagne: true });
      expect(fabriquer(24, 28_000, 2000, 3).suite).toMatchObject({ sens: "monter", niveau: 4, gagne: false });
    });
  });

  it("la fourchette des places et les constats de tour", () => {
    const joueur = GRAINES_DU_MERITE.map((g, i) => issue(g, 1000 * i, i < 20 ? 1 : i < 28 ? 2 : 3, [100 * i, 1000 * i - 100 * i]));
    const reference = GRAINES_DU_MERITE.map((g, i) => issue(g, 1000 * i - 10, 2, [100 * i + 50, 1000 * i - 100 * i - 60]));
    const v = verdictDuMerite({
      joue: issue(999, 15_000),
      joueur,
      reference,
      libelles,
      niveau: 2,
      niveauMax: 6,
      entreprise: "nova",
      entreprises: ["nova", "hotel"],
    });
    expect(v.rangs).toMatchObject({ min: 1, max: 3, plusSouvent: 1 });
    expect(v.phrases.rangs).toBe(
      "Sur 30 marchés possibles, avec vos décisions : entre la 1re et la 3e place sur 3, la 1re le plus souvent.",
    );
    expect(v.phrases.reference).toMatch(/^Sous les mêmes marchés, un bon gestionnaire fait /);
    const couteux = v.constats.find((c) => c.cle === "tour-le-plus-couteux")!;
    expect(couteux.texte).toMatch(/^Le tour le plus coûteux : Trimestre 1\. Face à un bon gestionnaire/);
    expect(v.constats.find((c) => c.cle === "tour-le-plus-expose")!.texte).toMatch(/Trimestre 2/);
    expect(v.constats.find((c) => c.cle === "part-du-hasard")).toBeDefined();
  });

  it("aucune phrase ne porte de tiret en milieu de phrase", () => {
    for (const [b, o, k, r, a] of [
      [24, 28_000, 2000, 2, 500],
      [20, 3_000, 2000, 2, 500],
      [30, 2_000, 100, 2, 500],
      [20, 28_000, 100, 2, 10_000],
      [10, 22_000, 2000, 2, 500],
      [0, 2_000, 2000, 2, 500],
      [0, 2_000, 2000, 1, 10_000],
      [10, 22_000, 2000, 1, 10_000],
      [0, 2_000, 2000, 3, 10_000],
    ] as const) {
      const v = fabriquer(b, o, k, r, a);
      for (const t of [...Object.values(v.phrases), ...v.constats.map((c) => c.texte), v.suite.pourquoi]) {
        expect(t).not.toMatch(/ [—–] /);
      }
    }
  });
});
