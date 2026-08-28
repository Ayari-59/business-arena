import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherUsageView } from "@/services/pedagogy.service";

export const dynamic = "force-dynamic";

/**
 * Carnet d'usage : ce que la vue par partie ne peut pas dire.
 *
 * Une situation ratée par une classe est un accident. Ratée par cinq, c'est
 * l'énoncé qui est en cause. Cette page agrège toutes les parties d'un
 * enseignant pour faire apparaître ce qui ne se voit qu'à cette échelle.
 *
 * Elle ne collecte rien de nouveau : tout vient de données déjà enregistrées
 * pour le jeu lui-même, et rien n'y est nominatif.
 */

const pct = (v: number) => `${Math.round(v * 100)} %`;
const one = (v: number) => v.toFixed(1).replace(".", ",");

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

export default async function UsagePage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const usage = await getTeacherUsageView(session.userId);

  const totals = [
    { label: "Parties créées", value: usage.totals.games },
    { label: "Parties terminées", value: usage.totals.finishedGames },
    { label: "Équipes", value: usage.totals.teams },
    { label: "Situations débriefées", value: usage.totals.situationsDebriefed },
    { label: "Indices ouverts", value: usage.totals.hintsUnlocked },
  ];

  const maxHints = Math.max(1, ...usage.hintsByLevel.map((h) => h.count));

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Espace enseignant</p>
        <h1 className="mt-1 text-2xl font-bold">Carnet d&apos;usage</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Ce que toutes vos parties disent ensemble, et qu&apos;aucune ne dit seule. Une
          situation ratée par une classe est un accident ; ratée par cinq, c&apos;est
          l&apos;énoncé qu&apos;il faut revoir.
        </p>
        <Link
          href="/teacher"
          className="mt-3 inline-block text-xs text-slate-500 underline-offset-4 hover:underline"
        >
          ← Retour à mes parties
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {totals.map((t) => (
          <div key={t.label} className="rounded-xl border border-white/10 bg-slate-900 p-4">
            <p className="text-2xl font-bold tabular-nums text-amber-400">{t.value}</p>
            <p className="mt-1 text-xs leading-tight text-slate-500">{t.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Les situations qui résistent
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          Classées par score moyen croissant : les plus difficiles en tête. Le score comprend le
          malus d&apos;indices, ce qui explique qu&apos;une situation très aidée descende. Le
          compte est en équipes, celui des notions plus bas en élèves. Deux silences ne
          comptent pas comme des échecs : une équipe restée sans joueur, qui n&apos;apparaît
          nulle part, et une équipe qui n&apos;a rien rendu, comptée à part plutôt que
          moyennée à zéro. Une situation que personne n&apos;a traitée ferme donc la marche,
          sans score.
        </p>
        {usage.situations.length === 0 ? (
          <div className="mt-4">
            <Empty>
              Rien encore. Le carnet se remplit à la première situation débriefée, donc au
              premier tour clôturé.
            </Empty>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Situation</th>
                  <th className="pb-2 pr-3 font-medium">Secteur</th>
                  <th className="pb-2 pr-3 text-right font-medium">Équipes</th>
                  <th className="pb-2 pr-3 text-right font-medium">Sans réponse</th>
                  <th className="pb-2 pr-3 text-right font-medium">Score moyen</th>
                  <th className="pb-2 text-right font-medium">Indices / équipe</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {usage.situations.map((s) => (
                  <tr key={s.code} className="border-t border-white/5">
                    <td className="py-2 pr-3">{s.title}</td>
                    <td className="py-2 pr-3 text-slate-500">{s.scenario}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-400">
                      {s.debriefed}
                    </td>
                    <td
                      className={`py-2 pr-3 text-right tabular-nums ${
                        s.unanswered > 0 ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {s.unanswered > 0 ? s.unanswered : "—"}
                    </td>
                    <td
                      className={`py-2 pr-3 text-right font-medium tabular-nums ${
                        s.averageScore === null
                          ? "text-slate-600"
                          : s.averageScore < 0.4
                            ? "text-red-300"
                            : s.averageScore < 0.65
                              ? "text-amber-300"
                              : "text-emerald-300"
                      }`}
                    >
                      {s.averageScore === null ? "—" : pct(s.averageScore)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-400">
                      {s.debriefed === 0 ? "—" : one(s.averageHints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-200">Jusqu&apos;où vont les indices</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Les cinq niveaux vont de l&apos;observation à la méthode détaillée. Beaucoup de
            niveaux 4 et 5 signalent une marche trop haute, pas des élèves paresseux.
          </p>
          {usage.totals.hintsUnlocked === 0 ? (
            <div className="mt-4">
              <Empty>Aucun indice ouvert pour l&apos;instant.</Empty>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {usage.hintsByLevel.map((h) => (
                <li key={h.level} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-slate-500">Niveau {h.level}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-950">
                    <span
                      className="block h-full rounded-full bg-amber-400/70"
                      style={{ width: `${Math.round((h.count / maxHints) * 100)}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right tabular-nums text-slate-400">
                    {h.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-sm font-semibold text-slate-200">Secteurs joués</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Un secteur jamais joué n&apos;est pas forcément mauvais : il est peut-être
            simplement invisible au moment de créer la partie.
          </p>
          {usage.sectors.length === 0 ? (
            <div className="mt-4">
              <Empty>Aucune partie créée pour l&apos;instant.</Empty>
            </div>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {usage.sectors.map((s) => (
                <li key={s.code} className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-300">{s.title}</span>
                  <span className="tabular-nums text-slate-400">
                    {s.games} partie{s.games > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          Notions les moins ancrées, toutes classes confondues
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          Maîtrise moyenne de vos élèves, sur 100. C&apos;est ici que se lisent les notions à
          reprendre en cours plutôt que dans le jeu.
        </p>
        {usage.concepts.length === 0 ? (
          <div className="mt-4">
            <Empty>
              Rien encore. La maîtrise se construit au fil des situations débriefées.
            </Empty>
          </div>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {usage.concepts.slice(0, 12).map((c) => (
              <li
                key={c.code}
                className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm"
              >
                <span className="text-slate-300">{c.name}</span>
                <span className="tabular-nums text-slate-400">
                  {Math.round(c.average)}
                  <span className="ml-2 text-xs text-slate-600">
                    {c.students} élève{c.students > 1 ? "s" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
