import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE MONDE DU COURS NE LIT PAS L'ARÈNE.
 *
 * Décision du propriétaire (octobre 2026) : le contenu du cours fait l'objet de sa propre
 * simulation, inspirée des entreprises de l'arène, figée, et qui ne change pas quand le moteur
 * évolue (src/config/cours/monde). Les fichiers du monde du cours, et les chapitres et cas déjà
 * passés sur lui, ne doivent donc atteindre, ni directement ni de proche en proche, ni le moteur
 * (src/engine), ni les scénarios de l'arène (src/config/scenarios), ni l'année du cours jouée par
 * l'arène (cas.ts, arene-du-cours.ts et les rejeux). Un import de type seulement ne charge rien :
 * il est permis.
 */

const SRC = join(process.cwd(), "src");
const COURS = join(SRC, "config", "cours");

/** Les fichiers du cours, hors du monde lui-même, sous un dossier donné. */
function fichiersDe(dossier: string): string[] {
  return readdirSync(join(COURS, dossier), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fichiersDe(join(dossier, e.name)) : e.name.endsWith(".ts") ? [join(dossier, e.name)] : [],
  );
}


/** Ce que le monde du cours ne doit pas atteindre. */
const INTERDITS = [
  join(SRC, "engine"),
  join(SRC, "config", "scenarios"),
  ...["cas.ts", "arene-du-cours.ts", "gestion-de-la-pme.ts", "decision.ts", "trois-annees.ts", "ressources-humaines.ts", "gamme.ts"].map((f) => join(COURS, f)),
];

/** Les imports qui chargent du code (pas les `import type`), résolus en fichiers. */
function importsDe(fichier: string): string[] {
  const source = readFileSync(fichier, "utf8");
  const chemins: string[] = [];
  for (const m of source.matchAll(/^(?:import|export)\s+(?!type\b)[\s\S]*?\sfrom\s+"([^"]+)"/gm)) chemins.push(m[1]!);
  for (const m of source.matchAll(/^import\s+"([^"]+)"/gm)) chemins.push(m[1]!);
  return chemins.flatMap((c) => {
    const base = c.startsWith("@/") ? join(SRC, c.slice(2)) : c.startsWith(".") ? resolve(dirname(fichier), c) : null;
    if (!base) return [];
    const candidat = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), base].find((x) => existsSync(x) && !x.endsWith("/"));
    return candidat ? [candidat] : [];
  });
}

/** Le premier chemin d'imports qui atteint un fichier interdit, ou rien. */
function cheminInterdit(depart: string): string[] | null {
  const vus = new Set<string>();
  const pile: string[][] = [[depart]];
  while (pile.length) {
    const chemin = pile.pop()!;
    const ici = chemin.at(-1)!;
    if (INTERDITS.some((x) => ici === x || ici.startsWith(`${x}/`))) return chemin.map((x) => relative(SRC, x));
    if (vus.has(ici)) continue;
    vus.add(ici);
    for (const suivant of importsDe(ici)) pile.push([...chemin, suivant]);
  }
  return null;
}

const DU_MONDE = readdirSync(join(COURS, "monde")).filter((f) => f.endsWith(".ts")).map((f) => `monde/${f}`);

/**
 * Les chapitres et les cas passés sur le monde du cours : ceux qui importent un fichier du monde,
 * ou un chapitre ou un cas déjà passé sur lui (un cas lit souvent le monde par son chapitre).
 */
const PASSES_SUR_LE_MONDE = (() => {
  // Les recueils (index.ts) rassemblent tous les cas : ils ne sont pas des cas.
  const candidats = [...fichiersDe("chapitres"), ...fichiersDe("situations")].filter((f) => !f.endsWith("index.ts"));
  const passes = new Set<string>(DU_MONDE.map((f) => join(COURS, f)));
  for (let change = true; change; ) {
    change = false;
    for (const f of candidats) {
      const chemin = join(COURS, f);
      if (!passes.has(chemin) && importsDe(chemin).some((i) => passes.has(i))) {
        passes.add(chemin);
        change = true;
      }
    }
  }
  return candidats.filter((f) => passes.has(join(COURS, f)));
})();

describe("le monde du cours ne lit pas l'arène", () => {
  it.each([...DU_MONDE, ...PASSES_SUR_LE_MONDE])("%s n'atteint ni le moteur, ni les scénarios, ni l'année jouée par l'arène", (f) => {
    expect(cheminInterdit(join(COURS, f))).toBeNull();
  });

  it("le pilote est passé sur le monde du cours", () => {
    expect(PASSES_SUR_LE_MONDE).toEqual(expect.arrayContaining(["chapitres/le-prix-selon-la-saison.ts", "situations/par-chapitre/plus-cher-au-plus-fort-de-la-saison.ts"]));
  });

  it("la garde voit un import interdit, même de proche en proche", () => {
    // Le registre des chapitres atteint l'année jouée par l'arène : la garde doit le dire.
    expect(cheminInterdit(join(COURS, "registre.ts"))).not.toBeNull();
  });
});
