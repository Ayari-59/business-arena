import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIFFICULTY_PRESETS, REPARTITION_AVANT_2026_10_11, type DifficultyPreset } from "@/config/difficulty";
import {
  INVESTISSEMENT_PLAFONNE,
  LIBELLES_DES_LEVIERS,
  comparatifDesNiveaux,
  groupesDansLOrdre,
  phraseDesOuvertures,
  tableauDuNiveau,
} from "@/config/tableau-des-niveaux";

/**
 * LE TABLEAU DES NIVEAUX DE /jouer SE LIT DANS LES PRÉRÉGLAGES.
 *
 * « Il faut être plus clair sur les niveaux » : sous le curseur, ce que le niveau
 * confie, ce qu'il garde, ce que le suivant ouvre. Une liste écrite à la main
 * divergerait au premier préréglage retouché ; ces gardes vérifient que tout
 * vient de `difficulty.ts`.
 */

describe("le tableau du niveau choisi", () => {
  it("niveau 1 : le prix, la production et le marketing ; tout le reste géré pour vous", () => {
    const t = tableauDuNiveau(1)!;
    expect(t.decidez).toContain("Le prix, la production et le marketing");
    expect(t.decidez).not.toContain(LIBELLES_DES_LEVIERS.finance.decidez);
    expect(t.gere).toContain(LIBELLES_DES_LEVIERS.finance.gere);
    expect(t.gere).toContain(LIBELLES_DES_LEVIERS.hr.gere);
    expect(t.gere).toContain(LIBELLES_DES_LEVIERS.quality.gere);
    expect(t.suivant).toContain(LIBELLES_DES_LEVIERS.quality.decidez);
  });

  it("niveau 3 → 4 : l'équipe au 3 ; l'emprunt, l'investissement et l'assurance au 4", () => {
    const t3 = tableauDuNiveau(3)!;
    expect(t3.decidez).toContain(LIBELLES_DES_LEVIERS.hr.decidez);
    expect(t3.decidez).toContain(LIBELLES_DES_LEVIERS.creances.decidez);
    expect(t3.suivant).toEqual(
      expect.arrayContaining([
        LIBELLES_DES_LEVIERS.finance.decidez,
        LIBELLES_DES_LEVIERS.investment.decidez,
        LIBELLES_DES_LEVIERS.insurance.decidez,
      ]),
    );
    const t4 = tableauDuNiveau(4)!;
    expect(t4.decidez).toContain(LIBELLES_DES_LEVIERS.investment.decidez);
    expect(t4.decidez).not.toContain(INVESTISSEMENT_PLAFONNE);
  });

  it("un niveau qui ouvrirait l'investissement sans les embauches le dit plafonné", () => {
    // Aucun préréglage actuel ; c'était la répartition d'avant octobre 2026.
    const avant: DifficultyPreset[] = DIFFICULTY_PRESETS.map((p) => ({
      ...p,
      decisions: REPARTITION_AVANT_2026_10_11[p.level],
    }));
    expect(tableauDuNiveau(1, avant)!.decidez).toContain(INVESTISSEMENT_PLAFONNE);
    expect(tableauDuNiveau(3, avant)!.suivant.some((x) => /investissement/i.test(x))).toBe(true);
    expect(comparatifDesNiveaux(avant).lignes.find((l) => l.groupe === "investment")!.cases.slice(0, 4)).toEqual([
      "plafonne",
      "plafonne",
      "plafonne",
      "oui",
    ]);
  });

  it("chaque drapeau de chaque niveau tombe dans un bloc, et un seul", () => {
    for (const p of DIFFICULTY_PRESETS) {
      const t = tableauDuNiveau(p.level)!;
      for (const [cle, ouvert] of Object.entries(p.decisions) as [keyof DifficultyPreset["decisions"], boolean][]) {
        const l = LIBELLES_DES_LEVIERS[cle];
        const decide = t.decidez.includes(l.decidez) || (cle === "investment" && t.decidez.includes(INVESTISSEMENT_PLAFONNE));
        expect(decide, `niveau ${p.level}, ${cle}`).toBe(ouvert);
        expect(t.gere.includes(l.gere), `niveau ${p.level}, ${cle}`).toBe(!ouvert);
      }
      expect(t.reperes).toContain(p.hintMaxLevel === 0 ? "Aucun indice" : `Jusqu'à ${p.hintMaxLevel} indice`);
    }
    expect(tableauDuNiveau(6)!.suivant).toEqual([]);
  });

  it("un levier ajouté à un niveau y paraît, sans rien écrire d'autre", () => {
    const retouches: DifficultyPreset[] = DIFFICULTY_PRESETS.map((p) =>
      p.level === 2 ? { ...p, decisions: { ...p.decisions, insurance: true } } : p,
    );
    expect(tableauDuNiveau(2)!.decidez).not.toContain(LIBELLES_DES_LEVIERS.insurance.decidez);
    expect(tableauDuNiveau(2, retouches)!.decidez).toContain(LIBELLES_DES_LEVIERS.insurance.decidez);
    expect(tableauDuNiveau(1, retouches)!.suivant).toContain(LIBELLES_DES_LEVIERS.insurance.decidez);
    // Et l'investissement ouvert au niveau 3, avec ses embauches, n'y est pas plafonné.
    const inv3 = DIFFICULTY_PRESETS.map((p) => (p.level === 3 ? { ...p, decisions: { ...p.decisions, investment: true } } : p));
    expect(tableauDuNiveau(3, inv3)!.decidez).toContain(LIBELLES_DES_LEVIERS.investment.decidez);
    expect(comparatifDesNiveaux(inv3).lignes.find((l) => l.groupe === "investment")!.cases[2]).toBe("oui");
  });

  it("le comparatif : une ligne par levier, une colonne par niveau", () => {
    const c = comparatifDesNiveaux();
    expect(c.niveaux.map((n) => n.level)).toEqual(DIFFICULTY_PRESETS.map((p) => p.level));
    expect(c.lignes.map((l) => l.groupe)).toEqual(groupesDansLOrdre());
    expect(c.lignes.find((l) => l.groupe === "investment")!.cases).toEqual(
      DIFFICULTY_PRESETS.map((p) => (!p.decisions.investment ? "non" : p.decisions.hr ? "oui" : "plafonne")),
    );
    expect(c.indices).toEqual(DIFFICULTY_PRESETS.map((p) => p.hintMaxLevel));
  });

  it("les accroches ne promettent plus un investissement sans limite là où il est plafonné", () => {
    for (const p of DIFFICULTY_PRESETS) {
      if (p.decisions.investment && !p.decisions.hr && /investissement/i.test(p.tagline)) {
        expect(p.tagline, `niveau ${p.level}`).toMatch(/à hauteur de votre équipe/);
      }
    }
  });

  it("/jouer passe le tableau et le comparatif au formulaire, sans liste à la main", () => {
    const page = readFileSync("src/app/jouer/page.tsx", "utf-8");
    expect(page).toContain("tableauDuNiveau(p.level)");
    expect(page).toContain("comparatifDesNiveaux()");
    const form = readFileSync("src/components/quick-config-form.tsx", "utf-8");
    expect(form).toContain("data-tableau-du-niveau");
    expect(form).not.toMatch(/Vous décidez[\s\S]{0,200}"Le prix/);
  });

  it("la phrase du guide dit où chaque levier s'ouvre, lue dans les préréglages", () => {
    const phrase = phraseDesOuvertures();
    for (const p of DIFFICULTY_PRESETS) expect(phrase).toContain(`au niveau ${p.name}`);
    expect(phrase).toMatch(/l'investissement et l'assurance au niveau Arbitrage/);
    expect(phrase.indexOf("les ressources humaines")).toBeLessThan(phrase.indexOf("l'investissement"));
    expect(readFileSync("src/app/guide/page.tsx", "utf-8")).toContain("phraseDesOuvertures()");
  });
});
