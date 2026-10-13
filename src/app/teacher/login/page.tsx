import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TeacherAuthForms } from "@/components/teacher-auth-forms";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { ConnexionEtablissement } from "@/components/connexion-etablissement";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session) redirect("/teacher");
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
        <TeacherAuthForms />
        {/* La connexion par l'établissement (RENATER), si elle est configurée : un
            bouton secondaire, sous les formulaires habituels. */}
        <ConnexionEtablissement className="pt-2" />
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
