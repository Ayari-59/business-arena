import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPITRES } from "@/config/cours/registre";
import { diplomesParNiveau } from "@/config/cours/programme";
import { coursDuDiplome, rechercherChapitres } from "@/config/cours/par-diplome";
import { blocsDuChapitre, coursDeLaFormation, formationsAvecUnePage, tableauDeCouverture } from "@/config/couverture";

/**
 * LA PAGE DU COURS ENTRE PAR LE DIPLÔME (chantier approuvé par le propriétaire, novembre 2026).
 *
 * « Votre formation ? » d'abord, du CAP au DSCG avec les BUT ; la vue d'un diplôme montre ses
 * chapitres dans l'ordre d'apprentissage, groupés par bloc de son référentiel, chacun avec ses
 * objectifs, sa durée, ses prérequis et son cadenas. Le catalogue par thème reste, en lien
 * secondaire, avec une recherche par mot-clé. Le parcours se lit dans les registres existants
 * (couverture, référentiels, prérequis des chapitres) : rien ne s'y écrit à la main.
 */
const PAGE = readFileSync(join(process.cwd(), "src/app/cours/page.tsx"), "utf8");

describe("le cours par diplôme", () => {
  it("les diplômes se proposent du CAP au DSCG, BUT compris, chacun une fois", () => {
    const groupes = diplomesParNiveau();
    const codes = groupes.flatMap((g) => g.formations.map((f) => f.code));
    expect(codes[0]).toBe("cap-epc");
    expect(codes.at(-1)).toBe("dscg");
    expect(codes).toEqual(expect.arrayContaining(["but-gea", "but-tc", "but-gaco"]));
    expect(new Set(codes)).toEqual(new Set(formationsAvecUnePage().map((f) => f.code)));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("chaque diplôme montre tous ses chapitres, une fois, groupés par bloc dans l'ordre du référentiel", () => {
    for (const f of formationsAvecUnePage()) {
      const parcours = coursDuDiplome(f.code)!;
      const attendus = new Set(coursDeLaFormation(f.code).flatMap((g) => g.chapitres.map((c) => c.code)));
      const montres = parcours.blocs.flatMap((b) => b.chapitres.map((c) => c.chapitre.code));
      expect(new Set(montres), f.code).toEqual(attendus);
      expect(montres.length, `${f.code} : un chapitre montré deux fois`).toBe(attendus.size);
      // Les blocs suivent le texte du référentiel ; « autres » ferme la liste.
      const textes = tableauDeCouverture(f.code).lignes.map((l) => l.couverture?.officiel ?? l.bloc);
      const rangs = parcours.blocs.filter((b) => b.bloc !== null).map((b) => textes.indexOf(b.bloc!));
      expect(rangs.every((r) => r >= 0), `${f.code} : un bloc hors du référentiel`).toBe(true);
      expect(rangs, f.code).toEqual([...rangs].sort((a, b) => a - b));
      const autres = parcours.blocs.findIndex((b) => b.bloc === null);
      if (autres >= 0) expect(autres, `${f.code} : les autres chapitres ferment la liste`).toBe(parcours.blocs.length - 1);
      for (const b of parcours.blocs) {
        expect(b.chapitres.length, `${f.code} : bloc vide`).toBeGreaterThan(0);
        for (const c of b.chapitres) {
          if (b.bloc) expect(blocsDuChapitre(c.chapitre, f.code), `${f.code} / ${c.chapitre.code}`).toContain(b.bloc);
        }
      }
    }
  });

  it("l'ordre d'apprentissage respecte les prérequis, et chaque ligne dit sa durée et ses prérequis", () => {
    let prerequisVus = 0;
    for (const f of formationsAvecUnePage()) {
      const parcours = coursDuDiplome(f.code)!;
      const lignes = parcours.blocs.flatMap((b) => b.chapitres);
      const rangs = lignes.map((l) => l.rang).sort((a, b) => a - b);
      expect(rangs, f.code).toEqual(lignes.map((_, i) => i + 1));
      const rangDe = new Map(lignes.map((l) => [l.chapitre.code, l.rang]));
      for (const b of parcours.blocs) {
        expect(b.chapitres.map((c) => c.rang), `${f.code} : un bloc hors de l'ordre`).toEqual(
          [...b.chapitres.map((c) => c.rang)].sort((x, y) => x - y),
        );
      }
      for (const l of lignes) {
        expect(l.duree, l.chapitre.code).toBeGreaterThan(0);
        for (const p of l.chapitre.prerequis ?? []) {
          const r = rangDe.get(p);
          if (r === undefined) continue;
          prerequisVus++;
          expect(r, `${f.code} : ${p} doit précéder ${l.chapitre.code}`).toBeLessThan(l.rang);
        }
        expect(l.prerequis.map((p) => p.code)).toEqual(
          (l.chapitre.prerequis ?? []).filter((p) => CHAPITRES.some((c) => c.code === p)),
        );
      }
    }
    expect(prerequisVus, "aucun prérequis dans un même diplôme : la garde ne garde rien").toBeGreaterThan(5);
    expect(coursDuDiplome("diplome-inconnu")).toBeNull();
  });

  it("la recherche trouve par mot-clé, sans accent ni casse", () => {
    expect(rechercherChapitres("")).toEqual([]);
    expect(rechercherChapitres("   ")).toEqual([]);
    expect(rechercherChapitres("seuil").map((c) => c.code)).toContain("seuil-de-rentabilite");
    const accent = rechercherChapitres("TRESORERIE").map((c) => c.code);
    expect(accent.length).toBeGreaterThan(0);
    expect(accent).toContain("budget-de-tresorerie");
    // Plusieurs mots : tous doivent se trouver.
    for (const c of rechercherChapitres("seuil rentabilité")) {
      expect(`${c.titre} ${c.accroche} ${c.objectifs.join(" ")}`.toLowerCase()).toMatch(/seuil/);
    }
  });

  it("la page entre par « Votre formation ? », garde « Ma classe », le chapitre libre et le catalogue par thème", () => {
    expect(PAGE).toContain("Votre formation ?");
    expect(PAGE).toContain("data-diplome-tuile");
    expect(PAGE).toContain("diplomesParNiveau()");
    expect(PAGE).toContain("coursDuDiplome(");
    expect(PAGE).toContain("data-bloc-du-diplome");
    expect(PAGE).toContain("data-objectifs");
    expect(PAGE).toContain("data-prerequis");
    expect(PAGE).toContain("data-cadenas");
    expect(PAGE).toContain("Parcourir par thème");
    expect(PAGE).toContain('name="q"');
    expect(PAGE).toContain("rechercherChapitres(");
    expect(PAGE).toContain("Ma classe : « {classe.classe} »");
    expect(PAGE).toContain('aria-labelledby="pilote"');
    expect(PAGE).toContain('id="catalogue"');
    // « Votre formation ? » vient avant le catalogue par thème.
    expect(PAGE.indexOf("Votre formation ?")).toBeLessThan(PAGE.indexOf('id="catalogue"'));
  });
});
