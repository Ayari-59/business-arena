import type { ReactNode } from "react";
import { periodLabel } from "@/config/scenarios/periodicity";
import type { StatutSituations } from "@/config/situation-rendu";

interface Props {
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  pendingDecisions: boolean;
  kind: "solo" | "class";
  finished: boolean;
  /**
   * Rendu des situations du tour ; null quand le tour n'en pose aucune. Le
   * bandeau n'affiche plus de statut de rendu (« Situation rendue / incomplète »
   * ne servaient à rien) — le champ reste accepté pour compatibilité des appels.
   */
  situations?: StatutSituations | null;
}

/**
 * Le bandeau est une région LIVE (`role="status" aria-live="polite"`) posée à un
 * emplacement STABLE : le tour se clôt et la page se rafraîchit (poller en
 * classe) sans que l'élève ne fasse d'action, or le seul indice visuel du
 * changement est ce bandeau. Un lecteur d'écran doit donc l'annoncer. On garde
 * une seule `<section>` dont on ne change que le contenu (et la teinte) selon
 * l'état, pour que la région live persiste d'un rendu à l'autre.
 */
export function RoundStatusBanner({
  currentRound,
  roundsCount,
  roundDays,
  pendingDecisions,
  kind,
  finished,
}: Props) {
  let tone = "border-amber-400/30 bg-amber-950/20";
  let body: ReactNode;

  if (finished) {
    body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Partie terminée
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {roundsCount} tours joués. Dépliez chaque tour ci-dessous pour revoir ses résultats.
        </p>
      </>
    );
  } else if (pendingDecisions) {
    tone = "border-emerald-400/30 bg-emerald-950/20";
    body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          {periodLabel(roundDays, currentRound)} / {roundsCount}
        </p>
        <p className="mt-1 text-sm font-medium text-emerald-200">Décisions enregistrées</p>
        <p className="mt-1 text-sm text-slate-400">
          {kind === "class"
            ? "En attente de la clôture du tour par l'enseignant. La page se mettra à jour automatiquement."
            : "Résolution en cours."}
        </p>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          {periodLabel(roundDays, currentRound)} / {roundsCount}
        </p>
        {/* Passage de période : quand un nouveau tour s'ouvre, on le dit
            franchement — sinon l'élève voit une nouvelle période active sans
            comprendre que la précédente vient d'être close. */}
        {currentRound > 1 ? (
          <p className="mt-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-200">
            ↪ Nouveau tour : le {periodLabel(roundDays, currentRound - 1)} est clos (ses résultats
            sont dépliés juste au-dessus). Vous entamez le {periodLabel(roundDays, currentRound)}.
          </p>
        ) : null}
        <p className="mt-2 text-sm font-medium text-amber-200">À vous de jouer</p>
        <p className="mt-1 text-sm text-slate-400">Vos décisions pour ce tour sont attendues.</p>
        <a
          href="#decisions"
          className="mt-3 inline-block rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          Prendre mes décisions →
        </a>
      </>
    );
  }

  return (
    <section role="status" aria-live="polite" className={`rounded-xl border px-5 py-4 ${tone}`}>
      {body}
    </section>
  );
}
