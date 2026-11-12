import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement, type FunctionComponent, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, it, vi } from "vitest";

/**
 * « DÉCONNEXION » QUAND ON EST CONNECTÉ (le propriétaire, novembre 2026 : « Il me faut un bouton
 * déconnexion quand je suis connecté »).
 *
 * La barre du site disait toujours « Rejoindre » et « Connexion », à qui était connecté comme aux
 * autres ; la déconnexion ne se trouvait qu'au bout de la rangée de l'accueil de l'espace enseignant
 * (« Se déconnecter », « Se déconnecter partout ») et dans « Mon compte ». Ce qui a été validé, et que
 * cette garde tient :
 *  · connecté (une session enseignant : c'est aussi celle du référent d'un établissement et de
 *    l'administrateur ; un élève qui joue par code n'en a pas), « Connexion » devient « Déconnexion »,
 *    un mot, dans la barre et en tête du menu déplié, et le bouton passe par le formulaire de
 *    déconnexion et `logoutAction`, comme avant. Non connecté, rien ne change ;
 *  · la barre ne reçoit qu'un booléen, lu au serveur par la mise en page ;
 *  · « Déconnexion » ferme la rangée de l'espace enseignant, sur chacune de ses pages ;
 *  · « Se déconnecter partout » est dans « Mon compte », et les formulaires de l'accueil de l'espace,
 *    devenus des doublons, n'y sont plus.
 *
 * La barre et la rangée sont lues dans ce qu'elles RENDENT ; les pages, dans leur source.
 */

/** Le mot validé : un seul. */
const DECONNEXION = "Déconnexion";

let chemin = "/notions";
vi.mock("next/navigation", () => ({
  usePathname: () => chemin,
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
}));

// Les deux actions de déconnexion, reconnaissables à leur identité ; le formulaire de déconnexion,
// rendu ici, dit laquelle il envoie. Un <form> écrit à la main ne porte pas ce repère.
const actions = vi.hoisted(() => ({
  logoutAction: async () => undefined,
  logoutEverywhereAction: async () => undefined,
}));
vi.mock("@/app/teacher/actions", () => actions);
vi.mock("@/components/formulaire-de-deconnexion", async () => {
  const { createElement: element } = await import("react");
  return {
    FormulaireDeDeconnexion: ({ action, children }: { action: unknown; children: ReactNode }) =>
      element(
        "form",
        {
          "data-deconnexion": "",
          "data-action":
            action === actions.logoutAction
              ? "logoutAction"
              : action === actions.logoutEverywhereAction
                ? "logoutEverywhereAction"
                : "inconnue",
        },
        children,
      ),
  };
});

import { SiteHeader } from "@/components/site-header";
import { NavigationEnseignant } from "@/components/en-tete-enseignant";
import { NAVIGATION_ENSEIGNANT, liensDeTete } from "@/config/navigation";

/** Le rendu d'un composant, en document : le HTML statique de React est du XML bien formé. */
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

function texteVu(e: Node): string {
  if (e.nodeType === 3) return e.nodeValue ?? "";
  if (e.nodeType !== 1) return "";
  const el = e as Element;
  if (el.getAttribute("aria-hidden") === "true" || el.tagName === "svg") return "";
  return Array.from(el.childNodes).map(texteVu).join("");
}
const propre = (s: string) => s.replace(/[\s  ]+/g, " ").trim();

/** Le formulaire qui porte un élément : l'action qu'il envoie, s'il passe par le formulaire de déconnexion. */
function formulaireDe(e: Element): string | null {
  for (let p: Node | null = e.parentNode; p && p.nodeType === 1; p = p.parentNode) {
    const f = p as Element;
    if (f.tagName === "form") return f.hasAttribute("data-deconnexion") ? f.getAttribute("data-action") : "formulaire ordinaire";
  }
  return null;
}

