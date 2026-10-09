import type { CompanyRoundResult, SalesEstimate } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { formatEuro, formatUnits } from "@/lib/format";
import { euroSigne } from "@/components/tableau-de-bord";

/**
 * « LE MARCHÉ RÉPOND » : L'ÉCART ENTRE CE QU'ON CROYAIT ET CE QUI EST ARRIVÉ.
 *
 * L'équipe a dit, avant de valider, combien elle pensait vendre, et l'encart lui
 * a montré le compte que ces ventes donnaient. La fin de tour met les deux côte
 * à côte : c'est là que la décision s'apprend. Sans cette confrontation,
 * l'estimation n'était qu'un exercice de saisie de plus.
 *
 * DEUX RÈGLES DE CHARTE, ET ELLES SE VOIENT :
 *   · le résultat RÉEL garde sa couleur de résultat — c'est un résultat ;
 *   · l'estimation reste à l'encre (blanc cassé) — ce n'était qu'une
 *     estimation, et lui donner du vert ou du rouge l'aurait faite passer pour
 *     un fait.
 * L'ÉCART, lui, est un résultat : il porte le vert ou le rouge francs, comme la
 * colonne d'écart des comptes (lot 4A).
 *
 * RIEN DU TOUT SANS ESTIMATION. Une équipe qui n'a rien annoncé ne se voit rien
 * reprocher : la ligne et le tableau n'existent pas.
 */

/** Ce qui a été vendu au marché, commandes comprises : ce que l'équipe compare. */
export function unitesVendues(result: CompanyRoundResult): number {
  return (
    Object.values(result.market.bySegment).reduce((s, d) => s + d.sold, 0) +
    (result.extraOrders?.delivered ?? 0) +
    (result.extraOrders?.subcontracted ?? 0) +
    (result.orderOffer?.delivered ?? 0) +
    (result.subscription?.retained ?? 0)
  );
}

export interface LigneDEcart {
  cle: string;
  label: string;
  estime: number;
  reel: number;
  format: "units" | "euro";
}

/**
 * Les lignes du tableau estimé / réel. `null` quand rien n'a été estimé. Les
 * trois lignes de compte n'existent que si le résultat estimé a pu être
 * calculé à la validation : une estimation de ventes seule ne donne qu'une
 * ligne, et c'est honnête.
 */
export function lignesDEcart(
  estimation: SalesEstimate | null | undefined,
  result: CompanyRoundResult,
  v: Pick<ScenarioVocabulary, "units">,
): LigneDEcart[] | null {
  if (!estimation || estimation.units <= 0) return null;
  const lignes: LigneDEcart[] = [
    {
      cle: "ventes",
      label: `Ventes (${v.units})`,
      estime: estimation.units,
      reel: unitesVendues(result),
      format: "units",
    },
  ];
  const compte = estimation.estimate;
  if (!compte) return lignes;
  lignes.push(
    {
      cle: "ca",
      label: "Chiffre d'affaires",
      estime: compte.revenue,
      reel: result.incomeStatement.revenue,
      format: "euro",
    },
    {
      cle: "resultat",
      label: "Résultat net",
      estime: compte.netIncome,
      reel: result.incomeStatement.netIncome,
      format: "euro",
    },
    {
      cle: "tresorerie",
      label: "Trésorerie nette",
      estime: compte.netTreasury,
      reel: result.functionalBalance.netTreasury,
      format: "euro",
    },
  );
  return lignes;
}

const montre = (valeur: number, format: LigneDEcart["format"]) =>
  format === "euro" ? formatEuro(valeur) : formatUnits(valeur);
const signe = (valeur: number, format: LigneDEcart["format"]) =>
  format === "euro"
    ? euroSigne(valeur)
    : `${valeur > 0 ? "+" : valeur < 0 ? "−" : ""}${formatUnits(Math.abs(valeur))}`;

/**
 * LA LIGNE DU RITUEL : une phrase, deux chiffres, rien de plus.
 *
 * Elle se pose sous le résultat du tour, dans le complément du verdict : à
 * l'instant où la classe regarde le chiffre, savoir qu'on l'avait vu venir — ou
 * pas — est ce qui fait la leçon.
 */
