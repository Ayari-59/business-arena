import { describe, expect, it } from "vitest";
import { jourDeCreation } from "@/lib/format";

/**
 * LA DATE SUR LA CARTE D'UNE PARTIE.
 *
 * Sur une liste de parties d'une même classe, c'est ce qui les distingue après
 * le nom. Une date complète se lit mal et occupe une ligne que la carte n'a
 * pas : dans la semaine, le jour suffit ; au-delà, le jour et le mois ; passé
 * l'année, l'année s'ajoute.
 */
describe("le jour d'une partie", () => {
  const jeudi = new Date("2026-09-24T10:00:00Z");

  it("dit le jour de la semaine, tant qu'il est récent", () => {
    expect(jourDeCreation(jeudi, new Date("2026-09-26T10:00:00Z"))).toBe("jeudi");
  });

  it("dit le jour et le mois au-delà de la semaine", () => {
    expect(jourDeCreation(new Date("2026-03-12T10:00:00Z"), jeudi)).toBe("12 mars");
  });

  it("ajoute l'année quand la partie est d'une autre année scolaire", () => {
    expect(jourDeCreation(new Date("2025-06-18T10:00:00Z"), jeudi)).toBe("18 juin 2025");
  });

  it("compte en heure de Paris, et non en heure du serveur", () => {
    // Une partie créée à 23 h 30 à Paris est du lendemain en temps universel :
    // affichée à l'heure du serveur, elle datait de la veille pour
    // l'enseignant qui l'a créée.
    const tardParis = new Date("2026-03-11T22:30:00Z"); // 23 h 30 à Paris
    expect(jourDeCreation(tardParis, jeudi)).toBe("11 mars");
  });
});
