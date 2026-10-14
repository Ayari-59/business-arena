/**
 * LA RÉPONSE OUVERTE, RAMENÉE AUX OPTIONS QU'ON SAIT NOTER.
 *
 * Un enseignant peut vouloir une partie sans QCM : l'élève écrit son diagnostic et le
 * modèle d'analyse qu'il mobilise, avec ses mots. Pour ne pas créer un second barème, le
 * texte est RAMENÉ aux options de la situation — celles que le QCM aurait proposées —,
 * par les mots qu'il emploie ; le score, la correction du débriefing et la maîtrise des
 * notions passent ensuite par le chemin d'avant, inchangé.
 *
 * C'est une correction par mots-clés : elle est approximative, et le dit. Un texte juste
 * mais écrit avec d'autres mots que ceux de l'option peut ne rien reconnaître. L'enseignant
 * relit toujours le texte lui-même (il est conservé tel quel) ; ce module ne sert qu'à
 * donner une première note.
 *
 * Module pur : aucune base, aucun réseau.
 */

/** Les mots qui ne portent pas de sens : articles, prépositions, auxiliaires, liaisons. */
const MOTS_VIDES = new Set(
  (
    "alors aucun aussi autre avec avoir bien cela celui ceux chaque comme dans donc elle elles " +
    "encore entre etre fait faire fois leur leurs mais meme moins nous notre notres pour plus " +
    "puis quand quel quelle quels quelles sans selon sera sont sous tout toute toutes tous " +
    "tres votre vous vos une des les ces ses son sur par que qui est ont pas aux the ainsi " +
    "afin car cet cette dont elle lors parce peut peuvent sans soit tant vers"
  ).split(" "),
);

/** Minuscules, sans accents, sans ponctuation : « Marge, sur coûts » → « marge sur couts ». */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[œ]/g, "oe")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * La racine d'un mot : ses cinq premières lettres. Grossier, voulu : « rentabilité »,
 * « rentable » et « rentabiliser » se rejoignent ; « marge » et « marges » aussi.
 */
function racine(mot: string): string {
  return mot.length > 5 ? mot.slice(0, 5) : mot.replace(/[sx]$/, "");
}

/** Les racines qui comptent d'un texte : sans mots vides, sans mots d'une ou deux lettres. */
export function racinesDe(texte: string): Set<string> {
  const racines = new Set<string>();
  for (const mot of normaliser(texte).split(" ")) {
    if (mot.length < 3 || MOTS_VIDES.has(mot)) continue;
    racines.add(racine(mot));
  }
  return racines;
}

/**
 * La part de l'option que le texte retrouve : racines de l'option présentes dans le
 * texte, rapportées à celles de l'option (0 à 1). Une option sans mot qui compte vaut 0.
 */
export function couverture(texte: string, option: string): number {
  const attendues = racinesDe(option);
  if (attendues.size === 0) return 0;
  const vues = racinesDe(texte);
  let trouvees = 0;
  for (const r of attendues) if (vues.has(r)) trouvees += 1;
  return trouvees / attendues.size;
}

/** À partir de cette couverture, le texte « dit » l'option. */
export const SEUIL_DE_RECONNAISSANCE = 0.5;

/** Une réponse trop courte n'est pas une réponse : on ne la note pas, on la refuse. */
export const LONGUEUR_MINIMALE = 12;

export function estUneReponse(texte: string): boolean {
  return texte.trim().length >= LONGUEUR_MINIMALE;
}

/**
 * DIAGNOSTIC : les options que le texte dit. Plusieurs sont possibles — comme des cases
 * cochées —, et celles qui sont fausses comptent contre le texte, comme au QCM (le score
 * est le même F1 : précision et rappel).
 */
export function optionsReconnues(
  texte: string,
  options: { id: string; label: string }[],
): string[] {
  return options
    .filter((o) => couverture(texte, o.label) >= SEUIL_DE_RECONNAISSANCE)
    .map((o) => o.id);
}

/**
 * MODÈLE D'ANALYSE (et toute question à réponse unique) : l'option la mieux reconnue, à
 * condition qu'elle passe le seuil et qu'aucune autre ne la vaille — à égalité, le texte
 * ne tranche pas, et rien n'est retenu plutôt qu'un hasard.
 */
export function optionLaPlusProche(
  texte: string,
  options: { id: string; label: string }[],
): string | undefined {
  const classees = options
    .map((o) => ({ id: o.id, c: couverture(texte, o.label) }))
    .sort((a, b) => b.c - a.c);
  const premiere = classees[0];
  if (!premiere || premiere.c < SEUIL_DE_RECONNAISSANCE) return undefined;
  const seconde = classees[1];
  if (seconde && seconde.c === premiere.c) return undefined;
  return premiere.id;
}
