"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * UNE DÉCISION PAR ÉCRAN, SUR TÉLÉPHONE.
 *
 * Le formulaire de décision range ses champs en familles et en étapes ; en
 * parcours (voir parcours-mobile.tsx), il se présente en CARTES : une question,
 * une réponse, la suivante. Les champs ne changent pas — ils restent dans le
 * formulaire, qui part toujours en entier —, seul ce qu'on montre change.
 *
 * Ce module porte le contexte (en mode cartes ? laquelle est affichée ?), le bloc
 * qui n'apparaît que sur sa carte, et le récapitulatif de fin. Hors parcours le
 * contexte est inactif et chaque bloc est transparent : le formulaire est celui
 * du grand écran, à l'identique.
 */
export interface DefCarte {
  cle: string;
  /** L'étape (section du formulaire) qui porte les champs de cette carte. */
  etape: string;
  /** Le nom court, pour le récapitulatif : « Prix de vente ». */
  nom: string;
  /** La question posée en tête de carte : « À quel prix vendez-vous ? ». */
  question: string;
  /** Ce que le joueur a répondu, lu sur le formulaire. Absent : pas de ligne au récapitulatif. */
  resume?: (donnees: FormData) => string;
  /**
   * Un levier dont on peut se passer : la carte pose d'abord la question (« en
   * avez-vous besoin ? ») et n'ouvre ses champs que sur un « oui ». Sans cela, le
   * parcours ferait traverser dix écrans de champs à zéro.
   */
  facultative?: { passer: string; ouvrir: string; aide: string };
}

export interface ContexteDesCartes {
  actif: boolean;
  courante: string;
  /** Les cartes facultatives dont les champs ne sont pas encore ouverts. */
  fermees: ReadonlySet<string>;
}

const AUCUNE: ReadonlySet<string> = new Set();
export const CartesContexte = createContext<ContexteDesCartes>({
  actif: false,
  courante: "",
  fermees: AUCUNE,
});

/** Un bloc se montre sur sa carte, sauf si cette carte attend encore le « oui ». */
export function estMontre(
  contexte: ContexteDesCartes,
  cles: string[],
  memeFermee = false,
): boolean {
  if (!cles.includes(contexte.courante)) return false;
  return memeFermee || !contexte.fermees.has(contexte.courante);
}

export function useModeCartes(): ContexteDesCartes {
  return useContext(CartesContexte);
}

/**
 * Un bloc qui n'est montré que sur sa carte. Les autres restent dans le document,
 * masqués : leurs champs partent avec le formulaire, et le navigateur peut les
 * valider.
 */
export function Carte({
  cle,
  memeFermee = false,
  children,
}: {
  cle: string | string[];
  /** Reste visible quand la carte facultative n'est pas encore ouverte (le contexte qui éclaire la question). */
  memeFermee?: boolean;
  children: ReactNode;
}) {
  const contexte = useModeCartes();
  if (!contexte.actif) return <>{children}</>;
  const cles = Array.isArray(cle) ? cle : [cle];
  return (
    <div
      data-carte={cles.join(" ")}
      hidden={!estMontre(contexte, cles, memeFermee)}
      className="col-span-full"
    >
      {children}
    </div>
  );
}

/** Le récapitulatif de fin de parcours : chaque réponse, et de quoi la corriger. */
export function RecapDesDecisions({
  lignes,
  surModifier,
}: {
  lignes: { cle: string; nom: string; valeur: string }[];
  surModifier: (cle: string) => void;
}) {
  return (
    <ul className="carte divide-y divide-white/10 overflow-hidden">
      {lignes.map((l) => (
        <li key={l.cle}>
          <button
            type="button"
            onClick={() => surModifier(l.cle)}
            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left"
          >
            <span className="min-w-0 text-base text-slate-300">{l.nom}</span>
            <span className="flex min-w-0 items-center gap-2 text-base font-semibold text-slate-50">
              <span className="truncate">{l.valeur}</span>
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="shrink-0 text-slate-400"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
              <span className="sr-only">Modifier</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
