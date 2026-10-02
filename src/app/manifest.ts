import type { MetadataRoute } from "next";
import { couleurDeBarre } from "@/config/themes";
import { themeParDefaut } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";

/**
 * Le manifeste de l'application installée.
 *
 * Il était un fichier statique, dont le fond d'écran de démarrage et la couleur
 * de barre datent d'avant la charte : ils ne ressemblaient plus au site. Il est
 * maintenant lu de la configuration : l'écran de démarrage s'ouvre sur le fond
 * du thème d'ouverture, que l'administrateur règle dans /admin/theme. Un
 * manifeste ne se lit qu'à l'installation et au démarrage : le rendre à la
 * demande ne coûte rien, et évite d'avoir à l'invalider à chaque réglage.
 */
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { theme } = await getPlatformConfig();
  const fond = couleurDeBarre(themeParDefaut(theme));
  return {
    id: "/",
    name: "Business Arena",
    short_name: "Arena",
    description:
      "Simulation, apprentissage, aide à la décision et compétition en management",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: fond,
    theme_color: fond,
    orientation: "any",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
