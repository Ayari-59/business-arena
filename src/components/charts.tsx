import { formatEuro, formatPercent } from "@/lib/format";

/**
 * Graphiques SVG serveur, sobres et accessibles (skill dataviz) :
 * - la palette de la DONNÉE (globals.css, « LA DONNÉE ») : série principale en
 *   bleu donnée `--donnee`, seconde série en gris ardoise `--donnee-2`, le
 *   rouge pour le seul signe négatif, les catégories en `--secteur-*`. Elle
 *   suit le fond : foncée sur le papier, claire sur le marine. Le bleu vif
 *   #3987e5 et l'orange #d95926 (la couleur de l'action) sont partis ;
 * - un seul axe (tout est en €), légende dès 2 séries, labels directs sur le
 *   dernier point, grille discrète, <title> natifs comme couche de survol.
 */
const SERIE_1 = "var(--donnee)";
const SERIE_2 = "var(--donnee-2)";
const NEGATIF = "var(--color-red-400)";
const POSITIF = "var(--color-emerald-400)";
const FILET = "var(--filet-carte)";

/**
 * Sparkline SVG miniature pour les KPI cards : un trait fin de 48×16,
 * coloré selon la tendance (dernier point vs premier).
 */
export function Sparkline({ data, width = 48, height = 16 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`);
  const trending = data[data.length - 1]! >= data[0]!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block align-middle">
      <polyline
        points={points.join(" ")}
        fill="none"
        style={{ stroke: trending ? POSITIF : NEGATIF }}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={((data.length - 1) * step).toFixed(1)}
        cy={(height - ((data[data.length - 1]! - min) / range) * height).toFixed(1)}
        r="2"
        style={{ fill: trending ? POSITIF : NEGATIF }}
      />
    </svg>
  );
}

/** Les catégories (segments de marché) : les teintes désaturées des métiers. */
const SEGMENT_COLORS = [
  "var(--secteur-hotellerie)", "var(--secteur-industrie)", "var(--secteur-ecommerce)",
  "var(--secteur-services)", "var(--secteur-restauration)", "var(--secteur-commerce)",
  "var(--secteur-abonnement)", "var(--secteur-transport)",
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
          <span className="h-0.5 w-4 rounded-md" style={{ background: SERIE_1 }} /> Chiffre d&apos;affaires
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-md" style={{ background: SERIE_2 }} /> Résultat net
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution du chiffre d'affaires et du résultat net par tour">
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} style={{ stroke: FILET }} strokeWidth="1" />
        {history.map((h) => (
          <g key={h.round}>
            <text x={x(h.round)} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-400">
              T{h.round}
            </text>
          </g>
        ))}
        <path d={path("revenue")} fill="none" style={{ stroke: SERIE_1 }} strokeWidth="2" strokeLinejoin="round" />
        <path d={path("netIncome")} fill="none" style={{ stroke: SERIE_2 }} strokeWidth="2" strokeLinejoin="round" />
        {history.map((h) => (
          <g key={h.round}>
            <circle cx={x(h.round)} cy={y(h.revenue)} r="3.5" style={{ fill: SERIE_1 }}>
              <title>{`T${h.round} · CA : ${formatEuro(h.revenue)}`}</title>
            </circle>
            <circle cx={x(h.round)} cy={y(h.netIncome)} r="3.5" style={{ fill: SERIE_2 }}>
              <title>{`T${h.round} · Résultat : ${formatEuro(h.netIncome)}`}</title>
            </circle>
          </g>
        ))}
        <text x={x(last.round) + 8} y={y(last.revenue) + 3} fontSize="10" fill="currentColor" className="text-slate-300">
          {formatEuro(last.revenue)}
        </text>
        <text x={x(last.round) + 8} y={y(last.netIncome) + 3} fontSize="10" fill="currentColor" className="text-slate-300">
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
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} style={{ stroke: FILET }} strokeWidth="1" />
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
                style={{ fill: negative ? NEGATIF : SERIE_1 }}
              >
                <title>{`T${h.round} · Trésorerie nette : ${formatEuro(h.netTreasury)}`}</title>
              </rect>
              <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-400">
                T{h.round}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/**
 * LES PARTS DE MARCHÉ, EN BARRES DE TEXTE. Le dessin était un SVG de 570 unités de large : réduit
 * à un téléphone, ses libellés tombaient à 6 px et « Étudiants (sensibles au prix) » se coupait
 * en « nts (sensibles au prix) ». Chaque ligne dit maintenant son nom en clair, sa part à droite,
 * et la barre dessous : lisible à toute largeur, et le lecteur d'écran lit une liste.
 */
export function MarketShareChart({
  segments,
}: {
  segments: { name: string; share: number }[];
}) {
  if (segments.length === 0) return null;
  return (
    <figure>
      <figcaption className="mb-2 text-xs text-slate-400">Parts de marché par segment</figcaption>
      <ul className="space-y-2" aria-label="Parts de marché par segment">
        {segments.map((seg, i) => {
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]!;
          return (
            <li key={seg.name} className="text-sm">
              <div className="flex items-baseline justify-between gap-3 text-slate-300">
                <span className="min-w-0">{seg.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-100">
                  {formatPercent(seg.share)}
                </span>
              </div>
              <div className="mt-0.5 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.max(2, Math.min(100, seg.share * 100))}%`, backgroundColor: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
