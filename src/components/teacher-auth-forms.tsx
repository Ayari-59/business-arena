"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction, type FormState } from "@/app/teacher/actions";

const initial: FormState = { error: null };

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
      />
    </label>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
      {error}
    </p>
  );
}

export function TeacherAuthForms() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initial);
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    initial,
  );

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="mb-5 grid grid-cols-2 gap-2">
        {(
          [
            ["login", "Se connecter"],
            ["register", "Créer un compte"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === value
                ? "bg-amber-400 text-slate-950"
                : "bg-slate-950 text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <form action={loginFormAction} className="space-y-4">
          <Input label="E-mail" name="email" type="email" required autoComplete="email" />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          <ErrorBox error={loginState.error} />
          <button
            type="submit"
            disabled={loginPending}
            className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {loginPending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <form action={registerFormAction} className="space-y-4">
          <Input label="Votre nom" name="displayName" required autoComplete="name" />
          <Input label="Établissement" name="schoolName" required placeholder="Lycée / IUT / École…" />
          <Input label="E-mail" name="email" type="email" required autoComplete="email" />
          <Input
            label="Mot de passe (8 caractères min.)"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <ErrorBox error={registerState.error} />
          <button
            type="submit"
            disabled={registerPending}
            className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {registerPending ? "Création…" : "Créer mon compte enseignant"}
          </button>
        </form>
      )}
    </div>
  );
}
