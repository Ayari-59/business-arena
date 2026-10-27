import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { anneeJouee, GRAINE_DU_COURS } from "../../src/config/cours/cas";
import { decisionsDuCours, JOUEUR, LEVIERS_DE_L_ELEVE, NIVEAU_DE_L_ELEVE, scenarioDuCours } from "../../src/config/cours/arene-du-cours";
import { NIVEAU_SANS_LICENCE } from "../../src/config/cours/jouez";
import { soldByProduct } from "../../src/engine/bots";
import { runGame, soldUnits, type DecisionProviderContext } from "../../src/engine/simulation/runGame";
import type { CompanyState, RoundDecisions } from "../../src/engine/types";
import { decisionDeReference } from "../../src/pedagogy/merite/reference";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CORRECTIFS_DES_PARTIES_NOUVELLES } from "../../src/config/scenarios/scenario-joue";
import { scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * L'ARÈNE DU COURS JOUE COMME UNE PARTIE CRÉÉE AUJOURD'HUI (arene-du-cours.ts).
 *
 * L'année du cours et ses rejeux jouaient l'arène d'avant les correctifs des parties
 * nouvelles : cinq concurrents sur huit y faisaient défaillance, et la gestion équilibrée
 * ne voyait pas ses ventes du tour d'avant. Ces gardes tiennent les trois choses : le
 * scénario du cours porte chaque correctif des parties nouvelles, aucune entreprise de
 * l'année ne fait défaillance, et aucun fichier du cours ne joue l'arène sans passer par
 * l'aide. L'entreprise de l'élève joue le bon gestionnaire du mérite, chaque tour à partir
 * de la décision qu'elle a jouée au tour d'avant (décision du propriétaire, octobre 2026).
 */

const DOSSIER_DU_COURS = join(__dirname, "../../src/config/cours");

function fichiersDuCours(dossier: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? fichiersDuCours(join(dossier, f.name)) : f.name.endsWith(".ts") ? [join(dossier, f.name)] : [],
  );
}

describe("l'arène du cours", () => {
  it("porte chaque correctif des parties nouvelles", () => {
    const s = scenarioDuCours(scenarioByCode("nova").scenario, 4);
    expect(Object.keys(CORRECTIFS_DES_PARTIES_NOUVELLES).sort()).toEqual(
      ["concurrentsAssainis", "impotSurLExercice", "parcSansDoublon", "propositionALaDemande"],
    );
    expect(s.bots?.concurrentsAssainis).toBe(true);
    expect(s.parcSansDoublon).toBe(true);
    expect(s.impotSurLExercice).toBe(true);
    expect(s.propositionALaDemande).toBe(true);
    expect(s.roundsCount).toBe(4);
  });

  it.each(ENTREPRISES_DU_COURS)("chez %s, aucune entreprise de l'année ne fait défaillance", (code) => {
    const { partie } = anneeJouee(code);
    for (const tour of partie.rounds) {
      for (const [id, r] of Object.entries(tour.results)) expect(r.defaillant ?? false, `${id}`).toBe(false);
    }
  });

  it.each(ENTREPRISES_DU_COURS)("chez %s, l'élève joue le bon gestionnaire, de tour en tour", (code) => {
    const def = scenarioByCode(code);
    const scenario = scenarioDuCours(def.scenario, 4);
    const entreprises: CompanyState[] = [
      def.company(JOUEUR, def.playerTeamName, "bot", "balanced"),
      ...def.bots.slice(0, 2).map((b) => def.company(b.id, b.name, "bot", b.profile)),
    ];
    const fournisseurs = decisionsDuCours(entreprises, scenario);
    const vus: { ctx: DecisionProviderContext; d: RoundDecisions }[] = [];
    const partie = runGame({
      scenario,
      initialCompanies: entreprises,
      seed: GRAINE_DU_COURS,
      providers: {
        ...fournisseurs,
        [JOUEUR]: (ctx) => {
          const d = fournisseurs[JOUEUR]!(ctx);
          vus.push({ ctx, d });
          return d;
        },
      },
    });
    expect(vus).toHaveLength(4);
    for (const [k, { ctx, d }] of vus.entries()) {
      const avant = ctx.lastResult;
      const attendue = decisionDeReference(
        {
          scenario,
          state: ctx.state,
          roundIndex: ctx.roundIndex,
          lastSoldUnits: avant ? soldUnits(avant) : undefined,
          lastSoldByProduct: avant ? soldByProduct(scenario, avant.market.bySegment) : undefined,
          resultatPrecedent: avant,
          decisionPrecedente: k > 0 ? vus[k - 1]!.d : undefined,
        },
        LEVIERS_DE_L_ELEVE,
      );
      // Ni investissement ni recherche : l'élève sans licence n'y a pas accès.
      expect(d.investment?.equipmentBuy ?? [], `${code}, tour ${ctx.roundIndex}`).toEqual([]);
      expect(d, `${code}, tour ${ctx.roundIndex}`).toEqual(attendue);
    }
    // Et c'est bien cette année-là que le cours lit, au centime.
    const resultats = (p: typeof partie) => p.rounds.map((t) => t.results[JOUEUR]!.incomeStatement.netIncome);
    expect(resultats(anneeJouee(code).partie)).toEqual(resultats(partie));
  });

  it("l'élève décide avec les leviers du niveau qu'il joue sans licence", () => {
    expect(NIVEAU_DE_L_ELEVE).toBe(NIVEAU_SANS_LICENCE);
    expect(LEVIERS_DE_L_ELEVE.investment ?? false).toBe(false);
  });

  it("aucun fichier du cours ne joue l'arène sans passer par l'aide", () => {
    for (const f of fichiersDuCours(DOSSIER_DU_COURS)) {
      if (f.endsWith("arene-du-cours.ts")) continue;
      const source = readFileSync(f, "utf8");
      expect(source, f).not.toMatch(/\bbotDecisions\(/);
      expect(source, f).not.toMatch(/\bdecisionDeReference\(/);
      if (/\brunGame\(/.test(source)) expect(source, f).toMatch(/\bscenarioDuCours\(/);
    }
  });
});
