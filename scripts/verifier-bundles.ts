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
 * de ses textes. Un fichier libre (`fichierLibre`) n'en donne pas : il peut rester public.
 */
const DOSSIERS_DU_COURS = ["src/config/cours/chapitres", "src/config/cours/situations", "src/config/cours/bureaux", "src/config/cours/enquetes", "src/config/cours/scenarios"];

/**
 * UN FICHIER LIBRE se déclare libre (`libre: true`) et n'exporte qu'un contenu (novembre 2026, un
 * chapitre libre par diplôme : config/cours/chapitres-libres.ts). Le fichier d'un chapitre découpé
 * (config/cours/chapitres/decoupage.ts, `partieDuChapitre`) exporte la première partie, libre, et sa
 * suite, réservée : il se fouille en entier, pour que la suite reste gardée. Garde :
 * tests/architecture/un-chapitre-libre-par-diplome.test.ts.
 */
const CONTENU_EXPORTE = /^export const \w+\s*:\s*(?:Chapitre|Situation|Bureau|Enquete|Scenario)\b/gm;
export function fichierLibre(source: string): boolean {
  return /\blibre:\s*true\b/.test(source) && (source.match(CONTENU_EXPORTE)?.length ?? 0) <= 1;
}

export function sourcesDuCours(racine = process.cwd()): string[] {
  return DOSSIERS_DU_COURS.flatMap((d) => sources(join(racine, d)));
}

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
  for (const fichier of sourcesDuCours(racine)) {
    const source = readFileSync(fichier, "utf8");
    if (fichierLibre(source)) continue;
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

/**
 * LE DIAPORAMA DE L'ENSEIGNANT NE PART PAS DANS LE NAVIGATEUR (novembre 2026). Son générateur
 * (src/pedagogy/cours/diaporama.ts) porte les corrigés de chaque question ; il vit au serveur, et la
 * page n'en montre qu'un lien. S'il entrait dans un bundle client, la bibliothèque qui écrit le fichier
 * viendrait avec lui : ses noms se lisent encore après la minification.
 */
export const MARQUEURS_DU_DIAPORAMA = ["defineSlideMaster", "<dc:creator>PptxGenJS"];

export function fuitesDuDiaporama(dossierNext: string, marqueurs = MARQUEURS_DU_DIAPORAMA): Fuite[] {
  const statique = join(dossierNext, "static");
  if (!existsSync(statique)) throw new Error(`aucun build dans ${dossierNext} : lancez d'abord next build`);
  return fichiersJs(statique).flatMap((fichier) => {
    const texte = readFileSync(fichier, "utf8");
    return marqueurs.filter((m) => texte.includes(m)).map((marqueur) => ({ fichier, marqueur: `diaporama : ${marqueur}` }));
  });
}

/**
 * LES ÉPISODES MANAGER NE PARTENT PAS DANS LE NAVIGATEUR (audit du 10 novembre 2026, P1-1).
 *
 * Constaté en production : la page d'une démonstration gratuite chargeait un fichier de 4,8 Mo où se
 * lisaient 114 épisodes, payants compris, leurs messages, leurs verdicts et leurs bilans. Le jeu se
 * calcule désormais au serveur, geste par geste, après le contrôle de la licence
 * (pedagogy/episodes/partie-servie.ts, route /api/episodes/partie).
 *
 * Les marqueurs viennent des sources de chaque épisode du registre : son contenu (messages, résultats
 * des vérifications, réactions), son assemblage (tableau de bord, bilan, comportements), son modèle
 * (les événements qu'il raconte) et sa fiche de débrief. Dans chacun, les plus longues suites de
 * caractères simples de ses textes, comme pour le cours. Aucun épisode n'est libre : la démonstration
 * gratuite elle-même se joue par le serveur.
 */
const DOSSIERS_D_UN_EPISODE = ["src/config/episodes", "src/pedagogy/episodes", "src/engine/episodes", "src/config/episodes/fiches"];

/** Les codes des épisodes, lus des imports du registre : sans charger les épisodes. */
export function codesDesEpisodes(racine = process.cwd()): string[] {
  const registre = readFileSync(join(racine, "src/pedagogy/episodes/registre.ts"), "utf8");
  return [...registre.matchAll(/import\s+\{\s*EPISODE_\w+\s*\}\s+from\s+["']\.\/([\w-]+)["']/g)].map((m) => m[1]!);
}

export function sourcesDesEpisodes(racine = process.cwd()): string[] {
  return codesDesEpisodes(racine).flatMap((code) =>
    DOSSIERS_D_UN_EPISODE.map((d) => join(racine, d, `${code}.ts`)).filter((f) => existsSync(f)),
  );
}

/** Les textes d'un fichier source, sans ses commentaires, que le build efface. */
function textesDuSource(source: string): string[] {
  const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return [...sansCommentaires.matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? "");
}

export function marqueursDesEpisodes(racine = process.cwd(), parFichier = 3): { fichier: string; marqueur: string }[] {
  const out: { fichier: string; marqueur: string }[] = [];
  for (const fichier of sourcesDesEpisodes(racine)) {
    const morceaux = textesDuSource(readFileSync(fichier, "utf8"))
      .flatMap((t) => t.split(/\$\{[^}]*\}/))
      .flatMap((t) => t.match(/[A-Za-z ,.]{40,}/g) ?? [])
      .map((m) => m.trim())
      .filter((m) => m.length >= 40 && m.split(" ").length >= 6);
    const choisis = [...new Set(morceaux)].sort((a, b) => b.length - a.length).slice(0, parFichier);
    for (const m of choisis) out.push({ fichier: relative(racine, fichier), marqueur: m.slice(0, 70) });
  }
  return out;
}

export function fuitesDesEpisodes(dossierNext: string, marqueurs = marqueursDesEpisodes()): Fuite[] {
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
  const fuitesDuGenerateur = fuitesDuDiaporama(dossier);
  if (fuitesDuGenerateur.length > 0) {
    console.error(`${fuitesDuGenerateur.length} trace(s) du générateur de diaporama dans ${dossier}/static :`);
    for (const f of fuitesDuGenerateur.slice(0, 20)) console.error(`  ${f.fichier} : ${f.marqueur}`);
  } else console.log(`Aucun générateur de diaporama dans ${dossier}/static (${MARQUEURS_DU_DIAPORAMA.length} marqueurs cherchés).`);
  const desEpisodes = marqueursDesEpisodes();
  const fuitesDEpisodes = fuitesDesEpisodes(dossier, desEpisodes);
  if (fuitesDEpisodes.length > 0) {
    const fichiers = new Set(fuitesDEpisodes.map((f) => f.fichier));
    const sourcesTrouvees = new Set(fuitesDEpisodes.map((f) => f.marqueur.split(" : ")[0]!));
    const episodesTrouves = new Set([...sourcesTrouvees].map((s) => s.replace(/^.*\//, "").replace(/\.ts$/, "")));
    console.error(
      `${fuitesDEpisodes.length} extrait(s) d'épisodes manager dans ${dossier}/static (${episodesTrouves.size} épisode(s), ${sourcesTrouvees.size} fichier(s) source, dans ${fichiers.size} fichier(s) JS) :`,
    );
    for (const f of fuitesDEpisodes.slice(0, 20)) console.error(`  ${f.fichier} : ${f.marqueur}`);
  } else console.log(`Aucun épisode manager dans ${dossier}/static (${desEpisodes.length} extraits cherchés).`);
  if (fuites.length > 0 || fuitesDuContenu.length > 0 || fuitesDuGenerateur.length > 0 || fuitesDEpisodes.length > 0) process.exit(1);
}
