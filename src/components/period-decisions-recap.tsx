import { formatEuro, formatUnits } from "@/lib/format";
import type { RoundDecisions } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import type { GameView } from "@/services/game-view.service";

/**
 * Récapitulatif en lecture seule des décisions d'un tour clos. Sert l'onglet
 * « Décisions » d'une période passée : ce que l'équipe a effectivement rendu,
 * pour le remettre en face des résultats qu'il a produits — sans reproposer le
 * formulaire, qui n'aurait plus de sens sur un tour verrouillé.
 */
export function PeriodDecisionsRecap({
  decisions,
  vocabulary,
  gamme = null,
}: {
  decisions: RoundDecisions;
  vocabulary: ScenarioVocabulary;
  /** Gamme du scénario joué : le récapitulatif se lit alors référence par référence. */
  gamme?: GameView["gamme"];
}) {
  const d = decisions;
  const parProduit =
    gamme && d.products
      ? gamme.map((p) => ({ name: p.name, own: d.products![p.code] })).filter((x) => x.own)
      : [];
  // Colonnes qualité et fournisseur : seulement si au moins une référence les porte.
  const avecQualite = parProduit.some((x) => x.own!.qualityBudget !== undefined);
  const avecFournisseur = parProduit.some((x) => x.own!.supplierChoice !== undefined);
  const avecRd = parProduit.some((x) => x.own!.rdBudget !== undefined);

  const core: { label: string; value: string }[] = parProduit.length
    ? [
        { label: "Prix moyen", value: formatEuro(d.price) },
        { label: vocabulary.productionLabel, value: `${formatUnits(d.productionPlan)} ${vocabulary.units}` },
        { label: "Budget marketing", value: formatEuro(d.marketingBudget) },
      ]
    : [
        { label: vocabulary.priceLabel, value: formatEuro(d.price) },
        { label: vocabulary.productionLabel, value: `${formatUnits(d.productionPlan)} ${vocabulary.units}` },
        { label: "Budget marketing", value: formatEuro(d.marketingBudget) },
      ];
  if (d.qualityBudget > 0) core.push({ label: "Budget qualité", value: formatEuro(d.qualityBudget) });
  if (d.maintenanceBudget > 0)
    core.push({ label: "Budget maintenance", value: formatEuro(d.maintenanceBudget) });
  if ((d.rdBudget ?? 0) > 0) core.push({ label: "Recherche et développement", value: formatEuro(d.rdBudget!) });
  if (d.forecast?.expectedUnits !== undefined)
    core.push({ label: "Ventes prévues", value: `${formatUnits(d.forecast.expectedUnits)} ${vocabulary.units}` });
  if (d.forecast?.expectedCash !== undefined)
    core.push({ label: "Trésorerie prévue", value: formatEuro(d.forecast.expectedCash) });

  // Leviers optionnels réellement actionnés ce tour-là.
  const chips: string[] = [];
  if (d.insurance) chips.push("🛡️ Assurance souscrite");
  // En gamme, le fournisseur se lit référence par référence dans le tableau.
  if (d.supplierChoice && !avecFournisseur) chips.push(`🚚 Fournisseur : ${d.supplierChoice}`);
  if (d.acceptOrder) chips.push("📦 Commande exceptionnelle acceptée");
  if (d.studies) {
    const labels: Record<string, string> = {
      market: "marché",
      price: "prix",
      finance: "finance",
      project: "projet",
    };
    const bought = Object.entries(d.studies)
      .filter(([, v]) => v)
      .map(([k]) => labels[k] ?? k);
    if (bought.length > 0) chips.push(`📚 Études : ${bought.join(", ")}`);
  }
  if (d.hr) {
    if (d.hr.hire) chips.push(`👥 +${d.hr.hire} embauche${d.hr.hire > 1 ? "s" : ""}`);
    if (d.hr.fire) chips.push(`👥 −${d.hr.fire} licenciement${d.hr.fire > 1 ? "s" : ""}`);
    if (d.hr.trainingBudget) chips.push(`🎓 Formation ${formatEuro(d.hr.trainingBudget)}`);
  }
  if (d.investment) {
    if (d.investment.machineCapacityUnits)
      chips.push(`🏗️ Investissement +${formatUnits(d.investment.machineCapacityUnits)} u`);
    const bought = (d.investment.equipmentBuy ?? []).reduce((s, e) => s + e.quantity, 0);
    const sold = (d.investment.equipmentSell ?? []).reduce((s, e) => s + e.quantity, 0);
    if (bought > 0) chips.push(`🏗️ Achat de ${bought} équipement${bought > 1 ? "s" : ""}`);
    if (sold > 0) chips.push(`🏭 Cession de ${sold} équipement${sold > 1 ? "s" : ""}`);
  }
  if (d.finance) {
    if (d.finance.newLoan) chips.push(`🏦 Emprunt ${formatEuro(d.finance.newLoan)}`);
    if (d.finance.loanRepayment)
      chips.push(`🏦 Remboursement anticipé ${formatEuro(d.finance.loanRepayment)}`);
    if (d.finance.capitalIncrease)
      chips.push(`🤝 Augmentation de capital ${formatEuro(d.finance.capitalIncrease)}`);
    if (d.finance.dividend) chips.push(`💸 Dividende ${formatEuro(d.finance.dividend)}`);
  }
  if (d.treasury) {
    if (d.treasury.discount) chips.push(`💶 Escompte ${formatEuro(d.treasury.discount)}`);
    if (d.treasury.factoring) chips.push(`💶 Affacturage ${formatEuro(d.treasury.factoring)}`);
    if (d.treasury.placement) chips.push(`💶 Placement ${formatEuro(d.treasury.placement)}`);
  }
  if (d.rse) {
    if (d.rse.budget) chips.push(`🌱 Budget RSE ${formatEuro(d.rse.budget)}`);
    if (d.rse.investment) chips.push(`🌱 Investissement propre ${formatEuro(d.rse.investment)}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Ce que votre équipe a rendu pour ce tour. À relire en face des résultats.
      </p>
      {parProduit.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-1 pr-3 font-medium">Référence</th>
                <th className="pb-1 pr-3 text-right font-medium">{vocabulary.priceLabel}</th>
                <th className="pb-1 pr-3 text-right font-medium">{vocabulary.productionPlanLabel}</th>
                <th className="pb-1 pr-3 text-right font-medium">Marketing</th>
                {avecQualite ? <th className="pb-1 pr-3 text-right font-medium">Qualité</th> : null}
                {avecRd ? <th className="pb-1 pr-3 text-right font-medium">R&amp;D</th> : null}
                {avecFournisseur ? <th className="pb-1 font-medium">Fournisseur</th> : null}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {parProduit.map(({ name, own }) => (
                <tr key={name} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 text-slate-100">{name}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{formatEuro(own!.price)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatUnits(own!.productionPlan)} {vocabulary.units}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatEuro(own!.marketingBudget ?? 0)}
                  </td>
                  {avecQualite ? (
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {formatEuro(own!.qualityBudget ?? 0)}
                    </td>
                  ) : null}
                  {avecRd ? (
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatEuro(own!.rdBudget ?? 0)}</td>
                  ) : null}
                  {avecFournisseur ? (
                    <td className="py-1.5 text-slate-300">{own!.supplierChoice ?? "—"}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {core.map((row) => (
          <div key={row.label} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-slate-400">{row.label}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-slate-100">{row.value}</dd>
          </div>
        ))}
      </dl>
      {chips.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Leviers actionnés
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
