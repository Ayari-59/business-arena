import { periodLabel } from "@/config/scenarios/periodicity";

interface Props {
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  pendingDecisions: boolean;
  kind: "solo" | "class";
  finished: boolean;
}

export function RoundStatusBanner({
  currentRound,
  roundsCount,
  roundDays,
  pendingDecisions,
  kind,
  finished,
}: Props) {
  if (finished) {
    return (
      <section className="rounded-xl border border-amber-400/30 bg-amber-950/20 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Partie terminée
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {roundsCount} tours joués. Consultez vos résultats ci-dessous.
        </p>
      </section>
    );
  }

  if (pendingDecisions) {
    return (
      <section className="rounded-xl border border-emerald-400/30 bg-emerald-950/20 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          {periodLabel(roundDays, currentRound)} / {roundsCount}
        </p>
        <p className="mt-1 text-sm font-medium text-emerald-200">
          Décisions enregistrées
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {kind === "class"
            ? "En attente de la clôture du tour par l'enseignant. La page se mettra à jour automatiquement."
            : "Résolution en cours."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-400/30 bg-amber-950/20 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
        {periodLabel(roundDays, currentRound)} / {roundsCount}
      </p>
      <p className="mt-1 text-sm font-medium text-amber-200">À vous de jouer</p>
      <p className="mt-1 text-sm text-slate-400">
        Vos décisions pour ce tour sont attendues.
      </p>
      <a
        href="#decisions"
        className="mt-3 inline-block rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
      >
        Prendre mes décisions
      </a>
    </section>
  );
}
