import { describe, expect, it } from "vitest";
import { LIASSES, COURRIERS, positionDuCourrier, referenceDuCourrier } from "@/config/courriers/registre";
import { MENTION_DU_PLI, NATURES, dureeDuCourrier } from "@/config/courriers/types";
import { COURRIERS_DE_ROUTINE, courrierDeRoutine, estUnCourrierDeRoutine } from "@/config/courriers/routine";

/**
 * Ce qui fait d'un encart un vrai courrier : un cachet par nature, une
 * référence dans sa liasse, une mention de pli, une durée qui se dessine en
 * pastilles.
 */
describe("l'habillage du courrier", () => {
  it("chaque nature a son cachet, et quatre cachets distincts", () => {
    const mentions = Object.values(NATURES).map((n) => n.mention);
    expect(mentions).toHaveLength(4);
    expect(new Set(mentions).size).toBe(4);
    for (const n of Object.values(NATURES)) {
      expect(n.label.length).toBeGreaterThan(3);
      expect(n.accent).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("les deux plis se distinguent par leur mention", () => {
    expect(MENTION_DU_PLI.recommande).toMatch(/recommandée/i);
    expect(MENTION_DU_PLI.simple).not.toMatch(/recommandée/i);
  });

  it("chaque courrier a sa place dans une liasse nommée, et une seule", () => {
    for (const courrier of COURRIERS) {
      const p = positionDuCourrier(courrier.code);
      expect(p, courrier.code).not.toBeNull();
      expect(p!.index).toBeGreaterThanOrEqual(1);
      expect(p!.index).toBeLessThanOrEqual(p!.total);
      expect(p!.liasse.length).toBeGreaterThan(2);
    }
    // les liasses se partagent tout le registre, sans doublon ni oubli
    const total = LIASSES.reduce((t, l) => t + l.courriers.length, 0);
    expect(total).toBe(COURRIERS.length);
    expect(positionDuCourrier("courrier_inconnu")).toBeNull();
  });

  it("la référence se lit en tête de lettre : liasse, numéro, total", () => {
    const nova = LIASSES.find((l) => l.nom === "NOVA")!;
    expect(positionDuCourrier(nova.courriers[0]!.code)).toEqual({
      liasse: "NOVA",
      index: 1,
      total: nova.courriers.length,
    });
    expect(referenceDuCourrier(nova.courriers[0]!.code)).toBe(`NOVA-01/${nova.courriers.length}`);
    expect(positionDuCourrier(nova.courriers.at(-1)!.code)!.index).toBe(nova.courriers.length);
    expect(referenceDuCourrier("courrier_inconnu")).toBeNull();
  });

  it("la durée se lit dans l'effet : une pastille par tour", () => {
    expect(dureeDuCourrier({ effet: "Demande globale −10 % pendant 2 tours" })).toBe(2);
    expect(dureeDuCourrier({ effet: "Disponibilité machine −15 % ce tour" })).toBe(1);
    expect(dureeDuCourrier({ effet: "Charges d'intérêts ×1,5 pendant 3 tours" })).toBe(3);
  });
});

/**
 * UNE ENVELOPPE N'EST JAMAIS VIDE. Les courriers de routine ne sont jamais
 * distribués par le moteur ni par l'enseignant : ils remplissent l'enveloppe
 * des trimestres calmes, sans toucher aux comptes.
 */
describe("les courriers de routine", () => {
  it("ils sont hors du registre : jamais tirés, jamais appliqués", () => {
    for (const c of COURRIERS_DE_ROUTINE) {
      expect(estUnCourrierDeRoutine(c.code), c.code).toBe(true);
      expect(COURRIERS.some((r) => r.code === c.code), c.code).toBe(false);
      expect(positionDuCourrier(c.code)).toBeNull();
    }
    for (const c of COURRIERS) expect(estUnCourrierDeRoutine(c.code)).toBe(false);
  });

  it("aucun n'a d'effet sur le trimestre, et tous disent une obligation réelle", () => {
    expect(COURRIERS_DE_ROUTINE.length).toBeGreaterThanOrEqual(4);
    for (const c of COURRIERS_DE_ROUTINE) {
      expect(c.effet, c.code).toBe("Aucun effet sur ce trimestre");
      expect(c.expediteur.length, c.code).toBeGreaterThan(5);
      expect(c.corps.length, c.code).toBeGreaterThan(60);
      expect(c.enJeu.length, c.code).toBeGreaterThan(30);
    }
  });

  it("le choix est déterministe sur la partie et le tour, et il tourne", () => {
    expect(courrierDeRoutine("g1", 3)).toBe(courrierDeRoutine("g1", 3));
    const suite = [1, 2, 3, 4, 5, 6].map((t) => courrierDeRoutine("g1", t).code);
    expect(new Set(suite).size).toBe(COURRIERS_DE_ROUTINE.length);
    // deux parties ne reçoivent pas la même suite
    expect(courrierDeRoutine("g1", 3).code === courrierDeRoutine("g2", 3).code).toBe(false);
  });
});
