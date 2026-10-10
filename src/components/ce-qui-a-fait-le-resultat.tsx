import type { CSSProperties } from "react";
import { formatEuro } from "@/lib/format";
import type {
  CauseDuResultat,
  DecompositionDuResultat,
  MarcheDuResultat,
} from "@/components/lecture-du-resultat";

/**
 * « CE QUI A FAIT LE RÉSULTAT » : LA CASCADE ET LES CAUSES, EN UN COUP D'ŒIL.
 *
 * Posé sous le chiffre du verdict (le rituel de fin de tour, la synthèse d'un
 * tour clos) : le chiffre, PUIS la cause, PUIS la place — la règle du rituel
 * tient. Ce n'est pas un tableau de bord : cinq barres et trois phrases, rien
 * à manipuler.
 *
 * LA PALETTE DES DONNÉES (charte) : le chiffre d'affaires en bleu donnée, ce
 * qui s'en retranche en gris ardoise, et le résultat dans SA couleur de
 * résultat, vert ou rouge francs, sans dilution. Une barre ne dit jamais rien
 * seule : chaque marche porte son libellé et son montant écrits.
 *
 * Le composant ne calcule rien : la cascade et les causes viennent de
 * `lecture-du-resultat.ts`, qui les lit dans les comptes du tour.
 *
 * LOT P3 : UNE VRAIE CASCADE. C'étaient cinq barres indépendantes, chacune sur
 * son rail : on ne voyait pas le chiffre d'affaires « fondre » jusqu'au
 * résultat. C'est désormais un graphique en cascade, sur UNE échelle :
 *   · le chiffre d'affaires est la première marche, pleine, depuis zéro ;
 *   · chaque charge DESCEND depuis le niveau atteint par la précédente, et un
 *     filet fin relie le bas d'une marche au haut de la suivante ;
 *   · le résultat net est la dernière marche, ancrée à la ligne de base ;
 *   · la ligne du zéro est toujours tracée : quand le résultat est négatif,
 *     elle passe au-dessus de la dernière marche, qui plonge dessous.
 * Les marques suivent la compétence `dataviz` : barres de 24 px au plus,
 * coin arrondi à l'extrémité de la donnée et carré sur la ligne de base,
 * filets d'un pixel, pleins. Le texte est à l'ENCRE, jamais à la couleur de
 * la série, et chaque montant porte son signe ; la couleur ne dit que le rôle
 * (bleu donnée pour ce qui entre, un gris NEUTRE pour ce qui sort, vert ou
 * rouge francs pour le résultat). Sur ordinateur, des colonnes ; sous 640 px, la
 * même cascade couchée (barres horizontales, filets verticaux), pour rester
 * lisible à 390 px. La liste elle-même est lisible au lecteur d'écran (un
 * libellé et un montant par marche) : le dessin, lui, est `aria-hidden`.
 */
/** Un montant de la cascade, son signe toujours écrit (le moins typographique). */
function signe(montant: number): string {
  const arrondi = Math.round(montant);
  return `${arrondi > 0 ? "+" : arrondi < 0 ? "\u2212" : ""}${formatEuro(Math.abs(montant))}`;
}

/**
 * Où une marche se pose sur l'échelle commune, en fractions de 0 à 1 : son bas
 * et son haut, le niveau qu'elle laisse à la suivante (`fin`), celui qu'elle
 * reçoit de la précédente (`entree`), et la ligne du zéro. Exporté pour la
 * garde (`tests/unit/cascade-du-resultat.test.ts`).
 */
/**
 * LOT P4 : UN PETIT RÉSULTAT RESTE LISIBLE, SANS MENTIR SUR SA TAILLE. Quand le
 * résultat net est petit devant le chiffre d'affaires (+878 € pour 297 124 €),
 * sa marche faisait un pixel, couchée sur la ligne du zéro : invisible. Sous
 * ce seuil (5 % de l'échelle, soit 4 px sur la cascade du rituel), elle ne
 * devient pas une barre faussement haute : c'est un MARQUEUR, un trait épais
 * et plus large que les barres, posé AU NIVEAU DU ZÉRO — il dit « presque
 * rien », et le montant écrit dit combien.
 */
export const SEUIL_DU_MARQUEUR = 0.05;

