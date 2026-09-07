import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCompetitionView } from "@/services/competition.service";
import { CompetitionBoard } from "@/components/competition-board";
import { CompetitionControl } from "@/components/competition-controls";
import { CompetitionSettings, CompetitionSteps } from "@/components/competition-steps";
import { StageSchedule } from "@/components/stage-schedule";
import { PublicPageForm } from "@/components/public-page-form";
import { SITE_URL } from "@/config/site";

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
    <main id="main" className="mx-auto max-w-4xl space-y-6 px-2 py-6 sm:p-6">
      <Link
        href="/teacher"
        className="inline-block text-sm text-slate-400 underline-offset-4 hover:text-amber-300 hover:underline"
      >
        ← Mes parties et concours
      </Link>
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Concours</p>
        <h1 className="text-2xl font-bold">{view.name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Code d&apos;inscription : <span className="font-mono text-amber-300">{view.joinCode}</span>
          {" · "}les équipes s&apos;inscrivent sur <span className="font-mono">/compete</span>.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompetitionSettings rules={view.rules} joinCode={view.joinCode} />
        <CompetitionSteps concours={view} />
      </div>

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
        <p className="rounded-lg border border-white/10 bg-slate-900 px-1.5 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-400">
          Pilotez chaque partie (clôture des tours) via les liens « Piloter » ci-dessous.
          Règles du mode compétition : décisions verrouillées après validation, indices
          limités aux niveaux 1 à 3.
        </p>
      ) : null}

      {view.status !== "finished" && view.stages.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-slate-900 p-1.5 sm:p-4">
          <h2 className="text-sm font-semibold text-slate-200">🗓️ Planning des étapes</h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            Fenêtre pendant laquelle les équipes peuvent jouer les parties de chaque étape (heure
            de Paris). En dehors, l&apos;arène passe en lecture seule. Cette fenêtre s&apos;ajoute à
            celle de chaque partie et de chaque tour. Laissez un champ vide pour ne pas poser de
            borne.
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {view.stages.map((stage) => (
              <StageSchedule
                key={stage.stageId}
                competitionId={competitionId}
                stageId={stage.stageId}
                kind={stage.kind}
                startsAt={stage.startsAt}
                endsAt={stage.endsAt}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-900 p-1.5 sm:p-4">
        <h2 className="text-sm font-semibold text-slate-200">🌐 Page publique d&apos;annonce</h2>
        <p className="mt-1 max-w-3xl text-xs text-slate-400">
          Une page ouverte pour annoncer l&apos;événement, avec un bouton d&apos;inscription et des
          boutons de partage (LinkedIn, X, Facebook, WhatsApp). Les dates du programme reprennent
          le planning des étapes. Rien n&apos;est en ligne tant que vous n&apos;avez pas coché « Rendre
          la page publique ».
        </p>
        <div className="mt-3">
          <PublicPageForm
            competitionId={competitionId}
            publicUrl={`${SITE_URL}/concours/${view.joinCode}`}
            visible={view.publicPage.visible}
            tagline={view.publicPage.tagline}
            description={view.publicPage.description}
            organizerLabel={view.publicPage.organizerLabel}
            accent={view.publicPage.accent}
          />
        </div>
      </section>

      <CompetitionBoard view={view} gameLinkBase="/teacher/games" />
    </main>
  );
}
