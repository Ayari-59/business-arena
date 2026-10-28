/**
 * LES CORRIGÉS NE PARTENT PAS DANS LE NAVIGATEUR (audit, P1-2).
 *
 * Fouille les fichiers JavaScript publics d'un build (`.next/static`) à la
 * recherche des corrigés des situations : les bonnes réponses (`correctOptionId`
 * écrit comme une donnée, `correct:!0`) et des extraits des explications,
 * tirés du registre lui-même. Un seul extrait trouvé suffit à échouer.
 *
 * Usage, après un build :
 *   npm run build && npm run verifier-bundles
 *   npm run verifier-bundles -- chemin/vers/.next
 *
 * Le test d'architecture `tests/architecture/corriges-hors-du-navigateur.test.ts`
 * l'appelle aussi sur le build présent, s'il est postérieur au correctif.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ALL_SITUATIONS } from "../src/config/scenarios/registry";

export interface Fuite {
  fichier: string;
  marqueur: string;
}

/**
 * Des extraits d'explications assez longs pour n'appartenir qu'à elles : la plus
 * longue suite de caractères simples (lettres sans accent, chiffres, espaces),
 * pour ne pas dépendre de la façon dont le minifieur écrit les accents.
 */
export function marqueursDesCorriges(): string[] {
  const marqueurs = new Set<string>();
  for (const s of ALL_SITUATIONS) {
    for (const q of s.quiz) {
      const morceaux = q.explain.match(/[A-Za-z0-9 ,.]{30,}/g) ?? [];
      const plusLong = morceaux.sort((a, b) => b.length - a.length)[0]?.trim();
      if (plusLong && plusLong.length >= 30) marqueurs.add(plusLong.slice(0, 60));
    }
  }
  return [...marqueurs];
}

/** Les données d'un corrigé, quel que soit le texte : une option juste écrite comme une valeur. */
const DONNEES_DE_CORRIGE = [/correctOptionId:\s*["'`]/, /\bcorrect:\s*(?:!0|true)\b/];

function fichiersJs(dossier: string): string[] {
  const out: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) out.push(...fichiersJs(chemin));
    else if (nom.endsWith(".js")) out.push(chemin);
  }
  return out;
}

export function fuitesDuBuild(dossierNext: string, marqueurs = marqueursDesCorriges()): Fuite[] {
  const statique = join(dossierNext, "static");
  if (!existsSync(statique)) throw new Error(`aucun build dans ${dossierNext} : lancez d'abord next build`);
  const fuites: Fuite[] = [];
  for (const fichier of fichiersJs(statique)) {
    const texte = readFileSync(fichier, "utf8");
    for (const motif of DONNEES_DE_CORRIGE) {
      if (motif.test(texte)) fuites.push({ fichier, marqueur: String(motif) });
    }
    for (const m of marqueurs) {
      if (texte.includes(m)) {
        fuites.push({ fichier, marqueur: m });
        break;
      }
    }
  }
  return fuites;
}

/**
 * LES CHAPITRES SOUS LICENCE NE PARTENT PAS DANS LE NAVIGATEUR (audit, P0).
 *
 * Constaté sur le build : le guide d'un chapitre, composant client, importait le
 * registre du cours entier ; les 113 chapitres et les cas pratiques, réservés ou
 * non, se lisaient dans les fichiers publics. La page sert désormais au navigateur
 * le seul chapitre ouvert, après le contrôle de la licence (pedagogy/cours/chapitre-servi.ts).
 *
 * Les marqueurs viennent des sources : dans chaque fichier de chapitre ou de cas
 * pratique réservé (`libre: false`), les plus longues suites de caractères simples
 * de ses textes. Un fichier qui se déclare libre (`libre: true`) n'en donne pas : il
 * peut rester public.
 */
const DOSSIERS_DU_COURS = ["src/config/cours/chapitres", "src/config/cours/situations"];

function sources(dossier: string): string[] {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return sources(chemin);
    return nom.endsWith(".ts") && !["index.ts", "types.ts"].includes(nom) ? [chemin] : [];
  });
}

export function marqueursDuCours(racine = process.cwd(), parFichier = 3): { fichier: string; marqueur: string }[] {
  const out: { fichier: string; marqueur: string }[] = [];
  for (const fichier of DOSSIERS_DU_COURS.flatMap((d) => sources(join(racine, d)))) {
    const source = readFileSync(fichier, "utf8");
    if (/\blibre:\s*true\b/.test(source)) continue;
    // Les textes seulement : les commentaires disent aussi des phrases, que le build efface.
    const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const textes = [...sansCommentaires.matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? "");
    const morceaux = textes
      .flatMap((t) => t.split(/\$\{[^}]*\}/))
      .flatMap((t) => t.match(/[A-Za-z ,.]{40,}/g) ?? [])
      .map((m) => m.trim())
      .filter((m) => m.length >= 40 && m.split(" ").length >= 6);
    const choisis = [...new Set(morceaux)].sort((a, b) => b.length - a.length).slice(0, parFichier);
    for (const m of choisis) out.push({ fichier: relative(racine, fichier), marqueur: m.slice(0, 70) });
  }
  return out;
}

export function fuitesDuCours(dossierNext: string, marqueurs = marqueursDuCours()): Fuite[] {
  const statique = join(dossierNext, "static");
  if (!existsSync(statique)) throw new Error(`aucun build dans ${dossierNext} : lancez d'abord next build`);
  const fuites: Fuite[] = [];
  for (const fichier of fichiersJs(statique)) {
    const texte = readFileSync(fichier, "utf8");
    for (const m of marqueurs) {
      if (texte.includes(m.marqueur)) fuites.push({ fichier, marqueur: `${m.fichier} : ${m.marqueur}` });
    }
  }
  return fuites;
}

const estLancéDirectement = process.argv[1]?.endsWith("verifier-bundles.ts");
if (estLancéDirectement) {
  const dossier = process.argv[2] ?? ".next";
  const marqueurs = marqueursDesCorriges();
  const fuites = fuitesDuBuild(dossier, marqueurs);
  const duCours = marqueursDuCours();
  const fuitesDuContenu = fuitesDuCours(dossier, duCours);
  if (fuites.length > 0) {
    console.error(`${fuites.length} fuite(s) de corrigés dans ${dossier}/static :`);
    for (const f of fuites.slice(0, 20)) console.error(`  ${f.fichier} : ${f.marqueur}`);
  } else console.log(`Aucun corrigé dans ${dossier}/static (${marqueurs.length} extraits cherchés).`);
  if (fuitesDuContenu.length > 0) {
    const fichiers = new Set(fuitesDuContenu.map((f) => f.fichier));
    const sourcesTrouvees = new Set(fuitesDuContenu.map((f) => f.marqueur.split(" : ")[0]));
    console.error(
      `${fuitesDuContenu.length} extrait(s) de chapitres réservés dans ${dossier}/static (${sourcesTrouvees.size} fichier(s) de cours, dans ${fichiers.size} fichier(s) JS) :`,
    );
    for (const f of fuitesDuContenu.slice(0, 20)) console.error(`  ${f.fichier} : ${f.marqueur}`);
  } else console.log(`Aucun chapitre réservé dans ${dossier}/static (${duCours.length} extraits cherchés).`);
  if (fuites.length > 0 || fuitesDuContenu.length > 0) process.exit(1);
}
