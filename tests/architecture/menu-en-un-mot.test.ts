import { createElement, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, it, vi } from "vitest";

/**
 * UN MOT PAR ENTRÉE, LES MÊMES GROUPES DANS LA BARRE ET LE MENU DÉPLIÉ, LA PÉDAGOGIE EN AVANT,
 * LE LÉGAL EN PETIT.
 *
 * Le propriétaire (novembre 2026) : « un menu plus cohérent et plus simple, avec à chaque fois un
 * seul mot et pas plusieurs ». Le menu d'avant montrait 5 groupes dans la barre et 6 dans le menu
 * déplié (« Élèves » n'était que dans le menu), une précision à côté de trois titres (« lycée, BTS,
 * université ») et des entrées en phrases (« Choisir ma simulation », « Conditions générales
 * d'utilisation »), jusque dans l'espace enseignant (« Mes classes du cours »).
 *
 * Puis, avant la mise en ligne : « les CGV, CGU, RGPD et cie, je ne veux pas que ce soit trop
 * voyant ; le menu horizontal m'a l'air bien ; je veux un menu qui montre la pédagogie et met en
 * avant le produit ». Le menu déplié dit donc, sous le titre du cours, de l'arène et des épisodes,
 * une phrase sur ce qu'on y apprend (en texte discret, jamais une entrée) ; les mentions légales,
 * les CGV et les CGU quittent le menu déplié et les groupes du pied de page pour une seule petite
 * ligne, tout en bas du pied de page.
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
// « Déconnexion » (novembre 2026) : la barre et la rangée de l'espace enseignant importent l'action
// de déconnexion. Cette garde ne lit que leur rendu : l'action est remplacée, sans la base.
vi.mock("@/app/teacher/actions", () => ({ logoutAction: async () => undefined }));

import { SiteHeader } from "@/components/site-header";
import { PiedDePage } from "@/components/pied-de-page";
import { NavigationEnseignant } from "@/components/en-tete-enseignant";
import {
  LIBELLE_DECONNEXION,
  LIEN_ADMINISTRATION,
  LIEN_ETABLISSEMENT,
  NAVIGATION,
  NAVIGATION_ENSEIGNANT,
  liensDAcces,
  liensDeTete,
  tousLesLiens,
} from "@/config/navigation";

/** Les adresses légales : en petit, tout en bas du pied de page ; jamais dans le menu déplié. */
const LEGALES = [
  ["Mentions", "/mentions-legales"],
  ["CGV", "/cgv"],
  ["CGU", "/cgu"],
] as const;

/** Les 3 phrases que le propriétaire a validées, sous le titre de leur groupe, dans le menu déplié seulement. */
const PHRASES: Record<string, string> = {
  cours: "Chaque notion se pratique : vous passez l'écriture, et vous voyez ce qu'elle change dans les comptes.",
  arene: "Vous dirigez une entreprise en équipe, et le marché répond à vos choix.",
  episodes: "Vous décidez en manager, puis vous voyez ce que la décision a coûté.",
};

/** Un mot : une suite sans espace (« CGV », « Établissement », « Aujourd'hui » en est un). */
const estUnMot = (texte: string) => /^\S+$/u.test(texte.trim());

/** Le rendu d'un composant, en document : le HTML statique de React est du XML bien formé. */
function rendre(composant: FunctionComponent, sous = "/notions", props: Record<string, unknown> = {}): Document {
  chemin = sous;
  const html = renderToStaticMarkup(createElement(composant, props));
  return new DOMParser().parseFromString(`<racine>${html}</racine>`, "text/xml") as unknown as Document;
}

/** Tous les éléments d'un document ou d'un bloc, dans l'ordre. */
const elements = (racine: Document | Element): Element[] => Array.from(racine.getElementsByTagName("*")) as Element[];

