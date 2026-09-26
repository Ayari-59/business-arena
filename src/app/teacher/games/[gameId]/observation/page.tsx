import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getObservationSeance, type ObservationTour } from "@/services/observation.service";
import { Tiroir } from "@/components/tiroir";
import { EnTeteEnseignant } from "@/components/en-tete-enseignant";

export const dynamic = "force-dynamic";

/**
 * OBSERVATION DE SÉANCE — où les élèves calent.
 *
 * Le tableau de bord d'une partie répond « qui gagne ». Cette page-ci sert la
 * première fois qu'on lâche le jeu devant une classe, quand la question n'est
 * pas le classement mais : est-ce qu'ils jouent, combien de temps ça leur
 * coûte, et à quel tour ils lâchent.
 *
 * Elle se lit en comparant PLUSIEURS classes sur le même dispositif. Une classe
 * qui décroche au tour 3 est une classe ; trois classes qui décrochent au tour
 * 3, c'est le produit.
 */

/** Une part sur un total, en pourcentage entier. 0 % quand le total est nul. */
const part = (n: number, total: number) => (total > 0 ? Math.round((100 * n) / total) : 0);

/** Le seuil à partir duquel « cliqué sans décider » cesse d'être anecdotique. */
const SEUIL_ALERTE_DEFAUT = 25;

function Tuile({
  label,
  valeur,
  note,
  couleur = "text-slate-100",
}: {
  label: string;
  valeur: string;
  note: string;
  couleur?: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2.5">
      <p className="text-xs uppercase leading-4 tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${couleur}`}>{valeur}</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-400">{note}</p>
    </div>
  );
}

