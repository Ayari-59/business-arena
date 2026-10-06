import type { Metadata } from "next";
import Link from "next/link";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { bouton } from "@/components/bouton";
import { FAMILLES } from "@/config/episodes/familles";
import type { Episode } from "@/config/episodes/types";
import { EPISODES, episodeParCode } from "@/pedagogy/episodes/registre";

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
 * Chaque épisode est un domaine du métier de manager. La page les range par
 * famille (vendre, piloter les chiffres, les opérations, l'équipe, les
 * talents, le changement), avec en tête de quoi sauter à l'une d'elles.
 */
export default function EpisodesPage() {
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-annonce text-slate-400">
            <Link href="/entreprises" className="hover:text-slate-300">
              Entreprises
            </Link>{" "}
            / Épisodes manager
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Un trimestre dans la peau d&apos;un manager
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            {EPISODES.length} épisodes, chacun sur un domaine du métier. Six décisions, une
            vingtaine de minutes, trois niveaux de difficulté. À la fin, le bilan rejoue chacune de
            vos décisions sous trente tirages du même hasard, pour séparer ce qui relevait du choix
            de ce qui relevait de la chance. Démonstration : données fictives ; vos choix sont
            gardés sur cet appareil pour construire votre profil décisionnel.
          </p>
          <p className="mt-4">
            <Link
              href="/entreprises/episode/profil"
              className="text-sm font-semibold text-amber-300 underline-offset-2 hover:underline"
            >
              Mon profil décisionnel
            </Link>
          </p>
          <nav aria-label="Familles d'épisodes" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {FAMILLES.map((f) => (
                <li key={f.code}>
                  <a
                    href={`#${f.code}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3.5 py-1.5 text-sm text-slate-200 hover:border-amber-400/60 hover:text-slate-50"
                  >
                    {f.titre}
                    <span className="tabular-nums text-slate-400">{f.episodes.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {FAMILLES.map((f) => (
            <section
              key={f.code}
              id={f.code}
              aria-labelledby={`titre-${f.code}`}
              className="mt-14 scroll-mt-6"
            >
              <h2
                id={`titre-${f.code}`}
                className="font-display text-3xl font-semibold tracking-tight text-slate-50"
              >
                {f.titre}
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">{f.texte}</p>
              <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {f.episodes
                  .map((code) => episodeParCode(code))
                  .filter((ep): ep is Episode => ep !== undefined)
                  .map((ep) => (
                    <CarteEpisode key={ep.code} ep={ep} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

function CarteEpisode({ ep }: { ep: Episode }) {
  return (
    <li className="carte flex flex-col gap-4 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
          Épisode {ep.numero} · {ep.domaine}
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-slate-50">{ep.titre}</h3>
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
  );
}
