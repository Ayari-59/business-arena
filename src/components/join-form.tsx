"use client";

import { useActionState } from "react";
import { joinGameAction, type JoinState } from "@/app/join/actions";

const initial: JoinState = { error: null };

export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinGameAction, initial);
  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6"
    >
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Code de la partie
        </span>
        <input
          name="code"
          required
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="EX : K7M2PR"
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-center font-mono text-lg uppercase tracking-[0.3em] text-amber-300 outline-none focus:border-amber-400/60"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Votre prénom / pseudo
        </span>
        <input
          name="pseudo"
          required
          maxLength={40}
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
        />
      </label>
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Rejoindre la partie"}
      </button>
    </form>
  );
}
