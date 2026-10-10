import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { CatalogueDesEpisodes } from "@/components/catalogue-des-episodes";
import { catalogueDesEpisodes, teinteDuSecteur } from "@/config/episodes/catalogue";
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
 * Chaque épisode est un domaine du métier de manager, dans l'entreprise d'un
 * secteur. Demande du propriétaire (octobre 2026) : « Arvel Distribution
 * découpé par thème, et les autres par métier ». La page range donc les
 * épisodes dans des TIROIRS fermés à l'arrivée (`CatalogueDesEpisodes`, le même
 * composant que la page des fiches enseignant) : un tiroir par thème pour le
 * négoce, qui porte près de la moitié des épisodes, un tiroir par métier pour
 * les autres, leurs familles en sous-titres. Un sommaire en tête ouvre le bon
 * tiroir ; les ancres de la page d'avant (`#secteur-…`, le code d'une famille)
 * mènent toujours au bon endroit, tiroir ouvert.
 *
 * PAS UN MUR D'ORANGE. Chacune des cartes portait un filet, un surtitre et un
 * bouton plein orange : avec plus de cent boutons primaires sur une page,
 * l'orange ne signalait plus rien. La carte entière est maintenant le lien ;
 * elle finit par « Jouer l'épisode N → » à l'encre d'action, qui ne devient un
 * aplat orange qu'au survol ou au focus. Son filet gauche prend la teinte du
 * secteur, lue de `SECTEURS` (la page en tenait une table à elle, restée sur
 * les emprunts du lot 5A : la santé, l'agroalimentaire et l'hôtellerie n'y
 * avaient pas la teinte du reste du site).
 */
export default function EpisodesPage() {
  const entreprises = catalogueDesEpisodes();
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
            {EPISODES.length} épisodes, chacun sur un domaine du métier, dans{" "}
            {entreprises.length} entreprises :{" "}
            {entreprises
              .map(
                ({ secteur: s }) =>
                  `${s.entreprise} (${s.nom.charAt(0).toLowerCase()}${s.nom.slice(1)})`,
              )
              .join(", ")}
            . Six décisions, une vingtaine de minutes, trois niveaux de difficulté. À la fin, le
            bilan rejoue chacune de vos décisions sous les mêmes trente tirages au hasard, pour
            séparer ce qui relevait du choix de ce qui relevait de la chance. Démonstration :
            données fictives ; vos choix sont gardés sur cet appareil pour construire votre profil
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
          <CatalogueDesEpisodes
            entreprises={entreprises}
            unite={{ un: "épisode", plusieurs: "épisodes" }}
            carte={(code, niveau) => {
              const ep = episodeParCode(code);
              if (!ep) return null;
              const secteur = entreprises.find((e) =>
                e.familles.some((f) => f.episodes.includes(code)),
              )?.secteur;
              return (
                <CarteEpisode
                  key={code}
                  ep={ep}
                  niveau={niveau}
                  teinte={secteur ? teinteDuSecteur(secteur) : "var(--filet-carte)"}
                />
              );
            }}
          />
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

function CarteEpisode({
  ep,
  teinte,
  niveau,
}: {
  ep: Episode;
  teinte: string;
  niveau: 3 | 4;
}) {
  // Le niveau du titre suit le rangement : sous un tiroir de thème (h2 de
  // l'entreprise) ou sous le sous-titre d'une famille (h3).
  const Titre = niveau === 3 ? "h3" : "h4";
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
          <Titre className="mt-2 text-xl font-semibold text-slate-50">{ep.titre}</Titre>
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
