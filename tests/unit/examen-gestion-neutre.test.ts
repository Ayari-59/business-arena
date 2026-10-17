import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel, type LeviersDuNiveau } from "@/config/difficulty";
import { aLaMesureDuNiveau, neutralDecisions, variableCostPerUnit, type BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { commeEnBase, rejouer, type DecideurDuJoueur, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { rejeuxDeLEtalon } from "@/pedagogy/merite/etalons";
import { GRAINES_DU_MERITE, marcheRejoue } from "@/pedagogy/merite/verdict";
import {
  GRILLES,
  GRILLE_BUSINESS_ARENA_2026,
  GRILLE_DECISION_D_ABORD,
  REFERENCE_GESTION_NEUTRE,
  REFERENCE_GESTION_NEUTRE_GELEE,
  noterLaCopie,
  referenceDeLaCopie,
  referenceDeLaGrille,
  type GrilleDeNotation,
} from "@/config/examen/grille";

/**
 * L'EXAMEN NOTE CONTRE LA GESTION NEUTRE DU SECTEUR. Décision du propriétaire : le bilan
 * des parties juge contre « un bon gestionnaire », l'examen garde l'étalon de sa grille
 * publiée. Trois gardes :
 *
 *   1. LES COPIES TÉMOINS : des décisions fixées, notées par le chemin de l'examen (le
 *      rejeu contre l'étalon de la grille), donnent AU CENTIME DE POINT la note que le code
 *      d'avant le lot « mérite durci » donnait (origin/main 9d33486, mesuré avec le même
 *      montage : la référence d'alors, `decisionDeReference`, était la gestion neutre).
 *      Et le bon gestionnaire, lui, donnerait une autre note : l'étalon compte.
 *      CES TÉMOINS SONT CEUX DE L'ÉTALON DES GRILLES VERSION 1 (« gestion-neutre », qui
 *      redécidait sous chacun des trente marchés) : ils le nomment donc, au lieu de suivre
 *      l'étalon de la grille du jour, qui est gelé depuis la version 2. Aucune valeur
 *      attendue n'a bougé : un examen ouvert sous une grille version 1 se renote contre
 *      l'étalon de sa version, et ces notes-là ne doivent jamais dériver.
 *   2. L'ÉTALON EST ÉCRIT DANS LA GRILLE, et la table des grilles publiées le fige : changer
 *      l'étalon d'une grille sans changer sa version fait tomber ce test.
 *   3. LA NOTATION FIGÉE L'ENREGISTRE, avec sa définition ; une notation gardée avant (sans
 *      le champ) se lit contre la gestion neutre.
 */

type Contexte = Parameters<Extract<DecideurDuJoueur, { type: "methode" }>["decider"]>[0];

/** Une partie solo en mémoire, comme le rejeu la lit de la base (le montage de tests/unit/merite.test.ts). */
function partieEnMemoire(niveau: number, entreprise: string, graine = 4242) {
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

/** Les décisions d'une stratégie jouée sous la graine de la partie, gardées comme la base les garde. */
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

const prix = (d: RoundDecisions, k: number): RoundDecisions => ({
  ...d,
  price: d.price * k,
  ...(d.products ? { products: Object.fromEntries(Object.entries(d.products).map(([n, p]) => [n, { ...p, price: p.price * k }])) } : {}),
});
/** Des stratégies qui ne lisent que ce que lit tout décideur : leurs décisions sont les mêmes avant et après le lot. */
const plus8 = (o: LeviersDuNiveau) => (c: Contexte) => prix(aLaMesureDuNiveau(neutralDecisions(c), o), 1.08);
const sousLeCout = (o: LeviersDuNiveau) => (c: Contexte) => {
  const d = aLaMesureDuNiveau(neutralDecisions(c), o);
  return prix(d, (variableCostPerUnit(c.scenario) * 0.9) / d.price);
};

/** La copie notée par le chemin de l'examen : le rejeu contre l'étalon que la grille nomme. */
function noter(grille: GrilleDeNotation, partie: PartieARejouer, ouverts: LeviersDuNiveau, etalon = referenceDeLaGrille(grille).code) {
  const joueur = GRAINES_DU_MERITE.map((g) => rejouer(partie, g));
  const reference = rejeuxDeLEtalon(partie, ouverts, etalon);
  return noterLaCopie(
    grille,
    { sur: joueur[0]!.sur, joueur: joueur.map(marcheRejoue), reference: reference.map(marcheRejoue), situations: null },
    { questions: false },
  );
}

/**
 * Les notes d'avant le lot, ligne par ligne (points rapportés à 100), mesurées sur
 * origin/main 9d33486 avec ce même montage. Grille par défaut, puis « Décision d'abord ».
 */
const AVANT = [
  {
    nom: "NOVA niveau 3, +8 % de prix à chaque tour",
    entreprise: "nova",
    niveau: 3,
    strategie: plus8,
    notes: [
      { note: 100, battre: 27.78, ecart: 16.67, rang: 16.67 },
      { note: 100, battre: 38.89, ecart: 22.22, rang: 11.11 },
    ],
  },
  {
    nom: "hôtel niveau 2, +8 % de prix à chaque tour",
    entreprise: "hotel",
    niveau: 2,
    strategie: plus8,
    notes: [
      // Réancrées après l'élargissement du marché de l'hôtel : seul l'écart à
      // l'étalon bouge, la gestion neutre n'y perd plus. Décision du propriétaire.
      { note: 50.1, battre: 0.93, ecart: 1.92, rang: 8.33 },
      { note: 37.2, battre: 1.3, ecart: 2.56, rang: 5.56 },
    ],
  },
  {
    nom: "conseil niveau 5 (gamme), sous le coût variable",
    entreprise: "conseil",
    niveau: 5,
    strategie: sousLeCout,
    notes: [
      { note: 11.7, battre: 0, ecart: 0, rang: 11.67 },
      { note: 7.8, battre: 0, ecart: 0, rang: 7.78 },
    ],
  },
  {
    nom: "boutique niveau 4, +8 % de prix à chaque tour",
    entreprise: "boutique",
    niveau: 4,
    strategie: plus8,
    notes: [
      { note: 84.2, battre: 25, ecart: 11.96, rang: 8.33 },
      { note: 84.3, battre: 35, ecart: 15.95, rang: 5.56 },
    ],
  },
] as const;

const points = (c: ReturnType<typeof noter>, code: string) => c.lignes.find((l) => l.code === code)!.points;

describe("l'examen note contre la gestion neutre du secteur : les copies témoins d'avant le lot", () => {
  for (const t of AVANT) {
    it(`${t.nom} : la même note qu'avant le lot, ligne par ligne`, () => {
      const { base, ouverts } = partieEnMemoire(t.niveau, t.entreprise);
      const partie = jouer(base, t.strategie(ouverts));
      [GRILLE_BUSINESS_ARENA_2026, GRILLE_DECISION_D_ABORD].forEach((grille, i) => {
        // L'étalon des grilles version 1 : les pondérations des lignes n'ont pas changé
        // depuis, seul l'étalon l'a fait, et c'est contre celui-là que ces notes ont été
        // relevées.
        const c = noter(grille, partie, ouverts, "gestion-neutre");
        const attendu = t.notes[i]!;
        expect(c.note, `${grille.code} : note`).toBeCloseTo(attendu.note, 1);
        expect(points(c, "battre-la-reference"), `${grille.code} : battre`).toBeCloseTo(attendu.battre, 2);
        expect(points(c, "ecart-a-la-reference"), `${grille.code} : écart`).toBeCloseTo(attendu.ecart, 2);
        expect(points(c, "rang"), `${grille.code} : rang`).toBeCloseTo(attendu.rang, 2);
        expect(c.grille.version).toBe(2);
      });
    }, 60_000);
  }

  it("contre un bon gestionnaire, la même copie aurait une autre note : l'étalon compte", () => {
    const { base, ouverts } = partieEnMemoire(3, "nova");
    const partie = jouer(base, plus8(ouverts));
    const neutre = noter(GRILLE_BUSINESS_ARENA_2026, partie, ouverts, "gestion-neutre");
    const bon = noter(GRILLE_BUSINESS_ARENA_2026, partie, ouverts, "bon-gestionnaire");
    expect(neutre.note).toBe(100);
    expect(points(bon, "battre-la-reference")).toBe(0);
    expect(bon.note).toBeLessThan(neutre.note - 20);
  }, 60_000);
});

describe("l'étalon est écrit dans la grille, et la notation figée l'enregistre", () => {
  /**
   * LES GRILLES PUBLIÉES ET LEUR ÉTALON. Une grille ne change pas d'étalon sans changer de
   * version : changer l'un sans l'autre fait tomber ce test.
   */
  const PUBLIEES: Record<string, "gestion-neutre" | "gestion-neutre-gelee" | "bon-gestionnaire"> = {
    "business-arena-2026@2": "gestion-neutre-gelee",
    "decision-d-abord@2": "gestion-neutre-gelee",
  };

  it("chaque grille publiée nomme son étalon, celui de sa version", () => {
    expect(Object.fromEntries(GRILLES.map((g) => [`${g.code}@${g.version}`, g.reference.code]))).toEqual(PUBLIEES);
    for (const g of GRILLES) expect(g.reference).toEqual(REFERENCE_GESTION_NEUTRE_GELEE);
  });

  it("la gestion neutre du secteur se nomme et se définit ; aucun libellé ne dit plus « gestion de référence »", () => {
    for (const r of [REFERENCE_GESTION_NEUTRE, REFERENCE_GESTION_NEUTRE_GELEE]) {
      expect(r.nom).toBe("la gestion neutre du secteur");
      expect(r.definition).toMatch(/^La gestion neutre du secteur part de la gestion que le formulaire propose et la tient à chaque tour/);
    }
    // L'étalon des grilles publiées dit aussi qu'il est gelé comme le candidat.
    expect(REFERENCE_GESTION_NEUTRE_GELEE.definition).toMatch(/elle décide sur le marché joué, et ses décisions sont rejouées telles quelles/);
    for (const g of GRILLES) {
      const textes = [...g.lignes.flatMap((l) => [l.libelle, l.methode]), ...g.justification.map((j) => j.pourquoi)].join("\n");
      expect(textes).not.toMatch(/gestion de référence/);
      expect(g.lignes.find((l) => l.code === "battre-la-reference")!.libelle).toBe("Décisions qui battent la gestion neutre du secteur");
      expect(g.lignes.find((l) => l.code === "ecart-a-la-reference")!.libelle).toBe("Écart moyen à la gestion neutre du secteur");
    }
  });

  it("la copie notée garde l'étalon, avec sa définition ; une notation d'avant se lit contre la gestion neutre", () => {
    const marche = { resultat: 1000, tresorerie: 10, defaillant: false, rang: 1 };
    const c = noterLaCopie(
      GRILLE_BUSINESS_ARENA_2026,
      { sur: 3, joueur: [marche], reference: [{ ...marche, resultat: 500 }], situations: null },
      { questions: false },
    );
    expect(c.grille).toEqual({ code: "business-arena-2026", version: 2, nom: "Business Arena 2026", reference: REFERENCE_GESTION_NEUTRE_GELEE });
    // Une copie de grille ou une notation gardées sans le champ.
    const { reference: _r, ...sansEtalon } = GRILLE_BUSINESS_ARENA_2026;
    void _r;
    expect(referenceDeLaGrille(sansEtalon)).toEqual(REFERENCE_GESTION_NEUTRE);
    const notationDAvant = { grille: { code: "business-arena-2026", version: 1, nom: "Business Arena 2026" } };
    expect(referenceDeLaCopie(notationDAvant)).toEqual(REFERENCE_GESTION_NEUTRE);
  });
});
