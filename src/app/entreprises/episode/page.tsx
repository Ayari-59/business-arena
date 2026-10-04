import type { Metadata } from "next";
import Link from "next/link";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { bouton } from "@/components/bouton";
import { EPISODES } from "@/pedagogy/episodes/registre";

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/episode" },
  title: "Épisodes manager",
  description:
    "Démonstration de la version pour les entreprises : un manager, un trimestre, six décisions, et un bilan qui sépare la qualité des décisions du hasard.",
  robots: { index: false, follow: false },
};

/**
 * LES ÉPISODES MANAGER.
 *
 * Chaque épisode est un domaine du métier de manager. La page les présente
 * côte à côte, par ce qu'ils font travailler, et mène à chacun.
 */
export default function EpisodesPage() {
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            <Link href="/entreprises" className="hover:text-slate-300">
              Entreprises
            </Link>{" "}
            / Épisodes manager
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Un trimestre dans la peau d&apos;un manager
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Six décisions, une vingtaine de minutes. À la fin, le bilan rejoue chacune de vos
            décisions sous trente tirages du même hasard, pour séparer ce qui relevait du choix de
            ce qui relevait de la chance. Démonstration : données fictives, rien n&apos;est
            enregistré.
          </p>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {EPISODES.map((ep) => (
              <li key={ep.code} className="carte flex flex-col gap-4 p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-300">
                    Épisode {ep.numero} · {ep.domaine}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-slate-50">
                    {ep.titre}
                  </h2>
                  <p className="mt-2 text-base leading-relaxed text-slate-300">{ep.resume}</p>
                </div>
                <p className="text-sm text-slate-400">
                  {ep.etapes.length} décisions · {ep.duree}
                </p>
                <Link
                  href={`/entreprises/episode/${ep.code}`}
                  className={`${bouton({ taille: "l" })} mt-auto self-start`}
                >
                  Jouer l&apos;épisode {ep.numero}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
