import { describe, expect, it } from "vitest";
import { lectureBancaire } from "@/components/lecture-bancaire";

/**
 * Le tableau de bord ne racontait le verdict de la banque que lorsqu'un plan
 * avait été déposé — c'est-à-dire plus jamais. La confiance bouge maintenant
 * avec la tenue de la trésorerie ; l'élève doit lire pourquoi son découvert
 * du tour suivant a changé, et se taire quand rien n'a changé.
 */
const bank = (over: Partial<Parameters<typeof lectureBancaire>[0] & object>) => ({
  trustBefore: 1,
  trustAfter: 1,
  treasuryConduct: 1,
  reliability: null,
  planFiled: false,
  loanRequested: 0,
  loanGranted: 0,
  overdraftLimit: 100000,
  overdraftAnnualRate: 0.12,
  ...over,
});

describe("ce que la banque dit du tour", () => {
  it("se tait quand la confiance n'a pas bougé", () => {
    expect(lectureBancaire(undefined)).toBeNull();
    expect(lectureBancaire(bank({}))).toBeNull();
    // Un frémissement sous le demi-point n'est pas une nouvelle non plus.
    expect(lectureBancaire(bank({ trustBefore: 0.9, trustAfter: 0.903 }))).toBeNull();
  });

  it("nomme la crise, le mouvement et sa conséquence", () => {
    const l = lectureBancaire(bank({ trustAfter: 0.85, treasuryConduct: 0 }))!;
    expect(l.ton).toBe("baisse");
    expect(l.texte).toContain("découvert resté au-delà du plafond");
    expect(l.texte).toContain("de 100 % à 85 %");
    expect(l.texte).toContain("plus bas et plus cher au tour suivant");
  });

  it("distingue la cession d'office de la crise", () => {
    const l = lectureBancaire(bank({ trustAfter: 0.9, treasuryConduct: 0.75 }))!;
    expect(l.texte).toContain("céder vos créances d'office");
    expect(l.texte).not.toContain("plus rien à céder");
  });

  it("salue la remontée", () => {
    const l = lectureBancaire(bank({ trustBefore: 0.7, trustAfter: 0.82 }))!;
    expect(l.ton).toBe("hausse");
    expect(l.texte).toContain("trésorerie tenue");
    expect(l.texte).toContain("plus large et moins cher");
  });

  it("un résultat persisté avant la lecture de la tenue reste lisible", () => {
    // Les tours joués avant n'ont pas de `treasuryConduct` : on dit le
    // mouvement sans inventer sa cause.
    const { treasuryConduct: _absent, ...ancien } = bank({ trustAfter: 0.85 });
    const l = lectureBancaire(ancien)!;
    expect(l.texte).toContain("Votre banque a lu ce tour. Sa confiance passe de 100 % à 85 %");
  });

  it("un plan déposé par une autre voie est cité", () => {
    const l = lectureBancaire(bank({ trustAfter: 0.85, treasuryConduct: 1, reliability: 0.2 }))!;
    expect(l.texte).toContain("plan jugé juste à 20 %");
  });
});
