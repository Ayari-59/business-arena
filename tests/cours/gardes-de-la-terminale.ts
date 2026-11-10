import { expect } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { PROGRAMME } from "../../src/config/cours/registre";
import { themeDuChapitre } from "../../src/config/cours/themes";
import type { Chapitre } from "../../src/config/cours/types";

export { attendusSgn as attendusT, gardeDuCasSgn as gardeDuCasT, gardeDuCurseurSgn as gardeDuCurseurT, gardeDuLaboratoireSgn as gardeDuLaboratoireT, gardesDeTexteSgn as gardesDeTexteT, justeSgn as justeT, triSgn as triT } from "./gardes-de-la-sgn";

/**
 * LES GARDES DES CHAPITRES DE TERMINALE DU LOT C STMG : la partie commune de management, sciences de
 * gestion et numérique, et les versions lycée de la gestion et finance.
 *
 * Elles reprennent celles de la SGN de première (gardes-de-la-sgn.ts : textes propres, une seule bonne
 * réponse jamais la plus longue, chaque objectif travaillé, curseur à la frontière, laboratoire à
 * solution unique, le chapitre servi par le serveur), et vérifient que le chapitre cite en premier le
 * thème sous lequel il doit s'afficher.
 */

export const THEMES_DE_LA_PARTIE_COMMUNE = [
  "STMG Thème 1 · Les organisations et l'activité de production de biens et de services",
  "STMG Thème 2 · Les organisations et les acteurs",
  "STMG Thème 3 · Les organisations et la société",
] as const;

export const THEMES_DE_GESTION_ET_FINANCE = [
  "STMG Thème 1 · Appliquer les règles comptables",
  "STMG Thème 2 · Analyser la situation de l'entreprise",
  "STMG Thème 3 · Accompagner la prise de décision",
] as const;

// lot E STMG : les thèmes de ressources humaines et communication, sous lesquels les chapitres du lot s'affichent (début)
export const THEMES_DES_RESSOURCES_HUMAINES = [
  "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
  "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
] as const;
// lot E STMG (fin)

type Premier =
  | (typeof THEMES_DE_LA_PARTIE_COMMUNE)[number]
  | (typeof THEMES_DE_GESTION_ET_FINANCE)[number]
  // lot E STMG
  | (typeof THEMES_DES_RESSOURCES_HUMAINES)[number];

/** Le chapitre est au programme de son parcours, au palier 1, cite d'abord son thème, se résout dans le référentiel et a un thème du catalogue. */
export function gardeDuProgrammeT(ch: Chapitre, premier: Premier, ensuite: readonly string[] = []) {
  expect(ch.palier, ch.code).toBe(1);
  expect(PROGRAMME[ch.parcours][ch.palier], ch.code).toContain(ch.titre);
  expect(ch.libre).toBe(false);
  expect(ch.blocs, ch.code).toEqual([premier, ...ensuite]);
  for (const bloc of ch.blocs) {
    const cite = referentielDeCitation(bloc);
    expect(cite, bloc).not.toBeNull();
    expect(blocOfficiel(bloc, cite!.code), bloc).toBeTruthy();
  }
  expect(themeDuChapitre(ch.code), ch.code).toBeDefined();
  expect(ch.etapes.length, `${ch.code} : au plus 20 étapes`).toBeLessThanOrEqual(20);
}
