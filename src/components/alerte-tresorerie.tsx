import { formatEuro } from "@/lib/format";
import type { GameView } from "@/services/game-view.service";

/**
 * L'ALERTE QU'UNE ÉQUIPE EN CESSATION DE PAIEMENTS NE VOYAIT PAS.
 *
 * La crise de trésorerie existait dans le moteur depuis longtemps, et se
 * disait à deux endroits : une ligne rouge dans l'onglet Finance d'une carte
 * de tour — il fallait ouvrir l'onglet —, et le statut « défaillante » dans le
 * classement, que l'animateur révèle quand il le décide. Une équipe gelée
 * pouvait donc ne RIEN voir : son formulaire s'affichait comme d'habitude, sa
 * décision partait, et le moteur l'ignorait en silence.
 *
 * Ce bandeau est en haut de l'arène, avant toute autre chose, et ne dépend
 * d'aucun rideau : cet état-là appartient à l'équipe.
 *
 * Il dit trois choses, dans cet ordre, parce que c'est l'ordre dans lequel on
 * a besoin de les savoir :
 *
 *  1. CE QUI SE PASSE — le découvert dépasse ce que la banque consent, et il
 *     n'y a plus de créances à céder pour le combler. C'est la définition de
 *     la cessation de paiements, dite en français.
 *  2. COMBIEN IL MANQUE — un montant, pas une appréciation. C'est ce qu'il
 *     faut trouver pour repasser sous le plafond.
 *  3. CE QUI ARRIVE SI RIEN NE CHANGE — combien de tours il reste avant la
 *     défaillance, puisque c'est un compte à rebours et qu'un compte à
 *     rebours qu'on ne voit pas n'en est pas un.
 *
 * Deux tons : l'ambre pour la crise, où tout est encore rattrapable ; le rouge
 * pour l'entreprise déjà gelée, où il ne reste qu'une chose à faire.
 */
export function AlerteTresorerie({
  alerte,
}: {
  alerte: NonNullable<GameView["alerteTresorerie"]>;
}) {
  const restants = Math.max(0, alerte.toursAvantDefaillance - alerte.toursConsecutifs);

  if (alerte.defaillante) {
    return (
      <section
        role="alert"
        aria-label="Entreprise défaillante"
        className="rounded-lg border border-red-400/40 border-l-4 border-l-red-400 bg-red-950/40 px-3 py-3 sm:px-4"
      >
        <p className="text-sm font-semibold text-red-200">
          <span aria-hidden className="mr-1.5">🛑</span>
          Votre entreprise est en cessation de paiements
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-red-100/90">
          Elle est à l&apos;arrêt : elle ne produit plus, ne vend plus, et ses décisions ne
          sont plus simulées. {alerte.toursConsecutifs} tours de suite sous le plafond de
          découvert sans plus une créance à céder.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-red-100/90">
          Une seule chose la relève : un apport qui ramène la trésorerie au-dessus de{" "}
          <strong className="tabular-nums">{formatEuro(-alerte.plafondDecouvert)}</strong>.
          Il manque <strong className="tabular-nums">{formatEuro(alerte.manque)}</strong>.
        </p>
      </section>
    );
  }

  return (
    <section
      role="alert"
      aria-label="Crise de trésorerie"
      className="rounded-lg border border-amber-400/40 border-l-4 border-l-amber-400 bg-amber-950/30 px-3 py-3 sm:px-4"
    >
      <p className="text-sm font-semibold text-amber-200">
        <span aria-hidden className="mr-1.5">🚨</span>
        Crise de trésorerie
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-100/90">
        Votre découvert dépasse ce que la banque consent — elle a déjà cédé toutes vos
        créances à votre place. Trésorerie nette{" "}
        <strong className="tabular-nums">{formatEuro(alerte.tresorerieNette)}</strong> pour un
        découvert autorisé de{" "}
        <strong className="tabular-nums">{formatEuro(alerte.plafondDecouvert)}</strong> :{" "}
        <strong className="tabular-nums">{formatEuro(alerte.manque)}</strong> à trouver.
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-100/90">
        {restants <= 1
          ? "Encore un tour dans cet état et votre entreprise sera à l'arrêt."
          : `Encore ${restants} tours dans cet état et votre entreprise sera à l'arrêt.`}{" "}
        Emprunt, apport des associés, cession d&apos;un actif : il faut décider ce tour-ci.
      </p>
    </section>
  );
}
