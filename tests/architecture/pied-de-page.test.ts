import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE PIED DE PAGE EST SUR TOUTES LES PAGES PUBLIQUES, ET IL N'Y EN A QU'UN.
 *
 * Relevé avant d'y toucher : le site comptait UN pied de page, sur l'accueil.
 * Les dix autres pages publiques s'arrêtaient net sur leur dernière section,
 * et « Mentions légales & RGPD » n'y était atteignable que par le panneau
 * « Menu ». Le défaut ne casse rien, ne se voit dans aucun test, et se répare
 * page par page — c'est exactement le genre qui revient : il suffit d'ajouter
 * une page publique et d'oublier la dernière ligne.
 *
 * DEUX RÈGLES, DONC. Chaque page de la liste finit par le composant partagé ;
 * et personne ne réécrit un `<footer>` dans son coin, parce que c'est ainsi
 * que le dépôt s'est retrouvé avec onze remplissages de bouton.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (entree.endsWith(".tsx")) trouves.push(chemin);
  }
  return trouves;
}

/**
 * Les pages que le site présente à un visiteur qui n'a rien ouvert : celles
 * qui se lisent, pas celles où l'on travaille. L'arène, l'espace enseignant
 * et les écrans de saisie (`/join`, `/reprendre`) en sont dehors — on n'y
 * clôt pas une lecture, on y agit, et un pied de page y serait du bruit sous
 * un formulaire.
 */
const PAGES_PUBLIQUES = [
  "app/page.tsx",
  "app/animations/page.tsx",
  "app/compete/page.tsx",
  "app/enseignants/page.tsx",
  "app/entreprises/page.tsx",
  "app/fonctionnalites/page.tsx",
  "app/guide/page.tsx",
  "app/guides/page.tsx",
  "app/guides/[public]/page.tsx",
  "app/jouer/page.tsx",
  "app/notions/page.tsx",
  "app/orientation/page.tsx",
  "app/parcours/page.tsx",
  // /tarifs lit le catalogue, et rend sa page par components/page-des-tarifs.tsx.
  "components/page-des-tarifs.tsx",
  "app/integration/page.tsx",
];

/**
 * La fiche publique d'un concours signe son hôte — « Organisé sur Business
 * Arena » — et ce n'est pas le pied du site : c'est la mention qui dit d'où
 * vient la page qu'un organisateur partage.
 */
const SIGNATURES = ["/app/concours/[code]/page.tsx"];

describe("le pied de page", () => {
  it("termine chaque page publique", () => {
    const sans = PAGES_PUBLIQUES.filter(
      (p) => !readFileSync(join(SRC, p), "utf8").includes("<PiedDePage />"),
    );
    expect(sans, `ces pages publiques n'ont pas de pied :\n${sans.join("\n")}`).toEqual([]);
  });

  it("se pose hors du contenu, pour être un repère de pied de page", () => {
    // Un `<footer>` imbriqué dans `<main>` n'est plus un repère « contentinfo »
    // pour une synthèse vocale : c'est un bloc parmi d'autres. Le composant
    // suit donc la fermeture du contenu, il ne la précède pas.
    for (const p of PAGES_PUBLIQUES) {
      const source = readFileSync(join(SRC, p), "utf8");
      expect(
        source.indexOf("<PiedDePage />"),
        `${p} : le pied est posé DANS le <main>`,
      ).toBeGreaterThan(source.lastIndexOf("</main>"));
    }
  });

  it("n'est écrit qu'une fois", () => {
    const fautes = fichiers(join(SRC, "app"))
      .filter((f) => readFileSync(f, "utf8").includes("<footer"))
      .map((f) => f.slice(SRC.length))
      .filter((f) => !SIGNATURES.includes(f));
    expect(
      fautes,
      `ces pages réécrivent un pied de page au lieu d'appeler PiedDePage :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("déroule le plan du site en six blocs, trois par rangée, sans recopier ses liens", () => {
    // Le pied de l'accueil déroulait les quatorze liens du plan à la main, puis
    // n'en a plus proposé que quatre. Il lit maintenant le plan, groupe par
    // groupe, sous les mêmes titres que la barre et le menu, un bloc par
    // groupe : trois par rangée sur grand écran, deux sur tablette, une pile
    // sur téléphone. Il a été en quatre colonnes dont une empilait les trois
    // publics : trente lignes à côté de trois fois cinq.
    const source = readFileSync(join(SRC, "components", "pied-de-page.tsx"), "utf8");
    expect(source).toContain("NAVIGATION");
    expect(source).toContain("ACTION_PRINCIPALE");
    expect(source).toContain('aria-label="Plan du site"');
    expect(source).toMatch(/grid-cols-1 [^"]*sm:grid-cols-2 [^"]*lg:grid-cols-3/);
    expect(source, "un groupe ne s'empile plus sous un autre").not.toContain("const colonnes");
    for (const code of ["jouer", "enseignants", "ecoles", "entreprises", "aide", "offres"]) {
      expect(source, `le bloc « ${code} » manque`).toContain(`groupe("${code}")`);
    }
    // L'adresse de contact reste en texte, et l'année se lit au rendu.
    expect(source).toContain("VENDEUR.contact");
    expect(source).toContain("new Date().getFullYear()");
    // La page courante ne se propose pas : elle est marquée, en texte.
    expect(source).toContain('aria-current="page"');
  });
});
