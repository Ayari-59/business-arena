import type { Metadata } from "next";
import { CompetitionJoinForm } from "@/components/competition-join-form";

/** Page d'entrée par code : un titre pour l'onglet, rien pour les moteurs. */
export const metadata: Metadata = {
  title: "Rejoindre un concours",
  robots: { index: false, follow: false },
};

export default function CompetePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-2 text-3xl font-bold">Rejoindre un concours</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Entrez le code du concours et le nom de votre équipe. Rejoignez une équipe
          existante en saisissant exactement son nom.
        </p>
      </div>
      <CompetitionJoinForm />
    </main>
  );
}
