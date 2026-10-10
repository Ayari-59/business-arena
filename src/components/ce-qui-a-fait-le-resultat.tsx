import type { CSSProperties } from "react";
import { formatEuro } from "@/lib/format";
import type { CauseDuResultat, DecompositionDuResultat } from "@/components/lecture-du-resultat";

/**
 * « CE QUI A FAIT LE RÉSULTAT » : OÙ SONT PASSÉES VOS VENTES ?
 *
 * Posé sous le chiffre du verdict (le rituel de fin de tour, la synthèse d'un
 * tour clos) : le chiffre, PUIS la cause, PUIS la place — la règle du rituel
 * tient. Ce n'est pas un tableau de bord : deux barres, une légende, une
 * phrase, rien à manipuler.
 *
 * LOT P8, PISTE A (choisie par le propriétaire : « plus parlant, plus évident,
 * avec plus de couleurs »). La cascade debout du lot P3, puis un relevé en
 * barres horizontales, se lisaient comme un compte ; un élève n'y voyait pas
 * d'un coup d'œil ce que ses ventes étaient devenues. Deux barres À LA MÊME
 * ÉCHELLE répondent à une seule question, « où sont passés vos 334 168 € de
 * ventes ? » :
 *
 *     [ Ventes 334 168 €                     dont il reste 40 009 € ]|
 *     [ coûts variables ][ structure ][▌][     reste 40 009 €     ]|
 *                       └─────── marge sur coût variable ──────────┘
 *
 *   · LA BARRE DES VENTES : le chiffre d'affaires, pleine, en bleu donnée ;
 *   · DESSOUS, CE QUI L'A « MANGÉE » : les coûts variables, les charges de
 *     structure, puis amortissements, intérêts et impôt, chacun dans SA teinte
 *     (trois créneaux de données de la charte, validés ensemble dans cet
 *     ordre) ; s'il y a bénéfice, « ce qui reste » en vert franc, qui finit
 *     PILE sous la fin des ventes ;
 *   · EN PERTE, les coûts dépassent la barre des ventes : ce qui manque se
 *     dessine en rouge franc DANS LE PROLONGEMENT DES VENTES, au-delà du trait
 *     vertical qui marque leur fin — les deux barres finissent au même endroit,
 *     et l'on voit que les ventes n'y arrivent pas ;
 *   · LA MARGE SUR COÛT VARIABLE, le mot que le verdict prononce, est une
 *     accolade sous les coûts : ce qui reste des ventes une fois les coûts
 *     variables payés ;
 *   · UNE LÉGENDE À L'ENCRE : chaque poste, sa pastille, son montant signé en
 *     chiffres tabulaires ; puis la phrase : « Il vous reste 40 009 € : c'est
 *     votre bénéfice. » / « Vos coûts dépassent vos ventes de 3 704 € : c'est
 *     votre perte. »
 *
 * LES PETITS MONTANTS NE DISPARAISSENT PAS. Un montant n'est écrit DANS une
 * barre que si elle peut le contenir (requête de conteneur sur la barre
 * elle-même) : jamais tronqué ; sinon, il est dans la légende. Une barre trop
 * étroite garde une largeur visible de 3 px, sans fausser l'ordre de grandeur.
 * Le bénéfice ou la perte sous 3 % de l'échelle devient le MARQUEUR du lot P4,
 * un trait épais et plus haut que les barres, au trait de fin des ventes ; son
 * montant s'écrit au bout de la barre des ventes, juste au-dessus ou à côté.
 *
 * LA COULEUR N'EST JAMAIS SEULE : chaque poste porte son nom et son montant
 * (légende), le bénéfice et la perte leur signe et leur mot.
 *
 * LECTEUR D'ÉCRAN : la question (qui dit le chiffre d'affaires), la marge, la
 * légende et la phrase se lisent ; le dessin est `aria-hidden`.
 *
 * Le composant ne calcule rien d'économique : la décomposition et les causes
 * viennent de `lecture-du-resultat.ts`, qui les lit dans les comptes du tour.
 */

