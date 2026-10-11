import type { ArticleDeLaGazette } from "./types";

/**
 * L'ÉDITION D'UNE PARTIE : ce qui a paru, et ce que l'enseignant a décidé.
 *
 * Rien de neuf en base : tout tient dans le profil de la partie
 * (`games.difficultyProfile.gazette`), à côté des courriers distribués.
 *
 *   · `parus[tour]` : l'article tel que la classe l'a lu, figé à la clôture du
 *     tour (le générateur l'aurait recalculé à l'identique ; on le garde pour
 *     l'archive et le bilan, et pour ce que l'enseignant y a changé) ;
 *   · `enseignant[tour]` : « remplacer par mon article » ou « ne pas publier ».
 *
 * EN CLASSE, L'ENSEIGNANT GARDE LA MAIN : il voit l'article d'un tour avant
 * que la classe ne l'ouvre, le remplace par le sien ou le retire. Un article
 * d'enseignant n'est pas marqué comme tel pour les élèves : c'est la presse du
 * monde de la partie, et elle parle d'une seule voix.
 */

export interface ConsigneDeLEnseignant {
  mode: "remplace" | "retire";
  titre?: string;
  texte?: string;
}

/** Un tour où l'enseignant n'a rien publié. */
export interface ArticleRetire {
  tour: number;
  retire: true;
}

export interface EditionDeLaPartie {
  parus: Record<string, ArticleDeLaGazette | ArticleRetire>;
  enseignant: Record<string, ConsigneDeLEnseignant>;
}

/** Les bornes d'un article d'enseignant : un titre et trois ou quatre lignes, pas une page. */
export const BORNES_DE_L_ARTICLE = { titreMin: 6, titreMax: 90, texteMin: 30, texteMax: 420 } as const;

/** La rubrique d'un article d'enseignant : celle de la une. */
export const RUBRIQUE_DE_L_ENSEIGNANT = "À la une";

const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

/** Lit l'édition d'un profil de partie ; un profil sans Gazette donne une édition vide. */
export function lireLEdition(profil: unknown): EditionDeLaPartie {
  const g = estObjet(profil) ? profil.gazette : undefined;
  const parus = estObjet(g) && estObjet(g.parus) ? (g.parus as EditionDeLaPartie["parus"]) : {};
  const enseignant =
    estObjet(g) && estObjet(g.enseignant) ? (g.enseignant as EditionDeLaPartie["enseignant"]) : {};
  return { parus, enseignant };
}

export const estRetire = (x: ArticleDeLaGazette | ArticleRetire): x is ArticleRetire =>
  (x as ArticleRetire).retire === true;

/** Les articles parus, du plus ancien au plus récent (les tours sans article sont sautés). */
export function articlesParus(edition: EditionDeLaPartie): ArticleDeLaGazette[] {
  return Object.values(edition.parus)
    .filter((x): x is ArticleDeLaGazette => !estRetire(x))
    .sort((a, b) => a.tour - b.tour);
}

/** Nettoie une saisie : espaces de bord, blancs répétés, retours à la ligne. */
const net = (s: string) => s.replace(/\s+/g, " ").trim();

/** Valide l'article d'un enseignant. Contrôlé côté serveur : le formulaire peut mentir. */
export function validerLArticleDeLEnseignant(
  titreBrut: unknown,
  texteBrut: unknown,
): { ok: true; titre: string; texte: string } | { ok: false; erreur: string } {
  const titre = net(String(titreBrut ?? ""));
  const texte = net(String(texteBrut ?? ""));
  const b = BORNES_DE_L_ARTICLE;
  if (titre.length < b.titreMin)
    return { ok: false, erreur: `Le titre est trop court : au moins ${b.titreMin} caractères.` };
  if (titre.length > b.titreMax)
    return { ok: false, erreur: `Le titre est trop long : ${b.titreMax} caractères au plus.` };
  if (texte.length < b.texteMin)
    return { ok: false, erreur: `Le texte est trop court : au moins ${b.texteMin} caractères.` };
  if (texte.length > b.texteMax)
    return {
      ok: false,
      erreur: `Le texte est trop long : ${b.texteMax} caractères au plus, trois ou quatre lignes.`,
    };
  return { ok: true, titre, texte };
}

/**
 * CE QUE LA CLASSE LIT pour un tour, à partir de l'article du générateur et de
 * la consigne de l'enseignant. `porteLeMarche` : l'article est celui du
 * journal, il raconte les événements de marché, et les circulaires « tout le
 * marché » se taisent (règle « pas de doublon »). Remplacé ou retiré, il ne
 * les raconte plus : les circulaires reviennent.
 */
export function articleAffiche(
  genere: ArticleDeLaGazette,
  consigne: ConsigneDeLEnseignant | undefined,
): { article: ArticleDeLaGazette | null; porteLeMarche: boolean } {
  if (!consigne) return { article: genere, porteLeMarche: true };
  if (consigne.mode === "retire") return { article: null, porteLeMarche: false };
  return {
    article: {
      tour: genere.tour,
      rubrique: RUBRIQUE_DE_L_ENSEIGNANT,
      titre: consigne.titre ?? "",
      chapo: consigne.texte ?? "",
      fiabilite: "fait",
      sujets: [],
      auteur: "enseignant",
    },
    porteLeMarche: false,
  };
}

/**
 * LA PUBLICATION, à la clôture d'un tour : l'article lu par la classe est figé
 * dans `parus`. Pure : la résolution l'appelle avec l'article qu'elle vient de
 * recalculer sur les événements passés au moteur, et range le résultat dans le
 * profil qu'elle écrit déjà.
 */
export function profilAvecLaGazetteParue(
  profil: unknown,
  genere: ArticleDeLaGazette,
): Record<string, unknown> {
  const base = (profil ?? {}) as Record<string, unknown>;
  const edition = lireLEdition(profil);
  const { article } = articleAffiche(genere, edition.enseignant[String(genere.tour)]);
  return {
    ...base,
    gazette: {
      enseignant: edition.enseignant,
      parus: {
        ...edition.parus,
        [String(genere.tour)]: article ?? { tour: genere.tour, retire: true },
      },
    },
  };
}

/**
 * PAS DE DOUBLON : les événements que l'article raconte. Leur circulaire « tout
 * le marché » se tait (courrier du tour, courrier distribué, « encore en
 * vigueur », bande de marché) ; un événement de marché que l'article n'a pas la
 * place de raconter garde sa lettre. Un article remplacé ou retiré ne raconte
 * rien : toutes les circulaires reviennent.
 */
export function codesRacontesParLaPresse(
  gazette: { article: ArticleDeLaGazette | null; porteLeMarche: boolean } | null | undefined,
): ReadonlySet<string> {
  if (!gazette?.porteLeMarche || !gazette.article) return new Set();
  return new Set(
    gazette.article.sujets.filter((x) => x.code !== null && !x.dementi).map((x) => x.code!),
  );
}

/** Un pli de marché que la presse a déjà raconté. */
export const racontePar = (codes: ReadonlySet<string>, pli: { code: string; teamId: string | null }) =>
  pli.teamId === null && codes.has(pli.code);
