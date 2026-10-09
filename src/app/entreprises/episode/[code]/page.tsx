import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodeJoue } from "@/components/episode/episode-joue";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { EPISODES, episodeParCode } from "@/pedagogy/episodes/registre";
import { teinteDuMetierDeLEpisode } from "@/config/episodes/familles";

/** Les épisodes sont une donnée figée : leurs pages se rendent à la construction. */
export function generateStaticParams() {
  return EPISODES.map((e) => ({ code: e.code }));
}

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
    // Une démonstration dont le contenu attend d'être validé par des managers :
    // on la montre par un lien, on ne la fait pas trouver par un moteur.
    robots: { index: false, follow: false },
  };
}

/**
 * UN ÉPISODE DE DÉMONSTRATION DE LA VERSION POUR LES ENTREPRISES.
 *
 * Un manager, pas une entreprise simulée : on pilote un trimestre, et le
 * bilan juge les décisions plutôt que le résultat. Tout se joue dans le
 * navigateur ; seuls les faits de la partie terminée sont gardés, pour le
 * profil décisionnel de la personne.
 */
export default async function EpisodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!episodeParCode(code)) notFound();
  return (
    <>
      {/* LA TEINTE DU MÉTIER DE L'ÉPISODE (lot 5A) : `data-metier` publie
          `--metier`, que le filet de tête des cartes, le tableau de bord, la
          courbe des semaines et le bilan lisent. Un épisode sans famille
          déclarée garde l'encre de la donnée. */}
      <main id="main" data-metier={teinteDuMetierDeLEpisode(code)} className="relative overflow-x-clip">
        <HaloDePage />
        <EpisodeJoue code={code} />
      </main>
      <PiedDePage />
    </>
  );
}
