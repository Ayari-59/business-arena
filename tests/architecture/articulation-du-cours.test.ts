import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { briques } from "@/config/articulation";
import { ATELIERS } from "@/config/ateliers";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS, motsDuContenu } from "@/config/cours/situations";
import { NOMBRE_D_EPISODES } from "@/config/episodes/familles";

/**
 * L'ARTICULATION DIT LES QUATRE BRIQUES, AVEC LEURS VRAIS COMPTES.
 *
 * La carte des quatre briques est la réponse à « comment s'enchaînent le cours,
 * l'arène et les épisodes ». Elle ne doit ni perdre une brique, ni annoncer un
 * nombre que le registre ne porte plus, ni n'exister que sur une page.
 */
const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

describe("l'articulation du cours", () => {
  it("quatre briques, dans l'ordre de l'enchaînement, avec les comptes des registres", () => {
    const b = briques();
    expect(b.map((x) => x.code)).toEqual(["cours", "situations", "arene", "episodes"]);
    expect(b[0]!.compte).toBe(`${CHAPITRES.length} chapitres`);
    expect(b[1]!.compte).toBe(`${SITUATIONS.length} mises en situation`);
    expect(b[2]!.compte).toBe(`${ATELIERS.length} ateliers prêts à animer`);
    expect(b[3]!.compte).toBe(`${NOMBRE_D_EPISODES} épisodes`);
    for (const x of b) expect(x.texte, x.code).not.toMatch(/[\wÀ-ÿ] [—–] [\wÀ-ÿ]/);
  });

  it("la page du cours et l'espace enseignant la montrent", () => {
    expect(lire("src/app/cours/page.tsx")).toContain("<ArticulationDuCours");
    expect(lire("src/app/teacher/cours/page.tsx")).toContain("<ArticulationDuCours");
  });

  it("une mise en situation ne se dit pas chapitre", () => {
    const s = SITUATIONS[0]!;
    expect(motsDuContenu(s.code).terminer).toBe("Terminer la mise en situation");
    expect(motsDuContenu(CHAPITRES[0]!.code).terminer).toBe("Terminer le chapitre");
    expect(lire("src/components/cours/chapitre-guide.tsx")).not.toMatch(/"Terminer le chapitre"|>Chapitre terminé</);
    expect(lire("src/app/cours/[chapitre]/page.tsx")).not.toContain("Ce chapitre est réservé");
  });
});
