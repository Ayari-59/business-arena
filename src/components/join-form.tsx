"use client";

import { bouton } from "@/components/bouton";
import { joinGameAction, type JoinState } from "@/app/join/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

const initial: JoinState = { error: null };

/**
 * Le code peut arriver tout seul : `/join?code=…`, c'est-à-dire un QR scanné
 * (voir `src/lib/qr.ts`). Quand c'est le cas le champ est déjà rempli et le
 * curseur va droit au prénom — l'élève n'a plus qu'une chose à écrire, et le
 * code ne peut plus être mal recopié. Le champ reste modifiable : un QR photo-
 * graphié de travers, un code changé entre-temps, et l'élève corrige.
 *
 * Le carton d'une TABLE porte en plus une équipe. Elle ne se saisit pas et ne
 * s'affiche pas en champ : elle voyage cachée, et c'est le bandeau au-dessus
 * du formulaire qui la nomme, pour que l'élève voie où il s'assoit avant de
 * valider. Modifier le code à la main garde l'équipe d'un autre carton, mais
 * le service ne la retient que si elle existe dans la partie visée.
 */
export function JoinForm({
  codeInitial = null,
  equipeInitiale = null,
}: {
  codeInitial?: string | null;
  equipeInitiale?: number | null;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    joinGameAction,
    initial,
    { label: "rejoindre une partie" },
  );
  return (
    <form
      ref={formRef}
      action={formAction}
      className="w-full max-w-sm space-y-4 carte p-6"
    >
      {equipeInitiale !== null ? (
        <input type="hidden" name="equipe" value={equipeInitiale} />
      ) : null}
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Code de la partie
        </span>
        <input
          name="code"
          required
          defaultValue={state.values?.code ?? codeInitial ?? undefined}
          autoCapitalize="characters"
          autoComplete="off"
          aria-describedby="exemple-de-code"
          className="mt-1 w-full champ px-3 py-2 text-center font-mono text-lg uppercase tracking-annonce text-slate-100 outline-none"
        />
        {/* L'EXEMPLE SOUS LE CHAMP, PAS DEDANS (audit UX du 29 octobre 2026, P2-7) : en
            grandes capitales espacées, il ressemblait à un code déjà saisi. */}
        <span id="exemple-de-code" className="mt-1 block text-xs text-slate-400" data-exemple-de-code="">
          Par exemple K7M2PR : le code de votre partie, classe, cohorte, concours ou examen.
        </span>
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Votre prénom / pseudo
        </span>
        <input
          name="pseudo"
          required
          autoFocus={codeInitial !== null}
          maxLength={40}
          defaultValue={state.values?.pseudo ?? ""}
          className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
        />
      </label>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      <button
        type="submit"
        disabled={pending}
        className={`${bouton({ taille: "l" })} w-full`}
      >
        {pending ? "Connexion…" : "Rejoindre la partie"}
      </button>
    </form>
  );
}
