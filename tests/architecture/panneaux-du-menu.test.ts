import { createElement, type FunctionComponent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, it, vi } from "vitest";

/**
 * UN PANNEAU PAR MOT (le propriétaire, 12 novembre 2026 : « le menu n'est pas au top visuellement » ;
 * des trois maquettes, il a choisi la A).
 *
 * Sur grand écran, plus de bouton « Menu » : chaque mot de la barre (Cours · Arène · Épisodes · Offres
 * · Aide) ouvre SON panneau. À gauche, le pictogramme du produit, son nom, sa phrase et un bouton plein
 * vers sa page ; à droite, chaque entrée en carte : son pictogramme, son mot, et une ligne qui dit à
 * quoi elle sert. Sur téléphone, « Menu » ouvre la liste des 5 groupes (pictogramme, nom, phrase
 * courte, chevron), Rejoindre et Connexion en tête ; un groupe touché montre ses entrées avec leur
 * ligne, et son bouton.
 *
 * La garde lit le plan (config/navigation.ts), puis ce que la barre REND (rendu statique, lu avec
 * @xmldom/xmldom, comme tests/architecture/menu-en-un-mot.test.ts) : chaque groupe a son panneau, avec
 * toutes ses entrées ; chaque entrée a sa ligne et son pictogramme ; chaque panneau a son bouton vers
 * la page du groupe ; et chaque page du plan reste atteignable sur téléphone comme sur grand écran.
 * Ce que la souris, le doigt et le clavier en font (survol, clic, Échap, tabulation) se vérifie dans
 * un vrai navigateur : tests/e2e/menu.e2e.ts et tests/e2e/accessibilite.e2e.ts.
 */

let chemin = "/notions";
vi.mock("next/navigation", () => ({
  usePathname: () => chemin,
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
}));
// La barre importe l'action de déconnexion : remplacée, sans la base.
vi.mock("@/app/teacher/actions", () => ({ logoutAction: async () => undefined }));

import { SiteHeader } from "@/components/site-header";
import { NOMS_D_ICONE } from "@/components/icone";
import * as plan from "@/config/navigation";
import { NAVIGATION, liensDAcces } from "@/config/navigation";

/** Les boutons des panneaux, mot pour mot, et la page où chacun mène (la décision du propriétaire). */
const APPELS: Record<string, [string, string]> = {
  cours: ["Voir les diplômes", "/cours"],
  arene: ["Voir l'arène", "/fonctionnalites"],
  episodes: ["Voir les épisodes", "/entreprises/episode"],
  offres: ["Voir les offres", "/tarifs"],
  aide: ["Voir les guides", "/guides"],
};

/** Les trois lignes que la maquette donnait pour le cours. */
const LIGNES_DE_LA_MAQUETTE: Record<string, string> = {
  "/cours": "Du bac STMG au DSCG : les chapitres dans l'ordre où ils s'apprennent.",
  "/notions": "Les fiches des notions, à relire avant ou après un chapitre.",
  "/parcours": "Ce que le cours couvre, bloc par bloc, pour chaque diplôme.",
};

/** Les phrases courtes de la liste du téléphone : le début des phrases de la pédagogie. */
const PHRASES_COURTES: Record<string, string | null> = {
  cours: "Chaque notion se pratique",
  arene: "Vous dirigez une entreprise en équipe",
  episodes: "Vous décidez en manager",
  offres: null,
  aide: null,
};

/** Une ligne de carte : une à deux lignes à 1 280 px, la carte de la maquette en tient autant. */
const LIGNE_AU_PLUS = 72;

type Entree = plan.LienDeMenu & { ligne?: unknown; icone?: unknown };
const entrees = (): Entree[] => NAVIGATION.flatMap((g) => g.liens as Entree[]);
const groupe = (code: string) => NAVIGATION.find((g) => g.code === code)! as plan.GroupeDeMenu & { appel?: unknown; icone?: unknown };

/** Le rendu de la barre, en document : le HTML statique de React est du XML bien formé. */
function rendre(composant: FunctionComponent, sous = "/notions", props: Record<string, unknown> = {}): Document {
  chemin = sous;
  const html = renderToStaticMarkup(createElement(composant, props));
  return new DOMParser().parseFromString(`<racine>${html}</racine>`, "text/xml") as unknown as Document;
}

const elements = (racine: Document | Element): Element[] => Array.from(racine.getElementsByTagName("*")) as Element[];

