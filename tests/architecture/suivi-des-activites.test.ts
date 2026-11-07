import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LE SUIVI DES ACTIVITÉS S'ÉCRIT D'APRÈS LA CORRECTION DU SERVEUR (migration 0057).
 *
 * Chaque action qui corrige un bureau, une enquête ou un scénario note le geste dans le suivi de la
 * classe, APRÈS la correction et AVEC le retour qu'elle vient de calculer, puis rend ce même retour.
 * Le module qui note n'est pas une action serveur : le navigateur ne peut pas l'appeler en direct. La
 * règle du suivi ne lit rien de ce que le navigateur dit de lui-même : ni ses écritures « faites », ni
 * ses questions « justes », ni ses essais, ni le « fini » que le correcteur en déduit.
 */

const lire = (f: string) => readFileSync(f, "utf8");

const ACTIONS = [
  { fichier: "src/app/cours/bureau/actions.ts", nature: "bureau", correction: "corrigerAuBureau(bureau, envoi)", activite: "bureau" },
  { fichier: "src/app/cours/enquete/actions.ts", nature: "enquete", correction: "corrigerAuBureau(enquete, envoi)", activite: "enquete" },
  { fichier: "src/app/cours/scenario/actions.ts", nature: "scenario", correction: "corrigerAuScenario(scenario, envoi)", activite: "scenario" },
];

describe("l'action serveur note le geste d'après sa propre correction", () => {
  for (const a of ACTIONS) {
    it(a.fichier, () => {
      const src = lire(a.fichier);
      const corrige = src.indexOf(`const retour = ${a.correction};`);
      const note = src.indexOf(`await noterDansLaClasse({ nature: "${a.nature}", activite: ${a.activite}, envoi, retour });`);
      const rend = src.indexOf("return retour;");
      expect(corrige, "la correction, gardée dans `retour`").toBeGreaterThan(-1);
      expect(note, "le suivi, avec ce retour").toBeGreaterThan(corrige);
      expect(rend, "puis le même retour rendu").toBeGreaterThan(note);
      // Une seule écriture, et aucun autre chemin qui rendrait une correction sans la noter.
      expect(src.match(/noterDansLaClasse\(/g)).toHaveLength(1);
      expect(src.match(/return corriger/g)).toBeNull();
    });
  }

  it("le module qui note n'est pas une action serveur, et avale ses erreurs", () => {
    const src = lire("src/app/cours/suivi-des-activites.ts");
    expect(src).not.toMatch(/^\s*["']use server["']/m);
    expect(src).toMatch(/try \{[\s\S]*enregistrerActivite\(userId, geste\)[\s\S]*\} catch/);
    expect(src).toContain("getGuestUserId()");
  });

  it("la règle du suivi ne lit pas l'état que le navigateur envoie", () => {
    const src = lire("src/pedagogy/cours/suivi-des-activites.ts");
    for (const champ of ["envoi.faites", "envoi.justes", "envoi.essais", "retour.fini"]) expect(src, champ).not.toContain(champ);
    // L'envoi est relu par les lecteurs mêmes de la correction.
    expect(src).toContain("envoiValide(brut)");
    expect(src).toContain("envoiDuScenario(brut)");
  });
});
