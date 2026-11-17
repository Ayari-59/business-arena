"use client";

import { bouton } from "@/components/bouton";
import { lancerLeTourAction, type CloseRoundState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

const initial: CloseRoundState = { error: null };

/**
 * « LANCER LE TOUR N » (`lib/lancement-du-tour.ts`). Le tour clos, la classe débriefe ;
 * le tour suivant attend ce clic, ou la date que le planning lui donne. Le formulaire
 * porte le numéro du tour : le serveur refuse d'en lancer un autre, et un double clic
 * retombe sur un tour déjà ouvert, sans effet.
 */
export function LancerLeTourForm({
  gameId,
  tour,
  libelle,
  ouvertureAuto,
}: {
  gameId: string;
  tour: number;
  /** « Tour 2 » : le nom du tour, tel que le bandeau l'écrit. */
  libelle: string;
  /** La date du planning à laquelle il s'ouvrira seul, en toutes lettres ; null sinon. */
  ouvertureAuto: string | null;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    lancerLeTourAction.bind(null, gameId),
    initial,
    { label: "lancement du tour" },
  );
  const nom = libelle.toLowerCase();
  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3" data-lancement-du-tour="">
      <input type="hidden" name="roundIndex" value={tour} />
      <p className="max-w-2xl text-sm text-slate-300">
        {ouvertureAuto ? (
          <>
            Le {nom} <strong className="font-semibold text-slate-100">s&apos;ouvrira seul le {ouvertureAuto}</strong>,
            comme le planning le prévoit. Vous pouvez l&apos;ouvrir plus tôt.
          </>
        ) : (
          <>
            Le {nom} <strong className="font-semibold text-slate-100">attend votre lancement</strong>. Les
            élèves lisent leurs résultats du tour clos ; débriefez, puis lancez le tour suivant.
          </>
        )}
      </p>
      {state.error ? (
        <p role="alert" className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      <button type="submit" disabled={pending} className={`${bouton({ taille: "l" })} w-full`}>
        {pending ? "Ouverture du tour…" : `Lancer le ${nom}`}
      </button>
    </form>
  );
}
