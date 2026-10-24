import type { MetadataRoute } from "next";
import { ATELIERS } from "@/config/ateliers";
import { ROLES } from "@/config/ateliers/roles";
import { formationsAvecUnePage } from "@/config/couverture";
import { GUIDES, cheminDuGuide } from "@/config/guides";
import { SITE_URL } from "@/config/site";
import { getPublicCompetitionCodes } from "@/services/competition.service";

/**
 * Le plan du site : les pages publiques, et elles seules.
 *
 * Les fiches des entreprises et des notions sont des sections de leur page
 * (ancres), pas des routes : elles n'ont pas d'entrée propre. Les ateliers, si :
 * chacun a sa page, son dossier élève, un dossier par responsable et ses formulaires.
 */

/** Pages publiques de premier niveau (hors ateliers, listés à part). */
export const PAGES_PUBLIQUES = [
  "/",
  "/jouer",
  "/enseignants",
  "/ecoles",
  "/integration",
  "/entreprises",
  "/animations",
  "/parcours",
  "/fonctionnalites",
  "/notions",
  "/cours",
  "/guide",
  "/guides",
  "/manuel",
  "/orientation",
  "/rendez-vous",
  "/tarifs",
  "/devis",
  "/mentions-legales",
] as const;

const DATE_DE_BUILD = new Date();

/**
 * Les concours publiés ont chacun leur page d'annonce. La lecture en base peut
 * échouer (base indisponible au moment où un moteur demande le plan) : on ne
 * fait alors pas tomber tout le sitemap, on renvoie les pages statiques seules.
 */
async function concoursPublies(): Promise<MetadataRoute.Sitemap> {
  try {
    const codes = await getPublicCompetitionCodes();
    return codes.map((code) => ({
      url: `${SITE_URL}/concours/${code}`,
      lastModified: DATE_DE_BUILD,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PAGES_PUBLIQUES.map((chemin) => ({
    url: `${SITE_URL}${chemin}`,
    lastModified: DATE_DE_BUILD,
    changeFrequency: "monthly",
    priority: chemin === "/" ? 1 : 0.8,
  }));

  const ateliers: MetadataRoute.Sitemap = ATELIERS.flatMap((a) => [
    {
      url: `${SITE_URL}/animations/${a.code}`,
      lastModified: DATE_DE_BUILD,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/animations/${a.code}/dossier`,
      lastModified: DATE_DE_BUILD,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/animations/${a.code}/formulaires`,
      lastModified: DATE_DE_BUILD,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    // Et le dossier de chaque responsable, la direction comprise.
    ...ROLES.map((r) => ({
      url: `${SITE_URL}/animations/${a.code}/dossier/${r.code}`,
      lastModified: DATE_DE_BUILD,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ]);

  // Les quatre guides de prise en main, un par public (/guides/<public>).
  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE_URL}${cheminDuGuide(g.public)}`,
    lastModified: DATE_DE_BUILD,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // La page de chaque diplôme servi : son tableau de couverture (/parcours/<formation>).
  const diplomes: MetadataRoute.Sitemap = formationsAvecUnePage().map((f) => ({
    url: `${SITE_URL}/parcours/${f.code}`,
    lastModified: DATE_DE_BUILD,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...pages, ...guides, ...diplomes, ...ateliers, ...(await concoursPublies())];
}
