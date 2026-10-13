import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SUR_MESURE } from "@/config/sur-mesure";
import { CATALOGUE_PAR_DEFAUT, LIBELLE_DU_DEVIS } from "@/config/tarifs";
import { LIEN_CONTACT } from "@/config/navigation";

/**
 * LES SITUATIONS SUR MESURE N'ONT QU'UN TEXTE.
 *
 * L'option de la grille, l'encart des ateliers, la bande des parcours et les
 * paragraphes des écoles et des enseignants disent la même chose parce
 * qu'ils lisent le même module. Ces gardes tiennent la source (pas de prix,
 * un délai dit indicatif, les deux gestes qui existent) et les quatre pages
 * qui la lisent.
 */
const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

const TEXTES = [
  SUR_MESURE.offre,
  SUR_MESURE.titre,
  SUR_MESURE.promesse,
  SUR_MESURE.demande.titre,
  ...SUR_MESURE.demande.points,
  SUR_MESURE.livre.titre,
  ...SUR_MESURE.livre.points,
  SUR_MESURE.delai.titre,
  SUR_MESURE.delai.texte,
];

describe("les situations sur mesure", () => {
  it("l'option de la grille des offres porte le libellé du module, et la migration qui l'a versée aussi", () => {
    const option = CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === "scenario-sur-mesure");
    expect(option, "l'option scenario-sur-mesure a disparu de la grille").toBeDefined();
    expect(option!.nom).toBe(SUR_MESURE.offre);
    expect(option!.tarif).toBe("devis");
    // La base porte le même libellé depuis la migration : un module qui
    // changerait de phrase sans migration ferait diverger le site et la base.
    const migration = lire("drizzle/0041_catalogue_des_offres.sql");
    expect(migration).toContain(SUR_MESURE.offre.replace(/'/g, "''"));
  });

  it("ne promet ni prix ni délai ferme, et appelle le rendez-vous et le devis", () => {
    for (const t of TEXTES) {
      expect(t, `« ${t.slice(0, 40)}… » porte un montant`).not.toMatch(/\d\s?(€|euros?)|\bprix\b/i);
      expect(t, `« ${t.slice(0, 40)}… » coupe une phrase par un tiret`).not.toMatch(/[\wÀ-ÿ][ ]+[—–][ ]+[\wÀ-ÿ]/);
    }
    expect(SUR_MESURE.delai.titre).toMatch(/indicatif/i);
    expect(SUR_MESURE.delai.texte).toMatch(/ordre de grandeur|indicatif/i);
    expect(SUR_MESURE.appel.rendezVous).toBe(LIEN_CONTACT);
    expect(SUR_MESURE.appel.devis.href).toBe("/devis");
    expect(SUR_MESURE.demande.points.length).toBeGreaterThanOrEqual(4);
    expect(SUR_MESURE.livre.points.length).toBeGreaterThanOrEqual(3);
  });

  it("les quatre pages la lisent, et aucune n'écrit sa propre phrase", () => {
    const ateliers = lire("src/app/animations/page.tsx");
    expect(ateliers).toContain("<EncartSurMesure");
    const parcours = lire("src/app/parcours/page.tsx");
    expect(parcours).toContain("SUR_MESURE.titre");
    expect(parcours).toContain("SUR_MESURE.promesse");
    expect(parcours).not.toContain("Les mêmes mécaniques servent d'autres référentiels");
    expect(lire("src/app/ecoles/page.tsx")).toContain("<ParagrapheSurMesure");
    expect(lire("src/app/enseignants/page.tsx")).toContain("<ParagrapheSurMesure");
    const encart = lire("src/components/encart-sur-mesure.tsx");
    expect(encart).toContain("LIBELLE_DU_DEVIS");
    expect(LIBELLE_DU_DEVIS.length).toBeGreaterThan(5);
    // Le composant n'écrit aucune promesse à lui : tout texte long vient du module.
    const proseDuComposant = encart
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .match(/>([^<>{}]{60,})</g);
    expect(proseDuComposant ?? []).toEqual([]);
  });
});
