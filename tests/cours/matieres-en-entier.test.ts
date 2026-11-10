import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MATIERES_COUVERTES_EN_ENTIER } from "@/config/cours/matieres-en-entier";
import { coursDuDiplome } from "@/config/cours/par-diplome";
import { formationsAvecUnePage, tableauDeCouverture } from "@/config/couverture";
import { REFERENTIELS_DES_FORMATIONS } from "@/config/ateliers/referentiels";

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
    // lots C et D STMG : la partie commune et la mercatique sont couvertes en entier ; les ressources humaines, pas encore.
    const rh = stmg.filter((b) => b.partie === "Terminale, ressources humaines et communication");
    expect(rh.length).toBeGreaterThan(0);
    expect(rh.every((b) => b.enCours)).toBe(true);
  });

  it("tous les thèmes officiels du bac STMG sont sur la page, vides compris, et un thème vide est « en cours »", () => {
    const officiels = REFERENTIELS_DES_FORMATIONS.stmg!.entrees;
    expect(officiels.length).toBe(23);
    const blocs = coursDuDiplome("stmg")!.blocs.filter((b) => b.bloc !== null);
    expect(blocs.map((b) => b.bloc)).toEqual([...officiels]);
    const rh = blocs.filter((b) => b.partie === "Terminale, ressources humaines et communication");
    expect(rh.length).toBe(3);
    expect(blocs.some((b) => b.partie === "Terminale, systèmes d'information de gestion" && b.bloc === "Thème 4 · Système d'information et échange")).toBe(true);
    for (const b of blocs) if (b.chapitres.length === 0) expect(b.enCours, b.bloc!).toBe(true);
  });

  it("chaque diplôme montre toutes les entrées de son référentiel, sauf celles hors du champ restées sans chapitre", () => {
    for (const f of formationsAvecUnePage()) {
      const attendues = tableauDeCouverture(f.code)
        .lignes.filter((l) => !l.horsDuChamp)
        .map((l) => `${l.couverture?.officiel ?? l.bloc}|${l.partie ?? ""}`);
      const montrees = new Set(coursDuDiplome(f.code)!.blocs.filter((b) => b.bloc !== null).map((b) => `${b.bloc}|${b.partie ?? ""}`));
      for (const e of attendues) expect(montrees.has(e), `${f.code} : ${e}`).toBe(true);
    }
  });

  it("la page affiche le repère et sa phrase sur les blocs en cours", () => {
    expect(PAGE).toMatch(/\{b\.enCours \? \(\s*<span\s+data-en-cours=""/);
    expect(PAGE).toContain("en cours");
    expect(PAGE).toContain("Cette matière n&apos;est pas encore couverte en entier. D&apos;autres chapitres arriveront.");
    expect(PAGE).toContain("Chapitres en préparation.");
  });
});
