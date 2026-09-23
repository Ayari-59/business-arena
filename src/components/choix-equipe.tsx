"use client";

import {
  choisirMonEquipeAction,
  type ChoixEquipeState,
} from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import type { GameView } from "@/services/game-view.service";

const initial: ChoixEquipeState = { error: null };

type Equipe = GameView["equipesDeLaClasse"][number];

/**
 * « JE NE SUIS PAS DANS LA BONNE ÉQUIPE. »
 *
 * Le code d'invitation range l'élève dans l'équipe la moins remplie : c'est ce
 * qu'il faut pour ouvrir une séance sans rien préparer, et c'est faux dès que
 * la classe travaille en groupes constitués. L'élève voit donc ici qui est où,
 * et rejoint les siens lui-même.
 *
 * La fenêtre s'arrête à la clôture du premier tour. Le relevé de notes suit
 * l'appartenance COURANTE : après un tour joué, changer d'équipe voudrait dire
 * emporter le résultat économique d'une autre, ce qui n'est plus un
 * rattrapage mais un transfert de notes. Passé ce moment, c'est l'enseignant
 * qui déplace — l'écran le dit, plutôt que de faire disparaître le panneau
 * sans explication.
 */
export function ChoixEquipe({
  gameId,
  equipes,
  monEquipeId,
  ouvert,
  concours = false,
}: {
  gameId: string;
  equipes: Equipe[];
  monEquipeId: string;
  ouvert: boolean;
  /** Partie de concours : l'appartenance vient de l'inscription, pas du hasard. */
  concours?: boolean;
}) {
  // Une seule équipe humaine : il n'y a rien à choisir.
  if (equipes.length < 2) return null;
  const mienne = equipes.find((e) => e.teamId === monEquipeId);

  return (
    <section className="carte p-3 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-100">
        <span aria-hidden className="mr-1.5">👥</span>
        Composition des équipes
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        {concours
          ? "En concours, votre équipe est celle de votre inscription : elle se qualifie d'un bloc et ne change pas en cours de tournoi."
          : ouvert
            ? "Vous avez été placé automatiquement dans l'équipe la moins remplie. Si vos camarades jouent ailleurs, rejoignez-les avant la clôture du premier tour."
            : "Le premier tour est clos : l'appartenance est figée. Si vous n'êtes pas dans la bonne équipe, demandez à votre enseignant de vous déplacer."}
      </p>

      <ul className="mt-3 space-y-2">
        {equipes.map((equipe) => (
          <li key={equipe.teamId}>
            <LigneDEquipe
              gameId={gameId}
              equipe={equipe}
              mienne={equipe.teamId === monEquipeId}
              ouvert={ouvert}
            />
          </li>
        ))}
      </ul>

      {mienne ? (
        <p className="mt-3 text-xs text-slate-500">
          Vous jouez actuellement dans {mienne.nom}.
        </p>
      ) : null}
    </section>
  );
}

/** Une équipe, ses membres, et le bouton pour la rejoindre. */
function LigneDEquipe({
  gameId,
  equipe,
  mienne,
  ouvert,
}: {
  gameId: string;
  equipe: Equipe;
  mienne: boolean;
  ouvert: boolean;
}) {
  const action = choisirMonEquipeAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "changement d'équipe",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 ${
        mienne ? "border-amber-400/40 bg-amber-950/10" : "border-white/5 bg-slate-950/60"
      }`}
    >
      <input type="hidden" name="teamId" value={equipe.teamId} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">
          {equipe.nom}
          {mienne ? (
            <span className="ml-2 rounded-full border border-amber-400/40 px-2 py-0.5 text-xs font-medium text-amber-300">
              votre équipe
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
          {equipe.membres.length > 0
            ? equipe.membres.map((m) => m.nom).join(", ")
            : "personne pour l'instant"}
        </p>
      </div>
      {!mienne && ouvert ? (
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="shrink-0 rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-60"
        >
          {pending ? "Changement…" : "Rejoindre"}
        </button>
      ) : null}
      {state.error ? (
        <p role="alert" className="w-full text-xs text-rose-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
    </form>
  );
}
