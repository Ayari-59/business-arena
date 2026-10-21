import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { commeEnBase, partieFigee, rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeLaGestionNeutre, rejeuxDeLEtalon } from "@/pedagogy/merite/etalons";
import { GRAINES_DU_MERITE, marcheRejoue } from "@/pedagogy/merite/verdict";
import {
  GRILLES,
  GRILLES_VERSION_3,
  GRILLE_BUSINESS_ARENA_2026,
  GRILLE_BUSINESS_ARENA_2026_VERSION_3,
  grilleGardee,
  grilleParCode,
  justificationDe,
  mesurerLaLigne,
  noterLaCopie,
  referenceDeLaGrille,
  seuilsDeLaCopie,
  seuilsDeLaCompetenceNotee,
  type CopieNotee,
  type GrilleDeNotation,
  type GrilleGardee,
  type MarcheDuRejeu,
  type MesuresDeLaCopie,
} from "@/config/examen/grille";
import { SEUILS_DE_NIVEAU, atteint, estRelative, type CodeDeCompetence } from "@/config/examen/competences";

/**
 * LA GRILLE VERSION 4 : DEUX LIGNES GRADUÉES DANS LA TENUE FINANCIÈRE. Décision du
 * propriétaire (« Deux lignes graduées ») : en version 3, la trésorerie et l'analyse
 * financière ne se nourrissaient que de lignes en oui ou non que la gestion neutre remplit
 * presque toujours ; elle y était maîtrisée, comme les copies meilleures et les moins
 * bonnes. Le creux de trésorerie et la marge nette se comparent à elle, marché par marché.
 *
 * Quatre gardes :
 *
 *   1. LA MESURE DES DEUX LIGNES : la part des marchés où la copie fait mieux que l'étalon,
 *      une égalité comptant moitié ; la marge est le résultat RAPPORTÉ au chiffre
 *      d'affaires, pas le résultat.
 *   2. SUR LE REJEU RÉEL : la copie de gestion neutre est « en cours » en trésorerie et en
 *      analyse financière (la version 3 la disait maîtrisée) ; une copie qui bat la gestion
 *      neutre en résultat en accumulant du stock y est « non acquise » en trésorerie (la
 *      version 3 la disait maîtrisée) ; une copie meilleure partout y est acquise.
 *   3. LES COPIES ANCIENNES GARDENT LEUR GRILLE : la copie d'une grille version 3 gardée par
 *      un examen note avec ses sept lignes et ses seuils, quand même la version 4 est publiée.
 *   4. LES POIDS PAR FAMILLE : la tenue financière garde son total, les autres familles ne
 *      bougent pas, et la part de la gestion neutre reste assez sous le plafond pour que
 *      « acquis » ne demande pas une copie parfaite.
 */

const FINANCE: readonly CodeDeCompetence[] = ["tresorerie", "analyse-financiere"];

/* ---------------------------------------------------------------------------
 * 1. La mesure des deux lignes, sur des marchés écrits.
 * ------------------------------------------------------------------------- */

const marche = (p: Partial<MarcheDuRejeu> = {}): MarcheDuRejeu => ({
  resultat: 1000,
  tresorerie: 500,
  tresorerieLaPlusBasse: 100,
  chiffreDAffaires: 10_000,
  defaillant: false,
  rang: 2,
  ...p,
});
const mesures = (joueur: MarcheDuRejeu[], reference: MarcheDuRejeu[]): MesuresDeLaCopie => ({ sur: 4, joueur, reference, situations: null });

