import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LES CORRIGÉS NE PARTENT PAS DANS LE NAVIGATEUR (audit, P1-2).
 *
 * Constaté sur le build : un fichier JavaScript public portait les bonnes
 * réponses et les explications des 209 questions des situations, chargé par
 * /orientation, /cours/[chapitre] et /teacher/courriers/print. Des composants
 * client importaient la configuration complète.
 *
 * Trois gardes :
 * 1. le graphe des imports : aucun module « use client » n'atteint un fichier de
 *    situations ni les ateliers (leurs dossiers portent les corrigés). Le registre
 *    des scénarios lit ses situations par `#situations-des-secteurs`, que le
 *    navigateur résout vers des listes vides ;
 * 2. ce détour lui-même : `package.json` le déclare, et les deux fichiers
 *    exportent les mêmes noms ;
 * 3. le build : si un build postérieur au correctif est présent, le script
 *    `npm run verifier-bundles` y cherche les corrigés.
 *
 * LES CHAPITRES DU COURS, MÊME GARDE (audit, P0). Le guide d'un chapitre, client,
 * importait le registre du cours : les 113 chapitres et les cas pratiques, réservés
 * compris, se lisaient dans un fichier public de 4,5 Mo. La page sert désormais le
 * seul chapitre ouvert, réduit à ses données (pedagogy/cours/chapitre-servi.ts) ;
 * aucun module client n'atteint plus les chapitres, les cas pratiques ni le registre,
 * et le script cherche dans le build des extraits des chapitres réservés.
 */

const RACINE = process.cwd();
const SRC = join(RACINE, "src");
const NAVIGATEUR = "src/config/scenarios/situations-des-secteurs.navigateur.ts";
const SERVEUR = "src/config/scenarios/situations-des-secteurs.ts";

/** Ce qu'aucun code client ne doit atteindre. */
const INTERDITS = [
  /^src\/config\/scenarios\/[^/]+\/situations\.ts$/,
  /^src\/config\/scenarios\/situations-des-secteurs\.ts$/,
  /^src\/config\/ateliers\//,
  // Le contenu du cours : servi par la page après le contrôle de la licence, jamais importé.
  /^src\/config\/cours\/chapitres\//,
  /^src\/config\/cours\/situations\//,
  /^src\/config\/cours\/registre\.ts$/,
  /^src\/pedagogy\/cours\/chapitre-servi\.ts$/,
];

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
}

