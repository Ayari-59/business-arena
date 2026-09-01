import { formatEuro, formatPercent } from "@/lib/format";

/**
 * Graphiques SVG serveur, sobres et accessibles (skill dataviz) :
 * - palette validée mode sombre : série 1 bleu #3987e5, série 2 orange #d95926,
 *   négatif rouge #e66767 (pôle divergent), encre secondaire #c3c2b7 ;
 * - un seul axe (tout est en €), légende dès 2 séries, labels directs sur le
 *   dernier point, grille discrète, <title> natifs comme couche de survol.
 */

const SEGMENT_COLORS = [
  "#3987e5", "#d95926", "#7c3aed", "#10b981", "#f59e0b",
  "#ec4899", "#06b6d4", "#84cc16",
];

const W = 560;
const H = 190;
const PAD = { left: 8, right: 88, top: 16, bottom: 22 };

function scale(points: number[], min: number, max: number, size: number, invert: boolean) {
  const range = max - min || 1;
  return points.map((p) => {
    const t = (p - min) / range;
    return invert ? size - t * size : t * size;
  });
}

export function RevenueChart({
  history,
  roundsCount,
}: {
  history: { round: number; revenue: number; netIncome: number }[];
  roundsCount: number;
}) {
  if (history.length === 0) return null;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const values = history.flatMap((h) => [h.revenue, h.netIncome, 0]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (round: number) =>
    PAD.left + ((round - 1) / Math.max(1, roundsCount - 1)) * innerW;
  const y = (v: number) => PAD.top + scale([v], min, max, innerH, true)[0]!;
  const path = (key: "revenue" | "netIncome") =>
    history.map((h, i) => `${i === 0 ? "M" : "L"}${x(h.round).toFixed(1)},${y(h[key]).toFixed(1)}`).join(" ");
  const last = history.at(-1)!;

  return (
    <figure>
      <figcaption className="mb-2 flex items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: "#3987e5" }} /> Chiffre d&apos;affaires
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: "#d95926" }} /> Résultat net
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution du chiffre d'affaires et du résultat net par tour">
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#383835" strokeWidth="1" />
        {history.map((h) => (
          <g key={h.round}>
            <text x={x(h.round)} y={H - 6} textAnchor="middle" fontSize="10" fill="#898781">
              T{h.round}
            </text>
          </g>
        ))}
        <path d={path("revenue")} fill="none" stroke="#3987e5" strokeWidth="2" strokeLinejoin="round" />
        <path d={path("netIncome")} fill="none" stroke="#d95926" strokeWidth="2" strokeLinejoin="round" />
        {history.map((h) => (
          <g key={h.round}>
            <circle cx={x(h.round)} cy={y(h.revenue)} r="3.5" fill="#3987e5">
              <title>{`T${h.round} · CA : ${formatEuro(h.revenue)}`}</title>
            </circle>
            <circle cx={x(h.round)} cy={y(h.netIncome)} r="3.5" fill="#d95926">
              <title>{`T${h.round} · Résultat : ${formatEuro(h.netIncome)}`}</title>
            </circle>
          </g>
        ))}
        <text x={x(last.round) + 8} y={y(last.revenue) + 3} fontSize="10" fill="#c3c2b7">
          {formatEuro(last.revenue)}
        </text>
        <text x={x(last.round) + 8} y={y(last.netIncome) + 3} fontSize="10" fill="#c3c2b7">
          {formatEuro(last.netIncome)}
        </text>
      </svg>
    </figure>
  );
}

export function TreasuryChart({
  history,
  roundsCount,
}: {
  history: { round: number; netTreasury: number }[];
  roundsCount: number;
}) {
  if (history.length === 0) return null;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const values = history.flatMap((h) => [h.netTreasury, 0]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const y = (v: number) => PAD.top + scale([v], min, max, innerH, true)[0]!;
  const slot = innerW / roundsCount;
  const barW = Math.min(36, slot * 0.6);

  return (
    <figure>
      <figcaption className="mb-2 text-xs text-slate-400">
        Trésorerie nette par tour (négatif = découvert bancaire)
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Trésorerie nette par tour">
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#383835" strokeWidth="1" />
        {history.map((h) => {
          const cx = PAD.left + (h.round - 0.5) * slot;
          const top = Math.min(y(0), y(h.netTreasury));
          const height = Math.max(2, Math.abs(y(h.netTreasury) - y(0)));
          const negative = h.netTreasury < 0;
          return (
            <g key={h.round}>
              <rect
                x={cx - barW / 2}
                y={top}
                width={barW}
                height={height}
                rx="3"
                fill={negative ? "#e66767" : "#3987e5"}
              >
                <title>{`T${h.round} · Trésorerie nette : ${formatEuro(h.netTreasury)}`}</title>
              </rect>
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill="#898781">
                T{h.round}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function MarketShareChart({
  segments,
}: {
  segments: { name: string; share: number }[];
}) {
  if (segments.length === 0) return null;
  const barH = 28;
  const gap = 6;
  const labelW = 110;
  const chartW = 400;
  const totalH = segments.length * (barH + gap) - gap + 8;

  return (
    <figure>
      <figcaption className="mb-2 text-xs text-slate-400">
        Parts de marché par segment
      </figcaption>
      <svg viewBox={`0 0 ${labelW + chartW + 60} ${totalH}`} className="w-full" role="img" aria-label="Parts de marché par segment">
        {segments.map((seg, i) => {
          const y = i * (barH + gap);
          const w = Math.max(2, seg.share * chartW);
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]!;
          return (
            <g key={seg.name}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11" fill="#c3c2b7">
                {seg.name}
              </text>
              <rect x={labelW} y={y} width={chartW} height={barH} rx="4" fill="#1e293b" />
              <rect x={labelW} y={y} width={w} height={barH} rx="4" fill={color} opacity="0.85">
                <title>{`${seg.name} : ${formatPercent(seg.share)}`}</title>
              </rect>
              <text x={labelW + w + 6} y={y + barH / 2 + 4} fontSize="11" fill={color} fontWeight="600">
                {formatPercent(seg.share)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
