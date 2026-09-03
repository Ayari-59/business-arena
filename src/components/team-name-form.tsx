"use client";

import { nommerEquipeAction, type NomEquipeState } from "@/app/arena/[gameId]/actions";
import { NOM_EQUIPE_MAX } from "@/config/nom-equipe";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

const initial: NomEquipeState = { error: null };

/**
 * L'équipe se donne un nom d'entreprise.
 *
 * Le panneau n'apparaît qu'au premier tour et tant que l'équipe porte encore
 * son numéro : après la première clôture, le nom se fige, parce qu'un
 * classement qui change d'intitulé en cours de partie devient illisible.
 *
 * Le champ est libre plutôt que choisi dans une liste : nommer son entreprise
 * est le premier acte de gestion de l'équipe, et une liste le lui retirerait.
 */
export function TeamNameForm({ gameId, nomActuel }: { gameId: string; nomActuel: string }) {
  const action = nommerEquipeAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "nom d'entreprise",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-amber-400/30 bg-amber-950/10 p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        ✍️ Nommez votre entreprise
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
        Votre équipe s&apos;appelle « {nomActuel} » pour l&apos;instant. Donnez-lui le nom
        sous lequel elle affrontera les autres : c&apos;est celui qui suivra vos résultats
        jusqu&apos;au classement final. Il se fige à la clôture du premier tour.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Nom de l&apos;entreprise</span>
          <input
            name="nom"
            required
            maxLength={NOM_EQUIPE_MAX}
            placeholder="Le nom de votre entreprise"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-progress disabled:opacity-70"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Enregistrement
            </span>
          ) : (
            "Adopter ce nom"
          )}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="mt-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </form>
  );
}
