import { Fragment } from "react";
import { formatEuro, formatUnits } from "@/lib/format";
import type { GameView } from "@/services/game.service";

/**
 * Historique des ventes, clientèle par clientèle et tour par tour.
 *
 * Ce sont VOS données : elles sont gratuites, comme les comptes. L'étude de
 * marché achetable reste utile pour ce qu'elle seule apporte, les chiffres des
 * CONCURRENTS ; votre propre série de ventes, elle, n'a pas à se payer.
 *
 * Deux colonnes par clientèle, la demande du marché et vos ventes. Une
 * prévision se construit sur les deux : la demande porte la saison, votre part
 * dit ce que votre prix en a capté. Les avoir côte à côte est ce qui permet de
 * distinguer « le marché a baissé » de « j'ai vendu plus cher ».
 */
export function SalesHistory({
  history,
  vocabulary,
}: {
  history: GameView["salesHistory"];
  vocabulary: GameView["vocabulary"];
}) {
  if (history.rounds.length === 0) return null;

  return (
    <details className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-200">
        📈 Historique de vos ventes ({history.rounds.length} tour
        {history.rounds.length > 1 ? "s" : ""})
      </summary>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="pb-1 pr-3 font-medium">Tour</th>
              <th className="pb-1 pr-3 text-right font-medium">
                {vocabulary.priceLabel}
              </th>
              {history.segments.map((name) => (
                <th key={name} className="pb-1 pr-3 text-right font-medium" colSpan={2}>
                  {name}
                </th>
              ))}
              <th className="pb-1 pr-3 text-right font-medium">Prévu</th>
              <th className="pb-1 pr-3 text-right font-medium">Total vendu</th>
              <th className="pb-1 text-right font-medium">Manquées</th>
            </tr>
            <tr className="text-left text-[10px] text-slate-600">
              <th className="pb-1 pr-3" />
              <th className="pb-1 pr-3" />
              {history.segments.map((name) => (
                <Fragment key={name}>
                  <th className="pb-1 pr-3 text-right font-normal">demande</th>
                  <th className="pb-1 pr-3 text-right font-normal">vos ventes</th>
                </Fragment>
              ))}
              <th className="pb-1 pr-3" />
              <th className="pb-1 pr-3" />
              <th className="pb-1" />
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {history.rounds.map((row) => (
              <tr key={row.round} className="border-t border-white/5">
                <td className="py-1.5 pr-3 text-slate-400">T{row.round}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">
                  {row.price === null ? "—" : formatEuro(row.price)}
                </td>
                {row.bySegment.map((seg, i) => (
                  <Fragment key={i}>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-500">
                      {formatUnits(seg.potential)}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {formatUnits(seg.sold)}
                    </td>
                  </Fragment>
                ))}
                <td className="py-1.5 pr-3 text-right tabular-nums text-sky-300/80">
                  {row.forecastUnits === null ? "—" : formatUnits(row.forecastUnits)}
                </td>
                <td className="py-1.5 pr-3 text-right font-medium tabular-nums text-slate-100">
                  {formatUnits(row.sold)}
                </td>
                <td className="py-1.5 text-right tabular-nums text-red-300/80">
                  {row.lost > 0 ? formatUnits(row.lost) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        La colonne « prévu » est ce que vous aviez annoncé avant de jouer le tour.
        De quoi construire une prévision plutôt que de deviner : moyenne des tours passés,
        tendance d&apos;un tour à l&apos;autre, coefficient de saison en rapportant chaque tour
        à la moyenne. La colonne « demande » porte la saison du marché, la vôtre porte l&apos;effet
        de votre prix. Comparez ensuite votre prévision au réalisé : l&apos;écart est plus
        instructif que la prévision.
      </p>
    </details>
  );
}
