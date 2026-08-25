import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCompetitionView } from "@/services/competition.service";
import { CompetitionBoard } from "@/components/competition-board";
import { CompetitionControl } from "@/components/competition-controls";

export const dynamic = "force-dynamic";

export default async function TeacherCompetitionPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { competitionId } = await params;
  const view = await getCompetitionView(competitionId);
  if (!view || view.organizerId !== session.userId) notFound();

  const qualification = view.stages.find((s) => s.kind === "qualification");
  const finalStage = view.stages.find((s) => s.kind === "final");
  const qualificationDone =
    qualification !== undefined && qualification.games.every((g) => g.status === "finished");
  const finalDone = finalStage !== undefined && finalStage.games.every((g) => g.status === "finished");

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Concours</p>
        <h1 className="text-2xl font-bold">{view.name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Code d&apos;inscription : <span className="font-mono text-amber-300">{view.joinCode}</span>
          {" — "}les équipes s&apos;inscrivent sur <span className="font-mono">/compete</span>.
        </p>
      </header>

      {view.status === "registration" ? (
        <CompetitionControl competitionId={competitionId} action="qualification" />
      ) : null}
      {view.status === "running" && qualification && qualificationDone && !finalStage ? (
        <CompetitionControl competitionId={competitionId} action="final" />
      ) : null}
      {view.status === "running" && finalStage && finalDone ? (
        <CompetitionControl competitionId={competitionId} action="finish" />
      ) : null}
      {view.status === "running" && !qualificationDone && qualification ? (
        <p className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-400">
          Pilotez chaque partie (clôture des tours) via les liens « Piloter » ci-dessous.
          Règles du mode compétition : décisions verrouillées après validation, indices
          limités aux niveaux 1 à 3.
        </p>
      ) : null}

      <CompetitionBoard view={view} gameLinkBase="/teacher/games" />
    </main>
  );
}
