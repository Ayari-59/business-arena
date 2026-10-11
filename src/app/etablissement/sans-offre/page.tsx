import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { LIEN_TARIFS } from "@/config/vitrine-solo";

export const metadata: Metadata = {
  title: "Votre établissement",
  robots: { index: false, follow: false },
};

/**
 * UN ENSEIGNANT (OU UN PERSONNEL) D'UN ÉTABLISSEMENT DE LA FÉDÉRATION QUI N'EST
 * RATTACHÉ À AUCUNE ORGANISATION : son identité est vérifiée, mais aucune licence ne
 * s'applique. Aucun compte n'est créé, rien n'est gardé : la page dit où en est
 * l'établissement et mène aux tarifs et à la demande de devis.
 */
export default function SansOffrePage() {
  return (
    <main id="main" className="pb-16" data-etablissement-sans-offre="">
      <EnTeteDePage
        surtitre="Connexion par l'établissement"
        titre="Votre établissement n'a pas encore d'offre Business Arena"
        chapeau="Votre identité a bien été vérifiée par votre établissement. Pour ouvrir votre espace enseignant, l'établissement souscrit une offre : la connexion de ses enseignants et de ses étudiants est alors reconnue d'elle-même."
      />
      <div className={`${COLONNE_DE_PAGE} grid gap-5`}>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/devis" prefetch={false} className={bouton()}>
            Demander un devis
          </Link>
          <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
            Voir les tarifs
          </Link>
        </div>
        <p className="max-w-2xl text-base leading-relaxed text-slate-300">
          Vos étudiants peuvent déjà jouer comme invités : la partie solo, les épisodes de démonstration, et les
          parties dont vous leur donnez le code depuis un compte enseignant.{" "}
          <Link href="/teacher/login" prefetch={false} className={LIEN_A_L_ENCRE}>
            Espace enseignant
          </Link>
        </p>
      </div>
    </main>
  );
}
