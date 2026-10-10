import { formatEuro } from "@/lib/format";
import type { GameView } from "@/services/game-view.service";
import { DemandeSubvention } from "@/components/demande-subvention";
import { Jauge } from "@/components/jauge";
import { resteApresLeviers, verdictAuMaximum } from "@/services/sauvetage";
import { Icone } from "@/components/icone";

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
  gameId,
  alerte,
  exigence,
  demande,
}: {
  gameId: string;
  alerte: NonNullable<GameView["alerteTresorerie"]>;
  /** Ce qu'il faut réunir pour valider le tour ; `null` si rien n'est exigé. */
  exigence?: GameView["exigenceSauvetage"];
  /** La demande de subvention déjà déposée pour ce tour, s'il y en a une. */
  demande?: GameView["demandeSubvention"];
}) {
  const restants = Math.max(0, alerte.toursAvantDefaillance - alerte.toursConsecutifs);
  const recours = (
    <Recours gameId={gameId} exigence={exigence ?? null} demande={demande ?? null} />
  );

  if (alerte.defaillante) {
    return (
      <section
        role="alert"
        aria-label="Entreprise défaillante"
        className="encadre-perte rounded-lg px-3 py-3 sm:px-4"
      >
        <p className="text-sm font-semibold text-red-200">
          <Icone nom="alerte" className="mr-1.5 h-4 w-4" />
          Votre entreprise est en cessation de paiements
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
          Elle est à l&apos;arrêt : elle ne produit plus, ne vend plus, et ses décisions ne
          sont plus simulées. {alerte.toursConsecutifs} tours de suite sous le plafond de
          découvert sans plus une créance à céder.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
          Une seule chose la relève : un apport qui ramène la trésorerie au-dessus de{" "}
          <strong className="tabular-nums">{formatEuro(-alerte.plafondDecouvert)}</strong>.
          Il manque <strong className="tabular-nums">{formatEuro(alerte.manque)}</strong>.
        </p>
        {recours}
      </section>
    );
  }

  return (
    <section
      role="alert"
      aria-label="Crise de trésorerie"
      className="encadre-perte rounded-lg px-3 py-3 sm:px-4"
    >
      <p className="text-sm font-semibold text-red-300">
        <Icone nom="alerte" className="mr-1.5 h-4 w-4" />
        Crise de trésorerie
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
        Votre découvert dépasse ce que la banque consent — elle a déjà cédé toutes vos
        créances à votre place. Trésorerie nette{" "}
        <strong className="tabular-nums">{formatEuro(alerte.tresorerieNette)}</strong> pour un
        découvert autorisé de{" "}
        <strong className="tabular-nums">{formatEuro(alerte.plafondDecouvert)}</strong> :{" "}
        <strong className="tabular-nums">{formatEuro(alerte.manque)}</strong> à trouver.
      </p>
      {/* ── LA TRÉSORERIE EN DÉCOUVERT, EN JAUGE ──
          Le découvert creusé au-delà de ce que la banque consent : la barre le
          montre, les chiffres le disent (jauge.tsx). Le rouge est ici celui
          d'un résultat franc — un vrai découvert —, pas d'un niveau à juger. */}
      <div className="mt-2.5">
        <Jauge
          libelle="Trésorerie nette"
          valeur={formatEuro(alerte.tresorerieNette)}
          borne={`autorisé jusqu'à ${formatEuro(-alerte.plafondDecouvert)}`}
          fraction={
            alerte.plafondDecouvert > 0
              ? Math.abs(alerte.tresorerieNette) /
                Math.max(Math.abs(alerte.tresorerieNette), alerte.plafondDecouvert)
              : 1
          }
          ton="alerte"
          repere={
            alerte.plafondDecouvert > 0
              ? {
                  fraction:
                    alerte.plafondDecouvert /
                    Math.max(Math.abs(alerte.tresorerieNette), alerte.plafondDecouvert),
                  label: "découvert autorisé",
                }
              : undefined
          }
        />
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
        {restants <= 1
          ? "Encore un tour dans cet état et votre entreprise sera à l'arrêt."
          : `Encore ${restants} tours dans cet état et votre entreprise sera à l'arrêt.`}{" "}
        Emprunt, apport des associés, cession d&apos;un actif : il faut décider ce tour-ci.
      </p>
      {recours}
    </section>
  );
}

/**
 * LE DERNIER RECOURS, ET SON ÉTAT.
 *
 * Il ne s'affiche que là où il a un sens. Tant que l'équipe peut encore
 * emprunter ou faire appel à ses associés, rien ici : la porte de l'aide
 * exceptionnelle ne s'ouvre pas à qui n'a pas d'abord poussé les siennes.
 * Ensuite, trois états — le formulaire, l'attente, la réponse —, et un
 * quatrième cas, la partie solo, où il n'y a simplement personne à solliciter :
 * le dire est plus honnête qu'un formulaire sans destinataire.
 */
function Recours({
  gameId,
  exigence,
  demande,
}: {
  gameId: string;
  exigence: GameView["exigenceSauvetage"];
  demande: GameView["demandeSubvention"];
}) {
  if (demande) {
    if (demande.statut === "pending") {
      return (
        <p className="mt-3 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-sm leading-relaxed text-slate-300">
          <Icone nom="courrier" className="mr-1.5 h-4 w-4 text-slate-400" />
          Demande de subvention de{" "}
          <strong className="tabular-nums text-slate-100">{formatEuro(demande.montant)}</strong>{" "}
          déposée : votre animateur doit encore l&apos;instruire. Vous pouvez valider votre tour
          sans attendre sa réponse.
        </p>
      );
    }
    if (demande.statut === "granted") {
      return (
        <p className="encadre-gain mt-3 rounded-lg px-3 py-2 text-sm leading-relaxed text-slate-200">
          <span aria-hidden className="mr-1.5 font-bold text-emerald-300">
            ✓
          </span>
          Subvention de{" "}
          <strong className="tabular-nums text-emerald-200">
            {formatEuro(demande.montantAccorde ?? 0)}
          </strong>{" "}
          accordée : elle sera encaissée à la clôture de ce tour.
          {demande.note ? ` « ${demande.note} »` : ""}
        </p>
      );
    }
    return (
      <p className="mt-3 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-sm leading-relaxed text-slate-300">
        Votre demande de subvention a été refusée.
        {demande.note ? ` « ${demande.note} »` : ""} Il faudra faire sans.
      </p>
    );
  }

  if (!exigence) return null;
  const verdict = verdictAuMaximum(exigence);
  if (verdict.issue === "leviers_epuises") {
    return <DemandeSubvention gameId={gameId} manque={resteApresLeviers(exigence)} />;
  }
  if (verdict.issue === "sans_recours") {
    return (
      <p className="mt-3 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-sm leading-relaxed text-slate-300">
        Emprunt et apport des associés réunis ne couvrent pas ce qui manque, et une partie solo
        n&apos;a pas d&apos;animateur à solliciter : votre tour se joue sans filet.
      </p>
    );
  }
  return null;
}
