import { referentielDeCitation } from "@/config/ateliers/referentiels";
import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { formationOuverteAuxEpisodes } from "@/config/episodes/public-des-episodes";
import { CAS_DE_SYNTHESE, CAS_PAR_CHAPITRE, situationParCode, type Situation } from "@/config/cours/situations";
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
  /** Les chapitres qui prolongent celui-ci (`ensuite` du chapitre), dans son ordre. */
  ensuite: Lien[];
  /** Quelques épisodes du thème, et leur nombre total ; aucun en dessous de bac + 3 (`chapitreOuvertAuxEpisodes`). */
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

/**
 * LES FORMATIONS QU'UN CHAPITRE SERT : celle que suit son parcours (registre.ts, `formation`),
 * et celles dont il cite un bloc. Un cas pratique sert celles des chapitres qu'il reprend.
 */
export function formationsDuChapitre(code: string): string[] {
  const situation = situationParCode(code);
  const servies = new Set<string>();
  for (const c of situation ? situation.reprend : [code]) {
    const chapitre = CHAPITRES.find((x) => x.code === c);
    if (!chapitre) continue;
    const suivie = PARCOURS.find((p) => p.code === chapitre.parcours)?.formation;
    if (suivie) servies.add(suivie);
    for (const bloc of chapitre.blocs) {
      const cite = referentielDeCitation(bloc);
      if (cite) servies.add(cite.code);
    }
  }
  return [...servies];
}

/**
 * LA FIN D'UN CHAPITRE PROPOSE-T-ELLE DES ÉPISODES ? Pas en dessous de bac + 3 (décision du
 * propriétaire, novembre 2026, config/episodes/public-des-episodes.ts) : un chapitre écrit pour
 * les seules formations fermées (le CAP, le lycée, le BTS) n'en propose aucun. Un chapitre qui
 * sert aussi une formation ouverte, ou aucune formation en particulier, garde les siens.
 */
export function chapitreOuvertAuxEpisodes(code: string): boolean {
  const servies = formationsDuChapitre(code);
  return servies.length === 0 || servies.some(formationOuverteAuxEpisodes);
}

export function suitesDuChapitre(code: string): SuitesDuChapitre {
  const situation = situationParCode(code);
  const theme = themeDuChapitre(situation ? situation.reprend[0]! : code);
  const episodes = theme && chapitreOuvertAuxEpisodes(code) ? episodesDuTheme(theme) : [];
  return {
    theme: lienDuTheme(theme),
    // Le cas dédié au chapitre d'abord, puis les cas de synthèse qui le reprennent.
    situations: [...CAS_PAR_CHAPITRE, ...CAS_DE_SYNTHESE].filter((s) => s.reprend.includes(code)).map((s) => lienDuChapitre(s.code)),
    reprend: situation ? situation.reprend.map(lienDuChapitre) : [],
    ensuite: (situation ? [] : (CHAPITRES.find((c) => c.code === code)?.ensuite ?? [])).map(lienDuChapitre),
    episodes: episodes.slice(0, EPISODES_PROPOSES).map(lienDeLEpisode),
    episodesDuTheme: episodes.length,
  };
}

export interface CoursDeLEpisode {
  theme: Lien;
  /** Les chapitres du thème, dans l'ordre où ils s'enchaînent. */
  chapitres: Lien[];
  /** Les cas de synthèse du thème. */
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
    situations: casDeSyntheseDuTheme(theme).map((s) => lienDuChapitre(s.code)),
  };
}

/**
 * Les cas de synthèse d'un thème : ceux dont le premier chapitre repris y est
 * rangé. Les cas dédiés, eux, se proposent à côté de leur chapitre.
 */
export function casDeSyntheseDuTheme(theme: Theme): Situation[] {
  return CAS_DE_SYNTHESE.filter((s) => themeDuChapitre(s.reprend[0]!)?.code === theme.code);
}

/** Les chapitres dont une étape fait vivre la notion (`notions` de l'étape). */
export function chapitresDeLaNotion(notion: string): Lien[] {
  return CHAPITRES.filter((c) => c.etapes.some((e) => e.notions?.includes(notion))).map((c) => ({
    code: c.code,
    titre: c.titre,
  }));
}
