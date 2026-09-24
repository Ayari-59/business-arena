"use client";

import {
  demanderSubventionAction,
  type DemandeSubventionState,
} from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { sansMolette } from "@/components/sans-molette";
import { formatEuro } from "@/lib/format";

const initial: DemandeSubventionState = { error: null };

/**
 * LE DERNIER RECOURS D'UNE ÉQUIPE AU PIED DU MUR.
 *
 * Il n'apparaît que là : en crise de trésorerie, financement de sauvetage
 * exigé, et emprunt et apport des associés insuffisants même utilisés jusqu'au
 * bout. À ce point, l'équipe n'a plus rien à décider — et jusqu'ici elle
 * restait devant un formulaire qu'elle ne pouvait pas satisfaire, sans issue.
 *
 * Elle écrit ici ce qu'elle demande et pourquoi. Le montant est proposé (c'est
 * exactement ce qui manque) mais modifiable à la baisse : demander moins que le
 * nécessaire est un choix, parfois le bon si l'on croit pouvoir vendre un
 * actif. Le motif est obligatoire et libre : c'est sur lui que l'animateur
 * tranchera, et l'écrire oblige à formuler un plan.
 *
 * Déposer la demande lève le verrou du tour — non parce que l'argent est
 * arrivé, mais parce que l'équipe a fait tout ce qui était en son pouvoir.
 */
export function DemandeSubvention({
  gameId,
  manque,
}: {
  gameId: string;
  /** Ce qui manquerait encore, tous leviers utilisés à fond. */
  manque: number;
}) {
  const action = demanderSubventionAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "demande de subvention",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 rounded-lg border border-red-400/30 bg-slate-950/60 px-3 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
        🆘 Demande de subvention exceptionnelle
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
        Votre banque ne prête plus et l&apos;enveloppe de vos associés est vide : même en les
        utilisant jusqu&apos;au bout, il manquerait{" "}
        <strong className="tabular-nums text-slate-100">{formatEuro(manque)}</strong>. Il vous
        reste une porte : demander une aide exceptionnelle à votre animateur. Il l&apos;accorde
        ou la refuse — dites-lui ce qu&apos;elle permettrait.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
        <label className="block">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Montant demandé
          </span>
          <span className="mt-1 flex items-center gap-2 champ px-2 py-2 [--focus-champ:var(--color-red-400)]">
            <input
              type="number"
              onWheel={sansMolette}
              name="montant"
              required
              step={1}
              min={1}
              max={Math.ceil(manque)}
              defaultValue={Math.ceil(manque)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none"
            />
            <span className="shrink-0 text-xs text-slate-400">€</span>
          </span>
        </label>
        <label className="block">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Ce que cette aide permettrait
          </span>
          <textarea
            name="motif"
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            placeholder="Ex. : tenir un tour de plus pour écouler le stock invendu et revenir à l'équilibre."
            className="mt-1 w-full champ px-2 py-2 text-sm text-slate-100 outline-none [--focus-champ:var(--color-red-400)]"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Dépôt en cours…" : "Déposer la demande"}
      </button>
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
