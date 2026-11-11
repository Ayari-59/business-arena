import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { parcoursDeLaLicenceClasse, unParcoursParLicenceClasse } from "@/services/chapitres-de-la-classe";

/**
 * L'OFFRE CLASSE OUVRE UN SEUL PARCOURS (décision du propriétaire, 10 novembre 2026 ; audit du même
 * jour, produit P1-2 et code P1-2). La règle pure : le parcours de la première classe de
 * l'enseignant qui tombe dans ses attributions ; sans elle, le seul parcours attribué ; sinon,
 * rien n'est encore fixé. La règle en base : tests/integration/un-parcours-sous-classe.test.ts.
 */
describe("le parcours d'une licence Classe", () => {
  it("sans classe ni attribution, rien n'est fixé : la première classe le choisira", () => {
    expect(parcoursDeLaLicenceClasse(null, [])).toBeNull();
  });

  it("le parcours de la première classe, dans l'ordre de création", () => {
    expect(parcoursDeLaLicenceClasse(null, ["mco", "comptabilite-generale"])).toBe("mco");
  });

  it("une classe héritée sans parcours ne fixe rien", () => {
    expect(parcoursDeLaLicenceClasse(null, [null, "ndrc"])).toBe("ndrc");
    expect(parcoursDeLaLicenceClasse(null, [null])).toBeNull();
  });

  it("l'admin a attribué un seul parcours : c'est lui, même avant toute classe", () => {
    expect(parcoursDeLaLicenceClasse(["mco"], [])).toBe("mco");
    // Une classe d'avant l'attribution, sur un autre parcours, ne l'emporte pas.
    expect(parcoursDeLaLicenceClasse(["mco"], ["comptabilite-generale"])).toBe("mco");
  });

  it("l'admin en a attribué plusieurs : l'un d'eux, celui de la première classe qui y tombe", () => {
    expect(parcoursDeLaLicenceClasse(["mco", "ndrc"], [])).toBeNull();
    expect(parcoursDeLaLicenceClasse(["mco", "ndrc"], ["comptabilite-generale", "ndrc", "mco"])).toBe("ndrc");
  });

  it("la phrase du formulaire dit le parcours fixé, ou que la première classe le fixe", () => {
    const offres = { classe: "Classe", programme: "Programme", campus: "Campus" };
    expect(unParcoursParLicenceClasse(offres, "BTS MCO")).toMatch(/toutes vos classes du cours suivent le même parcours, celui de votre licence : « BTS MCO »/);
    expect(unParcoursParLicenceClasse(offres, null)).toMatch(/celui que vous choisissez pour cette première classe/);
    for (const t of [unParcoursParLicenceClasse(offres, "X"), unParcoursParLicenceClasse(offres, null)]) {
      expect(t).toMatch(/Les offres Programme et Campus ouvrent plusieurs parcours\./);
      expect(t).not.toMatch(/ [-–—] /);
    }
  });
});
