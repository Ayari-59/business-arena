import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { classeParCode, NOM_D_ELEVE_MAX } from "@/services/cours.service";
import { refusDeLEffectif } from "@/config/tarifs";
import { rejoindreClasseAction } from "../actions";

export const metadata: Metadata = {
  title: "Rejoindre une classe du cours",
  description: "Entrez le code de classe donné par votre enseignant pour suivre le cours par la simulation.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const REFUS: Record<string, string> = {
  inconnu: "Ce code ne mène à aucune classe. Vérifiez-le avec votre enseignant.",
  close: "Cette classe est close : elle n'accepte plus de nouvel élève.",
  nom: "Indiquez un prénom ou un pseudonyme : c'est ainsi que votre enseignant vous retrouvera.",
  pleine: refusDeLEffectif("classe"),
};

/**
 * REJOINDRE UNE CLASSE DU COURS, PAR SON CODE.
 *
 * L'élève tape le code que l'enseignant projette, puis un prénom ou un pseudonyme. On dit
 * avant ce que l'enseignant verra : où il en est dans chaque chapitre, et les erreurs du
 * correcteur sur ses essais. Pas de compte, pas d'adresse.
 */
export default async function RejoindreUneClassePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; refus?: string }>;
}) {
  const { code = "", refus } = await searchParams;
  const classe = code ? await classeParCode(code) : null;
  const message = refus && Object.hasOwn(REFUS, refus) ? REFUS[refus] : code && !classe ? REFUS.inconnu : null;
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <div className="mx-auto grid max-w-2xl gap-6 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-annonce text-slate-400">
            <Link href="/cours" className="hover:text-slate-300">
              Le cours par la simulation
            </Link>{" "}
            / Rejoindre une classe
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-50">
            {classe ? `Rejoindre « ${classe.nom} »` : "Rejoindre une classe"}
          </h1>
          {message && (
            <p className="encadre-perte rounded-lg px-4 py-3 text-sm" role="alert">
              {message}
            </p>
          )}
          <div className="grid gap-3 text-base leading-relaxed text-slate-300">
            <p>
              Tapez le code que votre enseignant vous a donné, et le prénom ou le pseudonyme sous lequel il vous
              retrouvera. Aucun compte, aucune adresse.
            </p>
            <p>
              <span className="font-semibold text-slate-100">Ce que voit votre enseignant :</span> où vous en êtes
              dans chaque chapitre, les étapes réussies du premier coup ou avec de l&apos;aide, et les remarques du
              correcteur sur vos essais manqués, pour reprendre en classe ce qui bloque.
            </p>
          </div>
          {classe?.close ? null : (
            <form action={rejoindreClasseAction} className="grid max-w-md gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Code de la classe</span>
                <input
                  name="code"
                  required
                  defaultValue={classe?.code ?? code}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="BTSCG1-7K3P"
                  className="champ w-64 max-w-full px-3 py-2 font-mono text-base uppercase"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Prénom ou pseudonyme</span>
                <input
                  name="nom"
                  required
                  maxLength={NOM_D_ELEVE_MAX}
                  autoComplete="given-name"
                  className="champ w-64 max-w-full px-3 py-2 text-base"
                />
              </label>
              <div>
                <SubmitButton pendingLabel="Inscription…" className={bouton({ taille: "l" })}>
                  Rejoindre la classe
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
