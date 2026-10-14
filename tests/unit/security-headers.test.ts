import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import {
  CSP_HEADER_NAME,
  contentSecurityPolicy,
  securityHeaders,
  SOURCE_HORS_LTI,
} from "@/config/security-headers";

/**
 * LES EN-TÊTES DE SÉCURITÉ SONT SERVIS SUR TOUTES LES RÉPONSES.
 *
 * Mesuré en production (fetch('/') depuis le navigateur) : CSP,
 * X-Frame-Options, X-Content-Type-Options, Referrer-Policy et
 * Permissions-Policy absents ; X-Powered-By: Next.js ; HSTS sans
 * includeSubDomains ni preload.
 *
 * Tous ces en-têtes — CSP comprise — sont STATIQUES et posés par next.config
 * sur « /(.*) ». On a renoncé au nonce par requête (qui imposait un middleware
 * et un rendu dynamique de tout le site) : la CSP reste active mais tolère les
 * scripts inline.
 */

const STATIQUES = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
];

/**
 * Les en-têtes que reçoit une route : ceux de toutes les règles dont la source la
 * couvre. Les sources sont des expressions de path-to-regexp ; celles du site n'ont que
 * des groupes d'expression régulière, qu'on évalue tels quels.
 */
async function entetesDe(chemin: string): Promise<string[]> {
  const regles = await nextConfig.headers!();
  return regles
    .filter((r) => new RegExp(`^${r.source}$`).test(chemin))
    .flatMap((r) => r.headers.map((h) => h.key));
}

async function regleGlobale() {
  const regles = await nextConfig.headers!();
  const globale = regles.find((r) => r.source === "/(.*)");
  expect(globale, "aucune règle d'en-têtes sur /(.*)").toBeDefined();
  return { headers: (await entetesDe("/")).map((key) => ({ key })) };
}

describe("configuration Next", () => {
  it("n'annonce plus la pile", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("pose les cinq en-têtes statiques sur toutes les routes", async () => {
    const globale = await regleGlobale();
    const cles = globale.headers.map((h) => h.key);
    for (const attendu of STATIQUES) expect(cles).toContain(attendu);
  });

  it("pose la CSP en statique sur toutes les routes (plus de nonce, plus de proxy)", async () => {
    const globale = await regleGlobale();
    const cles = globale.headers.map((h) => h.key);
    expect(cles).toContain("Content-Security-Policy");
    expect(cles).not.toContain("Content-Security-Policy-Report-Only");
  });

  it("toutes les pages, /lti/* comprises, gardent l'iframe interdite et la CSP du site", async () => {
    for (const chemin of ["/", "/teacher", "/lti/activite", "/api/games/x", "/apilti", "/api/ltix"]) {
      const cles = await entetesDe(chemin);
      expect(cles, chemin).toContain("X-Frame-Options");
      expect(cles, chemin).toContain("Content-Security-Policy");
    }
  });

  it("seules les routes /api/lti/ posent leur propre CSP (intégrables par la plateforme inscrite)", async () => {
    expect(SOURCE_HORS_LTI).toBe("/((?!api/lti/).*)");
    for (const chemin of ["/api/lti/selection", "/api/lti/inscription"]) {
      const cles = await entetesDe(chemin);
      expect(cles, chemin).not.toContain("X-Frame-Options");
      expect(cles, chemin).not.toContain("Content-Security-Policy");
      for (const commun of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"]) {
        expect(cles, chemin).toContain(commun);
      }
    }
  });

  it("garde la règle propre au service worker", async () => {
    const regles = await nextConfig.headers!();
    expect(regles.some((r) => r.source === "/sw.js")).toBe(true);
  });
});

describe("valeurs des en-têtes statiques", () => {
  const parCle = Object.fromEntries(securityHeaders().map((h) => [h.key, h.value]));

  it("interdit l'iframe tierce, le sniffing, et bride le référent", () => {
    expect(parCle["X-Frame-Options"]).toBe("DENY");
    expect(parCle["X-Content-Type-Options"]).toBe("nosniff");
    expect(parCle["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(parCle["Permissions-Policy"]).toMatch(/camera=\(\)/);
    expect(parCle["Permissions-Policy"]).toMatch(/payment=\(\)/);
  });

  it("HSTS : deux ans, sous-domaines, preload", () => {
    expect(parCle["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
  });

  it("inclut la CSP parmi les en-têtes statiques", () => {
    expect(parCle["Content-Security-Policy"]).toBeTruthy();
  });
});

describe("politique de sécurité du contenu", () => {
  const directive = (csp: string, nom: string) =>
    csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${nom} `));

  it("est bloquante, plus en Report-Only", () => {
    expect(CSP_HEADER_NAME).toBe("Content-Security-Policy");
  });

  it("en production : politique stricte, scripts inline tolérés, jamais d'eval ni de tiers", () => {
    const csp = contentSecurityPolicy("production");
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline'");
    // Aucun hôte tiers : rien à charger ailleurs.
    expect(csp).not.toMatch(/https?:\/\//);
  });

  it("en développement seulement : eval et WebSocket pour le rechargement", () => {
    const csp = contentSecurityPolicy("development");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws: wss:");
  });
});
