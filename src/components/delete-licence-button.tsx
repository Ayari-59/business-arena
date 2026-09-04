"use client";

import { useState } from "react";
import { deleteLicenceAction } from "@/app/admin/actions";

/**
 * Suppression d'une licence : geste définitif (la trace de la vente disparaît,
 * et retirer la licence courante rebascule l'établissement en accès libre). On
 * demande donc une confirmation en deux temps plutôt qu'un « ✕ » qui efface au
 * premier clic.
 */
export function DeleteLicenceButton({ licenceId }: { licenceId: string }) {
  const [confirmation, setConfirmation] = useState(false);

  if (confirmation) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-400">Supprimer&nbsp;?</span>
        <form action={deleteLicenceAction.bind(null, licenceId)} className="inline">
          <button className="text-xs font-semibold text-red-400 hover:text-red-300" title="Confirmer la suppression">
            Oui
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirmation(false)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Non
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmation(true)}
      className="text-slate-600 hover:text-red-400"
      title="Supprimer"
    >
      ✕
    </button>
  );
}
