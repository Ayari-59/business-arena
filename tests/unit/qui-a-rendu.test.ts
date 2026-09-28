import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuiARendu } from "@/components/qui-a-rendu";

/**
 * L'ATTENTE DE LA CLÔTURE EST COLLECTIVE : ELLE DOIT SE VOIR.
 *
 * Une fois ses décisions validées, l'équipe lisait « en attente de la
 * clôture », seule devant sa ligne grise, pendant que cinq autres équipes
 * remplissaient le même formulaire.
 *
 * Ce que ce test garde : le compte est ÉCRIT (une rangée de pastilles se compte
 * mal, et ne se lit pas du tout à la voix), personne n'est nommé, et l'accord
 * suit le nombre.
 */

const rendu = (validees: number, total: number) =>
  // React échappe l'apostrophe en `&#x27;` : on lit le texte tel qu'il paraît.
  renderToStaticMarkup(createElement(QuiARendu, { validees, total })).replace(/&#x27;/g, "'");

describe("où en est la classe", () => {
  it("écrit le compte, et accorde le verbe", () => {
    expect(rendu(1, 6)).toContain("1 équipe sur 6 a rendu");
    expect(rendu(3, 6)).toContain("3 équipes sur 6 ont rendu");
  });

  it("dit que la clôture peut venir quand tout le monde a rendu", () => {
    const html = rendu(6, 6);
    expect(html).toContain("Toutes les équipes ont rendu");
    expect(html).not.toContain("sur 6");
  });

  it("aucune équipe n'a encore rendu : on le dit sans dramatiser", () => {
    expect(rendu(0, 4)).toContain("0 équipe sur 4 a rendu pour l'instant");
  });

  it("une pastille par équipe, pleine pour celles qui ont rendu", () => {
    const html = rendu(2, 5);
    expect((html.match(/bg-emerald-400/g) ?? []).length).toBe(2);
    expect((html.match(/border-white\/25/g) ?? []).length).toBe(3);
  });

  it("seul devant sa partie, il n'y a personne à attendre", () => {
    expect(rendu(1, 1)).toBe("");
  });
});