/** Un montant de la légende, son signe toujours écrit (le moins typographique). */
function signe(montant: number): string {
  const arrondi = Math.round(montant);
  return `${arrondi > 0 ? "+" : arrondi < 0 ? "−" : ""}${formatEuro(Math.abs(montant))}`;
}

/**
 * LOT P4, REPRIS AU LOT P8 : UN PETIT RÉSULTAT RESTE LISIBLE, SANS MENTIR SUR
 * SA TAILLE. Sous 3 % de l'échelle, le reste (ou le manque) n'est pas une
 * barre faussement large : c'est un MARQUEUR posé au trait de fin des ventes,
 * et son montant s'écrit à côté.
 */
export const SEUIL_DU_MARQUEUR = 0.03;

/**
 * Les trois postes de coût, dans l'ordre du compte, et leur créneau de données
 * (`--serie-*`, charte). L'ORDRE EST FIXE : c'est celui que le validateur de
 * la compétence `dataviz` a passé (voisins et vert ou rouge du résultat).
 */
export const POSTES_DE_COUT = [
  { cle: "variables", libelle: "Coûts variables", creneau: "--serie-4" },
  { cle: "structure", libelle: "Charges de structure", creneau: "--serie-3" },
  { cle: "sous-ebe", libelle: "Amortissements, intérêts, impôt", creneau: "--serie-2" },
] as const;

export type CleDuPoste = (typeof POSTES_DE_COUT)[number]["cle"];

/**
 * LE PARTAGE DES VENTES, en fractions d'une échelle commune aux deux barres,
 * de zéro au plus grand des deux totaux (les ventes, ou les coûts). Exporté
 * pour la garde (`tests/unit/cascade-du-resultat.test.ts`).
 *
 * Un « bas du compte » négatif (des produits financiers ou exceptionnels, un
 * sauvetage, qui dépassent amortissements, intérêts et impôt) n'est pas un
 * coût : il s'ajoute aux ventes, au bout de leur barre (« autres produits »).
 */
export function geometrieDuPartage(d: DecompositionDuResultat) {
  const ventes = Math.max(0, d.chiffreDAffaires);
  const montants: Record<CleDuPoste, number> = {
    variables: d.coutsVariables,
    structure: d.structure,
    "sous-ebe": d.sousLExcedent,
  };
  const autresProduits = Math.max(0, -d.sousLExcedent);
  const ressources = ventes + autresProduits;
  const couts = POSTES_DE_COUT.reduce((s, p) => s + Math.max(0, montants[p.cle]), 0);
  const total = Math.max(ressources, couts) || 1;
  const f = (v: number) => v / total;
  let niveau = 0;
  const segments = POSTES_DE_COUT.map((p) => {
    const montant = Math.max(0, montants[p.cle]);
    const t = {
      cle: p.cle,
      libelle: p.libelle,
      creneau: p.creneau,
      montant,
      debut: f(niveau),
      fin: f(niveau + montant),
    };
    niveau += montant;
    return t;
  });
  const solde = ressources - couts;
  return {
    total,
    ventes: { debut: 0, fin: f(ventes), montant: ventes },
    autresProduits:
      autresProduits > 0 ? { debut: f(ventes), fin: f(ressources), montant: autresProduits } : null,
    /** Le trait vertical qui marque la fin des ventes (et de leurs autres produits). */
    finDesVentes: f(ressources),
    segments,
    couts,
    /** Ce qui reste : de la fin des coûts à la fin des ventes, dans la barre des coûts. */
    reste: solde >= 0 ? { debut: f(couts), fin: f(ressources), montant: solde } : null,
    /** Ce qui manque : au-delà de la fin des ventes, dans leur prolongement. */
    manque: solde < 0 ? { debut: f(ressources), fin: f(couts), montant: -solde } : null,
    /** La marge sur coût variable : de la fin des coûts variables à la fin des ventes. */
    marge: { debut: f(d.coutsVariables), fin: f(ventes), montant: ventes - d.coutsVariables },
    /** Le reste ou le manque, trop petit pour une barre : le marqueur. */
    marqueur: Math.abs(f(solde)) < SEUIL_DU_MARQUEUR,
  };
}

