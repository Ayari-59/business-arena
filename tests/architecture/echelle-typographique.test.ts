import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UNE PHRASE NE SE LIT PAS EN 12 PIXELS.
 *
 * Mesuré sur les pages publiques avant d'y toucher : sur 307 paragraphes de
 * PROSE (au moins 70 signes et une ponctuation de phrase, hors intitulés en
 * capitales), 63 étaient composés en 12 px et 212 en 14 ; 27 seulement
 * atteignaient 16. Dans les sources, 826 `text-xs` contre 644 `text-sm` et 20
 * `text-base` : le plancher de 12 px que le dépôt s'impose était devenu la
 * cible, et personne ne l'avait décidé.
 *
 * L'ÉCHELLE, ÉCRITE UNE FOIS :
 * · 16 px (`text-base`) — la prose qu'on vient lire : l'accroche d'une page,
 *   l'explication d'une notion, le texte d'une situation.
 * · 14 px (`text-sm`) — la prose de second plan : l'aide sous un champ, la
 *   description d'une carte dans une liste, une note de bas de bloc.
 * · 12 px (`text-xs`) — ce qui n'est PAS une phrase : un intitulé, une
 *   pastille, une cellule de tableau dense, une légende de figure, une unité.
 *
 * CE QUE LA GARDE SAIT VOIR. Elle ne lit pas le texte, qui vient souvent d'une
 * donnée : elle lit l'INTENTION de l'auteur. Un interligne aéré
 * (`leading-relaxed`, `leading-snug`) sur un paragraphe dit « ceci est de la
 * prose » ; personne n'aère l'interligne d'une étiquette. Un paragraphe aéré
 * en 12 px est donc une phrase composée trop petit.
 *
 * UN CLIQUET, PAS UN MUR. Il en reste, dans l'arène et l'espace enseignant, que
 * je n'ai pas pu regarder à l'écran faute de base de données ici : les monter
 * en aveugle serait remplacer un défaut mesuré par un pari. Les plafonds
 * ci-dessous sont donc l'état du jour, et ils ne peuvent que DESCENDRE. Le jour
 * où une zone tombe à zéro, on fige son plafond à zéro.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  if (!statSync(racine, { throwIfNoEntry: false })) return [];
  if (statSync(racine).isFile()) return racine.endsWith(".tsx") ? [racine] : [];
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    trouves.push(...fichiers(join(racine, entree)));
  }
  return trouves;
}

/** Un paragraphe dont l'auteur a aéré l'interligne, et qu'il a laissé en 12 px. */
const PROSE_TROP_PETITE = new RegExp(
  // La classe peut être écrite entre guillemets ou assemblée dans un gabarit :
  // le corps des lettres du jeu est dans le second cas, et échappait à la
  // garde pour cette seule raison. Un `<span>` compte aussi, quand il est posé
  // en bloc : c'est un paragraphe déguisé.
  '<(?:p|li|dd|blockquote|span)\\b[^>]*className=(?:"[^"]*|\\{`[^`]*)' +
    '(?:text-xs[^"`]*leading-(?:relaxed|snug)|leading-(?:relaxed|snug)[^"`]*text-xs)',
  "g",
);

/**
 * Deux exceptions, et elles ne sont pas des aménagements : un intitulé en
 * CAPITALES n'est pas une phrase, et un `<span>` qui n'est pas en bloc est un
 * morceau de ligne, pas un paragraphe. Les deux gardent 12 px.
 */
function estUnParagraphe(balise: string): boolean {
  if (/\buppercase\b/.test(balise)) return false;
  if (/^<span\b/.test(balise) && !/\bblock\b/.test(balise)) return false;
  return true;
}

const ZONES: { nom: string; racines: string[]; plafond: number }[] = [
  {
    nom: "pages publiques",
    racines: [
      "app/page.tsx", "app/enseignants", "app/entreprises", "app/fonctionnalites",
      "app/guide", "app/notions", "app/parcours", "app/animations", "app/orientation",
      "app/compete", "app/jouer", "app/join", "app/reprendre", "app/mentions-legales",
    ],
    plafond: 0,
  },
  { nom: "arène et composants", racines: ["app/arena", "components"], plafond: 0 },
  { nom: "espace enseignant", racines: ["app/teacher", "app/admin", "app/org"], plafond: 0 },
];

describe("l'échelle typographique", () => {
  for (const zone of ZONES) {
    it(`${zone.nom} : au plus ${zone.plafond} paragraphe(s) aéré(s) en 12 px`, () => {
      const fautes: string[] = [];
      for (const racine of zone.racines) {
        for (const f of fichiers(join(SRC, racine))) {
          const source = readFileSync(f, "utf8");
          for (const m of source.matchAll(PROSE_TROP_PETITE)) {
            if (!estUnParagraphe(m[0])) continue;
            fautes.push(`${f.slice(SRC.length)} : ${m[0].slice(0, 96)}`);
          }
        }
      }
      expect(
        fautes.length,
        `${zone.nom} : ${fautes.length} paragraphes aérés en 12 px (plafond ${zone.plafond}, il ne peut que descendre) :\n${fautes.slice(0, 8).join("\n")}`,
      ).toBeLessThanOrEqual(zone.plafond);
    });
  }

  it("plus aucune zone ne tolère un paragraphe aéré en 12 px", () => {
    // Les trois zones sont à zéro : l'arène et l'espace enseignant ont été
    // regardés à l'écran, sur une base locale montée pour l'occasion, et plus
    // seulement lus dans les sources.
    for (const zone of ZONES) expect(zone.plafond, zone.nom).toBe(0);
  });
});
