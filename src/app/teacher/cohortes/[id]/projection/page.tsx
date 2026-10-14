import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { lienDInvitation, origineDeLaRequete } from "@/lib/origine";
import { compter } from "@/lib/format";
import { cohorteDeLEnseignant } from "@/services/cohortes.service";
import { CodeQr } from "@/components/code-qr";

export const metadata: Metadata = {
  title: "Projection du code",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LE CODE DE LA COHORTE, AU MUR.
 *
 * La projection d'une partie (`VueDeProjection`) est faite pour une partie : ses
 * équipes, ses tours, son classement et sa révélation. Une cohorte n'a rien de cela ;
 * il ne lui faut que le premier panneau, celui du code. Cette page le reprend : la même
 * ardoise, la même échelle (le code lisible du fond de la salle, le QR à côté, de même
 * rang), l'adresse de la page d'invitation, et le nombre de participants. Rien d'autre.
 */
export default async function ProjectionDeLaCohorte({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { id } = await params;
  const [cohorte, origine] = await Promise.all([
    cohorteDeLEnseignant(session.userId, id),
    origineDeLaRequete(),
  ]);
  if (!cohorte) notFound();
  const adresse = `${origine.replace(/^https?:\/\//, "")}/entreprises/episode/rejoindre`;

  return (
    <main id="main" className="ardoise min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-8">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Projection">
          <Link
            href={`/teacher/cohortes/${cohorte.id}`}
            className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200"
          >
            ← Ma cohorte
          </Link>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.4rem,1.2vh,2rem)] py-[clamp(0.6rem,1.8vh,4rem)] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.4rem)] font-semibold uppercase tracking-annonce text-slate-400">
            Rejoindre la cohorte
          </p>
          <p className="text-[clamp(1.2rem,3vw,2.4rem)] font-semibold text-slate-200">
            {cohorte.nom}
          </p>
          <div className="flex flex-col items-center gap-[clamp(0.75rem,3vw,3rem)] sm:flex-row sm:justify-center">
            <p
              data-code-projete=""
              className="break-all font-mono text-[clamp(2.5rem,11vw,8rem)] font-bold leading-none tracking-etiquette text-slate-100"
            >
              {cohorte.code}
            </p>
            <span className="flex shrink-0 flex-col items-center gap-[clamp(0.25rem,1vh,0.75rem)]">
              <CodeQr
                valeur={lienDInvitation(origine, cohorte.code)}
                description={`QR code d'entrée dans la cohorte, code ${cohorte.code}`}
                className="h-[clamp(7rem,26vh,16rem)] w-[clamp(7rem,26vh,16rem)]"
              />
              <span className="text-[clamp(0.8rem,1.4vw,1.2rem)] uppercase tracking-surtitre text-slate-400">
                ou scannez
              </span>
            </span>
          </div>
          <p className="break-all text-[clamp(1.1rem,3.4vw,2.6rem)] font-semibold text-slate-200">
            {adresse}
          </p>
          <p className="text-[clamp(1rem,2.4vw,1.8rem)] text-slate-400">
            {cohorte.closeLe
              ? "Cette cohorte est close : elle n'accepte plus de nouveaux participants."
              : cohorte.membres === 0
                ? "Personne n'a encore rejoint."
                : `${compter(cohorte.membres, "participant")} dans la cohorte`}
          </p>
        </div>
      </div>
    </main>
  );
}
