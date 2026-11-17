/**
 * LES RÈGLES DE COMPTAGE DES CONTENUS QUE LE SITE PUBLIE (chantier des compteurs, novembre 2026).
 *
 * Un module LÉGER : il n'importe rien. Le menu du site, composant client, peut le lire sans
 * charger un seul registre. Chaque registre lourd compte ici ce qu'il porte, une fois, au
 * chargement, et les pages lisent ce nombre-là, jamais un `.length` :
 *  · chapitres, laboratoires, cas pratiques : `CHIFFRES_DU_COURS` (config/chiffres-du-cours.ts),
 *    avec les nombres d'un thème et de la tuile d'un diplôme ;
 *  · ateliers : `NOMBRE_D_ATELIERS` (config/ateliers/index.ts) ;
 *  · épisodes manager : `NOMBRE_D_EPISODES` (config/familles-des-episodes.ts, module léger que le
 *    menu lit) ; `EPISODES.length`, le registre, reste interne, et un test les tient égaux ;
 *  · démonstrations : `compterLesDemos`, sur le réglage de la Découverte (/admin/offres), que la
 *    page lit en base comme la règle d'accès ; jamais la constante du code.
 *
 * LES RÈGLES. Le site n'a pas de statut brouillon ni archivé (décision du propriétaire, novembre
 * 2026) : le seul retrait se fait par formation (config/formations-proposees.ts).
 *  · Un chapitre compte quand il est proposé : son parcours n'a pas de formation, ou sa formation
 *    (son diplôme, pour une option) n'est pas retirée. Un chapitre d'une formation retirée ne
 *    compte pas, mais reste au registre, et une licence Campus l'ouvre toujours.
 *  · Un cas pratique compte quand chaque chapitre qu'il reprend est proposé.
 *  · Un contenu compte une fois, par son code : un chapitre servi par cinq diplômes, un cas lié à
 *    plusieurs notions ou à plusieurs chapitres, un atelier de sept séances, un épisode de six
 *    décisions et trois niveaux comptent chacun pour un.
 *  · Un contenu sous licence compte au catalogue : ce qu'il ouvre à qui se décide ailleurs
 *    (services/cours.service.ts, `coursOuvert`).
 * Gardes : tests/architecture/chiffres-du-site.test.ts (aucun comptage hors de ces sources) et
 * tests/architecture/compteurs-des-contenus.test.ts (les règles, sur des registres de test).
 */

/** Ce qu'il faut d'un registre du cours pour le compter. */
export interface RegistreDuCours {
  formations: readonly { code: string; optionDe?: string }[];
  /** Les formations retirées du site public (config/formations.ts). */
  formationsRetirees: ReadonlySet<string>;
  parcours: readonly { code: string; formation?: string }[];
  chapitres: readonly { code: string; parcours: string; etapes: readonly { type: string }[] }[];
  situations: readonly { code: string; reprend: readonly string[] }[];
}

/** Le nombre de contenus distincts d'une liste : un code compte une fois. */
export const compterParCode = (contenus: readonly { code: string }[]): number => new Set(contenus.map((c) => c.code)).size;

/** Le chapitre (son parcours) est-il proposé dans ce registre ? La règle de config/formations-proposees.ts. */
export function regleDuCours(r: RegistreDuCours) {
  const formations = new Map(r.formations.map((f) => [f.code, f]));
  const parcours = new Map(r.parcours.map((p) => [p.code, p]));
  const formationProposee = (code: string) => !r.formationsRetirees.has(formations.get(code)?.optionDe ?? code);
  const chapitrePropose = (c: { parcours: string }) => {
    const formation = parcours.get(c.parcours)?.formation;
    return !formation || formationProposee(formation);
  };
  const chapitres = new Map(r.chapitres.map((c) => [c.code, c]));
  const situationProposee = (s: { reprend: readonly string[] }) =>
    s.reprend.every((code) => {
      const c = chapitres.get(code);
      return c ? chapitrePropose(c) : false;
    });
  return { chapitrePropose, situationProposee };
}

/** Les chapitres, les laboratoires et les cas pratiques que le site publie. */
export function compterLeCours(r: RegistreDuCours): { chapitres: number; avecLaboratoire: number; casPratiques: number } {
  const { chapitrePropose, situationProposee } = regleDuCours(r);
  const proposes = r.chapitres.filter(chapitrePropose);
  return {
    chapitres: compterParCode(proposes),
    /** Les chapitres qui ont leur laboratoire (une étape `simulation`, leviers et curseurs). */
    avecLaboratoire: compterParCode(proposes.filter((c) => c.etapes.some((e) => e.type === "simulation"))),
    casPratiques: compterParCode(r.situations.filter(situationProposee)),
  };
}

/** Les ateliers : une fiche compte pour une, quel que soit son nombre de séances. */
export const compterLesAteliers = (ateliers: readonly { code: string }[]): number => compterParCode(ateliers);

/** Les épisodes, lus dans les familles qui les rangent : un code compte une fois, quelles que soient ses décisions. */
export const compterLesEpisodes = (familles: readonly { episodes: readonly string[] }[]): number =>
  new Set(familles.flatMap((f) => f.episodes)).size;

/** Les démonstrations de la Découverte, telles que /admin/offres les règle. */
export const compterLesDemos = (reglage: { demos: readonly string[] }): number => new Set(reglage.demos).size;

/** Tout le catalogue, d'un coup : ce que les tests comparent d'un registre à l'autre. */
export function compterLeCatalogue(r: {
  cours: RegistreDuCours;
  ateliers: readonly { code: string }[];
  familles: readonly { episodes: readonly string[] }[];
  decouverte: { demos: readonly string[] };
}) {
  return {
    ...compterLeCours(r.cours),
    ateliers: compterLesAteliers(r.ateliers),
    episodes: compterLesEpisodes(r.familles),
    demos: compterLesDemos(r.decouverte),
  };
}
