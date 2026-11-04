import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHAPITRES } from "@/config/cours/registre";
import {
  LIEN_MENTIONS,
  LIENS_TRANSVERSES,
  NAVIGATION,
  tousLesLiens,
} from "@/config/navigation";

/**
 * LE MENU RANGÉ PAR PUBLIC (chantier délimité approuvé par le propriétaire, novembre 2026).
 *
 * « Jouer » devient « Élèves », avec une seule porte pour tous les codes ; « Écoles » devient
 * « Établissements » ; « Le cours » ouvre le groupe des enseignants ; l'aide et les offres se
 * resserrent. AUCUNE ADRESSE NE CHANGE : ces gardes figent le plan d'avant le chantier et
 * vérifient que chacune de ses adresses reste servie, et atteignable depuis le site.
 */

const lire = (chemin: string) => readFileSync(chemin, "utf8");

/** Le plan tel qu'il était avant le chantier (config/navigation.ts, octobre 2026). */
const PLAN_D_AVANT = [
  "/jouer",
  "/orientation",
  "/entreprises",
  "/join",
  "/compete",
  "/reprendre",
  "/examen",
  "/profile",
  "/enseignants",
  "/animations",
  "/cours",
  "/parcours",
  "/enseignants/episodes",
  "/guide#concours",
  "/teacher/login",
  "/ecoles",
  "/ecoles#evaluer",
  "/fonctionnalites",
  "/integration",
  "/entreprises/episode",
  "/entreprises/offre",
  "/entreprises/episode/profil",
  "/guides",
  "/guide",
  "/manuel",
  "/notions",
  "/tarifs",
  "/rendez-vous",
  "/cgv",
  "/mentions-legales",
];

/** Le sitemap tel qu'il était avant le chantier (src/app/sitemap.ts). */
const SITEMAP_D_AVANT = [
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
  "/entreprises/episode",
  "/entreprises/offre",
  "/enseignants/episodes",
  "/guide",
  "/guides",
  "/manuel",
  "/orientation",
  "/rendez-vous",
  "/tarifs",
  "/devis",
  "/cgv",
  "/mentions-legales",
];

/**
 * Les adresses sorties du menu, et ce qui y mène encore : le code tapé dans « J'ai un code »
 * (services/rejoindre.service.ts) conduit à la page du concours ou de l'examen.
 */
const SORTIES_DU_MENU: Record<string, { fichier: string; preuve: string }> = {
  "/compete": { fichier: "src/services/rejoindre.service.ts", preuve: "`/compete?code=" },
  "/examen": { fichier: "src/services/rejoindre.service.ts", preuve: "`/examen?code=" },
};

function routeDe(href: string): string {
  const chemin = href.split("#")[0]!;
  let dossier = "src/app";
  for (const segment of chemin.split("/").filter(Boolean)) {
    const exact = `${dossier}/${segment}`;
    if (existsSync(exact)) {
      dossier = exact;
      continue;
    }
    const dynamique = existsSync(dossier) ? readdirSync(dossier).find((d) => /^\[.+\]$/.test(d)) : undefined;
    dossier = `${dossier}/${dynamique ?? segment}`;
  }
  return `${dossier}/page.tsx`;
}

