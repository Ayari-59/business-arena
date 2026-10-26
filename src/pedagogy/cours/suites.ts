import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS, situationParCode, type Situation } from "@/config/cours/situations";
import { episodesDuTheme, themeDeLEpisode, themeDuChapitre, type Theme } from "@/config/cours/themes";
import { episodeParCode } from "@/pedagogy/episodes/registre";

/**
 * LES PASSAGES ENTRE LE COURS, LES CAS PRATIQUES ET LES ÉPISODES.
 *
 * Demande du propriétaire (octobre 2026) : des liens dans les deux sens. La
 * page du cours expliquait l'enchaînement, mais chaque brique restait une
 * impasse : un chapitre fini ne disait pas quel cas pratique reprenait
 * ses calculs, un cas pratique ne rappelait pas les chapitres où ils
 * s'apprennent, et le bilan d'un épisode ne menait jamais au cours.
 *
 * Tout se lit dans les registres : `reprend` pour les cas pratiques, le
 * thème pour les épisodes. Aucun lien ne s'écrit à la main, si bien qu'une
 * cas pratique de plus apparaît seul à la fin des chapitres qu'il
 * reprend. Les objets rendus sont courts et sérialisables : ils passent du
 * serveur aux composants du navigateur sans emporter le contenu des chapitres.
 */
export interface Lien {
  code: string;
  titre: string;
}

export interface SuitesDuChapitre {
  /** Le thème du chapitre ; pour un cas pratique, celui du premier chapitre repris. */
  theme: Lien | null;
  /** Les cas pratiques qui reprennent les calculs de ce chapitre. */
  situations: Lien[];
  /** Pour un cas pratique : les chapitres dont il reprend les calculs. */
  reprend: Lien[];
  /** Quelques épisodes du thème, et leur nombre total. */
  episodes: Lien[];
  episodesDuTheme: number;
}

/**
 * Combien d'épisodes la fin d'un chapitre propose. Un thème en compte des
 * dizaines (les ressources humaines) : la fin d'un chapitre en montre trois,
 * comme les recommandations du bilan d'un épisode, et renvoie au thème pour
 * les autres.
 */
export const EPISODES_PROPOSES = 3;

const lienDuChapitre = (code: string): Lien => ({
  code,
  titre: CHAPITRES.find((c) => c.code === code)?.titre ?? situationParCode(code)?.titre ?? code,
});
const lienDuTheme = (t: Theme | undefined): Lien | null => (t ? { code: t.code, titre: t.titre } : null);
const lienDeLEpisode = (code: string): Lien => ({ code, titre: episodeParCode(code)?.titre ?? code });

export function suitesDuChapitre(code: string): SuitesDuChapitre {
  const situation = situationParCode(code);
  const theme = themeDuChapitre(situation ? situation.reprend[0]! : code);
  const episodes = theme ? episodesDuTheme(theme) : [];
  return {
    theme: lienDuTheme(theme),
    situations: SITUATIONS.filter((s) => s.reprend.includes(code)).map((s) => lienDuChapitre(s.code)),
    reprend: situation ? situation.reprend.map(lienDuChapitre) : [],
    episodes: episodes.slice(0, EPISODES_PROPOSES).map(lienDeLEpisode),
    episodesDuTheme: episodes.length,
  };
}

export interface CoursDeLEpisode {
  theme: Lien;
  /** Les chapitres du thème, dans l'ordre où ils s'enchaînent. */
  chapitres: Lien[];
  /** Les cas pratiques du thème. */
  situations: Lien[];
}

/**
 * Le cours qui donne les calculs d'un épisode : les chapitres et les mises en
 * situation de son thème. Rien pour un thème qui n'a pas encore de chapitre
 * (l'organisation, la stratégie) : le bilan ne promet pas un cours absent.
 */
export function coursDeLEpisode(code: string): CoursDeLEpisode | null {
  const theme = themeDeLEpisode(code);
  if (!theme || theme.chapitres.length === 0) return null;
  return {
    theme: { code: theme.code, titre: theme.titre },
    chapitres: theme.chapitres.map(lienDuChapitre),
    situations: situationsDuTheme(theme).map((s) => lienDuChapitre(s.code)),
  };
}

/** Les cas pratiques d'un thème : ceux dont le premier chapitre repris y est rangé. */
export function situationsDuTheme(theme: Theme): Situation[] {
  return SITUATIONS.filter((s) => themeDuChapitre(s.reprend[0]!)?.code === theme.code);
}

/** Les chapitres dont une étape fait vivre la notion (`notions` de l'étape). */
export function chapitresDeLaNotion(notion: string): Lien[] {
  return CHAPITRES.filter((c) => c.etapes.some((e) => e.notions?.includes(notion))).map((c) => ({
    code: c.code,
    titre: c.titre,
  }));
}
