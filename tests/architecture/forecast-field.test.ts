import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LE PLAN DE TRÉSORERIE NE DÉPEND PAS DU DOSSIER BANCAIRE.
 *
 * Le dossier bancaire est arrivé par un bloc OPTIONNEL du scénario : les
 * parties déjà ouvertes n'en portent pas, et leur vue renvoie donc un
 * `bankFile` nul. Le panneau de saisie avait d'abord été conditionné à ce
 * `bankFile`, ce qui faisait disparaître les deux champs EN COURS DE PARTIE,
 * à des élèves qui les remplissaient depuis le premier tour.
 *
 * La règle : les champs sont ouverts dès que le financement l'est, et c'est le
 * TEXTE qui change selon que la banque lit ce plan ou non. Une garde de source
 * parce que la faute est dans une condition de rendu, que rien d'autre ne voit.
 */

const SOURCE = readFileSync("src/components/decision-form.tsx", "utf-8");

describe("panneau du plan de trésorerie", () => {
  it("les champs ne sont jamais conditionnés au dossier bancaire", () => {
    // La ligne fautive, mot pour mot, et ses variantes d'écriture.
    for (const fautif of [
      "on.finance && bankFile ?",
      "bankFile && on.finance ?",
      "on.finance && bankFile !== null",
    ]) {
      expect(SOURCE, `condition fautive retrouvée : « ${fautif} »`).not.toContain(fautif);
    }
  });

  it("le champ de trésorerie prévue existe, et sous la garde du financement", () => {
    const champ = SOURCE.indexOf('name="expectedCash"');
    expect(champ, "le champ de trésorerie prévue a disparu du formulaire").toBeGreaterThan(-1);

    // La condition qui ouvre le panneau est la dernière ouverte avant le champ.
    const garde = SOURCE.lastIndexOf("{on.finance ? (", champ);
    const gardeBancaire = SOURCE.lastIndexOf("bankFile ? (", champ);
    expect(garde, "le panneau n'est plus gardé par on.finance").toBeGreaterThan(-1);
    expect(
      garde,
      "une condition sur bankFile s'est glissée entre la garde et le champ",
    ).toBeGreaterThan(gardeBancaire);
  });

  it("le panneau dit la vérité dans les deux cas", () => {
    // Sans banque, le plan ne change rien et le texte doit le dire : c'est la
    // phrase qui existait avant, et elle reste juste pour ces parties-là.
    expect(SOURCE).toContain("sans effet sur le tour");
    // Avec banque, il annonce la conséquence.
    expect(SOURCE).toContain("la pièce que lit la banque");
  });
});
