import type { Metadata } from "next";
import { PageDesTarifs } from "@/components/page-des-tarifs";
import { descriptionDesTarifs, variablesDuCatalogue } from "@/config/tarifs";
import { vueDesTarifs } from "@/config/catalogue";
import { bandeauDeLaPromotion, lireLEtatDuCatalogue } from "@/services/catalogue.service";

/**
 * LES OFFRES (ET LEURS TARIFS, SI L'ADMIN LES AFFICHE), LUES AU CATALOGUE (/admin/offres).
 *
 * Décision du propriétaire (octobre 2026) : « J'aimerais retirer les prix. Les offres se
 * font sur mesure et aboutissent à une demande de devis. » Par défaut, la page ne reçoit
 * aucun montant (`vueDesTarifs(…, { prix: false })`) : elle présente les offres, ce
 * qu'elles incluent, et « Demander un devis ». Le réglage « Afficher les prix sur le
 * site » de /admin/offres remet la grille chiffrée d'avant, à l'identique.
 *
 * La page publie le catalogue en base, mis en cache et revalidé à chaque enregistrement
 * dans /admin/offres ; une base vide rend la grille par défaut de config/tarifs.ts. Le
 * rendu vit dans components/page-des-tarifs.tsx : quatre cartes (Découverte, Classe,
 * Programme, Campus) côte à côte à partir de 1280 px, deux par deux sur une tablette,
 * empilées sur un téléphone ; la ligne des réseaux ; la bande des épisodes manager, à part,
 * sur devis ; les options ; les conditions ; les questions. Un seul bouton plein, celui de
 * l'offre mise en avant. La promotion affichée, s'il y en a une en cours, pose un bandeau
 * sobre, retiré à sa date de fin.
 *
 * LA PAGE SE SERT DU CACHE (audit d'octobre 2026, P2-6). Elle se rendait à chaque visite,
 * toujours en `no-store`, alors qu'elle ne lit rien de la requête. Elle est régénérée
 * toutes les cinq minutes, et aussitôt après un enregistrement dans /admin/offres
 * (`revalidatePath`, admin/offres/actions.ts). Seule la fin d'une promotion peut s'y lire
 * avec au plus cinq minutes de retard (plus la visite qui déclenche la régénération).
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { catalogue, affichage } = await lireLEtatDuCatalogue();
  return {
    alternates: { canonical: "/tarifs" },
    title: affichage.prixPublics ? "Tarifs" : "Offres",
    description: descriptionDesTarifs(catalogue, affichage.prixPublics),
  };
}

export default async function TarifsPage() {
  const { catalogue, decouverte, affichage } = await lireLEtatDuCatalogue();
  const prix = affichage.prixPublics;
  return (
    <PageDesTarifs
      vue={vueDesTarifs(catalogue, variablesDuCatalogue(decouverte), { prix })}
      bandeau={await bandeauDeLaPromotion()}
      prixPublics={prix}
    />
  );
}
