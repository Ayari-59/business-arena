import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import {
  CSP_HEADER_NAME,
  contentSecurityPolicy,
  securityHeaders,
} from "@/config/security-headers";

/**
 * LES EN-TÊTES DE SÉCURITÉ SONT SERVIS SUR TOUTES LES RÉPONSES.
 *
 * Mesuré en production (fetch('/') depuis le navigateur) : CSP,
 * X-Frame-Options, X-Content-Type-Options, Referrer-Policy et
 * Permissions-Policy absents ; X-Powered-By: Next.js ; HSTS sans
 * includeSubDomains ni preload.
 */

const ATTENDUS = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
  CSP_HEADER_NAME,
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

  it("pose les six en-têtes sur toutes les routes", async () => {
    const globale = await regleGlobale();
    const cles = globale.headers.map((h) => h.key);
    for (const attendu of ATTENDUS) expect(cles).toContain(attendu);
  });

  it("garde la règle propre au service worker", async () => {
    const regles = await nextConfig.headers!();
    expect(regles.some((r) => r.source === "/sw.js")).toBe(true);
  });
});

describe("valeurs des en-têtes", () => {
  const parCle = Object.fromEntries(securityHeaders("production").map((h) => [h.key, h.value]));

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
});

describe("politique de sécurité du contenu", () => {
  it("est livrée en Report-Only, pas encore bloquante", () => {
    expect(CSP_HEADER_NAME).toBe("Content-Security-Policy-Report-Only");
  });

  it("en production : origine seule, iframe interdite, ancre et formulaires bridés", () => {
    const csp = contentSecurityPolicy("production");
    const directive = (nom: string) =>
      csp
        .split(";")
        .map((d) => d.trim())
        .find((d) => d.startsWith(`${nom} `));
    expect(directive("default-src")).toBe("default-src 'self'");
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("form-action")).toBe("form-action 'self'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("connect-src")).toBe("connect-src 'self'");
    // Documenté dans security-headers.ts : sans nonce, les scripts inline de
    // Next et du layout l'exigent. Jamais d'eval en production.
    expect(directive("script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("unsafe-eval");
    // Aucun hôte tiers : rien à charger ailleurs.
    expect(csp).not.toMatch(/https?:\/\//);
  });

  it("en développement seulement : eval et WebSocket pour le rechargement", () => {
    const csp = contentSecurityPolicy("development");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws: wss:");
  });
});
