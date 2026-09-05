import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { atelierByCode } from "@/config/ateliers";
import { dossierEnseignant } from "@/config/ateliers/dossiers";
import { conceptByCode } from "@/config/pedagogy/concepts";
import { modelByCode } from "@/config/pedagogy/models";
import { PrintButton } from "@/components/print-button";

/**
 * LE DOSSIER DE L'ENSEIGNANT : LES CORRIGÉS.
 *
 * La fiche de l'atelier porte déjà ce qu'il prépare et comment il anime. Ce
 * qu'elle ne porte pas, ce sont les situations que la partie fera surgir
 * pendant l'atelier : l'enseignant les découvrait en même temps que sa classe,
 * sans corrigé sous les yeux.
 *
 * Elles sont ici, dans l'ordre où elles viennent, avec ce qui est attendu, ce
 * que la classe répondra de travers, et la correction de chaque question.
 *
 * La page est derrière la session. Le dossier de l'élève, lui, est public :
 * mettre les deux au même endroit reviendrait à distribuer le corrigé avec le
 * sujet.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  return { title: atelier ? `Corrigés · ${atelier.titre}` : "Corrigés" };
}

export default async function DossierEnseignantPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) notFound();
  const dossier = dossierEnseignant(atelier);

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-12 print:max-w-none print:px-0 print:py-0 print:text-black">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 print:hidden">
        <Link href={`/ateliers/${atelier.code}`} className="hover:text-slate-300">
          {atelier.titre}
        </Link>{" "}
        / Corrigés
      </p>

      <header className="mt-4 border-b border-white/10 pb-6 print:border-black/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 print:text-black">
          Dossier enseignant · {atelier.diplome} · {atelier.annee}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 print:text-black">
          Les situations, et leurs corrigés
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 print:text-black">
          Ce que la partie fera surgir sur {dossier.scenario.title}, dans l&apos;ordre où cela
          vient. Les situations liées à un tour n&apos;apparaissent que si la partie va jusque là ;
          celles qui dépendent de l&apos;état de l&apos;entreprise peuvent tomber à tout moment, ou
          jamais.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <PrintButton label="Imprimer les corrigés" />
          <Link
            href={`/ateliers/${atelier.code}/dossier`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            Le dossier à distribuer aux élèves
          </Link>
          <a
            href={`/teacher/ateliers/${atelier.code}/grille`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            La grille de correction en tableur
          </a>
        </div>
      </header>

      <div className="mt-8 space-y-8">
        {dossier.situations.map(({ situation, quand, attendus, leurres, corriges }) => {
          const modeleOptimal = Object.entries(situation.modelRelevance).find(
            ([, r]) => r === "optimal",
          )?.[0];
          return (
            <article
              key={situation.code}
              className="break-inside-avoid rounded-xl border border-white/10 p-5 print:border-black/20"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 print:text-black">
                {quand}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-50 print:text-black">
                {situation.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-black">
                {situation.narrative}
              </p>
              <p className="mt-2 text-sm font-medium italic text-slate-200 print:text-black">
                {situation.problem}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 print:text-black">
                Attendu au diagnostic
              </p>
              <ul className="mt-1 space-y-1 text-sm text-slate-300 print:text-black">
                {attendus.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 print:text-black">
                Ce que la classe proposera de travers
              </p>
              <ul className="mt-1 space-y-1 text-sm text-slate-400 print:text-black">
                {leurres.map((l) => (
                  <li key={l}>· {l}</li>
                ))}
              </ul>

              <div className="mt-4 space-y-3">
                {corriges.map((c) => (
                  <div key={c.question} className="border-t border-white/10 pt-3 print:border-black/20">
                    <p className="text-sm font-medium text-slate-200 print:text-black">{c.question}</p>
                    <p className="mt-1 text-sm text-emerald-300 print:text-black">→ {c.reponse}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400 print:text-black">
                      {c.explication}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400 print:border-black/20 print:text-black">
                <p>
                  Notions :{" "}
                  {situation.conceptCodes
                    .map((c) => conceptByCode.get(c)?.name ?? c)
                    .join(", ")}
                  .
                </p>
                {modeleOptimal ? (
                  <p className="mt-1">
                    Modèle attendu : {modelByCode.get(modeleOptimal)?.name ?? modeleOptimal}.
                  </p>
                ) : null}
                <p className="mt-1">
                  Indices disponibles à l&apos;élève, du plus vague au plus explicite, chacun
                  facturé en points : {situation.hints.length}.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
