import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { revoirLEssai } from "@/services/tour-d-essai.service";
import { compter, formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";

export const dynamic = "force-dynamic";

/**
 * REVOIR LE TOUR D'ESSAI, POUR LE DÉBRIEF.
 *
 * L'essai est parti dans son archive à la bascule (services/tour-d-essai.service.ts) :
 * il ne compte nulle part, ni au classement, ni au relevé, ni au profil des élèves. Il
 * reste ici, pour l'animateur seul, tel qu'il a été joué : les prix et les volumes
 * décidés, ce que le marché en a fait, et le classement de l'essai. C'est la matière
 * du « qu'est-ce qui s'est passé ? » avant la vraie partie.
 */
export default async function RevoirLEssaiPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const { gameId } = await params;
  const essai = await revoirLEssai({ gameId, teacherId: session.userId });
  if (!essai) notFound();

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Tour d'essai · ne compte pas"
        titre="Revoir le tour d'essai"
        chapeau="Ce que les équipes ont décidé pendant l'essai, et ce que le marché en a fait. Rien de tout cela ne compte : la vraie partie est repartie de zéro."
      >
        <NavigationEnseignant className="mt-6" actif="parties" />
        <p className="mt-4 text-sm">
          <Link href={`/teacher/games/${gameId}`} className={LIEN_A_L_ENCRE}>
            Retour à la partie
          </Link>
        </p>
      </EnTeteDePage>

      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {essai.tours.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-sm text-slate-300">
            Aucun tour d&apos;essai n&apos;a été clos avant le début de la vraie partie : il n&apos;y a
            rien à revoir.
          </p>
        ) : null}

        {essai.tours.map((tour) => (
          <section key={tour.index} aria-labelledby={`essai-tour-${tour.index}`} className="space-y-3">
            <div id={`essai-tour-${tour.index}`}>
              <Rubrique note={compter(tour.equipes.length, "entreprise")}>
                Tour d&apos;essai {tour.index}
              </Rubrique>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/10" data-essai-tour={tour.index}>
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Équipe</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Prix</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Volume</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Chiffre d&apos;affaires</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Résultat</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Trésorerie</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Part de marché</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  {tour.equipes.map((e) => (
                    <tr key={e.nom} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-100">{e.nom}</span>
                        {e.bot ? <span className="ml-2 text-xs text-slate-400"> concurrent</span> : null}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {e.prix === null ? "—" : formatEuro(e.prix)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {e.volume === null ? "—" : formatUnits(e.volume)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatEuro(e.chiffreDAffaires)}</td>
                      <td
                        className={`px-3 py-2 text-right font-semibold tabular-nums ${
                          e.resultatNet > 0 ? "text-emerald-300" : e.resultatNet < 0 ? "text-red-300" : ""
                        }`}
                      >
                        {`${e.resultatNet > 0 ? "+" : ""}${formatEuro(e.resultatNet)}`}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums ${e.tresorerie < 0 ? "text-red-300" : ""}`}>
                        {formatEuro(e.tresorerie)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPercent(e.partDeMarche)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {essai.classement.length > 0 && essai.tours.length > 0 ? (
          <section aria-labelledby="essai-classement" className="space-y-3">
            <div id="essai-classement">
              <Rubrique note="pour le débrief, il ne compte pas">Classement de l&apos;essai</Rubrique>
            </div>
            <ol className="carte divide-y divide-white/10" data-classement-de-l-essai="">
              {essai.classement.map((c) => (
                <li key={c.nom} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-slate-100">
                    <span className="mr-2 tabular-nums text-slate-400">{c.rang}</span>{" "}
                    {c.nom}
                    {c.bot ? <span className="ml-2 text-xs text-slate-400">concurrent</span> : null}
                  </span>
                  <span className="tabular-nums text-slate-300">IPG {c.ipg.toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
