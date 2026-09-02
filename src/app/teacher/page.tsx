import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGames } from "@/services/game.service";
import { getOrganizerCompetitions } from "@/services/competition.service";
import { getStaffContext } from "@/services/admin.service";
import { createClassGameAction, logoutAction } from "./actions";
import { periodLabel } from "@/config/scenarios/periodicity";
import { compter } from "@/lib/format";
import { DEFAULT_QUIZ_MODE, DIFFICULTY_PRESETS, QUIZ_MODES } from "@/config/difficulty";
import {
  DEFAULT_SCENARIO_CODE,
  SCENARIOS,
  SECTOR_LABELS,
  economicDefaults,
} from "@/config/scenarios/registry";
import { CompetitionCreateForm } from "@/components/competition-create-form";
import { GuardedForm } from "@/components/guarded-action";
import { EconomicParams } from "@/components/economic-params";
import { SubmitButton } from "@/components/submit-button";
import { FormPendingProgress } from "@/components/long-action-progress";
import { ATTENTES } from "@/config/cloture";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: Promise<{ echec?: string }>;
}) {
  const { echec } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const games = await getTeacherGames(session.userId);
  const competitions = await getOrganizerCompetitions(session.userId);
  const staff = await getStaffContext(session.userId);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Espace enseignant</p>
          <h1 className="text-2xl font-bold">Mes parties</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/usage"
            className="text-xs text-amber-300 underline-offset-4 hover:underline"
          >
            Carnet d&apos;usage
          </Link>
          {isOrgAdmin ? (
            <Link href="/org" className="text-xs text-amber-300 underline-offset-4 hover:underline">
              Mon établissement
            </Link>
          ) : null}
          {staff?.isPlatformAdmin ? (
            <Link href="/admin" className="text-xs text-amber-300 underline-offset-4 hover:underline">
              Administration
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button className="text-xs text-slate-500 underline hover:text-slate-300">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      {echec ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
        >
          La partie n&apos;a pas été créée. {echec}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Créer une partie</h2>
        <p className="mt-1 text-xs text-slate-500">
          Vous ne savez pas quels réglages prendre ?{" "}
          <Link href="/ateliers" className="text-amber-300 underline-offset-4 hover:underline">
            Les ateliers professionnels
          </Link>{" "}
          donnent un déroulé de plusieurs séances avec les réglages qui vont avec.
        </p>
        <GuardedForm
          action={createClassGameAction}
          label="création de partie"
          timeoutMs={30_000}
          className="mt-4 grid gap-4 sm:grid-cols-3"
        >
          <EconomicParams
            scenarios={SCENARIOS.map((d) => ({
              code: d.code,
              label: `${SECTOR_LABELS[d.sector]} · ${d.title}`,
              unit: d.vocabulary.unit,
              defaults: economicDefaults(d),
            }))}
            defaultCode={DEFAULT_SCENARIO_CODE}
          />

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Équipes (élèves)
            </span>
            <select
              name="humanTeamsCount"
              defaultValue={4}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} équipe{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Concurrents bots
            </span>
            <select
              name="botCount"
              defaultValue={1}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} bot{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Périodicité
            </span>
            <select
              name="periodicity"
              defaultValue="quarter"
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="month">Un mois par tour</option>
              <option value="quarter">Un trimestre par tour</option>
              <option value="year">Une année par tour</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Tours joués
            </span>
            <select
              name="roundsCount"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Toute la partie</option>
              {[3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} tours
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Une partie se raccourcit pour tenir dans un nombre de séances donné. Elle ne
              s&apos;allonge pas : les situations et les événements d&apos;un secteur sont écrits
              pour un nombre de tours, au delà les équipes joueraient sans matière.
            </span>
          </label>
          <label className="block sm:col-span-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Niveau de difficulté
            </span>
            <select
              name="level"
              defaultValue={3}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              {DIFFICULTY_PRESETS.map((p) => (
                <option key={p.level} value={p.level}>
                  {p.level} · {p.name} : {p.tagline}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950 px-3 py-3 sm:col-span-3">
            <input
              type="checkbox"
              name="variableWorld"
              defaultChecked
              className="mt-0.5 h-4 w-4 accent-amber-400"
            />
            <span>
              <span className="text-sm font-medium text-slate-200">
                🌍 Monde variable · chaque partie diffère
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Croissance des segments, saisonnalité, événements et commandes exceptionnelles
                varient d&apos;une partie à l&apos;autre (déterministe par partie : toutes vos
                équipes jouent le même monde). Décochez pour le scénario classique, identique
                à vos supports imprimés.
              </span>
            </span>
          </label>

          <fieldset className="rounded-lg border border-white/10 bg-slate-950 px-3 py-3 sm:col-span-3">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              📝 Questions posées dans les situations
            </legend>
            <div className="mt-1 space-y-2">
              {QUIZ_MODES.map((m) => (
                <label key={m.code} className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="quizMode"
                    value={m.code}
                    defaultChecked={m.code === DEFAULT_QUIZ_MODE}
                    className="mt-0.5 h-4 w-4 accent-amber-400"
                  />
                  <span>
                    <span className="text-sm font-medium text-slate-200">{m.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{m.help}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Le réglage se modifie ensuite à tout moment depuis la partie. Les situations déjà
              débriefées gardent le score obtenu sous l&apos;ancien réglage.
            </p>
          </fieldset>

          <FormPendingProgress label={ATTENTES.creationPartie} className="sm:col-span-3" />
          <SubmitButton
            pendingLabel="Création de la partie et des équipes…"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 sm:col-span-3"
          >
            Créer la partie et obtenir le code d&apos;invitation
          </SubmitButton>
        </GuardedForm>
        <p className="mt-2 text-xs text-slate-500">
          Le nombre total d&apos;entreprises (équipes + bots) est plafonné à 8. Les élèves
          rejoignent avec le code, répartis automatiquement dans les équipes. Le niveau règle
          les décisions ouvertes, le plafond d&apos;indices et la fréquence des événements.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Organiser un concours · Business Arena Championship
        </h2>
        <CompetitionCreateForm />
        <p className="mt-2 text-xs text-slate-500">
          Les équipes s&apos;inscrivent avec le code sur /compete. Mode compétition :
          décisions verrouillées après validation, indices limités.
        </p>
        {competitions.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {competitions.map((c) => (
              <li key={c.competitionId}>
                <Link
                  href={`/teacher/competitions/${c.competitionId}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm transition hover:border-amber-400/40"
                >
                  <span>
                    <span className="font-mono text-amber-300">{c.joinCode}</span>
                    <span className="ml-3 text-slate-300">{c.name}</span>
                  </span>
                  <span className="text-slate-400">
                    {compter(c.entriesCount, "équipe")} ·{" "}
                    {c.status === "registration"
                      ? "inscriptions"
                      : c.status === "running"
                        ? "en cours"
                        : "terminé"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        {games.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune partie pour l&apos;instant.</p>
        ) : (
          games.map((g) => (
            <Link
              key={g.gameId}
              href={`/teacher/games/${g.gameId}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm transition hover:border-amber-400/40"
            >
              <span>
                <span className="font-mono text-amber-300">{g.joinCode}</span>
                <span className="ml-3 text-slate-300">{compter(g.teamsCount, "équipe")}</span>
              </span>
              <span className="text-slate-400">
                {g.status === "finished"
                  ? "Terminée"
                  : `${periodLabel(g.roundDays, g.currentRound)} / ${g.roundsCount}`}
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
