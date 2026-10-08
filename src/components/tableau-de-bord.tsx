import { formatEuro } from "@/lib/format";

/**
 * OÙ EN EST MON ENTREPRISE, ET DANS QUEL SENS ELLE VA.
 *
 * L'élève avait ses chiffres, mais un tour à la fois : pour savoir si sa
 * trésorerie se redressait ou s'enfonçait, il fallait déplier trois tours et
 * comparer de tête. Trois tuiles le disent d'un coup — la valeur du dernier
 * tour clos, l'écart avec le précédent, et la courbe depuis le début.
 *
 * CE SONT LES TROIS CHIFFRES DE LA MAISON. Chiffre d'affaires, résultat net,
 * trésorerie : exactement le trio que la ligne de résumé de chaque tour porte
 * déjà, et que la liste de l'enseignant reprend. Un quatrième — l'IPG — aurait
 * demandé son historique, qui n'est pas calculé par tour ; il reste sur sa
 * pastille, dans le bandeau de jeu.
 *
 * LA COULEUR NE DÉCIDE DE RIEN TOUTE SEULE. Le vert et le rouge d'un résultat
 * se confondent pour une partie des daltoniens — mesuré : 4,6 d'écart perçu en
 * deutéranopie, là où huit sont demandés. Le signe est donc écrit dans le
 * nombre (« −27 198 € »), l'écart porte une flèche ET son signe, et la couleur
 * ne fait que confirmer. Le détail chiffré de chaque tour reste dans
 * l'accordéon en dessous : rien ici n'est la seule source.
 */

export interface TourChiffre {
  round: number;
  libelle: string;
  ca: number;
  resultat: number;
  tresorerie: number;
}

