import { formaterCodeDeReprise } from "@/config/reprise";

/**
 * LES CODES DE REPRISE, CÔTÉ ORGANISATEUR.
 *
 * Le chemin de secours réel d'une salle de classe, c'est l'enseignant : un
 * élève qui a changé de poste et perdu son code vient le lui demander. Sans
 * cette liste, personne au monde ne pouvait le lui rendre.
 *
 * Elle est repliée par défaut : ce sont des codes personnels, et ils n'ont pas
 * à rester ouverts sur un écran projeté devant la classe.
 */
export function CodesDeReprise({
  codes,
}: {
  codes: { teamLabel: string; pseudo: string; code: string }[];
}) {
  if (codes.length === 0) return null;
  return (
    <details className="carte p-3 sm:p-5">
      <summary className="cursor-pointer text-sm font-semibold text-slate-200">
        Codes de reprise des joueurs ({codes.length})
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Le code personnel de chaque joueur : il lui rend son équipe depuis un autre appareil,
        même après la clôture des inscriptions. Relisez-le à qui l&apos;a perdu. Ne le projetez
        pas devant la classe : celui qui le lit peut jouer à la place de son propriétaire.
      </p>
      <ul className="mt-3 space-y-1.5">
        {codes.map((c) => (
          <li
            key={c.code}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm"
          >
            <span className="text-slate-300">
              <span className="text-amber-200">{c.teamLabel}</span>
              {c.pseudo ? <span className="text-slate-400"> · {c.pseudo}</span> : null}
            </span>
            <span className="font-mono tracking-[0.15em] text-slate-200">
              {formaterCodeDeReprise(c.code)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
