import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { coursDuDiplome } from "@/config/cours/par-diplome";
import { LIBELLE_POUR_ALLER_PLUS_LOIN, POUR_ALLER_PLUS_LOIN, approfondissementsALaFin, pourAllerPlusLoin } from "@/config/cours/pour-aller-plus-loin";
import { CHAPITRES } from "@/config/cours/registre";

/**
 * « POUR ALLER PLUS LOIN » (décision du propriétaire, novembre 2026, lot C STMG) : les quatre chapitres de
 * niveau supérieur qui citent des thèmes du bac STMG restent sur sa page, marqués comme un
 * approfondissement, après les chapitres du niveau du lycée ; ils ne sont pas réécrits.
 */

const QUATRE = ["couts-ou-differenciation", "lire-la-strategie-des-concurrents", "la-responsabilite-societale", "ce-que-rapporte-l-engagement"];
const PAGE_DU_COURS = readFileSync(join(process.cwd(), "src/app/cours/page.tsx"), "utf8");
const PAGE_DU_PARCOURS = readFileSync(join(process.cwd(), "src/app/parcours/[formation]/page.tsx"), "utf8");

describe("les chapitres pour aller plus loin du bac STMG", () => {
  const cours = coursDuDiplome("stmg")!;
  const lignes = cours.blocs.flatMap((b) => b.chapitres);

  it("sont les quatre chapitres de niveau supérieur, tous de palier 2 ou plus, et tous sur la page", () => {
    expect([...POUR_ALLER_PLUS_LOIN.stmg!].sort()).toEqual([...QUATRE].sort());
    for (const code of QUATRE) {
      const ligne = lignes.find((l) => l.chapitre.code === code);
      expect(ligne, code).toBeDefined();
      expect(ligne!.approfondissement, code).toBe(true);
      expect(ligne!.chapitre.palier, code).toBeGreaterThanOrEqual(2);
    }
  });

  it("aucun autre chapitre de la page STMG n'est au-dessus du palier du lycée", () => {
    const auDessus = lignes.filter((l) => l.chapitre.palier > 1 && !l.approfondissement).map((l) => l.chapitre.code);
    expect(auDessus).toEqual([]);
    expect(lignes.filter((l) => l.approfondissement).every((l) => l.chapitre.palier > 1)).toBe(true);
  });

  it("ferment la liste : après tous les chapitres du niveau du lycée, dans chaque bloc et dans l'ordre d'apprentissage", () => {
    const premier = Math.min(...lignes.filter((l) => l.approfondissement).map((l) => l.rang));
    expect(lignes.filter((l) => !l.approfondissement).every((l) => l.rang < premier)).toBe(true);
    for (const b of cours.blocs) {
      const marques = b.chapitres.map((c) => c.approfondissement);
      expect(marques, b.bloc ?? "autres").toEqual([...marques].sort((x, y) => Number(x) - Number(y)));
    }
    const choix = cours.blocs.find((b) => b.bloc === "Thème 3 · Les choix stratégiques des organisations")!;
    expect(choix.chapitres.slice(-2).map((c) => c.chapitre.code)).toEqual(["couts-ou-differenciation", "lire-la-strategie-des-concurrents"]);
    const societe = cours.blocs.find((b) => b.bloc === "Thème 3 · Les organisations et la société" && b.partie === "Terminale, enseignement commun")!;
    expect(societe.chapitres.slice(-2).map((c) => c.chapitre.code)).toEqual(["la-responsabilite-societale", "ce-que-rapporte-l-engagement"]);
  });

  it("ne valent que pour la STMG : le même chapitre n'est pas un approfondissement ailleurs", () => {
    for (const code of QUATRE) expect(pourAllerPlusLoin("dscg", code)).toBe(false);
    const dscg = coursDuDiplome("dscg");
    if (dscg) expect(dscg.blocs.flatMap((b) => b.chapitres).some((l) => l.approfondissement)).toBe(false);
  });

  it("gardent leur contenu : ils restent au registre, à leur parcours et à leur palier", () => {
    for (const code of QUATRE) {
      const c = CHAPITRES.find((x) => x.code === code)!;
      expect(c.parcours, code).toBe("strategie");
      expect(c.etapes.length, code).toBeGreaterThan(0);
    }
  });

  it("le tri met les approfondissements à la fin sans changer l'ordre de chaque groupe", () => {
    expect(approfondissementsALaFin("stmg", ["la-responsabilite-societale", "a", "couts-ou-differenciation", "b"], (x) => x)).toEqual(["a", "b", "la-responsabilite-societale", "couts-ou-differenciation"]);
  });
});

describe("le marquage se lit sur les pages", () => {
  it("la page du diplôme marque la ligne du chapitre", () => {
    expect(PAGE_DU_COURS).toMatch(/\{ligne\.approfondissement \? \(\s*<span\s+data-pour-aller-plus-loin=""/);
    expect(PAGE_DU_COURS).toContain("{LIBELLE_POUR_ALLER_PLUS_LOIN}");
    expect(LIBELLE_POUR_ALLER_PLUS_LOIN).toBe("pour aller plus loin");
  });

  it("la page de couverture du diplôme les marque et les range à la fin, dans le tableau et dans la liste du cours", () => {
    expect(PAGE_DU_PARCOURS.match(/approfondissementsALaFin\(code, /g)?.length).toBe(2);
    expect(PAGE_DU_PARCOURS.match(/data-pour-aller-plus-loin=""/g)?.length).toBe(2);
  });
});
