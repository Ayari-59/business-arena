import { describe, expect, it } from "vitest";
import {
  LONGUEUR_MINIMALE,
  couverture,
  estUneReponse,
  optionLaPlusProche,
  optionsReconnues,
  racinesDe,
} from "../../src/pedagogy/reponse-ouverte";
import { evaluateDiagnosis } from "../../src/pedagogy/evaluation";

/**
 * UNE RÉPONSE OUVERTE SE NOTE COMME UN QCM, PAR LES MOTS QU'ELLE EMPLOIE.
 *
 * Le texte est ramené aux options de la situation, puis le barème d'avant s'applique. Ces
 * tests tiennent la correspondance — ce qu'elle reconnaît, ce qu'elle refuse de deviner —
 * et rappellent que c'est une première note, pas un verdict.
 */

const DIAGNOSTIC = [
  { id: "a", label: "Vendre assez d'unités pour couvrir les charges de structure", correct: true },
  { id: "b", label: "Que chaque unité vendue rapporte plus que son coût variable", correct: true },
  { id: "c", label: "Produire au maximum de la capacité, quoi qu'il arrive", correct: false },
  { id: "d", label: "Avoir le prix le plus bas du marché", correct: false },
];

const MODELES = [
  { id: "seuil", label: "Seuil de rentabilité" },
  { id: "marginale", label: "Analyse marginale" },
  { id: "psycho", label: "Prix psychologique" },
  { id: "van", label: "VAN (valeur actuelle nette)" },
];

describe("les racines d'un texte", () => {
  it("ignorent la casse, les accents, la ponctuation et les mots vides", () => {
    expect([...racinesDe("La Rentabilité, c'est le seuil !")].sort()).toEqual(["renta", "seuil"].sort());
  });

  it("rapprochent le singulier et le pluriel, et les mots de même famille", () => {
    expect(racinesDe("des marges").has(racinesDe("la marge").values().next().value as string)).toBe(true);
    expect(racinesDe("rentable").has("renta")).toBe(true);
    expect(racinesDe("rentabilité").has("renta")).toBe(true);
  });
});

describe("la couverture d'une option", () => {
  it("vaut 1 quand le texte reprend tout, 0 quand il n'en reprend rien", () => {
    expect(couverture("seuil de rentabilité", "Seuil de rentabilité")).toBe(1);
    expect(couverture("je regarde la météo", "Seuil de rentabilité")).toBe(0);
  });

  it("une option sans mot qui compte ne se reconnaît jamais", () => {
    expect(couverture("peu importe", "de la et")).toBe(0);
  });
});

describe("le diagnostic ouvert", () => {
  it("reconnaît les options dites avec d'autres mots du même vocabulaire", () => {
    const texte =
      "Le problème, c'est qu'il faut vendre assez d'unités pour couvrir les charges de structure, et que chaque unité rapporte plus que son coût variable.";
    expect(optionsReconnues(texte, DIAGNOSTIC).sort()).toEqual(["a", "b"]);
  });

  it("se note ensuite comme les cases cochées : juste, il vaut 1", () => {
    const texte = "Couvrir les charges de structure en vendant assez d'unités, avec une unité qui rapporte plus que son coût variable.";
    expect(evaluateDiagnosis(optionsReconnues(texte, DIAGNOSTIC), DIAGNOSTIC)).toBe(1);
  });

  it("un texte qui dit une option fausse perd en précision, comme au QCM", () => {
    const texte =
      "Vendre assez d'unités pour couvrir les charges de structure, et surtout avoir le prix le plus bas du marché.";
    const note = evaluateDiagnosis(optionsReconnues(texte, DIAGNOSTIC), DIAGNOSTIC);
    expect(note).toBeGreaterThan(0);
    expect(note).toBeLessThan(1);
  });

  it("un texte hors sujet ne reconnaît rien, donc vaut 0", () => {
    expect(optionsReconnues("Je pense qu'il faudrait changer de logo et de couleur.", DIAGNOSTIC)).toEqual([]);
  });
});

describe("le modèle d'analyse ouvert", () => {
  it("retient le modèle nommé, même au milieu d'une phrase", () => {
    expect(optionLaPlusProche("Je mobilise le seuil de rentabilité pour savoir combien vendre.", MODELES)).toBe(
      "seuil",
    );
    expect(optionLaPlusProche("Une analyse marginale, parce que chaque unité compte.", MODELES)).toBe("marginale");
  });

  it("ne devine pas : deux modèles également cités, rien n'est retenu", () => {
    expect(optionLaPlusProche("Seuil de rentabilité ou analyse marginale, je ne sais pas.", MODELES)).toBeUndefined();
  });

  it("ne retient rien sous le seuil", () => {
    expect(optionLaPlusProche("Je regarde les chiffres.", MODELES)).toBeUndefined();
  });
});

describe("ce qui compte comme une réponse", () => {
  it("un mot ou deux ne sont pas une réponse", () => {
    expect(estUneReponse("oui")).toBe(false);
    expect(estUneReponse("   ".padEnd(LONGUEUR_MINIMALE, " "))).toBe(false);
    expect(estUneReponse("Je mobilise le seuil de rentabilité.")).toBe(true);
  });
});
