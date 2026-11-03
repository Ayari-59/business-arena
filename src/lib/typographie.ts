/**
 * LES ESPACES INSÉCABLES DE LA TYPOGRAPHIE FRANÇAISE, POSÉES AU RENDU (audit de la langue,
 * novembre 2026, R03 à R06).
 *
 * Les sources s'écrivent avec des espaces ordinaires, comme on tape : « Coût : 1 200 € ». Une
 * espace ordinaire laisse la ligne se couper avant « : », avant « € », au milieu d'un nombre ou
 * à l'intérieur des guillemets. Plutôt que de reprendre des dizaines de milliers de sources à
 * la main, une seule fonction pose les insécables au moment où le texte part à l'écran : le
 * cours servi (pedagogy/cours/chapitre-servi.ts), les situations et les courriers
 * (config/scenarios/situation-texte.ts), les guides (config/guides/jetons.ts), les pages et
 * les épisodes (components/typographie.ts).
 *
 *   · « mot » : une insécable à l'intérieur des guillemets ;
 *   · une insécable avant « : », « ; », « ? » et « ! » ;
 *   · une insécable entre un nombre et « € », « k€ », « M€ » ou « % » ;
 *   · une espace fine insécable (U+202F) entre les groupes de trois chiffres, celle que pose déjà
 *     le formateur des montants (lib/format.ts, Intl).
 *
 * Un champ de saisie qui relit un nombre accepte l'espace ordinaire comme l'insécable : `\s`
 * les comprend toutes les deux (pedagogy/cours/correcteur.ts).
 *
 * Garde : tests/architecture/langue-des-sources.test.ts et tests/cours/langue-du-cours-servi.test.ts.
 */

export const INSECABLE = " ";
export const FINE_INSECABLE = " ";

/** Le texte, ses espaces ordinaires remplacées là où la typographie française les veut insécables. */
export function insecables(t: string): string {
  if (!/[ \d]/.test(t)) return t;
  return (
    t
      .replace(/« /g, `«${INSECABLE}`)
      .replace(/ »/g, `${INSECABLE}»`)
      .replace(/ ([:;?!])/g, `${INSECABLE}$1`)
      // Les milliers : « 12 500 », « 1 200 000 », sans toucher « 2026 300 » (quatre chiffres devant).
      .replace(/(?<![\d,.])(\d{1,3})((?: \d{3})+)(?![\d])/g, (_, tete: string, groupes: string) => tete + groupes.replace(/ /g, FINE_INSECABLE))
      .replace(/(\d) (€|k€|M€|%)/g, `$1${INSECABLE}$2`)
  );
}

/**
 * Les clés dont la valeur est un code, jamais un texte lu : on n'y touche pas, une comparaison
 * ou une clé de stockage en dépend.
 */
export const CLES_DE_CODE: ReadonlySet<string> = new Set([
  "code",
  "id",
  "type",
  "compte",
  "levier",
  "vue",
  "categorie",
  "cle",
  "unite_code",
  "montrer",
  "sens",
  "href",
  "url",
  "notions",
  "mots",
]);

/**
 * Une donnée entière (objet, tableau, chaîne), ses textes passés par `insecables`. Les clés de
 * code sont laissées telles quelles ; les fonctions et les nombres aussi.
 */
export function typographier<T>(valeur: T, ignorer: ReadonlySet<string> = CLES_DE_CODE): T {
  if (typeof valeur === "string") return insecables(valeur) as T;
  if (Array.isArray(valeur)) return valeur.map((v) => typographier(v, ignorer)) as T;
  if (valeur && typeof valeur === "object" && Object.getPrototypeOf(valeur) === Object.prototype) {
    const sortie: Record<string, unknown> = {};
    for (const [cle, v] of Object.entries(valeur)) sortie[cle] = ignorer.has(cle) ? v : typographier(v, ignorer);
    return sortie as T;
  }
  return valeur;
}

/** Pour comparer deux textes sans tenir compte des insécables : toutes les espaces deviennent ordinaires. */
export const espacesOrdinaires = (t: string): string => t.replace(/[  ]/g, " ");
