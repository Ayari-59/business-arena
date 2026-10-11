import type { Metadata } from "next";
import Link from "next/link";
import { DevisForm } from "@/components/devis-form";
import { PiedDePage } from "@/components/pied-de-page";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import {
  estUneOffreDuDevis,
  LIBELLES_DU_DEVIS,
  MENTION_TVA,
  OFFRES_DU_DEVIS,
} from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";
import { LIEN_CONTACT } from "@/config/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/devis" },
  title: "Demander un devis",
  description:
    "Une demande de devis écrite pour Business Arena : l'offre, l'établissement ou l'organisation, le nombre d'enseignants ou de managers. Réponse par écrit.",
};

/**
 * LA DEMANDE DE DEVIS ÉCRITE.
 *
 * Décision du propriétaire : « la vente se fait sur devis », pour toutes les offres.
 * Chaque carte de /tarifs mène ici avec son offre (`?offre=classe|campus|reseau|episodes|
 * entreprise`) ; une adresse sans offre, ou avec une offre inconnue, pré-remplit Classe.
 * Le rendez-vous téléphonique reste proposé, en second.
 */
export default async function DevisPage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string }>;
}) {
  const { offre } = await searchParams;
  const offreInitiale = estUneOffreDuDevis(offre) ? offre : "classe";
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Offres et tarifs"
          titre="Demander un devis"
          chapeau={`Toutes les offres se vendent sur devis. Dites-nous pour qui, et combien : le devis vous est adressé par écrit, établi par ${VENDEUR.nom}.`}
        />
        <div className={`${COLONNE_DE_PAGE} pb-12`}>
          <DevisForm
            offres={OFFRES_DU_DEVIS.map((code) => ({ code, ...LIBELLES_DU_DEVIS[code] }))}
            offreInitiale={offreInitiale}
            vendeur={VENDEUR.nom}
            mentionTva={MENTION_TVA}
            contact={VENDEUR.contact}
          />
          <p className="mt-6 text-sm leading-relaxed text-slate-400">
            Vous préférez en parler de vive voix ?{" "}
            <Link href={LIEN_CONTACT.href} className={LIEN_A_L_ENCRE}>
              Prenez un rendez-vous téléphonique
            </Link>
            . Pour relire les offres :{" "}
            <Link href="/tarifs" className={LIEN_A_L_ENCRE}>
              les tarifs
            </Link>
            .
          </p>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
