"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Tiroir } from "@/components/tiroir";
import { Icone, type NomDIcone } from "@/components/icone";

/**
 * LES TEXTES D'AIDE SE RANGENT SUR TÉLÉPHONE, PAS LES DÉCISIONS.
 *
 * Un formulaire de décision explique chaque levier : comment se lit une marge,
 * pourquoi une capacité se partage. Ces phrases servent, mais une fois, et sur
 * un écran de six centimètres elles repoussent les champs sous le pouce. Sur
 * téléphone elles se rangent donc dans un tiroir « Comprendre », fermé ; ailleurs
 * elles restent en clair, comme avant.
 *
 * La règle du site pour tout repli tient ici : il range ce qu'on consulte, jamais
 * ce qui décide. Un champ, un choix de fournisseur, une case à cocher ne passent
 * pas par cette enveloppe — seules les explications qui les entourent.
 *
 * Le contexte porte le seul fait nécessaire, « on est sur un téléphone », posé
 * une fois par le serveur : les composants du formulaire n'ont pas à le recevoir
 * de proche en proche.
 */
export const TelephoneContexte = createContext(false);

export function Aide({
  titre = "Comprendre",
  children,
}: {
  titre?: string;
  children: ReactNode;
}) {
  const telephone = useContext(TelephoneContexte);
  if (!telephone) return <>{children}</>;
  // Fermé aussi en parcours : l'aide se consulte, elle ne prend pas l'écran d'une carte de décision.
  // LOT 6D : une aide est de la prose à lire, une feuille de papier posée sur la carte.
  return (
    <Tiroir titre={titre} ferme surface="papier">
      {children}
    </Tiroir>
  );
}

/**
 * Un panneau de chiffres qu'on CONSULTE : une carte à plat ailleurs, un tiroir
 * fermé sur téléphone, avec dans son résumé le chiffre qu'il ne faut pas manquer.
 * C'est la même règle que pour l'aide : il range ce qu'on lit, pas ce qu'on remplit.
 */
export function PanneauConsulte({
  titre,
  icone,
  resume,
  children,
}: {
  titre: string;
  /** Le repère dessiné du panneau, le même sur téléphone (dans le tiroir) qu'ailleurs. */
  icone?: NomDIcone;
  resume: string;
  children: ReactNode;
}) {
  const telephone = useContext(TelephoneContexte);
  if (telephone) {
    return (
      <Tiroir titre={titre} {...(icone ? { icone } : {})} quoi={resume} ferme>
        {children}
      </Tiroir>
    );
  }
  return (
    // LOT 6E : un panneau du cockpit (son sol, son arête), pas un cadre ; et son
    // repère à la teinte du métier : un titre n'est pas une action.
    <div className="panneau px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200">
        {icone ? (
          <Icone nom={icone} className="h-4 w-4 text-[color:var(--metier,var(--color-slate-300))]" />
        ) : null}
        {titre}
      </p>
      {children}
    </div>
  );
}
