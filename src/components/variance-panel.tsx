import { formatEuro, formatPercent } from "@/lib/format";
import type { VarianceOutput } from "@/engine/costs/variance";

/**
 * LES ÉCARTS DE COÛTS, ET RIEN D'AUTRE.
 *
 * Ce panneau affichait aussi deux chiffres que le moteur lui-même désavoue
 * (voir `engine/costs/variance.ts`) :
 *
 *   · « Variance prix/volume » par segment, libellée en euros, valait en
 *     réalité le chiffre d'affaires réalisé PLUS les unités invendues. Des
 *     euros additionnés à des unités, présentés comme des euros ;
 *   · « Impact sur la marge de contribution », en vert ou en rouge selon son
 *     signe, que le moteur décrit comme « à ne pas lire comme un écart sur
 *     marge » — c'était donc un verdict sur la marge qui n'en était pas un.
 *
 * Le commentaire du moteur était formel : « Rien ne doit en être affiché tant
 * que c'est le cas. » Un vrai écart sur chiffre d'affaires suppose un budget
 * de ventes, qui n'existe pas. Tant qu'il n'existe pas, ne rien montrer vaut
 * mieux que montrer faux : un élève de gestion à qui l'on présente une
 * addition d'euros et d'unités sous le nom d'« écart » apprend une notion
 * fausse, et il l'apprend avec l'autorité de l'écran.
 *
 * Le calcul reste dans le moteur, avec ses mises en garde, pour le jour où il
 * sera juste.
 *
 * ET CE PANNEAU N'EST MONTÉ NULLE PART. Aucune page ne l'importe : le moteur
 * calcule ces écarts à chaque tour et pour chaque référence, personne ne les
 * lit. Il est gardé parce que les écarts de COÛTS, eux, sont justes et
 * méritent d'être branchés un jour ; il est nettoyé pour que ce jour-là il ne
 * remette pas les deux chiffres faux à l'écran.
 */
export function VariancePanel({ variances }: { variances: VarianceOutput }) {
  const cvVar = [
    { label: "Écart sur prix des matières", value: variances.materialPriceVariance },
    { label: "Écart sur quantité · matières", value: variances.materialQuantityVariance },
    {
      label: "Écart sur quantité · autres charges variables",
      value: variances.otherVariableQuantityVariance,
    },
  ];

  const totalFavorable = variances.totalCostVariance <= 0;

  return (
    <div className="rounded-lg border border-amber-400/25 bg-amber-950/20 px-3 py-3 sm:p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        📊 Décomposition des écarts de coûts
      </h3>

      {/* Cost Variance Breakdown */}
      <div className="mt-3 space-y-1">
        <p className="text-xs text-slate-400">Écarts de coûts (€ — positif = défavorable)</p>
        <div className="space-y-1 rounded-md bg-slate-950/50 p-2">
          {cvVar.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{item.label}</span>
              <span
                className={`tabular-nums font-medium ${
                  item.value > 0.5 ? "text-red-400" : item.value < -0.5 ? "text-emerald-400" : "text-slate-300"
                }`}
              >
                {item.value >= 0 ? "+" : ""}
                {formatEuro(item.value)}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">Total écarts de coûts</span>
              <span
                className={`tabular-nums ${
                  totalFavorable ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {variances.totalCostVariance >= 0 ? "+" : ""}
                {formatEuro(variances.totalCostVariance)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-xs text-slate-400">
              <span>Ratio aux coûts réels</span>
              <span className="tabular-nums">
                {formatPercent(variances.costVarianceRatio)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Les écarts de coûts, matière et efficacité, pèsent directement sur le résultat : ce sont
        les seuls que ce panneau mesure.
      </p>
    </div>
  );
}
