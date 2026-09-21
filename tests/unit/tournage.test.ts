import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * LES SCRIPTS DE TOURNAGE NE FILMENT PAS DES ÉCRANS DISPARUS.
 *
 * Un script de tournage vieillit plus vite qu'une page : il nomme des boutons,
 * des onglets et des chiffres qu'on lit à voix haute. Le jour où un intitulé
 * change, la capsule tournée devient fausse et personne ne s'en aperçoit avant
 * de la regarder. Cette garde vérifie que chaque élément cité existe encore.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
const doc = lire("docs/12-tournage.md");

describe("le document", () => {
  it("donne un plateau, puis des capsules découpées plan par plan", () => {
    expect(doc).toContain("## Le plateau");
    const capsules = doc.match(/^## Capsule \d+ · /gm) ?? [];
    expect(capsules.length).toBeGreaterThanOrEqual(4);
    // Chaque capsule annonce son public, son intention et sa durée : sans ces
    // trois lignes, on filme sans savoir quand s'arrêter.
    for (const marqueur of ["**Pour qui**", "**Ce qu'on veut qu'il", "**Durée cible**"]) {
      expect(doc, marqueur).toContain(marqueur);
    }
  });

  it("chaque capsule dit ce qui casse une prise", () => {
    const pieges = doc.match(/\*\*Pièges de tournage\.\*\*/g) ?? [];
    expect(pieges.length).toBeGreaterThanOrEqual(4);
  });
});

describe("tout ce qui est cité existe", () => {
  it("les écrans et boutons filmés portent ces intitulés dans le code", () => {
    const sources = [
      lire("src/app/teacher/games/[gameId]/page.tsx"),
      lire("src/components/vue-de-projection.tsx"),
      lire("src/components/close-round-form.tsx"),
      lire("src/config/cloture.ts"),
      lire("src/components/identite-de-lappareil.tsx"),
    ]
      .join("\n")
      // Le JSX échappe l'apostrophe (`n&apos;est`) : sans cela, la garde
      // chercherait dans le code une forme qui ne s'y écrit jamais.
      .replace(/&apos;/g, "'");
    for (const intitule of [
      "Projeter pour la classe",
      "Code d'entrée",
      "Ce tour",
      "Classement",
      "Observation de séance",
      "Ce n'est pas moi",
      "Clore le tour",
    ]) {
      expect(doc, `${intitule} : cité par le tournage`).toContain(intitule);
      expect(sources, `${intitule} : absent du code`).toContain(intitule);
    }
  });

  it("le monde démo qu'il décrit est celui que le service construit", () => {
    const demo = lire("src/services/demo.service.ts");
    expect(doc).toContain("GRAINE_DEMO");
    expect(demo).toContain("GRAINE_DEMO");
    // Trois tours joués, quatre élèves : les deux chiffres que le script
    // annonce et sur lesquels le tournage s'appuie.
    expect(doc).toContain("trois tours déjà joués");
    expect(demo).toContain("round <= 3");
    expect(doc).toContain("**quatre élèves nommés**");
    // Sur la liste des élèves seulement : les comptes de l'établissement
    // partagent le même domaine et fausseraient un comptage global.
    const eleves = demo.slice(demo.indexOf("const STUDENTS = ["), demo.indexOf("] as const;"));
    expect((eleves.match(/email:/g) ?? []).length).toBe(4);
  });

  it("le chemin de génération qu'il donne est le bon", () => {
    expect(doc).toContain("npm run seed:demo");
    expect(lire("package.json")).toContain('"seed:demo"');
    expect(doc).toContain("Générer le monde démo");
    expect(lire("src/app/admin/page.tsx")).toContain("Générer le monde démo");
  });
});
