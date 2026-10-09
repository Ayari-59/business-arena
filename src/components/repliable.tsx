import type { ReactNode } from "react";
import type { SurfaceDuRepli } from "@/config/surfaces-de-lecture";

/**
 * UN REPLI, DESSINÉ UNE FOIS : UN CHEVRON QUI PIVOTE, UN BORD PLEIN.
 *
 * Deux replis du site gardaient le triangle du navigateur (« Codes de reprise
 * des joueurs », « Les N observations » du profil décisionnel) : un petit
 * triangle noir, dessiné différemment d'un navigateur à l'autre, qui donnait
 * un air de brouillon à côté des tiroirs maison. Le pointillé, lui, est
 * réservé à ce qui est vide ou en attente : un repli fermé n'est pas vide, il
 * est rangé.
 *
 * L'ÉLÉMENT RESTE `<details>` : le navigateur fournit le clavier (Entrée et
 * Espace sur le résumé), l'état ouvert ou fermé aux lecteurs d'écran et la
 * recherche dans la page, sans une ligne de script. Le chevron n'est qu'un
 * dessin, retiré de l'arbre d'accessibilité ; le focus clavier du résumé est
 * celui de tout le site (`:focus-visible` dans globals.css).
 */
export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      focusable="false"
      className={`h-4 w-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

export function Repliable({
  resume,
  quoi,
  ouvert = false,
  className = "",
  classeResume = "",
  surface = "cockpit",
  children,
}: {
  /** Ce que le repli range, dit en clair : c'est le texte du résumé cliquable. */
  resume: ReactNode;
  /** Ce qui attend derrière, compté depuis la donnée : « 4 codes », « 3 observations ». */
  quoi?: string;
  ouvert?: boolean;
  /** Les classes du `<details>` : sa carte, ses marges. */
  className?: string;
  /** Les classes du texte du résumé, si le gabarit par défaut ne convient pas. */
  classeResume?: string;
  /**
   * LE SOL DU REPLI (lot 6D). Par défaut, le COCKPIT : le repli hérite du sol
   * où il est posé, chevron gris et résumé clair. Une instance qui range un
   * DOCUMENT (une aide longue, une explication, des notions) prend `"papier"` :
   * une feuille de la matière `.papier`, chevron et résumé à l'encre. Jamais
   * par défaut ; la garde `surfaces-de-lecture.test.ts` énumère les instances.
   */
  surface?: SurfaceDuRepli;
  children: ReactNode;
}) {
  const papier = surface === "papier";
  return (
    <details
      data-repliable
      data-surface={papier ? "papier" : undefined}
      open={ouvert || undefined}
      className={
        papier ? `papier repli-papier group rounded-lg ${className}` : `group ${className}`
      }
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
        <Chevron className={papier ? "douce" : "text-slate-400"} />
        <span className={classeResume || "text-sm font-semibold text-slate-200"}>{resume}</span>
        {quoi ? <span className="whitespace-nowrap text-sm text-slate-400">{quoi}</span> : null}
      </summary>
      {children}
    </details>
  );
}