/** La participation d'un tour, en barre : le décrochage se voit, il ne se lit pas. */
function Barre({ tour, equipes }: { tour: ObservationTour; equipes: number }) {
  const pct = part(tour.validees, equipes);
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs tabular-nums text-slate-400">Tour {tour.index}</span>
      <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">
        {/* Un tour encore ouvert reçoit des décisions : sa barre est pâle, elle
            n'est pas finie. Un point médian en bout de ligne ne se voyait pas. */}
        <span
          className={`block h-full rounded-full ${tour.clos ? "bg-amber-400/70" : "bg-amber-400/25"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-300">
        {tour.validees}/{equipes}
      </span>
    </div>
  );
}

export default async function ObservationPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const seance = await getObservationSeance(gameId, session.userId);
  if (!seance) notFound();

  const { equipesHumaines: equipes, tours } = seance;
  const clos = tours.filter((t) => t.clos);
  const dernier = clos[clos.length - 1];

  // L'engagement se mesure sur TOUS les tours clos, pas sur le dernier : une
  // équipe peut cliquer un tour et décider le suivant.
  const valideesClos = clos.reduce((s, t) => s + t.validees, 0);
  const defautClos = clos.reduce((s, t) => s + t.parDefaut, 0);
  const pctDefaut = part(defautClos, valideesClos);

  const minutes = clos.map((t) => t.minutesMedianes).filter((m): m is number => m !== null);
  const minutesTypiques = minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : null;

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-8 px-4 pt-6 pb-16 sm:p-6">
      <EnTeteEnseignant
        surtitre="Observation de séance"
        titre={seance.scenario}
        description="Pas le classement : ce que la séance a réellement produit. Combien d'équipes jouent encore, combien décident vraiment, et ce qu'un tour leur coûte en minutes."
        droite={
          <>
            <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {seance.classe ?? "sans classe"}
            </p>
            <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
              {equipes} équipe{equipes > 1 ? "s" : ""}
            </p>
            <Link
              href={`/teacher/games/${gameId}`}
              className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 transition hover:bg-amber-400/20"
            >
              ← Retour à la partie
            </Link>
          </>
        }
      />

      {clos.length === 0 ? (
        <p className="rounded-lg border border-white/5 bg-slate-950 px-3 py-4 text-sm text-slate-400">
          Aucun tour n&apos;est encore clos. Ces mesures apparaîtront dès la première
          clôture — elles se lisent sur des tours terminés, jamais sur un tour en cours.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tuile
              label="Jouent encore"
              valeur={`${dernier!.validees}/${equipes}`}
              note={`au tour ${dernier!.index}, le dernier clos`}
              couleur={
                part(dernier!.validees, equipes) < 60 ? "text-red-400" : "text-slate-100"
              }
            />
            <Tuile
              label="Ont cliqué sans décider"
              valeur={`${pctDefaut} %`}
              note="prix ET volume laissés tels quels"
              couleur={pctDefaut >= SEUIL_ALERTE_DEFAUT ? "text-amber-400" : "text-emerald-400"}
            />
            <Tuile
              label="Un tour leur coûte"
              valeur={minutesTypiques === null ? "—" : `${minutesTypiques} min`}
              note="médiane, de l'ouverture à la validation"
            />
          </section>

          {seance.decrochage ? (
            <p className="rounded-lg border border-white/10 border-l-2 border-l-amber-400/70 bg-slate-900 px-3 py-2.5 text-sm leading-snug text-slate-300">
              <span className="text-amber-300">Décrochage au tour {seance.decrochage.tour}</span>{" "}
              : {seance.decrochage.equipesPerdues} équipe
              {seance.decrochage.equipesPerdues > 1 ? "s" : ""} de moins qu&apos;au tour
              précédent. C&apos;est là qu&apos;il faut regarder ce que l&apos;écran demandait.
            </p>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Participation, tour par tour
            </h2>
            <div className="space-y-1.5">
              {tours.map((t) => (
                <Barre key={t.index} tour={t} equipes={equipes} />
              ))}
            </div>
            {tours.some((t) => !t.clos) ? (
              <p className="text-xs text-slate-400">
                Les barres pâles sont des tours non clos : ils reçoivent encore des
                décisions.
              </p>
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Le détail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-1 pr-3 font-medium">Tour</th>
                    <th className="pb-1 pr-3 text-right font-medium">Validé</th>
                    <th className="pb-1 pr-3 text-right font-medium">Défaut</th>
                    <th className="pb-1 pr-3 text-right font-medium">Repris</th>
                    <th className="pb-1 pr-3 text-right font-medium">Justif.</th>
                    <th className="pb-1 pr-3 text-right font-medium">Prév.</th>
                    <th className="pb-1 text-right font-medium">Min</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {tours.map((t) => (
                    <tr key={t.index} className="border-t border-white/5">
                      <td className="whitespace-nowrap py-1.5 pr-3 text-slate-100">
                        {t.index}
                        {t.clos ? "" : <span className="ml-1 text-xs text-slate-400">en cours</span>}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{t.validees}</td>
                      <td
                        className={`py-1.5 pr-3 text-right tabular-nums ${
                          t.parDefaut > 0 ? "text-amber-400" : ""
                        }`}
                      >
                        {t.parDefaut}
                      </td>
                      <td
                        className={`py-1.5 pr-3 text-right tabular-nums ${
                          t.reconduites > 0 ? "text-red-400" : ""
                        }`}
                      >
                        {t.reconduites}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{t.sansJustification}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{t.avecPrevision}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {t.minutesMedianes === null ? "—" : t.minutesMedianes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Tiroir titre="Comment lire ces chiffres" quoi="4 repères">
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            <strong className="text-slate-100">Par défaut</strong> est la mesure la plus dure
            du lot. Le prix et le volume arrivent pré-remplis : une équipe qui valide sans y
            toucher n&apos;a pas décidé, elle a cliqué. Au-delà d&apos;un quart des décisions,
            l&apos;arène occupe la classe au lieu de lui apprendre quelque chose — et le
            classement, lui, ne le dira jamais.
          </p>
          <p>
            <strong className="text-slate-100">Reconduit</strong> compte les équipes qui
            n&apos;ont rien validé du tout : la clôture a repris leur tour précédent. C&apos;est
            l&apos;abandon pur, à distinguer du clic.
          </p>
          <p>
            <strong className="text-slate-100">Minutes</strong> est une médiane, pas une
            moyenne : une seule équipe qui finit chez elle le soir décalerait une moyenne de
            classe. Le premier tour coûte toujours plus cher que les suivants — c&apos;est le
            prix de la mise en route, et c&apos;est lui qu&apos;il faut comparer d&apos;une
            classe à l&apos;autre.
          </p>
          <p>
            <strong className="text-slate-100">Une classe ne prouve rien.</strong> Faites jouer
            le même dispositif à trois classes sans rien changer entre elles. Si deux sur trois
            calent au même tour, c&apos;est le produit ; si une seule cale, c&apos;est cette
            classe-là. Corriger entre deux séances, c&apos;est se retrouver avec trois produits
            différents et aucune donnée.
          </p>
        </div>
      </Tiroir>
    </main>
  );
}
