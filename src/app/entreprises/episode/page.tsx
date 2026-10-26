import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { CatalogueDesEpisodes } from "@/components/catalogue-des-episodes";
import { catalogueDesEpisodes, teinteDuSecteur } from "@/config/episodes/catalogue";
import type { Episode } from "@/config/episodes/types";
import { EPISODES, episodeParCode } from "@/pedagogy/episodes/registre";
import {
  MARQUE_DEMO,
  NIVEAU_DES_DEMOS,
} from "@/config/episodes/demos";
import { MARQUE_DES_EPISODES, OFFRES } from "@/config/tarifs";
import { niveauParCode } from "@/config/episodes/niveaux";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import { getGuestUserId } from "@/lib/guest";
import { getSession } from "@/lib/session";
import { accesAuxEpisodes, estUneDemoPour, licencePourLEpisode } from "@/services/acces.service";

/** Ce qui se lance dépend de la licence de qui regarde : la page se rend à la demande. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/episode" },
  title: "Épisodes manager",
  description:
    "Démonstration de la version pour les entreprises : un manager, un trimestre, six décisions, et un bilan qui sépare la qualité des décisions du hasard.",
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
 *
 * SANS LICENCE (décision d'octobre 2026, config/episodes/demos.ts) : les épisodes de
 * démonstration, un par métier, se lancent en Découverte ; ils sont regroupés en tête
 * (« Démos gratuites ») et marqués dans leurs tiroirs. Les autres restent visibles,
 * avec leur titre, leur accroche et leur métier, marqués du nom de l'offre (config/tarifs.ts) et sans
 * lien de jeu : la carte mène aux tarifs. La page de l'épisode refuse de même.
 *
 * MEMBRE D'UNE COHORTE D'ENSEIGNANT : la licence ne vaut que pour les épisodes de la
 * cohorte. Ils se jouent comme sous licence et sont regroupés en tête (« Les épisodes
 * de votre cohorte ») ; les autres suivent la règle sans licence.
 */