/** Les commandes d'un bloc (liens et boutons), dans l'ordre : ce qu'elles affichent, leur nom, leur cible. */
function commandes(racine: Document | Element) {
  return elements(racine)
    .filter((e) => e.tagName === "a" || e.tagName === "button")
    .map((e) => {
      const vu = propre(texteVu(e));
      return {
        balise: e.tagName,
        vu,
        nom: e.hasAttribute("aria-label") ? propre(e.getAttribute("aria-label")!) : vu,
        href: e.hasAttribute("href") ? e.getAttribute("href") : null,
        type: e.getAttribute("type"),
        formulaire: formulaireDe(e),
        classes: (e.getAttribute("class") ?? "").split(/\s+/).filter(Boolean),
      };
    })
    .filter((c) => c.vu.length > 0);
}

/** Les commandes de la barre (sur grand écran) et de la tête du menu déplié. */
function barreEtPortes(props: Record<string, unknown>) {
  const doc = rendre(SiteHeader, "/notions", props);
  return {
    doc,
    barre: commandes(bloc(doc, "aria-label", "Navigation principale")),
    portes: commandes(bloc(doc, "data-portes-du-menu")),
  };
}

const MOTS_DE_LA_BARRE = liensDeTete().map((l) => l.libelle);

describe("la barre du site, connecté ou non", () => {
  it("non connecté, rien ne change : Rejoindre et Connexion, dans la barre et en tête du menu déplié", () => {
    for (const props of [{}, { connecte: false }]) {
      const { doc, barre, portes } = barreEtPortes(props);
      expect(barre.map((c) => c.vu), JSON.stringify(props)).toEqual([...MOTS_DE_LA_BARRE, "Rejoindre", "Connexion", "Menu"]);
      expect(portes.map((c) => [c.balise, c.vu, c.href])).toEqual([
        ["a", "Rejoindre", "/join"],
        ["a", "Connexion", "/teacher/login"],
      ]);
      expect(commandes(doc).some((c) => c.vu === DECONNEXION), "« Déconnexion » à qui n'est pas connecté").toBe(false);
      expect(elements(doc).filter((e) => e.tagName === "form"), "un formulaire dans la barre d'un visiteur").toEqual([]);
    }
  });

  it("connecté, « Connexion » devient « Déconnexion », à la même place, dans la barre et en tête du menu déplié", () => {
    const { doc, barre, portes } = barreEtPortes({ connecte: true });
    expect(barre.map((c) => c.vu), "la barre d'un enseignant connecté").toEqual([...MOTS_DE_LA_BARRE, "Rejoindre", DECONNEXION, "Menu"]);
    expect(portes.map((c) => [c.balise, c.vu]), "la tête du menu déplié d'un enseignant connecté").toEqual([
      ["a", "Rejoindre"],
      ["button", DECONNEXION],
    ]);
    // Plus aucune porte vers la page de connexion, nulle part dans la barre.
    expect(commandes(doc).filter((c) => c.href === "/teacher/login").map((c) => c.vu)).toEqual([]);
  });

  it("le bouton passe par le formulaire de déconnexion et logoutAction ; un mot, sans autre nom", () => {
    const { barre, portes } = barreEtPortes({ connecte: true });
    const boutons = [...barre, ...portes].filter((c) => c.vu === DECONNEXION);
    expect(boutons).toHaveLength(2);
    for (const b of boutons) {
      expect(b.balise, "« Déconnexion » est un lien : il se suivrait et se préchargerait").toBe("button");
      expect(b.type).toBe("submit");
      expect(b.formulaire, "le bouton ne passe pas par le formulaire de déconnexion et logoutAction").toBe("logoutAction");
      expect(b.nom).toBe(DECONNEXION);
    }
  });

  it("le bouton a la forme de la porte qu'il remplace, dans la barre comme dans le menu déplié", () => {
    const avant = barreEtPortes({});
    const apres = barreEtPortes({ connecte: true });
    for (const lieu of ["barre", "portes"] as const) {
      const porte = avant[lieu].find((c) => c.vu === "Connexion");
      const bouton = apres[lieu].find((c) => c.vu === DECONNEXION);
      expect(porte, `${lieu} : la porte « Connexion » d'un visiteur`).toBeDefined();
      expect(bouton, `${lieu} : aucun « Déconnexion » pour un enseignant connecté`).toBeDefined();
      const manquantes = porte!.classes.filter((k) => !bouton!.classes.includes(k));
      expect(manquantes, `${lieu} : la forme de la porte manque au bouton`).toEqual([]);
    }
  });
});

