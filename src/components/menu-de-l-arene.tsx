import Link from "next/link";
import { LIBELLE_QUITTER_LA_PARTIE, NAVIGATION_ARENE } from "@/config/navigation";

/**
 * LE PETIT MENU DE L'ARÈNE, le même sur ordinateur et dans le menu du téléphone.
 *
 * L'élève avait, sous son profil, trois liens nus (« Mon profil et ma
 * progression », « Fiches notions », « Guide de l'étudiant »), et dans le menu
 * de la barre du téléphone six autres, dont un « Guide » tout court et un
 * « Accueil du site » : deux listes, deux vocabulaires. Les liens vivent dans
 * le plan du site (`NAVIGATION_ARENE`, sous les mots du plan), et ce composant
 * les dessine aux deux endroits, suivis de « Quitter la partie », qui mène là
 * d'où l'élève vient : l'écran de lancement en solo, l'accueil en classe,
 * l'examen pour un candidat. Le cockpit, la feuille et le bilan ne sont pas
 * touchés : seuls les liens de navigation le sont.
 */
export function MenuDeLArene({
  retour,
  forme,
}: {
  /** Où mène « Quitter la partie » : le même chemin que la flèche de la barre du téléphone. */
  retour: string;
  /** « ligne » : les liens à la suite, sous le profil ; « liste » : un par ligne, dans le menu du téléphone. */
  forme: "ligne" | "liste";
}) {
  const liens = [...NAVIGATION_ARENE, { href: retour, libelle: LIBELLE_QUITTER_LA_PARTIE }];
  if (forme === "liste") {
    return (
      <>
        {liens.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            {...(lien.href === "/guides/etudiant" ? { "data-lien-guide-etudiant": "" } : {})}
            className="flex min-h-11 items-center rounded-lg px-3 text-base text-slate-200 transition hover:bg-white/5"
          >
            {lien.libelle}
          </Link>
        ))}
      </>
    );
  }
  return (
    <nav
      aria-label="Menu de la partie"
      data-menu-de-l-arene=""
      className="flex flex-wrap gap-x-4 text-xs text-slate-400 max-sm:hidden"
    >
      {liens.map((lien) => (
        <Link
          key={lien.href}
          href={lien.href}
          {...(lien.href === "/guides/etudiant" ? { "data-lien-guide-etudiant": "" } : {})}
          className="underline-offset-4 hover:text-slate-300 hover:underline pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          {lien.libelle}
        </Link>
      ))}
    </nav>
  );
}
