"use client";

import { useId, useState, type ReactNode } from "react";
import { bouton } from "@/components/bouton";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

export type EtatDeSuppression = { erreur?: string } | null;

/**
 * UNE SUPPRESSION QUI NE SE DÉFAIT PAS, CONFIRMÉE DANS LA PAGE.
 *
 * Jamais la boîte de confirmation du navigateur : elle se valide d'un réflexe sur Entrée, ne dit
 * pas ce qui part, et certains navigateurs la bloquent. Ici, le premier bouton ouvre un
 * encadré qui dit ce qui sera supprimé ; il faut y taper le mot demandé pour que le bouton
 * final s'active. Le serveur revérifie le mot : le navigateur ne fait que guider.
 */
export function SuppressionConfirmee({
  action,
  ouvrir,
  confirmer,
  mot,
  children,
  champs,
  label,
}: {
  action: (etat: EtatDeSuppression, formData: FormData) => Promise<EtatDeSuppression>;
  /** Le libellé du premier bouton (« Supprimer mon compte »). */
  ouvrir: string;
  /** Le libellé du bouton final (« Supprimer définitivement »). */
  confirmer: string;
  /** Le mot à taper pour confirmer. */
  mot: string;
  /** Ce qui sera supprimé, dit en clair dans l'encadré. */
  children: ReactNode;
  /** Les champs cachés à envoyer avec la confirmation (l'identifiant visé). */
  champs?: Record<string, string>;
  /** Le nom court du geste, pour la console du garde-fou. */
  label: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const { state: etat, formAction, pending: enCours, formRef, guardError } = useGuardedAction(
    action,
    null as EtatDeSuppression,
    // Un établissement entier peut demander du temps : on ne coupe pas trop tôt.
    { label: `${label}`, timeoutMs: 120_000 },
  );
  const id = useId();

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className={bouton({ variante: "secondaire" })}>
        {ouvrir}
      </button>
    );
  }
  const pret = saisie.trim().toUpperCase() === mot.toUpperCase();
  return (
    <form
      ref={formRef}
      action={formAction}
      className="encadre-perte grid gap-3 rounded-lg p-4"
      data-confirmation-suppression=""
    >
      {champs
        ? Object.entries(champs).map(([nom, valeur]) => <input key={nom} type="hidden" name={nom} value={valeur} />)
        : null}
      <div className="text-sm text-slate-200">{children}</div>
      <label htmlFor={id} className="text-sm text-slate-300">
        Pour confirmer, tapez <strong className="text-slate-50">{mot}</strong>
      </label>
      <input
        id={id}
        name="confirmation"
        onChange={(e) => setSaisie(e.target.value)}
        autoComplete="off"
        className="champ max-w-xs px-3 py-2 text-sm text-slate-100"
      />
      {etat?.erreur ? (
        <p role="alert" className="text-sm text-red-300">
          {etat.erreur}
        </p>
      ) : null}
      <GuardError message={guardError} />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!pret || enCours}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours ? "Suppression…" : confirmer}
        </button>
        <button
          type="button"
          onClick={() => {
            setOuvert(false);
            setSaisie("");
          }}
          className={bouton({ variante: "lien" })}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
