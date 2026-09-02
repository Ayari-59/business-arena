import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { atelierByCode } from "@/config/ateliers";
import { dossierEleve } from "@/config/ateliers/dossiers";
import { PERIODICITY_LABELS } from "@/config/scenarios/periodicity";
import { PrintButton } from "@/components/print-button";

/**
 * LE DOSSIER DE L'ÉLÈVE.
 *
 * Écrit de son côté, et de lui seul. Il y trouve l'entreprise qu'il va
 * diriger, ce qu'on attend de lui séance après séance, ce qu'il rend et sur
 * quoi il sera regardé. Il n'y trouve ni la préparation de l'enseignant, ni le
 * minutage du déroulé, ni la moindre réponse aux situations qu'il va
 * rencontrer : elles se jouent, elles ne se révisent pas.
 *
 * Le document est fait pour être imprimé et distribué en début d'atelier, d'où
 * la mise en page qui bascule en noir sur blanc.
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
    title: `Dossier élève · ${atelier.titre}`,
    description: `Ce que vous allez diriger, ce que vous rendez et sur quoi vous serez évalué, pour ${atelier.diplome}.`,
  };
}

export default async function DossierElevePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) notFound();
  const dossier = dossierEleve(atelier);
  const { entreprise } = dossier;
  const periodicite = PERIODICITY_LABELS[dossier.periodicite].singular.toLowerCase();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 print:max-w-none print:px-0 print:py-0 print:text-black">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 print:hidden">
        <Link href={`/ateliers/${atelier.code}`} className="hover:text-slate-300">
          {atelier.titre}
        </Link>{" "}
        / Dossier élève
      </p>

      <header className="mt-4 border-b border-white/10 pb-6 print:border-black/20">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 print:text-black">
          Dossier élève · {dossier.entete.diplome} · {dossier.entete.annee}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 print:text-black">
          {dossier.entete.titre}
        </h1>
        <p className="mt-3 text-base italic leading-relaxed text-slate-300 print:text-black">
          {dossier.entete.pitch}
        </p>
        {/* Le dossier DIT ce qu'on rend ; les deux autres outils le font
            écrire. La feuille qu'on remplit au stylo pendant la séance, et le
            tableur qui calcule à mesure qu'on le remplit. */}
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <PrintButton label="Imprimer ce dossier" />
          <Link
            href={`/ateliers/${atelier.code}/formulaires`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            Formulaires à remplir
          </Link>
          <a
            href={`/ateliers/${atelier.code}/tableau-de-bord`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            Tableau de bord en tableur
          </a>
        </div>
      </header>

      <section className="mt-8 break-inside-avoid rounded-xl border-l-2 border-amber-400 bg-amber-950/10 px-5 py-4 print:border-black/40 print:bg-transparent">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 print:text-black">
          L&apos;entreprise que vous dirigez
        </h2>
        <p className="mt-2 text-lg font-bold text-slate-50 print:text-black">{entreprise.titre}</p>
        <p className="mt-1 text-sm italic text-slate-300 print:text-black">{entreprise.promesse}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 print:text-black">
          {entreprise.contexte}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400 print:text-black">
          Vous la dirigez pendant {dossier.tours} tours, un {periodicite} par tour. Vous n&apos;êtes
          pas seul sur le marché : les autres équipes vendent aux mêmes clients que vous, et ce que
          vous ne prenez pas, quelqu&apos;un le prend.
        </p>
      </section>

      <section className="mt-8 break-inside-avoid">
        <h2 className="text-xl font-bold text-slate-100 print:text-black">
          Le premier arbitrage
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-black">
          {entreprise.premierArbitrage.question}
        </p>
        <ul className="mt-3 space-y-2">
          {entreprise.premierArbitrage.routes.map((route) => (
            <li
              key={route.label}
              className="rounded-lg border border-white/10 px-4 py-3 text-sm print:border-black/20"
            >
              <p className="font-medium text-slate-100 print:text-black">{route.label}</p>
              <p className="mt-1 text-slate-400 print:text-black">↗ {route.gain}</p>
              <p className="text-slate-400 print:text-black">↘ {route.risque}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-100 print:text-black">
          Ce qui vous est demandé, séance après séance
        </h2>
        <div className="mt-4 space-y-6">
          {dossier.seances.map((s) => (
            <article
              key={s.numero}
              className="break-inside-avoid rounded-xl border border-white/10 p-5 print:border-black/20"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 print:text-black">
                Séance {s.numero}
                {s.tourJoue !== null ? ` · vous jouez le tour ${s.tourJoue}` : " · aucun tour joué"}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-50 print:text-black">{s.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-black">
                {s.objectif}
              </p>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-black">
                À la fin, vous savez faire
              </p>
              <ul className="mt-1 space-y-1 text-sm text-slate-300 print:text-black">
                {s.competences.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-black">
                Ce que vous rendez
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300 print:text-black">
                {s.livrable}
              </p>

              <p className="mt-1 text-xs text-slate-500 print:hidden">
                <a
                  href={`/ateliers/${atelier.code}/formulaires`}
                  className="text-amber-300 underline-offset-4 hover:underline"
                >
                  La feuille à remplir pour ce livrable
                </a>
              </p>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 print:text-black">
                Ce qui sera regardé
              </p>
              <ul className="mt-1 space-y-1 text-sm text-slate-300 print:text-black">
                {s.evaluation.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>

              <p className="mt-4 text-xs leading-relaxed text-slate-500 print:text-black">
                Notions à mobiliser : {s.notions.join(", ")}.
              </p>
              <p className="mt-2 border-t border-white/10 pt-2 text-xs italic leading-relaxed text-slate-400 print:border-black/20 print:text-black">
                À verser à votre {dossier.entete.traceLabel} : « {s.trace} »
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Le tableau de bord de l'équipe, à remplir à la main tour après tour.
          Les lignes viennent du produit : les décisions sont celles que le
          niveau ouvre réellement, les indicateurs sont ceux du métier. */}
      <section className="mt-10 break-before-page break-inside-avoid">
        <h2 className="text-xl font-bold text-slate-100 print:text-black">
          Votre tableau de bord
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 print:text-black">
          À remplir tour après tour. Notez ce que vous décidez avant la clôture, ce que vous
          obtenez après : c&apos;est la confrontation des deux qui se relit en fin d&apos;atelier,
          pas la dernière ligne.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 print:hidden">
          <a
            href={`/ateliers/${atelier.code}/tableau-de-bord`}
            className="text-amber-300 underline-offset-4 hover:underline"
          >
            La même chose en tableur
          </a>{" "}
          si vous préférez le remplir à l&apos;écran : le chiffre d&apos;affaires, l&apos;écart de
          prévision et le résultat cumulé s&apos;y calculent seuls.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-white/15 px-2 py-1.5 text-left font-semibold text-slate-300 print:border-black/40 print:text-black">
                  Équipe :
                </th>
                {dossier.tableauDeBord.tours.map((t) => (
                  <th
                    key={t}
                    className="w-24 border border-white/15 px-2 py-1.5 font-semibold text-slate-300 print:border-black/40 print:text-black"
                  >
                    Tour {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={dossier.tableauDeBord.tours.length + 1}
                  className="border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 print:border-black/40 print:bg-transparent print:text-black"
                >
                  Ce que nous décidons
                </td>
              </tr>
              {dossier.tableauDeBord.decisions.map((ligne) => (
                <tr key={ligne}>
                  <td className="border border-white/15 px-2 py-1.5 text-slate-300 print:border-black/40 print:text-black">
                    {ligne}
                  </td>
                  {dossier.tableauDeBord.tours.map((t) => (
                    <td key={t} className="h-7 border border-white/15 print:border-black/40" />
                  ))}
                </tr>
              ))}
              <tr>
                <td
                  colSpan={dossier.tableauDeBord.tours.length + 1}
                  className="border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 print:border-black/40 print:bg-transparent print:text-black"
                >
                  Ce que cela a donné
                </td>
              </tr>
              {dossier.tableauDeBord.resultats.map((ligne) => (
                <tr key={ligne}>
                  <td className="border border-white/15 px-2 py-1.5 text-slate-300 print:border-black/40 print:text-black">
                    {ligne}
                  </td>
                  {dossier.tableauDeBord.tours.map((t) => (
                    <td key={t} className="h-7 border border-white/15 print:border-black/40" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 break-inside-avoid border-t border-white/10 pt-6 print:border-black/20">
        <h2 className="text-xl font-bold text-slate-100 print:text-black">Comment vous êtes noté</h2>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-slate-300 print:text-black">
          {dossier.evaluationFinale.map((c) => (
            <li key={c}>· {c}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
