import ts from "typescript";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * LES TEXTES DU DÉPÔT, POUR LES GARDES DE LA LANGUE (audit de la langue, novembre 2026).
 *
 * Deux relevés, repris des scripts de l'audit :
 *   · `textesDesSources` : l'analyse syntaxique des sources (chaînes, gabarits, texte JSX), sans
 *     les commentaires ni les imports ; un gabarit se lit avec ses expressions remplacées par
 *     « ⟨…⟩ » ;
 *   · `textesDuCoursServi` (tests/cours/langue-du-cours-servi.test.ts) : tout ce que
 *     `servirLeChapitre` envoie à l'élève, dans chaque entreprise où le chapitre se joue.
 */

export const RACINE = fileURLToPath(new URL("../..", import.meta.url));

export interface TexteSource {
  fichier: string;
  ligne: number;
  sorte: "str" | "tpl" | "jsx";
  texte: string;
}

function fichiersDe(dossier: string): string[] {
  const absolu = join(RACINE, dossier);
  if (!statSync(absolu, { throwIfNoEntry: false })) return [];
  if (statSync(absolu).isFile()) return [absolu];
  return (readdirSync(absolu, { recursive: true }) as string[])
    .map((f) => join(absolu, f))
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f) && statSync(f).isFile());
}

/** Un texte en français : deux mots au moins, pas une classe ni un chemin. */
export const estDuFrancais = (s: string): boolean =>
  /[a-zàâçéèêëîïôûùüÿœ]{2,}\s+[a-zàâçéèêëîïôûùüÿœ']{2,}/i.test(s) &&
  !/^[\w\-:/[\].#%()=, ]+$/.test(s) &&
  !/^(\/|https?:|@\/|\.\/)/.test(s) &&
  !/\b(flex|grid|px-|py-|text-|bg-|rounded|border|items-|justify-|gap-|mt-|mb-|w-full|hover:)/.test(s) &&
  !/\b(SELECT|INSERT|UPDATE|WHERE|FROM)\b/.test(s);

const ATTRIBUTS_DE_CODE = /^(className|href|src|id|key|style|name|type|value|htmlFor|role|data-[\w-]+)$/;

const cache = new Map<string, TexteSource[]>();

/** Les textes des sources sous ces dossiers (relatifs à la racine), dans l'ordre des fichiers. */
export function textesDesSources(dossiers: readonly string[]): TexteSource[] {
  const cle = dossiers.join("|");
  const deja = cache.get(cle);
  if (deja) return deja;
  const vus = new Set<string>();
  const sortie: TexteSource[] = [];
  for (const dossier of dossiers) {
    for (const f of fichiersDe(dossier)) {
      const rel = relative(RACINE, f);
      if (vus.has(rel)) continue;
      vus.add(rel);
      const src = ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const emettre = (n: ts.Node, sorte: TexteSource["sorte"], t: string) => {
        const texte = t.replace(/\s+/g, " ").trim();
        if (!estDuFrancais(texte)) return;
        sortie.push({ fichier: rel, ligne: src.getLineAndCharacterOfPosition(n.getStart()).line + 1, sorte, texte });
      };
      const visiter = (n: ts.Node) => {
        if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
        if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
          const parent = n.parent;
          if (parent && ts.isJsxAttribute(parent) && ATTRIBUTS_DE_CODE.test(parent.name.getText())) return;
          if (parent && ts.isCallExpression(parent) && /^(require|sql|query|console\.\w+|logger\.\w+)$/.test(parent.expression.getText())) return;
          emettre(n, "str", n.text);
        } else if (ts.isTemplateExpression(n)) {
          let t = n.head.text;
          for (const s of n.templateSpans) t += "⟨" + s.expression.getText().slice(0, 40) + "⟩" + s.literal.text;
          emettre(n, "tpl", t);
          for (const s of n.templateSpans) visiter(s.expression);
          return;
        } else if (ts.isJsxText(n)) emettre(n, "jsx", n.text.replace(/&apos;/g, "'").replace(/&nbsp;/g, " "));
        ts.forEachChild(n, visiter);
      };
      visiter(src);
    }
  }
  cache.set(cle, sortie);
  return sortie;
}

/** Le texte sans ses expressions ni ses jetons de calcul ; un jeton-phrase (« {{À Noël}} ») reste du texte. */
export const sansExpressions = (t: string): string =>
  t
    .replace(/⟨[^⟩]*⟩/g, "X")
    .replace(/\{\{([^{}]*)\}\}/g, (_, j: string) => (/^[A-ZÀ-Ý][^:]*\s/.test(j.trim()) ? j : "X"));

// ---------------------------------------------------------------------------
// Les règles, communes aux sources et au cours servi
// ---------------------------------------------------------------------------

const E = "[\\s\\u00a0\\u202f]";

/**
 * Un tiret au milieu d'une phrase : le tiret cadratin entre deux mots, le demi-cadratin hors d'un
 * intervalle (« 10 h – 14 h », « 12 – 15 € »), le trait d'union isolé entre deux mots. Le tiret
 * seul d'une cellule vide (« — », « « — » ») n'est pas une phrase.
 */
export function tiretsAuMilieu(t: string): string[] {
  const s = sansExpressions(t);
  const trouves: string[] = [];
  const re = new RegExp(`(\\S)${E}+([—–])${E}+(\\S)`, "gu");
  for (const m of s.matchAll(re)) {
    const avant = s.slice(0, m.index! + 1);
    const apres = s.slice(m.index! + m[0].length - 1);
    if (m[1] === "«" && m[3] === "»") continue;
    if (m[2] === "–" && /(\d|X|€|%|\d h|\d h \d\d)$/.test(avant) && /^(\d|X)/.test(apres)) continue;
    trouves.push(s.slice(Math.max(0, m.index! - 30), m.index! + m[0].length + 30));
  }
  for (const m of s.matchAll(new RegExp(`[a-zà-ÿ,]${E}-${E}[a-zà-ÿ]`, "gu"))) trouves.push(s.slice(Math.max(0, m.index! - 30), m.index! + 33));
  return trouves;
}

/** Les phrases d'un texte, et leurs mots. */
export const phrasesDe = (t: string): string[] =>
  sansExpressions(t)
    .split(/(?<=[.!?…])[\s  ]+(?=[«"A-ZÀ-Ý0-9])/u)
    .map((p) => p.trim())
    .filter(Boolean);
export const motsDe = (phrase: string): number => (phrase.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) ?? []).length;

/** Les phrases distinctes de plus de `n` mots. */
export function phrasesLongues(textes: Iterable<string>, n = 40): Set<string> {
  const longues = new Set<string>();
  for (const t of textes) for (const p of phrasesDe(t)) if (motsDe(p) > n) longues.add(p);
  return longues;
}

/** Le tutoiement, hors citation entre guillemets. */
export function tutoiements(t: string): string[] {
  const horsCitation = t.replace(/«[^»]*»/g, "«»").replace(/“[^”]*”/g, "“”");
  return [...horsCitation.matchAll(/(?<!\p{L})(tu|ton|ta|tes|toi|t'|-toi|-tu)(?!\p{L})/giu)]
    .map((m) => horsCitation.slice(Math.max(0, m.index! - 25), m.index! + 25))
    .filter((x) => !/\b(le|du|au|un|de|même) ton\b/i.test(x));
}

/** Le lexique que la maison n'emploie plus. */
export const LEXIQUE_INTERDIT: readonly { mot: string; re: RegExp }[] = [
  { mot: "cyber-sécurité (cybersécurité)", re: /cyber-s[ée]curit[ée]/iu },
  { mot: "évènement (événement)", re: /évènement/iu },
  { mot: "co-animé, co-piloté, co-traitance (soudés)", re: /(?<!\p{L})co-(anim|pilot|trait)/iu },
  { mot: "... (…)", re: /\.\.\./u },
  { mot: "e-mail (courriel, adresse électronique)", re: /(?<!\p{L})e[-‑]?mail/iu },
];

/** Les espaces ordinaires que la typographie française veut insécables. */
export function espacesOrdinairesFautives(t: string): string[] {
  const res: string[] = [];
  for (const m of t.matchAll(/« | »| [:;?!](?=\s|$|[»)"])|\d (?:€|k€|M€|%)|(?<![\d,.])\d{1,3} \d{3}(?!\d)/gu))
    res.push(t.slice(Math.max(0, m.index! - 20), m.index! + m[0].length + 10));
  return res;
}

/** Un guillemet droit dans la prose (pas un attribut, pas du balisage ni du code). */
export function guillemetsDroits(t: string): string[] {
  const s = sansExpressions(t);
  if (/[<{}]|=["\[]|@media|role=/.test(s)) return [];
  return [...s.matchAll(/(?<![=\w])"[A-Za-zÀ-ÿ][^"=]{2,}"/gu)].map((m) => m[0].slice(0, 60));
}

/** Un accord écrit entre parenthèses (« fracture(s) », « expert(e)s ») au lieu d'être calculé. */
export const accordsEntreParentheses = (t: string): string[] =>
  [...sansExpressions(t).matchAll(/(?<=\p{L})\((?:s|e|es|x|ne|le)\)(?=[\p{L}\s.,;:!?)]|$)/gu)].map((m) => m[0]);

/** Le texte provisoire d'une page publique : un champ inconnu s'écrit « [à compléter] », sans plus. */
export const TEXTE_PROVISOIRE = /(?<!\[)à compléter(?!\])|\bTODO\b|\bXXX\b|lorem ipsum/iu;

/**
 * Les espaces perdues du JSX : un texte qui finit par une lettre ou une virgule, suivi d'un retour
 * à la ligne puis d'une balise de texte (`strong`, `em`, `Link`…) ou d'une expression, se colle à
 * elle au rendu (« monde variable(chaque »). Il faut un `{" "}`. L'inverse aussi : une balise ou une
 * expression suivie d'un retour à la ligne puis d'un mot.
 */
export function espacesJsxPerdues(dossiers: readonly string[]): string[] {
  const sortie: string[] = [];
  const TEXTE = /^(strong|em|b|i|a|Link|abbr|code)$/;
  const expressionDeTexte = (n: ts.Node) =>
    ts.isJsxExpression(n) &&
    !!n.expression &&
    (ts.isIdentifier(n.expression) || ts.isPropertyAccessExpression(n.expression) || ts.isCallExpression(n.expression) || ts.isElementAccessExpression(n.expression));
  const baliseDeTexte = (n: ts.Node) => ts.isJsxElement(n) && TEXTE.test(n.openingElement.tagName.getText()) && !/aria-hidden|sr-only/.test(n.openingElement.getText());
  for (const dossier of dossiers) {
    for (const f of fichiersDe(dossier).filter((x) => x.endsWith(".tsx"))) {
      const src = ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visiter = (n: ts.Node) => {
        if (ts.isJsxElement(n) || ts.isJsxFragment(n)) {
          const enfants = n.children;
          for (let i = 0; i < enfants.length - 1; i++) {
            const a = enfants[i]!;
            const b = enfants[i + 1]!;
            const ligne = src.getLineAndCharacterOfPosition(b.getStart()).line + 1;
            const ou = `${relative(RACINE, f)}:${ligne}`;
            if (ts.isJsxText(a) && /[A-Za-zÀ-ÿ,:;]\n\s*$/.test(a.text) && (expressionDeTexte(b) || baliseDeTexte(b))) {
              sortie.push(`${ou} …${a.text.trim().slice(-30)}⏎${b.getText().slice(0, 40).replace(/\s+/g, " ")}`);
            }
            if ((expressionDeTexte(a) || baliseDeTexte(a)) && ts.isJsxText(b) && /^\n\s*[A-Za-zÀ-ÿ«(]/.test(b.text)) {
              sortie.push(`${ou} ${a.getText().slice(-40).replace(/\s+/g, " ")}⏎${b.text.trim().slice(0, 30)}…`);
            }
          }
        }
        ts.forEachChild(n, visiter);
      };
      visiter(src);
    }
  }
  return sortie;
}
