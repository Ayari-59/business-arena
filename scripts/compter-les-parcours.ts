/**
 * Écrit src/config/cours/taille-des-parcours.ts : le nombre de chapitres de chaque parcours qu'une
 * classe peut choisir, et les diplômes qu'il sert.
 *
 * Les deux listes qui font choisir un parcours (la création d'une classe, le devis) le disent pour
 * chaque entrée (décision du propriétaire, 11 novembre 2026). Le devis ne charge pas le registre du
 * cours (tests/architecture/devis-du-diplome.test.ts) : il lit ce fichier, que ce script tire du
 * registre (config/cours/parcours-de-formation.ts, `tailleDesParcours`). Le fichier produit est
 * versionné : la compilation n'a pas besoin du script. Le test tests/cours/parcours-de-formation.test.ts
 * vérifie qu'il est à jour.
 *
 * Usage : npx tsx scripts/compter-les-parcours.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tailleDesParcours } from "../src/config/cours/parcours-de-formation";

const CIBLE = join(process.cwd(), "src/config/cours/taille-des-parcours.ts");

const lignes = Object.entries(tailleDesParcours()).map(
  ([code, t]) => `  ${JSON.stringify(code)}: { chapitres: ${t.chapitres}, diplomes: [${t.diplomes.map((d) => JSON.stringify(d)).join(", ")}] },`,
);

writeFileSync(
  CIBLE,
  `/**
 * LA TAILLE DE CHAQUE PARCOURS QU'UNE CLASSE PEUT CHOISIR, ET LES DIPLÔMES QU'IL SERT.
 *
 * ÉCRIT PAR scripts/compter-les-parcours.ts, JAMAIS À LA MAIN : le calcul est
 * \`tailleDesParcours\` (config/cours/parcours-de-formation.ts), qui lit le registre du cours. Le devis
 * le lit ici sans charger ce registre ; tests/cours/parcours-de-formation.test.ts recompte et compare.
 * Un chapitre ajouté, retiré ou qui cite un autre bloc : relancer le script.
 */
export const TAILLE_DES_PARCOURS: Readonly<Record<string, { chapitres: number; diplomes: readonly string[] }>> = {
${lignes.join("\n")}
};
`,
);
console.log(`${lignes.length} parcours écrits dans ${CIBLE}`);
