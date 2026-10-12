import { SEUILS_DE_NIVEAU, nomDuNiveau, type NiveauDeCompetence } from "@/config/examen/competences";

/**
 * LES GRAPHIQUES DE L'EXAMEN INDIVIDUEL : la distribution des notes, les compétences de la
 * promotion, le relevé d'un candidat. Les couleurs sont des jetons de la palette des
 * données (garde : tests/architecture/palette-des-donnees.test.ts) ; chaque graphique
 * porte aussi ses valeurs en texte (un tableau lisible sans la couleur, et à l'impression).
 */

const pourcent = (x: number) => `${Math.round(x * 100)} %`;

/** L'histogramme des notes, par tranches de dix points. */
export function HistogrammeDesNotes({ histogramme }: { histogramme: readonly { de: number; a: number; n: number }[] }) {
  const max = Math.max(1, ...histogramme.map((h) => h.n));
  const total = histogramme.reduce((s, h) => s + h.n, 0);
  const L = 300;
  const H = 120;
  const pas = L / histogramme.length;
  return (
    <figure data-histogramme="" className="grid gap-2">
      <svg viewBox={`0 0 ${L} ${H + 18}`} role="img" aria-label={`Distribution des ${total} notes, par tranches de dix points`} className="w-full max-w-xl">
        <line x1={0} x2={L} y1={H} y2={H} stroke="var(--donnee-2)" strokeWidth={1} />
        {histogramme.map((h, i) => {
          const hauteur = (h.n / max) * (H - 14);
          return (
            <g key={h.de}>
              <rect x={i * pas + 3} y={H - hauteur} width={pas - 6} height={hauteur} rx={2} fill="var(--donnee)" />
              {h.n > 0 ? (
                <text x={i * pas + pas / 2} y={H - hauteur - 3} textAnchor="middle" fontSize={9} fill="currentColor">
                  {h.n}
                </text>
              ) : null}
              <text x={i * pas + pas / 2} y={H + 12} textAnchor="middle" fontSize={8} fill="currentColor">
                {h.de}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-xs text-slate-400">Notes sur 100, par tranches de dix points (la dernière comprend 100).</figcaption>
    </figure>
  );
}

/** Les compétences de la promotion : la moyenne, et la part qui atteint le seuil. */
export function CompetencesDeLaPromotion({
  competences,
}: {
  competences: readonly { code: string; nom: string; moyenne: number; atteinte: number; evalues: number }[];
}) {
  return (
    <ul data-competences-de-la-promotion="" className="grid gap-3">
      {competences.map((c) => (
        <li key={c.code} className="grid gap-1">
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <span className="font-semibold text-slate-100">{c.nom}</span>
            <span className="tabular-nums text-slate-300">
              moyenne {pourcent(c.moyenne)} · {pourcent(c.atteinte)} au seuil
            </span>
          </p>
          <Barre part={c.moyenne} />
        </li>
      ))}
    </ul>
  );
}

/** Une barre de 0 à 100 %, le seuil d'atteinte marqué d'un trait. */
function Barre({ part }: { part: number }) {
  const p = Math.min(1, Math.max(0, part));
  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden className="h-2.5 w-full">
      <rect x={0} y={0} width={100} height={8} rx={2} fill="var(--voile-neutre)" />
      <rect x={0} y={0} width={p * 100} height={8} rx={2} fill="var(--donnee)" />
      <line x1={SEUILS_DE_NIVEAU.acquis * 100} x2={SEUILS_DE_NIVEAU.acquis * 100} y1={0} y2={8} stroke="var(--donnee-2)" strokeWidth={0.8} />
    </svg>
  );
}

/** Le relevé d'un candidat : une ligne par compétence, sa part et son niveau. */
export function ReleveDesCompetences({
  competences,
}: {
  competences: readonly { code: string; nom: string; part: number; niveau: NiveauDeCompetence }[];
}) {
  return (
    <ul data-releve-des-competences="" className="grid gap-3">
      {competences.map((c) => (
        <li key={c.code} data-competence={c.code} data-niveau={c.niveau} className="grid gap-1">
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <span className="font-semibold text-slate-100">{c.nom}</span>
            <span className="tabular-nums text-slate-300">
              {pourcent(c.part)} · <strong className="font-semibold text-slate-100">{nomDuNiveau(c.niveau)}</strong>
            </span>
          </p>
          <Barre part={c.part} />
        </li>
      ))}
    </ul>
  );
}
