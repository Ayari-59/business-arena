import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import { LES_OFFRES_DE_L_ARENE } from "@/config/tarifs";
import { CHAPITRES } from "@/config/cours/registre";

/** Le chapitre du cours ouvert à tous, sans licence (`libre`). */
const CHAPITRE_LIBRE = CHAPITRES.find((c) => c.libre)!.code;

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
            Voir les offres
          </Link>
        </div>
        {/* AUDIT P0-3 : une partie de classe exige une licence de l'arène (refusDeLaClasse,
            config/tarifs.ts) ; sans offre, seul ce qui est gratuit est promis. */}
        <p className="max-w-2xl text-base leading-relaxed text-slate-300" data-sans-licence="">
          Vos étudiants peuvent déjà jouer comme invités, gratuitement : la partie solo, les épisodes de
          démonstration et le{" "}
          <Link href={`/cours/${CHAPITRE_LIBRE}`} prefetch={false} className={LIEN_A_L_ENCRE}>
            chapitre libre du cours
          </Link>
          . Les parties de classe, où vos étudiants rejoignent votre partie par un code, demandent une
          licence de l&apos;arène : elles sont incluses dans {LES_OFFRES_DE_L_ARENE}.{" "}
          <Link href="/teacher/login" prefetch={false} className={LIEN_A_L_ENCRE}>
            Espace enseignant
          </Link>
        </p>
      </div>
    </main>
  );
}
