"use client";

import { useActionState } from "react";
import { bouton } from "@/components/bouton";
import {
  demanderUneReinitialisationAction,
  reinitialiserLeMotDePasseAction,
  type EtatDeLaDemande,
  type EtatDeLaReinitialisation,
} from "@/app/teacher/mot-de-passe-oublie/actions";

const CHAMP = "mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none";
const LIBELLE = "text-xs font-medium uppercase tracking-wide text-slate-400";

export function DemandeDeReinitialisation() {
  const [etat, action, enCours] = useActionState<EtatDeLaDemande, FormData>(demanderUneReinitialisationAction, {
    message: null,
    error: null,
  });
  if (etat.message) {
    return (
      <p role="status" data-demande-envoyee="" className="carte p-4 text-sm text-slate-200">
        {etat.message}
      </p>
    );
  }
  return (
    <form action={action} noValidate className="w-full max-w-md carte space-y-4 p-4 sm:p-7">
      <label className="block">
        <span className={LIBELLE}>E-mail de votre compte</span>
        <input name="email" type="email" required autoComplete="email" className={CHAMP} />
      </label>
      {etat.error ? (
        <p role="alert" className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
          {etat.error}
        </p>
      ) : null}
      <button type="submit" disabled={enCours} className={`${bouton({ taille: "l" })} w-full`}>
        {enCours ? "Envoi…" : "Recevoir un lien"}
      </button>
    </form>
  );
}

export function NouveauMotDePasse({ jeton, minimum }: { jeton: string; minimum: number }) {
  const [etat, action, enCours] = useActionState<EtatDeLaReinitialisation, FormData>(
    reinitialiserLeMotDePasseAction,
    { error: null },
  );
  return (
    <form action={action} noValidate className="w-full max-w-md carte space-y-4 p-4 sm:p-7">
      <input type="hidden" name="jeton" value={jeton} />
      <label className="block">
        <span className={LIBELLE}>Nouveau mot de passe ({minimum} caractères min.)</span>
        <input name="password" type="password" required minLength={minimum} autoComplete="new-password" className={CHAMP} />
      </label>
      <label className="block">
        <span className={LIBELLE}>Le même, une seconde fois</span>
        <input name="confirmation" type="password" required autoComplete="new-password" className={CHAMP} />
      </label>
      {etat.error ? (
        <p role="alert" className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
          {etat.error}
        </p>
      ) : null}
      <button type="submit" disabled={enCours} className={`${bouton({ taille: "l" })} w-full`}>
        {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}