describe("la barre ne sait qu'une chose, lue au serveur", () => {
  const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

  it("la mise en page lit la session au serveur et passe un seul booléen à la barre", () => {
    const layout = lire("src/app/layout.tsx");
    const balises = layout.match(/<SiteHeader\b[^>]*\/>/g) ?? [];
    expect(balises, "la barre ne reçoit pas l'état de la connexion").toEqual(["<SiteHeader connecte={connecte} />"]);
    expect(layout).toMatch(/import \{ estConnecte \} from "@\/lib\/session";/);
    expect(layout).toMatch(/\bestConnecte\(\)/);
    // La barre ne déclare que ce booléen.
    expect(lire("src/components/site-header.tsx")).toContain(
      "export function SiteHeader({ connecte = false }: { connecte?: boolean })",
    );
  });

  it("estConnecte : vrai pour une session valide, faux sans cookie, pour une session révoquée ou si la base ne répond pas", async () => {
    vi.resetModules();
    let jeton: string | undefined;
    let version: number | null | Error = 1;
    const requetes: string[] = [];
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        has: (n: string) => n === "ba_session" && jeton !== undefined,
        get: (n: string) => (n === "ba_session" && jeton !== undefined ? { name: n, value: jeton } : undefined),
        set: () => {
          throw new Error("pas d'écriture de cookie pendant le rendu");
        },
      }),
    }));
    vi.doMock("@/db", () => ({
      db: {
        select: () => ({
          from: () => ({
            where: async () => {
              requetes.push("version du compte");
              if (version instanceof Error) throw version;
              return version === null ? [] : [{ v: version, desactiveLe: null }];
            },
          }),
        }),
      },
    }));
    const tait = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const session = (await import("@/lib/session")) as Record<string, unknown> & typeof import("@/lib/session");
      const estConnecte = session.estConnecte as (() => Promise<unknown>) | undefined;
      expect(typeof estConnecte, "lib/session.ts ne dit pas, en un booléen, si une session est ouverte").toBe("function");

      // Sans cookie : faux, sans même interroger la base (le visiteur ordinaire).
      expect(await estConnecte!()).toBe(false);
      expect(requetes).toEqual([]);

      const now = Date.now();
      jeton = session.encodeToken({ id: "prof-1", role: "teacher", v: 1, iat: now, exp: now + 3_600_000 });
      expect(await estConnecte!(), "une session valide").toBe(true);
      // Un jeton dont la signature est fausse, une session révoquée (« Se déconnecter partout »),
      // un compte supprimé : faux.
      const valide = jeton;
      jeton = `${valide.slice(0, -1)}${valide.endsWith("0") ? "1" : "0"}`;
      expect(await estConnecte!(), "un jeton à la signature fausse").toBe(false);
      jeton = valide;
      version = 2;
      expect(await estConnecte!(), "une session révoquée").toBe(false);
      version = null;
      expect(await estConnecte!(), "un compte qui n'existe plus").toBe(false);
      // La base ne répond pas : la page s'affiche, la barre dit « Connexion ».
      version = new Error("base injoignable");
      expect(await estConnecte!(), "la base ne répond pas").toBe(false);
    } finally {
      tait.mockRestore();
      vi.doUnmock("next/headers");
      vi.doUnmock("@/db");
      vi.resetModules();
    }
  });
});

