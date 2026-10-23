import { describe, expect, it } from "vitest";
import { UNITES_FEMININES, UNITES_MASCULINES, accord, accordPluriel } from "../../src/config/cours/accords";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import type { Cas } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import type { Etape } from "../../src/config/cours/types";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES TEXTES DU COURS S'ACCORDENT AVEC L'UNITÉ DE L'ENTREPRISE.
 *
 * Toute unité de l'arène a un genre connu ; aucun texte du cours n'accorde au masculin une
 * unité féminine (« un enceinte », « nuitées vendus »), dans aucune entreprise.
 */

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier"];

function textesDe(e: Etape, cas: Cas, etat: ReturnType<typeof etatAvant>): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul]), ...e.explication(cas, etat)];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

describe("les accords avec l'unité", () => {
  it("toute unité de l'arène a un genre connu, et un seul", () => {
    for (const s of SCENARIOS) {
      const u = s.vocabulary.unit;
      expect(UNITES_FEMININES.has(u) !== UNITES_MASCULINES.has(u), `${s.code} : « ${u} »`).toBe(true);
    }
  });

  it("accorde au féminin et au pluriel", () => {
    expect(accord({ unite: "nuitée" }, "vendu")).toBe("vendue");
    expect(accordPluriel({ unite: "enceinte" }, "dernier")).toBe("dernières");
    expect(accord({ unite: "couvert" }, "un")).toBe("un");
  });

  it.each(ENTREPRISES_DU_COURS.filter((c) => UNITES_FEMININES.has(casDeLEntreprise(c).unite)))(
    "aucun texte n'accorde au masculin l'unité féminine de %s",
    (code) => {
      const cas = casDeLEntreprise(code);
      const u = cas.unite;
      const fautes = new RegExp(
        // « chaque » est invariable : seul « un » trahit le masculin devant le nom.
        `\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`,
        "i",
      );
      for (const chapitre of CHAPITRES) {
        // Un chapitre réservé à d'autres entreprises (une gamme, un stock) ne se joue pas ici.
        if (chapitre.entreprises && !chapitre.entreprises.codes.includes(code)) continue;
        const ch = chapitreDuCas(chapitre, cas);
        ch.etapes.forEach((e, i) => {
          for (const t of textesDe(e, cas, etatAvant(ch, cas, i))) expect(t, `${chapitre.code} · ${e.id}`).not.toMatch(fautes);
        });
      }
    },
  );
});
