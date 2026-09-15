import Link from "next/link";

/**
 * L'EN-TÊTE DE L'ESPACE ENSEIGNANT, écrit une fois.
 *
 * Chaque page de l'espace se présentait à sa façon : surtitre « Espace
 * enseignant » ici, « Business Arena » là, une navigation en petits liens
 * soulignés sur le tableau de bord et un simple « ← Retour » ailleurs. L'arène,
 * elle, a un visage : une tuile, un surtitre coloré, un titre en serif, des
 * pastilles à droite. L'espace enseignant reprend la même anatomie, pour que
 * l'enseignant qui passe de sa partie à l'écran de ses élèves reste dans le
 * même lieu.
 *
 * La navigation est une rangée de pastilles, la page courante en ambre : on
 * voit où l'on est et où l'on peut aller, sans avoir à lire une liste de liens.
 */
export type PageEnseignant = "parties" | "scenarios" | "usage" | "apprentissages";

const NAVIGATION: ReadonlyArray<{ code: PageEnseignant; href: string; label: string }> = [
  { code: "parties", href: "/teacher", label: "Mes parties" },
  { code: "scenarios", href: "/teacher/scenarios", label: "Mes scénarios" },
  { code: "usage", href: "/teacher/usage", label: "Carnet d'usage" },
  { code: "apprentissages", href: "/teacher/learning", label: "Progression" },
];

export function EnTeteEnseignant({
  surtitre = "Espace enseignant",
  titre,
  description,
  actif,
  tuile,
  accent = "text-amber-400",
  liens = {},
  droite,
  compte,
}: {
  surtitre?: string;
  titre: React.ReactNode;
  description?: React.ReactNode;
  /** La page courante, mise en ambre dans la navigation. Absente : page hors navigation. */
  actif?: PageEnseignant;
  /** Une tuile à gauche du titre (icône du secteur, comme dans l'arène). */
  tuile?: React.ReactNode;
  /** Couleur du surtitre : celle du secteur quand la page en a un. */
  accent?: string;
  liens?: { etablissement?: boolean; administration?: boolean };
  /** Pastilles et frise à droite du titre. */
  droite?: React.ReactNode;
  /** Les gestes de compte (déconnexion), sous la navigation. */
  compte?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          {tuile}
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${accent}`}>{surtitre}</p>
            <h1 className="text-2xl font-bold text-slate-50">{titre}</h1>
          </div>
        </div>
        {droite ? <div className="flex flex-wrap items-center gap-2">{droite}</div> : null}
      </div>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      ) : null}
      <nav aria-label="Espace enseignant" className="flex flex-wrap items-center gap-2">
        {NAVIGATION.map((n) => (
          <Link
            key={n.code}
            href={n.href}
            aria-current={n.code === actif ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              n.code === actif
                ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                : "border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-amber-300"
            }`}
          >
            {n.label}
          </Link>
        ))}
        {liens.etablissement ? (
          <Link
            href="/org"
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Mon établissement
          </Link>
        ) : null}
        {liens.administration ? (
          <Link
            href="/admin"
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Administration
          </Link>
        ) : null}
        {compte ? <span className="ml-auto flex items-center gap-3">{compte}</span> : null}
      </nav>
    </header>
  );
}

/**
 * Une rubrique : le mot qui coiffe un groupe de blocs. L'observation de séance
 * en a déjà (« Participation, tour par tour »), la page de partie n'en avait
 * aucune : dix blocs identiques, sans rythme. Trois ou quatre rubriques
 * disent l'ordre de la séance avant même de lire les titres.
 */
export function Rubrique({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="flex items-baseline gap-3 pt-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">{children}</h2>
      {note ? <span className="text-xs text-slate-400">{note}</span> : null}
      <span aria-hidden className="h-px flex-1 bg-white/10" />
    </div>
  );
}