describe("l'espace enseignant", () => {
  it("« Déconnexion » ferme la rangée, quelle que soit la page et quelles que soient les sorties", () => {
    const pages = [undefined, ...NAVIGATION_ENSEIGNANT.map((p) => p.code)];
    const sorties = [{}, { etablissement: true }, { administration: true }, { etablissement: true, administration: true }];
    // L'accueil de l'espace pose « Mon compte » au bout de la rangée, avant la déconnexion.
    const compte = createElement("a", { href: "/teacher/compte" }, "Mon compte");
    for (const actif of pages) {
      for (const liens of sorties) {
        for (const avecCompte of [false, true]) {
          const doc = rendre(NavigationEnseignant, "/teacher", { actif, liens, ...(avecCompte ? { compte } : {}) });
          const rangee = commandes(bloc(doc, "aria-label", "Espace enseignant"));
          const cas = JSON.stringify({ actif, liens, avecCompte });
          expect(rangee.at(-1)?.vu, `${cas} : la rangée ne finit pas par « Déconnexion »`).toBe(DECONNEXION);
          expect(rangee.filter((c) => c.vu === DECONNEXION), cas).toHaveLength(1);
          const bouton = rangee.at(-1)!;
          expect([bouton.balise, bouton.type, bouton.formulaire], cas).toEqual(["button", "submit", "logoutAction"]);
          // Les pastilles de l'espace ne changent pas, et précèdent tout le reste.
          expect(rangee.slice(0, NAVIGATION_ENSEIGNANT.length).map((c) => c.vu), cas).toEqual(NAVIGATION_ENSEIGNANT.map((p) => p.libelle));
        }
      }
    }
  });

  it("chaque page de l'espace pose sa rangée par le composant commun, qui porte la déconnexion", () => {
    const racine = join(process.cwd(), "src/app/teacher");
    const fichiers = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? fichiers(p) : p.endsWith(".tsx") ? [p] : [];
      });
    const sources = fichiers(racine).map((f) => ({ f: f.slice(process.cwd().length + 1), s: readFileSync(f, "utf8") }));
    const avecRangee = sources.filter(({ s }) => /<(?:NavigationEnseignant|EnTeteEnseignant)\b/.test(s)).map(({ f }) => f);
    expect(avecRangee.length, "les pages de l'espace qui posent la rangée").toBeGreaterThanOrEqual(12);
    const aLaMain = sources.filter(({ s }) => /<PastillesDeNavigation\b|NAVIGATION_ENSEIGNANT/.test(s)).map(({ f }) => f);
    expect(aLaMain, "une page de l'espace écrit sa rangée sans le composant commun").toEqual([]);
  });
});

describe("« Se déconnecter partout » dans « Mon compte », plus de doublon sur l'accueil", () => {
  const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
  const SRC = join(process.cwd(), "src");
  const tous = (d: string): string[] =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? tous(p) : /\.tsx?$/.test(p) ? [p] : [];
    });
  const ouApparait = (motif: RegExp) =>
    tous(SRC)
      .filter((f) => !f.endsWith(join("app", "teacher", "actions.ts")))
      .filter((f) => motif.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));

  it("« Se déconnecter partout » est dans la page « Mon compte », par le formulaire de déconnexion", () => {
    const compte = lire("src/app/teacher/compte/page.tsx");
    expect(compte, "« Se déconnecter partout » n'est pas dans « Mon compte »").toContain("Se déconnecter partout");
    expect(compte).toMatch(/<FormulaireDeDeconnexion action=\{logoutEverywhereAction\}>/);
    expect(ouApparait(/\blogoutEverywhereAction\b/), "« Se déconnecter partout » ailleurs que dans « Mon compte »").toEqual([
      join("app", "teacher", "compte", "page.tsx"),
    ]);
  });

  it("l'accueil de l'espace n'a plus ses formulaires de déconnexion ; « Mon compte » ne double plus la rangée", () => {
    const accueil = lire("src/app/teacher/page.tsx");
    for (const doublon of ["FormulaireDeDeconnexion", "logoutAction", "logoutEverywhereAction", "Se déconnecter"]) {
      expect(accueil, `l'accueil de l'espace garde « ${doublon} »`).not.toContain(doublon);
    }
    // « Mon compte » reste lié depuis l'accueil : c'est par là qu'on atteint « Se déconnecter partout ».
    expect(accueil).toContain('href="/teacher/compte"');
    // La page « Mon compte » ne pose plus son « Se déconnecter » au bout de la rangée.
    expect(lire("src/app/teacher/compte/page.tsx")).not.toMatch(/action=\{logoutAction\}|>\s*Se déconnecter\s*</);
    // La déconnexion simple n'a plus qu'un endroit : le bouton commun.
    expect(ouApparait(/\blogoutAction\b/)).toEqual([join("components", "bouton-de-deconnexion.tsx")]);
  });
});
