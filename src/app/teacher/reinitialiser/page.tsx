import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { NouveauMotDePasse } from "@/components/mot-de-passe-oublie-forms";
import { LONGUEUR_MINIMALE_DU_MOT_DE_PASSE } from "@/services/auth.service";
import { jetonUtilisable, LIEN_INVALIDE } from "@/services/mot-de-passe-oublie.service";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false, follow: false },
  // Le jeton est dans l'adresse : aucun lien sortant ne doit le transmettre.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

/**
 * LE LIEN REÇU PAR COURRIEL arrive ici. Le jeton est vérifié à l'affichage (sans être
 * consommé), puis de nouveau, et consommé, à l'envoi du formulaire.
 */
export default async function ReinitialiserPage({
  searchParams,
}: {
  searchParams: Promise<{ jeton?: string | string[] }>;
}) {
  const brut = (await searchParams).jeton;
  const jeton = (Array.isArray(brut) ? brut[0] : brut) ?? "";
  const valable = await jetonUtilisable(jeton);
  return (
    <main id="main" className="pb-16" data-lien-de-reinitialisation={valable ? "valable" : "invalide"}>
      <EnTeteDePage
        surtitre="Espace enseignant"
        titre={valable ? "Choisissez un nouveau mot de passe" : "Ce lien n'est plus valable"}
        chapeau={
          valable
            ? "Enregistrer un nouveau mot de passe ferme toutes les sessions ouvertes sur vos autres appareils."
            : LIEN_INVALIDE
        }
      />
      <div className={`${COLONNE_DE_PAGE} space-y-4`}>
        {valable ? <NouveauMotDePasse jeton={jeton} minimum={LONGUEUR_MINIMALE_DU_MOT_DE_PASSE} /> : null}
        <p className="text-sm">
          <Link
            href={valable ? "/teacher/login" : "/teacher/mot-de-passe-oublie"}
            prefetch={false}
            className={LIEN_A_L_ENCRE}
          >
            {valable ? "Retour à la connexion" : "Demander un nouveau lien"}
          </Link>
        </p>
      </div>
    </main>
  );
}
