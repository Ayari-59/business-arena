import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import { CSP_HEADER_NAME, contentSecurityPolicy, securityHeaders } from "@/config/security-headers";
import { proxy } from "@/proxy";

/**
 * LES EN-TÊTES DE SÉCURITÉ SONT SERVIS SUR TOUTES LES RÉPONSES.
 *
 * Mesuré en production (fetch('/') depuis le navigateur) : CSP,
 * X-Frame-Options, X-Content-Type-Options, Referrer-Policy et
 * Permissions-Policy absents ; X-Powered-By: Next.js ; HSTS sans
 * includeSubDomains ni preload.
 *
 * Deux sources : les cinq en-têtes statiques (next.config, « /(.*) ») et la
 * CSP à nonce (le proxy). La CSP ne peut pas être figée dans next.config : son
 * nonce change à chaque requête.
 */

const STATIQUES = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
];

async function regleGlobale() {
  const regles = await nextConfig.headers!();
  const globale = regles.find((r) => r.source === "/(.*)");
  expect(globale, "aucune règle d'en-têtes sur /(.*)").toBeDefined();
  return globale!;
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

  it("ne fige pas la CSP dans next.config : elle porte un nonce, c'est le rôle du proxy", async () => {
    const globale = await regleGlobale();
    const cles = globale.headers.map((h) => h.key);
    expect(cles).not.toContain("Content-Security-Policy");
    expect(cles).not.toContain("Content-Security-Policy-Report-Only");
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

  it("n'inclut plus la CSP : elle est portée par le proxy", () => {
    expect(parCle["Content-Security-Policy"]).toBeUndefined();
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

  it("en production : scripts au nonce et 'strict-dynamic', jamais 'unsafe-inline' ni eval", () => {
    const csp = contentSecurityPolicy("TESTNONCE", "production");
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
    // Le cœur du durcissement : le nonce remplace 'unsafe-inline' sur les
    // scripts ; 'strict-dynamic' étend la confiance aux scripts qu'ils chargent.
    expect(directive(csp, "script-src")).toBe(
      "script-src 'self' 'nonce-TESTNONCE' 'strict-dynamic'",
    );
    expect(csp).not.toContain("'unsafe-eval'");
    // Les styles inline de React (attributs style=) restent tolérés.
    expect(directive(csp, "style-src")).toBe("style-src 'self' 'unsafe-inline'");
    // Aucun hôte tiers : rien à charger ailleurs.
    expect(csp).not.toMatch(/https?:\/\//);
  });

  it("en développement seulement : eval et WebSocket pour le rechargement", () => {
    const csp = contentSecurityPolicy("TESTNONCE", "development");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws: wss:");
  });
});

describe("proxy : la CSP à nonce", () => {
  const cspDe = (url: string) =>
    proxy(new NextRequest(new URL(url))).headers.get("Content-Security-Policy");

  it("pose une CSP bloquante avec un nonce sur la réponse", () => {
    const csp = cspDe("http://localhost/compete");
    expect(csp).toBeTruthy();
    const scriptSrc = csp!
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("script-src "))!;
    expect(scriptSrc).toMatch(/'nonce-[^']+'/);
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("tire un nonce différent à chaque requête", () => {
    expect(cspDe("http://localhost/")).not.toBe(cspDe("http://localhost/"));
  });
});
