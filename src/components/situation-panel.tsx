"use client";

import { bouton } from "@/components/bouton";
import { useEffect, useState } from "react";
import {
  retakeSituationAction,
  submitSituationAction,
  unlockHintAction,
  type PedagogyState,
} from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { estRendue, manques, messageIncomplet } from "@/config/situation-rendu";
import type { SituationView } from "@/services/pedagogy.service";
import type { SituationCategory } from "@/config/scenarios/situation-kit";
import { Tiroir } from "@/components/tiroir";
import { useParcours } from "@/components/parcours-mobile";

const CATEGORY_LABELS: Record<SituationCategory, string> = {
  prise_de_poste: "Prise de poste",
  contexte_marche: "Contexte de marché",
  decision_strategique: "Décision stratégique",
  alerte_comptable: "Alerte comptable",
  alerte_operationnelle: "Alerte opérationnelle",
  tresorerie_dormante: "Trésorerie dormante",
  reussite: "Ce qui a marché",
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
    <p
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-300"
    >
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
export function SituationCard({
  gameId,
  situation,
}: {
  gameId: string;
  situation: SituationView;
}) {
  const hint = useGuardedAction(
    unlockHintAction.bind(null, gameId, situation.instanceId),
    initial,
    {
      label: "indice",
    },
  );
  const rendu = useGuardedAction(
    submitSituationAction.bind(null, gameId, situation.instanceId),
    initial,
    { label: "rendu de situation" },
  );
  const {
    state: hintState,
    formAction: hintAction,
    pending: hintPending,
  } = hint;
  const {
    state: renduState,
    formAction: renduAction,
    pending: renduPending,
  } = rendu;

  const diagnosisDone = situation.diagnosis !== null;
  const quizDone = situation.quizAnswers !== null;
  const rendue = estRendue(situation);
  // Questions encore à répondre : toutes, sauf si le modèle a déjà été validé
  // (rendu en deux temps d'une version antérieure) — on ne le redemande pas.
  const questionsARendre = quizDone ? [] : situation.quizQuestions;

  const [options, setOptions] = useState<string[]>(
    situation.diagnosis?.selected ?? [],
  );
  const [freeText, setFreeText] = useState(situation.diagnosis?.freeText ?? "");
  const [reponses, setReponses] = useState<Record<string, string>>(
    situation.quizAnswers ?? {},
  );

  useEffect(() => {
    if (rendue) return;
    try {
      const brut = window.localStorage.getItem(
        cleBrouillon(situation.instanceId),
      );
      if (!brut) return;
      const b = JSON.parse(brut) as Partial<BrouillonLocal>;
      if (!diagnosisDone && Array.isArray(b.options))
        setOptions(b.options.map(String));
      if (!diagnosisDone && typeof b.freeText === "string")
        setFreeText(b.freeText);
      if (!quizDone && b.reponses && typeof b.reponses === "object")
        setReponses(b.reponses);
    } catch {
      // stockage indisponible : le brouillon reste en mémoire
    }
  }, [situation.instanceId, rendue, diagnosisDone, quizDone]);

  useEffect(() => {
    if (rendue) return;
    try {
      const b: BrouillonLocal = { options, freeText, reponses };
      window.localStorage.setItem(
        cleBrouillon(situation.instanceId),
        JSON.stringify(b),
      );
    } catch {
      // idem
    }
  }, [situation.instanceId, rendue, options, freeText, reponses]);

  // SUR TÉLÉPHONE, l'analyse se fait écran par écran (voir parcours-mobile.tsx) :
  // le contexte, le diagnostic, puis une question du modèle à la fois. Tous les
  // champs restent dans le formulaire (masqués, pas retirés) : il part entier.
  const parcours = useParcours();
  const parEtapes = parcours !== null;
  const [etape, setEtape] = useState(0);
  const totalEtapes = rendue ? 1 : 2 + questionsARendre.length;
  const rapporterAnalyse = parcours?.rapporterAnalyse;
  useEffect(() => {
    rapporterAnalyse?.(rendue ? 0 : etape);
  }, [rapporterAnalyse, rendue, etape]);

  const manquants = manques({
    options,
    questions: questionsARendre.map((q) => q.id),
    reponses,
  });
  const complet = manquants.length === 0;

  const basculerOption = (id: string, coche: boolean) =>
    setOptions((prec) =>
      coche ? [...new Set([...prec, id])] : prec.filter((o) => o !== id),
    );

  const indices = (
    <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Besoin d&apos;aide ? Indices progressifs
      </h4>
      {situation.unlockedHints.length > 0 ? (
        <ol className="mt-2 space-y-1.5">
          {situation.unlockedHints.map((h) => (
            <li
              key={h.level}
              className="rounded-lg border border-white/5 bg-slate-900 px-3 py-2 text-sm text-slate-300"
            >
              <span className="mr-2 text-xs font-semibold text-amber-400">
                Indice {h.level}
              </span>
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
        <p className="mt-2 text-xs text-slate-400">
          {situation.hintLimit}. À vous de trancher avec ce que vous avez.
        </p>
      ) : situation.unlockedHints.length === 5 ? (
        <p className="mt-2 text-xs text-slate-400">
          Tous les indices sont débloqués.
        </p>
      ) : null}
    </section>
  );

  if (parEtapes) {
    return (
      <AnalyseParEtapes
        situation={situation}
        etape={etape}
        setEtape={setEtape}
        totalEtapes={totalEtapes}
        rendue={rendue}
        quizDone={quizDone}
        questionsARendre={questionsARendre}
        options={options}
        basculerOption={basculerOption}
        freeText={freeText}
        setFreeText={setFreeText}
        reponses={reponses}
        setReponses={setReponses}
        complet={complet}
        manquants={manquants}
        formRef={rendu.formRef}
        guardError={rendu.guardError}
        renduAction={renduAction}
        renduState={renduState}
        renduPending={renduPending}
        indices={indices}
        parcours={parcours}
      />
    );
  }

  return (
    <article className="carte p-4 sm:p-6">
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
        <h3 className="mt-1 text-lg font-semibold text-slate-100">
          {situation.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {situation.narrative}
        </p>
        <p className="mt-2 text-sm font-medium text-amber-200">
          {situation.problem}
        </p>
      </header>

      {situation.triggerFacts && situation.triggerFacts.length > 0 ? (
        <div className="mb-4">
          {/*
          Ouvert d'office quand la situation a été DÉTECTÉE : les chiffres
          sont la raison même de la carte — la demande qui s'adressait à
          l'équipe et celle qui est repartie. Repliés, l'élève lisait « une
          part importante de la demande » sans jamais voir combien.
        */}
          <Tiroir
            titre="Pourquoi cette situation ?"
            quoi={`${situation.triggerFacts.length} fait${situation.triggerFacts.length > 1 ? "s" : ""}`}
            ouvert={situation.origin === "detected"}
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {situation.triggerFacts.map((fact, i) => (
                <div
                  key={i}
                  className="col-span-2 flex items-baseline justify-between gap-3"
                >
                  <dt className="text-xs text-slate-400">{fact.label}</dt>
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
          </Tiroir>
        </div>
      ) : null}

      {/* Pas d'étiquette de statut ici : le bouton de rendu grisé (et son
          infobulle) disent déjà ce qui manque, et une fois l'analyse rendue le
          fil d'étapes passe aux décisions — inutile d'afficher « rendue ». */}
      <div className="space-y-4">
        {rendue ? (
          <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
            <p className="text-sm text-emerald-300">
              ✓ Analyse rendue — correction au débriefing.
            </p>
          </section>
        ) : (
          <form ref={rendu.formRef} action={renduAction} className="space-y-4">
            <input
              type="hidden"
              name="questions"
              value={questionsARendre.map((q) => q.id).join(",")}
            />

            {/* 1. Diagnostic */}
            <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Votre diagnostic
              </h4>
              {/* Les cases forment un groupe : fieldset + legend le disent au
                  lecteur d'écran, qui annonce alors « Quel est le problème
                  principal ? » avant d'égrener les options. */}
              <fieldset className="mt-1 min-w-0 border-0 p-0">
                <legend className="text-xs text-slate-400">
                  Quel est le problème principal ?
                </legend>
                <div className="mt-2 space-y-2">
                  {situation.diagnosticOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-2 text-sm text-slate-200"
                    >
                      <input
                        type="checkbox"
                        name="options"
                        value={option.id}
                        checked={options.includes(option.id)}
                        onChange={(e) =>
                          basculerOption(option.id, e.target.checked)
                        }
                        className="mt-1 accent-amber-400"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <textarea
                name="freeText"
                rows={2}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                aria-label="Votre analyse écrite du problème"
                placeholder="Votre analyse du problème en quelques mots…"
                className="mt-2 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
              />
            </section>

            {/* 2. Questions : connaissances et/ou modèle d'analyse */}
            {situation.quizQuestions.length > 0 ? (
              <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {quizHeading(situation.quizQuestions)}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Comment analyser ce problème ?
                </p>
                {quizDone ? (
                  <p className="mt-2 text-sm text-emerald-300">
                    ✓ Réponse validée — correction au débriefing.
                  </p>
                ) : (
                  <div className="mt-2 space-y-4">
                    {situation.quizQuestions.map((question) => (
                      <fieldset key={question.id}>
                        <legend className="text-sm font-medium text-slate-200">
                          {question.prompt}
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
                                  setReponses((prec) => ({
                                    ...prec,
                                    [question.id]: option.id,
                                  }))
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
                className={`${bouton()} pointer-coarse:min-h-11`}
              >
                {renduPending ? "Envoi…" : "Valider mon analyse"}
              </button>
              {!complet ? (
                <p className="text-xs text-slate-400">
                  Complet ou rien : diagnostic et modèle partent ensemble.
                </p>
              ) : null}
            </div>
          </form>
        )}

        {indices}
      </div>
    </article>
  );
}

const LIGNE_DE_CHOIX =
  "flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-white/15 px-4 py-3 text-base text-slate-100 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10";

/**
 * L'analyse d'une situation, écran par écran (téléphone).
 *
 * Contexte, diagnostic, puis UNE question du modèle par écran, avec le pied du
 * parcours : « Retour » et « Continuer », qui devient « Valider mon analyse »
 * sur le dernier écran. Chaque écran n'avance que s'il est répondu : sinon le
 * rendu, qui part complet ou pas du tout, se bloquerait au dernier pas sur une
 * réponse qu'on n'a plus sous les yeux.
 */
function AnalyseParEtapes({
  situation,
  etape,
  setEtape,
  totalEtapes,
  rendue,
  quizDone,
  questionsARendre,
  options,
  basculerOption,
  freeText,
  setFreeText,
  reponses,
  setReponses,
  complet,
  manquants,
  formRef,
  guardError,
  renduAction,
  renduState,
  renduPending,
  indices,
  parcours,
}: {
  situation: SituationView;
  etape: number;
  setEtape: (e: number) => void;
  totalEtapes: number;
  rendue: boolean;
  quizDone: boolean;
  questionsARendre: SituationView["quizQuestions"];
  options: string[];
  basculerOption: (id: string, coche: boolean) => void;
  freeText: string;
  setFreeText: (t: string) => void;
  reponses: Record<string, string>;
  setReponses: (
    f: (prec: Record<string, string>) => Record<string, string>,
  ) => void;
  complet: boolean;
  manquants: ReturnType<typeof manques>;
  formRef: React.RefObject<HTMLFormElement | null>;
  guardError: string | null;
  renduAction: (formData: FormData) => void;
  renduState: PedagogyState;
  renduPending: boolean;
  indices: React.ReactNode;
  parcours: NonNullable<ReturnType<typeof useParcours>>;
}) {
  const aller = (e: number) => {
    setEtape(e);
    window.scrollTo({ top: 0 });
  };
  const dernier = totalEtapes - 1;
  const entete = (eyebrow: string, titre: string, ordinal: string) => (
    <header className="space-y-2 pb-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">
        {eyebrow}
        {ordinal ? ` · ${ordinal}` : ""}
      </p>
      <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-slate-50">
        {titre}
      </h2>
    </header>
  );
  const pied = (contenu: React.ReactNode, message?: string | null) => (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-slate-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/90 print:hidden">
        {message ? (
          <p className="pb-2 text-sm text-slate-300">{message}</p>
        ) : null}
        <div className="flex gap-2.5">{contenu}</div>
      </div>
    </>
  );
  const retour = (surClic: () => void) => (
    <button
      type="button"
      onClick={surClic}
      className={`${bouton({ variante: "secondaire", taille: "l" })} min-h-12 shrink-0`}
    >
      Retour
    </button>
  );

  if (rendue) {
    return (
      <div>
        {entete(CATEGORY_LABELS[situation.category], situation.title, "")}
        <p className="text-base leading-relaxed text-emerald-300">
          ✓ Analyse rendue : correction au débriefing.
        </p>
        {pied(
          <>
            {retour(parcours.reculer)}
            <button
              type="button"
              onClick={parcours.continuer}
              className={`${bouton({ taille: "l" })} min-h-12 flex-1`}
            >
              Continuer
              <span aria-hidden>→</span>
            </button>
          </>,
        )}
        <div aria-hidden className="h-[calc(5.5rem+env(safe-area-inset-bottom))]" />
      </div>
    );
  }

  const question = etape >= 2 ? questionsARendre[etape - 2] : undefined;
  const bloque =
    etape === 1
      ? options.length === 0
      : question
        ? !reponses[question.id]
        : false;
  const message =
    etape === dernier && !complet
      ? messageIncomplet(manquants)
      : bloque
        ? etape === 1
          ? "Cochez au moins une réponse pour continuer."
          : "Choisissez une réponse pour continuer."
        : null;

  return (
    <div>
      <form ref={formRef} action={renduAction}>
        <input
          type="hidden"
          name="questions"
          value={questionsARendre.map((q) => q.id).join(",")}
        />

        <section hidden={etape !== 0} className="space-y-4">
          {entete(CATEGORY_LABELS[situation.category], situation.title, "")}
          {situation.aboveGameLevel ? (
            <p className="text-base text-sky-300">
              Cette situation dépasse le niveau choisi pour la partie.
            </p>
          ) : null}
          <p className="text-base leading-relaxed text-slate-200">
            {situation.narrative}
          </p>
          <p className="text-base font-medium leading-relaxed text-amber-200">
            {situation.problem}
          </p>
          {situation.triggerFacts && situation.triggerFacts.length > 0 ? (
            <Tiroir
              titre="Pourquoi cette situation ?"
              quoi={`${situation.triggerFacts.length} fait${situation.triggerFacts.length > 1 ? "s" : ""}`}
              ouvert={situation.origin === "detected"}
            >
              <dl className="space-y-2">
                {situation.triggerFacts.map((fact, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="text-sm text-slate-400">{fact.label}</dt>
                    <dd
                      className={`text-base font-medium ${
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
            </Tiroir>
          ) : null}
        </section>

        <section hidden={etape !== 1}>
          {entete(
            "Analyse",
            "Quel est le problème principal ?",
            `1 sur ${totalEtapes - 1}`,
          )}
          <fieldset className="min-w-0 space-y-2 border-0 p-0">
            <legend className="sr-only">
              Quel est le problème principal ?
            </legend>
            {situation.diagnosticOptions.map((option) => (
              <label key={option.id} className={LIGNE_DE_CHOIX}>
                <input
                  type="checkbox"
                  name="options"
                  value={option.id}
                  checked={options.includes(option.id)}
                  onChange={(e) => basculerOption(option.id, e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <textarea
            name="freeText"
            rows={3}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            aria-label="Votre analyse écrite du problème"
            placeholder="En quelques mots, votre analyse (facultatif)…"
            className="mt-3 w-full champ px-3 py-3 text-base text-slate-100 outline-none"
          />
        </section>

        {situation.quizQuestions.map((q) => {
          const rang = questionsARendre.findIndex((x) => x.id === q.id);
          if (quizDone || rang < 0) return null;
          return (
            <section key={q.id} hidden={etape !== rang + 2}>
              {entete(
                "Analyse",
                q.prompt,
                `${rang + 2} sur ${totalEtapes - 1}`,
              )}
              <fieldset className="min-w-0 space-y-2 border-0 p-0">
                <legend className="sr-only">{q.prompt}</legend>
                {q.options.map((option) => (
                  <label key={option.id} className={LIGNE_DE_CHOIX}>
                    <input
                      type="radio"
                      name={`quiz_${q.id}`}
                      value={option.id}
                      checked={reponses[q.id] === option.id}
                      onChange={() =>
                        setReponses((prec) => ({ ...prec, [q.id]: option.id }))
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
            </section>
          );
        })}

        <div className="space-y-2 pt-3">
          {etape === dernier ? <ErrorBox error={renduState.error} /> : null}
          {etape === dernier ? <GuardError message={guardError} /> : null}
        </div>

        {pied(
          <>
            {retour(etape === 0 ? parcours.reculer : () => aller(etape - 1))}
            {etape < dernier ? (
              <button
                type="button"
                disabled={bloque}
                onClick={() => aller(etape + 1)}
                className={`${bouton({ taille: "l" })} min-h-12 flex-1`}
              >
                Continuer
                <span aria-hidden>→</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!complet || renduPending}
                aria-disabled={!complet || renduPending}
                className={`${bouton({ taille: "l" })} min-h-12 flex-1`}
              >
                {renduPending ? "Envoi…" : "Valider mon analyse"}
              </button>
            )}
          </>,
          message,
        )}
      </form>

      {/* Les indices, hors du formulaire (ils ont le leur) : un tiroir sur les
          écrans où l'on répond, jamais sur le contexte. */}
      <div hidden={etape === 0} className="pt-2">
        <Tiroir
          titre="Besoin d'un indice ?"
          quoi={
            situation.unlockedHints.length > 0
              ? `${situation.unlockedHints.length} débloqué${situation.unlockedHints.length > 1 ? "s" : ""}`
              : undefined
          }
        >
          {indices}
        </Tiroir>
      </div>
      {/* La place du pied fixe : sans elle, la fin de l'écran passerait dessous. */}
      <div aria-hidden className="h-[calc(7rem+env(safe-area-inset-bottom))]" />
    </div>
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
    <article className="carte p-4 sm:p-6">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Débriefing
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">
            {situation.title}
          </h3>
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
          <span className="font-medium text-amber-200">
            Situation non rendue.
          </span>{" "}
          {situation.narrative} {situation.problem} Modèle et correction
          ci-dessous.
        </p>
      ) : null}
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Diagnostic
          </p>
          <ul className="mt-1 space-y-1">
            {situation.diagnosticOptions.map((option) => {
              const correct = debrief.correctOptionIds.includes(option.id);
              const chosen = selected.has(option.id);
              return (
                <li
                  key={option.id}
                  className={
                    correct
                      ? "text-emerald-300"
                      : chosen
                        ? "text-red-400"
                        : "text-slate-400"
                  }
                >
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
                const correction = debrief.quizCorrection.find(
                  (c) => c.id === question.id,
                );
                if (!correction) return null;
                const answered = answers[question.id];
                const credit = answered
                  ? (correction.credits[answered] ?? 0)
                  : 0;
                const correctLabel = question.options.find(
                  (o) => o.id === correction.correctOptionId,
                )?.label;
                return (
                  <li
                    key={question.id}
                    className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2"
                  >
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
                        <span className="text-emerald-300">
                          {" "}
                          · le plus juste : {correctLabel}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {correction.explain}
                    </p>
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
              <p className="mt-1 text-emerald-300">
                {debrief.modelInsight.answer}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {debrief.modelInsight.explain}
              </p>
            </div>
          </div>
        ) : null}
        {debrief.consequenceFacts && debrief.consequenceFacts.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Qu&apos;est-ce qui a évolué ?
            </p>
            <div className="mt-1 space-y-1.5">
              {debrief.consequenceFacts.map((fact, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-white/5 bg-slate-950 px-3 py-2"
                >
                  <span className="text-xs text-slate-400">{fact.label}</span>
                  <span className="flex items-baseline gap-2 text-sm">
                    <span className="text-slate-400">{fact.before}</span>
                    <span className="text-slate-400">→</span>
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
              <p className="text-sm font-medium text-slate-200">
                {debrief.interpretation.mechanism}
              </p>
              <p className="text-sm text-slate-300">
                {debrief.interpretation.explanation}
              </p>
              <p className="text-sm italic text-amber-200/80">
                {debrief.interpretation.takeaway}
              </p>
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
                  <span className="text-xs uppercase tracking-wider text-slate-400">
                    {c.domain}
                  </span>
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
function SituationRetake({
  gameId,
  situation,
}: {
  gameId: string;
  situation: SituationView;
}) {
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
  const manquants = manques({
    options,
    questions: questions.map((q) => q.id),
    reponses,
  });
  const complet = manquants.length === 0;

  return (
    <form
      ref={rendu.formRef}
      action={formAction}
      className="mt-4 space-y-3 rounded-lg border border-sky-400/30 bg-sky-950/10 p-3 sm:p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
        Rattrapage · score compté pour moitié
      </p>
      <input
        type="hidden"
        name="questions"
        value={questions.map((q) => q.id).join(",")}
      />
      <div className="space-y-1.5">
        <fieldset className="min-w-0 space-y-1.5 border-0 p-0">
          <legend className="text-xs text-slate-400">Votre diagnostic</legend>
          {situation.diagnosticOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-2 text-sm text-slate-200"
            >
              <input
                type="checkbox"
                name="options"
                value={option.id}
                checked={options.includes(option.id)}
                onChange={(e) =>
                  setOptions((prec) =>
                    e.target.checked
                      ? [...new Set([...prec, option.id])]
                      : prec.filter((o) => o !== option.id),
                  )
                }
                className="mt-1 accent-sky-400"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <textarea
          name="freeText"
          rows={2}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          aria-label="Votre analyse écrite du problème"
          placeholder="Votre analyse du problème en quelques mots…"
          className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none [--focus-champ:var(--color-sky-400)]"
        />
      </div>
      {questions.map((question) => (
        <fieldset key={question.id}>
          <legend className="text-sm font-medium text-slate-200">
            {question.prompt}
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
                    setReponses((prec) => ({
                      ...prec,
                      [question.id]: option.id,
                    }))
                  }
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
