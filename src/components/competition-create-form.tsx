"use client";

import { createCompetitionAction, type CreateCompetitionState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

/**
 * Le formulaire « Organiser un concours ».
 *
 * Constaté en production : une première soumission repartait sans un mot, le
 * nom saisi effacé, aucun concours dans la liste, et le second essai
 * réussissait. Un échec qui ressemble à un clic perdu fait recliquer, ou
 * renoncer.
 *
 * Trois règles, donc : l'action répond toujours (une erreur est un message,
 * pas un silence) ; ce que l'enseignant avait saisi lui est rendu tel quel ;
 * et le bouton dit qu'il travaille.
 */

const ETAT_INITIAL: CreateCompetitionState = { error: null, values: null };

const champ = "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm";
const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

export function CompetitionCreateForm({
  initial = ETAT_INITIAL,
}: {
  /** État de départ : celui d'un formulaire vierge, sauf pour reprendre un échec. */
  initial?: CreateCompetitionState;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    createCompetitionAction,
    initial,
    { label: "création de concours" },
  );
  // Après une action, React remet les champs à leur defaultValue : c'est donc
  // par là que la saisie revient, en cas d'échec, à sa place.
  const v = state.values;

  return (
    <form ref={formRef} action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className={etiquette}>Nom du concours</span>
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={v?.name ?? ""}
          placeholder="Championnat BTS MCO 2026"
          className={champ}
        />
      </label>
      <label className="block">
        <span className={etiquette}>Équipes par groupe</span>
        <select name="groupSize" defaultValue={v?.groupSize ?? "3"} className={champ}>
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} équipes par partie
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={etiquette}>Qualifiés par groupe</span>
        <select name="advancePerGroup" defaultValue={v?.advancePerGroup ?? "1"} className={champ}>
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n} par groupe → finale
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className={etiquette}>Périodicité</span>
        <select name="periodicity" defaultValue={v?.periodicity ?? "quarter"} className={champ}>
          <option value="month">Un mois par tour</option>
          <option value="quarter">Un trimestre par tour</option>
          <option value="year">Une année par tour</option>
        </select>
      </label>
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300 sm:col-span-2"
        >
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="sm:col-span-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Création du concours…" : "Créer le concours et ouvrir les inscriptions"}
      </button>
    </form>
  );
}
