import Link from "next/link";
import { getGuestUserId } from "@/lib/guest";
import { getPlayerProfile } from "@/services/profile.service";
import type { SkillAxis } from "@/config/pedagogy/concepts";

export const dynamic = "force-dynamic";

const AXIS_LABELS: Record<SkillAxis, string> = {
  finance: "Finance",
  marketing: "Marketing",
  production: "Production",
  analysis: "Analyse",
  strategy: "Stratégie",
  decision: "Décision",
  risk: "Risque",
};

const masteryTone = (v: number) =>
  v < 40 ? "bg-red-400" : v < 70 ? "bg-amber-400" : "bg-emerald-400";

export default async function ProfilePage() {
  const userId = await getGuestUserId();
  const profile = userId ? await getPlayerProfile(userId) : null;

  if (!profile) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Profil de compétences</h1>
        <p className="max-w-md text-sm text-slate-400">
          Votre profil se construit en jouant : lancez une première partie pour commencer
          à mesurer vos compétences de gestion.
        </p>
        <Link href="/" className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">
          Jouer une partie
        </Link>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-1 text-2xl font-bold">Profil · {profile.displayName}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Vos compétences évoluent à chaque situation traitée : diagnostics justes, modèles
          bien choisis et autonomie (peu d&apos;indices) font progresser la maîtrise.
        </p>
        <Link href="/" className="mt-2 inline-block text-xs text-slate-500 underline-offset-4 hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </header>

      <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Compétences par axe (§28)</h2>
        {profile.skills.length === 0 ? (
          <p className="text-sm text-slate-500">
            Encore aucune mesure : traitez les situations proposées pendant vos parties.
          </p>
        ) : (
          <ul className="space-y-2">
            {profile.skills.map((s) => (
              <li key={s.axis} className="text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{AXIS_LABELS[s.axis]}</span>
                  <span className="tabular-nums text-slate-400">{Math.round(s.value)}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-slate-950">
                  <div className={`h-1.5 rounded-full ${masteryTone(s.value)}`} style={{ width: `${Math.max(2, Math.min(100, s.value))}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Maîtrise des notions</h2>
        {profile.concepts.length === 0 ? (
          <p className="text-sm text-slate-500">Les notions rencontrées en jeu apparaîtront ici.</p>
        ) : (
          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {profile.concepts.map((c) => (
              <li key={c.code} className="text-sm">
                <div className="flex items-center justify-between text-slate-300">
                  <Link href={`/notions#${c.code}`} className="hover:text-amber-200">
                    {c.name}
                  </Link>
                  <span className="tabular-nums text-slate-400">{Math.round(c.mastery)}</span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-slate-950">
                  <div className={`h-1 rounded-full ${masteryTone(c.mastery)}`} style={{ width: `${Math.max(2, Math.min(100, c.mastery))}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Mes parties</h2>
        {profile.games.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune partie jouée sur ce navigateur.</p>
        ) : (
          <ul className="space-y-2">
            {profile.games.map((g) => (
              <li key={g.gameId}>
                <Link
                  href={`/arena/${g.gameId}`}
                  className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  <span>
                    {g.teamName}
                    <span className="ml-2 text-xs text-slate-500">
                      {g.kind === "class" ? "partie de classe" : "solo"} ·{" "}
                      {g.status === "finished" ? "terminée" : `tour ${g.currentRound}/${g.roundsCount}`}
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {g.bpi !== null ? `BPI ${g.bpi.toFixed(1)}` : "—"}
                    {g.rank !== null ? ` · #${g.rank}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
