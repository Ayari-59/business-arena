import { formatEuro, formatPercent } from "@/lib/format";

/**
 * Graphiques SVG serveur, sobres et accessibles (compétence dataviz) :
 * - la palette de la DONNÉE (globals.css, « LA DONNÉE ») : cinq créneaux
 *   d'identité `--serie-1` à `--serie-5`, dans un ORDRE FIXE jamais cyclé ;
 *   `--donnee` reste l'ENCRE de la donnée et `--donnee-2` le NEUTRE de
 *   référence ; le vert et le rouge pour le seul signe. Elle suit le fond :
 *   foncée sur le papier, claire sur le marine. Le bleu vif #3987e5 et
 *   l'orange #d95926 (la couleur de l'action) sont partis depuis longtemps ;
 * - la série de L'ENTREPRISE DU JOUEUR prend la teinte de son métier
 *   (`--metier`, lot 5A) : c'est le seul endroit où la couleur dit « vous ».
 *   Hors d'une partie (tableaux de l'enseignant), elle retombe sur l'encre ;
 * - un seul axe (tout est en €), légende dès 2 séries, étiquettes directes
 *   sur le dernier point, grille discrète, <title> natifs comme couche de
 *   survol, et un trait PLUS ÉPAIS pour la série du joueur : son identité ne
 *   repose jamais sur la seule couleur.
 */

/** La série de l'entreprise du joueur : la teinte de son métier. */
const MOI = "var(--metier, var(--donnee))";
/**
 * Les cinq créneaux d'identité, dans l'ordre. Une sixième série ne reprend pas
 * le premier créneau : elle passe au neutre de référence, et son nom la dit.
 */
export const CRENEAUX = [
  "var(--serie-1)",
  "var(--serie-2)",
  "var(--serie-3)",
  "var(--serie-4)",
  "var(--serie-5)",
];
const NEUTRE = "var(--donnee-2)";
const creneau = (i: number) => CRENEAUX[i] ?? NEUTRE;
const NEGATIF = "var(--color-red-400)";
const POSITIF = "var(--color-emerald-400)";
const FILET = "var(--filet-carte)";

/**
 * Sparkline SVG miniature pour les KPI cards : un trait fin de 48×16,
 * coloré selon la tendance (dernier point vs premier). La tendance est un
 * SIGNE, pas une identité : c'est le seul endroit où le vert et le rouge
 * entrent dans un tracé.
 */
export function Sparkline({
  data,
  width = 48,
  height = 16,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map(
    (v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`,
  );
  const trending = data[data.length - 1]! >= data[0]!;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block align-middle"
    >
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
  const x = (round: number) => PAD.left + ((round - 1) / Math.max(1, roundsCount - 1)) * innerW;
  const y = (v: number) => PAD.top + scale([v], min, max, innerH, true)[0]!;
  const path = (key: "revenue" | "netIncome") =>
    history
      .map((h, i) => `${i === 0 ? "M" : "L"}${x(h.round).toFixed(1)},${y(h[key]).toFixed(1)}`)
      .join(" ");
  const last = history.at(-1)!;

  return (
    <figure>
      {/* LE CHIFFRE D'AFFAIRES EST LA SÉRIE DE L'ENTREPRISE : il prend la
          teinte du métier, et son trait est plus épais. Le résultat net, qui
          est une seconde mesure de la même maison, prend le premier créneau. */}
      <figcaption className="mb-2 flex items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-md" style={{ background: MOI }} /> Chiffre
          d&apos;affaires
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-md" style={{ background: creneau(0) }} /> Résultat net
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Évolution du chiffre d'affaires et du résultat net par tour"
      >
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(0)}
          y2={y(0)}
          style={{ stroke: FILET }}
          strokeWidth="1"
        />
        {history.map((h) => (
          <g key={h.round}>
            <text
              x={x(h.round)}
              y={H - 6}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-slate-400"
            >
              T{h.round}
            </text>
          </g>
        ))}
        <path
          d={path("revenue")}
          fill="none"
          style={{ stroke: MOI }}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d={path("netIncome")}
          fill="none"
          style={{ stroke: creneau(0) }}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {history.map((h) => (
          <g key={h.round}>
            <circle cx={x(h.round)} cy={y(h.revenue)} r="3.5" style={{ fill: MOI }}>
              <title>{`T${h.round} · CA : ${formatEuro(h.revenue)}`}</title>
            </circle>
            <circle cx={x(h.round)} cy={y(h.netIncome)} r="3.5" style={{ fill: creneau(0) }}>
              <title>{`T${h.round} · Résultat : ${formatEuro(h.netIncome)}`}</title>
            </circle>
          </g>
        ))}
        <text
          x={x(last.round) + 8}
          y={y(last.revenue) + 3}
          fontSize="10"
          fill="currentColor"
          className="text-slate-300"
        >
          {formatEuro(last.revenue)}
        </text>
        <text
          x={x(last.round) + 8}
          y={y(last.netIncome) + 3}
          fontSize="10"
          fill="currentColor"
          className="text-slate-300"
        >
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
      {/* Une seule série : pas de légende, le titre la nomme. Les barres sont
          celles de l'entreprise, à la teinte de son métier ; le découvert, qui
          est un SIGNE, garde le rouge franc. */}
      <figcaption className="mb-2 text-xs text-slate-400">
        Trésorerie nette par tour (négatif = découvert bancaire)
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Trésorerie nette par tour"
      >
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(0)}
          y2={y(0)}
          style={{ stroke: FILET }}
          strokeWidth="1"
        />
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
                style={{ fill: negative ? NEGATIF : MOI }}
              >
                <title>{`T${h.round} · Trésorerie nette : ${formatEuro(h.netTreasury)}`}</title>
              </rect>
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-slate-400"
              >
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
 *
 * LES SEGMENTS SONT DES CATÉGORIES : ils prennent les cinq créneaux de la
 * palette dans l'ordre, et jamais les teintes des métiers, qui disent
 * désormais QUELLE ENTREPRISE on joue. Au-delà de cinq, la sixième clientèle
 * ne reprend pas la première teinte : elle passe au neutre de référence, et
 * son nom, écrit en clair devant la barre, continue de l'identifier.
 */
export function MarketShareChart({ segments }: { segments: { name: string; share: number }[] }) {
  if (segments.length === 0) return null;
  return (
    <figure>
      <figcaption className="mb-2 text-xs text-slate-400">Parts de marché par segment</figcaption>
      <ul className="space-y-2" aria-label="Parts de marché par segment">
        {segments.map((seg, i) => (
          <li key={seg.name} className="text-sm">
            <div className="flex items-baseline justify-between gap-3 text-slate-300">
              <span className="min-w-0">
                <span
                  aria-hidden
                  className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ backgroundColor: creneau(i) }}
                />
                {seg.name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-100">
                {formatPercent(seg.share)}
              </span>
            </div>
            <div className="mt-0.5 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(2, Math.min(100, seg.share * 100))}%`,
                  backgroundColor: creneau(i),
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
