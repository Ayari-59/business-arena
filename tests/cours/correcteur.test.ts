import { describe, expect, it } from "vitest";
import { changerDeSigne, corriger, enSaisie, lireMontant, type EcritureAttendue } from "../../src/pedagogy/cours/correcteur";

/** Un achat à crédit avec TVA : trois rôles, un compte voisin admis pour l'achat. */
const ACHAT: EcritureAttendue = {
  date: "12 janvier",
  libelle: "Facture fournisseur",
  lignes: [
    { role: "l'achat", compte: "601", acceptes: ["602"], sens: "debit", montant: 1000, indice: "le hors taxes" },
    { role: "la TVA déductible", compte: "44566", sens: "debit", montant: 200, indice: "la TVA" },
    { role: "la dette envers le fournisseur", compte: "401", sens: "credit", montant: 1200, indice: "le TTC" },
  ],
};

const ligne = (compte: string, debit = "", credit = "") => ({ compte, debit, credit });

describe("le correcteur d'écritures", () => {
  it("lit les montants à la française", () => {
    expect(lireMontant("1 234,50")).toBe(1234.5);
    expect(lireMontant("1234.5 €")).toBe(1234.5);
    expect(lireMontant("1 000")).toBe(1000);
    expect(lireMontant("")).toBeNull();
    expect(lireMontant("douze")).toBeNaN();
    expect(lireMontant("−80,5")).toBe(-80.5);
  });

  it("change le signe d'un montant saisi, pour le téléphone qui n'a pas de touche moins", () => {
    expect(changerDeSigne("10 202")).toBe("-10 202");
    expect(changerDeSigne("-10 202")).toBe("10 202");
    expect(changerDeSigne("−10 202")).toBe("10 202");
    expect(changerDeSigne("")).toBe("-");
    expect(lireMontant(changerDeSigne(changerDeSigne("1 234,50")))).toBe(1234.5);
    expect(lireMontant(changerDeSigne("1 234,50"))).toBe(-1234.5);
  });

  it("accepte la correction elle-même", () => {
    expect(corriger(enSaisie(ACHAT), ACHAT)).toEqual({ juste: true, remarques: [], notes: [] });
  });

  it("accepte les lignes dans n'importe quel ordre, et une ligne coupée en deux sur le même compte", () => {
    const c = corriger(
      [ligne("401", "", "1200"), ligne("44566", "200"), ligne("601", "600"), ligne("601", "400")],
      ACHAT,
    );
    expect(c.juste).toBe(true);
  });

  it("accepte un compte voisin admis, avec une note qui nomme le plus précis", () => {
    const c = corriger([ligne("602", "1000"), ligne("44566", "200"), ligne("401", "", "1200")], ACHAT);
    expect(c.juste).toBe(true);
    expect(c.notes.join(" ")).toMatch(/601/);
  });

  it("refuse une écriture déséquilibrée, en donnant les deux totaux", () => {
    const c = corriger([ligne("601", "1000"), ligne("44566", "200"), ligne("401", "", "1000")], ACHAT);
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toMatch(/pas équilibrée/);
  });

  it("nomme le rôle passé du mauvais côté, sans donner la réponse", () => {
    const c = corriger([ligne("601", "", "1000"), ligne("44566", "", "200"), ligne("401", "1200")], ACHAT);
    expect(c.juste).toBe(false);
    expect(c.remarques).toContain("L'achat se passe au débit.");
  });

  it("signale un montant faux par son indice", () => {
    const c = corriger([ligne("601", "1200"), ligne("44566", "200"), ligne("401", "", "1400")], ACHAT);
    expect(c.remarques.join(" ")).toMatch(/L'achat : le montant ne convient pas. Pensez au hors taxes/);
  });

  it("reconnaît un compte de la bonne famille qui ne convient pas", () => {
    const c = corriger([ligne("607", "1000"), ligne("44566", "200"), ligne("401", "", "1200")], ACHAT);
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toMatch(/607 .* bonne famille/);
  });

  it("signale ce qui manque et ce qui n'a rien à faire là", () => {
    const c = corriger([ligne("601", "1200"), ligne("512", "", "1200")], ACHAT);
    expect(c.remarques).toContain("Il manque la TVA déductible.");
    expect(c.remarques.join(" ")).toMatch(/512 .* n'a pas sa place/);
  });

  it("refuse les formes impossibles : une seule ligne, un compte inconnu, deux montants sur une ligne", () => {
    expect(corriger([ligne("601", "1000")], ACHAT).remarques[0]).toMatch(/au moins deux lignes/);
    expect(corriger([ligne("999", "1000"), ligne("401", "", "1000")], ACHAT).remarques[0]).toMatch(/999 n'est pas au plan/);
    expect(corriger([ligne("601", "1000", "1000"), ligne("401", "", "1000")], ACHAT).remarques[0]).toMatch(/pas les deux/);
  });
});
