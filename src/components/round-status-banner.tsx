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
 *
 * IL NE DIT PLUS RIEN QUAND C'EST À L'ÉLÈVE DE JOUER. Il portait là un raccourci
 * « Prendre mes décisions → » qui sautait par-dessus l'étape Analyser : posé
 * tout en haut, avant même le contexte, il invitait à trancher avant de savoir.
 * Or la boucle qu'on enseigne est de lire d'abord. Le tour en cours a déjà sa
 * carte plus bas, avec son numéro et ses onglets dans l'ordre — le bandeau n'y
 * ajoutait qu'une porte dérobée.
 *
 * Ce que cela coûte, et qui est assumé : la transition « décisions
 * enregistrées » → « nouveau tour ouvert », qui survient sans action de l'élève
 * quand l'enseignant clôt, n'est plus annoncée par cette région. Les deux
 * autres états — en attente de clôture, partie terminée — la gardent.
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
    // C'est à l'élève de jouer : rien à dire ici. Le tour en cours a sa carte
    // plus bas, avec son numéro et ses onglets dans l'ordre — Situation, puis
    // Analyser, puis Décider.
    return null;
  }

  return (
    <section role="status" aria-live="polite" className={`rounded-xl border px-5 py-4 ${tone}`}>
      {body}
    </section>
  );
}
