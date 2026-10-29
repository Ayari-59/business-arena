"use client";

import type { ReactNode } from "react";
import { purgerLeHorsLigne } from "@/lib/purge-hors-ligne";

/**
 * Le formulaire « Se déconnecter » : il appelle l'action serveur qui efface le
 * cookie, et vide au même moment ce que le navigateur garde hors ligne (caches,
 * service worker). Sans ce geste, un poste partagé garderait les pages déjà vues.
 */
export function FormulaireDeDeconnexion({
  action,
  children,
}: {
  action: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <form action={action} onSubmit={() => void purgerLeHorsLigne()} data-deconnexion="">
      {children}
    </form>
  );
}
