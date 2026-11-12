import { createElement, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, it, vi } from "vitest";

/**
 * UN MOT PAR ENTRÉE, ET LES MÊMES GROUPES DANS LA BARRE ET DANS LE MENU DÉPLIÉ.
 *
 * Le propriétaire (novembre 2026) : « un menu plus cohérent et plus simple, avec à chaque fois un
 * seul mot et pas plusieurs ». Le menu d'avant montrait 5 groupes dans la barre et 6 dans le menu
 * déplié (« Élèves » n'était que dans le menu), une précision à côté de trois titres (« lycée, BTS,
 * université ») et des entrées en phrases (« Choisir ma simulation », « Conditions générales
 * d'utilisation »), jusque dans l'espace enseignant (« Mes classes du cours »).
 *
 * La garde lit le plan (config/navigation.ts), puis ce que la barre, le menu déplié, le pied de
 * page et l'espace enseignant RENDENT : un libellé écrit demain à la main dans un composant y est
 * vu aussi. Ce qui s'affiche tient en un mot ; un bouton peut porter un nom plus long pour une
 * synthèse vocale, à condition qu'il commence par son mot visible (« Rejoindre avec un code »).
 */

let chemin = "/notions";
vi.mock("next/navigation", () => ({
  usePathname: () => chemin,
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
}));

import { SiteHeader } from "@/components/site-header";
import { PiedDePage } from "@/components/pied-de-page";
import { NavigationEnseignant } from "@/components/en-tete-enseignant";
import {
  LIEN_ADMINISTRATION,
  LIEN_ETABLISSEMENT,
  NAVIGATION,
  NAVIGATION_ENSEIGNANT,
  liensDAcces,
  liensDeTete,
  tousLesLiens,
} from "@/config/navigation";

/** Un mot : une suite sans espace (« CGV », « Établissement », « Aujourd'hui » en est un). */
const estUnMot = (texte: string) => /^\S+$/u.test(texte.trim());

/** Le rendu d'un composant, en document : le HTML statique de React est du XML bien formé. */
function rendre(composant: FunctionComponent, sous = "/notions", props: Record<string, unknown> = {}): Document {
  chemin = sous;
  const html = renderToStaticMarkup(createElement(composant, props));
  return new DOMParser().parseFromString(`<racine>${html}</racine>`, "text/xml") as unknown as Document;
}

/** Tous les éléments d'un document, dans l'ordre. */
const elements = (racine: Document | Element): Element[] => Array.from(racine.getElementsByTagName("*")) as Element[];

/** Le premier élément qui porte cet attribut (et cette valeur, si elle est donnée). */
function bloc(doc: Document, attribut: string, valeur?: string): Element {
  const e = elements(doc).find((x) => x.hasAttribute(attribut) && (valeur === undefined || x.getAttribute(attribut) === valeur));
  if (!e) throw new Error(`aucun élément [${attribut}${valeur === undefined ? "" : `="${valeur}"`}] dans le rendu`);
  return e;
}

/** Le texte qu'on VOIT : sans ce qui est caché aux lecteurs (flèches, filets, pictogrammes). */
function texteVu(e: Node): string {
  if (e.nodeType === 3) return e.nodeValue ?? "";
  if (e.nodeType !== 1) return "";
  const el = e as Element;
  if (el.getAttribute("aria-hidden") === "true" || el.tagName === "svg") return "";
  return Array.from(el.childNodes).map(texteVu).join("");
}
const propre = (s: string) => s.replace(/\s+/g, " ").trim();

/** Les commandes d'un bloc (liens et boutons), avec ce qu'elles affichent et le nom qu'elles portent. */
function commandes(racine: Element): { vu: string; nom: string; href: string | null }[] {
  return elements(racine)
    .filter((e) => e.tagName === "a" || e.tagName === "button")
    .map((e) => {
      const vu = propre(texteVu(e));
      // Un attribut absent se lit comme une chaîne vide dans ce document : on demande s'il est là.
      return {
        vu,
        nom: e.hasAttribute("aria-label") ? propre(e.getAttribute("aria-label")!) : vu,
        href: e.hasAttribute("href") ? e.getAttribute("href") : null,
      };
    })
    // Le logo de la barre ne porte pas de texte : son nom est « Accueil ».
    .filter((c) => c.vu.length > 0);
}

