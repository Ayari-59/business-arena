import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";

/**
 * CHAQUE PAGE PUBLIQUE SE PRÉSENTE : TITRE PROPRE, DESCRIPTION, CANONIQUE.
 *
 * Mesuré en production : « BUSINESS ARENA » comme titre sur /, /notions,
 * /join, /teacher ; aucune balise Open Graph ni Twitter ; pas de canonical ;
 * une description de douze mots sans public ni matière. Un lien partagé
 * s'affichait sans titre ni image.
 *
 * Les pages importent des services qui importent la base : on la remplace
 * par un objet vide, seules leurs métadonnées nous intéressent ici.
 */

vi.mock("@/db", () => ({ db: {} }));

const APP = join(process.cwd(), "src", "app");

/**
 * Importer une page charge tout ce qu'elle importe : seuls, l'accueil et /jouer
 * dépassent les cinq secondes par défaut de vitest (mesuré en octobre 2026, avant comme
 * après le lot de l'année du cours). Le temps est celui de l'import, pas celui de
 * l'assertion.
 */
const IMPORT_D_UNE_PAGE = 30_000;

async function meta(chemin: string): Promise<Metadata> {
  const mod = (await import(`@/app${chemin}`)) as {
    metadata?: Metadata;
    generateMetadata?: () => Promise<Metadata>;
  };
  // /tarifs tire sa description du catalogue (en base, ou la grille par défaut).
  return mod.metadata ?? (await mod.generateMetadata!());
}

const titre = (m: Metadata): string =>
  typeof m.title === "string"
    ? m.title
    : ((m.title as { absolute?: string; default?: string } | null)?.absolute ??
      (m.title as { default?: string } | null)?.default ??
      "");

