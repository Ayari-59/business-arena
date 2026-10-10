import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { InstallPrompt } from "@/components/install-prompt";
import { BarreDActionMobile } from "@/components/barre-d-action-mobile";

/**
 * Les deux voix typographiques de la maison, auto-hébergées par next/font
 * (aucune requête au chargement).
 *
 *   · Barlow, la grotesque de lecture, porte le texte ET LES TITRES (jeton
 *     `--font-titre`) : droits, en casse de phrase, de 600 à 700. Lot P1 : les
 *     titres ont parlé comme un tableau des scores, en condensé extra-gras
 *     italique capitale ; c'était la voix d'une affiche de compétition, et le
 *     propriétaire vise un produit très haut de gamme. Un titre se pose, il ne
 *     crie pas (règles h1 à h4 dans globals.css, « LES TITRES PARLENT D'UNE
 *     VOIX POSÉE ») ;
 *   · Barlow Condensed, sa version étroite et dense, ne porte plus que ce où
 *     elle excelle : les CHIFFRES qu'on affiche en grand (ardoise, verdict,
 *     podium, résultat estimé) et le surtitre en capitales espacées, le seul
 *     niveau de capitales du site. Droite : l'italique n'est plus chargé.
 *
 * Barlow n'est pas une police variable : on ne charge que les graisses
 * employées. Chacune expose une variable CSS que le thème (@theme) branche sur
 * --font-display, --font-sans et --font-titre, si bien qu'aucun composant n'a
 * à nommer une police.
 */
const policeChiffres = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal"],
  variable: "--font-brand-display",
  display: "swap",
});
const policeTexte = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand-sans",
  display: "swap",
});
import { COULEUR_DU_PAPIER } from "@/config/themes";
import { paletteDuSite } from "@/config/theme-du-site";
import { feuilleDePalette } from "@/config/palettes";
import { getPlatformConfig } from "@/services/admin.service";
import { SITE_URL } from "@/config/site";
import { DESCRIPTION_ACCUEIL, GABARIT_DE_TITRE, NOM_DU_SITE, TITRE_ACCUEIL } from "@/config/seo";

/**
 * Les métadonnées communes. Chaque page donne son titre propre, que le
 * gabarit complète du nom du site ; la page d'accueil, elle, porte le titre
 * entier. L'image de partage vient de opengraph-image.tsx, à côté.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITRE_ACCUEIL, template: GABARIT_DE_TITRE },
  description: DESCRIPTION_ACCUEIL,
  openGraph: { siteName: NOM_DU_SITE, locale: "fr_FR", type: "website", url: SITE_URL },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    // « black-translucent » laisse la page passer sous la barre d'état et en
    // écrit l'heure en BLANC : lisible sur l'encre du thème sombre, invisible
    // depuis que le site s'ouvre en clair. « default » rend une barre opaque à
    // texte foncé, qui va aux deux.
    statusBarStyle: "default",
    title: "Arena",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

/**
 * Le zoom reste libre : un élève malvoyant pince pour agrandir, et rien ne
 * doit l'en empêcher (WCAG 1.4.4). L'installation en application (manifest,
 * service worker) ne dépend pas de cette ligne.
 */
export const viewport: Viewport = {
  // « cover » : la page va jusqu'aux bords du téléphone, encoche comprise. La
  // réserve des bords est posée dans globals.css (safe-area-inset). La couleur
  // de la barre d'état prolonge le papier : une barre qui continue le fond de
  // la page disparaît, et c'est ce qu'on attend d'elle.
  viewportFit: "cover",
  themeColor: COULEUR_DU_PAPIER,
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { theme } = await getPlatformConfig();
  // La palette d'accent se pose par une feuille de style, vide pour celle
  // d'origine : le site d'usine ne reçoit alors pas un octet de plus.
  const feuille = feuilleDePalette(paletteDuSite(theme));

  return (
    <html
      lang="fr"
      data-theme="clair"
      className={`${policeChiffres.variable} ${policeTexte.variable}`}
    >
      <head>
        {feuille ? (
          <style id="palette-d-accent" dangerouslySetInnerHTML={{ __html: feuille }} />
        ) : null}
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {/* Premier élément focusable : au clavier, on saute la navigation. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        {children}
        {/* Invite d'installation, sur mobile uniquement (fermable, mémorisée). */}
        <InstallPrompt />
        <BarreDActionMobile />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")});window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;window.dispatchEvent(new Event("bip-ready"))})`,
          }}
        />
      </body>
    </html>
  );
}
