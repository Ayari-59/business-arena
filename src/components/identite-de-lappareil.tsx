"use client";

import { useState } from "react";
import { libererLAppareilAction, type LibererState } from "@/app/join/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

/**
 * QUI EST ASSIS DEVANT CET ÉCRAN.
 *
 * L'identité de l'élève tient dans un cookie d'un an, posé au premier code
 * saisi, et il n'existait aucune façon de le rendre. En salle informatique le
 * poste passe d'une classe à l'autre : le deuxième élève retrouvait le cookie
 * du premier, son prénom écrasait celui d'avant, et les deux ne faisaient plus
 * qu'un seul joueur — une équipe, un jeu de décisions, un historique de
 * situations, et un nom disparu du carnet. L'enseignant pouvait réparer après
 * coup en déplaçant les élèves ; personne ne pouvait l'empêcher.
 *
 * Deux endroits, deux tons :
 * - à l'entrée par code, un AVERTISSEMENT, parce que c'est le seul moment où
 *   le geste est encore gratuit : après la saisie, le prénom est déjà écrasé ;
 * - dans l'arène, un simple RAPPEL, discret, qui dit sous quel nom on joue et
 *   laisse la sortie à portée.
 *
 * Libérer n'efface rien en base. Les décisions appartiennent à l'équipe, pas à
 * l'appareil : l'élève qui revient avec le même code les retrouve.
 */
export function IdentiteDeLAppareil({
  pseudo,
  equipe,
  variante,
}: {
  /** Le prénom porté par l'appareil. */
  pseudo: string;
  /** L'équipe où joue ce prénom. Absente à l'entrée par code : aucune partie n'est encore ouverte. */
  equipe?: string;
  variante: "entree" | "arene";
}) {
  const [confirmation, setConfirmation] = useState(false);
  const { formAction, pending, formRef, guardError } = useGuardedAction<LibererState>(
    libererLAppareilAction,
    { error: null },
    { label: "libération de l'appareil" },
  );

  const avertissement = variante === "entree";

  return (
    <div
      className={`w-full max-w-sm rounded-lg border px-3 py-2 ${
        avertissement
          ? "border-amber-400/30 bg-amber-400/5"
          : "border-white/10"
      }`}
    >
      <p className={`text-xs leading-relaxed ${avertissement ? "text-amber-200" : "text-slate-400"}`}>
        <span aria-hidden>👤</span>{" "}
        {avertissement ? "Cet appareil est déjà utilisé par " : "Vous jouez sous le nom de "}
        <strong className={avertissement ? "font-semibold" : "font-semibold text-slate-200"}>
          {pseudo}
        </strong>
        {equipe ? <> · {equipe}</> : null}
        {avertissement ? ". Si ce n'est pas vous, libérez-le avant de saisir votre code." : "."}
      </p>

      {confirmation ? (
        <form ref={formRef} action={formAction} className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-slate-300">
            L&apos;appareil redeviendra neutre et vous reviendrez à l&apos;entrée par code. Les
            décisions déjà validées restent à l&apos;équipe : rien n&apos;est perdu.
          </p>
          <GuardError message={guardError} />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {pending ? "Libération…" : "Libérer l'appareil"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:text-slate-100"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="mt-1.5 rounded text-xs font-medium text-slate-300 underline underline-offset-4 transition hover:text-slate-100"
        >
          Ce n&apos;est pas moi
        </button>
      )}
    </div>
  );
}