const SITEMAP: string[] = (() => {
  const bloc = lire("src/app/sitemap.ts").match(/export const PAGES_PUBLIQUES = \[([\s\S]*?)\] as const;/);
  if (!bloc) throw new Error("sitemap.ts : PAGES_PUBLIQUES introuvable");
  return [...bloc[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
})();

const groupe = (code: string) => {
  const g = NAVIGATION.find((x) => x.code === code);
  if (!g) throw new Error(`groupe « ${code} » absent du plan`);
  return g;
};
const rangee = (code: string) => groupe(code).liens.map((l) => [l.libelle, l.href]);

describe("le menu rangé par public", () => {
  it("six groupes, dans l'ordre : Élèves, Enseignants, Établissements, Entreprises, Aide, Offres", () => {
    expect(NAVIGATION.map((g) => [g.code, g.titre])).toEqual([
      ["eleves", "Élèves"],
      ["enseignants", "Enseignants"],
      ["etablissements", "Établissements"],
      ["entreprises", "Entreprises"],
      ["aide", "Aide"],
      ["offres", "Offres"],
    ]);
  });

  it("Élèves : une seule porte pour tous les codes, le solo, le cours à l'essai, la reprise, le profil, les cas", () => {
    const libre = CHAPITRES.find((c) => c.libre)!;
    expect(rangee("eleves")).toEqual([
      ["J'ai un code", "/join"],
      ["Jouer en solo", "/jouer"],
      ["Essayer le cours", `/cours/${libre.code}`],
      ["Reprendre une partie", "/reprendre"],
      ["Mon profil", "/profile"],
      ["Les cas d'entreprise", "/entreprises"],
    ]);
    // Les portes séparées du concours et de l'examen sortent du menu ; les pages restent.
    const adresses = tousLesLiens().map((l) => l.href);
    expect(adresses).not.toContain("/compete");
    expect(adresses).not.toContain("/examen");
    expect(groupe("eleves").liens.find((l) => l.href === "/join")?.acces).toBe("eleve");
  });

  it("Enseignants : le cours d'abord", () => {
    expect(rangee("enseignants").slice(0, 6)).toEqual([
      ["Le cours", "/cours"],
      ["Ateliers clés en main", "/animations"],
      ["Épisodes en classe", "/enseignants/episodes"],
      ["Référentiels par diplôme", "/parcours"],
      ["Concours entre classes", "/guide#concours"],
      ["Espace enseignant", "/teacher/login"],
    ]);
    // La présentation reste la page que « Enseignants » ouvre depuis la barre.
    expect(groupe("enseignants").entree).toBe("/enseignants");
    expect(groupe("enseignants").liens.map((l) => l.href)).toContain("/enseignants");
  });

  it("Établissements, Entreprises, Aide, Offres", () => {
    expect(rangee("etablissements")).toEqual([
      ["Présentation", "/ecoles"],
      ["Examen individuel", "/ecoles#evaluer"],
      ["Moodle et RENATER", "/integration"],
    ]);
    expect(rangee("entreprises")).toEqual([
      ["Pour les entreprises", "/entreprises/offre"],
      ["Épisodes manager", "/entreprises/episode"],
      ["Mon profil décisionnel", "/entreprises/episode/profil"],
    ]);
    expect(rangee("aide")).toEqual([
      ["Guides de prise en main", "/guides"],
      ["Manuel de l'enseignant", "/manuel"],
      ["Règles du jeu", "/guide"],
      ["Fiches notions", "/notions"],
    ]);
    expect(rangee("offres")).toEqual([
      ["Offres", "/tarifs"],
      ["Fonctionnalités", "/fonctionnalites"],
      ["Conditions générales de vente", "/cgv"],
      ["Conditions générales d'utilisation", "/cgu"],
    ]);
    // Les mentions légales quittent les offres, et restent au pied de page.
    expect(LIENS_TRANSVERSES.map((l) => l.href)).toContain(LIEN_MENTIONS.href);
    expect(lire("src/components/pied-de-page.tsx")).toContain("LIENS_TRANSVERSES");
  });

  it("aucune adresse du plan d'avant n'est perdue : elle est au plan, ou une page du plan y mène", () => {
    const plan = tousLesLiens().map((l) => l.href);
    for (const href of PLAN_D_AVANT) {
      expect(existsSync(routeDe(href)), `${href} : la page n'existe plus`).toBe(true);
      if (plan.includes(href)) continue;
      const sortie = SORTIES_DU_MENU[href];
      expect(sortie, `${href} a quitté le plan sans chemin pour y mener`).toBeDefined();
      expect(lire(sortie!.fichier), `${href} : ${sortie!.fichier} n'y mène plus`).toContain(sortie!.preuve);
    }
  });

  it("aucune adresse ne quitte le sitemap, et aucune page du sitemap n'est orpheline", () => {
    for (const p of SITEMAP_D_AVANT) expect(SITEMAP, `${p} a quitté le sitemap`).toContain(p);
    const plan = tousLesLiens().map((l) => l.href.split("#")[0]!);
    const EXCEPTIONS = ["/", "/devis"];
    const orphelines = SITEMAP.filter((p) => !plan.includes(p) && !EXCEPTIONS.includes(p));
    expect(orphelines, `pages du sitemap que rien ne mène : ${orphelines.join(", ")}`).toEqual([]);
    // Le devis est l'action de la page des offres, et l'accueil celle du logo.
    expect(lire("src/components/page-des-tarifs.tsx")).toMatch(/devis/);
  });

  it("plus de rubrique « Écoles » ni d'« entreprises jouables » sur le site", () => {
    for (const f of [
      "src/config/navigation.ts",
      "src/app/ecoles/page.tsx",
      "src/app/entreprises/page.tsx",
      "src/config/bandes.ts",
      "src/config/guides/etablissement.ts",
      "src/config/guides/formateur.ts",
    ]) {
      expect(lire(f), f).not.toMatch(/"Écoles de commerce et universités"|"Les entreprises jouables"|entreprises jouables`|"Écoles"/);
    }
    expect(lire("src/app/ecoles/page.tsx")).toMatch(/title: "Établissements/);
    expect(lire("src/app/entreprises/page.tsx")).toMatch(/title: `Les cas d'entreprise/);
  });
});
