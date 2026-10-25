import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPITRES } from "@/config/cours/registre";
import { ARRONDI_EN_MINUTES, MINUTES_PAR_ETAPE, dureeDuChapitre, dureeEnClair } from "@/config/cours/duree";
import { programmeDuDiplome, diplomesParNiveau } from "@/config/cours/programme";
import { THEMES, episodesDuTheme, themeDeLEpisode, themeDuChapitre } from "@/config/cours/themes";
import { BLOCS_DES_EPISODES } from "@/config/episodes/blocs";
import { FAMILLES } from "@/config/episodes/familles";
import { blocsDeLEpisode, coursDeLaFormation, formationsAvecUnePage } from "@/config/couverture";

/**
 * LE CATALOGUE PAR THÈME NE PERD RIEN ET NE DOUBLE RIEN.
 *
 * La page du cours se range par thème (config/cours/themes.ts) : un chapitre
 * qui n'aurait pas de thème disparaîtrait de la page sans erreur, et un
 * chapitre rangé sous deux thèmes y paraîtrait deux fois, ce que le passage au
 * thème devait justement supprimer. Même règle pour les épisodes et leurs
 * familles. Le programme compilé d'un diplôme ne fait que relire la
 * couverture : il ne doit ni oublier un chapitre qui sert le diplôme, ni en
 * ajouter un qui ne le sert pas.
 */
const PAGE = readFileSync(join(process.cwd(), "src/app/cours/page.tsx"), "utf8");

describe("le catalogue par thème", () => {
  it("chaque chapitre appartient à un thème, et à un seul", () => {
    const ranges = THEMES.flatMap((t) => t.chapitres);
    expect(new Set(ranges).size, "un chapitre rangé sous deux thèmes").toBe(ranges.length);
    for (const code of ranges) {
      expect(CHAPITRES.some((c) => c.code === code), `« ${code} » n'est pas un chapitre`).toBe(true);
    }
    for (const c of CHAPITRES) expect(themeDuChapitre(c.code), `${c.code} sans thème`).toBeDefined();
  });

  it("chaque famille d'épisodes va sous un thème, et chaque épisode en a un", () => {
    const familles = THEMES.flatMap((t) => t.familles);
    expect(new Set(familles).size, "une famille sous deux thèmes").toBe(familles.length);
    for (const f of familles) expect(FAMILLES.some((x) => x.code === f), `famille « ${f} » inconnue`).toBe(true);
    for (const f of FAMILLES) expect(familles, `famille ${f.code} sans thème`).toContain(f.code);
    const episodes = FAMILLES.flatMap((f) => f.episodes);
    for (const e of episodes) expect(themeDeLEpisode(e), `${e} sans thème`).toBeDefined();
    const parTheme = THEMES.flatMap((t) => episodesDuTheme(t));
    expect(parTheme.length, "un épisode compté sous deux thèmes, ou oublié").toBe(episodes.length);
  });

  it("la durée se compte sur les étapes, arrondie aux cinq minutes supérieures", () => {
    for (const c of CHAPITRES) {
      const brut = c.etapes.reduce((n, e) => n + MINUTES_PAR_ETAPE[e.type], 0);
      const d = dureeDuChapitre(c);
      expect(d % ARRONDI_EN_MINUTES, c.code).toBe(0);
      expect(d - brut, c.code).toBeGreaterThanOrEqual(0);
      expect(d - brut, c.code).toBeLessThan(ARRONDI_EN_MINUTES);
    }
    expect(dureeEnClair(25)).toBe("25 min");
    expect(dureeEnClair(95)).toBe("1 h 35");
    expect(dureeEnClair(60)).toBe("1 h");
    // La page lit la durée calculée ; aucune durée ne s'écrit à la main.
    expect(PAGE).toContain("dureeEnClair(dureeDuChapitre(");
  });

  it("le programme compilé d'un diplôme reprend exactement ce qui le sert", () => {
    let avecEpisodes = 0;
    for (const f of formationsAvecUnePage()) {
      const p = programmeDuDiplome(f.code)!;
      const attendus = new Set(coursDeLaFormation(f.code).flatMap((g) => g.chapitres.map((c) => c.code)));
      const compiles = p.themes.flatMap((t) => t.chapitres.map((c) => c.code));
      expect(new Set(compiles), f.code).toEqual(attendus);
      expect(compiles.length, `${f.code} : un chapitre compté deux fois`).toBe(attendus.size);
      for (const t of p.themes) {
        for (const c of t.chapitres) expect(themeDuChapitre(c.code)?.code, `${f.code} / ${c.code}`).toBe(t.theme.code);
      }
      const episodes = new Set(
        Object.keys(BLOCS_DES_EPISODES).filter((e) => blocsDeLEpisode(e, f.code).length > 0),
      );
      expect(new Set(p.episodes), f.code).toEqual(episodes);
      if (p.episodes.length > 0) avecEpisodes++;
      expect(p.couverture.travaillees, f.code).toBeLessThanOrEqual(p.couverture.total);
    }
    expect(avecEpisodes, "aucun programme ne compte d'épisode : la règle ne garde rien").toBeGreaterThan(3);
    expect(programmeDuDiplome("diplome-inconnu")).toBeNull();
  });

  it("le sélecteur propose chaque diplôme qui a une page, une fois", () => {
    const proposes = diplomesParNiveau().flatMap((g) => g.formations.map((f) => f.code));
    expect(new Set(proposes).size).toBe(proposes.length);
    expect(new Set(proposes)).toEqual(new Set(formationsAvecUnePage().map((f) => f.code)));
  });
});
