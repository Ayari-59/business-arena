"use client";

import { CLASSES_D_EN_TETE, IntituleDeColonne } from "./en-tete-de-colonne";
import { useId, useState } from "react";
import { bouton } from "@/components/bouton";
import { changerDeSigne } from "@/pedagogy/cours/correcteur";
import {
  cleDeCellule,
  libelleDeCellule,
  valeurEcrite,
  type CorrectionDuTableau,
  type SaisiesDuTableau,
  type TableauACompleter,
} from "@/pedagogy/cours/tableau-a-completer";

/**
 * LE TABLEAU À COMPLÉTER, À L'ÉCRAN (l'étape « a-completer » du guide, chapitre-guide.tsx).
 *
 * LISIBLE ET UTILISABLE AU CLAVIER ET AU TÉLÉPHONE :
 *   · le tableau est un vrai tableau (en-têtes de ligne et de colonne), et chaque case à saisir porte
 *     son nom, « ligne, colonne », pour le lecteur d'écran comme pour la correction ;
 *   · la tabulation suit la lecture, ligne par ligne ; Entrée vérifie (le formulaire est celui de
 *     l'étape) ; la zone du tableau se prend au clavier pour défiler de côté ;
 *   · sur téléphone, le tableau défile seul, de côté, la colonne des libellés restant à sa place :
 *     la page, elle, ne déborde pas ; le clavier est numérique (`inputMode="decimal"`) ;
 *   · un téléphone n'a pas de touche moins : un seul bouton change le signe de la dernière case
 *     touchée, sans rien dire du signe attendu d'aucune.
 *
 * LA CORRECTION, CELLULE PAR CELLULE : une case fausse est marquée (✗, `aria-invalid`), sa remarque
 * lui est attachée (`aria-describedby`) et se relit sous le tableau ; une case juste est marquée ✓.
 */

/** La marque d'une case vérifiée, ✓ ou ✗ ; le lecteur d'écran lit `aria-invalid` et la remarque. */
function marque(juste: boolean | undefined) {
  if (juste === undefined) return null;
  return (
    <span className={`ml-1 inline-block w-4 text-xs ${juste ? "text-emerald-400" : "text-red-400"}`} aria-hidden="true">
      {juste ? "✓" : "✗"}
    </span>
  );
}

