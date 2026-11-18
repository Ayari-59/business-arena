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

/**
 * LE BROUILLON D'ÉQUIPE (`config/brouillon-d-equipe.ts`) suit la même frontière. Sa SAISIE ne
 * se lit que par le service, pour un membre de l'équipe : la page de l'arène (la feuille de
 * l'élève), l'action « Recharger » et le sondage de l'arène, qui n'en rend que l'heure et
 * l'auteur. Au pilotage, l'enseignant le voit par la ligne de décision ci-dessus. Le mur et
 * les autres pages n'y touchent jamais.
 */
const SERVICE_DU_BROUILLON = /from "@\/services\/brouillon-equipe\.service"/;
const LECTEURS_DU_BROUILLON = new Set([
  "src/app/arena/[gameId]/page.tsx",
  "src/app/arena/[gameId]/actions.ts",
  "src/app/api/games/[gameId]/round-status/route.ts",
]);

describe("le brouillon d'une équipe reste à l'équipe et à son enseignant", () => {
  it("seules la feuille de l'élève, son action et son sondage importent le service du brouillon", () => {
    const fautifs = tous.filter(
      (f) =>
        f !== "src/services/brouillon-equipe.service.ts" &&
        !LECTEURS_DU_BROUILLON.has(f) &&
        SERVICE_DU_BROUILLON.test(readFileSync(join(RACINE, f), "utf8")),
    );
    expect(fautifs, "ces fichiers lisent le brouillon d'une équipe").toEqual([]);
  });

  it("le sondage de l'arène n'en rend que l'heure et l'auteur, jamais la saisie", () => {
    const sondage = readFileSync(join(RACINE, "src/app/api/games/[gameId]/round-status/route.ts"), "utf8");
    expect(sondage).toMatch(/\betatDuBrouillon\(/);
    expect(sondage).not.toMatch(/\blireLeBrouillon\b/);
    expect(sondage).not.toMatch(/\bsaisie\b/);
  });

  it("le service ne lit la saisie que pour l'équipe de l'élève", () => {
    const service = readFileSync(join(RACINE, "src/services/brouillon-equipe.service.ts"), "utf8");
    const lecture = service.slice(service.indexOf("export async function lireLeBrouillon"));
    // L'équipe vient de `findUserTeam` (via `contexte`), jamais d'un paramètre reçu.
    expect(lecture.slice(0, lecture.indexOf("\n}\n"))).toMatch(/eq\(decisions\.teamId, c\.team\.id\)/);
    expect(lecture.slice(0, lecture.indexOf("\n}\n"))).not.toMatch(/teamId:/);
  });

  it("ni le mur projeté ni le pilotage n'importent le brouillon côté élève", () => {
    for (const f of [...SURFACES_DE_LA_CLASSE, "src/app/teacher/games/[gameId]/page.tsx"]) {
      const source = readFileSync(join(RACINE, f), "utf8");
      expect(SERVICE_DU_BROUILLON.test(source), f).toBe(false);
      expect(/components\/brouillon-d-equipe/.test(source), f).toBe(false);
    }
  });
});
