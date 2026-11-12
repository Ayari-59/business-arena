import type { ReactNode } from "react";

/**
 * UNE ZONE QUI DÉFILE DE CÔTÉ, NOMMÉE ET ATTEIGNABLE AU CLAVIER (audit UX du 11 novembre 2026, P2-11).
 *
 * À 390 px, un tableau trop large défile de côté dans sa zone. Sans focus, la zone ne s'atteignait pas
 * au clavier, et ses colonnes de droite restaient hors de portée (axe-core, « scrollable-region-
 * focusable ») ; sans nom, un lecteur d'écran ne disait pas ce qu'elle contenait. La zone est une
 * région nommée, dans la tabulation : les flèches la font défiler, et le focus se voit. C'est la forme
 * du tableau des élèves de la classe du cours (app/teacher/cours/[id]/page.tsx).
 */
export function ZoneQuiDefile({ nom, className = "", children }: { nom: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={nom}
      tabIndex={0}
      className={`overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      data-zone-qui-defile=""
    >
      {children}
    </div>
  );
}
