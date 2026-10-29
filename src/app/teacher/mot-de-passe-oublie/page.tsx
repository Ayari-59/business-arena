import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { DemandeDeReinitialisation } from "@/components/mot-de-passe-oublie-forms";
import { COMPTES_SANS_MOT_DE_PASSE, DUREE_DU_JETON_DITE } from "@/config/mot-de-passe-oublie";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false, follow: false },
};

/**
 * LA DEMANDE DE RÉINITIALISATION (services/mot-de-passe-oublie.service.ts) : une adresse,
 * et toujours la même réponse, que le compte existe ou non.
 */
export default async function MotDePasseOubliePage() {
  // Rendue à chaque requête : la zone /teacher porte une CSP à nonce (proxy.ts).
  await connection();
  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Espace enseignant"
        titre="Mot de passe oublié"
        chapeau={`Saisissez l'adresse de votre compte : un lien pour choisir un nouveau mot de passe y sera envoyé. Il reste valable ${DUREE_DU_JETON_DITE}.`}
      />
      <div className={`${COLONNE_DE_PAGE} space-y-4`}>
        <DemandeDeReinitialisation />
        <p className="max-w-md text-sm text-slate-400" data-comptes-sans-mot-de-passe="">
          {COMPTES_SANS_MOT_DE_PASSE}
        </p>
        <p className="text-sm">
          <Link href="/teacher/login" prefetch={false} className={LIEN_A_L_ENCRE}>
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