describe("la mesure des deux lignes graduées", () => {
  const reference = Array.from({ length: 10 }, () => marche());

  it("le creux : la part des marchés où la trésorerie la plus basse reste au-dessus de celle de l'étalon, une égalité pour moitié", () => {
    // Six marchés au-dessus, deux à égalité, deux en dessous.
    const joueur = reference.map((r, i) => marche({ tresorerieLaPlusBasse: r.tresorerieLaPlusBasse! + (i < 6 ? 50 : i < 8 ? 0 : -50) }));
    const l = mesurerLaLigne("creux-de-tresorerie", mesures(joueur, reference))!;
    expect(l.part).toBeCloseTo(0.7, 12);
    expect(l.detail).toMatch(/^6 marchés sur 10, 2 à égalité ; creux moyen /);
    // La trésorerie de fin de partie n'y entre pas : elle a sa ligne.
    const finale = reference.map((r) => marche({ tresorerie: r.tresorerie + 1e6 }));
    expect(mesurerLaLigne("creux-de-tresorerie", mesures(finale, reference))!.part).toBe(0.5);
  });

  it("la marge : le résultat rapporté au chiffre d'affaires ; un résultat plus gros sur un chiffre d'affaires bien plus gros est une marge moins bonne", () => {
    // Plus de résultat sur chaque marché (la ligne « battre » le compterait), mais trois
    // fois le chiffre d'affaires : 4 % de marge contre 10 %.
    const joueur = reference.map(() => marche({ resultat: 1200, chiffreDAffaires: 30_000 }));
    expect(mesurerLaLigne("battre-la-reference", mesures(joueur, reference))!.part).toBe(1);
    const l = mesurerLaLigne("marge-nette", mesures(joueur, reference))!;
    expect(l.part).toBe(0);
    expect(l.detail).toMatch(/marge moyenne 4,0 % contre 10,0 %/);
    // Moins de résultat, mais une meilleure marge : la ligne le voit aussi.
    const sobre = reference.map(() => marche({ resultat: 900, chiffreDAffaires: 6000 }));
    expect(mesurerLaLigne("marge-nette", mesures(sobre, reference))!.part).toBe(1);
  });

  it("une copie identique à l'étalon tient exactement la moitié des deux lignes", () => {
    for (const code of ["creux-de-tresorerie", "marge-nette"] as const) {
      expect(mesurerLaLigne(code, mesures(reference, reference))!.part, code).toBe(0.5);
    }
  });

  it("sans le creux ou le chiffre d'affaires, la version 4 ne note pas ; la version 3 note les mêmes mesures", () => {
    const anciennes = reference.map(({ tresorerieLaPlusBasse: _t, chiffreDAffaires: _c, ...m }) => m);
    expect(() => noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesures(anciennes, anciennes), { questions: false })).toThrow(/incomplets/);
    expect(noterLaCopie(GRILLE_BUSINESS_ARENA_2026_VERSION_3, mesures(anciennes, anciennes), { questions: false }).lignes).toHaveLength(6);
  });
});

/* ---------------------------------------------------------------------------
 * 2. Sur le rejeu réel : le montage de tests/unit/examen-seuils-relatifs.test.ts.
 * ------------------------------------------------------------------------- */

function partieEnMemoire(niveau: number, entreprise: string, graine: number) {
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

const parProduit = (d: RoundDecisions, f: (p: NonNullable<RoundDecisions["products"]>[string]) => NonNullable<RoundDecisions["products"]>[string]) =>
  d.products ? { products: Object.fromEntries(Object.entries(d.products).map(([n, p]) => [n, f(p)])) } : {};
const prix = (d: RoundDecisions, k: number): RoundDecisions => ({ ...d, price: d.price * k, ...parProduit(d, (p) => ({ ...p, price: p.price * k })) });
/** Produire la moitié de plus que la gestion neutre en vendant plus cher : le stock s'accumule. */
const stockCher = (d: RoundDecisions): RoundDecisions =>
  prix({ ...d, productionPlan: Math.round(d.productionPlan * 1.5), ...parProduit(d, (p) => ({ ...p, productionPlan: Math.round(p.productionPlan * 1.5) })) }, 1.15);

/** Les mesures d'une copie qui joue la gestion neutre transformée, par le chemin de l'examen. */
function mesurer(niveau: number, entreprise: string, transforme: (d: RoundDecisions) => RoundDecisions): MesuresDeLaCopie {
  const { base, ouverts } = partieEnMemoire(niveau, entreprise, 4242);
  const partie = partieFigee(base, (c) => transforme(decisionDeLaGestionNeutre(c, ouverts)));
  const joueur = GRAINES_DU_MERITE.map((g) => rejouer(partie, g));
  const reference = rejeuxDeLEtalon(base, ouverts, referenceDeLaGrille(GRILLE_BUSINESS_ARENA_2026).code);
  return { sur: joueur[0]!.sur, joueur: joueur.map(marcheRejoue), reference: reference.map(marcheRejoue), situations: null };
}

const competence = (c: CopieNotee, code: CodeDeCompetence) => c.competences.find((x) => x.code === code)!;
const ligne = (c: CopieNotee, code: string) => c.lignes.find((l) => l.code === code)!;

describe("sur le rejeu réel, la trésorerie et l'analyse financière disent quelque chose", () => {
  it("boutique niveau 1 : la gestion neutre, maîtrisée en version 3, est en cours en version 4", () => {
    const m = mesurer(1, "boutique", (d) => d);
    const v3 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026_VERSION_3, m, { questions: false });
    const v4 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, m, { questions: false });
    expect(ligne(v4, "creux-de-tresorerie").part).toBe(0.5);
    expect(ligne(v4, "marge-nette").part).toBe(0.5);
    for (const code of FINANCE) {
      expect(competence(v3, code).niveau, `${code} en version 3`).toBe("maitrise");
      const c = competence(v4, code);
      expect(c.part, `${code} : la copie a la part de l'étalon`).toBe(c.partDeLaReference);
      expect(c.niveau, `${code} en version 4`).toBe("en-cours");
    }
  }, 120_000);

  it("boutique niveau 1 : la copie qui bat la gestion neutre en stockant n'est pas acquise en trésorerie ; la version 3 la disait maîtrisée", () => {
    const v3 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026_VERSION_3, mesurer(1, "boutique", stockCher), { questions: false });
    const v4 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesurer(1, "boutique", stockCher), { questions: false });
    // Elle bat la gestion neutre en résultat, et sa marge est meilleure.
    expect(ligne(v4, "battre-la-reference").part).toBeGreaterThan(0.9);
    expect(ligne(v4, "marge-nette").part).toBeGreaterThan(0.9);
    expect(atteint(competence(v4, "analyse-financiere").niveau)).toBe(true);
    // Mais sa caisse descend plus bas que celle de la gestion neutre presque partout.
    expect(ligne(v4, "creux-de-tresorerie").part).toBeLessThan(0.1);
    expect(competence(v3, "tresorerie").niveau).toBe("maitrise");
    expect(atteint(competence(v4, "tresorerie").niveau)).toBe(false);
  }, 120_000);

  it("bâtiment niveau 2 : la copie à prix plus 5 %, meilleure en creux et en marge, est acquise dans les deux", () => {
    const v4 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, mesurer(2, "batiment", (d) => prix(d, 1.05)), { questions: false });
    for (const code of FINANCE) expect(atteint(competence(v4, code).niveau), code).toBe(true);
  }, 120_000);

  it("transport niveau 2 : la copie à prix plus 5 %, moins bonne en marge, n'est pas acquise en analyse financière ; la version 3 la disait maîtrisée", () => {
    const m = mesurer(2, "transport", (d) => prix(d, 1.05));
    const v3 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026_VERSION_3, m, { questions: false });
    const v4 = noterLaCopie(GRILLE_BUSINESS_ARENA_2026, m, { questions: false });
    expect(competence(v3, "analyse-financiere").niveau).toBe("maitrise");
    expect(ligne(v4, "marge-nette").part).toBeLessThan(0.1);
    expect(atteint(competence(v4, "analyse-financiere").niveau)).toBe(false);
  }, 120_000);
});

