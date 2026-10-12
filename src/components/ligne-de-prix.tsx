import Link from "next/link";
import { ligneDePrix } from "@/config/tarifs";
import { lireLEtatDuCatalogue } from "@/services/catalogue.service";

/**
 * LA LIGNE DE PRIX DES BANDES FINALES (audit C-07) : les trois offres de l'arène, lues au
 * catalogue (/admin/offres, mis en cache et revalidé à l'enregistrement), et le lien vers
 * la grille. Écrite une fois pour /enseignants, /ecoles et /fonctionnalites. Sans montant
 * tant que l'affichage des prix est éteint (le réglage par défaut : offres sur mesure).
 */
export async function LigneDePrix() {
  const { catalogue, affichage } = await lireLEtatDuCatalogue();
  return (
    <>
      {ligneDePrix(catalogue, affichage.prixPublics)}{" "}
      <Link
        href="/tarifs"
        className="font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        Voir les offres
      </Link>
    </>
  );
}
