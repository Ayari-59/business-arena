"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
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
 *
 * SUR TÉLÉPHONE, UN BANDEAU BAS QUI SE REPLIE (audit UX du 11 novembre 2026, P2-2). Ouverte à 390 px,
 * elle couvrait 46 % de l'écran et 5 des 8 paragraphes visibles, données du calcul comprises. Elle
 * devient un bandeau collé au bas de l'écran, sur toute la largeur, aux touches plus basses et sans
 * l'historique (le dernier résultat reste dans le champ) ; la page lui laisse sa hauteur en bas
 * (globals.css), si bien que tout l'énoncé se fait défiler au-dessus. Un geste la replie sur sa seule
 * ligne de calcul, valeur gardée, et la déplie. Son clavier remplace celui du téléphone, qui ne
 * s'ouvre plus par-dessus. ÉCHAP la ferme et rend le focus au bouton « Calculatrice » (il retombait
 * sur « Aller au contenu », en haut de la page).
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

/** Un écran tactile : le clavier de la calculatrice y remplace celui du téléphone. */
const TACTILE = "(pointer: coarse)";
const suivreLeTactile = (prevenir: () => void) => {
  const m = window.matchMedia(TACTILE);
  m.addEventListener("change", prevenir);
  return () => m.removeEventListener("change", prevenir);
};

export function Calculatrice() {
  const [ouverte, setOuverte] = useState(false);
  const [repliee, setRepliee] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [historique, setHistorique] = useState<{ expression: string; resultat: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cible, setCible] = useState<HTMLInputElement | null>(null);
  const [rendreLeFocus, setRendreLeFocus] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const tactile = useSyncExternalStore(suivreLeTactile, () => window.matchMedia(TACTILE).matches, () => false);

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

  // Fermée au clavier (Échap) ou par son bouton du bandeau : le focus revient au bouton « Calculatrice ».
  useEffect(() => {
    if (ouverte || !rendreLeFocus) return;
    bouton.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRendreLeFocus(false);
  }, [ouverte, rendreLeFocus]);

  const fermer = () => {
    setOuverte(false);
    setRendreLeFocus(true);
  };

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
  // Repliée, la calculatrice ne garde que sa ligne de calcul : sur téléphone seulement.
  const replier = repliee ? "max-sm:hidden" : "";

  return (
    // SUR TÉLÉPHONE, UN ONGLET DANS LA MARGE (novembre 2026). Le rond de 44 px posé à
    // 8 px du coin (audit d'octobre) mordait encore sur le bord droit des cartes, celle du
    // laboratoire comprise : à 390 px, aucune marge ne loge un rond. Fermée, la calculatrice
    // devient un onglet de 32 × 56 px collé au bord droit de l'écran (zone sûre comprise), et
    // la page lui laisse cette bande (`main:has([data-calculatrice])`, globals.css) : il ne
    // recouvre plus rien, où que l'on soit dans la page. Son nom accessible reste « Calculatrice ».
    // Ouverte, elle est un bandeau bas sur toute la largeur (voir l'en-tête).
    <div
      data-calculatrice=""
      data-ouverte={ouverte ? "" : undefined}
      data-repliee={ouverte && repliee ? "" : undefined}
      className={`fixed z-40 grid justify-items-end gap-2 sm:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:right-4 ${
        ouverte
          ? "max-sm:inset-x-0 max-sm:bottom-0"
          : "bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))] right-[env(safe-area-inset-right,0px)]"
      }`}
    >
      {ouverte && (
        <section
          id={id}
          aria-label="Calculatrice"
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            fermer();
          }}
          className="carte grid gap-3 bg-slate-950 p-3 shadow-xl max-sm:w-full max-sm:gap-2 max-sm:rounded-b-none max-sm:px-3 max-sm:pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] max-sm:pt-2 sm:w-[min(20rem,calc(100vw-2rem))]"
          data-bandeau-de-la-calculatrice=""
        >
          {historique.length > 0 && (
            <ol className="grid gap-0.5 text-right text-xs tabular-nums text-slate-400 max-sm:hidden" aria-label="Derniers calculs">
              {historique.map((h, i) => (
                <li key={`${i}-${h.expression}`}>
                  {h.expression} = <span className="text-slate-200">{h.resultat}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={champ}
              aria-label="Calcul"
              className="champ min-w-0 flex-1 px-2.5 py-2 text-right text-lg tabular-nums"
              // Sur un écran tactile, les touches de la calculatrice : le clavier du téléphone ne
              // s'ouvre pas par-dessus l'énoncé. Un clavier branché écrit toujours.
              inputMode={tactile ? "none" : "text"}
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
                }
              }}
            />
            {/* Sur téléphone : la replier d'un geste, valeur gardée, et la fermer, depuis le bandeau. */}
            <button
              type="button"
              className="champ min-h-10 shrink-0 px-3 text-sm font-semibold sm:hidden"
              aria-expanded={!repliee}
              aria-controls={`${id}-touches`}
              data-replier-la-calculatrice=""
              onClick={() => setRepliee((r) => !r)}
            >
              {repliee ? "Déplier" : "Replier"}
            </button>
            <button type="button" className="champ min-h-10 shrink-0 px-3 text-sm sm:hidden" aria-label="Fermer la calculatrice" onClick={fermer}>
              ✕
            </button>
          </div>
          <p className={`min-h-4 text-xs text-rose-300 ${erreur ? "" : "max-sm:hidden"}`} role="status">
            {erreur ?? ""}
          </p>
          <div id={`${id}-touches`} className={`grid grid-cols-4 gap-1.5 max-sm:gap-1 ${replier}`}>
            {TOUCHES.flat().map((t) => (
              <button
                key={t}
                type="button"
                className={`champ min-h-11 text-base tabular-nums max-sm:min-h-9 ${t === "=" ? "bg-amber-400 font-semibold text-slate-950" : ""}`}
                aria-label={t === "⌫" ? "Effacer le dernier signe" : t === "=" ? "Égal" : undefined}
                onClick={() => toucher(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={`flex flex-wrap items-center justify-between gap-2 ${replier}`}>
            <button
              type="button"
              className="min-h-6 text-xs text-slate-400 underline-offset-4 hover:underline"
              onClick={() => {
                setSaisie("");
                setErreur(null);
              }}
            >
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
        ref={bouton}
        type="button"
        aria-expanded={ouverte}
        aria-controls={id}
        data-bouton-calculatrice=""
        className={`border border-white/15 bg-slate-900 text-sm font-semibold text-slate-100 shadow-lg hover:border-amber-400/50 ${
          ouverte
            ? "rounded-full px-4 py-2.5 max-sm:hidden"
            : "grid h-14 w-8 place-items-center rounded-l-xl border-r-0 sm:h-auto sm:w-auto sm:rounded-full sm:border-r sm:px-4 sm:py-2.5"
        }`}
        onClick={() => (ouverte ? fermer() : setOuverte(true))}
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
