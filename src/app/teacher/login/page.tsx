import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TeacherAuthForms } from "@/components/teacher-auth-forms";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { ConnexionEtablissement } from "@/components/connexion-etablissement";
import { suiteInterne } from "@/lib/connexion-enseignant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion enseignant",
  description:
    "Connectez-vous ou créez votre compte enseignant pour lancer des parties, suivre vos cohortes et imprimer les dossiers des ateliers.",
};

/**
 * `suite` : la page demandée avant la connexion (lib/connexion-enseignant.ts). Elle
 * n'est gardée que si c'est un chemin interne ; sinon on arrive sur l'espace.
 */
export default async function TeacherLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string | string[] }>;
}) {
  const brut = (await searchParams).suite;
  const suite = suiteInterne(Array.isArray(brut) ? brut[0] : brut);
  const session = await getSession();
  if (session) redirect(suite ?? "/teacher");
  return (
    <main id="main">
      {/* L'en-tête des pages intérieures : la connexion n'est plus une boîte
          centrée au milieu d'un écran vide, mais une page du site, alignée sur
          la même colonne que les autres. */}
      <EnTeteDePage
        surtitre="Pour les enseignants"
        titre="Espace enseignant"
        chapeau={
          <>
            Créez des parties pour vos classes, suivez les décisions de chaque équipe et pilotez la
            clôture des tours.
          </>
        }
      />
      <div className={`${COLONNE_DE_PAGE} space-y-4 pb-16`}>
        <TeacherAuthForms suite={suite} />
        {/* La connexion par l'établissement (RENATER), si elle est configurée : un
            bouton secondaire, sous les formulaires habituels. */}
        <ConnexionEtablissement retour={suite} className="pt-2" />
        <p className="text-sm text-slate-400">
          <Link
            href="/guides/enseignant"
            className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Première fois ? Consultez le guide de prise en main
          </Link>
        </p>
      </div>
    </main>
  );
}
