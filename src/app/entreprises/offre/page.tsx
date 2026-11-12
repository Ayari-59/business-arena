import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { OffreDesEntreprises } from "@/components/offre-des-entreprises";
import { variablesDuCatalogue } from "@/config/tarifs";
import { vueDesTarifs } from "@/config/catalogue";
import { SEMAINES_DU_PARCOURS } from "@/config/episodes/parcours-en-cohorte";
import { lireLEtatDuCatalogue } from "@/services/catalogue.service";

/**
 * LA PAGE COMMERCIALE DES ENTREPRISES ET DES ORGANISMES DE FORMATION (audit de l'offre, octobre 2026, P1-9 :
 * la proposition aux entreprises n'était lisible qu'en bas de /tarifs). La page lit les formules au
 * catalogue (/admin/offres), comme /tarifs : jamais une copie qui dériverait. Le rendu, avec le déroulé,
 * l'espace des animateurs et ce qui distingue les formules (audit de l'offre du 11 novembre 2026, P1-4),
 * vit dans components/offre-des-entreprises.tsx. Sans prix (tout se chiffre au devis) ; elle n'affirme
 * aucune certification et ne dit rien du financement : aucun n'est établi aujourd'hui.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/offre" },
  title: "Épisodes manager pour les entreprises",
  description: `Les épisodes manager pour une entreprise ou un organisme de formation : un déroulé de ${SEMAINES_DU_PARCOURS} semaines en cohorte, des animateurs dans l'espace enseignant, parcours en autonomie, cohorte animée, guide de débrief. Sur devis.`,
};

async function OffreEntreprisesPage() {
  const { catalogue, decouverte, affichage } = await lireLEtatDuCatalogue();
  const vue = vueDesTarifs(catalogue, variablesDuCatalogue(decouverte), { prix: affichage.prixPublics });
  const colonnes = vue.episodes?.colonnes.filter((c) => c.public === "entreprises") ?? [];
  return <OffreDesEntreprises colonnes={colonnes} tarif={vue.episodes?.tarif ?? null} />;
}

export default avecTypographie(OffreEntreprisesPage);
