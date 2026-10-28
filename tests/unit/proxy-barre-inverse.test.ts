import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

/**
 * UNE ADRESSE TERMINÉE PAR « \ » NE FAIT PLUS D'ERREUR SERVEUR.
 *
 * Constaté en production (audit d'octobre 2026) : `/tarifs%5C`, `/jouer%5C`,
 * `/cours%5C` répondaient 500 (« Cannot find module pages/tarifs%5C.js ») et
 * remplissaient le journal d'erreurs. Le proxy redirige vers la page sans « \ »
 * finale (308), et répond 404 si la barre est ailleurs.
 */

const appel = (chemin: string) => proxy(new NextRequest(`https://www.exemple.test${chemin}`));

describe("barre oblique inverse dans l'adresse", () => {
  it.each([
    ["/tarifs%5C", "/tarifs"],
    ["/jouer%5c", "/jouer"],
    ["/cours%5C%5C", "/cours"],
    ["/%5C", "/"],
  ])("%s redirige en 308 vers %s", (demande, attendu) => {
    const r = appel(demande);
    expect(r.status).toBe(308);
    expect(new URL(r.headers.get("location")!).pathname).toBe(attendu);
  });

  it("la requête est gardée", () => {
    const r = appel("/cours%5C?entreprise=nova");
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("https://www.exemple.test/cours?entreprise=nova");
  });

  it("une barre au milieu de l'adresse : 404", () => {
    expect(appel("/tarifs%5Cautre").status).toBe(404);
  });

  it("une adresse ordinaire n'est pas touchée", () => {
    const r = appel("/tarifs");
    expect(r.status).toBe(200);
    expect(r.headers.get("location")).toBeNull();
  });

  it("le matcher envoie ces adresses au proxy", () => {
    expect(config.matcher.some((m) => /5\[cC\]/.test(m.source))).toBe(true);
  });
});