function bloc(doc: Document | Element, attribut: string, valeur?: string): Element {
  const e = elements(doc).find((x) => x.hasAttribute(attribut) && (valeur === undefined || x.getAttribute(attribut) === valeur));
  if (!e) throw new Error(`aucun élément [${attribut}${valeur === undefined ? "" : `="${valeur}"`}] dans le rendu`);
  return e;
}

/** Le texte qu'on VOIT : sans ce qui est caché aux lecteurs (pictogrammes, chevrons, filets). */
function texteVu(e: Node): string {
  if (e.nodeType === 3) return e.nodeValue ?? "";
  if (e.nodeType !== 1) return "";
  const el = e as Element;
  if (el.getAttribute("aria-hidden") === "true" || el.tagName === "svg") return "";
  return Array.from(el.childNodes).map(texteVu).join("");
}
/** Espaces, insécables comprises, ramenées à une espace ordinaire. */
const propre = (s: string) => s.replace(/[\s  ]+/g, " ").trim();

/** Le texte des éléments que nomment des identifiants (`aria-labelledby`, `aria-describedby`). */
function parIdentifiants(doc: Document, ids: string | null): string | null {
  if (!ids) return null;
  const tous = elements(doc);
  return propre(
    ids
      .split(/\s+/)
      .map((id) => {
        const cible = tous.find((x) => x.getAttribute("id") === id);
        if (!cible) throw new Error(`#${id} n'existe pas dans le rendu`);
        return texteVu(cible);
      })
      .join(" "),
  );
}

/** Ce qu'une commande affiche, le nom qu'elle porte et ce qui la décrit, comme une synthèse vocale les lit. */
function lue(doc: Document, e: Element) {
  const vu = propre(texteVu(e));
  const nom = parIdentifiants(doc, e.getAttribute("aria-labelledby")) ?? (e.hasAttribute("aria-label") ? propre(e.getAttribute("aria-label")!) : vu);
  return {
    balise: e.tagName,
    vu,
    nom,
    description: parIdentifiants(doc, e.getAttribute("aria-describedby")),
    href: e.hasAttribute("href") ? e.getAttribute("href") : null,
    pictogramme: elements(e).some((x) => x.tagName === "svg" && !x.hasAttribute("data-chevron")),
  };
}

/** Les liens et les boutons d'un bloc, dans l'ordre du document. */
const commandes = (doc: Document, racine: Element) =>
  elements(racine)
    .filter((e) => e.tagName === "a" || e.tagName === "button")
    .map((e) => lue(doc, e))
    .filter((c) => c.vu.length > 0);

/** Un élément est au repos s'il n'est sous aucun bloc fermé (`hidden`). */
function auRepos(e: Element, jusqua: Element): boolean {
  for (let p: Node | null = e; p && p !== jusqua; p = p.parentNode) {
    if (p.nodeType === 1 && (p as Element).hasAttribute("hidden")) return false;
  }
  return true;
}

/** Toutes les adresses du plan : la page de chaque groupe, ses entrées, les deux portes. */
const ADRESSES = [...new Set([...NAVIGATION.flatMap((g) => [g.entree, ...g.liens.map((l) => l.href)]), ...liensDAcces().map((l) => l.href)])];

