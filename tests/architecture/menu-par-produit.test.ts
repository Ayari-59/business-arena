import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chapitreLibreParDefaut } from "@/config/cours/chapitres-libres";
import { LIENS_LEGAUX, NAVIGATION, liensDAcces, liensDeTete, tousLesLiens } from "@/config/navigation";

/**
 * LE MENU RANGÉ PAR PRODUIT (décisions du propriétaire, novembre 2026 : « un menu plus cohérent et
 * plus simple, avec à chaque fois un seul mot et pas plusieurs », puis, avant la mise en ligne,
 * « les CGV, CGU, RGPD et cie, je ne veux pas que ce soit trop voyant ; le menu horizontal m'a l'air
 * bien ; je veux un menu qui montre la pédagogie et met en avant le produit »).
 *
 * Le menu rangé par public (Élèves, Enseignants, Établissements, Entreprises, Aide, Offres) cède la
 * place à 5 produits : Cours, Arène, Épisodes, Offres, Aide. Ces gardes figent l'organisation
 * validée, mot pour mot et dans l'ordre, ses 3 phrases et sa petite ligne légale, et vérifient
 * qu'AUCUNE ADRESSE NE SE PERD : chaque adresse des plans d'avant reste servie, et atteignable
 * depuis le site, par le plan ou par le lien d'une page du plan. Le mot par entrée, les mêmes
 * groupes dans la barre, ses panneaux et le menu du téléphone, les phrases et le légal tels qu'ils
 * sont RENDUS : tests/architecture/menu-en-un-mot.test.ts. Les panneaux de la maquette A (la ligne
 * et le pictogramme de chaque entrée, le bouton de chaque groupe) : panneaux-du-menu.test.ts.
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

/** Le premier menu par produit (novembre 2026, avant la décision sur la pédagogie et le légal). */
const PLAN_PAR_PRODUIT_D_ABORD = [
  "/cours",
  "/fonctionnalites",
  "/entreprises/episode",
  "/tarifs",
  "/guides",
  "/parcours",
  "/notions",
  "/jouer",
  "/entreprises",
  "/animations",
  "/guide#concours",
  "/guide",
  "/reprendre",
  "/profile",
  "/enseignants/episodes",
  "/entreprises/episode/profil",
  "/enseignants",
  "/ecoles",
  "/entreprises/offre",
  "/ecoles#evaluer",
  "/integration",
  "/devis",
  "/manuel",
  "/orientation",
  "/rendez-vous",
  "/mentions-legales",
  "/cgv",
  "/cgu",
  "/join",
  "/teacher/login",
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
 * LES ADRESSES SORTIES DU MENU, ET LE LIEN QUI Y MÈNE ENCORE, depuis une page du plan (la page qui
 * porte le lien est elle-même au plan : deux clics au plus). Le code tapé dans « Rejoindre »
 * (services/rejoindre.service.ts) conduit à la page du concours ou de l'examen ; le chapitre libre,
 * qui avait son entrée (« Essayer le cours »), est l'essai que la page du cours propose. Puis, avec
 * la décision sur la pédagogie et le légal : l'examen individuel est une section de la page des
 * écoles, l'intégration se lit depuis les guides et les offres, l'aide au choix depuis la page des
 * enseignants et celle du rendez-vous, le profil décisionnel des épisodes depuis le profil de
 * l'arène et la fin de chaque épisode.
 */
interface LienQuiYMene {
  /** La page publique qui porte le lien (une adresse du plan). */
  page: string;
  /** Le fichier où le lien s'écrit, et ce qui le prouve. */
  fichier: string;
  preuves: string[];
}
const SORTIES_DU_MENU: Record<string, LienQuiYMene[]> = {
  "/compete": [{ page: "/join", fichier: "src/services/rejoindre.service.ts", preuves: ["`/compete?code="] }],
  "/examen": [{ page: "/join", fichier: "src/services/rejoindre.service.ts", preuves: ["`/examen?code="] }],
  "/cours/les-flux-de-l-entreprise": [
    { page: "/cours", fichier: "src/app/cours/page.tsx", preuves: ["?? chapitreLibreParDefaut()", "href={`/cours/${pilote.code}"] },
  ],
  "/ecoles#evaluer": [{ page: "/ecoles", fichier: "src/app/ecoles/page.tsx", preuves: ['<section id="evaluer"'] }],
  "/integration": [
    { page: "/guides", fichier: "src/app/guides/page.tsx", preuves: ['<Link href="/integration"'] },
    { page: "/tarifs", fichier: "src/config/tarifs.ts", preuves: ['lien: { href: "/integration", libelle: "Voir l\'intégration" }'] },
  ],
  "/orientation": [
    { page: "/enseignants", fichier: "src/app/enseignants/page.tsx", preuves: ['<Link href="/orientation"'] },
    { page: "/rendez-vous", fichier: "src/app/rendez-vous/page.tsx", preuves: ['<Link href="/orientation"'] },
  ],
  "/entreprises/episode/profil": [
    { page: "/profile", fichier: "src/app/profile/page.tsx", preuves: ['href="/entreprises/episode/profil"'] },
  ],
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

/**
 * Toutes les adresses que le site montre sur chaque page : les mots de la barre, les entrées, les
 * portes, et la petite ligne légale du pied de page.
 */
const adressesDuPlan = () => [...liensDeTete(), ...tousLesLiens(), ...LIENS_LEGAUX].map((l) => l.href);

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
      ["Notions", "/notions"],
      ["Référentiels", "/parcours"],
    ]);
    expect(rangee("arene")).toEqual([
      ["Solo", "/jouer"],
      ["Métiers", "/entreprises"],
      ["Ateliers", "/animations"],
      ["Concours", "/guide#concours"],
    ]);
    // La présentation du simulateur n'a plus d'entrée à elle : « Arène » y mène.
    expect(tousLesLiens().map((l) => l.href)).not.toContain("/fonctionnalites");
  });

  it("Épisodes, Offres, Aide", () => {
    expect(rangee("episodes")).toEqual([
      ["Catalogue", "/entreprises/episode"],
      ["Classe", "/enseignants/episodes"],
    ]);
    expect(rangee("offres")).toEqual([
      ["Enseignants", "/enseignants"],
      ...(LYCEES_EXISTE ? [["Lycées", "/lycees"]] : []),
      ["Écoles", "/ecoles"],
      ["Entreprises", "/entreprises/offre"],
      ["Devis", "/devis"],
    ]);
    // « Profil » est celui de l'arène (/profile) ; celui des épisodes s'ouvre depuis lui.
    expect(rangee("aide")).toEqual([
      ["Guides", "/guides"],
      ["Manuel", "/manuel"],
      ["Règles", "/guide"],
      ["Reprendre", "/reprendre"],
      ["Profil", "/profile"],
      ["Contact", "/rendez-vous"],
    ]);
  });

  it("la pédagogie en avant : une phrase sous le cours, l'arène et les épisodes, aucune ailleurs", () => {
    expect(NAVIGATION.map((g) => [g.code, g.phrase ?? null])).toEqual([
      ["cours", "Chaque notion se pratique : vous passez l'écriture, et vous voyez ce qu'elle change dans les comptes."],
      ["arene", "Vous dirigez une entreprise en équipe, et le marché répond à vos choix."],
      ["episodes", "Vous décidez en manager, puis vous voyez ce que la décision a coûté."],
      ["offres", null],
      ["aide", null],
    ]);
  });

  it("le légal en petit : Mentions · CGV · CGU, sur la petite ligne du pied de page, et dans aucun groupe", () => {
    expect(LIENS_LEGAUX.map((l) => [l.libelle, l.href])).toEqual([
      ["Mentions", "/mentions-legales"],
      ["CGV", "/cgv"],
      ["CGU", "/cgu"],
    ]);
    const dansLesGroupes = NAVIGATION.flatMap((g) => g.liens.map((l) => l.href));
    for (const l of LIENS_LEGAUX) expect(dansLesGroupes, l.href).not.toContain(l.href);
    expect(lire("src/components/pied-de-page.tsx")).toContain("LIENS_LEGAUX.map(");
    expect(lire("src/components/site-header.tsx")).not.toContain("LIENS_LEGAUX");
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
    for (const href of new Set([...PLAN_D_OCTOBRE, ...PLAN_PAR_PUBLIC, ...PLAN_PAR_PRODUIT_D_ABORD])) {
      expect(existsSync(routeDe(href)), `${href} : la page n'existe plus`).toBe(true);
      if (plan.includes(href)) continue;
      const liens = SORTIES_DU_MENU[href];
      expect(liens?.length, `${href} a quitté le plan sans lien pour y mener`).toBeGreaterThan(0);
      for (const lien of liens!) {
        // La page qui porte le lien est au plan : de n'importe quelle page, deux clics au plus.
        expect(plan, `${href} : ${lien.page}, qui y mène, n'est pas au plan`).toContain(lien.page);
        for (const preuve of lien.preuves) {
          expect(lire(lien.fichier), `${href} : ${lien.fichier} n'y mène plus`).toContain(preuve);
        }
      }
    }
    // Le chapitre libre qui avait son entrée est bien l'essai par défaut du cours.
    expect(`/cours/${chapitreLibreParDefaut().code}`).toBe("/cours/les-flux-de-l-entreprise");
    // Une sortie n'est pas restée au menu par mégarde.
    for (const href of Object.keys(SORTIES_DU_MENU)) expect(tousLesLiens().map((l) => l.href), href).not.toContain(href);
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
    // Une page sortie du menu compte si une page du plan y mène (la garde précédente le prouve).
    const menees = Object.keys(SORTIES_DU_MENU).map((h) => h.split("#")[0]!);
    // L'accueil, celle du logo : le devis est une entrée des offres depuis ce chantier.
    const EXCEPTIONS = ["/"];
    const orphelines = SITEMAP.filter((p) => !plan.includes(p) && !menees.includes(p) && !EXCEPTIONS.includes(p));
    expect(orphelines, `pages du sitemap que rien ne mène : ${orphelines.join(", ")}`).toEqual([]);
  });
});