describe("métadonnées communes (layout)", () => {
  it("base d'URL, gabarit de titre, Open Graph et carte Twitter", async () => {
    const m = await meta("/layout");
    expect(String(m.metadataBase)).toBe("https://www.business-arena.fr/");
    expect((m.title as { template: string }).template).toBe("%s · Business Arena");
    expect((m.title as { default: string }).default).toContain("Simulation d'entreprise");
    expect((m.title as { default: string }).default).toContain("BTS");
    expect(m.description).toMatch(/jeu d'entreprise/i);
    expect(m.description).toContain("sans compte élève");
    expect(m.openGraph).toMatchObject({ siteName: "Business Arena", locale: "fr_FR", type: "website" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  }, IMPORT_D_UNE_PAGE);

  it("le gabarit ne pose plus og:url : chaque page aurait porté l'adresse de l'accueil", async () => {
    const m = await meta("/layout");
    expect(m.openGraph).not.toHaveProperty("url");
    // L'accueil pose la sienne, avec le socle commun (Next remplace l'objet entier).
    const accueil = await meta("/page");
    expect(accueil.openGraph).toMatchObject({ url: "/", siteName: "Business Arena", locale: "fr_FR" });
  }, IMPORT_D_UNE_PAGE);

  it("l'image de partage est générée à côté du layout, 1200×630", async () => {
    const og = (await import("@/app/opengraph-image")) as {
      size: { width: number; height: number };
      contentType: string;
      alt: string;
    };
    expect(og.size).toEqual({ width: 1200, height: 630 });
    expect(og.contentType).toBe("image/png");
    expect(og.alt).toContain("Business Arena");
    const tw = (await import("@/app/twitter-image")) as { size: { width: number } };
    expect(tw.size.width).toBe(1200);
  });
});

describe("pages publiques : titre distinct, description, canonique", () => {
  const PUBLIQUES: [string, string, string][] = [
    ["/page", "Business Arena · Simulation d'entreprise pour BTS, DCG et écoles", "/"],
    ["/jouer/page", "Lancer une partie", "/jouer"],
    ["/entreprises/page", "entreprises jouables", "/entreprises"],
    ["/notions/page", "Fiches notions de gestion", "/notions"],
    ["/guide/page", "Règles du jeu", "/guide"],
    ["/animations/page", "Ateliers", "/animations"],
    ["/parcours/page", "Parcours par diplôme", "/parcours"],
    ["/fonctionnalites/page", "Fonctionnalités", "/fonctionnalites"],
    ["/orientation/page", "Choisir sa simulation", "/orientation"],
    ["/mentions-legales/page", "Mentions légales", "/mentions-legales"],
    // Prix éteints par défaut (offres sur mesure) : la page s'appelle « Offres ».
    ["/tarifs/page", "Offres", "/tarifs"],
    ["/integration/page", "Intégration à Moodle", "/integration"],
  ];

  for (const [module, attendu, canonique] of PUBLIQUES) {
    it(`${canonique} : « ${attendu} »`, async () => {
      const m = await meta(module);
      expect(titre(m)).toContain(attendu);
      // Le gabarit du layout ajoute le nom du site : une page ne le répète pas.
      if (canonique !== "/") expect(titre(m)).not.toMatch(/business arena/i);
      expect(m.description, `${canonique} sans description`).toBeTruthy();
      expect(m.alternates?.canonical).toBe(canonique);
    }, IMPORT_D_UNE_PAGE);
  }

  it("la home met le titre entier, hors gabarit, avec la description enrichie", async () => {
    const m = await meta("/page");
    expect((m.title as { absolute: string }).absolute).toContain("BTS, DCG");
    expect(m.description).toContain("sans compte élève");
    // Les nombres que l'accueil affiche, comptés dans les registres : plus de
    // « 139 situations, 20 modèles d'analyse », invérifiables depuis le site.
    const { SCENARIO_CHOICES } = await import("@/config/scenarios/registry");
    const { NOMBRE_D_EPISODES } = await import("@/config/episodes/familles");
    expect(m.description).toContain(
      `${SCENARIO_CHOICES.length} entreprises à piloter et ${NOMBRE_D_EPISODES} épisodes manager`,
    );
    expect(m.description).not.toMatch(/situations|modèles d'analyse/);
  });

  it("aucun titre de page ne se termine plus par le nom du site en dur", () => {
    const source = [
      "entreprises",
      "guide",
      "animations",
      "parcours",
      "fonctionnalites",
      "orientation",
      "mentions-legales",
    ]
      .map((p) => readFileSync(join(APP, p, "page.tsx"), "utf8"))
      .join("\n");
    expect(source).not.toMatch(/· BUSINESS ARENA/);
    expect(source).not.toMatch(/· Business Arena"/);
  });
});

describe("les épisodes, indexés (décision d'octobre 2026 : « indexer »)", () => {
  it("le catalogue, la page des enseignants, un épisode et une fiche ne disent plus noindex", async () => {
    for (const chemin of ["/entreprises/episode/page", "/enseignants/episodes/page"]) {
      expect((await meta(chemin)).robots, chemin).toBeUndefined();
    }
    const params = { params: Promise.resolve({ code: "atelier-sature" }) };
    for (const chemin of ["/entreprises/episode/[code]/page", "/enseignants/episodes/[code]/page"]) {
      const page = (await import(`@/app${chemin}`)) as { generateMetadata: (p: typeof params) => Promise<Metadata> };
      expect((await page.generateMetadata(params)).robots, chemin).toBeUndefined();
    }
  });
});

describe("espaces privés : titre pour l'onglet, rien pour les moteurs", () => {
  it("/join et /compete ont un titre et sont noindex", async () => {
    for (const [module, attendu] of [
      ["/join/page", "Rejoindre une partie"],
      ["/compete/page", "Rejoindre un concours"],
    ] as const) {
      const m = await meta(module);
      expect(titre(m)).toBe(attendu);
      expect(m.robots).toMatchObject({ index: false });
    }
  });

  it("/teacher, /arena, /admin, /org, /profile, /compete : noindex, nofollow par layout", async () => {
    for (const espace of ["teacher", "arena", "admin", "org", "profile", "compete", "lti", "etablissement", "nouveautes"]) {
      const m = await meta(`/${espace}/layout`);
      expect(m.robots, espace).toMatchObject({ index: false, follow: false });
    }
  });
});

describe("ateliers : canonique sur chaque page, une description par rôle", () => {
  type Gen = (p: { params: Promise<Record<string, string>> }) => Promise<Metadata>;
  const gen = async (chemin: string) => ((await import(`@/app${chemin}`)) as { generateMetadata: Gen }).generateMetadata;
  const avec = (p: Record<string, string>) => ({ params: Promise.resolve(p) });

  it("la fiche, le dossier, les formulaires et chaque dossier de rôle ont leur canonique", async () => {
    expect((await (await gen("/animations/[code]/page"))(avec({ code: "mco" }))).alternates?.canonical).toBe(
      "/animations/mco",
    );
    expect((await (await gen("/animations/[code]/dossier/page"))(avec({ code: "mco" }))).alternates?.canonical).toBe(
      "/animations/mco/dossier",
    );
    expect(
      (await (await gen("/animations/[code]/formulaires/page"))(avec({ code: "mco" }))).alternates?.canonical,
    ).toBe("/animations/mco/formulaires");
    const role = await gen("/animations/[code]/dossier/[role]/page");
    expect((await role(avec({ code: "mco", role: "rh" }))).alternates?.canonical).toBe("/animations/mco/dossier/rh");
  }, IMPORT_D_UNE_PAGE);

  it("les cinq dossiers de rôle d'un atelier ont cinq descriptions distinctes", async () => {
    const role = await gen("/animations/[code]/dossier/[role]/page");
    const descriptions = await Promise.all(
      ["direction", "commercial", "approvisionnement", "rh", "financier"].map(
        async (r) => (await role(avec({ code: "mco", role: r }))).description,
      ),
    );
    expect(new Set(descriptions).size).toBe(5);
    expect(descriptions[3]).toContain("Responsable des ressources humaines");
  }, IMPORT_D_UNE_PAGE);
});

describe("plus de description par défaut reprise par une page d'entrée", () => {
  it.each([
    ["/join/page"],
    ["/compete/page"],
    ["/examen/page"],
    ["/reprendre/page"],
    ["/cours/rejoindre/page"],
    ["/teacher/login/page"],
    ["/profile/layout"],
  ])("%s a sa description propre", async (module) => {
    const { DESCRIPTION_ACCUEIL } = await import("@/config/seo");
    const m = await meta(module);
    expect(m.description, module).toBeTruthy();
    expect(m.description).not.toBe(DESCRIPTION_ACCUEIL);
  }, IMPORT_D_UNE_PAGE);

  it("/profile a son titre, distinct de celui de l'accueil", async () => {
    expect(titre(await meta("/profile/layout"))).toBe("Mon profil");
  });
});
