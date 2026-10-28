import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  adresseDeConnexion,
  cheminDemande,
  ENTETE_CHEMIN_DEMANDE,
  suiteInterne,
} from "@/lib/connexion-enseignant";
import { config, proxy } from "@/proxy";

/**
 * LA CONNEXION ENSEIGNANT RAMÈNE À LA PAGE DEMANDÉE, ET À AUCUNE AUTRE.
 *
 * Constaté en production (audit d'octobre 2026) : `/teacher/animations/mco/dossier`
 * redirigeait vers `/teacher/login` sans paramètre de retour ; après connexion,
 * l'enseignant perdait le dossier ou la création de cohorte qu'il visait.
 * Le retour voyage dans `?suite=`, et n'est suivi que vers un chemin interne.
 */

describe("suiteInterne : un chemin interne, jamais une autre origine", () => {
  it("garde le chemin et la requête des pages du site", () => {
    expect(suiteInterne("/teacher/animations/mco/dossier")).toBe("/teacher/animations/mco/dossier");
    expect(suiteInterne("/teacher/cohortes?episode=atelier-sature#nouvelle-cohorte")).toBe(
      "/teacher/cohortes?episode=atelier-sature#nouvelle-cohorte",
    );
  });

  it.each([
    "https://exemple.invalid/piege",
    "//exemple.invalid/piege",
    "/\\exemple.invalid",
    "\\\\exemple.invalid",
    "javascript:alert(1)",
    "teacher/cohortes",
    " /teacher",
    "/api/saml/connexion",
    "/teacher/login",
    "/teacher/login?suite=%2Fteacher",
    "/teacher\n/x",
    "",
  ])("refuse %j", (brut) => {
    expect(suiteInterne(brut)).toBeNull();
  });

  it("refuse ce qui n'est pas une chaîne", () => {
    expect(suiteInterne(null)).toBeNull();
    expect(suiteInterne(undefined)).toBeNull();
    expect(suiteInterne(new File([], "x"))).toBeNull();
  });
});

describe("adresseDeConnexion", () => {
  it("encode la page demandée dans ?suite=", () => {
    expect(adresseDeConnexion("/teacher/cohortes?episode=a&b=c")).toBe(
      "/teacher/login?suite=%2Fteacher%2Fcohortes%3Fepisode%3Da%26b%3Dc",
    );
  });

  it("une adresse externe donne la connexion simple", () => {
    expect(adresseDeConnexion("https://exemple.invalid/")).toBe("/teacher/login");
    expect(adresseDeConnexion(null)).toBe("/teacher/login");
  });
});

describe("cheminDemande", () => {
  it("chemin et requête, sans le paramètre interne _rsc", () => {
    expect(cheminDemande(new URL("https://x.test/teacher/cohortes?episode=a&_rsc=1x2"))).toBe(
      "/teacher/cohortes?episode=a",
    );
    expect(cheminDemande(new URL("https://x.test/teacher?_rsc=1"))).toBe("/teacher");
  });
});

/** L'en-tête de requête que Next transmet à la page, tel que le proxy l'a posé. */
const enteteTransmis = (r: Response) => r.headers.get(`x-middleware-request-${ENTETE_CHEMIN_DEMANDE}`);

describe("le proxy transmet la page demandée sous /teacher", () => {
  it("pose l'en-tête, et écrase celui qu'un client aurait envoyé", () => {
    const r = proxy(
      new NextRequest("https://x.test/teacher/animations/mco/dossier?onglet=2", {
        headers: { [ENTETE_CHEMIN_DEMANDE]: "https://exemple.invalid/" },
      }),
    );
    expect(enteteTransmis(r)).toBe("/teacher/animations/mco/dossier?onglet=2");
  });

  it("ne touche pas aux autres pages", () => {
    expect(enteteTransmis(proxy(new NextRequest("https://x.test/jouer")))).toBeNull();
  });

  it("le matcher couvre tout /teacher", () => {
    expect(config.matcher.map((m) => m.source)).toContain("/teacher/:path*");
  });
});

