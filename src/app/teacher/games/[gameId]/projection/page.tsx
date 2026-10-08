import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { compositionDesEquipes } from "@/services/affectation.service";
import { periodLabel } from "@/config/scenarios/periodicity";
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
export default async function ProjectionPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const view = await getTeacherGameView(gameId, session.userId);
  if (!view) notFound();
  const composition = await compositionDesEquipes(gameId);

  const finished = view.status === "finished";
  const equipes = view.teams
    .filter((t) => t.controller === "human")
    .map((t) => ({ nom: t.name, aValide: t.hasSubmitted }));
  const elevesConnectes = composition.reduce((total, e) => total + e.membres.length, 0);

  const tourCourant = view.rounds.find((r) => r.index === view.currentRound);
  const dernierTourClos = [...view.rounds]
    .filter((r) => r.status === "resolved")
    .sort((a, b) => b.index - a.index)[0];

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
      : (finished || tourCourant?.status !== "open") && dernierTourClos?.rankingRevealed
        ? "classement"
        : "tour";

  // LA PROJECTION EST LE TABLEAU DE LA CLASSE. C'est l'écran qu'on montre à
  // vingt-cinq élèves à la fois, et un vidéoprojecteur délave le clair quand
  // il porte le sombre : la page entière prend l'ardoise.
  // CE QUE LE TOUR A DONNÉ, ÉQUIPE PAR ÉQUIPE. Le classement dit la place,
  // `teams` dit les chiffres du dernier tour clos : la projection a besoin des
  // deux sur la même ligne, et les relie par l'identifiant d'équipe.
  const chiffresDuTour = new Map(view.teams.map((t) => [t.teamId, t]));

  return (
    <main id="main" className="ardoise min-h-screen bg-slate-950 text-slate-100">
      {/* Le sondeur : une équipe qui valide doit apparaître au mur sans que
          personne touche au clavier. Il s'arrête de lui-même quand toutes ont
          rendu, et repart au retour sur l'onglet. */}
      {!finished ? (
        <RoundStatusPoller
          gameId={gameId}
          currentRound={view.currentRound}
          roundStatus={tourCourant?.status ?? "open"}
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
        libelleTour={periodLabel(view.roundDays, view.currentRound)}
        echeance={echeance}
        classement={view.ranking.map((row) => {
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
          };
        })}
        classementRevele={dernierTourClos?.rankingRevealed ?? false}
        libelleTourClos={
          dernierTourClos ? periodLabel(view.roundDays, dernierTourClos.index) : null
        }
        // CE QUI DÉCLENCHE LA RÉVÉLATION : le tour clos dont le classement est
        // révélé. Le mur compare avec le dernier qu'il a dévoilé dans CE
        // navigateur ; plus récent, il le joue, sinon il montre l'état final.
        tourRevele={
          dernierTourClos?.rankingRevealed ? dernierTourClos.index : null
        }
        finished={finished}
        retour={`/teacher/games/${gameId}`}
      />
    </main>
  );
}
