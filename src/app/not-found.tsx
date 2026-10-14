import type { Metadata } from "next";
import Link from "next/link";
import { bouton } from "@/components/bouton";

/**
 * La page introuvable (404).
 *
 * Sans elle, une adresse erronée — ou un lien de partie dont le cookie invité
 * a expiré — tombait sur le « 404 | This page could not be found » brut de
 * Next : en anglais, sans style, sans issue. On la remplace par une page
 * française qui rend la main : l'accueil, le lancement d'une partie, ou
 * rejoindre une partie de classe par code.
 *
 * `robots: noindex` : une page d'erreur n'a rien à faire dans un index.
 */
export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-12 text-center"
    >
      <p className="text-sm font-semibold uppercase tracking-annonce text-amber-300">Erreur 404</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-50">Cette page n&apos;existe pas</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        L&apos;adresse est peut-être erronée, ou la page a été déplacée. Si vous
        suiviez un lien de partie, votre session a pu expirer sur cet appareil.
      </p>
      {/* Trois boutons de la même hauteur, libellés sur une ligne : le
          principal, et deux secondaires à filet. Ils étaient de trois
          dessins (plein, contour orange, contour gris), et « Retour à
          l'accueil » passait sur deux lignes. */}
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className={`${bouton({ taille: "m" })} min-h-11 whitespace-nowrap px-5`}
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/jouer"
          className={`${bouton({ variante: "secondaire", taille: "m" })} min-h-11 whitespace-nowrap px-5`}
        >
          Lancer une partie
        </Link>
        <Link
          href="/join"
          className={`${bouton({ variante: "secondaire", taille: "m" })} min-h-11 whitespace-nowrap px-5`}
        >
          Rejoindre par code
        </Link>
      </div>
    </main>
  );
}
