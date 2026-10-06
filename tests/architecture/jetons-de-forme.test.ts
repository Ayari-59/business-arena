import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * TROIS ESPACEMENTS, QUATRE ARRONDIS, L'ÉCHELLE DE TAILLES.
 *
 * L'audit esthétique avait compté, dans les sources, dix espacements de
 * lettres écrits à la main (de 0,1 à 0,3 em), sept arrondis différents et
 * vingt-cinq tailles de texte arbitraires (`text-[13px]`, `text-[0.75rem]`…).
 * Aucun n'avait été décidé : chacun recopiait le voisin, à un cheveu près, et
 * la page finissait par ne plus avoir de main.
 *
 * CE QUI EST DÉCIDÉ, UNE FOIS, dans `globals.css` :
 * · trois espacements nommés — `tracking-etiquette` (l'intitulé d'un champ,
 *   d'une tuile), `tracking-surtitre` (le surtitre d'une section),
 *   `tracking-annonce` (l'annonce d'une page, une seule par écran) ;
 * · quatre arrondis — `rounded-md` (pastille carrée, petit bouton),
 *   `rounded-lg` (champ, bouton), `rounded-xl` (carte, bloc), `rounded-full`
 *   (puce, rond) ;
 * · les tailles de l'échelle de Tailwind. Un `clamp()` reste permis : c'est
 *   un titre qui suit la largeur de l'écran, pas une taille de plus.
 *
 * La garde lit les classes partout dans `src`, composants et configuration.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(tsx|ts)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

const SOURCES = fichiers(SRC).map((f) => ({
  nom: f.slice(SRC.length + 1),
  texte: readFileSync(f, "utf8"),
}));

function fautes(motif: RegExp): string[] {
  const trouvees: string[] = [];
  for (const { nom, texte } of SOURCES) {
    texte.split("\n").forEach((ligne, i) => {
      for (const m of ligne.matchAll(motif)) trouvees.push(`${nom}:${i + 1} ${m[0]}`);
    });
  }
  return trouvees;
}

const COTES = "(?:-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?";

describe("les jetons de forme", () => {
  it("aucun espacement de lettres écrit à la main", () => {
    const trouvees = fautes(/tracking-\[[^\]]+\]/g);
    expect(trouvees, trouvees.slice(0, 12).join("\n")).toEqual([]);
  });

  it("aucune taille de texte hors de l'échelle", () => {
    const trouvees = fautes(/text-\[[0-9.]+(?:px|rem|em)\]/g);
    expect(trouvees, trouvees.slice(0, 12).join("\n")).toEqual([]);
  });

  it("aucun arrondi hors des quatre décidés", () => {
    // `rounded` seul (4 px), `-sm` (2 px), `-2xl` et `-3xl` : refusés, sur
    // tous les côtés. Le motif ne prend que des classes, pas le mot anglais
    // dans une phrase : il exige un guillemet, un accent grave ou une espace
    // de part et d'autre, et un `:` devant pour les variantes (`sm:rounded`).
    // Une variable qui s'appelle `rounded` (`const rounded = …`) n'est pas
    // une classe : suivie d'un opérateur, elle est laissée de côté.
    const motif = new RegExp(
      `(?<=["'\`\\s:])rounded${COTES}(?:-(?:sm|2xl|3xl))?(?=["'\`\\s])(?!\\s*[=<>(),;.?])`,
      "g",
    );
    const trouvees = fautes(motif);
    expect(trouvees, trouvees.slice(0, 12).join("\n")).toEqual([]);
  });

  it("les trois espacements sont définis, et une seule fois", () => {
    const globals = readFileSync(join(SRC, "app/globals.css"), "utf8");
    for (const nom of ["etiquette", "surtitre", "annonce"]) {
      expect(globals.match(new RegExp(`--tracking-${nom}:`, "g")), nom).toHaveLength(1);
    }
  });
});
