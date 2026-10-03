"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Tiroir } from "@/components/tiroir";

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
  return (
    <Tiroir titre={titre} ferme>
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
  resume,
  children,
}: {
  titre: string;
  resume: string;
  children: ReactNode;
}) {
  const telephone = useContext(TelephoneContexte);
  if (telephone) {
    return (
      <Tiroir titre={titre} quoi={resume} ferme>
        {children}
      </Tiroir>
    );
  }
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2 sm:px-3.5 sm:py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titre}</p>
      {children}
    </div>
  );
}