describe("le plan : une ligne et un pictogramme par entrée, un bouton et un pictogramme par groupe", () => {
  it("chaque entrée a sa ligne : une phrase courte, écrite comme le site écrit ; les trois du cours sont celles de la maquette", () => {
    const sansLigne = entrees().filter((l) => typeof l.ligne !== "string" || l.ligne.trim() === "").map((l) => l.libelle);
    expect(sansLigne, `des entrées sans ligne : ${sansLigne.join(", ")}`).toEqual([]);
    for (const l of entrees()) {
      const ligne = l.ligne as string;
      expect(ligne.length, `« ${l.libelle} » : ligne de ${ligne.length} signes`).toBeLessThanOrEqual(LIGNE_AU_PLUS);
      // Une seule phrase, qui commence par une capitale et finit par un point.
      expect(ligne, l.libelle).toMatch(/^[A-ZÀ-Ý][^.!?]*\.$/u);
      // Aucun tiret au milieu d'une phrase (les règles de rédaction du site).
      expect(ligne, l.libelle).not.toMatch(/\s[-–—]\s/);
      // Aucun chiffre écrit à la main : un volume, un délai ou un prix se lit dans le registre (CLAUDE.md).
      expect(ligne, l.libelle).not.toMatch(/\d/);
      // La ligne décrit l'entrée ; elle ne la répète pas mot pour mot, et ne recopie pas son aide.
      expect(ligne, l.libelle).not.toBe(l.aide);
    }
    for (const [href, ligne] of Object.entries(LIGNES_DE_LA_MAQUETTE)) {
      expect(entrees().find((l) => l.href === href)?.ligne, href).toBe(ligne);
    }
  });

  it("chaque groupe a son pictogramme et son bouton, aux mots décidés ; chaque entrée, son pictogramme, pris dans la liste fermée du site", () => {
    expect(NAVIGATION.map((g) => [g.code, groupe(g.code).appel ?? null, g.entree])).toEqual(
      NAVIGATION.map((g) => [g.code, ...(APPELS[g.code] ?? [null, null])]),
    );
    const horsListe = [
      ...NAVIGATION.map((g) => [g.titre, groupe(g.code).icone] as const),
      ...entrees().map((l) => [l.libelle, l.icone] as const),
    ].filter(([, icone]) => !NOMS_D_ICONE.includes(icone as (typeof NOMS_D_ICONE)[number]));
    expect(horsListe.map(([qui, icone]) => `${qui} : ${String(icone)}`), "des pictogrammes absents de components/icone.tsx").toEqual([]);
  });

  it("une page garde le même dessin partout où elle paraît, et deux pages n'en partagent pas", () => {
    // « Cours » et « Diplômes » mènent à /cours : le même pictogramme. « Notions » et « Référentiels »,
    // deux pages, deux dessins : une carte se reconnaît avant de se lire.
    const parPage = new Map<string, Set<string>>();
    const noter = (href: string, icone: unknown) => parPage.set(href, (parPage.get(href) ?? new Set()).add(String(icone)));
    for (const g of NAVIGATION) {
      noter(g.entree, groupe(g.code).icone);
      for (const l of g.liens as Entree[]) noter(l.href, l.icone);
    }
    const plusieurs = [...parPage].filter(([, d]) => d.size > 1).map(([href, d]) => `${href} : ${[...d].join(" / ")}`);
    expect(plusieurs, "une page, plusieurs dessins").toEqual([]);
    const pagesParDessin = new Map<string, string[]>();
    for (const [href, d] of parPage) pagesParDessin.set([...d][0]!, [...(pagesParDessin.get([...d][0]!) ?? []), href]);
    const partages = [...pagesParDessin].filter(([, pages]) => pages.length > 1).map(([d, pages]) => `${d} : ${pages.join(", ")}`);
    expect(partages, "un dessin, plusieurs pages").toEqual([]);
  });

  it("la phrase courte du téléphone est le début de la phrase du groupe, lue dans le plan", () => {
    const phraseCourte = (plan as Record<string, unknown>).phraseCourte as ((g: plan.GroupeDeMenu) => string | undefined) | undefined;
    expect(typeof phraseCourte, "le plan ne dit pas la phrase courte d'un groupe").toBe("function");
    expect(NAVIGATION.map((g) => [g.code, phraseCourte!(g) ?? null])).toEqual(NAVIGATION.map((g) => [g.code, PHRASES_COURTES[g.code] ?? null]));
    for (const g of NAVIGATION.filter((x) => x.phrase)) expect(g.phrase!.startsWith(phraseCourte!(g)!), g.code).toBe(true);
  });
});

