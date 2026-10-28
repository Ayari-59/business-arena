import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * GARDE DU SERVICE WORKER (audit, P1-1).
 *
 * L'ancien `public/sw.js` gardait toute réponse GET de même origine : pages
 * enseignant, exports CSV, noms et numéros d'étudiant, servis hors ligne même
 * après la déconnexion. On charge ici le vrai fichier dans un bac à sable, avec
 * un faux `caches` et un faux `fetch`, et l'on vérifie qu'il ne garde que le
 * statique public.
 */

const SOURCE = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
const ORIGINE = "https://business-arena.test";

type Ecouteur = (e: Record<string, unknown>) => void;

function charger() {
  const ecouteurs: Record<string, Ecouteur> = {};
  const caches = new Map<string, Map<string, Response>>([
    ["ba-v2", new Map([["/teacher/examens/1", new Response("Dupont 21004567")]])],
  ]);
  const ouvrir = (nom: string) => {
    if (!caches.has(nom)) caches.set(nom, new Map());
    const c = caches.get(nom)!;
    return {
      put: async (req: { url: string }, res: Response) => void c.set(new URL(req.url).pathname, res),
      addAll: async () => undefined,
    };
  };
  let reponse: Response = new Response("");
  const contexte: Record<string, unknown> = {
    URL,
    Response,
    Promise,
    self: {
      location: { origin: ORIGINE },
      addEventListener: (type: string, f: Ecouteur) => (ecouteurs[type] = f),
      skipWaiting: async () => undefined,
      clients: { claim: async () => undefined },
    },
    caches: {
      open: async (nom: string) => ouvrir(nom),
      keys: async () => [...caches.keys()],
      delete: async (nom: string) => caches.delete(nom),
      match: async () => undefined,
    },
    fetch: async () => reponse,
  };
  runInNewContext(SOURCE, contexte);

  /** Simule une requête interceptée ; renvoie si le worker y a répondu. */
  async function intercepter(
    chemin: string,
    res: Response,
    options: { mode?: string; rsc?: boolean } = {},
  ): Promise<boolean> {
    reponse = res;
    const headers = new Headers(options.rsc ? { RSC: "1" } : {});
    let promesse: Promise<unknown> | null = null;
    ecouteurs.fetch!({
      request: { method: "GET", url: ORIGINE + chemin, mode: options.mode ?? "no-cors", headers },
      respondWith: (p: Promise<unknown>) => (promesse = p),
    });
    if (promesse) await promesse;
    await new Promise((r) => setTimeout(r, 0));
    return promesse !== null;
  }

  function enCache(chemin: string): boolean {
    return [...caches.values()].some((c) => c.has(chemin));
  }

  return { ecouteurs, caches, intercepter, enCache, contexte };
}

function statique(type = "application/javascript", entetes: Record<string, string> = {}) {
  const r = new Response("x", { headers: { "Content-Type": type, ...entetes } });
  // `type` vaut "default" pour une Response construite à la main ; un fetch de
  // même origine renvoie "basic".
  Object.defineProperty(r, "type", { value: "basic" });
  return r;
}

