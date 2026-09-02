const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")} %`;

interface RatioDef {
  label: string;
  value: number;
  hint: string;
  thresholds: { good: number; warning: number };
}

function GaugeBar({ ratio }: { ratio: RatioDef }) {
  const clamped = Math.max(-1, Math.min(1, ratio.value));
  const fillPct = Math.abs(clamped) * 100;
  const isNegative = ratio.value < 0;
  const tone =
    ratio.value >= ratio.thresholds.good
      ? "bg-emerald-500"
      : ratio.value >= ratio.thresholds.warning
        ? "bg-amber-500"
        : "bg-red-500";
  const textTone =
    ratio.value >= ratio.thresholds.good
      ? "text-emerald-400"
      : ratio.value >= ratio.thresholds.warning
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-slate-300">{ratio.label}</span>
        <span className={`text-sm font-semibold tabular-nums ${textTone}`}>
          {isNegative ? "−" : ""}
          {pct(Math.abs(ratio.value))}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div
          className={`h-1.5 rounded-full ${tone}`}
          style={{ width: `${Math.min(100, fillPct)}%` }}
        />
      </div>
      <p className="text-[10px] leading-snug text-slate-600">{ratio.hint}</p>
    </div>
  );
}

export function RatioGauges({
  profitability,
  roce,
  roe,
  leverage,
  debtToEquity,
  assetTurnover,
}: {
  profitability: number;
  roce: number;
  roe: number;
  leverage: number;
  debtToEquity: number;
  assetTurnover: number;
}) {
  const ratios: RatioDef[] = [
    {
      label: "Rentabilité nette (RN / CA)",
      value: profitability,
      hint: "Ce qu'il reste sur chaque euro de CA après toutes les charges.",
      thresholds: { good: 0.05, warning: 0 },
    },
    {
      label: "Re — Rentabilité économique (ROCE)",
      value: roce,
      hint: "Ce que l'outil de production rapporte, indépendamment de son financement.",
      thresholds: { good: 0.08, warning: 0.02 },
    },
    {
      label: "Rf — Rentabilité financière (ROE)",
      value: roe,
      hint: "Ce que les capitaux propres rapportent aux associés.",
      thresholds: { good: 0.1, warning: 0.02 },
    },
    {
      label: "Effet de levier (Rf − Re)",
      value: leverage,
      hint: leverage >= 0
        ? "La dette amplifie la rentabilité des associés."
        : "La dette pèse : elle coûte plus qu'elle ne rapporte.",
      thresholds: { good: 0, warning: -0.05 },
    },
    {
      label: "Endettement (Dettes / CP)",
      value: debtToEquity,
      hint: debtToEquity > 1
        ? "L'entreprise doit plus à ses prêteurs qu'à ses associés."
        : "L'endettement reste contenu.",
      thresholds: { good: 0, warning: 0.8 },
    },
    {
      label: "Rotation de l'actif (CA / Actif)",
      value: assetTurnover,
      hint: "Le nombre de fois que l'actif « tourne » sur la période.",
      thresholds: { good: 0.5, warning: 0.2 },
    },
  ];

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-300">
        📐 Ratios financiers
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ratios.map((r) => (
          <GaugeBar key={r.label} ratio={r} />
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Un ratio seul ne dit rien : c&apos;est l&apos;ensemble qui raconte la stratégie
        financière. L&apos;effet de levier montre si la dette sert la rentabilité ou la
        fragilise.
      </p>
    </section>
  );
}