/**
 * La page serveur lit cet en-tête : plus aucune page de /teacher ne redirige vers la
 * connexion nue (la liasse à imprimer comprise, gardée par son layout).
 */
describe("les pages de /teacher redirigent avec le retour", () => {
  const RACINE = join(process.cwd(), "src", "app", "teacher");
  const fichiers = (dossier: string): string[] =>
    readdirSync(dossier).flatMap((n) => {
      const p = join(dossier, n);
      return statSync(p).isDirectory() ? fichiers(p) : /\/(page|layout)\.tsx$|\/route\.ts$/.test(p) ? [p] : [];
    });

  it("aucune redirection vers /teacher/login sans retour", () => {
    const fautifs = fichiers(RACINE).filter((f) => readFileSync(f, "utf8").includes('redirect("/teacher/login")'));
    expect(fautifs).toEqual([]);
  });

  it("la liasse à imprimer exige une session, comme le reste de /teacher", () => {
    const layout = readFileSync(join(RACINE, "courriers", "print", "layout.tsx"), "utf8");
    expect(layout).toMatch(/if \(!session\) redirect\(await connexionPourLaPageDemandee\(\)\)/);
  });
});

describe("la liasse à imprimer, sans session, redirige vers la connexion avec retour", () => {
  it("redirige vers /teacher/login?suite=… depuis l'en-tête du proxy", async () => {
    vi.resetModules();
    vi.doMock("@/lib/session", () => ({ getSession: async () => null }));
    vi.doMock("next/headers", () => ({
      headers: async () => new Headers({ [ENTETE_CHEMIN_DEMANDE]: "/teacher/courriers/print?liasse=mission" }),
    }));
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => {
        throw new Error(`__redirect__${url}`);
      },
    }));
    const { default: Layout } = await import("@/app/teacher/courriers/print/layout");
    await expect(Layout({ children: null })).rejects.toThrow(
      "__redirect__/teacher/login?suite=%2Fteacher%2Fcourriers%2Fprint%3Fliasse%3Dmission",
    );
    vi.doUnmock("@/lib/session");
    vi.doUnmock("next/headers");
    vi.doUnmock("next/navigation");
  });
});

describe("après connexion, l'action suit le retour s'il est interne", () => {
  async function connecter(suite: string | null): Promise<string> {
    vi.resetModules();
    vi.doMock("@/db", () => ({ db: {} }));
    vi.doMock("@/services/auth.service", async (orig) => ({
      ...(await orig<object>()),
      loginTeacher: async () => ({ userId: "u1", sessionVersion: 1 }),
    }));
    vi.doMock("@/lib/session", async (orig) => ({ ...(await orig<object>()), setSession: async () => undefined }));
    vi.doMock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({}) }));
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => {
        throw new Error(`__redirect__${url}`);
      },
    }));
    const { loginAction } = await import("@/app/teacher/actions");
    const fd = new FormData();
    fd.set("email", "prof@exemple.invalid");
    fd.set("password", "x");
    if (suite !== null) fd.set("suite", suite);
    try {
      await loginAction({ error: null }, fd);
    } catch (e) {
      return String((e as Error).message);
    }
    return "aucune redirection";
  }

  it("vers la page demandée", async () => {
    expect(await connecter("/teacher/cohortes?episode=x#nouvelle-cohorte")).toBe(
      "__redirect__/teacher/cohortes?episode=x#nouvelle-cohorte",
    );
  }, 60_000);

  it("jamais vers une adresse externe : l'espace par défaut", async () => {
    expect(await connecter("https://exemple.invalid/")).toBe("__redirect__/teacher");
    expect(await connecter("//exemple.invalid")).toBe("__redirect__/teacher");
    expect(await connecter(null)).toBe("__redirect__/teacher");
  }, 60_000);
});
