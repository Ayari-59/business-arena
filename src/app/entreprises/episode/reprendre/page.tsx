import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireRepriseProfil } from "@/components/episode/formulaire-reprise-profil";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";

export const metadata: Metadata = {
  title: "Reprendre mon profil décisionnel",
  robots: { index: false, follow: false },
};

/**
 * REPRENDRE SON PROFIL SUR UN AUTRE APPAREIL.
 *
 * Le profil est attaché au navigateur ; le code de reprise le rend à son
 * porteur sur un nouveau poste, un téléphone, ou après des cookies vidés.
 */
export default function ReprendrePage() {
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <div className="mx-auto grid max-w-2xl gap-6 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            <Link href="/entreprises/episode/profil" className="hover:text-slate-300">
              Mon profil
            </Link>{" "}
            / Reprendre
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-50">
            Reprendre mon profil sur cet appareil
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-300">
            Saisissez le code de huit caractères affiché sur votre profil. Vos parties, votre profil
            et votre cohorte reviennent sur cet appareil.
          </p>
          <FormulaireRepriseProfil />
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
