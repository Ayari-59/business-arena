import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getTeacherGameView } from "@/services/game.service";
import { getObservationSeance } from "@/services/observation.service";
import { periodLabel } from "@/config/scenarios/periodicity";
import { SITE_URL } from "@/config/site";
import { dureeDuTour } from "@/config/duree-du-tour";
import { etapesEleve, etapesEnseignant, type FaitsDeLaPartie } from "@/config/fiches";
import { scenarioByCode } from "@/config/scenarios/registry";
import { CodeQr } from "@/components/code-qr";
import { urlDeJonction } from "@/lib/qr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fiches à imprimer",
  robots: { index: false, follow: false },
};

/**
 * LA FICHE D'UNE PAGE, IMPRIMÉE DEPUIS LA PARTIE.
 *
 * Le guide en ligne est complet, mais une page web ne se distribue pas en
 * salle. Une par public — l'élève, l'enseignant —, et chacune porte le code de
 * CETTE partie, son scénario, son niveau, le compte de champs que le niveau
 * ouvre et la durée à prévoir : une fiche générique aurait obligé l'enseignant
 * à la compléter à la main, et l'élève à chercher le code ailleurs.
 *
 * Même gabarit d'impression que la liasse de courriers : thème clair, chrome
 * d'écran en `no-print`, A4 portrait. Une fiche par tirage — on imprime celle
 * de l'élève en trente exemplaires et celle de l'enseignant en un.
 */

const styles = `
  .fiche { max-width: 190mm; margin: 0 auto; padding: 10mm 8mm; }
  .fiche h1 { font-size: 20pt; line-height: 1.15; margin: 0; }
  .fiche .kicker { font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase; margin: 0 0 4px; }
  .fiche .chapeau { font-size: 10pt; line-height: 1.5; margin: 6px 0 0; }
  .fiche .code { font-family: ui-monospace, monospace; font-size: 26pt; font-weight: 700; letter-spacing: .12em; }
  /* Le QR sur papier : 24 mm de côté, soit la taille qu'un téléphone lit sans
     hésiter à vingt centimètres, et qui tient dans le bandeau du code. */
  .fiche .qr { width: 24mm; height: 24mm; }
  .fiche ol { margin: 10px 0 0; padding: 0; list-style: none; counter-reset: pas; }
  .fiche li { counter-increment: pas; display: grid; grid-template-columns: 9mm 1fr; gap: 3mm; padding: 2.6mm 0; break-inside: avoid; }
  .fiche li::before { content: counter(pas); font-weight: 700; font-size: 12pt; text-align: center; line-height: 1.4; }
  .fiche li h2 { font-size: 11pt; margin: 0 0 1mm; }
  .fiche li p { font-size: 9.5pt; line-height: 1.45; margin: 0; }
  .fiche .encadre { margin-top: 6mm; padding: 3mm 4mm; font-size: 9pt; line-height: 1.5; break-inside: avoid; }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    .no-print { display: none !important; }
    body { background: #fff; }
    .fiche { padding: 12mm 14mm; }
  }
`;