/** Une tuile : la valeur du dernier tour, l'écart, et la courbe. */
function Tuile({
  titre,
  titreLong,
  valeurs,
  libelles,
  teinte,
  avecZero,
}: {
  titre: string;
  /** L'intitulé entier, pour l'infobulle et pour les lecteurs d'écran. */
  titreLong: string;
  valeurs: number[];
  libelles: string[];
  /**
   * L'encre de la courbe : la donnée pour une grandeur, l'état pour un signe.
   * Un `niveau` (la trésorerie) n'est pas un résultat : il reste à l'encre tant
   * qu'il est positif, et ne prend le rouge qu'en découvert.
   */
  teinte: "accent" | "signe" | "niveau";
  /** Tracer la ligne de zéro : elle ne veut dire quelque chose que si le signe compte. */
  avecZero: boolean;
}) {
  const derniere = valeurs.at(-1) ?? 0;
  const avant = valeurs.length > 1 ? valeurs.at(-2)! : null;
  const ecart = avant === null ? null : derniere - avant;
  const positif = derniere >= 0;
  // LA VALEUR EST UNE INFORMATION, PAS UNE ACTION. Le chiffre d'affaires
  // s'écrivait dans l'orange des boutons : il prend le blanc cassé de
  // l'information, et sa courbe le bleu désaturé des données de marché. Le
  // vert et le rouge restent aux grandeurs qui ont un signe, le résultat et la
  // trésorerie.
  const couleur =
    teinte === "accent" || (teinte === "niveau" && positif)
      ? "text-slate-50"
      : positif
        ? "text-emerald-300"
        : "text-red-300";
  const trait =
    teinte === "accent" || (teinte === "niveau" && positif)
      ? "text-sky-300"
      : positif
        ? "text-emerald-300"
        : "text-red-300";

  // La courbe, en coordonnées 0→100 sur la largeur et 0→24 en hauteur. Une
  // échelle par tuile : ces trois grandeurs n'ont pas le même ordre de
  // grandeur, et les superposer sur une échelle commune ne dirait rien.
  const min = Math.min(...valeurs, avecZero ? 0 : Math.min(...valeurs));
  const max = Math.max(...valeurs, avecZero ? 0 : Math.max(...valeurs));
  const etendue = max - min || 1;
  const points = valeurs.map((v, i) => ({
    x: valeurs.length === 1 ? 50 : (i / (valeurs.length - 1)) * 100,
    y: 22 - ((v - min) / etendue) * 20,
  }));
  const ligne = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const yZero = 22 - ((0 - min) / etendue) * 20;
  const bout = points.at(-1)!;

  return (
    // UN ÉCRAN, POSÉ SUR LE PAPIER. Les trois chiffres qui disent où en est
    // l'entreprise sont des instruments, pas de la lecture : ils prennent
    // l'ardoise du tableau, et le reste de l'arène reste sur le papier.
    <div className="ardoise min-w-0 rounded-lg border border-white/5 bg-slate-950 px-2.5 py-2.5 sm:px-3">
      {/* Les intitulés sont ceux des lignes de résumé de l'application —
          « CA · résultat · tréso » — et non leur forme longue : à trois
          colonnes sur un téléphone, « CHIFFRE D'AFFAIRES » se coupait.
          « TRÉSORERIE » se coupait encore en « TRÉSORE… » à 390 px : sur
          téléphone, l'interlettrage de rubrique tombe et la tuile resserre
          son retrait, ce qui rend au mot les quelques pixels qui lui
          manquaient, sans l'abréger. */}
      <p
        className="truncate text-xs uppercase tracking-normal text-slate-400 sm:tracking-etiquette"
        title={titreLong}
      >
        {titre}
      </p>
      {/* LES CHIFFRES DANS LA POLICE DU SITE, À CHASSE FIXE. Ils étaient en
          monospace, la police des codes à recopier : un résultat n'est pas un
          code, et la chasse monospace l'élargissait d'un tiers. Les chiffres
          tabulaires d'Inter Tight s'alignent d'une tuile à l'autre tout autant. */}
      <p className={`mt-0.5 text-base font-semibold tabular-nums ${couleur}`}>
        {formatEuro(derniere)}
      </p>
      {/* L'ÉCART, AVEC SON SIGNE ÉCRIT. La flèche seule serait un signal de
          couleur et de forme ; le signe le dit en toutes lettres, et « stable »
          évite le « −0 € » qu'un écart nul affichait, flèche vers le bas à
          l'appui. */}
      {ecart === null ? (
        <p className="text-xs text-slate-400">premier tour</p>
      ) : Math.round(ecart) === 0 ? (
        <p className="text-xs text-slate-400">stable</p>
      ) : (
        <p className="text-xs tabular-nums text-slate-400">
          <span aria-hidden>{ecart > 0 ? "▲" : "▼"}</span> {ecart > 0 ? "+" : ""}
          {formatEuro(ecart)}
        </p>
      )}

      <svg
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="mt-1.5 h-7 w-full sm:h-10"
        role="img"
        aria-label={`${titreLong}, tour par tour : ${valeurs
          .map((v, i) => `${libelles[i]} ${Math.round(v)}`)
          .join(", ")}`}
      >
        {/* La ligne de zéro, en trait fin et discret : elle ne se remarque pas,
            mais elle dit de quel côté on est. */}
        {avecZero && yZero > 0 && yZero < 24 ? (
          <line
            x1="0"
            x2="100"
            y1={yZero}
            y2={yZero}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-white/15"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <polyline
          points={ligne}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={trait}
        />
        {/* Le bout de la courbe, cerclé de la couleur du fond pour rester
            lisible là où il croise la ligne de zéro. */}
        <circle
          cx={bout.x}
          cy={bout.y}
          r="2.5"
          className={`${trait} stroke-slate-950`}
          fill="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* De quoi survoler chaque tour : une cible large et invisible, et son
            infobulle native. La valeur exacte reste par ailleurs dans le
            tableau du tour, plus bas. */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="transparent">
            {/* UNE SEULE CHAÎNE dans un <title> : React rend vide, côté
                serveur, un titre à plusieurs enfants, et le navigateur
                réécrivait ensuite le texte. C'était l'erreur d'hydratation
                (#418) de chaque arène à partir du deuxième tour. */}
            <title>{`${libelles[i]} : ${formatEuro(valeurs[i]!)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

/**
 * Les trois tuiles, en une rangée. Rien tant qu'aucun tour n'est clos : une
 * courbe à un point n'est pas une courbe, et un tableau de bord vide occupe la
 * place du jeu.
 */
export function TableauDeBord({ tours }: { tours: TourChiffre[] }) {
  if (tours.length === 0) return null;
  const libelles = tours.map((t) => t.libelle);
  return (
    // La rangée ne s'étale pas sur les 1 400 px de l'arène : au-delà, la
    // courbe s'aplatit jusqu'à ne plus rien dire, et trois tuiles larges
    // comme la page se lisent comme trois sections.
    <section
      aria-label="Où en est votre entreprise"
      className="grid max-w-4xl grid-cols-3 gap-2 sm:gap-3"
    >
      <Tuile
        titre="CA"
        titreLong="Chiffre d'affaires"
        valeurs={tours.map((t) => t.ca)}
        libelles={libelles}
        teinte="accent"
        avecZero={false}
      />
      <Tuile
        titre="Résultat"
        titreLong="Résultat net"
        valeurs={tours.map((t) => t.resultat)}
        libelles={libelles}
        teinte="signe"
        avecZero
      />
      <Tuile
        titre="Trésorerie"
        titreLong="Trésorerie nette"
        valeurs={tours.map((t) => t.tresorerie)}
        libelles={libelles}
        teinte="niveau"
        avecZero
      />
    </section>
  );
}
