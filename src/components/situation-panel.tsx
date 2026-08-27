"use client";

import { useActionState } from "react";
import {
  submitDiagnosisAction,
  submitQuizAction,
  unlockHintAction,
  type PedagogyState,
} from "@/app/arena/[gameId]/actions";
import type { SituationView } from "@/services/pedagogy.service";

const initial: PedagogyState = { error: null };

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-300">
      {error}
    </p>
  );
}

/** Une situation active : diagnostic → QCM de connaissances → indices à la demande. */
export function SituationCard({ gameId, situation }: { gameId: string; situation: SituationView }) {
  const [hintState, hintAction, hintPending] = useActionState(
    unlockHintAction.bind(null, gameId, situation.instanceId),
    initial,
  );
  const [diagState, diagAction, diagPending] = useActionState(
    submitDiagnosisAction.bind(null, gameId, situation.instanceId),
    initial,
  );
  const [quizState, quizAction, quizPending] = useActionState(
    submitQuizAction.bind(null, gameId, situation.instanceId),
    initial,
  );

  const diagnosisDone = situation.diagnosis !== null;
  const quizDone = situation.quizAnswers !== null;

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
              ✓ Diagnostic enregistré, il sera corrigé au débriefing du tour.
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

        {/* 2. QCM de connaissances */}
        {situation.quizQuestions.length > 0 ? (
          <section className="rounded-lg bg-slate-950 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              2 · Connaissances et modèle d&apos;analyse
            </h4>
            {quizDone ? (
              <p className="mt-2 text-sm text-emerald-300">
                ✓ QCM validé, la correction sera révélée au débriefing du tour.
              </p>
            ) : (
              <form action={quizAction} className="mt-2 space-y-4">
                {situation.quizQuestions.map((question, index) => (
                  <fieldset key={question.id}>
                    <legend className="text-sm font-medium text-slate-200">
                      {index + 1}. {question.prompt}
                    </legend>
                    <div className="mt-1.5 space-y-1.5">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-start gap-2 text-sm text-slate-300"
                        >
                          <input
                            type="radio"
                            name={`quiz_${question.id}`}
                            value={option.id}
                            required
                            className="mt-1 accent-amber-400"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <ErrorBox error={quizState.error} />
                <button
                  type="submit"
                  disabled={quizPending}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                >
                  {quizPending ? "Envoi…" : "Valider mes réponses"}
                </button>
              </form>
            )}
          </section>
        ) : null}

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

/** Débriefing d'une situation du tour résolu : correction du diagnostic et du QCM + concepts. */
export function SituationDebrief({ situation }: { situation: SituationView }) {
  const debrief = situation.debrief;
  if (!debrief) return null;
  const selected = new Set(situation.diagnosis?.selected ?? []);
  const answers = situation.quizAnswers ?? {};
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
        {situation.quizQuestions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Connaissances et modèle d&apos;analyse
              {debrief.quizScore !== null
                ? ` · ${Math.round(debrief.quizScore * 100)} %`
                : " · QCM non traité"}
            </p>
            <ul className="mt-1 space-y-2">
              {situation.quizQuestions.map((question) => {
                const correction = debrief.quizCorrection.find((c) => c.id === question.id);
                if (!correction) return null;
                const answered = answers[question.id];
                const credit = answered ? (correction.credits[answered] ?? 0) : 0;
                const correctLabel = question.options.find(
                  (o) => o.id === correction.correctOptionId,
                )?.label;
                return (
                  <li key={question.id} className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
                    <p className="text-slate-300">{question.prompt}</p>
                    <p
                      className={`mt-1 ${
                        credit >= 1
                          ? "text-emerald-300"
                          : credit > 0
                            ? "text-amber-300"
                            : "text-red-400"
                      }`}
                    >
                      {credit >= 1
                        ? "✓ Bonne réponse"
                        : credit > 0
                          ? `≈ Réponse partielle (${Math.round(credit * 100)} %)`
                          : answered
                            ? "✗ Mauvaise réponse"
                            : "· Sans réponse"}
                      {credit < 1 && correctLabel ? (
                        <span className="text-emerald-300"> · le plus juste : {correctLabel}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{correction.explain}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
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