export default async function FichesPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fiche?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const { fiche } = await searchParams;
  const view = await getTeacherGameView(gameId, session.userId);
  if (!view) notFound();

  const pourLEleve = fiche !== "enseignant";

  // La durée : mesurée si un tour a été joué, estimée sinon. Même règle que la
  // page de pilotage, pour que la fiche ne dise pas autre chose que l'écran.
  const observation = await getObservationSeance(gameId, session.userId);
  const mesure = [...(observation?.tours ?? [])]
    .filter((t) => t.clos && t.minutesMedianes !== null)
    .sort((a, b) => b.index - a.index)[0];
  const estimationCourante = dureeDuTour({
    ...view.chargeDuTour,
    premierTour: view.currentRound === 1,
  });
  const estimationPremier = dureeDuTour({ ...view.chargeDuTour, premierTour: true });

  const definition = scenarioByCode(view.scenarioCode);
  const faits: FaitsDeLaPartie = {
    scenario: view.scenarioTitle,
    entreprise: definition?.playerTeamName ?? null,
    code: view.joinCode,
    adresse: `${SITE_URL.replace(/^https?:\/\//, "")}/join`,
    niveau: { rang: view.difficulty.level, nom: view.difficulty.name },
    tours: view.roundsCount,
    periode: periodLabel(view.roundDays, 1).replace(/\s*\d+$/, "").toLowerCase(),
    champs: view.chargeDuTour.champs,
    avecQuiz: view.chargeDuTour.avecQuiz,
    minutesTourCourant: mesure?.minutesMedianes ?? estimationCourante.minutes,
    minutesPremierTour: estimationPremier.minutes,
    mesure: mesure !== undefined,
    equipes: view.teams.filter((t) => t.controller === "human").length,
    premierTourDejaJoue: view.currentRound > 1,
  };

  const etapes = pourLEleve ? etapesEleve(faits) : etapesEnseignant(faits);

  return (
    <main id="main" data-theme="clair" className="min-h-screen bg-white text-slate-900">
      <style>{styles}</style>

      <header className="no-print mx-auto flex max-w-[190mm] flex-wrap items-center gap-3 px-4 pt-5 text-sm">
        <Link
          href={`/teacher/games/${gameId}`}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition hover:text-slate-900"
        >
          ← Pilotage
        </Link>
        <Link
          href={`/teacher/games/${gameId}/fiches`}
          aria-current={pourLEleve ? "page" : undefined}
          className={`rounded-lg border px-3 py-2 font-medium transition ${
            pourLEleve ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-300 text-slate-600"
          }`}
        >
          Fiche élève
        </Link>
        <Link
          href={`/teacher/games/${gameId}/fiches?fiche=enseignant`}
          aria-current={pourLEleve ? undefined : "page"}
          className={`rounded-lg border px-3 py-2 font-medium transition ${
            pourLEleve ? "border-slate-300 text-slate-600" : "border-amber-500 bg-amber-50 text-amber-900"
          }`}
        >
          Fiche enseignant
        </Link>
        <p className="ml-auto text-xs text-slate-500">
          Imprimez (Ctrl+P) ou enregistrez en PDF. Une page.
        </p>
      </header>

      <article className="fiche">
        <p className="kicker text-amber-700">
          Business Arena · {view.scenarioTitle} · Niveau {view.difficulty.level} ·{" "}
          {faits.niveau.nom}
        </p>
        <h1 className="text-slate-900">
          {pourLEleve ? "Votre première partie, pas à pas" : "Animer la séance, dans l'ordre"}
        </h1>
        <p className="chapeau text-slate-600">
          {pourLEleve
            ? `${view.roundsCount} tours à jouer. À chaque tour : une situation à lire, un diagnostic, des décisions. La simulation répond, et vous recommencez avec ce que vous avez appris.`
            : `${view.roundsCount} tours, ${faits.equipes} ${faits.equipes > 1 ? "équipes" : "équipe"}, ${faits.champs} décisions ouvertes. Cette fiche dit ce qu'on fait et depuis quel écran ; les réglages, eux, vivent dans la page de partie avec leur aide.`}
        </p>

        {/* Le code : la seule chose que l'élève doit avoir sous les yeux avant
            de savoir quoi que ce soit d'autre. Sur la fiche enseignant il est
            là aussi, plus discret, pour l'écrire au tableau. */}
        {view.joinCode ? (
          <div
            className={`mt-4 flex items-center gap-4 rounded-lg border px-4 py-3 ${
              pourLEleve ? "border-amber-400 bg-amber-50" : "border-slate-300"
            }`}
          >
            <p className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-xs uppercase tracking-widest text-slate-500">
                Code d&apos;invitation
              </span>
              <span className={`code ${pourLEleve ? "text-amber-800" : "text-slate-900"}`}>
                {view.joinCode}
              </span>
              <span className="text-sm text-slate-600">{faits.adresse}</span>
            </p>
            {/* LE QR SUR LA FICHE ÉLÈVE SEULEMENT. Elle est tirée en trente
                exemplaires et passe de main en main : chaque élève a le sien
                sous les yeux, le vise, et son code est déjà rempli. Sur la
                fiche enseignant le code sert à l'écrire au tableau — un QR
                qu'une seule personne tient n'aide personne. */}
            {pourLEleve ? (
              <CodeQr
                valeur={urlDeJonction(view.joinCode)}
                description={`QR code d'entrée dans la partie, code ${view.joinCode}`}
                className="qr shrink-0"
              />
            ) : null}
          </div>
        ) : null}

        <ol>
          {etapes.map((e) => (
            <li key={e.titre}>
              <h2 className="text-slate-900">{e.titre}</h2>
              <p className="text-slate-700">{e.texte}</p>
            </li>
          ))}
        </ol>

        <div className="encadre rounded-lg border border-slate-300 bg-slate-50 text-slate-700">
          {pourLEleve ? (
            <>
              <strong>Ce qui compte à la fin.</strong> L&apos;IPG, indice de performance
              globale, mesure six dimensions : l&apos;économique, le financier, le commercial,
              la RSE, le pilotage et la maîtrise de vos décisions. Une entreprise qui gagne de
              l&apos;argent en cassant sa trésorerie ne monte pas au classement.
            </>
          ) : (
            <>
              <strong>Trois écrans à connaître.</strong> « Projeter pour la classe » pour le
              mur, « Observation de séance » pour savoir si la classe a joué, et la liasse de
              courriers à imprimer pour faire entrer le marché dans la salle. Tous les trois
              partent de la page de partie.
            </>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          {faits.adresse.replace("/join", "")} · Fiche générée pour la partie {view.joinCode ?? gameId}
        </p>
      </article>
    </main>
  );
}
