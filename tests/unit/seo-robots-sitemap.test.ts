import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import robots, { CHEMINS_PRIVES } from "@/app/robots";
import sitemap, { PAGES_PUBLIQUES } from "@/app/sitemap";
import { ATELIERS } from "@/config/ateliers";
import { SITE_URL } from "@/config/site";

/**
 * ROBOTS ET PLAN DU SITE.
 *
 * Constaté en production : /robots.txt et /sitemap.xml répondaient 404. Un
 * moteur de recherche indexait donc au hasard, espace enseignant compris.
 *
 * Deux gardes : les chemins privés sont interdits aux robots, et chaque page
 * du plan du site correspond à une route qui existe vraiment dans app/.
 */

const APP = join(process.cwd(), "src", "app");

function routeExiste(chemin: string): boolean {
  const segments = chemin === "/" ? [] : chemin.slice(1).split("/");
  // Les segments dynamiques ([code]) : on cherche le dossier entre crochets.
  let dossier = APP;
  for (const s of segments) {
    const direct = join(dossier, s);
    if (existsSync(direct)) {
      dossier = direct;
      continue;
    }
    const dynamique = join(dossier, "[code]");
    if (existsSync(dynamique)) {
      dossier = dynamique;
      continue;
    }
    return false;
  }
  return existsSync(join(dossier, "page.tsx"));
}

describe("robots.txt", () => {
  const r = robots();
  const regle = Array.isArray(r.rules) ? r.rules[0]! : r.rules;

  it("autorise la racine et interdit les espaces privés", () => {
    expect(regle.allow).toBe("/");
    for (const prive of ["/teacher", "/arena", "/join", "/compete", "/api", "/profile"]) {
      expect(regle.disallow).toContain(prive);
    }
  });

  it("chaque chemin privé interdit est une route existante ou l'API", () => {
    for (const prive of CHEMINS_PRIVES) {
      const dossier = join(APP, prive.slice(1));
      expect(existsSync(dossier), `${prive} n'existe pas dans app/`).toBe(true);
    }
  });

  it("pointe vers le plan du site sur l'adresse canonique", () => {
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe("sitemap.xml", () => {
  const entrees = sitemap();
  const urls = entrees.map((e) => e.url);

  it("contient au moins la racine, les entreprises et le guide", () => {
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/entreprises`);
    expect(urls).toContain(`${SITE_URL}/guide`);
  });

  it("liste chaque atelier publié avec sa page, son dossier et ses formulaires", () => {
    for (const a of ATELIERS) {
      expect(urls).toContain(`${SITE_URL}/ateliers/${a.code}`);
      expect(urls).toContain(`${SITE_URL}/ateliers/${a.code}/dossier`);
      expect(urls).toContain(`${SITE_URL}/ateliers/${a.code}/formulaires`);
    }
  });

  it("ne liste que des routes qui existent", () => {
    for (const url of urls) {
      const chemin = url.slice(SITE_URL.length) || "/";
      expect(routeExiste(chemin), `${chemin} n'est pas une route de app/`).toBe(true);
    }
  });

  it("n'expose aucun chemin privé", () => {
    for (const url of urls) {
      const chemin = url.slice(SITE_URL.length);
      for (const prive of CHEMINS_PRIVES) {
        expect(chemin.startsWith(prive)).toBe(false);
      }
    }
  });

  it("donne la priorité maximale à la racine et une date à chaque entrée", () => {
    const racine = entrees.find((e) => e.url === `${SITE_URL}/`)!;
    expect(racine.priority).toBe(1);
    for (const e of entrees) {
      expect(e.lastModified).toBeInstanceOf(Date);
      expect(e.changeFrequency).toBe("monthly");
    }
    expect(PAGES_PUBLIQUES.length).toBeGreaterThanOrEqual(9);
  });
});
