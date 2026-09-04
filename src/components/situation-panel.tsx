"use client";

import { useEffect, useState } from "react";
import {
  retakeSituationAction,
  submitSituationAction,
  unlockHintAction,
  type PedagogyState,
} from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { STATUT_RENDUE, estRendue, manques, messageIncomplet } from "@/config/situation-rendu";
import type { SituationView } from "@/services/pedagogy.service";
import type { SituationCategory } from "@/config/scenarios/situation-kit";

const CATEGORY_LABELS: Record<SituationCategory, string> = {
  prise_de_poste: "Prise de poste",
  contexte_marche: "Contexte de marché",
  decision_strategique: "Décision stratégique",
  alerte_comptable: "Alerte comptable",
  tresorerie_dormante: "Trésorerie dormante",
};

const initial: PedagogyState = { error: null };

/**
 * L'enseignant peut ne garder que la question du modèle : annoncer alors des
 * « connaissances » serait faux. Le titre suit ce qui est réellement posé.
 */
function quizHeading(questions: { id: string }[]): string {
  const onlyModel = questions.every((q) => q.id === "model_choice");
  return onlyModel ? "Modèle d'analyse" : "Connaissances et modèle d'analyse";
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-300">
      {error}
    </p>
  );
}

/** Clé du brouillon dans le navigateur : survit à un rechargement, pas au rendu. */
function cleBrouillon(instanceId: string): string {
  return `ba:situation:${instanceId}`;
}

interface BrouillonLocal {
  options: string[];
  freeText: string;
  reponses: Record<string, string>;
}

/**
 * Une situation active : diagnostic + modèle d'analyse rendus d'un seul
 * geste, indices à la demande. Le brouillon vit dans l'état du composant
 * (React le rétablit après la remise à zéro du formulaire) et, en plus, dans
 * le stockage local du navigateur pour survivre à un rechargement.
 */
