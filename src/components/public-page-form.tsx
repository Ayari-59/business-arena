"use client";

import { setCompetitionPublicPageAction, type CompetitionActionState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import {
  ACCENTS_CONCOURS,
  ACCENT_PAR_DEFAUT,
  DESCRIPTION_MAX,
  ORGANIZER_LABEL_MAX,
  TAGLINE_MAX,
} from "@/config/concours-public";

const initial: CompetitionActionState = { error: null };

/**
 * Panneau de configuration de la page publique d'un concours (côté
 * organisateur). Tant que « Rendre la page publique » n'est pas coché, la page
 * /concours/[code] renvoie 404. Les champs sont préremplis avec l'état
 * enregistré ; le lien de prévisualisation ouvre la page dans un nouvel onglet.
 */
export function PublicPageForm({
  competitionId,
  publicUrl,
  visible,
  tagline,
  description,
  organizerLabel,
  accent,
}: {
  competitionId: string;
  publicUrl: string;
  visible: boolean;
  tagline: string | null;
  description: string | null;
  organizerLabel: string | null;
  accent: string | null;
}) {
  const action = setCompetitionPublicPageAction.bind(null, competitionId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "page publique",
  });

  const champ =
    "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          name="visible"
          defaultChecked={visible}
          className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-amber-500"
        />
        Rendre la page publique (visible par tous à l&apos;adresse ci-dessous)
      </label>

      <label className="block">
        <span className="text-xs font-medium text-slate-300">
          Accroche <span className="text-slate-500">(une phrase, {TAGLINE_MAX} car. max)</span>
        </span>
        <input
          type="text"
          name="tagline"
          maxLength={TAGLINE_MAX}
          defaultValue={tagline ?? ""}
          placeholder="Le grand tournoi de gestion des BTS de l'académie"
          className={champ}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-slate-300">Établissement / organisateur</span>
        <input
          type="text"
          name="organizerLabel"
          maxLength={ORGANIZER_LABEL_MAX}
          defaultValue={organizerLabel ?? ""}
          placeholder="Lycée Jean-Moulin · BTS CG"
          className={champ}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-slate-300">
          Présentation <span className="text-slate-500">(affichée sous « À propos »)</span>
        </span>
        <textarea
          name="description"
          maxLength={DESCRIPTION_MAX}
          defaultValue={description ?? ""}
          rows={5}
          placeholder="Présentez l'événement : public visé, enjeux, lots éventuels, calendrier…"
          className={`${champ} resize-y`}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-slate-300">Couleur d&apos;accent</span>
        <select name="accent" defaultValue={accent ?? ACCENT_PAR_DEFAUT} className={champ}>
          {ACCENTS_CONCOURS.map((a) => (
            <option key={a.cle} value={a.cle}>
              {a.nom}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-progress disabled:opacity-70"
        >
          {pending ? "Enregistrement…" : "Enregistrer la page"}
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-300 underline-offset-4 hover:underline"
        >
          Prévisualiser / ouvrir la page →
        </a>
      </div>
      <p className="text-xs text-slate-500">
        Adresse publique : <span className="font-mono text-slate-400">{publicUrl}</span>
      </p>

      {state.error ? (
        <p role="alert" className="text-xs text-rose-300">
          {state.error}
        </p>
      ) : null}
      {guardError ? <GuardError message={guardError} /> : null}
    </form>
  );
}
