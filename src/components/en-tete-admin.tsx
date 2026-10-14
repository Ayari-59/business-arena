import { LIEN_ESPACE_ENSEIGNANT, NAVIGATION_ADMIN } from "@/config/navigation";
import { PastillesDeNavigation } from "@/components/pastilles-de-navigation";

/**
 * L'EN-TÊTE DE L'ADMINISTRATION GÉNÉRALE, écrit une fois.
 *
 * Sept pages, et chacune portait son en-tête : un surtitre en laiton ici, en
 * gris là, un « ← Plateforme » pour revenir et rien pour aller ailleurs. La
 * rangée de pastilles de l'espace enseignant s'y pose maintenant, lue dans le
 * plan du site (`NAVIGATION_ADMIN`, dans l'ordre d'usage), la page courante
 * marquée, et au bout l'espace enseignant.
 *
 * Le surtitre prend la classe `.surtitre` de la feuille (petites capitales,
 * gris) et non un orange ou une classe écrite ici : l'orange ne dit que
 * l'action, et les inscrits comme les offres sont dans le périmètre de cette
 * garde (tests/architecture/orange-de-l-action.test.ts).
 */
export function EnTeteAdmin({
  surtitre = "Administration générale",
  titre,
  actif,
  sommaire,
}: {
  surtitre?: string;
  titre: React.ReactNode;
  /** Le code de la page courante dans `NAVIGATION_ADMIN`. */
  actif: string;
  /** Un sommaire propre à la page (les rubriques des offres), sous les pastilles. */
  sommaire?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      <div className="min-w-0">
        <p className="surtitre">{surtitre}</p>
        <h1 className="break-words text-2xl font-bold text-slate-50">{titre}</h1>
      </div>
      <PastillesDeNavigation
        label="Administration"
        pastilles={NAVIGATION_ADMIN}
        actif={actif}
        droite={[LIEN_ESPACE_ENSEIGNANT]}
      />
      {sommaire}
    </header>
  );
}