export default async function EpisodesPage() {
  const entreprises = catalogueDesEpisodes();
  const [userId, session] = await Promise.all([getGuestUserId(), getSession()]);
  const acces = await accesAuxEpisodes({ userId, sessionUserId: session?.userId });
  // Tout est ouvert : une licence de compte ou d'une cohorte sans liste d'épisodes.
  const licence = acces.licence && !acces.episodes;
  const sousLicence = (code: string) => licencePourLEpisode(acces, code);
  // Les démonstrations de la Découverte, réglées dans /admin/offres, et leur niveau.
  const demos = acces.demos ?? [];
  const niveauDesDemos = niveauParCode(acces.niveauDesDemos ?? NIVEAU_DES_DEMOS).nom;
  const secteurDe = (code: string) =>
    entreprises.find((e) => e.familles.some((f) => f.episodes.includes(code)))?.secteur;
  const unParMetier =
    demos.length === entreprises.length && new Set(demos.map((c) => secteurDe(c)?.code)).size === demos.length;
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
          {acces.episodes ? (
            <section
              aria-labelledby="episodes-de-la-cohorte"
              data-episodes-de-la-cohorte=""
              className="mt-10 rounded-xl border border-[var(--filet-carte)] p-4 sm:p-6"
            >
              <h2
                id="episodes-de-la-cohorte"
                className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl"
              >
                Les épisodes de votre cohorte
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">
                Ceux que votre enseignant a choisis, à jouer à tous les niveaux.
              </p>
              <ul className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {acces.episodes.map((code) => {
                  const ep = episodeParCode(code);
                  if (!ep) return null;
                  const secteur = secteurDe(code);
                  return (
                    <CarteEpisode
                      key={code}
                      ep={ep}
                      niveau={3}
                      teinte={secteur ? teinteDuSecteur(secteur) : "var(--filet-carte)"}
                      niveauDesDemos={niveauDesDemos}
                      metier={secteur ? `${secteur.nom} · ${secteur.entreprise}` : null}
                    />
                  );
                })}
              </ul>
            </section>
          ) : null}
          {licence || demos.length === 0 ? null : (
            <section
              aria-labelledby="demos-gratuites"
              data-demos-gratuites=""
              className="mt-10 rounded-xl border border-[var(--filet-carte)] p-4 sm:p-6"
            >
              <h2
                id="demos-gratuites"
                className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl"
              >
                Démos gratuites
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">
                {unParMetier ? "Un épisode par métier," : demos.length > 1 ? "Des épisodes" : "Un épisode"} à jouer sans licence, au niveau{" "}
                {niveauDesDemos}. Les autres épisodes, et les niveaux Standard
                et Expert, sont inclus dans l&apos;offre {OFFRES.episodes.nom}, sur devis.{" "}
                <Link
                  href={LIEN_TARIFS}
                prefetch={false}
                  className="font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Voir les offres
                </Link>
              </p>
              <ul className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {demos.map((code) => {
                  const ep = episodeParCode(code);
                  if (!ep) return null;
                  const secteur = secteurDe(code);
                  return (
                    <CarteEpisode
                      key={code}
                      ep={ep}
                      niveau={3}
                      teinte={secteur ? teinteDuSecteur(secteur) : "var(--filet-carte)"}
                      demo
                      niveauDesDemos={niveauDesDemos}
                      metier={secteur ? `${secteur.nom} · ${secteur.entreprise}` : null}
                    />
                  );
                })}
              </ul>
            </section>
          )}
          <CatalogueDesEpisodes
            entreprises={entreprises}
            unite={{ un: "épisode", plusieurs: "épisodes" }}
            carte={(code, niveau) => {
              const ep = episodeParCode(code);
              if (!ep) return null;
              const secteur = secteurDe(code);
              const teinte = secteur ? teinteDuSecteur(secteur) : "var(--filet-carte)";
              return sousLicence(code) || estUneDemoPour(acces, code) ? (
                <CarteEpisode
                  key={code}
                  ep={ep}
                  niveau={niveau}
                  teinte={teinte}
                  demo={!sousLicence(code)}
                  niveauDesDemos={niveauDesDemos}
                />
              ) : (
                <CarteFermee
                  key={code}
                  ep={ep}
                  niveau={niveau}
                  teinte={teinte}
                  metier={secteur ? `${secteur.nom} · ${secteur.entreprise}` : null}
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
  demo = false,
  niveauDesDemos,
  metier = null,
}: {
  ep: Episode;
  /** Le niveau où se jouent les démonstrations (réglage de la Découverte). */
  niveauDesDemos: string;
  teinte: string;
  niveau: 3 | 4;
  /** Sans licence : une démonstration, marquée, qui se joue en Découverte. */
  demo?: boolean;
  /** Le métier et l'entreprise, quand la carte est hors de son tiroir (les démos en tête). */
  metier?: string | null;
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
          {demo ? (
            <p className="mb-2">
              <span
                data-marque-demo=""
                className="inline-block rounded-full border border-slate-500 px-2.5 py-0.5 text-sm font-semibold text-slate-100"
              >
                {MARQUE_DEMO}
              </span>
            </p>
          ) : null}
          <p className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
            Épisode {ep.numero} · {ep.domaine}
          </p>
          <Titre className="mt-2 text-xl font-semibold text-slate-50">{ep.titre}</Titre>
          {metier ? <p className="mt-1 text-sm text-slate-400">{metier}</p> : null}
          <p className="mt-2 text-base leading-relaxed text-slate-300">{ep.resume}</p>
        </div>
        <p className="text-sm text-slate-400">
          {ep.etapes.length} décisions · {ep.duree}
          {demo ? ` · en ${niveauDesDemos}` : ""}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-lg py-1.5 text-sm font-semibold text-amber-300 transition group-hover:bg-[var(--accent-plein)] group-hover:px-3 group-hover:text-[var(--accent-plein-texte)] group-focus-visible:bg-[var(--accent-plein)] group-focus-visible:px-3 group-focus-visible:text-[var(--accent-plein-texte)]">
          Jouer l&apos;épisode {ep.numero}
          <span aria-hidden>→</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * UN ÉPISODE FERMÉ SANS LICENCE : visible (titre, accroche, métier), marqué « Offre
 * Entreprise », non lançable. La carte n'est pas un lien de jeu ; son seul lien mène
 * aux tarifs.
 */
function CarteFermee({
  ep,
  teinte,
  niveau,
  metier,
}: {
  ep: Episode;
  teinte: string;
  niveau: 3 | 4;
  metier: string | null;
}) {
  const Titre = niveau === 3 ? "h3" : "h4";
  return (
    <li className="flex">
      <div
        data-episode-ferme={ep.code}
        className="carte flex w-full flex-col gap-4 p-6"
        style={{ borderLeftColor: teinte }}
      >
        <div>
          <p className="mb-2">
            <span
              data-marque-offre=""
              className="inline-block rounded-full border border-white/15 px-2.5 py-0.5 text-sm text-slate-300"
            >
              {MARQUE_DES_EPISODES}
            </span>
          </p>
          <p className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
            Épisode {ep.numero} · {ep.domaine}
          </p>
          <Titre className="mt-2 text-xl font-semibold text-slate-50">{ep.titre}</Titre>
          {metier ? <p className="mt-1 text-sm text-slate-400">{metier}</p> : null}
          <p className="mt-2 text-base leading-relaxed text-slate-300">{ep.resume}</p>
        </div>
        <Link
          href={LIEN_TARIFS}
                prefetch={false}
          className="mt-auto self-start text-sm font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Voir les offres
          <span className="sr-only"> pour l&apos;épisode {ep.numero}</span>
        </Link>
      </div>
    </li>
  );
}
