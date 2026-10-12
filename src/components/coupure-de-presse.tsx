import { Repliable } from "@/components/repliable";
import { compter } from "@/lib/format";
import {
  DEVISE_DU_JOURNAL,
  NOM_DU_JOURNAL,
  PRIX_DU_NUMERO,
  SIGNATURE_DU_JOURNAL,
  type ArticleDeLaGazette,
} from "@/config/gazette/types";

/**
 * LA COUPURE DE PRESSE : LA GAZETTE DE L'ARÈNE, UN ARTICLE PAR TOUR.
 *
 * Elle se pose AVANT la lettre, dans le courrier du tour : on lit d'abord ce
 * qui attend tout le marché (la presse), puis ce qui est adressé à
 * l'entreprise (le courrier). En classe, où le courrier du tour n'existe pas,
 * elle ouvre « Ce qui a bougé ».
 *
 * UN MORCEAU DE JOURNAL DÉCOUPÉ, PAS UNE CARTE. Le propriétaire : « je veux que
 * la Gazette ressemble vraiment à un journal découpé ». Ce qui le dit avant
 * qu'on lise (globals.css, « LA COUPURE DE PRESSE ») :
 *   · le PAPIER JOURNAL, un blanc cassé grisé plus terne que la lettre, à grain
 *     très léger, et l'ombre d'une feuille posée ;
 *   · les BORDS DÉCOUPÉS AUX CISEAUX, en haut et en bas, une très légère
 *     rotation et un morceau de ruban adhésif ;
 *   · la MAQUETTE DE PRESSE : la manchette (le nom du journal en didone), son
 *     double filet, la ligne de date et le prix du numéro, la rubrique en
 *     petites capitales, le titre gras et serré, le chapô, puis le corps
 *     justifié, en colonnes sur ordinateur, ouvert par une lettrine, signé, et
 *     clos par le carré de fin.
 *
 * LE TEXTE NE CHANGE PAS. Le générateur écrit un titre et un texte de trois ou
 * quatre phrases (`chapo`) ; la coupure en fait un chapô (la première phrase)
 * et un corps (les suivantes), sans retoucher un mot (`decouperLArticle`).
 *
 * L'OBJET RESTE DU PAPIER (règles « LE PAPIER » de globals.css) : couleurs
 * écrites en dur, aucun utilitaire de couleur Tailwind à l'intérieur. Vrai
 * texte, et un vrai titre (`h2`, `h3` ou `h4` selon la page qui la pose).
 */
