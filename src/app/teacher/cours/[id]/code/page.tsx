import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { origineDeLaRequete } from "@/lib/origine";
import { compter } from "@/lib/format";
import { laClasseDeLEnseignant, resumeDeLaClasse } from "@/services/cours.service";
import { CodeQr } from "@/components/code-qr";

export const metadata: Metadata = {
  title: "Projection du code de la classe",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LE CODE D'UNE CLASSE DU COURS, AU MUR (audit UX du 11 novembre 2026, P2-9 : la partie et la cohorte
 * avaient « Projeter le code », la classe du cours non).
 *
 * La même ardoise que la projection du code d'une cohorte (/teacher/cohortes/[id]/projection) : le code
 * lisible du fond de la salle, le QR à côté, de même rang, l'adresse de la page où on le tape, et le
 * nombre d'élèves qui ont rejoint. Rien d'autre : aucun nom d'élève, la page se lit devant tous.
 */
async function ProjectionDuCodeDeLaClasse({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const { id } = await params;
  const classe = /^[0-9a-f-]{36}$/.test(id) ? await laClasseDeLEnseignant(session.userId, id) : null;
  if (!classe) notFound();
  const [eleves, origine] = await Promise.all([resumeDeLaClasse(session.userId, classe.id), origineDeLaRequete()]);
  const lien = `${origine}/cours/rejoindre?code=${encodeURIComponent(classe.code)}`;
  const adresse = `${origine.replace(/^https?:\/\//, "")}/cours/rejoindre`;
  const nombre = eleves?.length ?? 0;

  return (
    <main id="main" className="ardoise min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-8">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Projection">
          <Link
            href={`/teacher/cours/${classe.id}`}
            className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200"
          >
            ← Ma classe
          </Link>
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.4rem,1.2vh,2rem)] py-[clamp(0.6rem,1.8vh,4rem)] text-center">
          <p className="text-[clamp(0.8rem,1.6vw,1.4rem)] font-semibold uppercase tracking-annonce text-slate-400">Rejoindre la classe</p>
          <h1 className="text-[clamp(1.2rem,3vw,2.4rem)] font-semibold text-slate-200">{classe.nom}</h1>
          <div className="flex flex-col items-center gap-[clamp(0.75rem,3vw,3rem)] sm:flex-row sm:justify-center">
            <p
              data-code-projete=""
              className="break-all font-mono text-[clamp(2.5rem,11vw,8rem)] font-bold leading-none tracking-etiquette text-slate-100"
            >
              {classe.code}
            </p>
            <span className="flex shrink-0 flex-col items-center gap-[clamp(0.25rem,1vh,0.75rem)]">
              <CodeQr
                valeur={lien}
                description={`QR code d'entrée dans la classe, code ${classe.code}`}
                className="h-[clamp(7rem,26vh,16rem)] w-[clamp(7rem,26vh,16rem)]"
              />
              <span className="text-[clamp(0.8rem,1.4vw,1.2rem)] uppercase tracking-surtitre text-slate-400">ou scannez</span>
            </span>
          </div>
          <p className="break-all text-[clamp(1.1rem,3.4vw,2.6rem)] font-semibold text-slate-200">{adresse}</p>
          <p className="text-[clamp(1rem,2.4vw,1.8rem)] text-slate-400" data-eleves-projetes={nombre}>
            {classe.closeLe
              ? "Cette classe est close : elle n'accepte plus de nouvel élève."
              : nombre === 0
                ? "Personne n'a encore rejoint."
                : `${compter(nombre, "élève")} dans la classe`}
          </p>
        </div>
      </div>
    </main>
  );
}

export default avecTypographie(ProjectionDuCodeDeLaClasse);
