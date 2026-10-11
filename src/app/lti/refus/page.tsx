import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { LIEN_TARIFS } from "@/config/vitrine-solo";

export const metadata: Metadata = {
  title: "Lancement depuis votre cours",
  robots: { index: false, follow: false },
};

/**
 * UN LANCEMENT VÉRIFIÉ QUI NE PEUT PAS ABOUTIR : l'établissement a atteint le nombre
 * d'enseignants que couvre sa licence. Seul un ENSEIGNANT arrive ici (l'élève n'occupe
 * aucune place de la licence), d'où le lien vers les tarifs.
 */
export default function RefusLtiPage() {
  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Lancement depuis votre cours"
        titre="La licence de votre établissement est complète"
        chapeau="Elle couvre déjà le nombre d'enseignants prévu : Business Arena ne peut pas vous ouvrir un espace de plus. Prévenez la personne qui gère la licence dans votre établissement."
      />
      <div className={COLONNE_DE_PAGE}>
        <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
          Voir les tarifs
        </Link>
      </div>
    </main>
  );
}
