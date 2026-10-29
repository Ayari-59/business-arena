import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton } from "@/components/bouton";
import { SubmitButton } from "@/components/submit-button";
import { REFUS_AU_CANDIDAT, estUnRefusAuCandidat, normaliserCodeDExamen } from "@/config/examen/textes";

export const metadata: Metadata = {
  title: "Passer un examen",
  description: "Entrez le code d'examen donné par votre enseignant pour lire les règles et vous identifier.",
  robots: { index: false, follow: false },
};

/**
 * L'ENTRÉE D'UN EXAMEN INDIVIDUEL : le code donné par l'enseignant. Un code valide mène à
 * la page de l'examen (ses règles, puis l'identification) ; rien ne commence ici. Le
 * formulaire est une simple requête GET : il ne fait rien, il mène.
 */
export default async function EntreeDExamenPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; refus?: string }>;
}) {
  const { code, refus } = await searchParams;
  const propre = normaliserCodeDExamen(code);
  if (propre) redirect(`/examen/${propre}`);
  const raison = estUnRefusAuCandidat(refus) ? refus : code ? "inconnu" : null;
  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Examen individuel"
        titre="Passer un examen"
        chapeau="Entrez le code donné par votre enseignant. Vous dirigerez seul votre entreprise, tour après tour, face à des concurrents pilotés par l'ordinateur."
      />
      <div className={COLONNE_DE_PAGE}>
        <form method="get" action="/examen" className="carte grid max-w-md gap-3 p-4 sm:p-6">
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-200">Code de l&apos;examen</span>
            <input
              name="code"
              required
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="EX-K7M2PR"
              defaultValue={code ?? ""}
              className="champ px-3 py-2 font-mono text-base uppercase"
            />
          </label>
          {raison ? (
            <p role="alert" className="text-sm text-red-300">
              {REFUS_AU_CANDIDAT[raison]}
            </p>
          ) : null}
          <SubmitButton pendingLabel="Recherche de l'examen…" className={bouton()}>
            Continuer
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
