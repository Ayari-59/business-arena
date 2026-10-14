"use client";

import { useEffect, useRef, useState } from "react";
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
 *
 * ELLE PREND TOUTE LA LARGEUR DE SA CLÔTURE (lot P5). Le dessin avait une
 * largeur fixe (640 unités, plafonné à 768 px) : à 1280, il n'occupait que
 * les deux tiers de la clôture et laissait un vide à droite. Une simple mise
 * à l'échelle ne suffit pas (un SVG étiré grossit aussi son texte : à 1 168 px,
 * une graduation de 14 px passait à 25) : la courbe MESURE sa boîte
 * (`ResizeObserver`) et se dessine à sa largeur réelle, une unité pour un
 * pixel. Le texte garde sa taille, le tracé occupe la largeur, la hauteur
 * suit un peu (220 à 300 px). Les marges se règlent sur ce qu'elles portent :
 * la droite sur l'étiquette du dernier point, la gauche sur la plus longue
 * graduation, pour que l'une et l'autre restent dans le dessin, de 390 à
 * 1 280 px. Avant la mesure (rendu serveur), deux dessins de repli,
 * téléphone et ordinateur, tiennent la place.
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
  const boite = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState<number | null>(null);
  useEffect(() => {
    const el = boite.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observateur = new ResizeObserver(([entree]) => {
      const l = Math.floor(entree?.contentRect.width ?? 0);
      if (l > 0) setLargeur(l);
    });
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);
  if (tours.length < 2) return null;
  return (
    <figure data-courbe-des-tours="" className={`m-0 ${className}`}>
      <figcaption className="text-base font-semibold text-slate-100">
        Votre résultat net, tour par tour
      </figcaption>
      {/* UN DESSIN À LA LARGEUR DE SA BOÎTE. Un SVG mis à l'échelle de sa
          boîte réduit ou grossit aussi son texte : la boîte est donc mesurée
          et le dessin fait à sa largeur. Avant la mesure, le téléphone et
          l'ordinateur ont chacun leur dessin de repli ; un seul des deux est
          affiché (et lu). */}
      <div ref={boite} data-boite-de-la-courbe="" className="mt-3 w-full">
        {largeur ? (
          <Trace tours={tours} largeur={largeur} className="block" />
        ) : (
          <>
            <Trace tours={tours} largeur={1000} className="hidden sm:block" />
            <Trace tours={tours} largeur={340} className="sm:hidden" />
          </>
        )}
      </div>
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
  // La hauteur suit un peu la largeur : 220 px sur un téléphone, 300 au plus.
  const H = Math.round(Math.min(300, Math.max(220, L * 0.26)));
  const large = L > 400;
  const valeurs = tours.map((t) => t.valeur);
  const ticks = graduations(Math.min(0, ...valeurs), Math.max(0, ...valeurs));
  const etiquette = euroSigne(tours.at(-1)!.valeur);
  // Les marges se règlent sur leur texte (14 px, un chiffre fait au plus
  // 8,4 px) : à droite l'étiquette du dernier point, posée 12 px après lui ;
  // à gauche la plus longue graduation, posée 8 px avant l'axe.
  const marge = {
    haut: 16,
    droite: Math.max(large ? 96 : 80, Math.ceil(etiquette.length * 8.4) + 12 + 8),
    bas: 30,
    gauche: Math.max(
      large ? 58 : 50,
      Math.ceil(Math.max(...ticks.map((v) => compact(v).length)) * 8.4) + 8 + 4,
    ),
  };
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
        data-etiquette-du-dernier-point=""
        className="fill-slate-50 text-sm font-semibold tabular-nums"
      >
        {etiquette}
      </text>
    </svg>
  );
}
