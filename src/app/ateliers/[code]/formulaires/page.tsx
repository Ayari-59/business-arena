import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { atelierByCode } from "@/config/ateliers";
import { formulairesAtelier } from "@/config/ateliers/formulaires";
import { scenarioByCode } from "@/config/scenarios/registry";
import { PrintButton } from "@/components/print-button";

/**
 * LES FORMULAIRES DES LIVRABLES.
 *
 * Une feuille par séance, faite pour être imprimée en tête de classe et
 * distribuée. Chaque feuille porte le nom du document à rendre, une ligne à
 * remplir par rubrique demandée, et en bas ce sur quoi le document sera
 * regardé, à relire avant de le rendre.
 *
 * Le dossier de l'élève DIT ce qu'il rend ; cette page le lui fait écrire. Ce
 * n'est pas la même chose, et c'est la raison de la mise en page : une feuille
 * par page imprimée, avec de la place pour la main.
 *
 * Aucune rubrique n'est écrite ici : elles se découpent de la phrase de
 * l'enseignant, et deux gardes vérifient que le découpage n'ajoute ni ne perd
 * rien.
 */
export const dynamic = "force-static";

export async function generateStaticParams() {
  const { ATELIERS } = await import("@/config/ateliers");
  return ATELIERS.map((a) => ({ code: a.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) return {};
  return {
    title: `Formulaires des livrables · ${atelier.titre} · BUSINESS ARENA`,
    description: `Une feuille à remplir par séance, à imprimer et à distribuer, pour ${atelier.diplome}.`,
  };
}

/** Une ligne à écrire dessus : c'est tout le formulaire, répété. */
function LigneAEcrire({ hauteur }: { hauteur: string }) {
  return <div className={`${hauteur} border-b border-dotted border-white/25 print:border-black/40`} />;
}

export default async function FormulairesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) notFound();
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  const formulaires = formulairesAtelier(atelier);

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-12 print:max-w-none print:px-0 print:py-0 print:text-black">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 print:hidden">
        <Link href={`/ateliers/${atelier.code}`} className="hover:text-slate-300">
          {atelier.titre}
        </Link>{" "}
        / Formulaires
      </p>

      <header className="mt-4 border-b border-white/10 pb-6 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          {atelier.nature} · {atelier.diplome} · {atelier.annee}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50">
          Les formulaires des livrables
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Une feuille par séance, à imprimer et à distribuer. Chaque feuille reprend le document
          demandé, ligne par ligne, et rappelle en bas ce qui sera regardé. Les équipes rendent
          alors des documents comparables, et personne n&apos;oublie une rubrique.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrintButton label="Imprimer les formulaires" />
          <a
            href={`/ateliers/${atelier.code}/formulaires/tableur`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            Les mêmes en tableur
          </a>
          <Link
            href={`/ateliers/${atelier.code}/dossier`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            Le dossier élève
          </Link>
        </div>
      </header>

      <div className="mt-8 space-y-10 print:mt-0 print:space-y-0">
        {formulaires.map((f, index) => (
          <section
            key={f.seance}
            className={`rounded-xl border border-white/10 p-6 print:rounded-none print:border-0 print:p-0 ${
              index === 0 ? "" : "print:break-before-page"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3 print:border-black/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 print:text-black">
                Séance {f.seance} · {f.seanceTitre}
              </p>
              <p className="text-xs uppercase tracking-wider text-slate-500 print:text-black">
                {f.tourJoue !== null ? `Tour joué : ${f.tourJoue}` : "Aucun tour joué"}
              </p>
            </div>

            {/* Qui rend. Une copie sans nom d'équipe n'est corrigeable par
                personne, et c'est la première chose qu'on oublie. */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs uppercase tracking-wider text-slate-400 print:text-black">
                Équipe
                <LigneAEcrire hauteur="mt-4 h-0" />
              </label>
              <label className="block text-xs uppercase tracking-wider text-slate-400 print:text-black">
                Noms
                <LigneAEcrire hauteur="mt-4 h-0" />
              </label>
            </div>

            <h2 className="mt-6 text-lg font-bold text-slate-50 print:text-black">
              {f.document ?? f.seanceTitre}
            </h2>
            {f.precisions.length > 0 ? (
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-500 print:text-black">
                {f.precisions.join(" · ")}
              </p>
            ) : null}
            {/* La phrase du livrable ne se réécrit pas ici : le titre au dessus
                et les lignes en dessous SONT cette phrase, rangée. La rappeler
                en entier la ferait lire deux fois, sur un document dont la
                place sert à écrire. Elle reste en toutes lettres dans le
                dossier de l'élève. */}
            {f.consigne ? (
              <p className="mt-3 text-sm font-medium text-slate-200 first-letter:uppercase print:text-black">
                {f.consigne} :
              </p>
            ) : null}

            <ol className="mt-4 space-y-5">
              {f.rubriques.map((r) => (
                <li key={r}>
                  <p className="text-sm font-medium text-slate-200 first-letter:uppercase print:text-black">
                    {r}
                  </p>
                  <LigneAEcrire hauteur="mt-6 h-0" />
                  <LigneAEcrire hauteur="mt-6 h-0" />
                </li>
              ))}
            </ol>

            <div className="mt-6 break-inside-avoid border-t border-white/10 pt-4 print:border-black/40">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-black">
                Avant de rendre, nous avons vérifié
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-300 print:text-black">
                {f.evaluation.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 border border-white/40 print:border-black"
                    />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-xs uppercase tracking-wider text-slate-600 print:text-black">
              {atelier.titre} · {scenario.title}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
