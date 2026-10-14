import { describe, expect, it } from "vitest";
import { TRACES } from "../../src/config/episodes/traces";
import type { CodeNiveau } from "../../src/config/episodes/niveaux";
import { episodeParCode } from "../../src/pedagogy/episodes/registre";
import { SEUIL_D_ANONYMAT, agregerCohorte } from "../../src/pedagogy/profil/cohorte";
import type { PartieEnregistree } from "../../src/pedagogy/profil/types";

/** L'animateur voit le groupe, jamais une personne, et rien sous cinq. */
let n = 0;
function partie(code: string, option = 0, niveau: CodeNiveau = "standard"): PartieEnregistree {
  const ep = episodeParCode(code)!;
  const chemin = [...ep.references[0]!.chemin];
  chemin[0] = option;
  n += 1;
  return {
    id: `p${n}`,
    code,
    versionModele: 1,
    date: new Date(Date.UTC(2026, 9, 1) + n * 60_000).toISOString(),
    premiere: true,
    partie: {
      graine: 5,
      chemin,
      consultes: [],
      jours: 2,
      diagnostic: TRACES[code]!.diagnostic.juste,
      reevaluation: { choix: "maintient", principal: null },
      prevision: ep.prevision.min,
      confiance: 50,
      niveau,
    },
  };
}

const membre = (...codes: string[]) => codes.map((c) => partie(c));

describe("la vue de l'animateur", () => {
  it("ne montre que deux totaux sous cinq membres", () => {
    const vue = agregerCohorte([membre("depot-qui-deborde"), membre("depot-qui-deborde"), []]);
    expect(vue).toMatchObject({ membres: 3, actifs: 2, episodesJoues: 2, detail: false });
    expect(vue.avancement).toBeNull();
    expect(vue.episodes).toEqual([]);
    expect(vue.competences.every((c) => c.moyenne === null)).toBe(true);
  });

  it("à partir de cinq membres : l'avancement, et la répartition des choix des épisodes joués par cinq", () => {
    const membres = [
      [partie("depot-qui-deborde", 0), partie("agence-qui-demarre")],
      [partie("depot-qui-deborde", 1), partie("agence-qui-demarre")],
      [partie("depot-qui-deborde", 1)],
      [partie("depot-qui-deborde", 2)],
      [partie("depot-qui-deborde", 1), partie("depot-qui-deborde", 0)],
      [],
    ];
    const vue = agregerCohorte(membres);
    expect(vue.detail).toBe(true);
    expect(vue.avancement!.find((a) => a.episodes === 0)!.membres).toBe(1);
    expect(vue.avancement!.find((a) => a.episodes === 2)!.membres).toBe(2);
    const depot = vue.episodes.find((e) => e.code === "depot-qui-deborde")!;
    // Une partie rejouée ne compte pas : cinq joueurs, pas six.
    expect(depot.joueurs).toBe(5);
    const d1 = depot.decisions![0]!;
    expect(d1.options.slice(0, 3).map((o) => o.part)).toEqual([0.2, 0.6, 0.2]);
    expect(d1.options.reduce((s, o) => s + o.part, 0)).toBeCloseTo(1);
    // Deux joueurs seulement : la répartition reste cachée.
    expect(vue.episodes.find((e) => e.code === "agence-qui-demarre")!.decisions).toBeNull();
  });

  it("ne donne une moyenne de compétence qu'à partir de cinq scores", () => {
    const deux = ["depot-qui-deborde", "agence-qui-demarre"];
    const cinq = agregerCohorte(Array.from({ length: 5 }, () => membre(...deux)));
    const r2 = cinq.competences.find((c) => c.code === "R2")!;
    expect(r2.membres).toBe(5);
    expect(r2.moyenne).not.toBeNull();
    const quatre = agregerCohorte([
      ...Array.from({ length: 4 }, () => membre(...deux)),
      membre("depot-qui-deborde"),
    ]);
    expect(quatre.competences.find((c) => c.code === "R2")!.moyenne).toBeNull();
    expect(SEUIL_D_ANONYMAT).toBe(5);
  });

  it("ne compte pas les parties en Découverte", () => {
    const vue = agregerCohorte(
      Array.from({ length: 5 }, () => [partie("depot-qui-deborde", 0, "decouverte")]),
    );
    expect(vue.actifs).toBe(0);
    expect(vue.episodes).toEqual([]);
  });
});
