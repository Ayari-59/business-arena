import { describe, expect, it, vi } from "vitest";

// La règle de la classe est une fonction pure ; son module lit l'offre en base, qu'aucun test ici n'appelle.
vi.mock("@/db", () => ({ db: {} }));
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CHAPITRES_DES_PARCOURS_DE_FORMATION, PARCOURS_A_CHOISIR, PARCOURS_DE_FORMATION, chapitresDuParcoursDeFormation, parcoursAChoisir, parcoursQuiOuvrent, titreDuParcours } from "../../src/config/cours/parcours-de-formation";
import { CHAPITRES, PARCOURS } from "../../src/config/cours/registre";
import { casDuChapitre } from "../../src/config/cours/situations";
import { formationParCode } from "../../src/config/formations";
import { chapitreOuvertALaClasse } from "../../src/services/chapitres-de-la-classe";

/**
 * LES PARCOURS DE FORMATION DU BUT (GEA, TC, GACO) : ils regroupent des chapitres existants, lus
 * dans les blocs que les chapitres citent, sans en dupliquer aucun ni toucher au champ `parcours`,
 * et une classe peut les choisir : ils ouvrent leurs chapitres et leurs cas.
 */

const prefixeDe = (formation: string) => formationParCode(formation)!.sigle;

describe("les parcours de formation", () => {
  it("le BUT GEA, le BUT TC et le BUT GACO, chacun de sa formation, sous un code qu'aucun parcours du registre ne porte", () => {
    expect(PARCOURS_DE_FORMATION.map((p) => p.formation)).toEqual(["but-gea", "but-tc", "but-gaco"]);
    for (const p of PARCOURS_DE_FORMATION) expect(PARCOURS.map((x) => x.code as string), p.code).not.toContain(p.code);
    expect(new Set(PARCOURS_A_CHOISIR.map((p) => p.code)).size).toBe(PARCOURS.length + PARCOURS_DE_FORMATION.length);
  });

  it("chaque liste est faite des chapitres qui citent un bloc de la formation, et d'eux seuls", () => {
    for (const p of PARCOURS_DE_FORMATION) {
      const attendus = CHAPITRES.filter((c) => c.blocs.some((b) => b.startsWith(`${prefixeDe(p.formation)} `) && referentielDeCitation(b)?.code === p.formation)).map((c) => c.code);
      expect(CHAPITRES_DES_PARCOURS_DE_FORMATION[p.code], p.code).toEqual(attendus);
      expect(attendus.length, p.code).toBeGreaterThanOrEqual(5);
    }
    // Les cinq chapitres de l'UE10 du DCG citent aussi le BUT GEA.
    expect(CHAPITRES_DES_PARCOURS_DE_FORMATION["but-gea"]).toEqual(expect.arrayContaining(["le-test-de-depreciation", "l-augmentation-de-capital"]));
  });

  it("aucun chapitre n'est dupliqué : chacun garde son seul parcours, et le registre n'a pas grandi", () => {
    const codes = Object.values(CHAPITRES_DES_PARCOURS_DE_FORMATION).flat();
    for (const code of codes) expect(CHAPITRES.filter((c) => c.code === code), code).toHaveLength(1);
    for (const p of PARCOURS_DE_FORMATION) expect(CHAPITRES.some((c) => (c.parcours as string) === p.code), p.code).toBe(false);
    // Un chapitre regroupé par plusieurs formations reste un seul chapitre (la paie : GEA et GACO).
    const paie = CHAPITRES.find((c) => c.code === "la-paie")!;
    expect(parcoursQuiOuvrent(paie)).toEqual(["comptabilite-generale", "but-gea", "but-gaco"]);
  });

  it("les chapitres d'un parcours de formation se rangent par palier", () => {
    const k = chapitresDuParcoursDeFormation("but-gea").map((c) => c.palier);
    expect(k).toEqual([...k].sort((a, b) => a - b));
  });

  it("un cas dédié s'ouvre avec le chapitre qu'il reprend", () => {
    const cas = casDuChapitre("le-test-de-depreciation")!;
    expect(parcoursQuiOuvrent(cas)).toContain("but-gea");
  });

  it("la classe : sous Classe ou Programme, un parcours BUT ouvre ses chapitres et ferme les autres ; sous Campus, tout", () => {
    const gea = { parcours: "but-gea", heritee: false };
    const dedans = CHAPITRES.find((c) => !c.libre && CHAPITRES_DES_PARCOURS_DE_FORMATION["but-gea"]!.includes(c.code))!;
    const dehors = CHAPITRES.find((c) => !c.libre && !parcoursQuiOuvrent(c).includes("but-gea"))!;
    for (const offre of ["classe", "programme"] as const) {
      expect(chapitreOuvertALaClasse(offre, gea, dedans), offre).toBe(true);
      expect(chapitreOuvertALaClasse(offre, gea, dehors), offre).toBe(false);
    }
    expect(chapitreOuvertALaClasse("campus", gea, dehors)).toBe(true);
    expect(chapitreOuvertALaClasse(null, gea, dedans)).toBe(false);
    // Le champ parcours d'origine ouvre toujours ses chapitres.
    expect(chapitreOuvertALaClasse("classe", { parcours: dedans.parcours, heritee: false }, dedans)).toBe(true);
  });

  it("un parcours BUT se choisit, et se nomme sur la page de la classe", () => {
    expect(parcoursAChoisir("but-tc")).toBe(true);
    expect(parcoursAChoisir("mco")).toBe(true);
    expect(parcoursAChoisir("but")).toBe(false);
    expect(titreDuParcours("but-gaco")).toMatch(/^BUT GACO/);
  });
});
