import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { getGameGradeSheet, getTeacherPedagogyView } from "@/services/pedagogy.service";
import { formatEuro } from "@/lib/format";
import { periodLabel } from "@/config/scenarios/periodicity";
import { setMissedPolicyAction, setQuizModeAction } from "../../actions";
import { QUIZ_MODES } from "@/config/difficulty";
import { estParDefaut } from "@/config/decision-source";
import { MISSED_POLICY_LABELS, MISSED_POLICY_HELP } from "@/config/missed-situation";
import { CardDeck } from "@/components/card-deck";
import { CloseRoundForm } from "@/components/close-round-form";
import { SubmitButton } from "@/components/submit-button";
import { GuardedForm } from "@/components/guarded-action";
import { RoundStatusPoller } from "@/components/round-status-poller";

export const dynamic = "force-dynamic";

export default async function TeacherGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const view = await getTeacherGameView(gameId, session.userId);
  if (!view) notFound();
  const pedagogy = await getTeacherPedagogyView(gameId, session.userId);
  const releve = await getGameGradeSheet(gameId, session.userId);

  const finished = view.status === "finished";
  const humanTeams = view.teams.filter((t) => t.controller === "human");
  const submittedCount = humanTeams.filter((t) => t.hasSubmitted).length;

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Pilotage de partie</p>
          <h1 className="text-2xl font-bold">
            Code d&apos;invitation : <span className="font-mono text-amber-300">{view.joinCode}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Les élèves rejoignent sur <span className="font-mono">/join</span> avec ce code.
          </p>
          <p className="mt-1 text-xs text-slate-500">{view.scenarioTitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            {finished
              ? "Partie terminée"
              : `${periodLabel(view.roundDays, view.currentRound)} / ${view.roundsCount}`}
          </p>
          {/* Le niveau et le monde variable se choisissent à la création puis
              disparaissaient : le niveau n'était plus lisible que côté élève, et
              la case du monde variable nulle part. Une partie doit pouvoir dire
              sous quelles règles elle tourne. */}
          <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            Niveau {view.difficulty.level} · {view.difficulty.name}
          </p>
          <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            {view.variableWorld ? "Monde variable" : "Monde figé"}
          </p>
        </div>
      </header>

      {!finished && view.mode === "learning" ? (
        <CardDeck
          gameId={view.gameId}
          pendingEvents={view.pendingEvents}
          teams={view.teams
            .filter((t) => t.controller === "human")
            .map((t) => ({ teamId: t.teamId, name: t.name }))}
          scenarioEventCodes={view.scenarioEventCodes}
          scenarioCode={view.scenarioCode}
        />
      ) : null}

      {!finished ? (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-200">
            📝 Questions posées dans les situations
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-500">
            Le diagnostic est toujours posé : c&apos;est le cœur de la situation. Ce réglage ne
            porte que sur les questions qui le suivent. Les situations déjà débriefées gardent
            le score obtenu sous l&apos;ancien réglage.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {QUIZ_MODES.map((m) => {
              const active = m.code === view.quizMode;
              return (
                <GuardedForm
                  key={m.code}
                  action={setQuizModeAction.bind(null, view.gameId)}
                  label="questions posées"
                >
                  <input type="hidden" name="mode" value={m.code} />
                  <SubmitButton
                    disabled={active}
                    className={`h-full w-full rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? "cursor-default border-amber-400/60 bg-amber-400/10"
                        : "border-white/10 bg-slate-950 hover:border-amber-400/40"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-amber-300" : "text-slate-200"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {m.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{m.help}</span>
                  </SubmitButton>
                </GuardedForm>
              );
            })}
          </div>
        </section>
      ) : null}

      {!finished ? (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-200">📚 Situations manquées</h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-500">
            Une situation non rendue reste consultable par l&apos;élève dans l&apos;onglet Mémoire.
            Vous choisissez si elle peut être rattrapée. Réglage appliqué aux tours à venir ; les
            situations déjà rattrapées gardent leur score.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["readonly", "retake50"] as const).map((p) => {
              const active = p === view.missedPolicy;
              return (
                <GuardedForm
                  key={p}
                  action={setMissedPolicyAction.bind(null, view.gameId)}
                  label="situations manquées"
                >
                  <input type="hidden" name="policy" value={p} />
                  <SubmitButton
                    disabled={active}
                    className={`h-full w-full rounded-lg border px-3 py-3 text-left transition ${
                      active
                        ? "cursor-default border-amber-400/60 bg-amber-400/10"
                        : "border-white/10 bg-slate-950 hover:border-amber-400/40"
                    }`}
                  >
                    <span className={`text-sm font-medium ${active ? "text-amber-300" : "text-slate-200"}`}>
                      {active ? "✓ " : ""}
                      {MISSED_POLICY_LABELS[p]}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{MISSED_POLICY_HELP[p]}</span>
                  </SubmitButton>
                </GuardedForm>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Équipes · état des décisions du tour {view.currentRound}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-medium">Équipe</th>
                <th className="pb-2 pr-3 font-medium">Joueurs</th>
                <th className="pb-2 pr-3 font-medium">Décisions</th>
                <th className="pb-2 pr-3 text-right font-medium">Dernier résultat</th>
                <th className="pb-2 text-right font-medium">Trésorerie</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {view.teams.map((t) => (
                <tr key={t.teamId} className="border-t border-white/5">
                  <td className="py-2 pr-3">
                    {t.name}
                    {t.controller === "bot" ? (
                      <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs uppercase text-slate-500">
                        bot{t.botPersonality ? ` · ${t.botPersonality}` : ""}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">
                    {t.controller === "bot" ? "—" : t.playerNames.join(", ") || "aucun joueur"}
                  </td>
                  <td className="py-2 pr-3">
                    {finished ? (
                      "—"
                    ) : t.hasSubmitted ? (
                      <>
                        <span className="text-emerald-400">validées</span>
                        {estParDefaut(t.decisionSource) ? (
                          <span
                            title="Prix et volume validés sans modification des valeurs proposées"
                            className="ml-2 rounded bg-orange-950/60 px-1.5 py-0.5 text-xs text-orange-300"
                          >
                            par défaut
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-amber-300">en attente</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {t.lastNetIncome === null ? "—" : formatEuro(t.lastNetIncome)}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      (t.lastNetTreasury ?? 0) < 0 ? "text-red-400" : ""
                    }`}
                  >
                    {t.lastNetTreasury === null ? "—" : formatEuro(t.lastNetTreasury)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!finished ? (
          <CloseRoundForm
            gameId={view.gameId}
            tour={view.currentRound}
            validees={submittedCount}
            total={humanTeams.length}
          />
        ) : null}
      </section>

      {pedagogy ? (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Vue pédagogique</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notions exposées ce tour
                </h3>
                {pedagogy.conceptsExposed.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">Aucune situation ouverte ce tour.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {pedagogy.conceptsExposed.map((c) => (
                      <li
                        key={c.code}
                        className="rounded-full border border-white/10 bg-slate-950 px-2.5 py-0.5 text-xs text-slate-300"
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Maîtrise mesurée (de la plus fragile à la plus solide)
                </h3>
                {pedagogy.conceptMastery.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Aucune situation rendue : rien n&apos;est mesuré pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {pedagogy.conceptMastery.slice(0, 8).map((c) => (
                      <li key={c.code} className="text-sm">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>
                            {c.name}
                            <span className="ml-1.5 text-xs text-slate-500">
                              · {c.students} élève{c.students > 1 ? "s" : ""}
                            </span>
                          </span>
                          <span className="tabular-nums text-slate-400">{Math.round(c.average)}</span>
                        </div>
                        {/* 0 = barre vide : un zéro mesuré se voit comme un zéro. */}
                        <div className="mt-0.5 h-1.5 rounded-full bg-slate-950">
                          <div
                            className={`h-1.5 rounded-full ${c.average < 40 ? "bg-red-400" : c.average < 70 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.max(0, Math.min(100, c.average))}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Indices consommés
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {pedagogy.hintsUsedByTeam.map((t) => (
                  <li key={t.teamName} className="flex justify-between">
                    <span>{t.teamName}</span>
                    <span className="tabular-nums text-slate-400">{t.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {view.quizMode === "model" ? "Choix du modèle d'analyse" : "Questions des situations"}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li className="flex justify-between">
                  <span>Réponses validées</span>
                  <span className="tabular-nums text-slate-400">{pedagogy.quizStats.submitted}</span>
                </li>
                <li className="flex justify-between">
                  <span>Taux de bonnes réponses</span>
                  <span className="tabular-nums text-slate-400">
                    {pedagogy.quizStats.submitted > 0
                      ? `${Math.round(pedagogy.quizStats.averageScore * 100)} %`
                      : "—"}
                  </span>
                </li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                {view.quizMode === "off"
                  ? "Aucune question n'est posée dans cette partie : ces chiffres portent sur les tours joués sous un autre réglage."
                  : view.quizMode === "model"
                    ? "Un taux faible signale des élèves qui décident sans savoir sur quel outil d'analyse s'appuyer."
                    : "Un taux faible signale des connaissances mal ancrées : le tableau des notions ci-contre dit lesquelles reprendre en classe."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {releve && releve.teams.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Relevé de notes</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                Deux mesures séparées, et non fondues en une : la note tirée des situations
                rendues dit ce que l&apos;équipe a compris, le score composite dit ce que
                l&apos;entreprise a fait. Une bonne analyse peut mener à un mauvais
                trimestre, et les pondérer serait votre choix, pas celui du logiciel. Une
                situation non rendue est comptée à part, jamais moyennée à zéro.
              </p>
            </div>
            <a
              href={`/teacher/games/${view.gameId}/releve`}
              className="shrink-0 rounded-lg border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
            >
              ⬇ Tableur (une ligne par élève)
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Équipe</th>
                  <th className="pb-2 pr-3 font-medium">Élèves</th>
                  <th className="pb-2 pr-3 text-right font-medium">Rendues</th>
                  <th className="pb-2 pr-3 text-right font-medium">Non rendues</th>
                  <th className="pb-2 pr-3 text-right font-medium">Diagnostic</th>
                  <th className="pb-2 pr-3 text-right font-medium">Indices</th>
                  <th className="pb-2 pr-3 text-right font-medium">Note</th>
                  <th className="pb-2 text-right font-medium">Gestion</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {releve.teams.map((equipe) => (
                  <tr key={equipe.teamId} className="border-t border-white/5">
                    <td className="py-2 pr-3">{equipe.name}</td>
                    <td className="py-2 pr-3 text-xs text-slate-500">
                      {equipe.students.length > 0 ? equipe.students.join(", ") : "aucun élève"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-400">
                      {equipe.answered}
                    </td>
                    <td
                      className={`py-2 pr-3 text-right tabular-nums ${
                        equipe.unanswered > 0 ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {equipe.unanswered > 0 ? equipe.unanswered : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-400">
                      {equipe.diagnosisAverage === null
                        ? "—"
                        : `${Math.round(equipe.diagnosisAverage * 100)} %`}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-400">
                      {equipe.hintsUsed === 0
                        ? "—"
                        : `${equipe.hintsUsed} (−${equipe.hintPenalty.toString().replace(".", ",")} pt)`}
                    </td>
                    <td
                      className={`py-2 pr-3 text-right font-semibold tabular-nums ${
                        equipe.note === null
                          ? "text-slate-600"
                          : equipe.note < 8
                            ? "text-red-300"
                            : equipe.note < 13
                              ? "text-amber-300"
                              : "text-emerald-300"
                      }`}
                    >
                      {equipe.note === null
                        ? "—"
                        : `${equipe.note.toString().replace(".", ",")} / 20`}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-400">
                      {equipe.bpi === null ? "—" : `${equipe.bpi.toFixed(1)} · ${equipe.rank}ᵉ`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {releve.roundsResolved === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              Aucun tour clôturé : le relevé se remplit à la première clôture.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Classement</h2>
        {view.ranking.length === 0 ? (
          <p className="text-sm text-slate-500">Disponible après le premier tour.</p>
        ) : (
          <ol className="space-y-2">
            {view.ranking.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300"
              >
                <span>
                  <span className="mr-2 text-slate-500">#{row.rank}</span>
                  {row.name}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-slate-100">BPI {row.bpi.toFixed(1)}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {formatEuro(row.cumulativeNetIncome)} cumulés
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {!finished ? (
        <RoundStatusPoller
          gameId={view.gameId}
          currentRound={view.currentRound}
          roundStatus="open"
          endpoint="submissions"
          submittedCount={submittedCount}
        />
      ) : null}
    </main>
  );
}
