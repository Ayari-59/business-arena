import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleBrouillon,
  ecrireBrouillon,
  effacerBrouillon,
  effacerBrouillonsAnterieurs,
  lireBrouillon,
} from "@/lib/brouillon-decisions";

/**
 * LE FILET SOUS LE FORMULAIRE DE DÉCISIONS.
 *
 * Six étapes, des dizaines de champs, et rien n'était gardé tant qu'on n'avait
 * pas validé : un onglet fermé ou un appel en plein cours, et le tour entier
 * était à ressaisir.
 *
 * Ce que ce test couvre : le module de stockage — les clés, la relecture d'un
 * contenu abîmé, le ménage entre tours, et le fait qu'un stockage indisponible
 * ne fasse jamais tomber l'appelant.
 *
 * Ce qu'il NE couvre PAS : la remise des valeurs dans les champs, qui demande
 * un vrai DOM et un rendu client — la suite tourne sous Node, sans navigateur.
 * On garde donc le CÂBLAGE par une lecture de la source, plus bas.
 */

function stockageEnMemoire(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  } as Storage;
}

function stockageQuiJette(): Storage {
  const jeter = () => {
    throw new DOMException("QuotaExceededError");
  };
  return {
    get length(): number {
      return jeter();
    },
    key: jeter,
    getItem: jeter,
    setItem: jeter,
    removeItem: jeter,
    clear: jeter,
  } as unknown as Storage;
}

const poser = (s: Storage) => {
  (globalThis as { window?: unknown }).window = { localStorage: s };
};

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("la clé d'un brouillon", () => {
  beforeEach(() => poser(stockageEnMemoire()));

  it("distingue les parties ET les tours", () => {
    expect(cleBrouillon("partie-a", 1)).not.toBe(cleBrouillon("partie-a", 2));
    expect(cleBrouillon("partie-a", 1)).not.toBe(cleBrouillon("partie-b", 1));
  });
});

describe("écrire, relire, effacer", () => {
  beforeEach(() => poser(stockageEnMemoire()));

  it("rend ce qu'on lui a confié", () => {
    const cle = cleBrouillon("p1", 1);
    ecrireBrouillon(cle, { price: "59", "product.bonnet.productionPlan": "850" });
    expect(lireBrouillon(cle)).toEqual({ price: "59", "product.bonnet.productionPlan": "850" });
  });

  it("ne rend rien quand il n'y a rien", () => {
    expect(lireBrouillon(cleBrouillon("p1", 1))).toBeNull();
  });

  it("efface", () => {
    const cle = cleBrouillon("p1", 1);
    ecrireBrouillon(cle, { price: "59" });
    effacerBrouillon(cle);
    expect(lireBrouillon(cle)).toBeNull();
  });
});

describe("un brouillon abîmé ne fait pas tomber le formulaire", () => {
  beforeEach(() => poser(stockageEnMemoire()));

  it("du JSON invalide se lit comme vide", () => {
    const cle = cleBrouillon("p1", 1);
    window.localStorage.setItem(cle, "{ceci n'est pas du JSON");
    expect(lireBrouillon(cle)).toBeNull();
  });

  it("un tableau, un nombre, `null` : vides aussi", () => {
    const cle = cleBrouillon("p1", 1);
    for (const brut of ["[1,2]", "42", "null", '"texte"']) {
      window.localStorage.setItem(cle, brut);
      expect(lireBrouillon(cle), `pour ${brut}`).toBeNull();
    }
  });

  it("les valeurs qui ne sont pas du texte sont écartées, les autres gardées", () => {
    const cle = cleBrouillon("p1", 1);
    window.localStorage.setItem(cle, JSON.stringify({ price: "59", plan: 850, bon: null }));
    expect(lireBrouillon(cle)).toEqual({ price: "59" });
  });
});

describe("le ménage entre tours", () => {
  beforeEach(() => poser(stockageEnMemoire()));

  it("ne garde que le tour en cours, et ne touche pas aux autres parties", () => {
    const tour2 = cleBrouillon("p1", 2);
    ecrireBrouillon(cleBrouillon("p1", 1), { price: "50" });
    ecrireBrouillon(tour2, { price: "59" });
    ecrireBrouillon(cleBrouillon("p2", 1), { price: "70" });

    effacerBrouillonsAnterieurs("p1", tour2);

    expect(lireBrouillon(cleBrouillon("p1", 1))).toBeNull();
    expect(lireBrouillon(tour2)).toEqual({ price: "59" });
    expect(lireBrouillon(cleBrouillon("p2", 1))).toEqual({ price: "70" });
  });
});

describe("stockage indisponible", () => {
  // Navigation privée, quota plein, cookies tiers bloqués : `localStorage`
  // jette. On perd le filet, jamais le formulaire.
  beforeEach(() => poser(stockageQuiJette()));

  it("aucune des quatre opérations ne remonte d'erreur", () => {
    const cle = cleBrouillon("p1", 1);
    expect(() => ecrireBrouillon(cle, { price: "59" })).not.toThrow();
    expect(() => effacerBrouillon(cle)).not.toThrow();
    expect(() => effacerBrouillonsAnterieurs("p1", cle)).not.toThrow();
    expect(lireBrouillon(cle)).toBeNull();
  });
});

describe("le câblage dans le formulaire", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "components", "decision-form.tsx"),
    "utf8",
  );

  it("le formulaire sauve à chaque changement", () => {
    expect(source).toContain("onChange={sauverBrouillon}");
  });

  it("la restauration attend le montage, elle ne lit pas le stockage au rendu", () => {
    // Lire `localStorage` pendant le rendu ferait diverger le HTML hydraté de
    // celui du serveur, qui n'a pas de stockage.
    const avantRendu = source.slice(0, source.indexOf("useEffect(() => {"));
    expect(avantRendu).not.toContain("lireBrouillon(");
  });

  it("un tour déjà envoyé n'a plus de brouillon", () => {
    expect(source).toContain("if (alreadySubmitted) effacerBrouillon(cle);");
  });
});

describe("le focus clavier a un style, partout", () => {
  it("une règle globale hors de toute couche Tailwind", () => {
    const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
    // `:focus-visible` et non `:focus` : pas d'anneau au clic de souris.
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:/);
    expect(css).not.toMatch(/^:focus\s*\{/m);
  });
});
