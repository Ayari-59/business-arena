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
const PROSE_TROP_PETITE =
  /<(?:p|li|dd|blockquote)\b[^>]*className="[^"]*(?:text-xs[^"]*leading-(?:relaxed|snug)|leading-(?:relaxed|snug)[^"]*text-xs)[^"]*"/g;

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
  { nom: "arène et composants", racines: ["app/arena", "components"], plafond: 58 },
  { nom: "espace enseignant", racines: ["app/teacher", "app/admin", "app/org"], plafond: 11 },
];

describe("l'échelle typographique", () => {
  for (const zone of ZONES) {
    it(`${zone.nom} : au plus ${zone.plafond} paragraphe(s) aéré(s) en 12 px`, () => {
      const fautes: string[] = [];
      for (const racine of zone.racines) {
        for (const f of fichiers(join(SRC, racine))) {
          const source = readFileSync(f, "utf8");
          for (const m of source.matchAll(PROSE_TROP_PETITE)) {
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

  it("le plafond des pages publiques est à zéro, et il y reste", () => {
    // La zone que j'ai pu regarder à l'écran est la seule où l'on peut exiger
    // zéro : c'est ce qui distingue une garde d'un vœu.
    expect(ZONES.find((z) => z.nom === "pages publiques")!.plafond).toBe(0);
  });
});