/* ---------------------------------------------------------------------------
 * 3. Les copies anciennes gardent leur grille.
 * ------------------------------------------------------------------------- */

describe("un examen créé en version 3 garde sa grille, ses lignes et ses seuils", () => {
  /** La grille telle que `creerExamen` la copie dans `examens.grille`, puis relue de la base. */
  const gardee = (g: GrilleDeNotation): GrilleGardee => JSON.parse(JSON.stringify(g)) as GrilleGardee;
  const ref = Array.from({ length: 30 }, (_, i) => marche({ resultat: 1000 + 10 * i, rang: 2 }));
  const joueur = ref.map((r, i) => marche({ resultat: r.resultat + (i % 3 === 0 ? -50 : 80), tresorerieLaPlusBasse: 50, rang: 1 }));

  it("la copie version 3 note avec ses sept lignes et ses seuils, comme le jour de sa publication", () => {
    for (const g of GRILLES_VERSION_3) {
      const relue = grilleGardee(gardee(g));
      expect(relue.version).toBe(3);
      expect(relue.lignes.map((l) => [l.code, l.points])).toEqual(g.lignes.map((l) => [l.code, l.points]));
      expect(relue.lignes.map((l) => l.code)).not.toContain("creux-de-tresorerie");
      const copie = noterLaCopie(relue, mesures(joueur, ref), { questions: false });
      expect(copie).toEqual(noterLaCopie(g, mesures(joueur, ref), { questions: false }));
      expect(copie.grille.version).toBe(3);
      // La trésorerie s'y lit avec les seuils fixes d'alors, pas avec ceux de la version 4.
      for (const code of FINANCE) {
        expect(estRelative(seuilsDeLaCopie(copie), code), code).toBe(false);
        expect(seuilsDeLaCompetenceNotee(competence(copie, code), seuilsDeLaCopie(copie))).toEqual(SEUILS_DE_NIVEAU);
      }
      // Les mêmes mesures sous la version 4 donnent une autre note : c'est bien la copie
      // gardée qui a noté.
      const enV4 = noterLaCopie(grilleParCode(g.code)!, mesures(joueur, ref), { questions: false });
      expect(enV4.grille.version).toBe(4);
      expect(enV4.note).not.toBe(copie.note);
    }
  });

  it("les grilles version 3 restent écrites telles que publiées le 20 octobre 2026", () => {
    // Le barème des versions 1 à 3 : une retouche de ces définitions changerait la note des
    // copies témoins d'avant (tests/unit/examen-gestion-neutre) sans changer de version.
    const PUBLIEES_V3: Record<string, [string, number][]> = {
      "business-arena-2026": [
        ["battre-la-reference", 25],
        ["ecart-a-la-reference", 15],
        ["solvabilite", 15],
        ["tresorerie-positive", 10],
        ["rentabilite", 10],
        ["rang", 15],
        ["diagnostics", 10],
      ],
      "decision-d-abord": [
        ["battre-la-reference", 35],
        ["ecart-a-la-reference", 20],
        ["solvabilite", 10],
        ["tresorerie-positive", 5],
        ["rentabilite", 10],
        ["rang", 10],
        ["diagnostics", 10],
      ],
    };
    for (const g of GRILLES_VERSION_3) {
      expect(g.version).toBe(3);
      expect(g.publiee).toBe("2026-10-20");
      expect(g.lignes.map((l) => [l.code, l.points]), g.code).toEqual(PUBLIEES_V3[g.code]);
      expect(g.seuils.relatifs?.competences, g.code).toEqual(["strategie", "marketing-prix"]);
    }
  });

  it("un examen nouveau copie la version 4", () => {
    for (const g of GRILLES) {
      expect(grilleParCode(g.code)).toBe(g);
      expect(g.version).toBe(4);
    }
  });
});

