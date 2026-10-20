"use client";

import {
  demanderSubventionAction,
  type DemandeSubventionState,
} from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { sansMolette } from "@/components/sans-molette";
import { formatEuro } from "@/lib/format";
import { Icone } from "@/components/icone";

const initial: DemandeSubventionState = { error: null };

/**
 * LE DERNIER RECOURS D'UNE ÉQUIPE AU PIED DU MUR.
 *
 * Il n'apparaît que là : en crise de trésorerie, financement de sauvetage
 * exigé, et emprunt et apport des associés insuffisants même utilisés jusqu'au
 * bout ; ou, aux niveaux qui n'ouvrent aucun financement, l'entreprise
 * défaillante. À ce point, l'équipe n'a plus rien à décider — et jusqu'ici elle
 * restait devant un formulaire qu'elle ne pouvait pas satisfaire, sans issue.
 *
 * Elle écrit ici ce qu'elle demande et pourquoi. Le montant est proposé (ce
 * qui manque, et pour une entreprise à l'arrêt ce qui la remet réellement en
 * marche, impôt compris) mais modifiable à la baisse : demander moins que le
 * nécessaire est un choix, parfois le bon si l'on croit pouvoir vendre un
 * actif. Le motif est obligatoire et libre : c'est sur lui que l'animateur
 * tranchera, et l'écrire oblige à formuler un plan.
 *
 * Déposer la demande lève le verrou du tour — non parce que l'argent est
 * arrivé, mais parce que l'équipe a fait tout ce qui était en son pouvoir.
 */
export function DemandeSubvention({
  gameId,
  montant,
  reste,
  cadre,
  defaillante,
}: {
  gameId: string;
  /** Le montant proposé, et le plafond de la demande (`montantDemandable`). */
  montant: number;
  /**
   * Ce qui manquait à la dernière clôture pour repasser sous le découvert
   * autorisé, tous leviers utilisés à fond.
   */
  reste: number;
  /**
   * `leviers_epuises` : emprunt et apport existent à ce niveau et ne suffisent
   * plus. `sans_financement` : le niveau n'en ouvre aucun.
   */
  cadre: "leviers_epuises" | "sans_financement";
  /** L'entreprise est à l'arrêt : le montant proposé est celui qui la dégèle. */
  defaillante: boolean;
}) {
  const action = demanderSubventionAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "demande de subvention",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 rounded-lg border border-red-400 bg-slate-950/60 px-3 py-3"
    >
      <p className="surtitre text-red-300">
        <Icone nom="alerte" className="mr-1.5 h-3.5 w-3.5" />
        Demande de subvention exceptionnelle
      </p>
      {cadre === "leviers_epuises" ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
          Votre banque ne prête plus et l&apos;enveloppe de vos associés est vide : même en les
          utilisant jusqu&apos;au bout, il manquerait{" "}
          <strong className="tabular-nums text-slate-100">{formatEuro(reste)}</strong>. Il vous
          reste une porte : demander une aide exceptionnelle à votre animateur. Il l&apos;accorde
          ou la refuse — dites-lui ce qu&apos;elle permettrait.
        </p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
          À ce niveau, aucun financement ne se décide. Il vous reste une porte : demander une aide
          exceptionnelle à votre animateur. Il l&apos;accorde ou la refuse, dites-lui ce
          qu&apos;elle permettrait.
        </p>
      )}
      {defaillante && montant > reste + 1 ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
          Le montant proposé,{" "}
          <strong className="tabular-nums text-slate-100">{formatEuro(montant)}</strong>, est
          celui qui remet l&apos;entreprise en marche à la clôture de ce tour. Il dépasse les{" "}
          <span className="tabular-nums">{formatEuro(reste)}</span> qui manquaient à la dernière
          clôture : un tour d&apos;arrêt creuse encore le découvert, et une subvention est
          imposée comme un produit. Moins, et l&apos;entreprise reste à l&apos;arrêt.
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
        <label className="block">
          <span className="libelle block">
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
              max={Math.ceil(montant)}
              defaultValue={Math.ceil(montant)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none"
            />
            <span className="shrink-0 text-xs text-slate-400">€</span>
          </span>
        </label>
        <label className="block">
          <span className="libelle block">
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
