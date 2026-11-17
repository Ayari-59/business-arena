import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LES DÉCISIONS D'UNE ÉQUIPE NE SE LISENT QU'AU PILOTAGE DE SON ENSEIGNANT.
 *
 * Pendant le tour, l'enseignant voit sous chaque équipe ses décisions, son
 * brouillon et ses repères (`config/decisions-au-pilotage`). C'est le seul
 * écran qui le doit : le mur projeté est vu par toute la classe, et l'arène
 * par des élèves d'autres équipes, qui y trouveraient le prix d'un concurrent.
 *
 * La vue de l'enseignant (`getTeacherGameView`) vérifie déjà que la partie lui
 * appartient. Mais le mur lit la MÊME vue : un champ ajouté à ses équipes ne
 * fuit pas tant que la projection choisit ce qu'elle passe au navigateur. Cette
 * garde tient la frontière : seuls le module de lecture, la ligne du tableau,
 * le service qui les sert et la page de pilotage nomment ces décisions. L'e2e
 * `decisions-au-pilotage` le vérifie dans le HTML servi.
 */

const RACINE = process.cwd();
const SRC = join(RACINE, "src");

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((e) => {
    const c = join(dossier, e);
    return statSync(c).isDirectory() ? fichiers(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

/** Ce qui nomme les décisions du pilotage : le champ de la vue, le module et la ligne du tableau. */
const MARQUES = [
  /\bdecisionsAuPilotage\b/,
  /\bDecisionsAuPilotage\b/,
  /\blireLaDecisionDuTour\b/,
  /decisions-au-pilotage/,
  /decisions-de-l-equipe/,
  /\bDecisionsDeLEquipe\b/,
];

/** Les seuls fichiers qui peuvent les nommer. */
const AUTORISES = new Set([
  "src/config/decisions-au-pilotage.ts",
  "src/components/decisions-de-l-equipe.tsx",
  "src/services/game.service.ts",
  "src/app/teacher/games/[gameId]/page.tsx",
  // Le registre des replis nomme le fichier de la ligne, pour déclarer le sol de son « Voir tout ».
  "src/config/surfaces-de-lecture.ts",
]);

/** Le mur de la classe et l'arène des élèves : rien des décisions d'une équipe n'y entre. */
const SURFACES_DE_LA_CLASSE = [
  "src/app/teacher/games/[gameId]/projection/page.tsx",
  "src/components/vue-de-projection.tsx",
  "src/components/revelation-du-marche.tsx",
];

const nomme = (source: string) => MARQUES.some((m) => m.test(source));
const tous = fichiers(SRC).map((f) => relative(RACINE, f).split("\\").join("/"));

describe("les décisions d'une équipe restent au pilotage", () => {
  it("seuls le module, la ligne du tableau, le service et la page de pilotage les nomment", () => {
    const fautifs = tous.filter((f) => !AUTORISES.has(f) && nomme(readFileSync(join(RACINE, f), "utf8")));
    expect(fautifs, "ces fichiers nomment les décisions du pilotage").toEqual([]);
  });

  it("ni le mur projeté ni l'arène des élèves ne les lisent", () => {
    const classe = [...SURFACES_DE_LA_CLASSE, ...tous.filter((f) => f.startsWith("src/app/arena/"))];
    for (const f of classe) {
      expect(nomme(readFileSync(join(RACINE, f), "utf8")), f).toBe(false);
    }
  });

  it("le mur ne passe pas les équipes de la vue telles quelles : il choisit ses champs", () => {
    const mur = readFileSync(join(RACINE, SURFACES_DE_LA_CLASSE[0]!), "utf8");
    // Une équipe étalée (`...t`) ou la liste entière passée au composant
    // emporterait avec elle tout ce que la vue de l'enseignant porte.
    expect(mur).not.toMatch(/=\{view\.teams\}/);
    expect(mur).not.toMatch(/\.\.\.(t|equipe|team)\b/);
  });

  it("la page de pilotage, elle, les montre", () => {
    const pilotage = readFileSync(join(RACINE, "src/app/teacher/games/[gameId]/page.tsx"), "utf8");
    expect(pilotage).toMatch(/<DecisionsDeLEquipe decisions=\{t\.decisionsAuPilotage\}/);
  });
});
