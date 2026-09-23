import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCompetitionView } from "@/services/competition.service";
import { CompetitionBoard } from "@/components/competition-board";
import { CompetitionControl, NouvellePhase } from "@/components/competition-controls";
import { CompetitionSettings, CompetitionSteps } from "@/components/competition-steps";
import { StageSchedule } from "@/components/stage-schedule";
import { PublicPageForm } from "@/components/public-page-form";
import { SITE_URL } from "@/config/site";
import { EnTeteEnseignant } from "@/components/en-tete-enseignant";

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

  // LA PHASE EN COURS, QUELLE QU'ELLE SOIT. Le concours n'a plus deux phases
  // nommées mais autant que l'organisateur en lance : on raisonne donc sur
  // celle qui tourne, et non sur « la qualification » et « la finale ».
  const phase = view.stages.find((s) => s.status === "running") ?? null;
  const phaseTerminee =
    phase !== null && phase.games.length > 0 && phase.games.every((g) => g.status === "finished");
  const finale = phase?.kind === "final" ? phase : null;

  // Combien d'équipes sortiront de la phase en cours : une poule envoie en
  // moyenne autant d'équipes que son format l'annonce. C'est la matière de la
  // phase suivante, et ce que l'aperçu doit chiffrer.
  const survivantes = phase
    ? phase.games.length * Math.max(1, phase.format.advanceCount ?? 1)
    : 0;

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-6 px-2 py-6 sm:p-6">
      <EnTeteEnseignant
        surtitre="Concours"
        titre={view.name}
        tuile={
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-2xl"
          >
            🏆
          </span>
        }
        description={
          <>
            Code d&apos;inscription :{" "}
            <span className="font-mono text-amber-300">{view.joinCode}</span>
            {" · "}les équipes s&apos;inscrivent sur <span className="font-mono">/compete</span>.
          </>
        }
        droite={
          <Link
            href="/teacher"
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 transition hover:bg-amber-400/20"
          >
            ← Mes parties et concours
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CompetitionSettings rules={view.rules} joinCode={view.joinCode} />
        <CompetitionSteps concours={view} />
      </div>

      {view.status === "registration" ? (
        <CompetitionControl competitionId={competitionId} action="qualification" />
      ) : null}
      {view.status === "running" && phaseTerminee && !finale ? (
        <div className="space-y-4">
          <NouvellePhase
            competitionId={competitionId}
            equipesEnLice={survivantes}
            taillePouleParDefaut={view.rules.groupSize}
            qualifieesParDefaut={view.rules.advancePerGroup}
          />
          <CompetitionControl competitionId={competitionId} action="final" />
        </div>
      ) : null}
      {view.status === "running" && finale && phaseTerminee ? (
        <CompetitionControl competitionId={competitionId} action="finish" />
      ) : null}
      {view.status === "running" && phase && !phaseTerminee ? (
        <p className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-400">
          Pilotez chaque partie (clôture des tours) via les liens « Piloter » ci-dessous.
          Règles du mode compétition : décisions verrouillées après validation, indices
          limités aux niveaux 1 à 3.
        </p>
      ) : null}

      {view.status !== "finished" && view.stages.length > 0 ? (
        <section className="carte p-3 sm:p-5">
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

      <section className="carte p-3 sm:p-5">
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
