import Link from "next/link";
import { bouton } from "@/components/bouton";
import type { PartieEnCours } from "@/services/partie-en-cours.service";

/**
 * « REPRENDRE MA PARTIE » : ce que voit celui qui revient.
 *
 * La partie est en base, tour après tour ; il suffisait de la lui montrer. Sans
 * cette carte, le joueur qui rouvrait l'application tombait sur « Lancez votre
 * première partie » et en recommençait une — l'ancienne restait là, perdue
 * pour lui.
 *
 * Composant sans état : la page /jouer le rend côté serveur, l'accueil — qui
 * reste statique — le rend côté client une fois la liste lue.
 */
export function ReprendreMaPartie({
  parties,
  className = "",
}: {
  parties: PartieEnCours[];
  className?: string;
}) {
  if (parties.length === 0) return null;
  return (
    <section
      aria-labelledby="reprendre-titre"
      data-reprendre-ma-partie
      className={`rounded-xl border border-amber-400/30 bg-slate-900/80 p-4 shadow-xl shadow-black/30 ring-1 ring-amber-400/10 sm:p-5 ${className}`}
    >
      <h2
        id="reprendre-titre"
        className="text-xs font-semibold uppercase tracking-surtitre text-amber-300"
      >
        {parties.length > 1 ? "Vos parties en cours" : "Votre partie en cours"}
      </h2>
      <ul className="mt-3 space-y-3">
        {parties.map((p) => (
          <li key={p.gameId} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-50">{p.entreprise}</p>
              <p className="mt-0.5 text-sm tabular-nums text-slate-400">
                Tour {p.tour} sur {p.tours}
              </p>
              <div
                aria-hidden="true"
                className="mt-2 flex gap-1"
              >
                {Array.from({ length: p.tours }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-5 rounded-full ${i < p.tour ? "bg-amber-400" : "bg-white/10"}`}
                  />
                ))}
              </div>
            </div>
            <Link
              href={`/arena/${p.gameId}`}
              className={`${bouton({ taille: "m" })} shrink-0 pointer-coarse:min-h-11`}
            >
              Reprendre
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
