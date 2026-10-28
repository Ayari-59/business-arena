import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeJoue } from "@/components/episode/episode-joue";
import { PiedDePage } from "@/components/pied-de-page";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { FAMILLES, SECTEURS, teinteDuMetierDeLEpisode } from "@/config/episodes/familles";
import { EPISODES_DE_DEMO, licencePourLEpisode, MARQUE_DEMO } from "@/config/episodes/demos";
import {
  EPISODE_FERME_POUR_L_ELEVE,
  lienDuDevis,
  LIBELLE_DU_DEVIS,
  MARQUE_DES_EPISODES,
  OFFRES,
} from "@/config/tarifs";
import { getGuestUserId } from "@/lib/guest";
import { getSession } from "@/lib/session";
import { accesAuxEpisodes, niveauxDeLEpisode, suitUneCohorte } from "@/services/acces.service";
import { coursDeLEpisode } from "@/pedagogy/cours/suites";

/**
 * L'accès se lit à chaque ouverture (licence de la cohorte ou du compte) : la page se
 * rend à la demande, et non plus à la construction.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const ep = episodeParCode(code);
  if (!ep) return { title: "Épisode introuvable" };
  return {
    alternates: { canonical: `/entreprises/episode/${ep.code}` },
    title: ep.titre,
    description: `Démonstration de la version pour les entreprises · ${ep.domaine}. ${ep.resume}`,
    // Indexée (décision du propriétaire, octobre 2026 : « indexer ») : un épisode fermé
    // montre son titre, son accroche et son métier, et ce qui l'ouvre.
  };
}

/** Le métier d'un épisode : son secteur, lu des familles. */
function secteurDe(code: string) {
  const famille = FAMILLES.find((f) => f.episodes.includes(code));
  return famille ? SECTEURS.find((s) => s.code === famille.secteur) : undefined;
}

/**
 * UN ÉPISODE DE DÉMONSTRATION DE LA VERSION POUR LES ENTREPRISES.
 *
 * Un manager, pas une entreprise simulée : on pilote un trimestre, et le
 * bilan juge les décisions plutôt que le résultat. Tout se joue dans le
 * navigateur ; seuls les faits de la partie terminée sont gardés, pour le
 * profil décisionnel de la personne.
 *
 * L'OUVERTURE SE DÉCIDE ICI, CÔTÉ SERVEUR (services/acces.service.ts). Sans licence,
 * seuls les épisodes de démonstration se lancent, en Découverte ; les autres montrent
 * leur titre, leur accroche et leur métier, ce qui les ouvre, et les démonstrations.
 */
export default async function EpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ hasard?: string }>;
}) {
  const [{ code }, { hasard }] = await Promise.all([params, searchParams]);
  const ep = episodeParCode(code);
  if (!ep) notFound();
  const [userId, session] = await Promise.all([getGuestUserId(), getSession()]);
  const acces = await accesAuxEpisodes({ userId, sessionUserId: session?.userId });
  const niveaux = niveauxDeLEpisode(acces, code);
  // DEVANT UN ÉLÈVE, PAS DE VENTE (audit C-02) : qui suit une cohorte, ou arrive par le
  // lien de classe d'un enseignant (il porte le tirage, `?hasard=`), lit une phrase
  // neutre. Le visiteur qui parcourt le catalogue lit l'offre et le devis.
  const eleve = hasard !== undefined || (!session && (await suitUneCohorte(userId)));
  const offre = eleve
    ? null
    : {
        marque: MARQUE_DES_EPISODES,
        nom: OFFRES.episodes.nom,
        devis: lienDuDevis("episodes"),
        libelle: LIBELLE_DU_DEVIS,
      };
  return (
    <>
      {/* LA TEINTE DU MÉTIER DE L'ÉPISODE (lot 5A) : `data-metier` publie
          `--metier`, que le filet de tête des cartes, le tableau de bord, la
          courbe des semaines et le bilan lisent. Un épisode sans famille
          déclarée garde l'encre de la donnée. */}
      <main id="main" data-metier={teinteDuMetierDeLEpisode(code)} className="relative overflow-x-clip">
        {niveaux.length > 0 ? (
          <EpisodeJoue
            code={code}
            niveaux={niveaux}
            offre={acces.licence ? null : offre}
            licence={licencePourLEpisode(acces, code)}
            cours={coursDeLEpisode(code)}
          />
        ) : (
          <EpisodeFerme code={code} eleve={eleve} demosReglees={acces.demos ?? EPISODES_DE_DEMO} />
        )}
      </main>
      <PiedDePage />
    </>
  );
}

/**
 * Un épisode fermé sans licence épisodes : ce qu'il est, ce qui l'ouvre, et ce qui se joue
 * déjà. Devant un élève, une phrase neutre à la place de l'offre.
 */
function EpisodeFerme({
  code,
  eleve,
  demosReglees,
}: {
  code: string;
  eleve: boolean;
  /** Les démonstrations de la Découverte (/admin/offres). */
  demosReglees: readonly string[];
}) {
  const ep = episodeParCode(code)!;
  const secteur = secteurDe(code);
  const demos = demosReglees
    .filter((c) => episodeParCode(c))
    .map((c) => ({ ep: episodeParCode(c)!, secteur: secteurDe(c) }));
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12" data-episode-ferme={code}>
      <p className="text-xs uppercase tracking-annonce text-slate-400">
        <Link href="/entreprises/episode" className="hover:text-slate-300">
          Épisodes manager
        </Link>{" "}
        / {ep.numero}
      </p>
      <section className="carte mt-6 grid gap-4 p-5 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
          Épisode {ep.numero} · {ep.domaine}
          {secteur ? ` · ${secteur.nom}, ${secteur.entreprise}` : ""}
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          {ep.titre}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-300">{ep.resume}</p>
        {eleve ? (
          <p
            role="status"
            data-episode-ferme-eleve=""
            className="rounded-lg encadre-neutre px-4 py-3 text-base leading-relaxed text-slate-200"
          >
            {EPISODE_FERME_POUR_L_ELEVE}
          </p>
        ) : (
          <div
            role="status"
            className="rounded-lg encadre-neutre px-4 py-3 text-base leading-relaxed text-slate-200"
          >
            <p>
              <strong className="font-semibold text-slate-50">{MARQUE_DES_EPISODES}.</strong> Cet
              épisode est inclus dans l&apos;offre {OFFRES.episodes.nom}, qui se propose à part,
              sur devis. Sans elle, seuls les {demos.length} épisodes de démonstration
              se jouent, en Découverte.
            </p>
            <p className="mt-2">
              <Link
                href={lienDuDevis("episodes")}
                prefetch={false}
                className="font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {LIBELLE_DU_DEVIS}
              </Link>
            </p>
          </div>
        )}
      </section>
      <section aria-labelledby="demos-titre" className="mt-10">
        <h2 id="demos-titre" className="text-xl font-semibold text-slate-50">
          Les démonstrations gratuites
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {demos.map(({ ep: d, secteur: s }) => (
            <li key={d.code}>
              <Link
                href={`/entreprises/episode/${d.code}`}
                className="carte block p-4 hover:border-[var(--filet-carte)]"
              >
                <span className="text-sm text-slate-400">
                  {MARQUE_DEMO}
                  {s ? ` · ${s.nom}` : ""}
                </span>
                <span className="mt-1 block font-semibold text-amber-300">
                  {d.numero} · {d.titre}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
