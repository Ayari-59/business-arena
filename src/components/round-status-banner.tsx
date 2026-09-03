import { periodLabel } from "@/config/scenarios/periodicity";
import { libelleStatut, type StatutSituations } from "@/config/situation-rendu";

interface Props {
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  pendingDecisions: boolean;
  kind: "solo" | "class";
  finished: boolean;
  /** Rendu des situations du tour ; null quand le tour n'en pose aucune. */
  situations?: StatutSituations | null;
}

/**
 * Le rendu de la situation, à côté de « À vous de jouer » : une équipe qui
 * n'a rendu qu'une moitié doit le lire sans ouvrir l'onglet Situation.
 */
function StatutSituation({ statut }: { statut: StatutSituations | null | undefined }) {
  if (!statut) return null;
  const rendue = statut.manques.length === 0;
  return (
    <p
      className={`mt-1 text-sm ${rendue ? "text-emerald-300" : "text-amber-300"}`}
      data-testid="statut-situation"
    >
      {rendue ? "✓ " : "⚠ "}
      {libelleStatut(statut)}
      {!rendue ? (
        <>
          {" · "}
          <a href="#situation" className="underline hover:text-amber-200">
            Ouvrir la situation
          </a>
        </>
      ) : null}
    </p>
  );
}

export function RoundStatusBanner({
  currentRound,
  roundsCount,
  roundDays,
  pendingDecisions,
  kind,
  finished,
  situations,
}: Props) {
  if (finished) {
    return (
      <section className="rounded-xl border border-amber-400/30 bg-amber-950/20 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Partie terminée
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {roundsCount} tours joués. Consultez vos résultats dans l&apos;onglet Résultats.
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
        <StatutSituation statut={situations} />
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
      {/* Passage de période : quand un nouveau tour s'ouvre (le précédent vient
          d'être clos), on le dit franchement — sinon l'élève voit les chiffres
          changer sans comprendre qu'il a changé de période. */}
      {currentRound > 1 ? (
        <p className="mt-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-200">
          ↪ Nouveau tour : le {periodLabel(roundDays, currentRound - 1)} est clos (ses résultats sont
          dans l&apos;onglet Résultats). Vous entamez le {periodLabel(roundDays, currentRound)}.
        </p>
      ) : null}
      <p className="mt-2 text-sm font-medium text-amber-200">À vous de jouer</p>
      <StatutSituation statut={situations} />
      <p className="mt-1 text-sm text-slate-400">
        Vos décisions pour ce tour sont attendues.
      </p>
      <a
        href="#decisions"
        className="mt-3 inline-block rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
      >
        Prendre mes décisions →
      </a>
    </section>
  );
}
