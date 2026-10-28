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
import { join } from "node:path";
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

const estLancéDirectement = process.argv[1]?.endsWith("verifier-bundles.ts");
if (estLancéDirectement) {
  const dossier = process.argv[2] ?? ".next";
  const marqueurs = marqueursDesCorriges();
  const fuites = fuitesDuBuild(dossier, marqueurs);
  if (fuites.length > 0) {
    console.error(`${fuites.length} fuite(s) de corrigés dans ${dossier}/static :`);
    for (const f of fuites.slice(0, 20)) console.error(`  ${f.fichier} : ${f.marqueur}`);
    process.exit(1);
  }
  console.log(`Aucun corrigé dans ${dossier}/static (${marqueurs.length} extraits cherchés).`);
}
