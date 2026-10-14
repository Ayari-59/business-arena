import {
  LIEN_ADMINISTRATION,
  LIEN_ETABLISSEMENT,
  NAVIGATION_ENSEIGNANT,
  type Pastille,
} from "@/config/navigation";
import { PastillesDeNavigation } from "@/components/pastilles-de-navigation";

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
 * La navigation est une rangée de pastilles, lue dans le plan du site
 * (config/navigation.ts, `NAVIGATION_ENSEIGNANT`) et dessinée par le composant
 * partagé des espaces : la page courante est marquée, on voit où l'on est et
 * où l'on peut aller sans lire une liste de liens.
 */
export type PageEnseignant = "parties" | "examens" | "cohortes" | "scenarios" | "usage" | "aide";

export function EnTeteEnseignant({
  surtitre = "Espace enseignant",
  titre,
  description,
  actif,
  tuile,
  liens = {},
  droite,
  compte,
}: {
  surtitre?: string;
  titre: React.ReactNode;
  description?: React.ReactNode;
  /** La page courante, marquée dans la navigation. Absente : page hors navigation. */
  actif?: PageEnseignant;
  /**
   * Une tuile à gauche du titre (pictogramme du secteur, comme dans l'arène).
   * C'est ELLE qui porte la couleur du secteur, et elle seule : le surtitre
   * prenait aussi cette couleur, et « PILOTAGE DE PARTIE · INDUSTRIE » en bleu
   * parlait une autre langue que les surtitres en laiton du reste du site.
   */
  tuile?: React.ReactNode;
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
            <p className="text-xs uppercase tracking-annonce text-amber-400">{surtitre}</p>
            <h1 className="text-2xl font-bold text-slate-50">{titre}</h1>
          </div>
        </div>
        {droite ? <div className="flex flex-wrap items-center gap-2">{droite}</div> : null}
      </div>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      ) : null}
      <NavigationEnseignant actif={actif} liens={liens} compte={compte} />
    </header>
  );
}

/**
 * La navigation de l'espace, seule : la rangée de pastilles, la page courante
 * mise en avant, et à droite les sorties vers l'établissement (pour qui
 * l'administre) et vers l'administration générale (pour le propriétaire). Une
 * page qui pose l'en-tête commun des pages intérieures (« Mes parties ») la
 * place sous son chapeau ; les autres la reçoivent avec l'en-tête enseignant.
 */
export function NavigationEnseignant({
  actif,
  liens = {},
  compte,
  className = "",
}: {
  actif?: PageEnseignant;
  liens?: { etablissement?: boolean; administration?: boolean };
  compte?: React.ReactNode;
  className?: string;
}) {
  const droite: Pastille[] = [
    ...(liens.etablissement ? [LIEN_ETABLISSEMENT] : []),
    ...(liens.administration ? [LIEN_ADMINISTRATION] : []),
  ];
  return (
    <PastillesDeNavigation
      label="Espace enseignant"
      pastilles={NAVIGATION_ENSEIGNANT}
      actif={actif}
      droite={droite}
      fin={compte}
      className={className}
    />
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
      <h2 className="text-xs font-semibold uppercase tracking-surtitre text-amber-400">
        {children}
      </h2>
      {note ? <span className="text-xs text-slate-400">{note}</span> : null}
      <span aria-hidden className="h-px flex-1 bg-white/10" />
    </div>
  );
}