describe("sur grand écran, chaque mot ouvre son panneau", () => {
  it("chaque mot de la barre est un bouton qui dit ce qu'il ouvre et s'il l'a ouvert ; son panneau le suit, fermé au repos ; aucun rôle de menu d'application", () => {
    const doc = rendre(SiteHeader);
    for (const g of NAVIGATION) {
      const mot = bloc(doc, "data-mot-de-la-barre", g.code);
      expect([mot.tagName, mot.getAttribute("type"), propre(texteVu(mot))], g.code).toEqual(["button", "button", g.titre]);
      expect(mot.getAttribute("aria-expanded"), `« ${g.titre} » ne dit pas s'il est déplié`).toBe("false");
      const cible = mot.getAttribute("aria-controls");
      expect(cible, `« ${g.titre} » ne dit pas ce qu'il ouvre`).toBe(`panneau-${g.code}`);
      const panneau = bloc(doc, "id", cible!);
      expect(panneau.getAttribute("data-panneau-du-groupe"), g.code).toBe(g.code);
      expect(panneau.hasAttribute("hidden"), `le panneau de « ${g.titre} » est ouvert au repos`).toBe(true);
      // Le panneau suit son mot dans le document : la tabulation passe du mot à ce qu'il ouvre.
      let suivant = mot.nextSibling;
      while (suivant && suivant.nodeType !== 1) suivant = suivant.nextSibling;
      expect(suivant, `le panneau de « ${g.titre} » ne suit pas son mot`).toBe(panneau);
    }
    // Le motif « disclosure navigation » : des boutons et des liens, pas un menu d'application.
    const roles = elements(doc).map((e) => e.getAttribute("role")).filter((r) => r && /^menu/.test(r));
    expect(roles, "un rôle de menu d'application dans la barre").toEqual([]);
  });

  it("chaque panneau : le pictogramme du produit, son nom, sa phrase s'il en a une, son bouton plein vers sa page, puis toutes ses entrées en cartes", () => {
    const doc = rendre(SiteHeader);
    for (const g of NAVIGATION) {
      const panneau = bloc(doc, "data-panneau-du-groupe", g.code);
      const tous = elements(panneau);
      // Le produit : un pictogramme, puis son nom.
      const nom = tous.find((e) => e.tagName === "p" && propre(texteVu(e)) === g.titre);
      expect(nom, `« ${g.titre} » : le panneau ne dit pas le nom du produit`).toBeDefined();
      const premierDessin = tous.findIndex((e) => e.tagName === "svg");
      expect(premierDessin, `« ${g.titre} » : pas de pictogramme du produit`).toBeGreaterThanOrEqual(0);
      expect(premierDessin, g.code).toBeLessThan(tous.indexOf(nom!));
      // La phrase de la pédagogie, s'il en a une, sous le nom.
      const phrase = tous.find((e) => e.hasAttribute("data-phrase-du-groupe"));
      expect(phrase ? propre(texteVu(phrase)) : null, g.code).toBe(g.phrase ?? null);
      // Le bouton plein, un seul, vers la page du groupe, sous les mots décidés.
      const pleins = tous.filter((e) => /\bbouton-plein\b/.test(e.getAttribute("class") ?? ""));
      expect(pleins.map((e) => lue(doc, e)).map((c) => [c.balise, c.vu, c.href]), `« ${g.titre} » : son bouton`).toEqual([
        ["a", ...(APPELS[g.code] ?? [])],
      ]);
      expect(tous.indexOf(nom!)).toBeLessThan(tous.indexOf(pleins[0]!));
      // Les entrées, toutes, dans l'ordre du plan : le mot en nom, la ligne en description, un pictogramme.
      const cartes = tous.filter((e) => e.hasAttribute("data-entree-du-panneau")).map((e) => lue(doc, e));
      expect(
        cartes.map((c) => [c.balise, c.href, c.nom, c.description, c.pictogramme]),
        `« ${g.titre} » : ses cartes`,
      ).toEqual(g.liens.map((l) => ["a", l.href, l.libelle, (l as Entree).ligne, true]));
      // La liste des cartes porte le nom du produit, pour une synthèse vocale.
      const liste = tous.find((e) => e.tagName === "ul");
      expect(parIdentifiants(doc, liste?.getAttribute("aria-labelledby") ?? null), g.code).toBe(g.titre);
    }
  });
});

