import { describe, expect, it } from "vitest";
import { DEFAULT_SCENARIO_CODE, SCENARIO_CHOICES } from "@/config/scenarios/registry";
import {
  ENTREPRISE_VITRINE_PAR_DEFAUT,
  messageNiveauxReserves,
  niveauMaxPour,
  niveauReserve,
  normaliserVitrine,
  VITRINE_SOLO_PAR_DEFAUT,
  type VitrineSolo,
} from "@/config/vitrine-solo";

/**
 * LA VITRINE DU SOLO PUBLIC : une entreprise complète, les autres jusqu'à un niveau.
 *
 * Éteinte par défaut — tout reste ouvert, comme avant. Allumée, la règle est la même
 * pour l'écran (qui grise et explique) et pour le serveur (qui refuse).
 */

const allumee: VitrineSolo = { active: true, entrepriseOuverte: "nova", niveauMaxAutres: 3 };

describe("éteinte, tout est ouvert", () => {
  it("le défaut est éteint, sur l'entreprise par défaut du registre", () => {
    expect(VITRINE_SOLO_PAR_DEFAUT.active).toBe(false);
    expect(ENTREPRISE_VITRINE_PAR_DEFAUT).toBe(DEFAULT_SCENARIO_CODE);
    expect(SCENARIO_CHOICES.some((s) => s.code === ENTREPRISE_VITRINE_PAR_DEFAUT)).toBe(true);
  });

  it("aucun niveau n'est réservé, pour aucune entreprise", () => {
    for (const s of SCENARIO_CHOICES) {
      for (const n of [1, 2, 3, 4, 5, 6]) expect(niveauReserve(VITRINE_SOLO_PAR_DEFAUT, s.code, n)).toBe(false);
    }
  });
});

describe("allumée, deux étages", () => {
  it("l'entreprise vitrine se joue à tous les niveaux", () => {
    expect(niveauMaxPour(allumee, "nova")).toBe(6);
    expect([1, 2, 3, 4, 5, 6].some((n) => niveauReserve(allumee, "nova", n))).toBe(false);
  });

  it("les autres s'arrêtent au niveau maximum choisi", () => {
    for (const s of SCENARIO_CHOICES.filter((c) => c.code !== "nova")) {
      expect(niveauMaxPour(allumee, s.code), s.code).toBe(3);
      expect([1, 2, 3].some((n) => niveauReserve(allumee, s.code, n)), s.code).toBe(false);
      expect([4, 5, 6].every((n) => niveauReserve(allumee, s.code, n)), s.code).toBe(true);
    }
  });

  it("le maximum se règle", () => {
    expect(niveauMaxPour({ ...allumee, niveauMaxAutres: 1 }, "hotel")).toBe(1);
    expect(niveauReserve({ ...allumee, niveauMaxAutres: 5 }, "hotel", 6)).toBe(true);
    expect(niveauReserve({ ...allumee, niveauMaxAutres: 5 }, "hotel", 5)).toBe(false);
  });

  it("on peut changer d'entreprise vitrine", () => {
    const v = { ...allumee, entrepriseOuverte: "hotel" };
    expect(niveauMaxPour(v, "hotel")).toBe(6);
    expect(niveauMaxPour(v, "nova")).toBe(3);
  });
});

describe("ce qui est enregistré", () => {
  it("une colonne de JSON libre retombe sur le défaut, champ par champ", () => {
    expect(normaliserVitrine(undefined)).toEqual(VITRINE_SOLO_PAR_DEFAUT);
    expect(normaliserVitrine({ active: "oui" })).toEqual(VITRINE_SOLO_PAR_DEFAUT);
    expect(normaliserVitrine({ active: true, niveauMaxAutres: 99 }).niveauMaxAutres).toBe(3);
    expect(normaliserVitrine({ active: true, niveauMaxAutres: 0 }).niveauMaxAutres).toBe(3);
    expect(normaliserVitrine({ active: true, niveauMaxAutres: "2" }).niveauMaxAutres).toBe(2);
    expect(normaliserVitrine({ active: true, entrepriseOuverte: "  " }).entrepriseOuverte).toBe("nova");
    expect(normaliserVitrine({ active: true, entrepriseOuverte: " hotel " }).entrepriseOuverte).toBe("hotel");
  });

  it("une valeur déjà normalisée ne change pas", () => {
    expect(normaliserVitrine(allumee)).toEqual(allumee);
  });
});

describe("le message", () => {
  it("dit quels niveaux sont réservés", () => {
    expect(messageNiveauxReserves(allumee)).toBe("Les niveaux 4 à 6 sont réservés aux établissements.");
    expect(messageNiveauxReserves({ ...allumee, niveauMaxAutres: 5 })).toBe("Le niveau 6 est réservé aux établissements.");
  });
});
