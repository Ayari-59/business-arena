"use client";

import { useEffect } from "react";

/**
 * DEMANDER AU NAVIGATEUR DE NE PAS EFFACER NOS DONNÉES.
 *
 * Les brouillons de décisions vivent dans le navigateur (localStorage) : un
 * navigateur à court de place, ou Safari après une semaine sans visite, peut
 * les effacer. `storage.persist()` demande l'inverse. Le navigateur est libre
 * de refuser — souvent sans rien afficher —, et la partie elle-même ne dépend
 * pas de ce stockage : elle est en base. C'est donc un filet de plus, posé une
 * fois et sans bruit.
 */
export function StockageDurable() {
  useEffect(() => {
    try {
      void navigator.storage?.persist?.();
    } catch {
      // Contexte sans stockage ou refus immédiat : rien à faire.
    }
  }, []);
  return null;
}
