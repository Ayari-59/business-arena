import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { InstallPrompt } from "@/components/install-prompt";
import { BarreDActionMobile } from "@/components/barre-d-action-mobile";

/**
 * Les deux voix typographiques de la maison, auto-hébergées par next/font
 * (aucune requête au chargement). Fraunces, un serif de caractère, ne sert
 * qu'aux grands titres (règle h1 dans globals.css) ; Inter Tight, une
 * grotesque nette et un peu resserrée, porte tout le reste. Chacune expose une
 * variable CSS que le thème (@theme) branche sur --font-display et --font-sans,
 * si bien qu'aucun composant n'a à nommer une police.
 */
const policeTitre = Fraunces({
  subsets: ["latin"],
  variable: "--font-brand-display",
  display: "swap",
});
const policeTexte = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-brand-sans",
  display: "swap",
});
import { CLE_THEME, THEMES, couleurDeBarre } from "@/config/themes";
import { accentsDuSite, paletteDuSite, themeParDefaut } from "@/config/theme-du-site";
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
  // de la barre d'état n'est pas ici : elle suit le thème, donc elle se pose
  // dans l'en-tête de la mise en page (voir plus bas).
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Le thème est relu et posé avant le premier affichage. Placé ici, en tête du
  // corps, ce script s'exécute pendant l'analyse du document, donc avant que
  // quoi que ce soit soit peint : sans lui, une page choisie en clair
  // s'ouvrirait en sombre le temps d'un battement. Les codes viennent du
  // registre, pour qu'un thème ajouté n'ait pas à être répété ici.
  const codes = JSON.stringify(THEMES.map((t) => t.code));
  // Le thème d'ouverture se règle depuis l'admin ; en cas de panne de la base,
  // la lecture rend la configuration d'usine, donc le thème d'usine.
  const { theme } = await getPlatformConfig();
  const parDefaut = themeParDefaut(theme);
  // La palette d'accent se pose par une feuille de style, vide pour celle
  // d'origine : le site d'usine ne reçoit alors pas un octet de plus.
  const palette = paletteDuSite(theme);
  const feuille = feuilleDePalette(palette);
  const accents = accentsDuSite(theme);
  // LA BARRE D'ÉTAT DU TÉLÉPHONE PREND LA COULEUR DU THÈME APPLIQUÉ, y compris
  // celui que le visiteur a choisi. Elle est donc posée par l'amorce, avec le
  // thème et avant la première image, et non rendue par React : une balise
  // rendue côté serveur puis corrigée par le script ne correspondrait plus à ce
  // que React attend à l'hydratation, qui en ajouterait une seconde à côté. Le
  // serveur ne connaît pas le choix du visiteur ; il ne peut donc pas la poser.
  const barres = JSON.stringify(
    Object.fromEntries(THEMES.map((t) => [t.code, couleurDeBarre(t.code)])),
  );
  const amorce =
    `var t=${JSON.stringify(parDefaut)};` +
    `try{var c=localStorage.getItem(${JSON.stringify(CLE_THEME)});` +
    `if(${codes}.indexOf(c)>-1){t=c;document.documentElement.dataset.theme=c}}catch(e){}` +
    `var m=document.createElement("meta");m.name="theme-color";m.content=${barres}[t];` +
    `document.head.appendChild(m);`;

  return (
    <html
      lang="fr"
      data-theme={parDefaut}
      className={`${policeTitre.variable} ${policeTexte.variable}`}
    >
      <head>
        {feuille ? (
          <style id="palette-d-accent" dangerouslySetInnerHTML={{ __html: feuille }} />
        ) : null}
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <script dangerouslySetInnerHTML={{ __html: amorce }} />
        {/* Premier élément focusable : au clavier, on saute la navigation. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
        >
          Aller au contenu
        </a>
        <SiteHeader themeParDefaut={parDefaut} accents={accents} />
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
