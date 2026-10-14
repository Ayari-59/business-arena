import { periodLabel } from "@/config/scenarios/periodicity";

interface Props {
  currentRound: number;
  roundsCount: number;
  roundDays: number;
  pendingDecisions: boolean;
  kind: "solo" | "class";
  finished: boolean;
}

/**
 * CE QUI RESTE DU BANDEAU D'ÉTAT : l'annonce, sans la surface.
 *
 * Un encadré occupait le haut de l'arène pour dire trois choses déjà dites
 * ailleurs — le numéro du tour, que porte la frise de l'en-tête ; « à vous de
 * jouer », que portent les onglets et le bouton de validation ; « le tour
 * précédent est clos », que porte le lien vert du tour en cours. Trois
 * redites, cinq lignes, et le premier écran de l'arène consommé avant la
 * moindre donnée. Il est retiré.
 *
 * MAIS PAS SA RÉGION LIVE. En classe, le tour se clôt et la page se rafraîchit
 * d'elle-même (poller), sans que l'élève ait rien fait : à l'écran, la
 * nouvelle période parle d'elle-même, mais une personne qui n'écoute la page
 * qu'avec un lecteur d'écran n'a aucun moyen de savoir que quelque chose a
 * changé. On garde donc une région `role="status" aria-live="polite"` à un
 * emplacement STABLE, dont seul le contenu change — annoncée à la voix,
 * invisible à l'œil (`sr-only`).
 *
 * Elle n'est pas un doublon visuel caché : elle dit l'état en une phrase, là
 * où le bandeau le dépliait en paragraphes.
 */
export function AnnonceDuTour({
  currentRound,
  roundsCount,
  roundDays,
  pendingDecisions,
  kind,
  finished,
}: Props) {
  const tour = `${periodLabel(roundDays, currentRound)} sur ${roundsCount}.`;
  let phrase: string;

  if (finished) {
    phrase = `Partie terminée. ${roundsCount} tours joués, dépliez chaque tour pour revoir ses résultats.`;
  } else if (pendingDecisions) {
    phrase =
      kind === "class"
        ? `${tour} Décisions enregistrées, en attente de la clôture du tour par l'enseignant. La page se mettra à jour d'elle-même.`
        : `${tour} Décisions enregistrées, résolution en cours.`;
  } else {
    const ouverture =
      currentRound > 1
        ? ` Le ${periodLabel(roundDays, currentRound - 1).toLowerCase()} est clos, ses résultats sont dépliés au-dessus du tour en cours.`
        : "";
    phrase = `${tour}${ouverture} À vous de jouer : vos décisions sont attendues, après avoir lu la situation.`;
  }

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {phrase}
    </p>
  );
}
