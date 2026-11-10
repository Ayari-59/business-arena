import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * GARDE : LA PAGE D'UN CHAPITRE N'ANNONCE QUE LES COMPÉTENCES DU DIPLÔME D'OÙ L'ON VIENT (demande du
 * propriétaire, novembre 2026 ; la règle : config/cours/competences-affichees.ts).
 *
 * Trois choses doivent tenir ensemble, et chacune peut se perdre sans qu'un test de la règle le voie :
 * la page calcule les compétences et ne sert au guide qu'elles ; le guide les titre du diplôme retenu,
 * sans liste ni titre écrits en dur ; les pages des diplômes portent leur diplôme dans le lien de chaque
 * chapitre, sans quoi la page du chapitre ne saurait pas d'où l'on vient.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), "src", chemin), "utf8");

describe("les compétences du diplôme, de la page des diplômes à la page du chapitre", () => {
  it("la page du chapitre décide au serveur, la classe d'abord, et ne sert au guide que les blocs retenus", () => {
    const page = lire("app/cours/[chapitre]/page.tsx");
    expect(page).toContain("competencesAffichees(chapitre, { classe: classeDeLEleveLue?.parcours, demande })");
    expect(page).toContain("servirLeChapitre(chapitre, cas, competences)");
    expect(page).toContain("diplome={demande}");
    expect(lire("services/cours.service.ts")).toMatch(/parcours: coursClasses\.parcours/);
  });

  it("le guide titre la section du diplôme retenu, aux deux endroits où il la montre", () => {
    const guide = lire("components/cours/chapitre-guide.tsx");
    expect(guide).not.toMatch(/>\s*Compétences du référentiel\s*</);
    expect(guide.match(/\{chapitre\.referentiel\}/g)?.length).toBe(2);
  });

  it("la vue d'un diplôme sur /cours porte le diplôme dans le lien de ses chapitres", () => {
    const cours = lire("app/cours/page.tsx");
    expect(cours).toMatch(/function lienDuChapitre\(c: Chapitre, imposee\?: string, diplome\?: string\)/);
    expect(cours).toContain("diplome={programme.formation.code}");
    // Aucun lien de chapitre du programme ou de la recherche ne l'oublie.
    expect(cours).not.toMatch(/lienDuChapitre\((?:c|cas|s), imposee\)/);
  });

  it("la page de couverture d'un diplôme porte le diplôme dans le lien de chaque chapitre", () => {
    const parcours = lire("app/parcours/[formation]/page.tsx");
    expect(parcours).not.toMatch(/href=\{`\/cours\/\$\{ch\.code\}`\}/);
    expect(parcours.match(/href=\{`\/cours\/\$\{ch\.code\}\?diplome=\$\{code\}`\}/g)?.length).toBe(2);
  });
});
