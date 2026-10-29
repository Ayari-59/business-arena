import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";
import { cleDeLaQuestion, dansLOrdreAffiche } from "../../src/pedagogy/cours/ordre-des-options";

/**
 * Ce test parcourt tout le catalogue, dans chaque entreprise : sa durée croît avec chaque
 * chapitre et chaque cas pratique. Les cinq secondes par défaut de vitest ne suffisent plus
 * quand la suite entière tourne en parallèle.
 */
const PARCOURT_TOUT_LE_CATALOGUE = 30_000;

/**
 * LA BONNE RÉPONSE NE SE DEVINE PAS À SA PLACE.
 *
 * Écrites, les options mettaient la bonne réponse en tête dans 71 % des questions.
 * Affichées, elles se mélangent, de façon stable : la même question, dans la même
 * entreprise, garde toujours le même ordre. Cette garde mesure la place de la bonne
 * réponse telle que l'élève la voit, sur tous les chapitres et toutes les situations,
 * dans toutes les entreprises.
 */
const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

describe("l'ordre des options", () => {
  it("un mélange stable, qui garde toutes les options", () => {
    const options = [{ texte: "A" }, { texte: "B" }, { texte: "C" }, { texte: "D" }];
    const une = dansLOrdreAffiche(options, "x/y/nova");
    expect(dansLOrdreAffiche(options, "x/y/nova")).toEqual(une);
    expect(new Set(une.map((o) => o.texte))).toEqual(new Set(["A", "B", "C", "D"]));
    expect(options.map((o) => o.texte)).toEqual(["A", "B", "C", "D"]);
    expect(cleDeLaQuestion("c", "e", "nova")).toBe("c/e/nova");
  });

  it("la bonne réponse, telle qu'on la voit, n'est plus surtout en tête", () => {
    let questions = 0;
    let enTete = 0;
    const places = new Map<number, Set<number>>();
    for (const chapitre of [...CHAPITRES, ...SITUATIONS]) {
      for (const code of ENTREPRISES_DU_COURS) {
        if (chapitre.entreprises && !chapitre.entreprises.codes.includes(code)) continue;
        const cas = casDeLEntreprise(code);
        const ch = chapitreDuCas(chapitre, cas);
        ch.etapes.forEach((e, i) => {
          if (e.type !== "choix" && e.type !== "comparaison") return;
          const ecrites =
            e.type === "choix"
              ? e.options(cas, etatAvant(ch, cas, i))
              : e.options(cas, etatAvant(ch, cas, indexDeLEtape(ch, e.avantLEtape)), etatAvant(ch, cas, i));
          const vues = dansLOrdreAffiche(ecrites, cleDeLaQuestion(ch.code, e.id, cas.code));
          const place = vues.findIndex((o) => o.juste);
          questions++;
          if (place === 0) enTete++;
          places.set(vues.length, (places.get(vues.length) ?? new Set()).add(place));
        });
      }
    }
    expect(questions).toBeGreaterThan(500);
    // Au hasard, un tiers des questions à trois options aurait la bonne réponse en tête.
    expect(enTete / questions, `${enTete} sur ${questions} en tête`).toBeLessThan(0.42);
    // Et pour trois options, la bonne réponse se trouve à chacune des trois places.
    expect([...(places.get(3) ?? [])].sort()).toEqual([0, 1, 2]);
  }, PARCOURT_TOUT_LE_CATALOGUE);

  it("la page et la projection affichent les options mélangées", () => {
    // Le chapitre est servi au navigateur déjà mélangé (audit, P0 : le guide ne porte plus le contenu).
    const servi = lire("src/pedagogy/cours/chapitre-servi.ts");
    expect(servi).toMatch(/dansLOrdreAffiche\(options, cleDeLaQuestion\(chapitre\.code, e\.id, cas\.code\)\)/);
    expect(servi.match(/options: ordre\(/g)?.length, "une question affiche l'ordre écrit").toBe(2);
    expect(lire("src/components/cours/chapitre-guide.tsx")).not.toMatch(/\.options\(/);
    expect(lire("src/pedagogy/cours/projection.ts")).toContain("dansLOrdreAffiche(");
  });
});