export function SituationCard({ gameId, situation }: { gameId: string; situation: SituationView }) {
  const hint = useGuardedAction(unlockHintAction.bind(null, gameId, situation.instanceId), initial, {
    label: "indice",
  });
  const rendu = useGuardedAction(
    submitSituationAction.bind(null, gameId, situation.instanceId),
    initial,
    { label: "rendu de situation" },
  );
  const { state: hintState, formAction: hintAction, pending: hintPending } = hint;
  const { state: renduState, formAction: renduAction, pending: renduPending } = rendu;

  const diagnosisDone = situation.diagnosis !== null;
  const quizDone = situation.quizAnswers !== null;
  const rendue = estRendue(situation);
  // Questions encore à répondre : toutes, sauf si le modèle a déjà été validé
  // (rendu en deux temps d'une version antérieure) — on ne le redemande pas.
  const questionsARendre = quizDone ? [] : situation.quizQuestions;

  const [options, setOptions] = useState<string[]>(situation.diagnosis?.selected ?? []);
  const [freeText, setFreeText] = useState(situation.diagnosis?.freeText ?? "");
  const [reponses, setReponses] = useState<Record<string, string>>(situation.quizAnswers ?? {});

  useEffect(() => {
    if (rendue) return;
    try {
      const brut = window.localStorage.getItem(cleBrouillon(situation.instanceId));
      if (!brut) return;
      const b = JSON.parse(brut) as Partial<BrouillonLocal>;
      if (!diagnosisDone && Array.isArray(b.options)) setOptions(b.options.map(String));
      if (!diagnosisDone && typeof b.freeText === "string") setFreeText(b.freeText);
      if (!quizDone && b.reponses && typeof b.reponses === "object") setReponses(b.reponses);
    } catch {
      // stockage indisponible : le brouillon reste en mémoire
    }
  }, [situation.instanceId, rendue, diagnosisDone, quizDone]);

  useEffect(() => {
    if (rendue) return;
    try {
      const b: BrouillonLocal = { options, freeText, reponses };
      window.localStorage.setItem(cleBrouillon(situation.instanceId), JSON.stringify(b));
    } catch {
      // idem
    }
  }, [situation.instanceId, rendue, options, freeText, reponses]);

  const manquants = manques({
    options,
    questions: questionsARendre.map((q) => q.id),
    reponses,
  });
  const complet = manquants.length === 0;

  const basculerOption = (id: string, coche: boolean) =>
    setOptions((prec) => (coche ? [...new Set([...prec, id])] : prec.filter((o) => o !== id)));

  return (
    <article className="rounded-xl border border-amber-400/20 bg-slate-900 p-5">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
            {CATEGORY_LABELS[situation.category]}
          </p>
          {situation.aboveGameLevel ? (
            <span
              className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-300"
              title="Cette situation mobilise des notions au-dessus du niveau choisi pour la partie."
            >
              Au-dessus du niveau
            </span>
          ) : null}
        </div>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{situation.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{situation.narrative}</p>
        <p className="mt-2 text-sm font-medium text-amber-200">{situation.problem}</p>
      </header>

      {situation.triggerFacts && situation.triggerFacts.length > 0 ? (
        <details className="mb-4 rounded-lg border border-slate-700/60 bg-slate-950/50">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-300">
            Pourquoi cette situation ?
          </summary>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 pb-3 pt-1">
            {situation.triggerFacts.map((fact, i) => (
              <div key={i} className="col-span-2 flex items-baseline justify-between gap-3">
                <dt className="text-xs text-slate-500">{fact.label}</dt>
                <dd
                  className={`text-sm font-medium ${
                    fact.direction === "positive"
                      ? "text-emerald-400"
                      : fact.direction === "negative"
                        ? "text-red-400"
                        : "text-slate-300"
                  }`}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}

      <p
        className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
          rendue
            ? "border-emerald-400/30 bg-emerald-950/20 text-emerald-300"
            : "border-amber-400/30 bg-amber-950/20 text-amber-300"
        }`}
        data-testid="statut-situation"
      >
        {rendue
          ? `✓ ${STATUT_RENDUE}`
          : manquants.length > 0
            ? `⚠ ${messageIncomplet(manquants)}`
            : "Brouillon complet : rendez votre situation pour qu'elle soit corrigée."}
      </p>

      <div className="space-y-4">
        {rendue ? (
          <section className="rounded-lg bg-slate-950 p-4">
            <p className="text-sm text-emerald-300">
              ✓ Diagnostic et modèle enregistrés, la correction sera révélée au débriefing du tour.
            </p>
          </section>
        ) : (
          <form ref={rendu.formRef} action={renduAction} className="space-y-4">
            <input type="hidden" name="questions" value={questionsARendre.map((q) => q.id).join(",")} />

            {/* 1. Diagnostic */}
            <section className="rounded-lg bg-slate-950 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Votre diagnostic
              </h4>
              <p className="mt-1 text-xs text-slate-500">Quel est le problème principal ?</p>
              <div className="mt-2 space-y-2">
                {situation.diagnosticOptions.map((option) => (
                  <label key={option.id} className="flex items-start gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      name="options"
                      value={option.id}
                      checked={options.includes(option.id)}
                      onChange={(e) => basculerOption(option.id, e.target.checked)}
                      className="mt-1 accent-amber-400"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                <textarea
                  name="freeText"
                  rows={2}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Votre analyse en quelques mots (facultatif mais valorisé)…"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
                />
              </div>
            </section>

            {/* 2. Questions : connaissances et/ou modèle d'analyse */}
            {situation.quizQuestions.length > 0 ? (
              <section className="rounded-lg bg-slate-950 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {quizHeading(situation.quizQuestions)}
                </h4>
                <p className="mt-1 text-xs text-slate-500">Comment analyser ce problème ?</p>
                {quizDone ? (
                  <p className="mt-2 text-sm text-emerald-300">
                    ✓ Réponse validée, la correction sera révélée au débriefing du tour.
                  </p>
                ) : (
                  <div className="mt-2 space-y-4">
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
                                checked={reponses[question.id] === option.id}
                                onChange={() =>
                                  setReponses((prec) => ({ ...prec, [question.id]: option.id }))
                                }
                                className="mt-1 accent-amber-400"
                              />
                              <span>{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {/* 3. Le rendu, en une fois */}
            <div className="space-y-2">
              <ErrorBox error={renduState.error} />
              <GuardError message={rendu.guardError} />
              <button
                type="submit"
                disabled={!complet || renduPending}
                aria-disabled={!complet || renduPending}
                title={complet ? undefined : messageIncomplet(manquants)}
                className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {renduPending ? "Envoi…" : "Rendre ma situation"}
              </button>
              {!complet ? (
                <p className="text-xs text-slate-500">
                  Le rendu part complet ou pas du tout : diagnostic et modèle seront corrigés ensemble au débriefing.
                </p>
              ) : null}
            </div>
          </form>
        )}

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
            <form ref={hint.formRef} action={hintAction} className="mt-2">
              <ErrorBox error={hintState.error} />
              <GuardError message={hint.guardError} />
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
          ) : situation.hintLimit ? (
            <p className="mt-2 text-xs text-slate-500">
              {situation.hintLimit}. À vous de trancher avec ce que vous avez.
            </p>
          ) : situation.unlockedHints.length === 5 ? (
            <p className="mt-2 text-xs text-slate-500">Tous les indices sont débloqués.</p>
          ) : null}
        </section>
      </div>
    </article>
  );
}

/** Débriefing d'une situation résolue : correction du diagnostic et du QCM + notions. */
export function SituationDebrief({
  situation,
  gameId,
  retakeable = false,
}: {
  situation: SituationView;
  /** Requis pour proposer un rattrapage (V1-6). */
  gameId?: string;
  /** La situation manquée est encore rattrapable (politique retake50, dernier tour clos). */
  retakeable?: boolean;
}) {
  const debrief = situation.debrief;
  if (!debrief) return null;
  const selected = new Set(situation.diagnosis?.selected ?? []);
  const answers = situation.quizAnswers ?? {};
  const scoreSur100 = Math.round(debrief.finalScore * 100);
  return (
    <article className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Débriefing</p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">{situation.title}</h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            situation.missed
              ? "border-amber-400/40 text-amber-300"
              : situation.retaken
                ? "border-sky-400/40 text-sky-300"
                : "border-white/10 text-slate-300"
          }`}
        >
          {situation.missed
            ? "Non rendue · 0 / 100"
            : situation.retaken
              ? `Rattrapée · ${scoreSur100} / 100`
              : `Score : ${scoreSur100} / 100`}
        </span>
      </header>
      {situation.missed ? (
        <p className="mb-3 rounded-lg border border-amber-400/20 bg-amber-950/10 px-3 py-2 text-sm text-slate-300">
          <span className="font-medium text-amber-200">Situation non rendue.</span> {situation.narrative}{" "}
          {situation.problem} Le modèle attendu et la correction restent consultables ci-dessous.
        </p>
      ) : null}
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
              {quizHeading(situation.quizQuestions)}
              {debrief.quizScore !== null
                ? ` · ${Math.round(debrief.quizScore * 100)} %`
                : " · non traité"}
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
        {debrief.modelInsight ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Le bon outil ici
            </p>
            <div className="mt-1 rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
              <p className="text-slate-300">{debrief.modelInsight.prompt}</p>
              <p className="mt-1 text-emerald-300">{debrief.modelInsight.answer}</p>
              <p className="mt-1 text-xs text-slate-500">{debrief.modelInsight.explain}</p>
            </div>
          </div>
        ) : null}
        {debrief.consequenceFacts && debrief.consequenceFacts.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Qu&apos;a-t-il évolué ?
            </p>
            <div className="mt-1 space-y-1.5">
              {debrief.consequenceFacts.map((fact, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-white/5 bg-slate-950 px-3 py-2"
                >
                  <span className="text-xs text-slate-500">{fact.label}</span>
                  <span className="flex items-baseline gap-2 text-sm">
                    <span className="text-slate-500">{fact.before}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-slate-200">{fact.after}</span>
                    <span
                      className={`text-xs font-medium ${
                        fact.direction === "positive"
                          ? "text-emerald-400"
                          : fact.direction === "negative"
                            ? "text-red-400"
                            : "text-slate-400"
                      }`}
                    >
                      {fact.delta}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {debrief.interpretation ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Comment interpréter cette évolution ?
            </p>
            <div className="mt-1 space-y-2 rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
              <p className="text-sm font-medium text-slate-200">{debrief.interpretation.mechanism}</p>
              <p className="text-sm text-slate-300">{debrief.interpretation.explanation}</p>
              <p className="text-sm italic text-amber-200/80">{debrief.interpretation.takeaway}</p>
            </div>
          </div>
        ) : null}
        {debrief.concepts.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notions mobilisées
            </p>
            <p className="mt-1 flex flex-wrap gap-2">
              {debrief.concepts.map((c) => (
                <a
                  key={c.code}
                  href={`/notions#${c.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-amber-200 hover:border-amber-400/40"
                >
                  <span className="text-xs uppercase tracking-wider text-slate-500">{c.domain}</span>
                  {c.name}
                </a>
              ))}
            </p>
          </div>
        ) : null}
      </div>
      {situation.missed && !situation.retaken && retakeable && gameId ? (
        <SituationRetake gameId={gameId} situation={situation} />
      ) : null}
    </article>
  );
}

/**
 * Rattrapage d'une situation manquée (V1-6, politique retake50) : un seul rendu,
 * noté à 50 %, avant la clôture suivante. Même forme que le rendu normal.
 */
function SituationRetake({ gameId, situation }: { gameId: string; situation: SituationView }) {
  const rendu = useGuardedAction(
    retakeSituationAction.bind(null, gameId, situation.instanceId),
    initial,
    { label: "rattrapage de situation" },
  );
  const { state, formAction, pending } = rendu;
  const questions = situation.quizQuestions;
  const [options, setOptions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const manquants = manques({ options, questions: questions.map((q) => q.id), reponses });
  const complet = manquants.length === 0;

  return (
    <form ref={rendu.formRef} action={formAction} className="mt-4 space-y-3 rounded-lg border border-sky-400/30 bg-sky-950/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
        Rattrapage · score compté pour moitié
      </p>
      <input type="hidden" name="questions" value={questions.map((q) => q.id).join(",")} />
      <div className="space-y-1.5">
        <p className="text-xs text-slate-400">Votre diagnostic</p>
        {situation.diagnosticOptions.map((option) => (
          <label key={option.id} className="flex items-start gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              name="options"
              value={option.id}
              checked={options.includes(option.id)}
              onChange={(e) =>
                setOptions((prec) =>
                  e.target.checked ? [...new Set([...prec, option.id])] : prec.filter((o) => o !== option.id),
                )
              }
              className="mt-1 accent-sky-400"
            />
            <span>{option.label}</span>
          </label>
        ))}
        <textarea
          name="freeText"
          rows={2}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Votre analyse en quelques mots (facultatif)…"
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/60"
        />
      </div>
      {questions.map((question, index) => (
        <fieldset key={question.id}>
          <legend className="text-sm font-medium text-slate-200">
            {index + 1}. {question.prompt}
          </legend>
          <div className="mt-1.5 space-y-1.5">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-start gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name={`quiz_${question.id}`}
                  value={option.id}
                  checked={reponses[question.id] === option.id}
                  onChange={() => setReponses((prec) => ({ ...prec, [question.id]: option.id }))}
                  className="mt-1 accent-sky-400"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <ErrorBox error={state.error} />
      <GuardError message={rendu.guardError} />
      <button
        type="submit"
        disabled={!complet || pending}
        aria-disabled={!complet || pending}
        title={complet ? undefined : messageIncomplet(manquants)}
        className="rounded-lg bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Rattraper cette situation"}
      </button>
    </form>
  );
}
