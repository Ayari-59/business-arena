"use client";

import { affecterEleveAction, type AffectationState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import type { EquipeEtSesMembres } from "@/services/affectation.service";

const initial: AffectationState = { error: null, message: null };

/**
 * LE TABLEAU DE COMPOSITION DE LA CLASSE.
 *
 * Deux pannes de salle, un seul écran pour les réparer. La première : la
 * classe travaille en groupes constitués, le code d'invitation range les
 * élèves dans l'équipe la moins remplie, et les groupes sont mélangés. La
 * seconde, plus vicieuse : un élève revient au tour 3 depuis un autre poste,
 * son cookie d'invité a disparu, le serveur ne le reconnaît pas et l'affecte
 * au hasard — il voit alors le tableau de bord d'une équipe qui n'est pas la
 * sienne, sans qu'aucun message ne le prévienne.
 *
 * L'élève ne peut se déplacer lui-même qu'au premier tour. Ici, l'enseignant
 * le peut à tout moment : c'est le seul à savoir qui est qui.
 */
export function CompositionEquipes({
  gameId,
  equipes,
  premierTour,
}: {
  gameId: string;
  equipes: EquipeEtSesMembres[];
  /** Vrai tant que le premier tour n'est pas clos : rien n'est encore joué. */
  premierTour: boolean;
}) {
  if (equipes.length === 0) return null;
  const inscrits = equipes.reduce((total, e) => total + e.membres.length, 0);

  return (
    <div>
      <p className="text-xs leading-relaxed text-slate-400">
        {inscrits === 0
          ? "Aucun élève n'a encore rejoint la partie. Le code d'invitation les répartit automatiquement dans l'équipe la moins remplie ; vous pourrez les déplacer ici."
          : "Le code d'invitation répartit les élèves dans l'équipe la moins remplie. Déplacez-les ici pour retrouver vos groupes, ou pour rattraper un élève revenu d'un autre poste : sans son cookie, il a été affecté au hasard."}
      </p>
      {!premierTour && inscrits > 0 ? (
        // Dit une fois, et seulement quand c'est vrai : le relevé de notes lit
        // l'appartenance courante, donc un élève déplacé au tour 4 emporte le
        // résultat économique de sa nouvelle équipe pour toute la partie.
        <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-950/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
          Des tours sont déjà joués : le relevé de notes suit l&apos;équipe actuelle de
          chaque élève. Un élève déplacé maintenant recevra le résultat économique de
          sa nouvelle équipe pour toute la partie.
        </p>
      ) : null}

      <ul className="mt-3 space-y-3">
        {equipes.map((equipe) => (
          <li key={equipe.teamId}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              {equipe.nom}{" "}
              <span className="font-normal normal-case tracking-normal text-slate-500">
                ·{" "}
                {equipe.membres.length === 0
                  ? "aucun élève"
                  : `${equipe.membres.length} élève${equipe.membres.length > 1 ? "s" : ""}`}
              </span>
            </p>
            {equipe.membres.length > 0 ? (
              <ul className="mt-1.5 space-y-1.5">
                {equipe.membres.map((membre) => (
                  <li key={membre.userId}>
                    <LigneDEleve
                      gameId={gameId}
                      eleveId={membre.userId}
                      nom={membre.nom}
                      equipeActuelle={equipe.teamId}
                      equipes={equipes}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Un élève, et l'équipe où l'envoyer. */
function LigneDEleve({
  gameId,
  eleveId,
  nom,
  equipeActuelle,
  equipes,
}: {
  gameId: string;
  eleveId: string;
  nom: string;
  equipeActuelle: string;
  equipes: EquipeEtSesMembres[];
}) {
  const action = affecterEleveAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "affectation d'un élève",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2"
    >
      <input type="hidden" name="eleveId" value={eleveId} />
      <input type="hidden" name="nomDeLEleve" value={nom} />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{nom}</span>
      <label className="flex items-center gap-1.5">
        <span className="sr-only">Équipe de {nom}</span>
        <select
          name="teamId"
          defaultValue={equipeActuelle}
          className="max-w-[160px] rounded-lg border border-white/5 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-amber-400/60"
        >
          {equipes.map((e) => (
            <option key={e.teamId} value={e.teamId}>
              {e.nom}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="shrink-0 rounded-lg border border-amber-400/40 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-60"
      >
        {pending ? "…" : "Déplacer"}
      </button>
      {state.error ? (
        <p role="alert" className="w-full text-xs text-rose-300">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p aria-live="polite" className="w-full text-xs text-emerald-300">
          {state.message}
        </p>
      ) : null}
      <GuardError message={guardError} />
    </form>
  );
}
