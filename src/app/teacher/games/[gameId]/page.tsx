import Link from "next/link";
import { mentionDeValidation } from "@/config/validation-du-tour";
import { dureeDuTour } from "@/config/duree-du-tour";
import { DureeDuTourAffichee } from "@/components/duree-du-tour";
import { getObservationSeance } from "@/services/observation.service";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { compositionDesEquipes } from "@/services/affectation.service";
import { getGameGradeSheet, getTeacherPedagogyView } from "@/services/pedagogy.service";
import { compter, formatEuro } from "@/lib/format";
import { periodLabel } from "@/config/scenarios/periodicity";
import { setMissedPolicyAction, setQuizModeAction } from "../../actions";
import { QUIZ_MODES } from "@/config/difficulty";
import { estParDefaut } from "@/config/decision-source";
import { MISSED_POLICY_LABELS, MISSED_POLICY_HELP } from "@/config/missed-situation";
import { CompositionEquipes } from "@/components/composition-equipes";
import { SubventionsPanel } from "@/components/subventions-panel";
import { DistributionCourrier } from "@/components/distribution-courrier";
import { CloseRoundForm } from "@/components/close-round-form";
import { SubmitButton } from "@/components/submit-button";
import { GuardedForm } from "@/components/guarded-action";
import { RoundStatusPoller } from "@/components/round-status-poller";
import { setGameScheduleAction, setRankingRevealedAction, setRoundWindowsAction } from "../../actions";
import { utcToParisLocalInput } from "@/lib/paris-time";
import { JustificationsReview } from "@/components/justifications-review";
import { EnTeteEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { Tiroir } from "@/components/tiroir";
import { FriseDesTours } from "@/components/frise-des-tours";
import { SECTOR_COLORS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { entitlementsForUser } from "@/services/entitlements.service";
import { resolveAiSurface } from "@/services/ai.service";

/** Libellé court de l'état d'un tour, pour le tableau du planning fin. */
const ROUND_STATUS_LABEL: Record<string, string> = {
  pending: "à venir",
  open: "en cours",
  resolving: "en calcul",
  resolved: "clos",
};

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
  // Qui joue dans quelle équipe : le seul écran d'où l'on répare une
  // affectation, et le seul recours d'un élève revenu d'un autre poste.
  const composition = await compositionDesEquipes(gameId);

  const finished = view.status === "finished";
  const humanTeams = view.teams.filter((t) => t.controller === "human");
  const submittedCount = humanTeams.filter((t) => t.hasSubmitted).length;
  const defaillantes = view.ranking.filter((row) => row.defaillant);
  // Le tour dont le classement se révèle : le dernier clos. Les précédents sont
  // derrière nous, celui en cours n'a pas encore de classement.
  const dernierTourClos = [...view.rounds]
    .filter((r) => r.status === "resolved")
    .sort((a3, b3) => b3.index - a3.index)[0];

  // Synthèse IA des justifications (facultative) : droit du compte + réglage
  // admin + clé API.
  const aiEnt = await entitlementsForUser(session.userId);
  const aiReview = aiEnt.ai && (await resolveAiSurface("teacherReview")) !== null;

  const toursBornes = view.rounds.filter((r) => r.opensAt || r.deadline).length;
  // La frise : un segment plein par tour clos, sans signe (il y a un résultat
  // par équipe, pas un pour la classe), l'ambre pour celui en cours.
  const toursJoues = new Map<number, null>(
    view.rounds.filter((r) => r.status === "resolved").map((r) => [r.index, null]),
  );
  const animer = (!finished && view.mode === "learning") || view.aidRequests.length > 0;

  // COMBIEN DE TEMPS CE TOUR VA PRENDRE. L'estimation se calcule sur ce que la
  // partie demande vraiment (texte à lire, champs ouverts, situation) ; la
  // mesure, quand elle existe, vient du dernier tour clos de cette partie et
  // lui passe devant. Le repère de départ d'un tour est la clôture du
  // précédent, donc la mesure existe dès le deuxième tour clos, planning ou
  // non.
  const dureeEstimee = dureeDuTour({
    ...view.chargeDuTour,
    premierTour: view.currentRound === 1,
  });
  const observation = await getObservationSeance(gameId, session.userId);
  const tourMesure = [...(observation?.tours ?? [])]
    .filter((t) => t.clos && t.minutesMedianes !== null)
    .sort((a4, b4) => b4.index - a4.index)[0];

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-4 px-2 py-6 sm:space-y-6 sm:p-6">
      <EnTeteEnseignant
        surtitre={`Pilotage de partie · ${SECTOR_LABELS[view.sector]}`}
        accent={SECTOR_COLORS[view.sector].accent}
        tuile={
          <span
            aria-hidden
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${SECTOR_COLORS[view.sector].bg}`}
          >
            {view.scenarioIcon}
          </span>
        }
        titre={view.scenarioTitle}
        actif="parties"
        droite={
          <>
            {finished ? (
              <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                Partie terminée
              </p>
            ) : null}
            {/* Le niveau et le monde variable se choisissent à la création puis
                disparaissaient : une partie doit pouvoir dire sous quelles
                règles elle tourne. */}
            <p className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-300">
              Niveau {view.difficulty.level} · {view.difficulty.name}
            </p>
            <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {view.variableWorld ? "🌍 Monde variable" : "Monde figé"}
            </p>
            <FriseDesTours
              roundsCount={view.roundsCount}
              currentRound={view.currentRound}
              resultats={toursJoues}
              finished={finished}
            />
          </>
        }
      />

      {/*
        LE TICKET. Le code d'invitation est la seule chose que l'enseignant
        écrit au tableau : il a sa carte à lui, en pointillé comme un billet à
        détacher, et il se lit de loin.
      */}
      <section
        aria-label="Code d'invitation"
        className="carte flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-dashed border-amber-400/40 px-4 py-4 sm:px-6"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Code d&apos;invitation</p>
          <p
            id="code-invitation"
            className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-amber-300"
          >
            {view.joinCode}
          </p>
        </div>
        <div className="text-sm text-slate-300">
          <p>
            Les élèves rejoignent sur <span className="font-mono text-slate-100">/join</span> avec
            ce code, répartis automatiquement dans les {compter(humanTeams.length, "équipe")}.
          </p>
          {/* Le classement dit qui gagne ; l'observation dit si la classe joue
              encore et ce qu'un tour lui coûte. Deux questions, deux écrans. */}
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {/* Et la projection dit à la CLASSE où elle en est : le code, les
                validations, le classement, écrits assez grand pour le fond de
                la salle. C'est le premier lien, parce que c'est celui qu'on
                ouvre en branchant le vidéoprojecteur. */}
            <Link
              href={`/teacher/games/${gameId}/projection`}
              className="text-xs text-amber-300 underline-offset-4 hover:underline"
            >
              📽️ Projeter pour la classe →
            </Link>
            <Link
              href={`/teacher/games/${gameId}/observation`}
              className="text-xs text-amber-300 underline-offset-4 hover:underline"
            >
              Observation de séance →
            </Link>
          </span>
        </div>
      </section>

      {view.planCapped ? (
        <section className="rounded-xl border border-amber-400/40 bg-amber-950/20 p-3 sm:p-5">
          <h2 className="text-sm font-semibold text-amber-300">
            🔒 Version gratuite — la partie s&apos;est arrêtée avant la fin
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-amber-200/80">
            Le palier gratuit s&apos;arrête au tour {view.currentRound} sur {view.roundsCount}.
            Activez une licence établissement pour jouer le scénario jusqu&apos;au bout, ouvrir les
            concours, l&apos;export du relevé et le feedback IA.
          </p>
        </section>
      ) : null}

      {defaillantes.length > 0 ? (
        <section className="rounded-xl border border-red-400/40 bg-red-950/30 p-3 sm:p-5">
          <h2 className="text-sm font-semibold text-red-300">
            ⚠️ {defaillantes.length === 1 ? "Une entreprise défaillante" : `${defaillantes.length} entreprises défaillantes`}
          </h2>
          <p className="mt-1 text-xs text-red-200/80">
            Deux tours consécutifs de cessation de paiements. L&apos;activité est gelée (ni
            production, ni charges) et la note financière tombe à zéro. Seule une augmentation de
            capital qui ramène le découvert sous le plafond fait repartir l&apos;entreprise.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {defaillantes.map((row) => (
              <li
                key={row.name}
                className="rounded-full border border-red-400/40 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-200"
              >
                {row.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/*
        L'ORDRE DE LA SÉANCE. D'abord ce tour : qui a validé, et le geste de
        clôture. Puis ce que l'animateur peut jouer (une carte, une aide).
        Puis ce qu'il lit (classement, notions, relevé). Les réglages, qu'on
        touche une fois, ferment la page dans des tiroirs.
      */}
      <Rubrique
        note={
          finished
            ? `${view.roundsCount} tours joués`
            : `${periodLabel(view.roundDays, view.currentRound)} · ${submittedCount}/${humanTeams.length} ${humanTeams.length > 1 ? "équipes ont validé" : "équipe a validé"} · ${
                tourMesure ? `≈ ${tourMesure.minutesMedianes} min (mesuré)` : `≈ ${dureeEstimee.minutes} min (estimé)`
              }`
        }
      >
        {finished ? "Fin de partie" : "Ce tour"}
      </Rubrique>
      <section className="carte p-3 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Équipes · état des décisions du {periodLabel(view.roundDays, view.currentRound).toLowerCase()}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
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
                      <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs uppercase text-slate-400">
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
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">✓ validées</span>
                        {estParDefaut(t.decisionSource) ? (
                          <span
                            title="Prix et volume validés sans modification des valeurs proposées"
                            className="ml-2 rounded bg-orange-950/60 px-1.5 py-0.5 text-xs text-orange-300"
                          >
                            par défaut
                          </span>
                        ) : null}
                        {/* Par qui, et à quelle heure. La table le notait déjà
                            à chaque envoi ; personne ne le lisait. L'enseignant
                            qui voit un élève inactif sait maintenant si son
                            équipe a validé sans lui. */}
                        {t.validation ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {mentionDeValidation(t.validation.nom, new Date(t.validation.quand))}
                          </p>
                        ) : null}
                        {t.justification ? (
                          <p className="mt-1 max-w-md text-xs italic leading-relaxed text-slate-400">
                            « {t.justification} »
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <span className="rounded-full border border-amber-400/30 px-2 py-0.5 text-xs font-semibold text-amber-300">en attente</span>
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
        <JustificationsReview gameId={gameId} available={aiReview} />
      </section>

      <Tiroir
        titre="👥 Composition des équipes"
        quoi={compter(
          composition.reduce((total, e) => total + e.membres.length, 0),
          "élève inscrit",
          "élèves inscrits",
        )}
      >
        <CompositionEquipes
          gameId={gameId}
          equipes={composition}
          premierTour={view.currentRound === 1}
        />
      </Tiroir>

      {animer ? <Rubrique>Animer</Rubrique> : null}
      {/* Les demandes de subvention : rien à l'écran tant qu'aucune équipe n'a
          touché le mur, puis le seul geste du jeu qui appartienne à l'animateur
          et à personne d'autre. */}
      <SubventionsPanel gameId={view.gameId} demandes={view.aidRequests} />

      {!finished && view.mode === "learning" ? (
        <DistributionCourrier
          gameId={view.gameId}
          courriersEnAttente={view.pendingEvents}
          teams={view.teams
            .filter((t) => t.controller === "human")
            .map((t) => ({ teamId: t.teamId, name: t.name }))}
          scenarioEventCodes={view.scenarioEventCodes}
          scenarioCode={view.scenarioCode}
        />
      ) : null}

      <Rubrique>Lire</Rubrique>
      <section className="carte p-3 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-200">Classement</h2>
        {/*
          LE RIDEAU. Le classement ci-dessous est le vôtre : les élèves ne le
          voient pas tant que vous ne l'avez pas révélé. Tour par tour — refermé
          à chaque nouvelle clôture, pour que chacune reste un moment.
          Ils gardent pendant ce temps leurs propres chiffres et leur IPG : c'est
          leur progression, pas leur place.
        */}
        {dernierTourClos ? (
          <div className="mb-3 mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/25 bg-amber-950/10 px-3 py-2">
            <span className="text-xs text-slate-300">
              {dernierTourClos.rankingRevealed
                ? `🎬 Classement du ${periodLabel(view.roundDays, dernierTourClos.index)} révélé aux élèves.`
                : `🎬 Les élèves ne voient pas encore le classement du ${periodLabel(view.roundDays, dernierTourClos.index)}.`}
            </span>
            <GuardedForm
              action={setRankingRevealedAction.bind(null, view.gameId)}
              label="révélation du classement"
            >
              <input type="hidden" name="roundIndex" value={dernierTourClos.index} />
              <input
                type="hidden"
                name="revealed"
                value={dernierTourClos.rankingRevealed ? "0" : "1"}
              />
              <SubmitButton
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  dernierTourClos.rankingRevealed
                    ? "border border-white/15 text-slate-300 hover:border-white/30"
                    : "bg-amber-400 text-slate-950 hover:bg-amber-300"
                }`}
              >
                {dernierTourClos.rankingRevealed ? "Masquer" : "Révéler le classement"}
              </SubmitButton>
            </GuardedForm>
          </div>
        ) : null}
        {view.ranking.length === 0 ? (
          <p className="text-sm text-slate-400">Disponible après le premier tour.</p>
        ) : (
          <ol className="space-y-2">
            {view.ranking.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300"
              >
                <span>
                  <span className="mr-2 text-slate-400">#{row.rank}</span>
                  {row.name}
                  {row.defaillant ? (
                    <span className="ml-2 rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-xs font-semibold text-red-300">
                      ⚠️ Défaillante
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-slate-100">IPG {row.bpi.toFixed(1)}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {formatEuro(row.cumulativeNetIncome)} cumulés
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {pedagogy ? (
        <section className="carte p-3 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Vue pédagogique</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notions exposées ce tour
                </h3>
                {pedagogy.conceptsExposed.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Aucune situation ouverte ce tour.</p>
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
                  <p className="mt-2 text-xs text-slate-400">
                    Aucune situation rendue : rien n&apos;est mesuré pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {pedagogy.conceptMastery.slice(0, 8).map((c) => (
                      <li key={c.code} className="text-sm">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>
                            {c.name}
                            <span className="ml-1.5 text-xs text-slate-400">
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
              <p className="mt-2 text-xs text-slate-400">
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
        <section className="carte p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Relevé de notes</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                Deux mesures séparées, et non fondues en une : la note tirée des situations
                rendues dit ce que l&apos;équipe a compris, le score composite dit ce que
                l&apos;entreprise a fait. Une bonne analyse peut mener à un mauvais
                trimestre, et les pondérer serait votre choix, pas celui du logiciel. Une
                situation non rendue est comptée à part, jamais moyennée à zéro.
              </p>
            </div>
            {view.canExportGradebook ? (
              <a
                href={`/teacher/games/${view.gameId}/releve`}
                className="shrink-0 rounded-lg border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10"
              >
                ⬇ Tableur (une ligne par élève)
              </a>
            ) : (
              <span
                className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-400"
                title="Réservé à l'offre établissement"
              >
                🔒 Export tableur · offre établissement
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
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
                    <td className="py-2 pr-3 text-xs text-slate-400">
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
            <p className="mt-3 text-xs text-slate-400">
              Aucun tour clôturé : le relevé se remplit à la première clôture.
            </p>
          ) : null}
        </section>
      ) : null}

      {!finished ? (
        <>
          <Rubrique note="réglages à toucher une fois">Régler</Rubrique>
          <section className="carte space-y-2 p-3 sm:p-5">
      {!finished ? (
        <Tiroir titre="📝 Questions posées dans les situations" quoi={QUIZ_MODES.find((m) => m.code === view.quizMode)?.name}>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
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
                    <span className="mt-1 block text-xs text-slate-400">{m.help}</span>
                  </SubmitButton>
                </GuardedForm>
              );
            })}
          </div>
        </Tiroir>
      ) : null}
      {!finished ? (
        <Tiroir titre="📚 Situations manquées" quoi={MISSED_POLICY_LABELS[view.missedPolicy]}>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            Une situation non rendue reste consultable par l&apos;élève dans l&apos;onglet Historique.
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
                    <span className="mt-1 block text-xs text-slate-400">{MISSED_POLICY_HELP[p]}</span>
                  </SubmitButton>
                </GuardedForm>
              );
            })}
          </div>
        </Tiroir>
      ) : null}
      {!finished ? (
        <Tiroir titre="🗓️ Planning de la partie" quoi={view.opensAt || view.closesAt ? "fenêtre posée" : "sans borne"}>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            Fenêtre pendant laquelle les élèves peuvent jouer (heure de Paris). En dehors,
            l&apos;arène passe en lecture seule et « Valider » est grisé. Laissez un champ vide pour
            ne pas poser de borne ; sans fenêtre, la partie suit le pilotage manuel des tours.
          </p>
          <GuardedForm
            action={setGameScheduleAction.bind(null, view.gameId)}
            label="planning de la partie"
            className="mt-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Ouverture</span>
                <input
                  type="datetime-local"
                  name="opensAt"
                  defaultValue={utcToParisLocalInput(view.opensAt ? new Date(view.opensAt) : null)}
                  className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-300">Fermeture</span>
                <input
                  type="datetime-local"
                  name="closesAt"
                  defaultValue={utcToParisLocalInput(view.closesAt ? new Date(view.closesAt) : null)}
                  className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                />
              </label>
            </div>
            <SubmitButton className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Enregistrer le planning
            </SubmitButton>
          </GuardedForm>
        </Tiroir>
      ) : null}
      {!finished ? (
        <Tiroir titre="⏱️ Planning des tours" quoi={toursBornes > 0 ? compter(toursBornes, "tour borné") : "aucune borne"}>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            Ouverture et échéance de chaque tour (heure de Paris). Ces bornes s&apos;ajoutent à
            la fenêtre globale : un tour n&apos;est jouable que pendant l&apos;intersection des
            deux. Laissez un couple vide pour laisser le tour suivre le pilotage manuel.
          </p>
          {/* Le seul écran où l'on décide combien de temps on laisse : le
              chiffre doit être là, pas dans la tête de celui qui tape. */}
          <div className="mt-3 max-w-3xl">
            <DureeDuTourAffichee
              estimation={dureeEstimee}
              mesure={tourMesure?.minutesMedianes ?? null}
              libelleTourMesure={
                tourMesure ? periodLabel(view.roundDays, tourMesure.index) : null
              }
            />
          </div>
          <GuardedForm
            action={setRoundWindowsAction.bind(null, view.gameId)}
            label="planning des tours"
            className="mt-3"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Tour</th>
                    <th className="pb-2 pr-3 font-medium">Ouverture</th>
                    <th className="pb-2 font-medium">Échéance</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {view.rounds.map((r) => (
                    <tr key={r.index} className="border-t border-white/5">
                      <td className="py-2 pr-3 align-middle whitespace-nowrap">
                        <span className="font-semibold text-slate-200">Tour {r.index}</span>
                        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                          {ROUND_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <label className="block">
                          <span className="sr-only">Ouverture du tour {r.index}</span>
                          <input
                            type="datetime-local"
                            name={`opensAt-${r.index}`}
                            defaultValue={utcToParisLocalInput(r.opensAt ? new Date(r.opensAt) : null)}
                            className="w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                          />
                        </label>
                      </td>
                      <td className="py-2">
                        <label className="block">
                          <span className="sr-only">Échéance du tour {r.index}</span>
                          <input
                            type="datetime-local"
                            name={`deadline-${r.index}`}
                            defaultValue={utcToParisLocalInput(r.deadline ? new Date(r.deadline) : null)}
                            className="w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
                          />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SubmitButton className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Enregistrer le planning des tours
            </SubmitButton>
          </GuardedForm>
        </Tiroir>
      ) : null}
          </section>
        </>
      ) : null}

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
