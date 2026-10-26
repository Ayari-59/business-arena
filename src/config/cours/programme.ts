import { ATELIERS } from "../ateliers";
import { BLOCS_DES_EPISODES } from "../episodes/blocs";
import { FAMILLES } from "../episodes/familles";
import { formationParCode, type Formation } from "../formations";
import {
  blocsDeLEpisode,
  coursDeLaFormation,
  formationsAvecUnePage,
  tableauDeCouverture,
} from "../couverture";
import type { Chapitre } from "./types";
import { CAS_DE_SYNTHESE, type Situation } from "./situations";
import { THEMES, type Theme } from "./themes";

/**
 * LE PROGRAMME COMPILÉ D'UN DIPLÔME : ce que l'arène lui donne à faire, rangé
 * par thème.
 *
 * Le propriétaire voulait des programmes génériques par thème, puis « compiler
 * les notions en fonction du diplôme choisi », pour qu'une notion ne s'écrive
 * qu'une fois et serve tous les diplômes qui la demandent. Le compilateur ne
 * décide rien : il lit ce que les chapitres et les épisodes citent du
 * référentiel du diplôme (config/couverture.ts), et le range sous les thèmes du
 * catalogue. Un chapitre de comptabilité qui cite le BTS CG et le DCG paraît
 * donc dans les deux programmes, au même endroit.
 */
export interface ProgrammeDuDiplome {
  formation: Formation;
  /** Ce que le tableau de couverture compte : les entrées travaillées, le total, et celles hors du champ. */
  couverture: { travaillees: number; total: number; horsDuChamp: number; lu: boolean };
  /** Les ateliers en classe écrits pour le diplôme. */
  ateliers: readonly { code: string; titre: string; annee: string }[];
  /** Les chapitres du diplôme, thème par thème, dans l'ordre du catalogue. */
  themes: readonly { theme: Theme; chapitres: readonly Chapitre[] }[];
  /** Les épisodes qui citent un bloc du diplôme, dans l'ordre des familles. */
  episodes: readonly string[];
  /** Les cas pratiques qui reprennent au moins un chapitre du programme. */
  situations: readonly Situation[];
}

export function programmeDuDiplome(code: string): ProgrammeDuDiplome | null {
  const formation = formationParCode(code);
  if (!formation) return null;
  const { referentiel, lignes } = tableauDeCouverture(code);
  const siens = new Set(coursDeLaFormation(code).flatMap((g) => g.chapitres.map((c) => c.code)));
  const chapitres = coursDeLaFormation(code).flatMap((g) => g.chapitres);
  const themes = THEMES.map((theme) => ({
    theme,
    chapitres: theme.chapitres
      .filter((c) => siens.has(c))
      .map((c) => chapitres.find((x) => x.code === c)!)
      .sort((a, b) => a.palier - b.palier),
  })).filter((t) => t.chapitres.length > 0);
  const avecBloc = new Set(
    Object.keys(BLOCS_DES_EPISODES).filter((e) => blocsDeLEpisode(e, code).length > 0),
  );
  return {
    formation,
    couverture: {
      travaillees: lignes.filter((l) => l.couverture).length,
      total: lignes.length,
      horsDuChamp: lignes.filter((l) => !l.couverture && l.horsDuChamp).length,
      lu: referentiel !== null,
    },
    ateliers: ATELIERS.filter((a) => a.formations.includes(code)).map((a) => ({
      code: a.code,
      titre: a.titre,
      annee: a.annee,
    })),
    themes,
    episodes: FAMILLES.flatMap((f) => f.episodes).filter((e) => avecBloc.has(e)),
    situations: CAS_DE_SYNTHESE.filter((s) => s.reprend.some((c) => siens.has(c))),
  };
}

/**
 * LES DIPLÔMES DU SÉLECTEUR, rangés par niveau : ceux qui ont une page de
 * couverture, puisque le programme compilé y renvoie.
 */
export function diplomesParNiveau(): { niveau: string; formations: Formation[] }[] {
  const niveau = (code: string) =>
    code.startsWith("seconde") || code === "stmg" || code.startsWith("bac-pro") || code.startsWith("cap")
      ? "Lycée et CAP"
      : code.startsWith("bts")
        ? "BTS"
        : code.startsWith("but")
          ? "BUT"
          : "Expertise comptable";
  const groupes = new Map<string, Formation[]>();
  for (const f of formationsAvecUnePage()) {
    const n = niveau(f.code);
    groupes.set(n, [...(groupes.get(n) ?? []), f]);
  }
  return [...groupes].map(([n, formations]) => ({ niveau: n, formations }));
}
