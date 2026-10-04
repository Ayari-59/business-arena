import type { Metadata } from "next";
import { EpisodeTrimestre } from "@/components/episode/episode-trimestre";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/episode" },
  title: "Le trimestre qui dérape",
  description:
    "Démonstration de la version pour les entreprises : une cheffe d'agence, un trimestre, six décisions, et un bilan qui sépare la qualité des décisions du hasard.",
  // Une démonstration dont le contenu attend d'être validé par des managers :
  // on la montre par un lien, on ne la fait pas trouver par un moteur.
  robots: { index: false, follow: false },
};

/**
 * L'ÉPISODE DE DÉMONSTRATION DE LA VERSION POUR LES ENTREPRISES.
 *
 * Un manager, pas une entreprise simulée : Claire pilote une agence
 * commerciale pendant un trimestre, et le bilan juge ses décisions plutôt que
 * son résultat. Tout se joue dans le navigateur ; rien n'est enregistré.
 */
export default function EpisodePage() {
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <EpisodeTrimestre />
      </main>
      <PiedDePage />
    </>
  );
}
