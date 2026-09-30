import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { DonneesStructurees } from "@/components/donnees-structurees";
import { NOM_DU_SITE, DESCRIPTION_ACCUEIL } from "@/config/seo";
import { SITE_URL } from "@/config/site";

/**
 * LE BALISAGE DIT LA VÉRITÉ, OU IL NE DIT RIEN.
 *
 * Une donnée structurée est lue par une machine, jamais relue par un humain :
 * un nom qui a dérivé, une adresse restée en dur, un logo dont les dimensions
 * ne sont plus les bonnes ne se voient sur aucune page. C'est exactement la
 * situation où une garde vaut mieux qu'une relecture.
 *
 * ET ELLE DIT CE QUI EXISTE. Les exemples de balisage qui circulent portent
 * une recherche interne, un prix, une note moyenne ; les recopier, c'est
 * annoncer à un moteur trois choses que le site ne fait pas. Le test tient
 * donc aussi la liste de ce qui doit rester ABSENT.
 */

const rendu = renderToStaticMarkup(createElement(DonneesStructurees));
const json = rendu.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
const graphe = JSON.parse(json.replace(/\\u003c/g, "<")) as {
  "@context": string;
  "@graph": Record<string, unknown>[];
};
const noeud = (type: string) => graphe["@graph"].find((n) => n["@type"] === type)!;

/** Les dimensions d'un PNG, lues dans son en-tête : octets 16 à 24. */
function taillePng(chemin: string): { largeur: number; hauteur: number } {
  const buf = readFileSync(chemin);
  return { largeur: buf.readUInt32BE(16), hauteur: buf.readUInt32BE(20) };
}

describe("les données structurées", () => {
  it("sont un JSON-LD valide, et le chevron y est échappé", () => {
    expect(rendu).toContain('type="application/ld+json"');
    expect(graphe["@context"]).toBe("https://schema.org");
    // Une valeur ne doit pas pouvoir fermer la balise qui la porte.
    expect(json).not.toContain("</");
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("déclarent l'éditeur et le site, reliés l'un à l'autre", () => {
    const org = noeud("Organization");
    const site = noeud("WebSite");
    expect(org.name).toBe(NOM_DU_SITE);
    expect(site.name).toBe(NOM_DU_SITE);
    expect(org.url).toBe(SITE_URL);
    expect(org.description).toBe(DESCRIPTION_ACCUEIL);
    expect(site.inLanguage).toBe("fr-FR");
    // Sans ce lien, un moteur lit deux entités sans rapport.
    expect(site.publisher).toEqual({ "@id": org["@id"] });
    expect(String(org["@id"])).toContain(SITE_URL);
  });

  it("citent un logo qui existe, à la taille annoncée", () => {
    const logo = noeud("Organization").logo as {
      url: string;
      width: number;
      height: number;
    };
    const chemin = logo.url.slice(SITE_URL.length);
    expect(chemin.startsWith("/")).toBe(true);
    const { largeur, hauteur } = taillePng(join(process.cwd(), "public", chemin));
    expect({ width: largeur, height: hauteur }).toEqual({
      width: logo.width,
      height: logo.height,
    });
    // Un résultat de recherche se pose sur du blanc : c'est la version pour
    // fond clair qu'il faut, l'autre écrit la marque en gris pâle.
    expect(chemin).toContain("light");
  });

  it("n'annoncent rien que le site ne fasse", () => {
    for (const invente of ["SearchAction", "aggregateRating", "offers", "price", "sameAs"]) {
      expect(json, `le balisage annonce « ${invente} », que le site ne porte pas`).not.toContain(
        invente,
      );
    }
  });

  it("ne sont posées que sur l'accueil", () => {
    // L'entité « site » et l'entité « éditeur » se déclarent une fois. Les
    // répéter sur chaque page ne les renforce pas, cela multiplie les
    // occasions de les voir diverger.
    const accueil = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(accueil).toContain("<DonneesStructurees />");
  });
});