/* ---------------------------------------------------------------------------
 * 4. Les poids par famille.
 * ------------------------------------------------------------------------- */

const pointsDe = (g: GrilleDeNotation, codes: readonly string[]) =>
  codes.reduce((s, c) => s + (g.lignes.find((l) => l.code === c)?.points ?? 0), 0);

describe("les poids de la version 4, famille par famille", () => {
  for (const g of GRILLES) {
    const avant = GRILLES_VERSION_3.find((x) => x.code === g.code)!;

    it(`${g.code} : la tenue financière garde son total, les autres familles ne bougent pas`, () => {
      expect(g.justification.map((j) => j.famille)).toEqual(avant.justification.map((j) => j.famille));
      for (const famille of avant.justification) {
        const nouvelle = g.justification.find((j) => j.famille === famille.famille)!;
        expect(pointsDe(g, nouvelle.lignes), famille.famille).toBe(pointsDe(avant, famille.lignes));
        if (famille.famille === "Tenue financière") {
          // Les deux lignes graduées y entrent ; les lignes en oui ou non y restent, plus légères.
          expect(nouvelle.lignes).toEqual([...famille.lignes, "creux-de-tresorerie", "marge-nette"]);
          for (const c of famille.lignes) {
            expect(pointsDe(g, [c]), c).toBeGreaterThan(0);
            expect(pointsDe(g, [c]), c).toBeLessThan(pointsDe(avant, [c]));
          }
        } else {
          expect(nouvelle.lignes).toEqual(famille.lignes);
          for (const c of famille.lignes) expect(pointsDe(g, [c]), c).toBe(pointsDe(avant, [c]));
        }
      }
      // Toutes les lignes sont dans une famille, et la justification se lit des lignes.
      expect(new Set(g.justification.flatMap((j) => j.lignes))).toEqual(new Set(g.lignes.map((l) => l.code)));
      expect(justificationDe(g).find((j) => j.startsWith("Tenue financière"))).toContain(`(${pointsDe(avant, avant.justification.find((j) => j.famille === "Tenue financière")!.lignes)} points : `);
    });

    it(`${g.code} : une copie qui joue la gestion neutre et tient toutes les lignes en oui ou non reste à dix points au moins sous le plafond`, () => {
      // Sinon le seuil « acquis » (sa part plus dix points) serait cent pour cent : seule
      // une copie parfaite l'atteindrait.
      for (const code of FINANCE) {
        let tenu = 0;
        let possible = 0;
        for (const l of g.lignes) {
          const r = l.competences.find((x) => x.code === code);
          if (!r) continue;
          const graduee = l.code === "creux-de-tresorerie" || l.code === "marge-nette";
          tenu += r.part * l.points * (graduee ? 0.5 : 1);
          possible += r.part * l.points;
        }
        expect(tenu / possible, code).toBeLessThanOrEqual(0.9);
        expect(estRelative(g.seuils, code), code).toBe(true);
      }
    });
  }
});
