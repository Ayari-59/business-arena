import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chapitreLibreParDefaut } from "@/config/cours/chapitres-libres";
import { NAVIGATION, liensDAcces, liensDeTete, tousLesLiens } from "@/config/navigation";

/**
 * LE MENU RANGÉ PAR PRODUIT (décision du propriétaire, novembre 2026 : « un menu plus cohérent et
 * plus simple, avec à chaque fois un seul mot et pas plusieurs »).
 *
 * Le menu rangé par public (Élèves, Enseignants, Établissements, Entreprises, Aide, Offres) cède la
 * place à 5 produits : Cours, Arène, Épisodes, Offres, Aide. Ces gardes figent l'organisation
 * validée, mot pour mot et dans l'ordre, et vérifient qu'AUCUNE ADRESSE NE SE PERD : chaque adresse
 * des deux plans d'avant reste servie, et atteignable depuis le site. Le mot par entrée et les
 * mêmes groupes dans la barre et le menu déplié : tests/architecture/menu-en-un-mot.test.ts.
 */

const lire = (chemin: string) => readFileSync(chemin, "utf8");

/** Le plan d'octobre 2026, avant le menu rangé par public. */
const PLAN_D_OCTOBRE = [
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

/** Le plan rangé par public (novembre 2026), avant ce chantier : ses 6 groupes et ses 3 liens à part. */
const PLAN_PAR_PUBLIC = [
  "/join",
  "/jouer",
  "/cours/les-flux-de-l-entreprise",
  "/reprendre",
  "/profile",
  "/entreprises",
  "/cours",
  "/animations",
  "/enseignants/episodes",
  "/parcours",
  "/guide#concours",
  "/teacher/login",
  "/enseignants",
  "/ecoles",
  "/ecoles#evaluer",
  "/integration",
  "/entreprises/offre",
  "/entreprises/episode",
  "/entreprises/episode/profil",
  "/guides",
  "/manuel",
  "/guide",
  "/notions",
  "/tarifs",
  "/fonctionnalites",
  "/cgv",
  "/cgu",
  "/orientation",
  "/rendez-vous",
  "/mentions-legales",
];

/** Le sitemap tel qu'il était avant ce chantier (src/app/sitemap.ts). */
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
  "/cgu",
  "/mentions-legales",
];

/**
 * Les adresses sorties du menu, et ce qui y mène encore. Le code tapé dans « Rejoindre »
 * (services/rejoindre.service.ts) conduit à la page du concours ou de l'examen ; le chapitre libre,
 * qui avait son entrée (« Essayer le cours »), est l'essai que la page du cours propose.
 */
