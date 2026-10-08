import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionJoinForm } from "@/components/competition-join-form";
import { CompetitionRecoveryForm } from "@/components/competition-recovery-form";
import { EXPLICATIONS_CONCOURS } from "@/config/concours";
import { PiedDePage } from "@/components/pied-de-page";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";

/** Page d'entrée par code : un titre pour l'onglet, rien pour les moteurs. */
export const metadata: Metadata = {
  title: "Rejoindre un concours",
  robots: { index: false, follow: false },
};

export default async function CompetePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const defaultCode = (code ?? "").trim().toUpperCase().slice(0, 6);
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Concours"
          titre="Rejoindre un concours"
          chapeau={
            <>
              Entrez le code du concours et le nom de votre équipe. Rejoignez une équipe existante
              en saisissant exactement son nom.
            </>
          }
        />
        {/* La colonne des pages intérieures : l'explication à gauche, le
            formulaire et la reprise à droite. Sur téléphone, l'explication
            passe d'abord, puis le formulaire, comme avant. */}
        <div className={`${COLONNE_DE_PAGE} grid items-start gap-6 pb-16 md:grid-cols-2`}>
          <section aria-labelledby="concours-explications" className="carte p-5">
            <h2
              id="concours-explications"
              className="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Un concours, c&apos;est quoi ?
            </h2>
            <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
              {EXPLICATIONS_CONCOURS.map((ligne, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-semibold tabular-nums text-slate-100">{i + 1}.</span>
                  <span>{ligne}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-slate-400">
              <Link
                href="/guide#concours"
                className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Tout savoir sur les concours dans le guide →
              </Link>
            </p>
          </section>
          <div className="grid gap-6">
            <CompetitionJoinForm defaultCode={defaultCode} />
            <section aria-labelledby="reprise-titre" className="carte p-5">
              <h2
                id="reprise-titre"
                className="text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Déjà inscrit, sur un autre appareil ?
              </h2>
              <div className="mt-3">
                <CompetitionRecoveryForm />
              </div>
            </section>
          </div>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