describe("sur téléphone, « Menu » ouvre la liste des groupes, puis un groupe", () => {
  it("la liste : Rejoindre et Connexion en tête, puis les 5 groupes, chacun avec son pictogramme, son nom, sa phrase courte et un chevron", () => {
    const doc = rendre(SiteHeader);
    const menu = bloc(doc, "id", "plan-du-site");
    expect(menu.hasAttribute("hidden"), "le menu est ouvert au repos").toBe(true);
    const boutonMenu = elements(doc).find((e) => e.tagName === "button" && propre(texteVu(e)) === "Menu");
    expect(boutonMenu?.getAttribute("aria-controls")).toBe("plan-du-site");
    expect(boutonMenu?.getAttribute("aria-expanded")).toBe("false");
    const liste = bloc(menu, "data-liste-des-groupes");
    const lues = commandes(doc, liste);
    expect(lues.slice(0, 2).map((c) => [c.vu, c.href]), "en tête, les deux portes").toEqual(liensDAcces().map((l) => [l.libelle, l.href]));
    const rangees = elements(liste).filter((e) => e.hasAttribute("data-groupe-du-menu"));
    expect(rangees.map((e) => e.getAttribute("data-groupe-du-menu"))).toEqual(NAVIGATION.map((g) => g.code));
    for (const [i, g] of NAVIGATION.entries()) {
      const r = rangees[i]!;
      const c = lue(doc, r);
      expect([c.balise, c.nom, c.description, c.pictogramme], g.code).toEqual(["button", g.titre, PHRASES_COURTES[g.code] ?? null, true]);
      expect(elements(r).some((e) => e.hasAttribute("data-chevron")), `« ${g.titre} » : pas de chevron`).toBe(true);
      expect(r.getAttribute("aria-controls"), g.code).toBe(`plan-${g.code}`);
      const vue = bloc(doc, "id", `plan-${g.code}`);
      expect([vue.getAttribute("data-groupe-du-plan"), vue.hasAttribute("hidden")], g.code).toEqual([g.code, true]);
    }
  });

  it("un groupe ouvert : « Retour », le produit, son bouton vers sa page, puis ses entrées avec leur ligne et leur pictogramme", () => {
    const doc = rendre(SiteHeader);
    for (const g of NAVIGATION) {
      const vue = bloc(doc, "data-groupe-du-plan", g.code);
      const lues = commandes(doc, vue);
      // « Retour » d'abord : il ramène à la liste sans fermer le menu.
      expect([lues[0]?.balise, lues[0]?.vu], g.code).toEqual(["button", "Retour"]);
      expect(lues[0]!.nom.startsWith("Retour"), g.code).toBe(true);
      // Le bouton du groupe, puis ses entrées : toutes, dans l'ordre du plan.
      expect([lues[1]?.balise, lues[1]?.vu, lues[1]?.href], g.code).toEqual(["a", ...(APPELS[g.code] ?? [])]);
      expect(
        lues.slice(2).map((c) => [c.balise, c.href, c.nom, c.description, c.pictogramme]),
        `« ${g.titre} » : ses entrées`,
      ).toEqual(g.liens.map((l) => ["a", l.href, l.libelle, (l as Entree).ligne, true]));
      const phrase = elements(vue).find((e) => e.hasAttribute("data-phrase-du-groupe"));
      expect(phrase ? propre(texteVu(phrase)) : null, g.code).toBe(g.phrase ?? null);
    }
  });
});

describe("aucune page ne se perd", () => {
  for (const connecte of [false, true]) {
    it(`chaque page du plan reste atteignable, sur grand écran comme sur téléphone${connecte ? " (connecté)" : ""}`, () => {
      const doc = rendre(SiteHeader, "/notions", { connecte });
      const attendues = ADRESSES.filter((h) => !(connecte && h === "/teacher/login"));
      // Grand écran : ce que la barre montre au repos (ses mots, ses portes), et ce que chaque mot ouvre.
      // Le menu du téléphone n'en est pas (fermé au repos, et sur grand écran il n'y a plus de bouton
      // « Menu ») : ce qu'il porte ne compte pas ici.
      const barre = bloc(doc, "aria-label", "Navigation principale");
      const auReposDansLaBarre = elements(barre).filter((e) => auRepos(e, barre));
      const ouverts = auReposDansLaBarre
        .filter((e) => e.tagName === "button" && e.hasAttribute("aria-controls"))
        .map((e) => e.getAttribute("aria-controls")!)
        .filter((id) => id !== "plan-du-site");
      const grandEcran = new Set([
        ...auReposDansLaBarre.filter((e) => e.tagName === "a").map((e) => e.getAttribute("href")),
        ...ouverts.flatMap((id) => elements(bloc(doc, "id", id)).filter((e) => e.tagName === "a").map((e) => e.getAttribute("href"))),
      ]);
      const manquentEnGrand = attendues.filter((h) => !grandEcran.has(h));
      expect(manquentEnGrand, `sur grand écran, injoignable depuis la barre : ${manquentEnGrand.join(", ")}`).toEqual([]);
      // Téléphone : le menu, sa liste et chaque groupe qu'elle ouvre.
      const menu = bloc(doc, "id", "plan-du-site");
      const liste = bloc(menu, "data-liste-des-groupes");
      const groupesOuverts = elements(liste)
        .filter((e) => e.tagName === "button" && e.hasAttribute("aria-controls"))
        .map((e) => e.getAttribute("aria-controls")!);
      expect(groupesOuverts, "la liste du téléphone n'ouvre pas chaque groupe").toEqual(NAVIGATION.map((g) => `plan-${g.code}`));
      const telephone = new Set([
        ...elements(liste).filter((e) => e.tagName === "a").map((e) => e.getAttribute("href")),
        ...groupesOuverts.flatMap((id) => elements(bloc(doc, "id", id)).filter((e) => e.tagName === "a").map((e) => e.getAttribute("href"))),
      ]);
      const manquentAuTelephone = attendues.filter((h) => !telephone.has(h));
      expect(manquentAuTelephone, `sur téléphone, injoignable depuis le menu : ${manquentAuTelephone.join(", ")}`).toEqual([]);
    });
  }
});
