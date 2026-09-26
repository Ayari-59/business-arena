import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { equipesNumerotees, getTeacherGameView } from "@/services/game.service";
import { SITE_URL } from "@/config/site";
import { CodeQr } from "@/components/code-qr";
import { urlDeJonction } from "@/lib/qr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cartons de table",
  robots: { index: false, follow: false },
};

/**
 * UN CARTON PAR TABLE, À DÉCOUPER.
 *
 * Le QR de la partie ouvre l'entrée et laisse l'application répartir : l'élève
 * tombe dans l'équipe la moins remplie, c'est-à-dire pas forcément celle de
 * ses voisins de table. L'enseignant reprenait donc la composition à la main,
 * ou acceptait des équipes qui ne se parlent pas.
 *
 * Ces cartons renversent l'ordre des choses : l'équipe est décidée par la
 * PLACE. On pose un carton par table, les élèves s'installent, scannent, et
 * l'équipe est celle de la table. Rien à annoncer, rien à répartir.
 *
 * Le carton porte aussi le code et l'adresse en petit : un appareil sans
 * appareil photo, une caméra qui refuse, et l'élève tape. Il entre alors par
 * la porte normale, avec affectation automatique, et rejoint ses camarades
 * d'un clic au premier tour.
 *
 * LES COULEURS S'ÉCRIVENT À L'ENVERS, ET C'EST VOULU. Le thème clair renverse
 * l'échelle entière : l'encre se prend dans le bas (slate-100 à slate-600), le
 * papier dans le haut (slate-900, slate-950).
 * `tests/architecture/pages-de-papier.test.ts` tient la règle.
 */

const styles = `
  .cartons { max-width: 190mm; margin: 0 auto; padding: 8mm; display: grid;
             grid-template-columns: repeat(2, 1fr); gap: 4mm; }
  .carton { border: 1px dashed currentColor; border-radius: 3mm; padding: 5mm 5mm 4mm;
            display: flex; flex-direction: column; align-items: center; text-align: center;
            gap: 2mm; break-inside: avoid; }
  .carton .kicker { font-size: 7.5pt; letter-spacing: .16em; text-transform: uppercase; margin: 0; }
  .carton h2 { font-size: 17pt; line-height: 1.1; margin: 0; overflow-wrap: anywhere; }
  .carton .qr { width: 42mm; height: 42mm; }
  .carton .consigne { font-size: 9pt; margin: 0; }
  .carton .secours { font-size: 7.5pt; line-height: 1.4; margin: 0; }
  .carton .secours b { font-family: ui-monospace, monospace; letter-spacing: .1em; }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    .no-print { display: none !important; }
    .cartons { padding: 10mm; gap: 5mm; }
  }
`;

export default async function CartonsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const view = await getTeacherGameView(gameId, session.userId);
  if (!view) notFound();

  // L'ordre de création porte le rang ; l'affichage, lui, suit les noms, comme
  // partout ailleurs dans l'espace enseignant. Le rang ne se montre pas : il
  // est dans l'adresse du QR, et l'enseignant lit le NOM pour poser le carton.
  const equipes = (await equipesNumerotees(gameId)).sort((a, b) =>
    a.nom.localeCompare(b.nom, "fr", { numeric: true }),
  );
  const adresse = `${SITE_URL.replace(/^https?:\/\//, "")}/join`;

  return (
    <main id="main" data-theme="clair" className="min-h-screen bg-slate-950 text-slate-100">
      <style>{styles}</style>

      <header className="no-print mx-auto flex max-w-[190mm] flex-wrap items-center gap-3 px-4 pt-5 text-sm">
        <Link
          href={`/teacher/games/${gameId}`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-500 transition hover:text-slate-100"
        >
          ← Pilotage
        </Link>
        <Link
          href={`/teacher/games/${gameId}/fiches`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-500 transition hover:text-slate-100"
        >
          Fiches à imprimer
        </Link>
        <p className="ml-auto max-w-[95mm] text-xs text-slate-600">
          Imprimez (Ctrl+P), découpez, posez un carton par table. L&apos;élève qui le scanne
          entre dans l&apos;équipe de sa table.
        </p>
      </header>

      {equipes.length === 0 || !view.joinCode ? (
        <p className="mx-auto max-w-[190mm] px-4 py-10 text-sm text-slate-400">
          Cette partie n&apos;a pas d&apos;équipe humaine à qui donner une table.
        </p>
      ) : (
        <div className="cartons">
          {equipes.map((e) => (
            <section key={e.teamId} className="carton">
              {/* Le titre du scénario tenait sur deux lignes et poussait le
                  nom de l'équipe vers le bas. Le carton n'a pas à dire quelle
                  partie : son code est écrit en bas, et c'est le NOM qui doit
                  se voir de l'autre bout de la table. */}
              <p className="kicker text-amber-700">Business Arena</p>
              <h2 className="text-slate-100">{e.nom}</h2>
              <CodeQr
                valeur={urlDeJonction(view.joinCode!, e.rang)}
                description={`QR code d'entrée dans l'équipe ${e.nom}`}
                className="qr"
              />
              <p className="consigne text-slate-400">Scannez pour rejoindre cette équipe</p>
              <p className="secours text-slate-600">
                Sans appareil photo : {adresse} puis le code <b>{view.joinCode}</b>
              </p>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
