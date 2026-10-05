import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HaloDePage } from "@/components/halo-de-page";
import { lienDuDebrief } from "@/config/episodes/debrief";
import { PiedDePage } from "@/components/pied-de-page";
import { SEUIL_D_ANONYMAT } from "@/pedagogy/profil/cohorte";
import { vueDeLAnimateur } from "@/services/cohortes.service";

export const metadata: Metadata = {
  title: "Animer une cohorte",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const pct = (v: number) => `${Math.round(v * 100)} %`;

/**
 * LA VUE DE L'ANIMATEUR D'UNE COHORTE.
 *
 * Ouverte par une clé secrète, sans compte. Elle sert à préparer les débriefs :
 * où en est le groupe, quelles compétences il maîtrise, et comment ses choix se
 * sont répartis sur un épisode. Aucun nom, aucun profil individuel, et rien en
 * dessous de cinq personnes.
 */
export default async function AnimationPage({ params }: { params: Promise<{ cle: string }> }) {
  const { cle } = await params;
  const lue = await vueDeLAnimateur(cle);
  if (!lue) notFound();
  const { nom, code, vue } = lue;
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  const invitation = `${proto}://${hote}/entreprises/episode/rejoindre?code=${code}`;

  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <div className="mx-auto grid max-w-4xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <header className="grid gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Épisodes manager / Animation
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-50">
              Cohorte « {nom} »
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              {vue.membres} membre{vue.membres > 1 ? "s" : ""}, dont {vue.actifs} avec au moins un
              épisode qui compte · {vue.episodesJoues} épisode{vue.episodesJoues > 1 ? "s" : ""}{" "}
              joué{vue.episodesJoues > 1 ? "s" : ""} au total.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              Cette page ne montre ni nom ni profil individuel, et aucun chiffre en dessous de{" "}
              {SEUIL_D_ANONYMAT} personnes. Gardez son adresse pour vous : elle ouvre les agrégats
              de la cohorte à qui la détient.
            </p>
          </header>

          <section aria-labelledby="invitation-titre" className="carte grid gap-2 p-5">
            <h2 id="invitation-titre" className="text-lg font-bold text-slate-50">
              Le lien d&apos;invitation
            </h2>
            <p className="text-sm text-slate-300">
              À envoyer aux managers de la cohorte. Code : <span className="font-mono">{code}</span>
            </p>
            <p className="break-all font-mono text-sm text-amber-300">{invitation}</p>
          </section>

          {!vue.detail ? (
            <p className="max-w-2xl text-base text-slate-300" role="status">
              Moins de {SEUIL_D_ANONYMAT} membres : seuls les totaux ci-dessus s&apos;affichent.
              L&apos;avancement, les compétences et la répartition des choix apparaîtront à partir
              de {SEUIL_D_ANONYMAT} membres.
            </p>
          ) : (
            <>
              <section aria-labelledby="avancement-titre" className="grid gap-3">
                <h2
                  id="avancement-titre"
                  className="font-display text-2xl font-semibold tracking-tight text-slate-50"
                >
                  Avancement
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2 pr-3 font-medium">Épisodes qui comptent</th>
                        <th className="pb-2 text-right font-medium">Membres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vue.avancement!.map((a) => (
                        <tr key={a.episodes} className="border-t border-white/5">
                          <td className="py-2 pr-3 text-slate-200">
                            {a.episodes === 6 ? "6 et plus" : a.episodes}
                          </td>
                          <td className="py-2 text-right tabular-nums text-slate-200">
                            {a.membres}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-labelledby="competences-titre" className="grid gap-3">
                <h2
                  id="competences-titre"
                  className="font-display text-2xl font-semibold tracking-tight text-slate-50"
                >
                  Compétences du groupe
                </h2>
                <p className="max-w-2xl text-sm text-slate-400">
                  La moyenne des scores des membres qui en ont un ; elle n&apos;apparaît qu&apos;à
                  partir de {SEUIL_D_ANONYMAT} scores. C&apos;est un repère pour choisir le thème
                  d&apos;un débrief, pas une note du groupe.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2 pr-3 font-medium">Compétence</th>
                        <th className="pb-2 pr-3 text-right font-medium">Membres avec un score</th>
                        <th className="pb-2 text-right font-medium">Moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vue.competences.map((c) => (
                        <tr key={c.code} className="border-t border-white/5">
                          <td className="py-2 pr-3 text-slate-200">{c.nom}</td>
                          <td className="py-2 pr-3 text-right tabular-nums text-slate-300">
                            {c.membres}
                          </td>
                          <td className="py-2 text-right tabular-nums text-slate-200">
                            {c.moyenne == null ? "—" : `${c.moyenne}/100`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section aria-labelledby="episodes-titre" className="grid gap-3">
                <h2
                  id="episodes-titre"
                  className="font-display text-2xl font-semibold tracking-tight text-slate-50"
                >
                  Les choix du groupe, épisode par épisode
                </h2>
                <p className="max-w-2xl text-sm text-slate-400">
                  Les premières parties seulement, hors Découverte. La répartition s&apos;affiche à
                  partir de {SEUIL_D_ANONYMAT} joueurs. Pour un débrief, faites jouer tout le groupe
                  sous le même hasard avec le lien indiqué.
                </p>
                {vue.episodes.length === 0 && (
                  <p className="text-sm text-slate-300">Aucun épisode joué pour l&apos;instant.</p>
                )}
                <ul className="grid gap-3">
                  {vue.episodes.map((e) => (
                    <li key={e.code} className="carte p-4">
                      <details>
                        <summary className="cursor-pointer text-slate-100">
                          <span className="font-semibold">
                            {e.numero} · {e.titre}
                          </span>{" "}
                          <span className="text-sm text-slate-400">
                            · {e.joueurs} joueur{e.joueurs > 1 ? "s" : ""}
                          </span>
                        </summary>
                        <p className="mt-2 break-all text-sm text-slate-400">
                          Lien de débrief :{" "}
                          <span className="font-mono text-amber-300">{lienDuDebrief(e.code)}</span>
                        </p>
                        {e.decisions == null ? (
                          <p className="mt-2 text-sm text-slate-300">
                            Moins de {SEUIL_D_ANONYMAT} joueurs : la répartition des choix reste
                            cachée.
                          </p>
                        ) : (
                          <ol className="mt-3 grid gap-4">
                            {e.decisions.map((d) => (
                              <li key={d.d} className="grid gap-1.5">
                                <p className="text-sm font-semibold text-slate-100">
                                  D{d.d + 1} · {d.titre}{" "}
                                  <span className="font-normal text-slate-400">
                                    · {pct(d.bonnes)} de bons choix
                                  </span>
                                </p>
                                <ul className="grid gap-1">
                                  {d.options.map((o, k) => (
                                    <li
                                      key={k}
                                      className="grid grid-cols-[minmax(0,1fr)_7rem_3rem] items-center gap-3 text-sm"
                                    >
                                      <span className="text-slate-300">{o.texte}</span>
                                      <span className="h-2.5 overflow-hidden rounded bg-slate-800">
                                        <span
                                          className="block h-full rounded bg-slate-400"
                                          style={{ width: `${Math.round(o.part * 100)}%` }}
                                        />
                                      </span>
                                      <span className="text-right tabular-nums text-slate-200">
                                        {pct(o.part)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ol>
                        )}
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