describe("service worker : seul le statique public est gardé", () => {
  it("garde les fichiers de build et les images publiques", async () => {
    const sw = charger();
    expect(await sw.intercepter("/_next/static/chunks/a1b2.js", statique())).toBe(true);
    expect(sw.enCache("/_next/static/chunks/a1b2.js")).toBe(true);
    await sw.intercepter("/icon-192.png", statique("image/png"));
    expect(sw.enCache("/icon-192.png")).toBe(true);
    await sw.intercepter("/scenes/atelier.webp", statique("image/webp"));
    expect(sw.enCache("/scenes/atelier.webp")).toBe(true);
  });

  it("ne garde jamais une page, une réponse RSC ou un export", async () => {
    const sw = charger();
    const pages = [
      "/teacher/examens/42",
      "/teacher/examens/42/export",
      "/teacher/games/7/releve",
      "/admin/inscrits",
      "/arena/7",
      "/",
    ];
    for (const p of pages) {
      expect(await sw.intercepter(p, statique("text/html")), p).toBe(false);
      expect(sw.enCache(p), p).toBe(false);
    }
    // Navigation et RSC, même sur un chemin qui ressemble à du statique.
    expect(await sw.intercepter("/icon-192.png", statique("image/png"), { mode: "navigate" })).toBe(false);
    expect(await sw.intercepter("/_next/static/x.js", statique(), { rsc: true })).toBe(false);
  });

  it("respecte Cache-Control: no-store et refuse un téléchargement", async () => {
    const sw = charger();
    await sw.intercepter("/_next/static/a.js", statique("application/javascript", { "Cache-Control": "no-store" }));
    expect(sw.enCache("/_next/static/a.js")).toBe(false);
    await sw.intercepter("/_next/static/b.js", statique("application/javascript", { "Cache-Control": "private, max-age=60" }));
    expect(sw.enCache("/_next/static/b.js")).toBe(false);
    await sw.intercepter(
      "/_next/static/c.csv",
      statique("text/csv", { "Content-Disposition": 'attachment; filename="notes.csv"' }),
    );
    expect(sw.enCache("/_next/static/c.csv")).toBe(false);
  });

  it("change de nom de cache et purge les anciens à l'activation", async () => {
    const sw = charger();
    expect(SOURCE).not.toMatch(/CACHE_NAME = "ba-v2"/);
    let attente: Promise<unknown> = Promise.resolve();
    sw.ecouteurs.activate!({ waitUntil: (p: Promise<unknown>) => (attente = p) });
    await attente;
    expect(sw.caches.has("ba-v2")).toBe(false);
  });

  it("vide tous les caches quand la page le demande (déconnexion)", async () => {
    const sw = charger();
    await sw.intercepter("/_next/static/a.js", statique());
    let attente: Promise<unknown> = Promise.resolve();
    sw.ecouteurs.message!({ data: { type: "purger" }, waitUntil: (p: Promise<unknown>) => (attente = p) });
    await attente;
    expect(sw.caches.size).toBe(0);
  });
});

describe("déconnexion : purge du hors ligne côté navigateur", () => {
  const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

  it("les formulaires de déconnexion enseignant et élève appellent la purge", () => {
    for (const f of ["src/app/teacher/page.tsx", "src/app/teacher/compte/page.tsx"]) {
      const s = lire(f);
      expect(s, f).not.toMatch(/<form action=\{logout/);
      expect(s, f).toMatch(/<FormulaireDeDeconnexion action=\{logoutAction\}>/);
    }
    expect(lire("src/components/formulaire-de-deconnexion.tsx")).toMatch(/onSubmit=\{\(\) => void purgerLeHorsLigne\(\)\}/);
    expect(lire("src/components/identite-de-lappareil.tsx")).toMatch(/onSubmit=\{\(\) => void purgerLeHorsLigne\(\)\}/);
  });

  it("la purge vide les caches et désinscrit le service worker", async () => {
    const supprimes: string[] = [];
    let desinscrits = 0;
    const g = globalThis as Record<string, unknown>;
    const avant = { window: g.window, caches: g.caches, navigator: g.navigator };
    g.window = g;
    g.caches = { keys: async () => ["ba-v2", "ba-v3-statique"], delete: async (n: string) => supprimes.push(n) };
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        serviceWorker: {
          controller: null,
          getRegistrations: async () => [{ unregister: async () => (desinscrits += 1) }],
        },
      },
    });
    try {
      const { purgerLeHorsLigne } = await import("@/lib/purge-hors-ligne");
      await purgerLeHorsLigne();
      expect(supprimes).toEqual(["ba-v2", "ba-v3-statique"]);
      expect(desinscrits).toBe(1);
    } finally {
      g.window = avant.window;
      g.caches = avant.caches;
      Object.defineProperty(globalThis, "navigator", { configurable: true, value: avant.navigator });
    }
  });
});
