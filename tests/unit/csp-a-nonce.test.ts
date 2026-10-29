import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import { proxy, config } from "@/proxy";
import {
  CSP_HEADER_NAME,
  EMPREINTE_DU_SCRIPT_DU_SITE,
  PAGES_STATIQUES_DES_ZONES_A_NONCE,
  SCRIPT_DU_SITE,
  ZONES_A_NONCE,
  cspANonce,
  sousNonce,
} from "@/config/security-headers";

/**
 * PLUS DE SCRIPT INLINE TOLÉRÉ LÀ OÙ SONT LES DONNÉES (audit d'octobre 2026, P2-6).
 *
 * La CSP du site permettait 'unsafe-inline' pour les scripts : un script injecté passait.
 * Une CSP à nonce oblige au rendu dynamique ; on la pose donc là où les pages le sont
 * DÉJÀ (espace enseignant, administration, arène, établissement, examen, concours,
 * profil), par le proxy, sans rien coûter au cache. Les pages publiques, statiques ou
 * en ISR, gardent la CSP statique : leurs scripts inline sont ceux de Next (données de
 * rendu, différentes à chaque page et à chaque régénération, donc ni nonce ni empreinte
 * possible sans rendu dynamique).
 */

const directive = (csp: string, nom: string) =>
  csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${nom} `));

const requete = (chemin: string) => new NextRequest(`https://exemple.test${chemin}`);

describe("CSP à nonce des zones dynamiques", () => {
  it("script-src : self, le nonce et l'empreinte du script du layout ; ni unsafe-inline ni eval", () => {
    const csp = cspANonce("abc123", "production");
    expect(directive(csp, "script-src")).toBe(`script-src 'self' 'nonce-abc123' '${EMPREINTE_DU_SCRIPT_DU_SITE}'`);
    expect(csp).not.toContain("unsafe-eval");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
  });

  it("l'empreinte est celle du script que pose le layout", () => {
    const attendue = `sha256-${createHash("sha256").update(SCRIPT_DU_SITE, "utf8").digest("base64")}`;
    expect(EMPREINTE_DU_SCRIPT_DU_SITE).toBe(attendue);
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).toContain("__html: SCRIPT_DU_SITE");
  });

  it("le proxy pose un nonce neuf à chaque requête, dans la requête (pour Next) et la réponse", () => {
    for (const chemin of ["/teacher", "/teacher/cohortes/x", "/admin", "/arena/123", "/etablissement/parties", "/examen/ABC"]) {
      const r1 = proxy(requete(chemin));
      const r2 = proxy(requete(chemin));
      const csp1 = r1.headers.get(CSP_HEADER_NAME) ?? "";
      const csp2 = r2.headers.get(CSP_HEADER_NAME) ?? "";
      expect(csp1, chemin).toMatch(/'nonce-[A-Za-z0-9+/=]{16,}'/);
      expect(csp1, chemin).not.toBe(csp2);
      expect(csp1, chemin).not.toContain("unsafe-inline' ;");
      expect(directive(csp1, "script-src"), chemin).not.toContain("unsafe-inline");
      // La CSP transmise à Next dans la requête : c'est elle qui lui fait poser le nonce.
      expect(r1.headers.get("x-middleware-request-content-security-policy"), chemin).toBe(csp1);
    }
  });

  it("le proxy ne pose pas de nonce hors des zones, ni sur leurs pages statiques", () => {
    for (const chemin of ["/teachers", "/administration", "/notions", "/", ...PAGES_STATIQUES_DES_ZONES_A_NONCE]) {
      expect(sousNonce(chemin), chemin).toBe(false);
    }
    expect(proxy(requete("/etablissement/sans-offre")).headers.get(CSP_HEADER_NAME)).toBeNull();
  });

  it("le matcher du proxy couvre chaque zone", () => {
    const sources = config.matcher.filter((m) => !("has" in m)).map((m) => m.source);
    for (const zone of ZONES_A_NONCE) expect(sources, zone).toContain(`/${zone}/:path*`);
  });

  it("chaque route a exactement une CSP : celle de next.config, ou celle du proxy", async () => {
    const regles = await nextConfig.headers!();
    const cspDeConfig = (chemin: string) =>
      regles.some((r) => new RegExp(`^${r.source}$`).test(chemin) && r.headers.some((h) => h.key === CSP_HEADER_NAME));
    for (const chemin of ["/", "/notions", "/teachers", "/teacher", "/teacher/x", "/admin/lti", "/arena/1", "/profile", "/etablissement/sans-offre", "/etablissement/parties", "/compete", "/org"]) {
      expect(cspDeConfig(chemin) !== sousNonce(chemin), chemin).toBe(true);
    }
  });

  it("aucune page d'une zone n'est prérendue (un HTML statique n'aurait pas le nonce)", () => {
    const app = join(process.cwd(), "src/app");
    const pages: string[] = [];
    const parcourir = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) parcourir(p);
        else if (n === "page.tsx") pages.push(p);
      }
    };
    for (const zone of ZONES_A_NONCE) if (existsSync(join(app, zone))) parcourir(join(app, zone));
    const statiques = pages.filter((p) => {
      const route = p.slice(app.length).replace(/\/page\.tsx$/, "") || "/";
      if (!sousNonce(route.replace(/\[[^\]]+\]/g, "x"))) return false;
      const src = readFileSync(p, "utf8");
      return !/force-dynamic|getSession|requireAdmin|cookies\(|headers\(|searchParams|getGuest|params/.test(src);
    });
    // Ce qui reste n'a pas d'API dynamique visible : vérifié au build (prerender-manifest).
    const manifeste = join(process.cwd(), ".next/prerender-manifest.json");
    if (existsSync(manifeste)) {
      const routes = Object.keys(JSON.parse(readFileSync(manifeste, "utf8")).routes as Record<string, unknown>);
      expect(routes.filter((r) => sousNonce(r))).toEqual([]);
    }
    expect(statiques.map((p) => p.slice(app.length))).toEqual(["/teacher/courriers/print/page.tsx"]);
  });
});