const SORTIES_DU_MENU: Record<string, { fichier: string; preuves: string[] }> = {
  "/compete": { fichier: "src/services/rejoindre.service.ts", preuves: ["`/compete?code="] },
  "/examen": { fichier: "src/services/rejoindre.service.ts", preuves: ["`/examen?code="] },
  "/cours/les-flux-de-l-entreprise": {
    fichier: "src/app/cours/page.tsx",
    preuves: ["?? chapitreLibreParDefaut()", "href={`/cours/${pilote.code}"],
  },
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

/** Toutes les adresses que le site montre : les mots de la barre, les entrées, les portes. */
const adressesDuPlan = () => [...liensDeTete(), ...tousLesLiens()].map((l) => l.href);

/** La page des lycées, qui vient avec un chantier suivant. */
const LYCEES_EXISTE = existsSync(routeDe("/lycees"));

describe("le menu rangé par produit", () => {
  it("5 groupes, dans l'ordre : Cours, Arène, Épisodes, Offres, Aide, chacun vers la page de son mot", () => {
    expect(NAVIGATION.map((g) => [g.code, g.titre, g.entree])).toEqual([
      ["cours", "Cours", "/cours"],
      ["arene", "Arène", "/fonctionnalites"],
      ["episodes", "Épisodes", "/entreprises/episode"],
      ["offres", "Offres", "/tarifs"],
      ["aide", "Aide", "/guides"],
    ]);
  });

  it("deux portes, Rejoindre et Connexion, hors des groupes", () => {
    expect(liensDAcces().map((l) => [l.libelle, l.href, l.acces])).toEqual([
      ["Rejoindre", "/join", "eleve"],
      ["Connexion", "/teacher/login", "enseignant"],
    ]);
    // Un nom plus long pour une synthèse vocale, qui commence par le mot affiché.
    expect(liensDAcces().map((l) => l.nom)).toEqual(["Rejoindre avec un code", "Connexion à l'espace enseignant"]);
    const dansLesGroupes = NAVIGATION.flatMap((g) => g.liens.map((l) => l.href));
    for (const porte of liensDAcces()) expect(dansLesGroupes, porte.href).not.toContain(porte.href);
  });

  it("Cours et Arène", () => {
    expect(rangee("cours")).toEqual([
      ["Diplômes", "/cours"],
      ["Référentiels", "/parcours"],
      ["Notions", "/notions"],
    ]);
    expect(rangee("arene")).toEqual([
      ["Solo", "/jouer"],
      ["Métiers", "/entreprises"],
      ["Ateliers", "/animations"],
      ["Concours", "/guide#concours"],
      ["Règles", "/guide"],
      ["Reprendre", "/reprendre"],
      ["Profil", "/profile"],
    ]);
    // La présentation du simulateur n'a plus d'entrée à elle : « Arène » y mène.
    expect(tousLesLiens().map((l) => l.href)).not.toContain("/fonctionnalites");
  });

  it("Épisodes, Offres, Aide", () => {
    expect(rangee("episodes")).toEqual([
      ["Catalogue", "/entreprises/episode"],
      ["Classe", "/enseignants/episodes"],
      ["Profil", "/entreprises/episode/profil"],
    ]);
    expect(rangee("offres")).toEqual([
      ["Enseignants", "/enseignants"],
      ...(LYCEES_EXISTE ? [["Lycées", "/lycees"]] : []),
      ["Écoles", "/ecoles"],
      ["Entreprises", "/entreprises/offre"],
      ["Examen", "/ecoles#evaluer"],
      ["Intégration", "/integration"],
      ["Devis", "/devis"],
    ]);
    expect(rangee("aide")).toEqual([
      ["Guides", "/guides"],
      ["Manuel", "/manuel"],
      ["Orientation", "/orientation"],
      ["Contact", "/rendez-vous"],
      ["Mentions", "/mentions-legales"],
      ["CGV", "/cgv"],
      ["CGU", "/cgu"],
    ]);
  });

  it("« Lycées » a sa place, juste après « Enseignants », et aucun lien mort en attendant sa page", () => {
    // La page /lycees vient avec un chantier suivant. Tant qu'elle n'existe pas, aucune entrée
    // n'y mène ; le jour où elle existe, l'entrée se pose à sa place (config/navigation.ts le dit).
    const offres = rangee("offres");
    if (!LYCEES_EXISTE) {
      expect(adressesDuPlan()).not.toContain("/lycees");
      expect(lire("src/config/navigation.ts")).toMatch(/« LYCÉES » A SA PLACE ICI, juste après « Enseignants »/);
    } else {
      const apres = offres.findIndex(([, href]) => href === "/enseignants");
      expect(offres[apres + 1], "la page /lycees existe : son entrée suit « Enseignants »").toEqual(["Lycées", "/lycees"]);
    }
  });

  it("aucune adresse des plans d'avant n'est perdue : elle est au plan, ou une page du plan y mène", () => {
    const plan = adressesDuPlan();
    for (const href of new Set([...PLAN_D_OCTOBRE, ...PLAN_PAR_PUBLIC])) {
      expect(existsSync(routeDe(href)), `${href} : la page n'existe plus`).toBe(true);
      if (plan.includes(href)) continue;
      const sortie = SORTIES_DU_MENU[href];
      expect(sortie, `${href} a quitté le plan sans chemin pour y mener`).toBeDefined();
      for (const preuve of sortie!.preuves) {
        expect(lire(sortie!.fichier), `${href} : ${sortie!.fichier} n'y mène plus`).toContain(preuve);
      }
    }
    // Le chapitre libre qui avait son entrée est bien l'essai par défaut du cours.
    expect(`/cours/${chapitreLibreParDefaut().code}`).toBe("/cours/les-flux-de-l-entreprise");
  });

  it("plus d'« entreprises jouables » ; « Écoles » est le mot du menu, la page garde son titre", () => {
    // Le menu rangé par public avait renommé la rubrique « Écoles » en « Établissements », et « Les
    // entreprises jouables » en « Les cas d'entreprise ». Le menu par produit nomme la page des
    // écoles « Écoles », dans les offres (décision du propriétaire) : le mot ne revient que là.
    for (const f of [
      "src/config/navigation.ts",
      "src/app/ecoles/page.tsx",
      "src/app/entreprises/page.tsx",
      "src/config/bandes.ts",
      "src/config/guides/etablissement.ts",
      "src/config/guides/formateur.ts",
    ]) {
      expect(lire(f), f).not.toMatch(/"Écoles de commerce et universités"|"Les entreprises jouables"|entreprises jouables`/);
      if (f !== "src/config/navigation.ts") expect(lire(f), f).not.toMatch(/"Écoles"/);
    }
    expect(rangee("offres")).toContainEqual(["Écoles", "/ecoles"]);
    expect(lire("src/app/ecoles/page.tsx")).toMatch(/title: "Établissements/);
    expect(lire("src/app/entreprises/page.tsx")).toMatch(/title: `Les cas d'entreprise/);
  });

  it("aucune adresse ne quitte le sitemap, et aucune page du sitemap n'est orpheline", () => {
    for (const p of SITEMAP_D_AVANT) expect(SITEMAP, `${p} a quitté le sitemap`).toContain(p);
    const plan = adressesDuPlan().map((h) => h.split("#")[0]!);
    // L'accueil, celle du logo : le devis est une entrée des offres depuis ce chantier.
    const EXCEPTIONS = ["/"];
    const orphelines = SITEMAP.filter((p) => !plan.includes(p) && !EXCEPTIONS.includes(p));
    expect(orphelines, `pages du sitemap que rien ne mène : ${orphelines.join(", ")}`).toEqual([]);
  });
});