/** Le premier élément qui porte cet attribut (et cette valeur, si elle est donnée). */
function bloc(doc: Document | Element, attribut: string, valeur?: string): Element {
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
/** Espaces, insécables comprises, ramenées à une espace ordinaire. */
const propre = (s: string) => s.replace(/[\s  ]+/g, " ").trim();

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
      LIBELLE_DECONNEXION,
    ];
    const phrases = mots.filter((m) => !estUnMot(m));
    expect(phrases, `des entrées en plusieurs mots : ${phrases.join(" · ")}`).toEqual([]);
    const precisions = NAVIGATION.filter((g) => "precision" in g).map((g) => `${g.titre} (${String((g as { precision?: string }).precision)})`);
    expect(precisions, `une précision à côté d'un titre : ${precisions.join(", ")}`).toEqual([]);
  });

  it("ce que la barre et le menu déplié affichent tient en un mot ; un nom plus long commence par ce mot", () => {
    // Pour un visiteur, et pour un enseignant connecté (« Déconnexion » à la place de « Connexion »).
    const docs = [rendre(SiteHeader), rendre(SiteHeader, "/notions", { connecte: true })];
    const lus = docs.flatMap((doc) => [
      ...commandes(bloc(doc, "aria-label", "Navigation principale")),
      ...commandes(bloc(doc, "id", "plan-du-site")),
    ]);
    expect(lus.map((c) => c.vu)).toContain(LIBELLE_DECONNEXION);
    // Le bouton qui ouvre le menu se nomme « Menu » : il est de la barre, et un mot lui aussi.
    expect(lus.map((c) => c.vu)).toContain("Menu");
    const phrases = lus.filter((c) => !estUnMot(c.vu)).map((c) => c.vu);
    expect(phrases, `des phrases dans la barre ou le menu : ${phrases.join(" · ")}`).toEqual([]);
    const noms = lus.filter((c) => !c.nom.startsWith(c.vu)).map((c) => `« ${c.vu} » se nomme « ${c.nom} »`);
    expect(noms, noms.join(", ")).toEqual([]);
  });

  it("les 3 phrases de la pédagogie sont sous le titre du cours, de l'arène et des épisodes, dans le menu déplié seulement", () => {
    // Dans le plan : une phrase par groupe qui fait apprendre, aucune pour les offres ni l'aide.
    expect(NAVIGATION.map((g) => [g.code, (g as { phrase?: string }).phrase ?? null])).toEqual(
      NAVIGATION.map((g) => [g.code, PHRASES[g.code] ?? null]),
    );
    // Dans le menu déplié : chaque phrase dans son groupe, après son titre et avant ses entrées,
    // en texte (jamais un lien), discret : l'encre grise, et 14 px, la prose de second plan de
    // l'échelle du site (une phrase ne se lit pas en 12 px : tests/architecture/echelle-typographique.test.ts).
    const menu = bloc(rendre(SiteHeader), "id", "plan-du-site");
    for (const [code, phrase] of Object.entries(PHRASES)) {
      const groupe = bloc(menu, "data-groupe-du-menu", code);
      const porteuse = elements(groupe).find((e) => propre(texteVu(e)) === phrase && e.tagName !== "a" && e.tagName !== "button");
      expect(porteuse, `« ${code} » : la phrase manque sous le titre`).toBeDefined();
      const classe = porteuse!.getAttribute("class") ?? "";
      expect(classe, `« ${code} » : la phrase n'est pas discrète`).toMatch(/\btext-slate-400\b/);
      expect(classe, `« ${code} » : la phrase n'est pas en prose de second plan`).toMatch(/\btext-sm\b/);
      const ordre = elements(groupe);
      const titre = ordre.findIndex((e) => e.hasAttribute("data-titre-du-groupe"));
      const premiereEntree = ordre.findIndex((e) => e.tagName === "ul");
      expect(titre, code).toBeLessThan(ordre.indexOf(porteuse!));
      expect(ordre.indexOf(porteuse!), code).toBeLessThan(premiereEntree);
    }
    // Ni dans la barre, ni au pied de page.
    const barre = propre(texteVu(bloc(rendre(SiteHeader), "aria-label", "Navigation principale")));
    const pied = propre(texteVu(bloc(rendre(PiedDePage), "aria-label", "Plan du site")));
    for (const phrase of Object.values(PHRASES)) {
      expect(barre, "une phrase dans la barre").not.toContain(phrase);
      expect(pied, "une phrase au pied de page").not.toContain(phrase);
    }
  });

  it("aucun lien légal dans le menu déplié", () => {
    const adresses = commandes(bloc(rendre(SiteHeader), "id", "plan-du-site")).map((c) => c.href);
    const legaux = LEGALES.filter(([, href]) => adresses.includes(href)).map(([mot]) => mot);
    expect(legaux, `des liens légaux dans le menu déplié : ${legaux.join(", ")}`).toEqual([]);
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

  it("le pied de page suit les mêmes groupes, sous les mêmes mots, sans phrase ni lien légal", () => {
    const pied = bloc(rendre(PiedDePage), "aria-label", "Plan du site");
    const groupes = elements(pied).filter((e) => e.hasAttribute("data-groupe-du-pied"));
    expect(groupes.map((g) => g.getAttribute("data-groupe-du-pied"))).toEqual(NAVIGATION.map((g) => g.code));
    // Le titre d'une colonne est son premier enfant, et il ne dit que le mot du groupe.
    expect(groupes.map((g) => propre(texteVu(elements(g)[0]!)))).toEqual(NAVIGATION.map((g) => g.titre));
    const lus = commandes(pied);
    const phrases = lus.filter((c) => !estUnMot(c.vu)).map((c) => c.vu);
    expect(phrases, `des phrases au pied de page : ${phrases.join(" · ")}`).toEqual([]);
    const legaux = LEGALES.filter(([, href]) => lus.some((c) => c.href === href)).map(([mot]) => mot);
    expect(legaux, `des liens légaux dans les groupes du pied de page : ${legaux.join(", ")}`).toEqual([]);
  });

  it("la petite ligne légale est tout en bas du pied de page : Mentions · CGV · CGU", () => {
    const doc = rendre(PiedDePage);
    const ligne = bloc(doc, "data-ligne-legale");
    expect(commandes(ligne).map((c) => [c.vu, c.href])).toEqual(LEGALES.map(([mot, href]) => [mot, href]));
    // Après le plan du site, et en petit : elle ou l'un de ses parents est en `text-xs`.
    const tous = elements(doc);
    expect(tous.indexOf(ligne)).toBeGreaterThan(tous.indexOf(bloc(doc, "aria-label", "Plan du site")));
    const enPetit = (e: Node | null): boolean =>
      !!e && e.nodeType === 1 && (/\btext-xs\b/.test((e as Element).getAttribute("class") ?? "") || enPetit(e.parentNode));
    expect(enPetit(ligne), "la ligne légale n'est pas en petit").toBe(true);
    // Sur la page d'une condition, son mot est du texte, comme toute page courante au pied.
    const surLesCgv = bloc(rendre(PiedDePage, "/cgv"), "data-ligne-legale");
    expect(commandes(surLesCgv).map((c) => c.vu)).toEqual(["Mentions", "CGU"]);
  });

  it("le menu de l'espace enseignant tient en un mot, sorties et déconnexion comprises", () => {
    const doc = rendre(NavigationEnseignant, "/teacher", { actif: "parties", liens: { etablissement: true, administration: true } });
    const lus = commandes(bloc(doc, "aria-label", "Espace enseignant")).map((c) => c.vu);
    // « Déconnexion » ferme la rangée (novembre 2026) : tests/architecture/deconnexion.test.ts.
    expect(lus).toEqual([
      ...NAVIGATION_ENSEIGNANT.map((p) => p.libelle),
      LIEN_ETABLISSEMENT.libelle,
      LIEN_ADMINISTRATION.libelle,
      LIBELLE_DECONNEXION,
    ]);
    const phrases = lus.filter((m) => !estUnMot(m));
    expect(phrases, `des phrases dans l'espace enseignant : ${phrases.join(" · ")}`).toEqual([]);
  });
});
