import { JoinForm } from "@/components/join-form";

export default function JoinPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-2 text-3xl font-bold">Rejoindre une partie</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Entrez le code donné par votre enseignant : vous serez affecté automatiquement
          à une équipe.
        </p>
      </div>
      <JoinForm />
    </main>
  );
}
