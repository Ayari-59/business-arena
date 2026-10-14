import Link from "next/link";
import type { Pastille } from "@/config/navigation";

/**
 * LA RANGÉE DE PASTILLES DES ESPACES SOUS COMPTE, dessinée une fois.
 *
 * L'espace enseignant avait ses pastilles, l'établissement une rangée de
 * petits liens gris, l'administration six pages sans menu et un « ← Plateforme »
 * par page : trois styles pour un même geste, aller d'une page de son espace à
 * une autre. Les trois espaces posent maintenant ce composant, et lisent leur
 * rangée dans le plan du site (config/navigation.ts).
 *
 * La page courante porte `aria-current="page"` et le gris clair d'une
 * POSITION, jamais l'orange, qui ne dit que l'action (lot P1). Au doigt,
 * chaque pastille fait 44 px de haut (`pointer-coarse:min-h-11`), comme les
 * entrées du menu du site. Les liens de droite (l'établissement,
 * l'administration, l'espace enseignant) sont des pastilles de même forme,
 * poussées au bout de la rangée : ce sont des sorties de l'espace, pas des
 * pages de l'espace.
 */
export function PastillesDeNavigation({
  label,
  pastilles,
  actif,
  droite = [],
  fin,
  className = "",
}: {
  /** Le nom du repère de navigation, pour une synthèse vocale (« Espace enseignant »). */
  label: string;
  pastilles: readonly Pastille[];
  /** Le code de la page courante ; absent, aucune pastille n'est marquée. */
  actif?: string;
  /** Les sorties de l'espace, au bout de la rangée. */
  droite?: readonly Pastille[];
  /** Ce qui suit les pastilles (les gestes de compte), au bout de la rangée. */
  fin?: React.ReactNode;
  className?: string;
}) {
  const classe = (courante: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1 text-xs transition pointer-coarse:min-h-11 pointer-coarse:px-3.5 pointer-coarse:text-sm ${
      courante
        ? "border-slate-300 bg-white/10 text-slate-50"
        : "border-white/10 text-slate-300 hover:border-white/35 hover:text-slate-50"
    }`;
  const pastille = (p: Pastille) => (
    <Link
      key={p.code}
      href={p.href}
      data-pastille=""
      aria-current={p.code === actif ? "page" : undefined}
      className={classe(p.code === actif)}
    >
      {p.libelle}
    </Link>
  );
  return (
    <nav aria-label={label} data-pastilles="" className={`flex flex-wrap items-center gap-2 ${className}`}>
      {pastilles.map(pastille)}
      {droite.length > 0 ? (
        <span className="ml-auto flex flex-wrap items-center gap-2">{droite.map(pastille)}</span>
      ) : null}
      {fin ? (
        <span className={`flex items-center gap-3 ${droite.length > 0 ? "" : "ml-auto"}`}>{fin}</span>
      ) : null}
    </nav>
  );
}
