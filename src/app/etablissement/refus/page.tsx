import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { ConnexionEtablissement } from "@/components/connexion-etablissement";
import { LIEN_TARIFS } from "@/config/vitrine-solo";

export const metadata: Metadata = {
  title: "Connexion par l'établissement",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * UNE CONNEXION PAR L'ÉTABLISSEMENT QUI N'A PAS ABOUTI. Jamais le motif technique : il
 * est au journal (/admin/renater). Trois cas pour la personne :
 *   · la réponse de l'établissement n'a pas pu être vérifiée : recommencer ;
 *   · l'établissement choisi n'est pas dans la Fédération Éducation-Recherche ;
 *   · la licence de l'établissement est complète (un enseignant de plus).
 */
const ECRANS = {
  verification: {
    titre: "La connexion n'a pas pu être vérifiée",
    chapeau:
      "Business Arena n'a pas pu confirmer la réponse de votre établissement. Recommencez la connexion : si cela se reproduit, écrivez-nous, le refus est noté de notre côté.",
  },
  inconnu: {
    titre: "Cet établissement n'est pas reconnu",
    chapeau:
      "Seuls les établissements de la Fédération Éducation-Recherche (RENATER) peuvent se connecter ainsi. Choisissez de nouveau votre établissement, ou entrez avec le code donné par votre enseignant.",
  },
  plafond: {
    titre: "La licence de votre établissement est complète",
    chapeau:
      "Elle couvre déjà le nombre d'enseignants prévu, ou elle n'est pas en cours : Business Arena ne peut pas vous ouvrir un espace de plus. Prévenez la personne qui gère la licence dans votre établissement.",
  },
} as const;

export default async function RefusPage({ searchParams }: { searchParams: Promise<{ motif?: string }> }) {
  const { motif } = await searchParams;
  const cle = motif === "inconnu" || motif === "plafond" ? motif : "verification";
  const e = ECRANS[cle];
  return (
    <main id="main" className="pb-16" data-refus-etablissement={cle}>
      <EnTeteDePage surtitre="Connexion par l'établissement" titre={e.titre} chapeau={e.chapeau} />
      <div className={`${COLONNE_DE_PAGE} grid justify-items-start gap-4`}>
        {cle === "plafond" ? (
          <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
            Voir les offres
          </Link>
        ) : (
          <>
            <ConnexionEtablissement />
            <Link href="/join" prefetch={false} className={LIEN_A_L_ENCRE}>
              Entrer avec un code de partie
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
