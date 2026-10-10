import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogueDesEpisodes } from "../../src/components/catalogue-des-episodes";
import {
  ancreDeLaFamille,
  ancreDuSecteur,
  catalogueDesEpisodes,
} from "../../src/config/episodes/catalogue";
import { FAMILLES, SECTEURS } from "../../src/config/episodes/familles";
import { FICHES } from "../../src/config/episodes/fiches";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * LE CATALOGUE EN TIROIRS (« Arvel Distribution découpé par thème, et les
 * autres par métier »). Les deux pages, épisodes et fiches enseignant, rangent
 * leurs cartes par `catalogueDesEpisodes` et les dessinent par
 * `CatalogueDesEpisodes` : ces gardes tiennent le rangement, puis le rendu.
 */
const catalogue = catalogueDesEpisodes();
const codesDu = (c: typeof catalogue) => c.flatMap((e) => e.familles.flatMap((f) => f.episodes));

describe("le rangement du catalogue", () => {
  it("range chaque épisode du registre une fois et une seule, dans l'ordre des numéros", () => {
    const ranges = codesDu(catalogue);
    expect(new Set(ranges).size).toBe(ranges.length);
    expect(ranges).toEqual(EPISODES.map((e) => e.code));
    expect(catalogue.reduce((n, e) => n + e.nombre, 0)).toBe(EPISODES.length);
  });

  it("Arvel Distribution, et elle seule, est découpée par thème : un tiroir par famille du négoce", () => {
    const parTheme = catalogue.filter((e) => e.rangement === "themes");
    expect(parTheme.map((e) => e.secteur.entreprise)).toEqual(["Arvel Distribution"]);
    const arvel = parTheme[0]!;
    expect(arvel.familles.map((f) => f.famille.code)).toEqual(
      FAMILLES.filter((f) => f.secteur === "negoce").map((f) => f.code),
    );
    expect(arvel.familles).toHaveLength(9);
  });

  it("les autres entreprises tiennent chacune dans un tiroir de métier, dans l'ordre des secteurs", () => {
    const parMetier = catalogue.filter((e) => e.rangement === "metier");
    expect(parMetier.map((e) => e.secteur.code)).toEqual(
      SECTEURS.filter((s) => !s.parTheme).map((s) => s.code),
    );
    expect(parMetier).toHaveLength(4);
    for (const e of parMetier) {
      expect(e.familles.map((f) => f.famille.code), e.secteur.code).toEqual(
        FAMILLES.filter((f) => f.secteur === e.secteur.code).map((f) => f.code),
      );
    }
  });

  it("la page des fiches ne garde que les épisodes qui ont une fiche, chacun une fois", () => {
    const fiches = catalogueDesEpisodes((code) => FICHES.some((f) => f.code === code));
    const ranges = codesDu(fiches);
    expect(new Set(ranges).size).toBe(ranges.length);
    expect([...ranges].sort()).toEqual(FICHES.map((f) => f.code).sort());
    for (const e of fiches) for (const f of e.familles) expect(f.episodes.length).toBeGreaterThan(0);
  });
});

/** Le catalogue rendu, chaque carte réduite à un `<li data-ep>`. */
function rendre(entreprises = catalogue): string {
  return renderToStaticMarkup(
    createElement(CatalogueDesEpisodes, {
      entreprises,
      unite: { un: "épisode", plusieurs: "épisodes" },
      carte: (code: string) => createElement("li", { key: code, "data-ep": code }),
    }),
  );
}

describe("le catalogue rendu", () => {
  const html = rendre();

  it("chaque carte une fois ; neuf tiroirs de thème et quatre de métier, tous fermés à l'arrivée", () => {
    for (const ep of EPISODES) {
      expect(html.split(`data-ep="${ep.code}"`).length - 1, ep.code).toBe(1);
    }
    expect(html.match(/data-tiroir-de-theme="/g) ?? []).toHaveLength(9);
    expect(html.match(/data-tiroir-de-metier="/g) ?? []).toHaveLength(4);
    const tiroirs = html.match(/<details\b[^>]*>/g) ?? [];
    expect(tiroirs).toHaveLength(13);
    for (const t of tiroirs) expect(t).not.toMatch(/\bopen\b/);
    // Le chevron commun du site (lot P5), un par tiroir.
    expect(html.match(/data-chevron=""/g) ?? []).toHaveLength(13);
  });

  it("les ancres de la page d'avant existent toutes, une fois, et le sommaire ne vise que des ancres de la page", () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SECTEURS) expect(ids, s.code).toContain(ancreDuSecteur(s.code));
    for (const f of FAMILLES) expect(ids, f.code).toContain(ancreDeLaFamille(f.code));
    const sommaire = html.slice(html.indexOf("<nav"), html.indexOf("</nav>"));
    const cibles = [...sommaire.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]!);
    // Arvel et ses neuf thèmes, puis les quatre autres métiers.
    expect(cibles).toHaveLength(1 + 9 + 4);
    for (const c of cibles) expect(ids, c).toContain(c);
  });

  it("le tiroir d'un thème porte l'ancre de sa famille ; celui d'un métier, l'ancre de son secteur", () => {
    expect(html).toMatch(/<section id="vendre"[^>]*data-tiroir-de-theme="vendre"/);
    expect(html).toMatch(/<section id="secteur-sante"[^>]*data-tiroir-de-metier="sante"/);
    // Une famille d'un métier est DANS le tiroir de son métier.
    const sante = html.slice(html.indexOf('id="secteur-sante"'));
    const fin = sante.indexOf("</details>");
    expect(sante.indexOf('id="sante-soins"')).toBeGreaterThan(0);
    expect(sante.indexOf('id="sante-soins"')).toBeLessThan(fin);
  });

  it("aucun orange dans le catalogue : ouvrir un tiroir n'est pas une action", () => {
    expect(html).not.toMatch(/amber|accent-plein/);
  });
});