export function CoupureDePresse({
  article,
  quand,
  niveauDuTitre = 3,
  compacte = false,
  idDuTitre,
}: {
  article: ArticleDeLaGazette;
  /** Le tour, tel que la partie le nomme (« Tour 3 ») : la date du numéro. */
  quand: string;
  niveauDuTitre?: 2 | 3 | 4;
  /** Dans la revue de presse : la même coupure, en plus petit, sur une colonne. */
  compacte?: boolean;
  /** L'identifiant du titre, quand la même page pose deux fois le même numéro. */
  idDuTitre?: string;
}) {
  const id = idDuTitre ?? `gazette-${article.tour}${compacte ? "-revue" : ""}`;
  const Titre = `h${niveauDuTitre}` as "h2" | "h3" | "h4";
  const { chapo, corps } = decouperLArticle(article.chapo);
  // Le carré de fin : un signe de maquette, pas un mot. Les lecteurs d'écran ne le lisent pas.
  const fin = (
    <span aria-hidden="true" className="coupure-fin">
      {" "}■
    </span>
  );
  return (
    // L'OMBRE ET LA POSE. La feuille est découpée (`clip-path`), et une découpe
    // rogne aussi l'ombre de l'élément qui la porte : l'ombre (qui suit la
    // découpe), la rotation et le ruban adhésif sont portés par cette enveloppe.
    <div
      className="coupure-ombre"
      data-format={compacte ? "compacte" : "pleine"}
      data-colonnes={compacte ? 1 : colonnesDuCorps(corps)}
    >
      <article
        lang="fr"
        aria-labelledby={id}
        data-coupure-de-presse=""
        className={`papier coupure-de-presse${compacte ? " coupure-compacte" : ""}`}
      >
        <header className="coupure-bandeau">
          <p className="coupure-journal">{NOM_DU_JOURNAL}</p>
          <p className="coupure-date">
            {compacte
              ? `${quand} · ${PRIX_DU_NUMERO}`
              : `${DEVISE_DU_JOURNAL} · ${quand} · ${PRIX_DU_NUMERO}`}
          </p>
        </header>
        <p className="coupure-rubrique">{article.rubrique}</p>
        <Titre id={id} className="coupure-titre">
          {article.titre}
        </Titre>
        <div className="coupure-texte">
          {chapo ? <p className="coupure-chapo">{chapo}</p> : null}
          <div className="coupure-corps">
            {/* La lettrine TOMBE sur deux lignes quand le corps en a deux à coup
                sûr ; sur un corps plus court, elle MONTE (même hauteur, posée sur
                la première ligne), sans laisser de trou sous une ligne seule. */}
            <p
              className="coupure-premier"
              data-lettrine={corps.length >= CORPS_D_UN_ENTREFILET ? "tombante" : "montante"}
            >
              {corps}
              {compacte ? fin : null}
            </p>
            {compacte ? null : (
              <p className="coupure-signature italic">
                {SIGNATURE_DU_JOURNAL}
                {fin}
              </p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

/**
 * LE CHAPÔ ET LE CORPS, sans changer un mot. La première phrase devient le
 * chapô (en gras, sur toute la largeur), les suivantes le corps (justifié,
 * avec sa lettrine). Un texte d'une seule phrase n'a pas de chapô : il est
 * tout entier le corps, qui garde sa lettrine.
 */
export function decouperLArticle(texte: string): { chapo: string | null; corps: string } {
  // Les blancs ordinaires seulement : l'espace insécable avant « : ; ! ? »
  // (typographie du générateur) reste ce qu'elle est.
  const propre = texte.trim().replace(/[ \t\r\n]+/g, " ");
  // Une fin de phrase : un point (ou « ! », « ? », « … »), un blanc, puis une
  // capitale ou un guillemet ouvrant. « 1,5 % » ou « M. » au milieu d'une
  // phrase ne coupent rien : ils ne sont pas suivis d'une capitale.
  const phrases = propre.split(/(?<=[.!?…]) (?=[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŒ«])/u);
  if (phrases.length < 2) return { chapo: null, corps: propre };
  return { chapo: phrases[0]!, corps: phrases.slice(1).join(" ") };
}

/** En dessous, un entrefilet : une seule colonne (une ligne et demie de bureau). */
export const CORPS_D_UN_ENTREFILET = 110;
/** À partir de là, trois colonnes sur un grand écran (six lignes et plus sur deux). */
export const CORPS_D_UN_ARTICLE_LONG = 240;

/**
 * LE NOMBRE DE COLONNES DU CORPS, quand la place le permet (la feuille de
 * style le borne à la largeur réelle, par une requête de conteneur) : une
 * colonne pour un entrefilet, deux pour un article ordinaire, trois pour un
 * long. Une colonne de journal se remplit : deux colonnes d'une ligne chacune
 * ne feraient pas une page de presse, mais un texte coupé en deux.
 */
export function colonnesDuCorps(corps: string): 1 | 2 | 3 {
  if (corps.length < CORPS_D_UN_ENTREFILET) return 1;
  return corps.length >= CORPS_D_UN_ARTICLE_LONG ? 3 : 2;
}

/**
 * LA REVUE DE PRESSE : les articles des tours passés, du plus récent au plus
 * ancien, rangés dans un pli. Les mêmes coupures, en plus petit, posées côte à
 * côte et un peu de travers, comme des coupures conservées.
 */
export function RevueDePresse({
  articles,
  libelle,
}: {
  /** Du plus récent au plus ancien. */
  articles: readonly ArticleDeLaGazette[];
  /** Le tour, tel que la partie le nomme. */
  libelle: (tour: number) => string;
}) {
  if (articles.length === 0) return null;
  return (
    <Repliable
      resume="Revue de presse"
      quoi={compter(articles.length, "article")}
      className="revue-de-presse"
    >
      <ol className="coupures-conservees" aria-label={`${NOM_DU_JOURNAL}, numéros précédents`}>
        {articles.map((a) => (
          <li key={a.tour}>
            <CoupureDePresse article={a} quand={libelle(a.tour)} niveauDuTitre={4} compacte />
          </li>
        ))}
      </ol>
    </Repliable>
  );
}
