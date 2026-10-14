import { formatDecimal } from "@/lib/format";
import { NOTE_MAX, type CritereDesPairs } from "@/config/pairs/criteres";

/**
 * LES MOYENNES REÇUES, CRITÈRE PAR CRITÈRE : une barre par critère, sur l'échelle entière
 * (de zéro au maximum), le chiffre en clair à droite. La couleur ne dit rien seule : la
 * donnée est à l'encre des données, l'auto-évaluation, quand elle est montrée, est un
 * repère à part, en gris, nommé dans la légende.
 */
export function BarresDesMoyennes({
  criteres,
  moyennes,
  auto = null,
}: {
  criteres: readonly CritereDesPairs[];
  moyennes: Readonly<Record<string, number | null>>;
  auto?: Readonly<Record<string, number>> | null;
}) {
  return (
    <ul className="grid gap-3" data-moyennes-recues="">
      {criteres.map((c) => {
        const m = moyennes[c.code] ?? null;
        const soi = auto?.[c.code] ?? null;
        return (
          <li key={c.code} className="grid gap-1" data-critere={c.code}>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 text-slate-200">{c.libelle}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-50">
                {m === null ? "—" : `${formatDecimal(m, 1)} sur ${NOTE_MAX}`}
              </span>
            </span>
            <span className="relative block h-2.5 overflow-hidden rounded-full bg-white/5" aria-hidden>
              {m !== null ? (
                <span
                  className="block h-full rounded-full bg-[var(--donnee)]"
                  style={{ width: `${Math.round((100 * m) / NOTE_MAX)}%` }}
                />
              ) : null}
              {soi !== null ? (
                <span
                  className="absolute inset-y-0 w-0.5 bg-[var(--donnee-2)]"
                  style={{ left: `calc(${Math.round((100 * soi) / NOTE_MAX)}% - 1px)` }}
                />
              ) : null}
            </span>
            {soi !== null ? (
              <span className="text-sm text-slate-400">Votre propre note : {formatDecimal(soi, 0)}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
