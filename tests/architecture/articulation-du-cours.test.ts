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
    expect(b[1]!.compte).toBe(`${SITUATIONS.length} cas pratiques`);
    expect(b[2]!.compte).toBe(`${ATELIERS.length} ateliers prêts à animer`);
    expect(b[3]!.compte).toBe(`${NOMBRE_D_EPISODES} épisodes`);
    for (const x of b) expect(x.texte, x.code).not.toMatch(/[\wÀ-ÿ] [—–] [\wÀ-ÿ]/);
  });

  it("la page du cours et l'espace enseignant la montrent", () => {
    expect(lire("src/app/cours/page.tsx")).toContain("<ArticulationDuCours");
    expect(lire("src/app/teacher/cours/page.tsx")).toContain("<ArticulationDuCours");
  });

  it("un cas pratique ne se dit pas chapitre", () => {
    const s = SITUATIONS[0]!;
    expect(motsDuContenu(s.code).terminer).toBe("Terminer le cas pratique");
    expect(motsDuContenu(CHAPITRES[0]!.code).terminer).toBe("Terminer le chapitre");
    expect(lire("src/components/cours/chapitre-guide.tsx")).not.toMatch(/"Terminer le chapitre"|>Chapitre terminé</);
    expect(lire("src/app/cours/[chapitre]/page.tsx")).not.toContain("Ce chapitre est réservé");
    // Décision du propriétaire (octobre 2026) : on dit « cas pratique », plus « mise en situation ».
    for (const f of [
      "src/app/cours/page.tsx",
      "src/app/teacher/cours/page.tsx",
      "src/config/articulation.ts",
      "src/components/articulation-du-cours.tsx",
      "src/config/cours/situations/index.ts",
      "src/components/cours/chapitre-guide.tsx",
      "src/components/episode/bilan-de-l-episode.tsx",
    ])
      // Aussi le pluriel composé, « mise${n > 1 ? "s" : ""} en situation », passé en production (#305).
      expect(lire(f), f).not.toMatch(/mises? en situation|mise\$\{/i);
  });

  it("le rappel plié de l'énoncé accompagne chaque étape notée", () => {
    // Demande du propriétaire (octobre 2026) : relire la demande et ses chiffres au moment des calculs.
    const guide = lire("src/components/cours/chapitre-guide.tsx");
    expect(guide).toContain('{etape.type !== "lecture" && <RappelDeLEnonce enonce={chapitre.etapes[0]!} />}');
    expect(guide).toMatch(/<details[^>]*data-rappel-enonce=""/);
  });
});
