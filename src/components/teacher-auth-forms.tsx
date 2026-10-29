"use client";

import { bouton } from "@/components/bouton";
import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction, type FormState } from "@/app/teacher/actions";
import { TEXTE_DU_CONSENTEMENT } from "@/config/nouveautes";

const initial: FormState = { error: null };

/**
 * Un champ, avec SON message d'erreur dessous (audit UX du 29 octobre 2026, P2-9) : les
 * formulaires sont envoyés sans la validation du navigateur (`noValidate`), dont les
 * bulles parlaient la langue du navigateur ; le serveur répond en français, sous le champ.
 */
function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; erreur?: string | null }) {
  const { label, erreur, ...rest } = props;
  const idErreur = erreur ? `erreur-${rest.name}` : undefined;
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <input
        {...rest}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={idErreur}
        className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
      />
      {erreur ? (
        <span id={idErreur} role="alert" data-erreur-du-champ={rest.name} className="mt-1 block text-sm text-red-300">
          {erreur}
        </span>
      ) : null}
    </label>
  );
}

/** L'erreur d'un champ précis, sinon rien (le message général reste sous le formulaire). */
const erreurDe = (etat: FormState, nom: string): string | null =>
  etat.error && etat.champ === nom ? etat.error : null;

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">{error}</p>;
}

/**
 * LA PAGE OÙ REVENIR APRÈS LA CONNEXION. Le serveur la reçoit dans `suite`
 * (chemin et requête, déjà filtrés) ; l'ancre (`#nouvelle-cohorte`) ne lui
 * parvient jamais, mais le navigateur la garde sur l'adresse de connexion. On la
 * rajoute au moment d'envoyer, jamais au rendu : le HTML du serveur et celui du
 * navigateur restent identiques. L'action la filtre de nouveau.
 */
function avecLAncre(action: (donnees: FormData) => void) {
  return (donnees: FormData) => {
    const suite = donnees.get("suite");
    const ancre = window.location.hash;
    if (typeof suite === "string" && suite && !suite.includes("#") && /^#[\w-]+$/.test(ancre)) {
      donnees.set("suite", `${suite}${ancre}`);
    }
    action(donnees);
  };
}

export function TeacherAuthForms({ suite = null }: { suite?: string | null }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initial);
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    initial,
  );

  return (
    <div className="w-full max-w-md carte p-4 sm:p-7">
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
            // L'ONGLET ACTIF N'EST PAS UN BOUTON D'ACTION : le voile neutre et
            // le filet orange d'un état choisi. En aplat orange, il ressemblait
            // trait pour trait au bouton « Se connecter » du formulaire.
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              tab === value
                ? "voile-neutre border-amber-400 font-semibold text-slate-100"
                : "border-transparent bg-slate-950 text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <form action={avecLAncre(loginFormAction)} className="space-y-4">
          {suite ? <input type="hidden" name="suite" value={suite} /> : null}
          {/* L'E-MAIL GARDÉ après un mauvais mot de passe (audit UX, P1-5). */}
          <Input
            label="E-mail"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={loginState.values?.email ?? ""}
          />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          <p className="text-right text-sm">
            <Link
              href="/teacher/mot-de-passe-oublie"
              prefetch={false}
              data-mot-de-passe-oublie=""
              className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              Mot de passe oublié ?
            </Link>
          </p>
          <ErrorBox error={loginState.error} />
          <button
            type="submit"
            disabled={loginPending}
            className={`${bouton({ taille: "l" })} w-full`}
          >
            {loginPending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <form action={avecLAncre(registerFormAction)} noValidate className="space-y-4">
          {suite ? <input type="hidden" name="suite" value={suite} /> : null}
          <Input
            label="Votre nom"
            name="displayName"
            required
            autoComplete="name"
            defaultValue={registerState.values?.displayName ?? ""}
            erreur={erreurDe(registerState, "displayName")}
          />
          <Input
            label="Code d'invitation (si votre établissement vous en a donné un)"
            name="inviteCode"
            autoComplete="off"
            placeholder="EX : K7M2PR9T"
            defaultValue={registerState.values?.inviteCode ?? ""}
          />
          <Input
            label="Sinon : nom de votre établissement (il sera créé)"
            name="schoolName"
            placeholder="Lycée / IUT / École…"
            defaultValue={registerState.values?.schoolName ?? ""}
          />
          <Input
            label="E-mail"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={registerState.values?.email ?? ""}
            erreur={erreurDe(registerState, "email")}
          />
          <Input
            label="Mot de passe (8 caractères min.)"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            erreur={erreurDe(registerState, "password")}
          />
          {/* LES NOUVEAUTÉS : une case NON cochée, facultative, sans effet sur le compte
              (services/nouveautes.service.ts). La date et la version du texte sont
              enregistrées si elle est cochée. */}
          <label className="flex items-start gap-2.5 text-sm leading-snug text-slate-300" data-case-nouveautes="">
            <input
              type="checkbox"
              name="nouveautes"
              value="oui"
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
            />
            <span>
              {TEXTE_DU_CONSENTEMENT}{" "}
              <span className="text-slate-400">Facultatif, modifiable dans votre espace.</span>
            </span>
          </label>
          <ErrorBox error={registerState.champ ? null : registerState.error} />
          <button
            type="submit"
            disabled={registerPending}
            className={`${bouton({ taille: "l" })} w-full`}
          >
            {registerPending ? "Création…" : "Créer mon compte enseignant"}
          </button>
        </form>
      )}
    </div>
  );
}