export function GrilleACompleter({
  grille,
  saisies,
  onSaisie,
  correction,
  fait,
}: {
  grille: TableauACompleter;
  saisies: SaisiesDuTableau;
  onSaisie: (cle: string, valeur: string) => void;
  /** La dernière vérification, ou rien : les cases ne sont alors ni justes ni fausses. */
  correction: CorrectionDuTableau | null;
  /** L'étape est réussie : les cases montrent les valeurs justes, et ne se modifient plus. */
  fait: boolean;
}) {
  const racine = useId();
  const [active, setActive] = useState<{ ligne: number; colonne: number } | null>(null);
  const etats = new Map((correction?.cellules ?? []).map((c) => [cleDeCellule(c.ligne, c.colonne), c]));
  const titre = `${racine}-titre`;
  const nomActif = active ? libelleDeCellule(grille, active.ligne, active.colonne) : null;
  return (
    <div className="grid min-w-0 gap-2" data-tableau-a-completer="">
      <figure className="papier grid min-w-0 max-w-full gap-2 rounded-xl p-3 sm:p-4">
        <figcaption id={titre} className="text-sm font-semibold">
          {grille.titre}
        </figcaption>
        {/* Le tableau défile seul, de côté : sur téléphone, la page ne déborde pas. */}
        <div className="max-w-full overflow-x-auto overscroll-x-contain" role="region" aria-labelledby={titre} tabIndex={0} data-defilement-du-tableau="">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th scope="col" className="sticky left-0 z-10 bg-[var(--papier)] py-1.5 pr-3 text-left">
                  <span className="sr-only">Ligne</span>
                </th>
                {grille.colonnes.map((c) => (
                  <th key={c} scope="col" className={CLASSES_D_EN_TETE}>
                    <IntituleDeColonne intitule={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grille.lignes.map((l, i) => (
                <tr key={l.libelle} className={`border-b border-slate-200 last:border-0 ${l.fort ? "border-t border-t-slate-400 font-semibold" : ""}`} data-ligne={l.libelle}>
                  <th scope="row" className="sticky left-0 z-10 max-w-32 bg-[var(--papier)] py-1.5 pr-2 text-left font-normal hyphens-auto sm:max-w-64 sm:pr-3">
                    <span className={l.fort ? "font-semibold" : ""}>{l.libelle}</span>
                  </th>
                  {l.cellules.map((c, j) => {
                    const cle = cleDeCellule(i, j);
                    if (!c.saisir) {
                      return (
                        <td key={j} className="whitespace-nowrap px-1 py-1.5 text-right tabular-nums sm:px-2">
                          {valeurEcrite(c)}
                        </td>
                      );
                    }
                    const etat = etats.get(cle);
                    const nom = libelleDeCellule(grille, i, j);
                    const remarque = etat && !etat.juste ? `${racine}-remarque-${i}-${j}` : undefined;
                    return (
                      <td key={j} className="px-1 py-1 text-right" data-cellule={cle}>
                        <span className="inline-flex items-center justify-end">
                          <input
                            className={`champ w-20 min-w-0 px-1.5 py-1.5 text-right tabular-nums sm:w-28 sm:px-2 ${etat && !etat.juste ? "border-red-400" : ""}`}
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label={nom}
                            aria-invalid={etat ? !etat.juste : undefined}
                            aria-describedby={remarque}
                            value={saisies[cle] ?? ""}
                            disabled={fait}
                            onFocus={() => setActive({ ligne: i, colonne: j })}
                            onChange={(e) => onSaisie(cle, e.target.value)}
                          />
                          {c.unite && <span className="ml-1 text-xs text-slate-400">{c.unite}</span>}
                          {marque(fait ? undefined : etat?.juste)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
      {!fait && (
        <div>
          <button
            type="button"
            className={bouton({ variante: "secondaire", taille: "s" })}
            disabled={!active}
            aria-label={nomActif ? `Changer le signe : ${nomActif}` : "Changer le signe de la case touchée"}
            onClick={() => {
              if (!active) return;
              const cle = cleDeCellule(active.ligne, active.colonne);
              onSaisie(cle, changerDeSigne(saisies[cle] ?? ""));
            }}
          >
            +/− {nomActif ? <span className="font-normal">· {nomActif}</span> : null}
          </button>
        </div>
      )}
      {correction && !correction.juste && !fait && <RemarquesDuTableau grille={grille} correction={correction} racine={racine} />}
    </div>
  );
}

/** Ce qui ne va pas, case par case : la remarque de chaque case fausse, attachée à sa case. */
export function RemarquesDuTableau({ grille, correction, racine }: { grille: TableauACompleter; correction: CorrectionDuTableau; racine: string }) {
  const fausses = correction.cellules.filter((c) => !c.juste);
  return (
    <div className="encadre-perte max-w-2xl rounded-lg px-4 py-3 text-sm" role="alert" data-remarques-du-tableau="">
      <p className="font-semibold">
        {fausses.length === 1 ? "Une case ne convient pas encore :" : `${fausses.length} cases ne conviennent pas encore :`}
      </p>
      <ul className="mt-1 grid list-disc gap-1 pl-5">
        {fausses.map((c) => (
          <li key={cleDeCellule(c.ligne, c.colonne)} id={`${racine}-remarque-${c.ligne}-${c.colonne}`} data-remarque={cleDeCellule(c.ligne, c.colonne)}>
            <strong className="font-semibold">{libelleDeCellule(grille, c.ligne, c.colonne)} : </strong>
            {c.remarque}.
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Le calcul de chaque case à saisir, une fois l'étape réussie ou la correction demandée. */
export function CalculsDuTableau({ grille }: { grille: TableauACompleter }) {
  const lignes = grille.lignes.flatMap((l, i) => l.cellules.flatMap((c, j) => (c.saisir && c.calcul ? [{ cle: cleDeCellule(i, j), nom: libelleDeCellule(grille, i, j), calcul: c.calcul }] : [])));
  return (
    <details className="encadre-neutre max-w-3xl rounded-lg px-4 py-3 text-sm" open data-calculs-du-tableau="">
      <summary className="cursor-pointer font-semibold">Les calculs, case par case</summary>
      <ul className="mt-2 grid gap-1">
        {lignes.map((x) => (
          <li key={x.cle}>
            <strong className="font-semibold">{x.nom} : </strong>
            {x.calcul}
          </li>
        ))}
      </ul>
    </details>
  );
}
