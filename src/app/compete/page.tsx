import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionJoinForm } from "@/components/competition-join-form";
import { EXPLICATIONS_CONCOURS } from "@/config/concours";

/** Page d'entrée par code : un titre pour l'onglet, rien pour les moteurs. */
export const metadata: Metadata = {
  title: "Rejoindre un concours",
  robots: { index: false, follow: false },
};

export default function CompetePage() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-2 text-3xl font-bold">Rejoindre un concours</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Entrez le code du concours et le nom de votre équipe. Rejoignez une équipe
          existante en saisissant exactement son nom.
        </p>
      </div>
      <section
        aria-labelledby="concours-explications"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/60 p-5"
      >
        <h2 id="concours-explications" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Un concours, c&apos;est quoi ?
        </h2>
        <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
          {EXPLICATIONS_CONCOURS.map((ligne, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-amber-400">{i + 1}.</span>
              <span>{ligne}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          <Link href="/guide#concours" className="text-amber-300 underline-offset-4 hover:underline">
            Tout savoir sur les concours dans le guide →
          </Link>
        </p>
      </section>
      <CompetitionJoinForm />
    </main>
  );
}