function resoudre(depuis: string, specificateur: string): string | null {
  // Le navigateur résout l'import conditionnel vers les listes vides.
  if (specificateur === "#situations-des-secteurs") return join(RACINE, NAVIGATEUR);
  let base: string;
  if (specificateur.startsWith("@/")) base = join(SRC, specificateur.slice(2));
  else if (specificateur.startsWith(".")) base = normalize(join(dirname(depuis), specificateur));
  else return null;
  for (const c of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx"), base]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const dependances = new Map<string, string[]>();
function importsDe(fichier: string): string[] {
  const deja = dependances.get(fichier);
  if (deja) return deja;
  const source = readFileSync(fichier, "utf8");
  const out: string[] = [];
  // Les imports de valeurs seulement : un `import type` s'efface à la compilation.
  for (const m of source.matchAll(/(?:^|\n)\s*(?:import|export)\s+(type\s+)?[^;'"]*?\sfrom\s+["']([^"']+)["']/g)) {
    if (m[1]) continue;
    const r = resoudre(fichier, m[2]!);
    if (r) out.push(r);
  }
  for (const m of source.matchAll(/(?:^|\n)\s*import\s+["']([^"']+)["']/g)) {
    const r = resoudre(fichier, m[1]!);
    if (r) out.push(r);
  }
  for (const m of source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
    const r = resoudre(fichier, m[1]!);
    if (r) out.push(r);
  }
  dependances.set(fichier, out);
  return out;
}

const directive = (fichier: string, nom: string) =>
  new RegExp(`^\\s*(?:(?://[^\\n]*\\n|/\\*[\\s\\S]*?\\*/)\\s*)*["']${nom}["']`).test(
    readFileSync(fichier, "utf8").slice(0, 400),
  );

/** Le plus court chemin d'imports d'un module client vers un fichier interdit, ou null. */
function cheminInterdit(client: string): string[] | null {
  const precedent = new Map<string, string | null>([[client, null]]);
  const file = [client];
  while (file.length > 0) {
    const f = file.shift()!;
    const rel = relative(RACINE, f);
    if (f !== client && INTERDITS.some((r) => r.test(rel))) {
      const chemin: string[] = [];
      for (let x: string | null = f; x; x = precedent.get(x) ?? null) chemin.unshift(relative(RACINE, x));
      return chemin;
    }
    // Une action serveur importée par un client n'est qu'une référence : son code reste au serveur.
    if (f !== client && directive(f, "use server")) continue;
    for (const d of importsDe(f)) {
      if (!precedent.has(d)) {
        precedent.set(d, f);
        file.push(d);
      }
    }
  }
  return null;
}

describe("aucun corrigé dans le code du navigateur", () => {
  const clients = fichiers(SRC).filter((f) => directive(f, "use client"));

  it("il y a bien des composants client à examiner", () => {
    expect(clients.length).toBeGreaterThan(50);
  });

  it("aucun module « use client » n'atteint les situations ni les ateliers", () => {
    const fautes = clients.flatMap((c) => {
      const chemin = cheminInterdit(c);
      return chemin ? [chemin.join(" → ")] : [];
    });
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("le registre lit ses situations par l'import conditionnel, jamais en direct", () => {
    const registre = readFileSync(join(RACINE, "src/config/scenarios/registry.ts"), "utf8");
    expect(registre).toContain('from "#situations-des-secteurs"');
    expect(registre).not.toMatch(/from\s+["']\.\/[^"']+\/situations["']/);
  });

  it("package.json envoie le navigateur vers les listes vides, le reste vers les vraies", () => {
    const pkg = JSON.parse(readFileSync(join(RACINE, "package.json"), "utf8")) as {
      imports?: Record<string, Record<string, string>>;
    };
    expect(pkg.imports?.["#situations-des-secteurs"]).toEqual({
      browser: `./${NAVIGATEUR}`,
      default: `./${SERVEUR}`,
    });
  });

  it("les deux fichiers exportent les mêmes noms, et le navigateur n'en porte aucune", () => {
    const noms = (f: string) =>
      [...readFileSync(join(RACINE, f), "utf8").matchAll(/export\s+(?:const\s+(\w+)|\{\s*(\w+)\s*\})/g)]
        .map((m) => m[1] ?? m[2])
        .sort();
    expect(noms(NAVIGATEUR)).toEqual(noms(SERVEUR));
    expect(noms(SERVEUR).length).toBeGreaterThanOrEqual(15);
    const navigateur = readFileSync(join(RACINE, NAVIGATEUR), "utf8");
    expect(navigateur).not.toMatch(/from\s+["']\.\/[^"']+\/situations["']/);
  });
});

/**
 * LE BUILD. `next build` est trop long pour un test unitaire : on fouille le build
 * présent, s'il est postérieur au correctif. Sinon, la vérification le lance :
 * `npm run build && npm run verifier-bundles`.
 */
describe("le build ne porte aucun corrigé", () => {
  const dossierNext = join(RACINE, ".next");
  const buildId = join(dossierNext, "BUILD_ID");
  const recent =
    existsSync(buildId) && statSync(buildId).mtimeMs > statSync(join(RACINE, NAVIGATEUR)).mtimeMs;

  it.skipIf(!recent)("npm run verifier-bundles ne trouve rien dans .next/static", async () => {
    const { fuitesDuBuild } = await import("../../scripts/verifier-bundles");
    const fuites = fuitesDuBuild(dossierNext);
    expect(fuites.map((f) => `${relative(RACINE, f.fichier)} : ${f.marqueur}`)).toEqual([]);
  }, 60_000);

  const recentPourLeCours =
    existsSync(buildId) && statSync(buildId).mtimeMs > statSync(join(RACINE, "src/pedagogy/cours/chapitre-servi.ts")).mtimeMs;
  it.skipIf(!recentPourLeCours)("aucun extrait d'un chapitre réservé dans .next/static", async () => {
    const { fuitesDuCours } = await import("../../scripts/verifier-bundles");
    const fuites = fuitesDuCours(dossierNext);
    expect(fuites.map((f) => `${relative(RACINE, f.fichier)} : ${f.marqueur}`)).toEqual([]);
  }, 60_000);
});
