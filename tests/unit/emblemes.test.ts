import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Embleme } from "@/components/embleme";
import { EMBLEMES, emblemeParCode } from "@/config/emblemes";

/**
 * UNE ÉQUIPE A UN NOM ; IL LUI FALLAIT UN VISAGE.
 *
 * Dans la composition, dans le classement, sur l'écran projeté, six lignes de
 * texte gris se ressemblaient toutes. Ce que ce test garde : les emblèmes sont
 * DESSINÉS (un emoji change d'un appareil à l'autre et se brouille au
 * vidéoprojecteur), une équipe sans choix n'affiche rien plutôt qu'une forme
 * par défaut, et un code inconnu ne dessine pas n'importe quoi.
 */

describe("le catalogue des emblèmes", () => {
  it("en tient huit, tous distincts et tous dessinés", () => {
    expect(EMBLEMES).toHaveLength(8);
    expect(new Set(EMBLEMES.map((e) => e.code)).size).toBe(8);
    for (const e of EMBLEMES) {
      expect(e.nom.length, e.code).toBeGreaterThan(2);
      // Un tracé, pas un caractère : c'est toute la différence avec un emoji.
      expect(e.trace.startsWith("M"), e.code).toBe(true);
      expect(e.trace.length, e.code).toBeGreaterThan(20);
    }
  });

  it("un code inconnu ne rend rien", () => {
    expect(emblemeParCode("dragon")).toBeNull();
    expect(emblemeParCode(null)).toBeNull();
    expect(emblemeParCode("")).toBeNull();
  });
});

describe("l'emblème dessiné", () => {
  it("porte le nom de l'ÉQUIPE, pas celui de la forme", () => {
    // Ce qu'un lecteur d'écran doit annoncer, c'est « Volt Partners », pas
    // « éclair » : la forme est un signe, pas une information.
    const html = renderToStaticMarkup(
      createElement(Embleme, { code: "eclair", equipe: "Volt Partners" }),
    );
    expect(html).toContain('aria-label="Emblème de Volt Partners"');
    expect(html).toContain('role="img"');
    expect(html).toContain("<path");
  });

  it("sans emblème, rien du tout : une forme par défaut ferait croire à un choix", () => {
    expect(renderToStaticMarkup(createElement(Embleme, { code: null }))).toBe("");
    expect(renderToStaticMarkup(createElement(Embleme, { code: "inconnu" }))).toBe("");
  });

  it("décoratif quand il accompagne un nom déjà écrit", () => {
    const html = renderToStaticMarkup(createElement(Embleme, { code: "etoile" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("aria-label");
  });
});