/**
 * LE RÉSULTAT EN MOTS, en morceaux pour mettre le montant et le mot en gras :
 * « Il vous reste | 40 009 € | : c'est votre | bénéfice | . »
 */
export function lectureDuResultat(resultat: number): {
  mot: "bénéfice" | "perte" | "équilibre";
  avant: string;
  montant: string;
  apres: string;
} {
  const arrondi = Math.round(resultat);
  if (arrondi > 0)
    return { mot: "bénéfice", avant: "Il vous reste ", montant: formatEuro(arrondi), apres: " : c'est votre " };
  if (arrondi < 0)
    return {
      mot: "perte",
      avant: "Vos coûts dépassent vos ventes de ",
      montant: formatEuro(-arrondi),
      apres: " : c'est votre ",
    };
  return { mot: "équilibre", avant: "Vos ventes couvrent tout juste vos coûts", montant: "", apres: " : c'est l'" };
}

const troncon = (t: { debut: number; fin: number }, extra: CSSProperties = {}) =>
  ({ "--debut": t.debut, "--fin": t.fin, ...extra }) as CSSProperties;

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
  const g = geometrieDuPartage(decomposition);
  const rituel = forme === "rituel";
  // Au rituel, les DEUX causes les plus fortes : l'écran du marché qui répond
  // doit garder son action dans la fenêtre. La synthèse d'un tour clos, qu'on
  // lit à loisir, en porte jusqu'à trois.
  const retenues = rituel ? causes.slice(0, 2) : causes;
  const lecture = lectureDuResultat(decomposition.resultat);
  const benefice = g.reste !== null;
  const solde = (g.reste ?? g.manque)!;
  // Le montant du reste (ou du manque) s'écrit au bout des ventes quand sa
  // propre barre est trop courte pour le porter (un quart de l'échelle).
  const soldeAuBoutDesVentes = solde.fin - solde.debut < 0.25;
  const ventesEcrites = formatEuro(g.ventes.montant);

  return (
    <section
      aria-label="Ce qui a fait le résultat"
      data-ce-qui-a-fait-le-resultat=""
      className={`grid gap-x-8 gap-y-5 text-left ${
        retenues.length > 0 ? "lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" : ""
      }`}
    >
      <div
        data-partage={forme}
        data-sens={benefice ? "benefice" : "perte"}
        data-marqueur={g.marqueur ? "" : undefined}
        className="partage min-w-0 text-sm"
        style={{ "--fin-des-ventes": g.finDesVentes } as CSSProperties}
      >
        <p className="partage-question text-base font-semibold text-slate-200">
          {g.ventes.montant > 0.5 ? (
            <>
              Où sont passés vos{" "}
              <span className="whitespace-nowrap tabular-nums text-slate-50">{ventesEcrites}</span> de
              ventes&nbsp;?
            </>
          ) : (
            <>Aucune vente ce tour : rien ne couvre vos coûts.</>
          )}
        </p>

        {/* LE DESSIN : deux barres à la même échelle, le trait de fin des ventes. */}
        <div aria-hidden className="partage-dessin">
          <div className="partage-rangee">
            <span data-barre-ventes="" className="partage-troncon partage-ventes" style={troncon(g.ventes)}>
              <span className="partage-etiquette partage-etiquette-ventes">
                <span className="partage-nom-des-ventes">Ventes {ventesEcrites}</span>
                {/* Le reste ou le manque, écrit au bout des ventes, au-dessus ou à
                    côté de sa marque (et toujours dans la phrase, dessous). */}
                {soldeAuBoutDesVentes ? (
                  <span data-etiquette-du-solde="" className="partage-etiquette-solde">
                    {benefice ? "dont il reste " : "il manque "}
                    {formatEuro(solde.montant)}
                  </span>
                ) : null}
              </span>
            </span>
            {g.autresProduits ? (
              <span
                data-autres-produits=""
                className="partage-troncon partage-autres-produits"
                style={troncon(g.autresProduits)}
              />
            ) : null}
            {g.manque ? (
              <span data-manque="" className="partage-troncon partage-manque" style={troncon(g.manque)}>
                <span className="partage-etiquette">
                  <span className="partage-etiquette-mot">il manque </span>
                  {formatEuro(g.manque.montant)}
                </span>
              </span>
            ) : null}
          </div>
          <div className="partage-rangee">
            {g.segments.map((s) =>
              s.montant > 0 ? (
                <span
                  key={s.cle}
                  data-segment={s.cle}
                  className="partage-troncon partage-cout"
                  style={troncon(s, { "--teinte": `var(${s.creneau})` } as CSSProperties)}
                >
                  <span className="partage-etiquette">{formatEuro(s.montant)}</span>
                </span>
              ) : null,
            )}
            {g.reste ? (
              <span data-reste="" className="partage-troncon partage-reste" style={troncon(g.reste)}>
                <span className="partage-etiquette">{formatEuro(g.reste.montant)}</span>
              </span>
            ) : null}
          </div>
          <span data-fin-des-ventes="" className="partage-fin-des-ventes" />
          {g.marge.montant > 0 ? (
            <span data-accolade-marge="" className="partage-accolade" style={troncon(g.marge)} />
          ) : null}
        </div>

        {/* LA MARGE SUR COÛT VARIABLE : ce qui reste des ventes, coûts variables payés. */}
        <p
          data-marge=""
          className="partage-marge text-slate-300"
          style={{ "--debut": g.marge.montant > 0 ? g.marge.debut : 0 } as CSSProperties}
        >
          <span className="partage-marge-texte">
            Marge sur coût variable{" "}
            <span className="whitespace-nowrap font-semibold tabular-nums text-slate-50">
              {signe(g.marge.montant)}
            </span>
          </span>
        </p>

        {/* LA LÉGENDE, À L'ENCRE : chaque poste, sa pastille, son montant signé. */}
        <ul aria-label="Ce qui a pris sur vos ventes, poste par poste" data-legende="" className="partage-legende">
          {g.segments.map((s) => (
            <li key={s.cle} data-poste={s.cle} className="partage-poste">
              <span
                aria-hidden
                className="partage-pastille"
                style={{ "--teinte": `var(${s.creneau})` } as CSSProperties}
              />
              <span className="partage-poste-nom text-slate-300">{s.libelle}</span>
              <span data-montant="" className="partage-montant tabular-nums text-slate-50">
                {signe(-s.montant)}
              </span>
            </li>
          ))}
          {g.autresProduits ? (
            <li data-poste="autres-produits" className="partage-poste">
              <span aria-hidden className="partage-pastille partage-pastille-ventes" />
              <span className="partage-poste-nom text-slate-300">Autres produits (financiers, exceptionnels)</span>
              <span data-montant="" className="partage-montant tabular-nums text-slate-50">
                {signe(g.autresProduits.montant)}
              </span>
            </li>
          ) : null}
        </ul>
        <p data-lecture-du-resultat="" data-mot={lecture.mot} className="partage-conclusion text-slate-200">
          <span
            aria-hidden
            className={`partage-pastille ${benefice ? "partage-pastille-reste" : "partage-pastille-manque"}`}
          />
          <span className="partage-phrase">
            {lecture.avant}
            {lecture.montant ? (
              <strong className="whitespace-nowrap font-semibold tabular-nums text-slate-50">
                {lecture.montant}
              </strong>
            ) : null}
            {lecture.apres}
            <strong className="font-semibold text-slate-50">{lecture.mot}</strong>.
          </span>
          <span data-montant="" className="partage-montant font-semibold tabular-nums text-slate-50">
            {signe(decomposition.resultat)}
          </span>
        </p>
      </div>
      {retenues.length > 0 ? (
        <div className="min-w-0">
          <p className="libelle font-semibold text-slate-200">Les causes les plus fortes</p>
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
