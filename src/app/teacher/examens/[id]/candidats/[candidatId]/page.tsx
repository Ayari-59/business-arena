import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { decisionsDuCandidat, type NotationGardee } from "@/services/examen.service";
import { formatEuro } from "@/lib/format";
import { IDENTIFICATIONS, phraseDuRecu } from "@/config/examen/textes";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { ReleveDesCompetences } from "@/components/examen/graphiques-de-l-examen";
import { referenceDeLaCopie } from "@/config/examen/grille";

export const metadata: Metadata = {
  title: "Décisions d'un candidat",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LES DÉCISIONS D'UN CANDIDAT, TOUR PAR TOUR, et le détail de sa note : ce que l'enseignant
 * relit pour expliquer une copie, ou pour la défendre devant un jury. Le créateur de
 * l'examen seul (le service filtre).
 */

const nombre = (v: number | undefined | null) => (v === undefined || v === null ? "—" : v.toLocaleString("fr-FR"));
const euros = (v: number | undefined | null) => (v === undefined || v === null ? "—" : formatEuro(Math.round(v)));

export default async function DecisionsDuCandidatPage({
  params,
}: {
  params: Promise<{ id: string; candidatId: string }>;
}) {
  const { id, candidatId } = await params;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const lu = await decisionsDuCandidat(session.userId, id, candidatId);
  if (!lu) notFound();
  const { examen, candidat, tours } = lu;
  const notation = (candidat.notation as NotationGardee | null) ?? null;
  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre={examen.nom}
        titre={candidat.nom}
        chapeau={
          <>
            {candidat.numeroEtudiant ? `N° ${candidat.numeroEtudiant} · ` : ""}
            {IDENTIFICATIONS[candidat.identification]} · tentative {candidat.tentative}
            {candidat.remisLe ? ` · ${phraseDuRecu(candidat.remisLe)}` : " · copie en cours"}
          </>
        }
      >
        <p className="mt-4 text-sm">
          <Link href={`/teacher/examens/${examen.id}`} className={LIEN_A_L_ENCRE}>
            Retour à l&apos;examen
          </Link>
        </p>
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {notation?.etat === "notee" ? (
          <section aria-labelledby="note-titre" className="carte grid gap-4 p-4 sm:p-6">
            <h2 id="note-titre" className="titre-carte text-slate-100">
              Note : <span className="tabular-nums">{notation.note.toLocaleString("fr-FR")}</span> sur 100
            </h2>
            <p className="text-sm text-slate-400" data-etalon-de-la-note={referenceDeLaCopie(notation).code}>
              Grille « {notation.grille.nom} », version {notation.grille.version}, notée contre{" "}
              {referenceDeLaCopie(notation).nom}. {referenceDeLaCopie(notation).definition}
            </p>
            <ul className="grid gap-1 text-sm">
              {notation.lignes.map((l) => (
                <li key={l.code} className="flex flex-wrap justify-between gap-x-4 border-t border-white/10 pt-1">
                  <span className="text-slate-200">
                    {l.libelle} <span className="text-xs text-slate-400">({l.detail})</span>
                  </span>
                  <span className="tabular-nums text-slate-100">
                    {l.points.toLocaleString("fr-FR")} / {l.max.toLocaleString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
            <ReleveDesCompetences competences={notation.competences} />
          </section>
        ) : notation?.etat === "sans-note" ? (
          <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300">{notation.message}</p>
        ) : null}

        <section aria-labelledby="decisions-titre" className="grid gap-3">
          <h2 id="decisions-titre" className="titre-carte text-slate-100">
            Les décisions, tour par tour
          </h2>
          {tours.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun tour joué pour l&apos;instant.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[40rem] text-left text-sm" data-decisions-du-candidat="">
                <thead className="text-xs text-slate-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Tour</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Prix</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Volume</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Marketing</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Emprunt</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Chiffre d&apos;affaires</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Résultat</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Trésorerie nette</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((t) => (
                    <tr key={t.tour} className="border-t border-white/10 tabular-nums">
                      <td className="px-3 py-2 text-slate-100">
                        {t.tour}
                        {t.reconduit ? <span className="block text-xs text-slate-400">reconduit</span> : null}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-200">{euros(t.decisions?.price)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">{nombre(t.decisions?.productionPlan)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">{euros(t.decisions?.marketingBudget)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">{euros(t.decisions?.finance?.newLoan ?? 0)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">{euros(t.chiffreDAffaires)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">{euros(t.resultat)}</td>
                      <td className="px-3 py-2 text-right text-slate-200">{euros(t.tresorerie)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tours.some((t) => t.justification) ? (
            <ul className="grid gap-2 text-sm text-slate-300">
              {tours
                .filter((t) => t.justification)
                .map((t) => (
                  <li key={t.tour}>
                    <span className="font-semibold text-slate-100">Tour {t.tour} :</span> {t.justification}
                  </li>
                ))}
            </ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}