export function LigneEstimeEtReel({
  estimation,
  result,
  vocabulary: v,
}: {
  estimation: SalesEstimate | null | undefined;
  result: CompanyRoundResult;
  vocabulary: Pick<ScenarioVocabulary, "units">;
}) {
  const lignes = lignesDEcart(estimation, result, v);
  if (!lignes) return null;
  const ventes = lignes.find((l) => l.cle === "ventes")!;
  const resultat = lignes.find((l) => l.cle === "resultat");
  return (
    <p
      data-ecart-d-estimation
      className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm leading-relaxed text-slate-300"
    >
      {resultat ? (
        <span>
          Vous aviez estimé {/* L'ESTIMATION RESTE À L'ENCRE : ce n'était pas un résultat. */}
          <span className="font-semibold tabular-nums text-slate-100">
            {signe(resultat.estime, "euro")}
          </span>{" "}
          <span className="text-slate-400">· le marché a donné</span>{" "}
          {/* LE RÉSULTAT RÉEL GARDE SA COULEUR DE RÉSULTAT. */}
          <span
            className={`font-semibold tabular-nums ${
              resultat.reel >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {signe(resultat.reel, "euro")}
          </span>
        </span>
      ) : null}
      <span>
        <span className="text-slate-400">Ventes estimées</span>{" "}
        <span className="font-semibold tabular-nums text-slate-100">
          {formatUnits(ventes.estime)}
        </span>{" "}
        <span className="text-slate-400">· vendues</span>{" "}
        <span className="font-semibold tabular-nums text-slate-100">
          {formatUnits(ventes.reel)} {v.units}
        </span>
      </span>
    </p>
  );
}

/**
 * LE TABLEAU ESTIMÉ / RÉEL d'un tour passé, dans la grammaire des tableaux
 * financiers du lot 4A : un poste par ligne, une colonne par source, et la
 * colonne d'écart qui dit, seule, si c'est bon.
 */
export function TableauEstimeReel({
  estimation,
  result,
  vocabulary: v,
  periode,
}: {
  estimation: SalesEstimate | null | undefined;
  result: CompanyRoundResult;
  vocabulary: Pick<ScenarioVocabulary, "units">;
  /** Le nom de la période : « Trimestre 3 ». */
  periode: string;
}) {
  const lignes = lignesDEcart(estimation, result, v);
  if (!lignes) return null;
  return (
    <section
      className="mt-3"
      aria-label={`Ce que vous aviez estimé, et ce que le marché a donné · ${periode}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Votre estimation, et ce que le marché a donné
      </p>
      <div className="tableau-financier mt-1">
        <table className="text-sm">
          <caption className="sr-only">
            {`Comparaison, pour le ${periode.toLowerCase()}, entre ce que l'équipe avait estimé avant de valider et ce que le marché a donné. La colonne d'écart est signée : réel moins estimé.`}
          </caption>
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <th scope="col" className="py-1 pr-3 text-left font-medium">
                Poste
              </th>
              <th scope="col" className="py-1 pl-2 text-right font-medium sm:pl-3">
                Estimé
              </th>
              <th scope="col" className="py-1 pl-2 text-right font-medium sm:pl-3">
                Réel
              </th>
              <th scope="col" className="py-1 pl-2 text-right font-medium sm:pl-3">
                Écart
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => {
              const ecart = ligne.reel - ligne.estime;
              // Un écart EST un résultat : vert ou rouge francs. Nul, il reste
              // à l'encre — il ne dit ni gain ni perte.
              const teinte =
                Math.round(ecart) === 0
                  ? "text-slate-400"
                  : ecart > 0
                    ? "text-emerald-300"
                    : "text-red-400";
              return (
                <tr key={ligne.cle} className="border-b border-white/5 last:border-0">
                  <th scope="row" className="py-1 pr-3 text-left font-normal text-slate-300">
                    {ligne.label}
                  </th>
                  {/* L'ESTIMÉ EST À L'ENCRE, le réel aussi : c'est l'écart qui juge. */}
                  <td className="whitespace-nowrap py-1 pl-2 text-right tabular-nums text-slate-200 sm:pl-3">
                    {montre(ligne.estime, ligne.format)}
                  </td>
                  <td className="whitespace-nowrap py-1 pl-2 text-right font-semibold tabular-nums text-slate-100 sm:pl-3">
                    {montre(ligne.reel, ligne.format)}
                  </td>
                  <td
                    data-ecart
                    className={`whitespace-nowrap py-1 pl-2 text-right tabular-nums sm:pl-3 ${teinte}`}
                  >
                    {signe(ecart, ligne.format)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
