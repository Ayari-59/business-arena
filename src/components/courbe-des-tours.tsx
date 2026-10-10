import { euroSigne } from "@/components/tableau-de-bord";

/**
 * LA COURBE DES TOURS : LE RÉSULTAT NET, TOUR PAR TOUR (lot P2).
 *
 * La clôture disait le cumul et nommait deux tours ; elle ne montrait pas le
 * chemin. Les données du bilan le portent déjà (le résultat net de chaque
 * tour clos, relu dans les comptes : `pedagogy/bilan-de-partie`) : rien n'est
 * calculé ici, rien n'est inventé.
 *
 * La grammaire est celle de la compétence `dataviz` :
 *   · UNE seule échelle, la ligne du ZÉRO tracée et nommée (au-dessus on
 *     gagne, en dessous on perd) ;
 *   · une seule série, en bleu donnée (`--donnee`), trait de 2 px, points de
 *     8 px cernés de la couleur du fond ; le DERNIER tour mis en avant (point
 *     plus gros) et seul étiqueté de sa valeur, comme le dit la règle des
 *     étiquettes « au bout de la ligne » ;
 *   · le texte à l'encre (jamais la couleur de la série), des graduations
 *     rondes et compactes, une grille d'un pixel, discrète ;
 *   · rien ne tient à la couleur seule : le signe est écrit, chaque point a
 *     son infobulle (« Tour 3 : −2 127 € »), et un tableau caché donne les
 *     six valeurs à une synthèse vocale.
 * Une seule série : pas de légende, le titre dit ce qui est tracé.
 */

export interface PointDeLaCourbe {
  round: number;
  /** « Tour 3 », dans la langue du scénario. */
  libelle: string;
  valeur: number;
}

/** Des graduations rondes (1, 2, 2,5 ou 5 × 10ⁿ), qui couvrent [bas, haut]. */
export function graduations(bas: number, haut: number, cible = 4): number[] {
  const etendue = haut - bas || Math.abs(haut) || 1;
  const brut = etendue / cible;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas =
    [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => etendue / p <= cible) ?? 10 * puissance;
  const debut = Math.floor(bas / pas) * pas;
  const fin = Math.ceil(haut / pas) * pas;
  const sortie: number[] = [];
  for (let v = debut; v <= fin + pas / 2; v += pas) sortie.push(Math.round(v));
  return sortie;
}

/** « −20 k€ », « 0 », « 15 k€ » : une graduation compacte. */
function compact(v: number): string {
  if (v === 0) return "0";
  const signe = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1000) {
    const k = a / 1000;
    return `${signe}${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: k < 10 ? 1 : 0 }).format(k)} k€`;
  }
  return `${signe}${a} €`;
}

export function CourbeDesTours({
  tours,
  className = "",
}: {
  tours: readonly PointDeLaCourbe[];
  className?: string;
}) {
  if (tours.length < 2) return null;
  return (
    <figure data-courbe-des-tours="" className={`m-0 ${className}`}>
      <figcaption className="text-base font-semibold text-slate-100">
        Votre résultat net, tour par tour
      </figcaption>
      {/* DEUX DESSINS, UNE TAILLE DE TEXTE. Un SVG mis à l'échelle de sa
          boîte réduit aussi son texte : à 340 px de large, une graduation de
          13 px tombait à 7. Le téléphone a donc son propre dessin, à sa
          largeur réelle ; un seul des deux est affiché (et lu). */}
      <Trace tours={tours} largeur={640} className="mt-3 hidden max-w-3xl sm:block" />
      <Trace tours={tours} largeur={340} className="mt-3 sm:hidden" />
      <table className="sr-only">
        <caption>Résultat net de chaque tour</caption>
        <thead>
          <tr>
            <th scope="col">Tour</th>
            <th scope="col">Résultat net</th>
          </tr>
        </thead>
        <tbody>
          {tours.map((t) => (
            <tr key={t.round}>
              <th scope="row">{t.libelle}</th>
              <td>{euroSigne(t.valeur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Trace({
  tours,
  largeur: L,
  className,
}: {
  tours: readonly PointDeLaCourbe[];
  largeur: number;
  className: string;
}) {
  const H = 220;
  const large = L > 400;
  const marge = { haut: 16, droite: large ? 96 : 80, bas: 30, gauche: large ? 58 : 50 };
  const valeurs = tours.map((t) => t.valeur);
  const ticks = graduations(Math.min(0, ...valeurs), Math.max(0, ...valeurs));
  const bas = ticks[0]!;
  const haut = ticks.at(-1)!;
  const x = (i: number) =>
    marge.gauche + (i * (L - marge.gauche - marge.droite)) / Math.max(1, tours.length - 1);
  const y = (v: number) =>
    marge.haut + ((haut - v) * (H - marge.haut - marge.bas)) / (haut - bas || 1);
  const dernier = tours.length - 1;
  const trace = tours.map((t, i) => `${x(i).toFixed(1)},${y(t.valeur).toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      className={`h-auto w-full overflow-visible ${className}`}
      role="img"
      aria-label={`Résultat net de chaque tour : ${tours
        .map((t) => `${t.libelle} ${euroSigne(t.valeur)}`)
        .join(", ")}.`}
    >
      {/* La grille et ses graduations : un pixel, discrètes. Le zéro est plus
          marqué : au-dessus on gagne, en dessous on perd. */}
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={marge.gauche}
            x2={L - marge.droite}
            y1={y(v)}
            y2={y(v)}
            className={v === 0 ? "stroke-slate-400" : "stroke-slate-700"}
            strokeWidth={1}
            data-zero={v === 0 ? "" : undefined}
          />
          <text
            x={marge.gauche - 8}
            y={y(v)}
            dy="0.32em"
            textAnchor="end"
            className="fill-slate-300 text-sm tabular-nums"
          >
            {compact(v)}
          </text>
        </g>
      ))}
      <polyline
        points={trace}
        fill="none"
        className="stroke-[color:var(--donnee)]"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {tours.map((t, i) => (
        <g key={t.round}>
          <title>{`${t.libelle} : ${euroSigne(t.valeur)}`}</title>
          {/* La cible du survol, plus grande que le point. */}
          <circle cx={x(i)} cy={y(t.valeur)} r={12} fill="transparent" />
          <circle
            cx={x(i)}
            cy={y(t.valeur)}
            r={i === dernier ? 6 : 4}
            className="fill-[color:var(--donnee)] stroke-slate-950"
            strokeWidth={2}
            data-dernier-point={i === dernier ? "" : undefined}
          />
          <text
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className={`text-sm ${i === dernier ? "fill-slate-100 font-semibold" : "fill-slate-300"}`}
          >
            {`T${t.round}`}
          </text>
        </g>
      ))}
      {/* La seule valeur écrite : celle du dernier tour, au bout de la ligne. */}
      <text
        x={x(dernier) + 12}
        y={y(tours[dernier]!.valeur)}
        dy="0.32em"
        className="fill-slate-50 text-sm font-semibold tabular-nums"
      >
        {euroSigne(tours[dernier]!.valeur)}
      </text>
    </svg>
  );
}
