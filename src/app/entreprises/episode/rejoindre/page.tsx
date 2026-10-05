import type { Metadata } from "next";
import Link from "next/link";
import { GuardedForm } from "@/components/guarded-action";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { cohorteParCode } from "@/services/cohortes.service";
import { SEUIL_D_ANONYMAT } from "@/pedagogy/profil/cohorte";
import { rejoindreCohorteAction } from "../actions";

export const metadata: Metadata = {
  title: "Rejoindre une cohorte",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * REJOINDRE UNE COHORTE, PAR LE LIEN D'INVITATION.
 *
 * On dit avant de rejoindre ce que l'animateur verra et ne verra pas : le
 * consentement porte sur des faits, pas sur une promesse vague.
 */
export default async function RejoindrePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; inconnu?: string }>;
}) {
  const { code = "", inconnu } = await searchParams;
  const cohorte = code ? await cohorteParCode(code) : null;
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <div className="mx-auto grid max-w-2xl gap-6 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            <Link href="/entreprises/episode" className="hover:text-slate-300">
              Épisodes manager
            </Link>{" "}
            / Rejoindre une cohorte
          </p>
          {cohorte && !inconnu ? (
            <>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-50">
                Rejoindre « {cohorte.nom} »
              </h1>
              <div className="grid gap-3 text-base leading-relaxed text-slate-300">
                <p>
                  Vous allez jouer des épisodes manager avec votre groupe : un par semaine, une
                  vingtaine de minutes chacun, et un débrief collectif toutes les deux semaines.
                </p>
                <p>
                  <span className="font-semibold text-slate-100">
                    Ce que voit l&apos;animateur :
                  </span>{" "}
                  le nombre de membres et d&apos;épisodes joués, et, à partir de {SEUIL_D_ANONYMAT}{" "}
                  personnes, des moyennes et la répartition des choix du groupe.
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Ce qu&apos;il ne voit pas :</span>{" "}
                  votre nom, votre profil, vos scores, vos parties. Votre profil décisionnel
                  n&apos;est visible que par vous.
                </p>
              </div>
              <GuardedForm
                action={rejoindreCohorteAction.bind(null, cohorte.code)}
                label="adhésion à une cohorte"
              >
                <SubmitButton pendingLabel="Inscription…" className={bouton({ taille: "l" })}>
                  Rejoindre la cohorte
                </SubmitButton>
              </GuardedForm>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-50">
                Ce lien ne mène à aucune cohorte
              </h1>
              <p className="text-base leading-relaxed text-slate-300">
                Le code {code ? `« ${code} » ` : ""}n&apos;existe pas. Vérifiez le lien reçu de
                votre animateur, ou jouez les épisodes sans cohorte : votre profil se construit de
                la même façon.
              </p>
              <p>
                <Link href="/entreprises/episode" className="text-amber-300 underline">
                  Voir les épisodes
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
