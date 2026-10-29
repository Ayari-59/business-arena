"use client";

import { useEffect, useId, useRef, useState } from "react";
import { calculer, enSaisie } from "@/pedagogy/cours/calculatrice";

/**
 * LA CALCULATRICE DU COURS (demande du propriétaire, octobre 2026).
 *
 * Une calculatrice simple, comme au lycée, dans les chapitres et les cas
 * pratiques. Un bouton en bas de l'écran l'ouvre ; on tape au clavier ou sur
 * ses touches. Les derniers calculs restent affichés, et « Reporter » écrit le
 * résultat dans la case de réponse où l'élève était, à la française (virgule,
 * sans espace de milliers), comme s'il l'avait tapé. L'élève relit donc ce
 * qu'il reporte : rien ne se valide sans lui.
 *
 * L'enseignant peut la retirer à sa classe (espace enseignant) : la page ne la
 * rend alors pas du tout.
 */

/** Les cases de réponse : les montants et les écritures, qui se saisissent en décimal. */
const EST_UNE_CASE = (el: Element | null): el is HTMLInputElement =>
  el instanceof HTMLInputElement && el.inputMode === "decimal" && !el.closest("[data-calculatrice]") && !el.disabled;

/** Combien de calculs l'historique garde. */
const HISTORIQUE = 4;

const TOUCHES: readonly (readonly string[])[] = [
  ["(", ")", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ",", "⌫", "="],
];

/** Le nom d'une case, pour dire où le résultat va : son libellé, sinon son nom accessible. */
function nomDeLaCase(el: HTMLInputElement): string {
  return el.labels?.[0]?.textContent?.trim() || el.getAttribute("aria-label") || "la case";
}

/** Écrire dans une case tenue par React : le setter natif, puis l'événement qu'il écoute. */
function ecrireDans(el: HTMLInputElement, valeur: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(el, valeur);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.focus();
}

export function Calculatrice() {
  const [ouverte, setOuverte] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [historique, setHistorique] = useState<{ expression: string; resultat: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cible, setCible] = useState<HTMLInputElement | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const id = useId();

  // La dernière case de réponse où l'élève est passé : c'est là que « Reporter » écrit.
  useEffect(() => {
    const suivre = (e: FocusEvent) => {
      if (EST_UNE_CASE(e.target as Element)) setCible(e.target as HTMLInputElement);
    };
    document.addEventListener("focusin", suivre);
    return () => document.removeEventListener("focusin", suivre);
  }, []);

  useEffect(() => {
    if (ouverte) champ.current?.focus();
  }, [ouverte]);

  const egal = () => {
    const r = calculer(saisie);
    if (!r.ok) {
      setErreur(r.erreur);
      return;
    }
    setErreur(null);
    const resultat = enSaisie(r.valeur);
    setHistorique((h) => [{ expression: saisie, resultat }, ...h].slice(0, HISTORIQUE));
    setSaisie(resultat);
  };

  const toucher = (t: string) => {
    if (t === "=") return egal();
    setErreur(null);
    if (t === "⌫") return setSaisie((s) => s.slice(0, -1));
    setSaisie((s) => s + (["÷", "×", "−", "+", "%"].includes(t) ? ` ${t} ` : t).replace(/^ /, ""));
  };

  // La case visée : la dernière touchée si elle est encore là, sinon la première case vide de l'étape.
  const caseVisee = (): HTMLInputElement | null => {
    if (cible && cible.isConnected && !cible.disabled) return cible;
    const cases = [...document.querySelectorAll("main input")].filter(EST_UNE_CASE);
    return cases.find((c) => c.value === "") ?? cases[0] ?? null;
  };
  const resultat = historique[0]?.resultat ?? null;
  const visee = ouverte ? caseVisee() : null;

  return (
    // SUR TÉLÉPHONE, UN ROND DANS LE COIN (audit d'octobre 2026). À 390 px, la
    // pastille « Calculatrice » (près de 110 px de large, à 16 px du bord) couvrait
    // la fin des lignes du texte, l'encadré « À retenir » compris. Fermée, elle
    // devient un rond de 44 px, posé à 8 px du coin : il ne couvre plus que la
    // marge et deux ou trois lettres. Son nom accessible reste « Calculatrice ».
    <div data-calculatrice="" className="fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] right-2 z-40 grid justify-items-end gap-2 sm:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:right-4">
      {ouverte && (
        <section
          id={id}
          aria-label="Calculatrice"
          className="carte grid w-[min(20rem,calc(100vw-2rem))] gap-3 bg-slate-950 p-3 shadow-xl"
        >
          {historique.length > 0 && (
            <ol className="grid gap-0.5 text-right text-xs tabular-nums text-slate-400" aria-label="Derniers calculs">
              {historique.map((h, i) => (
                <li key={`${i}-${h.expression}`}>
                  {h.expression} = <span className="text-slate-200">{h.resultat}</span>
                </li>
              ))}
            </ol>
          )}
          <input
            ref={champ}
            aria-label="Calcul"
            className="champ w-full px-2.5 py-2 text-right text-lg tabular-nums"
            inputMode="text"
            autoComplete="off"
            value={saisie}
            onChange={(e) => {
              setErreur(null);
              setSaisie(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "=") {
                e.preventDefault();
                egal();
              } else if (e.key === "Escape") setOuverte(false);
            }}
          />
          <p className="min-h-4 text-xs text-rose-300" role="status">
            {erreur ?? ""}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {TOUCHES.flat().map((t) => (
              <button
                key={t}
                type="button"
                className={`champ min-h-11 text-base tabular-nums ${t === "=" ? "bg-amber-400 font-semibold text-slate-950" : ""}`}
                aria-label={t === "⌫" ? "Effacer le dernier signe" : t === "=" ? "Égal" : undefined}
                onClick={() => toucher(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="text-xs text-slate-400 underline-offset-4 hover:underline" onClick={() => {
              setSaisie("");
              setErreur(null);
            }}>
              Tout effacer
            </button>
            {resultat !== null && visee && (
              <button
                type="button"
                data-reporter=""
                className="rounded-lg border border-amber-400/50 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
                onClick={() => ecrireDans(visee, resultat)}
              >
                Reporter {resultat} dans « {nomDeLaCase(visee)} »
              </button>
            )}
          </div>
        </section>
      )}
      <button
        type="button"
        aria-expanded={ouverte}
        aria-controls={id}
        data-bouton-calculatrice=""
        className={`rounded-full border border-white/15 bg-slate-900 text-sm font-semibold text-slate-100 shadow-lg hover:border-amber-400/50 ${
          ouverte ? "px-4 py-2.5" : "grid h-11 w-11 place-items-center sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
        }`}
        onClick={() => setOuverte((o) => !o)}
      >
        {ouverte ? (
          "Fermer la calculatrice"
        ) : (
          <>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
            <span className="max-sm:sr-only">Calculatrice</span>
          </>
        )}
      </button>
    </div>
  );
}
