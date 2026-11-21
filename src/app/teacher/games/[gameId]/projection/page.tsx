import { avecTypographie } from "@/components/typographie";
import { notFound, redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { compositionDesEquipes } from "@/services/affectation.service";
import { periodLabel } from "@/config/scenarios/periodicity";
import { dateDeLancement } from "@/lib/lancement-du-tour";
import { PODIUM_DE_L_ESSAI, tourAffiche } from "@/config/tour-d-essai";
import { tourDEssaiALaUne } from "@/services/podium-de-l-essai.service";
import { SITE_URL } from "@/config/site";
import { RoundStatusPoller } from "@/components/round-status-poller";
import { EchoDeSeance } from "@/components/signal-de-seance";
import { CodeQr } from "@/components/code-qr";
import { urlDeJonction } from "@/lib/qr";
import { formatEuro } from "@/lib/format";
import { euroSigne } from "@/components/tableau-de-bord";
import { VueDeProjection, type Panneau } from "@/components/vue-de-projection";

export const dynamic = "force-dynamic";

/** Une page de salle : elle n'a rien à faire dans un index. */
export const metadata: Metadata = {
  title: "Projection de séance",
  robots: { index: false, follow: false },
};

/**
 * PROJETER LA SÉANCE.
 *
 * L'enseignant branche le vidéoprojecteur et tout ce qu'il a sous la main est
 * écrit pour un écran à cinquante centimètres. Du fond de la salle, le code
 * d'invitation du ticket (3xl), l'état des validations (text-sm dans un
 * tableau) et le classement (text-sm) sont illisibles : la séance se tenait
 * donc à la voix, en répétant « il reste dix minutes » et « il manque deux
 * équipes » à chaque question.
 *
 * Cette page ne montre rien de neuf : elle montre GRAND, et une chose à la
 * fois. Le panneau d'ouverture suit le moment réel de la partie — personne
 * n'a encore rejoint, on affiche le code ; le tour est ouvert, on affiche les
 * validations ; le dernier tour est clos et révélé, on affiche le classement.
 *
 * Elle respecte le rideau : un classement non révélé ne se projette pas, sans
 * quoi l'écran de pilotage perdrait le seul geste qui fait de la révélation un
 * moment.
 *
 * ET QUAND LE RIDEAU SE LÈVE, ELLE JOUE LE RITUEL (lot 4B). Le tour clos et
 * son classement révélé, le mur dévoile les équipes de la dernière à la
 * première, puis le podium : le même « le marché a répondu » qu'en solo à la
 * fin d'un tour. Les chiffres sont ceux du tour réellement simulé — le
 * résultat net de chaque équipe et sa trésorerie, que la vue de la partie
 * porte déjà — formatés ici, une fois, pour que le mur n'ait plus qu'à les
 * montrer.
 *
 * DEUX CHEMINS POUR L'APPRENDRE, ET AUCUN DONT ELLE DÉPENDE : le pilotage le
 * lui dit par le canal de la séance quand les deux onglets sont dans le même
 * navigateur (`EchoDeSeance`), et le sondeur l'y ramène sinon (`insistant`).
 */
async function ProjectionPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const { gameId } = await params;
  const view = await getTeacherGameView(gameId, session.userId);
  if (!view) notFound();
  const essaiEnJeu = view.essai !== null && view.essai.phase !== "fini";
  const composition = await compositionDesEquipes(gameId);

  const finished = view.status === "finished";
  const equipes = view.teams
    .filter((t) => t.controller === "human")
    .map((t) => ({ nom: t.name, aValide: t.hasSubmitted }));
  const elevesConnectes = composition.reduce((total, e) => total + e.membres.length, 0);

  const tourCourant = view.rounds.find((r) => r.index === view.currentRound);
  const dernierVraiTourClos = [...view.rounds]
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];
  // LE TOUR D'ESSAI ARCHIVÉ SE RÉVÈLE COMME UN AUTRE. La vraie partie commencée, tout
  // l'essai est dans son archive : tant qu'elle n'a clos aucun tour, le mur y relit le
  // classement de l'essai, sa révélation et son podium, avec la vue de la partie
  // d'archive elle-même (services/podium-de-l-essai.service.ts). Même rideau : il ne
  // se joue qu'une fois révélé par l'animateur.
  const essaiALaUne = await tourDEssaiALaUne({
    gameId,
    essai: view.essai,
    vraiTourClos: dernierVraiTourClos !== undefined,
  });
  const archive = essaiALaUne ? await getTeacherGameView(essaiALaUne.archiveId, session.userId) : null;
  // La source du classement : la partie, ou l'archive de son essai.
  const source = archive ?? view;
  const dernierTourClos = archive
    ? archive.rounds.find((r) => r.index === essaiALaUne!.tour)
    : dernierVraiTourClos;
  // Le classement projeté est-il celui de l'essai ? Il ne compte pas, et le mur le dit.
  const classementDEssai = essaiEnJeu || archive !== null;

  // L'échéance effective du tour : la première des deux bornes qui tombe, la
  // fenêtre du tour ou celle de la partie. Même règle que le verrou côté
  // élève (lib/play-window), réduite aux deux dates que cette vue expose.
  const bornes = [tourCourant?.deadline, view.closesAt].filter((d): d is string => !!d);
  const echeance =
    bornes.length === 0
      ? null
      : bornes.reduce((a, b) => (new Date(b) < new Date(a) ? b : a));

  // Le panneau d'ouverture, d'après le moment de la séance. L'enseignant
  // arrive sur ce qu'il allait choisir de toute façon.
  const defaut: Panneau =
    elevesConnectes === 0 && !finished
      ? "code"
      : (finished ||
            tourCourant?.status !== "open" ||
            view.lancement ||
            // L'essai archivé révélé, tant qu'aucune équipe n'a validé le vrai tour 1.
            (archive !== null && equipes.every((e) => !e.aValide))) &&
          dernierTourClos?.rankingRevealed
        ? "classement"
        : "tour";

  // LA PROJECTION EST LE TABLEAU DE LA CLASSE. C'est l'écran qu'on montre à
  // vingt-cinq élèves à la fois, et un vidéoprojecteur délave le clair quand
  // il porte le sombre : la page entière prend l'ardoise.
  // CE QUE LE TOUR A DONNÉ, ÉQUIPE PAR ÉQUIPE. Le classement dit la place,
  // `teams` dit les chiffres du dernier tour clos : la projection a besoin des
  // deux sur la même ligne, et les relie par l'identifiant d'équipe.
  const chiffresDuTour = new Map(source.teams.map((t) => [t.teamId, t]));

  return (
    <main id="main" className="ardoise min-h-screen bg-slate-950 text-slate-100">
      {/* Le sondeur : une équipe qui valide doit apparaître au mur sans que
          personne touche au clavier. Il s'arrête de lui-même quand toutes ont
          rendu, et repart au retour sur l'onglet. */}
      {!finished ? (
        <RoundStatusPoller
          gameId={gameId}
          currentRound={view.currentRound}
          // « attente » tant que le tour attend son lancement : le mur se recharge
          // quand l'enseignant le lance ou que sa date arrive.
          roundStatus={view.lancement ? "attente" : (tourCourant?.status ?? "open")}
          endpoint="submissions"
          submittedCount={equipes.filter((e) => e.aValide).length}
          insistant
        />
      ) : null}
      {/* Le mur écoute le pilotage : le tour clos là-bas se dévoile ici sans
          attendre le prochain sondage. */}
      <EchoDeSeance
        gameId={gameId}
        tourClos={dernierTourClos?.index ?? null}
        revele={dernierTourClos?.rankingRevealed ?? false}
      />
      <VueDeProjection
        defaut={defaut}
        gameId={gameId}
        joinCode={view.joinCode}
        qr={
          view.joinCode ? (
            <CodeQr
              valeur={urlDeJonction(view.joinCode)}
              description={`QR code d'entrée dans la partie, code ${view.joinCode}`}
              className="h-[clamp(7rem,26vh,16rem)] w-[clamp(7rem,26vh,16rem)]"
            />
          ) : null
        }
        adresse={`${SITE_URL.replace(/^https?:\/\//, "")}/join`}
        elevesConnectes={elevesConnectes}
        equipes={equipes}
        libelleTour={
          // Pendant l'essai, la salle lit « Tour d'essai 1/2 » (config/tour-d-essai.ts).
          essaiEnJeu
            ? tourAffiche({ essai: view.essai, tour: view.currentRound, tours: view.roundsCount })
            : periodLabel(view.roundDays, view.currentRound)
        }
        echeance={echeance}
        attente={
          view.lancement
            ? view.lancement.ouvertureAuto
              ? `Le ${periodLabel(view.roundDays, view.currentRound).toLowerCase()} s'ouvrira le ${dateDeLancement(view.lancement.ouvertureAuto)}.`
              : `Le ${periodLabel(view.roundDays, view.currentRound).toLowerCase()} n'est pas encore lancé.`
            : null
        }
        classement={source.ranking.map((row) => {
          const equipe = chiffresDuTour.get(row.teamId);
          const resultat = equipe?.lastNetIncome ?? null;
          const tresorerie = equipe?.lastNetTreasury ?? null;
          return {
            rang: row.rank,
            nom: row.name,
            ipg: row.bpi,
            defaillant: row.defaillant,
            // Un résultat nul n'est ni un gain ni une perte : il reste à
            // l'encre, et seule une vraie couleur de résultat se colore.
            resultat: resultat === null ? null : euroSigne(resultat),
            sens:
              resultat === null || Math.round(resultat) === 0
                ? null
                : resultat > 0
                  ? ("gain" as const)
                  : ("perte" as const),
            tresorerie: tresorerie === null ? null : formatEuro(tresorerie),
            decouvert: (tresorerie ?? 0) < 0,
            // LA SUBVENTION HORS CLASSEMENT (décision du propriétaire) : le
            // résultat projeté est hors subvention, et l'aide de l'enseignant
            // se lit à part, jamais comptée.
            subvention:
              (equipe?.lastRescueSubsidy ?? 0) > 0
                ? `Subvention de ${formatEuro(equipe!.lastRescueSubsidy)} hors classement`
                : null,
            // Le rang se fait sur la partie : le cumul à côté du tour.
            cumul: resultat === null ? null : euroSigne(row.cumulativeNetIncome),
            explication: row.explication || null,
          };
        })}
        classementRevele={dernierTourClos?.rankingRevealed ?? false}
        surtitreDuClassement={classementDEssai ? PODIUM_DE_L_ESSAI.surtitre : undefined}
        libelleTourClos={
          dernierTourClos
            ? classementDEssai
              ? `Tour d'essai ${dernierTourClos.index}`
              : periodLabel(view.roundDays, dernierTourClos.index)
            : null
        }
        // CE QUI DÉCLENCHE LA RÉVÉLATION : le tour clos dont le classement est
        // révélé. Le mur compare avec le dernier qu'il a dévoilé dans CE
        // navigateur ; plus récent, il le joue, sinon il montre l'état final.
        tourRevele={
          // Le mur se souvient, dans ce navigateur, du dernier tour qu'il a dévoilé.
          // Après un essai, la vraie partie repart au tour 1 : ses révélations sont
          // numérotées après celles de l'essai, sinon le vrai tour 1 passerait pour
          // déjà vu et ne se jouerait pas.
          // L'essai archivé garde, lui, son numéro d'essai : déjà dévoilé avant la
          // bascule, il ne se rejoue pas.
          dernierTourClos?.rankingRevealed
            ? dernierTourClos.index + (view.essai?.phase === "fini" && !archive ? view.essai.tours : 0)
            : null
        }
        finished={finished}
        retour={`/teacher/games/${gameId}`}
      />
    </main>
  );
}

export default avecTypographie(ProjectionPage);
