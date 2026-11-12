import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireRepriseEnClasse } from "@/components/cours/formulaire-reprise-en-classe";
import { PiedDePage } from "@/components/pied-de-page";
import { LONGUEUR_CODE_REPRISE } from "@/config/reprise";

export const metadata: Metadata = {
  title: "Reprendre ma place dans ma classe",
  description: "Retrouvez votre classe du cours et votre progression sur cet appareil, avec votre code de reprise.",
  robots: { index: false, follow: false },
};

/**
 * REPRENDRE SA PLACE DANS SA CLASSE DU COURS, SUR UN AUTRE APPAREIL (décision du propriétaire du
 * 11 novembre 2026 ; audit UX du même jour, P1-5).
 *
 * L'élève d'une classe est reconnu par son navigateur. Sur un autre poste, ou après des données
 * effacées, il rejoignait de nouveau sa classe par son code : un second élève à son nom, reparti de
 * l'étape 1. Son code de reprise, affiché sous « Ma classe », lui rend ici sa place et sa progression.
 * Rien n'est montré avant la vérification : la page ne dit pas quels codes existent.
 */
function ReprendreSaPlacePage() {
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <div className="mx-auto grid max-w-2xl gap-6 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-annonce text-slate-400">
            <Link href="/cours" className="hover:text-slate-300">
              Le cours par la simulation
            </Link>{" "}
            / Reprendre ma place
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-50">Reprendre ma place dans ma classe</h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-300">
            Saisissez le code de {LONGUEUR_CODE_REPRISE} caractères noté sous « Ma classe ». Votre classe et votre progression
            reviennent sur cet appareil, sans compter un élève de plus pour votre enseignant.
          </p>
          <FormulaireRepriseEnClasse />
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Pas encore de code ? Il s&apos;affiche sous « Ma classe », sur l&apos;appareil où vous avez rejoint la classe.
            Vous n&apos;avez jamais rejoint votre classe ?{" "}
            <Link href="/cours/rejoindre" className="text-amber-300 underline underline-offset-4">
              Rejoindre une classe
            </Link>
          </p>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(ReprendreSaPlacePage);
