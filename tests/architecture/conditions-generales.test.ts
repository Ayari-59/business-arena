import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { VENDEUR } from "@/config/editeur";
import {
  INDEMNITE_DE_RECOUVREMENT_EUROS,
  MULTIPLE_DU_TAUX_LEGAL,
  TRIBUNAL_COMPETENT,
  VALIDITE_DU_DEVIS_JOURS,
} from "@/config/conditions-legales";
import { tousLesLiens } from "@/config/navigation";

/**
 * LES CONDITIONS GÉNÉRALES (chantier délimité approuvé par le propriétaire, novembre 2026).
 *
 * Les CGV ne laissent plus de « [à compléter] » ; les CGU existent, sont au plan du site et au
 * plan pour les moteurs, et chaque porte d'entrée (créer un compte, rejoindre une partie,
 * rejoindre une classe) y mène. Le vendeur s'écrit une fois (config/editeur.ts), les choix du
 * propriétaire une fois (config/conditions-legales.ts).
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
const PAGES = ["src/app/cgv/page.tsx", "src/app/cgu/page.tsx"];

describe("les conditions générales", () => {
  it("ne laissent rien à compléter", () => {
    for (const p of PAGES) expect(lire(p), p).not.toMatch(/à compléter|A_COMPLETER|<Manque/);
  });

  it("lisent le vendeur et les choix du propriétaire, sans les recopier", () => {
    for (const p of PAGES) {
      const source = lire(p);
      expect(source, p).not.toContain(VENDEUR.siret);
      expect(source, p).not.toContain(VENDEUR.adresse.rue);
      expect(source, p).toMatch(/from "@\/config\/editeur"/);
      expect(source, p).toMatch(/from "@\/config\/conditions-legales"/);
    }
    expect(TRIBUNAL_COMPETENT).toContain(VENDEUR.adresse.ville);
  });

  it("gardent au moins le minimum légal des pénalités entre professionnels", () => {
    // Article L. 441-10 du Code de commerce : pas moins de 3 fois le taux d'intérêt légal ;
    // article D. 441-5 : une indemnité forfaitaire de 40 €.
    expect(MULTIPLE_DU_TAUX_LEGAL).toBeGreaterThanOrEqual(3);
    expect(INDEMNITE_DE_RECOUVREMENT_EUROS).toBe(40);
    expect(VALIDITE_DU_DEVIS_JOURS).toBeGreaterThan(0);
  });

  it("les CGU sont au plan du site et au plan pour les moteurs, et les CGV y mènent", () => {
    expect(tousLesLiens().some((l) => l.href === "/cgu")).toBe(true);
    expect(lire("src/app/sitemap.ts")).toContain('"/cgu"');
    expect(lire("src/app/cgv/page.tsx")).toContain('href="/cgu"');
  });

  it("chaque porte d'entrée dit qu'elle vaut acceptation des CGU", () => {
    for (const p of ["src/components/teacher-auth-forms.tsx", "src/components/join-form.tsx", "src/app/cours/rejoindre/page.tsx"]) {
      const source = lire(p);
      expect(source, p).toMatch(/data-mention-cgu/);
      expect(source, p).toContain('href="/cgu"');
    }
  });
});
