import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { THEMES, episodesDuTheme, themeDeLEpisode, themeDuChapitre } from "@/config/cours/themes";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { FAMILLES } from "@/config/episodes/familles";
import {
  EPISODES_PROPOSES,
  chapitresDeLaNotion,
  coursDeLEpisode,
  situationsDuTheme,
  suitesDuChapitre,
} from "@/pedagogy/cours/suites";

/**
 * LES LIENS DANS LES DEUX SENS (décision du propriétaire, octobre 2026).
 *
 * Chaque brique mène aux autres : un chapitre aux mises en situation qui le
 * reprennent, une mise en situation aux chapitres qu'elle reprend, le bilan
 * d'un épisode au cours de son thème, une fiche notion aux chapitres qui la
 * font vivre. Les liens se lisent dans les registres ; ces gardes vérifient
 * qu'aucun ne se perd en route, et que chaque page les reçoit.
 */
const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
const codes = (liens: readonly { code: string }[]) => liens.map((l) => l.code);

describe("la fin d'un chapitre", () => {
  it("nomme chaque mise en situation qui le reprend, et aucune autre", () => {
    for (const c of CHAPITRES) {
      const attendues = SITUATIONS.filter((s) => s.reprend.includes(c.code)).map((s) => s.code);
      expect(codes(suitesDuChapitre(c.code).situations), c.code).toEqual(attendues);
    }
    // Chaque mise en situation se trouve à la fin d'au moins un chapitre.
    const proposees = new Set(CHAPITRES.flatMap((c) => codes(suitesDuChapitre(c.code).situations)));
    for (const s of SITUATIONS) expect(proposees.has(s.code), s.code).toBe(true);
  });

  it("propose quelques épisodes de son thème, et dit combien le thème en compte", () => {
    for (const c of CHAPITRES) {
      const s = suitesDuChapitre(c.code);
      const theme = themeDuChapitre(c.code)!;
      expect(s.theme?.code, c.code).toBe(theme.code);
      expect(s.episodesDuTheme, c.code).toBe(episodesDuTheme(theme).length);
      expect(s.episodes.length, c.code).toBe(Math.min(EPISODES_PROPOSES, s.episodesDuTheme));
      for (const e of s.episodes) expect(themeDeLEpisode(e.code)?.code, e.code).toBe(theme.code);
      expect(s.reprend, c.code).toEqual([]);
    }
  });

  it("une mise en situation rappelle les chapitres qu'elle reprend, dans leur ordre", () => {
    for (const sit of SITUATIONS) {
      const s = suitesDuChapitre(sit.code);
      expect(codes(s.reprend), sit.code).toEqual([...sit.reprend]);
      expect(s.theme?.code, sit.code).toBe(themeDuChapitre(sit.reprend[0]!)!.code);
    }
  });

  it("chaque lien porte un vrai titre, jamais le code à sa place", () => {
    const tous = [...CHAPITRES, ...SITUATIONS].flatMap((c) => {
      const s = suitesDuChapitre(c.code);
      return [...s.situations, ...s.reprend, ...s.episodes];
    });
    expect(tous.length).toBeGreaterThan(0);
    for (const l of tous) expect(l.titre, l.code).not.toBe(l.code);
  });
});

describe("le bilan d'un épisode", () => {
  it("mène aux chapitres et aux mises en situation de son thème, ou à rien si le thème n'a pas de chapitre", () => {
    for (const code of FAMILLES.flatMap((f) => f.episodes)) {
      const theme = themeDeLEpisode(code)!;
      const cours = coursDeLEpisode(code);
      if (theme.chapitres.length === 0) {
        expect(cours, code).toBeNull();
        continue;
      }
      expect(cours?.theme.code, code).toBe(theme.code);
      expect(codes(cours!.chapitres), code).toEqual([...theme.chapitres]);
      expect(codes(cours!.situations), code).toEqual(situationsDuTheme(theme).map((s) => s.code));
      for (const l of [...cours!.chapitres, ...cours!.situations]) expect(l.titre, l.code).not.toBe(l.code);
    }
  });

  it("chaque mise en situation est proposée par le bilan d'au moins un épisode, sauf si son thème n'en a pas", () => {
    for (const s of SITUATIONS) {
      const theme = THEMES.find((t) => t.code === themeDuChapitre(s.reprend[0]!)!.code)!;
      if (episodesDuTheme(theme).length === 0) continue;
      const proposee = episodesDuTheme(theme).some((e) => codes(coursDeLEpisode(e)?.situations ?? []).includes(s.code));
      expect(proposee, s.code).toBe(true);
    }
  });
});

describe("la fiche d'une notion", () => {
  it("nomme exactement les chapitres dont une étape la fait vivre", () => {
    const citees = new Set(CHAPITRES.flatMap((c) => c.etapes.flatMap((e) => e.notions ?? [])));
    for (const n of CONCEPTS) {
      const attendus = CHAPITRES.filter((c) => c.etapes.some((e) => e.notions?.includes(n.code))).map((c) => c.code);
      expect(codes(chapitresDeLaNotion(n.code)), n.code).toEqual(attendus);
    }
    // Une notion citée par une étape existe dans le registre : sinon le lien du cours vers la fiche mène nulle part.
    const connues = new Set(CONCEPTS.map((c) => c.code));
    for (const code of citees) expect(connues.has(code), code).toBe(true);
  });
});

describe("chaque page reçoit ses liens", () => {
  it("la page d'un chapitre, celle d'un épisode, la page des notions et le catalogue", () => {
    expect(lire("src/app/cours/[chapitre]/page.tsx")).toMatch(/suites=\{suitesDuChapitre\(chapitre\.code\)\}/);
    expect(lire("src/components/cours/chapitre-guide.tsx")).toMatch(/<EtEnsuite suites=\{suites\}/);
    expect(lire("src/app/entreprises/episode/[code]/page.tsx")).toMatch(/cours=\{coursDeLEpisode\(code\)\}/);
    expect(lire("src/components/episode/episode-joue.tsx")).toMatch(/cours=\{cours\}/);
    expect(lire("src/components/episode/bilan-de-l-episode.tsx")).toMatch(/<LeCoursDuTheme cours=\{cours\}/);
    expect(lire("src/app/notions/page.tsx")).toMatch(/<DansLeCours chapitres=\{chapitresDeLaNotion\(c\.code\)\}/);
    // « et 1 autres » se lisait en production : la fin d'une liste raccourcie s'accorde.
    expect(lire("src/app/notions/page.tsx")).not.toMatch(/\} autres`/);
    // `/cours#theme-…` ouvre le tiroir du thème.
    expect(lire("src/app/cours/page.tsx")).toContain("<OuvreLeTiroirVise />");
  });
});
