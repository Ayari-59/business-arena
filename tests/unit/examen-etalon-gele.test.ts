import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { presetByLevel, type LeviersDuNiveau } from "@/config/difficulty";
import type { BotProfile } from "@/engine/bots";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { commeEnBase, rejouer, type PartieARejouer } from "@/pedagogy/merite/rejeu";
import { decisionDeLaGestionNeutre, rejeuxDeLEtalon } from "@/pedagogy/merite/etalons";
import { GRAINES_DU_MERITE, marcheRejoue } from "@/pedagogy/merite/verdict";
import { GRILLE_BUSINESS_ARENA_2026, noterLaCopie, referenceDeLaGrille } from "@/config/examen/grille";

/**
 * L'ÉTALON DE L'EXAMEN EST JUGÉ À ARMES ÉGALES AVEC LE CANDIDAT.
 *
 * Le candidat décide sur le marché qu'il joue, et ses décisions sont rejouées TELLES
 * QUELLES sous les trente marchés possibles. L'étalon doit en faire autant : s'il
 * redécide tour par tour sous chacun des trente marchés, il se réadapte là où le
 * candidat ne le peut pas, et l'élève est comparé à une cible mobile. C'est le principe
 * que le dépôt énonce déjà pour l'autre étalon (`partieDeLaReference`) : « chacun a
 * décidé sur le marché joué, aucun ne se réadapte aux autres. »
 *
 * Deux gardes, et elles se mesurent sur la copie la plus parlante qui soit : UN CANDIDAT
 * QUI JOUE EXACTEMENT LA GESTION NEUTRE, donc une copie identique à l'étalon.
 *
 *   1. Il ne bat l'étalon sur AUCUN marché, et son écart moyen est nul (la moitié des
 *      points de la ligne d'écart). Tant que l'étalon se réadapte, il le bat sur une part
 *      des marchés qui dépend du secteur, et cette part fait la note.
 *   2. Sa note ne dépend presque pas de la graine de sa partie : deux candidats aux mêmes
 *      décisions, sur deux marchés joués différents, sont notés à moins de dix points
 *      l'un de l'autre. Dix points sur cent, c'est la tolérance admise entre deux
 *      correcteurs d'une même copie (deux points sur vingt) ; en deçà, l'écart résiduel
 *      ne se distingue plus de ce qu'un jury accepte déjà de ses propres correcteurs.
 */

/** Une partie solo en mémoire, comme le rejeu la lit de la base. */
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

/** La copie d'un candidat qui tient la gestion neutre : décidée sur le marché joué, puis gelée. */
function copieDeLaGestionNeutre(niveau: number, entreprise: string, graine: number) {
  const { base, ouverts } = partieEnMemoire(niveau, entreprise, graine);
  const prises: RoundDecisions[] = [];
  rejouer(base, base.graine, {
    type: "methode",
    decider: (c) => {
      const d = decisionDeLaGestionNeutre(c, ouverts);
      prises.push(commeEnBase(d));
      return d;
    },
  });
  const partie: PartieARejouer = {
    ...base,
    decisions: prises,
    reconduits: prises.map(() => false),
    pedagogie: prises.map(() => ({})),
  };
  return { partie, ouverts };
}

/** La copie notée par le chemin de l'examen : le rejeu contre l'étalon que la grille nomme. */
function noter(partie: PartieARejouer, ouverts: LeviersDuNiveau) {
  const grille = GRILLE_BUSINESS_ARENA_2026;
  const joueur = GRAINES_DU_MERITE.map((g) => rejouer(partie, g));
  const reference = rejeuxDeLEtalon(partie, ouverts, referenceDeLaGrille(grille).code);
  return noterLaCopie(
    grille,
    { sur: joueur[0]!.sur, joueur: joueur.map(marcheRejoue), reference: reference.map(marcheRejoue), situations: null },
    { questions: false },
  );
}

const ligne = (c: ReturnType<typeof noter>, code: string) => c.lignes.find((l) => l.code === code)!;

describe("l'examen juge le candidat et son étalon à armes égales", () => {
  const CELLULES = [
    { entreprise: "conseil", niveau: 4 },
    { entreprise: "transport", niveau: 4 },
    { entreprise: "hotel", niveau: 2 },
  ] as const;

  for (const cas of CELLULES) {
    it(`${cas.entreprise} niveau ${cas.niveau} : une copie identique à l'étalon ne le bat sur aucun marché`, () => {
      const { partie, ouverts } = copieDeLaGestionNeutre(cas.niveau, cas.entreprise, 4242);
      const c = noter(partie, ouverts);
      expect(ligne(c, "battre-la-reference").part, "part des marchés battus").toBe(0);
      expect(ligne(c, "ecart-a-la-reference").part, "écart moyen nul : la moitié des points").toBeCloseTo(0.5, 6);
    }, 120_000);
  }

  it("la note d'une même copie ne dépend pas du marché qu'elle a joué", () => {
    const notes = [101, 202].map((g) => {
      const { partie, ouverts } = copieDeLaGestionNeutre(4, "ecommerce", g);
      return noter(partie, ouverts).note;
    });
    expect(Math.abs(notes[0]! - notes[1]!), `notes ${notes.join(" et ")}`).toBeLessThanOrEqual(10);
  }, 120_000);
});
