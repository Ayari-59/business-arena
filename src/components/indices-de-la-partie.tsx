import type { MaitriseDeLaPartie } from "@/pedagogy/maitrise-de-la-partie";

/**
 * LES DEUX INDICES, CÔTE À CÔTE ET JAMAIS FONDUS.
 *
 * À gauche l'entreprise, à droite la compréhension. Un élève lit en
 * permanence ce qu'on lui affiche et optimise ce qu'il lit : tant que seul
 * l'IPG était là, le message était que la partie se gagne au résultat du
 * trimestre, la maîtrise ne pesant que 5 % de ses pondérations.
 *
 * Ils restent DEUX chiffres. Les additionner ou les pondérer serait un choix
 * pédagogique, et il appartient à l'enseignant : le relevé de notes sert déjà
 * les deux séparément, pour la même raison.
 *
 * Les couleurs disent la même séparation : l'ambre des décisions pour
 * l'entreprise, le bleu froid de l'analyse pour la maîtrise. Aucune des deux
 * ne dit « bien » ou « mal », ce sont des mesures, pas des verdicts.
 */
export function IndicesDeLaPartie({
  ipg,
  rang,
  total,
  maitrise,
}: {
  /** Indice de performance globale, ou null tant qu'aucun tour n'est clos. */
  ipg: number | null;
  /** Rang de l'équipe, null tant que l'enseignant n'a pas ouvert le classement. */
  rang: number | null;
  /** Nombre d'entreprises du classement, pour écrire « #2/4 ». */
  total: number;
  /** Maîtrise mesurée sur les situations rendues, ou null si aucune. */
  maitrise: MaitriseDeLaPartie | null;
}) {
  if (ipg === null && maitrise === null) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {ipg !== null ? (
        <span
          className="rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1 text-xs tabular-nums text-amber-300"
          title={
            rang !== null
              ? "Ce que votre entreprise a fait, et votre place parmi les autres."
              : "Ce que votre entreprise a fait. Le classement sera révélé par votre enseignant."
          }
        >
          {rang !== null ? `#${rang}/${total} · ` : ""}Entreprise {ipg.toFixed(0)}
        </span>
      ) : null}
      {/*
        La maîtrise s'affiche dès qu'une situation a été rendue ET débriefée.
        Avant cela, rien : un zéro ferait croire à une note, alors que c'est
        une absence de mesure.
      */}
      {maitrise !== null ? (
        <span
          className="rounded-full border border-sky-400/30 bg-sky-400/5 px-3 py-1 text-xs tabular-nums text-sky-300"
          title={`Ce que vous avez compris : moyenne de vos ${maitrise.mesurees} situation${
            maitrise.mesurees > 1 ? "s rendues" : " rendue"
          }, indices déduits.`}
        >
          Maîtrise {maitrise.sur20.toLocaleString("fr-FR")}/20
        </span>
      ) : null}
    </span>
  );
}
