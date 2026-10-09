import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UNE ÉTAPE QUI N'A QU'UN VOLET L'OUVRE (LOT 6D).
 *
 * Sur ordinateur, la feuille de décision est en étapes. Trésorerie, Assurance
 * et « S'informer & prévoir » arrivaient sur un seul volet FERMÉ : un écran
 * presque vide, et un clic pour voir ce qu'on pouvait décider. Ces volets
 * (`Family … repli`) arrivent maintenant ouverts (`deplie`). La commande
 * exceptionnelle, elle, vit sur l'étape « Vendre », à côté du prix et du
 * volume : la raison du repli y vaut toujours, elle reste repliée.
 */
const SOURCE = readFileSync(join(process.cwd(), "src/components/decision-form.tsx"), "utf8");

/** La balise ouvrante `<Family … carte="cle" …>`, attributs compris. */
function familleDeLaCarte(cle: string): string {
  const balises = SOURCE.split("<Family").slice(1);
  const trouvees = balises
    .map((b) => {
      let profondeur = 0;
      for (let i = 0; i < b.length; i++) {
        const c = b[i];
        if (c === "{") profondeur++;
        else if (c === "}") profondeur--;
        else if (c === ">" && profondeur === 0) return b.slice(0, i);
      }
      return b;
    })
    .filter((b) => b.includes(`carte="${cle}"`));
  expect(trouvees, `une seule famille pour la carte « ${cle} »`).toHaveLength(1);
  return trouvees[0]!;
}

describe("les volets d'une étape à eux arrivent ouverts", () => {
  for (const cle of ["dividende", "mobilisation", "assurance", "etudes"]) {
    it(`« ${cle} » est repliable et arrive ouvert`, () => {
      const balise = familleDeLaCarte(cle);
      expect(balise).toMatch(/\brepli\b/);
      expect(balise, `le volet « ${cle} » arrive fermé sur son étape`).toMatch(/\bdeplie\b/);
    });
  }

  it("la commande exceptionnelle, sur l'étape Vendre, reste repliée", () => {
    const balise = familleDeLaCarte("commande");
    expect(balise).toMatch(/\brepli\b/);
    expect(balise).not.toMatch(/\bdeplie\b/);
  });

  it("`deplie` ouvre bien le repli", () => {
    expect(SOURCE).toMatch(/<Repliable\s+ouvert=\{deplie\}/);
  });
});