describe("le menu en un mot, rangé par produit", () => {
  it("la barre et le menu déplié ont les mêmes groupes, dans le même ordre", () => {
    // La barre pose un mot par groupe (liensDeTete) ; le menu déplié déroule les groupes (NAVIGATION).
    // Un groupe sans mot dans la barre est un groupe que le grand écran ne montre pas.
    expect(liensDeTete().map((l) => l.libelle)).toEqual(NAVIGATION.map((g) => g.titre));
    // Et ce qui est rendu : les mots de la barre, à plat sur grand écran.
    const barre = bloc(rendre(SiteHeader), "aria-label", "Navigation principale");
    const aPlat = elements(barre).find((e) => e.tagName === "ul");
    expect(aPlat, "la barre n'a plus sa rangée de mots").toBeDefined();
    expect(commandes(aPlat!).map((c) => c.vu)).toEqual(NAVIGATION.map((g) => g.titre));
  });

  it("chaque titre de groupe et chaque entrée du plan tiennent en un mot, sans précision à côté", () => {
    const mots = [
      ...NAVIGATION.map((g) => g.titre),
      ...tousLesLiens().map((l) => l.libelle),
      ...liensDAcces().map((l) => l.libelle),
      ...NAVIGATION_ENSEIGNANT.map((p) => p.libelle),
      LIEN_ETABLISSEMENT.libelle,
      LIEN_ADMINISTRATION.libelle,
    ];
    const phrases = mots.filter((m) => !estUnMot(m));
    expect(phrases, `des entrées en plusieurs mots : ${phrases.join(" · ")}`).toEqual([]);
    const precisions = NAVIGATION.filter((g) => "precision" in g).map((g) => `${g.titre} (${String((g as { precision?: string }).precision)})`);
    expect(precisions, `une précision à côté d'un titre : ${precisions.join(", ")}`).toEqual([]);
  });

  it("ce que la barre et le menu déplié affichent tient en un mot ; un nom plus long commence par ce mot", () => {
    const doc = rendre(SiteHeader);
    const lus = [
      ...commandes(bloc(doc, "aria-label", "Navigation principale")),
      ...commandes(bloc(doc, "id", "plan-du-site")),
    ];
    // Le bouton qui ouvre le menu se nomme « Menu » : il est de la barre, et un mot lui aussi.
    expect(lus.map((c) => c.vu)).toContain("Menu");
    const phrases = lus.filter((c) => !estUnMot(c.vu)).map((c) => c.vu);
    expect(phrases, `des phrases dans la barre ou le menu : ${phrases.join(" · ")}`).toEqual([]);
    const noms = lus.filter((c) => !c.nom.startsWith(c.vu)).map((c) => `« ${c.vu} » se nomme « ${c.nom} »`);
    expect(noms, noms.join(", ")).toEqual([]);
  });

  it("en tête du menu déplié, rien d'autre que Rejoindre et Connexion, puis les groupes", () => {
    const menu = commandes(bloc(rendre(SiteHeader), "id", "plan-du-site"));
    const portes = liensDAcces();
    // Les premières commandes du menu déplié sont les deux portes, et elles seules.
    expect(menu.slice(0, portes.length).map((c) => c.href), "une autre action en tête du menu").toEqual(portes.map((l) => l.href));
    expect(portes.map((l) => l.libelle)).toEqual(["Rejoindre", "Connexion"]);
    // Juste après les portes : le premier groupe, sous le mot de la barre et vers la même page.
    expect(menu[portes.length]).toMatchObject({ vu: NAVIGATION[0]!.titre, href: liensDeTete()[0]!.href });
  });

  it("le menu déplié marque la page où l'on est, pas une page d'un autre groupe dont l'adresse la préfixe", () => {
    // Sur le catalogue des épisodes, « Épisodes » (son titre) et « Catalogue » (son entrée) mènent à
    // la page ; « Métiers » (/entreprises), qui est de l'arène, ne s'allume pas avec eux.
    const menu = bloc(rendre(SiteHeader, "/entreprises/episode"), "id", "plan-du-site");
    const marques = elements(menu)
      .filter((e) => e.getAttribute("aria-current") === "page")
      .map((e) => e.getAttribute("href"));
    expect(marques).toEqual(["/entreprises/episode", "/entreprises/episode"]);
  });

  it("le pied de page suit les mêmes groupes, sous les mêmes mots, sans précision", () => {
    const pied = bloc(rendre(PiedDePage), "aria-label", "Plan du site");
    const groupes = elements(pied).filter((e) => e.hasAttribute("data-groupe-du-pied"));
    expect(groupes.map((g) => g.getAttribute("data-groupe-du-pied"))).toEqual(NAVIGATION.map((g) => g.code));
    // Le titre d'une colonne est son premier enfant, et il ne dit que le mot du groupe.
    expect(groupes.map((g) => propre(texteVu(elements(g)[0]!)))).toEqual(NAVIGATION.map((g) => g.titre));
    const phrases = commandes(pied).filter((c) => !estUnMot(c.vu)).map((c) => c.vu);
    expect(phrases, `des phrases au pied de page : ${phrases.join(" · ")}`).toEqual([]);
  });

  it("le menu de l'espace enseignant tient en un mot, sorties comprises", () => {
    const doc = rendre(NavigationEnseignant, "/teacher", { actif: "parties", liens: { etablissement: true, administration: true } });
    const lus = commandes(bloc(doc, "aria-label", "Espace enseignant")).map((c) => c.vu);
    expect(lus).toEqual([...NAVIGATION_ENSEIGNANT.map((p) => p.libelle), LIEN_ETABLISSEMENT.libelle, LIEN_ADMINISTRATION.libelle]);
    const phrases = lus.filter((m) => !estUnMot(m));
    expect(phrases, `des phrases dans l'espace enseignant : ${phrases.join(" · ")}`).toEqual([]);
  });
});
