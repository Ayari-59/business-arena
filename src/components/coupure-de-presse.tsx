import { Repliable } from "@/components/repliable";
import { compter } from "@/lib/format";
import { DEVISE_DU_JOURNAL, NOM_DU_JOURNAL, type ArticleDeLaGazette } from "@/config/gazette/types";

/**
 * LA COUPURE DE PRESSE : LA GAZETTE DE L'ARÈNE, UN ARTICLE PAR TOUR.
 *
 * Elle se pose AVANT la lettre, dans le courrier du tour : on lit d'abord ce
 * qui attend tout le marché (la presse), puis ce qui est adressé à
 * l'entreprise (le courrier). En classe, où le courrier du tour n'existe pas,
 * elle ouvre « Ce qui a bougé ».
 *
 * MÊME FAMILLE DE PAPIER QUE LES LETTRES (règles « LE PAPIER » de
 * globals.css) : la feuille blanche, son filet et son ombre, couleurs écrites
 * en dur et aucun utilitaire de couleur Tailwind à l'intérieur. Ce qui la
 * distingue d'une lettre se voit avant de lire : un bandeau de journal (son
 * nom, sa devise, un double filet), une rubrique en petites capitales, un
 * titre en caractères de presse. Pas d'expéditeur, pas de signature.
 *
 * LISIBLE EN DIX SECONDES : un titre, trois ou quatre lignes. Vrai texte, et
 * un vrai titre (`h2` ou `h3` selon la page qui la pose).
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
  /** Dans la revue de presse : sans bandeau, plus serrée. */
  compacte?: boolean;
  /** L'identifiant du titre, quand la même page pose deux fois le même numéro. */
  idDuTitre?: string;
}) {
  const id = idDuTitre ?? `gazette-${article.tour}${compacte ? "-revue" : ""}`;
  const Titre = `h${niveauDuTitre}` as "h2" | "h3" | "h4";
  return (
    <article
      aria-labelledby={id}
      data-coupure-de-presse=""
      className={`papier coupure-de-presse rounded-md ${compacte ? "coupure-compacte" : ""}`}
    >
      {compacte ? (
        <p className="coupure-date tenue">
          {quand} · {article.rubrique}
        </p>
      ) : (
        <header className="coupure-bandeau">
          <p className="coupure-journal">{NOM_DU_JOURNAL}</p>
          <p className="coupure-date tenue">
            {DEVISE_DU_JOURNAL} · {quand}
          </p>
        </header>
      )}
      {compacte ? null : <p className="coupure-rubrique">{article.rubrique}</p>}
      <Titre id={id} className="coupure-titre">
        {article.titre}
      </Titre>
      <p className="coupure-chapo douce">{article.chapo}</p>
    </article>
  );
}

/**
 * LA REVUE DE PRESSE : les articles des tours passés, du plus récent au plus
 * ancien, rangés dans un pli. Rien ne s'y perd, et rien ne s'y impose.
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
      <ol className="mt-3 grid gap-3" aria-label={`${NOM_DU_JOURNAL}, numéros précédents`}>
        {articles.map((a) => (
          <li key={a.tour}>
            <CoupureDePresse article={a} quand={libelle(a.tour)} niveauDuTitre={4} compacte />
          </li>
        ))}
      </ol>
    </Repliable>
  );
}
