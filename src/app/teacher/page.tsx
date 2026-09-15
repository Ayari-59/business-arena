import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGames } from "@/services/game.service";
import { getOrganizerCompetitions } from "@/services/competition.service";
import { getStaffContext } from "@/services/admin.service";
import { createClassGameAction, logoutAction, logoutEverywhereAction } from "./actions";
import { periodLabel } from "@/config/scenarios/periodicity";
import { compter } from "@/lib/format";
import { DEFAULT_QUIZ_MODE, DIFFICULTY_PRESETS, QUIZ_MODES } from "@/config/difficulty";
import {
  DEFAULT_SCENARIO_CODE,
  SCENARIO_CHOICES,
  familyOf,
  SECTOR_COLORS,
  SECTOR_LABELS,
  economicDefaults,
} from "@/config/scenarios/registry";
import { listScenariosByAuthor } from "@/services/scenario-editor.service";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { CompetitionCreateForm } from "@/components/competition-create-form";
import { GuardedForm } from "@/components/guarded-action";
import { EconomicParams } from "@/components/economic-params";
import { SubmitButton } from "@/components/submit-button";
import { FormPendingProgress } from "@/components/long-action-progress";
import { EnTeteEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { Tiroir } from "@/components/tiroir";
import { FriseDesTours } from "@/components/frise-des-tours";
import { ATTENTES } from "@/config/cloture";

export const dynamic = "force-dynamic";

/**
 * Un scénario à famille se joue en un produit ou en gamme selon le niveau
 * choisi juste à côté : le libellé du choix le dit, pour que l'enseignant
 * n'aille pas chercher une case « gamme » qui n'existe pas.
 */
function familleNote(code: string): string {
  const famille = familyOf(code);
  return famille ? ` (${famille.monoLabel} jusqu'au niveau ${famille.gammeFromLevel - 1}, la gamme dès le niveau ${famille.gammeFromLevel})` : "";
}

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

  // Scénarios enseignants PUBLIÉS de ce prof : lançables comme un secteur
  // intégré. Un brouillon reste privé à l'éditeur tant qu'il n'est pas publié.
  const mesScenarios = await listScenariosByAuthor(session.userId);
  const scenariosPublies = await Promise.all(
    mesScenarios
      .filter((s) => s.status === "published")
      .map(async (s) => {
        const def = await resolveScenarioDefinition(s.code);
        return {
          code: s.code,
          label: `★ ${def.title}`,
          unit: def.vocabulary.unit,
          defaults: economicDefaults(def),
        };
      }),
  );

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-8 px-2 py-6 sm:p-6">
      <EnTeteEnseignant
        titre="Mes parties"
        actif="parties"
        liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        compte={
          <>
            <form action={logoutAction}>
              <button className="text-xs text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline">
                Se déconnecter
              </button>
            </form>
            <form action={logoutEverywhereAction}>
              <button
                className="text-xs text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
                title="Ferme aussi les sessions ouvertes sur d'autres appareils"
              >
                Se déconnecter partout
              </button>
            </form>
          </>
        }
      />

      {echec ? (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-red-200"
        >
          La partie n&apos;a pas été créée. {echec}
        </p>
      ) : null}

      {/*
        LES PARTIES D'ABORD. On vient ici pour retrouver sa classe, pas pour
        remplir un formulaire : la liste ouvre la page, la création suit. Chaque
        partie a le visage de son secteur (la tuile de l'arène), son code, et sa
        frise des tours.
      */}
      <Rubrique note={games.length > 0 ? compter(games.length, "partie") : undefined}>
        Mes parties
      </Rubrique>
      {games.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 px-4 py-5 text-center text-sm text-slate-400">
          Aucune partie pour l&apos;instant. Créez la première ci-dessous : vous obtiendrez un
          code d&apos;invitation à donner à vos élèves.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {games.map((g) => {
            const finished = g.status === "finished";
            const joues = new Map<number, null>();
            for (let n = 1; n < (finished ? g.roundsCount + 1 : g.currentRound); n++) joues.set(n, null);
            return (
              <li key={g.gameId}>
                <Link
                  href={`/teacher/games/${g.gameId}`}
                  className="carte flex h-full items-center gap-3 px-3 py-3 transition hover:border-amber-400/40 sm:px-4"
                >
                  <span
                    aria-hidden
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${SECTOR_COLORS[g.sector].bg}`}
                  >
                    {g.scenarioIcon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-100">
                      {g.scenarioTitle}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {compter(g.teamsCount, "équipe")} ·{" "}
                      {finished
                        ? "partie terminée"
                        : `${periodLabel(g.roundDays, g.currentRound)} sur ${g.roundsCount}`}
                    </span>
                    <span className="mt-1.5 block">
                      <FriseDesTours
                        roundsCount={g.roundsCount}
                        currentRound={g.currentRound}
                        resultats={joues}
                        finished={finished}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs uppercase tracking-wide text-slate-400">Code</span>
                    <span className="block font-mono text-base font-semibold text-amber-300">
                      {g.joinCode}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Rubrique>Créer une partie</Rubrique>
      <section className="carte p-4 sm:p-7">
        <h2 className="text-sm font-semibold text-slate-200">Nouvelle partie de classe</h2>
        <p className="mt-1 text-xs text-slate-400">
          Vous ne savez pas quels réglages prendre ?{" "}
          <Link href="/animations" className="text-amber-300 underline-offset-4 hover:underline">
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
            scenarios={[
              ...SCENARIO_CHOICES.map((d) => ({
                code: d.code,
                label: `${d.icon} ${SECTOR_LABELS[d.sector]} · ${d.title}${familleNote(d.code)}`,
                unit: d.vocabulary.unit,
                defaults: economicDefaults(d),
              })),
              ...scenariosPublies,
            ]}
            defaultCode={DEFAULT_SCENARIO_CODE}
          />

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Équipes (élèves)
            </span>
            <select
              name="humanTeamsCount"
              defaultValue={4}
              className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm"
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
              className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">Toute la partie</option>
              {[3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} tours
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-400">
              Une partie se raccourcit pour tenir dans un nombre de séances donné. Elle ne
              s&apos;allonge pas : les situations et les événements d&apos;un secteur sont écrits
              pour un nombre de tours, au-delà, les équipes joueraient sans matière.
            </span>
          </label>
          <label className="block sm:col-span-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Niveau de difficulté
            </span>
            <select
              name="level"
              defaultValue={3}
              className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm"
            >
              {DIFFICULTY_PRESETS.map((p) => (
                <option key={p.level} value={p.level}>
                  {p.level} · {p.name} : {p.tagline}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-950 px-3 py-3 sm:col-span-3">
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
              <span className="mt-0.5 block text-xs text-slate-400">
                Croissance des segments, saisonnalité, événements et commandes exceptionnelles
                varient d&apos;une partie à l&apos;autre (déterministe par partie : toutes vos
                équipes jouent le même monde). Décochez pour le scénario classique, identique
                à vos supports imprimés.
              </span>
            </span>
          </label>

          <fieldset className="rounded-lg border border-white/5 bg-slate-950 px-3 py-3 sm:col-span-3">
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
                    <span className="mt-0.5 block text-xs text-slate-400">{m.help}</span>
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
        <p className="mt-2 text-xs text-slate-400">
          Le nombre total d&apos;entreprises (équipes + bots) est plafonné à 8. Les élèves
          rejoignent avec le code, répartis automatiquement dans les équipes. Le niveau règle
          les décisions ouvertes, le plafond d&apos;indices et la fréquence des événements.
        </p>
      </section>

      <Rubrique note={competitions.length > 0 ? compter(competitions.length, "concours") : undefined}>
        Concours
      </Rubrique>
      <section className="carte p-4 sm:p-7">
        {competitions.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {competitions.map((c) => (
              <li key={c.competitionId}>
                <Link
                  href={`/teacher/competitions/${c.competitionId}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950 px-3 py-2.5 text-sm transition hover:border-amber-400/40 sm:px-4 sm:py-3"
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
        {/*
          Le concours est l'usage rare : son formulaire attend dans un tiroir,
          ouvert seulement pour qui n'a encore ni partie ni concours.
        */}
        <Tiroir
          titre="Organiser un concours · Business Arena Championship"
          ouvert={competitions.length === 0 && games.length === 0}
        >
          <CompetitionCreateForm />
          <p className="mt-2 text-xs text-slate-400">
            Les équipes s&apos;inscrivent avec le code sur /compete. Mode compétition :
            décisions verrouillées après validation, indices limités.
          </p>
        </Tiroir>
      </section>
    </main>
  );
}
