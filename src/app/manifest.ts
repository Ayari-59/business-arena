import type { MetadataRoute } from "next";
import { COULEUR_DU_PAPIER } from "@/config/themes";

/**
 * Le manifeste de l'application installée.
 *
 * Il était un fichier statique, dont le fond d'écran de démarrage et la couleur
 * de barre datent d'avant la charte : ils ne ressemblaient plus au site. Il est
 * maintenant engendré : l'écran de démarrage et la barre d'état prennent
 * l'ivoire du papier, le seul fond du site depuis qu'il n'a plus qu'un
 * habillage.
 */
export default function manifest(): MetadataRoute.Manifest {
  const fond = COULEUR_DU_PAPIER;
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
