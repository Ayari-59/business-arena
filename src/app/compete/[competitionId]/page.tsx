import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { getPlayerCompetition } from "@/services/competition.service";
import { CompetitionBoard } from "@/components/competition-board";

export const dynamic = "force-dynamic";

export default async function PlayerCompetitionPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const userId = await getGuestUserId();
  if (!userId) notFound();
  const data = await getPlayerCompetition(competitionId, userId);
  if (!data) notFound();
  const { view, myGameId, myTeamLabel } = data;

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Concours</p>
          <h1 className="text-2xl font-bold">{view.name}</h1>
          {myTeamLabel ? (
            <p className="mt-1 text-sm text-slate-400">
              Votre équipe : <span className="text-amber-200">{myTeamLabel}</span>
            </p>
          ) : null}
        </div>
        {myGameId ? (
          <Link
            href={`/arena/${myGameId}`}
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
          >
            Jouer ma partie →
          </Link>
        ) : view.status === "registration" ? (
          <p className="rounded-full border border-white/10 px-4 py-1 text-sm text-slate-300">
            En attente du lancement des qualifications
          </p>
        ) : null}
      </header>
      <CompetitionBoard view={view} gameLinkBase={null} />
    </main>
  );
}
