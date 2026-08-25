"use client";

import { useActionState, useState } from "react";
import {
  chooseModelAction,
  submitDiagnosisAction,
  unlockHintAction,
  type PedagogyState,
} from "@/app/arena/[gameId]/actions";
import type { SituationView } from "@/services/pedagogy.service";

const initial: PedagogyState = { error: null };

const RELEVANCE_LABELS: Record<string, { label: string; className: string }> = {
  optimal: { label: "modèle pertinent", className: "text-emerald-400" },
  acceptable: { label: "modèle acceptable", className: "text-amber-300" },
  misleading: { label: "modèle trompeur — contresens classique", className: "text-red-400" },
  irrelevant: { label: "modèle hors sujet", className: "text-slate-500" },
};

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-300">
      {error}
    </p>
  );
}

/** Une situation active : diagnostic → choix du modèle → indices à la demande. */
export function SituationCard({ gameId, situation }: { gameId: string; situation: SituationView }) {
  const [hintState, hintAction, hintPending] = useActionState(
    unlockHintAction.bind(null, gameId, situation.instanceId),
    initial,
  );
  const [diagState, diagAction, diagPending] = useActionState(
    submitDiagnosisAction.bind(null, gameId, situation.instanceId),
    initial,
  );
  const [modelState, modelAction, modelPending] = useActionState(
    chooseModelAction.bind(null, gameId, situation.instanceId),
    initial,
  );
  const [selectedModel, setSelectedModel] = useState(situation.modelChoice?.code ?? "");

  const diagnosisDone = situation.diagnosis !== null;
  const modelDone = situation.modelChoice !== null;

  return (
    <article className="rounded-xl border border-amber-400/20 bg-slate-900 p-5">
      <header className="mb-3">
        <p className="text-[11px] uppercase tracking-[0.25em] text-amber-400">
          Situation {situation.origin === "detected" ? "détectée dans vos comptes" : "du tour"}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{situation.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{situation.narrative}</p>
        <p className="mt-2 text-sm font-medium text-amber-200">{situation.problem}</p>
      </header>

      <div className="space-y-4">
        {/* 1. Diagnostic */}
        <section className="rounded-lg bg-slate-950 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            1 · Votre diagnostic
          </h4>
          {diagnosisDone ? (
            <p className="mt-2 text-sm text-emerald-300">
              ✓ Diagnostic enregistré — il sera corrigé au débriefing du tour.
            </p>
          ) : (
            <form action={diagAction} className="mt-2 space-y-2">
              {situation.diagnosticOptions.map((option) => (
                <label key={option.id} className="flex items-start gap-2 text-sm text-slate-200">
                  <input type="checkbox" name="options" value={option.id} className="mt-1 accent-amber-400" />
                  <span>{option.label}</span>
                </label>
              ))}
              <textarea
                name="freeText"
                rows={2}
                placeholder="Votre analyse en quelques mots (facultatif mais valorisé)…"
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              />
              <ErrorBox error={diagState.error} />
              <button
                type="submit"
                disabled={diagPending}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                {diagPending ? "Envoi…" : "Enregistrer mon diagnostic"}
              </button>
            </form>
          )}
        </section>

        {/* 2. Choix du modèle */}
        <section className="rounded-lg bg-slate-950 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            2 · Quel modèle d&apos;analyse mobilisez-vous ?
          </h4>
          {modelDone ? (
            <p className="mt-2 text-sm text-emerald-300">
              ✓ Modèle choisi : <strong>{situation.modelChoice!.name}</strong> — pertinence révélée
              au débriefing.
            </p>
          ) : (
            <form action={modelAction} className="mt-2 space-y-2">
              <select
                name="modelCode"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              >
                <option value="">— Choisir dans le référentiel (18 modèles) —</option>
                {situation.models.map((m) => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
              </select>
              {selectedModel ? (
                <p className="text-xs text-slate-500">
                  {situation.models.find((m) => m.code === selectedModel)?.description}
                </p>
              ) : null}
              <textarea
                name="justification"
                rows={2}
                placeholder="Pourquoi ce modèle ? Une justification argumentée améliore votre score."
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              />
              <ErrorBox error={modelState.error} />
              <button
                type="submit"
                disabled={modelPending}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                {modelPending ? "Envoi…" : "Valider mon choix de modèle"}
              </button>
            </form>
          )}
        </section>

        {/* 3. Indices */}
        <section className="rounded-lg bg-slate-950 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Besoin d&apos;aide ? Indices progressifs
          </h4>
          {situation.unlockedHints.length > 0 ? (
            <ol className="mt-2 space-y-1.5">
              {situation.unlockedHints.map((h) => (
                <li key={h.level} className="rounded-lg border border-white/5 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                  <span className="mr-2 text-xs font-semibold text-amber-400">Indice {h.level}</span>
                  {h.text}
                </li>
              ))}
            </ol>
          ) : null}
          {situation.nextHint ? (
            <form action={hintAction} className="mt-2">
              <ErrorBox error={hintState.error} />
              <button
                type="submit"
                disabled={hintPending}
                className="rounded-lg border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-60"
              >
                {hintPending
                  ? "Déblocage…"
                  : `Débloquer l'indice ${situation.nextHint.level} (−${Math.round(situation.nextHint.costRatio * 100)} % du score de la situation)`}
              </button>
            </form>
          ) : situation.unlockedHints.length === 5 ? (
            <p className="mt-2 text-xs text-slate-500">Tous les indices sont débloqués.</p>
          ) : null}
        </section>
      </div>
    </article>
  );
}

/** Débriefing d'une situation du tour résolu : correction + modèle pertinent + concepts. */
export function SituationDebrief({ situation }: { situation: SituationView }) {
  const debrief = situation.debrief;
  if (!debrief) return null;
  const selected = new Set(situation.diagnosis?.selected ?? []);
  return (
    <article className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Débriefing</p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">{situation.title}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          Score : {Math.round(debrief.finalScore * 100)} / 100
        </span>
      </header>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diagnostic</p>
          <ul className="mt-1 space-y-1">
            {situation.diagnosticOptions.map((option) => {
              const correct = debrief.correctOptionIds.includes(option.id);
              const chosen = selected.has(option.id);
              return (
                <li key={option.id} className={correct ? "text-emerald-300" : chosen ? "text-red-400" : "text-slate-500"}>
                  {correct ? "✓" : chosen ? "✗" : "·"} {option.label}
                  {chosen && !correct ? " (coché à tort)" : ""}
                  {correct && !chosen ? " (manqué)" : ""}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Votre modèle : {situation.modelChoice ? situation.modelChoice.name : "aucun choisi"}
          </p>
          {situation.modelChoice ? (
            <p className={`mt-1 ${RELEVANCE_LABELS[situation.modelChoice.relevance]?.className ?? ""}`}>
              → {RELEVANCE_LABELS[situation.modelChoice.relevance]?.label}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            Modèles pertinents ici :{" "}
            {Object.entries(debrief.modelRelevance)
              .filter(([, r]) => r === "optimal")
              .map(([code]) => situation.models.find((m) => m.code === code)?.name ?? code)
              .join(", ")}
          </p>
        </div>
        {debrief.concepts.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Concepts mobilisés
            </p>
            <p className="mt-1 flex flex-wrap gap-2">
              {debrief.concepts.map((c) => (
                <a
                  key={c.code}
                  href={`/concepts#${c.code}`}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-amber-200 hover:border-amber-400/40"
                >
                  {c.name}
                </a>
              ))}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
