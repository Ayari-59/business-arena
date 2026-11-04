import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MATIERES_COUVERTES_EN_ENTIER } from "@/config/cours/matieres-en-entier";
import { coursDuDiplome } from "@/config/cours/par-diplome";
import { formationsAvecUnePage } from "@/config/couverture";

/**
 * LE REPÈRE « EN COURS » (chantier approuvé par le propriétaire, novembre 2026) : sur la page du
 * cours d'un diplôme, une matière que le cours ne couvre pas encore en entier le dit.
 */
const PAGE = readFileSync(join(process.cwd(), "src/app/cours/page.tsx"), "utf8");

describe("les matières couvertes en entier et le repère « en cours »", () => {
  it("chaque matière déclarée complète désigne un bloc affiché, une seule fois", () => {
    const vues = new Set<string>();
    for (const m of MATIERES_COUVERTES_EN_ENTIER) {
      const cle = `${m.formation} / ${m.bloc} / ${m.partie ?? ""}`;
      expect(vues.has(cle), `${cle} déclarée deux fois`).toBe(false);
      vues.add(cle);
      const blocs = coursDuDiplome(m.formation)?.blocs ?? [];
      const bloc = blocs.find((b) => b.bloc === m.bloc && b.partie === m.partie);
      expect(bloc, `${cle} : aucun bloc de ce nom sur la page du diplôme`).toBeDefined();
      expect(bloc!.enCours, cle).toBe(false);
      expect(m.preuve.length, `${cle} : la preuve manque`).toBeGreaterThan(0);
    }
  });

  it("tout autre bloc du référentiel est « en cours » ; les autres chapitres ne portent pas de repère", () => {
    let enCours = 0;
    let complets = 0;
    for (const f of formationsAvecUnePage()) {
      for (const b of coursDuDiplome(f.code)!.blocs) {
        if (b.bloc === null) {
          expect(b.enCours, `${f.code} : autres chapitres`).toBe(false);
          continue;
        }
        const declaree = MATIERES_COUVERTES_EN_ENTIER.some(
          (m) => m.formation === f.code && m.bloc === b.bloc && m.partie === b.partie,
        );
        expect(b.enCours, `${f.code} / ${b.bloc}`).toBe(!declaree);
        if (b.enCours) enCours++;
        else complets++;
      }
    }
    expect(complets).toBe(MATIERES_COUVERTES_EN_ENTIER.length);
    expect(enCours).toBeGreaterThan(0);
  });

  it("le même thème d'un autre programme du bac STMG reste « en cours »", () => {
    const stmg = coursDuDiplome("stmg")!.blocs;
    const gf = stmg.filter((b) => b.partie === "Terminale, gestion et finance");
    expect(gf.length).toBe(3);
    expect(gf.every((b) => !b.enCours)).toBe(true);
    const mercatique = stmg.filter((b) => b.partie === "Terminale, mercatique");
    expect(mercatique.length).toBeGreaterThan(0);
    expect(mercatique.every((b) => b.enCours)).toBe(true);
  });

  it("la page affiche le repère et sa phrase sur les blocs en cours", () => {
    expect(PAGE).toMatch(/\{b\.enCours \? \(\s*<span\s+data-en-cours=""/);
    expect(PAGE).toContain("en cours");
    expect(PAGE).toContain("Cette matière n&apos;est pas encore couverte en entier. D&apos;autres chapitres arriveront.");
  });
});
