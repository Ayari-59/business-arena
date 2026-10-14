import { afterEach, describe, expect, it, vi } from "vitest";
import { creerMemoireDeLecture } from "@/components/memoire-de-lecture";

/**
 * UN STOCKAGE REFUSÉ N'EST PAS UNE PANNE D'INTERFACE.
 *
 * Signalé à l'usage : « le bouton J'ai pris note n'a pas l'air de fonctionner
 * sur un mobile ». Le stockage local était la seule source de vérité de la
 * scène ; en navigation privée, ou quand les données de site sont bloquées,
 * l'écriture jette, l'état lu ne change pas, et l'écran reste identique. Le
 * geste était perdu.
 */
function stockageQuiRefuse() {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem() {
          throw new Error("SecurityError");
        },
        setItem() {
          throw new Error("QuotaExceededError");
        },
      },
    },
  });
  return () => {
    if (original) Object.defineProperty(globalThis, "window", original);
    else delete (globalThis as { window?: unknown }).window;
  };
}

function stockageQuiMarche(initial: Record<string, string> = {}) {
  const donnees = new Map(Object.entries(initial));
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (c: string) => donnees.get(c) ?? null,
        setItem: (c: string, v: string) => donnees.set(c, v),
      },
    },
  });
  return {
    donnees,
    restaurer: () => {
      if (original) Object.defineProperty(globalThis, "window", original);
      else delete (globalThis as { window?: unknown }).window;
    },
  };
}

let restaurer: (() => void) | null = null;
afterEach(() => {
  restaurer?.();
  restaurer = null;
});

describe("la mémoire d'un geste de lecture", () => {
  it("retient le geste et prévient les abonnés quand le stockage marche", () => {
    const s = stockageQuiMarche();
    restaurer = s.restaurer;
    const memoire = creerMemoireDeLecture(["1", "2"] as const);
    const abonne = vi.fn();
    memoire.subscribe(abonne);

    expect(memoire.lire("courrier:g:3")).toBe("");
    memoire.retenir("courrier:g:3", "1");
    expect(memoire.lire("courrier:g:3")).toBe("1");
    memoire.retenir("courrier:g:3", "2");
    expect(memoire.lire("courrier:g:3")).toBe("2");
    expect(abonne).toHaveBeenCalledTimes(2);
    // et le souvenir passe bien à l'appareil, pour la visite suivante
    expect(s.donnees.get("courrier:g:3")).toBe("2");
  });

  it("relit ce que l'appareil avait retenu d'une visite précédente", () => {
    const s = stockageQuiMarche({ "courrier:g:3": "2" });
    restaurer = s.restaurer;
    expect(creerMemoireDeLecture(["1", "2"] as const).lire("courrier:g:3")).toBe("2");
  });

  it("ignore une valeur inconnue traînant dans le stockage", () => {
    const s = stockageQuiMarche({ "courrier:g:3": "n'importe quoi" });
    restaurer = s.restaurer;
    expect(creerMemoireDeLecture(["1", "2"] as const).lire("courrier:g:3")).toBe("");
  });

  it("LE CAS DU MOBILE : stockage refusé, la séance tient quand même", () => {
    restaurer = stockageQuiRefuse();
    const memoire = creerMemoireDeLecture(["1", "2"] as const);
    const abonne = vi.fn();
    memoire.subscribe(abonne);

    expect(memoire.lire("courrier:g:3")).toBe("");
    memoire.retenir("courrier:g:3", "2");
    // c'est là que tout se jouait : sans mémoire vive, la lecture rendait
    // encore "" et l'écran ne bougeait pas
    expect(memoire.lire("courrier:g:3")).toBe("2");
    expect(abonne).toHaveBeenCalledTimes(1);
  });

  it("se désabonne proprement", () => {
    const s = stockageQuiMarche();
    restaurer = s.restaurer;
    const memoire = creerMemoireDeLecture(["1"] as const);
    const abonne = vi.fn();
    memoire.subscribe(abonne)();
    memoire.retenir("c", "1");
    expect(abonne).not.toHaveBeenCalled();
  });
});
