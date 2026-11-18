import { Repliable } from "@/components/repliable";
import { compter } from "@/lib/format";
import { mentionDuBrouillon } from "@/config/brouillon-d-equipe";
import type { DecisionLue, DecisionsAuPilotage } from "@/config/decisions-au-pilotage";

/**
 * LA LIGNE REPLIÉE D'UNE ÉQUIPE, SOUS SA LIGNE DU TABLEAU DES ÉQUIPES.
 *
 * Ce que l'équipe a décidé pour le tour en cours : ses décisions principales
 * d'un coup d'œil, ses repères s'il y en a, et « Voir tout » pour les autres
 * leviers. Réservé au pilotage de l'enseignant propriétaire de la partie : le
 * mur et l'arène ne l'importent jamais (`tests/architecture/decisions-au-pilotage.test.ts`).
 */
export function DecisionsDeLEquipe({ decisions }: { decisions: DecisionsAuPilotage }) {
  if (decisions.etat === "aucune") {
    return <p className="text-sm text-slate-400">Aucune décision encore.</p>;
  }
  return (
    <div className="space-y-2" data-decisions-de-l-equipe={decisions.etat}>
      {decisions.etat === "brouillon" ? (
        <p className="text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wide">Brouillon · pas encore validé</span>
          {decisions.modification ? (
            <span data-brouillon-modifie>
              {" · "}
              {mentionDuBrouillon(decisions.modification.nom, new Date(decisions.modification.quand))}
            </span>
          ) : null}
        </p>
      ) : null}
      <Lignes lignes={decisions.principales} />
      {decisions.reperes.length > 0 ? (
        <ul className="space-y-1" aria-label="Repères à regarder">
          {decisions.reperes.map((r) => (
            <li
              key={r}
              data-repere
              className="w-fit max-w-full rounded-md border border-white/20 px-2 py-1 text-sm text-slate-200"
            >
              {r}
            </li>
          ))}
        </ul>
      ) : null}
      {decisions.autres.length > 0 ? (
        <Repliable
          resume="Voir tout"
          quoi={compter(decisions.autres.length, "autre décision", "autres décisions")}
          classeResume="text-sm font-medium text-slate-300"
        >
          <div className="mt-2">
            <Lignes lignes={decisions.autres} />
          </div>
        </Repliable>
      ) : null}
    </div>
  );
}

function Lignes({ lignes }: { lignes: DecisionLue[] }) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1.5">
      {lignes.map((l) => (
        <div key={l.libelle} className="min-w-0">
          <dt className="text-xs text-slate-400">{l.libelle}</dt>
          <dd className="font-medium tabular-nums text-slate-100">{l.valeur}</dd>
        </div>
      ))}
    </dl>
  );
}
