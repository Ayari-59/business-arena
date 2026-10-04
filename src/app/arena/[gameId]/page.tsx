import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { compter, formatEuro } from "@/lib/format";
import { getGameView } from "@/services/game.service";
import { getPlatformConfig } from "@/services/admin.service";
import { estUnTelephone } from "@/lib/appareil";
import { accentsDuSite, themeParDefaut } from "@/config/theme-du-site";
import { BarreDeJeu } from "@/components/barre-de-jeu";
import { StockageDurable } from "@/components/stockage-durable";
import { getTeamSituations } from "@/services/pedagogy.service";
import { AnalyseDuTour, SituationCard, SituationDebrief } from "@/components/situation-panel";
import { SaisonDuTour } from "@/components/saison-du-tour";
import { AlerteTresorerie } from "@/components/alerte-tresorerie";
import { PassageAuTour } from "@/components/passage-au-tour";
import { periodLabel } from "@/config/scenarios/periodicity";
import { CourrierRecommande, grilleDeCourriers } from "@/components/courrier";
import { MandatDeLEquipe } from "@/components/mandat-de-lequipe";
import { reponsesAuxDecisions } from "@/config/courriers/reponses";
import { courrierParCode } from "@/config/courriers/registre";
import { DecisionForm } from "@/components/decision-form";
import { TeamNameForm } from "@/components/team-name-form";
import { ChoixEquipe } from "@/components/choix-equipe";
import { porteUnNomParDefaut } from "@/config/nom-equipe";
import { DetailParClientele, DilemmaCard, ParametersPanels } from "@/components/decision-context";
import { PeriodDashboard } from "@/components/period-dashboard";
import { PeriodDecisionsRecap } from "@/components/period-decisions-recap";
import { SegmentedTabs } from "@/components/segmented-tabs";
import {
  ParcoursMobile,
  type AnalyseDuParcours,
  type CarteDuParcours,
} from "@/components/parcours-mobile";
import { RoundStatusPoller } from "@/components/round-status-poller";
import { QuiARendu } from "@/components/qui-a-rendu";
import { Embleme } from "@/components/embleme";
import { AnnonceDuTour } from "@/components/annonce-du-tour";
import { NoteDuTourPrecedent } from "@/components/note-du-tour-precedent";
import { BandeauCourriers, courriersQuiMeConcernent } from "@/components/bandeau-courriers";
import { TourSimule } from "@/components/tour-simule";
import { CourrierDuTour } from "@/components/courrier-du-tour";
import { GammeLigne } from "@/components/gamme-ligne";
import { FaitsCles } from "@/components/faits-cles";
import { Tiroir } from "@/components/tiroir";
import { FriseDesTours } from "@/components/frise-des-tours";
import { IdentiteDeLAppareil } from "@/components/identite-de-lappareil";
import { MaCarteDeReprise } from "@/components/ma-carte-de-reprise";
import { TableauDeBord } from "@/components/tableau-de-bord";
import { BilanDePartie } from "@/components/bilan-de-partie";
import { bilanDeLaPartie } from "@/pedagogy/bilan-de-partie";
import { VosReussites } from "@/components/vos-reussites";
import { reussitesDeLaPartie, lireLeTour } from "@/scoring/reussites";
import { recordPersonnel } from "@/services/profile.service";
import { attribuerCodeDeReprise, codeDeRepriseDuJoueur } from "@/services/reprise.service";
import { EcheanceDuTour } from "@/components/echeance-du-tour";
import { mentionDeValidation } from "@/config/validation-du-tour";
import { surtitreDePartie } from "@/config/scenarios/presentation";
import { SECTOR_COLORS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { PictoSecteur } from "@/components/picto-secteur";
import { statutDesSituations } from "@/config/situation-rendu";
import { AiAssistant } from "@/components/ai-assistant";
import { entitlementsForUser } from "@/services/entitlements.service";
import { resolveAiSurface } from "@/services/ai.service";
import { bouton } from "@/components/bouton";

export const dynamic = "force-dynamic";

export default async function ArenaPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ simule?: string }>;
}) {
  const { gameId } = await params;
  const userId = await getGuestUserId();
  if (!userId) notFound();
  const view = await getGameView(gameId, userId);
  if (!view) notFound();
  const configDuSite = await getPlatformConfig();
  // Sur téléphone, ce qu'on consulte se range dans des tiroirs fermés (voir
  // decision-context.tsx et aide-repliable.tsx) ; ce qui décide reste ouvert.
  const telephone = await estUnTelephone();
  // Le code personnel. En classe, il est donné à l'entrée (ou manque, pour les
  // parties d'avant). En solo, il est créé ICI, à la première ouverture : les
  // parties déjà commencées en ont un aussi, et personne ne peut relire un code
  // perdu — c'est donc dans l'arène, tant que l'appareil est là, qu'on le note.
  const codeDeReprise =
    view.kind === "solo"
      ? await attribuerCodeDeReprise(gameId, userId)
      : await codeDeRepriseDuJoueur(gameId, userId);
  const situations = await getTeamSituations(gameId, userId);
  // Le record personnel : seulement à la fin d'une partie solo, où l'IPG est
  // déjà à l'écran. En classe, il appartient à l'enseignant de le révéler.
  const recordPrecedent =
    view.status === "finished" && view.kind === "solo" && view.playerBpi !== null
      ? await recordPersonnel({
          userId,
          scenarioCode: view.scenarioCode,
          saufPartie: gameId,
        })
      : null;
  const statutSituations = statutDesSituations(situations.current);

  // Assistant IA (facultatif) : coach de tour (solo) et tuteur. Disponibles
  // seulement si le compte y a droit (mur freemium), la surface est allumée en
  // admin et une clé API est configurée. Le coach ne s'affiche qu'une fois un
  // tour joué ; le tuteur, dès l'ouverture.
  const aiEnt = await entitlementsForUser(userId);
  const aiCoachEnabled =
    aiEnt.ai && view.kind === "solo" && (await resolveAiSurface("coach")) !== null;
  const aiTutor = aiEnt.ai && (await resolveAiSurface("tutor")) !== null;

  const finished = view.status === "finished";
  // Chaque période est une pièce de l'accordéon. Les tours RÉSOLUS forment la
  // pile d'historique (repliée, sauf le plus récent) ; le tour OUVERT est la
  // période active, dépliée, où l'on lit la situation et rend ses décisions.
  const periods = view.periods;
  const latestRound = periods.at(-1)?.round ?? null;
  const debriefByRound = new Map(
    situations.debriefedByRound.map((dr) => [dr.roundIndex, dr]),
  );
  const mostRecentDebriefedRound = situations.debriefedByRound[0]?.roundIndex ?? null;
  const hasActivePeriod = !finished;

  // ── Écran intermédiaire « Tour simulé » (solo, après une validation) ──
  // Valider a résolu le tour à l'instant (playRoundAction redirige ici avec
  // ?simule). Plutôt que de jeter le joueur directement sur les résultats ou
  // sur le tour suivant — deux boutons « simuler » d'allure identique —, on
  // marque l'étape et on laisse choisir. Aucun chiffre n'est dévoilé ici :
  // c'est le rôle de « voir les résultats ».
  const { simule } = await searchParams;
  const tourJoue = periods.at(-1) ?? null;
  if (simule != null && view.kind === "solo" && tourJoue !== null) {
    return (
      <TourSimule
        gameId={gameId}
        round={tourJoue.round}
        currentRound={view.currentRound}
        roundDays={view.roundDays}
        finished={finished}
        sector={view.sector}
        bilan={(() => {
          const precedent = view.history.find((h) => h.round === tourJoue.round - 1);
          const moi = view.ranking.find((row) => row.isPlayer);
          return {
            resultatNet: tourJoue.result.incomeStatement.netIncome,
            resultatPrecedent: precedent?.netIncome ?? null,
            chiffreDAffaires: tourJoue.result.incomeStatement.revenue,
            tresorerie: tourJoue.result.functionalBalance.netTreasury,
            rang: moi ? { place: moi.rank, sur: view.ranking.length } : null,
            ipg: view.playerBpi,
          };
        })()}
      />
    );
  }

  // ── Contenu du tour, en sections réutilisables ────────────────────────────
  // Le tour se lit en trois temps : Situation (le contexte : données, marché,
  // alertes, arbitrage) → Analyser (les aides puis les QCM en accordéon) →
  // Décider. En solo c'est un fil d'étapes guidé ; en classe, l'onglet
  // « Situation » réunit tout sur un seul écran. On extrait donc des blocs
  // plutôt que de les dupliquer d'un mode à l'autre.
  const premierTour = periods.length === 0;

  // DONNÉES : ce avec quoi on entre dans le tour — l'entreprise (au 1er tour),
  // les paramètres du secteur et la capacité de production.
  // La présentation de l'entreprise (au 1er tour seulement) : qui elle est, où elle
  // en est, ce qu'on attend de vous. Sur téléphone elle fait une carte à elle ;
  // sur grand écran elle ouvre la carte des données.
  const presentation = premierTour ? (
    <>
      <div>
        <h3 className="text-xl font-bold text-slate-100 max-sm:font-display max-sm:text-3xl max-sm:font-semibold">
          {view.intro.company}
        </h3>
        <p className="text-sm text-slate-400 max-sm:text-base">{view.intro.tagline}</p>
        <FaitsCles
          capacityFacts={view.capacityFacts}
          vocabulary={view.vocabulary}
          gamme={view.gamme}
        />
        {view.gamme ? (
          <div className="mt-3">
            <GammeLigne gamme={view.gamme} />
          </div>
        ) : null}
      </div>
      {telephone ? (
        // Sur téléphone, « Situation » et « Contexte » ont la même forme : deux tiroirs
        // de même niveau, ouverts dans le parcours.
        <Tiroir titre="Situation">
          <p className="text-sm leading-relaxed">{view.intro.briefing}</p>
        </Tiroir>
      ) : (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Situation</h3>
          <p className="mt-1 text-sm leading-relaxed">{view.intro.briefing}</p>
        </div>
      )}
      {/*
        Le contexte n'oriente pas la décision du tour, il l'éclaire : qui est
        parti, depuis quand la concurrence est installée. Replié, il reste à un
        clic sans s'imposer avant la question à trancher.
      */}
      <Tiroir titre="Contexte">
        <p className="text-sm leading-relaxed">{view.intro.context}</p>
      </Tiroir>
    </>
  ) : null;
  const chiffres = (
    <ParametersPanels
      intro={view.intro}
      vocabulary={view.vocabulary}
      capacityFacts={view.capacityFacts}
      gamme={view.gamme}
    />
  );
  const chiffresSansDetail = (
    <ParametersPanels
      intro={view.intro}
      vocabulary={view.vocabulary}
      capacityFacts={view.capacityFacts}
      gamme={view.gamme}
      sansDetail
    />
  );
  const donneesSection = premierTour ? (
    <section className="space-y-4 carte p-3 sm:p-5 text-slate-300">
      {presentation}
      {chiffres}
    </section>
  ) : (
    // Dès le 2ᵉ tour, on montre les panneaux directement : pas d'en-tête « Vos
    // paramètres et votre capacité » ni de carte englobante par-dessus, qui
    // faisaient doublon avec les titres propres des panneaux (« Votre
    // entreprise », « Le marché ») et rognaient la largeur sur
    // téléphone (une carte dans une carte).
    chiffres
  );

  // MARCHÉ & ALERTES : ce qui a bougé et ce qu'on vous signale — où vous en êtes
  // (dès le 2ᵉ tour), le courrier distribué, la saison.
  const alertesSansSaison = (
    <>
      {view.roundBriefing ? (
        <section className="space-y-2 carte p-3 sm:p-5 text-slate-300">
          <h2 className="text-lg font-semibold text-slate-100">
            {periodLabel(view.roundDays, view.currentRound)} · où vous en êtes
          </h2>
          <p className="text-sm leading-relaxed">{view.roundBriefing.headline}</p>
          {/*
            LE CONSTAT ET LA NOTE VONT ENSEMBLE. Le constat dit ce qui est
            arrivé ; la note dit ce que l'équipe avait prévu en validant. Les
            séparer, c'était garder la prévision pour le seul enseignant, et
            priver l'élève de la seule comparaison qui lui apprenne quelque
            chose sur son propre raisonnement.
          */}
          <NoteDuTourPrecedent
            texte={periods.at(-1)?.justification ?? null}
            periode={periodLabel(view.roundDays, Math.max(1, view.currentRound - 1))}
          />
        </section>
      ) : null}
      {view.courriersAnnonces.length > 0 ? (
        <section className="rounded-xl border border-amber-400/30 bg-slate-900 p-3 sm:p-5">
          <p className="mb-2 text-sm font-semibold text-amber-400">📬 Le courrier, en détail</p>
          <div className={grilleDeCourriers(view.courriersAnnonces.length)}>
            {view.courriersAnnonces.map((courrier, i) => (
              <CourrierRecommande
                key={`${courrier.code}-${courrier.teamId ?? "market"}`}
                code={courrier.code}
                delayMs={i * 450}
                annonce
                destinataire={
                  courrier.teamId
                    ? courrier.isMyTeam
                      ? "🎯 Votre entreprise"
                      : `→ ${courrier.teamName ?? "Une autre entreprise"}`
                    : "Tout le marché"
                }
                surligne={courrier.isMyTeam}
              />
            ))}
          </div>
        </section>
      ) : null}
      {(() => {
        // CE QUI PÈSE ENCORE : une lettre qui vaut deux trimestres, reçue au
        // tour précédent, s'applique à celui-ci. L'équipe décide en le
        // sachant, pas en le découvrant aux résultats.
        const encore = courriersQuiMeConcernent(view.courriersEnCours).map((c) => ({
          ...c,
          roundsLeft: view.courriersEnCours.find(
            (a) => a.code === c.code && a.teamId === c.teamId,
          )!.roundsLeft,
        }));
        return encore.length > 0 ? (
          <section className="carte p-3 sm:p-5">
            <p className="mb-2 text-sm font-semibold text-amber-400">
              ⏳ Encore en vigueur ce tour
            </p>
            <p className="mb-3 text-xs text-slate-400">
              {encore.length > 1 ? "Ces courriers sont arrivés" : "Ce courrier est arrivé"} à un tour
              précédent et {encore.length > 1 ? "pèsent" : "pèse"} toujours sur celui-ci.
            </p>
            <div className={grilleDeCourriers(encore.length)}>
              {encore.map((courrier, i) => (
                <CourrierRecommande
                  key={`${courrier.code}-${courrier.teamId ?? "market"}`}
                  code={courrier.code}
                  delayMs={i * 450}
                  destinataire={`${
                    courrier.teamId ? "🎯 Votre entreprise" : "Tout le marché"
                  } · encore ${courrier.roundsLeft > 1 ? `${courrier.roundsLeft} tours` : "ce tour"}`}
                  surligne={courrier.isMyTeam}
                />
              ))}
            </div>
          </section>
        ) : null;
      })()}
    </>
  );
  // La saison commande la demande, donc le volume : sur téléphone elle se lit avec les
  // chiffres du marché (une seule carte), pas avec les alertes.
  const saisonNode = <SaisonDuTour notes={view.seasonNotes} />;
  const alertesSection = (
    <>
      {alertesSansSaison}
      {saisonNode}
    </>
  );

  // ARBITRAGE : la question qui cadre le tour.
  // Le titre dit « Votre arbitrage », pas « Votre décision » : la décision,
  // c'est le formulaire juste en dessous, et l'élève en rend une à chaque
  // tour. Ce qui se joue ici est le choix ENTRE deux routes qui se valent —
  // le mot du métier, et celui que la carte met en scène.
  // La phrase « Fixez votre prix, votre volume et vos budgets » a été retirée :
  // les champs du formulaire, juste en dessous, portent déjà ces intitulés.
  const dilemmeSection = premierTour ? (
    <DilemmaCard
      title="Votre arbitrage"
      question={view.intro.dilemma.question}
      routes={view.intro.dilemma.routes}
    />
  ) : view.roundBriefing ? (
    <DilemmaCard
      title="Votre arbitrage"
      question={view.roundBriefing.question}
      routes={view.roundBriefing.routes}
    />
  ) : null;

  // Toutes les situations du tour, empilées (mode CLASSE : un seul écran).

  // LEVIERS D'ACTION, EN FORME D'INDICE : une piste par champ de décision,
  // repliée par défaut et révélée à la demande. Les « points clés » ont été
  // retirés (redondants avec la situation et ses indices progressifs). Volume
  // réduit à une ligne par levier — le champ, le sens, la piste la plus utile.
  /*
   * Les réponses au dernier tour clos : on compare ses décisions à celles du
   * tour d'avant, parce qu'une coupe ne se lit que par rapport à ce qui
   * précède. Fonction pure, éprouvée règle par règle dans
   * `courriers-en-retour.test.ts` ; la page n'en fait que l'affichage.
   */
  const reponses = (() => {
    const dernier = periods[periods.length - 1];
    if (!dernier) return [];
    return reponsesAuxDecisions(dernier.decisions, periods[periods.length - 2]?.decisions ?? null);
  })();

  const leviersIndice = (() => {
    const FIELD_LABELS: Record<string, string> = {
      price: "Prix de vente",
      productionPlan: "Plan de production",
      marketingBudget: "Budget marketing",
      qualityBudget: "Budget qualité",
      maintenanceBudget: "Budget maintenance",
    };
    const DIRECTION_ICONS: Record<string, string> = { up: "↑", down: "↓", review: "⟳" };
    // Un levier ne se conseille que si l'élève a le contrôle correspondant sous
    // les yeux : aux premiers niveaux, budgets qualité et maintenance sont
    // masqués (decision-form). Les pointer ici enverrait « ↑ Budget maintenance »
    // vers un champ introuvable — le lien décision→action, cœur de l'app, rompu.
    const champActionnable = (field: string): boolean => {
      if (field === "qualityBudget") return view.enabledDecisions.quality;
      if (field === "maintenanceBudget") return view.enabledDecisions.maintenance;
      return true; // prix, production, marketing : toujours ouverts
    };
    // Un seul indice par champ : la première piste rencontrée. Deux situations
    // qui tirent le même champ en sens opposés → « à revoir ».
    const byField = new Map<string, { direction: string; hint: string }>();
    for (const s of situations.current) {
      for (const lever of s.decisionLevers ?? []) {
        if (!champActionnable(lever.field)) continue;
        const existing = byField.get(lever.field);
        if (!existing) {
          byField.set(lever.field, { direction: lever.direction, hint: lever.hint });
        } else if (existing.direction !== lever.direction) {
          existing.direction = "review";
        }
      }
    }
    const levers = [...byField.entries()].map(([field, { direction, hint }]) => ({
      field, direction, hint, label: FIELD_LABELS[field] ?? field,
    }));
    if (levers.length === 0) return null;
    return (
      <Tiroir
        titre="💡 Leviers d'action"
        quoi={`${levers.length} levier${levers.length > 1 ? "s" : ""}`}
      >
        <ul className="space-y-1.5">
          {levers.map((l) => (
            <li key={l.field} className="flex gap-2 text-sm leading-snug text-slate-300">
              <span className="mt-px leading-none text-amber-400">{DIRECTION_ICONS[l.direction]}</span>
              <span>
                <span className="font-medium text-slate-200">{l.label}</span> — {l.hint}
              </span>
            </li>
          ))}
        </ul>
      </Tiroir>
    );
  })();

  // QCM DU TOUR (solo) : plusieurs situations tiennent sur UN seul écran
  // « Analyser », dépliables en accordéon (un panneau par situation, le premier
  // ouvert) plutôt qu'un onglet par QCM — moins « usine ». Une seule situation
  // s'affiche directement, sans accordéon.
  const qcmBloc =
    situations.current.length > 1 ? (
      <div className="space-y-3">
        {situations.current.map((s, i) => (
          <details
            key={s.instanceId}
            open={i === 0}
            className="group rounded-xl border border-white/10 bg-slate-950/40 [&:not([open])]:border-dashed [&[open]]:border-white/20"
          >
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-100 sm:px-5">
              <span aria-hidden className="text-slate-400 transition-transform group-open:rotate-90">
                ▸
              </span>
              <span aria-hidden>🔍</span>
              <span className="min-w-0">{s.title}</span>
            </summary>
            <div className="border-t border-white/10 px-2 py-2.5 sm:p-4">
              <SituationCard gameId={view.gameId} situation={s} />
            </div>
          </details>
        ))}
      </div>
    ) : situations.current[0] ? (
      <SituationCard gameId={view.gameId} situation={situations.current[0]} />
    ) : null;

  // ÉTAPE « ANALYSER » (solo) : le QCM des situations. Le contexte (données,
  // marché, alertes, arbitrage) vit dans « Situation » ; les leviers d'action
  // sont sur « Décider », au plus près des champs de décision qu'ils désignent.
  const analyserContenu =
    situations.current.length > 0 && statutSituations ? (
      <div id="analyser" className="space-y-6">
        {qcmBloc}
      </div>
    ) : null;

  // L'analyse sur téléphone : toutes les situations du tour sur UN écran, en accordéon.
  const analyseCartes: AnalyseDuParcours[] = statutSituations
    ? [
        {
          cle: "analyse",
          noeud: <AnalyseDuTour gameId={view.gameId} situations={situations.current} />,
          etapes: situations.current.length,
        },
      ]
    : [];

  // Ce qu'on répond aux décisions du tour clos (voir plus haut) : servi aux onglets
  // comme au parcours en cartes.
  const reponsesSection =
    reponses.length > 0 ? (
                        <section className="carte p-3 sm:p-5">
                          <p className="mb-2 text-sm font-semibold text-amber-400">
                            ↩️ En retour de vos décisions
                          </p>
                          <p className="mb-3 text-xs text-slate-400">
                            {reponses.length > 1 ? "Ces courriers répondent" : "Ce courrier répond"}{" "}
                            à ce que vous avez décidé au{" "}
                            {periodLabel(view.roundDays, latestRound ?? 1).toLowerCase()}.
                          </p>
                          <div className={grilleDeCourriers(reponses.length)}>
                            {reponses.map((c, i) => (
                              <CourrierRecommande
                                key={c.code}
                                code={c.code}
                                delayMs={i * 450}
                                destinataire={view.playerTeamName}
                              />
                            ))}
                          </div>
                        </section>
    ) : null;

  // LE BRIEFING, EN CARTES (téléphone). La Situation tenait trois écrans en une
  // page ; elle devient une suite de cartes, une idée chacune : ce qu'on vous
  // répond, votre mandat, qui est l'entreprise, ses chiffres, ce qui a bougé,
  // l'arbitrage. Une carte vide n'existe pas.
  const alertesPresentes =
    !!view.roundBriefing ||
    view.courriersAnnonces.length > 0 ||
    courriersQuiMeConcernent(view.courriersEnCours).length > 0;
  const alerteTresorerieNode = view.alerteTresorerie ? (
    <div>
      <AlerteTresorerie
        gameId={view.gameId}
        alerte={view.alerteTresorerie}
        exigence={view.exigenceSauvetage}
        demande={view.demandeSubvention}
        sansFinancement={view.financeFermee}
      />
    </div>
  ) : null;
  const nomNode = view.peutSeNommer ? (
    <div>
      <TeamNameForm
        gameId={gameId}
        nomActuel={view.playerTeamName}
        dejaNommee={!porteUnNomParDefaut(view.playerTeamName)}
        emblemeActuel={view.playerTeamEmbleme}
      />
    </div>
  ) : null;
  // Les trois facettes d'une période close : ce qu'on a analysé (Situation + correction), ce
  // qu'on a décidé, ce qui en est ressorti. Servies à l'accordéon des tours passés, et, sur
  // téléphone, à la carte des résultats du dernier tour.
  /** Le débriefing des situations d'un tour clos (null s'il n'y en a pas). */
  const situationsDuTour = (p: (typeof periods)[number]) => {
    const dr = debriefByRound.get(p.round);
    return dr ? (
      <section className="space-y-3">
        {dr.situations.map((s) => (
          <SituationDebrief
            key={s.instanceId}
            situation={s}
            gameId={view.gameId}
            retakeable={
              situations.missedPolicy === "retake50" && p.round === mostRecentDebriefedRound
            }
          />
        ))}
      </section>
    ) : null;
  };
  /** Les décisions prises à un tour clos (null si elles ne sont pas conservées). */
  const decisionsDuTour = (p: (typeof periods)[number]) =>
    p.decisions ? (
      <PeriodDecisionsRecap decisions={p.decisions} vocabulary={view.vocabulary} gamme={view.gamme} />
    ) : null;

  const ongletsDuTour = (p: (typeof periods)[number]) => {
    const isLatest = p.round === latestRound;
    return (
        <SegmentedTabs
          defaultKey={isLatest ? "resultats" : "situation"}
          tabs={[
            { key: "situation", label: "Situation", icon: "📋" },
            { key: "decisions", label: "Décisions", icon: "✏️" },
            { key: "resultats", label: "Résultats", icon: "📊" },
          ]}
        >
          {{
            situation: situationsDuTour(p),
            decisions: decisionsDuTour(p),
            resultats: (
              <PeriodDashboard
                view={view}
                period={p}
                standing={isLatest}
                courrierResume={telephone}
              />
            ),
          }}
        </SegmentedTabs>
    );
  };

  const toursPassesDe = (liste: typeof periods) => (
    <>
      {liste.length > 0 ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {finished ? "Vos tours" : "Tours passés"}
        </p>
      ) : null}
      {liste.map((p) => {
        const isLatest = p.round === latestRound;
        const netIncome = p.result.incomeStatement.netIncome;
        const netTreasury = p.result.functionalBalance.netTreasury;
        return (
          <details
            key={p.round}
            // Cible du retour après une validation en solo : la période la plus
            // récente, déjà ouverte sur son onglet Résultats. scroll-mt dégage
            // la hauteur de l'en-tête collant pour que le titre reste visible.
            id={isLatest ? "dernier-resultat" : undefined}
            open={isLatest}
            // bg-slate-900/60 et non slate-950/40 : sur le fond de page, une
            // carte à 40 % de slate-950 n'était qu'un contour. Quatre contours
            // à la file se lisaient comme une grille, pas comme quatre tours.
            className={`group scroll-mt-24 rounded-xl border border-white/10 border-l-2 bg-slate-900/60 [&:not([open])]:border-dashed [&[open]]:border-white/20 ${
              netIncome >= 0
                ? "border-l-emerald-400/60"
                : "border-l-rose-400/60"
            }`}
          >
            {/*
              LE NUMÉRO FAIT LA SÉPARATION. Il était noyé derrière un 📊
              répété — l'œil tombait sur une icône identique d'un tour à
              l'autre au lieu de trouver 1, 2, 3. En pastille à gauche, les
              numéros font colonne et donnent une colonne vertébrale à la
              liste ; leur couleur dit du même coup si le tour a été gagné ou
              perdu, sans ajouter un signal de plus.
            */}
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 sm:px-4 [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                  netIncome >= 0
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                }`}
              >
                {p.round}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-100">
                  {periodLabel(view.roundDays, p.round)}
                  {isLatest && !finished ? (
                    <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      résultats livrés
                    </span>
                  ) : null}
                </span>
                {/* Les trois chiffres du tour, chacun insécable : la ligne se
                    replie ENTRE deux chiffres, jamais au milieu d'un montant. */}
                <span className="mt-0.5 flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs tabular-nums text-slate-400">
                  <span className="whitespace-nowrap">
                    CA {formatEuro(p.result.incomeStatement.revenue)}
                    <span aria-hidden className="text-slate-400">
                      {" "}
                      ·
                    </span>
                  </span>
                  <span
                    className={`whitespace-nowrap ${netIncome >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {netIncome >= 0 ? "+" : ""}
                    {formatEuro(netIncome)}
                    <span aria-hidden className="text-slate-400">
                      {" "}
                      ·
                    </span>
                  </span>
                  <span
                    className={`whitespace-nowrap ${netTreasury >= 0 ? "text-slate-400" : "text-rose-300"}`}
                  >
                    tréso {formatEuro(netTreasury)}
                  </span>
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-xs text-amber-400/80 transition-transform group-open:rotate-90"
              >
                ▸
              </span>
            </summary>
            <div className="border-t border-white/10 px-2 py-2.5 sm:p-4">
              {/* Les trois facettes d'une période close : ce qu'on a analysé
                  (Situation + correction), ce qu'on a décidé, ce qui en est
                  ressorti. Les onglets ne s'opposent pas à l'accordéon — il
                  situe la période, ils en montrent une face à la fois. */}
              {ongletsDuTour(p)}
            </div>
          </details>
        );
      })}
    </>
  );
  const toursPasses = toursPassesDe(periods);

  const tableauNode = (
    <TableauDeBord
      tours={periods.map((p) => ({
        round: p.round,
        libelle: periodLabel(view.roundDays, p.round),
        ca: p.result.incomeStatement.revenue,
        resultat: p.result.incomeStatement.netIncome,
        tresorerie: p.result.functionalBalance.netTreasury,
      }))}
    />
  );
  const soumissionsNode = view.soumissions ? (
    <div className="border-b border-white/10 px-3 py-2 sm:px-4">
      <QuiARendu
        validees={view.soumissions.validees}
        total={view.soumissions.total}
      />
    </div>
  ) : null;
  const compositionNode =
    !finished && view.equipesDeLaClasse.length > 1 ? (
      view.peutChoisirSonEquipe ? (
        <ChoixEquipe
          gameId={gameId}
          equipes={view.equipesDeLaClasse}
          monEquipeId={view.playerTeamId}
          ouvert
        />
      ) : (
        <Tiroir
          icone="equipes"
          titre="Composition des équipes"
          quoi={compter(view.equipesDeLaClasse.length, "équipe")}
        >
          <ChoixEquipe
            gameId={gameId}
            equipes={view.equipesDeLaClasse}
            monEquipeId={view.playerTeamId}
            ouvert={false}
            concours={view.estUnConcours}
          />
        </Tiroir>
      )
    ) : null;
  const vosReussites =
    periods.length > 0 ? (
      <VosReussites
        cases={reussitesDeLaPartie(
          periods.map((p) => lireLeTour(p.round, p.result, p.forecastReview)),
        )}
        nommerLeTour={(round) => periodLabel(view.roundDays, round)}
      />
    ) : null;
  const compteNode = (
    <>
      {view.kind !== "solo" && view.playerPseudo ? (
        <IdentiteDeLAppareil
          pseudo={view.playerPseudo}
          equipe={view.playerTeamName}
          variante="arene"
        />
      ) : null}
      {codeDeReprise ? (
        <MaCarteDeReprise gameId={gameId} code={codeDeReprise} solo={view.kind === "solo"} />
      ) : null}
    </>
  );
  // LES RÉSULTATS, EN TÊTE DU TOUR (téléphone) : trois cartes — le verdict, les chiffres,
  // l'évolution —, puis le détail à la demande, dans un tiroir fermé. Un tableau de bord
  // de trois mille pixels ne se traîne pas jusqu'au bout : on lit ce qui compte, et on
  // ouvre le reste si l'on veut.
  const moiAuClassement = view.ranking.find((row) => row.isPlayer);
  const periodeRecente = periods.find((p) => p.round === latestRound);
  const resultatsCartes: CarteDuParcours[] = periodeRecente
    ? [
        {
          cle: "resultats",
          phase: "resultats",
          titre: "Ce que ça a donné",
          noeud: (
            <section className="space-y-4">
              <p className="text-base text-slate-300">
                {periodLabel(view.roundDays, periodeRecente.round)}{" "}
                {view.kind === "solo" ? "simulé" : "clos"}
                {view.playerBpi !== null
                  ? ` · ${moiAuClassement ? `#${moiAuClassement.rank}/${view.ranking.length} · ` : ""}IPG ${view.playerBpi.toFixed(0)}`
                  : ""}
              </p>
              {/* LES RÉSULTATS ET SEULEMENT EUX, avec leurs trois onglets de détail (Synthèse, Marché,
                  Finance). Le menu Situation / Décisions / Résultats n'a pas sa place ici : le
                  débriefing et les décisions du tour se lisent à la demande, dans un tiroir. */}
              <PeriodDashboard
                view={view}
                period={periodeRecente}
                standing
                courrierResume={telephone}
              />
              {situationsDuTour(periodeRecente) || decisionsDuTour(periodeRecente) ? (
                <Tiroir titre="Débriefing et décisions de ce tour" ferme>
                  <div className="space-y-4">
                    {situationsDuTour(periodeRecente)}
                    {decisionsDuTour(periodeRecente)}
                  </div>
                </Tiroir>
              ) : null}
              {/* Les tours plus anciens et les réussites : à la demande, fermés. */}
              {periods.length > 1 || vosReussites ? (
                <Tiroir titre="Tours précédents et réussites" ferme>
                  <div className="space-y-4">
                    {toursPassesDe(periods.filter((x) => x.round !== latestRound))}
                    {vosReussites}
                  </div>
                </Tiroir>
              ) : null}
            </section>
          ),
        },
      ]
    : [];

  const briefingCartes: CarteDuParcours[] = (
    [
      alerteTresorerieNode
        ? { cle: "alerte-tresorerie", titre: "Alerte de trésorerie", noeud: alerteTresorerieNode }
        : null,
      ...resultatsCartes,
      reponsesSection ? { cle: "reponses", titre: "Ce que vous aviez prévu", noeud: reponsesSection } : null,
      nomNode ? { cle: "nom", titre: "Le nom de votre équipe", noeud: nomNode } : null,
      view.peutChoisirSonEquipe && compositionNode
        ? { cle: "equipe", titre: "Composition de l'équipe", noeud: compositionNode }
        : null,
      view.currentRound === 1
        ? {
            cle: "mandat",
            titre: "Votre prise de poste",
            noeud: (
              <MandatDeLEquipe
                gameId={gameId}
                niveau={view.difficulty.level}
                equipe={view.playerTeamName}
                ouvert
              />
            ),
          }
        : null,
      presentation
        ? {
            cle: "presentation",
            titre: "Votre entreprise",
            noeud: (
              <section className="space-y-4 carte p-3 text-slate-300">
                {presentation}
              </section>
            ),
          }
        : null,
      {
        cle: "chiffres",
        titre: "Vos chiffres et votre marché",
        noeud: (
          <div className="space-y-4">
            {chiffresSansDetail}
            {/* Même forme, même niveau, fermés, et ils se replient l'un l'autre. */}
            <DetailParClientele intro={view.intro} gamme={view.gamme} groupe="precisions" ferme />
            <SaisonDuTour notes={view.seasonNotes} groupe="precisions" ferme />
          </div>
        ),
      },
      alertesPresentes
        ? { cle: "alertes", titre: "Ce qui a bougé", noeud: alertesSansSaison }
        : null,
      dilemmeSection ? { cle: "arbitrage", titre: "Le dilemme du tour", noeud: dilemmeSection } : null,
    ] as (CarteDuParcours | null)[]
  ).filter((c): c is CarteDuParcours => c !== null);

  // « Décider » : la piste, le courrier du tour, puis la saisie. Un seul nœud, servi
  // tel quel aux onglets (grand écran) et au parcours en cartes (téléphone).
  // Les trois pièces de « Décider », servies telles quelles à la page de grand écran
  // (onglets) et, séparément, au parcours en cartes du téléphone.
  const courrierBloc = view.kind === "solo" && !finished ? (
                  <div className="mb-4">
                    <CourrierDuTour
                      gameId={gameId}
                      round={view.currentRound}
                      periodeLabel={periodLabel(view.roundDays, view.currentRound).toLowerCase()}
                      plis={view.upcomingDraw}
                    />
                  </div>
                ) : null;
  const etatDesDecisions = view.pendingDecisionsPar ? (
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-emerald-300">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-semibold">
                        ✓{" "}
                        {mentionDeValidation(
                          view.pendingDecisionsPar.nom,
                          new Date(view.pendingDecisionsPar.quand),
                        )}
                      </span>
                      <span className="text-slate-400">
                        Modifiable jusqu&apos;à la clôture : votre envoi remplacera le sien.
                      </span>
                    </p>
                  ) : null;
  const formulaireDeDecision = (
    <DecisionForm
      telephone={telephone}
      enTeteDuRecapitulatif={
        // Rien à dire : pas de conteneur vide, qui laisserait quand même son interligne.
        telephone &&
        (etatDesDecisions ||
          soumissionsNode ||
          (!finished && view.playLock.playable && view.playLock.closesAt)) ? (
          <div className="space-y-2">
            {etatDesDecisions}
            {soumissionsNode}
            {!finished && view.playLock.playable && view.playLock.closesAt ? (
              <EcheanceDuTour closesAt={view.playLock.closesAt} compact />
            ) : null}
          </div>
        ) : null
      }
      reperes={
        telephone
          ? {
              prixUsuels: (() => {
                const prix = view.intro.segments.map((seg) => seg.refPrice);
                if (prix.length === 0) return null;
                const bas = Math.min(...prix);
                const haut = Math.max(...prix);
                return bas === haut
                  ? formatEuro(bas)
                  : `${formatEuro(bas)} – ${formatEuro(haut)}`;
              })(),
              coutVariable: view.gamme ? null : view.intro.variableCostPerUnit,
              // Le curseur de prix court de la moitié du plus bas prix usuel à
              // près du double du plus haut : assez large pour essayer, pas au point
              // de rendre un euro introuvable.
              ...(view.intro.segments.length > 0
                ? {
                    plagePrix: {
                      min: Math.floor(
                        Math.min(...view.intro.segments.map((seg) => seg.refPrice)) / 2,
                      ),
                      max: Math.ceil(
                        (Math.max(...view.intro.segments.map((seg) => seg.refPrice)) * 1.8) / 5,
                      ) * 5,
                    },
                  }
                : {}),
            }
          : null
      }
      gameId={view.gameId}
      roundIndex={view.currentRound}
      vocabulary={view.vocabulary}
      periodName={periodLabel(view.roundDays, view.currentRound).toLowerCase()}
      defaults={
        view.pendingDecisions ?? view.lastDecisions ?? view.startingDecisions
      }
      proposed={view.proposedDecisions}
      kind={view.kind}
      alreadySubmitted={view.pendingDecisions !== null}
      insuranceOffer={
        view.insuranceOffer
          ? {
              premium: view.insuranceOffer.premium,
              coveredLabels: view.insuranceOffer.coveredEventCodes.map(
                (c) => courrierParCode.get(c)?.objet ?? c,
              ),
            }
          : null
      }
      enabled={view.enabledDecisions}
      distributableReserves={view.distributableReserves}
      investmentOffer={view.investmentOffer}
      debtSchedule={view.debtSchedule}
      treasuryOffer={view.treasuryOffer}
      bankFile={view.bankFile}
      orderOffer={view.orderOffer}
      studiesOffer={view.studiesOffer}
      capitalAllowance={view.capitalAllowance}
      loanCapacity={view.loanCapacity}
      financeOffer={view.financeOffer}
      insuranceFormulas={view.insuranceFormulas}
      suppliersOffer={view.suppliersOffer}
      equipmentOffer={view.equipmentOffer}
      capacityFacts={view.capacityFacts}
      gamme={view.gamme}
      rdOffer={view.rdOffer}
      communicationOffer={view.communicationOffer}
      verrou={
        view.playLock.playable
          ? null
          : (view.playLock.message ?? "Ce tour n'est pas encore ouvert.")
      }
      echeance={view.playLock.closesAt}
      sauvetage={view.exigenceSauvetage}
    />
  );

  const decisionsNode = (
                    <section id="decisions">
                {/*
                  LE TIRAGE, VÉCU — entre l'analyse et la décision. En solo,
                  personne ne joue de carte à la main : c'est le moteur qui
                  tire, et le joueur ne le voyait qu'après coup. Le tirage
                  étant déterministe, on le retourne ici, une fois la situation
                  lue et analysée, juste avant de fixer le prix : la carte
                  tombe sur une décision déjà réfléchie, et l'oblige à la
                  reprendre. En classe, c'est l'enseignant qui tient la pioche.
                */}
                {courrierBloc}
                {leviersIndice ? <div className="mb-4">{leviersIndice}</div> : null}
                <div className="mb-4 border-b border-white/10 pb-3">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Vos décisions · {periodLabel(view.roundDays, view.currentRound).toLowerCase()}
                  </h2>
                  {/* Une équipe, c'est trois ou quatre élèves sur autant
                      d'écrans. Sans cette ligne, chacun croit être seul à
                      décider et écrase la saisie d'un camarade sans le savoir :
                      l'heure et le prénom étaient déjà en base, relus nulle
                      part. */}
                  {etatDesDecisions}
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    <a
                      href={`/arena/${view.gameId}/cockpit`}
                      className="text-amber-300 underline-offset-4 hover:underline"
                    >
                      Cockpit de prévision (Excel)
                    </a>
                    {" "}: testez vos hypothèses avant de valider.
                  </p>
                </div>
                {formulaireDeDecision}
              </section>
  );

  // Sur téléphone, « Décider » se découpe : le courrier du tour (avec la piste des
  // leviers) est une carte à lui, puis le formulaire en cartes, une décision chacune.
  const courrierCarte =
    courrierBloc || leviersIndice ? (
      <section id="courrier-du-tour" className="space-y-4">
        {courrierBloc}
        {leviersIndice}
      </section>
    ) : null;
  const decisionsMobile = (
    <section id="decisions" className="space-y-3">
      {formulaireDeDecision}
    </section>
  );


  return (
    <main id="main" className="mx-auto max-w-[1400px] space-y-6 px-4 pt-6 pb-6 sm:space-y-8 sm:px-6 sm:pb-16" data-ecran-de-jeu="">
      {/* LA BARRE D'APPLICATION, sur téléphone seulement : la barre du site s'efface
          dans l'arène (voir site-header.tsx) et celle-ci porte la partie et le tour. */}
      <StockageDurable />
      <BarreDeJeu
        nom={view.playerTeamName}
        tour={view.currentRound}
        tours={view.roundsCount}
        termine={finished}
        retour={view.kind === "solo" ? "/jouer" : "/"}
        cockpit={`/arena/${view.gameId}/cockpit`}
        themeParDefaut={themeParDefaut(configDuSite.theme)}
        accents={accentsDuSite(configDuSite.theme)}
        compte={
          telephone ? (
            <>
              {compteNode}
              {view.peutChoisirSonEquipe ? null : compositionNode}
            </>
          ) : null
        }
      />
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3 max-sm:sr-only">
        {/* Sur téléphone, le nom de l'équipe est déjà dans la barre du haut : le
            répéter en grand mangeait un tiers du premier écran. Il reste dans le
            document, lisible par une synthèse vocale, et c'est le seul h1. */}
        <div className="flex items-center gap-3 max-sm:sr-only">
          {/* LE VISAGE DU SECTEUR. L'emoji du système laissait la tuile
              différente sur chaque appareil et illisible au vidéoprojecteur.
              Le pictogramme prend l'accent de son secteur : neuf formes, neuf
              couleurs, et une partie se reconnaît d'un coup d'œil. */}
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${SECTOR_COLORS[view.sector].bg} ${SECTOR_COLORS[view.sector].accent}`}
          >
            <PictoSecteur secteur={view.sector} className="h-7 w-7" />
          </span>
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${SECTOR_COLORS[view.sector].accent}`}>
              {surtitreDePartie(view.intro.title, view.playerTeamName)}
            </p>
            {/* L'emblème devant le nom de l'équipe : c'est son visage. */}
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-50">
              <Embleme
                code={view.playerTeamEmbleme}
                equipe={view.playerTeamName}
                className="h-6 w-6 text-amber-300"
              />
              {view.playerTeamName}
            </h1>
          </div>
        </div>
        {/* LE BANDEAU DE JEU. Il ne porte plus que l'état de la partie : qui
            joue, dans quel secteur, à quel niveau, où en est la frise, quel
            IPG, et l'heure de fermeture. « Mon profil » et « Fiches notions »
            sont de la navigation, pas du jeu : ils sont descendus avec le reste
            de ce qui n'est pas le jeu, et restent dans le plan du site. */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sous quel nom on décide. En salle informatique le poste passe
              d'une classe à l'autre : sans ce rappel, un élève joue sous
              l'identité du précédent sans jamais l'apprendre. Il mène au bloc
              qui permet de libérer l'appareil. */}
          {view.kind !== "solo" && view.playerPseudo ? (
            <a
              href="#mon-profil"
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/25 hover:text-slate-100"
            >
              <span aria-hidden>👤</span> {view.playerPseudo}
            </a>
          ) : null}
          <p
            className={`flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs max-sm:hidden ${SECTOR_COLORS[view.sector].accent}`}
          >
            <PictoSecteur secteur={view.sector} className="h-3.5 w-3.5" />
            {SECTOR_LABELS[view.sector]}
          </p>
          <p
            className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-300 max-sm:hidden"
            title="Niveau de difficulté de la partie"
          >
            Niveau {view.difficulty.level} · {view.difficulty.name}
          </p>
          {/* L'IPG mesure la progression de l'équipe, le rang sa place parmi
              les autres. Le premier lui appartient et s'affiche toujours ; le
              second attend que l'animateur ouvre le rideau. */}
          {latestRound !== null && view.playerBpi !== null ? (() => {
            const me = view.ranking.find((row) => row.isPlayer);
            return (
              <p
                className="rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 text-xs tabular-nums text-amber-300"
                title={
                  me
                    ? "Votre position au classement IPG"
                    : "Votre indice de performance. Le classement sera révélé par votre enseignant."
                }
              >
                {me ? `#${me.rank}/${view.ranking.length} · ` : ""}IPG{" "}
                {view.playerBpi.toFixed(0)}
              </p>
            );
          })() : null}
          {/* La frise remplace la puce « Tour n / N » : le bandeau d'état
              juste dessous porte déjà ce chiffre, et la frise dit en plus d'où
              l'on vient — un segment par tour, vert ou rose selon son résultat. */}
          {/* L'heure de fermeture du tour, quand l'enseignant en a posé une.
              Elle était calculée, appliquée, et jamais montrée tant que c'était
              jouable : on découvrait l'échéance en étant refusé. */}
          {!finished && view.playLock.playable && view.playLock.closesAt ? (
            <EcheanceDuTour closesAt={view.playLock.closesAt} compact />
          ) : null}
          <div className="max-sm:hidden">
            <FriseDesTours
              roundsCount={view.roundsCount}
              currentRound={view.currentRound}
              resultats={new Map(periods.map((p) => [p.round, p.result.incomeStatement.netIncome]))}
              finished={finished}
            />
          </div>
        </div>
      </header>

      {/* ── L'état du tour, pour qui n'a pas l'écran ──
          Le bandeau qui s'affichait ici disait ce que la frise, les onglets et
          le lien du tour clos disent déjà ; il ne reste que sa région live, qui
          annonce à la voix la clôture d'un tour survenue sans action de
          l'élève. Sans surface : `sr-only`. */}
      <AnnonceDuTour
        currentRound={view.currentRound}
        roundsCount={view.roundsCount}
        roundDays={view.roundDays}
        pendingDecisions={view.pendingDecisions !== null}
        kind={view.kind}
        finished={finished}
      />

      {/* ── Crise de trésorerie : avant tout le reste, et sans rideau ──
          Cet état appartient à l'équipe : il ne dépend pas de la révélation du
          classement, seul endroit où la défaillance se disait jusqu'ici. */}
      {telephone ? null : alerteTresorerieNode}

      {/* ── Cartes annoncées : visibles quelle que soit la période dépliée ── */}
      {!telephone && !finished && view.courriersAnnonces.length > 0 ? (
        <div>
          <BandeauCourriers courriers={view.courriersAnnonces} />
        </div>
      ) : null}

      {/* ── Team naming ── */}
      {telephone ? null : nomNode}


      {/*
        ── LE BILAN DE FIN DE PARTIE ──
        Il tenait en trois lignes : un titre, le résultat cumulé, deux boutons.
        Six tours de travail, souvent deux heures de classe, s'arrêtaient sans
        rien à regarder ensemble. Tout était pourtant déjà calculé, mais
        éparpillé — la trajectoire dans les tuiles, les tours dans l'accordéon,
        les réussites dans le profil. Rien de neuf n'est mesuré ici : les tours
        clos sont relus, comme partout ailleurs dans l'arène.
      */}
      {finished
        ? (() => {
            const bilan = bilanDeLaPartie(
              periods.map((p) => ({
                round: p.round,
                libelle: periodLabel(view.roundDays, p.round),
                ca: p.result.incomeStatement.revenue,
                resultat: p.result.incomeStatement.netIncome,
                tresorerie: p.result.functionalBalance.netTreasury,
              })),
            );
            if (!bilan) return null;
            const cases = reussitesDeLaPartie(
              periods.map((p) => lireLeTour(p.round, p.result, p.forecastReview)),
            );
            const acquises = cases.filter((c) => c.round !== null);
            // La dernière franchie : celle qu'on a envie de nommer, parce
            // qu'elle est encore fraîche.
            const derniere = acquises.reduce<(typeof acquises)[number] | null>(
              (tard, c) => (!tard || c.round! > tard.round! ? c : tard),
              null,
            );
            const moi = view.ranking.find((row) => row.isPlayer);
            const classementOuvert = !view.classement.parLAnimateur || view.classement.revele;
            return (
              <BilanDePartie
                titre={
                  moi?.rank === 1
                    ? `🏆 Victoire ! ${view.playerTeamName} domine le marché.`
                    : "Partie terminée."
                }
                bilan={bilan}
                reussites={{
                  acquises: acquises.length,
                  total: cases.length,
                  derniere: derniere?.reussite.titre ?? null,
                }}
                place={
                  classementOuvert && moi
                    ? { rang: moi.rank, total: view.ranking.length }
                    : null
                }
                motDeClassement={
                  classementOuvert
                    ? null
                    : "Le classement final sera révélé par votre enseignant."
                }
                record={
                  view.kind === "solo" && view.playerBpi !== null
                    ? { monIpg: view.playerBpi, meilleur: recordPrecedent?.bpi ?? null }
                    : null
                }
              >
                <Link
                  href={`/jouer?secteur=${encodeURIComponent(view.scenarioCode)}`}
                  className={bouton()}
                >
                  Rejouer {view.intro.company}
                </Link>
                <Link
                  href="/jouer"
                  className="inline-block rounded-lg border border-white/15 px-6 py-2 text-sm font-semibold text-slate-200 hover:border-white/30 hover:bg-white/5"
                >
                  Un autre métier
                </Link>
              </BilanDePartie>
            );
          })()
        : null}

      {/* ══════════════════════════════════════════════════════════════════
          ACCORDÉON DE PÉRIODES
          Chaque tour clos se replie sur une ligne de synthèse (CA, résultat,
          trésorerie) et se rouvre sur son tableau de bord complet + son
          débriefing. Le tour en cours est la période active, toujours ouverte.
          ══════════════════════════════════════════════════════════════════ */}
      {/*
        space-y-4 et non 3 : l'écart ENTRE deux tours doit dépasser l'écart
        interne d'une carte (py-3), sans quoi l'œil ne sait plus où finit un
        tour et où commence le suivant.
      */}
      {/*
        OÙ EN EST L'ENTREPRISE, AVANT LE TOUR QU'ON JOUE.
        Les chiffres existaient, un tour à la fois : pour savoir si la
        trésorerie se redressait ou s'enfonçait, il fallait déplier trois tours
        et comparer de tête. Trois tuiles le disent d'un coup, juste au-dessus
        du tour à jouer — c'est le contexte de la décision, pas une décoration,
        et il ne s'affiche qu'à partir du deuxième tour, quand il y a une
        courbe à montrer.
      */}
      {telephone ? null : tableauNode}

      {/*
        LE TOUR À JOUER EN PREMIER.

        La frise des tours clos ouvrait cette section, et commençait au tour
        1 : mesuré dans le navigateur, un élève qui ouvrait sa partie sur
        téléphone voyait 461 px d'administration puis le tour 1, et devait
        descendre une page de 2 718 px pour atteindre le tour qu'il avait à
        jouer. Il arrive maintenant dessus.

        Les tours clos gardent leur place juste dessous, le dernier ouvert :
        on lit ses résultats avant de décider, et c'est le lien en tête du
        tour en cours qui y mène.
      */}
      <div className="space-y-4">
        {/* ── Période active : le tour en cours, ouvert ── */}
        {hasActivePeriod ? (
          <section
            id="tour-en-cours"
            className="scroll-mt-24 rounded-xl border border-amber-400/30 bg-slate-950/40 max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent"
          >
            {/* Sur téléphone, le tour est annoncé par la barre du haut et le parcours
                en cartes : ni cadre, ni « Tour 1 / 6 », ni « en cours » ici. Ne reste
                de cette ligne que l'état des décisions, en classe. */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/20 px-3 py-2.5 sm:px-4 max-sm:border-0 max-sm:p-0 max-sm:empty:hidden">
              {/* LE RANG SUR LE TOTAL. « Tour 2 » seul ne dit pas s'il en reste
                  six ou un : la frise le montre en segments, elle ne le chiffre
                  pas, et c'est le bandeau retiré qui portait ce « / N ». Il est
                  ici, sur le tour qu'il compte. */}
              <span className="flex items-baseline gap-1.5 text-sm font-semibold text-amber-200 max-sm:hidden">
                <span aria-hidden>✏️</span>
                {periodLabel(view.roundDays, view.currentRound)}
                <span className="text-xs font-normal tabular-nums text-amber-200/70">
                  / {view.roundsCount}
                </span>
              </span>
              <span className="ml-auto flex flex-wrap items-center justify-end gap-2 max-sm:hidden">
                {/* LA SEULE CHOSE QUE LE BANDEAU DISAIT SEUL. « Décisions
                    enregistrées » se lisait tout en haut de la page ; le reste
                    du bandeau étant redite, l'état revient ici, sur l'en-tête du
                    tour qu'il qualifie. Le formulaire, plus bas, le dit aussi
                    (« Mettre à jour mes décisions validées »), mais il faut
                    avoir ouvert l'onglet Décider pour le voir. */}
                {/* EN TEXTE, PAS EN PASTILLE. Cet état portait un liseré vert
                    et un fond vert ; posé à côté de la pastille « en cours »,
                    devenue verte elle aussi, on lisait deux jumelles dont
                    aucune ne ressortait. Le vert de la ligne appartient
                    désormais à « en cours » ; il n'en reste ici que la coche,
                    qui suffit à dire que c'est fait. */}
                {view.kind === "solo" ? null : view.pendingDecisions !== null ? (
                  <span className="text-xs text-slate-300">
                    <span aria-hidden className="text-emerald-400">
                      ✓
                    </span>{" "}
                    Décisions enregistrées · en attente de la clôture
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Résultats à la clôture du tour.</span>
                )}
                {/* « en cours » quitte le titre pour l'autre bout de la ligne :
                    collé au libellé, il allongeait la seule chose qu'on lit en
                    diagonale (le numéro du tour) ; en pastille à droite, il
                    qualifie la ligne comme « résultats livrés » qualifie celle
                    d'un tour clos. Même place, même forme, sens inverse.

                    VERT ET LUMINEUX, avec sa diode. En ambre, il se fondait
                    dans le cadre ambre de la section : une pastille de la
                    couleur de son contenant ne se voit pas. Le vert le détache,
                    et le point allumé dit « ça tourne » — c'est le seul endroit
                    de la ligne qui parle du présent. */}
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-400/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 max-sm:hidden">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_1px] shadow-emerald-400/70"
                  />
                  en cours
                </span>
              </span>
            </div>

            {/*
              OÙ EN EST LA CLASSE. La ligne d'état dit où en est VOTRE équipe ;
              celle-ci dit où en est la classe, et transforme l'attente de la
              clôture en attente commune. Elle ne nomme personne : ce serait une
              comparaison permanente entre équipes, que le dépôt refuse ailleurs
              en laissant l'enseignant maître du classement.
            */}
            {telephone ? null : soumissionsNode}

            {/* Le tour précédent vient de livrer ses résultats (solo : la
                simulation ; classe : la clôture par l'enseignant) : on met
                « voir les résultats » en tête du tour suivant, pour ne pas
                enchaîner sur une nouvelle saisie sans être passé par ses
                résultats. Le lien descend vers la période close, ouverte sur ses
                résultats (#dernier-resultat). */}
            {!telephone && latestRound !== null ? (
              <a
                href="#dernier-resultat"
                className="flex items-center justify-between gap-3 border-b border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 text-sm transition hover:bg-emerald-400/10 sm:px-4"
              >
                <span className="flex items-center gap-2 font-medium text-emerald-200">
                  <span aria-hidden>📊</span>
                  {periodLabel(view.roundDays, latestRound)} {view.kind === "solo" ? "simulé" : "clos"} — voir les résultats
                </span>
                {/* La flèche descend : les tours clos sont passés SOUS le
                    tour en cours, pour que l'élève ouvre sa partie sur ce
                    qu'il a à faire. */}
                <span aria-hidden className="text-emerald-300">
                  ↓
                </span>
              </a>
            ) : null}

            <div className="px-2 py-2.5 sm:p-4 max-sm:px-0">
              {/*
                UNE ÉTAPE ENTRE LES RÉSULTATS ET LA SAISIE SUIVANTE. Tant que
                l'élève n'a pas dit qu'il passait au tour suivant, le formulaire
                reste replié : les résultats du tour clos, juste au-dessus, ont
                alors l'écran pour eux. C'est une étape, pas un verrou — voir
                `PassageAuTour`. Au premier tour, `labelPrecedent` vaut null et
                le contenu s'affiche directement : il n'y a rien à lire avant.
              */}
              <PassageAuTour
                gameId={gameId}
                tour={view.currentRound}
                labelTour={periodLabel(view.roundDays, view.currentRound)}
                labelPrecedent={
                  // Sur téléphone, les résultats sont la première carte du parcours :
                  // il n'y a pas d'étape à franchir avant la saisie.
                  !telephone && latestRound !== null
                    ? periodLabel(view.roundDays, latestRound)
                    : null
                }
              >
              {/* Le tour en cours porte les mêmes onglets que les tours clos, dès
                  le premier tour : Situation (à lire), Décisions (à rendre) et
                  Résultats — ce dernier vide tant que le tour n'est pas clos.
                  Défaut sur « Situation » : on lit l'énoncé avant de décider. */}
                {telephone ? (
                  // SUR TÉLÉPHONE, UN PARCOURS ET NON DES ONGLETS : briefing en
                  // cartes, analyse, puis les décisions, avec un seul bouton en bas.
                  <ParcoursMobile
                    briefing={briefingCartes}
                    analyse={analyseCartes}
                    courrier={courrierCarte}
                    decisions={decisionsMobile}
                  />
                ) : (
                  <SegmentedTabs
                    defaultKey="situation"
                    // Un seul parcours, solo comme en classe : un fil d'étapes guidé
                    // en trois temps — Situation (données, marché, alertes,
                    // arbitrage) → Analyser (aides d'analyse puis les QCM en
                    // accordéon) → Décider. En solo, « Décider » simule aussitôt ; en
                    // classe, il rend les décisions et les résultats arrivent à la
                    // clôture du tour, dans l'accordéon des tours passés (donc pas
                    // d'onglet Résultats vide ici).
                    guided
                    syncAnchors={["situation", "decisions"]}
                    tabs={[
                      { key: "situation", label: "Situation", icon: "📋" },
                      { key: "analyser", label: "Analyser", icon: "🔍" },
                      { key: "decisions", label: "Décider", icon: "✏️" },
                    ]}
                  >
                    {{
                      // « Situation » : le décor du tour (données, marché, alertes,
                      // arbitrage). L'analyse (aides d'analyse + QCM) vit dans
                      // « Analyser », et la saisie dans « Décider ».
                      situation: (
                        <div id="situation" className="space-y-6">
                          {/*
                        LE MANDAT, AU PREMIER TOUR, AVANT TOUT LE RESTE.

                        Les leviers du niveau sont tous ouverts dès le premier
                        écran de décision, et aucun n'avait été réclamé par
                        personne : on remplissait des champs qui étaient là
                        parce qu'ils étaient là. Cette note des associés dit qui
                        confie quoi, et elle nomme les domaines dans les termes
                        mêmes des étapes du formulaire — l'élève lit « vous avez
                        la main sur le financement », puis retrouve l'onglet.

                        Une seule fois, au tour 1 : un mandat ne se répète pas.
                        Et il se range une fois lu — il arrive là où l'élève a
                        déjà le plus à lire, et quatre blocs empilés font qu'on
                        ne lit plus le premier.
                      */}
                      {/*
                        CE QU'ON VOUS RÉPOND. Le courrier ne descendait que dans
                        un sens : le monde écrivait, l'équipe répondait par des
                        chiffres, et personne ne lui répondait jamais. On
                        licenciait sans qu'aucun avocat n'écrive, on doublait un
                        prix sans qu'aucun client ne s'en plaigne.

                        Ces lettres répondent aux décisions du tour qui vient
                        d'être clos, et elles ne touchent aucun compte : la
                        conséquence chiffrée, le moteur l'a déjà calculée. Elles
                        disent qui la subit, ce qu'un tableau de résultats ne
                        dira jamais.
                      */}
                      {reponsesSection}
                      {view.currentRound === 1 ? (
                        <MandatDeLEquipe
                          gameId={gameId}
                          niveau={view.difficulty.level}
                          equipe={view.playerTeamName}
                        />
                      ) : null}
                      {/*
                        On arrive à la décision, on ne l'ouvre pas : d'abord où
                        l'on est (identité, gamme, capacité, situation), puis ce
                        qu'on demande de trancher. Décider avant de savoir n'a
                        pas de sens.
                      */}
                      {donneesSection}
                      {alertesSection}
                      {dilemmeSection}
                    </div>
                  ),
                  // « Analyser » : les QCM des situations en accordéon.
                  analyser: analyserContenu,
                  // « Décider » : la piste (leviers d'action) en indice repliable,
                  // au plus près des champs qu'elle désigne, puis la saisie.
                  decisions: decisionsNode,
                }}
              </SegmentedTabs>
              )}
              </PassageAuTour>
            </div>
          </section>
        ) : null}

        {telephone && !finished ? null : toursPasses}
      </div>

      {/*
        ── CE QUI N'EST PAS LE JEU ──

        L'identité, la clé de reprise et la composition des équipes ouvraient
        la page : 461 px d'administration avant la première ligne de jeu, sur
        un écran de téléphone qui en fait 844. Elles sont vraies et utiles,
        mais elles ne sont pas ce que l'élève vient faire. Elles vivent donc
        sous le tour, dans l'ordre où l'on en a besoin.

        Le nom reste visible en permanence : le bandeau de jeu le porte, en
        haut. C'était le seul rôle que l'encadré remplissait mieux qu'une
        ligne — prévenir qu'on joue sous l'identité du poste précédent.
      */}
      {/*
        ── Composition des équipes ──
        Le code d'invitation range dans l'équipe la moins remplie : l'élève
        arrivé avec son groupe se retrouve seul ailleurs, et celui qui revient
        d'un autre poste — cookie d'invité perdu — est réaffecté au hasard sans
        qu'aucun message ne le prévienne. Ouvert au premier tour, replié
        ensuite : passé la clôture, il ne reste qu'à lire qui est où et à le
        signaler à l'enseignant.
      */}
      {telephone ? null : compositionNode}

      <div id="mon-profil" className="scroll-mt-24 space-y-4">
        {/*
          LES RÉUSSITES EN TÊTE DU PROFIL. Les réussites se disaient au tour où
          ils arrivaient et disparaissaient avec lui : au sixième tour, plus
          rien ne rappelait qu'on avait sauvé la trésorerie au deuxième. Ils
          sont relus des résultats déjà calculés — rien de neuf n'est stocké — et
          les cases vides disent ce qu'il reste à viser.
        */}
        {telephone && !finished ? null : vosReussites}

        {telephone ? null : compteNode}

        {/* Les deux liens retirés du bandeau de jeu : ils restent à portée,
            là où l'élève regarde son profil. */}
        <p className="flex flex-wrap gap-x-4 text-xs text-slate-400 max-sm:hidden">
          <Link href="/profile" className="underline-offset-4 hover:text-slate-300 hover:underline pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center">
            Mon profil et ma progression
          </Link>
          <Link href="/notions" className="underline-offset-4 hover:text-slate-300 hover:underline pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center">
            Fiches notions
          </Link>
        </p>
      </div>

      {/* ── Assistant IA (coach de tour + tuteur) ── */}
      <AiAssistant gameId={gameId} coach={aiCoachEnabled && periods.length > 0} tutor={aiTutor} />

      {/* ── RoundStatusPoller ── */}
      {!finished && view.kind === "class" ? (
        <RoundStatusPoller
          gameId={view.gameId}
          currentRound={view.currentRound}
          roundStatus="open"
          // « submissions » est l'endpoint de l'ENSEIGNANT : il exige d'être le
          // créateur de la partie, et un élève y recevrait 403 en silence. Celui
          // de l'élève rend désormais le même compte, qui bouge sans que le tour
          // change — sans quoi la ligne « 3 équipes sur 6 » resterait figée
          // pendant tout le temps où elle sert.
          endpoint="round-status"
          submittedCount={view.soumissions?.validees}
        />
      ) : null}
    </main>
  );
}
