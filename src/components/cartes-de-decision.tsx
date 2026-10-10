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
}

export interface ContexteDesCartes {
  actif: boolean;
  courante: string;
}

export const CartesContexte = createContext<ContexteDesCartes>({
  actif: false,
  courante: "",
});

/** Un bloc se montre sur sa carte, et sur elle seule. */
export function estMontre(contexte: ContexteDesCartes, cles: string[]): boolean {
  return cles.includes(contexte.courante);
}

export function useModeCartes(): ContexteDesCartes {
  return useContext(CartesContexte);
}

/**
 * Un bloc qui n'est montré que sur sa carte. Les autres restent dans le document,
 * masqués : leurs champs partent avec le formulaire, et le navigateur peut les
 * valider.
 */
export function Carte({ cle, children }: { cle: string | string[]; children: ReactNode }) {
  const contexte = useModeCartes();
  if (!contexte.actif) return <>{children}</>;
  const cles = Array.isArray(cle) ? cle : [cle];
  return (
    <div
      data-carte={cles.join(" ")}
      hidden={!estMontre(contexte, cles)}
      className="col-span-full motion-safe:animate-carte-fondu"
    >
      {children}
    </div>
  );
}

/** Le récapitulatif de fin de parcours : chaque réponse, et de quoi la corriger. */
/**
 * FINANCER ET INVESTIR SE LISENT SUR UNE SEULE LIGNE DU RÉCAPITULATIF.
 *
 * Les deux ont leur carte (d'où vient l'argent, où il va), mais le récapitulatif
 * d'un téléphone est une liste de lignes tactiles de 44 px : en ajouter une pour
 * l'investissement, ouvert dès le premier niveau, le faisait déborder de l'écran
 * dès le niveau 3. La ligne fusionnée dit ce qui est décidé et rouvre le
 * financement ; l'investissement est la carte d'après.
 */
export function fusionnerFinancerEtInvestir<T extends { cle: string; nom: string; valeur: string }>(
  lignes: T[],
): T[] {
  const financement = lignes.find((l) => l.cle === "financement");
  const investissement = lignes.find((l) => l.cle === "investissement");
  if (!financement || !investissement) return lignes;
  const decide = [financement.valeur, investissement.valeur].filter((v) => !/^aucun/i.test(v));
  return lignes
    .filter((l) => l.cle !== "investissement")
    .map((l) =>
      l.cle === "financement"
        ? { ...l, nom: "Financer et investir", valeur: decide.length > 0 ? decide.join(", ") : "Aucun" }
        : l,
    );
}

export function RecapDesDecisions({
  lignes,
  surModifier,
}: {
  lignes: { cle: string; nom: string; valeur: string }[];
  surModifier: (cle: string) => void;
}) {
  return (
    <ul className="panneau-info divide-y divide-white/10 overflow-hidden">
      {lignes.map((l) => (
        <li key={l.cle}>
          <button
            type="button"
            onClick={() => surModifier(l.cle)}
            className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-1.5 text-left"
          >
            <span className="min-w-0 flex-1 text-base text-slate-300">{l.nom}</span>
            <span className="flex max-w-[58%] shrink-0 items-center gap-2 text-base font-semibold text-slate-50">
              {/* La valeur passe à la ligne plutôt que de se tronquer : « Acce… » ne dit pas
                  si la commande est prise ou refusée. Deux lignes au plus, pour une note longue. */}
              <span className="line-clamp-2 min-w-0 break-words text-right">{l.valeur}</span>
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
