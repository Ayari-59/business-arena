import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { RepliableSurTelephone } from "@/components/repliable-sur-telephone";
import { famillesDuSecteur, secteursJoues, type Famille } from "@/config/episodes/familles";
import type { Episode } from "@/config/episodes/types";
import { EPISODES, episodeParCode } from "@/pedagogy/episodes/registre";

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/episode" },
  title: "Épisodes manager",
  description:
    "Démonstration de la version pour les entreprises : un manager, un trimestre, six décisions, et un bilan qui sépare la qualité des décisions des aléas.",
  robots: { index: false, follow: false },
};

/**
 * LES ÉPISODES MANAGER.
 *
 * Chaque épisode est un domaine du métier de manager, dans l'entreprise d'un
 * secteur. La page les range par secteur, puis par famille (vendre, piloter
 * les chiffres, les opérations, l'équipe…), avec en tête un sommaire par
 * secteur pour sauter à l'une d'elles. Les ancres des familles ne changent pas.
 *
 * PAS UN MUR D'ORANGE. Chacune des cartes portait un filet, un surtitre et un
 * bouton plein orange : avec plus de cent boutons primaires sur une page,
 * l'orange ne signalait plus rien. La carte entière est maintenant le lien ;
 * elle finit par « Jouer l'épisode N → » à l'encre d'action, qui ne devient un
 * aplat orange qu'au survol ou au focus. Son filet gauche prend la teinte du
 * secteur. Sur téléphone, chaque famille se replie derrière son titre : la
 * page faisait 46 700 px de haut, le sommaire mène à la famille voulue.
 */

/** La teinte de chaque secteur d'épisodes, parmi celles des métiers. */
const TEINTE_DU_SECTEUR: Record<string, string> = {
  negoce: "var(--secteur-commerce)",
  hotellerie: "var(--secteur-hotellerie)",
  conseil: "var(--secteur-services)",
  sante: "var(--secteur-transport)",
  agroalimentaire: "var(--secteur-industrie)",
};
export default function EpisodesPage() {
  const secteurs = secteursJoues();
  const nombre = (familles: readonly Famille[]) =>
    familles.reduce((n, f) => n + f.episodes.length, 0);
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
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
            {EPISODES.length} épisodes, chacun sur un domaine du métier, rangés par secteur :{" "}
            {secteurs
              .map((s) => `${s.nom.charAt(0).toLowerCase()}${s.nom.slice(1)} (${s.entreprise})`)
              .join(", ")}
            . Six décisions, une vingtaine de minutes, trois niveaux de difficulté. À la fin, le
            bilan rejoue chacune de vos décisions sous trente tirages des mêmes aléas, pour séparer
            ce qui relevait du choix de ce qui relevait de la chance. Démonstration : données
            fictives ; vos choix sont gardés sur cet appareil pour construire votre profil
            décisionnel.
          </p>
          <p className="mt-4">
            <Link
              href="/entreprises/episode/profil"
              className="text-sm font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              Mon profil décisionnel
            </Link>
          </p>
          <nav aria-label="Secteurs et familles d'épisodes" className="mt-8">
            <ul className="grid gap-6 lg:grid-cols-2">
              {secteurs.map((s) => {
                const familles = famillesDuSecteur(s.code);
                return (
                  <li key={s.code}>
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <a
                        href={`#secteur-${s.code}`}
                        className="font-semibold text-slate-100 hover:text-amber-300"
                      >
                        {s.nom}
                      </a>
                      <span className="text-sm text-slate-400">
                        {s.entreprise} · <span className="tabular-nums">{nombre(familles)}</span>{" "}
                        épisodes
                      </span>
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {familles.map((f) => (
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
                  </li>
                );
              })}
            </ul>
          </nav>
          {secteurs.map((s) => (
            <section
              key={s.code}
              id={`secteur-${s.code}`}
              aria-labelledby={`titre-secteur-${s.code}`}
              className="mt-16 scroll-mt-6"
            >
              <h2
                id={`titre-secteur-${s.code}`}
                className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl"
              >
                {s.nom}
              </h2>
              <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-400">{s.texte}</p>
              {famillesDuSecteur(s.code).map((f) => (
                <section
                  key={f.code}
                  id={f.code}
                  aria-labelledby={`titre-${f.code}`}
                  className="mt-12 scroll-mt-6"
                >
                  <h3
                    id={`titre-${f.code}`}
                    className="text-2xl font-semibold tracking-tight text-slate-50"
                  >
                    {f.titre}
                  </h3>
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">
                    {f.texte}
                  </p>
                  <RepliableSurTelephone
                    resume={`Voir les ${f.episodes.length} épisodes`}
                    className="mt-4 sm:mt-0"
                  >
                    <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {f.episodes
                        .map((code) => episodeParCode(code))
                        .filter((ep): ep is Episode => ep !== undefined)
                        .map((ep) => (
                          <CarteEpisode
                            key={ep.code}
                            ep={ep}
                            teinte={TEINTE_DU_SECTEUR[s.code] ?? "var(--filet-carte)"}
                          />
                        ))}
                    </ul>
                  </RepliableSurTelephone>
                </section>
              ))}
            </section>
          ))}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

function CarteEpisode({ ep, teinte }: { ep: Episode; teinte: string }) {
  return (
    <li className="flex">
      <Link
        href={`/entreprises/episode/${ep.code}`}
        className="carte group flex w-full flex-col gap-4 p-6 hover:border-[var(--filet-carte)] focus-visible:outline-offset-4"
        style={{ borderLeftColor: teinte }}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
            Épisode {ep.numero} · {ep.domaine}
          </p>
          <h4 className="mt-2 text-xl font-semibold text-slate-50">{ep.titre}</h4>
          <p className="mt-2 text-base leading-relaxed text-slate-300">{ep.resume}</p>
        </div>
        <p className="text-sm text-slate-400">
          {ep.etapes.length} décisions · {ep.duree}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-lg py-1.5 text-sm font-semibold text-amber-300 transition group-hover:bg-[var(--accent-plein)] group-hover:px-3 group-hover:text-[var(--accent-plein-texte)] group-focus-visible:bg-[var(--accent-plein)] group-focus-visible:px-3 group-focus-visible:text-[var(--accent-plein-texte)]">
          Jouer l&apos;épisode {ep.numero}
          <span aria-hidden>→</span>
        </span>
      </Link>
    </li>
  );
}
