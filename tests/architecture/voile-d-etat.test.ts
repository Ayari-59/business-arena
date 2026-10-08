import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE VOILE D'UN ÉTAT CHOISI EST ORANGÉ, PAS ROSE.
 *
 * Sur le clair, l'accent est une encre orange foncé : diluée à dix pour cent,
 * elle donne un rose sale sous l'option cochée, l'étape en cours, le niveau
 * retenu. globals.css tire donc ces voiles de l'orange vif, une dilution après
 * l'autre, parce que Tailwind compose la couleur de chaque classe sans prise
 * pour un autre palier. Une dilution ajoutée demain dans une page, et oubliée
 * là-bas, reviendrait au rose sans que rien le signale : cette garde la refuse.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(racine)) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(tsx|ts)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

/** Le sélecteur CSS d'une classe Tailwind : `hover:bg-amber-400/10` → `.hover\:bg-amber-400\/10`. */
const selecteur = (classe: string) => `.${classe.replace(/([:/[\]])/g, "\\$1")}`;

describe("le voile d'un état choisi, sur le clair", () => {
  const employees = new Set<string>();
  for (const f of fichiers(SRC)) {
    for (const m of readFileSync(f, "utf8").matchAll(/[\][a-z0-9:_-]*bg-amber-(?:400|500)\/\d+/g)) {
      employees.add(m[0]);
    }
  }

  it("se tire de l'orange vif, pour chaque dilution que le site emploie", () => {
    expect(employees.size, "aucune dilution trouvée : la garde ne garde rien").toBeGreaterThan(3);
    const oubliees = [...employees].filter(
      (classe) => !CSS.includes(`[data-theme="clair"] ${selecteur(classe)}`),
    );
    expect(oubliees, `dilutions sans voile orangé : ${oubliees.join(", ")}`).toEqual([]);
  });

  it("lit l'aplat d'accent, mélangé au blanc, pour suivre la palette sans dépendre du fond", () => {
    const debut = CSS.indexOf('[data-theme="clair"] .bg-amber-400\\/10:');
    expect(debut, "règle du voile à 10 % introuvable").toBeGreaterThan(0);
    const bloc = CSS.slice(debut, CSS.indexOf("}", debut));
    expect(bloc).toContain("var(--accent-plein)");
    // Mélangé à la transparence, il prenait la teinte bleutée du fond : rose.
    expect(bloc).toMatch(/var\(--accent-plein\) \d+%, #fff\)/);
  });
});
