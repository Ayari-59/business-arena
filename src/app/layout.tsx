import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { CLE_THEME, THEMES, THEME_PAR_DEFAUT } from "@/config/themes";

export const metadata: Metadata = {
  title: "BUSINESS ARENA",
  description:
    "Simulation, apprentissage, aide à la décision et compétition en management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Le thème est relu et posé avant le premier affichage. Placé ici, en tête du
  // corps, ce script s'exécute pendant l'analyse du document, donc avant que
  // quoi que ce soit soit peint : sans lui, une page choisie en clair
  // s'ouvrirait en sombre le temps d'un battement. Les codes viennent du
  // registre, pour qu'un thème ajouté n'ait pas à être répété ici.
  const codes = JSON.stringify(THEMES.map((t) => t.code));
  const amorce =
    `try{var c=localStorage.getItem(${JSON.stringify(CLE_THEME)});` +
    `if(${codes}.indexOf(c)>-1)document.documentElement.dataset.theme=c}catch(e){}`;

  return (
    <html lang="fr" data-theme={THEME_PAR_DEFAUT}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <script dangerouslySetInnerHTML={{ __html: amorce }} />
        {/* Premier élément focusable : au clavier, on saute la navigation. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")});window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;window.dispatchEvent(new Event("bip-ready"))})`,
          }}
        />
      </body>
    </html>
  );
}
