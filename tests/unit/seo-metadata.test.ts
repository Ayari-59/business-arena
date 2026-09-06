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

async function meta(chemin: string): Promise<Metadata> {
  const mod = (await import(`@/app${chemin}`)) as { metadata: Metadata };
  return mod.metadata;
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
  });

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
    ["/guide/page", "Guide de prise en main", "/guide"],
    ["/animations/page", "Ateliers et animations", "/animations"],
    ["/parcours/page", "Parcours par diplôme", "/parcours"],
    ["/fonctionnalites/page", "Fonctionnalités", "/fonctionnalites"],
    ["/orientation/page", "Choisir sa simulation", "/orientation"],
    ["/mentions-legales/page", "Mentions légales", "/mentions-legales"],
  ];

  for (const [module, attendu, canonique] of PUBLIQUES) {
    it(`${canonique} : « ${attendu} »`, async () => {
      const m = await meta(module);
      expect(titre(m)).toContain(attendu);
      // Le gabarit du layout ajoute le nom du site : une page ne le répète pas.
      if (canonique !== "/") expect(titre(m)).not.toMatch(/business arena/i);
      expect(m.description, `${canonique} sans description`).toBeTruthy();
      expect(m.alternates?.canonical).toBe(canonique);
    });
  }

  it("la home met le titre entier, hors gabarit, avec la description enrichie", async () => {
    const m = await meta("/page");
    expect((m.title as { absolute: string }).absolute).toContain("BTS, DCG");
    expect(m.description).toContain("sans compte élève");
    expect(m.description).toContain("9 secteurs");
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
    for (const espace of ["teacher", "arena", "admin", "org", "profile", "compete"]) {
      const m = await meta(`/${espace}/layout`);
      expect(m.robots, espace).toMatchObject({ index: false, follow: false });
    }
  });
});