export function geometrieDeLaCascade(marches: readonly MarcheDuResultat[]) {
  const bornes = marches.flatMap((m) => [m.debut, m.fin]);
  const bas = Math.min(0, ...bornes);
  const haut = Math.max(0, ...bornes);
  const echelle = haut - bas || 1;
  const f = (v: number) => (v - bas) / echelle;
  return marches.map((m, i) => ({
    cle: m.cle,
    bas: f(Math.min(m.debut, m.fin)),
    haut: f(Math.max(m.debut, m.fin)),
    fin: f(m.fin),
    entree: i > 0 ? f(marches[i - 1]!.fin) : null,
    zero: f(0),
    /** La marche monte (un produit, un résultat positif) ou descend (une charge, une perte). */
    sens: m.fin >= m.debut ? ("hausse" as const) : ("baisse" as const),
    /** Elle part de zéro (le chiffre d'affaires, le résultat) ou flotte au niveau atteint. */
    ancree: m.debut === 0,
    /** Le résultat, trop petit pour une barre : un marqueur au niveau du zéro. */
    marqueur: m.cle === "resultat" && f(Math.max(m.debut, m.fin)) - f(Math.min(m.debut, m.fin)) < SEUIL_DU_MARQUEUR,
  }));
}

export function CeQuiAFaitLeResultat({
  decomposition,
  causes,
  forme = "rituel",
}: {
  decomposition: DecompositionDuResultat;
  causes: readonly CauseDuResultat[];
  /** Le rituel plein écran (centré, plus grand) ou la synthèse d'un tour clos. */
  forme?: "rituel" | "synthese";
}) {
  const { marches } = decomposition;
  const geometrie = geometrieDeLaCascade(marches);
  const rituel = forme === "rituel";
  // Au rituel, les DEUX causes les plus fortes : l'écran du marché qui répond
  // doit garder son action dans la fenêtre. La synthèse d'un tour clos, qu'on
  // lit à loisir, en porte jusqu'à trois.
  const retenues = rituel ? causes.slice(0, 2) : causes;

  return (
    <section
      aria-label="Ce qui a fait le résultat"
      data-ce-qui-a-fait-le-resultat=""
      className={`grid gap-x-8 gap-y-4 text-left ${causes.length > 0 ? "md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : ""}`}
    >
      <div className="min-w-0">
        <p className="libelle font-semibold text-slate-200">
          Ce qui a fait le résultat
        </p>
        <ol
          aria-label="La cascade du résultat, du chiffre d'affaires au résultat net"
          data-cascade={forme}
          className="cascade mt-2"
          style={{ "--marches": marches.length } as CSSProperties}
        >
          {marches.map((m, i) => {
            const g = geometrie[i]!;
            const resultat = m.cle === "resultat";
            const teinte = resultat
              ? m.montant >= 0
                ? "bg-emerald-400"
                : "bg-red-400"
              : m.cle === "ca"
                ? "bg-[var(--donnee)]"
                : "bg-[var(--cascade-charge)]";
            return (
              <li
                key={m.cle}
                data-marche={m.cle}
                data-sens={g.sens}
                data-ancree={g.ancree ? "" : undefined}
                data-marqueur={g.marqueur ? "" : undefined}
                className={`cascade-marche ${rituel ? "text-sm" : "text-xs sm:text-sm"}`}
                style={
                  {
                    "--bas": g.bas,
                    "--haut": g.haut,
                    "--fin": g.fin,
                    "--entree": g.entree ?? g.fin,
                    "--zero": g.zero,
                  } as CSSProperties
                }
              >
                <span
                  className={`cascade-libelle leading-tight ${resultat ? "font-semibold text-slate-50" : "text-slate-300"}`}
                >
                  {m.libelle}
                </span>
                <span aria-hidden className="cascade-piste">
                  <span className="cascade-zero" />
                  {i > 0 ? <span className="cascade-lien cascade-lien-entrant" /> : null}
                  {i < marches.length - 1 ? (
                    <span className="cascade-lien cascade-lien-sortant" />
                  ) : null}
                  <span className={`cascade-barre ${teinte}`} />
                </span>
                {/* Le montant à l'encre, son signe écrit : la couleur ne le dit pas seule. */}
                <span
                  className={`cascade-valeur whitespace-nowrap tabular-nums ${
                    resultat ? "font-semibold text-slate-50" : "text-slate-100"
                  }`}
                >
                  {signe(m.montant)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {retenues.length > 0 ? (
        <div className="min-w-0">
          <p className="libelle font-semibold text-slate-200">
            Les causes les plus fortes
          </p>
          <ul
            className={`mt-2 space-y-2 leading-snug text-slate-200 ${rituel ? "text-sm sm:text-base" : "text-sm"}`}
          >
            {retenues.map((c) => (
              <li key={c.cle} data-cause={c.cle}>
                <strong className="font-semibold text-slate-50">{c.titre}</strong> : {c.texte}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
